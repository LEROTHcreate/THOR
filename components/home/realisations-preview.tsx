import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { RealisationCard } from "@/components/realisations/realisation-card";
import { getFeaturedRealisations } from "@/lib/realisations";

export function RealisationsPreview() {
  const featured = getFeaturedRealisations(3);

  return (
    <section className="relative py-24 sm:py-32 md:py-40">
      <div className="mx-auto max-w-[1100px] px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="h-title text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 leading-[1.05]">
              Ce qu’on a déjà construit.
            </h2>
            <p className="mt-6 text-lg text-slate-500 leading-[1.6]">
              Chaque projet part d’un besoin réel et se juge sur ce qu’il
              fait gagner à ceux qui l’utilisent tous les jours.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-5">
          {featured.map((item) => (
            <Reveal key={item.slug}>
              <RealisationCard item={item} />
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-14 text-center">
            <Link href="/realisations" className="lg lg-btn">
              <span>Tout le portfolio</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
