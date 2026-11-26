import { configuredResaleProviders, RESALE_PROVIDER_LABELS } from "@/lib/affiliate";
import { goResaleHref } from "@/lib/go";

/** "Sold out? Check resale" (case study #16). Renders nothing until a resale template env is set. */
export default function ResaleLinks({ eventId }: { eventId: string }) {
  const links = configuredResaleProviders()
    .map((provider) => ({ provider, href: goResaleHref(eventId, provider) }))
    .filter((link): link is { provider: (typeof link)["provider"]; href: string } => Boolean(link.href));
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-slate-300">Sold out?</span>
      {links.map(({ provider, href }) => (
        <a
          key={provider}
          href={href}
          target="_blank"
          rel="sponsored noopener"
          className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 font-semibold text-slate-100 hover:bg-white/10"
        >
          Check resale on {RESALE_PROVIDER_LABELS[provider]}
        </a>
      ))}
    </div>
  );
}
