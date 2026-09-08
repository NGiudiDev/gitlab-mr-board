// 2. Dependencias externas.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// 6. Imports relativos restantes.
import App from './app/App.jsx'

// 7. Hojas de estilo.
import './assets/main.css'

createRoot(document.getElementById('app')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
