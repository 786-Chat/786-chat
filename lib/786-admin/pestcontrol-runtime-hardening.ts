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
  if (uploadStart < 0) return next

  const privateDirNeedle = "    const privateDir = this.getPrivateObjectDir();"
  const privateDirIndex = next.indexOf(privateDirNeedle, uploadStart)
  if (privateDirIndex < 0) return next

  const vercelMarker = "    // 786.Chat: use Vercel Blob for persistent non-logo files on Vercel."
  const logoMarker = "    // 786.Chat: Replit object storage is not available in Vercel Functions."
  const vercelMarkerIndex = next.indexOf(vercelMarker, uploadStart)
  const logoMarkerIndex = next.indexOf(logoMarker, uploadStart)

  let replaceStart = privateDirIndex
  if (vercelMarkerIndex >= 0 && vercelMarkerIndex < privateDirIndex) {
    replaceStart = vercelMarkerIndex
  } else if (logoMarkerIndex >= 0 && logoMarkerIndex < privateDirIndex) {
    replaceStart = logoMarkerIndex
  }

  const persistentStorageBlock = [
    '    // 786.Chat: use Vercel Blob for persistent non-logo files on Vercel.',
    '    if (process.env.VERCEL && category !== "logos") {',
    '      const { put } = await import("@vercel/blob");',
    '      const fileBuffer = await readFile(localPath);',
    '      const mimeType = lookup(filename) || "application/octet-stream";',
    '      const objectId = randomUUID();',
    '      const extension = filename.split(".").pop() || "bin";',
    '      const safeBranchId = String(branchId || "admin").replace(/[^a-zA-Z0-9_-]/g, "_");',
    '      const safeCategory = String(category || "documents").replace(/[^a-zA-Z0-9_-]/g, "_");',
    '      const pathname = `pest-control/${safeBranchId}/${safeCategory}/${objectId}.${extension}`;',
    '      await put(pathname, fileBuffer, {',
    '        access: "private",',
    '        contentType: mimeType,',
    '        addRandomSuffix: false,',
    '      });',
    '      return `/objects/vercel/${encodeURIComponent(pathname)}`;',
    '    }',
    '',
    '    // 786.Chat: Replit object storage is not available in Vercel Functions.',
    '    // Persist branch logos in the existing database field so edits survive deploys.',
    '    if (!process.env.PRIVATE_OBJECT_DIR && category === "logos") {',
    '      const mimeType = lookup(filename) || "application/octet-stream";',
    '      const fileBuffer = await readFile(localPath);',
    '      return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;',
    '    }',
    '',
  ].join("\n")

  next = next.slice(0, replaceStart) + persistentStorageBlock + next.slice(privateDirIndex)
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
        "      const branchData: any = req.body;",
        "      const branchData: any = { ...req.body };",
        "      let branchData = req.body;",
        "      let branchData: any = req.body;",
        "      let branchData: any = { ...req.body };",
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
        "      const updateData: any = req.body;",
        "      const updateData: any = { ...req.body };",
        "      let updateData = req.body;",
        "      let updateData: any = req.body;",
        "      let updateData: any = { ...req.body };",
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

