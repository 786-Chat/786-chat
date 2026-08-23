"use client"

import {
  Box,
  Check,
  Copy,
  Frame,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  Monitor,
  Palette,
  Redo2,
  RotateCw,
  Search,
  Shapes,
  Sparkles,
  Trash2,
  Type,
  Undo2,
  Upload,
  Video,
  X,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  loadBuilderBuild,
  loadBuilderProject,
  queueBuilderBuild,
  saveVisualEditorState,
} from "@/components/786-chat/api"
import type {
  BuilderBuild,
  BuilderProject,
} from "@/components/786-chat/contracts"
import {
  STUDIO_BACKGROUND_PRESETS,
  STUDIO_ELEMENT_CATEGORIES,
  STUDIO_ELEMENT_PRESETS,
  STUDIO_FONTS,
  STUDIO_SIZE_PRESETS,
  STUDIO_TEXT_PRESETS,
  formatStudioSize,
  sizeToPixels,
  type StudioSizePreset,
  type StudioUnit,
} from "@/lib/786-chat/design-studio"
import {
  VISUAL_EDITOR_BRIDGE_VERSION,
  normalizeVisualEditorState,
  type VisualEditorElement,
  type VisualEditorElementKind,
  type VisualEditorState,
  type VisualEditorStyle,
  type VisualEditorTextBlock,
} from "@/lib/786-chat/visual-editor"

const ACTIVE_PROJECT_KEY = "786chat_builder_active_project"
const SIZE_KEY = "786chat_design_studio_size"
const RECENT_FONT_KEY = "786chat_design_studio_recent_fonts"
const BRAND_FONT_KEY = "786chat_design_studio_brand_fonts"

type StudioTab = "size" | "text" | "elements"
type EditorSection = { id: string; label: string; hidden: boolean }
type BrandFonts = { heading: string; body: string }

function copyState(state: VisualEditorState): VisualEditorState {
  return JSON.parse(JSON.stringify(state)) as VisualEditorState
}

function findPreviewIframe() {
  return Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe"))
    .find((frame) => frame.title.includes("compiled preview")) || null
}

function findNativeDesignPanel() {
  return Array.from(document.querySelectorAll<HTMLElement>("aside"))
    .find((panel) => panel.textContent?.includes("VVIP Visual Editor")) || null
}

function postToFrame(frame: HTMLIFrameElement | null, message: Record<string, unknown>) {
  if (!frame?.contentWindow || !frame.src) return
  try {
    frame.contentWindow.postMessage(message, new URL(frame.src).origin)
  } catch {
    // The preview can be replacing its deployment URL during rebuild.
  }
}

function readSavedSize(): StudioSizePreset | null {
  try {
    const value = JSON.parse(localStorage.getItem(SIZE_KEY) || "null") as StudioSizePreset | null
    if (
      value &&
      Number.isFinite(value.width) &&
      Number.isFinite(value.height) &&
      ["px", "in", "cm"].includes(value.unit)
    ) return value
  } catch {
    // Ignore stale local storage.
  }
  return null
}

