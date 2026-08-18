import { BRAND } from "@/lib/brand";

/**
 * OTP delivery over Mailjet.
 *
 * Real email needs MAILJET_API_KEY and MAILJET_SECRET_KEY. When neither is
 * configured the code is logged server-side and echoed to the screen so a demo
 * deployment is still usable — `otpIsEchoed()` gates that, and the UI shows a
 * loud banner whenever it is on, because echoing a login code to the browser
 * means anyone who can reach the page can sign in as anyone.
 *
 * The sender address in MAIL_FROM must be a validated sender on the Mailjet
 * account; Mailjet rejects anything else outright.
 */

const API = "https://api.mailjet.com/v3.1/send";

const key = () => process.env.MAILJET_API_KEY?.trim() ?? "";
const secretKey = () => process.env.MAILJET_SECRET_KEY?.trim() ?? "";

export function mailerConfigured(): boolean {
  return key().length > 0 && secretKey().length > 0;
}

/** True when the code is returned to the client instead of emailed. */
export function otpIsEchoed(): boolean {
  if (mailerConfigured()) return false;
  // Explicit opt-out for anyone who wants the demo locked down without email.
  return process.env.OTP_ECHO !== "off";
}

function sender() {
  return {
    Email: process.env.MAIL_FROM?.trim() || `no-reply@${BRAND.website.replace(/^www\./, "")}`,
    Name: process.env.MAIL_FROM_NAME?.trim() || BRAND.name,
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

  if (!mailerConfigured()) {
    console.info(`[auth] OTP for ${email} (${purpose}): ${code}`);
    return { ok: true };
  }

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
