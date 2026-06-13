import type { Metadata, Viewport } from "next";
import { Bebas_Neue, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";
import { Nav } from "@/components/nav";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});
const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "R2·STUDIO", template: "%s · R2·STUDIO" },
  description: "Content operations for the 365-day reel project.",
  applicationName: "R2·STUDIO",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "R2·STUDIO" },
  // Private personal tool — keep it out of search engines.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className="dark">
      <body
        className={`${bebas.variable} ${dmSans.variable} ${dmMono.variable} bg-bg text-text font-sans min-h-[100dvh]`}
      >
        <QueryProvider>
          <div className="md:pl-[200px] min-h-[100dvh]">
            {children}
          </div>
          <Nav />
        </QueryProvider>
      </body>
    </html>
  );
}
