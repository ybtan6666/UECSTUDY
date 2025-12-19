# Deployment Guide - GitHub

## Option 1: Vercel (Recommended - Easiest)

Vercel is the easiest way to deploy Next.js apps and works perfectly with GitHub.

### Steps:

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js
   - Add environment variables:
     - `DATABASE_URL` - You'll need to use a hosted database (see below)
     - `NEXTAUTH_SECRET` - Generate a random string
     - `NEXTAUTH_URL` - Your Vercel URL (auto-set)
   - Click "Deploy"

3. **Database Setup:**
   - For production, use a hosted database:
     - **Free options:**
       - [PlanetScale](https://planetscale.com) - MySQL
       - [Supabase](https://supabase.com) - PostgreSQL
       - [Railway](https://railway.app) - PostgreSQL
   - Update `prisma/schema.prisma` to use the new database
   - Run migrations: `npx prisma db push`
   - Seed data: `npm run db:seed`

## Option 2: GitHub Pages (Static Export)

Note: This requires converting to static export and won't support server-side features.

### Steps:

1. **Update `next.config.js`:**
   ```js
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'export',
     images: {
       unoptimized: true,
     },
   }
   module.exports = nextConfig
   ```

2. **Build and deploy:**
   ```bash
   npm run build
   # This creates an 'out' folder
   ```

3. **Use GitHub Actions** (create `.github/workflows/deploy.yml`):
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [ main ]
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - uses: actions/setup-node@v2
           with:
             node-version: '18'
         - run: npm install
         - run: npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./out
   ```

## Option 3: Railway (Full-Stack)

Railway supports Next.js with databases.

### Steps:

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub"
4. Select your repository
5. Add PostgreSQL database
6. Set environment variables
7. Deploy!

## Environment Variables for Production

```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_SECRET="generate-a-random-secret-here"
NEXTAUTH_URL="https://your-domain.com"
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

## Important Notes

- **Database**: SQLite won't work in production. Use PostgreSQL, MySQL, or similar.
- **File Storage**: If you add file uploads, use cloud storage (S3, Cloudinary, etc.)
- **Secrets**: Never commit `.env` files to GitHub
- **Build**: Make sure `npm run build` works locally before deploying

## Quick Vercel Deploy

The fastest way:

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts
4. Your app will be live!

