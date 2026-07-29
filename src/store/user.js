import { create } from "zustand";
import { persist } from "zustand/middleware";

export const userLoginStore = create(
  persist(
    (set) => ({
      username: "",
      isAuthenticated: false,
      isLoading: true,
      isAdmin: false,

      // Set user data after successful login/session validation
      setUsername: (username) => set({
        username,
        isAuthenticated: !!username
      }),

      setIsAdmin: (isAdmin) => set({ isAdmin }),

      // Called after session check resolves (success or failure)
      setLoaded: () => set({ isLoading: false }),

      // Clear user data on logout
      logout: () => set({
        username: "",
        isAuthenticated: false,
        isAdmin: false,
      }),
    }),
    {
      name: "user-storage", // localStorage key
      partialize: (state) => ({ username: state.username }), // Only persist username
    }
  )
);

