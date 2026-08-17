import type { Metadata } from "next";
import { PageHero, Section, SectionHead } from "@/components/marketing/PageHero";
import { Bullets, Callout, DataTable } from "@/components/marketing/Prose";
import { ButtonLink } from "@/components/ui/Button";
import { findTopic } from "@/lib/support";

const TOPIC = findTopic("volumetric");

export const metadata: Metadata = { title: TOPIC.title, description: TOPIC.blurb };

const DIVISORS: [mode: string, divisor: string, note: string][] = [
  ["Express (air)", "5,000", "Priority air lanes, metro pairs"],
  ["Standard parcel (surface)", "5,000", "Everyday domestic parcels"],
  ["Surface freight", "4,500", "Palletised and boxed freight"],
  ["Part-truckload", "4,000", "Heavy and industrial consignments"],
];

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="Support"
        title={TOPIC.title}
        lead="A carton of pillows and a carton of bolts take the same space on a vehicle. Volumetric weight is how that space gets priced."
      />

      <Section>
        <SectionHead
          title="The rule"
          lead="You are billed on the greater of what the consignment actually weighs and what its volume is worth — never on both."
        />

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[16px] border border-line bg-surface p-7">
            <p className="label-caps mb-3">Volumetric weight, per carton</p>
            <p className="docnum text-[15px] leading-relaxed text-ink">
              (Length × Breadth × Height in cm) ÷ Divisor
            </p>
            <p className="mt-4 text-[14px] leading-relaxed text-ink-3">
              Measure the outside of the packed carton, not the goods inside. Round any dimension up
              to the next whole centimetre.
            </p>
          </div>

          <div className="rounded-[16px] border border-line bg-surface p-7">
            <p className="label-caps mb-3">Chargeable weight, per consignment</p>
            <p className="docnum text-[15px] leading-relaxed text-ink">
              max(total actual, total volumetric, carrier minimum)
            </p>
            <p className="mt-4 text-[14px] leading-relaxed text-ink-3">
              The comparison is made once across the whole consignment, on the totals — not carton
              by carton. Mixing dense and light cartons therefore works in your favour.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="mb-4 text-[18px] text-ink">Divisors by mode</h3>
          <DataTable
            head={["Mode", "Divisor", "Typically used for"]}
            rows={DIVISORS.map(([m, d, n]) => [m, d, n])}
            align={["left", "right", "left"]}
            caption="Carriers on our panel currently use divisors between 4,000 and 5,000, alongside their own minimum chargeable weight. The divisor applied to your consignment sits on that carrier's rate card and is itemised on the quote before you accept it."
          />
        </div>
      </Section>

      <Section className="border-y border-line bg-surface">
        <SectionHead
          title="Worked example"
          lead="Two manifest lines on a surface freight booking, divisor 4,500, carrier minimum 20 kg."
        />

        <DataTable
          head={["Line", "Cartons", "Dimensions (cm)", "Weight each", "Actual", "Volumetric"]}
          rows={[
            ["1", "3", "40 × 30 × 25", "12.00 kg", "36.00 kg", "20.00 kg"],
            ["2", "2", "60 × 50 × 40", "8.00 kg", "16.00 kg", "53.33 kg"],
            [
              <span key="l" className="font-semibold">
                Total
              </span>,
              <span key="c" className="font-semibold">
                5
              </span>,
              "—",
              "—",
              <span key="a" className="font-semibold">
                52.00 kg
              </span>,
              <span key="v" className="font-semibold">
                73.33 kg
              </span>,
            ],
          ]}
          align={["left", "right", "left", "right", "right", "right"]}
        />

        <div className="mt-6 space-y-4">
          <Callout title="Chargeable weight: 73.33 kg">
            Volumetric (73.33 kg) exceeds actual (52.00 kg), so freight is billed on 73.33 kg. The
            20 kg carrier minimum does not bind here because both figures are already above it. Line
            1 on its own would have been billed on its actual weight — it is the light, bulky
            cartons on line 2 that carry the consignment over.
          </Callout>
          <Callout tone="info" title="Per-carton arithmetic">
            Line 2: 60 × 50 × 40 = 120,000 cm³. Divided by 4,500 that is 26.67 kg per carton, and
            two cartons make 53.33 kg. The quantity multiplies both the actual and the volumetric
            figure for the line.
          </Callout>
          <Callout title="Why the divisor is worth shopping">
            The same five cartons come to 66.00 kg on a divisor of 5,000, 73.33 kg on 4,500 and
            82.50 kg on 4,000 — a 25% spread in chargeable weight before a single rate is compared.
            This is why every booking is rated across the whole panel rather than one carrier.
          </Callout>
        </div>
      </Section>

      <Section>
        <SectionHead title="How this shows up when you book" />
        <Bullets
          items={[
            "Enter one manifest line per carton type, with the quantity on that line and the weight and dimensions of a single carton. Do not enter line totals.",
            "The total box count is the sum of the quantities across all lines — three lines of 50, 51 and 52 cartons is a 153-box consignment, not a 3-box one.",
            "Each line shows its own volumetric figure as you type, so you can see which cartons are driving the chargeable weight before you commit.",
            "Every carton gets its own tag and its own barcode regardless of how the lines are grouped.",
            "Re-weighing happens at the first hub. If the measured weight or dimensions differ from what was declared, the consignment is repriced on the measured figures and you are notified.",
          ]}
        />

        <div className="mt-8">
          <Callout tone="warn" title="Declare the packed dimensions">
            The commonest repricing cause is measuring the goods rather than the carton. Pallets are
            measured including the pallet; anything wrapped is measured over the wrap.
          </Callout>
        </div>
      </Section>

      <Section className="border-t border-line">
        <SectionHead
          title="See it on a real consignment"
          lead="Book a shipment and the chargeable weight is worked out live as you add cartons, across every carrier on the panel."
        />
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/register">Create an account</ButtonLink>
          <ButtonLink href="/support/fuel-surcharge" variant="secondary">
            Fuel surcharge
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
