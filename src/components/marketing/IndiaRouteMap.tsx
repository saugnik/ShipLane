/**
 * The hero's centrepiece: a stylised India with the network glowing behind it
 * and one live lane drawn across it.
 *
 * Pure SVG with SMIL/CSS animation and no JavaScript, so it costs one paint and
 * nothing on the main thread. The outline is a deliberately simplified
 * silhouette — it reads as India at a glance without pretending to be a
 * survey-accurate map, which is the right call for a decorative element.
 */

/** Simplified national outline, drawn for a 500 x 540 viewBox. */
const INDIA =
  "M150 22 L178 14 L205 30 L200 58 L232 78 L252 96 L300 128 L338 152 L352 172 " +
  "L372 168 L392 152 L425 158 L452 172 L462 196 L448 224 L428 232 L412 214 " +
  "L398 226 L392 252 L372 248 L366 226 L352 214 L344 232 L356 258 L366 274 " +
  "L356 296 L344 316 L336 344 L322 372 L306 404 L296 440 L284 476 L272 502 " +
  "L258 470 L250 436 L236 400 L222 372 L206 340 L190 316 L172 300 L156 296 " +
  "L148 312 L132 320 L118 306 L104 292 L88 284 L82 266 L96 254 L86 240 " +
  "L72 228 L68 206 L78 186 L96 168 L108 146 L122 122 L138 100 L132 74 L142 46 Z";

/**
 * The lane the hero narrates: Mumbai → Nagpur hub → Guwahati.
 *
 * Endpoints are the STOPS coordinates exactly, so the line meets the nodes.
 * The final leg arcs north rather than running straight at Guwahati, because a
 * straight line crosses Bangladesh — freight to the North-East goes over the
 * Siliguri corridor, and drawing it any other way would look wrong to anyone
 * who runs that lane.
 */
const LANE = "M203 332 C228 322 248 306 268 288 C300 258 316 224 338 196 C352 176 378 172 415 190";

/** Network density behind the outline — bigger dot, busier corridor. */
const HEAT: [x: number, y: number, r: number][] = [
  [185, 145, 26], // Delhi NCR
  [203, 332, 24], // Mumbai
  [350, 262, 22], // Kolkata
  [255, 300, 20], // Nagpur
  [250, 425, 20], // Bengaluru
  [285, 425, 17], // Chennai
  [145, 280, 17], // Ahmedabad
  [255, 370, 16], // Hyderabad
  [415, 190, 15], // Guwahati
  [212, 250, 13],
  [300, 200, 13],
  [168, 205, 12],
  [330, 330, 11],
  [240, 385, 11],
  [270, 470, 10],
  [120, 250, 9],
  [370, 210, 9],
  [205, 175, 9],
];

const STOPS: { x: number; y: number; label: string; kind: "origin" | "hub" | "dest" }[] = [
  { x: 203, y: 332, label: "MUMBAI", kind: "origin" },
  { x: 268, y: 288, label: "NAGPUR HUB", kind: "hub" },
  { x: 415, y: 190, label: "GUWAHATI", kind: "dest" },
];

export function IndiaRouteMap() {
  return (
    <div className="relative w-full">
      <svg
        viewBox="0 0 500 540"
        className="w-full"
        role="img"
        aria-label="Network map of India showing a lane from Mumbai through the Nagpur hub to Guwahati"
      >
        <defs>
          <radialGradient id="heat">
            <stop offset="0%" stopColor="#ff5a1f" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#ff5a1f" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#ff5a1f" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="lane" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff5a1f" />
            <stop offset="60%" stopColor="#ff9d6b" />
            <stop offset="100%" stopColor="#5eb8ff" />
          </linearGradient>
          <filter id="soften" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          {/* Clips the heat wash to the landmass so the glow never bleeds into
              the sea and blur the country's edge. */}
          <clipPath id="landmass">
            <path d={INDIA} />
          </clipPath>
        </defs>

        <g clipPath="url(#landmass)">
          {HEAT.map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r * 2.1} fill="url(#heat)" />
          ))}
        </g>

        {/* Country outline, drawn over the wash. */}
        <path
          d={INDIA}
          fill="none"
          stroke="#7d93b8"
          strokeWidth="1.1"
          strokeLinejoin="round"
          opacity="0.5"
        />

        {/* City nodes: small, bright, and denser where the network is. */}
        {HEAT.map(([cx, cy, r], i) => (
          <circle
            key={`n${i}`}
            cx={cx}
            cy={cy}
            r={Math.max(1.2, r / 9)}
            fill="#ff9d6b"
            opacity={0.55}
          />
        ))}

        {/* The lane, with a soft under-glow so it lifts off the landmass. */}
        <path d={LANE} fill="none" stroke="#ff5a1f" strokeWidth="7" opacity="0.28" filter="url(#soften)" />
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
          <circle r="4.5" fill="#ffd7c2" />
          <circle r="9" fill="#ff5a1f" opacity="0.3" />
          <animateMotion dur="7s" repeatCount="indefinite" path={LANE} rotate="auto" />
        </g>

        {STOPS.map((s, i) => {
          const colour = s.kind === "dest" ? "#5eb8ff" : "#ff5a1f";
          const r = s.kind === "hub" ? 4 : 5;
          return (
            <g key={s.label}>
              <circle cx={s.x} cy={s.y} r="13" fill={colour} opacity="0.16">
                <animate
                  attributeName="r"
                  values="9;17;9"
                  dur="3.2s"
                  repeatCount="indefinite"
                  begin={`${i * 0.9}s`}
                />
                <animate
                  attributeName="opacity"
                  values="0.28;0;0.28"
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
                strokeWidth="1.2"
                opacity="0.75"
              />
              {/* Labels clear the node so the pulse never sits under type. */}
              <text
                x={s.x}
                y={s.kind === "origin" ? s.y + 22 : s.y - 14}
                textAnchor="middle"
                className="map-label"
              >
                {s.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Lane readout — the detail that makes the map feel operational. */}
      <div className="pointer-events-none absolute right-[2%] bottom-[16%] w-[220px] rounded-[12px] border border-white/12 bg-[#0a1b33]/85 p-3.5 backdrop-blur-[6px] sm:w-[248px]">
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
