import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { ProjectShowcase } from "@/components/realisations/project-showcase";
import { SocleConformite } from "@/components/produits/socle-conformite";
import { getAllRealisations } from "@/lib/realisations";

export const metadata: Metadata = {
  title: "Produits",
  description:
    "Les plateformes métier THOR : Clair Vision, Clair Audition, PharmaPlanning, et les outils de l'écosystème. Hébergement HDS et conformité intégrée.",
};

const PRODUITS = getAllRealisations().filter(
  (r) => r.branch === "produits" && r.status === "live",
);

/* Les publics ne se mélangent pas : un praticien et un particulier ne lisent
   pas la même page. Les deux groupes restent donc séparés par un intertitre. */
const SANTE = PRODUITS.filter((r) => r.sector === "Santé");
const AUTRES = PRODUITS.filter((r) => r.sector !== "Santé");

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-5">
      <span className="mono-label shrink-0 text-slate-400">{children}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-slate-900/[0.07]" />
    </div>
  );
}

export default function ProduitsPage() {
  return (
    <div className="relative pb-24">
      {/* ── Ouverture ─────────────────────────────────────────────────── */}
      <section className="relative pt-32 sm:pt-40">
        <div className="mx-auto max-w-[1100px] px-5 sm:px-6 text-center">
          <div className="rise">
            <span className="lg lg-pill mb-9">
              <span className="mono-label text-slate-500">THOR · Produits</span>
            </span>
          </div>

          <h1
            className="rise h-title text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-slate-900 leading-[0.95]"
            style={{ animationDelay: "80ms" }}
          >
            Des plateformes
            <br />
            prêtes à exercer.
          </h1>

          <p
            className="rise mx-auto mt-8 max-w-xl text-lg text-slate-500 leading-[1.6]"
            style={{ animationDelay: "160ms" }}
          >
            Opticiens, audioprothésistes, pharmaciens : chaque plateforme est
            construite pour un métier précis, avec la conformité santé intégrée
            dès le départ plutôt qu’ajoutée après coup.
          </p>

          <div
            className="rise mt-11 flex flex-col sm:flex-row items-center justify-center gap-3"
            style={{ animationDelay: "240ms" }}
          >
            <Link href="/contact?sujet=demo" className="lg lg-btn lg-btn-ink w-full sm:w-auto">
              <span>Réserver une démo</span>
            </Link>
            <Link href="/tarifs" className="lg lg-btn w-full sm:w-auto">
              <span>Voir les tarifs</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          <div
            className="rise mt-14 flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
            style={{ animationDelay: "320ms" }}
          >
            {[
              `${PRODUITS.length} produits en production`,
              `${SANTE.length} métiers de santé`,
              "Hébergement HDS",
            ].map((fact, i) => (
              <span key={fact} className="flex items-center gap-4">
                {i > 0 && <span aria-hidden="true" className="text-slate-300">·</span>}
                <span className="mono-label text-slate-400">{fact}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Les plateformes santé ─────────────────────────────────────── */}
      <section className="relative pt-24 sm:pt-32">
        <div className="mx-auto max-w-[1100px] px-5 sm:px-6">
          <Reveal>
            <GroupLabel>Santé · Plateformes métier</GroupLabel>
          </Reveal>

          <div className="mt-16 space-y-24 sm:space-y-32">
            {SANTE.map((item, i) => (
              <Reveal key={item.slug}>
                <ProjectShowcase item={item} flip={i % 2 === 1} priority={i === 0} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <SocleConformite />

      {/* ── Les autres produits de l'écosystème ───────────────────────── */}
      {AUTRES.length > 0 && (
        <section className="relative pt-8">
          <div className="mx-auto max-w-[1100px] px-5 sm:px-6">
            <Reveal>
              <GroupLabel>Hors santé · Outils de l’écosystème</GroupLabel>
            </Reveal>

            <div className="mt-16 space-y-24 sm:space-y-32">
              {AUTRES.map((item, i) => (
                <Reveal key={item.slug}>
                  <ProjectShowcase item={item} flip={i % 2 === 1} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Appel à l'action ──────────────────────────────────────────── */}
      <section className="relative pt-28 sm:pt-36">
        <div className="mx-auto max-w-[900px] px-5 sm:px-6">
          <Reveal>
            <div className="lg lg-card relative overflow-hidden px-6 py-14 sm:px-14 sm:py-16 text-center">
              <span aria-hidden="true" className="grid-paper pointer-events-none" style={{ position: "absolute", inset: 0 }} />
              <h2 className="h-title relative mx-auto max-w-md text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 leading-[1.05]">
                Voir l’outil tourner, en vrai.
              </h2>
              <p className="mx-auto mt-5 max-w-md text-[17px] text-slate-500 leading-[1.65]">
                Une démonstration guidée, sur votre métier, avec vos cas d’usage.
                Trente minutes suffisent pour savoir si ça vous convient.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/contact?sujet=demo" className="lg lg-btn lg-btn-ink w-full sm:w-auto">
                  <span>Réserver une démo</span>
                </Link>
                <Link href="/demo" className="lg lg-btn w-full sm:w-auto">
                  <span>Visite interactive</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
