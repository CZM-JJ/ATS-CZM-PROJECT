const Toast = ({ type = 'success', message, onClose }) => {
  if (!message) return null

  const icon = type === 'error' ? '⚠' : '✓'

  return (
    <div className={`um-toast um-toast-${type}`} onClick={onClose} role="alert">
      <span>{icon}</span> {message}
      <button type="button" aria-label="Dismiss toast">✕</button>
    </div>
  )
}

export default Toast
