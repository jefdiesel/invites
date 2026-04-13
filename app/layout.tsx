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
  title: "Tasting Collective",
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
      <body className="min-h-screen">
        <nav className="sticky top-0 z-50 backdrop-blur-md bg-warm-50/90 dark:bg-warm-900/90 border-b border-warm-200/60 dark:border-warm-800/60">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="text-base font-bold tracking-tight text-warm-900 dark:text-warm-100">
              Tasting Collective
            </Link>
            <div className="flex items-center gap-1">
              <Link href="/" className="rounded-lg px-3 py-1.5 text-sm font-medium text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-warm-100 hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors">
                Polls
              </Link>
              <Link href="/members" className="rounded-lg px-3 py-1.5 text-sm font-medium text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-warm-100 hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors">
                Members
              </Link>
              <Link href="/events" className="rounded-lg px-3 py-1.5 text-sm font-medium text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-warm-100 hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors">
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
