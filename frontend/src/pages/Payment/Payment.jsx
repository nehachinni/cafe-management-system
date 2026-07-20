import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Banknote, Smartphone, CreditCard, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers.js';
import { useToast } from '../../hooks/useToast.jsx';
import { paymentAPI } from '../../services/api.js';
import './Payment.css';

const METHODS = [
  { id: 'Cash', icon: Banknote, label: 'Cash' },
  { id: 'UPI', icon: Smartphone, label: 'UPI' },
  { id: 'Card', icon: CreditCard, label: 'Card' },
];

export default function Payment() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const order = state?.order;
  const billNumber = state?.billNumber;
  const invoiceId = state?.invoiceId;
  const total = order?.total || 0;

  const [method, setMethod] = useState('Cash');
  const [received, setReceived] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const change = method === 'Cash' && received ? Math.max(0, Number(received) - total) : 0;
  const isValid = method !== 'Cash' || (Number(received) >= total);

  const handleConfirm = async () => {
    if (!isValid) { toast.error('Amount received is less than the total'); return; }
    if (!invoiceId) { toast.error('Missing invoice reference. Please go back to Billing.'); return; }
    setLoading(true);
    try {
      await paymentAPI.process({ invoiceId, amount: total, method });
      setSuccess(true);
      toast.success('Payment confirmed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="payment-success animate-fade-in">
        <div className="success-icon">
          <CheckCircle size={56} />
        </div>
        <h2>Payment Successful!</h2>
        <p>Bill <strong>{billNumber}</strong> has been paid via {method}</p>
        <p className="success-amount">{formatCurrency(total)}</p>
        {method === 'Cash' && change > 0 && (
          <div className="change-display">
            <span>Change to return:</span>
            <strong>{formatCurrency(change)}</strong>
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate('/orders')}>New Bill</button>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>Dashboard</button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="animate-fade-in">
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>No order to process. Go to Orders first.</p>
          <button className="btn btn-primary" onClick={() => navigate('/orders')}>Go to Orders</button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-layout animate-fade-in">
      <div className="page-header">
        <div><h1>Payment</h1><p>Process payment for {billNumber}</p></div>
      </div>

      <div className="payment-grid">
        {/* Payment Methods */}
        <div className="card">
          <div className="card-header"><h3 className="card-title">Payment Method</h3></div>
          <div className="card-body">
            <div className="payment-methods">
              {METHODS.map(({ id, icon: Icon, label }) => (
                <button key={id} className={`payment-method-btn${method === id ? ' active' : ''}`} onClick={() => setMethod(id)}>
                  <Icon size={24} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {method === 'Cash' && (
              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Amount Received (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder={String(total)}
                    value={received}
                    onChange={(e) => setReceived(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="cash-calc">
                  <div className="cash-calc-row">
                    <span>Total Amount</span>
                    <strong>{formatCurrency(total)}</strong>
                  </div>
                  <div className="cash-calc-row">
                    <span>Amount Received</span>
                    <strong>{received ? formatCurrency(Number(received)) : '—'}</strong>
                  </div>
                  <div className="divider" />
                  <div className={`cash-calc-row change ${change > 0 ? 'positive' : ''}`}>
                    <span>Change Amount</span>
                    <strong>{formatCurrency(change)}</strong>
                  </div>
                </div>
              </div>
            )}

            {method === 'UPI' && (
              <div style={{ marginTop: 24, textAlign: 'center', padding: 24, background: 'var(--bg)', borderRadius: 14, border: '1px dashed var(--border)' }}>
                <Smartphone size={48} style={{ color: 'var(--primary)', marginBottom: 12 }} />
                <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>UPI Payment</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Ask customer to scan QR or enter UPI ID</p>
              </div>
            )}

            {method === 'Card' && (
              <div style={{ marginTop: 24, textAlign: 'center', padding: 24, background: 'var(--bg)', borderRadius: 14, border: '1px dashed var(--border)' }}>
                <CreditCard size={48} style={{ color: 'var(--primary)', marginBottom: 12 }} />
                <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Card Payment</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Swipe or tap customer's card on the terminal</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><h3 className="card-title">Order Summary</h3></div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {order.items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span>{item.name} × {item.quantity}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="divider" />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span>GST</span><span>{formatCurrency(order.gst)}</span>
                </div>
                {order.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--success)' }}>
                    <span>Discount</span><span>- {formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="divider" />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 700 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--primary-dark)' }}>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ justifyContent: 'center' }}
            onClick={handleConfirm}
            disabled={loading || (method === 'Cash' && !received)}
          >
            {loading ? 'Processing...' : `Confirm ${method} Payment`}
          </button>
          <button className="btn btn-secondary btn-lg" style={{ justifyContent: 'center' }} onClick={() => navigate('/billing', { state: { order } })}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
