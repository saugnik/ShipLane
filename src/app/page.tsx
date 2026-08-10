import Link from "next/link";
import {
  ArrowUpRight,
  Boxes,
  IndianRupee,
  PackagePlus,
  Radar,
  Truck,
  Weight,
} from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/Card";
import { prisma } from "@/lib/db";
import { formatDate, formatINRCompact, formatKg, relativeTime } from "@/lib/utils";

// Counts and recent activity must reflect the booking that was just made.
export const dynamic = "force-dynamic";

async function loadDashboard() {
  const [total, inTransit, delivered, aggregates, recent, carriers] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({
      where: { status: { in: ["PICKED_UP", "IN_TRANSIT", "REACHED_DESTINATION_HUB", "OUT_FOR_DELIVERY"] } },
    }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.order.aggregate({ _sum: { grandTotal: true, chargedWeight: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.partner.count({ where: { active: true } }),
  ]);

  return {
    total,
    inTransit,
    delivered,
    freight: aggregates._sum.grandTotal ?? 0,
    weight: aggregates._sum.chargedWeight ?? 0,
    recent,
    carriers,
  };
}

export default async function DashboardPage() {
  const data = await loadDashboard();

  return (
    <>
      <PageHeader
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
          label="Consignments booked"
          value={String(data.total)}
          sub={`${data.carriers} carriers on panel`}
        />
        <Stat
          icon={Truck}
          label="In transit"
          value={String(data.inTransit)}
          sub={`${data.delivered} delivered to date`}
          tone="brand"
        />
        <Stat
          icon={Weight}
          label="Chargeable weight"
          value={formatKg(data.weight)}
          sub="Across all bookings"
        />
        <Stat
          icon={IndianRupee}
          label="Freight spend"
          value={formatINRCompact(data.freight)}
          sub="Inclusive of GST"
        />
      </div>

      <div className="mt-5">
        <Card>
          <CardHeader
            title="Recent consignments"
            description="The last eight bookings across every lane."
            action={
              <Link
                href="/orders"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
              >
                View all
                <ArrowUpRight className="size-3.5" />
              </Link>
            }
          />
          <CardBody className="p-0">
            {data.recent.length === 0 ? (
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
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr className="[&>th]:label-caps [&>th]:px-5 [&>th]:py-2.5">
                      <th>LRN</th>
                      <th>Lane</th>
                      <th>Carrier</th>
                      <th className="text-right">Boxes</th>
                      <th className="text-right">Weight</th>
                      <th className="text-right">Freight</th>
                      <th>Status</th>
                      <th className="text-right">ETA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recent.map((order) => (
                      <tr key={order.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="px-5 py-3">
                          <Link
                            href={`/orders/${order.lrn}`}
                            className="docnum font-semibold text-brand-700 hover:underline"
                          >
                            {order.lrn}
                          </Link>
                          <p className="text-[11px] text-slate-400">
                            {relativeTime(order.createdAt)}
                          </p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-800">
                            {order.pickupCity} → {order.dropCity}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {order.pickupState} → {order.dropState}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-slate-700">{order.partnerName ?? "—"}</td>
                        <td className="tnum px-5 py-3 text-right text-slate-700">
                          {order.totalBoxes}
                        </td>
                        <td className="tnum px-5 py-3 text-right text-slate-700">
                          {formatKg(order.chargedWeight)}
                        </td>
                        <td className="tnum px-5 py-3 text-right font-semibold text-slate-900">
                          {formatINRCompact(order.grandTotal)}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-5 py-3 text-right text-xs text-slate-600">
                          {formatDate(order.etaDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
  tone = "neutral",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  tone?: "neutral" | "brand";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="label-caps">{label}</p>
        <span
          className={
            tone === "brand"
              ? "grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-600"
              : "grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-500"
          }
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="tnum mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
    </div>
  );
}
