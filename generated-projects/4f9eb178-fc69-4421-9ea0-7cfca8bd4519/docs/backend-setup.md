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
- `POST /api/products` - Create a product (supports `rotation_method`, `storage_type`, `min_temperature`, `max_temperature`)
- `GET /api/products/:id` - Get a product
- `PATCH /api/products/:id` - Update a product (supports stock details fields, `rotation_method`, `storage_type`, `min_temperature`, `max_temperature`)
- `DELETE /api/products/:id` - Delete a product

### Stock Movements
- `GET /api/stock-movements` - List stock movements with filters and pagination (includes batch info)
- `POST /api/stock-movements/transaction` - Record a stock in/out transaction (updates product stock, batch quantities, and movement record atomically; accepts optional `received_temperature` for stock in)

### Stock Batches
- `GET /api/stock-batches?productId=1` - List batches for a product

## Validation

All POST and PATCH endpoints use Zod schemas defined in `lib/server/validation.ts`.
