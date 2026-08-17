import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createEligibleUser,
  deleteEligibleUser,
  fetchEligibleUsers,
  importEligibleUsersFromFile,
} from '../controllers/eligibleUserController'

function ManageUsersPage({ user }) {
  const [users, setUsers] = useState([])
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadUsers = async () => {
    setIsLoading(true)
    const result = await fetchEligibleUsers()
    setUsers(result.users)
    setIsLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleAddUser = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    setMessage('')

    const result = await createEligibleUser(email, user.email)
    setIsSubmitting(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setEmail('')
    setMessage('User added to eligible list.')
    loadUsers()
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setIsSubmitting(true)
    setError('')
    setMessage('')

    const result = await importEligibleUsersFromFile(file, user.email)
    setIsSubmitting(false)
    event.target.value = ''

    if (!result.success) {
      setError(result.error)
      return
    }

    setMessage(result.message)
    loadUsers()
  }

  const handleRemove = async (entry) => {
    if (entry.registeredAt) {
      setError('Cannot remove an email that has already registered.')
      return
    }

    const confirmed = window.confirm(`Remove ${entry.email} from the eligible list?`)
    if (!confirmed) {
      return
    }

    const result = await deleteEligibleUser(entry.email)
    if (!result.success) {
      setError(result.error)
      return
    }

    setMessage('User removed.')
    loadUsers()
  }

  return (
    <main className="dashboard-shell admin-dashboard-shell">
      <header className="dashboard-page-header manage-rooms-toolbar">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Manage users</h1>
          <p className="subtitle">Only emails on this list can create an account.</p>
        </div>
        <Link to="/admindashboard" className="text-button">
          Back to dashboard
        </Link>
      </header>

      <section className="dashboard-card admin-panel-card">
        <h2>Add eligible user</h2>
        <form className="auth-form inline-form" onSubmit={handleAddUser}>
          <label htmlFor="eligible-email">
            Email address
            <input
              id="eligible-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="employee@company.com"
              required
            />
          </label>
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            Add user
          </button>
        </form>

        <div className="upload-section">
          <h3>Bulk upload</h3>
          <p className="subtitle">Upload a CSV or Excel file with emails in the first column.</p>
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.txt"
            onChange={handleFileUpload}
            disabled={isSubmitting}
          />
        </div>
      </section>

      <section className="dashboard-card admin-panel-card">
        <h2>Eligible users ({users.length})</h2>
        {isLoading ? (
          <p>Loading...</p>
        ) : users.length === 0 ? (
          <p className="subtitle">No eligible users yet.</p>
        ) : (
          <div className="eligible-users-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Added</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.email}</td>
                    <td>
                      <span className={`status-pill ${entry.registeredAt ? 'is-registered' : 'is-pending'}`}>
                        {entry.registeredAt ? 'Registered' : 'Pending'}
                      </span>
                    </td>
                    <td>{entry.addedAt ? new Date(entry.addedAt).toLocaleDateString() : '—'}</td>
                    <td>
                      {!entry.registeredAt && (
                        <button type="button" className="text-button danger-text" onClick={() => handleRemove(entry)}>
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {error && <p className="auth-message error">{error}</p>}
      {message && <p className="auth-message success">{message}</p>}
    </main>
  )
}

export default ManageUsersPage
