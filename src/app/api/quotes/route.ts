import { handle, HttpError } from "@/lib/api";
import { loadPartnerCommercials } from "@/lib/partners";
import { quoteAll } from "@/lib/pricing";
import { quoteRequestSchema } from "@/lib/validation";

/**
 * Rate shopping: prices the consignment with every active carrier and returns
 * the panel sorted cheapest-first. Nothing is persisted — the chosen quote is
 * recomputed and frozen when the order is actually created.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const body = await req.json();
    const input = quoteRequestSchema.parse(body);

    const partners = await loadPartnerCommercials();
    if (partners.length === 0) {
      throw new HttpError("No delivery partners are configured yet", 503);
    }

    const quotes = quoteAll(partners, input);
    const cheapest = quotes[0];
    const fastest = [...quotes].sort(
      (a, b) => a.transitDays - b.transitDays || a.grandTotal - b.grandTotal,
    )[0];

    return {
      quotes,
      recommended: {
        cheapestPartnerId: cheapest?.partnerId ?? null,
        fastestPartnerId: fastest?.partnerId ?? null,
      },
    };
  });
}
