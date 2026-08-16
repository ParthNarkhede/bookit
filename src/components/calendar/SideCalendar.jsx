import { useMemo, useState } from 'react'
import { getMonthMatrix, toDateKey } from '../../utils/dateHelpers'
import { isPastDate } from '../../utils/slotHelpers'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function SideCalendar({ selectedDateKey, onSelectDate }) {
  const selectedDate = useMemo(() => {
    const [year, month] = selectedDateKey.split('-').map(Number)
    return { year, month: month - 1 }
  }, [selectedDateKey])

  const [visibleMonth, setVisibleMonth] = useState(selectedDate)

  const monthCells = useMemo(
    () => getMonthMatrix(visibleMonth.year, visibleMonth.month),
    [visibleMonth.month, visibleMonth.year],
  )

  const monthLabel = new Date(visibleMonth.year, visibleMonth.month, 1).toLocaleDateString(
    undefined,
    { month: 'long', year: 'numeric' },
  )

  const goToPreviousMonth = () => {
    setVisibleMonth((current) => {
      const date = new Date(current.year, current.month - 1, 1)
      return { year: date.getFullYear(), month: date.getMonth() }
    })
  }

  const goToNextMonth = () => {
    setVisibleMonth((current) => {
      const date = new Date(current.year, current.month + 1, 1)
      return { year: date.getFullYear(), month: date.getMonth() }
    })
  }

  return (
    <section className="side-calendar-card">
      <div className="side-calendar-header">
        <button type="button" className="calendar-nav-button" onClick={goToPreviousMonth}>
          ‹
        </button>
        <h3>{monthLabel}</h3>
        <button type="button" className="calendar-nav-button" onClick={goToNextMonth}>
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

          const isDisabled = isPastDate(cell.dateKey)
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
        onClick={() => onSelectDate(toDateKey(new Date()))}
      >
        Go to today
      </button>
    </section>
  )
}

export default SideCalendar
