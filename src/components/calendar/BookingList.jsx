import { formatDisplayDate, formatTimeRange } from '../../utils/dateHelpers'
import { formatDisplayName } from '../../utils/validators'

function BookingList({
  bookings,
  emptyMessage,
  showEmployee = false,
  currentUserId,
  isAdmin = false,
  onView,
  onReschedule,
  onDelete,
}) {
  if (!bookings.length) {
    return <p className="empty-state">{emptyMessage}</p>
  }

  return (
    <div className="booking-list">
      {bookings.map((booking) => {
        const canManage = isAdmin || booking.userId === currentUserId
        const displayUserName = formatDisplayName(booking.userName)

        return (
          <article key={booking.id} className={`booking-item ${booking.isBusy ? 'is-busy' : ''}`}>
            <div className="booking-item-main">
              <h4>{booking.title}</h4>
              <p>{formatTimeRange(booking.startTime, booking.endTime)}</p>
              {booking.roomName && !booking.isBusy && (
                <p className="booking-employee">
                  {booking.roomName}
                  {booking.roomLocation ? ` · ${booking.roomLocation}` : ''}
                </p>
              )}
              {showEmployee && !booking.isBusy && (
                <p className="booking-employee">
                  {displayUserName} · {booking.userEmail}
                </p>
              )}
              {booking.isBusy && <p className="booking-employee">Slot unavailable</p>}
            </div>

            <div className="booking-item-meta">
              <span>{booking.durationMinutes} min</span>
              {canManage && !booking.isBusy && (
                <div className="booking-item-actions">
                  {onView && (
                    <button type="button" className="text-button" onClick={() => onView(booking)}>
                      View
                    </button>
                  )}
                  {onReschedule && booking.status === 'confirmed' && (
                    <button type="button" className="text-button" onClick={() => onReschedule(booking)}>
                      Reschedule
                    </button>
                  )}
                  {onDelete && (
                    <button type="button" className="text-button danger-text" onClick={() => onDelete(booking)}>
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}

function GroupedBookingList({
  groupedBookings,
  emptyMessage,
  showEmployee = false,
  currentUserId,
  isAdmin = false,
  onView,
  onReschedule,
  onDelete,
}) {
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
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onView={onView}
            onReschedule={onReschedule}
            onDelete={onDelete}
          />
        </section>
      ))}
    </div>
  )
}

export { BookingList, GroupedBookingList }
