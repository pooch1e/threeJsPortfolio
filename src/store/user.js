import { create } from "zustand";
import { persist } from "zustand/middleware";

export const userLoginStore = create(
  persist(
    (set) => ({
      username: "",
      isAuthenticated: false,
      isLoading: true,

      setUsername: (username) => set({ 
        username, 
        isAuthenticated: !!username 
      }),

      setLoaded: () => set({ isLoading: false }),
      
      logout: () => set({ 
        username: "", 
        isAuthenticated: false 
      }),
    }),
    {
      name: "user-storage", 
      partialize: (state) => ({ username: state.username }),
    }
  )
);

