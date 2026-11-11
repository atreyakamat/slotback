import type { Metadata, Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";

const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", display: "swap" });

const url = "https://slotback.atreyakamat.dev";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: "SlotBack | Fill last-minute cancellations automatically",
  description:
    "When a client cancels, SlotBack offers the slot to your waitlist on WhatsApp. The first to tap gets it. Built in Goa for salons and clinics.",
  openGraph: {
    title: "SlotBack | Fill last-minute cancellations automatically",
    description: "Turn last-minute cancellations into booked appointments, automatically.",
    url,
    siteName: "SlotBack",
    locale: "en_IN",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#faf8f3" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={instrument.variable}>
      <body>{children}</body>
    </html>
  );
}
