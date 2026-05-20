"use client";

import Card from "@/components/Card";
import type { CardItem } from "@/lib/data";

interface GridProps {
  items: CardItem[];
  onCardClick: (item: CardItem) => void;
}

export default function Grid({ items, onCardClick }: GridProps) {
  if (items.length === 0) {
    return (
      <div className="col-span-4 flex flex-col items-center justify-center py-24 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--color-card-border)" }}
          className="mb-4"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <p
          className="text-lg font-semibold"
          style={{ color: "var(--color-muted)" }}
        >
          No cards found for this filter
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--color-card-border)" }}>
          Try selecting a different price range
        </p>
      </div>
    );
  }

  return (
    <div
      id="card-grid"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5"
    >
      {items.map((item, index) => (
        <div
          key={`${item.tab}-${item.id}`}
          style={{
            animationDelay: `${index * 40}ms`,
            opacity: 0,
            animation: `modal-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 40}ms forwards`,
          }}
        >
          <Card item={item} onClick={onCardClick} />
        </div>
      ))}
    </div>
  );
}
