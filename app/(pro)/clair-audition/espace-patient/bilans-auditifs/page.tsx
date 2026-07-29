"use client";

import { useState } from "react";
import Link from "next/link";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Bilan {
  id: string;
  date: string;
  dateLabel: string;
  centre: string;
  praticien: string;
  locked: boolean;
  tag?: string;
  tagColor?: string;
  commentaire: string;
  OD: (number | null)[];
  OG: (number | null)[];
  perteOD: string;
  perteOG: string;
  classOD: string;
  classOG: string;
  appareillage: string;
}

/* ─── Données ────────────────────────────────────────────────────────────── */
const FREQS = [250, 500, 1000, 2000, 4000, 8000];
const FREQ_LABELS = ["250", "500", "1k", "2k", "4k", "8k"];

const BILANS: Bilan[] = [
  {
    id: "b-001",
    date: "2024-11-12",
    dateLabel: "12 nov. 2024",
    centre: "THOR — Marseille Prado",
    praticien: "M. Rami Benali",
    locked: false,
    tag: "Récent",
    tagColor: "#00C98A",
    commentaire:
      "Perte auditive bilatérale de type neurosensoriel confirmée. Légère progression par rapport au bilan de mars 2023. Appareillage de classe 1 recommandé pour les deux oreilles. Adaptation en cours, retour satisfaisant.",
    OD: [20, 35, 50, 65, 75, 80],
    OG: [25, 40, 55, 60, 70, 85],
    perteOD: "50 dB moyen",
    perteOG: "55 dB moyen",
    classOD: "Modérée",
    classOG: "Modérée à sévère",
    appareillage: "Phonak Audéo Lumity L90 (OD + OG)",
  },
  {
    id: "b-002",
    date: "2023-03-08",
    dateLabel: "8 mars 2023",
    centre: "THOR — Marseille Prado",
    praticien: "M. Rami Benali",
    locked: true,
    tag: "Archivé",
    tagColor: "#94a3b8",
    commentaire: "Premier bilan de référence. Perte auditive légère à modérée. Appareillage non encore décidé.",
    OD: [15, 25, 40, 55, 65, 70],
    OG: [20, 30, 45, 55, 60, 75],
    perteOD: "40 dB moyen",
    perteOG: "45 dB moyen",
    classOD: "Légère à modérée",
    classOG: "Modérée",
    appareillage: "—",
  },
];

/* ─── Classification OMS ─────────────────────────────────────────────────── */
const ZONES = [
  { y1: -10, y2: 20,  label: "Normal",          fill: "rgba(22,163,74,0.06)"  },
  { y1: 20,  y2: 40,  label: "Légère",           fill: "rgba(234,179,8,0.07)"  },
  { y1: 40,  y2: 60,  label: "Modérée",          fill: "rgba(249,115,22,0.07)" },
  { y1: 60,  y2: 80,  label: "Sévère",           fill: "rgba(239,68,68,0.07)"  },
  { y1: 80,  y2: 120, label: "Profonde",         fill: "rgba(139,0,0,0.07)"    },
];

const CLASS_COLOR: Record<string, string> = {
  "Normal":             "#16A34A",
  "Légère":             "#CA8A04",
  "Légère à modérée":   "#D97706",
  "Modérée":            "#EA580C",
  "Modérée à sévère":   "#DC2626",
  "Sévère":             "#B91C1C",
  "Profonde":           "#7F1D1D",
};

