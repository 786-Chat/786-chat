import type {
  VisualEditorElementKind,
  VisualEditorTextEffect,
} from "@/lib/786-chat/visual-editor"

export type StudioUnit = "px" | "in" | "cm"

export type StudioSizePreset = {
  id: string
  label: string
  category: "Website" | "Social" | "Print" | "Custom"
  width: number
  height: number
  unit: StudioUnit
}

export type StudioFontPreset = {
  id: string
  name: string
  family: string
  category: "Sans" | "Serif" | "Display" | "Script" | "Retro" | "Pixel"
  sample: string
}

export type StudioTextPreset = {
  id: string
  label: string
  text: string
  fontFamily: string
  fontSize: number
  fontWeight: number
  color: string
  effect: VisualEditorTextEffect
  letterSpacing?: number
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize"
}

export type StudioElementPreset = {
  id: string
  label: string
  kind: VisualEditorElementKind
  preset: string
  category:
    | "Shapes"
    | "Frames"
    | "Graphics"
    | "Forms"
    | "Tables"
    | "Charts"
    | "Mockups"
    | "3D"
  width: number
  height: number
  color?: string
}

export type StudioBackgroundPreset = {
  id: string
  label: string
  css: string
}

export const STUDIO_SIZE_PRESETS: StudioSizePreset[] = [
  { id: "website-1366", label: "Website", category: "Website", width: 1366, height: 768, unit: "px" },
  { id: "website-1440", label: "Desktop website", category: "Website", width: 1440, height: 900, unit: "px" },
  { id: "website-1920", label: "Full HD website", category: "Website", width: 1920, height: 1080, unit: "px" },
  { id: "banner-1200", label: "Wide banner", category: "Social", width: 1200, height: 600, unit: "px" },
  { id: "banner-700", label: "Web banner", category: "Social", width: 700, height: 469, unit: "px" },
  { id: "custom-700-200", label: "Custom size", category: "Custom", width: 700, height: 200, unit: "px" },
  { id: "custom-600-300", label: "Custom size", category: "Custom", width: 600, height: 300, unit: "px" },
  { id: "custom-1500-1000", label: "Custom size", category: "Custom", width: 1500, height: 1000, unit: "px" },
  { id: "portrait-1242", label: "Tall mobile artwork", category: "Social", width: 1242, height: 2688, unit: "px" },
  { id: "ultrawide-6912", label: "Ultra-wide display", category: "Custom", width: 6912, height: 1920, unit: "px" },
  { id: "print-15-square", label: "Square print", category: "Print", width: 15, height: 15, unit: "in" },
  { id: "print-52-20", label: "Wide print", category: "Print", width: 52, height: 20, unit: "in" },
  { id: "print-40-square", label: "Large square print", category: "Print", width: 40, height: 40, unit: "in" },
  { id: "print-72-20", label: "Panoramic print", category: "Print", width: 72, height: 20, unit: "in" },
  { id: "print-72-36", label: "Large banner", category: "Print", width: 72, height: 36, unit: "in" },
  { id: "print-cm-4318", label: "Poster", category: "Print", width: 43.18, height: 71.12, unit: "cm" },
]

