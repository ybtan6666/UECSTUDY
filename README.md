# UEC Learning Platform

A web application where students pay for teacher attention, not just content.

## Features

- **Course Marketplace**: Teachers create courses, students purchase and access them
- **Challenge System**: MCQ challenges with virtual coin rewards
- **Paid Q&A (Mode A)**: Students pay to ask questions with 7-day response guarantee
- **Book Teacher Time (Mode B)**: Students book consultation slots with teachers
- **Discussion**: Comments and replies under courses, challenges, and Q&A threads
- **User Profiles**: Separate views for students and teachers

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma (SQLite)
- NextAuth.js
- bcryptjs

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

3. Seed the database:
```bash
npm run db:seed
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Demo Accounts

- **Admin**: admin@uec.com / admin123
- **Teacher 1**: teacher1@uec.com / teacher123
- **Teacher 2**: teacher2@uec.com / teacher123
- **Student 1**: student1@uec.com / student123
- **Student 2**: student2@uec.com / student123

## Project Structure

```
/app              - Next.js app router pages
  /api            - API routes
  /auth           - Authentication pages
  /courses        - Course pages
  /challenges     - Challenge pages
  /qa             - Q&A pages
  /profile        - User profile
/components       - React components
/lib              - Utilities (Prisma, Auth)
/prisma           - Database schema and seed
```

## Notes

- Payment logic is mocked (no real payment processing)
- Refunds are simulated
- Virtual coins are stored in the database
- All timestamps use UTC

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel:

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables
5. Deploy!

**Note:** For production, you'll need a hosted database (PostgreSQL/MySQL). SQLite only works locally.

