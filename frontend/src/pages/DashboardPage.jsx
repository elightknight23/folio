import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Plus, Trash2, Sun, Moon } from 'lucide-react'
import useSessionStore from '../store/sessionStore'
import useLayoutStore from '../store/layoutStore'
import { signOut } from '../services/authService'
import { uploadPDF } from '../services/pdfService'
import { fetchUserSessions, deleteSession } from '../services/sessionService'
import { MAX_PDFS, MAX_PDF_SIZE_MB, MAX_PDF_PAGES } from '../constants'
import Skeleton from '../components/ui/Skeleton'
import useToast from '../hooks/useToast'
import Toast from '../components/ui/Toast'

export default function DashboardPage() {
  const user = useSessionStore((s) => s.user)
  const session = useSessionStore((s) => s.session)
  const name = user?.user_metadata?.full_name ?? user?.email ?? 'there'
  const avatarUrl = user?.user_metadata?.avatar_url
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const { toasts, showToast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [sessions, setSessions] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadHover, setUploadHover] = useState(false)

  const atLimit = sessions.length >= MAX_PDFS

  useEffect(() => {
    if (!session?.access_token) return
    fetchUserSessions(session.access_token)
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setIsLoading(false))
  }, [session])

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_PDF_SIZE_MB * 1024 * 1024) {
      showToast(`File exceeds ${MAX_PDF_SIZE_MB}MB limit`, 'error')
      e.target.value = ''
      return
    }

    setUploading(true)
    try {
      await uploadPDF(file, session.access_token)
      // Refetch so the new card appears — user clicks Continue when ready
      const updated = await fetchUserSessions(session.access_token)
      setSessions(updated)
      showToast('PDF uploaded successfully', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <header className="glass" style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2.5rem',
        height: '64px',
        borderLeft: 'none',
        borderRight: 'none',
        borderTop: 'none',
      }}>
        <span style={{ fontWeight: 700, fontSize: '1.45rem', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>folio</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ThemeToggle />
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt={name}
              referrerPolicy="no-referrer"
              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
            />
          )}
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{name}</span>
          <button
            onClick={signOut}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Body */}
      <main style={{
        flex: 1,
        maxWidth: '800px',
        width: '100%',
        margin: '0 auto',
        padding: '3rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
      }}>
        <h1 className="fade-up" style={{ margin: 0, fontSize: '1.9rem', fontWeight: 400, fontFamily: "'DM Serif Display', serif", color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Your Library
        </h1>

        {/* Upload area */}
        <div className="fade-up" style={{ animationDelay: '80ms' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div
            onClick={() => !atLimit && !uploading && fileInputRef.current?.click()}
            onMouseEnter={() => setUploadHover(true)}
            onMouseLeave={() => setUploadHover(false)}
            style={{
              border: `1.5px dashed ${uploadHover && !atLimit ? 'color-mix(in srgb, var(--accent) 50%, var(--border))' : 'var(--border)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              cursor: atLimit || uploading ? 'not-allowed' : 'pointer',
              background: uploadHover && !atLimit ? 'var(--surface)' : 'transparent',
              opacity: atLimit ? 0.5 : 1,
              boxShadow: uploadHover && !atLimit ? 'var(--shadow-glow)' : 'none',
              transition: 'background var(--dur-fast) ease, border-color var(--dur-fast) ease, box-shadow var(--dur-med) var(--ease-out)',
            }}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: uploadHover && !atLimit ? 'translateY(-2px) scale(1.06)' : 'none',
              transition: 'transform var(--dur-med) var(--ease-spring)',
            }}>
              <Plus size={18} color={uploadHover && !atLimit ? 'var(--accent)' : 'var(--text-secondary)'} style={{ transition: 'color var(--dur-fast) ease' }} />
            </div>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500, letterSpacing: '-0.01em' }}>
              {uploading ? 'Uploading…' : atLimit ? `You've reached the ${MAX_PDFS} PDF limit` : 'Upload a PDF'}
            </span>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Max {MAX_PDF_SIZE_MB}MB &middot; Max {MAX_PDF_PAGES} pages &middot; {MAX_PDFS} PDFs per account
            </span>
          </div>
        </div>

        {/* Sessions grid */}
        {isLoading ? (
          <SkeletonGrid />
        ) : sessions.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1rem',
          }}>
            {sessions.map((s, i) => (
              <div key={s.id} className="fade-up" style={{ animationDelay: `${160 + i * 70}ms` }}>
                <SessionCard
                  session={s}
                  onContinue={() => navigate(`/workdesk/${s.id}`)}
                  onDelete={async () => {
                    await deleteSession(s.id, session.access_token)
                    setSessions((prev) => prev.filter((x) => x.id !== s.id))
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <Toast toasts={toasts} />
    </div>
  )
}

function ThemeToggle() {
  const theme = useLayoutStore((s) => s.theme)
  const setTheme = useLayoutStore((s) => s.setTheme)
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '32px', height: '32px',
        background: hovered ? 'var(--surface-2)' : 'transparent',
        border: '1px solid transparent',
        borderRadius: '8px',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        transform: hovered ? 'rotate(12deg)' : 'rotate(0deg)',
        transition: 'background var(--dur-fast) ease, transform var(--dur-med) var(--ease-spring)',
      }}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}

function EmptyState() {
  return (
    <div className="fade-up" style={{ animationDelay: '160ms', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '4.5rem 0' }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '18px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <FileText size={26} color="var(--text-secondary)" style={{ opacity: 0.7 }} />
      </div>
      <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.05rem', letterSpacing: '-0.015em' }}>No PDFs yet</p>
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        Upload your first PDF to get started
      </p>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          <Skeleton width="60%" height="1rem" />
          <Skeleton width="40%" height="0.75rem" />
          <Skeleton width="80px" height="0.75rem" />
        </div>
      ))}
    </div>
  )
}

function SessionCard({ session, onContinue, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const date = new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  async function handleDelete() {
    setDeleting(true)
    try {
      await onDelete()
    } catch {
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); if (!deleting) setConfirming(false) }}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${confirming ? '#e03e3e' : hovered ? 'var(--border-strong)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '1.15rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        transform: hovered && !confirming ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transition: 'transform var(--dur-med) var(--ease-out), box-shadow var(--dur-med) var(--ease-out), border-color var(--dur-fast) ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FileText size={16} color="var(--text-secondary)" />
        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {session.filename}
        </span>
        {hovered && !confirming && (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirming(true) }}
            title="Delete"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', color: 'var(--text-secondary)', borderRadius: '4px' }}
            onMouseEnter={e => e.currentTarget.style.color = '#e03e3e'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{date}</span>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', minHeight: '1.5rem' }}>
        {confirming ? (
          <>
            <span style={{ fontSize: '0.8rem', color: '#e03e3e', flex: 1 }}>Delete this PDF?</span>
            <button
              onClick={() => setConfirming(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontFamily: 'inherit', fontSize: '0.8rem', cursor: 'pointer', padding: '0.15rem 0.4rem' }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{ background: 'none', border: 'none', color: '#e03e3e', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.8rem', cursor: deleting ? 'not-allowed' : 'pointer', padding: '0.15rem 0.4rem', opacity: deleting ? 0.6 : 1 }}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </>
        ) : (
          <button
            onClick={onContinue}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', fontFamily: 'inherit', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer', padding: '0.25rem 0' }}
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  )
}
