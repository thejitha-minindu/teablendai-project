export function createWsClient(endpoint: string, token: string) {
  const wsUrl = `${process.env.NEXT_PUBLIC_API_WS_URL}${endpoint}?token=${encodeURIComponent(token)}`;
  return new WebSocket(wsUrl);
}