import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RDTAXCASES.com: International R&D Tax Credit Case Law Database",
  description:
    "The most extensive database of international R&D tax credit cases on the internet, a Swanson Reed database.",
  verification: {
    google: "TERSbjeE1Du-wlvXRSexZDUAGIZKLuheHTCcyHf413g",
  },
  // Signals the "site name" Google shows in search results (bold text next
  // to the favicon) — without this, Google falls back to showing the bare
  // domain instead of a readable name.
  openGraph: {
    siteName: "R&D Tax Credit Case Law Database",
  },
};

// Site-wide Organization/ProfessionalService entity, present on every page.
// @type mirrors creditarmor.ai's pattern (Organization + ProfessionalService)
// so Google's Rich Results Test detects both "Organization" and "Local
// businesses" the same way it does for that sibling Swanson Reed site.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": ["Organization", "ProfessionalService"],
  "@id": "https://rdtaxcases.com/#organization",
  name: "RDTAXCASES.com",
  url: "https://rdtaxcases.com",
  description:
    "The most extensive database of international R&D tax credit cases on the internet, a Swanson Reed database.",
  logo: {
    "@type": "ImageObject",
    url: "https://rdtaxcases.com/branding/logo-full.png",
  },
  image: "https://rdtaxcases.com/branding/logo-full.png",
  address: {
    "@type": "PostalAddress",
    streetAddress: "1120 South Freeway, Suite 123C",
    addressLocality: "Fort Worth",
    addressRegion: "TX",
    postalCode: "76104",
    addressCountry: "US",
  },
  // Same coordinates creditarmor.ai uses for this exact office address.
  geo: {
    "@type": "GeoCoordinates",
    latitude: 32.7357,
    longitude: -97.3292,
  },
  parentOrganization: {
    "@type": "Organization",
    name: "Swanson Reed",
    url: "https://www.swansonreed.com/",
  },
  email: "hello@rdtaxcases.com",
  telephone: "+1-512-333-2076",
  hasMap:
    "https://www.google.com/maps/search/?api=1&query=1120+South+Freeway%2C+Suite+123C%2C+Fort+Worth%2C+TX+76104%2C+United+States",
  sameAs: [
    "https://www.trustpilot.com/review/rdtaxcases.com",
    "https://www.goodfirms.co/company/swanson-reed-r-d-tax-credit-case-studies",
    "https://clutch.co/profile/swanson-reed-rd-tax-credit-case-studies",
    "https://nextdoor.com/pages/swanson-reed-rd-tax-credit-case-studies-fort-worth-tx",
    "https://www.linkedin.com/company/swanson-reed-r-d-tax-credit-case-studies",
  ],
};

// Controls the "site name" shown next to the favicon in Google search
// results (see https://developers.google.com/search/docs/appearance/site-names).
// No "potentialAction" SearchAction here: the /search page is client-side
// only with no URL query parameter, so a searchbox action would point at a
// URL that doesn't actually pre-fill a search.
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://rdtaxcases.com/#website",
  name: "R&D Tax Credit Case Law Database",
  alternateName: "RDTAXCASES.com",
  url: "https://rdtaxcases.com",
  description:
    "The most extensive database of international R&D tax credit cases on the internet, a Swanson Reed database.",
  inLanguage: "en-US",
  publisher: {
    "@id": "https://rdtaxcases.com/#organization",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
