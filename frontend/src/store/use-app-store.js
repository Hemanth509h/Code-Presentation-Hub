import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAppStore = create(
  persist(
    (set) => ({
      candidateId: null,
      user: null,
      authLoading: true,
      setCandidateId: (id) => set({ candidateId: id }),
      setUser: (user) => set({ user, authLoading: false }),
      logout: () => set({ candidateId: null, user: null, authLoading: false }),
    }),
    {
      name: "skill-engine-storage",
      partialize: (state) => ({ candidateId: state.candidateId }),
    }
  )
);

export const getUserRole = (user) => {
  return user?.user_metadata?.role || "candidate";
};
