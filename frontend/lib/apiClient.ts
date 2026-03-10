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
    console.error("[API Error]", error.response?.data || error.message);
    return Promise.reject(error);
  }
);