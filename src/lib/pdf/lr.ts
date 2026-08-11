import { PDFDocument, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { BRAND, LR_TERMS } from "@/lib/brand";
import {
  groupByDimension,
  partyName,
  totalBoxCount,
  type DocParty,
  type ShipmentDoc,
} from "@/lib/documents";
import { code128 } from "@/lib/pdf/barcode";
import {
  ACCENT,
  BRAND as BRAND_INK,
  FILL,
  Fonts,
  HAIRLINE,
  INK,
  LINE,
  MUTED,
  WHITE,
  checkbox,
  hline,
  labelled,
  panel,
  rect,
  signatureLine,
  stacked,
  text,
  vline,
  wrap,
} from "@/lib/pdf/draw";
import {
  DELIVERY_TYPE_LABEL,
  MOT_LABEL,
  PAYMENT_LABEL,
  PICKUP_TYPE_LABEL,
  RISK_LABEL,
} from "@/lib/utils";

/**
 * Lorry Receipt / consignment note.
 *
 * Printed as three identical copies with different endorsements, which is how
 * the physical document set works: the shipper keeps one, one travels with the
 * driver for the last-mile proof of delivery, and one is handed to the recipient.
 */
const COPIES = ["SHIPPER COPY", "LM POD", "RECIPIENT COPY"] as const;

const PAGE_W = 792;
const PAGE_H = 612;
const M = 22; // page margin
const CONTENT_W = PAGE_W - M * 2;

const money = (n: number) => `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const kg = (n: number) => `${n.toFixed(2)} kg`;

const shortDate = (d: Date | null) =>
  d
    ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "---";

export async function renderLrPdf(doc: ShipmentDoc): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`LR ${doc.lrn} — ${BRAND.name}`);
  pdf.setAuthor(BRAND.legalName);
  pdf.setSubject(`Lorry Receipt for consignment ${doc.lrn}`);
  pdf.setProducer(`${BRAND.name} document service`);

  const fonts: Fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };

  const lrnBarcode = await pdf.embedPng(await code128(doc.lrn, { heightMm: 9, scale: 3 }));
  const mawbBarcode = await pdf.embedPng(await code128(doc.mawb, { heightMm: 7, scale: 3 }));

  const printedOn = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  for (const copy of COPIES) {
    const page = pdf.addPage([PAGE_W, PAGE_H]);
    drawCopy(page, fonts, doc, copy, lrnBarcode, mawbBarcode, printedOn);
  }

  return pdf.save();
}

type Img = Awaited<ReturnType<PDFDocument["embedPng"]>>;

function drawCopy(
  page: PDFPage,
  fonts: Fonts,
  doc: ShipmentDoc,
  copy: string,
  lrnBarcode: Img,
  mawbBarcode: Img,
  printedOn: string,
) {
  let y = PAGE_H - M;

  y = drawHeader(page, fonts, doc, copy, lrnBarcode, y);
  y = drawParties(page, fonts, doc, y - 8);
  y = drawShipmentInfo(page, fonts, doc, mawbBarcode, y - 8);

  // The blocks below the box table have fixed heights, so the table absorbs
  // whatever vertical space is left over and shows as many carton sizes as fit.
  // Sizing it by content instead would leave a dead band above the POD block.
  const podBottom = M + FOOTER_H;
  const boxTableTop = y - 8;
  const boxTableBottom = podBottom + POD_H + 8 + CHARGES_H + 8;

  drawBoxTable(page, fonts, doc, boxTableTop, boxTableTop - boxTableBottom);
  drawCharges(page, fonts, doc, boxTableBottom - 8);
  drawPod(page, fonts, doc, podBottom + POD_H);
  drawFooter(page, fonts, copy, printedOn);
}

const CHARGES_H = 40;
const POD_H = 132;
const FOOTER_H = 26;

// ---------------------------------------------------------------- header

function drawHeader(
  page: PDFPage,
  fonts: Fonts,
  doc: ShipmentDoc,
  copy: string,
  lrnBarcode: Img,
  top: number,
): number {
  const h = 52;
  const y = top - h;
  rect(page, M, y, CONTENT_W, h, { border: LINE });

  // Brand mark — an orange spine down the left edge, the same signal the app uses.
  rect(page, M, y, 4, h, { fill: ACCENT });
  text(page, BRAND.name.toUpperCase(), M + 12, y + h - 20, {
    font: fonts.bold,
    size: 17,
    color: BRAND_INK,
  });
  text(page, "LORRY RECEIPT / GOODS CONSIGNMENT NOTE", M + 12, y + h - 32, {
    font: fonts.bold,
    size: 7,
    color: MUTED,
  });
  text(page, `Non-negotiable  |  ${BRAND.legalName}`, M + 12, y + h - 42, {
    font: fonts.regular,
    size: 6.5,
    color: MUTED,
  });

  // Copy endorsement badge
  const badgeW = 104;
  const badgeX = M + 250;
  rect(page, badgeX, y + h - 26, badgeW, 16, { fill: BRAND_INK });
  const badgeTextW = fonts.bold.widthOfTextAtSize(copy, 8);
  text(page, copy, badgeX + (badgeW - badgeTextW) / 2, y + h - 21.5, {
    font: fonts.bold,
    size: 8,
    color: WHITE,
  });

  // Key dates, centre-right
  const dx = badgeX + badgeW + 18;
  stacked(page, fonts, "Created date", shortDate(doc.createdAt), dx, y + h - 14, 90, 8);
  stacked(page, fonts, "Expected delivery", shortDate(doc.etaDate), dx + 96, y + h - 14, 96, 8);
  stacked(page, fonts, "Carrier", `${doc.meta.partnerName} (${doc.meta.partnerCode})`, dx, y + h - 36, 186, 8);

  // LRN barcode, right aligned
  const bcW = 150;
  const bcH = 26;
  const bcX = M + CONTENT_W - bcW - 8;
  page.drawImage(lrnBarcode, { x: bcX, y: y + h - bcH - 6, width: bcW, height: bcH });
  const lrnLabel = `LRN ${doc.lrn}`;
  const lw = fonts.bold.widthOfTextAtSize(lrnLabel, 9);
  text(page, lrnLabel, bcX + (bcW - lw) / 2, y + 7, { font: fonts.bold, size: 9, color: INK });

  return y;
}

// ---------------------------------------------------------------- parties

function drawParties(page: PDFPage, fonts: Fonts, doc: ShipmentDoc, top: number): number {
  const h = 96;
  const gap = 8;
  const w = (CONTENT_W - gap) / 2;
  const y = top - h;

  drawPartyPanel(
    page,
    fonts,
    `Shipment picked from — ${PICKUP_TYPE_LABEL[doc.meta.pickupType] ?? doc.meta.pickupType}`,
    doc.shipper,
    M,
    y,
    w,
    h,
  );
  drawPartyPanel(
    page,
    fonts,
    `Shipment delivered to — ${DELIVERY_TYPE_LABEL[doc.meta.deliveryType] ?? doc.meta.deliveryType}`,
    doc.consignee,
    M + w + gap,
    y,
    w,
    h,
  );

  return y;
}

function drawPartyPanel(
  page: PDFPage,
  fonts: Fonts,
  title: string,
  party: DocParty,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  let cy = panel(page, fonts, title, x, y, w, h);
  const px = x + 7;
  const pw = w - 14;

  text(page, partyName(party), px, cy - 6, { font: fonts.bold, size: 9.5, color: INK, maxWidth: pw });
  cy -= 18;

  // Wide enough for the longest label in this panel ("CITY / STATE") at 6.7pt.
  const LW = 56;

  cy = labelled(page, fonts, "Phone", party.phone ?? "-", px, cy, pw, { labelWidth: LW });
  cy = labelled(page, fonts, "Email", party.email ?? "-", px, cy, pw, { labelWidth: LW });

  const lines = wrap(party.address, fonts.regular, 7.5, pw - LW, 2);
  text(page, "ADDRESS", px, cy, { font: fonts.bold, size: 6.7, color: MUTED });
  lines.forEach((line, i) => {
    text(page, line, px + LW, cy - i * 9, { font: fonts.regular, size: 7.5, color: INK });
  });
  cy -= Math.max(1, lines.length) * 9 + 2;

  cy = labelled(
    page,
    fonts,
    "City / State",
    `${party.city}, ${party.state} - ${party.pincode}`,
    px,
    cy,
    pw,
    { labelWidth: LW },
  );
  labelled(page, fonts, "GSTIN", party.gstin ?? "-", px, cy, pw, { labelWidth: LW });
}

// ---------------------------------------------------------------- shipment info

function drawShipmentInfo(
  page: PDFPage,
  fonts: Fonts,
  doc: ShipmentDoc,
  mawbBarcode: Img,
  top: number,
): number {
  const h = 78;
  const y = top - h;
  const cy = panel(page, fonts, "Shipment information", M, y, CONTENT_W, h);

  const cols = 5;
  const pad = 8;
  const colW = (CONTENT_W - pad * 2 - 150) / cols; // reserve 150pt for the MAWB barcode
  const x0 = M + pad;

  const row1: Array<[string, string]> = [
    ["Shipper's ref no.", doc.oid],
    ["Mode of transport", MOT_LABEL[doc.meta.mot] ?? doc.meta.mot],
    ["Freight payment", PAYMENT_LABEL[doc.meta.freightPayment] ?? doc.meta.freightPayment],
    [
      "Invoice value payment",
      PAYMENT_LABEL[doc.meta.invoiceValuePayment] ?? doc.meta.invoiceValuePayment,
    ],
    ["Risk coverage", RISK_LABEL[doc.meta.riskType] ?? doc.meta.riskType],
  ];
  const row2: Array<[string, string]> = [
    ["Invoice no.", doc.invoice.number],
    ["E-Way Bill no.", doc.invoice.ewayBill || "Not applicable"],
    ["Total invoice value", money(doc.invoice.amount)],
    ["POD on invoice", doc.meta.podOnInvoice ? "Required" : "Not required"],
    ["Transit commitment", `${doc.price.transitDays} working day(s)`],
  ];

  row1.forEach(([label, value], i) => stacked(page, fonts, label, value, x0 + i * colW, cy - 4, colW - 6));
  row2.forEach(([label, value], i) => stacked(page, fonts, label, value, x0 + i * colW, cy - 34, colW - 6));

  // Master docket barcode on the right of the panel
  const bcX = M + CONTENT_W - 158;
  vline(page, bcX - 10, y + 6, h - 24, HAIRLINE);
  page.drawImage(mawbBarcode, { x: bcX, y: y + 26, width: 148, height: 22 });
  text(page, "MASTER AWB", bcX, y + 50, { font: fonts.bold, size: 5.8, color: MUTED });
  const mw = fonts.bold.widthOfTextAtSize(doc.mawb, 8);
  text(page, doc.mawb, bcX + (148 - mw) / 2, y + 15, { font: fonts.bold, size: 8, color: INK });

  return y;
}

// ---------------------------------------------------------------- box table

function drawBoxTable(
  page: PDFPage,
  fonts: Fonts,
  doc: ShipmentDoc,
  top: number,
  h: number,
): number {
  const headerH = 14;
  const rowH = 15;
  const totalH = 15;

  const groups = groupByDimension(doc.boxes);
  const bodyH = h - headerH - totalH;
  const capacity = Math.max(1, Math.floor(bodyH / rowH));
  // Reserve a row for the "+ N more" note whenever we cannot show everything.
  const maxRows = groups.length > capacity ? capacity - 1 : capacity;
  const shown = groups.slice(0, Math.max(1, maxRows));
  const overflow = groups.length - shown.length;

  const y = top - h;

  rect(page, M, y, CONTENT_W, h, { border: LINE });

  // Column geometry
  const cols = [
    { key: "boxes", label: "Boxes x dimension (L x W x H cm)", w: 230 },
    { key: "actual", label: "Actual weight", w: 78 },
    { key: "volumetric", label: "Volumetric weight", w: 88 },
    { key: "charged", label: "Charged weight", w: 84 },
    { key: "contents", label: "Said to contain", w: CONTENT_W - 230 - 78 - 88 - 84 },
  ];

  const headY = y + h - headerH;
  rect(page, M, headY, CONTENT_W, headerH, { fill: FILL });
  hline(page, M, headY, CONTENT_W, LINE);

  // Column rules stop at the totals band so they do not cut through it.
  const bodyTop = y + totalH;
  let cx = M;
  for (const col of cols) {
    text(page, col.label.toUpperCase(), cx + 6, headY + 4.4, {
      font: fonts.bold,
      size: 6.2,
      color: BRAND_INK,
      maxWidth: col.w - 10,
    });
    if (cx > M) vline(page, cx, bodyTop, h - totalH, HAIRLINE);
    cx += col.w;
  }

  // Weights and contents span all rows, so they are drawn once against the first row.
  let ry = headY - rowH;
  shown.forEach((g, i) => {
    const cellY = ry + 4.5;
    let x = M;
    text(
      page,
      `${g.count} ${g.count === 1 ? "Box" : "Boxes"}: ${g.lengthCm} x ${g.widthCm} x ${g.heightCm}`,
      x + 6,
      cellY,
      { font: fonts.regular, size: 8, color: INK, maxWidth: cols[0].w - 12 },
    );
    x += cols[0].w;

    if (i === 0) {
      text(page, kg(doc.price.actualWeight), x + 6, cellY, { font: fonts.regular, size: 8, color: INK });
      x += cols[1].w;
      text(page, kg(doc.price.volumetricWeight), x + 6, cellY, {
        font: fonts.regular,
        size: 8,
        color: INK,
      });
      x += cols[2].w;
      text(page, kg(doc.price.chargedWeight), x + 6, cellY, { font: fonts.bold, size: 8, color: INK });
      x += cols[3].w;
      const contents = wrap(doc.meta.saidToContain, fonts.regular, 7.5, cols[4].w - 12, 2);
      contents.forEach((line, li) =>
        text(page, line, x + 6, cellY + 3 - li * 8.5, { font: fonts.regular, size: 7.5, color: INK }),
      );
    }
    if (i > 0) hline(page, M, ry + rowH, cols[0].w, HAIRLINE);
    ry -= rowH;
  });

  if (overflow > 0) {
    text(page, `+ ${overflow} more carton size(s) — see box manifest`, M + 6, ry + 5, {
      font: fonts.regular,
      size: 6.5,
      color: MUTED,
    });
  }

  // Totals band, ruled off from the rows above it.
  rect(page, M, y, CONTENT_W, totalH, { fill: FILL });
  hline(page, M, y + totalH, CONTENT_W, LINE);
  // Physical cartons, not manifest lines.
  const cartons = totalBoxCount(doc.boxes);

  text(page, `TOTAL NUMBER OF BOXES: ${cartons}`, M + 6, y + 4.5, {
    font: fonts.bold,
    size: 8,
    color: INK,
  });

  const handover = `${cartons} box(es) to be handed over by shipper`;
  const hw = fonts.regular.widthOfTextAtSize(handover, 7);
  text(page, handover, M + CONTENT_W - hw - 8, y + 4.8, {
    font: fonts.regular,
    size: 7,
    color: MUTED,
  });

  return y;
}

// ---------------------------------------------------------------- charges

function drawCharges(page: PDFPage, fonts: Fonts, doc: ShipmentDoc, top: number): number {
  const h = 40;
  const y = top - h;
  rect(page, M, y, CONTENT_W, h, { border: LINE });
  rect(page, M, y, CONTENT_W, h, { fill: undefined });

  const items: Array<[string, string]> = [
    [`Freight @ ${money(doc.price.ratePerKg)}/kg`, money(doc.price.freight)],
    ["Docket", money(doc.price.docketCharge)],
    ["Fuel surcharge", money(doc.price.fuelSurcharge)],
    ["FOV / risk", money(doc.price.fov)],
    ["ODA", money(doc.price.odaCharge)],
    ["COD", money(doc.price.codCharge)],
    ["Sub-total", money(doc.price.subtotal)],
    ["GST", money(doc.price.gstAmount)],
  ];

  const totalW = 132;
  const gridW = CONTENT_W - totalW;
  const colW = gridW / items.length;

  items.forEach(([label, value], i) => {
    const x = M + i * colW;
    if (i > 0) vline(page, x, y + 4, h - 8, HAIRLINE);
    text(page, label.toUpperCase(), x + 5, y + h - 13, {
      font: fonts.bold,
      size: 5.6,
      color: MUTED,
      maxWidth: colW - 8,
    });
    text(page, value, x + 5, y + h - 27, {
      font: fonts.regular,
      size: 8,
      color: INK,
      maxWidth: colW - 8,
    });
  });

  // Grand total block
  const tx = M + gridW;
  rect(page, tx, y, totalW, h, { fill: BRAND_INK });
  text(page, "TOTAL FREIGHT PAYABLE", tx + 8, y + h - 13, {
    font: fonts.bold,
    size: 5.8,
    color: rgb(1, 0.78, 0.68),
  });
  text(page, money(doc.price.grandTotal), tx + 8, y + h - 29, {
    font: fonts.bold,
    size: 12,
    color: WHITE,
  });

  return y;
}

// ---------------------------------------------------------------- POD block

function drawPod(page: PDFPage, fonts: Fonts, doc: ShipmentDoc, top: number): number {
  const bottom = M + FOOTER_H;
  const h = top - bottom;
  const gap = 8;
  const leftW = CONTENT_W * 0.42;
  const rightW = CONTENT_W - leftW - gap;
  const y = bottom;

  // Origin handover. The box count already appears in the table's totals band,
  // so this panel carries only what the driver and shipper have to act on.
  let cy = panel(page, fonts, "Required signature — origin", M, y, leftW, h);
  const px = M + 8;
  const remarks = doc.meta.remarks
    ? `Handling remarks: ${doc.meta.remarks}`
    : "No special handling instructions.";
  wrap(remarks, fonts.regular, 7, leftW - 16, 3).forEach((line, i) =>
    text(page, line, px, cy - 6 - i * 9, { font: fonts.regular, size: 7, color: INK }),
  );
  const sigY = y + 26;
  signatureLine(page, fonts, `${BRAND.name} employee id`, px, sigY + 18, leftW / 2 - 14);
  signatureLine(page, fonts, "Shipper's signature & stamp", px + leftW / 2, sigY + 18, leftW / 2 - 16);
  signatureLine(page, fonts, "Date & time of handover", px, sigY - 8, leftW - 16);

  // Delivery POD
  const rx = M + leftW + gap;
  cy = panel(page, fonts, "Proof of delivery — remarks", rx, y, rightW, h);
  const colW = (rightW - 16) / 4;
  const checks: Array<[string, string]> = [
    ["All okay", ""],
    ["Short box", "If yes, number of short boxes: ____"],
    ["Damaged content", "If yes, number of damaged boxes: ____"],
    ["Items missing", "If yes, AWB no(s) with pilferage: ____"],
  ];
  checks.forEach(([label, hint], i) => {
    const x = rx + 8 + i * colW;
    checkbox(page, fonts, label, x, cy - 8, colW - 6);
    if (hint) {
      wrap(hint, fonts.regular, 5.8, colW - 10, 2).forEach((line, li) =>
        text(page, line, x, cy - 22 - li * 7, { font: fonts.regular, size: 5.8, color: MUTED }),
      );
    }
  });

  const podY = y + 26;
  signatureLine(page, fonts, "Date of receipt", rx + 8, podY + 18, colW - 10);
  signatureLine(page, fonts, "Time of receipt", rx + 8 + colW, podY + 18, colW - 10);
  signatureLine(page, fonts, "Receiver's name", rx + 8 + colW * 2, podY + 18, colW * 2 - 16);
  signatureLine(page, fonts, "Receiver's signature", rx + 8, podY - 8, colW * 2 - 10);
  signatureLine(page, fonts, "Stamp / seal, or phone no. in lieu of stamp", rx + 8 + colW * 2, podY - 8, colW * 2 - 16);

  return y;
}

// ---------------------------------------------------------------- footer

function drawFooter(page: PDFPage, fonts: Fonts, copy: string, printedOn: string) {
  const y = M - 4;
  hline(page, M, y + 18, CONTENT_W, HAIRLINE);

  text(page, `${BRAND.legalName}  |  ${BRAND.registeredOffice}`, M, y + 10, {
    font: fonts.bold,
    size: 5.8,
    color: MUTED,
    maxWidth: CONTENT_W - 200,
  });
  text(
    page,
    `Transporter ID: ${BRAND.transporterId}  |  CIN: ${BRAND.cin}  |  PAN: ${BRAND.pan}  |  ${LR_TERMS}`,
    M,
    y + 2,
    { font: fonts.regular, size: 5.4, color: MUTED, maxWidth: CONTENT_W - 200 },
  );

  const right = `Document type: ${copy}   |   Printed on ${printedOn}`;
  const w = fonts.bold.widthOfTextAtSize(right, 6);
  text(page, right, M + CONTENT_W - w, y + 10, { font: fonts.bold, size: 6, color: INK });
}
