import type { Prisma } from "@/generated/prisma";

/**
 * Shared consignment search filter, used by both the `/orders` page and the
 * list API so the two can never disagree about what a query matches.
 *
 * `mode: "insensitive"` matters on Postgres — unlike SQLite, `contains` is
 * case-sensitive there, so without it searching "kolkata" would silently miss
 * every consignment stored as "Kolkata".
 */
export function buildOrderFilter(q: string, status: string): Prisma.OrderWhereInput {
  const term = q.trim();

  return {
    ...(status ? { status } : {}),
    ...(term
      ? {
          OR: [
            // Document numbers are digits — case folding is irrelevant, and an
            // exact-prefix feel is what operators expect when scanning a barcode.
            { lrn: { contains: term } },
            { oid: { contains: term } },
            { mawb: { contains: term } },
            { invoiceNumber: { contains: term, mode: "insensitive" } },
            { ewayBill: { contains: term } },
            { pickupCompany: { contains: term, mode: "insensitive" } },
            { dropCompany: { contains: term, mode: "insensitive" } },
            { pickupCity: { contains: term, mode: "insensitive" } },
            { dropCity: { contains: term, mode: "insensitive" } },
            { partnerName: { contains: term, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}
