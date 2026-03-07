// =============================================================================
// API Client — Axios instance with interceptors for auth token management
// =============================================================================

import axios from "axios";

// In production (Vercel), API routes are same-origin under /api
// In development, they're also same-origin via Next.js Route Handlers
export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true, // Send cookies
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Response interceptor: auto-refresh on 401
let isRefreshing = false;
let failedQueue: { resolve: (v: unknown) => void; reject: (e: unknown) => void }[] = [];

function processQueue(error: unknown) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(undefined)));
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Never try to refresh the refresh request itself — prevents infinite loop
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url === "/auth/refresh" ||
      originalRequest.url === "/auth/login"
    ) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => apiClient(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await apiClient.post("/auth/refresh");
      processQueue(null);
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);
