import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

/**
 * The mark: two chevrons, one orange one white, reading as forward motion and
 * as the double-arrow of a fast-forward. Drawn rather than imported so it
 * inherits size and never ships an extra request.
 */
export function LogoMark({ className, size = 38 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-[10px] bg-panel",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size * 0.53} height={size * 0.53} viewBox="0 0 110 110" fill="none">
        <path
          d="M32 38 L60 55 L32 72"
          stroke="var(--color-brand-500)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M50 38 L78 55 L50 72"
          stroke="#ffffff"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** Wordmark — the tail always carries the accent colour. */
export function LogoWord({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-[20px] leading-none font-bold tracking-tight", className)}>
      {BRAND.nameParts.head}
      <span className="logo-accent">{BRAND.nameParts.tail}</span>
    </span>
  );
}

export function Logo({
  size = 38,
  className,
  sub,
}: {
  size?: number;
  className?: string;
  sub?: string;
}) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <LogoMark size={size} />
      <span className="leading-tight">
        <LogoWord />
        {sub && (
          <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.1em] text-ink-4 uppercase">
            {sub}
          </span>
        )}
      </span>
    </span>
  );
}
