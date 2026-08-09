import { handle } from "@/lib/api";
import { lookupPincode } from "@/lib/india";

/**
 * PIN code -> city/state. Used by the booking form to pre-fill the address
 * block when Google Places is not configured, and as a cross-check when it is.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ pin: string }> }) {
  const { pin } = await ctx.params;
  return handle(async () => lookupPincode(pin));
}
