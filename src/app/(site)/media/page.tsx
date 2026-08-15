import type { Metadata } from "next";
import { Download, Newspaper } from "lucide-react";
import { PageHero, Section, SectionHead } from "@/components/marketing/PageHero";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Media",
  description: "Network updates, press releases and brand assets.",
};

const NEWS = [
  {
    date: "12 Aug 2026",
    title: "Night trunk added on the Kolkata–Guwahati lane",
    body: "A second departure at 22:30 pulls a day out of transit for consignments booked before the evening cut-off.",
  },
  {
    date: "28 Jul 2026",
    title: "Carton tags now carry a per-box AWB",
    body: "Every carton on a multi-box consignment prints its own Code 128 barcode, so shortages are traced to the box rather than the LR.",
  },
  {
    date: "09 Jun 2026",
    title: "Rate cards published down to lane level",
    body: "Contracted customers can now see the state-and-city rate applied to a quote before they accept it.",
  },
];

const PRESS = [
  {
    date: "01 Aug 2026",
    title: `${BRAND.name} crosses 19,000 serviceable PIN codes`,
    body: "Coverage now reaches every district headquarters in the country, with ODA surcharges published upfront for the remainder.",
  },
  {
    date: "15 Apr 2026",
    title: "Carrier panel expands to five rated partners",
    body: "Bookings are now rated across five carriers on every lane, with the selected rate frozen onto the Lorry Receipt at confirmation.",
  },
];

const ASSETS = [
  ["Wordmark", "The name is set in Space Grotesk Bold. Keep clear space equal to the height of the 'S' on all four sides."],
  ["Colours", "Navy #0B1F3A for surfaces and type, orange #FF5A1F for accents. Never set body copy in orange on white."],
  ["Usage", "Do not stretch, recolour, outline or add effects to the wordmark, and do not place it on a busy photograph."],
];

export default function MediaPage() {
  return (
    <>
      <PageHero
        eyebrow="Newsroom"
        title="What is changing on the network."
        lead="Service updates, official statements and the assets you need to write about us correctly."
      />

      <Section id="news">
        <SectionHead eyebrow="News" title="Network updates" />
        <ul className="divide-y divide-line overflow-hidden rounded-[16px] border border-line bg-surface">
          {NEWS.map((n) => (
            <li key={n.title} className="flex flex-col gap-2 p-7 sm:flex-row sm:gap-8">
              <span className="docnum w-[110px] shrink-0 pt-1 text-[12.5px] font-medium text-ink-3">
                {n.date}
              </span>
              <div>
                <h3 className="text-[17.5px] text-ink">{n.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-3">{n.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="press" className="border-y border-line bg-surface">
        <SectionHead eyebrow="Press releases" title="Official statements" />
        <div className="grid gap-6 md:grid-cols-2">
          {PRESS.map((p) => (
            <article key={p.title} className="rounded-[16px] border border-line bg-canvas p-7">
              <span className="grid size-10 place-items-center rounded-[9px] bg-brand-500/12 ring-1 ring-inset ring-brand-500/20">
                <Newspaper className="size-5 text-brand-600 dark:text-brand-400" />
              </span>
              <p className="docnum mt-5 text-[12.5px] font-medium text-ink-3">{p.date}</p>
              <h3 className="mt-1.5 text-[18px] text-ink">{p.title}</h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-3">{p.body}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 text-[14px] text-ink-3">
          Media enquiries:{" "}
          <a
            href={`mailto:${BRAND.supportEmail}`}
            className="font-medium text-brand-700 hover:underline dark:text-brand-400"
          >
            {BRAND.supportEmail}
          </a>
        </p>
      </Section>

      <Section id="brand">
        <SectionHead
          eyebrow="Brand assets"
          title="Using the name and the mark"
          lead="Short version: keep the wordmark as it is, and keep orange for accents rather than body copy."
        />
        <div className="grid gap-px overflow-hidden rounded-[16px] border border-line bg-line md:grid-cols-3">
          {ASSETS.map(([head, body]) => (
            <div key={head} className="bg-surface p-7">
              <h3 className="text-[16.5px] text-ink">{head}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-3">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4 rounded-[14px] border border-line bg-surface px-6 py-5">
          <Download className="size-5 text-brand-600 dark:text-brand-400" />
          <p className="text-[14px] text-ink-2">
            Need the vector wordmark or a high-resolution logo? Write to{" "}
            <a
              href={`mailto:${BRAND.supportEmail}?subject=Brand%20assets`}
              className="font-medium text-brand-700 hover:underline dark:text-brand-400"
            >
              {BRAND.supportEmail}
            </a>{" "}
            and we will send the kit.
          </p>
        </div>
      </Section>
    </>
  );
}
