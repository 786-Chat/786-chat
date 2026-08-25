import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = await readFile(new URL("../sql/migrations/001_initial.sql", import.meta.url), "utf8");
const db = neon(url);

try {
  await db(sql);
  console.log("Migration applied successfully");
} catch (err) {
  console.error("Migration failed:", err);
  process.exit(1);
}
