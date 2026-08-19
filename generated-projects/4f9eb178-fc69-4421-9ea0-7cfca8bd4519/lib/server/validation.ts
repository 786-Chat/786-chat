import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  vip: z.boolean().optional().default(false),
});

export const customerUpdateSchema = customerSchema.partial();

export const reservationSchema = z.object({
  customer_id: z.number().int().positive(),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  booking_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  guests: z.number().int().positive(),
  special_request: z.string().optional().default(''),
  status: z.enum(['pending', 'confirmed', 'cancelled']).default('pending'),
});

export const reservationUpdateSchema = reservationSchema.partial();

export const productSchema = z.object({
  product_name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().min(1, 'Category is required'),
  cost_price: z.number().nonnegative(),
  selling_price: z.number().nonnegative(),
  vat_percent: z.number().nonnegative(),
  stock_quantity: z.number().int().nonnegative(),
  minimum_stock: z.number().int().nonnegative(),
  unit: z.enum(['Each', 'Kg', 'Gram', 'Litre', 'Box', 'Pack']),
  supplier: z.string().optional().default(''),
  active: z.boolean().optional().default(true),
  rotation_method: z.enum(['FIFO', 'FEFO', 'Manual']).optional().default('FIFO'),
  storage_type: z.enum(['Ambient / Room Temperature', 'Chilled', 'Frozen', 'Hot Holding', 'Dry Store', 'Custom']).optional().default('Ambient / Room Temperature'),
  min_temperature: z.number().nullable().optional(),
  max_temperature: z.number().nullable().optional(),
  last_stock_in_at: z.string().datetime().nullable().optional(),
  last_stock_out_at: z.string().datetime().nullable().optional(),
  last_stock_in_date: z.string().datetime().nullable().optional(),
  last_stock_out_date: z.string().datetime().nullable().optional(),
  used_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  best_before_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  use_by_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export const productUpdateSchema = productSchema.partial();

export const stockMovementSchema = z.object({
  product_id: z.number().int().positive(),
  movement_type: z.enum(['STOCK IN', 'STOCK OUT', 'WASTAGE']),
  qty_in: z.number().int().nonnegative().nullable().optional(),
  qty_out: z.number().int().nonnegative().nullable().optional(),
  previous_stock: z.number().int().nonnegative(),
  new_stock: z.number().int().nonnegative(),
  reference: z.string().optional().default(''),
  user_id: z.string().min(1),
  user_name: z.string().min(1),
  batch_number: z.string().optional(),
  batch_allocations: z.array(z.object({
    batch_id: z.number().int().positive(),
    batch_number: z.string(),
    qty: z.number().positive(),
  })).optional().default([]),
});

export const stockMovementQuerySchema = z.object({
  search: z.string().optional(),
  type: z.enum(['STOCK IN', 'STOCK OUT', 'WASTAGE']).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  productId: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
});

export const wastageSchema = z.object({
  product_id: z.number().int().positive(),
  qty: z.number().positive(),
  reason: z.string().min(1),
  other_reason: z.string().optional(),
  batch_id: z.number().int().positive().optional(),
  staff_pin: z.string().min(1),
  reference: z.string().optional().default(''),
});
