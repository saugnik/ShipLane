/**
 * The status strip under the hero map.
 *
 * The list is duplicated and the track translated by exactly -50%, which is
 * what makes the loop seamless — the second copy is under the cursor at the
 * moment the first scrolls out. `aria-hidden` on the duplicate keeps a screen
 * reader from hearing everything twice.
 */
const ITEMS: [label: string, value: string][] = [
  ["Route optimisation", "Nagpur → Guwahati, 12:00 IST"],
  ["Carrier panel", "5 carriers rated per booking"],
  ["Network", "19,000+ PIN codes served"],
  ["Hub sort", "Nagpur clearing on schedule"],
  ["Documentation", "LR and carton tags issued at booking"],
  ["Lane watch", "Mumbai → Bengaluru running to plan"],
  ["Fuel surcharge", "Revised on the 1st of each month"],
];

function Row({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {ITEMS.map(([label, value]) => (
        <span key={label} className="flex items-center whitespace-nowrap">
          <span className="mx-5 h-1 w-1 rounded-full bg-brand-500/70" aria-hidden />
          <span className="text-[11.5px] font-semibold tracking-[0.09em] text-brand-400 uppercase">
            {label}
          </span>
          <span className="ml-2.5 text-[12.5px] text-[#9fb0cc]">{value}</span>
        </span>
      ))}
    </div>
  );
}

export function NetworkTicker() {
  return (
    <div className="relative overflow-hidden border-t border-white/8 py-3.5">
      {/* Fades the strip into the panel at both ends rather than cutting it. */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(90deg, #071729 0%, transparent 8%, transparent 92%, #0a1e38 100%)",
        }}
        aria-hidden
      />
      <div className="ticker-track flex w-max">
        <Row />
        <Row hidden />
      </div>
    </div>
  );
}
