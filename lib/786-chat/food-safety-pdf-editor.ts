import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib"

export type FoodSafetyBookDetails = {
  businessName: string
  addressLine1: string
  addressLine2: string
  telephone: string
  approvedBy: string
  haccpCompletedBy: string
  consultant: string
  director: string
  preparationStaff: string
  storageStaff: string
  assessmentDate: string
  reviewDate: string
  firstMonday: string
  products: string[]
  ingredients: string
  allergens: string
  heatTreatmentTarget: string
  coolingTarget: string
  coldRoomTarget: string
  frozenStorageTarget: string
  documentName: string
}

export const DEFAULT_FOOD_SAFETY_DETAILS: FoodSafetyBookDetails = {
  businessName: "Raja Catering",
  addressLine1: "Rear of 297 Green Street",
  addressLine2: "London: E13 9AR",
  telephone: "0800 4714 726",
  approvedBy: "Mujeeb Sardar",
  haccpCompletedBy: "Shamraiz Khan",
  consultant: "MUJEEB SARDAR",
  director: "RAJA MUHAMMAD TAYYAB",
  preparationStaff: "SHAMRAIZ",
  storageStaff: "SONBAR",
  assessmentDate: "29/08/2026",
  reviewDate: "29/08/2027",
  firstMonday: "24/08/2026",
  products: [
    "Malai Kulfi",
    "Mango Kulfi",
    "Pista Kulfi",
    "Pav Bhaji",
    "Wada Pav",
    "Vegetable Samosa",
    "Aloo Tikki",
    "Meat Kebab Roll",
    "Onion Bhaji",
  ],
  ingredients: "Milk, Cream, Sugar, Condensed Milk, Almond, Nuts",
  allergens: "Milk, Nuts",
  heatTreatmentTarget: "85°C or above",
  coolingTarget: "Below 8°C",
  coldRoomTarget: "+2°C to +5°C",
  frozenStorageTarget: "-18°C",
  documentName: "Production & Food Safety Record Book",
}

const WHITE = rgb(1, 1, 1)
const CREAM = rgb(0.984, 0.963, 0.902)
const DARK_GREEN = rgb(0.03, 0.31, 0.22)
const TEXT_GREEN = rgb(0.02, 0.28, 0.20)
const GOLD = rgb(0.92, 0.66, 0.10)
const BLACK = rgb(0.08, 0.10, 0.10)

type TopBox = { x: number; y: number; width: number; height: number }
type PaintOptions = {
  fill?: RGB
  color?: RGB
  font?: PDFFont
  size?: number
  minSize?: number
  padding?: number
  align?: "left" | "center" | "right"
}

function topBox(page: PDFPage, box: TopBox) {
  const { height } = page.getSize()
  return { x: box.x, y: height - box.y - box.height, width: box.width, height: box.height }
}

function fitSize(font: PDFFont, text: string, maxWidth: number, initial: number, minimum = 5) {
  let size = initial
  while (size > minimum && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.5
  return Math.max(size, minimum)
}

function paintText(page: PDFPage, box: TopBox, text: string, options: PaintOptions) {
  const font = options.font!
  const padding = options.padding ?? 2
  const rect = topBox(page, box)
  page.drawRectangle({ ...rect, color: options.fill ?? WHITE })
  const size = fitSize(font, text, rect.width - padding * 2, options.size ?? 10, options.minSize ?? 5)
  const textWidth = font.widthOfTextAtSize(text, size)
  let x = rect.x + padding
  if (options.align === "center") x = rect.x + Math.max(padding, (rect.width - textWidth) / 2)
  if (options.align === "right") x = rect.x + rect.width - textWidth - padding
  const y = rect.y + Math.max(1, (rect.height - size) / 2 + 1.2)
  page.drawText(text, { x, y, size, font, color: options.color ?? BLACK })
}

function paintMultiline(page: PDFPage, box: TopBox, lines: string[], options: PaintOptions) {
  const font = options.font!
  const rect = topBox(page, box)
  page.drawRectangle({ ...rect, color: options.fill ?? WHITE })
  const pad = options.padding ?? 2
  const initial = options.size ?? 9
  const lineHeight = initial + 1.5
  lines.slice(0, 3).forEach((line, index) => {
    const size = fitSize(font, line, rect.width - pad * 2, initial, options.minSize ?? 5)
    const y = rect.y + rect.height - pad - size - index * lineHeight
    page.drawText(line, { x: rect.x + pad, y, size, font, color: options.color ?? BLACK })
  })
}

function normalizeDate(value: string) {
  const trimmed = value.trim()
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-")
    return `${day}/${month}/${year}`
  }
  return trimmed
}

