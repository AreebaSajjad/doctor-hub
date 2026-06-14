<<<<<<< HEAD
# 🏥 Doctor Hub — Healthcare Consultation Platform
> Final Semester Project | Full-Stack Web Application

## Overview
Doctor Hub is a production-style healthcare management system where patients can find and book appointments with Allopathic, Homeopathic, and Herbal doctors. It features a complete appointment lifecycle, payment verification, digital prescriptions, and permanent medical history management.

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Backend | Node.js, Express.js |
| Database | Supabase (PostgreSQL) |
| Auth | JWT + bcrypt |
| Styling | Custom CSS Design System (Glassmorphism, HSL Variables) |

## Quick Start

### 1. Setup Supabase (Required)
See `supabase/SETUP_GUIDE.md` for full instructions.

### 2. Configure Environment
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your Supabase credentials

# Frontend
cp frontend/.env.example frontend/.env
```

### 3. Install & Run
```bash
npm run install:all   # Install all dependencies
npm run dev           # Start both frontend + backend
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

### 4. Verify Everything Works
```bash
node verify.js   # Run 25 automated API tests
```

## User Roles & Demo Accounts
All passwords: **Password123!**

| Role | Email |
|------|-------|
| Patient | hamza@patient.pk |
| Doctor (Allopathic) | ahmed.khan@doctorhub.pk |
| Doctor (Homeopathic) | fatima.malik@doctorhub.pk |
| Doctor (Herbal) | zafar.iqbal@doctorhub.pk |
| Assistant | ali.assistant@doctorhub.pk |
| Admin | admin@doctorhub.pk |
| Super Admin | superadmin@doctorhub.pk |

## Complete Appointment Workflow
1. **Register/Login** as patient
2. **Search doctors** by disease, specialty, or treatment type
3. **Book appointment** → status: `pending_payment`
4. **Submit payment** screenshot → status: `payment_submitted`
5. **Login as assistant** → verify payment → status: `confirmed`
6. **Login as doctor** → add medical record & write prescription
7. **Login as patient** → view prescription (cannot delete)

## API Endpoints
| Method | Route | Access |
|--------|-------|--------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET | /api/auth/me | Authenticated |
| POST | /api/auth/forgot-password | Public |
| GET | /api/doctors | Public |
| GET | /api/doctors/:id | Public |
| PUT | /api/doctors/profile | Doctor |
| POST | /api/appointments | Patient |
| GET | /api/appointments | Authenticated |
| PATCH | /api/appointments/:id/cancel | Patient/Admin |
| POST | /api/payments | Patient |
| GET | /api/payments | Authenticated |
| PATCH | /api/payments/:id/verify | Assistant/Doctor/Admin |
| GET | /api/history | Authenticated |
| POST | /api/history | Doctor |
| POST | /api/history/prescriptions | Doctor |
| GET | /api/history/prescriptions | Authenticated |
| GET | /api/admin/users | Admin |
| PATCH | /api/admin/users/:id | Admin |
| POST | /api/admin/clinics | Admin |
| GET | /api/admin/clinics | Admin |
| GET | /api/admin/analytics | Admin |

## Database Tables
users · clinics · doctors · patients · assistants · appointments · payments · medical_history · prescriptions

## Security Features
- JWT authentication on all protected routes
- bcrypt password hashing (salt rounds: 10)
- Role-based access control (RBAC) middleware
- Database-level triggers prevent medical_history deletion
- Database-level triggers prevent prescription edits/deletes
- Duplicate appointment detection
- Input validation middleware

## Project Structure
```
doctor-hub/
├── supabase/           # Schema SQL + setup guide
├── backend/            # Express API
│   └── src/
│       ├── config/     # Supabase connection
│       ├── controllers/# Business logic
│       ├── middleware/ # Auth + validation
│       └── routes/     # API routes
├── frontend/           # React app
│   └── src/
│       ├── components/ # Reusable UI
│       ├── context/    # Auth state
│       └── pages/      # All pages/dashboards
└── verify.js           # Automated tests
```
=======
# doctor-hub
>>>>>>> 6fa08c48254eab3a358ed028994b44b3d7183f1e
