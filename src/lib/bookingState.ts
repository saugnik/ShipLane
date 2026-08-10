import { z } from "zod";
import {
  boxSchema,
  invoiceSchema,
  partySchema,
  shipmentSchema,
  fieldErrors,
} from "@/lib/validation";

/**
 * Wizard state.
 *
 * Every input is held as a string. Numeric fields kept as `number` would force
 * a choice between "empty" and "0" on a field the operator has not touched yet,
 * which is exactly how a 0 kg box slips through. Zod coerces at the boundary.
 */

export type PartyForm = {
  company: string;
  product: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  lat?: number;
  lng?: number;
};

/** One manifest line in the wizard: `quantity` identical cartons. */
export type BoxForm = {
  key: string;
  quantity: string;
  description: string;
  referenceId: string;
  /** Per carton. */
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
};

export type InvoiceForm = {
  invoiceNumber: string;
  invoiceAmount: string;
  ewayBill: string;
};

export type ShipmentForm = {
  mot: "ROAD" | "AIR" | "RAIL";
  pickupType: "SELF_DROP" | "SCHEDULED_PICKUP";
  deliveryType: "SELF_COLLECT" | "DOOR_DELIVERY";
  freightPayment: "BTC" | "PAID" | "TO_PAY";
  invoiceValuePayment: "PREPAID" | "COD";
  riskType: "OWNER" | "CARRIER";
  podOnInvoice: boolean;
  saidToContain: string;
  remarks: string;
};

export type BookingState = {
  pickup: PartyForm;
  drop: PartyForm;
  invoice: InvoiceForm;
  shipment: ShipmentForm;
  boxes: BoxForm[];
  partnerId: string | null;
};

export const emptyParty = (): PartyForm => ({
  company: "",
  product: "",
  contact: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  gstin: "",
});

export const emptyBox = (key: string): BoxForm => ({
  key,
  quantity: "1",
  description: "",
  referenceId: "",
  weightKg: "",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
});

export const initialBooking = (): BookingState => ({
  pickup: emptyParty(),
  drop: emptyParty(),
  invoice: { invoiceNumber: "", invoiceAmount: "", ewayBill: "" },
  shipment: {
    mot: "ROAD",
    pickupType: "SCHEDULED_PICKUP",
    deliveryType: "DOOR_DELIVERY",
    freightPayment: "BTC",
    invoiceValuePayment: "PREPAID",
    riskType: "OWNER",
    podOnInvoice: false,
    saidToContain: "",
    remarks: "",
  },
  boxes: [emptyBox("box-1")],
  partnerId: null,
});

