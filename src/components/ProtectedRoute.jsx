import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '../middlewares/authMiddleware'
import { getDashboardRoute } from '../utils/dashboardRoutes'

function ProtectedRoute({ user, children, allowedRoles }) {
  if (!isAuthenticated(user)) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardRoute(user.role)} replace />
  }

  return children
}

export default ProtectedRoute
