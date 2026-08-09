# ShipLane — B2B freight booking console

A full-stack logistics platform for booking part-truckload / LTL consignments:
capture the lane, the paperwork and the cartons, compare contracted carrier
rates, and generate the printable document set — a three-copy **Lorry Receipt**
and one scannable **box tag** per carton.

Built as a single Next.js application: the UI and the API are the same
deployable.

---

## Quick start

Needs a Postgres database. A free [Neon](https://neon.com) project takes about
two minutes and the same connection string works locally and in production.

```bash
npm install
```

Copy `.env.example` to `.env` and set `DATABASE_URL` to your Neon pooled
connection string, then:

```bash
npm run db:deploy && npm run db:seed
```

```bash
npm run dev
```

Open <http://localhost:3000>. The seed loads five carriers with ~79 published
lanes each **plus six sample consignments** across different lanes and statuses,
so the dashboard, orders list and tracking all have something to show.
**No Google Maps key is needed** — see [Address capture](#address-capture).

To deploy, see **[DEPLOY.md](DEPLOY.md)** — Vercel + Neon, about 15 minutes.

---

## The booking flow

| Step | What it captures |
| --- | --- |
| **1 · Route** | Shipper and consignee: company, product, contact, email, phone, address (Google Places + draggable map pin), city, state, PIN code, GSTIN |
| **2 · Invoice** | Invoice number, declared value, E-Way Bill number |
| **3 · Cargo** | Shipping terms (mode, freight payment, risk, POD, said-to-contain) **and** the box grid: box number, description, reference ID, weight, L × B × H |
| **4 · Carrier** | Live rate comparison across the panel with a full charge breakup per carrier |
| **5 · Review** | Everything in one screen with jump-to-edit, then confirm |

On confirm the system issues an **LRN** (9-digit, customer-facing), an **OID**
(8-digit internal docket) and a **MAWB** (14-digit master), writes the opening
tracking scan, and makes both PDFs available.

The draft is persisted to `sessionStorage` on every keystroke — a refresh
mid-booking does not lose the form.

---

## Documents

**Lorry Receipt** — `GET /api/orders/:lrn/lr`
Letter landscape, three pages: `SHIPPER COPY`, `LM POD`, `RECIPIENT COPY`.
Carries the shipper/consignee blocks, shipment information grid, carton
manifest, full charge breakup, Code128 barcodes for the LRN and master docket,
and the POD remarks block with signature lines.

**Box tags** — `GET /api/orders/:lrn/box-tags`
One 4 in × 2 in label per carton plus a trailing document-envelope tag. Each
tag carries its own scannable box AWB, the LRN / OID / MAWB triplet, the
consignee address and a second LRN barcode so any carton identifies the whole
consignment. Sized for a standard thermal label roll.

Add `?download=1` to either to force a save dialog instead of inline preview.

---

## Rating engine

`src/lib/pricing.ts` is a pure function over plain data, so the quote endpoint
and the order-creation endpoint cannot drift apart. **The price shown at
checkout is never trusted from the client** — the server re-rates with the
selected carrier and freezes that breakup onto the order.

Lane matching scores specificity, so a carrier can publish a broad
destination-state rate and layer negotiated city-pair overrides on top without
touching it:

```
destCity (8)  >  destState (4)  >  originCity (2)  >  originState (1)
```

`*` is a wildcard on any of the four keys. A lane with no published rate falls
back to zone-to-zone pricing and is flagged **Indicative** in the UI.

The charge stack:

```
chargeable weight = max(actual, volumetric, carrier minimum)
volumetric        = Σ (L × W × H) ÷ carrier divisor

freight   = max(chargeable × ₹/kg, lane minimum)
+ docket + fuel surcharge (% of freight)
+ FOV (carrier risk only)  + ODA  + COD handling
= sub-total  →  + GST  →  total payable
```

Carriers and their rate cards are editable at `/partners` — add, overwrite or
delete lanes without touching code.

---

## Address capture

Address entry degrades cleanly:

- **With `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`** — Places autocomplete (current
  Places API, with an automatic fallback to the legacy service), a map with a
  draggable pin, and reverse geocoding on every drag. Rooftop accuracy matters:
  a pin on the wrong side of a divided road is a 20-minute detour for the driver.
  Session tokens are used so autocomplete bills at the session rate.
- **Without a key** — a built-in offline PIN code table resolves city and state
  from the 6-digit PIN (3-digit district precision for ~350 districts, 2-digit
  postal-circle precision everywhere else). Every field stays editable either way.

---

## Validation

Zod schemas in `src/lib/validation.ts` are shared by the client and the server —
the wizard validates only the current step so an operator is never blocked by a
field two screens ahead, and the server revalidates the whole payload.

Domain rules enforced beyond field formats:

- **E-Way Bill is mandatory above ₹50,000** invoice value. Consignments above
  the threshold cannot legally move without one, so the booking is blocked
  rather than allowed to fail at the first state check post.
- Box numbers must be unique — they are printed on tags and scanned at every hop.
- Pickup and drop PIN codes cannot be identical.
- GSTIN, PIN code and Indian mobile formats are checked.

---

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/quotes` | Rate the consignment across all active carriers |
| `GET` | `/api/orders` | Paginated list, `?q=` `?status=` `?page=` |
| `POST` | `/api/orders` | Book a consignment (re-rates and freezes the price) |
| `GET` | `/api/orders/:lrn` | Full internal record |
| `POST` | `/api/orders/:lrn/events` | Append a scan and advance status |
| `GET` | `/api/orders/:lrn/lr` | Lorry Receipt PDF |
| `GET` | `/api/orders/:lrn/box-tags` | Box tags PDF |
| `GET` | `/api/track/:lrn` | **Public** tracking — movement only, no pricing or contact details |
| `GET` | `/api/pincode/:pin` | PIN code → city / state |
| `GET` `POST` `DELETE` | `/api/partners/:id/rates` | Rate card management |

Every response is `{ data }` or `{ error, fields? }`, so the client has one
shape to branch on and `fields` maps straight onto form inputs.

---

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · Prisma 7 +
PostgreSQL · Zod · pdf-lib + bwip-js · lucide-react

## Layout

```
prisma/            schema, migrations, carrier + rate-card seed
src/app/           routes; api/ holds every server endpoint
src/components/    AppShell, ui primitives, booking/ wizard steps
src/lib/
  pricing.ts       rating engine (pure)
  validation.ts    zod schemas shared client + server
  india.ts         states, PIN lookup, zones
  ids.ts           LRN / OID / MAWB generation
  pdf/             lr.ts, boxTags.ts, draw.ts, barcode.ts
  brand.ts         white-labelling — one file
```

## Production notes

- **Database** — Postgres via the Prisma driver adapter in `src/lib/db.ts`. The
  pool is capped at 3 connections in production because each serverless instance
  gets its own; a larger pool exhausts Neon's limit before the app is under load.
- **Auth** — there is no authentication layer. Add one (NextAuth, Clerk, your
  SSO) and gate `/partners`, `/orders` and the write endpoints. `/api/track/:lrn`
  is intentionally public and already withholds pricing and contact details.
- **Document numbers** — generated by mapping a monotonic counter through a
  multiplicative permutation, so they are unique, fixed-width and not guessable
  by increment. Sequence state lives in the `Counter` table.
- **Carrier integration** — `POST /api/orders/:lrn/events` is shaped as the
  webhook target for real carrier scan feeds; the ops console posts to the same
  endpoint for manual corrections.
