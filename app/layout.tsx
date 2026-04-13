import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Club Poll",
  description: "Member management and event planning for dinner clubs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-white">
        <nav className="sticky top-0 z-50 bg-white border-b border-warm-200">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="text-base font-bold tracking-tight text-warm-900">
              Club Poll
            </Link>
            <div className="flex items-center gap-1">
              <Link href="/" className="rounded-lg px-3 py-1.5 text-sm font-medium text-warm-600 hover:text-warm-900 hover:bg-warm-50 transition-colors">
                Polls
              </Link>
              <Link href="/members" className="rounded-lg px-3 py-1.5 text-sm font-medium text-warm-600 hover:text-warm-900 hover:bg-warm-50 transition-colors">
                Members
              </Link>
              <Link href="/events" className="rounded-lg px-3 py-1.5 text-sm font-medium text-warm-600 hover:text-warm-900 hover:bg-warm-50 transition-colors">
                Events
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
