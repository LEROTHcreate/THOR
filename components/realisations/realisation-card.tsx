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
      <div className="flex items-center justify-between mb-7">
        <span className="inline-flex items-center gap-2.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: item.accent, boxShadow: `0 0 0 3px ${item.accent}1A` }}
          />
          <span className="text-[13px] font-medium text-slate-500">{item.tagline}</span>
        </span>
        <span className="text-[13px] text-slate-300 tabular-nums">{item.year}</span>
      </div>

      <h3 className="h-title text-2xl font-semibold tracking-tight text-slate-900 leading-tight mb-3">
        {item.name}
      </h3>

      <p className="text-[15px] text-slate-500 leading-[1.65] mb-6 flex-1">{item.summary}</p>

      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mb-7 text-[13px] text-slate-400">
        <span>{CATEGORY_LABELS[item.category]}</span>
        <span className="text-slate-200">·</span>
        <span>{item.sector}</span>
        {item.status === "soon" && (
          <>
            <span className="text-slate-200">·</span>
            <span className="text-slate-400">Bientôt</span>
          </>
        )}
      </div>

      <Link
        href={`/realisations/${item.slug}`}
        className="inline-flex items-center gap-2 text-[15px] font-medium transition-all duration-500 group-hover:gap-3 focus-visible:outline-none focus-visible:underline"
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
