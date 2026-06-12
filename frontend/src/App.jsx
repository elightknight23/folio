import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useSessionStore from './store/sessionStore'
import DashboardPage from './pages/DashboardPage'
import WorkdeskPage from './pages/Workdesk'

// Code-split the landing page — its animation assets must never bloat the Workdesk bundle.
const LandingPage = lazy(() => import('./pages/LandingPage'))

function ProtectedRoute({ children }) {
  const user = useSessionStore((s) => s.user)
  return user ? children : <Navigate to="/" replace />
}

function PublicRoute({ children }) {
  const user = useSessionStore((s) => s.user)
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
              <LandingPage />
            </Suspense>
          </PublicRoute>
        }
      />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/workdesk/:id" element={<ProtectedRoute><WorkdeskPage /></ProtectedRoute>} />
    </Routes>
  )
}
