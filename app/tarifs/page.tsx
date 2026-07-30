"use client";

import { useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";

/* ─── helpers ─────────────────────────────────────────────────────────── */
function cn(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

/* ─── Icônes ────────────────────────────────────────────────────────────── */
function Check({ color = "#2D8CFF" }: { color?: string }) {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4 flex-shrink-0" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="9" fill={color} opacity=".12" />
      <path d="M6 10.5l3 3 5-5.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Cross() {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4 flex-shrink-0" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="9" fill="#94a3b8" opacity=".10" />
      <path d="M7 13l6-6M13 13L7 7" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("w-5 h-5 text-slate-500 transition-transform duration-200", open && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/* ─── Modules ────────────────────────────────────────────────────────────── */
type ModuleId = "vision" | "audition" | "duo";

interface ModuleInfo {
  id: ModuleId;
  name: string;
  subtitle: string;
  audience: string;
  color: string;
  colorDeep: string;
  bg: string;
  border: string;
  savingsLabel?: string;
  iconPath: React.ReactNode;
}

const MODULES: ModuleInfo[] = [
  {
    id: "vision",
    name: "Optique",
    subtitle: "Clair Vision",
    audience: "Opticiens · Optométristes",
    color: "#2D8CFF",
    colorDeep: "#1A72E8",
    bg: "rgba(45,140,255,0.08)",
    border: "rgba(45,140,255,0.25)",
    iconPath: (
      <>
        <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  },
  {
    id: "audition",
    name: "Audition",
    subtitle: "Clair Audition",
    audience: "Audioprothésistes",
    color: "#00C98A",
    colorDeep: "#00A872",
    bg: "rgba(0,201,138,0.08)",
    border: "rgba(0,201,138,0.25)",
    iconPath: (
      <>
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3ZM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z" />
      </>
    ),
  },
  {
    id: "duo",
    name: "Optique + Audition",
    subtitle: "Pack complet",
    audience: "Cabinets multi-spécialités",
    color: "#8B5CF6",
    colorDeep: "#7C3AED",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.25)",
    savingsLabel: "−20 % sur le pack",
    iconPath: (
      <>
        <circle cx="8" cy="12" r="3" />
        <circle cx="16" cy="12" r="3" />
        <path d="M11 12h2" />
      </>
    ),
  },
];

/* ─── Plans ─────────────────────────────────────────────────────────────── */
interface Plan {
  id: "decouverte" | "pro" | "premium";
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  highlight: boolean;
  badgeText?: string;
  accent: string;
  accentBg: string;
  cta: string;
  ctaHref: string;
  ctaStyle: "primary" | "outline" | "ghost";
  trialLabel?: string;
  features: string[];
}

const COMMON_FEATURES_DECOUVERTE = [
  "1 praticien",
  "Jusqu'à 50 patients",
  "Espace patient offert",
  "Agenda & rendez-vous",
  "Dossiers patients",
  "Ordonnances",
  "Support par e-mail",
];

const COMMON_FEATURES_PRO_BASE = [
  "Jusqu'à 4 praticiens",
  "Patients illimités",
  "Espace patient offert",
  "Agenda & rendez-vous",
  "Dossiers patients",
  "Ordonnances",
  "Messagerie patients",
  "Devis & Facturation (tiers payant AMO/AMC)",
  "100% Santé — codes LPPR automatiques",
  "Statistiques & tableaux de bord",
  "Rappels automatiques patients",
  "Support prioritaire",
];

const COMMON_FEATURES_PREMIUM_BASE = [
  "Praticiens illimités",
  "Jusqu'à 5 centres",
  "Patients illimités",
  "Espace patient offert",
  "Messagerie patients",
  "Devis & Facturation (tiers payant AMO/AMC)",
  "100% Santé — codes LPPR automatiques",
  "Statistiques & tableaux de bord",
  "Tableau de bord Gérant multi-centres",
  "Export comptable (FEC)",
  "Accès ADRi / e-CPS (vérif. droits en ligne)",
  "Télétransmission SESAM-Vitale (certif. en cours)",
  "Hébergement HDS certifié",
  "Support dédié + onboarding",
];

function buildPlans(module: ModuleId): Plan[] {
  /* Tarifs par module — l'audition est plus complexe (LPPR audio, classes I/II, SCOR)
     donc légèrement plus chère. Le duo offre ~20 % d'économies par rapport au cumul. */
  const prices: Record<ModuleId, { d: [number, number]; p: [number, number]; pr: [number, number] }> = {
    vision:   { d: [9,  7],  p: [49, 39], pr: [99,  79]  },
    audition: { d: [12, 9],  p: [59, 47], pr: [119, 95]  },
    duo:      { d: [17, 13], p: [86, 69], pr: [175, 139] },
  };
  const { d, p, pr } = prices[module];

  /* Fonctionnalités spécifiques par module */
  const visionExtras   = ["Calculateur lentilles intégré", "SAV & suivi garanties"];
  const auditionExtras = ["Audiogramme intégré", "Suivi appareillage & essais", "Classes I / II côte à côte", "SAV appareils auditifs"];
  const duoExtras      = ["Calculateur lentilles intégré", "Audiogramme intégré", "Suivi appareillage & essais", "Classes I / II côte à côte", "SAV unifié optique + audio"];

  const extras = module === "vision" ? visionExtras : module === "audition" ? auditionExtras : duoExtras;

  const accentByModule = { vision: "#2D8CFF", audition: "#00C98A", duo: "#8B5CF6" }[module];

  return [
    {
      id: "decouverte",
      name: "Découverte",
      tagline: "Idéal pour évaluer THOR à moindre engagement.",
      monthlyPrice: d[0],
      yearlyPrice: d[1],
      highlight: false,
      accent: "#64748b",
      accentBg: "rgba(100,116,139,0.08)",
      cta: "Commencer",
      ctaHref: "/contact?sujet=projet",
      ctaStyle: "ghost",
      features: COMMON_FEATURES_DECOUVERTE,
    },
    {
      id: "pro",
      name: "Pro",
      tagline: "La solution complète pour un cabinet actif.",
      monthlyPrice: p[0],
      yearlyPrice: p[1],
      highlight: true,
      badgeText: "Le plus populaire",
      accent: accentByModule,
      accentBg: module === "vision" ? "rgba(45,140,255,0.08)" : module === "audition" ? "rgba(0,201,138,0.08)" : "rgba(139,92,246,0.08)",
      cta: "Démarrer — 2 mois offerts",
      ctaHref: "/contact?sujet=projet",
      ctaStyle: "primary",
      trialLabel: "2 mois gratuits • Sans carte bancaire",
      features: [...COMMON_FEATURES_PRO_BASE, ...extras],
    },
    {
      id: "premium",
      name: "Premium",
      tagline: "Pour les réseaux et cabinets multi-sites.",
      monthlyPrice: pr[0],
      yearlyPrice: pr[1],
      highlight: false,
      accent: "#8B5CF6",
      accentBg: "rgba(139,92,246,0.08)",
      cta: "Contacter l'équipe",
      ctaHref: "/contact?sujet=projet",
      ctaStyle: "outline",
      features: [...COMMON_FEATURES_PREMIUM_BASE, ...extras],
    },
  ];
}

/* ─── Tableau de comparaison ─────────────────────────────────────────────── */
interface CompRow {
  category?: string;
  feature: string;
  decouverte: boolean | string;
  pro: boolean | string;
  premium: boolean | string;
}

const COMPARISON: CompRow[] = [
  { category: "Base", feature: "Praticiens inclus", decouverte: "1", pro: "4", premium: "Illimités" },
  { feature: "Centres / sites", decouverte: "1", pro: "1", premium: "Jusqu'à 5" },
  { feature: "Patients", decouverte: "50 max", pro: "Illimités", premium: "Illimités" },
  { feature: "Espace patient (portail)", decouverte: true, pro: true, premium: true },
  { category: "Clinique & admin", feature: "Agenda & RDV", decouverte: true, pro: true, premium: true },
  { feature: "Dossiers patients", decouverte: true, pro: true, premium: true },
  { feature: "Ordonnances", decouverte: true, pro: true, premium: true },
  { feature: "Messagerie patients", decouverte: false, pro: true, premium: true },
  { feature: "SAV & garanties", decouverte: false, pro: true, premium: true },
  { feature: "Rappels automatiques", decouverte: false, pro: true, premium: true },
  { category: "Facturation santé", feature: "Devis & facturation", decouverte: false, pro: true, premium: true },
  { feature: "Tiers payant AMO / AMC", decouverte: false, pro: true, premium: true },
  { feature: "100% Santé — codes LPPR", decouverte: false, pro: true, premium: true },
  { feature: "Calculateur lentilles / appareillage", decouverte: false, pro: true, premium: true },
  { category: "Pilotage", feature: "Statistiques cabinet", decouverte: false, pro: true, premium: true },
  { feature: "Tableau de bord Gérant", decouverte: false, pro: false, premium: true },
  { feature: "Export comptable (FEC)", decouverte: false, pro: false, premium: true },
  { category: "Santé numérique", feature: "ADRi / e-CPS (droits assurés)", decouverte: false, pro: false, premium: true },
  { feature: "Télétransmission SESAM-Vitale", decouverte: false, pro: false, premium: "En cours" },
  { feature: "Hébergement HDS certifié", decouverte: false, pro: false, premium: true },
  { category: "Support", feature: "Support e-mail", decouverte: true, pro: true, premium: true },
  { feature: "Support prioritaire", decouverte: false, pro: true, premium: true },
  { feature: "Onboarding dédié", decouverte: false, pro: false, premium: true },
];

/* ─── FAQ ────────────────────────────────────────────────────────────────── */
const FAQ = [
  {
    q: "Pourquoi 2 mois gratuits et pas plus ?",
    a: "60 jours, c'est le temps qu'il faut pour vraiment adopter un nouveau logiciel de cabinet : configurer votre espace, importer vos patients, réaliser plusieurs devis tiers payant et vivre un cycle complet de renouvellements. C'est délibérément plus long qu'un essai standard pour que vous puissiez prendre votre décision sereinement.",
  },
  {
    q: "L'espace patient est-il vraiment gratuit pour mes patients ?",
    a: "Oui, sans exception. Vos patients accèdent gratuitement à leur espace personnel : ordonnances, historique de visites, messagerie avec votre cabinet. C'est inclus dans tous les plans, sans frais supplémentaires.",
  },
  {
    q: "Pourquoi des tarifs différents entre Optique et Audition ?",
    a: "L'audioprothèse est un métier plus normé administrativement (LPPR audio, classes I/II, SCOR, RAC zéro, certifications spécifiques). Le module Clair Audition embarque ces spécificités, ce qui justifie l'écart de tarif. Si vous exercez les deux métiers, le pack Optique + Audition vous fait économiser 20 % par rapport à deux abonnements séparés.",
  },
  {
    q: "Puis-je commencer par un module et ajouter l'autre plus tard ?",
    a: "Oui. Vous pouvez démarrer par Clair Vision OU Clair Audition, puis basculer sur le pack à tout moment. Vos données patients, devis et historiques sont conservés. Le passage au pack se fait en un clic depuis votre tableau de bord.",
  },
  {
    q: "La certification SESAM-Vitale est-elle obtenue ?",
    a: "Le processus de certification GIE SESAM-Vitale est en cours. La télétransmission est disponible dans le plan Premium en version bêta partenaires. Vous serez informé dès la certification officielle.",
  },
  {
    q: "Mes données de santé sont-elles sécurisées ?",
    a: "Toutes les données sont hébergées en France, chiffrées TLS 1.3. Le plan Premium bénéficie d'un hébergement HDS (Hébergeur de Données de Santé) certifié.",
  },
  {
    q: "Puis-je changer de formule ou résilier à tout moment ?",
    a: "Vous pouvez monter en formule à tout moment. La résiliation est possible à la fin de chaque période. Aucun frais de résiliation, aucun engagement.",
  },
];

/* ─── Témoignages ──────────────────────────────────────────────────────── */
const TEMOIGNAGES = [
  {
    name: "Christine V.",
    role: "Opticienne, Bordeaux",
    text: "Le module devis avec tiers payant m'économise facilement 2h par jour. Mes patients adorent leur espace personnel pour retrouver leurs ordonnances.",
    stars: 5,
    accent: "#2D8CFF",
  },
  {
    name: "Marc D.",
    role: "Audioprothésiste, Lyon",
    text: "L'audiogramme directement dans le dossier patient, c'est un gain de temps considérable. La gestion des appareillages Classe 1 / Classe 2 est enfin claire.",
    stars: 5,
    accent: "#00C98A",
  },
  {
    name: "Sophie L.",
    role: "Optométriste, Nantes",
    text: "La page statistiques avec le taux de renouvellement m'a permis de réorganiser mon planning. Je ne pourrais plus m'en passer.",
    stars: 5,
    accent: "#8B5CF6",
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════════════ */
export default function TarifsPage() {
  const [annual, setAnnual] = useState(false);
  const [module, setModule] = useState<ModuleId>("vision");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const currentModule = MODULES.find(m => m.id === module)!;
  const plans = buildPlans(module);

  return (
    <main className="bg-[#f8fafc] min-h-screen">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-16 px-6 text-center relative overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(45,140,255,0.10) 0%,rgba(0,201,138,0.08) 60%,transparent 100%)" }} />

        <Reveal>
          {/* Badge essai */}
          <div
            className="inline-flex items-center gap-3 rounded-2xl px-5 py-3 mb-8 shadow-sm"
            style={{
              background: "linear-gradient(135deg, rgba(45,140,255,0.08), rgba(0,201,138,0.06))",
              border: "1px solid rgba(45,140,255,0.18)",
            }}
          >
            <span
              className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#2D8CFF,#00C98A)" }}
            >
              OFFRE
            </span>
            <span className="text-sm font-semibold text-slate-700">
              2 mois offerts sur le plan Pro — sans carte bancaire
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-slate-900 h-title max-w-3xl mx-auto">
            Choisissez votre <span className="font-bold bg-gradient-to-r from-[#2D8CFF] to-[#00C98A] bg-clip-text text-transparent">formule</span>
          </h1>
          <p className="mt-4 text-slate-500 text-base max-w-xl mx-auto leading-[1.7]">
            Tarification par métier — Optique, Audition, ou le pack des deux avec 20 % d'économies. Portail patient toujours gratuit. Résiliation à tout moment.
          </p>
        </Reveal>

        {/* Sélecteur de module */}
        <Reveal delay={60}>
          <div className="mt-10 inline-flex flex-wrap items-stretch gap-2 rounded-2xl bg-white border border-slate-200 p-1.5 shadow-sm">
            {MODULES.map(m => {
              const isActive = m.id === module;
              return (
                <button
                  key={m.id}
                  onClick={() => setModule(m.id)}
                  className="group flex items-center gap-2.5 rounded-xl px-4 py-2.5 transition-all duration-200"
                  style={{
                    background: isActive ? m.color : "transparent",
                    color: isActive ? "white" : "#475569",
                    boxShadow: isActive ? `0 4px 16px ${m.color}40` : "none",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    {m.iconPath}
                  </svg>
                  <span className="text-sm font-semibold">{m.name}</span>
                  {m.savingsLabel && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        background: isActive ? "rgba(255,255,255,0.22)" : "rgba(139,92,246,0.12)",
                        color: isActive ? "white" : "#7C3AED",
                      }}
                    >
                      {m.savingsLabel}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Audience du module sélectionné */}
        <Reveal delay={100}>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: currentModule.color }}>
            {currentModule.subtitle} · {currentModule.audience}
          </p>
        </Reveal>

        {/* Toggle mensuel / annuel */}
        <Reveal delay={140}>
          <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-white border border-slate-200 p-1 shadow-sm">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200",
                !annual ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-700",
              )}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 flex items-center gap-2",
                annual ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-700",
              )}
            >
              Annuel
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: annual ? "rgba(0,201,138,0.2)" : "rgba(0,201,138,0.12)", color: "#00A872" }}
              >
                −20%
              </span>
            </button>
          </div>
        </Reveal>
      </section>

      {/* ── Cards ───────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1240px] px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan, i) => (
            <Reveal key={`${module}-${plan.id}`} delay={i * 80}>
              <PlanCard plan={plan} annual={annual} />
            </Reveal>
          ))}
        </div>

        {/* Comparatif rapide vs achat séparé — uniquement pour le pack */}
        {module === "duo" && (
          <Reveal delay={260}>
            <div
              className="mt-8 mx-auto max-w-2xl rounded-2xl p-5 flex items-center gap-4"
              style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(45,140,255,0.06))",
                border: "1px solid rgba(139,92,246,0.20)",
              }}
            >
              <div className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0" style={{ background: "rgba(139,92,246,0.15)" }}>
                <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 6l3 3 5-5M3 14l3 3 5-5M14 10h4" />
                </svg>
              </div>
              <div className="flex-1 text-sm">
                <div className="font-semibold text-slate-800 mb-0.5">Le pack vous fait économiser 20 %</div>
                <div className="text-xs text-slate-500">
                  Plan Pro : Optique <strong className="text-slate-700">49 €</strong> + Audition <strong className="text-slate-700">59 €</strong> = 108 €/mois.
                  Avec le pack : <strong className="text-[#7C3AED]">86 €/mois</strong> — soit <strong className="text-[#7C3AED]">22 € économisés chaque mois</strong>.
                </div>
              </div>
            </div>
          </Reveal>
        )}

        {/* Espace patient gratuit */}
        <Reveal delay={200}>
          <div className="mt-8 flex justify-center">
            <div
              className="inline-flex items-center gap-3 rounded-2xl px-6 py-4 shadow-sm"
              style={{
                background: "var(--glass-strong-bg)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.90)",
              }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,201,138,0.12)" }}>
                <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="#00C98A" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                  <path d="M10 2a5 5 0 1 1 0 10A5 5 0 0 1 10 2ZM3 18c0-3.3 3.1-6 7-6s7 2.7 7 6" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">Espace patient toujours gratuit</div>
                <div className="text-xs text-slate-500 mt-0.5">Vos patients accèdent gratuitement à leur portail, quelle que soit votre formule.</div>
              </div>
              <span className="ml-2 rounded-full bg-[#00C98A] px-3 py-1 text-[11px] font-bold text-white">Gratuit</span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Pourquoi 2 mois ? ───────────────────────────────────────────── */}
      <section className="bg-white py-16 px-6">
        <div className="mx-auto max-w-[900px]">
          <Reveal>
            <div
              className="rounded-2xl px-8 py-10 flex flex-col md:flex-row items-center gap-8"
              style={{
                background: "linear-gradient(135deg, rgba(45,140,255,0.06) 0%, rgba(0,201,138,0.04) 100%)",
                border: "1px solid rgba(45,140,255,0.14)",
              }}
            >
              {/* Durée */}
              <div className="flex-shrink-0 text-center md:text-left">
                <div
                  className="inline-flex flex-col items-center justify-center w-28 h-28 rounded-2xl shadow"
                  style={{ background: "linear-gradient(135deg,#2D8CFF,#00C98A)" }}
                >
                  <span className="text-4xl font-bold text-white leading-none">60</span>
                  <span className="text-sm font-semibold text-white/80 mt-1">jours offerts</span>
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Pourquoi 60 jours, et pas 14 ?</h2>
                <p className="text-sm text-slate-600 leading-[1.75]">
                  Changer de logiciel de cabinet demande du temps : importer vos patients, configurer vos praticiens, faire vos premiers devis tiers payant,
                  vivre un cycle complet de renouvellements. <strong className="text-slate-800">14 jours ne suffisent pas.</strong> Avec 60 jours,
                  vous pouvez tester THOR dans des conditions réelles, sans pression, avant de décider.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {[
                    "Sans carte bancaire",
                    "Sans engagement",
                    "Toutes les fonctionnalités Pro incluses",
                  ].map(label => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                      style={{ background: "rgba(45,140,255,0.10)", color: "#2D8CFF" }}
                    >
                      <Check color="#2D8CFF" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Témoignages ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-[1240px]">
          <Reveal>
            <div className="text-center mb-12">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Ils ont choisi THOR</div>
              <h2 className="text-2xl md:text-3xl font-light tracking-tight text-slate-900 h-title">
                Approuvé par les <span className="font-semibold">professionnels</span>
              </h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TEMOIGNAGES.map((t, i) => (
              <Reveal key={t.name} delay={i * 80}>
                <div
                  className="rounded-2xl p-6 h-full flex flex-col"
                  style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #e2e8f0", boxShadow: "0 2px 16px rgba(11,18,32,0.06)" }}
                >
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.stars }).map((_, s) => (
                      <svg key={s} viewBox="0 0 16 16" className="w-4 h-4" fill={t.accent} aria-hidden>
                        <path d="M8 1l1.796 3.64L14 5.34l-3 2.924.708 4.127L8 10.25l-3.708 2.14L5 8.265 2 5.34l4.204-.7L8 1Z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 leading-[1.75] flex-1">&ldquo;{t.text}&rdquo;</p>
                  <div className="mt-5 flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: t.accent }}
                    >
                      {t.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.role}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tableau comparatif ──────────────────────────────────────────── */}
      <section className="bg-white py-20 px-6">
        <div className="mx-auto max-w-[1240px]">
          <Reveal>
            <div className="text-center mb-12">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Comparaison</div>
              <h2 className="text-2xl md:text-3xl font-light tracking-tight text-slate-900 h-title">
                Toutes les <span className="font-semibold">fonctionnalités</span>
              </h2>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <div
              className="overflow-x-auto rounded-2xl"
              style={{
                background: "var(--glass-strong-bg)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.90)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
              }}
            >
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left px-6 py-5 font-semibold text-slate-800 w-1/2 border-b border-slate-200/60">Fonctionnalité</th>
                    {plans.map(p => (
                      <th key={p.id} className="px-4 py-5 text-center border-b border-slate-200/60 w-[16.6%]">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: p.highlight ? p.accent : "#64748b" }}>
                          {p.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <>
                      {row.category && (
                        <tr key={`cat-${i}`}>
                          <td colSpan={4} className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-500 bg-slate-50/80">
                            {row.category}
                          </td>
                        </tr>
                      )}
                      <tr key={`row-${i}`} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-3.5 text-slate-700 border-b border-slate-100">{row.feature}</td>
                        {(["decouverte", "pro", "premium"] as const).map(k => {
                          const val = row[k];
                          const plan = plans.find(p => p.id === k)!;
                          return (
                            <td key={k} className="px-4 py-3.5 text-center border-b border-slate-100">
                              {typeof val === "boolean" ? (
                                <div className="flex justify-center">{val ? <Check color={plan.accent} /> : <Cross />}</div>
                              ) : (
                                <span className="text-xs font-semibold" style={{ color: val === "En cours" ? "#F59E0B" : plan.accent }}>
                                  {val}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-[800px]">
          <Reveal>
            <div className="text-center mb-12">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Questions fréquentes</div>
              <h2 className="text-2xl md:text-3xl font-light tracking-tight text-slate-900 h-title">
                On répond à vos <span className="font-semibold">questions</span>
              </h2>
            </div>
          </Reveal>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <Reveal key={i} delay={i * 40}>
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ border: "1px solid #e2e8f0", background: openFaq === i ? "#fff" : "rgba(255,255,255,0.70)" }}
                >
                  <button
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-slate-50/60 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span className="text-sm font-semibold text-slate-800 leading-snug">{item.q}</span>
                    <Chevron open={openFaq === i} />
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-5 text-sm text-slate-600 leading-[1.75] border-t border-slate-100 pt-4">
                      {item.a}
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-[#f8fafc]">
        <div className="mx-auto max-w-[1240px]">
          <Reveal>
            <div className="relative overflow-hidden rounded-[var(--radius-large)] bg-slate-900 px-8 py-16 md:px-16 text-center shadow-[0_24px_60px_rgba(11,18,32,0.18)]">
              <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl pointer-events-none"
                style={{ background: "rgba(45,140,255,0.15)" }} />
              <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none"
                style={{ background: "rgba(0,201,138,0.15)" }} />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.06),transparent_60%)]" />

              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/80 mb-5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00C98A] animate-pulse" />
                  2 mois gratuits sur le plan Pro — sans carte bancaire
                </span>

                <h2 className="text-3xl md:text-4xl font-light tracking-tight text-white h-title">
                  Prêt à gagner du <span className="font-semibold">temps chaque jour ?</span>
                </h2>
                <p className="mt-4 text-white/70 max-w-lg mx-auto text-sm leading-[1.7]">
                  Rejoignez les professionnels de santé qui font confiance à THOR. Démarrez avec 60 jours offerts, sans engagement.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/contact?sujet=projet"
                    className="inline-flex items-center justify-center rounded-[var(--radius-pill)] px-7 py-3.5 text-sm font-semibold bg-white text-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.20)] transition-all duration-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.28)] hover:scale-[1.02]"
                  >
                    Parler de votre projet
                  </Link>
                  <Link
                    href="/contact?sujet=projet"
                    className="inline-flex items-center justify-center rounded-[var(--radius-pill)] px-7 py-3.5 text-sm font-semibold text-white/80 hover:text-white border border-white/20 hover:border-white/40 transition-all duration-200"
                  >
                    Parler à un expert →
                  </Link>
                </div>

                <div className="mt-10 flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#2D8CFF]" />
                    <span className="text-xs text-white/60 font-medium">Clair Vision</span>
                  </div>
                  <div className="w-px h-4 bg-white/15" />
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00C98A]" />
                    <span className="text-xs text-white/60 font-medium">Clair Audition</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

    </main>
  );
}

/* ─── PlanCard ──────────────────────────────────────────────────────────── */
function PlanCard({ plan, annual }: { plan: Plan; annual: boolean }) {
  const price = annual ? plan.yearlyPrice : plan.monthlyPrice;

  const ctaStyle =
    plan.ctaStyle === "primary"
      ? {
          background: "#2D8CFF",
          color: "#fff",
          boxShadow: "0 4px 16px rgba(45,140,255,0.35)",
        }
      : plan.ctaStyle === "outline"
      ? {
          background: "transparent",
          color: plan.accent,
          border: `1.5px solid ${plan.accent}`,
        }
      : {
          background: plan.accentBg,
          color: plan.accent,
          border: `1px solid ${plan.accent}22`,
        };

  return (
    <div
      className="relative rounded-2xl flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-xl"
      style={{
        background: plan.highlight ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.72)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: plan.highlight ? `2px solid ${plan.accent}` : "1px solid rgba(255,255,255,0.90)",
        boxShadow: plan.highlight
          ? "0 12px 48px rgba(45,140,255,0.14), 0 0 0 1px rgba(45,140,255,0.12)"
          : "0 4px 24px rgba(11,18,32,0.06)",
      }}
    >
      {/* Barre colorée en haut si populaire */}
      {plan.highlight && (
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#2D8CFF,#00C98A)" }} />
      )}

      <div className="p-7 flex flex-col flex-1">
        {/* Badge populaire */}
        {plan.badgeText && (
          <div className="-mx-7 px-7 py-2 text-center mb-4" style={{ background: "rgba(45,140,255,0.06)", borderBottom: "1px solid rgba(45,140,255,0.12)" }}>
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: plan.accent }}>
              {plan.badgeText}
            </span>
          </div>
        )}

        {/* Nom + tagline */}
        <div className="mb-5">
          <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: plan.accent }}>
            {plan.name}
          </div>
          <p className="text-[13px] text-slate-500 leading-snug">{plan.tagline}</p>
        </div>

        {/* Prix */}
        <div className="flex items-end gap-1.5 mb-1">
          <span className="text-4xl font-bold tracking-tight text-slate-900">{price}€</span>
          <span className="text-slate-500 text-sm mb-1.5">/mois</span>
        </div>
        {annual && (
          <div className="text-[11px] text-slate-500 mb-1">
            Facturé {price * 12}€/an — économisez {(plan.monthlyPrice - price) * 12}€
          </div>
        )}

        {/* Trial label */}
        {plan.trialLabel && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C98A] flex-shrink-0" />
            <span className="text-[11px] font-semibold" style={{ color: "#00A872" }}>{plan.trialLabel}</span>
          </div>
        )}

        {/* CTA */}
        <Link
          href={plan.ctaHref}
          className="mt-6 mb-6 w-full rounded-[var(--radius-pill)] px-6 py-3 text-sm font-semibold text-center transition-all duration-200 hover:scale-[1.02] block"
          style={ctaStyle}
        >
          {plan.cta}
        </Link>

        {/* Features */}
        <ul className="space-y-2.5 mt-auto">
          {plan.features.map(f => (
            <li key={f} className="flex items-start gap-2.5 text-[13px] text-slate-700">
              <Check color={plan.accent} />
              <span className="leading-snug">{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
