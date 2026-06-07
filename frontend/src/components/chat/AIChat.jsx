import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import useSessionStore from '../../store/sessionStore'
import usePdfStore from '../../store/pdfStore'
import useChatStore from '../../store/chatStore'
import { streamMessage } from '../../services/chatService'

export default function AIChat() {
  const session = useSessionStore((s) => s.session)
  const activeSession = useSessionStore((s) => s.activeSession)
  const currentPage = usePdfStore((s) => s.currentPage)
  const { messages, isTyping, addMessage, appendToLastMessage, setTyping } = useChatStore()

  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const msg = input.trim()
    if (!msg || isTyping || !activeSession?.id) return

    setInput('')
    addMessage({ role: 'user', content: msg })
    addMessage({ role: 'assistant', content: '' })
    setTyping(true)

    try {
      const gen = streamMessage(activeSession.id, msg, currentPage, session.access_token)
      for await (const token of gen) {
        appendToLastMessage(token)
      }
    } catch (err) {
      appendToLastMessage(`\n\n[Error: ${err.message}]`)
    } finally {
      setTyping(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          AI Assistant
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: '0.5rem', opacity: 0.7 }}>
          · page {currentPage}
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6, maxWidth: '220px' }}>
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

      {/* Input */}
      <div style={{
        padding: '0.75rem',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'flex-end',
        flexShrink: 0,
      }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this PDF…"
          rows={1}
          disabled={isTyping}
          style={{
            flex: 1,
            resize: 'none',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '0.5rem 0.75rem',
            fontFamily: 'inherit',
            fontSize: '0.875rem',
            background: 'var(--bg)',
            color: 'var(--text-primary)',
            outline: 'none',
            lineHeight: 1.5,
            opacity: isTyping ? 0.6 : 1,
          }}
        />
        <button
          onClick={handleSend}
          disabled={isTyping || !input.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '34px',
            height: '34px',
            flexShrink: 0,
            background: isTyping || !input.trim() ? 'var(--border)' : 'var(--accent)',
            border: 'none',
            borderRadius: '8px',
            cursor: isTyping || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          <Send size={15} color={isTyping || !input.trim() ? 'var(--text-secondary)' : 'white'} />
        </button>
      </div>
    </div>
  )
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '85%',
        padding: '0.5rem 0.75rem',
        borderRadius: '8px',
        fontSize: '0.875rem',
        lineHeight: 1.6,
        background: isUser ? 'var(--accent)' : 'var(--bg)',
        color: isUser ? 'white' : 'var(--text-primary)',
        border: isUser ? 'none' : '1px solid var(--border)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {message.content || <span style={{ opacity: 0.4 }}>…</span>}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div style={{
        padding: '0.5rem 0.85rem',
        borderRadius: '8px',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
      }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--text-secondary)',
            animation: 'skeleton-pulse 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  )
}
