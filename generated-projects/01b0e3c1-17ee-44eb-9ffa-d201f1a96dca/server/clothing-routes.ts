import { Router, Request, Response } from "express";
import { db } from "./db";
import { clothingBrands, clothingCategories, clothingProducts, clothingOrders } from "@shared/schema";
import { eq, and, desc, asc, ilike } from "drizzle-orm";
import { WebSocket, WebSocketServer } from "ws";
import type { Server } from "http";

const router = Router();

const clothingClients = new Map<string, Set<WebSocket>>();

function cleanIBAN(s: any): string {
  if (typeof s !== "string" || !s) return s;
  const upper = s.toUpperCase();
  const allMatches = upper.match(/[A-Z]{2}\d{2}[A-Z0-9]{10,30}/g) || [];
  if (allMatches.length > 0) {
    const pkExact = allMatches.find(m => /^PK\d{2}[A-Z]{4}\d{16}$/.test(m));
    if (pkExact) return pkExact;
    return allMatches.reduce((best, cur) => (cur.length > best.length ? cur : best));
  }
  const stripped = upper.replace(/[^A-Z0-9]/g, "");
  const pkInStripped = stripped.match(/PK\d{2}[A-Z]{4}\d{16}/);
  if (pkInStripped) return pkInStripped[0];
  const generic = stripped.match(/[A-Z]{2}\d{2}[A-Z0-9]{10,30}/);
  return generic ? generic[0] : stripped;
}
function cleanDigits(s: any): string {
  if (typeof s !== "string" || !s) return s;
  const matches = s.match(/\d+/g);
  if (!matches) return "";
  return matches.reduce((longest, cur) => (cur.length > longest.length ? cur : longest), "");
}
function cleanName(s: any): string {
  if (typeof s !== "string" || !s) return s;
  return s
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\d{1,2}[:/]\d{1,2}([:/]\d{1,4})?\s*(AM|PM|am|pm)?/g, "")
    .replace(/\b(Mujeeb|IBAN|Bank code|Account|A\/c|Acc)\s*[:\-]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
function sanitizePaymentMethods(pm: any): any {
  if (!pm || typeof pm !== "object") return pm;
  const cleaned: any = { ...pm };
  if (cleaned.bankName) cleaned.bankName = cleanName(cleaned.bankName);
  if (cleaned.bankAccountName) cleaned.bankAccountName = cleanName(cleaned.bankAccountName);
  if (cleaned.bankAccountNumber) cleaned.bankAccountNumber = cleanDigits(cleaned.bankAccountNumber);
  if (cleaned.bankIBAN) cleaned.bankIBAN = cleanIBAN(cleaned.bankIBAN);
  if (cleaned.jazzCashName) cleaned.jazzCashName = cleanName(cleaned.jazzCashName);
  if (cleaned.jazzCashNumber) cleaned.jazzCashNumber = cleanDigits(cleaned.jazzCashNumber);
  if (cleaned.easyPaisaName) cleaned.easyPaisaName = cleanName(cleaned.easyPaisaName);
  if (cleaned.easyPaisaNumber) cleaned.easyPaisaNumber = cleanDigits(cleaned.easyPaisaNumber);
  return cleaned;
}
function sanitizeBrandForResponse(brand: any): any {
  if (!brand) return brand;
  if (brand.paymentMethods) {
    return { ...brand, paymentMethods: sanitizePaymentMethods(brand.paymentMethods) };
  }
  return brand;
}

export function setupClothingWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/clothing-ws" });
  wss.on("connection", (ws: WebSocket, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const brandId = url.searchParams.get("brandId");
    if (brandId) {
      if (!clothingClients.has(brandId)) clothingClients.set(brandId, new Set());
      clothingClients.get(brandId)!.add(ws);
      ws.on("close", () => { clothingClients.get(brandId)?.delete(ws); });
    }
  });
  console.log("[Clothing] WebSocket server ready on /clothing-ws");
}

function notifyClothingBrand(brandId: string, data: any) {
  const clients = clothingClients.get(brandId);
  if (clients) {
    const msg = JSON.stringify(data);
    clients.forEach(ws => { if (ws.readyState === WebSocket.OPEN) ws.send(msg); });
  }
}

// ==================== BRANDS ====================

