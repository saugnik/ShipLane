import { PDFDocument, PDFPage, StandardFonts } from "pdf-lib";
import { BRAND } from "@/lib/brand";
import { expandBoxes, formatAddress, partyName, type ShipmentDoc } from "@/lib/documents";
import { documentTagId } from "@/lib/docNumbers";
import { code128 } from "@/lib/pdf/barcode";
import {
  BRAND as BRAND_INK,
  Fonts,
  HAIRLINE,
  INK,
  MUTED,
  WHITE,
  hline,
  rect,
  text,
  wrap,
} from "@/lib/pdf/draw";

/**
 * Box tags — one 4in x 2in label per carton, plus a trailing tag for the
 * document envelope. Sized for a standard 4x2 thermal roll so the same file
 * prints on a label printer and on A4 sheet stock.
 */
const TAG_W = 288; // 4in
const TAG_H = 144; // 2in
const PAD = 8;

const shortDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export async function renderBoxTagsPdf(doc: ShipmentDoc): Promise<Uint8Array> {
  // One label per physical carton — a line of 50 produces 50 tags.
  const cartons = expandBoxes(doc.lrn, doc.boxes);
  const total = cartons.length;

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Box tags ${doc.lrn} — ${BRAND.name}`);
  pdf.setAuthor(BRAND.legalName);
  pdf.setSubject(`${total} carton labels for consignment ${doc.lrn}`);

  const fonts: Fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };

  const lrnStrip = await pdf.embedPng(await code128(doc.lrn, { heightMm: 5, scale: 3 }));
  const date = shortDate(doc.createdAt);
  const consigneeName = partyName(doc.consignee);
  const consigneeAddress = formatAddress(doc.consignee);
  const multiLine = doc.boxes.length > 1;

  for (const box of cartons) {
    const page = pdf.addPage([TAG_W, TAG_H]);
    const awbStrip = await pdf.embedPng(await code128(box.awb, { heightMm: 8, scale: 3 }));

    // On a multi-line manifest the packer needs to know which line a carton
    // belongs to, not just its position in the consignment.
    const lineNote = multiLine
      ? `Line ${box.lineNumber} (${box.indexInLine}/${doc.boxes[box.lineNumber - 1]?.quantity ?? "?"}) · ${box.description}`
      : box.description;

    drawTag(page, fonts, {
      heading: `BOX ${box.index} / ${total}`,
      primaryLabel: "BOX AWB",
      primaryValue: box.awb,
      primaryBarcode: awbStrip,
      lrnBarcode: lrnStrip,
      oid: doc.oid,
      lrn: doc.lrn,
      mawb: doc.mawb,
      date,
      client: doc.shipper.company,
      consigneeName,
      consigneeAddress,
      footnote: box.referenceId ? `${lineNote} · Ref: ${box.referenceId}` : lineNote,
    });
  }

  // Document envelope tag — carries the invoice, e-way bill and LR copies.
  const docPage = pdf.addPage([TAG_W, TAG_H]);
  const docId = documentTagId(doc.lrn);
  const docStrip = await pdf.embedPng(await code128(docId, { heightMm: 8, scale: 3 }));
  drawTag(docPage, fonts, {
    heading: "DOCUMENT ENVELOPE",
    primaryLabel: "DOC ID",
    primaryValue: docId,
    primaryBarcode: docStrip,
    lrnBarcode: lrnStrip,
    oid: docId,
    lrn: doc.lrn,
    mawb: doc.mawb,
    date,
    client: doc.shipper.company,
    consigneeName,
    consigneeAddress,
    footnote: "Contains invoice, e-way bill and LR copies. Do not detach.",
  });

  return pdf.save();
}

type Img = Awaited<ReturnType<PDFDocument["embedPng"]>>;

type TagContent = {
  heading: string;
  primaryLabel: string;
  primaryValue: string;
  primaryBarcode: Img;
  lrnBarcode: Img;
  oid: string;
  lrn: string;
  mawb: string;
  date: string;
  client: string;
  consigneeName: string;
  consigneeAddress: string;
  footnote: string;
};

function drawTag(page: PDFPage, fonts: Fonts, c: TagContent) {
  const innerW = TAG_W - PAD * 2;

  // Outer cut line
  rect(page, 3, 3, TAG_W - 6, TAG_H - 6, { border: HAIRLINE, borderWidth: 0.7 });

  // Header bar
  const headH = 16;
  const headY = TAG_H - 3 - headH;
  rect(page, 3, headY, TAG_W - 6, headH, { fill: BRAND_INK });
  text(page, BRAND.name.toUpperCase(), PAD, headY + 5, {
    font: fonts.bold,
    size: 8.5,
    color: WHITE,
  });
  const hw = fonts.bold.widthOfTextAtSize(c.heading, 8.5);
  text(page, c.heading, TAG_W - PAD - hw, headY + 5, { font: fonts.bold, size: 8.5, color: WHITE });

  // Primary barcode — the value a warehouse scanner reads off this carton.
  const bcY = headY - 34;
  page.drawImage(c.primaryBarcode, { x: PAD, y: bcY, width: innerW, height: 30 });
  const vw = fonts.bold.widthOfTextAtSize(c.primaryValue, 9);
  text(page, c.primaryValue, (TAG_W - vw) / 2, bcY - 9.5, { font: fonts.bold, size: 9, color: INK });
  text(page, c.primaryLabel, PAD, bcY - 9.5, { font: fonts.bold, size: 5.5, color: MUTED });
  text(page, c.date, TAG_W - PAD - fonts.regular.widthOfTextAtSize(c.date, 6), bcY - 9.5, {
    font: fonts.regular,
    size: 6,
    color: MUTED,
  });

  hline(page, PAD, bcY - 15, innerW, HAIRLINE);

  // Reference numbers row
  const refY = bcY - 25;
  const refs: Array<[string, string]> = [
    ["LRN", c.lrn],
    ["OID", c.oid],
    ["MAWB", c.mawb],
  ];
  const refColW = innerW / 3;
  refs.forEach(([label, value], i) => {
    const x = PAD + i * refColW;
    text(page, label, x, refY + 7, { font: fonts.bold, size: 5.2, color: MUTED });
    text(page, value, x, refY, {
      font: fonts.bold,
      size: 7,
      color: INK,
      maxWidth: refColW - 4,
    });
  });

  hline(page, PAD, refY - 6, innerW, HAIRLINE);

  // Consignee block — the part a driver actually reads.
  const toY = refY - 16;
  text(page, "DELIVER TO", PAD, toY, { font: fonts.bold, size: 5.2, color: MUTED });
  text(page, c.consigneeName, PAD, toY - 9, {
    font: fonts.bold,
    size: 7.5,
    color: INK,
    maxWidth: innerW - 78,
  });

  const addrLines = wrap(c.consigneeAddress, fonts.regular, 6.2, innerW - 78, 3);
  addrLines.forEach((line, i) =>
    text(page, line, PAD, toY - 18 - i * 7.2, { font: fonts.regular, size: 6.2, color: INK }),
  );

  // LRN strip bottom-right so the whole consignment can be scanned from any carton.
  const stripW = 70;
  page.drawImage(c.lrnBarcode, { x: TAG_W - PAD - stripW, y: 15, width: stripW, height: 16 });
  const sw = fonts.regular.widthOfTextAtSize(c.lrn, 5.5);
  text(page, c.lrn, TAG_W - PAD - stripW + (stripW - sw) / 2, 9, {
    font: fonts.regular,
    size: 5.5,
    color: MUTED,
  });

  // Footer: client on the left, per-box note above the LRN strip.
  text(page, `CLIENT: ${c.client}`, PAD, 9, {
    font: fonts.bold,
    size: 6,
    color: INK,
    maxWidth: innerW - stripW - 12,
  });
  text(page, c.footnote, PAD, 18, {
    font: fonts.regular,
    size: 5.8,
    color: MUTED,
    maxWidth: innerW - stripW - 12,
  });
}