function patchBranchLoginVideoRoutes(source: string): string {
  let next = source

  if (!next.includes('import { db } from "./db.js";')) {
    next = next.replace(
      'import { z } from "zod";',
      'import { z } from "zod";\nimport { db } from "./db.js";\nimport { sql } from "drizzle-orm";',
    )
  } else if (!next.includes('import { sql } from "drizzle-orm";')) {
    next = next.replace('import { db } from "./db.js";', 'import { db } from "./db.js";\nimport { sql } from "drizzle-orm";')
  }

  if (!next.includes("const branchLoginVideoUpload = multer")) {
    const uploadMarker = "// ===== BRANCH DASHBOARD UPLOAD CONFIGURATIONS ====="
    const uploadBlock = [
      "// 786.Chat Branch Login marketing-video upload",
      "const branchLoginVideoUpload = multer({",
      "  storage: multer.memoryStorage(),",
      "  fileFilter: (req, file, cb) => {",
      "    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];",
      "    if (allowedTypes.includes(file.mimetype)) cb(null, true);",
      "    else cb(new Error('Invalid video type. Upload MP4, WebM or MOV.'));",
      "  },",
      "  limits: { fileSize: 100 * 1024 * 1024 }",
      "});",
      "",
    ].join("\n")
    if (next.includes(uploadMarker)) next = next.replace(uploadMarker, `${uploadBlock}${uploadMarker}`)
  }

  if (!next.includes('/api/public/branch-login-media')) {
    const routeMarker = "  // Admin logout endpoint"
    const routeBlock = [
      "  // Public Branch Login marketing media",
      "  app.get('/api/public/branch-login-media', async (_req, res) => {",
      "    try {",
      "      await db.execute(sql`CREATE TABLE IF NOT EXISTS branch_login_media (id integer PRIMARY KEY, video_url text, updated_at timestamptz NOT NULL DEFAULT now())`);",
      "      const result: any = await db.execute(sql`SELECT video_url FROM branch_login_media WHERE id = 1 LIMIT 1`);",
      "      const rows = Array.isArray(result) ? result : (result?.rows || []);",
      "      return res.json({ videoUrl: rows[0]?.video_url || '' });",
      "    } catch (error) {",
      "      console.error('Failed to load branch login video:', error);",
      "      return res.json({ videoUrl: '' });",
      "    }",
      "  });",
      "",
      "  // Admin-only upload for Branch Login marketing video",
      "  app.post('/api/admin/branch-login-video', branchLoginVideoUpload.single('video'), async (req, res) => {",
      "    try {",
      "      const adminToken = req.cookies?.admin_token;",
      "      if (!adminToken || !adminTokens.has(adminToken)) return res.status(401).json({ message: 'Admin authentication required' });",
      "      if (!req.file?.buffer) return res.status(400).json({ message: 'Please choose a video file' });",
      "      const safeName = String(req.file.originalname || 'branch-login.mp4').replace(/[^a-zA-Z0-9._-]/g, '_');",
      "      const { put } = await import('@vercel/blob');",
      "      const blob = await put(`pest-control/branch-login/${Date.now()}-${safeName}`, req.file.buffer, {",
      "        access: 'public',",
      "        contentType: req.file.mimetype || 'video/mp4',",
      "        addRandomSuffix: false,",
      "      });",
      "      await db.execute(sql`CREATE TABLE IF NOT EXISTS branch_login_media (id integer PRIMARY KEY, video_url text, updated_at timestamptz NOT NULL DEFAULT now())`);",
      "      await db.execute(sql`INSERT INTO branch_login_media (id, video_url, updated_at) VALUES (1, ${blob.url}, now()) ON CONFLICT (id) DO UPDATE SET video_url = EXCLUDED.video_url, updated_at = now()`);",
      "      return res.json({ success: true, videoUrl: blob.url });",
      "    } catch (error: any) {",
      "      console.error('Branch login video upload failed:', error);",
      "      return res.status(500).json({ message: error?.message || 'Video upload failed' });",
      "    }",
      "  });",
      "",
    ].join("\n")
    if (next.includes(routeMarker)) next = next.replace(routeMarker, `${routeBlock}${routeMarker}`)
  }

  return next
}

function patchPestControlBranchRoutes(source: string): string {
  let next = source
  next = patchCreateBranchContractDefault(next)
  next = patchNonBlockingBranchLogoUpdate(next)
  next = patchUpdateBranchContractDefault(next)
  next = patchBranchLogoServing(next)
  next = patchBranchLoginVideoRoutes(next)
  return next
}

function patchBranchDashboardMarketingVideo(source: string): string {
  let next = source

  next = next.replace(
    /\nconst branchDashboardVideo = [^\n]+;\n/,
    "\n",
  )

  const startMarker = "            {/* Compact branch marketing video */}"
  const endMarker = "            {/* Stats Cards */}"
  const start = next.indexOf(startMarker)
  if (start >= 0) {
    const end = next.indexOf(endMarker, start)
    if (end >= 0) {
      next = next.slice(0, start) + next.slice(end)
    }
  }

  return next
}

