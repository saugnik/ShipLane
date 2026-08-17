import {
  HEAT,
  INDIA_ISLANDS,
  INDIA_OUTLINE,
  LANE,
  STOPS,
  VIEW_BOX,
} from "@/lib/indiaMap";

/**
 * The hero's centrepiece: India with the network glowing behind it and one live
 * lane drawn across it.
 *
 * The geometry lives in src/lib/indiaMap.ts — real Natural Earth data rather
 * than a hand-drawn silhouette, with cities projected to their actual positions.
 *
 * Pure SVG with SMIL/CSS animation and no JavaScript: one paint, and nothing on
 * the main thread.
 */
export function IndiaRouteMap() {
  return (
    <div className="relative w-full">
      <svg
        viewBox={VIEW_BOX}
        className="w-full"
        role="img"
        aria-label="Network map of India showing a freight lane from Mumbai through the Nagpur hub to Guwahati"
      >
        <defs>
          <radialGradient id="heat">
            <stop offset="0%" stopColor="#ff5a1f" stopOpacity="0.5" />
            <stop offset="55%" stopColor="#ff5a1f" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ff5a1f" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="lane" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff5a1f" />
            <stop offset="60%" stopColor="#ff9d6b" />
            <stop offset="100%" stopColor="#5eb8ff" />
          </linearGradient>
          <filter id="soften" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          {/* Clips the wash to the landmass so the glow never bleeds into the sea. */}
          <clipPath id="landmass">
            <path d={INDIA_OUTLINE} />
          </clipPath>
        </defs>

        {/* Faint fill first, so the country reads as a body rather than a wire. */}
        <path d={INDIA_OUTLINE} fill="#12294a" fillOpacity="0.55" />
        {INDIA_ISLANDS.map((d, i) => (
          <path key={`fill-${i}`} d={d} fill="#12294a" fillOpacity="0.55" />
        ))}

        <g clipPath="url(#landmass)">
          {HEAT.map(([cx, cy, r], i) => (
            <circle key={`heat-${i}`} cx={cx} cy={cy} r={r * 1.9} fill="url(#heat)" />
          ))}
        </g>

        <path
          d={INDIA_OUTLINE}
          fill="none"
          stroke="#7d93b8"
          strokeWidth="1"
          strokeLinejoin="round"
          opacity="0.55"
        />
        {INDIA_ISLANDS.map((d, i) => (
          <path
            key={`edge-${i}`}
            d={d}
            fill="none"
            stroke="#7d93b8"
            strokeWidth="1"
            opacity="0.45"
          />
        ))}

        {HEAT.map(([cx, cy, r], i) => (
          <circle
            key={`node-${i}`}
            cx={cx}
            cy={cy}
            r={Math.max(1, r / 11)}
            fill="#ff9d6b"
            opacity="0.6"
          />
        ))}

        {/* The lane, with a soft under-glow so it lifts off the landmass. */}
        <path
          d={LANE}
          fill="none"
          stroke="#ff5a1f"
          strokeWidth="6"
          opacity="0.3"
          filter="url(#soften)"
        />
        <path
          d={LANE}
          fill="none"
          stroke="url(#lane)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="5 7"
          className="lane-dash"
        />

        {/* Consignment travelling the lane. */}
        <g>
          <circle r="4" fill="#ffd7c2" />
          <circle r="8" fill="#ff5a1f" opacity="0.3" />
          <animateMotion dur="7s" repeatCount="indefinite" path={LANE} rotate="auto" />
        </g>

        {STOPS.map((s, i) => {
          const colour = s.kind === "dest" ? "#5eb8ff" : "#ff5a1f";
          const r = s.kind === "hub" ? 3.5 : 4.5;
          return (
            <g key={s.label}>
              <circle cx={s.x} cy={s.y} r="12" fill={colour} opacity="0.16">
                <animate
                  attributeName="r"
                  values="8;16;8"
                  dur="3.2s"
                  repeatCount="indefinite"
                  begin={`${i * 0.9}s`}
                />
                <animate
                  attributeName="opacity"
                  values="0.3;0;0.3"
                  dur="3.2s"
                  repeatCount="indefinite"
                  begin={`${i * 0.9}s`}
                />
              </circle>
              <circle cx={s.x} cy={s.y} r={r} fill={colour} />
              <circle
                cx={s.x}
                cy={s.y}
                r={r}
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.1"
                opacity="0.75"
              />
              {/* Labels clear the node so the pulse never sits under type. */}
              <text
                x={s.x}
                y={s.kind === "origin" ? s.y + 20 : s.y - 12}
                textAnchor={s.kind === "dest" ? "end" : "middle"}
                className="map-label"
              >
                {s.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Lane readout — the detail that makes the map feel operational. */}
      <div className="pointer-events-none absolute right-[1%] bottom-[13%] w-[212px] rounded-[12px] border border-white/12 bg-[#0a1b33]/85 p-3.5 backdrop-blur-[6px] sm:w-[240px]">
        <dl className="space-y-1.5 text-[12.5px]">
          {[
            ["Transit time", "3.2 days"],
            ["Volume", "High"],
            ["Alternate route", "Via Ahmedabad"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3">
              <dt className="text-[#8a9bb8]">{k}</dt>
              <dd className="docnum font-medium text-white">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
