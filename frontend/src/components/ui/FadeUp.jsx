// FadeUp.jsx — motion primitives for the landing page.
// ARCHITECTURE RULE: this is the ONLY file allowed to import framer-motion.
// Every animated element on the landing page goes through one of these wrappers.

import { useRef } from 'react'
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion'

const EASE = [0.25, 0.1, 0.25, 1]

/**
 * Fade-and-rise reveal, triggered once when scrolled into view.
 * Renders with opacity 0 before hydration — no unstyled flash.
 */
export function FadeUp({ children, delay = 0, y = 24, duration = 0.5, style, className }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Cross-fades content whenever `id` changes.
 * Used by the sticky feature showcase to swap the left-column text.
 */
export function FadeSwap({ id, children, style }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        style={style}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Scroll-linked entrance for the hero mockup: starts slightly scaled down
 * and tilted back, settles flat as it scrolls into view. GPU-only transforms.
 */
export function ScrollReveal({ children, style }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 100%', 'start 45%'],
  })
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1])
  const rotateX = useTransform(scrollYProgress, [0, 1], [9, 0])
  const opacity = useTransform(scrollYProgress, [0, 1], [0.55, 1])

  if (reduce) {
    return <div style={style}>{children}</div>
  }

  return (
    <div ref={ref} style={{ perspective: '1400px', ...style }}>
      <motion.div style={{ scale, rotateX, opacity, transformOrigin: 'center top' }}>
        {children}
      </motion.div>
    </div>
  )
}
