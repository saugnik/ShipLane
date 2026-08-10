"use client";

import { FileText, IndianRupee, ScrollText, TriangleAlert } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import type { InvoiceForm, StepErrors } from "@/lib/bookingState";
import { EWAY_BILL_THRESHOLD } from "@/lib/validation";
import { formatINR } from "@/lib/utils";

export function StepInvoice({
  value,
  onChange,
  errors,
}: {
  value: InvoiceForm;
  onChange: (next: InvoiceForm) => void;
  errors: StepErrors;
}) {
  const amount = Number(value.invoiceAmount || 0);
  const ewayRequired = amount > EWAY_BILL_THRESHOLD;

  const set = <K extends keyof InvoiceForm>(key: K, v: InvoiceForm[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <Card>
      <CardHeader
        icon={ScrollText}
        title="Invoice & statutory documents"
        description="These print on the LR and travel in the document envelope with the consignment."
      />
      <CardBody className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Invoice number" required error={errors["invoice.invoiceNumber"]}>
            {({ id, invalid }) => (
              <div className="relative">
                <FileText className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-4" />
                <Input
                  id={id}
                  invalid={invalid}
                  className="docnum pl-9"
                  placeholder="e.g. INV-2026-00184"
                  value={value.invoiceNumber}
                  onChange={(e) => set("invoiceNumber", e.target.value)}
                />
              </div>
            )}
          </Field>

          <Field
            label="Total invoice value"
            error={errors["invoice.invoiceAmount"]}
            hint={amount > 0 ? formatINR(amount) : "Declared value of the goods"}
          >
            {({ id, invalid }) => (
              <div className="relative">
                <IndianRupee className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-4" />
                <Input
                  id={id}
                  invalid={invalid}
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  className="tnum pl-9"
                  placeholder="0.00"
                  value={value.invoiceAmount}
                  onChange={(e) => set("invoiceAmount", e.target.value)}
                />
              </div>
            )}
          </Field>
        </div>

        <Field
          label="E-Way Bill number"
          required={ewayRequired}
          error={errors["invoice.ewayBill"]}
          hint="12 digits, as generated on the GST e-Way Bill portal"
        >
          {({ id, invalid }) => (
            <Input
              id={id}
              invalid={invalid}
              inputMode="numeric"
              maxLength={12}
              className="docnum"
              placeholder="12-digit EWB number"
              value={value.ewayBill}
              onChange={(e) => set("ewayBill", e.target.value.replace(/\D/g, "").slice(0, 12))}
            />
          )}
        </Field>

        {ewayRequired && (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-xs text-amber-700 dark:text-amber-300 dark:text-amber-200">
            <TriangleAlert className="mt-px size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p>
              <span className="font-semibold">E-Way Bill required.</span> Invoice value is above{" "}
              {formatINR(EWAY_BILL_THRESHOLD)}, so the consignment cannot legally move without a
              valid EWB. Vehicles are stopped and penalised at state check posts without it.
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
