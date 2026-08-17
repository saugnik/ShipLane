import type { Metadata } from "next";
import { PageHero, Section, SectionHead } from "@/components/marketing/PageHero";
import { Bullets, Callout, DataTable } from "@/components/marketing/Prose";
import { ButtonLink } from "@/components/ui/Button";
import { findTopic } from "@/lib/support";

const TOPIC = findTopic("fuel-surcharge");

export const metadata: Metadata = { title: TOPIC.title, description: TOPIC.blurb };

/** Diesel price band (₹/litre) mapped to the surcharge on base freight. */
const SLABS: [band: string, fsc: string][] = [
  ["Up to 86.00", "6.0%"],
  ["86.01 – 88.00", "7.0%"],
  ["88.01 – 90.00", "8.0%"],
  ["90.01 – 92.00", "9.0%"],
  ["92.01 – 94.00", "10.0%"],
  ["94.01 – 96.00", "11.0%"],
  ["Above 96.00", "12.0%, then +1% per ₹2"],
];

/** Published schedule for 2026. Each row is the slab the month's price fell in. */
const SCHEDULE: [month: string, diesel: string, fsc: string][] = [
  ["January 2026", "89.40", "8.0%"],
  ["February 2026", "89.80", "8.0%"],
  ["March 2026", "90.60", "9.0%"],
  ["April 2026", "91.20", "9.0%"],
  ["May 2026", "92.40", "10.0%"],
  ["June 2026", "93.10", "10.0%"],
  ["July 2026", "92.80", "10.0%"],
  ["August 2026", "91.90", "9.0%"],
];

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="Support"
        title={TOPIC.title}
        lead="The fuel surcharge is the one line on your invoice that moves every month. Here is exactly how it is derived, and what it is charged on."
      />

      <Section>
        <SectionHead
          title="How it is calculated"
          lead="The surcharge is a percentage of base freight, set by the diesel price band for the month. It is not a per-consignment judgement — the band decides it."
        />

        <div className="rounded-[16px] border border-line bg-surface p-7">
          <p className="label-caps mb-3">Formula</p>
          <p className="docnum text-[15px] leading-relaxed text-ink">
            Fuel surcharge = Base freight × FSC% for the month
          </p>
          <p className="mt-4 text-[14px] leading-relaxed text-ink-3">
            Where FSC% is read from the slab table below against the average retail diesel price for
            the preceding month, referenced to the Indian Oil Corporation pump price at Delhi. The
            rate is fixed on the first of each month and does not change mid-month, whatever diesel
            does.
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="mb-4 text-[18px] text-ink">Slab table</h3>
            <DataTable
              head={["Diesel (₹/litre)", "Surcharge"]}
              rows={SLABS.map(([band, fsc]) => [band, fsc])}
              align={["left", "right"]}
            />
          </div>
          <div>
            <h3 className="mb-4 text-[18px] text-ink">Published schedule</h3>
            <DataTable
              head={["Month", "Reference (₹)", "Surcharge"]}
              rows={SCHEDULE.map(([m, d, f]) => [m, d, f])}
              align={["left", "right", "right"]}
              caption="Revised on the 1st of each month and published here before it is applied."
            />
          </div>
        </div>
      </Section>

      <Section className="border-y border-line bg-surface">
        <SectionHead title="What it applies to" />
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="mb-4 text-[16.5px] text-ink">Charged on</h3>
            <Bullets items={["Base freight, after the chargeable weight is settled"]} />
          </div>
          <div>
            <h3 className="mb-4 text-[16.5px] text-ink">Not charged on</h3>
            <Bullets
              items={[
                "Docket charge",
                "ODA charge",
                "FOV (carrier risk) premium",
                "COD handling",
                "Any other accessorial line",
              ]}
            />
          </div>
        </div>

        <div className="mt-8">
          <Callout title="Worked example">
            A consignment with ₹1,000 of base freight in August 2026 carries a 9.0% surcharge, so
            ₹90.00. Docket, ODA and FOV are added after that, and 18% GST applies to the total of
            all lines — not to the surcharge in isolation.
          </Callout>
        </div>
      </Section>

      <Section>
        <SectionHead title="Points worth knowing" />
        <Bullets
          items={[
            "Each carrier on the panel publishes its own surcharge. The one applied to your consignment is whatever sat on that carrier's rate card at the moment you accepted the quote.",
            "Every quote itemises the surcharge as its own line, so you can see it before you accept rather than discovering it on the invoice.",
            "The rate is frozen onto the Lorry Receipt at booking. A revision on the 1st does not reprice a consignment already booked.",
            "Contracted customers can negotiate a fixed surcharge for the contract term instead of tracking the monthly band. Ask sales.",
            "The surcharge covers line-haul fuel only. Toll, checkpost and state entry levies are separate and are shown as their own lines where they apply.",
          ]}
        />
      </Section>

      <Section className="border-t border-line">
        <SectionHead
          title="Want a fixed surcharge?"
          lead="On contracted lanes we can hold the surcharge flat for the term, which makes your landed cost predictable."
        />
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/contact">Talk to sales</ButtonLink>
          <ButtonLink href="/support/volumetric" variant="secondary">
            How weight is charged
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
