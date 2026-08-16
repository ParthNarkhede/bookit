const SESSION_COOKIE_NAME = 'bookit_session'
const SESSION_MAX_AGE_DAYS = 4

export function setSessionCookie(sessionData) {
  const expires = new Date()
  expires.setDate(expires.getDate() + SESSION_MAX_AGE_DAYS)

  const encoded = encodeURIComponent(JSON.stringify(sessionData))
  document.cookie = `${SESSION_COOKIE_NAME}=${encoded}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`
}

export function getSessionCookie() {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${SESSION_COOKIE_NAME}=`))

  if (!match) {
    return null
  }

  try {
    const value = match.split('=').slice(1).join('=')
    return JSON.parse(decodeURIComponent(value))
  } catch {
    return null
  }
}

export function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict`
}

export { SESSION_MAX_AGE_DAYS }
