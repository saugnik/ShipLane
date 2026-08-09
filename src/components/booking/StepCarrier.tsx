"use client";

import { useEffect, useState } from "react";
import {
  BadgeIndianRupee,
  CalendarClock,
  Check,
  Loader2,
  Plane,
  ServerCrash,
  Train,
  TriangleAlert,
  Truck,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import type { Quote } from "@/lib/pricing";
import { cn, formatDate, formatINR, formatKg } from "@/lib/utils";

const MODE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  ROAD: Truck,
  AIR: Plane,
  RAIL: Train,
};

type QuoteResponse = {
  quotes: Quote[];
  recommended: { cheapestPartnerId: string | null; fastestPartnerId: string | null };
};

export function StepCarrier({
  request,
  signature,
  selectedPartnerId,
  onSelect,
  onQuoteChange,
  error,
}: {
  request: unknown;
  /** Changes whenever anything price-affecting changes, forcing a re-quote. */
  signature: string;
  selectedPartnerId: string | null;
  onSelect: (partnerId: string) => void;
  onQuoteChange: (quote: Quote | null) => void;
  error?: string;
}) {
  const [state, setState] = useState<
    { status: "loading" } | { status: "error"; message: string } | ({ status: "ready" } & QuoteResponse)
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    })
      .then(async (res) => {
        const payload = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setState({ status: "error", message: payload.error ?? "Could not fetch rates" });
          return;
        }
        setState({ status: "ready", ...(payload.data as QuoteResponse) });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: "error", message: "Could not reach the rating service" });
        }
      });

    return () => {
      cancelled = true;
    };
    // Re-quote is driven by the pricing signature, not by object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  // Keep the parent's frozen quote in step with the selection.
  useEffect(() => {
    if (state.status !== "ready") return;
    const chosen = state.quotes.find((q) => q.partnerId === selectedPartnerId) ?? null;
    onQuoteChange(chosen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, selectedPartnerId]);

  if (state.status === "loading") {
    return (
      <Card>
        <CardBody className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
          <Loader2 className="size-4 animate-spin" />
          Rating this consignment across the carrier panel…
        </CardBody>
      </Card>
    );
  }

  if (state.status === "error") {
    return (
      <Card>
        <CardBody className="flex flex-col items-center gap-3 py-14 text-center">
          <ServerCrash className="size-8 text-rose-400" />
          <p className="text-sm font-semibold text-slate-900">{state.message}</p>
          <p className="max-w-sm text-xs text-slate-500">
            Go back a step and change something, or retry — no booking has been created.
          </p>
        </CardBody>
      </Card>
    );
  }

  const { quotes, recommended } = state;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          icon={BadgeIndianRupee}
          title="Choose a delivery partner"
          description="Rates are contracted per lane. All figures include GST and are locked onto the LR at booking."
          action={
            <Badge tone="neutral">
              {quotes.length} carrier{quotes.length === 1 ? "" : "s"} quoted
            </Badge>
          }
        />
      </Card>

      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
          <TriangleAlert className="size-3.5" />
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {quotes.map((quote) => (
          <QuoteCard
            key={quote.partnerId}
            quote={quote}
            selected={quote.partnerId === selectedPartnerId}
            cheapest={quote.partnerId === recommended.cheapestPartnerId}
            fastest={quote.partnerId === recommended.fastestPartnerId}
            onSelect={() => onSelect(quote.partnerId)}
          />
        ))}
      </div>
    </div>
  );
}

