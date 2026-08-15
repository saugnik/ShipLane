import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Headset, PackageSearch, ShieldAlert } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { PageHero, Section, SectionHead } from "@/components/marketing/PageHero";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Support",
  description: "Track a shipment, raise a claim, or reach the ops desk.",
};

const CLAIM_STEPS = [
  ["Report within 7 days", "Claims must be reported in writing within 7 days of delivery — after that the carrier's liability lapses."],
  ["Keep the packaging", "Photograph the carton, the seal and the contents before unpacking further. Tags carry the box AWB the claim is filed against."],
  ["Note it on the POD", "Ask the driver to record shortage or damage on the proof of delivery at the point of handover."],
  ["Send the LR and invoice", "Email the Lorry Receipt number, the commercial invoice and photographs to the ops desk."],
];

export default function SupportPage() {
  return (
    <>
      <PageHero
        eyebrow="Support"
        title="Something to check, or something gone wrong."
        lead="Most questions are answered by the tracking page. For everything else the ops desk answers on a working day."
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/track">
            <PackageSearch className="size-4" />
            Track a shipment
          </ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            Contact the ops desk
          </ButtonLink>
        </div>
      </PageHero>

      <Section>
        <div className="grid gap-px overflow-hidden rounded-[16px] border border-line bg-line md:grid-cols-3">
          {[
            {
              icon: PackageSearch,
              title: "Track a consignment",
              body: "Enter the 9-digit LRN printed on your Lorry Receipt or any carton tag. No account needed.",
              href: "/track",
              cta: "Open tracking",
            },
            {
              icon: ClipboardList,
              title: "Read the FAQs",
              body: "Weights, e-way bills, GSTIN, ODA charges and what the documents mean.",
              href: "/faqs",
              cta: "Browse FAQs",
            },
            {
              icon: Headset,
              title: "Talk to a person",
              body: `Ops desk on ${BRAND.supportPhone}, or email and we will come back the same working day.`,
              href: "/contact",
              cta: "Contact us",
            },
          ].map((c) => (
            <div key={c.title} className="flex flex-col bg-surface p-8">
              <span className="grid size-[46px] place-items-center rounded-[10px] bg-canvas">
                <c.icon className="size-[22px] text-brand-500" />
              </span>
              <h3 className="mt-5 text-[19px] text-ink">{c.title}</h3>
              <p className="mt-2.5 flex-1 text-[14.5px] leading-[1.55] text-ink-3">{c.body}</p>
              <Link
                href={c.href}
                className="mt-5 text-[13.5px] font-semibold text-brand-700 hover:underline dark:text-brand-400"
              >
                {c.cta} →
              </Link>
            </div>
          ))}
        </div>
      </Section>

      <Section id="claims" className="border-y border-line bg-surface">
        <SectionHead
          eyebrow="Claims"
          title="Raising a shortage or damage claim"
          lead="Freight claims turn on evidence gathered in the first hours. This is the order that keeps a claim alive."
        />

        <ol className="grid gap-6 sm:grid-cols-2">
          {CLAIM_STEPS.map(([head, body], i) => (
            <li key={head} className="flex gap-4">
              {/* brand-600, not 500 — white on the raw orange is 3.06:1 and
                  fails AA at this size. */}
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

        <div className="mt-10 flex items-start gap-3 rounded-[14px] border border-amber-500/30 bg-amber-500/10 px-5 py-4">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-[14px] leading-relaxed text-amber-800 dark:text-amber-200">
            <span className="font-semibold">Owner risk vs carrier risk.</span> Goods move at
            owner&apos;s risk unless carrier risk (FOV) was opted for and charged at booking. Check
            the Risk Coverage field on your Lorry Receipt before filing.
          </p>
        </div>
      </Section>

      <Section>
        <SectionHead title="Still stuck?" lead="The ops desk can pull the scan history and the carrier's own record for any LRN." />
        <ButtonLink href="/contact">Contact the ops desk</ButtonLink>
      </Section>
    </>
  );
}
