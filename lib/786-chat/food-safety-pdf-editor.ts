import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import {
  DEFAULT_FOOD_SAFETY_DETAILS,
  applyFoodSafetyBookDetails as applyBaseFoodSafetyBookDetails,
  type FoodSafetyBookDetails,
} from "./food-safety-pdf-editor-base"

export { DEFAULT_FOOD_SAFETY_DETAILS }
export type { FoodSafetyBookDetails }

const TEXT_GREEN = rgb(0.02, 0.28, 0.20)
const GOLD = rgb(0.92, 0.66, 0.10)
const BLACK = rgb(0.08, 0.10, 0.10)
const HIDDEN_VIEWER_TITLE = "\u200B"

type TopBox = { x: number; y: number; width: number; height: number }

type StampOptions = {
  font: PDFFont
  size: number
  minSize?: number
  align?: "left" | "center" | "right"
  color?: ReturnType<typeof rgb>
}

function hasValue(value: unknown) {
  return String(value ?? "").trim().length > 0
}

function fitSize(font: PDFFont, text: string, maxWidth: number, initial: number, minimum = 4) {
  let size = initial
  while (size > minimum && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.25
  return Math.max(minimum, size)
}

// Text-only stamping: write only inside the existing blank printed lines.
// Never let text cross a printed border and never draw replacement rectangles.
function stampText(page: PDFPage, box: TopBox, text: string, options: StampOptions) {
  const clean = String(text ?? "").trim()
  if (!clean) return

  const { height } = page.getSize()
  const size = fitSize(options.font, clean, box.width - 2, options.size, options.minSize ?? 4)
  const textWidth = options.font.widthOfTextAtSize(clean, size)
  let x = box.x + 1
  if (options.align === "center") x = box.x + Math.max(1, (box.width - textWidth) / 2)
  if (options.align === "right") x = box.x + box.width - textWidth - 1
  const y = height - box.y - box.height + Math.max(1, (box.height - size) / 2)

  page.drawText(clean, { x, y, size, font: options.font, color: options.color ?? BLACK })
}

const HACCP_CONTACT_Y: Record<number, number> = {
  3: 518,
  4: 541,
  5: 513,
  6: 490,
  7: 465,
  8: 521,
  9: 547,
  10: 450,
  11: 555,
  12: 499,
}

function paintContactFooters(pages: PDFPage[], details: FoodSafetyBookDetails, helv: PDFFont, bold: PDFFont) {
  // Page 1: keep both values inside the decorative blank areas.
  // Approved By is moved down from the top edge; telephone is moved slightly lower below its heading.
  if (hasValue(details.approvedBy)) {
    stampText(pages[0], { x: 292, y: 758, width: 96, height: 18 }, details.approvedBy, {
      font: helv, size: 8.2, minSize: 5.5, align: "center", color: TEXT_GREEN,
    })
  }
  if (hasValue(details.telephone)) {
    stampText(pages[0], { x: 193, y: 798, width: 211, height: 27 }, details.telephone, {
      font: bold, size: 21, minSize: 10, align: "center", color: GOLD,
    })
  }

  // Page 2: values start on the printed lines, to the right of the labels.
  if (hasValue(details.approvedBy)) {
    stampText(pages[1], { x: 120, y: 747, width: 160, height: 14 }, details.approvedBy, {
      font: helv, size: 7.2, minSize: 5, align: "center",
    })
  }
  if (hasValue(details.telephone)) {
    stampText(pages[1], { x: 362.5, y: 747, width: 117.5, height: 14 }, details.telephone, {
      font: bold, size: 7.2, minSize: 4.8, align: "center",
    })
  }

  // Pages 3-12: the redesigned master uses the same horizontal line starts on every HACCP page.
  // Only the vertical footer position changes per page.
  for (let pageNumber = 3; pageNumber <= 12; pageNumber += 1) {
    const page = pages[pageNumber - 1]
    const y = HACCP_CONTACT_Y[pageNumber]

    if (hasValue(details.approvedBy)) {
      stampText(page, { x: 122.5, y, width: 130, height: 14 }, details.approvedBy, {
        font: helv, size: 6.8, minSize: 4.5, align: "center",
      })
    }
    if (hasValue(details.telephone)) {
      stampText(page, { x: 340.5, y, width: 107, height: 14 }, details.telephone, {
        font: bold, size: 6.3, minSize: 4.1, align: "center",
      })
    }

    // Refill the real HACCP Approved By field because the base pass intentionally suppresses
    // contact values to prevent duplicates in the footer.
    if (hasValue(details.approvedBy)) {
      const compact = pageNumber >= 5
      stampText(page, { x: 570, y: compact ? 98 : 117, width: 105, height: 18 }, details.approvedBy, {
        font: helv, size: 7.7, minSize: 5, align: "left",
      })
    }
  }

  // Page 13 allergen matrix: use the actual printed line starts.
  if (hasValue(details.approvedBy)) {
    stampText(pages[12], { x: 105.5, y: 523, width: 130, height: 14 }, details.approvedBy, {
      font: helv, size: 6.8, minSize: 4.5, align: "center",
    })
  }
  if (hasValue(details.telephone)) {
    stampText(pages[12], { x: 323.5, y: 523, width: 107, height: 14 }, details.telephone, {
      font: bold, size: 6.3, minSize: 4.1, align: "center",
    })
  }

  // Page 14 keeps its existing footer line alignment.
  if (hasValue(details.approvedBy)) {
    stampText(pages[13], { x: 105, y: 794, width: 175.3, height: 14 }, details.approvedBy, {
      font: helv, size: 7, minSize: 4.8, align: "center",
    })
  }
  if (hasValue(details.telephone)) {
    stampText(pages[13], { x: 362.3, y: 794, width: 133, height: 14 }, details.telephone, {
      font: bold, size: 7, minSize: 4.6, align: "center",
    })
  }

  // Daily pages 15-196: keep the values on the existing footer lines.
  for (let pageNumber = 15; pageNumber <= 196; pageNumber += 1) {
    const page = pages[pageNumber - 1]
    if (hasValue(details.approvedBy)) {
      stampText(page, { x: 92, y: 784, width: 153, height: 13 }, details.approvedBy, {
        font: helv, size: 7, minSize: 4.8, align: "center",
      })
    }
    if (hasValue(details.telephone)) {
      stampText(page, { x: 343, y: 784, width: 162, height: 13 }, details.telephone, {
        font: bold, size: 7, minSize: 4.6, align: "center",
      })
    }
  }

  // Page 197 is intentionally excluded.
}

export async function applyFoodSafetyBookDetails(master: Blob, details: FoodSafetyBookDetails) {
  // The base implementation fills every other PDF field. Contact values are blanked for that pass
  // so Approved By and Telephone can be stamped exactly once at the corrected coordinates below.
  const baseDetails: FoodSafetyBookDetails = {
    ...details,
    approvedBy: "",
    telephone: "",
  }

  const baseBlob = await applyBaseFoodSafetyBookDetails(master, baseDetails)
  const bytes = new Uint8Array(await baseBlob.arrayBuffer())
  const document = await PDFDocument.load(bytes, { ignoreEncryption: true })
  const pages = document.getPages()
  if (pages.length !== 197) throw new Error(`Expected the approved 197-page PDF, but found ${pages.length} pages.`)

  const helv = await document.embedFont(StandardFonts.Helvetica)
  const bold = await document.embedFont(StandardFonts.HelveticaBold)
  paintContactFooters(pages, details, helv, bold)

  // Chrome's built-in PDF viewer displays the PDF metadata Title in its top-left toolbar.
  // Keep a real title entry but make it visually empty so no master/internal name is exposed.
  document.setTitle(HIDDEN_VIEWER_TITLE)

  const output = await document.save({ useObjectStreams: true })
  return new Blob([output], { type: "application/pdf" })
}
