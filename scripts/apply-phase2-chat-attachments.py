from pathlib import Path

path = Path("app/786-admin/chat/page.tsx")
source = path.read_text()

replacements = [
    (
        "  FolderKanban,\n  Laptop,",
        "  FileText,\n  FolderKanban,\n  Laptop,",
    ),
    (
        "  Tablet,\n} from \"lucide-react\"",
        "  Tablet,\n  X,\n} from \"lucide-react\"",
    ),
    (
        'type ActiveProject = { id: string; title: string; description: string; prompt: string; files: SevenEightSixProjectFileMap; preview_state: AdminProjectPreviewState }',
        'type ActiveProject = { id: string; title: string; description: string; prompt: string; files: SevenEightSixProjectFileMap; preview_state: AdminProjectPreviewState }\n'
        'type PendingAttachment = { id: string; name: string; mediaType: string; url: string; size: number }\n\n'
        'const MAX_ATTACHMENTS = 4\n'
        'const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024\n'
        'const ALLOWED_ATTACHMENT_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"])',
    ),
    (
        "  const [publishing, setPublishing] = useState(false)\n  const [refreshKey, setRefreshKey] = useState(0)\n  const endRef = useRef<HTMLDivElement | null>(null)",
        "  const [publishing, setPublishing] = useState(false)\n  const [attachments, setAttachments] = useState<PendingAttachment[]>([])\n  const [attachmentError, setAttachmentError] = useState<string | null>(null)\n  const [refreshKey, setRefreshKey] = useState(0)\n  const endRef = useRef<HTMLDivElement | null>(null)\n  const fileInputRef = useRef<HTMLInputElement | null>(null)",
    ),
    (
        '    setMessages([]); setProject(null); setSelectedFile("app/page.tsx"); setInput(""); setPanel("preview"); setRefreshKey((v) => v + 1)',
        '    setMessages([]); setProject(null); setSelectedFile("app/page.tsx"); setInput(""); setAttachments([]); setAttachmentError(null); setPanel("preview"); setRefreshKey((v) => v + 1)',
    ),
    (
        "  async function send() {\n    const text = input.trim()\n    if (!text || sending) return\n    setMessages((old) => [...old, { id: `u-${Date.now()}`, role: \"user\", content: text }])\n    setInput(\"\"); setSending(true); setPanel(\"preview\")",
        "  function fileToDataUrl(file: File): Promise<string> {\n"
        "    return new Promise((resolve, reject) => {\n"
        "      const reader = new FileReader()\n"
        "      reader.onload = () => typeof reader.result === \"string\" ? resolve(reader.result) : reject(new Error(\"Could not read attachment.\"))\n"
        "      reader.onerror = () => reject(new Error(\"Could not read attachment.\"))\n"
        "      reader.readAsDataURL(file)\n"
        "    })\n"
        "  }\n\n"
        "  async function addAttachments(files: FileList | null) {\n"
        "    if (!files?.length) return\n"
        "    setAttachmentError(null)\n"
        "    const available = MAX_ATTACHMENTS - attachments.length\n"
        "    if (available <= 0) { setAttachmentError(`Maximum ${MAX_ATTACHMENTS} attachments.`); return }\n"
        "    const selected = Array.from(files).slice(0, available)\n"
        "    const next: PendingAttachment[] = []\n"
        "    for (const file of selected) {\n"
        "      if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) { setAttachmentError(`${file.name}: unsupported type.`); continue }\n"
        "      if (file.size > MAX_ATTACHMENT_BYTES) { setAttachmentError(`${file.name}: maximum size is 5 MB.`); continue }\n"
        "      try {\n"
        "        next.push({ id: `${Date.now()}-${Math.random()}`, name: file.name, mediaType: file.type, url: await fileToDataUrl(file), size: file.size })\n"
        "      } catch { setAttachmentError(`${file.name}: could not be read.`) }\n"
        "    }\n"
        "    if (next.length) setAttachments((current) => [...current, ...next].slice(0, MAX_ATTACHMENTS))\n"
        "    if (fileInputRef.current) fileInputRef.current.value = \"\"\n"
        "  }\n\n"
        "  async function send() {\n"
        "    const text = input.trim()\n"
        "    if ((!text && attachments.length === 0) || sending) return\n"
        "    const userText = text || \"Inspect the attached file and update this project.\"\n"
        "    const attachmentLabel = attachments.length ? `\\nAttached: ${attachments.map((item) => item.name).join(\", \")}` : \"\"\n"
        "    setMessages((old) => [...old, { id: `u-${Date.now()}`, role: \"user\", content: `${userText}${attachmentLabel}` }])\n"
        "    setInput(\"\"); setSending(true); setPanel(\"preview\")",
    ),
    (
        '      const requestBody: Record<string, unknown> = { message: text, mode }',
        '      const requestBody: Record<string, unknown> = { message: userText, mode, attachments: attachments.map(({ name, mediaType, url }) => ({ name, mediaType, url })) }',
    ),
    (
        '      const persisted = await persistAfterGeneration(generated, text, assistantText, assistantModel, assistantReason)',
        '      const persisted = await persistAfterGeneration(generated, userText, assistantText, assistantModel, assistantReason)',
    ),
    (
        '      setProject(persisted)\n      setRefreshKey((v) => v + 1)',
        '      setProject(persisted)\n      setAttachments([])\n      setAttachmentError(null)\n      setRefreshKey((v) => v + 1)',
    ),
]