router.get("/api/clothing/brands", async (_req: Request, res: Response) => {
  const brands = await db.select().from(clothingBrands).orderBy(asc(clothingBrands.name));
  res.json(brands.map(sanitizeBrandForResponse));
});

router.get("/api/clothing/brands/:id", async (req: Request, res: Response) => {
  const [brand] = await db.select().from(clothingBrands).where(eq(clothingBrands.id, req.params.id));
  if (!brand) return res.status(404).json({ message: "Brand not found" });
  res.json(sanitizeBrandForResponse(brand));
});

router.get("/api/clothing/brands/by-slug/:slug", async (req: Request, res: Response) => {
  const [brand] = await db.select().from(clothingBrands).where(eq(clothingBrands.slug, req.params.slug));
  if (!brand) return res.status(404).json({ message: "Brand not found" });
  res.json(sanitizeBrandForResponse(brand));
});

router.post("/api/clothing/brands", async (req: Request, res: Response) => {
  const slug = req.body.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const body = { ...req.body };
  if (body.paymentMethods) body.paymentMethods = sanitizePaymentMethods(body.paymentMethods);
  const [brand] = await db.insert(clothingBrands).values({ ...body, slug }).returning();
  res.json(sanitizeBrandForResponse(brand));
});

router.patch("/api/clothing/brands/:id", async (req: Request, res: Response) => {
  const body = { ...req.body };
  if (body.paymentMethods) body.paymentMethods = sanitizePaymentMethods(body.paymentMethods);
  const [brand] = await db.update(clothingBrands).set(body).where(eq(clothingBrands.id, req.params.id)).returning();
  res.json(sanitizeBrandForResponse(brand));
});

router.delete("/api/clothing/brands/:id", async (req: Request, res: Response) => {
  await db.delete(clothingBrands).where(eq(clothingBrands.id, req.params.id));
  res.json({ success: true });
});

router.post("/api/clothing/brand-login", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const [brand] = await db.select().from(clothingBrands)
    .where(and(eq(clothingBrands.adminUsername, username), eq(clothingBrands.adminPassword, password)));
  if (!brand) return res.status(401).json({ message: "Invalid credentials" });
  res.json(brand);
});

// ==================== CATEGORIES ====================

router.get("/api/clothing/categories", async (req: Request, res: Response) => {
  const brandId = req.query.brandId as string | undefined;
  let query = db.select().from(clothingCategories).orderBy(asc(clothingCategories.sortOrder));
  if (brandId) {
    const cats = await db.select().from(clothingCategories)
      .where(eq(clothingCategories.brandId, brandId))
      .orderBy(asc(clothingCategories.sortOrder));
    return res.json(cats);
  }
  const cats = await query;
  res.json(cats);
});

router.post("/api/clothing/categories", async (req: Request, res: Response) => {
  const slug = req.body.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const [cat] = await db.insert(clothingCategories).values({ ...req.body, slug }).returning();
  res.json(cat);
});

router.patch("/api/clothing/categories/:id", async (req: Request, res: Response) => {
  const [cat] = await db.update(clothingCategories).set(req.body).where(eq(clothingCategories.id, req.params.id)).returning();
  res.json(cat);
});

router.delete("/api/clothing/categories/:id", async (req: Request, res: Response) => {
  await db.delete(clothingCategories).where(eq(clothingCategories.id, req.params.id));
  res.json({ success: true });
});

// ==================== PRODUCTS ====================

router.get("/api/clothing/products", async (req: Request, res: Response) => {
  const brandId = req.query.brandId as string | undefined;
  const categoryId = req.query.categoryId as string | undefined;
  let conditions: any[] = [];
  if (brandId) conditions.push(eq(clothingProducts.brandId, brandId));
  if (categoryId) conditions.push(eq(clothingProducts.categoryId, categoryId));

  const products = conditions.length > 0
    ? await db.select().from(clothingProducts).where(and(...conditions)).orderBy(asc(clothingProducts.sortOrder))
    : await db.select().from(clothingProducts).orderBy(asc(clothingProducts.sortOrder));
  res.json(products);
});

router.get("/api/clothing/products/:id", async (req: Request, res: Response) => {
  const [product] = await db.select().from(clothingProducts).where(eq(clothingProducts.id, req.params.id));
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
});

