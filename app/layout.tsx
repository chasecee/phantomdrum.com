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

export const metadata: Metadata = {
  title: "phantom drum",
  description:
    "Phantom Drum is built on moody synth layers, chopped vocals, organic funk patterns and dusty records. The debut INITIALIZE is an instrumental deep-dive into mood and texture.",
  openGraph: {
    title: "Phantom Drum - Debut Album Out Now",
    description:
      "Phantom Drum is built on moody synth layers, chopped vocals, organic funk patterns and dusty records. The debut INITIALIZE is an instrumental deep-dive into mood and texture.",
    images: [
      {
        url: "/img/album-art.jpg",
        width: 1200,
        height: 1200,
        alt: "Phantom Drum INITIALIZE cover art",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "phantom drum",
    description:
      "Phantom Drum is built on moody synth layers, chopped vocals, organic funk patterns and dusty records. The debut INITIALIZE is an instrumental deep-dive into mood and texture.",
    images: ["/img/album-art.jpg"],
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
