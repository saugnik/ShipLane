import { z } from "zod";
import { INDIAN_STATES } from "@/lib/india";

const required = (label: string) => z.string().trim().min(1, `${label} is required`);

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

export const pincodeSchema = z
  .string()
  .trim()
  .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit Indian PIN code");

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9][0-9]{9}$/, "Enter a valid 10-digit Indian mobile number");

/**
 * GSTIN is not a free 15-character string — it is state code (2 digits) +
 * PAN (5 letters, 4 digits, 1 letter) + entity number + a literal Z + checksum.
 * The message spells the shape out because "15 characters" sends people back
 * to retype the same all-numeric value.
 */
export const gstinSchema = z
  .string()
  .trim()
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    "GSTIN format is 22AAAAA1234A1Z5 — 2 digits, 5 letters, 4 digits, a letter, then 1 character, Z and a check character",
  );

/** One end of the lane — used for both pickup and drop. */
export const partySchema = z.object({
  company: required("Company name").max(120),
  product: required("Product").max(120),
  contact: optionalText,
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]).optional(),
  phone: z.union([z.literal(""), phoneSchema]).optional(),
  address: required("Address").max(400),
  city: required("City").max(80),
  state: z.enum(INDIAN_STATES, { message: "Select a state" }),
  pincode: pincodeSchema,
  gstin: z.union([z.literal(""), gstinSchema]).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const invoiceSchema = z.object({
  invoiceNumber: required("Invoice number").max(60),
  invoiceAmount: z.coerce.number().min(0, "Amount cannot be negative"),
  ewayBill: z
    .union([z.literal(""), z.string().trim().regex(/^[0-9]{12}$/, "E-Way Bill number is 12 digits")])
    .optional(),
});

export const boxSchema = z.object({
  boxNumber: z.coerce.number().int().min(1),
  description: required("Product description").max(200),
  referenceId: optionalText,
  weightKg: z.coerce.number().gt(0, "Weight must be greater than 0").max(20000),
  lengthCm: z.coerce.number().gt(0, "Length must be greater than 0").max(1200),
  widthCm: z.coerce.number().gt(0, "Breadth must be greater than 0").max(1200),
  heightCm: z.coerce.number().gt(0, "Height must be greater than 0").max(1200),
});

export const shipmentSchema = z.object({
  mot: z.enum(["ROAD", "AIR", "RAIL"]).default("ROAD"),
  pickupType: z.enum(["SELF_DROP", "SCHEDULED_PICKUP"]).default("SELF_DROP"),
  deliveryType: z.enum(["SELF_COLLECT", "DOOR_DELIVERY"]).default("DOOR_DELIVERY"),
  freightPayment: z.enum(["BTC", "PAID", "TO_PAY"]).default("BTC"),
  invoiceValuePayment: z.enum(["PREPAID", "COD"]).default("PREPAID"),
  riskType: z.enum(["OWNER", "CARRIER"]).default("OWNER"),
  podOnInvoice: z.boolean().default(false),
  saidToContain: required("Said-to-contain").max(200),
  remarks: optionalText,
});

export const quoteRequestSchema = z.object({
  originState: required("Origin state"),
  originCity: required("Origin city"),
  destState: required("Destination state"),
  destCity: required("Destination city"),
  boxes: z.array(boxSchema).min(1, "Add at least one box"),
  invoiceAmount: z.coerce.number().min(0).default(0),
  riskType: z.enum(["OWNER", "CARRIER"]).default("OWNER"),
  invoiceValuePayment: z.enum(["PREPAID", "COD"]).default("PREPAID"),
});

/** E-Way Bill threshold for movement of goods under the GST rules. */
export const EWAY_BILL_THRESHOLD = 50_000;

export const createOrderSchema = z
  .object({
    pickup: partySchema,
    drop: partySchema,
    invoice: invoiceSchema,
    shipment: shipmentSchema,
    boxes: z.array(boxSchema).min(1, "Add at least one box").max(500),
    partnerId: required("Select a delivery partner"),
  })
  .superRefine((val, ctx) => {
    // Consignments above the threshold cannot legally move without an E-Way
    // Bill, so we block the booking rather than let it fail at the first checkpoint.
    if (val.invoice.invoiceAmount > EWAY_BILL_THRESHOLD && !val.invoice.ewayBill) {
      ctx.addIssue({
        code: "custom",
        path: ["invoice", "ewayBill"],
        message: `E-Way Bill is mandatory for invoice value above ₹${EWAY_BILL_THRESHOLD.toLocaleString("en-IN")}`,
      });
    }
    // Box numbers are printed on the tags and scanned at every hop; duplicates
    // would make two physical boxes indistinguishable.
    const numbers = val.boxes.map((b) => b.boxNumber);
    if (new Set(numbers).size !== numbers.length) {
      ctx.addIssue({ code: "custom", path: ["boxes"], message: "Box numbers must be unique" });
    }
    if (val.pickup.pincode === val.drop.pincode) {
      ctx.addIssue({
        code: "custom",
        path: ["drop", "pincode"],
        message: "Pickup and drop PIN codes cannot be the same",
      });
    }
  });

export const trackingEventSchema = z.object({
  status: z.enum([
    "BOOKED",
    "PICKUP_SCHEDULED",
    "PICKED_UP",
    "IN_TRANSIT",
    "REACHED_DESTINATION_HUB",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "EXCEPTION",
    "CANCELLED",
  ]),
  location: required("Location"),
  remarks: optionalText,
});

export const rateSchema = z.object({
  originState: z.string().trim().default("*"),
  originCity: z.string().trim().default("*"),
  destState: z.string().trim().default("*"),
  destCity: z.string().trim().default("*"),
  ratePerKg: z.coerce.number().gt(0, "Rate per kg must be greater than 0"),
  minCharge: z.coerce.number().min(0),
  transitDays: z.coerce.number().int().min(1).max(30),
  oda: z.boolean().default(false),
});

export type PartyInput = z.infer<typeof partySchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type BoxInput = z.infer<typeof boxSchema>;
export type ShipmentInput = z.infer<typeof shipmentSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type RateInput = z.infer<typeof rateSchema>;

/** Flatten a ZodError into `{ "invoice.ewayBill": "message" }` for the form layer. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
