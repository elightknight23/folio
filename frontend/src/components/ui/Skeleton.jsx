export default function Skeleton({ width = '100%', height = '1rem', borderRadius = '6px' }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: 'var(--surface)',
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
      }}
    />
  )
}
