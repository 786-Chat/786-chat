import { Router, Request, Response } from "express";
import { db } from "./db";
import { furnitureBrands, furnitureCategories, furnitureProducts, furnitureOrders } from "@shared/schema";
import { eq, and, desc, asc, ilike } from "drizzle-orm";
import { WebSocket, WebSocketServer } from "ws";
import type { Server } from "http";

const router = Router();

const furnitureClients = new Map<string, Set<WebSocket>>();

export function setupFurnitureWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/furniture-ws" });
  wss.on("connection", (ws: WebSocket, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const brandId = url.searchParams.get("brandId");
    if (brandId) {
      if (!furnitureClients.has(brandId)) furnitureClients.set(brandId, new Set());
      furnitureClients.get(brandId)!.add(ws);
      ws.on("close", () => { furnitureClients.get(brandId)?.delete(ws); });
    }
  });
  console.log("[Furniture] WebSocket server ready on /furniture-ws");
}

function notifyFurnitureBrand(brandId: string, data: any) {
  const clients = furnitureClients.get(brandId);
  if (clients) {
    const msg = JSON.stringify(data);
    clients.forEach(ws => { if (ws.readyState === WebSocket.OPEN) ws.send(msg); });
  }
}

router.get("/api/furniture/brands", async (_req: Request, res: Response) => {
  const brands = await db.select().from(furnitureBrands).orderBy(asc(furnitureBrands.name));
  res.json(brands);
});

router.get("/api/furniture/brands/:id", async (req: Request, res: Response) => {
  const [brand] = await db.select().from(furnitureBrands).where(eq(furnitureBrands.id, req.params.id));
  if (!brand) return res.status(404).json({ message: "Brand not found" });
  res.json(brand);
});

router.get("/api/furniture/brands/by-slug/:slug", async (req: Request, res: Response) => {
  const [brand] = await db.select().from(furnitureBrands).where(eq(furnitureBrands.slug, req.params.slug));
  if (!brand) return res.status(404).json({ message: "Brand not found" });
  if (!brand.isActive) return res.status(403).json({ message: "Store is currently unavailable" });
  res.json(brand);
});

router.post("/api/furniture/brands", async (req: Request, res: Response) => {
  const slug = req.body.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const [brand] = await db.insert(furnitureBrands).values({ ...req.body, slug }).returning();
  res.json(brand);
});

router.patch("/api/furniture/brands/:id", async (req: Request, res: Response) => {
  const [brand] = await db.update(furnitureBrands).set(req.body).where(eq(furnitureBrands.id, req.params.id)).returning();
  res.json(brand);
});

router.delete("/api/furniture/brands/:id", async (req: Request, res: Response) => {
  await db.delete(furnitureBrands).where(eq(furnitureBrands.id, req.params.id));
  res.json({ success: true });
});

router.post("/api/furniture/brand-login", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const [brand] = await db.select().from(furnitureBrands)
    .where(and(eq(furnitureBrands.adminUsername, username), eq(furnitureBrands.adminPassword, password)));
  if (!brand) return res.status(401).json({ message: "Invalid credentials" });
  if (!brand.isActive) return res.status(403).json({ message: "This brand is currently inactive" });
  res.json(brand);
});

router.get("/api/furniture/categories", async (req: Request, res: Response) => {
  const brandId = req.query.brandId as string | undefined;
  const cats = brandId
    ? await db.select().from(furnitureCategories).where(eq(furnitureCategories.brandId, brandId)).orderBy(asc(furnitureCategories.sortOrder))
    : await db.select().from(furnitureCategories).orderBy(asc(furnitureCategories.sortOrder));
  res.json(cats);
});

router.post("/api/furniture/categories", async (req: Request, res: Response) => {
  const slug = req.body.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const [cat] = await db.insert(furnitureCategories).values({ ...req.body, slug }).returning();
  res.json(cat);
});

router.patch("/api/furniture/categories/:id", async (req: Request, res: Response) => {
  const [cat] = await db.update(furnitureCategories).set(req.body).where(eq(furnitureCategories.id, req.params.id)).returning();
  res.json(cat);
});

