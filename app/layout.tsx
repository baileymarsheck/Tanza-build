import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CurrentProfileProvider } from "@/lib/current-profile";
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
  title: "Tanza Fellowship Hub",
  description: "The fellow and admin workspace for the Tanza Fellowship.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <CurrentProfileProvider>{children}</CurrentProfileProvider>
      </body>
    </html>
  );
}
