import { formatDisplayDate, formatTimeRange } from './dateHelpers'

export async function exportBookingsToExcel(bookings, filename) {
  const XLSX = await import('xlsx')

  const rows = bookings.map((booking) => ({
    Date: formatDisplayDate(booking.date),
    'Date Key': booking.date,
    Title: booking.title,
    Room: booking.roomName,
    Location: booking.roomLocation || '',
    'Start Time': booking.startTime,
    'End Time': booking.endTime,
    Time: formatTimeRange(booking.startTime, booking.endTime),
    'Duration (min)': booking.durationMinutes,
    Employee: booking.userName,
    Email: booking.userEmail,
    Status: booking.status,
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings')
  XLSX.writeFile(workbook, filename)
}
