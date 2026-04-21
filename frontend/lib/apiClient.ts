import axios from "axios";
import { API_BASE_URL } from "./api.config";


export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 60000, // 60s for AI responses
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("teablend_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we get a 401 Unauthorized, automatically log the user out
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('teablend_token');
      window.location.href = '/auth/login';
    }
    // Better diagnostics for network errors
    const url = error.config?.url;
    const method = error.config?.method;
    const status = error.response?.status;
    if (!error.response) {
        const info = {
          url: url ?? null,
          method: method ?? null,
          message: error.message ?? null,
          stack: error.stack ?? null,
        };
        console.error(`[API Error] Network Error - no response from server: ${error.message}`);
        console.error("[API Error] Network Info:", JSON.stringify(info, null, 2));
    } else {
        const getCircularReplacer = () => {
          const seen = new WeakSet();
          return (_key: string, value: any) => {
            if (typeof value === "object" && value !== null) {
              if (seen.has(value)) return "[Circular]";
              seen.add(value);
            }
            return value;
          };
        };

        let safeData: any = undefined;
        try {
          safeData = error.response?.data !== undefined ? JSON.parse(JSON.stringify(error.response.data, getCircularReplacer())) : undefined;
        } catch (e) {
          safeData = String(error.response?.data);
        }

        const payload = {
          url,
          method,
          status,
          data: safeData,
          message: error?.message ?? String(error),
        };
        try {
          console.error("[API Error] " + JSON.stringify(payload, null, 2));
        } catch (e) {
          console.error("[API Error] (unserializable)", payload);
        }
    }
    return Promise.reject(error);
  }
);