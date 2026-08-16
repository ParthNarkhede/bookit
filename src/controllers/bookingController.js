import {
  createBooking,
  deleteBooking,
  getBookingsByDate,
  getBookingsByUser,
  cancelBooking,
  updateBooking,
  subscribeToBookingsByDate,
  subscribeToBookingsInRange,
} from '../services/bookingService'
import { HOLD_DURATION_MS, BOOKING_STATUS } from '../constants/booking'
import { getDurationMinutes, sortBookings } from '../utils/dateHelpers'
import { doTimesOverlap, isBookingActive } from '../utils/slotHelpers'

export function groupBookingsByDate(bookings) {
  const grouped = {}

  sortBookings(bookings).forEach((booking) => {
    if (!grouped[booking.date]) {
      grouped[booking.date] = []
    }

    grouped[booking.date].push(booking)
  })

  return grouped
}

export function groupBookingsByEmployee(bookings) {
  const grouped = {}

  sortBookings(bookings).forEach((booking) => {
    const key = booking.userEmail || booking.userId

    if (!grouped[key]) {
      grouped[key] = {
        userName: booking.userName,
        userEmail: booking.userEmail,
        bookings: [],
      }
    }

    grouped[key].bookings.push(booking)
  })

  return Object.values(grouped)
}

export function applyBookingFilters(bookings, filters = {}) {
  const emailQuery = filters.email?.trim().toLowerCase()
  const nameQuery = filters.name?.trim().toLowerCase()
  const roomQuery = filters.room?.trim().toLowerCase()
  const durationQuery = filters.duration ? Number(filters.duration) : null

  return bookings.filter((booking) => {
    if (emailQuery && !booking.userEmail?.toLowerCase().includes(emailQuery)) {
      return false
    }

    if (nameQuery && !booking.userName?.toLowerCase().includes(nameQuery)) {
      return false
    }

    if (roomQuery && !booking.roomName?.toLowerCase().includes(roomQuery)) {
      return false
    }

    if (durationQuery && booking.durationMinutes !== durationQuery) {
      return false
    }

    return true
  })
}

export function maskBookingForEmployee(booking, userId) {
  if (booking.userId === userId) {
    return booking
  }

  return {
    ...booking,
    userName: 'Busy',
    userEmail: 'busy@slot.booked',
    title: booking.status === BOOKING_STATUS.HOLD ? 'On hold' : 'Busy',
    isBusy: true,
  }
}

export function maskBookingsForEmployee(bookings, userId) {
  return bookings.map((booking) => maskBookingForEmployee(booking, userId))
}

export function isSlotTaken(bookings, startTime, endTime, roomId, excludeBookingId = null) {
  return bookings.some(
    (booking) =>
      isBookingActive(booking) &&
      booking.roomId === roomId &&
      booking.id !== excludeBookingId &&
      doTimesOverlap(startTime, endTime, booking.startTime, booking.endTime),
  )
}

export async function fetchEmployeeBookings(userId) {
  const bookings = await getBookingsByUser(userId)
  return sortBookings(bookings)
}

export async function fetchBookingsForDate(dateKey, filters = {}) {
  const bookings = await getBookingsByDate(dateKey)
  return applyBookingFilters(bookings, filters)
}

export function subscribeToCalendarBookings(startDateKey, endDateKey, onChange, onError) {
  return subscribeToBookingsInRange(startDateKey, endDateKey, onChange, onError)
}

export function subscribeToDayBookings(dateKey, onChange, onError) {
  return subscribeToBookingsByDate(dateKey, onChange, onError)
}

export async function createSlotHold({
  user,
  dateKey,
  roomId,
  roomName,
  roomLocation,
  startTime,
  endTime,
  durationMinutes,
}) {
  const existingBookings = await getBookingsByDate(dateKey)

  if (isSlotTaken(existingBookings, startTime, endTime, roomId)) {
    return { success: false, error: 'One or more selected slots are no longer available in this room.' }
  }

  const now = Date.now()
  const holdBooking = {
    userId: user.uid,
    userName: user.name,
    userEmail: user.email,
    roomId,
    roomName,
    roomLocation,
    title: 'Pending booking',
    date: dateKey,
    startTime,
    endTime,
    durationMinutes,
    status: BOOKING_STATUS.HOLD,
    holdExpiresAt: now + HOLD_DURATION_MS,
    createdAt: now,
    updatedAt: now,
  }

  const savedHold = await createBooking(holdBooking)
  return { success: true, hold: savedHold }
}

export async function confirmSlotHold({ holdId, title }) {
  const trimmedTitle = title?.trim()

  if (!trimmedTitle) {
    return { success: false, error: 'Please enter a meeting title.' }
  }

  await updateBooking(holdId, {
    title: trimmedTitle,
    status: BOOKING_STATUS.CONFIRMED,
    holdExpiresAt: null,
  })

  return { success: true }
}

export async function releaseSlotHold(holdId) {
  if (!holdId) {
    return { success: true }
  }

  try {
    await deleteBooking(holdId)
    return { success: true }
  } catch {
    return { success: false, error: 'Unable to release hold.' }
  }
}

export async function cancelUserBooking(bookingId) {
  await cancelBooking(bookingId)
  return { success: true }
}
