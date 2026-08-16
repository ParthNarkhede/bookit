import { useState } from 'react'

const EMPTY_FEATURE = { key: '', value: '' }

function FeatureFields({ features, onChange }) {
  const updateFeature = (index, field, value) => {
    const nextFeatures = features.map((feature, featureIndex) =>
      featureIndex === index ? { ...feature, [field]: value } : feature,
    )
    onChange(nextFeatures)
  }

  const addFeature = () => {
    onChange([...features, { ...EMPTY_FEATURE }])
  }

  const removeFeature = (index) => {
    onChange(features.filter((_, featureIndex) => featureIndex !== index))
  }

  return (
    <div className="feature-fields">
      <div className="feature-fields-header">
        <span>Features</span>
        <button type="button" className="text-button" onClick={addFeature}>
          + Add feature
        </button>
      </div>

      {features.length === 0 && <p className="auth-muted">No features added yet.</p>}

      {features.map((feature, index) => (
        <div key={`feature-${index}`} className="feature-row">
          <input
            type="text"
            value={feature.key}
            onChange={(event) => updateFeature(index, 'key', event.target.value)}
            placeholder="Feature name"
          />
          <input
            type="text"
            value={feature.value}
            onChange={(event) => updateFeature(index, 'value', event.target.value)}
            placeholder="Feature value"
          />
          <button type="button" className="text-button" onClick={() => removeFeature(index)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  )
}

function RoomForm({ initialRoom, onSubmit, onCancel, isSubmitting, errorMessage }) {
  const [name, setName] = useState(initialRoom?.name || '')
  const [location, setLocation] = useState(initialRoom?.location || '')
  const [description, setDescription] = useState(initialRoom?.description || '')
  const [features, setFeatures] = useState(initialRoom?.features || [])

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit({ name, location, description, features })
  }

  return (
    <form className="room-form auth-form" onSubmit={handleSubmit}>
      <label>
        Room name
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Conference Room A"
          required
        />
      </label>

      <label>
        Location
        <input
          type="text"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Floor 2, East Wing"
          required
        />
      </label>

      <label>
        Description
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe the room capacity, layout, and usage."
          rows={4}
          required
        />
      </label>

      <FeatureFields features={features} onChange={setFeatures} />

      {errorMessage && <p className="auth-message error">{errorMessage}</p>}

      <div className="popup-actions">
        <button type="button" className="nav-button secondary popup-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : initialRoom ? 'Update room' : 'Add room'}
        </button>
      </div>
    </form>
  )
}

export default RoomForm
