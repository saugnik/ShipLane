import nodemailer from "nodemailer";
// createTransport's overloads do not infer a bare object literal as SMTP
// options, so the options are typed explicitly rather than cast away.
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { BRAND } from "@/lib/brand";

/**
 * OTP delivery.
 *
 * Two transports, chosen by whatever is configured:
 *
 *   google   SMTP through Google Workspace with an app password. Preferred
 *            when shippbie.com already runs on Workspace — the domain's SPF
 *            and DKIM authorise Google to send for it out of the box, so mail
 *            passes DMARC with no extra DNS, no provider signup, and none of
 *            the new-account review that gets transactional senders suspended.
 *   mailjet  HTTP API. Kept as the fallback so switching back is an env var
 *            rather than a code change.
 *
 * With neither configured the code is logged server-side and echoed to the
 * screen so a demo deployment is still usable — `otpIsEchoed()` gates that, and
 * the UI shows a loud banner whenever it is on, because echoing a login code to
 * the browser means anyone who can reach the page can sign in as anyone.
 */

const API = "https://api.mailjet.com/v3.1/send";

const key = () => process.env.MAILJET_API_KEY?.trim() ?? "";
const secretKey = () => process.env.MAILJET_SECRET_KEY?.trim() ?? "";
const gmailUser = () => process.env.GMAIL_USER?.trim() ?? "";
// Google prints app passwords in groups of four; people paste them that way.
const gmailPassword = () => (process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s+/g, "");

type Provider = "google" | "mailjet" | "none";

/**
 * Which transport will actually be used.
 *
 * MAIL_PROVIDER forces one explicitly; otherwise Google wins when configured,
 * because on this domain it is both better authenticated and not subject to a
 * provider's abuse review.
 */
export function mailProvider(): Provider {
  const forced = process.env.MAIL_PROVIDER?.trim().toLowerCase();
  const googleReady = gmailUser().length > 0 && gmailPassword().length > 0;
  const mailjetReady = key().length > 0 && secretKey().length > 0;

  if (forced === "google") return googleReady ? "google" : "none";
  if (forced === "mailjet") return mailjetReady ? "mailjet" : "none";

  if (googleReady) return "google";
  if (mailjetReady) return "mailjet";
  return "none";
}

export function mailerConfigured(): boolean {
  return mailProvider() !== "none";
}

/** True when the code is returned to the client instead of emailed. */
export function otpIsEchoed(): boolean {
  if (mailerConfigured()) return false;
  // Explicit opt-out for anyone who wants the demo locked down without email.
  return process.env.OTP_ECHO !== "off";
}

/**
 * The From address.
 *
 * Over Google SMTP this is forced to the authenticated mailbox: Gmail silently
 * rewrites From to the account it authenticated as unless the address is a
 * configured "Send mail as" alias, so honouring a differing MAIL_FROM would
 * mean the logs claim one sender and the recipient sees another.
 */
function sender() {
  const name = process.env.MAIL_FROM_NAME?.trim() || BRAND.name;

  if (mailProvider() === "google") {
    return { Email: gmailUser(), Name: name };
  }

  return {
    Email: process.env.MAIL_FROM?.trim() || `no-reply@${BRAND.website.replace(/^www\./, "")}`,
    Name: name,
  };
}

function template(code: string, purpose: string) {
  const action = purpose === "REGISTER" ? "complete your registration" : "sign in";
  return {
    subject: `${code} is your ${BRAND.name} verification code`,
    text: `Your ${BRAND.name} code is ${code}. Use it to ${action}. It expires in 10 minutes. If you did not request it, ignore this email.`,
    html: `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
  <h2 style="margin:0 0 4px;color:#0b2447;font-size:20px">${BRAND.name}</h2>
  <p style="color:#5b6b82;margin:0 0 28px;font-size:14px">Verification code</p>
  <p style="font-size:34px;font-weight:700;letter-spacing:8px;margin:0 0 28px;color:#0b2447">${code}</p>
  <p style="color:#5b6b82;font-size:14px;line-height:1.6">Use this code to ${action}. It expires in 10 minutes.</p>
  <p style="color:#8a96ac;font-size:12px;line-height:1.6;margin-top:28px;border-top:1px solid #e2e6ed;padding-top:16px">
    If you did not request this, you can ignore this email — no account is created without the code.
  </p>
</div>`,
  };
}

