import { create } from "zustand";

export const transitionStore = create((set, get) => ({
    phase: 'idle', // covering, finished
    setPhase: (phase) => set({ phase }),
    targetPath: null,
    setTargetPath: (targetPath) => {
      if (get().phase !== 'idle') return;
      set({ phase: 'covering', targetPath });
    },
    reset: () => set({phase: 'idle', targetPath: null})
  })
)
