import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/header";

export const metadata: Metadata = {
  title: "QueenCity Soundboard",
  description: "Live events, tickets, and merch.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#07090f] text-slate-100 antialiased">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
        <footer className="border-t border-white/10 bg-[#0b1020]">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-4 py-6 text-xs text-slate-400 md:flex-row md:items-center">
            <span>QueenCity Soundboard</span>
            <a className="font-semibold text-slate-200 hover:text-white" href="mailto:event@queencitysoundboard.com">
              event@queencitysoundboard.com
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
