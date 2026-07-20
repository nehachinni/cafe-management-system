import './Cards.css';

export default function StatCard({ title, value, icon: Icon, color = 'primary', trend, subtitle }) {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-card-body">
        <div className="stat-card-info">
          <p className="stat-card-title">{title}</p>
          <h3 className="stat-card-value">{value}</h3>
          {subtitle && <p className="stat-card-subtitle">{subtitle}</p>}
          {trend !== undefined && (
            <span className={`stat-card-trend ${trend >= 0 ? 'up' : 'down'}`}>
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs last week
            </span>
          )}
        </div>
        <div className="stat-card-icon">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
