/**
 * user store — Zustand store for the logged-in user's session state
 * (username, admin flag, auth/loading status), persisted to localStorage.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const userLoginStore = create(
  persist(
    (set) => ({
      userId: "",
      username: "",
      isAuthenticated: false,
      isLoading: true,
      isAdmin: false,

      setUsername: (username) => set({
        username,
        isAuthenticated: !!username
      }),

      setUserId: (userId) => set({ userId: userId || "" }),

      setIsAdmin: (isAdmin) => set({ isAdmin: !!isAdmin }),

      setLoaded: () => set({ isLoading: false }),

      logout: () => set({
        userId: "",
        username: "",
        isAuthenticated: false,
        isAdmin: false,
      }),
    }),
    {
      name: "user-storage",
      partialize: (state) => ({ username: state.username }),
    }
  )
);