function parseDate(value: string) {
  const normalized = normalizeDate(value)
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(normalized)
  if (!match) return null
  return new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])))
}

function formatDate(date: Date) {
  const day = String(date.getUTCDate()).padStart(2, "0")
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  return `${day}/${month}/${date.getUTCFullYear()}`
}

function changed<K extends keyof FoodSafetyBookDetails>(details: FoodSafetyBookDetails, key: K) {
  return JSON.stringify(details[key]) !== JSON.stringify(DEFAULT_FOOD_SAFETY_DETAILS[key])
}

function paintCover(page: PDFPage, details: FoodSafetyBookDetails, times: PDFFont, helv: PDFFont, bold: PDFFont) {
  if (changed(details, "businessName")) {
    // First cover the complete original RAJA CATERING wordmark area. The original
    // artwork extends farther right than the editable name field. Keep this cleanup
    // mask wide enough to remove the final old "G" while stopping before the FS logo.
    const cleanup = topBox(page, { x: 83, y: 92, width: 365, height: 43 })
    page.drawRectangle({ ...cleanup, color: CREAM })

    // Keep the replacement customer name in a smaller safe area so it never runs
    // underneath the FS Food & Safety logo. Long names auto-shrink inside this box.
    paintText(page, { x: 91, y: 95, width: 292, height: 37 }, details.businessName.toUpperCase(), {
      fill: CREAM,
      color: TEXT_GREEN,
      font: times,
      size: 22,
      minSize: 8,
      align: "center",
      padding: 6,
    })
  }
  if (changed(details, "approvedBy")) {
    paintText(page, { x: 212, y: 759, width: 172, height: 18 }, `Approved By: ${details.approvedBy}`, {
      fill: CREAM, color: TEXT_GREEN, font: helv, size: 8.5, minSize: 5.5, align: "center",
    })
  }
  if (changed(details, "telephone")) {
    paintText(page, { x: 193, y: 805, width: 211, height: 29 }, details.telephone, {
      fill: DARK_GREEN, color: GOLD, font: bold, size: 22, minSize: 10, align: "center",
    })
  }
}

function paintTeamPage(page: PDFPage, details: FoodSafetyBookDetails, times: PDFFont) {
  if (changed(details, "businessName")) {
    paintText(page, { x: 218, y: 81, width: 160, height: 25 }, details.businessName.toUpperCase(), {
      fill: WHITE, color: TEXT_GREEN, font: times, size: 12, minSize: 7, align: "center",
    })
  }
  if (changed(details, "consultant")) {
    paintText(page, { x: 204, y: 228, width: 188, height: 32 }, details.consultant.toUpperCase(), {
      fill: CREAM, color: TEXT_GREEN, font: times, size: 17, minSize: 8, align: "center",
    })
  }
  if (changed(details, "director")) {
    paintText(page, { x: 170, y: 418, width: 255, height: 32 }, details.director.toUpperCase(), {
      fill: CREAM, color: TEXT_GREEN, font: times, size: 15, minSize: 7, align: "center",
    })
  }
  if (changed(details, "preparationStaff")) {
    paintText(page, { x: 83, y: 624, width: 130, height: 31 }, details.preparationStaff.toUpperCase(), {
      fill: CREAM, color: TEXT_GREEN, font: times, size: 14, minSize: 7, align: "center",
    })
  }
  if (changed(details, "storageStaff")) {
    paintText(page, { x: 365, y: 624, width: 130, height: 31 }, details.storageStaff.toUpperCase(), {
      fill: CREAM, color: TEXT_GREEN, font: times, size: 14, minSize: 7, align: "center",
    })
  }
}

