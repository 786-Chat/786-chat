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
Run the schema:
```bash
psql $DATABASE_URL -f sql/schema.sql
```

Or apply migrations:
```bash
npm run migrate
```

## API Endpoints
- `GET /api/reservations` - List all reservations
- `POST /api/reservations` - Create a reservation
- `GET /api/reservations/:id` - Get a reservation
- `PATCH /api/reservations/:id` - Update a reservation
- `DELETE /api/reservations/:id` - Delete a reservation

All API requests must include header `x-company-id: saffron`.

## Development
```bash
npm install
npm run dev
```
