import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

/**
 * The mark: an S drawn as a road.
 *
 * The initial and the product in one shape — a route with the travelled half in
 * white and the remaining leg in orange, the consignment sitting at the head.
 * It replaced a double chevron, which is the single most common mark in
 * logistics and says "fast" and nothing else.
 *
 * The stroke is deliberately heavy (11% of the viewBox). The mark has to hold
 * at 16px in a browser tab, and anything finer turns to grey mush there.
 *
 * Drawn rather than imported so it inherits size, recolours with the theme and
 * never costs a request. Keep this path in sync with src/app/icon.svg, which is
 * the same artwork standing alone as the favicon.
 */
export function LogoMark({ className, size = 38 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-[10px] bg-panel", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size * 0.63} height={size * 0.63} viewBox="0 0 40 40" fill="none">
        {/* The full route. */}
        <path
          d="M28.5 11.5C28.5 7.5 11.5 7.5 11.5 14C11.5 20.5 28.5 19.5 28.5 26C28.5 32.5 11.5 32.5 11.5 28.5"
          stroke="#ffffff"
          strokeWidth="4.4"
          strokeLinecap="round"
        />
        {/* The leg still in transit, over the top of it. */}
        <path
          d="M28.5 26C28.5 32.5 11.5 32.5 11.5 28.5"
          stroke="var(--color-brand-500)"
          strokeWidth="4.4"
          strokeLinecap="round"
        />
        {/* The consignment. */}
        <circle cx="11.5" cy="28.5" r="3.2" fill="var(--color-brand-500)" />
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
