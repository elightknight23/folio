import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import useSessionStore from '../../store/sessionStore'
import { updateSession } from '../../services/sessionService'
import useToast from '../../hooks/useToast'
import Toast from '../ui/Toast'

const NOTE_COLORS = ['yellow', 'blue', 'pink', 'green']

// Natural, uneven tilt — deterministic per position so the stack is stable
const TILTS = ['-0.9deg', '1.1deg', '-0.5deg', '0.8deg', '-1.2deg', '0.6deg']

/**
 * Notes are stored as JSON in the existing `sessions.notes` text column:
 * `{ v: 1, notes: [{ id, text, color, createdAt }] }`.
 * Legacy plain-text notes are migrated into a single yellow note on load.
 */
function parseNotes(raw) {
  if (!raw) return []
  try {
    const data = JSON.parse(raw)
    if (Array.isArray(data?.notes)) return data.notes
  } catch {
    // Legacy plain-text — fall through to migration below
  }
  return [{
    id: crypto.randomUUID(),
    text: raw,
    color: 'yellow',
    createdAt: new Date().toISOString(),
  }]
}

function serializeNotes(notes) {
  return JSON.stringify({ v: 1, notes })
}

export default function NotesPanel() {
  const session = useSessionStore((s) => s.session)
  const activeSession = useSessionStore((s) => s.activeSession)
  const updateActiveSession = useSessionStore((s) => s.updateActiveSession)
  const { toasts, showToast } = useToast()

  const [notes, setNotes] = useState(() => parseNotes(activeSession?.notes))
  const [saveStatus, setSaveStatus] = useState('idle') // 'idle' | 'saving' | 'saved'
  const [newNoteId, setNewNoteId] = useState(null)
  const saveRef = useRef(null)
  const lastSavedRef = useRef(undefined)

  // Baseline for the very first render — only user edits trigger a save
  if (lastSavedRef.current === undefined) {
    lastSavedRef.current = serializeNotes(notes)
  }

  // Sync local notes when switching sessions
  useEffect(() => {
    const parsed = parseNotes(activeSession?.notes)
    setNotes(parsed)
    lastSavedRef.current = serializeNotes(parsed)
    setSaveStatus('idle')
    setNewNoteId(null)
  }, [activeSession?.id])

  // 1000ms debounced auto-save of the whole stack
  useEffect(() => {
    const serialized = serializeNotes(notes)
    if (serialized === lastSavedRef.current) return

    setSaveStatus('saving')
    clearTimeout(saveRef.current)
    saveRef.current = setTimeout(async () => {
      try {
        await updateSession(activeSession.id, { notes: serialized }, session.access_token)
        updateActiveSession({ notes: serialized })
        lastSavedRef.current = serialized
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch (err) {
        setSaveStatus('idle')
        showToast(err.message || 'Failed to save notes', 'error')
      }
    }, 1000)

    return () => clearTimeout(saveRef.current)
  }, [notes])

  const addNote = () => {
    const note = {
      id: crypto.randomUUID(),
      text: '',
      color: NOTE_COLORS[notes.length % NOTE_COLORS.length],
      createdAt: new Date().toISOString(),
    }
    setNewNoteId(note.id)
    setNotes((prev) => [note, ...prev])
  }

  const updateNote = (id, text) =>
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)))

  const recolorNote = (id, color) =>
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, color } : n)))

  const deleteNote = (id) =>
    setNotes((prev) => prev.filter((n) => n.id !== id))

  const statusLabel = saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '0.5rem',
      }}>
        <span style={{
          fontSize: '0.75rem', fontWeight: 600,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          Notes
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {statusLabel && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.8 }}>
              {statusLabel}
            </span>
          )}
          <button
            onClick={addNote}
            title="Add note"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '24px', height: '24px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '7px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'color var(--dur-fast) ease, border-color var(--dur-fast) ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)'
              e.currentTarget.style.borderColor = 'var(--border-strong)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Note stack */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '1.25rem 1rem 1.5rem',
        display: 'flex', flexDirection: 'column', gap: '1.15rem',
      }}>
        {notes.length === 0 ? (
          <button
            onClick={addNote}
            style={{
              border: '1px dashed var(--border-strong)',
              borderRadius: '10px',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontFamily: 'inherit', fontSize: '0.82rem',
              padding: '1.5rem 1rem',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              transition: 'color var(--dur-fast) ease, border-color var(--dur-fast) ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)'
              e.currentTarget.style.borderColor = 'var(--text-secondary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)'
              e.currentTarget.style.borderColor = 'var(--border-strong)'
            }}
          >
            <Plus size={14} />
            Add your first note
          </button>
        ) : (
          notes.map((note, i) => (
            <StickyNote
              key={note.id}
              note={note}
              tilt={TILTS[i % TILTS.length]}
              isNew={note.id === newNoteId}
              onChange={(text) => updateNote(note.id, text)}
              onRecolor={(color) => recolorNote(note.id, color)}
              onDelete={() => deleteNote(note.id)}
            />
          ))
        )}
      </div>

      <Toast toasts={toasts} />
    </div>
  )
}

function StickyNote({ note, tilt, isNew, onChange, onRecolor, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const textareaRef = useRef(null)

  // Auto-grow the textarea to fit its content
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [note.text])

  useEffect(() => {
    if (isNew) textareaRef.current?.focus()
  }, [isNew])

  const dateLabel = new Date(note.createdAt).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric',
  })

  return (
    <div
      className={`sticky-note${isNew ? ' note-enter' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        '--note-tilt': tilt,
        background: `var(--note-${note.color}-bg)`,
        color: `var(--note-${note.color}-ink)`,
        padding: '1.1rem 0.9rem 0.6rem',
        display: 'flex', flexDirection: 'column', gap: '0.4rem',
        flexShrink: 0,
      }}
    >
      <textarea
        ref={textareaRef}
        value={note.text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write anything…"
        rows={2}
        style={{
          resize: 'none',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: 'inherit',
          fontSize: '0.85rem',
          color: 'inherit',
          caretColor: 'currentColor',
          lineHeight: 1.6,
          overflow: 'hidden',
          width: '100%',
          padding: 0,
        }}
      />

      {/* Footer — date, color swatches on hover, delete on hover */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        minHeight: '20px',
      }}>
        <span style={{ fontSize: '0.62rem', fontWeight: 600, opacity: 0.55, letterSpacing: '0.03em' }}>
          {dateLabel}
        </span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.45rem',
          opacity: hovered ? 1 : 0,
          transition: 'opacity var(--dur-fast) ease',
        }}>
          {NOTE_COLORS.filter((c) => c !== note.color).map((color) => (
            <button
              key={color}
              onClick={() => onRecolor(color)}
              title={`Make ${color}`}
              style={{
                width: '12px', height: '12px',
                borderRadius: '50%',
                background: `var(--note-${color}-bg)`,
                border: `1px solid var(--note-${color}-ink)`,
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
          <button
            onClick={onDelete}
            title="Delete note"
            style={{
              display: 'flex', alignItems: 'center',
              background: 'transparent', border: 'none',
              color: 'inherit', opacity: 0.6,
              cursor: 'pointer', padding: '2px',
              marginLeft: '0.1rem',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = 1 }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.6 }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
