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
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-100">QueenCity Soundboard</p>
              <p className="text-xs text-slate-400">Culture-forward nights. Ticketed. Elevated.</p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Contact</p>
                <a className="font-semibold text-slate-200 hover:text-white" href="mailto:event@queencitysoundboard.com">
                  event@queencitysoundboard.com
                </a>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Social</p>
                <div className="flex items-center gap-3">
                  <a className="hover:text-white" href="https://www.instagram.com/" target="_blank" rel="noreferrer">
                    Instagram
                  </a>
                  <a className="hover:text-white" href="https://www.tiktok.com/" target="_blank" rel="noreferrer">
                    TikTok
                  </a>
                  <a className="hover:text-white" href="https://x.com/" target="_blank" rel="noreferrer">
                    X
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
