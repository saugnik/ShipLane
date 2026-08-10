"use client";

import { useEffect, useState } from "react";
import {
  BadgeIndianRupee,
  CalendarClock,
  Check,
  ChevronDown,
  Plane,
  ServerCrash,
  Train,
  TriangleAlert,
  Truck,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader, Skeleton } from "@/components/ui/Card";
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
      <div className="flex flex-col gap-3">
        <Card>
          <CardHeader
            icon={BadgeIndianRupee}
            title="Rating this consignment"
            description="Pricing across the carrier panel…"
          />
        </Card>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-sm"
            style={{ opacity: 1 - i * 0.22 }}
          >
            <Skeleton className="size-10 rounded-[10px]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-2.5 w-56" />
            </div>
            <Skeleton className="h-7 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <Card>
        <CardBody className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-rose-500/10 text-rose-600 ring-1 ring-inset ring-rose-500/20 dark:text-rose-400">
            <ServerCrash className="size-6" />
          </span>
          <p className="text-sm font-semibold text-ink">{state.message}</p>
          <p className="max-w-sm text-xs leading-relaxed text-ink-3">
            Go back a step and change something, or retry — no booking has been created.
          </p>
        </CardBody>
      </Card>
    );
  }

  const { quotes, recommended } = state;
  const cheapest = quotes[0]?.grandTotal ?? 0;

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
        <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
          <TriangleAlert className="size-3.5" />
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {quotes.map((quote, i) => (
          <QuoteCard
            key={quote.partnerId}
            quote={quote}
            index={i}
            premium={quote.grandTotal - cheapest}
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
  index,
  premium,
  selected,
  cheapest,
  fastest,
  onSelect,
}: {
  quote: Quote;
  index: number;
  /** How much more than the cheapest option — the number buyers actually weigh. */
  premium: number;
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
        "animate-in-up overflow-hidden rounded-[var(--radius-card)] border bg-surface transition-all duration-200",
        selected
          ? "border-brand-500 shadow-md ring-1 ring-brand-500"
          : "border-line shadow-sm hover:border-line-strong hover:shadow-md",
      )}
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="flex w-full flex-wrap items-center gap-4 p-4 text-left sm:flex-nowrap"
      >
        <span
          className={cn(
            "grid size-5 shrink-0 place-items-center rounded-full border-2 transition-all duration-200",
            selected ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong",
          )}
        >
          {selected && <Check className="size-3" strokeWidth={3.5} />}
        </span>

        <span className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-[11px] text-white shadow-sm ring-1 ring-inset ring-white/15"
            style={{ backgroundColor: quote.accent }}
          >
            <ModeIcon className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-1.5">
              <span className="truncate text-[13px] font-semibold text-ink">
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
            <span className="mt-0.5 block truncate text-xs text-ink-3">{quote.tagline}</span>
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-5 sm:gap-7">
          <span className="hidden sm:block">
            <span className="label-caps block">Chargeable</span>
            <span className="tnum block text-[13px] font-semibold text-ink-2">
              {formatKg(quote.chargedWeight)}
            </span>
          </span>
          <span>
            <span className="label-caps block">Delivery by</span>
            <span className="flex items-center gap-1 text-[13px] font-semibold text-ink-2">
              <CalendarClock className="size-3.5 text-ink-4" />
              {formatDate(quote.etaDate)}
            </span>
          </span>
          <span className="min-w-[92px] text-right">
            <span className="label-caps block">All-in</span>
            <span className="tnum block text-[17px] leading-tight font-bold tracking-[-0.02em] text-ink">
              {formatINR(quote.grandTotal)}
            </span>
            {premium > 0 && (
              <span className="tnum block text-[11px] text-ink-4">
                +{formatINR(premium)} vs best
              </span>
            )}
          </span>
        </span>
      </button>

      <div className="flex items-center justify-between gap-3 border-t border-line-soft bg-sunken px-4 py-2">
        <p className="truncate text-[11px] text-ink-3">
          {quote.laneLabel} · {formatINR(quote.ratePerKg)}/kg · {quote.transitDays} working day
          {quote.transitDays === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-brand-600 transition-colors hover:bg-brand-500/10 dark:text-brand-300"
        >
          {expanded ? "Hide" : "Breakup"}
          <ChevronDown className={cn("size-3 transition-transform", expanded && "rotate-180")} />
        </button>
      </div>

      {expanded && (
        <dl className="animate-in-fade grid gap-x-8 gap-y-1.5 border-t border-line-soft px-4 py-4 text-xs sm:grid-cols-2">
          <Line
            label={`Freight (${formatKg(quote.chargedWeight)} @ ${formatINR(quote.ratePerKg)}/kg)`}
            value={quote.freight}
          />
          <Line label="Docket charge" value={quote.docketCharge} />
          <Line label="Fuel surcharge" value={quote.fuelSurcharge} />
          <Line label="FOV / risk cover" value={quote.fov} />
          <Line label="ODA charge" value={quote.odaCharge} />
          <Line label="COD handling" value={quote.codCharge} />
          <Line label="Sub-total" value={quote.subtotal} strong />
          <Line label={`GST @ ${quote.gstPct}%`} value={quote.gstAmount} />
          <div className="mt-1 flex items-baseline justify-between border-t border-line pt-2.5 sm:col-span-2">
            <dt className="text-[13px] font-semibold text-ink">Total payable</dt>
            <dd className="tnum text-[15px] font-bold text-brand-600 dark:text-brand-300">
              {formatINR(quote.grandTotal)}
            </dd>
          </div>
          {quote.indicative && (
            <p className="mt-1 flex items-start gap-1.5 text-[11px] leading-relaxed text-amber-700 sm:col-span-2 dark:text-amber-400">
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
    <div className="flex items-baseline justify-between gap-3 border-b border-line-soft py-1 last:border-0">
      <dt className={cn("truncate text-ink-3", strong && "font-semibold text-ink-2")}>{label}</dt>
      <dd className={cn("tnum shrink-0 text-ink-2", strong && "font-semibold text-ink")}>
        {formatINR(value)}
      </dd>
    </div>
  );
}
