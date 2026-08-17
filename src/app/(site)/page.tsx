import Link from "next/link";
import { ChevronsRight, Package, Truck } from "lucide-react";
import { ConsolePanel } from "@/components/marketing/ConsolePanel";
import { IndiaRouteMap } from "@/components/marketing/IndiaRouteMap";
import { NetworkTicker } from "@/components/marketing/NetworkTicker";
import { TrackBox } from "@/components/marketing/TrackBox";
import { currentSession } from "@/lib/auth/session";
import { BRAND } from "@/lib/brand";
import { SERVICES } from "@/lib/siteNav";

export const dynamic = "force-dynamic";

const ICONS = { express: ChevronsRight, standard: Package, freight: Truck } as const;

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

export default async function HomePage() {
  const session = await currentSession();
  const startHref = session ? "/dashboard" : "/register";

  return (
    <>
      {/* ------------------------------------------------------------ hero
          Renders dark in both themes. The map only works against a night
          surface, and half-toning it for light mode would give two designs to
          maintain and neither of them the one that was asked for. */}
      <section className="command relative overflow-hidden">
        <div className="command-grid pointer-events-none absolute inset-0" aria-hidden />

        <div className="relative mx-auto grid max-w-[1240px] items-center gap-10 px-5 pt-14 pb-8 sm:px-8 sm:pt-20 lg:grid-cols-[1.02fr_1.08fr] lg:gap-8">
          <div>
            <span className="mb-5 flex items-center gap-3">
              <span className="h-px w-7 bg-brand-500" aria-hidden />
              <span className="text-[12px] font-semibold tracking-[0.14em] text-brand-400 uppercase">
                Nationwide freight network
              </span>
            </span>

            <h1 className="text-[clamp(38px,4.7vw,62px)] leading-[1.03] text-white">
              Delivery that moves at{" "}
              <em className="text-brand-500 not-italic">the speed of business.</em>
            </h1>

            <p className="mt-5 max-w-[470px] text-[17px] leading-relaxed text-[#a8b7d0]">
              {BRAND.name} rates every carrier on your panel, enforces the paperwork, and prints the
              Lorry Receipt and carton tags before the vehicle reaches your dock.
            </p>

            <div className="mt-8 max-w-[470px]">
              <TrackBox onDark />
            </div>

            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
              {[
                ["19,000+", "PIN codes served"],
                ["5", "Carriers rated per booking"],
                ["99.2%", "On-time rate"],
              ].map(([num, lab]) => (
                <div key={lab}>
                  <dt className="font-display text-[23px] font-bold text-white">{num}</dt>
                  <dd className="mt-0.5 text-[12.5px] text-[#8a9bb8]">{lab}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="order-first lg:order-none">
            <IndiaRouteMap />
          </div>
        </div>

        <NetworkTicker />
      </section>

      {/* ------------------------------------- console, straight after the hero */}
      <section className="py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <ConsolePanel startHref={startHref} signedIn={Boolean(session)} />
        </div>
      </section>

      {/* ------------------------------------------------------------ trust
          Capability claims, not customer logos. Every line here is something
          the platform actually does. */}
      <div className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-[1240px] gap-px bg-line px-0 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Rated across the panel", "Every booking priced by all five carriers"],
            ["Documents at booking", "Lorry Receipt and carton tags, before pickup"],
            ["Scan-level tracking", "Public by LRN, no account needed"],
            ["Charges itemised upfront", "Frozen onto the LR when you accept"],
          ].map(([head, body]) => (
            <div key={head} className="bg-surface px-6 py-6">
              <p className="text-[14px] font-semibold text-ink">{head}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-3">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------ services */}
      <section id="services" className="scroll-mt-24 py-24">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="mb-14 max-w-[600px]">
            <span className="eyebrow mb-3.5">What we move</span>
            <h2 className="text-[clamp(28px,3vw,38px)] leading-[1.12] text-ink">
              One network, three ways to ship.
            </h2>
            <p className="mt-3.5 text-[16px] leading-relaxed text-ink-3">
              Pick a speed and let the network handle checkposts, transfers and last mile — or mix
              services on a single consignment as it crosses states.
            </p>
          </div>

          {/* 1px gaps over a line-coloured bed give the hairline-grid look. */}
          <div className="grid gap-px overflow-hidden rounded-[16px] border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
            {SERVICES.map((s) => {
              const Icon = ICONS[s.id];
              return (
                <Link
                  key={s.id}
                  href={`/services#${s.id}`}
                  className="group bg-surface p-8 transition-colors hover:bg-sunken"
                >
                  <span className="grid size-[46px] place-items-center rounded-[10px] bg-canvas">
                    <Icon className="size-[22px] text-brand-500" />
                  </span>
                  <h3 className="mt-5 text-[18px] text-ink group-hover:text-brand-700 dark:group-hover:text-brand-400">
                    {s.title}
                  </h3>
                  <p className="mt-2.5 text-[14.5px] leading-[1.55] text-ink-3">{s.body}</p>
                  <span className="docnum mt-3.5 block text-[12.5px] font-medium text-brand-700 dark:text-brand-400">
                    {s.eta}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ how */}
      <section id="how" className="scroll-mt-24 pb-24">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
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

    </>
  );
}
