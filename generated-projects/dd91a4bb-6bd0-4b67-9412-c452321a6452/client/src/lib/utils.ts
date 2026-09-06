import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const SUPPORTED_CURRENCIES = [
  { code: "PKR", symbol: "Rs", label: "Pakistani Rupee (Rs)" },
  { code: "GBP", symbol: "£", label: "British Pound (£)" },
  { code: "USD", symbol: "$", label: "US Dollar ($)" },
  { code: "EUR", symbol: "€", label: "Euro (€)" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham" },
  { code: "INR", symbol: "₹", label: "Indian Rupee (₹)" },
  { code: "SAR", symbol: "﷼", label: "Saudi Riyal" },
];

export function getCurrencySymbol(code?: string | null): string {
  if (!code) return "Rs";
  const found = SUPPORTED_CURRENCIES.find(c => c.code === code.toUpperCase());
  return found ? found.symbol : code;
}

export function formatPrice(amount: number | string | null | undefined, code?: string | null): string {
  const sym = getCurrencySymbol(code);
  const n = Number(amount || 0);
  return `${sym} ${n.toLocaleString()}`;
}
