/// <reference types="google.maps" />
"use client";

import { normalizeStateName } from "@/lib/india";

/**
 * Google Maps JS API bootstrap.
 *
 * The whole address layer is optional: with no key configured every helper here
 * reports "unavailable" and the booking form falls back to manual entry backed
 * by the offline PIN code table. Nothing in the flow hard-depends on Google.
 */

export const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
export const mapsEnabled = () => MAPS_KEY.length > 0;

const CALLBACK = "__shiplaneMapsReady";
let loader: Promise<typeof google> | null = null;

export function loadGoogleMaps(): Promise<typeof google> {
  if (!mapsEnabled()) return Promise.reject(new Error("Google Maps API key is not configured"));
  if (typeof window === "undefined") return Promise.reject(new Error("Maps can only load in the browser"));
  if (loader) return loader;

  loader = new Promise<typeof google>((resolve, reject) => {
    if (window.google?.maps) {
      resolve(window.google);
      return;
    }

    const w = window as unknown as Record<string, unknown>;
    w[CALLBACK] = () => resolve(window.google);

    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(MAPS_KEY)}` +
      `&v=weekly&libraries=places,marker&loading=async&region=IN&language=en&callback=${CALLBACK}`;
    script.async = true;
    script.onerror = () => {
      loader = null;
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
  });

  return loader;
}

export type ResolvedAddress = {
  formatted: string;
  /** Street-level portion, with the city/state/PIN stripped off. */
  line: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
};

type Component = { longText?: string | null; shortText?: string | null; types: string[] };

/** Both the legacy and current APIs describe components; normalise the shapes. */
function toComponents(
  raw: google.maps.GeocoderAddressComponent[] | google.maps.places.AddressComponent[] | null,
): Component[] {
  if (!raw) return [];
  return raw.map((c) => {
    if ("long_name" in c) {
      return { longText: c.long_name, shortText: c.short_name, types: c.types as string[] };
    }
    return { longText: c.longText, shortText: c.shortText, types: c.types as string[] };
  });
}

function pick(components: Component[], ...types: string[]): string {
  for (const type of types) {
    const hit = components.find((c) => c.types.includes(type));
    if (hit?.longText) return hit.longText;
  }
  return "";
}

export function parseAddressComponents(
  raw: google.maps.GeocoderAddressComponent[] | google.maps.places.AddressComponent[] | null,
  formatted: string,
  location?: { lat: number; lng: number },
): ResolvedAddress {
  const components = toComponents(raw);

  const city =
    pick(components, "locality", "administrative_area_level_3", "administrative_area_level_2") || "";
  const stateRaw = pick(components, "administrative_area_level_1");
  const pincode = pick(components, "postal_code");

  // Street line: everything more specific than the city, in reading order.
  const street = [
    pick(components, "premise"),
    pick(components, "street_number"),
    pick(components, "route"),
    pick(components, "neighborhood"),
    pick(components, "sublocality_level_2"),
    pick(components, "sublocality_level_1", "sublocality"),
  ]
    .filter(Boolean)
    .filter((part, i, arr) => arr.indexOf(part) === i)
    .join(", ");

  // Fall back to trimming the formatted address when components are sparse.
  const line =
    street ||
    formatted
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && s !== city && s !== stateRaw && !s.includes(pincode) && s !== "India")
      .join(", ");

  return {
    formatted,
    line: line || formatted,
    city,
    state: normalizeStateName(stateRaw) ?? "",
    pincode,
    lat: location?.lat,
    lng: location?.lng,
  };
}

export type Suggestion = { id: string; primary: string; secondary: string; placeId: string };

/**
 * Autocomplete via the current Places API, falling back to the legacy service
 * when a project has not enabled "Places API (New)". Returns [] when Maps is
 * unavailable so callers never need a try/catch.
 */
export async function fetchSuggestions(
  input: string,
  sessionToken?: google.maps.places.AutocompleteSessionToken,
): Promise<Suggestion[]> {
  if (!input.trim() || !mapsEnabled()) return [];

  try {
    const g = await loadGoogleMaps();
    const places = (await g.maps.importLibrary("places")) as google.maps.PlacesLibrary;

    if (places.AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
      const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input,
        includedRegionCodes: ["in"],
        sessionToken,
      });
      return suggestions
        .map((s) => s.placePrediction)
        .filter((p): p is google.maps.places.PlacePrediction => Boolean(p))
        .map((p) => ({
          id: p.placeId,
          placeId: p.placeId,
          primary: p.mainText?.toString() ?? p.text.toString(),
          secondary: p.secondaryText?.toString() ?? "",
        }));
    }

    // Legacy path.
    const service = new g.maps.places.AutocompleteService();
    const result = await service.getPlacePredictions({
      input,
      componentRestrictions: { country: "in" },
    });
    return (result.predictions ?? []).map((p) => ({
      id: p.place_id,
      placeId: p.place_id,
      primary: p.structured_formatting?.main_text ?? p.description,
      secondary: p.structured_formatting?.secondary_text ?? "",
    }));
  } catch (err) {
    console.warn("[maps] autocomplete unavailable", err);
    return [];
  }
}

/** Resolve a suggestion into a full address. */
export async function resolvePlace(
  placeId: string,
  sessionToken?: google.maps.places.AutocompleteSessionToken,
): Promise<ResolvedAddress | null> {
  try {
    const g = await loadGoogleMaps();
    const places = (await g.maps.importLibrary("places")) as google.maps.PlacesLibrary;

    if (places.Place) {
      const place = new places.Place({ id: placeId });
      await place.fetchFields({
        fields: ["formattedAddress", "addressComponents", "location"],
        ...(sessionToken ? { sessionToken } : {}),
      } as google.maps.places.FetchFieldsRequest);

      const loc = place.location;
      return parseAddressComponents(
        place.addressComponents ?? null,
        place.formattedAddress ?? "",
        loc ? { lat: loc.lat(), lng: loc.lng() } : undefined,
      );
    }

    // Geocoder resolves by place id too, so we never need a PlacesService div.
    return geocode({ placeId });
  } catch (err) {
    console.warn("[maps] place lookup failed", err);
    return null;
  }
}

/** Shared geocode/reverse-geocode entry point. */
export async function geocode(
  request: google.maps.GeocoderRequest,
): Promise<ResolvedAddress | null> {
  try {
    const g = await loadGoogleMaps();
    const geocoder = new g.maps.Geocoder();
    const { results } = await geocoder.geocode(request);
    const best = results?.[0];
    if (!best) return null;

    return parseAddressComponents(best.address_components, best.formatted_address, {
      lat: best.geometry.location.lat(),
      lng: best.geometry.location.lng(),
    });
  } catch (err) {
    console.warn("[maps] geocode failed", err);
    return null;
  }
}

export const reverseGeocode = (lat: number, lng: number) => geocode({ location: { lat, lng } });

export async function newSessionToken() {
  if (!mapsEnabled()) return undefined;
  try {
    const g = await loadGoogleMaps();
    const places = (await g.maps.importLibrary("places")) as google.maps.PlacesLibrary;
    return new places.AutocompleteSessionToken();
  } catch {
    return undefined;
  }
}
