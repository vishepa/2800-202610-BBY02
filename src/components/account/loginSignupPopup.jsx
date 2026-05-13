import { useState } from 'react'
import { databaseConnection } from '../../database/databaseConnection.js'

export default function LoginSignupPopup({ onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleAuth = async (type) => {
    setError(null)
    setMessage(null)
    setLoading(true)

    if (type === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else {
        setMessage('Logged in successfully!')
        onClose?.() // close popup on success
      }

    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account!')
    }

    setLoading(false)
  }

  return (
    <div className="overlay">
      <div className="popup">
        <button className="close-btn" onClick={onClose}>✕</button>
        <h1>Login / Signup</h1>

        {error   && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        <div className="buttons">
          <button onClick={() => handleAuth('login')}  disabled={loading}>
            {loading ? 'Loading...' : 'Login'}
          </button>
          <button onClick={() => handleAuth('signup')} disabled={loading}>
            {loading ? 'Loading...' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  )
}