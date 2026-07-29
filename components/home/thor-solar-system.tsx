"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import { getAllRealisations, type Realisation } from "@/lib/realisations";

/* ──────────────────────────────────────────────────────────────────────────
   Le système solaire de l'écosystème.

   Un astre au centre, un satellite par projet en production. Les projets sont
   lus depuis lib/realisations.ts : mettre un projet en ligne le fait
   apparaître ici, sans toucher à ce fichier.

   CE QUI FAIT LA PROFONDEUR — les trois leviers, dans l'ordre d'importance :

     1. Une perspective courte. C'est le point qui manquait : à 1150 px de
        distance focale, un satellite proche n'était que 1,5 fois plus gros
        qu'un satellite lointain, et l'œil ne lit pas un tel écart. À 700 px
        le rapport passe à plus du double et la scène devient un volume.
     2. Des tracés d'opacité variable. Une ellipse uniforme est un dessin
        plat ; l'arc qui passe devant l'astre doit être plus dense que celui
        qui passe derrière (cf. .orbit-ring dans globals.css).
     3. Des satellites sphériques. Un anneau vide reste une décalcomanie —
        il faut un modelé, une source de lumière et un limbe assombri.

   PERF — deux animations de `transform` par satellite (la piste tourne, le
   satellite contre-tourne pour rester lisible et face au lecteur), plus une
   animation de défilement jouée par le compositeur. Aucun écouteur `scroll`,
   aucun flou, aucune ombre animée. Tout se fige hors écran.
   ──────────────────────────────────────────────────────────────────────── */

/**
 * Un plan d'orbite.
 *
 * `size`  diamètre du cercle, en % de la largeur de scène
 * `tilt`  bascule sur X : 0 = vu de face (cercle), 90 = vu par la tranche
 * `roll`  pivot du plan sur Z, ce qui décale l'axe de l'ellipse
 * `duration` durée d'un tour — plus c'est loin, plus c'est lent
 */
const ORBITS = [
  { size: 50, tilt: 56, roll: -24, duration: 34 },
  { size: 66, tilt: 70, roll:  14, duration: 54 },
  { size: 76, tilt: 60, roll:  34, duration: 78 },
];

/** Distance focale. Plus elle est courte, plus l'écart proche/lointain est marqué. */
const FOCAL = "700px";

type Satellite = { item: Realisation; delay: number };

const LIVE = getAllRealisations().filter((r) => r.status === "live");

const RINGS: { orbit: (typeof ORBITS)[number]; satellites: Satellite[] }[] = (() => {
  const buckets: Realisation[][] = ORBITS.map(() => []);
  LIVE.forEach((item, i) => buckets[i % ORBITS.length].push(item));

  return ORBITS.map((orbit, ringIndex) => ({
    orbit,
    satellites: buckets[ringIndex].map((item, i) => {
      const angle = (360 / buckets[ringIndex].length) * i + ringIndex * 34;
      const delay = Math.round((angle / 360) * orbit.duration * 100) / 100;
      return { item, delay: -delay };
    }),
  }));
})();

/**
 * Le corps du satellite : une sphère, pas une pastille.
 *
 * Le point blanc en haut à gauche est le reflet spéculaire, à la même place
 * que sur tout le reste de la vitrine — une seule source de lumière pour
 * toute la page. `color-mix` assombrit l'accent vers l'encre pour le limbe :
 * c'est ce dégradé du clair vers le sombre qui fait la bille, pas le contour.
 */
function Planet({ accent, size = "var(--orb)" }: { accent: string; size?: string }) {
  return (
    <span
      aria-hidden="true"
      className="block shrink-0 rounded-full transition-transform duration-500 group-hover:scale-[1.18]"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 33% 27%, #FFFFFF 0%, ${accent} 44%, color-mix(in srgb, ${accent} 58%, #0B1220) 100%)`,
        boxShadow: `inset -2px -3px 7px -2px rgba(11,18,32,0.55), 0 0 14px 1px ${accent}4D, 0 7px 16px -7px rgba(11,18,32,0.45)`,
        transitionTimingFunction: "var(--lg-ease)",
      }}
    />
  );
}

/**
 * L'astre.
 *
 * Une éclipse plutôt qu'un soleil jaune. Sur un fond quasi blanc, un astre
 * lumineux ne se détache de rien : c'est le disque sombre qui porte la forme,
 * et la couronne qui dit la lumière. L'ordre des calques fait tout l'effet —
 * halo sombre diffus, puis liseré blanc au ras du disque, puis le disque. Le
 * blanc n'est visible que parce qu'il est posé sur le halo sombre.
 *
 * Il reste monochrome : la couleur appartient aux projets.
 */
