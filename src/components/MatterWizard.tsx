"use client";

import { useState, useEffect } from "react";
import { useMatter } from "@/context/MatterContext";
import type {
  EventName, VibeType, Relationship, PagePlacement,
  EventDetail, FamilyMember, SavedMatter,
} from "@/context/MatterContext";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const ALL_EVENTS: EventName[] = ["Haldi", "Mehendi", "Sangeet", "Wedding", "Reception"];

const EVENT_ICONS: Record<EventName, string> = {
  Haldi:     "🌼",
  Mehendi:   "🌿",
  Sangeet:   "🎵",
  Wedding:   "💍",
  Reception: "🥂",
};

const VIBE_OPTIONS: { value: VibeType; icon: string; desc: string }[] = [
  { value: "Traditional", icon: "🪔", desc: "Classic Sanskrit blessings & timeless phrases" },
  { value: "Royal",       icon: "👑", desc: "Regal, palatial language befitting royalty" },
  { value: "Modern",      icon: "✨", desc: "Contemporary, clean & chic wording" },
  { value: "Quirky",      icon: "🎉", desc: "Fun, playful & uniquely personal tone" },
];

const RELATIONSHIPS: Relationship[] = ["Grandparent", "Parent", "Sibling", "Uncle/Aunt"];
const PLACEMENTS:    PagePlacement[] = ["Cover Page", "Event Pages", "Last Page"];

const VIBE_INTRO: Record<VibeType, string> = {
  Traditional: "श्री गणेशाय नमः\nWith the blessings of the Almighty and our elders, we joyfully invite you to grace the auspicious union of our beloved children.",
  Royal:       "With great honour and immense pride, the families of the Bride and Groom request the pleasure of your distinguished company to witness and bless this royal union.",
  Modern:      "Two hearts, one beautiful journey. We're getting married and we'd love for you to be there!",
  Quirky:      "Plot twist: they actually liked each other! Come celebrate the chaos, the laughter, and the love. 🎊",
};

function generateUid() {
  return Math.random().toString(36).slice(2, 10);
}

// ─────────────────────────────────────────────────────────────
// Date / Time formatting utilities
// ─────────────────────────────────────────────────────────────
const ORDINAL = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
};

/**
 * Converts '2026-02-12' → 'February 12th, 2026'.
 * Returns the original string unchanged if it isn't a valid ISO date.
 */
export function formatDate(raw: string): string {
  if (!raw) return raw;
  const [y, m, d] = raw.split("-").map(Number);
  if (!y || !m || !d) return raw;
  const dt = new Date(y, m - 1, d);
  if (isNaN(dt.getTime())) return raw;
  const month = dt.toLocaleString("en-IN", { month: "long" });
  return `${month} ${ORDINAL(d)}, ${y}`;
}

/**
 * Converts '19:00' → '7:00 PM', '08:30' → '8:30 AM'.
 * If the string already contains 'AM' or 'PM' (from custom picker), returns it unchanged.
 */
