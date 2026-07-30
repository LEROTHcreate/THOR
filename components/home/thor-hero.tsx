"use client";

import Link from "next/link";
import { usePointerParallax, PARALLAX_INITIAL } from "@/lib/usePointerParallax";

/* ──────────────────────────────────────────────────────────────────────────
   Hero de la page nocturne.

   Réduit à trois éléments : le titre, une ligne, deux boutons. La pastille
   d'accroche et les deux compteurs ont sauté — ils occupaient le centre de
   l'écran, c'est-à-dire exactement l'endroit où le système solaire doit se
   voir. Sur une page dont le décor est le sujet, chaque ligne de texte en
   trop est une planète masquée.

   Les quatre gouttes de verre ont disparu pour une autre raison :
   une goutte est un `backdrop-filter`, et son arrière-plan est désormais un
   canvas WebGL qui change à chaque frame. Le compositeur devrait re-flouter
   quatre calques soixante fois par seconde, sans jamais rien mettre en cache
   — exactement la boucle qu'on a passé la session à supprimer. Le décor
   derrière étant devenu un vrai volume, il porte à lui seul la profondeur que
   les gouttes simulaient.

   Ce qui reste du geste : le parallaxe au pointeur sur le texte, en variables
   CSS, sans re-rendu React.
   ──────────────────────────────────────────────────────────────────────── */

export default function ThorHero() {
  const ref = usePointerParallax<HTMLElement>(14, 10);

  return (
    <section
      ref={ref}
      className="relative flex items-center justify-center"
      style={{ minHeight: "calc(100vh - 5rem)", ...PARALLAX_INITIAL }}
    >
      <div className="relative z-10 mx-auto w-full max-w-[900px] px-5 sm:px-6 py-20 text-center">


        <div className="rise" style={{ animationDelay: "80ms" }}>
          <h1
            className="h-title text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold leading-[0.95] tracking-tight text-white"
            style={{
              transform: "translate(calc(var(--px) * -0.5), calc(var(--py) * -0.3))",
              transition: "transform 700ms var(--lg-ease)",
              /* Le titre traverse le champ d'étoiles : sans cette ombre, une
                 étoile qui passe derrière une lettre la troue. */
              textShadow: "0 2px 44px rgba(2,3,10,0.8)",
            }}
          >
            De l’idée
            <br />
            au site en ligne.
          </h1>
        </div>

        <div className="rise" style={{ animationDelay: "160ms" }}>
          <p
            className="mx-auto mt-8 max-w-xl text-lg sm:text-xl leading-[1.6] text-slate-300/85"
            style={{ textShadow: "0 1px 22px rgba(2,3,10,0.85)" }}
          >
            On cadre, on construit, on reste là.
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

      </div>

      {/* Repère de défilement — la seule invitation à descendre */}
      <div
        aria-hidden="true"
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/35"
        style={{ animation: "floatY 3s ease-in-out infinite" }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}