/**
 * Digs the human-readable complaint out of a Mailjet error body.
 *
 * Mailjet answers in three different shapes depending on where it failed —
 * top-level `ErrorMessage`, a per-message `Errors[]`, or a bare string — so all
 * three are tried before falling back to the raw text.
 */
function mailjetReason(body: string): string {
  try {
    const d = JSON.parse(body) as {
      ErrorMessage?: string;
      Messages?: { Errors?: { ErrorMessage?: string; ErrorCode?: string }[] }[];
    };
    const perMessage = d.Messages?.[0]?.Errors?.map((e) =>
      [e.ErrorCode, e.ErrorMessage].filter(Boolean).join(" "),
    ).filter(Boolean);
    if (perMessage?.length) return perMessage.join("; ");
    if (d.ErrorMessage) return d.ErrorMessage;
  } catch {
    // Not JSON — fall through to the raw body.
  }
  return body.slice(0, 300).replace(/\s+/g, " ").trim() || "no detail returned";
}

export type DeliveryResult = { ok: true } | { ok: false; reason: string };

/**
 * Returns whether the code actually reached the recipient.
 *
 * A silent failure here is the worst outcome: the caller would report "code
 * sent" and the user would wait for an email that never arrives. Mailjet also
 * answers 200 for a payload it then refuses per-message, so the per-message
 * Status is checked rather than just the HTTP code.
 */
export async function deliverOtp(
  email: string,
  code: string,
  purpose: string,
): Promise<DeliveryResult> {
  const body = template(code, purpose);
  const provider = mailProvider();

  if (provider === "none") {
    console.info(`[auth] OTP for ${email} (${purpose}): ${code}`);
    return { ok: true };
  }

  if (provider === "google") return sendViaGoogle(email, body);
  return sendViaMailjet(email, body, purpose);
}

type Body = ReturnType<typeof template>;

/**
 * Google Workspace SMTP.
 *
 * Port 465 rather than 587: implicit TLS needs one round trip instead of
 * STARTTLS's negotiation, which matters when a serverless invocation opens a
 * fresh connection every time. Pooling is left off (the default) for the same
 * reason — there is no long-lived process to keep a pool alive between requests.
 *
 * The timeouts are deliberate. A hung SMTP socket would otherwise hold the
 * function open until the platform kills it, and the caller would learn nothing.
 */
async function sendViaGoogle(email: string, body: Body): Promise<DeliveryResult> {
  const from = sender();

  try {
    const options: SMTPTransport.Options = {
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: gmailUser(), pass: gmailPassword() },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    };
    const transport = nodemailer.createTransport(options);

    await transport.sendMail({
      from: { address: from.Email, name: from.Name },
      to: email,
      replyTo: { address: BRAND.supportEmail, name: `${BRAND.name} support` },
      subject: body.subject,
      text: body.text,
      html: body.html,
    });

    return { ok: true };
  } catch (err) {
    const e = err as { responseCode?: number; code?: string; message?: string };
    console.error("[auth] Google SMTP send failed", e.code, e.responseCode, e.message);

    // 535 is Gmail's "username and password not accepted" — almost always a
    // plain account password used where an app password is required, or 2-Step
    // Verification not enabled on the account. Worth naming, because the raw
    // message points at a help page rather than the cause.
    if (e.responseCode === 535 || /invalid login|username and password not accepted/i.test(e.message ?? "")) {
      return {
        ok: false,
        reason: `Google rejected the sign-in for ${gmailUser()}. GMAIL_APP_PASSWORD must be a 16-character app password, not the account password, and 2-Step Verification must be on.`,
      };
    }

    return {
      ok: false,
      reason: `Could not send through Google (${e.code ?? "error"}): ${e.message ?? "no detail"}`,
    };
  }
}

