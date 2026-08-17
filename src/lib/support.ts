/**
 * The Support section's topic registry.
 *
 * One list feeds the nav dropdown, the /support index and the footer, so a new
 * topic is added in exactly one place. `icon` is a lucide export name, resolved
 * by the pages rather than stored here — this module stays free of JSX so it can
 * be imported from server and client components alike.
 */
export type SupportTopic = {
  slug: string;
  title: string;
  /** One line, used on the index cards and as the page's meta description. */
  blurb: string;
  icon:
    | "FileCheck2"
    | "Ban"
    | "CalendarDays"
    | "Fuel"
    | "Ruler"
    | "ShieldAlert"
    | "HeartHandshake"
    | "MessageSquareWarning";
};

export const SUPPORT_TOPICS: SupportTopic[] = [
  {
    slug: "mandatory-documentation",
    title: "Mandatory Documentation",
    blurb: "What must travel with the consignment, and when an e-way bill is required.",
    icon: "FileCheck2",
  },
  {
    slug: "restricted-items",
    title: "Banned/Restricted Items",
    blurb: "Goods we cannot carry at all, and those we carry only on prior approval.",
    icon: "Ban",
  },
  {
    slug: "holiday-calendar",
    title: "Holiday Calendar",
    blurb: "Network holidays for 2026 and how cut-offs shift around them.",
    icon: "CalendarDays",
  },
  {
    slug: "fuel-surcharge",
    title: "Fuel Surcharge Information",
    blurb: "How the monthly surcharge is derived from the retail diesel price.",
    icon: "Fuel",
  },
  {
    slug: "volumetric",
    title: "Volumetric Information",
    blurb: "Chargeable weight, divisors by mode, and a worked example.",
    icon: "Ruler",
  },
  {
    slug: "fraud-awareness",
    title: "Fraud Awareness",
    blurb: "Scams that use our name, and the things we will never ask you for.",
    icon: "ShieldAlert",
  },
  {
    slug: "csr-policy",
    title: "CSR Policy",
    blurb: "Our focus areas, governance and how spend is allocated.",
    icon: "HeartHandshake",
  },
  {
    slug: "complaint",
    title: "Register A Complaint",
    blurb: "Raise a shortage, damage or service complaint and track the escalation.",
    icon: "MessageSquareWarning",
  },
];

export const supportHref = (slug: string) => `/support/${slug}`;

export function findTopic(slug: string): SupportTopic {
  const topic = SUPPORT_TOPICS.find((t) => t.slug === slug);
  // Every page passes its own slug, so a miss is a wiring bug, not user input.
  if (!topic) throw new Error(`Unknown support topic: ${slug}`);
  return topic;
}
