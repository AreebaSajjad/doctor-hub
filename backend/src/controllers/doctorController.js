const supabase = require('../config/db');

// GET /api/doctors
const getDoctors = async (req, res) => {
  try {
    const { specialty, treatment_type, city, disease, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('doctors')
      .select(`
        id, specialty, treatment_type, experience_years, bio, consultation_fee,
        diseases_treated, available_days, slot_start_time, slot_end_time, is_available,
        users!inner(id, full_name, email, phone, gender, profile_picture),
        clinics(id, name, address, city, phone)
      `)
      .eq('is_available', true);

    if (specialty) query = query.ilike('specialty', `%${specialty}%`);
    if (treatment_type) query = query.eq('treatment_type', treatment_type);
    if (disease) query = query.contains('diseases_treated', [disease]);
    if (search) query = query.or(`specialty.ilike.%${search}%,bio.ilike.%${search}%`);
    if (city) query = query.eq('clinics.city', city);

    const { data: doctors, error, count } = await query
      .range(offset, offset + parseInt(limit) - 1)
      .order('experience_years', { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      data: { doctors, pagination: { page: parseInt(page), limit: parseInt(limit), total: count } }
    });
  } catch (err) {
    console.error('getDoctors error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching doctors.' });
  }
};

// GET /api/doctors/:id
const getDoctorById = async (req, res) => {
  try {
    const { data: doctor, error } = await supabase
      .from('doctors')
      .select(`
        *, users(id, full_name, email, phone, gender, profile_picture),
        clinics(id, name, address, city, phone, email)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    return res.json({ success: true, data: { doctor } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/doctors/profile (doctor updates own profile)
const updateDoctorProfile = async (req, res) => {
  try {
    const { specialty, treatment_type, experience_years, bio, consultation_fee,
      diseases_treated, available_days, slot_start_time, slot_end_time, clinic_id } = req.body;

    const { data: doctor } = await supabase
      .from('doctors').select('id').eq('user_id', req.user.id).single();

    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

    const { data, error } = await supabase
      .from('doctors')
      .update({ specialty, treatment_type, experience_years, bio, consultation_fee,
        diseases_treated, available_days, slot_start_time, slot_end_time, clinic_id })
      .eq('id', doctor.id)
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, message: 'Profile updated.', data: { doctor: data } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/doctors/my-patients (doctor views their patients)
const getMyPatients = async (req, res) => {
  try {
    const { data: doctor } = await supabase
      .from('doctors').select('id').eq('user_id', req.user.id).single();

    const { data: appointments } = await supabase
      .from('appointments')
      .select('patient_id, patients(id, user_id, blood_group, users(full_name, email, phone, gender))')
      .eq('doctor_id', doctor.id)
      .neq('status', 'cancelled');

    // Deduplicate patients
    const seen = new Set();
    const patients = appointments
      .map(a => a.patients)
      .filter(p => p && !seen.has(p.id) && seen.add(p.id));

    return res.json({ success: true, data: { patients } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getDoctors, getDoctorById, updateDoctorProfile, getMyPatients };
