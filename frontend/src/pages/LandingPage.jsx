import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  { icon: '🔍', title: 'Smart Doctor Search', desc: 'Filter by specialty, disease, treatment type, and location.' },
  { icon: '📅', title: 'Easy Booking', desc: 'Book appointments in seconds with real-time availability.' },
  { icon: '💊', title: 'Digital Prescriptions', desc: 'Receive and manage prescriptions digitally, securely.' },
  { icon: '📋', title: 'Medical History', desc: 'Permanent, secure health records you can always access.' },
  { icon: '✅', title: 'Payment Verification', desc: 'Transparent payment process with assistant verification.' },
  { icon: '🏥', title: 'Multiple Clinics', desc: 'Connect with doctors across multiple clinic locations.' },
];

const stats = [
  { value: '500+', label: 'Doctors' },
  { value: '10K+', label: 'Patients' },
  { value: '3', label: 'Treatment Types' },
  { value: '99%', label: 'Satisfaction' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [treatmentType, setTreatmentType] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (treatmentType) params.set('treatment_type', treatmentType);
    navigate(`/doctors?${params.toString()}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Navbar */}
      <nav style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="container flex items-center justify-between" style={{ height: 64 }}>
          <div className="flex items-center gap-12">
            <span style={{ fontSize: 24 }}>🏥</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>Doctor Hub</span>
          </div>
          <div className="flex items-center gap-12">
            <Link to="/doctors" className="btn btn-ghost btn-sm">Find Doctors</Link>
            {user ? (
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard')}>Dashboard</button>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="container hero-content" style={{ padding: '80px 24px' }}>
          <div style={{ maxWidth: 650 }}>
            <div className="badge badge-primary" style={{ marginBottom: 20, fontSize: 13 }}>
              🩺 Pakistan's Healthcare Platform
            </div>
            <h1 className="hero-title">
              Your Health,<br />
              <span className="gradient-text">Our Priority</span>
            </h1>
            <p className="hero-subtitle">
              Connect with Allopathic, Homeopathic, and Herbal doctors. 
              Book appointments, manage medical history, and get digital prescriptions — all in one place.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch}>
              <div className="search-bar" style={{ marginBottom: 16 }}>
                <input
                  className="form-input"
                  placeholder="Search by disease, specialty (e.g. Diabetes, Cardiologist)..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ fontSize: 15, flex: 1 }}
                />
                <select
                  className="form-select"
                  value={treatmentType}
                  onChange={e => setTreatmentType(e.target.value)}
                  style={{ width: 160, borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--bg-elevated)' }}
                >
                  <option value="">All Types</option>
                  <option value="Allopathic">Allopathic</option>
                  <option value="Homeopathic">Homeopathic</option>
                  <option value="Herbal">Herbal</option>
                </select>
                <button type="submit" className="btn btn-primary" style={{ borderRadius: 'var(--radius-lg)' }}>
                  🔍 Search
                </button>
              </div>
            </form>

            <div className="flex gap-12" style={{ flexWrap: 'wrap' }}>
              {['Heart Disease', 'Diabetes', 'Joint Pain', 'Allergies', 'Flu'].map(d => (
                <button key={d} className="btn btn-secondary btn-sm" onClick={() => navigate(`/doctors?search=${d}`)}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '40px 0' }}>
        <div className="container">
          <div className="grid-4">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
                <div className="text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div className="text-center mb-24">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, marginBottom: 12 }}>
              Everything You Need
            </h2>
            <p className="text-muted">A complete healthcare management platform</p>
          </div>
          <div className="grid-3">
            {features.map(f => (
              <div key={f.title} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>{f.title}</h3>
                <p className="text-muted" style={{ fontSize: 14 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Treatment Types */}
      <section style={{ padding: '60px 0', background: 'var(--bg-surface)' }}>
        <div className="container">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 32, textAlign: 'center' }}>
            Treatment Types
          </h2>
          <div className="grid-3">
            {[
              { type: 'Allopathic', icon: '💊', color: 'var(--primary)', desc: 'Evidence-based modern medicine with pharmaceutical treatments.' },
              { type: 'Homeopathic', icon: '🌿', color: 'var(--success)', desc: 'Natural remedies using highly diluted substances to trigger healing.' },
              { type: 'Herbal', icon: '🌱', color: 'var(--secondary)', desc: 'Traditional plant-based medicines for holistic healing.' },
            ].map(t => (
              <div key={t.type} className="card" onClick={() => navigate(`/doctors?treatment_type=${t.type}`)} style={{ cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{t.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', color: t.color, marginBottom: 8 }}>{t.type}</h3>
                <p className="text-muted" style={{ fontSize: 14 }}>{t.desc}</p>
                <button className="btn btn-secondary btn-sm mt-16">Browse Doctors →</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section style={{ padding: '80px 0', textAlign: 'center' }}>
          <div className="container">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, marginBottom: 16 }}>
              Ready to Get Started?
            </h2>
            <p className="text-muted" style={{ marginBottom: 32 }}>Join thousands of patients managing their health on Doctor Hub</p>
            <div className="flex justify-center gap-12">
              <Link to="/register" className="btn btn-primary btn-lg">Create Account</Link>
              <Link to="/doctors" className="btn btn-secondary btn-lg">Browse Doctors</Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', padding: '32px 0', textAlign: 'center' }}>
        <div className="container">
          <div className="flex items-center justify-center gap-12 mb-16">
            <span style={{ fontSize: 20 }}>🏥</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Doctor Hub</span>
          </div>
          <p className="text-muted text-sm">© 2024 Doctor Hub. Final Semester Project. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
