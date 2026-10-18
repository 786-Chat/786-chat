import type { Express } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";

export function registerInventoryRoutes(app: Express) {

  // ===================== CATEGORIES =====================
  app.get("/api/inventory/categories", async (_req, res) => {
    try {
      const rows = await db.select().from(schema.inventoryCategories).orderBy(schema.inventoryCategories.sortOrder);
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/inventory/categories", async (req, res) => {
    try {
      const data = { ...req.body };
      if (!data.slug && data.name) {
        data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      }
      const [row] = await db.insert(schema.inventoryCategories).values(data).returning();
      res.json(row);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.put("/api/inventory/categories/:id", async (req, res) => {
    try {
      const [row] = await db.update(schema.inventoryCategories).set(req.body).where(eq(schema.inventoryCategories.id, req.params.id)).returning();
      res.json(row);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.delete("/api/inventory/categories/:id", async (req, res) => {
    try {
      await db.delete(schema.inventoryCategories).where(eq(schema.inventoryCategories.id, req.params.id));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ===================== LOCATIONS =====================
  app.get("/api/inventory/locations", async (_req, res) => {
    try {
      const rows = await db.select().from(schema.inventoryLocations).orderBy(desc(schema.inventoryLocations.createdAt));
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/inventory/locations", async (req, res) => {
    try {
      const [row] = await db.insert(schema.inventoryLocations).values(req.body).returning();
      res.json(row);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.put("/api/inventory/locations/:id", async (req, res) => {
    try {
      const [row] = await db.update(schema.inventoryLocations).set(req.body).where(eq(schema.inventoryLocations.id, req.params.id)).returning();
      res.json(row);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.delete("/api/inventory/locations/:id", async (req, res) => {
    try {
      await db.delete(schema.inventoryLocations).where(eq(schema.inventoryLocations.id, req.params.id));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ===================== PRODUCTS =====================
  app.get("/api/inventory/products", async (_req, res) => {
    try {
      const rows = await db.select().from(schema.inventoryProducts).orderBy(desc(schema.inventoryProducts.createdAt));
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get("/api/inventory/products/barcode/:barcode", async (req, res) => {
    try {
      const [row] = await db.select().from(schema.inventoryProducts).where(eq(schema.inventoryProducts.barcode, req.params.barcode));
      if (!row) return res.status(404).json({ error: "Not found", barcode: req.params.barcode });
      res.json(row);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get("/api/inventory/products/:id", async (req, res) => {
    try {
      const [row] = await db.select().from(schema.inventoryProducts).where(eq(schema.inventoryProducts.id, req.params.id));
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json(row);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/inventory/products", async (req, res) => {
    try {
      const data = { ...req.body };
      const base = parseFloat(data.basePrice) || 0;
      const disc = parseFloat(data.discountPercent) || 0;
      data.discountedPrice = (base - (base * disc / 100)).toFixed(2);
      data.currentStock = data.totalManufactured || 0;
      const [product] = await db.insert(schema.inventoryProducts).values(data).returning();
      res.json(product);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.put("/api/inventory/products/:id", async (req, res) => {
    try {
      const data = { ...req.body };
      if (data.basePrice !== undefined || data.discountPercent !== undefined) {
        const [existing] = await db.select().from(schema.inventoryProducts).where(eq(schema.inventoryProducts.id, req.params.id));
        const base = parseFloat(data.basePrice ?? existing?.basePrice ?? "0");
        const disc = parseFloat(data.discountPercent ?? existing?.discountPercent ?? "0");
        data.discountedPrice = (base - (base * disc / 100)).toFixed(2);
      }
      const [row] = await db.update(schema.inventoryProducts).set(data).where(eq(schema.inventoryProducts.id, req.params.id)).returning();
      res.json(row);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.delete("/api/inventory/products/:id", async (req, res) => {
    try {
      await db.delete(schema.inventoryProducts).where(eq(schema.inventoryProducts.id, req.params.id));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Add stock
  app.post("/api/inventory/products/:id/add-stock", async (req, res) => {
    try {
      const { quantity, notes } = req.body;
      const [product] = await db.select().from(schema.inventoryProducts).where(eq(schema.inventoryProducts.id, req.params.id));
      if (!product) return res.status(404).json({ error: "Not found" });
      const prev = product.currentStock || 0;
      const next = prev + (quantity || 0);
      const [updated] = await db.update(schema.inventoryProducts).set({
        currentStock: next, totalManufactured: (product.totalManufactured || 0) + (quantity || 0),
      }).where(eq(schema.inventoryProducts.id, req.params.id)).returning();
      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Dispatch stock
  app.post("/api/inventory/products/:id/dispatch", async (req, res) => {
    try {
      const { quantity, notes, brandId } = req.body;
      const [product] = await db.select().from(schema.inventoryProducts).where(eq(schema.inventoryProducts.id, req.params.id));
      if (!product) return res.status(404).json({ error: "Not found" });
      if ((product.currentStock || 0) < quantity) return res.status(400).json({ error: "Insufficient stock" });
      const prev = product.currentStock || 0;
      const next = prev - quantity;
      const [updated] = await db.update(schema.inventoryProducts).set({
        currentStock: next, totalDispatched: (product.totalDispatched || 0) + quantity,
      }).where(eq(schema.inventoryProducts.id, req.params.id)).returning();
      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Global discount
  app.post("/api/inventory/products/global-discount", async (req, res) => {
    try {
      const { discountPercent } = req.body;
      const products = await db.select().from(schema.inventoryProducts);
      for (const p of products) {
        const base = parseFloat(p.basePrice || "0");
        const discounted = (base - (base * discountPercent / 100)).toFixed(2);
        await db.update(schema.inventoryProducts).set({ discountPercent: discountPercent.toString(), discountedPrice: discounted }).where(eq(schema.inventoryProducts.id, p.id));
      }
      res.json({ success: true, count: products.length, discountPercent });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });


  // ===================== BRANDS =====================
  app.get("/api/inventory/brands", async (_req, res) => {
    try {
      const rows = await db.select().from(schema.inventoryBrands).orderBy(desc(schema.inventoryBrands.createdAt));
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get("/api/inventory/brands/:id", async (req, res) => {
    try {
      const [row] = await db.select().from(schema.inventoryBrands).where(eq(schema.inventoryBrands.id, req.params.id));
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json(row);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/inventory/brands", async (req, res) => {
    try {
      const [row] = await db.insert(schema.inventoryBrands).values(req.body).returning();
      res.json(row);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.put("/api/inventory/brands/:id", async (req, res) => {
    try {
      const [row] = await db.update(schema.inventoryBrands).set(req.body).where(eq(schema.inventoryBrands.id, req.params.id)).returning();
      res.json(row);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.delete("/api/inventory/brands/:id", async (req, res) => {
    try {
      await db.delete(schema.inventoryBrands).where(eq(schema.inventoryBrands.id, req.params.id));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/inventory/brands/duplicate/:id", async (req, res) => {
    try {
      const [original] = await db.select().from(schema.inventoryBrands).where(eq(schema.inventoryBrands.id, req.params.id));
      if (!original) return res.status(404).json({ error: "Not found" });
      const { id, createdAt, slug, ...rest } = original;
      const [dup] = await db.insert(schema.inventoryBrands).values({ ...rest, slug: slug + "-copy-" + Date.now(), name: original.name + " (Copy)" }).returning();
      res.json(dup);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/inventory/brands/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const brands = await db.select().from(schema.inventoryBrands);
      const brand = brands.find(b => b.adminUsername === username && b.adminPassword === password);
      if (!brand) return res.status(401).json({ error: "Invalid credentials" });
      const { adminPassword: _, ...safe } = brand;
      res.json(safe);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ===================== BRAND PRICES =====================
  app.get("/api/inventory/brands/:brandId/prices", async (req, res) => {
    try {
      const rows = await db.select().from(schema.inventoryBrandPrices).where(eq(schema.inventoryBrandPrices.brandId, req.params.brandId));
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/inventory/brand-prices", async (req, res) => {
    try {
      const existing = await db.select().from(schema.inventoryBrandPrices)
        .where(and(eq(schema.inventoryBrandPrices.brandId, req.body.brandId), eq(schema.inventoryBrandPrices.productId, req.body.productId)));
      if (existing.length > 0) {
        const [updated] = await db.update(schema.inventoryBrandPrices).set({ agreedPrice: req.body.agreedPrice }).where(eq(schema.inventoryBrandPrices.id, existing[0].id)).returning();
        return res.json(updated);
      }
      const [row] = await db.insert(schema.inventoryBrandPrices).values(req.body).returning();
      res.json(row);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/inventory/brand-prices/:id", async (req, res) => {
    try {
      await db.delete(schema.inventoryBrandPrices).where(eq(schema.inventoryBrandPrices.id, req.params.id));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ===================== CUSTOMERS =====================
  app.get("/api/inventory/brands/:brandId/customers", async (req, res) => {
    try {
      const rows = await db.select().from(schema.inventoryCustomers).where(eq(schema.inventoryCustomers.brandId, req.params.brandId)).orderBy(desc(schema.inventoryCustomers.createdAt));
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/inventory/customers", async (req, res) => {
    try {
      const [row] = await db.insert(schema.inventoryCustomers).values(req.body).returning();
      res.json(row);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.put("/api/inventory/customers/:id", async (req, res) => {
    try {
      const [row] = await db.update(schema.inventoryCustomers).set(req.body).where(eq(schema.inventoryCustomers.id, req.params.id)).returning();
      res.json(row);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.delete("/api/inventory/customers/:id", async (req, res) => {
    try {
      await db.delete(schema.inventoryCustomers).where(eq(schema.inventoryCustomers.id, req.params.id));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ===================== SALES =====================
  app.get("/api/inventory/brands/:brandId/sales", async (req, res) => {
    try {
      const rows = await db.select().from(schema.inventorySales).where(eq(schema.inventorySales.companyId, req.params.brandId)).orderBy(desc(schema.inventorySales.createdAt));
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/inventory/sales", async (req, res) => {
    try {
      const [row] = await db.insert(schema.inventorySales).values(req.body).returning();
      res.json(row);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.get("/api/inventory/all-sales", async (_req, res) => {
    try {
      const rows = await db.select().from(schema.inventorySales).orderBy(desc(schema.inventorySales.createdAt));
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ===================== CUSTOMER LOGIN =====================
  app.post("/api/inventory/customer-login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const [customer] = await db.select().from(schema.inventoryCustomers)
        .where(eq(schema.inventoryCustomers.username, username));
      if (!customer || customer.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      if (!customer.isActive) {
        return res.status(403).json({ error: "Account disabled" });
      }
      res.json(customer);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ===================== ORDERS =====================
  app.post("/api/inventory/orders", async (req, res) => {
    try {
      const [row] = await db.insert(schema.inventoryOrders).values(req.body).returning();
      res.json(row);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.get("/api/inventory/orders/customer/:customerId", async (req, res) => {
    try {
      const rows = await db.select().from(schema.inventoryOrders)
        .where(eq(schema.inventoryOrders.customerId, req.params.customerId))
        .orderBy(desc(schema.inventoryOrders.createdAt));
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get("/api/inventory/orders/brand/:brandId", async (req, res) => {
    try {
      const rows = await db.select().from(schema.inventoryOrders)
        .where(eq(schema.inventoryOrders.brandId, req.params.brandId))
        .orderBy(desc(schema.inventoryOrders.createdAt));
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.put("/api/inventory/orders/:id/status", async (req, res) => {
    try {
      const [row] = await db.update(schema.inventoryOrders)
        .set({ status: req.body.status })
        .where(eq(schema.inventoryOrders.id, req.params.id)).returning();
      res.json(row);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ===================== SEED CHILLPACK =====================
  app.post("/api/inventory/seed-chillpack", async (_req, res) => {
    try {
      const existing = await db.select().from(schema.inventoryBrands).where(eq(schema.inventoryBrands.slug, "chillpack"));
      if (existing.length > 0) return res.json({ message: "ChillPack already seeded", brandId: existing[0].id });

      const [brand] = await db.insert(schema.inventoryBrands).values({
        name: "ChillPack", slug: "chillpack", logo: "/chillpack-logo.png",
        description: "Packaging for Fast Food", phone: "", email: "",
        address: "United Kingdom", contactPerson: "ChillPack Admin",
        adminUsername: "chillpack", adminPassword: "chillpack123",
        primaryColor: "#8B1A1A",
      }).returning();

      const cats = [
        { name: "Chicken & Burger Boxes", slug: "chicken-burger-boxes", sortOrder: 1 },
        { name: "Cheese", slug: "cheese", sortOrder: 2 },
        { name: "Buns", slug: "buns", sortOrder: 3 },
        { name: "Beef Burgers", slug: "beef-burgers", sortOrder: 4 },
        { name: "Cleaning Supplies", slug: "cleaning-supplies", sortOrder: 5 },
        { name: "Drinks & Beverages", slug: "drinks-beverages", sortOrder: 6 },
        { name: "Chips & Fries", slug: "chips-fries", sortOrder: 7 },
        { name: "Pizza Boxes", slug: "pizza-boxes", sortOrder: 8 },
        { name: "Sauce Cups & Containers", slug: "sauce-cups", sortOrder: 9 },
        { name: "Lunch & Doner Boxes", slug: "lunch-doner-boxes", sortOrder: 10 },
      ];
      const catMap: Record<string, string> = {};
      for (const c of cats) {
        const [row] = await db.insert(schema.inventoryCategories).values(c).returning();
        catMap[c.slug] = row.id;
      }

      const products = [
        { name: "FC1 Chicken Boxes", code: "FC1", categoryId: catMap["chicken-burger-boxes"], unitType: "boxes", basePrice: "0", totalManufactured: 100 },
        { name: "FC0 Chicken Boxes", code: "FC0", categoryId: catMap["chicken-burger-boxes"], unitType: "boxes", basePrice: "0", totalManufactured: 100 },
        { name: "FC3 Chicken Boxes", code: "FC3", categoryId: catMap["chicken-burger-boxes"], unitType: "boxes", basePrice: "0", totalManufactured: 100 },
        { name: "Family Bucket", code: "FB1", categoryId: catMap["chicken-burger-boxes"], unitType: "boxes", basePrice: "0", totalManufactured: 100 },
        { name: "TD4.5 Boxes", code: "TD45", categoryId: catMap["chicken-burger-boxes"], unitType: "boxes", basePrice: "0", totalManufactured: 100 },
        { name: "TD5 Boxes", code: "TD5", categoryId: catMap["chicken-burger-boxes"], unitType: "boxes", basePrice: "0", totalManufactured: 100 },
        { name: "TD9 Boxes", code: "TD9", categoryId: catMap["chicken-burger-boxes"], unitType: "boxes", basePrice: "0", totalManufactured: 100 },
        { name: "TD10 Boxes", code: "TD10", categoryId: catMap["chicken-burger-boxes"], unitType: "boxes", basePrice: "0", totalManufactured: 100 },
        { name: "HQ10 Boxes", code: "HQ10", categoryId: catMap["chicken-burger-boxes"], unitType: "boxes", basePrice: "0", totalManufactured: 100 },
        { name: "FC0 Liners", code: "FC0L", categoryId: catMap["chicken-burger-boxes"], unitType: "boxes", basePrice: "0", totalManufactured: 100 },
        { name: "Mozzarella/Cheddar 80/20 (Prima)", code: "CHZ1", categoryId: catMap["cheese"], unitType: "pieces", basePrice: "10.80", totalManufactured: 50 },
        { name: "Slices Kerrymaid Burger Cheese (112SL)", code: "CHZ2", categoryId: catMap["cheese"], unitType: "packets", basePrice: "0", totalManufactured: 50 },
        { name: "Americana Seeded Buns 4\" (48)", code: "BUN1", categoryId: catMap["buns"], unitType: "packets", basePrice: "0", totalManufactured: 80 },
        { name: "Americana Seeded Buns 4.5\" (48)", code: "BUN2", categoryId: catMap["buns"], unitType: "packets", basePrice: "0", totalManufactured: 80 },
        { name: "Kara Seeded Buns 5\" (48)", code: "BUN3", categoryId: catMap["buns"], unitType: "packets", basePrice: "0", totalManufactured: 80 },
        { name: "Kara MK4 Seeded Buns 4\" (48)", code: "BUN4", categoryId: catMap["buns"], unitType: "packets", basePrice: "0", totalManufactured: 80 },
        { name: "Halal Beef Burger Basic Economy 4oz (113g x48)", code: "BRG1", categoryId: catMap["beef-burgers"], unitType: "boxes", basePrice: "0", totalManufactured: 60 },
        { name: "Halal Beef Burger Basic Economy 2oz (56g x48)", code: "BRG2", categoryId: catMap["beef-burgers"], unitType: "boxes", basePrice: "0", totalManufactured: 60 },
        { name: "Halal Beef Burger US Classic 4oz (113g x48)", code: "BRG3", categoryId: catMap["beef-burgers"], unitType: "boxes", basePrice: "0", totalManufactured: 60 },
        { name: "Halal Beef Burger US Classic 2oz (56g x48)", code: "BRG4", categoryId: catMap["beef-burgers"], unitType: "boxes", basePrice: "0", totalManufactured: 60 },
        { name: "Halal Gourmet Burger Paragon 6oz (170g x30)", code: "BRG5", categoryId: catMap["beef-burgers"], unitType: "boxes", basePrice: "0", totalManufactured: 60 },
        { name: "Pot Scorer (1x10)", code: "CLN1", categoryId: catMap["cleaning-supplies"], unitType: "packets", basePrice: "0", totalManufactured: 40 },
        { name: "Apron (200)", code: "CLN2", categoryId: catMap["cleaning-supplies"], unitType: "boxes", basePrice: "0", totalManufactured: 40 },
        { name: "Washing Up Liquid (2x5ltr)", code: "CLN3", categoryId: catMap["cleaning-supplies"], unitType: "pieces", basePrice: "0", totalManufactured: 40 },
        { name: "Green Pads (1x10)", code: "CLN4", categoryId: catMap["cleaning-supplies"], unitType: "packets", basePrice: "0", totalManufactured: 40 },
        { name: "Spray Deepio 6x750ML", code: "CLN5", categoryId: catMap["cleaning-supplies"], unitType: "boxes", basePrice: "0", totalManufactured: 40 },
        { name: "Caustic Soda Bucket 5kg", code: "CLN6", categoryId: catMap["cleaning-supplies"], unitType: "pieces", basePrice: "0", totalManufactured: 40 },
        { name: "Large Blue Gloves (100)", code: "CLN7", categoryId: catMap["cleaning-supplies"], unitType: "boxes", basePrice: "0", totalManufactured: 40 },
        { name: "Deepio Powder 6kg", code: "CLN8", categoryId: catMap["cleaning-supplies"], unitType: "pieces", basePrice: "0", totalManufactured: 40 },
        { name: "Yellow Sponge", code: "CLN9", categoryId: catMap["cleaning-supplies"], unitType: "pieces", basePrice: "0", totalManufactured: 40 },
        { name: "Bleach (2x5ltr)", code: "CLN10", categoryId: catMap["cleaning-supplies"], unitType: "pieces", basePrice: "0", totalManufactured: 40 },
        { name: "Fiesta Water", code: "DRK1", categoryId: catMap["drinks-beverages"], unitType: "boxes", basePrice: "0", totalManufactured: 100 },
        { name: "Umdah Juice Mango 250ml", code: "DRK2", categoryId: catMap["drinks-beverages"], unitType: "boxes", basePrice: "0", totalManufactured: 100 },
        { name: "Aviko Super Crunch Chips 2500g", code: "CHP1", categoryId: catMap["chips-fries"], unitType: "boxes", basePrice: "0", totalManufactured: 80 },
        { name: "Pizza Boxes", code: "PZA1", categoryId: catMap["pizza-boxes"], unitType: "boxes", basePrice: "0", totalManufactured: 100 },
        { name: "Sauce Cups", code: "SC1", categoryId: catMap["sauce-cups"], unitType: "boxes", basePrice: "0", totalManufactured: 100 },
        { name: "Lunch Boxes", code: "LB1", categoryId: catMap["lunch-doner-boxes"], unitType: "boxes", basePrice: "0", totalManufactured: 100 },
        { name: "Doner Kebab Boxes", code: "DK1", categoryId: catMap["lunch-doner-boxes"], unitType: "boxes", basePrice: "0", totalManufactured: 100 },
      ];

      for (const p of products) {
        const data = { ...p, currentStock: p.totalManufactured, lowStockThreshold: 5, discountedPrice: p.basePrice, discountPercent: "0" };
        const [product] = await db.insert(schema.inventoryProducts).values(data).returning();
      }

      res.json({ success: true, brandId: brand.id, categoriesCreated: cats.length, productsCreated: products.length });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
}
