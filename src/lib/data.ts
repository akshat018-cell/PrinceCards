export type TabType = "physical" | "ecard" | "evideo";
export type ViewType = "home" | "physical" | "ecard" | "evideo" | "matter";

export type PriceRange = "all" | "0-10" | "11-20" | "21-50" | "50+";

export interface GalleryImage {
  src: string;
  label: string;
}

export interface CardItem {
  id: number;
  title: string;
  price: number;
  tag: string;
  isBestSeller: boolean;
  tab: TabType;
}

// Navigation links mapping view → display label
export const NAV_LINKS: { id: ViewType; label: string }[] = [
  { id: "home",     label: "Home" },
  { id: "physical", label: "Wedding Cards" },
  { id: "ecard",    label: "E-Card" },
  { id: "evideo",   label: "E-Video" },
  { id: "matter",   label: "Matter" },
];

// Internal tabs (used by grid) — "physical" stays the same ID
export const TABS: { id: TabType; label: string }[] = [
  { id: "physical", label: "Wedding Cards" },
  { id: "ecard",    label: "E-Cards" },
  { id: "evideo",   label: "E-Videos" },
];

export const PRICE_FILTERS: { id: PriceRange; label: string }[] = [
  { id: "all",   label: "All Prices" },
  { id: "0-10",  label: "₹0 – ₹10" },
  { id: "11-20", label: "₹11 – ₹20" },
  { id: "21-50", label: "₹21 – ₹50" },
  { id: "50+",   label: "₹50+" },
];

// Gallery images per tab
export const GALLERY_IMAGES: Record<TabType, GalleryImage[]> = {
  physical: [
    { src: "/images/envelope.png",       label: "Envelope" },
    { src: "/images/physical_card.png",  label: "Front" },
    { src: "/images/inside.png",         label: "Inside" },
    { src: "/images/detail.png",         label: "Detail" },
  ],
  ecard: [
    { src: "/images/ecard.png",          label: "Preview 1" },
    { src: "/images/physical_card.png",  label: "Preview 2" },
    { src: "/images/inside.png",         label: "Preview 3" },
    { src: "/images/detail.png",         label: "Preview 4" },
  ],
  evideo: [
    { src: "/images/evideo.png",         label: "Thumbnail" },
    { src: "/images/physical_card.png",  label: "Scene 1" },
    { src: "/images/ecard.png",          label: "Scene 2" },
    { src: "/images/inside.png",         label: "Scene 3" },
  ],
};

// Sample matter wordings
export const MATTER_TEMPLATES = [
  {
    id: 1,
    style: "Traditional Hindi",
    bride: "Priya Sharma",
    groom: "Rahul Gupta",
    date: "15 February 2026",
    venue: "The Leela Palace, New Delhi",
    text: "श्री गणेशाय नमः\nसादर आमंत्रण\nहम आपको सूचित करते हैं कि हमारे पुत्र राहुल गुप्ता एवं सुश्री प्रिया शर्मा का विवाह संस्कार दिनांक 15 फरवरी 2026 को संपन्न होगा।",
  },
  {
    id: 2,
    style: "English Formal",
    bride: "Anjali Mehta",
    groom: "Vikram Singh",
    date: "22 March 2026",
    venue: "Taj Lake Palace, Udaipur",
    text: "Together with their families,\nAnjali Mehta & Vikram Singh\nrequest the honour of your presence\nat their wedding celebration.",
  },
  {
    id: 3,
    style: "Bilingual (Hindi + English)",
    bride: "Kavya Nair",
    groom: "Arjun Pillai",
    date: "8 April 2026",
    venue: "Grand Hyatt, Mumbai",
    text: "With the blessings of our elders\nwe joyfully invite you to celebrate\nthe wedding of Kavya & Arjun.\nआपकी उपस्थिति हमारे लिए सम्मान की बात होगी।",
  },
];

// Card data
const physicalTitles = [
  "Regal Marigold Suite",
  "Peacock Feather Delight",
  "Lotus Bloom Elegance",
  "Golden Elephant March",
  "Mughal Garden Classic",
  "Rajput Palace Heritage",
  "Bougainvillea Dreams",
  "Temple Arch Grandeur",
];
const ecardTitles = [
  "Digital Diya Glow",
  "Animated Mehendi Bliss",
  "Celestial Rangoli",
  "Floral Mandala Loop",
  "Vintage Haveli Drift",
  "Starlit Sangeet Night",
  "Monsoon Rose Slide",
  "Pearl & Pashmina Card",
];
const evideoTitles = [
  "Cinematic Baraat Film",
  "Sunset Phera Reel",
  "Bride's Grace Story",
  "Mandap Moments Film",
  "Golden Hour Saga",
  "Royal Procession Reel",
  "Festive Lights Film",
  "Love in Udaipur Film",
];
const TAGS = [
  "Trending", "New Arrival", "Editor's Pick", "Limited Edition",
  "Best Seller", "Exclusive", "Premium", "Signature",
];

const PHYSICAL_PRICES = [15, 28, 9, 45, 22, 55, 8, 35, 18, 42, 12, 60, 7, 32, 25, 48];
const ECARD_PRICES    = [6, 18, 12, 38, 5, 25, 42, 9, 15, 30, 8, 22, 45, 11, 27, 36];
const EVIDEO_PRICES   = [20, 65, 35, 12, 75, 28, 55, 18, 40, 80, 22, 50, 30, 68, 15, 45];

function makeCards(count: number, tab: TabType, titles: string[], prices: number[]): CardItem[] {
  return Array.from({ length: count }, (_, i) => {
    const tag = TAGS[i % TAGS.length];
    return {
      id: i + 1,
      title: titles[i % titles.length],
      price: prices[i % prices.length],
      tag,
      isBestSeller: tag === "Best Seller" || tag === "Trending",
      tab,
    };
  });
}

const physicalCards = makeCards(100, "physical", physicalTitles, PHYSICAL_PRICES);
const eCards        = makeCards(100, "ecard",    ecardTitles,    ECARD_PRICES);
const eVideos       = makeCards(100, "evideo",   evideoTitles,   EVIDEO_PRICES);

export const ALL_CARDS: CardItem[] = [...physicalCards, ...eCards, ...eVideos];

export function filterByPrice(items: CardItem[], range: PriceRange): CardItem[] {
  if (range === "all") return items;
  return items.filter((item) => {
    if (range === "0-10")  return item.price <= 10;
    if (range === "11-20") return item.price >= 11 && item.price <= 20;
    if (range === "21-50") return item.price >= 21 && item.price <= 50;
    if (range === "50+")   return item.price > 50;
    return true;
  });
}
