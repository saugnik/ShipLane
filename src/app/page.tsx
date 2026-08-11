import Link from "next/link";
import { ChevronsRight, Globe, Package, Truck } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { LogoWord } from "@/components/Logo";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { RoutePanel } from "@/components/marketing/RoutePanel";
import { TrackBox } from "@/components/marketing/TrackBox";
import { currentSession } from "@/lib/auth/session";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

const SERVICES = [
  {
    icon: ChevronsRight,
    title: "Express",
    body: "Priority air routing for documents and urgent parcels that cannot wait on a standard lane.",
    eta: "1–2 business days",
  },
  {
    icon: Package,
    title: "Standard parcel",
    body: "Reliable surface and air-surface shipping for everyday domestic and cross-border parcels.",
    eta: "3–6 business days",
  },
  {
    icon: Truck,
    title: "Freight & cargo",
    body: "Palletised and part-truckload freight by road, rail or air, with the LR and e-way bill handled.",
    eta: "Custom timeline",
  },
  {
    icon: Globe,
    title: "International",
    body: "Customs brokerage, duties calculation and compliance built into every cross-border label.",
    eta: "Door to door",
  },
];

const STEPS = [
  {
    tag: "PICKUP",
    title: "Scheduled collection",
    body: "A driver collects from your dock within the window you choose — no waiting around all day.",
  },
  {
    tag: "TRANSIT",
    title: "Hub sorting & checkposts",
    body: "Your consignment clears checkposts and transfers hubs automatically; tracking updates at every scan.",
  },
  {
    tag: "DELIVERY",
    title: "Final mile handoff",
    body: "Delivered against a signed POD, or redirected to a pickup point on request.",
  },
];

const RATES = [
  {
    name: "Standard",
    price: "₹14",
    unit: "/ kg, surface",
    sub: "Best for regular domestic and regional freight.",
    points: ["3–6 working day delivery", "Scan-level tracking", "Owner-risk carriage"],
    cta: "Get a quote",
    featured: false,
  },
  {
    name: "Express",
    price: "₹29",
    unit: "/ kg, air",
    sub: "For time-critical consignments crossing states.",
    points: [
      "1–2 working day delivery",
      "Live scan-by-scan tracking",
      "Full carrier-risk cover (FOV)",
      "Priority checkpost clearance",
    ],
    cta: "Get a quote",
    featured: true,
  },
  {
    name: "Freight",
    price: "Custom",
    unit: "/ pallet or FTL",
    sub: "For bulk, palletised or recurring lanes.",
    points: ["Dedicated freight coordinator", "Road, rail or air routing", "Contracted lane rate cards"],
    cta: "Talk to sales",
    featured: false,
  },
];

