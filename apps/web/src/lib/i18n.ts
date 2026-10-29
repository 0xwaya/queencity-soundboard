import { cookies } from "next/headers";
import type { Locale } from "@/lib/i18n-shared";

export type { Locale };

/**
 * Server-side locale for pages that still render Spanish copy on the server (events, merch,
 * about). Calling this makes the page dynamic; the root layout must not call it (case study #11).
 */
export const getLocale = async (): Promise<Locale> => {
  const cookieStore = await cookies();
  const value = cookieStore.get("qcs_locale")?.value;
  // "es-ve" is still accepted so visitors with the previous cookie keep Spanish.
  if (value === "es" || value === "es-ve") return "es";
  return "en";
};
