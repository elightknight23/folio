import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, ALargeSmall, Sparkles, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useSessionStore from '../../store/sessionStore'
import usePdfStore from '../../store/pdfStore'
import useChatStore from '../../store/chatStore'
import { streamMessage } from '../../services/chatService'
import useToast from '../../hooks/useToast'
import Toast from '../ui/Toast'

const FONT_SIZE_KEY = 'folio-chat-fontsize'
const FONT_SIZE_DEFAULT = 14
const FONT_SIZE_MIN = 12
const FONT_SIZE_MAX = 32

export default function AIChat() {
  const session = useSessionStore((s) => s.session)
  const activeSession = useSessionStore((s) => s.activeSession)
  const currentPage = usePdfStore((s) => s.currentPage)
  const {
    messages, isTyping,
    addMessage, appendToLastMessage, setTyping, removeLastMessage,
    pendingPrompt, clearPendingPrompt,
  } = useChatStore()

  const [input, setInput] = useState('')
  const [fontSize, setFontSize] = useState(
    () => Number(localStorage.getItem(FONT_SIZE_KEY)) || FONT_SIZE_DEFAULT
  )
  const [showSlider, setShowSlider] = useState(false)
  const messagesEndRef = useRef(null)
  const { toasts, showToast } = useToast()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleFontSizeChange(val) {
    const n = Number(val)
    setFontSize(n)
    localStorage.setItem(FONT_SIZE_KEY, n)
  }

  const send = useCallback(async (msg) => {
    if (!msg || isTyping || !activeSession?.id) return
    addMessage({ role: 'user', content: msg })
    addMessage({ role: 'assistant', content: '' })
    setTyping(true)
    try {
      const gen = streamMessage(activeSession.id, msg, currentPage, session.access_token)
      for await (const token of gen) {
        appendToLastMessage(token)
      }
    } catch (err) {
      removeLastMessage()
      showToast(err.message ?? 'Something went wrong', 'error')
    } finally {
      setTyping(false)
    }
  }, [isTyping, activeSession, currentPage, session, addMessage, appendToLastMessage, setTyping, removeLastMessage, showToast])

  // Tooltip actions write pendingPrompt to chatStore; pick it up and send automatically
  useEffect(() => {
    if (pendingPrompt && !isTyping) {
      const msg = pendingPrompt
      clearPendingPrompt()
      send(msg)
    }
  }, [pendingPrompt, isTyping, send, clearPendingPrompt])

  async function handleSend() {
    const msg = input.trim()
    if (!msg) return
    setInput('')
    await send(msg)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = !isTyping && input.trim().length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontSize: `${fontSize}px` }}>

      {/* Header */}
      <div style={{
        padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)',
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            AI Assistant
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: '0.5rem', opacity: 0.7 }}>
            · page {currentPage}
          </span>
        </div>
        {/* Font size pill — expands inline on hover, mouse never leaves the container */}
        <div
          onMouseEnter={() => setShowSlider(true)}
          onMouseLeave={() => setShowSlider(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: showSlider ? '164px' : '30px',
            overflow: 'hidden',
            transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            background: 'color-mix(in srgb, var(--surface) 70%, transparent)',
            border: '1px solid var(--border)',
            borderRadius: '999px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            padding: '4px 8px',
            cursor: 'default',
            flexShrink: 0,
          }}
        >
          <ALargeSmall
            size={14}
            style={{ flexShrink: 0, color: 'var(--text-secondary)', display: 'block' }}
          />
          <input
            type="range"
            min={FONT_SIZE_MIN}
            max={FONT_SIZE_MAX}
            step={1}
            value={fontSize}
            onChange={(e) => handleFontSizeChange(e.target.value)}
            className="chat-font-slider"
            style={{ flexShrink: 0, width: '88px' }}
            tabIndex={-1}
          />
          <span style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
            userSelect: 'none',
          }}>
            {fontSize}
          </span>
        </div>
      </div>

      {/* Messages — single centered column, ChatGPT-style thread */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.25rem 0.5rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          width: '100%', maxWidth: '760px', margin: '0 auto',
          flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem',
        }}>
          {messages.length === 0 && (
            <EmptyState onHint={setInput} />
          )}

          {messages.map((msg) => (
            <MessageRow key={msg.id} message={msg} />
          ))}

          {isTyping && messages[messages.length - 1]?.content === '' && (
            <TypingIndicator />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input — same column width as the thread */}
      <div style={{ padding: '0.75rem 1.25rem 1rem', flexShrink: 0 }}>
        <div
          style={{
            width: '100%', maxWidth: '760px', margin: '0 auto',
            display: 'flex', gap: '0.5rem', alignItems: 'flex-end',
            border: '1px solid var(--border)', borderRadius: '14px',
            background: 'var(--bg)',
            padding: '0.45rem 0.45rem 0.45rem 0.9rem',
            boxShadow: 'var(--shadow-sm)',
            transition: 'border-color var(--dur-fast) ease, box-shadow var(--dur-med) var(--ease-out)',
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 55%, var(--border))'
            e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent)'
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this PDF…"
            rows={1}
            disabled={isTyping}
            style={{
              flex: 1, resize: 'none',
              border: 'none',
              padding: '0.35rem 0', fontFamily: 'inherit', fontSize: 'inherit',
              background: 'transparent', color: 'var(--text-primary)',
              outline: 'none', lineHeight: 1.5, opacity: isTyping ? 0.6 : 1,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '34px', height: '34px', flexShrink: 0,
              background: canSend ? 'var(--accent)' : 'var(--surface-2)',
              border: 'none', borderRadius: '10px',
              cursor: canSend ? 'pointer' : 'not-allowed',
              boxShadow: canSend ? '0 2px 14px color-mix(in srgb, var(--accent) 35%, transparent)' : 'none',
              transition: 'background var(--dur-fast) ease, box-shadow var(--dur-med) var(--ease-out), transform var(--dur-fast) var(--ease-spring)',
            }}
            onMouseEnter={(e) => { if (canSend) e.currentTarget.style.transform = 'scale(1.06)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            <Send size={15} color={canSend ? 'var(--on-accent)' : 'var(--text-secondary)'} />
          </button>
        </div>
      </div>

      <Toast toasts={toasts} />
    </div>
  )
}

/* ============================================================
   CLICKABLE CITATIONS (F6) — the AI emits [Page X](#page-X)
   links; we intercept anchors whose href matches and render a
   pill that jumps the PDFViewer to that page via pdfStore.
   ============================================================ */

const PAGE_HREF_RE = /^#page-(\d+)$/

function MarkdownLink({ href, children }) {
  const match = href?.match(PAGE_HREF_RE)
  if (match) return <CitationPill page={Number(match[1])} />
  // Genuine external link — open safely in a new tab
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
      {children}
    </a>
  )
}

