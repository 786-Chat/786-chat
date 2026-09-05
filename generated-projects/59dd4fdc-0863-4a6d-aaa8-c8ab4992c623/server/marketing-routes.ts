import { Router, Request, Response } from "express";
import { db } from "./db";
import { marketingStaff, marketingLeads, marketingPayments } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

const router = Router();

router.get("/api/marketing-staff", async (_req: Request, res: Response) => {
  const staff = await db.select().from(marketingStaff).orderBy(desc(marketingStaff.createdAt));
  const safeStaff = staff.map(s => ({ ...s, password: undefined }));
  res.json(safeStaff);
});

router.get("/api/marketing-staff/:id", async (req: Request, res: Response) => {
  const [staff] = await db.select().from(marketingStaff).where(eq(marketingStaff.id, req.params.id));
  if (!staff) return res.status(404).json({ error: "Staff not found" });
  res.json({ ...staff, password: undefined });
});

router.post("/api/marketing-staff", async (req: Request, res: Response) => {
  try {
    const { password, ...rest } = req.body;
    if (rest.salaryAmount === "" || rest.salaryAmount === undefined) rest.salaryAmount = "0";
    if (rest.commissionAmount === "" || rest.commissionAmount === undefined) rest.commissionAmount = "0";
    if (rest.dailyVisitTarget === "" || rest.dailyVisitTarget === undefined) rest.dailyVisitTarget = 10;
    const hashedPassword = await bcrypt.hash(password, 10);
    const [created] = await db.insert(marketingStaff).values({ ...rest, password: hashedPassword }).returning();
    res.json({ ...created, password: undefined });
  } catch (e: any) {
    if (e.message?.includes("duplicate key")) {
      return res.status(400).json({ error: "Username already exists" });
    }
    res.status(500).json({ error: e.message });
  }
});

router.patch("/api/marketing-staff/:id", async (req: Request, res: Response) => {
  const updates = { ...req.body };
  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, 10);
  } else {
    delete updates.password;
  }
  if (updates.salaryAmount === "") updates.salaryAmount = "0";
  if (updates.commissionAmount === "") updates.commissionAmount = "0";
  if (updates.dailyVisitTarget === "") updates.dailyVisitTarget = 10;
  const [updated] = await db.update(marketingStaff).set(updates).where(eq(marketingStaff.id, req.params.id)).returning();
  if (!updated) return res.status(404).json({ error: "Staff not found" });
  res.json({ ...updated, password: undefined });
});

router.delete("/api/marketing-staff/:id", async (req: Request, res: Response) => {
  await db.delete(marketingStaff).where(eq(marketingStaff.id, req.params.id));
  res.json({ success: true });
});

router.post("/api/marketing-staff/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });
  const [staff] = await db.select().from(marketingStaff).where(eq(marketingStaff.username, username));
  if (!staff) return res.status(401).json({ error: "Invalid credentials" });
  if (staff.status !== "active") return res.status(403).json({ error: "Account is inactive" });

  let valid = false;
  try {
    valid = await bcrypt.compare(password, staff.password);
  } catch {
    valid = password === staff.password;
    if (valid) {
      const hashed = await bcrypt.hash(password, 10);
      await db.update(marketingStaff).set({ password: hashed }).where(eq(marketingStaff.id, staff.id));
    }
  }
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });
  res.json({ id: staff.id, name: staff.name, username: staff.username, photo: staff.photo, currency: staff.currency, dailyVisitTarget: staff.dailyVisitTarget, paymentType: staff.paymentType, commissionAmount: staff.commissionAmount });
});

router.get("/api/marketing-leads", async (_req: Request, res: Response) => {
  const leads = await db.select().from(marketingLeads).orderBy(desc(marketingLeads.createdAt));
  res.json(leads);
});

router.get("/api/marketing-staff/:id/leads", async (req: Request, res: Response) => {
  const leads = await db.select().from(marketingLeads).where(eq(marketingLeads.staffId, req.params.id)).orderBy(desc(marketingLeads.createdAt));
  res.json(leads);
});

router.post("/api/marketing-leads", async (req: Request, res: Response) => {
  try {
    const [created] = await db.insert(marketingLeads).values(req.body).returning();
    const [staff] = await db.select().from(marketingStaff).where(eq(marketingStaff.id, req.body.staffId));
    if (staff && (staff.paymentType === "commission_only" || staff.paymentType === "fixed_salary_commission")) {
      const commAmount = staff.commissionAmount || "0";
      if (parseFloat(commAmount) > 0) {
        await db.insert(marketingPayments).values({
          staffId: staff.id,
          amount: commAmount,
          type: "commission",
          leadId: created.id,
          status: "pending",
        });
      }
    }
    res.json(created);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/api/marketing-leads/:id", async (req: Request, res: Response) => {
  const [updated] = await db.update(marketingLeads).set(req.body).where(eq(marketingLeads.id, req.params.id)).returning();
  if (!updated) return res.status(404).json({ error: "Lead not found" });
  res.json(updated);
});

router.delete("/api/marketing-leads/:id", async (req: Request, res: Response) => {
  await db.delete(marketingLeads).where(eq(marketingLeads.id, req.params.id));
  res.json({ success: true });
});

router.get("/api/marketing-staff/:id/payments", async (req: Request, res: Response) => {
  const payments = await db.select().from(marketingPayments).where(eq(marketingPayments.staffId, req.params.id)).orderBy(desc(marketingPayments.createdAt));
  res.json(payments);
});

router.get("/api/marketing-payments", async (_req: Request, res: Response) => {
  const payments = await db.select().from(marketingPayments).orderBy(desc(marketingPayments.createdAt));
  res.json(payments);
});

router.post("/api/marketing-payments", async (req: Request, res: Response) => {
  const [created] = await db.insert(marketingPayments).values(req.body).returning();
  res.json(created);
});

router.patch("/api/marketing-payments/:id", async (req: Request, res: Response) => {
  const updates = { ...req.body };
  if (updates.status === "paid") {
    updates.paidAt = new Date();
  }
  const [updated] = await db.update(marketingPayments).set(updates).where(eq(marketingPayments.id, req.params.id)).returning();
  if (!updated) return res.status(404).json({ error: "Payment not found" });
  res.json(updated);
});

router.get("/api/marketing-staff/:id/stats", async (req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayLeads = await db.select().from(marketingLeads)
    .where(and(eq(marketingLeads.staffId, req.params.id), sql`${marketingLeads.createdAt} >= ${today}`));
  const allLeads = await db.select().from(marketingLeads).where(eq(marketingLeads.staffId, req.params.id));
  const pendingPayments = await db.select().from(marketingPayments)
    .where(and(eq(marketingPayments.staffId, req.params.id), eq(marketingPayments.status, "pending")));
  const paidPayments = await db.select().from(marketingPayments)
    .where(and(eq(marketingPayments.staffId, req.params.id), eq(marketingPayments.status, "paid")));

  res.json({
    todayVisits: todayLeads.length,
    totalLeads: allLeads.length,
    pendingLeads: allLeads.filter(l => l.status === "pending").length,
    approvedLeads: allLeads.filter(l => l.status === "approved").length,
    pendingAmount: pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
    paidAmount: paidPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
  });
});

export default router;
