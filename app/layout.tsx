import type { Metadata } from "next";
import {
  IBM_Plex_Mono,
  IBM_Plex_Sans_Condensed,
  Source_Serif_4,
} from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const display = IBM_Plex_Sans_Condensed({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});
const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "WhyThisMoment — Cricket, with the moment explained",
    template: "%s · WhyThisMoment",
  },
  description:
    "A calmer, data-grounded explanation for the tactical moment you just saw in an IPL match.",
  applicationName: "WhyThisMoment",
  openGraph: {
    title: "WhyThisMoment",
    description: "Cricket, with the moment explained.",
    siteName: "WhyThisMoment",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${serif.variable} ${mono.variable}`}
      >
        <a className="skip-link" href="#main-content">
          Skip to the match
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