export function formatTime(raw: string): string {
  if (!raw) return raw;
  // Already a 12-h string from the custom picker — pass through unchanged
  if (/AM|PM/i.test(raw)) return raw.trim();
  const [hStr, mStr] = raw.split(":");
  const h = parseInt(hStr, 10);
  const min = parseInt(mStr ?? "0", 10);
  if (isNaN(h) || isNaN(min)) return raw;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(min).padStart(2, "0")} ${period}`;
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-3 my-4" aria-hidden="true">
      <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, var(--color-accent))" }} />
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="var(--color-accent)">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, var(--color-accent), transparent)" }} />
    </div>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={i} className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded-full text-xs font-bold transition-all duration-300"
              style={{
                width: 32, height: 32,
                background: active
                  ? "linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))"
                  : done
                    ? "var(--color-tag-bg)"
                    : "var(--color-tag-bg)",
                color: active ? "white" : done ? "var(--color-accent-dark)" : "var(--color-muted)",
                border: active ? "none" : `1.5px solid ${done ? "var(--color-accent)" : "var(--color-card-border)"}`,
                boxShadow: active ? "0 4px 12px rgba(212,175,55,0.4)" : "none",
              }}
            >
              {done ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="var(--color-accent-dark)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : step}
            </div>
            {i < total - 1 && (
              <div className="h-px w-8 transition-all duration-300"
                style={{ background: done ? "var(--color-accent)" : "var(--color-card-border)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// 5 steps: Events, Details, Vibe, Family, Review
const STEP_LABELS = ["Events", "Details", "Vibe", "Family", "Review"];
const TOTAL_STEPS = 5;

// ─────────────────────────────────────────────────────────────
// Step 1 — Event selection
// ─────────────────────────────────────────────────────────────
function Step1Events({
  selected, onChange,
}: { selected: EventName[]; onChange: (v: EventName[]) => void }) {
  const toggle = (ev: EventName) =>
    onChange(selected.includes(ev) ? selected.filter((e) => e !== ev) : [...selected, ev]);
  return (
    <div>
      <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
        Which events are you hosting?
      </h3>
      <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
        Select all the ceremonies that will be part of your celebration.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ALL_EVENTS.map((ev) => {
          const checked = selected.includes(ev);
          return (
            <button
              key={ev}
              type="button"
              onClick={() => toggle(ev)}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200"
              style={{
                border: `2px solid ${checked ? "var(--color-accent)" : "var(--color-card-border)"}`,
                backgroundColor: checked ? "rgba(212,175,55,0.07)" : "var(--color-white)",
                boxShadow: checked ? "0 4px 14px rgba(212,175,55,0.2)" : "none",
              }}
            >
              <span className="text-2xl">{EVENT_ICONS[ev]}</span>
              <span className="font-semibold text-sm" style={{ color: checked ? "var(--color-accent-dark)" : "var(--color-text)" }}>
                {ev}
              </span>
              <div className="ml-auto flex items-center justify-center rounded-full transition-all duration-200"
                style={{
                  width: 20, height: 20,
                  border: `2px solid ${checked ? "var(--color-accent)" : "var(--color-card-border)"}`,
                  backgroundColor: checked ? "var(--color-accent)" : "transparent",
                }}>
                {checked && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step 2 — Event details (date / custom-time / venue)
// ─────────────────────────────────────────────────────────────

/** Shared field label */
function FieldLabel({ children }: { children: string }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
      style={{ color: "var(--color-muted)" }}>
      {children}
    </label>
  );
}

/** Shared inline style for <select> and plain text <input> */
const FIELD_BASE: React.CSSProperties = {
  border:          "1.5px solid var(--color-card-border)",
  backgroundColor: "#FCFBF9",
  color:           "#2D2B2A",
  fontFamily:      "inherit",
  fontSize:        "0.875rem",
  outline:         "none",
  borderRadius:    "0.5rem",
  transition:      "border-color 0.18s, box-shadow 0.18s",
};

const FOCUS_ON  = (e: React.FocusEvent<HTMLElement>) => {
  (e.currentTarget as HTMLElement).style.borderColor = "#D4AF37";
  (e.currentTarget as HTMLElement).style.boxShadow   = "0 0 0 2.5px rgba(212,175,55,0.2)";
};
const FOCUS_OFF = (e: React.FocusEvent<HTMLElement>) => {
  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-card-border)";
  (e.currentTarget as HTMLElement).style.boxShadow   = "none";
};

/** Native date picker — light-mode panel, Champagne Gold accent */
function DatePicker({ value, onChange, id }: {
  value: string; onChange: (v: string) => void; id: string;
}) {
  return (
    <input
      id={id}
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none appearance-none accent-[#D4AF37]"
      style={{ ...FIELD_BASE, colorScheme: "light", color: value ? "#2D2B2A" : "var(--color-muted)" }}
      onFocus={FOCUS_ON}
      onBlur={FOCUS_OFF}
    />
  );
}

const HOURS   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

/** Custom 12-hour time picker — three gold-accented select dropdowns */
function CustomTimePicker({ value, onChange, id }: {
  value: string; onChange: (v: string) => void; id: string;
}) {
  // Parse stored value ('07:30 PM') back into parts on mount / external reset
  const parse = (v: string) => {
    const m = v?.match(/^(\d{2}):(\d{2})\s?(AM|PM)$/i);
    return m
      ? { h: m[1], min: m[2], period: m[3].toUpperCase() as "AM" | "PM" }
      : { h: "", min: "00", period: "AM" as const };
  };

  const init = parse(value);
  const [h,      setH]      = useState(init.h);
  const [min,    setMin]    = useState(init.min);
  const [period, setPeriod] = useState<"AM" | "PM">(init.period);

  // Sync when parent resets the wizard
  useEffect(() => {
    const p = parse(value);
    setH(p.h); setMin(p.min); setPeriod(p.period);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emit = (newH: string, newMin: string, newPeriod: string) => {
    if (!newH) { onChange(""); return; }
    onChange(`${newH}:${newMin} ${newPeriod}`);
  };

  const SELECT_STYLE: React.CSSProperties = {
    ...FIELD_BASE,
    padding:       "0.625rem 0.5rem",
    cursor:        "pointer",
    appearance:    "none" as const,
    textAlign:     "center" as const,
    backgroundImage: "none",
  };

  return (
    <div id={id} className="flex items-center gap-1.5">
      {/* Hours */}
      <select
        value={h}
        onChange={(e) => { setH(e.target.value); emit(e.target.value, min, period); }}
        className="flex-1 rounded-lg text-sm outline-none"
        style={SELECT_STYLE}
        onFocus={FOCUS_ON}
        onBlur={FOCUS_OFF}
        aria-label="Hour"
      >
        <option value="">HH</option>
        {HOURS.map((hr) => <option key={hr} value={hr}>{hr}</option>)}
      </select>

      {/* Colon separator */}
      <span className="font-bold text-sm select-none" style={{ color: "#D4AF37" }}>:</span>

      {/* Minutes */}
      <select
        value={min}
        onChange={(e) => { setMin(e.target.value); emit(h, e.target.value, period); }}
        className="flex-1 rounded-lg text-sm outline-none"
        style={SELECT_STYLE}
        onFocus={FOCUS_ON}
        onBlur={FOCUS_OFF}
        aria-label="Minute"
      >
        {MINUTES.map((mn) => <option key={mn} value={mn}>{mn}</option>)}
      </select>

      {/* AM / PM */}
      <select
        value={period}
        onChange={(e) => { const p = e.target.value as "AM" | "PM"; setPeriod(p); emit(h, min, p); }}
        className="flex-1 rounded-lg text-sm outline-none"
        style={SELECT_STYLE}
        onFocus={FOCUS_ON}
        onBlur={FOCUS_OFF}
        aria-label="Period"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

function Step2Details({
  events, details, onChange,
}: {
  events:   EventName[];
  details:  Record<EventName, EventDetail>;
  onChange: (ev: EventName, field: keyof EventDetail, val: string) => void;
}) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
        Event Details
      </h3>
      <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
        Add the date, time, and venue for each ceremony — all fields are optional.
      </p>

      <div className="space-y-5">
        {events.map((ev) => (
          <div key={ev} className="rounded-xl p-4"
            style={{ border: "1px solid var(--color-card-border)", backgroundColor: "var(--color-white)" }}>

            {/* Event header */}
            <p className="text-sm font-bold mb-4 flex items-center gap-2"
              style={{ color: "var(--color-accent-dark)" }}>
              <span>{EVENT_ICONS[ev]}</span> {ev}
            </p>

            {/* Date */}
            <div className="mb-3">
              <FieldLabel>Date</FieldLabel>
              <DatePicker
                id={`date-${ev}`}
                value={details[ev].date}
                onChange={(v) => onChange(ev, "date", v)}
              />
            </div>

            {/* Custom 12-h Time picker */}
            <div className="mb-3">
              <FieldLabel>Time</FieldLabel>
              <CustomTimePicker
                id={`time-${ev}`}
                value={details[ev].time}
                onChange={(v) => onChange(ev, "time", v)}
              />
            </div>

            {/* Venue — plain styled text input */}
            <div>
              <FieldLabel>Venue</FieldLabel>
              <input
                type="text"
                id={`venue-${ev}`}
                value={details[ev].venue}
                onChange={(e) => onChange(ev, "venue", e.target.value)}
                placeholder="e.g. The Leela Palace, New Delhi"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={FIELD_BASE}
                onFocus={FOCUS_ON}
                onBlur={FOCUS_OFF}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step 3 — The Vibe
// ─────────────────────────────────────────────────────────────
function Step3Vibe({ vibe, onChange }: { vibe: VibeType | null; onChange: (v: VibeType) => void }) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
        Choose Your Vibe
      </h3>
      <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
        This sets the tone of the wording generated for your invitation.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {VIBE_OPTIONS.map(({ value, icon, desc }) => {
          const active = vibe === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              className="p-4 rounded-xl text-left transition-all duration-200"
              style={{
                border: `2px solid ${active ? "var(--color-accent)" : "var(--color-card-border)"}`,
                backgroundColor: active ? "rgba(212,175,55,0.07)" : "var(--color-white)",
                boxShadow: active ? "0 4px 14px rgba(212,175,55,0.2)" : "none",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{icon}</span>
                {active && (
                  <div className="flex items-center justify-center rounded-full"
                    style={{ width: 20, height: 20, backgroundColor: "var(--color-accent)" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none"
                      stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="font-bold text-sm mb-0.5" style={{ color: active ? "var(--color-accent-dark)" : "var(--color-text)" }}>
                {value}
              </p>
              <p className="text-xs leading-snug" style={{ color: "var(--color-muted)" }}>{desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step 4 — Family Engine
// ─────────────────────────────────────────────────────────────
function FamilyColumn({
  title, members, onAdd, onUpdate, onRemove,
}: {
  title:    string;
  members:  FamilyMember[];
  onAdd:    () => void;
  onUpdate: (id: string, field: keyof Omit<FamilyMember, "id">, val: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
        style={{ color: "var(--color-accent-dark)" }}>
        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-accent)" }} />
        {title}
      </p>
      <div className="space-y-3 mb-3">
        {members.map((m) => (
          <div key={m.id} className="rounded-xl p-3 relative"
            style={{ border: "1px solid var(--color-card-border)", backgroundColor: "var(--color-white)" }}>
            <button
              type="button"
              onClick={() => onRemove(m.id)}
              className="absolute top-2 right-2 rounded-full flex items-center justify-center transition-colors duration-150"
              style={{ width: 20, height: 20, color: "var(--color-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#e53e3e")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-muted)")}
              aria-label="Remove member"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <div className="space-y-2 pr-6">
              <input
                type="text"
                placeholder="Name (e.g. Ramesh Kumar)"
                value={m.name}
                onChange={(e) => onUpdate(m.id, "name", e.target.value)}
                className="w-full rounded-lg px-2.5 py-2 text-sm outline-none transition-all duration-200"
                style={{ border: "1.5px solid var(--color-card-border)", backgroundColor: "var(--color-tag-bg)", color: "var(--color-text)" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-card-border)")}
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={m.relationship}
                  onChange={(e) => onUpdate(m.id, "relationship", e.target.value)}
                  className="w-full rounded-lg px-2.5 py-2 text-xs outline-none transition-all duration-200 appearance-none cursor-pointer"
                  style={{ border: "1.5px solid var(--color-card-border)", backgroundColor: "var(--color-tag-bg)", color: "var(--color-text)" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-card-border)")}
                >
                  {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <select
                  value={m.placement}
                  onChange={(e) => onUpdate(m.id, "placement", e.target.value)}
                  className="w-full rounded-lg px-2.5 py-2 text-xs outline-none transition-all duration-200 appearance-none cursor-pointer"
                  style={{ border: "1.5px solid var(--color-card-border)", backgroundColor: "var(--color-tag-bg)", color: "var(--color-text)" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-card-border)")}
                >
                  {PLACEMENTS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200"
        style={{ border: "1.5px dashed var(--color-accent)", color: "var(--color-accent-dark)", backgroundColor: "rgba(212,175,55,0.04)" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(212,175,55,0.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(212,175,55,0.04)")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Person
      </button>
    </div>
  );
}

function Step4Family({
  brideName, groomName,
  onBrideNameChange, onGroomNameChange,
  brideFamily, groomFamily,
  onBrideAdd, onBrideUpdate, onBrideRemove,
  onGroomAdd, onGroomUpdate, onGroomRemove,
}: {
  brideName:          string;
  groomName:          string;
  onBrideNameChange:  (v: string) => void;
  onGroomNameChange:  (v: string) => void;
  brideFamily:        FamilyMember[];
  groomFamily:        FamilyMember[];
  onBrideAdd:         () => void;
  onBrideUpdate:      (id: string, field: keyof Omit<FamilyMember, "id">, val: string) => void;
  onBrideRemove:      (id: string) => void;
  onGroomAdd:         () => void;
  onGroomUpdate:      (id: string, field: keyof Omit<FamilyMember, "id">, val: string) => void;
  onGroomRemove:      (id: string) => void;
}) {
  /** Shared inline-focus handler for couple name inputs */
  const goldFocus   = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "#D4AF37";
    e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(212,175,55,0.18)";
  };
  const goldBlur    = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "var(--color-card-border)";
    e.currentTarget.style.boxShadow   = "none";
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
        The Couple &amp; Family
      </h3>
      <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
        Enter the couple&apos;s names and add family members from both sides.
      </p>

      {/* ── The Couple ─────────────────────────────── */}
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-accent-dark)" }}>
        <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: "var(--color-accent)" }} />
        The Couple
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
            style={{ color: "var(--color-muted)" }}>Bride&apos;s Full Name</label>
          <input
            type="text"
            placeholder="e.g. Priya Sharma"
            value={brideName}
            onChange={(e) => onBrideNameChange(e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all duration-200"
            style={{
              border:          "1.5px solid var(--color-card-border)",
              backgroundColor: "#FCFBF9",
              color:           "#2D2B2A",
              fontFamily:      "inherit",
            }}
            onFocus={goldFocus}
            onBlur={goldBlur}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
            style={{ color: "var(--color-muted)" }}>Groom&apos;s Full Name</label>
          <input
            type="text"
            placeholder="e.g. Rahul Mehta"
            value={groomName}
            onChange={(e) => onGroomNameChange(e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all duration-200"
            style={{
              border:          "1.5px solid var(--color-card-border)",
              backgroundColor: "#FCFBF9",
              color:           "#2D2B2A",
              fontFamily:      "inherit",
            }}
            onFocus={goldFocus}
            onBlur={goldBlur}
          />
        </div>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid var(--color-card-border)", marginBottom: "1.5rem" }} />

      {/* ── Family Members ─────────────────────────── */}
      <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--color-accent-dark)" }}>
        <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: "var(--color-accent)" }} />
        Family Members
      </p>
      <div className="flex flex-col sm:flex-row gap-5">
        <FamilyColumn title="Bride's Side" members={brideFamily}
          onAdd={onBrideAdd} onUpdate={onBrideUpdate} onRemove={onBrideRemove} />
        <div className="hidden sm:block w-px self-stretch" style={{ backgroundColor: "var(--color-card-border)" }} />
        <FamilyColumn title="Groom's Side" members={groomFamily}
          onAdd={onGroomAdd} onUpdate={onGroomUpdate} onRemove={onGroomRemove} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Review Board
// ─────────────────────────────────────────────────────────────
function ReviewBoard({
  events, eventDetails, vibe, brideFamily, groomFamily, onEdit, onGenerate, isGenerating, generatingStage,
}: {
  events:          EventName[];
  eventDetails:    Record<EventName, EventDetail>;
  vibe:            VibeType;
  brideFamily:     FamilyMember[];
  groomFamily:     FamilyMember[];
  onEdit:          (step: number) => void;
  onGenerate:      () => void;
  isGenerating:    boolean;
  generatingStage: null | "ai" | "pdf";
}) {
  const Section = ({ title, onEditClick, children }: { title: string; onEditClick: () => void; children: React.ReactNode }) => (
    <div className="rounded-xl p-4 mb-4" style={{ border: "1px solid var(--color-card-border)", backgroundColor: "var(--color-white)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-accent-dark)" }}>{title}</p>
        <button
          type="button"
          onClick={onEditClick}
          className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all duration-150"
          style={{ color: "var(--color-accent-dark)", border: "1px solid var(--color-accent)", backgroundColor: "transparent" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(212,175,55,0.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          ✏️ Edit
        </button>
      </div>
      {children}
    </div>
  );

  return (
    <div>
      <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
        Review Your Details
      </h3>
      <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
        Everything looks good? Hit Generate to create your multi-page PDF.
      </p>

      {/* Events */}
      <Section title="Selected Events" onEditClick={() => onEdit(1)}>
        <div className="flex flex-wrap gap-2">
          {events.map((ev) => (
            <span key={ev} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "rgba(212,175,55,0.1)", color: "var(--color-accent-dark)", border: "1px solid rgba(212,175,55,0.3)" }}>
              {EVENT_ICONS[ev]} {ev}
            </span>
          ))}
        </div>
      </Section>

      {/* Event Details */}
      <Section title="Event Details" onEditClick={() => onEdit(2)}>
        <div className="space-y-3">
          {events.map((ev) => (
            <div key={ev}>
              <p className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: "var(--color-text)" }}>
                {EVENT_ICONS[ev]} {ev}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(["date", "time", "venue"] as (keyof EventDetail)[]).map((f) => (
                  <div key={f} className="rounded-lg p-2" style={{ backgroundColor: "var(--color-tag-bg)" }}>
                    <p className="text-xs mb-0.5 capitalize" style={{ color: "var(--color-muted)" }}>{f}</p>
                    <p className="text-xs font-semibold truncate" style={{ color: "var(--color-text)" }}>
                      {eventDetails[ev][f] || <span style={{ color: "var(--color-muted)", fontStyle: "italic" }}>Not set</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Vibe */}
      <Section title="Invitation Vibe" onEditClick={() => onEdit(3)}>
        <p className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--color-text)" }}>
          {VIBE_OPTIONS.find((v) => v.value === vibe)?.icon} {vibe}
        </p>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--color-muted)" }}>
          {VIBE_OPTIONS.find((v) => v.value === vibe)?.desc}
        </p>
      </Section>

      {/* Family */}
      <Section title="Family Members" onEditClick={() => onEdit(4)}>
        <div className="grid grid-cols-2 gap-4">
          {[{ label: "Bride's Side", list: brideFamily }, { label: "Groom's Side", list: groomFamily }].map(({ label, list }) => (
            <div key={label}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--color-accent-dark)" }}>{label}</p>
              {list.length === 0
                ? <p className="text-xs italic" style={{ color: "var(--color-muted)" }}>No members added</p>
                : list.map((m) => (
                  <div key={m.id} className="mb-1.5">
                    <p className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>{m.name || "Unnamed"}</p>
                    <p className="text-[10px]" style={{ color: "var(--color-muted)" }}>{m.relationship} · {m.placement}</p>
                  </div>
                ))
              }
            </div>
          ))}
        </div>
      </Section>

      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating}
        id="review-generate-btn"
        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-semibold tracking-wide text-sm transition-all duration-200 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-wait disabled:hover:scale-100 mt-2"
        style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))", color: "white", boxShadow: "0 6px 20px rgba(212,175,55,0.35)" }}
        onMouseEnter={(e) => { if (!isGenerating) e.currentTarget.style.boxShadow = "0 8px 28px rgba(212,175,55,0.5)"; }}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 6px 20px rgba(212,175,55,0.35)")}
      >
        {generatingStage === "ai" ? (
          <>
            <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            ✨ Crafting Your Wording…
          </>
        ) : generatingStage === "pdf" ? (
          <>
            <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            📄 Building Your PDF…
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Generate &amp; Save Matter PDF
          </>
        )}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Completed State (after PDF download)
// ─────────────────────────────────────────────────────────────
function CompletedState({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center py-10">
      <div className="inline-flex items-center justify-center rounded-full mb-5"
        style={{ width: 72, height: 72, background: "linear-gradient(135deg, #D4AF37, #B8961E)", boxShadow: "0 8px 24px rgba(212,175,55,0.4)" }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
        Your Matter PDF is Ready! 🎉
      </h3>
      <p className="text-sm max-w-xs mx-auto mb-6" style={{ color: "var(--color-muted)" }}>
        Share the downloaded PDF with us on WhatsApp when placing your order for a wedding card.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
        style={{ border: "1.5px solid var(--color-accent)", color: "var(--color-accent-dark)", backgroundColor: "transparent" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(212,175,55,0.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        Start Over
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PDF Generation — English only, default helvetica font
// ─────────────────────────────────────────────────────────────
async function generateMultiPagePDF(
  matter: SavedMatter,
  markDownloaded: () => void,
  aiWording?: string,
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W = 210, H = 297;
  const GOLD    = [212, 175, 55]  as [number, number, number];
  const GOLD_D  = [184, 150, 30]  as [number, number, number];
  const ESPRESSO = [45, 43, 42]   as [number, number, number];
  const MUTED   = [138, 127, 116] as [number, number, number];
  const BG      = [252, 251, 249] as [number, number, number];

  const bride = matter.bride || "The Bride";
  const groom = matter.groom || "The Groom";

  // ── Helper functions ──────────────────────────────────────
  function setColor(rgb: [number, number, number]) { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }
  function setFill(rgb:  [number, number, number]) { doc.setFillColor(rgb[0], rgb[1], rgb[2]); }
  function setDraw(rgb:  [number, number, number]) { doc.setDrawColor(rgb[0], rgb[1], rgb[2]); }

  function drawGoldBar(y: number, full = false) {
    const bar = (x: number, w: number, c: [number, number, number]) => {
      setFill(c); doc.rect(x, y, w, full ? 3 : 1.5, "F");
    };
    if (full) { bar(0, W, GOLD_D); bar(0, W / 2, GOLD); }
    else { bar(20, W - 40, GOLD_D); bar(20, (W - 40) / 2, GOLD); }
  }

  function drawStar(cx: number, cy: number, size = 4) {
    setColor(GOLD);
    doc.setFontSize(size * 2.5);
    doc.text("✦", cx, cy, { align: "center" });
  }

  function centeredText(text: string, y: number, size: number, rgb: [number, number, number], style: "normal" | "bold" | "italic" = "normal") {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    setColor(rgb);
    doc.text(text, W / 2, y, { align: "center" });
  }

  function ornamentalDivider(y: number) {
    setDraw(GOLD);
    doc.setLineWidth(0.3);
    doc.line(40, y, W / 2 - 8, y);
    doc.line(W / 2 + 8, y, W - 40, y);
    drawStar(W / 2, y + 0.8, 3);
  }

  function bgPage() {
    setFill(BG);
    doc.rect(0, 0, W, H, "F");
  }

  function borderFrame() {
    setDraw(GOLD);
    doc.setLineWidth(0.5);
    doc.rect(6, 6, W - 12, H - 12);
    doc.setLineWidth(0.2);
    doc.rect(8, 8, W - 16, H - 16);
  }

  // ── PAGE 1: Cover ──────────────────────────────────────────
  bgPage(); borderFrame();
  drawGoldBar(12, true);
  drawGoldBar(H - 15, true);

  // PrinceCards header
  centeredText("PRINCECARDS", 30, 8, GOLD_D, "bold");
  centeredText("Est. 2020 · Premium Wedding Stationery", 36, 6, MUTED);
  ornamentalDivider(40);

  // Intro wording — from Gemini or fallback
  const coverWording = aiWording || VIBE_INTRO[matter.vibe] ||
    "With joyful hearts and the blessings of our families, we invite you to celebrate this beautiful union.";
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  setColor(ESPRESSO);
  const introLines = doc.splitTextToSize(coverWording, W - 60);
  let introY = 52;
  introLines.forEach((line: string) => {
    doc.text(line, W / 2, introY, { align: "center" });
    introY += 5.5;
  });
  introY += 4;
  ornamentalDivider(introY);

  // Bride & Groom names
  centeredText(bride, introY + 14, 22, ESPRESSO, "bold");
  centeredText("&", introY + 24, 14, GOLD);
  centeredText(groom, introY + 34, 22, ESPRESSO, "bold");
  ornamentalDivider(introY + 40);

  // Family names for Cover Page
  let famY = introY + 50;
  const coverBrideList = matter.brideFamily.filter((m) => m.placement === "Cover Page");
  const coverGroomList = matter.groomFamily.filter((m) => m.placement === "Cover Page");

  if (coverBrideList.length > 0 || coverGroomList.length > 0) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    setColor(GOLD_D);
    doc.text("WITH THE BLESSINGS OF", W / 2, famY, { align: "center" });
    famY += 6;

    // Two-column layout
    const leftX = 40, rightX = W / 2 + 5;
    if (coverBrideList.length > 0) {
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); setColor(GOLD_D);
      doc.text("BRIDE'S FAMILY", leftX, famY);
    }
    if (coverGroomList.length > 0) {
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); setColor(GOLD_D);
      doc.text("GROOM'S FAMILY", rightX, famY);
    }
    famY += 5;
    const maxLen = Math.max(coverBrideList.length, coverGroomList.length);
    for (let i = 0; i < maxLen; i++) {
      const bm = coverBrideList[i];
      const gm = coverGroomList[i];
      if (bm) {
        doc.setFontSize(9); doc.setFont("helvetica", "normal"); setColor(ESPRESSO);
        doc.text(bm.name || "—", leftX, famY);
        doc.setFontSize(7); setColor(MUTED);
        doc.text(bm.relationship, leftX, famY + 3.5);
      }
      if (gm) {
        doc.setFontSize(9); doc.setFont("helvetica", "normal"); setColor(ESPRESSO);
        doc.text(gm.name || "—", rightX, famY);
        doc.setFontSize(7); setColor(MUTED);
        doc.text(gm.relationship, rightX, famY + 3.5);
      }
      famY += 9;
    }
    famY += 4;
    ornamentalDivider(famY);
    famY += 8;
  }

  // Events quick list on cover
  centeredText("EVENTS", famY, 7, GOLD_D, "bold");
  famY += 6;
  matter.selectedEvents.forEach((ev) => {
    const d = matter.eventDetails[ev];
    doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); setColor(ESPRESSO);
    doc.text(`${ev}`, W / 2, famY, { align: "center" });
    famY += 4;
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); setColor(MUTED);
    const line = [d.date, d.time, d.venue].filter(Boolean).join("  ·  ");
    if (line) { doc.text(line, W / 2, famY, { align: "center" }); famY += 4; }
    famY += 2;
  });

  // Footer
  centeredText("princecards.in  ·  +91 98260 15250", H - 20, 6, MUTED);
  centeredText("Generated with ❤ by PrinceCards", H - 14, 6, MUTED);

  // ── EVENT PAGES ────────────────────────────────────────────
  const EVENT_WORDING =
    "We request the honour of your presence to witness and bless this sacred ceremony. Your presence and blessings mean the world to us.";

  matter.selectedEvents.forEach((ev, idx) => {
    doc.addPage();
    const d = matter.eventDetails[ev];
    bgPage(); borderFrame();
    drawGoldBar(12, true);
    drawGoldBar(H - 15, true);

    centeredText(`— PAGE ${idx + 2} —`, 26, 6.5, MUTED);
    centeredText(EVENT_ICONS[ev], 46, 22, ESPRESSO);
    centeredText(ev.toUpperCase(), 58, 18, ESPRESSO, "bold");
    ornamentalDivider(63);

    // Event wording
    const wLines = doc.splitTextToSize(EVENT_WORDING, W - 60);
    doc.setFontSize(9); doc.setFont("helvetica", "italic"); setColor(ESPRESSO);
    let wY = 75;
    wLines.forEach((l: string) => { doc.text(l, W / 2, wY, { align: "center" }); wY += 5.5; });
    wY += 6;
    ornamentalDivider(wY); wY += 10;

    // Detail boxes
    const fields = [
      { label: "DATE",  value: d.date  || "TBD" },
      { label: "TIME",  value: d.time  || "TBD" },
      { label: "VENUE", value: d.venue || "TBD" },
    ];
    fields.forEach(({ label, value }) => {
      setFill([245, 240, 232]);
      setDraw(GOLD_D);
      doc.setLineWidth(0.4);
      const boxH = 16;
      doc.roundedRect(30, wY, W - 60, boxH, 2, 2, "FD");
      doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); setColor(GOLD_D);
      doc.text(label, W / 2, wY + 5, { align: "center" });
      doc.setFontSize(10); doc.setFont("helvetica", "normal"); setColor(ESPRESSO);
      const valLines = doc.splitTextToSize(value, W - 80);
      valLines.slice(0, 1).forEach((l: string) => doc.text(l, W / 2, wY + 11.5, { align: "center" }));
      wY += boxH + 5;
    });

    wY += 8;
    ornamentalDivider(wY); wY += 10;

    // Event-page family members
    const epBride = matter.brideFamily.filter((m) => m.placement === "Event Pages");
    const epGroom = matter.groomFamily.filter((m) => m.placement === "Event Pages");
    if (epBride.length > 0 || epGroom.length > 0) {
      centeredText("HOSTED BY", wY, 7, GOLD_D, "bold"); wY += 7;
      const leftX = 40, rightX = W / 2 + 5;
      if (epBride.length > 0) { doc.setFontSize(7); doc.setFont("helvetica", "bold"); setColor(GOLD_D); doc.text("BRIDE'S FAMILY", leftX, wY); }
      if (epGroom.length > 0) { doc.setFontSize(7); doc.setFont("helvetica", "bold"); setColor(GOLD_D); doc.text("GROOM'S FAMILY", rightX, wY); }
      wY += 5;
      const maxL = Math.max(epBride.length, epGroom.length);
      for (let i = 0; i < maxL; i++) {
        const bm = epBride[i], gm = epGroom[i];
        if (bm) { doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); setColor(ESPRESSO); doc.text(bm.name || "—", leftX, wY); doc.setFontSize(7); setColor(MUTED); doc.text(bm.relationship, leftX, wY + 3.5); }
        if (gm) { doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); setColor(ESPRESSO); doc.text(gm.name || "—", rightX, wY); doc.setFontSize(7); setColor(MUTED); doc.text(gm.relationship, rightX, wY + 3.5); }
        wY += 9;
      }
    }

    centeredText("princecards.in  ·  +91 98260 15250", H - 20, 6, MUTED);
  });

  // ── LAST PAGE ──────────────────────────────────────────────
  doc.addPage();
  bgPage(); borderFrame();
  drawGoldBar(12, true);
  drawGoldBar(H - 15, true);

  centeredText(`— PAGE ${matter.selectedEvents.length + 2} —`, 26, 6.5, MUTED);
  centeredText("✦", 46, 24, ESPRESSO);
  centeredText("WITH LOVE & GRATITUDE", 58, 12, ESPRESSO, "bold");
  ornamentalDivider(63);

  const closingText = "Your presence and blessings are the greatest gift to our family. We look forward to celebrating this joyous occasion with you.";
  const lwLines = doc.splitTextToSize(closingText, W - 60);
  doc.setFontSize(9.5); doc.setFont("helvetica", "italic"); setColor(ESPRESSO);
  let lwY = 78;
  lwLines.forEach((l: string) => { doc.text(l, W / 2, lwY, { align: "center" }); lwY += 5.5; });
  lwY += 10; ornamentalDivider(lwY); lwY += 12;

  // Last-page family
  const lastBride = matter.brideFamily.filter((m) => m.placement === "Last Page");
  const lastGroom = matter.groomFamily.filter((m) => m.placement === "Last Page");
  if (lastBride.length > 0 || lastGroom.length > 0) {
    centeredText("CELEBRATING WITH", lwY, 7, GOLD_D, "bold"); lwY += 7;
    const leftX = 40, rightX = W / 2 + 5;
    if (lastBride.length > 0) { doc.setFontSize(7); doc.setFont("helvetica", "bold"); setColor(GOLD_D); doc.text("BRIDE'S FAMILY", leftX, lwY); }
    if (lastGroom.length > 0) { doc.setFontSize(7); doc.setFont("helvetica", "bold"); setColor(GOLD_D); doc.text("GROOM'S FAMILY", rightX, lwY); }
    lwY += 5;
    const maxL = Math.max(lastBride.length, lastGroom.length);
    for (let i = 0; i < maxL; i++) {
      const bm = lastBride[i], gm = lastGroom[i];
      if (bm) { doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); setColor(ESPRESSO); doc.text(bm.name || "—", leftX, lwY); doc.setFontSize(7); setColor(MUTED); doc.text(bm.relationship, leftX, lwY + 3.5); }
      if (gm) { doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); setColor(ESPRESSO); doc.text(gm.name || "—", rightX, lwY); doc.setFontSize(7); setColor(MUTED); doc.text(gm.relationship, rightX, lwY + 3.5); }
      lwY += 9;
    }
    lwY += 4; ornamentalDivider(lwY); lwY += 12;
  }

  // PrinceCards closer
  drawStar(W / 2, lwY, 6); lwY += 12;
  centeredText("PRINCECARDS", lwY, 14, GOLD_D, "bold"); lwY += 8;
  centeredText("Crafting Timeless Wedding Invitations", lwY, 7, MUTED); lwY += 6;
  centeredText("princecards.in  ·  WhatsApp: +91 98260 15250", lwY, 7, MUTED);
  centeredText("Generated with ❤ by PrinceCards", H - 14, 6, MUTED);

  // Save
  const safeBride = bride.replace(/[^\w\s]/g, "").replace(/\s+/g, "_");
  const safeGroom = groom.replace(/[^\w\s]/g, "").replace(/\s+/g, "_");
  doc.save(`PrinceCards_Matter_${safeBride}_${safeGroom}.pdf`);
  markDownloaded();
}

// ─────────────────────────────────────────────────────────────
// Main Wizard Component
// ─────────────────────────────────────────────────────────────
export default function MatterWizard() {
  const { savedMatter, isMatterSaved, isMatterDownloaded, saveMatter, resetMatter, markDownloaded } = useMatter();

  // Wizard visibility
  const [wizardOpen, setWizardOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  // Generation states: null = idle, "ai" = calling Gemini, "pdf" = building PDF
  const [generatingStage, setGeneratingStage] = useState<null | "ai" | "pdf">(null);
  const isGenerating = generatingStage !== null;
  const [aiError, setAiError] = useState<string | null>(null);

  // Step 1
  const [selectedEvents, setSelectedEvents] = useState<EventName[]>([]);

  // Step 2
  const emptyDetail = (): EventDetail => ({ date: "", time: "", venue: "" });
  const [eventDetails, setEventDetails] = useState<Record<EventName, EventDetail>>({
    Haldi: emptyDetail(), Mehendi: emptyDetail(), Sangeet: emptyDetail(),
    Wedding: emptyDetail(), Reception: emptyDetail(),
  });

  // Step 3
  const [vibe, setVibe] = useState<VibeType | null>(null);

  // Step 4
  const [brideName, setBrideName] = useState("");
  const [groomName, setGroomName] = useState("");
  const [brideFamily, setBrideFamily] = useState<FamilyMember[]>([]);
  const [groomFamily, setGroomFamily] = useState<FamilyMember[]>([]);

  const makeMember = (): FamilyMember => ({
    id: generateUid(), name: "", relationship: "Parent", placement: "Cover Page",
  });

  // Family helpers
  const brideAdd    = () => setBrideFamily((p) => [...p, makeMember()]);
  const brideRemove = (id: string) => setBrideFamily((p) => p.filter((m) => m.id !== id));
  const brideUpdate = (id: string, field: keyof Omit<FamilyMember, "id">, val: string) =>
    setBrideFamily((p) => p.map((m) => m.id === id ? { ...m, [field]: val } : m));

  const groomAdd    = () => setGroomFamily((p) => [...p, makeMember()]);
  const groomRemove = (id: string) => setGroomFamily((p) => p.filter((m) => m.id !== id));
  const groomUpdate = (id: string, field: keyof Omit<FamilyMember, "id">, val: string) =>
    setGroomFamily((p) => p.map((m) => m.id === id ? { ...m, [field]: val } : m));

  const updateEventDetail = (ev: EventName, field: keyof EventDetail, val: string) =>
    setEventDetails((p) => ({ ...p, [ev]: { ...p[ev], [field]: val } }));

  // Step validation
  const canProceed = (() => {
    if (currentStep === 1) return selectedEvents.length > 0;
    if (currentStep === 2) return true; // details are optional
    if (currentStep === 3) return vibe !== null;
    if (currentStep === 4) return true; // family optional
    return true;
  })();

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const handleGenerate = async () => {
    if (!vibe) return;
    setAiError(null);

    const bride = brideName.trim() || "Bride";
    const groom  = groomName.trim() || "Groom";

    const formattedDetails = Object.fromEntries(
      (Object.keys(eventDetails) as EventName[]).map((ev) => {
        const d = eventDetails[ev];
        return [ev, { date: formatDate(d.date), time: formatTime(d.time), venue: d.venue }];
      })
    ) as Record<EventName, EventDetail>;

    const matter: SavedMatter = {
      bride, groom,
      selectedEvents, eventDetails: formattedDetails, vibe, brideFamily, groomFamily,
    };
    saveMatter(matter);

    // ── Phase 1: Call Gemini for cover wording ─────────────
    let aiWording: string | undefined;
    setGeneratingStage("ai");
    try {
      const res = await fetch("/api/generate-wording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vibe, selectedEvents, eventDetails: formattedDetails,
          brideFamily, groomFamily,
          brideName: bride, groomName: groom,
        }),
      });
      const data = await res.json();
      if (res.ok && data.wording) {
        aiWording = data.wording as string;
      } else {
        // Non-fatal: the PDF will use the vibe fallback text
        setAiError(data.error ?? "AI wording unavailable — using default text.");
      }
    } catch (err) {
      console.warn("AI wording fetch failed, using fallback:", err);
      setAiError("Could not reach the AI service — using default wording instead.");
    }

    // ── Phase 2: Build & download the PDF ─────────────────
    setGeneratingStage("pdf");
    try {
      await generateMultiPagePDF(matter, markDownloaded, aiWording);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setGeneratingStage(null);
    }
  };

  const handleReset = () => {
    resetMatter();
    setWizardOpen(false);
    setCurrentStep(1);
    setSelectedEvents([]);
    setEventDetails({ Haldi: emptyDetail(), Mehendi: emptyDetail(), Sangeet: emptyDetail(), Wedding: emptyDetail(), Reception: emptyDetail() });
    setVibe(null);
    setBrideName("");
    setGroomName("");
    setBrideFamily([]);
    setGroomFamily([]);
    setAiError(null);
    setGeneratingStage(null);
  };

  // ── Render ────────────────────────────────────────────
  return (
    <section className="mx-auto max-w-screen-lg px-4 md:px-8 py-12" aria-label="Card Matter">

      {/* Page heading */}
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--color-accent)" }}>
          Card Matter
        </p>
        <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>
          Your Wedding Invitation Details
        </h2>
        <p className="mt-3 text-sm max-w-md mx-auto" style={{ color: "var(--color-muted)" }}>
          Use our AI Wording Assistant to craft the perfect multi-page invitation matter and download it as a beautifully formatted PDF.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">

        {/* ── Completed state ── */}
        {isMatterDownloaded && savedMatter && (
          <div className="rounded-2xl p-8" style={{ border: "1px solid var(--color-card-border)", backgroundColor: "var(--color-white)", boxShadow: "var(--shadow-card)" }}>
            <CompletedState onReset={handleReset} />
          </div>
        )}

        {/* ── Wizard closed — Trigger button ── */}
        {!wizardOpen && !isMatterDownloaded && (
          <div className="rounded-2xl p-8 text-center" style={{ border: "1px solid var(--color-card-border)", backgroundColor: "var(--color-white)", boxShadow: "var(--shadow-card)" }}>
            <div className="inline-flex items-center justify-center rounded-full mb-6"
              style={{ width: 64, height: 64, background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))", border: "1.5px solid rgba(212,175,55,0.4)" }}>
              <span style={{ fontSize: 28 }}>✨</span>
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
              AI Wording Assistant
            </h3>
            <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "var(--color-muted)" }}>
              Answer a few simple questions about your events, family, and preferred tone — we&apos;ll craft a stunning, multi-page PDF invitation ready to share.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-7">
              {["Multi-Page PDF", "Event Details", "Family Names", "4 Vibe Tones"].map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: "var(--color-tag-bg)", color: "var(--color-muted)", border: "1px solid var(--color-card-border)" }}>
                  ✓ {tag}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold tracking-wide text-sm transition-all duration-200 hover:scale-105"
              style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))", color: "white", boxShadow: "0 6px 20px rgba(212,175,55,0.35)" }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 28px rgba(212,175,55,0.5)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 6px 20px rgba(212,175,55,0.35)")}
            >
              <span style={{ fontSize: 16 }}>✨</span>
              Need Help? Auto-Generate Your Wording
              <span style={{ fontSize: 16 }}>✨</span>
            </button>
          </div>
        )}

        {/* ── Wizard open ── */}
        {wizardOpen && !isMatterDownloaded && (
          <div className="rounded-2xl" style={{ border: "1px solid var(--color-card-border)", backgroundColor: "var(--color-white)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>

            {/* Wizard header */}
            <div className="px-6 pt-6 pb-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-accent-dark)" }}>
                    {currentStep < TOTAL_STEPS
                      ? `Step ${currentStep} of ${TOTAL_STEPS - 1} — ${STEP_LABELS[currentStep - 1]}`
                      : "Review & Generate"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWizardOpen(false)}
                  className="rounded-full flex items-center justify-center transition-colors duration-150"
                  style={{ width: 28, height: 28, color: "var(--color-muted)", backgroundColor: "var(--color-tag-bg)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-muted)")}
                  aria-label="Close wizard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <StepIndicator current={currentStep} total={TOTAL_STEPS} />
            </div>

            {/* Step content */}
            <div className="px-6 pb-6">
              {currentStep === 1 && (
                <Step1Events selected={selectedEvents} onChange={setSelectedEvents} />
              )}
              {currentStep === 2 && (
                <Step2Details events={selectedEvents} details={eventDetails} onChange={updateEventDetail} />
              )}
              {currentStep === 3 && (
                <Step3Vibe vibe={vibe} onChange={setVibe} />
              )}
              {currentStep === 4 && (
                <Step4Family
                  brideName={brideName} groomName={groomName}
                  onBrideNameChange={setBrideName} onGroomNameChange={setGroomName}
                  brideFamily={brideFamily} groomFamily={groomFamily}
                  onBrideAdd={brideAdd} onBrideUpdate={brideUpdate} onBrideRemove={brideRemove}
                  onGroomAdd={groomAdd} onGroomUpdate={groomUpdate} onGroomRemove={groomRemove}
                />
              )}
              {currentStep === TOTAL_STEPS && vibe && (
                <>
                  {/* AI error banner — non-fatal, PDF still generates with fallback wording */}
                  {aiError && (
                    <div className="mb-4 rounded-xl px-4 py-3 flex items-start gap-3"
                      style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}>
                      <span className="text-base flex-shrink-0 mt-0.5">⚠️</span>
                      <div>
                        <p className="text-xs font-bold mb-0.5" style={{ color: "#92400E" }}>AI Wording Note</p>
                        <p className="text-xs leading-relaxed" style={{ color: "#78350F" }}>{aiError}</p>
                      </div>
                    </div>
                  )}
                  <ReviewBoard
                    events={selectedEvents}
                    eventDetails={eventDetails}
                    vibe={vibe}
                    brideFamily={brideFamily}
                    groomFamily={groomFamily}
                    onEdit={(step) => setCurrentStep(step)}
                    onGenerate={handleGenerate}
                    isGenerating={isGenerating}
                    generatingStage={generatingStage}
                  />
                </>
              )}

              {/* Navigation buttons */}
              {currentStep < TOTAL_STEPS && (
                <div className="flex items-center justify-between mt-8">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ border: "1.5px solid var(--color-card-border)", color: "var(--color-text)", backgroundColor: "transparent" }}
                    onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.borderColor = "var(--color-accent)"; }}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-card-border)")}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02]"
                    style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))", color: "white", boxShadow: canProceed ? "0 4px 14px rgba(212,175,55,0.3)" : "none" }}
                  >
                    {currentStep === TOTAL_STEPS - 1 ? "Review" : "Next"}
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
