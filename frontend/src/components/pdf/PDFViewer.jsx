import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url'
import 'pdfjs-dist/web/pdf_viewer.css'
import { PanelLeft, ChevronLeft, ChevronRight, File, GalleryVertical } from 'lucide-react'
import useLayoutStore from '../../store/layoutStore'
import Sidebar from './Sidebar'
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const SCALE = 1.5
const PAGE_GAP = 16
// A4 at SCALE — height estimate until real page dims arrive
const FALLBACK_PAGE_HEIGHT = 842 * SCALE + PAGE_GAP
const DIMS_BATCH_SIZE = 25
const THUMB_SCALE = 0.25
const MAX_THUMB_CONCURRENCY = 2

export default function PDFViewer({ url, onPageChange, onTextSelect, scrollToPage }) {
  const pdfViewMode = useLayoutStore((s) => s.pdfViewMode)
  const setPdfViewMode = useLayoutStore((s) => s.setPdfViewMode)
  const sidebarOpen = useLayoutStore((s) => s.sidebarOpen)
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar)

  const pdfRef = useRef(null)
  const continuousRef = useRef(null)
  const pageDimsRef = useRef([]) // [{width, height}] at scale 1, filled in background
  const [dimsVersion, setDimsVersion] = useState(0)

  const [pdfDoc, setPdfDoc] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [outline, setOutline] = useState(null) // plain tree [{title, page, children}] | null
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /* ---------- Thumbnail render queue ----------
     Sidebar thumbnails never call pdf.js directly: requests enter a FIFO
     queue capped at MAX_THUMB_CONCURRENCY in-flight renders so sidebar
     scroll-spam can't flood the worker or starve main-view page renders
     (which bypass this queue entirely). */
  const thumbCacheRef = useRef(new Map()) // pageNum -> dataURL
  const thumbQueueRef = useRef([])
  const thumbActiveRef = useRef(0)

  const pumpThumbQueue = useCallback(() => {
    if (thumbActiveRef.current >= MAX_THUMB_CONCURRENCY) return
    const job = thumbQueueRef.current.shift()
    if (!job) return
    thumbActiveRef.current++

    ;(async () => {
      const pdf = pdfRef.current
      if (!pdf || job.cancelled) { job.resolve(null); return }
      const page = await pdf.getPage(job.pageNum)
      if (job.cancelled) { job.resolve(null); return }
      const viewport = page.getViewport({ scale: THUMB_SCALE })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const task = page.render({ canvasContext: canvas.getContext('2d'), viewport })
      job.renderTask = task
      await task.promise
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
      canvas.width = 0
      canvas.height = 0
      thumbCacheRef.current.set(job.pageNum, dataUrl)
      job.resolve(dataUrl)
    })()
      .catch(() => job.resolve(null)) // cancelled or failed — cell keeps its skeleton
      .finally(() => {
        thumbActiveRef.current--
        pumpThumbQueue()
      })
  }, [])

  const requestThumbnail = useCallback((pageNum) => {
    const cached = thumbCacheRef.current.get(pageNum)
    if (cached) return { promise: Promise.resolve(cached), cancel: () => {} }

    const job = { pageNum, cancelled: false, renderTask: null }
    job.promise = new Promise((resolve) => { job.resolve = resolve })
    thumbQueueRef.current.push(job)
    pumpThumbQueue()

    return {
      promise: job.promise,
      cancel: () => {
        job.cancelled = true
        const idx = thumbQueueRef.current.indexOf(job)
        if (idx !== -1) thumbQueueRef.current.splice(idx, 1) // pending — never started
        job.renderTask?.cancel() // in-flight — abort the pdf.js render
        job.resolve(null)
      },
    }
  }, [pumpThumbQueue])

  /* ---------- Document load ---------- */
  useEffect(() => {
    if (!url) return
    let cancelled = false

    setLoading(true)
    setError(null)
    setOutline(null)
    setPdfDoc(null)
    pageDimsRef.current = []

    pdfjsLib.getDocument(url).promise.then(async (pdf) => {
      if (cancelled) { pdf.destroy(); return }
      pdfRef.current = pdf
      setPdfDoc(pdf)
      setTotalPages(pdf.numPages)
      setCurrentPage(1)
      setLoading(false)

      resolveOutline(pdf)
        .then((tree) => { if (!cancelled) setOutline(tree) })
        .catch(() => {}) // malformed outline — sidebar just hides the TOC tab

      // Background dimension prefetch — dims only, no rendering. Feeds the
      // virtualizer's estimateSize so mixed portrait/landscape pages measure right.
      for (let i = 1; i <= pdf.numPages && !cancelled; i += DIMS_BATCH_SIZE) {
        const end = Math.min(i + DIMS_BATCH_SIZE - 1, pdf.numPages)
        await Promise.all(
          Array.from({ length: end - i + 1 }, async (_, k) => {
            const page = await pdf.getPage(i + k)
            const { width, height } = page.getViewport({ scale: 1 })
            pageDimsRef.current[i + k - 1] = { width, height }
          })
        ).catch(() => {})
        if (!cancelled) setDimsVersion((v) => v + 1)
      }
    }).catch((err) => {
      if (cancelled) return
      setError(err.message)
      setLoading(false)
    })

    return () => {
      cancelled = true
      thumbQueueRef.current.forEach((job) => { job.cancelled = true; job.resolve(null) })
      thumbQueueRef.current = []
      thumbCacheRef.current.clear()
      pdfRef.current?.destroy()
      pdfRef.current = null
    }
  }, [url])

  /* ---------- Page sync ---------- */
  // Report page changes upward — Workdesk debounces 300ms into pdfStore (RAG sync)
  useEffect(() => {
    if (!loading && !error && totalPages > 0) {
      onPageChange?.(currentPage, totalPages)
    }
  }, [currentPage, loading, error, totalPages, onPageChange])

  const navigateToPage = useCallback((page) => {
    if (!page) return
    const p = Math.max(1, Math.min(page, totalPages || 1))
    setCurrentPage(p)
    if (pdfViewMode === 'continuous') continuousRef.current?.scrollToPage(p)
  }, [pdfViewMode, totalPages])

  // External scroll-to-page API (Workdesk ref) — same shape as before
  useEffect(() => {
    if (scrollToPage) scrollToPage.current = navigateToPage
  }, [scrollToPage, navigateToPage])

  const handleMouseUp = () => {
    const sel = window.getSelection()
    const text = sel?.toString().trim()
    if (text && sel.rangeCount > 0) {
      const rect = sel.getRangeAt(0).getBoundingClientRect()
      onTextSelect?.({ text, rect })
    }
  }

  if (error) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: 'var(--text-secondary)', fontSize: '0.875rem',
      }}>
        Failed to load PDF: {error}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* PDF toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.4rem 0.75rem', borderBottom: '1px solid var(--border)',
        flexShrink: 0, gap: '0.75rem',
      }}>
        <ToolbarIconButton
          onClick={toggleSidebar}
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          active={sidebarOpen}
          disabled={loading}
        >
          <PanelLeft size={15} />
        </ToolbarIconButton>

        {/* Page indicator + single-mode pager */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {pdfViewMode === 'single' && (
            <ToolbarIconButton
              onClick={() => navigateToPage(currentPage - 1)}
              title="Previous page"
              disabled={currentPage <= 1 || loading}
            >
              <ChevronLeft size={15} />
            </ToolbarIconButton>
          )}
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {loading ? 'Loading…' : `Page ${currentPage} of ${totalPages}`}
          </span>
          {pdfViewMode === 'single' && (
            <ToolbarIconButton
              onClick={() => navigateToPage(currentPage + 1)}
              title="Next page"
              disabled={currentPage >= totalPages || loading}
            >
              <ChevronRight size={15} />
            </ToolbarIconButton>
          )}
        </div>

        {/* View mode toggle */}
        <div style={{
          display: 'flex', gap: '2px', padding: '2px',
          background: 'var(--surface-2)', borderRadius: '7px',
        }}>
          <ViewModeButton
            active={pdfViewMode === 'continuous'}
            title="Continuous scroll"
            onClick={() => setPdfViewMode('continuous')}
          >
            <GalleryVertical size={13} />
          </ViewModeButton>
          <ViewModeButton
            active={pdfViewMode === 'single'}
            title="Single page"
            onClick={() => setPdfViewMode('single')}
          >
            <File size={13} />
          </ViewModeButton>
        </div>
      </div>

      {/* Sidebar + document */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          open={sidebarOpen && !loading}
          outline={outline}
          pageCount={totalPages}
          currentPage={currentPage}
          requestThumbnail={requestThumbnail}
          onNavigate={navigateToPage}
        />

        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }} onMouseUp={handleMouseUp}>
          {loading ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', color: 'var(--text-secondary)', fontSize: '0.875rem',
            }}>
              Loading PDF…
            </div>
          ) : pdfViewMode === 'single' ? (
            <SinglePageView pdf={pdfDoc} pageNum={currentPage} />
          ) : (
            <ContinuousView
              ref={continuousRef}
              pdf={pdfDoc}
              numPages={totalPages}
              dimsVersion={dimsVersion}
              getPageDims={(i) => pageDimsRef.current[i]}
              initialPage={currentPage}
              onVisiblePage={setCurrentPage}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   PAGE CANVAS — one page's canvas + TextLayer, shared by both
   view modes. Full render-task hygiene: cancels the RenderTask,
   aborts the TextLayer, zeroes the canvas, and releases page
   resources when unmounted (this is what keeps RAM flat).
   ============================================================ */

function PageCanvas({ pdf, pageNum }) {
  const wrapperRef = useRef(null)
  const canvasRef = useRef(null)
  const textLayerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    let renderTask = null
    let textLayer = null
    let pageObj = null

    ;(async () => {
      const page = await pdf.getPage(pageNum)
      if (cancelled) return
      pageObj = page

      const wrapper = wrapperRef.current
      const canvas = canvasRef.current
      const textLayerDiv = textLayerRef.current
      if (!wrapper || !canvas || !textLayerDiv) return

      const viewport = page.getViewport({ scale: SCALE })

      // Size the wrapper so the absolute text layer shares the exact same bounding box
      wrapper.style.width = viewport.width + 'px'
      wrapper.style.height = viewport.height + 'px'

      // v4 TextLayer uses --scale-factor to position spans
      textLayerDiv.style.setProperty('--scale-factor', viewport.scale)

      canvas.width = viewport.width
      canvas.height = viewport.height

      renderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport })
      await renderTask.promise
      if (cancelled) return

      // pdfjs-dist v4: use TextLayer class, not the removed renderTextLayer function
      textLayerDiv.innerHTML = ''
      textLayer = new pdfjsLib.TextLayer({
        textContentSource: page.streamTextContent(),
        container: textLayerDiv,
        viewport,
      })
      await textLayer.render()
    })().catch((err) => {
      // Cancellation is the expected path when scrolling past a page mid-render
      if (err?.name !== 'RenderingCancelledException' && err?.name !== 'AbortException') {
        // Page failed to render — leave the placeholder blank rather than crash
      }
    })

    return () => {
      cancelled = true
      renderTask?.cancel()
      textLayer?.cancel?.()
      if (canvasRef.current) {
        canvasRef.current.width = 0
        canvasRef.current.height = 0
      }
      try { pageObj?.cleanup() } catch { /* render still winding down — pdf.js will GC */ }
    }
  }, [pdf, pageNum])

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        background: 'var(--bg)',
        borderRadius: 'var(--radius)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      <div
        ref={textLayerRef}
        className="textLayer"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />
    </div>
  )
}

