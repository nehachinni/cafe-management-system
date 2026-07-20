import './Loader.css';

export function Spinner({ size = 24, color = 'var(--primary)' }) {
  return (
    <div className="spinner" style={{ width: size, height: size, borderTopColor: color }} />
  );
}

export function PageLoader() {
  return (
    <div className="page-loader">
      <div className="page-loader-inner">
        <Spinner size={36} />
        <p>Loading...</p>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="skeleton-table">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-row">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="skeleton-cell" style={{ width: j === 0 ? '40%' : '15%' }} />
          ))}
        </div>
      ))}
    </div>
  );
}
