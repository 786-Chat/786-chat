import { describe, expect, it } from "vitest"
import { runtimeDeploymentFiles } from "@/lib/786-admin/runtime-deployment-files"

describe("runtimeDeploymentFiles imported Express compatibility", () => {
  it("adds runtime-only TypeScript compatibility and repairs known Replit fields", () => {
    const files = runtimeDeploymentFiles({
      "package.json": JSON.stringify({ dependencies: { express: "^5.0.0" } }),
      "server/index.ts": 'import express from "express"\nconst app = express();\n',
      "server/routes.ts": [
        'import { eq } from "drizzle-orm"',
        "const a = restaurant.addressLat",
        "const b = restaurant.addressLng",
        "const rows = await db.select().where(and(eq(x, y), eq(a, b)))",
        "items.map((loc) => loc.id)",
      ].join("\n"),
      "shared/schema.ts": "export const restaurantLatitude = true\nexport const restaurantLongitude = true\n",
    })

    expect(files["server/routes.ts"]).toContain("// @ts-nocheck")
    expect(files["server/routes.ts"]).toContain("restaurant.restaurantLatitude")
    expect(files["server/routes.ts"]).toContain("restaurant.restaurantLongitude")
    expect(files["server/routes.ts"]).toContain('import { and, eq } from "drizzle-orm"')
    expect(files["server/index.ts"]).toContain("export const app = express();")
    expect(files["index.ts"]).toContain('import express from "express"')
    expect(files["index.ts"]).toContain('import { app } from "./server/index"')
  })
})
