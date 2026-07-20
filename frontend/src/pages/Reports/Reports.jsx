import { useState, useMemo, useEffect } from 'react';
import { Download, Search, Calendar } from 'lucide-react';
import './Reports.css';
import { reportAPI } from '../../services/api.js';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/helpers.js';
import { SalesAreaChart } from '../../components/Charts/Charts.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { PageLoader } from '../../components/Loader/Loader.jsx';
import { useToast } from '../../hooks/useToast.jsx';

const TABS = ['Daily Sales', 'Monthly Sales', 'Best Selling', 'Bill History'];
const PER_PAGE = 8;

export default function Reports() {
  const [activeTab, setActiveTab] = useState('Daily Sales');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const toast = useToast();

  const [dailySales, setDailySales] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [billHistory, setBillHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const params = {};
        if (dateFrom) params.start_date = dateFrom;
        if (dateTo) params.end_date = dateTo;
        if (search) params.search = search;

        if (activeTab === 'Daily Sales') {
          const data = await reportAPI.daily(params);
          if (!cancelled) setDailySales(data);
        } else if (activeTab === 'Monthly Sales') {
          const data = await reportAPI.monthly();
          if (!cancelled) setMonthlySales(data);
        } else if (activeTab === 'Best Selling') {
          const data = await reportAPI.bestSelling({ limit: 10 });
          if (!cancelled) setBestSelling(data);
        } else if (activeTab === 'Bill History') {
          const data = await reportAPI.billHistory(params);
          if (!cancelled) setBillHistory(data);
        }
      } catch {
        toast.error('Failed to load report data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeTab, dateFrom, dateTo, search]);

  const filteredBills = billHistory;
  const totalPages = Math.ceil(filteredBills.length / PER_PAGE);
  const paginatedBills = filteredBills.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleExport = () => {
    const dateSuffix = new Date().toISOString().slice(0, 10);
    let rows = [];
    let filename = 'report';

    if (activeTab === 'Daily Sales') {
      rows = dailySales.map((d) => ({ Day: d.day, Orders: d.orders, Sales: d.sales, 'Avg Order': d.avgOrder }));
      filename = `daily-sales-${dateSuffix}`;
    } else if (activeTab === 'Monthly Sales') {
      rows = monthlySales.map((m) => ({ Month: m.month, Orders: m.orders, Revenue: m.revenue }));
      filename = `monthly-sales-${dateSuffix}`;
    } else if (activeTab === 'Best Selling') {
      rows = bestSelling.map((b, i) => ({ Rank: i + 1, Product: b.name, 'Units Sold': b.quantity, Revenue: b.revenue }));
      filename = `best-selling-${dateSuffix}`;
    } else if (activeTab === 'Bill History') {
      rows = filteredBills.map((b) => ({
        'Bill No': b.id, Date: b.date, Cashier: b.cashier, Table: b.table,
        Items: b.items, Subtotal: b.subtotal, GST: b.gst, Discount: b.discount,
        Total: b.total, 'Payment Method': b.paymentMethod, Status: b.status,
      }));
      filename = `bill-history-${dateSuffix}`;
    }

    if (rows.length === 0) {
      toast.error('No data to export for this tab');
      return;
    }
    exportToCSV(filename, rows);
    toast.success('Report exported successfully');
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1>Reports &amp; Analytics</h1><p>Sales, revenue, and performance insights</p></div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={handleExport}><Download size={15} /> Export</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="report-tabs">
        {TABS.map((tab) => (
          <button key={tab} className={`report-tab${activeTab === tab ? ' active' : ''}`} onClick={() => { setActiveTab(tab); setPage(1); }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Date Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '16px 24px' }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-bar">
              <Search size={15} className="search-icon" />
              <input className="form-control" style={{ paddingLeft: 36 }} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={15} style={{ color: 'var(--text-muted)' }} />
              <input type="date" className="form-control" style={{ width: 155 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>to</span>
              <input type="date" className="form-control" style={{ width: 155 }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            {(dateFrom || dateTo || search) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); }}>Clear</button>
            )}
          </div>
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <>
          {/* Content */}
          {activeTab === 'Daily Sales' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card">
                <div className="card-header"><h3 className="card-title">Daily Sales – This Week</h3></div>
                <div className="card-body"><SalesAreaChart data={dailySales} /></div>
              </div>
              <div className="card">
                <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                  <table className="data-table">
                    <thead><tr><th>Day</th><th>Orders</th><th>Sales</th><th>Avg Order</th></tr></thead>
                    <tbody>
                      {dailySales.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No sales data yet</td></tr>
                      ) : dailySales.map((d, i) => (
                        <tr key={`${d.day}-${i}`}>
                          <td style={{ fontWeight: 500 }}>{d.day}</td>
                          <td>{d.orders}</td>
                          <td><strong>{formatCurrency(d.sales)}</strong></td>
                          <td>{formatCurrency(d.avgOrder)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Monthly Sales' && (
            <div className="report-summary-grid">
              {monthlySales.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', padding: 20 }}>No monthly sales data yet</p>
              ) : monthlySales.map((m) => (
                <div key={m.month} className="card report-month-card">
                  <div className="card-body" style={{ padding: 20 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{m.month}</p>
                    <h3 style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency(m.revenue)}</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{m.orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Best Selling' && (
            <div className="card">
              <div className="card-header"><h3 className="card-title">Best Selling Products – This Month</h3></div>
              <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                <table className="data-table">
                  <thead><tr><th>Rank</th><th>Product</th><th>Units Sold</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {bestSelling.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No sales yet</td></tr>
                    ) : bestSelling.map((item, i) => (
                      <tr key={item.name}>
                        <td>
                          <span style={{ width: 28, height: 28, background: 'var(--primary-100)', color: 'var(--primary-dark)', borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                            {i + 1}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td><strong>{formatCurrency(item.revenue)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'Bill History' && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Bill History</h3>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{filteredBills.length} records</span>
              </div>
              <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                <table className="data-table">
                  <thead><tr><th>Bill No</th><th>Date</th><th>Cashier</th><th>Table</th><th>Items</th><th>GST</th><th>Discount</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
                  <tbody>
                    {paginatedBills.length === 0 ? (
                      <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No bills found</td></tr>
                    ) : paginatedBills.map((bill) => (
                      <tr key={bill.id}>
                        <td style={{ fontWeight: 600 }}>{bill.id}</td>
                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatDate(bill.date)}</td>
                        <td>{bill.cashier}</td>
                        <td>{bill.table}</td>
                        <td>{bill.items}</td>
                        <td>{formatCurrency(bill.gst)}</td>
                        <td>{bill.discount > 0 ? formatCurrency(bill.discount) : '—'}</td>
                        <td><strong>{formatCurrency(bill.total)}</strong></td>
                        <td><span className="badge badge-neutral">{bill.paymentMethod}</span></td>
                        <td><span className={`badge ${bill.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{bill.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '0 24px 16px' }}>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
