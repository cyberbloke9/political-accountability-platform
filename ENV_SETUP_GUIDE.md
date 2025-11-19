# Environment Variables Setup Guide

Complete step-by-step guide to set up all environment variables for the Political Accountability Platform.

---

## 📋 Quick Overview

You need to set up environment variables in **2 places**:

1. **Frontend** (`frontend/.env.local`) - 2 required variables
2. **Backend** (`backend/.env`) - 4 required variables + optional ones

**Total Setup Time:** 15-20 minutes

---

## 🚀 STEP-BY-STEP SETUP

### STEP 1: Create Supabase Project (5 minutes)

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Click "New Project"

2. **Fill in Project Details**
   ```
   Organization: [Your organization or create new]
   Name: political-accountability-platform
   Database Password: [Create strong password - SAVE IT!]
   Region: Southeast Asia (Singapore) - closest to India
   Pricing Plan: Free (upgrade to Pro later if needed)
   ```

3. **Create Project**
   - Click "Create new project"
   - Wait 2 minutes for provisioning
   - You'll see a success message when ready

---

### STEP 2: Get Supabase Credentials (5 minutes)

Once your project is ready:

1. **Go to Project Settings**
   - Click Settings (⚙️) in left sidebar
   - Click "API" section

2. **Copy These 3 Values**

   **Project URL:**
   ```
   Location: Settings → API → Project URL
   Format: https://xxxxxxxxxxxxx.supabase.co
   Copy this → Use in both frontend and backend
   ```

   **anon public key:**
   ```
   Location: Settings → API → Project API keys → anon public
   Format: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Copy this → Use in both frontend and backend
   ```

   **service_role key:** ⚠️ **KEEP THIS SECRET**
   ```
   Location: Settings → API → Project API keys → service_role
   Format: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Click "Reveal" → Copy this → Use ONLY in backend
   ```

3. **Get Database Connection String**
   - Go to Settings → Database
   - Scroll to "Connection String"
   - Select "URI" tab
   - Copy the connection string
   - Replace `[YOUR-PASSWORD]` with the database password from Step 1

   **Example:**
   ```
   postgresql://postgres:YourPasswordHere@db.abcdefghijklm.supabase.co:5432/postgres
   ```

---

### STEP 3: Configure Frontend Environment Variables (2 minutes)

1. **Open the file:** `frontend/.env.local`

2. **Replace these 2 lines:**

   **BEFORE:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **AFTER (with your values):**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklm.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.your-actual-anon-key-here
   ```

3. **Save the file**

✅ **Frontend setup complete!**

---

### STEP 4: Configure Backend Environment Variables (3 minutes)

1. **Open the file:** `backend/.env`

2. **Replace these 4 REQUIRED variables:**

   **BEFORE:**
   ```bash
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   DATABASE_URL=postgresql://postgres:your-database-password@db.your-project-ref.supabase.co:5432/postgres
   ```

   **AFTER (with your values):**
   ```bash
   SUPABASE_URL=https://abcdefghijklm.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-service-role-key-here
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-anon-key-here
   DATABASE_URL=postgresql://postgres:YourPasswordHere@db.abcdefghijklm.supabase.co:5432/postgres
   ```

3. **Update CORS_ORIGIN:**

   **For local development:**
   ```bash
   CORS_ORIGIN=http://localhost:3000
   ```

   **For production (after deploying to Vercel):**
   ```bash
   CORS_ORIGIN=https://your-app-name.vercel.app
   ```

4. **Save the file**

✅ **Backend minimum setup complete!**

---

### STEP 5: Set Up Google Vision API (Optional - 10 minutes)

**Required for:** Fraud detection (reverse image search)
**Can skip for now:** Platform works without it, fraud detection just won't run

**If you want fraud detection:**

1. **Go to Google Cloud Console**
   - URL: https://console.cloud.google.com
   - Sign in with Google account

2. **Create/Select Project**
   - Click project dropdown (top left)
   - Click "New Project"
   - Name: "political-accountability-platform"
   - Click "Create"
   - Wait 30 seconds for creation

3. **Enable Cloud Vision API**
   - Go to: Navigation Menu → APIs & Services → Library
   - Search: "Cloud Vision API"
   - Click "Cloud Vision API"
   - Click "Enable"
   - Wait for activation

4. **Create API Key**
   - Go to: Navigation Menu → APIs & Services → Credentials
   - Click "Create Credentials" → "API Key"
   - Copy the API key shown
   - (Optional) Click "Restrict Key" and limit to Cloud Vision API only

5. **Add to Backend .env**
   ```bash
   GOOGLE_VISION_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   GOOGLE_CLOUD_PROJECT_ID=political-accountability-platform
   ```

6. **Enable Billing (if required)**
   - Google Vision API has free tier: 1,000 units/month
   - After that, you need billing enabled
   - Go to: Billing → Link a billing account
   - Add credit card (you won't be charged unless you exceed free tier)

✅ **Google Vision API setup complete!**

---

## ✅ VERIFICATION CHECKLIST

After setting up all environment variables:

### Frontend Verification
```bash
cd frontend
cat .env.local
```

**You should see:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL` starts with `https://` and ends with `.supabase.co`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` is a long JWT token (starts with `eyJ`)
- ✅ No placeholder values like "your-project-ref" remain

### Backend Verification
```bash
cd backend
cat .env
```

**You should see:**
- ✅ `SUPABASE_URL` matches frontend URL
- ✅ `SUPABASE_SERVICE_ROLE_KEY` is a long JWT token (different from anon key)
- ✅ `SUPABASE_ANON_KEY` matches frontend anon key
- ✅ `DATABASE_URL` contains your actual database password
- ✅ `CORS_ORIGIN` is set to `http://localhost:3000` (or your frontend URL)
- ✅ No placeholder values remain

