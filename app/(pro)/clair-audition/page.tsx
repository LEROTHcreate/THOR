"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandIcon } from "@/components/brand-icon";
import { usePointerParallax, PARALLAX_INITIAL } from "@/lib/usePointerParallax";

const ACCENT = "#00C98A";
const ACCENT_DEEP = "#00A876";
const ACCENT2 = "#0EA5E9";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ── useReveal ───────────────────────────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ── Header ─────────────────────────────────────────────────────────────── */
function Header({ scrolled }: { scrolled: boolean }) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(255,255,255,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(0,201,138,0.10)" : "none",
        boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.05)" : "none",
      }}
    >
      <div className="flex h-16 w-full items-center justify-between px-8 sm:px-14 lg:px-20 2xl:px-28">
        {/* Left — retour + logo */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8l5 5" />
            </svg>
            THOR
          </Link>
          <span className="hidden sm:block w-px h-4 bg-slate-200" />
          <div className="flex items-center gap-2">
            <BrandIcon brand="audition" size={32} />
            <span className="text-base font-bold tracking-tight text-slate-900">
              Clair<span style={{ color: ACCENT }}>Audition</span>
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button onClick={() => scrollTo("services")} className="hover:text-slate-900 transition-colors">Services</button>
          <button onClick={() => scrollTo("comment")} className="hover:text-slate-900 transition-colors">Comment ça marche</button>
          <button onClick={() => scrollTo("securite")} className="hover:text-slate-900 transition-colors">Sécurité</button>
          <Link href="/nos-centres" className="hover:text-slate-900 transition-colors">Nos centres</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/clair-audition/pro" className="hidden sm:block text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">
            Espace pro →
          </Link>
          <Link
            href="/connexion/patient?space=audition"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ background: ACCENT, boxShadow: `0 2px 10px ${ACCENT}40` }}
          >
            Connexion
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ── Hero ────────────────────────────────────────────────────────────────── */
function Hero() {
  // Parallax via variables CSS — cf. lib/usePointerParallax : pas de re-render.
  const parallaxRef = usePointerParallax<HTMLElement>();
  const [scale, setScale] = useState(1);
  useEffect(() => {
    function onResize() {
      const w = window.innerWidth;
      setScale(w >= 1280 ? 1 : w >= 768 ? 0.72 : 0.55);
    }
    onResize();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <section
      ref={parallaxRef}
      className="relative min-h-screen flex items-center overflow-hidden pt-16"
      style={{
        background: "linear-gradient(180deg, #fbfffd 0%, #f3fbf7 50%, #f8fffe 100%)",
        ...PARALLAX_INITIAL,
      }}
    >
      {/* Fond animé — blobs (palette Audition).
          Pas de `filter: blur()` ici : ces radial-gradients sont déjà diffus et
          le blur forçait une re-rasterisation plein écran à chaque frame. */}
      <div aria-hidden="true" data-decor="motion" className="absolute inset-0 overflow-hidden pointer-events-none" style={{ mixBlendMode: "multiply", contain: "strict" }}>
        <div className="absolute" style={{
          width: "55vw", height: "55vw", maxWidth: 850, maxHeight: 850,
          top: "-15%", left: "-12%",
          background: "radial-gradient(circle at 30% 30%, rgba(0,201,138,0.50) 0%, rgba(0,201,138,0) 65%)",
          animation: "morphBlob1 28s ease-in-out infinite",
          willChange: "transform",
        }} />
        <div className="absolute" style={{
          width: "50vw", height: "50vw", maxWidth: 800, maxHeight: 800,
          top: "10%", right: "-15%",
          background: "radial-gradient(circle at 60% 40%, rgba(14,165,233,0.42) 0%, rgba(14,165,233,0) 65%)",
          animation: "morphBlob2 34s ease-in-out infinite",
          animationDelay: "-6s",
          willChange: "transform",
        }} />
        <div className="absolute" style={{
          width: "48vw", height: "48vw", maxWidth: 750, maxHeight: 750,
          bottom: "-5%", left: "20%",
          background: "radial-gradient(circle at 50% 50%, rgba(20,184,166,0.30) 0%, rgba(20,184,166,0) 65%)",
          animation: "morphBlob3 30s ease-in-out infinite",
          animationDelay: "-12s",
          willChange: "transform",
        }} />
      </div>

      {/* Dot grid subtil */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.35]"
           style={{
             backgroundImage: `radial-gradient(circle, rgba(0,201,138,0.16) 1px, transparent 1px)`,
             backgroundSize: "32px 32px",
             maskImage: "radial-gradient(ellipse 80% 60% at center, black 0%, transparent 75%)",
             WebkitMaskImage: "radial-gradient(ellipse 80% 60% at center, black 0%, transparent 75%)",
           }} />

      {/* Particules flottantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { left: "12%", delay: 0,  size: 3, duration: 20 },
          { left: "24%", delay: 4,  size: 4, duration: 24 },
          { left: "38%", delay: 8,  size: 3, duration: 22 },
          { left: "52%", delay: 2,  size: 3, duration: 25 },
          { left: "66%", delay: 12, size: 4, duration: 19 },
          { left: "78%", delay: 6,  size: 3, duration: 23 },
          { left: "90%", delay: 10, size: 3, duration: 21 },
        ].map((p, i) => (
          <div key={i} className="absolute rounded-full" style={{
            left: p.left, bottom: "-10px",
            width: p.size, height: p.size,
            background: "rgba(0,201,138,0.65)",
            boxShadow: "0 0 8px rgba(0,201,138,0.55)",
            animation: `floatParticle ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }} />
        ))}
      </div>

      <div className="relative z-10 w-full px-8 sm:px-14 lg:px-20 2xl:px-28 py-20">
        <div className="grid md:grid-cols-[1fr_1.1fr] gap-10 md:gap-12 xl:gap-20 items-center">

          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-xs font-medium text-slate-500 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,201,138,0.10),inset_0_1px_0_rgba(255,255,255,0.9)] mb-8"
              style={{
                transform: "translate(calc(var(--px) * 0.3), calc(var(--py) * 0.3))",
                transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-[#00C98A]"
                style={{ animation: "glowPulse 2.4s ease-in-out infinite", boxShadow: "0 0 10px rgba(0,201,138,0.7)" }}
              />
              <span className="uppercase tracking-[0.12em] text-[11px]">
                Espace santé auditive · Patient
              </span>
            </div>

            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-slate-900 leading-[0.98] mb-7 h-title"
                style={{
                  transform: "translate(calc(var(--px) * -0.5), calc(var(--py) * -0.3))",
                  transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1)",
                }}
            >
              Prenez soin
              <br />
              <span
                style={{
                  background: "linear-gradient(90deg, #00A876 0%, #00C98A 30%, #14B8A6 60%, #00C98A 80%, #00A876 100%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "textGradientSlide 8s linear infinite",
                }}
              >
                de votre audition
              </span>
              <br />
              <span className="font-light text-slate-700">en toute clarté</span>
            </h1>

            <p className="text-lg text-slate-500 leading-[1.7] mb-9 max-w-lg">
              <strong className="text-slate-700 font-semibold">Bilans auditifs</strong>,
              suivi de vos <strong className="text-slate-700 font-semibold">appareils</strong>,
              ordonnances et messagerie directe avec votre audioprothésiste — depuis un seul espace sécurisé.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/connexion/patient?space=audition"
                className="group relative inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03] overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP})`,
                  boxShadow: `0 8px 30px ${ACCENT}66, 0 0 0 1px rgba(255,255,255,0.15) inset`,
                }}
              >
                <span className="relative z-10">Accéder à mon espace</span>
                <svg className="w-4 h-4 relative z-10" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.30) 0%, transparent 60%)" }}
                />
              </Link>
              <button
                onClick={() => scrollTo("services")}
                className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-slate-700 ring-1 ring-white/60 transition-all duration-200 hover:ring-white/90 hover:shadow-[0_4px_20px_rgba(0,201,138,0.10)]"
                style={{
                  background: "rgba(255,255,255,0.70)",
                  backdropFilter: "blur(16px)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
                }}
              >
                Découvrir
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="mt-14 flex flex-wrap items-end gap-x-10 gap-y-5">
              {[
                { value: "4 000+", label: "Patients suivis" },
                { value: "98%",    label: "Satisfaction" },
                { value: "48h",    label: "Délai de réponse" },
              ].map((s, i) => (
                <div key={s.value} className="text-left">
                  <div className="flex items-center gap-1.5">
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
          </div>

          {/* Droite — gros logo oreille avec anneaux et badges glass */}
          <div className="hidden md:flex relative items-center justify-center" style={{ minHeight: 580 * scale }}>
            <div
              className="relative"
              style={{
                width: 580,
                height: 580,
                transform: `perspective(1400px) rotateX(var(--rot-x)) rotateY(var(--rot-y)) scale(${scale})`,
                transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1)",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Halo lumineux derrière le logo */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                style={{
                  width: 380, height: 380,
                  background: "radial-gradient(circle, rgba(0,201,138,0.28) 0%, rgba(20,184,166,0.12) 40%, transparent 70%)",
                  filter: "blur(8px)",
                  animation: "glowPulse 4s ease-in-out infinite",
                }}
              />

              {/* Anneaux concentriques */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                style={{
                  width: 520, height: 520,
                  border: `1px dashed rgba(0,201,138,0.25)`,
                  animation: "spin 60s linear infinite",
                }}
              >
                <div className="absolute -top-1.5 left-1/2 w-3 h-3 rounded-full -translate-x-1/2"
                     style={{ background: ACCENT, boxShadow: `0 0 20px ${ACCENT}E0` }} />
              </div>
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                style={{
                  width: 440, height: 440,
                  border: `1px solid rgba(20,184,166,0.20)`,
                  animation: "spin 45s linear infinite reverse",
                }}
              >
                <div className="absolute top-1/2 -right-1.5 w-3 h-3 rounded-full -translate-y-1/2"
                     style={{ background: "#14B8A6", boxShadow: `0 0 20px rgba(20,184,166,0.9)` }} />
              </div>

              {/* Rien au centre des anneaux : le PNG de l'oreille n'est pas
                  détouré, il posait un carré blanc au milieu de l'orbite.
                  Clair Vision laisse ce centre vide, les deux pages s'alignent. */}

              {/* Badge — 100% Santé */}
              <div
                className="absolute rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{
                  top: "10%", left: "-8%",
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.95)",
                  boxShadow: `0 12px 32px rgba(0,201,138,0.18), inset 0 1px 0 rgba(255,255,255,0.95)`,
                  animation: "floatY 8s ease-in-out infinite",
                }}
              >
                <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${ACCENT}15` }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7-3 8-3 8H9a3 3 0 0 1-3-3" />
                    <circle cx="12" cy="20" r="1" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">100% Santé — RAC 0 €</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT, animation: "glowPulse 2.4s ease-in-out infinite" }} />
                    <span className="text-[11px] text-slate-500">Classe I prise en charge</span>
                  </div>
                </div>
              </div>

              {/* Badge — RDV confirmé */}
              <div
                className="absolute rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{
                  top: "8%", right: "-6%",
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.95)",
                  boxShadow: "0 12px 32px rgba(16,185,129,0.18), inset 0 1px 0 rgba(255,255,255,0.95)",
                  animation: "floatY 9s ease-in-out infinite 1s",
                }}
              >
                <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(16,185,129,0.12)" }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">RDV de suivi</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">22 jan. · 14h00</div>
                </div>
              </div>

              {/* Badge — Audiogramme */}
              <div
                className="absolute rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{
                  bottom: "12%", left: "-10%",
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.95)",
                  boxShadow: `0 12px 32px ${ACCENT}26, inset 0 1px 0 rgba(255,255,255,0.95)`,
                  animation: "floatY 7s ease-in-out infinite 0.5s",
                }}
              >
                <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${ACCENT}15` }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19V6l12-3v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2Zm12-3c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2Z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Audiogramme à jour</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Dernier bilan · 2024</div>
                </div>
              </div>

              {/* Badge — Appareillage SS */}
              <div
                className="absolute rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{
                  bottom: "10%", right: "-8%",
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.95)",
                  boxShadow: "0 12px 32px rgba(14,165,233,0.18), inset 0 1px 0 rgba(255,255,255,0.95)",
                  animation: "floatY 8.5s ease-in-out infinite 1.5s",
                }}
              >
                <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(14,165,233,0.12)" }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="1.8" strokeLinecap="round">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Appareillage SS</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Renouvellement 2025</div>
                </div>
              </div>

              {/* Badge RGPD — haut */}
              <div
                className="absolute rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 flex items-center gap-1.5"
                style={{
                  top: "-2%", right: "30%",
                  background: "rgba(255,255,255,0.92)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.98)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)",
                }}
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                <span className="text-[11px]">Données chiffrées · RGPD</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => scrollTo("services")}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
        style={{ animation: "floatY 2.5s ease-in-out infinite" }}
      >
        <span className="text-[10px] font-medium uppercase tracking-widest">Découvrir</span>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </button>
    </section>
  );
}

