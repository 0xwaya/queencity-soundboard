import Image from "next/image";

type Props = {
  /** Warmer tint for the Kentucky side of the river. */
  variant?: "cincinnati" | "covington";
  opacity?: 30 | 40 | 50 | 60;
  priority?: boolean;
};

const OPACITY_CLASS = {
  30: "opacity-30",
  40: "opacity-40",
  50: "opacity-50",
  60: "opacity-60",
} as const;

/**
 * Cincinnati riverfront at night behind hero cards.
 * Source: goodfreephotos.com, published as public domain / CC0.
 */
export default function SkylineBackdrop({ variant = "cincinnati", opacity = 50, priority = false }: Props) {
  const tint =
    variant === "covington"
      ? "bg-linear-to-tr from-amber-500/20 via-transparent to-transparent"
      : "bg-linear-to-tr from-cyan-500/20 via-transparent to-transparent";

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <Image
        src="/cincinnati-skyline-night.jpg"
        alt=""
        fill
        sizes="100vw"
        priority={priority}
        className={`object-cover object-[center_72%] ${OPACITY_CLASS[opacity]}`}
      />
      <div className={`absolute inset-0 ${tint}`} />
      {/* Scrims keep headline and body copy legible over the photograph. */}
      <div className="absolute inset-0 bg-linear-to-r from-[#08111f]/85 via-[#08111f]/70 to-[#08111f]/30" />
      <div className="absolute inset-0 bg-linear-to-t from-[#08111f]/80 via-transparent to-[#08111f]/45" />
    </div>
  );
}
