import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAppStore = create(
  persist(
    (set) => ({
      candidateId: null,
      isRecruiterMode: false,
      user: null,
      setCandidateId: (id) => set({ candidateId: id }),
      toggleRecruiterMode: () =>
        set((state) => ({ isRecruiterMode: !state.isRecruiterMode })),
      setUser: (user) => set({ user }),
      logout: () =>
        set({ candidateId: null, user: null, isRecruiterMode: false }),
    }),
    {
      name: "skill-engine-storage",
      partialize: (state) => ({ candidateId: state.candidateId }),
    }
  )
);
