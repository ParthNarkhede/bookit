import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SideCalendar from '../components/calendar/SideCalendar'
import RoomScheduleGrid from '../components/calendar/RoomScheduleGrid'
import BookingConfirmPopup from '../components/calendar/BookingConfirmPopup'
import {
  confirmSlotHold,
  createSlotHold,
  maskBookingsForEmployee,
  releaseSlotHold,
  subscribeToCalendarBookings,
} from '../controllers/bookingController'
import { subscribeToActiveRooms } from '../controllers/roomController'
import { formatDisplayDate, getWeekDateKeys, toDateKey } from '../utils/dateHelpers'
import { getDashboardRoute } from '../utils/dashboardRoutes'
import {
  areSlotsConsecutive,
  getSelectionRange,
  isSlotInPast,
  toggleSlotSelection,
} from '../utils/slotHelpers'

function CalendarPage({ user }) {
  const navigate = useNavigate()
  const isAdmin = user.role === 'admin'
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(new Date()))
  const [viewMode, setViewMode] = useState('daily')
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])
  const [selection, setSelection] = useState({
    dateKey: toDateKey(new Date()),
    roomId: '',
    selectedStartTimes: [],
  })
  const [activeHold, setActiveHold] = useState(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPlacingHold, setIsPlacingHold] = useState(false)

  const weekDateKeys = useMemo(() => getWeekDateKeys(selectedDateKey), [selectedDateKey])
  const visibleDateKeys = viewMode === 'weekly' ? weekDateKeys : [selectedDateKey]
  const subscriptionRange = useMemo(() => {
    if (viewMode === 'weekly') {
      return { start: weekDateKeys[0], end: weekDateKeys[6] }
    }

    return { start: selectedDateKey, end: selectedDateKey }
  }, [selectedDateKey, viewMode, weekDateKeys])

  useEffect(() => {
    const unsubscribe = subscribeToActiveRooms(setRooms, () => {
      setErrorMessage('Unable to load rooms.')
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeToCalendarBookings(
      subscriptionRange.start,
      subscriptionRange.end,
      (liveBookings) => {
        const visibleBookings = isAdmin
          ? liveBookings
          : maskBookingsForEmployee(liveBookings, user.uid)

        setBookings(visibleBookings)
      },
      () => setMessage('Unable to load live bookings.'),
    )

    return unsubscribe
  }, [subscriptionRange.end, subscriptionRange.start, isAdmin, user.uid])

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selection.roomId),
    [rooms, selection.roomId],
  )

  const handleClosePopup = useCallback((expired = false) => {
    setActiveHold((currentHold) => {
      if (currentHold?.id) {
        releaseSlotHold(currentHold.id).catch(() => {})
      }
      return null
    })

    setIsPopupOpen(false)
    setTitle('')
    setErrorMessage('')

    if (expired) {
      setMessage('Your hold expired. Please select the slots again.')
    }
  }, [])

  const handleDateSelect = (dateKey) => {
    setSelectedDateKey(dateKey)
    setSelection({
      dateKey,
      roomId: '',
      selectedStartTimes: [],
    })
    setMessage('')
    setErrorMessage('')
  }

  const handleToggleSlot = (dateKey, roomId, startTime) => {
    if (activeHold || isPlacingHold) {
      return
    }

    if (isSlotInPast(dateKey, startTime)) {
      setErrorMessage('You cannot book a slot that has already passed.')
      return
    }

    if (selection.dateKey !== dateKey || selection.roomId !== roomId) {
      setSelection({
        dateKey,
        roomId,
        selectedStartTimes: [startTime],
      })
      setErrorMessage('')
      return
    }

    setSelection((current) => ({
      ...current,
      selectedStartTimes: toggleSlotSelection(current.selectedStartTimes, startTime),
    }))
    setErrorMessage('')
  }

  const handleOpenBookingPopup = async () => {
    if (!selection.selectedStartTimes.length || !selection.roomId) {
      return
    }

    if (!areSlotsConsecutive(selection.selectedStartTimes)) {
      setErrorMessage('Please select consecutive 15-minute slots in the same room.')
      return
    }

    const room = rooms.find((entry) => entry.id === selection.roomId)

    if (!room) {
      setErrorMessage('Selected room is no longer available.')
      return
    }

    const range = getSelectionRange(selection.selectedStartTimes)
    setIsPlacingHold(true)
    setErrorMessage('')

    const holdResult = await createSlotHold({
      user,
      dateKey: selection.dateKey,
      roomId: room.id,
      roomName: room.name,
      roomLocation: room.location,
      startTime: range.startTime,
      endTime: range.endTime,
      durationMinutes: range.durationMinutes,
    })

    setIsPlacingHold(false)

    if (!holdResult.success) {
      setErrorMessage(holdResult.error)
      return
    }

    setActiveHold(holdResult.hold)
    setSelection({
      dateKey: selection.dateKey,
      roomId: '',
      selectedStartTimes: [],
    })
    setTitle('')
    setIsPopupOpen(true)
    setMessage('')
  }

  const handleConfirmBooking = async () => {
    if (!activeHold?.id) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    const result = await confirmSlotHold({
      holdId: activeHold.id,
      title,
    })

    if (!result.success) {
      setErrorMessage(result.error)
      setIsSubmitting(false)
      return
    }

    setActiveHold(null)
    setIsPopupOpen(false)
    setTitle('')
    setIsSubmitting(false)
    setMessage('Meeting booked successfully.')
  }

  const canBookSelectedSlots =
    selection.selectedStartTimes.length > 0 &&
    areSlotsConsecutive(selection.selectedStartTimes) &&
    selection.roomId &&
    !activeHold

  return (
    <main className="dashboard-shell calendar-page-shell">
      <header className="dashboard-page-header">
        <div>
          <p className="eyebrow">Booking calendar</p>
          <h1>Schedule a meeting</h1>
          <p className="subtitle">
            Pick a room column, select consecutive 15-minute slots, and confirm within 1 minute.
          </p>
        </div>
        <button
          type="button"
          className="text-button"
          onClick={() => navigate(getDashboardRoute(user.role))}
        >
          Back to dashboard
        </button>
      </header>

      <section className="calendar-main-layout">
        <aside className="calendar-left-panel">
          <SideCalendar selectedDateKey={selectedDateKey} onSelectDate={handleDateSelect} />
        </aside>

        <div className="calendar-right-panel calendar-grid-panel">
          <div className="calendar-view-toolbar">
            <div>
              <p className="eyebrow">Room schedule</p>
              <h2>{viewMode === 'daily' ? formatDisplayDate(selectedDateKey) : 'Weekly room grid'}</h2>
            </div>

            <div className="calendar-toolbar-actions">
              <button
                type="button"
                className="text-button"
                onClick={() => handleDateSelect(toDateKey(new Date()))}
              >
                Today
              </button>

              <div className="view-toggle">
              <button
                type="button"
                className={viewMode === 'daily' ? 'is-active' : ''}
                onClick={() => setViewMode('daily')}
              >
                Daily
              </button>
              <button
                type="button"
                className={viewMode === 'weekly' ? 'is-active' : ''}
                onClick={() => setViewMode('weekly')}
              >
                Weekly
              </button>
              </div>
            </div>
          </div>

          <RoomScheduleGrid
            rooms={rooms}
            dateKeys={visibleDateKeys}
            bookings={bookings}
            currentUserId={user.uid}
            isAdmin={isAdmin}
            selection={selection}
            onToggleSlot={handleToggleSlot}
            selectionLocked={Boolean(activeHold) || isPlacingHold}
          />

          {errorMessage && <p className="auth-message error">{errorMessage}</p>}
          {message && <p className="auth-message success">{message}</p>}

          {canBookSelectedSlots && (
            <div className="book-slots-bar">
              <p>
                {selectedRoom?.name} · {selection.selectedStartTimes.length} slot
                {selection.selectedStartTimes.length === 1 ? '' : 's'} selected
              </p>
              <button
                type="button"
                className="primary-button inline-button"
                disabled={isPlacingHold}
                onClick={handleOpenBookingPopup}
              >
                {isPlacingHold ? 'Placing hold...' : 'Book the slot'}
              </button>
            </div>
          )}
        </div>
      </section>

      <BookingConfirmPopup
        isOpen={isPopupOpen}
        startTime={activeHold?.startTime}
        endTime={activeHold?.endTime}
        holdExpiresAt={activeHold?.holdExpiresAt}
        roomName={activeHold?.roomName}
        roomLocation={activeHold?.roomLocation}
        title={title}
        onTitleChange={setTitle}
        onConfirm={handleConfirmBooking}
        onCancel={handleClosePopup}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
      />
    </main>
  )
}

export default CalendarPage
