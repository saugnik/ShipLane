import Link from "next/link";
import {
  ArrowRight,
  BadgeIndianRupee,
  Boxes,
  FileText,
  MapPin,
  Radar,
  ShieldCheck,
  Sparkles,
  Tags,
  Truck,
  Zap,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { currentSession } from "@/lib/auth/session";
import { BRAND, LR_TERMS } from "@/lib/brand";

export const dynamic = "force-dynamic";

const STEPS = [
  { icon: MapPin, title: "Pick the lane", body: "Search pickup and drop on the map, or let the PIN code fill in city and state." },
  { icon: Boxes, title: "Declare the cargo", body: "One row per carton size with a quantity — 200 identical boxes is one line, not 200." },
  { icon: BadgeIndianRupee, title: "Compare carriers", body: "Every carrier on your panel priced on the same consignment, with the full charge breakup." },
  { icon: FileText, title: "Print and hand over", body: "A three-copy Lorry Receipt and a scannable tag for every carton, generated instantly." },
];

const FEATURES = [
  {
    icon: BadgeIndianRupee,
    title: "Rate shopping that adds up",
    body: "Contracted lane rates with the most specific match winning. Freight, docket, fuel, FOV, ODA, COD and GST are all itemised — and the price is frozen onto the LR so the invoice can never disagree.",
  },
  {
    icon: Tags,
    title: "Documents, not paperwork",
    body: "Lorry Receipt in shipper, POD and recipient copies, plus one 4×2in thermal tag per carton with its own Code128 barcode. Numbered continuously so every box has one unambiguous identity.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance built in",
    body: "E-Way Bill is enforced above ₹50,000 rather than failing at a check post. GSTIN format and its state code are validated against the address as you type.",
  },
  {
    icon: Radar,
    title: "Tracking anyone can use",
    body: "A public LRN lookup that shows movement and nothing else — no pricing, no contact details, no invoice values leak to whoever holds the number.",
  },
];

export default async function LandingPage() {
  const session = await currentSession();

  return (
    <div className="min-h-dvh bg-canvas">
      <PublicHeader signedIn={Boolean(session)} />

      {/* ------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="grid-paper pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div
          className="pointer-events-none absolute -top-40 left-1/2 size-[680px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-brand-500), transparent 65%)" }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 lg:py-28">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[11px] font-semibold text-ink-2 shadow-xs">
            <Sparkles className="size-3 text-brand-500" />
            Built for B2B part-truckload freight
          </span>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl leading-[1.08] font-bold tracking-[-0.035em] text-ink sm:text-5xl lg:text-6xl">
            Book freight, compare carriers and print the LR
            <span className="text-brand-600 dark:text-brand-400"> in one pass</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-2">
            Capture the lane, the paperwork and the cartons once. {BRAND.name} rates it across your
            entire carrier panel and generates every document the driver needs — before the vehicle
            reaches your dock.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href={session ? "/dashboard" : "/register"} size="lg">
              {session ? "Open the console" : "Create your account"}
              <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink href="/track" variant="secondary" size="lg">
              <Radar className="size-4" />
              Track a shipment
            </ButtonLink>
          </div>

          <p className="mt-4 text-xs text-ink-3">
            Sign in with a one-time code — no password to remember or leak.
          </p>

          {/* Proof strip */}
          <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line shadow-sm sm:grid-cols-4">
            {[
              ["5", "carriers rated per booking"],
              ["3", "LR copies generated"],
              ["1 tag", "per physical carton"],
              ["₹50k", "E-Way Bill threshold enforced"],
            ].map(([value, label]) => (
              <div key={label} className="bg-surface px-4 py-5">
                <dt className="tnum text-xl font-bold tracking-[-0.02em] text-ink">{value}</dt>
                <dd className="mt-1 text-[11px] leading-snug text-ink-3">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------------ how */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <p className="label-caps">How it works</p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.025em] text-ink sm:text-3xl">
            Four steps from enquiry to handover
          </h2>
        </div>

        <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-sm"
            >
              <span className="grid size-10 place-items-center rounded-[11px] bg-brand-500/10 text-brand-600 ring-1 ring-inset ring-brand-500/15 dark:text-brand-300">
                <step.icon className="size-5" />
              </span>
              <span className="tnum absolute top-5 right-5 text-xs font-bold text-ink-4">
                0{i + 1}
              </span>
              <h3 className="mt-4 text-sm font-semibold text-ink">{step.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-3">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------------------ features */}
      <section className="border-y border-line bg-sunken">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <p className="label-caps">What you get</p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.025em] text-ink sm:text-3xl">
              The parts of freight that usually go wrong
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-2">
              Wrong weights, missing e-way bills, boxes nobody can identify at a transshipment hub.
              Each one is a design decision here, not an afterthought.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-sm"
              >
                <span className="grid size-10 place-items-center rounded-[11px] bg-brand-500/10 text-brand-600 ring-1 ring-inset ring-brand-500/15 dark:text-brand-300">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-ink">{f.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ roles */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="label-caps">Access</p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.025em] text-ink sm:text-3xl">
              Your team books. Oversight only watches.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-2">
              Accounts create and manage their own consignments and never see anyone else&apos;s.
              Nothing on the platform can be deleted — a booked consignment is a commercial record,
              so it is superseded, never erased.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge tone="brand">
                <Zap className="size-3" /> One-time code sign-in
              </Badge>
              <Badge tone="neutral">Scoped to your own bookings</Badge>
              <Badge tone="success">Immutable records</Badge>
            </div>
          </div>

          <div className="rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-md">
            <div className="flex items-center gap-2.5 border-b border-line pb-4">
              <span className="grid size-9 place-items-center rounded-[10px] bg-brand-600 text-white">
                <Truck className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Ready in under a minute</p>
                <p className="text-xs text-ink-3">Email, a code, and you are in.</p>
              </div>
            </div>
            <ul className="mt-4 flex flex-col gap-3">
              {[
                "No password to set, forget or have stolen",
                "Your consignments stay private to your account",
                "Documents download the moment a booking is confirmed",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-[13px] text-ink-2">
                  <ShieldCheck className="mt-px size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  {line}
                </li>
              ))}
            </ul>
            <ButtonLink href={session ? "/dashboard" : "/register"} className="mt-6 w-full">
              {session ? "Open the console" : "Get started free"}
              <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ footer */}
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-sm">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-[10px] bg-brand-600 text-white">
                  <Truck className="size-4" />
                </span>
                <span className="text-sm font-bold tracking-[-0.02em] text-ink">{BRAND.name}</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-ink-3">{BRAND.legalName}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-4">{BRAND.registeredOffice}</p>
            </div>

            <div className="flex gap-10 text-xs">
              <div>
                <p className="label-caps mb-2">Product</p>
                <ul className="flex flex-col gap-1.5 text-ink-2">
                  <li><Link href="/register" className="hover:text-ink">Create account</Link></li>
                  <li><Link href="/login" className="hover:text-ink">Sign in</Link></li>
                  <li><Link href="/track" className="hover:text-ink">Track a shipment</Link></li>
                </ul>
              </div>
              <div>
                <p className="label-caps mb-2">Contact</p>
                <ul className="flex flex-col gap-1.5 text-ink-2">
                  <li>{BRAND.supportPhone}</li>
                  <li className="break-all">{BRAND.supportEmail}</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="mt-8 border-t border-line pt-6 text-[11px] leading-relaxed text-ink-4">
            {LR_TERMS}
          </p>
        </div>
      </footer>
    </div>
  );
}
