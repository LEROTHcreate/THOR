"use client";

import Link from "next/link";
import { usePointerParallax, PARALLAX_INITIAL } from "@/lib/usePointerParallax";
import { getAllRealisations } from "@/lib/realisations";

/* Les deux chiffres suivent le portfolio : livrer un projet les met à jour. */
const LIVRES = getAllRealisations().filter((r) => r.status === "live");
const NB_PROJETS = LIVRES.length;
const NB_SECTEURS = new Set(LIVRES.map((r) => r.sector)).size;

/* ──────────────────────────────────────────────────────────────────────────
   Gouttes de verre.

   Elles ne décorent pas : elles montrent le matériau. Chacune est une vraie
   lentille (backdrop-filter) qui réfracte et sature le fond derrière elle,
   ce qu'aucun calque blanc ne sait imiter.

   Quatre au maximum — chaque goutte est une passe de composition plein
   calque. Elles disparaissent sous 768 px (règle .lg-drop dans globals.css).

   PERF — elles ne dérivent plus. Une goutte est un `backdrop-filter` : la
   déplacer en boucle interdit au compositeur de mettre son flou en cache et
   le force à re-flouter à chaque frame, indéfiniment. Posées sur un fond
   désormais immobile, les quatre gouttes sont floutées une fois puis ne
   coûtent plus rien au repos. `depth` module ce qu'il reste de mouvement :
   le parallaxe au pointeur, qui ne tourne que pendant le geste. Les grosses
   gouttes, perçues plus proches, se déplacent davantage.
   ──────────────────────────────────────────────────────────────────────── */
const DROPS = [
  { size: 148, top: "10%", left: "6%",   depth: 1.6 },
  { size: 86,  top: "24%", right: "10%", depth: 2.4 },
  { size: 196, top: "64%", right: "4%",  depth: 1.1 },
  { size: 62,  top: "76%", left: "13%",  depth: 3.0 },
];

function GlassDrops() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      {DROPS.map((d, i) => (
        <div
          key={i}
          className="lg-drop"
          style={{
            width: d.size,
            height: d.size,
            top: d.top,
            left: d.left,
            right: d.right,
            transform: `translate(calc(var(--px) * ${d.depth}), calc(var(--py) * ${d.depth}))`,
            transition: "transform 700ms var(--lg-ease)",
          }}
        />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

export default function ThorHero() {
  const ref = usePointerParallax<HTMLElement>(14, 10);

  return (
    <section
      ref={ref}
      className="relative flex items-center justify-center overflow-hidden"
      style={{ minHeight: "calc(100vh - 5rem)", ...PARALLAX_INITIAL }}
    >
      <GlassDrops />

      <div className="relative z-10 mx-auto w-full max-w-[900px] px-5 sm:px-6 py-20 text-center">

        <div className="rise">
          <div
            className="lg lg-pill mb-10"
            style={{
              transform: "translate(calc(var(--px) * 0.4), calc(var(--py) * 0.4))",
              transition: "transform 700ms var(--lg-ease)",
            }}
          >
            <span>Studio de création · Éditeur de logiciels métier</span>
          </div>
        </div>

        <div className="rise" style={{ animationDelay: "80ms" }}>
          <h1
            className="h-title text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold leading-[0.95] tracking-tight text-slate-900"
            style={{
              transform: "translate(calc(var(--px) * -0.5), calc(var(--py) * -0.3))",
              transition: "transform 700ms var(--lg-ease)",
            }}
          >
            De l’idée
            <br />
            au site en ligne.
          </h1>
        </div>

        <div className="rise" style={{ animationDelay: "160ms" }}>
          <p className="mx-auto mt-8 max-w-xl text-lg sm:text-xl text-slate-500 leading-[1.6]">
            On cadre le projet, on mesure le marché que vous pouvez atteindre,
            on construit. Puis on reste là.
          </p>
        </div>

        <div className="rise mt-12 flex flex-col sm:flex-row items-center justify-center gap-3" style={{ animationDelay: "240ms" }}>
          <Link href="#branches" className="lg lg-btn lg-btn-ink w-full sm:w-auto">
            <span>Par où commencer</span>
          </Link>
          <Link href="/realisations" className="lg lg-btn w-full sm:w-auto">
            <span>Voir nos réalisations</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        <div className="rise mt-20 flex items-center justify-center gap-10 sm:gap-16" style={{ animationDelay: "320ms" }}>
          {[
            { value: String(NB_PROJETS),  label: "projets en production" },
            { value: String(NB_SECTEURS), label: "secteurs couverts" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="h-title text-3xl sm:text-4xl font-semibold text-slate-900 tabular-nums">
                {s.value}
              </div>
              <div className="mt-1.5 text-[13px] text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Repère de défilement — la seule invitation à descendre */}
      <div
        aria-hidden="true"
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-500"
        style={{ animation: "floatY 3s ease-in-out infinite" }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}
