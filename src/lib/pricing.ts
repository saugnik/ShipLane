import { zoneForState } from "@/lib/india";

/**
 * Freight rating engine.
 *
 * Deliberately a pure function over plain data: the quote endpoint and the
 * order-creation endpoint must agree to the paisa, and the price shown at
 * checkout is frozen onto the order. Anything that reads the database lives in
 * the caller, not here.
 */

export type RateRow = {
  id: string;
  originState: string;
  originCity: string;
  destState: string;
  destCity: string;
  ratePerKg: number;
  minCharge: number;
  transitDays: number;
  oda: boolean;
};

export type PartnerCommercials = {
  id: string;
  code: string;
  name: string;
  tagline: string;
  accent: string;
  modes: string[];
  services: string[];
  minChargeableWeight: number;
  volumetricDivisor: number;
  fuelSurchargePct: number;
  docketCharge: number;
  fovPct: number;
  fovMin: number;
  odaCharge: number;
  codChargePct: number;
  codChargeMin: number;
  gstPct: number;
  rates: RateRow[];
};

/** One manifest line: `quantity` identical cartons. */
export type BoxInput = {
  lineNumber?: number;
  /** Number of identical cartons on this line. */
  quantity: number;
  description?: string;
  referenceId?: string | null;
  /** Weight of a single carton, not the line total. */
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
};

export type QuoteRequest = {
  originState: string;
  originCity: string;
  destState: string;
  destCity: string;
  boxes: BoxInput[];
  invoiceAmount: number;
  /** CARRIER risk adds freight-on-value; OWNER risk means the shipper insures. */
  riskType?: "OWNER" | "CARRIER";
  invoiceValuePayment?: "PREPAID" | "COD";
};

export type PriceBreakup = {
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
  gstPct: number;
  gstAmount: number;
  grandTotal: number;
};

export type Quote = PriceBreakup & {
  totalBoxes: number;
  partnerId: string;
  partnerCode: string;
  partnerName: string;
  tagline: string;
  accent: string;
  modes: string[];
  services: string[];
  transitDays: number;
  etaDate: string;
  oda: boolean;
  /** True when no explicit lane row matched and we fell back to zone pricing. */
  indicative: boolean;
  laneLabel: string;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Lane matching. "*" is a wildcard; the most specific row wins so a carrier can
 * publish a broad state rate and then override individual city pairs.
 * Score weights city above state, and destination above origin — destination is
 * what actually drives line-haul cost.
 */
function scoreRate(rate: RateRow, req: QuoteRequest): number | null {
  let score = 0;
  const dims: Array<[string, string, number]> = [
    [rate.destCity, req.destCity, 8],
    [rate.destState, req.destState, 4],
    [rate.originCity, req.originCity, 2],
    [rate.originState, req.originState, 1],
  ];
  for (const [pattern, value, weight] of dims) {
    if (pattern === "*") continue;
    if (norm(pattern) !== norm(value)) return null; // hard mismatch
    score += weight;
  }
  return score;
}

function pickRate(partner: PartnerCommercials, req: QuoteRequest): RateRow | null {
  let best: RateRow | null = null;
  let bestScore = -1;
  for (const rate of partner.rates) {
    const score = scoreRate(rate, req);
    if (score === null) continue;
    if (score > bestScore) {
      best = rate;
      bestScore = score;
    }
  }
  return best;
}

/** Zone-to-zone fallback so a carrier can still be quoted on an unpublished lane. */
function fallbackRate(partner: PartnerCommercials, req: QuoteRequest): RateRow {
  const from = zoneForState(req.originState);
  const to = zoneForState(req.destState);
  const sameZone = from === to;
  const northEast = to === "NE" || from === "NE";

  const published = partner.rates.map((r) => r.ratePerKg).filter((r) => r > 0);
  const median = published.length
    ? published.sort((a, b) => a - b)[Math.floor(published.length / 2)]
    : 14;

  const multiplier = sameZone ? 0.85 : northEast ? 1.6 : 1.15;
  return {
    id: "fallback",
    originState: req.originState,
    originCity: "*",
    destState: req.destState,
    destCity: "*",
    ratePerKg: round2(median * multiplier),
    minCharge: round2(median * multiplier * partner.minChargeableWeight),
    transitDays: sameZone ? 2 : northEast ? 8 : 5,
    oda: northEast,
  };
}

/**
 * Consignment weights.
 *
 * Both figures are per-carton values multiplied by the line quantity:
 *
 *   volumetric per carton = (L x W x H) / divisor
 *   line volumetric       = per carton x quantity
 *
 * so a line of 50 cartons at 40x40x20 with divisor 5000 contributes
 * 6.4 x 50 = 320 kg, not 6.4 kg.
 */
export function weighBoxes(boxes: BoxInput[], volumetricDivisor: number) {
  let actual = 0;
  let volumetric = 0;
  let count = 0;

  for (const b of boxes) {
    const qty = Math.max(0, Math.trunc(Number(b.quantity) || 0));
    count += qty;
    actual += (Number(b.weightKg) || 0) * qty;

    const cft = (Number(b.lengthCm) || 0) * (Number(b.widthCm) || 0) * (Number(b.heightCm) || 0);
    volumetric += (cft / volumetricDivisor) * qty;
  }

  return {
    actualWeight: round2(actual),
    volumetricWeight: round2(volumetric),
    totalBoxes: count,
  };
}

/** Volumetric weight of a single carton on a line — shown per row in the UI. */
export function volumetricPerCarton(b: BoxInput, volumetricDivisor: number): number {
  const cft = (Number(b.lengthCm) || 0) * (Number(b.widthCm) || 0) * (Number(b.heightCm) || 0);
  return round2(cft / volumetricDivisor);
}

/** Working days only — carriers do not run line-haul on Sundays. */
export function addTransitDays(from: Date, days: number): Date {
  const d = new Date(from);
  let left = Math.max(1, days);
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) left -= 1;
  }
  return d;
}

