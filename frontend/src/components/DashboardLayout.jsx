import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children, title }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next === 'light' ? 'light' : '');
  };

  return (
    <div className="page-wrapper">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99, display: 'none' }}
          className="sidebar-overlay"
        />
      )}

      <div className="dashboard-layout" style={{ flex: 1 }}>
        <header className="topbar">
          <div className="flex items-center gap-12">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 22, display: 'none' }}
              className="menu-btn"
            >
              ☰
            </button>
            <h2 className="topbar-title">{title}</h2>
          </div>
          <div className="topbar-actions">
            <button onClick={toggleTheme} className="btn btn-ghost btn-sm">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <div className="avatar">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        <main style={{ padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
