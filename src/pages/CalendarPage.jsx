import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SideCalendar from '../components/calendar/SideCalendar'
import RoomScheduleGrid from '../components/calendar/RoomScheduleGrid'
import BookingConfirmPopup from '../components/calendar/BookingConfirmPopup'
import BookingDetailModal from '../components/calendar/BookingDetailModal'
import SelectionSummaryBar from '../components/calendar/SelectionSummaryBar'
import {
  beginEditBooking,
  confirmSlotHold,
  createSlotHold,
  deleteBookingForUser,
  maskBookingsForEmployee,
  releaseSlotHold,
  subscribeToCalendarBookings,
  updateBookingSchedule,
  updateBookingTitle,
} from '../controllers/bookingController'
import { subscribeToActiveRooms } from '../controllers/roomController'
import { formatDisplayDate, getWeekDateKeys, toDateKey } from '../utils/dateHelpers'
import { getDashboardRoute } from '../utils/dashboardRoutes'
import {
  areSlotsConsecutive,
  getSelectionRange,
  getSlotStartTimesFromBooking,
  isSlotInPast,
  toggleSlotSelection,
} from '../utils/slotHelpers'

function CalendarPage({ user }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = user.role === 'admin'
  const [selectedDateKey, setSelectedDateKey] = useState(
    location.state?.dateKey || toDateKey(new Date()),
  )
  const [viewMode, setViewMode] = useState('daily')
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])
  const [editingBooking, setEditingBooking] = useState(location.state?.booking || null)
  const [selection, setSelection] = useState(() => {
    const booking = location.state?.booking
    if (booking) {
      return {
        dateKey: booking.date,
        roomId: booking.roomId,
        selectedStartTimes: getSlotStartTimesFromBooking(booking.startTime, booking.endTime),
      }
    }

    return {
      dateKey: location.state?.dateKey || toDateKey(new Date()),
      roomId: location.state?.roomId || '',
      selectedStartTimes: [],
    }
  })
  const [activeHold, setActiveHold] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [title, setTitle] = useState(location.state?.title || location.state?.booking?.title || '')
  const [message, setMessage] = useState(location.state?.rescheduleMessage || '')
  const [errorMessage, setErrorMessage] = useState('')
  const [modalError, setModalError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPlacingHold, setIsPlacingHold] = useState(false)
  const [isProcessingBooking, setIsProcessingBooking] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const enterEditMode = useCallback((booking) => {
    setEditingBooking(booking)
    setSelectedDateKey(booking.date)
    setViewMode('daily')
    setSelection({
      dateKey: booking.date,
      roomId: booking.roomId,
      selectedStartTimes: getSlotStartTimesFromBooking(booking.startTime, booking.endTime),
    })
    setTitle(booking.title || '')
    setMessage('Edit mode: select or deselect slots to change the time, then save.')
    setErrorMessage('')
  }, [])

  useEffect(() => {
    const editBookingId = location.state?.editBookingId
    const booking = location.state?.booking

    if (!editBookingId || !booking) {
      return
    }

    enterEditMode(booking)
    navigate(location.pathname, { replace: true, state: null })
  }, [enterEditMode, location.pathname, location.state?.booking, location.state?.editBookingId, navigate])

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

  const canBookSelectedSlots =
    selection.selectedStartTimes.length > 0 &&
    areSlotsConsecutive(selection.selectedStartTimes) &&
    selection.roomId &&
    !activeHold &&
    !editingBooking

  const canSaveEdit =
    Boolean(editingBooking) &&
    selection.selectedStartTimes.length > 0 &&
    areSlotsConsecutive(selection.selectedStartTimes) &&
    selection.roomId &&
    !activeHold

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
    setMessage(editingBooking ? 'Edit mode: pick new slots for the selected date.' : '')
    setErrorMessage('')
  }

  const handleCancelEdit = () => {
    setEditingBooking(null)
    setSelection({
      dateKey: selectedDateKey,
      roomId: '',
      selectedStartTimes: [],
    })
    setMessage('')
    setErrorMessage('')
  }

  const handleSaveEditSchedule = async () => {
    if (!editingBooking || !canSaveEdit) {
      return
    }

    const room = rooms.find((entry) => entry.id === selection.roomId)

    if (!room) {
      setErrorMessage('Selected room is no longer available.')
      return
    }

    const range = getSelectionRange(selection.selectedStartTimes)
    const unchanged =
      editingBooking.date === selection.dateKey &&
      editingBooking.roomId === selection.roomId &&
      editingBooking.startTime === range.startTime &&
      editingBooking.endTime === range.endTime

    if (unchanged) {
      setMessage('No changes to save.')
      return
    }

    setIsSavingEdit(true)
    setErrorMessage('')

    const result = await updateBookingSchedule(
      editingBooking.id,
      {
        dateKey: selection.dateKey,
        roomId: room.id,
        roomName: room.name,
        roomLocation: room.location,
        startTime: range.startTime,
        endTime: range.endTime,
        durationMinutes: range.durationMinutes,
      },
      user,
      isAdmin,
    )

    setIsSavingEdit(false)

    if (!result.success) {
      setErrorMessage(result.error)
      return
    }

    setEditingBooking(null)
    setSelection({
      dateKey: selection.dateKey,
      roomId: '',
      selectedStartTimes: [],
    })
    setMessage('Booking time updated successfully.')
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

  const handleClearSelection = () => {
    setSelection((current) => ({
      ...current,
      roomId: '',
      selectedStartTimes: [],
    }))
    setErrorMessage('')
  }

  const handleOpenBookingPopup = async () => {
    if (!canBookSelectedSlots) {
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
    setSelection((current) => ({
      ...current,
      roomId: '',
      selectedStartTimes: [],
    }))
    if (!title) {
      setTitle('')
    }
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

  const handleBookingClick = (booking) => {
    if (booking.isMasked && !isAdmin) {
      return
    }

    setSelectedBooking(booking)
    setModalError('')
  }

  const handleDeleteBooking = async (booking) => {
    const confirmed = window.confirm(
      booking.status === 'hold'
        ? 'Release this hold?'
        : 'Delete this booking? This cannot be undone.',
    )

    if (!confirmed) {
      return
    }

    setIsProcessingBooking(true)
    setModalError('')

    const result = await deleteBookingForUser(booking.id, user, isAdmin)

    setIsProcessingBooking(false)

    if (!result.success) {
      setModalError(result.error)
      return
    }

    setSelectedBooking(null)
    setMessage('Booking removed successfully.')
  }

  const handleSaveBookingTitle = async (bookingId, newTitle) => {
    setIsProcessingBooking(true)
    setModalError('')

    const result = await updateBookingTitle(bookingId, newTitle, user, isAdmin)

    setIsProcessingBooking(false)

    if (!result.success) {
      setModalError(result.error)
      return result
    }

    setSelectedBooking(null)
    setMessage('Booking updated successfully.')
    return result
  }

  const handleRescheduleBooking = async (booking) => {
    setIsProcessingBooking(true)
    setModalError('')

    const result = await beginEditBooking(booking.id, user, isAdmin)

    setIsProcessingBooking(false)

    if (!result.success) {
      setModalError(result.error)
      return
    }

    setSelectedBooking(null)
    enterEditMode(result.booking)
  }

  return (
    <main className="dashboard-shell calendar-page-shell calendar-page-wide">
      <header className="dashboard-page-header">
        <div>
          <p className="eyebrow">Booking calendar</p>
          <h1>Schedule a meeting</h1>
          {/* <p className="subtitle">
            Select consecutive 15-minute slots in any room column. Holds are shown in amber, booked slots in gray.
          </p> */}
        </div>
        <button
          type="button"
          className="text-button"
          onClick={() => navigate(getDashboardRoute(user.role))}
        >
          Back to dashboard
        </button>
      </header>

      <SelectionSummaryBar
        selection={selection}
        room={selectedRoom}
        onClear={handleClearSelection}
        onBook={handleOpenBookingPopup}
        isPlacingHold={isPlacingHold}
        canBook={canBookSelectedSlots}
        isEditMode={Boolean(editingBooking)}
        editingTitle={editingBooking?.title}
        onSaveEdit={handleSaveEditSchedule}
        onCancelEdit={handleCancelEdit}
        canSaveEdit={canSaveEdit}
        isSavingEdit={isSavingEdit}
      />

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
                  disabled={Boolean(editingBooking)}
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
            editingBookingId={editingBooking?.id}
            onToggleSlot={handleToggleSlot}
            onBookingClick={handleBookingClick}
            selectionLocked={Boolean(activeHold) || isPlacingHold || isSavingEdit}
          />

          {errorMessage && <p className="auth-message error">{errorMessage}</p>}
          {message && <p className="auth-message success">{message}</p>}
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

      <BookingDetailModal
        booking={selectedBooking}
        isAdmin={isAdmin}
        currentUserId={user.uid}
        onClose={() => setSelectedBooking(null)}
        onDelete={handleDeleteBooking}
        onSaveTitle={handleSaveBookingTitle}
        onReschedule={handleRescheduleBooking}
        isProcessing={isProcessingBooking}
        errorMessage={modalError}
      />
    </main>
  )
}

export default CalendarPage
