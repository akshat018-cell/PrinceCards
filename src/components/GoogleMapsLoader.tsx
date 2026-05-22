"use client";

import { useLoadScript } from "@react-google-maps/api";
import type { ReactNode } from "react";

const LIBRARIES: ("places")[] = ["places"];

/**
 * Loads the Google Maps JS SDK (with the Places library) once at the root
 * of the component subtree that needs Places Autocomplete.
 * Children render only after the script is ready.
 */
export function GoogleMapsLoader({ children }: { children: ReactNode }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ?? "",
    libraries: LIBRARIES,
  });

  if (loadError) {
    // Non-fatal: render children anyway; VenueAutocomplete will show "Loading Maps…"
    console.warn("[GoogleMapsLoader] Failed to load Google Maps:", loadError);
    return <>{children}</>;
  }

  if (!isLoaded) {
    return (
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-lg text-xs"
        style={{ color: "var(--color-muted)", backgroundColor: "var(--color-tag-bg)" }}
      >
        <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="12" height="12"
          viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        Loading Maps…
      </div>
    );
  }

  return <>{children}</>;
}
