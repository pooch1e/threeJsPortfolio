import { create } from "zustand";

export const userLoginStore = create((set) => ({
  username: "",
  sessionToken: "",
  setUsername: (username) => set({ username }),
  setSessionToken: (sessionToken) => set({ sessionToken }),
}));

