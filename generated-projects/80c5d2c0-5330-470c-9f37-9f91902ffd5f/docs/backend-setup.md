# Backend Setup

1. Create a Neon PostgreSQL database.
2. Set the environment variable `DATABASE_URL` to your Neon connection string.
3. Run `npm run migrate` to apply the initial migration.
4. Start the app with `npm run dev`.

Environment variables required: `DATABASE_URL`.
