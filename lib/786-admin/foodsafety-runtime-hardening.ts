const FOODSAFETY_PROJECT_ID = "dd91a4bb-6bd0-4b67-9412-c452321a6452"

function replaceRequired(
  source: string,
  needle: string,
  replacement: string,
  label: string,
): string {
  if (source.includes(replacement)) return source
  if (!source.includes(needle)) {
    throw new Error(`FoodSafety runtime hardening failed: ${label} signature not found`)
  }
  return source.replace(needle, replacement)
}

function patchRouteBlock(
  source: string,
  routeMarker: string,
  needle: string,
  replacement: string,
  label: string,
): string {
  const start = source.indexOf(routeMarker)
  if (start < 0) {
    throw new Error(`FoodSafety runtime hardening failed: ${label} route not found`)
  }
  const nextRoute = source.indexOf("\n  app.", start + routeMarker.length)
  const end = nextRoute < 0 ? source.length : nextRoute
  const block = source.slice(start, end)
  if (block.includes(replacement)) return source
  if (!block.includes(needle)) {
    throw new Error(`FoodSafety runtime hardening failed: ${label} response signature not found`)
  }
  const patchedBlock = block.replace(needle, replacement)
  return source.slice(0, start) + patchedBlock + source.slice(end)
}

export function hardenFoodSafetyRuntime(
  projectId: string,
  files: Record<string, string>,
): Record<string, string> {
  if (projectId !== FOODSAFETY_PROJECT_ID) return files

  const runtimeFiles = { ...files }

  const serverPath = "server/index.ts"
  const serverSource = runtimeFiles[serverPath]
  if (!serverSource) {
    throw new Error("FoodSafety runtime hardening failed: server/index.ts missing")
  }

  runtimeFiles[serverPath] = replaceRequired(
    serverSource,
    "  await seedEcommerceData();",
    [
      "  // 786.Chat: optional e-commerce seed data is already present in FoodSafety's Neon database.",
      "  // Keep it out of Vercel cold starts so a transient DB connection does not delay startup.",
      "  if (!process.env.VERCEL) {",
      "    await seedEcommerceData();",
      "  }",
    ].join("\n"),
    "e-commerce seed guard",
  )

  const routesPath = "server/routes.ts"
  let routes = runtimeFiles[routesPath]
  if (!routes) {
    throw new Error("FoodSafety runtime hardening failed: server/routes.ts missing")
  }

  const helperMarker =
    "// 786.Chat: redact sensitive restaurant fields from unauthenticated public API responses."
  if (!routes.includes(helperMarker)) {
    const anchor = "// Track last auto-backup times per restaurant"
    if (!routes.includes(anchor)) {
      throw new Error("FoodSafety runtime hardening failed: restaurant redaction insertion point not found")
    }
    const helper = [
      helperMarker,
      "const publicRestaurantSensitiveField = /(?:password|secret|apiKey|token|accountNumber|accountName|sortCode|iban|merchantCode|merchantId|loginUsername|staffName|stripeAccountId|stripePublishableKey|squareLocationId)/i;",
      "function redactPublicRestaurantValue(value: any): any {",
      "  if (Array.isArray(value)) return value.map(redactPublicRestaurantValue);",
      "  if (!value || typeof value !== \"object\") return value;",
      "  return Object.fromEntries(",
      "    Object.entries(value)",
      "      .filter(([key]) => !publicRestaurantSensitiveField.test(key))",
      "      .map(([key, nestedValue]) => [key, redactPublicRestaurantValue(nestedValue)]),",
      "  );",
      "}",
      "function toPublicRestaurant(restaurant: any) {",
      "  return redactPublicRestaurantValue(restaurant);",
      "}",
      "",
    ].join("\n")
    routes = routes.replace(anchor, `${helper}${anchor}`)
  }

  routes = patchRouteBlock(
    routes,
    'app.get("/api/restaurants", async (req, res) => {',
    "      res.json(restaurants);",
    "      res.json(restaurants.map(toPublicRestaurant));",
    "restaurant list",
  )

  routes = patchRouteBlock(
    routes,
    'app.get("/api/restaurants/:slug", async (req, res) => {',
    "      res.json(restaurant);",
    "      res.json(toPublicRestaurant(restaurant));",
    "restaurant detail",
  )

  runtimeFiles[routesPath] = routes
  return runtimeFiles
}
