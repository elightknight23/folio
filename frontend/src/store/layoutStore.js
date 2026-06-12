import { create } from 'zustand'

const stored = localStorage.getItem('folio-theme')
const initialTheme = stored === 'light' ? 'light' : 'dark'

/**
 * Workdesk tabs — array order is the left→right panel order.
 * Closed panels stay mounted (collapsed to 0 width) so their state
 * survives close/reopen; `open` only drives layout.
 */
const PANELS_KEY = 'folio-panels'
const DEFAULT_PANELS = [
  { id: 'pdf', open: true },
  { id: 'notes', open: false },
  { id: 'chat', open: true },
]

function loadPanels() {
  try {
    const raw = JSON.parse(localStorage.getItem(PANELS_KEY))
    if (
      Array.isArray(raw) &&
      raw.length === DEFAULT_PANELS.length &&
      DEFAULT_PANELS.every((d) => raw.some((p) => p.id === d.id))
    ) {
      return raw.map((p) => ({ id: p.id, open: !!p.open }))
    }
  } catch {
    // Corrupt/legacy value — fall through to defaults
  }
  return DEFAULT_PANELS
}

function persistPanels(panels) {
  localStorage.setItem(PANELS_KEY, JSON.stringify(panels))
  return panels
}

const useLayoutStore = create((set) => ({
  theme: initialTheme,
  panels: loadPanels(),

  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('folio-theme', theme)
    set({ theme })
  },

  openPanel: (id) =>
    set((s) => ({
      panels: persistPanels(s.panels.map((p) => (p.id === id ? { ...p, open: true } : p))),
    })),

  closePanel: (id) =>
    set((s) => ({
      panels: persistPanels(s.panels.map((p) => (p.id === id ? { ...p, open: false } : p))),
    })),

  togglePanel: (id) =>
    set((s) => ({
      panels: persistPanels(s.panels.map((p) => (p.id === id ? { ...p, open: !p.open } : p))),
    })),

  // Move a tab to a new index — drives drag-to-reorder in the Workdesk tab bar
  movePanel: (id, toIndex) =>
    set((s) => {
      const fromIndex = s.panels.findIndex((p) => p.id === id)
      if (fromIndex === -1 || fromIndex === toIndex) return s
      const panels = [...s.panels]
      const [moved] = panels.splice(fromIndex, 1)
      panels.splice(toIndex, 0, moved)
      return { panels: persistPanels(panels) }
    }),
}))

export default useLayoutStore
