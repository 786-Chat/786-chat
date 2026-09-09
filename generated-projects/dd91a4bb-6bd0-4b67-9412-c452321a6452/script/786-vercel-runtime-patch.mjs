import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

if (!process.env.VERCEL) {
  process.exit(0);
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function write(relativePath, content) {
  fs.writeFileSync(path.join(projectRoot, relativePath), content, "utf8");
}

function replaceRequired(source, needle, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(needle)) {
    throw new Error(`[786-runtime-patch] ${label} signature not found`);
  }
  return source.replace(needle, replacement);
}

function patchRouteBlock(source, routeMarker, needle, replacement, label) {
  const start = source.indexOf(routeMarker);
  if (start < 0) throw new Error(`[786-runtime-patch] ${label} route not found`);
  const nextRoute = source.indexOf("\n  app.", start + routeMarker.length);
  const end = nextRoute < 0 ? source.length : nextRoute;
  const block = source.slice(start, end);
  if (block.includes(replacement)) return source;
  if (!block.includes(needle)) {
    throw new Error(`[786-runtime-patch] ${label} response signature not found`);
  }
  const patchedBlock = block.replace(needle, replacement);
  return source.slice(0, start) + patchedBlock + source.slice(end);
}

let serverIndex = read("server/index.ts");
serverIndex = replaceRequired(
  serverIndex,
  "  await seedEcommerceData();",
  [
    "  // 786.Chat: optional demo/e-commerce seed data is already present in the generated Neon database.",
    "  // Do not make every Vercel cold start wait for this non-essential database seed.",
    "  if (!process.env.VERCEL) {",
    "    await seedEcommerceData();",
    "  }",
  ].join("\n"),
  "e-commerce seed guard",
);
write("server/index.ts", serverIndex);

let routes = read("server/routes.ts");
const helperMarker = "// 786.Chat: redact sensitive restaurant fields from unauthenticated public API responses.";
if (!routes.includes(helperMarker)) {
  const anchor = "// Track last auto-backup times per restaurant";
  if (!routes.includes(anchor)) {
    throw new Error("[786-runtime-patch] restaurant redaction insertion point not found");
  }
  const helper = [
    helperMarker,
    "function toPublicRestaurant(restaurant) {",
    "  const sensitiveField = /(?:password|secret|apiKey|accessToken|accountNumber|accountName|sortCode|iban|merchantCode|merchantId|loginUsername|staffName|stripeAccountId|stripePublishableKey|squareLocationId)/i;",
    "  return Object.fromEntries(",
    "    Object.entries(restaurant).filter(([key]) => !sensitiveField.test(key)),",
    "  );",
    "}",
    "",
  ].join("\n");
  routes = routes.replace(anchor, `${helper}${anchor}`);
}

routes = patchRouteBlock(
  routes,
  'app.get("/api/restaurants", async (req, res) => {',
  "      res.json(restaurants);",
  "      res.json(restaurants.map(toPublicRestaurant));",
  "restaurant list",
);

routes = patchRouteBlock(
  routes,
  'app.get("/api/restaurants/:slug", async (req, res) => {',
  "      res.json(restaurant);",
  "      res.json(toPublicRestaurant(restaurant));",
  "restaurant detail",
);

write("server/routes.ts", routes);
console.log("[786-runtime-patch] FoodSafety Vercel startup and public restaurant API hardened.");
