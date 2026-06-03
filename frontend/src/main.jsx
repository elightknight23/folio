import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/globals.css'
import AuthLayer from './components/auth/AuthLayer'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthLayer>
        <App />
      </AuthLayer>
    </BrowserRouter>
  </React.StrictMode>
)
