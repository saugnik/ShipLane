import type { Metadata } from "next";
import { ChevronsRight, Package, Truck, Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { PageHero, Section, SectionHead } from "@/components/marketing/PageHero";
import { SERVICES } from "@/lib/siteNav";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Services",
  description: "Express, standard parcel and freight across 19,000+ PIN codes.",
};

const ICONS = { express: ChevronsRight, standard: Package, freight: Truck } as const;

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="What we move"
        title="One network, three ways to ship."
        lead={`Pick a speed and let ${BRAND.name} handle checkposts, transfers and last mile — or mix services on a single consignment as it crosses states.`}
      >
        <ButtonLink href="/register">Get a rate</ButtonLink>
      </PageHero>

      {SERVICES.map((s, i) => {
        const Icon = ICONS[s.id];
        return (
          <Section key={s.id} id={s.id} className={i % 2 === 1 ? "bg-surface" : undefined}>
            <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.2fr]">
              <div>
                <span className="grid size-14 place-items-center rounded-[12px] bg-brand-500/12 ring-1 ring-inset ring-brand-500/20">
                  <Icon className="size-7 text-brand-600 dark:text-brand-400" />
                </span>
                <h2 className="mt-5 text-[28px] text-ink">{s.title}</h2>
                <p className="docnum mt-2 text-[13px] font-medium text-brand-700 dark:text-brand-400">
                  {s.eta}
                </p>
              </div>

              <div>
                <p className="text-[16.5px] leading-relaxed text-ink-2">{s.body}</p>
                <ul className="mt-6 grid gap-px overflow-hidden rounded-[14px] border border-line bg-line sm:grid-cols-3">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 bg-surface p-5 text-[14px] text-ink-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand-500" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>
        );
      })}

      <Section className="border-t border-line">
        <SectionHead
          eyebrow="Not sure which"
          title="Tell us the lane and we will price all three."
          lead="Every quote itemises freight, docket, fuel, FOV, ODA and GST upfront, and the figure you accept is frozen onto the Lorry Receipt."
        />
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/register">Create an account</ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            Talk to sales
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
