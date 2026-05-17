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
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <a href="/" className="text-xl font-bold text-gray-900">
              Prompt Hub
            </a>
            <nav className="flex items-center gap-3 text-sm font-medium text-gray-600">
              <a href="/prompts" className="hover:text-gray-900">
                Prompts
              </a>
              <a href="/settings/models" className="hover:text-gray-900">
                Models
              </a>
              <a
                href="/prompts/create"
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
              >
                New Prompt
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
          Prompt Hub — powered by OpenRouter
        </footer>
      </body>
    </html>
  );
}
