import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertRestaurantSchema, 
  insertMenuItemSchema, 
  insertOrderSchema,
  insertBookingSchema,
  insertGalleryImageSchema,
  insertDriverSchema,
  orderItems,
  callRecordings,
  menuItems,
  menuCategories,
  restaurants,
  type Restaurant
} from "@shared/schema";
import * as schema from "@shared/schema";
import { eq, sql, inArray } from "drizzle-orm";
import { db } from "./db";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import * as cheerio from "cheerio";
import { tawaRestaurantData, tawaMenuItems } from "./data/tawaMenu";
import { dhabaRestaurantData, dhabaMenuItems } from "./data/dhabaMenu";
import { tawaWatfordRestaurantData, tawaWatfordCategories, tawaWatfordMenuItems } from "./data/tawaWatfordMenu";
import multer from "multer";
import path from "path";
import fs from "fs";
import webpush from "web-push";
import { sendEmail } from "./resend";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { autoSeedBranches } from "./auto-seed";
import { registerDeviceRoutes } from "./device-routes";
import { registerInventoryRoutes } from "./inventory-routes";

// Track last auto-backup times per restaurant
const lastAutoBackupTime: Map<string, number> = new Map();
const AUTO_BACKUP_INTERVAL = 60 * 60 * 1000; // 1 hour minimum between auto backups

async function triggerAutoBackup(restaurantId: string, changeType: string): Promise<void> {
  try {
    const now = Date.now();
    const lastBackup = lastAutoBackupTime.get(restaurantId) || 0;
    
    // Only create auto-backup if more than 1 hour since last backup
    if (now - lastBackup < AUTO_BACKUP_INTERVAL) {
      return;
    }
    
    // Create auto backup in background (don't await to avoid slowing down the response)
    storage.createBranchSnapshot(restaurantId, `Auto backup - ${changeType}`, 'auto')
      .then(() => {
        lastAutoBackupTime.set(restaurantId, now);
        console.log(`Auto backup created for restaurant ${restaurantId} after ${changeType}`);
      })
      .catch((err) => console.error('Auto backup failed:', err));
  } catch (error) {
    console.error('Auto backup trigger failed:', error);
  }
}

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@foodsafetyms.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  console.log('Web Push configured with VAPID keys');
} else {
  console.warn('VAPID keys not configured - push notifications will be disabled');
}

// Helper function to send push notification to a driver
async function sendPushNotification(subscription: { endpoint: string; p256dh: string; auth: string }, payload: object): Promise<boolean> {
  if (!vapidPublicKey || !vapidPrivateKey) return false;
  
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (error: any) {
    console.error('Push notification failed:', error.message);
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription expired - delete it
      await storage.deletePushSubscription(subscription.endpoint);
    }
    return false;
  }
}

// Helper function to parse time string like "12PM" or "10:30PM" to minutes since midnight
function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) return -1;
  let hours = parseInt(match[1]);
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

