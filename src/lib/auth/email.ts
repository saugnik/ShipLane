import { resolve4, resolveMx } from "node:dns/promises";

/**
 * Email validation without sending anything.
 *
 * This proves an address is *deliverable* — correct shape, a domain that
 * resolves, and mail servers that accept for it. It does NOT prove ownership;
 * only a round-trip (a code or a link) can do that. Kept deliberately separate
 * so the distinction stays visible at the call site.
 */

/** Throwaway providers — signups from these are noise, not customers. */
const DISPOSABLE = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com",
  "temp-mail.org", "throwawaymail.com", "yopmail.com", "trashmail.com",
  "sharklasers.com", "getnada.com", "dispostable.com", "fakeinbox.com",
  "maildrop.cc", "mailnesia.com", "tempinbox.com", "spamgourmet.com",
  "mintemail.com", "moakt.com", "emailondeck.com", "burnermail.io",
]);

/**
 * Domains people mistype. Catching these saves a support ticket, because the
 * address is perfectly deliverable — just not to the person they meant.
 */
const TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gnail.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "yahooo.com": "yahoo.com",
  "yaho.com": "yahoo.com",
  "rediffmai.com": "rediffmail.com",
};

export type EmailCheck =
  | { ok: true; email: string; domain: string }
  | { ok: false; error: string; suggestion?: string };

// Deliberately stricter than the RFC: no quoted local parts, no IP literals.
// Those are legal and effectively never real customer addresses.
const SHAPE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

/** Cache MX lookups — a signup burst from one company shouldn't hammer DNS. */
const mxCache = new Map<string, { ok: boolean; at: number }>();
const MX_TTL_MS = 10 * 60_000;

export async function checkEmail(raw: string): Promise<EmailCheck> {
  const email = raw.trim().toLowerCase();

  if (!email) return { ok: false, error: "Enter your email address" };
  if (email.length > 254) return { ok: false, error: "That email address is too long" };
  if (!SHAPE.test(email)) return { ok: false, error: "That does not look like a valid email address" };

  const domain = email.slice(email.lastIndexOf("@") + 1);

  if (TYPOS[domain]) {
    const suggestion = `${email.slice(0, email.lastIndexOf("@"))}@${TYPOS[domain]}`;
    return { ok: false, error: `Did you mean ${suggestion}?`, suggestion };
  }

  // Only throwaway providers are refused. Gmail, Outlook, Yahoo, Rediffmail and
  // the rest are ordinary addresses — plenty of small consignors book from a
  // personal mailbox, and turning them away would cost real business.
  if (DISPOSABLE.has(domain)) {
    return { ok: false, error: "That looks like a disposable address. Use one you can receive mail at." };
  }

  const deliverable = await domainAcceptsMail(domain);

  // Only a definitive "this domain does not exist" blocks a signup. Anything
  // else — resolver down, timeout, SERVFAIL — fails OPEN, because refusing a
  // real customer over our own DNS trouble is far worse than admitting a
  // questionable address.
  if (deliverable === "no") {
    return { ok: false, error: `“${domain}” does not accept email. Check the spelling.` };
  }

  return { ok: true, email, domain };
}

type Verdict = "yes" | "no" | "unknown";

/** DNS lookups must never hang a signup form. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("dns-timeout")), ms)),
  ]);
}

async function domainAcceptsMail(domain: string): Promise<Verdict> {
  const cached = mxCache.get(domain);
  if (cached && Date.now() - cached.at < MX_TTL_MS) return cached.ok ? "yes" : "no";

  const remember = (v: Verdict) => {
    // "unknown" is never cached — the next attempt should try DNS again.
    if (v !== "unknown") mxCache.set(domain, { ok: v === "yes", at: Date.now() });
    return v;
  };

  try {
    const records = await withTimeout(resolveMx(domain), 3000);
    if (records.length > 0 && records.some((r) => r.exchange)) return remember("yes");
    // Domain resolves but publishes no MX. RFC 5321 says fall back to the A
    // record, and plenty of small business domains rely on exactly that.
    return remember(await hasAddressRecord(domain));
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;

    // The domain genuinely is not registered.
    if (code === "ENOTFOUND" || code === "NXDOMAIN") return remember("no");

    // Registered, but no MX published — try the A-record fallback.
    if (code === "ENODATA") return remember(await hasAddressRecord(domain));

    // ECONNREFUSED, ETIMEOUT, ESERVFAIL, our own timeout: our problem, not theirs.
    console.warn(`[auth] MX lookup for ${domain} was inconclusive (${code ?? "unknown"}) — allowing`);
    return remember("unknown");
  }
}

async function hasAddressRecord(domain: string): Promise<Verdict> {
  try {
    const addresses = await withTimeout(resolve4(domain), 3000);
    return addresses.length > 0 ? "yes" : "no";
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOTFOUND" || code === "NXDOMAIN" || code === "ENODATA") return "no";
    return "unknown";
  }
}
