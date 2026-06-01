export function createWsClient(endpoint: string, token: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_API_WS_URL || "ws://localhost:8000/api/v1").replace(/\/$/, "");
  const formattedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const wsUrl = `${baseUrl}${formattedEndpoint}?token=${encodeURIComponent(token)}`;
  return new WebSocket(wsUrl);
}