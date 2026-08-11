import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Space_Grotesk } from "next/font/google";
import { ThemeScript } from "@/components/ThemeToggle";
import { BRAND, siteUrl } from "@/lib/brand";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

// Display face for headings — the strongest single brand cue.
const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

// Document numbers, tracking ids and tags.
const mono = IBM_Plex_Mono({
  variable: "--font-mono-stack",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const title = `${BRAND.name} — Global courier & freight`;

export const metadata: Metadata = {
  // Without this, Next resolves social-preview and canonical URLs against
  // localhost and warns on every production build.
  metadataBase: new URL(siteUrl()),
  title: { default: title, template: `%s · ${BRAND.name}` },
  description: BRAND.tagline,
  applicationName: BRAND.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title,
    description: BRAND.tagline,
    url: "/",
  },
  twitter: { card: "summary_large_image", title, description: BRAND.tagline },
  // The console and auth screens are behind a login; only the public pages
  // should ever be indexed, and those opt in individually.
  robots: { index: true, follow: true },
};

/**
 * Root layout carries only the document chrome. The signed-in shell lives in
 * the (app) group, so public pages — landing, auth, tracking — render without it.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Runs before paint so a dark-mode user never sees a light flash. */}
        <ThemeScript />
      </head>
      <body className={`${inter.variable} ${display.variable} ${mono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
