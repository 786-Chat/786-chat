CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('unassigned', 'assigned', 'accepted', 'picked_up', 'delivering', 'completed', 'rejected', 'returned');--> statement-breakpoint
CREATE TYPE "public"."driver_license_type" AS ENUM('uk_full', 'international');--> statement-breakpoint
CREATE TYPE "public"."driver_payment_type" AS ENUM('mileage', 'salary', 'salary_plus_commission');--> statement-breakpoint
CREATE TYPE "public"."driver_salary_period" AS ENUM('weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."epos_discount_type" AS ENUM('fixed', 'percent');--> statement-breakpoint
CREATE TYPE "public"."expense_category" AS ENUM('supplier_invoice', 'staff_wages', 'rent', 'electric', 'gas', 'water', 'business_rates', 'rubbish', 'vehicle_insurance', 'business_insurance', 'mot', 'wastage', 'extra_expense', 'vat', 'tax', 'other');--> statement-breakpoint
CREATE TYPE "public"."hero_animation_style" AS ENUM('slide', 'fade', 'scrapbook', 'stomp', 'flicker', 'pulse', 'tectonic');--> statement-breakpoint
CREATE TYPE "public"."income_source" AS ENUM('customer_order', 'epos_sale', 'waiter_order', 'cash_deposit', 'other_income');--> statement-breakpoint
CREATE TYPE "public"."order_item_status" AS ENUM('pending', 'preparing', 'ready');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending_approval', 'new', 'preparing', 'ready', 'completed');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('delivery', 'takeaway', 'dine-in', 'collection');--> statement-breakpoint
CREATE TYPE "public"."payment_instruction" AS ENUM('customer_paid_online', 'collect_cash', 'branch_pays_driver');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'card', 'account', 'bank_transfer');--> statement-breakpoint
CREATE TYPE "public"."payment_method_type" AS ENUM('cash', 'bank_transfer', 'cheque');--> statement-breakpoint
CREATE TYPE "public"."recurring_frequency" AS ENUM('weekly', 'monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."restaurant_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."staff_pay_type" AS ENUM('hourly', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."supplier_order_status" AS ENUM('draft', 'sent', 'received', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."supplier_unit_type" AS ENUM('kg', 'packet', 'piece', 'box', 'bottle', 'bag', 'case', 'other');--> statement-breakpoint
CREATE TYPE "public"."table_session_status" AS ENUM('ordering', 'awaiting_manager', 'approved', 'in_kitchen', 'ready', 'served', 'closed');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TYPE "public"."waiter_status" AS ENUM('active', 'on_break', 'offline');--> statement-breakpoint
CREATE TYPE "public"."welcome_background_type" AS ENUM('image', 'gif', 'video', 'slider', 'gradient');--> statement-breakpoint
CREATE TABLE "bookings" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "customer_id" varchar,
        "customer_name" text NOT NULL,
        "email" text NOT NULL,
        "phone" text NOT NULL,
        "address" text,
        "date" text NOT NULL,
        "time" text NOT NULL,
        "guests" integer NOT NULL,
        "adults" integer DEFAULT 0,
        "children" integer DEFAULT 0,
        "infants" integer DEFAULT 0,
        "special_help" text,
        "status" "booking_status" DEFAULT 'pending' NOT NULL,
        "table_label" text,
        "confirmed_at" timestamp,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "branch_driver_assignments" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "driver_id" varchar NOT NULL,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "branch_features" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "online_ordering" boolean DEFAULT true,
        "table_booking" boolean DEFAULT true,
        "delivery_tracking" boolean DEFAULT true,
        "dine_in_ordering" boolean DEFAULT true,
        "kitchen_display" boolean DEFAULT true,
        "epos_system" boolean DEFAULT true,
        "waiter_app" boolean DEFAULT false,
        "driver_app" boolean DEFAULT true,
        "supplier_ordering" boolean DEFAULT false,
        "telephone_ordering" boolean DEFAULT false,
        "loyalty_program" boolean DEFAULT false,
        "promotions" boolean DEFAULT true,
        "allergen_management" boolean DEFAULT true,
        "live_chat" boolean DEFAULT false,
        "reviews_widget" boolean DEFAULT false,
        "multi_language" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "branch_features_restaurant_id_unique" UNIQUE("restaurant_id")
);
--> statement-breakpoint
CREATE TABLE "branch_snapshots" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "label" text,
        "snapshot_type" text DEFAULT 'manual',
        "payload" jsonb NOT NULL,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "call_recordings" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "call_sid" text NOT NULL,
        "recording_sid" text,
        "recording_url" text,
        "caller_number" text NOT NULL,
        "customer_name" text,
        "duration" integer,
        "status" text DEFAULT 'pending',
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cash_deposits" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "amount" numeric(10, 2) NOT NULL,
        "deposit_date" timestamp DEFAULT now(),
        "notes" text,
        "deposited_by" text,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_push_subscriptions" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "order_id" varchar NOT NULL,
        "endpoint" text NOT NULL,
        "p256dh" text NOT NULL,
        "auth" text NOT NULL,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "phone" text NOT NULL,
        "name" text,
        "email" text,
        "address" text,
        "work_address" text,
        "city" text,
        "postcode" text,
        "auth_provider" text DEFAULT 'mobile',
        "restaurant_id" varchar,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "driver_location_updates" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "order_id" varchar,
        "driver_id" varchar NOT NULL,
        "latitude" numeric(10, 7) NOT NULL,
        "longitude" numeric(10, 7) NOT NULL,
        "speed" numeric(5, 2),
        "heading" numeric(5, 2),
        "accuracy" numeric(6, 2),
        "recorded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "driver_payments" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "driver_id" varchar NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "amount" numeric(10, 2) NOT NULL,
        "payment_period" text,
        "payment_type" text NOT NULL,
        "notes" text,
        "paid_at" timestamp DEFAULT now(),
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "drivers" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "name" text NOT NULL,
        "phone" text NOT NULL,
        "password" text NOT NULL,
        "vehicle_type" text DEFAULT 'car',
        "vehicle_plate" text,
        "is_active" boolean DEFAULT true,
        "is_on_duty" boolean DEFAULT false,
        "last_location_lat" numeric(10, 7),
        "last_location_lng" numeric(10, 7),
        "last_seen" timestamp,
        "shift_start_time" timestamp,
        "shift_end_time" timestamp,
        "payment_type" "driver_payment_type" DEFAULT 'mileage',
        "mileage_rate_1" numeric(10, 2) DEFAULT '0.50',
        "mileage_rate_2" numeric(10, 2) DEFAULT '1.50',
        "mileage_rate_3" numeric(10, 2) DEFAULT '2.00',
        "mileage_range_1_max" numeric(5, 1) DEFAULT '1',
        "mileage_range_2_max" numeric(5, 1) DEFAULT '3',
        "mileage_range_3_max" numeric(5, 1) DEFAULT '5',
        "salary_amount" numeric(10, 2),
        "salary_period" "driver_salary_period" DEFAULT 'weekly',
        "agreed_delivery_charge" numeric(10, 2),
        "license_type" "driver_license_type",
        "license_copy_url" text,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "epos_orders" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "receipt_number" integer,
        "items" jsonb NOT NULL,
        "subtotal" numeric(10, 2) NOT NULL,
        "discount_type" "epos_discount_type",
        "discount_value" numeric(10, 2) DEFAULT '0',
        "discount_amount" numeric(10, 2) DEFAULT '0',
        "total" numeric(10, 2) NOT NULL,
        "payment_method" "payment_method" DEFAULT 'cash',
        "cashier_name" text,
        "customer_name" text,
        "notes" text,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "extra_toppings" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "menu_item_id" varchar,
        "name" text NOT NULL,
        "price" numeric(10, 2) DEFAULT '1.00' NOT NULL,
        "image" text,
        "is_active" boolean DEFAULT true,
        "sort_order" integer DEFAULT 0,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "financial_transactions" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "type" "transaction_type" NOT NULL,
        "income_source" "income_source",
        "expense_category" "expense_category",
        "amount" numeric(10, 2) NOT NULL,
        "description" text,
        "reference_id" varchar,
        "reference_type" text,
        "transaction_date" timestamp DEFAULT now(),
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gallery_images" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "image_url" text NOT NULL,
        "title" text,
        "sort_order" integer DEFAULT 0,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kitchen_stations" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "name" text NOT NULL,
        "slug" text NOT NULL,
        "color" text DEFAULT '#3b82f6',
        "categories" text[] DEFAULT '{}',
        "display_order" integer DEFAULT 0,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "menu_categories" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar,
        "parent_id" varchar,
        "slug" text NOT NULL,
        "name" text NOT NULL,
        "icon" text DEFAULT '🍽️',
        "image_url" text,
        "video_url" text,
        "gif_url" text,
        "description" text,
        "sort_order" integer DEFAULT 0,
        "is_enabled" boolean DEFAULT true,
        "show_in_telephone" boolean DEFAULT true,
        "show_in_epos" boolean DEFAULT true,
        "show_in_waiter" boolean DEFAULT true,
        "show_in_online" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "menu_item_recommendations" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "source_item_id" varchar NOT NULL,
        "recommended_item_id" varchar NOT NULL,
        "label" text DEFAULT 'Goes well with',
        "sort_order" integer DEFAULT 0,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "menu_item_variants" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "menu_item_id" varchar NOT NULL,
        "name" text NOT NULL,
        "price" numeric(10, 2) NOT NULL,
        "sort_order" integer DEFAULT 0,
        "available" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar,
        "name" text NOT NULL,
        "description" text NOT NULL,
        "price" numeric(10, 2) NOT NULL,
        "category" text NOT NULL,
        "image" text NOT NULL,
        "video_url" text,
        "gif_url" text,
        "available" boolean DEFAULT true,
        "allergen_profile" jsonb DEFAULT '{}'::jsonb,
        "weight" numeric(10, 6),
        "weight_unit" text DEFAULT 'kg',
        "fresh_frozen" text,
        "country_of_origin" text,
        "variant_label" text,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "menu_modifiers" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "menu_item_id" varchar NOT NULL,
        "name" text NOT NULL,
        "price" numeric(10, 2) DEFAULT '0.00' NOT NULL,
        "available" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_deliveries" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "order_id" varchar NOT NULL,
        "driver_id" varchar,
        "delivery_status" "delivery_status" DEFAULT 'unassigned' NOT NULL,
        "offer_amount" numeric(10, 2),
        "payment_instruction" "payment_instruction",
        "assigned_at" timestamp,
        "accepted_at" timestamp,
        "picked_up_at" timestamp,
        "delivered_at" timestamp,
        "driver_notes" text,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_item_completions" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "order_item_id" varchar NOT NULL,
        "order_id" varchar NOT NULL,
        "station_id" varchar,
        "status" "order_item_status" DEFAULT 'pending',
        "completed_quantity" integer DEFAULT 0,
        "completed_by" text,
        "completed_at" timestamp,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_items" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "order_id" varchar NOT NULL,
        "name" text NOT NULL,
        "quantity" integer NOT NULL,
        "price" numeric(10, 2) NOT NULL,
        "notes" text
);
--> statement-breakpoint
CREATE TABLE "orders" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "order_number" integer,
        "customer_id" varchar,
        "customer_name" text NOT NULL,
        "phone" text NOT NULL,
        "address" text,
        "type" "order_type" NOT NULL,
        "payment_method" "payment_method" DEFAULT 'cash',
        "total" numeric(10, 2) NOT NULL,
        "status" "order_status" DEFAULT 'new' NOT NULL,
        "stripe_payment_id" text,
        "is_archived" boolean DEFAULT false,
        "estimated_delivery_minutes" integer,
        "driver_assigned_at" timestamp,
        "status_message" text,
        "source" text DEFAULT 'online',
        "tracking_token" varchar,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "platform_commission" numeric(5, 2) DEFAULT '2.5',
        "sms_notifications_enabled" boolean DEFAULT true,
        "email_digests_enabled" boolean DEFAULT true,
        "default_open_time" text DEFAULT '11:00',
        "default_close_time" text DEFAULT '23:00',
        "monday_enabled" boolean DEFAULT true,
        "tuesday_enabled" boolean DEFAULT true,
        "wednesday_enabled" boolean DEFAULT true,
        "thursday_enabled" boolean DEFAULT true,
        "friday_enabled" boolean DEFAULT true,
        "saturday_enabled" boolean DEFAULT true,
        "sunday_enabled" boolean DEFAULT false,
        "monday_open" text DEFAULT '11:00',
        "monday_close" text DEFAULT '23:00',
        "tuesday_open" text DEFAULT '11:00',
        "tuesday_close" text DEFAULT '23:00',
        "wednesday_open" text DEFAULT '11:00',
        "wednesday_close" text DEFAULT '23:00',
        "thursday_open" text DEFAULT '11:00',
        "thursday_close" text DEFAULT '23:00',
        "friday_open" text DEFAULT '11:00',
        "friday_close" text DEFAULT '23:00',
        "saturday_open" text DEFAULT '11:00',
        "saturday_close" text DEFAULT '23:00',
        "sunday_open" text DEFAULT '11:00',
        "sunday_close" text DEFAULT '23:00',
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "popular_items" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "name" text NOT NULL,
        "image_url" text NOT NULL,
        "link_url" text,
        "sort_order" integer DEFAULT 0,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "promotions" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "headline" text NOT NULL,
        "subtext" text,
        "is_active" boolean DEFAULT true,
        "background_color" text DEFAULT '#dc2626',
        "text_color" text DEFAULT '#ffffff',
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "properties" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "branch_id" varchar NOT NULL,
        "title" text NOT NULL,
        "description" text,
        "property_type" text DEFAULT 'residential',
        "listing_type" text DEFAULT 'sale',
        "price" numeric(15, 2),
        "price_unit" text DEFAULT 'PKR',
        "address" text,
        "city" text,
        "area" text,
        "bedrooms" integer DEFAULT 0,
        "bathrooms" integer DEFAULT 0,
        "area_size" text,
        "area_unit" text DEFAULT 'Marla',
        "images" jsonb DEFAULT '[]'::jsonb,
        "video_url" text,
        "status" text DEFAULT 'pending',
        "is_featured" boolean DEFAULT false,
        "ownership_type" text DEFAULT 'freehold',
        "seller_name" text,
        "seller_phone" text,
        "seller_email" text,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "property_appointments" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "branch_id" varchar NOT NULL,
        "property_id" varchar,
        "customer_name" varchar(255) NOT NULL,
        "customer_phone" varchar(50) NOT NULL,
        "customer_email" text,
        "customer_address" text,
        "property_name" varchar(255) NOT NULL,
        "visit_date" text NOT NULL,
        "visit_time" varchar(50) NOT NULL,
        "visit_code" varchar(50) NOT NULL,
        "visit_fee" integer NOT NULL,
        "appointment_type" text DEFAULT 'property_visit',
        "notes" text,
        "payment_method" varchar(50) NOT NULL,
        "payment_amount" numeric(10, 2),
        "payment_reference" text,
        "payment_status" varchar(50) DEFAULT 'pending',
        "payment_proof_url" text,
        "status" varchar(50) DEFAULT 'pending',
        "confirmed_at" timestamp,
        "confirmed_by" text,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "property_branches" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "slug" text NOT NULL,
        "address" text,
        "phone" text,
        "email" text,
        "logo_url" text,
        "login_username" text,
        "login_password" text,
        "jazzcash_enabled" boolean DEFAULT false,
        "jazzcash_number" text,
        "easypaisa_enabled" boolean DEFAULT false,
        "easypaisa_number" text,
        "hbl_bank_enabled" boolean DEFAULT false,
        "hbl_account_number" text,
        "hbl_account_title" text,
        "cash_on_delivery_enabled" boolean DEFAULT true,
        "commission_rate" numeric(5, 2) DEFAULT '25.00',
        "visit_charges" numeric(10, 2) DEFAULT '1000.00',
        "monthly_fee" numeric(10, 2) DEFAULT '2000.00',
        "stripe_account_id" text,
        "stripe_publishable_key" text,
        "stripe_secret_key" text,
        "sumup_api_key" text,
        "sumup_merchant_code" text,
        "square_access_token" text,
        "square_location_id" text,
        "zettle_api_key" text,
        "zettle_merchant_id" text,
        "currency" text DEFAULT 'PKR',
        "is_open" boolean DEFAULT true,
        "google_maps_url" text,
        "use_default_url" boolean DEFAULT true,
        "subdomain" text,
        "custom_domain" text,
        "primary_color" text DEFAULT '#0ea5e9',
        "secondary_color" text DEFAULT '#06b6d4',
        "whatsapp_number" text,
        "owner_name" text,
        "video_url" text,
        "facebook_url" text,
        "instagram_url" text,
        "twitter_url" text,
        "youtube_url" text,
        "contact_bg_images" jsonb DEFAULT '[]'::jsonb,
        "advantages" jsonb DEFAULT '[{"title":"Verified Properties","description":"All listings are thoroughly verified","icon":"shield"},{"title":"Legal Assistance","description":"Complete documentation support","icon":"file"},{"title":"24/7 Support","description":"Round the clock customer support","icon":"clock"},{"title":"Wide Network","description":"Extensive network across Pakistan","icon":"globe"}]'::jsonb,
        "featured_properties" jsonb DEFAULT '[]'::jsonb,
        "hero_tagline" text DEFAULT 'Premium Real Estate in Pakistan',
        "hero_title1" text DEFAULT 'Find Your',
        "hero_title2" text DEFAULT 'Dream Property',
        "hero_title3" text DEFAULT 'Faster',
        "hero_description" text DEFAULT 'offers premium properties for sale and rent. Buy, sell, or rent with',
        "services_tagline" text DEFAULT 'Our Services',
        "services_title" text DEFAULT 'What We Offer',
        "services_description" text DEFAULT 'Comprehensive real estate solutions tailored to your needs',
        "service_cards" jsonb DEFAULT '[{"title":"Buy Property","description":"Find your dream home from our extensive collection of residential and commercial properties.","icon":"home","color":"cyan"},{"title":"Rent Property","description":"Discover premium rental properties with flexible terms and transparent pricing.","icon":"key","color":"emerald"},{"title":"Sell Property","description":"Get the best value for your property with our expert valuation and marketing.","icon":"trending","color":"purple"}]'::jsonb,
        "announcement_text" text DEFAULT 'KING''S PROPERTY GROUP',
        "announcement_enabled" boolean DEFAULT true,
        "welcome_voice_url" text,
        "welcome_voice_enabled" boolean DEFAULT false,
        "intro_sound_url" text,
        "map_embed_url" text,
        "visit_fee" integer DEFAULT 1000,
        "agreed_price" numeric(10, 2) DEFAULT '0.00',
        "theme_config" jsonb DEFAULT '{}'::jsonb,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "property_branches_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "property_video_links" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "branch_id" varchar NOT NULL,
        "title" text NOT NULL,
        "url" text NOT NULL,
        "category" text DEFAULT 'property_tours',
        "display_order" integer DEFAULT 0,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "driver_id" varchar NOT NULL,
        "endpoint" text NOT NULL,
        "p256dh" text NOT NULL,
        "auth" text NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recurring_expenses" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "category" "expense_category" NOT NULL,
        "name" text NOT NULL,
        "amount" numeric(10, 2) NOT NULL,
        "frequency" "recurring_frequency" NOT NULL,
        "day_of_month" integer DEFAULT 1,
        "day_of_week" integer,
        "is_active" boolean DEFAULT true,
        "last_processed_date" timestamp,
        "next_due_date" timestamp,
        "include_vat" boolean DEFAULT false,
        "vat_rate" numeric(5, 2) DEFAULT '20.00',
        "notes" text,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "restaurant_dashboard_settings" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "promotions_enabled" boolean DEFAULT true,
        "branding_enabled" boolean DEFAULT true,
        "hours_enabled" boolean DEFAULT true,
        "hero_gallery_enabled" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        CONSTRAINT "restaurant_dashboard_settings_restaurant_id_unique" UNIQUE("restaurant_id")
);
--> statement-breakpoint
CREATE TABLE "restaurant_hero_images" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "image_url" text NOT NULL,
        "media_type" text DEFAULT 'image',
        "label" text,
        "sort_order" integer DEFAULT 0,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "slug" text NOT NULL,
        "address" text NOT NULL,
        "phone" text,
        "email" text,
        "status" "restaurant_status" DEFAULT 'closed' NOT NULL,
        "rating" numeric(3, 2) DEFAULT '5.0',
        "orders_today" integer DEFAULT 0,
        "revenue_today" numeric(10, 2) DEFAULT '0.00',
        "last_order_time" text DEFAULT 'Never',
        "google_maps_url" text,
        "stripe_account_id" text,
        "stripe_publishable_key" text,
        "stripe_secret_key" text,
        "card_enabled" boolean DEFAULT false,
        "login_username" text,
        "login_password" text,
        "kitchen_login_password" text,
        "kitchen_staff_name" text,
        "epos_login_password" text,
        "epos_staff_name" text,
        "waiter_login_password" text,
        "waiter_staff_name" text,
        "suppliers_login_password" text,
        "suppliers_staff_name" text,
        "finances_login_password" text,
        "finances_staff_name" text,
        "logo_url" text,
        "welcome_image_url" text,
        "theme_key" text DEFAULT 'classic',
        "hero_animation_style" "hero_animation_style" DEFAULT 'slide',
        "hero_slide_interval" integer DEFAULT 5000,
        "hero_gradient_start" text DEFAULT '#dc2626',
        "hero_gradient_middle" text DEFAULT '#f97316',
        "hero_gradient_end" text DEFAULT '#fbbf24',
        "primary_color" text DEFAULT '#8B0000',
        "secondary_color" text DEFAULT '#FFD700',
        "accent_color" text DEFAULT '#4A0E4E',
        "header_bg_color" text DEFAULT '#1a1a2e',
        "card_bg_color" text DEFAULT '#ffffff',
        "button_color" text DEFAULT '#dc2626',
        "text_color" text DEFAULT '#ffffff',
        "hero_video_url" text,
        "hero_gif_url" text,
        "welcome_background_type" text DEFAULT 'gradient',
        "welcome_background_image_url" text,
        "welcome_background_gif_url" text,
        "welcome_background_video_url" text,
        "welcome_slider_images" jsonb DEFAULT '[]'::jsonb,
        "delivery_hours_mon_thu" text DEFAULT '12PM - 10:30PM',
        "delivery_hours_fri_sat" text DEFAULT '12PM - 11:30PM',
        "delivery_hours_sun" text DEFAULT '12PM - 10:30PM',
        "collection_hours_mon_thu" text DEFAULT '12PM - 10:30PM',
        "collection_hours_fri_sat" text DEFAULT '12PM - 11:30PM',
        "collection_hours_sun" text DEFAULT '12PM - 10:30PM',
        "accepting_orders" boolean DEFAULT true,
        "tawa_hero_image" text,
        "tawa_hero_video" text,
        "emparo_hero_image" text,
        "emparo_hero_video" text,
        "collection_discount_percent" integer DEFAULT 10,
        "collection_discount_minimum" numeric(10, 2) DEFAULT '15.00',
        "supplier_order_from_email" text,
        "currency" text DEFAULT 'GBP',
        "delivery_time_minutes" integer DEFAULT 45,
        "collection_time_minutes" integer DEFAULT 20,
        "busy_mode_enabled" boolean DEFAULT false,
        "busy_mode_extra_minutes" integer DEFAULT 15,
        "easypaisa_account_number" text,
        "easypaisa_account_name" text,
        "jazzcash_account_number" text,
        "jazzcash_account_name" text,
        "hbl_account_number" text,
        "hbl_account_name" text,
        "hbl_iban" text,
        "ubl_account_number" text,
        "ubl_account_name" text,
        "ubl_iban" text,
        "sumup_api_key" text,
        "sumup_merchant_code" text,
        "square_access_token" text,
        "square_location_id" text,
        "zettle_api_key" text,
        "zettle_merchant_id" text,
        "vat_percent" numeric(5, 2) DEFAULT '0',
        "vat_enabled" boolean DEFAULT false,
        "service_fee_percent" numeric(5, 2) DEFAULT '0',
        "service_fee_enabled" boolean DEFAULT false,
        "delivery_fee" numeric(10, 2) DEFAULT '0',
        "delivery_fee_enabled" boolean DEFAULT false,
        "free_delivery_minimum" numeric(10, 2) DEFAULT '0',
        "free_delivery_enabled" boolean DEFAULT false,
        "cutlery_option_enabled" boolean DEFAULT false,
        "cutlery_name" text DEFAULT 'Cutlery Set',
        "cutlery_price" numeric(10, 2) DEFAULT '0.50',
        "custom_domain" text,
        "voice_alert_enabled" boolean DEFAULT true,
        "voice_alert_message" text DEFAULT 'New order received',
        "voice_alert_voice" text DEFAULT 'default',
        "voice_alert_rate" numeric(3, 2) DEFAULT '1.0',
        "voice_alert_pitch" numeric(3, 2) DEFAULT '1.0',
        "alarm_sound" text DEFAULT 'alarm1',
        "tagline" text DEFAULT 'Where every bite feels like home',
        "cuisine_type" text DEFAULT 'Pakistani & Afghani Cuisine',
        "branch_city" text,
        "category_display_position" text DEFAULT 'header',
        "created_at" timestamp DEFAULT now(),
        CONSTRAINT "restaurants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "staff_members" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "name" text NOT NULL,
        "role" text,
        "phone" text,
        "email" text,
        "pay_type" "staff_pay_type" DEFAULT 'hourly',
        "pay_rate" numeric(10, 2) NOT NULL,
        "hours_per_week" numeric(5, 1),
        "is_active" boolean DEFAULT true,
        "start_date" timestamp,
        "ni_number" text,
        "tax_code" text DEFAULT '1257L',
        "ni_table_letter" text DEFAULT 'A',
        "address" text,
        "postcode" text,
        "payment_method" "payment_method_type" DEFAULT 'cash',
        "employee_number" text,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "staff_wage_payments" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "staff_id" varchar NOT NULL,
        "period_start" timestamp NOT NULL,
        "period_end" timestamp NOT NULL,
        "hours_worked" numeric(6, 2),
        "hourly_rate" numeric(10, 2),
        "gross_amount" numeric(10, 2) NOT NULL,
        "tax_deduction" numeric(10, 2) DEFAULT '0.00',
        "ni_deduction" numeric(10, 2) DEFAULT '0.00',
        "employer_ni_contribution" numeric(10, 2) DEFAULT '0.00',
        "net_amount" numeric(10, 2) NOT NULL,
        "is_paid" boolean DEFAULT false,
        "paid_at" timestamp,
        "notes" text,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "supplier_order_items" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "order_id" varchar NOT NULL,
        "product_id" varchar,
        "product_name" text NOT NULL,
        "quantity" numeric(10, 2) NOT NULL,
        "unit_type" text,
        "unit_price" numeric(10, 2) NOT NULL,
        "subtotal" numeric(10, 2) NOT NULL,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "supplier_orders" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "supplier_id" varchar NOT NULL,
        "order_date" timestamp DEFAULT now(),
        "sent_at" timestamp,
        "status" "supplier_order_status" DEFAULT 'draft',
        "total" numeric(10, 2) DEFAULT '0.00',
        "notes" text,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "supplier_products" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "supplier_id" varchar NOT NULL,
        "name" text NOT NULL,
        "unit_type" "supplier_unit_type" DEFAULT 'piece',
        "unit_label" text,
        "price_per_unit" numeric(10, 2) DEFAULT '0.00',
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "name" text NOT NULL,
        "email" text,
        "phone" text,
        "whatsapp" text,
        "contact_name" text,
        "notes" text,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "table_session_items" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "session_id" varchar NOT NULL,
        "menu_item_id" varchar NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "price" numeric(10, 2) NOT NULL,
        "quantity" integer DEFAULT 1,
        "toppings" jsonb DEFAULT '[]'::jsonb,
        "notes" text,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "table_sessions" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "waiter_id" varchar,
        "tablet_id" varchar,
        "table_number" text NOT NULL,
        "guest_counts" jsonb DEFAULT '{"adults":1,"kids":0,"children":0}'::jsonb,
        "status" "table_session_status" DEFAULT 'ordering',
        "notes" text,
        "order_id" varchar,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "topping_group_options" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "group_id" varchar NOT NULL,
        "name" text NOT NULL,
        "price" numeric(10, 2) DEFAULT '0.00' NOT NULL,
        "image" text,
        "is_default" boolean DEFAULT false,
        "is_available" boolean DEFAULT true,
        "sort_order" integer DEFAULT 0,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "topping_groups" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "menu_item_id" varchar NOT NULL,
        "headline" text NOT NULL,
        "is_required" boolean DEFAULT false,
        "min_selections" integer DEFAULT 0,
        "max_selections" integer DEFAULT 1,
        "allow_quantity" boolean DEFAULT false,
        "max_quantity_per_option" integer DEFAULT 5,
        "sort_order" integer DEFAULT 0,
        "half_type" varchar(20),
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "twilio_settings" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "account_sid" text NOT NULL,
        "auth_token" text NOT NULL,
        "phone_number" text NOT NULL,
        "enabled" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "twilio_settings_restaurant_id_unique" UNIQUE("restaurant_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "username" text NOT NULL,
        "password" text NOT NULL,
        "role" text DEFAULT 'admin' NOT NULL,
        CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "waiter_tablets" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "tablet_number" integer NOT NULL,
        "assigned_waiter_id" varchar,
        "assigned_waiter_name" text,
        "is_active" boolean DEFAULT false,
        "session_started_at" timestamp,
        "order_count" integer DEFAULT 0,
        "last_active_at" timestamp,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "waiters" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "restaurant_id" varchar NOT NULL,
        "name" text NOT NULL,
        "area" text,
        "room_number" text,
        "pin" text,
        "status" "waiter_status" DEFAULT 'offline',
        "current_tablet_id" varchar,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_driver_assignments" ADD CONSTRAINT "branch_driver_assignments_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_driver_assignments" ADD CONSTRAINT "branch_driver_assignments_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_features" ADD CONSTRAINT "branch_features_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_snapshots" ADD CONSTRAINT "branch_snapshots_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_recordings" ADD CONSTRAINT "call_recordings_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_deposits" ADD CONSTRAINT "cash_deposits_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_push_subscriptions" ADD CONSTRAINT "customer_push_subscriptions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_location_updates" ADD CONSTRAINT "driver_location_updates_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_location_updates" ADD CONSTRAINT "driver_location_updates_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_payments" ADD CONSTRAINT "driver_payments_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_payments" ADD CONSTRAINT "driver_payments_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "epos_orders" ADD CONSTRAINT "epos_orders_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extra_toppings" ADD CONSTRAINT "extra_toppings_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extra_toppings" ADD CONSTRAINT "extra_toppings_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_images" ADD CONSTRAINT "gallery_images_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kitchen_stations" ADD CONSTRAINT "kitchen_stations_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_recommendations" ADD CONSTRAINT "menu_item_recommendations_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_recommendations" ADD CONSTRAINT "menu_item_recommendations_source_item_id_menu_items_id_fk" FOREIGN KEY ("source_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_recommendations" ADD CONSTRAINT "menu_item_recommendations_recommended_item_id_menu_items_id_fk" FOREIGN KEY ("recommended_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_variants" ADD CONSTRAINT "menu_item_variants_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_modifiers" ADD CONSTRAINT "menu_modifiers_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_deliveries" ADD CONSTRAINT "order_deliveries_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_deliveries" ADD CONSTRAINT "order_deliveries_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_completions" ADD CONSTRAINT "order_item_completions_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_completions" ADD CONSTRAINT "order_item_completions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_completions" ADD CONSTRAINT "order_item_completions_station_id_kitchen_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."kitchen_stations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "popular_items" ADD CONSTRAINT "popular_items_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_branch_id_property_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."property_branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_appointments" ADD CONSTRAINT "property_appointments_branch_id_property_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."property_branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_appointments" ADD CONSTRAINT "property_appointments_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_video_links" ADD CONSTRAINT "property_video_links_branch_id_property_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."property_branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_dashboard_settings" ADD CONSTRAINT "restaurant_dashboard_settings_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_hero_images" ADD CONSTRAINT "restaurant_hero_images_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_wage_payments" ADD CONSTRAINT "staff_wage_payments_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_wage_payments" ADD CONSTRAINT "staff_wage_payments_staff_id_staff_members_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_order_items" ADD CONSTRAINT "supplier_order_items_order_id_supplier_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."supplier_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_order_items" ADD CONSTRAINT "supplier_order_items_product_id_supplier_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."supplier_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_orders" ADD CONSTRAINT "supplier_orders_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_orders" ADD CONSTRAINT "supplier_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_session_items" ADD CONSTRAINT "table_session_items_session_id_table_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."table_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_session_items" ADD CONSTRAINT "table_session_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_sessions" ADD CONSTRAINT "table_sessions_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_sessions" ADD CONSTRAINT "table_sessions_waiter_id_waiters_id_fk" FOREIGN KEY ("waiter_id") REFERENCES "public"."waiters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_sessions" ADD CONSTRAINT "table_sessions_tablet_id_waiter_tablets_id_fk" FOREIGN KEY ("tablet_id") REFERENCES "public"."waiter_tablets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_sessions" ADD CONSTRAINT "table_sessions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topping_group_options" ADD CONSTRAINT "topping_group_options_group_id_topping_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."topping_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topping_groups" ADD CONSTRAINT "topping_groups_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topping_groups" ADD CONSTRAINT "topping_groups_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "twilio_settings" ADD CONSTRAINT "twilio_settings_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waiter_tablets" ADD CONSTRAINT "waiter_tablets_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waiter_tablets" ADD CONSTRAINT "waiter_tablets_assigned_waiter_id_waiters_id_fk" FOREIGN KEY ("assigned_waiter_id") REFERENCES "public"."waiters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waiters" ADD CONSTRAINT "waiters_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;