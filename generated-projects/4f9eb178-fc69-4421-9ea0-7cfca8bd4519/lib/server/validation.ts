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
});
