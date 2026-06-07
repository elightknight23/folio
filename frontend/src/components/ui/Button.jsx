const styles = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontFamily: 'inherit',
    fontWeight: 500,
    borderRadius: '8px',
    cursor: 'pointer',
    border: 'none',
    transition: 'opacity 0.15s, background 0.15s',
  },
  size: {
    sm: { padding: '0.35rem 0.75rem', fontSize: '0.8rem' },
    md: { padding: '0.55rem 1.1rem', fontSize: '0.9rem' },
  },
  variant: {
    primary: {
      background: 'var(--accent)',
      color: 'var(--on-accent)',
      border: 'none',
    },
    secondary: {
      background: 'transparent',
      color: 'var(--accent)',
      border: '1px solid var(--accent)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--accent)',
      border: 'none',
    },
  },
}

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children,
  style: extraStyle,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles.base,
        ...styles.size[size],
        ...styles.variant[variant],
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...extraStyle,
      }}
    >
      {children}
    </button>
  )
}
