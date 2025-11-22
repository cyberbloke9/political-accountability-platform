# Setup Guide

This guide will help you set up the Political Accountability Platform on your local machine for development.

## Prerequisites

### Required Software

- **Node.js**: Version 18 or higher
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify: `node --version`
  
- **npm**: Version 9 or higher (comes with Node.js)
  - Verify: `npm --version`

- **Git**: For version control
  - Download from [git-scm.com](https://git-scm.com/)
  - Verify: `git --version`

### Required Accounts

- **Supabase**: Free tier is sufficient
  - Sign up at [supabase.com](https://supabase.com)
  - You'll need this for database and authentication

- **GitHub**: For contributing
  - Sign up at [github.com](https://github.com)

## Step-by-Step Setup

### 1. Clone the Repository

```bash
# Using HTTPS
git clone https://github.com/cyberbloke9/political-accountability-platform.git

# OR using SSH
git clone git@github.com:cyberbloke9/political-accountability-platform.git

# Navigate to the project
cd political-accountability-platform
```

### 2. Install Dependencies

```bash
cd frontend
npm install
```

This will install all required packages defined in `package.json`.

### 3. Set Up Supabase

#### 3.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: `political-accountability` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your location
4. Click "Create new project" (takes ~2 minutes)

#### 3.2 Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

#### 3.3 Run Database Migrations

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Open `database/migrations/001_initial_schema.sql` from the project
4. Copy and paste the entire content
5. Click "Run" to execute
6. Repeat for `database/migrations/002_reputation_system.sql`

You should see success messages for both migrations.

#### 3.4 Enable Storage

1. Go to **Storage** in Supabase dashboard
2. Create a new bucket called `promise-images`
3. Set it to **Public** bucket
4. Create another bucket called `verification-evidence`
5. Set it to **Public** bucket

### 4. Configure Environment Variables

```bash
# Copy the example file
cp .env.example frontend/.env.local

# Edit the file
# On Windows: notepad frontend/.env.local
# On Mac/Linux: nano frontend/.env.local
```

Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important**: 
- Replace `your-project-id` with your actual Supabase project ID
- Replace `your_anon_key_here` with your actual anon key
- Never commit `.env.local` to git (it's already in `.gitignore`)

### 5. Run the Development Server

```bash
# From the frontend directory
npm run dev
```

You should see:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### 6. Access the Application

Open your browser and navigate to:
- **Frontend**: [http://localhost:3000](http://localhost:3000)

You should see the Political Accountability Platform homepage!

## Verification Checklist

After setup, verify everything works:

- [ ] Homepage loads without errors
- [ ] You can browse promises (may be empty initially)
- [ ] Sign up creates a new account
- [ ] Login works with your new account
- [ ] You can access the dashboard after login
- [ ] You can create a new promise (will be saved to Supabase)
- [ ] Profile page displays your information

## Common Issues

### Issue: "Module not found" errors

**Solution**: Make sure you're in the `frontend/` directory and run:
```bash
npm install
```

### Issue: Supabase connection fails

**Solution**: 
1. Check your `.env.local` file has correct credentials
2. Verify your Supabase URL starts with `https://`
3. Ensure anon key is the "anon public" key, not the "service_role" key
4. Restart the dev server: `npm run dev`

### Issue: Database errors

**Solution**:
1. Verify migrations ran successfully in Supabase SQL Editor
2. Check for error messages in the Supabase dashboard
3. Make sure you ran both migration files in order

### Issue: Images not uploading

**Solution**:
1. Ensure Storage buckets are created in Supabase
2. Verify buckets are set to "Public"
3. Check browser console for detailed error messages

### Issue: Port 3000 already in use

**Solution**:
```bash
# Find what's using port 3000
# Windows:
netstat -ano | findstr :3000

# Mac/Linux:
lsof -i :3000

# Kill the process or use a different port:
npm run dev -- -p 3001
```

## Next Steps

Once setup is complete:

1. **Read the codebase**: Start with `frontend/src/app/page.tsx`
2. **Make a small change**: Try editing the homepage text
3. **Check out issues**: Look for `good-first-issue` labels
4. **Read contributing guide**: See [CONTRIBUTING.md](../CONTRIBUTING.md)

## Development Tips

### Hot Reloading

Next.js supports hot reloading. Save any file and see changes instantly in the browser!

### Debugging

- Use browser DevTools (F12) to inspect errors
- Check the terminal where `npm run dev` is running for server errors
- Use `console.log()` for quick debugging (but remove before committing!)

### Database Changes

If you need to modify the database schema:

1. Make changes in Supabase SQL Editor
2. Save your SQL to a new migration file in `database/migrations/`
3. Document the changes

### Building for Production

Test the production build locally:

```bash
npm run build
npm run start
```

This ensures your code will work in production (Vercel).

## Getting Help

- **Documentation**: Check other files in `docs/`
- **Issues**: Search [GitHub Issues](https://github.com/cyberbloke9/political-accountability-platform/issues)
- **Email**: [papsupport@gmail.com](mailto:papsupport@gmail.com)
- **Community**: GitHub Discussions (coming soon)

---

**Setup complete!** You're ready to contribute to political accountability! 🚀