/* ─── Audiogramme SVG ────────────────────────────────────────────────────── */
function Audiogram({ bilan, compare }: { bilan: Bilan; compare?: Bilan }) {
  // ViewBox très allongé — ratio ~9:1
  const VW = 1600; const VH = 180;
  const L = 32; const R = 10; const T = 12; const B = 28;
  const iW = VW - L - R; const iH = VH - T - B;

  const xi = (i: number) => L + (i / (FREQS.length - 1)) * iW;
  const ydb = (db: number) => T + (Math.max(0, Math.min(db, 100)) / 100) * iH;

  const zones = [
    { from: 0,  to: 20,  fill: "rgba(22,163,74,0.07)",  color: "#16a34a", label: "Normal"   },
    { from: 20, to: 40,  fill: "rgba(234,179,8,0.08)",  color: "#ca8a04", label: "Légère"   },
    { from: 40, to: 60,  fill: "rgba(249,115,22,0.08)", color: "#ea580c", label: "Modérée"  },
    { from: 60, to: 80,  fill: "rgba(239,68,68,0.08)",  color: "#dc2626", label: "Sévère"   },
    { from: 80, to: 100, fill: "rgba(127,29,29,0.08)",  color: "#7f1d1d", label: "Profonde" },
  ];

  const path = (vals: (number|null)[]) =>
    vals.map((v, i) => v != null ? `${i===0?"M":"L"}${xi(i).toFixed(1)},${ydb(v).toFixed(1)}` : "")
        .filter(Boolean).join(" ");

  return (
    <div className="select-none w-full">
      {/* Légende — une ligne au-dessus */}
      <div className="flex items-center justify-between mb-2 text-[11px] text-slate-500 flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <svg width="16" height="10" viewBox="0 0 16 10">
              <line x1="0" y1="5" x2="16" y2="5" stroke="#ef4444" strokeWidth="1.5"/>
              <line x1="3.5" y1="0.5" x2="12.5" y2="9.5" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="12.5" y1="0.5" x2="3.5" y2="9.5" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            OD droite
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="16" height="10" viewBox="0 0 16 10">
              <line x1="0" y1="5" x2="16" y2="5" stroke="#2D8CFF" strokeWidth="1.5"/>
              <circle cx="8" cy="5" r="3.5" stroke="#2D8CFF" strokeWidth="1.8" fill="white"/>
            </svg>
            OG gauche
          </span>
          {compare && (
            <span className="flex items-center gap-1.5 text-slate-500">
              <svg width="16" height="4" viewBox="0 0 16 4">
                <line x1="0" y1="2" x2="16" y2="2" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3,2"/>
              </svg>
              Bilan précédent
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {zones.map(z => (
            <span key={z.label} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: z.color }}/>
              {z.label}
            </span>
          ))}
        </div>
      </div>

      {/* SVG : width 100%, height auto — proportions préservées naturellement */}
      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ display: "block", width: "100%", height: "auto" }}>

        {/* Zones de fond */}
        {zones.map(z => (
          <rect key={z.label} x={L} y={ydb(z.from)} width={iW} height={ydb(z.to)-ydb(z.from)} fill={z.fill}/>
        ))}

        {/* Grille horizontale */}
        {[0, 20, 40, 60, 80, 100].map(db => (
          <g key={db}>
            <line x1={L} y1={ydb(db)} x2={L+iW} y2={ydb(db)}
                  stroke="rgba(0,0,0,0.06)" strokeWidth="0.6"
                  strokeDasharray={db === 0 ? "" : "5,4"}/>
            <text x={L-4} y={ydb(db)+3} textAnchor="end" fontSize="8" fill="#94a3b8" fontFamily="system-ui">{db}</text>
          </g>
        ))}

        {/* Grille verticale */}
        {FREQS.map((_, i) => (
          <line key={i} x1={xi(i)} y1={T} x2={xi(i)} y2={T+iH} stroke="rgba(0,0,0,0.04)" strokeWidth="0.6"/>
        ))}

        {/* Label axe Y */}
        <text x={7} y={T+iH/2} textAnchor="middle" fontSize="8" fill="#cbd5e1" fontFamily="system-ui"
              transform={`rotate(-90,7,${T+iH/2})`}>dB HL</text>

        {/* Courbes précédentes */}
        {compare && <path d={path(compare.OD)} fill="none" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="5,3" opacity="0.4" strokeLinejoin="round" strokeLinecap="round"/>}
        {compare && <path d={path(compare.OG)} fill="none" stroke="#2D8CFF" strokeWidth="0.8" strokeDasharray="5,3" opacity="0.4" strokeLinejoin="round" strokeLinecap="round"/>}

        {/* Courbes */}
        <path d={path(bilan.OD)} fill="none" stroke="#ef4444" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round"/>
        <path d={path(bilan.OG)} fill="none" stroke="#2D8CFF" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round"/>

        {/* Marqueurs OD : × rouge — petits */}
        {bilan.OD.map((v, i) => v != null && (
          <g key={`od${i}`}>
            <circle cx={xi(i)} cy={ydb(v)} r="6" fill="rgba(239,68,68,0.07)"/>
            <line x1={xi(i)-3.5} y1={ydb(v)-3.5} x2={xi(i)+3.5} y2={ydb(v)+3.5} stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round"/>
            <line x1={xi(i)+3.5} y1={ydb(v)-3.5} x2={xi(i)-3.5} y2={ydb(v)+3.5} stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round"/>
          </g>
        ))}

        {/* Marqueurs OG : ○ bleu — petits */}
        {bilan.OG.map((v, i) => v != null && (
          <g key={`og${i}`}>
            <circle cx={xi(i)} cy={ydb(v)} r="6" fill="rgba(45,140,255,0.07)"/>
            <circle cx={xi(i)} cy={ydb(v)} r="3" fill="white" stroke="#2D8CFF" strokeWidth="1.4"/>
          </g>
        ))}

        {/* Labels fréquences */}
        {FREQ_LABELS.map((l, i) => (
          <text key={l} x={xi(i)} y={VH-10} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="system-ui">{l}</text>
        ))}
        <text x={L+iW/2} y={VH-1} textAnchor="middle" fontSize="8" fill="#cbd5e1" fontFamily="system-ui">Hz</text>
      </svg>
    </div>
  );
}

