const PEST_CONTROL_PROJECT_ID = "22c299f8-bf65-410f-9643-92a9776dbfca"
const DEFAULT_CONTRACT_NUMBER = "UN5-163-26"

function replaceRequired(source: string, needle: string, replacement: string, label: string): string {
  if (source.includes(replacement)) return source
  if (!source.includes(needle)) {
    throw new Error(`Pest Control runtime hardening failed: ${label} signature not found`)
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
  if (start < 0) throw new Error(`Pest Control runtime hardening failed: ${label} route not found`)
  const nextRoute = source.indexOf("\n  app.", start + routeMarker.length)
  const end = nextRoute < 0 ? source.length : nextRoute
  const block = source.slice(start, end)
  if (block.includes(replacement)) return source
  if (!block.includes(needle)) {
    throw new Error(`Pest Control runtime hardening failed: ${label} signature not found`)
  }
  return source.slice(0, start) + block.replace(needle, replacement) + source.slice(end)
}

function patchPestControlObjectStorage(source: string): string {
  let next = source

  // Imported Replit projects cannot use Replit's local object-storage sidecar on
  // Vercel. Keep branch logo updates durable by storing the image bytes in the
  // existing logoUrl field when PRIVATE_OBJECT_DIR is unavailable.
  if (!next.includes('category === "logos"')) {
    next = replaceRequired(
      next,
      'import { randomUUID } from "crypto";\n',
      'import { randomUUID } from "crypto";\nimport { readFile } from "fs/promises";\n',
      "logo readFile import",
    )

    const uploadNeedle = [
      '  }): Promise<string> {',
      '    const privateDir = this.getPrivateObjectDir();',
    ].join("\n")
    const uploadReplacement = [
      '  }): Promise<string> {',
      '    // 786.Chat: Replit object storage is not available in Vercel Functions.',
      '    // Persist branch logos in the existing database field so edits do not fail',
      '    // with "PRIVATE_OBJECT_DIR not set" and the new branch values are retained.',
      '    if (!process.env.PRIVATE_OBJECT_DIR && category === "logos") {',
      '      const mimeType = lookup(filename) || "application/octet-stream";',
      '      const fileBuffer = await readFile(localPath);',
      '      return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;',
      '    }',
      '',
      '    const privateDir = this.getPrivateObjectDir();',
    ].join("\n")
    next = replaceRequired(next, uploadNeedle, uploadReplacement, "Vercel logo fallback")
  }

  return next
}

function patchPestControlBranchEditor(source: string): string {
  let next = source
  next = replaceRequired(
    next,
    '      contractNumber: "",',
    `      contractNumber: "${DEFAULT_CONTRACT_NUMBER}",`,
    "new branch contract default",
  )
  next = replaceRequired(
    next,
    '      contractNumber: branch.contractNumber || "",',
    `      contractNumber: branch.contractNumber || "${DEFAULT_CONTRACT_NUMBER}",`,
    "edit branch contract fallback",
  )
  return next
}

function patchPestControlBranchRoutes(source: string): string {
  let next = source

  next = patchRouteBlock(
    next,
    "  app.post('/api/branches', isAdminAuthenticated, uploadLogoSafe, async (req, res) => {",
    '      const branchData = req.body;',
    [
      '      const branchData = req.body;',
      `      if (!String(branchData.contractNumber || "").trim()) branchData.contractNumber = "${DEFAULT_CONTRACT_NUMBER}";`,
    ].join("\n"),
    "create branch contract default",
  )

  next = patchRouteBlock(
    next,
    "  app.patch('/api/branches/:id', isAdminAuthenticated, uploadLogoSafe, async (req, res) => {",
    '      const updateData = req.body;',
    [
      '      const updateData = req.body;',
      `      if (!String(updateData.contractNumber || "").trim()) updateData.contractNumber = "${DEFAULT_CONTRACT_NUMBER}";`,
    ].join("\n"),
    "update branch contract default",
  )

  next = patchRouteBlock(
    next,
    "  app.get('/api/branches/:id/logo', async (req, res) => {",
    "      // If logo is stored in Object Storage, redirect to Object Storage URL",
    [
      "      // 786.Chat: logos persisted as data URLs on Vercel must also be served",
      "      // by the existing branch-logo endpoint after a refresh.",
      "      if (branch.logoUrl && branch.logoUrl.startsWith('data:image/')) {",
      "        const match = branch.logoUrl.match(/^data:([^;]+);base64,(.+)$/);",
      "        if (match) {",
      "          res.setHeader('Content-Type', match[1]);",
      "          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');",
      "          res.setHeader('Pragma', 'no-cache');",
      "          res.setHeader('Expires', '0');",
      "          return res.send(Buffer.from(match[2], 'base64'));",
      "        }",
      "      }",
      "",
      "      // If logo is stored in Object Storage, redirect to Object Storage URL",
    ].join("\n"),
    "Vercel data URL logo serving",
  )

  return next
}

export function hardenPestControlRuntime(
  projectId: string,
  files: Record<string, string>,
): Record<string, string> {
  if (projectId !== PEST_CONTROL_PROJECT_ID) return files

  const runtimeFiles = { ...files }

  const objectStoragePath = "server/objectStorage.ts"
  const objectStorageSource = runtimeFiles[objectStoragePath]
  if (!objectStorageSource) {
    throw new Error("Pest Control runtime hardening failed: server/objectStorage.ts missing")
  }
  runtimeFiles[objectStoragePath] = patchPestControlObjectStorage(objectStorageSource)

  const adminDashboardPath = "client/src/pages/AdminDashboard.tsx"
  const adminDashboardSource = runtimeFiles[adminDashboardPath]
  if (!adminDashboardSource) {
    throw new Error("Pest Control runtime hardening failed: client/src/pages/AdminDashboard.tsx missing")
  }
  runtimeFiles[adminDashboardPath] = patchPestControlBranchEditor(adminDashboardSource)

  const routesPath = "server/routes.ts"
  const routesSource = runtimeFiles[routesPath]
  if (!routesSource) {
    throw new Error("Pest Control runtime hardening failed: server/routes.ts missing")
  }
  runtimeFiles[routesPath] = patchPestControlBranchRoutes(routesSource)

  return runtimeFiles
}
