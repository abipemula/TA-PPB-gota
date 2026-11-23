import { AlertTriangle } from 'lucide-react'

export default function ConfirmModal({
  open,
  isOpen,
  title,
  message,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
  onClose,
}) {
  const isVisible = open ?? isOpen ?? false
  const handleCancel = onCancel || onClose
  const actualConfirmText = confirmLabel || confirmText || 'Konfirmasi'
  const actualCancelText = cancelLabel || cancelText || 'Batal'

  if (!isVisible) return null

  return (
    <div className="modal-backdrop" onClick={handleCancel}>
      <div
        className="modal-box"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-msg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-icon">
          <AlertTriangle
            size={28}
            stroke={danger ? '#ef4444' : 'var(--accent)'}
          />
        </div>
        <h3 id="confirm-title" className="modal-title display">
          {title}
        </h3>
        <p id="confirm-msg" className="modal-msg">
          {message}
        </p>
        <div className="modal-actions">
          <button
            type="button"
            className="modal-btn modal-btn--cancel"
            onClick={handleCancel}
            disabled={loading}
          >
            {actualCancelText}
          </button>
          <button
            type="button"
            className={`modal-btn ${
              danger ? 'modal-btn--danger' : 'modal-btn--confirm'
            }`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Memproses…' : actualConfirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
