import { Router, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { 
  groceryBranches, groceryMainCategories, grocerySubCategories, 
  grocerySubSubCategories, groceryProducts, groceryOrders, groceryOrderItems,
  groceryDrivers, groceryOrderDeliveries, groceryStoreVisits, groceryStaff,
  insertGroceryBranchSchema, insertGroceryMainCategorySchema,
  insertGrocerySubCategorySchema, insertGrocerySubSubCategorySchema,
  insertGroceryProductSchema
} from "@shared/schema";
import { eq, and, asc, desc, sql, count, gte } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcrypt";
import WebSocket from "ws";
import * as fs from "fs";
import * as path from "path";

const router = Router();

const updateBranchSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  logo: z.string().nullable().optional(),
  deliveryCharge: z.string().optional(),
  freeDeliveryThreshold: z.string().optional(),
  discountThreshold: z.string().optional(),
  discountPercent: z.string().optional(),
  status: z.string().optional(),
  themeColor: z.string().optional(),
  loginUsername: z.string().optional(),
  loginPassword: z.string().optional(),
  welcomeTitle: z.string().optional(),
  welcomeSubtitle: z.string().optional(),
  welcomeCtaText: z.string().optional(),
  welcomePostcodeEnabled: z.boolean().optional(),
  welcomeBackgroundType: z.string().optional(),
  welcomeBackgroundImageUrl: z.string().nullable().optional(),
  welcomeBackgroundVideoUrl: z.string().nullable().optional(),
  welcomeSliderImages: z.array(z.string()).nullable().optional(),
  heroAnimationStyle: z.string().optional(),
  heroSlideInterval: z.number().optional(),
  fontFamily: z.string().optional(),
  titleFontSize: z.string().optional(),
  subtitleFontSize: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  categoryCardStyle: z.string().optional(),
  menuCardStyle: z.string().optional(),
  headerBgColor: z.string().nullable().optional(),
  footerText: z.string().nullable().optional(),
  stripePublishableKey: z.string().nullable().optional(),
  stripeSecretKey: z.string().nullable().optional(),
  stripeAccountId: z.string().nullable().optional(),
  sumupApiKey: z.string().nullable().optional(),
  sumupMerchantCode: z.string().nullable().optional(),
  squareAccessToken: z.string().nullable().optional(),
  squareLocationId: z.string().nullable().optional(),
  zettleApiKey: z.string().nullable().optional(),
  zettleMerchantId: z.string().nullable().optional(),
  easypaisaAccountNumber: z.string().nullable().optional(),
  easypaisaAccountName: z.string().nullable().optional(),
  jazzcashAccountNumber: z.string().nullable().optional(),
  jazzcashAccountName: z.string().nullable().optional(),
  hblAccountNumber: z.string().nullable().optional(),
  hblAccountName: z.string().nullable().optional(),
  hblIban: z.string().nullable().optional(),
  ublAccountNumber: z.string().nullable().optional(),
  ublAccountName: z.string().nullable().optional(),
  ublIban: z.string().nullable().optional(),
  meezanAccountNumber: z.string().nullable().optional(),
  meezanAccountName: z.string().nullable().optional(),
  meezanIban: z.string().nullable().optional(),
  alfalahAccountNumber: z.string().nullable().optional(),
  alfalahAccountName: z.string().nullable().optional(),
  alfalahIban: z.string().nullable().optional(),
  mcbAccountNumber: z.string().nullable().optional(),
  mcbAccountName: z.string().nullable().optional(),
  mcbIban: z.string().nullable().optional(),
  alliedAccountNumber: z.string().nullable().optional(),
  alliedAccountName: z.string().nullable().optional(),
  alliedIban: z.string().nullable().optional(),
  sadapayAccountNumber: z.string().nullable().optional(),
  sadapayAccountName: z.string().nullable().optional(),
  nayapayAccountNumber: z.string().nullable().optional(),
  nayapayAccountName: z.string().nullable().optional(),
  webAddressType: z.string().nullable().optional(),
  customSubdomain: z.string().nullable().optional(),
  customDomain: z.string().nullable().optional(),
  vatRate: z.string().optional(),
  collectionDiscountPercent: z.string().optional(),
  collectionDiscountThreshold: z.string().optional(),
  estimatedDeliveryTime: z.string().optional(),
  cutleryPrice: z.string().optional(),
  acceptingOrders: z.boolean().optional(),
  serviceAreaType: z.string().optional(),
  serviceAreaValue: z.string().nullable().optional(),
  categoryBgType: z.string().optional(),
  categoryBgColor: z.string().optional(),
  categoryBgImages: z.array(z.string()).nullable().optional(),
  categoryBgAnimation: z.string().optional(),
  categoryBgAnimationSpeed: z.number().optional(),
  whatsappNumber: z.string().nullable().optional(),
  storeLanguage: z.string().optional(),
  categoryBgVideo: z.string().nullable().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().optional(),
  image: z.string().nullable().optional(),
  gif: z.string().nullable().optional(),
  displayOrder: z.number().optional(),
  color: z.string().optional(),
}).strict();

const updateSubCategorySchema = z.object({
  name: z.string().optional(),
  image: z.string().nullable().optional(),
  gif: z.string().nullable().optional(),
  video: z.string().nullable().optional(),
  displayOrder: z.number().optional(),
}).strict();

const updateProductSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  details: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  image1: z.string().nullable().optional(),
  image2: z.string().nullable().optional(),
  video: z.string().nullable().optional(),
  wasPrice: z.string().nullable().optional(),
  nowPrice: z.string().optional(),
  expiryDate: z.string().nullable().optional(),
  stockQuantity: z.number().optional(),
  unit: z.string().optional(),
  weight: z.string().nullable().optional(),
  calories: z.string().nullable().optional(),
  allergyAdvice: z.string().nullable().optional(),
  productMarketing: z.string().nullable().optional(),
  features: z.string().nullable().optional(),
  lifestyle: z.string().nullable().optional(),
  ingredients: z.string().nullable().optional(),
  calculatedNutrition: z.string().nullable().optional(),
  nutritionalClaims: z.string().nullable().optional(),
  storageUsage: z.string().nullable().optional(),
  storageConditions: z.string().nullable().optional(),
  storageType: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  companyAddress: z.string().nullable().optional(),
  manufacturer: z.string().nullable().optional(),
  moreInformation: z.string().nullable().optional(),
  nutrition: z.string().nullable().optional(),
  disclaimer: z.string().nullable().optional(),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  displayOrder: z.number().optional(),
}).strict();

async function verifyMainCatBranch(mainCategoryId: string, branchId: string): Promise<boolean> {
  const [cat] = await db.select().from(groceryMainCategories).where(and(eq(groceryMainCategories.id, mainCategoryId), eq(groceryMainCategories.branchId, branchId)));
  return !!cat;
}

async function verifySubCatBranch(subCategoryId: string, branchId: string): Promise<boolean> {
  const [cat] = await db.select().from(grocerySubCategories).where(and(eq(grocerySubCategories.id, subCategoryId), eq(grocerySubCategories.branchId, branchId)));
  return !!cat;
}

// ============ BRANCHES ============
router.get("/api/grocery/branches", async (_req, res) => {
  const branches = await db.select().from(groceryBranches).orderBy(asc(groceryBranches.branchNumber));
  res.json(branches.map(b => ({ ...b, loginPassword: undefined })));
});

router.post("/api/grocery/branches", async (req, res) => {
  const parsed = insertGroceryBranchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const data = { ...parsed.data };
  if (data.loginPassword) data.loginPassword = await bcrypt.hash(data.loginPassword, 10);
  const [branch] = await db.insert(groceryBranches).values(data).returning();
  res.json({ ...branch, loginPassword: undefined });
});

router.patch("/api/grocery/branches/:id", async (req, res) => {
  const parsed = updateBranchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const data = { ...parsed.data };
  if (data.loginPassword) data.loginPassword = await bcrypt.hash(data.loginPassword, 10);
  if (Object.keys(data).length === 0) return res.status(400).json({ error: "No fields to update" });
  const [branch] = await db.update(groceryBranches).set(data).where(eq(groceryBranches.id, req.params.id)).returning();
  res.json({ ...branch, loginPassword: undefined });
});

