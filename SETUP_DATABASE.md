# Database Setup Instructions

## Quick Setup for Local Development

### Option 1: Use SQLite (Easiest for Local Development)

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. Update `.env`:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="uec-secret-key-change-in-production"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. Run:
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

### Option 2: Use PostgreSQL (For Production)

1. Install PostgreSQL or use a cloud service (Neon, Supabase, Railway)

2. Update `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/uec_math"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. Run:
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

## After Setup

You should have:
- 2 Teachers (teacher1@uec.com, teacher2@uec.com)
- 2 Students (student1@uec.com, student2@uec.com)
- 1 Admin (admin@uec.com)

All passwords: `teacher123`, `student123`, `admin123`

