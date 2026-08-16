import {
  createRoom,
  updateRoom,
  deleteRoom,
  getActiveBookingsForRoom,
  subscribeToRooms,
  getAllRooms,
} from '../services/roomService'

function normalizeFeatures(features = []) {
  return features
    .map((feature) => ({
      key: feature.key?.trim() || '',
      value: feature.value?.trim() || '',
    }))
    .filter((feature) => feature.key && feature.value)
}

export function subscribeToActiveRooms(onChange, onError) {
  return subscribeToRooms(onChange, onError)
}

export function validateRoomPayload({ name, location, description, features }) {
  if (!name?.trim()) {
    return 'Room name is required.'
  }

  if (!location?.trim()) {
    return 'Room location is required.'
  }

  if (!description?.trim()) {
    return 'Room description is required.'
  }

  const normalizedFeatures = normalizeFeatures(features)
  const invalidFeature = normalizedFeatures.find(
    (feature) => !feature.key || !feature.value,
  )

  if (features?.length && invalidFeature) {
    return 'Each feature must include both a name and a value.'
  }

  return null
}

export async function saveRoom({ roomId, name, location, description, features, userId }) {
  const validationError = validateRoomPayload({ name, location, description, features })

  if (validationError) {
    return { success: false, error: validationError }
  }

  const normalizedName = name.trim().toLowerCase()

  try {
    const existingRooms = await getAllRooms()
    const duplicate = existingRooms.find(
      (room) => room.name.trim().toLowerCase() === normalizedName && room.id !== roomId,
    )

    if (duplicate) {
      return { success: false, error: 'A room with this name already exists.' }
    }
  } catch {
    return { success: false, error: 'Unable to validate room name.' }
  }

  const payload = {
    name: name.trim(),
    location: location.trim(),
    description: description.trim(),
    features: normalizeFeatures(features),
    isActive: true,
    updatedAt: Date.now(),
  }

  try {
    if (roomId) {
      await updateRoom(roomId, payload)
      return { success: true, roomId }
    }

    const createdRoom = await createRoom({
      ...payload,
      createdBy: userId,
      createdAt: Date.now(),
    })

    return { success: true, roomId: createdRoom.id }
  } catch {
    return { success: false, error: 'Unable to save room. Please try again.' }
  }
}

export async function removeRoom(roomId) {
  if (!roomId) {
    return { success: false, error: 'Room not found.' }
  }

  try {
    const activeBookings = await getActiveBookingsForRoom(roomId)
    const hasUpcomingBookings = activeBookings.some((booking) => booking.status === 'confirmed')

    if (hasUpcomingBookings) {
      return {
        success: false,
        error: 'This room has upcoming bookings and cannot be deleted yet.',
      }
    }

    await deleteRoom(roomId)
    return { success: true }
  } catch {
    return { success: false, error: 'Unable to delete room. Please try again.' }
  }
}
