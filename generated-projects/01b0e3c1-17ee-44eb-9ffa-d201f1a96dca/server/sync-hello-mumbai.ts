import { db } from "./db";
import { storage } from "./storage";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { helloMumbaiRestaurantData, helloMumbaiCategories, helloMumbaiMenuItems } from "./data/helloMumbaiMenu";
import { helloMumbaiToppingGroups } from "./data/helloMumbaiToppings";

export async function syncHelloMumbaiOnStartup(): Promise<void> {
  try {
    console.log("[Sync] Starting Hello Mumbai sync...");
    
    let restaurant = await storage.getRestaurantBySlug(helloMumbaiRestaurantData.slug);
    
    if (!restaurant) {
      console.log("[Sync] Hello Mumbai not found in database, creating...");
      
      const [newRestaurant] = await db.insert(schema.restaurants).values({
        name: helloMumbaiRestaurantData.name,
        slug: helloMumbaiRestaurantData.slug,
        address: helloMumbaiRestaurantData.address,
        phone: helloMumbaiRestaurantData.phone,
        status: helloMumbaiRestaurantData.status,
        rating: helloMumbaiRestaurantData.rating,
        loginUsername: helloMumbaiRestaurantData.loginUsername,
        loginPassword: helloMumbaiRestaurantData.loginPassword,
        logoUrl: helloMumbaiRestaurantData.logoUrl,
        themeKey: helloMumbaiRestaurantData.themeKey,
        tagline: helloMumbaiRestaurantData.tagline,
        cuisineType: helloMumbaiRestaurantData.cuisineType,
        currency: helloMumbaiRestaurantData.currency,
        deliveryTimeMinutes: helloMumbaiRestaurantData.deliveryTimeMinutes,
        collectionTimeMinutes: helloMumbaiRestaurantData.collectionTimeMinutes,
        primaryColor: helloMumbaiRestaurantData.primaryColor,
        secondaryColor: helloMumbaiRestaurantData.secondaryColor,
        accentColor: helloMumbaiRestaurantData.accentColor,
        headerBgColor: helloMumbaiRestaurantData.headerBgColor,
        cardBgColor: helloMumbaiRestaurantData.cardBgColor,
        buttonColor: helloMumbaiRestaurantData.buttonColor,
        textColor: helloMumbaiRestaurantData.textColor,
        deliveryHoursMonThu: helloMumbaiRestaurantData.deliveryHoursMonThu,
        deliveryHoursFriSat: helloMumbaiRestaurantData.deliveryHoursFriSat,
        deliveryHoursSun: helloMumbaiRestaurantData.deliveryHoursSun,
        collectionHoursMonThu: helloMumbaiRestaurantData.collectionHoursMonThu,
        collectionHoursFriSat: helloMumbaiRestaurantData.collectionHoursFriSat,
        collectionHoursSun: helloMumbaiRestaurantData.collectionHoursSun,
        acceptingOrders: helloMumbaiRestaurantData.acceptingOrders,
        voiceAlertEnabled: helloMumbaiRestaurantData.voiceAlertEnabled,
        voiceAlertMessage: helloMumbaiRestaurantData.voiceAlertMessage,
        cutleryOptionEnabled: helloMumbaiRestaurantData.cutleryOptionEnabled,
        cutleryName: helloMumbaiRestaurantData.cutleryName,
        cutleryPrice: helloMumbaiRestaurantData.cutleryPrice,
        collectionDiscountPercent: helloMumbaiRestaurantData.collectionDiscountPercent,
        collectionDiscountMinimum: helloMumbaiRestaurantData.collectionDiscountMinimum,
      }).returning();
      
      restaurant = newRestaurant;
      console.log(`[Sync] Created Hello Mumbai with id: ${restaurant.id}`);
    } else {
      await db.update(schema.restaurants)
        .set({ 
          themeKey: helloMumbaiRestaurantData.themeKey,
        })
        .where(eq(schema.restaurants.id, restaurant.id));
      
      console.log(`[Sync] Updated Hello Mumbai theme to: ${helloMumbaiRestaurantData.themeKey}`);
    }

    const existingCategories = await db.select().from(schema.menuCategories)
      .where(eq(schema.menuCategories.restaurantId, restaurant.id));
    
    if (existingCategories.length < 5) {
      console.log(`[Sync] Adding categories (found only ${existingCategories.length})...`);
      
      const categoryIdMap: Record<string, string> = {};
      
      for (const cat of helloMumbaiCategories) {
        try {
          const [inserted] = await db.insert(schema.menuCategories).values({
            name: cat.name,
            slug: cat.slug,
            sortOrder: cat.displayOrder,
            icon: cat.icon,
            restaurantId: restaurant.id,
          }).returning();
          categoryIdMap[cat.slug] = inserted.id;
        } catch (e) {
          const existing = await db.select().from(schema.menuCategories)
            .where(eq(schema.menuCategories.slug, cat.slug));
          if (existing.length > 0) {
            categoryIdMap[cat.slug] = existing[0].id;
          }
        }
      }
      console.log(`[Sync] Added ${helloMumbaiCategories.length} categories`);
    } else {
      console.log(`[Sync] Categories already exist (${existingCategories.length}), skipping`);
    }

    const existingItems = await db.select().from(schema.menuItems)
      .where(eq(schema.menuItems.restaurantId, restaurant.id));
    
    if (existingItems.length < 200) {
      console.log(`[Sync] Adding menu items (found only ${existingItems.length}, need 230)...`);
      
      const categories = await db.select().from(schema.menuCategories)
        .where(eq(schema.menuCategories.restaurantId, restaurant.id));
      const categorySlugToId: Record<string, string> = {};
      for (const cat of categories) {
        categorySlugToId[cat.slug] = cat.id;
      }
      
      const existingNames = new Set(existingItems.map(item => `${item.name}|${item.category}`));
      let addedCount = 0;
      
      for (const item of helloMumbaiMenuItems) {
        try {
          const categoryId = categorySlugToId[item.category] || item.category;
          const itemKey = `${item.name}|${categoryId}`;
          
          if (existingNames.has(itemKey)) {
            continue;
          }
          
          await db.insert(schema.menuItems).values({
            restaurantId: restaurant.id,
            name: item.name,
            description: item.description,
            price: item.price,
            category: categoryId,
            available: item.available,
            image: item.image,
          });
          existingNames.add(itemKey);
          addedCount++;
        } catch (e) {
        }
      }
      console.log(`[Sync] Added ${addedCount} new menu items (total should be ${existingItems.length + addedCount})`);
    } else {
      console.log(`[Sync] Menu items already exist (${existingItems.length}), skipping`);
    }

    // Fix specific broken images (using verified working Unsplash URLs)
    const imageFixes: Record<string, string> = {
      "Masala Peanuts": "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400",
      "Peanuts": "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400",
    };
    
    for (const [itemName, newImage] of Object.entries(imageFixes)) {
      try {
        const items = await db.select().from(schema.menuItems)
          .where(eq(schema.menuItems.restaurantId, restaurant.id));
        const item = items.find(i => i.name === itemName);
        if (item && item.image !== newImage) {
          await db.update(schema.menuItems)
            .set({ image: newImage })
            .where(eq(schema.menuItems.id, item.id));
          console.log(`[Sync] Fixed image for ${itemName}`);
        }
      } catch (e) {
        // Ignore errors
      }
    }

    // Sync topping groups and options - ALWAYS run to ensure production gets all toppings
    console.log(`[Sync] Syncing topping groups...`);
    
    const allMenuItems = await db.select().from(schema.menuItems)
      .where(eq(schema.menuItems.restaurantId, restaurant.id));
    const itemNameToId: Record<string, string> = {};
    for (const item of allMenuItems) {
      itemNameToId[item.name] = item.id;
    }
    
    // Get existing topping groups fresh for checking
    const existingToppingGroups = await db.select().from(schema.toppingGroups)
      .where(eq(schema.toppingGroups.restaurantId, restaurant.id));
    
    // Build a set of existing group keys for fast lookup
    const existingGroupKeys = new Set(
      existingToppingGroups.map(g => `${g.menuItemId}|${g.headline}`)
    );
    
    let addedGroups = 0;
    let addedOptions = 0;
    
    for (const group of helloMumbaiToppingGroups) {
      try {
        const menuItemId = itemNameToId[group.menuItemName];
        if (!menuItemId) continue;
        
        const groupKey = `${menuItemId}|${group.headline}`;
        if (existingGroupKeys.has(groupKey)) continue;
        
        const [inserted] = await db.insert(schema.toppingGroups).values({
          restaurantId: restaurant.id,
          menuItemId: menuItemId,
          headline: group.headline,
          isRequired: group.isRequired,
          maxSelections: group.maxSelections,
          allowQuantity: group.allowQuantity || false,
          maxQuantityPerOption: group.maxQuantityPerOption || 5,
          sortOrder: group.sortOrder || 0,
        }).returning();
        addedGroups++;
        existingGroupKeys.add(groupKey);
        
        for (const opt of group.options) {
          try {
            await db.insert(schema.toppingGroupOptions).values({
              groupId: inserted.id,
              name: opt.name,
              price: opt.price,
              isDefault: opt.isDefault || false,
              isAvailable: opt.isAvailable !== false,
              sortOrder: opt.sortOrder || 0,
            });
            addedOptions++;
          } catch (e) {
            // Ignore duplicate options
          }
        }
      } catch (e) {
        // Ignore duplicate groups
      }
    }
    
    if (addedGroups > 0) {
      console.log(`[Sync] Added ${addedGroups} topping groups with ${addedOptions} options`);
    } else {
      console.log(`[Sync] All topping groups already synced (${existingToppingGroups.length} exist)`);
    }

    console.log("[Sync] Hello Mumbai sync complete!");
  } catch (error) {
    console.error("[Sync] Error syncing Hello Mumbai:", error);
  }
}
