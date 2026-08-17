import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { BOOKING_STATUS } from '../constants/booking'
import { isBookingActive } from '../utils/slotHelpers'
import { sortBookings } from '../utils/dateHelpers'

const BOOKINGS_COLLECTION = 'bookings'

function mapBookingDocs(snapshot) {
  return snapshot.docs.map((bookingDoc) => ({
    id: bookingDoc.id,
    ...bookingDoc.data(),
  }))
}

function filterActiveBookings(bookings) {
  return sortBookings(bookings.filter((booking) => isBookingActive(booking)))
}

export async function createBooking(booking) {
  if (!db) {
    throw new Error('Database is not available.')
  }

  const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), booking)
  return { id: docRef.id, ...booking }
}

export async function updateBooking(bookingId, updates) {
  if (!db || !bookingId) {
    throw new Error('Booking not found.')
  }

  const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId)
  await updateDoc(bookingRef, {
    ...updates,
    updatedAt: Date.now(),
  })
}

export async function deleteBooking(bookingId) {
  if (!db || !bookingId) {
    throw new Error('Booking not found.')
  }

  await deleteDoc(doc(db, BOOKINGS_COLLECTION, bookingId))
}

export async function getBookingById(bookingId) {
  if (!db || !bookingId) {
    return null
  }

  const snapshot = await getDoc(doc(db, BOOKINGS_COLLECTION, bookingId))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

export async function getBookingsInRange(startDateKey, endDateKey) {
  if (!db) {
    return []
  }

  const bookingsQuery = query(
    collection(db, BOOKINGS_COLLECTION),
    where('date', '>=', startDateKey),
    where('date', '<=', endDateKey),
  )

  const snapshot = await getDocs(bookingsQuery)
  return filterActiveBookings(
    mapBookingDocs(snapshot).filter((booking) => booking.status !== BOOKING_STATUS.CANCELLED),
  )
}

export async function getBookingsByDate(dateKey) {
  if (!db) {
    return []
  }

  const bookingsQuery = query(
    collection(db, BOOKINGS_COLLECTION),
    where('date', '==', dateKey),
  )

  const snapshot = await getDocs(bookingsQuery)
  return filterActiveBookings(
    mapBookingDocs(snapshot).filter((booking) => booking.status !== BOOKING_STATUS.CANCELLED),
  )
}

export async function getBookingsByUser(userId) {
  if (!db || !userId) {
    return []
  }

  const bookingsQuery = query(
    collection(db, BOOKINGS_COLLECTION),
    where('userId', '==', userId),
  )

  const snapshot = await getDocs(bookingsQuery)
  return filterActiveBookings(
    mapBookingDocs(snapshot).filter((booking) => booking.status === BOOKING_STATUS.CONFIRMED),
  )
}

export async function cancelBooking(bookingId) {
  await updateBooking(bookingId, { status: BOOKING_STATUS.CANCELLED })
}

export function subscribeToBookingsInRange(startDateKey, endDateKey, onChange, onError) {
  if (!db) {
    onChange([])
    return () => {}
  }

  const bookingsQuery = query(
    collection(db, BOOKINGS_COLLECTION),
    where('date', '>=', startDateKey),
    where('date', '<=', endDateKey),
  )

  return onSnapshot(
    bookingsQuery,
    (snapshot) => {
      const bookings = mapBookingDocs(snapshot).filter(
        (booking) => booking.status !== BOOKING_STATUS.CANCELLED,
      )

      const activeBookings = filterActiveBookings(bookings)
      onChange(activeBookings)

      bookings
        .filter(
          (booking) =>
            booking.status === BOOKING_STATUS.HOLD &&
            booking.holdExpiresAt &&
            booking.holdExpiresAt <= Date.now(),
        )
        .forEach((booking) => {
          deleteBooking(booking.id).catch(() => {})
        })
    },
    onError,
  )
}

export function subscribeToBookingsByDate(dateKey, onChange, onError) {
  return subscribeToBookingsInRange(dateKey, dateKey, onChange, onError)
}
