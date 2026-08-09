"use client";

import { useMemo } from "react";
import { Boxes, Copy, Layers, Plus, Trash2, Truck } from "lucide-react";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/Card";
import { Checkbox, Field, Input, Segmented, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { BoxForm, ShipmentForm, StepErrors } from "@/lib/bookingState";
import { emptyBox } from "@/lib/bookingState";
import { cn, formatKg } from "@/lib/utils";

/** Matches the divisor used by most Indian surface carriers. */
const PREVIEW_DIVISOR = 5000;

export function StepCargo({
  shipment,
  boxes,
  onShipmentChange,
  onBoxesChange,
  errors,
}: {
  shipment: ShipmentForm;
  boxes: BoxForm[];
  onShipmentChange: (next: ShipmentForm) => void;
  onBoxesChange: (next: BoxForm[]) => void;
  errors: StepErrors;
}) {
  const setShipment = <K extends keyof ShipmentForm>(key: K, v: ShipmentForm[K]) =>
    onShipmentChange({ ...shipment, [key]: v });

  const totals = useMemo(() => {
    let actual = 0;
    let volumetric = 0;
    for (const b of boxes) {
      actual += Number(b.weightKg) || 0;
      volumetric +=
        ((Number(b.lengthCm) || 0) * (Number(b.widthCm) || 0) * (Number(b.heightCm) || 0)) /
        PREVIEW_DIVISOR;
    }
    return { actual, volumetric, chargeable: Math.max(actual, volumetric) };
  }, [boxes]);

  const nextBoxNumber = () =>
    boxes.reduce((max, b) => Math.max(max, Number(b.boxNumber) || 0), 0) + 1;

  const addBox = () => {
    const n = nextBoxNumber();
    onBoxesChange([...boxes, emptyBox(`box-${n}-${boxes.length}`, n)]);
  };

  /** Most consignments are N identical cartons; cloning beats retyping. */
  const duplicateBox = (index: number) => {
    const source = boxes[index];
    const n = nextBoxNumber();
    onBoxesChange([
      ...boxes.slice(0, index + 1),
      { ...source, key: `box-${n}-${boxes.length}`, boxNumber: String(n) },
      ...boxes.slice(index + 1),
    ]);
  };

  const removeBox = (index: number) => {
    if (boxes.length === 1) return;
    onBoxesChange(boxes.filter((_, i) => i !== index));
  };

  const updateBox = (index: number, patch: Partial<BoxForm>) =>
    onBoxesChange(boxes.map((b, i) => (i === index ? { ...b, ...patch } : b)));

  /** Apply the first row's carton size to every box. */
  const applyDimensionsToAll = () => {
    const [first] = boxes;
    if (!first) return;
    onBoxesChange(
      boxes.map((b) => ({
        ...b,
        lengthCm: first.lengthCm,
        widthCm: first.widthCm,
        heightCm: first.heightCm,
        weightKg: b.weightKg || first.weightKg,
      })),
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ---------------------------------------------- shipping details */}
      <Card>
        <CardHeader
          icon={Truck}
          title="Shipping details"
          description="How the consignment moves and who pays for what."
        />
        <CardBody className="grid gap-5 sm:grid-cols-2">
          <Field label="Mode of transport">
            {() => (
              <Segmented
                value={shipment.mot}
                onChange={(v) => setShipment("mot", v)}
                options={[
                  { value: "ROAD", label: "Road" },
                  { value: "AIR", label: "Air" },
                  { value: "RAIL", label: "Rail" },
                ]}
              />
            )}
          </Field>

          <Field label="Freight payment">
            {() => (
              <Segmented
                value={shipment.freightPayment}
                onChange={(v) => setShipment("freightPayment", v)}
                options={[
                  { value: "BTC", label: "Bill to client" },
                  { value: "PAID", label: "Paid" },
                  { value: "TO_PAY", label: "To pay" },
                ]}
              />
            )}
          </Field>

          <Field label="Pickup type">
            {() => (
              <Segmented
                value={shipment.pickupType}
                onChange={(v) => setShipment("pickupType", v)}
                options={[
                  { value: "SCHEDULED_PICKUP", label: "Scheduled pickup" },
                  { value: "SELF_DROP", label: "Self drop" },
                ]}
              />
            )}
          </Field>

          <Field label="Delivery type">
            {() => (
              <Segmented
                value={shipment.deliveryType}
                onChange={(v) => setShipment("deliveryType", v)}
                options={[
                  { value: "DOOR_DELIVERY", label: "Door delivery" },
                  { value: "SELF_COLLECT", label: "Self collect" },
                ]}
              />
            )}
          </Field>

          <Field label="Invoice value payment">
            {() => (
              <Segmented
                value={shipment.invoiceValuePayment}
                onChange={(v) => setShipment("invoiceValuePayment", v)}
                options={[
                  { value: "PREPAID", label: "Pre-paid" },
                  { value: "COD", label: "COD" },
                ]}
              />
            )}
          </Field>

          <Field
            label="Risk coverage"
            hint={
              shipment.riskType === "CARRIER"
                ? "Carrier insures the goods — an FOV charge applies on invoice value."
                : "Goods move at owner's risk. No FOV charge, no carrier liability for damage."
            }
          >
            {() => (
              <Segmented
                value={shipment.riskType}
                onChange={(v) => setShipment("riskType", v)}
                options={[
                  { value: "OWNER", label: "Owner risk" },
                  { value: "CARRIER", label: "Carrier risk" },
                ]}
              />
            )}
          </Field>

          <Field
            label="Said to contain"
            required
            error={errors["shipment.saidToContain"]}
            hint="Printed on the LR as the declared contents"
            className="sm:col-span-2"
          >
            {({ id, invalid }) => (
              <Input
                id={id}
                invalid={invalid}
                placeholder="e.g. Bamboo tableware — 10 cartons"
                value={shipment.saidToContain}
                onChange={(e) => setShipment("saidToContain", e.target.value)}
              />
            )}
          </Field>

          <Field label="Remarks for the driver" className="sm:col-span-2">
            {({ id }) => (
              <Textarea
                id={id}
                rows={2}
                placeholder="Gate number, dock timings, fragile handling notes…"
                value={shipment.remarks}
                onChange={(e) => setShipment("remarks", e.target.value)}
              />
            )}
          </Field>

          <div className="sm:col-span-2">
            <Checkbox
              checked={shipment.podOnInvoice}
              onChange={(v) => setShipment("podOnInvoice", v)}
              label="Proof of delivery required on invoice copy"
              hint="Carrier returns a stamped copy of your invoice after delivery."
            />
          </div>
        </CardBody>
      </Card>

      {/* ---------------------------------------------- boxes */}
      <Card>
        <CardHeader
          icon={Boxes}
          title="Box dimensions"
          description="One row per carton. Each row prints its own scannable box tag."
          action={
            <div className="flex items-center gap-2">
              {boxes.length > 1 && (
                <Button variant="ghost" size="sm" onClick={applyDimensionsToAll} type="button">
                  <Layers className="size-3.5" />
                  Same size for all
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={addBox} type="button">
                <Plus className="size-3.5" />
                Add box
              </Button>
            </div>
          }
        />

        <CardBody className="p-0">
          {/* Column headers — desktop only; each card repeats its labels on mobile. */}
          <div className="hidden grid-cols-[56px_1.6fr_1fr_84px_repeat(3,72px)_40px] gap-2 border-b border-slate-200 bg-slate-50 px-5 py-2.5 lg:grid">
            {["Box #", "Product description", "Reference ID", "Weight (kg)", "L (cm)", "B (cm)", "H (cm)", ""].map(
              (h) => (
                <span key={h} className="label-caps truncate">
                  {h}
                </span>
              ),
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {boxes.map((box, i) => (
              <BoxRow
                key={box.key}
                index={i}
                box={box}
                errors={errors}
                canRemove={boxes.length > 1}
                onChange={(patch) => updateBox(i, patch)}
                onDuplicate={() => duplicateBox(i)}
                onRemove={() => removeBox(i)}
              />
            ))}
          </div>
        </CardBody>

        <CardFooter>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Summary label="Boxes" value={String(boxes.length)} />
            <Summary label="Actual weight" value={formatKg(totals.actual)} />
            <Summary label="Volumetric" value={formatKg(totals.volumetric)} />
            <Summary
              label="Chargeable"
              value={formatKg(totals.chargeable)}
              emphasis
              hint={
                totals.volumetric > totals.actual
                  ? "Volumetric weight is higher — carriers will bill on volume"
                  : undefined
              }
            />
          </div>
          <Badge tone={totals.volumetric > totals.actual ? "warning" : "neutral"}>
            Divisor {PREVIEW_DIVISOR} — indicative
          </Badge>
        </CardFooter>
      </Card>
    </div>
  );
}

function Summary({
  label,
  value,
  emphasis,
  hint,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  hint?: string;
}) {
  return (
    <div title={hint}>
      <p className="label-caps">{label}</p>
      <p
        className={cn(
          "tnum text-sm font-semibold",
          emphasis ? "text-brand-700" : "text-slate-800",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function BoxRow({
  index,
  box,
  errors,
  canRemove,
  onChange,
  onDuplicate,
  onRemove,
}: {
  index: number;
  box: BoxForm;
  errors: StepErrors;
  canRemove: boolean;
  onChange: (patch: Partial<BoxForm>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const err = (field: string) => errors[`boxes.${index}.${field}`];
  const hasError = ["boxNumber", "description", "weightKg", "lengthCm", "widthCm", "heightCm"].some(
    (f) => err(f),
  );

  const cell = (
    label: string,
    field: keyof BoxForm,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div className="flex flex-col gap-1">
      <span className="label-caps lg:hidden">{label}</span>
      <Input
        aria-label={`Box ${box.boxNumber} ${label}`}
        invalid={Boolean(err(field))}
        value={box[field] as string}
        onChange={(e) => onChange({ [field]: e.target.value } as Partial<BoxForm>)}
        {...props}
      />
      {err(field) && <span className="text-[11px] font-medium text-rose-600">{err(field)}</span>}
    </div>
  );

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 px-5 py-4 sm:grid-cols-3 lg:grid-cols-[56px_1.6fr_1fr_84px_repeat(3,72px)_40px] lg:items-start lg:gap-2",
        hasError && "bg-rose-50/40",
      )}
    >
      {cell("Box #", "boxNumber", { inputMode: "numeric", className: "tnum text-center" })}
      {cell("Product description", "description", { placeholder: "e.g. Bamboo plates 9in" })}
      {cell("Reference ID", "referenceId", { placeholder: "Optional SKU / PO" })}
      {cell("Weight (kg)", "weightKg", { type: "number", min: 0, step: "0.01", className: "tnum" })}
      {cell("L (cm)", "lengthCm", { type: "number", min: 0, step: "0.1", className: "tnum" })}
      {cell("B (cm)", "widthCm", { type: "number", min: 0, step: "0.1", className: "tnum" })}
      {cell("H (cm)", "heightCm", { type: "number", min: 0, step: "0.1", className: "tnum" })}

      <div className="col-span-2 flex items-center justify-end gap-1 sm:col-span-3 lg:col-span-1 lg:pt-0.5">
        <button
          type="button"
          onClick={onDuplicate}
          title="Duplicate this box"
          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <Copy className="size-4" />
          <span className="sr-only">Duplicate box {box.boxNumber}</span>
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          title={canRemove ? "Remove this box" : "A consignment needs at least one box"}
          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
        >
          <Trash2 className="size-4" />
          <span className="sr-only">Remove box {box.boxNumber}</span>
        </button>
      </div>
    </div>
  );
}
