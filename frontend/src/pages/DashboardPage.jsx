import useSessionStore from '../store/sessionStore'
import { signOut } from '../services/authService'

export default function DashboardPage() {
  const user = useSessionStore((s) => s.user)
  const name = user?.user_metadata?.full_name ?? user?.email ?? 'there'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-background)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 2rem',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '1rem' }}>
          Folio
        </span>
        <button
          onClick={signOut}
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: '0.4rem 0.85rem',
            fontSize: '0.85rem',
            color: 'var(--color-text-secondary)',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </header>

      {/* Body */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2rem',
          padding: '4rem 2rem',
        }}
      >
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            Welcome, {name}
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', margin: 0 }}>
            Your documents will appear here.
          </p>
        </div>

        <button
          style={{
            padding: '0.65rem 1.4rem',
            background: 'var(--color-accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius)',
            fontSize: '0.9rem',
            fontWeight: 500,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          Upload your first PDF
        </button>
      </main>
    </div>
  )
}
