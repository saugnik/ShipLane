import { cn, STATUS_LABEL } from "@/lib/utils";

const TONES = {
  neutral: "bg-inset text-ink-2 ring-line-strong/60",
  brand: "bg-brand-500/12 text-brand-700 ring-brand-500/25 dark:text-brand-400",
  success: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400",
  warning: "bg-amber-500/12 text-amber-700 ring-amber-500/25 dark:text-amber-400",
  danger: "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-400",
} as const;

export function Badge({
  children,
  className,
  tone = "neutral",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: keyof typeof TONES;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] leading-4 font-semibold ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Status colour is load-bearing here — it is how an operator triages a list at
 * a glance — so each stage gets a distinct hue that survives both themes.
 */
const STATUS_TONE: Record<string, string> = {
  // Navy for the stationary stages, brand orange once something is physically
  // moving, green at rest. That mirrors how the rest of the palette works.
  BOOKED: "bg-navy-800/10 text-ink-2 ring-navy-800/20 dark:bg-white/8 dark:text-ink-2",
  PICKUP_SCHEDULED: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-400",
  PICKED_UP: "bg-brand-500/12 text-brand-700 ring-brand-500/25 dark:text-brand-400",
  IN_TRANSIT: "bg-brand-500/14 text-brand-700 ring-brand-500/30 dark:text-brand-400",
  REACHED_DESTINATION_HUB: "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-400",
  OUT_FOR_DELIVERY: "bg-brand-500/16 text-brand-700 ring-brand-500/35 dark:text-brand-400",
  DELIVERED: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-400",
  EXCEPTION: "bg-rose-500/12 text-rose-700 ring-rose-500/25 dark:text-rose-400",
  CANCELLED: "bg-inset text-ink-4 ring-line-strong/60",
};

/** Statuses that deserve a live pulse — something is physically moving. */
const ACTIVE = new Set(["IN_TRANSIT", "OUT_FOR_DELIVERY", "PICKED_UP"]);

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const active = ACTIVE.has(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] leading-5 font-semibold whitespace-nowrap ring-1 ring-inset",
        STATUS_TONE[status] ?? STATUS_TONE.BOOKED,
        className,
      )}
    >
      <span className="relative flex size-1.5">
        {active && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
        )}
        <span className="relative inline-flex size-1.5 rounded-full bg-current" />
      </span>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