function patchAdminBranchLoginVideoManager(source: string): string {
  let next = source

  if (!next.includes("function BranchLoginVideoManager()")) {
    const componentMarker = "export default function AdminDashboard() {"
    const component = [
      "function BranchLoginVideoManager() {",
      "  const { toast } = useToast();",
      "  const [videoUrl, setVideoUrl] = useState('');",
      "  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);",
      "  const [uploading, setUploading] = useState(false);",
      "",
      "  useEffect(() => {",
      "    fetch('/api/public/branch-login-media', { credentials: 'include' })",
      "      .then((res) => res.json())",
      "      .then((data) => setVideoUrl(data?.videoUrl || ''))",
      "      .catch(() => setVideoUrl(''));",
      "  }, []);",
      "",
      "  const uploadVideo = async () => {",
      "    if (!selectedVideo) {",
      "      toast({ title: 'Choose a video', description: 'Select an MP4, WebM or MOV file first.', variant: 'destructive' });",
      "      return;",
      "    }",
      "    setUploading(true);",
      "    try {",
      "      const formData = new FormData();",
      "      formData.append('video', selectedVideo);",
      "      const response = await fetch('/api/admin/branch-login-video', { method: 'POST', body: formData, credentials: 'include' });",
      "      const data = await response.json();",
      "      if (!response.ok) throw new Error(data?.message || 'Upload failed');",
      "      setVideoUrl(data.videoUrl || '');",
      "      setSelectedVideo(null);",
      "      toast({ title: 'Video updated', description: 'The new video is now shown on the Branch Login page.' });",
      "    } catch (error: any) {",
      "      toast({ title: 'Upload failed', description: error?.message || 'Could not upload video', variant: 'destructive' });",
      "    } finally {",
      "      setUploading(false);",
      "    }",
      "  };",
      "",
      "  return (",
      "    <div className=\"space-y-6 max-w-3xl mx-auto\">",
      "      <div>",
      "        <h1 className=\"text-2xl lg:text-3xl font-bold text-white\">Branch Login Video</h1>",
      "        <p className=\"text-slate-400 mt-2\">Upload one marketing video. It will appear automatically on /branch-login for every branch.</p>",
      "      </div>",
      "      <Card className=\"bg-slate-900/80 border-purple-500/30\">",
      "        <CardContent className=\"p-5 space-y-5\">",
      "          {videoUrl ? (",
      "            <div className=\"max-w-sm mx-auto rounded-xl overflow-hidden border border-purple-400/30 bg-black\">",
      "              <video src={videoUrl} controls muted playsInline preload=\"metadata\" className=\"w-full aspect-video bg-black object-contain\" />",
      "            </div>",
      "          ) : (",
      "            <div className=\"max-w-sm mx-auto aspect-video rounded-xl border border-dashed border-slate-600 flex items-center justify-center text-slate-400 text-sm\">No video uploaded yet</div>",
      "          )}",
      "          <div className=\"space-y-3\">",
      "            <Input type=\"file\" accept=\"video/mp4,video/webm,video/quicktime\" onChange={(e) => setSelectedVideo(e.target.files?.[0] || null)} className=\"bg-slate-800 border-slate-600 text-white\" />",
      "            <Button onClick={uploadVideo} disabled={!selectedVideo || uploading} className=\"w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white\">",
      "              <Upload className=\"h-4 w-4 mr-2\" />",
      "              {uploading ? 'Uploading…' : 'Upload & Publish to Branch Login'}",
      "            </Button>",
      "          </div>",
      "        </CardContent>",
      "      </Card>",
      "    </div>",
      "  );",
      "}",
      "",
    ].join("\n")
    if (next.includes(componentMarker)) next = next.replace(componentMarker, `${component}${componentMarker}`)
  }

  if (!next.includes('{ id: "branch-login-video", label: "Branch Login Video", icon: Upload }')) {
    next = next.replace(
      '{ id: "site-settings", label: "Site Settings", icon: Settings }',
      '{ id: "site-settings", label: "Site Settings", icon: Settings },\n      { id: "branch-login-video", label: "Branch Login Video", icon: Upload }',
    )
  }

  if (!next.includes('activeTab === "branch-login-video"')) {
    const renderMarker = "            {/* Dashboard Section */}"
    const renderBlock = [
      '            {activeTab === "branch-login-video" && (',
      '              <BranchLoginVideoManager />',
      '            )}',
      '',
    ].join("\n")
    if (next.includes(renderMarker)) next = next.replace(renderMarker, `${renderBlock}${renderMarker}`)
  }

  return next
}

