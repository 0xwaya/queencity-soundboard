export function normalizeHttpsUrl(value?: string | null): string | null {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Accepts a local asset path or an HTTPS remote image. Characters that could terminate a
 * CSS url() or an HTML attribute are rejected outright rather than escaped.
 */
export function normalizeImageUrl(value?: string | null): string | null {
  if (!value) return null;

  const candidate = value.trim();
  if (!candidate || /["'()\\\s<>]/.test(candidate)) return null;

  // Local asset, but not a protocol-relative URL such as //evil.test/x.png.
  if (candidate.startsWith("/") && !candidate.startsWith("//")) return candidate;

  return normalizeHttpsUrl(candidate);
}
