"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface PatientProfile { prenom: string; nom: string; }
interface RendezVous { date: string; heure: string; type: string; centreNom?: string; patientNom?: string; }

/* ─── Helpers localStorage ───────────────────────────────────────────────── */
function ls<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function loadPatient(): PatientProfile {
  return ls<PatientProfile>("thor_patient_current", { prenom: "Jean", nom: "Dupont" });
}
function loadNextRdv(patient: PatientProfile): RendezVous | null {
  const rdvs = ls<RendezVous[]>("thor_pro_rdv", []);
  const today = new Date().toISOString().slice(0, 10);
  return rdvs
    .filter((r) => r.date >= today && r.patientNom?.toLowerCase().includes(patient.nom.toLowerCase()))
    .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
}

/* ─── Données audiogramme (mock bilan nov. 2024) ─────────────────────────── */
const LABELS = ["250", "500", "1k", "2k", "4k", "8k"];
const OD_DB  = [20, 35, 50, 65, 75, 80];
const OG_DB  = [25, 40, 55, 60, 70, 85];

/* ─── Sévérité OMS ───────────────────────────────────────────────────────── */
function getSeverity(db: number): { label: string; color: string; bg: string } {
  if (db < 20) return { label: "Normal",   color: "#16a34a", bg: "rgba(22,163,74,0.10)"  };
  if (db < 40) return { label: "Légère",   color: "#d97706", bg: "rgba(217,119,6,0.10)"  };
  if (db < 60) return { label: "Modérée",  color: "#ea580c", bg: "rgba(234,88,12,0.10)"  };
  if (db < 80) return { label: "Sévère",   color: "#dc2626", bg: "rgba(220,38,38,0.10)"  };
  return              { label: "Profonde", color: "#7c3aed", bg: "rgba(124,58,237,0.10)"  };
}
const avgOD = Math.round(OD_DB.reduce((a,b) => a+b, 0) / OD_DB.length);
const avgOG = Math.round(OG_DB.reduce((a,b) => a+b, 0) / OG_DB.length);

