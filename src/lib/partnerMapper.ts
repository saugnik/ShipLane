import type { Partner, Rate } from "@/generated/prisma";
import type { PartnerCommercials } from "@/lib/pricing";

/**
 * Prisma row -> rating-engine input.
 *
 * Kept free of any database import so the seed script can reuse it with its own
 * client instead of pulling in `db.ts` and opening a second connection pool.
 */

/** JSON columns are stored as text; decode defensively. */
function parseList(value: string, fallback: string[]): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : fallback;
  } catch {
    return fallback;
  }
}

export function toPartnerCommercials(p: Partner & { rates: Rate[] }): PartnerCommercials {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    tagline: p.tagline,
    accent: p.accent,
    modes: parseList(p.modes, ["ROAD"]),
    services: parseList(p.services, ["SURFACE"]),
    minChargeableWeight: p.minChargeableWeight,
    volumetricDivisor: p.volumetricDivisor,
    fuelSurchargePct: p.fuelSurchargePct,
    docketCharge: p.docketCharge,
    fovPct: p.fovPct,
    fovMin: p.fovMin,
    odaCharge: p.odaCharge,
    codChargePct: p.codChargePct,
    codChargeMin: p.codChargeMin,
    gstPct: p.gstPct,
    rates: p.rates.map((r) => ({
      id: r.id,
      originState: r.originState,
      originCity: r.originCity,
      destState: r.destState,
      destCity: r.destCity,
      ratePerKg: r.ratePerKg,
      minCharge: r.minCharge,
      transitDays: r.transitDays,
      oda: r.oda,
    })),
  };
}
