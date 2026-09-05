import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Allergen constants and types
export const ALLERGEN_KEYS = [
  "gluten", "crustaceans", "eggs", "fish", "peanuts", "soybeans", 
  "milk", "nuts", "celery", "mustard", "sesame", "sulphites", "lupin", "molluscs"
] as const;

export type AllergenKey = typeof ALLERGEN_KEYS[number];
export type AllergenStatus = "contains" | "may_contain" | "free" | "unknown";
export type AllergenProfile = Partial<Record<AllergenKey, AllergenStatus>>;

export const allergenStatusSchema = z.enum(["contains", "may_contain", "free", "unknown"]);
export const allergenProfileSchema = z.record(
  z.enum(ALLERGEN_KEYS),
  allergenStatusSchema
).optional();

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique("users_username_unique"),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const restaurantStatusEnum = pgEnum("restaurant_status", ["open", "closed"]);
export const heroAnimationStyleEnum = pgEnum("hero_animation_style", ["slide", "fade", "scrapbook", "stomp", "flicker", "pulse", "tectonic"]);
export const welcomeBackgroundTypeEnum = pgEnum("welcome_background_type", ["image", "gif", "video", "slider", "gradient"]);

export const restaurants = pgTable("restaurants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique("restaurants_slug_unique"),
  address: text("address").notNull(),
  phone: text("phone"),
  email: text("email"),
  status: restaurantStatusEnum("status").notNull().default("closed"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("5.0"),
  ordersToday: integer("orders_today").default(0),
  revenueToday: decimal("revenue_today", { precision: 10, scale: 2 }).default("0.00"),
  lastOrderTime: text("last_order_time").default("Never"),
  googleMapsUrl: text("google_maps_url"),
  stripeAccountId: text("stripe_account_id"),
  stripePublishableKey: text("stripe_publishable_key"),
  stripeSecretKey: text("stripe_secret_key"),
  cardEnabled: boolean("card_enabled").default(false),
  loginUsername: text("login_username"),
  loginPassword: text("login_password"),
  kitchenLoginPassword: text("kitchen_login_password"),
  kitchenStaffName: text("kitchen_staff_name"),
  eposLoginPassword: text("epos_login_password"),
  eposStaffName: text("epos_staff_name"),
  waiterLoginPassword: text("waiter_login_password"),
  waiterStaffName: text("waiter_staff_name"),
  suppliersLoginPassword: text("suppliers_login_password"),
  suppliersStaffName: text("suppliers_staff_name"),
  financesLoginPassword: text("finances_login_password"),
  financesStaffName: text("finances_staff_name"),
  logoUrl: text("logo_url"),
  welcomeImageUrl: text("welcome_image_url"),
  themeKey: text("theme_key").default("classic"),
  heroAnimationStyle: heroAnimationStyleEnum("hero_animation_style").default("slide"),
  heroSlideInterval: integer("hero_slide_interval").default(5000),
  heroGradientStart: text("hero_gradient_start").default("#dc2626"),
  heroGradientMiddle: text("hero_gradient_middle").default("#f97316"),
  heroGradientEnd: text("hero_gradient_end").default("#fbbf24"),
  primaryColor: text("primary_color").default("#8B0000"),
  secondaryColor: text("secondary_color").default("#FFD700"),
  accentColor: text("accent_color").default("#4A0E4E"),
  headerBgColor: text("header_bg_color").default("#1a1a2e"),
  cardBgColor: text("card_bg_color").default("#ffffff"),
  buttonColor: text("button_color").default("#dc2626"),
  textColor: text("text_color").default("#ffffff"),
  heroVideoUrl: text("hero_video_url"),
  heroGifUrl: text("hero_gif_url"),
  welcomeBackgroundType: text("welcome_background_type").default("gradient"),
  welcomeBackgroundImageUrl: text("welcome_background_image_url"),
  welcomeBackgroundGifUrl: text("welcome_background_gif_url"),
  welcomeBackgroundVideoUrl: text("welcome_background_video_url"),
  welcomeSliderImages: jsonb("welcome_slider_images").default([]),
  menuBackgroundType: text("menu_background_type").default("gradient"),
  menuBackgroundImageUrl: text("menu_background_image_url"),
  menuBackgroundVideoUrl: text("menu_background_video_url"),
  menuGradientStart: text("menu_gradient_start").default("#1a1a2e"),
  menuGradientMiddle: text("menu_gradient_middle"),
  menuGradientEnd: text("menu_gradient_end").default("#1a1a2e"),
  deliveryHoursMonThu: text("delivery_hours_mon_thu").default("12PM - 10:30PM"),
  deliveryHoursFriSat: text("delivery_hours_fri_sat").default("12PM - 11:30PM"),
  deliveryHoursSun: text("delivery_hours_sun").default("12PM - 10:30PM"),
  collectionHoursMonThu: text("collection_hours_mon_thu").default("12PM - 10:30PM"),
  collectionHoursFriSat: text("collection_hours_fri_sat").default("12PM - 11:30PM"),
  collectionHoursSun: text("collection_hours_sun").default("12PM - 10:30PM"),
  acceptingOrders: boolean("accepting_orders").default(true),
  tawaHeroImage: text("tawa_hero_image"),
  tawaHeroVideo: text("tawa_hero_video"),
  emparoHeroImage: text("emparo_hero_image"),
  emparoHeroVideo: text("emparo_hero_video"),
  collectionDiscountPercent: integer("collection_discount_percent").default(10),
  collectionDiscountMinimum: decimal("collection_discount_minimum", { precision: 10, scale: 2 }).default("15.00"),
  supplierOrderFromEmail: text("supplier_order_from_email"),
  currency: text("currency").default("GBP"),
  deliveryTimeMinutes: integer("delivery_time_minutes").default(45),
  collectionTimeMinutes: integer("collection_time_minutes").default(20),
  busyModeEnabled: boolean("busy_mode_enabled").default(false),
  busyModeExtraMinutes: integer("busy_mode_extra_minutes").default(15),
  bankTransferEnabled: boolean("bank_transfer_enabled").default(false),
  bankName: text("bank_name"),
  bankAccountName: text("bank_account_name"),
  bankSortCode: text("bank_sort_code"),
  bankAccountNumber: text("bank_account_number"),
  bankIban: text("bank_iban"),
  bankTransferVideoUrl: text("bank_transfer_video_url"),
  easypaisaAccountNumber: text("easypaisa_account_number"),
  easypaisaAccountName: text("easypaisa_account_name"),
  jazzcashAccountNumber: text("jazzcash_account_number"),
  jazzcashAccountName: text("jazzcash_account_name"),
  hblAccountNumber: text("hbl_account_number"),
  hblAccountName: text("hbl_account_name"),
  hblIban: text("hbl_iban"),
  ublAccountNumber: text("ubl_account_number"),
  ublAccountName: text("ubl_account_name"),
  ublIban: text("ubl_iban"),
  meezanAccountNumber: text("meezan_account_number"),
  meezanAccountName: text("meezan_account_name"),
  meezanIban: text("meezan_iban"),
  alfalahAccountNumber: text("alfalah_account_number"),
  alfalahAccountName: text("alfalah_account_name"),
  alfalahIban: text("alfalah_iban"),
  mcbAccountNumber: text("mcb_account_number"),
  mcbAccountName: text("mcb_account_name"),
  mcbIban: text("mcb_iban"),
  alliedAccountNumber: text("allied_account_number"),
  alliedAccountName: text("allied_account_name"),
  alliedIban: text("allied_iban"),
  sadapayAccountNumber: text("sadapay_account_number"),
  sadapayAccountName: text("sadapay_account_name"),
  nayapayAccountNumber: text("nayapay_account_number"),
  nayapayAccountName: text("nayapay_account_name"),
  sumupApiKey: text("sumup_api_key"),
  sumupMerchantCode: text("sumup_merchant_code"),
  squareAccessToken: text("square_access_token"),
  squareLocationId: text("square_location_id"),
  zettleApiKey: text("zettle_api_key"),
  zettleMerchantId: text("zettle_merchant_id"),
  vatPercent: decimal("vat_percent", { precision: 5, scale: 2 }).default("0"),
  vatEnabled: boolean("vat_enabled").default(false),
  serviceFeePercent: decimal("service_fee_percent", { precision: 5, scale: 2 }).default("0"),
  serviceFeeEnabled: boolean("service_fee_enabled").default(false),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  deliveryFeeEnabled: boolean("delivery_fee_enabled").default(false),
  freeDeliveryMinimum: decimal("free_delivery_minimum", { precision: 10, scale: 2 }).default("0"),
  freeDeliveryEnabled: boolean("free_delivery_enabled").default(false),
  cutleryOptionEnabled: boolean("cutlery_option_enabled").default(false),
  cutleryName: text("cutlery_name").default("Cutlery Set"),
  cutleryPrice: decimal("cutlery_price", { precision: 10, scale: 2 }).default("0.50"),
  customDomain: text("custom_domain"),
  voiceAlertEnabled: boolean("voice_alert_enabled").default(true),
  voiceAlertMessage: text("voice_alert_message").default("New order received"),
  voiceAlertVoice: text("voice_alert_voice").default("default"),
  voiceAlertRate: decimal("voice_alert_rate", { precision: 3, scale: 2 }).default("1.0"),
  voiceAlertPitch: decimal("voice_alert_pitch", { precision: 3, scale: 2 }).default("1.0"),
  alarmSound: text("alarm_sound").default("alarm1"),
  tagline: text("tagline").default("Where every bite feels like home"),
  cuisineType: text("cuisine_type").default("Pakistani & Afghani Cuisine"),
  branchCity: text("branch_city"),
  categoryDisplayPosition: text("category_display_position").default("header"),
  // PWA App Icon Settings
  appIconUrl: text("app_icon_url"),
  appName: text("app_name"),
  appShortName: text("app_short_name"),
  appThemeColor: text("app_theme_color").default("#8B0000"),
  appBackgroundColor: text("app_background_color").default("#ffffff"),
  // Delivery Radius Settings
  deliveryRadiusType: text("delivery_radius_type").default("uk_only"), // "uk_only", "worldwide", "radius"
  deliveryRadiusMiles: decimal("delivery_radius_miles", { precision: 5, scale: 1 }).default("5"),
  restaurantLatitude: decimal("restaurant_latitude", { precision: 10, scale: 7 }),
  restaurantLongitude: decimal("restaurant_longitude", { precision: 10, scale: 7 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const CURRENCIES = [
  { code: "GBP", name: "British Pound", symbol: "£", country: "UK" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "Rs ", country: "Pakistan" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", country: "UAE/Dubai" },
  { code: "USD", name: "US Dollar", symbol: "$", country: "USA" },
  { code: "EUR", name: "Euro", symbol: "€", country: "Europe" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", country: "Canada" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", country: "Australia" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", country: "New Zealand" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", country: "India" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼", country: "Saudi Arabia" },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]["code"];

export const getCurrencySymbol = (code: string): string => {
  const currency = CURRENCIES.find(c => c.code === code);
  return currency?.symbol || "£";
};

export const insertRestaurantSchema = createInsertSchema(restaurants).omit({
  id: true,
  createdAt: true,
});

export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurants.$inferSelect;

export const menuItems = pgTable("menu_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  image: text("image").notNull(),
  videoUrl: text("video_url"),
  gifUrl: text("gif_url"),
  available: boolean("available").default(true),
  allergenProfile: jsonb("allergen_profile").$type<AllergenProfile>().default({}),
  weight: decimal("weight", { precision: 10, scale: 6 }),
  weightUnit: text("weight_unit").default("kg"),
  freshFrozen: text("fresh_frozen"),
  countryOfOrigin: text("country_of_origin"),
  variantLabel: text("variant_label"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMenuItemSchema = createInsertSchema(menuItems, {
  allergenProfile: allergenProfileSchema,
}).omit({
  id: true,
  createdAt: true,
});

export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;

export const menuCategories = pgTable("menu_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }),
  parentId: varchar("parent_id"),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  icon: text("icon").default("🍽️"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  gifUrl: text("gif_url"),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  isEnabled: boolean("is_enabled").default(true),
  showInTelephone: boolean("show_in_telephone").default(true),
  showInEpos: boolean("show_in_epos").default(true),
  showInWaiter: boolean("show_in_waiter").default(true),
  showInOnline: boolean("show_in_online").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMenuCategorySchema = createInsertSchema(menuCategories).omit({
  id: true,
  createdAt: true,
});

export type InsertMenuCategory = z.infer<typeof insertMenuCategorySchema>;
export type MenuCategory = typeof menuCategories.$inferSelect;

export const menuItemRecommendations = pgTable("menu_item_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  sourceItemId: varchar("source_item_id").references(() => menuItems.id, { onDelete: "cascade" }).notNull(),
  recommendedItemId: varchar("recommended_item_id").references(() => menuItems.id, { onDelete: "cascade" }).notNull(),
  label: text("label").default("Goes well with"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMenuItemRecommendationSchema = createInsertSchema(menuItemRecommendations).omit({
  id: true,
  createdAt: true,
});

export type InsertMenuItemRecommendation = z.infer<typeof insertMenuItemRecommendationSchema>;
export type MenuItemRecommendation = typeof menuItemRecommendations.$inferSelect;

export const orderStatusEnum = pgEnum("order_status", ["pending_approval", "new", "preparing", "ready", "completed"]);
export const orderTypeEnum = pgEnum("order_type", ["delivery", "takeaway", "dine-in", "collection"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "card", "account", "bank_transfer"]);
export const deliveryStatusEnum = pgEnum("delivery_status", ["unassigned", "assigned", "accepted", "picked_up", "delivering", "completed", "rejected", "returned"]);
export const paymentInstructionEnum = pgEnum("payment_instruction", ["customer_paid_online", "collect_cash", "branch_pays_driver"]);

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  orderNumber: integer("order_number"),
  customerId: varchar("customer_id"),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  type: orderTypeEnum("type").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").default("cash"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum("status").notNull().default("new"),
  stripePaymentId: text("stripe_payment_id"),
  isArchived: boolean("is_archived").default(false),
  estimatedDeliveryMinutes: integer("estimated_delivery_minutes"),
  driverAssignedAt: timestamp("driver_assigned_at"),
  statusMessage: text("status_message"),
  source: text("source").default("online"),
  trackingToken: varchar("tracking_token"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "cancelled"]);

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  customerId: varchar("customer_id"),
  customerName: text("customer_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  date: text("date").notNull(),
  time: text("time").notNull(),
  guests: integer("guests").notNull(),
  adults: integer("adults").default(0),
  children: integer("children").default(0),
  infants: integer("infants").default(0),
  specialHelp: text("special_help"),
  status: bookingStatusEnum("status").notNull().default("pending"),
  tableLabel: text("table_label"),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Visit history type for customer tracking
export type VisitHistory = {
  date: string;
  time: string;
  guests: number;
  status: string;
};

export type BookingWithHistory = Booking & {
  customer?: Customer | null;
  visitHistory: VisitHistory[];
  totalVisits: number;
};

export const galleryImages = pgTable("gallery_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  imageUrl: text("image_url").notNull(),
  title: text("title"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGalleryImageSchema = createInsertSchema(galleryImages).omit({
  id: true,
  createdAt: true,
});

export type InsertGalleryImage = z.infer<typeof insertGalleryImageSchema>;
export type GalleryImage = typeof galleryImages.$inferSelect;

// Menu Item Modifiers/Toppings
export const menuModifiers = pgTable("menu_modifiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  menuItemId: varchar("menu_item_id").references(() => menuItems.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  available: boolean("available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMenuModifierSchema = createInsertSchema(menuModifiers).omit({
  id: true,
  createdAt: true,
});

export type InsertMenuModifier = z.infer<typeof insertMenuModifierSchema>;
export type MenuModifier = typeof menuModifiers.$inferSelect;

// Extra Toppings - Branch-specific extra toppings linked to specific menu items
export const extraToppings = pgTable("extra_toppings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  menuItemId: varchar("menu_item_id").references(() => menuItems.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("1.00"),
  image: text("image"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertExtraToppingSchema = createInsertSchema(extraToppings).omit({
  id: true,
  createdAt: true,
});

export type InsertExtraTopping = z.infer<typeof insertExtraToppingSchema>;
export type ExtraTopping = typeof extraToppings.$inferSelect;

// Topping Groups - Groups of options with selection rules (e.g., "Choose Your Drink - Required")
export const toppingGroups = pgTable("topping_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  menuItemId: varchar("menu_item_id").references(() => menuItems.id, { onDelete: "cascade" }).notNull(),
  headline: text("headline").notNull(),
  isRequired: boolean("is_required").default(false),
  minSelections: integer("min_selections").default(0),
  maxSelections: integer("max_selections").default(1),
  allowQuantity: boolean("allow_quantity").default(false),
  maxQuantityPerOption: integer("max_quantity_per_option").default(5),
  sortOrder: integer("sort_order").default(0),
  // Half & Half pizza support: 'left', 'right', 'extra', or null for regular toppings
  halfType: varchar("half_type", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertToppingGroupSchema = createInsertSchema(toppingGroups).omit({
  id: true,
  createdAt: true,
});

export type InsertToppingGroup = z.infer<typeof insertToppingGroupSchema>;
export type ToppingGroup = typeof toppingGroups.$inferSelect;

// Topping Group Options - Individual options within a group
export const toppingGroupOptions = pgTable("topping_group_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").references(() => toppingGroups.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  image: text("image"),
  isDefault: boolean("is_default").default(false),
  isAvailable: boolean("is_available").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertToppingGroupOptionSchema = createInsertSchema(toppingGroupOptions).omit({
  id: true,
  createdAt: true,
});

export type InsertToppingGroupOption = z.infer<typeof insertToppingGroupOptionSchema>;
export type ToppingGroupOption = typeof toppingGroupOptions.$inferSelect;

// Extended type for group with options
export type ToppingGroupWithOptions = ToppingGroup & {
  options: ToppingGroupOption[];
};

// Menu Item Variants (size options like Regular, Large, X Large)
export const menuItemVariants = pgTable("menu_item_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  menuItemId: varchar("menu_item_id").references(() => menuItems.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  sortOrder: integer("sort_order").default(0),
  available: boolean("available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMenuItemVariantSchema = createInsertSchema(menuItemVariants).omit({
  id: true,
  createdAt: true,
});

export type InsertMenuItemVariant = z.infer<typeof insertMenuItemVariantSchema>;
export type MenuItemVariant = typeof menuItemVariants.$inferSelect;

// Extended MenuItem type with variants
export type MenuItemWithVariants = MenuItem & {
  variants?: MenuItemVariant[];
};

// Customers table for customer accounts
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: text("phone").notNull(),
  name: text("name"),
  email: text("email"),
  address: text("address"),
  workAddress: text("work_address"),
  city: text("city"),
  postcode: text("postcode"),
  authProvider: text("auth_provider").default("mobile"),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Driver Location Updates - Real-time GPS tracking for deliveries
export const driverLocationUpdates = pgTable("driver_location_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }),
  driverId: varchar("driver_id").references(() => drivers.id, { onDelete: "cascade" }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  speed: decimal("speed", { precision: 5, scale: 2 }),
  heading: decimal("heading", { precision: 5, scale: 2 }),
  accuracy: decimal("accuracy", { precision: 6, scale: 2 }),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

export const insertDriverLocationSchema = createInsertSchema(driverLocationUpdates).omit({
  id: true,
  recordedAt: true,
});

export type InsertDriverLocation = z.infer<typeof insertDriverLocationSchema>;
export type DriverLocation = typeof driverLocationUpdates.$inferSelect;

// Promotions table for branch-specific promotional banners
export const promotions = pgTable("promotions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  headline: text("headline").notNull(),
  subtext: text("subtext"),
  isActive: boolean("is_active").default(true),
  backgroundColor: text("background_color").default("#dc2626"),
  textColor: text("text_color").default("#ffffff"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPromotionSchema = createInsertSchema(promotions).omit({
  id: true,
  createdAt: true,
});

export type InsertPromotion = z.infer<typeof insertPromotionSchema>;
export type Promotion = typeof promotions.$inferSelect;

// Hero Images table for multi-image carousel on landing pages
export const restaurantHeroImages = pgTable("restaurant_hero_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  imageUrl: text("image_url").notNull(),
  mediaType: text("media_type").default("image"),
  label: text("label"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHeroImageSchema = createInsertSchema(restaurantHeroImages).omit({
  id: true,
  createdAt: true,
});

export type InsertHeroImage = z.infer<typeof insertHeroImageSchema>;
export type HeroImage = typeof restaurantHeroImages.$inferSelect;

// Popular Items - Category images shown on landing page
export const popularItems = pgTable("popular_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url"), // Optional link when user clicks on the category
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPopularItemSchema = createInsertSchema(popularItems).omit({
  id: true,
  createdAt: true,
});

export type InsertPopularItem = z.infer<typeof insertPopularItemSchema>;
export type PopularItem = typeof popularItems.$inferSelect;

// Dashboard Settings - Controls which sections are visible in branch dashboard
export const restaurantDashboardSettings = pgTable("restaurant_dashboard_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull().unique("restaurant_dashboard_settings_restaurant_id_key"),
  promotionsEnabled: boolean("promotions_enabled").default(true),
  brandingEnabled: boolean("branding_enabled").default(true),
  hoursEnabled: boolean("hours_enabled").default(true),
  heroGalleryEnabled: boolean("hero_gallery_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDashboardSettingsSchema = createInsertSchema(restaurantDashboardSettings).omit({
  id: true,
  createdAt: true,
});

export type InsertDashboardSettings = z.infer<typeof insertDashboardSettingsSchema>;
export type DashboardSettings = typeof restaurantDashboardSettings.$inferSelect;

// Driver payment type enum
export const driverPaymentTypeEnum = pgEnum("driver_payment_type", ["mileage", "salary", "salary_plus_commission"]);

// Driver salary period enum
export const driverSalaryPeriodEnum = pgEnum("driver_salary_period", ["weekly", "monthly"]);

// Driver license type enum
export const driverLicenseTypeEnum = pgEnum("driver_license_type", ["uk_full", "international"]);

// Drivers table for delivery drivers - each driver belongs to one restaurant/branch
export const drivers = pgTable("drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  password: text("password").notNull(),
  vehicleType: text("vehicle_type").default("car"),
  vehiclePlate: text("vehicle_plate"),
  isActive: boolean("is_active").default(true),
  isOnDuty: boolean("is_on_duty").default(false),
  lastLocationLat: decimal("last_location_lat", { precision: 10, scale: 7 }),
  lastLocationLng: decimal("last_location_lng", { precision: 10, scale: 7 }),
  lastSeen: timestamp("last_seen"),
  shiftStartTime: timestamp("shift_start_time"),
  shiftEndTime: timestamp("shift_end_time"),
  paymentType: driverPaymentTypeEnum("payment_type").default("mileage"),
  mileageRate1: decimal("mileage_rate_1", { precision: 10, scale: 2 }).default("0.50"),
  mileageRate2: decimal("mileage_rate_2", { precision: 10, scale: 2 }).default("1.50"),
  mileageRate3: decimal("mileage_rate_3", { precision: 10, scale: 2 }).default("2.00"),
  mileageRange1Max: decimal("mileage_range_1_max", { precision: 5, scale: 1 }).default("1"),
  mileageRange2Max: decimal("mileage_range_2_max", { precision: 5, scale: 1 }).default("3"),
  mileageRange3Max: decimal("mileage_range_3_max", { precision: 5, scale: 1 }).default("5"),
  salaryAmount: decimal("salary_amount", { precision: 10, scale: 2 }),
  salaryPeriod: driverSalaryPeriodEnum("salary_period").default("weekly"),
  agreedDeliveryCharge: decimal("agreed_delivery_charge", { precision: 10, scale: 2 }),
  licenseType: driverLicenseTypeEnum("license_type"),
  licenseCopyUrl: text("license_copy_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
  createdAt: true,
  lastSeen: true,
  shiftStartTime: true,
  shiftEndTime: true,
});

export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof drivers.$inferSelect;

// Branch Driver Assignments - assigns drivers to specific branches/restaurants
export const branchDriverAssignments = pgTable("branch_driver_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  driverId: varchar("driver_id").references(() => drivers.id, { onDelete: "cascade" }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBranchDriverAssignmentSchema = createInsertSchema(branchDriverAssignments).omit({
  id: true,
  createdAt: true,
});

export type InsertBranchDriverAssignment = z.infer<typeof insertBranchDriverAssignmentSchema>;
export type BranchDriverAssignment = typeof branchDriverAssignments.$inferSelect;

// Order Deliveries - tracks driver assignment and delivery status for orders
export const orderDeliveries = pgTable("order_deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  driverId: varchar("driver_id").references(() => drivers.id, { onDelete: "set null" }),
  deliveryStatus: deliveryStatusEnum("delivery_status").notNull().default("unassigned"),
  offerAmount: decimal("offer_amount", { precision: 10, scale: 2 }),
  paymentInstruction: paymentInstructionEnum("payment_instruction"),
  assignedAt: timestamp("assigned_at"),
  acceptedAt: timestamp("accepted_at"),
  pickedUpAt: timestamp("picked_up_at"),
  deliveredAt: timestamp("delivered_at"),
  driverNotes: text("driver_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrderDeliverySchema = createInsertSchema(orderDeliveries).omit({
  id: true,
  createdAt: true,
});

export type InsertOrderDelivery = z.infer<typeof insertOrderDeliverySchema>;
export type OrderDelivery = typeof orderDeliveries.$inferSelect;

// Driver Payments - tracks payments made from branches to drivers
export const driverPayments = pgTable("driver_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").references(() => drivers.id, { onDelete: "cascade" }).notNull(),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentPeriod: text("payment_period"), // e.g., "2024-W01" for weekly, "2024-01" for monthly
  paymentType: text("payment_type").notNull(), // "salary", "mileage", "commission"
  notes: text("notes"),
  paidAt: timestamp("paid_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDriverPaymentSchema = createInsertSchema(driverPayments).omit({
  id: true,
  createdAt: true,
});

export type InsertDriverPayment = z.infer<typeof insertDriverPaymentSchema>;
export type DriverPayment = typeof driverPayments.$inferSelect;

// Push Subscriptions - stores web push notification subscriptions for drivers
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").references(() => drivers.id, { onDelete: "cascade" }).notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

// Customer Push Subscriptions - stores web push notification subscriptions for customers tracking orders
export const customerPushSubscriptions = pgTable("customer_push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomerPushSubscriptionSchema = createInsertSchema(customerPushSubscriptions).omit({
  id: true,
  createdAt: true,
});

export type InsertCustomerPushSubscription = z.infer<typeof insertCustomerPushSubscriptionSchema>;
export type CustomerPushSubscription = typeof customerPushSubscriptions.$inferSelect;

// Kitchen Stations - for multi-station kitchen display (Pizza, Grill, Tandoori, Drinks, etc.)
export const kitchenStations = pgTable("kitchen_stations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  color: text("color").default("#3b82f6"),
  categories: text("categories").array().default([]),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertKitchenStationSchema = createInsertSchema(kitchenStations).omit({
  id: true,
  createdAt: true,
});

export type InsertKitchenStation = z.infer<typeof insertKitchenStationSchema>;
export type KitchenStation = typeof kitchenStations.$inferSelect;

// Order Item Completion - tracks which items are ready in each order
export const orderItemStatusEnum = pgEnum("order_item_status", ["pending", "preparing", "ready"]);

export const orderItemCompletions = pgTable("order_item_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderItemId: varchar("order_item_id").references(() => orderItems.id, { onDelete: "cascade" }).notNull(),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  stationId: varchar("station_id").references(() => kitchenStations.id, { onDelete: "set null" }),
  status: orderItemStatusEnum("status").default("pending"),
  completedQuantity: integer("completed_quantity").default(0),
  completedBy: text("completed_by"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrderItemCompletionSchema = createInsertSchema(orderItemCompletions).omit({
  id: true,
  createdAt: true,
});

export type InsertOrderItemCompletion = z.infer<typeof insertOrderItemCompletionSchema>;
export type OrderItemCompletion = typeof orderItemCompletions.$inferSelect;

// EPOS Orders - Point of Sale transactions for in-store sales
export const eposDiscountTypeEnum = pgEnum("epos_discount_type", ["fixed", "percent"]);

export const eposOrders = pgTable("epos_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  receiptNumber: integer("receipt_number"),
  items: jsonb("items").$type<Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
  }>>().notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountType: eposDiscountTypeEnum("discount_type"),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").default("cash"),
  cashierName: text("cashier_name"),
  customerName: text("customer_name"),
  notes: text("notes"),
  amountTendered: decimal("amount_tendered", { precision: 10, scale: 2 }),
  changeGiven: decimal("change_given", { precision: 10, scale: 2 }),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).default("0"),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).default("0"),
  serviceFee: decimal("service_fee", { precision: 10, scale: 2 }).default("0"),
  extraCharges: decimal("extra_charges", { precision: 10, scale: 2 }).default("0"),
  extraChargesLabel: text("extra_charges_label"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEposOrderSchema = createInsertSchema(eposOrders).omit({
  id: true,
  createdAt: true,
});

export type InsertEposOrder = z.infer<typeof insertEposOrderSchema>;
export type EposOrder = typeof eposOrders.$inferSelect;

// Waiter status enum
export const waiterStatusEnum = pgEnum("waiter_status", ["active", "on_break", "offline"]);

// Waiters - staff members who take orders on tablets
export const waiters = pgTable("waiters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  area: text("area"), // Hall, Room, Section
  roomNumber: text("room_number"),
  pin: text("pin"), // 4-digit PIN for quick login
  status: waiterStatusEnum("status").default("offline"),
  currentTabletId: varchar("current_tablet_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWaiterSchema = createInsertSchema(waiters).omit({
  id: true,
  createdAt: true,
});

export type InsertWaiter = z.infer<typeof insertWaiterSchema>;
export type Waiter = typeof waiters.$inferSelect;

// Waiter Tablets - 1-10 tablets per restaurant
export const waiterTablets = pgTable("waiter_tablets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  tabletNumber: integer("tablet_number").notNull(), // 1-10
  assignedWaiterId: varchar("assigned_waiter_id").references(() => waiters.id, { onDelete: "set null" }),
  assignedWaiterName: text("assigned_waiter_name"), // Simple name entry without full waiter record
  isActive: boolean("is_active").default(false), // false = available, true = in use
  sessionStartedAt: timestamp("session_started_at"), // When waiter claimed this tablet
  orderCount: integer("order_count").default(0), // Number of orders during this session
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWaiterTabletSchema = createInsertSchema(waiterTablets).omit({
  id: true,
  createdAt: true,
});

export type InsertWaiterTablet = z.infer<typeof insertWaiterTabletSchema>;
export type WaiterTablet = typeof waiterTablets.$inferSelect;

// Table Session status enum
export const tableSessionStatusEnum = pgEnum("table_session_status", [
  "ordering",      // Customer/waiter is adding items
  "awaiting_manager", // Sent to manager for approval
  "approved",      // Manager approved, sent to kitchen
  "in_kitchen",    // Being prepared
  "ready",         // Ready for pickup
  "served",        // Delivered to table
  "closed"         // Session ended
]);

// Table Sessions - active table orders
export const tableSessions = pgTable("table_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  waiterId: varchar("waiter_id").references(() => waiters.id, { onDelete: "set null" }),
  tabletId: varchar("tablet_id").references(() => waiterTablets.id, { onDelete: "set null" }),
  tableNumber: text("table_number").notNull(),
  guestCounts: jsonb("guest_counts").$type<{
    adults: number;
    kids: number;
    children: number;
  }>().default({ adults: 1, kids: 0, children: 0 }),
  status: tableSessionStatusEnum("status").default("ordering"),
  notes: text("notes"),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "set null" }), // Link to real order after approval
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTableSessionSchema = createInsertSchema(tableSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTableSession = z.infer<typeof insertTableSessionSchema>;
export type TableSession = typeof tableSessions.$inferSelect;

// Table Session Items - draft order items before approval
export const tableSessionItems = pgTable("table_session_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => tableSessions.id, { onDelete: "cascade" }).notNull(),
  menuItemId: varchar("menu_item_id").references(() => menuItems.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").default(1),
  toppings: jsonb("toppings").$type<Array<{
    id: string;
    name: string;
    price: number;
  }>>().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTableSessionItemSchema = createInsertSchema(tableSessionItems).omit({
  id: true,
  createdAt: true,
});

export type InsertTableSessionItem = z.infer<typeof insertTableSessionItemSchema>;
export type TableSessionItem = typeof tableSessionItems.$inferSelect;

// ============================================
// SUPPLIER ORDERING SYSTEM
// ============================================

// Unit types for supplier products
export const supplierUnitTypeEnum = pgEnum("supplier_unit_type", ["kg", "packet", "piece", "box", "bottle", "bag", "case", "other"]);

// Supplier order status
export const supplierOrderStatusEnum = pgEnum("supplier_order_status", ["draft", "sent", "received", "cancelled"]);

// Suppliers table - stores supplier information per restaurant
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  contactName: text("contact_name"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
});

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

// Supplier products - items that each supplier provides
export const supplierProducts = pgTable("supplier_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").references(() => suppliers.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  unitType: supplierUnitTypeEnum("unit_type").default("piece"),
  unitLabel: text("unit_label"), // Custom label like "5kg bag", "pack of 12"
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 2 }).default("0.00"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSupplierProductSchema = createInsertSchema(supplierProducts).omit({
  id: true,
  createdAt: true,
});

export type InsertSupplierProduct = z.infer<typeof insertSupplierProductSchema>;
export type SupplierProduct = typeof supplierProducts.$inferSelect;

// Supplier orders - orders placed to suppliers
export const supplierOrders = pgTable("supplier_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  supplierId: varchar("supplier_id").references(() => suppliers.id, { onDelete: "cascade" }).notNull(),
  orderDate: timestamp("order_date").defaultNow(),
  sentAt: timestamp("sent_at"),
  status: supplierOrderStatusEnum("status").default("draft"),
  total: decimal("total", { precision: 10, scale: 2 }).default("0.00"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSupplierOrderSchema = createInsertSchema(supplierOrders).omit({
  id: true,
  createdAt: true,
});

export type InsertSupplierOrder = z.infer<typeof insertSupplierOrderSchema>;
export type SupplierOrder = typeof supplierOrders.$inferSelect;

// Supplier order items - individual items in a supplier order
export const supplierOrderItems = pgTable("supplier_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => supplierOrders.id, { onDelete: "cascade" }).notNull(),
  productId: varchar("product_id").references(() => supplierProducts.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitType: text("unit_type"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSupplierOrderItemSchema = createInsertSchema(supplierOrderItems).omit({
  id: true,
  createdAt: true,
});

export type InsertSupplierOrderItem = z.infer<typeof insertSupplierOrderItemSchema>;
export type SupplierOrderItem = typeof supplierOrderItems.$inferSelect;

// Extended types for supplier with products
export type SupplierWithProducts = Supplier & {
  products: SupplierProduct[];
};

// Extended types for supplier orders with items
export type SupplierOrderWithItems = SupplierOrder & {
  items: SupplierOrderItem[];
  supplier?: Supplier;
};

// ============================================
// FINANCIAL MANAGEMENT SYSTEM
// ============================================

// Transaction type enum (income or expense)
export const transactionTypeEnum = pgEnum("transaction_type", ["income", "expense"]);

// Income source categories
export const incomeSourceEnum = pgEnum("income_source", [
  "customer_order", "epos_sale", "waiter_order", "cash_deposit", "other_income"
]);

// Expense category enum
export const expenseCategoryEnum = pgEnum("expense_category", [
  "supplier_invoice", "staff_wages", "rent", "electric", "gas", "water",
  "business_rates", "rubbish", "vehicle_insurance", "business_insurance",
  "mot", "wastage", "extra_expense", "vat", "tax", "other"
]);

// Recurring frequency enum
export const recurringFrequencyEnum = pgEnum("recurring_frequency", [
  "weekly", "monthly", "quarterly", "yearly"
]);

// Financial transactions - all money in/out
export const financialTransactions = pgTable("financial_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  incomeSource: incomeSourceEnum("income_source"),
  expenseCategory: expenseCategoryEnum("expense_category"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  referenceId: varchar("reference_id"),
  referenceType: text("reference_type"),
  transactionDate: timestamp("transaction_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFinancialTransactionSchema = createInsertSchema(financialTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;
export type FinancialTransaction = typeof financialTransactions.$inferSelect;

// Recurring expenses - bills that repeat automatically
export const recurringExpenses = pgTable("recurring_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  category: expenseCategoryEnum("category").notNull(),
  name: text("name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  frequency: recurringFrequencyEnum("frequency").notNull(),
  dayOfMonth: integer("day_of_month").default(1),
  dayOfWeek: integer("day_of_week"),
  isActive: boolean("is_active").default(true),
  lastProcessedDate: timestamp("last_processed_date"),
  nextDueDate: timestamp("next_due_date"),
  includeVat: boolean("include_vat").default(false),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).default("20.00"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRecurringExpenseSchema = createInsertSchema(recurringExpenses).omit({
  id: true,
  createdAt: true,
});

export type InsertRecurringExpense = z.infer<typeof insertRecurringExpenseSchema>;
export type RecurringExpense = typeof recurringExpenses.$inferSelect;

// Staff members for wage tracking
export const staffPayTypeEnum = pgEnum("staff_pay_type", ["hourly", "weekly", "monthly"]);
export const paymentMethodTypeEnum = pgEnum("payment_method_type", ["cash", "bank_transfer", "cheque"]);

export const staffMembers = pgTable("staff_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  role: text("role"),
  phone: text("phone"),
  email: text("email"),
  payType: staffPayTypeEnum("pay_type").default("hourly"),
  payRate: decimal("pay_rate", { precision: 10, scale: 2 }).notNull(),
  hoursPerWeek: decimal("hours_per_week", { precision: 5, scale: 1 }),
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date"),
  // Payroll fields for wage slips
  niNumber: text("ni_number"),
  taxCode: text("tax_code").default("1257L"),
  niTableLetter: text("ni_table_letter").default("A"),
  address: text("address"),
  postcode: text("postcode"),
  paymentMethod: paymentMethodTypeEnum("payment_method").default("cash"),
  employeeNumber: text("employee_number"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStaffMemberSchema = createInsertSchema(staffMembers).omit({
  id: true,
  createdAt: true,
});

export type InsertStaffMember = z.infer<typeof insertStaffMemberSchema>;
export type StaffMember = typeof staffMembers.$inferSelect;

// Staff wage payments - individual pay slips
export const staffWagePayments = pgTable("staff_wage_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  staffId: varchar("staff_id").references(() => staffMembers.id, { onDelete: "cascade" }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  hoursWorked: decimal("hours_worked", { precision: 6, scale: 2 }),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  grossAmount: decimal("gross_amount", { precision: 10, scale: 2 }).notNull(),
  taxDeduction: decimal("tax_deduction", { precision: 10, scale: 2 }).default("0.00"),
  niDeduction: decimal("ni_deduction", { precision: 10, scale: 2 }).default("0.00"),
  employerNiContribution: decimal("employer_ni_contribution", { precision: 10, scale: 2 }).default("0.00"),
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(),
  isPaid: boolean("is_paid").default(false),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStaffWagePaymentSchema = createInsertSchema(staffWagePayments).omit({
  id: true,
  createdAt: true,
});

export type InsertStaffWagePayment = z.infer<typeof insertStaffWagePaymentSchema>;
export type StaffWagePayment = typeof staffWagePayments.$inferSelect;

// Cash deposits - manual money deposits
export const cashDeposits = pgTable("cash_deposits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  depositDate: timestamp("deposit_date").defaultNow(),
  notes: text("notes"),
  depositedBy: text("deposited_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCashDepositSchema = createInsertSchema(cashDeposits).omit({
  id: true,
  createdAt: true,
});

export type InsertCashDeposit = z.infer<typeof insertCashDepositSchema>;
export type CashDeposit = typeof cashDeposits.$inferSelect;

// Financial summary type for dashboard
export type FinancialSummary = {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitPercentage: number;
  incomeBySource: Record<string, number>;
  expensesByCategory: Record<string, number>;
};

// Platform Settings - Global super admin settings
export const platformSettings = pgTable("platform_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformCommission: decimal("platform_commission", { precision: 5, scale: 2 }).default("2.5"),
  smsNotificationsEnabled: boolean("sms_notifications_enabled").default(true),
  emailDigestsEnabled: boolean("email_digests_enabled").default(true),
  defaultOpenTime: text("default_open_time").default("11:00"),
  defaultCloseTime: text("default_close_time").default("23:00"),
  mondayEnabled: boolean("monday_enabled").default(true),
  tuesdayEnabled: boolean("tuesday_enabled").default(true),
  wednesdayEnabled: boolean("wednesday_enabled").default(true),
  thursdayEnabled: boolean("thursday_enabled").default(true),
  fridayEnabled: boolean("friday_enabled").default(true),
  saturdayEnabled: boolean("saturday_enabled").default(true),
  sundayEnabled: boolean("sunday_enabled").default(false),
  mondayOpen: text("monday_open").default("11:00"),
  mondayClose: text("monday_close").default("23:00"),
  tuesdayOpen: text("tuesday_open").default("11:00"),
  tuesdayClose: text("tuesday_close").default("23:00"),
  wednesdayOpen: text("wednesday_open").default("11:00"),
  wednesdayClose: text("wednesday_close").default("23:00"),
  thursdayOpen: text("thursday_open").default("11:00"),
  thursdayClose: text("thursday_close").default("23:00"),
  fridayOpen: text("friday_open").default("11:00"),
  fridayClose: text("friday_close").default("23:00"),
  saturdayOpen: text("saturday_open").default("11:00"),
  saturdayClose: text("saturday_close").default("23:00"),
  sundayOpen: text("sunday_open").default("11:00"),
  sundayClose: text("sunday_close").default("23:00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPlatformSettingsSchema = createInsertSchema(platformSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPlatformSettings = z.infer<typeof insertPlatformSettingsSchema>;
export type PlatformSettings = typeof platformSettings.$inferSelect;

// Branch Snapshots - For data backup and recovery
export const branchSnapshots = pgTable("branch_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  label: text("label"),
  snapshotType: text("snapshot_type").default("manual"),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBranchSnapshotSchema = createInsertSchema(branchSnapshots).omit({
  id: true,
  createdAt: true,
});

export type InsertBranchSnapshot = z.infer<typeof insertBranchSnapshotSchema>;
export type BranchSnapshot = typeof branchSnapshots.$inferSelect;

// Twilio Settings - Per-branch Twilio configuration for caller ID
export const twilioSettings = pgTable("twilio_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull().unique("twilio_settings_restaurant_id_key"),
  accountSid: text("account_sid").notNull(),
  authToken: text("auth_token").notNull(),
  phoneNumber: text("phone_number").notNull(),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTwilioSettingsSchema = createInsertSchema(twilioSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTwilioSettings = z.infer<typeof insertTwilioSettingsSchema>;
export type TwilioSettings = typeof twilioSettings.$inferSelect;

// Call Recordings - Store Twilio call recordings for each branch
export const callRecordings = pgTable("call_recordings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  callSid: text("call_sid").notNull(),
  recordingSid: text("recording_sid"),
  recordingUrl: text("recording_url"),
  callerNumber: text("caller_number").notNull(),
  customerName: text("customer_name"),
  duration: integer("duration"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCallRecordingSchema = createInsertSchema(callRecordings).omit({
  id: true,
  createdAt: true,
});

export type InsertCallRecording = z.infer<typeof insertCallRecordingSchema>;
export type CallRecording = typeof callRecordings.$inferSelect;

// Branch Features - Controls which features are enabled/disabled per branch
export const branchFeatures = pgTable("branch_features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull().unique("branch_features_restaurant_id_key"),
  // Core Features
  onlineOrdering: boolean("online_ordering").default(true),
  tableBooking: boolean("table_booking").default(true),
  deliveryTracking: boolean("delivery_tracking").default(true),
  dineInOrdering: boolean("dine_in_ordering").default(true),
  // Staff Systems
  kitchenDisplay: boolean("kitchen_display").default(true),
  eposSystem: boolean("epos_system").default(true),
  waiterApp: boolean("waiter_app").default(false),
  driverApp: boolean("driver_app").default(true),
  // Advanced Features
  supplierOrdering: boolean("supplier_ordering").default(false),
  telephoneOrdering: boolean("telephone_ordering").default(false),
  loyaltyProgram: boolean("loyalty_program").default(false),
  promotions: boolean("promotions").default(true),
  allergenManagement: boolean("allergen_management").default(true),
  // Extras
  liveChat: boolean("live_chat").default(false),
  reviewsWidget: boolean("reviews_widget").default(false),
  multiLanguage: boolean("multi_language").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBranchFeaturesSchema = createInsertSchema(branchFeatures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBranchFeatures = z.infer<typeof insertBranchFeaturesSchema>;
export type BranchFeatures = typeof branchFeatures.$inferSelect;

// Property Branches - For KING'S PROPERTY GROUP multi-branch system
export const propertyBranches = pgTable("property_branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique("property_branches_slug_key"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  logoUrl: text("logo_url"),
  // Login credentials
  loginUsername: text("login_username"),
  loginPassword: text("login_password"),
  // Payment methods
  jazzCashEnabled: boolean("jazzcash_enabled").default(false),
  jazzCashNumber: text("jazzcash_number"),
  easyPaisaEnabled: boolean("easypaisa_enabled").default(false),
  easyPaisaNumber: text("easypaisa_number"),
  hblBankEnabled: boolean("hbl_bank_enabled").default(false),
  hblAccountNumber: text("hbl_account_number"),
  hblAccountTitle: text("hbl_account_title"),
  cashOnDeliveryEnabled: boolean("cash_on_delivery_enabled").default(true),
  // Commission settings
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("25.00"),
  visitCharges: decimal("visit_charges", { precision: 10, scale: 2 }).default("1000.00"),
  monthlyFee: decimal("monthly_fee", { precision: 10, scale: 2 }).default("2000.00"),
  // Stripe Payment
  stripeAccountId: text("stripe_account_id"),
  stripePublishableKey: text("stripe_publishable_key"),
  stripeSecretKey: text("stripe_secret_key"),
  // Alternative Card Readers
  sumupApiKey: text("sumup_api_key"),
  sumupMerchantCode: text("sumup_merchant_code"),
  squareAccessToken: text("square_access_token"),
  squareLocationId: text("square_location_id"),
  zettleApiKey: text("zettle_api_key"),
  zettleMerchantId: text("zettle_merchant_id"),
  // Currency & Status
  currency: text("currency").default("PKR"),
  isOpen: boolean("is_open").default(true),
  googleMapsUrl: text("google_maps_url"),
  // Web Address options
  useDefaultUrl: boolean("use_default_url").default(true),
  subdomain: text("subdomain"),
  customDomain: text("custom_domain"),
  // Theme colors
  primaryColor: text("primary_color").default("#0ea5e9"),
  secondaryColor: text("secondary_color").default("#06b6d4"),
  // WhatsApp
  whatsappNumber: text("whatsapp_number"),
  ownerName: text("owner_name"),
  // Video URL for marketing
  videoUrl: text("video_url"),
  // Social media links
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  twitterUrl: text("twitter_url"),
  youtubeUrl: text("youtube_url"),
  // Contact section background images
  contactBgImages: jsonb("contact_bg_images").$type<string[]>().default([]),
  // Our Advantages section
  advantages: jsonb("advantages").$type<{title: string; description: string; icon: string}[]>().default([
    { title: "Verified Properties", description: "All listings are thoroughly verified", icon: "shield" },
    { title: "Legal Assistance", description: "Complete documentation support", icon: "file" },
    { title: "24/7 Support", description: "Round the clock customer support", icon: "clock" },
    { title: "Wide Network", description: "Extensive network across Pakistan", icon: "globe" }
  ]),
  // Featured Properties
  featuredProperties: jsonb("featured_properties").$type<{
    id: string;
    title: string;
    location: string;
    price: string;
    type: string;
    beds: number;
    baths: number;
    area: string;
    image: string;
    videoUrl?: string;
    soldOut?: boolean;
  }[]>().default([]),
  // Hero section text
  heroTagline: text("hero_tagline").default("Premium Real Estate in Pakistan"),
  heroTitle1: text("hero_title1").default("Find Your"),
  heroTitle2: text("hero_title2").default("Dream Property"),
  heroTitle3: text("hero_title3").default("Faster"),
  heroDescription: text("hero_description").default("offers premium properties for sale and rent. Buy, sell, or rent with"),
  // Services section
  servicesTagline: text("services_tagline").default("Our Services"),
  servicesTitle: text("services_title").default("What We Offer"),
  servicesDescription: text("services_description").default("Comprehensive real estate solutions tailored to your needs"),
  serviceCards: jsonb("service_cards").$type<{
    title: string;
    description: string;
    icon: string;
    color: string;
  }[]>().default([
    { title: "Buy Property", description: "Find your dream home from our extensive collection of residential and commercial properties.", icon: "home", color: "cyan" },
    { title: "Rent Property", description: "Discover premium rental properties with flexible terms and transparent pricing.", icon: "key", color: "emerald" },
    { title: "Sell Property", description: "Get the best value for your property with our expert valuation and marketing.", icon: "trending", color: "purple" }
  ]),
  // Voice announcement when opening website
  announcementText: text("announcement_text").default("KING'S PROPERTY GROUP"),
  announcementEnabled: boolean("announcement_enabled").default(true),
  // Custom voice audio file URL (recorded or uploaded)
  welcomeVoiceUrl: text("welcome_voice_url"),
  welcomeVoiceEnabled: boolean("welcome_voice_enabled").default(false),
  // Custom intro sound URL for moon landing animation
  introSoundUrl: text("intro_sound_url"),
  // Map embed URL
  mapEmbedUrl: text("map_embed_url"),
  // Visit fee for appointments
  visitFee: integer("visit_fee").default(1000),
  // Agreed price with Mujeeb AI
  agreedPrice: decimal("agreed_price", { precision: 10, scale: 2 }).default("0.00"),
  // Theme customization (super admin only)
  themeConfig: jsonb("theme_config").$type<{
    headerBg?: string;
    middleBg?: string;
    bottomBg?: string;
    cardStyles?: {
      [key: string]: {
        bgColor?: string;
        borderColor?: string;
        borderSize?: number;
        animatedBorder?: boolean;
      };
    };
    sectionStyles?: {
      [key: string]: {
        bgColor?: string;
        textColor?: string;
      };
    };
  }>().default({}),
  // PWA App Icon Settings
  appIconUrl: text("app_icon_url"),
  appName: text("app_name"),
  appShortName: text("app_short_name"),
  appThemeColor: text("app_theme_color").default("#0ea5e9"),
  appBackgroundColor: text("app_background_color").default("#ffffff"),
  // Status
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPropertyBranchSchema = createInsertSchema(propertyBranches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPropertyBranch = z.infer<typeof insertPropertyBranchSchema>;
export type PropertyBranch = typeof propertyBranches.$inferSelect;

// Property Video Links - Video links managed per branch
export const propertyVideoLinks = pgTable("property_video_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  branchId: varchar("branch_id").references(() => propertyBranches.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  category: text("category").default("property_tours"), // property_tours, market_updates
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPropertyVideoLinkSchema = createInsertSchema(propertyVideoLinks).omit({
  id: true,
  createdAt: true,
});

export type InsertPropertyVideoLink = z.infer<typeof insertPropertyVideoLinkSchema>;
export type PropertyVideoLink = typeof propertyVideoLinks.$inferSelect;

// Properties - Individual property listings for each branch
export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  branchId: varchar("branch_id").references(() => propertyBranches.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  propertyType: text("property_type").default("residential"), // residential, commercial, plot
  listingType: text("listing_type").default("sale"), // sale, rent
  price: decimal("price", { precision: 15, scale: 2 }),
  priceUnit: text("price_unit").default("PKR"),
  // Location
  address: text("address"),
  city: text("city"),
  area: text("area"),
  // Property details
  bedrooms: integer("bedrooms").default(0),
  bathrooms: integer("bathrooms").default(0),
  areaSize: text("area_size"),
  areaUnit: text("area_unit").default("Marla"),
  // Images and media
  images: jsonb("images").default([]),
  videoUrl: text("video_url"),
  // Status
  status: text("status").default("pending"), // pending, approved, rejected, sold, rented
  isFeatured: boolean("is_featured").default(false),
  // Ownership
  ownershipType: text("ownership_type").default("freehold"), // freehold, leasehold
  // Contact
  sellerName: text("seller_name"),
  sellerPhone: text("seller_phone"),
  sellerEmail: text("seller_email"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

// Property Appointments - Customer bookings with payment tracking
export const propertyAppointments = pgTable("property_appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  branchId: varchar("branch_id").references(() => propertyBranches.id, { onDelete: "cascade" }).notNull(),
  propertyId: varchar("property_id").references(() => properties.id, { onDelete: "set null" }),
  // Customer info
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
  customerEmail: text("customer_email"),
  customerAddress: text("customer_address"),
  // Property/visit info
  propertyName: varchar("property_name", { length: 255 }).notNull(),
  visitDate: text("visit_date").notNull(),
  visitTime: varchar("visit_time", { length: 50 }).notNull(),
  visitCode: varchar("visit_code", { length: 50 }).notNull(),
  visitFee: integer("visit_fee").notNull(),
  appointmentType: text("appointment_type").default("property_visit"),
  notes: text("notes"),
  // Payment info
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }),
  paymentReference: text("payment_reference"),
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"),
  paymentProofUrl: text("payment_proof_url"),
  // Status
  status: varchar("status", { length: 50 }).default("pending"),
  confirmedAt: timestamp("confirmed_at"),
  confirmedBy: text("confirmed_by"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPropertyAppointmentSchema = createInsertSchema(propertyAppointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPropertyAppointment = z.infer<typeof insertPropertyAppointmentSchema>;
export type PropertyAppointment = typeof propertyAppointments.$inferSelect;

// ============ GROCERY E-COMMERCE SYSTEM ============

export const groceryBranches = pgTable("grocery_branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique("grocery_branches_slug_key"),
  country: text("country").default("UK"),
  currency: text("currency").default("£"),
  branchNumber: integer("branch_number"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  logo: text("logo"),
  deliveryCharge: decimal("delivery_charge", { precision: 10, scale: 2 }).default("0"),
  freeDeliveryThreshold: decimal("free_delivery_threshold", { precision: 10, scale: 2 }).default("30"),
  discountThreshold: decimal("discount_threshold", { precision: 10, scale: 2 }).default("30"),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("5"),
  status: text("status").default("active"),
  themeColor: text("theme_color").default("#22c55e"),
  loginUsername: text("login_username"),
  loginPassword: text("login_password"),
  welcomeTitle: text("welcome_title").default("What you need,\nWhen you need it."),
  welcomeSubtitle: text("welcome_subtitle").default("Delivered straight to your door"),
  welcomeCtaText: text("welcome_cta_text").default("Confirm Location"),
  welcomePostcodeEnabled: boolean("welcome_postcode_enabled").default(true),
  welcomeBackgroundType: text("welcome_background_type").default("gradient"),
  welcomeBackgroundImageUrl: text("welcome_background_image_url"),
  welcomeBackgroundVideoUrl: text("welcome_background_video_url"),
  welcomeSliderImages: jsonb("welcome_slider_images").default([]),
  heroAnimationStyle: text("hero_animation_style").default("slide"),
  heroSlideInterval: integer("hero_slide_interval").default(5000),
  fontFamily: text("font_family").default("Inter"),
  titleFontSize: text("title_font_size").default("3rem"),
  subtitleFontSize: text("subtitle_font_size").default("1.1rem"),
  primaryColor: text("primary_color").default("#00bcd4"),
  secondaryColor: text("secondary_color").default("#ffffff"),
  accentColor: text("accent_color").default("#ff9800"),
  categoryCardStyle: text("category_card_style").default("rounded"),
  menuCardStyle: text("menu_card_style").default("grid"),
  headerBgColor: text("header_bg_color"),
  footerText: text("footer_text"),
  stripePublishableKey: text("stripe_publishable_key"),
  stripeSecretKey: text("stripe_secret_key"),
  stripeAccountId: text("stripe_account_id"),
  sumupApiKey: text("sumup_api_key"),
  sumupMerchantCode: text("sumup_merchant_code"),
  squareAccessToken: text("square_access_token"),
  squareLocationId: text("square_location_id"),
  zettleApiKey: text("zettle_api_key"),
  zettleMerchantId: text("zettle_merchant_id"),
  easypaisaAccountNumber: text("easypaisa_account_number"),
  easypaisaAccountName: text("easypaisa_account_name"),
  jazzcashAccountNumber: text("jazzcash_account_number"),
  jazzcashAccountName: text("jazzcash_account_name"),
  hblAccountNumber: text("hbl_account_number"),
  hblAccountName: text("hbl_account_name"),
  hblIban: text("hbl_iban"),
  ublAccountNumber: text("ubl_account_number"),
  ublAccountName: text("ubl_account_name"),
  ublIban: text("ubl_iban"),
  meezanAccountNumber: text("meezan_account_number"),
  meezanAccountName: text("meezan_account_name"),
  meezanIban: text("meezan_iban"),
  alfalahAccountNumber: text("alfalah_account_number"),
  alfalahAccountName: text("alfalah_account_name"),
  alfalahIban: text("alfalah_iban"),
  mcbAccountNumber: text("mcb_account_number"),
  mcbAccountName: text("mcb_account_name"),
  mcbIban: text("mcb_iban"),
  alliedAccountNumber: text("allied_account_number"),
  alliedAccountName: text("allied_account_name"),
  alliedIban: text("allied_iban"),
  sadapayAccountNumber: text("sadapay_account_number"),
  sadapayAccountName: text("sadapay_account_name"),
  nayapayAccountNumber: text("nayapay_account_number"),
  nayapayAccountName: text("nayapay_account_name"),
  webAddressType: text("web_address_type").default("default"),
  customSubdomain: text("custom_subdomain"),
  customDomain: text("custom_domain"),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).default("0"),
  collectionDiscountPercent: decimal("collection_discount_percent", { precision: 5, scale: 2 }).default("10"),
  collectionDiscountThreshold: decimal("collection_discount_threshold", { precision: 10, scale: 2 }).default("15"),
  estimatedDeliveryTime: text("estimated_delivery_time").default("45 minutes"),
  cutleryPrice: decimal("cutlery_price", { precision: 10, scale: 2 }).default("0.50"),
  acceptingOrders: boolean("accepting_orders").default(true),
  serviceAreaType: text("service_area_type").default("town"),
  serviceAreaValue: text("service_area_value"),
  categoryBgType: text("category_bg_type").default("color"),
  categoryBgColor: text("category_bg_color").default("#f8fafc"),
  categoryBgImages: jsonb("category_bg_images").default([]),
  categoryBgVideo: text("category_bg_video"),
  categoryBgAnimation: text("category_bg_animation").default("slide-left"),
  categoryBgAnimationSpeed: integer("category_bg_animation_speed").default(5000),
  productCardLayout: text("product_card_layout").default("default"),
  storeLanguage: text("store_language").default("en"),
  whatsappNumber: text("whatsapp_number"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGroceryBranchSchema = createInsertSchema(groceryBranches).omit({ id: true, createdAt: true });
export type InsertGroceryBranch = z.infer<typeof insertGroceryBranchSchema>;
export type GroceryBranch = typeof groceryBranches.$inferSelect;

export const groceryMainCategories = pgTable("grocery_main_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  branchId: varchar("branch_id").references(() => groceryBranches.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  image: text("image"),
  gif: text("gif"),
  displayOrder: integer("display_order").default(0),
  color: text("color").default("#22c55e"),
});

export const insertGroceryMainCategorySchema = createInsertSchema(groceryMainCategories).omit({ id: true });
export type InsertGroceryMainCategory = z.infer<typeof insertGroceryMainCategorySchema>;
export type GroceryMainCategory = typeof groceryMainCategories.$inferSelect;

export const grocerySubCategories = pgTable("grocery_sub_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  branchId: varchar("branch_id").references(() => groceryBranches.id, { onDelete: "cascade" }).notNull(),
  mainCategoryId: varchar("main_category_id").references(() => groceryMainCategories.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  image: text("image"),
  gif: text("gif"),
  video: text("video"),
  displayOrder: integer("display_order").default(0),
});

export const insertGrocerySubCategorySchema = createInsertSchema(grocerySubCategories).omit({ id: true });
export type InsertGrocerySubCategory = z.infer<typeof insertGrocerySubCategorySchema>;
export type GrocerySubCategory = typeof grocerySubCategories.$inferSelect;

export const grocerySubSubCategories = pgTable("grocery_sub_sub_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  branchId: varchar("branch_id").references(() => groceryBranches.id, { onDelete: "cascade" }).notNull(),
  subCategoryId: varchar("sub_category_id").references(() => grocerySubCategories.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  image: text("image"),
  gif: text("gif"),
  video: text("video"),
  displayOrder: integer("display_order").default(0),
});

export const insertGrocerySubSubCategorySchema = createInsertSchema(grocerySubSubCategories).omit({ id: true });
export type InsertGrocerySubSubCategory = z.infer<typeof insertGrocerySubSubCategorySchema>;
export type GrocerySubSubCategory = typeof grocerySubSubCategories.$inferSelect;

export const groceryProducts = pgTable("grocery_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  branchId: varchar("branch_id").references(() => groceryBranches.id, { onDelete: "cascade" }).notNull(),
  mainCategoryId: varchar("main_category_id").references(() => groceryMainCategories.id, { onDelete: "cascade" }).notNull(),
  subCategoryId: varchar("sub_category_id").references(() => grocerySubCategories.id, { onDelete: "cascade" }),
  subSubCategoryId: varchar("sub_sub_category_id").references(() => grocerySubSubCategories.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  details: text("details"),
  barcode: text("barcode"),
  image1: text("image1"),
  image2: text("image2"),
  video: text("video"),
  wasPrice: decimal("was_price", { precision: 10, scale: 2 }),
  nowPrice: decimal("now_price", { precision: 10, scale: 2 }).notNull(),
  expiryDate: text("expiry_date"),
  stockQuantity: integer("stock_quantity").default(0),
  unit: text("unit").default("each"),
  weight: text("weight"),
  calories: text("calories"),
  allergyAdvice: text("allergy_advice"),
  productMarketing: text("product_marketing"),
  features: text("features"),
  lifestyle: text("lifestyle"),
  ingredients: text("ingredients"),
  calculatedNutrition: text("calculated_nutrition"),
  nutritionalClaims: text("nutritional_claims"),
  storageUsage: text("storage_usage"),
  storageConditions: text("storage_conditions"),
  storageType: text("storage_type"),
  country: text("country"),
  companyName: text("company_name"),
  companyAddress: text("company_address"),
  manufacturer: text("manufacturer"),
  moreInformation: text("more_information"),
  nutrition: text("nutrition"),
  disclaimer: text("disclaimer"),
  isAvailable: boolean("is_available").default(true),
  isFeatured: boolean("is_featured").default(false),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGroceryProductSchema = createInsertSchema(groceryProducts).omit({ id: true, createdAt: true });
export type InsertGroceryProduct = z.infer<typeof insertGroceryProductSchema>;
export type GroceryProduct = typeof groceryProducts.$inferSelect;

export const groceryOrderStatusEnum = pgEnum("grocery_order_status", ["pending", "confirmed", "preparing", "ready", "delivering", "completed", "cancelled"]);

export const groceryOrders = pgTable("grocery_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  branchId: varchar("branch_id").references(() => groceryBranches.id, { onDelete: "cascade" }).notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  customerAddress: text("customer_address"),
  status: groceryOrderStatusEnum("status").notNull().default("pending"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryCharge: decimal("delivery_charge", { precision: 10, scale: 2 }).default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").default("card"),
  orderType: text("order_type").default("delivery"),
  customerPostcode: text("customer_postcode"),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).default("0"),
  cutleryRequested: boolean("cutlery_requested").default(false),
  cutleryCharge: decimal("cutlery_charge", { precision: 10, scale: 2 }).default("0"),
  stripePaymentId: text("stripe_payment_id"),
  stripePaymentStatus: text("stripe_payment_status"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGroceryOrderSchema = createInsertSchema(groceryOrders).omit({ id: true, createdAt: true });
export type InsertGroceryOrder = z.infer<typeof insertGroceryOrderSchema>;
export type GroceryOrder = typeof groceryOrders.$inferSelect;

export const groceryOrderItems = pgTable("grocery_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => groceryOrders.id, { onDelete: "cascade" }).notNull(),
  productId: varchar("product_id").references(() => groceryProducts.id).notNull(),
  productName: text("product_name").notNull(),
  productImage: text("product_image"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

export const insertGroceryOrderItemSchema = createInsertSchema(groceryOrderItems).omit({ id: true });
export type InsertGroceryOrderItem = z.infer<typeof insertGroceryOrderItemSchema>;
export type GroceryOrderItem = typeof groceryOrderItems.$inferSelect;

export const groceryDrivers = pgTable("grocery_drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  branchId: varchar("branch_id").references(() => groceryBranches.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  password: text("password").notNull(),
  vehicleType: text("vehicle_type").default("car"),
  vehiclePlate: text("vehicle_plate"),
  isActive: boolean("is_active").default(true),
  isOnDuty: boolean("is_on_duty").default(false),
  lastLocationLat: decimal("last_location_lat", { precision: 10, scale: 7 }),
  lastLocationLng: decimal("last_location_lng", { precision: 10, scale: 7 }),
  lastSeen: timestamp("last_seen"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGroceryDriverSchema = createInsertSchema(groceryDrivers).omit({
  id: true, createdAt: true, lastSeen: true,
});
export type InsertGroceryDriver = z.infer<typeof insertGroceryDriverSchema>;
export type GroceryDriver = typeof groceryDrivers.$inferSelect;

export const groceryDeliveryStatusEnum = pgEnum("grocery_delivery_status", ["unassigned", "assigned", "accepted", "picked_up", "delivering", "delivered", "cancelled"]);

export const groceryOrderDeliveries = pgTable("grocery_order_deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => groceryOrders.id, { onDelete: "cascade" }).notNull(),
  driverId: varchar("driver_id").references(() => groceryDrivers.id, { onDelete: "set null" }),
  deliveryStatus: groceryDeliveryStatusEnum("delivery_status").notNull().default("unassigned"),
  assignedAt: timestamp("assigned_at"),
  acceptedAt: timestamp("accepted_at"),
  pickedUpAt: timestamp("picked_up_at"),
  deliveredAt: timestamp("delivered_at"),
  driverNotes: text("driver_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGroceryOrderDeliverySchema = createInsertSchema(groceryOrderDeliveries).omit({
  id: true, createdAt: true,
});
export type InsertGroceryOrderDelivery = z.infer<typeof insertGroceryOrderDeliverySchema>;
export type GroceryOrderDelivery = typeof groceryOrderDeliveries.$inferSelect;

// ==================== SHOP DISPLAY MENUS ====================

export const displayMenus = pgTable("display_menus", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  branchId: varchar("branch_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  orientation: text("orientation").notNull().default("landscape"),
  slideDuration: integer("slide_duration").notNull().default(10),
  tvSize: text("tv_size").default("55"),
  isActive: boolean("is_active").default(true),
  publicToken: text("public_token").notNull().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDisplayMenuSchema = createInsertSchema(displayMenus).omit({ id: true, createdAt: true, publicToken: true });
export type InsertDisplayMenu = z.infer<typeof insertDisplayMenuSchema>;
export type DisplayMenu = typeof displayMenus.$inferSelect;

export const displaySlides = pgTable("display_slides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  menuId: varchar("menu_id").references(() => displayMenus.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull().default("Slide 1"),
  sortOrder: integer("sort_order").notNull().default(0),
  bgType: text("bg_type").notNull().default("color"),
  bgColor: text("bg_color").default("#1a1a2e"),
  bgGradient: text("bg_gradient"),
  bgImageUrl: text("bg_image_url"),
  bgVideoUrl: text("bg_video_url"),
  bgMusicUrl: text("bg_music_url"),
  templateId: text("template_id").default("classic-dark"),
  layoutColumns: integer("layout_columns").notNull().default(3),
  showNumbers: boolean("show_numbers").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDisplaySlideSchema = createInsertSchema(displaySlides).omit({ id: true, createdAt: true });
export type InsertDisplaySlide = z.infer<typeof insertDisplaySlideSchema>;
export type DisplaySlide = typeof displaySlides.$inferSelect;

export const displaySections = pgTable("display_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slideId: varchar("slide_id").references(() => displaySlides.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  titleFont: text("title_font").default("Arial"),
  titleSize: text("title_size").default("28px"),
  titleColor: text("title_color").default("#FF4444"),
  titleBold: boolean("title_bold").default(true),
  bgColor: text("bg_color"),
  borderColor: text("border_color"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDisplaySectionSchema = createInsertSchema(displaySections).omit({ id: true, createdAt: true });
export type InsertDisplaySection = z.infer<typeof insertDisplaySectionSchema>;
export type DisplaySection = typeof displaySections.$inferSelect;

export const displayItems = pgTable("display_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sectionId: varchar("section_id").references(() => displaySections.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  price: text("price").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  nameFont: text("name_font").default("Arial"),
  nameSize: text("name_size").default("16px"),
  nameColor: text("name_color").default("#FFFFFF"),
  priceColor: text("price_color").default("#FFD700"),
  priceSize: text("price_size").default("18px"),
  isFeatured: boolean("is_featured").default(false),
  priceVariants: jsonb("price_variants"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDisplayItemSchema = createInsertSchema(displayItems).omit({ id: true, createdAt: true });
export type InsertDisplayItem = z.infer<typeof insertDisplayItemSchema>;
export type DisplayItem = typeof displayItems.$inferSelect;

// ==================== TV DISPLAY ASSIGNMENTS (TV 1-9 Template System) ====================

export const tvDisplayAssignments = pgTable("tv_display_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  branchId: varchar("branch_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  tvType: integer("tv_type").notNull(),
  name: text("name").notNull(),
  config: jsonb("config").notNull().default({}),
  accessToken: text("access_token").notNull().default(sql`gen_random_uuid()`),
  accessPassword: text("access_password"),
  isActive: boolean("is_active").default(true),
  branchEnabled: boolean("branch_enabled").default(true),
  orientation: text("orientation").notNull().default("landscape"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTvDisplayAssignmentSchema = createInsertSchema(tvDisplayAssignments).omit({ id: true, createdAt: true, updatedAt: true, accessToken: true });
export type InsertTvDisplayAssignment = z.infer<typeof insertTvDisplayAssignmentSchema>;
export type TvDisplayAssignment = typeof tvDisplayAssignments.$inferSelect;

export const groceryStaff = pgTable("grocery_staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  branchId: varchar("branch_id").references(() => groceryBranches.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  username: text("username").notNull().unique("grocery_staff_username_key"),
  password: text("password").notNull(),
  role: text("role").default("info-product").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGroceryStaffSchema = createInsertSchema(groceryStaff).omit({ id: true, createdAt: true });
export type InsertGroceryStaff = z.infer<typeof insertGroceryStaffSchema>;
export type GroceryStaff = typeof groceryStaff.$inferSelect;

export const groceryStoreVisits = pgTable("grocery_store_visits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  branchId: varchar("branch_id").references(() => groceryBranches.id, { onDelete: "cascade" }).notNull(),
  visitedAt: timestamp("visited_at").defaultNow().notNull(),
});

export const tvDisplayCustomers = pgTable("tv_display_customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  username: text("username").notNull().unique("tv_display_customers_username_key"),
  password: text("password").notNull(),
  assignedTvs: jsonb("assigned_tvs").notNull().default([]),
  tvConfigs: jsonb("tv_configs").notNull().default({}),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTvDisplayCustomerSchema = createInsertSchema(tvDisplayCustomers).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTvDisplayCustomer = z.infer<typeof insertTvDisplayCustomerSchema>;
export type TvDisplayCustomer = typeof tvDisplayCustomers.$inferSelect;

// Marketing Staff System
export const marketingStaff = pgTable("marketing_staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  username: text("username").notNull().unique("marketing_staff_username_key"),
  password: text("password").notNull(),
  email: text("email"),
  whatsapp: text("whatsapp"),
  pin: text("pin"),
  photo: text("photo"),
  referencePhone: text("reference_phone"),
  emergencyContact: text("emergency_contact"),
  paymentType: text("payment_type").notNull().default("fixed_salary"),
  salaryAmount: decimal("salary_amount", { precision: 10, scale: 2 }).default("0"),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).default("0"),
  currency: text("currency").default("Rs"),
  jobHours: integer("job_hours").default(8),
  dailyVisitTarget: integer("daily_visit_target").default(10),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMarketingStaffSchema = createInsertSchema(marketingStaff).omit({ id: true, createdAt: true });
export type InsertMarketingStaff = z.infer<typeof insertMarketingStaffSchema>;
export type MarketingStaff = typeof marketingStaff.$inferSelect;

export const marketingLeads = pgTable("marketing_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").references(() => marketingStaff.id, { onDelete: "cascade" }).notNull(),
  customerName: text("customer_name").notNull(),
  customerWhatsapp: text("customer_whatsapp"),
  customerEmail: text("customer_email"),
  businessName: text("business_name").notNull(),
  businessPhone: text("business_phone"),
  shopName: text("shop_name"),
  websiteUrl: text("website_url"),
  menuImage: text("menu_image"),
  menuLink: text("menu_link"),
  paymentMethod: text("payment_method"),
  frontShopImage: text("front_shop_image"),
  notes: text("notes"),
  openingTime: text("opening_time"),
  closingTime: text("closing_time"),
  businessType: text("business_type"),
  agreedMonthlyPrice: decimal("agreed_monthly_price", { precision: 10, scale: 2 }),
  agreedYearlyPrice: decimal("agreed_yearly_price", { precision: 10, scale: 2 }),
  paymentMode: text("payment_mode"),
  status: text("status").default("pending"),
  adminFeedback: text("admin_feedback"),
  branchId: varchar("branch_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMarketingLeadSchema = createInsertSchema(marketingLeads).omit({ id: true, createdAt: true });
export type InsertMarketingLead = z.infer<typeof insertMarketingLeadSchema>;
export type MarketingLead = typeof marketingLeads.$inferSelect;

export const marketingPayments = pgTable("marketing_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").references(() => marketingStaff.id, { onDelete: "cascade" }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(),
  leadId: varchar("lead_id").references(() => marketingLeads.id, { onDelete: "set null" }),
  status: text("status").default("pending"),
  paidMethod: text("paid_method"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMarketingPaymentSchema = createInsertSchema(marketingPayments).omit({ id: true, createdAt: true });
export type InsertMarketingPayment = z.infer<typeof insertMarketingPaymentSchema>;
export type MarketingPayment = typeof marketingPayments.$inferSelect;

// ==================== TAXI SYSTEM ====================

export const taxiBrands = pgTable("taxi_brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique("taxi_brands_slug_key"),
  logo: text("logo"),
  ownerName: text("owner_name"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  whatsapp: text("whatsapp"),
  country: text("country").default("united_kingdom"),
  currency: text("currency").default("GBP"),
  primaryColor: text("primary_color").default("#1a1a2e"),
  secondaryColor: text("secondary_color").default("#e94560"),
  description: text("description"),
  paymentMethod: text("payment_method").default("stripe"),
  stripeSecretKey: text("stripe_secret_key"),
  stripePublishableKey: text("stripe_publishable_key"),
  googleLink: text("google_link"),
  domainType: text("domain_type").default("link24"),
  customDomain: text("custom_domain"),
  username: text("username"),
  status: text("status").default("active"),
  suspendReason: text("suspend_reason"),
  monthlyFee: decimal("monthly_fee", { precision: 10, scale: 2 }).default("0"),
  agreedPrice: decimal("agreed_price", { precision: 10, scale: 2 }).default("0"),
  lastPaymentDate: timestamp("last_payment_date"),
  platformCommissionPercent: decimal("platform_commission_percent", { precision: 5, scale: 2 }).default("10"),
  adminPassword: text("admin_password"),
  bankTransferEnabled: boolean("bank_transfer_enabled").default(false),
  bankName: text("bank_name"),
  bankAccountName: text("bank_account_name"),
  bankSortCode: text("bank_sort_code"),
  bankAccountNumber: text("bank_account_number"),
  bankIban: text("bank_iban"),
  jazzCashEnabled: boolean("jazzcash_enabled").default(false),
  jazzCashNumber: text("jazzcash_number"),
  jazzCashAccountName: text("jazzcash_account_name"),
  easyPaisaEnabled: boolean("easypaisa_enabled").default(false),
  easyPaisaNumber: text("easypaisa_number"),
  easyPaisaAccountName: text("easypaisa_account_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaxiBrandSchema = createInsertSchema(taxiBrands).omit({ id: true, createdAt: true });
export type InsertTaxiBrand = z.infer<typeof insertTaxiBrandSchema>;
export type TaxiBrand = typeof taxiBrands.$inferSelect;

export const taxiDrivers = pgTable("taxi_drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => taxiBrands.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp"),
  email: text("email"),
  address: text("address"),
  country: text("country"),
  photo: text("photo"),
  emergencyPhone: text("emergency_phone"),
  companyName: text("company_name"),
  employmentType: text("employment_type").default("self_employed"),
  drivingLicenceNumber: text("driving_licence_number"),
  drivingLicenceImage: text("driving_licence_image"),
  visaType: text("visa_type"),
  visaImage: text("visa_image"),
  insuranceImage: text("insurance_image"),
  carImage: text("car_image"),
  carColor: text("car_color"),
  carModel: text("car_model"),
  numberPlate: text("number_plate"),
  vehicleType: text("vehicle_type").default("sedan_5"),
  vehicleCategory: text("vehicle_category").default("taxi"),
  seatCount: integer("seat_count").default(5),
  fuelType: text("fuel_type").default("petrol"),
  serviceRadiusMiles: decimal("service_radius_miles", { precision: 5, scale: 1 }).default("5"),
  password: text("password").notNull(),
  status: text("status").default("pending"),
  onDuty: boolean("on_duty").default(false),
  lastLocationLat: text("last_location_lat"),
  lastLocationLng: text("last_location_lng"),
  lastLocationUpdated: timestamp("last_location_updated"),
  weeklyHoursAllowed: integer("weekly_hours_allowed").default(48),
  timingPreference: text("timing_preference"),
  paymentAgreement: text("payment_agreement").default("commission"),
  commissionPercent: decimal("commission_percent", { precision: 5, scale: 2 }).default("10"),
  fixedSalary: decimal("fixed_salary", { precision: 10, scale: 2 }).default("0"),
  salaryPeriod: text("salary_period").default("weekly"),
  paymentMethod: text("payment_method").default("cash"),
  currency: text("currency").default("GBP"),
  receiveBankName: text("receive_bank_name"),
  receiveBankAccountName: text("receive_bank_account_name"),
  receiveBankSortCode: text("receive_bank_sort_code"),
  receiveBankAccountNumber: text("receive_bank_account_number"),
  receiveBankIban: text("receive_bank_iban"),
  receiveJazzCashNumber: text("receive_jazzcash_number"),
  receiveJazzCashName: text("receive_jazzcash_name"),
  receiveEasyPaisaNumber: text("receive_easypaisa_number"),
  receiveEasyPaisaName: text("receive_easypaisa_name"),
  receiveStripeAccountId: text("receive_stripe_account_id"),
  receiveHblAccountName: text("receive_hbl_account_name"),
  receiveHblAccountNumber: text("receive_hbl_account_number"),
  receiveHblIban: text("receive_hbl_iban"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaxiDriverSchema = createInsertSchema(taxiDrivers).omit({ id: true, createdAt: true, onDuty: true, lastLocationLat: true, lastLocationLng: true, lastLocationUpdated: true });
export type InsertTaxiDriver = z.infer<typeof insertTaxiDriverSchema>;
export type TaxiDriver = typeof taxiDrivers.$inferSelect;

export const taxiDriverPricing = pgTable("taxi_driver_pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").references(() => taxiDrivers.id, { onDelete: "cascade" }).notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  pricePerMile: decimal("price_per_mile", { precision: 10, scale: 2 }).default("2.00"),
  pricePerHour: decimal("price_per_hour", { precision: 10, scale: 2 }).default("15.00"),
  minimumFare: decimal("minimum_fare", { precision: 10, scale: 2 }).default("6.00"),
  waitingChargePerMin: decimal("waiting_charge_per_min", { precision: 10, scale: 2 }).default("0.30"),
  freeWaitingMins: integer("free_waiting_mins").default(5),
  freeStops: integer("free_stops").default(0),
  chargePerExtraStop: decimal("charge_per_extra_stop", { precision: 10, scale: 2 }).default("2.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaxiDriverPricingSchema = createInsertSchema(taxiDriverPricing).omit({ id: true, createdAt: true });
export type InsertTaxiDriverPricing = z.infer<typeof insertTaxiDriverPricingSchema>;
export type TaxiDriverPricing = typeof taxiDriverPricing.$inferSelect;

export const taxiCustomers = pgTable("taxi_customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp"),
  email: text("email"),
  address: text("address"),
  pin: text("pin"),
  stripeCustomerId: text("stripe_customer_id"),
  status: text("status").default("active"),
  lastOtp: text("last_otp"),
  otpExpiry: timestamp("otp_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaxiCustomerSchema = createInsertSchema(taxiCustomers).omit({ id: true, createdAt: true, lastOtp: true, otpExpiry: true });
export type InsertTaxiCustomer = z.infer<typeof insertTaxiCustomerSchema>;
export type TaxiCustomer = typeof taxiCustomers.$inferSelect;

export const taxiRides = pgTable("taxi_rides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => taxiCustomers.id).notNull(),
  driverId: varchar("driver_id").references(() => taxiDrivers.id).notNull(),
  brandId: varchar("brand_id").references(() => taxiBrands.id).notNull(),
  pickupAddress: text("pickup_address").notNull(),
  pickupLat: text("pickup_lat"),
  pickupLng: text("pickup_lng"),
  dropoffAddress: text("dropoff_address").notNull(),
  dropoffLat: text("dropoff_lat"),
  dropoffLng: text("dropoff_lng"),
  stops: jsonb("stops").default([]),
  distanceMiles: decimal("distance_miles", { precision: 10, scale: 2 }),
  estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }),
  priceBreakdown: jsonb("price_breakdown"),
  paymentMethod: text("payment_method").default("cash"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  paymentStatus: text("payment_status").default("pending"),
  otpCode: text("otp_code"),
  otpVerified: boolean("otp_verified").default(false),
  status: text("status").default("requested"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  waitingTimeMinutes: integer("waiting_time_minutes").default(0),
  rating: integer("rating"),
  ratingComment: text("rating_comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaxiRideSchema = createInsertSchema(taxiRides).omit({ id: true, createdAt: true, otpCode: true, otpVerified: true, startedAt: true, completedAt: true });
export type InsertTaxiRide = z.infer<typeof insertTaxiRideSchema>;
export type TaxiRide = typeof taxiRides.$inferSelect;

export const taxiDriverEarnings = pgTable("taxi_driver_earnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").references(() => taxiDrivers.id, { onDelete: "cascade" }).notNull(),
  rideId: varchar("ride_id").references(() => taxiRides.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).default("0"),
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(),
  taxYear: integer("tax_year"),
  taxMonth: integer("tax_month"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaxiDriverEarningSchema = createInsertSchema(taxiDriverEarnings).omit({ id: true, createdAt: true });
export type InsertTaxiDriverEarning = z.infer<typeof insertTaxiDriverEarningSchema>;
export type TaxiDriverEarning = typeof taxiDriverEarnings.$inferSelect;

export const taxiComplaints = pgTable("taxi_complaints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => taxiBrands.id),
  rideId: varchar("ride_id").references(() => taxiRides.id),
  filedBy: text("filed_by").notNull(),
  customerId: varchar("customer_id").references(() => taxiCustomers.id),
  driverId: varchar("driver_id").references(() => taxiDrivers.id),
  complaintType: text("complaint_type").default("other"),
  description: text("description").notNull(),
  resolution: text("resolution"),
  resolvedBy: text("resolved_by"),
  status: text("status").default("open"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaxiComplaintSchema = createInsertSchema(taxiComplaints).omit({ id: true, createdAt: true });
export type InsertTaxiComplaint = z.infer<typeof insertTaxiComplaintSchema>;
export type TaxiComplaint = typeof taxiComplaints.$inferSelect;

export const taxiDriverFuelLogs = pgTable("taxi_driver_fuel_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").references(() => taxiDrivers.id, { onDelete: "cascade" }).notNull(),
  fuelType: text("fuel_type").default("petrol"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  litres: decimal("litres", { precision: 10, scale: 2 }),
  notes: text("notes"),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaxiDriverFuelLogSchema = createInsertSchema(taxiDriverFuelLogs).omit({ id: true, createdAt: true });
export type InsertTaxiDriverFuelLog = z.infer<typeof insertTaxiDriverFuelLogSchema>;
export type TaxiDriverFuelLog = typeof taxiDriverFuelLogs.$inferSelect;

export const taxiDriverExpenses = pgTable("taxi_driver_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").references(() => taxiDrivers.id, { onDelete: "cascade" }).notNull(),
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaxiDriverExpenseSchema = createInsertSchema(taxiDriverExpenses).omit({ id: true, createdAt: true });
export type InsertTaxiDriverExpense = z.infer<typeof insertTaxiDriverExpenseSchema>;
export type TaxiDriverExpense = typeof taxiDriverExpenses.$inferSelect;

export const taxiDriverWorkLogs = pgTable("taxi_driver_work_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").references(() => taxiDrivers.id, { onDelete: "cascade" }).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  hoursWorked: decimal("hours_worked", { precision: 5, scale: 2 }),
  shiftType: text("shift_type").default("8"),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaxiDriverWorkLogSchema = createInsertSchema(taxiDriverWorkLogs).omit({ id: true, createdAt: true });
export type InsertTaxiDriverWorkLog = z.infer<typeof insertTaxiDriverWorkLogSchema>;
export type TaxiDriverWorkLog = typeof taxiDriverWorkLogs.$inferSelect;

// ==================== CLOTHING E-COMMERCE SYSTEM ====================

export const clothingBrands = pgTable("clothing_brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  description: text("description"),
  currency: text("currency").default("PKR"),
  phone: text("phone"),
  whatsappNumber: text("whatsapp_number"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  country: text("country").default("Pakistan"),
  primaryColor: text("primary_color").default("#000000"),
  secondaryColor: text("secondary_color").default("#ffffff"),
  bannerImages: jsonb("banner_images").default([]),
  adminUsername: text("admin_username"),
  adminPassword: text("admin_password"),
  stripePublishableKey: text("stripe_publishable_key"),
  stripeSecretKey: text("stripe_secret_key"),
  freeDeliveryThreshold: decimal("free_delivery_threshold", { precision: 10, scale: 2 }),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  promoDeals: jsonb("promo_deals").default([]),
  paymentMethods: jsonb("payment_methods").default({}),
  isActive: boolean("is_active").default(true),
  isOpen: boolean("is_open").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClothingBrandSchema = createInsertSchema(clothingBrands).omit({ id: true, createdAt: true });
export type InsertClothingBrand = z.infer<typeof insertClothingBrandSchema>;
export type ClothingBrand = typeof clothingBrands.$inferSelect;

export const clothingCategories = pgTable("clothing_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => clothingBrands.id, { onDelete: "cascade" }),
  parentId: varchar("parent_id"),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  image: text("image"),
  gender: text("gender"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClothingCategorySchema = createInsertSchema(clothingCategories).omit({ id: true, createdAt: true });
export type InsertClothingCategory = z.infer<typeof insertClothingCategorySchema>;
export type ClothingCategory = typeof clothingCategories.$inferSelect;

export const clothingProducts = pgTable("clothing_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => clothingBrands.id, { onDelete: "cascade" }).notNull(),
  categoryId: varchar("category_id").references(() => clothingCategories.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  fabric: text("fabric"),
  color: text("color"),
  sizes: jsonb("sizes").default([]),
  sizeGuide: text("size_guide"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  wasPrice: decimal("was_price", { precision: 10, scale: 2 }),
  image1: text("image1"),
  image2: text("image2"),
  image3: text("image3"),
  image4: text("image4"),
  image5: text("image5"),
  isSoldOut: boolean("is_sold_out").default(false),
  isFeatured: boolean("is_featured").default(false),
  isNew: boolean("is_new").default(false),
  stockQuantity: integer("stock_quantity").default(0),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClothingProductSchema = createInsertSchema(clothingProducts).omit({ id: true, createdAt: true });
export type InsertClothingProduct = z.infer<typeof insertClothingProductSchema>;
export type ClothingProduct = typeof clothingProducts.$inferSelect;

export const clothingOrders = pgTable("clothing_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => clothingBrands.id, { onDelete: "cascade" }).notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  customerAddress: text("customer_address"),
  customerCity: text("customer_city"),
  items: jsonb("items").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").default("cod"),
  paymentStatus: text("payment_status").default("pending"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  orderStatus: text("order_status").default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClothingOrderSchema = createInsertSchema(clothingOrders).omit({ id: true, createdAt: true });
export type InsertClothingOrder = z.infer<typeof insertClothingOrderSchema>;
export type ClothingOrder = typeof clothingOrders.$inferSelect;

// ==================== FURNITURE E-COMMERCE ====================

export const furnitureBrands = pgTable("furniture_brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  description: text("description"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  country: text("country").default("UK"),
  currency: text("currency").default("£"),
  primaryColor: text("primary_color").default("#C9A96E"),
  secondaryColor: text("secondary_color").default("#1a1a2e"),
  accentColor: text("accent_color").default("#D4AF37"),
  bgColor: text("bg_color").default("#0f0f1a"),
  cardBgColor: text("card_bg_color").default("rgba(255,255,255,0.05)"),
  bannerImages: jsonb("banner_images").default([]),
  bannerTexts: jsonb("banner_texts").default([]),
  openingHours: jsonb("opening_hours").default({}),
  adminUsername: text("admin_username"),
  adminPassword: text("admin_password"),
  stripePublishableKey: text("stripe_publishable_key"),
  stripeSecretKey: text("stripe_secret_key"),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  freeDeliveryThreshold: decimal("free_delivery_threshold", { precision: 10, scale: 2 }),
  paymentMethods: jsonb("payment_methods").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFurnitureBrandSchema = createInsertSchema(furnitureBrands).omit({ id: true, createdAt: true });
export type InsertFurnitureBrand = z.infer<typeof insertFurnitureBrandSchema>;
export type FurnitureBrand = typeof furnitureBrands.$inferSelect;

export const furnitureCategories = pgTable("furniture_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => furnitureBrands.id, { onDelete: "cascade" }),
  parentId: varchar("parent_id"),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  image: text("image"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFurnitureCategorySchema = createInsertSchema(furnitureCategories).omit({ id: true, createdAt: true });
export type InsertFurnitureCategory = z.infer<typeof insertFurnitureCategorySchema>;
export type FurnitureCategory = typeof furnitureCategories.$inferSelect;

export const furnitureProducts = pgTable("furniture_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => furnitureBrands.id, { onDelete: "cascade" }).notNull(),
  categoryId: varchar("category_id").references(() => furnitureCategories.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  specifications: text("specifications"),
  material: text("material"),
  color: text("color"),
  dimensions: text("dimensions"),
  weight: text("weight"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  wasPrice: decimal("was_price", { precision: 10, scale: 2 }),
  image1: text("image1"),
  image2: text("image2"),
  image3: text("image3"),
  image4: text("image4"),
  image5: text("image5"),
  image6: text("image6"),
  animatedText: jsonb("animated_text").default({}),
  isSoldOut: boolean("is_sold_out").default(false),
  isFeatured: boolean("is_featured").default(false),
  isNew: boolean("is_new").default(false),
  isOnSale: boolean("is_on_sale").default(false),
  stockQuantity: integer("stock_quantity").default(0),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFurnitureProductSchema = createInsertSchema(furnitureProducts).omit({ id: true, createdAt: true });
export type InsertFurnitureProduct = z.infer<typeof insertFurnitureProductSchema>;
export type FurnitureProduct = typeof furnitureProducts.$inferSelect;

export const furnitureOrders = pgTable("furniture_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => furnitureBrands.id, { onDelete: "cascade" }).notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  customerAddress: text("customer_address"),
  customerCity: text("customer_city"),
  items: jsonb("items").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").default("cod"),
  paymentStatus: text("payment_status").default("pending"),
  orderStatus: text("order_status").default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFurnitureOrderSchema = createInsertSchema(furnitureOrders).omit({ id: true, createdAt: true });
export type InsertFurnitureOrder = z.infer<typeof insertFurnitureOrderSchema>;
export type FurnitureOrder = typeof furnitureOrders.$inferSelect;

// ==================== QURAN ACADEMY SYSTEM ====================

export const quranAcademies = pgTable("quran_academies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  description: text("description"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  country: text("country").default("UK"),
  primaryColor: text("primary_color").default("#0D7C3D"),
  secondaryColor: text("secondary_color").default("#D4AF37"),
  adminUsername: text("admin_username"),
  adminPassword: text("admin_password"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuranAcademySchema = createInsertSchema(quranAcademies).omit({ id: true, createdAt: true });
export type InsertQuranAcademy = z.infer<typeof insertQuranAcademySchema>;
export type QuranAcademy = typeof quranAcademies.$inferSelect;

export const quranStudents = pgTable("quran_students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  academyId: varchar("academy_id").references(() => quranAcademies.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  age: integer("age"),
  loginUsername: text("login_username"),
  loginPassword: text("login_password"),
  wearsGlasses: boolean("wears_glasses").default(false),
  country: text("country").default("UK"),
  school: text("school"),
  sessionDuration: text("session_duration").default("30"),
  classTime: text("class_time"),
  currentJuz: integer("current_juz").default(1),
  currentSurah: integer("current_surah").default(1),
  currentPage: integer("current_page").default(1),
  totalMistakes: integer("total_mistakes").default(0),
  sessionsCompleted: integer("sessions_completed").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuranStudentSchema = createInsertSchema(quranStudents).omit({ id: true, createdAt: true });
export type InsertQuranStudent = z.infer<typeof insertQuranStudentSchema>;
export type QuranStudent = typeof quranStudents.$inferSelect;

export const quranSessions = pgTable("quran_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => quranStudents.id, { onDelete: "cascade" }).notNull(),
  academyId: varchar("academy_id").references(() => quranAcademies.id, { onDelete: "cascade" }).notNull(),
  surahNumber: integer("surah_number").notNull(),
  startAyah: integer("start_ayah").default(1),
  endAyah: integer("end_ayah"),
  mistakes: integer("mistakes").default(0),
  duration: integer("duration").default(0),
  status: text("status").default("in_progress"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuranSessionSchema = createInsertSchema(quranSessions).omit({ id: true, createdAt: true });
export type InsertQuranSession = z.infer<typeof insertQuranSessionSchema>;
export type QuranSession = typeof quranSessions.$inferSelect;

// ============================================================
// Smart Device Management System (Aroma Diffuser / IoT)
// ============================================================

export const deviceBrands = pgTable("device_brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  description: text("description"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  website: text("website"),
  primaryColor: text("primary_color").default("#1a1a2e"),
  secondaryColor: text("secondary_color").default("#16213e"),
  accentColor: text("accent_color").default("#0f3460"),
  adminUsername: text("admin_username"),
  adminPassword: text("admin_password"),
  tuyaEnabled: boolean("tuya_enabled").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDeviceBrandSchema = createInsertSchema(deviceBrands).omit({ id: true, createdAt: true });
export type InsertDeviceBrand = z.infer<typeof insertDeviceBrandSchema>;
export type DeviceBrand = typeof deviceBrands.$inferSelect;

export const deviceCustomers = pgTable("device_customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => deviceBrands.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  address: text("address"),
  loginUsername: text("login_username").notNull(),
  loginPassword: text("login_password").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDeviceCustomerSchema = createInsertSchema(deviceCustomers).omit({ id: true, createdAt: true });
export type InsertDeviceCustomer = z.infer<typeof insertDeviceCustomerSchema>;
export type DeviceCustomer = typeof deviceCustomers.$inferSelect;

export const deviceGroups = pgTable("device_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => deviceBrands.id, { onDelete: "cascade" }).notNull(),
  customerId: varchar("customer_id").references(() => deviceCustomers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDeviceGroupSchema = createInsertSchema(deviceGroups).omit({ id: true, createdAt: true });
export type InsertDeviceGroup = z.infer<typeof insertDeviceGroupSchema>;
export type DeviceGroup = typeof deviceGroups.$inferSelect;

export const devices = pgTable("devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => deviceBrands.id, { onDelete: "cascade" }).notNull(),
  customerId: varchar("customer_id").references(() => deviceCustomers.id, { onDelete: "set null" }),
  groupId: varchar("group_id").references(() => deviceGroups.id, { onDelete: "set null" }),
  serialNumber: text("serial_number").notNull(),
  name: text("name").default("Diffuser"),
  model: text("model").default("SCHICC Pro"),
  firmwareVersion: text("firmware_version").default("1.0.0"),
  isOnline: boolean("is_online").default(false),
  isRunning: boolean("is_running").default(false),
  fanSpeed: integer("fan_speed").default(3),
  sprayDuration: integer("spray_duration").default(10),
  pauseDuration: integer("pause_duration").default(30),
  concentration: integer("concentration").default(50),
  liquidLevel: integer("liquid_level").default(100),
  oilCapacity: integer("oil_capacity").default(200),
  signalStrength: integer("signal_strength").default(-50),
  tuyaDeviceId: text("tuya_device_id"),
  lastSeenAt: timestamp("last_seen_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDeviceSchema = createInsertSchema(devices).omit({ id: true, createdAt: true });
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = typeof devices.$inferSelect;

export const deviceSchedules = pgTable("device_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id").references(() => devices.id, { onDelete: "cascade" }).notNull(),
  name: text("name").default("Schedule"),
  startTime: text("start_time").default("08:00"),
  endTime: text("end_time").default("22:00"),
  spraySeconds: integer("spray_seconds").default(10),
  pauseSeconds: integer("pause_seconds").default(30),
  daysOfWeek: jsonb("days_of_week").default(["mon","tue","wed","thu","fri","sat","sun"]),
  isEnabled: boolean("is_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDeviceScheduleSchema = createInsertSchema(deviceSchedules).omit({ id: true, createdAt: true });
export type InsertDeviceSchedule = z.infer<typeof insertDeviceScheduleSchema>;
export type DeviceSchedule = typeof deviceSchedules.$inferSelect;

// ============================================================
// Manufacturing & Inventory Tracking System
// ============================================================

export const inventoryCompanies = pgTable("inventory_companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  logo: text("logo"),
  description: text("description"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  contactPerson: text("contact_person"),
  adminUsername: text("admin_username"),
  adminPassword: text("admin_password"),
  globalDiscountPercent: decimal("global_discount_percent", { precision: 5, scale: 2 }).default("0"),
  primaryColor: text("primary_color").default("#1e3a5f"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inventoryBrands = inventoryCompanies;
export const insertInventoryBrandSchema = createInsertSchema(inventoryCompanies).omit({ id: true, createdAt: true });
export type InsertInventoryBrand = z.infer<typeof insertInventoryBrandSchema>;
export type InventoryBrand = typeof inventoryCompanies.$inferSelect;

export const inventoryCategories = pgTable("inventory_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  parentId: varchar("parent_id"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInventoryCategorySchema = createInsertSchema(inventoryCategories).omit({ id: true, createdAt: true });
export type InsertInventoryCategory = z.infer<typeof insertInventoryCategorySchema>;
export type InventoryCategory = typeof inventoryCategories.$inferSelect;

export const inventoryLocations = pgTable("inventory_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  rowNumber: text("row_number"),
  area: text("area"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInventoryLocationSchema = createInsertSchema(inventoryLocations).omit({ id: true, createdAt: true });
export type InsertInventoryLocation = z.infer<typeof insertInventoryLocationSchema>;
export type InventoryLocation = typeof inventoryLocations.$inferSelect;

export const inventoryProducts = pgTable("inventory_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull(),
  barcode: text("barcode"),
  type: text("type").default("general"),
  categoryId: varchar("category_id"),
  locationId: varchar("location_id"),
  rowNumber: text("row_number"),
  area: text("area"),
  description: text("description"),
  image: text("image"),
  unitType: text("unit_type").default("pieces"),
  unitsPerBox: integer("units_per_box").default(1),
  manufacturingCost: decimal("manufacturing_cost", { precision: 10, scale: 2 }).default("0"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
  discountedPrice: decimal("discounted_price", { precision: 10, scale: 2 }),
  totalManufactured: integer("total_manufactured").default(0),
  totalDispatched: integer("total_dispatched").default(0),
  currentStock: integer("current_stock").default(0),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  manufacturer: text("manufacturer"),
  weight: text("weight"),
  dimensions: text("dimensions"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInventoryProductSchema = createInsertSchema(inventoryProducts).omit({ id: true, createdAt: true });
export type InsertInventoryProduct = z.infer<typeof insertInventoryProductSchema>;
export type InventoryProduct = typeof inventoryProducts.$inferSelect;

export const inventoryCompanyPrices = pgTable("inventory_company_prices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  productId: varchar("product_id").notNull(),
  agreedPrice: decimal("agreed_price", { precision: 10, scale: 2 }).notNull(),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inventoryBrandPrices = inventoryCompanyPrices;
export const insertInventoryBrandPriceSchema = createInsertSchema(inventoryCompanyPrices).omit({ id: true, createdAt: true });
export type InsertInventoryBrandPrice = z.infer<typeof insertInventoryBrandPriceSchema>;
export type InventoryBrandPrice = typeof inventoryCompanyPrices.$inferSelect;

export const inventoryCompanyCustomers = pgTable("inventory_company_customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  company: text("company"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inventoryCustomers = inventoryCompanyCustomers;
export const insertInventoryCustomerSchema = createInsertSchema(inventoryCompanyCustomers).omit({ id: true, createdAt: true });
export type InsertInventoryCustomer = z.infer<typeof insertInventoryCustomerSchema>;
export type InventoryCustomer = typeof inventoryCompanyCustomers.$inferSelect;

export const inventorySales = pgTable("inventory_sales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  customerId: varchar("customer_id"),
  productId: varchar("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
  status: text("status").default("completed"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInventorySaleSchema = createInsertSchema(inventorySales).omit({ id: true, createdAt: true });
export type InsertInventorySale = z.infer<typeof insertInventorySaleSchema>;
export type InventorySale = typeof inventorySales.$inferSelect;


export const inventoryStockLog = pgTable("inventory_stock_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  action: text("action").notNull(),
  quantity: integer("quantity").notNull(),
  previousStock: integer("previous_stock").default(0),
  newStock: integer("new_stock").default(0),
  notes: text("notes"),
  performedBy: text("performed_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inventoryOrders = pgTable("inventory_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").notNull(),
  customerId: varchar("customer_id").notNull(),
  items: text("items").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default("0"),
  status: text("status").default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInventoryOrderSchema = createInsertSchema(inventoryOrders).omit({ id: true, createdAt: true });
export type InsertInventoryOrder = z.infer<typeof insertInventoryOrderSchema>;
export type InventoryOrder = typeof inventoryOrders.$inferSelect;

export const stripeApplications = pgTable("stripe_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessName: text("business_name").notNull(),
  ownerFullName: text("owner_full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  businessAddress: text("business_address").notNull(),
  postcode: text("postcode").notNull(),
  businessType: text("business_type").default("restaurant"),
  bankSortCode: text("bank_sort_code").notNull(),
  bankAccountNumber: text("bank_account_number").notNull(),
  bankAccountName: text("bank_account_name").notNull(),
  payoutSpeed: text("payout_speed").default("standard"),
  notes: text("notes"),
  status: text("status").default("pending"),
  stripeAccountId: text("stripe_account_id"),
  commissionType: text("commission_type").default("percentage"),
  commissionValue: decimal("commission_value", { precision: 5, scale: 2 }).default("0.5"),
  instantThreshold: decimal("instant_threshold", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStripeApplicationSchema = createInsertSchema(stripeApplications).omit({ id: true, createdAt: true, status: true, stripeAccountId: true });
export type InsertStripeApplication = z.infer<typeof insertStripeApplicationSchema>;
export type StripeApplication = typeof stripeApplications.$inferSelect;

// ============================================================================
// LINK24 PHONE - PBX / Call Center Module (Grandstream UCM6302 integration)
// ============================================================================

// PBX Server Configuration (Super Admin manages central UCM6302)
export const pbxServers = pgTable("pbx_servers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().default("Main UCM6302"),
  host: text("host").notNull(),
  apiPort: integer("api_port").default(8443),
  sipPort: integer("sip_port").default(5060),
  username: text("username").notNull(),
  apiSecret: text("api_secret").notNull(),
  domain: text("domain"),
  wsUrl: text("ws_url"),
  stunServer: text("stun_server").default("stun:stun.l.google.com:19302"),
  status: text("status").default("offline"),
  lastSeenAt: timestamp("last_seen_at"),
  lastError: text("last_error"),
  totalChannels: integer("total_channels").default(75),
  activeChannels: integer("active_channels").default(0),
  // Cloud bridge — lets remote softphones / desk phones reach this UCM without home-router port forwarding
  cloudBridgeType: text("cloud_bridge_type").default("none"),       // "none" | "cloudflare" | "gdms-basic" | "gdms-plus"
  cloudBridgePublicHost: text("cloud_bridge_public_host"),         // e.g. "ucm.link24.app" or "abc.gdms.cloud"
  cloudBridgeStatus: text("cloud_bridge_status").default("inactive"),// "inactive" | "active" | "error"
  cloudBridgeConfig: jsonb("cloud_bridge_config").default({}),     // { tunnelId?, accountId?, gdmsDeviceId?, notes? }
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertPbxServerSchema = createInsertSchema(pbxServers).omit({ id: true, createdAt: true, updatedAt: true, status: true, lastSeenAt: true, activeChannels: true });

// SIP Trunks (outbound carriers — VoIP.ms, Telnyx, Sipgate, DIDWW etc.)
export const sipTrunks = pgTable("sip_trunks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull(),       // "voipms" | "telnyx" | "sipgate" | "didww" | "voipfone" | "gradwell" | "rozee" | "callvoz" | "custom"
  name: text("name").notNull(),               // friendly label e.g. "VoIP.ms UK"
  country: text("country").notNull().default("UK"), // "UK" | "PK" | "INTL"
  host: text("host").notNull(),               // SIP host e.g. london.voip.ms
  port: integer("port").default(5060),
  transport: text("transport").default("udp"),// "udp" | "tcp" | "tls"
  username: text("username").notNull(),
  password: text("password").notNull(),
  authUsername: text("auth_username"),        // optional separate auth user
  fromDomain: text("from_domain"),
  outboundCallerId: text("outbound_caller_id"),
  ratePerMinuteGbp: decimal("rate_per_minute_gbp", { precision: 8, scale: 4 }).default("0.0100"),
  monthlyNumberCostGbp: decimal("monthly_number_cost_gbp", { precision: 8, scale: 2 }).default("1.00"),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  status: text("status").default("unknown"),  // "registered" | "failed" | "unknown"
  lastError: text("last_error"),
  lastSeenAt: timestamp("last_seen_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertSipTrunkSchema = createInsertSchema(sipTrunks).omit({ id: true, createdAt: true, updatedAt: true, status: true, lastSeenAt: true, lastError: true });
export type SipTrunk = typeof sipTrunks.$inferSelect;
export type InsertSipTrunk = z.infer<typeof insertSipTrunkSchema>;
export type InsertPbxServer = z.infer<typeof insertPbxServerSchema>;
export type PbxServer = typeof pbxServers.$inferSelect;

// PBX Subscriptions (Per-shop billing - Basic/Pro/Premium)
export const pbxSubscriptions = pgTable("pbx_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull().unique(),
  plan: text("plan").default("basic"),
  monthlyPrice: decimal("monthly_price", { precision: 8, scale: 2 }).default("8.00"),
  status: text("status").default("trial"),
  trialEndsAt: timestamp("trial_ends_at"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCustomerId: text("stripe_customer_id"),
  stripePriceId: text("stripe_price_id"),
  planTier: text("plan_tier").default("solo"),       // "solo" | "duo" | "team" | "enterprise"
  trialStartedAt: timestamp("trial_started_at"),
  recordingEnabled: boolean("recording_enabled").default(false),
  ivrEnabled: boolean("ivr_enabled").default(false),
  aiTranscription: boolean("ai_transcription").default(false),
  maxExtensions: integer("max_extensions").default(1),
  maxNumbers: integer("max_numbers").default(1),
  includedOutgoingMinutes: integer("included_outgoing_minutes").default(100),
  extraMinuteRate: decimal("extra_minute_rate", { precision: 6, scale: 4 }).default("0.0200"),
  monthlyMinutesCap: integer("monthly_minutes_cap").default(5000),
  internationalCallsEnabled: boolean("international_calls_enabled").default(false),
  pakistanCallsEnabled: boolean("pakistan_calls_enabled").default(false),
  smsEnabled: boolean("sms_enabled").default(false),
  smsRate: decimal("sms_rate", { precision: 6, scale: 4 }).default("0.0400"),
  customCallerIdEnabled: boolean("custom_caller_id_enabled").default(false),
  callerIdVerified: boolean("caller_id_verified").default(false),
  callerIdVerifyReason: text("caller_id_verify_reason"),
  sipExtension: text("sip_extension"),
  sipPassword: text("sip_password"),
  currentPeriodStart: timestamp("current_period_start").defaultNow(),
  lastBilledAt: timestamp("last_billed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertPbxSubscriptionSchema = createInsertSchema(pbxSubscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPbxSubscription = z.infer<typeof insertPbxSubscriptionSchema>;
export type PbxSubscription = typeof pbxSubscriptions.$inferSelect;

// PBX Phone Numbers (DDI/DID - the public numbers shops are reachable on)
export const pbxPhoneNumbers = pgTable("pbx_phone_numbers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  number: text("number").notNull().unique(),
  numberType: text("number_type").default("local"),
  provider: text("provider").default("voipfone"),
  monthlyCost: decimal("monthly_cost", { precision: 6, scale: 2 }).default("1.00"),
  label: text("label"),
  status: text("status").default("active"),
  // Inbound routing destination (where calls to this number go)
  inboundDestType: text("inbound_dest_type").default("voicemail"), // "voicemail" | "extension" | "ring_group" | "ivr" | "external"
  inboundDestId: text("inbound_dest_id"),                          // ext.id | ringGroup.id | ivr.id | external phone number
  // Sync state with UCM
  ucmSynced: boolean("ucm_synced").default(false),
  ucmSyncedAt: timestamp("ucm_synced_at"),
  ucmSyncError: text("ucm_sync_error"),
  ucmRouteId: text("ucm_route_id"),                                 // UCM's internal inbound route ID (returned after sync)
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertPbxPhoneNumberSchema = createInsertSchema(pbxPhoneNumbers).omit({ id: true, createdAt: true, ucmSynced: true, ucmSyncedAt: true, ucmSyncError: true, ucmRouteId: true });
export type InsertPbxPhoneNumber = z.infer<typeof insertPbxPhoneNumberSchema>;
export type PbxPhoneNumber = typeof pbxPhoneNumbers.$inferSelect;

// PBX Extensions (SIP users - one per staff member at the shop)
export const pbxExtensions = pgTable("pbx_extensions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  extensionNumber: text("extension_number").notNull(),
  displayName: text("display_name").notNull(),
  sipPassword: text("sip_password").notNull(),
  email: text("email"),
  voicemailEnabled: boolean("voicemail_enabled").default(true),
  voicemailPin: text("voicemail_pin"),
  registered: boolean("registered").default(false),
  lastRegisteredAt: timestamp("last_registered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertPbxExtensionSchema = createInsertSchema(pbxExtensions).omit({ id: true, createdAt: true, registered: true, lastRegisteredAt: true });
export type InsertPbxExtension = z.infer<typeof insertPbxExtensionSchema>;
export type PbxExtension = typeof pbxExtensions.$inferSelect;

// PBX Ring Groups (one number rings multiple extensions simultaneously or in sequence)
export const pbxRingGroups = pgTable("pbx_ring_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),                      // "Front Counter", "Kitchen", etc.
  groupNumber: text("group_number").notNull(),       // internal dial e.g. 6000
  strategy: text("strategy").default("ringall"),     // "ringall" | "sequential" | "random" | "memory"
  ringTimeSeconds: integer("ring_time_seconds").default(20),
  extensionIds: text("extension_ids").array().default(sql`ARRAY[]::text[]`), // pbxExtensions.id[]
  assignedNumberId: varchar("assigned_number_id").references(() => pbxPhoneNumbers.id, { onDelete: "set null" }),
  failoverDestination: text("failover_destination"), // "voicemail:1000" | "ext:1001" | "external:447xxxx"
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertPbxRingGroupSchema = createInsertSchema(pbxRingGroups).omit({ id: true, createdAt: true });
export type InsertPbxRingGroup = z.infer<typeof insertPbxRingGroupSchema>;
export type PbxRingGroup = typeof pbxRingGroups.$inferSelect;

// PBX IVR Menus (Press 1 for orders, Press 2 for booking, etc.)
export const pbxIvrMenus = pgTable("pbx_ivr_menus", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull().default("Main Menu"),
  welcomeText: text("welcome_text"),
  welcomeAudioUrl: text("welcome_audio_url"),
  welcomeVoice: text("welcome_voice").default("alloy"),
  welcomeLanguage: text("welcome_language").default("en"),
  options: jsonb("options").default([]),
  invalidMessage: text("invalid_message").default("Sorry, that's not a valid option. Please try again."),
  timeoutMessage: text("timeout_message").default("Sorry, we didn't hear anything. Goodbye."),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertPbxIvrMenuSchema = createInsertSchema(pbxIvrMenus).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPbxIvrMenu = z.infer<typeof insertPbxIvrMenuSchema>;
export type PbxIvrMenu = typeof pbxIvrMenus.$inferSelect;

// PBX Audio Library (welcome messages, hold music, busy messages)
export const pbxAudioFiles = pgTable("pbx_audio_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  url: text("url").notNull(),
  durationSeconds: integer("duration_seconds"),
  source: text("source").default("ai_generated"),
  text: text("text"),
  voice: text("voice"),
  language: text("language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertPbxAudioFileSchema = createInsertSchema(pbxAudioFiles).omit({ id: true, createdAt: true });
export type InsertPbxAudioFile = z.infer<typeof insertPbxAudioFileSchema>;
export type PbxAudioFile = typeof pbxAudioFiles.$inferSelect;

// PBX Call Settings (per-shop hold music, busy message, opening hours)
export const pbxCallSettings = pgTable("pbx_call_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull().unique(),
  holdMusicId: varchar("hold_music_id"),
  busyMessageId: varchar("busy_message_id"),
  voicemailGreetingId: varchar("voicemail_greeting_id"),
  closedMessageId: varchar("closed_message_id"),
  recordingMode: text("recording_mode").default("off"),
  recordingRetentionDays: integer("recording_retention_days").default(30),
  ringTimeoutSeconds: integer("ring_timeout_seconds").default(30),
  queueEnabled: boolean("queue_enabled").default(false),
  instantAnswerMusic: boolean("instant_answer_music").default(false),
  instantAnswerGreetingId: varchar("instant_answer_greeting_id"),
  openHours: jsonb("open_hours").default({}),
  callerAnnouncement: boolean("caller_announcement").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertPbxCallSettingsSchema = createInsertSchema(pbxCallSettings).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPbxCallSettings = z.infer<typeof insertPbxCallSettingsSchema>;
export type PbxCallSettings = typeof pbxCallSettings.$inferSelect;

// PBX Customers (auto-built phone book from incoming calls)
export const pbxCustomers = pgTable("pbx_customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  phoneNumber: text("phone_number").notNull(),
  name: text("name"),
  address: text("address"),
  postcode: text("postcode"),
  notes: text("notes"),
  totalCalls: integer("total_calls").default(0),
  totalOrders: integer("total_orders").default(0),
  lastCallAt: timestamp("last_call_at"),
  lastOrderAt: timestamp("last_order_at"),
  tags: text("tags").array(),
  blocked: boolean("blocked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertPbxCustomerSchema = createInsertSchema(pbxCustomers).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPbxCustomer = z.infer<typeof insertPbxCustomerSchema>;
export type PbxCustomer = typeof pbxCustomers.$inferSelect;

// PBX Call Logs (every call - inbound, outbound, missed)
export const pbxCallLogs = pgTable("pbx_call_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  callSid: text("call_sid"),
  direction: text("direction").notNull(),
  fromNumber: text("from_number").notNull(),
  toNumber: text("to_number").notNull(),
  extensionId: varchar("extension_id"),
  customerId: varchar("customer_id"),
  customerName: text("customer_name"),
  status: text("status").default("ringing"),
  startedAt: timestamp("started_at").defaultNow(),
  answeredAt: timestamp("answered_at"),
  endedAt: timestamp("ended_at"),
  durationSeconds: integer("duration_seconds").default(0),
  ringSeconds: integer("ring_seconds").default(0),
  recordingUrl: text("recording_url"),
  transcription: text("transcription"),
  cost: decimal("cost", { precision: 8, scale: 4 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertPbxCallLogSchema = createInsertSchema(pbxCallLogs).omit({ id: true, createdAt: true });
export type InsertPbxCallLog = z.infer<typeof insertPbxCallLogSchema>;
export type PbxCallLog = typeof pbxCallLogs.$inferSelect;

// PBX Saved Contacts (per-shop phonebook with names)
export const pbxContacts = pgTable("pbx_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  email: text("email"),
  notes: text("notes"),
  favorite: boolean("favorite").default(false),
  avatarColor: text("avatar_color").default("blue"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertPbxContactSchema = createInsertSchema(pbxContacts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPbxContact = z.infer<typeof insertPbxContactSchema>;
export type PbxContact = typeof pbxContacts.$inferSelect;

// PBX SMS Messages (inbox + sent)
export const pbxSmsMessages = pgTable("pbx_sms_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  direction: text("direction").notNull(), // inbound | outbound
  fromNumber: text("from_number").notNull(),
  toNumber: text("to_number").notNull(),
  body: text("body").notNull(),
  status: text("status").default("delivered"), // delivered | failed | queued | read
  cost: decimal("cost", { precision: 6, scale: 4 }).default("0"),
  contactId: varchar("contact_id"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertPbxSmsMessageSchema = createInsertSchema(pbxSmsMessages).omit({ id: true, createdAt: true });
export type InsertPbxSmsMessage = z.infer<typeof insertPbxSmsMessageSchema>;
export type PbxSmsMessage = typeof pbxSmsMessages.$inferSelect;

// PBX Caller ID Profiles (alternate display numbers - admin-approved)
// Legal: must be a number the shop OWNS or has authority over (UK Ofcom CLI rules)
export const pbxCallerIdProfiles = pgTable("pbx_caller_id_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  displayNumber: text("display_number").notNull(),
  displayName: text("display_name").notNull(), // e.g. "Sardar Clinic" or "Main Reception"
  purpose: text("purpose"), // medical | reception | sales | other
  ownershipProof: text("ownership_proof"), // URL to uploaded proof of number ownership
  approved: boolean("approved").default(false),
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertPbxCallerIdProfileSchema = createInsertSchema(pbxCallerIdProfiles).omit({ id: true, createdAt: true, approved: true, approvedBy: true, approvedAt: true });
export type InsertPbxCallerIdProfile = z.infer<typeof insertPbxCallerIdProfileSchema>;
export type PbxCallerIdProfile = typeof pbxCallerIdProfiles.$inferSelect;

// ====================================================================
// Phone Landing Page — public marketing page offers + customer enquiries
// ====================================================================
export const phoneOffers = pgTable("phone_offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(), // "magic" | "vip" | "vip-premium"
  title: text("title").notNull(),
  badge: text("badge"),                  // "MAGIC OFFER" | "VIP" | "VIP PREMIUM"
  tagline: text("tagline"),              // short one-line subtitle
  price: decimal("price", { precision: 8, scale: 2 }).notNull(),
  priceSuffix: text("price_suffix").default("/month"),
  bullets: text("bullets").array().default(sql`ARRAY[]::text[]`),
  ctaLabel: text("cta_label").default("Get Started"),
  accentColor: text("accent_color").default("from-purple-500 to-pink-500"), // tailwind gradient
  enabled: boolean("enabled").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertPhoneOfferSchema = createInsertSchema(phoneOffers).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPhoneOffer = z.infer<typeof insertPhoneOfferSchema>;
export type PhoneOffer = typeof phoneOffers.$inferSelect;

export const phoneInquiries = pgTable("phone_inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  business: text("business"),
  businessType: text("business_type"),   // "home" | "business" | "warehouse" | "shop" | "other"
  offerSlug: text("offer_slug"),         // which card they clicked (if any)
  lines: integer("lines").default(1),
  extensions: integer("extensions").default(1),
  appUsers: integer("app_users").default(1),
  addons: text("addons").array().default(sql`ARRAY[]::text[]`), // ["recording","hold-music",...]
  estimatedMonthly: decimal("estimated_monthly", { precision: 8, scale: 2 }),
  message: text("message"),
  status: text("status").default("new"), // "new" | "contacted" | "approved" | "rejected" | "converted"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertPhoneInquirySchema = createInsertSchema(phoneInquiries).omit({ id: true, createdAt: true, updatedAt: true, status: true, notes: true });
export type InsertPhoneInquiry = z.infer<typeof insertPhoneInquirySchema>;
export type PhoneInquiry = typeof phoneInquiries.$inferSelect;

// Phone landing site settings (singleton key/value)
export const phoneSiteSettings = pgTable("phone_site_settings", {
  key: varchar("key").primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type PhoneSiteSetting = typeof phoneSiteSettings.$inferSelect;

export * from "./models/chat";
