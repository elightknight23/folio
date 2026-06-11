import { create } from 'zustand'

const useSessionStore = create((set) => ({
  user: null,
  session: null,
  isLoading: true,
  activeSession: null,

  setAuth: (user, session) => set({ user, session }),
  setLoading: (isLoading) => set({ isLoading }),
  setActiveSession: (activeSession) => set({ activeSession }),
  updateActiveSession: (patch) =>
    set((s) => ({ activeSession: s.activeSession ? { ...s.activeSession, ...patch } : s.activeSession })),
}))

export default useSessionStore
