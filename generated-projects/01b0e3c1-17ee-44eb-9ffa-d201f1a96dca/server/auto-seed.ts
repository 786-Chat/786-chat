import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { embeddedSeedData } from "./embedded-seed-data";
import { db } from "./db";

interface SeedRestaurant {
  id: string;
  name: string;
  slug: string;
  address: string;
  status: string;
  theme_key: string | null;
  login_username?: string | null;
  login_password?: string | null;
  rating: string;
  orders_today: number;
  revenue_today: string;
  currency?: string;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
  google_maps_url?: string | null;
  hero_gradient_start?: string | null;
  hero_gradient_middle?: string | null;
  hero_gradient_end?: string | null;
}

interface SeedMenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string | null;
  price: string;
  category: string;
  image?: string | null;
  available: boolean;
  allergen_profile?: Record<string, unknown> | null;
}

interface SeedCategory {
  slug: string;
  name: string;
  icon: string;
  sortOrder: number;
}

interface SeedData {
  restaurants: SeedRestaurant[];
  menuItems: SeedMenuItem[];
  menuCategories: SeedCategory[];
}

function loadSeedData(): SeedData {
  console.log("Using embedded seed data");
  console.log(`  - ${embeddedSeedData.restaurants?.length || 0} restaurants`);
  console.log(`  - ${embeddedSeedData.menuItems?.length || 0} menu items`);
  console.log(`  - ${embeddedSeedData.menuCategories?.length || 0} menu categories`);
  return embeddedSeedData as unknown as SeedData;
}

