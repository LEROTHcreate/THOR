import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Qui sommes-nous",
  description:
    "THOR est une entreprise française installée à Marseille. On y conçoit des sites et des logiciels métier, avec une idée fixe : rendre à l'Europe le rayonnement qu'elle mérite.",
};

const ACCENT = "#6366F1";

/** Les coordonnées d'où part l'onde de la carte, en toutes lettres. */
const ORIGIN_COORDS = "43.2965° N · 5.3698° E";

/* ──────────────────────────────────────────────────────────────────────────
   Qui sommes-nous.

   Deuxième page nocturne de la vitrine, après l'accueil. Son décor n'est pas
   décoratif : c'est la carte du continent, avec une onde qui part de
   Marseille (cf. components/about/europe-backdrop.tsx). Le texte est donc
   volontairement clairsemé — le fond porte la moitié du propos, et une page
   dense l'aurait entièrement masqué.
   ──────────────────────────────────────────────────────────────────────── */

const PREUVES = [
  {
    title: "Vos données restent ici",
    desc: "Les données de santé de nos plateformes sont hébergées en France, chez un hébergeur certifié HDS. C'est une contrainte que l'on s'impose, pas une case à cocher.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3 4 6v6c0 4.4 3.4 8.3 8 9 4.6-.7 8-4.6 8-9V6l-8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Le code vous revient",
    desc: "À la fin d'un projet, le dépôt, le nom de domaine et les accès sont à votre nom. Personne ne peut vous couper l'accès à votre propre outil, nous compris.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
      </svg>
    ),
  },
  {
    title: "Conforme dès la première ligne",
    desc: "RGPD, contrastes AA, navigation au clavier. Ce n'est pas une couche qu'on ajoute la veille de la mise en ligne : c'est la façon dont on écrit.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M9 15l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Un interlocuteur, pas un ticket",
    desc: "Vous parlez à la personne qui a écrit le code. Avant la facture, et après aussi — c'est le seul service après-vente dans lequel on croit.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
      </svg>
    ),
  },
];

const JAMAIS = [
  "Revendre vos données, ni celles des personnes que vous recevez.",
  "Vous enfermer dans un abonnement dont on ne sort pas.",
  "Facturer une ligne dont vous n'avez pas entendu parler avant de signer.",
];

