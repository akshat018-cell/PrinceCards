"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import Grid from "@/components/Grid";
import Modal from "@/components/Modal";
import {
  NAV_LINKS, TABS, PRICE_FILTERS, ALL_CARDS, MATTER_TEMPLATES,
  filterByPrice,
  type CardItem, type ViewType, type PriceRange,
} from "@/lib/data";

// ── Helpers ──────────────────────────────────────────────
function isProductView(v: ViewType): v is "physical" | "ecard" | "evideo" {
  return v === "physical" || v === "ecard" || v === "evideo";
}

// ── Divider ornament ─────────────────────────────────────
function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-4 my-2" aria-hidden="true">
      <div className="h-px flex-1 max-w-[100px]" style={{ background: "linear-gradient(90deg, transparent, var(--color-accent))" }} />
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="var(--color-accent)">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      <div className="h-px flex-1 max-w-[100px]" style={{ background: "linear-gradient(90deg, var(--color-accent), transparent)" }} />
    </div>
  );
}

// ── Hero Section ─────────────────────────────────────────
function HeroSection({ onNavigate }: { onNavigate: (v: ViewType) => void }) {
  return (
    <section
      className="hero-pattern min-h-[calc(100vh-72px)] flex flex-col items-center justify-center text-center px-6 py-20"
      aria-label="PrinceCards Home"
    >
      {/* Top ornament */}
      <div className="flex items-center justify-center gap-3 mb-6 hero-sub" aria-hidden="true">
        <div className="h-px w-16 md:w-24" style={{ background: "linear-gradient(90deg, transparent, var(--color-accent))" }} />
        <span className="text-xs tracking-[0.3em] uppercase font-semibold" style={{ color: "var(--color-accent)" }}>
          Est. 2020 · Premium Wedding Stationery
        </span>
        <div className="h-px w-16 md:w-24" style={{ background: "linear-gradient(90deg, var(--color-accent), transparent)" }} />
      </div>

      {/* Massive brand title */}
      <h1 className="gold-shimmer hero-title text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] xl:text-[11rem] font-bold leading-none tracking-tight"
        style={{ fontFamily: "var(--font-playfair), serif" }}>
        PrinceCards
      </h1>

      <GoldDivider />

      {/* Tagline */}
      <p className="hero-sub mt-4 max-w-xl text-base md:text-lg leading-relaxed" style={{ color: "var(--color-muted)" }}>
        Exquisitely crafted Indian wedding invitations, digital e-cards &amp; cinematic video invites — designed to make your celebration legendary.
      </p>

      {/* CTA row */}
      <div className="hero-cta mt-10 flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={() => onNavigate("physical")}
          className="px-8 py-4 rounded-full text-sm font-semibold tracking-wider uppercase transition-all duration-300 hover:scale-105 hover:shadow-xl"
          style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))", color: "white" }}
        >
          Browse Wedding Cards
        </button>
        <button
          onClick={() => onNavigate("evideo")}
          className="px-8 py-4 rounded-full text-sm font-semibold tracking-wider uppercase transition-all duration-300 hover:scale-105"
          style={{ border: "1.5px solid var(--color-accent)", color: "var(--color-accent-dark)", backgroundColor: "transparent" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-tag-bg)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          Watch E-Videos
        </button>
      </div>

      {/* Category badges */}
      <div className="hero-badges mt-14 flex flex-wrap justify-center gap-3">
        {[
          { view: "physical" as ViewType, icon: "🎴", label: "Wedding Cards" },
          { view: "ecard"    as ViewType, icon: "✨", label: "E-Cards" },
          { view: "evideo"   as ViewType, icon: "🎬", label: "E-Videos" },
          { view: "matter"   as ViewType, icon: "✍️", label: "Card Matter" },
        ].map(({ view, icon, label }) => (
          <button key={view} onClick={() => onNavigate(view)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 hover:scale-105"
            style={{ backgroundColor: "var(--color-tag-bg)", color: "var(--color-muted)", border: "1px solid var(--color-card-border)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.color = "var(--color-accent-dark)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-card-border)"; e.currentTarget.style.color = "var(--color-muted)"; }}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Scroll cue */}
      <div className="hero-badges mt-16 flex flex-col items-center gap-2 opacity-50">
        <span className="text-xs tracking-widest uppercase" style={{ color: "var(--color-muted)" }}>Explore Collection</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="animate-bounce">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </section>
  );
}

// ── Matter Section ───────────────────────────────────────
function MatterSection() {
  const [activeTemplate, setActiveTemplate] = useState(0);
  const tpl = MATTER_TEMPLATES[activeTemplate];
  return (
    <section className="mx-auto max-w-screen-lg px-4 md:px-8 py-12" aria-label="Card Matter Templates">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--color-accent)" }}>
          Card Matter
        </p>
        <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>
          Wording Templates
        </h2>
        <p className="mt-3 text-sm max-w-md mx-auto" style={{ color: "var(--color-muted)" }}>
          Choose from our curated wording styles or customise every word. We support Hindi, English, and bilingual formats.
        </p>
      </div>

      {/* Style selector */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {MATTER_TEMPLATES.map((t, i) => (
          <button key={t.id} onClick={() => setActiveTemplate(i)}
            className="px-4 py-2 rounded-full text-xs font-semibold tracking-wide uppercase transition-all duration-200"
            style={{
              backgroundColor: i === activeTemplate ? "var(--color-accent)" : "var(--color-tag-bg)",
              color: i === activeTemplate ? "white" : "var(--color-muted)",
              border: "1px solid",
              borderColor: i === activeTemplate ? "var(--color-accent)" : "var(--color-card-border)",
            }}>
            {t.style}
          </button>
        ))}
      </div>

      {/* Template card */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-card-border)", boxShadow: "var(--shadow-card)" }}>
        <div className="grid md:grid-cols-2">
          {/* Preview */}
          <div className="p-8 md:p-12 flex flex-col justify-center text-center"
            style={{ background: "linear-gradient(135deg, var(--color-tag-bg), var(--color-bg))", borderRight: "1px solid var(--color-card-border)" }}>
            <p className="text-xs uppercase tracking-widest mb-6" style={{ color: "var(--color-accent)" }}>Live Preview</p>
            <div className="relative mx-auto w-full max-w-[280px] aspect-[3/4] rounded-xl overflow-hidden shadow-xl">
              <Image src="/images/physical_card.png" alt="Card preview" fill className="object-cover" sizes="280px" />
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 px-4"
                style={{ background: "linear-gradient(to top, rgba(20,15,10,0.7) 0%, transparent 50%)" }}>
                <p className="text-white text-sm font-semibold" style={{ fontFamily: "var(--font-playfair), serif" }}>
                  {tpl.bride} &amp; {tpl.groom}
                </p>
                <p className="text-white/70 text-xs mt-1">{tpl.date}</p>
              </div>
            </div>
          </div>
          {/* Text */}
          <div className="p-8 md:p-12 flex flex-col justify-center" style={{ backgroundColor: "var(--color-white)" }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--color-accent)" }}>{tpl.style}</p>
            <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
              {tpl.bride} &amp; {tpl.groom}
            </h3>
            <p className="text-xs mb-6" style={{ color: "var(--color-muted)" }}>
              {tpl.date} · {tpl.venue}
            </p>
            <div className="rounded-xl p-5 mb-6" style={{ backgroundColor: "var(--color-tag-bg)" }}>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--color-text)", fontFamily: "var(--font-serif)" }}>
                {tpl.text}
              </p>
            </div>
            <button className="w-full rounded-xl py-3.5 text-sm font-semibold tracking-wide transition-all duration-200 hover:scale-[1.02]"
              style={{ backgroundColor: "var(--color-accent)", color: "white" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-accent-dark)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-accent)")}>
              Use This Template
            </button>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="mt-10 grid sm:grid-cols-3 gap-5">
        {[
          { icon: "✍️", title: "Custom Wording",    desc: "Provide us your custom text in any language — Hindi, English, Marathi, Tamil, and more." },
          { icon: "🔤", title: "Font Selection",    desc: "Choose from 20+ premium fonts including traditional Devanagari and modern Latin scripts." },
          { icon: "🌐", title: "Bilingual Support", desc: "Seamlessly combine two languages on a single card with our expert typesetting service." },
        ].map((card) => (
          <div key={card.title} className="rounded-xl p-6 transition-all duration-200 hover:shadow-md"
            style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-card-border)" }}>
            <span className="text-2xl mb-3 block">{card.icon}</span>
            <h4 className="font-bold mb-2 text-sm" style={{ fontFamily: "var(--font-playfair), serif" }}>{card.title}</h4>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-muted)" }}>{card.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function Home() {
  const [activeView, setActiveView]   = useState<ViewType>("home");
  const [priceFilter, setPriceFilter] = useState<PriceRange>("all");
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);
  const [filterOpen, setFilterOpen]   = useState(false);
  const [menuOpen, setMenuOpen]        = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleNavigate = useCallback((view: ViewType) => {
    setActiveView(view);
    setPriceFilter("all");
    setFilterOpen(false);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const currentTab = isProductView(activeView) ? activeView : "physical";

  const filteredItems = useMemo(() => {
    if (!isProductView(activeView)) return [];
    const byTab = ALL_CARDS.filter((c) => c.tab === activeView);
    return filterByPrice(byTab, priceFilter);
  }, [activeView, priceFilter]);

  const currentPriceLabel = PRICE_FILTERS.find((f) => f.id === priceFilter)?.label ?? "Filter";

  const tabLabel = TABS.find((t) => t.id === currentTab)?.label ?? "";

  return (
    <div style={{ backgroundColor: "var(--color-bg)" }}>

      {/* ══ FIXED TOP BAR ═════════════════════════════════ */}
      <header ref={menuRef} className="fixed top-0 left-0 right-0 z-40"
        style={{ borderBottom: menuOpen ? "none" : "1px solid var(--color-card-border)", backgroundColor: "rgba(252,251,249,0.88)", backdropFilter: "blur(16px)" }}>

        {/* ── Main bar row (68px tall) ── */}
        <div className="relative mx-auto max-w-screen-xl h-[68px] flex items-center px-5 md:px-8">

          {/* ━━ MOBILE layout: hamburger | logo | cart (flex, 3 zones) ━━ */}

          {/* Left: Hamburger (mobile only) */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-colors duration-150 flex-shrink-0"
            style={{ color: "#2D2B2A" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-tag-bg)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                fill="none" stroke="#2D2B2A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                fill="none" stroke="#2D2B2A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6"  x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>

          {/* Center: Logo — absolute center on mobile, absolute left on desktop */}
          <button
            onClick={() => handleNavigate("home")}
            aria-label="PrinceCards Home"
            className="
              md:hidden
              absolute left-1/2 -translate-x-1/2
              flex-shrink-0 transition-opacity duration-200 hover:opacity-80
            "
          >
            <span className="gold-shimmer text-xl font-bold"
              style={{ fontFamily: "var(--font-playfair), serif" }}>
              PrinceCards
            </span>
          </button>

          {/* Logo — desktop: absolute left */}
          <button
            onClick={() => handleNavigate("home")}
            aria-label="PrinceCards Home"
            className="hidden md:block absolute left-8 flex-shrink-0 transition-opacity duration-200 hover:opacity-80"
          >
            <span className="gold-shimmer text-2xl font-bold"
              style={{ fontFamily: "var(--font-playfair), serif" }}>
              PrinceCards
            </span>
          </button>

          {/* ── Desktop floating navbar – center (md and up) ── */}
          <nav className="absolute left-1/2 -translate-x-1/2 hidden md:block" aria-label="Main navigation">
            <div className="floating-nav flex items-center gap-1 px-2 py-2">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  id={`nav-${link.id}`}
                  onClick={() => handleNavigate(link.id)}
                  className={`nav-link ${activeView === link.id ? "active" : ""}`}
                  style={{ color: activeView === link.id ? undefined : "var(--color-muted)" }}
                  aria-current={activeView === link.id ? "page" : undefined}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Right: Cart icon (mobile) / Get a Quote (desktop) */}
          <div className="ml-auto flex items-center">
            {/* Cart — mobile only */}
            <button
              id="mobile-cart-btn"
              aria-label="Shopping cart"
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-colors duration-150"
              style={{ color: "#2D2B2A" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-tag-bg)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                fill="none" stroke="#2D2B2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </button>

            {/* Get a Quote — desktop only */}
            <button
              onClick={() => handleNavigate("matter")}
              className="hidden md:block px-4 py-2 rounded-full text-xs font-semibold tracking-wide uppercase transition-all duration-200 hover:scale-105"
              style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))", color: "white" }}>
              Get a Quote
            </button>
          </div>
        </div>

        {/* ── Mobile dropdown menu ── */}
        <div
          id="mobile-menu"
          aria-hidden={!menuOpen}
          className="mobile-menu-dropdown md:hidden"
          style={{
            maxHeight: menuOpen ? "320px" : "0px",
            opacity:   menuOpen ? 1 : 0,
            overflow:  "hidden",
            transition: "max-height 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease",
            borderTop: menuOpen ? "1px solid var(--color-card-border)" : "none",
            borderBottom: menuOpen ? "1px solid var(--color-card-border)" : "none",
            backgroundColor: "#FCFBF9",
            boxShadow: menuOpen ? "0 8px 32px rgba(45,43,42,0.12)" : "none",
          }}
        >
          <nav aria-label="Mobile navigation">
            <ul className="flex flex-col py-2">
              {NAV_LINKS.map((link) => {
                const isActive = activeView === link.id;
                return (
                  <li key={link.id}>
                    <button
                      id={`mobile-nav-${link.id}`}
                      onClick={() => handleNavigate(link.id)}
                      aria-current={isActive ? "page" : undefined}
                      className="w-full text-left px-6 py-3.5 text-base font-semibold transition-colors duration-150"
                      style={{
                        color: isActive ? "var(--color-accent)" : "var(--color-text)",
                        backgroundColor: isActive ? "var(--color-tag-bg)" : "transparent",
                        borderLeft: isActive ? "3px solid var(--color-accent)" : "3px solid transparent",
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "var(--color-tag-bg)"; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      {link.label}
                    </button>
                  </li>
                );
              })}
              {/* Get a Quote row */}
              <li className="px-6 pt-2 pb-3">
                <button
                  onClick={() => handleNavigate("matter")}
                  className="w-full py-3 rounded-xl text-sm font-semibold tracking-wide uppercase transition-all duration-200"
                  style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))", color: "white" }}
                >
                  Get a Quote
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* ══ PAGE BODY (offset for fixed header) ═══════════ */}
      <main className="pt-[68px]">

        {/* ── Home View ── */}
        {activeView === "home" && <HeroSection onNavigate={handleNavigate} />}

        {/* ── Matter View ── */}
        {activeView === "matter" && <MatterSection />}

        {/* ── Product Views (Wedding Cards / E-Card / E-Video) ── */}
        {isProductView(activeView) && (
          <>
            {/* Grid section */}
            <section
              className="mx-auto max-w-screen-xl px-4 md:px-8 py-10"
              onClick={() => filterOpen && setFilterOpen(false)}
              aria-label={`${tabLabel} collection`}>

              {/* Filter button – far right, aligned with grid top */}
              <div className="flex items-center justify-end mb-7">
                <div className="relative" id="filter-container">
                  <button id="filter-btn"
                    onClick={() => setFilterOpen((p) => !p)}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200"
                    style={{ border: "1px solid var(--color-card-border)", color: "var(--color-text)", backgroundColor: filterOpen ? "var(--color-tag-bg)" : "transparent" }}
                    aria-haspopup="listbox" aria-expanded={filterOpen}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    {currentPriceLabel}
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: filterOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {filterOpen && (
                    <div className="absolute right-0 mt-2 w-44 rounded-xl overflow-hidden z-50"
                      style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-card-border)", boxShadow: "var(--shadow-card-hover)" }}
                      role="listbox">
                      {PRICE_FILTERS.map((f) => {
                        const sel = priceFilter === f.id;
                        return (
                          <button key={f.id} id={`filter-${f.id}`} role="option" aria-selected={sel}
                            onClick={() => { setPriceFilter(f.id); setFilterOpen(false); }}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors duration-150"
                            style={{ backgroundColor: sel ? "var(--color-tag-bg)" : "transparent", color: sel ? "var(--color-accent-dark)" : "var(--color-text)", fontWeight: sel ? 600 : 400 }}
                            onMouseEnter={(e) => { if (!sel) e.currentTarget.style.backgroundColor = "var(--color-tag-bg)"; }}
                            onMouseLeave={(e) => { if (!sel) e.currentTarget.style.backgroundColor = "transparent"; }}>
                            {f.label}
                            {sel && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                                fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <Grid items={filteredItems} onCardClick={setSelectedCard} />
            </section>
          </>
        )}
      </main>

      {/* ══ FOOTER ════════════════════════════════════════ */}
      <footer className="border-t py-10 text-center" style={{ borderColor: "var(--color-card-border)" }}>
        <GoldDivider />
        <p className="mt-4 text-xl font-bold" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--color-accent-dark)" }}>
          PrinceCards
        </p>
        <p className="text-xs tracking-widest uppercase mt-1" style={{ color: "var(--color-muted)" }}>
          Crafting Timeless Wedding Invitations
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          {["Privacy Policy", "Terms of Service", "Contact Us"].map((link, i, arr) => (
            <span key={link} className="flex items-center gap-2">
              <a href="#" className="text-xs transition-colors duration-200 hover:text-[var(--color-accent-dark)]"
                style={{ color: "var(--color-muted)" }}>{link}</a>
              {i < arr.length - 1 && <span className="text-xs" style={{ color: "var(--color-card-border)" }}>·</span>}
            </span>
          ))}
        </div>
      </footer>

      {/* ══ MODAL ═════════════════════════════════════════ */}
      <Modal item={selectedCard} onClose={() => setSelectedCard(null)} />
    </div>
  );
}
