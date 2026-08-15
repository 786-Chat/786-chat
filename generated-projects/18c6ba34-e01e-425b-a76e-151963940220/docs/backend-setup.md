# Saffron Manager Test — Backend Setup

This document describes how to configure and run the backend for the Saffron Manager Test application.

## Prerequisites

- Node.js 18+ and npm
- A Neon PostgreSQL database (serverless)
- A Resend account for transactional email

## Environment Variables

Create a `.env.local` file in the project root with the following variables. **Never commit this file.**

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Neon PostgreSQL connection string (serverless driver) |
| `AUTH_SECRET` | Secret used to sign and verify session JWTs (at least 32 chars) |
| `RESEND_API_KEY` | Resend API key for sending email |
| `EMAIL_FROM` | Verified sender email address for Resend |

## Install Dependencies

```bash
npm install
```

## Database Migration

Run the migration script to create all tables. The script reads `DATABASE_URL` from the environment and applies `sql/migrations/001_initial.sql`.

```bash
npm run migrate
```

The migration is idempotent — it uses `CREATE TABLE IF NOT EXISTS` and can be run multiple times safely.

## Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Production Build

```bash
npm run build
npm start
```

## API Routes

All API routes are under `/api` and require authentication unless noted otherwise.

### Authentication (public bootstrap)

- `POST /api/auth/register` — create a new user account
- `POST /api/auth/login` — log in and create a session
- `POST /api/auth/logout` — destroy the current session
- `GET /api/auth/session` — return the current session user (if any)
- `POST /api/auth/forgot-password` — request a password reset email
- `POST /api/auth/reset-password` — reset password using a token
- `POST /api/auth/verify-email` — verify email using a token

### Email (authenticated)

- `POST /api/email` — send an email (requires a valid session)

## Security Notes

- Passwords are hashed with bcryptjs before storage.
- Session tokens and one-time tokens are hashed before persistence.
- Authentication cookies are `HttpOnly`, `SameSite=Lax`, `Secure` in production, and scoped to `Path=/`.
- All database queries use parameterized statements to prevent SQL injection.
- All API input is validated with Zod.
- The database connection is created lazily per request; no connection is opened at module load.

## Database Schema

The schema is defined in `sql/schema.sql` and mirrored in `sql/migrations/001_initial.sql`. It includes tables for users, sessions, email verification tokens, password reset tokens, customers, and reservations. All tables use `TIMESTAMPTZ` timestamps and include appropriate indexes.