router.post("/api/clothing/products", async (req: Request, res: Response) => {
  const slug = req.body.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const [product] = await db.insert(clothingProducts).values({ ...req.body, slug }).returning();
  res.json(product);
});

router.patch("/api/clothing/products/:id", async (req: Request, res: Response) => {
  const [product] = await db.update(clothingProducts).set(req.body).where(eq(clothingProducts.id, req.params.id)).returning();
  res.json(product);
});

router.delete("/api/clothing/products/:id", async (req: Request, res: Response) => {
  await db.delete(clothingProducts).where(eq(clothingProducts.id, req.params.id));
  res.json({ success: true });
});

// ==================== ORDERS ====================

router.get("/api/clothing/orders", async (req: Request, res: Response) => {
  const brandId = req.query.brandId as string | undefined;
  const orders = brandId
    ? await db.select().from(clothingOrders).where(eq(clothingOrders.brandId, brandId)).orderBy(desc(clothingOrders.createdAt))
    : await db.select().from(clothingOrders).orderBy(desc(clothingOrders.createdAt));
  res.json(orders);
});

router.post("/api/clothing/orders", async (req: Request, res: Response) => {
  const [order] = await db.insert(clothingOrders).values(req.body).returning();
  if (order.brandId) {
    notifyClothingBrand(order.brandId, {
      type: "new_order",
      order: order,
    });
  }
  res.json(order);
});

router.patch("/api/clothing/orders/:id", async (req: Request, res: Response) => {
  const [order] = await db.update(clothingOrders).set(req.body).where(eq(clothingOrders.id, req.params.id)).returning();
  res.json(order);
});

router.delete("/api/clothing/orders/:id", async (req: Request, res: Response) => {
  const brandId = (req.query.brandId as string) || (req.body && req.body.brandId);
  if (!brandId) return res.status(400).json({ message: "brandId is required" });
  const [existing] = await db.select().from(clothingOrders).where(eq(clothingOrders.id, req.params.id));
  if (!existing) return res.status(404).json({ message: "Order not found" });
  if (existing.brandId !== brandId) return res.status(403).json({ message: "Order does not belong to this brand" });
  await db.delete(clothingOrders).where(eq(clothingOrders.id, req.params.id));
  res.json({ success: true });
});

// ==================== DUPLICATE BRAND ====================

router.post("/api/clothing/brands/:id/duplicate", async (req: Request, res: Response) => {
  const [original] = await db.select().from(clothingBrands).where(eq(clothingBrands.id, req.params.id));
  if (!original) return res.status(404).json({ message: "Brand not found" });

  const newName = req.body.name || `${original.name} (Copy)`;
  const newSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const [newBrand] = await db.insert(clothingBrands).values({
    name: newName, slug: newSlug, logo: original.logo, description: original.description,
    currency: original.currency, phone: original.phone, whatsappNumber: original.whatsappNumber, email: original.email,
    address: original.address, city: original.city, country: original.country,
    primaryColor: original.primaryColor, secondaryColor: original.secondaryColor,
    adminUsername: (original.adminUsername || "") + "_copy",
    adminPassword: original.adminPassword,
    deliveryFee: original.deliveryFee, freeDeliveryThreshold: original.freeDeliveryThreshold,
  }).returning();

  const oldCats = await db.select().from(clothingCategories).where(eq(clothingCategories.brandId, original.id));
  const catMap: Record<string, string> = {};
  for (const cat of oldCats) {
    const [newCat] = await db.insert(clothingCategories).values({
      brandId: newBrand.id, name: cat.name, slug: cat.slug, image: cat.image,
      gender: cat.gender, sortOrder: cat.sortOrder, isActive: cat.isActive,
    }).returning();
    catMap[cat.id] = newCat.id;
  }

  const oldProducts = await db.select().from(clothingProducts).where(eq(clothingProducts.brandId, original.id));
  for (const p of oldProducts) {
    await db.insert(clothingProducts).values({
      brandId: newBrand.id, categoryId: p.categoryId ? catMap[p.categoryId] || null : null,
      name: p.name, slug: p.slug, description: p.description, fabric: p.fabric, color: p.color,
      sizes: p.sizes, sizeGuide: p.sizeGuide, price: p.price, wasPrice: p.wasPrice,
      image1: p.image1, image2: p.image2, image3: p.image3, image4: p.image4, image5: p.image5,
      isSoldOut: p.isSoldOut, isFeatured: p.isFeatured, isNew: p.isNew,
      stockQuantity: p.stockQuantity, sortOrder: p.sortOrder, isActive: p.isActive,
    });
  }

  res.json(newBrand);
});

