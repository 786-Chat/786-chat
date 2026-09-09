# Backend Setup

## Prerequisites
- Node.js 18+
- Neon PostgreSQL database

## Environment Variables
Create a `.env.local` file with:
```
DATABASE_URL=your_neon_connection_string
```

## Database Setup
Run the schema and migration files against your Neon database:
```bash
psql $DATABASE_URL -f sql/schema.sql
psql $DATABASE_URL -f sql/migrations/001_initial.sql
```

Or use the migration script:
```bash
node scripts/migrate.mjs
```

## API Endpoints
- `GET /api/reservations` - List all reservations
- `POST /api/reservations` - Create a reservation
- `GET /api/reservations/[id]` - Get a reservation
- `PATCH /api/reservations/[id]` - Update a reservation
- `DELETE /api/reservations/[id]` - Delete a reservation

## Validation
All API inputs are validated using Zod schemas in `lib/server/validation.ts`.
