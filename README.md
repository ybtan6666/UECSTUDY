# UEC Math Q&A Marketplace

A minimal MVP web application for paid Mathematics Q&A for Malaysian UEC students. This is a two-sided marketplace where students can post paid questions or book teacher time, and teachers can accept jobs and get paid.

## Features

### Feature A: Paid Question & Answer (Asynchronous)
- Students submit math questions via text, image, audio, or video
- Two modes: select specific teacher or open marketplace
- Set price (minimum MYR 5) and expected response time (6h, 24h, or 72h)
- Payment held in escrow until completion
- Auto-refund if not answered within deadline
- Follow-up questions supported (treated as new paid sub-orders)

### Feature B: Teacher Booking / Consultation (Synchronous)
- Students browse teacher availability and book time slots
- Teachers set available time slots with minimum price
- Individual or group sessions
- Submit topic, expectations, and preferred format
- Full refund if teacher cancels, no refund if student no-shows

### Payment & State Machine
- Clear states: PENDING, ACCEPTED, ANSWERED, COMPLETED, CANCELLED, EXPIRED, REFUNDED
- Platform takes 15% commission only on completed orders
- All transitions logged in OrderLog

### Teacher Ranking
- Based on endorsements (not star ratings)
- Students can endorse teachers only once per lifetime, after completed transaction
- Ranking priority:
  1. Total endorsements (desc)
  2. Completed answers in last 30 days (desc)
  3. Recent activity (desc)

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Prisma** (PostgreSQL)
- **NextAuth.js** (Authentication)
- **Tailwind CSS** (Styling)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (`.env`):
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="uec-secret-key-change-in-production"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

7. Check database at [http://localhost:5555](http://localhost:5555) (Prisma Studio, open another terminal):
   ```bash
   npx prisma studio
   ```

## Demo Accounts

After seeding:

- **Admin**: admin@uec.com / admin123
- **Teacher 1**: teacher1@uec.com / teacher123
- **Teacher 2**: teacher2@uec.com / teacher123
- **Student 1**: student1@uec.com / student123
- **Student 2**: student2@uec.com / student123

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── questions/        # Question API routes
│   │   ├── bookings/         # Booking API routes
│   │   ├── slots/            # Time slot API routes
│   │   ├── teachers/         # Teacher listing API
│   │   └── endorsements/     # Endorsement API
│   ├── questions/            # Question pages
│   ├── bookings/             # Booking pages
│   ├── slots/                # Time slot management (teachers)
│   ├── teachers/             # Teacher listing and profiles
│   ├── admin/                # Admin panel
│   └── dashboard/            # User dashboard
├── components/
│   └── Navbar.tsx            # Navigation component
├── lib/
│   ├── prisma.ts             # Prisma client
│   ├── auth.ts               # NextAuth configuration
│   └── utils.ts              # Utility functions
└── prisma/
    ├── schema.prisma         # Database schema
    └── seed.ts               # Seed data
```

## Key Business Rules

1. **Student can cancel question only while status is PENDING**
2. **Once teacher accepts, question is locked**
3. **System auto-cancels and refunds if:**
   - No teacher accepts within selected response window
   - Question not answered within 7 days
4. **All payments held in escrow and released only upon completion**
5. **Follow-up questions treated as new paid sub-orders**
6. **Group bookings require minimum participants or auto-refund**
7. **Platform takes commission only from completed orders**

## Deployment

See `DEPLOYMENT.md` and `VERCEL_SETUP.md` for deployment instructions.

## License

MIT
