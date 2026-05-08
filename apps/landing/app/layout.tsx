import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap"
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap"
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://personal-industry-scout.prin7r.com"),
  title: "Personal Industry Scout — A research analyst on your desk, every Monday.",
  description:
    "A weekly five-minute briefing on the industry you actually run. Deals, hires, releases, regulatory moves — distilled by an analyst, signed and dated. Subscription, paid in stablecoin. Cancel any week.",
  openGraph: {
    title: "Personal Industry Scout — A research analyst on your desk, every Monday.",
    description:
      "A weekly five-minute briefing on the industry you actually run. Distilled by an analyst, signed and dated.",
    type: "website",
    siteName: "Personal Industry Scout"
  },
  robots: { index: true, follow: true }
};

export const viewport: Viewport = {
  themeColor: "#FAFAF8"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="bg-canvas text-ink antialiased">{children}</body>
    </html>
  );
}
