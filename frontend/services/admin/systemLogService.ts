import { apiClient } from "@/lib/apiClient";
import { getStoredToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api.config";
import { SystemLogFilters, SystemLogListResponse, SystemLog } from "@/types/admin/system-log.types";

export const getSystemLogs = async (filters: SystemLogFilters): Promise<SystemLogListResponse> => {
  const params: Record<string, any> = {};
  
  if (filters.status) params.status = filters.status;
  if (filters.activity_type) params.activity_type = filters.activity_type;
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  if (filters.search) params.search = filters.search;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;

  const response = await apiClient.get<SystemLogListResponse>("/admin/logs", { params });
  return response.data;
};

export const createSSEConnection = (
  onNewLog: (log: SystemLog) => void,
  onError: (error: Event) => void
): EventSource | null => {
  const token = getStoredToken();
  if (!token) {
    console.error("No token found for SSE connection");
    return null;
  }

  const baseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const sseUrl = `${baseUrl}/admin/logs/stream?token=${encodeURIComponent(token)}`;

  const eventSource = new EventSource(sseUrl);

  eventSource.onopen = () => {
    // connected
    console.debug("SSE connected to:", sseUrl);
  };

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onNewLog(data);
    } catch (err) {
      console.error("Error parsing SSE system log data:", err);
    }
  };

  eventSource.onerror = async (error) => {
    // Surface the event to the caller
    try {
      // Attempt a diagnostic fetch to help reveal HTTP status (CORS/401/etc.)
      const resp = await fetch(sseUrl, { method: 'GET', cache: 'no-cache' });
      console.error("SSE diagnostic fetch status:", resp.status, resp.statusText);
    } catch (fetchErr) {
      console.error("SSE diagnostic fetch failed:", fetchErr);
    }

    onError(error);

    // simple reconnect strategy: close and attempt reconnect after delay
    try {
      eventSource.close();
    } catch (e) {
      /* ignore */
    }

    // return null here; caller may choose to reconnect by calling createSSEConnection again
  };

  return eventSource;
};
