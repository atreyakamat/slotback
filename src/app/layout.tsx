import type { Metadata, Viewport } from "next";
import { Archivo_Black, Inter_Tight } from "next/font/google";
import { ThemeScript } from "@/components/theme/theme-script";
import "./globals.css";

const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin", "latin-ext"], display: "swap" });
const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  weight: "400",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  // Absolute URLs for canonical links and social previews, e.g. https://slotback.atreyakamat.dev in production.
  metadataBase: new URL(appUrl),
  openGraph: {
    type: "website",
    siteName: "SlotBack",
    title: "SlotBack: make every opening count",
    description: "Refill last-minute cancellations from your waitlist over WhatsApp or SMS, and see the revenue you got back.",
    locale: "en_IN",
  },
  twitter: { card: "summary" },
  title: { default: "SlotBack: make every opening count", template: "%s · SlotBack" },
  description:
    "SlotBack refills last-minute cancellations from your waitlist automatically, and shows you the revenue recovered.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5efe1" },
    { media: "(prefers-color-scheme: dark)", color: "#07140f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${interTight.variable} ${archivoBlack.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
