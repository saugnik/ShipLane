/**
 * Seeds the carrier panel and their lane rate cards.
 *
 * Rate cards are published destination-state-wide (origin `*`) with metro
 * city rows layered on top, which is how carriers actually contract: a broad
 * state rate, then negotiated overrides on the high-volume lanes.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";
import { INDIAN_STATES, zoneForState } from "../src/lib/india";
import { hashSecret } from "../src/lib/auth/crypto";
import { toPartnerCommercials } from "../src/lib/partnerMapper";
import { seedDemoOrders } from "./demo";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — copy .env.example to .env first.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** `npm run db:seed -- --carriers-only` skips the sample consignments. */
const CARRIERS_ONLY = process.argv.includes("--carriers-only");

/** Owner of the seeded consignments — sign in with this to explore the demo. */
const DEMO_EMAIL = (process.env.DEMO_EMAIL ?? "demo@shiplane.example").trim().toLowerCase();

type PartnerSeed = {
  code: string;
  name: string;
  tagline: string;
  accent: string;
  modes: string[];
  services: string[];
  minChargeableWeight: number;
  volumetricDivisor: number;
  fuelSurchargePct: number;
  docketCharge: number;
  fovPct: number;
  fovMin: number;
  odaCharge: number;
  codChargePct: number;
  codChargeMin: number;
  /** Multiplier applied to the zone base rate. */
  rateFactor: number;
  /** Transit days added on top of the zone baseline (can be negative). */
  speedOffset: number;
  /** Metro lanes this carrier has negotiated down. */
  metroDiscountPct: number;
};

const PARTNERS: PartnerSeed[] = [
  {
    code: "VCX",
    name: "VeloCarry Express",
    tagline: "Air-first premium, next-day on metro lanes",
    accent: "#2563eb",
    modes: ["AIR", "ROAD"],
    services: ["EXPRESS"],
    minChargeableWeight: 5,
    volumetricDivisor: 5000,
    fuelSurchargePct: 18,
    docketCharge: 150,
    fovPct: 0.2,
    fovMin: 250,
    odaCharge: 950,
    codChargePct: 2,
    codChargeMin: 100,
    rateFactor: 1.75,
    speedOffset: -2,
    metroDiscountPct: 8,
  },
  {
    code: "BLL",
    name: "BharatLine Logistics",
    tagline: "Lowest cost per kg on surface freight",
    accent: "#059669",
    modes: ["ROAD", "RAIL"],
    services: ["SURFACE"],
    minChargeableWeight: 20,
    volumetricDivisor: 4500,
    fuelSurchargePct: 8,
    docketCharge: 60,
    fovPct: 0.08,
    fovMin: 80,
    odaCharge: 450,
    codChargePct: 1.2,
    codChargeMin: 40,
    rateFactor: 0.78,
    speedOffset: 2,
    metroDiscountPct: 5,
  },
  {
    code: "MRF",
    name: "Meridian Freight",
    tagline: "Balanced surface network, 19 000+ PIN codes",
    accent: "#7c3aed",
    modes: ["ROAD"],
    services: ["SURFACE", "EXPRESS"],
    minChargeableWeight: 10,
    volumetricDivisor: 5000,
    fuelSurchargePct: 12,
    docketCharge: 90,
    fovPct: 0.12,
    fovMin: 120,
    odaCharge: 600,
    codChargePct: 1.5,
    codChargeMin: 60,
    rateFactor: 1.0,
    speedOffset: 0,
    metroDiscountPct: 6,
  },
  {
    code: "IRC",
    name: "IronRoute Cargo",
    tagline: "Heavy & industrial part-truckload specialist",
    accent: "#ea580c",
    modes: ["ROAD"],
    services: ["SURFACE"],
    minChargeableWeight: 50,
    volumetricDivisor: 4000,
    fuelSurchargePct: 10,
    docketCharge: 120,
    fovPct: 0.1,
    fovMin: 150,
    odaCharge: 700,
    codChargePct: 1.5,
    codChargeMin: 75,
    rateFactor: 0.68,
    speedOffset: 1,
    metroDiscountPct: 4,
  },
  {
    code: "NSP",
    name: "NorthStar Parcel",
    tagline: "Deepest reach in the North-East & hill states",
    accent: "#0891b2",
    modes: ["ROAD", "AIR"],
    services: ["SURFACE", "EXPRESS"],
    minChargeableWeight: 10,
    volumetricDivisor: 5000,
    fuelSurchargePct: 14,
    docketCharge: 100,
    fovPct: 0.15,
    fovMin: 150,
    odaCharge: 350,
    codChargePct: 1.8,
    codChargeMin: 60,
    rateFactor: 1.08,
    speedOffset: 0,
    metroDiscountPct: 3,
  },
];