export const STEPS = [
  { id: "route", label: "Route", hint: "Pickup & drop" },
  { id: "invoice", label: "Invoice", hint: "Docs & value" },
  { id: "cargo", label: "Cargo", hint: "Shipment & boxes" },
  { id: "carrier", label: "Carrier", hint: "Compare & pick" },
  { id: "review", label: "Review", hint: "Confirm booking" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

/** Convert wizard strings into the payload the API expects. */
export function toCreatePayload(state: BookingState) {
  const party = (p: PartyForm) => ({
    company: p.company,
    product: p.product,
    contact: p.contact,
    email: p.email,
    phone: p.phone,
    address: p.address,
    city: p.city,
    state: p.state,
    pincode: p.pincode,
    gstin: p.gstin,
    ...(typeof p.lat === "number" ? { lat: p.lat } : {}),
    ...(typeof p.lng === "number" ? { lng: p.lng } : {}),
  });

  return {
    pickup: party(state.pickup),
    drop: party(state.drop),
    invoice: {
      invoiceNumber: state.invoice.invoiceNumber,
      invoiceAmount: Number(state.invoice.invoiceAmount || 0),
      ewayBill: state.invoice.ewayBill,
    },
    shipment: state.shipment,
    // `lineNumber` is positional — the operator never types it, so it can never
    // collide the way a hand-entered box number could.
    boxes: state.boxes.map((b, i) => ({
      lineNumber: i + 1,
      quantity: Number(b.quantity || 0),
      description: b.description,
      referenceId: b.referenceId,
      weightKg: Number(b.weightKg || 0),
      lengthCm: Number(b.lengthCm || 0),
      widthCm: Number(b.widthCm || 0),
      heightCm: Number(b.heightCm || 0),
    })),
    partnerId: state.partnerId ?? "",
  };
}

export type StepErrors = Record<string, string>;

/**
 * Per-step validation. The wizard runs only the current step's rules so an
 * operator is never blocked by a field two screens ahead — the server still
 * revalidates the whole payload on submit.
 */
export function validateStep(step: StepId, state: BookingState): StepErrors {
  const payload = toCreatePayload(state);

  switch (step) {
    case "route": {
      const errors: StepErrors = {};
      const pickup = partySchema.safeParse(payload.pickup);
      if (!pickup.success) {
        for (const [k, v] of Object.entries(fieldErrors(pickup.error))) errors[`pickup.${k}`] = v;
      }
      const drop = partySchema.safeParse(payload.drop);
      if (!drop.success) {
        for (const [k, v] of Object.entries(fieldErrors(drop.error))) errors[`drop.${k}`] = v;
      }
      if (
        !errors["drop.pincode"] &&
        payload.pickup.pincode &&
        payload.pickup.pincode === payload.drop.pincode
      ) {
        errors["drop.pincode"] = "Pickup and drop PIN codes cannot be the same";
      }
      return errors;
    }

    case "invoice": {
      const result = invoiceSchema.safeParse(payload.invoice);
      const errors: StepErrors = {};
      if (!result.success) {
        for (const [k, v] of Object.entries(fieldErrors(result.error))) errors[`invoice.${k}`] = v;
      }
      if (payload.invoice.invoiceAmount > 50_000 && !payload.invoice.ewayBill) {
        errors["invoice.ewayBill"] =
          "E-Way Bill is mandatory for invoice value above ₹50,000";
      }
      return errors;
    }

    case "cargo": {
      const errors: StepErrors = {};
      const shipment = shipmentSchema.safeParse(payload.shipment);
      if (!shipment.success) {
        for (const [k, v] of Object.entries(fieldErrors(shipment.error))) {
          errors[`shipment.${k}`] = v;
        }
      }
      payload.boxes.forEach((box, i) => {
        const result = boxSchema.safeParse(box);
        if (!result.success) {
          for (const [k, v] of Object.entries(fieldErrors(result.error))) {
            errors[`boxes.${i}.${k}`] = v;
          }
        }
      });
      const totalBoxes = payload.boxes.reduce((sum, b) => sum + (b.quantity || 0), 0);
      if (totalBoxes > 2000) {
        errors["boxes"] = `A consignment cannot exceed 2000 cartons (this one has ${totalBoxes})`;
      }
      return errors;
    }

    case "carrier":
      return state.partnerId ? {} : { partnerId: "Select a delivery partner to continue" };

    case "review":
      return {};
  }
}

/** True when every step up to and including `step` passes. */
export function canReach(step: StepId, state: BookingState): boolean {
  const order = STEPS.map((s) => s.id);
  const target = order.indexOf(step);
  for (let i = 0; i < target; i += 1) {
    if (Object.keys(validateStep(order[i], state)).length > 0) return false;
  }
  return true;
}

export const quoteRequestFrom = (state: BookingState) => ({
  originState: state.pickup.state,
  originCity: state.pickup.city,
  destState: state.drop.state,
  destCity: state.drop.city,
  boxes: toCreatePayload(state).boxes,
  invoiceAmount: Number(state.invoice.invoiceAmount || 0),
  riskType: state.shipment.riskType,
  invoiceValuePayment: state.shipment.invoiceValuePayment,
});

/** Cheap signature of everything that affects price — used to invalidate quotes. */
export function pricingSignature(state: BookingState): string {
  return JSON.stringify(quoteRequestFrom(state));
}

export const bookingStateSchema = z.custom<BookingState>();