// ==================== SEED DEFAULT CATEGORIES ====================

router.post("/api/clothing/seed-categories/:brandId", async (req: Request, res: Response) => {
  const { brandId } = req.params;
  const defaultCategories = [
    { name: "Chikankari", gender: "Women", sortOrder: 1 },
    { name: "Essential Pret", gender: "Women", sortOrder: 2 },
    { name: "Unstitched", gender: "Women", sortOrder: 3 },
    { name: "Designer", gender: "Women", sortOrder: 4 },
    { name: "Signature Pret", gender: "Women", sortOrder: 5 },
    { name: "Western", gender: "Women", sortOrder: 6 },
    { name: "Tank Tops", gender: "Women", sortOrder: 7 },
    { name: "Shalwar Kameez", gender: "Men", sortOrder: 8 },
    { name: "Waist Coat", gender: "Men", sortOrder: 9 },
    { name: "Polo", gender: "Men", sortOrder: 10 },
    { name: "Oversized T-Shirt", gender: "Men", sortOrder: 11 },
    { name: "Denim", gender: "Men", sortOrder: 12 },
    { name: "Formal Shirts", gender: "Men", sortOrder: 13 },
    { name: "Basic T-Shirt", gender: "Men", sortOrder: 14 },
    { name: "Girls", gender: "Kids", sortOrder: 15 },
    { name: "Boys", gender: "Kids", sortOrder: 16 },
    { name: "Bags", gender: "Accessories", sortOrder: 17 },
    { name: "Body Mist", gender: "Accessories", sortOrder: 18 },
    { name: "Fragrance", gender: "Accessories", sortOrder: 19 },
  ];

  const cats = [];
  for (const cat of defaultCategories) {
    const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const [created] = await db.insert(clothingCategories).values({
      brandId,
      name: cat.name,
      slug,
      gender: cat.gender,
      sortOrder: cat.sortOrder,
    }).returning();
    cats.push(created);
  }
  res.json(cats);
});

// ==================== SEED DEMO PRODUCTS ====================

router.post("/api/clothing/seed-products/:brandId", async (req: Request, res: Response) => {
  const { brandId } = req.params;
  const categories = await db.select().from(clothingCategories).where(eq(clothingCategories.brandId, brandId));

  const demoProducts: any[] = [];
  const sampleImages = [
    "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400",
    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400",
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
    "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400",
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400",
  ];

  for (const cat of categories) {
    const numProducts = cat.gender === "Accessories" ? 2 : 3;
    for (let i = 1; i <= numProducts; i++) {
      const name = `${cat.name} Style ${i}`;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const basePrice = cat.gender === "Accessories" ? 1500 + (i * 200) : 2500 + (i * 500);
      demoProducts.push({
        brandId,
        categoryId: cat.id,
        name,
        slug,
        description: `Beautiful ${cat.name} collection - Style ${i}. Premium quality fabric with elegant design.`,
        fabric: cat.gender === "Accessories" ? "Mixed" : "Cotton Blend",
        color: ["Black", "White", "Navy", "Beige", "Red"][i % 5],
        sizes: cat.gender === "Accessories" ? ["One Size"] : ["XS", "S", "M", "L", "XL"],
        price: basePrice.toString(),
        wasPrice: (basePrice + 800).toString(),
        image1: sampleImages[0],
        image2: sampleImages[1],
        image3: sampleImages[2],
        image4: sampleImages[3],
        image5: sampleImages[4],
        isSoldOut: i === 3 && cat.gender === "Women",
        isFeatured: i === 1,
        isNew: i === 2,
      });
    }
  }

  const created = [];
  for (const p of demoProducts) {
    const [product] = await db.insert(clothingProducts).values(p).returning();
    created.push(product);
  }
  res.json(created);
});

export default router;
