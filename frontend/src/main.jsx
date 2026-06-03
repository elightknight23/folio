import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/globals.css'
import WorkdeskPage from './pages/Workdesk'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkdeskPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
