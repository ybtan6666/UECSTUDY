# 🚀 How to Run the Application

## Step 1: Start the Development Server

Open a terminal in the project folder and run:

```bash
npm run dev
```

## Step 2: Access the Application

Once the server starts, you'll see:
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Ready in Xs
```

**Open your browser and go to:**
```
http://localhost:3000
```

## Step 3: Sign In

Use these credentials:
- **Student**: `student1@uec.com` / `student123`
- **Teacher**: `teacher1@uec.com` / `teacher123`
- **Admin**: `admin@uec.com` / `admin123`

## 🔧 If Port 3000 is Already in Use

If you see an error like "Port 3000 is already in use", you can:

1. **Use a different port:**
   ```bash
   npm run dev -- -p 3001
   ```
   Then access: `http://localhost:3001`

2. **Or stop the process using port 3000:**
   ```powershell
   # Find and stop process on port 3000
   Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess | Stop-Process -Force
   ```

## 📝 Quick Start Checklist

- [ ] Run `npm run dev`
- [ ] Wait for "Ready" message
- [ ] Open browser to `http://localhost:3000`
- [ ] Sign in with `student1@uec.com` / `student123`

## 🌐 Available URLs

- **Homepage**: http://localhost:3000
- **Sign In**: http://localhost:3000/auth/signin
- **Sign Up**: http://localhost:3000/auth/signup
- **Dashboard**: http://localhost:3000/dashboard (after sign in)
- **Teachers**: http://localhost:3000/teachers (after sign in)
- **Questions**: http://localhost:3000/questions (after sign in)

