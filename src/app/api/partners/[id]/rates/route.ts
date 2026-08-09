import { handle, HttpError, notFound } from "@/lib/api";
import { prisma } from "@/lib/db";
import { rateSchema } from "@/lib/validation";

const PAGE_SIZE = 50;

/** Rate card for one carrier, filterable by destination state. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handle(async () => {
    const url = new URL(req.url);
    const destState = url.searchParams.get("destState")?.trim() ?? "";
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);

    const where = { partnerId: id, ...(destState ? { destState } : {}) };
    const [rates, total] = await Promise.all([
      prisma.rate.findMany({
        where,
        orderBy: [{ destState: "asc" }, { destCity: "asc" }, { originCity: "asc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.rate.count({ where }),
    ]);

    return { rates, page, pageSize: PAGE_SIZE, total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
  });
}

/** Adds or replaces a lane. A lane is identified by its four origin/dest keys. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handle(async () => {
    const partner = await prisma.partner.findUnique({ where: { id }, select: { id: true } });
    if (!partner) throw notFound("Delivery partner");

    const input = rateSchema.parse(await req.json());
    const lane = {
      partnerId: id,
      originState: input.originState || "*",
      originCity: input.originCity || "*",
      destState: input.destState || "*",
      destCity: input.destCity || "*",
    };

    const existing = await prisma.rate.findFirst({ where: lane, select: { id: true } });
    const data = {
      ratePerKg: input.ratePerKg,
      minCharge: input.minCharge,
      transitDays: input.transitDays,
      oda: input.oda,
    };

    const rate = existing
      ? await prisma.rate.update({ where: { id: existing.id }, data })
      : await prisma.rate.create({ data: { ...lane, ...data } });

    return { rate, replaced: Boolean(existing) };
  });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handle(async () => {
    const rateId = new URL(req.url).searchParams.get("rateId");
    if (!rateId) throw new HttpError("rateId query parameter is required");

    const rate = await prisma.rate.findFirst({ where: { id: rateId, partnerId: id } });
    if (!rate) throw notFound("Lane");

    await prisma.rate.delete({ where: { id: rateId } });
    return { deleted: rateId };
  });
}