router.delete("/api/furniture/categories/:id", async (req: Request, res: Response) => {
  await db.delete(furnitureCategories).where(eq(furnitureCategories.id, req.params.id));
  res.json({ success: true });
});

router.get("/api/furniture/products", async (req: Request, res: Response) => {
  const { brandId, categoryId } = req.query;
  const conditions = [];
  if (brandId) conditions.push(eq(furnitureProducts.brandId, brandId as string));
  if (categoryId) conditions.push(eq(furnitureProducts.categoryId, categoryId as string));
  const products = conditions.length > 0
    ? await db.select().from(furnitureProducts).where(and(...conditions)).orderBy(asc(furnitureProducts.sortOrder))
    : await db.select().from(furnitureProducts).orderBy(asc(furnitureProducts.sortOrder));
  res.json(products);
});

router.get("/api/furniture/products/:id", async (req: Request, res: Response) => {
  const [product] = await db.select().from(furnitureProducts).where(eq(furnitureProducts.id, req.params.id));
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
});

router.post("/api/furniture/products", async (req: Request, res: Response) => {
  const slug = req.body.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const [product] = await db.insert(furnitureProducts).values({ ...req.body, slug }).returning();
  res.json(product);
});

router.patch("/api/furniture/products/:id", async (req: Request, res: Response) => {
  const [product] = await db.update(furnitureProducts).set(req.body).where(eq(furnitureProducts.id, req.params.id)).returning();
  res.json(product);
});

router.delete("/api/furniture/products/:id", async (req: Request, res: Response) => {
  await db.delete(furnitureProducts).where(eq(furnitureProducts.id, req.params.id));
  res.json({ success: true });
});

router.get("/api/furniture/orders", async (req: Request, res: Response) => {
  const brandId = req.query.brandId as string | undefined;
  const orders = brandId
    ? await db.select().from(furnitureOrders).where(eq(furnitureOrders.brandId, brandId)).orderBy(desc(furnitureOrders.createdAt))
    : await db.select().from(furnitureOrders).orderBy(desc(furnitureOrders.createdAt));
  res.json(orders);
});

router.post("/api/furniture/orders", async (req: Request, res: Response) => {
  const [order] = await db.insert(furnitureOrders).values(req.body).returning();
  if (order.brandId) {
    notifyFurnitureBrand(order.brandId, { type: "new_order", order });
  }
  res.json(order);
});

router.patch("/api/furniture/orders/:id", async (req: Request, res: Response) => {
  const [order] = await db.update(furnitureOrders).set(req.body).where(eq(furnitureOrders.id, req.params.id)).returning();
  res.json(order);
});

router.post("/api/furniture/brands/:id/duplicate", async (req: Request, res: Response) => {
  const [original] = await db.select().from(furnitureBrands).where(eq(furnitureBrands.id, req.params.id));
  if (!original) return res.status(404).json({ message: "Brand not found" });
  const newName = req.body.name || `${original.name} (Copy)`;
  const newSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const { id, createdAt, ...rest } = original;
  const [newBrand] = await db.insert(furnitureBrands).values({ ...rest, name: newName, slug: newSlug, adminUsername: (original.adminUsername || "") + "_copy" }).returning();

  const cats = await db.select().from(furnitureCategories).where(eq(furnitureCategories.brandId, id));
  const catMap: Record<string, string> = {};
  for (const cat of cats) {
    const { id: catId, createdAt: cc, ...catRest } = cat;
    const [newCat] = await db.insert(furnitureCategories).values({ ...catRest, brandId: newBrand.id }).returning();
    catMap[catId] = newCat.id;
  }

  const products = await db.select().from(furnitureProducts).where(eq(furnitureProducts.brandId, id));
  for (const prod of products) {
    const { id: pId, createdAt: pc, ...prodRest } = prod;
    await db.insert(furnitureProducts).values({
      ...prodRest, brandId: newBrand.id,
      categoryId: prod.categoryId && catMap[prod.categoryId] ? catMap[prod.categoryId] : null,
    });
  }
  res.json(newBrand);
});

export default router;
