import { z } from 'zod';

export const reservationSchema = z.object({
  customer_name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  booking_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  guests: z.number().int().min(1).max(20),
  special_request: z.string().optional().default(''),
});

export const reservationUpdateSchema = reservationSchema.partial();
