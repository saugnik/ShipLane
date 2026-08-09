import { handle, notFound } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, ctx: { params: Promise<{ lrn: string }> }) {
  const { lrn } = await ctx.params;
  return handle(async () => {
    const order = await prisma.order.findUnique({
      where: { lrn },
      include: {
        boxes: { orderBy: { boxNumber: "asc" } },
        events: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!order) throw notFound(`Consignment ${lrn}`);
    return { order };
  });
}
