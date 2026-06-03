import Workdesk from '../components/workdesk/Workdesk'

// Hardcoded local PDF for Sprint 1 — replaced with upload flow in a later sprint
const SAMPLE_PDF = '/sample.pdf'

export default function WorkdeskPage() {
  return <Workdesk pdfUrl={SAMPLE_PDF} />
}
