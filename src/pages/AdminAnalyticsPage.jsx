import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBookingsInRange } from '../services/bookingService'
import { subscribeToActiveRooms } from '../controllers/roomController'
import { formatDisplayDate, toDateKey } from '../utils/dateHelpers'
import {
  computeAverageDailyMinutes,
  computeDayWiseUsage,
  computeRoomUsage,
  filterConfirmedBookings,
  getCustomDateRangeKeys,
  getDateRangeKeys,
} from '../utils/analyticsHelpers'
import { exportBookingsToExcel } from '../utils/exportHelpers'

const PERIOD_OPTIONS = [
  { id: '1', label: 'Last day', days: 1 },
  { id: '7', label: 'Last 7 days', days: 7 },
  // { id: '30', label: 'Last 30 days', days: 30 },
]

function AdminAnalyticsPage() {
  const [rooms, setRooms] = useState([])
  const [period, setPeriod] = useState('7')
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [exportStart, setExportStart] = useState('')
  const [exportEnd, setExportEnd] = useState(toDateKey(new Date()))
  const [exportMessage, setExportMessage] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToActiveRooms(setRooms)
    return unsubscribe
  }, [])

  const dateKeys = useMemo(() => {
    const option = PERIOD_OPTIONS.find((entry) => entry.id === period)
    return getDateRangeKeys(option?.days || 7)
  }, [period])

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      const start = dateKeys[0]
      const end = dateKeys[dateKeys.length - 1]
      const data = await getBookingsInRange(start, end)
      setBookings(data)
      setIsLoading(false)
    }

    load()
  }, [dateKeys])

  const confirmed = useMemo(() => filterConfirmedBookings(bookings), [bookings])
  const roomUsage = useMemo(() => computeRoomUsage(bookings, rooms), [bookings, rooms])
  const dayWise = useMemo(() => computeDayWiseUsage(bookings, dateKeys), [bookings, dateKeys])
  const avgDaily = computeAverageDailyMinutes(dayWise)
  const maxRoomMinutes = Math.max(...roomUsage.map((r) => r.minutes), 1)
  const maxDayMinutes = Math.max(...dayWise.map((d) => d.minutes), 1)

  const handleExport = async (rangeType) => {
    let start
    let end = toDateKey(new Date())

    if (rangeType === 'custom') {
      if (!exportStart || !exportEnd) {
        setExportMessage('Select both start and end dates.')
        return
      }
      start = exportStart
      end = exportEnd
    } else {
      const option = PERIOD_OPTIONS.find((entry) => entry.id === rangeType)
      const keys = getDateRangeKeys(option?.days || 7)
      start = keys[0]
      end = keys[keys.length - 1]
    }

    const data = filterConfirmedBookings(await getBookingsInRange(start, end))
    if (!data.length) {
      setExportMessage('No bookings found for the selected range.')
      return
    }

    await exportBookingsToExcel(data, `bookings_${start}_to_${end}.xlsx`)
    setExportMessage(`Exported ${data.length} booking(s).`)
  }

  return (
    <main className="dashboard-shell admin-dashboard-shell">
      <header className="dashboard-page-header manage-rooms-toolbar">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Analytics & export</h1>
          <p className="subtitle">Room usage insights and booking data exports.</p>
        </div>
        <Link to="/admindashboard" className="text-button">
          Back to dashboard
        </Link>
      </header>

      <section className="dashboard-card admin-panel-card">
        <div className="analytics-toolbar">
          <h2>Usage overview</h2>
          <div className="period-toggle">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={period === option.id ? 'is-active' : ''}
                onClick={() => setPeriod(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p>Loading analytics...</p>
        ) : (
          <>
            <div className="analytics-stats">
              <div className="stat-card">
                <span>Total bookings</span>
                <strong>{confirmed.length}</strong>
              </div>
              <div className="stat-card">
                <span>Avg usage / day</span>
                <strong>{(avgDaily / 60).toFixed(1)}h</strong>
              </div>
              <div className="stat-card">
                <span>Total room hours</span>
                <strong>
                  {(confirmed.reduce((sum, b) => sum + (b.durationMinutes || 0), 0) / 60).toFixed(1)}h
                </strong>
              </div>
            </div>

            <div className="analytics-charts">
              <div className="chart-panel">
                <h3>Room hours</h3>
                <div className="bar-chart">
                  {roomUsage.map((room) => (
                    <div key={room.roomId} className="bar-chart-row">
                      <span className="bar-label">{room.roomName}</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${(room.minutes / maxRoomMinutes) * 100}%` }}
                        />
                      </div>
                      <span className="bar-value">{(room.minutes / 60).toFixed(1)}h</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-panel">
                <h3>Day-wise usage</h3>
                <div className="column-chart">
                  {dayWise.map((day) => (
                    <div key={day.dateKey} className="column-chart-item">
                      <div
                        className="column-bar"
                        style={{ height: `${(day.minutes / maxDayMinutes) * 100}%` }}
                        title={`${day.hours}h`}
                      />
                      <span>{formatDisplayDate(day.dateKey).split(',')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="dashboard-card admin-panel-card">
        <h2>Export bookings</h2>
        <p className="subtitle">Download confirmed bookings as Excel for reporting.</p>

        <div className="export-actions">
          <button type="button" className="primary-button" onClick={() => handleExport('1')}>
            Last day
          </button>
          <button type="button" className="primary-button" onClick={() => handleExport('7')}>
            Last 7 days
          </button>
          <button type="button" className="primary-button" onClick={() => handleExport('30')}>
            Last 30 days
          </button>
        </div>

        <div className="export-custom">
          <label htmlFor="export-start">
            From
            <input
              id="export-start"
              type="date"
              value={exportStart}
              onChange={(event) => setExportStart(event.target.value)}
            />
          </label>
          <label htmlFor="export-end">
            To
            <input
              id="export-end"
              type="date"
              value={exportEnd}
              onChange={(event) => setExportEnd(event.target.value)}
            />
          </label>
          <button type="button" className="nav-button secondary" onClick={() => handleExport('custom')}>
            Export range
          </button>
        </div>

        {exportMessage && <p className="auth-message success">{exportMessage}</p>}
      </section>
    </main>
  )
}

export default AdminAnalyticsPage
