import { handle, notFound } from "@/lib/api";
import { apiViewer, orderScope } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, ctx: { params: Promise<{ lrn: string }> }) {
  const { lrn } = await ctx.params;
  return handle(async () => {
    const viewer = await apiViewer();

    // Scope is part of the lookup, not a check afterwards — a USER asking for
    // someone else's LRN gets an ordinary 404 and learns nothing.
    const order = await prisma.order.findFirst({
      where: { lrn, ...orderScope(viewer) },
      include: {
        boxes: { orderBy: { lineNumber: "asc" } },
        events: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!order) throw notFound(`Consignment ${lrn}`);
    return { order };
  });
}
