import { useRef, useState } from 'react'
import useSessionStore from '../store/sessionStore'
import { signOut } from '../services/authService'

const BACKEND_URL = 'http://localhost:8000'

export default function DashboardPage() {
  const user = useSessionStore((s) => s.user)
  const name = user?.user_metadata?.full_name ?? user?.email ?? 'there'
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [uploadError, setUploadError] = useState(null)

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadResult(null)
    setUploadError(null)

    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${BACKEND_URL}/upload`, { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail ?? 'Upload failed')
      }
      const data = await res.json()
      setUploadResult(data)
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-background)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
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

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            padding: '0.65rem 1.4rem',
            background: 'var(--color-accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius)',
            fontSize: '0.9rem',
            fontWeight: 500,
            fontFamily: 'inherit',
            cursor: uploading ? 'not-allowed' : 'pointer',
            opacity: uploading ? 0.7 : 1,
          }}
        >
          {uploading ? 'Uploading…' : 'Upload your first PDF'}
        </button>

        {uploadResult && (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            ✓ {uploadResult.filename} uploaded — {uploadResult.page_count} pages
          </p>
        )}

        {uploadError && (
          <p style={{ color: '#e03e3e', fontSize: '0.875rem', margin: 0 }}>
            {uploadError}
          </p>
        )}
      </main>
    </div>
  )
}
