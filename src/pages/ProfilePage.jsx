import { getDashboardRoute } from '../utils/dashboardRoutes'
import { formatDisplayName } from '../utils/validators'

function ProfilePage({ user }) {
  const dashboardRoute = getDashboardRoute(user.role)
  const displayName = formatDisplayName(user.name)

  return (
    <main className="dashboard-shell">
      <section className="dashboard-card profile-card">
        <p className="eyebrow">Profile</p>
        <h1>{displayName}</h1>
        {/* <p className="subtitle">Your account details and active session information.</p> */}

        <div className="profile-hero">
          <span className="profile-hero-avatar">
            {displayName
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </span>
          <div>
            <h2>{displayName}</h2>
            <p>{user.email}</p>
          </div>
        </div>

        <div className="dashboard-meta profile-meta">
          <div>
            <span className="meta-label">Email</span>
            <span>{user.email}</span>
          </div>
          <div>
            <span className="meta-label">Role</span>
            <span className="role-chip">{user.role}</span>
          </div>
          {/* <div>
            <span className="meta-label">Account status</span>
            <span>Active</span>
          </div> */}
          <div>
            <span className="meta-label">Session expires</span>
            <span>{new Date(user.session.expiresAt).toLocaleString()}</span>
          </div>
          {/* <div>
            <span className="meta-label">User ID</span>
            <span className="mono-text">{user.uid}</span>
          </div>
          <div>
            <span className="meta-label">Dashboard</span>
            <span>{dashboardRoute}</span>
          </div> */}
        </div>
      </section>
    </main>
  )
}

export default ProfilePage
