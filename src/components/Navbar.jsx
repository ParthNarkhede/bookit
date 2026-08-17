import { Link } from 'react-router-dom'
import { getDashboardRoute } from '../utils/dashboardRoutes'
import ProfileDropdown from './ProfileDropdown'
import assets from '../assets/asset'

function Navbar({ user, onLogout }) {
  const dashboardRoute = user ? getDashboardRoute(user.role) : '/'

  return (
    <header className="navbar">
      <div className="brand-wrap">
        <div className="brand-mark">
          <img
            src={assets.images.roundTableLogo}
            alt="Bookit"
          />
        </div>

        <span className="brand-name">Bookit</span>
        {/* <span className="brand-name">Bookit</span> */}
      </div>

      <nav className="nav-links">
        {/* <Link to="/">Home</Link> */}
        {user && <Link to={dashboardRoute}>Dashboard</Link>}
        {user && <Link to="/calendar">Calendar</Link>}
        {user?.role === 'admin' && (
          <>
            <Link to="/admin/rooms">Rooms</Link>
            <Link to="/admin/users">Users</Link>
            <Link to="/admin/analytics">Analytics</Link>
          </>
        )}
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
