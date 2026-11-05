#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: deploy_backend.sh <40-character-commit-sha> <run-id-attempt>" >&2
  exit 2
fi

COMMIT_SHA="$1"
DEPLOY_ID="$2"
if [[ ! "$COMMIT_SHA" =~ ^[0-9a-f]{40}$ || ! "$DEPLOY_ID" =~ ^[0-9]+-[0-9]+$ ]]; then
  echo "Invalid deployment identifier" >&2
  exit 2
fi

APP_ROOT="/home/ubuntu/teablendai"
DEPLOY_ROOT="$APP_ROOT/cicd-deployments"
RELEASE_DIR="$DEPLOY_ROOT/$COMMIT_SHA-$DEPLOY_ID"
SOURCE_ARCHIVE="$RELEASE_DIR/backend-source.tar.gz"
CONTAINER="teablendai-backend"
IMAGE="teablendai-backend:dev-$COMMIT_SHA"
ROLLBACK="teablendai-backend-rollback-$DEPLOY_ID"
FAILED="teablendai-backend-failed-$DEPLOY_ID"
ENV_FILE="$APP_ROOT/.env.backend"

if [[ ! -d "$RELEASE_DIR" || ! -f "$SOURCE_ARCHIVE" || ! -f "$RELEASE_DIR/deploy_backend.sh" ]]; then
  echo "Deployment files are missing from $RELEASE_DIR" >&2
  exit 1
fi
if [[ ! -r "$ENV_FILE" ]]; then
  echo "Runtime env file is not readable: $ENV_FILE" >&2
  exit 1
fi

sudo docker inspect "$CONTAINER" >/dev/null
if sudo docker inspect "$ROLLBACK" >/dev/null 2>&1 || sudo docker inspect "$FAILED" >/dev/null 2>&1; then
  echo "A container already exists for deployment $DEPLOY_ID" >&2
  exit 1
fi

mkdir -p "$RELEASE_DIR/context"
tar -xzf "$SOURCE_ARCHIVE" -C "$RELEASE_DIR/context"
if [[ ! -f "$RELEASE_DIR/context/backend/Dockerfile" ]]; then
  echo "Backend Dockerfile is missing from the source archive" >&2
  exit 1
fi

# Build first; a failed image build leaves the existing service online.
sudo docker build --pull \
  --label "org.opencontainers.image.revision=$COMMIT_SHA" \
  --tag "$IMAGE" \
  --file "$RELEASE_DIR/context/backend/Dockerfile" \
  "$RELEASE_DIR/context/backend"

NETWORK_MODE="$(sudo docker inspect --format '{{.HostConfig.NetworkMode}}' "$CONTAINER")"
RESTART_POLICY="$(sudo docker inspect --format '{{.HostConfig.RestartPolicy.Name}}' "$CONTAINER")"
WORKDIR="$(sudo docker inspect --format '{{.Config.WorkingDir}}' "$CONTAINER")"
ENTRYPOINT="$(sudo docker inspect --format '{{json .Config.Entrypoint}}' "$CONTAINER")"
PORT_BINDING="$(sudo docker inspect --format '{{json (index .HostConfig.PortBindings "8000/tcp")}}' "$CONTAINER")"
if [[ "$NETWORK_MODE" != "bridge" || "$RESTART_POLICY" != "unless-stopped" || "$WORKDIR" != "/app" ]]; then
  echo "The running backend Docker configuration changed; refusing deployment" >&2
  exit 1
fi
if [[ "$ENTRYPOINT" != "null" || "$PORT_BINDING" != '[{"HostIp":"127.0.0.1","HostPort":"8000"}]' ]]; then
  echo "The running backend entrypoint or port mapping changed; refusing deployment" >&2
  exit 1
fi

mapfile -t APP_CMD < <(
  sudo docker inspect --format '{{range .Config.Cmd}}{{println .}}{{end}}' "$CONTAINER" \
    | sed '/^$/d'
)
mapfile -t MOUNTS < <(
  sudo docker inspect --format '{{range .Mounts}}{{if eq .Type "volume"}}{{printf "%s|%s|%t\n" .Name .Destination .RW}}{{end}}{{end}}' "$CONTAINER" \
    | sed '/^$/d'
)
if [[ ${#APP_CMD[@]} -eq 0 || ${#MOUNTS[@]} -ne 2 ]]; then
  echo "Unexpected backend command or persistent volume configuration (command entries: ${#APP_CMD[@]}, volume mounts: ${#MOUNTS[@]})" >&2
  exit 1
fi

printf '%s\n' "${MOUNTS[@]}" | sort > "$RELEASE_DIR/mounts.actual"
printf '%s\n' \
  'teablendai_uploads|/app/uploads|true' \
  'teablendai_warehouse|/app/data_warehouse|true' \
  | sort > "$RELEASE_DIR/mounts.expected"
if ! cmp -s "$RELEASE_DIR/mounts.expected" "$RELEASE_DIR/mounts.actual"; then
  echo "The running backend persistent volumes changed; refusing deployment" >&2
  exit 1
fi

MOUNT_ARGS=()
for mount in "${MOUNTS[@]}"; do
  IFS='|' read -r volume destination writable <<< "$mount"
  if [[ "$writable" == "true" ]]; then
    MOUNT_ARGS+=(--volume "$volume:$destination")
  else
    MOUNT_ARGS+=(--volume "$volume:$destination:ro")
  fi
done

rollback_deployment() {
  echo "New backend failed health verification; restoring the previous container" >&2
  if sudo docker inspect "$CONTAINER" >/dev/null 2>&1; then
    sudo docker stop --time 10 "$CONTAINER" >/dev/null 2>&1 || true
    sudo docker rename "$CONTAINER" "$FAILED" >/dev/null 2>&1 || true
  fi
  sudo docker rename "$ROLLBACK" "$CONTAINER"
  sudo docker start "$CONTAINER"
}

sudo docker stop --time 30 "$CONTAINER"
sudo docker rename "$CONTAINER" "$ROLLBACK"

if ! sudo docker run --detach \
  --name "$CONTAINER" \
  --restart unless-stopped \
  --network bridge \
  --env-file "$ENV_FILE" \
  --publish 127.0.0.1:8000:8000 \
  --workdir "$WORKDIR" \
  "${MOUNT_ARGS[@]}" \
  "$IMAGE" \
  "${APP_CMD[@]}"; then
  rollback_deployment
  exit 1
fi

HEALTHY=0
for _ in $(seq 1 75); do
  if curl --noproxy '*' --fail --silent --max-time 3 \
    http://127.0.0.1:8000/api/v1/health >/dev/null 2>&1; then
    HEALTHY=1
    break
  fi
  sleep 2
done

if [[ "$HEALTHY" != "1" ]]; then
  rollback_deployment
  exit 1
fi

if ! sudo docker tag "$IMAGE" teablendai-backend:rds; then
  rollback_deployment
  exit 1
fi

echo "Backend deployment healthy: image=$IMAGE rollback_container=$ROLLBACK"

# Remove only this workflow run's uploaded source and extracted build context.
case "$RELEASE_DIR" in
  "$DEPLOY_ROOT"/*) rm -rf -- "$RELEASE_DIR" ;;
  *) echo "Refusing to remove unexpected release path: $RELEASE_DIR" >&2; exit 1 ;;
esac
