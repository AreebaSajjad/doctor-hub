import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { StatCard, PageHeader, EmptyState, StatusBadge, Modal, Alert, Spinner } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import API from '../api';

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments');
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ screenshot_url: '', transaction_ref: '', payment_method: 'Bank Transfer' });
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [apptRes, presRes, histRes] = await Promise.all([
        API.get('/appointments'),
        API.get('/history/prescriptions'),
        API.get('/history'),
      ]);
      setAppointments(apptRes.data.data.appointments || []);
      setPrescriptions(presRes.data.data.prescriptions || []);
      setHistory(histRes.data.data.history || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handlePayment = async () => {
    if (!paymentForm.screenshot_url) return;
    setSubmitting(true);
    try {
      await API.post('/payments', { appointment_id: paymentModal.id, amount: paymentModal.doctors?.consultation_fee || 0, ...paymentForm });
      setAlert({ type: 'success', message: 'Payment submitted! Awaiting verification.' });
      setPaymentModal(null);
      fetchAll();
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Payment failed.' });
    } finally { setSubmitting(false); }
  };

  const stats = [
    { icon: '📅', label: 'Total Appointments', value: appointments.length, color: 'var(--primary)' },
    { icon: '✅', label: 'Confirmed', value: appointments.filter(a => a.status === 'confirmed').length, color: 'var(--success)' },
    { icon: '💊', label: 'Prescriptions', value: prescriptions.length, color: 'var(--accent)' },
    { icon: '📋', label: 'Medical Records', value: history.length, color: 'var(--warning)' },
  ];

  const tabs = ['appointments', 'prescriptions', 'history'];

  return (
    <DashboardLayout title="Patient Dashboard">
      <PageHeader
        title={`Hello, ${user?.full_name?.split(' ')[0]} 👋`}
        subtitle="Manage your healthcare journey"
        action={<button className="btn btn-primary" onClick={() => navigate('/doctors')}>🔍 Find Doctors</button>}
      />

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="stats-grid mb-24">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-24" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="btn btn-ghost"
            style={{ borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent', borderRadius: 0, color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)', textTransform: 'capitalize', paddingBottom: 12 }}>
            {tab === 'appointments' ? '📅 Appointments' : tab === 'prescriptions' ? '💊 Prescriptions' : '📋 Medical History'}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center" style={{ padding: 60 }}><Spinner size="lg" /></div> : (
        <>
          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div>
              {appointments.length === 0 ? (
                <EmptyState icon="📅" title="No Appointments Yet"
                  description="Book your first appointment with a doctor"
                  action={<button className="btn btn-primary" onClick={() => navigate('/doctors')}>Find Doctors</button>} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {appointments.map(appt => (
                    <div key={appt.id} className="card">
                      <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
                        <div className="flex items-center gap-16">
                          <div style={{ width: 48, height: 48, background: 'var(--gradient-primary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👨‍⚕️</div>
                          <div>
                            <div className="font-semibold">{appt.doctors?.users?.full_name || 'Doctor'}</div>
                            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{appt.doctors?.specialty}</div>
                            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                              📅 {appt.appointment_date} at {appt.appointment_time}
                              {appt.clinics && ` • 🏥 ${appt.clinics.name}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-12">
                          <StatusBadge status={appt.status} />
                          {appt.status === 'pending_payment' && (
                            <button className="btn btn-primary btn-sm" onClick={() => setPaymentModal(appt)}>
                              💳 Pay Now
                            </button>
                          )}
                        </div>
                      </div>
                      {appt.reason && <p className="text-sm mt-8" style={{ color: 'var(--text-muted)' }}>Reason: {appt.reason}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Prescriptions Tab */}
          {activeTab === 'prescriptions' && (
            <div>
              {prescriptions.length === 0 ? (
                <EmptyState icon="💊" title="No Prescriptions" description="Your prescriptions will appear here after doctor visits" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {prescriptions.map(p => (
                    <div key={p.id} className="card">
                      <div className="flex items-center justify-between mb-12">
                        <div>
                          <div className="font-semibold">Dr. {p.doctors?.users?.full_name}</div>
                          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            {p.appointments?.appointment_date} • {p.doctors?.specialty}
                          </div>
                        </div>
                        <span className="badge badge-success">Active</span>
                      </div>
                      <div className="divider" />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(p.medications || []).map((med, i) => (
                          <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                            <span style={{ fontSize: 16 }}>💊</span>
                            <div>
                              <span className="font-semibold" style={{ fontSize: 14 }}>{med.name}</span>
                              <span className="text-sm" style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{med.dosage} — {med.frequency} for {med.duration}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {p.instructions && <p className="text-sm mt-12" style={{ color: 'var(--text-secondary)' }}>📝 {p.instructions}</p>}
                      {p.follow_up_date && <p className="text-sm mt-4" style={{ color: 'var(--warning)' }}>📅 Follow-up: {p.follow_up_date}</p>}
                      <p className="text-xs mt-8" style={{ color: 'var(--text-muted)' }}>⚠️ Prescriptions cannot be edited or deleted.</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Medical History Tab */}
          {activeTab === 'history' && (
            <div>
              {history.length === 0 ? (
                <EmptyState icon="📋" title="No Medical History" description="Your medical records will appear here after visits" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {history.map(h => (
                    <div key={h.id} className="card">
                      <div className="flex items-center justify-between mb-12">
                        <div>
                          <div className="font-semibold">Dr. {h.doctors?.users?.full_name}</div>
                          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{h.visit_date} • {h.doctors?.specialty}</div>
                        </div>
                        <span className="badge badge-muted">Permanent Record</span>
                      </div>
                      <div className="grid-2">
                        {h.diagnosis && <div><div className="text-xs font-semibold" style={{ color: 'var(--text-muted)', marginBottom: 4 }}>DIAGNOSIS</div><div style={{ fontSize: 14 }}>{h.diagnosis}</div></div>}
                        {h.symptoms && <div><div className="text-xs font-semibold" style={{ color: 'var(--text-muted)', marginBottom: 4 }}>SYMPTOMS</div><div style={{ fontSize: 14 }}>{h.symptoms}</div></div>}
                        {h.treatment_given && <div><div className="text-xs font-semibold" style={{ color: 'var(--text-muted)', marginBottom: 4 }}>TREATMENT</div><div style={{ fontSize: 14 }}>{h.treatment_given}</div></div>}
                        {h.notes && <div><div className="text-xs font-semibold" style={{ color: 'var(--text-muted)', marginBottom: 4 }}>NOTES</div><div style={{ fontSize: 14 }}>{h.notes}</div></div>}
                      </div>
                      <p className="text-xs mt-12" style={{ color: 'var(--text-muted)' }}>🔒 This record cannot be deleted or modified.</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Payment Modal */}
      <Modal isOpen={!!paymentModal} onClose={() => setPaymentModal(null)} title="Submit Payment"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setPaymentModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handlePayment} disabled={submitting || !paymentForm.screenshot_url}>
              {submitting ? <Spinner /> : 'Submit Payment'}
            </button>
          </>
        }>
        {paymentModal && (
          <div>
            <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
              <div className="font-semibold">Dr. {paymentModal.doctors?.users?.full_name}</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{paymentModal.appointment_date} at {paymentModal.appointment_time}</div>
              <div className="font-semibold mt-8" style={{ color: 'var(--primary)', fontSize: 20 }}>
                PKR {paymentModal.doctors?.consultation_fee?.toLocaleString()}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select className="form-select" value={paymentForm.payment_method} onChange={e => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}>
                <option>Bank Transfer</option>
                <option>JazzCash</option>
                <option>Easypaisa</option>
                <option>Credit Card</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Transaction Reference / ID</label>
              <input className="form-input" placeholder="e.g. TXN-123456"
                value={paymentForm.transaction_ref} onChange={e => setPaymentForm({ ...paymentForm, transaction_ref: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Screenshot URL / Description *</label>
              <input className="form-input" placeholder="Paste image URL or describe payment proof..."
                value={paymentForm.screenshot_url} onChange={e => setPaymentForm({ ...paymentForm, screenshot_url: e.target.value })} required />
              <span className="form-error" style={{ color: 'var(--text-muted)' }}>For testing: paste any image URL or description</span>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
