const PEST_CONTROL_PROJECT_ID = "22c299f8-bf65-410f-9643-92a9776dbfca"
const DEFAULT_CONTRACT_NUMBER = "UN5-163-26"

function replaceIfPresent(source: string, needle: string, replacement: string): string {
  if (source.includes(replacement)) return source
  if (!source.includes(needle)) return source
  return source.replace(needle, replacement)
}

function patchRoute(
  source: string,
  routeMarkers: string[],
  transform: (block: string) => string,
): string {
  let start = -1
  let matchedMarker = ""

  for (const marker of routeMarkers) {
    const found = source.indexOf(marker)
    if (found >= 0) {
      start = found
      matchedMarker = marker
      break
    }
  }

  if (start < 0) return source

  const nextRoute = source.indexOf("\n  app.", start + matchedMarker.length)
  const end = nextRoute < 0 ? source.length : nextRoute
  const block = source.slice(start, end)
  const patched = transform(block)

  if (patched === block) return source
  return source.slice(0, start) + patched + source.slice(end)
}

function patchPestControlObjectStorage(source: string): string {
  let next = source

  const alreadyPatched =
    next.includes("Replit object storage is not available in Vercel Functions") ||
    (next.includes("PRIVATE_OBJECT_DIR") && next.includes("category === \"logos\"")) ||
    (next.includes("PRIVATE_OBJECT_DIR") && next.includes("category === 'logos'"))

  if (alreadyPatched) return next

  if (!next.includes('from "fs/promises"') && !next.includes("from 'fs/promises'")) {
    if (next.includes('import { randomUUID } from "crypto";')) {
      next = next.replace(
        'import { randomUUID } from "crypto";',
        'import { randomUUID } from "crypto";\nimport { readFile } from "fs/promises";',
      )
    } else if (next.includes("import { randomUUID } from 'crypto';")) {
      next = next.replace(
        "import { randomUUID } from 'crypto';",
        "import { randomUUID } from 'crypto';\nimport { readFile } from 'fs/promises';",
      )
    } else {
      next = `import { readFile } from "fs/promises";\n${next}`
    }
  }

  const uploadStartCandidates = ["async uploadFile(", "uploadFile("]
  let uploadStart = -1
  for (const marker of uploadStartCandidates) {
    const found = next.indexOf(marker)
    if (found >= 0) {
      uploadStart = found
      break
    }
  }

  const privateDirNeedle = "    const privateDir = this.getPrivateObjectDir();"
  const privateDirIndex = next.indexOf(privateDirNeedle, Math.max(0, uploadStart))

  if (privateDirIndex >= 0) {
    const fallback = [
      '    // 786.Chat: Replit object storage is not available in Vercel Functions.',
      '    // Persist branch logos in the existing database field so edits survive deploys.',
      '    if (!process.env.PRIVATE_OBJECT_DIR && category === "logos") {',
      '      const mimeType = lookup(filename) || "application/octet-stream";',
      '      const fileBuffer = await readFile(localPath);',
      '      return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;',
      '    }',
      '',
    ].join("\n")

    next =
      next.slice(0, privateDirIndex) +
      fallback +
      next.slice(privateDirIndex)
  }

  return next
}

function patchPestControlBranchEditor(source: string): string {
  let next = source

  next = replaceIfPresent(
    next,
    '      contractNumber: "",',
    `      contractNumber: "${DEFAULT_CONTRACT_NUMBER}",`,
  )
  next = replaceIfPresent(
    next,
    "      contractNumber: '',",
    `      contractNumber: '${DEFAULT_CONTRACT_NUMBER}',`,
  )
  next = replaceIfPresent(
    next,
    '      contractNumber: branch.contractNumber || "",',
    `      contractNumber: branch.contractNumber || "${DEFAULT_CONTRACT_NUMBER}",`,
  )
  next = replaceIfPresent(
    next,
    "      contractNumber: branch.contractNumber || '',",
    `      contractNumber: branch.contractNumber || '${DEFAULT_CONTRACT_NUMBER}',`,
  )

  return next
}

function patchCreateBranchContractDefault(source: string): string {
  return patchRoute(
    source,
    ["app.post('/api/branches'", 'app.post("/api/branches"'],
    (block) => {
      if (block.includes("branchData.contractNumber")) return block

      const defaultLine = `      if (!String(branchData.contractNumber || "").trim()) branchData.contractNumber = "${DEFAULT_CONTRACT_NUMBER}";`
      const validationNeedle = "      const validatedData = insertBranchSchema.parse(branchData);"

      if (block.includes(validationNeedle)) {
        return block.replace(validationNeedle, `${defaultLine}\n${validationNeedle}`)
      }

      const declarationNeedles = [
        "      const branchData = req.body;",
        "      const branchData = { ...req.body };",
        "      let branchData = req.body;",
      ]

      for (const needle of declarationNeedles) {
        if (block.includes(needle)) {
          return block.replace(needle, `${needle}\n${defaultLine}`)
        }
      }

      return block
    },
  )
}

