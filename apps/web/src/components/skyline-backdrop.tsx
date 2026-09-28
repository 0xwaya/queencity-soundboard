type Props = {
  /** Warmer tint for the Kentucky side of the river. */
  variant?: "cincinnati" | "covington";
  opacity?: 30 | 40 | 50 | 60;
};

const OPACITY_CLASS = {
  30: "opacity-30",
  40: "opacity-40",
  50: "opacity-50",
  60: "opacity-60",
} as const;

/**
 * Original night-skyline illustration used as a hero backdrop: a riverfront silhouette with
 * a tiara-topped tower, a stepped art-deco tower and a suspension bridge. Drawn rather than
 * photographed so it stays licence-free, tiny and crisp at any width.
 */
export default function SkylineBackdrop({ variant = "cincinnati", opacity = 50 }: Props) {
  const glow = variant === "covington" ? "#f0a94c" : "#5cc8ff";
  // Drawn without a sky layer: the card supplies the night, so the towers must sit lighter than it.
  const silhouette = variant === "covington" ? "#4a3f6b" : "#33456f";
  const glowId = `qcs-glow-${variant}`;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className={`absolute inset-0 h-full w-full ${OPACITY_CLASS[opacity]}`}
        viewBox="0 0 1200 420"
        preserveAspectRatio="xMidYMax slice"
        fill="none"
      >
        <defs>
          <radialGradient id={glowId} cx="50%" cy="100%" r="70%">
            <stop offset="0%" stopColor={glow} stopOpacity="0.5" />
            <stop offset="100%" stopColor={glow} stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="600" cy="340" rx="540" ry="150" fill={`url(#${glowId})`} />

        <g fill="#ffffff" opacity="0.5">
          <circle cx="120" cy="52" r="1.6" />
          <circle cx="300" cy="34" r="1.2" />
          <circle cx="468" cy="70" r="1.5" />
          <circle cx="742" cy="40" r="1.3" />
          <circle cx="910" cy="64" r="1.6" />
          <circle cx="1078" cy="30" r="1.2" />
          <circle cx="212" cy="96" r="1" />
          <circle cx="648" cy="104" r="1" />
          <circle cx="1006" cy="110" r="1.1" />
        </g>

        {/* Skyline silhouette */}
        <g fill={silhouette}>
          <rect x="60" y="250" width="70" height="140" />
          <rect x="146" y="214" width="54" height="176" />
          <rect x="214" y="268" width="62" height="122" />

          {/* Stepped art-deco tower */}
          <path d="M292 190h78v200h-78z" />
          <path d="M304 160h54v32h-54z" />
          <path d="M318 138h26v24h-26z" />
          <rect x="327" y="112" width="8" height="28" />

          <rect x="386" y="242" width="66" height="148" />
          <rect x="468" y="276" width="58" height="114" />

          {/* Tiara-crowned tower */}
          <path d="M546 168h86v222h-86z" />
          <path d="M556 168c8-26 24-42 33-52 9 10 25 26 33 52z" />
          <path d="M573 128c6-14 12-22 16-27 4 5 10 13 16 27z" />

          <rect x="650" y="230" width="72" height="160" />
          <rect x="740" y="262" width="56" height="128" />
          <rect x="812" y="206" width="64" height="184" />
          <rect x="836" y="176" width="16" height="32" />
          <rect x="894" y="256" width="60" height="134" />
          <rect x="972" y="228" width="70" height="162" />
          <rect x="1060" y="266" width="64" height="124" />
        </g>

        {/* Lit windows */}
        <g fill={glow} opacity="0.9">
          <rect x="74" y="266" width="6" height="9" />
          <rect x="92" y="286" width="6" height="9" />
          <rect x="110" y="266" width="6" height="9" />
          <rect x="74" y="308" width="6" height="9" />
          <rect x="160" y="232" width="6" height="9" />
          <rect x="178" y="256" width="6" height="9" />
          <rect x="160" y="286" width="6" height="9" />
          <rect x="228" y="288" width="6" height="9" />
          <rect x="250" y="312" width="6" height="9" />
          <rect x="306" y="212" width="7" height="10" />
          <rect x="330" y="212" width="7" height="10" />
          <rect x="306" y="248" width="7" height="10" />
          <rect x="348" y="248" width="7" height="10" />
          <rect x="330" y="288" width="7" height="10" />
          <rect x="400" y="262" width="6" height="9" />
          <rect x="424" y="286" width="6" height="9" />
          <rect x="400" y="316" width="6" height="9" />
          <rect x="482" y="296" width="6" height="9" />
          <rect x="504" y="320" width="6" height="9" />
          <rect x="562" y="196" width="7" height="10" />
          <rect x="588" y="196" width="7" height="10" />
          <rect x="612" y="196" width="7" height="10" />
          <rect x="562" y="238" width="7" height="10" />
          <rect x="600" y="238" width="7" height="10" />
          <rect x="586" y="282" width="7" height="10" />
          <rect x="664" y="252" width="6" height="9" />
          <rect x="690" y="276" width="6" height="9" />
          <rect x="664" y="306" width="6" height="9" />
          <rect x="754" y="284" width="6" height="9" />
          <rect x="776" y="310" width="6" height="9" />
          <rect x="826" y="228" width="6" height="9" />
          <rect x="850" y="252" width="6" height="9" />
          <rect x="826" y="288" width="6" height="9" />
          <rect x="908" y="278" width="6" height="9" />
          <rect x="930" y="304" width="6" height="9" />
          <rect x="986" y="250" width="6" height="9" />
          <rect x="1012" y="276" width="6" height="9" />
          <rect x="986" y="308" width="6" height="9" />
          <rect x="1076" y="288" width="6" height="9" />
          <rect x="1098" y="312" width="6" height="9" />
        </g>

        {/* Suspension bridge and river */}
        <g stroke="#05070f" fill="none" strokeWidth="5">
          <path d="M0 372h1200" />
          <path d="M150 372V286M1050 372V286" />
          <path d="M150 292C420 356 780 356 1050 292" />
          <path d="M0 316C60 300 110 292 150 290M1050 290c40 2 90 10 150 26" />
        </g>
        <g stroke={glow} strokeWidth="2" opacity="0.45">
          <path d="M150 292C420 356 780 356 1050 292" />
        </g>
        <rect y="372" width="1200" height="48" fill="#05070f" />
        <g stroke={glow} strokeWidth="2" opacity="0.28">
          <path d="M320 384v22M520 380v26M700 384v22M880 380v26" />
        </g>
      </svg>

      <div className="absolute inset-0 bg-linear-to-r from-[#08111f] via-[#08111f]/88 to-[#08111f]/60" />
      <div className="absolute inset-0 bg-linear-to-t from-[#08111f] via-transparent to-[#08111f]/70" />
    </div>
  );
}
