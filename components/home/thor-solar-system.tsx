"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import { ThorMark } from "@/components/thor-mark";
import { getAllRealisations, type Realisation } from "@/lib/realisations";

/* ──────────────────────────────────────────────────────────────────────────
   Le système solaire de l'écosystème.

   THOR au centre, un satellite par projet en production. Les projets sont
   lus depuis lib/realisations.ts : mettre un projet en ligne le fait
   apparaître ici, sans toucher à ce fichier.

   La scène est en perspective. Chaque plan d'orbite est un cercle basculé sur
   X — donc projeté en ellipse — puis pivoté sur Z d'un angle qui lui est
   propre. Trois cercles concentriques donnaient une cible ; trois ellipses
   d'inclinaisons différentes se croisent et se lisent comme un volume. La
   profondeur n'est pas peinte : les satellites passent réellement devant et
   derrière l'astre, et la perspective les agrandit quand ils s'approchent.

   PERF — chaque satellite coûte deux animations de `transform` (la piste
   tourne, le satellite contre-tourne pour rester lisible et face au
   spectateur), rien d'autre : pas de flou, pas d'ombre animée, pas de
   recalcul de mise en page. Tout se fige dès que la section quitte l'écran.
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
  { size: 38, tilt: 64, roll: -22, duration: 38 },
  { size: 58, tilt: 73, roll:  15, duration: 58 },
  { size: 78, tilt: 56, roll:  34, duration: 82 },
];

type Satellite = {
  item: Realisation;
  orbit: (typeof ORBITS)[number];
  /** Angle de départ, matérialisé par un délai d'animation négatif. */
  delay: number;
};

const LIVE = getAllRealisations().filter((r) => r.status === "live");

const RINGS: { orbit: (typeof ORBITS)[number]; satellites: Satellite[] }[] = (() => {
  const buckets: Realisation[][] = ORBITS.map(() => []);
  LIVE.forEach((item, i) => buckets[i % ORBITS.length].push(item));

  return ORBITS.map((orbit, ringIndex) => {
    const ring = buckets[ringIndex];
    return {
      orbit,
      satellites: ring.map((item, i) => {
        const angle = (360 / ring.length) * i + ringIndex * 34;
        const delay = Math.round((angle / 360) * orbit.duration * 100) / 100;
        return { item, orbit, delay: -delay };
      }),
    };
  });
})();

/**
 * Le corps du satellite.
 *
 * Un anneau fin plutôt qu'une bille pleine : à cette taille une sphère
 * dégradée devient une pastille lourde qui écrase le tracé de l'orbite.
 * L'anneau porte la couleur, le disque intérieur n'en garde qu'un voile, et
 * le halo tient lieu d'ombre — le relief vient de la perspective, pas du
 * modelé.
 */
function Planet({ accent, size = "var(--orb)" }: { accent: string; size?: string }) {
  return (
    <span
      aria-hidden="true"
      className="block shrink-0 rounded-full transition-transform duration-500 group-hover:scale-125"
      style={{
        width: size,
        height: size,
        border: `1.5px solid ${accent}`,
        background: `radial-gradient(circle at 34% 28%, rgba(255,255,255,0.95) 0%, ${accent}1A 52%, ${accent}12 100%)`,
        boxShadow: `0 0 0 3px ${accent}14, 0 4px 12px -6px ${accent}99`,
        transitionTimingFunction: "var(--lg-ease)",
      }}
    />
  );
}

/**
 * L'astre. Il reste monochrome : la couleur appartient aux projets, jamais à
 * la marque. Ce qui en fait un soleil n'est donc pas une teinte chaude mais
 * la lumière qu'il émet — couronne diffuse, halos concentriques, et un
 * éclairage en haut à gauche, la même source que le reste de la page.
 */
function Sun() {
  return (
    <div
      className="absolute left-1/2 top-1/2 grid place-items-center rounded-full"
      style={{
        width: "var(--sun)",
        height: "var(--sun)",
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Couronne — déborde largement du disque, sans jamais capter le pointeur */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full"
        style={{
          inset: "-85%",
          background:
            "radial-gradient(circle, rgba(11,18,32,0.11) 0%, rgba(11,18,32,0.045) 38%, rgba(11,18,32,0) 68%)",
        }}
      />

      {/* Le disque */}
      <div
        className="relative grid h-full w-full place-items-center rounded-full text-white"
        style={{
          background:
            "radial-gradient(circle at 32% 26%, #39415A 0%, #171F30 44%, #0B1220 100%)",
          boxShadow:
            "0 24px 56px -22px rgba(11,18,32,0.60), 0 0 0 1px rgba(11,18,32,0.06), inset 0 1px 0 rgba(255,255,255,0.16)",
        }}
      >
        <ThorMark size={40} />
      </div>
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
    <section className="relative overflow-x-clip py-24 sm:py-32 md:py-40">
      <div className="mx-auto max-w-[1100px] px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="mb-5 block text-[13px] font-medium text-slate-400">
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
        <Reveal>
          <div
            ref={stageRef}
            data-spin={spinning ? "running" : "paused"}
            className="relative mx-auto hidden aspect-[7/5] w-full max-w-[680px] sm:block"
            style={
              {
                "--orb": "clamp(15px, 2.5vw, 21px)",
                "--sun": "clamp(76px, 12vw, 104px)",
                perspective: "1150px",
                perspectiveOrigin: "50% 42%",
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
                {/* Tracé de l'orbite */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-full border border-slate-900/[0.09]"
                />

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
                            spectateur et reste droit, où qu'il soit sur l'ellipse. */}
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
                            <span className="text-[11px] font-medium whitespace-nowrap text-slate-500 transition-colors duration-300 group-hover:text-slate-900">
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
        </Reveal>

        {/* ── Repli mobile ─────────────────────────────────────────────── */}
        <div className="grid gap-2.5 sm:hidden">
          {LIVE.map((item) => (
            <Link
              key={item.slug}
              href={`/realisations/${item.slug}`}
              className="lg lg-card group flex items-center gap-4 p-4"
            >
              <Planet accent={item.accent} size="28px" />
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
          <div className="mt-14 text-center sm:mt-10">
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
