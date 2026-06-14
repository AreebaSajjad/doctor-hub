import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const navConfig = {
  patient: [
    { icon: '🏠', label: 'Dashboard', path: '/dashboard' },
    { icon: '🔍', label: 'Find Doctors', path: '/doctors' },
    { icon: '📅', label: 'My Appointments', path: '/appointments' },
    { icon: '💊', label: 'Prescriptions', path: '/prescriptions' },
    { icon: '📋', label: 'Medical History', path: '/history' },
    { icon: '👤', label: 'Profile', path: '/profile' },
  ],
  doctor: [
    { icon: '🏠', label: 'Dashboard', path: '/dashboard' },
    { icon: '📅', label: 'Appointments', path: '/appointments' },
    { icon: '👥', label: 'My Patients', path: '/patients' },
    { icon: '📋', label: 'Medical Records', path: '/records' },
    { icon: '🏥', label: 'My Profile', path: '/profile' },
  ],
  assistant: [
    { icon: '🏠', label: 'Dashboard', path: '/dashboard' },
    { icon: '💳', label: 'Verify Payments', path: '/payments' },
    { icon: '📅', label: 'Appointments', path: '/appointments' },
  ],
  admin: [
    { icon: '🏠', label: 'Dashboard', path: '/dashboard' },
    { icon: '👥', label: 'Manage Users', path: '/admin/users' },
    { icon: '🏥', label: 'Clinics', path: '/admin/clinics' },
    { icon: '📊', label: 'Analytics', path: '/admin/analytics' },
  ],
  super_admin: [
    { icon: '🏠', label: 'Dashboard', path: '/dashboard' },
    { icon: '👥', label: 'Manage Users', path: '/admin/users' },
    { icon: '🏥', label: 'Clinics', path: '/admin/clinics' },
    { icon: '📊', label: 'Analytics', path: '/admin/analytics' },
    { icon: '⚙️', label: 'System', path: '/admin/system' },
  ],
};

const roleColors = {
  patient: 'var(--primary)',
  doctor: 'var(--success)',
  assistant: 'var(--accent)',
  admin: 'var(--warning)',
  super_admin: 'var(--danger)',
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = navConfig[user?.role] || [];

  const handleNav = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🏥</div>
        <span className="sidebar-logo-text">Doctor Hub</span>
      </div>

      {/* User info */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-12">
          <div className="avatar" style={{ background: roleColors[user?.role] }}>
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="truncate font-semibold" style={{ fontSize: 14 }}>{user?.full_name}</div>
            <div style={{ fontSize: 12, color: roleColors[user?.role], fontWeight: 500, textTransform: 'capitalize' }}>
              {user?.role?.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Navigation</div>
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => handleNav(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
          <span className="nav-icon">🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
