"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Reveal } from "@/components/ui/reveal";
import { BrandIcon } from "@/components/brand-icon";

type SaasCardProps = {
  name: string;
  tagline: string;
  description: string;
  audience: string;
  features: string[];
  primary: string;       // hex color
  light: string;         // light bg
  href: string;          // vitrine SaaS (peut être externe)
  proHref?: string;      // espace pro (optionnel)
  status: "live" | "soon";
  logo?: React.ReactNode; // logo optionnel (SVG)
};

function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

function SaasCard({ index, name, tagline, description, audience, features, primary, light, href, proHref, status, logo }: SaasCardProps & { index: number }) {
  const external = isExternal(href);
  const cardRef = useRef<HTMLDivElement>(null);

  /* Tilt 3D au passage de la souris (effet wow subtil, max 6°) */
  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;   // 0 → 1
    const py = (e.clientY - rect.top)  / rect.height;  // 0 → 1
    const rotY = (px - 0.5) * 8;   // gauche/droite
    const rotX = (0.5 - py) * 8;   // haut/bas
    el.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px)`;
  }
  function onMouseLeave() {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "";
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="group relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10 transition-transform duration-300 will-change-transform"
      style={{
        background: "rgba(255,255,255,0.65)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.85)",
        boxShadow: "0 8px 32px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Halo coloré au survol */}
      <div
        className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-3xl opacity-40 group-hover:opacity-90 transition-opacity duration-500 pointer-events-none"
        style={{ background: `${primary}33` }}
      />

      {/* Sweep brillance qui balaye la carte au hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none overflow-hidden rounded-3xl"
        style={{ transition: "opacity 0.4s ease" }}
      >
        <div
          className="absolute inset-y-0 w-1/3"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
            animation: "cardSheen 1.2s ease-in-out",
          }}
        />
      </div>

      {/* Bordure colorée animée en haut (revele au hover) */}
      <div
        className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${primary} 50%, transparent 100%)`,
          boxShadow: `0 0 8px ${primary}`,
        }}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span
              className="text-[10px] font-mono text-slate-300"
              style={{ letterSpacing: "0.1em" }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            {logo ? (
              <div
                className="w-12 h-12 grid place-items-center shrink-0"
                style={{ color: primary }}
              >
                {logo}
              </div>
            ) : (
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: primary,
                  boxShadow: `0 0 0 4px ${primary}1A, 0 0 12px ${primary}80`,
                  animation: status === "live" ? "glowPulse 2.4s ease-in-out infinite" : undefined,
                }}
              />
            )}
            <span
              className="text-xs font-semibold uppercase tracking-[0.15em]"
              style={{ color: primary }}
            >
              {tagline}
            </span>
          </div>
          {status === "soon" && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 px-2 py-1 rounded-full bg-slate-100/80 border border-slate-200">
              Bientôt
            </span>
          )}
        </div>

        {/* Title — taille adaptative selon longueur du nom (pas de wordBreak pour garder "PharmaPlanning" intact) */}
        <h3
          className={`font-bold tracking-tight text-slate-900 mb-3 h-title ${
            name.length > 13
              ? "text-xl lg:text-[26px]"
              : name.length > 10
                ? "text-2xl lg:text-3xl"
                : "text-3xl lg:text-4xl"
          }`}
          style={{ lineHeight: 1.05 }}
        >
          {name}
        </h3>

        <p className="text-slate-600 text-base leading-relaxed mb-2">
          {description}
        </p>
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-6">
          {audience}
        </p>

        {/* Features */}
        <ul className="space-y-2 mb-8">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0" style={{ color: primary }}>
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {f}
            </li>
          ))}
        </ul>

        {/* CTAs */}
        {status === "live" ? (
          <div className="flex flex-wrap gap-3">
            {external ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: primary,
                  boxShadow: `0 4px 20px ${primary}66`,
                }}
              >
                Découvrir {name}
              </a>
            ) : (
              <Link
                href={href}
                className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: primary,
                  boxShadow: `0 4px 20px ${primary}66`,
                }}
              >
                Découvrir {name}
              </Link>
            )}
            {proHref && (
              <Link
                href={proHref}
                className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:bg-white"
                style={{
                  color: primary,
                  background: light,
                  border: `1px solid ${primary}33`,
                }}
              >
                Espace pro →
              </Link>
            )}
          </div>
        ) : (
          <button
            disabled
            className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-slate-400 bg-slate-100/80 border border-slate-200 cursor-not-allowed"
          >
            Bientôt disponible
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Logo PharmaPlanning : croix de pharmacie en 5 carrés arrondis ── */
function PharmaPlanningLogo() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
      <rect x="9" y="2" width="6" height="6" rx="1.4"/>
      <rect x="2" y="9" width="6" height="6" rx="1.4"/>
      <rect x="9" y="9" width="6" height="6" rx="1.4"/>
      <rect x="16" y="9" width="6" height="6" rx="1.4"/>
      <rect x="9" y="16" width="6" height="6" rx="1.4"/>
    </svg>
  );
}

