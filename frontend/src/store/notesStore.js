import { create } from 'zustand'

const useNotesStore = create((set) => ({
  // Set by the highlight tooltip's "Note" action; NotesPanel consumes it
  // and creates a note anchored to the quoted text + page.
  pendingNote: null, // { quote: string, page: number }

  setPendingNote: (pendingNote) => set({ pendingNote }),
  clearPendingNote: () => set({ pendingNote: null }),
}))

export default useNotesStore