/* ============================================================
   SINGLE PAGE VIEW — the proven fallback mode
   ============================================================ */

function SinglePageView({ pdf, pageNum }) {
  return (
    <div style={{ height: '100%', overflow: 'auto', display: 'flex', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ alignSelf: 'flex-start' }}>
        <PageCanvas pdf={pdf} pageNum={pageNum} />
      </div>
    </div>
  )
}

/* ============================================================
   CONTINUOUS VIEW — virtualized scroll. Only the visible pages
   (+overscan 2) carry a live canvas; everything else is an empty
   height reservation, so a 300-page PDF never exceeds ~5-7 canvases.
   currentPage = the page under the viewport's vertical midpoint —
   exact even for pages taller than the viewport.
   ============================================================ */

const ContinuousView = forwardRef(function ContinuousView(
  { pdf, numPages, dimsVersion, getPageDims, initialPage, onVisiblePage },
  ref
) {
  const scrollRef = useRef(null)
  const rafRef = useRef(0)
  const lastPageRef = useRef(initialPage)

  const virtualizer = useVirtualizer({
    count: numPages,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => {
      const dims = getPageDims(i)
      return dims ? dims.height * SCALE + PAGE_GAP : FALLBACK_PAGE_HEIGHT
    },
    overscan: 2,
  })

  // Re-measure as real page dimensions arrive from the background prefetch
  useEffect(() => {
    if (dimsVersion > 0) virtualizer.measure()
  }, [dimsVersion]) // eslint-disable-line react-hooks/exhaustive-deps

  useImperativeHandle(ref, () => ({
    scrollToPage: (page) => {
      lastPageRef.current = page
      virtualizer.scrollToIndex(page - 1, { align: 'start' })
    },
  }), [virtualizer])

  // Restore position on mount / mode switch
  useEffect(() => {
    if (initialPage > 1) virtualizer.scrollToIndex(initialPage - 1, { align: 'start' })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Midpoint page sync — rAF-throttled; upstream Workdesk debounce (300ms)
  // protects the store and the RAG pipeline from scroll spam
  const handleScroll = () => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      const el = scrollRef.current
      if (!el) return
      const mid = el.scrollTop + el.clientHeight / 2
      for (const item of virtualizer.getVirtualItems()) {
        if (mid >= item.start && mid < item.end) {
          const page = item.index + 1
          if (page !== lastPageRef.current) {
            lastPageRef.current = page
            onVisiblePage(page)
          }
          break
        }
      }
    })
  }

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      style={{ height: '100%', overflowY: 'auto' }}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((item) => (
          <div
            key={item.key}
            style={{
              position: 'absolute',
              top: 0, left: 0, width: '100%',
              transform: `translateY(${item.start}px)`,
              display: 'flex', justifyContent: 'center',
              padding: `0 1rem`,
            }}
          >
            <PageCanvas pdf={pdf} pageNum={item.index + 1} />
          </div>
        ))}
      </div>
    </div>
  )
})

