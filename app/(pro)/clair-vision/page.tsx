"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandIcon } from "@/components/brand-icon";

const ACCENT = "#2D8CFF";
const ACCENT_DEEP = "#1A72E8";

/* ── Scroll helper ──────────────────────────────────────────────────────── */
function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ── useReveal hook ─────────────────────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
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
        background: scrolled ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.0)",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(45,140,255,0.10)" : "none",
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
            <BrandIcon brand="vision" size={32} />
            <span className="text-base font-bold tracking-tight" style={{ color: "#0F172A" }}>
              Clair<span style={{ color: ACCENT }}>Vision</span>
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button onClick={() => scrollTo("services")} className="hover:text-slate-900 transition-colors">Services</button>
          <button onClick={() => scrollTo("comment")} className="hover:text-slate-900 transition-colors">Comment ça marche</button>
          <button onClick={() => scrollTo("securite")} className="hover:text-slate-900 transition-colors">Sécurité</button>
          <Link href="/nos-centres" className="hover:text-slate-900 transition-colors">Nos centres</Link>
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/clair-vision/pro"
            className="hidden sm:block text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            Espace pro →
          </Link>
          <Link
            href="/connexion/patient?space=vision"
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
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;
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
    <section
      className="relative min-h-screen flex items-center overflow-hidden pt-16"
      style={{ background: "linear-gradient(180deg, #fbfcff 0%, #f4f6fc 50%, #f8faff 100%)" }}
    >
      {/* Fond animé — blobs morphants (palette Vision) */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none" style={{ mixBlendMode: "multiply" }}>
        <div className="absolute" style={{
          width: "55vw", height: "55vw", maxWidth: 850, maxHeight: 850,
          top: "-15%", left: "-12%",
          background: "radial-gradient(circle at 30% 30%, rgba(45,140,255,0.50) 0%, rgba(45,140,255,0) 65%)",
          filter: "blur(60px)",
          animation: "morphBlob1 28s ease-in-out infinite",
        }} />
        <div className="absolute" style={{
          width: "50vw", height: "50vw", maxWidth: 800, maxHeight: 800,
          top: "10%", right: "-15%",
          background: "radial-gradient(circle at 60% 40%, rgba(6,182,212,0.42) 0%, rgba(6,182,212,0) 65%)",
          filter: "blur(70px)",
          animation: "morphBlob2 34s ease-in-out infinite",
          animationDelay: "-6s",
        }} />
        <div className="absolute" style={{
          width: "48vw", height: "48vw", maxWidth: 750, maxHeight: 750,
          bottom: "-5%", left: "20%",
          background: "radial-gradient(circle at 50% 50%, rgba(99,102,241,0.30) 0%, rgba(99,102,241,0) 65%)",
          filter: "blur(70px)",
          animation: "morphBlob3 30s ease-in-out infinite",
          animationDelay: "-12s",
        }} />
      </div>

      {/* Dot grid subtil */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.35]"
           style={{
             backgroundImage: `radial-gradient(circle, rgba(45,140,255,0.16) 1px, transparent 1px)`,
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
            background: "rgba(45,140,255,0.65)",
            boxShadow: "0 0 8px rgba(45,140,255,0.55)",
            animation: `floatParticle ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }} />
        ))}
      </div>

      <div className="relative z-10 w-full px-8 sm:px-14 lg:px-20 2xl:px-28 py-20">
        <div className="grid md:grid-cols-[1fr_1.1fr] gap-10 md:gap-12 xl:gap-20 items-center">

          {/* Gauche */}
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-xs font-medium text-slate-500 backdrop-blur-xl shadow-[0_4px_20px_rgba(45,140,255,0.10),inset_0_1px_0_rgba(255,255,255,0.9)] mb-8"
              style={{
                transform: `translate(${parallax.x * 0.3}px, ${parallax.y * 0.3}px)`,
                transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-[#2D8CFF]"
                style={{ animation: "glowPulse 2.4s ease-in-out infinite", boxShadow: "0 0 10px rgba(45,140,255,0.7)" }}
              />
              <span className="uppercase tracking-[0.12em] text-[11px]">
                Espace santé visuelle · Patient
              </span>
            </div>

            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-slate-900 leading-[0.98] mb-7 h-title"
                style={{
                  transform: `translate(${parallax.x * -0.5}px, ${parallax.y * -0.3}px)`,
                  transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1)",
                }}
            >
              Prenez soin
              <br />
              <span
                style={{
                  background: "linear-gradient(90deg, #1A72E8 0%, #2D8CFF 30%, #06B6D4 60%, #2D8CFF 80%, #1A72E8 100%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "textGradientSlide 8s linear infinite",
                }}
              >
                de votre vue
              </span>
              <br />
              <span className="font-light text-slate-700">en toute clarté</span>
            </h1>

            <p className="text-lg text-slate-500 leading-[1.7] mb-9 max-w-lg">
              Accédez à vos <strong className="text-slate-700 font-semibold">ordonnances</strong>,
              {" "}<strong className="text-slate-700 font-semibold">bilans visuels</strong>,
              {" "}<strong className="text-slate-700 font-semibold">lentilles</strong> et messagerie
              directe avec votre opticien — depuis un seul espace sécurisé.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/connexion/patient?space=vision"
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
                className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-slate-700 ring-1 ring-white/60 transition-all duration-200 hover:ring-white/90 hover:shadow-[0_4px_20px_rgba(45,140,255,0.10)]"
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

            {/* Engagements */}
            <div className="mt-14 flex flex-wrap items-end gap-x-10 gap-y-5">
              {[
                { value: "HDS", label: "Hébergement santé certifié" },
                { value: "FR",  label: "Données souveraines" },
                { value: "0 €", label: "Pour le patient" },
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

          {/* Droite — gros logo œil avec anneaux et badges glass */}
          <div className="hidden md:flex relative items-center justify-center" style={{ minHeight: 580 * scale }}>
            <div
              className="relative"
              style={{
                width: 580,
                height: 580,
                transform: `perspective(1400px) rotateX(${parallax.y * 0.4}deg) rotateY(${parallax.x * -0.5}deg) scale(${scale})`,
                transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1)",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Halo lumineux derrière le logo */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                style={{
                  width: 380,
                  height: 380,
                  background: "radial-gradient(circle, rgba(45,140,255,0.25) 0%, rgba(6,182,212,0.10) 40%, transparent 70%)",
                  filter: "blur(8px)",
                  animation: "glowPulse 4s ease-in-out infinite",
                }}
              />

              {/* Anneaux concentriques */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                style={{
                  width: 520, height: 520,
                  border: `1px dashed rgba(45,140,255,0.25)`,
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
                  border: `1px solid rgba(45,140,255,0.20)`,
                  animation: "spin 45s linear infinite reverse",
                }}
              >
                <div className="absolute top-1/2 -right-1.5 w-3 h-3 rounded-full -translate-y-1/2"
                     style={{ background: "#06B6D4", boxShadow: `0 0 20px rgba(6,182,212,0.9)` }} />
              </div>

              {/* Badge — Ordonnance valide */}
              <div
                className="absolute rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{
                  top: "10%", left: "-8%",
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.95)",
                  boxShadow: `0 12px 32px rgba(45,140,255,0.18), inset 0 1px 0 rgba(255,255,255,0.95)`,
                  animation: "floatY 8s ease-in-out infinite",
                }}
              >
                <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${ACCENT}15` }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16h12V2ZM14 2v6h6M9 13h6M9 17h4" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Ordonnance valide</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT, animation: "glowPulse 2.4s ease-in-out infinite" }} />
                    <span className="text-[11px] text-slate-500">Jusqu&apos;en 2027</span>
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
                  <div className="text-xs font-bold text-slate-800">RDV confirmé</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">15 jan. · 10h30</div>
                </div>
              </div>

              {/* Badge — Verres éligibles */}
              <div
                className="absolute rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{
                  bottom: "12%", left: "-10%",
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.95)",
                  boxShadow: "0 12px 32px rgba(99,102,241,0.18), inset 0 1px 0 rgba(255,255,255,0.95)",
                  animation: "floatY 7s ease-in-out infinite 0.5s",
                }}
              >
                <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(99,102,241,0.12)" }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Verres éligibles SS</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Renouvellement dispo.</div>
                </div>
              </div>

              {/* Badge — Acuité 10/10 */}
              <div
                className="absolute rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{
                  bottom: "10%", right: "-8%",
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.95)",
                  boxShadow: `0 12px 32px ${ACCENT}26, inset 0 1px 0 rgba(255,255,255,0.95)`,
                  animation: "floatY 8.5s ease-in-out infinite 1.5s",
                }}
              >
                <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${ACCENT}15` }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round">
                    <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Acuité 10/10</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Dernier bilan · Nov. 2024</div>
                </div>
              </div>

              {/* Badge RGPD — top-right haut */}
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

      {/* Scroll indicator */}
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
    icon: "M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
    title: "Bilans visuels",
    desc: "Consultez l'historique de tous vos examens de vue. Résultats, mesures et compte-rendu de votre opticien accessibles à tout moment.",
    color: ACCENT,
  },
  {
    icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM14 2v6h6M9 13h6M9 17h4",
    title: "Ordonnances",
    desc: "Retrouvez toutes vos ordonnances visuelles en un clic. Vérifiez leur validité, téléchargez-les en PDF ou partagez-les directement.",
    color: "#6366F1",
  },
  {
    icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10ZM8 12h8M12 8v8",
    title: "Lentilles de contact",
    desc: "Suivez vos lentilles : marque, puissance, fréquence de remplacement. Réservez votre prochaine boîte directement depuis l'espace patient.",
    color: "#0EA5E9",
  },
  {
    icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    title: "Messagerie sécurisée",
    desc: "Échangez directement avec votre opticien ou optométriste. Posez vos questions, envoyez des documents, suivez vos demandes.",
    color: "#10B981",
  },
  {
    icon: "M3 4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16H3V4Zm0 6h18M8 2v4M16 2v4",
    title: "Rendez-vous en ligne",
    desc: "Planifiez votre prochain examen de vue ou retrait de lentilles directement depuis votre espace. Rappels automatiques inclus.",
    color: "#F59E0B",
  },
  {
    icon: "M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9ZM13 2v7h7",
    title: "Espace documents",
    desc: "Devis, factures, attestations mutuelles — tous vos documents optiques centralisés, sécurisés et disponibles à tout moment.",
    color: "#8B5CF6",
  },
];

function Services() {
  const { ref, visible } = useReveal();
  return (
    <section id="services" className="py-24 relative">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4 block">
            Fonctionnalités
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4 h-title">
            Tout ce dont vous avez besoin,<br />
            <span style={{
              background: "linear-gradient(90deg, #1A72E8 0%, #2D8CFF 30%, #06B6D4 60%, #2D8CFF 80%, #1A72E8 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "textGradientSlide 8s linear infinite",
            }}>
              en un seul endroit
            </span>
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            Clair Vision centralise votre suivi optique pour vous offrir une expérience simple, claire et sécurisée.
          </p>
        </div>

        <div
          ref={ref}
          className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3${visible ? " services-visible" : ""}`}
        >
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="service-card rounded-2xl p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.85)", boxShadow: "0 4px 20px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.9)" }}
            >
              <div
                className="mb-4 grid h-11 w-11 place-items-center rounded-2xl"
                style={{ background: `${s.color}14` }}
              >
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
const STEPS = [
  {
    n: "01",
    title: "Votre opticien vous invite",
    desc: "Clair Vision est proposé par votre opticien ou optométriste. Vous recevez un email d'invitation avec votre code d'accès personnel.",
  },
  {
    n: "02",
    title: "Vous créez votre compte",
    desc: "En 2 minutes, vous créez votre espace sécurisé. Vos données sont immédiatement chiffrées et vous en restez propriétaire.",
  },
  {
    n: "03",
    title: "Tout est là, en temps réel",
    desc: "Bilans, ordonnances, RDV, lentilles, documents — votre suivi optique complet synchronisé avec votre cabinet.",
  },
];

