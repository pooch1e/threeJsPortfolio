import { create } from "zustand";

export const transitionStore = create((set) => ({
    phase: 'idle', // covering, finished
    setPhase: (phase) => set({ phase }),
    targetPath: null,
    setTargetPath: (targetPath) => set({ phase: 'covering', targetPath }),
    reset: () => set({phase: 'idle', targetPath: null})
  })
)
