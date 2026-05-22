"use client";

import { useState } from "react";
import { useMatter } from "@/context/MatterContext";
import type {
  EventName, VibeType, Relationship, PagePlacement,
  EventDetail, FamilyMember, SavedMatter,
} from "@/context/MatterContext";
import { GoogleMapsLoader } from "@/components/GoogleMapsLoader";
import { VenueAutocomplete } from "@/components/VenueAutocomplete";

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
 * Returns the original string unchanged if it isn't a valid 24-h time.
 */
export function formatTime(raw: string): string {
  if (!raw) return raw;
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

const STEP_LABELS = ["Events", "Details", "Vibe", "Family", "Review"];

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
// Step 2 — Event details (date / time / venue)
// ─────────────────────────────────────────────────────────────

/** Shared label style */
function FieldLabel({ children }: { children: string }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
      style={{ color: "var(--color-muted)" }}>
      {children}
    </label>
  );
}

/** Native date / time input with Royal Minimalist styling */
function NativePicker({
  type, value, onChange, id,
}: { type: "date" | "time"; value: string; onChange: (v: string) => void; id: string }) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all duration-200 appearance-none"
        style={{
          border:          "1.5px solid var(--color-card-border)",
          backgroundColor: "var(--color-tag-bg)",
          color:           value ? "var(--color-text)" : "var(--color-muted)",
          fontFamily:      "inherit",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--color-accent)";
          e.currentTarget.style.boxShadow   = "0 0 0 2.5px rgba(212,175,55,0.18)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--color-card-border)";
          e.currentTarget.style.boxShadow   = "none";
        }}
      />
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
        Pick a date &amp; time, then search for your venue — all fields are optional.
      </p>

      {/* Load Google Maps SDK once for all venue autocompletes on the page */}
      <GoogleMapsLoader>
        <div className="space-y-5">
          {events.map((ev) => (
            <div key={ev} className="rounded-xl p-4"
              style={{ border: "1px solid var(--color-card-border)", backgroundColor: "var(--color-white)" }}>

              {/* Event header */}
              <p className="text-sm font-bold mb-4 flex items-center gap-2"
                style={{ color: "var(--color-accent-dark)" }}>
                <span>{EVENT_ICONS[ev]}</span> {ev}
              </p>

              {/* Date + Time side by side, Venue full-width below */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                {/* Date */}
                <div>
                  <FieldLabel>Date</FieldLabel>
                  <NativePicker
                    id={`date-${ev}`}
                    type="date"
                    value={details[ev].date}
                    onChange={(v) => onChange(ev, "date", v)}
                  />
                </div>

                {/* Time */}
                <div>
                  <FieldLabel>Time</FieldLabel>
                  <NativePicker
                    id={`time-${ev}`}
                    type="time"
                    value={details[ev].time}
                    onChange={(v) => onChange(ev, "time", v)}
                  />
                </div>
              </div>

              {/* Venue — full width */}
              <div>
                <FieldLabel>Venue</FieldLabel>
                <VenueAutocomplete
                  eventId={ev}
                  value={details[ev].venue}
                  onChange={(v) => onChange(ev, "venue", v)}
                />
              </div>
            </div>
          ))}
        </div>
      </GoogleMapsLoader>
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
  brideFamily, groomFamily,
  onBrideAdd, onBrideUpdate, onBrideRemove,
  onGroomAdd, onGroomUpdate, onGroomRemove,
}: {
  brideFamily:    FamilyMember[];
  groomFamily:    FamilyMember[];
  onBrideAdd:     () => void;
  onBrideUpdate:  (id: string, field: keyof Omit<FamilyMember, "id">, val: string) => void;
  onBrideRemove:  (id: string) => void;
  onGroomAdd:     () => void;
  onGroomUpdate:  (id: string, field: keyof Omit<FamilyMember, "id">, val: string) => void;
  onGroomRemove:  (id: string) => void;
}) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
        Family Names
      </h3>
      <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
        Add family members from both sides. Their names will appear on the invitation pages you choose.
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
// PDF Generation
// ─────────────────────────────────────────────────────────────
async function generateMultiPagePDF(
  matter: SavedMatter,
  markDownloaded: () => void,
  aiWording?: string,
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W = 210, H = 297;
  const GOLD = [212, 175, 55] as [number, number, number];
  const GOLD_D = [184, 150, 30] as [number, number, number];
  const ESPRESSO = [45, 43, 42] as [number, number, number];
  const MUTED = [138, 127, 116] as [number, number, number];
  const BG = [252, 251, 249] as [number, number, number];

  const bride = matter.brideFamily.find((m) => m.relationship === "Parent" && m.placement === "Cover Page")?.name
    ?? matter.brideFamily.find((m) => m.placement === "Cover Page")?.name
    ?? "The Bride";
  const groom = matter.groomFamily.find((m) => m.relationship === "Parent" && m.placement === "Cover Page")?.name
    ?? matter.groomFamily.find((m) => m.placement === "Cover Page")?.name
    ?? "The Groom";

  // Helper functions
  function setColor(rgb: [number, number, number]) { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }
  function setFill(rgb: [number, number, number]) { doc.setFillColor(rgb[0], rgb[1], rgb[2]); }
  function setDraw(rgb: [number, number, number]) { doc.setDrawColor(rgb[0], rgb[1], rgb[2]); }

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

  function coverFamilyBlock(members: FamilyMember[], placement: PagePlacement, startY: number, side: string): number {
    const list = members.filter((m) => m.placement === placement);
    if (list.length === 0) return startY;
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    setColor(GOLD_D);
    doc.text(side.toUpperCase(), W / 2, startY, { align: "center" });
    let y = startY + 5;
    list.forEach((m) => {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      setColor(ESPRESSO);
      doc.text(m.name || "—", W / 2, y, { align: "center" });
      doc.setFontSize(7);
      setColor(MUTED);
      doc.text(m.relationship, W / 2, y + 3.5, { align: "center" });
      y += 9;
    });
    return y;
  }

  // ── PAGE 1: Cover ──────────────────────────────────────────
  bgPage(); borderFrame();
  drawGoldBar(12, true);
  drawGoldBar(H - 15, true);

  // PrinceCards header
  centeredText("PRINCECARDS", 30, 8, GOLD_D, "bold");
  centeredText("Est. 2020 · Premium Wedding Stationery", 36, 6, MUTED);
  ornamentalDivider(40);

  // Intro wording — use AI-generated text when available, fall back to static VIBE_INTRO
  const coverWording = aiWording ?? VIBE_INTRO[matter.vibe];
  const introLines = doc.splitTextToSize(coverWording, W - 60);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "italic");
  setColor(ESPRESSO);
  let introY = 52;
  introLines.forEach((line: string) => {
    doc.text(line, W / 2, introY, { align: "center" });
    introY += 5;
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

    // Two-column
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
  matter.selectedEvents.forEach((ev, idx) => {
    doc.addPage();
    const d = matter.eventDetails[ev];
    bgPage(); borderFrame();
    drawGoldBar(12, true);
    drawGoldBar(H - 15, true);

    // Page number ornament
    centeredText(`— PAGE ${idx + 2} —`, 26, 6.5, MUTED);

    // Event name as large header
    centeredText(EVENT_ICONS[ev], 46, 22, ESPRESSO);
    centeredText(ev.toUpperCase(), 58, 18, ESPRESSO, "bold");
    ornamentalDivider(63);

    // Vibe wording for event
    const eventWording: Record<VibeType, string> = {
      Traditional: `We, with utmost reverence and joy, invite you to grace the sacred ceremony of ${ev} and shower your blessings upon the union.`,
      Royal:       `The esteemed families request the honour of your distinguished presence at the ${ev} ceremony, to witness this regal celebration.`,
      Modern:      `Join us for a beautiful ${ev} celebration — good vibes, great company, and memories to last a lifetime!`,
      Quirky:      `${ev} time! Things are about to get beautiful, maybe a little chaotic, and 100% unforgettable. You're invited! 🥳`,
    };
    const wLines = doc.splitTextToSize(eventWording[matter.vibe], W - 60);
    doc.setFontSize(9); doc.setFont("helvetica", "italic"); setColor(ESPRESSO);
    let wY = 75;
    wLines.forEach((l: string) => { doc.text(l, W / 2, wY, { align: "center" }); wY += 5.5; });
    wY += 6;
    ornamentalDivider(wY); wY += 10;

    // Detail boxes
    const fields = [
      { label: "DATE", value: d.date || "TBD" },
      { label: "TIME", value: d.time || "TBD" },
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

    // Footer
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

  const lastWording: Record<VibeType, string> = {
    Traditional: "Your presence and blessings are the greatest gift to our family. We humbly request the honour of your company on this auspicious occasion.",
    Royal:       "We are honoured beyond measure to have you witness this celebration. Your presence shall make this occasion truly unforgettable.",
    Modern:      "Your presence is literally all we need. Come, celebrate, and make memories with us!",
    Quirky:      "You made it to the last page — you deserve a gold star ⭐ and a front-row seat at the wedding!",
  };
  const lwLines = doc.splitTextToSize(lastWording[matter.vibe], W - 60);
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
  doc.save(`PrinceCards_Matter_${bride.replace(/\s+/g, "_")}_${groom.replace(/\s+/g, "_")}.pdf`);
  markDownloaded();
}

// ─────────────────────────────────────────────────────────────
// Main Wizard Component
// ─────────────────────────────────────────────────────────────
const TOTAL_STEPS = 5; // 1-4 = wizard steps, 5 = review

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
    if (currentStep === 4) return true;
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

    const bride = brideFamily.find((m) => m.relationship === "Parent")?.name
      ?? brideFamily[0]?.name ?? "Bride";
    const groom = groomFamily.find((m) => m.relationship === "Parent")?.name
      ?? groomFamily[0]?.name ?? "Groom";

    // Format raw HTML5 picker values into human-readable strings
    // e.g. '2026-02-12' → 'February 12th, 2026'  |  '19:00' → '7:00 PM'
    const formattedDetails = Object.fromEntries(
      (Object.keys(eventDetails) as EventName[]).map((ev) => {
        const d = eventDetails[ev];
        return [ev, {
          date:  formatDate(d.date),
          time:  formatTime(d.time),
          venue: d.venue,
        }];
      })
    ) as Record<EventName, EventDetail>;

    const matter: SavedMatter = {
      bride, groom,
      selectedEvents, eventDetails: formattedDetails, vibe, brideFamily, groomFamily,
    };
    saveMatter(matter);

    // ── Phase 1: Call Gemini for AI cover wording ──────────
    let aiWording: string | undefined;
    setGeneratingStage("ai");
    try {
      const res = await fetch("/api/generate-wording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vibe, selectedEvents, eventDetails: formattedDetails, brideFamily, groomFamily }),
      });
      const data = await res.json();
      if (res.ok && data.wording) {
        aiWording = data.wording as string;
      } else {
        // Non-fatal: fall back to static wording
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
    setBrideFamily([]);
    setGroomFamily([]);
    setAiError(null);
    setGeneratingStage(null);
  };

  // ── Render ────────────────────────────────────────────────
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
                    {currentStep <= 4
                      ? `Step ${currentStep} of 4 — ${STEP_LABELS[currentStep - 1]}`
                      : "Step 5 — Review & Generate"}
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
                  brideFamily={brideFamily} groomFamily={groomFamily}
                  onBrideAdd={brideAdd} onBrideUpdate={brideUpdate} onBrideRemove={brideRemove}
                  onGroomAdd={groomAdd} onGroomUpdate={groomUpdate} onGroomRemove={groomRemove}
                />
              )}
              {currentStep === 5 && vibe && (
                <>
                  {/* AI error banner — non-fatal, PDF still generates with fallback */}
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
              {currentStep < 5 && (
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
                    {currentStep === 4 ? "Review" : "Next"}
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
