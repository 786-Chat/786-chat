import { describe, expect, it } from "vitest"
import { hardenFoodSafetyRuntime } from "@/lib/786-admin/foodsafety-runtime-hardening"

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
      "export async function registerRoutes(app: any, storage: any) {",
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

describe("hardenFoodSafetyRuntime", () => {
  it("skips the optional e-commerce seed on Vercel and redacts public restaurant responses", () => {
    const files = hardenFoodSafetyRuntime(FOODSAFETY_PROJECT_ID, fixture())

    expect(files["server/index.ts"]).toContain("if (!process.env.VERCEL)")
    expect(files["server/index.ts"]).toContain("await seedEcommerceData();")
    expect(files["server/routes.ts"]).toContain("function toPublicRestaurant")
    expect(files["server/routes.ts"]).toContain("restaurants.map(toPublicRestaurant)")
    expect(files["server/routes.ts"]).toContain("toPublicRestaurant(restaurant)")
    expect(files["server/routes.ts"]).toContain("loginUsername")
    expect(files["server/routes.ts"]).toContain("accountNumber")
    expect(files["server/routes.ts"]).toContain("stripePublishableKey")
  })

  it("does not modify other generated projects", () => {
    const files = fixture()
    expect(hardenFoodSafetyRuntime("another-project", files)).toBe(files)
  })
})
