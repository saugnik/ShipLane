/**
 * The hero's signature element: a dotted great-circle route with a parcel
 * travelling it on a loop. Pure SVG so it costs one paint and no JavaScript.
 */
const PATH =
  "M50 320 C 120 260, 90 180, 170 160 C 250 140, 240 60, 340 60";

export function RoutePanel() {
  return (
    <div
      className="relative aspect-square max-h-[460px] w-full overflow-hidden rounded-[20px] bg-panel"
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 20% 15%, rgb(255 255 255 / 0.05), transparent 40%)," +
            "radial-gradient(circle at 85% 80%, rgb(255 90 31 / 0.20), transparent 45%)",
        }}
      />

      <svg viewBox="0 0 400 400" className="absolute inset-0 size-full">
        <path
          d={PATH}
          fill="none"
          stroke="#AEB9CC"
          strokeWidth="2"
          strokeDasharray="2 10"
          strokeLinecap="round"
          opacity="0.55"
        />

        {/* Origin */}
        <circle cx="50" cy="320" r="6" fill="var(--color-brand-500)" />
        {/* Destination, with a halo so the eye lands on it last */}
        <circle cx="340" cy="60" r="6" fill="#ffffff" />
        <circle cx="340" cy="60" r="11" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.5" />

        <text x="58" y="342" className="fill-white font-mono text-[11px] tracking-wider">
          MUMBAI
        </text>
        <text x="290" y="46" className="fill-white font-mono text-[11px] tracking-wider">
          GUWAHATI
        </text>
        <text x="180" y="200" className="font-mono text-[11px] tracking-wider" fill="#AEB9CC">
          NAGPUR HUB
        </text>

        <circle r="5.5" fill="var(--color-brand-500)">
          <animateMotion dur="6s" repeatCount="indefinite" path={PATH} />
        </circle>
      </svg>
    </div>
  );
}
