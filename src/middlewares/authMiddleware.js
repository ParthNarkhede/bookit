import { getSessionCookie } from '../utils/cookies'
import { resolveSessionFromCookie, resolveSessionFromFirebase } from '../controllers/authController'

export async function resolveAuthenticatedUser(firebaseUser) {
  const cookieData = getSessionCookie()

  if (cookieData) {
    const userFromCookie = await resolveSessionFromCookie(cookieData)
    if (userFromCookie) {
      return userFromCookie
    }
  }

  if (firebaseUser) {
    return resolveSessionFromFirebase(firebaseUser)
  }

  return null
}

export function isAuthenticated(user) {
  return Boolean(user?.uid && user?.session)
}
