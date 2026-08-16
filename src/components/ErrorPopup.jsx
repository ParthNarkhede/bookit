function ErrorPopup({ message, onClose }) {
  if (!message) {
    return null
  }

  return (
    <div className="popup-overlay" role="presentation" onClick={onClose}>
      <div
        className="popup-card"
        role="alertdialog"
        aria-labelledby="error-popup-title"
        aria-describedby="error-popup-message"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="error-popup-title">Login failed</h3>
        <p id="error-popup-message">{message}</p>
        <button type="button" className="primary-button" onClick={onClose}>
          Back to login
        </button>
      </div>
    </div>
  )
}

export default ErrorPopup
