import Link from "next/link";
import { ArrowRight, Plane, Truck, Boxes } from "lucide-react";

/**
 * "Ready to deliver Console" — the second dark block on the home page.
 *
 * The isometric cartons either side are drawn from one primitive at a few
 * scales rather than imported as artwork, so the whole section stays vector,
 * themeable and about 4 kB.
 */

/** One isometric carton. `w`/`h` are the footprint and the wall height. */
function Carton({
  x,
  y,
  w,
  h,
  opacity = 1,
  glow = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  opacity?: number;
  glow?: boolean;
}) {
  const hw = w / 2;
  const hh = w / 4; // 2:1 isometric
  const stroke = glow ? "#ff5a1f" : "#ff8a5c";

  return (
    <g opacity={opacity} filter={glow ? "url(#cartonGlow)" : undefined}>
      {/* top */}
      <path
        d={`M${x} ${y} L${x + hw} ${y + hh} L${x} ${y + hh * 2} L${x - hw} ${y + hh} Z`}
        fill={stroke}
        fillOpacity="0.12"
        stroke={stroke}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* left wall */}
      <path
        d={`M${x - hw} ${y + hh} L${x} ${y + hh * 2} L${x} ${y + hh * 2 + h} L${x - hw} ${y + hh + h} Z`}
        fill={stroke}
        fillOpacity="0.06"
        stroke={stroke}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* right wall */}
      <path
        d={`M${x + hw} ${y + hh} L${x} ${y + hh * 2} L${x} ${y + hh * 2 + h} L${x + hw} ${y + hh + h} Z`}
        fill={stroke}
        fillOpacity="0.1"
        stroke={stroke}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </g>
  );
}

function CartonStack({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 300 300"
      className={className}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden
    >
      <defs>
        <filter id="cartonGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <Carton x={196} y={92} w={150} h={78} glow />
      <Carton x={96} y={54} w={92} h={48} opacity={0.55} />
      <Carton x={72} y={150} w={64} h={34} opacity={0.35} />
      <Carton x={188} y={218} w={48} h={26} opacity={0.25} />
    </svg>
  );
}

const MODES = [
  { icon: Boxes, label: "LTL", hint: "Part load" },
  { icon: Truck, label: "FTL", hint: "Full truck" },
  { icon: Plane, label: "Air", hint: "Express" },
];

export function ConsolePanel({ startHref, signedIn }: { startHref: string; signedIn: boolean }) {
  return (
    <div className="command relative overflow-hidden rounded-[24px] border border-white/10">
      <div className="command-grid pointer-events-none absolute inset-0" aria-hidden />

      {/* Cartons sit behind the copy on narrow screens and beside it on wide. */}
      <CartonStack className="pointer-events-none absolute -top-6 -left-16 w-[300px] opacity-45 lg:left-0 lg:w-[360px] lg:opacity-100" />
      <CartonStack
        flip
        className="pointer-events-none absolute -right-16 -bottom-10 hidden w-[340px] lg:block"
      />

      <div className="relative mx-auto max-w-[620px] px-6 py-16 text-center sm:px-10 sm:py-20">
        <h2 className="text-[clamp(28px,3.4vw,44px)] leading-[1.08] text-white">
          Ready to deliver{" "}
          <span className="text-brand-400">Console</span>
        </h2>
        <p className="mx-auto mt-4 max-w-[440px] text-[15.5px] leading-relaxed text-[#a8b7d0]">
          One booking screen rates every carrier on your panel, enforces the paperwork, and issues
          the Lorry Receipt and carton tags before the vehicle reaches your dock.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
          {MODES.map((m) => (
            <span
              key={m.label}
              className="inline-flex items-center gap-2 rounded-[9px] border border-brand-500/40 bg-brand-500/8 px-3.5 py-2 text-[13.5px] font-semibold text-brand-400"
            >
              <m.icon className="size-4" />
              {m.label}
              <span className="font-normal text-[#8a9bb8]">{m.hint}</span>
            </span>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href={startHref}
            className="inline-flex items-center gap-2 rounded-[9px] bg-brand-600 px-6 py-3.5 text-[14.5px] font-bold text-white shadow-lg shadow-brand-600/25 transition-colors hover:bg-brand-500 active:scale-[0.98]"
          >
            {signedIn ? "Open the console" : "Create free account"}
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/track"
            className="rounded-[9px] border-[1.5px] border-white/20 px-6 py-3.5 text-[14.5px] font-semibold text-white transition-colors hover:border-brand-500/60 hover:bg-white/5"
          >
            Track a shipment
          </Link>
        </div>
      </div>
    </div>
  );
}
