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

   Trois orbites plutôt qu'une par projet : au-delà de trois anneaux les
   tracés se serrent, les étiquettes se chevauchent et le dessin devient
   illisible. Les satellites se répartissent en rotation sur ces trois
   pistes, régulièrement espacés à l'intérieur de chacune.

   PERF — chaque satellite coûte deux animations de `transform` (la piste
   tourne, le satellite contre-tourne pour rester lisible), rien d'autre :
   pas de flou, pas d'ombre animée, pas de recalcul de mise en page. Tout
   se fige dès que la section quitte l'écran.
   ──────────────────────────────────────────────────────────────────────── */

/** Diamètre en % du carré de scène, et durée d'un tour. Plus c'est loin, plus c'est lent. */
const ORBITS = [
  { diameter: 40, duration: 46 },
  { diameter: 66, duration: 66 },
  { diameter: 88, duration: 92 },
];

type Satellite = {
  item: Realisation;
  orbit: (typeof ORBITS)[number];
  /** Angle de départ, matérialisé par un délai d'animation négatif. */
  delay: number;
};

const LIVE = getAllRealisations().filter((r) => r.status === "live");

const SATELLITES: Satellite[] = (() => {
  const rings: Realisation[][] = ORBITS.map(() => []);
  LIVE.forEach((item, i) => rings[i % ORBITS.length].push(item));

  return rings.flatMap((ring, ringIndex) =>
    ring.map((item, i) => {
      const orbit = ORBITS[ringIndex];
      const angle = (360 / ring.length) * i + ringIndex * 34;
      const delay = Math.round((angle / 360) * orbit.duration * 100) / 100;
      return { item, orbit, delay: -delay };
    }),
  );
})();

/** Le corps du satellite : une bille éclairée en haut à gauche, comme le reste de la page. */
function Planet({ accent, size = "var(--orb)" }: { accent: string; size?: string }) {
  return (
    <span
      aria-hidden="true"
      className="block shrink-0 rounded-full transition-transform duration-500 group-hover:scale-110"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 32% 26%, #FFFFFF 0%, ${accent}D9 44%, ${accent} 100%)`,
        boxShadow: `0 8px 20px -8px ${accent}B3, inset 0 -3px 8px -3px rgba(11,18,32,0.45)`,
        transitionTimingFunction: "var(--lg-ease)",
      }}
    />
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
            className="relative mx-auto hidden aspect-square w-full max-w-[620px] sm:block"
            style={
              {
                "--orb": "clamp(34px, 6.2vw, 46px)",
                "--sun": "clamp(88px, 14vw, 116px)",
              } as React.CSSProperties
            }
          >
            {/* Tracés des orbites */}
            {ORBITS.map((o) => (
              <div
                key={o.diameter}
                aria-hidden="true"
                className="pointer-events-none absolute rounded-full border border-slate-900/[0.07]"
                style={{
                  width: `${o.diameter}%`,
                  height: `${o.diameter}%`,
                  left: `${(100 - o.diameter) / 2}%`,
                  top: `${(100 - o.diameter) / 2}%`,
                }}
              />
            ))}

            {/* L'astre : la marque, monochrome — la couleur appartient aux projets */}
            <div
              className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#0B1220] text-white"
              style={{
                width: "var(--sun)",
                height: "var(--sun)",
                boxShadow:
                  "0 20px 50px -20px rgba(11,18,32,0.55), 0 0 0 14px rgba(11,18,32,0.025), 0 0 0 30px rgba(11,18,32,0.015)",
              }}
            >
              <ThorMark size={44} />
            </div>

            {/* Les satellites */}
            {SATELLITES.map(({ item, orbit, delay }) => (
              <div
                key={item.slug}
                className="orbit-track pointer-events-none absolute rounded-full"
                style={
                  {
                    width: `${orbit.diameter}%`,
                    height: `${orbit.diameter}%`,
                    left: `${(100 - orbit.diameter) / 2}%`,
                    top: `${(100 - orbit.diameter) / 2}%`,
                    "--orbit-duration": `${orbit.duration}s`,
                    animationDelay: `${delay}s`,
                  } as React.CSSProperties
                }
              >
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                  <div className="orbit-upright" style={{ animationDelay: `${delay}s` }}>
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
              <Planet accent={item.accent} size="34px" />
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
