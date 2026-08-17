import { Info, ShieldAlert, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Building blocks for the Support reference pages — tables, callouts and
 * definition lists. Kept together because these pages are mostly prose and
 * tabular data, and the styling only has to be right in one place.
 */

/** Scrolls inside its own box: rate and calendar tables are wider than a phone. */
export function DataTable({
  head,
  rows,
  align,
  caption,
}: {
  head: string[];
  rows: React.ReactNode[][];
  /** Per-column text alignment; defaults to left. */
  align?: ("left" | "right" | "center")[];
  caption?: string;
}) {
  const cls = (i: number) =>
    align?.[i] === "right" ? "text-right" : align?.[i] === "center" ? "text-center" : "text-left";

  return (
    <figure>
      <div className="overflow-x-auto rounded-[14px] border border-line">
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr className="bg-sunken">
              {head.map((h, i) => (
                <th
                  key={h}
                  scope="col"
                  className={cn(
                    "label-caps border-b border-line px-4 py-3 whitespace-nowrap",
                    cls(i),
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className="bg-surface">
                {row.map((cell, i) => (
                  <td
                    key={i}
                    className={cn(
                      "border-b border-line-soft px-4 py-3 text-ink-2 last:border-b-0",
                      i === 0 && "font-medium text-ink",
                      cls(i),
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && (
        <figcaption className="mt-2.5 text-[13px] leading-relaxed text-ink-3">{caption}</figcaption>
      )}
    </figure>
  );
}

const TONES = {
  info: {
    icon: Info,
    box: "border-brand-500/30 bg-brand-500/8",
    mark: "text-brand-700 dark:text-brand-400",
    body: "text-ink-2",
  },
  warn: {
    icon: TriangleAlert,
    box: "border-amber-500/35 bg-amber-500/10",
    mark: "text-amber-700 dark:text-amber-300",
    body: "text-amber-900 dark:text-amber-100",
  },
  danger: {
    icon: ShieldAlert,
    box: "border-rose-500/35 bg-rose-500/10",
    mark: "text-rose-700 dark:text-rose-300",
    body: "text-rose-900 dark:text-rose-100",
  },
} as const;

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: keyof typeof TONES;
  title?: string;
  children: React.ReactNode;
}) {
  const t = TONES[tone];
  return (
    <div className={cn("flex items-start gap-3 rounded-[14px] border px-5 py-4", t.box)}>
      <t.icon className={cn("mt-0.5 size-5 shrink-0", t.mark)} />
      <div className={cn("text-[14px] leading-relaxed", t.body)}>
        {title && <p className="mb-1 font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  );
}

/** A term/definition stack — used for "what to send" style lists. */
export function DefList({ items }: { items: [term: string, def: React.ReactNode][] }) {
  return (
    <dl className="grid gap-px overflow-hidden rounded-[14px] border border-line bg-line sm:grid-cols-2">
      {items.map(([term, def]) => (
        <div key={term} className="bg-surface p-5">
          <dt className="text-[15px] font-semibold text-ink">{term}</dt>
          <dd className="mt-1.5 text-[14px] leading-relaxed text-ink-3">{def}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Numbered steps, for escalation ladders and procedures. */
export function Steps({ items }: { items: [head: string, body: React.ReactNode][] }) {
  return (
    <ol className="grid gap-6 sm:grid-cols-2">
      {items.map(([head, body], i) => (
        <li key={head} className="flex gap-4">
          {/* brand-600, not 500 — white on the raw orange is 3.06:1. */}
          <span className="font-display grid size-9 shrink-0 place-items-center rounded-full bg-brand-600 text-[13px] font-bold text-white">
            {i + 1}
          </span>
          <div>
            <h3 className="text-[16px] text-ink">{head}</h3>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-3">{body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Plain bulleted list with brand-coloured markers. */
export function Bullets({ items, columns = 1 }: { items: React.ReactNode[]; columns?: 1 | 2 }) {
  return (
    <ul className={cn("grid gap-2.5", columns === 2 && "sm:grid-cols-2 sm:gap-x-8")}>
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[14.5px] leading-relaxed text-ink-2">
          <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}
