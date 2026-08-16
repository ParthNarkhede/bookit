import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ErrorPopup from '../components/ErrorPopup'
import { registerUser } from '../controllers/authController'

function SetupPage({ onSetupSuccess }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const result = await registerUser(email, password, confirmPassword)

      if (result.alreadyExists) {
        navigate('/login', { replace: true })
        return
      }

      if (result.success) {
        onSetupSuccess(result.user)
        return
      }

      setError(result.error || 'Unable to complete setup.')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseError = () => {
    setError('')
  }

  return (
    <>
      <main className="auth-shell">
        <section className="auth-card">
          <div className="auth-header">
            <div>
              <p className="eyebrow">New account</p>
              <h2>Setup your Bookit account</h2>
            </div>
            <button type="button" className="text-button" onClick={() => navigate('/login')}>
              Back
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="setup-email">
              Email
              <input
                id="setup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                required
              />
            </label>

            <label htmlFor="setup-password">
              Set password
              <input
                id="setup-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a password"
                required
              />
            </label>

            <label htmlFor="setup-confirm-password">
              Confirm password
              <input
                id="setup-confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your password"
                required
              />
            </label>

            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Save and continue'}
            </button>
          </form>

          <p className="auth-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-link">
              Sign in here
            </Link>
            .
          </p>
        </section>
      </main>

      <ErrorPopup message={error} onClose={handleCloseError} />
    </>
  )
}

export default SetupPage
