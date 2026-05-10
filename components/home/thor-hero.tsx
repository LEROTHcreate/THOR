"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Reveal } from "@/components/ui/reveal";

/* ──────────────────────────────────────────────────────────────────────────
   Satellites de l'écosystème THOR.
   Pour ajouter un nouveau SaaS : ajouter une entrée dans le tableau ci-dessous.
   Chaque satellite a sa propre orbite elliptique, son propre centre (offsetX/Y
   par rapport au centre visuel), sa propre vitesse et son délai de départ.
   ──────────────────────────────────────────────────────────────────────── */
interface Satellite {
  name: string;
  color: string;
  href: string;
  rx: number;        // rayon X de l'ellipse
  ry: number;        // rayon Y de l'ellipse
  offsetX: number;   // décalage du centre orbital (excentricité visuelle)
  offsetY: number;
  duration: number;  // durée d'un tour complet en secondes
  delay: number;     // décalage temporel du départ (négatif = déjà avancé)
}

const SATELLITES: Satellite[] = [
  { name: "Clair Vision",   color: "#2D8CFF", href: "/clair-vision",
    rx: 250, ry: 180, offsetX:  20, offsetY:   0, duration: 38, delay:   0 },
  { name: "Clair Audition", color: "#00C98A", href: "/clair-audition",
    rx: 200, ry: 240, offsetX: -30, offsetY: -20, duration: 32, delay: -10 },
  { name: "PharmaPlanning", color: "#059669", href: "https://pharmapinvertagenda.vercel.app/",
    rx: 290, ry: 200, offsetX:  10, offsetY:  30, duration: 48, delay: -22 },
];

/* ──────────────────────────────────────────────────────────────────────── */

