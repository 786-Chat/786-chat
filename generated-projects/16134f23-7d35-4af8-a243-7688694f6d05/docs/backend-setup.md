# Backend Setup with Neon PostgreSQL

This project integrates a Neon PostgreSQL database to manage customers.

## Environment Variables

Set the following environment variable in your deployment environment (do not commit secrets):

- `DATABASE_URL` — the Neon PostgreSQL connection string

## Database Schema

The database contains `customers` and `audit_logs` tables. See `sql/schema.sql`.

## Migration

Run the migration with:

```bash
node scripts/migrate.mjs
```

## API

- `GET /api/customers` — list customers
- `POST /api/customers` — create a customer
- `PATCH /api/customers/[id]` — update a customer
- `DELETE /api/customers/[id]` — delete a customer
