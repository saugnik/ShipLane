"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, MapPin, RotateCcw, ShieldCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PartyForm } from "@/components/booking/PartyForm";
import { StepCargo } from "@/components/booking/StepCargo";
import { StepCarrier } from "@/components/booking/StepCarrier";
import { StepInvoice } from "@/components/booking/StepInvoice";
import { StepReview } from "@/components/booking/StepReview";
import { Stepper } from "@/components/booking/Stepper";
import { BookingSuccess, type CreatedOrder } from "@/components/booking/BookingSuccess";
import {
  STEPS,
  canReach,
  initialBooking,
  pricingSignature,
  quoteRequestFrom,
  toCreatePayload,
  validateStep,
  type BookingState,
  type StepId,
  type StepErrors,
} from "@/lib/bookingState";
import type { Quote } from "@/lib/pricing";

const DRAFT_KEY = "shiplane.booking.draft.v1";

export function BookingWizard() {
  const [state, setState] = useState<BookingState>(initialBooking);
  const [step, setStep] = useState<StepId>("route");
  const [errors, setErrors] = useState<StepErrors>({});
  const [quote, setQuote] = useState<Quote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedOrder | null>(null);
  const [restored, setRestored] = useState(false);

  // ---- draft persistence ------------------------------------------------
  // A freight booking has ~40 fields. Losing it to a refresh is unacceptable,
  // so the draft round-trips through sessionStorage until the order is placed.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as BookingState;
      if (draft?.pickup && draft?.boxes?.length) {
        setState(draft);
        setRestored(true);
      }
    } catch {
      /* a corrupt draft is not worth surfacing — start clean */
    }
  }, []);

  useEffect(() => {
    if (created) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(state));
    } catch {
      /* private mode / quota — draft saving is best-effort */
    }
  }, [state, created]);

  const signature = useMemo(() => pricingSignature(state), [state]);

  // A change upstream of pricing invalidates the selected carrier's quote.
  useEffect(() => {
    setQuote(null);
  }, [signature]);

  const patch = useCallback(<K extends keyof BookingState>(key: K, value: BookingState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearErrorsFor = (prefix: string) =>
    setErrors((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith(prefix))),
    );

  const index = STEPS.findIndex((s) => s.id === step);
  const isLast = index === STEPS.length - 1;

  const goTo = (next: StepId) => {
    setStep(next);
    setErrors({});
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onNext = () => {
    const found = validateStep(step, state);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Bring the first failing control into view rather than leaving the
      // operator to hunt for a red border in a long form.
      requestAnimationFrame(() => {
        document.querySelector('[aria-invalid="true"]')?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
      return;
    }
    if (!isLast) goTo(STEPS[index + 1].id);
  };

  const onBack = () => index > 0 && goTo(STEPS[index - 1].id);

  const reset = () => {
    setState(initialBooking());
    setStep("route");
    setErrors({});
    setQuote(null);
    setCreated(null);
    setSubmitError(null);
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* best effort */
    }
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toCreatePayload(state)),
      });
      const payload = await res.json();

      if (!res.ok) {
        setSubmitError(payload.error ?? "Could not book this consignment");
        if (payload.fields) {
          setErrors(payload.fields);
          // Send the operator back to the step that owns the first bad field.
          const first = Object.keys(payload.fields)[0] ?? "";
          const owner: StepId = first.startsWith("pickup") || first.startsWith("drop")
            ? "route"
            : first.startsWith("invoice")
              ? "invoice"
              : first.startsWith("boxes") || first.startsWith("shipment")
                ? "cargo"
                : "carrier";
          setStep(owner);
        }
        return;
      }

      sessionStorage.removeItem(DRAFT_KEY);
      setCreated(payload.data.order as CreatedOrder);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitError("Network error — the booking was not created. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  if (created) return <BookingSuccess order={created} onNew={reset} />;

  return (
    <div className="flex flex-col gap-5">
      <Stepper current={step} onJump={goTo} reachable={(s) => canReach(s, state)} />

      {restored && step === "route" && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-500/25 bg-brand-500/10 px-4 py-2.5 text-xs text-brand-700 dark:text-brand-200">
          <span className="flex items-center gap-2">
            <RotateCcw className="size-3.5" />
            Restored your unsaved draft from this session.
          </span>
          <button
            type="button"
            onClick={reset}
            className="shrink-0 font-semibold text-brand-600 dark:text-brand-300 hover:underline"
          >
            Start fresh
          </button>
        </div>
      )}

      {step === "route" && (
        <Card>
          <CardHeader
            icon={MapPin}
            title="Pickup & drop"
            description="Search the address on the map, then drag the pin to the exact loading gate."
          />
          <CardBody className="grid gap-8 lg:grid-cols-2">
            <PartyForm
              side="pickup"
              value={state.pickup}
              errors={errors}
              onChange={(v) => {
                patch("pickup", v);
                clearErrorsFor("pickup.");
              }}
            />
            <div className="border-t border-line pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
              <PartyForm
                side="drop"
                value={state.drop}
                errors={errors}
                onChange={(v) => {
                  patch("drop", v);
                  clearErrorsFor("drop.");
                }}
              />
            </div>
          </CardBody>
        </Card>
      )}

      {step === "invoice" && (
        <StepInvoice
          value={state.invoice}
          errors={errors}
          onChange={(v) => {
            patch("invoice", v);
            clearErrorsFor("invoice.");
          }}
        />
      )}

      {step === "cargo" && (
        <StepCargo
          shipment={state.shipment}
          boxes={state.boxes}
          errors={errors}
          onShipmentChange={(v) => {
            patch("shipment", v);
            clearErrorsFor("shipment.");
          }}
          onBoxesChange={(v) => {
            patch("boxes", v);
            clearErrorsFor("boxes.");
          }}
        />
      )}

      {step === "carrier" && (
        <StepCarrier
          request={quoteRequestFrom(state)}
          signature={signature}
          selectedPartnerId={state.partnerId}
          onSelect={(id) => {
            patch("partnerId", id);
            setErrors({});
          }}
          onQuoteChange={setQuote}
          error={errors.partnerId}
        />
      )}

      {step === "review" && <StepReview state={state} quote={quote} onEdit={goTo} />}

      {submitError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>{submitError}</p>
        </div>
      )}

      {/* Action bar */}
      <div className="no-print sticky bottom-0 flex items-center justify-between gap-3 rounded-xl border border-line bg-surface/90 px-4 py-3 shadow-md backdrop-blur">
        <Button variant="ghost" onClick={onBack} disabled={index === 0 || submitting}>
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <p className="hidden text-xs text-ink-3 sm:block">
          Step {index + 1} of {STEPS.length} · {STEPS[index].hint}
        </p>

        {isLast ? (
          <Button onClick={submit} loading={submitting} disabled={!quote} size="lg">
            <ShieldCheck className="size-4" />
            Confirm booking
          </Button>
        ) : (
          <Button onClick={onNext} disabled={submitting}>
            Continue
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
