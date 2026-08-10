import { handle, HttpError, notFound } from "@/lib/api";
import { apiWriter, orderScope } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { trackingEventSchema } from "@/lib/validation";

const TERMINAL = new Set(["DELIVERED", "CANCELLED"]);

/**
 * Appends a scan to the consignment's trail and advances its headline status.
 * In production this is the webhook the carrier integration writes into; the
 * ops console posts to the same endpoint for manual corrections.
 */
export async function POST(req: Request, ctx: { params: Promise<{ lrn: string }> }) {
  const { lrn } = await ctx.params;
  return handle(async () => {
    const viewer = await apiWriter();
    const input = trackingEventSchema.parse(await req.json());

    const order = await prisma.order.findFirst({
      where: { lrn, ...orderScope(viewer) },
      select: { id: true, status: true },
    });
    if (!order) throw notFound(`Consignment ${lrn}`);
    if (TERMINAL.has(order.status)) {
      throw new HttpError(`Consignment is already ${order.status.toLowerCase()} and cannot be updated`, 409);
    }

    const [event] = await prisma.$transaction([
      prisma.trackingEvent.create({
        data: {
          orderId: order.id,
          status: input.status,
          location: input.location,
          remarks: input.remarks ?? null,
        },
      }),
      prisma.order.update({ where: { id: order.id }, data: { status: input.status } }),
    ]);

    return { event };
  });
}
