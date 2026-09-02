type ImportProgress = {
  stage: string
  detail: string
  current?: number
  total?: number
}

type ImportedProject = {
  id: string
  title: string
}

type ImportResult = {
  project: ImportedProject
  sourceFileCount: number
  assetCount: number
  skippedSecretFiles: string[]
  skippedUnsupportedFiles: string[]
}

type ZipEntry = {
  path: string
  bytes: Uint8Array
}

const TEXT_EXTENSIONS = new Set([
  "", ".cjs", ".css", ".csv", ".graphql", ".gql", ".h", ".html", ".ini", ".java", ".js", ".json",
  ".jsx", ".kt", ".less", ".mjs", ".md", ".mdx", ".php", ".plist", ".properties", ".py", ".rb",
  ".rs", ".scss", ".sh", ".sql", ".storyboard", ".swift", ".toml", ".ts", ".tsx", ".txt", ".xml",
  ".yaml", ".yml", ".pbxproj",
])

const ASSET_TYPES: Record<string, string> = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webm": "video/webm",
  ".webp": "image/webp",
}

function extension(path: string) {
  const name = path.toLowerCase().split("/").pop() || ""
  const index = name.lastIndexOf(".")
  return index >= 0 ? name.slice(index) : ""
}

function basename(path: string) {
  return path.split("/").pop() || "file"
}

function normalizePath(value: string) {
  return value.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+/g, "/")
}

function shouldIgnorePath(path: string) {
  const lower = path.toLowerCase()
  return (
    lower.startsWith("node_modules/") ||
    lower.includes("/node_modules/") ||
    lower.startsWith(".git/") ||
    lower.includes("/.git/") ||
    lower.startsWith("dist/") ||
    lower.includes("/dist/") ||
    lower.endsWith("foodsafetymenu-source.zip") ||
    lower.endsWith("foodsafetymenu-production.dump") ||
    lower.endsWith("foodsafetymenu-production.zip")
  )
}

function isSecretPath(path: string) {
  const lower = path.toLowerCase()
  const base = lower.split("/").pop() || ""
  return (
    /(^|\/)\.env($|\.)/.test(lower) ||
    [".npmrc", ".pypirc", "credentials", "credentials.json", "service-account.json"].includes(base) ||
    /(^|\/)(id_rsa|id_ed25519)(\.pub)?$/.test(lower)
  )
}

function readU16(view: DataView, offset: number) {
  return view.getUint16(offset, true)
}

function readU32(view: DataView, offset: number) {
  return view.getUint32(offset, true)
}

function copyArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer
}

async function inflateRaw(bytes: Uint8Array) {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser cannot unpack ZIP files. Please use a current Chrome, Edge or Firefox browser.")
  }
  const stream = new Blob([copyArrayBuffer(bytes)]).stream().pipeThrough(new DecompressionStream("deflate-raw" as never))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function readZip(file: File): Promise<ZipEntry[]> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const minOffset = Math.max(0, bytes.length - 65_557)
  let endOffset = -1
  for (let offset = bytes.length - 22; offset >= minOffset; offset -= 1) {
    if (readU32(view, offset) === 0x06054b50) {
      endOffset = offset
      break
    }
  }
  if (endOffset < 0) throw new Error("This ZIP could not be read. The end-of-directory record is missing.")

  const entryCount = readU16(view, endOffset + 10)
  const centralOffset = readU32(view, endOffset + 16)
  const decoder = new TextDecoder("utf-8")
  const entries: ZipEntry[] = []
  let cursor = centralOffset

  for (let index = 0; index < entryCount; index += 1) {
    if (readU32(view, cursor) !== 0x02014b50) throw new Error("This ZIP has a damaged central directory.")
    const flags = readU16(view, cursor + 8)
    const method = readU16(view, cursor + 10)
    const compressedSize = readU32(view, cursor + 20)
    const uncompressedSize = readU32(view, cursor + 24)
    const fileNameLength = readU16(view, cursor + 28)
    const extraLength = readU16(view, cursor + 30)
    const commentLength = readU16(view, cursor + 32)
    const localOffset = readU32(view, cursor + 42)
    const nameStart = cursor + 46
    const rawName = decoder.decode(bytes.slice(nameStart, nameStart + fileNameLength))
    const path = normalizePath(rawName)

    if (flags & 0x1) throw new Error(`Encrypted ZIP entries are not supported: ${path}`)
    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff) {
      throw new Error("ZIP64 archives are not supported by the browser importer.")
    }

    if (path && !path.endsWith("/")) {
      if (readU32(view, localOffset) !== 0x04034b50) throw new Error(`ZIP entry is damaged: ${path}`)
      const localNameLength = readU16(view, localOffset + 26)
      const localExtraLength = readU16(view, localOffset + 28)
      const dataStart = localOffset + 30 + localNameLength + localExtraLength
      const compressed = bytes.slice(dataStart, dataStart + compressedSize)
      let output: Uint8Array
      if (method === 0) output = compressed
      else if (method === 8) output = await inflateRaw(compressed)
      else throw new Error(`Unsupported ZIP compression method ${method} in ${path}`)
      if (uncompressedSize && output.byteLength !== uncompressedSize) {
        throw new Error(`ZIP entry size check failed: ${path}`)
      }
      entries.push({ path, bytes: output })
    }

    cursor += 46 + fileNameLength + extraLength + commentLength
  }

  return entries
}

