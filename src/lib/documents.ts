import type { Box, Order } from "@/generated/prisma";
import { boxAwb } from "@/lib/docNumbers";

/**
 * The flat, render-ready view of an order that both PDF renderers consume.
 * Keeping this separate from the Prisma row means the document layout never
 * has to know about the storage schema.
 */
export type DocParty = {
  company: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string | null;
};

/** A manifest line as printed on the LR. */
export type DocBox = {
  lineNumber: number;
  quantity: number;
  description: string;
  referenceId: string | null;
  /** Per carton. */
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
};

/** A single physical carton, expanded from a line for tag printing. */
export type PhysicalBox = {
  /** 1-based index across the whole consignment. */
  index: number;
  awb: string;
  lineNumber: number;
  /** Position within its own line, e.g. 3 of 50. */
  indexInLine: number;
  description: string;
  referenceId: string | null;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
};

export type ShipmentDoc = {
  lrn: string;
  oid: string;
  mawb: string;
  createdAt: Date;
  etaDate: Date | null;
  status: string;
  shipper: DocParty;
  consignee: DocParty;
  invoice: { number: string; amount: number; ewayBill: string | null };
  meta: {
    mot: string;
    pickupType: string;
    deliveryType: string;
    freightPayment: string;
    invoiceValuePayment: string;
    riskType: string;
    podOnInvoice: boolean;
    saidToContain: string;
    remarks: string | null;
    partnerName: string;
    partnerCode: string;
  };
  price: {
    actualWeight: number;
    volumetricWeight: number;
    chargedWeight: number;
    ratePerKg: number;
    freight: number;
    docketCharge: number;
    fuelSurcharge: number;
    fov: number;
    odaCharge: number;
    codCharge: number;
    subtotal: number;
    gstAmount: number;
    grandTotal: number;
    transitDays: number;
  };
  boxes: DocBox[];
};

export function toShipmentDoc(order: Order & { boxes: Box[] }): ShipmentDoc {
  return {
    lrn: order.lrn,
    oid: order.oid,
    mawb: order.mawb,
    createdAt: order.createdAt,
    etaDate: order.etaDate,
    status: order.status,
    shipper: {
      company: order.pickupCompany,
      contact: order.pickupContact,
      phone: order.pickupPhone,
      email: order.pickupEmail,
      address: order.pickupAddress,
      city: order.pickupCity,
      state: order.pickupState,
      pincode: order.pickupPincode,
      gstin: order.pickupGstin,
    },
    consignee: {
      company: order.dropCompany,
      contact: order.dropContact,
      phone: order.dropPhone,
      email: order.dropEmail,
      address: order.dropAddress,
      city: order.dropCity,
      state: order.dropState,
      pincode: order.dropPincode,
      gstin: order.dropGstin,
    },
    invoice: {
      number: order.invoiceNumber,
      amount: order.invoiceAmount,
      ewayBill: order.ewayBill,
    },
    meta: {
      mot: order.mot,
      pickupType: order.pickupType,
      deliveryType: order.deliveryType,
      freightPayment: order.freightPayment,
      invoiceValuePayment: order.invoiceValuePayment,
      riskType: order.riskType,
      podOnInvoice: order.podOnInvoice,
      saidToContain: order.saidToContain,
      remarks: order.remarks,
      partnerName: order.partnerName ?? "-",
      partnerCode: order.partnerCode ?? "-",
    },
    price: {
      actualWeight: order.actualWeight,
      volumetricWeight: order.volumetricWeight,
      chargedWeight: order.chargedWeight,
      ratePerKg: order.ratePerKg,
      freight: order.freight,
      docketCharge: order.docketCharge,
      fuelSurcharge: order.fuelSurcharge,
      fov: order.fov,
      odaCharge: order.odaCharge,
      codCharge: order.codCharge,
      subtotal: order.subtotal,
      gstAmount: order.gstAmount,
      grandTotal: order.grandTotal,
      transitDays: order.transitDays,
    },
    boxes: order.boxes
      .slice()
      .sort((a, b) => a.lineNumber - b.lineNumber)
      .map((b) => ({
        lineNumber: b.lineNumber,
        quantity: b.quantity,
        description: b.description,
        referenceId: b.referenceId,
        weightKg: b.weightKg,
        lengthCm: b.lengthCm,
        widthCm: b.widthCm,
        heightCm: b.heightCm,
      })),
  };
}

/** Total physical cartons across every manifest line. */
export function totalBoxCount(boxes: DocBox[]): number {
  return boxes.reduce((sum, b) => sum + b.quantity, 0);
}

/**
 * Expand manifest lines into individual cartons for tag printing.
 *
 * Numbering runs continuously across the whole consignment — a 50-carton line
 * gives boxes 1-50, the next line of 20 gives 51-70 — so every physical box has
 * one unambiguous number matching the "BOX n / N" printed on its tag.
 */
export function expandBoxes(lrn: string, boxes: DocBox[]): PhysicalBox[] {
  const out: PhysicalBox[] = [];
  let index = 0;

  for (const line of boxes) {
    for (let i = 1; i <= line.quantity; i += 1) {
      index += 1;
      out.push({
        index,
        awb: boxAwb(lrn, index),
        lineNumber: line.lineNumber,
        indexInLine: i,
        description: line.description,
        referenceId: line.referenceId,
        weightKg: line.weightKg,
        lengthCm: line.lengthCm,
        widthCm: line.widthCm,
        heightCm: line.heightCm,
      });
    }
  }
  return out;
}

/** One line per distinct carton size, the way carriers print manifests. */
export type DimensionGroup = {
  count: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg: number;
  label: string;
};

export function groupByDimension(boxes: DocBox[]): DimensionGroup[] {
  const map = new Map<string, DimensionGroup>();
  for (const b of boxes) {
    const key = `${b.lengthCm}x${b.widthCm}x${b.heightCm}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += b.quantity;
      existing.weightKg += b.weightKg * b.quantity;
    } else {
      map.set(key, {
        count: b.quantity,
        lengthCm: b.lengthCm,
        widthCm: b.widthCm,
        heightCm: b.heightCm,
        weightKg: b.weightKg * b.quantity,
        label: key,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

/** Single-line postal address used on tags and summary panels. */
export function formatAddress(p: DocParty): string {
  return [p.address, `City: ${p.city}`, `State: ${p.state}`, `Pin: ${p.pincode}`]
    .filter(Boolean)
    .join(", ");
}

export function partyName(p: DocParty): string {
  return p.contact ? `${p.company}, ${p.contact}` : p.company;
}
