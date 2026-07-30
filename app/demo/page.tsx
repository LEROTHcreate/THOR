"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

function cn(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

/* ─── Theme ──────────────────────────────────────────────────────────────── */
const THEMES = {
  vision: {
    accent: "#2D8CFF", accent2: "#06B6D4",
    glow: "rgba(45,140,255,0.18)", glowStrong: "rgba(45,140,255,0.30)",
    bg: "rgba(45,140,255,0.08)", bgMid: "rgba(45,140,255,0.14)",
    border: "rgba(45,140,255,0.30)", gradient: "linear-gradient(135deg,#2D8CFF,#06B6D4)",
    orb1: "rgba(45,140,255,0.14)", orb2: "rgba(99,102,241,0.10)",
    name: "Clair Vision",
  },
  audition: {
    accent: "#00C98A", accent2: "#10B981",
    glow: "rgba(0,201,138,0.18)", glowStrong: "rgba(0,201,138,0.30)",
    bg: "rgba(0,201,138,0.08)", bgMid: "rgba(0,201,138,0.14)",
    border: "rgba(0,201,138,0.30)", gradient: "#00C98A",
    orb1: "rgba(0,201,138,0.14)", orb2: "rgba(16,185,129,0.08)",
    name: "Clair Audition",
  },
  pharma: {
    accent: "#059669", accent2: "#10B981",
    glow: "rgba(5,150,105,0.18)", glowStrong: "rgba(5,150,105,0.30)",
    bg: "rgba(5,150,105,0.08)", bgMid: "rgba(5,150,105,0.14)",
    border: "rgba(5,150,105,0.30)", gradient: "#10B981",
    orb1: "rgba(5,150,105,0.14)", orb2: "rgba(16,185,129,0.10)",
    name: "PharmaPlanning",
  },
  jarvis: {
    accent: "#1D4ED8", accent2: "#2563EB",
    glow: "rgba(29,78,216,0.25)", glowStrong: "rgba(29,78,216,0.45)",
    bg: "rgba(29,78,216,0.08)", bgMid: "rgba(29,78,216,0.16)",
    border: "rgba(29,78,216,0.32)", gradient: "linear-gradient(135deg,#1D4ED8,#1E3A8A)",
    orb1: "rgba(29,78,216,0.20)", orb2: "rgba(37,99,235,0.14)",
    name: "JARVIS",
  },
} as const;
type Space = keyof typeof THEMES;

/* ─── Contenu narratif par module ────────────────────────────────────────── */
interface ModuleNarrative {
  audienceLong: string;
  intro: string;
  quote: string;
  cardBody: string;
  bullets: string[];
  statValue: string;
  statLabel: string;
  ctaDesc: string;
  trustVal: string;
  trustLabel: string;
  trustDesc: string;
  cardGradient: string;
  cardBg: string;
  cardBorder: string;
}

const MODULE_NARRATIVE: Record<Space, ModuleNarrative> = {
  vision: {
    audienceLong: "Pour les opticiens-lunetiers",
    intro: "Un métier de santé parmi les plus réglementés de France. Des opticiens débordés par l'administratif. Des logiciels vieillissants qui n'ont pas suivi les réformes. Voilà ce qui nous a poussés à reconstruire Clair Vision.",
    quote: "En discutant avec des opticiens, on a réalisé que la plupart passaient plus d'une heure par jour à remplir des formulaires, à chercher des ordonnances dans des classeurs ou à recopier des données d'un logiciel à l'autre. Ce temps-là, ce n'est pas du temps de soin — c'est du temps perdu. On a voulu le leur rendre.",
    cardBody: "Depuis 2014, les opticiens ont l'obligation légale de remettre un devis normalisé à chaque patient. Depuis 2020, la réforme 100% Santé a reconfiguré toute la prise en charge. Et malgré ça, la plupart des logiciels du marché n'ont pas suivi.",
    bullets: [
      "Devis normalisés générés automatiquement depuis l'ordonnance",
      "Alertes de renouvellement proactives — plus aucun patient oublié",
      "Calculateur de lentilles avec compatibilité stock en temps réel",
      "Facturation TVA 20 % automatisée sur l'ensemble de l'équipement optique (verres, montures, lentilles)",
    ],
    statValue: "1 400+",
    statLabel: "Opticiens actifs",
    ctaDesc: "Rejoignez les opticiens qui font confiance à Clair Vision pour gérer leur cabinet.",
    trustVal: "HDS",
    trustLabel: "Hébergeur certifié santé",
    trustDesc: "Vos données patients sont hébergées en France, dans un datacenter certifié HDS.",
    cardGradient: "linear-gradient(135deg,#2D8CFF,#06B6D4)",
    cardBg: "rgba(45,140,255,0.08)",
    cardBorder: "rgba(45,140,255,0.25)",
  },
  audition: {
    audienceLong: "Pour les audioprothésistes",
    intro: "Un métier de santé parmi les plus réglementés de France. Des audioprothésistes débordés par l'administratif post-réforme 2021. Des logiciels qui n'ont pas suivi la révolution 100 % Santé. Voilà ce qui nous a poussés à reconstruire Clair Audition.",
    quote: "En discutant avec des audioprothésistes, on a réalisé qu'ils passaient plus d'une heure par jour à jongler entre dossiers Classe I / Classe II, codes LPPR, formulaires SCOR et téléchargements ADRi. Ce temps-là, ce n'est pas du temps de soin — c'est du temps perdu. On a voulu le leur rendre.",
    cardBody: "La réforme 100 % Santé de 2021 a bouleversé le marché de l'appareillage auditif. Classe I, Classe II, LPPR, SCOR, ADRi — la complexité administrative a explosé au moment même où les patients affluaient. Les logiciels existants n'étaient tout simplement pas prêts.",
    bullets: [
      "Dossiers d'appareillage complets — du bilan à la livraison",
      "Audiogrammes intégrés avec interprétation automatique (PTA, grade SS)",
      "Présentation Classe I / Classe II côte à côte dans chaque devis",
      "Conforme GIE SESAM-Vitale, HDS et ADRi/e-CPS dès le premier jour",
    ],
    statValue: "1 000+",
    statLabel: "Audioprothésistes actifs",
    ctaDesc: "Rejoignez les audioprothésistes qui font confiance à Clair Audition pour gérer leur cabinet.",
    trustVal: "HDS",
    trustLabel: "Hébergeur certifié santé",
    trustDesc: "Vos données patients sont hébergées en France, dans un datacenter certifié HDS.",
    cardGradient: "linear-gradient(135deg,#00C98A,#10B981)",
    cardBg: "rgba(0,201,138,0.08)",
    cardBorder: "rgba(0,201,138,0.25)",
  },
  pharma: {
    audienceLong: "Pour les officines pharmaceutiques",
    intro: "Faire le planning d'une officine, c'est jongler entre pharmaciens titulaires, adjoints, préparateurs, étudiants, livreurs et secrétariat — avec une contrainte légale stricte : un pharmacien présent à chaque heure d'ouverture. Les outils du marché n'étaient pas conçus pour cette réalité métier.",
    quote: "En discutant avec des titulaires de pharmacie et leurs équipes, on a réalisé que faire un planning d'officine prenait 3 à 4 heures chaque semaine — entre congés, vacances scolaires, remplacements de dernière minute et couverture pharmacien obligatoire. PharmaPlanning ramène ça à 15 minutes.",
    cardBody: "Une officine, c'est 10 à 20 personnes à coordonner sur 6 jours, avec des contraintes légales (présence pharmacien, repos hebdo, gardes), des contrats variés (35h, 14h étudiant, alternance, CDD remplacement) et des aléas constants. Les tableurs Excel et les logiciels génériques ne tiennent pas la route.",
    bullets: [
      "Couverture pharmacien garantie — alertes en temps réel si absent",
      "Gabarits réutilisables (semaine type, vacances scolaires, garde de nuit)",
      "Suivi heures contractuelles, supplémentaires, absences, RTT, formation DPC",
      "Export CSV pour la paie — compatible logiciels comptables",
    ],
    statValue: "150+",
    statLabel: "Officines équipées",
    ctaDesc: "Rejoignez les officines qui ont simplifié la gestion de leur planning d'équipe.",
    trustVal: "RGPD",
    trustLabel: "Conformité européenne",
    trustDesc: "Vos plannings et données d'équipe sont hébergés en France, chiffrés et conformes RGPD.",
    cardGradient: "linear-gradient(135deg,#059669,#10B981)",
    cardBg: "rgba(5,150,105,0.08)",
    cardBorder: "rgba(5,150,105,0.25)",
  },
  jarvis: {
    audienceLong: "Assistant IA — déployé via THOR",
    intro: "Une interface unique pour parler à un assistant IA, retrouver une adresse, suivre l'actualité ou explorer le ciel astronomique du jour. JARVIS est une IA indépendante, déployée et orchestrée par THOR — pensée pour répondre vite, en français, sans publicité ni collecte cachée.",
    quote: "On ne fabrique pas l'IA, on l'orchestre. JARVIS est une intelligence externe que THOR rend accessible dans une interface souveraine, sans intermédiaire publicitaire ni captation de données. L'utilisateur reste maître de ses conversations.",
    cardBody: "JARVIS combine conversation textuelle, voix, géolocalisation, cartographie et flux d'actualités dans une interface inspirée des HUD de science-fiction. THOR assure le déploiement, l'hébergement souverain et l'intégration — l'IA elle-même est indépendante. Demandez-lui une boulangerie, l'image astronomique du jour, la dernière dépêche : il répond en quelques secondes.",
    bullets: [
      "Conversation en français — texte instantané, voix à venir",
      "Recherche locale géolocalisée (commerces, services, transports)",
      "Live feed actualités français (Le Monde, sources publiques)",
      "Image astronomique du jour (NASA APOD) avec traduction",
    ],
    statValue: "BÊTA",
    statLabel: "Phase de test fermée",
    ctaDesc: "Demandez l'accès à JARVIS pour tester l'assistant THOR avant tout le monde.",
    trustVal: "0 €",
    trustLabel: "Sans publicité, sans revente",
    trustDesc: "JARVIS ne stocke aucune conversation, ne revend aucune donnée, et n'affiche aucune publicité.",
    cardGradient: "linear-gradient(135deg,#1D4ED8,#1E3A8A)",
    cardBg: "rgba(29,78,216,0.08)",
    cardBorder: "rgba(29,78,216,0.28)",
  },
};

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Feature {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  preview: React.ReactNode;
}

/* ─── Icônes ─────────────────────────────────────────────────────────────── */
function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <path d="M8 2v4M16 2v4M3 10h18" />
    </svg>
  );
}
function IconFolder() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}
function IconFile() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}
function IconCalculator() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 6h8M8 10h2M12 10h2M16 10h0M8 14h2M12 14h2M16 14h2M8 18h2M12 18h2M16 18h2" />
    </svg>
  );
}
function IconEar() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M6 12a6 6 0 1112 0c0 3-2 5-3 6.5a2.5 2.5 0 01-4-.5" />
      <path d="M10 12a2 2 0 114 0c0 1.5-2 2.5-2 4" />
    </svg>
  );
}
function IconMessage() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}
function IconLens() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18" />
    </svg>
  );
}
function IconReceipt() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2z" />
      <path d="M8 10h8M8 14h5" />
    </svg>
  );
}
function IconRefresh() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
function IconWrench() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

/* ─── Mock UIs ───────────────────────────────────────────────────────────── */
function AppHeader({ title, sub, accent, action }: { title: string; sub: string; accent: string; action: string }) {
  return (
    <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
      <div>
        <h3 className="font-bold text-slate-900" style={{ fontSize: 15 }}>{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      </div>
      <button className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: accent }}>{action}</button>
    </div>
  );
}

