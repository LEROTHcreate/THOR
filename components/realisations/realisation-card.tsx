import Image from "next/image";
import Link from "next/link";
import { CATEGORY_LABELS, type Realisation } from "@/lib/realisations";

/**
 * Carte de réalisation — commune à la home et au portfolio.
 *
 * La couleur du projet ne sert qu'à l'identifier : une pastille et le lien.
 * Tout le reste est neutre, pour que cinq cartes côte à côte se lisent comme
 * une grille et non comme un nuancier. Le relief au survol vient de .lg-card,
 * en CSS pur — l'ancien tilt suivait la souris en JavaScript et re-rendait le
 * sous-arbre à chaque frame pour un effet que personne ne remarquait.
 */
export function RealisationCard({ item }: { item: Realisation }) {
  return (
    <article className="lg lg-card group relative flex h-full flex-col p-7 sm:p-8">
      {/* La capture du site en ligne, quand il y en a une : une carte de
          portfolio sans image demande au lecteur d'imaginer le résultat. */}
      {item.cover && (
        <div className="relative -mx-7 -mt-7 mb-7 aspect-[16/10] overflow-hidden rounded-t-[28px] border-b border-slate-900/[0.06] bg-slate-50 sm:-mx-8 sm:-mt-8">
          <Image
            src={item.cover}
            alt=""
            fill
            sizes="(min-width: 1024px) 350px, (min-width: 768px) 45vw, 100vw"
            className="object-cover object-top transition-transform duration-400 group-hover:scale-[1.03]"
            style={{ transitionTimingFunction: "var(--lg-ease)" }}
          />
        </div>
      )}

      <div className="flex items-center justify-between mb-7">
        <span className="inline-flex items-center gap-2.5">
          {item.logo ? (
            <Image
              src={item.logo}
              alt=""
              width={22}
              height={22}
              className="h-[22px] w-[22px] shrink-0 object-contain"
            />
          ) : (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: item.accent, boxShadow: `0 0 0 3px ${item.accent}1A` }}
            />
          )}
          <span className="text-[13px] font-medium text-slate-500">{item.tagline}</span>
        </span>
        <span className="text-[13px] text-slate-500 tabular-nums">{item.year}</span>
      </div>

      <h3 className="h-title text-2xl font-semibold tracking-tight text-slate-900 leading-tight mb-3">
        {item.name}
      </h3>

      <p className="text-[15px] text-slate-500 leading-[1.65] mb-6 flex-1">{item.summary}</p>

      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mb-7 text-[13px] text-slate-500">
        <span>{CATEGORY_LABELS[item.category]}</span>
        <span className="text-slate-200">·</span>
        <span>{item.sector}</span>
        {item.status === "soon" && (
          <>
            <span className="text-slate-200">·</span>
            <span className="text-slate-500">Bientôt</span>
          </>
        )}
      </div>

      <Link
        href={`/realisations/${item.slug}`}
        className="inline-flex items-center gap-2 text-[15px] font-medium transition-all duration-300 group-hover:gap-3 focus-visible:outline-none focus-visible:underline"
        style={{ color: item.accent }}
      >
        Voir le projet
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {/* Étend la zone cliquable à toute la carte sans imbriquer de lien */}
        <span className="absolute inset-0 rounded-[28px]" aria-hidden="true" />
      </Link>
    </article>
  );
}
