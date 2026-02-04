# Pontea Deployment Guide

This repository uses a **branch-based deployment strategy** to separate the MVP landing page from the full educational platform.

## Branch Structure

```
├── main (production)          → pontea.com
│   └── MVP Landing Site: Landing + Pricing + Consultation
│       - No authentication
│       - No database connection
│       - Minimal dependencies
│
└── develop (platform)         → pontea-dev.vercel.app
    └── Full Platform: All features
        - Authentication & user management
        - Test engine with server-synced timers
        - Admin dashboard & question management
        - Practice & timed test modes
```

## Vercel Setup

### Step 1: Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository: `milonrus/Pontea-website-MVP`
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist` (as configured in next.config.mjs)

### Step 2: Configure Branch Deployments

In Vercel project settings:

1. Go to **Settings** → **Git**
2. Set **Production Branch**: `main`
3. Enable **Automatic Deployments** from Git
4. The `develop` branch will automatically get preview deployments

### Step 3: Configure Domain Mapping

1. Go to **Settings** → **Domains**
2. Add custom domain: `pontea.com` (or your domain)
3. Point to `main` branch
4. The develop branch will be available at: `pontea-dev.vercel.app` or `pontea-git-develop.vercel.app`

### Step 4: Environment Variables

#### Production Branch (`main`)

Set these environment variables for the **main branch only**:

```env
NEXT_PUBLIC_APP_URL=https://pontea.com
```

**Note**: The MVP landing page does NOT require Supabase or OpenAI keys.

#### Preview Branch (`develop`)

Set these environment variables for the **develop branch**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://jfypqwmtrmleiyxxnlfv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmeXBxd210cm1sZWl5eHhubGZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTk1MzksImV4cCI6MjA4NDg3NTUzOX0.7NIX73DZjHyj1u8nol3PpLJC3crScO3EAfCaBlfyc7E
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmeXBxd210cm1sZWl5eHhubGZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5OTUzOSwiZXhwIjoyMDg0ODc1NTM5fQ.xOLqzsyaPpoEfA5A5GQELupzjs6AgULYc82SPCE4wVA
OPENAI_API_KEY=<your-openai-api-key>
NEXT_PUBLIC_APP_URL=https://pontea-dev.vercel.app
```

#### How to Set Branch-Specific Environment Variables

In Vercel:
1. Go to **Settings** → **Environment Variables**
2. Add each variable
3. Under "Environments", select:
   - **Production** for main branch variables
   - **Preview** for develop branch variables
4. You can further restrict to specific branches using the "Git Branch" field

## Git Workflow

### Working on the MVP Landing Page

```bash
git checkout main
# Make changes to landing pages, pricing, consultation
git add .
git commit -m "Update pricing tiers"
git push origin main
# Auto-deploys to pontea.com
```

### Working on Platform Features

```bash
git checkout develop
# Build new features, test engine improvements, etc.
git add .
git commit -m "Add new question type"
git push origin develop
# Auto-deploys to pontea-dev.vercel.app
```

### Sharing Preview Links

For feature branches that you want to share:

```bash
git checkout -b feature/new-ui develop
# Make changes
git push origin feature/new-ui
# Vercel creates: pontea-git-feature-new-ui.vercel.app
# Share this URL with stakeholders for feedback
```

### Syncing Shared Components

If you update a shared component (like Button, Header) in one branch and want it in the other:

```bash
# Copy a specific commit from develop to main
git checkout main
git cherry-pick <commit-hash-from-develop>
git push origin main
```

**Caution**: Generally avoid merging branches - they serve different purposes.

## Deployment Checklist

### Before Deploying Main Branch

- [ ] Test build locally: `npm run build`
- [ ] Verify all links work
- [ ] Check mobile responsiveness
- [ ] Proofread all copy
- [ ] Ensure no auth/database dependencies

### Before Deploying Develop Branch

- [ ] Test build with environment variables
- [ ] Verify authentication works
- [ ] Test critical user flows (login, practice, tests)
- [ ] Check admin dashboard access
- [ ] Verify Supabase connection

## Monitoring & Debugging

### View Deployment Logs

1. Go to Vercel Dashboard → Your Project
2. Click on a deployment
3. View **Build Logs** and **Runtime Logs**

### Test Locally

**Main branch (MVP)**:
```bash
git checkout main
npm install
npm run dev
# Visit http://localhost:3000
```

**Develop branch (Platform)**:
```bash
git checkout develop
npm install
# Ensure .env file has all required variables
npm run dev
# Visit http://localhost:3000
```

## Rollback Strategy

If a deployment breaks:

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." menu → "Promote to Production"
4. Or: Git revert the problematic commit and push

## Future Enhancements

### Stage 1: Current Setup
- Single Vercel project with branch deployments
- Shared Supabase (develop branch only)
- Manual updates to landing page

### Stage 2: Add Stripe (After MVP Launch)
- Integrate Stripe checkout on main branch
- Add STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY environment variables
- Implement webhook endpoints for payment processing

### Stage 3: Separate Databases (When Scaling)
- Create production Supabase project
- Migrate schema (no test data)
- Update production environment variables
- Keep development Supabase isolated

### Stage 4: Advanced CI/CD
- Add automated tests
- Implement staging environment
- Set up preview comments on PRs
- Add performance monitoring

## Support

For Vercel-specific issues:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

For repository issues:
- Check GitHub Issues
- Contact repository maintainers
