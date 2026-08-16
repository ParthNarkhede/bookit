import { useEffect, useState } from 'react'
import DashboardActionCard from '../components/dashboard/DashboardActionCard'
import { GroupedBookingList } from '../components/calendar/BookingList'
import { fetchEmployeeBookings, groupBookingsByDate } from '../controllers/bookingController'

function EmployeeDashboardPage({ user }) {
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadBookings = async () => {
      setIsLoading(true)

      try {
        const userBookings = await fetchEmployeeBookings(user.uid)
        if (isMounted) {
          setBookings(userBookings)
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
  }, [user.uid])

  const groupedBookings = groupBookingsByDate(bookings)

  return (
    <main className="dashboard-shell">
      <header className="dashboard-page-header">
        <p className="eyebrow">Employee dashboard</p>
        <h1>Hello, {user.name}</h1>
        <p className="subtitle">Book new meetings and review your upcoming schedule.</p>
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

        {isLoading ? (
          <p className="empty-state">Loading your meetings...</p>
        ) : (
          <GroupedBookingList
            groupedBookings={groupedBookings}
            emptyMessage="No meetings scheduled yet. Use the calendar to book your first slot."
          />
        )}
      </section>
    </main>
  )
}

export default EmployeeDashboardPage
