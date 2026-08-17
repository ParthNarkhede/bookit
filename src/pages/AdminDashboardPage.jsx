import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardActionCard from '../components/dashboard/DashboardActionCard'
import MonthStripCalendar from '../components/calendar/MonthStripCalendar'
import BookingFilters from '../components/calendar/BookingFilters'
import BookingDetailModal from '../components/calendar/BookingDetailModal'
import { BookingList } from '../components/calendar/BookingList'
import {
  deleteBookingForUser,
  fetchBookingsForDate,
  groupBookingsByEmployee,
  rescheduleBooking,
  updateBookingTitle,
} from '../controllers/bookingController'
import { subscribeToActiveRooms } from '../controllers/roomController'
import { formatDisplayDate, toDateKey } from '../utils/dateHelpers'

function AdminDashboardPage({ user }) {
  const navigate = useNavigate()
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(new Date()))
  const [filters, setFilters] = useState({ name: '', email: '', room: '', duration: '' })
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [message, setMessage] = useState('')
  const [modalError, setModalError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const unsubscribe = subscribeToActiveRooms(setRooms)
    return unsubscribe
  }, [])

  const loadBookings = async () => {
    setIsLoading(true)

    try {
      const dayBookings = await fetchBookingsForDate(selectedDateKey, filters)
      setBookings(dayBookings)
    } catch {
      setBookings([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [selectedDateKey, filters])

  const groupedEmployees = groupBookingsByEmployee(bookings)

  const handleDelete = async (booking) => {
    const confirmed = window.confirm('Delete this booking for the employee?')
    if (!confirmed) {
      return
    }

    setIsProcessing(true)
    const result = await deleteBookingForUser(booking.id, user, true)
    setIsProcessing(false)

    if (!result.success) {
      setModalError(result.error)
      return
    }

    setSelectedBooking(null)
    setMessage('Booking deleted.')
    loadBookings()
  }

  const handleReschedule = async (booking) => {
    setIsProcessing(true)
    const result = await rescheduleBooking(booking.id, user, true)
    setIsProcessing(false)

    if (!result.success) {
      setModalError(result.error)
      return
    }

    navigate('/calendar', {
      state: {
        editBookingId: result.reschedule.editBookingId,
        booking: result.reschedule.booking,
        rescheduleMessage: 'Adjust the booking time on the calendar, then save.',
      },
    })
  }

  const handleSaveTitle = async (bookingId, title) => {
    setIsProcessing(true)
    const result = await updateBookingTitle(bookingId, title, user, true)
    setIsProcessing(false)

    if (!result.success) {
      setModalError(result.error)
      return result
    }

    setSelectedBooking(null)
    setMessage('Booking updated.')
    loadBookings()
    return result
  }

  return (
    <main className="dashboard-shell admin-dashboard-shell calendar-page-wide">
      <header className="dashboard-page-header">
        <p className="eyebrow">Admin dashboard</p>
        <h1>Hello, {user.name}</h1>
        <p className="subtitle">Monitor every booking across the team and manage schedules by date.</p>
      </header>

      <DashboardActionCard
        title="Proceed to calendar"
        description="Open the booking calendar to reserve slots or review availability."
        buttonLabel="Open calendar"
        to="/calendar"
      />

      <DashboardActionCard
        title="Manage rooms"
        description="Add meeting rooms, update locations, and configure room features."
        buttonLabel="Manage rooms"
        to="/admin/rooms"
      />

      <DashboardActionCard
        title="Manage users"
        description="Add eligible emails so employees can register. Upload a CSV or Excel list in bulk."
        buttonLabel="Manage users"
        to="/admin/users"
      />

      <DashboardActionCard
        title="Analytics & export"
        description="View room usage charts and export booking history to Excel."
        buttonLabel="Open analytics"
        to="/admin/analytics"
      />

      <section className="admin-schedule-layout">
        <div className="admin-schedule-main">
          <MonthStripCalendar
            selectedDateKey={selectedDateKey}
            onSelectDate={setSelectedDateKey}
          />

          <BookingFilters filters={filters} onChange={setFilters} rooms={rooms} />
        </div>

        <aside className="admin-schedule-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Selected day</p>
              <h2>{formatDisplayDate(selectedDateKey)}</h2>
            </div>
          </div>

          {message && <p className="auth-message success">{message}</p>}

          {isLoading ? (
            <p className="empty-state">Loading bookings...</p>
          ) : groupedEmployees.length ? (
            <div className="employee-booking-groups">
              {groupedEmployees.map((group) => (
                <section key={group.userEmail} className="employee-booking-group">
                  <header>
                    <h3>{group.userName}</h3>
                    <p>{group.userEmail}</p>
                  </header>
                  <BookingList
                    bookings={group.bookings}
                    emptyMessage=""
                    showEmployee
                    isAdmin
                    currentUserId={user.uid}
                    onView={setSelectedBooking}
                    onReschedule={handleReschedule}
                    onDelete={handleDelete}
                  />
                </section>
              ))}
            </div>
          ) : (
            <p className="empty-state">No bookings found for this date with the current filters.</p>
          )}
        </aside>
      </section>

      <BookingDetailModal
        booking={selectedBooking}
        isAdmin
        currentUserId={user.uid}
        onClose={() => setSelectedBooking(null)}
        onDelete={handleDelete}
        onSaveTitle={handleSaveTitle}
        onReschedule={handleReschedule}
        isProcessing={isProcessing}
        errorMessage={modalError}
      />
    </main>
  )
}

export default AdminDashboardPage