function patchBranchLoginAdminVideo(source: string): string {
  let next = source

  next = next.replace(/\nconst branchVideos = \[[\s\S]*?\] as const;\n/, "\n")

  if (!next.includes('const [branchLoginVideoUrl, setBranchLoginVideoUrl]')) {
    next = next.replace(
      '  const [soundEnabled, setSoundEnabled] = useState(true);',
      '  const [soundEnabled, setSoundEnabled] = useState(true);\n  const [branchLoginVideoUrl, setBranchLoginVideoUrl] = useState(\"\");',
    )
  }

  if (!next.includes("fetch('/api/public/branch-login-media'")) {
    const effectMarker = "  // Magic sound generator"
    const effectBlock = [
      "  // Load the admin-managed Branch Login marketing video",
      "  useEffect(() => {",
      "    fetch('/api/public/branch-login-media')",
      "      .then((res) => res.json())",
      "      .then((data) => setBranchLoginVideoUrl(data?.videoUrl || ''))",
      "      .catch(() => setBranchLoginVideoUrl(''));",
      "  }, []);",
      "",
    ].join("\n")
    if (next.includes(effectMarker)) next = next.replace(effectMarker, `${effectBlock}${effectMarker}`)
  }

  const startMarker = "        {/* Compact mouse-catch marketing video */}"
  const endMarker = "        {/* Beautiful Login Form */}"
  const start = next.indexOf(startMarker)
  if (start >= 0) {
    const end = next.indexOf(endMarker, start)
    if (end >= 0) {
      const replacement = [
        "        {/* Admin-managed Branch Login marketing video */}",
        "        {branchLoginVideoUrl && (",
        "          <div className=\"w-full max-w-xs sm:max-w-sm px-2\">",
        "            <div className=\"rounded-xl overflow-hidden border border-purple-400/30 bg-slate-950/90 shadow-xl\">",
        "              <div className=\"px-3 py-2 border-b border-white/10 bg-gradient-to-r from-purple-900/70 to-pink-900/40\">",
        "                <div className=\"text-xs font-semibold text-white\">Smart Pest Protection</div>",
        "                <div className=\"text-[10px] text-purple-300 mt-0.5\">Pest control demonstration</div>",
        "              </div>",
        "              <video src={branchLoginVideoUrl} controls muted playsInline preload=\"metadata\" className=\"w-full aspect-video bg-black object-contain\" />",
        "            </div>",
        "          </div>",
        "        )}",
        "",
      ].join("\n")
      next = next.slice(0, start) + replacement + next.slice(end)
    }
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
  if (runtimeFiles[objectStoragePath]) {
    runtimeFiles[objectStoragePath] = patchPestControlObjectStorage(runtimeFiles[objectStoragePath])
  }

  const adminDashboardPath = "client/src/pages/AdminDashboard.tsx"
  if (runtimeFiles[adminDashboardPath]) {
    let adminDashboard = patchPestControlBranchEditor(runtimeFiles[adminDashboardPath])
    adminDashboard = patchAdminBranchLoginVideoManager(adminDashboard)
    runtimeFiles[adminDashboardPath] = adminDashboard
  }

  const branchLoginPath = "client/src/pages/BranchLogin.tsx"
  if (runtimeFiles[branchLoginPath]) {
    runtimeFiles[branchLoginPath] = patchBranchLoginAdminVideo(runtimeFiles[branchLoginPath])
  }

  const branchDashboardPath = "client/src/pages/BranchDashboard.tsx"
  if (runtimeFiles[branchDashboardPath]) {
    runtimeFiles[branchDashboardPath] = patchBranchDashboardMarketingVideo(runtimeFiles[branchDashboardPath])
  }

  const routesPath = "server/routes.ts"
  if (runtimeFiles[routesPath]) {
    runtimeFiles[routesPath] = patchPestControlBranchRoutes(runtimeFiles[routesPath])
  }

  return runtimeFiles
}
