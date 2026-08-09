/// <reference types="google.maps" />
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search, TriangleAlert } from "lucide-react";
import {
  fetchSuggestions,
  loadGoogleMaps,
  mapsEnabled,
  newSessionToken,
  resolvePlace,
  reverseGeocode,
  type ResolvedAddress,
  type Suggestion,
} from "@/lib/googleMaps";
import { cn } from "@/lib/utils";
import { controlClass } from "@/components/ui/Field";

/**
 * Google-backed address picker with a drag-to-correct map.
 *
 * Rooftop accuracy matters here: a pickup pin dropped on the wrong side of a
 * divided road sends the driver on a 20-minute detour. So the search result is
 * only a starting point — the marker stays draggable and every drag
 * re-geocodes, which is also the only way to fix the many Indian addresses
 * Places knows by name but not by exact gate.
 *
 * With no API key the component degrades to a hint and hands control back to
 * the manual fields, which the PIN code lookup fills instead.
 */

const DEBOUNCE_MS = 260;

type Props = {
  /** Current street line, so the search box reflects manual edits. */
  value: string;
  onResolved: (address: ResolvedAddress) => void;
  placeholder?: string;
  disabled?: boolean;
  lat?: number;
  lng?: number;
  invalid?: boolean;
  describedBy?: string;
  id?: string;
};

export function AddressAutocomplete({
  value,
  onResolved,
  placeholder = "Search for a building, street or landmark",
  disabled,
  lat,
  lng,
  invalid,
  describedBy,
  id,
}: Props) {
  const enabled = mapsEnabled();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [failed, setFailed] = useState(false);

  const sessionRef = useRef<google.maps.places.AutocompleteSessionToken | undefined>(undefined);
  const boxRef = useRef<HTMLDivElement>(null);

  // One session token per lookup keeps autocomplete billing on the session rate
  // rather than per keystroke; it must be discarded once a place is resolved.
  useEffect(() => {
    if (!enabled) return;
    newSessionToken().then((token) => {
      sessionRef.current = token;
    });
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !query.trim() || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      const results = await fetchSuggestions(query, sessionRef.current);
      if (cancelled) return;
      setSuggestions(results);
      setHighlight(0);
      setOpen(results.length > 0);
      setSearching(false);
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      setSearching(false);
    };
  }, [query, enabled]);

  // Dismiss the dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const choose = useCallback(
    async (suggestion: Suggestion) => {
      setOpen(false);
      setResolving(true);
      const address = await resolvePlace(suggestion.placeId, sessionRef.current);
      setResolving(false);
      sessionRef.current = await newSessionToken(); // token is spent

      if (!address) {
        setFailed(true);
        return;
      }
      setFailed(false);
      setQuery("");
      onResolved(address);
    },
    [onResolved],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      void choose(suggestions[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  if (!enabled) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
        <TriangleAlert className="mt-px size-3.5 shrink-0" />
        <p>
          Map search is off — no <code className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>{" "}
          is set. Type the address below; entering a PIN code fills in city and state automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div ref={boxRef} className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={id ? `${id}-listbox` : undefined}
          aria-autocomplete="list"
          aria-describedby={describedBy}
          autoComplete="off"
          disabled={disabled}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setFailed(false);
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(
            controlClass,
            "h-10 pl-9",
            invalid ? "border-rose-400 focus:border-rose-500" : "border-slate-300 focus:border-brand-500",
          )}
        />
        {(searching || resolving) && (
          <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-slate-400" />
        )}

        {open && suggestions.length > 0 && (
          <ul
            id={id ? `${id}-listbox` : undefined}
            role="listbox"
            className="animate-in-up absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-pop"
          >
            {suggestions.map((s, i) => (
              <li key={s.id} role="option" aria-selected={i === highlight}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => void choose(s)}
                  className={cn(
                    "flex w-full items-start gap-2.5 px-3 py-2 text-left",
                    i === highlight ? "bg-brand-50" : "hover:bg-slate-50",
                  )}
                >
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-brand-500" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900">
                      {s.primary}
                    </span>
                    {s.secondary && (
                      <span className="block truncate text-xs text-slate-500">{s.secondary}</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {failed && (
        <p className="text-xs text-rose-600">
          Could not read that location. Pick another result or type the address manually.
        </p>
      )}

      <MapPreview lat={lat} lng={lng} label={value} onMoved={onResolved} />
    </div>
  );
}

/** Map with a draggable pin; each drop reverse-geocodes into the form. */
function MapPreview({
  lat,
  lng,
  label,
  onMoved,
}: {
  lat?: number;
  lng?: number;
  label: string;
  onMoved: (address: ResolvedAddress) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [dragging, setDragging] = useState(false);

  const hasPin = typeof lat === "number" && typeof lng === "number";

  useEffect(() => {
    if (!hasPin || !hostRef.current) return;
    let cancelled = false;

    loadGoogleMaps()
      .then(async (g) => {
        if (cancelled || !hostRef.current) return;
        const position = { lat: lat!, lng: lng! };

        if (!mapRef.current) {
          mapRef.current = new g.maps.Map(hostRef.current, {
            center: position,
            zoom: 16,
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: "cooperative",
            clickableIcons: false,
          });
          markerRef.current = new g.maps.Marker({
            map: mapRef.current,
            position,
            draggable: true,
            title: "Drag to the exact gate",
          });

          markerRef.current.addListener("dragend", async () => {
            const p = markerRef.current?.getPosition();
            if (!p) return;
            setDragging(true);
            const resolved = await reverseGeocode(p.lat(), p.lng());
            setDragging(false);
            // Keep the operator's typed street line; only the pin moved.
            if (resolved) onMoved({ ...resolved, lat: p.lat(), lng: p.lng() });
          });
        } else {
          mapRef.current.setCenter(position);
          markerRef.current?.setPosition(position);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [lat, lng, hasPin, onMoved]);

  if (!hasPin) return null;

  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200">
      <div ref={hostRef} className="h-40 w-full bg-slate-100" aria-label={`Map showing ${label}`} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-slate-900/70 to-transparent px-3 py-2 text-[11px] font-medium text-white">
        {dragging ? (
          <>
            <Loader2 className="size-3 animate-spin" /> Updating address…
          </>
        ) : (
          <>
            <MapPin className="size-3" /> Drag the pin to the exact loading gate
          </>
        )}
      </div>
    </div>
  );
}
