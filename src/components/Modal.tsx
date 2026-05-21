"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { FaWhatsapp } from "react-icons/fa";
import type { CardItem, TabType } from "@/lib/data";
import { GALLERY_IMAGES } from "@/lib/data";
import { useMatter } from "@/context/MatterContext";

interface ModalProps {
  item:     CardItem | null;
  onClose:  () => void;
  onNavigateToMatter: () => void;   // closes modal + goes to Matter tab
}

const TAB_LABEL: Record<TabType, string> = {
  physical: "Wedding Card",
  ecard:    "E-Card",
  evideo:   "E-Video",
};

export default function Modal({ item, onClose, onNavigateToMatter }: ModalProps) {
  const overlayRef                  = useRef<HTMLDivElement>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [slideDir, setSlideDir]     = useState<"left" | "right">("left");
  const [animKey, setAnimKey]       = useState(0);

  const { savedMatter, isMatterDownloaded } = useMatter();

  // Reset gallery index when item changes
  useEffect(() => { setCurrentIdx(0); }, [item]);

  // Scroll lock
  useEffect(() => {
    document.body.classList.toggle("modal-open", !!item);
    return () => document.body.classList.remove("modal-open");
  }, [item]);

  // ESC key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const navigate = useCallback((dir: "prev" | "next") => {
    if (!item) return;
    const images = GALLERY_IMAGES[item.tab];
    setSlideDir(dir === "next" ? "left" : "right");
    setAnimKey((k) => k + 1);
    setCurrentIdx((prev) =>
      dir === "next"
        ? (prev + 1) % images.length
        : (prev - 1 + images.length) % images.length
    );
  }, [item]);

  // Keyboard arrow navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!item) return;
      if (e.key === "ArrowLeft")  navigate("prev");
      if (e.key === "ArrowRight") navigate("next");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, navigate]);

  if (!item) return null;

  // ── WhatsApp Enquire Now (only visible after PDF downloaded) ──
  const handleEnquireNow = () => {
    const productLink = typeof window !== "undefined" ? window.location.href : "https://princecards.in";
    const matter = savedMatter;
    const message =
      `Hello PrinceCards! I want to order this card: ${productLink}\n` +
      `Product: *${item.title}*\n` +
      `Price: ₹${item.price}/piece\n\n` +
      `My Matter details are summarized below, and I will attach the PDF file to this chat:\n` +
      `👰 Bride: ${matter?.bride ?? ""} | 🤵 Groom: ${matter?.groom ?? ""} | 📅 Date: ${matter?.date ?? ""}`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/919826015250?text=${encoded}`, "_blank", "noopener,noreferrer");
  };

  const images     = GALLERY_IMAGES[item.tab];
  const current    = images[currentIdx];
  const isVideo    = item.tab === "evideo";
  const slideClass = slideDir === "left" ? "gallery-slide-left" : "gallery-slide-right";

  return (
    <div
      ref={overlayRef}
      id="modal-overlay"
      className="overlay-enter fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: "var(--color-overlay)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="modal-enter relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl"
        style={{ backgroundColor: "var(--color-white)", boxShadow: "var(--shadow-modal)" }}
      >
        {/* ── Close button ── */}
        <button
          id="modal-close-btn"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
          style={{ backgroundColor: "var(--color-tag-bg)", color: "var(--color-text)" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-accent)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-tag-bg)")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col md:flex-row">
          {/* ══ LEFT – Gallery Panel ══ */}
          <div className="relative flex-shrink-0 w-full md:w-[48%] flex flex-col"
            style={{ backgroundColor: "var(--color-tag-bg)", borderRadius: "16px 0 0 16px" }}>

            {/* Main image */}
            <div className="relative flex-1 min-h-[300px] md:min-h-[480px] overflow-hidden rounded-tl-2xl md:rounded-bl-2xl rounded-tr-2xl md:rounded-tr-none">
              <div key={animKey} className={`${slideClass} absolute inset-0`}>
                <Image
                  src={current.src}
                  alt={`${item.title} – ${current.label}`}
                  fill className="object-cover"
                  sizes="(max-width: 768px) 100vw, 48vw"
                  priority
                />
              </div>

              {/* Video play overlay */}
              {isVideo && currentIdx === 0 && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="play-pulse relative flex h-14 w-14 items-center justify-center rounded-full"
                    style={{ backgroundColor: "rgba(212,175,55,0.88)" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" className="ml-0.5">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Best seller badge */}
              {item.isBestSeller && (
                <div className="absolute top-3 left-0 px-3 py-1 text-xs font-bold uppercase tracking-wider z-10"
                  style={{ backgroundColor: "var(--color-accent)", color: "white", borderRadius: "0 6px 6px 0" }}>
                  ★ Best Seller
                </div>
              )}

              {/* Left arrow */}
              <button onClick={() => navigate("prev")} aria-label="Previous image"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
                style={{ backgroundColor: "#ffffff", boxShadow: "0 4px 16px rgba(0,0,0,0.18)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              {/* Right arrow */}
              <button onClick={() => navigate("next")} aria-label="Next image"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
                style={{ backgroundColor: "#ffffff", boxShadow: "0 4px 16px rgba(0,0,0,0.18)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Thumbnails */}
            <div className="flex items-center justify-center gap-2 p-3">
              {images.map((img, i) => (
                <button key={i}
                  onClick={() => { setSlideDir(i > currentIdx ? "left" : "right"); setAnimKey((k) => k + 1); setCurrentIdx(i); }}
                  aria-label={`View ${img.label}`}
                  className="relative flex-shrink-0 overflow-hidden transition-all duration-200"
                  style={{
                    width: 52, height: 42, borderRadius: 8,
                    border: i === currentIdx ? "2px solid var(--color-accent)" : "2px solid transparent",
                    opacity: i === currentIdx ? 1 : 0.55,
                    transform: i === currentIdx ? "scale(1.08)" : "scale(1)",
                  }}>
                  <Image src={img.src} alt={img.label} fill className="object-cover" sizes="52px" />
                </button>
              ))}
            </div>

            <p className="pb-3 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-muted)" }}>
              {currentIdx + 1} / {images.length} — {current.label}
            </p>
          </div>

          {/* ══ RIGHT – Product Details Panel ══ */}
          <div className="flex flex-col flex-1 p-7 md:p-9">
            {/* Type badge */}
            <span className="mb-4 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
              style={{ backgroundColor: "var(--color-tag-bg)", color: "var(--color-accent-dark)" }}>
              {TAB_LABEL[item.tab]}
            </span>

            {/* Title */}
            <h2 id="modal-title" className="mb-1 text-2xl md:text-3xl font-bold leading-tight"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--color-text)" }}>
              {item.title}
            </h2>

            {/* Tag */}
            <p className="mb-4 text-xs font-medium tracking-wider uppercase" style={{ color: "var(--color-muted)" }}>
              {item.tag}
            </p>

            {/* Price */}
            <p className="mb-5 text-2xl font-bold" style={{ color: "var(--color-accent-dark)" }}>
              ₹{item.price}
              <span className="ml-2 text-sm font-normal" style={{ color: "var(--color-muted)" }}>per piece</span>
            </p>

            {/* Divider */}
            <div className="mb-5 h-px" style={{ background: "linear-gradient(90deg, var(--color-card-border), transparent)" }} />

            {/* Spec list */}
            <ul className="mb-6 space-y-2.5">
              {[
                ["Format",        item.tab === "physical" ? "Premium Print" : item.tab === "ecard" ? "Digital E-Card" : "Video File (MP4)"],
                ["Customization", "Name, Date, Venue & Matter"],
                ["Delivery",      item.tab === "physical" ? "5–7 Business Days" : "Within 24 Hours"],
                ["Min. Order",    "50 pieces"],
              ].map(([label, value]) => (
                <li key={label} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--color-accent)" }} />
                  <span style={{ color: "var(--color-muted)" }}>{label}:</span>
                  <span className="font-medium" style={{ color: "var(--color-text)" }}>{value}</span>
                </li>
              ))}
            </ul>

            {/* ══ CONDITIONAL CTA AREA ══ */}
            <div className="mt-auto">

              {/* ── STATE A: Matter NOT yet downloaded ── */}
              {!isMatterDownloaded && (
                <>
                  {/* Nudge card */}
                  <div className="mb-4 rounded-xl p-4 flex items-start gap-3"
                    style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}>
                    <span className="text-lg flex-shrink-0 mt-0.5">💡</span>
                    <div>
                      <p className="text-xs font-bold mb-0.5" style={{ color: "#92400E" }}>Complete Your Matter First</p>
                      <p className="text-xs leading-relaxed" style={{ color: "#78350F" }}>
                        Head to the <strong>Matter</strong> tab, fill in your details, and download your PDF — then come back to enquire about this design.
                      </p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button id="modal-wishlist-btn"
                      className="flex-1 rounded-xl border py-3.5 text-sm font-semibold tracking-wide transition-all duration-200 hover:scale-[1.02]"
                      style={{ borderColor: "var(--color-accent)", color: "var(--color-accent-dark)", backgroundColor: "transparent" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-tag-bg)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                      ♡ Add to Wishlist
                    </button>
                    <button id="modal-create-matter-btn"
                      onClick={() => { onClose(); onNavigateToMatter(); }}
                      className="flex-1 rounded-xl py-3.5 text-sm font-semibold tracking-wide transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                      style={{ backgroundColor: "var(--color-accent)", color: "white" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-accent-dark)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-accent)")}>
                      ✦ Create Matter
                    </button>
                  </div>
                </>
              )}

              {/* ── STATE B: Matter IS downloaded ── */}
              {isMatterDownloaded && savedMatter && (
                <>
                  {/* Saved matter summary */}
                  <div className="mb-4 rounded-xl p-4"
                    style={{ backgroundColor: "var(--color-tag-bg)", border: "1px solid var(--color-card-border)" }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-accent-dark)" }}>
                      ✓ Your Saved Matter
                    </p>
                    <div className="grid grid-cols-2 gap-y-2 text-xs">
                      {[
                        ["👰 Bride",  savedMatter.bride],
                        ["🤵 Groom",  savedMatter.groom],
                        ["📅 Date",   savedMatter.date],
                        ["📍 Venue",  savedMatter.venue],
                      ].map(([label, value]) => (
                        <div key={label} className="col-span-2 flex gap-2">
                          <span style={{ color: "var(--color-muted)", minWidth: 60 }}>{label}</span>
                          <span className="font-semibold" style={{ color: "var(--color-text)" }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button id="modal-wishlist-btn-b"
                      className="flex-1 rounded-xl border py-3.5 text-sm font-semibold tracking-wide transition-all duration-200 hover:scale-[1.02]"
                      style={{ borderColor: "var(--color-accent)", color: "var(--color-accent-dark)", backgroundColor: "transparent" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-tag-bg)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                      ♡ Add to Wishlist
                    </button>
                    <button id="modal-enquire-now-btn"
                      onClick={handleEnquireNow}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold tracking-wide transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                      style={{ backgroundColor: "#25D366", color: "white" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1EAD52")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#25D366")}>
                      <FaWhatsapp size={16} />
                      Enquire Now
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
