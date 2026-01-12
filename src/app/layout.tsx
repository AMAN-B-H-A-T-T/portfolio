import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Aman | Full Stack Developer Portfolio",
  description:
    "Experience the future of development with AmanOS - A premium interactive terminal portfolio.",
  icons: {
    shortcut: "/images/logo2.ico",
  },
};

import { SmoothScroll } from "@/components/SmoothScroll";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${jetbrainsMono.variable} antialiased selection:bg-[#a2ff00]/30 selection:text-[#a2ff00]`}
        style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
      >
        {children}
      </body>
    </html>
  );
}
