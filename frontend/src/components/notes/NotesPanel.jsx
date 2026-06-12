import { useState, useEffect, useRef, useMemo } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import useSessionStore from '../../store/sessionStore'
import usePdfStore from '../../store/pdfStore'
import useNotesStore from '../../store/notesStore'
import NoteEditor from './NoteEditor'
import { updateSession } from '../../services/sessionService'
import useToast from '../../hooks/useToast'
import Toast from '../ui/Toast'

const NOTE_COLORS = ['yellow', 'blue', 'pink', 'green']

// Natural, uneven tilt — deterministic per position so the stack is stable
const TILTS = ['-0.9deg', '1.1deg', '-0.5deg', '0.8deg', '-1.2deg', '0.6deg']

function escapeToHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}

/**
 * Notes are stored as JSON in the existing `sessions.notes` text column:
 * v2: `{ v: 2, notes: [{ id, html, color, page, quote, createdAt }] }`
 * v1 notes carried plain `text` and no page — migrated on load (page: null
 * groups under "General"). Legacy plain-text becomes a single yellow note.
 */
function parseNotes(raw) {
  if (!raw) return []
  try {
    const data = JSON.parse(raw)
    if (Array.isArray(data?.notes)) {
      return data.notes.map((n) => ({
        id: n.id ?? crypto.randomUUID(),
        html: n.html ?? escapeToHtml(n.text ?? ''),
        color: n.color ?? 'yellow',
        page: n.page ?? null,
        quote: n.quote ?? null,
        createdAt: n.createdAt ?? new Date().toISOString(),
      }))
    }
  } catch {
    // Legacy plain-text — fall through to migration below
  }
  return [{
    id: crypto.randomUUID(),
    html: escapeToHtml(raw),
    color: 'yellow',
    page: null,
    quote: null,
    createdAt: new Date().toISOString(),
  }]
}

function serializeNotes(notes) {
  return JSON.stringify({ v: 2, notes })
}

