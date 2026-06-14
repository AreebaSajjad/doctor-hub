const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/db');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { full_name, email, password, role, phone, gender, specialty, treatment_type } = req.body;

    // Check if email exists
    const { data: existingUser } = await supabase
      .from('users').select('id').eq('email', email).single();

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({ full_name, email, password_hash, role: role || 'patient', phone, gender })
      .select('id, full_name, email, role')
      .single();

    if (userError) throw userError;

    // Create role-specific profile
    if (role === 'doctor') {
      await supabase.from('doctors').insert({
        user_id: newUser.id,
        specialty: specialty || 'General Physician',
        treatment_type: treatment_type || 'Allopathic'
      });
    } else {
      await supabase.from('patients').insert({ user_id: newUser.id });
    }

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: { user: newUser, token }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, full_name, email, password_hash, role, is_active, phone, profile_picture')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    const { password_hash, ...userWithoutPassword } = user;

    return res.json({
      success: true,
      message: 'Login successful.',
      data: { user: userWithoutPassword, token }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, full_name, email, role, phone, gender, date_of_birth, profile_picture, created_at')
      .eq('id', req.user.id)
      .single();

    // Get role-specific profile
    let profile = null;
    if (req.user.role === 'doctor') {
      const { data } = await supabase.from('doctors')
        .select('*, clinics(name, city, address)').eq('user_id', req.user.id).single();
      profile = data;
    } else if (req.user.role === 'patient') {
      const { data } = await supabase.from('patients').eq('user_id', req.user.id).select('*').single();
      profile = data;
    } else if (req.user.role === 'assistant') {
      const { data } = await supabase.from('assistants')
        .select('*, doctors(*, users(full_name))').eq('user_id', req.user.id).single();
      profile = data;
    }

    return res.json({ success: true, data: { user, profile } });
  } catch (err) {
    console.error('GetMe error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const { data: user } = await supabase.from('users').select('id, email').eq('email', email).single();

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate reset token (valid 1 hour)
    const resetToken = jwt.sign({ id: user.id, purpose: 'password_reset' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // In production: send email. For now, return token in response for testing
    return res.json({
      success: true,
      message: 'Password reset token generated.',
      data: { reset_token: resetToken, note: 'In production, this would be emailed.' }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, new_password } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({ success: false, message: 'Invalid reset token.' });
    }

    const password_hash = await bcrypt.hash(new_password, 10);
    await supabase.from('users').update({ password_hash }).eq('id', decoded.id);

    return res.json({ success: true, message: 'Password reset successful. Please login.' });
  } catch (err) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };
