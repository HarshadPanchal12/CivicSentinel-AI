import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import ConvexClientProvider from "@/components/ConvexClientProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GeoFenceAI — Hyper-Local Targeting Engine",
  description: "AI-driven geo-fencing platform for transparent, context-aware civic governance. Powered by Next.js, Convex, Gemini AI, Neo4j, and Polygon blockchain.",
  keywords: ["geo-fencing", "civic governance", "AI notifications", "knowledge graph", "blockchain transparency"],
  openGraph: {
    title: "GeoFenceAI — Hyper-Local Targeting Engine",
    description: "Delivering personalized governance updates to citizens based on real-time physical location.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <ClerkProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
