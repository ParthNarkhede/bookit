import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '../middlewares/authMiddleware'
import { getDashboardRoute } from '../utils/dashboardRoutes'

function GuestRoute({ user, children }) {
  if (isAuthenticated(user)) {
    return <Navigate to={getDashboardRoute(user.role)} replace />
  }

  return children
}

export default GuestRoute