async function sendViaMailjet(
  email: string,
  body: Body,
  purpose: string,
): Promise<DeliveryResult> {
  const auth = Buffer.from(`${key()}:${secretKey()}`).toString("base64");

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Messages: [
          {
            From: sender(),
            To: [{ Email: email }],
            // Replies should reach a human, not the no-reply void. Filters also
            // read a missing Reply-To on a domain that can receive mail as a
            // small negative signal.
            ReplyTo: { Email: BRAND.supportEmail, Name: `${BRAND.name} support` },
            Subject: body.subject,
            TextPart: body.text,
            HTMLPart: body.html,
            // Tracking OFF, deliberately.
            //
            // Click tracking rewrites every link to a Mailjet redirect domain
            // and open tracking injects a remote pixel. On a one-time-code email
            // that is a phishing signature — a message claiming to be from
            // shippbie.com whose links point somewhere else — and it is the
            // commonest reason transactional OTPs land in spam. There is nothing
            // to track here anyway: the code is the payload.
            TrackOpens: "disabled",
            TrackClicks: "disabled",
            // Surfaces in Mailjet's dashboard so a failed send is traceable to
            // the flow that triggered it.
            CustomID: `otp-${purpose.toLowerCase()}`,
          },
        ],
      }),
    });

    const detail = await res.text();

    if (res.status === 401) {
      console.error("[auth] Mailjet returned 401:", detail);
      // A 401 here is not necessarily a bad key. Mailjet also answers 401 with
      // mj-0001 when it has suspended sending on the account, and reporting
      // that as "wrong credentials" sends whoever is debugging it off to
      // re-check a key that was never the problem.
      if (/blocked|suspend/i.test(detail)) {
        return {
          ok: false,
          reason: `The email provider has suspended sending on this account: ${mailjetReason(detail)}`,
        };
      }
      return {
        ok: false,
        reason: `The email provider rejected our credentials (sending as ${sender().Email}): ${mailjetReason(detail)}`,
      };
    }

    if (!res.ok) {
      console.error("[auth] Mailjet send failed:", res.status, detail);
      if (/from.*not.*allow|sender.*not.*valid|unauthorized sender/i.test(detail)) {
        return {
          ok: false,
          reason: `“${sender().Email}” is not a validated sender on this Mailjet account. Add and confirm it, then set MAIL_FROM to that address.`,
        };
      }
      // Pass the provider's own words through. A generic "rejected" tells an
      // operator nothing, and this is the one place where the actual cause is
      // known — Mailjet's messages name the offending field and carry no
      // secrets. Without it, diagnosing a misconfigured deployment means
      // guessing against a black box.
      return {
        ok: false,
        reason: `Mailjet refused the message (HTTP ${res.status}, sending as ${sender().Email}): ${mailjetReason(detail)}`,
      };
    }

    // 200 does not mean delivered — Mailjet reports per-message status here.
    try {
      const payload = JSON.parse(detail) as {
        Messages?: { Status?: string; Errors?: { ErrorMessage?: string }[] }[];
      };
      const message = payload.Messages?.[0];
      if (message?.Status && message.Status !== "success") {
        console.error("[auth] Mailjet accepted the request but refused the message:", detail);
        return {
          ok: false,
          reason: `Mailjet could not send to that address (sending as ${sender().Email}): ${mailjetReason(detail)}`,
        };
      }
    } catch {
      // Unparseable 200 — treat the HTTP status as authoritative rather than
      // failing a send that probably went out.
    }

    return { ok: true };
  } catch (err) {
    console.error("[auth] mail delivery failed", err);
    return { ok: false, reason: "Could not reach the email provider." };
  }
}
