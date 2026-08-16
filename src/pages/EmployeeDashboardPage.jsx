import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardActionCard from '../components/dashboard/DashboardActionCard'
import BookingDetailModal from '../components/calendar/BookingDetailModal'
import { GroupedBookingList } from '../components/calendar/BookingList'
import {
  deleteBookingForUser,
  fetchEmployeeBookings,
  groupBookingsByDate,
  rescheduleBooking,
  updateBookingTitle,
} from '../controllers/bookingController'

function EmployeeDashboardPage({ user }) {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [message, setMessage] = useState('')
  const [modalError, setModalError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const loadBookings = async () => {
    setIsLoading(true)

    try {
      const userBookings = await fetchEmployeeBookings(user.uid)
      setBookings(userBookings)
    } catch {
      setBookings([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [user.uid])

  const groupedBookings = groupBookingsByDate(bookings)

  const handleDelete = async (booking) => {
    const confirmed = window.confirm('Delete this booking?')
    if (!confirmed) {
      return
    }

    setIsProcessing(true)
    const result = await deleteBookingForUser(booking.id, user, false)
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
    const result = await rescheduleBooking(booking.id, user, false)
    setIsProcessing(false)

    if (!result.success) {
      setModalError(result.error)
      return
    }

    navigate('/calendar', {
      state: {
        editBookingId: result.reschedule.editBookingId,
        booking: result.reschedule.booking,
        rescheduleMessage: 'Adjust your booking time on the calendar, then save.',
      },
    })
  }

  const handleSaveTitle = async (bookingId, title) => {
    setIsProcessing(true)
    const result = await updateBookingTitle(bookingId, title, user, false)
    setIsProcessing(false)

    if (!result.success) {
      setModalError(result.error)
      return result
    }

    setSelectedBooking(null)
    setMessage('Title updated.')
    loadBookings()
    return result
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-page-header">
        <p className="eyebrow">Employee dashboard</p>
        <h1>Hello, {user.name}</h1>
        <p className="subtitle">Book new meetings and manage your upcoming schedule.</p>
      </header>

      <DashboardActionCard
        title="Proceed to calendar"
        description="Pick an available slot and schedule your next meeting in a few clicks."
        buttonLabel="Open calendar"
        to="/calendar"
      />

      <section className="dashboard-section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Your schedule</p>
            <h2>Scheduled meetings</h2>
          </div>
        </div>

        {message && <p className="auth-message success">{message}</p>}

        {isLoading ? (
          <p className="empty-state">Loading your meetings...</p>
        ) : (
          <GroupedBookingList
            groupedBookings={groupedBookings}
            emptyMessage="No meetings scheduled yet. Use the calendar to book your first slot."
            currentUserId={user.uid}
            onView={setSelectedBooking}
            onReschedule={handleReschedule}
            onDelete={handleDelete}
          />
        )}
      </section>

      <BookingDetailModal
        booking={selectedBooking}
        isAdmin={false}
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

export default EmployeeDashboardPage
