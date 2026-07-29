"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getAllRealisations, type Realisation } from "@/lib/realisations";

/* ──────────────────────────────────────────────────────────────────────────
   Le système solaire de l'écosystème.

   Un astre au centre, une orbite par site en production. Les projets sont lus
   depuis lib/realisations.ts : mettre un projet en ligne le fait apparaître
   ici, sans toucher à ce fichier.

   POURQUOI CETTE SECTION EST NOIRE — c'est la décision qui commande toutes
   les autres. Une étoile ne se voit pas sur une page blanche : une lueur
   n'existe que par l'obscurité qui l'entoure, et tant que le fond restait
   clair l'astre ne pouvait être qu'un caillou sombre. Solar System Scope et
   Eyes on the Solar System, les deux références, sont noirs pour cette
   raison. La vitrine garde son fond clair ; ce panneau est la seule fenêtre
   qu'elle ouvre sur autre chose, et le contraste lui donne sa force.

   UNE ORBITE PAR SITE, À SA COULEUR — six ellipses enchevêtrées sont
   illisibles si elles sont toutes grises. Colorée, chaque trajectoire se
   suit à l'œil jusqu'à sa planète. C'est le parti d'Eyes on the Solar
   System, et il tombe juste ici : chaque projet a déjà sa couleur.

   PERF — deux animations de `transform` par satellite (la piste tourne, le
   satellite contre-tourne pour rester lisible), une pulsation d'opacité sur
   la couronne, et l'approche au défilement jouée par le compositeur. Le
   champ d'étoiles est un seul nœud peint une fois. Aucun écouteur `scroll`,
   aucun flou, aucune ombre animée. Tout se fige hors écran.
   ──────────────────────────────────────────────────────────────────────── */

const LIVE = getAllRealisations().filter((r) => r.status === "live");

/**
 * Une orbite par projet, du plus proche au plus lointain.
 *
 * `tilt` et `roll` ne suivent aucune progression régulière : c'est
 * l'irrégularité qui empêche la cible concentrique. Les valeurs sont posées
 * à la main plutôt que calculées, pour garder la main sur les croisements.
 */
const GEOMETRY = [
  { size: 33, tilt: 62, roll: -26, duration: 26 },
  { size: 42, tilt: 70, roll:  12, duration: 38 },
  { size: 54, tilt: 58, roll: -14, duration: 52 },
  { size: 66, tilt: 73, roll:  30, duration: 68 },
  { size: 78, tilt: 64, roll:  -6, duration: 86 },
  { size: 90, tilt: 68, roll:  22, duration: 106 },
];

type Satellite = {
  item: Realisation;
  geo: (typeof GEOMETRY)[number];
  /** Angle de départ, matérialisé par un délai d'animation négatif. */
  delay: number;
};

/* L'angle de départ est étalé par le nombre d'or : deux projets voisins ne
   partent jamais du même côté, quel que soit leur nombre. */
const SATELLITES: Satellite[] = LIVE.map((item, i) => {
  const geo = GEOMETRY[i % GEOMETRY.length];
  const angle = (i * 137.508) % 360;
  const delay = Math.round((angle / 360) * geo.duration * 100) / 100;
  return { item, geo, delay: -delay };
});

/** Distance focale. Plus elle est courte, plus l'écart proche/lointain est marqué. */
const FOCAL = "760px";

/* ── Champ d'étoiles ───────────────────────────────────────────────────────
   Une suite déterministe, pas `Math.random` : le serveur et le client
   doivent produire exactement les mêmes positions, sinon l'hydratation
   proteste. Toutes les étoiles tiennent dans le `box-shadow` d'un seul nœud,
   peint une fois pour toutes. */
function starField(count: number, seed: number, spread: number, alpha: number) {
  let s = seed;
  const next = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  return Array.from({ length: count }, () => {
    const x = (next() * spread).toFixed(1);
    const y = (next() * spread).toFixed(1);
    const a = (alpha * (0.35 + next() * 0.65)).toFixed(2);
    return `${x}px ${y}px 0 0 rgba(255,255,255,${a})`;
  }).join(", ");
}

