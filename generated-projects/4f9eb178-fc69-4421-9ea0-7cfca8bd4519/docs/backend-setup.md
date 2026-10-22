# Backend Setup

## Environment Variables

- `DATABASE_URL`: Neon PostgreSQL connection string (required at runtime, not at build time)

## Database Setup

1. Create a Neon PostgreSQL database.
2. Run `npm run migrate` to apply all migrations in `sql/migrations/`.

## API Endpoints

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create a customer (accepts `vip` boolean)
- `GET /api/customers/:id` - Get a customer
- `PATCH /api/customers/:id` - Update a customer (accepts `vip` boolean)
- `DELETE /api/customers/:id` - Delete a customer

### Reservations
- `GET /api/reservations` - List all reservations (with customer name and VIP status)
- `POST /api/reservations` - Create a reservation
- `GET /api/reservations/:id` - Get a reservation
- `PATCH /api/reservations/:id` - Update a reservation
- `DELETE /api/reservations/:id` - Delete a reservation

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create a product

## Validation

All POST and PATCH endpoints use Zod schemas defined in `lib/server/validation.ts`.
