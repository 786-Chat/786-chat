const PEST_CONTROL_PROJECT_ID = "22c299f8-bf65-410f-9643-92a9776dbfca"
const DEFAULT_CONTRACT_NUMBER = "UN5-163-26"

function replaceRequired(source: string, needle: string, replacement: string, label: string): string {
  if (source.includes(replacement)) return source
  if (!source.includes(needle)) {
    throw new Error(`Pest Control runtime hardening failed: ${label} signature not found`)
  }
  return source.replace(needle, replacement)
}

function replaceOptional(source: string, needle: string, replacement: string): string {
  if (source.includes(replacement)) return source
  return source.includes(needle) ? source.replace(needle, replacement) : source
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

function patchContractDefault(
  source: string,
  routeMarkers: string[],
  variableName: "branchData" | "updateData",
): string {
  const routeMarker = routeMarkers.find((marker) => source.includes(marker))
  if (!routeMarker) return source

  const start = source.indexOf(routeMarker)
  const nextRoute = source.indexOf("\n  app.", start + routeMarker.length)
  const end = nextRoute < 0 ? source.length : nextRoute
  const block = source.slice(start, end)

  if (block.includes(DEFAULT_CONTRACT_NUMBER) && block.includes("contractNumber")) return source

  const candidates = [
    `      const ${variableName} = req.body;`,
    `      let ${variableName} = req.body;`,
    `      const ${variableName} = { ...req.body };`,
    `      let ${variableName} = { ...req.body };`,
  ]

  const needle = candidates.find((candidate) => block.includes(candidate))
  if (!needle) return source

  const replacement = [
    needle,
    `      if (!String(${variableName}.contractNumber || "").trim()) ${variableName}.contractNumber = "${DEFAULT_CONTRACT_NUMBER}";`,
  ].join("\n")

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
  next = replaceOptional(
    next,
    '      contractNumber: "",',
    `      contractNumber: "${DEFAULT_CONTRACT_NUMBER}",`,
  )
  next = replaceOptional(
    next,
    '      contractNumber: branch.contractNumber || "",',
    `      contractNumber: branch.contractNumber || "${DEFAULT_CONTRACT_NUMBER}",`,
  )
  return next
}

function patchPestControlBranchRoutes(source: string): string {
  let next = source

  next = patchContractDefault(
    next,
    [
      "  app.post('/api/branches', isAdminAuthenticated, uploadLogoSafe, async (req, res) => {",
      '  app.post("/api/branches", isAdminAuthenticated, uploadLogoSafe, async (req, res) => {',
    ],
    "branchData",
  )

  next = patchContractDefault(
    next,
    [
      "  app.patch('/api/branches/:id', isAdminAuthenticated, uploadLogoSafe, async (req, res) => {",
      '  app.patch("/api/branches/:id", isAdminAuthenticated, uploadLogoSafe, async (req, res) => {',
    ],
    "updateData",
  )

  const originalUpdateLogoBlock = [
    '      // If logo is being updated, upload to Object Storage for permanent persistence',
    '      if (req.file) {',
    '        // Upload to Object Storage for permanent persistence',
    '        const objectStorageService = new ObjectStorageService();',
    '        const logoUrl = await objectStorageService.uploadFile({',
    '          localPath: req.file.path,',
    '          branchId,',
    "          category: 'logos',",
    '          filename: req.file.originalname',
    '        });',
    '        ',
    '        updateData.logoUrl = logoUrl;',
    '        console.log(`✅ Logo uploaded to Object Storage for branch ${branchId}: ${logoUrl}`);',
    '        ',
    '        // Clean up temporary file after successful upload',
    '        try {',
    '          fs.unlinkSync(req.file.path);',
    '          console.log(`✓ Temporary file cleaned up: ${req.file.path}`);',
    '        } catch (e) {',
    "          console.log('Temp file cleanup failed, but logo is safely in Object Storage');",
    '        }',
    '      }',
  ].join("\n")

  const resilientUpdateLogoBlock = [
    '      // Keep ordinary branch edits saveable even if logo persistence fails.',
    '      // The existing logo is retained when a logo-specific error occurs.',
    '      const uploadedLogo = req.file;',
    '      if (uploadedLogo) {',
    '        try {',
    '          const objectStorageService = new ObjectStorageService();',
    '          const logoUrl = await objectStorageService.uploadFile({',
    '            localPath: uploadedLogo.path,',
    '            branchId,',
    "            category: 'logos',",
    '            filename: uploadedLogo.originalname',
    '          });',
    '',
    '          updateData.logoUrl = logoUrl;',
    '          console.log(`✅ Logo uploaded for branch ${branchId}: ${logoUrl}`);',
    '        } catch (logoError) {',
    '          console.warn(`⚠️ Branch logo update failed for ${branchId}; saving other branch changes with the existing logo:`, logoError);',
    '        } finally {',
    '          if (uploadedLogo.path) {',
    '            try {',
    '              fs.unlinkSync(uploadedLogo.path);',
    '            } catch (cleanupError) {',
    "              console.log('Temporary logo cleanup skipped/failed');",
    '            }',
    '          }',
    '        }',
    '      }',
  ].join("\n")

  if (!next.includes('const uploadedLogo = req.file;')) {
    next = patchRouteBlock(
      next,
      "  app.patch('/api/branches/:id', isAdminAuthenticated, uploadLogoSafe, async (req, res) => {",
      originalUpdateLogoBlock,
      resilientUpdateLogoBlock,
      "non-blocking update branch logo persistence",
    )
  }

  if (!next.includes("branch.logoUrl.startsWith('data:image/')")) {
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
  }

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
