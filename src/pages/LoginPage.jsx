import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ErrorPopup from '../components/ErrorPopup'
import { loginUser } from '../controllers/authController'

function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)

    const result = await loginUser(email, password)

    if (result.success) {
      onLoginSuccess(result.user)
      return
    }

    setError(result.error || 'Incorrect email or password.')
    setIsSubmitting(false)
  }

  const handleCloseError = () => {
    setError('')
    setPassword('')
  }

  return (
    <>
      <main className="auth-shell">
        <section className="auth-card">
          <div className="auth-header">
            <div>
              <p className="eyebrow">Welcome back</p>
              <h2>Sign in to Bookit</h2>
            </div>
            <button type="button" className="text-button" onClick={() => navigate('/')}>
              Back
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="login-email">
              Email
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                required
              />
            </label>

            <label htmlFor="login-password">
              Password
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />
            </label>

            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="auth-muted">
            New to Bookit? Setup first,{' '}
            <Link to="/setup" className="text-link">
              Click here
            </Link>
            .
          </p>
        </section>
      </main>

      <ErrorPopup message={error} onClose={handleCloseError} />
    </>
  )
}

export default LoginPage
