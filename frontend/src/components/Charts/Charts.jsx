import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label, prefix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #E4E9F0', borderRadius: 10,
      padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    }}>
      <p style={{ fontSize: 12, color: '#5A6B7E', marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ fontSize: 14, fontWeight: 600, color: p.color }}>
          {p.name}: {prefix}{typeof p.value === 'number' ? p.value.toLocaleString('en-IN') : p.value}
        </p>
      ))}
    </div>
  );
};

export function SalesAreaChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#D4721E" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#D4721E" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F3F8" />
        <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9AACBE' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#9AACBE' }} axisLine={false} tickLine={false} width={60}
          tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip prefix="₹" />} />
        <Legend wrapperStyle={{ fontSize: 13 }} />
        <Area type="monotone" dataKey="sales" name="Sales (₹)" stroke="#D4721E" strokeWidth={2} fill="url(#salesGrad)" dot={{ r: 4, fill: '#D4721E' }} activeDot={{ r: 6 }} />
        <Area type="monotone" dataKey="orders" name="Orders" stroke="#2563EB" strokeWidth={2} fill="url(#ordersGrad)" dot={{ r: 4, fill: '#2563EB' }} activeDot={{ r: 6 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MonthlyRevenueChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={32}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F3F8" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9AACBE' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#9AACBE' }} axisLine={false} tickLine={false} width={70}
          tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip prefix="₹" />} />
        <Bar dataKey="revenue" name="Revenue (₹)" fill="#D4721E" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
