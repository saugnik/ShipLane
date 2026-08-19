"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Building2 } from "lucide-react";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { mapsEnabled } from "@/lib/googleMaps";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { GST_STATE_CODES, INDIAN_STATES } from "@/lib/india";
import type { PartyForm as PartyFormState } from "@/lib/bookingState";
import type { ResolvedAddress } from "@/lib/googleMaps";
import type { StepErrors } from "@/lib/bookingState";

type Props = {
  side: "pickup" | "drop";
  value: PartyFormState;
  onChange: (next: PartyFormState) => void;
  errors: StepErrors;
};

const COPY = {
  pickup: {
    title: "Pickup — shipper",
    accent: "bg-brand-600",
    companyLabel: "Shipper company name",
    contactLabel: "Pickup contact person",
    addressLabel: "Pickup address",
  },
  drop: {
    title: "Drop — consignee",
    accent: "bg-emerald-600",
    companyLabel: "Consignee company name",
    contactLabel: "Receiving contact person",
    addressLabel: "Delivery address",
  },
} as const;

export function PartyForm({ side, value, onChange, errors }: Props) {
  const copy = COPY[side];
  const err = (field: string) => errors[`${side}.${field}`];

  const set = useCallback(
    <K extends keyof PartyFormState>(key: K, v: PartyFormState[K]) => {
      onChange({ ...value, [key]: v });
    },
    [onChange, value],
  );

  const onResolved = useCallback(
    (address: ResolvedAddress) => {
      onChange({
        ...value,
        address: address.line || address.formatted,
        // Never blank a field the operator already filled just because Places
        // came back sparse for that locality.
        city: address.city || value.city,
        state: address.state || value.state,
        pincode: address.pincode || value.pincode,
        lat: address.lat,
        lng: address.lng,
      });
    },
    [onChange, value],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <span className={`size-2 rounded-full ${copy.accent}`} aria-hidden />
        <h3 className="text-sm font-semibold text-ink">{copy.title}</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={copy.companyLabel} required error={err("company")}>
          {({ id, invalid, describedBy }) => (
            <div className="relative">
              <Building2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-4" />
              <Input
                id={id}
                invalid={invalid}
                aria-describedby={describedBy}
                className="pl-9"
                placeholder="e.g. XYZ Products Pvt Ltd"
                value={value.company}
                onChange={(e) => set("company", e.target.value)}
              />
            </div>
          )}
        </Field>

        <Field label={copy.contactLabel} error={err("contact")}>
          {({ id, invalid }) => (
            <Input
              id={id}
              invalid={invalid}
              placeholder="Full name"
              value={value.contact}
              onChange={(e) => set("contact", e.target.value)}
            />
          )}
        </Field>

        <Field
          label="Mobile number"
          error={err("phone")}
          hint="Used for pickup and delivery calls"
        >
          {({ id, invalid }) => (
            <Input
              id={id}
              invalid={invalid}
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit mobile"
              value={value.phone}
              onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
            />
          )}
        </Field>

        <Field label="Email" error={err("email")}>
          {({ id, invalid }) => (
            <Input
              id={id}
              invalid={invalid}
              type="email"
              placeholder="ops@company.com"
              value={value.email}
              onChange={(e) => set("email", e.target.value)}
            />
          )}
        </Field>
      </div>

      <div className="rounded-lg border border-line bg-sunken p-4">
        <Field label={copy.addressLabel} required error={err("address")}>
          {({ id, invalid, describedBy }) => (
            <div className="flex flex-col gap-2.5">
              <AddressAutocomplete
                id={id}
                invalid={invalid}
                describedBy={describedBy}
                value={value.address}
                lat={value.lat}
                lng={value.lng}
                onResolved={onResolved}
                placeholder={
                  side === "pickup" ? "Search pickup location" : "Search delivery location"
                }
              />
              <Textarea
                rows={2}
                invalid={invalid}
                // Only mention the map when there is one — without a Maps key
                // the picker above does not render, and telling someone to
                // refine a search result they never saw is just confusing.
                placeholder={
                  mapsEnabled()
                    ? "Building, street, area — refine after picking from the map"
                    : "Building, street, area"
                }
                value={value.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </div>
          )}
        </Field>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <PincodeField
            value={value.pincode}
            error={err("pincode")}
            onChange={(pincode) => set("pincode", pincode)}
            onResolved={(city, state) =>
              onChange({
                ...value,
                pincode: value.pincode,
                city: city || value.city,
                state: state || value.state,
              })
            }
            pincodeRef={value.pincode}
          />

          <Field label="City" required error={err("city")}>
            {({ id, invalid }) => (
              <Input
                id={id}
                invalid={invalid}
                placeholder="City"
                value={value.city}
                onChange={(e) => set("city", e.target.value)}
              />
            )}
          </Field>

          <Field label="State" required error={err("state")}>
            {({ id, invalid }) => (
              <Select
                id={id}
                invalid={invalid}
                value={value.state}
                onChange={(e) => set("state", e.target.value)}
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <div className="mt-4">
          <GstinField
            value={value.gstin}
            state={value.state}
            error={err("gstin")}
            onChange={(v) => set("gstin", v)}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * GSTIN entry.
 *
 * The format trips people up constantly — it looks like "15 characters" but is
 * really state code + PAN + entity + Z + checksum, so an all-numeric value gets
 * rejected with no obvious reason. The hint shows the mask against what has
 * been typed so far, and cross-checks the leading state code against the
 * address state, since that mismatch is a common e-Way Bill rejection.
 */
function GstinField({
  value,
  state,
  error,
  onChange,
}: {
  value: string;
  state: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  const expectedCode = GST_STATE_CODES[state as keyof typeof GST_STATE_CODES];
  const typedCode = value.slice(0, 2);

  const stateMismatch =
    typedCode.length === 2 && expectedCode && typedCode !== expectedCode
      ? `First two digits are the state code — ${state} is ${expectedCode}, you entered ${typedCode}`
      : null;

  const wellFormed = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value);

  const hint = error
    ? undefined
    : stateMismatch ??
      (value.length === 0
        ? `Optional. Format 22AAAAA1234A1Z5${expectedCode ? ` — ${state} starts with ${expectedCode}` : ""}`
        : wellFormed
          ? "Valid GSTIN format"
          : `${value.length}/15 · positions 3-7 must be letters, position 14 must be Z`);

  return (
    <Field label="GSTIN" error={error} hint={hint}>
      {({ id, invalid }) => (
        <Input
          id={id}
          invalid={invalid || Boolean(stateMismatch)}
          maxLength={15}
          placeholder={expectedCode ? `${expectedCode}AAAAA1234A1Z5` : "22AAAAA1234A1Z5"}
          className="docnum uppercase tracking-wider"
          autoComplete="off"
          value={value}
          // Strip anything the format cannot contain so a paste with spaces or
          // dashes still lands as a clean value.
          onChange={(e) => onChange(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15))}
        />
      )}
    </Field>
  );
}

/**
 * PIN code entry that resolves city and state as you type.
 * This is the whole address story when Google Maps is not configured, so it
 * has to be genuinely useful — it reports how confident the match is.
 */
function PincodeField({
  value,
  error,
  onChange,
  onResolved,
}: {
  value: string;
  error?: string;
  onChange: (v: string) => void;
  onResolved: (city: string, state: string) => void;
  pincodeRef: string;
}) {
  const [hint, setHint] = useState<string | null>(null);
  const lastLookup = useRef<string>("");

  useEffect(() => {
    if (value.length !== 6) {
      setHint(null);
      return;
    }
    if (lastLookup.current === value) return;
    lastLookup.current = value;

    let cancelled = false;
    fetch(`/api/pincode/${value}`)
      .then((r) => r.json())
      .then((payload) => {
        if (cancelled) return;
        const data = payload?.data;
        if (!data || data.precision === "unknown") {
          setHint("Not a recognised PIN code — enter city and state manually");
          return;
        }
        onResolved(data.city ?? "", data.state ?? "");
        setHint(
          data.precision === "state"
            ? `Matched ${data.state} — please confirm the city`
            : `Matched ${data.city}, ${data.state}`,
        );
      })
      .catch(() => !cancelled && setHint(null));

    return () => {
      cancelled = true;
    };
    // `onResolved` is recreated on every parent render; depending on it here
    // would re-run the lookup in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Field label="PIN code" required error={error} hint={hint ?? undefined}>
      {({ id, invalid }) => (
        <Input
          id={id}
          invalid={invalid}
          inputMode="numeric"
          maxLength={6}
          placeholder="6-digit PIN"
          className="docnum"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        />
      )}
    </Field>
  );
}
