"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

type Action = "chat" | "search" | "fetch" | "tts" | "asr" | "ocr" | "document-upload" | "document-chat"
const actions: Array<{ id: Action; label: string; help: string }> = [
  { id: "chat", label: "AI Chat (Flash / Pro)", help: "Ask a normal question without creating a project." },
  { id: "search", label: "Web Search", help: "Search the current public web using DeepSeek's search API." },
  { id: "fetch", label: "Read Webpage", help: "Fetch a public HTTPS webpage and show its text." },
  { id: "tts", label: "Text to Speech", help: "Generate a WAV recording, then save it for replay without generating it again." },
  { id: "asr", label: "Speech to Text", help: "Transcribe a WAV or Ogg recording (120 seconds maximum)." },
  { id: "ocr", label: "OCR — Read Image or Document", help: "Extract text from an uploaded image, PDF, Word or PowerPoint file." },
  { id: "document-upload", label: "Parse Document for AI", help: "Send a document to DeepSeek's Files API. The provider stores the document." },
  { id: "document-chat", label: "Ask a Saved Document", help: "Ask DeepSeek Flash a question about a file uploaded with the action above." },
]

function errorOf(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: unknown }).error
    if (typeof error === "string") return error
  }
  return fallback
}

export function DeepSeekSuite() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState<Action>("chat")
  const [model, setModel] = useState("deepseek-flash")
  const [voice, setVoice] = useState("stella")
  const [purpose, setPurpose] = useState("text_recognition")
  const [message, setMessage] = useState("")
  const [url, setUrl] = useState("")
  const [fileId, setFileId] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState("")
  const [error, setError] = useState("")
  const [audioUrl, setAudioUrl] = useState("")

  useEffect(() => {
    let active = true
    fetch("/api/786-chat/deepseek-suite", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok) throw new Error(errorOf(payload, "Unable to load DeepSeek Suite."))
        if (active) setEnabled(Boolean(payload.enabled))
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to check status.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  function choose(next: Action) {
    setAction(next)
    setResult("")
    setError("")
    setConfirmed(false)
  }

  async function run() {
    if (!confirmed || busy || !enabled) return
    setBusy(true)
    setError("")
    setResult("")
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl("") }
    try {
      let response: Response
      if (action === "asr" || action === "ocr" || action === "document-upload") {
        if (!file) throw new Error("Choose an audio or document file first.")
        const upload = new FormData()
        upload.set("action", action)
        upload.set("confirm", "yes")
        upload.set("purpose", purpose)
        upload.set("file", file)
        response = await fetch("/api/786-chat/deepseek-suite", { method: "POST", body: upload })
      } else {
        response = await fetch("/api/786-chat/deepseek-suite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action, confirm: true, message, text: message, query: message,
            model, voice, url, fileId,
          }),
        })
      }

      if (action === "tts" && response.ok) {
        const blob = await response.blob()
        setAudioUrl(URL.createObjectURL(blob))
        setResult("Audio generated. Save this WAV file and replay the saved copy whenever you like. Playing an existing file does not require another TTS call.")
      } else {
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(errorOf(payload, `DeepSeek returned HTTP ${response.status}`))
        if (action === "document-upload" && typeof payload.id === "string") {
          setFileId(payload.id)
          setResult(`Document parsed and stored by DeepSeek. File ID: ${payload.id}. Select 'Ask a Saved Document' next.\n\n${JSON.stringify(payload, null, 2)}`)
        } else if ((action === "chat" || action === "document-chat") && Array.isArray(payload.choices)) {
          setResult(String(payload.choices[0]?.message?.content || JSON.stringify(payload, null, 2)))
        } else {
          setResult(JSON.stringify(payload, null, 2).slice(0, 30_000))
        }
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "DeepSeek operation failed.")
    } finally {
      setBusy(false)
      setConfirmed(false)
    }
  }

  const needsFile = action === "asr" || action === "ocr" || action === "document-upload"
  const needsText = action === "chat" || action === "search" || action === "tts" || action === "document-chat"
  const needsModel = action === "chat"
  const needsPurpose = action === "ocr" || action === "document-upload"
  const selected = actions.find((item) => item.id === action)!

  return (
    <main className="min-h-screen bg-[#050914] px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-widest text-cyan-300">786.CHAT · PREVIEW EXPERIMENT</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">DeepSeek Suite</h1>
            <p className="mt-2 text-sm text-slate-400">Owner-only tools. No project creation, code editing or automatic deployment.</p>
          </div>
          <Link href="/786.chat/projects" className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 font-bold hover:bg-white/10">← Projects</Link>
        </div>
        <div className={`mb-6 rounded-2xl border p-4 ${enabled ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-400/30 bg-amber-500/10"}`}>
          {loading ? "Checking server configuration…" : enabled
            ? "Enabled in this environment. Each confirmed request can incur a DeepSeek API charge."
            : "Safety lock ACTIVE. Paid API operations are disabled until the owner authorises activation and DEEPSEEK_SUITE_ENABLED=true is configured on the preview environment."}
        </div>
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <nav aria-label="DeepSeek functions" className="rounded-2xl border border-white/10 bg-[#11182e] p-2">
            {actions.map((item) => (
              <button key={item.id} type="button" onClick={() => choose(item.id)}
                className={`mb-1 w-full rounded-xl px-3 py-3 text-left text-sm font-semibold ${item.id === action ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-white/10"}`}>
                {item.label}
              </button>
            ))}
          </nav>
          <section className="rounded-2xl border border-white/10 bg-[#11182e] p-5">
            <h2 className="text-xl font-black">{selected.label}</h2>
            <p className="mt-2 text-sm text-slate-400">{selected.help}</p>
            {needsModel && (
              <label className="mt-5 block text-sm font-semibold">Model
                <select value={model} onChange={(event) => setModel(event.target.value)} className="mt-2 w-full rounded-lg border border-white/20 bg-slate-900 p-3">
                  <option value="deepseek-flash">DeepSeek Flash</option>
                  <option value="deepseek-v4-pro">DeepSeek V4 Pro</option>
                </select>
              </label>
            )}
            {needsText && (
              <label className="mt-5 block text-sm font-semibold">{action === "tts" ? "Script to record" : action === "search" ? "Search query" : "Your question"}
                <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={5} maxLength={action === "tts" ? 1500 : 5000}
                  placeholder="Enter text here…" className="mt-2 w-full rounded-lg border border-white/20 bg-slate-900 p-3 text-white" />
              </label>
            )}
            {action === "fetch" && (
              <label className="mt-5 block text-sm font-semibold">Public HTTPS URL
                <input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/article"
                  className="mt-2 w-full rounded-lg border border-white/20 bg-slate-900 p-3" />
              </label>
            )}
            {action === "tts" && (
              <label className="mt-4 block text-sm font-semibold">Voice
                <select value={voice} onChange={(event) => setVoice(event.target.value)} className="mt-2 w-full rounded-lg border border-white/20 bg-slate-900 p-3">
                  <option value="stella">Stella</option><option value="tide">Tide</option>
                </select>
              </label>
            )}
            {needsFile && (
              <label className="mt-5 block text-sm font-semibold">File (maximum 12 MB; audio maximum 8 MiB and 120 seconds)
                <input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)}
                  accept={action === "asr" ? ".wav,.ogg,audio/wav,audio/ogg" : ".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.gif,.bmp,.tif,.tiff"}
                  className="mt-2 block w-full rounded-lg border border-white/20 bg-slate-900 p-3 text-sm" />
              </label>
            )}
            {needsPurpose && (
              <label className="mt-4 block text-sm font-semibold">Document parsing
                <select value={purpose} onChange={(event) => setPurpose(event.target.value)} className="mt-2 w-full rounded-lg border border-white/20 bg-slate-900 p-3">
                  <option value="text_recognition">Text only</option><option value="rich_layout_recognition">Rich layout including figures</option>
                </select>
              </label>
            )}
            {action === "document-chat" && (
              <label className="mt-4 block text-sm font-semibold">DeepSeek file ID
                <input value={fileId} onChange={(event) => setFileId(event.target.value)} placeholder="file-api-…" className="mt-2 w-full rounded-lg border border-white/20 bg-slate-900 p-3" />
              </label>
            )}
            <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
              <p className="text-sm text-amber-100">DeepSeek bills token usage, searches, fetches, document pages and speech separately. Document uploads are sent to DeepSeek; do not upload private customer records without authorisation. Urdu TTS is not listed among DeepSeek's supported languages.</p>
              <label className="mt-3 flex items-start gap-3 text-sm font-semibold">
                <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" />
                <span>I approve this single potentially chargeable API request.</span>
              </label>
            </div>
            <button type="button" onClick={run} disabled={!confirmed || !enabled || busy}
              className="mt-5 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
              {busy ? "Running…" : "Run this action"}
            </button>
            {error && <p role="alert" className="mt-5 rounded-lg bg-rose-500/10 p-3 text-rose-200">{error}</p>}
            {result && <pre className="mt-5 max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-4 text-sm text-cyan-100">{result}</pre>}
            {audioUrl && <div className="mt-4 space-y-3">
              <audio controls src={audioUrl} className="w-full" />
              <a href={audioUrl} download="deepseek-voice.wav" className="inline-flex rounded-lg bg-emerald-700 px-4 py-2 font-bold">Save WAV recording</a>
            </div>}
          </section>
        </div>
        <p className="mt-6 text-sm text-slate-500">Voice recording reuse: save the generated WAV file, then play that saved file without another TTS request. Permanent server-side media storage and automated phone answering are separate developments.</p>
      </div>
    </main>
  )
}
