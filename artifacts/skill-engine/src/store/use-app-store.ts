import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';

interface AppState {
  candidateId: string | null;
  isRecruiterMode: boolean;
  user: User | null;
  setCandidateId: (id: string | null) => void;
  toggleRecruiterMode: () => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      candidateId: null,
      isRecruiterMode: false,
      user: null,
      setCandidateId: (id) => set({ candidateId: id }),
      toggleRecruiterMode: () => set((state) => ({ isRecruiterMode: !state.isRecruiterMode })),
      setUser: (user) => set({ user }),
      logout: () => set({ candidateId: null, user: null, isRecruiterMode: false }),
    }),
    {
      name: 'skill-engine-storage',
      partialize: (state) => ({ candidateId: state.candidateId }),
    }
  )
);
