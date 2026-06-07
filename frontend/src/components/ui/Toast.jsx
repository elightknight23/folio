const variantColor = {
  success: '#0f9f6e',
  error: '#e03e3e',
  info: 'var(--accent)',
}

export default function Toast({ toasts }) {
  if (!toasts.length) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        zIndex: 1000,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            padding: '0.65rem 1rem',
            background: 'var(--bg)',
            border: `1px solid var(--border)`,
            borderLeft: `3px solid ${variantColor[t.variant] ?? variantColor.info}`,
            borderRadius: '6px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            maxWidth: '320px',
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
