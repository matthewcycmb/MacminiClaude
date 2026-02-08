# College Tracker - Setup Guide

## 1. Database Setup (Neon PostgreSQL)

### Steps:
1. Go to [neon.tech](https://neon.tech) and sign up for free
2. Click "Create Project"
3. Project name: `college-tracker`
4. Region: Choose closest to you
5. PostgreSQL version: 16 (latest)
6. Click "Create Project"

### Get Database URL:
1. After creation, you'll see a connection string
2. Click "Copy" next to the connection string
3. It looks like: `postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. Save this for the next step

**Alternative: Supabase**
- Go to [supabase.com](https://supabase.com)
- Create new project
- Go to Settings → Database
- Copy the "Connection string" (URI format)

---

## 2. Google OAuth Setup

### Steps:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing):
   - Click "Select a project" → "New Project"
   - Name: `College Tracker`
   - Click "Create"

3. Enable Google+ API:
   - In the search bar, type "Google+ API"
   - Click "Enable"

4. Configure OAuth Consent Screen:
   - Go to "APIs & Services" → "OAuth consent screen"
   - User Type: **External**
   - Click "Create"
   - Fill in:
     - App name: `College Tracker`
     - User support email: Your email
     - Developer contact: Your email
   - Click "Save and Continue"
   - Scopes: Click "Add or Remove Scopes"
     - Select: `email`, `profile`, `openid`
   - Click "Save and Continue"
   - Test users: Add your email
   - Click "Save and Continue"

5. Create OAuth Credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: `College Tracker Web`
   - Authorized JavaScript origins:
     - `http://localhost:3000`
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
   - Click "Create"

6. Copy credentials:
   - You'll see "Client ID" and "Client Secret"
   - **Save these for the next step**

---

## 3. Environment Variables Setup

Update your `.env` file with the values from above:

```bash
# Database (from Neon/Supabase)
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-this-next"

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Anthropic (get from https://console.anthropic.com)
ANTHROPIC_API_KEY="sk-ant-api03-..."

# Resend (get from https://resend.com/api-keys)
RESEND_API_KEY="re_..."

# Vercel Cron Secret (generate random string)
CRON_SECRET="your-random-secret"
```

### Generate NEXTAUTH_SECRET:
Run this command in your terminal:
```bash
openssl rand -base64 32
```
Copy the output and paste it as `NEXTAUTH_SECRET`

---

## 4. Initialize Database

After updating `.env`, run:
```bash
npx prisma db push
```

This will create all tables in your database.

---

## 5. Seed Initial Data (Optional)

To add test achievements and data:
```bash
npx prisma db seed
```

---

## 6. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

---

## Quick Test Checklist

- [ ] Database connected (no Prisma errors)
- [ ] Google OAuth works (can click "Continue with Google")
- [ ] Landing page loads
- [ ] No console errors

---

## Troubleshooting

### "Can't reach database server"
- Check DATABASE_URL is correct
- Ensure you copied the full connection string
- Verify your IP is allowed (Neon allows all by default)

### "OAuth error" or redirect fails
- Verify redirect URI matches exactly: `http://localhost:3000/api/auth/callback/google`
- Check Google OAuth consent screen is configured
- Ensure you added your email as a test user

### "Missing environment variable"
- Run `npm run build` to check for missing vars
- Verify `.env` file is in root directory (not `.env.example`)
