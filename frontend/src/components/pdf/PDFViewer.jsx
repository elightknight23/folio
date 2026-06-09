import { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url'
import 'pdfjs-dist/web/pdf_viewer.css'
import CropOverlay from './CropOverlay'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export default function PDFViewer({ url, onPageChange, onTextSelect, scrollToPage, cropMode, onCropComplete, onCancelCrop }) {
  const canvasRef = useRef(null)
  const textLayerRef = useRef(null)
  const wrapperRef = useRef(null)
  const pdfRef = useRef(null)
  const renderTaskRef = useRef(null)
  const textRenderTaskRef = useRef(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!url) return
    let cancelled = false

    setLoading(true)
    setError(null)

    pdfjsLib.getDocument(url).promise.then((pdf) => {
      if (cancelled) return
      pdfRef.current = pdf
      setTotalPages(pdf.numPages)
      setCurrentPage(1)
      setLoading(false)
    }).catch((err) => {
      if (cancelled) return
      setError(err.message)
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [url])

  const renderPage = useCallback(async (pageNum) => {
    const pdf = pdfRef.current
    const canvas = canvasRef.current
    const textLayerDiv = textLayerRef.current
    const wrapper = wrapperRef.current
    if (!pdf || !canvas || !textLayerDiv || !wrapper) return

    if (renderTaskRef.current) renderTaskRef.current.cancel()
    if (textRenderTaskRef.current) textRenderTaskRef.current.cancel()

    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: 1.5 })

    // Size the wrapper so the absolute text layer shares the exact same bounding box
    wrapper.style.width = viewport.width + 'px'
    wrapper.style.height = viewport.height + 'px'

    // v4 TextLayer uses --scale-factor to position spans
    textLayerDiv.style.setProperty('--scale-factor', viewport.scale)

    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')

    const canvasTask = page.render({ canvasContext: ctx, viewport })
    renderTaskRef.current = canvasTask
    try {
      await canvasTask.promise
    } catch (err) {
      if (err?.name !== 'RenderingCancelledException') throw err
      return
    }

    // pdfjs-dist v4: use TextLayer class, not the removed renderTextLayer function
    textLayerDiv.innerHTML = ''
    const textLayer = new pdfjsLib.TextLayer({
      textContentSource: page.streamTextContent(),
      container: textLayerDiv,
      viewport,
    })
    textRenderTaskRef.current = textLayer
    try {
      await textLayer.render()
    } catch (err) {
      if (err?.name !== 'AbortException') console.error('TextLayer render failed:', err)
    }
  }, [])

  useEffect(() => {
    if (!loading && !error && totalPages > 0) {
      renderPage(currentPage)
      onPageChange?.(currentPage, totalPages)
    }
  }, [currentPage, loading, error, totalPages, renderPage, onPageChange])

  const goToPrev = () => setCurrentPage((p) => Math.max(1, p - 1))
  const goToNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1))

  // Expose scroll-to-page via callback ref pattern
  useEffect(() => {
    if (scrollToPage) scrollToPage.current = setCurrentPage
  }, [scrollToPage])

  const handleMouseUp = () => {
    if (cropMode) return
    const sel = window.getSelection()
    const text = sel?.toString().trim()
    if (text && sel.rangeCount > 0) {
      const rect = sel.getRangeAt(0).getBoundingClientRect()
      onTextSelect?.({ text, rect })
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-text-secondary text-sm">
        Failed to load PDF: {error}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <button
          onClick={goToPrev}
          disabled={currentPage <= 1 || loading}
          className="px-3 py-1 text-sm rounded disabled:opacity-40 hover:bg-border transition-colors text-text-primary"
          style={{ borderRadius: 'var(--radius)' }}
        >
          ← Prev
        </button>

        <span className="text-sm text-text-secondary">
          {loading ? 'Loading…' : `Page ${currentPage} of ${totalPages}`}
        </span>

        <button
          onClick={goToNext}
          disabled={currentPage >= totalPages || loading}
          className="px-3 py-1 text-sm rounded disabled:opacity-40 hover:bg-border transition-colors text-text-primary"
          style={{ borderRadius: 'var(--radius)' }}
        >
          Next →
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto flex justify-center p-4" onMouseUp={handleMouseUp}>
        {loading ? (
          <div className="flex items-center justify-center w-full text-text-secondary text-sm">
            Loading PDF…
          </div>
        ) : (
          <div ref={wrapperRef} className="relative shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
            <canvas ref={canvasRef} style={{ display: 'block' }} />
            <div
              ref={textLayerRef}
              className="textLayer"
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                pointerEvents: cropMode ? 'none' : undefined,
              }}
            />
            {cropMode && (
              <CropOverlay
                canvasRef={canvasRef}
                onCropComplete={onCropComplete}
                onCancel={onCancelCrop}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
