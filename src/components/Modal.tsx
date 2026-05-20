"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import type { CardItem, TabType } from "@/lib/data";
import { GALLERY_IMAGES } from "@/lib/data";

interface ModalProps {
  item: CardItem | null;
  onClose: () => void;
}

const TAB_LABEL: Record<TabType, string> = {
  physical: "Wedding Card",
  ecard:    "E-Card",
  evideo:   "E-Video",
};

export default function Modal({ item, onClose }: ModalProps) {
  const overlayRef                       = useRef<HTMLDivElement>(null);
  const [currentIdx, setCurrentIdx]      = useState(0);
  const [slideDir, setSlideDir]          = useState<"left" | "right">("left");
  const [animKey, setAnimKey]            = useState(0);

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

  // Keyboard arrow navigation inside modal
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

  const images    = GALLERY_IMAGES[item.tab];
  const current   = images[currentIdx];
  const isVideo   = item.tab === "evideo";
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

            {/* Main image with slide animation */}
            <div className="relative flex-1 min-h-[300px] md:min-h-[480px] overflow-hidden rounded-tl-2xl md:rounded-bl-2xl rounded-tr-2xl md:rounded-tr-none">
              <div key={animKey} className={`${slideClass} absolute inset-0`}>
                <Image
                  src={current.src}
                  alt={`${item.title} – ${current.label}`}
                  fill
                  className="object-cover"
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

              {/* ── Left nav arrow ── */}
              <button
                onClick={() => navigate("prev")}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 hover:shadow-lg"
                style={{ backgroundColor: "rgba(255,255,255,0.85)", color: "var(--color-text)" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              {/* ── Right nav arrow ── */}
              <button
                onClick={() => navigate("next")}
                aria-label="Next image"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 hover:shadow-lg"
                style={{ backgroundColor: "rgba(255,255,255,0.85)", color: "var(--color-text)" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* ── Thumbnail strip ── */}
            <div className="flex items-center justify-center gap-2 p-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSlideDir(i > currentIdx ? "left" : "right");
                    setAnimKey((k) => k + 1);
                    setCurrentIdx(i);
                  }}
                  aria-label={`View ${img.label}`}
                  className="relative flex-shrink-0 overflow-hidden transition-all duration-200"
                  style={{
                    width: 52, height: 42,
                    borderRadius: 8,
                    border: i === currentIdx
                      ? "2px solid var(--color-accent)"
                      : "2px solid transparent",
                    opacity: i === currentIdx ? 1 : 0.55,
                    transform: i === currentIdx ? "scale(1.08)" : "scale(1)",
                  }}
                >
                  <Image src={img.src} alt={img.label} fill className="object-cover" sizes="52px" />
                </button>
              ))}
            </div>

            {/* Image label */}
            <p className="pb-3 text-center text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-muted)" }}>
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

            {/* Details */}
            <div className="mb-5 rounded-xl p-4" style={{ backgroundColor: "var(--color-tag-bg)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-accent-dark)" }}>
                Product Details
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                Experience the finest craftsmanship in Indian wedding stationery. Each piece is
                thoughtfully designed to capture the essence of celebration, tradition, and love —
                crafted to make your special day truly unforgettable.
              </p>
            </div>

            {/* Spec list */}
            <ul className="mb-7 space-y-2.5">
              {[
                ["Format",        item.tab === "physical" ? "Premium Print" : item.tab === "ecard" ? "Digital E-Card" : "Video File (MP4)"],
                ["Customization", "Name, Date, Venue & Matter"],
                ["Delivery",      item.tab === "physical" ? "5–7 Business Days" : "Within 24 Hours"],
                ["Min. Order",    "50 pieces"],
              ].map(([label, value]) => (
                <li key={label} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: "var(--color-accent)" }} />
                  <span style={{ color: "var(--color-muted)" }}>{label}:</span>
                  <span className="font-medium" style={{ color: "var(--color-text)" }}>{value}</span>
                </li>
              ))}
            </ul>

            {/* CTA buttons */}
            <div className="mt-auto flex flex-col sm:flex-row gap-3">
              <button id="modal-enquire-btn"
                className="flex-1 rounded-xl py-3.5 text-sm font-semibold tracking-wide transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                style={{ backgroundColor: "var(--color-accent)", color: "white" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-accent-dark)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-accent)")}>
                Enquire Now
              </button>
              <button id="modal-sample-btn"
                className="flex-1 rounded-xl border py-3.5 text-sm font-semibold tracking-wide transition-all duration-200 hover:scale-[1.02]"
                style={{ borderColor: "var(--color-accent)", color: "var(--color-accent-dark)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-tag-bg)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                Request Sample
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
