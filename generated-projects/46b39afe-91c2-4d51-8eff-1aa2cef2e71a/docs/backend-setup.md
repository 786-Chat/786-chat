# Backend Setup

## Environment Variables

- `DATABASE_URL`: Neon PostgreSQL connection string.

## Database Setup

1. Create a Neon PostgreSQL database.
2. Run `npm run migrate` to apply migrations.

## API Endpoints

- `GET /api/reservations` - List all reservations
- `POST /api/reservations` - Create a reservation
- `GET /api/reservations/:id` - Get a reservation
- `PATCH /api/reservations/:id` - Update a reservation
- `DELETE /api/reservations/:id` - Delete a reservation

## Validation

All inputs are validated using Zod.
