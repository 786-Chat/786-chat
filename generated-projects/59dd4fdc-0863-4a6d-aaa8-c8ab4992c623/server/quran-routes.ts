import { Router, Request, Response } from "express";
import { db } from "./db";
import { quranAcademies, quranStudents, quranSessions } from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";

const router = Router();

router.get("/api/quran/academies", async (_req: Request, res: Response) => {
  const academies = await db.select().from(quranAcademies).orderBy(asc(quranAcademies.name));
  res.json(academies);
});

router.get("/api/quran/academies/:id", async (req: Request, res: Response) => {
  const [academy] = await db.select().from(quranAcademies).where(eq(quranAcademies.id, req.params.id));
  if (!academy) return res.status(404).json({ message: "Academy not found" });
  res.json(academy);
});

router.get("/api/quran/academies/by-slug/:slug", async (req: Request, res: Response) => {
  const [academy] = await db.select().from(quranAcademies).where(eq(quranAcademies.slug, req.params.slug));
  if (!academy) return res.status(404).json({ message: "Academy not found" });
  res.json(academy);
});

router.post("/api/quran/academies", async (req: Request, res: Response) => {
  const slug = req.body.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const [academy] = await db.insert(quranAcademies).values({ ...req.body, slug }).returning();
  res.json(academy);
});

router.patch("/api/quran/academies/:id", async (req: Request, res: Response) => {
  const [academy] = await db.update(quranAcademies).set(req.body).where(eq(quranAcademies.id, req.params.id)).returning();
  res.json(academy);
});

router.delete("/api/quran/academies/:id", async (req: Request, res: Response) => {
  await db.delete(quranAcademies).where(eq(quranAcademies.id, req.params.id));
  res.json({ success: true });
});

router.post("/api/quran/academies/:id/duplicate", async (req: Request, res: Response) => {
  const [original] = await db.select().from(quranAcademies).where(eq(quranAcademies.id, req.params.id));
  if (!original) return res.status(404).json({ message: "Academy not found" });
  const { id, createdAt, slug, ...data } = original;
  const newSlug = `${slug}-copy-${Date.now()}`;
  const [academy] = await db.insert(quranAcademies).values({ ...data, name: `${data.name} (Copy)`, slug: newSlug }).returning();
  res.json(academy);
});

router.post("/api/quran/academy-login", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const [academy] = await db.select().from(quranAcademies).where(
    and(eq(quranAcademies.adminUsername, username), eq(quranAcademies.adminPassword, password))
  );
  if (!academy) return res.status(401).json({ message: "Invalid credentials" });
  if (!academy.isActive) return res.status(403).json({ message: "Academy is inactive" });
  res.json(academy);
});

router.post("/api/quran/student-login", async (req: Request, res: Response) => {
  const username = (req.body.username || "").trim();
  const password = (req.body.password || "").trim();
  const allStudents = await db.select().from(quranStudents);
  const student = allStudents.find(s => 
    (s.loginUsername || "").trim().toLowerCase() === username.toLowerCase() && 
    (s.loginPassword || "").trim() === password
  );
  if (!student) return res.status(401).json({ message: "Invalid credentials" });
  if (!student.isActive) return res.status(403).json({ message: "Account is inactive" });
  const [academy] = await db.select().from(quranAcademies).where(eq(quranAcademies.id, student.academyId));
  res.json({ student, academy });
});

router.get("/api/quran/students/:id", async (req: Request, res: Response) => {
  const [student] = await db.select().from(quranStudents).where(eq(quranStudents.id, req.params.id));
  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json(student);
});

router.get("/api/quran/academies/:academyId/students", async (req: Request, res: Response) => {
  const students = await db.select().from(quranStudents)
    .where(eq(quranStudents.academyId, req.params.academyId))
    .orderBy(desc(quranStudents.createdAt));
  res.json(students);
});

router.post("/api/quran/students", async (req: Request, res: Response) => {
  const [student] = await db.insert(quranStudents).values(req.body).returning();
  res.json(student);
});

router.patch("/api/quran/students/:id", async (req: Request, res: Response) => {
  const [student] = await db.update(quranStudents).set(req.body).where(eq(quranStudents.id, req.params.id)).returning();
  res.json(student);
});

router.delete("/api/quran/students/:id", async (req: Request, res: Response) => {
  await db.delete(quranStudents).where(eq(quranStudents.id, req.params.id));
  res.json({ success: true });
});

router.get("/api/quran/students/:studentId/sessions", async (req: Request, res: Response) => {
  const sessions = await db.select().from(quranSessions)
    .where(eq(quranSessions.studentId, req.params.studentId))
    .orderBy(desc(quranSessions.createdAt));
  res.json(sessions);
});

router.post("/api/quran/sessions", async (req: Request, res: Response) => {
  const [session] = await db.insert(quranSessions).values(req.body).returning();
  res.json(session);
});

router.patch("/api/quran/sessions/:id", async (req: Request, res: Response) => {
  const [session] = await db.update(quranSessions).set(req.body).where(eq(quranSessions.id, req.params.id)).returning();
  if (session.status === "completed" && session.studentId) {
    const [student] = await db.select().from(quranStudents).where(eq(quranStudents.id, session.studentId));
    if (student) {
      await db.update(quranStudents).set({
        totalMistakes: (student.totalMistakes || 0) + (session.mistakes || 0),
        sessionsCompleted: (student.sessionsCompleted || 0) + 1,
      }).where(eq(quranStudents.id, session.studentId));
    }
  }
  res.json(session);
});

export default router;
