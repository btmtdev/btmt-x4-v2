import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import App from './App.jsx'

if (!localStorage.getItem("device_id")) {
  localStorage.setItem("device_id", localStorage.getItem("visitor_id") || crypto.randomUUID())
  localStorage.removeItem("visitor_id")
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
