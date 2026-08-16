export function getDashboardRoute(role) {
  const normalizedRole = String(role || '').toLowerCase()

  if (normalizedRole === 'admin') {
    return '/admindashboard'
  }

  return '/userdashboard'
}
