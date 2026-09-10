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

function patchFoodSafetyBranchAdmin(source: string) {
  let next = source

  // Never erase an existing branch credential just because the public branch list
  // intentionally redacts it. Empty credential inputs mean "keep the saved value".
  const preserveWhenBlank = [
    "stripeAccountId",
    "stripePublishableKey",
    "stripeSecretKey",
    "bankName",
    "bankAccountName",
    "bankSortCode",
    "bankAccountNumber",
    "bankIban",
    "bankTransferVideoUrl",
    "easypaisaAccountNumber",
    "easypaisaAccountName",
    "jazzcashAccountNumber",
    "jazzcashAccountName",
    "hblAccountNumber",
    "hblAccountName",
    "hblIban",
    "ublAccountNumber",
    "ublAccountName",
    "ublIban",
    "sumupApiKey",
    "sumupMerchantCode",
    "squareAccessToken",
    "squareLocationId",
    "zettleApiKey",
    "zettleMerchantId",
  ]
  for (const field of preserveWhenBlank) {
    next = next.replaceAll(
      `(formData.get("${field}") as string)?.trim() || null`,
      `(formData.get("${field}") as string)?.trim() || undefined`,
    )
  }
  next = next
    .replaceAll(
      'bankTransferEnabled: !!(formData.get("bankAccountName") as string)?.trim(),',
      'bankTransferEnabled: (formData.get("bankAccountName") as string)?.trim() ? true : undefined,',
    )
    .replace(
      "bankTransferEnabled: !!btAccountName.trim(),",
      "bankTransferEnabled: btAccountName.trim() ? true : undefined,",
    )
    .replace("bankName: btBankName.trim() || null,", "bankName: btBankName.trim() || undefined,")
    .replace("bankAccountName: btAccountName.trim() || null,", "bankAccountName: btAccountName.trim() || undefined,")
    .replace("bankSortCode: btSortCode.trim() || null,", "bankSortCode: btSortCode.trim() || undefined,")
    .replace("bankAccountNumber: btAccountNumber.trim() || null,", "bankAccountNumber: btAccountNumber.trim() || undefined,")
    .replace("bankIban: btIban.trim() || null,", "bankIban: btIban.trim() || undefined,")
    .replace("bankTransferVideoUrl: btVideoUrl.trim() || null,", "bankTransferVideoUrl: btVideoUrl.trim() || undefined,")
    .replace("stripePublishableKey: paymentStripePublishable || null,", "stripePublishableKey: paymentStripePublishable || undefined,")
    .replace("stripeSecretKey: paymentStripeSecret || null,", "stripeSecretKey: paymentStripeSecret || undefined,")
    .replace("stripeAccountId: paymentStripeAccountId || null,", "stripeAccountId: paymentStripeAccountId || undefined,")

  // Generate a usable Google Maps search URL from the branch address whenever the
  // optional manual URL is blank. This works for both Create and Edit Branch.
  next = next.replace(
    'googleMapsUrl: formData.get("googleMapsUrl") as string || "",',
    'googleMapsUrl: (formData.get("googleMapsUrl") as string)?.trim() || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(((formData.get("address") as string) || "").trim())}`,',
  )
  next = next.replace(
    'googleMapsUrl: formData.get("googleMapsUrl") as string,',
    'googleMapsUrl: (formData.get("googleMapsUrl") as string)?.trim() || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(((formData.get("address") as string) || "").trim())}`,',
  )

  // Use the selected create status when the form supplies one, while keeping the
  // original safe closed default for older saved source that has no selector yet.
  next = next.replace(
    'status: "closed",\n      rating: "5.0",',
    'status: ((formData.get("status") as "open" | "closed") || "closed"),\n      rating: "5.0",',
  )

  // Replace stale Replit/link24 address guidance with 786.Chat-ready values.
  next = next
    .replaceAll("yourapp.replit.app/menu/branch-name", "Current deployment /menu/branch-name")
    .replaceAll("yourapp.replit.app/menu/{editingRestaurant.slug}", "Current deployment /menu/{editingRestaurant.slug}")
    .replaceAll("Use Your link24.online Subdomain", "Use a 786.Chat Subdomain")
    .replaceAll("Give them a professional subdomain - no setup needed by customer!", "Use a professional 786.Chat address. It becomes active after this project is published through 786.Chat.")
    .replace('return `${newBranchSubdomain.trim()}.link24.online`;', 'return `${newBranchSubdomain.trim()}.786.chat`;')
    .replace('return `${editSubdomain.trim()}.link24.online`;', 'return `${editSubdomain.trim()}.786.chat`;')
    .replaceAll('<span className="text-muted-foreground font-mono text-sm">.link24.online</span>', '<span className="text-muted-foreground font-mono text-sm">.786.chat</span>')
    .replace('Menu URL: <span className="font-mono">link24.online/{duplicateName.toLowerCase().replace(/\\s+/g, "-").replace(/[^a-z0-9-]/g, "")}</span>', 'Menu URL: <span className="font-mono">Current deployment /menu/{duplicateName.toLowerCase().replace(/\\s+/g, "-").replace(/[^a-z0-9-]/g, "")}</span>')

  // Continue recognising legacy link24 hostnames while making 786.Chat the new
  // subdomain choice for edited branches.
  const legacyDomainInit = [
    "                    const customDomain = (restaurant as any).customDomain || \"\";",
    "                    if (customDomain.endsWith('.link24.online')) {",
    "                      setEditDomainOption(\"link24\");",
    "                      setEditSubdomain(customDomain.replace('.link24.online', ''));",
    "                      setEditCustomDomain(\"\");",
    "                    } else if (customDomain) {",
  ].join("\n")
  const hardenedDomainInit = [
    "                    const customDomain = (restaurant as any).customDomain || \"\";",
    "                    const is786Subdomain = customDomain.endsWith('.786.chat');",
    "                    const isLegacyLink24Subdomain = customDomain.endsWith('.link24.online');",
    "                    if (is786Subdomain || isLegacyLink24Subdomain) {",
    "                      setEditDomainOption(\"link24\");",
    "                      setEditSubdomain(customDomain.replace(/\\.(?:786\\.chat|link24\\.online)$/, ''));",
    "                      setEditCustomDomain(\"\");",
    "                    } else if (customDomain) {",
  ].join("\n")
  next = replaceRequired(next, legacyDomainInit, hardenedDomainInit, "admin 786.Chat domain initialization")

  // Explain the redacted credential behavior so a super admin knows that a blank
  // secret field is preserved rather than missing or broken.
  next = next.replaceAll(
    "Enter API keys from your customer's Stripe dashboard.",
    "Enter new Stripe credentials only when changing them. Blank fields keep the branch's saved credentials.",
  )

  return next
}

