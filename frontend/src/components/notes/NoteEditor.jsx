import { useRef, useEffect } from 'react'
import { Bold, Italic, Underline, Strikethrough, Highlighter, List } from 'lucide-react'

// execCommand writes a literal inline color, so a CSS variable can't be used.
// Translucent amber keeps highlighted text readable on both note papers and themes.
const HIGHLIGHT_COLOR = 'rgba(255, 196, 0, 0.4)'

const TOOLS = [
  { command: 'bold', title: 'Bold (⌘B)', Icon: Bold },
  { command: 'italic', title: 'Italic (⌘I)', Icon: Italic },
  { command: 'underline', title: 'Underline (⌘U)', Icon: Underline },
  { command: 'strikeThrough', title: 'Strikethrough', Icon: Strikethrough },
  { command: 'hiliteColor', title: 'Highlight', Icon: Highlighter },
  { command: 'insertUnorderedList', title: 'Bullet list', Icon: List },
]

/**
 * Minimal rich-text editor for sticky notes — contentEditable plus a small
 * formatting toolbar (revealed by .note-editor-wrap CSS on hover/focus).
 * Value in/out is an HTML string; the parent owns persistence.
 */
export default function NoteEditor({ html, placeholder, autoFocus, onChange }) {
  const ref = useRef(null)

  // Sync external value without clobbering the caret mid-typing
  useEffect(() => {
    const el = ref.current
    if (el && el.innerHTML !== (html || '') && document.activeElement !== el) {
      el.innerHTML = html || ''
    }
  }, [html])

  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])

  function exec(command) {
    const el = ref.current
    if (!el) return
    el.focus()
    if (command === 'hiliteColor') {
      // Toggle: if the selection already carries our highlight, clear it
      const current = String(document.queryCommandValue('hiliteColor') || '')
      const already = current.startsWith('rgba(255, 196, 0')
      document.execCommand('hiliteColor', false, already ? 'transparent' : HIGHLIGHT_COLOR)
    } else {
      document.execCommand(command, false, null)
    }
    onChange(el.innerHTML)
  }

  return (
    <div className="note-editor-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {/* Toolbar — visibility handled in globals.css */}
      <div className="note-toolbar" style={{ display: 'flex', gap: '1px' }}>
        {TOOLS.map(({ command, title, Icon }) => (
          <button
            key={command}
            title={title}
            // mousedown + preventDefault keeps the text selection alive
            onMouseDown={(e) => { e.preventDefault(); exec(command) }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '22px', height: '22px',
              background: 'transparent', border: 'none',
              borderRadius: '5px', padding: 0,
              color: 'inherit', opacity: 0.55,
              cursor: 'pointer',
              transition: 'opacity var(--dur-fast) ease, background var(--dur-fast) ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = 1
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = 0.55
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <Icon size={13} />
          </button>
        ))}
      </div>

      <div
        ref={ref}
        className="note-editor"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        style={{
          outline: 'none',
          fontFamily: 'inherit',
          fontSize: '0.85rem',
          color: 'inherit',
          caretColor: 'currentColor',
          lineHeight: 1.6,
          minHeight: '2.6em',
          width: '100%',
          wordBreak: 'break-word',
        }}
      />
    </div>
  )
}
