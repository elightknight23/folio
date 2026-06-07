const BACKEND_URL = 'http://localhost:8000'

export async function uploadPDF(file, accessToken) {
  const form = new FormData()
  form.append('file', file)

  const res = await fetch(`${BACKEND_URL}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail ?? 'Upload failed')
  }

  return res.json() // { status, session_id, filename, page_count }
}
