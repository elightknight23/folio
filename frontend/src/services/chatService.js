const BACKEND_URL = 'http://localhost:8000'

export async function* streamMessage(sessionId, message, currentPage, token) {
  const res = await fetch(`${BACKEND_URL}/chat/${sessionId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, current_page: currentPage }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? 'Chat request failed')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    for (const line of decoder.decode(value).split('\n')) {
      if (line.startsWith('data: ')) {
        const content = line.slice(6)
        if (content !== '[DONE]') yield content
      }
    }
  }
}
