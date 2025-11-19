# Political Accountability Platform - Deployment Guide

## Quick Deploy to Vercel (Frontend)

### Prerequisites
- GitHub account
- Vercel account (sign up at https://vercel.com)
- Node.js 20+ installed locally

---

## Option 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Push to GitHub
```bash
cd political-accountability-platform
git add .
git commit -m "Initial commit - Foundation complete"
git push origin main
```

### Step 2: Connect to Vercel
1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your GitHub repository: `political-accountability-platform`
4. Vercel will auto-detect Next.js

### Step 3: Configure Project
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Step 4: Set Environment Variables

Click "Environment Variables" and add these:

#### Required for MVP:
```
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api/v1
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
```

#### Optional (for production):
```
NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL=https://your-r2-bucket.r2.cloudflarestorage.com
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

### Step 5: Deploy
1. Click "Deploy"
2. Wait 2-3 minutes for build completion
3. Your frontend will be live at: `https://your-app-name.vercel.app`

---

## Option 2: Deploy via Vercel CLI

### Install Vercel CLI
```bash
npm install -g vercel
```

### Login to Vercel
```bash
vercel login
```

### Deploy from Project Root
```bash
cd political-accountability-platform/frontend
vercel
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Your username/organization
- **Link to existing project?** No
- **What's your project's name?** political-accountability-platform
- **In which directory is your code located?** ./
- **Want to override settings?** No

### Set Environment Variables via CLI
```bash
vercel env add NEXT_PUBLIC_API_URL
# Enter value: https://your-backend-url.railway.app/api/v1

vercel env add NEXT_PUBLIC_APP_URL
# Enter value: https://political-accountability-platform.vercel.app
```

### Deploy to Production
```bash
vercel --prod
```

---

## Backend Deployment (Railway)

### Step 1: Create Railway Account
Go to https://railway.app and sign up

### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose `political-accountability-platform`
4. Railway will auto-detect Express.js

### Step 3: Configure Build Settings
- **Root Directory**: `backend`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Watch Paths**: `backend/**`

### Step 4: Add PostgreSQL Database
1. In Railway dashboard, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will provision a PostgreSQL instance
4. Copy the `DATABASE_URL` from environment variables

### Step 5: Set Environment Variables

In Railway dashboard, add these variables:

#### Required:
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-token-secret-min-32-chars
CORS_ORIGIN=https://your-app-name.vercel.app

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Storage (Cloudflare R2)
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=political-accountability-evidence
R2_PUBLIC_URL=https://your-bucket.r2.cloudflarestorage.com

# Fraud Detection (Google Cloud Vision)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_VISION_API_KEY=your-vision-api-key

# Optional
SENTRY_DSN=your-sentry-dsn
```

### Step 6: Run Database Migrations
```bash
# From local machine
cd backend
DATABASE_URL="your-railway-database-url" npm run db:migrate
```

Or use Railway's built-in terminal in the dashboard.

### Step 7: Deploy
Railway auto-deploys on git push. Your backend will be live at:
`https://your-app-name.railway.app`

---

## Post-Deployment Setup

### 1. Update Frontend API URL
Go back to Vercel dashboard:
1. Go to your project settings
2. Environment Variables
3. Update `NEXT_PUBLIC_API_URL` to your Railway backend URL
4. Redeploy frontend

### 2. Update Backend CORS
In Railway:
1. Update `CORS_ORIGIN` to your Vercel frontend URL
2. Railway will auto-redeploy

### 3. Test the Deployment
Visit your Vercel URL and test:
- ✅ Homepage loads
- ✅ Registration works
- ✅ Login works
- ✅ API calls succeed

---

## Environment Variables Reference

### Frontend (Vercel)
| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | Yes | `https://api.yourdomain.com/api/v1` |
| `NEXT_PUBLIC_APP_URL` | Frontend base URL | Yes | `https://yourdomain.com` |
| `NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL` | R2 CDN URL | No | `https://cdn.yourdomain.com` |
| `NEXT_PUBLIC_SENTRY_DSN` | Error tracking | No | `https://xxx@sentry.io/xxx` |

### Backend (Railway)
| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://user:pass@host:5432/db` |
| `NODE_ENV` | Environment | Yes | `production` |
| `PORT` | Server port (auto-set by Railway) | No | `3000` |
| `JWT_SECRET` | Access token secret (32+ chars) | Yes | `super-secret-jwt-key-change-me` |
| `JWT_REFRESH_SECRET` | Refresh token secret (32+ chars) | Yes | `refresh-secret-key-change-me` |
| `CORS_ORIGIN` | Allowed frontend origins | Yes | `https://yourdomain.com` |
| `SENDGRID_API_KEY` | Email service API key | Yes | `SG.xxx` |
| `SENDGRID_FROM_EMAIL` | From email address | Yes | `noreply@yourdomain.com` |
| `R2_ACCOUNT_ID` | Cloudflare account ID | Yes | `abc123` |
| `R2_ACCESS_KEY_ID` | R2 access key | Yes | `xxx` |
| `R2_SECRET_ACCESS_KEY` | R2 secret key | Yes | `xxx` |
| `R2_BUCKET_NAME` | R2 bucket name | Yes | `evidence-files` |
| `R2_PUBLIC_URL` | R2 public CDN URL | Yes | `https://cdn.r2.dev` |
| `GOOGLE_CLOUD_PROJECT_ID` | GCP project ID | Yes | `my-project-123` |
| `GOOGLE_CLOUD_VISION_API_KEY` | Vision API key | Yes | `AIzaSyXXX` |

---

## Cost Estimates (10K Users)

### Vercel (Frontend)
- **Free Tier**: 100GB bandwidth/month - SUFFICIENT for MVP
- **Pro Tier**: $20/month (if needed) - Unlimited bandwidth

### Railway (Backend)
- **Hobby Plan**: $5/month - 500 hours runtime
- **Developer Plan**: $20/month - Unlimited runtime + 8GB RAM

### PostgreSQL (Railway)
- **Included**: $0 (first 512MB storage)
- **Scaling**: $0.25/GB/month

### Cloudflare R2 (Storage)
- **Storage**: ~$15/month (1000 verifications)
- **Bandwidth**: $0 (zero egress fees)

### SendGrid (Email)
- **Free Tier**: 100 emails/day - OK for early stage
- **Essentials**: $15/month - 50K emails

### Google Vision API (Fraud Detection)
- **Cost**: ~$1.50 per 1,000 image checks
- **Monthly (1K verifications)**: ~$1.50

### Total Monthly Cost: ~$50-100 for MVP (10K users)

---

## Monitoring & Logging

### Recommended Services (Free Tiers)

1. **Sentry** (Error Tracking)
   - Free: 5K errors/month
   - Setup: Add Sentry SDK to frontend/backend
   - Dashboard: Real-time error monitoring

2. **LogRocket** (Session Replay)
   - Free: 1K sessions/month
   - Captures user interactions for debugging

3. **UptimeRobot** (Uptime Monitoring)
   - Free: 50 monitors, 5-min intervals
   - Alerts via email/SMS if site goes down

4. **Vercel Analytics** (Frontend Performance)
   - Included: Real User Monitoring (RUM)
   - Tracks Web Vitals (LCP, FID, CLS)

---

## Security Checklist

Before going live:

- [ ] Change all default secrets (JWT_SECRET, etc.)
- [ ] Enable HTTPS only (Vercel/Railway auto-enable)
- [ ] Set strong password requirements in backend
- [ ] Enable rate limiting on auth endpoints
- [ ] Configure CORS properly (whitelist your domain only)
- [ ] Add helmet.js security headers (already in backend)
- [ ] Enable SQL injection protection (Prisma ORM handles this)
- [ ] Set up automated backups for PostgreSQL
- [ ] Configure Sentry for error tracking
- [ ] Test MFA flow thoroughly
- [ ] Review API rate limits (10 requests/min per user)

---

## Troubleshooting

### Frontend Build Fails
```
Error: Cannot find module 'next/font'
```
**Fix**: Ensure Next.js 14+ is installed
```bash
cd frontend
npm install next@14 react@18 react-dom@18
```

### Backend Connection Issues
```
Error: connect ECONNREFUSED
```
**Fix**: Check DATABASE_URL is set correctly in Railway
- Go to Railway → Variables
- Verify DATABASE_URL exists
- Test connection: `psql $DATABASE_URL`

### CORS Errors
```
Access to fetch at 'https://api...' has been blocked by CORS policy
```
**Fix**: Update backend CORS_ORIGIN
```bash
# In Railway, set:
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

### API 404 Errors
```
GET https://your-app.vercel.app/api/v1/promises 404
```
**Fix**: Update NEXT_PUBLIC_API_URL in Vercel
- Should point to Railway backend, not Vercel frontend
- Format: `https://your-backend.railway.app/api/v1`

---

## Continuous Deployment

### Auto-Deploy on Git Push

Both Vercel and Railway support automatic deployments:

1. **Vercel** (Frontend):
   - Push to `main` branch → Auto-deploy to production
   - Push to any other branch → Deploy preview

2. **Railway** (Backend):
   - Push to `main` → Auto-deploy to production
   - Configure branch deployments in Railway settings

### Deployment Pipeline
```
Local Development
    ↓ (git push)
GitHub Repository
    ↓ (webhook)
Vercel Build (Frontend) + Railway Build (Backend)
    ↓ (success)
Production Deployment
```

---

## Custom Domain Setup

### Frontend (Vercel)
1. Buy domain (Namecheap, GoDaddy, Cloudflare)
2. In Vercel dashboard: Settings → Domains
3. Add domain: `www.yourdomain.com`
4. Vercel provides DNS records (A/CNAME)
5. Update nameservers or add DNS records
6. SSL auto-provisioned by Vercel

### Backend (Railway)
1. In Railway: Settings → Domains
2. Add custom domain: `api.yourdomain.com`
3. Railway provides CNAME record
4. Add CNAME in your DNS provider
5. SSL auto-provisioned by Railway

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Prisma Railway Guide**: https://www.prisma.io/docs/guides/deployment/railway

---

**You're ready to deploy! 🚀**

For environment variable values, reply in the chat and I'll help you configure them securely.