/* ── Services ────────────────────────────────────────────────────────────── */
const SERVICES = [
  {
    icon: "M9 19V6l12-3v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2Zm12-3c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2Z",
    title: "Bilans auditifs",
    desc: "Consultez vos audiogrammes, résultats de bilan tonal et vocal. Suivez l'évolution de votre audition dans le temps avec des courbes claires.",
    color: ACCENT,
  },
  {
    icon: "M3 18v-6a9 9 0 0 1 18 0v6M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3ZM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z",
    title: "Mes appareils auditifs",
    desc: "Retrouvez les caractéristiques de vos aides auditives, dates de livraison, contrôles effectués et prochains rendez-vous de suivi.",
    color: ACCENT2,
  },
  {
    icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM14 2v6h6M9 13h6M9 17h4",
    title: "Ordonnances & prescriptions",
    desc: "Vos prescriptions ORL stockées et accessibles. Téléchargez-les, vérifiez leur validité, partagez-les avec votre audioprothésiste.",
    color: "#6366F1",
  },
  {
    icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    title: "Messagerie sécurisée",
    desc: "Échangez directement avec votre audioprothésiste. Posez vos questions, signalez un problème avec votre appareil, demandez un rendez-vous.",
    color: "#10B981",
  },
  {
    icon: "M3 4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16H3V4Zm0 6h18M8 2v4M16 2v4",
    title: "Rendez-vous en ligne",
    desc: "Planifiez vos contrôles d'adaptation, suivis annuels ou urgences directement depuis votre espace. Rappels automatiques par SMS et email.",
    color: "#F59E0B",
  },
  {
    icon: "M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9ZM13 2v7h7",
    title: "Documents & remboursements",
    desc: "Devis LPPR, factures, attestations pour votre mutuelle — tous vos documents audiologiques centralisés et téléchargeables à tout moment.",
    color: "#8B5CF6",
  },
];