const STARS_FINE = starField(150, 7919, 1600, 0.55);
const STARS_BRIGHT = starField(26, 104729, 1600, 0.95);

/**
 * Le corps du satellite : une sphère qui émet sa propre lumière.
 *
 * Sur fond noir, ce n'est plus l'ombre portée qui détache la bille mais le
 * halo. Le reflet blanc reste en haut à gauche, source de lumière unique de
 * toute la page ; `color-mix` ramène le limbe vers le noir du ciel plutôt que
 * vers un gris, sans quoi la sphère paraît collée sur le fond.
 */
function Planet({ accent, size = "var(--orb)" }: { accent: string; size?: string }) {
  return (
    <span
      aria-hidden="true"
      className="block shrink-0 rounded-full transition-transform duration-500 group-hover:scale-125"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 34% 28%, #FFFFFF 0%, ${accent} 42%, color-mix(in srgb, ${accent} 42%, #05070E) 100%)`,
        boxShadow: `0 0 12px 1px ${accent}A6, 0 0 30px 4px ${accent}47, inset -2px -3px 6px -2px rgba(0,0,0,0.75)`,
        transitionTimingFunction: "var(--lg-ease)",
      }}
    />
  );
}

/**
 * L'étoile.
 *
 * Trois couches, du dedans au dehors : un cœur blanc qui vire à l'or, une
 * chromosphère ambrée, puis une couronne très large et très faible. C'est la
 * superposition qui fait la lumière — un seul dégradé donne une pastille
 * jaune, trois donnent une source. Seule la couronne respire, et lentement.
 */
function Star() {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2"
      style={{ transform: "translate(-50%, -50%)" }}
      aria-hidden="true"
    >
      {/* Couronne — la seule chose qui bouge dans l'astre */}
      <span
        className="star-corona absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: "calc(var(--sun) * 3.9)",
          height: "calc(var(--sun) * 3.9)",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(255,196,92,0.20) 0%, rgba(255,150,50,0.09) 26%, rgba(255,120,40,0.03) 46%, rgba(255,110,40,0) 66%)",
        }}
      />

      {/* Chromosphère */}
      <span
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: "calc(var(--sun) * 1.95)",
          height: "calc(var(--sun) * 1.95)",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(255,224,150,0.55) 0%, rgba(255,178,68,0.30) 34%, rgba(255,138,40,0.10) 58%, rgba(255,120,30,0) 76%)",
        }}
      />

      {/* Le disque */}
      <span
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: "var(--sun)",
          height: "var(--sun)",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle at 46% 42%, #FFFFFF 0%, #FFF6D8 26%, #FFD770 52%, #FFA83A 78%, #F5852A 100%)",
          boxShadow: "0 0 34px 8px rgba(255,190,90,0.55), 0 0 90px 24px rgba(255,150,50,0.28)",
        }}
      />
    </div>
  );
}

