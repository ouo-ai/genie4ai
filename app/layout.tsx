import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Orbitron, Geist } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SiteProvider } from "@/components/site-provider";
import { SITE_URL } from "@/lib/site";
const description =
  "Genie 4 AI turns images and text into explorable 3D worlds with World Labs Marble. Preview scenes, download assets, and choose monthly or annual plans.";
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Genie 4 AI — Image & Text to 3D World Studio",
    template: "%s | Genie 4 AI",
  },
  description,
  alternates: { canonical: "/" },
  keywords: [
    "Genie 4 AI",
    "Genie 4 AI world generator",
    "image to 3D world",
    "text to 3D world",
    "World Labs Marble studio",
  ],
  openGraph: {
    title: "Genie 4 AI — A World Beyond the Frame",
    description,
    url: SITE_URL,
    siteName: "Genie 4 AI",
    type: "website",
    locale: "en_US",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Genie 4 AI — Image & Text to 3D Worlds",
    description,
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};
const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${geist.variable} antialiased dark`}
    >
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteProvider>
          <Navbar />
          {children}
          <Footer />
        </SiteProvider>
      </body>
    </html>
  );
}
