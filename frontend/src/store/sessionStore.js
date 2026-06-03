import { create } from 'zustand'

const useSessionStore = create((set) => ({
  user: null,
  session: null,
  isLoading: true,

  setAuth: (user, session) => set({ user, session }),
  setLoading: (isLoading) => set({ isLoading }),
}))

export default useSessionStore
