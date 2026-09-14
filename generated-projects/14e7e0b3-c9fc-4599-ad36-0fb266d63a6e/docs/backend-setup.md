# Backend Setup

## Prerequisites

- Node.js 18+
- Neon PostgreSQL database
- Resend account

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

- `DATABASE_URL` – Neon PostgreSQL connection string
- `AUTH_SECRET` – at least 32 characters, used for signing session JWTs
- `RESEND_API_KEY` – Resend API key for sending emails
- `EMAIL_FROM` – verified sender email address
- `NODE_ENV` – optional, defaults to `development`

## Setup Commands

```bash
npm install
npm run migrate
npm run dev
```

## Migration

The migration script applies `sql/migrations/001_initial.sql` to the database specified by `DATABASE_URL`.

## API Routes

- `POST /api/auth/register` – register a new user
- `POST /api/auth/login` – log in and create a session
- `POST /api/auth/logout` – log out and revoke session
- `GET /api/auth/session` – get current session user
- `POST /api/auth/forgot-password` – request password reset
- `POST /api/auth/reset-password` – reset password
- `POST /api/auth/verify-email` – verify email address
- `POST /api/email` – send email (authenticated)
