import { readFileSync, writeFileSync } from "node:fs";

const H = 560;            // viewBox height
const PAD = 10;
const TOLERANCE = 0.8;   // simplification, in output units

const gj = JSON.parse(readFileSync("ne_ind.geojson", "utf8"));
const f = gj.features.find((x) => x.properties.NAME === "India" || x.properties.ADMIN === "India");

// Outer ring of every polygon; holes are irrelevant for a silhouette.
let rings = (f.geometry.type === "MultiPolygon" ? f.geometry.coordinates.map((p) => p[0]) : [f.geometry.coordinates[0]]);
rings.sort((a, b) => b.length - a.length);

// Mercator — the projection every web map uses, so the shape reads as familiar.
const merc = ([lon, lat]) => [
  (lon * Math.PI) / 180,
  Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)),
];

// Frame on the mainland plus any island group big enough to be worth drawing.
const kept = rings.filter((r, i) => i === 0 || r.length >= 40);
const projected = kept.map((r) => r.map(merc));
const all = projected.flat();
const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];

const k = (H - PAD * 2) / (y1 - y0);
const W = Math.round((x1 - x0) * k + PAD * 2);
const place = ([x, y]) => [ (x - x0) * k + PAD, (y1 - y) * k + PAD ];

// Douglas-Peucker: keeps the points that carry the shape and drops the rest.
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const sq = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const segDist = (p, a, b) => {
    let [x, y] = a; let dx = b[0] - x, dy = b[1] - y;
    if (dx || dy) {
      const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) [x, y] = b; else if (t > 0) { x += dx * t; y += dy * t; }
    }
    return sq(p, [x, y]);
  };
  const tol2 = tol * tol;
  const keep = new Array(pts.length).fill(false);
  keep[0] = keep[pts.length - 1] = true;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let max = 0, idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = segDist(pts[i], pts[s], pts[e]);
      if (d > max) { max = d; idx = i; }
    }
    if (max > tol2 && idx > 0) { keep[idx] = true; stack.push([s, idx], [idx, e]); }
  }
  return pts.filter((_, i) => keep[i]);
}

const toPath = (pts) =>
  "M" + pts.map(([x, y], i) => `${i ? "L" : ""}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") + " Z";

const paths = projected.map((r) => toPath(simplify(r.map(place), TOLERANCE)));
const points = paths.reduce((n, p) => n + p.split(" ").length, 0);

// Cities, projected through the identical pipeline so they land where they should.
const CITIES = [
  ["Delhi", 77.21, 28.61, 26], ["Mumbai", 72.88, 19.08, 24], ["Kolkata", 88.36, 22.57, 22],
  ["Bengaluru", 77.59, 12.97, 21], ["Chennai", 80.27, 13.08, 18], ["Hyderabad", 78.49, 17.38, 18],
  ["Ahmedabad", 72.57, 23.02, 17], ["Pune", 73.86, 18.52, 15], ["Nagpur", 79.09, 21.15, 15],
  ["Surat", 72.83, 21.17, 13], ["Jaipur", 75.79, 26.91, 13], ["Lucknow", 80.95, 26.85, 13],
  ["Kanpur", 80.35, 26.45, 11], ["Indore", 75.86, 22.72, 11], ["Patna", 85.14, 25.59, 11],
  ["Bhopal", 77.41, 23.26, 10], ["Visakhapatnam", 83.22, 17.69, 10], ["Kochi", 76.27, 9.93, 10],
  ["Coimbatore", 76.96, 11.02, 9], ["Bhubaneswar", 85.82, 20.30, 9], ["Ludhiana", 75.86, 30.90, 9],
  ["Guwahati", 91.74, 26.14, 12], ["Siliguri", 88.43, 26.72, 9], ["Raipur", 81.63, 21.25, 9],
  ["Jodhpur", 73.02, 26.24, 8], ["Varanasi", 82.97, 25.32, 9], ["Madurai", 78.12, 9.93, 8],
  ["Srinagar", 74.80, 34.08, 8], ["Dehradun", 78.03, 30.32, 8], ["Ranchi", 85.34, 23.34, 8],
];
// Simplifying the coastline moves it by up to TOLERANCE units, which can leave
// a genuinely coastal city (Mumbai, Kochi) a hair out to sea. Nudge any such
// point inland along the vector to the landmass centroid until it is on land.
const mainlandPts = simplify(projected[0].map(place), TOLERANCE);
const inside = (pts, x, y) => {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const cx = mainlandPts.reduce((a, p) => a + p[0], 0) / mainlandPts.length;
const cy = mainlandPts.reduce((a, p) => a + p[1], 0) / mainlandPts.length;
const snap = ([x, y]) => {
  if (inside(mainlandPts, x, y)) return [x, y];
  const dx = cx - x, dy = cy - y, len = Math.hypot(dx, dy);
  for (let d = 0.5; d <= 12; d += 0.5) {
    const nx = x + (dx / len) * d, ny = y + (dy / len) * d;
    if (inside(mainlandPts, nx, ny)) return [+nx.toFixed(1), +ny.toFixed(1)];
  }
  return [x, y];
};

const proj = Object.fromEntries(CITIES.map(([n, lon, lat, r]) => {
  const [x, y] = snap(place(merc([lon, lat])));
  return [n, [+x.toFixed(1), +y.toFixed(1), r]];
}));

// Lane: a Catmull-Rom spline through real waypoints, emitted as cubic beziers.
// Lane waypoints.
//
// The western half is real cities. The eastern half is given in projected
// coordinates, measured off the rendered outline: from Patna the route has to
// thread the Siliguri corridor, and at its neck (x 340) the passable band is
// only y 213.5-216 — about 25 km on the ground. A curve fitted through city
// centroids cuts that corner across Bangladesh, so those points are pinned to
// the band instead.
const WAY = [
  ...[[72.88, 19.08], [79.09, 21.15], [82.97, 25.32], [85.14, 25.59]]
    .map((c) => snap(place(merc(c))).map((v) => +v.toFixed(1))),
  [320, 219],   // north Bihar, climbing towards the neck
  [330, 216],
  [336, 211],
  [342, 208],   // the neck: Nepal above, Bangladesh below, ~25 km of India
  [350, 209],
  [358, 213],
  [368, 216],   // down into lower Assam
  ...[[91.74, 26.14]].map((c) => snap(place(merc(c))).map((v) => +v.toFixed(1))),
];

function spline(p) {
  const pts = [p[0], ...p, p[p.length - 1]];
  let d = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 1; i < pts.length - 2; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 9, p1[1] + (p2[1] - p0[1]) / 9];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 9, p2[1] - (p3[1] - p1[1]) / 9];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

writeFileSync("map-out.json", JSON.stringify({
  viewBox: `0 0 ${W} ${H}`, W, H, paths, points, cities: proj, lane: spline(WAY),
}, null, 1));

console.log(`viewBox 0 0 ${W} ${H}`);
console.log(`rings kept: ${paths.length}  (mainland ${simplify(projected[0].map(place), TOLERANCE).length} pts, total path chars ${paths.join("").length})`);
console.log("lane:", spline(WAY));
console.log("Mumbai", proj.Mumbai, "Nagpur", proj.Nagpur, "Siliguri", proj.Siliguri, "Guwahati", proj.Guwahati);
