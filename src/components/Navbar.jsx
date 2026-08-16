import { Link } from 'react-router-dom'
import { getDashboardRoute } from '../utils/dashboardRoutes'
import ProfileDropdown from './ProfileDropdown'

function Navbar({ user, onLogout }) {
  const dashboardRoute = user ? getDashboardRoute(user.role) : '/'

  return (
    <header className="navbar">
      <div className="brand-wrap">
        <span className="brand-mark">B</span>
        <span className="brand-name">Bookit</span>
      </div>

      <nav className="nav-links">
        <Link to="/">Home</Link>
        {user && <Link to={dashboardRoute}>Dashboard</Link>}
        {user && <Link to="/calendar">Calendar</Link>}
        {user?.role === 'admin' && <Link to="/admin/rooms">Rooms</Link>}
      </nav>

      <div className="nav-actions">
        {user ? (
          <>
            <span className="user-badge">{user.email}</span>
            <ProfileDropdown user={user} onLogout={onLogout} />
          </>
        ) : (
          <Link to="/login" className="nav-button">
            Login
          </Link>
        )}
      </div>
    </header>
  )
}

export default Navbar