function paintHaccpPages(pages: PDFPage[], details: FoodSafetyBookDetails, helv: PDFFont, bold: PDFFont) {
  for (let pageNumber = 3; pageNumber <= 12; pageNumber += 1) {
    const page = pages[pageNumber - 1]
    const compact = pageNumber >= 5
    const yHeader = compact ? 37 : 46
    if (changed(details, "businessName")) {
      paintText(page, { x: 44, y: yHeader, width: 105, height: 25 }, details.businessName.toUpperCase(), {
        fill: DARK_GREEN, color: WHITE, font: bold, size: 10.5, minSize: 6, align: "left", padding: 4,
      })
    }
    if (changed(details, "addressLine1") || changed(details, "addressLine2")) {
      paintMultiline(page, { x: 540, y: compact ? 37 : 46, width: 190, height: 35 }, [details.addressLine1, details.addressLine2], {
        fill: CREAM, color: BLACK, font: bold, size: 8, minSize: 5, padding: 3,
      })
    }
    if (changed(details, "haccpCompletedBy")) {
      paintText(page, { x: compact ? 345 : 333, y: compact ? 98 : 117, width: 105, height: 18 }, details.haccpCompletedBy, {
        fill: WHITE, color: BLACK, font: helv, size: 7.7, minSize: 5,
      })
    }
    if (changed(details, "approvedBy")) {
      paintText(page, { x: 570, y: compact ? 98 : 117, width: 105, height: 18 }, details.approvedBy, {
        fill: WHITE, color: BLACK, font: helv, size: 7.7, minSize: 5,
      })
      paintText(page, { x: 98, y: pageNumber === 4 ? 537 : pageNumber === 11 ? 551 : compact ? 510 : 515, width: 90, height: 17 }, details.approvedBy, {
        fill: CREAM, color: BLACK, font: bold, size: 7.2, minSize: 5,
      })
    }
    if (changed(details, "telephone")) {
      const footerY = pageNumber === 4 ? 537 : pageNumber === 11 ? 551 : compact ? 510 : 515
      paintText(page, { x: 251, y: footerY, width: 74, height: 17 }, details.telephone, {
        fill: CREAM, color: BLACK, font: bold, size: 7.2, minSize: 4.7, align: "center",
      })
    }
    if (changed(details, "assessmentDate")) {
      paintText(page, { x: compact ? 122 : 118, y: compact ? (pageNumber === 11 ? 122 : 130) : 151, width: 88, height: 18 }, normalizeDate(details.assessmentDate), {
        fill: WHITE, color: BLACK, font: helv, size: 7.5, minSize: 5,
      })
    }
    if (changed(details, "reviewDate")) {
      paintText(page, { x: compact ? 306 : 292, y: compact ? (pageNumber === 11 ? 122 : 130) : 151, width: 86, height: 18 }, normalizeDate(details.reviewDate), {
        fill: WHITE, color: BLACK, font: helv, size: 7.5, minSize: 5,
      })
    }
    if (changed(details, "documentName")) {
      paintText(page, { x: compact ? 507 : 472, y: compact ? (pageNumber === 11 ? 75 : 80) : 94, width: 150, height: 18 }, details.documentName, {
        fill: CREAM, color: BLACK, font: helv, size: 7.2, minSize: 4.5,
      })
    }
  }

  if (changed(details, "heatTreatmentTarget")) {
    paintText(pages[4], { x: 484, y: 479, width: 90, height: 18 }, details.heatTreatmentTarget, { fill: WHITE, color: BLACK, font: bold, size: 7.5, minSize: 5 })
    paintText(pages[6], { x: 608, y: 429, width: 95, height: 18 }, details.heatTreatmentTarget, { fill: WHITE, color: BLACK, font: bold, size: 7.5, minSize: 5 })
  }
  if (changed(details, "coldRoomTarget")) {
    paintText(pages[8], { x: 397, y: 512, width: 90, height: 20 }, details.coldRoomTarget, { fill: CREAM, color: BLACK, font: bold, size: 7.5, minSize: 5 })
  }
  if (changed(details, "frozenStorageTarget")) {
    paintText(pages[8], { x: 178, y: 512, width: 55, height: 20 }, details.frozenStorageTarget, { fill: CREAM, color: BLACK, font: bold, size: 7.5, minSize: 5, align: "center" })
  }
}

const DAILY_PRODUCT_BOXES: TopBox[] = [
  { x: 109, y: 179, width: 92, height: 18 },
  { x: 255, y: 179, width: 104, height: 18 },
  { x: 405, y: 179, width: 108, height: 18 },
  { x: 52, y: 256, width: 112, height: 17 },
  { x: 225, y: 256, width: 115, height: 17 },
  { x: 399, y: 256, width: 135, height: 17 },
  { x: 52, y: 290, width: 112, height: 17 },
  { x: 225, y: 290, width: 125, height: 17 },
  { x: 399, y: 290, width: 128, height: 17 },
]

