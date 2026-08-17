import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";
import { PageHero, Section, SectionHead } from "@/components/marketing/PageHero";
import { Bullets, Callout, DataTable, DefList, Steps } from "@/components/marketing/Prose";
import { ButtonLink } from "@/components/ui/Button";
import { findTopic } from "@/lib/support";
import { BRAND } from "@/lib/brand";

const TOPIC = findTopic("complaint");

export const metadata: Metadata = { title: TOPIC.title, description: TOPIC.blurb };

const SUBJECT = encodeURIComponent("Complaint — LRN ");
const BODY = encodeURIComponent(
  [
    "LRN:",
    "Invoice number:",
    "Consignor:",
    "Consignee:",
    "Date of booking:",
    "Date of delivery (if delivered):",
    "",
    "Complaint type (shortage / damage / delay / billing / conduct / other):",
    "",
    "What happened:",
    "",
    "",
    "Number of cartons affected:",
    "Was it noted on the POD? (yes / no):",
    "Photographs attached? (yes / no):",
  ].join("\n"),
);

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="Support"
        title={TOPIC.title}
        lead="Shortage, damage, delay, billing or conduct. One route in, a fixed acknowledgement time, and a published escalation ladder if the first answer does not settle it."
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`mailto:${BRAND.supportEmail}?subject=${SUBJECT}&body=${BODY}`}>
            <Mail className="size-4" />
            Open a pre-filled complaint email
          </ButtonLink>
          <ButtonLink
            href={`tel:${BRAND.supportPhone.replace(/\s+/g, "")}`}
            variant="secondary"
          >
            <Phone className="size-4" />
            {BRAND.supportPhone}
          </ButtonLink>
        </div>
      </PageHero>

      <Section>
        <Callout tone="warn" title="Damage or shortage: seven days, in writing">
          Carrier liability for shortage or damage lapses seven days after delivery. A phone call
          does not preserve the claim — it has to be in writing, with the LRN. If you are close to
          the deadline, send a bare email with the LRN today and the detail tomorrow.
        </Callout>
      </Section>

      <Section className="border-y border-line bg-surface">
        <SectionHead
          title="What to send"
          lead="A complaint with these five things attached is usually resolved without a second exchange. Without them we end up asking, and that costs you days."
        />
        <DefList
          items={[
            [
              "The LRN",
              "The nine-digit Lorry Receipt Number. It is on the Lorry Receipt and on every carton tag, and it is the only reference that identifies the consignment across carriers.",
            ],
            [
              "The commercial invoice",
              "Establishes the value of what was in the carton. A claim cannot be assessed against a declared value we do not have.",
            ],
            [
              "Photographs",
              "The outer carton, the seal or tape, the tag, and the contents as found. Photograph before unpacking further — a repacked carton cannot be assessed.",
            ],
            [
              "The proof of delivery",
              "With the shortage or damage recorded on it at handover, and the driver's acknowledgement. This is the single strongest piece of evidence in a freight claim.",
            ],
            [
              "Affected carton numbers",
              "Which cartons of the consignment, by the box AWB on their tags. On a multi-carton consignment this narrows the investigation to specific scans.",
            ],
            [
              "Your preferred outcome",
              "Repair, replacement, credit note or freight waiver. Telling us up front removes a round of negotiation.",
            ],
          ]}
        />
      </Section>

      <Section>
        <SectionHead
          title="At handover — the four minutes that decide a claim"
          lead="Freight claims are won or lost at the door, not in the correspondence afterwards."
        />
        <Steps
          items={[
            [
              "Count before you sign",
              "Count the cartons against the box count on the Lorry Receipt. A signature on a clean POD is an acknowledgement that everything arrived intact.",
            ],
            [
              "Note it on the POD",
              "Write the shortage or the visible damage on the proof of delivery and have the driver initial it. A driver cannot refuse this.",
            ],
            [
              "Photograph before unpacking",
              "Carton, seal, tag, then contents. Time-stamped photographs from the point of handover carry far more weight than any taken later.",
            ],
            [
              "Email the same day",
              "Even a one-line email with the LRN starts the clock in your favour and fixes the date the complaint was raised.",
            ],
          ]}
        />
      </Section>

      <Section className="border-y border-line bg-surface">
        <SectionHead
          title="Response times"
          lead="Working days, from when the complaint reaches us in writing with an LRN."
        />
        <DataTable
          head={["Stage", "Commitment"]}
          rows={[
            ["Acknowledgement, with a complaint reference", "1 working day"],
            ["First substantive response", "3 working days"],
            ["Delay, billing and conduct complaints — resolution", "7 working days"],
            ["Shortage and damage claims — assessment", "15 working days from full documentation"],
            ["Settlement, once assessed and agreed", "21 working days"],
          ]}
          align={["left", "right"]}
          caption="Where a carrier investigation or a hub CCTV review is required, we tell you at the first response rather than letting the clock run silently."
        />
      </Section>

      <Section>
        <SectionHead
          title="Escalation ladder"
          lead="If a stage does not answer you inside its committed time, go to the next one and quote the complaint reference. You do not need permission to escalate."
        />
        <DataTable
          head={["Level", "Who", "Route", "Respond within"]}
          rows={[
            [
              "Level 1",
              "Ops desk",
              <span key="l1" className="docnum break-all">
                {BRAND.supportEmail}
              </span>,
              "3 working days",
            ],
            [
              "Level 2",
              "Service Quality Head",
              <span key="l2" className="docnum break-all">
                escalations@{BRAND.website.replace(/^www\./, "")}
              </span>,
              "5 working days",
            ],
            [
              "Level 3",
              "Nodal Officer",
              <span key="l3" className="docnum break-all">
                nodal@{BRAND.website.replace(/^www\./, "")}
              </span>,
              "7 working days",
            ],
          ]}
          caption="Mark the earlier correspondence into any escalation. Starting a fresh thread resets the investigation rather than advancing it."
        />

        <div className="mt-8">
          <Callout title="Owner risk vs carrier risk">
            Goods move at owner&apos;s risk unless carrier risk (FOV) was opted for and charged at
            booking. Check the Risk Coverage field on your Lorry Receipt before filing — it
            determines the ceiling on what can be settled, whatever the invoice value.
          </Callout>
        </div>
      </Section>

      <Section className="border-y border-line bg-surface">
        <SectionHead title="What we cannot settle" />
        <Bullets
          items={[
            "Claims raised more than seven days after delivery",
            "Consignments delivered against a clean POD with no shortage or damage recorded",
            "Concealed damage where the carton and its packaging were discarded before photographs",
            "Loss of goods that were prohibited or undeclared — cover lapses in full for the whole consignment",
            "Consequential loss: lost sales, contractual penalties or business interruption",
            "Delay caused by a checkpost detention arising from your documentation, or by a declared force majeure event",
          ]}
        />
      </Section>

      <Section>
        <SectionHead
          title="Not a complaint, just a question?"
          lead="Tracking answers most status questions instantly, and the FAQs cover weights, e-way bills and charges."
        />
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/track">Track a shipment</ButtonLink>
          <ButtonLink href="/faqs" variant="secondary">
            Browse FAQs
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
