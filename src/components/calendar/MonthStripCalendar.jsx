import { getCalendarDays } from '../../utils/dateHelpers'

function MonthStripCalendar({ selectedDateKey, onSelectDate, dayCount = 28 }) {
  const days = getCalendarDays(new Date(), dayCount)
  const firstDay = days[0]?.date
  const headerLabel = firstDay
    ? firstDay.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : 'Calendar'

  return (
    <section className="calendar-strip-card">
      <div className="calendar-strip-header">
        <div>
          <p className="eyebrow">Schedule overview</p>
          <h3>{headerLabel}</h3>
        </div>
        <div className="calendar-strip-nav" aria-hidden="true">
          <span className="calendar-nav-icon">‹</span>
          <span className="calendar-nav-icon">›</span>
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