export const STUDIO_FONTS: StudioFontPreset[] = [
  { id: "inter", name: "Inter", family: "Inter, sans-serif", category: "Sans", sample: "Clean business" },
  { id: "dm-sans", name: "DM Sans", family: "'DM Sans', sans-serif", category: "Sans", sample: "Modern product" },
  { id: "space-grotesk", name: "Space Grotesk", family: "'Space Grotesk', sans-serif", category: "Sans", sample: "Future studio" },
  { id: "montserrat", name: "Montserrat", family: "Montserrat, sans-serif", category: "Sans", sample: "Premium brand" },
  { id: "poppins", name: "Poppins", family: "Poppins, sans-serif", category: "Sans", sample: "Friendly modern" },
  { id: "oswald", name: "Oswald", family: "Oswald, sans-serif", category: "Display", sample: "BOLD OFFER" },
  { id: "bebas-neue", name: "Bebas Neue", family: "'Bebas Neue', sans-serif", category: "Display", sample: "BIG DEAL" },
  { id: "archivo-black", name: "Archivo Black", family: "'Archivo Black', sans-serif", category: "Display", sample: "NEW DROP" },
  { id: "righteous", name: "Righteous", family: "Righteous, sans-serif", category: "Display", sample: "Color shadow" },
  { id: "bangers", name: "Bangers", family: "Bangers, fantasy", category: "Display", sample: "LET'S PARTY!" },
  { id: "playfair", name: "Playfair Display", family: "'Playfair Display', serif", category: "Serif", sample: "Golden Hour" },
  { id: "lora", name: "Lora", family: "Lora, serif", category: "Serif", sample: "Business Journal" },
  { id: "cinzel", name: "Cinzel", family: "Cinzel, serif", category: "Serif", sample: "Luxury Collection" },
  { id: "georgia", name: "Georgia", family: "Georgia, serif", category: "Serif", sample: "Classic editorial" },
  { id: "pacifico", name: "Pacifico", family: "Pacifico, cursive", category: "Script", sample: "Coffee Break" },
  { id: "dancing-script", name: "Dancing Script", family: "'Dancing Script', cursive", category: "Script", sample: "Thank you!" },
  { id: "caveat", name: "Caveat", family: "Caveat, cursive", category: "Script", sample: "Great work!" },
  { id: "lobster", name: "Lobster", family: "Lobster, cursive", category: "Script", sample: "Sweet" },
  { id: "permanent-marker", name: "Permanent Marker", family: "'Permanent Marker', cursive", category: "Retro", sample: "ROCK" },
  { id: "great-vibes", name: "Great Vibes", family: "'Great Vibes', cursive", category: "Script", sample: "Bride & Groom" },
  { id: "press-start", name: "Press Start 2P", family: "'Press Start 2P', monospace", category: "Pixel", sample: "GAME OVER" },
  { id: "courier", name: "Courier New", family: "'Courier New', monospace", category: "Pixel", sample: "DATA IS POWER" },
  { id: "impact", name: "Impact", family: "Impact, sans-serif", category: "Display", sample: "SALE SALE SALE" },
  { id: "trebuchet", name: "Trebuchet MS", family: "'Trebuchet MS', sans-serif", category: "Sans", sample: "Clear communication" },
]

export const STUDIO_TEXT_PRESETS: StudioTextPreset[] = [
  { id: "heading", label: "Heading", text: "Add a heading", fontFamily: "Inter, sans-serif", fontSize: 48, fontWeight: 800, color: "#111827", effect: "none" },
  { id: "subheading", label: "Subheading", text: "Add a subheading", fontFamily: "'DM Sans', sans-serif", fontSize: 30, fontWeight: 700, color: "#334155", effect: "none" },
  { id: "body", label: "Body text", text: "Add a little bit of body text", fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 400, color: "#475569", effect: "none" },
  { id: "bulk-deal", label: "Bulk Deal", text: "BULK\nDEAL", fontFamily: "'Bebas Neue', sans-serif", fontSize: 58, fontWeight: 700, color: "#7c3aed", effect: "threeD", textTransform: "uppercase" },
  { id: "coffee-break", label: "Coffee Break", text: "Coffee Break", fontFamily: "Pacifico, cursive", fontSize: 42, fontWeight: 400, color: "#047857", effect: "none" },
  { id: "fire-away", label: "Fire Away", text: "FIRE away", fontFamily: "'Permanent Marker', cursive", fontSize: 46, fontWeight: 700, color: "#f97316", effect: "shadow" },
  { id: "insert-coin", label: "Insert Coin", text: "INSERT COIN", fontFamily: "'Press Start 2P', monospace", fontSize: 26, fontWeight: 400, color: "#7c3aed", effect: "neon", textTransform: "uppercase" },
  { id: "spring-mood", label: "Spring Mood", text: "Spring\nMOOD", fontFamily: "'Dancing Script', cursive", fontSize: 44, fontWeight: 700, color: "#16a34a", effect: "glow" },
  { id: "thank-you", label: "Thank You", text: "Thank you!", fontFamily: "'Dancing Script', cursive", fontSize: 54, fontWeight: 700, color: "#0284c7", effect: "shadow" },
  { id: "golden-hour", label: "Golden Hour", text: "GOLDEN\nHOUR", fontFamily: "'Playfair Display', serif", fontSize: 46, fontWeight: 800, color: "#ca8a04", effect: "shadow", textTransform: "uppercase" },
  { id: "now-open", label: "Now Open", text: "Now\nOpen!", fontFamily: "'Dancing Script', cursive", fontSize: 50, fontWeight: 700, color: "#6366f1", effect: "neon" },
  { id: "new-drop", label: "New Drop", text: "NEW DROP!", fontFamily: "'Permanent Marker', cursive", fontSize: 42, fontWeight: 700, color: "#365314", effect: "outline", textTransform: "uppercase" },
  { id: "sale", label: "Sale", text: "SALE", fontFamily: "Impact, sans-serif", fontSize: 58, fontWeight: 800, color: "#ef4444", effect: "outline", letterSpacing: 4, textTransform: "uppercase" },
  { id: "coming-soon", label: "Coming Soon", text: "COMING SOON", fontFamily: "Montserrat, sans-serif", fontSize: 36, fontWeight: 500, color: "#eab308", effect: "none", letterSpacing: 2, textTransform: "uppercase" },
  { id: "pizza-party", label: "Pizza Party", text: "PIZZA\nPARTY", fontFamily: "'Bebas Neue', sans-serif", fontSize: 46, fontWeight: 700, color: "#fb7185", effect: "neon", textTransform: "uppercase" },
  { id: "profit-plan", label: "Profit Plan", text: "Profit\nPLAN", fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 600, color: "#365314", effect: "none" },
  { id: "big-strategy", label: "Big Strategy", text: "BIG\nstrategy", fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 800, color: "#4338ca", effect: "none" },
  { id: "pixel-dreams", label: "Pixel Dreams", text: "PIXEL\nDREAMS", fontFamily: "'Press Start 2P', monospace", fontSize: 24, fontWeight: 400, color: "#c084fc", effect: "glow", textTransform: "uppercase" },
  { id: "new-product", label: "New Product", text: "NEW PRODUCT\nALERT!", fontFamily: "'Archivo Black', sans-serif", fontSize: 28, fontWeight: 900, color: "#ef4444", effect: "shadow", textTransform: "uppercase" },
  { id: "subscribe", label: "Subscribe", text: "Subscribe", fontFamily: "Poppins, sans-serif", fontSize: 26, fontWeight: 700, color: "#0f172a", effect: "none" },
]

