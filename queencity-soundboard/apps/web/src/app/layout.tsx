import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/header";

export const metadata: Metadata = {
  title: "QueenCity Soundboard",
  description: "Live events, tickets, and merch.",
  icons: {
    icon: "/qcs-crown.svg",
  },
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
                  <a
                    className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:border-white/30 hover:text-white"
                    href="https://www.instagram.com/"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                  >
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="1.6" />
                      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
                      <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" />
                    </svg>
                  </a>
                  <a
                    className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:border-white/30 hover:text-white"
                    href="https://www.tiktok.com/"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="TikTok"
                  >
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M14 4c.6 2.4 2.5 4.3 4.8 4.8V11c-1.9-.1-3.5-.8-4.8-2v6.1c0 2.7-2.2 4.9-4.9 4.9S4.2 17.8 4.2 15.1c0-2.6 2.1-4.8 4.8-4.9v2.5c-1.2.1-2.2 1.1-2.2 2.4 0 1.4 1.1 2.4 2.4 2.4 1.3 0 2.4-1.1 2.4-2.4V4h2.4Z"
                        fill="currentColor"
                      />
                    </svg>
                  </a>
                  <a
                    className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:border-white/30 hover:text-white"
                    href="https://x.com/"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="X"
                  >
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 4h3.7l4.1 5.6L17.6 4H21l-6.3 8.6L21.4 20H17.8l-4.6-6.2L8.1 20H4.7l6.7-9.2L5 4Z"
                        fill="currentColor"
                      />
                    </svg>
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
