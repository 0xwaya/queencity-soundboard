import Image from "next/image";

type Props = {
  src?: string | null;
  /** Higher values show more of the artwork; keep text contrast in mind when raising it. */
  opacity?: 30 | 40 | 50;
  priority?: boolean;
};

const OPACITY_CLASS = {
  30: "opacity-30",
  40: "opacity-40",
  50: "opacity-50",
} as const;

/**
 * Translucent event artwork behind card content. Decorative only, so it is hidden from
 * assistive tech and always sits under a scrim that preserves text contrast.
 */
export default function EventBackdrop({ src, opacity = 40, priority = false }: Props) {
  if (!src) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <Image
        src={src}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        priority={priority}
        className={`object-cover ${OPACITY_CLASS[opacity]} saturate-[1.1] contrast-[1.05]`}
      />
      <div className="absolute inset-0 bg-linear-to-r from-[#08111f] via-[#08111f]/85 to-[#08111f]/55" />
      <div className="absolute inset-0 bg-linear-to-t from-[#08111f] via-transparent to-transparent" />
    </div>
  );
}
