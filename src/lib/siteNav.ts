/**
 * Public site navigation.
 *
 * One source of truth so the header, the mobile drawer and the footer can never
 * drift apart. `children` turns a tab into a dropdown.
 */
export type NavChild = { href: string; label: string; blurb?: string };
export type NavItem = { href: string; label: string; children?: NavChild[] };

export const SITE_NAV: NavItem[] = [
  { href: "/", label: "Home" },
  {
    href: "/services",
    label: "Services",
    children: [
      { href: "/services#express", label: "Express", blurb: "Priority air, 1–2 days" },
      { href: "/services#standard", label: "Standard parcel", blurb: "Surface, 3–6 days" },
      { href: "/services#freight", label: "Freight & cargo", blurb: "Palletised and part-truckload" },
    ],
  },
  { href: "/associates", label: "Associates" },
  {
    href: "/support",
    label: "Support",
    children: [
      { href: "/track", label: "Track a shipment", blurb: "Live status by LRN" },
      { href: "/support#claims", label: "Raise a claim", blurb: "Shortage or damage" },
      { href: "/faqs", label: "FAQs", blurb: "Common questions" },
    ],
  },
  {
    href: "/media",
    label: "Media",
    children: [
      { href: "/media#news", label: "News", blurb: "Network updates" },
      { href: "/media#press", label: "Press releases", blurb: "Official statements" },
      { href: "/media#brand", label: "Brand assets", blurb: "Logo and usage" },
    ],
  },
  { href: "/career", label: "Career" },
  { href: "/faqs", label: "FAQs" },
  { href: "/contact", label: "Contact Us" },
];

/** The service catalogue, shared by the home page and the services page. */
export const SERVICES = [
  {
    id: "express",
    title: "Express",
    eta: "1–2 business days",
    body: "Priority air routing for documents and urgent parcels that cannot wait on a standard lane.",
    points: [
      "Next-flight-out on metro pairs",
      "Live scan-by-scan tracking",
      "Priority checkpost clearance",
    ],
  },
  {
    id: "standard",
    title: "Standard parcel",
    eta: "3–6 business days",
    body: "Reliable surface and air-surface shipping for everyday domestic parcels across 19,000+ PIN codes.",
    points: ["Best cost per kg", "Scan-level tracking", "Owner or carrier risk"],
  },
  {
    id: "freight",
    title: "Freight & cargo",
    eta: "Custom timeline",
    body: "Palletised and part-truckload freight by road or rail, with the Lorry Receipt and e-way bill handled for you.",
    points: ["Contracted lane rate cards", "Dedicated coordinator", "Full documentation"],
  },
] as const;
