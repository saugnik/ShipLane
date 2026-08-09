import { prisma } from "@/lib/db";
import { toShipmentDoc } from "@/lib/documents";
import { renderBoxTagsPdf } from "@/lib/pdf/boxTags";

export const runtime = "nodejs";

/** Streams one 4in x 2in label per carton, plus the document envelope tag. */
export async function GET(req: Request, ctx: { params: Promise<{ lrn: string }> }) {
  const { lrn } = await ctx.params;

  const order = await prisma.order.findUnique({ where: { lrn }, include: { boxes: true } });
  if (!order) {
    return new Response(`Consignment ${lrn} not found`, { status: 404 });
  }

  const bytes = await renderBoxTagsPdf(toShipmentDoc(order));
  const download = new URL(req.url).searchParams.get("download") === "1";

  return new Response(bytes as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="BOX-TAGS-${lrn}.pdf"`,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, max-age=60",
    },
  });
}