export const STUDIO_ELEMENT_PRESETS: StudioElementPreset[] = [
  { id: "shape-square", label: "Square", kind: "shape", preset: "square", category: "Shapes", width: 120, height: 120, color: "#7c3aed" },
  { id: "shape-circle", label: "Circle", kind: "shape", preset: "circle", category: "Shapes", width: 120, height: 120, color: "#14b8a6" },
  { id: "shape-rounded", label: "Rounded", kind: "shape", preset: "rounded", category: "Shapes", width: 180, height: 110, color: "#2563eb" },
  { id: "shape-pill", label: "Pill", kind: "shape", preset: "pill", category: "Shapes", width: 210, height: 72, color: "#f59e0b" },
  { id: "shape-line", label: "Line", kind: "shape", preset: "line", category: "Shapes", width: 260, height: 4, color: "#475569" },
  { id: "shape-triangle", label: "Triangle", kind: "shape", preset: "triangle", category: "Shapes", width: 120, height: 110, color: "#06b6d4" },
  { id: "shape-star", label: "Star", kind: "shape", preset: "star", category: "Shapes", width: 130, height: 130, color: "#eab308" },
  { id: "shape-diamond", label: "Diamond", kind: "shape", preset: "diamond", category: "Shapes", width: 100, height: 100, color: "#ec4899" },

  { id: "frame-square", label: "Square frame", kind: "frame", preset: "square-frame", category: "Frames", width: 220, height: 220, color: "#7c3aed" },
  { id: "frame-rounded", label: "Rounded frame", kind: "frame", preset: "rounded-frame", category: "Frames", width: 260, height: 180, color: "#0ea5e9" },
  { id: "frame-circle", label: "Circle frame", kind: "frame", preset: "circle-frame", category: "Frames", width: 220, height: 220, color: "#10b981" },
  { id: "frame-arch", label: "Arch frame", kind: "frame", preset: "arch-frame", category: "Frames", width: 220, height: 300, color: "#f59e0b" },
  { id: "frame-phone", label: "Phone frame", kind: "frame", preset: "phone-frame", category: "Frames", width: 190, height: 360, color: "#111827" },

  { id: "graphic-star", label: "Star icon", kind: "graphic", preset: "star", category: "Graphics", width: 100, height: 100, color: "#f59e0b" },
  { id: "graphic-sparkle", label: "Sparkle", kind: "graphic", preset: "sparkle", category: "Graphics", width: 100, height: 100, color: "#7c3aed" },
  { id: "graphic-heart", label: "Heart", kind: "graphic", preset: "heart", category: "Graphics", width: 100, height: 100, color: "#ef4444" },
  { id: "graphic-check", label: "Check", kind: "graphic", preset: "check", category: "Graphics", width: 100, height: 100, color: "#16a34a" },
  { id: "graphic-arrow", label: "Arrow", kind: "graphic", preset: "arrow", category: "Graphics", width: 140, height: 80, color: "#0284c7" },
  { id: "graphic-burst", label: "Burst", kind: "graphic", preset: "burst", category: "Graphics", width: 100, height: 100, color: "#f97316" },
  { id: "graphic-number", label: "Number badge", kind: "graphic", preset: "number", category: "Graphics", width: 110, height: 110, color: "#10b981" },

  { id: "form-contact", label: "Contact form", kind: "form", preset: "contact", category: "Forms", width: 360, height: 280, color: "#2563eb" },
  { id: "form-checklist", label: "Checklist", kind: "form", preset: "checklist", category: "Forms", width: 320, height: 220, color: "#7c3aed" },
  { id: "table-basic", label: "Data table", kind: "table", preset: "basic", category: "Tables", width: 440, height: 180, color: "#334155" },
  { id: "chart-bars", label: "Bar chart", kind: "chart", preset: "bars", category: "Charts", width: 360, height: 220, color: "#7c3aed" },
  { id: "mockup-phone", label: "Phone mockup", kind: "mockup", preset: "phone", category: "Mockups", width: 210, height: 390, color: "#111827" },
  { id: "mockup-laptop", label: "Laptop mockup", kind: "mockup", preset: "laptop", category: "Mockups", width: 420, height: 260, color: "#111827" },
  { id: "mockup-card", label: "Card mockup", kind: "mockup", preset: "card", category: "Mockups", width: 340, height: 210, color: "#7c3aed" },
  { id: "3d-orb", label: "3D orb", kind: "threeD", preset: "orb", category: "3D", width: 180, height: 180, color: "#7c3aed" },
  { id: "3d-card", label: "3D gradient card", kind: "threeD", preset: "card", category: "3D", width: 280, height: 180, color: "#7c3aed" },
]

