import { useRef } from 'react'
import PDFViewer from '../pdf/PDFViewer'

export default function Workdesk({ pdfUrl }) {
  const scrollToPageRef = useRef(null)

  return (
    <div className="flex h-full" style={{ background: 'var(--color-background)' }}>
      {/* Left panel — PDF viewer */}
      <div
        className="flex flex-col border-r"
        style={{ width: '55%', borderColor: 'var(--color-border)' }}
      >
        <PDFViewer
          url={pdfUrl}
          scrollToPage={scrollToPageRef}
          onPageChange={(page, total) => {
            // Page state will flow into pdfStore in a later sprint
          }}
          onTextSelect={(text) => {
            // Selected text will flow into chatStore in a later sprint
          }}
        />
      </div>

      {/* Right panel — AI chat placeholder */}
      <div
        className="flex flex-col flex-1 items-center justify-center gap-2"
        style={{ background: 'var(--color-surface)' }}
      >
        <span className="text-2xl" aria-hidden>💬</span>
        <p className="text-text-secondary text-sm">AI chat — coming in Sprint 2</p>
      </div>
    </div>
  )
}
