import type { Metadata } from "next";
import { PageHero, Section, SectionHead } from "@/components/marketing/PageHero";
import { Bullets, Callout, DataTable } from "@/components/marketing/Prose";
import { ButtonLink } from "@/components/ui/Button";
import { findTopic } from "@/lib/support";

const TOPIC = findTopic("restricted-items");

export const metadata: Metadata = { title: TOPIC.title, description: TOPIC.blurb };

const BANNED = [
  "Currency, bank drafts, bearer instruments and negotiable securities",
  "Gold, silver, bullion, precious metals and loose precious or semi-precious stones",
  "Firearms, ammunition, weapon parts and replica weapons",
  "Explosives, fireworks, detonators and blasting agents",
  "Narcotics, psychotropic substances and drug precursors",
  "Radioactive material and fissile substances",
  "Live animals, birds, fish and insects",
  "Human remains, ashes, body parts, organs, blood and tissue",
  "Counterfeit goods and material infringing a trademark or copyright",
  "Obscene, seditious or otherwise unlawful material",
  "Wildlife products, ivory, animal skins and protected plant species",
  "Loose lithium cells and damaged or recalled batteries of any chemistry",
];

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="Support"
        title={TOPIC.title}
        lead="Two lists. The first we cannot carry under any circumstances. The second we will carry, but only with paperwork agreed before booking."
      />

      <Section>
        <SectionHead
          title="Never accepted"
          lead="Prohibited outright, on every service and every lane. A consignment found to contain any of these is held, reported where the law requires it, and returned at the consignor's cost."
        />
        <Bullets items={BANNED} columns={2} />
      </Section>

      <Section className="border-y border-line bg-surface">
        <SectionHead
          title="Accepted on prior approval"
          lead="Tell us before you book. Approval is per lane, because what a carrier will move through one state it may refuse in another."
        />
        <DataTable
          head={["Category", "What we need", "Constraint"]}
          rows={[
            [
              "Dangerous goods (DG)",
              "MSDS, UN classification and a signed DG declaration",
              "Surface only, limited quantities, no air lane",
            ],
            [
              "Lithium batteries in equipment",
              "UN 38.3 test summary and state-of-charge declaration",
              "Installed in the device; loose cells are prohibited",
            ],
            [
              "Aerosols, paints and solvents",
              "MSDS and flashpoint declaration",
              "Surface only; flashpoint above 60 °C",
            ],
            [
              "Alcohol",
              "Excise permit for both origin and destination state",
              "Refused entirely for dry states",
            ],
            [
              "Tobacco products",
              "Licence copy and state entry permit",
              "Commercial quantities only, no retail-to-consumer",
            ],
            [
              "Pharmaceuticals",
              "Drug licence copy; cold-chain plan if temperature-controlled",
              "Named lanes only",
            ],
            [
              "Perishables",
              "Shelf-life declaration and packaging spec",
              "Express lanes only, no transit halt",
            ],
            [
              "High-value electronics",
              "Invoice and serial-number list; carrier risk (FOV) mandatory",
              "Declared value cap per carton applies",
            ],
            [
              "Machinery containing fuel or oil",
              "Drain-and-purge certificate",
              "Tanks must be empty and vented",
            ],
            [
              "Sealed documents and tenders",
              "Sealed-envelope declaration",
              "Express with signature on delivery",
            ],
          ]}
          caption="Approval is granted per consignment, not as a standing arrangement — a repeat lane still needs the declaration each time."
        />
      </Section>

      <Section>
        <SectionHead title="What happens if something slips through" />
        <div className="space-y-4">
          <Callout tone="danger" title="Undeclared prohibited goods void all cover">
            If a consignment is found to contain a prohibited item, carrier liability and FOV cover
            lapse in full, including for the other cartons in the same consignment. The consignor
            also carries any fine levied at a checkpost.
          </Callout>
          <Callout tone="warn" title="We open cartons only where the law requires it">
            Routine consignments are not opened. Cartons are inspected when a checkpost officer
            directs it, when a scan or X-ray flags an anomaly, or when a declaration and the carton
            weight are plainly inconsistent.
          </Callout>
          <Callout title="Ask first — it is quicker than a refusal at the dock">
            A commodity check takes minutes on the phone. A consignment turned away at collection
            costs you the day.
          </Callout>
        </div>
      </Section>

      <Section className="border-t border-line">
        <SectionHead
          title="Check a commodity"
          lead="Send the commodity, the HSN code if you have it, and the origin and destination states."
        />
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/contact">Ask the ops desk</ButtonLink>
          <ButtonLink href="/support/mandatory-documentation" variant="secondary">
            Documentation requirements
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
