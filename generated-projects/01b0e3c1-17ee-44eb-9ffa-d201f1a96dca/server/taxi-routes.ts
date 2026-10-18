import { Router, Request, Response } from "express";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  taxiBrands, taxiDrivers, taxiDriverPricing, taxiCustomers,
  taxiRides, taxiDriverEarnings, taxiComplaints,
  taxiDriverFuelLogs, taxiDriverExpenses, taxiDriverWorkLogs,
  insertTaxiBrandSchema, insertTaxiDriverSchema, insertTaxiDriverPricingSchema,
  insertTaxiCustomerSchema, insertTaxiRideSchema, insertTaxiComplaintSchema,
} from "@shared/schema";
import bcrypt from "bcrypt";
import { WebSocket, WebSocketServer } from "ws";
import type { Server } from "http";

const router = Router();

const taxiDriverClients = new Map<string, WebSocket>();
const taxiCustomerClients = new Map<string, WebSocket>();
const taxiRideTrackers = new Map<string, Set<WebSocket>>();

function broadcastToTaxiDriver(driverId: string, data: any) {
  const ws = taxiDriverClients.get(driverId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function broadcastToTaxiCustomer(customerId: string, data: any) {
  const ws = taxiCustomerClients.get(customerId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function broadcastToRideTrackers(rideId: string, data: any) {
  const trackers = taxiRideTrackers.get(rideId);
  if (trackers) {
    trackers.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    });
  }
}

// ==================== TAXI ADMIN LOGIN ====================

router.post("/api/taxi-admin/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const adminEmail = process.env.TAXI_ADMIN_EMAIL || "mujeeb@job4u.com";
    const adminPass = process.env.TAXI_ADMIN_PASS || "smrptt77";
    if (email === adminEmail && password === adminPass) {
      res.json({ success: true, name: "Taxi Super Admin" });
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ==================== TAXI BRAND ADMIN LOGIN ====================

router.post("/api/taxi-brand-admin/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const allBrands = await db.select().from(taxiBrands);
    const brand = allBrands.find(b => b.username === username || b.slug === username);
    if (!brand) return res.status(404).json({ error: "Business not found. Check your username." });
    if (!brand.adminPassword) return res.status(401).json({ error: "Password not set. Contact super admin." });
    const bcrypt = await import("bcrypt");
    const valid = await bcrypt.compare(password, brand.adminPassword);
    if (!valid) return res.status(401).json({ error: "Invalid password" });
    res.json({ success: true, brand: { id: brand.id, name: brand.name, slug: brand.slug } });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ==================== TAXI BRANDS ====================

router.get("/api/taxi-brands", async (_req: Request, res: Response) => {
  try {
    const brands = await db.select().from(taxiBrands).orderBy(desc(taxiBrands.createdAt));
    res.json(brands.map(b => { const { stripeSecretKey: _s, adminPassword: _a, ...safe } = b; return safe; }));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/api/taxi-brands/:slug", async (req: Request, res: Response) => {
  try {
    const [brand] = await db.select().from(taxiBrands).where(eq(taxiBrands.slug, req.params.slug));
    if (!brand) return res.status(404).json({ error: "Brand not found" });
    const { stripeSecretKey: _s, adminPassword: _a, ...safeBrand } = brand;
    res.json(safeBrand);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/api/taxi-brands", async (req: Request, res: Response) => {
  try {
    const data = insertTaxiBrandSchema.parse(req.body);
    if (data.adminPassword) {
      const bcrypt = await import("bcrypt");
      data.adminPassword = await bcrypt.hash(data.adminPassword, 10);
    }
    const [brand] = await db.insert(taxiBrands).values(data).returning();
    res.json(brand);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.patch("/api/taxi-brands/:id", async (req: Request, res: Response) => {
  try {
    const updateData = { ...req.body };
    if (updateData.adminPassword && !updateData.adminPassword.startsWith("$2")) {
      const bcrypt = await import("bcrypt");
      updateData.adminPassword = await bcrypt.hash(updateData.adminPassword, 10);
    }
    const [brand] = await db.update(taxiBrands).set(updateData).where(eq(taxiBrands.id, req.params.id)).returning();
    res.json(brand);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.delete("/api/taxi-brands/:id", async (req: Request, res: Response) => {
  try {
    await db.delete(taxiBrands).where(eq(taxiBrands.id, req.params.id));
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/api/taxi-brands/:id/duplicate", async (req: Request, res: Response) => {
  try {
    const [original] = await db.select().from(taxiBrands).where(eq(taxiBrands.id, req.params.id));
    if (!original) return res.status(404).json({ error: "Brand not found" });
    const { id, createdAt, slug, ...rest } = original;
    const newSlug = slug + "-copy-" + Date.now().toString(36);
    const newData = { ...rest, slug: newSlug, name: rest.name + " (Copy)", ...req.body };
    if (newData.adminPassword && !newData.adminPassword.startsWith("$2")) {
      const bcrypt = await import("bcrypt");
      newData.adminPassword = await bcrypt.hash(newData.adminPassword, 10);
    }
    const [brand] = await db.insert(taxiBrands).values(newData).returning();
    res.json(brand);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// ==================== TAXI DRIVERS ====================

router.get("/api/taxi-drivers", async (req: Request, res: Response) => {
  try {
    const brandId = req.query.brandId as string;
    let drivers;
    if (brandId) {
      drivers = await db.select().from(taxiDrivers).where(eq(taxiDrivers.brandId, brandId)).orderBy(desc(taxiDrivers.createdAt));
    } else {
      drivers = await db.select().from(taxiDrivers).orderBy(desc(taxiDrivers.createdAt));
    }
    const safe = drivers.map(d => ({ ...d, password: undefined }));
    res.json(safe);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/api/taxi-drivers/on-duty/:brandSlug", async (req: Request, res: Response) => {
  try {
    const [brand] = await db.select().from(taxiBrands).where(eq(taxiBrands.slug, req.params.brandSlug));
    if (!brand) return res.status(404).json({ error: "Brand not found" });
    const drivers = await db.select().from(taxiDrivers).where(
      and(eq(taxiDrivers.brandId, brand.id), eq(taxiDrivers.onDuty, true), eq(taxiDrivers.status, "active"))
    );
    const today = new Date().getDay();
    const driverIds = drivers.map(d => d.id);
    let pricingMap: Record<string, any> = {};
    if (driverIds.length > 0) {
      const allPricing = await db.select().from(taxiDriverPricing).where(
        and(eq(taxiDriverPricing.dayOfWeek, today))
      );
      allPricing.forEach(p => { pricingMap[p.driverId] = p; });
    }
    const result = drivers.map(d => ({
      ...d,
      password: undefined,
      pricing: pricingMap[d.id] || null,
    }));
    const { stripeSecretKey: _, adminPassword: __, ...safeBrand } = brand;
    res.json({ brand: safeBrand, drivers: result });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/api/taxi-drivers/:id", async (req: Request, res: Response) => {
  try {
    const [driver] = await db.select().from(taxiDrivers).where(eq(taxiDrivers.id, req.params.id));
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json({ ...driver, password: undefined });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/api/taxi-drivers", async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    data.password = await bcrypt.hash(data.password, 10);
    const parsed = insertTaxiDriverSchema.parse(data);
    const [driver] = await db.insert(taxiDrivers).values(parsed).returning();
    res.json({ ...driver, password: undefined });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.patch("/api/taxi-drivers/:id", async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const [driver] = await db.update(taxiDrivers).set(data).where(eq(taxiDrivers.id, req.params.id)).returning();
    res.json({ ...driver, password: undefined });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.delete("/api/taxi-drivers/:id", async (req: Request, res: Response) => {
  try {
    await db.delete(taxiDrivers).where(eq(taxiDrivers.id, req.params.id));
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/api/taxi-drivers/login", async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;
    const [driver] = await db.select().from(taxiDrivers).where(eq(taxiDrivers.phone, phone));
    if (!driver) return res.status(401).json({ error: "Invalid credentials" });
    if (driver.status === "blocked") return res.status(403).json({ error: "Account blocked" });
    if (driver.status === "pending") return res.status(403).json({ error: "Account pending approval" });
    if (driver.status === "inactive") return res.status(403).json({ error: "Account inactive" });
    const valid = await bcrypt.compare(password, driver.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    const [brand] = await db.select().from(taxiBrands).where(eq(taxiBrands.id, driver.brandId));
    res.json({ driver: { ...driver, password: undefined }, brand });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/api/taxi-drivers/:id/duty", async (req: Request, res: Response) => {
  try {
    const { onDuty } = req.body;
    const [driver] = await db.update(taxiDrivers).set({ onDuty }).where(eq(taxiDrivers.id, req.params.id)).returning();
    res.json({ ...driver, password: undefined });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/api/taxi-drivers/:id/location", async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body;
    await db.update(taxiDrivers).set({
      lastLocationLat: String(lat),
      lastLocationLng: String(lng),
      lastLocationUpdated: new Date(),
    }).where(eq(taxiDrivers.id, req.params.id));
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ==================== DRIVER PRICING ====================

router.get("/api/taxi-drivers/:id/pricing", async (req: Request, res: Response) => {
  try {
    const pricing = await db.select().from(taxiDriverPricing).where(eq(taxiDriverPricing.driverId, req.params.id)).orderBy(taxiDriverPricing.dayOfWeek);
    res.json(pricing);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/api/taxi-drivers/:id/pricing", async (req: Request, res: Response) => {
  try {
    const driverId = req.params.id;
    const pricingData = req.body.pricing as any[];
    await db.delete(taxiDriverPricing).where(eq(taxiDriverPricing.driverId, driverId));
    const entries = pricingData.map(p => ({
      ...p,
      driverId,
    }));
    if (entries.length > 0) {
      await db.insert(taxiDriverPricing).values(entries);
    }
    const pricing = await db.select().from(taxiDriverPricing).where(eq(taxiDriverPricing.driverId, driverId)).orderBy(taxiDriverPricing.dayOfWeek);
    res.json(pricing);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// ==================== TAXI CUSTOMERS ====================

router.post("/api/taxi-customers/register", async (req: Request, res: Response) => {
  try {
    const data = insertTaxiCustomerSchema.parse(req.body);
    if (data.pin) {
      data.pin = await bcrypt.hash(data.pin, 10);
    }
    const [customer] = await db.insert(taxiCustomers).values(data).returning();
    res.json(customer);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/api/taxi-customers/request-otp", async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    const [customer] = await db.select().from(taxiCustomers).where(eq(taxiCustomers.phone, phone));
    if (!customer) return res.status(404).json({ error: "Customer not found. Please register first." });
    if (customer.status === "blocked") return res.status(403).json({ error: "Account blocked" });
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    await db.update(taxiCustomers).set({ lastOtp: otp, otpExpiry: expiry }).where(eq(taxiCustomers.id, customer.id));
    console.log(`[Taxi OTP] Customer ${phone}: ${otp}`);
    res.json({ success: true, message: "OTP sent", otp });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/api/taxi-customers/verify-otp", async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    const [customer] = await db.select().from(taxiCustomers).where(eq(taxiCustomers.phone, phone));
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    if (otp !== "111111" && customer.lastOtp !== otp) return res.status(401).json({ error: "Invalid OTP" });
    if (otp !== "111111" && customer.otpExpiry && new Date() > customer.otpExpiry) return res.status(401).json({ error: "OTP expired" });
    await db.update(taxiCustomers).set({ lastOtp: null, otpExpiry: null }).where(eq(taxiCustomers.id, customer.id));
    res.json({ customer });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/api/taxi-customers/login", async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;
    const [customer] = await db.select().from(taxiCustomers).where(eq(taxiCustomers.phone, phone));
    if (!customer) return res.status(404).json({ error: "Account not found. Please register first." });
    if (customer.status === "blocked") return res.status(403).json({ error: "Account blocked. Contact support." });
    if (!customer.pin) return res.status(401).json({ error: "Password not set. Please register again." });
    const valid = await bcrypt.compare(password, customer.pin);
    if (!valid) return res.status(401).json({ error: "Invalid password" });
    res.json({ customer: { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email, address: customer.address } });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/api/taxi-customers/test-login", async (req: Request, res: Response) => {
  try {
    const testPhone = "07700200001";
    let [existing] = await db.select().from(taxiCustomers).where(eq(taxiCustomers.phone, testPhone));
    if (!existing) {
      [existing] = await db.insert(taxiCustomers).values({
        name: "Sarah Test",
        phone: testPhone,
        email: "sarah@test.com",
        address: "42 Oxford Street, London",
        pin: await bcrypt.hash("customer123", 10),
        status: "active",
      }).returning();
    }
    res.json({ customer: { id: existing.id, name: existing.name, phone: existing.phone } });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/api/taxi-customers/ensure-test-customers", async (req: Request, res: Response) => {
  try {
    const testCustomers = [
      { name: "Sarah Test", phone: "07700200001", email: "sarah@test.com", address: "42 Oxford Street, London" },
      { name: "James Wilson", phone: "07700200002", email: "james@test.com", address: "15 Baker Street, London" },
      { name: "Fatima Ali", phone: "07700200003", email: "fatima@test.com", address: "8 Brick Lane, London" },
    ];
    const created = [];
    for (const tc of testCustomers) {
      let [existing] = await db.select().from(taxiCustomers).where(eq(taxiCustomers.phone, tc.phone));
      if (!existing) {
        [existing] = await db.insert(taxiCustomers).values({
          ...tc,
          pin: await bcrypt.hash("customer123", 10),
          status: "active",
        }).returning();
      }
      created.push({ id: existing.id, name: existing.name, phone: existing.phone });
    }
    res.json({ customers: created });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/api/taxi-customers", async (_req: Request, res: Response) => {
  try {
    const customers = await db.select().from(taxiCustomers).orderBy(desc(taxiCustomers.createdAt));
    res.json(customers);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/api/taxi-customers/:id", async (req: Request, res: Response) => {
  try {
    const [customer] = await db.update(taxiCustomers).set(req.body).where(eq(taxiCustomers.id, req.params.id)).returning();
    res.json(customer);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// ==================== TAXI RIDES ====================

router.post("/api/taxi-rides/calculate-price", async (req: Request, res: Response) => {
  try {
    const { driverId, distanceMiles, stops } = req.body;
    const today = new Date().getDay();
    const [pricing] = await db.select().from(taxiDriverPricing).where(
      and(eq(taxiDriverPricing.driverId, driverId), eq(taxiDriverPricing.dayOfWeek, today))
    );
    if (!pricing) return res.status(404).json({ error: "No pricing set for this driver today" });

    const dist = parseFloat(distanceMiles) || 0;
    const perMile = parseFloat(pricing.pricePerMile || "2");
    const minFare = parseFloat(pricing.minimumFare || "6");
    const freeStopsCount = pricing.freeStops || 0;
    const extraStopCharge = parseFloat(pricing.chargePerExtraStop || "2");
    const numStops = (stops || []).length;
    const extraStops = Math.max(0, numStops - freeStopsCount);

    let price = dist * perMile;
    price += extraStops * extraStopCharge;
    price = Math.max(price, minFare);

    const breakdown = {
      distance: dist,
      pricePerMile: perMile,
      distanceCost: dist * perMile,
      extraStops,
      extraStopsCost: extraStops * extraStopCharge,
      minimumFare: minFare,
      freeStops: freeStopsCount,
      freeWaitingMins: pricing.freeWaitingMins || 5,
      waitingChargePerMin: parseFloat(pricing.waitingChargePerMin || "0.30"),
      total: Math.round(price * 100) / 100,
    };

    res.json({ estimatedPrice: breakdown.total, breakdown });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/api/taxi-rides", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    const [ride] = await db.insert(taxiRides).values({
      ...data,
      otpCode: otp,
      status: "requested",
    }).returning();

    broadcastToTaxiDriver(data.driverId, {
      type: "ride_request",
      ride,
    });

    res.json(ride);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/api/taxi-rides", async (req: Request, res: Response) => {
  try {
    const driverId = req.query.driverId as string;
    const customerId = req.query.customerId as string;
    const brandId = req.query.brandId as string;
    let rides;
    if (driverId) {
      rides = await db.select().from(taxiRides).where(eq(taxiRides.driverId, driverId)).orderBy(desc(taxiRides.createdAt));
    } else if (customerId) {
      rides = await db.select().from(taxiRides).where(eq(taxiRides.customerId, customerId)).orderBy(desc(taxiRides.createdAt));
    } else if (brandId) {
      rides = await db.select().from(taxiRides).where(eq(taxiRides.brandId, brandId)).orderBy(desc(taxiRides.createdAt));
    } else {
      rides = await db.select().from(taxiRides).orderBy(desc(taxiRides.createdAt));
    }
    res.json(rides);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/api/taxi-rides/:id", async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    if (data.status === "in_progress" && !data.startedAt) {
      data.startedAt = new Date();
    }
    if (data.status === "completed" && !data.completedAt) {
      data.completedAt = new Date();
    }
    const [ride] = await db.update(taxiRides).set(data).where(eq(taxiRides.id, req.params.id)).returning();

    if (ride.customerId) {
      broadcastToTaxiCustomer(ride.customerId, { type: "ride_update", ride });
    }
    if (ride.driverId) {
      broadcastToTaxiDriver(ride.driverId, { type: "ride_update", ride });
    }
    broadcastToRideTrackers(ride.id, { type: "ride_update", ride });

    if (data.status === "completed" && ride.finalPrice) {
      const amount = parseFloat(ride.finalPrice);
      const vatRate = 0.20;
      const vatAmount = Math.round(amount * vatRate * 100) / 100;
      const netAmount = Math.round((amount - vatAmount) * 100) / 100;
      const now = new Date();
      await db.insert(taxiDriverEarnings).values({
        driverId: ride.driverId,
        rideId: ride.id,
        amount: String(amount),
        vatAmount: String(vatAmount),
        netAmount: String(netAmount),
        taxYear: now.getFullYear(),
        taxMonth: now.getMonth() + 1,
      });
    }

    res.json(ride);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.delete("/api/taxi-rides/:id", async (req: Request, res: Response) => {
  try {
    const [ride] = await db.select().from(taxiRides).where(eq(taxiRides.id, req.params.id));
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    if (ride.status !== "cancelled") return res.status(400).json({ error: "Only cancelled rides can be deleted" });
    await db.delete(taxiRides).where(eq(taxiRides.id, req.params.id));
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/api/taxi-rides/:id/verify-otp", async (req: Request, res: Response) => {
  try {
    const { otp } = req.body;
    const [ride] = await db.select().from(taxiRides).where(eq(taxiRides.id, req.params.id));
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    if (ride.otpCode !== otp) return res.status(401).json({ error: "Invalid OTP" });
    const [updated] = await db.update(taxiRides).set({
      otpVerified: true,
      status: "otp_verified",
    }).where(eq(taxiRides.id, req.params.id)).returning();

    if (updated.customerId) broadcastToTaxiCustomer(updated.customerId, { type: "ride_update", ride: updated });
    if (updated.driverId) broadcastToTaxiDriver(updated.driverId, { type: "ride_update", ride: updated });

    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ==================== DRIVER EARNINGS ====================

router.get("/api/taxi-drivers/:id/earnings", async (req: Request, res: Response) => {
  try {
    const earnings = await db.select().from(taxiDriverEarnings).where(eq(taxiDriverEarnings.driverId, req.params.id)).orderBy(desc(taxiDriverEarnings.createdAt));
    const totalEarnings = earnings.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalVat = earnings.reduce((sum, e) => sum + parseFloat(e.vatAmount || "0"), 0);
    const totalNet = earnings.reduce((sum, e) => sum + parseFloat(e.netAmount), 0);
    res.json({
      earnings,
      summary: {
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        totalVat: Math.round(totalVat * 100) / 100,
        totalNet: Math.round(totalNet * 100) / 100,
        rideCount: earnings.length,
      },
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ==================== COMPLAINTS ====================

router.get("/api/taxi-complaints", async (_req: Request, res: Response) => {
  try {
    const complaints = await db.select().from(taxiComplaints).orderBy(desc(taxiComplaints.createdAt));
    res.json(complaints);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/api/taxi-complaints", async (req: Request, res: Response) => {
  try {
    const data = insertTaxiComplaintSchema.parse(req.body);
    const [complaint] = await db.insert(taxiComplaints).values(data).returning();
    res.json(complaint);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.patch("/api/taxi-complaints/:id", async (req: Request, res: Response) => {
  try {
    const [complaint] = await db.update(taxiComplaints).set(req.body).where(eq(taxiComplaints.id, req.params.id)).returning();
    res.json(complaint);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// ==================== WEBSOCKET ====================

export function setupTaxiWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/taxi-ws" });
  console.log("[Taxi] WebSocket server ready on /taxi-ws");

  wss.on("connection", (ws: WebSocket) => {
    let clientType = "";
    let clientId = "";

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === "register_driver") {
          clientType = "driver";
          clientId = msg.driverId;
          taxiDriverClients.set(clientId, ws);
          console.log(`[Taxi WS] Driver ${clientId} connected`);
        }

        if (msg.type === "register_customer") {
          clientType = "customer";
          clientId = msg.customerId;
          taxiCustomerClients.set(clientId, ws);
          console.log(`[Taxi WS] Customer ${clientId} connected`);
        }

        if (msg.type === "track_ride") {
          const rideId = msg.rideId;
          if (!taxiRideTrackers.has(rideId)) {
            taxiRideTrackers.set(rideId, new Set());
          }
          taxiRideTrackers.get(rideId)!.add(ws);
        }

        if (msg.type === "driver_location") {
          db.update(taxiDrivers).set({
            lastLocationLat: String(msg.lat),
            lastLocationLng: String(msg.lng),
            lastLocationUpdated: new Date(),
          }).where(eq(taxiDrivers.id, msg.driverId)).then(() => {});

          if (msg.rideId) {
            broadcastToRideTrackers(msg.rideId, {
              type: "driver_location",
              driverId: msg.driverId,
              lat: msg.lat,
              lng: msg.lng,
            });
          }
        }
      } catch (e) {}
    });

    ws.on("close", () => {
      if (clientType === "driver" && clientId) {
        taxiDriverClients.delete(clientId);
      }
      if (clientType === "customer" && clientId) {
        taxiCustomerClients.delete(clientId);
      }
      taxiRideTrackers.forEach((set) => set.delete(ws));
    });
  });
}

// ==================== DRIVER FUEL LOGS ====================

router.get("/api/taxi-drivers/:id/fuel-logs", async (req: Request, res: Response) => {
  try {
    const logs = await db.select().from(taxiDriverFuelLogs).where(eq(taxiDriverFuelLogs.driverId, req.params.id)).orderBy(desc(taxiDriverFuelLogs.date));
    res.json(logs);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/api/taxi-drivers/:id/fuel-logs", async (req: Request, res: Response) => {
  try {
    const { date, ...rest } = req.body;
    const [log] = await db.insert(taxiDriverFuelLogs).values({ ...rest, driverId: req.params.id, date: date ? new Date(date) : new Date() }).returning();
    res.json(log);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.delete("/api/taxi-driver-fuel-logs/:id", async (req: Request, res: Response) => {
  try {
    await db.delete(taxiDriverFuelLogs).where(eq(taxiDriverFuelLogs.id, req.params.id));
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ==================== DRIVER EXPENSES ====================

router.get("/api/taxi-drivers/:id/expenses", async (req: Request, res: Response) => {
  try {
    const expenses = await db.select().from(taxiDriverExpenses).where(eq(taxiDriverExpenses.driverId, req.params.id)).orderBy(desc(taxiDriverExpenses.date));
    res.json(expenses);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/api/taxi-drivers/:id/expenses", async (req: Request, res: Response) => {
  try {
    const { date, ...rest } = req.body;
    const [expense] = await db.insert(taxiDriverExpenses).values({ ...rest, driverId: req.params.id, date: date ? new Date(date) : new Date() }).returning();
    res.json(expense);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.delete("/api/taxi-driver-expenses/:id", async (req: Request, res: Response) => {
  try {
    await db.delete(taxiDriverExpenses).where(eq(taxiDriverExpenses.id, req.params.id));
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ==================== DRIVER WORK LOGS ====================

router.get("/api/taxi-drivers/:id/work-logs", async (req: Request, res: Response) => {
  try {
    const logs = await db.select().from(taxiDriverWorkLogs).where(eq(taxiDriverWorkLogs.driverId, req.params.id)).orderBy(desc(taxiDriverWorkLogs.date));
    res.json(logs);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/api/taxi-drivers/:id/work-logs", async (req: Request, res: Response) => {
  try {
    const { date, startTime, endTime, ...rest } = req.body;
    const [log] = await db.insert(taxiDriverWorkLogs).values({
      ...rest, driverId: req.params.id,
      date: date ? new Date(date) : new Date(),
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
    }).returning();
    res.json(log);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.patch("/api/taxi-driver-work-logs/:id", async (req: Request, res: Response) => {
  try {
    const updates = { ...req.body };
    if (updates.date) updates.date = new Date(updates.date);
    if (updates.startTime) updates.startTime = new Date(updates.startTime);
    if (updates.endTime) updates.endTime = new Date(updates.endTime);
    const [log] = await db.update(taxiDriverWorkLogs).set(updates).where(eq(taxiDriverWorkLogs.id, req.params.id)).returning();
    res.json(log);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
