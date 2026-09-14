// @ts-nocheck
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';

export interface DateUpdateData {
  newDate: string;
  reportType: 'inspection' | 'coshh' | 'both';
}

const TEMPLATES_DIR = path.join(process.cwd(), 'server', 'templates');
const FONTS_DIR = path.join(TEMPLATES_DIR, 'fonts');

/**
 * Places the new date text at exact x,y coordinates in PDF points.
 * 1. Covers the old date with a white rectangle ("wash")
 * 2. Writes new date in handwriting font on top
 * x,y are in PDF coordinate space (bottom-left origin).
 */
function hexToRgbPdf(hex: string): ReturnType<typeof rgb> {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return rgb(
    isNaN(r) ? 0.05 : r,
    isNaN(g) ? 0.1 : g,
    isNaN(b) ? 0.45 : b,
  );
}

interface TextItem {
  text: string;
  pdfX: number;
  pdfY: number;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: string;
  fontBold?: boolean;
  pageIndex?: number; // 1 = page 1 only, 2 = page 2 only, undefined = all pages
}

export async function updateDateOnPdf(
  pdfBytes: Buffer | Uint8Array,
  newDate: string,
  reportType: string,
  options?: {
    x?: number;
    y?: number;
    fontSize?: number;
    fontFamily?: string;
    fontColor?: string;
    fontBold?: boolean;
    extraItems?: TextItem[];
  }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  pdfDoc.registerFontkit(fontkit);

  // Map fontFamily name to file candidates
  const familyMap: Record<string, string[]> = {
    BiroScript:  ['BiroScript.ttf', 'BiroScript.otf', 'BiroScriptPlus.ttf'],
    IndieFlower: ['IndieFlower-Regular.ttf'],
    PatrickHand: ['PatrickHand-Regular.ttf'],
    Kalam:       ['Kalam-Regular.ttf'],
  };

  // Helper: test whether a font can render a specific character
  function fontCanRenderChar(f: any, ch: string): boolean {
    try {
      const encoded = f.encodeText(ch);
      const hex = encoded.value as string;
      // 0000 = .notdef glyph = character not in font
      return hex !== '0000';
    } catch {
      return false;
    }
  }

  // Helper: try to embed a font from the fonts directory
  async function tryEmbedFont(fileName: string): Promise<any | null> {
    const fontPath = path.join(FONTS_DIR, fileName);
    if (!fs.existsSync(fontPath)) return null;
    try {
      return await pdfDoc.embedFont(fs.readFileSync(fontPath));
    } catch {
      return null;
    }
  }

  const requestedFamily = options?.fontFamily ?? 'IndieFlower';
  const preferredFiles = familyMap[requestedFamily] ?? familyMap['IndieFlower'];

  // Load primary font (the one the user chose, e.g. BiroScript)
  let primaryFont: any = null;
  for (const fileName of preferredFiles) {
    primaryFont = await tryEmbedFont(fileName);
    if (primaryFont) break;
  }

  // Always load IndieFlower as the digit-capable fallback
  const fallbackOrder = ['IndieFlower-Regular.ttf', 'PatrickHand-Regular.ttf', 'Kalam-Regular.ttf', 'Caveat-Regular.ttf'];
  let fallbackFont: any = null;
  for (const fileName of fallbackOrder) {
    fallbackFont = await tryEmbedFont(fileName);
    if (fallbackFont) break;
  }

  if (!fallbackFont) {
    const { StandardFonts } = await import('pdf-lib');
    fallbackFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }
  if (!primaryFont) primaryFont = fallbackFont;

  // Use primaryFont as the 'font' reference for width calculations (may be mixed)
  const font = fallbackFont; // used for white-wash width calculation (always full coverage)

  const pages = pdfDoc.getPages();
  const fontSize = options?.fontSize ?? 15;
  const textColor = options?.fontColor ? hexToRgbPdf(options.fontColor) : rgb(0.05, 0.1, 0.45);
  const bold = options?.fontBold ?? false;

  // Apply text to ALL pages — both click-to-place and auto coords mirror across all pages.
  const hasCustomCoords = options?.x !== undefined && options?.y !== undefined;
  const pagesToProcess = pages;
  console.log(`📄 PDF pages: ${pages.length}, hasCustomCoords: ${hasCustomCoords}, applying to ALL pages`);

  for (const page of pagesToProcess) {
    const { width, height } = page.getSize();

    let dateX: number;
    let dateY: number;

    if (hasCustomCoords) {
      dateX = options!.x!;
      dateY = options!.y!;
    } else {
      dateX = width * 0.74;
      dateY = height - height * 0.177;
    }
    console.log(`📐 Page size: ${width}×${height}, placing date at (${dateX.toFixed(1)}, ${dateY.toFixed(1)}), in-bounds: x=${dateX >= 0 && dateX <= width}, y=${dateY >= 0 && dateY <= height}`);

    const textWidth = fallbackFont.widthOfTextAtSize(newDate, fontSize);

    // Wash — white rectangle to erase old content
    page.drawRectangle({
      x: dateX - 1,
      y: dateY - 3,
      width: textWidth + 8,
      height: fontSize + 6,
      color: rgb(1, 1, 1),
    });

    // Mixed-font character-by-character rendering:
    // Use primaryFont (e.g. BiroScript) for characters it supports;
    // fall through to fallbackFont (IndieFlower) for digits and punctuation.
    const drawMixedText = (offsetX: number, offsetY: number) => {
      let cursorX = dateX + offsetX;
      for (const ch of newDate) {
        const useFont = fontCanRenderChar(primaryFont, ch) ? primaryFont : fallbackFont;
        const charWidth = useFont.widthOfTextAtSize(ch, fontSize);
        page.drawText(ch, { x: cursorX, y: dateY + offsetY, size: fontSize, font: useFont, color: textColor });
        cursorX += charWidth;
      }
    };

    if (bold) {
      drawMixedText(0.4, 0);
      drawMixedText(0, 0.4);
      drawMixedText(0.4, 0.4);
    }
    drawMixedText(0, 0);
  }

  // Process extra text items (contract number, etc.)
  const extraItems = options?.extraItems ?? [];
  for (const item of extraItems) {
    if (!item.text || item.pdfX === undefined || item.pdfY === undefined) continue;

    // Load fonts for this item
    const itemFamily = item.fontFamily ?? 'IndieFlower';
    const itemPreferredFiles = familyMap[itemFamily] ?? familyMap['IndieFlower'];
    let itemPrimaryFont: any = null;
    for (const fileName of itemPreferredFiles) {
      itemPrimaryFont = await tryEmbedFont(fileName);
      if (itemPrimaryFont) break;
    }
    if (!itemPrimaryFont) itemPrimaryFont = fallbackFont;

    const itemFontSize = item.fontSize ?? 15;
    const itemColor = item.fontColor ? hexToRgbPdf(item.fontColor) : rgb(0.05, 0.1, 0.45);
    const itemBold = item.fontBold ?? false;
    const itemTextWidth = fallbackFont.widthOfTextAtSize(item.text, itemFontSize);

    // Apply to specific page or all pages based on pageIndex
    const targetPages = item.pageIndex !== undefined
      ? pages.filter((_, i) => i + 1 === item.pageIndex)
      : pages;
    for (const pg of targetPages) {
      // White wash
      pg.drawRectangle({
        x: item.pdfX - 1, y: item.pdfY - 3,
        width: itemTextWidth + 8, height: itemFontSize + 6,
        color: rgb(1, 1, 1),
      });

      // Draw characters with mixed font
      const drawItemChars = (offX: number, offY: number) => {
        let curX = item.pdfX + offX;
        for (const ch of item.text) {
          const useFont = fontCanRenderChar(itemPrimaryFont, ch) ? itemPrimaryFont : fallbackFont;
          const cw = useFont.widthOfTextAtSize(ch, itemFontSize);
          pg.drawText(ch, { x: curX, y: item.pdfY + offY, size: itemFontSize, font: useFont, color: itemColor });
          curX += cw;
        }
      };
      if (itemBold) { drawItemChars(0.4, 0); drawItemChars(0, 0.4); drawItemChars(0.4, 0.4); }
      drawItemChars(0, 0);
    }
  }

  return await pdfDoc.save();
}

/**
 * Load a template PDF from the templates directory
 */
export async function loadTemplatePdf(templateType: 'inspection' | 'coshh'): Promise<Buffer> {
  const filename = templateType === 'coshh'
    ? 'coshh_template.pdf'
    : 'inspection_report_template.pdf';
  const templatePath = path.join(TEMPLATES_DIR, filename);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${filename}`);
  }
  return fs.readFileSync(templatePath);
}

export function getTemplatesList() {
  return [
    {
      id: 'inspection',
      name: 'Inspection Report',
      description: 'Monthly pest control inspection report',
      filename: 'inspection_report_template.pdf'
    },
    {
      id: 'coshh',
      name: 'COSHH / Risk Assessment',
      description: 'Chemical hazard risk assessment form',
      filename: 'coshh_template.pdf'
    }
  ];
}
