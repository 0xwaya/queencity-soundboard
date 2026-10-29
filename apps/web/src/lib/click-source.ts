/** Name of the 7-day cookie set by src/proxy.ts from ?src=, ?ref= or ?utm_source=. */
export const SOURCE_COOKIE = "qcs_src";
export const DEFAULT_SOURCE = "organic";

/** Browser-only: the visitor's captured traffic source, or "organic". */
export function readClientSource(): string {
  if (typeof document === "undefined") return DEFAULT_SOURCE;
  const match = document.cookie.match(/(?:^|;\s*)qcs_src=([^;]+)/);
  if (!match) return DEFAULT_SOURCE;
  try {
    return decodeURIComponent(match[1]).slice(0, 64) || DEFAULT_SOURCE;
  } catch {
    return DEFAULT_SOURCE;
  }
}
