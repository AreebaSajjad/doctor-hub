import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { StatCard, PageHeader, EmptyState, StatusBadge, Modal, Alert, Spinner } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import API from '../api';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments');
  const [prescriptionModal, setPrescriptionModal] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [prescForm, setPrescForm] = useState({
    medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
    instructions: '', follow_up_date: ''
  });
  const [histForm, setHistForm] = useState({ diagnosis: '', symptoms: '', treatment_given: '', notes: '' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [apptRes, patRes] = await Promise.all([
        API.get('/appointments'),
        API.get('/doctors/my-patients'),
      ]);
      setAppointments(apptRes.data.data.appointments || []);
      setPatients(patRes.data.data.patients || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const addMedication = () => setPrescForm({ ...prescForm, medications: [...prescForm.medications, { name: '', dosage: '', frequency: '', duration: '' }] });
  const updateMed = (i, field, val) => {
    const meds = [...prescForm.medications];
    meds[i][field] = val;
    setPrescForm({ ...prescForm, medications: meds });
  };
  const removeMed = (i) => setPrescForm({ ...prescForm, medications: prescForm.medications.filter((_, idx) => idx !== i) });

  const submitPrescription = async () => {
    setSubmitting(true);
    try {
      await API.post('/history/prescriptions', {
        appointment_id: prescriptionModal.id,
        medications: prescForm.medications.filter(m => m.name),
        instructions: prescForm.instructions,
        follow_up_date: prescForm.follow_up_date || null
      });
      setAlert({ type: 'success', message: 'Prescription added successfully.' });
      setPrescriptionModal(null);
      fetchAll();
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to add prescription.' });
    } finally { setSubmitting(false); }
  };

  const submitHistory = async () => {
    setSubmitting(true);
    try {
      await API.post('/history', {
        patient_id: historyModal.patient_id,
        appointment_id: historyModal.id,
        ...histForm
      });
      setAlert({ type: 'success', message: 'Medical record added.' });
      setHistoryModal(null);
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to add record.' });
    } finally { setSubmitting(false); }
  };

  const stats = [
    { icon: '📅', label: 'Total Appointments', value: appointments.length, color: 'var(--primary)' },
    { icon: '✅', label: 'Confirmed', value: appointments.filter(a => a.status === 'confirmed').length, color: 'var(--success)' },
    { icon: '⏳', label: 'Pending Payment', value: appointments.filter(a => a.status === 'payment_submitted').length, color: 'var(--warning)' },
    { icon: '👥', label: 'My Patients', value: patients.length, color: 'var(--accent)' },
  ];

  return (
    <DashboardLayout title="Doctor Dashboard">
      <PageHeader
        title={`Dr. ${user?.full_name?.split(' ').slice(1).join(' ') || user?.full_name} 👨‍⚕️`}
        subtitle="Manage your appointments and patient records"
      />

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="stats-grid mb-24">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-24" style={{ borderBottom: '1px solid var(--border)' }}>
        {[['appointments', '📅 Appointments'], ['patients', '👥 My Patients']].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="btn btn-ghost"
            style={{ borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent', borderRadius: 0, color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)', paddingBottom: 12 }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center" style={{ padding: 60 }}><Spinner size="lg" /></div> : (
        <>
          {/* Appointments */}
          {activeTab === 'appointments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {appointments.length === 0 ? (
                <EmptyState icon="📅" title="No Appointments" description="Your appointments will appear here" />
              ) : appointments.map(appt => (
                <div key={appt.id} className="card">
                  <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
                    <div className="flex items-center gap-16">
                      <div style={{ width: 48, height: 48, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🤒</div>
                      <div>
                        <div className="font-semibold">{appt.patients?.users?.full_name || 'Patient'}</div>
                        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          📅 {appt.appointment_date} at {appt.appointment_time}
                        </div>
                        {appt.reason && <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Reason: {appt.reason}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-8" style={{ flexWrap: 'wrap' }}>
                      <StatusBadge status={appt.status} />
                      {appt.status === 'confirmed' && (
                        <>
                          <button className="btn btn-secondary btn-sm" onClick={() => setHistoryModal(appt)}>
                            📋 Add Record
                          </button>
                          <button className="btn btn-primary btn-sm" onClick={() => { setPrescriptionModal(appt); setPrescForm({ medications: [{ name: '', dosage: '', frequency: '', duration: '' }], instructions: '', follow_up_date: '' }); }}>
                            💊 Prescribe
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Patients */}
          {activeTab === 'patients' && (
            <div className="grid-3" style={{ gap: 16 }}>
              {patients.length === 0 ? (
                <EmptyState icon="👥" title="No Patients Yet" description="Patients will appear after confirmed appointments" />
              ) : patients.map(p => (
                <div key={p.id} className="card">
                  <div className="flex items-center gap-12 mb-12">
                    <div className="avatar" style={{ width: 44, height: 44, fontSize: 18 }}>{p.users?.full_name?.charAt(0)}</div>
                    <div>
                      <div className="font-semibold">{p.users?.full_name}</div>
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{p.users?.gender}</div>
                    </div>
                  </div>
                  {p.blood_group && <div className="text-sm mb-4">🩸 Blood Group: <strong>{p.blood_group}</strong></div>}
                  {p.allergies && <div className="text-sm mb-4">⚠️ Allergies: {p.allergies}</div>}
                  {p.chronic_conditions && <div className="text-sm">🏥 Conditions: {p.chronic_conditions}</div>}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Prescription Modal */}
      <Modal isOpen={!!prescriptionModal} onClose={() => setPrescriptionModal(null)} title="Write Prescription"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setPrescriptionModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitPrescription} disabled={submitting}>
              {submitting ? <Spinner /> : '💊 Save Prescription'}
            </button>
          </>
        }>
        {prescriptionModal && (
          <div>
            <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 'var(--radius-md)', marginBottom: 16, fontSize: 14 }}>
              Patient: <strong>{prescriptionModal.patients?.users?.full_name}</strong> • {prescriptionModal.appointment_date}
            </div>
            <div className="font-semibold mb-12">Medications</div>
            {prescForm.medications.map((med, i) => (
              <div key={i} style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 'var(--radius-md)', marginBottom: 8 }}>
                <div className="grid-2" style={{ gap: 8, marginBottom: 8 }}>
                  <input className="form-input" placeholder="Medicine name" value={med.name} onChange={e => updateMed(i, 'name', e.target.value)} />
                  <input className="form-input" placeholder="Dosage (e.g. 500mg)" value={med.dosage} onChange={e => updateMed(i, 'dosage', e.target.value)} />
                  <input className="form-input" placeholder="Frequency (e.g. Twice daily)" value={med.frequency} onChange={e => updateMed(i, 'frequency', e.target.value)} />
                  <input className="form-input" placeholder="Duration (e.g. 7 days)" value={med.duration} onChange={e => updateMed(i, 'duration', e.target.value)} />
                </div>
                {prescForm.medications.length > 1 && (
                  <button className="btn btn-danger btn-sm" onClick={() => removeMed(i)}>Remove</button>
                )}
              </div>
            ))}
            <button className="btn btn-secondary btn-sm mb-16" onClick={addMedication}>+ Add Medication</button>
            <div className="form-group">
              <label className="form-label">Instructions</label>
              <textarea className="form-textarea" placeholder="Special instructions for patient..." value={prescForm.instructions} onChange={e => setPrescForm({ ...prescForm, instructions: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Follow-up Date</label>
              <input className="form-input" type="date" value={prescForm.follow_up_date} onChange={e => setPrescForm({ ...prescForm, follow_up_date: e.target.value })} />
            </div>
          </div>
        )}
      </Modal>

      {/* Medical History Modal */}
      <Modal isOpen={!!historyModal} onClose={() => setHistoryModal(null)} title="Add Medical Record"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setHistoryModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitHistory} disabled={submitting || !histForm.diagnosis}>
              {submitting ? <Spinner /> : '📋 Save Record'}
            </button>
          </>
        }>
        {historyModal && (
          <div>
            <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 'var(--radius-md)', marginBottom: 16, fontSize: 14 }}>
              Patient: <strong>{historyModal.patients?.users?.full_name}</strong>
              <p className="text-xs mt-4" style={{ color: 'var(--warning)' }}>⚠️ This record will be permanent and cannot be deleted.</p>
            </div>
            <div className="form-group">
              <label className="form-label">Diagnosis *</label>
              <input className="form-input" placeholder="e.g. Type 2 Diabetes" value={histForm.diagnosis} onChange={e => setHistForm({ ...histForm, diagnosis: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Symptoms</label>
              <input className="form-input" placeholder="e.g. Fatigue, frequent urination" value={histForm.symptoms} onChange={e => setHistForm({ ...histForm, symptoms: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Treatment Given</label>
              <input className="form-input" placeholder="e.g. Metformin 500mg" value={histForm.treatment_given} onChange={e => setHistForm({ ...histForm, treatment_given: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" placeholder="Additional notes..." value={histForm.notes} onChange={e => setHistForm({ ...histForm, notes: e.target.value })} />
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