export const STUDIO_BACKGROUND_PRESETS: StudioBackgroundPreset[] = [
  { id: "bg-sunset", label: "Sunset glow", css: "linear-gradient(135deg,#fb7185,#f97316,#facc15)" },
  { id: "bg-ocean", label: "Ocean glass", css: "linear-gradient(135deg,#0ea5e9,#14b8a6,#67e8f9)" },
  { id: "bg-royal", label: "Royal fusion", css: "linear-gradient(135deg,#312e81,#7c3aed,#c026d3)" },
  { id: "bg-night", label: "Night spotlight", css: "radial-gradient(circle at 50% 20%,#334155,#0f172a 58%,#020617)" },
  { id: "bg-mint", label: "Mint wash", css: "linear-gradient(135deg,#ecfdf5,#a7f3d0,#67e8f9)" },
  { id: "bg-cream", label: "Warm paper", css: "linear-gradient(135deg,#fff7ed,#fef3c7,#fce7f3)" },
  { id: "bg-grid", label: "Soft grid", css: "linear-gradient(90deg,#f1f5f9 1px,transparent 1px),linear-gradient(#f1f5f9 1px,transparent 1px)" },
  { id: "bg-neon", label: "Neon wall", css: "linear-gradient(135deg,#111827,#581c87,#0e7490)" },
]

export const STUDIO_ELEMENT_CATEGORIES = [
  "Shapes",
  "Frames",
  "Graphics",
  "Forms",
  "Tables",
  "Charts",
  "Mockups",
  "3D",
] as const

export function sizeToPixels(value: number, unit: StudioUnit) {
  if (unit === "in") return Math.round(value * 96)
  if (unit === "cm") return Math.round((value / 2.54) * 96)
  return Math.round(value)
}

export function formatStudioSize(preset: Pick<StudioSizePreset, "width" | "height" | "unit">) {
  return `${preset.width} × ${preset.height}${preset.unit}`
}
