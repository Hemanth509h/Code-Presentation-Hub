import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAppStore = create(
  persist(
    (set, get) => ({
      candidateId: null,
      user: null,
      authLoading: true,
      userCandidateMap: {},

      setCandidateId: (id) => set({ candidateId: id }),

      linkUserToCandidate: (userId, candidateId) =>
        set((state) => ({
          candidateId,
          userCandidateMap: { ...state.userCandidateMap, [userId]: candidateId },
        })),

      setUser: (user) => {
        const { userCandidateMap } = get();
        const restoredCandidateId = user ? (userCandidateMap[user.id] ?? null) : null;
        set((state) => ({
          user,
          authLoading: false,
          candidateId: restoredCandidateId ?? state.candidateId,
        }));
      },

      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        } catch (_) {}
        set({ user: null, authLoading: false, candidateId: null });
      },
    }),
    {
      name: "skill-engine-storage",
      partialize: (state) => ({
        candidateId: state.candidateId,
        userCandidateMap: state.userCandidateMap,
      }),
    }
  )
);

export const getUserRole = (user) => {
  return user?.role || "candidate";
};
