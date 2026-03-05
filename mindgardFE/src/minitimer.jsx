import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import MiniTimerWindow from './components/MiniTimerWindow.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MiniTimerWindow />
  </StrictMode>,
)
