import { useState, useEffect, useRef } from 'react'
import {
  Sparkles, Lock, Moon, Sun, History,
  Upload, MessageSquareText, GraduationCap, ArrowRight,
} from 'lucide-react'
import { signInWithGoogle } from '../services/authService'
import useLayoutStore from '../store/layoutStore'
import { FadeUp, FadeSwap } from '../components/ui/FadeUp'

/* ============================================================
   LANDING PAGE — Notion light/dark, full-width layout
   Solid nav → split hero with bleeding mockup → sticky feature
   showcase → full-bleed bento band → how it works → ink CTA band
   ============================================================ */

// Shared full-width container — wide, edge-padded, used by every section
const container = {
  width: '100%',
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '0 clamp(1.5rem, 4vw, 3.5rem)',
}

export default function LandingPage() {
  const isMobile = useIsMobile()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowX: 'clip', background: 'var(--bg)', color: 'var(--text-primary)' }}>
      <Nav />
      <Hero isMobile={isMobile} />
      <Showcase isMobile={isMobile} />
      <Bento />
      <HowItWorks />
      <CTABanner />
      <Footer />
    </div>
  )
}

/* ============================================================
   NAV — solid, full-width, Notion-style
   ============================================================ */

function Nav() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--glass-bg)',
      WebkitBackdropFilter: 'blur(14px)',
      backdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        ...container,
        height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontWeight: 700, fontSize: '1.4rem', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          folio
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ThemeToggle />
          <NavButton onClick={signInWithGoogle} label="Get started" primary />
        </div>
      </div>
    </nav>
  )
}

function ThemeToggle() {
  const theme = useLayoutStore((s) => s.theme)
  const setTheme = useLayoutStore((s) => s.setTheme)
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '32px', height: '32px',
        background: hovered ? 'var(--surface)' : 'transparent',
        border: '1px solid transparent',
        borderRadius: '8px',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        transform: hovered ? 'rotate(12deg)' : 'rotate(0deg)',
        transition: 'background var(--dur-fast) ease, transform var(--dur-med) var(--ease-spring)',
        marginRight: '0.25rem',
      }}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}

/* ============================================================
   HERO — text left, workdesk mockup tilted and bleeding right
   ============================================================ */

function Hero({ isMobile }) {
  return (
    <section style={{ padding: 'clamp(3.5rem, 9vh, 6.5rem) 0 clamp(4.5rem, 11vh, 8rem)' }}>
      <div style={{
        ...container,
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
        gap: 'clamp(2.5rem, 5vw, 4rem)',
        alignItems: 'center',
      }}>
        {/* Left — copy */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1.5rem' }}>
          <FadeUp>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
              padding: '0.4rem 0.95rem', borderRadius: '999px',
              border: '1px solid var(--border)', background: 'var(--surface)',
              fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.02em',
              color: 'var(--text-secondary)',
            }}>
              <Sparkles size={13} style={{ color: 'var(--accent)' }} />
              AI-powered study tool
            </span>
          </FadeUp>

          <FadeUp delay={0.08}>
            <h1 style={{
              margin: 0,
              fontFamily: "'DM Serif Display', serif",
              fontSize: 'clamp(2.9rem, 5.4vw, 4.8rem)',
              fontWeight: 400,
              color: 'var(--text-primary)',
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
            }}>
              Read smarter.
              <br />
              <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Ask anything.</em>
            </h1>
          </FadeUp>

          <FadeUp delay={0.16}>
            <p style={{
              margin: 0,
              fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.7,
              maxWidth: '480px', letterSpacing: '-0.005em',
            }}>
              Folio puts your PDF and a context-aware AI side by side. It knows the page
              you're on, reads what you highlight, and remembers the whole document.
            </p>
          </FadeUp>

          <FadeUp delay={0.24}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.85rem' }}>
              <HeroCTA onClick={signInWithGoogle} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', opacity: 0.8 }}>
                Free to use · No credit card · Sign in with Google
              </span>
            </div>
          </FadeUp>
        </div>

        {/* Right — mockup, tilted, wider than its column so it bleeds off-screen */}
        <FadeUp delay={0.2} y={32}>
          <TiltedMockup isMobile={isMobile} />
        </FadeUp>
      </div>
    </section>
  )
}

