import type { Express } from "express";
import { db } from "./db";
import { sql, eq, and } from "drizzle-orm";
import * as schema from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";

let tableReady = false;

export async function ensureTvDisplayTable() {
  console.log("[TV Display] Will create table on first request if needed");
  tableReady = false;
}

async function createTableIfNeeded() {
  if (tableReady) return;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS tv_display_assignments (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      branch_id VARCHAR NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      tv_type INTEGER NOT NULL,
      name TEXT NOT NULL,
      config JSONB NOT NULL DEFAULT '{}',
      access_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      access_password TEXT,
      is_active BOOLEAN DEFAULT true,
      branch_enabled BOOLEAN DEFAULT true,
      orientation TEXT NOT NULL DEFAULT 'landscape',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS tv_display_customers (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      assigned_tvs JSONB NOT NULL DEFAULT '[]',
      tv_configs JSONB NOT NULL DEFAULT '{}',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    await db.execute(sql`ALTER TABLE tv_display_customers ADD COLUMN IF NOT EXISTS tv_configs JSONB NOT NULL DEFAULT '{}'`);
    tableReady = true;
    console.log("[TV Display] Tables ensured");
  } catch (err: any) {
    console.error("[TV Display] Table creation error:", err.message);
    throw err;
  }
}

export function registerTvDisplayRoutes(app: Express) {

  app.use("/api/tv-assignments", async (_req, _res, next) => {
    try { await createTableIfNeeded(); } catch (e) {}
    next();
  });
  app.use("/api/tv-display", async (_req, _res, next) => {
    try { await createTableIfNeeded(); } catch (e) {}
    next();
  });
  app.use("/api/branches", async (req, _res, next) => {
    if (req.path.includes("tv-assignments")) {
      try { await createTableIfNeeded(); } catch (e) {}
    }
    next();
  });

  // ==================== SUPER ADMIN ROUTES ====================

  // Get all TV assignments (super admin)
  app.get("/api/tv-assignments", async (_req, res) => {
    try {
      const assignments = await db.select().from(schema.tvDisplayAssignments);
      const restaurants = await db.select({ id: schema.restaurants.id, name: schema.restaurants.name, slug: schema.restaurants.slug }).from(schema.restaurants);
      const restaurantMap = Object.fromEntries(restaurants.map(r => [r.id, r]));
      const result = assignments.map(a => ({
        ...a,
        branchName: restaurantMap[a.branchId]?.name || "Unknown",
        branchSlug: restaurantMap[a.branchId]?.slug || "",
      }));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create or update a TV assignment (super admin)
  app.post("/api/tv-assignments", async (req, res) => {
    try {
      let { branchId, tvType, name, config, orientation, accessPassword } = req.body;
      if (!tvType || !name) {
        return res.status(400).json({ error: "tvType and name are required" });
      }
      if (!branchId || branchId === "default") {
        const [firstBranch] = await db.select({ id: schema.restaurants.id }).from(schema.restaurants).limit(1);
        if (!firstBranch) return res.status(400).json({ error: "No branches exist. Create a restaurant branch first." });
        branchId = firstBranch.id;
      }
      const existing = await db.select().from(schema.tvDisplayAssignments)
        .where(and(eq(schema.tvDisplayAssignments.branchId, branchId), eq(schema.tvDisplayAssignments.tvType, tvType)));
      if (existing.length > 0) {
        const [updated] = await db.update(schema.tvDisplayAssignments)
          .set({ name, config: config || {}, orientation: orientation || "landscape", accessPassword: accessPassword || null, updatedAt: new Date() })
          .where(eq(schema.tvDisplayAssignments.id, existing[0].id))
          .returning();
        return res.json(updated);
      }
      const [assignment] = await db.insert(schema.tvDisplayAssignments).values({
        branchId,
        tvType,
        name,
        config: config || {},
        orientation: orientation || "landscape",
        accessPassword: accessPassword || null,
      }).returning();
      res.json(assignment);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update a TV assignment config (super admin or branch owner)
  app.put("/api/tv-assignments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates: any = { updatedAt: new Date() };
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.config !== undefined) updates.config = req.body.config;
      if (req.body.orientation !== undefined) updates.orientation = req.body.orientation;
      if (req.body.tvType !== undefined) updates.tvType = req.body.tvType;
      if (req.body.accessPassword !== undefined) updates.accessPassword = req.body.accessPassword;
      
      const [updated] = await db.update(schema.tvDisplayAssignments)
        .set(updates)
        .where(eq(schema.tvDisplayAssignments.id, id))
        .returning();
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Toggle active on/off for a single TV assignment (super admin)
  app.patch("/api/tv-assignments/:id/toggle", async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const [updated] = await db.update(schema.tvDisplayAssignments)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(schema.tvDisplayAssignments.id, id))
        .returning();
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Toggle branch-level enable/disable for all TVs of a branch (super admin)
  app.patch("/api/tv-assignments/branch/:branchId/toggle", async (req, res) => {
    try {
      const { branchId } = req.params;
      const { branchEnabled } = req.body;
      const updated = await db.update(schema.tvDisplayAssignments)
        .set({ branchEnabled, updatedAt: new Date() })
        .where(eq(schema.tvDisplayAssignments.branchId, branchId))
        .returning();
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Reset access token (URL) for a TV assignment (super admin)
  app.post("/api/tv-assignments/:id/reset-token", async (_req, res) => {
    try {
      const { id } = _req.params;
      const newToken = crypto.randomUUID();
      const [updated] = await db.update(schema.tvDisplayAssignments)
        .set({ accessToken: newToken, updatedAt: new Date() })
        .where(eq(schema.tvDisplayAssignments.id, id))
        .returning();
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Reset password for a TV assignment (super admin)
  app.post("/api/tv-assignments/:id/reset-password", async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      const [updated] = await db.update(schema.tvDisplayAssignments)
        .set({ accessPassword: newPassword || null, updatedAt: new Date() })
        .where(eq(schema.tvDisplayAssignments.id, id))
        .returning();
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete a TV assignment (super admin)
  app.delete("/api/tv-assignments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(schema.tvDisplayAssignments)
        .where(eq(schema.tvDisplayAssignments.id, id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==================== BRANCH OWNER ROUTES ====================

  // Get TV assignments for a specific branch (branch owner dashboard)
  app.get("/api/branches/:branchId/tv-assignments", async (req, res) => {
    try {
      const { branchId } = req.params;
      const assignments = await db.select()
        .from(schema.tvDisplayAssignments)
        .where(eq(schema.tvDisplayAssignments.branchId, branchId));
      res.json(assignments);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==================== PUBLIC DISPLAY ROUTES ====================

  // Get TV display data by access token (public, for live TV screens)
  app.get("/api/tv-display/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const [assignment] = await db.select()
        .from(schema.tvDisplayAssignments)
        .where(eq(schema.tvDisplayAssignments.accessToken, token));
      
      if (!assignment) {
        return res.status(404).json({ error: "Display not found" });
      }

      if (!assignment.isActive || !assignment.branchEnabled) {
        return res.status(403).json({ error: "Display is currently inactive", inactive: true });
      }

      const [branch] = await db.select({
        name: schema.restaurants.name,
        slug: schema.restaurants.slug,
        logoUrl: schema.restaurants.logoUrl,
      }).from(schema.restaurants).where(eq(schema.restaurants.id, assignment.branchId));

      res.json({
        ...assignment,
        branchName: branch?.name || "",
        branchSlug: branch?.slug || "",
        branchLogo: branch?.logoUrl || "",
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Verify password for a protected TV display
  app.post("/api/tv-display/:token/verify", async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
      const [assignment] = await db.select()
        .from(schema.tvDisplayAssignments)
        .where(eq(schema.tvDisplayAssignments.accessToken, token));
      
      if (!assignment) {
        return res.status(404).json({ error: "Display not found" });
      }

      if (assignment.accessPassword && assignment.accessPassword !== password) {
        return res.status(401).json({ error: "Invalid password" });
      }

      res.json({ verified: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==================== TV Display Customer Management ====================

  app.get("/api/tv-display-customers", async (_req, res) => {
    try {
      await createTableIfNeeded();
      const customers = await db.select().from(schema.tvDisplayCustomers).orderBy(schema.tvDisplayCustomers.createdAt);
      res.json(customers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/tv-display-customers", async (req, res) => {
    try {
      await createTableIfNeeded();
      const { name, username, password, assignedTvs } = req.body;
      if (!name || !username || !password) {
        return res.status(400).json({ error: "Name, username, and password are required" });
      }
      const existing = await db.select().from(schema.tvDisplayCustomers).where(eq(schema.tvDisplayCustomers.username, username));
      if (existing.length > 0) {
        return res.status(400).json({ error: "Username already exists" });
      }
      const [customer] = await db.insert(schema.tvDisplayCustomers).values({
        name,
        username,
        password,
        assignedTvs: assignedTvs || [],
      }).returning();
      res.json(customer);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/tv-display-customers/:id", async (req, res) => {
    try {
      await createTableIfNeeded();
      const { id } = req.params;
      const updates: any = { updatedAt: new Date() };
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.username !== undefined) updates.username = req.body.username;
      if (req.body.password !== undefined) updates.password = req.body.password;
      if (req.body.assignedTvs !== undefined) updates.assignedTvs = req.body.assignedTvs;
      if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
      const [updated] = await db.update(schema.tvDisplayCustomers)
        .set(updates)
        .where(eq(schema.tvDisplayCustomers.id, id))
        .returning();
      if (!updated) return res.status(404).json({ error: "Customer not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/tv-display-customers/:id", async (req, res) => {
    try {
      await createTableIfNeeded();
      const { id } = req.params;
      await db.delete(schema.tvDisplayCustomers).where(eq(schema.tvDisplayCustomers.id, id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/tv-display-customers/login", async (req, res) => {
    try {
      await createTableIfNeeded();
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      const [customer] = await db.select().from(schema.tvDisplayCustomers)
        .where(eq(schema.tvDisplayCustomers.username, username));
      if (!customer) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      if (customer.password !== password) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      if (!customer.isActive) {
        return res.status(403).json({ error: "Your account has been deactivated. Please contact the administrator." });
      }
      const assignedTvs = (customer.assignedTvs as number[]) || [];
      const tvConfigs = (customer.tvConfigs as Record<string, any>) || {};
      const tvDisplays = assignedTvs.map(tvNum => {
        const cfg = tvConfigs[String(tvNum)];
        if (cfg) {
          return {
            id: `${customer.id}-tv${tvNum}`,
            tvType: tvNum,
            name: cfg.name || `TV ${tvNum}`,
            config: cfg.config || {},
            orientation: cfg.orientation || "landscape",
            accessToken: `cust-${customer.id}-tv${tvNum}`,
          };
        }
        return {
          id: `${customer.id}-tv${tvNum}`,
          tvType: tvNum,
          name: `TV ${tvNum}`,
          config: {},
          orientation: "landscape",
          accessToken: `cust-${customer.id}-tv${tvNum}`,
        };
      });
      res.json({
        customerId: customer.id,
        name: customer.name,
        assignedTvs,
        tvDisplays,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/tv-display-customers/:id/tvs", async (req, res) => {
    try {
      await createTableIfNeeded();
      const { id } = req.params;
      const [customer] = await db.select().from(schema.tvDisplayCustomers)
        .where(eq(schema.tvDisplayCustomers.id, id));
      if (!customer) return res.status(404).json({ error: "Customer not found" });
      if (!customer.isActive) return res.status(403).json({ error: "Account deactivated" });
      const assignedTvs = (customer.assignedTvs as number[]) || [];
      const tvConfigs = (customer.tvConfigs as Record<string, any>) || {};
      const tvDisplays = assignedTvs.map(tvNum => {
        const cfg = tvConfigs[String(tvNum)] || {};
        return {
          id: `${customer.id}-tv${tvNum}`,
          tvType: tvNum,
          name: cfg.name || `TV ${tvNum}`,
          config: cfg.config || {},
          orientation: cfg.orientation || "landscape",
        };
      });
      res.json(tvDisplays);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/tv-display-customers/:id/tv/:tvNum", async (req, res) => {
    try {
      await createTableIfNeeded();
      const { id, tvNum } = req.params;
      const [customer] = await db.select().from(schema.tvDisplayCustomers)
        .where(eq(schema.tvDisplayCustomers.id, id));
      if (!customer) return res.status(404).json({ error: "Customer not found" });
      if (!customer.isActive) return res.status(403).json({ error: "Account deactivated" });
      const tvConfigs = (customer.tvConfigs as Record<string, any>) || {};
      const cfg = tvConfigs[tvNum] || {};
      res.json({
        tvType: parseInt(tvNum),
        name: cfg.name || `TV ${tvNum}`,
        config: cfg.config || {},
        orientation: cfg.orientation || "landscape",
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/tv-display-customers/:id/tv/:tvNum", async (req, res) => {
    try {
      await createTableIfNeeded();
      const { id, tvNum } = req.params;
      const { config, orientation, name } = req.body;
      const [customer] = await db.select().from(schema.tvDisplayCustomers)
        .where(eq(schema.tvDisplayCustomers.id, id));
      if (!customer) return res.status(404).json({ error: "Customer not found" });
      const tvConfigs = (customer.tvConfigs as Record<string, any>) || {};
      tvConfigs[tvNum] = { config: config || {}, orientation: orientation || "landscape", name: name || `TV ${tvNum}` };
      const [updated] = await db.update(schema.tvDisplayCustomers)
        .set({ tvConfigs, updatedAt: new Date() })
        .where(eq(schema.tvDisplayCustomers.id, id))
        .returning();
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/tv-customer-display/:customerId/:tvNum", async (req, res) => {
    try {
      await createTableIfNeeded();
      const { customerId, tvNum } = req.params;
      const [customer] = await db.select().from(schema.tvDisplayCustomers)
        .where(eq(schema.tvDisplayCustomers.id, customerId));
      if (!customer) return res.status(404).json({ error: "Display not found" });
      if (!customer.isActive) return res.status(403).json({ error: "Display is currently inactive", inactive: true });
      const assignedTvs = (customer.assignedTvs as number[]) || [];
      if (!assignedTvs.includes(parseInt(tvNum))) return res.status(403).json({ error: "TV not assigned", inactive: true });
      const tvConfigs = (customer.tvConfigs as Record<string, any>) || {};
      const cfg = tvConfigs[tvNum] || {};
      res.json({
        id: `${customerId}-tv${tvNum}`,
        tvType: parseInt(tvNum),
        name: cfg.name || `TV ${tvNum}`,
        config: cfg.config || {},
        orientation: cfg.orientation || "landscape",
        isActive: true,
        branchEnabled: true,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
