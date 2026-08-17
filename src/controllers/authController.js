import { signInUser, registerAuthUser, signOutUser, getAuthErrorMessage } from '../services/authService'
import {
  getUserByUid,
  createUserProfile,
} from '../services/userService'
import { isEmailEligible, markEligibleUserRegistered } from '../services/eligibleUserService'
import { persistUserSession, clearUserSession, isSessionValid } from '../services/sessionService'
import { setSessionCookie, clearSessionCookie } from '../utils/cookies'
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  deriveNameFromEmail,
} from '../utils/validators'

function buildUserProfile(userDoc, session) {
  return {
    uid: userDoc.uid,
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role || 'employee',
    session,
  }
}

async function finalizeAuthSession(uid) {
  const session = await persistUserSession(uid)
  const userDoc = await getUserByUid(uid)

  if (!userDoc) {
    throw new Error('User profile not found.')
  }

  const profile = buildUserProfile(userDoc, session)
  setSessionCookie({ uid, token: session.token, expiresAt: session.expiresAt })
  return profile
}

export async function loginUser(email, password) {
  const emailError = validateEmail(email)
  if (emailError) {
    return { success: false, error: emailError }
  }

  const passwordError = validatePassword(password)
  if (passwordError) {
    return { success: false, error: passwordError }
  }

  try {
    const firebaseUser = await signInUser(email, password)
    const userDoc = await getUserByUid(firebaseUser.uid)

    if (!userDoc) {
      await signOutUser()
      return {
        success: false,
        error: 'No profile found for this account. Please register with an approved email.',
      }
    }

    const profile = await finalizeAuthSession(firebaseUser.uid)
    return { success: true, user: profile }
  } catch (error) {
    return { success: false, error: getAuthErrorMessage(error) }
  }
}

export async function registerUser(email, password, confirmPassword) {
  const emailError = validateEmail(email)
  if (emailError) {
    return { success: false, error: emailError }
  }

  const passwordError = validatePasswordMatch(password, confirmPassword)
  if (passwordError) {
    return { success: false, error: passwordError }
  }

  const normalizedEmail = email.trim().toLowerCase()

  try {
    const eligible = await isEmailEligible(normalizedEmail)
    if (!eligible) {
      return {
        success: false,
        error: 'This email is not authorized to set up an account. Contact your administrator to add you as a user first.',
      }
    }

    const firebaseUser = await registerAuthUser(normalizedEmail, password)
    const existingProfile = await getUserByUid(firebaseUser.uid)

    if (existingProfile) {
      await signOutUser()
      return { success: false, alreadyExists: true }
    }

    const userProfile = {
      name: deriveNameFromEmail(normalizedEmail),
      email: normalizedEmail,
      role: 'employee',
      session: null,
      createdAt: Date.now(),
    }

    await createUserProfile(firebaseUser.uid, userProfile)
    await markEligibleUserRegistered(normalizedEmail)
    const profile = await finalizeAuthSession(firebaseUser.uid)
    return { success: true, user: profile }
  } catch (error) {
    if (error?.code === 'auth/email-already-in-use') {
      return { success: false, alreadyExists: true }
    }

    if (error?.code === 'permission-denied') {
      return {
        success: false,
        error: 'Unable to save your profile. Firestore permissions need to be configured for the users collection.',
      }
    }

    return { success: false, error: getAuthErrorMessage(error) }
  }
}

export async function logoutUser(uid) {
  if (uid) {
    try {
      await clearUserSession(uid)
    } catch {
      // Session cleanup failure should not block logout.
    }
  }

  clearSessionCookie()
  await signOutUser()
}

export async function resolveSessionFromCookie(cookieData) {
  if (!cookieData?.uid || !cookieData?.token) {
    return null
  }

  if (cookieData.expiresAt && Date.now() >= cookieData.expiresAt) {
    clearSessionCookie()
    return null
  }

  const userDoc = await getUserByUid(cookieData.uid)

  if (!userDoc || !isSessionValid(userDoc.session)) {
    clearSessionCookie()
    return null
  }

  if (userDoc.session.token !== cookieData.token) {
    clearSessionCookie()
    return null
  }

  return buildUserProfile(userDoc, userDoc.session)
}

export async function resolveSessionFromFirebase(firebaseUser) {
  if (!firebaseUser) {
    return null
  }

  const userDoc = await getUserByUid(firebaseUser.uid)

  if (!userDoc) {
    return null
  }

  if (!isSessionValid(userDoc.session)) {
    const session = await persistUserSession(firebaseUser.uid)
    setSessionCookie({ uid: firebaseUser.uid, token: session.token, expiresAt: session.expiresAt })
    return buildUserProfile({ ...userDoc, uid: firebaseUser.uid }, session)
  }

  setSessionCookie({
    uid: firebaseUser.uid,
    token: userDoc.session.token,
    expiresAt: userDoc.session.expiresAt,
  })

  return buildUserProfile({ ...userDoc, uid: firebaseUser.uid }, userDoc.session)
}
