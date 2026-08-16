const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTH_LABELS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function getCalendarDays(startDate = new Date(), count = 28) {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)

    return {
      date,
      dateKey: toDateKey(date),
      dayLabel: DAY_LABELS[date.getDay()],
      dayNumber: date.getDate(),
      monthLabel: MONTH_LABELS[date.getMonth()],
      isToday: toDateKey(date) === toDateKey(new Date()),
    }
  })
}

export function formatDisplayDate(dateKey) {
  const date = parseDateKey(dateKey)
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatTimeRange(startTime, endTime) {
  return `${startTime} – ${endTime}`
}

export function parseTimeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function getDurationMinutes(startTime, endTime) {
  return parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime)
}

export function generateTimeSlots(startHour = 9, endHour = 18, intervalMinutes = 30) {
  const slots = []
  let cursor = startHour * 60
  const end = endHour * 60

  while (cursor + intervalMinutes <= end) {
    const startHours = Math.floor(cursor / 60)
    const startMins = cursor % 60
    const endCursor = cursor + intervalMinutes
    const endHours = Math.floor(endCursor / 60)
    const endMins = endCursor % 60

    slots.push({
      startTime: `${String(startHours).padStart(2, '0')}:${String(startMins).padStart(2, '0')}`,
      endTime: `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`,
      durationMinutes: intervalMinutes,
    })

    cursor += intervalMinutes
  }

  return slots
}

export function sortBookings(bookings) {
  return [...bookings].sort((left, right) => {
    if (left.date !== right.date) {
      return left.date.localeCompare(right.date)
    }

    return left.startTime.localeCompare(right.startTime)
  })
}

export function getWeekDateKeys(anchorDateKey) {
  const anchor = parseDateKey(anchorDateKey)
  const dayIndex = anchor.getDay()
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex
  const monday = new Date(anchor)
  monday.setDate(anchor.getDate() + mondayOffset)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return toDateKey(date)
  })
}

export function getMonthMatrix(year, month) {
  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []

  for (let index = 0; index < startOffset; index += 1) {
    cells.push(null)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day)
    cells.push({
      date,
      dateKey: toDateKey(date),
      dayNumber: day,
      isToday: toDateKey(date) === toDateKey(new Date()),
    })
  }

  return cells
}
