# Complete Setup Guide - College Tracker with Supabase

Follow this guide step-by-step. Should take about 15 minutes total.

---

## Part 1: Supabase Database Setup (5 minutes)

### Step 1: Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** (green button)
3. Sign up with GitHub (recommended) or email
4. You'll be taken to your dashboard

### Step 2: Create a New Project
1. Click **"New Project"** (green button)
2. Fill in the details:
   - **Name**: `college-tracker` (or any name you like)
   - **Database Password**: Create a strong password (SAVE THIS! You'll need it)
   - **Region**: Choose closest to you (e.g., "US West" if in California)
   - **Pricing Plan**: Free (should be selected by default)
3. Click **"Create new project"**
4. Wait 1-2 minutes for setup to complete

### Step 3: Get Your Database Connection String
1. Once your project is ready, look for the left sidebar
2. Click the **Settings** icon (gear icon at bottom)
3. Click **"Database"** in the left menu
4. Scroll down to **"Connection string"** section
5. Select **"URI"** tab (not "Session mode")
6. You'll see something like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```
7. Click **"Copy"** button
8. **IMPORTANT**: Replace `[YOUR-PASSWORD]` with the actual password you created in Step 2
   - The copied string has `[YOUR-PASSWORD]` as placeholder
   - Replace it with your real password (no brackets)

### Step 4: Save the Connection String
Your final connection string should look like:
```
postgresql://postgres:your_actual_password_here@db.abcdefgh.supabase.co:5432/postgres
```

**Keep this safe! You'll paste it in .env file later.**

---

## Part 2: Google OAuth Setup (5 minutes)

### Step 1: Go to Google Cloud Console
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Sign in with your Google account

### Step 2: Create a New Project
1. Click the project dropdown at the top (says "Select a project")
2. Click **"NEW PROJECT"** button (top right of popup)
3. Project name: `College Tracker`
4. Click **"CREATE"**
5. Wait for it to create (notification will appear)
6. Make sure the new project is selected (click the dropdown again and select it)

### Step 3: Enable Google+ API (Required for OAuth)
1. In the search bar at top, type: `Google+ API`
2. Click **"Google+ API"** in results
3. Click the blue **"ENABLE"** button
4. Wait for it to enable (takes a few seconds)

### Step 4: Configure OAuth Consent Screen
1. In left sidebar, click **"OAuth consent screen"**
2. Select **"External"** user type
3. Click **"CREATE"**

4. Fill in the form:
   - **App name**: `College Tracker`
   - **User support email**: Your email (select from dropdown)
   - **Developer contact information**: Your email
   - Leave everything else blank/default
5. Click **"SAVE AND CONTINUE"** (bottom)

6. On "Scopes" page:
   - Click **"ADD OR REMOVE SCOPES"**
   - Find and check these boxes:
     - `./auth/userinfo.email`
     - `./auth/userinfo.profile`
     - `openid`
   - Click **"UPDATE"** (bottom of popup)
   - Click **"SAVE AND CONTINUE"**

7. On "Test users" page:
   - Click **"ADD USERS"**
   - Enter YOUR email address (the one you'll test with)
   - Click **"ADD"**
   - Click **"SAVE AND CONTINUE"**

8. On "Summary" page:
   - Review and click **"BACK TO DASHBOARD"**

### Step 5: Create OAuth Credentials
1. In left sidebar, click **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** (top)
3. Select **"OAuth client ID"**

4. Fill in the form:
   - **Application type**: Select **"Web application"**
   - **Name**: `College Tracker Web Client`

   - **Authorized JavaScript origins**:
     - Click **"+ ADD URI"**
     - Enter: `http://localhost:3000`

   - **Authorized redirect URIs**:
     - Click **"+ ADD URI"**
     - Enter: `http://localhost:3000/api/auth/callback/google`
     - ⚠️ Make sure this is EXACT (including `/google` at the end)

5. Click **"CREATE"**

### Step 6: Copy Your Credentials
A popup will appear with:
- **Your Client ID**: `something.apps.googleusercontent.com`
- **Your Client Secret**: `GOCSPX-something`

**Copy both and save them! You'll need these in .env file.**

---

## Part 3: Generate NextAuth Secret (30 seconds)

### Option 1: Using Terminal (Mac/Linux)
Open your terminal and run:
```bash
openssl rand -base64 32
```

Copy the output (it will look like: `ABC123xyz+/=...`)

### Option 2: Using Online Generator
1. Go to [generate-secret.vercel.app](https://generate-secret.vercel.app/32)
2. Copy the generated secret

**Save this! You'll need it in .env file.**

---

## Part 4: Update Environment Variables (2 minutes)

1. In your project folder, open the `.env` file (not `.env.example`)
2. Replace the entire contents with:

```bash
# Database (from Supabase Part 1, Step 4)
DATABASE_URL="postgresql://postgres:your_actual_password@db.xxx.supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-from-part-3"

# Google OAuth (from Google Cloud Part 2, Step 6)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-client-secret"

# Anthropic (OPTIONAL - skip for now, we'll add later)
ANTHROPIC_API_KEY=""

# Resend (OPTIONAL - skip for now)
RESEND_API_KEY=""

# Vercel Cron Secret (OPTIONAL - skip for now)
CRON_SECRET=""
```

3. Replace the placeholder values:
   - `DATABASE_URL`: Paste your Supabase connection string
   - `NEXTAUTH_SECRET`: Paste the secret you generated
   - `GOOGLE_CLIENT_ID`: Paste from Google Cloud
   - `GOOGLE_CLIENT_SECRET`: Paste from Google Cloud

4. **Save the file**

---

## Part 5: Initialize Database (2 minutes)

Now let's create the database tables.

### Step 1: Push Database Schema
In your terminal (in the project folder), run:
```bash
npx prisma db push
```

You should see:
```
✔ Generated Prisma Client
✔ Database synchronized with Prisma schema
```

If you see errors about missing DATABASE_URL, double-check your .env file.

### Step 2: Verify Tables Were Created
1. Go back to Supabase dashboard
2. Click **"Table Editor"** in left sidebar
3. You should see tables like: `User`, `Profile`, `Roadmap`, `Task`, etc.

If you see these tables, **SUCCESS!** 🎉

---

## Part 6: Test the App! (1 minute)

### Step 1: Start Development Server
In terminal:
```bash
npm run dev
```

You should see:
```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
```

### Step 2: Test the App
1. Open browser: http://localhost:3000
2. You should see the landing page
3. Click **"Get Started"** or **"Sign Up"**
4. Click **"Continue with Google"**
5. Sign in with the email you added as a test user
6. You should be redirected to the onboarding page! 🎉

---

## Troubleshooting

### Database Connection Error
**Error**: `Can't reach database server`
- Check DATABASE_URL in .env is correct
- Make sure you replaced `[YOUR-PASSWORD]` with actual password
- No spaces before or after the URL

### Google OAuth Error: "redirect_uri_mismatch"
**Error**: Redirect URI doesn't match
- Check Google Cloud Console → Credentials
- Make sure redirect URI is EXACTLY: `http://localhost:3000/api/auth/callback/google`
- No trailing slash, includes `/google` at end

### Google OAuth Error: "Access blocked"
**Error**: App not verified
- Go to Google Cloud Console → OAuth consent screen
- Add your email as a "Test user"
- Make sure you're signing in with that email

### NextAuth Error: "No secret provided"
**Error**: Missing NEXTAUTH_SECRET
- Check .env file has NEXTAUTH_SECRET
- Restart dev server (Ctrl+C, then `npm run dev`)

### Prisma Error: "Schema not found"
**Error**: Can't find schema
- Make sure you're in the project root directory
- File should exist at: `prisma/schema.prisma`
- Run `npx prisma generate` then try again

---

## What's Next?

Once you've successfully signed in and completed onboarding:

1. ✅ You have a working database with user authentication
2. ✅ Onboarding saves to your profile
3. ⚠️ Roadmap generation uses mock data (need Anthropic API key)
4. ⚠️ Email notifications disabled (need Resend API key)

### To Add AI Roadmap Generation:
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up and get an API key
3. Add to .env: `ANTHROPIC_API_KEY="sk-ant-api03-..."`
4. Restart dev server

### To Test Without API Keys:
The app works fully with mock data! You can:
- Sign up with Google
- Complete onboarding
- See mock dashboard with stats
- View mock roadmap
- Test all UI features

---

## Need Help?

If you get stuck:
1. Check the troubleshooting section above
2. Make sure .env file has no typos
3. Restart the dev server
4. Check terminal for error messages

Ready to continue? Let me know when you've completed the setup! 🚀