function textShadowForEffect(effect: string | undefined) {
  if (effect === "shadow") return "3px 4px 0 rgba(15,23,42,.25)"
  if (effect === "glow") return "0 0 8px currentColor,0 0 20px currentColor"
  if (effect === "neon") return "0 0 4px #fff,0 0 10px currentColor,0 0 24px currentColor"
  if (effect === "threeD") return "1px 1px 0 #fff,2px 2px 0 #cbd5e1,3px 3px 0 #94a3b8"
  return undefined
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

export function DesignStudioOverlay() {
  const [designVisible, setDesignVisible] = useState(false)
  const [tab, setTab] = useState<StudioTab | null>(null)
  const [project, setProject] = useState<BuilderProject | null>(null)
  const [visualState, setVisualState] = useState<VisualEditorState>(() =>
    normalizeVisualEditorState(null))
  const [sections, setSections] = useState<EditorSection[]>([])
  const [selectedSection, setSelectedSection] = useState("")
  const [selectedStudioId, setSelectedStudioId] = useState("")
  const [bridgeVersion, setBridgeVersion] = useState("")
  const [saving, setSaving] = useState(false)
  const [building, setBuilding] = useState(false)
  const [build, setBuild] = useState<BuilderBuild | null>(null)
  const [dirty, setDirty] = useState(false)
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [undoStack, setUndoStack] = useState<VisualEditorState[]>([])
  const [redoStack, setRedoStack] = useState<VisualEditorState[]>([])

  const [sizeSearch, setSizeSearch] = useState("")
  const [activeSize, setActiveSize] = useState<StudioSizePreset | null>(null)
  const [customWidth, setCustomWidth] = useState(960)
  const [customHeight, setCustomHeight] = useState(720)
  const [customUnit, setCustomUnit] = useState<StudioUnit>("px")

  const [fontSearch, setFontSearch] = useState("")
  const [textSearch, setTextSearch] = useState("")
  const [customText, setCustomText] = useState("Your text")
  const [recentFonts, setRecentFonts] = useState<string[]>([])
  const [brandFonts, setBrandFonts] = useState<BrandFonts>({
    heading: "'Playfair Display', serif",
    body: "Inter, sans-serif",
  })

  const [elementSearch, setElementSearch] = useState("")
  const [elementCategory, setElementCategory] = useState<string>("Shapes")
  const [mediaUrl, setMediaUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const saveQueue = useRef<Promise<void>>(Promise.resolve())
  const lastProjectId = useRef("")

  const targetSection = selectedSection || sections[0]?.id || ""
  const selectedStyle = targetSection ? visualState.styles[targetSection] || {} : {}
  const selectedElement = visualState.elements.find((item) => item.id === selectedStudioId) || null
  const studioReady = bridgeVersion === VISUAL_EDITOR_BRIDGE_VERSION

  useEffect(() => {
    const update = () => {
      const visible = Boolean(findNativeDesignPanel())
      setDesignVisible(visible)
      if (!visible) {
        setTab(null)
        setSelectedStudioId("")
      }
    }
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  const loadActiveProject = useCallback(async () => {
    const id = localStorage.getItem(ACTIVE_PROJECT_KEY) || ""
    if (!id) {
      setProject(null)
      return
    }
    if (id === lastProjectId.current && project) return
    lastProjectId.current = id
    try {
      const loaded = await loadBuilderProject(id)
      setProject(loaded.project)
      setVisualState(loaded.project.visualEditor)
      setBuild(await loadBuilderBuild(id).catch(() => null))
      setError("")
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Design Studio could not load the project.")
    }
  }, [project])

  useEffect(() => {
    if (!designVisible) return
    void loadActiveProject()
    const timer = window.setInterval(() => {
      const id = localStorage.getItem(ACTIVE_PROJECT_KEY) || ""
      if (id && id !== lastProjectId.current) {
        lastProjectId.current = ""
        void loadActiveProject()
      }
    }, 900)
    return () => window.clearInterval(timer)
  }, [designVisible, loadActiveProject])

  useEffect(() => {
    try {
      setActiveSize(readSavedSize())
      const savedRecent = JSON.parse(localStorage.getItem(RECENT_FONT_KEY) || "[]") as unknown
      if (Array.isArray(savedRecent)) {
        setRecentFonts(savedRecent.filter((item): item is string => typeof item === "string").slice(0, 8))
      }
      const savedBrand = JSON.parse(localStorage.getItem(BRAND_FONT_KEY) || "null") as BrandFonts | null
      if (savedBrand?.heading && savedBrand?.body) setBrandFonts(savedBrand)
    } catch {
      // Keep safe defaults.
    }
  }, [])

  useEffect(() => {
    if (!designVisible) return
    const receive = (event: MessageEvent) => {
      const frame = findPreviewIframe()
      if (!frame?.contentWindow || event.source !== frame.contentWindow || !frame.src) return
      try {
        if (event.origin !== new URL(frame.src).origin) return
      } catch {
        return
      }
      if (!event.data || typeof event.data !== "object") return
      const data = event.data as Record<string, unknown>
      if (
        (data.type === "786-editor:ready" || data.type === "786-editor:sections") &&
        Array.isArray(data.sections)
      ) {
        const nextSections = data.sections.filter((item): item is EditorSection => {
          if (!item || typeof item !== "object") return false
          const section = item as Record<string, unknown>
          return typeof section.id === "string" &&
            typeof section.label === "string" &&
            typeof section.hidden === "boolean"
        })
        setSections(nextSections)
        setSelectedSection((current) => current || nextSections[0]?.id || "")
        if (typeof data.bridgeVersion === "string") setBridgeVersion(data.bridgeVersion)
      }
      if (data.type === "786-editor:selected" && typeof data.id === "string") {
        setSelectedSection(data.id)
        setSelectedStudioId("")
      }
      if (data.type === "786-editor:studio-selected" && typeof data.id === "string") {
        setSelectedStudioId(data.id)
        if (data.kind === "text") setTab("text")
        if (data.kind === "element") setTab("elements")
      }
      if (data.type === "786-editor:version" && typeof data.bridgeVersion === "string") {
        setBridgeVersion(data.bridgeVersion)
      }
    }
    window.addEventListener("message", receive)
    const timer = window.setInterval(() => {
      const frame = findPreviewIframe()
      postToFrame(frame, { type: "786-editor:version" })
    }, 1400)
    return () => {
      window.removeEventListener("message", receive)
      window.clearInterval(timer)
    }
  }, [designVisible])

  useEffect(() => {
    if (!designVisible || !project) return
    const frame = findPreviewIframe()
    postToFrame(frame, { type: "786-editor:enable", enabled: true })
    postToFrame(frame, { type: "786-editor:version" })
  }, [designVisible, project?.id])

  useEffect(() => {
    if (!dirty) return
    const enforce = () => {
      const button = document.querySelector<HTMLButtonElement>("[data-786-publish]")
      if (!button) return
      button.disabled = true
      button.dataset.studioDisabled = "true"
      button.title = "Rebuild Design Studio changes before deploying."
    }
    enforce()
    const timer = window.setInterval(enforce, 500)
    return () => window.clearInterval(timer)
  }, [dirty])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(""), 3200)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !tab) return
      setTab(null)
      event.stopPropagation()
    }
    window.addEventListener("keydown", keydown)
    return () => window.removeEventListener("keydown", keydown)
  }, [tab])

  const applyActiveSize = useCallback((preset: StudioSizePreset | null) => {
    const frame = findPreviewIframe()
    const wrapper = frame?.parentElement
    if (!wrapper) return
    if (!preset) {
      if (wrapper.dataset.studioOriginalWidth !== undefined) {
        wrapper.style.width = wrapper.dataset.studioOriginalWidth
        wrapper.style.height = wrapper.dataset.studioOriginalHeight || ""
        wrapper.style.maxWidth = wrapper.dataset.studioOriginalMaxWidth || ""
        delete wrapper.dataset.studioOriginalWidth
        delete wrapper.dataset.studioOriginalHeight
        delete wrapper.dataset.studioOriginalMaxWidth
      }
      return
    }
    if (wrapper.dataset.studioOriginalWidth === undefined) {
      wrapper.dataset.studioOriginalWidth = wrapper.style.width || ""
      wrapper.dataset.studioOriginalHeight = wrapper.style.height || ""
      wrapper.dataset.studioOriginalMaxWidth = wrapper.style.maxWidth || ""
    }
    const width = sizeToPixels(preset.width, preset.unit)
    const height = sizeToPixels(preset.height, preset.unit)
    if (wrapper.style.width !== `${width}px`) wrapper.style.width = `${width}px`
    if (wrapper.style.height !== `${height}px`) wrapper.style.height = `${height}px`
    if (wrapper.style.maxWidth !== "none") wrapper.style.maxWidth = "none"
  }, [])

  useEffect(() => {
    if (!designVisible || !activeSize) return
    applyActiveSize(activeSize)
    const timer = window.setInterval(() => applyActiveSize(activeSize), 600)
    return () => window.clearInterval(timer)
  }, [activeSize, applyActiveSize, designVisible])

  function chooseSize(preset: StudioSizePreset) {
    setActiveSize(preset)
    localStorage.setItem(SIZE_KEY, JSON.stringify(preset))
    applyActiveSize(preset)
    setNotice(`Preview resized to ${formatStudioSize(preset)}.`)
  }

  function resetSize() {
    setActiveSize(null)
    localStorage.removeItem(SIZE_KEY)
    applyActiveSize(null)
    setNotice("Preview size returned to the device selector.")
  }

  function applyCustomSize() {
    const preset: StudioSizePreset = {
      id: `custom-${Date.now()}`,
      label: "Custom size",
      category: "Custom",
      width: Math.max(1, customWidth),
      height: Math.max(1, customHeight),
      unit: customUnit,
    }
    chooseSize(preset)
  }

  function postState(next: VisualEditorState) {
    postToFrame(findPreviewIframe(), { type: "786-editor:apply", state: next })
  }

  function persistState(nextValue: VisualEditorState, label: string) {
    if (!project) return Promise.resolve()
    const next = normalizeVisualEditorState(nextValue)
    setVisualState(next)
    postState(next)
    setDirty(true)
    setSaving(true)
    const projectId = project.id
    const operation = saveQueue.current.then(async () => {
      const saved = await saveVisualEditorState({ projectId, state: next, label })
      setProject(saved)
    }).catch((failure) => {
      setError(failure instanceof Error ? failure.message : "Design Studio change could not be saved.")
    }).finally(() => {
      setSaving(false)
    })
    saveQueue.current = operation
    return operation
  }

  function commitState(nextValue: VisualEditorState, label: string) {
    setUndoStack((current) => [...current.slice(-39), copyState(visualState)])
    setRedoStack([])
    void persistState(nextValue, label)
  }

  function undoStudio() {
    const previous = undoStack.at(-1)
    if (!previous) return
    setUndoStack((current) => current.slice(0, -1))
    setRedoStack((current) => [...current.slice(-39), copyState(visualState)])
    void persistState(previous, "Undo Design Studio edit")
  }

  function redoStudio() {
    const next = redoStack.at(-1)
    if (!next) return
    setRedoStack((current) => current.slice(0, -1))
    setUndoStack((current) => [...current.slice(-39), copyState(visualState)])
    void persistState(next, "Redo Design Studio edit")
  }

  function updateSectionStyle(patch: Partial<VisualEditorStyle>, label: string) {
    if (!targetSection) {
      setError("Click a page section in the preview first.")
      return
    }
    commitState({
      ...visualState,
      styles: {
        ...visualState.styles,
        [targetSection]: {
          ...(visualState.styles[targetSection] || {}),
          ...patch,
        },
      },
    }, label)
  }

  function rememberFont(family: string) {
    const next = [family, ...recentFonts.filter((item) => item !== family)].slice(0, 8)
    setRecentFonts(next)
    localStorage.setItem(RECENT_FONT_KEY, JSON.stringify(next))
  }

  function applyFont(family: string) {
    rememberFont(family)
    updateSectionStyle({ fontFamily: family }, "Change section font")
  }

  function addTextPreset(preset: typeof STUDIO_TEXT_PRESETS[number]) {
    if (!targetSection) {
      setError("Click a section in the live preview before adding text.")
      return
    }
    const block: VisualEditorTextBlock = {
      id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      targetId: targetSection,
      text: preset.text,
      style: {
        fontFamily: preset.fontFamily,
        fontSize: preset.fontSize,
        fontWeight: preset.fontWeight,
        color: preset.color,
        effect: preset.effect,
        letterSpacing: preset.letterSpacing,
        textTransform: preset.textTransform,
        lineHeight: 1.08,
        textAlign: "center",
      },
    }
    rememberFont(preset.fontFamily)
    commitState({
      ...visualState,
      textBlocks: [...visualState.textBlocks, block],
    }, `Add text preset: ${preset.label}`)
    setSelectedStudioId(block.id)
  }

  function addCustomText() {
    const text = customText.trim()
    if (!text) return
    addTextPreset({
      id: "custom",
      label: "Text box",
      text,
      fontFamily: selectedStyle.fontFamily || recentFonts[0] || "Inter, sans-serif",
      fontSize: selectedStyle.fontSize || 32,
      fontWeight: selectedStyle.fontWeight || 700,
      color: selectedStyle.color || "#111827",
      effect: "none",
      textTransform: "none",
    })
  }

  function updateTextBlock(id: string, patch: Partial<VisualEditorTextBlock>) {
    const next = visualState.textBlocks.map((item) =>
      item.id === id ? { ...item, ...patch } : item)
    commitState({ ...visualState, textBlocks: next }, "Edit text box")
  }

  function deleteTextBlock(id: string) {
    commitState({
      ...visualState,
      textBlocks: visualState.textBlocks.filter((item) => item.id !== id),
    }, "Delete text box")
    setSelectedStudioId("")
  }

  function addElementPreset(preset: typeof STUDIO_ELEMENT_PRESETS[number]) {
    if (!targetSection) {
      setError("Click a section in the live preview before adding an element.")
      return
    }
    const element: VisualEditorElement = {
      id: `element-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      targetId: targetSection,
      kind: preset.kind,
      preset: preset.preset,
      label: preset.label,
      width: preset.width,
      height: preset.height,
      rotation: 0,
      opacity: 1,
      color: preset.color,
    }
    commitState({
      ...visualState,
      elements: [...visualState.elements, element],
    }, `Add ${preset.label}`)
    setSelectedStudioId(element.id)
  }

  function addMedia(kind: Extract<VisualEditorElementKind, "image" | "video">, source: string) {
    const trimmed = source.trim()
    if (!/^https?:\/\//i.test(trimmed)) {
      setError("Use a complete http:// or https:// media URL.")
      return
    }
    if (!targetSection) {
      setError("Click a section in the live preview before adding media.")
      return
    }
    const element: VisualEditorElement = {
      id: `element-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      targetId: targetSection,
      kind,
      preset: kind,
      label: kind === "image" ? "Image" : "Video",
      source: trimmed,
      width: kind === "image" ? 360 : 480,
      height: kind === "image" ? 240 : 270,
      rotation: 0,
      opacity: 1,
    }
    commitState({
      ...visualState,
      elements: [...visualState.elements, element],
    }, `Add ${kind}`)
    setSelectedStudioId(element.id)
    setMediaUrl("")
  }

  function updateElement(id: string, patch: Partial<VisualEditorElement>) {
    const next = visualState.elements.map((item) =>
      item.id === id ? { ...item, ...patch } : item)
    commitState({ ...visualState, elements: next }, "Edit design element")
  }

  function duplicateElement(id: string) {
    const current = visualState.elements.find((item) => item.id === id)
    if (!current) return
    const duplicate: VisualEditorElement = {
      ...current,
      id: `element-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      rotation: (current.rotation || 0) + 2,
    }
    commitState({
      ...visualState,
      elements: [...visualState.elements, duplicate],
    }, "Duplicate design element")
    setSelectedStudioId(duplicate.id)
  }

  function deleteElement(id: string) {
    commitState({
      ...visualState,
      elements: visualState.elements.filter((item) => item.id !== id),
    }, "Delete design element")
    setSelectedStudioId("")
  }

  async function uploadImage(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be 10MB or smaller.")
      return
    }
    setUploading(true)
    setError("")
    try {
      const form = new FormData()
      form.append("file", file)
      const response = await fetch("/api/upload", { method: "POST", body: form })
      const payload = (await response.json().catch(() => ({}))) as {
        url?: string
        message?: string
        error?: string
      }
      if (!response.ok || !payload.url) {
        throw new Error(payload.message || payload.error || "Image storage is not configured.")
      }
      addMedia("image", payload.url)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Image could not be uploaded.")
    } finally {
      setUploading(false)
    }
  }

  function applyBackground(css: string, label: string) {
    updateSectionStyle({ backgroundImage: css }, `Apply background: ${label}`)
  }

  function saveBrandFonts(next: BrandFonts) {
    setBrandFonts(next)
    localStorage.setItem(BRAND_FONT_KEY, JSON.stringify(next))
  }

  async function queueStudioBuild() {
    if (!project || building) return
    setBuilding(true)
    setError("")
    setNotice("Design Studio rebuild started…")
    try {
      await saveQueue.current
      let next = await queueBuilderBuild(project.id)
      setBuild(next)
      for (let index = 0; index < 120 && ["queued", "running"].includes(next.status); index += 1) {
        await wait(2000)
        next = await loadBuilderBuild(project.id) || next
        setBuild(next)
      }
      if (next.status !== "passed") {
        throw new Error(next.error_message || "Design Studio rebuild did not pass.")
      }
      setDirty(false)
      setNotice("Build passed. Refreshing the verified preview…")
      await wait(700)
      window.location.reload()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Design Studio rebuild failed.")
    } finally {
      setBuilding(false)
    }
  }

  async function enableStudio() {
    if (!project || building) return
    setNotice("Updating the Design Studio bridge…")
    await persistState(visualState, "Enable Design Studio")
    await queueStudioBuild()
  }

  const filteredSizes = useMemo(() => {
    const query = sizeSearch.trim().toLowerCase()
    if (!query) return STUDIO_SIZE_PRESETS
    return STUDIO_SIZE_PRESETS.filter((preset) =>
      `${preset.label} ${preset.category} ${formatStudioSize(preset)}`.toLowerCase().includes(query))
  }, [sizeSearch])

  const filteredFonts = useMemo(() => {
    const query = fontSearch.trim().toLowerCase()
    if (!query) return STUDIO_FONTS
    return STUDIO_FONTS.filter((font) =>
      `${font.name} ${font.category} ${font.sample}`.toLowerCase().includes(query))
  }, [fontSearch])

  const filteredTextPresets = useMemo(() => {
    const query = textSearch.trim().toLowerCase()
    if (!query) return STUDIO_TEXT_PRESETS
    return STUDIO_TEXT_PRESETS.filter((preset) =>
      `${preset.label} ${preset.text} ${preset.fontFamily}`.toLowerCase().includes(query))
  }, [textSearch])

  const filteredElements = useMemo(() => {
    const query = elementSearch.trim().toLowerCase()
    return STUDIO_ELEMENT_PRESETS.filter((preset) =>
      preset.category === elementCategory &&
      (!query || `${preset.label} ${preset.category}`.toLowerCase().includes(query)))
  }, [elementCategory, elementSearch])

  if (!designVisible) return null

  return (
    <>
      <div className="fixed right-[348px] top-[118px] z-[64] flex flex-col gap-2 max-xl:right-3">
        {([
          ["size", Maximize2, "Sizes"],
          ["text", Type, "Text & fonts"],
          ["elements", Shapes, "Elements"],
        ] as const).map(([id, Icon, label]) => (
          <button
            key={id}
            type="button"
            title={label}
            aria-label={label}
            onClick={() => setTab((current) => current === id ? null : id)}
            className={`grid h-11 w-11 place-items-center rounded-xl border shadow-xl backdrop-blur-xl ${
              tab === id
                ? "border-fuchsia-300/60 bg-fuchsia-500 text-white"
                : "border-white/15 bg-[#0a1120]/95 text-slate-300 hover:border-cyan-300/40 hover:text-cyan-100"
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      {tab && (
        <section
          role="dialog"
          aria-modal="false"
          aria-label="786.Chat Design Studio"
          className="fixed bottom-[196px] right-[400px] top-[76px] z-[63] flex w-[420px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-fuchsia-300/25 bg-[#080d19]/[.98] text-white shadow-[-20px_20px_70px_rgba(0,0,0,.55)] backdrop-blur-xl max-xl:bottom-3 max-xl:right-3 max-xl:top-[118px]"
        >
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[#263550] px-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-cyan-500">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <b className="block text-[14px]">786 Design Studio</b>
              <span className="block truncate text-[11px] text-slate-500">
                {targetSection
                  ? `Editing ${sections.find((item) => item.id === targetSection)?.label || "selected section"}`
                  : "Select a preview section"}
              </span>
            </div>
            <button
              type="button"
              onClick={undoStudio}
              disabled={!undoStack.length || saving || building}
              className="ml-auto rounded p-2 text-slate-300 hover:bg-white/10 disabled:opacity-25"
              aria-label="Undo Studio edit"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={redoStudio}
              disabled={!redoStack.length || saving || building}
              className="rounded p-2 text-slate-300 hover:bg-white/10 disabled:opacity-25"
              aria-label="Redo Studio edit"
            >
              <Redo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setTab(null)}
              className="rounded p-2 text-slate-400 hover:bg-white/10"
              aria-label="Close Design Studio"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          {!studioReady && tab !== "size" ? (
            <div className="m-3 rounded-xl border border-amber-300/25 bg-amber-300/10 p-4">
              <b className="text-[13px] text-amber-100">One-time Studio upgrade required</b>
              <p className="mt-2 text-[12px] leading-5 text-slate-300">
                This existing project uses the earlier visual-editor bridge. Upgrade and rebuild once to enable text presets, fonts, frames, shapes and media safely.
              </p>
              <button
                type="button"
                onClick={() => void enableStudio()}
                disabled={building || saving}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-300 px-3 py-2 text-[12px] font-black text-slate-950 disabled:opacity-50"
              >
                {building ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                Upgrade Studio & rebuild
              </button>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {tab === "size" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[15px] font-black">Suggested & custom sizes</h3>
                    <p className="mt-1 text-[12px] leading-5 text-slate-500">
                      Resize only the live preview. Website, social and print presets use 96 DPI for inch/cm preview conversion.
                    </p>
                  </div>
                  <label className="flex h-10 items-center gap-2 rounded-lg border border-[#263550] bg-[#0d1526] px-3">
                    <Search className="h-4 w-4 text-slate-500" />
                    <input
                      value={sizeSearch}
                      onChange={(event) => setSizeSearch(event.target.value)}
                      placeholder="Search resize options"
                      className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-600"
                    />
                  </label>

                  <div className="rounded-xl border border-[#263550] bg-[#0d1526] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <b className="text-[12px]">Custom size</b>
                      <button type="button" onClick={resetSize} className="text-[11px] font-bold text-cyan-300">Reset</button>
                    </div>
                    <div className="grid grid-cols-[1fr_1fr_82px] gap-2">
                      <input type="number" min={1} value={customWidth} onChange={(event) => setCustomWidth(Number(event.target.value) || 1)} aria-label="Custom width" className="h-9 rounded border border-[#32435f] bg-[#070c18] px-2 text-[12px]" />
                      <input type="number" min={1} value={customHeight} onChange={(event) => setCustomHeight(Number(event.target.value) || 1)} aria-label="Custom height" className="h-9 rounded border border-[#32435f] bg-[#070c18] px-2 text-[12px]" />
                      <select value={customUnit} onChange={(event) => setCustomUnit(event.target.value as StudioUnit)} className="h-9 rounded border border-[#32435f] bg-[#070c18] px-2 text-[12px]">
                        <option value="px">px</option>
                        <option value="in">in</option>
                        <option value="cm">cm</option>
                      </select>
                    </div>
                    <button type="button" onClick={applyCustomSize} className="mt-2 h-9 w-full rounded-lg bg-violet-500 text-[12px] font-black">
                      Apply custom size
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {filteredSizes.map((preset) => {
                      const width = sizeToPixels(preset.width, preset.unit)
                      const height = sizeToPixels(preset.height, preset.unit)
                      const landscape = width >= height
                      const active = activeSize?.id === preset.id
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => chooseSize(preset)}
                          className={`rounded-xl border p-2 text-left transition ${
                            active ? "border-cyan-300/60 bg-cyan-400/10" : "border-[#263550] bg-[#0d1526] hover:border-violet-300/40"
                          }`}
                        >
                          <span className="grid h-20 place-items-center rounded-lg bg-white/[.04]">
                            <span
                              className={`block rounded bg-gradient-to-br from-cyan-300 to-violet-500 shadow-lg ${
                                landscape ? "h-9 w-24" : "h-16 w-8"
                              }`}
                            />
                          </span>
                          <b className="mt-2 block text-[12px]">{preset.label}</b>
                          <span className="text-[11px] text-slate-500">{formatStudioSize(preset)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {tab === "text" && studioReady && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[15px] font-black">Text & fonts</h3>
                    <p className="mt-1 text-[12px] leading-5 text-slate-500">
                      Apply typography to the selected section or add original 786.Chat text presets.
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#263550] bg-[#0d1526] p-3">
                    <b className="text-[12px]">Add a text box</b>
                    <div className="mt-2 flex gap-2">
                      <input value={customText} onChange={(event) => setCustomText(event.target.value)} className="h-9 min-w-0 flex-1 rounded border border-[#32435f] bg-[#070c18] px-2 text-[12px]" />
                      <button type="button" onClick={addCustomText} className="rounded bg-violet-500 px-3 text-[12px] font-black">Add</button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#263550] bg-[#0d1526] p-3">
                    <div className="flex items-center justify-between">
                      <b className="text-[12px]">Brand fonts</b>
                      <span className="text-[10px] text-slate-500">Saved on this browser</span>
                    </div>
                    <label className="mt-2 block text-[11px] text-slate-400">Heading
                      <select value={brandFonts.heading} onChange={(event) => saveBrandFonts({ ...brandFonts, heading: event.target.value })} className="mt-1 h-9 w-full rounded border border-[#32435f] bg-[#070c18] px-2 text-[12px]">
                        {STUDIO_FONTS.map((font) => <option key={font.id} value={font.family}>{font.name}</option>)}
                      </select>
                    </label>
                    <label className="mt-2 block text-[11px] text-slate-400">Body
                      <select value={brandFonts.body} onChange={(event) => saveBrandFonts({ ...brandFonts, body: event.target.value })} className="mt-1 h-9 w-full rounded border border-[#32435f] bg-[#070c18] px-2 text-[12px]">
                        {STUDIO_FONTS.map((font) => <option key={font.id} value={font.family}>{font.name}</option>)}
                      </select>
                    </label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => applyFont(brandFonts.heading)} className="rounded border border-violet-300/20 px-2 py-2 text-[11px] font-bold text-violet-200">Apply heading</button>
                      <button type="button" onClick={() => applyFont(brandFonts.body)} className="rounded border border-cyan-300/20 px-2 py-2 text-[11px] font-bold text-cyan-200">Apply body</button>
                    </div>
                  </div>

                  <label className="flex h-10 items-center gap-2 rounded-lg border border-[#263550] bg-[#0d1526] px-3">
                    <Search className="h-4 w-4 text-slate-500" />
                    <input value={fontSearch} onChange={(event) => setFontSearch(event.target.value)} placeholder="Search fonts and combinations" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-600" />
                  </label>

                  {recentFonts.length > 0 && (
                    <div>
                      <b className="mb-2 block text-[12px]">Recently used</b>
                      <div className="flex flex-wrap gap-2">
                        {recentFonts.map((family) => (
                          <button key={family} type="button" onClick={() => applyFont(family)} className="rounded-full border border-[#32435f] bg-[#0d1526] px-3 py-1.5 text-[11px]">
                            {family.split(",")[0].replaceAll("'", "")}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <b className="mb-2 block text-[12px]">Font library</b>
                    <div className="grid grid-cols-2 gap-2">
                      {filteredFonts.map((font) => (
                        <button key={font.id} type="button" onClick={() => applyFont(font.family)} className="min-h-24 rounded-xl border border-[#263550] bg-[#0d1526] p-3 text-left hover:border-fuchsia-300/40">
                          <span className="block text-[20px] leading-tight" style={{ fontFamily: font.family }}>{font.sample}</span>
                          <b className="mt-2 block text-[11px]">{font.name}</b>
                          <span className="text-[10px] text-slate-500">{font.category}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#263550] bg-[#0d1526] p-3">
                    <b className="text-[12px]">Selected section typography</b>
                    <div className="mt-2 grid grid-cols-5 gap-1">
                      {[400, 600, 700, 800, 900].map((weight) => (
                        <button key={weight} type="button" onClick={() => updateSectionStyle({ fontWeight: weight }, "Change font weight")} className={`rounded border px-1 py-2 text-[10px] ${selectedStyle.fontWeight === weight ? "border-fuchsia-300/50 bg-fuchsia-400/10" : "border-[#32435f]"}`}>{weight}</button>
                      ))}
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1">
                      {(["left", "center", "right"] as const).map((align) => (
                        <button key={align} type="button" onClick={() => updateSectionStyle({ textAlign: align }, "Change text alignment")} className={`rounded border px-1 py-2 text-[10px] capitalize ${selectedStyle.textAlign === align ? "border-cyan-300/50 bg-cyan-400/10" : "border-[#32435f]"}`}>{align}</button>
                      ))}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <label className="text-[10px] text-slate-500">Letter spacing
                        <input type="number" min={-12} max={48} value={selectedStyle.letterSpacing ?? 0} onChange={(event) => updateSectionStyle({ letterSpacing: Number(event.target.value) }, "Change letter spacing")} className="mt-1 h-8 w-full rounded border border-[#32435f] bg-[#070c18] px-2 text-[11px] text-white" />
                      </label>
                      <label className="text-[10px] text-slate-500">Line height
                        <input type="number" min={0.7} max={4} step={0.1} value={selectedStyle.lineHeight ?? 1.2} onChange={(event) => updateSectionStyle({ lineHeight: Number(event.target.value) }, "Change line height")} className="mt-1 h-8 w-full rounded border border-[#32435f] bg-[#070c18] px-2 text-[11px] text-white" />
                      </label>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1">
                      <button type="button" onClick={() => updateSectionStyle({ fontStyle: selectedStyle.fontStyle === "italic" ? "normal" : "italic" }, "Toggle italic")} className="rounded border border-[#32435f] py-2 text-[10px] italic">Italic</button>
                      <button type="button" onClick={() => updateSectionStyle({ textDecoration: selectedStyle.textDecoration === "underline" ? "none" : "underline" }, "Toggle underline")} className="rounded border border-[#32435f] py-2 text-[10px] underline">Underline</button>
                      <button type="button" onClick={() => updateSectionStyle({ textTransform: selectedStyle.textTransform === "uppercase" ? "none" : "uppercase" }, "Toggle uppercase")} className="rounded border border-[#32435f] py-2 text-[10px]">ABC</button>
                    </div>
                  </div>

                  <label className="flex h-10 items-center gap-2 rounded-lg border border-[#263550] bg-[#0d1526] px-3">
                    <Search className="h-4 w-4 text-slate-500" />
                    <input value={textSearch} onChange={(event) => setTextSearch(event.target.value)} placeholder="Search text styles" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-600" />
                  </label>

                  <div>
                    <b className="mb-2 block text-[12px]">Original 786.Chat text styles</b>
                    <div className="grid grid-cols-2 gap-2">
                      {filteredTextPresets.map((preset) => (
                        <button key={preset.id} type="button" onClick={() => addTextPreset(preset)} className="min-h-28 overflow-hidden rounded-xl border border-[#263550] bg-[#f8fafc] p-3 text-left hover:border-fuchsia-300/60">
                          <span
                            className="block whitespace-pre-line text-center leading-tight"
                            style={{
                              fontFamily: preset.fontFamily,
                              fontSize: Math.min(26, Math.max(15, preset.fontSize * .48)),
                              fontWeight: preset.fontWeight,
                              color: preset.color,
                              letterSpacing: preset.letterSpacing,
                              textTransform: preset.textTransform,
                              textShadow: textShadowForEffect(preset.effect),
                            }}
                          >
                            {preset.text}
                          </span>
                          <b className="mt-2 block text-[10px] text-slate-600">{preset.label}</b>
                        </button>
                      ))}
                    </div>
                  </div>

                  {visualState.textBlocks.length > 0 && (
                    <div>
                      <b className="mb-2 block text-[12px]">Added text</b>
                      <div className="space-y-2">
                        {visualState.textBlocks.map((block) => (
                          <div key={block.id} className={`rounded-lg border p-2 ${selectedStudioId === block.id ? "border-fuchsia-300/50 bg-fuchsia-400/10" : "border-[#263550] bg-[#0d1526]"}`}>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => setSelectedStudioId(block.id)} className="min-w-0 flex-1 truncate text-left text-[11px] font-bold">{block.text.replace(/\n/g, " ")}</button>
                              <button type="button" onClick={() => deleteTextBlock(block.id)} className="text-rose-300" aria-label="Delete text box"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                            {selectedStudioId === block.id && (
                              <textarea value={block.text} onChange={(event) => updateTextBlock(block.id, { text: event.target.value })} rows={2} className="mt-2 w-full resize-none rounded border border-[#32435f] bg-[#070c18] p-2 text-[11px]" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === "elements" && studioReady && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[15px] font-black">Elements</h3>
                    <p className="mt-1 text-[12px] leading-5 text-slate-500">
                      Original shapes, frames, graphics, forms, tables, charts, mockups, 3D objects and media.
                    </p>
                  </div>

                  <label className="flex h-10 items-center gap-2 rounded-lg border border-[#263550] bg-[#0d1526] px-3">
                    <Search className="h-4 w-4 text-slate-500" />
                    <input value={elementSearch} onChange={(event) => setElementSearch(event.target.value)} placeholder="Search elements" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-600" />
                  </label>

                  <div className="grid grid-cols-4 gap-1">
                    {STUDIO_ELEMENT_CATEGORIES.map((category) => (
                      <button key={category} type="button" onClick={() => setElementCategory(category)} className={`rounded-lg border px-1 py-2 text-[9px] font-bold ${elementCategory === category ? "border-cyan-300/40 bg-cyan-400/10 text-cyan-100" : "border-[#263550] text-slate-400"}`}>
                        {category}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {filteredElements.map((preset) => (
                      <button key={preset.id} type="button" onClick={() => addElementPreset(preset)} className="rounded-xl border border-[#263550] bg-[#0d1526] p-2 text-left hover:border-cyan-300/40">
                        <span className="grid h-20 place-items-center overflow-hidden rounded-lg bg-white/[.04]">
                          {preset.kind === "shape" && (
                            <span
                              style={{
                                width: Math.min(72, preset.width * .5),
                                height: Math.min(58, Math.max(5, preset.height * .45)),
                                background: preset.color,
                                borderRadius: preset.preset === "circle" || preset.preset === "pill" ? 999 : preset.preset === "rounded" ? 14 : 3,
                              }}
                            />
                          )}
                          {preset.kind === "frame" && <Frame className="h-10 w-10 text-violet-300" />}
                          {preset.kind === "graphic" && <Sparkles className="h-10 w-10 text-amber-300" />}
                          {preset.kind === "form" && <Box className="h-10 w-10 text-blue-300" />}
                          {preset.kind === "table" && <span className="grid grid-cols-3 gap-1">{Array.from({ length: 9 }).map((_, index) => <i key={index} className="h-3 w-5 rounded-sm bg-slate-500/50" />)}</span>}
                          {preset.kind === "chart" && <span className="flex h-12 items-end gap-1">{[4, 8, 6, 11].map((height, index) => <i key={index} className="w-3 rounded-t bg-cyan-400" style={{ height: height * 4 }} />)}</span>}
                          {preset.kind === "mockup" && <Monitor className="h-10 w-10 text-emerald-300" />}
                          {preset.kind === "threeD" && <span className="h-12 w-12 rounded-full bg-gradient-to-br from-white via-cyan-300 to-violet-600 shadow-lg" />}
                        </span>
                        <b className="mt-2 block text-[11px]">{preset.label}</b>
                        <span className="text-[10px] text-slate-500">{preset.category}</span>
                      </button>
                    ))}
                  </div>

                  <div>
                    <b className="mb-2 block text-[12px]">Backgrounds & textures</b>
                    <div className="grid grid-cols-2 gap-2">
                      {STUDIO_BACKGROUND_PRESETS.map((background) => (
                        <button key={background.id} type="button" onClick={() => applyBackground(background.css, background.label)} className="overflow-hidden rounded-xl border border-[#263550] text-left hover:border-fuchsia-300/40">
                          <span className="block h-16" style={{ backgroundImage: background.css, backgroundSize: background.id === "bg-grid" ? "18px 18px" : undefined }} />
                          <span className="block bg-[#0d1526] px-2 py-2 text-[10px] font-bold">{background.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#263550] bg-[#0d1526] p-3">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-cyan-300" />
                      <b className="text-[12px]">Photos & videos</b>
                    </div>
                    <input ref={uploadInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" className="hidden" onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) void uploadImage(file)
                      event.target.value = ""
                    }} />
                    <button type="button" onClick={() => uploadInputRef.current?.click()} disabled={uploading} className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-400/10 text-[11px] font-bold text-cyan-100 disabled:opacity-50">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Upload photo
                    </button>
                    <div className="mt-2 flex gap-2">
                      <input value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} placeholder="https:// image or video URL" className="h-9 min-w-0 flex-1 rounded border border-[#32435f] bg-[#070c18] px-2 text-[11px]" />
                      <button type="button" onClick={() => addMedia("image", mediaUrl)} className="rounded border border-[#32435f] px-2 text-[10px]" title="Add image"><ImageIcon className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => addMedia("video", mediaUrl)} className="rounded border border-[#32435f] px-2 text-[10px]" title="Add video"><Video className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>

                  {selectedElement && (
                    <div className="rounded-xl border border-fuchsia-300/25 bg-fuchsia-400/[.06] p-3">
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-fuchsia-300" />
                        <b className="text-[12px]">Selected: {selectedElement.label || selectedElement.preset}</b>
                        <button type="button" onClick={() => duplicateElement(selectedElement.id)} className="ml-auto text-cyan-300" aria-label="Duplicate element"><Copy className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => deleteElement(selectedElement.id)} className="text-rose-300" aria-label="Delete element"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <label className="text-[10px] text-slate-500">Width
                          <input type="number" min={24} max={2400} value={selectedElement.width || 120} onChange={(event) => updateElement(selectedElement.id, { width: Number(event.target.value) })} className="mt-1 h-8 w-full rounded border border-[#32435f] bg-[#070c18] px-2 text-[11px] text-white" />
                        </label>
                        <label className="text-[10px] text-slate-500">Height
                          <input type="number" min={16} max={1800} value={selectedElement.height || 120} onChange={(event) => updateElement(selectedElement.id, { height: Number(event.target.value) })} className="mt-1 h-8 w-full rounded border border-[#32435f] bg-[#070c18] px-2 text-[11px] text-white" />
                        </label>
                        <label className="text-[10px] text-slate-500">Rotate
                          <input type="number" min={-360} max={360} value={selectedElement.rotation || 0} onChange={(event) => updateElement(selectedElement.id, { rotation: Number(event.target.value) })} className="mt-1 h-8 w-full rounded border border-[#32435f] bg-[#070c18] px-2 text-[11px] text-white" />
                        </label>
                        <label className="text-[10px] text-slate-500">Opacity
                          <input type="number" min={0.05} max={1} step={0.05} value={selectedElement.opacity ?? 1} onChange={(event) => updateElement(selectedElement.id, { opacity: Number(event.target.value) })} className="mt-1 h-8 w-full rounded border border-[#32435f] bg-[#070c18] px-2 text-[11px] text-white" />
                        </label>
                      </div>
                      <label className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                        Colour
                        <input type="color" value={selectedElement.color?.slice(0, 7) || "#7c3aed"} onChange={(event) => updateElement(selectedElement.id, { color: event.target.value })} className="h-8 w-12 rounded border border-[#32435f] bg-transparent" />
                      </label>
                      {selectedElement.kind === "frame" && (
                        <label className="mt-2 block text-[10px] text-slate-500">Frame image URL
                          <input value={selectedElement.source || ""} onChange={(event) => updateElement(selectedElement.id, { source: event.target.value })} placeholder="https://…" className="mt-1 h-8 w-full rounded border border-[#32435f] bg-[#070c18] px-2 text-[11px] text-white" />
                        </label>
                      )}
                    </div>
                  )}

                  {visualState.elements.length > 0 && (
                    <div>
                      <b className="mb-2 block text-[12px]">Added elements</b>
                      <div className="space-y-1">
                        {visualState.elements.map((item) => (
                          <button key={item.id} type="button" onClick={() => setSelectedStudioId(item.id)} className={`flex w-full items-center rounded-lg border px-2 py-2 text-left text-[11px] ${selectedStudioId === item.id ? "border-fuchsia-300/50 bg-fuchsia-400/10" : "border-[#263550] bg-[#0d1526]"}`}>
                            <Shapes className="mr-2 h-3.5 w-3.5 text-cyan-300" />
                            <span className="min-w-0 flex-1 truncate">{item.label || item.preset}</span>
                            <span className="text-[9px] uppercase text-slate-600">{item.kind}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {(error || notice) && (
            <div className="shrink-0 border-t border-[#263550] px-3 py-2">
              {error && <p className="rounded-lg border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-[11px] leading-4 text-rose-100">{error}</p>}
              {!error && notice && <p className="rounded-lg border border-emerald-300/20 bg-emerald-500/10 px-3 py-2 text-[11px] leading-4 text-emerald-100">{notice}</p>}
            </div>
          )}

          <footer className="shrink-0 border-t border-[#263550] p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] text-slate-500">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-emerald-300" />}
              {saving ? "Saving Studio changes…" : dirty ? "Saved · rebuild required before deploy" : "Studio changes are synced"}
              {build && <span className="ml-auto uppercase">{build.status}</span>}
            </div>
            <button
              type="button"
              onClick={() => void queueStudioBuild()}
              disabled={!project || building || saving || (!dirty && studioReady)}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 text-[12px] font-black disabled:opacity-40"
            >
              {building ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
              {building ? "Building verified preview…" : "Save & rebuild verified preview"}
            </button>
            <p className="mt-2 text-center text-[9px] text-slate-600">
              Esc closes this Studio panel without changing your AI prompt.
            </p>
          </footer>
        </section>
      )}
    </>
  )
}