export default function QuiSommesNousPage() {
  return (
    <div className="relative">
      {/* ── Ouverture ───────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[86vh] items-center justify-center">
        <div className="mx-auto w-full max-w-[900px] px-5 sm:px-6 py-20 text-center">
          <div className="rise">
            <span className="lg lg-pill mb-9">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: ACCENT, boxShadow: `0 0 8px ${ACCENT}` }}
              />
              <span className="mono-label text-slate-300/70">Qui sommes-nous</span>
            </span>
          </div>

          <h1
            className="rise h-title text-5xl sm:text-6xl md:text-7xl font-semibold leading-[0.95] tracking-tight text-white"
            style={{ animationDelay: "80ms", textShadow: "0 2px 44px rgba(2,3,10,0.85)" }}
          >
            D’ici,
            <br />
            pour toute l’Europe.
          </h1>

          <p
            className="rise mx-auto mt-8 max-w-xl text-lg sm:text-xl leading-[1.6] text-slate-300/85"
            style={{ animationDelay: "160ms", textShadow: "0 1px 22px rgba(2,3,10,0.85)" }}
          >
            THOR est une entreprise française installée à Marseille. On y conçoit
            des sites et des logiciels métier — et on pense que ces outils‑là
            méritent d’être faits sur le continent qui les utilise.
          </p>

          <div
            className="rise mt-12 flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
            style={{ animationDelay: "240ms" }}
          >
            {[ORIGIN_COORDS, "Entreprise française", "Vous restez propriétaire"].map((fact, i) => (
              <span key={fact} className="flex items-center gap-4">
                {i > 0 && <span aria-hidden="true" className="text-white/25">·</span>}
                <span className="mono-label text-slate-300/60">{fact}</span>
              </span>
            ))}
          </div>
        </div>

        <div
          aria-hidden="true"
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/30"
          style={{ animation: "floatY 3s ease-in-out infinite" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* ── L'ancrage ───────────────────────────────────────────────────── */}
      <section className="relative pt-24 sm:pt-32">
        <div className="mx-auto max-w-[1100px] px-5 sm:px-6">
          <div className="grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <Reveal>
              <div>
                <span className="mono-label mb-6 block text-slate-300/60">L’ancrage</span>
                <h2 className="h-title text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.05]">
                  Marseille n’est pas une adresse.
                  <br />
                  C’est une façon de regarder.
                </h2>
                <p className="mt-7 max-w-xl text-[17px] leading-[1.7] text-slate-300/75">
                  La ville vit depuis vingt‑six siècles de ce qui arrive par la mer
                  et de ce qui en repart. On n’y attend pas qu’une capitale décide à
                  votre place : on regarde en face, de l’autre côté de la
                  Méditerranée, et on se met au travail.
                </p>
                <p className="mt-5 max-w-xl text-[17px] leading-[1.7] text-slate-300/75">
                  C’est le réflexe qu’on applique aux projets qu’on nous confie.
                  Prendre ce qui se fait de mieux ailleurs, le comprendre, puis le
                  refaire ici — plus simple, et sans rien céder sur la qualité.
                </p>
              </div>
            </Reveal>

            {/* La carte du fond n'est pas un ornement : cette carte-ci le dit. */}
            <Reveal delay={120}>
              <div className="lg lg-card p-8 sm:p-9">
                <span className="mono-label block text-slate-300/60">Point de départ</span>
                <div className="mt-6 flex items-baseline gap-3">
                  <span className="h-title text-3xl font-semibold tracking-tight text-white">
                    Marseille
                  </span>
                  <span className="mono-label text-indigo-300/70">France</span>
                </div>
                <div className="mt-4 font-mono text-[13px] tracking-wide text-slate-300/60">
                  {ORIGIN_COORDS}
                </div>
                <p className="mt-7 border-t border-white/10 pt-6 text-[15px] leading-[1.7] text-slate-300/70">
                  L’onde que vous voyez traverser le continent derrière cette page
                  part de ce point, toutes les treize secondes. La carte est tracée
                  d’après les frontières réelles ; promenez le curseur dessus, elle
                  s’allume.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── La raison d'être ────────────────────────────────────────────── */}
      <section className="relative pt-28 sm:pt-40">
        <div className="mx-auto max-w-[900px] px-5 sm:px-6 text-center">
          <Reveal>
            <span className="mono-label mb-6 block text-slate-300/60">Notre raison d’être</span>
            <h2
              className="h-title text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-white leading-[1.03]"
              style={{ textShadow: "0 2px 44px rgba(2,3,10,0.85)" }}
            >
              Rendre à l’Europe le rayonnement
              <br className="hidden sm:block" /> qu’elle mérite.
            </h2>
          </Reveal>

          <Reveal delay={120}>
            <p
              className="mx-auto mt-9 max-w-xl text-[17px] leading-[1.75] text-slate-300/75"
              style={{ textShadow: "0 1px 22px rgba(2,3,10,0.8)" }}
            >
              L’essentiel des logiciels qu’un professionnel européen ouvre chaque
              matin a été pensé ailleurs, hébergé ailleurs, facturé ailleurs. Ce
              n’est pas une fatalité technique. C’est une habitude.
            </p>
          </Reveal>

          <Reveal delay={200}>
            <p
              className="mx-auto mt-6 max-w-xl text-[17px] leading-[1.75] text-slate-300/75"
              style={{ textShadow: "0 1px 22px rgba(2,3,10,0.8)" }}
            >
              On ne renversera pas cette habitude avec un agenda pour
              audioprothésistes. Mais chaque outil conçu ici, correctement fait,
              est une brique qui cesse d’être prise ailleurs. On fait notre part,
              et on la fait bien.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Ce que ça change ────────────────────────────────────────────── */}
      <section className="relative pt-28 sm:pt-40">
        <div className="mx-auto max-w-[1100px] px-5 sm:px-6">
          <Reveal>
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <span className="mono-label mb-5 block text-slate-300/60">Concrètement</span>
              <h2 className="h-title text-3xl sm:text-4xl font-semibold tracking-tight text-white leading-[1.08]">
                Une conviction se vérifie dans les détails.
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-4 md:grid-cols-2">
            {PREUVES.map((p) => (
              <Reveal key={p.title}>
                <div className="lg lg-card h-full p-8 sm:p-9">
                  <span
                    className="mb-7 grid h-11 w-11 place-items-center rounded-2xl [&>svg]:h-5 [&>svg]:w-5"
                    style={{ background: "rgba(99,102,241,0.16)", color: "#A5B4FC" }}
                  >
                    {p.icon}
                  </span>
                  <h3 className="h-title text-xl font-semibold tracking-tight text-white">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-[1.7] text-slate-300/70">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ce qu'on ne fera pas ────────────────────────────────────────── */}
      <section className="relative pt-20 sm:pt-24">
        <div className="mx-auto max-w-[1100px] px-5 sm:px-6">
          <Reveal>
            <div className="lg lg-card p-8 sm:p-10">
              <span className="mono-label block text-slate-300/60">Ce qu’on ne fera pas</span>
              <ul className="mt-7 grid gap-5 md:grid-cols-3">
                {JAMAIS.map((j) => (
                  <li key={j} className="flex items-start gap-3.5 text-[15px] leading-[1.65] text-slate-300/70">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-white/25" aria-hidden="true">
                      <path d="M6 12h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    {j}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Sortie ──────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-28 sm:pt-40 sm:pb-40">
        <div className="mx-auto max-w-[900px] px-5 sm:px-6 text-center">
          <Reveal>
            <h2
              className="h-title mx-auto max-w-xl text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.05]"
              style={{ textShadow: "0 2px 44px rgba(2,3,10,0.85)" }}
            >
              On est à Marseille.
              <br />
              On travaille pour tout le continent.
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-lg leading-[1.6] text-slate-300/75">
              Le premier échange ne coûte rien.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/contact?sujet=projet" className="lg lg-btn lg-btn-ink w-full sm:w-auto">
                <span>Prendre contact</span>
              </Link>
              <Link href="/realisations" className="lg lg-btn w-full sm:w-auto">
                <span>Voir nos réalisations</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