export async function autoSeedBranches() {
  console.log("=== AUTO-SEED STARTING ===");
  
  const seedData = loadSeedData();
  if (!seedData) {
    console.error("No seed data available, skipping auto-seed");
    return;
  }
  
  try {
    const existingRestaurants = await db.select().from(schema.restaurants);
    console.log(`Found ${existingRestaurants.length} existing restaurants`);
    
    const existingById = new Map(existingRestaurants.map((r) => [r.id, r]));
    const existingSlugToId = new Map(existingRestaurants.map((r) => [r.slug, r.id]));
    const existingSlugs = new Set(existingRestaurants.map((r) => r.slug));
    const seedIdToSlug = new Map(seedData.restaurants.map((r) => [r.id, r.slug]));
    
    let createdBranches = 0;
    let updatedBranches = 0;
    
    for (const restaurant of seedData.restaurants) {
      const existingByIdRecord = existingById.get(restaurant.id);
      const seedRestaurant = restaurant as any;
      
      if (existingByIdRecord) {
        const updates: any = {};
        
        if (existingByIdRecord.name !== restaurant.name) {
          updates.name = restaurant.name;
        }
        if (existingByIdRecord.slug !== restaurant.slug) {
          updates.slug = restaurant.slug;
          existingSlugToId.delete(existingByIdRecord.slug);
          existingSlugToId.set(restaurant.slug, restaurant.id);
          existingSlugs.delete(existingByIdRecord.slug);
          existingSlugs.add(restaurant.slug);
        }
        if (seedRestaurant.currency && existingByIdRecord.currency !== seedRestaurant.currency) {
          updates.currency = seedRestaurant.currency;
        }
        if (seedRestaurant.theme_key && existingByIdRecord.themeKey !== seedRestaurant.theme_key) {
          updates.themeKey = seedRestaurant.theme_key;
        }
        if (seedRestaurant.hero_gradient_start) {
          updates.heroGradientStart = seedRestaurant.hero_gradient_start;
        }
        if (seedRestaurant.hero_gradient_middle) {
          updates.heroGradientMiddle = seedRestaurant.hero_gradient_middle;
        }
        if (seedRestaurant.hero_gradient_end) {
          updates.heroGradientEnd = seedRestaurant.hero_gradient_end;
        }
        if (seedRestaurant.category_display_position && existingByIdRecord.categoryDisplayPosition !== seedRestaurant.category_display_position) {
          updates.categoryDisplayPosition = seedRestaurant.category_display_position;
        }
        if (seedRestaurant.custom_domain && existingByIdRecord.customDomain !== seedRestaurant.custom_domain) {
          updates.customDomain = seedRestaurant.custom_domain;
        }
        if (seedRestaurant.tagline && existingByIdRecord.tagline !== seedRestaurant.tagline) {
          updates.tagline = seedRestaurant.tagline;
        }
        if (seedRestaurant.cuisine_type && existingByIdRecord.cuisineType !== seedRestaurant.cuisine_type) {
          updates.cuisineType = seedRestaurant.cuisine_type;
        }
        if (seedRestaurant.logo_url && existingByIdRecord.logoUrl !== seedRestaurant.logo_url) {
          updates.logoUrl = seedRestaurant.logo_url;
        }
        if (seedRestaurant.phone && existingByIdRecord.phone !== seedRestaurant.phone) {
          updates.phone = seedRestaurant.phone;
        }
        
        if (Object.keys(updates).length > 0) {
          console.log(`Updating branch: ${restaurant.name} (${Object.keys(updates).join(', ')})`);
          await db.update(schema.restaurants)
            .set(updates)
            .where(eq(schema.restaurants.id, restaurant.id));
          updatedBranches++;
        }
      } else if (!existingSlugs.has(restaurant.slug)) {
        console.log(`Creating branch: ${restaurant.name}`);
        const status = restaurant.status === "busy" || restaurant.status === "closed" ? "open" : (restaurant.status as "open" | "closed");
        const [created] = await db.insert(schema.restaurants).values({
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          address: restaurant.address || "",
          status: status,
          themeKey: seedRestaurant.theme_key || "classic",
          loginUsername: seedRestaurant.login_username || restaurant.slug,
          loginPassword: seedRestaurant.login_password || `${restaurant.slug}123`,
          rating: restaurant.rating || "4.5",
          ordersToday: restaurant.orders_today || 0,
          revenueToday: restaurant.revenue_today || "0.00",
          currency: seedRestaurant.currency || "GBP",
          heroGradientStart: seedRestaurant.hero_gradient_start || null,
          heroGradientMiddle: seedRestaurant.hero_gradient_middle || null,
          heroGradientEnd: seedRestaurant.hero_gradient_end || null,
          categoryDisplayPosition: seedRestaurant.category_display_position || null,
          customDomain: seedRestaurant.custom_domain || null,
          tagline: seedRestaurant.tagline || null,
          cuisineType: seedRestaurant.cuisine_type || null,
          logoUrl: seedRestaurant.logo_url || null,
          phone: seedRestaurant.phone || null,
        }).returning();
        existingById.set(created.id, created);
        existingSlugToId.set(restaurant.slug, created.id);
        existingSlugs.add(restaurant.slug);
        createdBranches++;
      }
    }
    
    if (createdBranches > 0) console.log(`✓ Created ${createdBranches} branches`);
    if (updatedBranches > 0) console.log(`✓ Updated ${updatedBranches} branches`);
    
    // Seed menu categories
    if (seedData.menuCategories && seedData.menuCategories.length > 0) {
      console.log("Checking menu categories...");
      const existingCategories = await db.select().from(schema.menuCategories);
      // Create sets for BOTH slug and name to prevent duplicates
      const existingCategoryBySlug = new Set(existingCategories.map((c) => `${c.slug}:${c.restaurantId || 'global'}`));
      const existingCategoryByName = new Set(existingCategories.map((c) => `${c.name.toLowerCase()}:${c.restaurantId || 'global'}`));
      
      let createdCategories = 0;
      for (const category of seedData.menuCategories) {
        const seedCategory = category as any;
        const seedRestaurantId = seedCategory.restaurant_id || null;
        
        // Map the seed restaurant_id to actual restaurant ID using slug
        let actualRestaurantId: string | null = null;
        if (seedRestaurantId) {
          const slug = seedIdToSlug.get(seedRestaurantId);
          if (slug) {
            actualRestaurantId = existingSlugToId.get(slug) || null;
          }
          // If no mapping found, skip this category (orphan)
          if (!actualRestaurantId) {
            continue;
          }
        }
        
        const slugKey = `${category.slug}:${actualRestaurantId || 'global'}`;
        const nameKey = `${category.name.toLowerCase()}:${actualRestaurantId || 'global'}`;
        
        // Skip if already exists by slug OR by name (prevents duplicates)
        if (existingCategoryBySlug.has(slugKey) || existingCategoryByName.has(nameKey)) continue;
        
        try {
          await db.insert(schema.menuCategories).values({
            slug: category.slug,
            name: category.name,
            icon: category.icon || "Utensils",
            sortOrder: seedCategory.sort_order || category.sortOrder || 0,
            restaurantId: actualRestaurantId,
            imageUrl: seedCategory.image_url || null,
            videoUrl: seedCategory.video_url || null,
            gifUrl: seedCategory.gif_url || null,
            description: seedCategory.description || null,
            isEnabled: seedCategory.is_enabled !== false,
            showInOnline: seedCategory.show_in_online !== false,
            showInEpos: seedCategory.show_in_epos !== false,
            showInWaiter: seedCategory.show_in_waiter !== false,
            showInTelephone: seedCategory.show_in_telephone !== false,
          });
          existingCategoryBySlug.add(slugKey);
          existingCategoryByName.add(nameKey);
          createdCategories++;
        } catch (err) {
          console.error(`Failed to create category ${category.name}:`, err);
        }
      }
      console.log(`✓ Created ${createdCategories} menu categories`);
    }
    
    console.log("Checking menu items...");
    const existingMenuItems = await db.select().from(schema.menuItems);
    const existingMenuByRestaurant = new Map<string, Set<string>>();
    
    for (const item of existingMenuItems) {
      const restId = item.restaurantId || "";
      if (!existingMenuByRestaurant.has(restId)) {
        existingMenuByRestaurant.set(restId, new Set());
      }
      existingMenuByRestaurant.get(restId)!.add(item.name);
    }
    
    // Build a map of category slug -> category ID for each restaurant
    const allCategories = await db.select().from(schema.menuCategories);
    const categorySlugToId = new Map<string, string>(); // "restaurantId:slug" -> categoryId
    for (const cat of allCategories) {
      if (cat.restaurantId && cat.slug) {
        categorySlugToId.set(`${cat.restaurantId}:${cat.slug}`, cat.id);
      }
    }
    
    let createdMenuItems = 0;
    for (const menuItem of seedData.menuItems) {
      const slug = seedIdToSlug.get(menuItem.restaurant_id);
      if (!slug) continue;
      
      const actualRestaurantId = existingSlugToId.get(slug);
      if (!actualRestaurantId) continue;
      
      const existingItems = existingMenuByRestaurant.get(actualRestaurantId);
      if (existingItems?.has(menuItem.name)) continue;
      
      // Map category slug to actual category ID
      let categoryValue = menuItem.category;
      const categoryKey = `${actualRestaurantId}:${menuItem.category}`;
      if (categorySlugToId.has(categoryKey)) {
        categoryValue = categorySlugToId.get(categoryKey)!;
      }
      
      await db.insert(schema.menuItems).values({
        id: menuItem.id,
        restaurantId: actualRestaurantId,
        name: menuItem.name,
        description: menuItem.description || "",
        price: menuItem.price,
        category: categoryValue,
        image: menuItem.image || "",
        available: menuItem.available ?? true,
        allergenProfile: menuItem.allergen_profile || undefined,
      });
      
      if (!existingMenuByRestaurant.has(actualRestaurantId)) {
        existingMenuByRestaurant.set(actualRestaurantId, new Set());
      }
      existingMenuByRestaurant.get(actualRestaurantId)!.add(menuItem.name);
      createdMenuItems++;
    }
    
    console.log(`✓ Created ${createdMenuItems} menu items`);
    
    // Seed extra toppings
    const extraToppings = (embeddedSeedData as any).extraToppings || [];
    if (extraToppings.length > 0) {
      console.log("Checking extra toppings...");
      const existingToppings = await db.select().from(schema.extraToppings);
      const existingToppingIds = new Set(existingToppings.map((t: any) => t.id));
      
      let createdToppings = 0;
      for (const topping of extraToppings) {
        if (!existingToppingIds.has(topping.id)) {
          await db.insert(schema.extraToppings).values({
            id: topping.id,
            restaurantId: topping.restaurant_id,
            name: topping.name,
            price: topping.price,
            isActive: topping.is_active ?? true,
            sortOrder: topping.sort_order ?? 0,
            image: topping.image || null,
          });
          createdToppings++;
        }
      }
      console.log(`✓ Created ${createdToppings} extra toppings`);
    }
    
    // Seed topping groups - look up menu items by name to handle ID mismatches
    const toppingGroups = (embeddedSeedData as any).toppingGroups || [];
    if (toppingGroups.length > 0) {
      console.log("Syncing topping groups...");
      const existingGroups = await db.select().from(schema.toppingGroups);
      const existingGroupIds = new Set(existingGroups.map((g: any) => g.id));
      
      // Build map of seed menu item IDs to names
      const seedMenuItems = seedData.menuItems || [];
      const seedIdToName = new Map<string, string>();
      for (const item of seedMenuItems) {
        seedIdToName.set(item.id, item.name);
      }
      
      // Build map of production menu item names to IDs per restaurant
      const allMenuItems = await db.select().from(schema.menuItems);
      const prodNameToId = new Map<string, string>();
      for (const item of allMenuItems) {
        const key = `${item.restaurantId}:${item.name}`;
        prodNameToId.set(key, item.id);
      }
      
      let createdGroups = 0;
      for (const group of toppingGroups) {
        if (!existingGroupIds.has(group.id)) {
          // Look up actual restaurant ID from slug
          const slug = seedIdToSlug.get(group.restaurant_id);
          const actualRestaurantId = slug ? existingSlugToId.get(slug) : group.restaurant_id;
          
          // Look up actual menu item ID by name
          const menuItemName = seedIdToName.get(group.menu_item_id);
          let actualMenuItemId = group.menu_item_id;
          if (menuItemName && actualRestaurantId) {
            const prodId = prodNameToId.get(`${actualRestaurantId}:${menuItemName}`);
            if (prodId) actualMenuItemId = prodId;
          }
          
          try {
            await db.insert(schema.toppingGroups).values({
              id: group.id,
              restaurantId: actualRestaurantId || group.restaurant_id,
              menuItemId: actualMenuItemId,
              headline: group.headline,
              isRequired: group.is_required ?? false,
              maxSelections: group.max_selections ?? 1,
              allowQuantity: group.allow_quantity ?? false,
              maxQuantityPerOption: group.max_quantity_per_option ?? 5,
              sortOrder: group.sort_order ?? 0,
            });
            createdGroups++;
          } catch (err) {
            console.error(`Failed to create topping group ${group.id}:`, err);
          }
        }
      }
      console.log(`✓ Created ${createdGroups} topping groups`);
    }
    
    // Seed topping group options
    const toppingGroupOptions = (embeddedSeedData as any).toppingGroupOptions || [];
    if (toppingGroupOptions.length > 0) {
      console.log("Syncing topping group options...");
      const existingOptions = await db.select().from(schema.toppingGroupOptions);
      const existingOptionIds = new Set(existingOptions.map((o: any) => o.id));
      
      let createdOptions = 0;
      for (const option of toppingGroupOptions) {
        if (!existingOptionIds.has(option.id)) {
          await db.insert(schema.toppingGroupOptions).values({
            id: option.id,
            groupId: option.group_id,
            name: option.name,
            price: option.price,
            image: option.image || "",
            isDefault: option.is_default ?? false,
            isAvailable: option.is_available ?? true,
            sortOrder: option.sort_order ?? 0,
          });
          createdOptions++;
        }
      }
      console.log(`✓ Created ${createdOptions} topping group options`);
    }
    
    // Seed property branches - USE SLUG-BASED MATCHING (like restaurants)
    const propertyBranches = (embeddedSeedData as any).propertyBranches || [];
    console.log(`[PropertySync] Found ${propertyBranches.length} property branches in seed data`);
    if (propertyBranches.length > 0) {
      console.log("Syncing property branches...");
      const existingPropertyBranches = await db.select().from(schema.propertyBranches);
      console.log(`[PropertySync] Found ${existingPropertyBranches.length} existing property branches in database`);
      
      // Create slug-to-record map for proper matching (production may have different IDs)
      const existingBySlug = new Map(existingPropertyBranches.map((pb: any) => [pb.slug, pb]));
      const existingById = new Map(existingPropertyBranches.map((pb: any) => [pb.id, pb]));
      
      let createdPropertyBranches = 0;
      let updatedPropertyBranches = 0;
      
      for (const pb of propertyBranches) {
        // First check by slug (production may have different IDs)
        const existingBySlugRecord = existingBySlug.get(pb.slug);
        const existingByIdRecord = existingById.get(pb.id);
        
        // Find the actual record to update (prefer slug match over ID match)
        const existingRecord = existingBySlugRecord || existingByIdRecord;
        
        if (existingRecord) {
          // Update existing property branch using the PRODUCTION database ID
          try {
            await db.update(schema.propertyBranches)
              .set({
                name: pb.name,
                address: pb.address,
                phone: pb.phone,
                email: pb.email,
                logoUrl: pb.logo_url,
                loginUsername: pb.login_username,
                loginPassword: pb.login_password,
                jazzCashEnabled: pb.jazzcash_enabled,
                jazzCashNumber: pb.jazzcash_number,
                easyPaisaEnabled: pb.easypaisa_enabled,
                easyPaisaNumber: pb.easypaisa_number,
                hblBankEnabled: pb.hbl_bank_enabled,
                hblAccountNumber: pb.hbl_account_number,
                hblAccountTitle: pb.hbl_account_title,
                cashOnDeliveryEnabled: pb.cash_on_delivery_enabled,
                commissionRate: pb.commission_rate,
                visitCharges: pb.visit_charges,
                primaryColor: pb.primary_color,
                secondaryColor: pb.secondary_color,
                isActive: pb.is_active,
                whatsappNumber: pb.whatsapp_number,
                ownerName: pb.owner_name,
                videoUrl: pb.video_url,
                facebookUrl: pb.facebook_url,
                instagramUrl: pb.instagram_url,
                twitterUrl: pb.twitter_url,
                youtubeUrl: pb.youtube_url,
                contactBgImages: pb.contact_bg_images,
                advantages: pb.advantages,
                featuredProperties: pb.featured_properties,
                announcementText: pb.announcement_text,
                announcementEnabled: pb.announcement_enabled,
                heroTagline: pb.hero_tagline,
                heroTitle1: pb.hero_title1,
                heroTitle2: pb.hero_title2,
                heroTitle3: pb.hero_title3,
                heroDescription: pb.hero_description,
                servicesTagline: pb.services_tagline,
                servicesTitle: pb.services_title,
                servicesDescription: pb.services_description,
                serviceCards: pb.service_cards,
                visitFee: pb.visit_fee,
                mapEmbedUrl: pb.map_embed_url,
                themeConfig: pb.theme_config,
                monthlyFee: pb.monthly_fee,
                currency: pb.currency,
                isOpen: pb.is_open,
                googleMapsUrl: pb.google_maps_url,
                useDefaultUrl: pb.use_default_url,
                subdomain: pb.subdomain,
                customDomain: pb.custom_domain,
                agreedPrice: pb.agreed_price,
              })
              .where(eq(schema.propertyBranches.id, existingRecord.id)); // Use PRODUCTION ID
            console.log(`Updated property branch: ${pb.name} (slug: ${pb.slug})`);
            updatedPropertyBranches++;
          } catch (err) {
            console.error(`Failed to update property branch ${pb.name}:`, err);
          }
        } else {
          // Create new property branch
          try {
            await db.insert(schema.propertyBranches).values({
              id: pb.id,
              name: pb.name,
              slug: pb.slug,
              address: pb.address,
              phone: pb.phone,
              email: pb.email,
              logoUrl: pb.logo_url,
              loginUsername: pb.login_username,
              loginPassword: pb.login_password,
              jazzCashEnabled: pb.jazzcash_enabled ?? false,
              jazzCashNumber: pb.jazzcash_number,
              easyPaisaEnabled: pb.easypaisa_enabled ?? false,
              easyPaisaNumber: pb.easypaisa_number,
              hblBankEnabled: pb.hbl_bank_enabled ?? false,
              hblAccountNumber: pb.hbl_account_number,
              hblAccountTitle: pb.hbl_account_title,
              cashOnDeliveryEnabled: pb.cash_on_delivery_enabled ?? true,
              commissionRate: pb.commission_rate,
              visitCharges: pb.visit_charges,
              primaryColor: pb.primary_color,
              secondaryColor: pb.secondary_color,
              isActive: pb.is_active ?? true,
              whatsappNumber: pb.whatsapp_number,
              ownerName: pb.owner_name,
              videoUrl: pb.video_url,
              facebookUrl: pb.facebook_url,
              instagramUrl: pb.instagram_url,
              twitterUrl: pb.twitter_url,
              youtubeUrl: pb.youtube_url,
              contactBgImages: pb.contact_bg_images,
              advantages: pb.advantages,
              featuredProperties: pb.featured_properties,
              announcementText: pb.announcement_text,
              announcementEnabled: pb.announcement_enabled ?? true,
              heroTagline: pb.hero_tagline,
              heroTitle1: pb.hero_title1,
              heroTitle2: pb.hero_title2,
              heroTitle3: pb.hero_title3,
              heroDescription: pb.hero_description,
              servicesTagline: pb.services_tagline,
              servicesTitle: pb.services_title,
              servicesDescription: pb.services_description,
              serviceCards: pb.service_cards,
              visitFee: pb.visit_fee,
              mapEmbedUrl: pb.map_embed_url,
              themeConfig: pb.theme_config,
              monthlyFee: pb.monthly_fee,
              currency: pb.currency ?? "PKR",
              isOpen: pb.is_open ?? true,
              googleMapsUrl: pb.google_maps_url,
              useDefaultUrl: pb.use_default_url ?? true,
              subdomain: pb.subdomain,
              customDomain: pb.custom_domain,
              agreedPrice: pb.agreed_price,
            });
            console.log(`Created property branch: ${pb.name} (slug: ${pb.slug})`);
            createdPropertyBranches++;
          } catch (err) {
            console.error(`Failed to create property branch ${pb.name}:`, err);
          }
        }
      }
      console.log(`✓ Created ${createdPropertyBranches} property branches, updated ${updatedPropertyBranches}`);
    }
    
    console.log("=== AUTO-SEED COMPLETE ===");
    
    // Clean up duplicate/invalid categories for EMPARO PERI PERI Southend
    await cleanupDuplicateCategories();
    
  } catch (error) {
    console.error("Error during auto-seed:", error);
  }
}

