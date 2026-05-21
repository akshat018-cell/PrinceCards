"use client";

import { createContext, useContext, useRef, useState, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────
export interface SavedMatter {
  bride: string;
  groom: string;
  date: string;
  venue: string;
}

interface MatterContextValue {
  savedMatter:        SavedMatter | null;
  isMatterSaved:      boolean;
  isMatterDownloaded: boolean;
  showToast:          boolean;
  saveMatter:         (m: SavedMatter) => void;
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
      showToast, saveMatter, markDownloaded, dismissToast,
    }}>
      {children}
    </MatterContext.Provider>
  );
}