---

## 🧪 TEST YOUR SETUP

1. **Install Dependencies**
   ```bash
   # Root directory
   npm install

   # Frontend
   cd frontend && npm install

   # Backend
   cd backend && npm install
   ```

2. **Run Backend**
   ```bash
   cd backend
   npm run dev
   ```

   **Expected output:**
   ```
   ✓ Supabase client initialized
   ✓ Database connected
   ✓ Server listening on port 3000
   ```

3. **Run Frontend (in new terminal)**
   ```bash
   cd frontend
   npm run dev
   ```

   **Expected output:**
   ```
   ✓ Ready in 2.3s
   ✓ Local: http://localhost:3000
   ```

4. **Test Supabase Connection**
   - Open: http://localhost:3000
   - Try to register a new account
   - Check your email for verification
   - ✅ If registration works, Supabase is configured correctly!

---

## 🚨 TROUBLESHOOTING

### Error: "Invalid API key" or "Invalid JWT"

**Problem:** Supabase keys are incorrect or incomplete

**Solution:**
1. Go back to Supabase Dashboard → Settings → API
2. Copy keys again (make sure you copy the FULL key)
3. Paste into .env files
4. Restart servers

---

### Error: "Connection refused" or "Database connection failed"

**Problem:** DATABASE_URL is incorrect

**Solution:**
1. Check database password is correct
2. Ensure no extra spaces in DATABASE_URL
3. Verify project ref matches your Supabase project
4. Format: `postgresql://postgres:PASSWORD@db.PROJECT-REF.supabase.co:5432/postgres`

---

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Problem:** CORS_ORIGIN doesn't match frontend URL

**Solution:**
1. In `backend/.env`, set:
   - For local: `CORS_ORIGIN=http://localhost:3000`
   - For production: `CORS_ORIGIN=https://your-vercel-app.vercel.app`
2. Make sure there's no trailing slash
3. Restart backend server

---

### Error: "Google Vision API: Permission denied"

**Problem:** API not enabled or billing required

**Solution:**
1. Verify Cloud Vision API is enabled
2. Check API key is correct
3. If you've exceeded free tier, enable billing
4. OR temporarily disable fraud detection:
   ```bash
   ENABLE_FRAUD_DETECTION=false
   ```

---

## 📝 PRODUCTION DEPLOYMENT

When deploying to production:

### For Vercel (Frontend)
1. Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL` → [same value]
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → [same value]
3. Redeploy

### For Railway/Render (Backend - if using)
1. Go to: Railway/Render Dashboard → Your Project → Variables
2. Add ALL variables from `backend/.env`
3. Change:
   - `NODE_ENV=production`
   - `CORS_ORIGIN=https://your-vercel-app.vercel.app`
4. Redeploy

---

## 🔒 SECURITY REMINDERS

- ✅ **Never commit .env files to Git** (already in .gitignore)
- ✅ **Keep SERVICE_ROLE_KEY secret** (it has admin access)
- ✅ **Anon key is safe to expose** (it's meant to be public)
- ✅ **Use different secrets for dev vs production**
- ✅ **Rotate keys if they're ever leaked**

---

## 📚 RESOURCES

- **Supabase Docs:** https://supabase.com/docs
- **Google Vision API Docs:** https://cloud.google.com/vision/docs
- **Next.js Environment Variables:** https://nextjs.org/docs/basic-features/environment-variables
- **Need Help?** Open an issue in the project repo

---

**Environment setup complete! You're ready to develop and deploy! 🚀**