/* Tilted mockup wrapper — eases toward flat on hover */
function TiltedMockup({ isMobile }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ perspective: isMobile ? 'none' : '1800px' }}
    >
      <div style={{
        width: isMobile ? '100%' : 'min(58vw, 920px)',
        transform: isMobile
          ? 'none'
          : hovered ? 'rotateY(-2deg) rotateX(0.5deg)' : 'rotateY(-7deg) rotateX(1.5deg)',
        transformOrigin: 'left center',
        transition: 'transform 0.6s var(--ease-out)',
      }}>
        <HeroMockup />
      </div>
    </div>
  )
}

/* ============================================================
   HERO MOCKUP — three-panel workdesk built from skeleton primitives
   ============================================================ */

function HeroMockup() {
  return (
    <div style={{
      border: '1px solid var(--border-strong)',
      borderRadius: '14px',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-lg)',
      background: 'var(--bg)',
    }}>
      {/* Title bar */}
      <div style={{
        height: '40px', background: 'var(--bg)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '1rem',
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          folio — workdesk
        </span>
      </div>

      {/* Panels: PDF | notes | chat */}
      <div style={{ display: 'flex', height: 'clamp(300px, 32vw, 440px)' }}>

        {/* PDF panel */}
        <div style={{
          flex: '0 0 50%', borderRight: '1px solid var(--border)',
          padding: '1.1rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '0.9rem',
          background: 'var(--pdf-bg)', position: 'relative',
        }}>
          <PanelLabel>PDF · Page 84</PanelLabel>
          <Lines widths={[92, 80, 68]} />
          {/* Highlighted line + tooltip */}
          <div style={{ position: 'relative', paddingTop: '4px' }}>
            <div style={{
              height: '9px', width: '74%', borderRadius: '4px',
              background: 'color-mix(in srgb, var(--accent) 30%, transparent)',
              outline: '1px solid color-mix(in srgb, var(--accent) 45%, transparent)',
            }} />
            <div style={{
              position: 'absolute', top: '-30px', left: '8%',
              display: 'flex', gap: '0.45rem', alignItems: 'center',
              padding: '0.32rem 0.65rem', borderRadius: '8px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-md)',
              fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
            }}>
              <Sparkles size={10} style={{ color: 'var(--accent)' }} />
              Explain · Define · Summarise
            </div>
          </div>
          <Lines widths={[85, 60, 78, 88, 52]} />
        </div>

        {/* Notes mini panel */}
        <div style={{
          flex: '0 0 20%', borderRight: '1px solid var(--border)',
          padding: '1.1rem 0.9rem', display: 'flex', flexDirection: 'column', gap: '1.1rem',
          minWidth: 0, background: 'var(--surface)',
        }}>
          <PanelLabel>Notes</PanelLabel>
          <div style={{
            background: 'var(--note-yellow-bg)', borderRadius: '2px 2px 8px 2px',
            padding: '0.6rem', transform: 'rotate(-1.2deg)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            display: 'flex', flexDirection: 'column', gap: '5px',
          }}>
            <Lines widths={[80, 55]} height={6} gap={5} color="var(--note-yellow-ink)" opacity={0.5} />
          </div>
          <div style={{
            background: 'var(--note-blue-bg)', borderRadius: '2px 2px 8px 2px',
            padding: '0.6rem', transform: 'rotate(1deg)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            display: 'flex', flexDirection: 'column', gap: '5px',
          }}>
            <Lines widths={[70, 85, 40]} height={6} gap={5} color="var(--note-blue-ink)" opacity={0.5} />
          </div>
        </div>

        {/* AI chat panel */}
        <div style={{ flex: 1, padding: '1.1rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '0.9rem', minWidth: 0, background: 'var(--bg)' }}>
          <PanelLabel>AI Assistant</PanelLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '78%' }}>
              <Lines widths={[85, 55]} />
            </div>
            <div style={{
              background: 'var(--accent)',
              borderRadius: '10px', padding: '0.6rem 0.75rem',
              width: '88%', display: 'flex', flexDirection: 'column', gap: '6px',
            }}>
              <Lines widths={[90, 72, 45]} height={7} gap={6} color="var(--on-accent)" opacity={0.55} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '65%' }}>
              <Lines widths={[75, 50]} />
            </div>
          </div>
          {/* Input bar */}
          <div style={{
            height: '32px', borderRadius: '9px',
            border: '1px solid var(--border-strong)', background: 'var(--bg)',
            display: 'flex', alignItems: 'center', padding: '0 0.7rem',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', opacity: 0.7 }}>Ask about page 84…</span>
            <ArrowRight size={12} style={{ color: 'var(--accent)' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   STICKY FEATURE SHOWCASE
   Left column sticks and cross-fades; right column scrolls
   through four feature vignettes. Stacks vertically on mobile.
   ============================================================ */

const FEATURES = [
  {
    id: 'rag',
    eyebrow: 'Hybrid retrieval',
    title: 'It knows where you are',
    description:
      'Every question carries two kinds of context — the page in front of you, and the most relevant passages from the entire document. Ask about chapter one from page eighty.',
    Vignette: RagVignette,
  },
  {
    id: 'highlight',
    eyebrow: 'Highlight-to-ask',
    title: 'Select it. Ask it.',
    description:
      'Highlight any sentence and act on it instantly — explain, define, or summarise without retyping a word.',
    Vignette: HighlightVignette,
  },
  {
    id: 'notes',
    eyebrow: 'Sticky notes',
    title: 'Thoughts, pinned to the page',
    description:
      'A scratchpad that lives next to your reading. Every note auto-saves per document, so it’s there when you come back.',
    Vignette: NotesVignette,
  },
  {
    id: 'focus',
    eyebrow: 'Focus mode',
    title: 'Your desk, your rules',
    description:
      'Resize panels, collapse the chat, or strip everything away for distraction-free reading. One click each way.',
    Vignette: FocusVignette,
  },
]

function Showcase({ isMobile }) {
  const [active, setActive] = useState(0)
  const panelRefs = useRef([])

  // Track which vignette is in view to drive the sticky left column
  useEffect(() => {
    if (isMobile) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(Number(entry.target.dataset.index))
        })
      },
      { threshold: 0.5 }
    )
    panelRefs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [isMobile])

  const feature = FEATURES[active]

  return (
    <section style={{ padding: '0 0 clamp(5rem, 11vh, 8rem)' }}>
      <div style={container}>
        <FadeUp style={{ maxWidth: '640px', marginBottom: 'clamp(3.5rem, 8vh, 5.5rem)' }}>
          <SectionEyebrow>The product</SectionEyebrow>
          <h2 style={sectionTitleStyle}>Built around the way you actually study</h2>
        </FadeUp>

        {isMobile ? (
          /* Mobile — plain vertical stack: text above each vignette */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4.5rem' }}>
            {FEATURES.map((f, i) => (
              <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <FadeUp>
                  <ShowcaseText index={i} feature={f} />
                </FadeUp>
                <FadeUp delay={0.1}>
                  <f.Vignette />
                </FadeUp>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop — sticky left text, scrolling right vignettes */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 340px) minmax(0, 1fr)',
            gap: 'clamp(3rem, 5vw, 5rem)',
            alignItems: 'start',
          }}>
            <div style={{ position: 'sticky', top: '30vh' }}>
              <FadeSwap id={feature.id}>
                <ShowcaseText index={active} feature={feature} />
              </FadeSwap>
              {/* Progress dots — clickable, scroll to their vignette */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '2rem' }}>
                {FEATURES.map((f, i) => (
                  <ProgressDot
                    key={f.id}
                    active={i === active}
                    label={f.title}
                    onClick={() => panelRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(4rem, 10vh, 7rem)' }}>
              {FEATURES.map((f, i) => (
                <div
                  key={f.id}
                  data-index={i}
                  ref={(el) => { panelRefs.current[i] = el }}
                >
                  <FadeUp>
                    <f.Vignette />
                  </FadeUp>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function ProgressDot({ active, label, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={label}
      style={{
        width: active ? '24px' : hovered ? '14px' : '8px',
        height: '8px', borderRadius: '999px',
        background: active
          ? 'var(--accent)'
          : hovered ? 'var(--text-secondary)' : 'var(--border-strong)',
        border: 'none', padding: 0, cursor: 'pointer',
        transition: 'width var(--dur-med) var(--ease-out), background var(--dur-fast) ease',
      }}
    />
  )
}

function ShowcaseText({ index, feature }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <span style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '0.95rem',
        color: 'var(--text-secondary)',
        letterSpacing: '0.04em',
      }}>
        {String(index + 1).padStart(2, '0')} / {String(FEATURES.length).padStart(2, '0')}
      </span>
      <SectionEyebrow>{feature.eyebrow}</SectionEyebrow>
      <h3 style={{
        margin: 0,
        fontFamily: "'DM Serif Display', serif",
        fontSize: 'clamp(1.7rem, 3.2vw, 2.4rem)',
        fontWeight: 400,
        color: 'var(--text-primary)',
        letterSpacing: '-0.02em',
        lineHeight: 1.15,
      }}>
        {feature.title}
      </h3>
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7 }}>
        {feature.description}
      </p>
    </div>
  )
}

/* ---------- Vignettes — stylised feature illustrations ---------- */

function VignetteFrame({ children, style }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${hovered ? 'var(--border-strong)' : 'var(--border)'}`,
        borderRadius: '16px',
        background: 'var(--surface)',
        padding: 'clamp(2rem, 4vw, 3.5rem)',
        minHeight: '500px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        overflow: 'hidden',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? 'var(--shadow-md)' : 'none',
        transition: 'transform var(--dur-med) var(--ease-out), box-shadow var(--dur-med) var(--ease-out), border-color var(--dur-fast) ease',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function RagVignette() {
  return (
    <VignetteFrame>
      {/* Horizontal flow: page → contexts → answer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 'clamp(1.25rem, 3vw, 2.5rem)', flexWrap: 'wrap',
      }}>
        {/* Mini page */}
        <div style={{
          width: '220px', background: 'var(--bg)',
          border: '1px solid var(--border)', borderRadius: '10px',
          padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '8px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <span style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            Page 84
          </span>
          <Lines widths={[90, 75, 85, 55, 80, 62]} height={7} gap={7} />
        </div>

        {/* Context chips with flow arrows */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
          <ContextChip label="This page" />
          <ArrowRight size={16} style={{ color: 'var(--text-secondary)', opacity: 0.6 }} />
          <ContextChip label="Whole document" />
        </div>

        {/* Answer bubble */}
        <div style={{
          width: '240px',
          background: 'var(--accent)',
          borderRadius: '12px', padding: '1rem 1.1rem',
          display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          <Lines widths={[92, 70, 85, 48]} height={7} gap={7} color="var(--on-accent)" opacity={0.55} />
        </div>
      </div>
      <p style={{
        margin: '2.25rem 0 0', textAlign: 'center',
        fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)',
      }}>
        Local + global context, on every question
      </p>
    </VignetteFrame>
  )
}

function ContextChip({ label }) {
  const [hovered, setHovered] = useState(false)
  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
        padding: '0.35rem 0.8rem', borderRadius: '999px',
        border: `1px solid ${hovered ? 'var(--accent)' : 'var(--border-strong)'}`,
        background: hovered ? 'color-mix(in srgb, var(--accent) 8%, var(--bg))' : 'var(--bg)',
        fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)',
        cursor: 'default',
        transition: 'border-color var(--dur-fast) ease, background var(--dur-fast) ease',
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)' }} />
      {label}
    </span>
  )
}

function HighlightVignette() {
  return (
    <VignetteFrame>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '600px', margin: '0 auto', width: '100%', position: 'relative' }}>
        <Lines widths={[95, 88]} height={8} gap={11} />
        {/* Real highlighted sentence */}
        <p style={{ margin: '0.3rem 0', fontSize: '1.05rem', lineHeight: 1.75, color: 'var(--text-primary)' }}>
          The reaction is driven by the{' '}
          <span style={{
            background: 'color-mix(in srgb, var(--accent) 22%, transparent)',
            borderRadius: '3px', padding: '0.05rem 0.15rem',
          }}>
            mitochondrial membrane potential
          </span>
          , which stores energy…
        </p>
        <Lines widths={[90, 70, 82, 60]} height={8} gap={11} />

        {/* Floating action tooltip — pills respond to hover */}
        <div style={{
          position: 'absolute', top: '-18px', right: '0',
          display: 'flex', gap: '0.3rem',
          padding: '0.35rem', borderRadius: '10px',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
        }}>
          {['Explain', 'Define', 'Summarise'].map((a, i) => (
            <TooltipPill key={a} label={a} primary={i === 0} />
          ))}
        </div>
      </div>
    </VignetteFrame>
  )
}

function TooltipPill({ label, primary }) {
  const [hovered, setHovered] = useState(false)
  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '0.3rem 0.65rem', borderRadius: '7px',
        fontSize: '0.7rem', fontWeight: 600,
        cursor: 'default',
        color: primary ? 'var(--on-accent)' : 'var(--text-primary)',
        background: primary
          ? hovered ? 'var(--accent-hover)' : 'var(--accent)'
          : hovered ? 'var(--surface)' : 'transparent',
        transition: 'background var(--dur-fast) ease',
      }}
    >
      {label}
    </span>
  )
}

function NotesVignette() {
  const notes = [
    { color: 'yellow', tilt: '-1.6deg', lines: [85, 60, 40], label: 'Ch. 4 — key formula' },
    { color: 'blue', tilt: '1.4deg', lines: [70, 88, 55], label: 'Ask about fig. 12' },
    { color: 'pink', tilt: '-0.8deg', lines: [80, 50, 65], label: 'Revise before exam' },
  ]
  return (
    <VignetteFrame>
      {/* sticky-note class straightens + lifts each note on hover */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', padding: '0.5rem 0' }}>
        {notes.map((n) => (
          <div key={n.color} className="sticky-note" style={{
            '--note-tilt': n.tilt,
            width: '185px',
            background: `var(--note-${n.color}-bg)`,
            color: `var(--note-${n.color}-ink)`,
            padding: '1.2rem 1.05rem 1rem',
            display: 'flex', flexDirection: 'column', gap: '10px',
          }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.4 }}>{n.label}</span>
            <Lines widths={n.lines} height={6} gap={7} color="currentColor" opacity={0.4} />
          </div>
        ))}
      </div>
      <p style={{
        margin: '2.25rem 0 0', textAlign: 'center',
        fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)',
      }}>
        Auto-saved ✓
      </p>
    </VignetteFrame>
  )
}

function FocusVignette() {
  return (
    <VignetteFrame>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', alignItems: 'center' }}>
        {/* Workdesk frame: collapsed rails, full-width PDF */}
        <div style={{
          width: 'min(560px, 100%)', height: '250px',
          border: '1px solid var(--border-strong)', borderRadius: '12px',
          overflow: 'hidden', display: 'flex', background: 'var(--bg)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ width: '14px', background: 'var(--surface-2)', borderRight: '1px solid var(--border)' }} />
          <div style={{ flex: 1, background: 'var(--bg)', padding: '1.1rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '9px' }}>
            <Lines widths={[92, 78, 85, 60, 88, 70, 45]} height={7} gap={7} />
          </div>
          <div style={{ width: '14px', background: 'var(--surface-2)', borderLeft: '1px solid var(--border)' }} />
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
          padding: '0.35rem 0.85rem', borderRadius: '999px',
          border: '1px solid var(--border)', background: 'var(--bg)',
          fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
          Focus mode — panels collapsed
        </span>
      </div>
    </VignetteFrame>
  )
}

/* ============================================================
   BENTO — full-bleed surface band
   ============================================================ */

function Bento() {
  const cards = [
    {
      icon: <Lock size={20} />,
      title: 'Private by default',
      description: 'Your documents live in your own secure storage — Google sign-in, row-level security, signed URLs.',
    },
    {
      icon: <History size={20} />,
      title: 'Picks up where you left off',
      description: 'Folio saves your page, chat history, and notes per session. Close the tab; lose nothing.',
    },
    {
      icon: <Moon size={20} />,
      title: 'Easy on the eyes',
      description: 'A native dark mode designed for long reading sessions — applied before the page even paints.',
    },
  ]
  return (
    <section style={{
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      padding: 'clamp(5rem, 10vh, 7rem) 0',
    }}>
      <div style={{ ...container, display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        <FadeUp style={{ maxWidth: '560px' }}>
          <SectionEyebrow>The details</SectionEyebrow>
          <h2 style={sectionTitleStyle}>Everything else, handled</h2>
        </FadeUp>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}>
          {cards.map((card, i) => (
            <FadeUp key={card.title} delay={i * 0.08}>
              <BentoCard {...card} />
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}

function BentoCard({ icon, title, description }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: '100%',
        background: 'var(--bg)',
        border: `1px solid ${hovered ? 'var(--border-strong)' : 'var(--border)'}`,
        borderRadius: '14px',
        padding: '2rem',
        display: 'flex', flexDirection: 'column', gap: '0.6rem',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transition: 'transform var(--dur-med) var(--ease-out), box-shadow var(--dur-med) var(--ease-out), border-color var(--dur-fast) ease',
      }}
    >
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-primary)', marginBottom: '0.75rem',
        transform: hovered ? 'translateY(-2px) rotate(-4deg)' : 'translateY(0) rotate(0deg)',
        transition: 'transform var(--dur-med) var(--ease-spring)',
      }}>
        {icon}
      </div>
      <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.05rem', letterSpacing: '-0.015em' }}>{title}</p>
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>{description}</p>
    </div>
  )
}

/* ============================================================
   HOW IT WORKS
   ============================================================ */

function HowItWorks() {
  const steps = [
    { n: '01', icon: <Upload size={18} />, title: 'Upload your PDF', description: 'Drop in a textbook, paper, or lecture notes. Every page gets indexed.' },
    { n: '02', icon: <MessageSquareText size={18} />, title: 'Ask your AI', description: 'Chat about anything in the document — the current page or chapter one.' },
    { n: '03', icon: <GraduationCap size={18} />, title: 'Study smarter', description: 'Notes, highlights, and answers — all saved, all in one place.' },
  ]
  return (
    <section style={{ padding: 'clamp(5rem, 10vh, 7rem) 0' }}>
      <div style={{ ...container, display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
        <FadeUp style={{ maxWidth: '560px' }}>
          <SectionEyebrow>How it works</SectionEyebrow>
          <h2 style={sectionTitleStyle}>Three steps to smarter study</h2>
        </FadeUp>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '2.5rem',
        }}>
          {steps.map((step, i) => (
            <FadeUp key={step.n} delay={i * 0.1}>
              <Step {...step} />
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}

function Step({ n, icon, title, description }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '2rem',
          color: hovered ? 'var(--accent)' : 'var(--text-secondary)',
          lineHeight: 1,
          transition: 'color var(--dur-med) ease',
        }}>
          {n}
        </span>
        <div style={{
          width: '34px', height: '34px', borderRadius: '10px',
          background: 'var(--surface)',
          border: `1px solid ${hovered ? 'var(--border-strong)' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-primary)',
          transform: hovered ? 'translateY(-2px) rotate(-3deg)' : 'translateY(0) rotate(0deg)',
          transition: 'transform var(--dur-med) var(--ease-spring), border-color var(--dur-fast) ease',
        }}>
          {icon}
        </div>
      </div>
      <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.02rem', letterSpacing: '-0.015em' }}>{title}</p>
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>{description}</p>
    </div>
  )
}

/* ============================================================
   CTA — full-bleed ink band
   ============================================================ */

function CTABanner() {
  return (
    <section style={{
      background: 'var(--text-primary)',
      padding: 'clamp(5rem, 11vh, 8rem) 0',
    }}>
      <div style={{
        ...container,
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        gap: '1.6rem',
      }}>
        <FadeUp>
          <h2 style={{
            margin: 0,
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontWeight: 400,
            color: 'var(--bg)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}>
            Your next study session starts here
          </h2>
        </FadeUp>
        <FadeUp delay={0.1}>
          <p style={{
            margin: 0,
            fontSize: '1rem',
            color: 'color-mix(in srgb, var(--bg) 65%, transparent)',
            maxWidth: '440px',
            lineHeight: 1.7,
          }}>
            Upload a PDF and start asking. Free to use, sign in with Google.
          </p>
        </FadeUp>
        <FadeUp delay={0.18}>
          <HeroCTA onClick={signInWithGoogle} inverted />
        </FadeUp>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer style={{
      padding: '2rem clamp(1.5rem, 4vw, 3.5rem)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: '1rem',
    }}>
      <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>folio</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <a
          href="https://github.com/elightknight23/folio"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.8rem', color: 'var(--text-secondary)',
            textDecoration: 'none',
            transition: 'color var(--dur-fast) ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)' }}
        >
          <GitHubIcon />
          GitHub
        </a>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Made by Nithik Deva</span>
      </div>
    </footer>
  )
}

/* ============================================================
   SHARED PRIMITIVES
   ============================================================ */

const sectionTitleStyle = {
  margin: '0.75rem 0 0',
  fontFamily: "'DM Serif Display', serif",
  fontSize: 'clamp(1.9rem, 4vw, 2.8rem)',
  fontWeight: 400,
  color: 'var(--text-primary)',
  letterSpacing: '-0.02em',
  lineHeight: 1.15,
}

function SectionEyebrow({ children }) {
  return (
    <span style={{
      display: 'block',
      fontSize: '0.72rem', fontWeight: 700,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      color: 'var(--text-secondary)',
    }}>
      {children}
    </span>
  )
}

function PanelLabel({ children }) {
  return (
    <span style={{
      fontSize: '0.65rem', fontWeight: 600,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color: 'var(--text-secondary)',
    }}>
      {children}
    </span>
  )
}

function Lines({ widths, height = 8, gap = 8, color = 'var(--border-strong)', opacity = 0.9 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}>
      {widths.map((w, i) => (
        <div key={i} style={{
          height: `${height}px`, width: `${w}%`,
          borderRadius: '4px', background: color, opacity,
        }} />
      ))}
    </div>
  )
}

function HeroCTA({ onClick, inverted }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
        padding: '0.8rem 1.6rem',
        background: inverted ? 'var(--bg)' : 'var(--text-primary)',
        color: inverted ? 'var(--text-primary)' : 'var(--bg)',
        border: 'none', borderRadius: '10px',
        fontFamily: 'inherit', fontWeight: 600, fontSize: '0.95rem',
        letterSpacing: '-0.01em', cursor: 'pointer',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        opacity: hovered ? 0.92 : 1,
        transition: 'transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out), opacity var(--dur-fast) ease',
      }}
    >
      <GoogleIcon />
      Continue with Google
      <ArrowRight size={15} style={{
        transform: hovered ? 'translateX(3px)' : 'translateX(0)',
        transition: 'transform var(--dur-fast) var(--ease-spring)',
      }} />
    </button>
  )
}

function NavButton({ onClick, label, primary }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '0.45rem 1rem',
        background: primary
          ? 'var(--text-primary)'
          : hovered ? 'var(--surface)' : 'transparent',
        color: primary ? 'var(--bg)' : 'var(--text-primary)',
        border: '1px solid transparent',
        borderRadius: '8px',
        fontFamily: 'inherit', fontWeight: 500, fontSize: '0.85rem',
        letterSpacing: '-0.01em', cursor: 'pointer',
        opacity: primary && hovered ? 0.88 : 1,
        transition: 'background var(--dur-fast) ease, opacity var(--dur-fast) ease',
      }}
    >
      {label}
    </button>
  )
}

function GitHubIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

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

/* ============================================================
   HOOKS
   ============================================================ */

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia('(max-width: 768px)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const onChange = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return isMobile
}
