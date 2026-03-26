import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FirmForge — AI Firmware Project Architect",
  description:
    "Describe your embedded project. FirmForge searches open-source repos, assembles a complete layered firmware codebase, and delivers it in minutes.",
  keywords: ["firmware", "embedded", "STM32", "ESP32", "RTOS", "driver", "HAL", "AI"],
  openGraph: {
    title: "FirmForge",
    description: "AI-powered firmware project generator",
    url: "https://firmforge.dev",
    siteName: "FirmForge",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
