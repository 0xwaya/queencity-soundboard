import { cookies } from "next/headers";

export type Locale = "en" | "es";

export const getLocale = async (): Promise<Locale> => {
  const cookieStore = await cookies();
  const value = cookieStore.get("qcs_locale")?.value;
  // "es-ve" is still accepted so visitors with the previous cookie keep Spanish.
  if (value === "es" || value === "es-ve") return "es";
  return "en";
};
