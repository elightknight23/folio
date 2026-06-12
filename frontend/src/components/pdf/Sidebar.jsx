import { useEffect, useRef, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import Skeleton from '../ui/Skeleton'

const SIDEBAR_WIDTH = 220

/**
 * Document sidebar — Contents (TOC) + Pages (thumbnails).
 * Purely presentational: receives a plain outline tree and a
 * `requestThumbnail(page) → { promise, cancel }` callback from PDFViewer.
 * Never imports pdf.js (architecture rule 9).
 */
export default function Sidebar({ open, outline, pageCount, currentPage, requestThumbnail, onNavigate }) {
  const hasToc = Array.isArray(outline) && outline.length > 0
  const [tab, setTab] = useState('pages')
  const autoSwitched = useRef(false)

  // The outline resolves async after document load — prefer it once available
  useEffect(() => {
    if (hasToc && !autoSwitched.current) {
      autoSwitched.current = true
      setTab('contents')
    }
    if (!hasToc && tab === 'contents') setTab('pages')
  }, [hasToc]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      width: open ? `${SIDEBAR_WIDTH}px` : '0px',
      flexShrink: 0, overflow: 'hidden',
      borderRight: open ? '1px solid var(--border)' : 'none',
      background: 'var(--surface)',
      transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        width: `${SIDEBAR_WIDTH}px`, minWidth: `${SIDEBAR_WIDTH}px`,
        height: '100%', display: 'flex', flexDirection: 'column',
      }}>
        {/* Tabs — Contents hidden entirely when the PDF has no outline */}
        <div style={{
          display: 'flex', gap: '0.25rem',
          padding: '0.5rem 0.6rem',
          borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          {hasToc && (
            <SidebarTab label="Contents" active={tab === 'contents'} onClick={() => setTab('contents')} />
          )}
          <SidebarTab label="Pages" active={tab === 'pages'} onClick={() => setTab('pages')} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {tab === 'contents' && hasToc ? (
            <div style={{ padding: '0.6rem 0.4rem' }}>
              {outline.map((item, i) => (
                <OutlineItem key={i} item={item} depth={0} currentPage={currentPage} onNavigate={onNavigate} />
              ))}
            </div>
          ) : (
            <PagesTab
              pageCount={pageCount}
              currentPage={currentPage}
              requestThumbnail={requestThumbnail}
              onNavigate={onNavigate}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function SidebarTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '0.3rem 0.5rem',
        background: active ? 'var(--surface-2)' : 'transparent',
        border: 'none', borderRadius: '6px',
        fontFamily: 'inherit', fontSize: '0.72rem', fontWeight: 600,
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'background var(--dur-fast) ease, color var(--dur-fast) ease',
      }}
    >
      {label}
    </button>
  )
}

/* ============================================================
   CONTENTS — hierarchical outline
   ============================================================ */

function OutlineItem({ item, depth, currentPage, onNavigate }) {
  const [expanded, setExpanded] = useState(depth < 1) // top level open by default
  const [hovered, setHovered] = useState(false)
  const hasChildren = item.children.length > 0
  const isCurrent = item.page === currentPage

  return (
    <div>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center',
          paddingLeft: `${0.35 + depth * 0.8}rem`,
          paddingRight: '0.5rem',
          borderRadius: '6px',
          background: hovered ? 'var(--surface-2)' : 'transparent',
          transition: 'background var(--dur-fast) ease',
        }}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '16px', height: '16px', flexShrink: 0,
              background: 'transparent', border: 'none', padding: 0,
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            <ChevronRight
              size={11}
              style={{
                transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform var(--dur-fast) ease',
              }}
            />
          </button>
        ) : (
          <span style={{ width: '16px', flexShrink: 0 }} />
        )}
        <button
          onClick={() => item.page && onNavigate(item.page)}
          title={item.page ? `Go to page ${item.page}` : undefined}
          style={{
            flex: 1, minWidth: 0,
            display: 'block',
            textAlign: 'left',
            background: 'transparent', border: 'none',
            padding: '0.32rem 0.2rem',
            fontFamily: 'inherit', fontSize: '0.78rem',
            fontWeight: isCurrent ? 600 : 400,
            color: isCurrent ? 'var(--accent)' : 'var(--text-primary)',
            cursor: item.page ? 'pointer' : 'default',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            lineHeight: 1.35,
          }}
        >
          {item.title}
        </button>
      </div>
      {hasChildren && expanded && (
        <div>
          {item.children.map((child, i) => (
            <OutlineItem key={i} item={child} depth={depth + 1} currentPage={currentPage} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ============================================================
   PAGES — lazy thumbnail grid.
   One shared IntersectionObserver: entering view requests a
   thumbnail through PDFViewer's bounded queue; leaving view
   cancels it (dequeues if pending, aborts the render if
   in-flight) so flick-scrolling never accumulates work.
   ============================================================ */

function PagesTab({ pageCount, currentPage, requestThumbnail, onNavigate }) {
  const containerRef = useRef(null)
  const [thumbs, setThumbs] = useState({}) // page -> dataURL
  const loadedRef = useRef(new Set())
  const jobsRef = useRef(new Map()) // page -> cancel fn

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const page = Number(entry.target.dataset.page)
        if (entry.isIntersecting) {
          if (loadedRef.current.has(page) || jobsRef.current.has(page)) continue
          const { promise, cancel } = requestThumbnail(page)
          jobsRef.current.set(page, cancel)
          promise.then((dataUrl) => {
            jobsRef.current.delete(page)
            if (dataUrl) {
              loadedRef.current.add(page)
              setThumbs((prev) => ({ ...prev, [page]: dataUrl }))
            }
          })
        } else {
          const cancel = jobsRef.current.get(page)
          if (cancel) {
            cancel()
            jobsRef.current.delete(page)
          }
        }
      }
      // root: null clips through the sidebar's scroll container, so cells
      // outside the visible rail correctly report non-intersecting
    }, { root: null, rootMargin: '120px' })

    container.querySelectorAll('[data-page]').forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
      jobsRef.current.forEach((cancel) => cancel())
      jobsRef.current.clear()
    }
  }, [pageCount, requestThumbnail])

  return (
    <div
      ref={containerRef}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.6rem',
        padding: '0.75rem 0.6rem',
      }}
    >
      {Array.from({ length: pageCount }, (_, i) => {
        const page = i + 1
        return (
          <ThumbCell
            key={page}
            page={page}
            dataUrl={thumbs[page]}
            isCurrent={page === currentPage}
            onClick={() => onNavigate(page)}
          />
        )
      })}
    </div>
  )
}

function ThumbCell({ page, dataUrl, isCurrent, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      data-page={page}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`Page ${page}`}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
        background: 'transparent', border: 'none', padding: 0,
        cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      <div style={{
        width: '100%',
        aspectRatio: '3 / 4',
        borderRadius: '6px',
        overflow: 'hidden',
        border: `2px solid ${isCurrent ? 'var(--accent)' : hovered ? 'var(--border-strong)' : 'var(--border)'}`,
        background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border-color var(--dur-fast) ease',
      }}>
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`Page ${page}`}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        ) : (
          <Skeleton width="100%" height="100%" />
        )}
      </div>
      <span style={{
        fontSize: '0.66rem', fontWeight: isCurrent ? 700 : 500,
        color: isCurrent ? 'var(--accent)' : 'var(--text-secondary)',
      }}>
        {page}
      </span>
    </button>
  )
}
