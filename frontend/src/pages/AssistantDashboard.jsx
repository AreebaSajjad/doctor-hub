import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { StatCard, PageHeader, EmptyState, StatusBadge, Modal, Alert, Spinner } from '../components/UI';
import API from '../api';

export default function AssistantDashboard() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [filter, setFilter] = useState('Pending');

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await API.get('/payments');
      setPayments(res.data.data.payments || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleVerify = async (status) => {
    setSubmitting(true);
    try {
      await API.patch(`/payments/${selectedPayment.id}/verify`, {
        status,
        rejection_reason: status === 'Rejected' ? rejectionReason : undefined
      });
      setAlert({ type: 'success', message: `Payment ${status.toLowerCase()} successfully.` });
      setSelectedPayment(null);
      setRejectionReason('');
      fetchPayments();
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Action failed.' });
    } finally { setSubmitting(false); }
  };

  const filtered = payments.filter(p => filter === 'all' ? true : p.status === filter);
  const pending = payments.filter(p => p.status === 'Pending').length;
  const verified = payments.filter(p => p.status === 'Verified').length;
  const rejected = payments.filter(p => p.status === 'Rejected').length;

  return (
    <DashboardLayout title="Assistant Dashboard">
      <PageHeader title="Payment Verification 💳" subtitle="Review and verify patient payment submissions" />

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="stats-grid mb-24">
        <StatCard icon="⏳" label="Pending Review" value={pending} color="var(--warning)" />
        <StatCard icon="✅" label="Verified" value={verified} color="var(--success)" />
        <StatCard icon="❌" label="Rejected" value={rejected} color="var(--danger)" />
        <StatCard icon="📊" label="Total Payments" value={payments.length} color="var(--primary)" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-24" style={{ borderBottom: '1px solid var(--border)' }}>
        {[['Pending', '⏳ Pending'], ['Verified', '✅ Verified'], ['Rejected', '❌ Rejected'], ['all', '📊 All']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} className="btn btn-ghost"
            style={{ borderBottom: filter === val ? '2px solid var(--primary)' : '2px solid transparent', borderRadius: 0, color: filter === val ? 'var(--primary)' : 'var(--text-secondary)', paddingBottom: 12 }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center" style={{ padding: 60 }}><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="💳" title="No Payments Found" description={`No ${filter === 'all' ? '' : filter.toLowerCase()} payments to show`} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(payment => (
            <div key={payment.id} className="card">
              <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
                <div className="flex items-center gap-16">
                  <div style={{ width: 48, height: 48, background: payment.status === 'Verified' ? 'hsla(142,71%,45%,0.15)' : payment.status === 'Rejected' ? 'hsla(354,84%,57%,0.15)' : 'hsla(38,92%,50%,0.15)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    {payment.status === 'Verified' ? '✅' : payment.status === 'Rejected' ? '❌' : '⏳'}
                  </div>
                  <div>
                    <div className="font-semibold">{payment.appointments?.patients?.users?.full_name || 'Patient'}</div>
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Doctor: {payment.appointments?.doctors?.users?.full_name}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      📅 {payment.appointments?.appointment_date} • 💳 {payment.payment_method}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-12">
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--primary)', fontSize: 18 }}>PKR {payment.amount?.toLocaleString()}</div>
                    <StatusBadge status={payment.status} />
                  </div>
                  {payment.status === 'Pending' && (
                    <button className="btn btn-primary btn-sm" onClick={() => setSelectedPayment(payment)}>
                      Review
                    </button>
                  )}
                  {payment.status !== 'Pending' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setSelectedPayment(payment)}>
                      View Details
                    </button>
                  )}
                </div>
              </div>

              {payment.rejection_reason && (
                <div className="alert alert-danger mt-12" style={{ marginBottom: 0 }}>
                  Rejection Reason: {payment.rejection_reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment Review Modal */}
      <Modal isOpen={!!selectedPayment} onClose={() => { setSelectedPayment(null); setRejectionReason(''); }}
        title="Payment Review"
        footer={selectedPayment?.status === 'Pending' ? (
          <>
            <button className="btn btn-danger" onClick={() => handleVerify('Rejected')} disabled={submitting || !rejectionReason}>
              {submitting ? <Spinner /> : '❌ Reject'}
            </button>
            <button className="btn btn-success" onClick={() => handleVerify('Verified')} disabled={submitting}>
              {submitting ? <Spinner /> : '✅ Verify & Confirm'}
            </button>
          </>
        ) : (
          <button className="btn btn-secondary" onClick={() => setSelectedPayment(null)}>Close</button>
        )}>
        {selectedPayment && (
          <div>
            <div className="grid-2" style={{ gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 'var(--radius-md)' }}>
                <div className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: 4 }}>PATIENT</div>
                <div className="font-semibold">{selectedPayment.appointments?.patients?.users?.full_name}</div>
              </div>
              <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 'var(--radius-md)' }}>
                <div className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: 4 }}>AMOUNT</div>
                <div className="font-semibold" style={{ color: 'var(--primary)' }}>PKR {selectedPayment.amount?.toLocaleString()}</div>
              </div>
              <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 'var(--radius-md)' }}>
                <div className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: 4 }}>METHOD</div>
                <div className="font-semibold">{selectedPayment.payment_method}</div>
              </div>
              <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 'var(--radius-md)' }}>
                <div className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: 4 }}>TXN REF</div>
                <div className="font-semibold">{selectedPayment.transaction_ref || 'N/A'}</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
              <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>PAYMENT SCREENSHOT / PROOF</div>
              {selectedPayment.screenshot_url?.startsWith('http') ? (
                <img src={selectedPayment.screenshot_url} alt="Payment proof" style={{ width: '100%', borderRadius: 'var(--radius-sm)', maxHeight: 200, objectFit: 'contain' }} />
              ) : (
                <div style={{ padding: 12, background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', fontSize: 14, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  "{selectedPayment.screenshot_url}"
                </div>
              )}
            </div>

            {selectedPayment.status === 'Pending' && (
              <div className="form-group">
                <label className="form-label">Rejection Reason (required if rejecting)</label>
                <textarea className="form-textarea" placeholder="Explain why payment is being rejected..."
                  value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} style={{ minHeight: 80 }} />
              </div>
            )}

            {selectedPayment.status !== 'Pending' && (
              <div className={`alert alert-${selectedPayment.status === 'Verified' ? 'success' : 'danger'}`}>
                {selectedPayment.status === 'Verified' ? '✅ Payment was verified and appointment confirmed.' : `❌ Payment rejected: ${selectedPayment.rejection_reason}`}
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
