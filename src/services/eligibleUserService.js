import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore'

const COLLECTION = 'eligibleUsers'

async function getDb() {
  if (typeof window === 'undefined' && typeof process !== 'undefined') {
    return null
  }

  const { db } = await import('../firebase')
  return db
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

export function isEmailEligibleEntry(email, entry) {
  const normalized = normalizeEmail(email)
  const docEmail = normalizeEmail(entry?.email)

  if (!normalized || !docEmail || normalized !== docEmail) {
    return false
  }

  return !entry?.registeredAt
}

export async function getEligibleUser(email) {
  const db = await getDb()
  if (!db) {
    return null
  }

  const emailId = normalizeEmail(email)
  const snapshot = await getDoc(doc(db, COLLECTION, emailId))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

export async function isEmailEligible(email) {
  const entry = await getEligibleUser(email)
  return isEmailEligibleEntry(email, entry)
}

export async function listEligibleUsers() {
  const db = await getDb()
  if (!db) {
    return []
  }

  const snapshot = await getDocs(collection(db, COLLECTION))
  return snapshot.docs
    .map((entry) => ({ id: entry.id, ...entry.data() }))
    .sort((a, b) => (a.email || '').localeCompare(b.email || ''))
}

export async function addEligibleUser(email, addedBy = '') {
  const db = await getDb()
  if (!db) {
    throw new Error('Database is not configured.')
  }

  const normalized = normalizeEmail(email)
  if (!normalized || !normalized.includes('@')) {
    throw new Error('Invalid email address.')
  }

  const existingEntry = await getEligibleUser(normalized)
  if (existingEntry?.registeredAt) {
    throw new Error('This email has already registered and cannot be re-added.')
  }

  await setDoc(
    doc(db, COLLECTION, normalized),
    {
      email: normalized,
      addedAt: existingEntry?.addedAt || Date.now(),
      addedBy: existingEntry?.addedBy || addedBy,
      registeredAt: existingEntry?.registeredAt ?? null,
    },
    { merge: true },
  )

  return { id: normalized, email: normalized }
}

export async function addEligibleUsersBulk(emails, addedBy = '') {
  const unique = [...new Set(emails.map(normalizeEmail).filter((e) => e.includes('@')))]
  const results = await Promise.allSettled(
    unique.map((email) => addEligibleUser(email, addedBy)),
  )
  return {
    added: results.filter((r) => r.status === 'fulfilled').length,
    failed: results.filter((r) => r.status === 'rejected').length,
  }
}

export async function markEligibleUserRegistered(email) {
  const db = await getDb()
  if (!db) {
    return
  }

  const normalized = normalizeEmail(email)
  const ref = doc(db, COLLECTION, normalized)
  const snapshot = await getDoc(ref)

  if (snapshot.exists() && !snapshot.data()?.registeredAt) {
    await updateDoc(ref, { registeredAt: Date.now() })
  }
}

export async function removeEligibleUser(email) {
  const db = await getDb()
  if (!db) {
    throw new Error('Database is not configured.')
  }

  const normalized = normalizeEmail(email)
  await deleteDoc(doc(db, COLLECTION, normalized))
}
