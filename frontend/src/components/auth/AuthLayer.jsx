import { useEffect } from 'react'
import { supabase } from '../../services/supabaseClient'
import useSessionStore from '../../store/sessionStore'

export default function AuthLayer({ children }) {
  const { setAuth, setLoading } = useSessionStore()

  useEffect(() => {
    // Seed initial session before any route guard fires
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuth(session?.user ?? null, session ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(session?.user ?? null, session ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setAuth, setLoading])

  const isLoading = useSessionStore((s) => s.isLoading)

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--color-background)',
        }}
      />
    )
  }

  return children
}
