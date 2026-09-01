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
const DAILY_BLUE = rgb(47 / 255, 110 / 255, 165 / 255)

type TopBox = { x: number; y: number; width: number; height: number }
type PaintOptions = {
  // Kept on call sites only as a visual reference for the approved artwork.
  // Text-only stamping deliberately never paints fills, borders, or replacement boxes.
  fill?: RGB
  color?: RGB
  font: PDFFont
  size?: number
  minSize?: number
  padding?: number
  align?: "left" | "center" | "right"
  inset?: number
}

function topBox(page: PDFPage, box: TopBox) {
  const { height } = page.getSize()
  return { x: box.x, y: height - box.y - box.height, width: box.width, height: box.height }
}

function insetBox(box: TopBox, inset: number): TopBox {
  const amount = Math.max(0, Math.min(inset, box.width / 4, box.height / 4))
  return {
    x: box.x + amount,
    y: box.y + amount,
    width: Math.max(1, box.width - amount * 2),
    height: Math.max(1, box.height - amount * 2),
  }
}

function fitSize(
  font: PDFFont,
  text: string,
  maxWidth: number,
  initial: number,
  minimum = 5,
  maxHeight = Number.POSITIVE_INFINITY,
) {
  const safeWidth = Math.max(1, maxWidth)
  const safeHeight = Math.max(1.5, maxHeight)
  const preferredMinimum = Math.min(minimum, safeHeight)
  let size = Math.min(initial, safeHeight)

  while (size > preferredMinimum && font.widthOfTextAtSize(text, size) > safeWidth) size -= 0.5
  // Containment is more important than the preferred minimum: never let text cross a printed border.
  while (size > 1.5 && font.widthOfTextAtSize(text, size) > safeWidth) size -= 0.25

  return Math.max(1.5, Math.min(size, safeHeight))
}

// Text-only stamping: draw glyphs into the existing blank area of the approved PDF.
// Never draw a replacement rectangle, border, background, or fake input field.
function paintText(page: PDFPage, box: TopBox, text: string, options: PaintOptions) {
  const clean = String(text ?? "").trim()
  if (!clean) return

  const target = insetBox(box, options.inset ?? 0)
  const rect = topBox(page, target)
  const padding = Math.max(0, options.padding ?? 2)
  const innerWidth = Math.max(1, rect.width - padding * 2)
  const innerHeight = Math.max(1.5, rect.height - padding * 2)
  const size = fitSize(
    options.font,
    clean,
    innerWidth,
    options.size ?? 10,
    options.minSize ?? 5,
    Math.max(1.5, innerHeight - 0.5),
  )

  const textWidth = options.font.widthOfTextAtSize(clean, size)
  let x = rect.x + padding
  if (options.align === "center") x = rect.x + Math.max(padding, (rect.width - textWidth) / 2)
  if (options.align === "right") x = rect.x + rect.width - textWidth - padding
  const y = rect.y + padding + Math.max(0, (innerHeight - size) / 2) + 0.2
  page.drawText(clean, { x, y, size, font: options.font, color: options.color ?? BLACK })
}

function paintCellText(
  page: PDFPage,
  box: TopBox,
  text: string,
  options: Omit<PaintOptions, "inset"> & { inset?: number },
) {
  paintText(page, box, text, { ...options, inset: options.inset ?? 1.8 })
}

