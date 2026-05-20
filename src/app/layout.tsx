import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PrinceCards – Premium Indian Wedding Cards",
  description:
    "Discover exquisitely crafted Indian wedding invitations, digital e-cards, and cinematic wedding video invitations. Elevate your celebration with PrinceCards.",
  keywords: "Indian wedding cards, wedding invitations, e-cards, wedding video invitations, luxury wedding stationery",
  openGraph: {
    title: "PrinceCards – Premium Indian Wedding Cards",
    description: "Exquisitely crafted Indian wedding invitations, digital e-cards, and cinematic video invites.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
