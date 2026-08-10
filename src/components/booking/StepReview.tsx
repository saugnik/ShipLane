"use client";

import { Boxes, MapPin, Pencil, ScrollText, Truck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader, DataRow } from "@/components/ui/Card";
import type { BookingState, StepId } from "@/lib/bookingState";
import type { Quote } from "@/lib/pricing";
import {
  DELIVERY_TYPE_LABEL,
  MOT_LABEL,
  PAYMENT_LABEL,
  PICKUP_TYPE_LABEL,
  RISK_LABEL,
  formatDate,
  formatINR,
  formatKg,
} from "@/lib/utils";

export function StepReview({
  state,
  quote,
  onEdit,
}: {
  state: BookingState;
  quote: Quote | null;
  onEdit: (step: StepId) => void;
}) {
  const boxCount = state.boxes.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-5">
        {/* Route */}
        <Card>
          <CardHeader
            icon={MapPin}
            title="Route"
            action={<EditButton onClick={() => onEdit("route")} />}
          />
          <CardBody className="flex flex-col gap-5">
            <div className="flex items-center gap-2 rounded-lg bg-sunken px-3.5 py-2.5">
              <span className="label-caps">Product</span>
              <span className="text-[13px] font-semibold text-ink">{state.product || "—"}</span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <PartySummary title="Pickup from" party={state.pickup} accent="bg-brand-600" />
              <PartySummary title="Deliver to" party={state.drop} accent="bg-emerald-600" />
            </div>
          </CardBody>
        </Card>

        {/* Invoice */}
        <Card>
          <CardHeader
            icon={ScrollText}
            title="Invoice & documents"
            action={<EditButton onClick={() => onEdit("invoice")} />}
          />
          <CardBody>
            <dl className="grid gap-x-8 sm:grid-cols-2">
              <DataRow label="Invoice number" value={state.invoice.invoiceNumber || "—"} mono />
              <DataRow
                label="Invoice value"
                value={formatINR(Number(state.invoice.invoiceAmount || 0))}
              />
              <DataRow label="E-Way Bill" value={state.invoice.ewayBill || "Not applicable"} mono />
              <DataRow
                label="POD on invoice"
                value={state.shipment.podOnInvoice ? "Required" : "Not required"}
              />
            </dl>
          </CardBody>
        </Card>

        {/* Cargo */}
        <Card>
          <CardHeader
            icon={Boxes}
            title={`Cargo — ${boxCount} box${boxCount === 1 ? "" : "es"}`}
            action={<EditButton onClick={() => onEdit("cargo")} />}
          />
          <CardBody className="flex flex-col gap-4">
            <dl className="grid gap-x-8 sm:grid-cols-2">
              <DataRow label="Mode" value={MOT_LABEL[state.shipment.mot]} />
              <DataRow label="Said to contain" value={state.shipment.saidToContain || "—"} />
              <DataRow label="Pickup" value={PICKUP_TYPE_LABEL[state.shipment.pickupType]} />
              <DataRow label="Delivery" value={DELIVERY_TYPE_LABEL[state.shipment.deliveryType]} />
              <DataRow label="Freight payment" value={PAYMENT_LABEL[state.shipment.freightPayment]} />
              <DataRow label="Risk" value={RISK_LABEL[state.shipment.riskType]} />
            </dl>

            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-left text-xs">
                <thead className="bg-sunken">
                  <tr className="[&>th]:label-caps [&>th]:px-3 [&>th]:py-2">
                    <th className="text-right">Qty</th>
                    <th>Description</th>
                    <th>Reference</th>
                    <th className="text-right">Weight/box</th>
                    <th className="text-right">L × B × H</th>
                    <th className="text-right">Line weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {state.boxes.map((b) => {
                    const qty = Number(b.quantity || 0);
                    return (
                      <tr key={b.key} className="[&>td]:px-3 [&>td]:py-2">
                        <td className="tnum text-right font-semibold text-ink-2">{qty}</td>
                        <td className="text-ink-2">{b.description || "—"}</td>
                        <td className="docnum text-ink-3">{b.referenceId || "—"}</td>
                        <td className="tnum text-right text-ink-2">
                          {formatKg(Number(b.weightKg || 0))}
                        </td>
                        <td className="tnum text-right text-ink-2">
                          {b.lengthCm || 0} × {b.widthCm || 0} × {b.heightCm || 0} cm
                        </td>
                        <td className="tnum text-right font-medium text-ink">
                          {formatKg(Number(b.weightKg || 0) * qty)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Price rail */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <Card>
          <CardHeader
            icon={Truck}
            title="Freight charges"
            action={<EditButton onClick={() => onEdit("carrier")} />}
          />
          {quote ? (
            <CardBody className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span
                  className="size-9 shrink-0 rounded-lg"
                  style={{ backgroundColor: quote.accent }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {quote.partnerName}
                  </p>
                  <p className="text-xs text-ink-3">
                    {MOT_LABEL[state.shipment.mot]} · {quote.transitDays} working day
                    {quote.transitDays === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-sunken px-3 py-2.5">
                <p className="label-caps">Expected delivery</p>
                <p className="text-sm font-semibold text-ink">{formatDate(quote.etaDate)}</p>
              </div>

              <dl className="flex flex-col">
                <DataRow label="Chargeable weight" value={formatKg(quote.chargedWeight)} />
                <DataRow label="Freight" value={formatINR(quote.freight)} />
                <DataRow label="Docket" value={formatINR(quote.docketCharge)} />
                <DataRow label="Fuel surcharge" value={formatINR(quote.fuelSurcharge)} />
                {quote.fov > 0 && <DataRow label="FOV / risk" value={formatINR(quote.fov)} />}
                {quote.odaCharge > 0 && <DataRow label="ODA" value={formatINR(quote.odaCharge)} />}
                {quote.codCharge > 0 && <DataRow label="COD" value={formatINR(quote.codCharge)} />}
                <div className="my-1 border-t border-line" />
                <DataRow label="Sub-total" value={formatINR(quote.subtotal)} />
                <DataRow label={`GST @ ${quote.gstPct}%`} value={formatINR(quote.gstAmount)} />
              </dl>

              <div className="flex items-baseline justify-between rounded-lg bg-brand-600 px-4 py-3 text-white">
                <span className="text-xs font-semibold tracking-wide uppercase opacity-80">
                  Total payable
                </span>
                <span className="tnum text-lg font-bold">{formatINR(quote.grandTotal)}</span>
              </div>

              <p className="text-[11px] leading-relaxed text-ink-3">
                Charges are locked at booking. Reweighing at the origin hub can revise the
                chargeable weight; any difference appears on your monthly invoice.
              </p>
            </CardBody>
          ) : (
            <CardBody>
              <p className="text-sm text-ink-3">
                No carrier selected yet. Go back to the carrier step to pick one.
              </p>
            </CardBody>
          )}
        </Card>
      </div>
    </div>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-brand-600 dark:text-brand-300 transition-colors hover:bg-brand-500/10"
    >
      <Pencil className="size-3" />
      Edit
    </button>
  );
}

function PartySummary({
  title,
  party,
  accent,
}: {
  title: string;
  party: BookingState["pickup"];
  accent: string;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-ink-3">
        <span className={`size-1.5 rounded-full ${accent}`} aria-hidden />
        {title}
      </p>
      <p className="text-sm font-semibold text-ink">{party.company || "—"}</p>
      {party.contact && <p className="text-xs text-ink-2">{party.contact}</p>}
      <p className="mt-1.5 text-xs leading-relaxed text-ink-2">{party.address || "—"}</p>
      <p className="text-xs text-ink-2">
        {party.city}
        {party.city && party.state ? ", " : ""}
        {party.state} — <span className="docnum">{party.pincode}</span>
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {party.phone && <Badge tone="neutral">{party.phone}</Badge>}
        {party.gstin && <Badge tone="neutral">GSTIN {party.gstin}</Badge>}
      </div>
    </div>
  );
}
