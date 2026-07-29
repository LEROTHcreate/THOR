"use client";

import { useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";

type View = "patient" | "praticien";
type Brand = "vision" | "audition";

/* ─────────────────────────────────────────────
   MOCKUP PATIENT
───────────────────────────────────────────── */
function PatientMockup({ brand }: { brand: Brand }) {
  const accent = brand === "vision" ? "#2D8CFF" : "#00C98A";
  const accentHover = brand === "vision" ? "#1A72E8" : "#00A574";
  const accentBg = brand === "vision" ? "#EFF6FF" : "#ECFDF5";
  const accentRing = brand === "vision" ? "#BFDBFE" : "#A7F3D0";
  const brandName = brand === "vision" ? "Clair Vision" : "Clair Audition";
  const url = brand === "vision" ? "thor.fr/clair-vision/espace-patient" : "thor.fr/clair-audition/espace-patient";
  const userName = brand === "vision" ? "Marie" : "Jean";

  const navItems = brand === "vision"
    ? ["Accueil", "Examens de vue", "Lentilles", "Ordonnances", "Documents", "Achats", "Messages", "Rendez-vous", "Mes centres", "Actualités"]
    : ["Accueil", "Mon profil", "Bilans auditifs", "Mes appareils", "Ordonnances", "Documents", "Achats", "Messages", "Rendez-vous", "Mes centres", "Actualités"];

  const stats = brand === "vision"
    ? [
        { label: "PROCHAIN RDV", value: "15 jan. 2025", sub: "10:30 · Paris 8" },
        { label: "DERNIER EXAMEN", value: "Nov. 2024", sub: "Il y a 2 mois" },
        { label: "ORDONNANCES", value: "2 actives", sub: "Valides · 2027", accent: true },
        { label: "DOCUMENTS", value: "5 fichiers", sub: "1 verrouillé" },
      ]
    : [
        { label: "PROCHAIN RDV", value: "15 jan. 2025", sub: "10:30 · Marseille Prado" },
        { label: "DERNIER BILAN", value: "Nov. 2024", sub: "Il y a 2 mois" },
        { label: "APPAREILS", value: "2 actifs", sub: "OD + OG en service", accent: true },
        { label: "DOCUMENTS", value: "6 fichiers", sub: "2 verrouillés" },
      ];

  const mainCard = brand === "vision"
    ? { title: "Dernier examen de vue", date: "15 novembre 2024", loc: "Clair Vision – Paris 8 · Dr. Sophie Martin", detail: ["OD: Sph −1.75 · Cyl −0.50 · Axe 15°", "OG: Sph −1.25 · Cyl −0.25 · Axe 170°"] }
    : { title: "Dernier bilan auditif", date: "18 novembre 2024", loc: "Clair Audition – Marseille Prado · M. Rami Benali", detail: ["Perte modérée bilatérale stable", "Appareillage bien toléré — Conforme"] };

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(11,18,32,0.16)]"
      style={{ background: "var(--glass-card-bg)", border: "1px solid var(--glass-strong-border)" }}
    >
      {/* Browser bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100" style={{ background: "#f8fafc" }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
        </div>
        <div className="flex-1 mx-3 h-5 rounded-full flex items-center px-2.5 text-[9px] text-slate-400" style={{ background: "rgba(241,245,249,0.90)", border: "1px solid rgba(226,232,240,0.60)" }}>
          {url}
        </div>
      </div>

      <div className="flex" style={{ height: 340 }}>
        {/* Sidebar */}
        <div className="w-40 shrink-0 p-2.5 border-r border-slate-100 flex flex-col gap-0.5" style={{ background: "rgba(248,250,252,0.98)" }}>
          <div className="flex items-center gap-1.5 px-1.5 py-1.5 mb-1.5">
            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: accent }}>
              <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none">
                {brand === "vision"
                  ? <><circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="6" cy="6" r="0.8" fill="currentColor"/></>
                  : <><path d="M3 6a3 3 0 016 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M1.5 6a4.5 4.5 0 019 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="6" cy="6" r="1" fill="currentColor"/></>
                }
              </svg>
            </div>
            <div>
              <div className="text-[9px] font-bold text-slate-800">{brandName}</div>
              <div className="text-[7px] text-slate-400">Espace patient</div>
            </div>
          </div>
          {navItems.map((item, i) => (
            <div key={item} className="flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[8.5px] font-medium" style={i === 0 ? { background: `linear-gradient(135deg, ${accent}, ${accentHover})`, color: "white" } : { color: "#64748B" }}>
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: i === 0 ? "rgba(255,255,255,0.6)" : "transparent" }} />
              {item}
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="flex-1 p-2.5 overflow-hidden" style={{ background: "#f8fafc" }}>
          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="text-[10px] font-bold text-slate-800">Bonjour, {userName}</div>
              <div className="text-[7.5px] text-slate-400">Tableau de bord · Mis à jour aujourd&apos;hui</div>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />
              <span className="text-[7.5px] font-medium" style={{ color: accent }}>{brand === "vision" ? "Ordonnance valide" : "Appareils actifs"}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-1 mb-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg p-1.5" style={{ background: "rgba(255,255,255,0.90)", border: "1px solid rgba(226,232,240,0.50)" }}>
                <div className="text-[6px] text-slate-400 mb-0.5">{s.label}</div>
                <div className="text-[8px] font-bold" style={s.accent ? { color: accent } : { color: "#0f172a" }}>{s.value}</div>
                <div className="text-[6px] text-slate-400">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-3 gap-1">
            <div className="col-span-2 rounded-lg p-2" style={{ background: "rgba(255,255,255,0.90)", border: "1px solid rgba(226,232,240,0.50)" }}>
              <div className="flex justify-between items-center mb-1">
                <div className="text-[6.5px] font-semibold text-slate-400 uppercase tracking-wide">{mainCard.title.toUpperCase()}</div>
                <div className="text-[6px] px-1 py-0.5 rounded-full font-medium" style={{ background: accentBg, color: accent }}>À jour</div>
              </div>
              <div className="text-[8.5px] font-bold text-slate-800 mb-0.5">{mainCard.date}</div>
              <div className="text-[6.5px] text-slate-400 mb-1">{mainCard.loc}</div>
              {mainCard.detail.map((d) => (
                <div key={d} className="text-[6.5px] text-slate-600">{d}</div>
              ))}
              {brand === "audition" && (
                <div className="mt-1.5 flex gap-0.5">
                  {["250Hz","500Hz","1kHz","2kHz","4kHz","8kHz"].map((f, i) => (
                    <div key={f} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="w-full rounded-full" style={{ height: [8,12,16,20,18,14][i], background: `${accent}99` }} />
                      <div className="text-[4.5px] text-slate-400">{f}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.90)", border: "1px solid rgba(226,232,240,0.50)" }}>
                <div className="text-[6.5px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{brand === "vision" ? "STATUT DOSSIER" : "MES APPAREILS"}</div>
                {(brand === "vision"
                  ? ["Examen · 15 nov.", "Ordonnance · Valide", "Suivi · Actif"]
                  : ["Oreille D. · Phonak", "Oreille G. · Phonak", "Réglage · Ok"]
                ).map((r) => (
                  <div key={r} className="text-[6.5px] text-slate-600 py-0.5 border-b border-slate-50 last:border-0">{r}</div>
                ))}
              </div>
              <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.90)", border: "1px solid rgba(226,232,240,0.50)" }}>
                <div className="text-[6.5px] font-semibold text-slate-400 uppercase tracking-wide mb-1">À FAIRE</div>
                {["Contrôle lentilles", "Mettre à jour profil"].map((t) => (
                  <div key={t} className="flex items-center gap-1 py-0.5">
                    <div className="w-2 h-2 rounded-full border border-slate-300 shrink-0" />
                    <div className="text-[6px] text-slate-500">{t}</div>
                  </div>
                ))}
                <div className="flex items-center gap-1 py-0.5">
                  <div className="w-2 h-2 rounded-full shrink-0 flex items-center justify-center" style={{ background: accent }}>
                    <svg viewBox="0 0 8 8" className="w-1.5 h-1.5" fill="none"><path d="M1.5 4L3 5.5 6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  </div>
                  <div className="text-[6px] text-slate-300 line-through">Voir ordonnance</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MOCKUP PRATICIEN
───────────────────────────────────────────── */
function PraticienMockup({ brand }: { brand: Brand }) {
  const accent = brand === "vision" ? "#2D8CFF" : "#00C98A";
  const accentHover = brand === "vision" ? "#1A72E8" : "#00A574";
  const accentBg = brand === "vision" ? "#EFF6FF" : "#ECFDF5";
  const accentRing = brand === "vision" ? "#BFDBFE" : "#A7F3D0";
  const brandName = brand === "vision" ? "Clair Vision" : "Clair Audition";
  const url = brand === "vision" ? "thor.fr/clair-vision/pro/optique" : "thor.fr/clair-audition/pro";

  const agenda = brand === "vision"
    ? [
        { time: "09:00", name: "Marie Leblanc", type: "Examen de vue complet" },
        { time: "10:30", name: "Paul Renaud", type: "Adaptation lentilles" },
        { time: "14:00", name: "Lucas Bernard", type: "Bilan enfant" },
        { time: "15:30", name: "Claire Petit", type: "Contrôle annuel" },
      ]
    : [
        { time: "09:30", name: "Jean Dupont", type: "Contrôle 1 mois" },
        { time: "11:00", name: "Martine Roussel", type: "Bilan auditif complet" },
        { time: "14:00", name: "Claude Moreau", type: "Adaptation appareil" },
        { time: "15:30", name: "Sophie Blanc", type: "Premier rendez-vous" },
      ];

  const patients = brand === "vision"
    ? [
        { initials: "ML", name: "Marie Leblanc", diag: "Myopie forte", rdv: "Aujourd'hui" },
        { initials: "PR", name: "Paul Renaud", diag: "Lentilles de contact", rdv: "Aujourd'hui" },
        { initials: "LB", name: "Lucas Bernard", diag: "Bilan enfant", rdv: "Aujourd'hui" },
      ]
    : [
        { initials: "JD", name: "Jean Dupont", diag: "Appareillage binaural", rdv: "Aujourd'hui" },
        { initials: "MR", name: "Martine Roussel", diag: "Presbyacousie", rdv: "Aujourd'hui" },
        { initials: "CM", name: "Claude Moreau", diag: "Adaptation en cours", rdv: "Aujourd'hui" },
      ];

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(11,18,32,0.16)]"
      style={{ background: "var(--glass-card-bg)", border: "1px solid var(--glass-strong-border)" }}
    >
      {/* Browser bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100" style={{ background: "#f8fafc" }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
        </div>
        <div className="flex-1 mx-3 h-5 rounded-full flex items-center px-2.5 text-[9px] text-slate-400" style={{ background: "rgba(241,245,249,0.90)", border: "1px solid rgba(226,232,240,0.60)" }}>
          {url}
        </div>
        <div className="text-[8px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">PRO</div>
      </div>

      <div className="flex" style={{ height: 340 }}>
        {/* Sidebar */}
        <div className="w-36 shrink-0 p-2.5 border-r border-slate-100 flex flex-col gap-0.5" style={{ background: "rgba(248,250,252,0.98)" }}>
          <div className="flex items-center gap-1.5 px-1.5 py-1.5 mb-1.5">
            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: accent }}>
              <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white" fill="none">
                <rect x="1.5" y="2" width="9" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M3.5 5h5M3.5 7h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="text-[8.5px] font-bold text-slate-800">{brandName}</div>
              <div className="text-[7px] text-slate-400">Espace praticien</div>
            </div>
          </div>
          {["Tableau de bord", "Dossiers", "Agenda", "Patients", brand === "vision" ? "Ordonnances" : "Bilans", "Messages"].map((item, i) => (
            <div key={item} className="flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[8.5px] font-medium" style={i === 0 ? { background: `linear-gradient(135deg, ${accent}, ${accentHover})`, color: "white" } : { color: "#64748B" }}>
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: i === 0 ? "rgba(255,255,255,0.6)" : "transparent" }} />
              {item}
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="flex-1 p-2.5 overflow-hidden" style={{ background: "#f8fafc" }}>
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="text-[10px] font-bold text-slate-800">Tableau de bord</div>
              <div className="text-[7.5px] text-slate-400">Lundi 23 mars 2026 · {agenda.length} RDV aujourd&apos;hui</div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[7.5px] font-semibold text-white" style={{ background: `linear-gradient(135deg, ${accent}, ${accentHover})` }}>
              + Nouveau RDV
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-1 mb-2">
            {[
              { label: "RDV aujourd'hui", value: String(agenda.length) },
              { label: "Patients actifs", value: "48" },
              { label: "Dossiers ouverts", value: "12" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg p-1.5" style={{ background: "rgba(255,255,255,0.90)", border: "1px solid rgba(226,232,240,0.50)" }}>
                <div className="text-[6.5px] text-slate-400 mb-0.5">{s.label}</div>
                <div className="text-[11px] font-bold h-title" style={{ color: accent }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-5 gap-1">
            {/* Agenda */}
            <div className="col-span-3 rounded-lg p-2" style={{ background: "rgba(255,255,255,0.90)", border: "1px solid rgba(226,232,240,0.50)" }}>
              <div className="flex justify-between items-center mb-1.5">
                <div className="text-[6.5px] font-semibold text-slate-400 uppercase tracking-wide">AGENDA DU JOUR</div>
                <div className="text-[6.5px] font-medium" style={{ color: accent }}>Voir tout →</div>
              </div>
              <div className="space-y-1">
                {agenda.map((apt, i) => (
                  <div key={apt.time} className="flex items-center gap-2 rounded-md p-1" style={{ background: i === 0 ? accentBg : "transparent", border: i === 0 ? `1px solid ${accentRing}` : "none" }}>
                    <div className="text-[7.5px] font-bold w-8 shrink-0" style={{ color: accent }}>{apt.time}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[7.5px] font-semibold text-slate-800 truncate">{apt.name}</div>
                      <div className="text-[6.5px] text-slate-400 truncate">{apt.type}</div>
                    </div>
                    {i === 0 && <div className="text-[6px] px-1 py-0.5 rounded-full font-medium text-white shrink-0" style={{ background: accent }}>En cours</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Patients */}
            <div className="col-span-2 rounded-lg p-2" style={{ background: "rgba(255,255,255,0.90)", border: "1px solid rgba(226,232,240,0.50)" }}>
              <div className="text-[6.5px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">PATIENTS DU JOUR</div>
              <div className="space-y-1.5">
                {patients.map((p) => (
                  <div key={p.name} className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[6px] font-bold text-white" style={{ background: accent }}>{p.initials}</div>
                    <div className="min-w-0">
                      <div className="text-[7.5px] font-semibold text-slate-800 truncate">{p.name}</div>
                      <div className="text-[6px] text-slate-400 truncate">{p.diag}</div>
                    </div>
                  </div>
                ))}
                <div className="text-[6.5px] font-medium text-center mt-1 py-0.5 rounded-md" style={{ color: accent, background: accentBg }}>
                  Voir tous les dossiers →
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION PRINCIPALE
───────────────────────────────────────────── */
export function EspacesDedies() {
  const [view, setView] = useState<View>("patient");
  const [brand, setBrand] = useState<Brand>("vision");

  const features = {
    patient: {
      vision: [
        { title: "Suivi santé visuelle", desc: "Historique complet de vos examens, ordonnances et lentilles." },
        { title: "Rendez-vous en ligne", desc: "Réservez et gérez vos RDV directement depuis votre espace." },
        { title: "Documents & factures", desc: "Accédez à tous vos documents à tout moment, déverrouillables." },
        { title: "Messagerie sécurisée", desc: "Échangez directement avec votre praticien." },
      ],
      audition: [
        { title: "Bilans & audiogrammes", desc: "Visualisez l'évolution de votre audition dans le temps." },
        { title: "Suivi des appareils", desc: "État de vos appareils auditifs, réglages, garanties." },
        { title: "Rendez-vous en ligne", desc: "Planifiez vos contrôles et adaptations depuis votre espace." },
        { title: "Mes centres", desc: "Retrouvez les centres que vous avez fréquentés." },
      ],
    },
    praticien: {
      vision: [
        { title: "Dossiers patients", desc: "Accès complet aux examens, ordonnances et historique de chaque patient." },
        { title: "Agenda intégré", desc: "Planification des RDV, vue semaine et gestion des créneaux." },
        { title: "Ordonnances numériques", desc: "Rédigez et envoyez des ordonnances directement depuis la plateforme." },
        { title: "Tableau de bord", desc: "Vue synthétique de votre activité quotidienne et de vos patients." },
      ],
      audition: [
        { title: "Bilans auditifs", desc: "Saisie et visualisation des audiogrammes, comptes-rendus structurés." },
        { title: "Suivi appareillage", desc: "Historique des réglages, garanties et suivi post-appareillage." },
        { title: "Agenda & planning", desc: "Organisation des RDV de bilan, contrôle et adaptation." },
        { title: "Dossiers patients", desc: "Centralisation de toutes les données de chaque patient audiologique." },
      ],
    },
  };

  const currentFeatures = features[view][brand];
  const accent = brand === "vision" ? "#2D8CFF" : "#00C98A";
  const accentBg = brand === "vision" ? "#EFF6FF" : "#ECFDF5";
  const accentRing = brand === "vision" ? "#BFDBFE" : "#A7F3D0";
  const connexionHref = view === "praticien" ? "/connexion/praticien" : brand === "vision" ? "/connexion/patient?space=vision" : "/connexion/patient?space=audition";

  return (
    <section id="espaces" className="py-20 md:py-28" style={{ background: "linear-gradient(180deg, #f8fafc 0%, #f1f5fb 100%)" }}>
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24">

        {/* Header */}
        <Reveal>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-500 mb-4">
              La plateforme
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 h-title">
              Une plateforme,{" "}
              <span className="font-light text-slate-400">quatre espaces</span>
            </h2>
            <p className="mt-4 text-slate-500 max-w-2xl mx-auto text-base leading-[1.7]">
              Patients et praticiens, optique et audiologie — chaque espace est pensé pour ses utilisateurs, avec les outils qui leur correspondent.
            </p>
          </div>
        </Reveal>

        {/* Tabs */}
        <Reveal delay={60}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            {/* Patient / Praticien */}
            <div className="flex items-center rounded-2xl bg-white p-1 ring-1 ring-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
              {(["patient", "praticien"] as View[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={view === v ? { background: "#0B1220", color: "white", boxShadow: "0 2px 8px rgba(11,18,32,0.20)" } : { color: "#64748B" }}
                >
                  Espace {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>

            {/* Vision / Audition */}
            <div className="flex items-center rounded-2xl bg-white p-1 ring-1 ring-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
              <button
                onClick={() => setBrand("vision")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={brand === "vision" ? { background: "#2D8CFF", color: "white", boxShadow: "0 2px 10px rgba(45,140,255,0.30)" } : { color: "#64748B" }}
              >
                <div className="w-2 h-2 rounded-full" style={{ background: brand === "vision" ? "rgba(255,255,255,0.7)" : "#2D8CFF" }} />
                Clair Vision
              </button>
              <button
                onClick={() => setBrand("audition")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={brand === "audition" ? { background: "#00C98A", color: "white", boxShadow: "0 2px 10px rgba(0,201,138,0.30)" } : { color: "#64748B" }}
              >
                <div className="w-2 h-2 rounded-full" style={{ background: brand === "audition" ? "rgba(255,255,255,0.7)" : "#00C98A" }} />
                Clair Audition
              </button>
            </div>
          </div>
        </Reveal>

        {/* Split layout: features left + mockup right */}
        <Reveal delay={100}>
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">

            {/* Left — Features */}
            <div className="w-full lg:w-[36%] shrink-0">
              <div className="mb-6">
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold mb-3"
                  style={{ background: accentBg, color: accent, border: `1px solid ${accentRing}` }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
                  {brand === "vision" ? "Clair Vision" : "Clair Audition"} · Espace {view}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 h-title leading-tight">
                  {view === "patient"
                    ? "Tout votre parcours de soin, au même endroit"
                    : "Gérez votre activité depuis un seul espace"}
                </h3>
                <p className="mt-3 text-slate-500 text-sm leading-[1.75]">
                  {view === "patient"
                    ? `Votre espace ${brand === "vision" ? "Clair Vision" : "Clair Audition"} centralise toutes vos informations médicales, vos rendez-vous et vos documents.`
                    : `L'espace praticien ${brand === "vision" ? "Clair Vision" : "Clair Audition"} vous donne une vue complète sur vos patients et votre planning.`}
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {currentFeatures.map((f, i) => (
                  <div key={f.title} className="flex gap-3">
                    <div
                      className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: `linear-gradient(135deg, ${accent}, ${brand === "vision" ? "#1A72E8" : "#00A574"})` }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{f.title}</div>
                      <div className="text-sm text-slate-500 leading-[1.6]">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href={connexionHref}
                className="inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:opacity-95"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${brand === "vision" ? "#1A72E8" : "#00A574"})`,
                  boxShadow: `0 4px 20px ${brand === "vision" ? "rgba(45,140,255,0.28)" : "rgba(0,201,138,0.28)"}`,
                }}
              >
                Accéder à l&apos;espace {view} →
              </Link>
            </div>

            {/* Right — Mockup */}
            <div className="flex-1 min-w-0" aria-hidden="true">
              {view === "patient"
                ? <PatientMockup brand={brand} />
                : <PraticienMockup brand={brand} />
              }
            </div>
          </div>
        </Reveal>

      </div>
    </section>
  );
}

export default EspacesDedies;
