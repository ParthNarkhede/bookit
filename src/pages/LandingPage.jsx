import { useNavigate } from 'react-router-dom'

function LandingPage() {
  const navigate = useNavigate()

  return (
    <main className="home-shell">
      <section className="welcome-card">
        <p className="eyebrow">Bookit workspace</p>
        <h1>Welcome to your booking portal</h1>
        <p className="subtitle">
          Manage bookings, track schedules, and collaborate with your team — all in one secure workspace.
        </p>
        <button type="button" className="primary-button" onClick={() => navigate('/login')}>
          Get Started
        </button>
      </section>
    </main>
  )
}

export default LandingPage
