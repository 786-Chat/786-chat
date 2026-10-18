# NorthStar Logistics Backend Setup

## Prerequisites
- Node.js 18+
- Neon PostgreSQL database

## Environment Variables
Create a `.env` file (not committed) with:
- `DATABASE_URL` – Neon connection string
- `AUTH_SECRET` – at least 32 characters
- `RESEND_API_KEY` – optional, for email
- `EMAIL_FROM` – optional, sender email
- `APP_URL` – default `http://localhost:3000`

## Setup Commands
```bash
npm install
npm run migrate
npm run dev
```

## Migration
Migrations are in `sql/migrations/001_initial.sql`. Run with `npm run migrate`.

## API Routes
- `POST /api/auth/register` – register user
- `POST /api/auth/login` – login
- `POST /api/auth/logout` – logout
- `GET /api/auth/session` – get current session
- `POST /api/auth/forgot-password` – request reset
- `POST /api/auth/reset-password` – reset password
- `POST /api/auth/verify-email` – verify email
- `POST /api/email` – send email (authenticated)

## Database Tables
- `users`, `sessions`, `email_verification_tokens`, `password_reset_tokens`, `customers`, `orders`

## Notes
- All database access uses parameterized queries via Neon.
- Passwords hashed with bcryptjs.
- Sessions signed with jose.