router.delete("/api/grocery/branches/:id", async (req, res) => {
  await db.delete(groceryBranches).where(eq(groceryBranches.id, req.params.id));
  res.json({ success: true });
});

router.post("/api/grocery/branch-login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    const allBranches = await db.select().from(groceryBranches);
    const branch = allBranches.find(b => b.loginUsername === username);
    if (!branch || !branch.loginPassword) return res.status(401).json({ error: "Invalid credentials" });
    const isHashed = branch.loginPassword.startsWith("$2b$");
    let valid = false;
    if (isHashed) {
      valid = await bcrypt.compare(password, branch.loginPassword);
    } else {
      valid = password === branch.loginPassword;
      if (valid) {
        const hashed = await bcrypt.hash(password, 10);
        await db.update(groceryBranches).set({ loginPassword: hashed }).where(eq(groceryBranches.id, branch.id));
      }
    }
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    res.json({ branch: { id: branch.id, name: branch.name, slug: branch.slug, currency: branch.currency, themeColor: branch.themeColor } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============ MAIN CATEGORIES ============
router.get("/api/grocery/main-categories/:branchId", async (req, res) => {
  const cats = await db.select().from(groceryMainCategories)
    .where(eq(groceryMainCategories.branchId, req.params.branchId))
    .orderBy(asc(groceryMainCategories.displayOrder));
  res.json(cats);
});

router.post("/api/grocery/main-categories", async (req, res) => {
  const parsed = insertGroceryMainCategorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [cat] = await db.insert(groceryMainCategories).values(parsed.data).returning();
  res.json(cat);
});

router.post("/api/grocery/main-categories/bulk", async (req, res) => {
  const { branchId, names } = req.body;
  if (!branchId || !names || !Array.isArray(names)) return res.status(400).json({ error: "branchId and names[] required" });
  const existing = await db.select().from(groceryMainCategories).where(eq(groceryMainCategories.branchId, branchId));
  const existingNames = new Set(existing.map(c => c.name.toLowerCase().trim()));
  const items = names.filter((n: string) => n.trim() && !existingNames.has(n.trim().toLowerCase())).map((name: string, i: number) => ({
    branchId, name: name.trim(), displayOrder: existing.length + i,
  }));
  if (items.length === 0) return res.json([]);
  const cats = await db.insert(groceryMainCategories).values(items).returning();
  res.json(cats);
});

router.patch("/api/grocery/main-categories/:id", async (req, res) => {
  const parsed = updateCategorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [cat] = await db.update(groceryMainCategories).set(parsed.data).where(eq(groceryMainCategories.id, req.params.id)).returning();
  res.json(cat);
});

router.delete("/api/grocery/main-categories/:id", async (req, res) => {
  await db.delete(groceryMainCategories).where(eq(groceryMainCategories.id, req.params.id));
  res.json({ success: true });
});

// ============ SUB CATEGORIES ============
router.get("/api/grocery/sub-categories/:mainCategoryId", async (req, res) => {
  const cats = await db.select().from(grocerySubCategories)
    .where(eq(grocerySubCategories.mainCategoryId, req.params.mainCategoryId))
    .orderBy(asc(grocerySubCategories.displayOrder));
  res.json(cats);
});

router.post("/api/grocery/sub-categories", async (req, res) => {
  const parsed = insertGrocerySubCategorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [cat] = await db.insert(grocerySubCategories).values(parsed.data).returning();
  res.json(cat);
});

router.post("/api/grocery/sub-categories/bulk", async (req, res) => {
  const { branchId, mainCategoryId, names } = req.body;
  if (!branchId || !mainCategoryId || !names || !Array.isArray(names)) return res.status(400).json({ error: "branchId, mainCategoryId, names[] required" });
  const valid = await verifyMainCatBranch(mainCategoryId, branchId);
  if (!valid) return res.status(400).json({ error: "Main category does not belong to this branch" });
  const existing = await db.select().from(grocerySubCategories).where(and(eq(grocerySubCategories.branchId, branchId), eq(grocerySubCategories.mainCategoryId, mainCategoryId)));
  const existingNames = new Set(existing.map(c => c.name.toLowerCase().trim()));
  const items = names.filter((n: string) => n.trim() && !existingNames.has(n.trim().toLowerCase())).map((name: string, i: number) => ({
    branchId, mainCategoryId, name: name.trim(), displayOrder: existing.length + i,
  }));
  if (items.length === 0) return res.json([]);
  const cats = await db.insert(grocerySubCategories).values(items).returning();
  res.json(cats);
});

router.patch("/api/grocery/sub-categories/:id", async (req, res) => {
  const parsed = updateSubCategorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [cat] = await db.update(grocerySubCategories).set(parsed.data).where(eq(grocerySubCategories.id, req.params.id)).returning();
  res.json(cat);
});

router.delete("/api/grocery/sub-categories/:id", async (req, res) => {
  await db.delete(grocerySubCategories).where(eq(grocerySubCategories.id, req.params.id));
  res.json({ success: true });
});

// ============ SUB-SUB CATEGORIES ============
router.get("/api/grocery/sub-sub-categories/:subCategoryId", async (req, res) => {
  const cats = await db.select().from(grocerySubSubCategories)
    .where(eq(grocerySubSubCategories.subCategoryId, req.params.subCategoryId))
    .orderBy(asc(grocerySubSubCategories.displayOrder));
  res.json(cats);
});

router.post("/api/grocery/sub-sub-categories", async (req, res) => {
  const parsed = insertGrocerySubSubCategorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [cat] = await db.insert(grocerySubSubCategories).values(parsed.data).returning();
  res.json(cat);
});

router.post("/api/grocery/sub-sub-categories/bulk", async (req, res) => {
  const { branchId, subCategoryId, names } = req.body;
  if (!branchId || !subCategoryId || !names || !Array.isArray(names)) return res.status(400).json({ error: "branchId, subCategoryId, names[] required" });
  const valid = await verifySubCatBranch(subCategoryId, branchId);
  if (!valid) return res.status(400).json({ error: "Sub category does not belong to this branch" });
  const existing = await db.select().from(grocerySubSubCategories).where(and(eq(grocerySubSubCategories.branchId, branchId), eq(grocerySubSubCategories.subCategoryId, subCategoryId)));
  const existingNames = new Set(existing.map(c => c.name.toLowerCase().trim()));
  const items = names.filter((n: string) => n.trim() && !existingNames.has(n.trim().toLowerCase())).map((name: string, i: number) => ({
    branchId, subCategoryId, name: name.trim(), displayOrder: existing.length + i,
  }));
  if (items.length === 0) return res.json([]);
  const cats = await db.insert(grocerySubSubCategories).values(items).returning();
  res.json(cats);
});

router.patch("/api/grocery/sub-sub-categories/:id", async (req, res) => {
  const parsed = updateSubCategorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [cat] = await db.update(grocerySubSubCategories).set(parsed.data).where(eq(grocerySubSubCategories.id, req.params.id)).returning();
  res.json(cat);
});

router.delete("/api/grocery/sub-sub-categories/:id", async (req, res) => {
  await db.delete(grocerySubSubCategories).where(eq(grocerySubSubCategories.id, req.params.id));
  res.json({ success: true });
});

// ============ PRODUCTS ============
router.get("/api/grocery/products/:branchId", async (req, res) => {
  const { mainCategoryId, subCategoryId, subSubCategoryId } = req.query;
  let conditions = [eq(groceryProducts.branchId, req.params.branchId)];
  if (mainCategoryId) conditions.push(eq(groceryProducts.mainCategoryId, mainCategoryId as string));
  if (subCategoryId) conditions.push(eq(groceryProducts.subCategoryId, subCategoryId as string));
  if (subSubCategoryId) conditions.push(eq(groceryProducts.subSubCategoryId, subSubCategoryId as string));
  const products = await db.select().from(groceryProducts)
    .where(and(...conditions))
    .orderBy(asc(groceryProducts.displayOrder), asc(groceryProducts.createdAt));
  res.json(products);
});

router.post("/api/grocery/products", async (req, res) => {
  const parsed = insertGroceryProductSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [product] = await db.insert(groceryProducts).values(parsed.data).returning();
  res.json(product);
});

router.post("/api/grocery/products/bulk", async (req, res) => {
  const { products: items } = req.body;
  if (!items || !Array.isArray(items)) return res.status(400).json({ error: "products[] required" });
  const inserted = await db.insert(groceryProducts).values(items).returning();
  res.json(inserted);
});

router.patch("/api/grocery/products/:id", async (req, res) => {
  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [product] = await db.update(groceryProducts).set(parsed.data).where(eq(groceryProducts.id, req.params.id)).returning();
  res.json(product);
});

router.delete("/api/grocery/products/:id", async (req, res) => {
  await db.delete(groceryProducts).where(eq(groceryProducts.id, req.params.id));
  res.json({ success: true });
});

router.post("/api/grocery/products/bulk-clear", async (req, res) => {
  const { branchId, mainCategoryId, subCategoryId } = req.body;
  if (!branchId || !mainCategoryId) return res.status(400).json({ error: "branchId and mainCategoryId required" });
  const conditions = [eq(groceryProducts.branchId, branchId), eq(groceryProducts.mainCategoryId, mainCategoryId)];
  if (subCategoryId) conditions.push(eq(groceryProducts.subCategoryId, subCategoryId));
  await db.delete(groceryProducts).where(and(...conditions));
  res.json({ success: true });
});

router.post("/api/grocery/products/bulk-update", async (req, res) => {
  const { branchId, mainCategoryId, subCategoryId, subSubCategoryId, products } = req.body;
  if (!branchId || !mainCategoryId || !products || !Array.isArray(products)) {
    return res.status(400).json({ error: "branchId, mainCategoryId, and products[] required" });
  }
  const conditions: any[] = [eq(groceryProducts.branchId, branchId), eq(groceryProducts.mainCategoryId, mainCategoryId)];
  if (subCategoryId) conditions.push(eq(groceryProducts.subCategoryId, subCategoryId));
  if (subSubCategoryId) conditions.push(eq(groceryProducts.subSubCategoryId, subSubCategoryId));
  const existing = await db.select().from(groceryProducts).where(and(...conditions));

  let updated = 0;
  let added = 0;
  for (const item of products) {
    const normalizedName = item.name?.trim().toLowerCase();
    if (!normalizedName) continue;
    const match = existing.find((p: any) => p.name?.trim().toLowerCase() === normalizedName);
    if (match) {
      const updateData: any = {};
      if (item.nowPrice !== undefined) updateData.nowPrice = item.nowPrice;
      if (item.wasPrice !== undefined) updateData.wasPrice = item.wasPrice;
      if (item.description !== undefined) updateData.description = item.description;
      if (Object.keys(updateData).length > 0) {
        await db.update(groceryProducts).set(updateData).where(eq(groceryProducts.id, match.id));
        updated++;
      }
    } else {
      await db.insert(groceryProducts).values({
        branchId,
        mainCategoryId,
        subCategoryId: subCategoryId || null,
        subSubCategoryId: subSubCategoryId || null,
        name: item.name,
        description: item.description || null,
        nowPrice: item.nowPrice || "0.00",
        wasPrice: item.wasPrice || null,
        stockQuantity: 0,
        unit: "each",
      });
      added++;
    }
  }
  res.json({ success: true, updated, added });
});

async function searchOpenFoodFacts(query: string) {
  const fields = "product_name,image_front_url,image_url,allergens_tags,allergens,ingredients_text,nutriments,nutrition_grades,labels_tags,labels,categories,generic_name,brands,manufacturing_places,origins,stores,countries,packaging,conservation_conditions,customer_service,quantity";
  const cleanQ = (q: string) => q.replace(/\b\d+\s*(ml|l|g|kg|oz|lb|lbs|litre|liter|pint|pack|pcs|ct)\b/gi, "").replace(/\s+/g, " ").trim();
  const searchQueries = [query, cleanQ(query)];
  const words = cleanQ(query).split(" ").filter(w => w.length > 1);
  if (words.length > 3) searchQueries.push(words.slice(0, 3).join(" "));
  if (words.length > 2) searchQueries.push(words.slice(0, 2).join(" "));

  for (const sq of searchQueries) {
    if (!sq.trim()) continue;
    try {
      const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(sq)}&search_simple=1&action=process&json=1&page_size=8&fields=${fields}`;
      const response = await fetch(searchUrl);
      const data = await response.json();
      const filtered = (data.products || []).filter((p: any) => p.image_front_url || p.image_url);
      if (filtered.length > 0) return filtered;
    } catch {}
  }
  return [];
}

function parseOpenFoodProduct(p: any) {
  const n = p.nutriments || {};
  const nutritionLines: string[] = [];
  if (n["energy-kcal_100g"] !== undefined) nutritionLines.push(`Energy: ${n["energy-kcal_100g"]} kcal per 100g`);
  if (n.fat_100g !== undefined) nutritionLines.push(`Fat: ${n.fat_100g}g per 100g`);
  if (n["saturated-fat_100g"] !== undefined) nutritionLines.push(`Saturated Fat: ${n["saturated-fat_100g"]}g per 100g`);
  if (n.carbohydrates_100g !== undefined) nutritionLines.push(`Carbohydrates: ${n.carbohydrates_100g}g per 100g`);
  if (n.sugars_100g !== undefined) nutritionLines.push(`Sugars: ${n.sugars_100g}g per 100g`);
  if (n.fiber_100g !== undefined) nutritionLines.push(`Fibre: ${n.fiber_100g}g per 100g`);
  if (n.proteins_100g !== undefined) nutritionLines.push(`Protein: ${n.proteins_100g}g per 100g`);
  if (n.salt_100g !== undefined) nutritionLines.push(`Salt: ${n.salt_100g}g per 100g`);
  if (n.sodium_100g !== undefined) nutritionLines.push(`Sodium: ${n.sodium_100g}g per 100g`);

  const cleanTags = (tags: string[] | undefined) => (tags || []).map((t: string) => t.replace(/^en:/, "").replace(/-/g, " ")).join(", ");
  const allergens = p.allergens || cleanTags(p.allergens_tags) || "";
  const labels = cleanTags(p.labels_tags) || p.labels || "";
  const origins = p.origins || "";
  const countries = p.countries || "";
  const brands = p.brands || "";
  const manufacturing = p.manufacturing_places || "";
  const packaging = p.packaging || "";
  const conservation = p.conservation_conditions || "";
  const customerService = p.customer_service || "";
  const genericName = p.generic_name || "";
  const categories = p.categories || "";
  const quantity = p.quantity || "";
  const nutritionGrade = p.nutrition_grades ? `Nutri-Score: ${p.nutrition_grades.toUpperCase()}` : "";

  const lifestyleItems: string[] = [];
  if (labels.toLowerCase().includes("vegan")) lifestyleItems.push("Vegan");
  if (labels.toLowerCase().includes("vegetarian")) lifestyleItems.push("Vegetarian");
  if (labels.toLowerCase().includes("organic") || labels.toLowerCase().includes("bio")) lifestyleItems.push("Organic");
  if (labels.toLowerCase().includes("gluten-free") || labels.toLowerCase().includes("gluten free")) lifestyleItems.push("Gluten Free");
  if (labels.toLowerCase().includes("halal")) lifestyleItems.push("Halal");
  if (labels.toLowerCase().includes("kosher")) lifestyleItems.push("Kosher");
  if (labels.toLowerCase().includes("fair trade")) lifestyleItems.push("Fair Trade");

  const nutritionalClaims: string[] = [];
  if (labels.toLowerCase().includes("no added sugar")) nutritionalClaims.push("No Added Sugar");
  if (labels.toLowerCase().includes("low fat")) nutritionalClaims.push("Low Fat");
  if (labels.toLowerCase().includes("high protein") || labels.toLowerCase().includes("rich in protein")) nutritionalClaims.push("High Protein");
  if (labels.toLowerCase().includes("source of fibre") || labels.toLowerCase().includes("high fibre")) nutritionalClaims.push("Source of Fibre");
  if (labels.toLowerCase().includes("low salt") || labels.toLowerCase().includes("reduced salt")) nutritionalClaims.push("Low Salt");
  if (nutritionGrade) nutritionalClaims.push(nutritionGrade);

  return {
    name: p.product_name || "Unknown",
    image: p.image_front_url || p.image_url,
    description: genericName || categories || "",
    allergyAdvice: allergens ? `Contains: ${allergens}` : "",
    ingredients: p.ingredients_text || "",
    calculatedNutrition: nutritionLines.join("\n"),
    nutrition: nutritionLines.join("\n"),
    nutritionalClaims: nutritionalClaims.join(", "),
    lifestyle: lifestyleItems.join(", "),
    features: [quantity, packaging].filter(Boolean).join(", "),
    productMarketing: "",
    storageUsage: conservation || "",
    storageType: packaging || "",
    country: [origins, countries].filter(Boolean).join(", "),
    companyName: brands || "",
    companyAddress: customerService || "",
    manufacturer: manufacturing || "",
    moreInformation: labels || "",
    disclaimer: allergens ? `Allergy Advice: ${allergens}` : "",
    weight: quantity || "",
  };
}

router.get("/api/grocery/search-image", async (req, res) => {
  const query = req.query.q as string;
  if (!query) return res.status(400).json({ error: "Query required" });
  try {
    const results = await searchOpenFoodFacts(query);
    res.json(results.map(parseOpenFoodProduct));
  } catch (e) {
    res.json([]);
  }
});

// ============ PUBLIC STORE ROUTES ============

router.get("/api/grocery/store/:slug", async (req, res) => {
  const [branch] = await db.select().from(groceryBranches).where(eq(groceryBranches.slug, req.params.slug));
  if (!branch) return res.status(404).json({ error: "Store not found" });
  const cats = await db.select().from(groceryMainCategories).where(eq(groceryMainCategories.branchId, branch.id)).orderBy(asc(groceryMainCategories.displayOrder));
  res.json({ branch, categories: cats });
});

router.get("/api/grocery/store/:slug/products", async (req, res) => {
  const [branch] = await db.select().from(groceryBranches).where(eq(groceryBranches.slug, req.params.slug));
  if (!branch) return res.status(404).json({ error: "Store not found" });
  const { mainCategoryId, subCategoryId, subSubCategoryId, search } = req.query;
  let conditions = [eq(groceryProducts.branchId, branch.id)];
  if (mainCategoryId) conditions.push(eq(groceryProducts.mainCategoryId, mainCategoryId as string));
  if (subCategoryId) conditions.push(eq(groceryProducts.subCategoryId, subCategoryId as string));
  if (subSubCategoryId) conditions.push(eq(groceryProducts.subSubCategoryId, subSubCategoryId as string));
  const allProducts = await db.select().from(groceryProducts).where(and(...conditions)).orderBy(asc(groceryProducts.displayOrder), asc(groceryProducts.createdAt));
  if (search) {
    const s = (search as string).toLowerCase();
    return res.json(allProducts.filter(p => p.name.toLowerCase().includes(s)));
  }
  res.json(allProducts);
});

router.get("/api/grocery/store/:slug/sub-categories/:mainCategoryId", async (req, res) => {
  const [branch] = await db.select().from(groceryBranches).where(eq(groceryBranches.slug, req.params.slug));
  if (!branch) return res.status(404).json({ error: "Store not found" });
  const cats = await db.select().from(grocerySubCategories).where(and(eq(grocerySubCategories.mainCategoryId, req.params.mainCategoryId), eq(grocerySubCategories.branchId, branch.id))).orderBy(asc(grocerySubCategories.displayOrder));
  res.json(cats);
});

router.get("/api/grocery/store/:slug/sub-sub-categories/:subCategoryId", async (req, res) => {
  const [branch] = await db.select().from(groceryBranches).where(eq(groceryBranches.slug, req.params.slug));
  if (!branch) return res.status(404).json({ error: "Store not found" });
  const cats = await db.select().from(grocerySubSubCategories).where(and(eq(grocerySubSubCategories.subCategoryId, req.params.subCategoryId), eq(grocerySubSubCategories.branchId, branch.id))).orderBy(asc(grocerySubSubCategories.displayOrder));
  res.json(cats);
});

// ============ GROCERY ORDERS & STRIPE CHECKOUT ============

router.post("/api/grocery/checkout", async (req, res) => {
  try {
    const { branchSlug, items, customer, orderType = "delivery", paymentMethod = "card", wantCutlery = false } = req.body;
    if (!branchSlug || !items?.length || !customer?.name) {
      return res.status(400).json({ error: "branchSlug, items, and customer.name required" });
    }
    const [branch] = await db.select().from(groceryBranches).where(eq(groceryBranches.slug, branchSlug));
    if (!branch) return res.status(404).json({ error: "Store not found" });
    if (branch.acceptingOrders === false) return res.status(403).json({ error: "This store is currently not accepting orders. Please try again later." });

    let subtotal = 0;
    const orderItems: any[] = [];
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1) continue;
      const [product] = await db.select().from(groceryProducts).where(and(eq(groceryProducts.id, item.productId), eq(groceryProducts.branchId, branch.id)));
      if (!product) continue;
      const qty = Math.max(1, Math.floor(item.quantity));
      const price = parseFloat(product.nowPrice);
      const itemTotal = price * qty;
      subtotal += itemTotal;
      orderItems.push({
        productId: product.id,
        productName: product.name,
        productImage: product.image1,
        price: product.nowPrice,
        quantity: qty,
        total: itemTotal.toFixed(2),
      });
    }
    if (orderItems.length === 0) return res.status(400).json({ error: "No valid items in order" });

    const baseDeliveryCharge = parseFloat(branch.deliveryCharge || "1.99");
    const freeThreshold = parseFloat(branch.freeDeliveryThreshold || "30");
    const actualDelivery = orderType === "collection" ? 0 : (subtotal >= freeThreshold ? 0 : baseDeliveryCharge);

    let discount = 0;
    if (orderType === "collection") {
      const collThreshold = parseFloat(branch.collectionDiscountThreshold || "15");
      const collPercent = parseFloat(branch.collectionDiscountPercent || "10");
      if (subtotal >= collThreshold) discount = subtotal * collPercent / 100;
    } else {
      const discountThreshold = parseFloat(branch.discountThreshold || "30");
      const discountPercent = parseFloat(branch.discountPercent || "5");
      if (subtotal >= discountThreshold) discount = subtotal * discountPercent / 100;
    }

    const vatRate = parseFloat(branch.vatRate || "0");
    const subtotalAfterDiscount = subtotal - discount;
    const vatAmt = vatRate > 0 ? (subtotalAfterDiscount * vatRate / 100) : 0;

    const cutleryPrice = parseFloat(branch.cutleryPrice || "0.50");
    const cutleryChg = wantCutlery ? cutleryPrice : 0;

    const total = subtotal + actualDelivery + cutleryChg + vatAmt - discount;

    let paymentIntentId: string | null = null;
    let clientSecretStr: string | null = null;
    let paymentStatus = paymentMethod === "cash" ? "cash" : "pending";

    if (paymentMethod === "card") {
      const Stripe = (await import('stripe')).default;
      const stripeSecretKey = branch.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) return res.status(500).json({ error: "Payment not configured" });

      const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-04-30.basil' as any });
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: branch.currency === "£" ? "gbp" : branch.currency === "$" ? "usd" : branch.currency === "€" ? "eur" : branch.currency === "Rs" ? "pkr" : "gbp",
        capture_method: "automatic",
        metadata: { branchId: branch.id, branchName: branch.name, orderType },
        payment_method_types: ['card'],
      });
      paymentIntentId = paymentIntent.id;
      clientSecretStr = paymentIntent.client_secret;
    }

    const [order] = await db.insert(groceryOrders).values({
      branchId: branch.id,
      customerName: customer.name,
      customerPhone: customer.phone || null,
      customerEmail: customer.email || null,
      customerAddress: customer.address || null,
      customerPostcode: customer.postcode || null,
      orderType,
      paymentMethod,
      subtotal: subtotal.toFixed(2),
      deliveryCharge: actualDelivery.toFixed(2),
      discount: discount.toFixed(2),
      vatAmount: vatAmt.toFixed(2),
      cutleryRequested: wantCutlery,
      cutleryCharge: cutleryChg.toFixed(2),
      total: total.toFixed(2),
      stripePaymentId: paymentIntentId,
      stripePaymentStatus: paymentStatus,
      notes: customer.notes || null,
    }).returning();

    for (const item of orderItems) {
      await db.insert(groceryOrderItems).values({ orderId: order.id, ...item });
    }

    res.json({
      clientSecret: clientSecretStr,
      orderId: order.id,
      subtotal: subtotal.toFixed(2),
      deliveryCharge: actualDelivery.toFixed(2),
      discount: discount.toFixed(2),
      vatAmount: vatAmt.toFixed(2),
      cutleryCharge: cutleryChg.toFixed(2),
      total: total.toFixed(2),
      paymentMethod,
    });
  } catch (err: any) {
    console.error("Grocery checkout error:", err);
    res.status(500).json({ error: "Checkout failed: " + err.message });
  }
});

router.post("/api/grocery/confirm-payment", async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;
    if (!orderId || !paymentIntentId) return res.status(400).json({ error: "orderId and paymentIntentId required" });

    const [order] = await db.select().from(groceryOrders).where(eq(groceryOrders.id, orderId));
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.stripePaymentId !== paymentIntentId) return res.status(400).json({ error: "Payment ID mismatch" });

    const Stripe = (await import('stripe')).default;
    const [groceryBranch] = await db.select().from(groceryBranches).where(eq(groceryBranches.id, order.branchId));
    const stripeSecretKey = groceryBranch?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) return res.status(500).json({ error: "Payment not configured" });
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-04-30.basil' as any });
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== "succeeded") return res.status(400).json({ error: "Payment not completed" });

    const [updatedOrder] = await db.update(groceryOrders).set({ stripePaymentStatus: "paid", status: "confirmed" }).where(eq(groceryOrders.id, orderId)).returning();
    broadcastToGroceryBranch(updatedOrder.branchId, { type: "new_order", order: updatedOrder });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/grocery/orders/:orderId/reject-refund", async (req, res) => {
  try {
    const [order] = await db.select().from(groceryOrders).where(eq(groceryOrders.id, req.params.orderId));
    if (!order) return res.status(404).json({ error: "Order not found" });

    let refunded = false;
    if (order.stripePaymentId && order.stripePaymentStatus === "paid") {
      const [branch] = await db.select().from(groceryBranches).where(eq(groceryBranches.id, order.branchId));
      const rawStripeKey = branch?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
      if (!rawStripeKey) return res.status(500).json({ error: "Stripe not configured for this branch" });
      const stripeSecretKey = rawStripeKey.replace(/[^\x20-\x7E]/g, '').replace(/\s/g, '').trim();

      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-04-30.basil' as any });
      try {
        await stripe.refunds.create({ payment_intent: order.stripePaymentId });
        refunded = true;
      } catch (refundErr: any) {
        console.error("Stripe refund error:", refundErr.message);
        return res.status(500).json({ error: "Refund failed: " + refundErr.message });
      }
    }

    const [updated] = await db.update(groceryOrders).set({
      status: "cancelled",
      stripePaymentStatus: refunded ? "refunded" : order.stripePaymentStatus,
    }).where(eq(groceryOrders.id, req.params.orderId)).returning();

    broadcastToGroceryBranch(updated.branchId, { type: "order_updated", order: updated });
    broadcastToGroceryOrderTrackers(updated.id, { type: "order_status", status: "cancelled", orderId: updated.id, refunded });
    res.json({ success: true, refunded });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/grocery/orders/:branchId", async (req, res) => {
  const orders = await db.select().from(groceryOrders).where(eq(groceryOrders.branchId, req.params.branchId)).orderBy(desc(groceryOrders.createdAt));
  res.json(orders);
});

router.get("/api/grocery/orders/:branchId/items/:orderId", async (req, res) => {
  const items = await db.select().from(groceryOrderItems).where(eq(groceryOrderItems.orderId, req.params.orderId));
  res.json(items);
});

router.patch("/api/grocery/orders/:orderId/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "status required" });
    const [updated] = await db.update(groceryOrders).set({ status }).where(eq(groceryOrders.id, req.params.orderId)).returning();
    if (!updated) return res.status(404).json({ error: "Order not found" });
    broadcastToGroceryBranch(updated.branchId, { type: "order_updated", order: updated });
    broadcastToGroceryOrderTrackers(updated.id, { type: "order_status", status: updated.status, orderId: updated.id });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/grocery/orders/:orderId/assign-driver", async (req, res) => {
  try {
    const { driverId } = req.body;
    if (!driverId) return res.status(400).json({ error: "driverId required" });
    const [existing] = await db.select().from(groceryOrderDeliveries).where(eq(groceryOrderDeliveries.orderId, req.params.orderId));
    if (existing) {
      const [updated] = await db.update(groceryOrderDeliveries).set({ driverId, deliveryStatus: "assigned", assignedAt: new Date() }).where(eq(groceryOrderDeliveries.id, existing.id)).returning();
      sendToGroceryDriver(driverId, { type: "new_delivery", orderId: req.params.orderId });
      res.json(updated);
    } else {
      const [delivery] = await db.insert(groceryOrderDeliveries).values({
        orderId: req.params.orderId, driverId, deliveryStatus: "assigned", assignedAt: new Date(),
      }).returning();
      sendToGroceryDriver(driverId, { type: "new_delivery", orderId: req.params.orderId });
      res.json(delivery);
    }
    const [order] = await db.select().from(groceryOrders).where(eq(groceryOrders.id, req.params.orderId));
    if (order) {
      await db.update(groceryOrders).set({ status: "delivering" }).where(eq(groceryOrders.id, req.params.orderId));
      broadcastToGroceryBranch(order.branchId, { type: "order_updated", order: { ...order, status: "delivering" } });
      broadcastToGroceryOrderTrackers(order.id, { type: "order_status", status: "delivering", orderId: order.id });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/grocery/deliveries/:orderId", async (req, res) => {
  const [delivery] = await db.select().from(groceryOrderDeliveries).where(eq(groceryOrderDeliveries.orderId, req.params.orderId));
  if (!delivery) return res.json(null);
  let driver = null;
  if (delivery.driverId) {
    const [d] = await db.select().from(groceryDrivers).where(eq(groceryDrivers.id, delivery.driverId));
    driver = d ? { id: d.id, name: d.name, phone: d.phone, vehicleType: d.vehicleType, vehiclePlate: d.vehiclePlate, lastLocationLat: d.lastLocationLat, lastLocationLng: d.lastLocationLng } : null;
  }
  res.json({ ...delivery, driver });
});

// ============ GROCERY DRIVERS ============

router.get("/api/grocery/drivers/:branchId", async (req, res) => {
  const driversList = await db.select().from(groceryDrivers).where(eq(groceryDrivers.branchId, req.params.branchId)).orderBy(desc(groceryDrivers.createdAt));
  res.json(driversList.map(d => ({ ...d, password: undefined })));
});

router.post("/api/grocery/drivers", async (req, res) => {
  try {
    const { branchId, name, phone, password, vehicleType, vehiclePlate } = req.body;
    if (!branchId || !name || !phone || !password) return res.status(400).json({ error: "branchId, name, phone, password required" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const [driver] = await db.insert(groceryDrivers).values({
      branchId, name, phone, password: hashedPassword,
      vehicleType: vehicleType || "car", vehiclePlate: vehiclePlate || null,
    }).returning();
    res.json({ ...driver, password: undefined });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/api/grocery/drivers/:id", async (req, res) => {
  try {
    const updates: any = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.phone) updates.phone = req.body.phone;
    if (req.body.vehicleType) updates.vehicleType = req.body.vehicleType;
    if (req.body.vehiclePlate !== undefined) updates.vehiclePlate = req.body.vehiclePlate;
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
    if (req.body.password) updates.password = await bcrypt.hash(req.body.password, 10);
    const [updated] = await db.update(groceryDrivers).set(updates).where(eq(groceryDrivers.id, req.params.id)).returning();
    res.json({ ...updated, password: undefined });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/api/grocery/drivers/:id", async (req, res) => {
  await db.delete(groceryDrivers).where(eq(groceryDrivers.id, req.params.id));
  res.json({ success: true });
});

router.post("/api/grocery/driver-login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ error: "phone and password required" });
    const allDrivers = await db.select().from(groceryDrivers);
    const driver = allDrivers.find(d => d.phone === phone);
    if (!driver) return res.status(401).json({ error: "Invalid credentials" });
    const valid = await bcrypt.compare(password, driver.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    if (!driver.isActive) return res.status(403).json({ error: "Driver account deactivated" });
    await db.update(groceryDrivers).set({ isOnDuty: true, lastSeen: new Date() }).where(eq(groceryDrivers.id, driver.id));
    const [branch] = await db.select().from(groceryBranches).where(eq(groceryBranches.id, driver.branchId));
    res.json({ driver: { ...driver, password: undefined }, branch });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/grocery/driver/:id/location", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const [driver] = await db.select().from(groceryDrivers).where(eq(groceryDrivers.id, req.params.id));
    if (!driver || !driver.isActive) return res.status(403).json({ error: "Unauthorized" });
    await db.update(groceryDrivers).set({
      lastLocationLat: lat.toString(), lastLocationLng: lng.toString(), lastSeen: new Date(),
    }).where(eq(groceryDrivers.id, req.params.id));
    const deliveries = await db.select().from(groceryOrderDeliveries).where(
      and(eq(groceryOrderDeliveries.driverId, req.params.id), eq(groceryOrderDeliveries.deliveryStatus, "delivering"))
    );
    for (const del of deliveries) {
      broadcastToGroceryOrderTrackers(del.orderId, { type: "driver_location", lat, lng, driverId: req.params.id });
      const [order] = await db.select().from(groceryOrders).where(eq(groceryOrders.id, del.orderId));
      if (order) {
        broadcastToGroceryBranch(order.branchId, { type: "driver_location", lat, lng, driverId: req.params.id, orderId: del.orderId });
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/grocery/driver/:id/toggle-duty", async (req, res) => {
  const [driver] = await db.select().from(groceryDrivers).where(eq(groceryDrivers.id, req.params.id));
  if (!driver || !driver.isActive) return res.status(403).json({ error: "Unauthorized" });
  const [updated] = await db.update(groceryDrivers).set({ isOnDuty: !driver.isOnDuty, lastSeen: new Date() }).where(eq(groceryDrivers.id, req.params.id)).returning();
  res.json({ ...updated, password: undefined });
});

router.get("/api/grocery/driver/:id/orders", async (req, res) => {
  const [driver] = await db.select().from(groceryDrivers).where(eq(groceryDrivers.id, req.params.id));
  if (!driver || !driver.isActive) return res.status(403).json({ error: "Unauthorized" });
  const deliveries = await db.select().from(groceryOrderDeliveries).where(eq(groceryOrderDeliveries.driverId, req.params.id)).orderBy(desc(groceryOrderDeliveries.createdAt));
  const ordersWithDetails = [];
  for (const del of deliveries) {
    const [order] = await db.select().from(groceryOrders).where(eq(groceryOrders.id, del.orderId));
    if (order && !["completed", "cancelled"].includes(order.status)) {
      const items = await db.select().from(groceryOrderItems).where(eq(groceryOrderItems.orderId, order.id));
      ordersWithDetails.push({ ...del, order, items });
    }
  }
  res.json(ordersWithDetails);
});

router.post("/api/grocery/driver/:id/delivery-status", async (req, res) => {
  try {
    const { orderId, status } = req.body;
    if (!orderId || !status) return res.status(400).json({ error: "orderId and status required" });
    const [driver] = await db.select().from(groceryDrivers).where(eq(groceryDrivers.id, req.params.id));
    if (!driver || !driver.isActive) return res.status(403).json({ error: "Unauthorized" });
    const updates: any = { deliveryStatus: status };
    if (status === "accepted") updates.acceptedAt = new Date();
    if (status === "picked_up") updates.pickedUpAt = new Date();
    if (status === "delivering") updates.pickedUpAt = updates.pickedUpAt || new Date();
    if (status === "delivered") updates.deliveredAt = new Date();
    await db.update(groceryOrderDeliveries).set(updates).where(
      and(eq(groceryOrderDeliveries.orderId, orderId), eq(groceryOrderDeliveries.driverId, req.params.id))
    );
    const orderStatusMap: Record<string, string> = {
      accepted: "confirmed", picked_up: "delivering", delivering: "delivering", delivered: "completed",
    };
    const newOrderStatus = orderStatusMap[status];
    if (newOrderStatus) {
      await db.update(groceryOrders).set({ status: newOrderStatus as any }).where(eq(groceryOrders.id, orderId));
    }
    const [order] = await db.select().from(groceryOrders).where(eq(groceryOrders.id, orderId));
    if (order) {
      broadcastToGroceryBranch(order.branchId, { type: "delivery_status", orderId, deliveryStatus: status, orderStatus: newOrderStatus });
      broadcastToGroceryOrderTrackers(orderId, { type: "delivery_status", deliveryStatus: status, orderStatus: newOrderStatus });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/grocery/order-tracking/:orderId", async (req, res) => {
  try {
    const [order] = await db.select().from(groceryOrders).where(eq(groceryOrders.id, req.params.orderId));
    if (!order) return res.status(404).json({ error: "Order not found" });
    const [branch] = await db.select().from(groceryBranches).where(eq(groceryBranches.id, order.branchId));
    const items = await db.select().from(groceryOrderItems).where(eq(groceryOrderItems.orderId, order.id));
    const [delivery] = await db.select().from(groceryOrderDeliveries).where(eq(groceryOrderDeliveries.orderId, order.id));
    let driver = null;
    if (delivery?.driverId) {
      const [d] = await db.select().from(groceryDrivers).where(eq(groceryDrivers.id, delivery.driverId));
      driver = d ? { id: d.id, name: d.name, phone: d.phone, vehicleType: d.vehicleType, lastLocationLat: d.lastLocationLat, lastLocationLng: d.lastLocationLng } : null;
    }
    res.json({ order, branch, items, delivery, driver });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/grocery/stripe-key", async (_req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
});

// ============ BRANCH DUPLICATION ============
router.post("/api/grocery/branches/:id/duplicate", async (req, res) => {
  try {
    const { newName, newSlug } = req.body;
    if (!newName || !newSlug) return res.status(400).json({ error: "newName and newSlug are required" });

    const [original] = await db.select().from(groceryBranches).where(eq(groceryBranches.id, req.params.id));
    if (!original) return res.status(404).json({ error: "Branch not found" });

    const { id: _id, createdAt: _ca, slug: _slug, name: _name, branchNumber: _bn, ...branchData } = original;
    const allBranches = await db.select().from(groceryBranches);
    const maxNum = allBranches.reduce((max, b) => Math.max(max, b.branchNumber || 0), 0);

    const [newBranch] = await db.insert(groceryBranches).values({
      ...branchData,
      name: newName,
      slug: newSlug,
      branchNumber: maxNum + 1,
      logo: null,
      address: null,
      phone: null,
      email: null,
      loginUsername: null,
      loginPassword: null,
      stripePublishableKey: null,
      stripeSecretKey: null,
      stripeAccountId: null,
      sumupApiKey: null,
      sumupMerchantCode: null,
      squareAccessToken: null,
      squareLocationId: null,
      zettleApiKey: null,
      zettleMerchantId: null,
      easypaisaAccountNumber: null,
      easypaisaAccountName: null,
      jazzcashAccountNumber: null,
      jazzcashAccountName: null,
      hblAccountNumber: null,
      hblAccountName: null,
      hblIban: null,
      ublAccountNumber: null,
      ublAccountName: null,
      ublIban: null,
      meezanAccountNumber: null,
      meezanAccountName: null,
      meezanIban: null,
      alfalahAccountNumber: null,
      alfalahAccountName: null,
      alfalahIban: null,
      mcbAccountNumber: null,
      mcbAccountName: null,
      mcbIban: null,
      alliedAccountNumber: null,
      alliedAccountName: null,
      alliedIban: null,
      sadapayAccountNumber: null,
      sadapayAccountName: null,
      nayapayAccountNumber: null,
      nayapayAccountName: null,
      customSubdomain: null,
      customDomain: null,
      webAddressType: "default",
      serviceAreaType: "town",
      serviceAreaValue: null,
      welcomeBackgroundImageUrl: null,
      welcomeBackgroundVideoUrl: null,
      welcomeSliderImages: [],
      categoryBgType: "color",
      categoryBgImages: [],
    }).returning();

    const oldMainCats = await db.select().from(groceryMainCategories).where(eq(groceryMainCategories.branchId, req.params.id));
    const mainCatMap = new Map<string, string>();
    for (const cat of oldMainCats) {
      const { id: oldId, ...catData } = cat;
      const [newCat] = await db.insert(groceryMainCategories).values({ ...catData, branchId: newBranch.id }).returning();
      mainCatMap.set(oldId, newCat.id);
    }

    const oldSubCats = await db.select().from(grocerySubCategories).where(eq(grocerySubCategories.branchId, req.params.id));
    const subCatMap = new Map<string, string>();
    for (const cat of oldSubCats) {
      const { id: oldId, ...catData } = cat;
      const newMainCatId = mainCatMap.get(cat.mainCategoryId);
      if (!newMainCatId) continue;
      const [newCat] = await db.insert(grocerySubCategories).values({ ...catData, branchId: newBranch.id, mainCategoryId: newMainCatId }).returning();
      subCatMap.set(oldId, newCat.id);
    }

    const oldSubSubCats = await db.select().from(grocerySubSubCategories).where(eq(grocerySubSubCategories.branchId, req.params.id));
    const subSubCatMap = new Map<string, string>();
    for (const cat of oldSubSubCats) {
      const { id: oldId, ...catData } = cat;
      const newSubCatId = subCatMap.get(cat.subCategoryId);
      if (!newSubCatId) continue;
      const [newCat] = await db.insert(grocerySubSubCategories).values({ ...catData, branchId: newBranch.id, subCategoryId: newSubCatId }).returning();
      subSubCatMap.set(oldId, newCat.id);
    }

    const oldProducts = await db.select().from(groceryProducts).where(eq(groceryProducts.branchId, req.params.id));
    for (const prod of oldProducts) {
      const { id: _pid, createdAt: _pca, ...prodData } = prod;
      const newMainCatId = mainCatMap.get(prod.mainCategoryId);
      if (!newMainCatId) continue;
      const newSubCatId = prod.subCategoryId ? subCatMap.get(prod.subCategoryId) || null : null;
      const newSubSubCatId = prod.subSubCategoryId ? subSubCatMap.get(prod.subSubCategoryId) || null : null;
      await db.insert(groceryProducts).values({
        ...prodData,
        branchId: newBranch.id,
        mainCategoryId: newMainCatId,
        subCategoryId: newSubCatId,
        subSubCategoryId: newSubSubCatId,
      });
    }

    res.json({ ...newBranch, loginPassword: undefined });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============ GROCERY WEBSOCKET ============
const groceryBranchClients = new Map<string, Set<WebSocket>>();
const groceryDriverClients = new Map<string, WebSocket>();
const groceryOrderTrackingClients = new Map<string, Set<WebSocket>>();

function broadcastToGroceryBranch(branchId: string, data: any) {
  const clients = groceryBranchClients.get(branchId);
  if (clients) {
    const msg = JSON.stringify(data);
    clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(msg); });
  }
}

function sendToGroceryDriver(driverId: string, data: any) {
  const client = groceryDriverClients.get(driverId);
  if (client && client.readyState === WebSocket.OPEN) client.send(JSON.stringify(data));
}

function broadcastToGroceryOrderTrackers(orderId: string, data: any) {
  const clients = groceryOrderTrackingClients.get(orderId);
  if (clients) {
    const msg = JSON.stringify(data);
    clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(msg); });
  }
}

export function setupGroceryWebSocket(wss: WebSocket.Server) {
  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const groceryBranchId = url.searchParams.get("groceryBranchId");
    const groceryDriverId = url.searchParams.get("groceryDriverId");
    const groceryTrackOrderId = url.searchParams.get("groceryTrackOrderId");

    if (groceryTrackOrderId) {
      if (!groceryOrderTrackingClients.has(groceryTrackOrderId)) groceryOrderTrackingClients.set(groceryTrackOrderId, new Set());
      groceryOrderTrackingClients.get(groceryTrackOrderId)!.add(ws);
      ws.on("close", () => {
        groceryOrderTrackingClients.get(groceryTrackOrderId)?.delete(ws);
        if (groceryOrderTrackingClients.get(groceryTrackOrderId)?.size === 0) groceryOrderTrackingClients.delete(groceryTrackOrderId);
      });
    } else if (groceryDriverId) {
      groceryDriverClients.set(groceryDriverId, ws);
      ws.on("close", () => groceryDriverClients.delete(groceryDriverId));
    } else if (groceryBranchId) {
      if (!groceryBranchClients.has(groceryBranchId)) groceryBranchClients.set(groceryBranchId, new Set());
      groceryBranchClients.get(groceryBranchId)!.add(ws);
      ws.on("close", () => {
        groceryBranchClients.get(groceryBranchId)?.delete(ws);
      });
    }
  });
}

export async function seedGroceryDataIfEmpty() {
  try {
    let seedPath = path.resolve(process.cwd(), "server", "grocery-seed-data.json");
    if (!fs.existsSync(seedPath)) {
      seedPath = path.resolve(process.cwd(), "dist", "grocery-seed-data.json");
    }
    if (!fs.existsSync(seedPath)) {
      console.log("[grocery-seed] No seed data file found, skipping.");
      return;
    }

    const seedData = JSON.parse(fs.readFileSync(seedPath, "utf-8"));
    const existingBranches = await db.select().from(groceryBranches);
    const existingIds = new Set(existingBranches.map(b => b.id));
    const seedBranches = seedData.branches || [];

    const missingBranches = seedBranches.filter((b: any) => !existingIds.has(b.id));

    // Always sync settings for existing branches
    for (const seedBranch of seedBranches) {
      if (existingIds.has(seedBranch.id)) {
        const existing = existingBranches.find(b => b.id === seedBranch.id);
        if (existing) {
          const updates: any = {};
          const syncFields = [
            "categoryBgColor", "categoryBgType", "categoryBgAnimation", "categoryBgAnimationSpeed",
            "themeColor", "primaryColor", "accentColor", "headerBgColor", "productCardLayout",
            "secondaryColor", "slug", "name",
          ];
          for (const field of syncFields) {
            if (seedBranch[field] !== undefined && (existing as any)[field] !== seedBranch[field]) {
              updates[field] = seedBranch[field];
            }
          }
          if (Object.keys(updates).length > 0) {
            await db.update(groceryBranches).set(updates).where(eq(groceryBranches.id, seedBranch.id));
            console.log(`[grocery-seed] Synced settings for ${seedBranch.name}`);
          }
        }
      }
    }

    if (existingBranches.length === 0) {
      console.log("[grocery-seed] Grocery tables are empty. Seeding all data...");
    } else if (missingBranches.length > 0) {
      console.log(`[grocery-seed] Found ${missingBranches.length} missing branch(es). Syncing...`);
    } else {
      console.log("[grocery-seed] All branches synced.");
      return;
    }

    const branchesToSeed = existingBranches.length === 0 ? seedBranches : missingBranches;
    const branchIdsToSeed = new Set(branchesToSeed.map((b: any) => b.id));

    await db.transaction(async (tx) => {
      for (const branch of branchesToSeed) {
        const hashedPassword = branch.loginPassword && !branch.loginPassword.startsWith("$2b$")
          ? await bcrypt.hash(branch.loginPassword, 10)
          : branch.loginPassword;
        await tx.insert(groceryBranches).values({
          ...branch,
          loginPassword: hashedPassword,
          createdAt: branch.createdAt ? new Date(branch.createdAt) : new Date(),
        }).onConflictDoNothing();
      }
      console.log(`[grocery-seed] Seeded ${branchesToSeed.length} branch(es)`);

      const catsToSeed = (seedData.mainCats || []).filter((c: any) => branchIdsToSeed.has(c.branchId));
      for (const cat of catsToSeed) {
        await tx.insert(groceryMainCategories).values({
          id: cat.id,
          branchId: cat.branchId,
          name: cat.name,
          image: cat.image || null,
          gif: cat.gif || null,
          displayOrder: cat.displayOrder || 0,
          color: cat.color || null,
        }).onConflictDoNothing();
      }
      console.log(`[grocery-seed] Seeded ${catsToSeed.length} main categories`);

      const subsToSeed = (seedData.subCats || []).filter((s: any) => branchIdsToSeed.has(s.branchId));
      for (const sub of subsToSeed) {
        await tx.insert(grocerySubCategories).values({
          id: sub.id,
          mainCategoryId: sub.mainCategoryId,
          branchId: sub.branchId,
          name: sub.name,
          image: sub.image || null,
          gif: sub.gif || null,
          video: sub.video || null,
          displayOrder: sub.displayOrder || 0,
        }).onConflictDoNothing();
      }
      console.log(`[grocery-seed] Seeded ${subsToSeed.length} sub categories`);

      const subSubsToSeed = (seedData.subSubCats || []).filter((s: any) => branchIdsToSeed.has(s.branchId));
      for (const subSub of subSubsToSeed) {
        await tx.insert(grocerySubSubCategories).values({
          id: subSub.id,
          subCategoryId: subSub.subCategoryId,
          branchId: subSub.branchId,
          name: subSub.name,
          image: subSub.image || null,
          gif: subSub.gif || null,
          video: subSub.video || null,
          displayOrder: subSub.displayOrder || 0,
        }).onConflictDoNothing();
      }
      console.log(`[grocery-seed] Seeded ${subSubsToSeed.length} sub-sub categories`);

      const prodsToSeed = (seedData.products || []).filter((p: any) => branchIdsToSeed.has(p.branchId));
      for (const prod of prodsToSeed) {
        await tx.insert(groceryProducts).values({
          ...prod,
          createdAt: prod.createdAt ? new Date(prod.createdAt) : new Date(),
        }).onConflictDoNothing();
      }
      console.log(`[grocery-seed] Seeded ${prodsToSeed.length} products`);
    });

    console.log("[grocery-seed] Grocery data sync complete!");
  } catch (error) {
    console.error("[grocery-seed] Error seeding grocery data:", error);
  }
}

// ============ STAFF MANAGEMENT ============
router.get("/api/grocery/staff/:branchId", async (req: Request, res: Response) => {
  try {
    const staff = await db.select().from(groceryStaff).where(eq(groceryStaff.branchId, req.params.branchId)).orderBy(desc(groceryStaff.createdAt));
    res.json(staff.map(s => ({ ...s, password: undefined })));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch staff" });
  }
});

router.post("/api/grocery/staff", async (req: Request, res: Response) => {
  try {
    const { branchId, name, username, password, role, expiryDays } = req.body;
    if (!branchId || !name || !username || !password) return res.status(400).json({ error: "All fields required" });
    const hashedPassword = await bcrypt.hash(password, 10);
    let expiresAt: Date | null = null;
    if (expiryDays && [3, 5, 7].includes(Number(expiryDays))) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(expiryDays));
    }
    const [staff] = await db.insert(groceryStaff).values({ branchId, name, username, password: hashedPassword, role: role || "info-product", expiresAt }).returning();
    res.json({ ...staff, password: undefined });
  } catch (error: any) {
    if (error.code === "23505") return res.status(400).json({ error: "Username already exists" });
    res.status(500).json({ error: "Failed to create staff" });
  }
});

router.patch("/api/grocery/staff/:id", async (req: Request, res: Response) => {
  try {
    const updates: any = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.username) updates.username = req.body.username;
    if (req.body.password) updates.password = await bcrypt.hash(req.body.password, 10);
    if (typeof req.body.isActive === "boolean") updates.isActive = req.body.isActive;
    if (req.body.role) updates.role = req.body.role;
    if (req.body.expiryDays !== undefined) {
      if (req.body.expiryDays === null || req.body.expiryDays === "none") {
        updates.expiresAt = null;
      } else if ([3, 5, 7].includes(Number(req.body.expiryDays))) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + Number(req.body.expiryDays));
        updates.expiresAt = expiresAt;
      }
    }
    const [staff] = await db.update(groceryStaff).set(updates).where(eq(groceryStaff.id, req.params.id)).returning();
    res.json({ ...staff, password: undefined });
  } catch (error: any) {
    if (error.code === "23505") return res.status(400).json({ error: "Username already exists" });
    res.status(500).json({ error: "Failed to update staff" });
  }
});

router.delete("/api/grocery/staff/:id", async (req: Request, res: Response) => {
  try {
    await db.delete(groceryStaff).where(eq(groceryStaff.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete staff" });
  }
});

router.post("/api/grocery/staff-login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    const allStaff = await db.select().from(groceryStaff);
    console.log(`[Staff Login] Attempt: username="${username}", staff count: ${allStaff.length}, usernames: ${allStaff.map(s => s.username).join(', ')}`);
    const staffMember = allStaff.find(s => s.username === username);
    if (!staffMember) return res.status(401).json({ error: "Invalid credentials" });
    if (!staffMember.isActive) return res.status(401).json({ error: "Account is disabled" });
    if (staffMember.expiresAt && new Date(staffMember.expiresAt) < new Date()) {
      await db.delete(groceryStaff).where(eq(groceryStaff.id, staffMember.id));
      return res.status(401).json({ error: "Account has expired and been removed" });
    }
    const valid = await bcrypt.compare(password, staffMember.password);
    console.log(`[Staff Login] Password check for "${username}": valid=${valid}`);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    const branch = await db.select().from(groceryBranches).where(eq(groceryBranches.id, staffMember.branchId)).limit(1);
    if (!branch.length) return res.status(404).json({ error: "Branch not found" });
    res.json({
      staff: { id: staffMember.id, name: staffMember.name, role: staffMember.role },
      branch: { id: branch[0].id, name: branch[0].name, slug: branch[0].slug, currency: branch[0].currency },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/grocery/store/:slug/visit", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const branch = await db.select({ id: groceryBranches.id }).from(groceryBranches).where(eq(groceryBranches.slug, slug)).limit(1);
    if (!branch.length) return res.status(404).json({ error: "Branch not found" });
    await db.insert(groceryStoreVisits).values({ branchId: branch[0].id });
    res.json({ success: true });
  } catch (error) {
    console.error("Error tracking visit:", error);
    res.status(500).json({ error: "Failed to track visit" });
  }
});

router.get("/api/grocery/branches/:branchId/visit-stats", async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [todayResult] = await db.select({ count: count() })
      .from(groceryStoreVisits)
      .where(and(
        eq(groceryStoreVisits.branchId, branchId),
        gte(groceryStoreVisits.visitedAt, todayStart)
      ));

    const [weekResult] = await db.select({ count: count() })
      .from(groceryStoreVisits)
      .where(and(
        eq(groceryStoreVisits.branchId, branchId),
        gte(groceryStoreVisits.visitedAt, weekAgo)
      ));

    res.json({
      today: todayResult?.count || 0,
      lastWeek: weekResult?.count || 0,
    });
  } catch (error) {
    console.error("Error fetching visit stats:", error);
    res.status(500).json({ error: "Failed to fetch visit stats" });
  }
});

export { broadcastToGroceryBranch };
export default router;
