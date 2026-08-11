import { BRAND } from "@/lib/brand";

/**
 * OTP delivery.
 *
 * Real email needs a provider key. When none is configured the code is logged
 * server-side and echoed to the screen so a demo deployment is still usable —
 * `otpIsEchoed()` gates that, and the UI shows a loud banner whenever it is on,
 * because echoing a login code to the browser means anyone who can reach the
 * page can sign in as anyone.
 *
 * Set RESEND_API_KEY (and optionally MAIL_FROM) to switch to real delivery.
 */

const resendKey = () => process.env.RESEND_API_KEY?.trim() ?? "";

export function mailerConfigured(): boolean {
  return resendKey().length > 0;
}

/** True when the code is returned to the client instead of emailed. */
export function otpIsEchoed(): boolean {
  if (mailerConfigured()) return false;
  // Explicit opt-out for anyone who wants the demo locked down without email.
  return process.env.OTP_ECHO !== "off";
}

function template(code: string, purpose: string) {
  const action = purpose === "REGISTER" ? "complete your registration" : "sign in";
  return {
    subject: `${code} is your ${BRAND.name} verification code`,
    text: `Your ${BRAND.name} code is ${code}. Use it to ${action}. It expires in 10 minutes. If you did not request it, ignore this email.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px">
  <h2 style="margin:0 0 4px">${BRAND.name}</h2>
  <p style="color:#555;margin:0 0 24px">Verification code</p>
  <p style="font-size:34px;font-weight:700;letter-spacing:8px;margin:0 0 24px">${code}</p>
  <p style="color:#555">Use this code to ${action}. It expires in 10 minutes.</p>
  <p style="color:#888;font-size:12px">If you did not request this, you can ignore this email.</p>
</div>`,
  };
}

export type DeliveryResult = { ok: true } | { ok: false; reason: string };

/**
 * Returns whether the code actually reached the recipient.
 *
 * A silent failure here is the worst outcome: the caller would report "code
 * sent" and the user would wait for an email that never arrives. The commonest
 * cause is a provider that only allows sending to the account owner until a
 * domain is verified, so that case gets its own actionable message.
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

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || `${BRAND.name} <onboarding@resend.dev>`,
        to: [email],
        subject: body.subject,
        text: body.text,
        html: body.html,
      }),
    });

    if (res.ok) return { ok: true };

    const detail = await res.text();
    console.error("[auth] mail provider rejected the send:", res.status, detail);

    // Unverified-domain rejection — by far the most likely misconfiguration.
    if (res.status === 403 && /verify a domain|only send testing emails/i.test(detail)) {
      return {
        ok: false,
        reason:
          "Email is not fully configured yet: the sending domain is unverified, so codes can only reach the mailbox that owns the email provider account. Verify a domain and set MAIL_FROM to an address on it.",
      };
    }

    return { ok: false, reason: "The email provider rejected the message." };
  } catch (err) {
    console.error("[auth] mail delivery failed", err);
    return { ok: false, reason: "Could not reach the email provider." };
  }
}
