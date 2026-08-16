import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth } from '../firebase'

export async function signInUser(email, password) {
  if (!auth) {
    throw new Error('Authentication is not configured.')
  }

  const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
  return credential.user
}

export async function registerAuthUser(email, password) {
  if (!auth) {
    throw new Error('Authentication is not configured.')
  }

  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
  return credential.user
}

export async function signOutUser() {
  if (!auth) {
    return
  }

  await signOut(auth)
}

export function getAuthErrorMessage(error) {
  const code = error?.code || ''

  const messages = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/user-not-found': 'User Not found, register an account to continue.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
  }

  return messages[code] || 'Something went wrong. Please try again.'
}
