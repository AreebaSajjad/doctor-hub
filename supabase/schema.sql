-- ============================================================
-- DOCTOR HUB - Complete Database Schema
-- Paste this entire file into Supabase SQL Editor and run it
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'assistant', 'admin', 'super_admin');
CREATE TYPE treatment_type AS ENUM ('Allopathic', 'Homeopathic', 'Herbal');
CREATE TYPE appointment_status AS ENUM ('pending_payment', 'payment_submitted', 'confirmed', 'cancelled', 'completed');
CREATE TYPE payment_status AS ENUM ('Pending', 'Verified', 'Rejected');
CREATE TYPE gender_type AS ENUM ('Male', 'Female', 'Other');

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'patient',
    phone VARCHAR(20),
    gender gender_type,
    date_of_birth DATE,
    profile_picture TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: clinics
-- ============================================================
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(150),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: doctors
-- ============================================================
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
    specialty VARCHAR(100) NOT NULL,
    treatment_type treatment_type NOT NULL DEFAULT 'Allopathic',
    experience_years INTEGER DEFAULT 0,
    bio TEXT,
    consultation_fee DECIMAL(10,2) DEFAULT 0,
    diseases_treated TEXT[], -- array of diseases
    available_days TEXT[], -- e.g. ['Monday','Wednesday','Friday']
    slot_start_time TIME,
    slot_end_time TIME,
    slot_duration_minutes INTEGER DEFAULT 30,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: patients
-- ============================================================
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blood_group VARCHAR(5),
    allergies TEXT,
    chronic_conditions TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: assistants
-- ============================================================
CREATE TABLE assistants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: appointments
-- ============================================================
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status appointment_status DEFAULT 'pending_payment',
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: payments
-- ============================================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID UNIQUE NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Bank Transfer',
    screenshot_url TEXT, -- mock: base64 or image URL
    transaction_ref VARCHAR(100),
    status payment_status DEFAULT 'Pending',
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: medical_history
-- ============================================================
CREATE TABLE medical_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    diagnosis TEXT NOT NULL,
    symptoms TEXT,
    treatment_given TEXT,
    notes TEXT,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
    -- NO updated_at intentionally - records are immutable
);