// Cleanup function to remove duplicate and invalid categories
async function cleanupDuplicateCategories() {
  console.log("[Cleanup] Starting duplicate category cleanup...");
  
  try {
    // Get EMPARO PERI PERI Southend restaurant - try multiple ways
    const allRestaurants = await db.select().from(schema.restaurants);
    const southendRestaurant = allRestaurants.find(r => 
      r.slug === "emparo-peri-peri-southend" || 
      r.name.toLowerCase().includes("emparo") && r.name.toLowerCase().includes("southend")
    );
    
    if (!southendRestaurant) {
      console.log("[Cleanup] EMPARO PERI PERI Southend not found");
      return;
    }
    
    console.log(`[Cleanup] Found restaurant: ${southendRestaurant.name} (ID: ${southendRestaurant.id})`);
    
    // Get all categories for this restaurant
    const categories = await db.select()
      .from(schema.menuCategories)
      .where(eq(schema.menuCategories.restaurantId, southendRestaurant.id));
    
    console.log(`[Cleanup] Found ${categories.length} categories for this restaurant`);
    
    // Categories to DELETE (exact names of duplicates - only these 5)
    const categoriesToDelete = new Set([
      "Grilled Burger and Wraps",  // Duplicate - user has "Grilled Burgers and Wraps"
      "Pizza",                      // Duplicate - user has "Pizza 12\" Large" and "Create Your Own Pizza"
      "Starters",                   // Duplicate - user has "Starters/Sides"
      "Chicken",                    // Duplicate - user has "Grilled Chicken"
      "Sides",                      // Duplicate - user has "Starters/Sides"
    ]);
    
    // Find categories to delete (exact match)
    const toDelete: string[] = [];
    for (const cat of categories) {
      console.log(`[Cleanup] Checking: "${cat.name}"`);
      if (categoriesToDelete.has(cat.name)) {
        toDelete.push(cat.id);
        console.log(`[Cleanup] WILL DELETE: "${cat.name}" (ID: ${cat.id})`);
      }
    }
    
    // Delete invalid categories
    if (toDelete.length > 0) {
      for (const catId of toDelete) {
        await db.delete(schema.menuCategories)
          .where(eq(schema.menuCategories.id, catId));
      }
      console.log(`[Cleanup] SUCCESS: Deleted ${toDelete.length} duplicate categories from EMPARO PERI PERI Southend`);
    } else {
      console.log("[Cleanup] No duplicate categories found to delete");
    }
    
    // Verify final count
    const remainingCategories = await db.select()
      .from(schema.menuCategories)
      .where(eq(schema.menuCategories.restaurantId, southendRestaurant.id));
    console.log(`[Cleanup] Remaining categories: ${remainingCategories.length}`);
    remainingCategories.forEach(c => console.log(`  - ${c.name}`));
    
  } catch (error) {
    console.error("[Cleanup] Error cleaning up categories:", error);
  }
}
