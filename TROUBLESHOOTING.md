# Troubleshooting Sign In Issues

## Error: "Sign in failed: CredentialsSignin"

This error means NextAuth couldn't authenticate your credentials. Here's how to fix it:

### Step 1: Verify Database Has Users

1. Visit: `http://localhost:3000/api/test-db`
2. Check if it shows users exist

### Step 2: Check Server Console

Look at the terminal where you ran `npm run dev`. You should see logs like:
```
[AUTH] Attempting to authenticate: student1@uec.com
[AUTH] Database connected
[AUTH] User found: student1@uec.com Role: STUDENT
```

If you see errors, note them down.

### Step 3: Test User Credentials

Visit: `http://localhost:3000/api/check-user` (POST request with email and password)

Or use this in browser console:
```javascript
fetch('/api/check-user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'student1@uec.com', password: 'student123' })
}).then(r => r.json()).then(console.log)
```

### Step 4: Regenerate Prisma Client

If Prisma client is out of sync:

```bash
# Stop the dev server first (Ctrl+C)
npx prisma generate
# Restart dev server
npm run dev
```

### Step 5: Reset Database (Last Resort)

```bash
# WARNING: This deletes all data
npx prisma db push --force-reset
npm run db:seed
```

### Common Causes:

1. **Prisma client not generated** → Run `npx prisma generate`
2. **Database not seeded** → Run `npm run db:seed`
3. **Wrong password** → Use: `student123`, `teacher123`, or `admin123`
4. **Database connection issue** → Check `.env` file has correct `DATABASE_URL`
5. **Dev server needs restart** → Stop and restart `npm run dev` after Prisma changes

### Correct Credentials:

- **Student**: `student1@uec.com` / `student123`
- **Teacher**: `teacher1@uec.com` / `teacher123`
- **Admin**: `admin@uec.com` / `admin123`

