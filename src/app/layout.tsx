import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { ThemeScript } from "@/components/ThemeToggle";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--font-mono-stack", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — Freight console`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.tagline,
  applicationName: BRAND.name,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Runs before paint so a dark-mode user never sees a white flash. */}
        <ThemeScript />
      </head>
      <body className={`${inter.variable} ${mono.variable} antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
