import { useRef, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sun, Moon, PanelRightClose, PanelRightOpen, BotMessageSquare, Maximize2, Minimize2, NotebookPen } from 'lucide-react'
import PDFViewer from '../pdf/PDFViewer'
import AIChat from '../chat/AIChat'
import NotesPanel from '../notes/NotesPanel'
import SelectionTooltip from '../ui/Tooltip'
import useLayoutStore from '../../store/layoutStore'
import useSessionStore from '../../store/sessionStore'
import usePdfStore from '../../store/pdfStore'
import useChatStore from '../../store/chatStore'

const DEFAULT_LEFT_PCT = 55
const MIN_LEFT_PCT = 30
const MAX_LEFT_PCT = 75
const PANEL_TRANSITION = 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)'

export default function Workdesk({ pdfUrl }) {
  const navigate = useNavigate()
  const { theme, setTheme, aiPanelOpen, toggleAiPanel } = useLayoutStore()
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

  const [leftPct, setLeftPct] = useState(DEFAULT_LEFT_PCT)
  const [dividerHover, setDividerHover] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const [aiOnlyMode, setAiOnlyMode] = useState(false)
  const [notesPanelOpen, setNotesPanelOpen] = useState(false)

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
  const panelTransition = isDragging ? 'none' : PANEL_TRANSITION

  const onDividerMouseDown = useCallback((e) => {
    e.preventDefault()
    dragging.current = true
    setIsDragging(true)

    const onMove = (ev) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((ev.clientX - rect.left) / rect.width) * 100
      setLeftPct(Math.min(MAX_LEFT_PCT, Math.max(MIN_LEFT_PCT, pct)))
    }

    const onUp = () => {
      dragging.current = false
      setIsDragging(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  useEffect(() => () => { dragging.current = false }, [])

  function handleTextSelect({ text, rect }) {
    if (cropMode) return
    setSelectionInfo({ text, rect })
  }

  function handleTooltipAction(action, text) {
    const prompt = `${action} the following text: "${text}"`
    if (!aiPanelOpen) toggleAiPanel()
    useChatStore.getState().setPendingPrompt(prompt)
    setSelectionInfo(null)
    window.getSelection()?.removeAllRanges()
  }

  function toggleAiOnly() {
    if (!aiOnlyMode && !aiPanelOpen) toggleAiPanel()
    setAiOnlyMode((v) => !v)
  }

  // "Any panel open" drives PDF width and divider visibility
  const anyPanelOpen = aiPanelOpen || notesPanelOpen
  const leftWidth = aiOnlyMode ? '0%' : anyPanelOpen ? `${leftPct}%` : '100%'
  const rightWidth = aiOnlyMode ? '100%' : anyPanelOpen ? `${100 - leftPct}%` : '0px'

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
        {/* Left */}
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

        {/* Centre */}
        <span style={{
          fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          flex: 1, textAlign: 'center',
        }}>
          {filename}
        </span>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
          <IconButton
            onClick={() => setNotesPanelOpen((v) => !v)}
            title={notesPanelOpen ? 'Close notes' : 'Open notes'}
            active={notesPanelOpen}
          >
            <NotebookPen size={16} />
          </IconButton>
          <IconButton
            onClick={toggleAiOnly}
            title={aiOnlyMode ? 'Back to split view' : 'AI-only mode'}
            active={aiOnlyMode}
          >
            <BotMessageSquare size={16} />
          </IconButton>
          <IconButton
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle dark mode"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </IconButton>
          <IconButton onClick={toggleAiPanel} title="Toggle AI panel">
            {aiPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </IconButton>
          <IconButton onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </IconButton>
        </div>
        </div>
      </div>

      {/* Panels */}
      <div ref={containerRef} style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left — PDF */}
        <div style={{
          width: leftWidth,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', background: 'var(--pdf-bg)',
          transition: panelTransition,
        }}>
          <PDFViewer
            url={pdfUrl}
            scrollToPage={scrollToPageRef}
            onPageChange={handlePageChange}
            onTextSelect={handleTextSelect}
          />
        </div>

        {/* Drag divider — hidden when no right panels open or in AI-only mode */}
        <div
          onMouseDown={onDividerMouseDown}
          onMouseEnter={() => setDividerHover(true)}
          onMouseLeave={() => setDividerHover(false)}
          style={{
            width: anyPanelOpen && !aiOnlyMode ? '4px' : '0px',
            cursor: 'col-resize',
            background: dividerHover ? 'var(--accent)' : 'var(--border)',
            flexShrink: 0, overflow: 'hidden',
            transition: panelTransition + ', background 0.15s',
          }}
        />

        {/* Right container — holds Notes + AI side by side */}
        <div style={{
          width: rightWidth,
          display: 'flex', overflow: 'hidden',
          transition: panelTransition,
        }}>

          {/* Notes panel — fixed 300px, clipped by right container overflow:hidden */}
          <div style={{
            width: notesPanelOpen && !aiOnlyMode ? '300px' : '0px',
            flexShrink: 0, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            background: 'var(--surface)',
            borderRight: '1px solid var(--border)',
            transition: panelTransition,
          }}>
            <div style={{ width: '300px', minWidth: '300px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <NotesPanel />
            </div>
          </div>

          {/* AI panel — fills remaining right-side space */}
          <div style={{
            flex: 1, minWidth: 0, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            background: 'var(--surface)',
            borderLeft: notesPanelOpen && !aiOnlyMode ? 'none' : '1px solid var(--border)',
          }}>
            <div style={{ width: '100%', minWidth: '300px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <AIChat />
            </div>
          </div>

        </div>
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
