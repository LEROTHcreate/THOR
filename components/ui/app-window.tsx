import Image from "next/image";

/**
 * Fenêtre d'application — le cadre dans lequel on montre une interface réelle.
 *
 * Les captures de public/images/captures sont prises sur les sites en ligne :
 * ce qu'on affiche ici est le produit tel qu'il tourne, pas une maquette. Le
 * cadre reprend les codes d'une fenêtre de navigateur (barre, pastilles,
 * adresse en chasse fixe) parce que c'est le contexte qui rend une capture
 * lisible en un coup d'œil.
 *
 * Pas de `.lg` ici : le matériau verre suppose un backdrop-filter, or cette
 * surface est grande, elle défile, et elle est de toute façon entièrement
 * couverte par l'image. On paierait un flou que personne ne verrait.
 */
export function AppWindow({
  src,
  alt,
  label,
  accent,
  priority = false,
  className = "",
}: {
  /** Capture de l'interface. Absente : plaque au nom du projet. */
  src?: string;
  alt: string;
  /** Ce qu'affiche la barre d'adresse — l'hôte réel, jamais un domaine inventé. */
  label: string;
  accent: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure
      className={`overflow-hidden rounded-[20px] border border-slate-900/[0.07] bg-white/80 transition-transform duration-500 group-hover:-translate-y-1 ${className}`}
      style={{
        boxShadow: "0 24px 60px -32px rgba(11,18,32,0.40), 0 2px 6px -2px rgba(11,18,32,0.06)",
        transitionTimingFunction: "var(--lg-ease)",
      }}
    >
      <div className="flex items-center gap-3 border-b border-slate-900/[0.06] bg-white/70 px-4 py-2.5">
        <span aria-hidden="true" className="flex shrink-0 gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: accent, opacity: 0.65 }} />
          <span className="h-2 w-2 rounded-full bg-slate-900/[0.10]" />
          <span className="h-2 w-2 rounded-full bg-slate-900/[0.07]" />
        </span>
        <span className="mx-auto flex min-w-0 items-center gap-1.5 rounded-full bg-slate-900/[0.04] px-3 py-1 font-mono text-[11px] text-slate-400">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="shrink-0" aria-hidden="true">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          <span className="truncate">{label}</span>
        </span>
        {/* Contrepoids des pastilles, pour que l'adresse tombe au centre optique */}
        <span aria-hidden="true" className="w-[38px] shrink-0" />
      </div>

      <div className="relative aspect-[16/9] bg-slate-50">
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 620px, 100vw"
            className="object-cover object-top"
          />
        ) : (
          <div
            className="grid h-full place-items-center"
            style={{ background: `linear-gradient(135deg, ${accent}14 0%, transparent 70%)` }}
          >
            <span className="h-title text-2xl font-semibold tracking-tight" style={{ color: accent }}>
              {alt}
            </span>
          </div>
        )}
        {/* Reflet unique, aligné sur la source de lumière du reste de la page */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(255,255,255,0.22) 0%, transparent 38%)",
          }}
        />
      </div>
    </figure>
  );
}

/** L'adresse telle qu'on la montre : l'hôte pour un site externe, le chemin sinon. */
export function windowLabel(href: string): string {
  if (!/^https?:\/\//.test(href)) return href;
  return new URL(href).hostname.replace(/^www\./, "");
}
