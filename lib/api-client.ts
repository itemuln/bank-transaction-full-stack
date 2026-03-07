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
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't retried yet, try refreshing the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await apiClient.post("/auth/refresh");
        // Retry the original request
        return apiClient(originalRequest);
      } catch {
        // Refresh failed — redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/sign-in";
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
