import type { Metadata } from "next";
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
  title: "Prompt Hub",
  description: "Store prompts, run them across multiple LLMs, compare results side-by-side.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] relative">

        {/* Decorative background bubbles */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -top-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-[#d97a72] opacity-20 blur-3xl" />
          <div className="absolute top-1/2 -left-40 h-72 w-72 rounded-full bg-[#e8a49e] opacity-25 blur-3xl" />
          <div className="absolute bottom-10 right-1/3 h-52 w-52 rounded-full bg-[#c47068] opacity-15 blur-3xl" />
          <div className="absolute top-1/4 left-1/3 h-36 w-36 rounded-full bg-[#f2c4be] opacity-30 blur-2xl" />
        </div>

        <header className="relative border-b border-[#f0d9d5] bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <a href="/" className="text-xl font-bold text-[#2d1a19] tracking-tight">
              Prompt Hub
            </a>
            <nav className="flex items-center gap-4 text-sm font-medium text-[#9e7b78]">
              <a href="/settings/providers" className="hover:text-[#c47068] transition-colors">
                Providers
              </a>
              <a
                href="/import"
                className="rounded-full bg-[#c47068] px-4 py-1.5 text-white hover:bg-[#a85a55] transition-colors"
              >
                Import
              </a>
            </nav>
          </div>
        </header>

        <main className="relative mx-auto max-w-6xl px-4 py-8">{children}</main>

        <footer className="relative border-t border-[#f0d9d5] py-6 text-center text-sm text-[#c4a8a5]">
          Prompt Hub
        </footer>
      </body>
    </html>
  );
}
