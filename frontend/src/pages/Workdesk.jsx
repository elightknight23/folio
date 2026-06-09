import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import useSessionStore from '../store/sessionStore'
import useChatStore from '../store/chatStore'
import { fetchSessionDetail } from '../services/sessionService'
import WorkdeskLayout from '../components/workdesk/Workdesk'

export default function WorkdeskPage() {
  const { id } = useParams()
  const session = useSessionStore((s) => s.session)
  const setActiveSession = useSessionStore((s) => s.setActiveSession)
  const [pdfUrl, setPdfUrl] = useState(null)

  useEffect(() => {
    if (!id || !session?.access_token) return

    // Clear chat whenever we enter a new session
    useChatStore.getState().clearMessages()

    fetchSessionDetail(id, session.access_token)
      .then((data) => {
        setActiveSession(data)
        setPdfUrl(data.signed_url)
      })
      .catch((err) => console.error('Failed to load session:', err))

    // Clear again on unmount so history doesn't bleed if the user navigates to dashboard
    return () => { useChatStore.getState().clearMessages() }
  }, [id, session, setActiveSession])

  return <WorkdeskLayout pdfUrl={pdfUrl} />
}
