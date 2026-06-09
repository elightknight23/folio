import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, X, ALargeSmall } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useSessionStore from '../../store/sessionStore'
import usePdfStore from '../../store/pdfStore'
import useChatStore from '../../store/chatStore'
import { streamMessage } from '../../services/chatService'
import useToast from '../../hooks/useToast'
import Toast from '../ui/Toast'

const FONT_SIZES = ['sm', 'md', 'lg']
const FONT_SIZE_PX = { sm: '13px', md: '15px', lg: '17px' }
const FONT_SIZE_KEY = 'folio-chat-fontsize'

function nextSize(current) {
  const idx = FONT_SIZES.indexOf(current)
  return FONT_SIZES[(idx + 1) % FONT_SIZES.length]
}

export default function AIChat({ pendingImage, onClearImage }) {
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
    () => localStorage.getItem(FONT_SIZE_KEY) ?? 'md'
  )
  const messagesEndRef = useRef(null)
  const { toasts, showToast } = useToast()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function cycleFontSize() {
    const next = nextSize(fontSize)
    setFontSize(next)
    localStorage.setItem(FONT_SIZE_KEY, next)
  }

  const send = useCallback(async (msg, imageData = null) => {
    if (!msg || isTyping || !activeSession?.id) return
    addMessage({ role: 'user', content: msg })
    addMessage({ role: 'assistant', content: '' })
    setTyping(true)
    try {
      const gen = streamMessage(activeSession.id, msg, currentPage, session.access_token, imageData)
      for await (const token of gen) {
        appendToLastMessage(token)
      }
    } catch (err) {
      // Remove the empty assistant bubble so the UI doesn't get stuck
      removeLastMessage()
      showToast(err.message ?? 'Something went wrong', 'error')
      console.error('[AIChat] stream error:', err)
    } finally {
      setTyping(false)
      onClearImage?.()
    }
  }, [isTyping, activeSession, currentPage, session, addMessage, appendToLastMessage, setTyping, removeLastMessage, onClearImage, showToast])

  // Tooltip actions write pendingPrompt to chatStore; pick it up and send automatically
  useEffect(() => {
    if (pendingPrompt && !isTyping) {
      const msg = pendingPrompt
      clearPendingPrompt()
      send(msg)
    }
  }, [pendingPrompt, isTyping, send, clearPendingPrompt])

  async function handleSend() {
    // Allow send when image is attached even if no text typed
    const msg = input.trim() || (pendingImage ? 'Describe this image.' : '')
    if (!msg) return
    setInput('')
    const imageData = pendingImage ? (pendingImage.split(',')[1] ?? null) : null
    await send(msg, imageData)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = !isTyping && (input.trim().length > 0 || !!pendingImage)
  const fz = FONT_SIZE_PX[fontSize]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontSize: fz }}>

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
        <button
          onClick={cycleFontSize}
          title={`Text size: ${fontSize.toUpperCase()} — click to cycle`}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', padding: '2px 6px',
            borderRadius: '4px', fontSize: '0.7rem', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: '3px',
          }}
        >
          <ALargeSmall size={14} />
          {fontSize.toUpperCase()}
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6, maxWidth: '220px' }}>
              Ask anything about this document. I know what page you're on.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isTyping && messages[messages.length - 1]?.content === '' && (
          <TypingIndicator />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attached image thumbnail */}
      {pendingImage && (
        <div style={{ padding: '0.5rem 0.75rem 0', flexShrink: 0 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={pendingImage}
              alt="Attached crop"
              style={{ height: '64px', borderRadius: '6px', border: '1px solid var(--border)', display: 'block' }}
            />
            <button
              onClick={onClearImage}
              style={{
                position: 'absolute', top: '-6px', right: '-6px',
                width: '18px', height: '18px', borderRadius: '50%',
                background: 'var(--text-secondary)', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
              }}
            >
              <X size={10} color="white" />
            </button>
          </div>
        </div>
      )}

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