const ALLERGEN_MATRIX_PRODUCT_BOXES: TopBox[] = [
  { x: 28, y: 267, width: 78, height: 17 },
  { x: 28, y: 301, width: 78, height: 17 },
  { x: 28, y: 335, width: 78, height: 17 },
  { x: 28, y: 165, width: 90, height: 17 },
  { x: 28, y: 199, width: 90, height: 17 },
  { x: 28, y: 233, width: 110, height: 17 },
  { x: 28, y: 369, width: 90, height: 17 },
  { x: 28, y: 403, width: 105, height: 17 },
  { x: 28, y: 437, width: 90, height: 17 },
]

function paintAllergenMatrix(page: PDFPage, details: FoodSafetyBookDetails, helv: PDFFont, bold: PDFFont) {
  if (changed(details, "businessName")) {
    paintText(page, { x: 27, y: 40, width: 105, height: 22 }, details.businessName.toUpperCase(), { fill: WHITE, color: TEXT_GREEN, font: bold, size: 9.5, minSize: 5.5 })
  }
  if (changed(details, "products")) {
    details.products.slice(0, 9).forEach((product, index) => {
      paintText(page, ALLERGEN_MATRIX_PRODUCT_BOXES[index], product, { fill: WHITE, color: BLACK, font: helv, size: 7.2, minSize: 4.3 })
    })
  }
  if (changed(details, "allergens")) {
    paintText(page, { x: 119, y: 469, width: 85, height: 20 }, details.allergens, { fill: WHITE, color: BLACK, font: helv, size: 7.2, minSize: 4.5 })
  }
}

function paintDailyPages(pages: PDFPage[], details: FoodSafetyBookDetails, helv: PDFFont, bold: PDFFont) {
  const start = parseDate(details.firstMonday)
  for (let pageNumber = 15; pageNumber <= 196; pageNumber += 1) {
    const page = pages[pageNumber - 1]
    if (changed(details, "businessName")) {
      paintText(page, { x: 28, y: 7, width: 105, height: 18 }, details.businessName.toUpperCase(), { fill: WHITE, color: TEXT_GREEN, font: bold, size: 7.3, minSize: 4.5 })
    }
    if (changed(details, "products")) {
      details.products.slice(0, 9).forEach((product, index) => {
        paintText(page, DAILY_PRODUCT_BOXES[index], product, { fill: WHITE, color: BLACK, font: helv, size: 6.8, minSize: 4.3 })
      })
    }
    if (changed(details, "ingredients")) {
      paintText(page, { x: 105, y: 202, width: 355, height: 18 }, details.ingredients, { fill: WHITE, color: BLACK, font: helv, size: 7.1, minSize: 4.4 })
    }
    if (changed(details, "allergens")) {
      paintText(page, { x: 101, y: 229, width: 175, height: 18 }, details.allergens, { fill: WHITE, color: BLACK, font: helv, size: 7.1, minSize: 4.5 })
    }
    if (changed(details, "heatTreatmentTarget")) {
      paintText(page, { x: 503, y: 408, width: 61, height: 17 }, details.heatTreatmentTarget.toUpperCase(), { fill: WHITE, color: BLACK, font: bold, size: 6.3, minSize: 4.2, align: "center" })
    }
    if (changed(details, "coolingTarget")) {
      const coolingText = details.coolingTarget
      paintText(page, { x: 397, y: 479, width: 55, height: 16 }, coolingText, { fill: WHITE, color: BLACK, font: bold, size: 5.8, minSize: 3.8, align: "center" })
      paintText(page, { x: 486, y: 502, width: 55, height: 15 }, coolingText, { fill: WHITE, color: BLACK, font: helv, size: 5.3, minSize: 3.6, align: "center" })
      paintText(page, { x: 35, y: 526, width: 55, height: 15 }, coolingText, { fill: WHITE, color: BLACK, font: helv, size: 5.3, minSize: 3.6, align: "center" })
    }
    if (changed(details, "coldRoomTarget")) {
      paintText(page, { x: 393, y: 551, width: 78, height: 15 }, details.coldRoomTarget, { fill: WHITE, color: BLACK, font: bold, size: 5.5, minSize: 3.8, align: "center" })
    }
    if (changed(details, "frozenStorageTarget")) {
      paintText(page, { x: 507, y: 720, width: 57, height: 17 }, `TARGET: ${details.frozenStorageTarget}`, { fill: WHITE, color: BLACK, font: bold, size: 5.8, minSize: 3.8, align: "center" })
    }
    if (start && changed(details, "firstMonday")) {
      const date = new Date(start.getTime() + (pageNumber - 15) * 86400000)
      const dateText = formatDate(date)
      const boxes: TopBox[] = [
        { x: 522, y: 8, width: 48, height: 14 },
        { x: 493, y: 45, width: 70, height: 19 },
        { x: 98, y: 113, width: 50, height: 15 },
        { x: 58, y: 812, width: 65, height: 14 },
        { x: 62, y: 824, width: 65, height: 15 },
      ]
      boxes.forEach((box, index) => paintText(page, box, dateText, {
        fill: WHITE,
        color: BLACK,
        font: index === 1 ? bold : helv,
        size: index === 1 ? 8.5 : 6.1,
        minSize: 4.4,
        align: "center",
      }))
    }
  }
}