function paintMultiline(page: PDFPage, box: TopBox, lines: string[], options: PaintOptions) {
  const cleanLines = lines.map((line) => String(line ?? "").trim()).filter(Boolean).slice(0, 3)
  if (cleanLines.length === 0) return

  const target = insetBox(box, options.inset ?? 0)
  const rect = topBox(page, target)
  const pad = Math.max(0, options.padding ?? 2)
  const initial = options.size ?? 9
  const availableHeight = Math.max(1.5, rect.height - pad * 2)
  const lineSlot = availableHeight / cleanLines.length

  cleanLines.forEach((line, index) => {
    const size = fitSize(
      options.font,
      line,
      Math.max(1, rect.width - pad * 2),
      Math.min(initial, Math.max(1.5, lineSlot - 0.6)),
      options.minSize ?? 5,
      Math.max(1.5, lineSlot - 0.6),
    )
    const textWidth = options.font.widthOfTextAtSize(line, size)
    let x = rect.x + pad
    if (options.align === "center") x = rect.x + Math.max(pad, (rect.width - textWidth) / 2)
    if (options.align === "right") x = rect.x + rect.width - textWidth - pad
    const slotBottom = rect.y + rect.height - pad - (index + 1) * lineSlot
    const y = slotBottom + Math.max(0, (lineSlot - size) / 2) + 0.2
    page.drawText(line, { x, y, size, font: options.font, color: options.color ?? BLACK })
  })
}

function normalizeDate(value: string) {
  const trimmed = String(value ?? "").trim()
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
  const date = new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])))
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(date: Date) {
  const day = String(date.getUTCDate()).padStart(2, "0")
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  return `${day}/${month}/${date.getUTCFullYear()}`
}

// The form represents the values that must be stamped into the approved book.
// Default Raja Catering values are real values too; they must not be suppressed.
function hasValue<K extends keyof FoodSafetyBookDetails>(details: FoodSafetyBookDetails, key: K) {
  const value = details[key]
  if (Array.isArray(value)) return value.some((item) => String(item ?? "").trim().length > 0)
  return String(value ?? "").trim().length > 0
}

function paintCover(page: PDFPage, details: FoodSafetyBookDetails, times: PDFFont, helv: PDFFont, bold: PDFFont) {
  if (hasValue(details, "businessName")) {
    paintText(page, { x: 132, y: 94, width: 245, height: 31 }, details.businessName.toUpperCase(), {
      fill: CREAM, color: TEXT_GREEN, font: times, size: 20, minSize: 7, align: "center", padding: 4,
    })
  }
  if (hasValue(details, "approvedBy")) {
    paintText(page, { x: 212, y: 759, width: 172, height: 18 }, `Approved By: ${details.approvedBy}`, {
      fill: CREAM, color: TEXT_GREEN, font: helv, size: 8.5, minSize: 5.5, align: "center",
    })
  }
  if (hasValue(details, "telephone")) {
    paintText(page, { x: 193, y: 805, width: 211, height: 29 }, details.telephone, {
      fill: DARK_GREEN, color: GOLD, font: bold, size: 22, minSize: 10, align: "center",
    })
  }
}

function paintTeamPage(page: PDFPage, details: FoodSafetyBookDetails, times: PDFFont) {
  if (hasValue(details, "businessName")) {
    paintText(page, { x: 218, y: 81, width: 160, height: 25 }, details.businessName.toUpperCase(), {
      fill: WHITE, color: TEXT_GREEN, font: times, size: 12, minSize: 7, align: "center",
    })
  }
  if (hasValue(details, "consultant")) {
    paintCellText(page, { x: 204, y: 228, width: 188, height: 32 }, details.consultant.toUpperCase(), {
      fill: CREAM, color: TEXT_GREEN, font: times, size: 17, minSize: 8, align: "center",
    })
  }
  if (hasValue(details, "director")) {
    paintCellText(page, { x: 170, y: 418, width: 255, height: 32 }, details.director.toUpperCase(), {
      fill: CREAM, color: TEXT_GREEN, font: times, size: 15, minSize: 7, align: "center",
    })
  }
  if (hasValue(details, "preparationStaff")) {
    paintCellText(page, { x: 83, y: 624, width: 130, height: 31 }, details.preparationStaff.toUpperCase(), {
      fill: CREAM, color: TEXT_GREEN, font: times, size: 14, minSize: 7, align: "center",
    })
  }
  if (hasValue(details, "storageStaff")) {
    paintCellText(page, { x: 365, y: 624, width: 130, height: 31 }, details.storageStaff.toUpperCase(), {
      fill: CREAM, color: TEXT_GREEN, font: times, size: 14, minSize: 7, align: "center",
    })
  }
}

