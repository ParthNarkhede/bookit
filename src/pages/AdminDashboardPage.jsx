import { useEffect, useState } from 'react'
import DashboardActionCard from '../components/dashboard/DashboardActionCard'
import MonthStripCalendar from '../components/calendar/MonthStripCalendar'
import BookingFilters from '../components/calendar/BookingFilters'
import { BookingList } from '../components/calendar/BookingList'
import {
  fetchBookingsForDate,
  groupBookingsByEmployee,
} from '../controllers/bookingController'
import { subscribeToActiveRooms } from '../controllers/roomController'
import { formatDisplayDate, toDateKey } from '../utils/dateHelpers'

function AdminDashboardPage({ user }) {
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(new Date()))
  const [filters, setFilters] = useState({ name: '', email: '', room: '', duration: '' })
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToActiveRooms(setRooms)
    return unsubscribe
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadBookings = async () => {
      setIsLoading(true)

      try {
        const dayBookings = await fetchBookingsForDate(selectedDateKey, filters)
        if (isMounted) {
          setBookings(dayBookings)
        }
      } catch {
        if (isMounted) {
          setBookings([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadBookings()
    return () => {
      isMounted = false
    }
  }, [selectedDateKey, filters])

  const groupedEmployees = groupBookingsByEmployee(bookings)

  return (
    <main className="dashboard-shell admin-dashboard-shell">
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
                    showEmployee={false}
                  />
                </section>
              ))}
            </div>
          ) : (
            <p className="empty-state">No bookings found for this date with the current filters.</p>
          )}
        </aside>
      </section>
    </main>
  )
}

export default AdminDashboardPage
