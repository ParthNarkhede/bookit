function RoomDetailsModal({ room, onClose }) {
  if (!room) {
    return null
  }

  return (
    <div className="popup-overlay" role="presentation" onClick={onClose}>
      <section
        className="popup-card room-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="room-details-header">
          <div>
            <p className="eyebrow">Room details</p>
            <h3 id="room-details-title">{room.name}</h3>
          </div>
          <button type="button" className="text-button" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="room-details-location">{room.location}</p>
        <p className="room-details-description">{room.description || 'No description provided.'}</p>
        {room.features?.length > 0 && (
          <dl className="room-details-features">
            {room.features.map((feature) => (
              <div key={`${feature.key}-${feature.value}`}>
                <dt>{feature.key}</dt>
                <dd>{feature.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </div>
  )
}

export default RoomDetailsModal
