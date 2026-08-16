import { SLOT_INTERVAL_MINUTES } from '../constants/booking'
import { parseTimeToMinutes, toDateKey } from './dateHelpers'

export function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function areSlotsConsecutive(selectedStartTimes) {
  if (!selectedStartTimes.length) {
    return false
  }

  const sorted = [...selectedStartTimes].sort()

  for (let index = 1; index < sorted.length; index += 1) {
    const previousEnd = parseTimeToMinutes(sorted[index - 1]) + SLOT_INTERVAL_MINUTES
    if (parseTimeToMinutes(sorted[index]) !== previousEnd) {
      return false
    }
  }

  return true
}

export function getSelectionRange(selectedStartTimes) {
  const sorted = [...selectedStartTimes].sort()
  const startTime = sorted[0]
  const endTime = minutesToTime(parseTimeToMinutes(sorted[sorted.length - 1]) + SLOT_INTERVAL_MINUTES)

  return {
    startTime,
    endTime,
    durationMinutes: sorted.length * SLOT_INTERVAL_MINUTES,
  }
}

export function toggleSlotSelection(selectedStartTimes, startTime) {
  if (selectedStartTimes.includes(startTime)) {
    return selectedStartTimes.filter((slot) => slot !== startTime)
  }

  return [...selectedStartTimes, startTime]
}

export function isPastDate(dateKey) {
  return dateKey < toDateKey(new Date())
}

export function isSlotInPast(dateKey, startTime) {
  if (isPastDate(dateKey)) {
    return true
  }

  const todayKey = toDateKey(new Date())
  if (dateKey !== todayKey) {
    return false
  }

  return parseTimeToMinutes(startTime) < getCurrentMinutes()
}

export function getCurrentMinutes() {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

export function getCurrentTimeLinePercent(startHour, endHour) {
  const startMinutes = startHour * 60
  const endMinutes = endHour * 60
  const total = endMinutes - startMinutes
  const current = getCurrentMinutes()

  if (current < startMinutes || current > endMinutes) {
    return null
  }

  return ((current - startMinutes) / total) * 100
}

export function doTimesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB
}

export function isBookingActive(booking, now = Date.now()) {
  if (booking.status === 'confirmed') {
    return true
  }

  if (booking.status === 'hold') {
    return Boolean(booking.holdExpiresAt && booking.holdExpiresAt > now)
  }

  return false
}

export function getSlotStartTimesFromBooking(startTime, endTime) {
  const times = []
  let cursor = parseTimeToMinutes(startTime)
  const end = parseTimeToMinutes(endTime)

  while (cursor < end) {
    times.push(minutesToTime(cursor))
    cursor += SLOT_INTERVAL_MINUTES
  }

  return times
}

export function getSlotState({
  dateKey,
  startTime,
  endTime,
  roomId,
  bookings,
  currentUserId,
  selectedStartTimes,
  excludeBookingId = null,
}) {
  if (isSlotInPast(dateKey, startTime)) {
    return 'past'
  }

  if (selectedStartTimes.includes(startTime)) {
    return 'selected'
  }

  const roomBookings = bookings.filter((booking) => booking.roomId === roomId)
  const blockingBooking = roomBookings.find(
    (booking) =>
      booking.id !== excludeBookingId &&
      isBookingActive(booking) &&
      doTimesOverlap(startTime, endTime, booking.startTime, booking.endTime),
  )

  if (blockingBooking) {
    if (blockingBooking.userId === currentUserId) {
      return blockingBooking.status === 'hold' ? 'my-hold' : 'my-booking'
    }

    return blockingBooking.status === 'hold' ? 'held' : 'busy'
  }

  return 'available'
}

export function getBookingBlockStyle(startTime, endTime, startHour, endHour, slotHeightPx) {
  const startMinutes = startHour * 60
  const totalMinutes = (endHour - startHour) * 60
  const topMinutes = parseTimeToMinutes(startTime) - startMinutes
  const heightMinutes = parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime)

  return {
    top: `${(topMinutes / SLOT_INTERVAL_MINUTES) * slotHeightPx}px`,
    height: `${(heightMinutes / SLOT_INTERVAL_MINUTES) * slotHeightPx}px`,
    totalHeight: (totalMinutes / SLOT_INTERVAL_MINUTES) * slotHeightPx,
  }
}
