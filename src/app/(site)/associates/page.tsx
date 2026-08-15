import type { Metadata } from "next";
import { Building2, HandCoins, Handshake, MapPin, Truck } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { PageHero, Section, SectionHead } from "@/components/marketing/PageHero";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Associates",
  description: "Partner with the network as a franchise, fleet owner or booking agent.",
};

const MODELS = [
  {
    icon: Building2,
    title: "Branch franchise",
    body: "Run a booking counter under the brand in your city, with the software, documentation and rate cards provided.",
    ask: "Own or lease 200+ sq ft at street level",
  },
  {
    icon: Truck,
    title: "Fleet partner",
    body: "Attach your vehicles to trunk lanes and last-mile routes with assured monthly volume and fortnightly settlement.",
    ask: "Own one or more commercial vehicles",
  },
  {
    icon: Handshake,
    title: "Booking agent",
    body: "Book consignments for local businesses on commission, with no infrastructure of your own to maintain.",
    ask: "Existing customer relationships in your area",
  },
];

const BENEFITS = [
  ["Fortnightly settlement", "Paid on a fixed cycle against a reconciled statement — no chasing."],
  ["Software included", "Booking, rating, Lorry Receipt and carton tags at no separate licence cost."],
  ["Lane-level rate cards", "Transparent contracted rates so your margin is known before you quote."],
  ["Training and onboarding", "Documentation, checkpost compliance and platform training for your staff."],
];

export default function AssociatesPage() {
  return (
    <>
      <PageHero
        eyebrow="Partner with us"
        title="Grow with the network."
        lead={`${BRAND.name} runs on partners — franchises, fleet owners and agents who know their city better than any head office could.`}
      >
        <ButtonLink href="/contact">Apply to partner</ButtonLink>
      </PageHero>

      <Section>
        <SectionHead
          eyebrow="Three ways in"
          title="Pick the model that fits what you already have."
        />
        <div className="grid gap-px overflow-hidden rounded-[16px] border border-line bg-line md:grid-cols-3">
          {MODELS.map((m) => (
            <div key={m.title} className="bg-surface p-8">
              <span className="grid size-[46px] place-items-center rounded-[10px] bg-canvas">
                <m.icon className="size-[22px] text-brand-500" />
              </span>
              <h3 className="mt-5 text-[19px] text-ink">{m.title}</h3>
              <p className="mt-2.5 text-[14.5px] leading-[1.55] text-ink-3">{m.body}</p>
              <p className="mt-4 border-t border-line pt-3 text-[13px] text-ink-2">
                <span className="label-caps mb-1 block">What you need</span>
                {m.ask}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-surface border-y border-line">
        <SectionHead eyebrow="What you get" title="Support that makes the model work." />
        <div className="grid gap-6 sm:grid-cols-2">
          {BENEFITS.map(([head, body]) => (
            <div key={head} className="flex gap-4">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-[9px] bg-brand-500/12 ring-1 ring-inset ring-brand-500/20">
                <HandCoins className="size-4.5 text-brand-600 dark:text-brand-400" />
              </span>
              <div>
                <h3 className="text-[16px] text-ink">{head}</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-3">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="panel-navy flex flex-wrap items-center justify-between gap-6 rounded-[20px] px-8 py-10">
          <div className="max-w-[520px]">
            <span className="eyebrow mb-3">Coverage</span>
            <h2 className="text-[26px] text-panel-ink">Where we are looking for partners</h2>
            <p className="mt-2.5 text-[15px] leading-relaxed text-panel-ink-2">
              Tier-2 and tier-3 towns across the North-East, Central India and the Konkan belt,
              plus fleet capacity on the Delhi–Kolkata and Mumbai–Bengaluru trunk lanes.
            </p>
          </div>
          <div className="flex items-center gap-2 text-panel-ink-2">
            <MapPin className="size-4 text-brand-500" />
            <span className="text-[14px]">19,000+ PIN codes served today</span>
          </div>
        </div>
      </Section>
    </>
  );
}
