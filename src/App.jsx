import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SetupPage from './pages/SetupPage'
import ProfilePage from './pages/ProfilePage'
import EmployeeDashboardPage from './pages/EmployeeDashboardPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import ManageRoomsPage from './pages/ManageRoomsPage'
import CalendarPage from './pages/CalendarPage'
import { auth } from './firebase'
import { logoutUser } from './controllers/authController'
import { resolveAuthenticatedUser } from './middlewares/authMiddleware'
import { getDashboardRoute } from './utils/dashboardRoutes'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!auth) {
      setAuthReady(true)
      return undefined
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        const resolvedUser = await resolveAuthenticatedUser(firebaseUser)
        setUser(resolvedUser)
      } catch {
        setUser(null)
      } finally {
        setAuthReady(true)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleAuthSuccess = (userProfile) => {
    setUser(userProfile)
    navigate(getDashboardRoute(userProfile?.role), { replace: true })
  }

  const handleLogout = async () => {
    await logoutUser(user?.uid)
    setUser(null)
    navigate('/', { replace: true })
  }

  if (!authReady) {
    return (
      <div className="page-shell">
        <main className="home-shell">
          <section className="welcome-card loading-card">
            <p className="eyebrow">Bookit workspace</p>
            <h1>Loading your session...</h1>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <Navbar user={user} onLogout={handleLogout} />

      <Routes>
        <Route
          path="/"
          element={
            user ? <Navigate to={getDashboardRoute(user.role)} replace /> : <LandingPage />
          }
        />

        <Route
          path="/login"
          element={
            <GuestRoute user={user}>
              <LoginPage onLoginSuccess={handleAuthSuccess} />
            </GuestRoute>
          }
        />

        <Route
          path="/setup"
          element={
            <GuestRoute user={user}>
              <SetupPage onSetupSuccess={handleAuthSuccess} />
            </GuestRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute user={user}>
              <ProfilePage user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/calendar"
          element={
            <ProtectedRoute user={user}>
              <CalendarPage user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/rooms"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin']}>
              <ManageRoomsPage user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admindashboard"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin']}>
              <AdminDashboardPage user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/userdashboard"
          element={
            <ProtectedRoute user={user} allowedRoles={['employee']}>
              <EmployeeDashboardPage user={user} />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
