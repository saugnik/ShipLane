"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Hero tracking field — routes straight to the public tracking page. */
export function TrackBox() {
  const router = useRouter();
  const [lrn, setLrn] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = lrn.trim();
        if (v) router.push(`/track?lrn=${encodeURIComponent(v)}`);
      }}
      className="rounded-[14px] border border-line bg-surface p-[22px] shadow-lg"
    >
      <label htmlFor="hero-lrn" className="label-caps">
        Track a shipment
      </label>
      <div className="mt-2.5 flex gap-2.5">
        <input
          id="hero-lrn"
          value={lrn}
          onChange={(e) => setLrn(e.target.value)}
          placeholder="e.g. 373926179"
          aria-label="Tracking number"
          autoComplete="off"
          className="docnum min-w-0 flex-1 rounded-[8px] border border-line bg-canvas px-3.5 py-3 text-[14.5px] text-ink placeholder:text-ink-4 focus:border-brand-500 focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-[8px] bg-brand-600 px-6 text-[14.5px] font-semibold text-white transition-colors hover:bg-brand-500 active:scale-[0.98]"
        >
          Track
        </button>
      </div>
    </form>
  );
}
