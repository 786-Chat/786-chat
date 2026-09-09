import { describe, expect, it } from "vitest"
import { runtimeDeploymentFiles } from "@/lib/786-admin/runtime-deployment-files"

describe("runtimeDeploymentFiles imported Express compatibility", () => {
  it("adds runtime-only TypeScript compatibility and repairs known Replit fields", () => {
    const files = runtimeDeploymentFiles({
      "package.json": JSON.stringify({ dependencies: { express: "^5.0.0" } }),
      "server/index.ts": [
        'import express from "express"',
        'import { registerImageRoutes } from "./replit_integrations/image.js"',
        'import { registerRoutes } from "./routes"',
        "const app = express();",
        "app.listen(5000);",
      ].join("\n"),
      "server/replit_integrations/image/index.ts": "export const registerImageRoutes = () => undefined",
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
    expect(files["server/index.ts"]).toContain('from "./replit_integrations/image/index.js"')
    expect(files["server/index.ts"]).toContain('from "./routes.js"')
    expect(files["server/index.ts"]).toContain("if (!process.env.VERCEL) app.listen(5000)")

    const bridge = files["index.ts"]
    expect(bridge).toContain('import express from "express";')
    expect(bridge).toContain('import fs from "fs";')
    expect(bridge).toContain('import runtime from "./dist/index.cjs";')
    expect(bridge).toContain('fileURLToPath(new URL("./dist/public/", import.meta.url))')
    expect(bridge).toContain('return host.endsWith(".vercel.app");')
    expect(bridge).toContain('req.path.startsWith("/api/")')
    expect(bridge).toContain("app.use(runtime.app);")
    expect(bridge).toContain("export default app;")
    expect(bridge).not.toContain("export default runtime.app")
  })
})