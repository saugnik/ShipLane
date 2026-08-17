"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Hero tracking field — routes straight to the public tracking page.
 *
 * `onDark` swaps to a fixed light-on-dark palette instead of the surface
 * tokens, because the hero panel stays dark in both themes.
 */
export function TrackBox({ onDark = false }: { onDark?: boolean }) {
  const router = useRouter();
  const [lrn, setLrn] = useState("");

  const shell = onDark
    ? "rounded-[14px] border border-white/12 bg-white/[0.04] p-[22px] backdrop-blur-[6px]"
    : "rounded-[14px] border border-line bg-surface p-[22px] shadow-lg";

  const field = onDark
    ? "docnum min-w-0 flex-1 rounded-[8px] border border-white/14 bg-[#050f22]/70 px-3.5 py-3 text-[14.5px] text-white placeholder:text-[#7b8cab] focus:border-brand-500 focus:outline-none"
    : "docnum min-w-0 flex-1 rounded-[8px] border border-line bg-canvas px-3.5 py-3 text-[14.5px] text-ink placeholder:text-ink-4 focus:border-brand-500 focus:outline-none";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = lrn.trim();
        if (v) router.push(`/track?lrn=${encodeURIComponent(v)}`);
      }}
      className={shell}
    >
      {/* Not `label-caps` + a colour override on dark: both land in the same
          cascade layer and label-caps' own colour wins. Spelled out instead. */}
      <label
        htmlFor="hero-lrn"
        className={
          onDark
            ? "block text-[11px] leading-4 font-semibold tracking-[0.07em] text-[#9fb0cc] uppercase"
            : "label-caps"
        }
      >
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
          className={field}
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
