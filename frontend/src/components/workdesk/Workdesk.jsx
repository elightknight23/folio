import { useRef, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Sun, Moon, Maximize2, Minimize2,
  FileText, NotebookPen, BotMessageSquare, X, LayoutGrid,
} from 'lucide-react'
import PDFViewer from '../pdf/PDFViewer'
import AIChat from '../chat/AIChat'
import NotesPanel from '../notes/NotesPanel'
import SelectionTooltip from '../ui/Tooltip'
import useLayoutStore from '../../store/layoutStore'
import useSessionStore from '../../store/sessionStore'
import usePdfStore from '../../store/pdfStore'
import useChatStore from '../../store/chatStore'
import useNotesStore from '../../store/notesStore'

const PANEL_TRANSITION = 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)'
const MIN_PANEL_PCT = 15 // no open panel can be dragged below 15% of the desk
const WEIGHTS_KEY = 'folio-panel-weights'
const DEFAULT_WEIGHTS = { pdf: 52, notes: 20, chat: 28 }

const PANEL_META = {
  pdf: { label: 'PDF', Icon: FileText },
  notes: { label: 'Notes', Icon: NotebookPen },
  chat: { label: 'AI Chat', Icon: BotMessageSquare },
}

function loadWeights() {
  try {
    const raw = JSON.parse(localStorage.getItem(WEIGHTS_KEY))
    if (raw && Object.keys(DEFAULT_WEIGHTS).every((k) => typeof raw[k] === 'number' && raw[k] > 0)) {
      return raw
    }
  } catch { /* fall through */ }
  return DEFAULT_WEIGHTS
}

