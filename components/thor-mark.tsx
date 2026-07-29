/**
 * Signe de marque THOR — le « T convergent ».
 * Source de vérité unique du logo, alignée sur app/icon.svg et les icônes PWA.
 * Monochrome par principe : la couleur reste la propriété de Clair Vision et Clair Audition.
 */
export function ThorMark({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="currentColor"
      role="img"
      aria-label="THOR"
      className={`shrink-0 ${className}`}
    >
      <g transform="translate(0 -4)">
        <rect x="28" y="24" width="44" height="8" rx="4" />
        <rect x="46" y="24" width="8" height="60" rx="4" />
        <rect x="8" y="24" width="16" height="8" rx="4" />
        <rect x="76" y="24" width="16" height="8" rx="4" />
      </g>
    </svg>
  );
}

/**
 * Le signe posé sur le pavé noir de la marque, comme sur l'icône d'application.
 * `size` est la taille du pavé ; le signe occupe la zone sûre à 62 %.
 */
export function ThorMarkTile({
  size = 44,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-[#0A0A0B] text-white ${className}`}
      style={{ width: size, height: size }}
    >
      <ThorMark size={Math.round(size * 0.62)} />
    </span>
  );
}
