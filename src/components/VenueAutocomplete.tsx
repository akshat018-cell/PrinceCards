"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ── Nominatim result shape (fields we use) ────────────────────
interface NominatimResult {
  place_id:     number;
  display_name: string;
  address?: {
    road?:            string;
    suburb?:          string;
    city?:            string;
    state_district?:  string;
    state?:           string;
    country?:         string;
  };
}

// Derive a clean two-line label from a Nominatim result
function parseResult(r: NominatimResult): { main: string; sub: string } {
  const parts = r.display_name.split(", ");
  const main  = parts.slice(0, 2).join(", ");
  const sub   = parts.slice(2, 5).join(", ");
  return { main, sub };
}

// ── Shared style tokens ───────────────────────────────────────
const INPUT_BASE: React.CSSProperties = {
  border:          "1.5px solid var(--color-card-border)",
  backgroundColor: "#FCFBF9",
  color:           "#2D2B2A",
  width:           "100%",
  borderRadius:    "0.5rem",
  padding:         "0.625rem 2.25rem 0.625rem 2rem", // left: icon, right: clear btn
  fontSize:        "0.875rem",
  outline:         "none",
  fontFamily:      "inherit",
  transition:      "border-color 0.18s, box-shadow 0.18s",
};

const FOCUS: React.CSSProperties = {
  borderColor: "#D4AF37",
  boxShadow:   "0 0 0 2.5px rgba(212,175,55,0.2)",
};

// ── Component ─────────────────────────────────────────────────
interface VenueAutocompleteProps {
  value:    string;
  onChange: (venue: string) => void;
  eventId:  string;
}

export function VenueAutocomplete({ value, onChange, eventId }: VenueAutocompleteProps) {
  const [inputVal,     setInputVal]     = useState(value);
  const [results,      setResults]      = useState<NominatimResult[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [open,         setOpen]         = useState(false);

  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const abortRef     = useRef<AbortController | null>(null);

  // Sync parent resets (e.g. wizard reset)
  useEffect(() => {
    if (value !== inputVal) setInputVal(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // Debounced Nominatim fetch
  const fetchSuggestions = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      // Cancel previous in-flight request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      try {
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("format",         "json");
        url.searchParams.set("q",              query);
        url.searchParams.set("addressdetails", "1");
        url.searchParams.set("countrycodes",   "in");
        url.searchParams.set("limit",          "6");

        const res = await fetch(url.toString(), {
          signal:  abortRef.current.signal,
          headers: {
            // Nominatim requires a meaningful User-Agent per their usage policy
            "Accept-Language": "en",
          },
        });
        if (!res.ok) throw new Error("Nominatim error");
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setResults([]);
          setOpen(false);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handleChange = (val: string) => {
    setInputVal(val);
    onChange(val); // always keep parent in sync with typed text (manual fallback)
    fetchSuggestions(val);
  };

  const handleSelect = (r: NominatimResult) => {
    const { main } = parseResult(r);
    // Use the full display_name for maximum detail in the PDF / AI prompt
    setInputVal(r.display_name);
    onChange(r.display_name);
    setResults([]);
    setOpen(false);
  };

  const handleClear = () => {
    setInputVal("");
    onChange("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative" id={`venue-wrap-${eventId}`}>

      {/* ── Input ─────────────────────────────────────────── */}
      <div className="relative">

        {/* Map-pin icon */}
        <span
          className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
            fill="none" stroke="#D4AF37" strokeWidth="2.5"
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
          spellCheck={false}
          value={inputVal}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Type or search a venue, hall, or address…"
          style={INPUT_BASE}
          onFocus={(e) => Object.assign(e.currentTarget.style, FOCUS)}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--color-card-border)";
            e.currentTarget.style.boxShadow   = "none";
          }}
          aria-label="Venue"
          aria-autocomplete="list"
          aria-controls={open ? `venue-list-${eventId}` : undefined}
          aria-expanded={open}
        />

        {/* Loading spinner or clear button */}
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
          {loading ? (
            <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg"
              width="12" height="12" viewBox="0 0 24 24"
              fill="none" stroke="#D4AF37" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : inputVal ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear venue"
              className="flex items-center justify-center rounded-full transition-colors duration-150"
              style={{ color: "var(--color-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#2D2B2A")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-muted)")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="3"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </span>
      </div>

      {/* ── Dropdown ──────────────────────────────────────── */}
      {open && results.length > 0 && (
        <div
          id={`venue-list-${eventId}`}
          role="listbox"
          className="absolute left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-50"
          style={{
            backgroundColor: "#FCFBF9",
            border:          "1px solid var(--color-card-border)",
            boxShadow:       "0 10px 36px rgba(45,43,42,0.14)",
          }}
        >
          {results.map((r) => {
            const { main, sub } = parseResult(r);
            return (
              <button
                key={r.place_id}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => handleSelect(r)}
                className="w-full text-left px-3.5 py-2.5 flex items-start gap-2.5 transition-colors duration-100"
                style={{ color: "#2D2B2A" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(212,175,55,0.09)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {/* Gold location dot */}
                <span className="flex-shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
                    fill="none" stroke="#D4AF37" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>

                <span className="min-w-0">
                  <span className="block text-xs font-semibold truncate" style={{ color: "#2D2B2A" }}>
                    {main}
                  </span>
                  {sub && (
                    <span className="block text-[10px] truncate mt-0.5" style={{ color: "var(--color-muted)" }}>
                      {sub}
                    </span>
                  )}
                </span>
              </button>
            );
          })}

          {/* Footer attribution — required by Nominatim usage policy */}
          <div
            className="flex items-center gap-1.5 justify-end px-3.5 py-1.5 border-t"
            style={{ borderColor: "var(--color-card-border)", backgroundColor: "rgba(212,175,55,0.04)" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24"
              fill="none" stroke="var(--color-muted)" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="text-[9px] tracking-wide uppercase" style={{ color: "var(--color-muted)" }}>
              © OpenStreetMap contributors
            </span>
          </div>
        </div>
      )}

      {/* Manual-fallback hint — shows only when user has text but no dropdown is open */}
      {!open && inputVal && results.length === 0 && !loading && (
        <p className="mt-1 text-[10px]" style={{ color: "var(--color-muted)" }}>
          ✓ Custom venue saved — no selection required.
        </p>
      )}
    </div>
  );
}
