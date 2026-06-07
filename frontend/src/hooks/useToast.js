import { useState, useCallback } from 'react'

export default function useToast() {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, variant = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return { toasts, showToast }
}
