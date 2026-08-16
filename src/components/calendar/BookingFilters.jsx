function BookingFilters({ filters, onChange, rooms = [] }) {
  return (
    <div className="booking-filters">
      <label>
        Filter by name
        <input
          type="text"
          value={filters.name}
          onChange={(event) => onChange({ ...filters, name: event.target.value })}
          placeholder="Employee name"
        />
      </label>

      <label>
        Filter by email
        <input
          type="email"
          value={filters.email}
          onChange={(event) => onChange({ ...filters, email: event.target.value })}
          placeholder="Email address"
        />
      </label>

      <label>
        Filter by room
        <select
          value={filters.room}
          onChange={(event) => onChange({ ...filters, room: event.target.value })}
        >
          <option value="">All rooms</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.name}>
              {room.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Slot duration
        <select
          value={filters.duration}
          onChange={(event) => onChange({ ...filters, duration: event.target.value })}
        >
          <option value="">All durations</option>
          <option value="15">15 minutes</option>
          <option value="30">30 minutes</option>
          <option value="45">45 minutes</option>
          <option value="60">60 minutes</option>
          <option value="90">90 minutes</option>
        </select>
      </label>
    </div>
  )
}

export default BookingFilters
