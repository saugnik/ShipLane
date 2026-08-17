import type { Metadata } from "next";
import { PageHero, Section, SectionHead } from "@/components/marketing/PageHero";
import { Bullets, Callout, DataTable, DefList } from "@/components/marketing/Prose";
import { ButtonLink } from "@/components/ui/Button";
import { findTopic } from "@/lib/support";

const TOPIC = findTopic("holiday-calendar");

export const metadata: Metadata = { title: TOPIC.title, description: TOPIC.blurb };

/**
 * Festivals that follow the lunar calendar are marked provisional on purpose.
 * Their Gregorian date is fixed only when the almanac is published, so a
 * calendar that states them as settled fact will be wrong in some years.
 */
type Holiday = {
  date: string;
  day: string;
  name: string;
  status: "Closed" | "Trunk only" | "Limited";
  provisional?: boolean;
};

const HOLIDAYS_2026: Holiday[] = [
  { date: "26 January", day: "Monday", name: "Republic Day", status: "Closed" },
  { date: "4 March", day: "Wednesday", name: "Holi", status: "Closed", provisional: true },
  { date: "21 March", day: "Saturday", name: "Id-ul-Fitr", status: "Trunk only", provisional: true },
  { date: "3 April", day: "Friday", name: "Good Friday", status: "Trunk only" },
  { date: "15 August", day: "Saturday", name: "Independence Day", status: "Closed" },
  { date: "2 October", day: "Friday", name: "Gandhi Jayanti", status: "Closed" },
  { date: "20 October", day: "Tuesday", name: "Dussehra", status: "Closed", provisional: true },
  { date: "8 November", day: "Sunday", name: "Diwali", status: "Closed", provisional: true },
  { date: "9 November", day: "Monday", name: "Diwali (day after)", status: "Trunk only", provisional: true },
  { date: "25 December", day: "Friday", name: "Christmas Day", status: "Trunk only" },
];

const BADGE: Record<Holiday["status"], string> = {
  Closed: "bg-rose-500/12 text-rose-700 ring-rose-500/25 dark:text-rose-300",
  "Trunk only": "bg-amber-500/12 text-amber-800 ring-amber-500/25 dark:text-amber-300",
  Limited: "bg-brand-500/12 text-brand-700 ring-brand-500/25 dark:text-brand-400",
};

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="Support"
        title={TOPIC.title}
        lead="Network holidays for 2026, what each one does to collection and delivery, and how booking cut-offs move around them."
      />

      <Section>
        <SectionHead
          eyebrow="2026"
          title="National network holidays"
          lead="Regional holidays are observed branch by branch and are not listed here — your booking branch publishes its own."
        />
        <DataTable
          head={["Date", "Day", "Holiday", "Network status"]}
          rows={HOLIDAYS_2026.map((h) => [
            <span key="date">
              {h.date}
              {h.provisional && (
                <span className="ml-1.5 align-middle text-[11px] font-normal text-ink-3">
                  provisional
                </span>
              )}
            </span>,
            h.day,
            h.name,
            <span
              key="status"
              className={`inline-flex rounded-[5px] px-2 py-0.5 text-[12px] font-semibold ring-1 ring-inset ${BADGE[h.status]}`}
            >
              {h.status}
            </span>,
          ])}
          align={["left", "left", "left", "left"]}
          caption="Dates marked provisional follow the lunar calendar and are confirmed roughly a month ahead. Everything else is fixed."
        />
      </Section>

      <Section className="border-y border-line bg-surface">
        <SectionHead title="What each status means" />
        <DefList
          items={[
            [
              "Closed",
              "No collection, no delivery, no hub sorting. Consignments already in transit sit where they are and resume on the next working day.",
            ],
            [
              "Trunk only",
              "Line-haul between hubs runs as normal, so transit time is not lost — but nothing is collected from your dock and nothing is delivered.",
            ],
            [
              "Limited",
              "Metro delivery runs on a reduced beat. Collection is by prior arrangement only, and ODA locations are not served.",
            ],
            [
              "Sundays",
              "Not listed above because they recur: no collection or delivery, trunk lines run. Sunday does not count as a transit day in any quoted ETA.",
            ],
          ]}
        />
      </Section>

      <Section>
        <SectionHead title="How holidays affect your booking" />
        <Bullets
          items={[
            "Quoted transit times are in working days. A holiday inside the window extends the delivery date by a day; it does not compress the transit.",
            "The cut-off on the working day before a Closed holiday moves earlier — typically to 14:00 — because outbound vehicles are dispatched early to clear the hub.",
            "Volumes in the four working days after a Closed holiday run well above normal. Book a day earlier than you would otherwise, especially around Diwali.",
            "Consignments requiring an e-way bill need the validity to cover the holiday too. A bill raised the day before a two-day closure can lapse in transit.",
            "Perishables and cold-chain consignments are not accepted for dispatch into a Closed holiday, because there is no hub handling to maintain the chain.",
          ]}
        />

        <div className="mt-8">
          <Callout tone="warn" title="Diwali is the one to plan around">
            The week either side of Diwali is the heaviest of the year on every lane. Capacity is
            allocated to contracted volumes first, and ODA beats can add two to three days. If you
            have a delivery commitment in that window, tell us a fortnight ahead.
          </Callout>
        </div>
      </Section>

      <Section className="border-t border-line">
        <SectionHead
          title="Need the calendar for a specific branch?"
          lead="Regional holidays vary by state and by branch. We will send you the list for your origin and destination."
        />
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/contact">Ask the ops desk</ButtonLink>
          <ButtonLink href="/track" variant="secondary">
            Track a shipment
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
