import { handle } from "@/lib/api";
import { prisma } from "@/lib/db";

/** Carrier panel with rate-card size — powers the admin list. */
export async function GET() {
  return handle(async () => {
    const partners = await prisma.partner.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { rates: true, orders: true } } },
    });

    return {
      partners: partners.map((p) => ({
        ...p,
        modes: JSON.parse(p.modes) as string[],
        services: JSON.parse(p.services) as string[],
        rateCount: p._count.rates,
        orderCount: p._count.orders,
      })),
    };
  });
}