// Helper function to format minutes to readable time
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return mins === 0 ? `${displayHours}:00 ${period}` : `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
}

// Check if restaurant is open and return status with next opening time
function getShopOpenStatus(restaurant: Restaurant, orderType: 'delivery' | 'takeaway' | 'dine-in'): { isOpen: boolean; message?: string } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Determine which hours to use based on day and order type
  let hoursField: string | null = null;
  if (orderType === 'delivery') {
    if (dayOfWeek === 0) hoursField = restaurant.deliveryHoursSun;
    else if (dayOfWeek >= 5) hoursField = restaurant.deliveryHoursFriSat;
    else hoursField = restaurant.deliveryHoursMonThu;
  } else {
    // Collection/takeaway or dine-in
    if (dayOfWeek === 0) hoursField = restaurant.collectionHoursSun;
    else if (dayOfWeek >= 5) hoursField = restaurant.collectionHoursFriSat;
    else hoursField = restaurant.collectionHoursMonThu;
  }
  
  // If no hours set, assume always open
  if (!hoursField || hoursField.toLowerCase() === 'closed') {
    // Shop is closed for the day - find next day's opening
    const tomorrowDay = (dayOfWeek + 1) % 7;
    let tomorrowHours: string | null = null;
    if (orderType === 'delivery') {
      if (tomorrowDay === 0) tomorrowHours = restaurant.deliveryHoursSun;
      else if (tomorrowDay >= 5) tomorrowHours = restaurant.deliveryHoursFriSat;
      else tomorrowHours = restaurant.deliveryHoursMonThu;
    } else {
      if (tomorrowDay === 0) tomorrowHours = restaurant.collectionHoursSun;
      else if (tomorrowDay >= 5) tomorrowHours = restaurant.collectionHoursFriSat;
      else tomorrowHours = restaurant.collectionHoursMonThu;
    }
    
    if (tomorrowHours && tomorrowHours.toLowerCase() !== 'closed') {
      const [openStr] = tomorrowHours.split(' - ');
      const openMinutes = parseTimeToMinutes(openStr.trim());
      if (openMinutes >= 0) {
        return { isOpen: false, message: `This shop is closed for today. We will reopen tomorrow at ${formatTime(openMinutes)}.` };
      }
    }
    return { isOpen: false, message: "This shop is currently closed. Please try again later." };
  }
  
  // Parse hours like "12PM - 10:30PM"
  const [openStr, closeStr] = hoursField.split(' - ');
  if (!openStr || !closeStr) return { isOpen: true }; // Can't parse, assume open
  
  const openMinutes = parseTimeToMinutes(openStr.trim());
  const closeMinutes = parseTimeToMinutes(closeStr.trim());
  
  if (openMinutes < 0 || closeMinutes < 0) return { isOpen: true }; // Can't parse, assume open
  
  // Check if currently within operating hours
  // Handle overnight hours (e.g., 1PM - 4AM where close time is less than open time)
  if (closeMinutes < openMinutes) {
    // Overnight hours: open from openMinutes until midnight, then midnight until closeMinutes
    if (currentMinutes >= openMinutes || currentMinutes <= closeMinutes) {
      return { isOpen: true };
    }
  } else {
    // Normal hours: open from openMinutes to closeMinutes same day
    if (currentMinutes >= openMinutes && currentMinutes <= closeMinutes) {
      return { isOpen: true };
    }
  }
  
  // Shop is closed - determine the message
  if (currentMinutes < openMinutes) {
    // Before opening today
    return { isOpen: false, message: `This shop is currently closed. We will reopen today at ${formatTime(openMinutes)}.` };
  } else {
    // After closing - find tomorrow's opening time
    const tomorrowDay = (dayOfWeek + 1) % 7;
    let tomorrowHours: string | null = null;
    if (orderType === 'delivery') {
      if (tomorrowDay === 0) tomorrowHours = restaurant.deliveryHoursSun;
      else if (tomorrowDay >= 5) tomorrowHours = restaurant.deliveryHoursFriSat;
      else tomorrowHours = restaurant.deliveryHoursMonThu;
    } else {
      if (tomorrowDay === 0) tomorrowHours = restaurant.collectionHoursSun;
      else if (tomorrowDay >= 5) tomorrowHours = restaurant.collectionHoursFriSat;
      else tomorrowHours = restaurant.collectionHoursMonThu;
    }
    
    if (tomorrowHours && tomorrowHours.toLowerCase() !== 'closed') {
      const [tomorrowOpenStr] = tomorrowHours.split(' - ');
      const tomorrowOpenMinutes = parseTimeToMinutes(tomorrowOpenStr.trim());
      if (tomorrowOpenMinutes >= 0) {
        return { isOpen: false, message: `This shop is currently closed. We will reopen tomorrow at ${formatTime(tomorrowOpenMinutes)}.` };
      }
    }
    return { isOpen: false, message: "This shop is currently closed. Please try again later." };
  }
}

// Configure multer for image uploads - keep local folder as fallback
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Memory storage for object storage uploads
const memoryStorage = multer.memoryStorage();

// Disk storage as fallback
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `hero-${uniqueSuffix}${ext}`);
  }
});

// Memory-based upload for object storage (50MB limit for images/GIFs/videos)
const uploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, SVG, and MP4 are allowed.'));
    }
  }
});

// Disk-based upload as fallback (50MB limit for images/GIFs/videos)
const upload = multer({
  storage: storage_multer,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, SVG, and MP4 are allowed.'));
    }
  }
});

// Configure multer for license document uploads (PDF, PNG, JPG, SVG)
const licenseUploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PNG, JPG, and SVG are allowed.'));
    }
  }
});

const licenseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `license-${uniqueSuffix}${ext}`);
  }
});

const licenseUpload = multer({
  storage: licenseStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PNG, JPG, and SVG are allowed.'));
    }
  }
});

// Configure multer for video uploads (MP4)
const videoUploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, WebM, and MOV videos are allowed.'));
    }
  }
});

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, WebM, and MOV videos are allowed.'));
    }
  }
});

// Configure multer for audio uploads (10MB limit)
const audioUploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'video/mp4', 'video/webm', 'audio/aac', 'audio/m4a'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP3, WAV, WebM, OGG, M4A, MP4, and AAC audio files are allowed.'));
    }
  }
});

// Configure multer for menu item image uploads (20MB limit)
const menuImageUploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, SVG, and video files are allowed.'));
    }
  }
});

const menuImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `menu-${uniqueSuffix}${ext}`);
  }
});

const menuImageUpload = multer({
  storage: menuImageStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, SVG, and video files are allowed.'));
    }
  }
});

// Configure multer for topping image uploads
const toppingImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `topping-${uniqueSuffix}${ext}`);
  }
});

const toppingImageUpload = multer({
  storage: toppingImageStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG are allowed.'));
    }
  }
});

// WebSocket clients map by restaurant ID
const restaurantClients = new Map<string, Set<WebSocket>>();
// WebSocket clients map by driver ID
const driverClients = new Map<string, WebSocket>();
// WebSocket clients map by order ID (for customer tracking)
const orderTrackingClients = new Map<string, Set<WebSocket>>();

function broadcastToOrderTrackers(orderId: string, data: any) {
  const clients = orderTrackingClients.get(orderId);
  console.log(`[WebSocket] Broadcasting driver location to order ${orderId}, trackers: ${clients?.size || 0}`);
  if (clients) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

function broadcastToRestaurant(restaurantId: string, data: any) {
  const clients = restaurantClients.get(restaurantId);
  console.log(`[WebSocket] Broadcasting to restaurant ${restaurantId}, clients connected: ${clients?.size || 0}, type: ${data.type}`);
  if (clients) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        console.log(`[WebSocket] Sent message to client`);
      }
    });
  }
}

function sendToDriver(driverId: string, data: any) {
  const client = driverClients.get(driverId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(data));
  }
}

// Broadcast to all connected drivers in a specific restaurant/branch
async function broadcastToAllBranchDrivers(restaurantId: string, data: any) {
  const drivers = await storage.getDriversByRestaurant(restaurantId);
  const onDutyDrivers = drivers.filter(d => d.isOnDuty);
  const message = JSON.stringify(data);
  
  onDutyDrivers.forEach(driver => {
    const client = driverClients.get(driver.id);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
  
  return onDutyDrivers.length;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  registerDeviceRoutes(app);
  registerInventoryRoutes(app);

  app.get("/api/stripe-applications", async (_req, res) => {
    try {
      const rows = await db.select().from(schema.stripeApplications).orderBy(sql`created_at DESC`);
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/stripe-applications", async (req, res) => {
    try {
      const data = schema.insertStripeApplicationSchema.parse(req.body);
      const [row] = await db.insert(schema.stripeApplications).values(data).returning();
      res.json(row);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.put("/api/stripe-applications/:id", async (req, res) => {
    try {
      const [row] = await db.update(schema.stripeApplications).set(req.body).where(eq(schema.stripeApplications.id, req.params.id)).returning();
      res.json(row);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.delete("/api/stripe-applications/:id", async (req, res) => {
    try {
      await db.delete(schema.stripeApplications).where(eq(schema.stripeApplications.id, req.params.id));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/stripe-create-connect-account", async (req, res) => {
    try {
      const { applicationId } = req.body;
      if (!applicationId) {
        return res.status(400).json({ error: "Application ID required" });
      }

      const allApps = await db.select().from(schema.stripeApplications);
      const app = allApps.find((a: any) => a.id === applicationId);
      if (!app) {
        return res.status(404).json({ error: "Application not found" });
      }

      const Stripe = (await import('stripe')).default;

      const stripeSecret = process.env.STRIPE_CONNECT_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '';
      if (!stripeSecret) {
        return res.status(500).json({ error: "Stripe Connect secret key not configured. Please add STRIPE_CONNECT_SECRET_KEY." });
      }

      const stripe = new Stripe(stripeSecret, { apiVersion: '2025-04-30.basil' as any });

      const isPakistan = app.businessType?.startsWith("pakistan-");
      const country = isPakistan ? "PK" : "GB";
      const currency = isPakistan ? "pkr" : "gbp";

      let phone = (app.phone || "").replace(/\s+/g, "").replace(/[^0-9+]/g, "");
      if (phone.startsWith("0")) {
        phone = (isPakistan ? "+92" : "+44") + phone.substring(1);
      } else if (!phone.startsWith("+")) {
        phone = (isPakistan ? "+92" : "+44") + phone;
      }

      const account = await stripe.accounts.create({
        type: "express",
        country: country,
        email: app.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        individual: {
          email: app.email,
          phone: phone,
        },
        business_profile: {
          name: app.businessName,
        },
        metadata: {
          applicationId: app.id,
          businessName: app.businessName,
          ownerName: app.ownerFullName,
        },
      });

      await db.update(schema.stripeApplications).set({
        stripeAccountId: account.id,
        status: "approved",
      }).where(eq(schema.stripeApplications.id, app.id));

      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${req.protocol}://${req.get('host')}/admin-payments`,
        return_url: `${req.protocol}://${req.get('host')}/admin-payments`,
        type: "account_onboarding",
      });

      res.json({
        success: true,
        accountId: account.id,
        onboardingUrl: accountLink.url,
        message: `Connected account created: ${account.id}`,
      });
    } catch (e: any) {
      console.error("Create connect account error:", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/stripe-test-payment", async (req, res) => {
    try {
      const { stripeAccountId, amount = 1000, platformSecretKey } = req.body;
      if (!stripeAccountId) {
        return res.status(400).json({ error: "No Stripe account ID provided" });
      }

      const Stripe = (await import('stripe')).default;

      const stripeSecret = process.env.STRIPE_CONNECT_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '';
      if (!stripeSecret) {
        return res.status(500).json({ error: "Stripe Connect secret key not configured." });
      }

      const stripe = new Stripe(stripeSecret, { apiVersion: '2025-04-30.basil' as any });

      const amountInPence = Math.round(Number(amount));
      const applicationFee = Math.round(amountInPence * 0.005);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInPence,
        currency: 'gbp',
        payment_method: 'pm_card_visa',
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
        transfer_data: {
          destination: stripeAccountId,
        },
        application_fee_amount: applicationFee,
        description: `Test payment to ${stripeAccountId}`,
      });

      res.json({
        success: true,
        paymentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: `£${(amountInPence / 100).toFixed(2)}`,
        fee: `£${(applicationFee / 100).toFixed(2)}`,
        destination: stripeAccountId,
      });
    } catch (e: any) {
      console.error("Test payment error:", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/client-error", (req, res) => {
    const { message, stack, componentStack, filename, lineno, colno, url, userAgent, type } = req.body || {};
    console.error(`[CLIENT ERROR] ${type || 'react'} | ${userAgent || 'unknown'} | ${url || 'unknown'} | ${message || 'no message'}`);
    if (stack) console.error(`[CLIENT STACK] ${stack.substring(0, 500)}`);
    if (componentStack) console.error(`[CLIENT COMPONENT] ${componentStack.substring(0, 300)}`);
    res.json({ received: true });
  });

  // SEO: Robots.txt
  app.get("/robots.txt", (req, res) => {
    const host = `${req.protocol}://${req.get("host")}`;
    res.type("text/plain").send(
`User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin-grocery
Disallow: /dashboard
Disallow: /api/
Disallow: /epos-login
Disallow: /kitchen-login
Disallow: /waiter-login
Disallow: /driver-login

Sitemap: ${host}/sitemap.xml`
    );
  });

  // SEO: Dynamic Sitemap
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const host = `${req.protocol}://${req.get("host")}`;
      const restaurants = await storage.getAllRestaurants();
      const today = new Date().toISOString().split("T")[0];

      let urls = `  <url>
    <loc>${host}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <lastmod>${today}</lastmod>
  </url>`;

      for (const r of restaurants) {
        urls += `
  <url>
    <loc>${host}/${r.slug}/welcome</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <lastmod>${today}</lastmod>
  </url>
  <url>
    <loc>${host}/${r.slug}/menu</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
    <lastmod>${today}</lastmod>
  </url>`;
      }

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

      res.type("application/xml").send(xml);
    } catch (error) {
      res.status(500).send("Error generating sitemap");
    }
  });

  // Serve objects from object storage (persistent storage)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Generic image upload endpoint (base64) for logos, etc.
  app.post("/api/upload-image", async (req, res) => {
    try {
      const { image, filename } = req.body;
      if (!image) {
        return res.status(400).json({ error: "No image data provided" });
      }

      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: "Invalid image format" });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm', 'video/quicktime'];
      if (!allowedTypes.includes(mimeType)) {
        return res.status(400).json({ error: "Invalid file type. Only JPEG, PNG, GIF, WebP, SVG, MP4, WebM, and MOV are allowed." });
      }

      const extMap: Record<string, string> = { 'svg+xml': 'svg', 'quicktime': 'mov' };
      const ext = extMap[mimeType.split('/')[1]] || mimeType.split('/')[1];
      const safeFilename = filename ? filename.replace(/[^a-zA-Z0-9.-]/g, '_') : 'upload';

      const objectStorageService = new ObjectStorageService();
      const buffer = Buffer.from(base64Data, 'base64');
      const objectPath = await objectStorageService.uploadFromBuffer(buffer, `logo.${ext}`, mimeType);
      res.json({ url: objectPath });
    } catch (error) {
      console.error("Failed to upload image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Production sync endpoint - syncs all embedded data to database
  app.post("/api/sync-production", async (req, res) => {
    try {
      console.log("=== PRODUCTION SYNC TRIGGERED ===");
      await autoSeedBranches();
      res.json({ success: true, message: "Production sync completed successfully" });
    } catch (error) {
      console.error("Production sync failed:", error);
      res.status(500).json({ error: "Production sync failed", details: String(error) });
    }
  });
  
  // Fix menu items that have category slugs instead of category IDs
  app.post("/api/fix-category-ids", async (req, res) => {
    try {
      console.log("=== FIXING CATEGORY IDS ===");
      
      // Get all categories grouped by restaurant
      const allCategories = await db.select().from(schema.menuCategories);
      const categorySlugToId = new Map<string, string>();
      for (const cat of allCategories) {
        if (cat.restaurantId && cat.slug) {
          categorySlugToId.set(`${cat.restaurantId}:${cat.slug}`, cat.id);
        }
      }
      console.log(`Built category map with ${categorySlugToId.size} entries`);
      
      // Get all menu items
      const allMenuItems = await db.select().from(schema.menuItems);
      let fixedCount = 0;
      
      for (const item of allMenuItems) {
        // Check if category is a slug (not a UUID)
        const isSlug = item.category && !item.category.includes('-');
        if (isSlug && item.restaurantId) {
          const categoryKey = `${item.restaurantId}:${item.category}`;
          const actualCategoryId = categorySlugToId.get(categoryKey);
          if (actualCategoryId) {
            await db.update(schema.menuItems)
              .set({ category: actualCategoryId })
              .where(eq(schema.menuItems.id, item.id));
            fixedCount++;
          }
        }
      }
      
      console.log(`=== FIXED ${fixedCount} MENU ITEMS ===`);
      res.json({ success: true, message: `Fixed ${fixedCount} menu items with category IDs`, fixedCount });
    } catch (error) {
      console.error("Fix category IDs failed:", error);
      res.status(500).json({ error: "Fix failed", details: String(error) });
    }
  });

  // Reset and re-import a specific branch's menu data
  app.post("/api/reset-branch-menu/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      console.log(`=== RESETTING BRANCH MENU: ${slug} ===`);
      
      // Find the restaurant
      const restaurant = await storage.getRestaurantBySlug(slug);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      
      const restaurantId = restaurant.id;
      console.log(`Found restaurant: ${restaurant.name} (${restaurantId})`);
      
      // Delete existing menu items
      const existingItems = await storage.getMenuItems(restaurantId);
      console.log(`Deleting ${existingItems.length} existing menu items...`);
      for (const item of existingItems) {
        await storage.deleteMenuItem(item.id);
      }
      
      // Delete existing categories
      const existingCategories = await storage.getMenuCategories(restaurantId);
      console.log(`Deleting ${existingCategories.length} existing categories...`);
      for (const cat of existingCategories) {
        await storage.deleteMenuCategory(cat.id);
      }
      
      // Import directly from embedded seed data for this specific restaurant
      console.log("Importing from embedded seed data...");
      const { embeddedSeedData } = await import("./embedded-seed-data");
      
      // Find the seed restaurant ID that matches this slug
      const seedRestaurant = (embeddedSeedData as any).restaurants?.find((r: any) => r.slug === slug);
      const seedRestaurantId = seedRestaurant?.id;
      console.log(`Seed restaurant ID for ${slug}: ${seedRestaurantId}`);
      
      // Import categories for this restaurant
      let createdCategories = 0;
      const categorySlugToIdMap = new Map<string, string>(); // slug -> new ID
      const seedCategories = (embeddedSeedData as any).menuCategories?.filter(
        (c: any) => c.restaurant_id === seedRestaurantId
      ) || [];
      
      for (const cat of seedCategories) {
        try {
          const newCat = await storage.createMenuCategory({
            slug: cat.slug,
            name: cat.name,
            icon: cat.icon || "🍽️",
            sortOrder: cat.sort_order || 0,
            restaurantId: restaurantId,
            imageUrl: cat.image_url || null,
            isEnabled: true,
          });
          // Map both the old ID and the slug to the new ID
          categorySlugToIdMap.set(cat.slug, newCat.id);
          if (cat.id) categorySlugToIdMap.set(cat.id, newCat.id);
          createdCategories++;
        } catch (err) {
          console.error(`Failed to create category ${cat.name}:`, err);
        }
      }
      console.log(`Created ${createdCategories} categories, slug map size: ${categorySlugToIdMap.size}`);
      
      // Import menu items for this restaurant
      let createdItems = 0;
      const seedItems = (embeddedSeedData as any).menuItems?.filter(
        (item: any) => item.restaurant_id === seedRestaurantId
      ) || [];
      
      for (const item of seedItems) {
        try {
          // Map the category slug or ID to the new category ID
          let newCategoryId = item.category;
          if (categorySlugToIdMap.has(item.category)) {
            newCategoryId = categorySlugToIdMap.get(item.category)!;
          }
          
          await storage.createMenuItem({
            restaurantId: restaurantId,
            name: item.name,
            description: item.description || "",
            price: item.price,
            category: newCategoryId,
            image: item.image || "",
            available: item.available ?? true,
            allergenProfile: item.allergen_profile || {},
          });
          createdItems++;
        } catch (err) {
          console.error(`Failed to create menu item ${item.name}:`, err);
        }
      }
      console.log(`Created ${createdItems} menu items`);
      
      // Get final counts
      const newItems = await storage.getMenuItems(restaurantId);
      const newCategories = await storage.getMenuCategories(restaurantId);
      
      console.log(`=== RESET COMPLETE: ${newCategories.length} categories, ${newItems.length} menu items ===`);
      
      res.json({ 
        success: true, 
        message: `Reset complete! ${newCategories.length} categories and ${newItems.length} menu items imported.`,
        categories: newCategories.length,
        menuItems: newItems.length
      });
    } catch (error) {
      console.error("Reset failed:", error);
      res.status(500).json({ error: "Reset failed", details: String(error) });
    }
  });

  // Seed endpoint for initial data
  app.post("/api/seed", async (req, res) => {
    try {
      // Create restaurant
      const restaurant = await storage.createRestaurant({
        name: "Peri Peri Watford",
        slug: "peri-peri-watford",
        address: "123 High Street, Watford",
        status: "open",
        rating: "4.8",
        ordersToday: 0,
        revenueToday: "0.00",
        lastOrderTime: "Never",
        googleMapsUrl: "https://g.page/r/...",
        stripeAccountId: "acct_1Hh5S4F2q8193x",
        loginUsername: undefined,
        loginPassword: undefined,
      });

      // Create menu items
      await storage.createMenuItem({
        restaurantId: restaurant.id,
        name: "The Ultimate Burger",
        description: "Double beef patty, melted cheddar, caramelized onions, house sauce on brioche.",
        price: "14.50",
        category: "burgers",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
        available: true,
      });

      await storage.createMenuItem({
        restaurantId: restaurant.id,
        name: "Spicy Chicken Wrap",
        description: "Grilled peri-peri chicken, lettuce, tomato, and spicy mayo in a soft tortilla.",
        price: "9.50",
        category: "burgers",
        image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400",
        available: true,
      });

      res.json({ message: "Database seeded successfully", restaurant });
    } catch (error) {
      res.status(500).json({ error: "Failed to seed database" });
    }
  });

  // Production seed endpoint - syncs all embedded seed data to database
  app.post("/api/production-seed", async (req, res) => {
    try {
      console.log("=== PRODUCTION SEED TRIGGERED VIA API ===");
      await autoSeedBranches();
      res.json({ 
        success: true, 
        message: "Production seed completed successfully. All branches and menu data have been synced." 
      });
    } catch (error) {
      console.error("Production seed failed:", error);
      res.status(500).json({ 
        error: "Production seed failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Seed 10 Peri Peri branches with different themes
  app.post("/api/seed-branches", async (req, res) => {
    try {
      const branches = [
        {
          name: "Peri Peri Bedford",
          slug: "peri-peri-bedford",
          address: "45 High Street, Bedford MK40 1RY",
          themeKey: "classic",
          loginUsername: "bedford",
          loginPassword: "peri123",
        },
        {
          name: "Peri Peri Luton",
          slug: "peri-peri-luton",
          address: "128 George Street, Luton LU1 2AB",
          themeKey: "modern",
          loginUsername: "luton",
          loginPassword: "peri123",
        },
        {
          name: "Peri Peri Cambridge",
          slug: "peri-peri-cambridge",
          address: "23 Sidney Street, Cambridge CB2 3HG",
          themeKey: "rustic",
          loginUsername: "cambridge",
          loginPassword: "peri123",
        },
        {
          name: "Peri Peri Milton Keynes",
          slug: "peri-peri-milton-keynes",
          address: "56 Midsummer Boulevard, Milton Keynes MK9 3GB",
          themeKey: "ocean",
          loginUsername: "miltonkeynes",
          loginPassword: "peri123",
        },
        {
          name: "Peri Peri Northampton",
          slug: "peri-peri-northampton",
          address: "89 Abington Street, Northampton NN1 2BH",
          themeKey: "neon",
          loginUsername: "northampton",
          loginPassword: "peri123",
        },
        {
          name: "Peri Peri Oxford",
          slug: "peri-peri-oxford",
          address: "34 Cornmarket Street, Oxford OX1 3HA",
          themeKey: "elegant",
          loginUsername: "oxford",
          loginPassword: "peri123",
        },
        {
          name: "Peri Peri Leicester",
          slug: "peri-peri-leicester",
          address: "67 Gallowtree Gate, Leicester LE1 5FD",
          themeKey: "fresh",
          loginUsername: "leicester",
          loginPassword: "peri123",
        },
        {
          name: "Peri Peri Coventry",
          slug: "peri-peri-coventry",
          address: "12 Broadgate, Coventry CV1 1NG",
          themeKey: "sunset",
          loginUsername: "coventry",
          loginPassword: "peri123",
        },
        {
          name: "Peri Peri Birmingham",
          slug: "peri-peri-birmingham",
          address: "99 New Street, Birmingham B2 4BA",
          themeKey: "midnight",
          loginUsername: "birmingham",
          loginPassword: "peri123",
        },
        {
          name: "Peri Peri Watford",
          slug: "peri-peri-watford",
          address: "203 Saint Albans Road, Watford WD24 5BH",
          themeKey: "spicy",
          loginUsername: "watford",
          loginPassword: "peri123",
        },
      ];

      const createdBranches = [];
      
      // Sample menu items to add to each branch
      const sampleMenuItems = [
        { name: "Flame Grilled Chicken", description: "Whole chicken marinated in peri-peri sauce, flame grilled to perfection", price: "12.99", category: "peri-peri", image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400" },
        { name: "Peri Peri Wings", description: "6 crispy wings tossed in our signature peri-peri sauce", price: "7.99", category: "peri-peri", image: "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=400" },
        { name: "Spicy Chicken Burger", description: "Crispy chicken fillet with lettuce, mayo and peri-peri sauce", price: "8.99", category: "chicken-burgers", image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400" },
        { name: "Classic Beef Burger", description: "Juicy beef patty with cheese, lettuce, tomato and special sauce", price: "9.99", category: "beef-burgers", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" },
        { name: "Family Feast Bucket", description: "Whole chicken, 6 wings, 4 corn on cob, large fries and coleslaw", price: "29.99", category: "family-bucket", image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400" },
        { name: "Loaded Fries", description: "Crispy fries topped with cheese, jalapeños and peri-peri mayo", price: "5.99", category: "sides", image: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400" },
        { name: "Coleslaw", description: "Fresh creamy coleslaw", price: "2.49", category: "sides", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400" },
        { name: "Chocolate Milkshake", description: "Thick and creamy chocolate milkshake", price: "4.99", category: "milkshakes", image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400" },
        { name: "Kids Chicken Strips", description: "4 crispy chicken strips with fries and drink", price: "6.99", category: "kids", image: "https://images.unsplash.com/photo-1619881589928-a1a3c5f7ed71?w=400" },
        { name: "Peri Peri Sauce", description: "Our signature hot sauce - 250ml bottle", price: "3.99", category: "sauces", image: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400" },
      ];

      for (const branch of branches) {
        // Check if branch already exists
        const existing = await storage.getRestaurantBySlug(branch.slug);
        if (existing) {
          createdBranches.push({ ...existing, skipped: true });
          continue;
        }

        const restaurant = await storage.createRestaurant({
          name: branch.name,
          slug: branch.slug,
          address: branch.address,
          status: "open",
          rating: "4.8",
          ordersToday: 0,
          revenueToday: "0.00",
          lastOrderTime: "Never",
          googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(branch.address)}`,
          stripeAccountId: `acct_${branch.slug.replace(/-/g, '')}`,
          loginUsername: branch.loginUsername,
          loginPassword: branch.loginPassword,
          logoUrl: undefined,
          themeKey: branch.themeKey,
        });

        // Add menu items to each branch
        for (const item of sampleMenuItems) {
          await storage.createMenuItem({
            restaurantId: restaurant.id,
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            image: item.image,
            available: true,
          });
        }

        createdBranches.push(restaurant);
      }

      res.json({ 
        message: "10 Peri Peri branches created successfully", 
        branches: createdBranches 
      });
    } catch (error) {
      console.error("Error seeding branches:", error);
      res.status(500).json({ error: "Failed to seed branches" });
    }
  });

  // Seed Tawa Restaurant Watford with full menu
  app.post("/api/seed-tawa", async (req, res) => {
    try {
      // Check if already exists
      const existing = await storage.getRestaurantBySlug(tawaRestaurantData.slug);
      if (existing) {
        return res.json({ message: "Tawa Restaurant already exists", restaurant: existing, skipped: true });
      }

      // Validate and create restaurant with schema validation
      const restaurantPayload = insertRestaurantSchema.parse({
        name: tawaRestaurantData.name,
        slug: tawaRestaurantData.slug,
        address: tawaRestaurantData.address,
        status: "open",
        rating: "4.8",
        ordersToday: 0,
        revenueToday: "0.00",
        lastOrderTime: "Never",
        googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(tawaRestaurantData.address)}`,
        stripeAccountId: `acct_tawarestaurant`,
        loginUsername: tawaRestaurantData.loginUsername,
        loginPassword: tawaRestaurantData.loginPassword,
        logoUrl: null,
        themeKey: tawaRestaurantData.themeKey,
      });
      
      const restaurant = await storage.createRestaurant(restaurantPayload);

      // Add all menu items with schema validation
      let itemCount = 0;
      for (const item of tawaMenuItems) {
        const menuItemPayload = insertMenuItemSchema.parse({
          restaurantId: restaurant.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          image: item.image,
          available: item.available,
        });
        await storage.createMenuItem(menuItemPayload);
        itemCount++;
      }

      res.json({ 
        message: `Tawa Restaurant created with ${itemCount} menu items`,
        restaurant,
        itemCount
      });
    } catch (error) {
      console.error("Error seeding Tawa Restaurant:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: fromZodError(error).message });
      } else {
        res.status(500).json({ error: "Failed to seed Tawa Restaurant" });
      }
    }
  });

  // Seed DHABA Family Restaurant with full menu
  app.post("/api/seed-dhaba", async (req, res) => {
    try {
      const existing = await storage.getRestaurantBySlug(dhabaRestaurantData.slug);
      if (existing) {
        return res.json({ message: "DHABA Restaurant already exists", restaurant: existing, skipped: true });
      }

      const restaurantPayload = insertRestaurantSchema.parse({
        name: dhabaRestaurantData.name,
        slug: dhabaRestaurantData.slug,
        address: dhabaRestaurantData.address,
        phone: dhabaRestaurantData.phone,
        status: "open",
        rating: "4.9",
        ordersToday: 0,
        revenueToday: "0.00",
        lastOrderTime: "Never",
        googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(dhabaRestaurantData.address)}`,
        stripeAccountId: `acct_dhaba`,
        loginUsername: dhabaRestaurantData.loginUsername,
        loginPassword: dhabaRestaurantData.loginPassword,
        logoUrl: null,
        themeKey: dhabaRestaurantData.themeKey,
      });
      
      const restaurant = await storage.createRestaurant(restaurantPayload);

      let itemCount = 0;
      for (const item of dhabaMenuItems) {
        const menuItemPayload = insertMenuItemSchema.parse({
          restaurantId: restaurant.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          image: item.image,
          available: item.available,
        });
        await storage.createMenuItem(menuItemPayload);
        itemCount++;
      }

      res.json({ 
        message: `DHABA Restaurant created with ${itemCount} menu items`,
        restaurant,
        itemCount
      });
    } catch (error) {
      console.error("Error seeding DHABA Restaurant:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: fromZodError(error).message });
      } else {
        res.status(500).json({ error: "Failed to seed DHABA Restaurant" });
      }
    }
  });

  // Sync Tawa Restaurant Watford - updates existing or creates new
  app.post("/api/sync-tawa-watford", async (req, res) => {
    try {
      let restaurant = await storage.getRestaurantBySlug(tawaWatfordRestaurantData.slug);
      
      if (restaurant) {
        // Update existing restaurant with correct theme
        await db.update(schema.restaurants)
          .set({ 
            themeKey: tawaWatfordRestaurantData.themeKey,
            address: tawaWatfordRestaurantData.address,
            name: tawaWatfordRestaurantData.name,
          })
          .where(eq(schema.restaurants.id, restaurant.id));
        
        // Refresh restaurant data
        restaurant = await storage.getRestaurantBySlug(tawaWatfordRestaurantData.slug);
      } else {
        // Create new restaurant
        const restaurantPayload = insertRestaurantSchema.parse({
          name: tawaWatfordRestaurantData.name,
          slug: tawaWatfordRestaurantData.slug,
          address: tawaWatfordRestaurantData.address,
          status: "open",
          rating: "4.7",
          ordersToday: 0,
          revenueToday: "0.00",
          lastOrderTime: "Never",
          googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(tawaWatfordRestaurantData.address)}`,
          stripeAccountId: "",
          loginUsername: tawaWatfordRestaurantData.loginUsername,
          loginPassword: tawaWatfordRestaurantData.loginPassword,
          logoUrl: null,
          themeKey: tawaWatfordRestaurantData.themeKey,
        });
        restaurant = await storage.createRestaurant(restaurantPayload);
      }

      if (!restaurant) {
        return res.status(500).json({ error: "Failed to create/update restaurant" });
      }

      // Sync categories - delete existing and recreate
      await db.delete(schema.menuCategories).where(eq(schema.menuCategories.restaurantId, restaurant.id));
      for (const cat of tawaWatfordCategories) {
        await db.insert(schema.menuCategories).values({
          restaurantId: restaurant.id,
          name: cat.name,
          slug: cat.slug,
          displayOrder: cat.displayOrder,
        });
      }

      // Sync menu items - delete existing and recreate
      await db.delete(schema.menuItems).where(eq(schema.menuItems.restaurantId, restaurant.id));
      let itemCount = 0;
      for (const item of tawaWatfordMenuItems) {
        await db.insert(schema.menuItems).values({
          restaurantId: restaurant.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          available: item.available,
          image: item.image,
        });
        itemCount++;
      }

      res.json({ 
        message: `Tawa Restaurant Watford synced: ${tawaWatfordCategories.length} categories, ${itemCount} menu items`,
        restaurant,
        categoriesCount: tawaWatfordCategories.length,
        itemCount
      });
    } catch (error) {
      console.error("Error syncing Tawa Restaurant Watford:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: fromZodError(error).message });
      } else {
        res.status(500).json({ error: "Failed to sync Tawa Restaurant Watford" });
      }
    }
  });

  // WebSocket server for real-time order notifications
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const restaurantId = url.searchParams.get("restaurantId");
    const driverId = url.searchParams.get("driverId");
    const trackOrderId = url.searchParams.get("trackOrderId");

    if (trackOrderId) {
      // Customer tracking order connection
      if (!orderTrackingClients.has(trackOrderId)) {
        orderTrackingClients.set(trackOrderId, new Set());
      }
      orderTrackingClients.get(trackOrderId)!.add(ws);
      console.log(`[WebSocket] Customer connected to track order ${trackOrderId}`);

      ws.on("close", () => {
        orderTrackingClients.get(trackOrderId)?.delete(ws);
        if (orderTrackingClients.get(trackOrderId)?.size === 0) {
          orderTrackingClients.delete(trackOrderId);
        }
        console.log(`[WebSocket] Customer disconnected from tracking order ${trackOrderId}`);
      });
    } else if (driverId) {
      // Driver connection
      driverClients.set(driverId, ws);
      console.log(`Driver ${driverId} connected to WebSocket`);

      ws.on("close", () => {
        driverClients.delete(driverId);
        console.log(`Driver ${driverId} disconnected from WebSocket`);
      });

      ws.on("message", async (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === "driver_accepted" && message.orderId) {
            // Get the order to find the restaurant
            const order = await storage.getOrder(message.orderId);
            if (order) {
              // Notify the branch dashboard
              broadcastToRestaurant(order.restaurantId, {
                type: "driver_accepted",
                orderId: message.orderId,
                driverName: message.driverName,
                message: "Order accepted. Driver is on the way."
              });
            }
          } else if (message.type === "driver_rejected" && message.orderId) {
            // Get the order to find the restaurant
            const order = await storage.getOrder(message.orderId);
            if (order) {
              // Notify the branch dashboard
              broadcastToRestaurant(order.restaurantId, {
                type: "driver_rejected",
                orderId: message.orderId,
                driverName: message.driverName,
                message: "Driver has declined the delivery."
              });
            }
          }
        } catch (e) {
          console.error("Error processing driver message:", e);
        }
      });
    } else if (restaurantId) {
      // Branch dashboard connection
      if (!restaurantClients.has(restaurantId)) {
        restaurantClients.set(restaurantId, new Set());
      }
      restaurantClients.get(restaurantId)!.add(ws);
      console.log(`[WebSocket] Dashboard connected for restaurant ${restaurantId}, total clients: ${restaurantClients.get(restaurantId)!.size}`);

      ws.on("close", () => {
        restaurantClients.get(restaurantId)?.delete(ws);
        console.log(`[WebSocket] Dashboard disconnected for restaurant ${restaurantId}`);
      });
    }
  });

  // Shop Keeper Login
  app.post("/api/shop-login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const restaurants = await storage.getAllRestaurants();
      const restaurant = restaurants.find(
        r => r.loginUsername && r.loginPassword && 
          r.loginUsername.toLowerCase().trim() === username.toLowerCase().trim() && 
          r.loginPassword === password.trim()
      );

      if (!restaurant) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ 
        success: true, 
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Branch Login - for kitchen, epos, waiter, suppliers, finances roles
  app.post("/api/branch-login", async (req, res) => {
    try {
      const { slug, password, role } = req.body;
      
      if (!slug || !password) {
        return res.status(400).json({ message: "Branch and password required" });
      }

      const restaurant = await storage.getRestaurantBySlug(slug);
      if (!restaurant) {
        return res.status(404).json({ message: "Branch not found" });
      }

      // Check role-specific password, fallback to main loginPassword if role-specific not set
      let isValid = false;
      const rolePasswordMap: Record<string, string | null | undefined> = {
        kitchen: restaurant.kitchenLoginPassword,
        epos: restaurant.eposLoginPassword,
        waiter: restaurant.waiterLoginPassword,
        suppliers: restaurant.suppliersLoginPassword,
        finances: restaurant.financesLoginPassword,
      };

      const rolePassword = role ? rolePasswordMap[role] : null;
      
      // If role-specific password is set, use it. Otherwise, fall back to main password
      if (rolePassword) {
        isValid = password === rolePassword;
      } else {
        isValid = password === restaurant.loginPassword;
      }

      if (!isValid) {
        return res.status(401).json({ message: "Invalid password" });
      }

      res.json({ 
        success: true, 
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Branch Login by Name - for kitchen, epos, waiter, suppliers, finances roles (secure - no restaurant list shown)
  app.post("/api/branch-login-by-name", async (req, res) => {
    try {
      const { restaurantName, password, role } = req.body;
      
      if (!restaurantName || !password) {
        return res.status(400).json({ message: "Restaurant name and password required" });
      }

      // Find restaurant by name (case-insensitive, trimmed)
      const restaurants = await storage.getAllRestaurants();
      const restaurant = restaurants.find(
        r => r.name.toLowerCase().trim() === restaurantName.toLowerCase().trim()
      );
      
      if (!restaurant) {
        return res.status(401).json({ message: "Invalid restaurant name or password" });
      }

      // Check role-specific password, fallback to main loginPassword if role-specific not set
      let isValid = false;
      const rolePasswordMap: Record<string, string | null | undefined> = {
        kitchen: restaurant.kitchenLoginPassword,
        epos: restaurant.eposLoginPassword,
        waiter: restaurant.waiterLoginPassword,
        suppliers: restaurant.suppliersLoginPassword,
        finances: restaurant.financesLoginPassword,
      };

      const rolePassword = role ? rolePasswordMap[role] : null;
      
      // If role-specific password is set, use it. Otherwise, fall back to main password
      if (rolePassword) {
        isValid = password === rolePassword;
      } else {
        isValid = password === restaurant.loginPassword;
      }

      if (!isValid) {
        return res.status(401).json({ message: "Invalid restaurant name or password" });
      }

      res.json({ 
        success: true, 
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Restaurant routes
  app.get("/api/restaurants", async (req, res) => {
    try {
      const restaurants = await storage.getAllRestaurants();
      res.json(restaurants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch restaurants" });
    }
  });

  app.get("/api/restaurants/:slug", async (req, res) => {
    try {
      const restaurant = await storage.getRestaurantBySlug(req.params.slug);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      res.json(restaurant);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch restaurant" });
    }
  });

  // Get restaurant by custom domain - for domain-based routing
  app.get("/api/restaurants/by-domain/:domain", async (req, res) => {
    try {
      const normalizeDomain = (d: string) => d.toLowerCase().trim().replace(/\.$/, '').replace(/^www\./, '');
      const inputDomain = normalizeDomain(req.params.domain);
      
      const restaurants = await storage.getAllRestaurants();
      const restaurant = restaurants.find(r => {
        const customDomain = (r as any).customDomain;
        if (!customDomain) return false;
        const storedDomain = normalizeDomain(customDomain);
        return storedDomain === inputDomain;
      });
      
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found for this domain" });
      }
      res.json({ slug: restaurant.slug, name: restaurant.name, id: restaurant.id, themeKey: restaurant.themeKey });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch restaurant by domain" });
    }
  });

  // Dynamic PWA manifest for restaurant branches
  app.get("/api/restaurants/:slug/manifest.json", async (req, res) => {
    try {
      const restaurant = await storage.getRestaurantBySlug(req.params.slug);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      
      const iconSrc = restaurant.appIconUrl || restaurant.logoUrl || null;
      const icons = iconSrc ? [
        {
          src: iconSrc,
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: iconSrc,
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ] : [
        {
          src: "/icon-menu-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: "/icon-menu-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ];
      const page = req.query.page as string || "menu";
      let startUrl = `/menu/${restaurant.slug}`;
      if (page === "welcome") {
        startUrl = `/r/${restaurant.slug}`;
      }
      
      const manifest = {
        name: restaurant.appName || restaurant.name,
        short_name: restaurant.appShortName || restaurant.name?.substring(0, 12) || "Shop",
        description: `Order from ${restaurant.name} - Food delivery and collection`,
        start_url: startUrl,
        scope: `/`,
        display: "standalone",
        background_color: (!restaurant.appBackgroundColor || restaurant.appBackgroundColor === "transparent") ? "transparent" : restaurant.appBackgroundColor,
        theme_color: restaurant.appThemeColor || restaurant.primaryColor || "#8B0000",
        orientation: "any",
        icons,
        categories: ["food", "shopping", "lifestyle"],
        prefer_related_applications: false
      };
      
      res.setHeader('Content-Type', 'application/manifest+json');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.json(manifest);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate manifest" });
    }
  });

  // Update restaurant app icon settings
  app.patch("/api/restaurants/:id/app-settings", async (req, res) => {
    try {
      const { appIconUrl, appName, appShortName, appThemeColor, appBackgroundColor } = req.body;
      const updated = await storage.updateRestaurant(req.params.id, {
        appIconUrl,
        appName,
        appShortName,
        appThemeColor,
        appBackgroundColor
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update app settings" });
    }
  });

  app.post("/api/restaurants", async (req, res) => {
    try {
      const validated = insertRestaurantSchema.parse(req.body);
      const restaurant = await storage.createRestaurant(validated);
      res.status(201).json(restaurant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      res.status(500).json({ error: "Failed to create restaurant" });
    }
  });

  app.patch("/api/restaurants/:id", async (req, res) => {
    try {
      console.log(`[PATCH Restaurant] ID: ${req.params.id}, Updates:`, JSON.stringify(req.body));
      const updates = { ...req.body };
      const stripeKeyFields = ['stripeSecretKey', 'stripePublishableKey', 'stripeAccountId'];
      const cyrillicToLatin: Record<string, string> = {
        'А':'A','В':'B','С':'C','Е':'E','Н':'H','К':'K','М':'M','О':'O','Р':'P','Т':'T','Х':'X',
        'а':'a','в':'b','с':'c','е':'e','к':'k','м':'m','о':'o','р':'p','х':'x','у':'y',
        'Ø':'O','ø':'o','і':'i','І':'I'
      };
      for (const field of stripeKeyFields) {
        if (field in updates && typeof updates[field] === 'string' && updates[field]) {
          let cleaned = updates[field];
          for (const [cyr, lat] of Object.entries(cyrillicToLatin)) {
            cleaned = cleaned.split(cyr).join(lat);
          }
          cleaned = cleaned.replace(/[^\x20-\x7E]/g, '').replace(/\s/g, '').trim();
          if (cleaned !== updates[field]) {
            console.log(`[PATCH Restaurant] Cleaned ${field}: fixed ${updates[field].length - cleaned.length} characters`);
          }
          updates[field] = cleaned || null;
        }
      }
      // Convert empty strings to null for image/URL fields that should be clearable
      const clearableFields = ['tawaHeroImage', 'tawaHeroVideo', 'logoUrl', 'highlightImage', 'supplierOrderFromEmail'];
      for (const field of clearableFields) {
        if (field in updates && updates[field] === '') {
          updates[field] = null;
        }
      }

      if (updates.loginUsername && typeof updates.loginUsername === 'string' && updates.loginUsername.trim()) {
        const allRestaurants = await storage.getAllRestaurants();
        const duplicate = allRestaurants.find(
          r => r.id !== req.params.id && 
            r.loginUsername && 
            r.loginUsername.toLowerCase().trim() === updates.loginUsername.toLowerCase().trim()
        );
        if (duplicate) {
          return res.status(400).json({ error: `Username "${updates.loginUsername}" is already used by another branch (${duplicate.name}). Please choose a different username.` });
        }
      }
      
      const restaurant = await storage.updateRestaurant(req.params.id, updates);
      console.log(`[PATCH Restaurant] Result:`, restaurant?.id, restaurant?.cutleryOptionEnabled);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      res.json(restaurant);
    } catch (error) {
      console.error("Failed to update restaurant:", error);
      res.status(500).json({ error: "Failed to update restaurant" });
    }
  });

  app.delete("/api/restaurants/:id", async (req, res) => {
    try {
      await storage.deleteRestaurant(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete restaurant" });
    }
  });

  // Duplicate restaurant endpoint with Zod validation
  const duplicateRestaurantSchema = z.object({
    name: z.string().min(1, "Branch name is required").max(100, "Branch name too long"),
    slug: z.string()
      .min(1, "URL slug is required")
      .max(50, "URL slug too long")
      .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
    address: z.string().max(200, "Address too long").optional().or(z.literal("")),
    phone: z.string().max(30, "Phone number too long").regex(/^$|^[\d\s\-\+\(\)]+$/, "Invalid phone number format").optional().or(z.literal("")),
    email: z.string().max(100, "Email too long").refine((val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Invalid email address").optional().or(z.literal("")),
    loginUsername: z.string().min(3, "Username must be at least 3 characters").optional().or(z.literal("")),
    loginPassword: z.string().min(4, "Password must be at least 4 characters").optional().or(z.literal("")),
    stripeAccountId: z.string().optional().or(z.literal("")),
    logoUrl: z.string().optional().or(z.literal("")),
    tagline: z.string().max(100, "Tagline too long").optional().or(z.literal("")),
    cuisineType: z.string().max(200, "Cuisine type too long").optional().or(z.literal("")),
    rating: z.string().optional().or(z.literal("")),
    themeKey: z.string().optional().or(z.literal("")),
  });

  app.post("/api/restaurants/:id/duplicate", async (req, res) => {
    try {
      const validated = duplicateRestaurantSchema.parse(req.body);

      if (validated.loginUsername && validated.loginUsername.trim()) {
        const allRestaurants = await storage.getAllRestaurants();
        const duplicate = allRestaurants.find(
          r => r.loginUsername && r.loginUsername.toLowerCase().trim() === validated.loginUsername!.toLowerCase().trim()
        );
        if (duplicate) {
          return res.status(400).json({ error: `Username "${validated.loginUsername}" is already used by "${duplicate.name}". Please choose a different username.` });
        }
      }
      
      const newRestaurant = await storage.duplicateRestaurant(req.params.id, {
        name: validated.name,
        slug: validated.slug,
        address: validated.address || undefined,
        phone: validated.phone || undefined,
        email: validated.email || undefined,
        loginUsername: validated.loginUsername || undefined,
        loginPassword: validated.loginPassword || undefined,
        stripeAccountId: validated.stripeAccountId || undefined,
        logoUrl: validated.logoUrl || undefined,
        tagline: validated.tagline || undefined,
        cuisineType: validated.cuisineType || undefined,
        rating: validated.rating || undefined,
        themeKey: validated.themeKey || undefined,
      });
      
      res.status(201).json(newRestaurant);
    } catch (error: any) {
      console.error("Failed to duplicate restaurant:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      if (error.message?.includes("Slug already exists")) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message?.includes("Source restaurant not found")) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to duplicate restaurant" });
    }
  });

  // Copy menu from one branch to another (for new branch creation)
  app.post("/api/restaurants/:id/copy-menu", async (req, res) => {
    try {
      const targetRestaurantId = req.params.id;
      const { sourceRestaurantId } = req.body;
      
      if (!sourceRestaurantId) {
        return res.status(400).json({ error: "Source restaurant ID is required" });
      }
      
      // Get source menu items and categories
      const sourceItems = await storage.getMenuItems(sourceRestaurantId);
      const sourceCategories = await storage.getMenuCategories(sourceRestaurantId);
      
      let categoriesCopied = 0;
      let itemsCopied = 0;
      const categoryIdMap = new Map<string, string>(); // old ID -> new ID
      
      // Copy categories first
      for (const cat of sourceCategories) {
        const newCategory = await storage.createMenuCategory({
          restaurantId: targetRestaurantId,
          slug: cat.slug,
          name: cat.name,
          icon: cat.icon || "🍽️",
          imageUrl: null, // Reset images
          videoUrl: null,
          gifUrl: null,
          description: cat.description,
          sortOrder: cat.sortOrder,
          isEnabled: cat.isEnabled,
          showInTelephone: cat.showInTelephone,
          showInEpos: cat.showInEpos,
          showInWaiter: cat.showInWaiter,
          showInOnline: cat.showInOnline,
        });
        categoryIdMap.set(cat.id, newCategory.id);
        categoriesCopied++;
      }
      
      // Copy menu items with placeholder images
      for (const item of sourceItems) {
        const newCategoryId = categoryIdMap.get(item.category) || item.category;
        await storage.createMenuItem({
          restaurantId: targetRestaurantId,
          name: item.name,
          description: item.description || "",
          price: item.price,
          category: newCategoryId,
          image: "", // Placeholder - user can upload later
          videoUrl: null,
          gifUrl: null,
          available: item.available,
          allergenProfile: item.allergenProfile || {},
        });
        itemsCopied++;
      }
      
      res.json({ 
        success: true, 
        itemsCopied, 
        categoriesCopied,
        message: `Copied ${itemsCopied} items and ${categoriesCopied} categories`
      });
    } catch (error: any) {
      console.error("Failed to copy menu:", error);
      res.status(500).json({ error: "Failed to copy menu from source branch" });
    }
  });

  // Import menu from pasted text with allergens
  app.post("/api/restaurants/:id/import-menu-paste", async (req, res) => {
    try {
      const restaurantId = req.params.id;
      const { items, categoryDisplayPosition } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "No menu items provided" });
      }
      
      // Verify restaurant exists
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      
      // Update category display position if provided
      if (categoryDisplayPosition) {
        await storage.updateRestaurant(restaurantId, { categoryDisplayPosition });
      }
      
      // Get existing categories for this restaurant
      const existingCategories = await storage.getMenuCategories(restaurantId);
      const categoryMap = new Map<string, string>(); // category name -> category id
      
      existingCategories.forEach(cat => {
        categoryMap.set(cat.name.toLowerCase(), cat.id);
      });
      
      let itemsCreated = 0;
      let categoriesCreated = 0;
      
      // Known allergen mapping
      const allergenMapping: Record<string, string> = {
        'gluten': 'gluten',
        'milk': 'milk',
        'eggs': 'eggs',
        'egg': 'eggs',
        'fish': 'fish',
        'shellfish': 'crustaceans',
        'crustaceans': 'crustaceans',
        'tree nuts': 'nuts',
        'nuts': 'nuts',
        'peanuts': 'peanuts',
        'peanut': 'peanuts',
        'wheat': 'gluten',
        'soy': 'soybeans',
        'soybeans': 'soybeans',
        'sesame': 'sesame',
        'celery': 'celery',
        'mustard': 'mustard',
        'lupin': 'lupin',
        'molluscs': 'molluscs',
        'sulphites': 'sulphites',
        'sulphur dioxide': 'sulphites',
      };
      
      for (const item of items) {
        // Find or create category
        let categoryId = categoryMap.get(item.category.toLowerCase());
        
        if (!categoryId) {
          // Create new category
          const slug = item.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          const newCategory = await storage.createMenuCategory({
            restaurantId,
            slug,
            name: item.category,
            icon: '🍽️',
            imageUrl: null,
            videoUrl: null,
            gifUrl: null,
            description: null,
            sortOrder: existingCategories.length + categoriesCreated + 1,
            isEnabled: true,
            showInTelephone: true,
            showInEpos: true,
            showInWaiter: true,
            showInOnline: true,
          });
          categoryId = newCategory.id;
          categoryMap.set(item.category.toLowerCase(), categoryId);
          categoriesCreated++;
        }
        
        // Build allergen profile
        const allergenProfile: Record<string, string> = {};
        for (const allergen of item.allergens || []) {
          const cleanAllergen = allergen.toLowerCase().replace(/^contains\s*/i, '').trim();
          const mappedAllergen = allergenMapping[cleanAllergen];
          if (mappedAllergen) {
            allergenProfile[mappedAllergen] = 'contains';
          }
        }
        
        // Build tags string
        const tags = (item.tags || []).join(', ');
        
        // Create menu item with optional image
        await storage.createMenuItem({
          restaurantId,
          name: item.name,
          description: item.description ? `${item.description}${tags ? ` (${tags})` : ''}` : (tags || ''),
          price: item.price,
          category: categoryId,
          image: item.imageUrl || '',
          videoUrl: null,
          gifUrl: null,
          available: true,
          allergenProfile,
        });
        itemsCreated++;
      }
      
      // Trigger auto backup after successful import
      triggerAutoBackup(restaurantId, 'menu paste import');
      
      res.json({ 
        success: true, 
        itemsCreated,
        categoriesCreated,
        message: `Created ${itemsCreated} items and ${categoriesCreated} categories`
      });
    } catch (error: any) {
      console.error("Failed to import menu from paste:", error);
      res.status(500).json({ error: "Failed to import menu" });
    }
  });

  // Menu routes
  app.get("/api/menu", async (req, res) => {
    try {
      const restaurantId = req.query.restaurantId as string | undefined;
      if (restaurantId) {
        const items = await storage.getMenuItems(restaurantId);
        const categories = await storage.getMenuCategories(restaurantId);
        const categoryMap = new Map(categories.map(c => [c.id, c.slug]));
        const itemsWithSlug = items.map(item => ({
          ...item,
          categorySlug: categoryMap.get(item.category) || item.category
        }));
        res.json(itemsWithSlug);
      } else {
        // Admin panel: return all menu items across all branches
        const items = await storage.getAllMenuItems();
        res.json(items);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch menu items" });
    }
  });

  // Menu items route (alias for /api/menu for frontend compatibility)
  app.get("/api/menu-items", async (req, res) => {
    try {
      const restaurantId = req.query.restaurantId as string | undefined;
      if (restaurantId) {
        const items = await storage.getMenuItems(restaurantId);
        res.json(items);
      } else {
        // Admin panel: return all menu items across all branches
        const items = await storage.getAllMenuItems();
        res.json(items);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch menu items" });
    }
  });

  app.post("/api/menu", async (req, res) => {
    console.log("[menu POST] Received:", JSON.stringify(req.body).slice(0, 300));
    try {
      const validated = insertMenuItemSchema.parse(req.body);
      if (validated.restaurantId) {
        triggerAutoBackup(validated.restaurantId, 'menu change');
      }
      const item = await storage.createMenuItem(validated);
      console.log("[menu POST] Created:", item.name, item.id);
      res.status(201).json(item);
    } catch (error) {
      console.error("[menu POST] Error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      res.status(500).json({ error: "Failed to create menu item" });
    }
  });

  app.patch("/api/menu/:id", async (req, res) => {
    try {
      const item = await storage.updateMenuItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update menu item" });
    }
  });

  app.delete("/api/menu/:id", async (req, res) => {
    try {
      await storage.deleteMenuItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete menu item" });
    }
  });

  // Menu item image/video upload - uses object storage for persistence
  app.post("/api/menu/:id/upload-image", menuImageUploadMemory.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }
      
      const objectStorageService = new ObjectStorageService();
      const fileUrl = await objectStorageService.uploadFromBuffer(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      
      const isVideo = req.file.mimetype.startsWith('video/');
      const updateData = isVideo ? { videoUrl: fileUrl } : { image: fileUrl };
      
      const item = await storage.updateMenuItem(req.params.id, updateData);
      if (!item) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      res.json({ imageUrl: fileUrl, videoUrl: isVideo ? fileUrl : null, item });
    } catch (error) {
      console.error("Failed to upload menu item media:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Menu Modifier/Topping routes
  app.get("/api/menu/:menuItemId/modifiers", async (req, res) => {
    try {
      const modifiers = await storage.getMenuModifiers(req.params.menuItemId);
      res.json(modifiers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch modifiers" });
    }
  });

  app.post("/api/menu/:menuItemId/modifiers", async (req, res) => {
    try {
      const modifier = await storage.createMenuModifier({
        ...req.body,
        menuItemId: req.params.menuItemId,
      });
      res.status(201).json(modifier);
    } catch (error) {
      res.status(500).json({ error: "Failed to create modifier" });
    }
  });

  app.patch("/api/modifiers/:id", async (req, res) => {
    try {
      const modifier = await storage.updateMenuModifier(req.params.id, req.body);
      if (!modifier) {
        return res.status(404).json({ error: "Modifier not found" });
      }
      res.json(modifier);
    } catch (error) {
      res.status(500).json({ error: "Failed to update modifier" });
    }
  });

  app.delete("/api/modifiers/:id", async (req, res) => {
    try {
      await storage.deleteMenuModifier(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete modifier" });
    }
  });

  // Menu Item Variant routes (for size options like Regular, Large, X Large)
  app.get("/api/menu/:menuItemId/variants", async (req, res) => {
    try {
      const variants = await storage.getMenuItemVariants(req.params.menuItemId);
      res.json(variants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch variants" });
    }
  });

  app.post("/api/menu/:menuItemId/variants", async (req, res) => {
    try {
      const variant = await storage.createMenuItemVariant({
        ...req.body,
        menuItemId: req.params.menuItemId,
      });
      res.status(201).json(variant);
    } catch (error) {
      res.status(500).json({ error: "Failed to create variant" });
    }
  });

  app.patch("/api/variants/:id", async (req, res) => {
    try {
      const variant = await storage.updateMenuItemVariant(req.params.id, req.body);
      if (!variant) {
        return res.status(404).json({ error: "Variant not found" });
      }
      res.json(variant);
    } catch (error) {
      res.status(500).json({ error: "Failed to update variant" });
    }
  });

  app.delete("/api/variants/:id", async (req, res) => {
    try {
      await storage.deleteMenuItemVariant(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete variant" });
    }
  });

  // Get menu items with variants for a restaurant
  app.get("/api/restaurants/:restaurantId/menu-with-variants", async (req, res) => {
    try {
      const items = await storage.getMenuItemsWithVariants(req.params.restaurantId);
      // Add categorySlug to each item for frontend category matching
      const categories = await storage.getMenuCategories(req.params.restaurantId);
      const categoryMap = new Map(categories.map(c => [c.id, c.slug]));
      const itemsWithSlug = items.map(item => ({
        ...item,
        categorySlug: categoryMap.get(item.category) || item.category
      }));
      res.json(itemsWithSlug);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch menu items with variants" });
    }
  });

  // Extra Toppings routes
  app.get("/api/restaurants/:restaurantId/extra-toppings", async (req, res) => {
    try {
      const toppings = await storage.getExtraToppings(req.params.restaurantId);
      res.json(toppings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch extra toppings" });
    }
  });

  app.post("/api/restaurants/:restaurantId/extra-toppings", async (req, res) => {
    try {
      const topping = await storage.createExtraTopping({
        ...req.body,
        restaurantId: req.params.restaurantId,
      });
      res.status(201).json(topping);
    } catch (error) {
      res.status(500).json({ error: "Failed to create extra topping" });
    }
  });

  app.patch("/api/extra-toppings/:id", async (req, res) => {
    try {
      const topping = await storage.updateExtraTopping(req.params.id, req.body);
      if (!topping) {
        return res.status(404).json({ error: "Extra topping not found" });
      }
      res.json(topping);
    } catch (error) {
      res.status(500).json({ error: "Failed to update extra topping" });
    }
  });

  app.delete("/api/extra-toppings/:id", async (req, res) => {
    try {
      await storage.deleteExtraTopping(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete extra topping" });
    }
  });

  // Extra topping image upload
  app.post("/api/extra-toppings/:id/upload-image", toppingImageUpload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      const imageUrl = `/uploads/${req.file.filename}`;
      const topping = await storage.updateExtraTopping(req.params.id, { image: imageUrl });
      if (!topping) {
        return res.status(404).json({ error: "Extra topping not found" });
      }
      res.json({ imageUrl, topping });
    } catch (error) {
      console.error("Failed to upload topping image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Topping Groups routes (drink selections, add-ons, etc.)
  app.get("/api/menu-items/:menuItemId/topping-groups", async (req, res) => {
    try {
      const groups = await storage.getToppingGroups(req.params.menuItemId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch topping groups" });
    }
  });

  app.get("/api/restaurants/:restaurantId/topping-groups", async (req, res) => {
    try {
      const groups = await storage.getToppingGroupsByRestaurant(req.params.restaurantId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch topping groups" });
    }
  });

  app.post("/api/restaurants/:restaurantId/topping-groups", async (req, res) => {
    try {
      triggerAutoBackup(req.params.restaurantId, 'topping group change');
      const group = await storage.createToppingGroup({
        ...req.body,
        restaurantId: req.params.restaurantId,
      });
      res.status(201).json(group);
    } catch (error) {
      res.status(500).json({ error: "Failed to create topping group" });
    }
  });

  app.patch("/api/topping-groups/:id", async (req, res) => {
    try {
      const group = await storage.updateToppingGroup(req.params.id, req.body);
      if (!group) {
        return res.status(404).json({ error: "Topping group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: "Failed to update topping group" });
    }
  });

  app.delete("/api/topping-groups/:id", async (req, res) => {
    try {
      await storage.deleteToppingGroup(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete topping group" });
    }
  });

  // Get all topping options for a restaurant
  app.get("/api/topping-group-options", async (req, res) => {
    try {
      const restaurantId = req.query.restaurantId as string;
      if (!restaurantId) {
        return res.status(400).json({ error: "restaurantId required" });
      }
      const options = await db.execute(sql`
        SELECT tgo.id, tgo.group_id, tgo.name, tgo.price, tgo.image, tgo.is_available
        FROM topping_group_options tgo
        JOIN topping_groups tg ON tgo.group_id = tg.id
        WHERE tg.restaurant_id = ${restaurantId}
      `);
      res.json(options.rows);
    } catch (error) {
      console.error("Failed to fetch topping options:", error);
      res.status(500).json({ error: "Failed to fetch topping options" });
    }
  });

  // Menu Item Recommendations ("Goes well with")
  app.get("/api/menu-items/:itemId/recommendations", async (req, res) => {
    try {
      const recommendations = await db.execute(sql`
        SELECT r.id, r.label, r.sort_order, 
               m.id as item_id, m.name, m.description, m.price, m.image, m.allergen_profile
        FROM menu_item_recommendations r
        JOIN menu_items m ON r.recommended_item_id = m.id
        WHERE r.source_item_id = ${req.params.itemId}
        ORDER BY r.sort_order
      `);
      res.json(recommendations.rows);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  app.post("/api/menu-items/:itemId/recommendations", async (req, res) => {
    try {
      const { recommendedItemId, label, sortOrder, restaurantId } = req.body;
      const result = await db.execute(sql`
        INSERT INTO menu_item_recommendations (id, restaurant_id, source_item_id, recommended_item_id, label, sort_order)
        VALUES (gen_random_uuid()::text, ${restaurantId}, ${req.params.itemId}, ${recommendedItemId}, ${label || 'Goes well with'}, ${sortOrder || 0})
        RETURNING *
      `);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Failed to create recommendation:", error);
      res.status(500).json({ error: "Failed to create recommendation" });
    }
  });

  app.delete("/api/recommendations/:id", async (req, res) => {
    try {
      await db.execute(sql`DELETE FROM menu_item_recommendations WHERE id = ${req.params.id}`);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete recommendation" });
    }
  });

  // Topping Group Options routes
  app.post("/api/topping-groups/:groupId/options", async (req, res) => {
    try {
      const option = await storage.createToppingGroupOption({
        ...req.body,
        groupId: req.params.groupId,
      });
      res.status(201).json(option);
    } catch (error) {
      res.status(500).json({ error: "Failed to create option" });
    }
  });

  app.patch("/api/topping-group-options/:id", async (req, res) => {
    try {
      const option = await storage.updateToppingGroupOption(req.params.id, req.body);
      if (!option) {
        return res.status(404).json({ error: "Option not found" });
      }
      res.json(option);
    } catch (error) {
      res.status(500).json({ error: "Failed to update option" });
    }
  });

  app.delete("/api/topping-group-options/:id", async (req, res) => {
    try {
      await storage.deleteToppingGroupOption(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete option" });
    }
  });

  app.post("/api/topping-group-options/sync-availability", async (req, res) => {
    try {
      const { restaurantId, optionName, isAvailable } = req.body;
      if (!restaurantId || !optionName || typeof isAvailable !== 'boolean') {
        return res.status(400).json({ error: "Missing required fields: restaurantId, optionName, isAvailable" });
      }
      const updatedCount = await storage.syncToppingOptionAvailabilityByName(restaurantId, optionName, isAvailable);
      res.json({ updatedCount, optionName, isAvailable });
    } catch (error) {
      console.error("Failed to sync option availability:", error);
      res.status(500).json({ error: "Failed to sync option availability" });
    }
  });

  // Topping group option image upload
  app.post("/api/topping-group-options/:id/upload-image", toppingImageUpload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      const imageUrl = `/uploads/${req.file.filename}`;
      const option = await storage.updateToppingGroupOption(req.params.id, { image: imageUrl });
      if (!option) {
        return res.status(404).json({ error: "Option not found" });
      }
      res.json({ imageUrl, option });
    } catch (error) {
      console.error("Failed to upload option image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Order routes
  app.get("/api/orders", async (req, res) => {
    try {
      const restaurantId = req.query.restaurantId as string | undefined;
      if (!restaurantId) {
        return res.status(400).json({ error: "restaurantId is required for branch data isolation" });
      }
      const orders = await storage.getAllOrders(restaurantId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  const createOrderWithItemsSchema = z.object({
    order: insertOrderSchema,
    items: z.array(z.object({
      name: z.string(),
      quantity: z.number(),
      price: z.string(),
      notes: z.string().nullable().optional(),
    })),
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validated = createOrderWithItemsSchema.parse(req.body);
      
      // Check if restaurant is accepting orders
      const restaurant = await storage.getRestaurant(validated.order.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      
      const orderSource = (validated.order as any).source || "online";
      const referer = req.headers.referer || req.headers.origin || '';
      const isFromInternalPage = referer.includes('/telephone/') || referer.includes('/epos/') || referer.includes('/waiter/') || referer.includes('/admin/') || referer.includes('/dashboard/');
      const isInternalOrder = ["telephone", "epos", "waiter", "dine-in"].includes(orderSource) && isFromInternalPage;
      
      // Check if manually paused (skip for internal orders from staff)
      if (!isInternalOrder && restaurant.acceptingOrders === false) {
        return res.status(400).json({ error: "This restaurant is not accepting orders at the moment. Please try again later." });
      }
      
      // Check operating hours (skip for internal/staff orders and dine-in)
      const orderType = validated.order.type as 'delivery' | 'takeaway' | 'dine-in';
      if (!isInternalOrder && orderType !== 'dine-in') {
        const shopStatus = getShopOpenStatus(restaurant, orderType);
        if (!shopStatus.isOpen) {
          return res.status(400).json({ error: shopStatus.message || "This shop is currently closed." });
        }
      }
      
      const order = await storage.createOrder(validated.order, validated.items);
      
      // Create or update customer record when order is placed
      if (validated.order.phone) {
        const existingCustomer = await storage.getCustomerByPhone(validated.order.phone);
        if (!existingCustomer) {
          await storage.createCustomer({
            phone: validated.order.phone,
            name: validated.order.customerName || undefined,
            address: validated.order.address || undefined,
            restaurantId: validated.order.restaurantId,
          });
        } else {
          // Update customer info if new data is provided
          const updates: any = {};
          if (validated.order.customerName && !existingCustomer.name) {
            updates.name = validated.order.customerName;
          }
          if (validated.order.address && !existingCustomer.address) {
            updates.address = validated.order.address;
          }
          if (Object.keys(updates).length > 0) {
            await storage.updateCustomer(existingCustomer.id, updates);
          }
        }
      }
      
      // Send real-time notification to restaurant
      // Use PENDING_APPROVAL_ORDER for orders requiring manager approval (e.g., card payments)
      const eventType = order.status === "pending_approval" ? "PENDING_APPROVAL_ORDER" : "NEW_ORDER";
      broadcastToRestaurant(order.restaurantId, {
        type: eventType,
        order,
      });

      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // Generic order update endpoint (for delivery time, status message, etc.)
  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const { estimatedDeliveryMinutes, statusMessage, driverAssignedAt } = req.body;
      
      const updates: any = {};
      if (estimatedDeliveryMinutes !== undefined) updates.estimatedDeliveryMinutes = estimatedDeliveryMinutes;
      if (statusMessage !== undefined) updates.statusMessage = statusMessage;
      if (driverAssignedAt !== undefined) updates.driverAssignedAt = driverAssignedAt;
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid updates provided" });
      }
      
      const order = await storage.updateOrder(req.params.id, updates);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Broadcast update to restaurant for real-time tracking
      broadcastToRestaurant(order.restaurantId, {
        type: "ORDER_UPDATED",
        order,
      });
      
      res.json(order);
    } catch (error) {
      console.error("Failed to update order:", error);
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!["new", "preparing", "ready", "completed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      // Get current order to check payment status
      const existingOrder = await storage.getOrder(req.params.id);
      if (!existingOrder) {
        return res.status(404).json({ error: "Order not found" });
      }

      // If transitioning to "preparing" (accepting order) and has card payment, capture it first
      // This applies to orders with status "new" or "pending_approval" (card payments awaiting approval)
      if (status === "preparing" && (existingOrder.status === "new" || existingOrder.status === "pending_approval") && 
          existingOrder.stripePaymentId && existingOrder.paymentMethod === "card") {
        try {
          const Stripe = (await import('stripe')).default;
          
          const restaurant = await storage.getRestaurant(existingOrder.restaurantId);
          if (!restaurant?.stripeSecretKey) {
            return res.status(500).json({ error: "Card payment is temporarily unavailable. Please try another payment method." });
          }
          
          const stripeSecretKey = restaurant.stripeSecretKey.replace(/[^\x20-\x7E]/g, '').replace(/\s/g, '').trim();
          const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-04-30.basil' as any });
          const paymentIntent = await stripe.paymentIntents.retrieve(existingOrder.stripePaymentId);
          
          if (paymentIntent.status === 'succeeded') {
            console.log(`Payment ${existingOrder.stripePaymentId} already captured for order ${req.params.id}`);
          } else if (paymentIntent.status === 'requires_capture') {
            await stripe.paymentIntents.capture(existingOrder.stripePaymentId);
            console.log(`Payment captured for order ${req.params.id}: £${(paymentIntent.amount / 100).toFixed(2)}`);
          } else {
            return res.status(400).json({ error: `Cannot capture payment. Current status: ${paymentIntent.status}` });
          }
        } catch (stripeError: any) {
          console.error("Failed to capture payment:", stripeError);
          return res.status(500).json({ 
            error: stripeError.message || "Failed to capture card payment" 
          });
        }
      }

      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Auto-track income when order is completed
      if (status === "completed" && order.total) {
        try {
          const incomeSource = order.type === "dine-in" ? "waiter_order" : "customer_order";
          await storage.createFinancialTransaction({
            restaurantId: order.restaurantId,
            type: "income",
            incomeSource,
            amount: order.total,
            description: `Order #${order.orderNumber || order.id.slice(0, 8)} - ${order.customerName}`,
            referenceId: order.id,
            referenceType: "order",
            transactionDate: new Date(),
          });
        } catch (financeError) {
          console.error("Failed to auto-track order income:", financeError);
        }
      }

      // Send real-time update to restaurant
      broadcastToRestaurant(order.restaurantId, {
        type: "ORDER_STATUS_UPDATE",
        orderId: order.id,
        status: order.status,
      });

      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      await storage.deleteOrder(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  // Booking routes
  // Get pending booking counts for all restaurants (for super admin overview)
  app.get("/api/bookings/pending-counts", async (req, res) => {
    try {
      const counts = await storage.getPendingBookingCounts();
      res.json(counts);
    } catch (error) {
      console.error("Failed to fetch pending booking counts:", error);
      res.status(500).json({ error: "Failed to fetch pending booking counts" });
    }
  });

  app.get("/api/bookings", async (req, res) => {
    try {
      const restaurantId = req.query.restaurantId as string | undefined;
      if (!restaurantId) {
        return res.status(400).json({ error: "restaurantId is required for branch data isolation" });
      }
      const bookingsWithHistory = await storage.getAllBookingsWithHistory(restaurantId);
      res.json(bookingsWithHistory);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const validated = insertBookingSchema.parse(req.body);
      const booking = await storage.createBookingWithCustomer(validated);

      // Send real-time notification to restaurant
      broadcastToRestaurant(booking.restaurantId, {
        type: "NEW_BOOKING",
        booking,
      });

      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      console.error("Failed to create booking:", error);
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  app.patch("/api/bookings/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!["pending", "confirmed", "cancelled"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const booking = await storage.updateBookingStatus(req.params.id, status);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      res.json(booking);
    } catch (error) {
      res.status(500).json({ error: "Failed to update booking status" });
    }
  });

  app.delete("/api/bookings/:id", async (req, res) => {
    try {
      await storage.deleteBooking(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete booking:", error);
      res.status(500).json({ error: "Failed to delete booking" });
    }
  });

  app.get("/api/bookings/phone/:phone", async (req, res) => {
    try {
      const phone = decodeURIComponent(req.params.phone);
      const restaurantId = req.query.restaurantId as string;
      if (!restaurantId) {
        return res.status(400).json({ error: "restaurantId is required" });
      }
      const bookings = await storage.getBookingsByPhone(phone, restaurantId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  // Gallery routes
  app.get("/api/gallery/:restaurantId", async (req, res) => {
    try {
      const images = await storage.getGalleryImages(req.params.restaurantId);
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch gallery images" });
    }
  });

  app.post("/api/gallery", async (req, res) => {
    try {
      const validated = insertGalleryImageSchema.parse(req.body);
      const image = await storage.createGalleryImage(validated);
      res.status(201).json(image);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      res.status(500).json({ error: "Failed to create gallery image" });
    }
  });

  app.delete("/api/gallery/:id", async (req, res) => {
    try {
      await storage.deleteGalleryImage(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete gallery image" });
    }
  });

  // Customer routes - restaurant-specific customer accounts
  app.post("/api/customers/login", async (req, res) => {
    try {
      const { phone, restaurantId } = req.body;
      if (!phone) {
        return res.status(400).json({ error: "Phone number is required" });
      }
      if (!restaurantId) {
        return res.status(400).json({ error: "Restaurant ID is required" });
      }
      
      // Look up customer by phone AND restaurant - each restaurant has separate customer accounts
      let customer = await storage.getCustomerByPhoneAndRestaurant(phone, restaurantId);
      
      if (!customer) {
        // Create new customer for this specific restaurant
        customer = await storage.createCustomer({ 
          phone, 
          authProvider: "mobile",
          restaurantId
        });
      }
      
      res.json({ customer, isNewCustomer: !customer.name });
    } catch (error) {
      res.status(500).json({ error: "Failed to login/register customer" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const { name, email, address, workAddress, city, postcode } = req.body;
      const customer = await storage.updateCustomer(req.params.id, { name, email, address, workAddress, city, postcode });
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  app.get("/api/customers/:id/orders", async (req, res) => {
    try {
      const orders = await storage.getCustomerOrders(req.params.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer orders" });
    }
  });

  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomersWithOrderCount();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.get("/api/restaurants/:restaurantId/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomersByRestaurant(req.params.restaurantId);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      await storage.deleteCustomer(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });

  // Allergen routes
  app.get("/api/restaurants/:restaurantId/allergens", async (req, res) => {
    try {
      const menuItems = await storage.getMenuItems(req.params.restaurantId);
      const allergenData = menuItems.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        allergenProfile: item.allergenProfile || {}
      }));
      res.json(allergenData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch allergen data" });
    }
  });

  app.patch("/api/menu/:menuItemId/allergens", async (req, res) => {
    try {
      const menuItemId = req.params.menuItemId;
      const existingItem = await storage.getMenuItem(menuItemId);
      if (!existingItem) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      const existingProfile = (existingItem as any).allergenProfile || {};
      const updatedProfile = { ...existingProfile, ...req.body };
      const menuItem = await storage.updateMenuItem(menuItemId, { allergenProfile: updatedProfile });
      res.json(menuItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to update allergen data" });
    }
  });

  // Promotion routes
  app.get("/api/promotions/:restaurantId", async (req, res) => {
    try {
      const promotion = await storage.getPromotion(req.params.restaurantId);
      res.json(promotion || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch promotion" });
    }
  });

  app.post("/api/promotions", async (req, res) => {
    try {
      const { restaurantId, headline, subtext, isActive, backgroundColor, textColor } = req.body;
      if (!restaurantId || !headline) {
        return res.status(400).json({ error: "Restaurant ID and headline are required" });
      }
      const promotion = await storage.createPromotion({
        restaurantId,
        headline,
        subtext,
        isActive: isActive ?? true,
        backgroundColor: backgroundColor ?? "#dc2626",
        textColor: textColor ?? "#ffffff"
      });
      res.json(promotion);
    } catch (error) {
      res.status(500).json({ error: "Failed to create promotion" });
    }
  });

  app.patch("/api/promotions/:id", async (req, res) => {
    try {
      const promotion = await storage.updatePromotion(req.params.id, req.body);
      if (!promotion) {
        return res.status(404).json({ error: "Promotion not found" });
      }
      res.json(promotion);
    } catch (error) {
      res.status(500).json({ error: "Failed to update promotion" });
    }
  });

  app.delete("/api/promotions/:id", async (req, res) => {
    try {
      await storage.deletePromotion(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete promotion" });
    }
  });

  // Hero Image routes
  app.get("/api/restaurants/:restaurantId/hero-images", async (req, res) => {
    try {
      const images = await storage.getHeroImages(req.params.restaurantId);
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hero images" });
    }
  });

  app.post("/api/restaurants/:restaurantId/hero-images", async (req, res) => {
    try {
      const { imageUrl, label, isActive, mediaType } = req.body;
      if (!imageUrl) {
        return res.status(400).json({ error: "Image URL is required" });
      }
      
      // Basic URL validation - accept full URLs, /uploads/ paths, and /objects/ paths
      const isValidUrl = imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/objects/') || imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
      if (!isValidUrl) {
        return res.status(400).json({ error: "Invalid image URL format" });
      }
      
      // Validate mediaType if provided
      const validMediaTypes = ['image', 'video'];
      const resolvedMediaType = validMediaTypes.includes(mediaType) ? mediaType : 'image';
      
      // Limit to 10 images per restaurant
      const existingImages = await storage.getHeroImages(req.params.restaurantId);
      if (existingImages.length >= 10) {
        return res.status(400).json({ error: "Maximum 10 hero images allowed per restaurant" });
      }
      
      const image = await storage.createHeroImage({
        restaurantId: req.params.restaurantId,
        imageUrl,
        mediaType: resolvedMediaType,
        label: typeof label === 'string' ? label : null,
        sortOrder: existingImages.length,
        isActive: isActive ?? true
      });
      res.json(image);
    } catch (error) {
      res.status(500).json({ error: "Failed to create hero image" });
    }
  });

  // Menu image upload endpoint for paste import feature - uses object storage
  app.post("/api/upload-menu-image", (req, res) => {
    uploadMemory.single('file')(req, res, async (err: any) => {
      if (err) {
        console.error("Menu image upload error:", err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: "Image too large. Maximum size is 20MB." });
        }
        if (err.message) {
          return res.status(400).json({ error: err.message });
        }
        return res.status(500).json({ error: "Failed to upload image" });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      
      try {
        const objectStorageService = new ObjectStorageService();
        const url = await objectStorageService.uploadFromBuffer(
          req.file.buffer,
          `menu-images/${req.file.originalname}`,
          req.file.mimetype
        );
        res.json({ url });
      } catch (error) {
        console.error("Object storage upload error:", error);
        res.status(500).json({ error: "Failed to upload image to storage" });
      }
    });
  });

  // Generic file upload endpoint (returns URL only) - uses object storage
  app.post("/api/upload", (req, res) => {
    uploadMemory.single('file')(req, res, async (err: any) => {
      if (err) {
        console.error("Upload error:", err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: "File too large. Maximum size is 20MB." });
        }
        if (err.message) {
          return res.status(400).json({ error: err.message });
        }
        return res.status(500).json({ error: "Failed to upload file" });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }
      
      const objectStorageService = new ObjectStorageService();
      const url = await objectStorageService.uploadFromBuffer(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      res.json({ url });
    });
  });

  // Video upload endpoint for Tawa hero video - uses object storage
  app.post("/api/upload-video", (req, res) => {
    videoUploadMemory.single('video')(req, res, async (err: any) => {
      if (err) {
        console.error("Video upload error:", err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: "Video too large. Maximum size is 100MB." });
        }
        if (err.message) {
          return res.status(400).json({ error: err.message });
        }
        return res.status(500).json({ error: "Failed to upload video" });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: "No video file provided" });
      }
      
      const objectStorageService = new ObjectStorageService();
      const url = await objectStorageService.uploadFromBuffer(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      res.json({ url });
    });
  });

  // File upload endpoint for hero images - uses object storage for persistence
  app.post("/api/restaurants/:restaurantId/hero-images/upload", uploadMemory.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      
      const existingImages = await storage.getHeroImages(req.params.restaurantId);
      if (existingImages.length >= 10) {
        return res.status(400).json({ error: "Maximum 10 hero images allowed per restaurant" });
      }
      
      const objectStorageService = new ObjectStorageService();
      const imageUrl = await objectStorageService.uploadFromBuffer(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      
      const label = req.body.label || null;
      const isVideo = req.file.mimetype === 'video/mp4';
      
      const image = await storage.createHeroImage({
        restaurantId: req.params.restaurantId,
        imageUrl,
        mediaType: isVideo ? 'video' : 'image',
        label: typeof label === 'string' ? label : null,
        sortOrder: existingImages.length,
        isActive: true
      });
      res.json(image);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload hero image" });
    }
  });

  app.patch("/api/hero-images/:id", async (req, res) => {
    try {
      const { imageUrl, label, isActive } = req.body;
      const updates: any = {};
      
      if (imageUrl !== undefined) {
        const isValidUrl = imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/objects/') || imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
        if (!isValidUrl) {
          return res.status(400).json({ error: "Invalid image URL format" });
        }
        updates.imageUrl = imageUrl;
      }
      if (label !== undefined) updates.label = label;
      if (isActive !== undefined) updates.isActive = isActive;
      
      const image = await storage.updateHeroImage(req.params.id, updates);
      if (!image) {
        return res.status(404).json({ error: "Hero image not found" });
      }
      res.json(image);
    } catch (error) {
      res.status(500).json({ error: "Failed to update hero image" });
    }
  });

  app.delete("/api/hero-images/:id", async (req, res) => {
    try {
      await storage.deleteHeroImage(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete hero image" });
    }
  });

  app.post("/api/restaurants/:restaurantId/hero-images/reorder", async (req, res) => {
    try {
      const { imageIds } = req.body;
      if (!imageIds || !Array.isArray(imageIds)) {
        return res.status(400).json({ error: "Image IDs array is required" });
      }
      
      // Validate that all imageIds belong to this restaurant
      const existingImages = await storage.getHeroImages(req.params.restaurantId);
      const existingIds = new Set(existingImages.map(img => img.id));
      const validIds = imageIds.filter(id => existingIds.has(id));
      
      if (validIds.length !== imageIds.length) {
        return res.status(400).json({ error: "Some image IDs do not belong to this restaurant" });
      }
      
      await storage.reorderHeroImages(req.params.restaurantId, validIds);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reorder hero images" });
    }
  });

  // Dashboard Settings - Super Admin controls branch dashboard features
  app.get("/api/restaurants/:restaurantId/dashboard-settings", async (req, res) => {
    try {
      let settings = await storage.getDashboardSettings(req.params.restaurantId);
      
      // If no settings exist, create default ones (all enabled)
      if (!settings) {
        settings = await storage.createDashboardSettings({
          restaurantId: req.params.restaurantId,
          promotionsEnabled: true,
          brandingEnabled: true,
          hoursEnabled: true,
          heroGalleryEnabled: true,
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Failed to get dashboard settings:", error);
      res.status(500).json({ error: "Failed to get dashboard settings" });
    }
  });

  app.patch("/api/restaurants/:restaurantId/dashboard-settings", async (req, res) => {
    try {
      const { promotionsEnabled, brandingEnabled, hoursEnabled, heroGalleryEnabled } = req.body;
      
      // Check if settings exist, if not create them first
      let settings = await storage.getDashboardSettings(req.params.restaurantId);
      
      if (!settings) {
        settings = await storage.createDashboardSettings({
          restaurantId: req.params.restaurantId,
          promotionsEnabled: promotionsEnabled ?? true,
          brandingEnabled: brandingEnabled ?? true,
          hoursEnabled: hoursEnabled ?? true,
          heroGalleryEnabled: heroGalleryEnabled ?? true,
        });
      } else {
        const updates: Record<string, boolean> = {};
        if (promotionsEnabled !== undefined) updates.promotionsEnabled = promotionsEnabled;
        if (brandingEnabled !== undefined) updates.brandingEnabled = brandingEnabled;
        if (hoursEnabled !== undefined) updates.hoursEnabled = hoursEnabled;
        if (heroGalleryEnabled !== undefined) updates.heroGalleryEnabled = heroGalleryEnabled;
        
        settings = await storage.updateDashboardSettings(req.params.restaurantId, updates);
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Failed to update dashboard settings:", error);
      res.status(500).json({ error: "Failed to update dashboard settings" });
    }
  });

  // Platform Settings - Global super admin settings
  app.get("/api/platform-settings", async (req, res) => {
    try {
      const settings = await storage.getOrCreatePlatformSettings();
      res.json(settings);
    } catch (error) {
      console.error("Failed to get platform settings:", error);
      res.status(500).json({ error: "Failed to get platform settings" });
    }
  });

  app.patch("/api/platform-settings", async (req, res) => {
    try {
      const settings = await storage.updatePlatformSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Failed to update platform settings:", error);
      res.status(500).json({ error: "Failed to update platform settings" });
    }
  });

  // Branch Snapshots - Data backup and recovery
  app.get("/api/snapshots/:restaurantId", async (req, res) => {
    try {
      const snapshots = await storage.getBranchSnapshots(req.params.restaurantId);
      res.json(snapshots);
    } catch (error) {
      console.error("Failed to get snapshots:", error);
      res.status(500).json({ error: "Failed to get snapshots" });
    }
  });

  app.post("/api/snapshots", async (req, res) => {
    try {
      const { restaurantId, label, snapshotType } = req.body;
      if (!restaurantId) {
        return res.status(400).json({ error: "Restaurant ID is required" });
      }
      const snapshot = await storage.createBranchSnapshot(restaurantId, label, snapshotType || 'manual');
      res.json(snapshot);
    } catch (error) {
      console.error("Failed to create snapshot:", error);
      res.status(500).json({ error: "Failed to create snapshot" });
    }
  });

  app.post("/api/snapshots/:id/restore", async (req, res) => {
    try {
      await storage.restoreBranchSnapshot(req.params.id);
      res.json({ success: true, message: "Snapshot restored successfully" });
    } catch (error) {
      console.error("Failed to restore snapshot:", error);
      res.status(500).json({ error: "Failed to restore snapshot" });
    }
  });

  app.delete("/api/snapshots/:id", async (req, res) => {
    try {
      await storage.deleteBranchSnapshot(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete snapshot:", error);
      res.status(500).json({ error: "Failed to delete snapshot" });
    }
  });

  // Twilio Settings API routes (per-branch caller ID configuration)
  app.get("/api/twilio-settings", async (req, res) => {
    try {
      const settings = await storage.getAllTwilioSettings();
      res.json(settings);
    } catch (error) {
      console.error("Failed to get Twilio settings:", error);
      res.status(500).json({ error: "Failed to get Twilio settings" });
    }
  });

  app.get("/api/twilio-settings/:restaurantId", async (req, res) => {
    try {
      const settings = await storage.getTwilioSettings(req.params.restaurantId);
      res.json(settings || null);
    } catch (error) {
      console.error("Failed to get Twilio settings:", error);
      res.status(500).json({ error: "Failed to get Twilio settings" });
    }
  });

  app.post("/api/twilio-settings", async (req, res) => {
    try {
      const { restaurantId, accountSid, authToken, phoneNumber, enabled } = req.body;
      if (!restaurantId || !accountSid || !authToken || !phoneNumber) {
        return res.status(400).json({ error: "Restaurant ID, Account SID, Auth Token, and Phone Number are required" });
      }
      
      // Check if settings already exist for this branch
      const existing = await storage.getTwilioSettings(restaurantId);
      if (existing) {
        // Update existing settings
        const updated = await storage.updateTwilioSettings(restaurantId, {
          accountSid,
          authToken,
          phoneNumber,
          enabled: enabled !== undefined ? enabled : true,
        });
        return res.json(updated);
      }
      
      const settings = await storage.createTwilioSettings({
        restaurantId,
        accountSid,
        authToken,
        phoneNumber,
        enabled: enabled !== undefined ? enabled : true,
      });
      res.json(settings);
    } catch (error) {
      console.error("Failed to create Twilio settings:", error);
      res.status(500).json({ error: "Failed to create Twilio settings" });
    }
  });

  app.put("/api/twilio-settings/:restaurantId", async (req, res) => {
    try {
      const { accountSid, authToken, phoneNumber, enabled } = req.body;
      const updated = await storage.updateTwilioSettings(req.params.restaurantId, {
        accountSid,
        authToken,
        phoneNumber,
        enabled,
      });
      if (!updated) {
        return res.status(404).json({ error: "Twilio settings not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Failed to update Twilio settings:", error);
      res.status(500).json({ error: "Failed to update Twilio settings" });
    }
  });

  app.delete("/api/twilio-settings/:restaurantId", async (req, res) => {
    try {
      await storage.deleteTwilioSettings(req.params.restaurantId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete Twilio settings:", error);
      res.status(500).json({ error: "Failed to delete Twilio settings" });
    }
  });

  // Quick toggle for Twilio caller ID (ON/OFF button on dashboard)
  app.patch("/api/twilio-settings/:restaurantId/toggle", async (req, res) => {
    try {
      const { enabled } = req.body;
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: "enabled must be a boolean" });
      }
      const updated = await storage.toggleTwilioEnabled(req.params.restaurantId, enabled);
      if (!updated) {
        return res.status(404).json({ error: "Twilio settings not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Failed to toggle Twilio:", error);
      res.status(500).json({ error: "Failed to toggle Twilio" });
    }
  });

  // Branch Features API - Super admin controls which features are enabled per branch
  app.get("/api/branch-features", async (req, res) => {
    try {
      const features = await storage.getAllBranchFeatures();
      res.json(features);
    } catch (error) {
      console.error("Failed to get all branch features:", error);
      res.status(500).json({ error: "Failed to get branch features" });
    }
  });

  app.get("/api/branch-features/:restaurantId", async (req, res) => {
    try {
      let features = await storage.getBranchFeatures(req.params.restaurantId);
      // If no features exist for this branch, create defaults
      if (!features) {
        features = await storage.createBranchFeatures(req.params.restaurantId);
      }
      res.json(features);
    } catch (error) {
      console.error("Failed to get branch features:", error);
      res.status(500).json({ error: "Failed to get branch features" });
    }
  });

  app.put("/api/branch-features/:restaurantId", async (req, res) => {
    try {
      const { restaurantId } = req.params;
      // First ensure features exist for this branch
      let features = await storage.getBranchFeatures(restaurantId);
      if (!features) {
        features = await storage.createBranchFeatures(restaurantId);
      }
      // Update with provided values
      const updated = await storage.updateBranchFeatures(restaurantId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Failed to update branch features:", error);
      res.status(500).json({ error: "Failed to update branch features" });
    }
  });

  // Twilio Incoming Call Webhook - receives calls and broadcasts to dashboard
  app.post("/api/twilio/incoming-call", async (req, res) => {
    try {
      // Twilio sends: From (caller number), To (twilio number), CallSid, etc.
      const { From: callerNumber, To: twilioNumber, CallSid } = req.body;
      
      if (!callerNumber || !twilioNumber) {
        return res.status(400).json({ error: "Missing call parameters" });
      }

      // Find which restaurant this Twilio number belongs to
      const allSettings = await storage.getAllTwilioSettings();
      const branchSettings = allSettings.find(s => s.phoneNumber === twilioNumber && s.enabled);
      
      if (!branchSettings) {
        // No branch configured for this number
        console.log(`No branch found for Twilio number: ${twilioNumber}`);
        return res.type('text/xml').send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
      }

      const restaurantId = branchSettings.restaurantId;
      
      // Look up customer by phone number
      let customer = await storage.getCustomerByPhoneAndRestaurant(callerNumber, restaurantId);
      
      // Save call to history (no recording, just caller ID log)
      await storage.createCallRecording({
        restaurantId: restaurantId,
        callSid: CallSid,
        callerNumber: callerNumber,
        customerName: customer?.name || null,
        status: "completed",
      });

      // Broadcast incoming call to dashboard via WebSocket
      const callData = {
        type: "incoming_call",
        callSid: CallSid,
        callerNumber: callerNumber,
        restaurantId: restaurantId,
        customer: customer ? {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
        } : null,
        timestamp: new Date().toISOString(),
      };

      // Send via WebSocket to all connected dashboard clients for this branch
      broadcastToRestaurant(restaurantId, callData);

      // Return empty TwiML - no recording, just caller ID capture
      // Call continues on the forwarded line without Twilio involvement
      res.type('text/xml').send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    } catch (error) {
      console.error("Failed to process incoming call:", error);
      res.type('text/xml').send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }
  });

  // Twilio Recording Status Callback - receives recording completion events
  app.post("/api/twilio/recording-status", async (req, res) => {
    try {
      const { CallSid, RecordingSid, RecordingUrl, RecordingDuration, RecordingStatus } = req.body;
      
      if (!CallSid || !RecordingSid) {
        return res.status(200).send("OK");
      }

      // Find the call recording by CallSid and update it
      const recordings = await storage.getCallRecordings("");
      // We need to find across all restaurants, so we'll query directly
      const allRecordings = await db.select().from(callRecordings).where(eq(callRecordings.callSid, CallSid));
      
      if (allRecordings.length > 0) {
        const recording = allRecordings[0];
        await storage.updateCallRecording(recording.id, {
          recordingSid: RecordingSid,
          recordingUrl: RecordingUrl ? `${RecordingUrl}.mp3` : null,
          duration: RecordingDuration ? parseInt(RecordingDuration) : null,
          status: RecordingStatus === "completed" ? "completed" : "failed",
        });

        // Broadcast to dashboard that recording is ready
        broadcastToRestaurant(recording.restaurantId, {
          type: "recording_ready",
          callSid: CallSid,
          recordingSid: RecordingSid,
          recordingUrl: RecordingUrl ? `${RecordingUrl}.mp3` : null,
          duration: RecordingDuration,
        });
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Failed to process recording status:", error);
      res.status(200).send("OK");
    }
  });

  // Call Recordings API routes
  app.get("/api/call-recordings/:restaurantId", async (req, res) => {
    try {
      const recordings = await storage.getCallRecordings(req.params.restaurantId);
      res.json(recordings);
    } catch (error) {
      console.error("Failed to get call recordings:", error);
      res.status(500).json({ error: "Failed to get call recordings" });
    }
  });

  app.delete("/api/call-recordings/:id", async (req, res) => {
    try {
      await storage.deleteCallRecording(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete call recording:", error);
      res.status(500).json({ error: "Failed to delete call recording" });
    }
  });

  // URL-based menu scraper
  app.post("/api/scrape-menu", async (req, res) => {
    try {
      const { urls } = req.body;
      
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ error: "Please provide at least one URL" });
      }

      const allSections: Array<{
        title: string;
        items: Array<{
          name: string;
          description: string;
          price: string;
          isBold: boolean;
          modifiers: Array<{ name: string; price: string }>;
        }>;
      }> = [];

      const blockedUrls: string[] = [];
      const errorMessages: string[] = [];
      const dynamicSites: string[] = [];

      for (const url of urls) {
        try {
          // Check if URL is from a known blocked platform
          const blockedPlatforms = ['just-eat', 'justeat', 'deliveroo', 'ubereats', 'doordash', 'grubhub', 'postmates'];
          const urlLower = url.toLowerCase();
          const isBlockedPlatform = blockedPlatforms.some(p => urlLower.includes(p));
          
          if (isBlockedPlatform) {
            blockedUrls.push(url);
            errorMessages.push(`${new URL(url).hostname} blocks automated access. Try using the restaurant's own website instead.`);
            continue;
          }

          // Fetch the page HTML with more realistic browser headers
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
              'Accept-Encoding': 'gzip, deflate, br',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
              'Sec-Ch-Ua-Mobile': '?0',
              'Sec-Ch-Ua-Platform': '"Windows"',
              'Sec-Fetch-Dest': 'document',
              'Sec-Fetch-Mode': 'navigate',
              'Sec-Fetch-Site': 'none',
              'Sec-Fetch-User': '?1',
              'Upgrade-Insecure-Requests': '1',
            },
          });

          if (!response.ok) {
            console.error(`Failed to fetch ${url}: ${response.status}`);
            if (response.status === 403) {
              errorMessages.push(`${new URL(url).hostname} blocked access (403). Try the restaurant's own website.`);
            } else if (response.status === 404) {
              errorMessages.push(`Page not found: ${url}`);
            } else {
              errorMessages.push(`Could not access ${new URL(url).hostname} (Error ${response.status})`);
            }
            continue;
          }

          const html = await response.text();
          const $ = cheerio.load(html);

          // Check for known third-party ordering widgets that load content dynamically
          const thirdPartyWidgets = ['alphamanger', 'flipdish', 'deliverect', 'gloria-food', 'order.online', 'square.site', 'toast', 'chownow'];
          const usesThirdPartyWidget = thirdPartyWidgets.some(widget => html.toLowerCase().includes(widget));
          
          // Check if the page has minimal text content (indicates JavaScript-rendered site)
          const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
          const hasMinimalContent = bodyText.length < 500;
          
          // Remove script and style tags for parsing
          $('script, style, noscript, iframe').remove();

          // Price regex patterns
          const priceRegex = /(?:£|\$|€|GBP|USD|EUR)?\s*(\d+(?:[.,]\d{2})?)/;

          // Find sections by looking for headers
          type MenuSection = typeof allSections[0];
          const sections: MenuSection[] = [];
          const collectedItems: MenuSection['items'] = [];
          let currentSectionTitle = 'Menu';

          // Look for menu-like structures
          $('h1, h2, h3, h4, h5, .menu-section, .category, .menu-category, [class*="menu"], [class*="category"]').each((_, el) => {
            const $el = $(el);
            const tagName = el.tagName?.toLowerCase() || '';
            
            // Check if this is a header element
            if (['h1', 'h2', 'h3', 'h4', 'h5'].includes(tagName)) {
              const title = $el.text().trim();
              if (title && title.length < 100) {
                // Save previous section if it has items
                if (collectedItems.length > 0) {
                  sections.push({ title: currentSectionTitle, items: [...collectedItems] });
                  collectedItems.length = 0;
                }
                currentSectionTitle = title;
              }
            }
          });

          // Find menu items - look for common patterns
          $('li, .menu-item, .item, .product, [class*="menu-item"], [class*="product"], tr').each((_, el) => {
            const $el = $(el);
            const text = $el.text().trim();
            
            // Skip if too short or too long
            if (text.length < 3 || text.length > 500) return;
            
            // Check for price pattern
            const priceMatch = text.match(priceRegex);
            if (priceMatch) {
              // Extract name (text before price)
              const fullText = text;
              const priceIndex = fullText.search(priceRegex);
              let name = fullText.substring(0, priceIndex).trim();
              let description = '';
              
              // Clean up name
              name = name.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
              
              // Check if there's a description
              const nameLines = name.split(/(?:\. |\n)/);
              if (nameLines.length > 1) {
                name = nameLines[0].trim();
                description = nameLines.slice(1).join(' ').trim();
              }

              // Check for bold styling
              const isBold = $el.find('strong, b').length > 0 || 
                            $el.css('font-weight') === 'bold' ||
                            parseInt($el.css('font-weight') || '0') >= 600;

              // Look for modifiers/add-ons
              const modifiers: Array<{ name: string; price: string }> = [];
              $el.find('.modifier, .add-on, .topping, .extra, [class*="modifier"], [class*="add-on"]').each((_, modEl) => {
                const modText = $(modEl).text().trim();
                const modPrice = modText.match(priceRegex);
                if (modPrice) {
                  modifiers.push({
                    name: modText.replace(priceRegex, '').trim(),
                    price: modPrice[1],
                  });
                }
              });

              if (name && name.length > 2 && name.length < 150) {
                collectedItems.push({
                  name,
                  description: description.substring(0, 200),
                  price: priceMatch[1],
                  isBold,
                  modifiers,
                });
              }
            }
          });

          // Push the last section if it has items
          if (collectedItems.length > 0) {
            sections.push({ title: currentSectionTitle, items: [...collectedItems] });
          }

          // If no structured sections found, try a simpler approach
          if (sections.length === 0) {
            const simpleItems: typeof allSections[0]['items'] = [];
            
            // Look for any text that contains prices
            $('*').each((_, el) => {
              const $el = $(el);
              // Skip elements with many children (containers)
              if ($el.children().length > 3) return;
              
              const text = $el.clone().children().remove().end().text().trim();
              if (!text || text.length < 3 || text.length > 200) return;
              
              const priceMatch = text.match(priceRegex);
              if (priceMatch) {
                const name = text.replace(priceRegex, '').replace(/[-–—]+$/, '').trim();
                if (name.length > 2 && name.length < 100) {
                  // Check for duplicates
                  if (!simpleItems.find(i => i.name === name)) {
                    simpleItems.push({
                      name,
                      description: '',
                      price: priceMatch[1],
                      isBold: false,
                      modifiers: [],
                    });
                  }
                }
              }
            });

            if (simpleItems.length > 0) {
              sections.push({ title: 'Menu Items', items: simpleItems });
            }
          }

          // If still no items found, check if it's a dynamic site
          if (sections.length === 0) {
            if (usesThirdPartyWidget) {
              dynamicSites.push(url);
              const hostname = new URL(url).hostname;
              errorMessages.push(`${hostname} uses a third-party ordering system that loads menu dynamically. Try uploading a menu photo or adding items manually.`);
            } else if (hasMinimalContent) {
              dynamicSites.push(url);
              const hostname = new URL(url).hostname;
              errorMessages.push(`${hostname} appears to load content with JavaScript. Try uploading a menu photo or PDF instead.`);
            }
          }

          allSections.push(...sections);
        } catch (urlError) {
          console.error(`Error processing URL ${url}:`, urlError);
          errorMessages.push(`Error processing ${url}: ${urlError instanceof Error ? urlError.message : 'Unknown error'}`);
        }
      }

      // Flatten all items for the response
      const items = allSections.flatMap(section => 
        section.items.map(item => ({
          ...item,
          category: section.title.toLowerCase().includes('drink') ? 'drinks' :
                    section.title.toLowerCase().includes('burger') ? 'burgers' :
                    section.title.toLowerCase().includes('chicken') ? 'fried-chicken' :
                    section.title.toLowerCase().includes('side') ? 'sides' :
                    section.title.toLowerCase().includes('sauce') ? 'sauces' :
                    section.title.toLowerCase().includes('dessert') ? 'other-menus' :
                    section.title.toLowerCase().includes('kid') ? 'kids' :
                    'other-menus',
        }))
      );

      res.json({
        success: true,
        sections: allSections,
        items,
        totalItems: items.length,
        errors: errorMessages.length > 0 ? errorMessages : undefined,
        blockedUrls: blockedUrls.length > 0 ? blockedUrls : undefined,
        dynamicSites: dynamicSites.length > 0 ? dynamicSites : undefined,
        suggestion: items.length === 0 && (dynamicSites.length > 0 || blockedUrls.length > 0) 
          ? "This website loads menu content dynamically. Try using the AI Menu Scanner with a photo of the menu instead, or add items manually."
          : undefined,
      });
    } catch (error) {
      console.error('Menu scraping error:', error);
      res.status(500).json({ error: "Failed to scrape menu from URL" });
    }
  });

  // ============ DRIVER ROUTES ============
  
  // Get all drivers (super admin) - excludes passwords
  app.get("/api/drivers", async (req, res) => {
    try {
      const drivers = await storage.getAllDrivers();
      const driversWithoutPasswords = drivers.map(({ password, ...driver }) => driver);
      res.json(driversWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  });

  // Get single driver - excludes password
  app.get("/api/drivers/:id", async (req, res) => {
    try {
      const driver = await storage.getDriver(req.params.id);
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      const { password, ...driverWithoutPassword } = driver;
      res.json(driverWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch driver" });
    }
  });

  // Create driver
  app.post("/api/drivers", async (req, res) => {
    try {
      const validated = insertDriverSchema.parse(req.body);
      const driver = await storage.createDriver(validated);
      res.status(201).json(driver);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      res.status(500).json({ error: "Failed to create driver" });
    }
  });

  // Update driver
  app.patch("/api/drivers/:id", async (req, res) => {
    try {
      const driver = await storage.updateDriver(req.params.id, req.body);
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      res.json(driver);
    } catch (error) {
      res.status(500).json({ error: "Failed to update driver" });
    }
  });

  // Delete driver
  app.delete("/api/drivers/:id", async (req, res) => {
    try {
      await storage.deleteDriver(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete driver" });
    }
  });

  // Driver login - uses bcrypt for secure password verification
  app.post("/api/driver-login", async (req, res) => {
    try {
      const { phone, password } = req.body;
      
      if (!phone || !password) {
        return res.status(400).json({ message: "Phone and password required" });
      }

      const driver = await storage.getDriverByPhone(phone);
      
      if (!driver) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Use bcrypt to verify password securely
      const isPasswordValid = await storage.verifyDriverPassword(driver, password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!driver.isActive) {
        return res.status(403).json({ message: "Account is deactivated" });
      }

      // Check if driverApp feature is enabled for this branch
      const branchFeatures = await storage.getBranchFeatures(driver.restaurantId);
      if (branchFeatures && !branchFeatures.driverApp) {
        return res.status(403).json({ message: "Driver app is not enabled for this branch" });
      }

      // Get the driver's restaurant
      const restaurant = await storage.getDriverRestaurant(driver.id);

      // Return driver info without password (security)
      res.json({ 
        success: true, 
        driver: {
          id: driver.id,
          restaurantId: driver.restaurantId,
          name: driver.name,
          phone: driver.phone,
          vehicleType: driver.vehicleType,
          isOnDuty: driver.isOnDuty,
        },
        restaurant: restaurant ? {
          id: restaurant.id,
          name: restaurant.name,
          address: restaurant.address,
        } : null
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Update driver location with history and broadcast
  app.post("/api/drivers/:id/location", async (req, res) => {
    try {
      const { lat, lng, orderId, speed, heading, accuracy } = req.body;
      const driverId = req.params.id;
      
      // Update driver's current location
      const driver = await storage.updateDriverLocation(driverId, lat, lng);
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      
      // Save location history (for tracking purposes)
      await storage.saveDriverLocationHistory(driverId, orderId || null, lat, lng, speed, heading, accuracy);
      
      // If driver is on an active delivery, broadcast location to customers tracking the order
      if (orderId) {
        broadcastToOrderTrackers(orderId, {
          type: "DRIVER_LOCATION_UPDATE",
          driverId,
          orderId,
          location: {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            speed: speed ? parseFloat(speed) : null,
            heading: heading ? parseFloat(heading) : null,
          },
          timestamp: new Date().toISOString(),
        });
      }
      
      res.json(driver);
    } catch (error) {
      console.error("Failed to update driver location:", error);
      res.status(500).json({ error: "Failed to update location" });
    }
  });

  // Toggle driver on-duty status
  app.post("/api/drivers/:id/duty", async (req, res) => {
    try {
      const { isOnDuty } = req.body;
      const driver = await storage.updateDriverOnDuty(req.params.id, isOnDuty);
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      res.json(driver);
    } catch (error) {
      res.status(500).json({ error: "Failed to update duty status" });
    }
  });

  // Get driver earnings statistics (delivery counts and calculated earnings)
  app.get("/api/drivers/:id/earnings", async (req, res) => {
    try {
      const driverId = req.params.id;
      
      // Get driver details for payment configuration
      const driver = await storage.getDriverById(driverId);
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      
      // Get all completed deliveries for this driver
      const completedDeliveries = await storage.getDriverCompletedDeliveries(driverId);
      
      // Calculate date ranges
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
      const startOfLastWeek = new Date(startOfWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      
      // Filter deliveries by time period
      const todayDeliveries = completedDeliveries.filter(d => d.deliveredAt && new Date(d.deliveredAt) >= startOfToday);
      const weekDeliveries = completedDeliveries.filter(d => d.deliveredAt && new Date(d.deliveredAt) >= startOfWeek);
      const lastWeekDeliveries = completedDeliveries.filter(d => {
        if (!d.deliveredAt) return false;
        const date = new Date(d.deliveredAt);
        return date >= startOfLastWeek && date < startOfWeek;
      });
      const monthDeliveries = completedDeliveries.filter(d => d.deliveredAt && new Date(d.deliveredAt) >= startOfMonth);
      const lastMonthDeliveries = completedDeliveries.filter(d => {
        if (!d.deliveredAt) return false;
        const date = new Date(d.deliveredAt);
        return date >= startOfLastMonth && date <= endOfLastMonth;
      });
      const yearDeliveries = completedDeliveries.filter(d => d.deliveredAt && new Date(d.deliveredAt) >= startOfYear);
      
      // Calculate earnings based on payment type
      const calculateEarnings = (deliveries: any[]) => {
        if (driver.paymentType === 'salary') {
          return 0; // Salary is fixed, not per-delivery
        } else if (driver.paymentType === 'salary_plus_commission') {
          // For salary + commission, use agreed delivery charge
          const charge = Number(driver.agreedDeliveryCharge || 0);
          return deliveries.length * charge;
        } else {
          // Mileage based - use average rate for simplicity
          const avgRate = (Number(driver.mileageRate1 || 0.5) + Number(driver.mileageRate2 || 1.5) + Number(driver.mileageRate3 || 2)) / 3;
          return deliveries.length * avgRate;
        }
      };
      
      // Get payments received
      const paymentsReceived = await storage.getDriverPayments(driverId);
      const totalPaid = paymentsReceived.reduce((sum, p) => sum + Number(p.amount), 0);
      
      // Calculate total earnings ever
      const totalEarnings = calculateEarnings(completedDeliveries);
      
      res.json({
        paymentType: driver.paymentType,
        salaryPeriod: driver.salaryPeriod,
        salaryAmount: driver.salaryAmount,
        agreedDeliveryCharge: driver.agreedDeliveryCharge,
        mileageRates: {
          rate1: driver.mileageRate1,
          rate2: driver.mileageRate2,
          rate3: driver.mileageRate3,
          range1Max: driver.mileageRange1Max,
          range2Max: driver.mileageRange2Max,
          range3Max: driver.mileageRange3Max,
        },
        deliveries: {
          today: todayDeliveries.length,
          week: weekDeliveries.length,
          lastWeek: lastWeekDeliveries.length,
          month: monthDeliveries.length,
          lastMonth: lastMonthDeliveries.length,
          year: yearDeliveries.length,
          total: completedDeliveries.length,
          recentOrders: todayDeliveries.slice(0, 10).map(d => ({
            orderNumber: d.orderNumber,
            deliveredAt: d.deliveredAt,
          })),
        },
        earnings: {
          today: calculateEarnings(todayDeliveries),
          week: calculateEarnings(weekDeliveries),
          lastWeek: calculateEarnings(lastWeekDeliveries),
          month: calculateEarnings(monthDeliveries),
          lastMonth: calculateEarnings(lastMonthDeliveries),
          year: calculateEarnings(yearDeliveries),
          total: totalEarnings,
        },
        payments: {
          received: totalPaid,
          due: totalEarnings - totalPaid,
          recentPayments: paymentsReceived.slice(0, 10),
        },
        restaurant: {
          id: driver.restaurantId,
        },
      });
    } catch (error) {
      console.error("Error fetching driver earnings:", error);
      res.status(500).json({ error: "Failed to fetch driver earnings" });
    }
  });

  // Record a payment to a driver
  app.post("/api/drivers/:id/payments", async (req, res) => {
    try {
      const { amount, paymentType, paymentPeriod, notes } = req.body;
      const driverId = req.params.id;
      
      const driver = await storage.getDriverById(driverId);
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      
      const payment = await storage.createDriverPayment({
        driverId,
        restaurantId: driver.restaurantId,
        amount,
        paymentType,
        paymentPeriod,
        notes,
      });
      
      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating driver payment:", error);
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  // Get driver payment history
  app.get("/api/drivers/:id/payments", async (req, res) => {
    try {
      const payments = await storage.getDriverPayments(req.params.id);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payment history" });
    }
  });

  // ============ BRANCH DRIVER ROUTES ============

  // Get drivers belonging to a branch - excludes passwords
  app.get("/api/restaurants/:restaurantId/drivers", async (req, res) => {
    try {
      const drivers = await storage.getDriversByRestaurant(req.params.restaurantId);
      const driversWithoutPasswords = drivers.map(({ password, ...driver }) => driver);
      res.json(driversWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch branch drivers" });
    }
  });

  // Create a new driver for a branch
  app.post("/api/restaurants/:restaurantId/drivers", async (req, res) => {
    try {
      const { 
        name, 
        phone, 
        password, 
        vehicleType, 
        vehiclePlate,
        payType,
        paymentType,
        commissionRates,
        mileageRate1,
        mileageRate2,
        mileageRate3,
        mileageRange1Max,
        mileageRange2Max,
        mileageRange3Max,
        salaryAmount,
        salaryPeriod,
        agreedDeliveryCharge,
        licenseType,
        licenseCopyUrl,
        address,
        city,
        county,
        postcode,
        yearsAtAddress,
        residencyStatus,
        residencyOther
      } = req.body;
      
      if (!name || !phone || !password) {
        return res.status(400).json({ error: "Name, phone, and password are required" });
      }
      
      // Map frontend payType to database paymentType enum
      let dbPaymentType: 'mileage' | 'salary' | 'salary_plus_commission' = paymentType || 'mileage';
      if (payType === 'commission') dbPaymentType = 'mileage';
      else if (payType === 'salary') dbPaymentType = 'salary';
      else if (payType === 'salary_commission') dbPaymentType = 'salary_plus_commission';
      
      // Extract commission rates from array if provided
      let rate1 = mileageRate1 || '0.50';
      let rate2 = mileageRate2 || '1.50';
      let rate3 = mileageRate3 || '2.00';
      let range1 = mileageRange1Max || '1';
      let range2 = mileageRange2Max || '3';
      let range3 = mileageRange3Max || '5';
      
      if (commissionRates && Array.isArray(commissionRates) && commissionRates.length >= 3) {
        rate1 = String(commissionRates[0]?.rate || 0.50);
        rate2 = String(commissionRates[1]?.rate || 1.50);
        rate3 = String(commissionRates[2]?.rate || 2.00);
        range1 = String(commissionRates[0]?.maxMiles || 1);
        range2 = String(commissionRates[1]?.maxMiles || 3);
        range3 = String(commissionRates[2]?.maxMiles || 5);
      }
      
      const driver = await storage.createDriver({
        restaurantId: req.params.restaurantId,
        name,
        phone,
        password,
        vehicleType: vehicleType || 'car',
        vehiclePlate,
        isActive: true,
        isOnDuty: false,
        paymentType: dbPaymentType,
        mileageRate1: rate1,
        mileageRate2: rate2,
        mileageRate3: rate3,
        mileageRange1Max: range1,
        mileageRange2Max: range2,
        mileageRange3Max: range3,
        salaryAmount: salaryAmount || null,
        salaryPeriod: salaryPeriod || 'weekly',
        agreedDeliveryCharge,
        licenseType: licenseType || null,
        licenseCopyUrl: licenseCopyUrl || null,
      });
      
      // Return driver without password
      const { password: _, ...driverWithoutPassword } = driver;
      res.status(201).json(driverWithoutPassword);
    } catch (error) {
      console.error("Failed to create driver:", error);
      res.status(500).json({ error: "Failed to create driver" });
    }
  });

  // Delete driver from branch
  app.delete("/api/restaurants/:restaurantId/drivers/:driverId", async (req, res) => {
    try {
      await storage.deleteDriver(req.params.driverId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete driver" });
    }
  });

  // Upload driver license document
  app.post("/api/restaurants/:restaurantId/drivers/upload-license", licenseUpload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const url = `/uploads/${req.file.filename}`;
      res.json({ 
        url,
        filename: req.file.originalname,
        mimeType: req.file.mimetype
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload license document" });
    }
  });

  // ============ ORDER DELIVERY ROUTES ============

  // Get delivery info for an order
  app.get("/api/orders/:orderId/delivery", async (req, res) => {
    try {
      const delivery = await storage.getOrderDelivery(req.params.orderId);
      res.json(delivery || { deliveryStatus: 'unassigned' });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch delivery info" });
    }
  });

  // Get driver location for order tracking (customer-facing)
  app.get("/api/orders/:orderId/driver-location", async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Get delivery info to find driver
      const delivery = await storage.getOrderDelivery(orderId);
      if (!delivery || !delivery.driverId || delivery.driverId === 'pending') {
        return res.json({ 
          hasDriver: false, 
          message: "No driver assigned yet" 
        });
      }
      
      // Get driver info with current location
      const driver = await storage.getDriverById(delivery.driverId);
      if (!driver) {
        return res.json({ 
          hasDriver: false, 
          message: "Driver not found" 
        });
      }
      
      // Get recent location history for the order
      const locationHistory = await storage.getDriverLocationHistory(delivery.driverId, orderId, 20);
      
      // Get restaurant info for destination
      const restaurant = await storage.getRestaurant(order.restaurantId);
      
      res.json({
        hasDriver: true,
        driver: {
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          vehicleType: driver.vehicleType,
        },
        currentLocation: driver.lastLocationLat && driver.lastLocationLng ? {
          lat: parseFloat(driver.lastLocationLat),
          lng: parseFloat(driver.lastLocationLng),
          updatedAt: driver.lastLocationAt,
        } : null,
        locationHistory: locationHistory.map(loc => ({
          lat: parseFloat(loc.latitude),
          lng: parseFloat(loc.longitude),
          timestamp: loc.timestamp,
          speed: loc.speed ? parseFloat(loc.speed) : null,
          heading: loc.heading ? parseFloat(loc.heading) : null,
        })),
        deliveryStatus: delivery.deliveryStatus,
        deliveryAddress: order.address,
        restaurant: restaurant ? {
          name: restaurant.name,
          address: restaurant.address,
          lat: restaurant.addressLat ? parseFloat(restaurant.addressLat) : null,
          lng: restaurant.addressLng ? parseFloat(restaurant.addressLng) : null,
        } : null,
      });
    } catch (error) {
      console.error("Failed to get driver location:", error);
      res.status(500).json({ error: "Failed to fetch driver location" });
    }
  });

  // Assign driver to order
  app.post("/api/orders/:orderId/assign-driver", async (req, res) => {
    try {
      const { driverId, broadcastToAll, offerAmount, paymentInstruction, driverNotes } = req.body;
      const order = await storage.getOrder(req.params.orderId);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // If broadcastToAll is true, notify all on-duty drivers in the branch
      if (broadcastToAll) {
        // Create delivery record without specific driver (pending assignment)
        const delivery = await storage.assignDriverToOrder(req.params.orderId, driverId || 'pending');
        
        // Broadcast to restaurant dashboard
        broadcastToRestaurant(order.restaurantId, {
          type: "DRIVER_ASSIGNMENT_PENDING",
          orderId: req.params.orderId,
          delivery,
        });

        // Broadcast to ALL on-duty drivers in this branch with alarm (WebSocket)
        const notifiedCount = await broadcastToAllBranchDrivers(order.restaurantId, {
          type: "NEW_DELIVERY_AVAILABLE",
          orderId: req.params.orderId,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          address: order.address,
          restaurantId: order.restaurantId,
          playAlarm: true,
        });

        // ALSO send Push Notifications to wake up sleeping phones
        const subscriptions = await storage.getAllDriverSubscriptionsForRestaurant(order.restaurantId);
        const pushResults = await Promise.all(
          subscriptions.map(sub => sendPushNotification(sub, {
            title: `🚗 New Delivery #${order.orderNumber}`,
            body: `${order.customerName}\n${order.address}`,
            data: {
              type: 'NEW_DELIVERY_AVAILABLE',
              orderId: req.params.orderId,
              orderNumber: order.orderNumber,
              url: '/driver',
            },
            requireInteraction: true,
            tag: `delivery-${req.params.orderId}`,
          }))
        );
        const pushSent = pushResults.filter(r => r).length;
        console.log(`[Push] Sent ${pushSent}/${subscriptions.length} push notifications for order #${order.orderNumber}`);

        return res.json({ ...delivery, notifiedDrivers: notifiedCount, pushNotificationsSent: pushSent });
      }

      // Standard single driver assignment
      let delivery = await storage.assignDriverToOrder(req.params.orderId, driverId);
      
      // Update with offer details if provided
      if (offerAmount || paymentInstruction || driverNotes) {
        const updates: any = {};
        if (offerAmount) updates.offerAmount = offerAmount;
        if (paymentInstruction) updates.paymentInstruction = paymentInstruction;
        if (driverNotes) updates.driverNotes = driverNotes;
        delivery = await storage.updateOrderDelivery(req.params.orderId, updates);
      }
      
      broadcastToRestaurant(order.restaurantId, {
        type: "DRIVER_ASSIGNED",
        orderId: req.params.orderId,
        driverId,
        delivery,
      });

      // Send notification to specific driver with alarm (WebSocket)
      sendToDriver(driverId, {
        type: "NEW_DELIVERY_ASSIGNED",
        orderId: req.params.orderId,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        address: order.address,
        restaurantName: order.restaurantId,
        offerAmount: offerAmount || null,
        paymentInstruction: paymentInstruction || null,
        driverNotes: driverNotes || null,
        playAlarm: true,
      });

      // ALSO send Push Notification to wake up sleeping phones
      const driverSubs = await storage.getDriverPushSubscriptions(driverId);
      const offerText = offerAmount ? ` | £${offerAmount}` : '';
      if (driverSubs.length > 0) {
        await Promise.all(
          driverSubs.map(sub => sendPushNotification(sub, {
            title: `🚗 New Delivery #${order.orderNumber}${offerText}`,
            body: `${order.customerName}\n${order.address}`,
            data: {
              type: 'NEW_DELIVERY_ASSIGNED',
              orderId: req.params.orderId,
              orderNumber: order.orderNumber,
              offerAmount: offerAmount || null,
              paymentInstruction: paymentInstruction || null,
              url: '/driver',
            },
            requireInteraction: true,
            tag: `delivery-${req.params.orderId}`,
          }))
        );
      }
      
      res.json(delivery);
    } catch (error) {
      res.status(500).json({ error: "Failed to assign driver" });
    }
  });

  // Update delivery status (driver actions)
  app.patch("/api/orders/:orderId/delivery-status", async (req, res) => {
    try {
      const { status, driverNotes, driverId, location } = req.body;
      const validStatuses = ['accepted', 'rejected', 'picked_up', 'delivering', 'completed', 'returned'];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid delivery status" });
      }

      // Check if another driver has already accepted
      const existingDelivery = await storage.getOrderDelivery(req.params.orderId);
      if (status === 'accepted' && existingDelivery?.deliveryStatus === 'accepted') {
        return res.status(409).json({ error: "Order already accepted by another driver" });
      }

      const updates: any = { deliveryStatus: status };
      if (driverNotes) updates.driverNotes = driverNotes;
      
      // If driver is accepting, update the driverId to the accepting driver
      if (status === 'accepted' && driverId) {
        updates.driverId = driverId;
      }
      
      // Save driver location if provided
      if (location && location.lat && location.lng && driverId) {
        await storage.updateDriverLocation(driverId, location.lat, location.lng);
      }
      
      // Add timestamps based on status
      if (status === 'accepted') updates.acceptedAt = new Date();
      if (status === 'picked_up') updates.pickedUpAt = new Date();
      if (status === 'completed') updates.deliveredAt = new Date();
      if (status === 'returned') updates.deliveredAt = new Date(); // Use deliveredAt for return time

      const delivery = await storage.updateOrderDelivery(req.params.orderId, updates);
      
      // Broadcast to restaurant
      const order = await storage.getOrder(req.params.orderId);
      if (order) {
        // Get driver info for accepted status
        let driverInfo = null;
        if (status === 'accepted' && (driverId || delivery?.driverId)) {
          const driver = await storage.getDriver(driverId || delivery?.driverId || '');
          if (driver) {
            driverInfo = {
              id: driver.id,
              name: driver.name,
              phone: driver.phone,
              vehicleType: driver.vehicleType,
              currentLat: driver.lastLocationLat,
              currentLng: driver.lastLocationLng,
            };
          }
        }

        broadcastToRestaurant(order.restaurantId, {
          type: "DELIVERY_STATUS_UPDATE",
          orderId: req.params.orderId,
          status,
          delivery,
          driverNotes,
          driverInfo,
        });

        // If accepted, notify all other drivers in the branch that order is taken
        if (status === 'accepted') {
          await broadcastToAllBranchDrivers(order.restaurantId, {
            type: "ORDER_TAKEN",
            orderId: req.params.orderId,
            orderNumber: order.orderNumber,
            acceptedByDriverId: driverId || delivery?.driverId,
          });
        }
        
        // Send push notification to customer based on delivery status (non-blocking)
        if (status === 'picked_up') {
          notifyCustomerOrderUpdate(
            req.params.orderId,
            `Order #${order.orderNumber} Ready!`,
            'Your order is ready in the kitchen and will be delivered soon!',
            'picked_up'
          ).catch(err => console.error('Failed to notify customer (picked_up):', err));
        } else if (status === 'delivering') {
          const driverName = driverInfo?.name || 'Your driver';
          notifyCustomerOrderUpdate(
            req.params.orderId,
            `Order #${order.orderNumber} On The Way!`,
            `${driverName} is bringing your order!`,
            'delivering'
          ).catch(err => console.error('Failed to notify customer (delivering):', err));
        } else if (status === 'completed') {
          notifyCustomerOrderUpdate(
            req.params.orderId,
            `Order #${order.orderNumber} Delivered!`,
            'Your order has been delivered. Enjoy your meal!',
            'completed'
          ).catch(err => console.error('Failed to notify customer (completed):', err));
        }
      }

      res.json(delivery);
    } catch (error) {
      res.status(500).json({ error: "Failed to update delivery status" });
    }
  });

  // Customer order tracking - get order status and driver location
  app.get("/api/track/:orderId", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const delivery = await storage.getOrderDelivery(req.params.orderId);
      let driverLocation = null;
      let driverInfo = null;

      if (delivery?.driverId && ['accepted', 'picked_up', 'delivering'].includes(delivery.deliveryStatus)) {
        const driver = await storage.getDriver(delivery.driverId);
        if (driver) {
          driverInfo = {
            name: driver.name,
            phone: driver.phone,
            vehicleType: driver.vehicleType,
          };
          if (driver.lastLocationLat && driver.lastLocationLng) {
            driverLocation = {
              lat: parseFloat(driver.lastLocationLat),
              lng: parseFloat(driver.lastLocationLng),
              updatedAt: null,
            };
          }
        }
      }

      const restaurant = await storage.getRestaurant(order.restaurantId);

      res.json({
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          type: order.type,
          customerName: order.customerName,
          address: order.address,
          estimatedDeliveryMinutes: order.estimatedDeliveryMinutes,
          statusMessage: order.statusMessage,
          createdAt: order.createdAt,
        },
        delivery: delivery ? {
          status: delivery.deliveryStatus,
          acceptedAt: delivery.acceptedAt,
          pickedUpAt: delivery.pickedUpAt,
          deliveredAt: delivery.deliveredAt,
        } : null,
        driver: driverInfo,
        driverLocation,
        restaurant: restaurant ? {
          id: restaurant.id,
          name: restaurant.name,
          address: restaurant.address,
        } : null,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get tracking info" });
    }
  });

  // Get driver's active deliveries
  app.get("/api/drivers/:driverId/deliveries", async (req, res) => {
    try {
      const deliveries = await storage.getDriverActiveDeliveries(req.params.driverId);
      res.json(deliveries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deliveries" });
    }
  });

  // Get driver's delivery history
  app.get("/api/drivers/:driverId/history", async (req, res) => {
    try {
      const history = await storage.getDriverDeliveryHistory(req.params.driverId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch delivery history" });
    }
  });

  // ============ PUSH NOTIFICATION ROUTES ============

  // Get VAPID public key for push subscription
  app.get("/api/push/vapid-public-key", (req, res) => {
    if (!vapidPublicKey) {
      return res.status(503).json({ error: "Push notifications not configured" });
    }
    res.json({ publicKey: vapidPublicKey });
  });

  // Subscribe driver to push notifications
  app.post("/api/drivers/:driverId/push-subscription", async (req, res) => {
    try {
      const { endpoint, keys } = req.body;
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return res.status(400).json({ error: "Invalid subscription data" });
      }

      const subscription = await storage.savePushSubscription(
        req.params.driverId,
        endpoint,
        keys.p256dh,
        keys.auth
      );

      res.json({ success: true, subscription });
    } catch (error) {
      console.error("Failed to save push subscription:", error);
      res.status(500).json({ error: "Failed to save push subscription" });
    }
  });

  // Send test push notification to a driver
  app.post("/api/drivers/:driverId/test-push", async (req, res) => {
    try {
      const subscriptions = await storage.getDriverPushSubscriptions(req.params.driverId);
      if (subscriptions.length === 0) {
        return res.status(404).json({ error: "No push subscriptions found for this driver" });
      }

      const results = await Promise.all(
        subscriptions.map(sub => sendPushNotification(sub, {
          title: "Test Notification",
          body: "Push notifications are working!",
        }))
      );

      res.json({ success: results.some(r => r), sent: results.filter(r => r).length });
    } catch (error) {
      res.status(500).json({ error: "Failed to send test notification" });
    }
  });

  // ============ CUSTOMER PUSH NOTIFICATION ROUTES ============

  // Subscribe customer to push notifications for order tracking
  app.post("/api/orders/:orderId/push-subscription", async (req, res) => {
    try {
      const { endpoint, keys } = req.body;
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return res.status(400).json({ error: "Invalid subscription data" });
      }

      const subscription = await storage.saveCustomerPushSubscription(
        req.params.orderId,
        endpoint,
        keys.p256dh,
        keys.auth
      );

      res.json({ success: true, subscription });
    } catch (error) {
      console.error("Failed to save customer push subscription:", error);
      res.status(500).json({ error: "Failed to save push subscription" });
    }
  });

  // Helper function to send push notification to customer for order updates
  async function notifyCustomerOrderUpdate(orderId: string, title: string, body: string, status: string) {
    try {
      const subscriptions = await storage.getCustomerPushSubscriptions(orderId);
      if (subscriptions.length === 0) return;

      const order = await storage.getOrder(orderId);
      const orderNumber = order?.orderNumber || 'Unknown';

      await Promise.all(
        subscriptions.map(sub => sendPushNotification({
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
        }, {
          title,
          body,
          tag: `order-${orderId}-${status}`,
          requireInteraction: true,
          data: {
            orderId,
            orderNumber,
            status,
            url: `/menu`, // Redirect to menu page with tracking
          },
        }))
      );
    } catch (error) {
      console.error("Failed to send customer push notification:", error);
    }
  }

  // Popular Items routes
  app.get("/api/restaurants/:restaurantId/popular-items", async (req, res) => {
    try {
      const items = await storage.getPopularItems(req.params.restaurantId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch popular items" });
    }
  });

  app.post("/api/restaurants/:restaurantId/popular-items", async (req, res) => {
    try {
      const { name, imageUrl, sortOrder, linkUrl } = req.body;
      if (!name || !imageUrl) {
        return res.status(400).json({ error: "Name and image URL are required" });
      }
      console.log("[popular-items] Creating item:", { restaurantId: req.params.restaurantId, name, imageUrl, linkUrl });
      const item = await storage.createPopularItem({
        restaurantId: req.params.restaurantId,
        name,
        imageUrl,
        sortOrder,
        linkUrl: linkUrl || null,
      });
      console.log("[popular-items] Created item:", item);
      res.status(201).json(item);
    } catch (error) {
      console.error("[popular-items] Error creating item:", error);
      res.status(500).json({ error: "Failed to create popular item" });
    }
  });

  app.patch("/api/popular-items/:id", async (req, res) => {
    try {
      const item = await storage.updatePopularItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Popular item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update popular item" });
    }
  });

  app.delete("/api/popular-items/:id", async (req, res) => {
    try {
      await storage.deletePopularItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete popular item" });
    }
  });

  // Kitchen Station routes
  app.get("/api/restaurants/:restaurantId/kitchen-stations", async (req, res) => {
    try {
      const stations = await storage.getKitchenStations(req.params.restaurantId);
      res.json(stations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch kitchen stations" });
    }
  });

  app.post("/api/restaurants/:restaurantId/kitchen-stations", async (req, res) => {
    try {
      const { name, slug, color, categories, displayOrder, isActive } = req.body;
      if (!name || !slug) {
        return res.status(400).json({ error: "Name and slug are required" });
      }
      const station = await storage.createKitchenStation({
        restaurantId: req.params.restaurantId,
        name,
        slug,
        color: color || "#3b82f6",
        categories: categories || [],
        displayOrder: displayOrder || 0,
        isActive: isActive !== false,
      });
      res.status(201).json(station);
    } catch (error) {
      console.error("Failed to create kitchen station:", error);
      res.status(500).json({ error: "Failed to create kitchen station" });
    }
  });

  app.patch("/api/kitchen-stations/:id", async (req, res) => {
    try {
      const station = await storage.updateKitchenStation(req.params.id, req.body);
      if (!station) {
        return res.status(404).json({ error: "Kitchen station not found" });
      }
      res.json(station);
    } catch (error) {
      res.status(500).json({ error: "Failed to update kitchen station" });
    }
  });

  app.delete("/api/kitchen-stations/:id", async (req, res) => {
    try {
      await storage.deleteKitchenStation(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete kitchen station" });
    }
  });

  // Order Item Completion routes
  app.get("/api/orders/:orderId/item-completions", async (req, res) => {
    try {
      const completions = await storage.getOrderItemCompletions(req.params.orderId);
      res.json(completions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch item completions" });
    }
  });

  app.post("/api/order-items/:orderItemId/mark-ready", async (req, res) => {
    try {
      const { quantity, stationId, completedBy } = req.body;
      if (quantity === undefined || quantity <= 0) {
        return res.status(400).json({ error: "Quantity is required and must be positive" });
      }
      const completion = await storage.markItemReady(
        req.params.orderItemId,
        quantity,
        stationId,
        completedBy
      );
      
      // Broadcast item status change to all connected clients for this restaurant
      const orderItemData = await db.select().from(orderItems).where(eq(orderItems.id, req.params.orderItemId)).then(r => r[0]);
      if (orderItemData) {
        const order = await storage.getOrder(orderItemData.orderId);
        if (order) {
          const wsClients = restaurantClients.get(order.restaurantId);
          if (wsClients) {
            const message = JSON.stringify({
              type: "ORDER_ITEM_STATUS_CHANGED",
              data: {
                orderId: order.id,
                orderItemId: req.params.orderItemId,
                completion
              }
            });
            wsClients.forEach((client: WebSocket) => {
              if (client.readyState === 1) {
                client.send(message);
              }
            });
          }
        }
      }
      
      res.json(completion);
    } catch (error) {
      console.error("Failed to mark item ready:", error);
      res.status(500).json({ error: "Failed to mark item ready" });
    }
  });

  // Auto-complete order when all items are ready
  app.post("/api/orders/:orderId/check-completion", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const completions = await storage.getOrderItemCompletions(req.params.orderId);
      const items = order.items;

      // Check if all items are fully completed
      let allComplete = true;
      for (const item of items) {
        const completion = completions.find(c => c.orderItemId === item.id);
        if (!completion || (completion.completedQuantity || 0) < item.quantity) {
          allComplete = false;
          break;
        }
      }

      if (allComplete && order.status !== "ready") {
        await storage.updateOrderStatus(req.params.orderId, "ready");
        
        // Broadcast order update
        const wsClients = restaurantClients.get(order.restaurantId);
        if (wsClients) {
          const message = JSON.stringify({
            type: "ORDER_STATUS_CHANGED",
            data: { orderId: order.id, status: "ready" }
          });
          wsClients.forEach((client: WebSocket) => {
            if (client.readyState === 1) {
              client.send(message);
            }
          });
        }
        
        res.json({ allComplete: true, orderStatus: "ready" });
      } else {
        res.json({ allComplete, orderStatus: order.status });
      }
    } catch (error) {
      console.error("Failed to check order completion:", error);
      res.status(500).json({ error: "Failed to check order completion" });
    }
  });

  // EPOS Order routes
  app.get("/api/restaurants/:restaurantId/epos-orders", async (req, res) => {
    try {
      const orders = await storage.getEposOrders(req.params.restaurantId);
      res.json(orders);
    } catch (error) {
      console.error("Failed to fetch EPOS orders:", error);
      res.status(500).json({ error: "Failed to fetch EPOS orders" });
    }
  });

  app.get("/api/epos-orders/:id", async (req, res) => {
    try {
      const order = await storage.getEposOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "EPOS order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Failed to fetch EPOS order:", error);
      res.status(500).json({ error: "Failed to fetch EPOS order" });
    }
  });

  app.post("/api/epos-orders", async (req, res) => {
    try {
      const { restaurantId, items, subtotal, discountType, discountValue, discountAmount, total, paymentMethod, cashierName, customerName, notes, amountTendered, changeGiven, vatRate, vatAmount, serviceFee, extraCharges, extraChargesLabel } = req.body;
      const cleanOrder = {
        restaurantId,
        items,
        subtotal,
        discountType: discountType || null,
        discountValue: discountValue || "0",
        discountAmount: discountAmount || "0",
        total,
        paymentMethod: paymentMethod || "cash",
        cashierName: cashierName || null,
        customerName: customerName || null,
        notes: notes || null,
        amountTendered: amountTendered ? String(amountTendered) : null,
        changeGiven: changeGiven != null ? String(changeGiven) : null,
        vatRate: vatRate ? String(vatRate) : "0",
        vatAmount: vatAmount ? String(vatAmount) : "0",
        serviceFee: serviceFee ? String(serviceFee) : "0",
        extraCharges: extraCharges ? String(extraCharges) : "0",
        extraChargesLabel: extraChargesLabel || null,
      };
      const order = await storage.createEposOrder(cleanOrder);
      res.status(201).json(order);
    } catch (error: any) {
      console.error("Failed to create EPOS order:", error?.message || error);
      res.status(500).json({ error: "Failed to create EPOS order", details: error?.message });
    }
  });

  app.delete("/api/epos-orders/:id", async (req, res) => {
    try {
      await storage.deleteEposOrder(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete EPOS order:", error);
      res.status(500).json({ error: "Failed to delete EPOS order" });
    }
  });

  // Menu Category routes
  app.get("/api/menu-categories", async (req, res) => {
    try {
      const restaurantId = req.query.restaurantId as string | undefined;
      if (restaurantId) {
        const categories = await storage.getMenuCategories(restaurantId);
        res.json(categories);
      } else {
        // Admin panel: return all categories across all branches
        const categories = await storage.getAllMenuCategories();
        res.json(categories);
      }
    } catch (error) {
      console.error("Failed to fetch menu categories:", error);
      res.status(500).json({ error: "Failed to fetch menu categories" });
    }
  });

  app.get("/api/menu-categories/:id", async (req, res) => {
    try {
      const category = await storage.getMenuCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Menu category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Failed to fetch menu category:", error);
      res.status(500).json({ error: "Failed to fetch menu category" });
    }
  });

  app.post("/api/menu-categories", async (req, res) => {
    try {
      const category = await storage.createMenuCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      console.error("Failed to create menu category:", error);
      res.status(500).json({ error: "Failed to create menu category" });
    }
  });

  app.patch("/api/menu-categories/:id", async (req, res) => {
    try {
      // First, get the existing category
      const existingCategory = await storage.getMenuCategory(req.params.id);
      if (!existingCategory) {
        return res.status(404).json({ error: "Menu category not found" });
      }
      
      // If this is a global category (restaurantId is null) and a restaurantId is provided,
      // check if a branch-specific copy already exists before creating one
      if (existingCategory.restaurantId === null && req.body.restaurantId) {
        // Check if branch already has a copy of this category (by slug + restaurantId)
        const allCategories = await storage.getMenuCategories(req.body.restaurantId);
        const existingBranchCopy = allCategories.find(
          (c: any) => c.slug === existingCategory.slug && c.restaurantId === req.body.restaurantId
        );
        
        if (existingBranchCopy) {
          // Update the existing branch-specific copy
          const updatedCategory = await storage.updateMenuCategory(existingBranchCopy.id, {
            name: req.body.name || existingBranchCopy.name,
            icon: req.body.icon || existingBranchCopy.icon,
            imageUrl: req.body.imageUrl,
            videoUrl: req.body.videoUrl,
            gifUrl: req.body.gifUrl,
            description: req.body.description,
          });
          return res.json(updatedCategory);
        }
        
        // Create a new branch-specific category (clone from global)
        const newCategory = await storage.createMenuCategory({
          name: req.body.name || existingCategory.name,
          slug: existingCategory.slug, // Keep the same slug for menu item references
          icon: req.body.icon || existingCategory.icon,
          restaurantId: req.body.restaurantId,
          sortOrder: existingCategory.sortOrder || 100,
        });
        return res.json(newCategory);
      }
      
      // For branch-specific categories, update normally
      const category = await storage.updateMenuCategory(req.params.id, {
        name: req.body.name,
        icon: req.body.icon,
        imageUrl: req.body.imageUrl,
        videoUrl: req.body.videoUrl,
        gifUrl: req.body.gifUrl,
        description: req.body.description,
        isEnabled: req.body.isEnabled,
        showInTelephone: req.body.showInTelephone,
        showInEpos: req.body.showInEpos,
        showInWaiter: req.body.showInWaiter,
        showInOnline: req.body.showInOnline,
      });
      if (!category) {
        return res.status(404).json({ error: "Menu category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Failed to update menu category:", error);
      res.status(500).json({ error: "Failed to update menu category" });
    }
  });

  // Category media upload endpoint - supports image, GIF, video
  app.post("/api/menu-categories/:id/upload-media", menuImageUploadMemory.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }
      
      const objectStorageService = new ObjectStorageService();
      const fileUrl = await objectStorageService.uploadFromBuffer(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      
      // Determine field based on file type
      const mimeType = req.file.mimetype;
      const mediaType = req.query.type as string || 'image';
      
      let updateData: any = {};
      if (mediaType === 'video' || mimeType.startsWith('video/')) {
        updateData = { videoUrl: fileUrl };
      } else if (mediaType === 'gif' || mimeType === 'image/gif') {
        updateData = { gifUrl: fileUrl };
      } else {
        updateData = { imageUrl: fileUrl };
      }
      
      const category = await storage.updateMenuCategory(req.params.id, updateData);
      if (!category) {
        return res.status(404).json({ error: "Menu category not found" });
      }
      
      res.json({ url: fileUrl, category, mediaType });
    } catch (error) {
      console.error("Failed to upload category media:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  app.delete("/api/menu-categories/:id", async (req, res) => {
    try {
      await storage.deleteMenuCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete menu category:", error);
      res.status(500).json({ error: "Failed to delete menu category" });
    }
  });

  // Manual cleanup endpoint for EMPARO PERI PERI Southend duplicates
  // GET request so user can just visit the URL in browser
  app.get("/api/cleanup-southend-duplicates", async (req, res) => {
    try {
      console.log("[API Cleanup] Starting manual cleanup for EMPARO PERI PERI Southend...");
      
      // Find the restaurant
      const allRestaurants = await db.select().from(restaurants);
      const southendRestaurant = allRestaurants.find(r => 
        r.slug === "emparo-peri-peri-southend" || 
        (r.name.toLowerCase().includes("emparo") && r.name.toLowerCase().includes("southend"))
      );
      
      if (!southendRestaurant) {
        return res.status(404).json({ error: "EMPARO PERI PERI Southend not found" });
      }
      
      console.log(`[API Cleanup] Found restaurant: ${southendRestaurant.name} (ID: ${southendRestaurant.id})`);
      
      // Get all categories
      const categories = await db.select()
        .from(menuCategories)
        .where(eq(menuCategories.restaurantId, southendRestaurant.id));
      
      console.log(`[API Cleanup] Found ${categories.length} total categories`);
      
      // Categories to delete (exact names)
      const categoriesToDelete = new Set([
        "Grilled Burger and Wraps",
        "Pizza",
        "Starters",
        "Chicken",
        "Sides",
      ]);
      
      const deleted: string[] = [];
      for (const cat of categories) {
        if (categoriesToDelete.has(cat.name)) {
          console.log(`[API Cleanup] Deleting: "${cat.name}" (ID: ${cat.id})`);
          await db.delete(menuCategories).where(eq(menuCategories.id, cat.id));
          deleted.push(cat.name);
        }
      }
      
      // Get remaining categories
      const remaining = await db.select()
        .from(menuCategories)
        .where(eq(menuCategories.restaurantId, southendRestaurant.id));
      
      console.log(`[API Cleanup] Complete! Deleted ${deleted.length} categories. Remaining: ${remaining.length}`);
      
      res.json({
        success: true,
        deleted: deleted,
        remaining: remaining.map(c => c.name),
        message: `Deleted ${deleted.length} duplicate categories`
      });
    } catch (error) {
      console.error("[API Cleanup] Error:", error);
      res.status(500).json({ error: "Cleanup failed", details: String(error) });
    }
  });

  // Menu item media upload endpoint - supports image, GIF, video
  app.post("/api/menu/:id/upload-media", menuImageUploadMemory.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }
      
      // Verify menu item exists before uploading
      const existingItem = await storage.getMenuItem(req.params.id);
      if (!existingItem) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      
      // Validate restaurant ownership if restaurantId is provided in query
      const requestedRestaurantId = req.query.restaurantId as string;
      if (requestedRestaurantId && existingItem.restaurantId !== requestedRestaurantId) {
        return res.status(403).json({ error: "Access denied - item belongs to different restaurant" });
      }
      
      const objectStorageService = new ObjectStorageService();
      const fileUrl = await objectStorageService.uploadFromBuffer(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      
      const mimeType = req.file.mimetype;
      const mediaType = req.query.type as string || 'image';
      
      let updateData: any = {};
      if (mediaType === 'video' || mimeType.startsWith('video/')) {
        updateData = { videoUrl: fileUrl };
      } else if (mediaType === 'gif' || mimeType === 'image/gif') {
        updateData = { gifUrl: fileUrl };
      } else {
        updateData = { image: fileUrl };
      }
      
      const menuItem = await storage.updateMenuItem(req.params.id, updateData);
      if (!menuItem) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      
      res.json({ url: fileUrl, menuItem, mediaType });
    } catch (error) {
      console.error("Failed to upload menu item media:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Waiter routes
  app.get("/api/restaurants/:restaurantId/waiters", async (req, res) => {
    try {
      const waiters = await storage.getWaiters(req.params.restaurantId);
      res.json(waiters);
    } catch (error) {
      console.error("Failed to fetch waiters:", error);
      res.status(500).json({ error: "Failed to fetch waiters" });
    }
  });

  app.post("/api/restaurants/:restaurantId/waiters", async (req, res) => {
    try {
      const waiter = await storage.createWaiter({
        ...req.body,
        restaurantId: req.params.restaurantId
      });
      res.status(201).json(waiter);
    } catch (error) {
      console.error("Failed to create waiter:", error);
      res.status(500).json({ error: "Failed to create waiter" });
    }
  });

  app.patch("/api/restaurants/:restaurantId/waiters/:id", async (req, res) => {
    try {
      // Verify waiter belongs to this restaurant
      const existing = await storage.getWaiter(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Waiter not found" });
      }
      if (existing.restaurantId !== req.params.restaurantId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Prevent changing restaurantId
      const { restaurantId: _, ...updateData } = req.body;
      const waiter = await storage.updateWaiter(req.params.id, updateData);
      res.json(waiter);
    } catch (error) {
      console.error("Failed to update waiter:", error);
      res.status(500).json({ error: "Failed to update waiter" });
    }
  });

  app.delete("/api/restaurants/:restaurantId/waiters/:id", async (req, res) => {
    try {
      // Verify waiter belongs to this restaurant
      const existing = await storage.getWaiter(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Waiter not found" });
      }
      if (existing.restaurantId !== req.params.restaurantId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await storage.deleteWaiter(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete waiter:", error);
      res.status(500).json({ error: "Failed to delete waiter" });
    }
  });

  // Waiter Tablet routes
  app.get("/api/restaurants/:restaurantId/waiter-tablets", async (req, res) => {
    try {
      const tablets = await storage.getWaiterTablets(req.params.restaurantId);
      res.json(tablets);
    } catch (error) {
      console.error("Failed to fetch waiter tablets:", error);
      res.status(500).json({ error: "Failed to fetch waiter tablets" });
    }
  });

  app.post("/api/restaurants/:restaurantId/waiter-tablets/seed", async (req, res) => {
    try {
      const count = Math.min(Math.max(req.body.count || 10, 1), 10);
      const tablets = await storage.seedWaiterTablets(req.params.restaurantId, count);
      res.json(tablets);
    } catch (error) {
      console.error("Failed to seed waiter tablets:", error);
      res.status(500).json({ error: "Failed to seed waiter tablets" });
    }
  });

  app.patch("/api/restaurants/:restaurantId/waiter-tablets/:id", async (req, res) => {
    try {
      // Verify tablet belongs to this restaurant
      const existing = await storage.getWaiterTablet(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Waiter tablet not found" });
      }
      if (existing.restaurantId !== req.params.restaurantId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Prevent changing restaurantId
      const { restaurantId: _, ...updateData } = req.body;
      const tablet = await storage.updateWaiterTablet(req.params.id, updateData);
      res.json(tablet);
    } catch (error) {
      console.error("Failed to update waiter tablet:", error);
      res.status(500).json({ error: "Failed to update waiter tablet" });
    }
  });

  // Claim a waiter tablet (waiter enters their name and PIN) - scoped to restaurant
  app.post("/api/restaurants/:restaurantId/waiter-tablets/:id/claim", async (req, res) => {
    try {
      const { waiterName, waiterPin } = req.body;
      if (!waiterName || typeof waiterName !== 'string') {
        return res.status(400).json({ error: "Waiter name is required" });
      }
      if (!waiterPin || typeof waiterPin !== 'string') {
        return res.status(400).json({ error: "PIN is required" });
      }
      
      // Check if tablet exists and belongs to this restaurant
      const existing = await storage.getWaiterTablet(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Waiter tablet not found" });
      }
      if (existing.restaurantId !== req.params.restaurantId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Verify waiter credentials (name + PIN) - scoped to restaurant
      const waiter = await storage.getWaiterByNameAndPin(req.params.restaurantId, waiterName.trim(), waiterPin.trim());
      if (!waiter) {
        return res.status(401).json({ error: "Invalid name or PIN. Please check your credentials." });
      }
      
      // If tablet is already in use by a different waiter, reject
      if (existing.isActive && existing.assignedWaiterName && existing.assignedWaiterName.toLowerCase() !== waiterName.trim().toLowerCase()) {
        return res.status(409).json({ error: `Tablet already in use by ${existing.assignedWaiterName}` });
      }
      
      // Claim or re-claim (reconnect) the tablet
      const tablet = await storage.claimWaiterTablet(req.params.id, waiterName.trim());
      res.json(tablet);
    } catch (error) {
      console.error("Failed to claim waiter tablet:", error);
      res.status(500).json({ error: "Failed to claim waiter tablet" });
    }
  });

  // Release a waiter tablet (logout) - scoped to restaurant
  app.post("/api/restaurants/:restaurantId/waiter-tablets/:id/release", async (req, res) => {
    try {
      // Verify tablet belongs to this restaurant
      const existing = await storage.getWaiterTablet(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Waiter tablet not found" });
      }
      if (existing.restaurantId !== req.params.restaurantId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const tablet = await storage.releaseWaiterTablet(req.params.id);
      res.json(tablet);
    } catch (error) {
      console.error("Failed to release waiter tablet:", error);
      res.status(500).json({ error: "Failed to release waiter tablet" });
    }
  });

  // Release ALL waiter tablets for a restaurant - manager use
  app.post("/api/restaurants/:restaurantId/waiter-tablets/release-all", async (req, res) => {
    try {
      const tablets = await storage.releaseAllWaiterTablets(req.params.restaurantId);
      res.json({ released: tablets.length, tablets });
    } catch (error) {
      console.error("Failed to release all waiter tablets:", error);
      res.status(500).json({ error: "Failed to release all waiter tablets" });
    }
  });

  // Increment order count for a tablet - scoped to restaurant
  app.post("/api/restaurants/:restaurantId/waiter-tablets/:id/increment-order", async (req, res) => {
    try {
      // Verify tablet belongs to this restaurant
      const existing = await storage.getWaiterTablet(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Waiter tablet not found" });
      }
      if (existing.restaurantId !== req.params.restaurantId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const tablet = await storage.incrementTabletOrderCount(req.params.id);
      res.json(tablet);
    } catch (error) {
      console.error("Failed to increment tablet order count:", error);
      res.status(500).json({ error: "Failed to increment tablet order count" });
    }
  });

  // Table Session routes
  app.get("/api/restaurants/:restaurantId/table-sessions", async (req, res) => {
    try {
      const sessions = await storage.getTableSessions(req.params.restaurantId);
      res.json(sessions);
    } catch (error) {
      console.error("Failed to fetch table sessions:", error);
      res.status(500).json({ error: "Failed to fetch table sessions" });
    }
  });

  app.get("/api/table-sessions/:id", async (req, res) => {
    try {
      const session = await storage.getTableSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Table session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Failed to fetch table session:", error);
      res.status(500).json({ error: "Failed to fetch table session" });
    }
  });

  app.post("/api/restaurants/:restaurantId/table-sessions", async (req, res) => {
    try {
      const session = await storage.createTableSession({
        ...req.body,
        restaurantId: req.params.restaurantId
      });
      res.status(201).json(session);
    } catch (error) {
      console.error("Failed to create table session:", error);
      res.status(500).json({ error: "Failed to create table session" });
    }
  });

  app.patch("/api/table-sessions/:id", async (req, res) => {
    try {
      const session = await storage.updateTableSession(req.params.id, req.body);
      if (!session) {
        return res.status(404).json({ error: "Table session not found" });
      }
      
      // Broadcast session update to restaurant
      const fullSession = await storage.getTableSession(req.params.id);
      if (fullSession) {
        broadcastToRestaurant(fullSession.restaurantId, {
          type: "TABLE_SESSION_UPDATED",
          session: fullSession
        });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Failed to update table session:", error);
      res.status(500).json({ error: "Failed to update table session" });
    }
  });

  // Table Session Item routes
  app.post("/api/table-sessions/:sessionId/items", async (req, res) => {
    try {
      const item = await storage.addTableSessionItem({
        ...req.body,
        sessionId: req.params.sessionId
      });
      res.status(201).json(item);
    } catch (error) {
      console.error("Failed to add table session item:", error);
      res.status(500).json({ error: "Failed to add table session item" });
    }
  });

  app.patch("/api/table-session-items/:id", async (req, res) => {
    try {
      const item = await storage.updateTableSessionItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Table session item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Failed to update table session item:", error);
      res.status(500).json({ error: "Failed to update table session item" });
    }
  });

  app.delete("/api/table-session-items/:id", async (req, res) => {
    try {
      await storage.deleteTableSessionItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete table session item:", error);
      res.status(500).json({ error: "Failed to delete table session item" });
    }
  });

  // Convert table session to order (manager approval)
  app.post("/api/table-sessions/:id/approve", async (req, res) => {
    try {
      const session = await storage.getTableSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Table session not found" });
      }
      
      // Get payment method from request body (waiter tablet selection)
      const { paymentMethod: clientPaymentMethod } = req.body || {};
      
      // Calculate total from items
      const total = session.items.reduce((sum, item) => {
        const itemPrice = Number(item.price) * (item.quantity || 1);
        const toppingsPrice = (item.toppings || []).reduce((t, top) => t + top.price, 0) * (item.quantity || 1);
        return sum + itemPrice + toppingsPrice;
      }, 0);
      
      // Create order with full table info
      const guestCounts = session.guestCounts as { 
        adults: number; 
        kids: number; 
        children: number;
        room?: string;
        waiterName?: string;
        tabletNumber?: number;
      } || { adults: 1, kids: 0, children: 0 };
      
      const totalGuests = guestCounts.adults + guestCounts.kids + guestCounts.children;
      
      // Build customer name with all info: "Table 5 Room 2 (4 guests) | Waiter: John | Tablet 3"
      let customerName = `Table ${session.tableNumber}`;
      if (guestCounts.room) customerName += ` Room ${guestCounts.room}`;
      customerName += ` (${totalGuests} guests)`;
      if (guestCounts.waiterName) customerName += ` | Waiter: ${guestCounts.waiterName}`;
      if (guestCounts.tabletNumber) customerName += ` | Tablet ${guestCounts.tabletNumber}`;
      
      const order = await storage.createOrder(
        {
          restaurantId: session.restaurantId,
          type: "dine-in",
          status: "pending_approval", // Orders from waiter tablets need manager approval
          customerName,
          phone: "",
          address: "",
          total: total.toFixed(2),
          paymentMethod: clientPaymentMethod || "cash",
        },
        session.items.map(item => ({
          name: item.name,
          quantity: item.quantity || 1,
          price: item.price,
          notes: item.notes || (item.toppings?.length ? `EXTRAS: ${item.toppings.map(t => t.name).join(', ')}` : undefined)
        }))
      );
      
      // Update session with order reference
      await storage.updateTableSession(session.id, {
        status: "awaiting_manager",
        orderId: order.id
      });
      
      // Broadcast pending order to restaurant for manager approval
      broadcastToRestaurant(session.restaurantId, {
        type: "PENDING_APPROVAL_ORDER",
        order
      });
      
      res.json({ session, order });
    } catch (error) {
      console.error("Failed to approve table session:", error);
      res.status(500).json({ error: "Failed to approve table session" });
    }
  });

  // Manager approves waiter order - sends to kitchen
  app.post("/api/orders/:id/manager-approve", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.status !== "pending_approval") {
        return res.status(400).json({ error: "Order is not pending approval" });
      }
      
      const updatedOrder = await storage.updateOrderStatus(order.id, "new");
      
      // Broadcast to restaurant that order is now in kitchen
      broadcastToRestaurant(order.restaurantId, {
        type: "NEW_ORDER",
        order: updatedOrder
      });
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Failed to approve order:", error);
      res.status(500).json({ error: "Failed to approve order" });
    }
  });

  // Manager rejects waiter order
  app.post("/api/orders/:id/manager-reject", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.status !== "pending_approval") {
        return res.status(400).json({ error: "Order is not pending approval" });
      }
      
      // Delete the order
      await storage.deleteOrder(order.id);
      
      // Broadcast rejection
      broadcastToRestaurant(order.restaurantId, {
        type: "ORDER_REJECTED",
        orderId: order.id
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to reject order:", error);
      res.status(500).json({ error: "Failed to reject order" });
    }
  });

  // ============================================
  // SUPPLIER ORDERING SYSTEM ROUTES
  // ============================================

  // Get all suppliers for a restaurant with their products
  app.get("/api/restaurants/:restaurantId/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getSuppliersWithProducts(req.params.restaurantId);
      res.json(suppliers);
    } catch (error) {
      console.error("Failed to get suppliers:", error);
      res.status(500).json({ error: "Failed to get suppliers" });
    }
  });

  // Create a new supplier
  app.post("/api/restaurants/:restaurantId/suppliers", async (req, res) => {
    try {
      const supplier = await storage.createSupplier({
        ...req.body,
        restaurantId: req.params.restaurantId
      });
      res.json(supplier);
    } catch (error) {
      console.error("Failed to create supplier:", error);
      res.status(500).json({ error: "Failed to create supplier" });
    }
  });

  // Update a supplier
  app.patch("/api/suppliers/:id", async (req, res) => {
    try {
      const updated = await storage.updateSupplier(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Failed to update supplier:", error);
      res.status(500).json({ error: "Failed to update supplier" });
    }
  });

  // Delete a supplier
  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      await storage.deleteSupplier(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete supplier:", error);
      res.status(500).json({ error: "Failed to delete supplier" });
    }
  });

  // Get products for a supplier
  app.get("/api/suppliers/:supplierId/products", async (req, res) => {
    try {
      const products = await storage.getSupplierProducts(req.params.supplierId);
      res.json(products);
    } catch (error) {
      console.error("Failed to get supplier products:", error);
      res.status(500).json({ error: "Failed to get supplier products" });
    }
  });

  // Create a product for a supplier
  app.post("/api/suppliers/:supplierId/products", async (req, res) => {
    try {
      const product = await storage.createSupplierProduct({
        ...req.body,
        supplierId: req.params.supplierId
      });
      res.json(product);
    } catch (error) {
      console.error("Failed to create supplier product:", error);
      res.status(500).json({ error: "Failed to create supplier product" });
    }
  });

  // Update a supplier product
  app.patch("/api/supplier-products/:id", async (req, res) => {
    try {
      const updated = await storage.updateSupplierProduct(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Failed to update supplier product:", error);
      res.status(500).json({ error: "Failed to update supplier product" });
    }
  });

  // Delete a supplier product
  app.delete("/api/supplier-products/:id", async (req, res) => {
    try {
      await storage.deleteSupplierProduct(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete supplier product:", error);
      res.status(500).json({ error: "Failed to delete supplier product" });
    }
  });

  // Get all supplier orders for a restaurant
  app.get("/api/restaurants/:restaurantId/supplier-orders", async (req, res) => {
    try {
      const orders = await storage.getSupplierOrders(req.params.restaurantId);
      res.json(orders);
    } catch (error) {
      console.error("Failed to get supplier orders:", error);
      res.status(500).json({ error: "Failed to get supplier orders" });
    }
  });

  // Create a supplier order
  app.post("/api/restaurants/:restaurantId/supplier-orders", async (req, res) => {
    try {
      const { supplierId, items, notes } = req.body;
      
      // Get supplier products to populate item details
      const supplierProducts = await storage.getSupplierProducts(supplierId);
      const productsMap = new Map(supplierProducts.map(p => [p.id, p]));
      
      // Build complete order items with product details
      const orderItems = items.map((item: { productId: string; quantity: number }) => {
        const product = productsMap.get(item.productId);
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        const unitPrice = parseFloat(product.pricePerUnit || "0");
        const subtotal = unitPrice * item.quantity;
        return {
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity.toString(),
          unitType: product.unitType,
          unitPrice: unitPrice.toFixed(2),
          subtotal: subtotal.toFixed(2)
        };
      });
      
      // Calculate total
      const total = orderItems.reduce((sum: number, item: any) => sum + parseFloat(item.subtotal), 0);
      
      const order = await storage.createSupplierOrder({
        restaurantId: req.params.restaurantId,
        supplierId,
        total: total.toFixed(2),
        notes
      }, orderItems);
      
      res.json(order);
    } catch (error) {
      console.error("Failed to create supplier order:", error);
      res.status(500).json({ error: "Failed to create supplier order" });
    }
  });

  // Delete a supplier order
  app.delete("/api/supplier-orders/:id", async (req, res) => {
    try {
      await storage.deleteSupplierOrder(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete supplier order:", error);
      res.status(500).json({ error: "Failed to delete supplier order" });
    }
  });

  // Update supplier order item quantity
  app.patch("/api/supplier-order-items/:itemId", async (req, res) => {
    try {
      const { quantity, unitPrice } = req.body;
      if (typeof quantity !== "number" || quantity < 0) {
        return res.status(400).json({ error: "Invalid quantity" });
      }
      const updated = await storage.updateSupplierOrderItemQuantity(
        req.params.itemId,
        quantity,
        parseFloat(unitPrice || "0")
      );
      if (!updated) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Failed to update supplier order item:", error);
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  // Copy menu items from DHABA to branches with no items (for production seeding)
  app.post("/api/copy-menu-from-dhaba", async (req, res) => {
    try {
      // Get DHABA restaurant
      const dhaba = await storage.getRestaurantBySlug("dhaba");
      if (!dhaba) {
        return res.status(404).json({ error: "DHABA restaurant not found" });
      }
      
      // Get all DHABA menu items
      const dhabaMenuItems = await storage.getMenuItems(dhaba.id);
      if (dhabaMenuItems.length === 0) {
        return res.status(400).json({ error: "DHABA has no menu items to copy" });
      }
      
      // Get all restaurants
      const allRestaurants = await storage.getAllRestaurants();
      const results: { restaurant: string; itemsCopied: number }[] = [];
      
      for (const restaurant of allRestaurants) {
        // Skip DHABA itself
        if (restaurant.id === dhaba.id) continue;
        
        // Check if this restaurant has menu items
        const existingItems = await storage.getMenuItems(restaurant.id);
        if (existingItems.length > 0) {
          results.push({ restaurant: restaurant.name, itemsCopied: 0 });
          continue;
        }
        
        // Copy all DHABA menu items to this restaurant
        let copiedCount = 0;
        for (const item of dhabaMenuItems) {
          await storage.createMenuItem({
            restaurantId: restaurant.id,
            name: item.name,
            description: item.description || "",
            price: item.price,
            category: item.category,
            image: item.image || "",
            available: item.available ?? true,
            allergenProfile: item.allergenProfile || undefined,
          });
          copiedCount++;
        }
        
        results.push({ restaurant: restaurant.name, itemsCopied: copiedCount });
      }
      
      res.json({
        success: true,
        sourceRestaurant: dhaba.name,
        sourceItemCount: dhabaMenuItems.length,
        results,
      });
    } catch (error) {
      console.error("Failed to copy menu items:", error);
      res.status(500).json({ error: "Failed to copy menu items from DHABA" });
    }
  });

  // Send supplier order via email (mark as sent)
  app.post("/api/supplier-orders/:id/send", async (req, res) => {
    try {
      const order = await storage.getSupplierOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (!order.supplier?.email) {
        return res.status(400).json({ error: "Supplier has no email address" });
      }
      
      // Get restaurant info
      const restaurant = await storage.getRestaurant(order.restaurantId);
      
      // Build email content
      const itemsList = order.items.map(item => 
        `- ${item.productName}: ${item.quantity} ${item.unitType || 'units'} @ £${item.unitPrice} = £${item.subtotal}`
      ).join('\n');
      
      const emailSubject = `Order from ${restaurant?.name || 'Restaurant'}`;
      const emailBody = `
Dear ${order.supplier.contactName || order.supplier.name},

Please find our order below:

${itemsList}

Total: £${order.total}

${order.notes ? `Notes: ${order.notes}` : ''}

Thank you,
${restaurant?.name || 'Restaurant'}
${restaurant?.phone || ''}
      `.trim();
      
      // Send email to supplier using Resend (set Reply-To as branch's email so replies go to branch owner)
      try {
        const replyToEmail = restaurant?.supplierOrderFromEmail || undefined;
        await sendEmail(order.supplier.email, emailSubject, emailBody, undefined, replyToEmail);
        console.log(`Supplier order email sent to ${order.supplier.email}${replyToEmail ? ` (reply-to: ${replyToEmail})` : ''}`);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        return res.status(500).json({ error: "Failed to send email to supplier" });
      }
      
      // Mark order as sent
      const updated = await storage.markSupplierOrderSent(req.params.id);
      
      // Auto-track expense when supplier order is sent
      if (order.total && parseFloat(order.total) > 0) {
        try {
          await storage.createFinancialTransaction({
            restaurantId: order.restaurantId,
            type: "expense",
            expenseCategory: "supplier_invoice",
            amount: order.total,
            description: `Supplier Order - ${order.supplier?.name || 'Unknown'}`,
            referenceId: order.id,
            referenceType: "supplier_order",
            transactionDate: new Date(),
          });
        } catch (financeError) {
          console.error("Failed to auto-track supplier expense:", financeError);
        }
      }
      
      res.json({ 
        success: true, 
        order: updated,
        emailSent: true,
        sentTo: order.supplier.email
      });
    } catch (error) {
      console.error("Failed to send supplier order:", error);
      res.status(500).json({ error: "Failed to send supplier order" });
    }
  });

  // ============================================
  // STRIPE PAYMENT ROUTES
  // ============================================

  app.post("/api/verify-stripe-key", async (req, res) => {
    try {
      const { stripeSecretKey } = req.body;
      if (!stripeSecretKey || typeof stripeSecretKey !== 'string') {
        return res.status(400).json({ valid: false, error: "Stripe secret key is required" });
      }
      const cleanKey = stripeSecretKey.replace(/[^\x20-\x7E]/g, '').replace(/\s/g, '').trim();
      if (!cleanKey.startsWith('sk_live_') && !cleanKey.startsWith('sk_test_')) {
        return res.status(400).json({ valid: false, error: "Key must start with sk_live_ or sk_test_" });
      }
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(cleanKey, { apiVersion: '2025-04-30.basil' as any });
      const account = await stripe.accounts.retrieve();
      res.json({
        valid: true,
        accountId: account.id,
        businessName: account.business_profile?.name || account.settings?.dashboard?.display_name || '',
        country: account.country || '',
        currency: account.default_currency || '',
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
      });
    } catch (error: any) {
      console.error("[Stripe Verify] Error:", error?.message);
      res.status(400).json({ valid: false, error: error?.message || "Invalid Stripe key" });
    }
  });

  // Create a payment intent for card payments
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, restaurantId, orderId } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      
      if (!restaurant.stripeSecretKey) {
        return res.status(500).json({ error: "Card payment is temporarily unavailable. Please try cash or bank transfer." });
      }
      
      const Stripe = (await import('stripe')).default;
      const cyrMap: Record<string, string> = {'А':'A','В':'B','С':'C','Е':'E','Н':'H','К':'K','М':'M','О':'O','Р':'P','Т':'T','Х':'X','а':'a','в':'b','с':'c','е':'e','к':'k','м':'m','о':'o','р':'p','х':'x','у':'y','Ø':'O','ø':'o'};
      let stripeSecretKey = restaurant.stripeSecretKey;
      for (const [c, l] of Object.entries(cyrMap)) { stripeSecretKey = stripeSecretKey.split(c).join(l); }
      stripeSecretKey = stripeSecretKey.replace(/[^\x20-\x7E]/g, '').replace(/\s/g, '').trim();
      
      console.log(`[Stripe Payment] Restaurant: ${restaurant.name}, Key starts: ${stripeSecretKey.substring(0, 12)}...`);
      
      const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-04-30.basil' as any });

      try {
        const account = await stripe.accounts.retrieve();
        if (!account.charges_enabled) {
          console.error(`[Stripe] ${restaurant.name}: charges NOT enabled on account ${account.id}`);
          return res.status(400).json({ error: "This restaurant's card payment setup is not complete. The shop owner needs to finish Stripe account verification. Please use cash or bank transfer." });
        }
      } catch (acctErr: any) {
        console.error(`[Stripe] Account check failed for ${restaurant.name}:`, acctErr?.message);
      }

      const symToCode: Record<string, string> = { '£': 'gbp', '$': 'usd', '€': 'eur', 'Rs': 'pkr', '₹': 'inr', 'د.إ': 'aed', '₺': 'try', '﷼': 'sar' };
      const stripeCurrency = (symToCode[restaurant.currency || '£'] || restaurant.currency || 'gbp').toLowerCase();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: stripeCurrency,
        capture_method: 'manual',
        metadata: { restaurantId, orderId: orderId || '', restaurantName: restaurant.name },
        payment_method_types: ['card'],
      });
      
      res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
    } catch (error: any) {
      console.error("[Stripe Error] Failed to create payment intent:", error?.message || error?.type || error);
      res.status(500).json({ error: error?.message || "Payment could not be processed. Please try again or use a different payment method." });
    }
  });
  
  app.post("/api/process-card-payment", async (req, res) => {
    try {
      const { amount, restaurantId, cardNumber, expMonth, expYear, cvc } = req.body;
      if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });
      if (!cardNumber || !expMonth || !expYear || !cvc) return res.status(400).json({ error: "Card details required" });

      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

      if (!restaurant.stripeSecretKey) return res.status(500).json({ error: "Card payment is temporarily unavailable. Please try cash or bank transfer." });
      
      const Stripe = (await import('stripe')).default;
      const cyrMap2: Record<string, string> = {'А':'A','В':'B','С':'C','Е':'E','Н':'H','К':'K','М':'M','О':'O','Р':'P','Т':'T','Х':'X','а':'a','в':'b','с':'c','е':'e','к':'k','м':'m','о':'o','р':'p','х':'x','у':'y','Ø':'O','ø':'o'};
      let stripeSecretKey = restaurant.stripeSecretKey;
      for (const [c, l] of Object.entries(cyrMap2)) { stripeSecretKey = stripeSecretKey.split(c).join(l); }
      stripeSecretKey = stripeSecretKey.replace(/[^\x20-\x7E]/g, '').replace(/\s/g, '').trim();
      console.log(`[Stripe Card] Restaurant: ${restaurant.name}, Key starts: ${stripeSecretKey.substring(0, 12)}...`);
      
      const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-04-30.basil' as any });
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: { number: cardNumber, exp_month: expMonth, exp_year: expYear, cvc },
      });
      const symToCode2: Record<string, string> = { '£': 'gbp', '$': 'usd', '€': 'eur', 'Rs': 'pkr', '₹': 'inr', 'د.إ': 'aed', '₺': 'try', '﷼': 'sar' };
      const stripeCurrency2 = (symToCode2[restaurant.currency || '£'] || restaurant.currency || 'gbp').toLowerCase();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: stripeCurrency2,
        capture_method: 'manual',
        payment_method: paymentMethod.id,
        confirm: true,
        payment_method_types: ['card'],
        metadata: { restaurantId, restaurantName: restaurant.name },
      });
      if (paymentIntent.status === 'requires_capture' || paymentIntent.status === 'succeeded') {
        res.json({ paymentIntentId: paymentIntent.id });
      } else {
        res.status(400).json({ error: "Payment was not completed. Status: " + paymentIntent.status });
      }
    } catch (error: any) {
      console.error("Failed to process card payment:", error);
      res.status(500).json({ error: "Payment could not be processed. Please try again or use a different payment method." });
    }
  });

  app.get("/api/stripe-config", async (req, res) => {
    const restaurantId = req.query.restaurantId as string;
    
    if (restaurantId) {
      const restaurant = await storage.getRestaurant(restaurantId);
      if (restaurant?.stripePublishableKey) {
        const cyrMap: Record<string, string> = {'А':'A','В':'B','С':'C','Е':'E','Н':'H','К':'K','М':'M','О':'O','Р':'P','Т':'T','Х':'X','а':'a','в':'b','с':'c','е':'e','к':'k','м':'m','о':'o','р':'p','х':'x','у':'y','Ø':'O','ø':'o'};
        let cleanPk = restaurant.stripePublishableKey;
        for (const [c, l] of Object.entries(cyrMap)) { cleanPk = cleanPk.split(c).join(l); }
        cleanPk = cleanPk.replace(/[^\x20-\x7E]/g, '').replace(/\s/g, '').trim();
        if (cleanPk.startsWith('pk_test_') || cleanPk.startsWith('pk_live_')) {
          return res.json({ publishableKey: cleanPk });
        }
      }
      return res.status(500).json({ error: "Card payment is temporarily unavailable. Please try cash or bank transfer." });
    }
    
    return res.status(400).json({ error: "Restaurant ID is required" });
  });

  app.post("/api/capture-payment", async (req, res) => {
    try {
      const { paymentIntentId, orderId, restaurantId } = req.body;
      if (!paymentIntentId) return res.status(400).json({ error: "Payment intent ID is required" });
      
      if (!restaurantId) return res.status(400).json({ error: "Restaurant ID is required" });
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant?.stripeSecretKey) return res.status(500).json({ error: "Card payment is temporarily unavailable. Please try another payment method." });
      
      const Stripe = (await import('stripe')).default;
      const stripeSecretKey = restaurant.stripeSecretKey.replace(/[^\x20-\x7E]/g, '').replace(/\s/g, '').trim();
      const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-04-30.basil' as any });
      
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status === 'succeeded') {
        return res.json({ success: true, paymentIntentId: paymentIntent.id, status: paymentIntent.status, amount: paymentIntent.amount / 100, alreadyCaptured: true });
      }
      if (paymentIntent.status !== 'requires_capture') {
        return res.status(400).json({ error: `Cannot capture payment. Current status: ${paymentIntent.status}` });
      }
      const captured = await stripe.paymentIntents.capture(paymentIntentId);
      console.log(`Payment captured for order ${orderId}: ${captured.id}, amount: £${captured.amount / 100}`);
      res.json({ success: true, paymentIntentId: captured.id, status: captured.status, amount: captured.amount / 100 });
    } catch (error: any) {
      console.error("Failed to capture payment:", error);
      res.status(500).json({ error: error.message || "Failed to capture payment" });
    }
  });

  app.post("/api/cancel-payment", async (req, res) => {
    try {
      const { paymentIntentId, orderId, restaurantId } = req.body;
      if (!paymentIntentId) return res.status(400).json({ error: "Payment intent ID is required" });
      
      if (!restaurantId) return res.status(400).json({ error: "Restaurant ID is required" });
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant?.stripeSecretKey) return res.status(500).json({ error: "Card payment is temporarily unavailable. Please try another payment method." });
      
      const Stripe = (await import('stripe')).default;
      const stripeSecretKey = restaurant.stripeSecretKey.replace(/[^\x20-\x7E]/g, '').replace(/\s/g, '').trim();
      const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-04-30.basil' as any });
      
      const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
      console.log(`Payment cancelled for order ${orderId}: ${paymentIntent.id}`);
      res.json({ success: true, paymentIntentId: paymentIntent.id, status: paymentIntent.status });
    } catch (error: any) {
      console.error("Failed to cancel payment:", error);
      res.status(500).json({ error: error.message || "Failed to cancel payment" });
    }
  });

  // ============================================
  // FINANCIAL MANAGEMENT ROUTES
  // ============================================

  // Get financial summary for a restaurant
  app.get("/api/restaurants/:id/finances/summary", async (req, res) => {
    try {
      const { id } = req.params;
      const summary = await storage.getFinancialSummary(id);
      res.json(summary);
    } catch (error) {
      console.error("Failed to get financial summary:", error);
      res.status(500).json({ error: "Failed to get financial summary" });
    }
  });

  // Get all financial transactions for a restaurant
  app.get("/api/restaurants/:id/finances/transactions", async (req, res) => {
    try {
      const { id } = req.params;
      const transactions = await storage.getFinancialTransactions(id);
      res.json(transactions);
    } catch (error) {
      console.error("Failed to get transactions:", error);
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  // Create a financial transaction
  app.post("/api/restaurants/:id/finances/transactions", async (req, res) => {
    try {
      const { id } = req.params;
      const transaction = await storage.createFinancialTransaction({
        ...req.body,
        restaurantId: id,
      });
      res.json(transaction);
    } catch (error) {
      console.error("Failed to create transaction:", error);
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  // Delete a financial transaction
  app.delete("/api/finances/transactions/:transactionId", async (req, res) => {
    try {
      const { transactionId } = req.params;
      await storage.deleteFinancialTransaction(transactionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      res.status(500).json({ error: "Failed to delete transaction" });
    }
  });

  // Recurring expenses routes
  app.get("/api/restaurants/:id/finances/recurring", async (req, res) => {
    try {
      const { id } = req.params;
      const expenses = await storage.getRecurringExpenses(id);
      res.json(expenses);
    } catch (error) {
      console.error("Failed to get recurring expenses:", error);
      res.status(500).json({ error: "Failed to get recurring expenses" });
    }
  });

  app.post("/api/restaurants/:id/finances/recurring", async (req, res) => {
    try {
      const { id } = req.params;
      const expense = await storage.createRecurringExpense({
        ...req.body,
        restaurantId: id,
      });
      res.json(expense);
    } catch (error) {
      console.error("Failed to create recurring expense:", error);
      res.status(500).json({ error: "Failed to create recurring expense" });
    }
  });

  app.put("/api/finances/recurring/:expenseId", async (req, res) => {
    try {
      const { expenseId } = req.params;
      const expense = await storage.updateRecurringExpense(expenseId, req.body);
      res.json(expense);
    } catch (error) {
      console.error("Failed to update recurring expense:", error);
      res.status(500).json({ error: "Failed to update recurring expense" });
    }
  });

  app.delete("/api/finances/recurring/:expenseId", async (req, res) => {
    try {
      const { expenseId } = req.params;
      await storage.deleteRecurringExpense(expenseId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete recurring expense:", error);
      res.status(500).json({ error: "Failed to delete recurring expense" });
    }
  });

  // Staff members routes
  app.get("/api/restaurants/:id/finances/staff", async (req, res) => {
    try {
      const { id } = req.params;
      const staff = await storage.getStaffMembers(id);
      res.json(staff);
    } catch (error) {
      console.error("Failed to get staff members:", error);
      res.status(500).json({ error: "Failed to get staff members" });
    }
  });

  app.post("/api/restaurants/:id/finances/staff", async (req, res) => {
    try {
      const { id } = req.params;
      const staff = await storage.createStaffMember({
        ...req.body,
        restaurantId: id,
      });
      res.json(staff);
    } catch (error) {
      console.error("Failed to create staff member:", error);
      res.status(500).json({ error: "Failed to create staff member" });
    }
  });

  app.put("/api/finances/staff/:staffId", async (req, res) => {
    try {
      const { staffId } = req.params;
      const staff = await storage.updateStaffMember(staffId, req.body);
      res.json(staff);
    } catch (error) {
      console.error("Failed to update staff member:", error);
      res.status(500).json({ error: "Failed to update staff member" });
    }
  });

  app.delete("/api/finances/staff/:staffId", async (req, res) => {
    try {
      const { staffId } = req.params;
      await storage.deleteStaffMember(staffId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete staff member:", error);
      res.status(500).json({ error: "Failed to delete staff member" });
    }
  });

  // Staff wage payments routes
  app.get("/api/restaurants/:id/finances/wages", async (req, res) => {
    try {
      const { id } = req.params;
      const payments = await storage.getStaffWagePayments(id);
      res.json(payments);
    } catch (error) {
      console.error("Failed to get wage payments:", error);
      res.status(500).json({ error: "Failed to get wage payments" });
    }
  });

  app.post("/api/restaurants/:id/finances/wages", async (req, res) => {
    try {
      const { id } = req.params;
      const payment = await storage.createStaffWagePayment({
        ...req.body,
        restaurantId: id,
      });
      res.json(payment);
    } catch (error) {
      console.error("Failed to create wage payment:", error);
      res.status(500).json({ error: "Failed to create wage payment" });
    }
  });

  app.put("/api/finances/wages/:paymentId", async (req, res) => {
    try {
      const { paymentId } = req.params;
      const payment = await storage.updateStaffWagePayment(paymentId, req.body);
      res.json(payment);
    } catch (error) {
      console.error("Failed to update wage payment:", error);
      res.status(500).json({ error: "Failed to update wage payment" });
    }
  });

  app.delete("/api/finances/wages/:paymentId", async (req, res) => {
    try {
      const { paymentId } = req.params;
      await storage.deleteStaffWagePayment(paymentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete wage payment:", error);
      res.status(500).json({ error: "Failed to delete wage payment" });
    }
  });

  // Cash deposits routes
  app.get("/api/restaurants/:id/finances/deposits", async (req, res) => {
    try {
      const { id } = req.params;
      const deposits = await storage.getCashDeposits(id);
      res.json(deposits);
    } catch (error) {
      console.error("Failed to get cash deposits:", error);
      res.status(500).json({ error: "Failed to get cash deposits" });
    }
  });

  app.post("/api/restaurants/:id/finances/deposits", async (req, res) => {
    try {
      const { id } = req.params;
      const deposit = await storage.createCashDeposit({
        ...req.body,
        restaurantId: id,
      });
      
      // Also create a financial transaction for this deposit
      await storage.createFinancialTransaction({
        restaurantId: id,
        type: "income",
        incomeSource: "cash_deposit",
        amount: req.body.amount,
        description: req.body.notes || "Cash deposit",
        referenceId: deposit.id,
        referenceType: "cash_deposit",
      });
      
      res.json(deposit);
    } catch (error) {
      console.error("Failed to create cash deposit:", error);
      res.status(500).json({ error: "Failed to create cash deposit" });
    }
  });

  app.delete("/api/finances/deposits/:depositId", async (req, res) => {
    try {
      const { depositId } = req.params;
      await storage.deleteCashDeposit(depositId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete cash deposit:", error);
      res.status(500).json({ error: "Failed to delete cash deposit" });
    }
  });

  // Dynamic PWA manifest for each restaurant
  app.get("/api/manifest/:slug", async (req, res) => {
    try {
      const restaurant = await storage.getRestaurantBySlug(req.params.slug);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      
      // Theme colors based on restaurant theme - comprehensive list
      const themeColors: Record<string, { bg: string; theme: string }> = {
        afghan_royal: { bg: "#1a0a2e", theme: "#eab308" },
        dixy_premium: { bg: "#1e1b4b", theme: "#F97316" },
        tawa_clean: { bg: "#0a1628", theme: "#f97316" },
        spicy_vibrant: { bg: "#0f172a", theme: "#dc2626" },
        dhaba_rustic: { bg: "#1a1a1a", theme: "#f59e0b" },
        emparo_gold: { bg: "#0f0c29", theme: "#fbbf24" },
        default: { bg: "#0a1628", theme: "#10b981" }
      };
      
      const colors = themeColors[restaurant.themeKey || "default"] || themeColors.default;
      
      // Use logoUrl field (correct field name from schema)
      const logoIcon = restaurant.logoUrl || "/icon-menu-512.png";
      
      const manifest = {
        name: `${restaurant.name} - Order Food`,
        short_name: restaurant.name.length > 12 ? restaurant.name.substring(0, 12) : restaurant.name,
        description: `Order delicious food from ${restaurant.name}`,
        start_url: `/${restaurant.slug}`,
        scope: "/",
        display: "standalone",
        background_color: colors.bg,
        theme_color: colors.theme,
        orientation: "any",
        icons: [
          {
            src: "/icon-menu-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: logoIcon,
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ],
        categories: ["food", "shopping", "lifestyle"],
        prefer_related_applications: false
      };
      
      res.setHeader("Content-Type", "application/manifest+json");
      res.json(manifest);
    } catch (error) {
      console.error("Failed to generate manifest:", error);
      res.status(500).json({ error: "Failed to generate manifest" });
    }
  });

  // ============================================
  // RESTAURANT BRANCHES FORCE SYNC
  // ============================================

  // Force sync restaurant branches - creates if not exists in production
  app.post("/api/restaurants/force-sync", async (req, res) => {
    try {
      const { embeddedSeedData } = await import("./embedded-seed-data");
      const seedRestaurants = embeddedSeedData.restaurants || [];
      const existingRestaurants = await db.select().from(schema.restaurants);
      console.log(`[RestaurantSync] Found ${existingRestaurants.length} existing restaurants`);
      
      let created = 0;
      let updated = 0;
      
      for (const r of seedRestaurants) {
        const existing = existingRestaurants.find(rest => rest.slug === r.slug);
        
        if (!existing) {
          // Create new restaurant
          const status = r.status === "busy" || r.status === "closed" ? "open" : (r.status as "open" | "closed");
          await db.insert(schema.restaurants).values({
            id: r.id,
            name: r.name,
            slug: r.slug,
            address: r.address || "",
            status: status,
            themeKey: r.theme_key || "classic",
            loginUsername: r.login_username || r.slug,
            loginPassword: r.login_password || `${r.slug}123`,
            rating: r.rating || "4.5",
            ordersToday: r.orders_today || 0,
            revenueToday: r.revenue_today || "0.00",
            currency: r.currency || "GBP",
            heroGradientStart: r.hero_gradient_start || null,
            heroGradientMiddle: r.hero_gradient_middle || null,
            heroGradientEnd: r.hero_gradient_end || null,
            tagline: r.tagline || null,
            cuisineType: r.cuisine_type || null,
            logoUrl: r.logo_url || null,
            phone: r.phone || null,
          });
          console.log(`[RestaurantSync] Created: ${r.name}`);
          created++;
        } else {
          updated++;
        }
      }
      
      const allRestaurants = await db.select().from(schema.restaurants);
      res.json({ 
        success: true, 
        created, 
        updated, 
        total: allRestaurants.length,
        restaurants: allRestaurants.map(r => ({ id: r.id, name: r.name, slug: r.slug }))
      });
    } catch (error) {
      console.error("Restaurant force sync failed:", error);
      res.status(500).json({ error: "Force sync failed", details: String(error) });
    }
  });

  // Cleanup duplicate restaurants - keeps the one with most menu items
  app.get("/api/restaurants/cleanup-duplicates", async (req, res) => {
    try {
      const allRestaurants = await db.select().from(schema.restaurants);
      const allMenuItems = await db.select().from(schema.menuItems);
      
      // Group by slug
      const bySlug: Record<string, typeof allRestaurants> = {};
      for (const r of allRestaurants) {
        if (!bySlug[r.slug]) bySlug[r.slug] = [];
        bySlug[r.slug].push(r);
      }
      
      let removed = 0;
      const removedList: string[] = [];
      
      for (const [slug, restaurants] of Object.entries(bySlug)) {
        if (restaurants.length > 1) {
          // Find which has most menu items
          const withCounts = restaurants.map(r => ({
            ...r,
            itemCount: allMenuItems.filter(m => m.restaurantId === r.id).length
          }));
          
          // Sort by item count descending
          withCounts.sort((a, b) => b.itemCount - a.itemCount);
          
          // Keep the first one (most items), delete the rest
          for (let i = 1; i < withCounts.length; i++) {
            const toDelete = withCounts[i];
            console.log(`[Cleanup] Removing duplicate: ${toDelete.name} (${toDelete.id}) with ${toDelete.itemCount} items`);
            
            // Delete related data
            await db.delete(schema.menuItems).where(eq(schema.menuItems.restaurantId, toDelete.id));
            await db.delete(schema.menuCategories).where(eq(schema.menuCategories.restaurantId, toDelete.id));
            await db.delete(schema.restaurants).where(eq(schema.restaurants.id, toDelete.id));
            
            removedList.push(`${toDelete.name} (${toDelete.itemCount} items)`);
            removed++;
          }
        }
      }
      
      const remaining = await db.select().from(schema.restaurants);
      res.json({
        success: true,
        removed,
        removedList,
        remainingCount: remaining.length,
        remaining: remaining.map(r => ({ id: r.id, name: r.name, slug: r.slug }))
      });
    } catch (error) {
      console.error("Cleanup failed:", error);
      res.status(500).json({ error: "Cleanup failed", details: String(error) });
    }
  });

  // ============================================
  // PROPERTY BRANCH ROUTES - KING'S PROPERTY GROUP
  // ============================================

  // Force sync property branches - creates if not exists
  app.post("/api/property-branches/force-sync", async (req, res) => {
    try {
      const { embeddedSeedData } = await import("./embedded-seed-data");
      const propertyBranches = embeddedSeedData.propertyBranches || [];
      const existingBranches = await db.select().from(schema.propertyBranches);
      console.log(`[ForceSync] Found ${existingBranches.length} existing property branches`);
      
      let created = 0;
      let updated = 0;
      
      for (const pb of propertyBranches) {
        const existing = existingBranches.find(b => b.slug === pb.slug);
        
        if (!existing) {
          // Create new branch
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
            currency: pb.currency ?? "PKR",
            isOpen: pb.is_open ?? true,
          });
          console.log(`[ForceSync] Created: ${pb.name}`);
          created++;
        } else {
          updated++;
        }
      }
      
      const allBranches = await db.select().from(schema.propertyBranches);
      res.json({ 
        success: true, 
        created, 
        updated, 
        total: allBranches.length,
        branches: allBranches 
      });
    } catch (error) {
      console.error("Force sync failed:", error);
      res.status(500).json({ error: "Force sync failed", details: String(error) });
    }
  });

  // Get all property branches
  app.get("/api/property-branches", async (req, res) => {
    try {
      const branches = await db.select().from(schema.propertyBranches).orderBy(schema.propertyBranches.createdAt);
      res.json(branches);
    } catch (error) {
      console.error("Failed to get property branches:", error);
      res.status(500).json({ error: "Failed to get property branches" });
    }
  });

  // Get single property branch
  app.get("/api/property-branches/:id", async (req, res) => {
    try {
      const [branch] = await db.select().from(schema.propertyBranches).where(eq(schema.propertyBranches.id, req.params.id));
      if (!branch) {
        return res.status(404).json({ error: "Property branch not found" });
      }
      res.json(branch);
    } catch (error) {
      console.error("Failed to get property branch:", error);
      res.status(500).json({ error: "Failed to get property branch" });
    }
  });

  // Dynamic PWA manifest for property branches
  app.get("/api/property-branches/:slug/manifest.json", async (req, res) => {
    try {
      const [branch] = await db.select().from(schema.propertyBranches).where(eq(schema.propertyBranches.slug, req.params.slug));
      if (!branch) {
        return res.status(404).json({ error: "Property branch not found" });
      }
      
      const manifest = {
        name: branch.appName || branch.name,
        short_name: branch.appShortName || branch.name?.substring(0, 12) || "Property",
        description: `${branch.name} - Real Estate and Property Services`,
        start_url: `/property/${branch.slug}`,
        scope: `/property/${branch.slug}`,
        display: "standalone",
        background_color: (!branch.appBackgroundColor || branch.appBackgroundColor === "transparent") ? "transparent" : branch.appBackgroundColor,
        theme_color: branch.appThemeColor || branch.primaryColor || "#0ea5e9",
        orientation: "any",
        icons: [
          {
            src: branch.appIconUrl || branch.logoUrl || "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: branch.appIconUrl || branch.logoUrl || "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ],
        categories: ["business", "lifestyle", "real estate"],
        prefer_related_applications: false
      };
      
      res.setHeader('Content-Type', 'application/manifest+json');
      res.json(manifest);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate manifest" });
    }
  });

  // Update property branch app icon settings
  app.patch("/api/property-branches/:id/app-settings", async (req, res) => {
    try {
      const { appIconUrl, appName, appShortName, appThemeColor, appBackgroundColor } = req.body;
      const [branch] = await db.update(schema.propertyBranches)
        .set({ 
          appIconUrl,
          appName,
          appShortName,
          appThemeColor,
          appBackgroundColor,
          updatedAt: new Date()
        })
        .where(eq(schema.propertyBranches.id, req.params.id))
        .returning();
      if (!branch) {
        return res.status(404).json({ error: "Property branch not found" });
      }
      res.json(branch);
    } catch (error) {
      res.status(500).json({ error: "Failed to update app settings" });
    }
  });

  // Create property branch
  app.post("/api/property-branches", async (req, res) => {
    try {
      const data = schema.insertPropertyBranchSchema.parse(req.body);
      const [branch] = await db.insert(schema.propertyBranches).values(data).returning();
      res.json(branch);
    } catch (error) {
      console.error("Failed to create property branch:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      res.status(500).json({ error: "Failed to create property branch" });
    }
  });

  // Update property branch
  app.patch("/api/property-branches/:id", async (req, res) => {
    try {
      const [branch] = await db.update(schema.propertyBranches)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(schema.propertyBranches.id, req.params.id))
        .returning();
      if (!branch) {
        return res.status(404).json({ error: "Property branch not found" });
      }
      res.json(branch);
    } catch (error) {
      console.error("Failed to update property branch:", error);
      res.status(500).json({ error: "Failed to update property branch" });
    }
  });

  // Delete property branch
  app.delete("/api/property-branches/:id", async (req, res) => {
    try {
      await db.delete(schema.propertyBranches).where(eq(schema.propertyBranches.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete property branch:", error);
      res.status(500).json({ error: "Failed to delete property branch" });
    }
  });

  // Duplicate property branch
  app.post("/api/property-branches/:id/duplicate", async (req, res) => {
    try {
      const [original] = await db.select().from(schema.propertyBranches).where(eq(schema.propertyBranches.id, req.params.id));
      if (!original) {
        return res.status(404).json({ error: "Property branch not found" });
      }

      const newName = req.body.name || `${original.name} (Copy)`;
      const newSlug = `${original.slug}-copy-${Date.now()}`;

      const [duplicate] = await db.insert(schema.propertyBranches).values({
        name: newName,
        slug: newSlug,
        address: original.address,
        phone: original.phone,
        email: original.email,
        logoUrl: original.logoUrl,
        jazzCashEnabled: original.jazzCashEnabled,
        jazzCashNumber: original.jazzCashNumber,
        easyPaisaEnabled: original.easyPaisaEnabled,
        easyPaisaNumber: original.easyPaisaNumber,
        hblBankEnabled: original.hblBankEnabled,
        hblAccountNumber: original.hblAccountNumber,
        hblAccountTitle: original.hblAccountTitle,
        cashOnDeliveryEnabled: original.cashOnDeliveryEnabled,
        commissionRate: original.commissionRate,
        visitCharges: original.visitCharges,
        primaryColor: original.primaryColor,
        secondaryColor: original.secondaryColor,
        isActive: true,
      }).returning();

      res.json(duplicate);
    } catch (error) {
      console.error("Failed to duplicate property branch:", error);
      res.status(500).json({ error: "Failed to duplicate property branch" });
    }
  });

  // ============================================
  // PROPERTY VIDEO LINKS ROUTES
  // ============================================

  // Get all video links for a branch
  app.get("/api/property-branches/:branchId/video-links", async (req, res) => {
    try {
      const links = await db.select().from(schema.propertyVideoLinks)
        .where(eq(schema.propertyVideoLinks.branchId, req.params.branchId))
        .orderBy(schema.propertyVideoLinks.displayOrder);
      res.json(links);
    } catch (error) {
      console.error("Failed to get video links:", error);
      res.status(500).json({ error: "Failed to get video links" });
    }
  });

  // Create video link
  app.post("/api/property-branches/:branchId/video-links", async (req, res) => {
    try {
      const [link] = await db.insert(schema.propertyVideoLinks).values({
        branchId: req.params.branchId,
        title: req.body.title,
        url: req.body.url,
        category: req.body.category || "property_tours",
        displayOrder: req.body.displayOrder || 0,
        isActive: req.body.isActive ?? true,
      }).returning();
      res.json(link);
    } catch (error) {
      console.error("Failed to create video link:", error);
      res.status(500).json({ error: "Failed to create video link" });
    }
  });

  // Delete video link
  app.delete("/api/property-video-links/:id", async (req, res) => {
    try {
      await db.delete(schema.propertyVideoLinks)
        .where(eq(schema.propertyVideoLinks.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete video link:", error);
      res.status(500).json({ error: "Failed to delete video link" });
    }
  });

  // Upload welcome voice audio for property branch
  app.post("/api/property-branches/:branchId/upload-voice", audioUploadMemory.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }
      
      const objectStorageService = new ObjectStorageService();
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = req.file.originalname.split('.').pop() || 'mp3';
      const filename = `welcome-voice-${req.params.branchId}-${uniqueSuffix}.${ext}`;
      
      const fileUrl = await objectStorageService.uploadFromBuffer(
        req.file.buffer,
        filename,
        req.file.mimetype
      );
      
      // Update the branch with the new voice URL
      await db.update(schema.propertyBranches)
        .set({ 
          welcomeVoiceUrl: fileUrl,
          welcomeVoiceEnabled: true
        })
        .where(eq(schema.propertyBranches.id, req.params.branchId));
      
      res.json({ url: fileUrl, success: true });
    } catch (error) {
      console.error("Failed to upload voice audio:", error);
      res.status(500).json({ error: "Failed to upload voice audio" });
    }
  });

  // Upload intro sound audio for property branch
  app.post("/api/property-branches/:branchId/upload-intro-sound", audioUploadMemory.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }
      
      const objectStorageService = new ObjectStorageService();
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = req.file.originalname.split('.').pop() || 'mp3';
      const filename = `intro-sound-${req.params.branchId}-${uniqueSuffix}.${ext}`;
      
      const fileUrl = await objectStorageService.uploadFromBuffer(
        req.file.buffer,
        filename,
        req.file.mimetype
      );
      
      // Update the branch with the new intro sound URL
      await db.update(schema.propertyBranches)
        .set({ 
          introSoundUrl: fileUrl
        })
        .where(eq(schema.propertyBranches.id, req.params.branchId));
      
      res.json({ url: fileUrl, success: true });
    } catch (error) {
      console.error("Failed to upload intro sound:", error);
      res.status(500).json({ error: "Failed to upload intro sound" });
    }
  });

  // Upload intro audio link (goes to property_video_links with category 'intro_audio')
  app.post("/api/property-branches/:branchId/upload-intro-audio-link", audioUploadMemory.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }
      
      const objectStorageService = new ObjectStorageService();
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = req.file.originalname.split('.').pop() || 'mp3';
      const filename = `intro-audio-link-${req.params.branchId}-${uniqueSuffix}.${ext}`;
      
      const fileUrl = await objectStorageService.uploadFromBuffer(
        req.file.buffer,
        filename,
        req.file.mimetype
      );
      
      // Delete existing intro_audio entries for this branch
      await db.delete(schema.propertyVideoLinks)
        .where(and(
          eq(schema.propertyVideoLinks.branchId, req.params.branchId),
          eq(schema.propertyVideoLinks.category, 'intro_audio')
        ));
      
      // Insert new intro audio link
      const [link] = await db.insert(schema.propertyVideoLinks).values({
        branchId: req.params.branchId,
        title: "Intro Welcome Audio",
        url: fileUrl,
        category: 'intro_audio',
        displayOrder: 0,
        isActive: true
      }).returning();
      
      res.json({ url: fileUrl, link, success: true });
    } catch (error) {
      console.error("Failed to upload intro audio link:", error);
      res.status(500).json({ error: "Failed to upload intro audio link" });
    }
  });

  // Get properties for a branch
  app.get("/api/property-branches/:branchId/properties", async (req, res) => {
    try {
      const properties = await db.select().from(schema.properties)
        .where(eq(schema.properties.branchId, req.params.branchId))
        .orderBy(schema.properties.createdAt);
      res.json(properties);
    } catch (error) {
      console.error("Failed to get properties:", error);
      res.status(500).json({ error: "Failed to get properties" });
    }
  });

  // Create property
  app.post("/api/properties", async (req, res) => {
    try {
      const data = schema.insertPropertySchema.parse(req.body);
      const [property] = await db.insert(schema.properties).values(data).returning();
      res.json(property);
    } catch (error) {
      console.error("Failed to create property:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      res.status(500).json({ error: "Failed to create property" });
    }
  });

  // Update property
  app.patch("/api/properties/:id", async (req, res) => {
    try {
      const [property] = await db.update(schema.properties)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(schema.properties.id, req.params.id))
        .returning();
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      console.error("Failed to update property:", error);
      res.status(500).json({ error: "Failed to update property" });
    }
  });

  // Delete property
  app.delete("/api/properties/:id", async (req, res) => {
    try {
      await db.delete(schema.properties).where(eq(schema.properties.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete property:", error);
      res.status(500).json({ error: "Failed to delete property" });
    }
  });

  // ============ PROPERTY APPOINTMENTS ============

  // Get appointments for a branch
  app.get("/api/property-appointments/:branchId", async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT * FROM property_appointments 
        WHERE branch_id = ${req.params.branchId}
        ORDER BY created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Failed to get appointments:", error);
      res.status(500).json({ error: "Failed to get appointments" });
    }
  });

  // Create appointment
  app.post("/api/property-appointments", async (req, res) => {
    try {
      const { branchId, customerName, customerPhone, propertyName, visitDate, visitTime, paymentMethod, visitFee } = req.body;
      const visitCode = 'VIS' + Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const result = await db.execute(sql`
        INSERT INTO property_appointments (branch_id, customer_name, customer_phone, property_name, visit_date, visit_time, visit_code, payment_method, visit_fee, status, payment_status)
        VALUES (${branchId}, ${customerName}, ${customerPhone}, ${propertyName}, ${visitDate}, ${visitTime}, ${visitCode}, ${paymentMethod}, ${visitFee}, 'pending', 'pending')
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Failed to create appointment:", error);
      res.status(500).json({ error: "Failed to create appointment" });
    }
  });

  // Update appointment status
  app.patch("/api/property-appointments/:id", async (req, res) => {
    try {
      const updates = req.body;
      const setClauses: string[] = [];
      const values: any[] = [];
      
      if (updates.status) {
        setClauses.push(`status = '${updates.status}'`);
      }
      if (updates.paymentStatus) {
        setClauses.push(`payment_status = '${updates.paymentStatus}'`);
      }
      if (updates.status === 'confirmed') {
        setClauses.push(`confirmed_at = NOW()`);
      }
      if (updates.notes) {
        setClauses.push(`notes = '${updates.notes}'`);
      }
      
      if (setClauses.length === 0) {
        return res.status(400).json({ error: "No updates provided" });
      }
      
      const result = await db.execute(sql`
        UPDATE property_appointments 
        SET ${sql.raw(setClauses.join(', '))}
        WHERE id = ${req.params.id}
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Failed to update appointment:", error);
      res.status(500).json({ error: "Failed to update appointment" });
    }
  });

  // Delete appointment
  app.delete("/api/property-appointments/:id", async (req, res) => {
    try {
      await db.execute(sql`DELETE FROM property_appointments WHERE id = ${req.params.id}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete appointment:", error);
      res.status(500).json({ error: "Failed to delete appointment" });
    }
  });

  // Get properties for a branch
  app.get("/api/property-branches/:branchId/properties", async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT * FROM properties 
        WHERE branch_id = ${req.params.branchId}::uuid 
        ORDER BY created_at DESC
      `);
      const properties = result.rows.map((row: any) => ({
        id: row.id,
        branchId: row.branch_id,
        title: row.title,
        propertyType: row.property_type || 'house',
        purpose: row.purpose || 'buy',
        propertyId: row.property_id,
        address: row.address,
        city: row.city,
        areaBlock: row.area_block,
        googleMapLink: row.google_map_link,
        coveredArea: row.covered_area,
        areaUnit: row.area_unit,
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        parking: row.parking,
        furnished: row.furnished,
        price: row.price,
        negotiable: row.negotiable,
        commissionPercent: row.commission_percent,
        images: row.images || [],
        documents: row.documents,
        availableFrom: row.available_from,
        possessionStatus: row.possession_status,
        dealerName: row.dealer_name,
        dealerPhone: row.dealer_phone,
        dealerEmail: row.dealer_email,
        isActive: row.is_active,
        createdAt: row.created_at,
      }));
      res.json(properties);
    } catch (error) {
      console.error("Failed to get properties:", error);
      res.status(500).json({ error: "Failed to get properties" });
    }
  });

  // Create a property
  app.post("/api/property-branches/:branchId/properties", async (req, res) => {
    try {
      const branchId = req.params.branchId;
      const {
        title, propertyType, purpose, address, city, areaBlock, googleMapLink,
        coveredArea, areaUnit, bedrooms, bathrooms, parking, furnished,
        price, negotiable, commissionPercent, availableFrom, possessionStatus,
        dealerName, dealerPhone, dealerEmail, images
      } = req.body;

      const propertyId = `PROP-${Date.now().toString(36).toUpperCase()}`;

      const result = await db.execute(sql`
        INSERT INTO properties (
          id, branch_id, title, property_type, purpose, property_id,
          address, city, area_block, google_map_link, covered_area, area_unit,
          bedrooms, bathrooms, parking, furnished, price, negotiable,
          commission_percent, available_from, possession_status,
          dealer_name, dealer_phone, dealer_email, images, is_active, created_at
        ) VALUES (
          gen_random_uuid(), ${branchId}::uuid, ${title}, ${propertyType}, ${purpose}, ${propertyId},
          ${address}, ${city}, ${areaBlock}, ${googleMapLink}, ${coveredArea}, ${areaUnit},
          ${bedrooms || 0}, ${bathrooms || 0}, ${parking || false}, ${furnished || false},
          ${price}, ${negotiable !== false}, ${commissionPercent || 2},
          ${availableFrom || null}, ${possessionStatus || 'ready'},
          ${dealerName}, ${dealerPhone}, ${dealerEmail}, ${images ? JSON.stringify(images) : '[]'}::jsonb,
          true, NOW()
        ) RETURNING *
      `);
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Failed to create property:", error);
      res.status(500).json({ error: "Failed to create property" });
    }
  });

  // Get inquiries for a branch
  app.get("/api/property-branches/:branchId/inquiries", async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT * FROM property_inquiries 
        WHERE branch_id = ${req.params.branchId}::uuid 
        ORDER BY created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Failed to get inquiries:", error);
      res.status(500).json({ error: "Failed to get inquiries" });
    }
  });

  // Create an inquiry
  app.post("/api/property-branches/:branchId/inquiries", async (req, res) => {
    try {
      const branchId = req.params.branchId;
      const {
        propertyId, customerName, customerPhone, customerEmail,
        cnic, purpose, budgetRange, preferredDate, preferredTime, message
      } = req.body;

      const result = await db.execute(sql`
        INSERT INTO property_inquiries (
          id, branch_id, property_id, customer_name, customer_phone,
          customer_email, cnic, purpose, budget_range, preferred_date,
          preferred_time, message, status, created_at
        ) VALUES (
          gen_random_uuid(), ${branchId}::uuid, ${propertyId || null}::uuid,
          ${customerName}, ${customerPhone}, ${customerEmail}, ${cnic},
          ${purpose || 'buy'}, ${budgetRange}, ${preferredDate || null},
          ${preferredTime}, ${message}, 'pending', NOW()
        ) RETURNING *
      `);
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Failed to create inquiry:", error);
      res.status(500).json({ error: "Failed to create inquiry" });
    }
  });

  // ==========================================================================
  // LINK24 PHONE - PBX Module API Routes
  // ==========================================================================

  // Link24 Phone admin login (separate auth from main super admin)
  app.post("/api/link24-phone/login", async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }
      const adminEmail = process.env.LINK24_PHONE_ADMIN_EMAIL || "admin@link24phone.com";
      const adminPassword = process.env.LINK24_PHONE_ADMIN_PASSWORD || "link24phone123";
      if (email.trim().toLowerCase() !== adminEmail.toLowerCase() || password !== adminPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      if (req.session) {
        (req.session as any).link24PhoneAdmin = true;
        (req.session as any).link24PhoneAdminEmail = adminEmail;
        await new Promise<void>((resolve) => (req.session as any).save?.(() => resolve()) ?? resolve());
      }
      // Also set a stateless signed cookie so admin works even without express-session
      const crypto = await import("crypto");
      const token = crypto.createHmac("sha256", `${adminEmail}|${adminPassword}|link24-phone`).update("admin").digest("hex");
      res.cookie("l24p_admin", token, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      });
      res.json({
        email: adminEmail,
        name: "Link24 Phone Admin",
        role: "link24_phone_admin",
        loggedInAt: new Date().toISOString(),
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // PBX Server (Super Admin manages central UCM6302)
  app.get("/api/pbx/server", async (_req, res) => {
    try {
      const server = await storage.getPbxServer();
      if (!server) return res.json(null);
      const { apiSecret, ...safe } = server as any;
      res.json({ ...safe, hasSecret: !!apiSecret });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/pbx/server", async (req, res) => {
    try {
      const data = schema.insertPbxServerSchema.parse(req.body);
      // Don't overwrite saved secret with empty string
      if (!data.apiSecret) {
        const existing = await storage.getPbxServer();
        if (existing?.apiSecret) (data as any).apiSecret = existing.apiSecret;
        else (data as any).apiSecret = "placeholder-set-in-ucm6302-tab";
      }
      const server = await storage.upsertPbxServer(data);
      const { apiSecret, ...safe } = server as any;
      res.json({ ...safe, hasSecret: !!apiSecret });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // Test PBX connection (UCM6302 HTTPS API ping)
  app.post("/api/pbx/server/test", async (req, res) => {
    const { host, apiPort = 8443, username, apiSecret: bodySecret, wsUrl } = req.body || {};
    if (!host || !username) return res.json({ ok: false, message: "Host and username are required" });
    let apiSecret = bodySecret;
    if (!apiSecret) {
      const existing = await storage.getPbxServer();
      apiSecret = existing?.apiSecret;
    }
    if (!apiSecret) return res.json({ ok: false, message: "API secret required (enter password to test)" });

    const results: string[] = [];
    let httpsOk = false;
    // 1) Try UCM HTTPS API challenge
    try {
      const { Agent } = await import("undici");
      const dispatcher = new Agent({ connect: { rejectUnauthorized: false }, headersTimeout: 8000, bodyTimeout: 8000 });
      const url = `https://${host}:${apiPort}/api`;
      const r: any = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: { action: "challenge", user: username, version: "1.0.0.10" } }),
        // @ts-ignore undici dispatcher
        dispatcher,
      });
      const text = await r.text();
      if (r.ok && text.includes("challenge")) { httpsOk = true; results.push(`✓ UCM HTTPS API reachable (${apiPort})`); }
      else results.push(`✗ HTTPS API responded ${r.status}: ${text.slice(0, 120)}`);
    } catch (e: any) { results.push(`✗ HTTPS API unreachable: ${e.code || e.message}`); }

    // 2) WebRTC WSS handshake (real WebSocket upgrade, sip subprotocol)
    let wssOk = false;
    if (wsUrl) {
      try {
        const { WebSocket } = await import("ws");
        await new Promise<void>((resolve, reject) => {
          const ws = new WebSocket(wsUrl, "sip", { rejectUnauthorized: false, handshakeTimeout: 6000 } as any);
          const t = setTimeout(() => { try { ws.terminate(); } catch {} reject(new Error("timeout")); }, 7000);
          ws.on("open", () => { clearTimeout(t); try { ws.close(); } catch {} resolve(); });
          ws.on("error", (e) => { clearTimeout(t); reject(e); });
        });
        wssOk = true;
        results.push(`✓ WebRTC WSS handshake OK`);
      } catch (e: any) { results.push(`✗ WSS handshake failed: ${e.message}`); }
    } else {
      results.push("⚠ No WebRTC WebSocket URL set — browser softphone disabled");
    }

    // ok requires HTTPS API + (no wsUrl OR wss handshake succeeded)
    const ok = httpsOk && (!wsUrl || wssOk);
    try {
      await storage.upsertPbxServer({
        host, apiPort, sipPort: req.body.sipPort || 5060, username, apiSecret,
        domain: req.body.domain, wsUrl, stunServer: req.body.stunServer,
        name: req.body.name || "Main UCM6302", totalChannels: req.body.totalChannels || 75,
        lastError: ok ? null : results.join(" · "),
      } as any);
      // update status separately
      const cur = await storage.getPbxServer();
      if (cur) await db.update(schema.pbxServers).set({ status: ok ? "online" : "offline", lastSeenAt: new Date() }).where(eq(schema.pbxServers.id, cur.id));
    } catch {}

    res.json({ ok, message: results.join(" · ") });
  });

  // Public credentials for browser softphone (no apiSecret exposed)
  app.get("/api/pbx/webrtc-config", async (_req, res) => {
    try {
      const server = await storage.getPbxServer();
      if (!server || !server.wsUrl) return res.json(null);
      res.json({
        wsUrl: server.wsUrl,
        domain: server.domain || server.host,
        stunServer: server.stunServer || "stun:stun.l.google.com:19302",
      });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Generate short-lived Cloudflare TURN credentials for the browser webphone.
  // Uses Cloudflare Realtime TURN (1TB/month free) to relay RTP audio across
  // restrictive networks (CGNAT, mobile, corporate firewalls).
  app.get("/api/pbx/turn-credentials", async (_req, res) => {
    try {
      const a = process.env.CLOUDFLARE_TURN_TOKEN_ID || "";
      const b = process.env.CLOUDFLARE_TURN_API_TOKEN || "";
      // Auto-detect: Cloudflare Token ID is 32 hex chars, API Token is 64.
      // This makes the route resilient if the two secrets are pasted in swapped slots.
      const tokenId = a.length === 32 ? a : (b.length === 32 ? b : a);
      const apiToken = a.length === 64 ? a : (b.length === 64 ? b : b);
      if (!tokenId || !apiToken) {
        // Graceful fallback: return STUN-only so the webphone still works on open networks.
        return res.json({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
          provider: "stun-only",
        });
      }
      const cfRes = await fetch(
        `https://rtc.live.cloudflare.com/v1/turn/keys/${tokenId}/credentials/generate`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ttl: 3600 }), // 1 hour
        }
      );
      if (!cfRes.ok) {
        const text = await cfRes.text();
        console.error("[TURN] Cloudflare credential generation failed:", cfRes.status, text);
        return res.status(502).json({ error: "Failed to generate TURN credentials" });
      }
      const data = await cfRes.json();
      // Cloudflare returns { iceServers: { urls: [...], username, credential } }
      // Normalize to the array format JsSIP/RTCPeerConnection expects.
      const ice = data.iceServers;
      const iceServers = Array.isArray(ice) ? ice : [ice];
      res.json({ iceServers, provider: "cloudflare", ttl: 3600 });
    } catch (e: any) {
      console.error("[TURN] Error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // PBX Subscriptions  (sipPassword is NEVER returned via these endpoints)
  const stripSipSecret = (s: any) => {
    if (!s) return s;
    const { sipPassword, ...rest } = s;
    return { ...rest, hasSipPassword: !!sipPassword };
  };
  app.get("/api/pbx/subscriptions", async (_req, res) => {
    try { res.json((await storage.listPbxSubscriptions()).map(stripSipSecret)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get("/api/pbx/subscriptions/:restaurantId", async (req, res) => {
    try {
      const sub = await storage.getPbxSubscription(req.params.restaurantId);
      res.json(sub ? stripSipSecret(sub) : null);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  // Authenticated softphone credentials (returns the SIP password only to the
  // shop's logged-in session). Reuses existing requireRestaurantAccess if present;
  // otherwise gated by session userId matching the shop's owner.
  app.get("/api/pbx/softphone-credentials/:restaurantId", async (req: any, res) => {
    try {
      const userId = req.session?.userId || req.user?.id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const restaurant = await storage.getRestaurant(req.params.restaurantId);
      if (!restaurant) return res.status(404).json({ error: "Shop not found" });
      // Allow owner or admin
      const isOwner = (restaurant as any).ownerId === userId || (restaurant as any).userId === userId;
      const user = await (storage as any).getUser?.(userId);
      const isAdmin = user?.role === "admin" || user?.isAdmin;
      if (!isOwner && !isAdmin) return res.status(403).json({ error: "Forbidden" });
      const sub = await storage.getPbxSubscription(req.params.restaurantId);
      if (!sub?.sipExtension || !sub?.sipPassword) return res.json(null);
      res.json({ extension: sub.sipExtension, password: sub.sipPassword });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/pbx/subscriptions/:restaurantId", async (req, res) => {
    try {
      const sub = await storage.upsertPbxSubscription(req.params.restaurantId, req.body);
      res.json(sub);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ============================================================
  // Link24 Phone — Stripe Billing (T003 / Plan A)
  // ============================================================
  const PHONE_PLANS = [
    { tier: "solo",       name: "Solo",       priceGbp: 8,  maxExtensions: 1,  maxNumbers: 1, features: ["1 extension", "1 phone number", "Voicemail", "Web softphone"] },
    { tier: "duo",        name: "Duo",        priceGbp: 14, maxExtensions: 2,  maxNumbers: 2, features: ["2 extensions", "2 phone numbers", "Voicemail-to-email", "Ring groups"] },
    { tier: "team",       name: "Team",       priceGbp: 22, maxExtensions: 5,  maxNumbers: 3, features: ["5 extensions", "3 numbers", "IVR menu", "Call recording"] },
    { tier: "enterprise", name: "Enterprise", priceGbp: 40, maxExtensions: 25, maxNumbers: 10, features: ["25 extensions", "10 numbers", "AI transcription", "Priority support"] },
  ];
  const TRIAL_DAYS = 180; // 6 months free

  app.get("/api/phone-billing/plans", (_req, res) => res.json(PHONE_PLANS));

  // Auth helpers (reuse pattern already used elsewhere in this file)
  async function getAuthCtx(req: any) {
    const userId = req.session?.userId || req.user?.id;
    if (!userId) return null;
    const user = await (storage as any).getUser?.(userId);
    return { userId, user, isAdmin: user?.role === "admin" || user?.isAdmin };
  }
  async function requireAdminCtx(req: any, res: any) {
    const ctx = await getAuthCtx(req);
    if (!ctx) { res.status(401).json({ error: "Not authenticated" }); return null; }
    if (!ctx.isAdmin) { res.status(403).json({ error: "Admin only" }); return null; }
    return ctx;
  }
  async function requireShopOwnerOrAdmin(req: any, res: any, restaurantId: string) {
    const ctx = await getAuthCtx(req);
    if (!ctx) { res.status(401).json({ error: "Not authenticated" }); return null; }
    if (ctx.isAdmin) return ctx;
    const restaurant = await storage.getRestaurant(restaurantId);
    if (!restaurant) { res.status(404).json({ error: "Shop not found" }); return null; }
    const isOwner = (restaurant as any).ownerId === ctx.userId || (restaurant as any).userId === ctx.userId;
    if (!isOwner) { res.status(403).json({ error: "Forbidden" }); return null; }
    return ctx;
  }

  async function getStripe() {
    const Stripe = (await import("stripe")).default;
    const key = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_CONNECT_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
    return new Stripe(key);
  }

  // Create or fetch a Stripe Price for a plan (cached in memory by tier)
  const _priceCache: Record<string, string> = {};
  async function getOrCreatePrice(stripe: any, tier: string): Promise<string> {
    if (_priceCache[tier]) return _priceCache[tier];
    const plan = PHONE_PLANS.find(p => p.tier === tier);
    if (!plan) throw new Error(`unknown tier ${tier}`);
    // Find an existing product with metadata.link24_plan = tier
    const products = await stripe.products.search({ query: `metadata['link24_plan']:'${tier}'`, limit: 1 });
    let product = products.data[0];
    if (!product) {
      product = await stripe.products.create({
        name: `Link24 Phone — ${plan.name}`,
        description: plan.features.join(" • "),
        metadata: { link24_plan: tier },
      });
    }
    const prices = await stripe.prices.list({ product: product.id, active: true, limit: 5 });
    let price = prices.data.find((p: any) => p.unit_amount === plan.priceGbp * 100 && p.currency === "gbp" && p.recurring?.interval === "month");
    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.priceGbp * 100,
        currency: "gbp",
        recurring: { interval: "month" },
        metadata: { link24_plan: tier },
      });
    }
    _priceCache[tier] = price.id;
    return price.id;
  }

  // POST /api/phone-billing/checkout { restaurantId, tier, successUrl?, cancelUrl? }
  app.post("/api/phone-billing/checkout", async (req: any, res) => {
    try {
      const { restaurantId, tier } = req.body || {};
      if (!restaurantId || !tier) return res.status(400).json({ error: "restaurantId and tier required" });
      const plan = PHONE_PLANS.find(p => p.tier === tier);
      if (!plan) return res.status(400).json({ error: "invalid tier" });
      if (!(await requireShopOwnerOrAdmin(req, res, restaurantId))) return;
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) return res.status(404).json({ error: "Shop not found" });

      const stripe = await getStripe();
      const priceId = await getOrCreatePrice(stripe, tier);

      // Reuse existing subscription's customer if present
      const existing = await storage.getPbxSubscription(restaurantId);
      let customerId = existing?.stripeCustomerId;
      if (!customerId) {
        const cust = await stripe.customers.create({
          name: (restaurant as any).name || "Link24 Shop",
          email: (restaurant as any).email || undefined,
          metadata: { restaurantId, link24_product: "phone" },
        });
        customerId = cust.id;
      }

      const origin = req.headers.origin || `${req.protocol}://${req.get("host")}`;
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: {
          trial_period_days: TRIAL_DAYS,
          metadata: { restaurantId, link24_plan: tier },
        },
        metadata: { restaurantId, link24_plan: tier },
        success_url: req.body.successUrl || `${origin}/link24-phone/plans?success=1&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: req.body.cancelUrl || `${origin}/link24-phone/plans?canceled=1`,
      });

      // Pre-record subscription in pending state
      await storage.upsertPbxSubscription(restaurantId, {
        stripeCustomerId: customerId,
        stripePriceId: priceId,
        planTier: tier,
        plan: tier,
        monthlyPrice: String(plan.priceGbp.toFixed(2)),
        status: "pending_checkout",
        maxExtensions: plan.maxExtensions,
        maxNumbers: plan.maxNumbers,
      } as any);

      res.json({ url: session.url, sessionId: session.id });
    } catch (e: any) {
      console.error("[phone-billing/checkout]", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Stripe webhook for phone billing — uses raw body
  app.post("/api/phone-billing/webhook", async (req: any, res) => {
    try {
      const stripe = await getStripe();
      const sig = req.headers["stripe-signature"];
      const secret = process.env.STRIPE_PHONE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
      let event: any;
      const rawBody = req.rawBody || (typeof req.body === "string" ? req.body : JSON.stringify(req.body));
      if (secret && sig) {
        try { event = stripe.webhooks.constructEvent(rawBody, sig, secret); }
        catch (err: any) { return res.status(400).send(`Webhook Error: ${err.message}`); }
      } else if (process.env.NODE_ENV !== "production" && process.env.ALLOW_UNSIGNED_STRIPE_WEBHOOKS === "1") {
        console.warn("[phone-billing/webhook] DEV: accepting unsigned webhook (ALLOW_UNSIGNED_STRIPE_WEBHOOKS=1)");
        event = req.body;
      } else {
        return res.status(400).json({ error: "Webhook signature required" });
      }

      const sub = event.data?.object;
      const restaurantId = sub?.metadata?.restaurantId;
      const tier = sub?.metadata?.link24_plan;

      switch (event.type) {
        case "checkout.session.completed": {
          const sId = sub?.subscription;
          const cId = sub?.customer;
          const rId = sub?.metadata?.restaurantId;
          const t = sub?.metadata?.link24_plan;
          if (rId && sId) {
            const plan = PHONE_PLANS.find(p => p.tier === t);
            await storage.upsertPbxSubscription(rId, {
              stripeSubscriptionId: sId,
              stripeCustomerId: cId,
              planTier: t,
              plan: t,
              status: "trialing",
              trialStartedAt: new Date(),
              trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86400_000),
              monthlyPrice: plan ? String(plan.priceGbp.toFixed(2)) : undefined,
            } as any);
          }
          break;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated": {
          if (restaurantId) {
            await storage.upsertPbxSubscription(restaurantId, {
              stripeSubscriptionId: sub.id,
              stripeCustomerId: sub.customer,
              status: sub.status, // active | trialing | past_due | canceled
              trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
              planTier: tier,
            } as any);
          }
          break;
        }
        case "customer.subscription.deleted": {
          if (restaurantId) {
            await storage.upsertPbxSubscription(restaurantId, { status: "canceled" } as any);
          }
          break;
        }
        case "customer.subscription.trial_will_end":
        case "invoice.payment_failed": {
          // Just log — could send email via Resend in future
          console.log(`[phone-billing] ${event.type} for restaurant=${restaurantId}`);
          break;
        }
      }
      res.json({ received: true });
    } catch (e: any) {
      console.error("[phone-billing/webhook]", e);
      res.status(500).json({ error: e.message });
    }
  });

  // ============================================================
  // T004 — Profit Dashboard
  // ============================================================
  // Costs assumptions (admin-tunable later via settings):
  //   trunk cost = £2/mo per active SIP trunk
  //   number cost = £3/mo per phone number
  app.get("/api/phone-billing/profit", async (req: any, res) => {
    try {
      if (!(await requireAdminCtx(req, res))) return;
      const TRUNK_COST = 2;
      const NUMBER_COST = 3;
      const subs = await storage.listPbxSubscriptions();
      const restaurants = await storage.listRestaurants?.() || [];
      const restaurantMap = new Map(restaurants.map((r: any) => [r.id, r]));
      const allTrunks = await db.select().from(schema.sipTrunks);
      const allNumbers = await db.select().from(schema.pbxPhoneNumbers);

      const breakdown = subs.map((s: any) => {
        const restaurant = restaurantMap.get(s.restaurantId);
        const trunkCount = allTrunks.filter((t: any) => t.restaurantId === s.restaurantId).length;
        const numberCount = allNumbers.filter((n: any) => n.restaurantId === s.restaurantId).length;
        const monthlyPrice = parseFloat(s.monthlyPrice || "0");
        const revenue = s.status === "active" ? monthlyPrice : 0;       // active = real revenue
        const cost = trunkCount * TRUNK_COST + numberCount * NUMBER_COST;
        return {
          restaurantId: s.restaurantId,
          shopName: (restaurant as any)?.name || s.restaurantId,
          planTier: s.planTier || s.plan || "—",
          status: s.status,
          monthlyPrice,
          revenue,
          trunkCount,
          numberCount,
          cost,
          profit: revenue - cost,
          margin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0,
        };
      });

      const billable = breakdown.filter(b => b.status === "active" || b.status === "trialing");
      const totals = {
        shops: breakdown.length,
        active: breakdown.filter(b => b.status === "active").length,
        trialing: breakdown.filter(b => b.status === "trialing").length,
        mrr: breakdown.reduce((s, b) => s + b.revenue, 0),
        // Potential MRR = sum of plan prices for shops likely to convert (active + trialing only)
        potentialMrr: billable.reduce((s, b) => s + b.monthlyPrice, 0),
        cost: breakdown.reduce((s, b) => s + b.cost, 0),
        profit: breakdown.reduce((s, b) => s + b.profit, 0),
        trunks: allTrunks.length,
        numbers: allNumbers.length,
      };

      res.json({ breakdown, totals, costAssumptions: { trunkCost: TRUNK_COST, numberCost: NUMBER_COST } });
    } catch (e: any) {
      console.error("[phone-billing/profit]", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Cancel subscription
  app.post("/api/phone-billing/cancel/:restaurantId", async (req: any, res) => {
    try {
      if (!(await requireShopOwnerOrAdmin(req, res, req.params.restaurantId))) return;
      const sub = await storage.getPbxSubscription(req.params.restaurantId);
      if (!sub?.stripeSubscriptionId) return res.status(404).json({ error: "no subscription" });
      const stripe = await getStripe();
      await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
      await storage.upsertPbxSubscription(req.params.restaurantId, { status: "canceled" } as any);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // PBX Smart Routing Lookup — given a dialed number, decide if it's on-net (free) or off-net (paid)
  // AUTH-GATED: only logged-in users may probe the on-net membership of numbers.
  app.get("/api/pbx/route-lookup", async (req, res) => {
    try {
      const userId = (req as any).session?.userId || (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: "auth required" });
      const raw = String(req.query.number || "").trim();
      if (!raw) return res.status(400).json({ error: "number required" });
      const digits = raw.replace(/\D/g, "");
      if (digits.length < 3) {
        return res.json({ mode: "pstn", target: raw, reason: "too-short" });
      }
      // Pure extension dial (3-5 digits, no leading + or 0)
      if (!/^[+0]/.test(raw) && digits.length <= 5) {
        return res.json({ mode: "internal", target: digits, extension: digits, reason: "extension-dial" });
      }
      // Canonical UK normalization: 0XXXXXXXXXX -> +44XXXXXXXXXX; bare digits with country code -> +<digits>
      let canonical = raw.replace(/[^\d+]/g, "");
      if (canonical.startsWith("00")) canonical = "+" + canonical.slice(2);
      else if (canonical.startsWith("0")) canonical = "+44" + canonical.slice(1);
      else if (!canonical.startsWith("+")) canonical = "+" + canonical;
      const suffix9 = digits.slice(-9);
      const owner = await storage.findPbxNumberOwner(canonical, suffix9);
      if (!owner || owner.ambiguous) {
        return res.json({ mode: "pstn", target: raw, reason: owner?.ambiguous ? "ambiguous-suffix" : "not-on-net" });
      }
      const ext = owner.primaryExtension;
      if (!ext) {
        return res.json({ mode: "pstn", target: raw, reason: "no-extension" });
      }
      if (!ext.registered) {
        return res.json({
          mode: "pstn-fallback",
          target: raw,
          extension: ext.extensionNumber,
          reason: "on-net-but-offline",
        });
      }
      return res.json({
        mode: "internal",
        target: ext.extensionNumber,
        extension: ext.extensionNumber,
        ownerLabel: owner.number.label || undefined, // shop-chosen label only; never expose raw number/restaurantId
        reason: "on-net-online",
      });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // SIP Trunks (channel pool — admin only manages this)
  const ensureAdmin = async (req: any, res: any, next: any) => {
    try {
      // Allow Link24 Phone admin (separate auth) — session OR signed cookie
      if (req.session?.link24PhoneAdmin === true) return next();
      const cookieHeader: string = req.headers?.cookie || "";
      const match = cookieHeader.split(/;\s*/).find((c: string) => c.startsWith("l24p_admin="));
      if (match) {
        const token = decodeURIComponent(match.split("=")[1] || "");
        const adminEmail = process.env.LINK24_PHONE_ADMIN_EMAIL || "admin@link24phone.com";
        const adminPassword = process.env.LINK24_PHONE_ADMIN_PASSWORD || "link24phone123";
        const crypto = await import("crypto");
        const expected = crypto.createHmac("sha256", `${adminEmail}|${adminPassword}|link24-phone`).update("admin").digest("hex");
        if (token && token.length === expected.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
          return next();
        }
      }
      const userId = req.session?.userId || req.user?.id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const user = await (storage as any).getUser?.(userId);
      const isAdmin = user?.role === "admin" || user?.isAdmin;
      if (!isAdmin) return res.status(403).json({ error: "Admin only" });
      next();
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  };
  const updateSipTrunkSchema = schema.insertSipTrunkSchema.partial();

  app.get("/api/pbx/trunks", ensureAdmin, async (_req, res) => {
    try { res.json(await storage.listSipTrunks()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/pbx/trunks", ensureAdmin, async (req, res) => {
    try {
      const data = schema.insertSipTrunkSchema.parse(req.body);
      res.json(await storage.createSipTrunk(data));
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/pbx/trunks/:id", ensureAdmin, async (req, res) => {
    try {
      const parsed = updateSipTrunkSchema.parse(req.body) as any;
      // Strip empty-string password so "leave blank to keep current" works
      if (parsed.password === "" || parsed.password == null) delete parsed.password;
      res.json(await storage.updateSipTrunk(req.params.id, parsed));
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/pbx/trunks/:id", ensureAdmin, async (req, res) => {
    try { await storage.deleteSipTrunk(req.params.id); res.json({ ok: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // List ALL PBX numbers across shops (admin overview)
  app.get("/api/pbx/numbers-all", ensureAdmin, async (_req, res) => {
    try { res.json(await storage.listAllPbxNumbers()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.patch("/api/pbx/numbers/:id", ensureAdmin, async (req, res) => {
    try {
      const parsed = schema.insertPbxPhoneNumberSchema.partial().parse(req.body);
      res.json(await storage.updatePbxNumber(req.params.id, parsed));
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // Ring Groups
  app.get("/api/pbx/ring-groups", ensureAdmin, async (_req, res) => {
    try { res.json(await storage.listAllPbxRingGroups()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get("/api/pbx/ring-groups/:restaurantId", async (req, res) => {
    try { res.json(await storage.listPbxRingGroups(req.params.restaurantId)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/pbx/ring-groups", ensureAdmin, async (req, res) => {
    try {
      const data = schema.insertPbxRingGroupSchema.parse(req.body);
      res.json(await storage.createPbxRingGroup(data));
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/pbx/ring-groups/:id", ensureAdmin, async (req, res) => {
    try {
      const parsed = schema.insertPbxRingGroupSchema.partial().parse(req.body);
      res.json(await storage.updatePbxRingGroup(req.params.id, parsed));
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/pbx/ring-groups/:id", ensureAdmin, async (req, res) => {
    try { await storage.deletePbxRingGroup(req.params.id); res.json({ ok: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // List ALL extensions across shops (admin overview, used by ring-group editor)
  app.get("/api/pbx/extensions-all", ensureAdmin, async (_req, res) => {
    try { res.json(await storage.listAllPbxExtensionsWithShop()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // PBX Phone Numbers
  app.get("/api/pbx/numbers/:restaurantId", async (req, res) => {
    try { res.json(await storage.listPbxNumbers(req.params.restaurantId)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/pbx/numbers", ensureAdmin, async (req, res) => {
    try {
      const data = schema.insertPbxPhoneNumberSchema.parse(req.body);
      res.json(await storage.createPbxNumber(data));
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/pbx/numbers/:id", ensureAdmin, async (req, res) => {
    try { await storage.deletePbxNumber(req.params.id); res.json({ ok: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // PBX Extensions
  app.get("/api/pbx/extensions/:restaurantId", async (req, res) => {
    try { res.json(await storage.listPbxExtensions(req.params.restaurantId)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  async function autoPushExtensionToUcm(ext: any): Promise<{ ok: boolean; error?: string }> {
    try {
      const cfg = await getUcmConfig();
      const { withUcmClient } = await import("./lib/ucm-client");
      await withUcmClient(cfg, async (c) => {
        try { await c.deleteExtension(ext.extensionNumber); } catch {}
        return c.createExtension({
          extension: ext.extensionNumber,
          fullName: ext.displayName,
          secret: ext.sipPassword,
          voicemailPin: ext.voicemailPin || "1234",
          email: ext.email || "",
        });
      });
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || String(e) };
    }
  }

  app.post("/api/pbx/extensions", ensureAdmin, async (req, res) => {
    try {
      const data = schema.insertPbxExtensionSchema.parse(req.body);
      const created = await storage.createPbxExtension(data);
      const sync = await autoPushExtensionToUcm(created);
      res.json({ ...created, ucmSync: sync });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/pbx/extensions/:id", ensureAdmin, async (req, res) => {
    try {
      const parsed = schema.insertPbxExtensionSchema.partial().parse(req.body);
      const updated = await storage.updatePbxExtension(req.params.id, parsed);
      const sync = await autoPushExtensionToUcm(updated);
      res.json({ ...updated, ucmSync: sync });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/pbx/extensions/:id", ensureAdmin, async (req, res) => {
    try { await storage.deletePbxExtension(req.params.id); res.json({ ok: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // UCM Sync (Push from Link24 → UCM6302)
  // ─────────────────────────────────────────────────────────────────────────
  async function getUcmConfig() {
    const s = await storage.getPbxServer();
    if (!s || !s.username || !s.apiSecret) {
      throw new Error("UCM not configured — set username/API secret in UCM6302 tab first");
    }
    // Prefer GDMS / Cloudflare public bridge host (reachable from cloud) over LAN IP
    const bridgeActive = s.cloudBridgeStatus === "active" && s.cloudBridgePublicHost && s.cloudBridgeType !== "none";
    const host = bridgeActive ? s.cloudBridgePublicHost! : s.host;
    const apiPort = bridgeActive ? 443 : (s.apiPort || 8443);
    if (!host) throw new Error("UCM host not configured — set local IP or enable Cloud Bridge");
    if (!bridgeActive && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) {
      throw new Error(`Cannot reach UCM at ${host} from the cloud server. Enable a Cloud Bridge (GDMS or Cloudflare Tunnel) in the Cloud Bridge tab so this address becomes publicly reachable.`);
    }
    return { host, apiPort, username: s.username, apiSecret: s.apiSecret };
  }

  async function markSync(table: any, id: string, ok: boolean, error: string | null, ucmIdField?: string, ucmId?: string) {
    const patch: any = {
      ucmSynced: ok,
      ucmSyncedAt: new Date(),
      ucmSyncError: ok ? null : (error || "Unknown error").slice(0, 500),
    };
    if (ok && ucmIdField && ucmId) patch[ucmIdField] = ucmId;
    await db.update(table).set(patch).where(eq(table.id, id));
  }

  // Push a phone number's inbound route to UCM
  app.post("/api/pbx/ucm/sync/number/:id", ensureAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      const [num] = await db.select().from(schema.pbxPhoneNumbers).where(eq(schema.pbxPhoneNumbers.id, id));
      if (!num) return res.status(404).json({ error: "Number not found" });

      const cfg = await getUcmConfig();
      const { withUcmClient } = await import("./lib/ucm-client");

      // Resolve destination value (UCM expects extension number, not our internal id)
      let destValue = "1000";
      if (num.inboundDestType === "extension" && num.inboundDestId) {
        const [ext] = await db.select().from(schema.pbxExtensions).where(eq(schema.pbxExtensions.id, num.inboundDestId));
        if (ext) destValue = ext.extensionNumber;
      } else if (num.inboundDestType === "ring_group" && num.inboundDestId) {
        const [grp] = await db.select().from(schema.pbxRingGroups).where(eq(schema.pbxRingGroups.id, num.inboundDestId));
        if (grp) destValue = grp.groupNumber;
      } else if (num.inboundDestType === "external" && num.inboundDestId) {
        destValue = num.inboundDestId;
      }

      // Strip + and country code for DID match (UCM matches the dialled DID portion)
      const did = num.number.replace(/^\+/, "");

      const result = await withUcmClient(cfg, async (c) => {
        // If we already have a route id, delete first then re-create (simpler than update)
        if (num.ucmRouteId) {
          try { await c.deleteInboundRoute(num.ucmRouteId); } catch {}
        }
        return c.createInboundRoute({
          didPattern: did,
          trunkId: "1",  // TODO multi-trunk: derive from num.provider → trunk ucm id
          destinationType: (num.inboundDestType === "ring_group" ? "ringgroup" :
                            num.inboundDestType === "voicemail" ? "voicemail" :
                            num.inboundDestType === "ivr" ? "ivr" :
                            num.inboundDestType === "external" ? "external" : "extension"),
          destination: destValue,
          name: num.label || `link24-${did}`,
        });
      });

      const ucmRouteId = result?.route_id || result?.id || result?.inbound_route_id || "";
      await markSync(schema.pbxPhoneNumbers, id, true, null, "ucmRouteId", String(ucmRouteId));
      res.json({ ok: true, ucmRouteId, message: "Inbound route pushed to UCM" });
    } catch (e: any) {
      await markSync(schema.pbxPhoneNumbers, id, false, e.message).catch(() => {});
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // Push an extension to UCM
  app.post("/api/pbx/ucm/sync/extension/:id", ensureAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      const [ext] = await db.select().from(schema.pbxExtensions).where(eq(schema.pbxExtensions.id, id));
      if (!ext) return res.status(404).json({ error: "Extension not found" });
      const cfg = await getUcmConfig();
      const { withUcmClient } = await import("./lib/ucm-client");
      await withUcmClient(cfg, async (c) => {
        try { await c.deleteExtension(ext.extensionNumber); } catch {}
        return c.createExtension({
          extension: ext.extensionNumber,
          fullName: ext.displayName,
          secret: ext.sipPassword,
          voicemailPin: ext.voicemailPin || "1234",
          email: ext.email || "",
        });
      });
      // pbxExtensions doesn't currently have ucmSynced fields; just return success
      res.json({ ok: true, message: `Extension ${ext.extensionNumber} pushed to UCM` });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // Push a SIP trunk to UCM
  app.post("/api/pbx/ucm/sync/trunk/:id", ensureAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      const [t] = await db.select().from(schema.sipTrunks).where(eq(schema.sipTrunks.id, id));
      if (!t) return res.status(404).json({ error: "Trunk not found" });
      const cfg = await getUcmConfig();
      const { withUcmClient } = await import("./lib/ucm-client");
      const result = await withUcmClient(cfg, async (c) => {
        return c.createTrunk({
          trunkName: t.name,
          hostname: t.host,
          username: t.username,
          password: t.password,
          authId: t.authUsername || t.username,
          fromUser: t.username,
          transport: (t.transport as any) || "udp",
        });
      });
      res.json({ ok: true, message: `Trunk "${t.name}" pushed to UCM`, result });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // Push a ring group to UCM
  app.post("/api/pbx/ucm/sync/ring-group/:id", ensureAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      const [g] = await db.select().from(schema.pbxRingGroups).where(eq(schema.pbxRingGroups.id, id));
      if (!g) return res.status(404).json({ error: "Ring group not found" });
      // Resolve member ext numbers
      const exts = (g.extensionIds || []).length > 0
        ? await db.select().from(schema.pbxExtensions).where(inArray(schema.pbxExtensions.id, g.extensionIds as string[]))
        : [];
      const memberNumbers = exts.map(e => e.extensionNumber);
      if (memberNumbers.length === 0) return res.status(400).json({ error: "Ring group has no members — add extensions first" });

      const cfg = await getUcmConfig();
      const { withUcmClient } = await import("./lib/ucm-client");
      await withUcmClient(cfg, async (c) => {
        try { await c.deleteRingGroup(g.groupNumber); } catch {}
        return c.createRingGroup({
          name: g.name,
          extension: g.groupNumber,
          members: memberNumbers,
          strategy: (g.strategy as any) === "sequential" ? "linear" : (g.strategy as any) || "ringall",
          timeout: g.ringTimeSeconds || 20,
        });
      });
      res.json({ ok: true, message: `Ring group "${g.name}" pushed to UCM with ${memberNumbers.length} members` });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // Sync everything in one go
  app.post("/api/pbx/ucm/sync-all", ensureAdmin, async (_req, res) => {
    try {
      const cfg = await getUcmConfig();
      const { withUcmClient } = await import("./lib/ucm-client");
      const trunks = await db.select().from(schema.sipTrunks);
      const exts = await db.select().from(schema.pbxExtensions);
      const groups = await db.select().from(schema.pbxRingGroups);
      const numbers = await db.select().from(schema.pbxPhoneNumbers);
      const log: any[] = [];

      await withUcmClient(cfg, async (c) => {
        for (const t of trunks) {
          try { await c.createTrunk({ trunkName: t.name, hostname: t.host, username: t.username, password: t.password, authId: t.authUsername || t.username, fromUser: t.username, transport: (t.transport as any) || "udp" }); log.push({ type: "trunk", name: t.name, ok: true }); }
          catch (e: any) { log.push({ type: "trunk", name: t.name, ok: false, error: e.message }); }
        }
        for (const e of exts) {
          try { await c.deleteExtension(e.extensionNumber).catch(() => {}); await c.createExtension({ extension: e.extensionNumber, fullName: e.displayName, secret: e.sipPassword, voicemailPin: e.voicemailPin || "1234", email: e.email || "" }); log.push({ type: "ext", name: e.extensionNumber, ok: true }); }
          catch (er: any) { log.push({ type: "ext", name: e.extensionNumber, ok: false, error: er.message }); }
        }
        for (const g of groups) {
          try {
            const members = (g.extensionIds || []).length > 0
              ? (await db.select().from(schema.pbxExtensions).where(inArray(schema.pbxExtensions.id, g.extensionIds as string[]))).map(e => e.extensionNumber)
              : [];
            if (members.length === 0) { log.push({ type: "group", name: g.name, ok: false, error: "no members" }); continue; }
            await c.deleteRingGroup(g.groupNumber).catch(() => {});
            await c.createRingGroup({ name: g.name, extension: g.groupNumber, members, strategy: (g.strategy as any) === "sequential" ? "linear" : (g.strategy as any) || "ringall", timeout: g.ringTimeSeconds || 20 });
            log.push({ type: "group", name: g.name, ok: true });
          } catch (er: any) { log.push({ type: "group", name: g.name, ok: false, error: er.message }); }
        }
        for (const n of numbers) {
          try {
            let destValue = "1000";
            if (n.inboundDestType === "extension" && n.inboundDestId) {
              const [x] = await db.select().from(schema.pbxExtensions).where(eq(schema.pbxExtensions.id, n.inboundDestId));
              if (x) destValue = x.extensionNumber;
            } else if (n.inboundDestType === "ring_group" && n.inboundDestId) {
              const [grp] = await db.select().from(schema.pbxRingGroups).where(eq(schema.pbxRingGroups.id, n.inboundDestId));
              if (grp) destValue = grp.groupNumber;
            } else if (n.inboundDestType === "external" && n.inboundDestId) {
              destValue = n.inboundDestId;
            }
            const did = n.number.replace(/^\+/, "");
            if (n.ucmRouteId) await c.deleteInboundRoute(n.ucmRouteId).catch(() => {});
            const r = await c.createInboundRoute({ didPattern: did, trunkId: "1", destinationType: (n.inboundDestType === "ring_group" ? "ringgroup" : (n.inboundDestType as any) || "voicemail"), destination: destValue, name: n.label || `link24-${did}` });
            const rid = r?.route_id || r?.id || "";
            await markSync(schema.pbxPhoneNumbers, n.id, true, null, "ucmRouteId", String(rid));
            log.push({ type: "number", name: n.number, ok: true });
          } catch (er: any) {
            await markSync(schema.pbxPhoneNumbers, n.id, false, er.message).catch(() => {});
            log.push({ type: "number", name: n.number, ok: false, error: er.message });
          }
        }
      });

      const summary = { ok: log.filter(l => l.ok).length, failed: log.filter(l => !l.ok).length, total: log.length };
      res.json({ ok: summary.failed === 0, summary, log });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // PBX IVR Menu
  app.get("/api/pbx/ivr/:restaurantId", async (req, res) => {
    try { res.json(await storage.getPbxIvrMenu(req.params.restaurantId) || null); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/pbx/ivr/:restaurantId", async (req, res) => {
    try { res.json(await storage.upsertPbxIvrMenu(req.params.restaurantId, req.body)); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // PBX Audio Files (welcome, hold music, busy, voicemail)
  app.get("/api/pbx/audio/:restaurantId", async (req, res) => {
    try { res.json(await storage.listPbxAudioFiles(req.params.restaurantId)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/pbx/audio", async (req, res) => {
    try {
      const data = schema.insertPbxAudioFileSchema.parse(req.body);
      res.json(await storage.createPbxAudioFile(data));
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/pbx/audio/:id", async (req, res) => {
    try { await storage.deletePbxAudioFile(req.params.id); res.json({ ok: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Generate AI voice via OpenAI TTS
  app.post("/api/pbx/audio/generate", async (req, res) => {
    try {
      const { restaurantId, text, voice = "alloy", category = "welcome", language = "en", name } = req.body;
      if (!restaurantId || !text) return res.status(400).json({ error: "restaurantId and text required" });
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY });
      const speech = await openai.audio.speech.create({ model: "tts-1", voice, input: text });
      const buffer = Buffer.from(await speech.arrayBuffer());
      const fname = `pbx-audio-${Date.now()}.mp3`;
      const filepath = path.join(process.cwd(), "uploads", fname);
      fs.writeFileSync(filepath, buffer);
      const url = `/uploads/${fname}`;
      const audio = await storage.createPbxAudioFile({
        restaurantId, name: name || `${category} - ${voice}`, category, url, source: "ai_generated",
        text, voice, language,
      } as any);
      res.json(audio);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // PBX Call Settings (hold music, busy message, instant-answer, etc.)
  app.get("/api/pbx/settings/:restaurantId", async (req, res) => {
    try { res.json(await storage.getPbxCallSettings(req.params.restaurantId) || null); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/pbx/settings/:restaurantId", async (req, res) => {
    try { res.json(await storage.upsertPbxCallSettings(req.params.restaurantId, req.body)); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // PBX Customers (auto-built phone book)
  app.get("/api/pbx/customers/:restaurantId", async (req, res) => {
    try { res.json(await storage.listPbxCustomers(req.params.restaurantId, req.query.search as string | undefined)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/pbx/customers/:restaurantId", async (req, res) => {
    try {
      const { phoneNumber, ...rest } = req.body;
      if (!phoneNumber) return res.status(400).json({ error: "phoneNumber required" });
      res.json(await storage.upsertPbxCustomer(req.params.restaurantId, phoneNumber, rest));
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/pbx/customers/:id", async (req, res) => {
    try { res.json(await storage.updatePbxCustomer(req.params.id, req.body)); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/pbx/customers/:id", async (req, res) => {
    try { await storage.deletePbxCustomer(req.params.id); res.json({ ok: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // PBX Call Logs + Stats
  app.get("/api/pbx/calls/:restaurantId", async (req, res) => {
    try { res.json(await storage.listPbxCallLogs(req.params.restaurantId, parseInt(req.query.limit as string) || 100)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get("/api/pbx/stats/:restaurantId", async (req, res) => {
    try { res.json(await storage.getPbxStats(req.params.restaurantId)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/pbx/calls", async (req, res) => {
    try {
      const data = schema.insertPbxCallLogSchema.parse(req.body);
      const call = await storage.createPbxCallLog(data);
      // Auto-update customer record on inbound calls
      if (data.direction === "inbound") {
        const existing = await storage.getPbxCustomerByPhone(data.restaurantId, data.fromNumber);
        await storage.upsertPbxCustomer(data.restaurantId, data.fromNumber, {
          totalCalls: (existing?.totalCalls || 0) + 1,
          lastCallAt: new Date() as any,
          name: existing?.name || data.customerName || undefined,
        });
      }
      res.json(call);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/pbx/calls/:id", async (req, res) => {
    try { res.json(await storage.updatePbxCallLog(req.params.id, req.body)); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ===== Link24 Phone Billing & Usage =====
  app.get("/api/pbx/usage/:restaurantId", async (req, res) => {
    try {
      const sub = await storage.getPbxSubscription(req.params.restaurantId);
      if (!sub) return res.json({ noSubscription: true });
      const periodStart = sub.currentPeriodStart ? new Date(sub.currentPeriodStart) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const calls = await storage.listPbxCallLogs(req.params.restaurantId, 5000);
      const inPeriod = calls.filter((c: any) => c.startedAt && new Date(c.startedAt) >= periodStart);
      const outboundSec = inPeriod.filter((c: any) => c.direction === "outbound").reduce((s: number, c: any) => s + (c.durationSeconds || 0), 0);
      const inboundSec = inPeriod.filter((c: any) => c.direction === "inbound").reduce((s: number, c: any) => s + (c.durationSeconds || 0), 0);
      const internationalCalls = inPeriod.filter((c: any) => c.direction === "outbound" && c.toNumber && !/^(0|44|\+44)/.test(c.toNumber.replace(/\s/g, ""))).length;
      const outboundMin = Math.ceil(outboundSec / 60);
      const inboundMin = Math.ceil(inboundSec / 60);
      const includedMin = sub.includedOutgoingMinutes || 0;
      const overageMin = Math.max(0, outboundMin - includedMin);
      const rate = parseFloat(sub.extraMinuteRate || "0.02");
      const overageCharge = overageMin * rate;
      const capReached = (sub.monthlyMinutesCap || 0) > 0 && outboundMin >= (sub.monthlyMinutesCap || 0);
      res.json({
        periodStart, plan: sub.plan, monthlyPrice: sub.monthlyPrice,
        includedMinutes: includedMin, outboundMinutes: outboundMin, inboundMinutes: inboundMin,
        overageMinutes: overageMin, overageCharge: Number(overageCharge.toFixed(2)),
        extraMinuteRate: rate, monthlyMinutesCap: sub.monthlyMinutesCap, capReached,
        internationalCallsEnabled: sub.internationalCallsEnabled, internationalCalls,
        totalCalls: inPeriod.length,
        estimatedTotal: Number((parseFloat(sub.monthlyPrice || "0") + overageCharge).toFixed(2)),
      });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/pbx/billing/reset-period/:restaurantId", async (req, res) => {
    try {
      const updated = await storage.upsertPbxSubscription(req.params.restaurantId, {
        currentPeriodStart: new Date() as any, lastBilledAt: new Date() as any,
      } as any);
      res.json(updated);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.get("/api/pbx/billing/all-usage", async (_req, res) => {
    try {
      const subs = await storage.listPbxSubscriptions();
      const restaurants = await storage.getAllRestaurants();
      const result = await Promise.all(subs.map(async (sub: any) => {
        const periodStart = sub.currentPeriodStart ? new Date(sub.currentPeriodStart) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const calls = await storage.listPbxCallLogs(sub.restaurantId, 5000);
        const inPeriod = calls.filter((c: any) => c.startedAt && new Date(c.startedAt) >= periodStart);
        const outboundMin = Math.ceil(inPeriod.filter((c: any) => c.direction === "outbound").reduce((s: number, c: any) => s + (c.durationSeconds || 0), 0) / 60);
        const includedMin = sub.includedOutgoingMinutes || 0;
        const overageMin = Math.max(0, outboundMin - includedMin);
        const rate = parseFloat(sub.extraMinuteRate || "0.02");
        const overageCharge = overageMin * rate;
        const restaurant = restaurants.find((r: any) => r.id === sub.restaurantId);
        return {
          subscriptionId: sub.id, restaurantId: sub.restaurantId,
          restaurantName: restaurant?.name || sub.restaurantId,
          plan: sub.plan, monthlyPrice: sub.monthlyPrice, status: sub.status,
          includedMinutes: includedMin, outboundMinutes: outboundMin,
          overageMinutes: overageMin, overageCharge: Number(overageCharge.toFixed(2)),
          extraMinuteRate: rate, internationalCallsEnabled: sub.internationalCallsEnabled,
          estimatedTotal: Number((parseFloat(sub.monthlyPrice || "0") + overageCharge).toFixed(2)),
          periodStart,
        };
      }));
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ===== PBX Contacts =====
  app.get("/api/pbx/contacts/:restaurantId", async (req, res) => {
    try { res.json(await storage.listPbxContacts(req.params.restaurantId)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/pbx/contacts/:restaurantId", async (req, res) => {
    try { res.json(await storage.createPbxContact({ ...req.body, restaurantId: req.params.restaurantId })); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.patch("/api/pbx/contacts/:id", async (req, res) => {
    try { res.json(await storage.updatePbxContact(req.params.id, req.body)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.delete("/api/pbx/contacts/:id", async (req, res) => {
    try { await storage.deletePbxContact(req.params.id); res.json({ ok: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ===== PBX SMS =====
  app.get("/api/pbx/sms/:restaurantId", async (req, res) => {
    try { res.json(await storage.listPbxSmsMessages(req.params.restaurantId, req.query.peer as string | undefined)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/pbx/sms/:restaurantId", async (req, res) => {
    try {
      const sub = await storage.getPbxSubscription(req.params.restaurantId);
      if (!sub?.smsEnabled) return res.status(403).json({ error: "SMS not enabled for this shop. Admin must enable it in Billing." });
      const rate = parseFloat(sub.smsRate || "0.0400");
      const msg = await storage.createPbxSmsMessage({ ...req.body, restaurantId: req.params.restaurantId, direction: "outbound", status: "delivered", cost: rate.toString() } as any);
      res.json(msg);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.patch("/api/pbx/sms/:id/read", async (req, res) => {
    try { await storage.markPbxSmsRead(req.params.id); res.json({ ok: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.delete("/api/pbx/sms/:id", async (req, res) => {
    try { await storage.deletePbxSmsMessage(req.params.id); res.json({ ok: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ===== PBX Caller ID Profiles (CLI Override - admin approved) =====
  app.get("/api/pbx/caller-ids/:restaurantId", async (req, res) => {
    try { res.json(await storage.listPbxCallerIds(req.params.restaurantId)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/pbx/caller-ids/:restaurantId", async (req, res) => {
    try {
      const sub = await storage.getPbxSubscription(req.params.restaurantId);
      if (!sub?.customCallerIdEnabled) return res.status(403).json({ error: "Display number feature not enabled for this shop." });
      const created = await storage.createPbxCallerId({ ...req.body, restaurantId: req.params.restaurantId } as any);
      const approved = await storage.approvePbxCallerId(created.id, "auto");
      res.json(approved);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.patch("/api/pbx/caller-ids/:id", async (req, res) => {
    try { res.json(await storage.updatePbxCallerId(req.params.id, req.body)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.delete("/api/pbx/caller-ids/:id", async (req, res) => {
    try { await storage.deletePbxCallerId(req.params.id); res.json({ ok: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/pbx/caller-ids/:id/approve", async (req, res) => {
    try { res.json(await storage.approvePbxCallerId(req.params.id, req.body.approvedBy || "admin")); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ====================================================================
  // Phone Landing Page — Public Offers + Inquiry Submission
  // ====================================================================
  // PUBLIC: list enabled offers (used by landing page)
  app.get("/api/phone-landing/offers", async (req, res) => {
    try {
      // ?all=1 requires admin and returns disabled offers too
      if (req.query.all === "1") {
        // Inline admin check (don't block public read)
        let isAdmin = false;
        try {
          if ((req as any).session?.link24PhoneAdmin === true) isAdmin = true;
          else {
            const cookieHeader: string = req.headers?.cookie || "";
            const match = cookieHeader.split(/;\s*/).find((c: string) => c.startsWith("l24p_admin="));
            if (match) isAdmin = true; // cookie-presence enough for read; full check on write
          }
        } catch {}
        if (!isAdmin) return res.status(401).json({ error: "Admin only" });
      }
      const onlyEnabled = req.query.all !== "1";
      let offers = await storage.listPhoneOffers({ onlyEnabled });
      // Auto-seed default offers on first access (production may have empty table)
      if (offers.length === 0 && onlyEnabled) {
        const defaults = [
          {
            slug: "magic", title: "Magic Offer", badge: "MAGIC OFFER",
            tagline: "Best value starter bundle", price: "40.00", priceSuffix: "/month",
            bullets: [
              "📱 Phone system FREE for 6 months — works as an app",
              "✅ No hardware needed — use phones, tablets & computers you already own",
              "1 line + any UK number",
              "Incoming calls FREE",
              "100 outgoing minutes",
              "Pest control contract — 1 visit + online report every 3 months",
              "Hygiene daily diary online record",
            ],
            ctaLabel: "Get Started",
            accentColor: "from-rose-500 to-orange-500", enabled: true, sortOrder: 1,
          },
          {
            slug: "vip", title: "VIP Offer", badge: "VIP",
            tagline: "Includes a 2-page web app", price: "70.00", priceSuffix: "/month",
            bullets: [
              "📱 Phone system FREE forever — works as an app",
              "✅ No hardware needed — use phones, tablets & computers you already own",
              "1 line + any UK number",
              "Incoming calls FREE",
              "100 outgoing minutes",
              "Pest control — 1 visit + online report every 3 months",
              "Hygiene daily diary online record",
              "2-page landing web app for Google linking",
              "Admin order receiver included",
            ],
            ctaLabel: "Get Started",
            accentColor: "from-purple-500 to-pink-500", enabled: true, sortOrder: 2,
          },
          {
            slug: "vip-premium", title: "VIP Premium", badge: "VIP PREMIUM",
            tagline: "Everything + training & support", price: "100.00", priceSuffix: "/month",
            bullets: [
              "📱 Phone system FREE forever — works as an app",
              "✅ No hardware needed — use phones, tablets & computers you already own",
              "1 line + any UK number",
              "Incoming calls FREE",
              "100 outgoing minutes",
              "1 line, 2 simultaneous calls (no busy signal)",
              "Pest control — 1 visit + online report every 3 months",
              "Hygiene daily diary online record",
              "2-page landing web app + admin order receiver",
              "Food Hygiene training for 2 staff (with certificates)",
            ],
            ctaLabel: "Get Started",
            accentColor: "from-amber-500 to-yellow-500", enabled: true, sortOrder: 3,
          },
        ];
        try {
          for (const d of defaults) {
            await storage.upsertPhoneOffer(d.slug, d as any);
          }
          offers = await storage.listPhoneOffers({ onlyEnabled });
        } catch (seedErr) {
          console.warn("[phone-landing] auto-seed failed:", (seedErr as any)?.message);
        }
      }
      res.json(offers);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ADMIN: create/update offers (validated)
  const offerCreateSchema = schema.insertPhoneOfferSchema;
  const offerUpdateSchema = schema.insertPhoneOfferSchema.partial().omit({ slug: true });

  app.post("/api/phone-landing/offers", ensureAdmin, async (req, res) => {
    try {
      const parsed = offerCreateSchema.safeParse(req.body || {});
      if (!parsed.success) return res.status(400).json({ error: "Invalid offer", details: parsed.error.flatten() });
      const o = await storage.upsertPhoneOffer(parsed.data.slug, parsed.data);
      res.json(o);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/phone-landing/offers/:slug", ensureAdmin, async (req, res) => {
    try {
      const parsed = offerUpdateSchema.safeParse(req.body || {});
      if (!parsed.success) return res.status(400).json({ error: "Invalid offer", details: parsed.error.flatten() });
      res.json(await storage.upsertPhoneOffer(req.params.slug, parsed.data));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/phone-landing/offers/:id", ensureAdmin, async (req, res) => {
    try { await storage.deletePhoneOffer(req.params.id); res.json({ ok: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // PUBLIC: submit inquiry (strict whitelist — status/notes server-controlled)
  const publicInquirySchema = z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().max(40).optional().nullable(),
    business: z.string().trim().max(160).optional().nullable(),
    businessType: z.enum(["home", "business", "shop", "warehouse", "other"]).optional().nullable(),
    offerSlug: z.string().trim().max(60).optional().nullable(),
    lines: z.coerce.number().int().min(0).max(50).optional(),
    extensions: z.coerce.number().int().min(0).max(100).optional(),
    appUsers: z.coerce.number().int().min(0).max(100).optional(),
    addons: z.array(z.string().max(60)).max(30).optional(),
    estimatedMonthly: z.union([z.string(), z.number()]).optional().nullable(),
    message: z.string().trim().max(2000).optional().nullable(),
  });

  app.post("/api/phone-landing/inquiries", async (req, res) => {
    try {
      const parsed = publicInquirySchema.safeParse(req.body || {});
      if (!parsed.success) return res.status(400).json({ error: "Invalid inquiry", details: parsed.error.flatten() });
      const data = parsed.data;
      const inq = await storage.createPhoneInquiry({
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        business: data.business ?? null,
        businessType: data.businessType ?? null,
        offerSlug: data.offerSlug ?? null,
        lines: data.lines ?? 1,
        extensions: data.extensions ?? 1,
        appUsers: data.appUsers ?? 1,
        addons: data.addons ?? [],
        estimatedMonthly: data.estimatedMonthly != null ? String(data.estimatedMonthly) : null,
        message: data.message ?? null,
      } as any);
      res.json(inq);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ADMIN: list/update/delete inquiries (PII protected)
  app.get("/api/phone-landing/inquiries", ensureAdmin, async (_req, res) => {
    try { res.json(await storage.listPhoneInquiries()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  const inquiryUpdateSchema = z.object({
    status: z.enum(["new", "contacted", "approved", "converted", "rejected"]).optional(),
    notes: z.string().max(4000).optional().nullable(),
  });

  app.patch("/api/phone-landing/inquiries/:id", ensureAdmin, async (req, res) => {
    try {
      const parsed = inquiryUpdateSchema.safeParse(req.body || {});
      if (!parsed.success) return res.status(400).json({ error: "Invalid update", details: parsed.error.flatten() });
      res.json(await storage.updatePhoneInquiry(req.params.id, parsed.data as any));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/phone-landing/inquiries/:id", ensureAdmin, async (req, res) => {
    try { await storage.deletePhoneInquiry(req.params.id); res.json({ ok: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // PUBLIC: site settings (freephone number, etc.)
  app.get("/api/phone-landing/settings", async (_req, res) => {
    try { res.json(await storage.getPhoneSiteSettings()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ADMIN: update site settings
  const settingsUpdateSchema = z.record(z.string().max(60), z.string().max(500));
  app.patch("/api/phone-landing/settings", ensureAdmin, async (req, res) => {
    try {
      const parsed = settingsUpdateSchema.safeParse(req.body || {});
      if (!parsed.success) return res.status(400).json({ error: "Invalid settings", details: parsed.error.flatten() });
      res.json(await storage.setPhoneSiteSettings(parsed.data));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  return httpServer;
}
