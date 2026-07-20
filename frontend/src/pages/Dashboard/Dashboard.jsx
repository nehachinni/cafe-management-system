import { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, UtensilsCrossed, LayoutGrid, DollarSign, Package } from 'lucide-react';
import StatCard from '../../components/Cards/StatCard.jsx';
import { SalesAreaChart, MonthlyRevenueChart } from '../../components/Charts/Charts.jsx';
import { PageLoader } from '../../components/Loader/Loader.jsx';
import { dashboardAPI } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.jsx';
import { formatCurrency, formatDateTime } from '../../utils/helpers.js';
import './Dashboard.css';

const STATUS_BADGE = {
  completed: 'badge-success',
  preparing: 'badge-warning',
  pending: 'badge-info',
  ready: 'badge-info',
  served: 'badge-info',
  cancelled: 'badge-error',
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [salesChart, setSalesChart] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [statsRes, weeklyRes, monthlyRes, ordersRes, bestRes] = await Promise.all([
          dashboardAPI.stats(),
          dashboardAPI.weeklySales(),
          dashboardAPI.monthlyRevenue(),
          dashboardAPI.recentOrders(5),
          dashboardAPI.bestSelling(5),
        ]);
        if (cancelled) return;
        setStats(statsRes);
        setSalesChart(weeklyRes);
        setMonthlyRevenue(monthlyRes);
        setRecentOrders(ordersRes);
        setBestSelling(bestRes);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading || !stats) return <PageLoader />;

  return (
    <div className="animate-fade-in">
      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard title="Today's Sales" value={formatCurrency(stats.todaySales)} icon={TrendingUp} color="primary" />
        <StatCard title="Monthly Sales" value={formatCurrency(stats.monthlySales)} icon={DollarSign} color="success" />
        <StatCard title="Today's Orders" value={stats.todayOrders} icon={ShoppingBag} color="info" />
        <StatCard title="Menu Items" value={stats.totalMenuItems} icon={UtensilsCrossed} color="warning" />
        <StatCard title="Available Tables" value={stats.availableTables} icon={LayoutGrid} color="success" subtitle={`${stats.occupiedTables} occupied • ${stats.reservedTables} reserved`} />
        <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={Package} color="neutral" />
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        <div className="card chart-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Weekly Sales Overview</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Sales &amp; orders for the past 7 days</p>
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: 16 }}>
            <SalesAreaChart data={salesChart} />
          </div>
        </div>

        <div className="card chart-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Monthly Revenue</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Revenue trend for this year</p>
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: 16 }}>
            <MonthlyRevenueChart data={monthlyRevenue} />
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="dashboard-bottom">
        {/* Recent Orders */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Orders</h3>
            <a href="/orders" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500 }}>View all</a>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bill No</th>
                  <th>Type</th>
                  <th>Table</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No orders yet</td></tr>
                ) : recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td><span style={{ fontWeight: 600 }}>{order.billNo}</span></td>
                    <td>{order.type}</td>
                    <td>{order.table}</td>
                    <td><strong>{formatCurrency(order.amount)}</strong></td>
                    <td><span className={`badge ${STATUS_BADGE[order.status] || 'badge-neutral'}`}>{order.status}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{formatDateTime(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Best Selling */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Best Selling Items</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>This month</span>
          </div>
          <div className="card-body" style={{ padding: '8px 0' }}>
            {bestSelling.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No sales yet this month</p>
            ) : bestSelling.map((item, i) => (
              <div key={item.name} className="best-item">
                <div className="best-item-rank">{i + 1}</div>
                <div className="best-item-info">
                  <span className="best-item-name">{item.name}</span>
                  <span className="best-item-qty">{item.quantity} units sold</span>
                </div>
                <div className="best-item-revenue">{formatCurrency(item.revenue)}</div>
                <div className="best-item-bar-wrap">
                  <div
                    className="best-item-bar"
                    style={{ width: `${(item.quantity / bestSelling[0].quantity) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
