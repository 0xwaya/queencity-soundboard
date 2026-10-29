/**
 * Site-wide config that is not secret. Social profiles are listed here so the footer never
 * links to a network's home page. A profile with an empty URL is not rendered.
 */
export type SocialProfile = { network: "tiktok" | "instagram" | "x"; label: string; url: string };

export const SOCIAL_PROFILES: readonly SocialProfile[] = [
  { network: "tiktok", label: "TikTok @qcsoundboard", url: "https://www.tiktok.com/@qcsoundboard" },
  { network: "instagram", label: "Instagram @qc.soundboard", url: "https://www.instagram.com/qc.soundboard/" },
  // X account is being created; set NEXT_PUBLIC_SOCIAL_X_URL (or fill this in) once the handle exists.
  { network: "x", label: "X", url: process.env.NEXT_PUBLIC_SOCIAL_X_URL ?? "" },
];

export function activeSocialProfiles(): SocialProfile[] {
  return SOCIAL_PROFILES.filter((profile) => profile.url.startsWith("https://"));
}

export const AFFILIATE_DISCLOSURE = {
  en: "We may earn a commission from ticket links, at no extra cost to you.",
  es: "Podemos ganar una comisión por los enlaces de entradas, sin costo extra para ti.",
} as const;
