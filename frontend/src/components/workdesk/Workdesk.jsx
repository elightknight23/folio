import { useRef, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sun, Moon, PanelRightClose, PanelRightOpen, Scissors, BotMessageSquare, Maximize2, Minimize2 } from 'lucide-react'
import PDFViewer from '../pdf/PDFViewer'
import AIChat from '../chat/AIChat'
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
  const [isDragging, setIsDragging] = useState(false)   // Fix 6: suppress transition during drag

  // Fix 5: AI-only mode collapses PDF panel to give full width to chat
  const [aiOnlyMode, setAiOnlyMode] = useState(false)

  // Native fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false)
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error)
    } else {
      document.exitFullscreen()
    }
  }

  // Highlight-to-Ask state
  const [selectionInfo, setSelectionInfo] = useState(null)

  // Vision-to-Ask state
  const [cropMode, setCropMode] = useState(false)
  const [pendingImage, setPendingImage] = useState(null)

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
    if (aiOnlyMode === false && !aiPanelOpen) setAiOnlyMode(false)
    useChatStore.getState().setPendingPrompt(prompt)
    setSelectionInfo(null)
    window.getSelection()?.removeAllRanges()
  }

  function handleCropComplete(base64) {
    setPendingImage(base64)
    setCropMode(false)
    if (!aiPanelOpen) toggleAiPanel()
  }

  function toggleAiOnly() {
    if (!aiOnlyMode && !aiPanelOpen) toggleAiPanel()
    setAiOnlyMode((v) => !v)
  }

  // Compute left panel width
  const leftWidth = aiOnlyMode ? '0%' : aiPanelOpen ? `${leftPct}%` : '100%'
  const rightWidth = aiOnlyMode ? '100%' : aiPanelOpen ? `${100 - leftPct}%` : '0px'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      {/* Toolbar */}
      <div style={{
        height: '44px', minHeight: '44px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1rem',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        gap: '1rem',
      }}>
        {/* Left */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            background: 'none', border: 'none', color: 'var(--text-secondary)',
            fontFamily: 'inherit', fontSize: '0.85rem', cursor: 'pointer',
            padding: '0.25rem 0.5rem', borderRadius: '6px', flexShrink: 0,
          }}
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
            onClick={() => setCropMode((v) => !v)}
            title={cropMode ? 'Cancel snipping (Esc)' : 'Snipping tool — drag to crop'}
            active={cropMode}
          >
            <Scissors size={16} />
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

      {/* Panels */}
      <div ref={containerRef} style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left — PDF. --pdf-bg is slightly darker than --bg so the white page looks like paper on a desk */}
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
            cropMode={cropMode}
            onCropComplete={handleCropComplete}
            onCancelCrop={() => setCropMode(false)}
          />
        </div>

        {/* Resize divider — hidden when AI-only or panel closed */}
        <div
          onMouseDown={onDividerMouseDown}
          onMouseEnter={() => setDividerHover(true)}
          onMouseLeave={() => setDividerHover(false)}
          style={{
            width: aiPanelOpen && !aiOnlyMode ? '4px' : '0px',
            cursor: 'col-resize',
            background: dividerHover ? 'var(--accent)' : 'var(--border)',
            flexShrink: 0, overflow: 'hidden',
            transition: panelTransition + ', background 0.15s',
          }}
        />

        {/* Right — AI panel */}
        <div style={{
          width: rightWidth,
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          background: 'var(--surface)', borderLeft: '1px solid var(--border)',
          transition: panelTransition,
        }}>
          <div style={{ width: '100%', minWidth: '300px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <AIChat
              pendingImage={pendingImage}
              onClearImage={() => setPendingImage(null)}
            />
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
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '30px', height: '30px',
        background: active ? 'var(--accent)' : hovered ? 'var(--border)' : 'transparent',
        border: 'none', borderRadius: '6px',
        color: active ? 'var(--on-accent)' : 'var(--text-secondary)',
        cursor: 'pointer', transition: 'background 0.15s',
      }}
    >
      {children}
    </button>
  )
}