export default function NotesPanel() {
  const session = useSessionStore((s) => s.session)
  const activeSession = useSessionStore((s) => s.activeSession)
  const updateActiveSession = useSessionStore((s) => s.updateActiveSession)
  const currentPage = usePdfStore((s) => s.currentPage)
  const pendingNote = useNotesStore((s) => s.pendingNote)
  const { toasts, showToast } = useToast()

  const [notes, setNotes] = useState(() => parseNotes(activeSession?.notes))
  // 'all' shows every note grouped by page; 'current' follows the PDF page;
  // a number pins the view to that specific page
  const [filter, setFilter] = useState('all')
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
    setFilter('all')
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

  const createNote = (extra = {}) => {
    const note = {
      id: crypto.randomUUID(),
      html: '',
      color: NOTE_COLORS[notes.length % NOTE_COLORS.length],
      page: typeof filter === 'number' ? filter : currentPage,
      quote: null,
      createdAt: new Date().toISOString(),
      ...extra,
    }
    setNewNoteId(note.id)
    setNotes((prev) => [note, ...prev])
    return note
  }

  // Highlight tooltip's "Note" action — create a note anchored to the quote
  useEffect(() => {
    if (!pendingNote) return
    createNote({ quote: pendingNote.quote, page: pendingNote.page })
    setFilter('current')
    useNotesStore.getState().clearPendingNote()
  }, [pendingNote])

  const updateNote = (id, html) =>
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, html } : n)))

  const recolorNote = (id, color) =>
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, color } : n)))

  const deleteNote = (id) =>
    setNotes((prev) => prev.filter((n) => n.id !== id))

  const filterPage = filter === 'current' ? currentPage : filter
  const visibleNotes = filter === 'all'
    ? notes
    : notes.filter((n) => n.page === filterPage)

  // All-pages view groups notes under page headers, page order ascending,
  // page-less (legacy) notes last under "General"
  const groups = useMemo(() => {
    if (filter !== 'all') return null
    const byPage = new Map()
    for (const note of notes) {
      const key = note.page ?? 'general'
      if (!byPage.has(key)) byPage.set(key, [])
      byPage.get(key).push(note)
    }
    return [...byPage.entries()].sort(([a], [b]) => {
      if (a === 'general') return 1
      if (b === 'general') return -1
      return a - b
    })
  }, [notes, filter])

  const statusLabel = saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{
        padding: '0.75rem 1rem 0.6rem',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        display: 'flex', flexDirection: 'column', gap: '0.6rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
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
              onClick={() => createNote()}
              title={`Add note on page ${typeof filter === 'number' ? filter : currentPage}`}
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

        {/* View filter — all pages / this page / pinned page */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <FilterChip
            label="All pages"
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <FilterChip
            label={`This page · ${currentPage}`}
            active={filter === 'current'}
            onClick={() => setFilter('current')}
          />
          {typeof filter === 'number' && (
            <FilterChip
              label={`Page ${filter}`}
              active
              onClear={() => setFilter('all')}
            />
          )}
        </div>
      </div>

      {/* Note stack */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '1.25rem 1rem 1.5rem',
        display: 'flex', flexDirection: 'column', gap: '1.15rem',
      }}>
        {visibleNotes.length === 0 ? (
          <button
            onClick={() => createNote()}
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
            {filter === 'all'
              ? 'Add your first note'
              : `Add a note for page ${filterPage}`}
          </button>
        ) : filter === 'all' ? (
          groups.map(([page, pageNotes]) => (
            <div key={page} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <button
                onClick={() => { if (page !== 'general') setFilter(page) }}
                title={page === 'general' ? undefined : `View only page ${page}`}
                style={{
                  alignSelf: 'flex-start',
                  background: 'transparent', border: 'none', padding: 0,
                  fontFamily: 'inherit',
                  fontSize: '0.68rem', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                  cursor: page === 'general' ? 'default' : 'pointer',
                  transition: 'color var(--dur-fast) ease',
                }}
                onMouseEnter={(e) => { if (page !== 'general') e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                {page === 'general' ? 'General' : `Page ${page}`} · {pageNotes.length}
              </button>
              {pageNotes.map((note, i) => (
                <StickyNote
                  key={note.id}
                  note={note}
                  tilt={TILTS[i % TILTS.length]}
                  isNew={note.id === newNoteId}
                  showPage={false}
                  onChange={(html) => updateNote(note.id, html)}
                  onRecolor={(color) => recolorNote(note.id, color)}
                  onDelete={() => deleteNote(note.id)}
                />
              ))}
            </div>
          ))
        ) : (
          visibleNotes.map((note, i) => (
            <StickyNote
              key={note.id}
              note={note}
              tilt={TILTS[i % TILTS.length]}
              isNew={note.id === newNoteId}
              showPage
              onChange={(html) => updateNote(note.id, html)}
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

function FilterChip({ label, active, onClick, onClear }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClear ?? onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.3rem',
        padding: '0.22rem 0.6rem',
        background: active ? 'var(--surface-2)' : hovered ? 'color-mix(in srgb, var(--surface-2) 55%, transparent)' : 'transparent',
        border: `1px solid ${active ? 'var(--border-strong)' : 'var(--border)'}`,
        borderRadius: '999px',
        fontFamily: 'inherit', fontSize: '0.7rem', fontWeight: 600,
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'background var(--dur-fast) ease, color var(--dur-fast) ease, border-color var(--dur-fast) ease',
      }}
    >
      {label}
      {onClear && <X size={10} style={{ opacity: 0.7 }} />}
    </button>
  )
}

function StickyNote({ note, tilt, isNew, showPage, onChange, onRecolor, onDelete }) {
  const [hovered, setHovered] = useState(false)

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
      {/* Anchored highlight — the passage this note was made on */}
      {note.quote && (
        <blockquote style={{
          margin: 0,
          padding: '0.15rem 0 0.15rem 0.55rem',
          borderLeft: '2px solid currentColor',
          fontSize: '0.74rem',
          fontStyle: 'italic',
          lineHeight: 1.5,
          opacity: 0.7,
          wordBreak: 'break-word',
        }}>
          “{note.quote}”
        </blockquote>
      )}

      <NoteEditor
        html={note.html}
        placeholder={note.quote ? 'Add your note…' : 'Write anything…'}
        autoFocus={isNew}
        onChange={onChange}
      />

      {/* Footer — date + page, color swatches on hover, delete on hover */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        minHeight: '20px',
      }}>
        <span style={{ fontSize: '0.62rem', fontWeight: 600, opacity: 0.55, letterSpacing: '0.03em' }}>
          {dateLabel}
          {showPage && note.page != null && ` · p. ${note.page}`}
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
