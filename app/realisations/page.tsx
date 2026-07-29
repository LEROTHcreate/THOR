import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { getAllRealisations, getSectors } from "@/lib/realisations";
import { RealisationsGrid } from "./realisations-grid";

export const metadata: Metadata = {
  title: "Réalisations",
  description:
    "Les projets construits par THOR : plateformes métier, sites sur mesure et outils. Chaque réalisation part d'un métier réel.",
};

export default function RealisationsPage() {
  const items = getAllRealisations();
  const sectors = getSectors();
  const live = items.filter((r) => r.status === "live").length;

  return (
    <div className="relative pt-32 pb-24 sm:pt-40">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-6">
        <Reveal>
          <div className="mb-16 max-w-3xl">
            <span className="mono-label mb-5 block text-slate-500">Portfolio</span>
            <h1 className="h-title text-5xl sm:text-6xl font-semibold tracking-tight text-slate-900 leading-[0.98]">
              Nos réalisations.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-500 leading-[1.6]">
              {live} projets en production, du logiciel métier certifié à
              l’application grand public. Le point commun : on part du terrain,
              pas d’un cahier des charges théorique.
            </p>
          </div>
        </Reveal>

        <RealisationsGrid items={items} sectors={sectors} />

        <Reveal>
          <div className="lg lg-card relative mt-24 overflow-hidden px-6 py-14 sm:px-14 sm:py-16 text-center">
            <span aria-hidden="true" className="grid-paper pointer-events-none" style={{ position: "absolute", inset: 0 }} />
            <h2 className="h-title relative mx-auto max-w-lg text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 leading-[1.05]">
              Le prochain projet de cette page, c’est le vôtre ?
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[17px] text-slate-500 leading-[1.65]">
              Décrivez votre activité en quelques lignes. On revient vers vous avec
              une première lecture de votre marché et de ce qu’il faudrait construire.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/contact?sujet=studio" className="lg lg-btn lg-btn-ink w-full sm:w-auto">
                <span>Parler de mon projet</span>
              </Link>
              <Link href="/studio" className="lg lg-btn w-full sm:w-auto">
                <span>Comment on travaille</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