function paintHaccpPages(pages: PDFPage[], details: FoodSafetyBookDetails, helv: PDFFont, bold: PDFFont) {
  for (let pageNumber = 3; pageNumber <= 12; pageNumber += 1) {
    const page = pages[pageNumber - 1]
    const compact = pageNumber >= 5
    const yHeader = compact ? 37 : 46

    if (hasValue(details, "businessName")) {
      paintCellText(page, { x: 44, y: yHeader, width: 105, height: 25 }, details.businessName.toUpperCase(), {
        fill: DARK_GREEN, color: WHITE, font: bold, size: 10.5, minSize: 6, align: "left", padding: 4,
      })
    }
    if (hasValue(details, "addressLine1") || hasValue(details, "addressLine2")) {
      paintMultiline(page, { x: 540, y: compact ? 37 : 46, width: 190, height: 35 }, [details.addressLine1, details.addressLine2], {
        fill: CREAM, color: BLACK, font: bold, size: 8, minSize: 5, padding: 3, inset: 1.8,
      })
    }
    if (hasValue(details, "haccpCompletedBy")) {
      paintCellText(page, { x: compact ? 345 : 333, y: compact ? 98 : 117, width: 105, height: 18 }, details.haccpCompletedBy, {
        fill: WHITE, color: BLACK, font: helv, size: 7.7, minSize: 5,
      })
    }
    if (hasValue(details, "approvedBy")) {
      paintCellText(page, { x: 570, y: compact ? 98 : 117, width: 105, height: 18 }, details.approvedBy, {
        fill: WHITE, color: BLACK, font: helv, size: 7.7, minSize: 5,
      })
      paintText(page, { x: 98, y: pageNumber === 4 ? 537 : pageNumber === 11 ? 551 : compact ? 510 : 515, width: 90, height: 17 }, details.approvedBy, {
        fill: CREAM, color: BLACK, font: bold, size: 7.2, minSize: 5,
      })
    }
    if (hasValue(details, "telephone")) {
      const footerY = pageNumber === 4 ? 537 : pageNumber === 11 ? 551 : compact ? 510 : 515
      paintText(page, { x: 251, y: footerY, width: 74, height: 17 }, details.telephone, {
        fill: CREAM, color: BLACK, font: bold, size: 7.2, minSize: 4.7, align: "center",
      })
    }
    if (hasValue(details, "assessmentDate")) {
      paintCellText(page, { x: compact ? 122 : 118, y: compact ? (pageNumber === 11 ? 122 : 130) : 151, width: 88, height: 18 }, normalizeDate(details.assessmentDate), {
        fill: WHITE, color: BLACK, font: helv, size: 7.5, minSize: 5,
      })
    }
    if (hasValue(details, "reviewDate")) {
      paintCellText(page, { x: compact ? 306 : 292, y: compact ? (pageNumber === 11 ? 122 : 130) : 151, width: 86, height: 18 }, normalizeDate(details.reviewDate), {
        fill: WHITE, color: BLACK, font: helv, size: 7.5, minSize: 5,
      })
    }
    if (hasValue(details, "documentName")) {
      paintCellText(page, { x: compact ? 507 : 472, y: compact ? (pageNumber === 11 ? 75 : 80) : 94, width: 150, height: 18 }, details.documentName, {
        fill: CREAM, color: BLACK, font: helv, size: 7.2, minSize: 4.5,
      })
    }
  }

  if (hasValue(details, "heatTreatmentTarget")) {
    paintCellText(pages[4], { x: 484, y: 479, width: 90, height: 18 }, details.heatTreatmentTarget, {
      fill: WHITE, color: BLACK, font: bold, size: 7.5, minSize: 5,
    })
    paintCellText(pages[6], { x: 608, y: 429, width: 95, height: 18 }, details.heatTreatmentTarget, {
      fill: WHITE, color: BLACK, font: bold, size: 7.5, minSize: 5,
    })
  }
  if (hasValue(details, "coldRoomTarget")) {
    paintCellText(pages[8], { x: 397, y: 512, width: 90, height: 20 }, details.coldRoomTarget, {
      fill: CREAM, color: BLACK, font: bold, size: 7.5, minSize: 5,
    })
  }
  if (hasValue(details, "frozenStorageTarget")) {
    paintCellText(pages[8], { x: 178, y: 512, width: 55, height: 20 }, details.frozenStorageTarget, {
      fill: CREAM, color: BLACK, font: bold, size: 7.5, minSize: 5, align: "center",
    })
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
  { x: 28, y: 165, width: 110, height: 17 },
  { x: 28, y: 199, width: 110, height: 17 },
  { x: 28, y: 233, width: 110, height: 17 },
  { x: 28, y: 267, width: 110, height: 17 },
  { x: 28, y: 301, width: 110, height: 17 },
  { x: 28, y: 335, width: 110, height: 17 },
  { x: 28, y: 369, width: 110, height: 17 },
  { x: 28, y: 403, width: 110, height: 17 },
  { x: 28, y: 437, width: 110, height: 17 },
]

function paintAllergenMatrix(page: PDFPage, details: FoodSafetyBookDetails, helv: PDFFont, bold: PDFFont) {
  if (hasValue(details, "businessName")) {
    paintText(page, { x: 27, y: 40, width: 130, height: 22 }, details.businessName.toUpperCase(), {
      fill: WHITE, color: WHITE, font: bold, size: 9.5, minSize: 5.5,
    })
  }

  // Page 13 has a dedicated blank cream area at the right side of the heading.
  // Keep the original heading/artwork and stamp only the address text into that blank space.
  if (hasValue(details, "addressLine1") || hasValue(details, "addressLine2")) {
    const { width } = page.getSize()
    paintMultiline(
      page,
      { x: Math.max(590, width - 215), y: 36, width: 190, height: 32 },
      [details.addressLine1, details.addressLine2],
      { fill: CREAM, color: TEXT_GREEN, font: bold, size: 7.2, minSize: 4.8, padding: 2, align: "right", inset: 1.5 },
    )
  }

  if (hasValue(details, "products")) {
    details.products.slice(0, 9).forEach((product, index) => {
      paintCellText(page, ALLERGEN_MATRIX_PRODUCT_BOXES[index], product, {
        fill: WHITE, color: BLACK, font: helv, size: 7.2, minSize: 4.3,
      })
    })
  }

  if (hasValue(details, "allergens")) {
    paintCellText(page, { x: 119, y: 469, width: 85, height: 20 }, details.allergens, {
      fill: WHITE, color: BLACK, font: helv, size: 7.2, minSize: 4.5,
    })
  }
  if (hasValue(details, "approvedBy")) {
    paintCellText(page, { x: 50, y: 603, width: 120, height: 18 }, details.approvedBy, {
      fill: WHITE, color: BLACK, font: helv, size: 6.8, minSize: 4.5,
    })
  }
  if (hasValue(details, "telephone")) {
    paintCellText(page, { x: 205, y: 603, width: 92, height: 18 }, details.telephone, {
      fill: WHITE, color: BLACK, font: helv, size: 6.8, minSize: 4.5, align: "center",
    })
  }
}

function paintProcessFlowPage(page: PDFPage, details: FoodSafetyBookDetails, helv: PDFFont, bold: PDFFont) {
  const { width } = page.getSize()
  const rightX = Math.max(375, width - 210)

  // Page 14's yellow process-flow heading has an intentional blank area on the right.
  // Add only text in that area; do not repaint or resize the yellow banner.
  if (hasValue(details, "businessName")) {
    paintText(page, { x: rightX, y: 56, width: 180, height: 18 }, details.businessName.toUpperCase(), {
      fill: GOLD, color: WHITE, font: bold, size: 9.5, minSize: 5.5, align: "right", padding: 1.5,
    })
  }
  if (hasValue(details, "addressLine1") || hasValue(details, "addressLine2")) {
    paintMultiline(page, { x: rightX, y: 74, width: 180, height: 29 }, [details.addressLine1, details.addressLine2], {
      fill: GOLD, color: WHITE, font: helv, size: 6.7, minSize: 4.2, align: "right", padding: 1.5,
    })
  }
}

function paintDailyDates(page: PDFPage, date: Date, helv: PDFFont, bold: PDFFont) {
  const dateText = formatDate(date)
  paintText(page, { x: 531.5, y: 10.1, width: 35.5, height: 10.5 }, dateText, {
    fill: WHITE, color: BLACK, font: helv, size: 6.2, minSize: 5.2, align: "center", padding: 0.5,
  })
  paintText(page, { x: 504.5, y: 47.0, width: 49.0, height: 15.2 }, dateText, {
    fill: DAILY_BLUE, color: WHITE, font: bold, size: 9.2, minSize: 7.5, align: "center", padding: 1,
  })
  paintCellText(page, { x: 104.5, y: 114.4, width: 36.0, height: 12.0 }, dateText, {
    fill: WHITE, color: rgb(0.55, 0.61, 0.67), font: helv, size: 6.2, minSize: 5.2, align: "center", padding: 0.5, inset: 0.7,
  })
  paintText(page, { x: 70.5, y: 814.8, width: 27.0, height: 9.0 }, dateText, {
    fill: WHITE, color: rgb(0.35, 0.42, 0.48), font: helv, size: 4.8, minSize: 4.1, align: "center", padding: 0.2,
  })
  paintText(page, { x: 78.8, y: 826.7, width: 32.0, height: 9.5 }, dateText, {
    fill: WHITE, color: rgb(0.35, 0.42, 0.48), font: helv, size: 5.2, minSize: 4.3, align: "center", padding: 0.2,
  })
}

function paintDailyPages(pages: PDFPage[], details: FoodSafetyBookDetails, helv: PDFFont, bold: PDFFont) {
  const start = hasValue(details, "firstMonday") ? parseDate(details.firstMonday) : null
  if (hasValue(details, "firstMonday")) {
    if (!start) throw new Error("First Monday / 26-week Start Date must be a valid DD/MM/YYYY date.")
    if (start.getUTCDay() !== 1) throw new Error("First Monday / 26-week Start Date must be a Monday.")
  }

  for (let pageNumber = 15; pageNumber <= 196; pageNumber += 1) {
    const page = pages[pageNumber - 1]

    if (hasValue(details, "businessName")) {
      paintText(page, { x: 29, y: 9, width: 105, height: 11 }, details.businessName.toUpperCase(), {
        fill: WHITE, color: TEXT_GREEN, font: bold, size: 7.3, minSize: 4.5,
      })
    }
    if (hasValue(details, "products")) {
      details.products.slice(0, 9).forEach((product, index) => {
        paintCellText(page, DAILY_PRODUCT_BOXES[index], product, {
          fill: WHITE, color: BLACK, font: helv, size: 6.8, minSize: 4.3,
        })
      })
    }
    if (hasValue(details, "ingredients")) {
      paintCellText(page, { x: 105, y: 202, width: 355, height: 18 }, details.ingredients, {
        fill: WHITE, color: BLACK, font: helv, size: 7.1, minSize: 4.4,
      })
    }
    if (hasValue(details, "allergens")) {
      paintCellText(page, { x: 101, y: 229, width: 175, height: 18 }, details.allergens, {
        fill: WHITE, color: BLACK, font: helv, size: 7.1, minSize: 4.5,
      })
    }
    if (hasValue(details, "heatTreatmentTarget")) {
      paintCellText(page, { x: 503, y: 408, width: 61, height: 17 }, details.heatTreatmentTarget.toUpperCase(), {
        fill: WHITE, color: BLACK, font: bold, size: 6.3, minSize: 4.2, align: "center",
      })
    }
    if (hasValue(details, "coolingTarget")) {
      const coolingText = details.coolingTarget
      paintCellText(page, { x: 397, y: 479, width: 55, height: 16 }, coolingText, {
        fill: WHITE, color: BLACK, font: bold, size: 5.8, minSize: 3.8, align: "center",
      })
      paintCellText(page, { x: 486, y: 502, width: 55, height: 15 }, coolingText, {
        fill: WHITE, color: BLACK, font: helv, size: 5.3, minSize: 3.6, align: "center",
      })
      paintCellText(page, { x: 35, y: 526, width: 55, height: 15 }, coolingText, {
        fill: WHITE, color: BLACK, font: helv, size: 5.3, minSize: 3.6, align: "center",
      })
    }
    if (hasValue(details, "coldRoomTarget")) {
      paintCellText(page, { x: 393, y: 551, width: 78, height: 15 }, details.coldRoomTarget, {
        fill: WHITE, color: BLACK, font: bold, size: 5.5, minSize: 3.8, align: "center",
      })
    }
    if (hasValue(details, "frozenStorageTarget")) {
      paintCellText(page, { x: 507, y: 720, width: 57, height: 17 }, `TARGET: ${details.frozenStorageTarget}`, {
        fill: WHITE, color: BLACK, font: bold, size: 5.8, minSize: 3.8, align: "center",
      })
    }
    if (start) {
      const date = new Date(start.getTime() + (pageNumber - 15) * 86400000)
      paintDailyDates(page, date, helv, bold)
    }
  }
}

function paintFinalPage(page: PDFPage, details: FoodSafetyBookDetails, helv: PDFFont, bold: PDFFont, times: PDFFont) {
  if (hasValue(details, "businessName")) {
    paintText(page, { x: 214, y: 79, width: 170, height: 29 }, details.businessName.toUpperCase(), {
      fill: CREAM, color: TEXT_GREEN, font: times, size: 15, minSize: 8, align: "center",
    })
  }
  if (hasValue(details, "approvedBy")) {
    paintText(page, { x: 222, y: 733, width: 175, height: 18 }, `Approved By: ${details.approvedBy}`, {
      fill: CREAM, color: TEXT_GREEN, font: helv, size: 8.2, minSize: 5.2, align: "center",
    })
  }
  if (hasValue(details, "telephone")) {
    paintText(page, { x: 184, y: 798, width: 230, height: 33 }, details.telephone, {
      fill: CREAM, color: TEXT_GREEN, font: times, size: 21, minSize: 10, align: "center",
    })
  }
  if (hasValue(details, "heatTreatmentTarget")) {
    paintText(page, { x: 275, y: 354, width: 95, height: 20 }, details.heatTreatmentTarget, {
      fill: CREAM, color: rgb(0.80, 0.18, 0.05), font: bold, size: 8.2, minSize: 5.2, align: "center",
    })
  }
  if (hasValue(details, "coolingTarget")) {
    paintText(page, { x: 420, y: 354, width: 85, height: 20 }, details.coolingTarget, {
      fill: CREAM, color: rgb(0.05, 0.25, 0.55), font: bold, size: 8.2, minSize: 5.2, align: "center",
    })
  }
  if (hasValue(details, "coldRoomTarget")) {
    paintText(page, { x: 137, y: 433, width: 90, height: 20 }, details.coldRoomTarget, {
      fill: CREAM, color: rgb(0.28, 0.18, 0.55), font: bold, size: 8.2, minSize: 5.2, align: "center",
    })
  }
  if (hasValue(details, "frozenStorageTarget")) {
    paintText(page, { x: 330, y: 433, width: 80, height: 20 }, details.frozenStorageTarget, {
      fill: CREAM, color: rgb(0.05, 0.25, 0.55), font: bold, size: 8.2, minSize: 5.2, align: "center",
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
  paintProcessFlowPage(pages[13], details, helv, bold)
  paintDailyPages(pages, details, helv, bold)
  paintFinalPage(pages[196], details, helv, bold, times)

  const output = await document.save({ useObjectStreams: true })
  return new Blob([output], { type: "application/pdf" })
}
