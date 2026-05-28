import 'server-only'

import Stripe from 'stripe'

// Lazy-load Stripe to avoid build-time errors
let stripeInstance: Stripe | null = null

export function getStripe() {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return stripeInstance
}

// Export stripe as a proxy for backward compatibility
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop]
  }
}) as Stripe
