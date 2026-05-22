"use client";

import { createContext, useContext, useRef, useState, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────
export type EventName = "Haldi" | "Mehendi" | "Sangeet" | "Wedding" | "Reception";
export type VibeType  = "Traditional" | "Royal" | "Modern" | "Quirky";
export type Relationship = "Grandparent" | "Parent" | "Sibling" | "Uncle/Aunt";
export type PagePlacement = "Cover Page" | "Event Pages" | "Last Page";

export interface EventDetail {
  date:  string;
  time:  string;
  venue: string;
}

export interface FamilyMember {
  id:           string;
  name:         string;
  relationship: Relationship;
  placement:    PagePlacement;
}

export interface SavedMatter {
  // Legacy compat
  bride: string;
  groom: string;
  // Wizard data
  selectedEvents: EventName[];
  eventDetails:   Record<EventName, EventDetail>;
  vibe:           VibeType;
  brideFamily:    FamilyMember[];
  groomFamily:    FamilyMember[];
}

interface MatterContextValue {
  savedMatter:        SavedMatter | null;
  isMatterSaved:      boolean;
  isMatterDownloaded: boolean;
  showToast:          boolean;
  saveMatter:         (m: SavedMatter) => void;
  resetMatter:        () => void;
  markDownloaded:     () => void;
  dismissToast:       () => void;
}

// ── Context ────────────────────────────────────────────────
const MatterContext = createContext<MatterContextValue | null>(null);

export function useMatter(): MatterContextValue {
  const ctx = useContext(MatterContext);
  if (!ctx) throw new Error("useMatter must be used inside <MatterProvider>");
  return ctx;
}

// ── Provider ───────────────────────────────────────────────
export function MatterProvider({ children }: { children: React.ReactNode }) {
  const [savedMatter,        setSavedMatter]        = useState<SavedMatter | null>(null);
  const [isMatterSaved,      setIsMatterSaved]      = useState(false);
  const [isMatterDownloaded, setIsMatterDownloaded] = useState(false);
  const [showToast,          setShowToast]          = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveMatter = useCallback((m: SavedMatter) => {
    setSavedMatter(m);
    setIsMatterSaved(true);
    setIsMatterDownloaded(false);
  }, []);

  const resetMatter = useCallback(() => {
    setSavedMatter(null);
    setIsMatterSaved(false);
    setIsMatterDownloaded(false);
  }, []);

  const markDownloaded = useCallback(() => {
    setIsMatterDownloaded(true);
    setShowToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 7000);
  }, []);

  const dismissToast = useCallback(() => {
    setShowToast(false);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  return (
    <MatterContext.Provider value={{
      savedMatter, isMatterSaved, isMatterDownloaded,
      showToast, saveMatter, resetMatter, markDownloaded, dismissToast,
    }}>
      {children}
    </MatterContext.Provider>
  );
}
