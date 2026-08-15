import { cn } from "@/lib/utils";

/** Banner at the top of every inner page — keeps the site rhythm consistent. */
export function PageHero({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-surface">
      <div className="grid-paper pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20">
        <span className="eyebrow mb-4">{eyebrow}</span>
        <h1 className="max-w-[760px] text-[clamp(30px,3.6vw,46px)] leading-[1.08] text-ink">
          {title}
        </h1>
        {lead && (
          <p className="mt-4 max-w-[620px] text-[16.5px] leading-relaxed text-ink-3">{lead}</p>
        )}
        {children && <div className="mt-7">{children}</div>}
      </div>
    </section>
  );
}

export function Section({
  className,
  children,
  id,
}: {
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24 py-16 sm:py-20", className)}>
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">{children}</div>
    </section>
  );
}

export function SectionHead({
  eyebrow,
  title,
  lead,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
}) {
  return (
    <div className="mb-10 max-w-[640px]">
      {eyebrow && <span className="eyebrow mb-3.5">{eyebrow}</span>}
      <h2 className="text-[clamp(24px,2.6vw,32px)] leading-[1.14] text-ink">{title}</h2>
      {lead && <p className="mt-3 text-[15.5px] leading-relaxed text-ink-3">{lead}</p>}
    </div>
  );
}
