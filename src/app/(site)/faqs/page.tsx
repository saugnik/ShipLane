import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { PageHero, Section, SectionHead } from "@/components/marketing/PageHero";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Weights, e-way bills, documents, tracking and charges — answered.",
};

type Faq = { q: string; a: string };

const GROUPS: { heading: string; items: Faq[] }[] = [
  {
    heading: "Booking",
    items: [
      {
        q: "What do I need before I can book?",
        a: "The pickup and drop company names, a contact email and phone, full addresses with PIN codes, the product being shipped, and your commercial invoice number. Everything else — rating, documents, tags — is generated for you.",
      },
      {
        q: "Do I need a GSTIN?",
        a: "Only if the consignor or consignee is GST-registered. When entered it must be a valid 15-character GSTIN, because it is printed on the Lorry Receipt and read at checkposts.",
      },
      {
        q: "When is an e-way bill required?",
        a: "For most inter-state movements of goods valued above ₹50,000. If you already have the number, enter it at the invoice step and it is carried onto the Lorry Receipt; the platform does not generate e-way bills on your behalf.",
      },
      {
        q: "Can I book several cartons under one consignment?",
        a: "Yes. Add one manifest line per carton type with its quantity, and the total box count is the sum of the quantities. Each carton still prints its own tag with its own barcode.",
      },
    ],
  },
  {
    heading: "Weight and charges",
    items: [
      {
        q: "How is chargeable weight calculated?",
        a: "The higher of actual weight and volumetric weight. Volumetric is (length × breadth × height in cm) ÷ 5000 per carton, multiplied by the quantity on that manifest line, and the totals across all lines are compared.",
      },
      {
        q: "What is an ODA charge?",
        a: "Out of Delivery Area — a surcharge on PIN codes outside a carrier's regular beat. It is shown in the quote before you accept, never added afterwards.",
      },
      {
        q: "What does FOV mean on my quote?",
        a: "Freight On Value, the carrier-risk cover. Without it the consignment moves at owner's risk and the carrier's liability is limited regardless of the invoice value.",
      },
      {
        q: "Can the price change after I book?",
        a: "The rate you accept is frozen onto the Lorry Receipt. It can only change if the actual weight or dimensions measured at the hub differ from what was declared.",
      },
    ],
  },
  {
    heading: "Documents and tracking",
    items: [
      {
        q: "What is an LRN?",
        a: "The Lorry Receipt Number — the 9-digit reference for the whole consignment. It is printed on the Lorry Receipt and on every carton tag, and it is what you enter on the tracking page.",
      },
      {
        q: "Where do I get the Lorry Receipt and carton tags?",
        a: "Both are generated as PDFs the moment the booking is confirmed, and can be downloaded again at any time from the consignment page in your console.",
      },
      {
        q: "Can someone track a shipment without an account?",
        a: "Yes. The tracking page is public — anyone with the LRN can see the current status and scan history.",
      },
      {
        q: "How long do I have to report damage or shortage?",
        a: "Seven days from delivery, in writing. Note it on the proof of delivery at handover and keep the packaging and photographs.",
      },
    ],
  },
  {
    heading: "Accounts",
    items: [
      {
        q: "Who can see my consignments?",
        a: "You see the consignments booked from your account. Nobody outside your organisation can see them from the console.",
      },
      {
        q: "Can a booking be deleted?",
        a: "No. Consignments are an operational record and cannot be deleted once created — if something is wrong, contact the ops desk and it is corrected with an audit trail.",
      },
    ],
  },
];

export default function FaqsPage() {
  return (
    <>
      <PageHero
        eyebrow="FAQs"
        title="The questions the ops desk gets most."
        lead="Weights, documents, charges and what happens when something goes wrong."
      />

      {GROUPS.map((g, i) => (
        <Section key={g.heading} className={i % 2 === 1 ? "border-y border-line bg-surface" : undefined}>
          <SectionHead title={g.heading} />
          <div className="overflow-hidden rounded-[16px] border border-line bg-surface">
            {g.items.map((f, idx) => (
              <details
                key={f.q}
                className={`group ${idx > 0 ? "border-t border-line" : ""} ${
                  i % 2 === 1 ? "bg-canvas" : ""
                }`}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-7 py-5 text-[16px] text-ink transition-colors hover:bg-sunken">
                  {f.q}
                  <ChevronDown className="size-4.5 shrink-0 text-ink-3 transition-transform group-open:rotate-180" />
                </summary>
                <p className="px-7 pb-6 text-[14.5px] leading-relaxed text-ink-3">{f.a}</p>
              </details>
            ))}
          </div>
        </Section>
      ))}

      <Section>
        <SectionHead
          title="Not answered here?"
          lead={`The ops desk is on ${BRAND.supportPhone} on working days, or write to us and we will come back the same day.`}
        />
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/contact">Contact us</ButtonLink>
          <ButtonLink href="/track" variant="secondary">
            Track a shipment
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
