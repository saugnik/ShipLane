import type { Metadata } from "next";
import { Check, X } from "lucide-react";
import { PageHero, Section, SectionHead } from "@/components/marketing/PageHero";
import { Bullets, Callout, DataTable, Steps } from "@/components/marketing/Prose";
import { ButtonLink } from "@/components/ui/Button";
import { findTopic } from "@/lib/support";
import { BRAND } from "@/lib/brand";

const TOPIC = findTopic("fraud-awareness");

export const metadata: Metadata = { title: TOPIC.title, description: TOPIC.blurb };

const NEVER = [
  "Ask for an OTP, PIN or password — for any reason, on any channel",
  "Ask you to pay a delivery, customs or clearance fee to a personal UPI ID, wallet or bank account",
  "Ask for your card number, CVV or net-banking credentials",
  "Ask you to install a screen-sharing or remote-access app",
  "Send a tracking link from a shortened or unrecognised domain",
  "Demand payment to release a consignment that is already in transit",
  "Charge a registration, security or refundable deposit for a job or a franchise",
];

const ALWAYS = [
  <>
    Bill freight against a GST tax invoice raised by {BRAND.legalName}, to the company&apos;s own
    bank account
  </>,
  <>
    Publish tracking only on <span className="docnum">{BRAND.website}</span> — the LRN works without
    an account
  </>,
  <>
    Show every charge on the quote before you accept it, and freeze it onto the Lorry Receipt
  </>,
  <>Identify the branch and the employee name when we call you about a consignment</>,
  <>Confirm a pickup in writing, with the LRN, before a vehicle is sent</>,
];

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="Support"
        title={TOPIC.title}
        lead="Courier brands are a favourite cover for fraud, because almost everyone is expecting a parcel. These are the patterns we see, and the things we will never do."
      />

      <Section>
        <Callout tone="danger" title="If you are being asked for an OTP or a payment right now, stop">
          Hang up or close the message and call the ops desk on{" "}
          <span className="docnum font-semibold">{BRAND.supportPhone}</span> using the number on this
          page — not any number given to you in the message. Nothing about a genuine consignment
          requires urgency measured in minutes.
        </Callout>
      </Section>

      <Section className="border-y border-line bg-surface">
        <SectionHead title="What we will never do, and what we always do" />
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-[16px] border border-rose-500/30 bg-rose-500/6 p-7">
            <h3 className="mb-4 flex items-center gap-2 text-[17px] text-ink">
              <X className="size-5 text-rose-600 dark:text-rose-400" />
              We will never
            </h3>
            <Bullets items={NEVER} />
          </div>
          <div className="rounded-[16px] border border-emerald-500/30 bg-emerald-500/6 p-7">
            <h3 className="mb-4 flex items-center gap-2 text-[17px] text-ink">
              <Check className="size-5 text-emerald-700 dark:text-emerald-400" />
              We always
            </h3>
            <Bullets items={ALWAYS} />
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          title="Scams that use our name"
          lead="The mechanics differ but the shape is the same: manufactured urgency, then a request for money or a code."
        />
        <DataTable
          head={["Scam", "How it reaches you", "The tell"]}
          rows={[
            [
              "Pending delivery fee",
              "SMS or WhatsApp with a tracking-style link",
              "Asks for a small payment to a UPI ID. Real freight is billed on an invoice, never collected by link.",
            ],
            [
              "Consignment held at customs",
              "Call or email claiming a clearance charge",
              "We run domestic lanes. There is no customs step to pay for.",
            ],
            [
              "OTP to confirm delivery",
              "Call from someone claiming to be the driver",
              "Delivery is confirmed by signature on the POD. No OTP is ever read out to us.",
            ],
            [
              "Address correction charge",
              "Message saying the address is incomplete",
              "A genuine address query comes from your branch, is free, and never involves payment.",
            ],
            [
              "Franchise or courier-job offer",
              "Email or social post with an application fee",
              "We never charge to apply, and never take a security deposit before an agreement is signed.",
            ],
            [
              "Fake refund for a lost parcel",
              "Call offering compensation, then asking for bank details",
              "Claims are settled against a filed claim, to the account on your invoice.",
            ],
            [
              "COD reversal",
              "Call asking you to send money back after an 'overcharge'",
              "COD adjustments happen in your statement, never by a transfer you initiate.",
            ],
          ]}
        />
      </Section>

      <Section className="border-y border-line bg-surface">
        <SectionHead
          title="If you think you have been targeted"
          lead="Speed matters most in the first hour, and least after that. Do these in order."
        />
        <Steps
          items={[
            [
              "Stop the transaction",
              "Do not send anything further. If you have already paid, call your bank's fraud line immediately and ask them to freeze and recall the transfer.",
            ],
            [
              "Keep the evidence",
              "Screenshot the message including the sender's number or address, and note the exact time. Do not delete the thread — it is what an investigation works from.",
            ],
            [
              "Tell us",
              <>
                Email <span className="docnum">{BRAND.supportEmail}</span> with the screenshots and
                any LRN quoted to you. We can confirm within minutes whether a consignment exists.
              </>,
            ],
            [
              "Report it formally",
              "File on the National Cyber Crime Reporting Portal at cybercrime.gov.in, or call 1930. A police complaint materially improves the odds of a recall.",
            ],
          ]}
        />
      </Section>

      <Section>
        <SectionHead title="Verifying a consignment yourself" />
        <Bullets
          items={[
            <>
              Type <span className="docnum">{BRAND.website}</span> into your browser yourself and use
              the tracking box. Never follow a link from the message you are checking.
            </>,
            "A real LRN is nine digits. If the reference you have been given is a different length or format, it is not ours.",
            "If tracking shows nothing for the number, there is no consignment — regardless of what the message says.",
            "Cross-check the consignor. If nobody you deal with has sent you anything, there is nothing to pay for.",
          ]}
        />
      </Section>

      <Section className="border-t border-line">
        <SectionHead
          title="Report an impersonation"
          lead="If someone is using our name, tell us. We pursue takedowns on fake domains and social accounts."
        />
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/support/complaint">Register a complaint</ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            Contact the ops desk
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