export default function Workdesk({ pdfUrl }) {
  const navigate = useNavigate()
  const { theme, setTheme, panels, openPanel, closePanel, movePanel } = useLayoutStore()
  const activeSession = useSessionStore((s) => s.activeSession)
  const scrollToPageRef = useRef(null)
  const containerRef = useRef(null)
  const pageDebounceRef = useRef(null)
  const dragging = useRef(false)

  const handlePageChange = useCallback((page) => {
    clearTimeout(pageDebounceRef.current)
    pageDebounceRef.current = setTimeout(() => {
      usePdfStore.getState().setCurrentPage(page)
    }, 300)
  }, [])

  // Clickable citations (F6) — chat pills write jumpToPage; consume it,
  // scroll the PDF via the viewer's existing ref API, then reset to null
  const jumpToPage = usePdfStore((s) => s.jumpToPage)
  useEffect(() => {
    if (jumpToPage == null) return
    openPanel('pdf') // no-op if already open; closed panels stay mounted, so the ref is live
    scrollToPageRef.current?.(jumpToPage)
    usePdfStore.getState().setJumpToPage(null)
  }, [jumpToPage, openPanel])

  // Relative panel widths — pct of desk = weight / sum(open weights)
  const [weights, setWeights] = useState(loadWeights)
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredDivider, setHoveredDivider] = useState(null)

  useEffect(() => {
    localStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights))
  }, [weights])

  // Native fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false)
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen()
    }
  }

  // Highlight-to-Ask state
  const [selectionInfo, setSelectionInfo] = useState(null)

  const filename = activeSession?.filename ?? 'Untitled Document'

  const openPanels = panels.filter((p) => p.open)
  const sumOpen = openPanels.reduce((acc, p) => acc + weights[p.id], 0)
  const pctOf = (id) => (weights[id] / sumOpen) * 100
  const panelTransition = isDragging ? 'none' : PANEL_TRANSITION

  // Divider drag — redistributes width between the open panels on each side
  const onDividerMouseDown = useCallback((e, leftId, rightId) => {
    e.preventDefault()
    dragging.current = true
    setIsDragging(true)

    const startX = e.clientX
    const startWeights = { ...weights }
    const pair = startWeights[leftId] + startWeights[rightId]
    const sum = panels.filter((p) => p.open).reduce((acc, p) => acc + startWeights[p.id], 0)
    const minW = (MIN_PANEL_PCT / 100) * sum

    const onMove = (ev) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const deltaW = ((ev.clientX - startX) / rect.width) * sum
      const left = Math.min(pair - minW, Math.max(minW, startWeights[leftId] + deltaW))
      setWeights({ ...startWeights, [leftId]: left, [rightId]: pair - left })
    }

    const onUp = () => {
      dragging.current = false
      setIsDragging(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [weights, panels])

  useEffect(() => () => { dragging.current = false }, [])

  function handleTextSelect({ text, rect }) {
    setSelectionInfo({ text, rect })
  }

  function handleTooltipAction(action, text) {
    if (action === 'Note') {
      openPanel('notes')
      useNotesStore.getState().setPendingNote({
        quote: text,
        page: usePdfStore.getState().currentPage,
      })
    } else {
      openPanel('chat')
      useChatStore.getState().setPendingPrompt(`${action} the following text: "${text}"`)
    }
    setSelectionInfo(null)
    window.getSelection()?.removeAllRanges()
  }

  function renderPanelContent(id) {
    if (id === 'pdf') {
      return (
        <PDFViewer
          url={pdfUrl}
          scrollToPage={scrollToPageRef}
          onPageChange={handlePageChange}
          onTextSelect={handleTextSelect}
        />
      )
    }
    if (id === 'notes') return <NotesPanel />
    return <AIChat />
  }

  // Index of an open panel among open panels — used to find divider pairs
  const nextOpenId = (idx) => {
    for (let i = idx + 1; i < panels.length; i++) {
      if (panels[i].open) return panels[i].id
    }
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      {/* Toolbar — floating glass header */}
      <div style={{ padding: '10px 12px 8px', flexShrink: 0, background: 'var(--bg)' }}>
        <div
          className="glass"
          style={{
            height: '46px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 0.6rem 0 0.4rem',
            gap: '1rem',
            borderRadius: '14px',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* Left — back + filename */}
          <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                background: 'none', border: 'none', color: 'var(--text-secondary)',
                fontFamily: 'inherit', fontSize: '0.85rem', cursor: 'pointer',
                padding: '0.35rem 0.65rem', borderRadius: '9px', flexShrink: 0,
                transition: 'color var(--dur-fast) ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <ArrowLeft size={15} />
              Dashboard
            </button>
            <span style={{
              fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              marginLeft: '0.5rem', minWidth: 0,
            }}>
              {filename}
            </span>
          </div>

          {/* Centre — panel tabs */}
          <TabBar
            panels={panels}
            onOpen={openPanel}
            onClose={closePanel}
            onMove={movePanel}
          />

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0, flex: 1, justifyContent: 'flex-end' }}>
            <IconButton
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </IconButton>
            <IconButton onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </IconButton>
          </div>
        </div>
      </div>

      {/* Panels — rendered in tab order; closed ones stay mounted at 0 width */}
      <div ref={containerRef} style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {panels.map((panel, idx) => {
          const pairId = panel.open ? nextOpenId(idx) : null
          return (
            <div key={panel.id} style={{ display: 'contents' }}>
              <PanelShell
                id={panel.id}
                open={panel.open}
                width={panel.open ? `calc(${pctOf(panel.id)}% - ${pairId ? 4 : 0}px)` : '0px'}
                transition={panelTransition}
              >
                {renderPanelContent(panel.id)}
              </PanelShell>
              {/* Divider between this panel and the next open one */}
              {pairId && (
                <div
                  onMouseDown={(e) => onDividerMouseDown(e, panel.id, pairId)}
                  onMouseEnter={() => setHoveredDivider(panel.id)}
                  onMouseLeave={() => setHoveredDivider(null)}
                  style={{
                    width: '4px', flexShrink: 0,
                    cursor: 'col-resize',
                    background: hoveredDivider === panel.id || isDragging
                      ? 'var(--accent)' : 'var(--border)',
                    transition: 'background 0.15s',
                  }}
                />
              )}
            </div>
          )
        })}

        {openPanels.length === 0 && (
          <EmptyDesk panels={panels} onOpen={openPanel} />
        )}
      </div>

      {/* Selection tooltip — fixed positioning, outside panel layout */}
      {selectionInfo && (
        <SelectionTooltip
          text={selectionInfo.text}
          rect={selectionInfo.rect}
          onAction={handleTooltipAction}
          onDismiss={() => setSelectionInfo(null)}
        />
      )}
    </div>
  )
}