function patchFoodSafetyDomainRuntime(source: string) {
  let next = source

  // 786.Chat's customer-host proxy intentionally forwards the original hostname in
  // x-forwarded-host. Prefer it so branch.786.chat and customer-owned domains select
  // the correct FoodSafety branch behind the generated Vercel runtime.
  next = next.replace(
    "      const hostname = (req.hostname || (req.headers.host || '').replace(/:\\d+$/, '')).toLowerCase().replace(/\\.$/, '');",
    "      const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();\n      const hostname = (forwardedHost || req.hostname || (req.headers.host || '').replace(/:\\d+$/, '')).toLowerCase().replace(/\\.$/, '');",
  )

  next = next.replace(
    "      const isSubdomain = cleanHost.endsWith('.link24.online') && \n        cleanHost !== 'link24.online' && \n        cleanHost !== 'www.link24.online';",
    "      const is786Subdomain = cleanHost.endsWith('.786.chat') && cleanHost !== '786.chat' && cleanHost !== 'www.786.chat';\n      const isLegacyLink24Subdomain = cleanHost.endsWith('.link24.online') && cleanHost !== 'link24.online' && cleanHost !== 'www.link24.online';\n      const isSubdomain = is786Subdomain || isLegacyLink24Subdomain;",
  )

  next = next.replace(
    "        cleanHost !== 'link24.online' &&\n        cleanHost !== 'www.link24.online' &&",
    "        cleanHost !== '786.chat' &&\n        cleanHost !== 'www.786.chat' &&\n        cleanHost !== 'link24.online' &&\n        cleanHost !== 'www.link24.online' &&",
  )

  return next
}

function patchFoodSafetyClientDomainRuntime(source: string) {
  let next = source
  next = next.replace(
    "    const isSubdomain = hostname.endsWith('.link24.online') && \n      hostname !== 'link24.online' && \n      hostname !== 'www.link24.online';",
    "    const is786Subdomain = hostname.endsWith('.786.chat') && hostname !== '786.chat' && hostname !== 'www.786.chat';\n    const isLegacyLink24Subdomain = hostname.endsWith('.link24.online') && hostname !== 'link24.online' && hostname !== 'www.link24.online';\n    const isSubdomain = is786Subdomain || isLegacyLink24Subdomain;",
  )
  next = next.replace(
    "      hostname !== 'link24.online' &&\n      hostname !== 'www.link24.online' &&",
    "      hostname !== '786.chat' &&\n      hostname !== 'www.786.chat' &&\n      hostname !== 'link24.online' &&\n      hostname !== 'www.link24.online' &&",
  )
  return next
}

