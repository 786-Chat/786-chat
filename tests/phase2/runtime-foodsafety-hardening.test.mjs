import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const helper = readFileSync("lib/786-admin/foodsafety-runtime-hardening.ts", "utf8")
const callback = readFileSync("app/api/786-admin/build-runner/callback/route.ts", "utf8")

test("FoodSafety Vercel runtime skips optional e-commerce seed", () => {
  assert.match(helper, /dd91a4bb-6bd0-4b67-9412-c452321a6452/)
  assert.match(helper, /if \(!process\.env\.VERCEL\)/)
  assert.match(helper, /await seedEcommerceData\(\);/)
})

test("FoodSafety admin menu stays scoped to the selected branch on every rebuild", () => {
  assert.match(helper, /admin branch menu isolation/)
  assert.match(helper, /getMenuItems\(selectedRestaurantMenu\)/)
  assert.match(helper, /restaurants\.map\(\(restaurant: Restaurant\) => getMenuItems\(restaurant\.id\)\)/)
  assert.match(helper, /queryKey: \[\\"\/api\/menu\\", selectedRestaurantMenu/)
  assert.match(helper, /restaurantId=\$\{encodeURIComponent\(selectedRestaurantMenu\)\}/)
  assert.match(helper, /replaceRequired\([\s\S]*adminSource,[\s\S]*legacyMenuQueries,[\s\S]*branchAwareMenuQueries,[\s\S]*admin branch menu isolation/)
})

test("FoodSafety public restaurant responses recursively redact sensitive fields", () => {
  assert.match(helper, /function redactPublicRestaurantValue/)
  assert.match(helper, /Array\.isArray\(value\)/)
  assert.match(helper, /redactPublicRestaurantValue\(nestedValue\)/)
  assert.match(helper, /restaurants\.map\(toPublicRestaurant\)/)
  assert.match(helper, /toPublicRestaurant\(restaurant\)/)
  assert.match(helper, /loginUsername/)
  assert.match(helper, /accountNumber/)
  assert.match(helper, /stripePublishableKey/)
  assert.match(helper, /token/)
})

test("FoodSafety branch edits preserve redacted payment credentials when fields are blank", () => {
  assert.match(helper, /preserveWhenBlank/)
  assert.match(helper, /stripeSecretKey/)
  assert.match(helper, /sumupApiKey/)
  assert.match(helper, /squareAccessToken/)
  assert.match(helper, /zettleApiKey/)
  assert.match(helper, /bankAccountNumber/)
  assert.match(helper, /paymentStripeSecret \|\| undefined/)
  assert.match(helper, /btAccountNumber\.trim\(\) \|\| undefined/)
})

test("FoodSafety branch addresses get a Google Maps fallback and duplicate branches do not keep stale map URLs", () => {
  assert.match(helper, /google\.com\/maps\/search\/\?api=1&query=/)
  assert.match(helper, /encodeURIComponent\(overrides\.address\)/)
  assert.match(helper, /sourceRestaurant\.googleMapsUrl/)
})

test("FoodSafety duplicate branches reset merchant and bank credentials", () => {
  assert.match(helper, /stripePublishableKey: null/)
  assert.match(helper, /stripeSecretKey: null/)
  assert.match(helper, /cardEnabled: false/)
  assert.match(helper, /bankTransferEnabled: false/)
  assert.match(helper, /sumupApiKey: null/)
  assert.match(helper, /squareAccessToken: null/)
  assert.match(helper, /zettleApiKey: null/)
  assert.match(helper, /easypaisaAccountNumber/)
})

test("FoodSafety branch domains are 786.Chat-ready while legacy Link24 hostnames remain recognised", () => {
  assert.match(helper, /Use a 786\.Chat Subdomain/)
  assert.match(helper, /\.786\.chat/)
  assert.match(helper, /isLegacyLink24Subdomain/)
  assert.match(helper, /x-forwarded-host/)
  assert.match(helper, /is786Subdomain/)
})

test("FoodSafety restaurant create responses are redacted before API logging", () => {
  assert.match(helper, /restaurant create response/)
  assert.match(helper, /res\.status\(201\)\.json\(toPublicRestaurant\(restaurant\)\)/)
})

test("FoodSafety hardening is applied to generated deployment files before publish", () => {
  assert.match(callback, /import \{ hardenFoodSafetyRuntime \}/)
  assert.match(callback, /hardenFoodSafetyRuntime\(\s*bundle\.projectId,/)
  assert.match(callback, /runtimeDeploymentFiles\(bundle\.files\)/)
})
