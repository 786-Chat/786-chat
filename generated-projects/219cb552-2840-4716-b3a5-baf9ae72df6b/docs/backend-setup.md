# Saffron Manager Test — Backend Setup

This document describes how to configure and run the backend for the Saffron Manager Test application.

## Prerequisites

- Node.js 18+ and npm
- A Neon PostgreSQL database
- A Resend account for email delivery

## Environment Variables

Create a `.env.local` file in the project root with the following variables. Never commit this file.

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `AUTH_SECRET` | Secret used to sign and verify session JWTs |
| `RESEND_API_KEY` | Resend API key for sending transactional email |
| `EMAIL_FROM` | Verified sender email address for outgoing mail |

## Setup Commands

1. Install dependencies:

   ```bash
   npm install
   ```

2. Apply the database schema:

   ```bash
   npm run migrate
   ```

   This runs `scripts/migrate.mjs`, which applies `sql/migrations/001_initial.sql` to the database specified by `DATABASE_URL`.

3. Start the development server:

   ```bash
   npm run dev
   ```

## Database Migration

The initial schema is defined in `sql/schema.sql` and `sql/migrations/001_initial.sql`. The migration is idempotent and safe to run multiple times.

To re-run the migration manually:

```bash
node scripts/migrate.mjs
```

## Authentication

Authentication is handled server-side using HttpOnly cookies and JWTs signed with `AUTH_SECRET`. Public bootstrap routes are available at:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/verify-email`

All other API routes require a valid session.

## Email

Transactional email is sent via Resend using `RESEND_API_KEY` and `EMAIL_FROM`. The email service is server-only and never exposes provider credentials to the browser.

## API Routes

Protected API routes for customers and reservations:

- `GET/POST /api/customers`
- `GET/PATCH/DELETE /api/customers/[id]`
- `GET/POST /api/reservations`
- `GET/PATCH/DELETE /api/reservations/[id]`

All routes enforce authentication and tenant ownership.
