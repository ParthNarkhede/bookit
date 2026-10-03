import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  SLOT_INTERVAL_MINUTES,
} from '../../constants/booking'
import { generateTimeSlots, parseDateKey } from '../../utils/dateHelpers'
import {
  getCurrentISTDateKey,
  getBookingBlockStyle,
  getCurrentMinutes,
  getSlotState,
  minutesToTime,
} from '../../utils/slotHelpers'
import { useScrollToCurrentTime } from '../../hooks/useScrollToCurrentTime'
import { formatDisplayName } from '../../utils/validators'

const SLOT_HEIGHT_PX = 36
const TIME_GUTTER_WIDTH = 56
const ROOM_COLUMN_WIDTH = 180

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
  onRoomDetailsClick,
  onSlotDragSelect,
  selectionLocked,
}) {
  const scrollRef = useRef(null)
  const dragRoomRef = useRef(null)
  const suppressClickRef = useRef(false)
  const [timeTick, setTimeTick] = useState(() => Date.now())
  const slots = useMemo(
    () => generateTimeSlots(DAY_START_HOUR, DAY_END_HOUR, SLOT_INTERVAL_MINUTES),
    [],
  )
  const todayKey = getCurrentISTDateKey()
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
  const timelineHeight = slots.length * SLOT_HEIGHT_PX

  const gridTemplateColumns = `${TIME_GUTTER_WIDTH}px repeat(${columns.length}, minmax(${ROOM_COLUMN_WIDTH}px, 1fr))`

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

      <div
        className="schedule-grid-scroll"
        ref={scrollRef}
        onPointerUpCapture={() => {
          dragRoomRef.current = null
        }}
        onPointerCancel={() => {
          dragRoomRef.current = null
          suppressClickRef.current = false
        }}
      >
        <div
          className="schedule-unified-grid"
          style={{ minWidth: `${TIME_GUTTER_WIDTH + columns.length * ROOM_COLUMN_WIDTH}px` }}
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
                    className={`schedule-day-band ${dateKey !== dateKeys[dateKeys.length - 1] ? 'has-date-divider' : ''}`}
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
              {columns.map((column, colIndex) => {
                const hasDateDivider =
                  (colIndex + 1) % rooms.length === 0 && colIndex < columns.length - 1

                return (
                <div key={column.id} className={`schedule-room-header ${hasDateDivider ? 'has-date-divider' : ''}`}>
                  <div className="schedule-room-title-row">
                    <strong>{column.room.name}</strong>
                    <button
                      type="button"
                      className="room-details-button"
                      onClick={() => onRoomDetailsClick?.(column.room)}
                    >
                      Room Details
                    </button>
                  </div>
                  <span>{column.room.location}</span>
                </div>
                )
              })}
            </div>
          </div>

          <div className="schedule-body-wrap">
            {showCurrentTime && currentLineTop !== null && currentLineTop >= 0 && currentLineTop < timelineHeight && (
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
                  const hasDateDivider =
                    (colIndex + 1) % rooms.length === 0 && colIndex < columns.length - 1
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
                      className={`schedule-slot schedule-slot-${state} ${isHourMark ? 'is-hour-line' : ''} ${hasDateDivider ? 'has-date-divider' : ''}`}
                      style={{ gridRow: rowIndex + 1, gridColumn: colIndex + 2 }}
                      disabled={!isInteractive || selectionLocked}
                      aria-label={`${column.room.name}, ${column.dateKey}, ${slot.startTime} to ${slot.endTime}`}
                      aria-pressed={state === 'selected'}
                      title={`${slot.startTime}–${slot.endTime}`}
                      onPointerDown={() => {
                        if (isInteractive && !selectionLocked) {
                          dragRoomRef.current = {
                            dateKey: column.dateKey,
                            roomId: column.room.id,
                            startTime: slot.startTime,
                            shouldSelect: state !== 'selected',
                            visitedStartTimes: new Set([slot.startTime]),
                          }
                        }
                      }}
                      onPointerEnter={(event) => {
                        if (
                          event.buttons === 1 &&
                          isInteractive &&
                          !selectionLocked &&
                          dragRoomRef.current?.dateKey === column.dateKey &&
                          dragRoomRef.current?.roomId === column.room.id &&
                          !dragRoomRef.current?.visitedStartTimes.has(slot.startTime)
                        ) {
                          const drag = dragRoomRef.current
                          drag.visitedStartTimes.add(slot.startTime)
                          suppressClickRef.current = true
                          onSlotDragSelect(
                            drag.dateKey,
                            drag.roomId,
                            [...drag.visitedStartTimes],
                            drag.shouldSelect,
                          )
                        }
                      }}
                      onClick={() => {
                        if (suppressClickRef.current) {
                          suppressClickRef.current = false
                          return
                        }
                        onToggleSlot(column.dateKey, column.room.id, slot.startTime)
                      }}
                    >
                      {state === 'selected' && (
                        <span className="schedule-slot-time-label">
                          {slot.startTime}–{slot.endTime}
                        </span>
                      )}
                    </button>
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
                    className={`schedule-column-overlay ${((colIndex + 1) % rooms.length === 0 && colIndex < columns.length - 1) ? 'has-date-divider' : ''}`}
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
                      const displayUserName = formatDisplayName(booking.userName)

                      const canClick =
                        isAdmin ||
                        booking.userId === currentUserId ||
                        !booking.isMasked ||
                        Boolean(booking.isBusy) ||
                        Boolean(booking.isHold)

                      return (
                        <button
                          key={booking.id}
                          type="button"
                          className={`schedule-booking-block schedule-booking-${booking.status} ${
                            booking.isHold ? 'is-hold' : ''
                          } ${booking.isBusy ? 'is-busy' : ''} ${booking.teams?.length ? 'has-teams' : ''}`}
                          style={{ top: blockStyle.top, height: blockStyle.height }}
                          disabled={!canClick}
                          onClick={() => onBookingClick?.(booking)}
                        >
                          <strong>{displayTitle}</strong>
                          <span>
                            {booking.startTime} – {booking.endTime}
                          </span>
                          {booking.teams?.length > 0 && (
                            <small className="schedule-booking-teams">
                              Teams: {booking.teams.join(', ')}
                            </small>
                          )}
                          {displayUserName ? (
                            <small>
                              {isAdmin
                                ? `${displayUserName} · ${booking.roomName || column.room.name}`
                                : displayUserName}
                            </small>
                          ) : null}
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
