import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, ALargeSmall, Sparkles } from 'lucide-react'
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

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.length === 0 && (
          <EmptyState onHint={setInput} />
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isTyping && messages[messages.length - 1]?.content === '' && (
          <TypingIndicator />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '0.75rem', borderTop: '1px solid var(--border)',
        display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexShrink: 0,
      }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this PDF…"
          rows={1}
          disabled={isTyping}
          style={{
            flex: 1, resize: 'none',
            border: '1px solid var(--border)', borderRadius: '8px',
            padding: '0.5rem 0.75rem', fontFamily: 'inherit', fontSize: 'inherit',
            background: 'var(--bg)', color: 'var(--text-primary)',
            outline: 'none', lineHeight: 1.5, opacity: isTyping ? 0.6 : 1,
          }}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '34px', height: '34px', flexShrink: 0,
            background: canSend ? 'var(--accent)' : 'var(--border)',
            border: 'none', borderRadius: '8px',
            cursor: canSend ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s',
          }}
        >
          <Send size={15} color={canSend ? 'white' : 'var(--text-secondary)'} />
        </button>
      </div>

      <Toast toasts={toasts} />
    </div>
  )
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '85%', padding: '0.5rem 0.75rem', borderRadius: '8px',
        lineHeight: 1.6,
        background: isUser ? 'var(--accent)' : 'var(--bg)',
        color: isUser ? 'white' : 'var(--text-primary)',
        border: isUser ? 'none' : '1px solid var(--border)',
        whiteSpace: isUser ? 'pre-wrap' : undefined,
        wordBreak: 'break-word',
      }}>
        {isUser
          ? (message.content || <span style={{ opacity: 0.4 }}>…</span>)
          : message.content
            ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            )
            : <span style={{ opacity: 0.4 }}>…</span>
        }
      </div>
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
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div style={{
        padding: '0.5rem 0.85rem', borderRadius: '8px',
        background: 'var(--bg)', border: '1px solid var(--border)',
        display: 'flex', gap: '4px', alignItems: 'center',
      }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: 'var(--text-secondary)',
            animation: 'skeleton-pulse 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  )
}