-- ============================================================
-- TABLE: prescriptions
-- ============================================================
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE RESTRICT,
    medical_history_id UUID REFERENCES medical_history(id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    medications JSONB NOT NULL DEFAULT '[]',
    -- Format: [{"name":"Med","dosage":"500mg","frequency":"Twice daily","duration":"7 days"}]
    instructions TEXT,
    follow_up_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
    -- NO updated_at intentionally - prescriptions are immutable
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_doctors_specialty ON doctors(specialty);
CREATE INDEX idx_doctors_treatment_type ON doctors(treatment_type);
CREATE INDEX idx_doctors_clinic_id ON doctors(clinic_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_medical_history_patient_id ON medical_history(patient_id);
CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);

-- ============================================================
-- TRIGGERS: Prevent DELETE on medical_history and prescriptions
-- ============================================================
CREATE OR REPLACE FUNCTION prevent_medical_history_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Medical history records cannot be deleted. This is a permanent record.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_delete_medical_history
    BEFORE DELETE ON medical_history
    FOR EACH ROW EXECUTE FUNCTION prevent_medical_history_delete();

CREATE OR REPLACE FUNCTION prevent_prescription_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Prescriptions cannot be deleted. This is a permanent record.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_delete_prescription
    BEFORE DELETE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION prevent_prescription_delete();

CREATE OR REPLACE FUNCTION prevent_prescription_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Prescriptions cannot be edited after creation.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_update_prescription
    BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION prevent_prescription_update();

-- ============================================================
-- TRIGGER: Auto-update updated_at timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- Sample Clinics
INSERT INTO clinics (id, name, address, city, phone, email) VALUES
('11111111-1111-1111-1111-111111111111', 'City Medical Center', '123 Main Street, Block A', 'Karachi', '+92-21-1234567', 'info@citymedical.pk'),
('22222222-2222-2222-2222-222222222222', 'Shifa International', '45 Blue Area', 'Islamabad', '+92-51-9876543', 'contact@shifa.pk'),
('33333333-3333-3333-3333-333333333333', 'Lahore General Hospital', '78 Mall Road', 'Lahore', '+92-42-5555555', 'info@lgh.pk');

-- Sample Users (passwords are bcrypt of "Password123!")
INSERT INTO users (id, full_name, email, password_hash, role, phone, gender) VALUES
-- Super Admin
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Super Admin', 'superadmin@doctorhub.pk', '$2b$10$rQnQZ3e8V7K9mN2pL4xHOeWvYkJdFgMsTuIbCzXwPqRsNhAeKlYdG', 'super_admin', '+92-300-0000001', 'Male'),
-- Admin
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Admin User', 'admin@doctorhub.pk', '$2b$10$rQnQZ3e8V7K9mN2pL4xHOeWvYkJdFgMsTuIbCzXwPqRsNhAeKlYdG', 'admin', '+92-300-0000002', 'Male'),
-- Doctors
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Dr. Ahmed Khan', 'ahmed.khan@doctorhub.pk', '$2b$10$rQnQZ3e8V7K9mN2pL4xHOeWvYkJdFgMsTuIbCzXwPqRsNhAeKlYdG', 'doctor', '+92-300-1111111', 'Male'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Dr. Fatima Malik', 'fatima.malik@doctorhub.pk', '$2b$10$rQnQZ3e8V7K9mN2pL4xHOeWvYkJdFgMsTuIbCzXwPqRsNhAeKlYdG', 'doctor', '+92-300-2222222', 'Female'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Dr. Zafar Iqbal', 'zafar.iqbal@doctorhub.pk', '$2b$10$rQnQZ3e8V7K9mN2pL4xHOeWvYkJdFgMsTuIbCzXwPqRsNhAeKlYdG', 'doctor', '+92-300-3333333', 'Male'),
-- Assistants
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Ali Assistant', 'ali.assistant@doctorhub.pk', '$2b$10$rQnQZ3e8V7K9mN2pL4xHOeWvYkJdFgMsTuIbCzXwPqRsNhAeKlYdG', 'assistant', '+92-300-4444444', 'Male'),
-- Patients
('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Hamza Patient', 'hamza@patient.pk', '$2b$10$rQnQZ3e8V7K9mN2pL4xHOeWvYkJdFgMsTuIbCzXwPqRsNhAeKlYdG', 'patient', '+92-300-5555555', 'Male'),
('22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sara Patient', 'sara@patient.pk', '$2b$10$rQnQZ3e8V7K9mN2pL4xHOeWvYkJdFgMsTuIbCzXwPqRsNhAeKlYdG', 'patient', '+92-300-6666666', 'Female');

-- Doctor Profiles
INSERT INTO doctors (id, user_id, clinic_id, specialty, treatment_type, experience_years, bio, consultation_fee, diseases_treated, available_days, slot_start_time, slot_end_time) VALUES
('d1111111-dddd-dddd-dddd-dddddddddddd', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Cardiologist', 'Allopathic', 15, 'Experienced cardiologist specializing in heart diseases, hypertension, and cardiac surgery.', 2000, ARRAY['Heart Disease','Hypertension','Arrhythmia','Chest Pain'], ARRAY['Monday','Tuesday','Wednesday','Thursday'], '09:00', '17:00'),
('d2222222-dddd-dddd-dddd-dddddddddddd', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'General Physician', 'Homeopathic', 10, 'Homeopathic practitioner with expertise in chronic diseases and natural healing.', 1000, ARRAY['Fever','Flu','Diabetes','Allergies','Skin Diseases'], ARRAY['Monday','Wednesday','Friday','Saturday'], '10:00', '18:00'),
('d3333333-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', 'Herbal Specialist', 'Herbal', 20, 'Expert in traditional herbal medicine with focus on digestive and respiratory disorders.', 800, ARRAY['Digestive Issues','Respiratory Problems','Joint Pain','Stress'], ARRAY['Tuesday','Thursday','Saturday'], '08:00', '16:00');

-- Patient Profiles
INSERT INTO patients (id, user_id, blood_group, allergies, chronic_conditions) VALUES
('a1111111-aaaa-bbbb-cccc-dddddddddddd', '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'O+', 'Penicillin', 'Diabetes Type 2'),
('a2222222-aaaa-bbbb-cccc-dddddddddddd', '22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'B+', NULL, NULL);

-- Assistant Profile
INSERT INTO assistants (user_id, doctor_id) VALUES
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'd1111111-dddd-dddd-dddd-dddddddddddd');
