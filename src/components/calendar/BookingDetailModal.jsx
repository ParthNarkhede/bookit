import { useEffect, useState } from 'react'
import { formatDisplayDate, formatTimeRange } from '../../utils/dateHelpers'
import { isBookingPast } from '../../utils/slotHelpers'
import { formatDisplayName } from '../../utils/validators'
import { subscribeToTeams } from '../../services/teamService'

function BookingDetailModal({
  booking,
  isAdmin,
  currentUserId,
  onClose,
  onDelete,
  onSaveTitle,
  onSaveTeams,
  onReschedule,
  isProcessing,
  errorMessage,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingTeams, setIsEditingTeams] = useState(false)
  const [title, setTitle] = useState(booking?.title || '')
  const [teamOptions, setTeamOptions] = useState([])
  const [selectedTeams, setSelectedTeams] = useState([])

  useEffect(() => subscribeToTeams(setTeamOptions), [])

  if (!booking) {
    return null
  }

  const isOwner = booking.userId === currentUserId
  const canManage = isAdmin || isOwner
  const isConfirmed = booking.status === 'confirmed'
  const isHold = booking.status === 'hold'
  const isPastMeeting = isConfirmed && isBookingPast(booking.date, booking.endTime)
  const displayUserName = formatDisplayName(booking.userName)

  const handleSave = async () => {
    const result = await onSaveTitle(booking.id, title)
    if (result?.success) {
      setIsEditing(false)
    }
  }

  const handleSaveTeams = async () => {
    const result = await onSaveTeams(booking.id, selectedTeams)
    if (result?.success) {
      setIsEditingTeams(false)
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
          <div>
            <dt>Teams</dt>
            <dd>{booking.teams?.length ? booking.teams.join(', ') : 'None selected'}</dd>
          </div>
          {booking.isMasked ? (
            <div>
              <dt>{booking.isHold ? 'Held by' : 'Booked by'}</dt>
              <dd>{displayUserName}</dd>
            </div>
          ) : (
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

        {canManage && isConfirmed && !isPastMeeting && !booking.isMasked && (
          <div className="booking-detail-edit">
            <section className="booking-detail-edit-section">
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
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setTitle(booking.title || '')
                    setIsEditing(true)
                  }}
                >
                  Edit title
                </button>
              )}
            </section>

            <section className="booking-detail-edit-section">
              {/* <p className="booking-team-edit-label">Teams</p> */}
              {isEditingTeams ? (
                <>
                  <label htmlFor="edit-team">
                    Edit Teams
                  </label>
                  <div className="booking-team-options booking-team-edit-options">
                    {[...teamOptions, ...(booking.teams || [])
                      .filter((name) => !teamOptions.some((team) => team.name === name))
                      .map((name) => ({ id: `saved:${name}`, name }))]
                      .map((team) => (
                        <label key={team.id} className="booking-team-option">
                          <input
                            type="checkbox"
                            checked={selectedTeams.includes(team.name)}
                            onChange={(event) => {
                              setSelectedTeams((current) => event.target.checked
                                ? [...current, team.name]
                                : current.filter((name) => name !== team.name))
                            }}
                          />
                          {team.name}
                        </label>
                      ))}
                  </div>
                  {teamOptions.length === 0 && <p className="booking-team-empty">No teams are available to add.</p>}
                  <div className="popup-actions">
                    <button type="button" className="text-button" onClick={() => setIsEditingTeams(false)}>
                      Cancel
                    </button>
                    <button type="button" className="primary-button" disabled={isProcessing} onClick={handleSaveTeams}>
                      Save teams
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setSelectedTeams(booking.teams || [])
                    setIsEditingTeams(true)
                  }}
                >
                  Edit teams
                </button>
              )}
            </section>
          </div>
        )}

        {errorMessage && <p className="auth-message error">{errorMessage}</p>}

        {canManage && !booking.isMasked && (
          <div className="booking-detail-actions">
            {isConfirmed && !isPastMeeting && (
              <button
                type="button"
                className="edit-timing"
                disabled={isProcessing}
                onClick={() => onReschedule(booking)}
              >
                Edit timings
              </button>
            )}
            {(!isPastMeeting || isHold) && (
              <button
                type="button"
                className="nav-button danger-button"
                disabled={isProcessing}
                onClick={() => onDelete(booking)}
              >
                {isHold ? 'Release hold' : 'Delete booking'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default BookingDetailModal
