# Raja Catering Backend Setup

## Environment Variables

- `DATABASE_URL` – Neon PostgreSQL connection string
- `AUTH_SECRET` – Secret for signing JWTs (min 32 chars)
- `BLOB_READ_WRITE_TOKEN` – Vercel Blob token (optional, required only for uploads)
- `RESEND_API_KEY` – Resend API key (optional, required only for email)
- `EMAIL_FROM` – Verified sender email (optional, required only for email)
- `APP_URL` – Public app URL (default http://localhost:3000)

## Setup Commands

```bash
npm install
npm run migrate
npm run dev
```

## Migration

Run `npm run migrate` to apply `sql/migrations/001_initial.sql`.

## Notes

- Never commit `.env` files or credentials.
- All Blob paths are scoped to the authenticated user/tenant.
- If `BLOB_READ_WRITE_TOKEN` is not set, upload APIs return `Document storage is not configured`.
