# Quick Fix Guide

## If you cannot sign in or see teachers:

### Step 1: Check Database Status
Visit: `http://localhost:3000/api/test-db`

This will show you:
- If database is connected
- How many users exist
- List of teachers and students

### Step 2: Reset and Seed Database

```bash
# Reset database (WARNING: This deletes all data)
npx prisma db push --force-reset

# Seed database (creates teachers, students, admin)
npm run db:seed
```

### Step 3: Verify Users Were Created

After seeding, you should see:
- 2 Teachers
- 2 Students  
- 1 Admin

### Step 4: Test Sign In

Try signing in with:
- **Student**: `student1@uec.com` / `student123`
- **Teacher**: `teacher1@uec.com` / `teacher123`
- **Admin**: `admin@uec.com` / `admin123`

### Step 5: Check Teachers Page

After signing in as a student, go to `/teachers` - you should see 2 teachers.

## Common Issues:

1. **"No teachers available"** → Run `npm run db:seed`
2. **"Invalid email or password"** → Make sure database is seeded
3. **Database connection error** → Check `.env` file has correct `DATABASE_URL`

## Still Having Issues?

1. Check server console (where `npm run dev` is running) for error messages
2. Check browser console (F12) for client-side errors
3. Visit `/api/test-db` to see database status

