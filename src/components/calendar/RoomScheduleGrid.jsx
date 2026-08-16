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

const SLOT_HEIGHT_PX = 28

function RoomScheduleGrid({
  rooms,
  dateKeys,
  bookings,
  currentUserId,
  isAdmin,
  selection,
  onToggleSlot,
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

  const gridHeight = slots.length * SLOT_HEIGHT_PX
  const currentLineTop = showCurrentTime
    ? ((currentMinutes - DAY_START_HOUR * 60) / SLOT_INTERVAL_MINUTES) * SLOT_HEIGHT_PX
    : null

  if (!rooms.length) {
    return (
      <div className="schedule-empty-state">
        <p>No rooms available yet. Ask an admin to add meeting rooms first.</p>
      </div>
    )
  }

  return (
    <div className="schedule-grid-shell">
      <p className="schedule-scroll-hint">Scroll horizontally on mobile to view all room columns.</p>
      <div className="schedule-grid-scroll" ref={scrollRef}>
        <div
          className="schedule-grid-layout"
          style={{ '--column-count': columns.length, '--slot-height': `${SLOT_HEIGHT_PX}px` }}
        >
          <div className="schedule-sticky-header">
            {dateKeys.length > 1 && (
              <div
                className="schedule-day-band-row"
                style={{ gridTemplateColumns: `72px repeat(${columns.length}, minmax(120px, 1fr))` }}
              >
                <div className="schedule-corner-cell" />
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
              className="schedule-room-header-row"
              style={{ gridTemplateColumns: `72px repeat(${columns.length}, minmax(120px, 1fr))` }}
            >
              <div className="schedule-corner-cell">Time</div>
              {columns.map((column) => (
                <div
                  key={column.id}
                  className="schedule-room-header"
                  title={`${column.room.description || ''}${
                    column.room.features?.length
                      ? `\n${column.room.features.map((f) => `${f.key}: ${f.value}`).join('\n')}`
                      : ''
                  }`}
                >
                  <strong>{column.room.name}</strong>
                  <span>{column.room.location}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="schedule-grid-body"
            style={{ gridTemplateColumns: `72px repeat(${columns.length}, minmax(120px, 1fr))` }}
          >
            <div className="schedule-time-gutter" style={{ height: `${gridHeight}px` }}>
              {Array.from(
                { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
                (_, index) => DAY_START_HOUR + index,
              ).map((hour) => (
                <div
                  key={hour}
                  className="schedule-hour-label"
                  style={{ height: `${(60 / SLOT_INTERVAL_MINUTES) * SLOT_HEIGHT_PX}px` }}
                >
                  {String(hour).padStart(2, '0')}
                </div>
              ))}
            </div>

            <div
              className="schedule-columns-wrap"
              style={{
                gridColumn: `2 / span ${columns.length}`,
                height: `${gridHeight}px`,
              }}
            >
              {showCurrentTime && currentLineTop !== null && currentLineTop >= 0 && (
                <div
                  className="schedule-current-time-line"
                  style={{ top: `${currentLineTop}px` }}
                  aria-hidden="true"
                  data-tick={timeTick}
                >
                  <span>{minutesToTime(currentMinutes)}</span>
                </div>
              )}

              <div
                className="schedule-columns"
                style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(120px, 1fr))` }}
              >
                {columns.map((column) => {
                  const columnBookings = bookings.filter(
                    (booking) =>
                      booking.date === column.dateKey && booking.roomId === column.room.id,
                  )
                  const isSelectedColumn =
                    selection?.dateKey === column.dateKey && selection?.roomId === column.room.id
                  const selectedStartTimes = isSelectedColumn ? selection.selectedStartTimes : []

                  return (
                    <div key={column.id} className="schedule-room-column">
                      <div className="schedule-slot-grid">
                        {slots.map((slot) => {
                          const state = getSlotState({
                            dateKey: column.dateKey,
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                            roomId: column.room.id,
                            bookings: columnBookings,
                            currentUserId,
                            selectedStartTimes,
                          })
                          const isInteractive = state === 'available' || state === 'selected'

                          return (
                            <button
                              key={`${column.id}-${slot.startTime}`}
                              type="button"
                              className={`schedule-slot schedule-slot-${state}`}
                              style={{ height: `${SLOT_HEIGHT_PX}px` }}
                              disabled={!isInteractive || selectionLocked}
                              aria-label={`${column.room.name} ${slot.startTime}`}
                              onClick={() =>
                                onToggleSlot(column.dateKey, column.room.id, slot.startTime)
                              }
                            />
                          )
                        })}
                      </div>

                      {columnBookings.map((booking) => {
                        const blockStyle = getBookingBlockStyle(
                          booking.startTime,
                          booking.endTime,
                          DAY_START_HOUR,
                          DAY_END_HOUR,
                          SLOT_HEIGHT_PX,
                        )

                        return (
                          <div
                            key={booking.id}
                            className={`schedule-booking-block schedule-booking-${booking.status} ${
                              booking.isBusy ? 'is-busy' : ''
                            }`}
                            style={{ top: blockStyle.top, height: blockStyle.height }}
                            title={`${booking.title} (${booking.startTime} - ${booking.endTime})`}
                          >
                            <strong>{booking.isBusy ? 'Busy' : booking.title}</strong>
                            <span>
                              {booking.startTime} – {booking.endTime}
                            </span>
                            {!booking.isBusy && (
                              <small>
                                {isAdmin
                                  ? `${booking.userName} · ${booking.roomName || column.room.name}`
                                  : booking.userName}
                              </small>
                            )}
                          </div>
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
    </div>
  )
}

export default RoomScheduleGrid
