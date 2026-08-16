import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'

const ROOMS_COLLECTION = 'rooms'

function mapRoomDocs(snapshot) {
  return snapshot.docs.map((roomDoc) => ({
    id: roomDoc.id,
    ...roomDoc.data(),
  }))
}

export function subscribeToRooms(onChange, onError) {
  if (!db) {
    onChange([])
    return () => {}
  }

  const roomsQuery = query(collection(db, ROOMS_COLLECTION), orderBy('name', 'asc'))

  return onSnapshot(
    roomsQuery,
    (snapshot) => {
      onChange(mapRoomDocs(snapshot).filter((room) => room.isActive !== false))
    },
    onError,
  )
}

export async function getAllRooms() {
  if (!db) {
    return []
  }

  const roomsQuery = query(collection(db, ROOMS_COLLECTION), orderBy('name', 'asc'))
  const snapshot = await getDocs(roomsQuery)
  return mapRoomDocs(snapshot).filter((room) => room.isActive !== false)
}

export async function createRoom(room) {
  if (!db) {
    throw new Error('Database is not available.')
  }

  const docRef = await addDoc(collection(db, ROOMS_COLLECTION), room)
  return { id: docRef.id, ...room }
}

export async function updateRoom(roomId, updates) {
  if (!db || !roomId) {
    throw new Error('Room not found.')
  }

  await updateDoc(doc(db, ROOMS_COLLECTION, roomId), {
    ...updates,
    updatedAt: Date.now(),
  })
}

export async function deleteRoom(roomId) {
  if (!db || !roomId) {
    throw new Error('Room not found.')
  }

  await deleteDoc(doc(db, ROOMS_COLLECTION, roomId))
}

export async function getActiveBookingsForRoom(roomId) {
  if (!db || !roomId) {
    return []
  }

  const bookingsQuery = query(
    collection(db, 'bookings'),
    where('roomId', '==', roomId),
  )

  const snapshot = await getDocs(bookingsQuery)
  return snapshot.docs
    .map((bookingDoc) => ({ id: bookingDoc.id, ...bookingDoc.data() }))
    .filter((booking) => booking.status === 'confirmed' || booking.status === 'hold')
}
