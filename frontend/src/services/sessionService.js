const BACKEND_URL = 'http://localhost:8000'

export async function fetchUserSessions(accessToken) {
  const res = await fetch(`${BACKEND_URL}/sessions`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to fetch sessions')
  return res.json() // array of session objects
}

export async function fetchSessionDetail(sessionId, accessToken) {
  const res = await fetch(`${BACKEND_URL}/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to fetch session')
  return res.json() // session object + signed_url
}

export async function deleteSession(sessionId, accessToken) {
  const res = await fetch(`${BACKEND_URL}/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to delete session')
}
