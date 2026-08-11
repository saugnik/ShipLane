import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  flush,
}: {
  className?: string;
  children: React.ReactNode;
  /** Drop the shadow — for cards nested inside another surface. */
  flush?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius-card)] border border-line bg-surface",
        flush ? "" : "shadow-sm",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  action,
  icon: Icon,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-px grid size-9 shrink-0 place-items-center rounded-[9px] bg-inset text-brand-600 ring-1 ring-inset ring-line dark:text-brand-400">
            <Icon className="size-4.5" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="font-display text-[15px] leading-5 font-bold text-ink">{title}</h2>
          {description && <p className="mt-1 text-xs leading-relaxed text-ink-3">{description}</p>}
        </div>
      </div>
      {action}
    </header>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

export function CardFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <footer
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-b-[var(--radius-card)] border-t border-line bg-sunken px-5 py-3.5",
        className,
      )}
    >
      {children}
    </footer>
  );
}

/** Label/value pair used throughout summaries and detail panes. */
export function DataRow({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 border-b border-line-soft py-2 last:border-0",
        className,
      )}
    >
      <dt className="shrink-0 text-xs text-ink-3">{label}</dt>
      <dd
        className={cn(
          "min-w-0 truncate text-right text-[13px] font-medium text-ink",
          mono && "docnum",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center overflow-hidden rounded-[var(--radius-card)] border border-dashed border-line-strong px-6 py-16 text-center">
      <div className="grid-paper pointer-events-none absolute inset-0" aria-hidden />
      <span className="relative grid size-14 place-items-center rounded-2xl bg-surface text-brand-600 shadow-md ring-1 ring-line dark:text-brand-400">
        <Icon className="size-6" />
      </span>
      <h3 className="font-display relative mt-5 text-[15px] font-bold text-ink">{title}</h3>
      <p className="relative mt-1.5 max-w-sm text-xs leading-relaxed text-ink-3">{description}</p>
      {action && <div className="relative mt-6">{action}</div>}
    </div>
  );
}

/** Loading placeholder — a shaped block beats a spinner for perceived speed. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-inset", className)}>
      <div className="shimmer absolute inset-0" />
    </div>
  );
}
