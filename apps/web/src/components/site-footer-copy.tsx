"use client";

import { useEffect } from "react";
import { useClientLocale } from "@/lib/locale-client";
import { AFFILIATE_DISCLOSURE } from "@/lib/site";

/** Locale-aware footer text, rendered in the browser so the root layout stays cacheable (case study #11). */
export default function SiteFooterCopy({ year }: { year: number }) {
  const locale = useClientLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const tagline = locale === "es" ? "Noches con cultura. Entradas listas. Al máximo nivel." : "Culture-forward nights. Ticketed. Elevated.";
  const credit = locale === "es" ? "Construido por" : "Built by";

  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold text-slate-100">QueenCity Soundboard</p>
      <p className="truncate text-xs text-slate-400 max-w-xs sm:max-w-none">{tagline}</p>
      <p className="max-w-md text-[11px] text-slate-300">{AFFILIATE_DISCLOSURE[locale]}</p>
      <p className="text-[11px] text-slate-400">
        © {year} QueenCity Soundboard. {credit}{" "}
        <span className="wayalabs-word text-slate-200">wayalabs</span>.
      </p>
    </div>
  );
}
