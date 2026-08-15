import type { Metadata } from "next";
import { Building2, Clock, Mail, PackageSearch, Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { PageHero, Section, SectionHead } from "@/components/marketing/PageHero";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Reach the ${BRAND.name} ops desk, sales team or registered office.`,
};

const DESKS = [
  {
    title: "Ops desk",
    body: "Pickups, stuck consignments, scan history and claims.",
    action: `mailto:${BRAND.supportEmail}?subject=Ops%20query`,
    label: BRAND.supportEmail,
  },
  {
    title: "Sales",
    body: "Rate cards, contracted lanes and volume pricing.",
    action: `mailto:${BRAND.supportEmail}?subject=Sales%20enquiry`,
    label: BRAND.supportEmail,
  },
  {
    title: "Partnerships",
    body: "Franchise, fleet and booking-agent applications.",
    action: `mailto:${BRAND.supportEmail}?subject=Partnership%20enquiry`,
    label: BRAND.supportEmail,
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to someone who can see the scan."
        lead="Have the LRN ready if it is about a consignment — it saves a round of email."
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`tel:${BRAND.supportPhone.replace(/\s+/g, "")}`}>
            <Phone className="size-4" />
            {BRAND.supportPhone}
          </ButtonLink>
          <ButtonLink href="/track" variant="secondary">
            <PackageSearch className="size-4" />
            Track a shipment
          </ButtonLink>
        </div>
      </PageHero>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionHead eyebrow="Reach us" title="Pick the right desk" />
            <div className="grid gap-px overflow-hidden rounded-[16px] border border-line bg-line">
              {DESKS.map((d) => (
                <div key={d.title} className="bg-surface p-7">
                  <h3 className="text-[17px] text-ink">{d.title}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink-3">{d.body}</p>
                  <a
                    href={d.action}
                    className="mt-3 inline-flex items-center gap-2 text-[14px] font-medium text-brand-700 hover:underline dark:text-brand-400"
                  >
                    <Mail className="size-4" />
                    {d.label}
                  </a>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[16px] border border-line bg-surface p-7">
              <span className="grid size-10 place-items-center rounded-[9px] bg-brand-500/12 ring-1 ring-inset ring-brand-500/20">
                <Building2 className="size-5 text-brand-600 dark:text-brand-400" />
              </span>
              <h3 className="mt-5 text-[17px] text-ink">Registered office</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-3">{BRAND.legalName}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-ink-3">
                {BRAND.registeredOffice}
              </p>
              <dl className="mt-5 space-y-2 border-t border-line pt-4 text-[13px]">
                {[
                  ["CIN", BRAND.cin],
                  ["PAN", BRAND.pan],
                  ["Transporter ID", BRAND.transporterId],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-ink-3">{k}</dt>
                    <dd className="docnum text-ink-2">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-[16px] border border-line bg-surface p-7">
              <span className="grid size-10 place-items-center rounded-[9px] bg-brand-500/12 ring-1 ring-inset ring-brand-500/20">
                <Clock className="size-5 text-brand-600 dark:text-brand-400" />
              </span>
              <h3 className="mt-5 text-[17px] text-ink">Desk hours</h3>
              <dl className="mt-3 space-y-2 text-[14px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-3">Monday to Saturday</dt>
                  <dd className="text-ink-2">09:30 — 19:00 IST</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-3">Sunday and holidays</dt>
                  <dd className="text-ink-2">Closed</dd>
                </div>
              </dl>
              <p className="mt-4 border-t border-line pt-4 text-[13.5px] leading-relaxed text-ink-3">
                Tracking is live around the clock — you do not need the desk to check where a
                consignment is.
              </p>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
