import { AlertTriangle, Trash2, DollarSign, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  details?: { label: string; value: string | number }[];
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirm',
  details = []
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const icons = {
    danger: <Trash2 size={48} />,
    warning: <AlertTriangle size={48} />,
    info: <DollarSign size={48} />
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className={`confirmation-icon confirmation-icon-${type}`}>
          {icons[type]}
        </div>

        <h2 className="confirmation-title">{title}</h2>
        <p className="confirmation-message">{message}</p>

        {details.length > 0 && (
          <div className="confirmation-details">
            {details.map((detail, idx) => (
              <div key={idx} className="confirmation-detail-row">
                <span className="confirmation-detail-label">{detail.label}:</span>
                <span className="confirmation-detail-value">{detail.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="confirmation-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className={`btn btn-${type}`} onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