function Sun() {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2"
      style={{
        width: "var(--sun)",
        height: "var(--sun)",
        transform: "translate(-50%, -50%)",
      }}
      aria-hidden="true"
    >
      {/* Couronne externe — l'atmosphère, très diffuse */}
      <span
        className="absolute rounded-full"
        style={{
          inset: "-130%",
          background:
            "radial-gradient(circle, rgba(11,18,32,0.16) 0%, rgba(11,18,32,0.075) 22%, rgba(11,18,32,0.022) 44%, rgba(11,18,32,0) 64%)",
        }}
      />

      {/* Le disque.
          Le modelé va d'un gris bleuté éclairé à un noir d'encre : c'est cet
          écart, et non le contour, qui fait la sphère. Les `0 0 0 Npx`
          empilés sont la couronne — des anneaux sombres de plus en plus
          ténus. Ils comptent autant que le disque : c'est parce qu'ils
          assombrissent le pourtour que le liseré blanc du limbe devient
          visible sur une page presque blanche. */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 22%, #9AA6C4 0%, #4B5878 15%, #202A46 42%, #0A1020 74%, #02040A 100%)",
          boxShadow: [
            "0 0 0 1.5px rgba(255,255,255,0.95)",
            "0 0 0 8px rgba(11,18,32,0.055)",
            "0 0 0 20px rgba(11,18,32,0.032)",
            "0 0 0 40px rgba(11,18,32,0.016)",
            "inset -11px -13px 30px -12px rgba(0,0,0,0.95)",
            "inset 8px 8px 22px -10px rgba(255,255,255,0.45)",
            "0 38px 70px -26px rgba(11,18,32,0.60)",
          ].join(", "),
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
    <section id="ecosysteme" className="relative overflow-x-clip py-24 sm:py-32 md:py-40">
      <div className="mx-auto max-w-[1100px] px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="mb-5 block text-[13px] font-medium text-slate-500">
              En production
            </span>
            <h2 className="h-title text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 leading-[1.05]">
              Ce qu’on a déjà mis en ligne.
            </h2>
            <p className="mt-6 text-lg text-slate-500 leading-[1.6]">
              Un satellite, un projet livré et en service. Ouvrez celui qui
              vous intéresse.
            </p>
          </div>
        </Reveal>

        {/* ── La scène ─────────────────────────────────────────────────────
            Sous 640 px les étiquettes se marcheraient dessus : on donne la
            même liste, à plat. */}
        <div className="solar-approach hidden sm:block">
          <div
            ref={stageRef}
            data-spin={spinning ? "running" : "paused"}
            className="relative mx-auto aspect-[7/5] w-full max-w-[680px]"
            style={
              {
                "--orb": "clamp(18px, 2.9vw, 26px)",
                "--sun": "clamp(84px, 13vw, 118px)",
                perspective: FOCAL,
                perspectiveOrigin: "50% 32%",
              } as React.CSSProperties
            }
          >
            <Sun />

            {RINGS.map(({ orbit, satellites }) => (
              <div
                key={orbit.size}
                className="orbit-plane absolute left-1/2 top-1/2 aspect-square"
                style={{
                  width: `${orbit.size}%`,
                  transform: `translate(-50%, -50%) rotateX(${orbit.tilt}deg) rotateZ(${orbit.roll}deg)`,
                }}
              >
                <div aria-hidden="true" className="orbit-ring pointer-events-none absolute inset-0" />

                {satellites.map(({ item, delay }) => (
                  <div
                    key={item.slug}
                    className="orbit-track pointer-events-none absolute inset-0 rounded-full"
                    style={
                      {
                        "--orbit-duration": `${orbit.duration}s`,
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
                            transform: `rotateZ(${-orbit.roll}deg) rotateX(${-orbit.tilt}deg)`,
                          }}
                        >
                          <Link
                            href={`/realisations/${item.slug}`}
                            className="group pointer-events-auto flex w-max flex-col items-center gap-2 rounded-2xl px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
                            aria-label={`${item.name} — ${item.tagline}`}
                          >
                            <Planet accent={item.accent} />
                            <span className="text-[12px] font-medium whitespace-nowrap text-slate-500 transition-colors duration-300 group-hover:text-slate-900">
                              {item.name}
                            </span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
              className="lg lg-card group flex items-center gap-4 p-4"
            >
              <Planet accent={item.accent} size="30px" />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium text-slate-900">{item.name}</span>
                <span className="block truncate text-[13px] text-slate-500">{item.tagline}</span>
              </span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0 text-slate-300" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}
        </div>

        <Reveal>
          <div className="mt-12 text-center sm:mt-20">
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
