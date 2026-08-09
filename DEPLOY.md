# Deploying ShipLane to Vercel + Neon

About 15 minutes end to end. Everything below has been verified against a real
PostgreSQL 18 instance — the migration, the seed, the production build and PDF
generation in production mode all pass.

---

## 1 · Create the database (3 min)

1. Sign up at **[neon.com](https://neon.com)** — the free tier is enough for a demo.
2. Create a project. Name it `shiplane`, pick the region closest to your
   audience (`AWS ap-south-1 / Mumbai` for India).
3. On the dashboard, copy the **Pooled connection** string. It looks like:

   ```
   postgresql://neondb_owner:npg_xxxx@ep-cool-name-pooler.ap-south-1.aws.neon.tech/neondb?sslmode=require
   ```

> Use the **pooled** string, not the direct one. Vercel runs each request in its
> own serverless instance, and the direct endpoint will run out of connections
> under even light demo traffic.

---

## 2 · Point your local app at it (2 min)

Open `shiplane/.env` and uncomment `DATABASE_URL`, pasting your string. Then:

```bash
npm run db:deploy
```

```bash
npm run db:seed
```

```bash
npm run dev
```

You should see the dashboard with 6 sample consignments across Delhi→Kolkata,
Mumbai→Bengaluru, Ahmedabad→Chennai, Gurugram→Guwahati, Pune→Jaipur and
Coimbatore→Hyderabad, in a mix of statuses from Booked through Delivered.

The same connection string will be used by Vercel, so there is only one to manage.

---

## 3 · Push to GitHub (3 min)

The `shiplane` folder is already a git repository. Create an **empty** repo on
GitHub (no README, no .gitignore), then:

```bash
git add -A
```

```bash
git commit -m "ShipLane freight console"
```

```bash
git branch -M main
```

```bash
git remote add origin https://github.com/YOUR_USERNAME/shiplane.git
```

```bash
git push -u origin main
```

`.env` is gitignored, so your database password does not leave your machine.

---

## 4 · Deploy on Vercel (5 min)

1. Go to **[vercel.com/new](https://vercel.com/new)** and import the repo.
2. Framework preset: **Next.js** (auto-detected). Leave Root Directory as is —
   `shiplane` is itself the repo root.
3. Expand **Environment Variables** and add:

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | your Neon pooled connection string |
   | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | your Maps key, or leave it out entirely |

4. Click **Deploy**.

That is all the configuration needed. `package.json` already handles the two
things Vercel would otherwise get wrong:

- `postinstall: prisma generate` — Vercel caches `node_modules`, so without this
  the Prisma client is stale or missing and the build fails.
- `build: prisma migrate deploy && next build` — applies any pending migrations
  to Neon before building.

Your URL will be `https://shiplane-<something>.vercel.app`. Add a custom domain
under **Settings → Domains** if you want something tidier for the demo.

---

## 5 · Seed the deployed database

Step 2 already seeded Neon from your machine, and Vercel points at that same
database — so the demo data is live.

`db:seed` **wipes and recreates everything**, so do not run it against Neon once
you are showing the app. If you need to reset between demos:

```bash
npm run db:seed
```

To keep the carriers but drop the sample consignments:

```bash
npm run db:seed -- --carriers-only
```

---

## Google Maps (optional)

The booking form works without it — PIN codes resolve city and state from a
built-in table. To turn on address autocomplete and the draggable map pin:

1. In Google Cloud Console, enable **Maps JavaScript API**, **Places API (New)**
   and **Geocoding API**.
2. Create an API key and restrict it by HTTP referrer to
   `https://your-app.vercel.app/*`. The key is exposed to the browser by design,
   so the referrer restriction is what actually protects it.
3. Add it as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in Vercel → Settings →
   Environment Variables, then redeploy.

Billing must be enabled on the Google Cloud project even within the free tier.

---

## Before you show it to anyone

**There is no authentication.** Anyone with the URL can view every consignment,
edit carrier rate cards and create bookings. That is fine for a demo you are
driving yourself; it is not fine for a public link.

The cheapest way to gate it is Vercel's built-in protection:
**Settings → Deployment Protection → Vercel Authentication**, which requires a
Vercel login to view. For a password you can hand to a client, use
**Password Protection** (a paid feature), or add real auth in the app.

---

## Troubleshooting

**Build fails: `@prisma/client did not initialize yet`**
The `postinstall` script is missing or was skipped. Confirm it is in
`package.json` and redeploy with the build cache cleared.

**Build fails on `prisma migrate deploy`**
`DATABASE_URL` is missing or wrong in Vercel's environment variables. Check it
is set for the **Production** environment specifically.

**Pages load but every query errors, or connections run out**
You used the direct Neon string instead of the pooled one. Swap it and redeploy.

**PDFs time out**
A consignment with a very large number of boxes generates one barcode per box.
The default Vercel function timeout is 10s on Hobby. Either raise
`maxDuration` on the two PDF routes or move to a paid plan.

**Local dev with no internet**
Neon is a cloud database. For offline work, install a local Postgres, or
`npm i -D embedded-postgres` and run a throwaway instance on port 5433.
