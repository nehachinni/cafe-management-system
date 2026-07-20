import { PackageSearch } from 'lucide-react';

export default function EmptyState({ title = 'No data found', description = 'There are no items to display.', action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '64px 24px', textAlign: 'center',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16, background: 'var(--border-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
      }}>
        <PackageSearch size={28} style={{ color: 'var(--text-muted)' }} />
      </div>
      <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{title}</h4>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: action ? 20 : 0 }}>{description}</p>
      {action}
    </div>
  );
}
