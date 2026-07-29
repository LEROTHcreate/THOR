import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { SaasPortfolio } from "@/components/home/saas-portfolio";
import { ThorValues } from "@/components/home/thor-values";

export const metadata: Metadata = {
  title: "Produits",
  description:
    "Les plateformes métier THOR pour les professionnels de santé : Clair Vision, Clair Audition, PharmaPlanning. Hébergement HDS et conformité intégrée.",
};

export default function ProduitsPage() {
  return (
    <div className="relative pt-32 sm:pt-40">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-6">
        <Reveal>
          <div className="max-w-3xl">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4 block">
              THOR Produits
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 h-title leading-[1.02]">
              Des plateformes <span className="font-light text-slate-500">prêtes à exercer.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-500 leading-[1.7] max-w-xl">
              Opticiens, audioprothésistes, pharmaciens : chaque plateforme est
              construite pour un métier précis, avec la conformité santé intégrée
              dès le départ plutôt qu’ajoutée après coup.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              <Link
                href="/contact?sujet=demo"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Réserver une démo
              </Link>
              <Link
                href="/tarifs"
                className="inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold text-slate-700 border border-slate-200 transition-colors hover:bg-slate-50"
              >
                Voir les tarifs →
              </Link>
            </div>
          </div>
        </Reveal>
      </div>

      <SaasPortfolio />
      <ThorValues />
    </div>
  );
}
