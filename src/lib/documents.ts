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

export type DocBox = {
  boxNumber: number;
  awb: string;
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
      .sort((a, b) => a.boxNumber - b.boxNumber)
      .map((b) => ({
        boxNumber: b.boxNumber,
        awb: b.awb || boxAwb(order.lrn, b.boxNumber),
        description: b.description,
        referenceId: b.referenceId,
        weightKg: b.weightKg,
        lengthCm: b.lengthCm,
        widthCm: b.widthCm,
        heightCm: b.heightCm,
      })),
  };
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
      existing.count += 1;
      existing.weightKg += b.weightKg;
    } else {
      map.set(key, {
        count: 1,
        lengthCm: b.lengthCm,
        widthCm: b.widthCm,
        heightCm: b.heightCm,
        weightKg: b.weightKg,
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
