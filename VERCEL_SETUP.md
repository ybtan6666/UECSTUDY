# Vercel Deployment Setup Guide

## Step-by-Step Instructions

### 1. Set Up Production Database

**Option A: Use Vercel Postgres (Easiest)**
1. In your Vercel project dashboard
2. Go to "Storage" tab
3. Click "Create Database" → "Postgres"
4. Copy the connection string

**Option B: Use External Database**
- **Free options:**
  - [Neon](https://neon.tech) - Free PostgreSQL
  - [Supabase](https://supabase.com) - Free PostgreSQL
  - [Railway](https://railway.app) - Free tier available

### 2. Update Prisma Schema for PostgreSQL

**IMPORTANT:** Before deploying, you need to switch from SQLite to PostgreSQL:

1. Copy `prisma/schema.postgres.prisma` to `prisma/schema.prisma`
2. Or manually change line 9 in `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"  // Changed from "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

### 3. Set Environment Variables in Vercel

In your Vercel project dashboard → Settings → Environment Variables:

1. **DATABASE_URL**
   - Value: Your PostgreSQL connection string
   - Example: `postgresql://user:password@host:5432/dbname?sslmode=require`

2. **NEXTAUTH_SECRET**
   - Generate: `openssl rand -base64 32`
   - Or use: https://generate-secret.vercel.app/32

3. **NEXTAUTH_URL**
   - Value: `https://your-project.vercel.app`
   - Vercel will auto-set this, but you can override

### 4. Deploy

1. Push your code to GitHub (if not already)
2. In Vercel dashboard, click "Deploy"
3. Wait for build to complete

### 5. Run Database Migrations

After first deployment:

1. Go to Vercel project → Settings → Environment Variables
2. Add a new variable: `DATABASE_URL` (if not already set)
3. In Vercel dashboard, go to "Deployments"
4. Click on the latest deployment → "Redeploy"
5. Or use Vercel CLI:
   ```bash
   vercel env pull .env.local
   npx prisma migrate deploy
   npx prisma db seed
   ```

### 6. Seed Initial Data

After database is set up, you can seed it:

**Option A: Using Vercel CLI**
```bash
vercel env pull .env.local
npm run db:seed
```

**Option B: Create a seed API route** (temporary)
Create `app/api/seed/route.ts` and call it once, then delete it.

## Troubleshooting

### Build Fails with Prisma Error
- Make sure `postinstall` script runs: `"postinstall": "prisma generate"`
- Check that `DATABASE_URL` is set in Vercel

### Database Connection Error
- Verify `DATABASE_URL` format is correct
- Check if database allows connections from Vercel IPs
- For Neon/Supabase: Make sure connection pooling is enabled

### Session Not Working
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your Vercel domain
- Clear browser cookies and try again

## Quick Checklist

- [ ] Database created (PostgreSQL)
- [ ] `DATABASE_URL` set in Vercel
- [ ] `NEXTAUTH_SECRET` generated and set
- [ ] `NEXTAUTH_URL` set to your Vercel domain
- [ ] Prisma schema updated to use `postgresql`
- [ ] Code pushed to GitHub
- [ ] Vercel project connected to GitHub repo
- [ ] Build successful
- [ ] Database migrations run
- [ ] Seed data added

## After Deployment

Your app will be live at: `https://your-project.vercel.app`

Test with demo accounts:
- Student: `student1@uec.com` / `student123`
- Teacher: `teacher1@uec.com` / `teacher123`

