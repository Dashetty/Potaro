import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

// Kensmark.03 Bold — display face for the wordmark + bookmark titles.
// Ships Bold only, so `font-synthesis: none` in globals.css keeps the browser
// from faking other weights. BoldSlant is registered as the italic style.
const kensmark = localFont({
  src: [
    {
      path: "./fonts/Kensmark-03-Bold.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Kensmark-03-BoldSlant.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-kensmark",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Potaro — Bookmark Manager",
  description:
    "A personal bookmark manager. Save links, tag them, and find them again.",
};

export const viewport: Viewport = {
  themeColor: "#151114",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${kensmark.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
