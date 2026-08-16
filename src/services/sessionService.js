import { SESSION_MAX_AGE_DAYS } from '../utils/cookies'
import { updateUserSession } from './userService'

function generateSessionToken() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function buildSessionPayload() {
  const now = Date.now()
  const expiresAt = now + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000

  return {
    token: generateSessionToken(),
    createdAt: now,
    expiresAt,
  }
}

export function isSessionValid(session) {
  if (!session?.token || !session?.expiresAt) {
    return false
  }

  return Date.now() < session.expiresAt
}

export async function persistUserSession(uid) {
  const session = buildSessionPayload()
  await updateUserSession(uid, session)
  return session
}

export async function clearUserSession(uid) {
  await updateUserSession(uid, null)
}
