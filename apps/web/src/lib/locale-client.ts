"use client";

import { useSyncExternalStore } from "react";
import type { Locale } from "@/lib/i18n-shared";

/**
 * Case study #11: the root layout no longer reads the locale cookie on the server, so pages
 * can be cached. Shared chrome (header, footer) reads it in the browser instead.
 */
const listeners = new Set<() => void>();

function readCookieLocale(): Locale {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)qcs_locale=([^;]+)/);
  const value = match?.[1];
  return value === "es" || value === "es-ve" ? "es" : "en";
}

export function setClientLocale(locale: Locale) {
  const secureAttribute = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `qcs_locale=${locale}; path=/; max-age=31536000; samesite=lax${secureAttribute}`;
  document.documentElement.lang = locale;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useClientLocale(): Locale {
  return useSyncExternalStore(subscribe, readCookieLocale, () => "en");
}
