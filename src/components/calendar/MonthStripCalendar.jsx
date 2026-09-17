import { useEffect, useMemo, useState } from 'react'
import { getMonthDays, parseDateKey, toDateKey } from '../../utils/dateHelpers'

function MonthStripCalendar({ selectedDateKey, onSelectDate }) {
  const selectedDate = parseDateKey(selectedDateKey)
  const [visibleMonth, setVisibleMonth] = useState({
    year: selectedDate.getFullYear(),
    month: selectedDate.getMonth(),
  })

  useEffect(() => {
    const date = parseDateKey(selectedDateKey)
    setVisibleMonth({ year: date.getFullYear(), month: date.getMonth() })
  }, [selectedDateKey])

  const days = useMemo(
    () => getMonthDays(visibleMonth.year, visibleMonth.month),
    [visibleMonth.month, visibleMonth.year],
  )

  const headerLabel = new Date(visibleMonth.year, visibleMonth.month, 1).toLocaleDateString(
    undefined,
    { month: 'long', year: 'numeric' },
  )

  const goToMonth = (offset) => {
    const nextMonthDate = new Date(visibleMonth.year, visibleMonth.month + offset, 1)
    const year = nextMonthDate.getFullYear()
    const month = nextMonthDate.getMonth()
    const today = new Date()
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()

    setVisibleMonth({ year, month })
    onSelectDate(isCurrentMonth ? toDateKey(today) : toDateKey(nextMonthDate))
  }

  return (
    <section className="calendar-strip-card">
      <div className="calendar-strip-header">
        <div>
          <p className="eyebrow">Schedule overview</p>
          <h3>{headerLabel}</h3>
        </div>
        <div className="calendar-strip-nav">
          <button
            type="button"
            className="calendar-nav-button"
            aria-label="Previous month"
            onClick={() => goToMonth(-1)}
          >
            ‹
          </button>
          <button
            type="button"
            className="calendar-nav-button"
            aria-label="Next month"
            onClick={() => goToMonth(1)}
          >
            ›
          </button>
        </div>
      </div>

      <div className="calendar-strip-grid">
        {days.map((day) => {
          const isSelected = day.dateKey === selectedDateKey
          const showMonth = day.dayNumber === 1 || day.dateKey === days[0].dateKey

          return (
            <button
              key={day.dateKey}
              type="button"
              className={`calendar-day ${isSelected ? 'is-selected' : ''} ${day.isToday ? 'is-today' : ''}`}
              onClick={() => onSelectDate(day.dateKey)}
            >
              <span className="calendar-day-label">{day.dayLabel}</span>
              {showMonth && <span className="calendar-month-label">{day.monthLabel}</span>}
              <span className="calendar-day-number">{day.dayNumber}</span>
              {day.isToday && <span className="calendar-today-dot" />}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default MonthStripCalendar
