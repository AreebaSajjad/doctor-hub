const supabase = require('../config/db');

// POST /api/appointments
const createAppointment = async (req, res) => {
  try {
    const { doctor_id, appointment_date, appointment_time, reason } = req.body;

    // Get patient profile
    const { data: patient } = await supabase
      .from('patients').select('id').eq('user_id', req.user.id).single();

    if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found.' });

    // Check doctor exists
    const { data: doctor } = await supabase
      .from('doctors').select('id, clinic_id, is_available').eq('id', doctor_id).single();

    if (!doctor || !doctor.is_available) {
      return res.status(404).json({ success: false, message: 'Doctor not found or unavailable.' });
    }

    // Check no duplicate booking
    const { data: existing } = await supabase
      .from('appointments')
      .select('id')
      .eq('patient_id', patient.id)
      .eq('doctor_id', doctor_id)
      .eq('appointment_date', appointment_date)
      .eq('appointment_time', appointment_time)
      .neq('status', 'cancelled')
      .single();

    if (existing) {
      return res.status(409).json({ success: false, message: 'You already have an appointment at this time.' });
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: patient.id,
        doctor_id: doctor_id,
        clinic_id: doctor.clinic_id,
        appointment_date,
        appointment_time,
        reason,
        status: 'pending_payment'
      })
      .select(`
        *, 
        doctors(id, specialty, users(full_name)),
        patients(id, users(full_name)),
        clinics(name, city)
      `)
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: 'Appointment booked. Please submit payment to confirm.',
      data: { appointment }
    });
  } catch (err) {
    console.error('createAppointment error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/appointments
const getAppointments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const role = req.user.role;

    let query = supabase
      .from('appointments')
      .select(`
        *,
        doctors(id, specialty, treatment_type, users(full_name, phone, profile_picture)),
        patients(id, blood_group, users(full_name, phone, gender, profile_picture)),
        clinics(name, city, address),
        payments(id, status, amount, screenshot_url)
      `, { count: 'exact' });

    if (status) query = query.eq('status', status);

    if (role === 'patient') {
      const { data: patient } = await supabase.from('patients').select('id').eq('user_id', req.user.id).single();
      query = query.eq('patient_id', patient.id);
    } else if (role === 'doctor') {
      const { data: doctor } = await supabase.from('doctors').select('id').eq('user_id', req.user.id).single();
      query = query.eq('doctor_id', doctor.id);
    } else if (role === 'assistant') {
      const { data: assistant } = await supabase.from('assistants').select('doctor_id').eq('user_id', req.user.id).single();
      query = query.eq('doctor_id', assistant.doctor_id);
    }
    // admin/super_admin sees all

    const { data: appointments, error, count } = await query
      .range(offset, offset + parseInt(limit) - 1)
      .order('appointment_date', { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      data: { appointments, pagination: { page: parseInt(page), limit: parseInt(limit), total: count } }
    });
  } catch (err) {
    console.error('getAppointments error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/appointments/:id
const getAppointmentById = async (req, res) => {
  try {
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        doctors(id, specialty, treatment_type, bio, users(full_name, phone, email, profile_picture)),
        patients(id, blood_group, allergies, chronic_conditions, users(full_name, phone, email, gender)),
        clinics(name, city, address, phone),
        payments(*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    return res.json({ success: true, data: { appointment } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PATCH /api/appointments/:id/cancel
const cancelAppointment = async (req, res) => {
  try {
    const { data: appointment } = await supabase
      .from('appointments').select('id, patient_id, status, patients(user_id)').eq('id', req.params.id).single();

    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });

    if (appointment.patients.user_id !== req.user.id && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this appointment.' });
    }

    if (['confirmed', 'completed'].includes(appointment.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel a confirmed or completed appointment.' });
    }

    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', req.params.id);

    return res.json({ success: true, message: 'Appointment cancelled.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { createAppointment, getAppointments, getAppointmentById, cancelAppointment };
