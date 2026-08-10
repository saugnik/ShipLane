import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Eye, IndianRupee, Boxes, Truck, Users } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/Card";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/guard";
import { formatDate, formatDateTime, formatINRCompact, formatKg, relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Oversight" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireRole("ADMIN", "/admin");

  const [accounts, orders, totals, events] = await Promise.all([
    prisma.account.findMany({
      where: { role: "USER" },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orders: true } } },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { createdBy: { select: { name: true, company: true, email: true } } },
    }),
    prisma.order.aggregate({
      _sum: { grandTotal: true, chargedWeight: true, totalBoxes: true },
      _count: { _all: true },
    }),
    prisma.trackingEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { order: { select: { lrn: true } } },
    }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Oversight"
        title="All activity"
        description="Every account's consignments, delivery commitments and scan history."
        action={
          <Badge tone="warning">
            <Eye className="size-3" />
            Read-only access
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Users} label="Accounts" value={String(accounts.length)} sub="Registered companies" />
        <Stat icon={Boxes} label="Consignments" value={String(totals._count._all)} sub={`${(totals._sum.totalBoxes ?? 0).toLocaleString("en-IN")} cartons`} />
        <Stat icon={Truck} label="Chargeable weight" value={formatKg(totals._sum.chargedWeight ?? 0)} sub="All accounts" />
        <Stat icon={IndianRupee} label="Freight billed" value={formatINRCompact(totals._sum.grandTotal ?? 0)} sub="Inclusive of GST" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card className="min-w-0">
          <CardHeader
            icon={Building2}
            title="Consignments across all accounts"
            description="Newest 40 bookings, with the company that raised each one."
          />
          <CardBody className="p-0">
            {orders.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={Boxes} title="No consignments yet" description="Bookings from every account will appear here." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-line [&>th]:label-caps [&>th]:px-5 [&>th]:py-2.5">
                      <th>LRN</th>
                      <th>Account</th>
                      <th>Lane</th>
                      <th>Product</th>
                      <th>Carrier</th>
                      <th className="text-right">Boxes</th>
                      <th className="text-right">Freight</th>
                      <th>Status</th>
                      <th className="text-right">Delivery by</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-line-soft transition-colors last:border-0 hover:bg-sunken">
                        <td className="px-5 py-3">
                          <Link href={`/orders/${o.lrn}`} className="docnum font-semibold text-brand-600 hover:underline dark:text-brand-300">
                            {o.lrn}
                          </Link>
                          <p className="mt-0.5 text-[11px] text-ink-4">{relativeTime(o.createdAt)}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-ink">{o.createdBy?.company || o.createdBy?.name || "—"}</p>
                          <p className="mt-0.5 truncate text-[11px] text-ink-4">{o.createdBy?.email ?? "seeded"}</p>
                        </td>
                        <td className="px-5 py-3 text-ink-2">
                          {o.pickupCity} <span className="text-ink-4">→</span> {o.dropCity}
                        </td>
                        <td className="max-w-40 truncate px-5 py-3 text-ink-2">{o.product}</td>
                        <td className="px-5 py-3 text-ink-2">{o.partnerName ?? "—"}</td>
                        <td className="tnum px-5 py-3 text-right text-ink-2">{o.totalBoxes}</td>
                        <td className="tnum px-5 py-3 text-right font-semibold text-ink">{formatINRCompact(o.grandTotal)}</td>
                        <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                        <td className="px-5 py-3 text-right text-xs text-ink-2">{formatDate(o.etaDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        <div className="flex min-w-0 flex-col gap-5">
          <Card>
            <CardHeader icon={Users} title="Accounts" description="Companies using the platform." />
            <CardBody className="flex flex-col gap-3 p-4">
              {accounts.length === 0 && <p className="px-1 py-4 text-center text-xs text-ink-3">No accounts registered yet.</p>}
              {accounts.map((a) => (
                <div key={a.id} className="rounded-lg border border-line bg-sunken px-3.5 py-3">
                  <p className="truncate text-[13px] font-semibold text-ink">{a.company || a.name}</p>
                  <p className="mt-0.5 truncate text-[11px] text-ink-3">{a.email}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge tone="neutral">{a._count.orders} consignment{a._count.orders === 1 ? "" : "s"}</Badge>
                    {a.phone && <Badge tone="neutral">{a.phone}</Badge>}
                    {!a.active && <Badge tone="danger">Inactive</Badge>}
                  </div>
                  <p className="mt-2 text-[11px] text-ink-4">
                    Last seen {a.lastLoginAt ? relativeTime(a.lastLoginAt) : "never"}
                  </p>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader icon={Eye} title="Scan log" description="Latest movement across every consignment." />
            <CardBody className="p-0">
              <ol className="divide-y divide-line-soft">
                {events.length === 0 && <li className="px-5 py-6 text-center text-xs text-ink-3">No scans recorded yet.</li>}
                {events.map((e) => (
                  <li key={e.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/orders/${e.order.lrn}`} className="docnum text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300">
                        {e.order.lrn}
                      </Link>
                      <StatusBadge status={e.status} />
                    </div>
                    <p className="mt-1 text-[11px] text-ink-3">{e.location}</p>
                    <p className="text-[11px] text-ink-4">{formatDateTime(e.createdAt)}</p>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="label-caps">{label}</p>
        <span className="grid size-8 place-items-center rounded-[10px] bg-inset text-ink-3 ring-1 ring-inset ring-line-soft">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="tnum mt-3 text-[26px] leading-none font-bold tracking-[-0.03em] text-ink">{value}</p>
      <p className="mt-2 text-xs text-ink-3">{sub}</p>
    </div>
  );
}
