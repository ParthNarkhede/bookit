import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RoomForm from '../components/rooms/RoomForm'
import { removeRoom, saveRoom, subscribeToActiveRooms } from '../controllers/roomController'

function ManageRoomsPage({ user }) {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [editingRoom, setEditingRoom] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const unsubscribe = subscribeToActiveRooms(
      setRooms,
      () => setErrorMessage('Unable to load rooms.'),
    )

    return unsubscribe
  }, [])

  const handleSaveRoom = async (roomPayload) => {
    setIsSubmitting(true)
    setErrorMessage('')

    const result = await saveRoom({
      roomId: editingRoom?.id,
      ...roomPayload,
      userId: user.uid,
    })

    setIsSubmitting(false)

    if (!result.success) {
      setErrorMessage(result.error)
      return
    }

    setEditingRoom(null)
    setIsCreating(false)
    setMessage(editingRoom ? 'Room updated successfully.' : 'Room added successfully.')
  }

  const handleDeleteRoom = async (room) => {
    const confirmed = window.confirm(`Delete ${room.name}? This cannot be undone.`)

    if (!confirmed) {
      return
    }

    const result = await removeRoom(room.id)

    if (!result.success) {
      setErrorMessage(result.error)
      return
    }

    setMessage(`${room.name} deleted successfully.`)
  }

  return (
    <main className="dashboard-shell manage-rooms-shell">
      <header className="dashboard-page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Manage rooms</h1>
          <p className="subtitle">Add, edit, and remove meeting rooms with features and descriptions.</p>
        </div>
        <button type="button" className="text-button" onClick={() => navigate('/admindashboard')}>
          Back to dashboard
        </button>
      </header>

      <section className="dashboard-section-card manage-rooms-toolbar">
        <div>
          <h2>Room inventory</h2>
          <p className="subtitle">{rooms.length} active room{rooms.length === 1 ? '' : 's'} available for booking.</p>
        </div>
        <button
          type="button"
          className="primary-button inline-button"
          onClick={() => {
            setIsCreating(true)
            setEditingRoom(null)
            setErrorMessage('')
          }}
        >
          Add room
        </button>
      </section>

      {message && <p className="auth-message success">{message}</p>}
      {errorMessage && <p className="auth-message error">{errorMessage}</p>}

      {(isCreating || editingRoom) && (
        <section className="dashboard-section-card">
          <h2>{editingRoom ? `Edit ${editingRoom.name}` : 'Add a new room'}</h2>
          <RoomForm
            initialRoom={editingRoom}
            onSubmit={handleSaveRoom}
            onCancel={() => {
              setIsCreating(false)
              setEditingRoom(null)
              setErrorMessage('')
            }}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
          />
        </section>
      )}

      <section className="room-card-grid">
        {rooms.map((room) => (
          <article key={room.id} className="room-card">
            <div className="room-card-header">
              <div>
                <h3>{room.name}</h3>
                <p>{room.location}</p>
              </div>
              <div className="room-card-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setEditingRoom(room)
                    setIsCreating(false)
                    setErrorMessage('')
                  }}
                >
                  Edit
                </button>
                <button type="button" className="text-button danger-text" onClick={() => handleDeleteRoom(room)}>
                  Delete
                </button>
              </div>
            </div>

            <p className="room-card-description">{room.description}</p>

            {room.features?.length > 0 && (
              <ul className="room-feature-list">
                {room.features.map((feature) => (
                  <li key={`${room.id}-${feature.key}`}>
                    <strong>{feature.key}:</strong> {feature.value}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </section>
    </main>
  )
}

export default ManageRoomsPage
