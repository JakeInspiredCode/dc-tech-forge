import type { Metadata, Viewport } from "next";
// Self-hosted so the app makes no third-party requests (which also lets the
// Content-Security-Policy stay at font-src 'self'). These packages register the
// real family names, which the codebase references literally in 100+ places.
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-sans/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/jetbrains-mono/700.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "./globals.css";
import DataProvider from "@/lib/data/provider";
import BadgeBanner from "@/components/badge-banner";
import Nav from "@/components/nav";
import SampleDataBanner from "@/components/sample-data-banner";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.url),
  title: { default: BRAND.name, template: `%s · ${BRAND.name}` },
  description: BRAND.description,
  applicationName: BRAND.name,
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: BRAND.name,
    description: BRAND.description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.name,
    description: BRAND.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#050508",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">
        <DataProvider>
          <Nav />
          <SampleDataBanner />
          {children}
          <BadgeBanner />
        </DataProvider>
      </body>
    </html>
  );
}
