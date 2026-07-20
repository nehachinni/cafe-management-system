import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', message, duration = 3500 }) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast({ type: 'success', message: msg }),
    error: (msg) => addToast({ type: 'error', message: msg }),
    warning: (msg) => addToast({ type: 'warning', message: msg }),
    info: (msg) => addToast({ type: 'info', message: msg }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const ICONS = { success: '✓', error: '✕', warning: '⚠', info: 'i' };

const COLORS = {
  success: { bg: '#F0FDF4', border: '#86EFAC', text: '#15803D', icon: '#16A34A' },
  error:   { bg: '#FEF2F2', border: '#FCA5A5', text: '#991B1B', icon: '#DC2626' },
  warning: { bg: '#FFFBEB', border: '#FCD34D', text: '#92400E', icon: '#D97706' },
  info:    { bg: '#EFF6FF', border: '#93C5FD', text: '#1D4ED8', icon: '#2563EB' },
};

function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none',
    }}>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const c = COLORS[toast.type] || COLORS.info;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10,
      padding: '12px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      animation: 'toastIn 0.3s ease', pointerEvents: 'all',
      minWidth: 280, maxWidth: 380,
    }}>
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 22, height: 22, borderRadius: '50%', background: c.icon,
        color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1,
      }}>{ICONS[toast.type]}</span>
      <span style={{ flex: 1, fontSize: 14, color: c.text, lineHeight: 1.5, fontWeight: 500 }}>
        {toast.message}
      </span>
      <button onClick={() => onRemove(toast.id)} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: c.text, opacity: 0.6, fontSize: 18, padding: '0 0 0 4px', lineHeight: 1, flexShrink: 0,
      }}>×</button>
    </div>
  );
}
