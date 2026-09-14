# Bean House Backend Setup

## Environment Variables

- `DATABASE_URL` – Neon PostgreSQL connection string
- `AUTH_SECRET` – Secret for signing JWTs (min 32 chars)
- `RESEND_API_KEY` – Resend API key for email
- `EMAIL_FROM` – Sender email address
- `NODE_ENV` – `development`, `test`, or `production`

## Setup Commands

1. Install dependencies: `npm install`
2. Run migrations: `npm run migrate`
3. Start development server: `npm run dev`
4. Build for production: `npm run build`

## Database

- Schema: `sql/schema.sql`
- Migration: `sql/migrations/001_initial.sql`
- Migration script: `scripts/migrate.mjs`

## API Routes

- `POST /api/auth/register` – Register a new user
- `POST /api/auth/login` – Login and set session cookie
- `POST /api/auth/logout` – Logout and clear session
- `GET /api/auth/session` – Get current session
- `POST /api/auth/forgot-password` – Send password reset email
- `POST /api/auth/reset-password` – Reset password
- `POST /api/auth/verify-email` – Verify email address
- `POST /api/email` – Send contact form email (authenticated)
