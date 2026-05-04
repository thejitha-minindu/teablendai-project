import axios from "axios";
import { API_BASE_URL } from "./api.config";

const TOKEN_KEY = "teablend_token";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 60000,
});

// ✅ REQUEST INTERCEPTOR
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("[API] No valid token found");
    }
  }
  return config;
});

// ✅ RESPONSE INTERCEPTOR
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    if (status === 401 && typeof window !== "undefined") {
      console.warn("[API] 401 Unauthorized detected");

      // ❗ Skip auth endpoints
      const isAuthEndpoint =
        url.includes("/auth/login") ||
        url.includes("/auth/admin/login") ||
        url.includes("/auth/google");

      if (!isAuthEndpoint) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("access_token");

        const currentPath = window.location.pathname;

        if (currentPath.startsWith("/admin")) {
          window.location.href = "/auth/admin/login";
        }
      }
    }

    // Better logging
    console.error("[API Error]", {
      url,
      method: error.config?.method,
      status,
      data: error.response?.data,
      message: error.message,
    });

    return Promise.reject(error);
  }
);