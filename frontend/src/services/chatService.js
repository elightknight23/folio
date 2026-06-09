const BACKEND_URL = 'http://localhost:8000'

export async function* streamMessage(sessionId, message, currentPage, token, imageData = null) {
  const body = { message, current_page: currentPage }
  if (imageData) body.image_data = imageData

  const res = await fetch(`${BACKEND_URL}/chat/${sessionId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? `Request failed (${res.status})`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    for (const line of decoder.decode(value).split('\n')) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6)
      if (raw === '[DONE]') continue
      try {
        const parsed = JSON.parse(raw)
        // Structured error event from the backend
        if (parsed && typeof parsed === 'object' && parsed.__error__) {
          throw new Error(parsed.__error__)
        }
        yield parsed
      } catch (e) {
        // Re-throw our clean backend errors; ignore JSON parse noise
        if (e.message && !e.message.startsWith('JSON')) throw e
      }
    }
  }
}
