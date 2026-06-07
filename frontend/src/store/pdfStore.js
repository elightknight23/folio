import { create } from 'zustand'

const usePdfStore = create((set) => ({
  currentPage: 1,
  setCurrentPage: (page) => set({ currentPage: page }),
}))

export default usePdfStore
