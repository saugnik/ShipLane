import Link from "next/link";
import { LogoWord } from "@/components/Logo";
import { BRAND } from "@/lib/brand";

const COLUMNS = [
  {
    head: "Company",
    links: [
      ["Associates", "/associates"],
      ["Media", "/media"],
      ["Contact us", "/contact"],
    ],
  },
  {
    head: "Services",
    links: [
      ["Express", "/services#express"],
      ["Standard parcel", "/services#standard"],
      ["Freight & cargo", "/services#freight"],
    ],
  },
  {
    head: "Support",
    links: [
      ["Track a shipment", "/track"],
      ["Mandatory documentation", "/support/mandatory-documentation"],
      ["Banned/restricted items", "/support/restricted-items"],
      ["Volumetric information", "/support/volumetric"],
      ["Register a complaint", "/support/complaint"],
      ["FAQs", "/faqs"],
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="panel-navy pt-16 pb-8">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid gap-10 border-b border-white/10 pb-11 md:grid-cols-2 xl:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <LogoWord className="text-panel-ink" />
            <p className="mt-3.5 max-w-[280px] text-[14px] leading-relaxed text-panel-ink-3">
              Courier and freight network moving parcels, pallets and cargo across 19,000+ PIN codes
              with live tracking end to end.
            </p>
            <p className="mt-4 text-[13px] text-panel-ink-2">
              {BRAND.supportPhone}
              <br />
              <span className="break-all">{BRAND.supportEmail}</span>
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.head}>
              <h4 className="mb-4 text-[13px] tracking-[0.06em] text-panel-ink uppercase">
                {col.head}
              </h4>
              {col.links.map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="block py-1.5 text-[14px] text-panel-ink-2 transition-colors hover:text-brand-500"
                >
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 text-[13px] text-panel-ink-3">
          <span>© 2026 {BRAND.legalName}. All rights reserved.</span>
          <span>
            CIN {BRAND.cin} · Transporter ID {BRAND.transporterId}
          </span>
        </div>
      </div>
    </footer>
  );
}
