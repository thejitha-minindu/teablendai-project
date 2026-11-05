# Backend CI/CD to EC2

`.github/workflows/backend-ec2.yml` runs the backend test suite on pull requests
to `dev` and on every push to `dev`. Successful pushes to `dev` deploy the
backend Docker image to the existing EC2 host. `workflow_dispatch` can redeploy
the selected `dev` commit.

## One-time GitHub setup

Add the EC2 private key as a repository Actions secret:

1. Open **Settings → Secrets and variables → Actions** in
   `thejitha-minindu/teablendai-project`.
2. Create the secret `EC2_SSH_PRIVATE_KEY` with the complete contents of
   `teablendai-key.pem`.

Do not commit the PEM key or paste it into workflow files. The workflow pins
the current EC2 host key and connects as `ubuntu` to
`teablendai-api.duckdns.org`.

## Docker deployment behavior

The EC2 deployment builds the checked-out backend source on the host, then
recreates `teablendai-backend` with the existing
`/home/ubuntu/teablendai/.env.backend` file, bridge network,
`127.0.0.1:8000:8000` binding, one-worker Uvicorn command, and the existing
`teablendai_uploads` and `teablendai_warehouse` volumes. It checks
`/api/v1/health` before marking the image as `teablendai-backend:rds`. The
preceding container is kept stopped as a rollback copy. If the new container
fails its health check, the script restores the previous container.

The workflow sends a source archive and deploy script over SSH; it never sends
the backend `.env` file. The Docker build context also excludes `.env*`, local
databases, upload files, warehouse data, and virtual environments.
