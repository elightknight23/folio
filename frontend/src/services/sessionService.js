const BACKEND_URL = import.meta.env.VITE_API_URL

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

export async function updateSession(sessionId, data, accessToken) {
  const res = await fetch(`${BACKEND_URL}/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update session')
  return res.json()
}

export async function deleteSession(sessionId, accessToken) {
  const res = await fetch(`${BACKEND_URL}/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to delete session')
}
