import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { StatCard, PageHeader, EmptyState, Modal, Alert, Spinner } from '../components/UI';
import API from '../api';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics');
  const [clinicModal, setClinicModal] = useState(false);
  const [clinicForm, setClinicForm] = useState({ name: '', address: '', city: '', phone: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [analyticsRes, usersRes, clinicsRes] = await Promise.all([
        API.get('/admin/analytics'),
        API.get('/admin/users'),
        API.get('/admin/clinics'),
      ]);
      setAnalytics(analyticsRes.data.data);
      setUsers(usersRes.data.data.users || []);
      setClinics(clinicsRes.data.data.clinics || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const toggleUserActive = async (userId, currentStatus) => {
    try {
      await API.patch(`/admin/users/${userId}`, { is_active: !currentStatus });
      setAlert({ type: 'success', message: `User ${currentStatus ? 'deactivated' : 'activated'}.` });
      fetchAll();
    } catch { setAlert({ type: 'danger', message: 'Failed to update user.' }); }
  };

  const createClinic = async () => {
    setSubmitting(true);
    try {
      await API.post('/admin/clinics', clinicForm);
      setAlert({ type: 'success', message: 'Clinic created successfully.' });
      setClinicModal(false);
      setClinicForm({ name: '', address: '', city: '', phone: '', email: '' });
      fetchAll();
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to create clinic.' });
    } finally { setSubmitting(false); }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = !userSearch || u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleColors = { patient: 'var(--primary)', doctor: 'var(--success)', assistant: 'var(--accent)', admin: 'var(--warning)', super_admin: 'var(--danger)' };

  return (
    <DashboardLayout title="Admin Dashboard">
      <PageHeader title="Admin Panel 🛡️" subtitle="Manage users, clinics, and view system analytics" />

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Tabs */}
      <div className="flex gap-4 mb-24" style={{ borderBottom: '1px solid var(--border)' }}>
        {[['analytics', '📊 Analytics'], ['users', '👥 Users'], ['clinics', '🏥 Clinics']].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="btn btn-ghost"
            style={{ borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent', borderRadius: 0, color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)', paddingBottom: 12 }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center" style={{ padding: 60 }}><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Analytics Tab */}
          {activeTab === 'analytics' && analytics && (
            <div>
              {/* Summary Stats */}
              <div className="stats-grid mb-24">
                <StatCard icon="👥" label="Total Users" value={analytics.summary.totalUsers} color="var(--primary)" />
                <StatCard icon="👨‍⚕️" label="Doctors" value={analytics.summary.totalDoctors} color="var(--success)" />
                <StatCard icon="🤒" label="Patients" value={analytics.summary.totalPatients} color="var(--info)" />
                <StatCard icon="📅" label="Appointments" value={analytics.summary.totalAppointments} color="var(--accent)" />
                <StatCard icon="✅" label="Confirmed" value={analytics.summary.confirmedAppointments} color="var(--success)" />
                <StatCard icon="⏳" label="Pending Payments" value={analytics.summary.pendingPayments} color="var(--warning)" />
                <StatCard icon="🏥" label="Active Clinics" value={analytics.summary.totalClinics} color="var(--secondary)" />
              </div>

              <div className="grid-2" style={{ gap: 20 }}>
                {/* Appointment Status Chart */}
                <div className="card">
                  <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>📊 Appointments by Status</h3>
                  {analytics.appointmentsByStatus.map(item => {
                    const total = analytics.appointmentsByStatus.reduce((s, i) => s + (i.count || 0), 0) || 1;
                    const pct = Math.round(((item.count || 0) / total) * 100);
                    const colors = { pending_payment: 'var(--warning)', payment_submitted: 'var(--info)', confirmed: 'var(--success)', completed: 'var(--accent)', cancelled: 'var(--text-muted)' };
                    return (
                      <div key={item.status} style={{ marginBottom: 12 }}>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm" style={{ textTransform: 'capitalize' }}>{item.status?.replace('_', ' ')}</span>
                          <span className="text-sm font-semibold">{item.count || 0}</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: colors[item.status] || 'var(--primary)', borderRadius: 'var(--radius-full)', transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Treatment Type Distribution */}
                <div className="card">
                  <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>🩺 Doctors by Treatment Type</h3>
                  {analytics.doctorsByTreatmentType.map(item => {
                    const total = analytics.doctorsByTreatmentType.reduce((s, i) => s + (i.count || 0), 0) || 1;
                    const pct = Math.round(((item.count || 0) / total) * 100);
                    const colors = { Allopathic: 'var(--primary)', Homeopathic: 'var(--success)', Herbal: 'var(--secondary)' };
                    return (
                      <div key={item.type} style={{ marginBottom: 16 }}>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm">{item.type}</span>
                          <span className="text-sm font-semibold">{item.count || 0} ({pct}%)</span>
                        </div>
                        <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: colors[item.type] || 'var(--primary)', borderRadius: 'var(--radius-full)', transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="divider" />
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 15, marginBottom: 12 }}>Recent Appointments</h4>
                  {(analytics.recentAppointments || []).slice(0, 3).map(appt => (
                    <div key={appt.id} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <div className="text-sm">{appt.patients?.users?.full_name} → Dr. {appt.doctors?.users?.full_name}</div>
                      <span className={`badge badge-${appt.status === 'confirmed' ? 'success' : appt.status === 'cancelled' ? 'muted' : 'warning'}`} style={{ fontSize: 11 }}>{appt.status?.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="flex gap-12 mb-16" style={{ flexWrap: 'wrap' }}>
                <input className="form-input" placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
                <select className="form-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ minWidth: 160 }}>
                  <option value="">All Roles</option>
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="assistant">Assistant</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id}>
                        <td className="font-semibold">{u.full_name}</td>
                        <td className="text-sm" style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                        <td><span className="badge" style={{ background: `${roleColors[u.role]}22`, color: roleColors[u.role], textTransform: 'capitalize' }}>{u.role?.replace('_', ' ')}</span></td>
                        <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td className="text-sm" style={{ color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                        <td>
                          <button className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleUserActive(u.id, u.is_active)}>
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && <div className="text-center" style={{ padding: 40 }}><EmptyState icon="👥" title="No users found" /></div>}
              </div>
            </div>
          )}

          {/* Clinics Tab */}
          {activeTab === 'clinics' && (
            <div>
              <div className="flex justify-between items-center mb-16">
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>Active Clinics ({clinics.length})</h3>
                <button className="btn btn-primary" onClick={() => setClinicModal(true)}>+ Add Clinic</button>
              </div>
              {clinics.length === 0 ? (
                <EmptyState icon="🏥" title="No Clinics Yet" action={<button className="btn btn-primary" onClick={() => setClinicModal(true)}>Add First Clinic</button>} />
              ) : (
                <div className="grid-3" style={{ gap: 16 }}>
                  {clinics.map(clinic => (
                    <div key={clinic.id} className="card">
                      <div style={{ fontSize: 28, marginBottom: 12 }}>🏥</div>
                      <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: 4 }}>{clinic.name}</h4>
                      <p className="text-sm" style={{ color: 'var(--text-muted)', marginBottom: 4 }}>📍 {clinic.city}</p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>{clinic.address}</p>
                      {clinic.phone && <p className="text-sm">📞 {clinic.phone}</p>}
                      {clinic.email && <p className="text-sm">✉️ {clinic.email}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Create Clinic Modal */}
      <Modal isOpen={clinicModal} onClose={() => setClinicModal(false)} title="Add New Clinic"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setClinicModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={createClinic} disabled={submitting || !clinicForm.name || !clinicForm.city}>
              {submitting ? <Spinner /> : '🏥 Create Clinic'}
            </button>
          </>
        }>
        <div>
          <div className="form-group">
            <label className="form-label">Clinic Name *</label>
            <input className="form-input" placeholder="e.g. City Medical Center" value={clinicForm.name} onChange={e => setClinicForm({ ...clinicForm, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">City *</label>
            <input className="form-input" placeholder="e.g. Karachi" value={clinicForm.city} onChange={e => setClinicForm({ ...clinicForm, city: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-input" placeholder="Full address" value={clinicForm.address} onChange={e => setClinicForm({ ...clinicForm, address: e.target.value })} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" placeholder="+92-21-..." value={clinicForm.phone} onChange={e => setClinicForm({ ...clinicForm, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="clinic@email.com" value={clinicForm.email} onChange={e => setClinicForm({ ...clinicForm, email: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
