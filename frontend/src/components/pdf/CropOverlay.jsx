import { useRef, useState, useEffect } from 'react'

export default function CropOverlay({ canvasRef, onCropComplete, onCancel }) {
  const overlayRef = useRef(null)
  const startRef = useRef(null)
  const [selection, setSelection] = useState(null) // { x, y, w, h }

  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onCancel])

  function localCoords(e) {
    const rect = overlayRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function onMouseDown(e) {
    e.preventDefault()
    const { x, y } = localCoords(e)
    startRef.current = { x, y }
    setSelection({ x, y, w: 0, h: 0 })
  }

  function onMouseMove(e) {
    if (!startRef.current) return
    const { x, y } = localCoords(e)
    const sx = startRef.current.x
    const sy = startRef.current.y
    setSelection({
      x: Math.min(x, sx),
      y: Math.min(y, sy),
      w: Math.abs(x - sx),
      h: Math.abs(y - sy),
    })
  }

  function onMouseUp() {
    if (!startRef.current || !selection || selection.w < 4 || selection.h < 4) {
      startRef.current = null
      setSelection(null)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) { startRef.current = null; setSelection(null); return }

    // The overlay is sized to match the canvas CSS dimensions (viewport.width x viewport.height),
    // and canvas.width === viewport.width (scale 1.5 already applied).
    // So drag coords in CSS pixels === canvas pixel coords — no further scaling needed.
    const x = Math.round(selection.x)
    const y = Math.round(selection.y)
    const w = Math.round(selection.w)
    const h = Math.round(selection.h)

    const tmp = document.createElement('canvas')
    tmp.width = w
    tmp.height = h
    tmp.getContext('2d').drawImage(canvas, x, y, w, h, 0, 0, w, h)
    const base64 = tmp.toDataURL('image/jpeg', 0.7)

    startRef.current = null
    setSelection(null)
    onCropComplete(base64)
  }

  return (
    <div
      ref={overlayRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      style={{
        position: 'absolute',
        inset: 0,
        cursor: 'crosshair',
        zIndex: 10,
        userSelect: 'none',
      }}
    >
      {selection && selection.w > 2 && selection.h > 2 && (
        <div
          style={{
            position: 'absolute',
            left: selection.x,
            top: selection.y,
            width: selection.w,
            height: selection.h,
            border: '2px solid var(--accent)',
            background: 'rgba(35, 131, 226, 0.12)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}