function patchUpdateBranchContractDefault(source: string): string {
  return patchRoute(
    source,
    ["app.patch('/api/branches/:id'", 'app.patch("/api/branches/:id"'],
    (block) => {
      if (block.includes("updateData.contractNumber")) return block

      const defaultLine = `      if (!String(updateData.contractNumber || "").trim()) updateData.contractNumber = "${DEFAULT_CONTRACT_NUMBER}";`
      const removeFieldsMarker = "      // Remove fields that must not go to the database"
      const deleteConfirmNeedle = "      delete updateData.confirmPassword;"
      const declarationNeedles = [
        "      const updateData = req.body;",
        "      const updateData = { ...req.body };",
        "      let updateData = req.body;",
      ]

      if (block.includes(removeFieldsMarker)) {
        return block.replace(removeFieldsMarker, `${defaultLine}\n      \n${removeFieldsMarker}`)
      }

      if (block.includes(deleteConfirmNeedle)) {
        return block.replace(deleteConfirmNeedle, `${defaultLine}\n${deleteConfirmNeedle}`)
      }

      for (const needle of declarationNeedles) {
        if (block.includes(needle)) {
          return block.replace(needle, `${needle}\n${defaultLine}`)
        }
      }

      return block
    },
  )
}

function patchNonBlockingBranchLogoUpdate(source: string): string {
  return patchRoute(
    source,
    ["app.patch('/api/branches/:id'", 'app.patch("/api/branches/:id"'],
    (block) => {
      if (block.includes("const uploadedLogo = req.file;")) return block

      const endMarkers = [
        "      // Remove fields that must not go to the database",
        "      delete updateData.confirmPassword;",
      ]

      let end = -1
      for (const marker of endMarkers) {
        const found = block.indexOf(marker)
        if (found >= 0 && (end < 0 || found < end)) end = found
      }
      if (end < 0) return block

      let start = block.indexOf("      // If logo is being updated, upload to Object Storage for permanent persistence")
      if (start < 0) {
        const logLine = block.indexOf("Branch update request:")
        start = block.indexOf("      if (req.file) {", Math.max(0, logLine))
      }
      if (start < 0 || start >= end) return block

      const resilientLogoBlock = [
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
        '            } catch {',
        "              console.log('Temporary logo cleanup skipped/failed');",
        '            }',
        '          }',
        '        }',
        '      }',
        '      ',
      ].join("\n")

      return block.slice(0, start) + resilientLogoBlock + block.slice(end)
    },
  )
}

function patchBranchLogoServing(source: string): string {
  return patchRoute(
    source,
    ["app.get('/api/branches/:id/logo'", 'app.get("/api/branches/:id/logo"'],
    (block) => {
      if (block.includes("branch.logoUrl.startsWith('data:image/')") || block.includes('branch.logoUrl.startsWith("data:image/")')) {
        return block
      }

      const marker = "      // If logo is stored in Object Storage, redirect to Object Storage URL"
      if (!block.includes(marker)) return block

      const dataUrlHandler = [
        "      // 786.Chat: serve logos persisted as data URLs on Vercel.",
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
      ].join("\n")

      return block.replace(marker, `${dataUrlHandler}${marker}`)
    },
  )
}

function patchPestControlBranchRoutes(source: string): string {
  let next = source
  next = patchCreateBranchContractDefault(next)
  next = patchUpdateBranchContractDefault(next)
  next = patchNonBlockingBranchLogoUpdate(next)
  next = patchBranchLogoServing(next)
  return next
}

export function hardenPestControlRuntime(
  projectId: string,
  files: Record<string, string>,
): Record<string, string> {
  if (projectId !== PEST_CONTROL_PROJECT_ID) return files

  const runtimeFiles = { ...files }

  const objectStoragePath = "server/objectStorage.ts"
  if (runtimeFiles[objectStoragePath]) {
    runtimeFiles[objectStoragePath] = patchPestControlObjectStorage(runtimeFiles[objectStoragePath])
  }

  const adminDashboardPath = "client/src/pages/AdminDashboard.tsx"
  if (runtimeFiles[adminDashboardPath]) {
    runtimeFiles[adminDashboardPath] = patchPestControlBranchEditor(runtimeFiles[adminDashboardPath])
  }

  const routesPath = "server/routes.ts"
  if (runtimeFiles[routesPath]) {
    runtimeFiles[routesPath] = patchPestControlBranchRoutes(runtimeFiles[routesPath])
  }

  // Runtime hardening must never make the whole generated build fail simply
  // because an imported source file changed formatting or a route was refactored.
  return runtimeFiles
}
