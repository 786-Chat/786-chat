import { useState, useEffect } from "react";
const hamburgerImage = "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/uploads/c7e4899c-e868-4904-9843-0b5c05a2ceef/1788427332378-jm4vca.png" // 786.Chat: Replit export omitted attached_assets/generated_images/gourmet_beef_burger.png
const pizzaImage = "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/uploads/c7e4899c-e868-4904-9843-0b5c05a2ceef/1788427333496-tws5ir.png" // 786.Chat: Replit export omitted attached_assets/generated_images/artisan_pepperoni_pizza.png
const saladImage = "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/uploads/c7e4899c-e868-4904-9843-0b5c05a2ceef/1788427334544-ng6su.png" // 786.Chat: Replit export omitted attached_assets/generated_images/fresh_greek_salad.png
const sushiImage = "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/uploads/c7e4899c-e868-4904-9843-0b5c05a2ceef/1788427335542-4pk724.png" // 786.Chat: Replit export omitted attached_assets/generated_images/japanese_sushi_platter.png

export type OrderStatus = "new" | "preparing" | "ready" | "completed";

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  type: "delivery" | "takeaway" | "dine-in";
  time: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
}

export const MOCK_ORDERS: Order[] = [
  {
    id: "1234",
    customerName: "John Smith",
    phone: "07123 456789",
    type: "takeaway",
    time: "7:30 PM",
    items: [
      { name: "Chicken Peri Peri", quantity: 2, price: 14.00 },
      { name: "Lamb Kebab", quantity: 1, price: 8.50 },
      { name: "Naan Bread", quantity: 2, price: 3.00 },
      { name: "Coca Cola", quantity: 1, price: 1.50 },
    ],
    total: 27.00,
    status: "new",
    createdAt: new Date(),
  },
  {
    id: "1233",
    customerName: "Sarah Jones",
    phone: "07987 654321",
    type: "delivery",
    time: "7:15 PM",
    items: [
      { name: "Margherita Pizza", quantity: 2, price: 24.00 },
      { name: "Garlic Bread", quantity: 1, price: 4.50 },
    ],
    total: 28.50,
    status: "preparing",
    createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
  },
    {
    id: "1232",
    customerName: "Mike Brown",
    phone: "07444 555666",
    type: "dine-in",
    time: "7:00 PM",
    items: [
      { name: "Sushi Platter", quantity: 1, price: 35.00 },
      { name: "Miso Soup", quantity: 2, price: 6.00 },
    ],
    total: 41.00,
    status: "ready",
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
  },
];

export const MENU_CATEGORIES = [
  { id: "burgers", name: "Burgers & Wraps" },
  { id: "pizzas", name: "Artisan Pizzas" },
  { id: "salads", name: "Fresh Salads" },
  { id: "sushi", name: "Sushi & Japanese" },
];

export const MENU_ITEMS = [
  {
    id: "1",
    name: "The Ultimate Burger",
    description: "Double beef patty, melted cheddar, caramelized onions, house sauce on brioche.",
    price: 14.50,
    category: "burgers",
    image: hamburgerImage,
  },
  {
    id: "2",
    name: "Spicy Chicken Wrap",
    description: "Grilled peri-peri chicken, lettuce, tomato, and spicy mayo in a soft tortilla.",
    price: 9.50,
    category: "burgers",
    image: hamburgerImage, // Reusing for mock
  },
  {
    id: "3",
    name: "Pepperoni Feast",
    description: "Classic tomato base, mozzarella, double pepperoni, and fresh basil.",
    price: 13.00,
    category: "pizzas",
    image: pizzaImage,
  },
  {
    id: "4",
    name: "Greek Salad",
    description: "Crisp cucumber, tomatoes, kalamata olives, feta cheese, oregano and olive oil.",
    price: 8.50,
    category: "salads",
    image: saladImage,
  },
  {
    id: "5",
    name: "Salmon Nigiri Set",
    description: "6 pieces of fresh salmon nigiri with wasabi and pickled ginger.",
    price: 12.00,
    category: "sushi",
    image: sushiImage,
  },
   {
    id: "6",
    name: "Tuna Maki Roll",
    description: "Fresh tuna rolled with sushi rice and nori seaweed.",
    price: 8.00,
    category: "sushi",
    image: sushiImage,
  },
];

export interface Booking {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: Date;
}

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: "B-101",
    customerName: "Alice Walker",
    email: "alice@example.com",
    phone: "07123 123123",
    date: new Date().toISOString().split('T')[0], // Today
    time: "19:00",
    guests: 4,
    status: "confirmed",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // Yesterday
  },
  {
    id: "B-102",
    customerName: "David Chen",
    email: "david@example.com",
    phone: "07890 987654",
    date: new Date().toISOString().split('T')[0], // Today
    time: "20:30",
    guests: 2,
    status: "pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30 mins ago
  },
  {
    id: "B-103",
    customerName: "Emma Watson",
    email: "emma@example.com",
    phone: "07555 444333",
    date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().split('T')[0], // Tomorrow
    time: "18:00",
    guests: 6,
    status: "confirmed",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
  }
];

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  address: string;
  status: "open" | "closed";
  rating: number;
  ordersToday: number;
  revenueToday: number;
  lastOrderTime: string;
  googleMapsUrl?: string;
  stripeAccountId?: string;
}

export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: "1",
    name: "Peri Peri Watford",
    slug: "peri-peri-watford",
    address: "123 High Street, Watford",
    status: "open",
    rating: 4.8,
    ordersToday: 45,
    revenueToday: 1250.50,
    lastOrderTime: "2 mins ago",
    googleMapsUrl: "https://peri-peri-watford.com",
    stripeAccountId: "acct_1Hh5S4F2q8193x",
  },
  {
    id: "2",
    name: "Pizza Express St Albans",
    slug: "pizza-express-st-albans",
    address: "45 London Road, St Albans",
    status: "open",
    rating: 4.5,
    ordersToday: 32,
    revenueToday: 890.00,
    lastOrderTime: "15 mins ago",
    googleMapsUrl: "https://pizza-express-st-albans.com",
    stripeAccountId: "acct_1Jk9L4D2a5182y",
  },
  {
    id: "3",
    name: "Sushi Daily Hemel",
    slug: "sushi-daily-hemel",
    address: "The Marlowes, Hemel Hempstead",
    status: "closed",
    rating: 4.9,
    ordersToday: 12,
    revenueToday: 450.20,
    lastOrderTime: "4 hours ago",
    googleMapsUrl: "https://sushi-daily-hemel.com",
    stripeAccountId: "acct_1Lm3P8K9s4175z",
  },
  {
    id: "4",
    name: "Burger King Luton",
    slug: "burger-king-luton",
    address: "The Mall, Luton",
    status: "open",
    rating: 4.2,
    ordersToday: 156,
    revenueToday: 2340.80,
    lastOrderTime: "1 min ago",
    googleMapsUrl: "https://burger-king-luton.com",
    stripeAccountId: "acct_1Nn5R2T7u3164w",
  }
];
