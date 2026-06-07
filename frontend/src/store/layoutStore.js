import { create } from 'zustand'

const stored = localStorage.getItem('folio-theme')
const initialTheme = stored === 'light' ? 'light' : 'dark'

const useLayoutStore = create((set) => ({
  theme: initialTheme,
  aiPanelOpen: true,

  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('folio-theme', theme)
    set({ theme })
  },

  toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
}))

export default useLayoutStore
