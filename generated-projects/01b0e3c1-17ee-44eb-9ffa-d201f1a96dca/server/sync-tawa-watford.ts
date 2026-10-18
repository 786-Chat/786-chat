import { db } from "./db";
import { storage } from "./storage";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { tawaWatfordRestaurantData, tawaWatfordCategories, tawaWatfordMenuItems } from "./data/tawaWatfordMenu";

export async function syncTawaWatfordOnStartup(): Promise<void> {
  try {
    console.log("[Sync] Starting Tawa Restaurant Watford sync...");
    
    const restaurant = await storage.getRestaurantBySlug(tawaWatfordRestaurantData.slug);
    
    if (!restaurant) {
      console.log("[Sync] Tawa Restaurant Watford not found in database, skipping sync.");
      return;
    }

    // Update theme_key
    await db.update(schema.restaurants)
      .set({ 
        themeKey: tawaWatfordRestaurantData.themeKey,
      })
      .where(eq(schema.restaurants.id, restaurant.id));
    
    console.log(`[Sync] Updated Tawa Restaurant Watford theme to: ${tawaWatfordRestaurantData.themeKey}`);

    // Check if categories exist - if not, add them
    const existingCategories = await db.select().from(schema.menuCategories)
      .where(eq(schema.menuCategories.restaurantId, restaurant.id));
    
    if (existingCategories.length < 5) {
      console.log(`[Sync] Adding categories (found only ${existingCategories.length})...`);
      for (const cat of tawaWatfordCategories) {
        try {
          await db.insert(schema.menuCategories).values({
            name: cat.name,
            slug: cat.slug,
            sortOrder: cat.displayOrder,
            restaurantId: restaurant.id,
          });
        } catch (e) {
          // Ignore duplicate errors
        }
      }
      console.log(`[Sync] Added ${tawaWatfordCategories.length} categories`);
    } else {
      console.log(`[Sync] Categories already exist (${existingCategories.length}), skipping`);
    }

    // Check if menu items exist - if not, add them
    const existingItems = await db.select().from(schema.menuItems)
      .where(eq(schema.menuItems.restaurantId, restaurant.id));
    
    if (existingItems.length < 20) {
      console.log(`[Sync] Adding menu items (found only ${existingItems.length})...`);
      for (const item of tawaWatfordMenuItems) {
        try {
          await db.insert(schema.menuItems).values({
            restaurantId: restaurant.id,
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            available: item.available,
            image: item.image,
          });
        } catch (e) {
          // Ignore duplicate errors
        }
      }
      console.log(`[Sync] Added ${tawaWatfordMenuItems.length} menu items`);
    } else {
      console.log(`[Sync] Menu items already exist (${existingItems.length}), skipping`);
    }

    console.log("[Sync] Tawa Restaurant Watford sync complete!");
  } catch (error) {
    console.error("[Sync] Error syncing Tawa Restaurant Watford:", error);
  }
}