/* ─── Audiogramme SVG pleine largeur ─────────────────────────────────────── */
function MiniAudiogram() {
  const VW = 1200; const VH = 160;
  const L = 36; const R = 16; const T = 10; const B = 26;
  const iW = VW - L - R;
  const iH = VH - T - B;

  const x = (i: number) => L + (i / (LABELS.length - 1)) * iW;
  const y = (db: number) => T + (db / 100) * iH;

  const zones = [
    { from: 0,  to: 20,  fill: "rgba(22,163,74,0.06)"  },
    { from: 20, to: 40,  fill: "rgba(234,179,8,0.07)"  },
    { from: 40, to: 65,  fill: "rgba(249,115,22,0.07)" },
    { from: 65, to: 100, fill: "rgba(239,68,68,0.07)"  },
  ];

  const odLine = OD_DB.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const ogLine = OG_DB.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  /* aire sous la courbe */
  const odFill = `${odLine} L${x(5).toFixed(1)},${(T + iH).toFixed(1)} L${x(0).toFixed(1)},${(T + iH).toFixed(1)} Z`;
  const ogFill = `${ogLine} L${x(5).toFixed(1)},${(T + iH).toFixed(1)} L${x(0).toFixed(1)},${(T + iH).toFixed(1)} Z`;

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", width: "100%", height: "auto" }}
      aria-label="Mini-audiogramme tonal"
    >
      <defs>
        <linearGradient id="gradOD" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.12"/>
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="gradOG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2D8CFF" stopOpacity="0.10"/>
          <stop offset="100%" stopColor="#2D8CFF" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* Zones fond */}
      {zones.map((z, i) => (
        <rect key={i} x={L} y={y(z.from)} width={iW} height={y(z.to) - y(z.from)} fill={z.fill} />
      ))}

      {/* Grille horizontale */}
      {[0, 20, 40, 60, 80, 100].map((db) => (
        <g key={db}>
          <line x1={L} y1={y(db)} x2={L + iW} y2={y(db)} stroke="rgba(0,0,0,0.06)" strokeWidth="1" strokeDasharray={db === 0 ? "none" : "4,3"} />
          <text x={L - 6} y={y(db) + 4} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="system-ui">{db}</text>
        </g>
      ))}

      {/* Colonnes verticales */}
      {LABELS.map((_, i) => (
        <line key={i} x1={x(i)} y1={T} x2={x(i)} y2={T + iH} stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
      ))}

      {/* Aires sous les courbes */}
      <path d={odFill} fill="url(#gradOD)" />
      <path d={ogFill} fill="url(#gradOG)" />

      {/* Courbes */}
      <path d={odLine} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <path d={ogLine} fill="none" stroke="#2D8CFF" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {/* Marqueurs OD : X */}
      {OD_DB.map((v, i) => {
        const cx = x(i); const cy = y(v); const s = 5;
        return (
          <g key={`od${i}`}>
            <circle cx={cx} cy={cy} r="9" fill="rgba(239,68,68,0.08)" />
            <line x1={cx-s} y1={cy-s} x2={cx+s} y2={cy+s} stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            <line x1={cx+s} y1={cy-s} x2={cx-s} y2={cy+s} stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          </g>
        );
      })}

      {/* Marqueurs OG : cercle */}
      {OG_DB.map((v, i) => (
        <g key={`og${i}`}>
          <circle cx={x(i)} cy={y(v)} r="9" fill="rgba(45,140,255,0.08)" />
          <circle cx={x(i)} cy={y(v)} r="4.5" fill="white" stroke="#2D8CFF" strokeWidth="2" />
        </g>
      ))}

      {/* Labels fréquences */}
      {LABELS.map((l, i) => (
        <text key={l} x={x(i)} y={VH - 10} textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="system-ui">{l}</text>
      ))}
      <text x={L + iW / 2} y={VH - 1} textAnchor="middle" fontSize="8.5" fill="#cbd5e1" fontFamily="system-ui">Hz</text>
      <text x={8} y={T + iH / 2} textAnchor="middle" fontSize="8.5" fill="#cbd5e1" fontFamily="system-ui"
        transform={`rotate(-90, 8, ${T + iH / 2})`}>dB HL</text>

      {/* Légende haut droite */}
      <g transform={`translate(${L + iW - 108}, ${T + 6})`}>
        <rect x="-8" y="-6" width="116" height="32" rx="6" fill="white" fillOpacity="0.90" />
        <line x1="0" y1="6" x2="14" y2="6" stroke="#ef4444" strokeWidth="1.6" />
        <line x1="4" y1="2" x2="10" y2="10" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="10" y1="2" x2="4" y2="10" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" />
        <text x="18" y="10" fontSize="9" fill="#475569" fontWeight="600" fontFamily="system-ui">OD — Oreille droite</text>
        <line x1="0" y1="22" x2="14" y2="22" stroke="#2D8CFF" strokeWidth="1.6" />
        <circle cx="7" cy="22" r="4" fill="white" stroke="#2D8CFF" strokeWidth="1.6" />
        <text x="18" y="26" fontSize="9" fill="#475569" fontWeight="600" fontFamily="system-ui">OG — Oreille gauche</text>
      </g>
    </svg>
  );
}

/* ─── Icônes ──────────────────────────────────────────────────────────────── */
function IconBilan() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>;
}
function IconOrd() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M7 2.8h6.8L19.2 8v13.2A2 2 0 0 1 17.2 23H7A2 2 0 0 1 5 21.2V4.8A2 2 0 0 1 7 2.8Z"/><path d="M13.8 2.8V8h5.4M8 12h8M8 15.5h5"/></svg>;
}
function IconProfil() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 12.2a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12.2Z"/><path d="M4.5 20.2c1.7-4 13.3-4 15 0"/></svg>;
}
function IconRdv() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function IconMsg() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}

/* ─── Conseils entretien ──────────────────────────────────────────────────── */
const CONSEILS = [
  { titre: "Nettoyage quotidien", texte: "Essuyez vos appareils avec un chiffon sec chaque soir. Évitez l'eau et les sprays.", icon: "" },
  { titre: "Stockage la nuit", texte: "Laissez le tiroir de la batterie ouvert la nuit pour sécher l'humidité accumulée.", icon: "" },
  { titre: "Environnements humides", texte: "Retirez vos appareils avant la douche, la piscine ou une activité sportive intense.", icon: "" },
  { titre: "Contrôle régulier", texte: "Un contrôle chez votre audioprothésiste tous les 6 mois permet d'optimiser le réglage.", icon: "" },
];

