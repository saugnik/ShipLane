import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { PageHero, Section, SectionHead } from "@/components/marketing/PageHero";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Career",
  description: `Open roles across operations, technology and customer success at ${BRAND.name}.`,
};

const ROLES = [
  {
    title: "Hub Operations Executive",
    location: "Noida, Uttar Pradesh",
    type: "Full time",
    body: "Run the inbound and outbound sort for the NCR hub, own the departure cut-offs and keep exception scans clean.",
  },
  {
    title: "Lane Planner — Freight",
    location: "Kolkata, West Bengal",
    type: "Full time",
    body: "Build trunk schedules across the eastern lanes, balance vehicle fill against transit promises and negotiate partner capacity.",
  },
  {
    title: "Customer Success Associate",
    location: "Remote (India)",
    type: "Full time",
    body: "Own a book of B2B shippers end to end — onboarding, rate queries, claims follow-through and quarterly reviews.",
  },
  {
    title: "Full-stack Engineer",
    location: "Noida / Remote",
    type: "Full time",
    body: "Work on the booking console, rating engine and document generation — TypeScript, Next.js and Postgres.",
  },
];

const VALUES = [
  ["The scan is the truth", "If it did not scan, it did not happen. We fix the process, not the paperwork."],
  ["Quote it honestly", "Every charge is itemised before the customer accepts. No surprises at the checkpost."],
  ["Own the exception", "Anyone who spots a stuck consignment owns it until it moves or someone else has it."],
];

export default function CareerPage() {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Freight is a people business."
        lead={`${BRAND.name} runs on the people who plan the lanes, work the hubs and answer the phone. Here is what is open right now.`}
      />

      <Section>
        <SectionHead eyebrow="Open roles" title="Where we are hiring" />
        <ul className="divide-y divide-line overflow-hidden rounded-[16px] border border-line bg-surface">
          {ROLES.map((r) => (
            <li
              key={r.title}
              className="flex flex-col gap-4 p-7 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="max-w-[640px]">
                <h3 className="text-[18px] text-ink">{r.title}</h3>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-3">{r.body}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-3">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-brand-500" />
                    {r.location}
                  </span>
                  <span className="label-caps">{r.type}</span>
                </div>
              </div>
              <a
                href={`mailto:${BRAND.supportEmail}?subject=${encodeURIComponent(`Application — ${r.title}`)}`}
                className="shrink-0 rounded-[8px] bg-brand-600 px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-brand-500"
              >
                Apply
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <Section className="border-y border-line bg-surface">
        <SectionHead eyebrow="How we work" title="Three things we actually hold to." />
        <div className="grid gap-px overflow-hidden rounded-[16px] border border-line bg-line md:grid-cols-3">
          {VALUES.map(([head, body]) => (
            <div key={head} className="bg-canvas p-7">
              <h3 className="text-[17px] text-ink">{head}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-3">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="panel-navy rounded-[20px] px-8 py-10">
          <span className="eyebrow mb-3">Nothing that fits?</span>
          <h2 className="max-w-[520px] text-[26px] text-panel-ink">
            Send us your CV anyway.
          </h2>
          <p className="mt-2.5 max-w-[560px] text-[15px] leading-relaxed text-panel-ink-2">
            Tell us which part of the network you want to work on and we will keep you on file for
            the next opening.
          </p>
          <a
            href={`mailto:${BRAND.supportEmail}?subject=Open%20application`}
            className="mt-6 inline-flex rounded-[8px] bg-brand-600 px-6 py-3 text-[14.5px] font-bold text-white transition-colors hover:bg-brand-500"
          >
            Email {BRAND.supportEmail}
          </a>
        </div>
      </Section>
    </>
  );
}
