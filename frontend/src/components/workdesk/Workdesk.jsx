import { useRef, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sun, Moon, PanelRightClose, PanelRightOpen } from 'lucide-react'
import PDFViewer from '../pdf/PDFViewer'
import AIChat from '../chat/AIChat'
import useLayoutStore from '../../store/layoutStore'
import useSessionStore from '../../store/sessionStore'
import usePdfStore from '../../store/pdfStore'

const DEFAULT_LEFT_PCT = 55
const MIN_LEFT_PCT = 30
const MAX_LEFT_PCT = 75

export default function Workdesk({ pdfUrl }) {
  const navigate = useNavigate()
  const { theme, setTheme, aiPanelOpen, toggleAiPanel } = useLayoutStore()
  const activeSession = useSessionStore((s) => s.activeSession)
  const scrollToPageRef = useRef(null)
  const containerRef = useRef(null)
  const pageDebounceRef = useRef(null)

  const handlePageChange = useCallback((page) => {
    clearTimeout(pageDebounceRef.current)
    pageDebounceRef.current = setTimeout(() => {
      usePdfStore.getState().setCurrentPage(page)
    }, 300)
  }, [])
  const [leftPct, setLeftPct] = useState(DEFAULT_LEFT_PCT)
  const [dividerHover, setDividerHover] = useState(false)
  const dragging = useRef(false)

  const filename = activeSession?.filename ?? 'Untitled Document'

  const onDividerMouseDown = useCallback((e) => {
    e.preventDefault()
    dragging.current = true

    const onMove = (ev) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((ev.clientX - rect.left) / rect.width) * 100
      setLeftPct(Math.min(MAX_LEFT_PCT, Math.max(MIN_LEFT_PCT, pct)))
    }

    const onUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  // Clean up drag listeners on unmount
  useEffect(() => () => { dragging.current = false }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      {/* Toolbar */}
      <div style={{
        height: '44px',
        minHeight: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1rem',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        gap: '1rem',
      }}>
        {/* Left */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontFamily: 'inherit',
            fontSize: '0.85rem',
            cursor: 'pointer',
            padding: '0.25rem 0.5rem',
            borderRadius: '6px',
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={15} />
          Dashboard
        </button>

        {/* Centre */}
        <span style={{
          fontWeight: 600,
          color: 'var(--text-primary)',
          fontSize: '0.9rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          textAlign: 'center',
        }}>
          {filename}
        </span>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
          <IconButton
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle dark mode"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </IconButton>
          <IconButton onClick={toggleAiPanel} title="Toggle AI panel">
            {aiPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </IconButton>
        </div>
      </div>

      {/* Panels */}
      <div ref={containerRef} style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left — PDF */}
        <div style={{
          width: aiPanelOpen ? `${leftPct}%` : '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--bg)',
          transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <PDFViewer
            url={pdfUrl}
            scrollToPage={scrollToPageRef}
            onPageChange={handlePageChange}
            onTextSelect={() => {}}
          />
        </div>

        {/* Resize divider — hidden (not unmounted) when panel is closed */}
        <div
          onMouseDown={onDividerMouseDown}
          onMouseEnter={() => setDividerHover(true)}
          onMouseLeave={() => setDividerHover(false)}
          style={{
            width: aiPanelOpen ? '4px' : '0px',
            cursor: 'col-resize',
            background: dividerHover ? 'var(--accent)' : 'var(--border)',
            flexShrink: 0,
            overflow: 'hidden',
            transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1), background 0.15s',
          }}
        />

        {/* Right — AI placeholder. Never unmounted — animates via width. */}
        <div style={{
          width: aiPanelOpen ? `${100 - leftPct}%` : '0px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          {/* min-width prevents reflow during collapse animation; outer overflow:hidden clips it */}
          <div style={{ width: '100%', minWidth: '300px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <AIChat />
          </div>
        </div>
      </div>
    </div>
  )
}

function IconButton({ onClick, title, children }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '30px',
        height: '30px',
        background: hovered ? 'var(--border)' : 'transparent',
        border: 'none',
        borderRadius: '6px',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
    >
      {children}
    </button>
  )
}
