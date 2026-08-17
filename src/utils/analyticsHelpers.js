import { BOOKING_STATUS } from '../constants/booking'
import { parseDateKey, toDateKey } from './dateHelpers'

export function getDateRangeKeys(days) {
  const keys = []
  const today = new Date()

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - offset)
    keys.push(toDateKey(date))
  }

  return keys
}

export function getCustomDateRangeKeys(startKey, endKey) {
  const keys = []
  const cursor = parseDateKey(startKey)
  const end = parseDateKey(endKey)

  while (cursor <= end) {
    keys.push(toDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return keys
}

export function filterConfirmedBookings(bookings) {
  return bookings.filter((booking) => booking.status === BOOKING_STATUS.CONFIRMED)
}

export function computeRoomUsage(bookings, rooms) {
  const usage = {}

  rooms.forEach((room) => {
    usage[room.id] = {
      roomId: room.id,
      roomName: room.name,
      minutes: 0,
      bookings: 0,
    }
  })

  filterConfirmedBookings(bookings).forEach((booking) => {
    if (!usage[booking.roomId]) {
      usage[booking.roomId] = {
        roomId: booking.roomId,
        roomName: booking.roomName || 'Unknown',
        minutes: 0,
        bookings: 0,
      }
    }

    usage[booking.roomId].minutes += booking.durationMinutes || 0
    usage[booking.roomId].bookings += 1
  })

  return Object.values(usage).sort((a, b) => b.minutes - a.minutes)
}

export function computeDayWiseUsage(bookings, dateKeys) {
  const usage = {}

  dateKeys.forEach((key) => {
    usage[key] = 0
  })

  filterConfirmedBookings(bookings).forEach((booking) => {
    if (usage[booking.date] !== undefined) {
      usage[booking.date] += booking.durationMinutes || 0
    }
  })

  return dateKeys.map((key) => ({
    dateKey: key,
    minutes: usage[key] || 0,
    hours: Number(((usage[key] || 0) / 60).toFixed(1)),
  }))
}

export function computeAverageDailyMinutes(dayWiseUsage) {
  if (!dayWiseUsage.length) {
    return 0
  }

  const total = dayWiseUsage.reduce((sum, day) => sum + day.minutes, 0)
  return Math.round(total / dayWiseUsage.length)
}
