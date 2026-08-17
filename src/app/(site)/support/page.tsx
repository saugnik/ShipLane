import type { Metadata } from "next";
import Link from "next/link";
import {
  Ban,
  CalendarDays,
  FileCheck2,
  Fuel,
  HeartHandshake,
  MessageSquareWarning,
  PackageSearch,
  Ruler,
  ShieldAlert,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { PageHero, Section, SectionHead } from "@/components/marketing/PageHero";
import { SUPPORT_TOPICS, supportHref, type SupportTopic } from "@/lib/support";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Support",
  description: "Documentation, restricted items, surcharges, holidays and complaints.",
};

const ICONS: Record<SupportTopic["icon"], typeof Ban> = {
  FileCheck2,
  Ban,
  CalendarDays,
  Fuel,
  Ruler,
  ShieldAlert,
  HeartHandshake,
  MessageSquareWarning,
};

export default function SupportPage() {
  return (
    <>
      <PageHero
        eyebrow="Support"
        title="Everything you need before the vehicle arrives."
        lead="The paperwork, the limits, the surcharges and the calendar — plus a straight line to a person when the reference pages do not cover it."
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/track">
            <PackageSearch className="size-4" />
            Track a shipment
          </ButtonLink>
          <ButtonLink href={supportHref("complaint")} variant="secondary">
            Register a complaint
          </ButtonLink>
        </div>
      </PageHero>

      <Section>
        <SectionHead eyebrow="Reference" title="Support topics" />
        <div className="grid gap-px overflow-hidden rounded-[16px] border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
          {SUPPORT_TOPICS.map((t) => {
            const Icon = ICONS[t.icon];
            return (
              <Link
                key={t.slug}
                href={supportHref(t.slug)}
                className="group flex flex-col bg-surface p-7 transition-colors hover:bg-sunken"
              >
                <span className="grid size-[44px] place-items-center rounded-[10px] bg-canvas">
                  <Icon className="size-[21px] text-brand-500" />
                </span>
                <h3 className="mt-5 text-[17px] text-ink group-hover:text-brand-700 dark:group-hover:text-brand-400">
                  {t.title}
                </h3>
                <p className="mt-2 flex-1 text-[14px] leading-[1.55] text-ink-3">{t.blurb}</p>
                <span className="mt-4 text-[13px] font-semibold text-brand-700 dark:text-brand-400">
                  Read more →
                </span>
              </Link>
            );
          })}
        </div>
      </Section>

      <Section className="border-y border-line bg-surface">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <SectionHead
              eyebrow="Talk to us"
              title="When the reference pages are not enough"
              lead="The ops desk can pull the scan history and the carrier's own record for any LRN. Have the number ready and it is usually a single call."
            />
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/contact">Contact the ops desk</ButtonLink>
              <ButtonLink href="/faqs" variant="secondary">
                Browse FAQs
              </ButtonLink>
            </div>
          </div>

          <dl className="space-y-4 rounded-[16px] border border-line bg-canvas p-7">
            {[
              ["Ops desk", BRAND.supportPhone],
              ["Email", BRAND.supportEmail],
              ["Hours", "Mon–Sat, 09:30–19:00 IST"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="label-caps mb-1">{k}</dt>
                <dd className="text-[15px] break-all text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>
    </>
  );
}
