import type { Metadata, Viewport } from "next";
import { Anybody, Martian_Mono, Onest } from "next/font/google";
import "./globals.css";

const anybody = Anybody({ subsets: ["latin"], axes: ["wdth"], variable: "--font-anybody", display: "swap" });
const onest = Onest({ subsets: ["latin"], variable: "--font-onest", display: "swap" });
const martian = Martian_Mono({ subsets: ["latin"], axes: ["wdth"], variable: "--font-martian", display: "swap" });

const url = "https://slotback.atreyakamat.dev";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: "SlotBack: refill cancelled appointments in minutes",
  description:
    "When a client cancels, SlotBack offers the slot to your waitlist on WhatsApp. The first to tap gets it. Built in Goa for salons and clinics.",
  openGraph: {
    title: "SlotBack: cancelled? Refilled.",
    description: "Turn last-minute cancellations into booked appointments, automatically.",
    url,
    siteName: "SlotBack",
    locale: "en_IN",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#07140f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${anybody.variable} ${onest.variable} ${martian.variable}`}>
      <head>
        <noscript>
          <style>{`.letter{opacity:1;transform:none;--wdth:100;--wght:800}`}</style>
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
