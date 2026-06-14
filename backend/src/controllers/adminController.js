const supabase = require('../config/db');

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20, is_active } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select('id, full_name, email, role, phone, gender, is_active, created_at', { count: 'exact' });

    if (role) query = query.eq('role', role);
    if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);

    // super_admin sees all; admin cannot see super_admin accounts
    if (req.user.role === 'admin') query = query.neq('role', 'super_admin');

    const { data: users, error, count } = await query
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      data: { users, pagination: { page: parseInt(page), limit: parseInt(limit), total: count } }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PATCH /api/admin/users/:id — toggle active, change role
const updateUser = async (req, res) => {
  try {
    const { is_active, role } = req.body;
    const updateData = {};
    if (is_active !== undefined) updateData.is_active = is_active;
    if (role) updateData.role = role;

    const { data: user, error } = await supabase
      .from('users').update(updateData).eq('id', req.params.id).select().single();

    if (error) throw error;

    return res.json({ success: true, message: 'User updated.', data: { user } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/admin/clinics
const createClinic = async (req, res) => {
  try {
    const { name, address, city, phone, email } = req.body;

    const { data: clinic, error } = await supabase
      .from('clinics')
      .insert({ name, address, city, phone, email, created_by: req.user.id })
      .select().single();

    if (error) throw error;

    return res.status(201).json({ success: true, message: 'Clinic created.', data: { clinic } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/admin/clinics
const getClinics = async (req, res) => {
  try {
    const { data: clinics, error } = await supabase
      .from('clinics').select('*').eq('is_active', true).order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ success: true, data: { clinics } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/admin/assign-doctor — assign doctor to clinic
const assignDoctorToClinic = async (req, res) => {
  try {
    const { doctor_id, clinic_id } = req.body;

    const { data, error } = await supabase
      .from('doctors').update({ clinic_id }).eq('id', doctor_id).select().single();

    if (error) throw error;

    return res.json({ success: true, message: 'Doctor assigned to clinic.', data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/admin/assign-assistant — assign assistant to doctor
const assignAssistant = async (req, res) => {
  try {
    const { assistant_user_id, doctor_id } = req.body;

    // Check user is assistant role
    const { data: user } = await supabase.from('users').select('role').eq('id', assistant_user_id).single();
    if (!user || user.role !== 'assistant') {
      return res.status(400).json({ success: false, message: 'User must have assistant role.' });
    }

    // Upsert assistant record
    const { data, error } = await supabase
      .from('assistants')
      .upsert({ user_id: assistant_user_id, doctor_id }, { onConflict: 'user_id' })
      .select().single();

    if (error) throw error;

    return res.json({ success: true, message: 'Assistant assigned to doctor.', data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/admin/analytics
const getAnalytics = async (req, res) => {
  try {
    const [
      { count: totalUsers },
      { count: totalDoctors },
      { count: totalPatients },
      { count: totalAppointments },
      { count: confirmedAppointments },
      { count: pendingPayments },
      { count: totalClinics },
      { data: recentAppointments }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('doctors').select('*', { count: 'exact', head: true }),
      supabase.from('patients').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
      supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
      supabase.from('clinics').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('appointments')
        .select('id, status, appointment_date, doctors(users(full_name)), patients(users(full_name))')
        .order('created_at', { ascending: false }).limit(5)
    ]);

    // Appointments by status
    const statusCounts = await Promise.all(
      ['pending_payment', 'payment_submitted', 'confirmed', 'completed', 'cancelled'].map(async (s) => {
        const { count } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', s);
        return { status: s, count };
      })
    );

    // Treatment type distribution
    const treatmentCounts = await Promise.all(
      ['Allopathic', 'Homeopathic', 'Herbal'].map(async (t) => {
        const { count } = await supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('treatment_type', t);
        return { type: t, count };
      })
    );

    return res.json({
      success: true,
      data: {
        summary: { totalUsers, totalDoctors, totalPatients, totalAppointments, confirmedAppointments, pendingPayments, totalClinics },
        appointmentsByStatus: statusCounts,
        doctorsByTreatmentType: treatmentCounts,
        recentAppointments
      }
    });
  } catch (err) {
    console.error('getAnalytics error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getUsers, updateUser, createClinic, getClinics, assignDoctorToClinic, assignAssistant, getAnalytics };
