# Doctor Hub — Deployment Guide

## Overview
- **Backend** → Render (free tier) — https://render.com
- **Frontend** → Vercel (free tier) — https://vercel.com

---

## Step 1: Deploy Backend on Render

### 1.1 Create Render Account
Go to https://render.com and sign up with GitHub.

### 1.2 Connect Repository
1. Push your project to GitHub first:
```bash
git init
git add .
git commit -m "Initial commit - Doctor Hub"
git remote add origin https://github.com/YOUR_USERNAME/doctor-hub.git
git push -u origin main
```

### 1.3 Create Web Service
1. In Render dashboard → click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `doctor-hub-api`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

### 1.4 Set Environment Variables
In Render dashboard → your service → **Environment** tab, add:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` |
| `SUPABASE_SERVICE_KEY` | `your_service_role_key` |
| `JWT_SECRET` | `your_strong_secret_key_min_32_chars` |
| `JWT_EXPIRES_IN` | `7d` |

### 1.5 Deploy
Click **"Create Web Service"** — Render will build and deploy automatically.

Your backend URL will be: `https://doctor-hub-api.onrender.com`

Test it: `https://doctor-hub-api.onrender.com/api/health`

---

## Step 2: Update Frontend API URL

Before deploying frontend, update `frontend/.env`:
```
VITE_API_URL=https://doctor-hub-api.onrender.com/api
```

Also update `frontend/vercel.json` — replace the API URL with your actual Render URL.

---

## Step 3: Deploy Frontend on Vercel

### 3.1 Create Vercel Account
Go to https://vercel.com and sign up with GitHub.

### 3.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### 3.3 Set Environment Variables
In Vercel dashboard → your project → **Settings** → **Environment Variables**:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://doctor-hub-api.onrender.com/api` |

### 3.4 Deploy
Click **"Deploy"** — Vercel builds and gives you a live URL instantly.

Your frontend URL will be: `https://doctor-hub.vercel.app`

---

## Step 4: Update CORS on Backend

After getting your Vercel URL, update `backend/src/index.js`:

```js
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://doctor-hub.vercel.app',   // ← add your actual Vercel URL
    'https://YOUR_APP.vercel.app'
  ],
  credentials: true
}));
```

Commit and push — Render will auto-redeploy.

---

## Final URLs

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://doctor-hub.vercel.app |
| Backend API (Render) | https://doctor-hub-api.onrender.com/api |
| API Health Check | https://doctor-hub-api.onrender.com/api/health |

---

## Notes
- Render free tier **spins down after 15 mins** of inactivity — first request after idle takes ~30 seconds to wake up. This is normal for free tier.
- Supabase free tier supports up to 500MB database and 50,000 monthly active users — more than enough for a project.
- Both Vercel and Render auto-deploy on every `git push` to main branch.
