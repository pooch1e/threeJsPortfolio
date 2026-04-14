import { create } from "zustand";

export const userLoginStore = create((set) => ({
  username: "",
  sessionToken: "",
  setUsername: () => set((username) => ({ username })),
  setSessionToken: () => set((sessionToken) => ({ sessionToken })),
}));

