import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore'
import { db } from '../firebase'

const USERS_COLLECTION = 'users'

export async function getUserByUid(uid) {
  if (!db || !uid) {
    return null
  }

  const snapshot = await getDoc(doc(db, USERS_COLLECTION, uid))
  return snapshot.exists() ? { uid, ...snapshot.data() } : null
}

export async function createUserProfile(uid, profile) {
  if (!db || !uid) {
    throw new Error('Database is not available.')
  }

  const userRef = doc(db, USERS_COLLECTION, uid)
  await setDoc(userRef, profile)
  return { uid, ...profile }
}

export async function updateUserSession(uid, session) {
  if (!db || !uid) {
    throw new Error('Database is not available.')
  }

  const userRef = doc(db, USERS_COLLECTION, uid)
  await updateDoc(userRef, { session: session ?? deleteField() })
}
