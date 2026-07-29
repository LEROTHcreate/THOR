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
          <div className="max-w-3xl mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4 block">
              Portfolio
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 h-title leading-[1.02]">
              Nos <span className="font-light text-slate-500">réalisations.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-500 leading-relaxed max-w-xl">
              {live} projets en production, du logiciel métier certifié à
              l’application grand public. Le point commun : on part du terrain,
              pas d’un cahier des charges théorique.
            </p>
          </div>
        </Reveal>

        <RealisationsGrid items={items} sectors={sectors} />

        <Reveal>
          <div className="mt-20 rounded-[var(--radius-large)] border border-slate-200 bg-white px-6 py-10 sm:px-12 sm:py-14 text-center">
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-slate-900 h-title">
              Le prochain projet de cette page, <span className="font-semibold">c’est le vôtre ?</span>
            </h2>
            <p className="mt-4 text-slate-500 max-w-lg mx-auto text-[15px] leading-[1.7]">
              Décrivez votre activité en quelques lignes. On revient vers vous avec
              une première lecture de votre marché et de ce qu’il faudrait construire.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/contact?sujet=studio"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Parler de mon projet
              </Link>
              <Link
                href="/studio"
                className="inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold text-slate-700 border border-slate-200 transition-colors hover:bg-slate-50"
              >
                Comment on travaille →
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
