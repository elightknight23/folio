import { supabase } from './supabaseClient'

export function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/dashboard' },
  })
}

export function signOut() {
  return supabase.auth.signOut()
}