function patchFoodSafetyDuplicateBranch(source: string) {
  let next = source

  // A duplicated physical branch must never inherit merchant credentials from the
  // source branch. Keep copied menus/branding while resetting payment destinations.
  next = next.replace(
    "      googleMapsUrl: sourceRestaurant.googleMapsUrl,",
    "      googleMapsUrl: overrides.address\n        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(overrides.address)}`\n        : (sourceRestaurant.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sourceRestaurant.address)}`),",
  )
  next = next.replace(
    "      stripeAccountId: overrides.stripeAccountId || null,",
    [
      "      stripeAccountId: overrides.stripeAccountId || null,",
      "      stripePublishableKey: null,",
      "      stripeSecretKey: null,",
      "      cardEnabled: false,",
      "      bankTransferEnabled: false,",
      "      bankName: null,",
      "      bankAccountName: null,",
      "      bankSortCode: null,",
      "      bankAccountNumber: null,",
      "      bankIban: null,",
      "      bankTransferVideoUrl: null,",
      "      sumupApiKey: null,",
      "      sumupMerchantCode: null,",
      "      squareAccessToken: null,",
      "      squareLocationId: null,",
      "      zettleApiKey: null,",
      "      zettleMerchantId: null,",
    ].join("\n"),
  )

  for (const field of [
    "easypaisaAccountNumber",
    "easypaisaAccountName",
    "jazzcashAccountNumber",
    "jazzcashAccountName",
    "hblAccountNumber",
    "hblAccountName",
    "hblIban",
    "ublAccountNumber",
    "ublAccountName",
    "ublIban",
  ]) {
    next = next.replace(`      ${field}: sourceRestaurant.${field},`, `      ${field}: null,`)
  }

  return next
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

  runtimeFiles[serverPath] = patchFoodSafetyDomainRuntime(replaceRequired(
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
  ))

  const appPath = "client/src/App.tsx"
  if (runtimeFiles[appPath]) {
    runtimeFiles[appPath] = patchFoodSafetyClientDomainRuntime(runtimeFiles[appPath])
  }

  const adminPath = "client/src/pages/admin.tsx"
  const adminSource = runtimeFiles[adminPath]
  if (!adminSource) {
    throw new Error("FoodSafety runtime hardening failed: client/src/pages/admin.tsx missing")
  }

  const legacyMenuQueries = [
    "  const { data: menuItems = [], isLoading: loadingMenu } = useQuery({",
    "    queryKey: [\"/api/menu\"],",
    "    queryFn: () => getMenuItems(),",
    "  });",
    "",
    "  const { data: dbCategories = [] } = useQuery({",
    "    queryKey: [\"/api/menu-categories\"],",
    "    queryFn: async () => {",
    "      const response = await fetch(\"/api/menu-categories\");",
    "      return response.json();",
    "    },",
    "  });",
  ].join("\n")

  const branchAwareMenuQueries = [
    "  const { data: menuItems = [], isLoading: loadingMenu } = useQuery({",
    "    queryKey: [\"/api/menu\", selectedRestaurantMenu, restaurants.map((restaurant: Restaurant) => restaurant.id).join(\",\")],",
    "    queryFn: async () => {",
    "      if (selectedRestaurantMenu !== \"all\") {",
    "        return getMenuItems(selectedRestaurantMenu);",
    "      }",
    "      const branchMenus = await Promise.all(",
    "        restaurants.map((restaurant: Restaurant) => getMenuItems(restaurant.id))",
    "      );",
    "      return branchMenus.flat();",
    "    },",
    "    enabled: selectedRestaurantMenu !== \"all\" || restaurants.length > 0,",
    "  });",
    "",
    "  const { data: dbCategories = [] } = useQuery({",
    "    queryKey: [\"/api/menu-categories\", selectedRestaurantMenu],",
    "    queryFn: async () => {",
    "      const query = selectedRestaurantMenu === \"all\"",
    "        ? \"\"",
    "        : `?restaurantId=${encodeURIComponent(selectedRestaurantMenu)}`;",
    "      const response = await fetch(`/api/menu-categories${query}`);",
    "      return response.json();",
    "    },",
    "  });",
  ].join("\n")

  const menuHardenedAdmin = replaceRequired(
    adminSource,
    legacyMenuQueries,
    branchAwareMenuQueries,
    "admin branch menu isolation",
  )
  runtimeFiles[adminPath] = patchFoodSafetyBranchAdmin(menuHardenedAdmin)

  const storagePath = "server/storage.ts"
  if (runtimeFiles[storagePath]) {
    runtimeFiles[storagePath] = patchFoodSafetyDuplicateBranch(runtimeFiles[storagePath])
  }

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

  // Mutation responses are also redacted so payment credentials never appear in
  // browser JSON payloads or the imported Express API response logger.
  routes = patchRouteBlock(
    routes,
    'app.post("/api/restaurants", async (req, res) => {',
    "      res.status(201).json(restaurant);",
    "      res.status(201).json(toPublicRestaurant(restaurant));",
    "restaurant create response",
  )

  runtimeFiles[routesPath] = routes
  return runtimeFiles
}
