import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './components/shared/authentication/Authentication.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider> {/* yay authentication! */}
      <App />
    </AuthProvider>
  </StrictMode>
)