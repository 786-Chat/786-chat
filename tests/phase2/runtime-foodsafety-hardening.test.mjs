import assert from "node:assert/strict"
import test from "node:test"

import { hardenFoodSafetyRuntime } from "../../lib/786-admin/foodsafety-runtime-hardening.ts"

const FOODSAFETY_PROJECT_ID = "dd91a4bb-6bd0-4b67-9412-c452321a6452"

function fixture() {
  return {
    "server/index.ts": [
      "async function boot() {",
      "  await seedEcommerceData();",
      "}",
    ].join("\n"),
    "server/routes.ts": [
      "// imports",
      "// Track last auto-backup times per restaurant",
      "export async function registerRoutes(app, storage) {",
      '  app.get("/api/restaurants", async (req, res) => {',
      "    try {",
      "      const restaurants = await storage.getAllRestaurants();",
      "      res.json(restaurants);",
      "    } catch {}",
      "  });",
      '  app.get("/api/restaurants/:slug", async (req, res) => {',
      "    try {",
      "      const restaurant = await storage.getRestaurantBySlug(req.params.slug);",
      "      res.json(restaurant);",
      "    } catch {}",
      "  });",
      "}",
    ].join("\n"),
  }
}

test("FoodSafety Vercel runtime skips optional e-commerce seed and redacts public restaurant responses", () => {
  const files = hardenFoodSafetyRuntime(FOODSAFETY_PROJECT_ID, fixture())

  assert.match(files["server/index.ts"], /if \(!process\.env\.VERCEL\)/)
  assert.match(files["server/index.ts"], /await seedEcommerceData\(\);/)
  assert.match(files["server/routes.ts"], /function toPublicRestaurant/)
  assert.match(files["server/routes.ts"], /restaurants\.map\(toPublicRestaurant\)/)
  assert.match(files["server/routes.ts"], /toPublicRestaurant\(restaurant\)/)
  assert.match(files["server/routes.ts"], /loginUsername/)
  assert.match(files["server/routes.ts"], /accountNumber/)
  assert.match(files["server/routes.ts"], /stripePublishableKey/)
})

test("FoodSafety hardening leaves other generated projects untouched", () => {
  const files = fixture()
  assert.equal(hardenFoodSafetyRuntime("another-project", files), files)
})
