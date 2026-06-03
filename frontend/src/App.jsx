import { Routes, Route, Navigate } from 'react-router-dom'
import useSessionStore from './store/sessionStore'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import WorkdeskPage from './pages/Workdesk'

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
      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/workdesk" element={<ProtectedRoute><WorkdeskPage /></ProtectedRoute>} />
    </Routes>
  )
}