for old, new in replacements:
    if old not in source:
        raise SystemExit(f"Required patch target not found: {old[:100]!r}")
    source = source.replace(old, new, 1)

old_composer = '''              <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#09051a]/95 p-4 backdrop-blur-xl"><div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3"><Paperclip className="h-5 w-5 text-slate-400" /><textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} rows={1} className="min-h-8 flex-1 resize-none bg-transparent py-1 text-xs text-white outline-none placeholder:text-slate-500" placeholder="Ask 786.Chat to build a real project..." /><button onClick={send} disabled={sending || !input.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[rgb(var(--accent))] disabled:opacity-40"><Send className="h-4 w-4" /></button></div><p className="mt-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-[11px] font-semibold text-cyan-100">{project ? `Editing ${project.title} — auto-save on` : 'New Chat is empty. Build prompt creates real files saved to Neon.'}</p></div>'''
new_composer = '''              <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#09051a]/95 p-4 backdrop-blur-xl">
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" multiple className="hidden" onChange={(event) => void addAttachments(event.target.files)} />
                {attachments.length > 0 && <div className="mb-3 flex max-h-24 flex-wrap gap-2 overflow-y-auto">
                  {attachments.map((item) => <div key={item.id} className="flex max-w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-2 py-1.5 text-[10px] text-slate-200">
                    {item.mediaType === "application/pdf" ? <FileText className="h-4 w-4 shrink-0 text-rose-300" /> : <img src={item.url} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />}
                    <span className="max-w-36 truncate">{item.name}</span>
                    <button type="button" onClick={() => setAttachments((current) => current.filter((attachment) => attachment.id !== item.id))} className="rounded-full p-1 hover:bg-white/10" aria-label={`Remove ${item.name}`}><X className="h-3 w-3" /></button>
                  </div>)}
                </div>}
                {attachmentError && <p className="mb-2 text-[11px] font-semibold text-rose-300">{attachmentError}</p>}
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={sending || attachments.length >= MAX_ATTACHMENTS} className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-40" title="Attach image or PDF"><Paperclip className="h-5 w-5" /></button>
                  <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() } }} rows={1} className="min-h-8 flex-1 resize-none bg-transparent py-1 text-xs text-white outline-none placeholder:text-slate-500" placeholder="Ask 786.Chat to build from text, screenshots, or PDFs..." />
                  <button onClick={() => void send()} disabled={sending || (!input.trim() && attachments.length === 0)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[rgb(var(--accent))] disabled:opacity-40"><Send className="h-4 w-4" /></button>
                </div>
                <p className="mt-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-[11px] font-semibold text-cyan-100">{attachments.length ? `${attachments.length} attachment${attachments.length === 1 ? '' : 's'} — Gemini multimodal` : project ? `Editing ${project.title} — auto-save on` : 'Text uses DeepSeek. Attachments use Gemini. Projects save to Neon.'}</p>
              </div>'''
if old_composer not in source:
    raise SystemExit("Composer patch target not found")
source = source.replace(old_composer, new_composer, 1)
path.write_text(source)