async function api(body: Record<string, unknown>) {
  const response = await fetch("/api/786-chat/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>
  if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Project import failed.")
  return payload
}

async function uploadAsset(path: string, bytes: Uint8Array) {
  const type = ASSET_TYPES[extension(path)] || "application/octet-stream"
  const file = new File([copyArrayBuffer(bytes)], basename(path), { type })
  const formData = new FormData()
  formData.append("file", file)
  const response = await fetch("/api/upload", { method: "POST", body: formData })
  const payload = (await response.json().catch(() => ({}))) as { url?: string; error?: string; message?: string }
  if (!response.ok || !payload.url) {
    throw new Error(payload.message || payload.error || `Could not upload asset: ${path}`)
  }
  return payload.url
}

function publicAssetPath(path: string) {
  if (path.startsWith("public/")) return `/${path.slice("public/".length)}`
  if (path.startsWith("client/public/")) return `/${path.slice("client/public/".length)}`
  return null
}

function rewriteAssetReferences(content: string, assetMap: Record<string, string>) {
  let next = content
  const replacements = Object.entries(assetMap)
    .map(([path, url]) => ({ path, url, publicPath: publicAssetPath(path) }))
    .sort((a, b) => (b.publicPath?.length || b.path.length) - (a.publicPath?.length || a.path.length))

  for (const item of replacements) {
    if (item.publicPath) next = next.split(item.publicPath).join(item.url)
    next = next.split(item.path).join(item.url)
  }
  return next
}

function detectFramework(files: Record<string, string>) {
  const pkg = files["package.json"]
  if (!pkg) return "unknown"
  try {
    const json = JSON.parse(pkg) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
    const deps = { ...(json.dependencies || {}), ...(json.devDependencies || {}) }
    if (deps.next) return "nextjs"
    if (deps.vite && deps.express) return "vite-express"
    if (deps.vite) return "vite"
    if (deps.express) return "express"
  } catch {
    return "unknown"
  }
  return "node"
}

function chooseActiveFile(files: Record<string, string>) {
  for (const path of ["client/src/App.tsx", "client/src/main.tsx", "app/page.tsx", "src/App.tsx", "src/main.tsx", "package.json"]) {
    if (files[path]) return path
  }
  return Object.keys(files)[0] || "package.json"
}

function batchFiles(files: Record<string, string>) {
  const batches: Array<Record<string, string>> = []
  let batch: Record<string, string> = {}
  let bytes = 0
  for (const [path, content] of Object.entries(files)) {
    const size = new TextEncoder().encode(content).byteLength
    if (Object.keys(batch).length && (bytes + size > 1_800_000 || Object.keys(batch).length >= 45)) {
      batches.push(batch)
      batch = {}
      bytes = 0
    }
    batch[path] = content
    bytes += size
  }
  if (Object.keys(batch).length) batches.push(batch)
  return batches
}

export async function importExistingProjectZip(
  file: File,
  title: string,
  onProgress?: (progress: ImportProgress) => void,
): Promise<ImportResult> {
  onProgress?.({ stage: "read", detail: "Reading ZIP source…" })
  const entries = await readZip(file)
  const skippedSecretFiles: string[] = []
  const skippedUnsupportedFiles: string[] = []
  const textFiles: Record<string, string> = {}
  const binaryEntries: ZipEntry[] = []
  const decoder = new TextDecoder("utf-8", { fatal: false })

  for (const entry of entries) {
    if (shouldIgnorePath(entry.path)) continue
    if (isSecretPath(entry.path)) {
      skippedSecretFiles.push(entry.path)
      continue
    }
    const ext = extension(entry.path)
    if (TEXT_EXTENSIONS.has(ext)) textFiles[entry.path] = decoder.decode(entry.bytes)
    else if (ASSET_TYPES[ext]) binaryEntries.push(entry)
    else skippedUnsupportedFiles.push(entry.path)
  }

  if (!Object.keys(textFiles).length) throw new Error("No source-code files were found in this ZIP.")

  onProgress?.({ stage: "create", detail: "Creating a new separate 786.Chat project…" })
  const created = await api({
    action: "create",
    title: title.trim() || file.name.replace(/\.zip$/i, "") || "Imported Project",
    sourceName: file.name,
  })
  const project = created.project as ImportedProject | undefined
  if (!project?.id) throw new Error("786.Chat did not return the new project ID.")

  const assetMap: Record<string, string> = {}
  for (let index = 0; index < binaryEntries.length; index += 1) {
    const entry = binaryEntries[index]
    onProgress?.({
      stage: "assets",
      detail: `Uploading asset ${index + 1} of ${binaryEntries.length}: ${entry.path}`,
      current: index + 1,
      total: binaryEntries.length,
    })
    assetMap[entry.path] = await uploadAsset(entry.path, entry.bytes)
  }

  const rewrittenFiles = Object.fromEntries(
    Object.entries(textFiles).map(([path, content]) => [path, rewriteAssetReferences(content, assetMap)]),
  )
  rewrittenFiles["migration/asset-map.json"] = JSON.stringify(assetMap, null, 2)
  rewrittenFiles["migration/IMPORT_NOTES.md"] = [
    "# Existing Project Import",
    "",
    `Source archive: ${file.name}`,
    `Imported at: ${new Date().toISOString()}`,
    `Detected framework: ${detectFramework(rewrittenFiles)}`,
    "",
    "Binary web assets were copied to managed storage and source references were updated to their managed URLs.",
    "Secret files such as .env are intentionally not imported. Recreate required values in 786.Chat Secrets before deployment.",
    "This imported project must pass compatibility and security review before deployment.",
  ].join("\n")

  const batches = batchFiles(rewrittenFiles)
  for (let index = 0; index < batches.length; index += 1) {
    onProgress?.({
      stage: "source",
      detail: `Saving source batch ${index + 1} of ${batches.length}…`,
      current: index + 1,
      total: batches.length,
    })
    await api({ action: "files", projectId: project.id, files: batches[index] })
  }

  const framework = detectFramework(rewrittenFiles)
  const activeFile = chooseActiveFile(rewrittenFiles)
  onProgress?.({ stage: "finalize", detail: "Finalizing imported project…" })
  await api({
    action: "finalize",
    projectId: project.id,
    sourceName: file.name,
    sourceFileCount: Object.keys(rewrittenFiles).length,
    assetCount: Object.keys(assetMap).length,
    skippedSecretFiles,
    skippedUnsupportedFiles,
    framework,
    activeFile,
  })

  return {
    project,
    sourceFileCount: Object.keys(rewrittenFiles).length,
    assetCount: Object.keys(assetMap).length,
    skippedSecretFiles,
    skippedUnsupportedFiles,
  }
}
