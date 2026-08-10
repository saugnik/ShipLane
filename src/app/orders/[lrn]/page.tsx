import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Boxes,
  Download,
  FileText,
  IndianRupee,
  MapPin,
  Radar,
  ScrollText,
  Tags,
  Truck,
} from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { AddScanForm } from "@/components/AddScanForm";
import { TrackingTimeline } from "@/components/TrackingTimeline";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, DataRow } from "@/components/ui/Card";
import { prisma } from "@/lib/db";
import {
  DELIVERY_TYPE_LABEL,
  MOT_LABEL,
  PAYMENT_LABEL,
  PICKUP_TYPE_LABEL,
  RISK_LABEL,
  formatDate,
  formatDateTime,
  formatINR,
  formatKg,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ lrn: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lrn } = await params;
  return { title: `Consignment ${lrn}` };
}

export default async function OrderDetailPage({ params }: { params: Params }) {
  const { lrn } = await params;

  const order = await prisma.order.findUnique({
    where: { lrn },
    include: {
      boxes: { orderBy: { lineNumber: "asc" } },
      events: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) notFound();

  return (
    <>
      <Link
        href="/orders"
        className="no-print mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-3 hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        All consignments
      </Link>

      <PageHeader
        title={`LRN ${order.lrn}`}
        description={`${order.pickupCity}, ${order.pickupState} → ${order.dropCity}, ${order.dropState} · booked ${formatDateTime(order.createdAt)}`}
        action={
          <div className="no-print flex flex-wrap gap-2">
            <ButtonLink
              href={`/api/orders/${order.lrn}/lr?download=1`}
              variant="secondary"
              target="_blank"
            >
              <FileText className="size-4" />
              Lorry Receipt
            </ButtonLink>
            <ButtonLink
              href={`/api/orders/${order.lrn}/box-tags?download=1`}
              variant="secondary"
              target="_blank"
            >
              <Tags className="size-4" />
              Box tags
            </ButtonLink>
            <ButtonLink href={`/track?lrn=${order.lrn}`}>
              <Radar className="size-4" />
              Public tracking
            </ButtonLink>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <StatusBadge status={order.status} />
        <Badge tone="neutral">Docket {order.oid}</Badge>
        <Badge tone="neutral">MAWB {order.mawb}</Badge>
        <Badge tone="brand">{order.partnerName ?? "Unassigned"}</Badge>
        <Badge tone="neutral">{MOT_LABEL[order.mot] ?? order.mot}</Badge>
        {order.ewayBill && <Badge tone="success">EWB {order.ewayBill}</Badge>}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5">
          {/* Tracking */}
          <Card>
            <CardHeader
              icon={Radar}
              title="Movement"
              description={`Expected delivery ${formatDate(order.etaDate)} · ${order.transitDays} working day${order.transitDays === 1 ? "" : "s"} committed`}
              action={<AddScanForm lrn={order.lrn} currentStatus={order.status} />}
            />
            <CardBody>
              <TrackingTimeline status={order.status} events={order.events} />
            </CardBody>
          </Card>

          {/* Route */}
          <Card>
            <CardHeader icon={MapPin} title="Route" />
            <CardBody className="grid gap-6 sm:grid-cols-2">
              <PartyBlock
                title={`Pickup — ${PICKUP_TYPE_LABEL[order.pickupType] ?? order.pickupType}`}
                accent="bg-brand-600"
                company={order.pickupCompany}
                contact={order.pickupContact}
                phone={order.pickupPhone}
                email={order.pickupEmail}
                address={order.pickupAddress}
                city={order.pickupCity}
                state={order.pickupState}
                pincode={order.pickupPincode}
                gstin={order.pickupGstin}
                product={order.pickupProduct}
              />
              <PartyBlock
                title={`Delivery — ${DELIVERY_TYPE_LABEL[order.deliveryType] ?? order.deliveryType}`}
                accent="bg-emerald-600"
                company={order.dropCompany}
                contact={order.dropContact}
                phone={order.dropPhone}
                email={order.dropEmail}
                address={order.dropAddress}
                city={order.dropCity}
                state={order.dropState}
                pincode={order.dropPincode}
                gstin={order.dropGstin}
                product={order.dropProduct}
              />
            </CardBody>
          </Card>

          {/* Box manifest */}
          <Card>
            <CardHeader
              icon={Boxes}
              title={`Box manifest — ${order.totalBoxes} carton${order.totalBoxes === 1 ? "" : "s"}`}
              description={`${order.boxes.length} line${order.boxes.length === 1 ? "" : "s"}. Tags are numbered continuously across the consignment.`}
              action={
                <a
                  href={`/api/orders/${order.lrn}/box-tags?download=1`}
                  className="no-print inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-300 hover:underline"
                >
                  <Download className="size-3.5" />
                  Download tags
                </a>
              }
            />
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="border-b border-line bg-sunken">
                    <tr className="[&>th]:label-caps [&>th]:px-5 [&>th]:py-2.5">
                      <th>Line</th>
                      <th className="text-right">Qty</th>
                      <th>Box tags</th>
                      <th>Description</th>
                      <th>Reference</th>
                      <th className="text-right">Weight/box</th>
                      <th className="text-right">L × B × H</th>
                      <th className="text-right">Line weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-soft">
                    {(() => {
                      // Tag numbers run continuously across the consignment, so
                      // each line shows the range its cartons occupy.
                      let cursor = 0;
                      return order.boxes.map((box) => {
                        const from = cursor + 1;
                        cursor += box.quantity;
                        return (
                          <tr key={box.id}>
                            <td className="tnum px-5 py-2.5 font-semibold text-ink-2">
                              {box.lineNumber}
                            </td>
                            <td className="tnum px-5 py-2.5 text-right font-semibold text-ink">
                              {box.quantity}
                            </td>
                            <td className="docnum px-5 py-2.5 text-ink-2">
                              {from === cursor ? `#${from}` : `#${from}–${cursor}`}
                            </td>
                            <td className="px-5 py-2.5 text-ink-2">{box.description}</td>
                            <td className="docnum px-5 py-2.5 text-ink-3">
                              {box.referenceId || "—"}
                            </td>
                            <td className="tnum px-5 py-2.5 text-right text-ink-2">
                              {formatKg(box.weightKg)}
                            </td>
                            <td className="tnum px-5 py-2.5 text-right text-ink-2">
                              {box.lengthCm} × {box.widthCm} × {box.heightCm} cm
                            </td>
                            <td className="tnum px-5 py-2.5 text-right font-medium text-ink">
                              {formatKg(box.weightKg * box.quantity)}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Side rail */}
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader icon={IndianRupee} title="Freight charges" />
            <CardBody>
              <dl className="flex flex-col">
                <DataRow label="Actual weight" value={formatKg(order.actualWeight)} />
                <DataRow label="Volumetric weight" value={formatKg(order.volumetricWeight)} />
                <DataRow label="Chargeable weight" value={formatKg(order.chargedWeight)} />
                <div className="my-1 border-t border-line" />
                <DataRow
                  label={`Freight @ ${formatINR(order.ratePerKg)}/kg`}
                  value={formatINR(order.freight)}
                />
                <DataRow label="Docket" value={formatINR(order.docketCharge)} />
                <DataRow label="Fuel surcharge" value={formatINR(order.fuelSurcharge)} />
                {order.fov > 0 && <DataRow label="FOV / risk" value={formatINR(order.fov)} />}
                {order.odaCharge > 0 && <DataRow label="ODA" value={formatINR(order.odaCharge)} />}
                {order.codCharge > 0 && <DataRow label="COD" value={formatINR(order.codCharge)} />}
                <div className="my-1 border-t border-line" />
                <DataRow label="Sub-total" value={formatINR(order.subtotal)} />
                <DataRow label="GST" value={formatINR(order.gstAmount)} />
              </dl>
              <div className="mt-3 flex items-baseline justify-between rounded-lg bg-brand-600 px-4 py-3 text-white">
                <span className="text-xs font-semibold tracking-wide uppercase opacity-80">
                  Total
                </span>
                <span className="tnum text-lg font-bold">{formatINR(order.grandTotal)}</span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader icon={ScrollText} title="Invoice & terms" />
            <CardBody>
              <dl className="flex flex-col">
                <DataRow label="Invoice number" value={order.invoiceNumber} mono />
                <DataRow label="Invoice value" value={formatINR(order.invoiceAmount)} />
                <DataRow label="E-Way Bill" value={order.ewayBill || "Not applicable"} mono />
                <DataRow
                  label="Freight payment"
                  value={PAYMENT_LABEL[order.freightPayment] ?? order.freightPayment}
                />
                <DataRow
                  label="Invoice value payment"
                  value={PAYMENT_LABEL[order.invoiceValuePayment] ?? order.invoiceValuePayment}
                />
                <DataRow label="Risk" value={RISK_LABEL[order.riskType] ?? order.riskType} />
                <DataRow label="POD on invoice" value={order.podOnInvoice ? "Required" : "Not required"} />
                <DataRow label="Said to contain" value={order.saidToContain} />
              </dl>
              {order.remarks && (
                <p className="mt-3 rounded-lg bg-sunken px-3 py-2 text-xs text-ink-2">
                  <span className="font-semibold text-ink-2">Remarks: </span>
                  {order.remarks}
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader icon={Truck} title="Carrier" />
            <CardBody>
              <dl className="flex flex-col">
                <DataRow label="Partner" value={order.partnerName ?? "—"} />
                <DataRow label="Code" value={order.partnerCode ?? "—"} mono />
                <DataRow label="Mode" value={MOT_LABEL[order.mot] ?? order.mot} />
                <DataRow label="Committed transit" value={`${order.transitDays} working days`} />
                <DataRow label="Expected delivery" value={formatDate(order.etaDate)} />
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function PartyBlock({
  title,
  accent,
  company,
  contact,
  phone,
  email,
  address,
  city,
  state,
  pincode,
  gstin,
  product,
}: {
  title: string;
  accent: string;
  company: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string | null;
  product: string;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-ink-3">
        <span className={`size-1.5 rounded-full ${accent}`} aria-hidden />
        {title}
      </p>
      <p className="text-sm font-semibold text-ink">{company}</p>
      {contact && <p className="text-xs text-ink-2">{contact}</p>}
      <p className="mt-1.5 text-xs leading-relaxed text-ink-2">{address}</p>
      <p className="text-xs text-ink-2">
        {city}, {state} — <span className="docnum">{pincode}</span>
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge tone="brand">{product}</Badge>
        {phone && <Badge tone="neutral">{phone}</Badge>}
        {email && <Badge tone="neutral">{email}</Badge>}
        {gstin && <Badge tone="neutral">GSTIN {gstin}</Badge>}
      </div>
    </div>
  );
}