function MockAgenda({ accent, context = "vision" }: { accent: string; context?: "vision" | "audition" }) {
  const slots = context === "audition" ? [
    { time: "08:30", name: "Dupont Jean",    type: "Bilan auditif complet",    dur: "45 min", color: accent },
    { time: "09:30", name: "Martin Sophie",  type: "Contrôle 1 mois",          dur: "30 min", color: "#64748b" },
    { time: "10:00", name: "Lemaire Claire", type: "Adaptation appareil",       dur: "60 min", color: "#8B5CF6" },
    { time: "11:00", name: "Moreau Lucie",   type: "Réglage CAP",               dur: "20 min", color: "#f59e0b" },
    { time: "14:00", name: "Bernard Paul",   type: "Livraison appareils",       dur: "30 min", color: accent },
    { time: "14:45", name: "Petit Emma",     type: "Contrôle 6 mois",           dur: "20 min", color: "#64748b" },
    { time: "16:00", name: "Garcia Luis",    type: "Bilan auditif enfant",      dur: "45 min", color: accent },
    { time: "17:00", name: "Rousseau Marc",  type: "Remise compte-rendu ORL",   dur: "20 min", color: "#22c55e" },
  ] : [
    { time: "08:30", name: "Rousseau Marc",  type: "Bilan visuel",              dur: "45 min", color: accent },
    { time: "09:30", name: "Martin Sophie",  type: "Contrôle",                  dur: "30 min", color: "#64748b" },
    { time: "10:00", name: "Lemaire Claire", type: "Adaptation lentilles",      dur: "60 min", color: "#8B5CF6" },
    { time: "11:00", name: "Moreau Lucie",   type: "Ordonnance",                dur: "20 min", color: "#f59e0b" },
    { time: "14:00", name: "Dupont Jean",    type: "Livraison montures",        dur: "30 min", color: accent },
    { time: "14:45", name: "Bernard Paul",   type: "Suivi",                     dur: "20 min", color: "#64748b" },
    { time: "16:00", name: "Petit Emma",     type: "Bilan visuel",              dur: "45 min", color: accent },
    { time: "17:00", name: "Garcia Luis",    type: "Contrôle",                  dur: "30 min", color: "#22c55e" },
  ];
  const title = context === "audition" ? "Agenda — Mardi 25 mars 2026" : "Agenda — Mardi 25 mars 2026";
  const sub = context === "audition"
    ? "M. Benali · 8 rendez-vous · 91% occupé"
    : "Dr. Lambert · 8 rendez-vous · 94% occupé";
  return (
    <div className="text-sm">
      <AppHeader title={title} sub={sub} accent={accent} action="+ Nouveau RDV" />
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-50">
          {slots.map((s) => (
            <div key={s.time} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer">
              <span className="text-xs font-mono text-slate-400 w-10 flex-shrink-0">{s.time}</span>
              <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: s.color }} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800 truncate">{s.name}</p>
                <p className="text-xs text-slate-400">{s.type} · {s.dur}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: s.color + "18", color: s.color }}>Confirmé</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockDossiers({ accent, context = "vision" }: { accent: string; context?: "vision" | "audition" }) {
  const items = context === "audition" ? [
    { name: "Dupont Jean",    ref: "APP-0041", eq: "Phonak Audéo Paradise P90-R (binaural)",  status: "Livré",      progress: 100 },
    { name: "Martin Sophie",  ref: "APP-0040", eq: "Signia Pure Charge&Go 7X",                status: "Adaptation", progress: 65  },
    { name: "Lemaire Claire", ref: "APP-0039", eq: "Oticon More 1 miniRITE R",                status: "Bilan init.", progress: 30  },
    { name: "Bernard Paul",   ref: "APP-0038", eq: "Widex Moment 440 RIC",                    status: "Commandé",   progress: 50  },
    { name: "Moreau Lucie",   ref: "APP-0037", eq: "ReSound ONE 7 MRE",                       status: "Livraison",  progress: 80  },
    { name: "Garcia Luis",    ref: "APP-0036", eq: "Phonak Sky Marvel M90-R",                 status: "Livré",      progress: 100 },
  ] : [
    { name: "Martin Sophie",  ref: "DOS-0041", eq: "Verres progressifs Varilux",              status: "En cours",   progress: 75  },
    { name: "Dupont Jean",    ref: "DOS-0040", eq: "Montures Ray-Ban RB5228",                 status: "Livré",      progress: 100 },
    { name: "Lemaire Claire", ref: "DOS-0039", eq: "Lentilles Dailies Total 1",               status: "En attente", progress: 30  },
    { name: "Bernard Paul",   ref: "DOS-0038", eq: "Verres progressifs Zeiss",                status: "En cours",   progress: 55  },
    { name: "Moreau Lucie",   ref: "DOS-0037", eq: "Montures Silhouette 1583",                status: "Commandé",   progress: 65  },
    { name: "Petit Emma",     ref: "DOS-0036", eq: "Lentilles Acuvue Oasys",                  status: "Livré",      progress: 100 },
  ];
  const title = context === "audition" ? "Dossiers d'appareillage" : "Dossiers patients";
  const sub = context === "audition" ? "6 dossiers actifs · mars 2026" : "6 dossiers actifs · mars 2026";
  return (
    <div className="text-sm">
      <AppHeader title={title} sub={sub} accent={accent} action="+ Nouveau dossier" />
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {items.map((d) => (
            <div key={d.ref} className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full text-white text-xs font-bold grid place-items-center flex-shrink-0" style={{ background: accent + "cc" }}>{d.name.charAt(0)}</div>
                  <div>
                    <span className="font-semibold text-slate-800">{d.name}</span>
                    <span className="ml-2 text-xs text-slate-400">{d.ref}</span>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: d.progress === 100 ? accent + "18" : d.progress >= 60 ? "#f59e0b18" : "#94a3b818", color: d.progress === 100 ? accent : d.progress >= 60 ? "#f59e0b" : "#94a3b8" }}>
                  {d.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-1.5 pl-9">{d.eq}</p>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden ml-9">
                <div className="h-full rounded-full transition-all" style={{ width: `${d.progress}%`, background: d.progress === 100 ? accent : "#f59e0b" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockOrdonnance() {
  return (
    <div className="text-sm space-y-3">
      <AppHeader title="Ordonnance — Martin Sophie" sub="Dr. Lefebvre · Ophtalmologue · 18/03/2026" accent="#2D8CFF" action="Générer devis" />
      <div className="flex items-center justify-between">
        <div>
          <span className="font-semibold text-slate-800">Ordonnance — Martin Sophie</span>
          <p className="text-xs text-slate-400 mt-0.5">Dr. Lefebvre · Ophtalmologue · 18/03/2026</p>
        </div>
        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">Validée</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          ["OD Sphère", "-2.50"], ["OD Cylindre", "-0.75"], ["OD Axe", "170°"],
          ["OG Sphère", "-3.00"], ["OG Cylindre", "-0.50"], ["OG Axe", "15°"],
          ["Addition", "+2.00"], ["Écart pupi.", "63 mm"], ["Prisme", "—"],
        ].map(([label, val]) => (
          <div key={label} className="bg-slate-50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-slate-400">{label}</p>
            <p className="font-semibold text-slate-800">{val}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
        <p className="text-xs font-semibold text-blue-700 mb-1.5">Recommandation générée automatiquement</p>
        <ul className="text-xs text-blue-600 space-y-1">
          <li>• Verres progressifs (correction presbytie + myopie)</li>
          <li>• Traitement antireflet renforcé recommandé</li>
          <li>• Port permanent — toute distance</li>
        </ul>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[["Prescrite le", "18/03/2026"], ["Expire le", "18/03/2029"]].map(([l, v]) => (
          <div key={l} className="bg-slate-50 rounded-xl px-3 py-2">
            <p className="text-[10px] text-slate-400">{l}</p>
            <p className="font-semibold text-slate-800">{v}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400 border-t border-slate-100 pt-2">
        <span className="text-amber-500 font-medium">Renouvellement conseillé dans 3 ans</span>
        <span className="ml-auto">Réf: ORD-0089</span>
      </div>
    </div>
  );
}

function MockBilan({ accent }: { accent: string }) {
  const freqs = [125, 250, 500, 1000, 2000, 4000, 8000];
  const odVals = [10, 15, 20, 35, 50, 65, 70];
  const ogVals = [15, 20, 25, 40, 55, 70, 75];
  return (
    <div className="text-sm space-y-3">
      <AppHeader title="Bilan auditif — Dupont Jean" sub="Dr. Rousseau · ORL · 20/03/2026 · Réf: BIL-0127" accent={accent} action="Générer devis" />
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-800">Audiogramme tonal</span>
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: accent + "18", color: accent }}>
          Surdité légère → modérée
        </span>
      </div>
      <div className="relative bg-slate-50 rounded-xl p-3" style={{ height: 180 }}>
        {[0, 25, 50, 75, 100].map((v) => (
          <div key={v} className="absolute left-3 right-3 border-t border-slate-200" style={{ top: `calc(${v}% + 12px)` }}>
            <span className="absolute -top-2 text-[9px] text-slate-300" style={{ left: 0 }}>{v}</span>
          </div>
        ))}
        <svg className="absolute inset-3 w-[calc(100%-24px)] h-[calc(100%-24px)]" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline points={freqs.map((_, i) => `${(i / 6) * 100},${odVals[i]}`).join(" ")} fill="none" stroke="#2D8CFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {freqs.map((_, i) => <circle key={`od${i}`} cx={(i / 6) * 100} cy={odVals[i]} r="2.5" fill="#2D8CFF" />)}
          <polyline points={freqs.map((_, i) => `${(i / 6) * 100},${ogVals[i]}`).join(" ")} fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {freqs.map((_, i) => <circle key={`og${i}`} cx={(i / 6) * 100} cy={ogVals[i]} r="2.5" fill={accent} />)}
        </svg>
      </div>
      <div className="flex px-1">
        {freqs.map(f => <div key={f} className="flex-1 text-center text-[9px] text-slate-400">{f >= 1000 ? `${f / 1000}k` : f}</div>)}
      </div>
      <div className="flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-blue-500 inline-block rounded" /> OD — Gain moyen : 32 dB</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 inline-block rounded" style={{ background: accent }} /> OG — Gain moyen : 37 dB</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[["PTA OD", "31 dB HL"], ["PTA OG", "36 dB HL"], ["Catégorie SS", "Grade 2"]].map(([l, v]) => (
          <div key={l} className="bg-slate-50 rounded-xl px-3 py-2 text-center">
            <p className="text-[10px] text-slate-400">{l}</p>
            <p className="font-bold text-slate-800">{v}</p>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

function MockDevisAudition({ accent }: { accent: string }) {
  return (
    <div className="text-sm space-y-3">
      <AppHeader title="Devis appareillage — Dupont Jean" sub="DEV-0087 · Émis le 20/03/2026 · Valable 30 jours" accent={accent} action="Envoyer par email" />
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-semibold">Attente signature</span>
        <span className="text-xs text-slate-400">Signature électronique disponible</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border-2 p-3" style={{ borderColor: accent + "50" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: accent + "20", color: accent }}>CLASSE I</span>
            <span className="text-[10px] text-slate-400">RAC 0</span>
          </div>
          {[["Appareil", "Phonak Audéo Fit 30"], ["Prix", "1 050,00 €"], ["AMO (SS)", "200,00 €"], ["AMC (mutuelle)", "850,00 €"]].map(([l, v]) => (
            <div key={l} className="flex justify-between py-1 text-xs border-b border-slate-50 last:border-0">
              <span className="text-slate-500">{l}</span>
              <span className="font-medium text-slate-800">{v}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between items-center pt-1">
            <span className="text-xs font-semibold" style={{ color: accent }}>Reste patient</span>
            <span className="font-bold text-lg" style={{ color: accent }}>0,00 €</span>
          </div>
        </div>
        <div className="rounded-xl border-2 border-slate-200 p-3 relative">
          <div className="absolute top-2 right-2 text-[10px] bg-purple-50 text-purple-600 font-bold px-1.5 py-0.5 rounded-full">Recommandé</div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">CLASSE II</span>
            <span className="text-[10px] text-slate-400">Prix libre</span>
          </div>
          {[["Appareil", "Phonak Lumity 90-RT"], ["Prix", "2 490,00 €"], ["AMO (SS)", "200,00 €"], ["AMC (mutuelle)", "800,00 €"]].map(([l, v]) => (
            <div key={l} className="flex justify-between py-1 text-xs border-b border-slate-50 last:border-0">
              <span className="text-slate-500">{l}</span>
              <span className="font-medium text-slate-800">{v}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between items-center pt-1">
            <span className="text-xs font-semibold text-purple-600">Reste patient</span>
            <span className="font-bold text-lg text-purple-600">1 490,00 €</span>
          </div>
        </div>
      </div>
      <div className="rounded-xl bg-slate-50 px-4 py-2.5 flex items-center justify-between">
        <p className="text-xs text-slate-500">Envoyé par e-mail · Signature électronique disponible</p>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">Relancer →</span>
      </div>
    </div>
  );
}

function MockStatistiques({ accent }: { accent: string }) {
  const bars = [65, 82, 74, 90, 68, 95, 78];
  const days = ["L", "M", "M", "J", "V", "S", "D"];
  return (
    <div className="text-sm space-y-3">
      <AppHeader title="Statistiques — semaine 13" sub="Du 24 au 30 mars 2026 · Cabinet principal" accent={accent} action="Exporter PDF" />
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-800">Activité de la semaine</span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#22c55e18", color: "#22c55e" }}>↑ +14% vs S-1</span>
      </div>
      <div className="flex items-end gap-1.5" style={{ height: 110 }}>
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div className="w-full rounded-t-md" style={{ height: `${h}%`, background: i === 5 ? accent : accent + "50" }} />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        {days.map((d, i) => (
          <div key={i} className="flex-1 text-center text-xs text-slate-400">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "RDV total", val: "47", trend: "↑ +5", up: true },
          { label: "Nouveaux patients", val: "+12", trend: "↑ +3", up: true },
          { label: "CA semaine", val: "8 420 €", trend: "↑ +14%", up: true },
          { label: "Dossiers livrés", val: "18", trend: "↑ +2", up: true },
          { label: "Taux d'occupation", val: "94 %", trend: "↑ +8%", up: true },
          { label: "Devis signés", val: "7", trend: "↓ -1", up: false },
        ].map((k) => (
          <div key={k.label} className="bg-slate-50 rounded-xl px-3 py-2">
            <p className="text-[10px] text-slate-400">{k.label}</p>
            <p className="font-bold text-slate-800">{k.val}</p>
            <p className="text-[10px] font-semibold mt-0.5" style={{ color: k.up ? "#22c55e" : "#ef4444" }}>{k.trend}</p>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

function MockMessagerie({ accent }: { accent: string }) {
  const msgs = [
    { from: "Martin Sophie", text: "Bonjour, puis-je décaler mon RDV de vendredi ?", time: "09:14", unread: true },
    { from: "Dupont Jean", text: "Merci pour la livraison, ça fonctionne très bien.", time: "08:55", unread: false },
    { from: "Lemaire Claire", text: "J'ai une question sur le remboursement mutuelle.", time: "Hier", unread: true },
    { from: "Bernard Paul", text: "Mon ordonnance expire bientôt, je dois reprendre RDV ?", time: "Hier", unread: false },
    { from: "Moreau Lucie", text: "La monture que j'ai commandée est arrivée ?", time: "Lun", unread: false },
  ];
  return (
    <div className="text-sm">
      <AppHeader title="Messagerie sécurisée" sub="Hébergement HDS · Chiffrement E2E · Conforme RGPD" accent={accent} action="Nouveau message" />
      <div className="grid grid-cols-2 gap-3">
        {/* Liste conversations */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Conversations</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: accent + "15", color: accent }}>2 non lus</span>
          </div>
          <div className="divide-y divide-slate-50">
            {msgs.map((m) => (
              <div key={m.from} className={cn("flex items-start gap-2.5 px-3 py-2.5 cursor-pointer transition-colors", m.from === "Martin Sophie" ? "bg-slate-50" : "hover:bg-slate-50")}>
                <div className="w-7 h-7 rounded-full flex-shrink-0 grid place-items-center text-white text-xs font-bold" style={{ background: accent }}>
                  {m.from.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs font-semibold", m.unread ? "text-slate-900" : "text-slate-600")}>{m.from}</span>
                    <span className="text-[10px] text-slate-400">{m.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{m.text}</p>
                </div>
                {m.unread && <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: accent }} />}
              </div>
            ))}
          </div>
        </div>
        {/* Conversation ouverte */}
        <div className="bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full grid place-items-center text-white text-[10px] font-bold" style={{ background: accent }}>M</div>
            <span className="text-xs font-semibold text-slate-800">Martin Sophie</span>
            <span className="ml-auto text-[10px] text-slate-400">Sécurisé</span>
          </div>
          <div className="flex-1 p-3 space-y-2 bg-slate-50">
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-slate-700 max-w-[90%] shadow-sm">
                Bonjour, puis-je décaler mon RDV de vendredi ?
              </div>
            </div>
            <div className="flex justify-end">
              <div className="text-white rounded-2xl rounded-tr-sm px-3 py-2 text-xs max-w-[90%]" style={{ background: accent }}>
                Pas de problème — le samedi 29 mars à 10h vous convient-il ?
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-slate-700 max-w-[70%] shadow-sm">
                Oui parfait, merci !
              </div>
            </div>
          </div>
          <div className="px-3 py-2 border-t border-slate-100 flex items-center gap-2">
            <input className="flex-1 text-xs bg-slate-100 rounded-full px-3 py-1.5 outline-none text-slate-500" placeholder="Répondre…" readOnly />
            <div className="w-6 h-6 rounded-full grid place-items-center text-white" style={{ background: accent }}>
              <svg viewBox="0 0 24 24" style={{ width: 12, height: 12 }} fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockCalculateurLentilles({ accent }: { accent: string }) {
  return (
    <div className="text-sm space-y-3">
      <AppHeader title="Calculateur de lentilles" sub="Ordonnance — Martin Sophie · 18/03/2026" accent={accent} action="Commander" />
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          ["Sphère OD", "-2.50"], ["Sphère OG", "-3.00"],
          ["Cylindre OD", "-0.75"], ["Cylindre OG", "-0.50"],
          ["Axe OD", "170°"], ["Axe OG", "15°"],
        ].map(([label, val]) => (
          <div key={label} className="bg-slate-50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-slate-400">{label}</p>
            <p className="font-semibold text-slate-800">{val}</p>
          </div>
        ))}
      </div>
      <div className="text-xs text-slate-500 font-medium mb-2 px-1">Lentilles compatibles</div>
      <div className="space-y-1.5">
        {[
          { name: "Dailies Total 1", type: "Journalière", price: "62,00 €/mois", stock: true },
          { name: "Acuvue Oasys", type: "Bimensuelle", price: "34,00 €/mois", stock: true },
          { name: "Air Optix Night&Day", type: "Mensuelle", price: "28,00 €/mois", stock: false },
        ].map((l) => (
          <div key={l.name} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 truncate">{l.name}</p>
              <p className="text-xs text-slate-400">{l.type}</p>
            </div>
            <span className="text-xs font-semibold text-slate-700">{l.price}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${l.stock ? "bg-green-50 text-green-600" : "bg-red-50 text-red-400"}`}>
              {l.stock ? "En stock" : "Rupture"}
            </span>
          </div>
        ))}
      </div>
      <div className="rounded-xl px-4 py-2.5 flex justify-between items-center" style={{ background: accent + "12" }}>
        <span className="font-semibold text-sm" style={{ color: accent }}>Équivalent sphérique calculé</span>
        <span className="font-bold text-base" style={{ color: accent }}>-2.88 / -3.25</span>
      </div>
      </div>
    </div>
  );
}

function MockDevis({ accent }: { accent: string }) {
  const items = [
    { ref: "DEV-0112", patient: "Martin Sophie", eq: "Varilux X Series + Essilor Crizal", montant: "498,00 €", status: "Signé", statusColor: accent },
    { ref: "DEV-0111", patient: "Dupont Jean", eq: "Montures Ray-Ban RB5228 + verres Zeiss", montant: "720,00 €", status: "Commandé", statusColor: "#8B5CF6" },
    { ref: "DEV-0110", patient: "Lemaire Claire", eq: "Lentilles Dailies Total 1 × 90", montant: "315,00 €", status: "Brouillon", statusColor: "#94a3b8" },
    { ref: "DEV-0109", patient: "Bernard Paul", eq: "Montures Silhouette + Varilux", montant: "890,00 €", status: "Livré", statusColor: "#22c55e" },
  ];
  return (
    <div className="text-sm space-y-3">
      <AppHeader title="Devis & facturation" sub="Mars 2026 · 4 devis actifs · CA estimé 2 423 €" accent={accent} action="+ Nouveau devis" />
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {items.map((d) => (
            <div key={d.ref} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-slate-800">{d.patient}</p>
                  <span className="text-xs text-slate-400">{d.ref}</span>
                </div>
                <p className="text-xs text-slate-400 truncate">{d.eq}</p>
              </div>
              <span className="font-semibold text-slate-700 flex-shrink-0">{d.montant}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: d.statusColor + "18", color: d.statusColor }}>{d.status}</span>
            </div>
          ))}
        </div>
        <div className="px-4 py-2.5 border-t border-slate-100 flex justify-between items-center bg-slate-50">
          <span className="text-xs text-slate-500">Total devis signés + commandés</span>
          <span className="font-bold text-slate-800">1 218,00 €</span>
        </div>
      </div>
    </div>
  );
}

function MockRenouvellements({ accent, context }: { accent: string; context?: "vision" | "audition" }) {
  const items = context === "audition" ? [
    { name: "Benali Karim",    equipment: "Phonak Audéo Paradise P90",   lastVisit: "12/03/2023", urgency: "Urgent", urgencyColor: "#ef4444" },
    { name: "Rousseau Sylvie", equipment: "Signia Pure Charge&Go AX",    lastVisit: "08/11/2025", urgency: "Bientôt", urgencyColor: "#f59e0b" },
    { name: "Nguyen Linh",     equipment: "Oticon More 1 miniRITE",      lastVisit: "20/06/2025", urgency: "6 mois", urgencyColor: accent },
    { name: "Lefèvre Marc",    equipment: "Widex Moment Sheer 440",      lastVisit: "14/01/2026", urgency: "OK", urgencyColor: "#22c55e" },
    { name: "Garnier Élise",   equipment: "Starkey Evolv AI 2400",       lastVisit: "03/10/2025", urgency: "Bientôt", urgencyColor: "#f59e0b" },
  ] : [
    { name: "Martin Sophie", equipment: "Verres progressifs Varilux", lastVisit: "18/03/2023", urgency: "Urgent", urgencyColor: "#ef4444" },
    { name: "Dupont Jean", equipment: "Lentilles Dailies Total 1", lastVisit: "10/01/2026", urgency: "Bientôt", urgencyColor: "#f59e0b" },
    { name: "Lemaire Claire", equipment: "Montures Ray-Ban RB5228", lastVisit: "05/12/2024", urgency: "6 mois", urgencyColor: accent },
    { name: "Bernard Paul", equipment: "Lentilles Acuvue Oasys", lastVisit: "22/02/2026", urgency: "OK", urgencyColor: "#22c55e" },
    { name: "Moreau Lucie", equipment: "Verres simples Essilor", lastVisit: "14/09/2025", urgency: "Bientôt", urgencyColor: "#f59e0b" },
  ];
  return (
    <div className="text-sm space-y-3">
      <AppHeader title={context === "audition" ? "Suivi appareillages" : "Renouvellements"} sub={context === "audition" ? "Suivi appareils · 5 patients · 1 garantie expirée" : "Suivi équipements · 5 patients · 1 urgent"} accent={accent} action="Relancer tous" />
      <div className="grid grid-cols-3 gap-2 mb-1">
        {[["1", "Urgent", "#ef4444"], ["2", "Bientôt", "#f59e0b"], ["2", "OK / 6 mois", "#22c55e"]].map(([v, l, c]) => (
          <div key={l} className="rounded-xl px-3 py-2 text-center" style={{ background: (c as string) + "12" }}>
            <p className="font-bold text-lg" style={{ color: c as string }}>{v}</p>
            <p className="text-[10px] font-semibold" style={{ color: c as string }}>{l}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {items.map((r) => (
            <div key={r.name} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.urgencyColor }} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800">{r.name}</p>
                <p className="text-xs text-slate-400">{r.equipment} · Dernière visite : {r.lastVisit}</p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: r.urgencyColor + "18", color: r.urgencyColor }}>{r.urgency}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockSAV({ accent, context }: { accent: string; context?: "vision" | "audition" }) {
  const tickets = context === "audition" ? [
    { ref: "SAV-0091", patient: "Benali Karim",    issue: "Appareil droit HS — retour fabricant",    priority: "Haute",   status: "En réparation", priorityColor: "#ef4444" },
    { ref: "SAV-0090", patient: "Rousseau Sylvie", issue: "Sifflement persistant — réglage fin",      priority: "Normale", status: "RDV planifié",  priorityColor: accent },
    { ref: "SAV-0089", patient: "Nguyen Linh",     issue: "Piles qui se vident en 2 jours",           priority: "Normale", status: "Devis envoyé",  priorityColor: accent },
    { ref: "SAV-0088", patient: "Garnier Élise",   issue: "Écouteur encombré — nettoyage",            priority: "Basse",   status: "Résolu",        priorityColor: "#22c55e" },
  ] : [
    { ref: "SAV-0041", patient: "Martin Sophie", issue: "Branche cassée — retour atelier", priority: "Haute", status: "En réparation", priorityColor: "#ef4444" },
    { ref: "SAV-0040", patient: "Moreau Lucie", issue: "Verre rayé OG — remplacement", priority: "Normale", status: "Devis envoyé", priorityColor: accent },
    { ref: "SAV-0039", patient: "Dupont Jean", issue: "Inconfort adaptation — réglage", priority: "Basse", status: "RDV planifié", priorityColor: "#94a3b8" },
    { ref: "SAV-0038", patient: "Garcia Luis", issue: "Vis desserrée — entretien", priority: "Basse", status: "Résolu", priorityColor: "#22c55e" },
  ];
  return (
    <div className="text-sm space-y-3">
      <AppHeader title={context === "audition" ? "SAV appareils auditifs" : "SAV & réparations"} sub={context === "audition" ? "4 tickets · 3 ouverts · 1 résolu ce mois" : "4 tickets · 3 ouverts · 1 résolu ce mois"} accent={accent} action="+ Nouveau ticket" />
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {tickets.map((t) => (
            <div key={t.ref} className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-slate-400">{t.ref}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: t.priorityColor + "18", color: t.priorityColor }}>{t.priority}</span>
                <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: t.status === "Résolu" ? "#22c55e18" : "#f1f5f9", color: t.status === "Résolu" ? "#22c55e" : "#64748b" }}>{t.status}</span>
              </div>
              <p className="font-semibold text-slate-800">{t.patient}</p>
              <p className="text-xs text-slate-400">{t.issue}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Features par espace ────────────────────────────────────────────────── */
const FEATURES_VISION: Feature[] = [
  {
    id: "agenda",
    label: "Agenda intelligent",
    desc: "Gérez vos rendez-vous jour par jour avec code couleur par type d'acte (bilan, contrôle, adaptation). Pause déjeuner configurable par praticien.",
    icon: <IconCalendar />,
    preview: <MockAgenda accent="#2D8CFF" />,
  },
  {
    id: "dossiers",
    label: "Dossiers patients",
    desc: "Suivi complet de chaque patient : historique des visites, équipements, ordonnances. Indicateur de progression par dossier en temps réel.",
    icon: <IconFolder />,
    preview: <MockDossiers accent="#2D8CFF" />,
  },
  {
    id: "ordonnances",
    label: "Ordonnances",
    desc: "Saisie et archivage des prescriptions visuelles : sphère, cylindre, axe, addition. Alerte automatique à l'expiration des ordonnances.",
    icon: <IconFile />,
    preview: <MockOrdonnance />,
  },
  {
    id: "statistiques",
    label: "Statistiques",
    desc: "Visualisez votre activité semaine par semaine : nombre de RDV, nouveaux patients, chiffre d'affaires, taux d'occupation.",
    icon: <IconChart />,
    preview: <MockStatistiques accent="#2D8CFF" />,
  },
  {
    id: "messagerie",
    label: "Messagerie sécurisée",
    desc: "Échangez avec vos patients en toute confidentialité. Hébergement HDS, chiffrement de bout en bout, conforme RGPD.",
    icon: <IconMessage />,
    preview: <MockMessagerie accent="#2D8CFF" />,
  },
  {
    id: "lentilles",
    label: "Calculateur de lentilles",
    desc: "Calculez automatiquement l'équivalent sphérique à partir de l'ordonnance et affichez les lentilles compatibles avec prix et disponibilité stock.",
    icon: <IconLens />,
    preview: <MockCalculateurLentilles accent="#2D8CFF" />,
  },
  {
    id: "devis",
    label: "Devis & facturation",
    desc: "Créez des devis normalisés (obligatoire depuis 2014) en un clic, envoyez-les au patient par email et suivez leur statut jusqu'à la livraison.",
    icon: <IconReceipt />,
    preview: <MockDevis accent="#2D8CFF" />,
  },
  {
    id: "renouvellements",
    label: "Renouvellements",
    desc: "Suivez les équipements de chaque patient et anticipez les renouvellements grâce au code couleur d'urgence (urgent, bientôt, OK).",
    icon: <IconRefresh />,
    preview: <MockRenouvellements accent="#2D8CFF" />,
  },
  {
    id: "sav",
    label: "SAV & réparations",
    desc: "Gérez vos tickets SAV : type de panne, niveau de priorité, état d'avancement et devis envoyé au patient — tout centralisé en un seul endroit.",
    icon: <IconWrench />,
    preview: <MockSAV accent="#2D8CFF" />,
  },
];

const FEATURES_AUDITION: Feature[] = [
  {
    id: "agenda",
    label: "Agenda intelligent",
    desc: "Planning des bilans auditifs, adaptations, contrôles et livraisons. Vue jour configurable par audioprothésiste avec pauses déjeuner individuelles.",
    icon: <IconCalendar />,
    preview: <MockAgenda accent="#00C98A" context="audition" />,
  },
  {
    id: "dossiers",
    label: "Dossiers d'appareillage",
    desc: "Suivi complet de chaque appareillage : bilan initial, choix du modèle, adaptation, livraison et SAV. Indicateur de progression automatique.",
    icon: <IconFolder />,
    preview: <MockDossiers accent="#00C98A" context="audition" />,
  },
  {
    id: "bilans",
    label: "Bilans auditifs",
    desc: "Enregistrement et visualisation des audiogrammes (oreilles droite et gauche). Courbes de seuil, catégorisation de la perte auditive.",
    icon: <IconEar />,
    preview: <MockBilan accent="#00C98A" />,
  },
  {
    id: "devis",
    label: "Devis appareillage",
    desc: "Présentez Classe I et Classe II côte à côte dans un devis normalisé, envoyé par e-mail avec signature électronique. Suivi de statut jusqu'à la livraison.",
    icon: <IconReceipt />,
    preview: <MockDevisAudition accent="#00C98A" />,
  },
  {
    id: "statistiques",
    label: "Statistiques",
    desc: "Vue consolidée de l'activité du centre : bilans réalisés, appareils livrés, chiffre d'affaires, répartition Classe I / Classe II.",
    icon: <IconChart />,
    preview: <MockStatistiques accent="#00C98A" />,
  },
  {
    id: "messagerie",
    label: "Messagerie sécurisée",
    desc: "Communicez avec vos patients senior en toute sécurité. Interface simplifiée, hébergement HDS, chiffrement de bout en bout.",
    icon: <IconMessage />,
    preview: <MockMessagerie accent="#00C98A" />,
  },
  {
    id: "renouvellements",
    label: "Suivi appareillages",
    desc: "Anticipez les fins de garantie et les renouvellements prise en charge. Code couleur d'urgence, relance automatique des patients à contacter.",
    icon: <IconRefresh />,
    preview: <MockRenouvellements accent="#00C98A" context="audition" />,
  },
  {
    id: "sav",
    label: "SAV appareils auditifs",
    desc: "Centralisez les tickets SAV : panne, réglage, retour fabricant. Priorité, statut d'avancement et suivi de la garantie constructeur en un coup d'œil.",
    icon: <IconWrench />,
    preview: <MockSAV accent="#00C98A" context="audition" />,
  },
];

/* ─── Mocks PharmaPlanning ───────────────────────────────────────────────── */
function MockPharmaPlanning({ accent }: { accent: string }) {
  const team = [
    { name: "Camille", role: "Pharm.",   color: "#a78bfa", blocks: [{ y: 14, h: 38, label: "Cptoir", bg: "rgba(6,182,212,0.18)", border: "#a78bfa" }, { y: 60, h: 28, label: "M/A/P",  bg: "rgba(6,182,212,0.18)", border: "#a78bfa" }] },
    { name: "Hugo",    role: "Pharm.",   color: "#a78bfa", blocks: [{ y: 8,  h: 22, label: "Cptoir", bg: "rgba(6,182,212,0.18)", border: "#a78bfa" }, { y: 52, h: 36, label: "Cptoir", bg: "rgba(6,182,212,0.18)", border: "#a78bfa" }] },
    { name: "Manon",   role: "Prép.",    color: "#10b981", blocks: [{ y: 14, h: 26, label: "Para",   bg: "rgba(16,185,129,0.18)",  border: "#10b981" }, { y: 56, h: 24, label: "Para",   bg: "rgba(16,185,129,0.18)",  border: "#10b981" }] },
    { name: "Inès",    role: "Prép.",    color: "#10b981", blocks: [{ y: 6,  h: 28, label: "Cptoir", bg: "rgba(16,185,129,0.18)",  border: "#10b981" }, { y: 50, h: 32, label: "M/A/P",  bg: "rgba(16,185,129,0.18)",  border: "#10b981" }] },
    { name: "Lucie",   role: "Prép.",    color: "#10b981", blocks: [{ y: 12, h: 56, label: "Cptoir", bg: "rgba(16,185,129,0.18)",  border: "#10b981" }] },
    { name: "Noé",     role: "Prép.",    color: "#10b981", blocks: [{ y: 30, h: 24, label: "Cptoir", bg: "rgba(16,185,129,0.18)",  border: "#10b981" }] },
    { name: "Alix",    role: "Étudiant", color: "#f59e0b", blocks: [{ y: 50, h: 22, label: "Livr.",  bg: "rgba(245,158,11,0.18)",  border: "#f59e0b" }] },
    { name: "Mathis",  role: "Livreur",  color: "#64748b", blocks: [{ y: 4,  h: 44, label: "Comde",  bg: "rgba(254,240,138,0.55)", border: "#facc15" }, { y: 56, h: 24, label: "Comde",  bg: "rgba(254,240,138,0.55)", border: "#facc15" }] },
    { name: "Élodie",  role: "Secrét.",  color: "#ec4899", blocks: [{ y: 14, h: 22, label: "Secrét", bg: "rgba(244,114,182,0.18)", border: "#ec4899" }, { y: 56, h: 22, label: "Secrét", bg: "rgba(244,114,182,0.18)", border: "#ec4899" }] },
  ];
  const hours = ["08:30", "10:00", "12:00", "14:00", "16:00", "18:00"];
  return (
    <div className="text-sm">
      <AppHeader title="Planning · S19" sub="04 mai — 09 mai 2026 · 9 collaborateurs · jeu. 07/05" accent={accent} action="Appliquer un gabarit" />
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 flex items-center gap-3 text-[11px] border-b border-slate-100" style={{ background: "rgba(254,243,199,0.4)" }}>
          <span className="font-semibold text-amber-700">Couverture</span>
          <span className="text-amber-600">Pas de pharmacien jeu. 7 mai · 14:00–15:00</span>
          <span className="text-slate-300">|</span>
          <span className="text-amber-600">1 préparateur seul · 19:30–20:00</span>
        </div>
        <div className="flex">
          <div className="flex flex-col w-12 flex-shrink-0 border-r border-slate-100 pt-7">
            {hours.map(h => <div key={h} className="text-[10px] font-mono text-slate-400 px-2 py-1.5" style={{ height: 32 }}>{h}</div>)}
          </div>
          <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${team.length}, minmax(0,1fr))`, position: "relative", height: 220 }}>
            {team.map((p, idx) => (
              <div key={p.name} className="border-r border-slate-100 last:border-r-0 relative">
                <div className="text-center py-1 border-b border-slate-100 sticky top-0 bg-white">
                  <div className="flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                    <span className="text-[10px] font-semibold text-slate-700">{p.name}</span>
                  </div>
                  <div className="text-[8px] text-slate-400 uppercase tracking-wide">{p.role}</div>
                </div>
                <div className="relative" style={{ height: 192 }}>
                  {p.blocks.map((b, i) => (
                    <div key={i} className="absolute inset-x-0.5 rounded text-[8px] font-bold flex items-center justify-center" style={{ top: `${b.y}%`, height: `${b.h}%`, background: b.bg, borderLeft: `2px solid ${b.border}`, color: b.border }}>
                      {b.label}
                    </div>
                  ))}
                </div>
                <div className="absolute -bottom-0.5 left-0 right-0 text-center">
                  <span className="inline-block text-[9px] font-bold text-white rounded-full px-1.5" style={{ background: idx === 4 ? "#22c55e" : idx % 3 === 0 ? "#f97316" : "#22c55e" }}>{idx === 6 ? 4 : 3}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: "rgba(6,182,212,0.4)" }}/>Pharmacien</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: "rgba(16,185,129,0.4)" }}/>Préparateur</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: "rgba(245,158,11,0.4)" }}/>Étudiant / Livreur</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: "rgba(244,114,182,0.4)" }}/>Secrétariat</span>
      </div>
    </div>
  );
}

function MockPharmaEquipe({ accent }: { accent: string }) {
  const team = [
    { name: "Camille", role: "Pharmacien(ne)",     hours: "35 h", color: "#a78bfa", order: 0  },
    { name: "Hugo",    role: "Pharmacien(ne)",     hours: "35 h", color: "#a78bfa", order: 1  },
    { name: "Léa",     role: "Pharmacien(ne)",     hours: "35 h", color: "#a78bfa", order: 2  },
    { name: "Manon",   role: "Préparateur(trice)", hours: "35 h", color: "#10b981", order: 3 },
    { name: "Inès",    role: "Préparateur(trice)", hours: "35 h", color: "#10b981", order: 4 },
    { name: "Lucie",   role: "Préparateur(trice)", hours: "35 h", color: "#10b981", order: 5 },
    { name: "Noé",     role: "Préparateur(trice)", hours: "35 h", color: "#10b981", order: 6 },
    { name: "Alix",    role: "Étudiant(e)",        hours: "14 h", color: "#f59e0b", order: 10 },
    { name: "Mathis",  role: "Livreur(euse)",      hours: "25 h", color: "#64748b", order: 11 },
    { name: "Élodie",  role: "Secrétaire",         hours: "35 h", color: "#ec4899", order: 13 },
    { name: "Antoine", role: "Titulaire",          hours: "35 h", color: "#ef4444", order: 14 },
  ];
  return (
    <div className="text-sm">
      <AppHeader title="Équipe — 16 collaborateurs" sub="Gérer l'équipe de la pharmacie" accent={accent} action="+ Nouveau collaborateur" />
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-[1fr_140px_60px_60px_60px] px-4 py-2 border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          <span>Nom</span><span>Statut</span><span className="text-center">Hebdo</span><span className="text-center">Ordre</span><span className="text-center">État</span>
        </div>
        <div className="divide-y divide-slate-50">
          {team.map((m) => (
            <div key={m.name} className="grid grid-cols-[1fr_140px_60px_60px_60px] items-center px-4 py-2 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                <span className="font-semibold text-slate-800">— {m.name}</span>
              </div>
              <span className="text-xs text-slate-500">{m.role}</span>
              <span className="text-center text-xs text-slate-600 font-mono">{m.hours}</span>
              <span className="text-center text-xs text-slate-400 font-mono">{m.order}</span>
              <span className="flex justify-center">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: accent + "18", color: accent }}>Actif</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockPharmaStatistiques({ accent }: { accent: string }) {
  const rows = [
    { name: "Alix",    role: "Étudiant(e)",        contract: "14h", planned: "82.5h",  avg: 16.5, hs: "+12.5h",  solde: "+12.5h",  soldeColor: "#dc2626" },
    { name: "Antoine", role: "Titulaire",          contract: "35h", planned: "316.5h", avg: 52.8, hs: "+117.5h", solde: "+117.5h", soldeColor: "#dc2626" },
    { name: "Camille", role: "Pharmacien(ne)",     contract: "35h", planned: "165.0h", avg: 27.5, hs: "+4.0h",   solde: "−33.0h",  soldeColor: "#dc2626" },
    { name: "Élodie",  role: "Secrétaire",         contract: "35h", planned: "157.0h", avg: 26.2, hs: "—",       solde: "0.0h",    soldeColor: "#475569" },
    { name: "Hugo",    role: "Pharmacien(ne)",     contract: "35h", planned: "189.0h", avg: 31.5, hs: "+5.0h",   solde: "+5.0h",   soldeColor: "#dc2626" },
    { name: "Inès",    role: "Préparateur(trice)", contract: "35h", planned: "219.0h", avg: 36.5, hs: "+37.5h",  solde: "+37.5h",  soldeColor: "#dc2626" },
    { name: "Léa",     role: "Pharmacien(ne)",     contract: "35h", planned: "172.0h", avg: 28.7, hs: "—",       solde: "0.0h",    soldeColor: "#475569" },
    { name: "Noé",     role: "Préparateur(trice)", contract: "35h", planned: "210.5h", avg: 35.1, hs: "+27.5h",  solde: "+27.5h",  soldeColor: "#dc2626" },
  ];
  return (
    <div className="text-sm space-y-3">
      <AppHeader title="Statistiques — S1 2026" sub="Vue semestrielle · 16 collaborateurs" accent={accent} action="Export CSV" />
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Heures planifiées", value: "2555h", color: "#a78bfa", bg: "rgba(6,182,212,0.10)", sub: "cumul équipe" },
          { label: "Heures supp.",      value: "290h",  color: "#ef4444", bg: "rgba(239,68,68,0.08)",   sub: "au-delà du contrat" },
          { label: "Heures d'absence",  value: "37h",   color: "#f59e0b", bg: "rgba(245,158,11,0.10)",  sub: "congés, maladie" },
          { label: "Charge équipe",     value: "5 / 8", color: "#10b981", bg: "rgba(16,185,129,0.10)",  sub: "sous le contrat" },
        ].map(k => (
          <div key={k.label} className="rounded-xl px-3 py-2.5" style={{ background: k.bg, border: `1px solid ${k.color}33` }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: k.color }}>{k.label}</p>
            <p className="text-lg font-bold mt-1" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_60px_70px_50px_60px_60px] px-3 py-2 border-b border-slate-100 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
          <span>Collaborateur</span><span>Statut</span><span className="text-center">Contrat</span><span className="text-center">Planifié</span><span className="text-center">Moy.</span><span className="text-center">HS</span><span className="text-right">Solde</span>
        </div>
        <div className="divide-y divide-slate-50">
          {rows.map(r => (
            <div key={r.name} className="grid grid-cols-[1fr_120px_60px_70px_50px_60px_60px] items-center px-3 py-1.5 text-[11px] hover:bg-slate-50">
              <span className="font-semibold text-slate-700 truncate">— {r.name}</span>
              <span className="text-slate-500 truncate">{r.role}</span>
              <span className="text-center text-slate-500 font-mono">{r.contract}</span>
              <span className="text-center font-mono font-semibold" style={{ color: accent, background: accent + "12", borderRadius: 6, padding: "1px 4px" }}>{r.planned}</span>
              <span className="text-center font-mono text-slate-600">{r.avg}h</span>
              <span className="text-center font-semibold" style={{ color: r.hs.startsWith("+") ? "#dc2626" : "#94a3b8" }}>{r.hs}</span>
              <span className="text-right font-mono font-bold" style={{ color: r.soldeColor }}>{r.solde}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockPharmaAvatars({ accent }: { accent: string }) {
  const avatars = [
    { name: "Paracetamol",   sub: "Le zen équilibré",          color: "#fbbf24", initial: "P"  },
    { name: "Aspirine",      sub: "Le sage à lunettes",        color: "#06b6d4", initial: "A"  },
    { name: "Ibuprofen",     sub: "Le sportif énergique",      color: "#ef4444", initial: "I"  },
    { name: "Anti-inflam.",  sub: "Le frais qui calme",        color: "#10b981", initial: "AI" },
    { name: "Probiotic",     sub: "Le bienveillant",           color: "#ec4899", initial: "Pr" },
    { name: "Mélatonine",    sub: "Le rêveur étoilé",          color: "#8b5cf6", initial: "M"  },
    { name: "Somnifère",     sub: "Le marchand de sable",      color: "#1e40af", initial: "S"  },
    { name: "Inhalateur",    sub: "Le calme respirant",        color: "#0ea5e9", initial: "In" },
    { name: "Vitamine C",    sub: "Le rayonnant",              color: "#f59e0b", initial: "C"  },
    { name: "Vitamine D",    sub: "Le bronzeur tranquille",    color: "#facc15", initial: "D"  },
    { name: "Crème solaire", sub: "L'estival cool",            color: "#fde047", initial: "Cs" },
    { name: "Bandage",       sub: "Le secouriste",             color: "#fb7185", initial: "B"  },
    { name: "Robot",         sub: "Le précis et infatigable",  color: accent,    initial: "R", active: true },
  ];
  return (
    <div className="text-sm">
      <AppHeader title="Mon profil — Avatar" sub="Choisis ton perso parmi la galerie pharmacie" accent={accent} action="Enregistrer" />
      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <div className="grid grid-cols-5 gap-2">
          {avatars.map(a => (
            <div
              key={a.name}
              className="rounded-lg px-2 py-2.5 text-center cursor-pointer transition-all"
              style={{
                border: a.active ? `1.5px solid ${accent}` : "1px solid rgba(15,23,42,0.06)",
                background: a.active ? accent + "0d" : "rgba(255,255,255,0.7)",
              }}
            >
              <div className="w-8 h-8 rounded-full mx-auto mb-1.5 grid place-items-center text-white text-[10px] font-bold" style={{ background: a.color }}>
                {a.initial}
              </div>
              <p className="text-[10px] font-semibold text-slate-800 truncate">{a.name}</p>
              <p className="text-[9px] text-slate-400 truncate leading-tight">{a.sub}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-3 text-center">Plus de 20 avatars pharmacie disponibles · changeable à tout moment</p>
      </div>
    </div>
  );
}

function MockPharmaGabarits({ accent }: { accent: string }) {
  const templates = [
    { name: "Semaine type — pleine équipe", desc: "9 collaborateurs · 35h chacun · couverture 7j/7 · pause méridienne incluse", uses: 24, color: accent     },
    { name: "Vacances scolaires",            desc: "Équipe réduite · rotation pharmaciens · 2 préparateurs minimum",            uses: 8,  color: "#f59e0b"  },
    { name: "Semaine d'été",                 desc: "Roulement congés · couverture renforcée samedi matin · livreur 2j/sem",     uses: 12, color: "#0ea5e9"  },
    { name: "Garde de nuit",                 desc: "Pharmacien titulaire seul · 20h–8h · planning week-end inclus",              uses: 4,  color: "#8b5cf6"  },
    { name: "Sous-effectif (urgence)",       desc: "Mode dégradé · couverture minimale légale · alertes automatiques",           uses: 2,  color: "#ef4444"  },
  ];
  return (
    <div className="text-sm">
      <AppHeader title="Gabarits de planning" sub="5 modèles enregistrés · réutilisables en 1 clic" accent={accent} action="+ Nouveau gabarit" />
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {templates.map(t => (
            <div key={t.name} className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg grid place-items-center flex-shrink-0" style={{ background: t.color + "18", color: t.color }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{t.name}</p>
                <p className="text-xs text-slate-400 truncate">{t.desc}</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">{t.uses} appli.</span>
              <span className="text-xs font-semibold px-3 py-1 rounded-lg flex-shrink-0" style={{ background: accent + "0d", color: accent, border: `1px solid ${accent}33` }}>
                Appliquer
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockPharmaAbsences({ accent }: { accent: string }) {
  const items = [
    { name: "Camille", type: "Congé payé",       from: "07/05", to: "10/05", days: 4,  color: accent,   status: "Validé" },
    { name: "Hugo",    type: "Formation DPC",    from: "12/05", to: "13/05", days: 2,  color: "#0ea5e9", status: "Validé" },
    { name: "Léa",     type: "Maladie",          from: "06/05", to: "07/05", days: 2,  color: "#f59e0b", status: "Justifié" },
    { name: "Manon",   type: "RTT",              from: "15/05", to: "15/05", days: 1,  color: "#a78bfa", status: "Validé" },
    { name: "Mathis",  type: "Congé sans solde", from: "20/05", to: "27/05", days: 6,  color: "#94a3b8", status: "En attente" },
    { name: "Lucie",   type: "Maternité",        from: "01/05", to: "01/09", days: 92, color: "#ec4899", status: "Validé" },
  ];
  return (
    <div className="text-sm">
      <AppHeader title="Absences — Mai 2026" sub="6 absences enregistrées · 5 validées · 1 en attente" accent={accent} action="+ Nouvelle absence" />
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {items.map(i => (
            <div key={i.name + i.from} className="px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3">
              <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ background: i.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{i.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: i.color + "18", color: i.color }}>{i.type}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Du {i.from} au {i.to} · {i.days} jour{i.days > 1 ? "s" : ""}</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: i.status === "En attente" ? "#f1f5f9" : accent + "18", color: i.status === "En attente" ? "#64748b" : accent }}>
                {i.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const FEATURES_PHARMA: Feature[] = [
  {
    id: "planning",
    label: "Planning hebdomadaire",
    desc: "Visualisez l'équipe entière sur une semaine en colonnes : pharmaciens, préparateurs, étudiants, livreurs, secrétariat. Couverture en temps réel avec alertes sous-effectif et absence pharmacien.",
    icon: <IconCalendar />,
    preview: <MockPharmaPlanning accent="#059669" />,
  },
  {
    id: "equipe",
    label: "Équipe & contrats",
    desc: "Gérez vos collaborateurs en un seul endroit : statut (pharmacien, préparateur, étudiant, livreur), heures hebdo contractuelles, ordre d'affichage, état actif/inactif.",
    icon: <IconFolder />,
    preview: <MockPharmaEquipe accent="#059669" />,
  },
  {
    id: "gabarits",
    label: "Gabarits de planning",
    desc: "Créez des modèles réutilisables : semaine type, vacances scolaires, semaine d'été, garde de nuit. Appliquez un gabarit en un clic et économisez des heures de saisie chaque mois.",
    icon: <IconFile />,
    preview: <MockPharmaGabarits accent="#059669" />,
  },
  {
    id: "absences",
    label: "Absences & congés",
    desc: "Suivez les congés payés, RTT, maladie, formation DPC, maternité. Statut validé / en attente, calcul automatique des jours, impact instantané sur le planning.",
    icon: <IconRefresh />,
    preview: <MockPharmaAbsences accent="#059669" />,
  },
  {
    id: "statistiques",
    label: "Statistiques équipe",
    desc: "Vue semestrielle des heures planifiées, heures supplémentaires, absences. Solde HS-ABS par collaborateur, charge équipe vs contrat, export CSV pour la paie.",
    icon: <IconChart />,
    preview: <MockPharmaStatistiques accent="#059669" />,
  },
  {
    id: "avatars",
    label: "Profils & avatars",
    desc: "Chaque collaborateur choisit son personnage parmi une galerie thématique pharmacie (Paracetamol, Aspirine, Ibuprofen, Mélatonine…). Identification visuelle ludique et apaisée.",
    icon: <IconMessage />,
    preview: <MockPharmaAvatars accent="#059669" />,
  },
];

/* ─── Mocks JARVIS — interface HUD sombre inspirée des screenshots ─────── */
function JarvisShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{
        background: "linear-gradient(180deg, #0a1220 0%, #0d1a2e 100%)",
        border: "1px solid rgba(29,78,216,0.30)",
        boxShadow: "inset 0 1px 0 rgba(29,78,216,0.10), 0 0 32px rgba(29,78,216,0.10)",
        color: "#BFDBFE",
        fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace",
      }}
    >
      {/* Live feed bandeau */}
      <div className="flex items-center gap-4 px-3 py-1.5 border-b" style={{ borderColor: "rgba(29,78,216,0.18)", background: "rgba(29,78,216,0.04)" }}>
        <span style={{ color: "#1D4ED8", fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>● LIVE FEED</span>
        <span style={{ color: "#5d8aa8", fontSize: 9, letterSpacing: 0.4 }}>LE_MONDE</span>
        <span style={{ color: "#9bd5ef", fontSize: 9, opacity: 0.7 }}>En Suède, des juristes alertent sur la fragilisation de l&apos;État de droit</span>
        <span className="ml-auto" style={{ color: "#1D4ED8", fontSize: 9, fontWeight: 700 }}>12:42:06</span>
      </div>
      {children}
      {/* Footer status */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t" style={{ borderColor: "rgba(29,78,216,0.18)" }}>
        <div className="flex items-center gap-3" style={{ fontSize: 8, color: "#5d8aa8", letterSpacing: 0.4 }}>
          <span><span style={{ color: "#1D4ED8" }}>● API</span> STANDBY</span>
          <span>MODEL <span style={{ color: "#BFDBFE" }}>mistral-small</span></span>
          <span>LATENCY <span style={{ color: "#BFDBFE" }}>16ms</span></span>
        </div>
        <span style={{ fontSize: 8, color: "#1D4ED8", letterSpacing: 0.4 }}>T+004 · ONLINE</span>
      </div>
    </div>
  );
}

function JarvisOrb({ size = 120 }: { size?: number }) {
  // Génère N tick marks autour du cercle extérieur
  const tickCount = 60;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.5 - 2;
  const innerTickR = outerR - 4;
  const longTickR = outerR - 9;
  const satellitePositions = [25, 70, 135, 215, 305, 340]; // degrés
  // Particules du noyau (grille pseudo-aléatoire stable)
  const coreParticles = Array.from({ length: 80 }, (_, i) => {
    const angle = (i / 80) * Math.PI * 8;
    const r = (i / 80) * (size * 0.16);
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      opacity: 0.3 + (i % 7) * 0.1,
      size: 0.8 + (i % 3) * 0.4,
    };
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size, overflow: "visible" }}>
        {/* Halo extérieur diffus */}
        <defs>
          <radialGradient id={`orb-glow-${size}`} cx="50%" cy="50%">
            <stop offset="0%"  stopColor="#1D4ED8" stopOpacity="0.8" />
            <stop offset="30%" stopColor="#1D4ED8" stopOpacity="0.30" />
            <stop offset="65%" stopColor="#1D4ED8" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`orb-core-${size}`} cx="50%" cy="50%">
            <stop offset="0%"  stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#1D4ED8" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Anneau extérieur — pointillé fin */}
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="rgba(29,78,216,0.35)" strokeWidth="0.8" strokeDasharray="2 3" />

        {/* Tick marks autour de l'anneau extérieur (longs tous les 5) */}
        {Array.from({ length: tickCount }).map((_, i) => {
          const angle = (i / tickCount) * Math.PI * 2 - Math.PI / 2;
          const isLong = i % 5 === 0;
          const r1 = isLong ? longTickR : innerTickR;
          const r2 = outerR;
          return (
            <line
              key={i}
              x1={cx + Math.cos(angle) * r1}
              y1={cy + Math.sin(angle) * r1}
              x2={cx + Math.cos(angle) * r2}
              y2={cy + Math.sin(angle) * r2}
              stroke="rgba(29,78,216,0.55)"
              strokeWidth={isLong ? 1.4 : 0.7}
            />
          );
        })}

        {/* Anneau moyen */}
        <circle cx={cx} cy={cy} r={size * 0.36} fill="none" stroke="rgba(29,78,216,0.45)" strokeWidth="0.9" />

        {/* Anneau intérieur */}
        <circle cx={cx} cy={cy} r={size * 0.24} fill="none" stroke="rgba(29,78,216,0.30)" strokeWidth="0.6" strokeDasharray="1 2" />

        {/* Glow diffus arrière */}
        <circle cx={cx} cy={cy} r={size * 0.45} fill={`url(#orb-glow-${size})`} />

        {/* Particules du noyau */}
        {coreParticles.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.size} fill="#BFDBFE" opacity={p.opacity} />
        ))}

        {/* Core lumineux central */}
        <circle cx={cx} cy={cy} r={size * 0.10} fill={`url(#orb-core-${size})`}>
          <animate attributeName="r" values={`${size * 0.08};${size * 0.12};${size * 0.08}`} dur="3s" repeatCount="indefinite" />
        </circle>

        {/* Satellites lumineux sur l'anneau extérieur */}
        {satellitePositions.map((deg, i) => {
          const angle = (deg / 360) * Math.PI * 2 - Math.PI / 2;
          const x = cx + Math.cos(angle) * outerR;
          const y = cy + Math.sin(angle) * outerR;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="5" fill="rgba(29,78,216,0.15)" />
              <circle cx={x} cy={y} r="2.5" fill="#ffffff">
                <animate attributeName="opacity" values="0.5;1;0.5" dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function MockJarvisChat() {
  const msgs = [
    { from: "JARVIS", text: "À votre service, Boss." },
    { from: "YOU",    text: "trouve moi une boulangerie" },
    { from: "JARVIS", text: "Voilà, Boss. Trois adresses à moins de 800 mètres :\n• Le Moulin de Cantini — 432 m\n• Marrou — 489 m\n• Boulangerie (nom non précisé) — 597 m" },
    { from: "YOU",    text: "parle moi de Nikola Tesla" },
  ];
  return (
    <JarvisShell>
      <div className="relative grid grid-cols-[1fr_auto_1fr] gap-3 px-4 py-5 min-h-[320px]">
        {/* Colonne gauche — vide ou status */}
        <div style={{ fontSize: 9, color: "#5d8aa8", letterSpacing: 0.4 }}>
          <div style={{ color: "#1D4ED8", marginBottom: 4 }}>● J.A.R.V.I.S</div>
          <div>SYS://0xJARVIS</div>
          <div className="mt-6">SIGNAL <div style={{ color: "#1D4ED8" }}>91%</div></div>
          <div className="mt-3">LAT <div style={{ color: "#BFDBFE" }}>16ms</div></div>
          <div className="mt-3">FREQ <div style={{ color: "#BFDBFE" }}>3.94GHz</div></div>
        </div>

        {/* Centre — orbe */}
        <div className="grid place-items-center">
          <JarvisOrb size={140} />
          <div className="mt-2 text-center" style={{ fontSize: 10, color: "#1D4ED8", letterSpacing: 1, opacity: 0.7 }}>EN ATTENTE</div>
        </div>

        {/* Colonne droite — chat */}
        <div className="space-y-3 overflow-hidden">
          {msgs.map((m, i) => (
            <div key={i} className={m.from === "YOU" ? "text-right" : ""}>
              <div style={{ fontSize: 9, color: "#1D4ED8", letterSpacing: 1, marginBottom: 2 }}>
                <span style={{ borderLeft: "2px solid #1D4ED8", paddingLeft: 4 }}>{m.from}</span>
              </div>
              <div style={{ fontSize: 11, color: m.from === "YOU" ? "#1D4ED8" : "#DBEAFE", whiteSpace: "pre-line", lineHeight: 1.5 }}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </JarvisShell>
  );
}

function MockJarvisMap() {
  return (
    <JarvisShell>
      <div className="relative min-h-[320px] overflow-hidden">
        {/* Carte stylisée avec lignes vectorielles */}
        <svg viewBox="0 0 400 280" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
          <rect width="400" height="280" fill="#0a1220" />
          {/* Routes principales */}
          {[
            "M 0 80 Q 100 70, 200 90 T 400 100",
            "M 0 140 L 150 130 L 250 145 L 400 150",
            "M 80 0 L 100 100 L 90 200 L 110 280",
            "M 220 0 L 230 90 L 215 180 L 240 280",
            "M 320 0 L 310 110 L 330 280",
          ].map((d, i) => (
            <path key={i} d={d} stroke="rgba(180,210,230,0.18)" strokeWidth="1.4" fill="none" />
          ))}
          {/* Mer (gauche) */}
          <path d="M 0 0 L 60 0 L 50 120 L 30 220 L 0 280 Z" fill="rgba(15,23,42,0.7)" />
          {/* Label MARSEILLE */}
          <text x="150" y="55" fill="#BFDBFE" fontSize="13" fontWeight="700" letterSpacing="2">MARSEILLE</text>
          {/* Pin position user */}
          <g transform="translate(190 120)">
            <circle r="14" fill="rgba(29,78,216,0.30)" />
            <circle r="6"  fill="#1D4ED8" />
            <circle r="22" fill="none" stroke="#1D4ED8" strokeWidth="1" opacity="0.5">
              <animate attributeName="r" from="14" to="28" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
          {/* Pins boulangeries */}
          {[{ x: 215, y: 95, n: "1" }, { x: 235, y: 145, n: "2" }, { x: 175, y: 170, n: "3" }].map(p => (
            <g key={p.n} transform={`translate(${p.x} ${p.y})`}>
              <circle r="9" fill="rgba(29,78,216,0.10)" stroke="#1D4ED8" strokeWidth="1" />
              <text y="3" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1D4ED8">{p.n}</text>
            </g>
          ))}
        </svg>

        {/* Overlay chat à droite */}
        <div className="absolute top-3 right-3 max-w-[44%] space-y-2">
          <div>
            <div style={{ fontSize: 9, color: "#1D4ED8", letterSpacing: 1 }}>
              <span style={{ borderLeft: "2px solid #1D4ED8", paddingLeft: 4 }}>JARVIS</span>
            </div>
            <div style={{ fontSize: 10, color: "#DBEAFE", marginTop: 3, lineHeight: 1.5 }}>
              Voilà, Boss. Trois adresses à moins de 800 mètres :
            </div>
            <div className="mt-2 space-y-1" style={{ fontSize: 10, color: "#BFDBFE" }}>
              <div><strong style={{ color: "#fff" }}>Le Moulin de Cantini</strong> — 432 m</div>
              <div><strong style={{ color: "#fff" }}>Marrou</strong> — 489 m</div>
              <div><strong style={{ color: "#fff" }}>Boulangerie</strong> — 597 m</div>
            </div>
          </div>
        </div>
      </div>
    </JarvisShell>
  );
}

function MockJarvisNews() {
  const items = [
    { src: "LE_MONDE",  title: "En Suède, des juristes alertent sur la fragilisation de l'État de droit",  age: "il y a 12 min" },
    { src: "LE_MONDE",  title: "La complexité du rachat de SFR oblige Patrick Drahi à prolonger les négociations",  age: "il y a 34 min" },
    { src: "AFP",       title: "Retraites : légère augmentation du taux d'erreur entre 2024 et 2025",  age: "il y a 1h" },
    { src: "LE_MONDE",  title: "Face à la flambée des prix de l'énergie, les Français adaptent leurs déplacements",  age: "il y a 2h" },
    { src: "REUTERS",   title: "Métamorphose de la guerre : toutes les dépendances, des minerais aux semi-conducteurs",  age: "il y a 3h" },
  ];
  return (
    <JarvisShell>
      <div className="px-4 py-4 space-y-2 min-h-[320px]">
        <div className="flex items-center gap-2 mb-2">
          <span style={{ fontSize: 9, color: "#1D4ED8", letterSpacing: 1, fontWeight: 700 }}>● LIVE FEED</span>
          <span style={{ fontSize: 9, color: "#5d8aa8" }}>actualisé toutes les 5 min</span>
        </div>
        {items.map((it, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-2 rounded-md"
            style={{
              background: i === 0 ? "rgba(29,78,216,0.06)" : "transparent",
              border: i === 0 ? "1px solid rgba(29,78,216,0.20)" : "1px solid transparent",
            }}
          >
            <span style={{ fontSize: 9, color: "#1D4ED8", letterSpacing: 0.5, fontWeight: 700, minWidth: 70 }}>{it.src}</span>
            <span style={{ fontSize: 11, color: "#DBEAFE", flex: 1 }}>{it.title}</span>
            <span style={{ fontSize: 9, color: "#5d8aa8", whiteSpace: "nowrap" }}>{it.age}</span>
          </div>
        ))}
      </div>
    </JarvisShell>
  );
}

function MockJarvisOrbital() {
  // Vraie image NASA Blue Marble (Apollo 17, 1972) — domaine public via Wikimedia.
  const EARTH_IMG = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/640px-The_Earth_seen_from_Apollo_17.jpg";
  return (
    <JarvisShell>
      <div className="relative min-h-[320px] px-4 py-4 flex flex-col items-center">
        {/* Header ORBITAL_LOCK */}
        <div className="flex items-center gap-2" style={{ fontSize: 9, color: "#1D4ED8", letterSpacing: 2 }}>
          <span>›</span>
          <span style={{ fontWeight: 700 }}>ORBITAL_LOCK</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span style={{ fontWeight: 700 }}>DESCENDING</span>
        </div>

        {/* Mini orbe en haut */}
        <div className="mt-2">
          <JarvisOrb size={50} />
        </div>
        <div style={{ fontSize: 7, color: "#5d8aa8", letterSpacing: 1, marginTop: 2 }}>EN ATTENTE</div>

        {/* Globe terrestre — vraie image NASA */}
        <div className="relative my-3" style={{ width: 200, height: 200 }}>
          {/* Réticules d'acquisition (4 coins) */}
          {([
            { top: 0,   left: 0,    rot: 0   },
            { top: 0,   right: 0,   rot: 90  },
            { bottom: 0, right: 0,  rot: 180 },
            { bottom: 0, left: 0,   rot: 270 },
          ] as Array<{ top?: number; left?: number; right?: number; bottom?: number; rot: number }>).map((pos, i) => {
            const { rot, ...placement } = pos;
            return (
              <span
                key={i}
                className="absolute"
                style={{
                  ...placement,
                  width: 14, height: 14,
                  borderTop: "1.5px solid #1D4ED8",
                  borderLeft: "1.5px solid #1D4ED8",
                  transform: `rotate(${rot}deg)`,
                }}
              />
            );
          })}

          {/* Image Earth clipée + filtre tech-look */}
          <div
            className="absolute"
            style={{
              top: 8, left: 8, right: 8, bottom: 8,
              borderRadius: "50%",
              overflow: "hidden",
              boxShadow: "0 0 30px rgba(29,78,216,0.30), inset 0 0 40px rgba(29,78,216,0.18)",
              border: "1px solid rgba(29,78,216,0.40)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={EARTH_IMG}
              alt="Terre — Apollo 17 Blue Marble"
              className="w-full h-full object-cover"
              style={{
                filter: "saturate(0.35) brightness(0.55) contrast(1.30) hue-rotate(195deg)",
              }}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            {/* Voile tech bleu + vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(circle at 38% 32%, rgba(29,78,216,0.10) 0%, transparent 55%), radial-gradient(circle, transparent 48%, rgba(10,18,32,0.55) 100%)",
              }}
            />
            {/* Méridiens fins */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <ellipse cx="50" cy="50" rx="50" ry="14" fill="none" stroke="rgba(29,78,216,0.28)" strokeWidth="0.3" />
              <ellipse cx="50" cy="50" rx="50" ry="28" fill="none" stroke="rgba(29,78,216,0.18)" strokeWidth="0.3" />
              <ellipse cx="50" cy="50" rx="32" ry="50" fill="none" stroke="rgba(29,78,216,0.22)" strokeWidth="0.3" />
              <ellipse cx="50" cy="50" rx="14" ry="50" fill="none" stroke="rgba(29,78,216,0.14)" strokeWidth="0.3" />
            </svg>
            {/* Pin Europe — cible animée */}
            <div
              className="absolute"
              style={{
                top: "36%", left: "56%",
                width: 8, height: 8, borderRadius: "50%",
                background: "#1D4ED8",
                boxShadow: "0 0 14px #1D4ED8, 0 0 0 2px rgba(29,78,216,0.35)",
                animation: "glowPulse 2s ease-in-out infinite",
              }}
            />
            <div
              className="absolute"
              style={{
                top: "32%", left: "60%",
                fontSize: 8, color: "#1D4ED8", fontWeight: 700, letterSpacing: 1,
                textShadow: "0 0 6px rgba(29,78,216,0.6)",
              }}
            >
              EUROPE
            </div>
          </div>
        </div>

        {/* Footer coords */}
        <div className="mt-2 text-center">
          <div style={{ fontSize: 10, color: "#1D4ED8", letterSpacing: 2, fontWeight: 700 }}>ACQUISITION DE CIBLE</div>
          <div style={{ fontSize: 9, color: "#BFDBFE", letterSpacing: 1.5, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
            LAT 44.570812 · LNG 7.059650
          </div>
          <div style={{ fontSize: 7, color: "#5d8aa8", letterSpacing: 0.8, marginTop: 2 }}>
            Source : NASA · Apollo 17 (1972) · domaine public
          </div>
        </div>
      </div>
    </JarvisShell>
  );
}

function MockJarvisNasa() {
  // Vraie image NASA — JWST "Pillars of Creation" — APOD 19 octobre 2022
  // URL Wikimedia (CORS-friendly, public domain)
  const NASA_IMG = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Pillars_of_Creation_NIRCam_-_JWST.jpg/640px-Pillars_of_Creation_NIRCam_-_JWST.jpg";
  return (
    <JarvisShell>
      <div className="px-4 py-4 grid grid-cols-2 gap-4 min-h-[320px]">
        {/* Image card */}
        <div
          className="rounded-lg overflow-hidden flex flex-col"
          style={{
            background: "linear-gradient(180deg, #0d1a2e 0%, #0a1220 100%)",
            border: "1px solid rgba(29,78,216,0.30)",
          }}
        >
          <div className="flex items-center justify-between px-2.5 py-1.5" style={{ borderBottom: "1px solid rgba(29,78,216,0.18)" }}>
            <span style={{ fontSize: 9, color: "#1D4ED8", letterSpacing: 0.8, fontWeight: 700 }}>[01] apod.nasa.gov</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2"><path d="M7 17L17 7M7 7h10v10" /></svg>
          </div>
          {/* Vraie image APOD */}
          <div className="relative flex-1 overflow-hidden" style={{ minHeight: 160 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={NASA_IMG}
              alt="Pillars of Creation — JWST NIRCam"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <span
              className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold"
              style={{ background: "rgba(29,78,216,0.20)", color: "#BFDBFE", border: "1px solid rgba(29,78,216,0.4)", letterSpacing: 1 }}
            >
              JWST · NIRCam
            </span>
          </div>
          <div className="px-2.5 py-2" style={{ borderTop: "1px solid rgba(29,78,216,0.18)" }}>
            <div style={{ fontSize: 10, color: "#fff", fontWeight: 600 }}>Pillars of Creation</div>
            <div style={{ fontSize: 8, color: "#5d8aa8", marginTop: 2 }}>2022-10-19 · NASA APOD · Webb / NIRCam</div>
          </div>
        </div>

        {/* Description traduite */}
        <div className="space-y-2">
          <div>
            <div style={{ fontSize: 9, color: "#1D4ED8", letterSpacing: 1 }}>
              <span style={{ borderLeft: "2px solid #1D4ED8", paddingLeft: 4 }}>JARVIS</span>
            </div>
            <div style={{ fontSize: 10, color: "#DBEAFE", marginTop: 4 }}>
              Voici l&apos;image astronomique du jour, Boss :
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>Les Piliers de la Création</div>
            <div style={{ fontSize: 9, color: "#5d8aa8", fontStyle: "italic", marginTop: 2 }}>19 octobre 2022 · JWST</div>
            <p style={{ fontSize: 9, color: "#BFDBFE", lineHeight: 1.55, marginTop: 6 }}>
              Le télescope spatial James Webb capture l&apos;une des images les plus emblématiques de l&apos;astronomie : trois colonnes de gaz et de poussière interstellaires dans la nébuleuse de l&apos;Aigle, à 6 500 années-lumière, où naissent de nouvelles étoiles.
            </p>
            <p style={{ fontSize: 9, color: "#5d8aa8", lineHeight: 1.55, marginTop: 6 }}>
              Crédit : NASA, ESA, CSA, STScI · Image originale 1280 × 1300 px.
            </p>
          </div>
        </div>
      </div>
    </JarvisShell>
  );
}

function MockJarvisBoot() {
  const modules = [
    "STARTUP_CORE",
    "NEURAL_LINK",
    "VOICE_MODULE",
    "GEOSPATIAL_INDEX",
    "ANTHROPIC_BRIDGE",
    "PARTICLE_RENDERER",
  ];
  return (
    <JarvisShell>
      <div className="relative min-h-[320px] grid place-items-center px-4 py-6 overflow-hidden">
        {/* Orbe en arrière-plan */}
        <div className="absolute inset-0 grid place-items-center opacity-70">
          <JarvisOrb size={300} />
        </div>

        {/* Carte INITIALISATION par-dessus */}
        <div
          className="relative w-full max-w-md rounded-md"
          style={{
            background: "rgba(10,18,32,0.78)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(29,78,216,0.40)",
            boxShadow: "0 0 24px rgba(29,78,216,0.15), inset 0 1px 0 rgba(29,78,216,0.10)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid rgba(29,78,216,0.25)" }}>
            <div className="flex items-center gap-2">
              <span className="block w-1.5 h-1.5 rounded-full" style={{ background: "#1D4ED8", boxShadow: "0 0 6px #1D4ED8" }} />
              <span style={{ fontSize: 11, color: "#1D4ED8", fontWeight: 700, letterSpacing: 2 }}>INITIALISATION</span>
            </div>
            <span style={{ fontSize: 9, color: "#5d8aa8", letterSpacing: 1.5 }}>SYSTEM BOOT</span>
          </div>
          {/* Module list */}
          <div className="px-4 py-3 space-y-1.5">
            {modules.map((m, i) => (
              <div key={m} className="flex items-center gap-2" style={{ fontSize: 10, color: "#DBEAFE", letterSpacing: 1, fontFamily: "ui-monospace, monospace" }}>
                <span style={{ color: "#1D4ED8" }}>›</span>
                <span style={{ flex: 1 }}>{m}</span>
                <span style={{ color: "#5d8aa8" }}>[</span>
                <span style={{ color: i === modules.length - 1 ? "#BFDBFE" : "#1D4ED8", fontWeight: 700 }}>
                  {i === modules.length - 1 ? "OK" : "OK"}
                </span>
                <span style={{ color: "#5d8aa8" }}>]</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 text-center" style={{ fontSize: 9, color: "#1D4ED8", letterSpacing: 2, opacity: 0.7 }}>
          EN ATTENTE
        </div>
      </div>
    </JarvisShell>
  );
}

const FEATURES_JARVIS: Feature[] = [
  {
    id: "boot",
    label: "Démarrage système",
    desc: "À chaque session, JARVIS initialise ses modules : noyau, lien neuronal, voix, index géospatial, pont Anthropic, moteur de particules. Une seconde et l'assistant est prêt.",
    icon: <IconChart />,
    preview: <MockJarvisBoot />,
  },
  {
    id: "conversation",
    label: "Conversation",
    desc: "Texte ou voix, JARVIS répond en français en quelques secondes. Pas de modération arbitraire — il parle clairement et fait ce qu'on lui demande. Aucune conversation n'est stockée.",
    icon: <IconMessage />,
    preview: <MockJarvisChat />,
  },
  {
    id: "recherche-locale",
    label: "Recherche locale",
    desc: "Géolocalisation activée à la demande. JARVIS trouve commerces, services et transports à proximité avec distance précise. Demandez-lui « trouve-moi une boulangerie » et il vous répond.",
    icon: <IconFolder />,
    preview: <MockJarvisMap />,
  },
  {
    id: "live-feed",
    label: "Live feed",
    desc: "Le bandeau d'actualités en haut de l'écran reste alimenté en continu (Le Monde, AFP, Reuters). JARVIS peut résumer, traduire ou approfondir n'importe quel titre sur demande.",
    icon: <IconFile />,
    preview: <MockJarvisNews />,
  },
  {
    id: "orbital",
    label: "Acquisition orbitale",
    desc: "Mode HUD inspiré des interfaces de défense : globe terrestre stylisé avec réticules d'acquisition, coordonnées GPS en temps réel et lock visuel sur la position détectée. Pure démo visuelle — JARVIS reste un assistant, pas un satellite.",
    icon: <IconCalendar />,
    preview: <MockJarvisOrbital />,
  },
  {
    id: "apod",
    label: "Image du jour NASA",
    desc: "Affiche et traduit en français l'image astronomique du jour (APOD) de la NASA. Une fonction de curiosité scientifique intégrée, sans clic et sans pub.",
    icon: <IconChart />,
    preview: <MockJarvisNasa />,
  },
];

/* ─── Portal animation words (stable, no Math.random) ───────────────────── */
const PORTAL_WORDS = [
  { text: "Ordonnances",      x: 8,  y: 16, angle: -8,  size: 26, delay: 0.05 },
  { text: "Devis normalisés", x: 52, y: 10, angle:  5,  size: 20, delay: 0.20 },
  { text: "Tiers-payant",     x: 75, y: 30, angle: -12, size: 23, delay: 0.10 },
  { text: "LPPR / SCOR",      x: 16, y: 50, angle:  3,  size: 18, delay: 0.35 },
  { text: "Factures",         x: 63, y: 55, angle: -6,  size: 30, delay: 0.08 },
  { text: "Mutuelles",        x: 30, y: 67, angle:  9,  size: 22, delay: 0.28 },
  { text: "TVA 20 %",         x: 5,  y: 73, angle: -4,  size: 16, delay: 0.18 },
  { text: "Renouvellements",  x: 46, y: 77, angle:  7,  size: 20, delay: 0.42 },
  { text: "Paperasses",       x: 80, y: 70, angle: -10, size: 28, delay: 0.03 },
  { text: "ADRi / e-CPS",     x: 40, y: 38, angle:  4,  size: 18, delay: 0.50 },
  { text: "Cotisations",      x: 84, y: 18, angle: -7,  size: 21, delay: 0.55 },
  { text: "Remboursements",   x: 22, y: 30, angle:  6,  size: 19, delay: 0.32 },
];

/* ─── Page ───────────────────────────────────────────────────────────────── */
/* Pre-calculated particles (stable across renders) */
const PARTICLES = [
  { left: "6%",  size: 2,   dur: 10, delay: 0   },
  { left: "14%", size: 1.5, dur: 14, delay: 1.2 },
  { left: "23%", size: 2.5, dur: 11, delay: 2.8 },
  { left: "35%", size: 1,   dur: 16, delay: 0.5 },
  { left: "47%", size: 2,   dur: 12, delay: 3.5 },
  { left: "58%", size: 1.5, dur: 9,  delay: 1.8 },
  { left: "67%", size: 3,   dur: 13, delay: 4.2 },
  { left: "76%", size: 1,   dur: 15, delay: 0.9 },
  { left: "84%", size: 2,   dur: 11, delay: 5.0 },
  { left: "92%", size: 1.5, dur: 17, delay: 2.3 },
];

export default function DemoPage() {
  const [space, setSpace] = useState<Space>("pharma");
  const [active, setActive] = useState(0);
  const [previewKey, setPreviewKey] = useState(0);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [portalPhase, setPortalPhase] = useState<"hidden" | "portal" | "form" | "sent">("hidden");
  const [specialite, setSpecialite] = useState<"optique" | "audio" | "pharma" | "both" | "">("");

  function handleDemoClick(e: React.MouseEvent) {
    e.preventDefault();
    setPortalPhase("portal");
    setTimeout(() => setPortalPhase("form"), 8000);
  }

  const t = THEMES[space];
  const narr = MODULE_NARRATIVE[space];
  const features = space === "vision" ? FEATURES_VISION : space === "audition" ? FEATURES_AUDITION : space === "pharma" ? FEATURES_PHARMA : FEATURES_JARVIS;
  const cur = features[Math.min(active, features.length - 1)];

  /* Sidebar icon active index par feature */
  const NAV_IDX: Record<string, number> = {
    agenda: 0, dossiers: 1, ordonnances: 1, bilans: 1,
    statistiques: 3, messagerie: 4, lentilles: 1, devis: 1,
    renouvellements: 1, sav: 2,
    /* PharmaPlanning */
    planning: 0, equipe: 1, gabarits: 2, absences: 3, avatars: 4,
  };
  const sideNavIdx = NAV_IDX[cur.id] ?? 1;

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStatsVisible(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  function switchSpace(s: Space) { setSpace(s); setActive(0); setPreviewKey(k => k + 1); }
  function switchFeature(i: number) { setActive(i); setPreviewKey(k => k + 1); }

  return (
    <div style={{ background: "transparent", minHeight: "100vh", color: "#0f172a", fontFamily: "var(--font-sans)", position: "relative", overflow: "hidden" }}>
      <style>{`
        /* Keyframes locaux uniquement (les communs sont dans globals.css) */
        @keyframes borderRotate {
          from { --angle: 0deg; }
          to   { --angle: 360deg; }
        }
        @keyframes statReveal {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes thorPulse {
          0%, 100% { text-shadow: 0 0 60px rgba(45,140,255,0.10); }
          50% { text-shadow: 0 0 100px rgba(45,140,255,0.18), 0 0 200px rgba(45,140,255,0.10); }
        }
        .preview-enter { animation: shimmerIn 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .thor-grid {
          background-image: radial-gradient(circle, rgba(15,23,42,0.05) 1px, transparent 1px);
          background-size: 44px 44px;
        }
        .gradient-action-vision {
          background-image: linear-gradient(90deg, #2D8CFF, #06B6D4, #8B5CF6, #2D8CFF);
          background-size: 250% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: textGradientSlide 4s linear infinite;
        }
        .gradient-action-audition {
          background-image: linear-gradient(90deg, #00C98A, #06B6D4, #10B981, #00C98A);
          background-size: 250% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: textGradientSlide 4s linear infinite;
        }
        .gradient-action-pharma {
          background-image: linear-gradient(90deg, #059669, #10B981, #14B8A6, #059669);
          background-size: 250% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: textGradientSlide 4s linear infinite;
        }
        .gradient-action-jarvis {
          background-image: linear-gradient(90deg, #1D4ED8, #2563EB, #60A5FA, #1D4ED8);
          background-size: 250% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: textGradientSlide 4s linear infinite;
        }
        .thor-title {
          animation: thorPulse 5s ease-in-out infinite;
        }
        .stat-item { opacity: 0; }
        .stat-item.visible {
          animation: statReveal 0.6s ease both;
        }
        .feature-btn:hover:not(.feature-btn-on) {
          background: rgba(15,23,42,0.04) !important;
          border-color: rgba(15,23,42,0.10) !important;
        }
        .terminal-scanline {
          position: absolute; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, rgba(15,23,42,0.04), transparent);
          animation: scanLine 8s linear infinite;
          pointer-events: none; z-index: 2;
        }

        /* ── Portal animation ── */
        @keyframes portalWordIn {
          0%   { opacity: 0; transform: translate(0, 14px) rotate(var(--angle)); }
          15%  { opacity: 0.55; transform: translate(0, 0) rotate(var(--angle)); }
          75%  { opacity: 0.35; }
          100% { opacity: 0; transform: translate(0, -30px) scale(0.7) rotate(var(--angle)); filter: blur(6px); }
        }
        @keyframes portalFlash {
          0%   { opacity: 0; }
          25%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes portalLineIn {
          from { opacity: 0; transform: translateY(22px); filter: blur(8px); }
          to   { opacity: 1; transform: translateY(0);   filter: blur(0); }
        }
        @keyframes portalOut {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes portalDotPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50%       { transform: scale(1.6); opacity: 1; }
        }
      `}</style>

      {/* BACKGROUND */}
      <div className="thor-grid" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} />

      {/* Orbes de fond.
          Le halo vient d'un radial-gradient et non d'un `filter: blur()` : flouter
          un disque plein de 900 px animé obligeait le GPU à re-rasteriser un calque
          géant en continu. Rendu équivalent à l'œil, coût sans commune mesure. */}
      <div style={{ position: "fixed", top: "-10%", right: "-10%", width: 900, height: 900, background: `radial-gradient(circle, ${t.orb1} 0%, transparent 70%)`, animation: "orbDrift 20s ease-in-out infinite", pointerEvents: "none", zIndex: 0, willChange: "transform" }} />
      <div style={{ position: "fixed", bottom: "-15%", left: "-10%", width: 700, height: 700, background: `radial-gradient(circle, ${t.orb2} 0%, transparent 70%)`, animation: "orbDrift 28s 6s ease-in-out infinite", pointerEvents: "none", zIndex: 0, willChange: "transform" }} />
      <div style={{ position: "fixed", top: "40%", left: "40%", width: 500, height: 500, background: `radial-gradient(circle, ${t.orb1} 0%, transparent 70%)`, opacity: 0.4, animation: "orbDrift 35s 12s ease-in-out infinite", pointerEvents: "none", zIndex: 0, willChange: "transform" }} />

      {/* HERO */}
      <section style={{ position: "relative", zIndex: 1, padding: "80px 24px 60px", textAlign: "center", overflow: "hidden" }}>
        {/* Floating particles */}
        {PARTICLES.map((p, i) => (
          <div key={i} style={{ position: "absolute", left: p.left, bottom: 0, width: p.size, height: p.size, borderRadius: "50%", background: t.accent, boxShadow: `0 0 6px ${t.accent}`, animation: `floatParticle ${p.dur}s ${p.delay}s linear infinite`, pointerEvents: "none" }} />
        ))}
        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, border: `1px solid ${t.border}`, background: t.bg, color: t.accent, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 28, animation: "fadeInUp 0.6s ease both", textTransform: "uppercase" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.accent, animation: "glowPulse 2s ease-in-out infinite", boxShadow: `0 0 8px ${t.accent}` }} />
          Visite guidée interactive
        </div>

        {/* Title */}
        <div style={{ marginBottom: 20, animation: "fadeInUp 0.6s 0.1s ease both" }}>
          <h1 className="thor-title" style={{ fontSize: "clamp(72px, 13vw, 148px)", fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.05em", fontFamily: "var(--font-display)", margin: 0, color: "#0f172a" }}>
            THOR
          </h1>
          <div style={{ fontSize: "clamp(20px, 3.2vw, 36px)", fontWeight: 300, color: "#64748b", letterSpacing: "-0.02em", marginTop: 12 }}>
            en{" "}
            <span className={space === "vision" ? "gradient-action-vision" : space === "audition" ? "gradient-action-audition" : space === "pharma" ? "gradient-action-pharma" : "gradient-action-jarvis"} style={{ fontWeight: 800 }}>
              action
            </span>
          </div>
        </div>

        <p style={{ fontSize: 17, color: "#475569", maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.7, animation: "fadeInUp 0.6s 0.2s ease both" }}>
          Explorez les fonctionnalités de <strong style={{ color: t.accent, fontWeight: 700 }}>{t.name}</strong> en temps réel. Chaque aperçu reflète l&apos;interface exacte du produit.
        </p>

        {/* Space selector */}
        <div style={{ display: "inline-flex", gap: 4, padding: 4, borderRadius: 16, border: "1px solid rgba(15,23,42,0.08)", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", animation: "fadeInUp 0.6s 0.3s ease both" }}>
          {(["pharma", "vision", "audition", "jarvis"] as Space[]).map((s) => {
            const th = THEMES[s];
            const isActive = space === s;
            return (
              <button
                key={s}
                onClick={() => switchSpace(s)}
                style={{
                  padding: "10px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
                  transition: "all 0.25s ease",
                  background: isActive ? th.gradient : "transparent",
                  color: isActive ? "white" : "#475569",
                  boxShadow: isActive ? `0 4px 20px ${th.glow}` : "none",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                {s === "vision" ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                ) : s === "audition" ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3ZM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z"/>
                  </svg>
                ) : s === "pharma" ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <rect x="9" y="2" width="6" height="6" rx="1.4"/>
                    <rect x="2" y="9" width="6" height="6" rx="1.4"/>
                    <rect x="9" y="9" width="6" height="6" rx="1.4"/>
                    <rect x="16" y="9" width="6" height="6" rx="1.4"/>
                    <rect x="9" y="16" width="6" height="6" rx="1.4"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                    <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
                  </svg>
                )}
                {th.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* FEATURE EXPLORER */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1400, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, alignItems: "start" }}>

          {/* Feature nav */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>

            {/* Description active — EN HAUT, toujours visible */}
            <div style={{ marginBottom: 14, padding: "18px", borderRadius: 16, border: `1px solid ${t.border}`, background: t.bg, boxShadow: `0 0 24px ${t.glow}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", background: t.gradient, color: "white", boxShadow: `0 4px 16px ${t.glowStrong}`, flexShrink: 0 }}>
                  {cur.icon}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{cur.label}</span>
              </div>
              <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.72, margin: 0 }}>{cur.desc}</p>
            </div>

            {/* Boutons features */}
            {features.map((f, i) => {
              const isActive = i === active;
              return (
                <button
                  key={f.id}
                  onClick={() => switchFeature(i)}
                  className={`feature-btn${isActive ? " feature-btn-on" : ""}`}
                  style={{
                    width: "100%", textAlign: "left", padding: "10px 13px", borderRadius: 12,
                    border: `1px solid ${isActive ? t.border : "rgba(15,23,42,0.06)"}`,
                    background: isActive ? t.bg : "transparent",
                    cursor: "pointer", transition: "all 0.2s ease",
                    display: "flex", alignItems: "center", gap: 10,
                    boxShadow: isActive ? `0 0 20px ${t.glow}` : "none",
                  }}
                >
                  <span style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    display: "grid", placeItems: "center",
                    background: isActive ? t.gradient : "rgba(15,23,42,0.06)",
                    color: isActive ? "white" : "#94a3b8",
                    boxShadow: isActive ? `0 4px 10px ${t.glow}` : "none",
                    transition: "all 0.2s ease",
                  }}>
                    {f.icon}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: isActive ? "#0f172a" : "#475569", transition: "color 0.2s" }}>
                    {f.label}
                  </span>
                  {isActive && (
                    <span style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: t.accent, boxShadow: `0 0 6px ${t.accent}`, flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Preview terminal — vrai shell applicatif */}
          <div style={{
            borderRadius: 20,
            border: `1px solid ${t.border}`,
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            overflow: "hidden",
            boxShadow: `0 0 60px ${t.glow}, 0 1px 3px rgba(15,23,42,0.06), 0 20px 50px rgba(15,23,42,0.10)`,
            position: "relative",
          }}>
            <div className="terminal-scanline" />

            {/* Chrome — simplifié : juste traffic lights + badge */}
            <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(15,23,42,0.06)", background: "rgba(255,255,255,0.5)" }}>
              <div style={{ display: "flex", gap: 6 }}>
                {["#FF5F57", "#FEBC2E", "#28C840"].map(c => (
                  <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c, opacity: 0.85 }} />
                ))}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: t.accent, background: t.bg, border: `1px solid ${t.border}`, padding: "2px 10px", borderRadius: 999, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.accent, animation: "glowPulse 2s infinite" }} />
                {t.name}
              </span>
            </div>

            {/* Shell : sidebar sombre + contenu clair */}
            <div style={{ display: "flex" }}>

              {/* Sidebar applicative */}
              <div style={{ width: 58, display: "flex", flexDirection: "column", alignItems: "center", padding: "18px 0", gap: 4, borderRight: "1px solid rgba(15,23,42,0.05)", background: "rgba(15,23,42,0.04)", flexShrink: 0 }}>
                {/* Logo mark */}
                <div style={{ width: 32, height: 32, borderRadius: 9, background: t.gradient, display: "grid", placeItems: "center", marginBottom: 16, boxShadow: `0 4px 14px ${t.glow}` }}>
                  {space === "vision" ? (
                    <svg viewBox="0 0 24 24" style={{ width: 15, height: 15 }} fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  ) : space === "audition" ? (
                    <svg viewBox="0 0 24 24" style={{ width: 15, height: 15 }} fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3ZM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" style={{ width: 15, height: 15 }} fill="white" aria-hidden="true">
                      <rect x="9" y="2" width="6" height="6" rx="1.4"/>
                      <rect x="2" y="9" width="6" height="6" rx="1.4"/>
                      <rect x="9" y="9" width="6" height="6" rx="1.4"/>
                      <rect x="16" y="9" width="6" height="6" rx="1.4"/>
                      <rect x="9" y="16" width="6" height="6" rx="1.4"/>
                    </svg>
                  )}
                </div>
                {/* Nav icons */}
                {([
                  <IconCalendar key="c" />, <IconFolder key="f" />,
                  space === "vision" ? <IconFile key="fi" /> : space === "audition" ? <IconEar key="e" /> : <IconFile key="g" />,
                  <IconChart key="ch" />, <IconMessage key="m" />,
                ] as React.ReactNode[]).map((icon, i) => (
                  <div key={i} style={{
                    width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center",
                    background: i === sideNavIdx ? t.bg : "transparent",
                    color: i === sideNavIdx ? t.accent : "#94a3b8",
                    boxShadow: i === sideNavIdx ? `0 0 10px ${t.glow}` : "none",
                    transition: "all 0.25s",
                  }}>{icon}</div>
                ))}
              </div>

              {/* Zone de contenu — fond clair, mock UI */}
              <div key={previewKey} className="preview-enter" style={{ flex: 1, background: "#f1f5f9", padding: "18px 18px 20px", overflowY: "auto" }}>
                {cur.preview}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(15,23,42,0.06)", borderBottom: "1px solid rgba(15,23,42,0.06)", padding: "60px 24px" }}>
        <div ref={statsRef} style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 40, textAlign: "center" }}>
          {[
            { value: narr.statValue, label: narr.statLabel,    color: t.accent,   delay: "0s"    },
            { value: "99,9 %", label: "Disponibilité SLA",      color: "#a78bfa",  delay: "0.12s" },
            { value: "< 2 s",  label: "Temps de chargement",    color: "#38bdf8",  delay: "0.24s" },
            { value: "HDS",    label: "Hébergement certifié",   color: "#34d399",  delay: "0.36s" },
          ].map((s) => (
            <div key={s.label} className={`stat-item${statsVisible ? " visible" : ""}`} style={{ animationDelay: s.delay }}>
              <div style={{ fontSize: "clamp(32px,5vw,56px)", fontWeight: 900, color: s.color, fontFamily: "var(--font-display)", letterSpacing: "-0.04em", textShadow: `0 0 40px ${s.color}44`, marginBottom: 8, lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, letterSpacing: "0.02em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* POURQUOI THOR */}
      <section style={{ position: "relative", zIndex: 1, padding: "100px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* Intro */}
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 999, border: "1px solid rgba(15,23,42,0.08)", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", color: "#475569", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 24 }}>
              Notre raison d&apos;être
            </div>
            <h2 style={{ fontSize: "clamp(32px,5vw,56px)", fontWeight: 900, color: "#0f172a", fontFamily: "var(--font-display)", letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: 20 }}>
              Pourquoi nous avons<br />
              <span style={{ color: "#94a3b8" }}>construit {t.name}</span>
            </h2>
            <p style={{ fontSize: 18, color: "#475569", maxWidth: 640, margin: "0 auto", lineHeight: 1.75 }}>
              {narr.intro}
            </p>
          </div>

          {/* Citation fondateur */}
          <div style={{ borderRadius: 20, border: "1px solid rgba(15,23,42,0.08)", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", padding: "36px 48px", marginBottom: 48, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 20, left: 32, fontSize: 80, color: "rgba(45,140,255,0.10)", fontFamily: "Georgia, serif", lineHeight: 1 }}>&ldquo;</div>
            <p style={{ fontSize: 20, color: "#475569", lineHeight: 1.7, fontStyle: "italic", margin: "0 0 20px", paddingLeft: 16, position: "relative", zIndex: 1 }}>
              {narr.quote}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingLeft: 16, position: "relative", zIndex: 1 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#2D8CFF,#8B5CF6)", display: "grid", placeItems: "center", color: "white", fontWeight: 900, fontSize: 14 }}>N</div>
              <div>
                <p style={{ color: "#0f172a", fontWeight: 700, fontSize: 14, margin: 0 }}>Nicolas Thorel</p>
                <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>Co-fondateur & CEO, THOR</p>
              </div>
            </div>
          </div>

          {/* Carte module — pourquoi ce SaaS spécifique */}
          <div style={{ borderRadius: 20, border: `1px solid ${narr.cardBorder}`, background: narr.cardBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", padding: "40px 36px", marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: narr.cardGradient, display: "grid", placeItems: "center", boxShadow: `0 4px 20px ${t.glowStrong}` }}>
                {space === "vision" ? (
                  <svg viewBox="0 0 24 24" style={{ width: 24, height: 24 }} fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                ) : space === "audition" ? (
                  <svg viewBox="0 0 24 24" style={{ width: 24, height: 24 }} fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3ZM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z"/>
                  </svg>
                ) : space === "pharma" ? (
                  <svg viewBox="0 0 24 24" style={{ width: 24, height: 24 }} fill="white" aria-hidden>
                    <rect x="9" y="2" width="6" height="6" rx="1.4"/>
                    <rect x="2" y="9" width="6" height="6" rx="1.4"/>
                    <rect x="9" y="9" width="6" height="6" rx="1.4"/>
                    <rect x="16" y="9" width="6" height="6" rx="1.4"/>
                    <rect x="9" y="16" width="6" height="6" rx="1.4"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" style={{ width: 24, height: 24 }} fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="3" fill="white" />
                    <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
                  </svg>
                )}
              </div>
              <div>
                <h3 style={{ color: "#0f172a", fontWeight: 800, fontSize: 24, margin: 0, letterSpacing: "-0.02em" }}>{t.name}</h3>
                <p style={{ color: t.accent, fontSize: 13, fontWeight: 600, margin: 0 }}>{narr.audienceLong}</p>
              </div>
            </div>
            <p style={{ color: "#475569", fontSize: 15, lineHeight: 1.75, marginBottom: 28 }}>
              {narr.cardBody}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {narr.bullets.map((text) => (
                <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.accent, marginTop: 7, flexShrink: 0 }} />
                  <p style={{ color: "#475569", fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ligne de fond commune */}
          <div style={{ borderRadius: 16, border: "1px solid rgba(15,23,42,0.06)", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", padding: "28px 36px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 32 }}>
            {[
              { val: "100%", label: "Cloud natif", desc: "Aucune installation, mises à jour automatiques, données toujours sauvegardées." },
              { val: narr.trustVal, label: narr.trustLabel, desc: narr.trustDesc },
              { val: "7j/7", label: "Support humain", desc: "Une équipe dédiée, joignable 7 jours sur 7, qui connaît votre métier." },
            ].map(({ val, label, desc }) => (
              <div key={label}>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", fontFamily: "var(--font-display)", letterSpacing: "-0.04em", marginBottom: 4 }}>{val}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>{label}</div>
                <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.65, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* STEPS */}
      <section style={{ position: "relative", zIndex: 1, padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, color: "#0f172a", fontFamily: "var(--font-display)", letterSpacing: "-0.03em", marginBottom: 12 }}>En production en 24 h</h2>
          <p style={{ color: "#64748b", fontSize: 16 }}>Aucune installation, aucune migration. Tout fonctionne depuis votre navigateur.</p>
        </div>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {[
            { n: "01", title: "Créez votre espace", desc: "Choisissez votre module, paramétrez votre cabinet et invitez vos collaborateurs en quelques clics." },
            { n: "02", title: "Importez vos données", desc: "Importez vos patients depuis Excel/CSV. Notre assistant de migration s'occupe de tout." },
            { n: "03", title: "Commencez à travailler", desc: "Agenda, dossiers, messagerie — tout est prêt. Support dédié 7j/7 pendant les 30 premiers jours." },
          ].map((step, i) => (
            <div key={step.n} style={{ borderRadius: 18, border: "1px solid rgba(15,23,42,0.06)", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", padding: "28px 24px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 16, right: 20, fontSize: 56, fontWeight: 900, fontFamily: "var(--font-display)", color: "rgba(15,23,42,0.06)", lineHeight: 1 }}>{step.n}</div>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: t.gradient, display: "grid", placeItems: "center", color: "white", fontWeight: 900, fontSize: 18, marginBottom: 16, boxShadow: `0 4px 16px ${t.glow}`, fontFamily: "var(--font-display)" }}>
                {i + 1}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{step.title}</h3>
              <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ position: "relative", zIndex: 1, padding: "40px 24px 80px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", borderRadius: 24, border: `1px solid ${t.border}`, background: t.bg, padding: "48px 40px", boxShadow: `0 0 60px ${t.glow}` }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", fontFamily: "var(--font-display)", letterSpacing: "-0.03em", marginBottom: 12 }}>Prêt à démarrer ?</h2>
          <p style={{ color: "#475569", marginBottom: 28, fontSize: 15 }}>{narr.ctaDesc}</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={handleDemoClick} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", borderRadius: 14, background: t.gradient, color: "white", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", boxShadow: `0 8px 32px ${t.glowStrong}`, transition: "all 0.2s" }}>
              Parler de votre projet →
            </button>
            <Link href="/contact" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", borderRadius: 14, border: `1px solid ${t.border}`, color: "#475569", fontWeight: 600, fontSize: 14, textDecoration: "none", background: "transparent", transition: "all 0.2s" }}>
              Contacter l&apos;équipe
            </Link>
          </div>
        </div>
      </section>

      {/* PORTAL ANIMATION */}
      {portalPhase !== "hidden" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", display: "flex", alignItems: "center", justifyContent: "center" }}>

          {/* ── Phase portal ── */}
          {portalPhase === "portal" && (<>
            {/* Mots du chaos */}
            {PORTAL_WORDS.map((w, i) => (
              <div key={i} style={{
                position: "absolute",
                left: `${w.x}%`, top: `${w.y}%`,
                fontSize: w.size,
                fontWeight: 700,
                color: "rgba(15,23,42,0.20)",
                whiteSpace: "nowrap",
                ["--angle" as string]: `${w.angle}deg`,
                animation: `portalWordIn 2.0s ${w.delay}s cubic-bezier(0.22,1,0.36,1) both`,
                userSelect: "none",
              }}>{w.text}</div>
            ))}

            {/* Flash */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "radial-gradient(ellipse at 50% 50%, white 0%, rgba(45,140,255,0.4) 40%, transparent 70%)",
              animation: "portalFlash 0.9s 1.9s ease both",
              opacity: 0,
            }} />

            {/* Texte de résolution */}
            <div style={{ textAlign: "center", position: "relative", zIndex: 1, padding: "0 24px" }}>
              <p style={{ fontSize: "clamp(14px, 2vw, 18px)", color: "#94a3b8", fontWeight: 400, letterSpacing: "0.04em", marginBottom: 20, animation: "portalLineIn 0.9s 2.7s cubic-bezier(0.22,1,0.36,1) both", opacity: 0 }}>
                Ordonnances, devis, mutuelles, factures, renouvellements…
              </p>
              <h2 style={{ fontSize: "clamp(40px, 7vw, 82px)", fontWeight: 900, color: "#0f172a", fontFamily: "var(--font-display)", letterSpacing: "-0.05em", lineHeight: 1.0, marginBottom: 16, animation: "portalLineIn 0.9s 3.2s cubic-bezier(0.22,1,0.36,1) both", opacity: 0 }}>
                C&apos;est notre<br />
                <span style={{ color: t.accent }}>problème.</span>
              </h2>
              <p style={{ fontSize: "clamp(16px, 2.2vw, 22px)", color: "#64748b", fontWeight: 300, letterSpacing: "0.01em", animation: "portalLineIn 0.9s 3.8s cubic-bezier(0.22,1,0.36,1) both", opacity: 0 }}>
                Pas le vôtre.
              </p>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.accent, margin: "28px auto 0", boxShadow: `0 0 20px ${t.accent}, 0 0 40px ${t.accent}`, animation: "portalDotPulse 1.2s 4.0s ease-in-out infinite, portalLineIn 0.5s 3.9s ease both", opacity: 0 }} />
            </div>
          </>)}

          {/* ── Phase form ── */}
          {(portalPhase === "form" || portalPhase === "sent") && (
            <div style={{ animation: "portalLineIn 0.8s 0.1s cubic-bezier(0.22,1,0.36,1) both", opacity: 0, width: "100%", maxWidth: 480, padding: "0 24px", textAlign: "center", position: "relative", zIndex: 1 }}>

              {/* Glow */}
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: t.orb1, filter: "blur(100px)", pointerEvents: "none", zIndex: 0 }} />

              {portalPhase === "sent" ? (
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${t.accent}22`, border: `1.5px solid ${t.accent}55`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={t.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", fontFamily: "var(--font-display)", marginBottom: 12 }}>C&apos;est noté.</h3>
                  <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, marginBottom: 32 }}>
                    Un expert THOR vous rappelle dans les 4h ouvrées pour planifier votre démo.
                  </p>
                  <button
                    onClick={() => setPortalPhase("hidden")}
                    style={{ background: "transparent", border: `1px solid rgba(15,23,42,0.10)`, color: "#64748b", padding: "10px 24px", borderRadius: 12, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}
                  >
                    Revenir à la démo
                  </button>
                </div>
              ) : (
                <div style={{ position: "relative", zIndex: 1 }}>
                  {/* Header */}
                  <div style={{ marginBottom: 32 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 999, border: `1px solid ${t.border}`, background: t.bg, color: t.accent, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 20, textTransform: "uppercase" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.accent }} />
                      Démo personnalisée — gratuite
                    </div>
                    <h3 style={{ fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 800, color: "#0f172a", fontFamily: "var(--font-display)", letterSpacing: "-0.03em", lineHeight: 1.1, margin: 0 }}>
                      On vous rappelle.
                    </h3>
                    <p style={{ marginTop: 10, fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                      30 min en visio · zéro installation · rappel sous 4h
                    </p>
                  </div>

                  {/* Form */}
                  <form
                    onSubmit={(e) => { e.preventDefault(); setPortalPhase("sent"); }}
                    style={{ display: "flex", flexDirection: "column", gap: 12 }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <input
                        required
                        placeholder="Prénom"
                        style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(15,23,42,0.10)", borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "#0f172a", outline: "none", transition: "border-color 0.2s" }}
                        onFocus={(e) => e.target.style.borderColor = t.accent}
                        onBlur={(e) => e.target.style.borderColor = "rgba(15,23,42,0.10)"}
                      />
                      <input
                        required
                        placeholder="Nom"
                        style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(15,23,42,0.10)", borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "#0f172a", outline: "none", transition: "border-color 0.2s" }}
                        onFocus={(e) => e.target.style.borderColor = t.accent}
                        onBlur={(e) => e.target.style.borderColor = "rgba(15,23,42,0.10)"}
                      />
                    </div>
                    <input
                      required
                      type="tel"
                      placeholder="Téléphone"
                      style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(15,23,42,0.10)", borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "#0f172a", outline: "none", transition: "border-color 0.2s" }}
                      onFocus={(e) => e.target.style.borderColor = t.accent}
                      onBlur={(e) => e.target.style.borderColor = "rgba(15,23,42,0.10)"}
                    />

                    {/* Specialite pills */}
                    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 4 }}>
                      {([["optique", "Opticien"], ["audio", "Audio"], ["pharma", "Pharmacie"], ["both", "Plusieurs"]] as const).map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setSpecialite(val)}
                          style={{
                            flex: 1,
                            padding: "9px 6px",
                            borderRadius: 10,
                            fontSize: 12,
                            fontWeight: 600,
                            border: specialite === val ? `1.5px solid ${t.accent}` : "1px solid rgba(15,23,42,0.08)",
                            background: specialite === val ? t.bg : "rgba(255,255,255,0.7)",
                            color: specialite === val ? t.accent : "#475569",
                            cursor: "pointer",
                            transition: "all 0.18s",
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="submit"
                      style={{ marginTop: 4, padding: "14px", borderRadius: 14, background: t.gradient, color: "white", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", boxShadow: `0 8px 32px ${t.glowStrong}`, transition: "all 0.2s", letterSpacing: "-0.01em" }}
                    >
                      Réserver ma démo →
                    </button>
                  </form>

                  <button
                    onClick={() => setPortalPhase("hidden")}
                    style={{ marginTop: 18, background: "none", border: "none", color: "#94a3b8", fontSize: 12, cursor: "pointer", transition: "color 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#475569")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
                  >
                    ← Revenir à la démo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
