# LiFi Sales Dashboard — Complete Setup Guide
# ============================================================

## WHAT EACH FILE DOES
# ============================================================

src/
├── app/
│   ├── layout.tsx              ← Root HTML wrapper, Google Fonts, Toaster
│   ├── globals.css             ← Tailwind + all custom CSS classes (notion-input etc)
│   ├── page.tsx                ← Root redirect (→ /login or /dashboard/overview)
│   │
│   ├── login/page.tsx          ← Gmail OTP login page (step 1: email, step 2: 6-digit code)
│   ├── invite/page.tsx         ← New user invite acceptance page
│   │
│   └── dashboard/
│       ├── layout.tsx          ← Dashboard shell: checks auth, loads profile, renders Sidebar
│       ├── overview/
│       │   ├── page.tsx        ← Server component, loads user/profile
│       │   └── OverviewClient.tsx  ← All stats cards + charts + recent sales table
│       ├── sales/page.tsx      ← Admin: all sales table with filters + CSV export
│       ├── buyers/page.tsx     ← Admin: buyer intelligence + timeline expansion
│       ├── agents/page.tsx     ← Admin: team list + invite modal
│       ├── my-sales/page.tsx   ← Agent/Admin own sales only
│       └── add-sale/page.tsx   ← Add sale form page
│
├── components/
│   ├── ui/
│   │   ├── StatCard.tsx        ← Reusable metric card with icon + trend
│   │   ├── PageHeader.tsx      ← Page title + subtitle + action buttons slot
│   │   ├── DateRangeFilter.tsx ← Preset + custom date range picker
│   │   └── ScreenshotModal.tsx ← Full-size image modal with download
│   ├── dashboard/
│   │   ├── Sidebar.tsx         ← Left sidebar (desktop only), role-aware nav links
│   │   ├── MobileNav.tsx       ← Bottom tab bar (mobile only)
│   │   └── SalesTable.tsx      ← Reusable sales table (desktop + mobile cards)
│   └── forms/
│       └── AddSaleForm.tsx     ← Full 7-field sale form with buyer detection + upload
│
├── lib/
│   ├── utils.ts                ← cn(), formatCurrency(), formatDate(), plan helpers
│   └── supabase/
│       ├── client.ts           ← Browser Supabase client (for client components)
│       ├── server.ts           ← Server Supabase client (for server components)
│       └── middleware.ts       ← Session refresh + route protection logic
│
├── types/index.ts              ← All TypeScript interfaces (Profile, Sale, BuyerHistory…)
├── middleware.ts               ← Next.js middleware entry point (protects all /dashboard/* routes)
│
supabase/
└── schema.sql                  ← Complete DB setup: tables, enums, triggers, RLS, storage


## STEP 1 — SUPABASE SQL SETUP
# ============================================================

1. Go to: https://supabase.com/dashboard/project/qfccuvdpatvmpfsnmpvc
2. Click "SQL Editor" in left sidebar
3. Click "New query"
4. Open the file: supabase/schema.sql
5. Copy ALL contents and paste into the SQL editor
6. Click "Run" (green button)
7. You should see: "Success. No rows returned"

   ⚠️  If you see "type already exists" errors, the enums were partially created.
       Run this first, then re-run schema.sql:
       DROP TYPE IF EXISTS user_role CASCADE;
       DROP TYPE IF EXISTS premium_plan CASCADE;
       DROP TYPE IF EXISTS sale_type CASCADE;
       DROP TYPE IF EXISTS platform_type CASCADE;


## STEP 2 — CREATE STORAGE BUCKET
# ============================================================

1. In Supabase Dashboard → click "Storage" in left sidebar
2. Click "New bucket"
3. Name: sale-screenshots
4. Toggle "Public bucket" → ON
5. Click "Create bucket"

   (The SQL already tries to create it, but the UI method is more reliable)


## STEP 3 — LOCAL DEVELOPMENT SETUP
# ============================================================

Open VS Code terminal (Ctrl + ` ) and run:

# Navigate to your projects folder first, e.g.:
cd C:\Users\YourName\Documents\projects

# Clone or move the lifi-dashboard folder here, then:
cd lifi-dashboard

# Install all dependencies
npm install

# The .env.local file is already configured with your keys.
# Start development server:
npm run dev

# Open browser: http://localhost:3000


## STEP 4 — GITHUB SETUP
# ============================================================

# In VS Code terminal, inside the lifi-dashboard folder:

git init
git add .
git commit -m "Initial commit: LiFi Sales Dashboard"

# Go to github.com → New repository
# Name it: lifi-dashboard
# Visibility: Private (recommended)
# Do NOT initialize with README (you already have files)

# Copy the repository URL (e.g. https://github.com/yourusername/lifi-dashboard.git)
# Then in your terminal:

git remote add origin https://github.com/yourusername/lifi-dashboard.git
git branch -M main
git push -u origin main

# For future changes:
git add .
git commit -m "describe your change"
git push


## STEP 5 — VERCEL DEPLOYMENT
# ============================================================

1. Go to: https://vercel.com/new
2. Click "Import Git Repository"
3. Connect your GitHub account if not already
4. Select the "lifi-dashboard" repository
5. Vercel auto-detects Next.js — click "Deploy"

6. BEFORE or AFTER first deploy, add Environment Variables:
   Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

   Add these THREE variables:

   Name: NEXT_PUBLIC_SUPABASE_URL
   Value: https://qfccuvdpatvmpfsnmpvc.supabase.co
   Environment: Production, Preview, Development (all three)

   Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmY2N1dmRwYXR2bXBmc25tcHZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMjk4OTQsImV4cCI6MjA5MzkwNTg5NH0.nP4F74UvlG9uokm1nKFt8rjx06gXixg5XdCO9_tXWSs
   Environment: Production, Preview, Development (all three)

   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: [paste your service_role secret here]
   Environment: Production, Preview, Development (all three)

7. After adding env vars → click "Redeploy" → "Redeploy" button


## STEP 6 — CREATE YOUR FIRST ADMIN ACCOUNT
# ============================================================

This is a 3-step process:

STEP 6A — Set your Supabase Auth email settings:
1. Supabase Dashboard → Authentication → Email Templates
2. Make sure OTP email is enabled
3. Authentication → Settings → Enable "Email OTP"

STEP 6B — Log in for the first time:
1. Go to your Vercel URL (or localhost:3000)
2. Enter YOUR Gmail address
3. Check Gmail for the 6-digit code
4. Enter the code → you're logged in
   (You'll see a blank dashboard — normal, no role assigned yet)

STEP 6C — Promote yourself to admin:
1. Go to Supabase Dashboard → SQL Editor → New query
2. Run this (replace with your actual Gmail):

   UPDATE profiles
   SET role = 'admin', full_name = 'Your Name Here'
   WHERE email = 'youremail@gmail.com';

3. Refresh the dashboard → You now have full admin access!


## STEP 7 — INVITE AGENTS
# ============================================================

1. In the dashboard → Agents page → "Invite Member"
2. Enter their name, Gmail, and role (agent or admin)
3. Click "Copy Invite Link"
4. Send the link to them via WhatsApp/Telegram/etc.
5. They click the link → enter Gmail → receive OTP → done!


## TROUBLESHOOTING
# ============================================================

Problem: "Profile not set up yet" on dashboard
Fix: Run the UPDATE profiles query in Step 6C

Problem: Can't upload screenshots
Fix: Make sure the storage bucket "sale-screenshots" is Public in Supabase

Problem: OTP email not arriving
Fix: Check Supabase → Authentication → Settings → SMTP settings
     For production, configure a custom SMTP (SendGrid, Resend, etc.)

Problem: Build fails on Vercel
Fix: Check that all 3 environment variables are set correctly

Problem: "Failed to save sale"
Fix: Check Supabase → Table Editor → sales → verify columns match schema

Problem: Buyer history not updating
Fix: The trigger auto-runs on INSERT. Check: Supabase → Database → Triggers
     Confirm "before_sale_insert" trigger exists on the sales table

## SUPABASE AUTH EMAIL CONFIG (Important for Production)
# ============================================================

For OTP emails to work reliably in production:
1. Supabase Dashboard → Project Settings → Auth
2. Under "SMTP Settings" → configure with a real provider:
   - Resend (free tier available): https://resend.com
   - SendGrid: https://sendgrid.com
3. This prevents OTP emails going to spam
