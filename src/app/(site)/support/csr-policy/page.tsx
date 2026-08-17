import type { Metadata } from "next";
import { PageHero, Section, SectionHead } from "@/components/marketing/PageHero";
import { Bullets, Callout, DataTable, DefList } from "@/components/marketing/Prose";
import { ButtonLink } from "@/components/ui/Button";
import { findTopic } from "@/lib/support";
import { BRAND } from "@/lib/brand";

const TOPIC = findTopic("csr-policy");

export const metadata: Metadata = { title: TOPIC.title, description: TOPIC.blurb };

const ALLOCATION: [area: string, share: string, detail: string][] = [
  [
    "Road safety and driver welfare",
    "35%",
    "Defensive-driving certification, eye tests and rest-stop facilities for drivers on our trunk lanes",
  ],
  [
    "Education and skilling",
    "25%",
    "Logistics and warehouse skilling for school-leavers in the districts around our hubs",
  ],
  [
    "Environment",
    "20%",
    "Fleet emission upgrades, hub solar rooftops and packaging-waste recovery",
  ],
  [
    "Healthcare",
    "15%",
    "Mobile health camps at transport nagars and annual screening for hub and dock staff",
  ],
  ["Disaster response", "5%", "Free movement of relief consignments during declared emergencies"],
];

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="Support"
        title={TOPIC.title}
        lead={`Where ${BRAND.name} spends its corporate social responsibility budget, who decides, and how it is reported.`}
      />

      <Section>
        <SectionHead
          title="Our approach"
          lead="We put the budget where our operations already touch people's lives — on the road, at the dock, and in the districts our hubs sit in."
        />
        <div className="prose-none space-y-4 text-[16px] leading-relaxed text-ink-2">
          <p>
            A freight network is not an abstract thing. It is drivers on national highways for
            fourteen hours at a stretch, loaders on a dock in April heat, and diesel burned on every
            kilometre we sell. Those are the places where money spent has a measurable effect, and
            they are where this policy is aimed.
          </p>
          <p>
            We would rather do a few things properly than spread the budget thinly across causes we
            have no standing in. Each area below has a named owner, a defined outcome and an annual
            target that the board reviews.
          </p>
        </div>
      </Section>

      <Section className="border-y border-line bg-surface">
        <SectionHead
          title="Focus areas and allocation"
          lead="Indicative split of the annual CSR budget. Unspent allocation in any area is carried into the next financial year rather than redirected late in the cycle."
        />
        <DataTable
          head={["Focus area", "Share", "What it funds"]}
          rows={ALLOCATION.map(([a, s, d]) => [a, s, d])}
          align={["left", "right", "left"]}
        />
      </Section>

      <Section>
        <SectionHead title="Governance" />
        <DefList
          items={[
            [
              "CSR Committee",
              "Constituted by the Board, comprising two directors and the Head of Operations. It approves the annual action plan, the project list and any reallocation above 10% of an area's budget.",
            ],
            [
              "Budget basis",
              "Two per cent of the average net profit of the three immediately preceding financial years, computed under Section 198 of the Companies Act, 2013.",
            ],
            [
              "Implementation",
              "Directly, or through implementing agencies registered with the Ministry of Corporate Affairs and holding a valid CSR-1 registration.",
            ],
            [
              "Reporting",
              "An annual report on CSR activities forms part of the Board's Report, with project-wise spend and outcomes. Published alongside the annual accounts.",
            ],
            [
              "Impact assessment",
              "Projects above ₹1 crore are independently assessed, and the assessment is annexed to the Board's Report.",
            ],
            [
              "Surplus",
              "Any surplus arising from a CSR project is not treated as business profit. It is ploughed back into the same project or transferred to a Schedule VII fund.",
            ],
          ]}
        />

        <div className="mt-8">
          <Callout title="Statutory basis">
            This policy is framed under Section 135 of the Companies Act, 2013 and the Companies
            (Corporate Social Responsibility Policy) Rules, 2014. The obligation applies to a company
            meeting any of the thresholds of net worth ₹500 crore, turnover ₹1,000 crore, or net
            profit ₹5 crore in the immediately preceding financial year. Where the company falls
            below all three thresholds in a year, the focus areas below are pursued voluntarily and
            reported on the same basis.
          </Callout>
        </div>
      </Section>

      <Section className="border-y border-line bg-surface">
        <SectionHead title="What is excluded" />
        <Bullets
          items={[
            "Activities undertaken in the normal course of business",
            "Contributions to any political party, directly or indirectly",
            "Spend that benefits only our own employees and their families",
            "Sponsorship that exists mainly to earn marketing benefit for the company",
            "Activities carried out outside India, other than training of Indian sportspersons",
            "One-off donations made without a project plan or an outcome measure",
          ]}
        />
      </Section>

      <Section>
        <SectionHead
          title="Relief consignments"
          lead="The part of this policy that uses the network itself rather than the budget."
        />
        <div className="prose-none space-y-4 text-[16px] leading-relaxed text-ink-2">
          <p>
            During a state or nationally declared disaster we carry relief consignments free of
            freight on any lane we operate, for registered relief agencies and state disaster
            authorities. Documentation is reduced to a consignment note and a manifest, and these
            consignments are given priority over commercial freight on affected lanes.
          </p>
          <p>
            Requests are cleared by the duty manager within the hour rather than going through the
            committee — in a live emergency the approval chain is the thing most likely to fail.
          </p>
        </div>
      </Section>

      <Section className="border-t border-line">
        <SectionHead
          title="Proposals and enquiries"
          lead="Implementing agencies with a CSR-1 registration and a project in one of the focus areas are welcome to write in."
        />
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`mailto:${BRAND.supportEmail}?subject=CSR%20proposal`}>
            Email a proposal
          </ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            Contact us
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
