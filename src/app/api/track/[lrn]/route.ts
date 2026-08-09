import { handle, notFound } from "@/lib/api";
import { prisma } from "@/lib/db";

/**
 * Public tracking. Deliberately narrower than the internal order endpoint:
 * anyone with an LRN can call it, so it exposes movement and route only —
 * no pricing, no contact details, no invoice values.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ lrn: string }> }) {
  const { lrn } = await ctx.params;
  return handle(async () => {
    const order = await prisma.order.findUnique({
      where: { lrn: lrn.trim() },
      select: {
        lrn: true,
        status: true,
        createdAt: true,
        etaDate: true,
        transitDays: true,
        partnerName: true,
        mot: true,
        pickupCity: true,
        pickupState: true,
        dropCity: true,
        dropState: true,
        _count: { select: { boxes: true } },
        events: {
          orderBy: { createdAt: "desc" },
          select: { status: true, location: true, remarks: true, createdAt: true },
        },
      },
    });
    if (!order) throw notFound(`Consignment ${lrn}`);

    const { _count, ...rest } = order;
    return { shipment: { ...rest, boxCount: _count.boxes } };
  });
}