export default async function LandingPage() {
  const session = await currentSession();
  const startHref = session ? "/dashboard" : "/register";

  return (
    <div className="min-h-dvh bg-canvas">
      <PublicHeader signedIn={Boolean(session)} />

      {/* ------------------------------------------------------------ hero */}
      <section className="pt-16 pb-14 sm:pt-24">
        <div className="mx-auto grid max-w-[1180px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="eyebrow mb-5">Nationwide freight network</span>
            <h1 className="text-[clamp(38px,4.6vw,62px)] leading-[1.04] text-ink">
              Delivery that moves at{" "}
              {/* brand-600, not 500 — the raw brand orange misses 3:1 even at
                  display size on the paper canvas. */}
              <em className="text-brand-600 not-italic dark:text-brand-400">
                the speed of business.
              </em>
            </h1>
            <p className="mt-5 max-w-[480px] text-[17.5px] leading-relaxed text-ink-3">
              {BRAND.name} rates every carrier on your panel, enforces the paperwork, and prints the
              Lorry Receipt and carton tags before the vehicle reaches your dock.
            </p>

            <div className="mt-8 max-w-[480px]">
              <TrackBox />
            </div>

            <dl className="mt-7 flex flex-wrap gap-x-9 gap-y-4">
              {[
                ["19,000+", "PIN codes served"],
                ["5", "Carriers rated per booking"],
                ["99.2%", "On-time rate"],
              ].map(([num, lab]) => (
                <div key={lab}>
                  <dt className="font-display text-[22px] font-bold text-ink">{num}</dt>
                  <dd className="mt-0.5 text-[12.5px] text-ink-3">{lab}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="order-first lg:order-none">
            <RoutePanel />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ trust */}
      <div className="border-y border-line bg-surface">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-5 px-5 py-[22px] sm:px-8">
          <span className="text-[13px] font-medium text-ink-3">
            Trusted for time-critical freight by teams at
          </span>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {["Started working"].map(
              (n) => (
                <span key={n} className="font-display text-[13px] font-bold text-ink">
                  {n}
                </span>
              ),
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------ services */}
      <section id="services" className="scroll-mt-24 py-24">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
          <div className="mb-14 max-w-[600px]">
            <span className="eyebrow mb-3.5">What we move</span>
            <h2 className="text-[clamp(28px,3vw,38px)] leading-[1.12] text-ink">
              One network, four ways to ship.
            </h2>
            <p className="mt-3.5 text-[16px] leading-relaxed text-ink-3">
              Pick a speed and let the network handle checkposts, transfers and last mile — or mix
              services on a single consignment as it crosses states.
            </p>
          </div>

          {/* 1px gaps over a line-coloured bed give the hairline-grid look. */}
          <div className="grid gap-px overflow-hidden rounded-[16px] border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
            {SERVICES.map((s) => (
              <div key={s.title} className="bg-surface p-8 transition-colors hover:bg-sunken">
                <span className="grid size-[46px] place-items-center rounded-[10px] bg-canvas">
                  <s.icon className="size-[22px] text-brand-500" />
                </span>
                <h3 className="mt-5 text-[18px] text-ink">{s.title}</h3>
                <p className="mt-2.5 text-[14.5px] leading-[1.55] text-ink-3">{s.body}</p>
                <span className="docnum mt-3.5 block text-[12.5px] font-medium text-brand-700 dark:text-brand-400">
                  {s.eta}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ how */}
      <section id="how" className="scroll-mt-24 pb-24">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
          <div className="panel-navy relative overflow-hidden rounded-[24px] px-7 py-14 sm:px-14">
            <div className="mb-2 max-w-[600px]">
              <span className="eyebrow mb-3.5">The route</span>
              <h2 className="text-[clamp(28px,3vw,38px)] leading-[1.12] text-panel-ink">
                Pickup to delivery, without a black box.
              </h2>
              <p className="mt-3.5 text-[16px] leading-relaxed text-panel-ink-2">
                Every consignment moves through the same three checkpoints — you can see exactly
                which one it is at, in real time.
              </p>
            </div>

            {/* Progress rail with a node per stage. */}
            <div className="relative my-12 h-0.5 bg-white/14">
              {[0, 50, 100].map((left) => (
                <span
                  key={left}
                  className="absolute top-1/2 size-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500"
                  style={{ left: `${left}%` }}
                />
              ))}
            </div>

            <ol className="grid gap-8 md:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.tag} className="pr-6">
                  <span className="docnum mb-3.5 block text-[12px] font-medium tracking-wider text-brand-500">
                    {s.tag}
                  </span>
                  <h3 className="text-[19px] text-panel-ink">{s.title}</h3>
                  <p className="mt-2.5 text-[14.5px] leading-relaxed text-panel-ink-2">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ rates */}
      <section id="rates" className="scroll-mt-24 pb-24">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
          <div className="mb-14 max-w-[600px]">
            <span className="eyebrow mb-3.5">Pricing</span>
            <h2 className="text-[clamp(28px,3vw,38px)] leading-[1.12] text-ink">
              Straightforward rates, no checkpost surprises.
            </h2>
            <p className="mt-3.5 text-[16px] leading-relaxed text-ink-3">
              Every quote itemises freight, docket, fuel, FOV, ODA and GST upfront — and the figure
              you accept is frozen onto the Lorry Receipt.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {RATES.map((r) => (
              <div
                key={r.name}
                className={
                  r.featured
                    ? "relative flex flex-col rounded-[16px] border border-brand-500 bg-surface p-8 shadow-lg shadow-brand-500/15"
                    : "relative flex flex-col rounded-[16px] border border-line bg-surface p-8"
                }
              >
                {r.featured && (
                  <span className="absolute -top-[11px] left-7 rounded-[5px] bg-brand-600 px-2.5 py-1 text-[10.5px] font-bold tracking-[0.06em] text-white">
                    MOST BOOKED
                  </span>
                )}
                <span className="label-caps">{r.name}</span>
                <p className="font-display mt-3 text-[34px] leading-none font-bold text-ink">
                  {r.price}
                  <span className="ml-1 font-sans text-[14px] font-medium text-ink-3">{r.unit}</span>
                </p>
                <p className="mt-2 text-[13.5px] text-ink-3">{r.sub}</p>

                <ul className="mt-6 mb-7 flex-1">
                  {r.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-2.5 border-t border-line py-2.5 text-[14px] text-ink-2 first:border-t-0"
                    >
                      <span className="text-brand-600 dark:text-brand-400" aria-hidden>
                        —
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>

                <ButtonLink
                  href={startHref}
                  variant={r.featured ? "primary" : "secondary"}
                  className="w-full"
                >
                  {r.cta}
                </ButtonLink>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ cta */}
      <section className="pb-24">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
          {/* Navy on orange rather than white on orange: white body text over
              #FF5A1F is only 3.1:1, navy is 5.1:1 — and it reads as a
              deliberate brand pairing rather than a washed-out overlay. */}
          <div className="flex flex-col items-center gap-5 rounded-[20px] bg-brand-500 px-7 py-14 text-center sm:px-14">
            <h2 className="max-w-[640px] text-[clamp(26px,3vw,36px)] text-navy-800">
              Ready to send your first consignment?
            </h2>
            <p className="max-w-[480px] text-[15.5px] leading-relaxed text-navy-800">
              Create an account and get a live rate across every carrier on the panel in under a
              minute.
            </p>
            <div className="mt-1.5 flex flex-wrap justify-center gap-3.5">
              <Link
                href={startHref}
                className="rounded-[8px] bg-navy-800 px-6 py-3.5 text-[14.5px] font-bold text-white transition-transform active:scale-[0.98]"
              >
                {session ? "Open the console" : "Create free account"}
              </Link>
              <Link
                href="/track"
                className="rounded-[8px] border-[1.5px] border-navy-800 px-6 py-3.5 text-[14.5px] font-semibold text-navy-800 transition-colors hover:bg-navy-800/10"
              >
                Track a shipment
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ footer */}
      <footer id="contact" className="panel-navy pt-16 pb-8">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
          <div className="grid gap-10 border-b border-white/10 pb-11 md:grid-cols-2 xl:grid-cols-[1.4fr_repeat(3,1fr)]">
            <div>
              <LogoWord className="text-panel-ink" />
              <p className="mt-3.5 max-w-[260px] text-[14px] leading-relaxed text-panel-ink-3">
                Courier and freight network moving parcels, pallets and cargo across 19,000+ PIN
                codes with live tracking end to end.
              </p>
            </div>

            {[
              {
                head: "Product",
                links: [
                  ["Create account", "/register"],
                  ["Sign in", "/login"],
                  ["Track a shipment", "/track"],
                ],
              },
              {
                head: "Services",
                links: [
                  ["Express", "/#services"],
                  ["Standard parcel", "/#services"],
                  ["Freight & cargo", "/#services"],
                ],
              },
              {
                head: "Support",
                links: [
                  [BRAND.supportPhone, `tel:${BRAND.supportPhone.replace(/\s/g, "")}`],
                  [BRAND.supportEmail, `mailto:${BRAND.supportEmail}`],
                  ["How it works", "/#how"],
                ],
              },
            ].map((col) => (
              <div key={col.head}>
                <h4 className="mb-4 text-[13px] tracking-[0.06em] text-panel-ink uppercase">
                  {col.head}
                </h4>
                {col.links.map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    className="block py-1.5 text-[14px] break-all text-panel-ink-2 transition-colors hover:text-brand-500"
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
    </div>
  );
}
