"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Card from "@/components/Card";
import type { CardItem } from "@/lib/data";

interface GridProps {
  items: CardItem[];
  onCardClick: (item: CardItem) => void;
}

const ITEMS_PER_PAGE = 16;

// ── Pagination helper: returns page numbers + "..." gaps ──────────────────────
function buildPageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];

  if (current > 3) pages.push("…");

  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("…");
  pages.push(total);

  return pages;
}

export default function Grid({ items, onCardClick }: GridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);

  // Reset to page 1 whenever the item list changes (filter / tab change)
  useEffect(() => { setCurrentPage(1); }, [items]);

  const totalPages   = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const startIdx     = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems    = items.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  const pageRange    = buildPageRange(currentPage, totalPages);

  const goTo = useCallback((page: number) => {
    if (page === currentPage) return;
    setCurrentPage(page);
    // Smooth-scroll to just above the grid
    const el = gridRef.current;
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 88; // account for fixed header
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, [currentPage]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ color: "var(--color-card-border)" }} className="mb-4">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <p className="text-lg font-semibold" style={{ color: "var(--color-muted)" }}>
          No cards found for this filter
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--color-card-border)" }}>
          Try selecting a different price range
        </p>
      </div>
    );
  }

  return (
    <div ref={gridRef}>
      {/* ── Card Grid ──────────────────────────────────────── */}
      <div
        id="card-grid"
        className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5"
      >
        {pageItems.map((item, index) => (
          <div
            key={`${item.tab}-${item.id}`}
            style={{
              animationDelay: `${index * 30}ms`,
              opacity: 0,
              animation: `modal-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 30}ms forwards`,
            }}
          >
            <Card item={item} onClick={onCardClick} />
          </div>
        ))}
      </div>

      {/* ── Pagination bar ─────────────────────────────────── */}
      {totalPages > 1 && (
        <nav
          aria-label="Page navigation"
          className="mt-10 flex items-center justify-center gap-1.5"
        >
          {/* Prev */}
          <button
            id="pagination-prev"
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className="pagination-btn pagination-arrow"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Page numbers */}
          {pageRange.map((p, i) =>
            p === "…" ? (
              <span key={`ellipsis-${i}`} className="pagination-ellipsis">…</span>
            ) : (
              <button
                key={p}
                id={`pagination-page-${p}`}
                onClick={() => goTo(p as number)}
                aria-current={p === currentPage ? "page" : undefined}
                aria-label={`Page ${p}`}
                className={`pagination-btn ${p === currentPage ? "pagination-active" : ""}`}
              >
                {p}
              </button>
            )
          )}

          {/* Next */}
          <button
            id="pagination-next"
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
            className="pagination-btn pagination-arrow"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </nav>
      )}

      {/* ── Results count ───────────────────────────────────── */}
      {totalPages > 1 && (
        <p className="mt-4 text-center text-xs" style={{ color: "var(--color-muted)" }}>
          Showing {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, items.length)} of {items.length} designs
        </p>
      )}
    </div>
  );
}