/* ══════════════════════════════════════════════════════════════════════════ */
export default function AuditionDashboardPage() {
  const [patient, setPatient] = useState<PatientProfile>({ prenom: "Jean", nom: "Dupont" });
  const [nextRdv, setNextRdv] = useState<RendezVous | null>(null);
  const [conseilIdx, setConseilIdx] = useState(0);

  useEffect(() => {
    const p = loadPatient();
    setPatient(p);
    setNextRdv(loadNextRdv(p));
    setConseilIdx(Math.floor(Math.random() * CONSEILS.length));
  }, []);

  const initials = `${patient.prenom[0] ?? ""}${patient.nom[0] ?? ""}`.toUpperCase();
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const formatRdvDate = (r: RendezVous) =>
    new Date(r.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const odSev = getSeverity(avgOD);
  const ogSev = getSeverity(avgOG);
  const conseil = CONSEILS[conseilIdx % CONSEILS.length];

  return (
    <div className="space-y-5 pb-10">

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold shrink-0"
            style={{ background: "#00C98A", boxShadow: "0 4px 14px rgba(0,201,138,0.25)" }}>
            {initials}
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium tracking-wide">{greeting}</p>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">{patient.prenom} {patient.nom}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1"
                style={{ background: "rgba(0,201,138,0.10)", color: "#00956A" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00C98A] animate-pulse" />
                Suivi actif
              </span>
              <span className="text-[11px] text-slate-400">Données sécurisées HDS</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <Link href="/clair-audition/espace-patient/rendez-vous"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ background: "#00C98A", boxShadow: "0 4px 12px rgba(0,201,138,0.30)" }}>
            <IconRdv />
            Prendre RDV
          </Link>
          <Link href="/clair-audition/espace-patient/messages"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-all">
            <IconMsg />
            Messages
          </Link>
        </div>
      </div>

      {/* ── Grille principale ────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* ── Colonne gauche 2/3 ──────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Audiogramme pleine largeur */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>

            {/* En-tête carte */}
            <div className="flex items-start justify-between px-6 pt-5 pb-4">
              <div>
                <div className="text-sm font-semibold text-slate-800">Dernier audiogramme</div>
                <div className="text-xs text-slate-400 mt-0.5">Novembre 2024 · THOR Marseille Prado · M. Rami Benali</div>
              </div>
              <Link href="/clair-audition/espace-patient/bilans-auditifs"
                className="text-xs font-semibold text-[#00C98A] hover:underline flex items-center gap-1 shrink-0">
                Voir complet
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
              </Link>
            </div>

            {/* Layout : graphique à gauche, résumé à droite */}
            <div className="px-5 pb-5 grid md:grid-cols-[1fr_160px] gap-4 items-center">
              <div>
                <MiniAudiogram />
              </div>

              {/* OD / OG vertical */}
              <div className="space-y-3">
                {[
                  { side: "OD", label: "Oreille droite", db: avgOD, sev: odSev, color: "#ef4444" },
                  { side: "OG", label: "Oreille gauche", db: avgOG, sev: ogSev, color: "#2D8CFF" },
                ].map((ear) => (
                  <div key={ear.side} className="rounded-xl border p-3 flex items-center gap-3"
                    style={{ borderColor: ear.color + "22", background: ear.color + "04" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                      style={{ background: ear.color }}>
                      {ear.side}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-400 font-medium">{ear.label}</div>
                      <div className="text-base font-bold text-slate-800 leading-none mt-0.5">{ear.db} <span className="text-xs font-medium text-slate-400">dB</span></div>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: ear.sev.bg, color: ear.sev.color }}>
                        {ear.sev.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Conseil du moment */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-slate-800">Conseil du moment</div>
              <div className="flex gap-1">
                {CONSEILS.map((_, i) => (
                  <button key={i} onClick={() => setConseilIdx(i)}
                    className="w-1.5 h-1.5 rounded-full transition-all"
                    style={{ background: i === conseilIdx % CONSEILS.length ? "#00C98A" : "#e2e8f0" }} />
                ))}
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: "rgba(0,201,138,0.08)" }}>
                {conseil.icon}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800 mb-1">{conseil.titre}</div>
                <p className="text-sm text-slate-500 leading-relaxed">{conseil.texte}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3">
              {CONSEILS.filter((_, i) => i !== conseilIdx % CONSEILS.length).map((c, i) => (
                <button key={i} onClick={() => setConseilIdx(CONSEILS.indexOf(c))}
                  className="text-left rounded-xl border border-slate-100 p-3 hover:border-[rgba(0,201,138,0.25)] hover:bg-[rgba(0,201,138,0.02)] transition-all">
                  <div className="text-base mb-1">{c.icon}</div>
                  <div className="text-[11px] font-semibold text-slate-600 leading-tight">{c.titre}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Documents récents */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-slate-800">Documents récents</div>
              <Link href="/clair-audition/espace-patient/documents"
                className="text-xs font-semibold text-[#00C98A] hover:underline flex items-center gap-1">
                Tous <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
              </Link>
            </div>
            <div className="space-y-1">
              {[
                { title: "Bilan auditif — Nov. 2024",         date: "12 nov. 2024", type: "Bilan",      locked: false },
                { title: "Ordonnance d'appareillage OD + OG", date: "12 nov. 2024", type: "Ordonnance", locked: false },
                { title: "Devis 100% Santé — Phonak Lumity",  date: "5 nov. 2024",  type: "Devis",      locked: false },
                { title: "Bilan auditif — Mars 2023",         date: "8 mars 2023",  type: "Bilan",      locked: true  },
              ].map((doc) => (
                <div key={doc.title} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${doc.locked ? "bg-slate-200" : ""}`}
                    style={!doc.locked ? { background: "#00C98A" } : {}}>
                    PDF
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-semibold truncate ${doc.locked ? "text-slate-400" : "text-slate-700"}`}>{doc.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-400">{doc.date}</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{doc.type}</span>
                    </div>
                  </div>
                  {doc.locked ? (
                    <Link href="/clair-audition/espace-patient/achats"
                      className="text-[11px] font-semibold text-slate-400 hover:text-[#00C98A] shrink-0 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      Déverrouiller
                    </Link>
                  ) : (
                    <button onClick={() => window.print()}
                      className="text-[11px] font-semibold text-[#00C98A] shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Télécharger
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Colonne droite 1/3 ──────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Prochain RDV */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Prochain rendez-vous</div>
            {nextRdv ? (
              <div>
                <div className="rounded-xl p-3.5 mb-3"
                  style={{ background: "rgba(0,201,138,0.06)", border: "1px solid rgba(0,201,138,0.14)" }}>
                  <div className="text-sm font-bold text-slate-800 capitalize">{formatRdvDate(nextRdv)}</div>
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    {nextRdv.heure} · {nextRdv.centreNom ?? "THOR"}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{nextRdv.type}</div>
                </div>
                <Link href="/clair-audition/espace-patient/rendez-vous" className="text-xs font-semibold text-[#00C98A] hover:underline">
                  Voir tous mes rendez-vous
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-400 mb-3">Aucun rendez-vous planifié.</p>
                <Link href="/clair-audition/espace-patient/rendez-vous"
                  className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-semibold text-white"
                  style={{ background: "#00C98A" }}>
                  Prendre RDV
                </Link>
              </div>
            )}
          </div>

          {/* Profil auditif */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Profil auditif</div>
            <div className="space-y-3">
              {[
                { label: "Type de perte", value: "Neuro-sensorielle", color: "#00C98A" },
                { label: "Configuration", value: "Descendante",       color: "#2D8CFF" },
                { label: "Dernière éval.", value: "Nov. 2024",        color: "#f59e0b" },
                { label: "Prochain contrôle", value: "Mai 2025",      color: "#64748b" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{item.label}</span>
                  <span className="text-xs font-semibold text-slate-700">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Classification OMS</div>
              <div className="space-y-1.5">
                {[
                  { label: "Normal",   db: "0–20 dB",   active: false },
                  { label: "Légère",   db: "20–40 dB",  active: false },
                  { label: "Modérée",  db: "40–60 dB",  active: true  },
                  { label: "Sévère",   db: "60–80 dB",  active: false },
                  { label: "Profonde", db: "> 80 dB",   active: false },
                ].map((z) => (
                  <div key={z.label} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg"
                    style={z.active ? { background: "rgba(0,201,138,0.10)", border: "1px solid rgba(0,201,138,0.20)" } : {}}>
                    <span className={`text-[11px] font-${z.active ? "bold" : "medium"} ${z.active ? "text-[#00956A]" : "text-slate-400"}`}>
                      {z.label}
                    </span>
                    <span className={`text-[11px] ${z.active ? "text-[#00956A]" : "text-slate-300"}`}>{z.db}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Accès rapides */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Accès rapides</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Bilans",      href: "/clair-audition/espace-patient/bilans-auditifs", Icon: IconBilan  },
                { label: "RDV",         href: "/clair-audition/espace-patient/rendez-vous",     Icon: IconRdv    },
                { label: "Ordonnances", href: "/clair-audition/espace-patient/ordonnances",     Icon: IconOrd    },
                { label: "Mon profil",  href: "/clair-audition/espace-patient/mon-profil",      Icon: IconProfil },
              ].map(({ label, href, Icon }) => (
                <Link key={label} href={href}
                  className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 py-3.5 text-center hover:border-[rgba(0,201,138,0.30)] hover:bg-[rgba(0,201,138,0.03)] transition-all">
                  <span className="text-[#00C98A]"><Icon /></span>
                  <span className="text-[11px] font-semibold text-slate-600">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* RGPD */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 flex items-start gap-2">
            <svg className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Données de santé hébergées en France, chiffrées et protégées conformément au RGPD.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
