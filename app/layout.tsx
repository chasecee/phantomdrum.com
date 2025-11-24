import type { Metadata } from "next";
import { Space_Mono, Brygada_1918 } from "next/font/google";
import "./globals.css";
import DevBreakpoint from "./components/DevBreakpoint";

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: true,
});

const brygada1918 = Brygada_1918({
  variable: "--font-brygada-1918",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.phantomdrum.com";
const ogImageUrl = `${BASE_URL}/img/og-image.jpg`;

export const metadata: Metadata = {
  title: "phantom drum",
  description:
    "Phantom Drum is built on moody synth layers, chopped vocals, organic funk patterns and dusty records. The debut INITIALIZE is an instrumental deep-dive into mood and texture.",
  openGraph: {
    title: "Phantom Drum - Debut Album Out Now",
    description:
      "Phantom Drum is built on moody synth layers, chopped vocals, organic funk patterns and dusty records. The debut INITIALIZE is an instrumental deep-dive into mood and texture.",
    url: BASE_URL,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Phantom Drum INITIALIZE cover art",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Phantom Drum - Debut Album Out Now",
    description:
      "Phantom Drum is built on moody synth layers, chopped vocals, organic funk patterns and dusty records. The debut INITIALIZE is an instrumental deep-dive into mood and texture.",
    images: [ogImageUrl],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceMono.variable} ${brygada1918.variable}  bg-black`}
      >
        {children}
        {process.env.NODE_ENV === "development" && <DevBreakpoint />}
      </body>
    </html>
  );
}
