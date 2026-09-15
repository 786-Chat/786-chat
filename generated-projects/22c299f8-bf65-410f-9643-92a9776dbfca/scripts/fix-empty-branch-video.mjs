import { readFile, writeFile } from "node:fs/promises";

const path = new URL("../client/src/pages/AdminDashboard.tsx", import.meta.url);
const source = await readFile(path, "utf8");
const pattern = /\{activeTab\s*===\s*["']branch-login-video["']\s*&&\s*\(\s*\)\}/g;
const fixed = source.replace(pattern, "");

if (fixed === source) {
  console.log("Pest Control JSX cleanup: no empty branch-login-video block found.");
} else {
  await writeFile(path, fixed, "utf8");
  console.log("Pest Control JSX cleanup: removed empty branch-login-video block.");
}
