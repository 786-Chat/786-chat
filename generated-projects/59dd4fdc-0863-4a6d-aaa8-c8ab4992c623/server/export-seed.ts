import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import ws from "ws";
import fs from "fs";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function exportSeedData(branchSlug?: string) {
  console.log("Exporting database to seed files...");
  if (branchSlug) {
    console.log(`Filtering for branch: ${branchSlug}`);
  }
  
  // Fetch all data
  let restaurants = await db.select().from(schema.restaurants);
  
  // Filter by branch if specified
  if (branchSlug) {
    restaurants = restaurants.filter(r => r.slug === branchSlug);
    if (restaurants.length === 0) {
      console.error(`No restaurant found with slug: ${branchSlug}`);
      await pool.end();
      process.exit(1);
    }
  }
  
  const restaurantIds = restaurants.map(r => r.id);
  
  // Core menu data
  const menuItems = await db.select().from(schema.menuItems);
  const menuCategories = await db.select().from(schema.menuCategories);
  const menuModifiers = await db.select().from(schema.menuModifiers);
  const menuItemVariants = await db.select().from(schema.menuItemVariants);
  const extraToppings = await db.select().from(schema.extraToppings);
  
  // Presentation & branding
  const promotions = await db.select().from(schema.promotions);
  const heroImages = await db.select().from(schema.restaurantHeroImages);
  const popularItems = await db.select().from(schema.popularItems);
  const dashboardSettings = await db.select().from(schema.restaurantDashboardSettings);
  const galleryImages = await db.select().from(schema.galleryImages);
  
  // Operations
  const kitchenStations = await db.select().from(schema.kitchenStations);
  const waiters = await db.select().from(schema.waiters);
  const waiterTablets = await db.select().from(schema.waiterTablets);
  const drivers = await db.select().from(schema.drivers);
  
  // Suppliers
  const suppliers = await db.select().from(schema.suppliers);
  const supplierProducts = await db.select().from(schema.supplierProducts);
  
  // Property Branches
  const propertyBranches = await db.select().from(schema.propertyBranches);
  console.log(`Found ${propertyBranches.length} property branches`);
  
  // Filter by restaurant IDs if branch-specific export
  const filterByRestaurant = <T extends { restaurantId?: string | null }>(items: T[]) =>
    branchSlug ? items.filter(i => restaurantIds.includes(i.restaurantId!)) : items;
  
  // Filter menu modifiers and variants by menu item IDs
  const menuItemIds = filterByRestaurant(menuItems).map(m => m.id);
  const supplierIds = filterByRestaurant(suppliers).map(s => s.id);
  
  console.log(`Found ${restaurants.length} restaurants`);
  console.log(`Found ${menuItems.length} menu items`);
  console.log(`Found ${menuCategories.length} menu categories`);
  console.log(`Found ${menuModifiers.length} menu modifiers`);
  console.log(`Found ${menuItemVariants.length} menu item variants`);
  console.log(`Found ${extraToppings.length} extra toppings`);
  console.log(`Found ${promotions.length} promotions`);
  console.log(`Found ${heroImages.length} hero images`);
  console.log(`Found ${popularItems.length} popular items`);
  console.log(`Found ${dashboardSettings.length} dashboard settings`);
  console.log(`Found ${kitchenStations.length} kitchen stations`);
  console.log(`Found ${waiters.length} waiters`);
  console.log(`Found ${waiterTablets.length} waiter tablets`);
  console.log(`Found ${drivers.length} drivers`);
  console.log(`Found ${suppliers.length} suppliers`);
  console.log(`Found ${supplierProducts.length} supplier products`);
  
  const seedData = {
    restaurants: restaurants.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      address: r.address,
      status: r.status,
      rating: r.rating,
      orders_today: r.ordersToday,
      revenue_today: r.revenueToday,
      last_order_time: r.lastOrderTime,
      google_maps_url: r.googleMapsUrl,
      stripe_account_id: null, // Sanitized - configure per environment
      login_username: r.loginUsername,
      login_password: null, // Sanitized - set manually after seeding
      created_at: r.createdAt,
      logo_url: r.logoUrl,
      theme_key: r.themeKey,
      currency: r.currency,
      phone: r.phone,
      welcome_image_url: r.welcomeImageUrl,
      hero_animation_style: r.heroAnimationStyle,
      hero_slide_interval: r.heroSlideInterval,
      hero_gradient_start: r.heroGradientStart,
      hero_gradient_middle: r.heroGradientMiddle,
      hero_gradient_end: r.heroGradientEnd,
      delivery_hours_mon_thu: r.deliveryHoursMonThu,
      delivery_hours_fri_sat: r.deliveryHoursFriSat,
      delivery_hours_sun: r.deliveryHoursSun,
      collection_hours_mon_thu: r.collectionHoursMonThu,
      collection_hours_fri_sat: r.collectionHoursFriSat,
      collection_hours_sun: r.collectionHoursSun,
      accepting_orders: r.acceptingOrders,
      email: r.email,
      tawa_hero_image: r.tawaHeroImage,
      tawa_hero_video: r.tawaHeroVideo,
      emparo_hero_image: r.emparoHeroImage,
      emparo_hero_video: r.emparoHeroVideo,
      collection_discount_percent: r.collectionDiscountPercent,
      collection_discount_minimum: r.collectionDiscountMinimum,
      stripe_publishable_key: null, // Sanitized - configure per environment
      stripe_secret_key: null, // Sanitized - configure per environment
      supplier_order_from_email: r.supplierOrderFromEmail,
    })),
    
    menuItems: filterByRestaurant(menuItems).map(m => ({
      id: m.id,
      restaurant_id: m.restaurantId,
      name: m.name,
      description: m.description,
      price: m.price,
      category: m.category,
      image: m.image,
      available: m.available,
      created_at: m.createdAt,
      allergen_profile: m.allergenProfile,
    })),
    
    menuCategories: filterByRestaurant(menuCategories).map(c => ({
      id: c.id,
      restaurant_id: c.restaurantId,
      slug: c.slug,
      name: c.name,
      icon: c.icon,
      sort_order: c.sortOrder,
      image_url: c.imageUrl,
      video_url: c.videoUrl,
      gif_url: c.gifUrl,
      description: c.description,
      is_enabled: c.isEnabled,
      show_in_online: c.showInOnline,
      show_in_epos: c.showInEpos,
      show_in_waiter: c.showInWaiter,
      show_in_telephone: c.showInTelephone,
    })),
    
    menuModifiers: menuModifiers.filter(m => menuItemIds.includes(m.menuItemId)).map(m => ({
      id: m.id,
      menu_item_id: m.menuItemId,
      name: m.name,
      price: m.price,
      available: m.available,
    })),
    
    menuItemVariants: menuItemVariants.filter(v => menuItemIds.includes(v.menuItemId)).map(v => ({
      id: v.id,
      menu_item_id: v.menuItemId,
      name: v.name,
      price: v.price,
      sort_order: v.sortOrder,
      available: v.available,
    })),
    
    extraToppings: filterByRestaurant(extraToppings).map(t => ({
      id: t.id,
      restaurant_id: t.restaurantId,
      name: t.name,
      price: t.price,
      is_active: t.isActive,
      sort_order: t.sortOrder,
    })),
    
    promotions: filterByRestaurant(promotions).map(p => ({
      id: p.id,
      restaurant_id: p.restaurantId,
      headline: p.headline,
      subtext: p.subtext,
      is_active: p.isActive,
      background_color: p.backgroundColor,
      text_color: p.textColor,
    })),
    
    heroImages: filterByRestaurant(heroImages).map(h => ({
      id: h.id,
      restaurant_id: h.restaurantId,
      image_url: h.imageUrl,
      label: h.label,
      sort_order: h.sortOrder,
      is_active: h.isActive,
    })),
    
    popularItems: filterByRestaurant(popularItems).map(p => ({
      id: p.id,
      restaurant_id: p.restaurantId,
      name: p.name,
      image_url: p.imageUrl,
      link_url: p.linkUrl,
      sort_order: p.sortOrder,
      is_active: p.isActive,
    })),
    
    dashboardSettings: filterByRestaurant(dashboardSettings).map(s => ({
      id: s.id,
      restaurant_id: s.restaurantId,
      promotions_enabled: s.promotionsEnabled,
      branding_enabled: s.brandingEnabled,
      hours_enabled: s.hoursEnabled,
      hero_gallery_enabled: s.heroGalleryEnabled,
    })),
    
    galleryImages: filterByRestaurant(galleryImages).map(g => ({
      id: g.id,
      restaurant_id: g.restaurantId,
      image_url: g.imageUrl,
      title: g.title,
      sort_order: g.sortOrder,
    })),
    
    kitchenStations: filterByRestaurant(kitchenStations).map(s => ({
      id: s.id,
      restaurant_id: s.restaurantId,
      name: s.name,
      slug: s.slug,
      color: s.color,
      categories: s.categories,
      display_order: s.displayOrder,
      is_active: s.isActive,
    })),
    
    waiters: filterByRestaurant(waiters).map(w => ({
      id: w.id,
      restaurant_id: w.restaurantId,
      name: w.name,
      area: w.area,
      room_number: w.roomNumber,
      pin: w.pin,
      status: w.status,
    })),
    
    waiterTablets: filterByRestaurant(waiterTablets).map(t => ({
      id: t.id,
      restaurant_id: t.restaurantId,
      tablet_number: t.tabletNumber,
      is_active: false, // Always reset to inactive on seed
      order_count: 0,
    })),
    
    drivers: filterByRestaurant(drivers).map(d => ({
      id: d.id,
      restaurant_id: d.restaurantId,
      name: d.name,
      phone: d.phone,
      password: d.password, // Hashed password
      vehicle_type: d.vehicleType,
      vehicle_plate: d.vehiclePlate,
      is_active: d.isActive,
      is_on_duty: false, // Always reset to off-duty on seed
      payment_type: d.paymentType,
      mileage_rate_1: d.mileageRate1,
      mileage_rate_2: d.mileageRate2,
      mileage_rate_3: d.mileageRate3,
      mileage_range_1_max: d.mileageRange1Max,
      mileage_range_2_max: d.mileageRange2Max,
      mileage_range_3_max: d.mileageRange3Max,
      salary_amount: d.salaryAmount,
      salary_period: d.salaryPeriod,
      agreed_delivery_charge: d.agreedDeliveryCharge,
      license_type: d.licenseType,
      license_copy_url: d.licenseCopyUrl,
    })),
    
    suppliers: filterByRestaurant(suppliers).map(s => ({
      id: s.id,
      restaurant_id: s.restaurantId,
      name: s.name,
      email: s.email,
      phone: s.phone,
      whatsapp: s.whatsapp,
      contact_name: s.contactName,
      notes: s.notes,
      is_active: s.isActive,
    })),
    
    supplierProducts: supplierProducts.filter(p => supplierIds.includes(p.supplierId)).map(p => ({
      id: p.id,
      supplier_id: p.supplierId,
      name: p.name,
      unit_type: p.unitType,
      unit_label: p.unitLabel,
      price_per_unit: p.pricePerUnit,
      is_active: p.isActive,
    })),
    
    propertyBranches: propertyBranches.map(pb => ({
      id: pb.id,
      name: pb.name,
      slug: pb.slug,
      address: pb.address,
      phone: pb.phone,
      email: pb.email,
      logo_url: pb.logoUrl,
      login_username: pb.loginUsername,
      login_password: pb.loginPassword,
      jazzcash_enabled: pb.jazzCashEnabled,
      jazzcash_number: pb.jazzCashNumber,
      easypaisa_enabled: pb.easyPaisaEnabled,
      easypaisa_number: pb.easyPaisaNumber,
      hbl_bank_enabled: pb.hblBankEnabled,
      hbl_account_number: pb.hblAccountNumber,
      hbl_account_title: pb.hblAccountTitle,
      cash_on_delivery_enabled: pb.cashOnDeliveryEnabled,
      commission_rate: pb.commissionRate,
      visit_charges: pb.visitCharges,
      primary_color: pb.primaryColor,
      secondary_color: pb.secondaryColor,
      is_active: pb.isActive,
      whatsapp_number: pb.whatsappNumber,
      owner_name: pb.ownerName,
      video_url: pb.videoUrl,
      facebook_url: pb.facebookUrl,
      instagram_url: pb.instagramUrl,
      twitter_url: pb.twitterUrl,
      youtube_url: pb.youtubeUrl,
      contact_bg_images: pb.contactBgImages,
      advantages: pb.advantages,
      featured_properties: pb.featuredProperties,
      announcement_text: pb.announcementText,
      announcement_enabled: pb.announcementEnabled,
      hero_tagline: pb.heroTagline,
      hero_title1: pb.heroTitle1,
      hero_title2: pb.heroTitle2,
      hero_title3: pb.heroTitle3,
      hero_description: pb.heroDescription,
      services_tagline: pb.servicesTagline,
      services_title: pb.servicesTitle,
      services_description: pb.servicesDescription,
      service_cards: pb.serviceCards,
      visit_fee: pb.visitFee,
      map_embed_url: pb.mapEmbedUrl,
      theme_config: pb.themeConfig,
      monthly_fee: pb.monthlyFee,
      currency: pb.currency,
      is_open: pb.isOpen,
      google_maps_url: pb.googleMapsUrl,
      use_default_url: pb.useDefaultUrl,
      subdomain: pb.subdomain,
      custom_domain: pb.customDomain,
      agreed_price: pb.agreedPrice,
    })),
  };
  
  // Write JSON file
  const jsonPath = branchSlug 
    ? `server/seed-data-${branchSlug}.json`
    : "server/seed-data.json";
  fs.writeFileSync(jsonPath, JSON.stringify(seedData, null, 2));
  console.log(`Written to ${jsonPath}`);
  
  // Write TypeScript file
  const tsPath = branchSlug
    ? `server/embedded-seed-data-${branchSlug}.ts`
    : "server/embedded-seed-data.ts";
  const tsContent = `export const embeddedSeedData = ${JSON.stringify(seedData, null, 2)};`;
  fs.writeFileSync(tsPath, tsContent);
  console.log(`Written to ${tsPath}`);
  
  await pool.end();
  console.log("Export complete!");
}

// Parse CLI arguments
const args = process.argv.slice(2);
const branchSlug = args.find(arg => arg.startsWith("--branch="))?.split("=")[1];

exportSeedData(branchSlug).catch(console.error);
