# Doctor Hub - Supabase Setup Guide

## Step 1: Create a Supabase Account
1. Go to https://supabase.com
2. Click "Start your project" and sign up with GitHub or email

## Step 2: Create a New Project
1. Click "New Project"
2. Name it: `doctor-hub`
3. Set a strong database password (save it!)
4. Choose region closest to you (e.g. Singapore for Pakistan)
5. Click "Create new project" (takes ~2 minutes)

## Step 3: Run the Schema
1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open the file `supabase/schema.sql` from this project
4. Paste the entire contents into the SQL editor
5. Click **"Run"** (green button)
6. You should see "Success. No rows returned" for each statement

## Step 4: Get Your API Keys
1. Go to **Settings** → **API** in the left sidebar
2. Copy these values:
   - **Project URL** (looks like: https://xxxxx.supabase.co)
   - **anon/public key** (long JWT string)
   - **service_role key** (long JWT string — keep this secret!)

## Step 5: Configure Environment Variables

### Backend (.env)
Create `backend/.env` with:
```
PORT=5000
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### Frontend (.env)
Create `frontend/.env` with:
```
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key_here
```

## Step 6: Install Dependencies & Run

```bash
# From project root
npm install
npm run install:all

# Run both frontend and backend together
npm run dev
```

## Default Login Credentials (Sample Data)
All sample users have password: **Password123!**

| Role | Email |
|------|-------|
| Super Admin | superadmin@doctorhub.pk |
| Admin | admin@doctorhub.pk |
| Doctor (Allopathic) | ahmed.khan@doctorhub.pk |
| Doctor (Homeopathic) | fatima.malik@doctorhub.pk |
| Doctor (Herbal) | zafar.iqbal@doctorhub.pk |
| Assistant | ali.assistant@doctorhub.pk |
| Patient | hamza@patient.pk |
| Patient | sara@patient.pk |

## URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- API Health: http://localhost:5000/api/health
