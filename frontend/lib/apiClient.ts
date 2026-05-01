import axios from "axios";
import { API_BASE_URL } from "./api.config";
import {
  clearStoredAuthToken,
  getStoredToken,
  registerLogoutListener,
} from "./auth";

type AuthTrackedConfig = {
  _authAbortController?: AbortController;
};

const activeAuthRequests = new Set<AbortController>();

function trackRequestController(config: AuthTrackedConfig): AuthTrackedConfig {
  if (config._authAbortController) {
    activeAuthRequests.add(config._authAbortController);
    return config;
  }

  const controller = new AbortController();
  config._authAbortController = controller;
  activeAuthRequests.add(controller);
  return config;
}

function untrackRequestController(config?: AuthTrackedConfig): void {
  const controller = config?._authAbortController;
  if (!controller) return;

  activeAuthRequests.delete(controller);
}

registerLogoutListener(() => {
  for (const controller of activeAuthRequests) {
    controller.abort();
  }
  activeAuthRequests.clear();
});

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 60000,
});

apiClient.interceptors.request.use((config) => {
  const trackedConfig = trackRequestController(config as AuthTrackedConfig);
  config.signal = trackedConfig._authAbortController?.signal;

  if (typeof window !== "undefined") {
    const token = getStoredToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    untrackRequestController(response.config as AuthTrackedConfig);
    return response;
  },
  (error) => {
    untrackRequestController(error.config as AuthTrackedConfig);

    if (axios.isCancel(error) || error.code === "ERR_CANCELED") {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && typeof window !== "undefined") {
      const requestUrl = error.config?.url || "";
      const isAuthEndpoint =
        requestUrl.includes("/auth/login") ||
        requestUrl.includes("/auth/google") ||
        requestUrl.includes("/auth/register") ||
        requestUrl.includes("/auth/forgot-password") ||
        requestUrl.includes("/auth/verify-otp") ||
        requestUrl.includes("/auth/reset-password");

      if (!isAuthEndpoint && getStoredToken()) {
        clearStoredAuthToken("expired");
      }
    }

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
        return (_key: string, value: unknown) => {
          if (typeof value === "object" && value !== null) {
            if (seen.has(value)) return "[Circular]";
            seen.add(value);
          }
          return value;
        };
      };

      let safeData: unknown;
      try {
        safeData =
          error.response?.data !== undefined
            ? JSON.parse(JSON.stringify(error.response.data, getCircularReplacer()))
            : undefined;
      } catch {
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
      } catch {
        console.error("[API Error] (unserializable)", payload);
      }
    }
    return Promise.reject(error);
  },
);