function SatelliteOrbit({ s }: { s: Satellite }) {
  // Path SVG pour ellipse centrée en (0,0)
  const ellipsePath = `M -${s.rx} 0 a ${s.rx} ${s.ry} 0 1 0 ${s.rx * 2} 0 a ${s.rx} ${s.ry} 0 1 0 -${s.rx * 2} 0`;
  const external = /^https?:\/\//.test(s.href);

  /* Contenu visible du satellite — dot + label.
     Le dot est centré EXACTEMENT sur (0,0) qui est le point du chemin.
     Le label est positionné à droite, centré verticalement.
     L'ensemble est cliquable et redirige vers la page de présentation. */
  const Content = (
    <>
      {/* Dot — centre EXACT sur la trajectoire */}
      <span
        aria-hidden="true"
        className="block rounded-full transition-transform duration-200 group-hover:scale-125"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 14,
          height: 14,
          transform: "translate(-50%, -50%)",
          background: s.color,
          boxShadow: `0 0 0 4px ${s.color}1A, 0 0 18px ${s.color}AA`,
          animation: "glowPulse 2.4s ease-in-out infinite",
        }}
      />
      {/* Label — à droite du dot, centré verticalement */}
      <span
        className="rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg"
        style={{
          position: "absolute",
          top: 0,
          left: 12,
          transform: "translateY(-50%)",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.9)",
          color: s.color,
          boxShadow: `0 8px 24px ${s.color}26, inset 0 1px 0 rgba(255,255,255,0.95)`,
        }}
      >
        {s.name}
      </span>
    </>
  );

  /* Boîte qui suit le chemin (0×0 → offset-anchor par défaut = centre = (0,0)).
     Hover pause l'animation pour faciliter le clic. */
  const trackStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    offsetPath: `path("${ellipsePath}")`,
    offsetRotate: "0deg",
    animation: `orbitAlong ${s.duration}s linear infinite`,
    animationDelay: `${s.delay}s`,
    willChange: "offset-distance",
  };

  return (
    <div
      className="absolute top-1/2 left-1/2"
      style={{
        transform: `translate(${s.offsetX}px, ${s.offsetY}px)`,
        width: 0,
        height: 0,
      }}
    >
      {/* Trace de l'orbite — pointillé fin coloré */}
      <svg
        className="absolute pointer-events-none"
        style={{
          top: -s.ry,
          left: -s.rx,
          width: s.rx * 2,
          height: s.ry * 2,
          overflow: "visible",
        }}
        viewBox={`-${s.rx} -${s.ry} ${s.rx * 2} ${s.ry * 2}`}
      >
        <ellipse
          cx="0"
          cy="0"
          rx={s.rx}
          ry={s.ry}
          fill="none"
          stroke={`${s.color}40`}
          strokeWidth="1"
          strokeDasharray="3 6"
        />
      </svg>

      {/* Satellite cliquable qui suit la trajectoire */}
      {external ? (
        <a
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className="orbit-track group block"
          style={trackStyle}
        >
          {Content}
        </a>
      ) : (
        <Link href={s.href} className="orbit-track group block" style={trackStyle}>
          {Content}
        </Link>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

export default function ThorHero() {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  useEffect(() => {
    function onMove(e: MouseEvent) {
      setParallax({
        x: (e.clientX / window.innerWidth - 0.5) * 24,
        y: (e.clientY / window.innerHeight - 0.5) * 16,
      });
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section className="relative flex items-center" style={{ minHeight: "calc(100vh - 5rem)" }}>
      <div className="relative z-10 w-full">
        <div className="mx-auto max-w-[1400px] px-6 py-16 lg:py-20">
          <div className="grid lg:grid-cols-[1fr_1.05fr] gap-12 lg:gap-16 items-center">

            {/* ── COLONNE GAUCHE — Texte ─────────────────────────────────── */}
            <div className="text-center lg:text-left">

              <Reveal>
                <div
                  className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-xs font-medium text-slate-500 backdrop-blur-xl shadow-[0_4px_20px_rgba(99,102,241,0.10),inset_0_1px_0_rgba(255,255,255,0.9)] mb-8"
                  style={{
                    transform: `translate(${parallax.x * 0.3}px, ${parallax.y * 0.3}px)`,
                    transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)",
                  }}
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500"
                    style={{ animation: "glowPulse 2.4s ease-in-out infinite", boxShadow: "0 0 10px rgba(99,102,241,0.7)" }}
                  />
                  <span className="uppercase tracking-[0.12em] text-[11px]">
                    Écosystème de logiciels santé certifiés
                  </span>
                </div>
              </Reveal>

              <Reveal>
                <h1
                  className="text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] font-bold leading-[0.98] tracking-tight text-slate-900 h-title"
                  style={{
                    transform: `translate(${parallax.x * -0.5}px, ${parallax.y * -0.3}px)`,
                    transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1)",
                  }}
                >
                  Le socle technique
                  <br />
                  <span
                    style={{
                      background:
                        "linear-gradient(90deg, #6366F1 0%, #2D8CFF 30%, #00C98A 60%, #2D8CFF 80%, #6366F1 100%)",
                      backgroundSize: "200% auto",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      animation: "textGradientSlide 8s linear infinite",
                    }}
                  >
                    de la santé sensorielle
                  </span>
                </h1>
              </Reveal>

              <Reveal>
                <p className="mt-7 max-w-lg text-lg text-slate-500 leading-[1.7] mx-auto lg:mx-0">
                  THOR conçoit des plateformes SaaS pour les professionnels de santé.
                  Conformité <strong className="text-slate-700 font-semibold">HDS</strong>,{" "}
                  <strong className="text-slate-700 font-semibold">SESAM-Vitale</strong>,{" "}
                  <strong className="text-slate-700 font-semibold">ADRi e-CPS</strong>,
                  et une IA propriétaire intégrée.
                </p>
              </Reveal>

              <Reveal>
                <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link
                    href="#portfolio"
                    className="group relative inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03] overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, #0B1220, #1E2A3A)",
                      boxShadow: "0 8px 30px rgba(11,18,32,0.25), 0 0 0 1px rgba(99,102,241,0.15) inset",
                    }}
                  >
                    <span className="relative z-10">Découvrir l'écosystème</span>
                    <span
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.40) 0%, transparent 60%)" }}
                    />
                  </Link>
                  <Link
                    href="/connexion/praticien"
                    className="inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold text-slate-700 ring-1 ring-white/60 transition-all duration-200 hover:ring-white/90 hover:shadow-[0_4px_20px_rgba(99,102,241,0.10)]"
                    style={{
                      background: "rgba(255,255,255,0.70)",
                      backdropFilter: "blur(16px)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
                    }}
                  >
                    Espace praticien →
                  </Link>
                </div>
              </Reveal>

              {/* Stats */}
              <Reveal>
                <div className="mt-12 flex flex-wrap items-end gap-x-8 gap-y-5 justify-center lg:justify-start">
                  {[
                    { value: String(SATELLITES.length), label: "SaaS en production" },
                    { value: "HDS",   label: "Hébergement certifié" },
                    { value: "1M+",   label: "Patients suivis" },
                    { value: "24/7",  label: "Support dédié" },
                  ].map((s, i) => (
                    <div key={s.label} className="text-center lg:text-left">
                      <div className="flex items-center justify-center lg:justify-start gap-1.5">
                        <span
                          className="text-[10px] font-mono text-slate-300"
                          style={{ letterSpacing: "0.1em" }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="text-3xl font-bold text-slate-900 h-title">{s.value}</div>
                      </div>
                      <div className="mt-1 text-[10px] text-slate-500 uppercase tracking-[0.15em]">{s.label}</div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* ── COLONNE DROITE — Système orbital ──────────────────────── */}
            <div className="relative hidden lg:flex items-center justify-center min-h-[640px]">
              <div
                className="relative"
                style={{
                  width: 640,
                  height: 640,
                  transform: `perspective(1400px) rotateX(${parallax.y * 0.4}deg) rotateY(${parallax.x * -0.5}deg)`,
                  transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1)",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Halo gravitationnel central — pas de logo, juste un noyau lumineux subtil */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                  style={{
                    width: 120,
                    height: 120,
                    background:
                      "radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(45,140,255,0.10) 40%, transparent 70%)",
                    filter: "blur(8px)",
                    animation: "glowPulse 4s ease-in-out infinite",
                  }}
                />

                {/* Satellites */}
                {SATELLITES.map((s) => (
                  <SatelliteOrbit key={s.name} s={s} />
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
