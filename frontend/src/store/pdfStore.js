import { create } from 'zustand'

const usePdfStore = create((set) => ({
  currentPage: 1,
  setCurrentPage: (page) => set({ currentPage: page }),

  // Citation jump command — set by chat citation pills, consumed (and reset
  // back to null) by Workdesk, which forwards it to the PDFViewer ref
  jumpToPage: null,
  setJumpToPage: (page) => set({ jumpToPage: page }),
}))

export default usePdfStore
