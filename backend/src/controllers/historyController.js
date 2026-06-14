const supabase = require('../config/db');

// GET /api/history
const getMedicalHistory = async (req, res) => {
  try {
    const { patient_id } = req.query;
    const role = req.user.role;

    let targetPatientId = patient_id;

    if (role === 'patient') {
      // Patients can only view their own history
      const { data: patient } = await supabase
        .from('patients').select('id').eq('user_id', req.user.id).single();
      targetPatientId = patient.id;
    } else if (role === 'doctor') {
      // Doctors can only view history of their patients
      if (!patient_id) return res.status(400).json({ success: false, message: 'patient_id is required.' });

      const { data: doctor } = await supabase
        .from('doctors').select('id').eq('user_id', req.user.id).single();

      const { data: hasAppointment } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', doctor.id)
        .eq('patient_id', patient_id)
        .neq('status', 'cancelled')
        .limit(1)
        .single();

      if (!hasAppointment) {
        return res.status(403).json({ success: false, message: 'You can only view history of your own patients.' });
      }
    }
    // admin/super_admin can see all

    const { data: history, error } = await supabase
      .from('medical_history')
      .select(`
        *,
        doctors(id, specialty, users(full_name, profile_picture)),
        patients(id, users(full_name)),
        appointments(id, appointment_date)
      `)
      .eq('patient_id', targetPatientId)
      .order('visit_date', { ascending: false });

    if (error) throw error;

    return res.json({ success: true, data: { history } });
  } catch (err) {
    console.error('getMedicalHistory error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/history — doctors only
const addMedicalHistory = async (req, res) => {
  try {
    const { patient_id, appointment_id, diagnosis, symptoms, treatment_given, notes, visit_date } = req.body;

    const { data: doctor } = await supabase
      .from('doctors').select('id').eq('user_id', req.user.id).single();

    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

    const { data: record, error } = await supabase
      .from('medical_history')
      .insert({ patient_id, doctor_id: doctor.id, appointment_id, diagnosis, symptoms, treatment_given, notes, visit_date: visit_date || new Date().toISOString().split('T')[0] })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: 'Medical record added.',
      data: { record }
    });
  } catch (err) {
    console.error('addMedicalHistory error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/prescriptions — doctors only
const addPrescription = async (req, res) => {
  try {
    const { appointment_id, medical_history_id, medications, instructions, follow_up_date } = req.body;

    const { data: doctor } = await supabase
      .from('doctors').select('id').eq('user_id', req.user.id).single();

    // Get patient from appointment
    const { data: appointment } = await supabase
      .from('appointments').select('patient_id, status').eq('id', appointment_id).single();

    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });
    if (appointment.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: 'Can only add prescriptions for confirmed appointments.' });
    }

    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .insert({
        appointment_id, medical_history_id,
        doctor_id: doctor.id,
        patient_id: appointment.patient_id,
        medications: medications || [],
        instructions, follow_up_date
      })
      .select()
      .single();

    if (error) throw error;

    // Update appointment status to completed
    await supabase.from('appointments').update({ status: 'completed' }).eq('id', appointment_id);

    return res.status(201).json({
      success: true,
      message: 'Prescription added successfully.',
      data: { prescription }
    });
  } catch (err) {
    console.error('addPrescription error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/prescriptions
const getPrescriptions = async (req, res) => {
  try {
    const { patient_id } = req.query;
    const role = req.user.role;
    let targetPatientId = patient_id;

    if (role === 'patient') {
      const { data: patient } = await supabase
        .from('patients').select('id').eq('user_id', req.user.id).single();
      targetPatientId = patient.id;
    }

    const { data: prescriptions, error } = await supabase
      .from('prescriptions')
      .select(`
        *,
        doctors(id, specialty, users(full_name, profile_picture)),
        patients(id, users(full_name)),
        appointments(id, appointment_date, appointment_time)
      `)
      .eq('patient_id', targetPatientId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({ success: true, data: { prescriptions } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getMedicalHistory, addMedicalHistory, addPrescription, getPrescriptions };
