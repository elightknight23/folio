import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import useSessionStore from '../store/sessionStore'
import useChatStore from '../store/chatStore'
import { fetchSessionDetail } from '../services/sessionService'
import WorkdeskLayout from '../components/workdesk/Workdesk'
import useToast from '../hooks/useToast'
import Toast from '../components/ui/Toast'

export default function WorkdeskPage() {
  const { id } = useParams()
  const session = useSessionStore((s) => s.session)
  const setActiveSession = useSessionStore((s) => s.setActiveSession)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const { toasts, showToast } = useToast()

  useEffect(() => {
    if (!id || !session?.access_token) return

    useChatStore.getState().clearMessages()

    fetchSessionDetail(id, session.access_token)
      .then((data) => {
        setActiveSession(data)
        setPdfUrl(data.signed_url)
      })
      .catch((err) => {
        setLoadError(err.message)
        showToast(err.message, 'error')
      })

    return () => { useChatStore.getState().clearMessages() }
  }, [id, session, setActiveSession])

  if (loadError) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Failed to load session: {loadError}</p>
        <Toast toasts={toasts} />
      </div>
    )
  }

  return (
    <>
      <WorkdeskLayout pdfUrl={pdfUrl} />
      <Toast toasts={toasts} />
    </>
  )
}
