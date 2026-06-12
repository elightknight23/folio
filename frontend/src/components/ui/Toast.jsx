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
          className="scale-in glass"
          style={{
            padding: '0.7rem 1rem',
            borderLeft: `3px solid ${variantColor[t.variant] ?? variantColor.info}`,
            borderRadius: '12px',
            boxShadow: 'var(--shadow-lg)',
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
