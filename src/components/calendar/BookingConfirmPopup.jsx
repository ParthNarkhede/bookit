import { useEffect, useState } from 'react'
import { formatTimeRange } from '../../utils/dateHelpers'

function BookingConfirmPopup({
  isOpen,
  startTime,
  endTime,
  holdExpiresAt,
  roomName,
  roomLocation,
  title,
  onTitleChange,
  onConfirm,
  onCancel,
  isSubmitting,
  errorMessage,
}) {
  const [secondsLeft, setSecondsLeft] = useState(60)

  useEffect(() => {
    if (!isOpen || !holdExpiresAt) {
      return undefined
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((holdExpiresAt - Date.now()) / 1000))
      setSecondsLeft(remaining)

      if (remaining === 0) {
        onCancel(true)
      }
    }

    updateTimer()
    const intervalId = window.setInterval(updateTimer, 250)
    return () => window.clearInterval(intervalId)
  }, [holdExpiresAt, isOpen, onCancel])

  if (!isOpen) {
    return null
  }

  return (
    <div className="popup-overlay" role="presentation">
      <div
        className="popup-card booking-confirm-popup"
        role="dialog"
        aria-labelledby="booking-confirm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="hold-timer">Hold expires in {secondsLeft}s</p>
        <h3 id="booking-confirm-title">Confirm your booking</h3>
        {roomName && (
          <p className="booking-confirm-room">
            {roomName}
            {roomLocation ? ` · ${roomLocation}` : ''}
          </p>
        )}
        <p className="booking-confirm-range">{formatTimeRange(startTime, endTime)}</p>

        <form
          className="booking-form"
          onSubmit={(event) => {
            event.preventDefault()
            onConfirm()
          }}
        >
          <label htmlFor="booking-title">
            Meeting title
            <input
              id="booking-title"
              type="text"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Team sync"
              autoFocus
              required
            />
          </label>

          {errorMessage && <p className="auth-message error">{errorMessage}</p>}

          <div className="popup-actions">
            <button type="button" className="nav-button secondary popup-cancel" onClick={() => onCancel(false)}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting || secondsLeft === 0}>
              {isSubmitting ? 'Confirming...' : 'Confirm booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BookingConfirmPopup
