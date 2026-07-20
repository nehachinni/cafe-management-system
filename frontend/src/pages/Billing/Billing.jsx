import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Printer, Download, Trash2, CreditCard } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/helpers.js';
import { useToast } from '../../hooks/useToast.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { billingAPI, settingsAPI } from '../../services/api.js';
import { PageLoader } from '../../components/Loader/Loader.jsx';
import './Billing.css';

export default function Billing() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const billRef = useRef(null);

  const order = state?.order || null;
  const now = new Date().toISOString();

  const [settings, setSettings] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!order) { setLoading(false); return; }
    (async () => {
      try {
        const settingsData = await settingsAPI.get();
        setSettings(settingsData);

        try {
          const invRes = await billingAPI.generate(order.orderId);
          setInvoice({ id: invRes.id, invoiceNumber: invRes.invoice_number });
        } catch (err) {
          // Invoice may already exist if user navigated back from Payment
          if (err.response?.status === 409) {
            toast.info('Invoice already generated for this order');
          } else {
            toast.error('Failed to generate invoice');
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [order?.orderId]);

  const handlePrint = () => window.print();

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!order || !settings) return;
    setDownloading(true);
    try {
      const { jsPDF } = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm');
      const doc = new jsPDF({ unit: 'pt', format: 'a5' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginX = 36;
      let y = 48;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(settings.cafeName || 'Cafe', pageWidth / 2, y, { align: 'center' });
      y += 18;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      [settings.address, `Phone: ${settings.phone}`, `GST No: ${settings.gstNumber}`].forEach((line) => {
        if (!line) return;
        doc.text(line, pageWidth / 2, y, { align: 'center' });
        y += 12;
      });

      y += 10;
      doc.setDrawColor(200);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 16;

      doc.setFontSize(9);
      const metaRows = [
        ['Bill No', billNumber],
        ['Date', formatDateTime(now)],
        ['Cashier', user?.name || 'Admin'],
        ['Type', order.type],
      ];
      if (order.table) metaRows.push(['Table', order.table]);
      metaRows.forEach(([label, val]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, marginX, y);
        doc.setFont('helvetica', 'normal');
        doc.text(String(val), marginX + 70, y);
        y += 13;
      });

      y += 6;
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 16;

      doc.setFont('helvetica', 'bold');
      doc.text('Item', marginX, y);
      doc.text('Qty', pageWidth - 200, y);
      doc.text('Rate', pageWidth - 150, y);
      doc.text('Amount', pageWidth - 80, y);
      y += 10;
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 14;

      doc.setFont('helvetica', 'normal');
      order.items.forEach((item) => {
        const lineTotal = item.price * item.quantity;
        const lineGst = (lineTotal * item.gstPercent) / 100;
        doc.text(item.name, marginX, y, { maxWidth: pageWidth - 280 });
        doc.text(String(item.quantity), pageWidth - 200, y);
        doc.text(formatCurrency(item.price), pageWidth - 150, y);
        doc.text(formatCurrency(lineTotal + lineGst), pageWidth - 80, y);
        y += 16;
      });

      y += 6;
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 16;

      const totalsRows = [
        ['Subtotal', formatCurrency(order.subtotal)],
        ['Total GST', formatCurrency(order.gst)],
      ];
      if (order.discount > 0) totalsRows.push(['Discount', `- ${formatCurrency(order.discount)}`]);
      totalsRows.forEach(([label, val]) => {
        doc.text(label, pageWidth - 180, y);
        doc.text(val, pageWidth - 80, y);
        y += 13;
      });

      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Grand Total', pageWidth - 180, y);
      doc.text(formatCurrency(order.total), pageWidth - 80, y);
      y += 24;

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text(`Thank you for visiting ${settings.cafeName}!`, pageWidth / 2, y, { align: 'center' });

      doc.save(`${billNumber}.pdf`);
      toast.success('Bill downloaded as PDF');
    } catch (err) {
      toast.error('Failed to generate PDF. Check your internet connection and try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleClearOrder = () => {
    navigate('/orders');
    toast.info('Order cleared');
  };

  const handlePayment = () => {
    if (!order || !invoice) return;
    navigate('/payment', { state: { order, billNumber: invoice.invoiceNumber, invoiceId: invoice.id } });
  };

  if (!order) {
    return (
      <div className="animate-fade-in">
        <div className="page-header"><div><h1>Billing</h1><p>No active order</p></div></div>
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>No order selected. Create an order first.</p>
          <button className="btn btn-primary" onClick={() => navigate('/orders')}>Go to Orders</button>
        </div>
      </div>
    );
  }

  if (loading || !settings) return <PageLoader />;

  const billNumber = invoice?.invoiceNumber || order.orderNumber;

  return (
    <div className="billing-layout animate-fade-in">
      {/* Bill Preview */}
      <div className="bill-preview card" ref={billRef}>
        <div className="bill-header">
          <div className="bill-cafe-info">
            <h2 className="bill-cafe-name">{settings.cafeName}</h2>
            <p>{settings.address}</p>
            <p>Phone: {settings.phone}</p>
            <p>GST No: {settings.gstNumber}</p>
          </div>
          <div className="bill-meta">
            <div className="bill-meta-row"><span>Bill No</span><strong>{billNumber}</strong></div>
            <div className="bill-meta-row"><span>Date</span><strong>{formatDateTime(now)}</strong></div>
            <div className="bill-meta-row"><span>Cashier</span><strong>{user?.name || 'Admin'}</strong></div>
            <div className="bill-meta-row"><span>Type</span><strong>{order.type}</strong></div>
            {order.table && <div className="bill-meta-row"><span>Table</span><strong>{order.table}</strong></div>}
          </div>
        </div>

        <div className="divider" />

        <table className="bill-items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Item</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>GST</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => {
              const lineTotal = item.price * item.quantity;
              const lineGst = (lineTotal * item.gstPercent) / 100;
              return (
                <tr key={item.id}>
                  <td>{i + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>{item.gstPercent}% ({formatCurrency(lineGst)})</td>
                  <td><strong>{formatCurrency(lineTotal + lineGst)}</strong></td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="divider" />

        <div className="bill-totals">
          <div className="bill-total-row"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
          <div className="bill-total-row"><span>Total GST</span><span>{formatCurrency(order.gst)}</span></div>
          {order.discount > 0 && <div className="bill-total-row discount"><span>Discount</span><span>- {formatCurrency(order.discount)}</span></div>}
          <div className="divider" style={{ margin: '8px 0' }} />
          <div className="bill-total-row grand"><span>Grand Total</span><span>{formatCurrency(order.total)}</span></div>
        </div>

        <div className="bill-footer">
          <p>Thank you for visiting {settings.cafeName}!</p>
          <p>Please visit again</p>
        </div>
      </div>

      {/* Actions Panel */}
      <div className="billing-actions">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Bill Actions</h3></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="btn btn-primary btn-lg w-full" style={{ justifyContent: 'center' }} onClick={handlePayment} disabled={!invoice}>
              <CreditCard size={18} /> Proceed to Payment
            </button>
            <button className="btn btn-secondary w-full" style={{ justifyContent: 'center' }} onClick={handlePrint}>
              <Printer size={16} /> Print Bill
            </button>
            <button className="btn btn-secondary w-full" style={{ justifyContent: 'center' }} onClick={handleDownload} disabled={downloading}>
              <Download size={16} /> {downloading ? 'Generating...' : 'Download PDF'}
            </button>
            <button className="btn btn-danger w-full" style={{ justifyContent: 'center' }} onClick={handleClearOrder}>
              <Trash2 size={16} /> Clear Order
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Summary</h3></div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Items</span>
                <span>{order.items.reduce((s, i) => s + i.quantity, 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--text-secondary)' }}>GST</span>
                <span>{formatCurrency(order.gst)}</span>
              </div>
              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--success)' }}>
                  <span>Discount</span>
                  <span>- {formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ color: 'var(--primary-dark)' }}>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
