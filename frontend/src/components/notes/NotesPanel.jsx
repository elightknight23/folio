import { useState, useEffect, useRef } from 'react'
import useSessionStore from '../../store/sessionStore'
import { updateSession } from '../../services/sessionService'
import useToast from '../../hooks/useToast'
import Toast from '../ui/Toast'

export default function NotesPanel() {
  const session = useSessionStore((s) => s.session)
  const activeSession = useSessionStore((s) => s.activeSession)
  const updateActiveSession = useSessionStore((s) => s.updateActiveSession)
  const { toasts, showToast } = useToast()

  const [text, setText] = useState(activeSession?.notes ?? '')
  const [saveStatus, setSaveStatus] = useState('idle') // 'idle' | 'saving' | 'saved'
  const saveRef = useRef(null)

  // Sync local text when switching sessions
  useEffect(() => {
    setText(activeSession?.notes ?? '')
    setSaveStatus('idle')
  }, [activeSession?.id])

  // 1000ms debounced auto-save
  useEffect(() => {
    if (text === (activeSession?.notes ?? '')) return

    setSaveStatus('saving')
    clearTimeout(saveRef.current)
    saveRef.current = setTimeout(async () => {
      try {
        await updateSession(activeSession.id, { notes: text }, session.access_token)
        updateActiveSession({ notes: text })
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch (err) {
        setSaveStatus('idle')
        showToast(err.message || 'Failed to save notes', 'error')
      }
    }, 1000)

    return () => clearTimeout(saveRef.current)
  }, [text])

  const statusLabel = saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: '0.75rem', fontWeight: 600,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          My Notes
        </span>
        {statusLabel && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.8 }}>
            {statusLabel}
          </span>
        )}
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write anything…"
        style={{
          flex: 1,
          resize: 'none',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          color: 'var(--text-primary)',
          lineHeight: 1.7,
          padding: '1rem',
          overflowY: 'auto',
        }}
      />

      <Toast toasts={toasts} />
    </div>
  )
}
