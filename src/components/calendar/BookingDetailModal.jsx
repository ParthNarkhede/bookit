import { useState } from 'react'
import { formatDisplayDate, formatTimeRange } from '../../utils/dateHelpers'
import { formatDisplayName } from '../../utils/validators'

function BookingDetailModal({
  booking,
  isAdmin,
  currentUserId,
  onClose,
  onDelete,
  onSaveTitle,
  onReschedule,
  isProcessing,
  errorMessage,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(booking?.title || '')

  if (!booking) {
    return null
  }

  const isOwner = booking.userId === currentUserId
  const canManage = isAdmin || isOwner
  const isConfirmed = booking.status === 'confirmed'
  const isHold = booking.status === 'hold'
  const displayUserName = formatDisplayName(booking.userName)

  const handleSave = async () => {
    const result = await onSaveTitle(booking.id, title)
    if (result?.success) {
      setIsEditing(false)
    }
  }

  return (
    <div className="popup-overlay" role="presentation" onClick={onClose}>
      <div
        className="popup-card booking-detail-modal"
        role="dialog"
        aria-labelledby="booking-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="booking-detail-header">
          <div>
            <p className="eyebrow">{isHold ? 'On hold' : 'Booking details'}</p>
            <h3 id="booking-detail-title">{booking.isMasked ? booking.title : booking.title}</h3>
          </div>
          <button type="button" className="text-button" onClick={onClose}>
            Close
          </button>
        </div>

        <dl className="booking-detail-meta">
          <div>
            <dt>Date</dt>
            <dd>{formatDisplayDate(booking.date)}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{formatTimeRange(booking.startTime, booking.endTime)}</dd>
          </div>
          <div>
            <dt>Room</dt>
            <dd>
              {booking.roomName}
              {booking.roomLocation ? ` · ${booking.roomLocation}` : ''}
            </dd>
          </div>
          {!booking.isMasked && (
            <>
              <div>
                <dt>Booked by</dt>
                <dd>
                  {displayUserName} ({booking.userEmail})
                </dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd>{booking.durationMinutes} minutes</dd>
              </div>
            </>
          )}
        </dl>

        {canManage && isConfirmed && !booking.isMasked && (
          <div className="booking-detail-edit">
            {isEditing ? (
              <>
                <label htmlFor="edit-booking-title">
                  Meeting title
                  <input
                    id="edit-booking-title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </label>
                <div className="popup-actions">
                  <button type="button" className="text-button" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    disabled={isProcessing}
                    onClick={handleSave}
                  >
                    Save title
                  </button>
                </div>
              </>
            ) : (
              <button type="button" className="text-button" onClick={() => setIsEditing(true)}>
                Edit title
              </button>
            )}
          </div>
        )}

        {errorMessage && <p className="auth-message error">{errorMessage}</p>}

        {canManage && !booking.isMasked && (
          <div className="booking-detail-actions">
            {isConfirmed && (
              <button
                type="button"
                className="edit-timing"
                disabled={isProcessing}
                onClick={() => onReschedule(booking)}
              >
                Edit timings
              </button>
            )}
            <button
              type="button"
              className="nav-button danger-button"
              disabled={isProcessing}
              onClick={() => onDelete(booking)}
            >
              {isHold ? 'Release hold' : 'Delete booking'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookingDetailModal
