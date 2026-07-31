import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import vm from "node:vm"
import ts from "typescript"

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

  assert.match(analyser, /selectDesignFamily\([\s\S]*?seed,[\s\S]*?designDirection,[\s\S]*?`\$\{prompt\}/)
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

test("every design engine has a materially unique desktop and mobile structure", async () => {
  const source = await read("lib/786-chat/design-system.ts")
  const blocks = Array.from(source.matchAll(/family\(\{([\s\S]*?)\}\),/g), (match) => match[1])
  const structuralFields = [
    "navigation",
    "hero",
    "composition",
    "sectionOrder",
    "cards",
    "mobile",
    "interactions",
  ]
  const structures = blocks.map((block) => Object.fromEntries(
    structuralFields.map((field) => {
      const value = block.match(new RegExp(`${field}: "([^"]+)"`))?.[1]
      assert.ok(value, `${field} must be explicit`)
      return [field, value]
    }),
  ))
  assert.equal(new Set(structures.map((value) =>
    structuralFields.map((field) => value[field]).join("|")
  )).size, 20)
  assert.equal(new Set(structures.map((value) => value.mobile)).size, 20)
  for (let left = 0; left < structures.length; left += 1) {
    for (let right = left + 1; right < structures.length; right += 1) {
      const differences = structuralFields.filter((field) =>
        structures[left][field] !== structures[right][field]
      )
      assert.ok(differences.length >= 5, `families ${left} and ${right} are too similar`)
    }
  }
})

test("design history exhausts every family before reuse and balances forever", async () => {
  const source = await read("lib/786-chat/design-system.ts")
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const module = { exports: {} }
  vm.runInNewContext(javascript, { module, exports: module.exports })
  const { DESIGN_FAMILIES, selectDesignFamily, designVariantNumber } = module.exports
  const history = []
  for (let index = 0; index < DESIGN_FAMILIES.length * 2; index += 1) {
    const selected = selectDesignFamily(`project-${index}`, [], "", history)
    assert.notEqual(selected.id, history[0], "consecutive projects must not repeat a family")
    history.unshift(selected.id)
    if (index === DESIGN_FAMILIES.length - 1) {
      assert.equal(new Set(history).size, DESIGN_FAMILIES.length)
    }
  }
  const counts = new Map(DESIGN_FAMILIES.map((family) => [
    family.id,
    history.filter((id) => id === family.id).length,
  ]))
  assert.deepEqual(new Set(counts.values()), new Set([2]))
  assert.equal(designVariantNumber(history[0], history), 3)
})
