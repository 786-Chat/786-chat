// Credit packages for top-up
export interface CreditPackage {
  id: string
  name: string
  credits: number
  priceInCents: number
  popular?: boolean
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "credits-10",
    name: "10 Credits",
    credits: 10,
    priceInCents: 1000, // $10
  },
  {
    id: "credits-20",
    name: "20 Credits",
    credits: 20,
    priceInCents: 2000, // $20
    popular: true,
  },
  {
    id: "credits-50",
    name: "50 Credits",
    credits: 50,
    priceInCents: 5000, // $50
  },
  {
    id: "credits-100",
    name: "100 Credits",
    credits: 100,
    priceInCents: 10000, // $100
  },
]

// Calculate fees and taxes
export function calculateOrderTotal(priceInCents: number) {
  const processingFee = 59 // $0.59 fixed fee
  const taxRate = 0.0825 // 8.25% estimated tax
  const subtotal = priceInCents
  const tax = Math.round(subtotal * taxRate)
  const total = subtotal + processingFee + tax
  
  return {
    subtotal,
    processingFee,
    tax,
    total,
  }
}
