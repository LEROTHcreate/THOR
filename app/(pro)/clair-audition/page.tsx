"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const ACCENT = "#00C98A";
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
          <div className="flex items-center gap-2.5">
            <div
              className="grid h-8 w-8 place-items-center rounded-xl"
              style={{ background: ACCENT, boxShadow: `0 2px 8px ${ACCENT}44` }}
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7-3 8-3 8H9a3 3 0 0 1-3-3" />
                <path d="M10 13c0-1.5 1-2 1-3a2 2 0 0 0-4 0" />
                <circle cx="12" cy="20" r="1" />
              </svg>
            </div>
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
  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden pt-16"
      style={{ background: "linear-gradient(145deg, #f8fafc 0%, #f0fdf9 35%, #e6fff7 65%, #f8fafc 100%)" }}
    >
      {/* Dot grid texture */}
      <div className="pointer-events-none absolute inset-0"
           style={{ backgroundImage: `radial-gradient(rgba(0,201,138,0.09) 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />

      {/* Orbes pleine largeur */}
      <div className="pointer-events-none absolute -top-20 right-0 h-[1100px] w-[1100px] rounded-full blur-3xl"
           style={{ background: "rgba(0,201,138,0.11)", animation: "orbDrift 18s ease-in-out infinite" }} />
      <div className="pointer-events-none absolute -bottom-40 -left-20 h-[800px] w-[800px] rounded-full blur-3xl"
           style={{ background: "rgba(0,201,138,0.07)", animation: "orbDrift 22s 4s ease-in-out infinite" }} />
      <div className="pointer-events-none absolute top-1/3 left-1/3 h-[500px] w-[500px] rounded-full blur-3xl"
           style={{ background: "rgba(14,165,233,0.04)", animation: "orbDrift 28s 9s ease-in-out infinite" }} />

      {/* Corner decorations */}
      <svg className="pointer-events-none absolute top-0 left-0 opacity-[0.06]" width="240" height="240" viewBox="0 0 240 240">
        {[0,40,80,120,160,200,240].map(x => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="240" stroke="#00C98A" strokeWidth="0.5"/>)}
        {[0,40,80,120,160,200,240].map(y => <line key={`h${y}`} x1="0" y1={y} x2="240" y2={y} stroke="#00C98A" strokeWidth="0.5"/>)}
      </svg>
      <svg className="pointer-events-none absolute bottom-0 right-0 opacity-[0.06]" width="240" height="240" viewBox="0 0 240 240">
        {[0,40,80,120,160,200,240].map(x => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="240" stroke="#00C98A" strokeWidth="0.5"/>)}
        {[0,40,80,120,160,200,240].map(y => <line key={`h${y}`} x1="0" y1={y} x2="240" y2={y} stroke="#00C98A" strokeWidth="0.5"/>)}
      </svg>

      <div className="relative z-10 w-full px-8 sm:px-14 lg:px-20 2xl:px-28 py-20">
        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-12 xl:gap-20 items-center">

          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-7 border"
              style={{ background: "var(--glass-nav-bg)", backdropFilter: "blur(12px)", borderColor: "rgba(0,201,138,0.25)", color: "#065F46", animation: "fadeInUp 0.7s ease both" }}
            >
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: ACCENT }} />
              Votre espace santé auditive
            </div>

            <h1
              className="text-5xl lg:text-6xl xl:text-7xl font-light tracking-tight text-slate-900 leading-[1.08] mb-6"
              style={{ animation: "fadeInUp 0.7s 0.12s ease both" }}
            >
              Prenez soin<br />
              <span
                className="font-black"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                de votre audition
              </span>
              <br />
              <span className="font-semibold text-slate-800">en toute clarté</span>
            </h1>

            <p className="text-lg xl:text-xl text-slate-500 leading-relaxed mb-8 max-w-lg" style={{ animation: "fadeInUp 0.7s 0.22s ease both" }}>
              Bilans auditifs, suivi de vos appareils, ordonnances et messagerie directe avec votre audioprothésiste — depuis un seul espace sécurisé.
            </p>

            <div className="flex flex-col sm:flex-row gap-3" style={{ animation: "fadeInUp 0.7s 0.32s ease both" }}>
              <Link
                href="/connexion/patient?space=audition"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                style={{ background: ACCENT, boxShadow: `0 4px 24px ${ACCENT}44` }}
              >
                Accéder à mon espace
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <button
                onClick={() => scrollTo("services")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border px-7 py-4 text-sm font-semibold text-slate-700 transition-all hover:shadow-md hover:bg-white"
                style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(12px)", borderColor: "rgba(0,201,138,0.18)" }}
              >
                Découvrir
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-0 text-sm" style={{ animation: "fadeInUp 0.7s 0.44s ease both" }}>
              {[
                { n: "4 000+", label: "patients suivis" },
                { n: "98%",    label: "satisfaction" },
                { n: "48h",    label: "délai de réponse" },
              ].map((s, i) => (
                <div key={s.n} style={{ paddingLeft: i > 0 ? 28 : 0, marginLeft: i > 0 ? 28 : 0, borderLeft: i > 0 ? "1px solid rgba(0,0,0,0.10)" : "none" }}>
                  <div className="font-black text-slate-900 text-xl">{s.n}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Droite — mock UI audition élargi */}
          <div className="hidden lg:block relative" style={{ animation: "fadeInUp 0.9s 0.3s ease both, floatY 7s 1.2s ease-in-out infinite" }}>

            {/* Glow derrière la carte */}
            <div className="absolute inset-4 rounded-3xl blur-2xl"
                 style={{ background: `linear-gradient(135deg, ${ACCENT}22, #0EA5E918)`, transform: "translateY(8px) scale(1.02)" }} />

            <div
              className="relative rounded-3xl p-7 shadow-[0_40px_100px_rgba(0,201,138,0.16)]"
              style={{ background: "var(--glass-strong-bg)", backdropFilter: "blur(28px)", border: "1px solid rgba(255,255,255,0.88)" }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="font-bold text-slate-800 text-base">Bonjour, Robert</div>
                  <div className="text-xs text-slate-400 mt-0.5">Dernier bilan il y a 6 mois</div>
                </div>
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: ACCENT, boxShadow: `0 4px 14px ${ACCENT}44` }}
                >
                  RC
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Prochain RDV",    value: "22 jan.", icon: "M3 4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16H3V4Zm0 6h18M8 2v4M16 2v4" },
                  { label: "Mes appareils",   value: "2 actifs", icon: "M3 18v-6a9 9 0 0 1 18 0v6M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3ZM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z" },
                  { label: "Bilans auditifs", value: "3 bilans", icon: "M9 19V6l12-3v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2Zm12-3c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2Z" },
                  { label: "Messages",       value: "1 nouveau", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl p-3.5"
                       style={{ background: "rgba(0,201,138,0.05)", border: "1px solid rgba(0,201,138,0.09)" }}>
                    <svg className="w-4 h-4 mb-2" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={s.icon} />
                    </svg>
                    <div className="text-[11px] text-slate-400 mb-0.5">{s.label}</div>
                    <div className="text-sm font-bold text-slate-800">{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Appareil actif */}
              <div className="rounded-2xl p-4 mb-3" style={{ background: "rgba(0,201,138,0.06)", border: "1px solid rgba(0,201,138,0.14)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600">Appareil actif — OD</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                        style={{ background: "rgba(0,201,138,0.12)", color: "#065F46" }}>
                    Classe II
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-800">Phonak Audéo Lumity 90</div>
                <div className="text-xs text-slate-500 mt-0.5">Livré le 12 mars 2024 · Contrôle dans 2 mois</div>
              </div>

              {/* Audiogramme simplifié */}
              <div className="rounded-2xl p-4" style={{ background: "var(--glass-subtle-bg)", border: "1px solid rgba(0,0,0,0.05)" }}>
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-xs font-semibold text-slate-600">Audiogramme</span>
                  <span className="text-xs font-bold" style={{ color: ACCENT }}>Bilan 2024</span>
                </div>
                <div className="flex items-end gap-1.5 h-10">
                  {[40, 35, 30, 38, 45, 42, 50, 48].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t"
                         style={{ height: `${h}%`, background: i < 4 ? `${ACCENT}` : `${ACCENT}55`, transition: "height .3s" }} />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-slate-400">250Hz</span>
                  <span className="text-[9px] text-slate-400">8kHz</span>
                </div>
              </div>
            </div>

            {/* Badge flottant bas-gauche */}
            <div
              className="absolute -bottom-5 -left-10 rounded-2xl px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.10)] flex items-center gap-3"
              style={{ background: "var(--glass-card-bg)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.95)", animation: "fadeInUp 0.7s 0.6s ease both, floatY 8s 1.8s ease-in-out infinite" }}
            >
              <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: "rgba(0,201,138,0.10)" }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7-3 8-3 8H9a3 3 0 0 1-3-3" />
                  <circle cx="12" cy="20" r="1" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700">100% Santé — RAC 0 €</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT }} />
                  <span className="text-xs text-slate-500">Classe I prise en charge</span>
                </div>
              </div>
            </div>

            {/* Badge RGPD top-right */}
            <div
              className="absolute -top-4 right-4 rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm flex items-center gap-1.5"
              style={{ background: "var(--glass-card-bg)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.98)", animation: "fadeInUp 0.7s 0.5s ease both" }}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              Données chiffrées · RGPD
            </div>

            {/* Badge RDV top-left */}
            <div
              className="absolute -top-8 -left-8 rounded-2xl px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.09)] flex items-center gap-3"
              style={{ background: "var(--glass-card-bg)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.95)", animation: "fadeInUp 0.7s 0.72s ease both, floatY 9s 2.4s ease-in-out infinite" }}
            >
              <div className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: "rgba(16,185,129,0.10)" }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M3 4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16H3V4Zm0 6h18M8 2v4M16 2v4" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700">RDV de suivi</div>
                <div className="text-xs text-slate-500 mt-0.5">22 jan. · 14h00</div>
              </div>
            </div>

            {/* Badge renouvellement bottom-right */}
            <div
              className="absolute -bottom-10 -right-6 rounded-2xl px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.09)] flex items-center gap-3"
              style={{ background: "var(--glass-card-bg)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.95)", animation: "fadeInUp 0.7s 0.84s ease both, floatY 10s 3s ease-in-out infinite" }}
            >
              <div className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: "rgba(14,165,233,0.10)" }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="1.8" strokeLinecap="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700">Appareillage SS</div>
                <div className="text-xs text-slate-500 mt-0.5">Renouvellement 2025</div>
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
        @keyframes floatY {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        @keyframes orbDrift {
          0%,100% { transform: translate(0, 0) scale(1); }
          33%     { transform: translate(30px, -20px) scale(1.04); }
          66%     { transform: translate(-20px, 15px) scale(0.97); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
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