export function ThorSolarSystem() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [spinning, setSpinning] = useState(true);

  /* Hors écran, on arrête tout : une orbite invisible n'a aucune raison de coûter des frames. */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setSpinning(entry.isIntersecting));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      id="ecosysteme"
      data-spin={spinning ? "running" : "paused"}
      className="relative isolate overflow-hidden py-24 sm:py-28 md:py-32"
      style={{
        background:
          "radial-gradient(120% 92% at 50% 42%, #10192E 0%, #080D1A 44%, #04060D 74%, #02030A 100%)",
      }}
    >
      {/* ── Le ciel ────────────────────────────────────────────────────── */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-px w-px"
        style={{ boxShadow: STARS_FINE }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-px w-px"
        style={{ boxShadow: STARS_BRIGHT }}
      />
      {/* Vignette — ramène l'œil au centre et noie les bords du champ d'étoiles */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(100% 78% at 50% 46%, rgba(2,3,10,0) 42%, rgba(2,3,10,0.72) 82%, #02030A 100%)",
        }}
      />

      <div className="relative mx-auto max-w-[1100px] px-5 sm:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="mb-5 block text-[11px] font-medium uppercase tracking-[0.22em] text-amber-200/70">
            En production
          </span>
          <h2 className="h-title text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.05]">
            Ce qu’on a déjà mis en ligne.
          </h2>
          <p className="mt-6 text-lg leading-[1.6] text-slate-300/80">
            Une orbite par site, à sa couleur. Ouvrez celui qui vous intéresse.
          </p>
        </div>

        {/* ── La scène ───────────────────────────────────────────────────
            Sous 640 px les étiquettes se marcheraient dessus : on donne la
            même liste, à plat. */}
        <div className="solar-approach hidden sm:block">
          <div
            ref={stageRef}
            className="relative mx-auto aspect-[7/5] w-full max-w-[720px]"
            style={
              {
                "--orb": "clamp(17px, 2.7vw, 25px)",
                "--sun": "clamp(52px, 8vw, 76px)",
                perspective: FOCAL,
                perspectiveOrigin: "50% 34%",
              } as React.CSSProperties
            }
          >
            <Star />

            {SATELLITES.map(({ item, geo, delay }) => (
              <div
                key={item.slug}
                className="orbit-plane absolute left-1/2 top-1/2 aspect-square"
                style={
                  {
                    width: `${geo.size}%`,
                    transform: `translate(-50%, -50%) rotateX(${geo.tilt}deg) rotateZ(${geo.roll}deg)`,
                    "--ring-strong": `${item.accent}D9`,
                    "--ring-mid": `${item.accent}70`,
                    "--ring-weak": `${item.accent}14`,
                  } as React.CSSProperties
                }
              >
                <div aria-hidden="true" className="orbit-ring pointer-events-none absolute inset-0" />

                <div
                  className="orbit-track pointer-events-none absolute inset-0 rounded-full"
                  style={
                    {
                      "--orbit-duration": `${geo.duration}s`,
                      animationDelay: `${delay}s`,
                    } as React.CSSProperties
                  }
                >
                  <div
                    className="orbit-anchor absolute left-1/2 top-0"
                    style={{ transform: "translate(-50%, -50%)" }}
                  >
                    <div className="orbit-upright" style={{ animationDelay: `${delay}s` }}>
                      {/* Défait la bascule du plan : le satellite regarde le
                          lecteur et reste droit, où qu'il soit sur l'ellipse.
                          Seule l'orientation est annulée — la position en
                          profondeur demeure, donc la perspective continue de
                          le grandir quand il s'approche. */}
                      <div
                        style={{
                          transform: `rotateZ(${-geo.roll}deg) rotateX(${-geo.tilt}deg)`,
                        }}
                      >
                        <Link
                          href={`/realisations/${item.slug}`}
                          className="group pointer-events-auto flex w-max flex-col items-center gap-2 rounded-2xl px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                          aria-label={`${item.name} — ${item.tagline}`}
                        >
                          <Planet accent={item.accent} />
                          {/* L'ombre portée n'est pas décorative : une orbite
                              intérieure passe devant la couronne, et sans elle
                              l'étiquette s'y dissout. */}
                          <span
                            className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.14em] text-white/70 transition-colors duration-300 group-hover:text-white"
                            style={{ textShadow: "0 1px 3px rgba(2,3,10,0.95), 0 0 10px rgba(2,3,10,0.85)" }}
                          >
                            {item.name}
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Repli mobile ─────────────────────────────────────────────── */}
        <div className="grid gap-2.5 sm:hidden">
          {LIVE.map((item) => (
            <Link
              key={item.slug}
              href={`/realisations/${item.slug}`}
              className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors duration-300 hover:bg-white/[0.08]"
            >
              <Planet accent={item.accent} size="26px" />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium text-white">{item.name}</span>
                <span className="block truncate text-[13px] text-white/50">{item.tagline}</span>
              </span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0 text-white/30" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center sm:mt-6">
          <Link
            href="/realisations"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white/90 transition-colors duration-300 hover:border-white/40 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            Tout le portfolio
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
