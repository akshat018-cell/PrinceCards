"use client";

import { useRef, useEffect } from "react";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";

// ── Royal Minimalist shared input styles ──────────────────────
const BASE_INPUT_STYLE: React.CSSProperties = {
  border:          "1.5px solid var(--color-card-border)",
  backgroundColor: "var(--color-tag-bg)",
  color:           "var(--color-text)",
  width:           "100%",
  borderRadius:    "0.5rem",
  padding:         "0.625rem 2.5rem 0.625rem 0.75rem",  // right padding for clear button
  fontSize:        "0.875rem",
  outline:         "none",
  transition:      "border-color 0.2s, box-shadow 0.2s",
};

const FOCUS_STYLE: React.CSSProperties = {
  borderColor: "var(--color-accent)",
  boxShadow:   "0 0 0 2.5px rgba(212,175,55,0.18)",
};

interface VenueAutocompleteProps {
  value:    string;
  onChange: (venue: string) => void;
  eventId:  string; // used for unique input id
}

export function VenueAutocomplete({ value, onChange, eventId }: VenueAutocompleteProps) {
  const {
    ready,
    value:  inputVal,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      // Bias towards Indian venues
      componentRestrictions: { country: "in" },
      types: ["establishment", "geocode"],
    },
    debounce: 280,
    defaultValue: value,
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  // Sync external value changes (e.g. reset) back into the hook
  useEffect(() => {
    if (value !== inputVal) setValue(value, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
          && inputRef.current && !inputRef.current.contains(e.target as Node)) {
        clearSuggestions();
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [clearSuggestions]);

  const handleSelect = async (description: string) => {
    setValue(description, false);
    onChange(description);
    clearSuggestions();
    // Optionally geocode (for future map features — no blocking call required)
    try {
      const results = await getGeocode({ address: description });
      await getLatLng(results[0]); // available if needed later
    } catch { /* non-fatal */ }
  };

  const handleClear = () => {
    setValue("", false);
    onChange("");
    clearSuggestions();
    inputRef.current?.focus();
  };

  const hasSuggestions = status === "OK" && data.length > 0;

  return (
    <div className="relative" id={`venue-wrap-${eventId}`}>
      {/* Input */}
      <div className="relative">
        {/* Map pin icon */}
        <span
          className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
            fill="none" stroke="var(--color-accent)" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </span>

        <input
          ref={inputRef}
          id={`venue-input-${eventId}`}
          type="text"
          autoComplete="off"
          disabled={!ready}
          value={inputVal}
          onChange={(e) => {
            setValue(e.target.value);
            if (!e.target.value) onChange("");
          }}
          placeholder={ready ? "Search venue, hall, or address…" : "Loading Maps…"}
          style={{ ...BASE_INPUT_STYLE, paddingLeft: "2rem" }}
          onFocus={(e) => Object.assign(e.currentTarget.style, FOCUS_STYLE)}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--color-card-border)";
            e.currentTarget.style.boxShadow   = "none";
          }}
          aria-label="Venue"
          aria-autocomplete="list"
          aria-controls={hasSuggestions ? `venue-list-${eventId}` : undefined}
          aria-expanded={hasSuggestions}
        />

        {/* Clear button — only when there's text */}
        {inputVal && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear venue"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-colors duration-150"
            style={{ color: "var(--color-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-muted)")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {hasSuggestions && (
        <div
          ref={dropdownRef}
          id={`venue-list-${eventId}`}
          role="listbox"
          className="absolute left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-50"
          style={{
            backgroundColor: "var(--color-white)",
            border:          "1px solid var(--color-card-border)",
            boxShadow:       "0 8px 32px rgba(45,43,42,0.14)",
          }}
        >
          {data.map(({ place_id, description, structured_formatting }) => (
            <button
              key={place_id}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => handleSelect(description)}
              className="w-full text-left px-3.5 py-2.5 flex items-start gap-2.5 transition-colors duration-100"
              style={{ color: "var(--color-text)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(212,175,55,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              {/* Gold location dot */}
              <span className="flex-shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
                  fill="none" stroke="var(--color-accent)" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>

              <span className="min-w-0">
                <span className="block text-xs font-semibold truncate" style={{ color: "var(--color-text)" }}>
                  {structured_formatting.main_text}
                </span>
                <span className="block text-[10px] truncate mt-0.5" style={{ color: "var(--color-muted)" }}>
                  {structured_formatting.secondary_text}
                </span>
              </span>
            </button>
          ))}

          {/* Powered by Google badge */}
          <div className="flex items-center justify-end px-3 py-1.5 border-t"
            style={{ borderColor: "var(--color-card-border)", backgroundColor: "var(--color-tag-bg)" }}>
            <span className="text-[9px] tracking-wide uppercase" style={{ color: "var(--color-muted)" }}>
              Powered by Google
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
