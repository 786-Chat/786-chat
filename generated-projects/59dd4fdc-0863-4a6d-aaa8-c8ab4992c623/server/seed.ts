import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "../shared/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed() {
  console.log("Seeding database...");

  // Create restaurants
  const [restaurant1] = await db.insert(schema.restaurants).values({
    name: "Peri Peri Watford",
    slug: "peri-peri-watford",
    address: "123 High Street, Watford",
    status: "open",
    rating: "4.8",
    ordersToday: 45,
    revenueToday: "1250.50",
    lastOrderTime: "2 mins ago",
    googleMapsUrl: "https://g.page/r/...",
    stripeAccountId: "acct_1Hh5S4F2q8193x",
  }).returning();

  const [restaurant2] = await db.insert(schema.restaurants).values({
    name: "Pizza Express St Albans",
    slug: "pizza-express-st-albans",
    address: "45 London Road, St Albans",
    status: "open",
    rating: "4.5",
    ordersToday: 32,
    revenueToday: "890.00",
    lastOrderTime: "15 mins ago",
    googleMapsUrl: "https://g.page/r/...",
    stripeAccountId: "acct_1Jk9L4D2a5182y",
  }).returning();

  // Create Tawa Restaurant Watford with correct theme
  const [tawaWatford] = await db.insert(schema.restaurants).values({
    name: "Tawa Restaurant Watford",
    slug: "tawa-restaurant-watford",
    address: "5 The Parade, High Street, Watford WD17 1NQ",
    status: "open",
    rating: "4.7",
    ordersToday: 0,
    revenueToday: "0.00",
    lastOrderTime: "N/A",
    googleMapsUrl: "https://maps.google.com/?q=Tawa+Restaurant+Watford",
    stripeAccountId: "",
    themeKey: "tawa-watford",
  }).returning();

  console.log("✓ Created restaurants");

  // Create menu categories for Tawa Restaurant Watford
  const tawaCategories = [
    { name: "Popular", slug: "popular", displayOrder: 1 },
    { name: "Starters", slug: "starters", displayOrder: 2 },
    { name: "Karahis", slug: "karahis", displayOrder: 3 },
    { name: "Biryani", slug: "biryani", displayOrder: 4 },
    { name: "Curries", slug: "curries", displayOrder: 5 },
    { name: "Tawa", slug: "tawa", displayOrder: 6 },
    { name: "Grill", slug: "grill", displayOrder: 7 },
    { name: "Platters", slug: "platters", displayOrder: 8 },
    { name: "Kebab Roll", slug: "kebab-roll", displayOrder: 9 },
    { name: "Burgers", slug: "burgers", displayOrder: 10 },
    { name: "Kids", slug: "kids", displayOrder: 11 },
    { name: "Sides", slug: "sides", displayOrder: 12 },
    { name: "Drinks", slug: "drinks", displayOrder: 13 },
    { name: "Lassi", slug: "lassi", displayOrder: 14 },
    { name: "Milkshakes", slug: "milkshakes", displayOrder: 15 },
    { name: "Mojito", slug: "mojito", displayOrder: 16 },
    { name: "Desserts", slug: "desserts", displayOrder: 17 },
    { name: "Iftar Offer", slug: "iftar-offer", displayOrder: 18 },
  ];

  for (const cat of tawaCategories) {
    await db.insert(schema.menuCategories).values({
      restaurantId: tawaWatford.id,
      name: cat.name,
      slug: cat.slug,
      displayOrder: cat.displayOrder,
    });
  }

  console.log("✓ Created Tawa Restaurant Watford categories");

  // Create menu items for Tawa Restaurant Watford
  const tawaMenuItems = [
    // Popular
    { name: "Cheese Burger", description: "Tasty beef burger topped with melted cheese", price: "4.99", category: "popular" },
    { name: "Chicken Biryani", description: "Served with boneless piece, salad and raita", price: "5.99", category: "popular" },
    { name: "Chips", description: "Crispy golden chips", price: "2.99", category: "popular" },
    { name: "Buttery Naan", description: "Freshly baked buttery naan bread", price: "1.99", category: "popular" },
    // Starters
    { name: "Chicken Kebab", description: "Juicy chicken delight", price: "1.99", category: "starters" },
    { name: "Chicken Tikka", description: "Spicy grilled chicken", price: "3.99", category: "starters" },
    { name: "Chicken Wings", description: "Crispy spiced wings", price: "4.99", category: "starters" },
    { name: "Lamb Kebab", description: "Savory lamb treat", price: "1.99", category: "starters" },
    { name: "Lamb Tikka", description: "Tender lamb bites", price: "5.99", category: "starters" },
    { name: "Lamb Chops", description: "Succulent lamb feast", price: "12.99", category: "starters" },
    { name: "Mix Kebab", description: "Flavorful meat combo", price: "3.99", category: "starters" },
    { name: "Mix Tikka", description: "Assorted grilled tikka", price: "9.99", category: "starters" },
    // Karahis
    { name: "Lamb Karahi", description: "Traditional lamb karahi with spices", price: "12.99", category: "karahis" },
    { name: "Chicken Karahi", description: "Authentic chicken karahi", price: "10.99", category: "karahis" },
    { name: "Full Chicken Karahi", description: "Freshly cooked with fresh tomatoes, green chillies, and special tawa spices", price: "24.99", category: "karahis" },
    { name: "Full Achari Chicken Karahi", description: "Freshly cooked with fresh tomatoes, green chillies, and special tawa spices", price: "24.99", category: "karahis" },
    { name: "Lamb Karahi (1 KG)", description: "Freshly cooked with fresh tomatoes, green chilies, and special tawa spices", price: "34.99", category: "karahis" },
    // Biryani
    { name: "Lamb Biryani", description: "Aromatic lamb biryani with raita", price: "8.99", category: "biryani" },
    { name: "Vegetable Biryani", description: "Mixed vegetable biryani", price: "6.99", category: "biryani" },
    // Curries
    { name: "Butter Chicken", description: "Creamy butter chicken curry", price: "9.99", category: "curries" },
    { name: "Chicken Tikka Masala", description: "Popular tikka masala", price: "9.99", category: "curries" },
    { name: "Lamb Curry", description: "Juicy lamb in aromatic spices", price: "9.99", category: "curries" },
    { name: "Chicken Bnls", description: "Tender boneless chicken in rich gravy", price: "7.99", category: "curries" },
    { name: "Chicken Bnls Daal", description: "Boneless chicken in lentil curry", price: "7.99", category: "curries" },
    { name: "Chicken Bnls Saag", description: "Boneless chicken cooked with spinach", price: "7.99", category: "curries" },
    // Tawa
    { name: "Mix Tawa", description: "Served with Chicken Tikka, Wings, Chicken Kebab, Chicken Curry, Lamb Tikka", price: "29.00", category: "tawa" },
    { name: "Sizzler Tawa", description: "Served with Chicken Tikka, Wings, Chicken Kebab, Lamb Tikka, Lamb Chops", price: "29.00", category: "tawa" },
    // Grill
    { name: "Mix Grill", description: "Serves one person includes 1 lamb chop, 1 lamb kebab, 1 lamb tikka...", price: "12.99", category: "grill" },
    // Platters
    { name: "Chicken Kebab Platter", description: "Served with salad, chips or rice", price: "7.99", category: "platters" },
    { name: "Chicken Tikka Platter", description: "Served with salad, chips or rice", price: "7.92", category: "platters" },
    { name: "Chicken Wings Platter", description: "Served with salad, chips or rice", price: "8.90", category: "platters" },
    { name: "Lamb Chops Platter", description: "Served with salad, chips or rice", price: "12.99", category: "platters" },
    { name: "Lamb Kebab Platter", description: "Served with salad, chips or rice", price: "8.99", category: "platters" },
    { name: "Lamb Tikka Platter", description: "Served with salad, chips or rice", price: "9.99", category: "platters" },
    { name: "Mix Kebab Platter", description: "A combination of flavorful lamb and chicken kebabs", price: "7.90", category: "platters" },
    // Kebab Roll
    { name: "Seekh Kebab Roll", description: "Seekh kebab wrapped in naan", price: "5.99", category: "kebab-roll" },
    { name: "Chicken Tikka Roll", description: "Chicken tikka in fresh naan", price: "5.99", category: "kebab-roll" },
    { name: "Chicken Kebab Roll", description: "Served with salad and naan", price: "6.99", category: "kebab-roll" },
    { name: "Lamb Kebab Roll", description: "Served with salad and naan", price: "6.99", category: "kebab-roll" },
    { name: "Lamb Tikka Kebab Roll", description: "Served with salad and naan", price: "7.99", category: "kebab-roll" },
    // Burgers
    { name: "Beef Burger", description: "Classic beef patty burger", price: "6.99", category: "burgers" },
    { name: "Chicken Burger", description: "Crispy chicken fillet burger", price: "5.99", category: "burgers" },
    { name: "Zinger Burger", description: "Spicy chicken zinger", price: "6.49", category: "burgers" },
    // Kids
    { name: "6 Piece Nuggets", description: "Served with chips and drink", price: "6.49", category: "kids" },
    { name: "Steak Burger", description: "Served with chips and drink", price: "6.49", category: "kids" },
    // Sides
    { name: "Naan", description: "Fresh baked naan bread", price: "0.80", category: "sides" },
    { name: "Roti", description: "Traditional roti bread", price: "0.60", category: "sides" },
    { name: "Garlic Naan", description: "Garlic flavored naan", price: "1.99", category: "sides" },
    { name: "Salad", description: "Fresh garden salad", price: "2.99", category: "sides" },
    // Drinks
    { name: "Coca Cola", description: "Classic Coca Cola", price: "1.99", category: "drinks" },
    { name: "Sprite", description: "Lemon lime Sprite", price: "1.99", category: "drinks" },
    // Lassi
    { name: "Sweet Lassi", description: "Traditional sweet lassi", price: "2.99", category: "lassi" },
    { name: "Salted Lassi", description: "Refreshing salted lassi", price: "2.99", category: "lassi" },
    { name: "Mango Lassi", description: "Sweet mango lassi", price: "3.99", category: "lassi" },
    // Milkshakes
    { name: "Oreo Milkshake", description: "Creamy Oreo milkshake", price: "4.99", category: "milkshakes" },
    { name: "Chocolate Milkshake", description: "Rich chocolate milkshake", price: "4.99", category: "milkshakes" },
    { name: "Strawberry Milkshake", description: "Fresh strawberry milkshake", price: "4.99", category: "milkshakes" },
    // Mojito
    { name: "Virgin Mojito", description: "Classic virgin mojito", price: "3.99", category: "mojito" },
    { name: "Blue Lagoon Mojito", description: "Refreshing blue lagoon", price: "4.49", category: "mojito" },
    { name: "Strawberry Mojito", description: "Fresh strawberry mojito", price: "4.49", category: "mojito" },
    // Desserts
    { name: "Kheer", description: "Traditional rice pudding", price: "3.99", category: "desserts" },
    { name: "Ice Cream", description: "Vanilla ice cream", price: "2.99", category: "desserts" },
    { name: "Gulab Jamun", description: "Sweet milk dumplings in syrup", price: "3.99", category: "desserts" },
    // Iftar Offer
    { name: "Box Deal", description: "Pakora, Samosa, Biryani, Wings, Kebab, Dates & Chips", price: "15.99", category: "iftar-offer" },
    { name: "Ramadan Platter", description: "Served with Samosa, Pakora, Chicken Tikka, Wings, Chicken Curry", price: "24.99", category: "iftar-offer" },
    { name: "Pakora", description: "Pakora serving", price: "4.99", category: "iftar-offer" },
    { name: "Samosa", description: "Samosa serving per piece", price: "1.99", category: "iftar-offer" },
    { name: "Chana Chaat", description: "Chana chaat serving", price: "5.99", category: "iftar-offer" },
    { name: "Samosa Chaat", description: "Samosa chaat serving", price: "6.99", category: "iftar-offer" },
  ];

  for (const item of tawaMenuItems) {
    await db.insert(schema.menuItems).values({
      restaurantId: tawaWatford.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      available: true,
    });
  }

  console.log("✓ Created Tawa Restaurant Watford menu items (70 items)");

  // Create menu items for restaurant 1
  await db.insert(schema.menuItems).values([
    {
      restaurantId: restaurant1.id,
      name: "The Ultimate Burger",
      description: "Double beef patty, melted cheddar, caramelized onions, house sauce on brioche.",
      price: "14.50",
      category: "burgers",
      image: "/placeholder-burger.jpg",
      available: true,
    },
    {
      restaurantId: restaurant1.id,
      name: "Spicy Chicken Wrap",
      description: "Grilled peri-peri chicken, lettuce, tomato, and spicy mayo in a soft tortilla.",
      price: "9.50",
      category: "burgers",
      image: "/placeholder-wrap.jpg",
      available: true,
    },
    {
      restaurantId: restaurant1.id,
      name: "Chicken Peri Peri",
      description: "Flame-grilled chicken with our signature peri-peri sauce.",
      price: "14.00",
      category: "mains",
      image: "/placeholder-chicken.jpg",
      available: true,
    },
  ]);

  console.log("✓ Created menu items");

  // Create a test order
  const [order] = await db.insert(schema.orders).values({
    restaurantId: restaurant1.id,
    customerName: "John Smith",
    phone: "07123 456789",
    type: "takeaway",
    total: "27.00",
    status: "new",
    stripePaymentId: "pi_test123",
  }).returning();

  await db.insert(schema.orderItems).values([
    {
      orderId: order.id,
      name: "Chicken Peri Peri",
      quantity: 2,
      price: "14.00",
    },
    {
      orderId: order.id,
      name: "Naan Bread",
      quantity: 2,
      price: "3.00",
    },
  ]);

  console.log("✓ Created test order");

  // Create a test booking
  const today = new Date().toISOString().split('T')[0];
  await db.insert(schema.bookings).values({
    restaurantId: restaurant1.id,
    customerName: "Alice Walker",
    email: "alice@example.com",
    phone: "07123 123123",
    date: today,
    time: "19:00",
    guests: 4,
    status: "pending",
  });

  console.log("✓ Created test booking");
  console.log("Seeding complete!");
  
  await pool.end();
}

seed().catch(console.error);
