import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  SLOT_INTERVAL_MINUTES,
} from '../../constants/booking'
import { generateTimeSlots, parseDateKey, toDateKey } from '../../utils/dateHelpers'
import {
  getBookingBlockStyle,
  getCurrentMinutes,
  getSlotState,
  minutesToTime,
} from '../../utils/slotHelpers'
import { useScrollToCurrentTime } from '../../hooks/useScrollToCurrentTime'

const SLOT_HEIGHT_PX = 36
const TIME_GUTTER_WIDTH = 56

function RoomScheduleGrid({
  rooms,
  dateKeys,
  bookings,
  currentUserId,
  isAdmin,
  selection,
  editingBookingId,
  onToggleSlot,
  onBookingClick,
  selectionLocked,
}) {
  const scrollRef = useRef(null)
  const [timeTick, setTimeTick] = useState(Date.now())
  const slots = useMemo(
    () => generateTimeSlots(DAY_START_HOUR, DAY_END_HOUR, SLOT_INTERVAL_MINUTES),
    [],
  )
  const todayKey = toDateKey(new Date())
  const showCurrentTime = dateKeys.includes(todayKey)
  const currentMinutes = getCurrentMinutes()

  useEffect(() => {
    if (!showCurrentTime) {
      return undefined
    }

    const intervalId = window.setInterval(() => setTimeTick(Date.now()), 30000)
    return () => window.clearInterval(intervalId)
  }, [showCurrentTime])

  useScrollToCurrentTime({
    enabled: showCurrentTime,
    slotHeightPx: SLOT_HEIGHT_PX,
    containerRef: scrollRef,
    currentMinutes,
  })

  const columns = useMemo(
    () =>
      dateKeys.flatMap((dateKey) =>
        rooms.map((room) => ({
          id: `${dateKey}-${room.id}`,
          dateKey,
          room,
        })),
      ),
    [dateKeys, rooms],
  )

  const currentLineTop = showCurrentTime
    ? ((currentMinutes - DAY_START_HOUR * 60) / SLOT_INTERVAL_MINUTES) * SLOT_HEIGHT_PX
    : null

  const gridTemplateColumns = `${TIME_GUTTER_WIDTH}px repeat(${columns.length}, minmax(140px, 1fr))`

  if (!rooms.length) {
    return (
      <div className="schedule-empty-state">
        <p>No rooms available yet. Ask an admin to add meeting rooms first.</p>
      </div>
    )
  }

  return (
    <div className="schedule-grid-shell">
      <p className="schedule-scroll-hint">Swipe horizontally to view all rooms on smaller screens.</p>

      <div className="schedule-grid-scroll" ref={scrollRef}>
        <div
          className="schedule-unified-grid"
          style={{ minWidth: `${TIME_GUTTER_WIDTH + columns.length * 140}px` }}
        >
          <div className="schedule-header-sticky">
            {dateKeys.length > 1 && (
              <div
                className="schedule-header-row"
                style={{ gridTemplateColumns: gridTemplateColumns }}
              >
                <div className="schedule-time-header" />
                {dateKeys.map((dateKey) => (
                  <div
                    key={`day-${dateKey}`}
                    className="schedule-day-band"
                    style={{ gridColumn: `span ${rooms.length}` }}
                  >
                    {parseDateKey(dateKey).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                ))}
              </div>
            )}

            <div
              className="schedule-header-row"
              style={{ gridTemplateColumns: gridTemplateColumns }}
            >
              <div className="schedule-time-header">Time</div>
              {columns.map((column) => (
                <div key={column.id} className="schedule-room-header">
                  <strong>{column.room.name}</strong>
                  <span>{column.room.location}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="schedule-body-wrap">
            {showCurrentTime && currentLineTop !== null && currentLineTop >= 0 && (
              <div
                className="schedule-current-time-line"
                style={{ top: `${currentLineTop}px`, left: `${TIME_GUTTER_WIDTH}px` }}
                data-tick={timeTick}
              >
                <span className="schedule-current-time-badge">{minutesToTime(currentMinutes)}</span>
              </div>
            )}

            <div
              className="schedule-unified-body"
              style={{
                gridTemplateColumns: gridTemplateColumns,
                gridTemplateRows: `repeat(${slots.length}, ${SLOT_HEIGHT_PX}px)`,
              }}
            >
              {slots.map((slot, rowIndex) => {
                const isHourMark = slot.startTime.endsWith(':00')

                return (
                  <div
                    key={`time-${slot.startTime}`}
                    className={`schedule-time-cell ${isHourMark ? 'is-hour' : ''}`}
                    style={{ gridRow: rowIndex + 1, gridColumn: 1 }}
                  >
                    {isHourMark ? slot.startTime : ''}
                  </div>
                )
              })}

              {slots.map((slot, rowIndex) =>
                columns.map((column, colIndex) => {
                  const isSelectedColumn =
                    selection?.dateKey === column.dateKey && selection?.roomId === column.room.id
                  const selectedStartTimes = isSelectedColumn ? selection.selectedStartTimes : []
                  const isHourMark = slot.startTime.endsWith(':00')

                  const state = getSlotState({
                    dateKey: column.dateKey,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    roomId: column.room.id,
                    bookings,
                    currentUserId,
                    selectedStartTimes,
                    excludeBookingId: editingBookingId,
                  })
                  const isInteractive = state === 'available' || state === 'selected'

                  return (
                    <button
                      key={`${column.id}-${slot.startTime}`}
                      type="button"
                      className={`schedule-slot schedule-slot-${state} ${isHourMark ? 'is-hour-line' : ''}`}
                      style={{ gridRow: rowIndex + 1, gridColumn: colIndex + 2 }}
                      disabled={!isInteractive || selectionLocked}
                      aria-label={`${column.room.name} ${slot.startTime}`}
                      onClick={() => onToggleSlot(column.dateKey, column.room.id, slot.startTime)}
                    />
                  )
                }),
              )}

              {columns.map((column, colIndex) => {
                const columnBookings = bookings.filter(
                  (booking) =>
                    booking.id !== editingBookingId &&
                    booking.date === column.dateKey &&
                    booking.roomId === column.room.id,
                )

                return (
                  <div
                    key={`overlay-${column.id}`}
                    className="schedule-column-overlay"
                    style={{
                      gridColumn: colIndex + 2,
                      gridRow: `1 / ${slots.length + 1}`,
                    }}
                  >
                    {columnBookings.map((booking) => {
                      const blockStyle = getBookingBlockStyle(
                        booking.startTime,
                        booking.endTime,
                        DAY_START_HOUR,
                        DAY_END_HOUR,
                        SLOT_HEIGHT_PX,
                      )

                      const displayTitle = booking.isHold
                        ? 'On hold'
                        : booking.isBusy
                          ? 'Booked'
                          : booking.title

                      const canClick =
                        isAdmin || booking.userId === currentUserId || !booking.isMasked

                      return (
                        <button
                          key={booking.id}
                          type="button"
                          className={`schedule-booking-block schedule-booking-${booking.status} ${
                            booking.isHold ? 'is-hold' : ''
                          } ${booking.isBusy ? 'is-busy' : ''}`}
                          style={{ top: blockStyle.top, height: blockStyle.height }}
                          disabled={!canClick}
                          onClick={() => onBookingClick?.(booking)}
                        >
                          <strong>{displayTitle}</strong>
                          <span>
                            {booking.startTime} – {booking.endTime}
                          </span>
                          {!booking.isMasked && (
                            <small>
                              {isAdmin
                                ? `${booking.userName} · ${booking.roomName || column.room.name}`
                                : booking.userName}
                            </small>
                          )}
                          {booking.isHold && booking.isMasked && (
                            <small>Someone is booking</small>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoomScheduleGrid
