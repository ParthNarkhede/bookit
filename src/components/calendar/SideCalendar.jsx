import { useMemo, useState } from 'react'
import { getMonthMatrix } from '../../utils/dateHelpers'
import {
  getBookingWindowEndDateKey,
  getCurrentISTDateKey,
  isWithinBookingWindow,
} from '../../utils/slotHelpers'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function SideCalendar({ selectedDateKey, monthResetKey, onSelectDate }) {
  const selectedDate = useMemo(() => {
    const [year, month] = selectedDateKey.split('-').map(Number)
    return { year, month: month - 1 }
  }, [selectedDateKey])

  const [monthOverride, setMonthOverride] = useState(null)
  const visibleMonth = monthOverride?.dateKey === selectedDateKey && monthOverride?.resetKey === monthResetKey
    ? monthOverride
    : selectedDate

  const monthCells = useMemo(
    () => getMonthMatrix(visibleMonth.year, visibleMonth.month),
    [visibleMonth.month, visibleMonth.year],
  )

  const monthLabel = new Date(visibleMonth.year, visibleMonth.month, 1).toLocaleDateString(
    undefined,
    { month: 'long', year: 'numeric' },
  )
  const currentDate = new Date(`${getCurrentISTDateKey()}T00:00:00`)
  const currentMonthIndex = currentDate.getFullYear() * 12 + currentDate.getMonth()
  const lastBookableDate = new Date(`${getBookingWindowEndDateKey()}T00:00:00`)
  const lastBookableMonthIndex = lastBookableDate.getFullYear() * 12 + lastBookableDate.getMonth()
  const visibleMonthIndex = visibleMonth.year * 12 + visibleMonth.month

  const goToPreviousMonth = () => {
    setMonthOverride((current) => {
      const visible = current?.dateKey === selectedDateKey && current?.resetKey === monthResetKey
        ? current
        : selectedDate
      const date = new Date(visible.year, visible.month - 1, 1)
      return { year: date.getFullYear(), month: date.getMonth(), dateKey: selectedDateKey, resetKey: monthResetKey }
    })
  }

  const goToNextMonth = () => {
    setMonthOverride((current) => {
      const visible = current?.dateKey === selectedDateKey && current?.resetKey === monthResetKey
        ? current
        : selectedDate
      const date = new Date(visible.year, visible.month + 1, 1)
      return { year: date.getFullYear(), month: date.getMonth(), dateKey: selectedDateKey, resetKey: monthResetKey }
    })
  }

  return (
    <section className="side-calendar-card">
      <div className="side-calendar-header">
        <button
          type="button"
          className="calendar-nav-button"
          onClick={goToPreviousMonth}
          disabled={visibleMonthIndex <= currentMonthIndex}
          aria-label="Previous month"
        >
          ‹
        </button>
        <h3>{monthLabel}</h3>
        <button
          type="button"
          className="calendar-nav-button"
          onClick={goToNextMonth}
          disabled={visibleMonthIndex >= lastBookableMonthIndex}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="side-calendar-weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="side-calendar-grid">
        {monthCells.map((cell, index) => {
          if (!cell) {
            return <span key={`empty-${index}`} className="side-calendar-empty" />
          }

          const isDisabled = !isWithinBookingWindow(cell.dateKey)
          const isSelected = cell.dateKey === selectedDateKey

          return (
            <button
              key={cell.dateKey}
              type="button"
              className={`side-calendar-day ${isSelected ? 'is-selected' : ''} ${cell.isToday ? 'is-today' : ''}`}
              disabled={isDisabled}
              onClick={() => onSelectDate(cell.dateKey)}
            >
              {cell.dayNumber}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        className="text-button side-calendar-today"
        onClick={() => onSelectDate(getCurrentISTDateKey())}
      >
        Go to today
      </button>
    </section>
  )
}

export default SideCalendar
