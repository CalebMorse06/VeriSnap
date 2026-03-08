import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "VeriSnap — Real-World Challenges on XRPL",
  description: "Accept challenges, submit live proof, win XRP. Powered by XRPL Escrow, Pinata IPFS, and Gemini AI.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VeriSnap",
  },
  openGraph: {
    title: "VeriSnap",
    description: "Real-world challenges backed by XRP escrow",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#18181b",
};

import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { DemoBanner } from "@/components/demo/DemoBanner";
import { ClientProviders } from "@/components/providers/ClientProviders";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientProviders>
          <DemoBanner />
          {children}
          <InstallPrompt />
        </ClientProviders>
      </body>
    </html>
  );
}
