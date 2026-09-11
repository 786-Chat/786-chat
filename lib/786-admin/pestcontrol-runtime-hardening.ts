const PEST_CONTROL_PROJECT_ID = "22c299f8-bf65-410f-9643-92a9776dbfca"
const DEFAULT_CONTRACT_NUMBER = "UN5-163-26"

function patchPestControlObjectStorage(source: string): string {
  let next = source

  // Imported Replit projects cannot use Replit's local object-storage sidecar on
  // Vercel. Keep branch logo updates durable by storing the image bytes in the
  // existing logoUrl field when PRIVATE_OBJECT_DIR is unavailable.
  if (!next.includes('import { readFile } from "fs/promises";')) {
    next = next.replace(
      'import { randomUUID } from "crypto";\n',
      'import { randomUUID } from "crypto";\nimport { readFile } from "fs/promises";\n',
    )
  }

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

  if (!next.includes('category === "logos"') && next.includes(uploadNeedle)) {
    next = next.replace(uploadNeedle, uploadReplacement)
  }

  return next
}

function patchPestControlBranchEditor(source: string): string {
  return source
    .replace(
      '      contractNumber: "",',
      `      contractNumber: "${DEFAULT_CONTRACT_NUMBER}",`,
    )
    .replace(
      '      contractNumber: branch.contractNumber || "",',
      `      contractNumber: branch.contractNumber || "${DEFAULT_CONTRACT_NUMBER}",`,
    )
}

function patchPestControlBranchRoutes(source: string): string {
  let next = source

  next = next.replace(
    '      const branchData = req.body;\n',
    [
      '      const branchData = req.body;',
      `      if (!String(branchData.contractNumber || "").trim()) branchData.contractNumber = "${DEFAULT_CONTRACT_NUMBER}";`,
      '',
    ].join("\n"),
  )

  next = next.replace(
    '      const updateData = req.body;\n',
    [
      '      const updateData = req.body;',
      `      if (!String(updateData.contractNumber || "").trim()) updateData.contractNumber = "${DEFAULT_CONTRACT_NUMBER}";`,
      '',
    ].join("\n"),
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

  return runtimeFiles
}
