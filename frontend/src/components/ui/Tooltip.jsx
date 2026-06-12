import { useEffect, useRef, useState } from 'react'
import { StickyNote } from 'lucide-react'

const ACTIONS = ['Explain', 'Define', 'Summarize']

export default function SelectionTooltip({ text, rect, onAction, onDismiss }) {
  const ref = useRef(null)

  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onDismiss() }
    // mousedown outside dismisses the tooltip
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onDismiss()
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClick)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [onDismiss])

  // Center tooltip horizontally on the selection; position below it
  const left = rect.left + rect.width / 2
  const top = rect.bottom + 6

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top,
        left,
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '4px',
        userSelect: 'none',
      }}
    >
      {ACTIONS.map((action) => (
        <TooltipButton
          key={action}
          label={action}
          // mousedown instead of click so we fire before the selection clears
          onMouseDown={(e) => {
            e.preventDefault()
            onAction(action, text)
          }}
        />
      ))}

      {/* Divider — note creation is a different kind of action */}
      <div style={{ width: '1px', alignSelf: 'stretch', margin: '3px 2px', background: 'var(--border)' }} />

      <TooltipButton
        label="Note"
        icon={<StickyNote size={12} />}
        onMouseDown={(e) => {
          e.preventDefault()
          onAction('Note', text)
        }}
      />
    </div>
  )
}

function TooltipButton({ label, icon, onMouseDown }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        background: hovered ? 'var(--border)' : 'none',
        border: 'none',
        borderRadius: '6px',
        padding: '4px 10px',
        fontSize: '0.8rem',
        fontFamily: 'inherit',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'background 0.1s',
      }}
    >
      {icon}
      {label}
    </button>
  )
}