/* ─── Badge classification ───────────────────────────────────────────────── */
function ClassBadge({ label }: { label: string }) {
  const color = CLASS_COLOR[label] ?? "#94a3b8";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: color + "18", color }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      {label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function BilansAuditifsPage() {
  const [selected, setSelected] = useState<string>(BILANS[0].id);
  const [compare, setCompare] = useState(false);
  const [tab, setTab] = useState<"audiogramme" | "details" | "evolution">("audiogramme");

  const bilan = BILANS.find((b) => b.id === selected)!;
  const prevBilan = BILANS.find((b) => b.id !== selected && b.date < bilan.date);

  return (
    <div className="space-y-6 pb-6">

      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Bilans auditifs</h1>
          <p className="text-sm text-slate-500 mt-1">Vos audiogrammes et résultats d&apos;examens cliniques</p>
        </div>
        <Link
          href="/clair-audition/espace-patient/rendez-vous"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-100"
          style={{ background: "#00C98A", boxShadow: "0 4px 16px rgba(0,201,138,0.3)" }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          Nouveau bilan
        </Link>
      </div>

      {/* ── Grille principale ─────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-[264px_1fr] gap-6 items-start">

        {/* ── Sidebar bilans ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 px-1">Vos bilans</div>

          {BILANS.map((b) => (
            <button
              key={b.id}
              onClick={() => { setSelected(b.id); setTab("audiogramme"); setCompare(false); }}
              className="w-full text-left rounded-2xl border p-4 transition-all duration-200"
              style={selected === b.id
                ? { borderColor: "#00C98A", background: "white", boxShadow: "0 0 0 3px rgba(0,201,138,0.12), 0 4px 16px rgba(0,0,0,0.05)" }
                : { borderColor: "#e2e8f0", background: "var(--glass-strong-bg)" }
              }
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{b.dateLabel}</span>
                {b.tag && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: (b.tagColor ?? "#94a3b8") + "18", color: b.tagColor }}>
                    {b.tag}
                  </span>
                )}
              </div>
              <div className="text-sm font-semibold text-slate-800">{b.centre}</div>
              <div className="text-xs text-slate-500 mt-0.5">{b.praticien} · Audioprothésiste</div>
              {!b.locked && (
                <div className="mt-3 flex gap-1.5 flex-wrap">
                  <ClassBadge label={b.classOD} />
                  <ClassBadge label={b.classOG} />
                </div>
              )}
              {b.locked && (
                <div className="mt-2.5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span className="text-xs text-slate-500">Déverrouiller pour consulter</span>
                </div>
              )}
            </button>
          ))}

          {/* Classification OMS */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Classification OMS</div>
            <div className="space-y-1.5">
              {ZONES.map((z) => (
                <div key={z.label} className="flex items-center gap-2 text-xs text-slate-600">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: z.fill.replace(/0\.0[67]/, "0.5") }} />
                  <span>{z.label}</span>
                  <span className="text-slate-500 ml-auto text-[10px]">{z.y1}–{z.y2 === 120 ? "120+" : z.y2} dB</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Contenu principal ─────────────────────────────────────────── */}
        <div className="space-y-4">

          {bilan.locked ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
              <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: "rgba(0,201,138,0.1)" }}>
                <svg className="w-8 h-8 text-[#00C98A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Bilan verrouillé</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto mb-6 leading-relaxed">
                Accédez à l&apos;audiogramme complet, aux résultats par fréquence et aux commentaires du praticien.
              </p>
              <Link
                href="/clair-audition/espace-patient/achats"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white"
                style={{ background: "#00C98A", boxShadow: "0 4px 16px rgba(0,201,138,0.25)" }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Déverrouiller ce bilan
              </Link>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 w-fit">
                {(["audiogramme", "details", "evolution"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={tab === t
                      ? { background: "white", color: "#1e293b", boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }
                      : { color: "#64748b" }
                    }
                  >
                    {t === "audiogramme" ? "Audiogramme" : t === "details" ? "Détails" : "Évolution"}
                  </button>
                ))}
              </div>

              {/* ── Tab Audiogramme ──────────────────────────────────── */}
              {tab === "audiogramme" && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
                  {/* En-tête compact */}
                  <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">Dernier audiogramme</div>
                      <div className="text-xs text-slate-500 mt-0.5">{bilan.dateLabel} · {bilan.centre} · {bilan.praticien}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {prevBilan && (
                        <button
                          onClick={() => setCompare(!compare)}
                          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all"
                          style={compare
                            ? { borderColor: "#00C98A", background: "rgba(0,201,138,0.08)", color: "#00C98A" }
                            : { borderColor: "#e2e8f0", color: "#94a3b8" }
                          }
                        >
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                          {compare ? "Comparaison ✓" : "Comparer"}
                        </button>
                      )}
                      <Link
                        href="#"
                        className="text-xs font-semibold transition-colors"
                        style={{ color: "#00C98A" }}
                      >
                        Voir complet →
                      </Link>
                    </div>
                  </div>

                  {/* Audiogramme pleine largeur */}
                  <Audiogram bilan={bilan} compare={compare && prevBilan ? prevBilan : undefined} />

                  {/* Résumé OD / OG en dessous */}
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    {[
                      { side: "OD", label: "Oreille droite", perte: bilan.perteOD, classe: bilan.classOD, color: "#ef4444" },
                      { side: "OG", label: "Oreille gauche", perte: bilan.perteOG, classe: bilan.classOG, color: "#2D8CFF" },
                    ].map((ear) => (
                      <div key={ear.side} className="rounded-xl border p-4 flex items-center gap-3"
                        style={{ borderColor: ear.color + "25", background: ear.color + "05" }}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: ear.color }}>
                          {ear.side}
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-500 font-medium mb-0.5">{ear.label}</div>
                          <div className="text-base font-bold text-slate-800">{ear.perte}</div>
                          <div className="mt-1"><ClassBadge label={ear.classe} /></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {compare && prevBilan && (
                    <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-500 flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                      Comparaison avec le bilan du <strong className="mx-1">{prevBilan.dateLabel}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab Détails ──────────────────────────────────────── */}
              {tab === "details" && (
                <div className="space-y-4">
                  {/* Tableau par fréquence */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
                    <div className="text-sm font-semibold text-slate-800 mb-4">Résultats par fréquence</div>
                    <div className="overflow-x-auto -mx-2 px-2">
                      <table className="w-full min-w-[420px]">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="text-left text-xs font-semibold text-slate-500 pb-3 pr-4 w-32">Oreille</th>
                            {FREQS.map((f, i) => (
                              <th key={f} className="text-center text-xs font-semibold text-slate-500 pb-3 px-2">
                                {FREQ_LABELS[i]} <span className="font-normal text-slate-500">Hz</span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { side: "OD", label: "Oreille droite", vals: bilan.OD, color: "#ef4444" },
                            { side: "OG", label: "Oreille gauche", vals: bilan.OG, color: "#2D8CFF" },
                          ].map((row) => (
                            <tr key={row.side} className="border-b border-slate-50 last:border-0">
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background: row.color }}>
                                    {row.side}
                                  </div>
                                  <span className="text-xs font-medium text-slate-600 hidden sm:inline">{row.label}</span>
                                </div>
                              </td>
                              {row.vals.map((v, i) => {
                                const db = v ?? 0;
                                const bgColor = db > 80 ? "rgba(127,29,29,0.12)" : db > 60 ? "rgba(239,68,68,0.10)" : db > 40 ? "rgba(249,115,22,0.10)" : db > 20 ? "rgba(234,179,8,0.10)" : "rgba(22,163,74,0.08)";
                                const textColor = db > 80 ? "#7F1D1D" : db > 60 ? "#B91C1C" : db > 40 ? "#C2410C" : db > 20 ? "#92400E" : "#15803D";
                                return (
                                  <td key={i} className="text-center py-3 px-1">
                                    <div className="inline-flex items-center justify-center rounded-lg text-xs font-bold w-12 h-8"
                                      style={{ background: bgColor, color: textColor }}>
                                      {v ?? "—"}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-3">Valeurs en dB HL — Seuils auditifs minimaux (voie aérienne)</p>
                  </div>

                  {/* Praticien + appareillage */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                      <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4">Praticien</div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{ background: "#00C98A" }}>
                          RB
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{bilan.praticien}</div>
                          <div className="text-xs text-slate-500">Audioprothésiste D.E.</div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">{bilan.centre}</div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                      <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4">Appareillage prescrit</div>
                      <div className="text-sm font-semibold text-slate-800 mb-3">{bilan.appareillage}</div>
                      <div className="flex gap-2 flex-wrap">
                        <ClassBadge label={bilan.classOD} />
                        <ClassBadge label={bilan.classOG} />
                      </div>
                    </div>
                  </div>

                  {/* Commentaire */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">Commentaire du praticien</div>
                    <p className="text-sm text-slate-600 leading-relaxed">{bilan.commentaire}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 flex-wrap">
                    <button onClick={() => window.print()}
                      className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold border border-slate-200 text-slate-700 bg-white hover:shadow-sm transition-all">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                      </svg>
                      Imprimer
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold border border-slate-200 text-slate-700 bg-white hover:shadow-sm transition-all">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Télécharger PDF
                    </button>
                  </div>
                </div>
              )}

              {/* ── Tab Évolution ────────────────────────────────────── */}
              {tab === "evolution" && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
                  <div className="text-sm font-semibold text-slate-800 mb-1">Évolution de la perte auditive</div>
                  <p className="text-xs text-slate-500 mb-6">Comparaison des seuils auditifs moyens sur vos bilans successifs.</p>

                  {BILANS.filter((b) => !b.locked).length < 2 ? (
                    <div className="text-center py-12 text-slate-500">
                      <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-slate-100">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                      </div>
                      <p className="text-sm">Déverrouillez plus de bilans pour voir l&apos;évolution dans le temps.</p>
                      <Link href="/clair-audition/espace-patient/achats" className="mt-4 inline-block text-sm font-semibold text-[#00C98A] hover:underline">
                        Accéder à mes bilans archivés →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {BILANS.filter((b) => !b.locked).map((b) => (
                        <button
                          key={b.id}
                          onClick={() => { setSelected(b.id); setTab("audiogramme"); }}
                          className="w-full text-left rounded-xl border border-slate-100 p-4 hover:border-slate-200 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <div className="text-xs font-semibold text-slate-600">{b.dateLabel}</div>
                            <div className="flex gap-2">
                              <ClassBadge label={b.classOD} />
                              <ClassBadge label={b.classOG} />
                            </div>
                          </div>
                          {/* Visualisation en barres */}
                          <div className="flex gap-1 items-end h-14">
                            {FREQS.map((_, i) => {
                              const odVal = b.OD[i] ?? 0;
                              const ogVal = b.OG[i] ?? 0;
                              return (
                                <div key={i} className="flex-1 flex gap-0.5 items-end h-full">
                                  <div className="flex-1 rounded-t-sm" style={{ height: `${(odVal / 120) * 100}%`, background: "rgba(239,68,68,0.25)", borderTop: "2px solid #ef4444" }} />
                                  <div className="flex-1 rounded-t-sm" style={{ height: `${(ogVal / 120) * 100}%`, background: "rgba(45,140,255,0.2)", borderTop: "2px solid #2D8CFF" }} />
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex gap-1 mt-1.5">
                            {FREQ_LABELS.map((l) => <div key={l} className="flex-1 text-center text-[9px] text-slate-500">{l}</div>)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
