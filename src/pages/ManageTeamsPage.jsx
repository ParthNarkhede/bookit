import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { removeTeam, saveTeam } from '../controllers/teamController'
import { subscribeToTeams } from '../services/teamService'

function ManageTeamsPage({ user }) {
  const navigate = useNavigate()
  const [teams, setTeams] = useState([])
  const [name, setName] = useState('')
  const [editingTeam, setEditingTeam] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const unsubscribe = subscribeToTeams(setTeams, () => setError('Unable to load teams. Check Firebase read permissions.'))
    return unsubscribe
  }, [])

  const handleSave = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    setMessage('')

    const result = await saveTeam({ teamId: editingTeam?.id, name, userId: user.uid })
    setIsSubmitting(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setName('')
    setEditingTeam(null)
    setMessage(editingTeam ? 'Team updated.' : 'Team added.')
  }

  const handleRemove = async (team) => {
    if (!window.confirm(`Remove ${team.name} from booking options?`)) {
      return
    }

    const result = await removeTeam(team)
    if (!result.success) {
      setError(result.error)
      return
    }

    setMessage('Team removed.')
  }

  return (
    <main className="dashboard-shell admin-dashboard-shell">
      <header className="dashboard-page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Manage teams</h1>
          <p className="subtitle">Maintain the optional team choices employees can add to bookings.</p>
        </div>
        <button type="button" className="text-button" onClick={() => navigate('/admindashboard')}>
          Back to dashboard
        </button>
      </header>

      <section className="dashboard-section-card team-management-section">
        <h2>{editingTeam ? `Edit ${editingTeam.name}` : 'Add a team'}</h2>
        <form className="team-management-form" onSubmit={handleSave}>
          <label htmlFor="team-name">Team name</label>
          <input
            id="team-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter a team name"
            maxLength={60}
            required
          />
          <div className="team-management-actions">
            {editingTeam && (
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setEditingTeam(null)
                  setName('')
                }}
              >
                Cancel
              </button>
            )}
            <button type="submit" className="primary-button inline-button" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingTeam ? 'Save team' : 'Add team'}
            </button>
          </div>
        </form>

        {error && <p className="auth-message error">{error}</p>}
        {message && <p className="auth-message success">{message}</p>}
      </section>

      <section className="dashboard-section-card team-management-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Booking options</p>
            <h2>Teams</h2>
          </div>
        </div>
        <div className="team-management-list">
          {teams.map((team) => (
            <article key={team.id} className="team-management-row">
              <div className="team-management-name">
                <strong>{team.name}</strong>
              </div>
              <div className="team-management-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setEditingTeam(team)
                    setName(team.name)
                    setError('')
                  }}
                >
                  Edit
                </button>
                <button type="button" className="text-button danger-text" onClick={() => handleRemove(team)}>
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
        {teams.length === 0 && <p className="empty-state">No teams added yet.</p>}
      </section>
    </main>
  )
}

export default ManageTeamsPage
