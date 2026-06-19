// Restaurant Data Types & Mock Data Layer
// This can be replaced with SQL queries from lib/db.ts when connected

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image?: string
  tags: string[]
  popular?: boolean
  spicy?: boolean
  vegetarian?: boolean
  glutenFree?: boolean
}

export interface RestaurantInfo {
  name: string
  tagline: string
  description: string
  heroImage: string
  logoUrl: string
  address: string
  phone: string
  email: string
  openingHours: {
    day: string
    hours: string
  }[]
  socialLinks: {
    instagram?: string
    facebook?: string
    twitter?: string
    tiktok?: string
  }
}

export interface Testimonial {
  id: string
  name: string
  avatar: string
  rating: number
  text: string
  date: string
}

export interface Reservation {
  id: string
  name: string
  email: string
  phone: string
  date: string
  time: string
  guests: number
  notes?: string
  createdAt: string
}

// ============ MOCK DATA ============

export const DEFAULT_RESTAURANT: RestaurantInfo = {
  name: "La Maison",
  tagline: "Experience Fine Dining at Its Best",
  description:
    "Nestled in the heart of the city, La Maison offers an unforgettable culinary journey. Our award-winning chefs craft each dish with passion, using the freshest locally-sourced ingredients. From intimate dinners to grand celebrations, every visit is a masterpiece of flavor and elegance.",
  heroImage: "",
  logoUrl: "",
  address: "123 Gourmet Street, London, W1D 3AF",
  phone: "+44 20 7946 0958",
  email: "reservations@lamaison.co.uk",
  openingHours: [
    { day: "Monday - Thursday", hours: "12:00 PM - 10:00 PM" },
    { day: "Friday - Saturday", hours: "12:00 PM - 11:30 PM" },
    { day: "Sunday", hours: "10:00 AM - 9:00 PM" },
  ],
  socialLinks: {
    instagram: "https://instagram.com/lamaison",
    facebook: "https://facebook.com/lamaison",
    twitter: "https://twitter.com/lamaison",
    tiktok: "https://tiktok.com/@lamaison",
  },
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "1",
    name: "Pan-Seared Foie Gras",
    description: "Caramelized apple, brioche toast, Sauternes gelée",
    price: 28,
    category: "Starters",
    tags: ["signature", "chef's special"],
    popular: true,
  },
  {
    id: "2",
    name: "Truffle Risotto",
    description: "Arborio rice, wild mushrooms, Parmigiano-Reggiano, black truffle shavings",
    price: 24,
    category: "Starters",
    tags: ["vegetarian", "truffle"],
    vegetarian: true,
    glutenFree: true,
    popular: true,
  },
  {
    id: "3",
    name: "Lobster Bisque",
    description: "Brandy cream, chive oil, lobster tail medallion",
    price: 22,
    category: "Starters",
    tags: ["seafood"],
    glutenFree: true,
  },
  {
    id: "4",
    name: "Beef Wellington",
    description: "Prime fillet steak, mushroom duxelles, prosciutto, puff pastry, red wine jus",
    price: 48,
    category: "Mains",
    tags: ["signature", "chef's special"],
    popular: true,
  },
  {
    id: "5",
    name: "Roasted Rack of Lamb",
    description: "Herb crust, ratatouille Provençale, rosemary jus",
    price: 42,
    category: "Mains",
    tags: ["signature"],
    glutenFree: true,
  },
  {
    id: "6",
    name: "Pan-Seared Sea Bass",
    description: "Saffron beurre blanc, fennel confit, samphire",
    price: 36,
    category: "Mains",
    tags: ["seafood", "healthy"],
    glutenFree: true,
  },
  {
    id: "7",
    name: "Wild Mushroom Tagliatelle",
    description: "Fresh pasta, porcini, chanterelle, thyme cream sauce, aged pecorino",
    price: 26,
    category: "Mains",
    tags: ["vegetarian"],
    vegetarian: true,
  },
  {
    id: "8",
    name: "Dark Chocolate Fondant",
    description: "Valrhona chocolate, vanilla bean ice cream, gold leaf",
    price: 16,
    category: "Desserts",
    tags: ["signature"],
    popular: true,
    vegetarian: true,
  },
  {
    id: "9",
    name: "Crème Brûlée",
    description: "Madagascar vanilla, caramelized sugar, fresh berries",
    price: 14,
    category: "Desserts",
    tags: ["classic"],
    vegetarian: true,
    glutenFree: true,
  },
  {
    id: "10",
    name: "Selection of Artisan Cheeses",
    description: "British & French cheeses, quince paste, walnut bread, fig compote",
    price: 18,
    category: "Desserts",
    tags: ["cheese", "sharing"],
    vegetarian: true,
  },
  {
    id: "11",
    name: "Classic Martini",
    description: "Gordon's gin, dry vermouth, lemon twist, olives",
    price: 16,
    category: "Cocktails",
    tags: ["classic", "gin"],
  },
  {
    id: "12",
    name: "Espresso Martini",
    description: "Vodka, Kahlúa, fresh espresso, vanilla syrup",
    price: 18,
    category: "Cocktails",
    tags: ["coffee", "popular"],
    popular: true,
  },
]

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "1",
    name: "Sarah Mitchell",
    avatar: "",
    rating: 5,
    text: "An absolutely divine dining experience. The Beef Wellington was perfection itself, and the service was impeccable. We'll definitely be returning for our anniversary.",
    date: "2024-12-15",
  },
  {
    id: "2",
    name: "James Harrington",
    avatar: "",
    rating: 5,
    text: "La Maison sets the standard for fine dining in London. Every dish tells a story, and the wine pairing recommendations were spot-on. A true gem.",
    date: "2024-11-28",
  },
  {
    id: "3",
    name: "Elena Rossi",
    avatar: "",
    rating: 5,
    text: "The tasting menu was a journey through culinary excellence. The chocolate fondant is life-changing! The ambiance is romantic yet welcoming.",
    date: "2024-10-20",
  },
  {
    id: "4",
    name: "David Chen",
    avatar: "",
    rating: 4,
    text: "Outstanding food and beautiful presentation. The truffle risotto was incredibly decadent. Only minor suggestion would be a larger wine list by the glass.",
    date: "2024-09-05",
  },
]

export const CATEGORIES = ["All", "Starters", "Mains", "Desserts", "Cocktails"]

// ============ API FUNCTIONS ============

export async function getRestaurantInfo(subdomain?: string): Promise<RestaurantInfo> {
  // TODO: Replace with SQL query when database is connected
  // const [site] = await sql`SELECT * FROM customer_sites WHERE subdomain = ${subdomain}`
  return DEFAULT_RESTAURANT
}

export async function getMenuItems(category?: string): Promise<MenuItem[]> {
  // TODO: Replace with SQL query when database is connected
  if (!category || category === "All") return MENU_ITEMS
  return MENU_ITEMS.filter((item) => item.category === category)
}

export async function getTestimonials(): Promise<Testimonial[]> {
  // TODO: Replace with SQL query when database is connected
  return TESTIMONIALS
}

export async function submitReservation(
  reservation: Omit<Reservation, "id" | "createdAt">
): Promise<{ success: boolean; message: string }> {
  // TODO: Replace with SQL INSERT when database is connected
  // await sql`INSERT INTO reservations (...) VALUES (...)`
  console.log("Reservation received:", reservation)
  return {
    success: true,
    message: "Your reservation has been confirmed! We look forward to welcoming you.",
  }
}