function PanelShell({ id, open, width, transition, children }) {
  return (
    <div style={{
      width,
      position: 'relative',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', flexShrink: 0,
      background: id === 'pdf' ? 'var(--pdf-bg)' : 'var(--surface)',
      transition,
    }}>
      <div style={{
        flex: 1, height: '100%',
        display: 'flex', flexDirection: 'column',
        minWidth: open ? 0 : '280px',
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  )
}

/* ============================================================
   TAB BAR — chips for each panel: × to close, click a ghost
   chip to bring it back, drag to rearrange the desk order
   ============================================================ */

function TabBar({ panels, onOpen, onClose, onMove }) {
  const [draggedId, setDraggedId] = useState(null)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.3rem',
      flexShrink: 0,
      padding: '3px',
      borderRadius: '11px',
      background: 'color-mix(in srgb, var(--surface-2) 60%, transparent)',
      border: '1px solid var(--border)',
    }}>
      {panels.map((panel, idx) => (
        <TabChip
          key={panel.id}
          panel={panel}
          isDragSource={draggedId === panel.id}
          onDragStart={() => setDraggedId(panel.id)}
          onDragEnd={() => setDraggedId(null)}
          onDragOverChip={() => {
            if (draggedId && draggedId !== panel.id) onMove(draggedId, idx)
          }}
          onOpen={() => onOpen(panel.id)}
          onClose={() => onClose(panel.id)}
        />
      ))}
    </div>
  )
}

function TabChip({ panel, isDragSource, onDragStart, onDragEnd, onDragOverChip, onOpen, onClose }) {
  const [hovered, setHovered] = useState(false)
  const { label, Icon } = PANEL_META[panel.id]
  const open = panel.open

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        // Firefox needs data set for the drag to start
        e.dataTransfer.setData('text/plain', panel.id)
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => { e.preventDefault(); onDragOverChip() }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => { if (!open) onOpen() }}
      title={open ? `${label} — drag to rearrange` : `Reopen ${label}`}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.3rem 0.6rem',
        borderRadius: '8px',
        fontSize: '0.78rem', fontWeight: 500,
        cursor: open ? 'grab' : 'pointer',
        userSelect: 'none',
        opacity: isDragSource ? 0.4 : open ? 1 : 0.55,
        background: open
          ? 'var(--bg)'
          : hovered ? 'color-mix(in srgb, var(--bg) 50%, transparent)' : 'transparent',
        border: open ? '1px solid var(--border)' : '1px dashed var(--border-strong)',
        boxShadow: open ? 'var(--shadow-sm)' : 'none',
        color: open ? 'var(--text-primary)' : 'var(--text-secondary)',
        transition: 'background var(--dur-fast) ease, opacity var(--dur-fast) ease, color var(--dur-fast) ease',
      }}
    >
      <Icon size={13} style={{ flexShrink: 0, opacity: open ? 1 : 0.7 }} />
      {label}
      {open && (
        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          title={`Close ${label}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '16px', height: '16px',
            background: 'transparent', border: 'none',
            borderRadius: '5px', padding: 0,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            opacity: hovered ? 1 : 0.45,
            transition: 'opacity var(--dur-fast) ease, background var(--dur-fast) ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <X size={11} />
        </button>
      )}
    </div>
  )
}

function EmptyDesk({ panels, onOpen }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '1rem',
    }}>
      <LayoutGrid size={36} style={{ opacity: 0.18, color: 'var(--text-secondary)' }} />
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        Everything's closed. Bring a tab back:
      </p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {panels.map(({ id }) => {
          const { label, Icon } = PANEL_META[id]
          return (
            <button
              key={id}
              onClick={() => onOpen(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                padding: '0.5rem 0.9rem',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '9px',
                color: 'var(--text-primary)',
                fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 500,
                cursor: 'pointer',
                transition: 'border-color var(--dur-fast) ease, transform var(--dur-fast) var(--ease-spring)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-strong)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function IconButton({ onClick, title, children, active }) {
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false) }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '32px', height: '32px',
        background: active ? 'var(--accent)' : hovered ? 'var(--surface-2)' : 'transparent',
        border: 'none', borderRadius: '9px',
        color: active ? 'var(--on-accent)' : hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        transform: pressed ? 'scale(0.92)' : hovered ? 'scale(1.05)' : 'scale(1)',
        boxShadow: active ? '0 2px 12px color-mix(in srgb, var(--accent) 35%, transparent)' : 'none',
        transition: 'background var(--dur-fast) ease, color var(--dur-fast) ease, transform var(--dur-fast) var(--ease-spring), box-shadow var(--dur-fast) ease',
      }}
    >
      {children}
    </button>
  )
}