/** Base ₹/kg and baseline transit by destination zone. */
const ZONE_BASE: Record<string, { rate: number; days: number }> = {
  N: { rate: 12, days: 4 },
  W: { rate: 13, days: 4 },
  S: { rate: 15, days: 5 },
  E: { rate: 14, days: 5 },
  C: { rate: 13, days: 4 },
  NE: { rate: 26, days: 9 },
};

/** High-volume metros that get a negotiated city-level override. */
const METROS: Array<[string, string]> = [
  ["Delhi", "Delhi"],
  ["Mumbai", "Maharashtra"],
  ["Pune", "Maharashtra"],
  ["Bengaluru", "Karnataka"],
  ["Chennai", "Tamil Nadu"],
  ["Hyderabad", "Telangana"],
  ["Kolkata", "West Bengal"],
  ["Ahmedabad", "Gujarat"],
  ["Surat", "Gujarat"],
  ["Jaipur", "Rajasthan"],
  ["Lucknow", "Uttar Pradesh"],
  ["Gurugram", "Haryana"],
  ["Kochi", "Kerala"],
  ["Indore", "Madhya Pradesh"],
  ["Guwahati", "Assam"],
];

/** States where last-mile is genuinely out-of-delivery-area for most carriers. */
const ODA_STATES = new Set([
  "Arunachal Pradesh",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Tripura",
  "Sikkim",
  "Ladakh",
  "Andaman & Nicobar Islands",
  "Lakshadweep",
]);

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * The single oversight account. Never registerable — it exists only because it
 * is seeded here, from the environment.
 */
async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@shiplane.example").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";

  if (!password) {
    console.log("  ADMIN_PASSWORD not set — skipping admin seed.");
    console.log("  Set ADMIN_EMAIL and ADMIN_PASSWORD in .env, then re-run: npm run db:seed");
    return;
  }
  if (password.length < 10) {
    throw new Error("ADMIN_PASSWORD must be at least 10 characters.");
  }

  const passwordHash = await hashSecret(password);
  await prisma.account.upsert({
    where: { email },
    create: { email, name: "Oversight", role: "ADMIN", passwordHash },
    // Re-seeding rotates the password and revokes existing admin sessions.
    update: { role: "ADMIN", passwordHash, active: true, tokenVersion: { increment: 1 } },
  });
  console.log(`  admin ready: ${email}  (sign in at /admin/login)`);
}