export function priceWithPartner(
  partner: PartnerCommercials,
  req: QuoteRequest,
  now: Date = new Date(),
): Quote {
  const matched = pickRate(partner, req);
  const rate = matched ?? fallbackRate(partner, req);

  const { actualWeight, volumetricWeight, totalBoxes } = weighBoxes(
    req.boxes,
    partner.volumetricDivisor,
  );

  // Carriers bill on the greater of dead weight and volumetric weight, subject
  // to a per-consignment floor.
  const chargedWeight = round2(
    Math.max(actualWeight, volumetricWeight, partner.minChargeableWeight),
  );

  const freight = round2(Math.max(chargedWeight * rate.ratePerKg, rate.minCharge));
  const fuelSurcharge = round2((freight * partner.fuelSurchargePct) / 100);

  const fov =
    req.riskType === "CARRIER"
      ? round2(Math.max((req.invoiceAmount * partner.fovPct) / 100, partner.fovMin))
      : 0;

  const odaCharge = rate.oda ? round2(partner.odaCharge) : 0;

  const codCharge =
    req.invoiceValuePayment === "COD"
      ? round2(Math.max((req.invoiceAmount * partner.codChargePct) / 100, partner.codChargeMin))
      : 0;

  const subtotal = round2(
    freight + partner.docketCharge + fuelSurcharge + fov + odaCharge + codCharge,
  );
  const gstAmount = round2((subtotal * partner.gstPct) / 100);
  const grandTotal = round2(subtotal + gstAmount);

  const etaDate = addTransitDays(now, rate.transitDays);

  return {
    partnerId: partner.id,
    partnerCode: partner.code,
    partnerName: partner.name,
    tagline: partner.tagline,
    accent: partner.accent,
    modes: partner.modes,
    services: partner.services,
    totalBoxes,
    actualWeight,
    volumetricWeight,
    chargedWeight,
    ratePerKg: rate.ratePerKg,
    freight,
    docketCharge: round2(partner.docketCharge),
    fuelSurcharge,
    fov,
    odaCharge,
    codCharge,
    subtotal,
    gstPct: partner.gstPct,
    gstAmount,
    grandTotal,
    transitDays: rate.transitDays,
    etaDate: etaDate.toISOString(),
    oda: rate.oda,
    indicative: matched === null,
    laneLabel: matched
      ? `${matched.originCity === "*" ? matched.originState : matched.originCity} → ${
          matched.destCity === "*" ? matched.destState : matched.destCity
        }`
      : `${req.originState} → ${req.destState} (zone rate)`,
  };
}

/** Quote every active partner, cheapest first. */
export function quoteAll(
  partners: PartnerCommercials[],
  req: QuoteRequest,
  now: Date = new Date(),
): Quote[] {
  return partners
    .map((p) => priceWithPartner(p, req, now))
    .sort((a, b) => a.grandTotal - b.grandTotal);
}
