import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(
    (p) => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)
  );

  const renderPages = [];
  let prev = null;
  for (const p of visiblePages) {
    if (prev !== null && p - prev > 1) renderPages.push('...');
    renderPages.push(p);
    prev = p;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', padding: '16px 0 0' }}>
      <button
        className="btn btn-icon btn-sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft size={14} />
      </button>

      {renderPages.map((item, i) =>
        item === '...' ? (
          <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: 14 }}>...</span>
        ) : (
          <button
            key={item}
            className={`btn btn-sm ${item === currentPage ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onPageChange(item)}
            style={{ minWidth: 34, padding: '6px 8px' }}
          >
            {item}
          </button>
        )
      )}

      <button
        className="btn btn-icon btn-sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
