"use client";

import { CheckCircle2, Download, FileText, PackagePlus, Radar, Tags } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, DataRow } from "@/components/ui/Card";
import { formatDate, formatINR, formatKg } from "@/lib/utils";

export type CreatedOrder = {
  lrn: string;
  oid: string;
  mawb: string;
  partnerName: string | null;
  etaDate: string | null;
  chargedWeight: number;
  grandTotal: number;
  transitDays: number;
  dropCity: string;
  dropState: string;
  pickupCity: string;
  pickupState: string;
  boxes: Array<{ boxNumber: number; awb: string }>;
};

export function BookingSuccess({ order, onNew }: { order: CreatedOrder; onNew: () => void }) {
  const boxCount = order.boxes.length;

  return (
    <div className="animate-in-up mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center">
        <CheckCircle2 className="size-11 text-emerald-600" />
        <h2 className="text-lg font-bold text-emerald-900">Consignment booked</h2>
        <p className="max-w-md text-sm text-emerald-800">
          {boxCount} box{boxCount === 1 ? "" : "es"} manifested from {order.pickupCity} to{" "}
          {order.dropCity}. Print the LR and the box tags before handover.
        </p>
        <p className="docnum mt-1 rounded-lg bg-white px-4 py-2 text-lg font-bold tracking-wider text-emerald-900 shadow-card">
          {order.lrn}
        </p>
        <Badge tone="success">LRN — quote this number for all tracking</Badge>
      </div>

      <Card>
        <CardHeader
          icon={FileText}
          title="Documents"
          description="Three LR copies (shipper, last-mile POD, recipient) and one 4×2 in tag per carton."
        />
        <CardBody className="grid gap-3 sm:grid-cols-2">
          <DocumentTile
            icon={FileText}
            title="Lorry Receipt"
            subtitle="3 copies · Letter landscape"
            href={`/api/orders/${order.lrn}/lr`}
            downloadHref={`/api/orders/${order.lrn}/lr?download=1`}
          />
          <DocumentTile
            icon={Tags}
            title="Box tags"
            subtitle={`${boxCount + 1} labels · 4 × 2 in`}
            href={`/api/orders/${order.lrn}/box-tags`}
            downloadHref={`/api/orders/${order.lrn}/box-tags?download=1`}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={Radar} title="Booking summary" />
        <CardBody>
          <dl className="grid gap-x-10 sm:grid-cols-2">
            <DataRow label="LRN" value={order.lrn} mono />
            <DataRow label="Order ID" value={order.oid} mono />
            <DataRow label="Master AWB" value={order.mawb} mono />
            <DataRow label="Carrier" value={order.partnerName ?? "—"} />
            <DataRow label="Chargeable weight" value={formatKg(order.chargedWeight)} />
            <DataRow label="Boxes" value={String(boxCount)} />
            <DataRow
              label="Expected delivery"
              value={`${formatDate(order.etaDate)} · ${order.transitDays} working day${order.transitDays === 1 ? "" : "s"}`}
            />
            <DataRow label="Freight payable" value={formatINR(order.grandTotal)} />
          </dl>
        </CardBody>
      </Card>

      <div className="flex flex-wrap gap-2">
        <ButtonLink href={`/orders/${order.lrn}`}>
          Open consignment
        </ButtonLink>
        <ButtonLink href={`/track?lrn=${order.lrn}`} variant="secondary">
          <Radar className="size-4" />
          Track
        </ButtonLink>
        <Button variant="ghost" onClick={onNew}>
          <PackagePlus className="size-4" />
          Book another
        </Button>
      </div>
    </div>
  );
}

function DocumentTile({
  icon: Icon,
  title,
  subtitle,
  href,
  downloadHref,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  href: string;
  downloadHref: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
        <p className="truncate text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="flex shrink-0 gap-1">
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="rounded-md px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
        >
          Preview
        </a>
        <a
          href={downloadHref}
          className="grid size-7 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          title={`Download ${title}`}
        >
          <Download className="size-4" />
        </a>
      </div>
    </div>
  );
}
