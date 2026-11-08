# Backend Setup

## Prerequisites
- Node.js 18+
- Neon PostgreSQL database
- Resend account for email

## Environment Variables
Create a `.env.local` file with the following variables (never commit secrets):

- `DATABASE_URL` – Neon PostgreSQL connection string
- `AUTH_SECRET` – at least 32 characters, used for JWT signing
- `RESEND_API_KEY` – Resend API key
- `EMAIL_FROM` – verified sender email address
- `NODE_ENV` – `development`, `test`, or `production` (defaults to `development`)

## Setup Commands

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run database migrations:
   ```bash
   npm run migrate
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Migration Script
The migration script reads `sql/migrations/001_initial.sql` and applies it to the database using `DATABASE_URL`. It is idempotent and safe to run multiple times.

## API Routes
- `POST /api/auth/register` – register a new user
- `POST /api/auth/login` – login and create session
- `POST /api/auth/logout` – logout and destroy session
- `GET /api/auth/session` – get current session user
- `POST /api/auth/forgot-password` – request password reset email
- `POST /api/auth/reset-password` – reset password with token
- `POST /api/auth/verify-email` – verify email with token
- `POST /api/email` – send email (authenticated)

## Security Notes
- Passwords are hashed with bcryptjs.
- Session tokens are hashed before storage.
- JWT sessions are signed with `AUTH_SECRET`.
- All database queries use parameterized statements.
- Email sending uses Resend with idempotency keys.
