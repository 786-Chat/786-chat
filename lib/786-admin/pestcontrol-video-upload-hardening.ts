const PEST_CONTROL_PROJECT_ID = "22c299f8-bf65-410f-9643-92a9776dbfca"

function patchBranchLoginVideoRoutes(source: string): string {
  const startMarker = "  // Admin-only upload for Branch Login marketing video"
  const endMarker = "  // Admin logout endpoint"
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker, Math.max(0, start))
  if (start < 0 || end < 0) return source

  const replacement = [
    "  // Admin-authorized client upload token route for Branch Login marketing video.",
    "  // The video bytes go directly from the browser to Vercel Blob, avoiding the Vercel Function payload limit.",
    "  app.post('/api/admin/branch-login-video', async (req, res) => {",
    "    try {",
    "      const body: any = req.body || {};",
    "      if (body?.type === 'blob.generate-client-token') {",
    "        const adminToken = req.cookies?.admin_token;",
    "        if (!adminToken || !adminTokens.has(adminToken)) {",
    "          return res.status(401).json({ message: 'Admin authentication required' });",
    "        }",
    "      }",
    "",
    "      const { handleUpload } = await import('@vercel/blob/client');",
    "      const jsonResponse = await handleUpload({",
    "        body,",
    "        request: req,",
    "        onBeforeGenerateToken: async (pathname) => {",
    "          if (!String(pathname || '').startsWith('pest-control/branch-login/')) {",
    "            throw new Error('Invalid Branch Login video path');",
    "          }",
    "          return {",
    "            allowedContentTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'],",
    "            maximumSizeInBytes: 250 * 1024 * 1024,",
    "            addRandomSuffix: true,",
    "          };",
    "        },",
    "        onUploadCompleted: async ({ blob }) => {",
    "          console.log('Branch Login video Blob upload completed:', blob.url);",
    "        },",
    "      });",
    "      return res.json(jsonResponse);",
    "    } catch (error: any) {",
    "      console.error('Branch Login video client upload failed:', error);",
    "      return res.status(400).json({ message: error?.message || 'Video upload authorization failed' });",
    "    }",
    "  });",
    "",
    "  // Persist the small Blob URL after the browser has uploaded the large file directly to Blob.",
    "  app.post('/api/admin/branch-login-video/save', async (req, res) => {",
    "    try {",
    "      const adminToken = req.cookies?.admin_token;",
    "      if (!adminToken || !adminTokens.has(adminToken)) {",
    "        return res.status(401).json({ message: 'Admin authentication required' });",
    "      }",
    "      const videoUrl = String(req.body?.videoUrl || '').trim();",
    "      if (!videoUrl) return res.status(400).json({ message: 'Video URL is required' });",
    "      let parsedUrl: URL;",
    "      try {",
    "        parsedUrl = new URL(videoUrl);",
    "      } catch {",
    "        return res.status(400).json({ message: 'Invalid video URL' });",
    "      }",
    "      if (parsedUrl.protocol !== 'https:' || !parsedUrl.hostname.endsWith('.blob.vercel-storage.com')) {",
    "        return res.status(400).json({ message: 'Only Vercel Blob video URLs are allowed' });",
    "      }",
    "      await db.execute(sql`CREATE TABLE IF NOT EXISTS branch_login_media (id integer PRIMARY KEY, video_url text, updated_at timestamptz NOT NULL DEFAULT now())`);",
    "      await db.execute(sql`INSERT INTO branch_login_media (id, video_url, updated_at) VALUES (1, ${videoUrl}, now()) ON CONFLICT (id) DO UPDATE SET video_url = EXCLUDED.video_url, updated_at = now()`);",
    "      return res.json({ success: true, videoUrl });",
    "    } catch (error: any) {",
    "      console.error('Branch Login video URL save failed:', error);",
    "      return res.status(500).json({ message: error?.message || 'Could not save Branch Login video' });",
    "    }",
    "  });",
    "",
  ].join("\n")

  return source.slice(0, start) + replacement + source.slice(end)
}