function Services() {
  const { ref: svcRef, visible: svcVisible } = useReveal();
  return (
    <section id="services" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-4"
               style={{ background: "rgba(0,201,138,0.08)", color: "#065F46" }}>
            Fonctionnalités
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Tout ce dont vous avez besoin,<br />
            <span style={{ color: ACCENT }}>en un seul endroit</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Clair Audition centralise votre suivi audiologique pour vous offrir une expérience simple, claire et sécurisée.
          </p>
        </div>

        <div ref={svcRef} className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${svcVisible ? "services-visible" : ""}`}>
          {SERVICES.map((s) => (
            <div key={s.title} className="service-card rounded-2xl p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
                 style={{ background: "rgba(248,250,252,0.80)", border: "1px solid rgba(226,232,240,0.70)" }}>
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl" style={{ background: `${s.color}14` }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={s.icon} />
                </svg>
              </div>
              <h3 className="mb-2 text-base font-semibold text-slate-800">{s.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Comment ça marche ───────────────────────────────────────────────────── */
function Comment() {
  const { ref: stepsRef, visible: stepsVisible } = useReveal();
  return (
    <section id="comment" className="py-24" style={{ background: "linear-gradient(145deg, #f8fafc 0%, #f0fdf9 60%, #f8fafc 100%)" }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-4"
               style={{ background: "rgba(0,201,138,0.08)", color: "#065F46" }}>
            Simple & rapide
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Comment ça marche ?</h2>
          <p className="text-lg text-slate-500 max-w-lg mx-auto">
            Aucune installation, aucune complexité. Votre espace auditif prêt en quelques minutes.
          </p>
        </div>

        <div ref={stepsRef} className={`grid gap-8 md:grid-cols-3 relative ${stepsVisible ? "steps-visible" : ""}`}>
          <div className="hidden md:block absolute top-10 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px"
               style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}40, transparent)` }} />
          {[
            { n: 1, title: "Votre audioprothésiste vous invite", desc: "Clair Audition est proposé par votre cabinet. Vous recevez un email d'invitation avec votre code d'accès personnel." },
            { n: 2, title: "Vous créez votre compte",          desc: "En 2 minutes, votre espace sécurisé est prêt. Vos données audiologiques sont chiffrées et vous en restez propriétaire." },
            { n: 3, title: "Tout est là, en temps réel",       desc: "Bilans, appareils, RDV, ordonnances, documents — votre suivi auditif complet synchronisé avec votre cabinet." },
          ].map((step) => (
            <div key={step.n} className="step-card flex flex-col items-center text-center">
              <div
                className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl text-2xl font-bold text-white shadow-lg"
                style={{ background: ACCENT, boxShadow: `0 8px 24px ${ACCENT}38` }}
              >
                {step.n}
              </div>
              <h3 className="mb-3 text-lg font-semibold text-slate-800">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Identité & 100% Santé ───────────────────────────────────────────────── */
function Identite() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-6"
                 style={{ background: "rgba(0,201,138,0.08)", color: "#065F46" }}>
              Notre philosophie
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
              Conçu pour<br />
              <span style={{ color: ACCENT }}>rapprocher</span> patients<br />
              et audioprothésistes
            </h2>
            <p className="text-slate-500 leading-relaxed mb-6">
              Clair Audition est né d&apos;un constat simple : le suivi auditif se fragmente entre les consultations ORL, les essais d&apos;appareils et les contrôles d&apos;adaptation. Les patients perdent le fil de leur parcours.
            </p>
            <p className="text-slate-500 leading-relaxed mb-8">
              Nous avons conçu un espace pensé pour la transparence — où chaque patient comprend son appareillage, suit ses remboursements 100% Santé, et reste en contact direct avec son audioprothésiste.
            </p>
            <div className="flex flex-col gap-3">
              {[
                "Interface accessible à tous les âges, notamment les séniors",
                "Conformité 100% Santé — RAC 0 visible et expliqué",
                "Synchronisation en temps réel avec votre cabinet",
                "Aucune publicité, aucune revente de données",
              ].map((text) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="grid h-5 w-5 place-items-center rounded-full flex-shrink-0" style={{ background: `${ACCENT}18` }}>
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-700">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Direction artistique</div>

            <div className="rounded-2xl p-5" style={{ background: "rgba(248,250,252,0.80)", border: "1px solid rgba(226,232,240,0.70)" }}>
              <div className="text-xs font-semibold text-slate-500 mb-3">Palette de couleurs</div>
              <div className="flex gap-3">
                {[
                  { hex: "#00C98A", label: "Primaire"   },
                  { hex: "#0EA5E9", label: "Secondaire" },
                  { hex: "#1E293B", label: "Texte"      },
                  { hex: "#F0FDF9", label: "Fond"       },
                  { hex: "#10B981", label: "Succès"     },
                ].map((c) => (
                  <div key={c.hex} className="flex flex-col items-center gap-1.5">
                    <div className="h-10 w-10 rounded-xl border border-white shadow-sm" style={{ background: c.hex }} />
                    <span className="text-[9px] font-mono text-slate-400">{c.hex}</span>
                    <span className="text-[9px] text-slate-500">{c.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 100% Santé card */}
            <div className="rounded-2xl p-5" style={{ background: `rgba(0,201,138,0.06)`, border: `1px solid rgba(0,201,138,0.18)` }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: `${ACCENT}20` }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-slate-800">100% Santé intégré</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clair Audition intègre la logique <strong>LPPR / 100% Santé</strong> : Classe I (RAC 0) et Classe II (prix libre) sont clairement présentées. Le patient comprend ce qu&apos;il paie, ce que rembourse l&apos;AMO et sa mutuelle.
              </p>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "rgba(248,250,252,0.80)", border: "1px solid rgba(226,232,240,0.70)" }}>
              <div className="text-xs font-semibold text-slate-500 mb-3">Style d&apos;interface</div>
              <div className="flex flex-wrap gap-2">
                {["Glassmorphisme", "Coins arrondis", "Ombres douces", "Gradients naturels", "Accessible séniors"].map(t => (
                  <span key={t} className="rounded-full px-3 py-1 text-xs font-medium"
                        style={{ background: `rgba(0,201,138,0.08)`, color: "#065F46" }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Sécurité ────────────────────────────────────────────────────────────── */
function Securite() {
  return (
    <section id="securite" className="py-24" style={{ background: "linear-gradient(145deg, #0F172A 0%, #1E293B 100%)" }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-4"
               style={{ background: "rgba(0,201,138,0.15)", color: "#6EE7B7" }}>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Sécurité & conformité
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Vos données de santé auditive,<br />
            <span style={{ color: ACCENT }}>protégées sans compromis</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Les données audiologiques sont parmi les plus sensibles. Nous appliquons les standards les plus exigeants pour les protéger.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", title: "Chiffrement bout-en-bout", desc: "Toutes vos données audiologiques sont chiffrées au repos et en transit. Personne ne peut accéder à votre dossier sans votre consentement.", color: ACCENT },
            { icon: "M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0ZM12 8v4M12 16h.01", title: "Conformité RGPD", desc: "Vous êtes propriétaire de vos données. Export, suppression, portabilité — vos droits sont garantis et accessibles en un clic.", color: ACCENT2 },
            { icon: "M5 11a7 7 0 0 1 14 0v2a7 7 0 0 1-14 0v-2ZM12 11v2", title: "Hébergement HDS", desc: "Données de santé hébergées en France chez un prestataire certifié HDS, conformément à la réglementation française sur les données de santé.", color: "#10B981" },
            { icon: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7", title: "Authentification sécurisée", desc: "Double authentification disponible. Sessions sécurisées avec déconnexion automatique. Aucun mot de passe stocké en clair.", color: "#F59E0B" },
          ].map((s) => (
            <div key={s.title} className="rounded-2xl p-6 transition-all hover:-translate-y-0.5"
                 style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl" style={{ background: `${s.color}20` }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={s.icon} />
                </svg>
              </div>
              <h3 className="mb-2 text-sm font-semibold text-white">{s.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-4">
          {["HDS France", "RGPD conforme", "ISO 27001", "Chiffrement AES-256", "TLS 1.3"].map((b) => (
            <div key={b} className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-slate-300"
                 style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
              <svg className="w-3 h-3 text-[#10B981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {b}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA Final ───────────────────────────────────────────────────────────── */
function CTAFinal() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-6"
             style={{ background: "rgba(0,201,138,0.08)", color: "#065F46" }}>
          Commencer gratuitement
        </div>
        <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
          Prêt à rejoindre<br />
          <span style={{ color: ACCENT }}>Clair Audition</span> ?
        </h2>
        <p className="text-lg text-slate-500 mb-10 max-w-md mx-auto">
          Votre audioprothésiste vous a transmis un lien ? Créez votre compte en 2 minutes et accédez à votre suivi auditif complet.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/connexion/patient?space=audition&mode=signup"
            className="inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style={{ background: ACCENT, boxShadow: `0 4px 20px ${ACCENT}38` }}
          >
            Créer mon espace patient
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link
            href="/connexion/patient?space=audition"
            className="inline-flex items-center justify-center rounded-2xl border px-7 py-3.5 text-sm font-medium text-slate-700 transition-all hover:shadow-md"
            style={{ borderColor: "rgba(0,201,138,0.20)", background: "rgba(0,201,138,0.04)" }}
          >
            J&apos;ai déjà un compte
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-lg"
                 style={{ background: ACCENT }}>
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7-3 8-3 8H9a3 3 0 0 1-3-3" />
                <circle cx="12" cy="20" r="1" />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-800">
              Clair<span style={{ color: ACCENT }}>Audition</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <Link href="/mentions-legales" className="hover:text-slate-700 transition-colors">Mentions légales</Link>
            <Link href="/confidentialite" className="hover:text-slate-700 transition-colors">Politique de confidentialité</Link>
            <Link href="/cookies" className="hover:text-slate-700 transition-colors">Cookies</Link>
            <Link href="/contact" className="hover:text-slate-700 transition-colors">Contact</Link>
            <Link href="/clair-audition/pro" className="hover:text-slate-700 transition-colors">Espace professionnel</Link>
          </div>

          <div className="text-xs text-slate-400">
            © {new Date().getFullYear()} ClairAudition · Propulsé par THOR
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function ClairAuditionLanding() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{`
        /* Animations partagées dans globals.css : floatY, fadeInUp, orbDrift */
        .service-card {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .services-visible .service-card {
          opacity: 1;
          transform: none;
        }
        .services-visible .service-card:nth-child(1) { transition-delay: 0s; }
        .services-visible .service-card:nth-child(2) { transition-delay: 0.08s; }
        .services-visible .service-card:nth-child(3) { transition-delay: 0.16s; }
        .services-visible .service-card:nth-child(4) { transition-delay: 0.24s; }
        .services-visible .service-card:nth-child(5) { transition-delay: 0.32s; }
        .services-visible .service-card:nth-child(6) { transition-delay: 0.40s; }
        .step-card {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .steps-visible .step-card {
          opacity: 1;
          transform: none;
        }
        .steps-visible .step-card:nth-child(1) { transition-delay: 0s; }
        .steps-visible .step-card:nth-child(2) { transition-delay: 0.15s; }
        .steps-visible .step-card:nth-child(3) { transition-delay: 0.30s; }
      `}</style>
      <Header scrolled={scrolled} />
      <main>
        <Hero />
        <Services />
        <Comment />
        <Identite />
        <Securite />
        <CTAFinal />
      </main>
      <Footer />
    </>
  );
}
