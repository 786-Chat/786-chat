# Backend Setup

1. Create a Neon PostgreSQL database.
2. Set the environment variable `DATABASE_URL` to your Neon connection string.
3. Set `AUTH_SECRET` to a random string of at least 32 characters.
4. Set `BLOB_READ_WRITE_TOKEN` to your Vercel Blob token.
5. Set `RESEND_API_KEY` and `EMAIL_FROM` for email.
6. Run `npm run migrate` to apply the initial migration.
7. Start the app with `npm run dev`.

Environment variables required: `DATABASE_URL`, `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `EMAIL_FROM`.
