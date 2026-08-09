import { prisma } from "@/lib/db";
import { toPartnerCommercials } from "@/lib/partnerMapper";
import type { PartnerCommercials } from "@/lib/pricing";

/**
 * Loads every active carrier with its full rate card.
 *
 * Rate cards are small (a few hundred rows per carrier) and read on every
 * quote, so we pull them in one query rather than per-lane lookups.
 */
export async function loadPartnerCommercials(partnerId?: string): Promise<PartnerCommercials[]> {
  const partners = await prisma.partner.findMany({
    where: { active: true, ...(partnerId ? { id: partnerId } : {}) },
    include: { rates: true },
    orderBy: { name: "asc" },
  });

  return partners.map(toPartnerCommercials);
}
