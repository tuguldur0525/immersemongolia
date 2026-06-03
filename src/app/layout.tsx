// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Noto_Sans, Noto_Sans_Mongolian } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import QueryProvider from "@/components/providers/QueryProvider";
import "@/styles/globals.css";

const notoSans = Noto_Sans({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const notoMongolian = Noto_Sans_Mongolian({
  subsets: ["mongolian"],
  variable: "--font-mongolian",
  display: "swap",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: {
    default: "Immerse Mongolia — Монголын Бизнес Нээлтийн Платформ",
    template: "%s | Immerse Mongolia",
  },
  description:
    "Монголын рестораны, зочид буудал, дэлгүүр, амралтын газруудыг интерактив газрын зургаар нээ. 360° виртуал аялал.",
  keywords: [
    "Монгол",
    "бизнес",
    "ресторан",
    "зочид буудал",
    "газрын зураг",
    "Immerse Mongolia",
  ],
  authors: [{ name: "Immerse Mongolia" }],
  creator: "Immerse Mongolia LLC",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://immersemongolia.mn",
  ),
  openGraph: {
    type: "website",
    locale: "mn_MN",
    alternateLocale: "en_US",
    url: "/",
    siteName: "Immerse Mongolia",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Immerse Mongolia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@immersemongolia",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.mapbox.com" />
        <link rel="preconnect" href="https://events.mapbox.com" />
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v3.9.0/mapbox-gl.css"
          rel="stylesheet"
        />
        <script
          defer
          data-domain="immersemongolia.mn"
          src="https://plausible.io/js/script.js"
        />
      </head>
      <body
        className={`${notoSans.variable} ${notoMongolian.variable} font-sans antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "var(--toast-bg)",
                  color: "var(--toast-color)",
                  borderRadius: "12px",
                  border: "1px solid var(--toast-border)",
                },
              }}
            />
            <Analytics />
            <SpeedInsights />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
