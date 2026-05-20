"use client";

import Image from "next/image";
import type { CardItem, TabType } from "@/lib/data";

interface CardProps {
  item: CardItem;
  onClick: (item: CardItem) => void;
}

const IMAGE_MAP: Record<TabType, string> = {
  physical: "/images/physical_card.png", // Wedding Cards
  ecard:    "/images/ecard.png",
  evideo:   "/images/evideo.png",
};

export default function Card({ item, onClick }: CardProps) {
  const imageSrc = IMAGE_MAP[item.tab];

  return (
    <article
      id={`card-${item.id}-${item.tab}`}
      className="card-lift group cursor-pointer rounded-xl overflow-hidden flex flex-col"
      style={{
        backgroundColor: "var(--color-white)",
        border: "1px solid var(--color-card-border)",
        boxShadow: "var(--shadow-card)",
        borderRadius: "var(--radius-card)",
      }}
      onClick={() => onClick(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(item)}
      aria-label={`View details for ${item.title}`}
    >
      {/* Image Container */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          // Physical: 1:1 square | E-Card: 9:16 portrait | E-Video: 16:9 landscape
          aspectRatio:
            item.tab === "physical"
              ? "1 / 1"
              : item.tab === "ecard"
              ? "9 / 16"
              : "16 / 9",
          backgroundColor: "var(--color-tag-bg)",
        }}
      >
        <Image
          src={imageSrc}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* E-Card dots overlay */}
        {item.tab === "ecard" && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === 0 ? "16px" : "6px",
                  backgroundColor:
                    i === 0 ? "var(--color-accent)" : "rgba(255,255,255,0.55)",
                }}
              />
            ))}
          </div>
        )}

        {/* E-Video play button */}
        {item.tab === "evideo" && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div
              className="play-pulse relative flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110"
              style={{ backgroundColor: "rgba(212, 175, 55, 0.88)" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="white"
                className="ml-0.5"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          </div>
        )}

        {/* Best Seller ribbon */}
        {item.isBestSeller && (
          <div
            className="absolute top-3 left-0 px-3 py-1 text-xs font-bold uppercase tracking-wider"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-white)",
              borderRadius: "0 6px 6px 0",
            }}
          >
            ★ Best Seller
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-4">
        {/* Tag pill */}
        <span
          className="mb-2 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: "var(--color-tag-bg)",
            color: "var(--color-accent-dark)",
          }}
        >
          {item.tag}
        </span>

        {/* Title */}
        <h3
          className="text-sm font-semibold leading-snug mb-2 line-clamp-2 group-hover:text-[var(--color-accent-dark)] transition-colors duration-200"
          style={{
            fontFamily: "var(--font-playfair), serif",
            color: "var(--color-text)",
          }}
        >
          {item.title}
        </h3>

        {/* Price + CTA */}
        <div className="mt-auto flex items-center justify-between">
          <span
            className="text-base font-bold"
            style={{ color: "var(--color-accent-dark)" }}
          >
            ₹{item.price}
          </span>
          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium transition-all duration-200 group-hover:bg-[var(--color-accent)] group-hover:text-white"
            style={{
              border: "1px solid var(--color-accent)",
              color: "var(--color-accent-dark)",
            }}
          >
            View
          </span>
        </div>
      </div>
    </article>
  );
}
