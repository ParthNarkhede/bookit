import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardRoute } from '../utils/dashboardRoutes'
import { formatDisplayName } from '../utils/validators'

function ProfileDropdown({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayName = formatDisplayName(user.name)
  const initials = displayName
    ? displayName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U'

  return (
    <div className="profile-menu" ref={menuRef}>
      <button
        type="button"
        className="profile-trigger"
        aria-label="Open profile menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="profile-avatar">{initials}</span>
      </button>

      {isOpen && (
        <div className="profile-dropdown">
          <div className="profile-dropdown-header">
            <strong>{displayName}</strong>
            <span>{user.email}</span>
          </div>
          <Link to="/profile" className="profile-dropdown-link" onClick={() => setIsOpen(false)}>
            Profile
          </Link>
          <Link
            to={getDashboardRoute(user.role)}
            className="profile-dropdown-link"
            onClick={() => setIsOpen(false)}
          >
            Dashboard
          </Link>
          <button
            type="button"
            className="profile-dropdown-button"
            onClick={() => {
              setIsOpen(false)
              onLogout()
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

export default ProfileDropdown