function CitationPill({ page }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={() => usePdfStore.getState().setJumpToPage(page)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`Jump to page ${page}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '1px 9px', margin: '0 1px',
        verticalAlign: 'baseline',
        background: hovered
          ? 'color-mix(in srgb, var(--accent) 10%, var(--surface))'
          : 'var(--surface)',
        border: `1px solid ${hovered ? 'color-mix(in srgb, var(--accent) 45%, var(--border))' : 'var(--border)'}`,
        borderRadius: '999px',
        color: 'var(--accent)',
        fontFamily: 'inherit', fontSize: '0.82em', fontWeight: 500,
        lineHeight: 1.5,
        cursor: 'pointer',
        transition: 'background var(--dur-fast) ease, border-color var(--dur-fast) ease',
      }}
    >
      <FileText size={11} style={{ flexShrink: 0 }} />
      Page {page}
    </button>
  )
}

const MD_COMPONENTS = { a: MarkdownLink }

/**
 * ChatGPT-style thread rows — user prompt sits in a soft block at the top of
 * the exchange, the reply renders as full-width prose right below it, so long
 * answers use the whole column.
 */
function MessageRow({ message }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="msg-enter" style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          maxWidth: '80%',
          padding: '0.6rem 0.95rem',
          borderRadius: '16px',
          lineHeight: 1.6,
          background: 'var(--surface-2)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {message.content || <span style={{ opacity: 0.4 }}>…</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="msg-enter" style={{ width: '100%', lineHeight: 1.65, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
      {message.content
        ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
              {message.content}
            </ReactMarkdown>
          </div>
        )
        : <span style={{ opacity: 0.4 }}>…</span>
      }
    </div>
  )
}

const HINTS = ['Summarize this page', 'Explain the key concepts']

function EmptyState({ onHint }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '1rem', padding: '2rem', textAlign: 'center',
    }}>
      <Sparkles size={36} style={{ opacity: 0.18, color: 'var(--text-secondary)' }} />
      <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.5 }}>
        How can I help you study today?
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', width: '100%', maxWidth: '210px' }}>
        {HINTS.map((hint) => (
          <HintButton key={hint} label={hint} onClick={() => onHint(hint)} />
        ))}
      </div>
    </div>
  )
}

function HintButton({ label, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--border)' : 'none',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '0.4rem 0.75rem',
        fontSize: '0.8rem',
        fontFamily: 'inherit',
        color: hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'background 0.1s, color 0.1s',
      }}
    >
      {label}
    </button>
  )
}

function TypingIndicator() {
  return (
    <div className="msg-enter" style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '0.2rem 0' }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: 'var(--text-secondary)',
          animation: 'skeleton-pulse 1.2s ease-in-out infinite',
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  )
}