/* ============================================================
   OUTLINE EXTRACTION — pdf.js outline → plain serializable tree
   so Sidebar.jsx never touches pdf.js (architecture rule 9)
   ============================================================ */

async function resolveOutline(pdf) {
  const raw = await pdf.getOutline()
  if (!raw || raw.length === 0) return null

  async function resolveItems(items) {
    const out = []
    for (const item of items) {
      let page = null
      try {
        let dest = item.dest
        if (typeof dest === 'string') dest = await pdf.getDestination(dest)
        if (Array.isArray(dest) && dest[0]) {
          page = (await pdf.getPageIndex(dest[0])) + 1
        }
      } catch {
        // Unresolvable destination — keep the entry, just not clickable
      }
      out.push({
        title: item.title,
        page,
        children: item.items?.length ? await resolveItems(item.items) : [],
      })
    }
    return out
  }

  return resolveItems(raw)
}

/* ============================================================
   TOOLBAR PRIMITIVES
   ============================================================ */

function ToolbarIconButton({ onClick, title, disabled, active, children }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '26px', height: '26px',
        background: active ? 'var(--surface-2)' : hovered && !disabled ? 'var(--surface-2)' : 'transparent',
        border: 'none', borderRadius: '6px',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background var(--dur-fast) ease, color var(--dur-fast) ease',
      }}
    >
      {children}
    </button>
  )
}

function ViewModeButton({ active, title, onClick, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '24px', height: '22px',
        background: active ? 'var(--bg)' : 'transparent',
        border: 'none', borderRadius: '5px',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        boxShadow: active ? 'var(--shadow-sm)' : 'none',
        cursor: 'pointer',
        transition: 'background var(--dur-fast) ease, color var(--dur-fast) ease',
      }}
    >
      {children}
    </button>
  )
}