function QuoteCard({
  quote,
  selected,
  cheapest,
  fastest,
  onSelect,
}: {
  quote: Quote;
  selected: boolean;
  cheapest: boolean;
  fastest: boolean;
  onSelect: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const ModeIcon = MODE_ICON[quote.modes[0]] ?? Truck;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-white transition-shadow",
        selected ? "border-brand-500 shadow-lift ring-1 ring-brand-500" : "border-slate-200 shadow-card",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="flex w-full flex-wrap items-center gap-4 p-4 text-left hover:bg-slate-50/70 sm:flex-nowrap"
      >
        {/* Selection indicator */}
        <span
          className={cn(
            "grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
            selected ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300",
          )}
        >
          {selected && <Check className="size-3" strokeWidth={3.5} />}
        </span>

        {/* Carrier identity */}
        <span className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-lg text-white"
            style={{ backgroundColor: quote.accent }}
          >
            <ModeIcon className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-slate-900">
                {quote.partnerName}
              </span>
              {cheapest && (
                <Badge tone="success">
                  <BadgeIndianRupee className="size-3" /> Best price
                </Badge>
              )}
              {fastest && !cheapest && (
                <Badge tone="brand">
                  <Zap className="size-3" /> Fastest
                </Badge>
              )}
              {quote.indicative && <Badge tone="warning">Indicative</Badge>}
              {quote.oda && <Badge tone="warning">ODA</Badge>}
            </span>
            <span className="mt-0.5 block truncate text-xs text-slate-500">{quote.tagline}</span>
          </span>
        </span>

        {/* Commercials */}
        <span className="flex shrink-0 items-center gap-5 sm:gap-7">
          <span className="hidden sm:block">
            <span className="label-caps block">Chargeable</span>
            <span className="tnum block text-sm font-semibold text-slate-800">
              {formatKg(quote.chargedWeight)}
            </span>
          </span>
          <span>
            <span className="label-caps block">Delivery by</span>
            <span className="flex items-center gap-1 text-sm font-semibold text-slate-800">
              <CalendarClock className="size-3.5 text-slate-400" />
              {formatDate(quote.etaDate)}
            </span>
          </span>
          <span className="text-right">
            <span className="label-caps block">All-in</span>
            <span className="tnum block text-base font-bold text-slate-900">
              {formatINR(quote.grandTotal)}
            </span>
          </span>
        </span>
      </button>

      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2">
        <p className="truncate text-[11px] text-slate-500">
          {quote.laneLabel} · {formatINR(quote.ratePerKg)}/kg · {quote.transitDays} working day
          {quote.transitDays === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-[11px] font-semibold text-brand-700 hover:underline"
        >
          {expanded ? "Hide breakup" : "View breakup"}
        </button>
      </div>

      {expanded && (
        <dl className="animate-in-up grid gap-x-6 gap-y-1.5 border-t border-slate-100 px-4 py-3.5 text-xs sm:grid-cols-2">
          <Line label={`Freight (${formatKg(quote.chargedWeight)} @ ${formatINR(quote.ratePerKg)}/kg)`} value={quote.freight} />
          <Line label="Docket charge" value={quote.docketCharge} />
          <Line label="Fuel surcharge" value={quote.fuelSurcharge} />
          <Line label="FOV / risk cover" value={quote.fov} />
          <Line label="ODA charge" value={quote.odaCharge} />
          <Line label="COD handling" value={quote.codCharge} />
          <Line label="Sub-total" value={quote.subtotal} strong />
          <Line label={`GST @ ${quote.gstPct}%`} value={quote.gstAmount} />
          <div className="sm:col-span-2 mt-1 flex items-baseline justify-between border-t border-slate-200 pt-2">
            <dt className="text-sm font-semibold text-slate-900">Total payable</dt>
            <dd className="tnum text-sm font-bold text-brand-700">{formatINR(quote.grandTotal)}</dd>
          </div>
          {quote.indicative && (
            <p className="sm:col-span-2 mt-1 flex items-start gap-1.5 text-[11px] text-amber-700">
              <TriangleAlert className="mt-px size-3 shrink-0" />
              No contracted rate on this lane — priced at the carrier&apos;s zone rate and subject to
              confirmation at pickup.
            </p>
          )}
        </dl>
      )}
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={cn("truncate text-slate-500", strong && "font-semibold text-slate-700")}>
        {label}
      </dt>
      <dd className={cn("tnum shrink-0 text-slate-800", strong && "font-semibold")}>
        {formatINR(value)}
      </dd>
    </div>
  );
}
