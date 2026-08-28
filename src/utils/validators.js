const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 6

export function validateEmail(email) {
  if (!email?.trim()) {
    return 'Email is required.'
  }

  if (!EMAIL_PATTERN.test(email.trim())) {
    return 'Please enter a valid email address.'
  }

  return null
}

export function validatePassword(password) {
  if (!password) {
    return 'Password is required.'
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }

  return null
}

export function validatePasswordMatch(password, confirmPassword) {
  const passwordError = validatePassword(password)
  if (passwordError) {
    return passwordError
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match.'
  }

  return null
}

export function formatDisplayName(name) {
  if (!name) {
    return 'Employee'
  }

  const normalized = String(name)
    .trim()
    .replace(/[._]+/g, ' ')
    .replace(/\s+/g, ' ')

  if (!normalized) {
    return 'Employee'
  }

  return normalized
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

export function deriveNameFromEmail(email) {
  const localPart = (email || '').split('@')[0] || 'Employee'
  return formatDisplayName(localPart)
}
