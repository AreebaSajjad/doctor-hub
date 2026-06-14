import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert, Spinner } from '../components/UI';

// ─── LOGIN PAGE ───────────────────────────────────────────────
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const user = await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your Doctor Hub account">
      <Alert type="danger" message={error} onClose={() => setError('')} />
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="form-input" type="email" placeholder="you@example.com"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="••••••••"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
        </div>
        <div className="flex justify-between items-center mb-24" style={{ fontSize: 13 }}>
          <span />
          <Link to="/forgot-password" style={{ color: 'var(--primary)', fontSize: 13 }}>Forgot password?</Link>
        </div>
        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
          {loading ? <Spinner /> : 'Sign In'}
        </button>
      </form>

      

      <p className="text-center mt-24 text-sm">
        Don't have an account? <Link to="/register">Create one</Link>
      </p>
    </AuthLayout>
  );
}

// ─── REGISTER PAGE ────────────────────────────────────────────
export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'patient', phone: '', specialty: '', treatment_type: 'Allopathic' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join Doctor Hub today">
      <Alert type="danger" message={error} onClose={() => setError('')} />

      {/* Role Toggle */}
      <div className="flex gap-8 mb-24" style={{ background: 'var(--bg-elevated)', padding: 6, borderRadius: 'var(--radius-lg)' }}>
        {[['patient', '🤒 Patient'], ['doctor', '👨‍⚕️ Doctor']].map(([r, label]) => (
          <button key={r} type="button"
            onClick={() => setForm({ ...form, role: r })}
            className={`btn ${form.role === r ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, fontSize: 14 }}>
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="Dr. Ahmed Khan"
              value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" placeholder="+92-300-1234567"
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="form-input" type="email" placeholder="you@example.com"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="Min 8 chars, uppercase, number"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
        </div>

        {form.role === 'doctor' && (
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Specialty</label>
              <input className="form-input" placeholder="e.g. Cardiologist"
                value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Treatment Type</label>
              <select className="form-select" value={form.treatment_type} onChange={e => setForm({ ...form, treatment_type: e.target.value })}>
                <option>Allopathic</option>
                <option>Homeopathic</option>
                <option>Herbal</option>
              </select>
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
          {loading ? <Spinner /> : `Create ${form.role === 'doctor' ? 'Doctor' : 'Patient'} Account`}
        </button>
      </form>
      <p className="text-center mt-24 text-sm">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

// ─── FORGOT PASSWORD PAGE ─────────────────────────────────────
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
      });
      const data = await res.json();
      setMessage(data.message);
    } catch { setError('Failed to send reset email.'); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="We'll send you a reset link">
      <Alert type="success" message={message} />
      <Alert type="danger" message={error} />
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="form-input" type="email" placeholder="your@email.com"
            value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? <Spinner /> : 'Send Reset Link'}
        </button>
      </form>
      <p className="text-center mt-24 text-sm"><Link to="/login">← Back to Login</Link></p>
    </AuthLayout>
  );
}

// ─── SHARED AUTH LAYOUT ───────────────────────────────────────
function AuthLayout({ title, subtitle, children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      {/* Top nav */}
      <nav style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/" className="flex items-center gap-12" style={{ color: 'inherit', textDecoration: 'none' }}>
          <span style={{ fontSize: 22 }}>🏥</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>Doctor Hub</span>
        </Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 460 }}>
          {/* Gradient header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, background: 'var(--gradient-primary)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 16px', boxShadow: 'var(--shadow-primary)' }}>🏥</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 8 }}>{title}</h1>
            <p className="text-muted">{subtitle}</p>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '32px', boxShadow: 'var(--shadow-lg)' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
