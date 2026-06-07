import { LayoutPanelLeft, MousePointerClick, BookOpen } from 'lucide-react'
import { signInWithGoogle } from '../services/authService'

export default function LandingPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ============================================================
          NAVBAR
          - "folio" wordmark: change the text on line 18
          - Nav buttons: labels on lines 21-22, both trigger sign-in
          ============================================================ */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2.5rem',       // ← left/right page padding
        height: '70px',            // ← navbar height
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontWeight: 1000, fontSize: '2.3rem', color: 'var(--text-primary)', letterSpacing: '-0.005em' }}>
          folio {/* ← brand name */}
        </span>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <NavButton onClick={signInWithGoogle} label="Sign in" />
          <NavButton onClick={signInWithGoogle} label="Get started" primary /> {/* primary = filled button */}
        </div>
      </nav>

      {/* ============================================================
          HERO SECTION
          - Eyebrow: small label above the headline (line 42)
          - Headline: the big serif text (line 55) — font is DM Serif Display
          - Subheadline: the paragraph below (lines 65-66)
          - Primary CTA: "Continue with Google" button (line 91)
          - Secondary CTA: "See how it works" button (line 107) — currently decorative
          - Trust line: small text below buttons (line 111)
          ============================================================ */}
      <section style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '6rem 2rem 4rem',  // ← top/bottom spacing of hero
        gap: '1.75rem',             // ← vertical gap between each hero element
      }}>

        {/* Eyebrow label — change the text or delete this whole <span> to remove it */}
        <span style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
        }}>
          Your AI Study Environment {/* ← eyebrow text */}
        </span>

        {/* Main headline — font-size uses clamp(min, preferred, max) for responsiveness */}
        <h1 style={{
          margin: 0,
          fontFamily: "'DM Serif Display', serif", // ← change to "'Inter', sans-serif" for a cleaner look
          fontSize: 'clamp(2.8rem, 7vw, 4.5rem)', // ← min 2.8rem, max 4.5rem
          fontWeight: 400,
          color: 'var(--text-primary)',
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          maxWidth: '700px',
        }}>
          Read smarter.<br />Study deeper. {/* ← headline text */}
        </h1>

        {/* Subheadline paragraph */}
        <p style={{
          margin: 0,
          fontSize: '1.05rem',      // ← subheadline size
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          maxWidth: '500px',        // ← controls line length
        }}>
          Your textbook and your AI tutor, a team. Never lose your place.
          Never lose context. Never lose focus. {/* ← subheadline text */}
        </p>

        {/* CTA buttons row */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>

          {/* Primary CTA — filled, triggers Google OAuth */}
          <button
            onClick={signInWithGoogle}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.65rem 1.4rem',  // ← button padding (vertical horizontal)
              background: 'var(--text-primary)',
              color: 'var(--bg)',
              border: '1px solid var(--text-primary)',
              borderRadius: '8px',         // ← corner radius
              fontFamily: 'inherit',
              fontWeight: 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <GoogleIcon />
            Continue with Google {/* ← primary button label */}
          </button>

        </div>

      </section>

      {/* ============================================================
          APP MOCKUP
          - Outer card: the browser-like window
          - Title bar: traffic light dots + URL label (line 143)
          - PDF panel (left, 55% wide): fake text lines + 1 blue highlight
          - AI panel (right): fake chat message bubbles
          To change the highlighted line: in the PDF lines array (line 162),
          index 6 (7th item) is the accent-coloured one — change `i === 6`
          to whichever index you want highlighted.
          ============================================================ */}
      <section style={{ display: 'flex', justifyContent: 'center', padding: '0 2rem 5rem' }}>
        <div style={{
          width: '100%',
          maxWidth: '1000px',          // ← max width of the mockup card
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',  // ← shadow intensity — increase last value for more glow
          background: 'var(--surface)',
        }}>

          {/* Title bar — the fake browser chrome at the top */}
          <div style={{
            height: '38px',
            background: 'var(--bg)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 1rem',
            gap: '1rem',
          }}>
            {/* Traffic light dots — these are decorative, colours are fixed macOS colours */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
            </div>
            {/* URL bar label — change this text */}
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              folio.ai — workdesk {/* ← fake URL bar text */}
            </span>
          </div>

          {/* Split panels */}
          <div style={{ display: 'flex', height: '300px' }}> {/* ← mockup panel height */}

            {/* PDF panel (left) */}
            <div style={{
              flex: '0 0 55%',   // ← PDF panel width as % of mockup
              borderRight: '1px solid var(--border)',
              padding: '1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}>
              {/* PDF panel label */}
              <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                PDF · Chapter 4 {/* ← PDF panel header label */}
              </span>

              {/* Fake text lines — each number is the width % of that line.
                  The line at index 6 (7th number: 88) is highlighted in accent blue.
                  Change `i === 6` below to highlight a different line. */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {[90, 78, 65, 82, 55, 70, 88, 60].map((w, i) => (
                  <div key={i} style={{
                    height: '8px',          // ← line height (thickness of fake text)
                    width: `${w}%`,
                    borderRadius: '4px',
                    background: i === 6 ? 'var(--accent)' : 'var(--border)', // ← i === 6 is the highlighted line
                    opacity: i === 6 ? 0.8 : 1,
                  }} />
                ))}
              </div>

              {/* Second paragraph of fake text lines */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginTop: '0.25rem' }}>
                {[72, 84, 48, 66].map((w, i) => (
                  <div key={i} style={{ height: '8px', width: `${w}%`, borderRadius: '4px', background: 'var(--border)' }} />
                ))}
              </div>
            </div>

            {/* AI panel (right) */}
            <div style={{
              flex: 1,
              padding: '1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}>
              {/* AI panel label */}
              <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                AI Assistant {/* ← AI panel header label */}
              </span>

              {/* Fake chat bubbles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {/* First AI message — grey lines = AI text */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignSelf: 'flex-start', width: '85%' }}>
                  {[80, 65, 45].map((w, i) => (
                    <div key={i} style={{ height: '8px', width: `${w}%`, borderRadius: '4px', background: 'var(--border)' }} />
                  ))}
                </div>

                {/* Highlighted AI response bubble — the bright white/filled card */}
                <div style={{
                  background: 'var(--text-primary)',  // ← bubble background (white in dark mode)
                  borderRadius: '6px',
                  padding: '0.6rem 0.75rem',
                  alignSelf: 'flex-start',
                  width: '90%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                }}>
                  {[88, 70].map((w, i) => (
                    <div key={i} style={{ height: '7px', width: `${w}%`, borderRadius: '4px', background: 'var(--bg)', opacity: 0.5 }} />
                  ))}
                </div>

                {/* Third AI message */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignSelf: 'flex-start', width: '70%' }}>
                  {[75, 50].map((w, i) => (
                    <div key={i} style={{ height: '8px', width: `${w}%`, borderRadius: '4px', background: 'var(--border)' }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          FEATURE CARDS
          - 3 cards in a row (collapses to 1 column on mobile)
          - To change an icon: replace the lucide component (LayoutPanelLeft,
            MousePointerClick, BookOpen) — browse all icons at lucide.dev
          - To add/remove a card: copy or delete a <FeatureCard ... /> block
          ============================================================ */}
      <section style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '0 2rem 6rem',    // ← bottom padding of the whole page
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',  // ← min card width before wrapping
          gap: '2rem',             // ← gap between cards
          maxWidth: '1500px',
          width: '100%',
        }}>
          {/* Card 1 — change icon, title, description freely */}
          <FeatureCard
            icon={<LayoutPanelLeft size={20} color="var(--text-secondary)" />}
            title="Workdesk mode"
            description="Resize, collapse, or swap panels. Your layout, your rules."
          />
          {/* Card 2 */}
          <FeatureCard
            icon={<MousePointerClick size={20} color="var(--text-secondary)" />}
            title="Highlight to ask"
            description="Select any text — explain, define, summarise in one click."
          />
          {/* Card 3 */}
          <FeatureCard
            icon={<BookOpen size={20} color="var(--text-secondary)" />}
            title="Page-aware AI"
            description="AI always knows what page you're on. Ask without context."
          />
        </div>
      </section>

    </div>
  )
}

/* ============================================================
   REUSABLE COMPONENTS — edit these to change all instances
   ============================================================ */

/* NavButton — used in the top navbar
   primary=true → filled (white bg in dark mode)
   primary=false (default) → outlined/ghost */
function NavButton({ onClick, label, primary }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.4rem 1rem',
        background: primary ? 'var(--text-primary)' : 'transparent',
        color: primary ? 'var(--bg)' : 'var(--text-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '8px',      // ← corner radius of nav buttons
        fontFamily: 'inherit',
        fontWeight: 500,
        fontSize: '0.85rem',
        cursor: 'pointer',
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {label}
    </button>
  )
}

/* FeatureCard — the three cards at the bottom
   Props: icon (any Lucide component), title, description */
function FeatureCard({ icon, title, description }) {
  return (
    <div style={{
      background: 'var(--surface)',   // ← card background
      border: '1px solid var(--border)',
      borderRadius: '10px',           // ← card corner radius
      padding: '1.5rem',              // ← inner padding
      display: 'flex',
      flexDirection: 'column',
      gap: '0.6rem',
    }}>
      {icon}
      <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{title}</p>
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>{description}</p>
    </div>
  )
}

/* Google SVG icon — used inside the primary CTA button */
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  )
}