/* ── Logo J.A.R.V.I.S : arc reactor cyan sur fond clair ── */
function JarvisLogo() {
  return (
    <Image
      src="/images/logos/jarvis-v2.png"
      alt="J.A.R.V.I.S"
      width={48}
      height={48}
      className="shrink-0 object-contain"
      style={{ filter: "contrast(1.15) saturate(1.25)" }}
    />
  );
}

export function SaasPortfolio() {
  return (
    <section id="portfolio" className="relative py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-6">

        <Reveal>
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4 block">
              Nos plateformes
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 h-title">
              L'écosystème <span className="font-light text-slate-500">THOR</span>
            </h2>
            <p className="mt-5 text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
              Chaque plateforme est conçue pour un métier précis,
              avec une expertise verticale et une certification adaptée.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <Reveal>
            <SaasCard
              index={0}
              name="PharmaPlanning"
              tagline="Officine"
              description="Outil de planning et de gestion d'agenda pour pharmacies et officines. Coordination d'équipe et organisation simplifiée."
              audience="Pharmaciens · Préparateurs"
              features={[
                "Agenda partagé multi-équipiers",
                "Gestion des plannings et congés",
                "Suivi des présences en temps réel",
                "Interface épurée et rapide",
              ]}
              primary="#059669"
              light="#D1FAE5"
              href="https://pharmapinvertagenda.vercel.app/"
              status="live"
              logo={<PharmaPlanningLogo />}
            />
          </Reveal>

          <Reveal>
            <SaasCard
              index={1}
              name="Clair Vision"
              tagline="Optique"
              description="Plateforme métier pour opticiens et optométristes. Gestion complète du cabinet, du dossier patient à la facturation."
              audience="Opticiens · Optométristes · Visagistes"
              features={[
                "Dossiers patients & ordonnances",
                "Stock, devis, facturation, tiers payant",
                "Calculateur lentilles intégré",
                "IA THOR pour la navigation",
              ]}
              primary="#2D8CFF"
              light="#EFF6FF"
              href="/clair-vision"
              proHref="/connexion/praticien?module=vision"
              status="live"
              logo={<BrandIcon brand="vision" size={38} />}
            />
          </Reveal>

          <Reveal>
            <SaasCard
              index={2}
              name="Clair Audition"
              tagline="Audiologie"
              description="Plateforme métier pour audioprothésistes. Bilans auditifs, suivi appareillage et essais en un seul outil."
              audience="Audioprothésistes · Assistants"
              features={[
                "Audiogrammes & bilans auditifs",
                "Suivi appareillage et essais",
                "Agenda et messagerie patient",
                "OCR audiogrammes par IA",
              ]}
              primary="#00C98A"
              light="#ECFDF5"
              href="/clair-audition"
              proHref="/connexion/praticien?module=audition"
              status="live"
              logo={<BrandIcon brand="audition" size={38} />}
            />
          </Reveal>

          <Reveal>
            <SaasCard
              index={3}
              name="J.A.R.V.I.S"
              tagline="Assistant IA"
              description="Assistant intelligent multi-usage. Compagnon conversationnel, automatisation et productivité — pensé pour aller à l'essentiel."
              audience="Tous publics · Pro & particulier"
              features={[
                "Conversations naturelles & contextuelles",
                "Automatisation de tâches répétitives",
                "Mémoire persistante de vos préférences",
                "Intégration native dans THOR",
              ]}
              primary="#0EA5E9"
              light="#F0F9FF"
              href="https://jarvis-pi-pied.vercel.app/"
              status="live"
              logo={<JarvisLogo />}
            />
          </Reveal>

          <Reveal>
            <SaasCard
              index={4}
              name="En préparation"
              tagline="Prochain SaaS"
              description="Une nouvelle plateforme métier rejoindra l'écosystème prochainement."
              audience="Restez informé"
              features={[
                "Architecture certifiée santé",
                "Intégration native dans THOR",
                "Conformité HDS dès le lancement",
              ]}
              primary="#6366F1"
              light="#EEF2FF"
              href="#"
              proHref="#"
              status="soon"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
