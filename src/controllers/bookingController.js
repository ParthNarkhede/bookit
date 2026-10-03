import {
  createBooking,
  deleteBooking,
  getBookingsByDate,
  getBookingsByUser,
  getBookingById,
  cancelBooking,
  updateBooking,
  subscribeToBookingsByDate,
  subscribeToBookingsInRange,
} from '../services/bookingService'
import {
  HOLD_DURATION_MS,
  BOOKING_STATUS,
  DAY_END_HOUR,
  DAY_START_HOUR,
} from '../constants/booking'
import { parseTimeToMinutes, sortBookings } from '../utils/dateHelpers'
import {
  doTimesOverlap,
  isBookingActive,
  isBookingPast,
  isSlotInPast,
  isWeekendDate,
} from '../utils/slotHelpers'

function getScheduleError(dateKey, startTime, endTime) {
  if (isWeekendDate(dateKey)) {
    return 'Bookings are unavailable on Saturdays and Sundays.'
  }

  const startMinutes = parseTimeToMinutes(startTime)
  const endMinutes = parseTimeToMinutes(endTime)
  if (
    !Number.isFinite(startMinutes) ||
    !Number.isFinite(endMinutes) ||
    startMinutes % 15 !== 0 ||
    endMinutes % 15 !== 0 ||
    startMinutes < DAY_START_HOUR * 60 ||
    endMinutes > DAY_END_HOUR * 60 ||
    endMinutes <= startMinutes
  ) {
    return 'Bookings are available between 08:00 and 20:00 IST.'
  }

  if (isSlotInPast(dateKey, startTime)) {
    return 'You cannot book a slot that has already started.'
  }

  return ''
}

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

  if (booking.status === BOOKING_STATUS.HOLD) {
    return {
      ...booking,
      title: 'On hold',
      userEmail: '',
      isMasked: true,
      isHold: true,
    }
  }

  return {
    ...booking,
    userEmail: '',
    title: 'Booked',
    isMasked: true,
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
  const scheduleError = getScheduleError(dateKey, startTime, endTime)
  if (scheduleError) {
    return { success: false, error: scheduleError }
  }

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

  const hold = await getBookingById(holdId)
  if (!hold || hold.status !== BOOKING_STATUS.HOLD) {
    return { success: false, error: 'Booking hold not found.' }
  }

  const scheduleError = getScheduleError(hold.date, hold.startTime, hold.endTime)
  if (scheduleError) {
    return { success: false, error: scheduleError }
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
  const booking = await getBookingById(bookingId)
  if (!booking) {
    return { success: false, error: 'Booking not found.' }
  }

  if (booking.status === BOOKING_STATUS.CONFIRMED && isBookingPast(booking.date, booking.endTime)) {
    return { success: false, error: 'Past bookings cannot be deleted.' }
  }

  await cancelBooking(bookingId)
  return { success: true }
}

export async function deleteBookingForUser(bookingId, user, isAdmin = false) {
  if (!bookingId) {
    return { success: false, error: 'Booking not found.' }
  }

  try {
    const booking = await getBookingById(bookingId)

    if (!booking) {
      return { success: false, error: 'Booking not found.' }
    }

    if (booking.status === BOOKING_STATUS.CONFIRMED && isBookingPast(booking.date, booking.endTime)) {
      return { success: false, error: 'Past bookings cannot be deleted.' }
    }

    if (!isAdmin && booking.userId !== user.uid) {
      return { success: false, error: 'You can only delete your own bookings.' }
    }

    if (booking.status === BOOKING_STATUS.HOLD) {
      await deleteBooking(bookingId)
    } else {
      await cancelBooking(bookingId)
    }

    return { success: true }
  } catch {
    return { success: false, error: 'Unable to delete booking.' }
  }
}

export async function updateBookingTitle(bookingId, title, user, isAdmin = false) {
  const trimmedTitle = title?.trim()

  if (!trimmedTitle) {
    return { success: false, error: 'Title is required.' }
  }

  try {
    const booking = await getBookingById(bookingId)

    if (!booking) {
      return { success: false, error: 'Booking not found.' }
    }

    if (!isAdmin && booking.userId !== user.uid) {
      return { success: false, error: 'You can only edit your own bookings.' }
    }

    if (booking.status !== BOOKING_STATUS.CONFIRMED) {
      return { success: false, error: 'Only confirmed bookings can be edited.' }
    }

    if (isBookingPast(booking.date, booking.endTime)) {
      return { success: false, error: 'Past bookings cannot be edited.' }
    }

    await updateBooking(bookingId, { title: trimmedTitle })
    return { success: true }
  } catch {
    return { success: false, error: 'Unable to update booking.' }
  }
}

export async function beginEditBooking(bookingId, user, isAdmin = false) {
  try {
    const booking = await getBookingById(bookingId)

    if (!booking) {
      return { success: false, error: 'Booking not found.' }
    }

    if (!isAdmin && booking.userId !== user.uid) {
      return { success: false, error: 'You can only edit your own bookings.' }
    }

    if (booking.status !== BOOKING_STATUS.CONFIRMED) {
      return { success: false, error: 'Only confirmed bookings can be rescheduled.' }
    }

    if (isBookingPast(booking.date, booking.endTime)) {
      return { success: false, error: 'Past bookings cannot be rescheduled.' }
    }

    if (isWeekendDate(booking.date)) {
      return { success: false, error: 'Weekend bookings cannot be rescheduled.' }
    }

    return { success: true, booking }
  } catch {
    return { success: false, error: 'Unable to start edit mode.' }
  }
}

export async function updateBookingSchedule(
  bookingId,
  { dateKey, roomId, roomName, roomLocation, startTime, endTime, durationMinutes },
  user,
  isAdmin = false,
) {
  try {
    const booking = await getBookingById(bookingId)

    if (!booking) {
      return { success: false, error: 'Booking not found.' }
    }

    if (!isAdmin && booking.userId !== user.uid) {
      return { success: false, error: 'You can only edit your own bookings.' }
    }

    if (booking.status !== BOOKING_STATUS.CONFIRMED) {
      return { success: false, error: 'Only confirmed bookings can be rescheduled.' }
    }

    if (isBookingPast(booking.date, booking.endTime)) {
      return { success: false, error: 'Past bookings cannot be rescheduled.' }
    }

    const scheduleError = getScheduleError(dateKey, startTime, endTime)
    if (scheduleError) {
      return { success: false, error: scheduleError }
    }

    const existingBookings = await getBookingsByDate(dateKey)

    if (isSlotTaken(existingBookings, startTime, endTime, roomId, bookingId)) {
      return { success: false, error: 'One or more selected slots are no longer available.' }
    }

    await updateBooking(bookingId, {
      date: dateKey,
      roomId,
      roomName,
      roomLocation,
      startTime,
      endTime,
      durationMinutes,
    })

    return { success: true }
  } catch {
    return { success: false, error: 'Unable to update booking.' }
  }
}

/** @deprecated Use beginEditBooking + updateBookingSchedule instead */
export async function rescheduleBooking(bookingId, user, isAdmin = false) {
  const result = await beginEditBooking(bookingId, user, isAdmin)
  if (!result.success) {
    return result
  }

  return {
    success: true,
    reschedule: {
      editBookingId: result.booking.id,
      dateKey: result.booking.date,
      roomId: result.booking.roomId,
      title: result.booking.title,
      booking: result.booking,
    },
  }
}
