import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// Dummy data for demo
const dummyCategories = [
  { id: "cat-1", name: "Pizzas", description: "Our signature pizzas", sort_order: 1 },
  { id: "cat-2", name: "Burgers", description: "Juicy burgers", sort_order: 2 },
  { id: "cat-3", name: "Sides", description: "Tasty sides", sort_order: 3 },
  { id: "cat-4", name: "Drinks", description: "Refreshing beverages", sort_order: 4 },
  { id: "cat-5", name: "Desserts", description: "Sweet treats", sort_order: 5 },
]

const dummyMenuItems = [
  // Pizzas
  { id: "item-1", name: "Margherita Pizza", description: "Classic tomato sauce, mozzarella, and fresh basil", price: 12.99, image_url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop", category_id: "cat-1", is_available: true, is_popular: true, spicy_level: 0 },
  { id: "item-2", name: "Pepperoni Pizza", description: "Loaded with pepperoni and melted mozzarella cheese", price: 14.99, image_url: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop", category_id: "cat-1", is_available: true, is_popular: true, spicy_level: 1 },
  { id: "item-3", name: "BBQ Chicken Pizza", description: "Grilled chicken, red onions, BBQ sauce, and cilantro", price: 15.99, image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop", category_id: "cat-1", is_available: true, is_popular: false, spicy_level: 0 },
  { id: "item-4", name: "Vegetarian Supreme", description: "Bell peppers, mushrooms, olives, onions, and tomatoes", price: 13.99, image_url: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400&h=300&fit=crop", category_id: "cat-1", is_available: true, is_popular: false, spicy_level: 0 },
  { id: "item-5", name: "Spicy Meat Feast", description: "Pepperoni, sausage, bacon, and jalapenos", price: 16.99, image_url: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=400&h=300&fit=crop", category_id: "cat-1", is_available: true, is_popular: true, spicy_level: 3 },
  // Burgers
  { id: "item-6", name: "Classic Cheeseburger", description: "Beef patty, cheddar cheese, lettuce, tomato, and special sauce", price: 10.99, image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop", category_id: "cat-2", is_available: true, is_popular: true, spicy_level: 0 },
  { id: "item-7", name: "Bacon Double Burger", description: "Two beef patties, crispy bacon, cheese, and pickles", price: 13.99, image_url: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop", category_id: "cat-2", is_available: true, is_popular: false, spicy_level: 0 },
  { id: "item-8", name: "Spicy Chicken Burger", description: "Crispy chicken, spicy mayo, lettuce, and pickles", price: 11.99, image_url: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=300&fit=crop", category_id: "cat-2", is_available: true, is_popular: false, spicy_level: 2 },
  // Sides
  { id: "item-9", name: "French Fries", description: "Crispy golden fries with sea salt", price: 3.99, image_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop", category_id: "cat-3", is_available: true, is_popular: true, spicy_level: 0 },
  { id: "item-10", name: "Garlic Bread", description: "Toasted bread with garlic butter and herbs", price: 4.99, image_url: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=400&h=300&fit=crop", category_id: "cat-3", is_available: true, is_popular: false, spicy_level: 0 },
  { id: "item-11", name: "Mozzarella Sticks", description: "Breaded mozzarella with marinara dipping sauce", price: 6.99, image_url: "https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=400&h=300&fit=crop", category_id: "cat-3", is_available: true, is_popular: false, spicy_level: 0 },
  { id: "item-12", name: "Onion Rings", description: "Crispy battered onion rings", price: 4.99, image_url: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=300&fit=crop", category_id: "cat-3", is_available: true, is_popular: false, spicy_level: 0 },
  // Drinks
  { id: "item-13", name: "Coca-Cola", description: "330ml can", price: 1.99, image_url: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop", category_id: "cat-4", is_available: true, is_popular: false, spicy_level: 0 },
  { id: "item-14", name: "Fresh Lemonade", description: "Homemade lemonade with fresh lemons", price: 2.99, image_url: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop", category_id: "cat-4", is_available: true, is_popular: false, spicy_level: 0 },
  { id: "item-15", name: "Milkshake", description: "Creamy vanilla, chocolate, or strawberry", price: 4.99, image_url: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop", category_id: "cat-4", is_available: true, is_popular: true, spicy_level: 0 },
  // Desserts
  { id: "item-16", name: "Chocolate Brownie", description: "Warm chocolate brownie with vanilla ice cream", price: 5.99, image_url: "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&h=300&fit=crop", category_id: "cat-5", is_available: true, is_popular: true, spicy_level: 0 },
  { id: "item-17", name: "Cheesecake", description: "New York style cheesecake with berry compote", price: 6.99, image_url: "https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400&h=300&fit=crop", category_id: "cat-5", is_available: true, is_popular: false, spicy_level: 0 },
  { id: "item-18", name: "Ice Cream Sundae", description: "Three scoops with chocolate sauce and whipped cream", price: 4.99, image_url: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop", category_id: "cat-5", is_available: true, is_popular: false, spicy_level: 0 },
]

export async function GET(request: NextRequest) {
  try {
    const subdomain = request.nextUrl.searchParams.get("subdomain")

    if (!subdomain) {
      return NextResponse.json({ error: "Subdomain required" }, { status: 400 })
    }

    // Get restaurant info
    const [site] = await sql`
      SELECT 
        cs.id, 
        cs.site_name, 
        cs.subdomain, 
        cs.logo_url,
        cs.is_locked,
        css.business_name,
        css.address,
        css.phone,
        css.is_open,
        css.delivery_fee,
        css.minimum_order,
        css.estimated_delivery_time as estimated_delivery
      FROM customer_sites cs
      LEFT JOIN customer_site_settings css ON cs.id = css.site_id
      WHERE cs.subdomain = ${subdomain} AND cs.is_active = true
    `

    if (!site) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }

    // Check if site is locked/suspended
    if (site.is_locked) {
      return NextResponse.json({ 
        error: "Restaurant temporarily unavailable",
        suspended: true 
      }, { status: 403 })
    }

    // Get menu categories
    const categories = await sql`
      SELECT id, name, description, sort_order
      FROM menu_categories
      WHERE site_id = ${site.id} AND is_active = true
      ORDER BY sort_order ASC, name ASC
    `

    // Get menu items
    const menuItems = await sql`
      SELECT 
        id, name, description, price, image_url, 
        category_id, is_available, is_popular, spicy_level
      FROM menu_items
      WHERE site_id = ${site.id} AND is_active = true
      ORDER BY sort_order ASC, name ASC
    `

    // Use dummy data if no real menu exists
    const finalCategories = categories.length > 0 ? categories : dummyCategories
    const finalMenuItems = menuItems.length > 0 ? menuItems : dummyMenuItems

    return NextResponse.json({
      restaurant: {
        id: site.id,
        site_name: site.site_name,
        subdomain: site.subdomain,
        logo_url: site.logo_url,
        business_name: site.business_name || site.site_name,
        address: site.address || "123 Pizza Street, London, UK",
        phone: site.phone || "+44 20 1234 5678",
        is_open: site.is_open ?? true,
        delivery_fee: Number(site.delivery_fee) || 2.50,
        minimum_order: Number(site.minimum_order) || 10,
        estimated_delivery: site.estimated_delivery || "30-45 min"
      },
      categories: finalCategories,
      menuItems: finalMenuItems
    })
  } catch (error) {
    console.error("Menu API error:", error)
    return NextResponse.json({ error: "Failed to load menu" }, { status: 500 })
  }
}
