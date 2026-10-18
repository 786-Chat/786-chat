import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});

export const opportunitySchema = z.object({
  customer_id: z.string().min(1),
  stage: z.enum(["qualification", "proposal", "negotiation", "closed_won", "closed_lost"]),
  value: z.number().positive(),
  campaign: z.string().optional(),
});

export const activitySchema = z.object({
  customer_id: z.string().min(1),
  type: z.enum(["follow-up", "call", "email", "meeting"]),
  description: z.string().min(1),
  due_date: z.string().min(1),
});

export const bookingSchema = z.object({
  customer_id: z.string().min(1),
  opportunity_id: z.string().min(1),
  date: z.string().min(1),
  amount: z.number().positive(),
});
