const supabase = require('../config/db');

// POST /api/payments — patient submits payment
const submitPayment = async (req, res) => {
  try {
    const { appointment_id, amount, screenshot_url, transaction_ref, payment_method } = req.body;

    // Verify appointment belongs to this patient
    const { data: appointment } = await supabase
      .from('appointments')
      .select('id, status, patient_id, patients(user_id), doctors(consultation_fee)')
      .eq('id', appointment_id)
      .single();

    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });
    if (appointment.patients.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    if (appointment.status !== 'pending_payment') {
      return res.status(400).json({ success: false, message: 'Payment already submitted or appointment not in pending state.' });
    }

    // Create payment record
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({ appointment_id, amount, screenshot_url, transaction_ref, payment_method: payment_method || 'Bank Transfer', status: 'Pending' })
      .select()
      .single();

    if (error) throw error;

    // Update appointment status
    await supabase.from('appointments').update({ status: 'payment_submitted' }).eq('id', appointment_id);

    return res.status(201).json({
      success: true,
      message: 'Payment submitted. Awaiting verification by assistant.',
      data: { payment }
    });
  } catch (err) {
    console.error('submitPayment error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PATCH /api/payments/:id/verify — assistant verifies or rejects
const verifyPayment = async (req, res) => {
  try {
    const { status, rejection_reason } = req.body;
    if (!['Verified', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Verified or Rejected.' });
    }

    const { data: payment } = await supabase
      .from('payments')
      .select('id, appointment_id, status')
      .eq('id', req.params.id)
      .single();

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
    if (payment.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Payment already processed.' });
    }

    // Update payment
    const { data: updatedPayment, error } = await supabase
      .from('payments')
      .update({ status, verified_by: req.user.id, verified_at: new Date().toISOString(), rejection_reason: rejection_reason || null })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Update appointment status based on payment decision
    const newAppointmentStatus = status === 'Verified' ? 'confirmed' : 'pending_payment';
    await supabase.from('appointments').update({ status: newAppointmentStatus }).eq('id', payment.appointment_id);

    return res.json({
      success: true,
      message: `Payment ${status.toLowerCase()}. Appointment ${status === 'Verified' ? 'confirmed.' : 'returned to pending.'}`,
      data: { payment: updatedPayment }
    });
  } catch (err) {
    console.error('verifyPayment error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/payments — get payments list
const getPayments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const role = req.user.role;

    let query = supabase
      .from('payments')
      .select(`
        *,
        appointments(
          id, appointment_date, appointment_time, status,
          doctors(id, users(full_name)),
          patients(id, users(full_name))
        )
      `, { count: 'exact' });

    if (status) query = query.eq('status', status);

    if (role === 'assistant') {
      const { data: assistant } = await supabase.from('assistants').select('doctor_id').eq('user_id', req.user.id).single();
      query = query.eq('appointments.doctor_id', assistant.doctor_id);
    } else if (role === 'patient') {
      const { data: patient } = await supabase.from('patients').select('id').eq('user_id', req.user.id).single();
      query = query.eq('appointments.patient_id', patient.id);
    }

    const { data: payments, error, count } = await query
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      data: { payments, pagination: { page: parseInt(page), limit: parseInt(limit), total: count } }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { submitPayment, verifyPayment, getPayments };
