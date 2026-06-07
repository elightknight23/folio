import { create } from 'zustand'

const useSessionStore = create((set) => ({
  user: null,
  session: null,
  isLoading: true,
  activeSession: null,

  setAuth: (user, session) => set({ user, session }),
  setLoading: (isLoading) => set({ isLoading }),
  setActiveSession: (activeSession) => set({ activeSession }),
}))

export default useSessionStore