function Comment() {
  const { ref, visible } = useReveal();
  return (
    <section id="comment" className="py-24 relative">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4 block">
            Simple & rapide
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4 h-title">
            Comment ça marche <span className="font-light text-slate-500">?</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-lg mx-auto leading-relaxed">
            Aucune installation, aucune complexité. Votre espace visuel prêt en quelques minutes.
          </p>
        </div>

        <div
          ref={ref}
          className={`grid gap-8 md:grid-cols-3 relative${visible ? " steps-visible" : ""}`}
        >
          {/* Ligne connectrice */}
          <div className="hidden md:block absolute top-10 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px"
               style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}60, transparent)` }} />

          {STEPS.map((step, i) => (
            <div key={step.n} className="step-card relative flex flex-col items-center text-center">
              <div className="mb-2 text-xs font-mono text-slate-300" style={{ letterSpacing: "0.1em" }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div
                className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl text-2xl font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP})`,
                  boxShadow: `0 8px 30px ${ACCENT}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
                }}
              >
                {i + 1}
              </div>
              <h3 className="mb-3 text-lg font-semibold text-slate-900 h-title">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Identité & Pour les pros ────────────────────────────────────────────── */
function Identite() {
  return (
    <section className="py-24 relative">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Gauche — Notre vision */}
          <div className="lg:sticky lg:top-28">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4 block">
              Notre vision
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.05] h-title">
              La santé visuelle,<br />
              <span style={{
                background: "linear-gradient(90deg, #1A72E8, #2D8CFF, #06B6D4)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "textGradientSlide 8s linear infinite",
              }}>fluide</span>
              <span className="font-light text-slate-600"> entre patient</span><br />
              <span className="font-light text-slate-600">et opticien.</span>
            </h2>
            <p className="text-slate-500 leading-relaxed mb-5">
              Le suivi visuel se perd souvent entre les consultations : ordonnances papier
              égarées, RDV oubliés, communication compliquée avec son opticien.
            </p>
            <p className="text-slate-500 leading-relaxed mb-8">
              Clair Vision relie les deux côtés sur la même plateforme. Chaque patient
              retrouve son dossier en clair, chaque opticien voit son cabinet plus simple
              à piloter. Pas de fioritures, pas de pub, pas de revente de données.
            </p>

            <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.85)", boxShadow: "0 4px 20px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.9)" }}>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Ce qu&apos;on construit sur la durée</div>
              <ul className="space-y-2.5 text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <span className="mt-1 inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ACCENT }} />
                  <span>Un suivi optique complet : ordonnances, bilans, lentilles, équipements, renouvellements.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-1 inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ACCENT }} />
                  <span>Une plateforme commune (THOR) qui s&apos;étend à l&apos;audition, l&apos;officine, et d&apos;autres métiers de santé.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-1 inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ACCENT }} />
                  <span>Une roadmap construite avec les opticiens — pas pensée hors-sol.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-1 inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ACCENT }} />
                  <span>Des données qui restent vôtres : hébergement HDS en France, jamais revendues.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Droite — Pour les opticiens */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4 block">
              Pour les opticiens
            </span>
            <h3 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 mb-4 leading-[1.05] h-title">
              Un outil pour votre cabinet,<br />
              <span style={{ color: ACCENT }}>un service</span><span className="font-light text-slate-600"> pour vos patients.</span>
            </h3>
            <p className="text-slate-500 leading-relaxed mb-8">
              Clair Vision n&apos;est pas juste un espace patient : c&apos;est un logiciel métier
              complet (agenda, dossiers, devis, facturation, stock) qui ouvre, en miroir,
              un accès digital aux patients que vous suivez.
            </p>

            <div className="grid gap-4">
              {[
                {
                  icon: "M3 4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16H3V4Zm0 6h18M8 2v4M16 2v4",
                  title: "Conformité incluse",
                  desc: "Hébergement HDS, RGPD, chiffrement, partenariat GIE SESAM-Vitale — vous bénéficiez d'un socle réglementaire prêt à l'emploi.",
                },
                {
                  icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138Z",
                  title: "Tout-en-un, métier",
                  desc: "Agenda, dossiers patients, ordonnances, devis normalisés, tiers-payant, stock, calculateur lentilles, statistiques — sans empiler des outils.",
                },
                {
                  icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
                  title: "Lien direct avec le patient",
                  desc: "Vos patients consultent leurs documents, prennent RDV, posent leurs questions — sans appel, sans papier perdu, sans relance pénible.",
                },
                {
                  icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.582m0 0a8.001 8.001 0 0 1-15.356-2m15.356 2H15",
                  title: "Un écosystème qui s'étend",
                  desc: "Clair Vision est un module de THOR. Clair Audition, PharmaPlanning et de nouveaux modules métier rejoignent la plateforme — vos données circulent dans un cadre unique.",
                },
              ].map((b) => (
                <div
                  key={b.title}
                  className="rounded-2xl p-5 flex gap-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.85)", boxShadow: "0 4px 20px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.9)" }}
                >
                  <div
                    className="grid h-11 w-11 place-items-center rounded-2xl flex-shrink-0"
                    style={{ background: `${ACCENT}14` }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={b.icon} />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-slate-800 mb-1.5">{b.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/clair-vision/pro"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:underline"
              style={{ color: ACCENT }}
            >
              Découvrir l&apos;espace professionnel
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Sécurité ────────────────────────────────────────────────────────────── */
const SECU_ITEMS = [
  {
    icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    title: "Chiffrement bout-en-bout",
    desc: "Toutes vos données de santé sont chiffrées au repos et en transit. Personne, pas même nos équipes, ne peut accéder à votre dossier.",
    color: "#2D8CFF",
  },
  {
    icon: "M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0ZM12 8v4M12 16h.01",
    title: "Conformité RGPD",
    desc: "Vous êtes propriétaire de vos données. Export, suppression, portabilité — vos droits sont garantis et accessibles en un clic.",
    color: "#6366F1",
  },
  {
    icon: "M5 11a7 7 0 0 1 14 0v2a7 7 0 0 1-14 0v-2ZM12 11v2",
    title: "Hébergement HDS",
    desc: "Les données de santé sont hébergées en France chez un prestataire certifié Hébergeur de Données de Santé (HDS), conformément à la réglementation française.",
    color: "#10B981",
  },
  {
    icon: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",
    title: "Authentification sécurisée",
    desc: "Double authentification disponible. Sessions sécurisées avec déconnexion automatique après inactivité. Aucun mot de passe stocké en clair.",
    color: "#F59E0B",
  },
];

function Securite() {
  return (
    <section id="securite" className="py-24 relative" style={{ background: "linear-gradient(180deg, #f8fafc 0%, #eff6ff 50%, #f8fafc 100%)" }}>
      {/* Particules subtiles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { left: "10%", delay: 0,  size: 3, duration: 22 },
          { left: "30%", delay: 7,  size: 4, duration: 26 },
          { left: "60%", delay: 3,  size: 3, duration: 24 },
          { left: "85%", delay: 11, size: 3, duration: 20 },
        ].map((p, i) => (
          <div key={i} className="absolute rounded-full" style={{
            left: p.left, bottom: "-10px",
            width: p.size, height: p.size,
            background: "rgba(45,140,255,0.45)",
            boxShadow: "0 0 8px rgba(45,140,255,0.35)",
            animation: `floatParticle ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }} />
        ))}
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4 block">
            Sécurité & conformité
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4 h-title">
            Vos données de santé,<br />
            <span style={{
              background: "linear-gradient(90deg, #1A72E8 0%, #2D8CFF 30%, #06B6D4 60%, #2D8CFF 80%, #1A72E8 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "textGradientSlide 8s linear infinite",
            }}>
              protégées sans compromis
            </span>
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            La santé visuelle est une donnée sensible. Nous appliquons les standards les plus exigeants pour la protéger.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SECU_ITEMS.map((s, i) => (
            <div
              key={s.title}
              className="rounded-2xl p-6 transition-all hover:-translate-y-1"
              style={{
                background: "rgba(255,255,255,0.65)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.85)",
                boxShadow: "0 4px 20px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-mono text-slate-300" style={{ letterSpacing: "0.1em" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div
                  className="grid h-11 w-11 place-items-center rounded-2xl"
                  style={{ background: `${s.color}14`, boxShadow: `inset 0 0 0 1px ${s.color}22` }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={s.icon} />
                  </svg>
                </div>
              </div>
              <h3 className="mb-2 text-base font-semibold text-slate-900 h-title">{s.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {["HDS France", "RGPD conforme", "ISO 27001", "Chiffrement AES-256", "TLS 1.3"].map((b) => (
            <div
              key={b}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-slate-600"
              style={{
                background: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.85)",
                boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
              }}
            >
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
    <section className="py-24 relative">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4 block">
          Commencer gratuitement
        </span>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4 h-title">
          Prêt à rejoindre<br />
          <span style={{
            background: "linear-gradient(90deg, #1A72E8, #2D8CFF, #06B6D4, #2D8CFF, #1A72E8)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "textGradientSlide 8s linear infinite",
          }}>Clair Vision</span>
          <span className="font-light text-slate-500"> ?</span>
        </h2>
        <p className="text-lg text-slate-500 mb-10 max-w-md mx-auto leading-relaxed">
          Votre opticien vous a transmis un lien ? Créez votre compte en 2 minutes et accédez à votre suivi visuel complet.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/connexion/patient?space=vision&mode=signup"
            className="group relative inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03] overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP})`,
              boxShadow: `0 8px 30px ${ACCENT}66, 0 0 0 1px rgba(255,255,255,0.15) inset`,
            }}
          >
            <span className="relative z-10">Créer mon espace patient</span>
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link
            href="/connexion/patient?space=vision"
            className="inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold text-slate-700 ring-1 ring-white/60 transition-all duration-200 hover:ring-white/90 hover:shadow-[0_4px_20px_rgba(45,140,255,0.10)]"
            style={{
              background: "rgba(255,255,255,0.70)",
              backdropFilter: "blur(16px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
            }}
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
            <div
              className="grid h-7 w-7 place-items-center rounded-lg"
              style={{ background: ACCENT }}
            >
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-800">
              Clair<span style={{ color: ACCENT }}>Vision</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <Link href="/mentions-legales" className="hover:text-slate-700 transition-colors">Mentions légales</Link>
            <Link href="/confidentialite" className="hover:text-slate-700 transition-colors">Politique de confidentialité</Link>
            <Link href="/cookies" className="hover:text-slate-700 transition-colors">Cookies</Link>
            <Link href="/contact" className="hover:text-slate-700 transition-colors">Contact</Link>
            <Link href="/clair-vision/pro" className="hover:text-slate-700 transition-colors">Espace professionnel</Link>
          </div>

          <div className="text-xs text-slate-400">
            © {new Date().getFullYear()} ClairVision · Propulsé par THOR
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function ClairVisionLanding() {
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
