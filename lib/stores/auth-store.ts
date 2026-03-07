// =============================================================================
// Auth Store — Zustand store for authentication state
// =============================================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "@/lib/api-client";
import type { UserDTO } from "@/packages/shared/types";

interface AuthState {
  user: UserDTO | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUser: (user: UserDTO | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data } = await apiClient.post("/auth/login", { email, password });
          set({
            user: data.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (input) => {
        set({ isLoading: true });
        try {
          await apiClient.post("/auth/register", input);
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await apiClient.post("/auth/logout");
        } catch {
          // Ignore errors — clear state regardless
        } finally {
          set({ user: null, isAuthenticated: false });
        }
      },

      fetchUser: async () => {
        set({ isLoading: true });
        try {
          const { data } = await apiClient.get("/auth/me");
          set({
            user: data.data,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
