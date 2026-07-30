import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("the composable design catalogue contains twenty explicit engines", async () => {
  const source = await read("lib/786-chat/design-system.ts")
  const familyCount = (source.match(/\bid: "[a-z0-9-]+"/g) || []).length

  assert.equal(familyCount, 20)
  for (const field of [
    "aliases",
    "navigation",
    "hero",
    "composition",
    "sectionOrder",
    "typography",
    "palette",
    "spacing",
    "cards",
    "buttons",
    "forms",
    "borders",
    "background",
    "motion",
    "effects3d",
    "mobile",
    "interactions",
    "footer",
  ]) {
    assert.match(source, new RegExp(`${field}:`))
  }
  for (const engine of [
    "Apple Minimal",
    "Stripe SaaS",
    "Framer Creative",
    "Vercel Monochrome",
    "Luxury VVIP",
    "Editorial Magazine",
    "Glassmorphism",
    "Cyberpunk Neon",
    "Industrial Control Room",
    "Medical Clean",
    "Education Colour",
    "Restaurant Elegant",
    "Manufacturing Operations",
    "SaaS Dashboard",
    "IoT Command Centre",
    "Fashion Runway",
    "Portfolio Gallery",
    "Real Estate Luxury",
    "Automotive Performance",
    "Banking Secure",
  ]) {
    assert.match(source, new RegExp(`name: "${engine}"`))
  }
})

test("explicit style and industry requests override seeded diversity", async () => {
  const analyser = await read("lib/786-chat/specification.ts")
  const catalogue = await read("lib/786-chat/design-system.ts")
  const route = await read("app/api/786-chat/generate/route.ts")

  assert.match(analyser, /selectDesignFamily\(seed, designDirection, `\$\{prompt\}/)
  assert.match(catalogue, /request\.includes\(alias\)/)
  assert.match(catalogue, /right\.alias\.length - left\.alias\.length/)
  assert.match(route, /payload\.projectId/)
  assert.match(route, /crypto\.randomUUID\(\)/)
  assert.match(route, /designFamilyBrief/)
  assert.match(route, /do not treat this as a fixed template/)
})

test("the generation brief requires structural—not recolour-only—variation", async () => {
  const catalogue = await read("lib/786-chat/design-system.ts")
  const route = await read("app/api/786-chat/generate/route.ts")

  for (const requirement of [
    "Required section order",
    "Colour palette",
    "Buttons",
    "Forms",
    "3D treatment",
    "Interactive sections",
  ]) {
    assert.match(catalogue, new RegExp(requirement))
  }
  assert.match(route, /COMPOSABLE DESIGN SYSTEM/)
})
