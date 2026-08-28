import { formatDisplayDate, formatTimeRange } from '../../utils/dateHelpers'
import { getSelectionRange } from '../../utils/slotHelpers'

function SelectionSummaryBar({
  selection,
  room,
  onClear,
  onBook,
  isPlacingHold,
  canBook,
  isEditMode,
  editingTitle,
  onSaveEdit,
  onCancelEdit,
  canSaveEdit,
  isSavingEdit,
}) {
  if (isEditMode) {
    const hasSelection = selection?.selectedStartTimes?.length > 0 && selection?.roomId
    const range = hasSelection ? getSelectionRange(selection.selectedStartTimes) : null

    return (
      <div className={`selection-summary-bar selection-summary-edit ${canSaveEdit ? 'is-ready' : 'is-invalid'}`}>
        <div className="selection-summary-details">
          <p className="selection-summary-label">Editing booking</p>
          <strong>{editingTitle || 'Meeting'}</strong>
          {hasSelection ? (
            <>
              <span>
                {formatDisplayDate(selection.dateKey)} · {room?.name || 'Room'}
              </span>
              <span>
                {formatTimeRange(range.startTime, range.endTime)} ({range.durationMinutes} min)
              </span>
            </>
          ) : (
            <span className="selection-warning">Select consecutive slots for the new time.</span>
          )}
          {hasSelection && !canSaveEdit && (
            <span className="selection-warning">Select consecutive 15-minute slots only.</span>
          )}
        </div>

        <div className="selection-summary-actions">
          <button type="button" className="text-button" onClick={onCancelEdit}>
            Cancel edit
          </button>
          {hasSelection && (
            <button type="button" className="text-button" onClick={onClear}>
              Clear selection
            </button>
          )}
          {canSaveEdit && (
            <button
              type="button"
              className="primary-button inline-button"
              disabled={isSavingEdit}
              onClick={onSaveEdit}
            >
              {isSavingEdit ? 'Saving...' : 'Save new time'}
            </button>
          )}
        </div>
      </div>
    )
  }

  const hasSelection = selection?.selectedStartTimes?.length > 0 && selection?.roomId

  if (!hasSelection) {
    return (
      <div className="selection-summary-bar selection-summary-empty">
        {/* <p>Click consecutive slots in a room column to select a time range.</p> */}
        <div className="schedule-legend">
          <span className="legend-item legend-available">Available</span>
          <span className="legend-item legend-selected">Selected</span>
          <span className="legend-item legend-hold">On hold</span>
          <span className="legend-item legend-busy">Booked</span>
        </div>
      </div>
    )
  }

  const range = getSelectionRange(selection.selectedStartTimes)
  const isConsecutive = canBook

  return (
    <div className={`selection-summary-bar ${isConsecutive ? 'is-ready' : 'is-invalid'}`}>
      <div className="selection-summary-details">
        <p className="selection-summary-label">Selected time</p>
        <strong>
          {formatDisplayDate(selection.dateKey)} · {room?.name || 'Room'}
        </strong>
        <span>
          {formatTimeRange(range.startTime, range.endTime)} ({range.durationMinutes} min)
        </span>
        {!isConsecutive && (
          <span className="selection-warning">Select consecutive 15-minute slots only.</span>
        )}
      </div>

      <div className="selection-summary-actions">
        <button type="button" className="text-button" onClick={onClear}>
          Clear
        </button>
        {isConsecutive && (
          <button
            type="button"
            className="primary-button inline-button"
            disabled={isPlacingHold}
            onClick={onBook}
          >
            {isPlacingHold ? 'Placing hold...' : 'Book selected slots'}
          </button>
        )}
      </div>
    </div>
  )
}

export default SelectionSummaryBar