function patchAdminVideoManager(source: string): string {
  const startMarker = "function BranchLoginVideoManager() {"
  const endMarker = "export default function AdminDashboard() {"
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker, Math.max(0, start))
  if (start < 0 || end < 0) return source

  const replacement = [
    "function BranchLoginVideoManager() {",
    "  const { toast } = useToast();",
    "  const [videoUrl, setVideoUrl] = useState('');",
    "  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);",
    "  const [uploading, setUploading] = useState(false);",
    "  const [uploadProgress, setUploadProgress] = useState(0);",
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
    "    setUploadProgress(0);",
    "    try {",
    "      const { upload } = await import('@vercel/blob/client');",
    "      const safeName = selectedVideo.name.replace(/[^a-zA-Z0-9._-]/g, '_');",
    "      const blob = await upload(`pest-control/branch-login/${Date.now()}-${safeName}`, selectedVideo, {",
    "        access: 'public',",
    "        handleUploadUrl: '/api/admin/branch-login-video',",
    "        multipart: true,",
    "        onUploadProgress: ({ percentage }) => setUploadProgress(Math.round(percentage)),",
    "      });",
    "",
    "      const saveResponse = await fetch('/api/admin/branch-login-video/save', {",
    "        method: 'POST',",
    "        credentials: 'include',",
    "        headers: { 'Content-Type': 'application/json' },",
    "        body: JSON.stringify({ videoUrl: blob.url }),",
    "      });",
    "      const saveText = await saveResponse.text();",
    "      let saveData: any = {};",
    "      try { saveData = saveText ? JSON.parse(saveText) : {}; } catch { saveData = {}; }",
    "      if (!saveResponse.ok) throw new Error(saveData?.message || saveText || 'Could not publish video');",
    "",
    "      setVideoUrl(blob.url);",
    "      setSelectedVideo(null);",
    "      setUploadProgress(100);",
    "      toast({ title: 'Video updated', description: 'The video is now published on the Branch Login page.' });",
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
    "        <p className=\"text-slate-400 mt-2\">Upload one marketing video for the Branch Login page.</p>",
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
    "            <Input type=\"file\" accept=\"video/mp4,video/webm,video/quicktime,video/x-m4v\" onChange={(e) => setSelectedVideo(e.target.files?.[0] || null)} className=\"bg-slate-800 border-slate-600 text-white\" />",
    "            {uploading && (",
    "              <div className=\"space-y-1\">",
    "                <div className=\"h-2 rounded-full bg-slate-700 overflow-hidden\"><div className=\"h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all\" style={{ width: `${uploadProgress}%` }} /></div>",
    "                <div className=\"text-xs text-slate-400 text-right\">{uploadProgress}%</div>",
    "              </div>",
    "            )}",
    "            <Button onClick={uploadVideo} disabled={!selectedVideo || uploading} className=\"w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white\">",
    "              <Upload className=\"h-4 w-4 mr-2\" />",
    "              {uploading ? `Uploading ${uploadProgress}%` : 'Upload & Publish to Branch Login'}",
    "            </Button>",
    "          </div>",
    "        </CardContent>",
    "      </Card>",
    "    </div>",
    "  );",
    "}",
    "",
  ].join("\n")

  return source.slice(0, start) + replacement + source.slice(end)
}

export function hardenPestControlVideoUpload(
  projectId: string,
  files: Record<string, string>,
): Record<string, string> {
  if (projectId !== PEST_CONTROL_PROJECT_ID) return files

  const next = { ...files }
  const routesPath = "server/routes.ts"
  const adminPath = "client/src/pages/AdminDashboard.tsx"

  if (next[routesPath]) next[routesPath] = patchBranchLoginVideoRoutes(next[routesPath])
  if (next[adminPath]) next[adminPath] = patchAdminVideoManager(next[adminPath])

  return next
}
