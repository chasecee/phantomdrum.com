import type { Metadata } from "next";
import { Space_Mono, Brygada_1918 } from "next/font/google";
import "./globals.css";

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const brygada1918 = Brygada_1918({
  variable: "--font-brygada-1918",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "phantom drum",
  description: "phantom drum",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceMono.variable} ${brygada1918.variable} antialiased bg-black`}
      >
        {children}
      </body>
    </html>
  );
}
