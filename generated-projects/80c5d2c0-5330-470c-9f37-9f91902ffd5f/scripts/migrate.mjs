import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = await readFile(new URL("../sql/migrations/001_initial.sql", import.meta.url), "utf8");
const sql2 = await readFile(new URL("../sql/migrations/002_ingredient_usage.sql", import.meta.url), "utf8");
const sql3 = await readFile(new URL("../sql/migrations/003_cleaning.sql", import.meta.url), "utf8");
const sql4 = await readFile(new URL("../sql/migrations/004_stock.sql", import.meta.url), "utf8");
const db = neon(url);

try {
  await db(sql);
  await db(sql2);
  await db(sql3);
  await db(sql4);
  console.log("Migrations applied successfully");
} catch (err) {
  console.error("Migration failed:", err);
  process.exit(1);
}
