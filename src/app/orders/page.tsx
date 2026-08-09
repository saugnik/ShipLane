import type { Metadata } from "next";
import Link from "next/link";
import { FileText, PackagePlus, Search, Tags } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { StatusBadge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardFooter, EmptyState } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import { prisma } from "@/lib/db";
import { buildOrderFilter } from "@/lib/orderFilter";
import {
  ORDER_STATUSES,
  STATUS_LABEL,
  formatDate,
  formatINR,
  formatKg,
  relativeTime,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Consignments" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type SearchParams = Promise<{ q?: string; status?: string; page?: string }>;

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const where = buildOrderFilter(q, status);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { boxes: true } } },
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const buildHref = (nextPage: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    if (nextPage > 1) sp.set("page", String(nextPage));
    const qs = sp.toString();
    return qs ? `/orders?${qs}` : "/orders";
  };

  return (
    <>
      <PageHeader
        title="Consignments"
        description={`${total} booking${total === 1 ? "" : "s"} on record.`}
        action={
          <ButtonLink href="/book">
            <PackagePlus className="size-4" />
            New booking
          </ButtonLink>
        }
      />

      <Card>
        {/* Plain GET form — filtering keeps working with JS disabled and the
            resulting URL is shareable. */}
        <form className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-4" action="/orders">
          <div className="relative min-w-56 flex-1">
            <label htmlFor="q" className="label-caps mb-1 block">
              Search
            </label>
            <Search className="pointer-events-none absolute bottom-3 left-3 size-4 text-slate-400" />
            <Input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="LRN, docket, invoice, company or city"
              className="pl-9"
            />
          </div>

          <div className="w-48">
            <label htmlFor="status" className="label-caps mb-1 block">
              Status
            </label>
            <Select id="status" name="status" defaultValue={status}>
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </div>

          <Button type="submit" variant="secondary">
            Apply
          </Button>
          {(q || status) && (
            <Link
              href="/orders"
              className="pb-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Clear
            </Link>
          )}
        </form>

        <CardBody className="p-0">
          {orders.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={PackagePlus}
                title={q || status ? "No consignments match those filters" : "No consignments yet"}
                description={
                  q || status
                    ? "Try a different search term, or clear the filters to see everything."
                    : "Book your first shipment to generate an LR, box tags and a live tracking trail."
                }
                action={<ButtonLink href="/book">Book a shipment</ButtonLink>}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr className="[&>th]:label-caps [&>th]:px-5 [&>th]:py-2.5">
                    <th>LRN / docket</th>
                    <th>Lane</th>
                    <th>Consignee</th>
                    <th>Carrier</th>
                    <th className="text-right">Boxes</th>
                    <th className="text-right">Weight</th>
                    <th className="text-right">Freight</th>
                    <th>Status</th>
                    <th className="text-right">Documents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-3">
                        <Link
                          href={`/orders/${order.lrn}`}
                          className="docnum font-semibold text-brand-700 hover:underline"
                        >
                          {order.lrn}
                        </Link>
                        <p className="text-[11px] text-slate-400">
                          {relativeTime(order.createdAt)} · inv {order.invoiceNumber}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-800">
                          {order.pickupCity} → {order.dropCity}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          ETA {formatDate(order.etaDate)}
                        </p>
                      </td>
                      <td className="max-w-44 truncate px-5 py-3 text-slate-700">
                        {order.dropCompany}
                      </td>
                      <td className="px-5 py-3 text-slate-700">{order.partnerName ?? "—"}</td>
                      <td className="tnum px-5 py-3 text-right text-slate-700">
                        {order._count.boxes}
                      </td>
                      <td className="tnum px-5 py-3 text-right text-slate-700">
                        {formatKg(order.chargedWeight)}
                      </td>
                      <td className="tnum px-5 py-3 text-right font-semibold text-slate-900">
                        {formatINR(order.grandTotal)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <a
                            href={`/api/orders/${order.lrn}/lr`}
                            target="_blank"
                            rel="noreferrer"
                            title="Lorry Receipt (3 copies)"
                            className="grid size-7 place-items-center rounded-md text-slate-400 hover:bg-brand-50 hover:text-brand-700"
                          >
                            <FileText className="size-4" />
                            <span className="sr-only">LR for {order.lrn}</span>
                          </a>
                          <a
                            href={`/api/orders/${order.lrn}/box-tags`}
                            target="_blank"
                            rel="noreferrer"
                            title="Box tags"
                            className="grid size-7 place-items-center rounded-md text-slate-400 hover:bg-brand-50 hover:text-brand-700"
                          >
                            <Tags className="size-4" />
                            <span className="sr-only">Box tags for {order.lrn}</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>

        {totalPages > 1 && (
          <CardFooter>
            <p className="text-xs text-slate-500">
              Page {page} of {totalPages} · {total} consignments
            </p>
            <div className="flex gap-2">
              <ButtonLink
                href={buildHref(page - 1)}
                variant="secondary"
                size="sm"
                aria-disabled={page === 1}
                className={page === 1 ? "pointer-events-none opacity-40" : undefined}
              >
                Previous
              </ButtonLink>
              <ButtonLink
                href={buildHref(page + 1)}
                variant="secondary"
                size="sm"
                aria-disabled={page === totalPages}
                className={page === totalPages ? "pointer-events-none opacity-40" : undefined}
              >
                Next
              </ButtonLink>
            </div>
          </CardFooter>
        )}
      </Card>
    </>
  );
}