async function main() {
  console.log("Resetting demo data…");
  // Orders reference partners, so they go first.
  await prisma.trackingEvent.deleteMany();
  await prisma.box.deleteMany();
  await prisma.order.deleteMany();
  await prisma.counter.deleteMany();
  await prisma.rate.deleteMany();
  await prisma.partner.deleteMany();
  // Registered accounts survive a reseed; only the demo account is recreated.
  await prisma.account.deleteMany({ where: { email: DEMO_EMAIL } });

  console.log("Accounts…");
  await seedAdmin();

  for (const p of PARTNERS) {
    const partner = await prisma.partner.create({
      data: {
        code: p.code,
        name: p.name,
        tagline: p.tagline,
        accent: p.accent,
        modes: JSON.stringify(p.modes),
        services: JSON.stringify(p.services),
        minChargeableWeight: p.minChargeableWeight,
        volumetricDivisor: p.volumetricDivisor,
        fuelSurchargePct: p.fuelSurchargePct,
        docketCharge: p.docketCharge,
        fovPct: p.fovPct,
        fovMin: p.fovMin,
        odaCharge: p.odaCharge,
        codChargePct: p.codChargePct,
        codChargeMin: p.codChargeMin,
        gstPct: 18,
      },
    });

    const rows: Array<{
      partnerId: string;
      originState: string;
      originCity: string;
      destState: string;
      destCity: string;
      ratePerKg: number;
      minCharge: number;
      transitDays: number;
      oda: boolean;
    }> = [];

    // Destination-state rate card (origin wildcard).
    for (const state of INDIAN_STATES) {
      const base = ZONE_BASE[zoneForState(state)];
      const ratePerKg = round(base.rate * p.rateFactor);
      rows.push({
        partnerId: partner.id,
        originState: "*",
        originCity: "*",
        destState: state,
        destCity: "*",
        ratePerKg,
        minCharge: round(ratePerKg * p.minChargeableWeight * 1.1),
        transitDays: Math.max(1, base.days + p.speedOffset),
        oda: ODA_STATES.has(state),
      });
    }

    // Negotiated metro city overrides.
    for (const [city, state] of METROS) {
      const base = ZONE_BASE[zoneForState(state)];
      const ratePerKg = round(base.rate * p.rateFactor * (1 - p.metroDiscountPct / 100));
      rows.push({
        partnerId: partner.id,
        originState: "*",
        originCity: "*",
        destState: state,
        destCity: city,
        ratePerKg,
        minCharge: round(ratePerKg * p.minChargeableWeight),
        transitDays: Math.max(1, base.days + p.speedOffset - 1),
        oda: false,
      });
    }

    // Trunk lanes out of Delhi and Mumbai — the densest corridors, priced sharpest.
    const trunkOrigins: Array<[string, string]> = [
      ["Delhi", "Delhi"],
      ["Mumbai", "Maharashtra"],
    ];
    for (const [oCity, oState] of trunkOrigins) {
      for (const [dCity, dState] of METROS) {
        if (dCity === oCity) continue;
        const base = ZONE_BASE[zoneForState(dState)];
        const ratePerKg = round(base.rate * p.rateFactor * (1 - (p.metroDiscountPct + 6) / 100));
        rows.push({
          partnerId: partner.id,
          originState: oState,
          originCity: oCity,
          destState: dState,
          destCity: dCity,
          ratePerKg,
          minCharge: round(ratePerKg * p.minChargeableWeight),
          transitDays: Math.max(1, base.days + p.speedOffset - 1),
          oda: false,
        });
      }
    }

    await prisma.rate.createMany({ data: rows });
    console.log(`  ${p.code} — ${p.name}: ${rows.length} lanes`);
  }

  if (CARRIERS_ONLY) {
    console.log("Seed complete (carriers only).");
    return;
  }

  // Rate the demo orders through the same mapper + engine a live booking uses,
  // so seeded prices always agree with a fresh quote.
  const partners = (
    await prisma.partner.findMany({ where: { active: true }, include: { rates: true } })
  ).map(toPartnerCommercials);

  // Demo consignments need an owner, otherwise no USER can see them.
  const demoPassword = process.env.DEMO_PASSWORD || "shiplane-demo-2026";
  const demoAccount = await prisma.account.create({
    data: {
      email: DEMO_EMAIL,
      name: "Demo Operations",
      company: "Amwoodo Eco Products Pvt Ltd",
      role: "USER",
      passwordHash: await hashSecret(demoPassword),
    },
  });
  console.log(`  demo account: ${DEMO_EMAIL} / ${demoPassword}`);

  console.log("Creating demo consignments…");
  const count = await seedDemoOrders(prisma, partners, new Date(), demoAccount.id);
  console.log(`  ${count} consignments seeded for ${DEMO_EMAIL}`);
  console.log(`  sign in as this account at /login using that email`);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
