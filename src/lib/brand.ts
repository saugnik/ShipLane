/**
 * Single source of truth for the operator's identity.
 *
 * Everything customer-visible — the app chrome, the LR footer, the box tags —
 * reads from here, so white-labelling the platform is a one-file change.
 * Values fall back to env vars for per-deployment overrides.
 */
export const BRAND = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "ShipLane",
  productName: process.env.NEXT_PUBLIC_BRAND_PRODUCT ?? "ShipLane Freight",
  tagline: "B2B freight booking, rated and documented in one pass",
  legalName: process.env.BRAND_LEGAL_NAME ?? "ShipLane Logistics Private Limited",
  registeredOffice:
    process.env.BRAND_ADDRESS ??
    "Unit 402, Orion Business Park, Sector 62, Noida, Uttar Pradesh, India (201309)",
  cin: process.env.BRAND_CIN ?? "U63030UP2021PTC148812",
  pan: process.env.BRAND_PAN ?? "AAFCS4417K",
  transporterId: process.env.BRAND_TRANSPORTER_ID ?? "09AAFCS4417K1ZP",
  website: process.env.NEXT_PUBLIC_BRAND_WEBSITE ?? "www.shiplane.example",
  supportEmail: process.env.NEXT_PUBLIC_BRAND_EMAIL ?? "support@shiplane.example",
  supportPhone: process.env.NEXT_PUBLIC_BRAND_PHONE ?? "1800 200 4455",
} as const;

/** Printed at the foot of every LR copy. */
export const LR_TERMS =
  "Goods are carried at owner's risk unless carrier risk is opted for and charged. " +
  "Claims must be reported in writing within 7 days of delivery. " +
  "This consignment note is subject to the carrier's standard terms available at " +
  BRAND.website;
