import { formatDisplayDate, formatTimeRange } from '../../utils/dateHelpers'

function BookingList({ bookings, emptyMessage, showEmployee = false, onCancel }) {
  if (!bookings.length) {
    return <p className="empty-state">{emptyMessage}</p>
  }

  return (
    <div className="booking-list">
      {bookings.map((booking) => (
        <article key={booking.id} className={`booking-item ${booking.isBusy ? 'is-busy' : ''}`}>
          <div className="booking-item-main">
            <h4>{booking.title}</h4>
            <p>{formatTimeRange(booking.startTime, booking.endTime)}</p>
            {booking.roomName && !booking.isBusy && (
              <p className="booking-employee">{booking.roomName}{booking.roomLocation ? ` · ${booking.roomLocation}` : ''}</p>
            )}
            {showEmployee && !booking.isBusy && (
              <p className="booking-employee">
                {booking.userName} · {booking.userEmail}
              </p>
            )}
            {booking.isBusy && <p className="booking-employee">Slot unavailable</p>}
          </div>

          <div className="booking-item-meta">
            <span>{booking.durationMinutes} min</span>
            {!booking.isBusy && onCancel && (
              <button type="button" className="text-button" onClick={() => onCancel(booking.id)}>
                Cancel
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}

function GroupedBookingList({ groupedBookings, emptyMessage, showEmployee = false, onCancel }) {
  const dates = Object.keys(groupedBookings)

  if (!dates.length) {
    return <p className="empty-state">{emptyMessage}</p>
  }

  return (
    <div className="grouped-booking-list">
      {dates.map((dateKey) => (
        <section key={dateKey} className="booking-group">
          <h3>{formatDisplayDate(dateKey)}</h3>
          <BookingList
            bookings={groupedBookings[dateKey]}
            emptyMessage=""
            showEmployee={showEmployee}
            onCancel={onCancel}
          />
        </section>
      ))}
    </div>
  )
}

export { BookingList, GroupedBookingList }
