import { prisma } from "@/lib/db";
import { toShipmentDoc } from "@/lib/documents";
import { renderLrPdf } from "@/lib/pdf/lr";

// pdf-lib and bwip-js both need Node built-ins — never run this on the edge.
export const runtime = "nodejs";

/**
 * Streams the three-copy Lorry Receipt.
 * `?download=1` forces a save dialog; the default is inline so the app can
 * preview it in an iframe.
 */
export async function GET(req: Request, ctx: { params: Promise<{ lrn: string }> }) {
  const { lrn } = await ctx.params;

  const order = await prisma.order.findUnique({ where: { lrn }, include: { boxes: true } });
  if (!order) {
    return new Response(`Consignment ${lrn} not found`, { status: 404 });
  }

  const bytes = await renderLrPdf(toShipmentDoc(order));
  const download = new URL(req.url).searchParams.get("download") === "1";

  return new Response(bytes as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="LR-${lrn}.pdf"`,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, max-age=60",
    },
  });
}
