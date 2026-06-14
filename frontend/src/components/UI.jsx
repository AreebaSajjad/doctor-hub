// Modal Component
export function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-in">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// Alert Component
export function Alert({ type = 'info', message, onClose }) {
  if (!message) return null;
  const icons = { success: '✅', danger: '❌', warning: '⚠️', info: 'ℹ️' };
  return (
    <div className={`alert alert-${type}`}>
      <span>{icons[type]}</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 16 }}>✕</button>}
    </div>
  );
}

// Loading Spinner
export function Spinner({ size = 'sm', fullPage = false }) {
  const cls = size === 'lg' ? 'spinner spinner-lg' : 'spinner';
  if (fullPage) {
    return (
      <div className="loading-screen">
        <div className={cls} />
        <p className="text-muted">Loading...</p>
      </div>
    );
  }
  return <div className={cls} />;
}

// Status Badge
export function StatusBadge({ status }) {
  const map = {
    pending_payment: { label: 'Pending Payment', type: 'warning' },
    payment_submitted: { label: 'Payment Submitted', type: 'info' },
    confirmed: { label: 'Confirmed', type: 'success' },
    completed: { label: 'Completed', type: 'accent' },
    cancelled: { label: 'Cancelled', type: 'muted' },
    Pending: { label: 'Pending', type: 'warning' },
    Verified: { label: 'Verified', type: 'success' },
    Rejected: { label: 'Rejected', type: 'danger' },
  };
  const { label, type } = map[status] || { label: status, type: 'muted' };
  return <span className={`badge badge-${type}`}>{label}</span>;
}

// Empty State
export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="text-center" style={{ padding: '60px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>{title}</h3>
      {description && <p className="text-muted" style={{ marginBottom: 20 }}>{description}</p>}
      {action}
    </div>
  );
}

// Stat Card
export function StatCard({ icon, label, value, color = 'var(--primary)', change }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}22`, color }}>{icon}</div>
      <div className="stat-value" style={{ color }}>{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
      {change && <div className={`stat-change ${change > 0 ? 'up' : 'down'}`}>{change > 0 ? '↑' : '↓'} {Math.abs(change)}%</div>}
    </div>
  );
}

// Page Header
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-24" style={{ flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>{title}</h1>
        {subtitle && <p className="text-muted mt-8">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
