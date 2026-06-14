import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Alert, Spinner } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import API from '../api';

export default function BookAppointmentPage() {
  const { doctorId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [form, setForm] = useState({ appointment_date: '', appointment_time: '', reason: '' });

  useEffect(() => {
    API.get(`/doctors/${doctorId}`)
      .then(res => setDoctor(res.data.data.doctor))
      .catch(() => navigate('/doctors'))
      .finally(() => setLoading(false));
  }, [doctorId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setSubmitting(true);
    try {
      await API.post('/appointments', { doctor_id: doctorId, ...form });
      setAlert({ type: 'success', message: 'Appointment booked! Please submit payment to confirm.' });
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Booking failed.' });
    } finally { setSubmitting(false); }
  };

  // Generate time slots
  const generateSlots = () => {
    if (!doctor?.slot_start_time || !doctor?.slot_end_time) return [];
    const slots = [];
    const [sh, sm] = doctor.slot_start_time.split(':').map(Number);
    const [eh, em] = doctor.slot_end_time.split(':').map(Number);
    const dur = doctor.slot_duration_minutes || 30;
    let curr = sh * 60 + sm;
    const end = eh * 60 + em;
    while (curr + dur <= end) {
      const h = Math.floor(curr / 60), m = curr % 60;
      const hh = String(h).padStart(2, '0'), mm = String(m).padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      slots.push({ value: `${hh}:${mm}`, label: `${h12}:${mm} ${ampm}` });
      curr += dur;
    }
    return slots;
  };

  if (loading) return <div className="loading-screen"><div className="spinner spinner-lg" /></div>;

  const color = { Allopathic: 'var(--primary)', Homeopathic: 'var(--success)', Herbal: 'var(--secondary)' }[doctor?.treatment_type] || 'var(--primary)';
  const slots = generateSlots();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <nav style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="container flex items-center justify-between" style={{ height: 64 }}>
          <Link to="/doctors" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            ← Back to Doctors
          </Link>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Book Appointment</span>
          <div />
        </div>
      </nav>

      <div className="container" style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }}>
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {/* Doctor Info Card */}
        {doctor && (
          <div className="card mb-24">
            <div className="flex items-center gap-20">
              <div style={{ width: 72, height: 72, background: `linear-gradient(135deg, ${color}, ${color}99)`, borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'white', fontWeight: 700, flexShrink: 0 }}>
                {doctor.users?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 4 }}>{doctor.users?.full_name}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>{doctor.specialty}</p>
                <div className="flex gap-12" style={{ flexWrap: 'wrap' }}>
                  <span className="badge" style={{ background: `${color}22`, color }}>{doctor.treatment_type}</span>
                  <span className="badge badge-muted">⭐ {doctor.experience_years} yrs exp</span>
                  {doctor.clinics && <span className="badge badge-muted">🏥 {doctor.clinics.name}, {doctor.clinics.city}</span>}
                </div>
              </div>
              <div className="text-center" style={{ flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--primary)' }}>PKR {doctor.consultation_fee?.toLocaleString()}</div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Consultation Fee</div>
              </div>
            </div>
            {doctor.available_days?.length > 0 && (
              <div className="flex gap-8 mt-16" style={{ flexWrap: 'wrap' }}>
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => {
                  const full = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' }[d];
                  const avail = doctor.available_days.includes(full);
                  return <span key={d} style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 500, background: avail ? `${color}22` : 'var(--bg-elevated)', color: avail ? color : 'var(--text-muted)' }}>{d}</span>;
                })}
              </div>
            )}
          </div>
        )}

        {/* Booking Form */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 20 }}>Select Appointment Details</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Appointment Date *</label>
                <input className="form-input" type="date" value={form.appointment_date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm({ ...form, appointment_date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Preferred Time *</label>
                {slots.length > 0 ? (
                  <select className="form-select" value={form.appointment_time} onChange={e => setForm({ ...form, appointment_time: e.target.value })} required>
                    <option value="">Select time slot</option>
                    {slots.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                ) : (
                  <input className="form-input" type="time" value={form.appointment_time} onChange={e => setForm({ ...form, appointment_time: e.target.value })} required />
                )}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Reason for Visit</label>
              <textarea className="form-textarea" placeholder="Describe your symptoms or reason for the appointment..."
                value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
            </div>

            <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
              <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>📋 Appointment Process</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['Book appointment', 'Submit payment screenshot', 'Assistant verifies payment', 'Appointment confirmed ✅'].map((step, i) => (
                  <div key={i} className="flex items-center gap-12 text-sm">
                    <span style={{ width: 22, height: 22, background: 'var(--gradient-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={submitting || !form.appointment_date || !form.appointment_time}>
              {submitting ? <Spinner /> : '📅 Book Appointment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
