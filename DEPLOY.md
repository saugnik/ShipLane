# Deploying ShipLane to Vercel + Neon

About 15 minutes end to end. Everything below has been verified against a real
PostgreSQL 18 instance — the migration, the seed, the production build and PDF
generation in production mode all pass.

---

## 1 · Create the database (3 min)

1. Sign up at **[neon.com](https://neon.com)** — the free tier is enough for a demo.
2. Create a project. Name it `shiplane`, pick the region closest to your
   audience (`AWS ap-south-1 / Mumbai` for India).
3. Copy **both** connection strings from the dashboard. They differ only by
   `-pooler` in the hostname:

   ```
   pooled  postgresql://neondb_owner:npg_xxxx@ep-cool-name-pooler.region.aws.neon.tech/neondb?sslmode=require
   direct  postgresql://neondb_owner:npg_xxxx@ep-cool-name.region.aws.neon.tech/neondb?sslmode=require
   ```

> **You need both, and they are not interchangeable.**
>
> `DATABASE_URL` gets the **pooled** string — Vercel runs each request in its own
> serverless instance, and the direct endpoint runs out of connections fast.
>
> `DIRECT_URL` gets the **direct** string — used by `prisma migrate` only. The
> pooler runs PgBouncer in transaction mode, which cannot hold the session-level
> advisory lock Migrate takes to stop two deploys migrating at once. Migrating
> through the pooler fails with `P1002`, and worse, can leave that lock orphaned
> on a pooler backend so later attempts fail too.

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
   | `DATABASE_URL` | Neon **pooled** string (with `-pooler`) |
   | `DIRECT_URL` | Neon **direct** string (no `-pooler`) |
   | `AUTH_SECRET` | 32+ random characters — signs the session cookie |
   | `ADMIN_EMAIL` | the single oversight account's address |
   | `ADMIN_PASSWORD` | 10+ characters; only used at seed time |
   | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | optional Maps key |

   `DIRECT_URL` is not optional. The build runs `prisma migrate deploy`, and
   without it the deploy fails with `P1002`.

   `AUTH_SECRET` is not optional either — the app throws on first request
   without it. Generate one with:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

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

## Accounts

| | How they sign in | What they can do |
| --- | --- | --- |
| **User** | `/login` — email + password | Book, update and track **their own** consignments. Cannot delete anything. |
| **Admin** | `/admin/login` — email + password | Read **every** account's consignments, delivery times, products and scan log. Cannot create, edit or delete. |

**No email provider is needed.** Registration validates that the address is real
and deliverable — correct syntax, a domain that resolves, live MX records, and
not a disposable provider — then asks for a password. Nothing is sent.

That proves the address *works*, not that the person *owns* it. Only a
round-trip (a code or a confirmation link) can prove ownership; add one when the
platform handles real customer money.

If DNS is unavailable, the check **fails open** and accepts the address. Locking
every signup out because our own resolver is down would be far worse than
admitting one questionable address.

There is exactly one admin and it cannot be registered — it exists only because
`npm run db:seed` creates it from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. The public
site links to `/admin/login` from nowhere and the page is excluded from search
indexes, so users never learn it exists.

Re-running the seed rotates the admin password and signs out any existing admin
session. Registered user accounts survive a reseed; only the demo account and
its sample consignments are recreated.

---

## Troubleshooting

**Build fails: `@prisma/client did not initialize yet`**
The `postinstall` script is missing or was skipped. Confirm it is in
`package.json` and redeploy with the build cache cleared.

**Build fails on `prisma migrate deploy`**
`DATABASE_URL` or `DIRECT_URL` is missing or wrong in Vercel's environment
variables. Check both are set for the **Production** environment specifically.

**`P1002 — Timed out trying to acquire a postgres advisory lock`**
A migration was attempted through the pooled endpoint. Two things to fix:

1. Make sure `DIRECT_URL` is set to the **direct** (no `-pooler`) string.
2. The failed attempt probably left the lock orphaned on a pooler backend, so
   even a correct retry will fail. Clear it by running this against the
   **direct** endpoint (Neon's SQL Editor works):

   ```sql
   SELECT pg_terminate_backend(pid) FROM pg_locks
   WHERE locktype = 'advisory' AND objid = 72707369 AND granted;
   ```

   Then retry. Verify the schema really landed — `migrate deploy` can report
   "No pending migrations" while the lock hangs, because the tables were in fact
   created before it got stuck.

**Pages load but every query errors, or connections run out**
You used the direct Neon string instead of the pooled one. Swap it and redeploy.

**PDFs time out**
A consignment with a very large number of boxes generates one barcode per box.
The default Vercel function timeout is 10s on Hobby. Either raise
`maxDuration` on the two PDF routes or move to a paid plan.

**Local dev with no internet**
Neon is a cloud database. For offline work, install a local Postgres, or
`npm i -D embedded-postgres` and run a throwaway instance on port 5433.
