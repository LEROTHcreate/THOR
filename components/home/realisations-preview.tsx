import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { RealisationCard } from "@/components/realisations/realisation-card";
import { getAllRealisations, getFeaturedRealisations } from "@/lib/realisations";

export function RealisationsPreview() {
  const featured = getFeaturedRealisations(3);
  const total = getAllRealisations().filter((r) => r.status === "live").length;

  return (
    <section className="relative py-16 sm:py-24 md:py-28">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-6">
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
            <div className="max-w-xl">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4 block">
                Nos réalisations
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 h-title">
                Ce que nous avons <span className="font-light text-slate-500">déjà construit.</span>
              </h2>
              <p className="mt-5 text-base text-slate-500 leading-relaxed">
                {total} projets en production. Chacun part d&apos;un besoin réel et se
                juge sur ce qu&apos;il fait gagner à ceux qui l&apos;utilisent tous les jours.
              </p>
            </div>

            <Link
              href="/realisations"
              className="shrink-0 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-white/60 transition-all duration-200 hover:ring-white/90 hover:shadow-[0_4px_20px_rgba(99,102,241,0.10)]"
              style={{
                background: "rgba(255,255,255,0.70)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
              }}
            >
              Tout le portfolio
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((item, i) => (
            <Reveal key={item.slug}>
              <RealisationCard item={item} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
