import { PDFFont, PDFPage, rgb, RGB } from "pdf-lib";

/**
 * Small drawing toolkit shared by the LR and box-tag renderers.
 *
 * pdf-lib works in raw PDF user space with a bottom-left origin and no text
 * layout of any kind. Everything here exists to make the document code read in
 * terms of boxes, labels and rows instead of coordinate arithmetic.
 */

// Brand palette, matching the app: navy ink, slate for secondary, orange for
// the accents a warehouse eye should land on first.
export const INK = rgb(0.043, 0.141, 0.278); // #0B2447 navy
export const MUTED = rgb(0.357, 0.42, 0.51); // #5B6B82 slate
export const LINE = rgb(0.8, 0.835, 0.878); // #CCD4E0
export const HAIRLINE = rgb(0.886, 0.902, 0.929); // #E2E6ED
export const FILL = rgb(0.961, 0.965, 0.973); // #F5F6F8 paper
export const BRAND = rgb(0.043, 0.141, 0.278); // navy — headings and rules
export const ACCENT = rgb(1, 0.353, 0.122); // #FF5A1F orange
export const WHITE = rgb(1, 1, 1);

export type Fonts = { regular: PDFFont; bold: PDFFont };

export function text(
  page: PDFPage,
  value: string,
  x: number,
  y: number,
  opts: { font: PDFFont; size: number; color?: RGB; maxWidth?: number },
) {
  const { font, size, color = INK, maxWidth } = opts;
  const safe = sanitize(value);
  const shown = maxWidth ? truncate(safe, font, size, maxWidth) : safe;
  page.drawText(shown, { x, y, size, font, color });
}

/**
 * The 14 standard PDF fonts are WinAnsi-encoded, so anything outside Latin-1
 * (₹, smart quotes, emoji pasted into an address field) throws at draw time.
 * Replace those rather than let one stray character fail a whole label.
 */
export function sanitize(value: string): string {
  return (value ?? "")
    .replace(/₹/g, "Rs.")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/→/g, "->")
    .replace(/[^\x20-\xFF]/g, "");
}

export function truncate(value: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(value, size) <= maxWidth) return value;
  let out = value;
  while (out.length > 1 && font.widthOfTextAtSize(out + "...", size) > maxWidth) {
    out = out.slice(0, -1);
  }
  return out + "...";
}

/** Greedy word wrap; falls back to hard-breaking words longer than the line. */
export function wrap(
  value: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
  maxLines = Infinity,
): string[] {
  const words = sanitize(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    if (font.widthOfTextAtSize(word, size) > maxWidth) {
      let chunk = "";
      for (const ch of word) {
        if (font.widthOfTextAtSize(chunk + ch, size) > maxWidth) {
          lines.push(chunk);
          chunk = ch;
        } else chunk += ch;
      }
      current = chunk;
    } else current = word;
    if (lines.length >= maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);

  if (lines.length > maxLines) {
    const clipped = lines.slice(0, maxLines);
    clipped[maxLines - 1] = truncate(clipped[maxLines - 1] + " ...", font, size, maxWidth);
    return clipped;
  }
  return lines;
}

export function rect(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { fill?: RGB; border?: RGB; borderWidth?: number } = {},
) {
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    color: opts.fill,
    borderColor: opts.border,
    borderWidth: opts.border ? (opts.borderWidth ?? 0.6) : 0,
  });
}

export function hline(page: PDFPage, x: number, y: number, w: number, color = HAIRLINE, thickness = 0.5) {
  page.drawLine({ start: { x, y }, end: { x: x + w, y }, color, thickness });
}

export function vline(page: PDFPage, x: number, y: number, h: number, color = HAIRLINE, thickness = 0.5) {
  page.drawLine({ start: { x, y }, end: { x, y: y + h }, color, thickness });
}

/** A titled panel: filled caption bar plus a bordered body. Returns the inner top y. */
export function panel(
  page: PDFPage,
  fonts: Fonts,
  title: string,
  x: number,
  y: number,
  w: number,
  h: number,
  captionHeight = 14,
): number {
  rect(page, x, y, w, h, { border: LINE });
  rect(page, x, y + h - captionHeight, w, captionHeight, { fill: FILL });
  hline(page, x, y + h - captionHeight, w, LINE);
  text(page, title.toUpperCase(), x + 6, y + h - captionHeight + 4.2, {
    font: fonts.bold,
    size: 7,
    color: BRAND,
    maxWidth: w - 12,
  });
  return y + h - captionHeight - 4;
}

/** `LABEL  value` on one line, label in muted small caps. Returns the next baseline. */
export function labelled(
  page: PDFPage,
  fonts: Fonts,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number,
  opts: { labelWidth?: number; size?: number } = {},
) {
  const size = opts.size ?? 7.5;
  const labelWidth = opts.labelWidth ?? 78;
  text(page, label.toUpperCase(), x, y, {
    font: fonts.bold,
    size: size - 0.8,
    color: MUTED,
    maxWidth: labelWidth - 4,
  });
  text(page, value || "-", x + labelWidth, y, {
    font: fonts.regular,
    size,
    color: INK,
    maxWidth: w - labelWidth,
  });
  return y - (size + 3.4);
}

/** Stacked label above value — used where the value needs the full column width. */
export function stacked(
  page: PDFPage,
  fonts: Fonts,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number,
  size = 8,
) {
  text(page, label.toUpperCase(), x, y, { font: fonts.bold, size: 5.8, color: MUTED, maxWidth: w });
  text(page, value || "-", x, y - (size + 1.5), {
    font: fonts.regular,
    size,
    color: INK,
    maxWidth: w,
  });
  return y - (size + 1.5) - (size + 3);
}

/** Empty square for a manual tick on the printed POD. */
export function checkbox(page: PDFPage, fonts: Fonts, label: string, x: number, y: number, w: number) {
  const box = 7;
  rect(page, x, y - 1, box, box, { border: LINE, borderWidth: 0.7 });
  text(page, label, x + box + 4, y + 0.6, {
    font: fonts.regular,
    size: 6.5,
    color: INK,
    maxWidth: w - box - 6,
  });
}

/** Dotted rule for handwritten entries (signature, date, employee id). */
export function signatureLine(
  page: PDFPage,
  fonts: Fonts,
  label: string,
  x: number,
  y: number,
  w: number,
) {
  hline(page, x, y, w, LINE, 0.7);
  text(page, label.toUpperCase(), x, y - 8, { font: fonts.bold, size: 5.8, color: MUTED, maxWidth: w });
}