function paintFinalPage(page: PDFPage, details: FoodSafetyBookDetails, helv: PDFFont, bold: PDFFont, times: PDFFont) {
  if (changed(details, "businessName")) {
    paintText(page, { x: 214, y: 79, width: 170, height: 29 }, details.businessName.toUpperCase(), { fill: CREAM, color: TEXT_GREEN, font: times, size: 15, minSize: 8, align: "center" })
  }
  if (changed(details, "approvedBy")) {
    paintText(page, { x: 222, y: 733, width: 175, height: 18 }, `Approved By: ${details.approvedBy}`, { fill: CREAM, color: TEXT_GREEN, font: helv, size: 8.2, minSize: 5.2, align: "center" })
  }
  if (changed(details, "telephone")) {
    paintText(page, { x: 184, y: 798, width: 230, height: 33 }, details.telephone, { fill: CREAM, color: TEXT_GREEN, font: times, size: 21, minSize: 10, align: "center" })
  }
  if (changed(details, "heatTreatmentTarget")) {
    paintText(page, { x: 275, y: 354, width: 95, height: 20 }, details.heatTreatmentTarget, { fill: CREAM, color: rgb(0.80,0.18,0.05), font: bold, size: 8.2, minSize: 5.2, align: "center" })
  }
  if (changed(details, "coolingTarget")) {
    paintText(page, { x: 420, y: 354, width: 85, height: 20 }, details.coolingTarget, { fill: CREAM, color: rgb(0.05,0.25,0.55), font: bold, size: 8.2, minSize: 5.2, align: "center" })
  }
  if (changed(details, "coldRoomTarget")) {
    paintText(page, { x: 137, y: 433, width: 90, height: 20 }, details.coldRoomTarget, { fill: CREAM, color: rgb(0.28,0.18,0.55), font: bold, size: 8.2, minSize: 5.2, align: "center" })
  }
  if (changed(details, "frozenStorageTarget")) {
    paintText(page, { x: 330, y: 433, width: 80, height: 20 }, details.frozenStorageTarget, { fill: CREAM, color: rgb(0.05,0.25,0.55), font: bold, size: 8.2, minSize: 5.2, align: "center" })
  }
}

function ensureSingleHaccpPageNumbers(pages: PDFPage[], helv: PDFFont) {
  for (let pageNumber = 3; pageNumber <= 12; pageNumber += 1) {
    const page = pages[pageNumber - 1]
    paintText(page, { x: 804, y: 558, width: 26, height: 20 }, String(pageNumber), {
      fill: WHITE, color: TEXT_GREEN, font: helv, size: 9, minSize: 8, align: "right", padding: 2,
    })
  }
}

export async function applyFoodSafetyBookDetails(master: Blob, details: FoodSafetyBookDetails) {
  const bytes = new Uint8Array(await master.arrayBuffer())
  const document = await PDFDocument.load(bytes, { ignoreEncryption: true })
  const pages = document.getPages()
  if (pages.length !== 197) throw new Error(`Expected the approved 197-page PDF, but found ${pages.length} pages.`)

  const helv = await document.embedFont(StandardFonts.Helvetica)
  const bold = await document.embedFont(StandardFonts.HelveticaBold)
  const times = await document.embedFont(StandardFonts.TimesRomanBold)

  paintCover(pages[0], details, times, helv, bold)
  paintTeamPage(pages[1], details, times)
  paintHaccpPages(pages, details, helv, bold)
  paintAllergenMatrix(pages[12], details, helv, bold)
  paintDailyPages(pages, details, helv, bold)
  paintFinalPage(pages[196], details, helv, bold, times)
  ensureSingleHaccpPageNumbers(pages, helv)

  const output = await document.save({ useObjectStreams: true })
  return new Blob([output], { type: "application/pdf" })
}
