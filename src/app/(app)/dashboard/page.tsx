import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  Boxes,
  IndianRupee,
  PackagePlus,
  Radar,
  TrendingUp,
  Truck,
  Weight,
} from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/Card";
import { orderScope, requireViewer } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { cn, formatDate, formatINRCompact, formatKg, relativeTime } from "@/lib/utils";

// Counts and recent activity must reflect the booking that was just made.
export const dynamic = "force-dynamic";

const MOVING = ["PICKED_UP", "IN_TRANSIT", "REACHED_DESTINATION_HUB", "OUT_FOR_DELIVERY"];

async function loadDashboard(scope: { createdById?: string }) {
  const [total, inTransit, delivered, aggregates, recent, carriers, byStatus] = await Promise.all([
    prisma.order.count({ where: scope }),
    prisma.order.count({ where: { ...scope, status: { in: MOVING } } }),
    prisma.order.count({ where: { ...scope, status: "DELIVERED" } }),
    prisma.order.aggregate({
      where: scope,
      _sum: { grandTotal: true, chargedWeight: true, totalBoxes: true },
    }),
    prisma.order.findMany({ where: scope, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.partner.count({ where: { active: true } }),
    prisma.order.groupBy({
      by: ["partnerName"],
      where: scope,
      _count: { _all: true },
      _sum: { grandTotal: true },
    }),
  ]);

  return {
    total,
    inTransit,
    delivered,
    freight: aggregates._sum.grandTotal ?? 0,
    weight: aggregates._sum.chargedWeight ?? 0,
    cartons: aggregates._sum.totalBoxes ?? 0,
    recent,
    carriers,
    byStatus: byStatus
      .filter((r) => r.partnerName)
      .sort((a, b) => (b._sum.grandTotal ?? 0) - (a._sum.grandTotal ?? 0)),
  };
}

export default async function DashboardPage() {
  // An ADMIN landing here would see an empty console, so send them to oversight.
  const viewer = await requireViewer("/dashboard");
  if (viewer.role === "ADMIN") redirect("/admin");

  const d = await loadDashboard(orderScope(viewer));
  const topSpend = d.byStatus[0]?._sum.grandTotal ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Freight console"
        description="Everything moving right now, and what it is costing you."
        action={
          <div className="flex gap-2">
            <ButtonLink href="/track" variant="secondary">
              <Radar className="size-4" />
              Track
            </ButtonLink>
            <ButtonLink href="/book">
              <PackagePlus className="size-4" />
              New booking
            </ButtonLink>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={Boxes}
          label="Consignments"
          value={String(d.total)}
          sub={`${d.cartons.toLocaleString("en-IN")} cartons manifested`}
        />
        <Stat
          icon={Truck}
          label="In transit"
          value={String(d.inTransit)}
          sub={`${d.delivered} delivered to date`}
          accent
          progress={d.total ? d.inTransit / d.total : 0}
        />
        <Stat
          icon={Weight}
          label="Chargeable weight"
          value={formatKg(d.weight)}
          sub="Billed across all bookings"
        />
        <Stat
          icon={IndianRupee}
          label="Freight spend"
          value={formatINRCompact(d.freight)}
          sub={`${d.carriers} carriers on panel`}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_320px]">
        <Card className="min-w-0">
          <CardHeader
            title="Recent consignments"
            description="The last eight bookings across every lane."
            action={
              <Link
                href="/orders"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-500/10 dark:text-brand-300"
              >
                View all
                <ArrowUpRight className="size-3.5" />
              </Link>
            }
          />
          <CardBody className="p-0">
            {d.recent.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={PackagePlus}
                  title="No consignments yet"
                  description="Book your first shipment to generate an LR, box tags and a live tracking trail."
                  action={<ButtonLink href="/book">Book a shipment</ButtonLink>}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-line [&>th]:label-caps [&>th]:px-5 [&>th]:py-2.5">
                      <th>LRN</th>
                      <th>Lane</th>
                      <th>Carrier</th>
                      <th className="text-right">Boxes</th>
                      <th className="text-right">Weight</th>
                      <th className="text-right">Freight</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.recent.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-line-soft transition-colors last:border-0 hover:bg-sunken"
                      >
                        <td className="px-5 py-3">
                          <Link
                            href={`/orders/${order.lrn}`}
                            className="docnum text-[13px] font-semibold text-brand-600 hover:underline dark:text-brand-300"
                          >
                            {order.lrn}
                          </Link>
                          <p className="mt-0.5 text-[11px] text-ink-4">
                            {relativeTime(order.createdAt)}
                          </p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-ink">
                            {order.pickupCity} <span className="text-ink-4">→</span> {order.dropCity}
                          </p>
                          <p className="mt-0.5 text-[11px] text-ink-4">
                            ETA {formatDate(order.etaDate)}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-ink-2">{order.partnerName ?? "—"}</td>
                        <td className="tnum px-5 py-3 text-right text-ink-2">{order.totalBoxes}</td>
                        <td className="tnum px-5 py-3 text-right text-ink-2">
                          {formatKg(order.chargedWeight)}
                        </td>
                        <td className="tnum px-5 py-3 text-right font-semibold text-ink">
                          {formatINRCompact(order.grandTotal)}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={order.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Carrier spend — a simple bar chart reads faster than a table here. */}
        <Card className="min-w-0">
          <CardHeader icon={TrendingUp} title="Spend by carrier" description="Freight billed, all time." />
          <CardBody className="flex flex-col gap-4">
            {d.byStatus.length === 0 ? (
              <p className="py-6 text-center text-xs text-ink-3">
                Book a consignment to see carrier spend.
              </p>
            ) : (
              d.byStatus.map((row) => {
                const value = row._sum.grandTotal ?? 0;
                const pct = topSpend > 0 ? Math.max(3, (value / topSpend) * 100) : 0;
                return (
                  <div key={row.partnerName}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <span className="truncate text-xs font-medium text-ink-2">
                        {row.partnerName}
                      </span>
                      <span className="tnum shrink-0 text-xs font-semibold text-ink">
                        {formatINRCompact(value)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-inset">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-[width] duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-ink-4">
                      {row._count._all} consignment{row._count._all === 1 ? "" : "s"}
                    </p>
                  </div>
                );
              })
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  progress,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
  progress?: number;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <p className="label-caps">{label}</p>
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-[10px] ring-1 ring-inset transition-colors",
            accent
              ? "bg-brand-500/10 text-brand-600 ring-brand-500/15 dark:text-brand-300"
              : "bg-inset text-ink-3 ring-line-soft",
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>

      <p className="tnum mt-3 text-[26px] leading-none font-bold tracking-[-0.03em] text-ink">
        {value}
      </p>
      <p className="mt-2 text-xs text-ink-3">{sub}</p>

      {typeof progress === "number" && (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-inset">
          <div
            className="h-full rounded-full bg-brand-500"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
