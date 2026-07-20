import { AlertTriangle } from 'lucide-react';
import Modal from '../Modal/Modal.jsx';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title = 'Confirm Action', message, confirmLabel = 'Confirm', variant = 'danger', loading = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className={`btn btn-${variant}`} onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <AlertTriangle size={20} style={{ color: 'var(--warning)' }} />
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</p>
      </div>
    </Modal>
  );
}
