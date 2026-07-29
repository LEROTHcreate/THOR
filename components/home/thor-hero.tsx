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

/* J.A.R.V.I.S — orbite spéciale ultra futuriste, plus proche du noyau THOR */
const JARVIS = {
  href: "https://jarvis-pi-pied.vercel.app/",
  color: "#0EA5E9",
  rx: 145,
  ry: 115,
  duration: 18,
  delay: -4,
};

/* ──────────────────────────────────────────────────────────────────────── */

function SatelliteOrbit({ s }: { s: Satellite }) {
  // Path SVG pour ellipse centrée en (0,0)
  const ellipsePath = `M -${s.rx} 0 a ${s.rx} ${s.ry} 0 1 0 ${s.rx * 2} 0 a ${s.rx} ${s.ry} 0 1 0 -${s.rx * 2} 0`;
  const external = /^https?:\/\//.test(s.href);

  /* Contenu visible du satellite — dot + label.
     Le dot est centré EXACTEMENT sur (0,0) qui est le point du chemin.
     Le label est positionné à droite, centré verticalement. */
  const Content = (
    <>
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

/* Orbite J.A.R.V.I.S — même style que les autres satellites, mais le logo suit la piste */
function JarvisOrbit() {
  const { rx, ry, duration, delay, color, href } = JARVIS;
  const ellipsePath = `M -${rx} 0 a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 -${rx * 2} 0`;

  return (
    <div className="absolute top-1/2 left-1/2" style={{ width: 0, height: 0 }}>
      {/* Trace de l'orbite — pointillé identique aux autres */}
      <svg
        className="absolute pointer-events-none"
        style={{
          top: -ry,
          left: -rx,
          width: rx * 2,
          height: ry * 2,
          overflow: "visible",
        }}
        viewBox={`-${rx} -${ry} ${rx * 2} ${ry * 2}`}
      >
        <ellipse
          cx="0" cy="0" rx={rx} ry={ry}
          fill="none"
          stroke={`${color}40`}
          strokeWidth="1"
          strokeDasharray="3 6"
        />
      </svg>

      {/* Le satellite J.A.R.V.I.S — le logo lui-même suit la trajectoire */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="J.A.R.V.I.S — Assistant IA"
        className="orbit-track group/jarvis block cursor-pointer"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          offsetPath: `path("${ellipsePath}")`,
          offsetRotate: "0deg",
          animation: `orbitAlong ${duration}s linear infinite`,
          animationDelay: `${delay}s`,
          willChange: "offset-distance",
        }}
      >
        {/* Orbe Jarvis : disque bleu avec point blanc central — pur CSS, zéro coût GPU */}
        <span
          className="absolute block transition-transform duration-200 group-hover/jarvis:scale-125 cursor-pointer"
          style={{
            top: 0, left: 0,
            width: 14, height: 14,
            transform: "translate(-50%, -50%)",
            borderRadius: "9999px",
            background: color,
            boxShadow: `0 0 0 4px ${color}1A, 0 0 14px ${color}AA`,
            display: "grid",
            placeItems: "center",
            animation: "glowPulse 2.4s ease-in-out infinite",
          }}
        >
          <span
            aria-hidden="true"
            className="block rounded-full"
            style={{ width: 5, height: 5, background: "#fff", boxShadow: "0 0 4px #fff" }}
          />
        </span>

        {/* Label J.A.R.V.I.S à droite — fond opaque (pas de backdrop-filter coûteux) */}
        <span
          className="absolute rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 group-hover/jarvis:-translate-y-0.5 cursor-pointer"
          style={{
            position: "absolute",
            top: 0,
            left: 12,
            transform: "translateY(-50%)",
            background: "#fff",
            border: "1px solid rgba(226,232,240,0.9)",
            color,
            boxShadow: `0 2px 8px ${color}26`,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.1em",
          }}
        >
          J.A.R.V.I.S
        </span>
      </a>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

export default function ThorHero() {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  useEffect(() => {
    // Respect prefers-reduced-motion : pas de parallax pour les utilisateurs sensibles
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    // Throttle via requestAnimationFrame — 1 update / frame (~60Hz) au lieu d'un par pixel
    let raf = 0;
    let lastX = 0, lastY = 0;
    function onMove(e: MouseEvent) {
      lastX = e.clientX;
      lastY = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        setParallax({
          x: (lastX / window.innerWidth - 0.5) * 24,
          y: (lastY / window.innerHeight - 0.5) * 16,
        });
        raf = 0;
      });
    }
    function onResize() {
      const w = window.innerWidth;
      setScale(w >= 1280 ? 1 : w >= 768 ? 0.72 : 0.55);
    }
    onResize();
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section className="relative flex items-center" style={{ minHeight: "calc(100vh - 5rem)" }}>
      <div className="relative z-10 w-full">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="grid md:grid-cols-[1fr_1.05fr] gap-10 md:gap-12 lg:gap-16 items-center">

            {/* ── COLONNE GAUCHE — Texte ─────────────────────────────────── */}
            <div className="text-center md:text-left">

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
                    Studio de création · Éditeur de logiciels métier
                  </span>
                </div>
              </Reveal>

              <Reveal>
                <h1
                  className="text-[2.5rem] sm:text-5xl md:text-5xl lg:text-7xl xl:text-[5.5rem] font-bold leading-[0.98] tracking-tight text-slate-900 h-title"
                  style={{
                    transform: `translate(${parallax.x * -0.5}px, ${parallax.y * -0.3}px)`,
                    transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1)",
                  }}
                >
                  De l&apos;idée
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
                    au site en ligne
                  </span>
                </h1>
              </Reveal>

              <Reveal>
                <p className="mt-6 sm:mt-7 max-w-lg text-base sm:text-lg text-slate-500 leading-[1.7] mx-auto md:mx-0">
                  THOR accompagne la création d&apos;entreprise de A à Z —{" "}
                  <strong className="text-slate-700 font-semibold">étude du marché</strong>,{" "}
                  <strong className="text-slate-700 font-semibold">identité</strong>,{" "}
                  <strong className="text-slate-700 font-semibold">site sur mesure</strong> —
                  et édite ses propres plateformes métier pour les professionnels de santé.
                </p>
              </Reveal>

              <Reveal>
                <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <Link
                    href="#branches"
                    className="group relative inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03] overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, #0B1220, #1E2A3A)",
                      boxShadow: "0 8px 30px rgba(11,18,32,0.25), 0 0 0 1px rgba(99,102,241,0.15) inset",
                    }}
                  >
                    <span className="relative z-10">Par où commencer</span>
                    <span
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.40) 0%, transparent 60%)" }}
                    />
                  </Link>
                  <Link
                    href="/realisations"
                    className="inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold text-slate-700 ring-1 ring-white/60 transition-all duration-200 hover:ring-white/90 hover:shadow-[0_4px_20px_rgba(99,102,241,0.10)]"
                    style={{
                      background: "rgba(255,255,255,0.70)",
                      backdropFilter: "blur(16px)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
                    }}
                  >
                    Voir nos réalisations →
                  </Link>
                </div>
              </Reveal>

              {/* Stats */}
              <Reveal>
                <div className="mt-10 sm:mt-12 flex flex-wrap items-end gap-x-6 sm:gap-x-8 gap-y-5 justify-center md:justify-start">
                  {[
                    { value: String(SATELLITES.length + 1), label: "Projets en production" },
                    { value: "A → Z", label: "Accompagnement complet" },
                    { value: "HDS",   label: "Hébergement certifié" },
                    { value: "24/7",  label: "Support dédié" },
                  ].map((s, i) => (
                    <div key={s.label} className="text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-1.5">
                        <span
                          className="text-[10px] font-mono text-slate-300"
                          style={{ letterSpacing: "0.1em" }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="text-2xl sm:text-3xl font-bold text-slate-900 h-title">{s.value}</div>
                      </div>
                      <div className="mt-1 text-[10px] text-slate-500 uppercase tracking-[0.15em]">{s.label}</div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* ── COLONNE DROITE — Système orbital ──────────────────────── */}
            <div className="relative hidden md:flex items-center justify-center" style={{ minHeight: 640 * scale }}>
              <div
                className="relative"
                style={{
                  width: 640,
                  height: 640,
                  transform: `perspective(1400px) rotateX(${parallax.y * 0.4}deg) rotateY(${parallax.x * -0.5}deg) scale(${scale})`,
                  transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1)",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Noyau THOR — pur halo gravitationnel sans logo (neutre) */}
                <div
                  aria-hidden="true"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                  style={{
                    width: 120,
                    height: 120,
                    background:
                      "radial-gradient(circle, rgba(99,102,241,0.30) 0%, rgba(45,140,255,0.12) 40%, transparent 70%)",
                    filter: "blur(8px)",
                    animation: "glowPulse 4s ease-in-out infinite",
                  }}
                />

                {/* Orbite J.A.R.V.I.S — orbite intérieure ultra futuriste */}
                <JarvisOrbit />

                {/* Satellites — SaaS métier en orbites larges */}
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
