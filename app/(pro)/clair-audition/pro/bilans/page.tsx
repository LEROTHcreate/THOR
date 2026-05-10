"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

/* ── Glass tokens ─────────────────────────────────────────────────────────── */
const glass: CSSProperties = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--glass-border)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
};
const glassSubtle: CSSProperties = {
  background: "var(--glass-subtle-bg)",
  border: "1px solid var(--glass-subtle-border)",
};

/* ── Data model ───────────────────────────────────────────────────────────── */
type FreqHz = 250 | 500 | 1000 | 2000 | 3000 | 4000 | 6000 | 8000;
type PerteType = "normal" | "légère" | "moyenne" | "sévère" | "profonde";
type BilanStatus = "Terminé" | "En cours" | "À compléter";

interface FreqMesure {
  freq: FreqHz;
  od: number | null;
  og: number | null;
}

interface BilanAuditif {
  id: string;
  numero: string;
  patientNom: string;
  patientPrenom: string;
  dateNaissance?: string;
  dateBilan: string;
  prescripteur: string;
  rpps?: string;
  typePerteOD: PerteType;
  typePerteOG: PerteType;
  mesures: FreqMesure[];
  intelligibiliteOD?: number;
  intelligibiliteOG?: number;
  remarques?: string;
  status: BilanStatus;
  createdAt: string;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const STORAGE_KEY = "thor_pro_audition_bilans";
const FREQS: FreqHz[] = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];

function classifyLoss(dbAvg: number): PerteType {
  if (dbAvg <= 20) return "normal";
  if (dbAvg <= 40) return "légère";
  if (dbAvg <= 70) return "moyenne";
  if (dbAvg <= 90) return "sévère";
  return "profonde";
}

function computeLossFromMesures(mesures: FreqMesure[], ear: "od" | "og"): PerteType {
  const vals = mesures.map(m => m[ear]).filter((v): v is number => v !== null);
  if (vals.length === 0) return "normal";
  return classifyLoss(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function loadBilans(): BilanAuditif[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BilanAuditif[]) : [];
  } catch {
    return [];
  }
}

function saveBilans(list: BilanAuditif[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function generateNumero(list: BilanAuditif[]): string {
  const year = new Date().getFullYear();
  const existing = list.filter(b => b.numero.startsWith(`BIL-${year}-`));
  return `BIL-${year}-${String(existing.length + 1).padStart(3, "0")}`;
}

function formatDateFR(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

/* ── Mock data ────────────────────────────────────────────────────────────── */
const MOCK_BILANS: BilanAuditif[] = [
  {
    id: "mock-1", numero: "BIL-2025-001",
    patientNom: "Moreau", patientPrenom: "Jean-Paul", dateNaissance: "1953-04-12",
    dateBilan: "2025-01-15", prescripteur: "Dr. Aubert", rpps: "10012345",
    typePerteOD: "sévère", typePerteOG: "sévère",
    mesures: [
      { freq: 250, od: 35, og: 38 }, { freq: 500, od: 42, og: 45 },
      { freq: 1000, od: 55, og: 58 }, { freq: 2000, od: 62, og: 65 },
      { freq: 3000, od: 68, og: 70 }, { freq: 4000, od: 72, og: 75 },
      { freq: 6000, od: 78, og: 80 }, { freq: 8000, od: 82, og: 85 },
    ],
    intelligibiliteOD: 62, intelligibiliteOG: 58,
    remarques: "Presbyacousie bilatérale. Appareillage recommandé.",
    status: "Terminé", createdAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "mock-2", numero: "BIL-2025-002",
    patientNom: "Lefranc", patientPrenom: "Simone", dateNaissance: "1957-09-22",
    dateBilan: "2025-01-22", prescripteur: "Dr. Martin",
    typePerteOD: "moyenne", typePerteOG: "sévère",
    mesures: [
      { freq: 250, od: 25, og: 28 }, { freq: 500, od: 32, og: 35 },
      { freq: 1000, od: 48, og: 50 }, { freq: 2000, od: 55, og: 58 },
      { freq: 3000, od: 60, og: 62 }, { freq: 4000, od: 65, og: 68 },
      { freq: 6000, od: 70, og: 72 }, { freq: 8000, od: 72, og: 75 },
    ],
    intelligibiliteOD: 78, intelligibiliteOG: 72,
    status: "Terminé", createdAt: "2025-01-22T14:00:00Z",
  },
  {
    id: "mock-3", numero: "BIL-2025-003",
    patientNom: "Bernin", patientPrenom: "André", dateNaissance: "1950-02-07",
    dateBilan: "2025-02-28", prescripteur: "Dr. Aubert",
    typePerteOD: "sévère", typePerteOG: "profonde",
    mesures: [
      { freq: 250, od: 30, og: 32 }, { freq: 500, od: 45, og: 48 },
      { freq: 1000, od: 60, og: 62 }, { freq: 2000, od: 70, og: 72 },
      { freq: 3000, od: 75, og: 78 }, { freq: 4000, od: 80, og: 82 },
      { freq: 6000, od: 88, og: 90 }, { freq: 8000, od: 90, og: 92 },
    ],
    intelligibiliteOD: 48, intelligibiliteOG: 40,
    remarques: "Perte sévère à profonde. Orientation vers ORL recommandée.",
    status: "Terminé", createdAt: "2025-02-28T09:00:00Z",
  },
  {
    id: "mock-4", numero: "BIL-2025-004",
    patientNom: "Dupont", patientPrenom: "Marie", dateNaissance: "1967-11-30",
    dateBilan: "2025-03-10", prescripteur: "Dr. Martin",
    typePerteOD: "légère", typePerteOG: "légère",
    mesures: [],
    status: "À compléter", createdAt: "2025-03-10T16:00:00Z",
  },
];

/* ── Badge helpers ────────────────────────────────────────────────────────── */
const PERTE_COLORS: Record<PerteType, string> = {
  normal:   "bg-emerald-50 text-emerald-700 ring-emerald-200",
  légère:   "bg-yellow-50 text-yellow-700 ring-yellow-200",
  moyenne:  "bg-amber-50 text-amber-700 ring-amber-200",
  sévère:   "bg-orange-50 text-orange-700 ring-orange-200",
  profonde: "bg-red-50 text-red-700 ring-red-200",
};

const STATUS_COLORS: Record<BilanStatus, string> = {
  "Terminé":       "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "En cours":      "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "À compléter":   "bg-amber-50 text-amber-700 ring-amber-200",
};

function PerteBadge({ type, label }: { type: PerteType; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${PERTE_COLORS[type]}`}>
      <span className="text-[10px] font-bold uppercase text-slate-400">{label}</span>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}

/* ── SVG Audiogram ────────────────────────────────────────────────────────── */
function Audiogram({ mesures }: { mesures: FreqMesure[] }) {
  const W = 480;
  const H = 300;
  const padL = 52;
  const padR = 16;
  const padT = 16;
  const padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const DB_MIN = 0;
  const DB_MAX = 120;
  const DB_LABELS = [0, 20, 40, 60, 80, 100, 120];

  function xFor(freq: number): number {
    const idx = FREQS.indexOf(freq as FreqHz);
    if (idx === -1) return 0;
    return padL + (idx / (FREQS.length - 1)) * chartW;
  }

  function yFor(db: number): number {
    return padT + ((db - DB_MIN) / (DB_MAX - DB_MIN)) * chartH;
  }

  const odPoints = mesures.filter(m => m.od !== null).map(m => ({ x: xFor(m.freq), y: yFor(m.od!), db: m.od! }));
  const ogPoints = mesures.filter(m => m.og !== null).map(m => ({ x: xFor(m.freq), y: yFor(m.og!), db: m.og! }));

  function polyline(pts: { x: number; y: number }[]): string {
    return pts.map(p => `${p.x},${p.y}`).join(" ");
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, height: "auto" }} aria-label="Audiogramme">
      {/* Grid lines */}
      {DB_LABELS.map(db => (
        <line key={db} x1={padL} x2={W - padR} y1={yFor(db)} y2={yFor(db)}
          stroke={db === 0 ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.07)"} strokeWidth="1" />
      ))}
      {FREQS.map(f => (
        <line key={f} x1={xFor(f)} x2={xFor(f)} y1={padT} y2={H - padB}
          stroke="rgba(0,0,0,0.07)" strokeWidth="1" />
      ))}

      {/* Normal range shading (0-20dB) */}
      <rect x={padL} y={yFor(0)} width={chartW} height={yFor(20) - yFor(0)}
        fill="rgba(16,185,129,0.06)" />

      {/* Y-axis labels */}
      {DB_LABELS.map(db => (
        <text key={db} x={padL - 8} y={yFor(db) + 4} textAnchor="end"
          fontSize="10" fill="rgba(0,0,0,0.45)" fontFamily="system-ui">
          {db}
        </text>
      ))}
      <text x={10} y={padT + chartH / 2} textAnchor="middle" fontSize="10"
        fill="rgba(0,0,0,0.4)" fontFamily="system-ui"
        transform={`rotate(-90, 10, ${padT + chartH / 2})`}>
        dB HL
      </text>

      {/* X-axis labels */}
      {FREQS.map(f => (
        <text key={f} x={xFor(f)} y={H - padB + 16} textAnchor="middle"
          fontSize="10" fill="rgba(0,0,0,0.45)" fontFamily="system-ui">
          {f >= 1000 ? `${f / 1000}k` : f}
        </text>
      ))}
      <text x={padL + chartW / 2} y={H - 2} textAnchor="middle" fontSize="10"
        fill="rgba(0,0,0,0.4)" fontFamily="system-ui">
        Hz
      </text>

      {/* OD line + X markers (red) */}
      {odPoints.length > 1 && (
        <polyline points={polyline(odPoints)} fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="none" />
      )}
      {odPoints.map((p, i) => (
        <g key={i}>
          <line x1={p.x - 6} y1={p.y - 6} x2={p.x + 6} y2={p.y + 6} stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
          <line x1={p.x + 6} y1={p.y - 6} x2={p.x - 6} y2={p.y + 6} stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      ))}

      {/* OG line + O markers (blue) */}
      {ogPoints.length > 1 && (
        <polyline points={polyline(ogPoints)} fill="none" stroke="#3b82f6" strokeWidth="2" />
      )}
      {ogPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="6" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
      ))}

      {/* Legend */}
      <g transform={`translate(${padL + 10}, ${padT + 8})`}>
        <line x1="0" y1="0" x2="18" y2="0" stroke="#ef4444" strokeWidth="2" />
        <line x1="6" y1="-4" x2="12" y2="4" stroke="#ef4444" strokeWidth="2" />
        <line x1="12" y1="-4" x2="6" y2="4" stroke="#ef4444" strokeWidth="2" />
        <text x="24" y="4" fontSize="10" fill="rgba(0,0,0,0.6)" fontFamily="system-ui">OD</text>
        <line x1="50" y1="0" x2="68" y2="0" stroke="#3b82f6" strokeWidth="2" />
        <circle cx="59" cy="0" r="5" fill="none" stroke="#3b82f6" strokeWidth="2" />
        <text x="74" y="4" fontSize="10" fill="rgba(0,0,0,0.6)" fontFamily="system-ui">OG</text>
      </g>
    </svg>
  );
}

/* ── Interactive Audiogram ────────────────────────────────────────────────── */
function InteractiveAudiogram({
  mesures,
  onChange,
}: {
  mesures: Record<FreqHz, { od: string; og: string }>;
  onChange: (freq: FreqHz, ear: "od" | "og", db: string) => void;
}) {
  const [activeEar, setActiveEar] = useState<"od" | "og">("od");
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 480, H = 300;
  const padL = 52, padR = 16, padT = 28, padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const DB_MIN = 0, DB_MAX = 120;
  const DB_LABELS = [0, 20, 40, 60, 80, 100, 120];

  function xFor(freq: number) {
    const idx = FREQS.indexOf(freq as FreqHz);
    return padL + (idx / (FREQS.length - 1)) * chartW;
  }
  function yFor(db: number) {
    return padT + ((db - DB_MIN) / (DB_MAX - DB_MIN)) * chartH;
  }

  function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    // Find nearest freq column
    let bestFreq: FreqHz = FREQS[0];
    let bestDist = Infinity;
    for (const f of FREQS) {
      const d = Math.abs(xFor(f) - mx);
      if (d < bestDist) { bestDist = d; bestFreq = f; }
    }
    if (bestDist > chartW / FREQS.length) return; // too far from any column

    // Compute dB from y
    const db = Math.round(((my - padT) / chartH) * (DB_MAX - DB_MIN) + DB_MIN);
    const clamped = Math.max(0, Math.min(120, db));

    // Check if clicking existing point → remove it
    const existing = mesures[bestFreq][activeEar];
    if (existing !== "" && Math.abs(Number(existing) - clamped) <= 8) {
      onChange(bestFreq, activeEar, "");
    } else {
      onChange(bestFreq, activeEar, String(clamped));
    }
  }

  const odPoints = FREQS.map(f => {
    const v = mesures[f].od;
    return v !== "" ? { x: xFor(f), y: yFor(Number(v)), db: Number(v), freq: f } : null;
  }).filter(Boolean) as { x: number; y: number; db: number; freq: FreqHz }[];

  const ogPoints = FREQS.map(f => {
    const v = mesures[f].og;
    return v !== "" ? { x: xFor(f), y: yFor(Number(v)), db: Number(v), freq: f } : null;
  }).filter(Boolean) as { x: number; y: number; db: number; freq: FreqHz }[];

  function polyline(pts: { x: number; y: number }[]) {
    return pts.map(p => `${p.x},${p.y}`).join(" ");
  }

  return (
    <div className="space-y-3">
      {/* Ear selector */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Saisir :</span>
        <button
          type="button"
          onClick={() => setActiveEar("od")}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all"
          style={activeEar === "od"
            ? { background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1.5px solid rgba(239,68,68,0.4)" }
            : { background: "var(--glass-subtle-bg)", color: "#94a3b8", border: "1px solid var(--glass-subtle-border)" }}>
          OD (droite)
        </button>
        <button
          type="button"
          onClick={() => setActiveEar("og")}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all"
          style={activeEar === "og"
            ? { background: "rgba(59,130,246,0.12)", color: "#3b82f6", border: "1.5px solid rgba(59,130,246,0.4)" }
            : { background: "var(--glass-subtle-bg)", color: "#94a3b8", border: "1px solid var(--glass-subtle-border)" }}>
          <span>○</span> OG (gauche)
        </button>
        <span className="ml-auto text-[10px] text-slate-400 italic">Cliquez sur le graphe pour placer/effacer un point</span>
      </div>

      {/* Interactive SVG */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", maxWidth: W, height: "auto", cursor: "crosshair" }}
        onClick={handleSvgClick}
        aria-label="Audiogramme interactif"
      >
        {/* Frequency zone highlights on hover */}
        {FREQS.map((f, i) => {
          const x = xFor(f);
          const zoneW = i === 0 ? (xFor(FREQS[1]) - x) / 2 : i === FREQS.length - 1
            ? (x - xFor(FREQS[i - 1])) / 2
            : (xFor(FREQS[i + 1]) - xFor(FREQS[i - 1])) / 2;
          const zoneX = i === 0 ? x : x - zoneW / 2;
          return (
            <rect key={f} x={zoneX} y={padT} width={zoneW} height={chartH}
              fill="transparent" className="hover:fill-slate-100/50" style={{ transition: "fill 0.1s" }} />
          );
        })}

        {/* Grid */}
        {DB_LABELS.map(db => (
          <line key={db} x1={padL} x2={W - padR} y1={yFor(db)} y2={yFor(db)}
            stroke={db === 0 ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.07)"} strokeWidth="1" />
        ))}
        {FREQS.map(f => (
          <line key={f} x1={xFor(f)} x2={xFor(f)} y1={padT} y2={H - padB}
            stroke="rgba(0,0,0,0.07)" strokeWidth="1" />
        ))}

        {/* Normal range */}
        <rect x={padL} y={yFor(0)} width={chartW} height={yFor(20) - yFor(0)} fill="rgba(16,185,129,0.06)" />

        {/* Active ear guide */}
        <text x={padL + chartW / 2} y={padT - 8} textAnchor="middle" fontSize="10.5"
          fill={activeEar === "od" ? "rgba(239,68,68,0.7)" : "rgba(59,130,246,0.7)"}
          fontFamily="system-ui" fontWeight="600">
          Saisie active : {activeEar === "od" ? "OD (rouge)" : "OG (bleu)"}
        </text>

        {/* Y labels */}
        {DB_LABELS.map(db => (
          <text key={db} x={padL - 8} y={yFor(db) + 4} textAnchor="end"
            fontSize="10" fill="rgba(0,0,0,0.45)" fontFamily="system-ui">{db}</text>
        ))}
        <text x={10} y={padT + chartH / 2} textAnchor="middle" fontSize="10"
          fill="rgba(0,0,0,0.4)" fontFamily="system-ui"
          transform={`rotate(-90, 10, ${padT + chartH / 2})`}>dB HL</text>

        {/* X labels */}
        {FREQS.map(f => (
          <text key={f} x={xFor(f)} y={H - padB + 16} textAnchor="middle"
            fontSize="10" fill="rgba(0,0,0,0.45)" fontFamily="system-ui">
            {f >= 1000 ? `${f / 1000}k` : f}
          </text>
        ))}
        <text x={padL + chartW / 2} y={H - 2} textAnchor="middle" fontSize="10"
          fill="rgba(0,0,0,0.4)" fontFamily="system-ui">Hz</text>

        {/* OD line + X markers */}
        {odPoints.length > 1 && (
          <polyline points={polyline(odPoints)} fill="none" stroke="#ef4444" strokeWidth="2" />
        )}
        {odPoints.map((p, i) => (
          <g key={i} style={{ cursor: "pointer" }}>
            <circle cx={p.x} cy={p.y} r="10" fill="transparent" />
            <line x1={p.x - 6} y1={p.y - 6} x2={p.x + 6} y2={p.y + 6} stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
            <line x1={p.x + 6} y1={p.y - 6} x2={p.x - 6} y2={p.y + 6} stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
            <text x={p.x + 8} y={p.y - 4} fontSize="9" fill="#ef4444" fontFamily="system-ui">{p.db}</text>
          </g>
        ))}

        {/* OG line + O markers */}
        {ogPoints.length > 1 && (
          <polyline points={polyline(ogPoints)} fill="none" stroke="#3b82f6" strokeWidth="2" />
        )}
        {ogPoints.map((p, i) => (
          <g key={i} style={{ cursor: "pointer" }}>
            <circle cx={p.x} cy={p.y} r="6" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
            <text x={p.x + 10} y={p.y + 4} fontSize="9" fill="#3b82f6" fontFamily="system-ui">{p.db}</text>
          </g>
        ))}

        {/* Legend */}
        <g transform={`translate(${padL + 10}, ${padT + 10})`}>
          <line x1="0" y1="0" x2="18" y2="0" stroke="#ef4444" strokeWidth="2" />
          <line x1="6" y1="-4" x2="12" y2="4" stroke="#ef4444" strokeWidth="2" />
          <line x1="12" y1="-4" x2="6" y2="4" stroke="#ef4444" strokeWidth="2" />
          <text x="24" y="4" fontSize="10" fill="rgba(0,0,0,0.6)" fontFamily="system-ui">OD</text>
          <line x1="50" y1="0" x2="68" y2="0" stroke="#3b82f6" strokeWidth="2" />
          <circle cx="59" cy="0" r="5" fill="none" stroke="#3b82f6" strokeWidth="2" />
          <text x="74" y="4" fontSize="10" fill="rgba(0,0,0,0.6)" fontFamily="system-ui">OG</text>
        </g>
      </svg>
    </div>
  );
}

/* ── Intelligibilité bar ─────────────────────────────────────────────────── */
function IntelliBar({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="font-semibold text-slate-600">{label}</span>
        <span className="font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

/* ── Detail modal ─────────────────────────────────────────────────────────── */
function DetailModal({ bilan, onClose, onUpdate }: {
  bilan: BilanAuditif;
  onClose: () => void;
  onUpdate?: (updated: BilanAuditif) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editMesures, setEditMesures] = useState<Record<FreqHz, { od: string; og: string }>>(
    Object.fromEntries(FREQS.map(f => {
      const m = bilan.mesures.find(x => x.freq === f);
      return [f, { od: m?.od !== null && m?.od !== undefined ? String(m.od) : "", og: m?.og !== null && m?.og !== undefined ? String(m.og) : "" }];
    })) as Record<FreqHz, { od: string; og: string }>
  );
  const [editIntelliOD, setEditIntelliOD] = useState(bilan.intelligibiliteOD !== undefined ? String(bilan.intelligibiliteOD) : "");
  const [editIntelliOG, setEditIntelliOG] = useState(bilan.intelligibiliteOG !== undefined ? String(bilan.intelligibiliteOG) : "");
  const [editRemarques, setEditRemarques] = useState(bilan.remarques ?? "");

  const ageStr = bilan.dateNaissance
    ? String(new Date().getFullYear() - new Date(bilan.dateNaissance).getFullYear()) + " ans"
    : "";

  function handleSaveEdit() {
    const mesures: FreqMesure[] = FREQS.map(f => ({
      freq: f,
      od: editMesures[f].od !== "" ? Number(editMesures[f].od) : null,
      og: editMesures[f].og !== "" ? Number(editMesures[f].og) : null,
    })).filter(m => m.od !== null || m.og !== null);
    const updated: BilanAuditif = {
      ...bilan,
      mesures,
      typePerteOD: computeLossFromMesures(mesures, "od"),
      typePerteOG: computeLossFromMesures(mesures, "og"),
      intelligibiliteOD: editIntelliOD !== "" ? Number(editIntelliOD) : undefined,
      intelligibiliteOG: editIntelliOG !== "" ? Number(editIntelliOG) : undefined,
      remarques: editRemarques.trim() || undefined,
      status: mesures.length > 0 ? "Terminé" : "À compléter",
    };
    onUpdate?.(updated);
    onClose();
  }

  const inputCls = "w-full rounded-lg border border-slate-200/80 bg-white/70 px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00C98A]/40 transition-all text-center";
  const labelCls = "block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 space-y-5"
        style={glass}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-[#00C98A] uppercase tracking-widest">{bilan.numero}</div>
            <h2 className="text-lg font-semibold text-slate-800 mt-0.5">
              {bilan.patientPrenom} {bilan.patientNom}
              {ageStr && <span className="ml-2 text-sm font-normal text-slate-500">{ageStr}</span>}
            </h2>
            <div className="text-sm text-slate-500 mt-0.5">
              {formatDateFR(bilan.dateBilan)} — {bilan.prescripteur}
              {bilan.rpps && <span className="ml-2 text-xs text-slate-400">RPPS: {bilan.rpps}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {onUpdate && !editing && (
              <button onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#00C98A] transition-all hover:bg-emerald-50"
                style={glassSubtle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Modifier
              </button>
            )}
            <button onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              style={glassSubtle}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── MODE LECTURE ── */}
        {!editing && (
          <>
            {bilan.mesures.length > 0 && (
              <div className="rounded-xl p-4" style={glassSubtle}>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Audiogramme tonal</div>
                <Audiogram mesures={bilan.mesures} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl p-4 space-y-2" style={glassSubtle}>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Type de perte</div>
                <div className="flex flex-col gap-2">
                  <PerteBadge type={bilan.typePerteOD} label="OD" />
                  <PerteBadge type={bilan.typePerteOG} label="OG" />
                </div>
              </div>
              <div className="rounded-xl p-4 space-y-3" style={glassSubtle}>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Intelligibilité</div>
                {bilan.intelligibiliteOD !== undefined
                  ? <IntelliBar value={bilan.intelligibiliteOD} label="OD" color="#ef4444" />
                  : <p className="text-[11px] text-slate-400">OD — non renseigné</p>}
                {bilan.intelligibiliteOG !== undefined
                  ? <IntelliBar value={bilan.intelligibiliteOG} label="OG" color="#3b82f6" />
                  : <p className="text-[11px] text-slate-400">OG — non renseigné</p>}
              </div>
            </div>
            {bilan.remarques && (
              <div className="rounded-xl p-4" style={glassSubtle}>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Remarques</div>
                <p className="text-sm text-slate-700">{bilan.remarques}</p>
              </div>
            )}
          </>
        )}

        {/* ── MODE ÉDITION ── */}
        {editing && (
          <>
            {/* Audiogramme interactif */}
            <div className="rounded-xl p-4" style={glassSubtle}>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Seuils auditifs (dB HL)</div>
              <InteractiveAudiogram
                mesures={editMesures}
                onChange={(freq, ear, db) =>
                  setEditMesures(prev => ({ ...prev, [freq]: { ...prev[freq], [ear]: db } }))
                }
              />
              {/* Compact numeric inputs for precision editing */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-center text-sm">
                  <thead>
                    <tr>
                      <th className="text-[10px] font-semibold text-slate-400 pb-2 pr-2 text-left">Oreille</th>
                      {FREQS.map(f => (
                        <th key={f} className="text-[10px] font-semibold text-slate-400 pb-2 px-1">
                          {f >= 1000 ? `${f/1000}k` : f}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(["od", "og"] as const).map(ear => (
                      <tr key={ear}>
                        <td className="pr-2 py-1">
                          <span className={`text-[11px] font-bold ${ear === "od" ? "text-red-500" : "text-blue-500"}`}>
                            {ear.toUpperCase()}
                          </span>
                        </td>
                        {FREQS.map(f => (
                          <td key={f} className="px-1 py-1">
                            <input
                              type="number" min={0} max={120}
                              value={editMesures[f][ear]}
                              onChange={e => setEditMesures(prev => ({ ...prev, [f]: { ...prev[f], [ear]: e.target.value } }))}
                              className={inputCls}
                              style={{ width: 52 }}
                              placeholder="—"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Intelligibilité */}
            <div className="rounded-xl p-4 grid grid-cols-2 gap-3" style={glassSubtle}>
              <div>
                <label className={labelCls}>Intelligibilité OD (%)</label>
                <input type="number" min={0} max={100} value={editIntelliOD}
                  onChange={e => setEditIntelliOD(e.target.value)}
                  className={inputCls.replace("text-center","")} placeholder="ex: 72" />
              </div>
              <div>
                <label className={labelCls}>Intelligibilité OG (%)</label>
                <input type="number" min={0} max={100} value={editIntelliOG}
                  onChange={e => setEditIntelliOG(e.target.value)}
                  className={inputCls.replace("text-center","")} placeholder="ex: 68" />
              </div>
            </div>

            {/* Remarques */}
            <div>
              <label className={labelCls}>Remarques</label>
              <textarea value={editRemarques} onChange={e => setEditRemarques(e.target.value)}
                rows={3} className={inputCls.replace("text-center","") + " resize-none"} placeholder="Observations cliniques..." />
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 transition-colors"
                style={glassSubtle}>
                Annuler
              </button>
              <button type="button" onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "#00C98A", boxShadow: "0 2px 8px rgba(0,201,138,0.3)" }}>
                Enregistrer les modifications
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Nouveau bilan modal ─────────────────────────────────────────────────── */
interface NewBilanForm {
  patientNom: string;
  patientPrenom: string;
  dateNaissance: string;
  dateBilan: string;
  prescripteur: string;
  rpps: string;
  mesures: Record<FreqHz, { od: string; og: string }>;
  intelligibiliteOD: string;
  intelligibiliteOG: string;
  remarques: string;
}

function defaultMesures(): Record<FreqHz, { od: string; og: string }> {
  return Object.fromEntries(FREQS.map(f => [f, { od: "", og: "" }])) as Record<FreqHz, { od: string; og: string }>;
}

function NouveauBilanModal({ onClose, onSave }: { onClose: () => void; onSave: (b: BilanAuditif) => void }) {
  const [form, setForm] = useState<NewBilanForm>({
    patientNom: "", patientPrenom: "", dateNaissance: "",
    dateBilan: new Date().toISOString().split("T")[0],
    prescripteur: "", rpps: "",
    mesures: defaultMesures(),
    intelligibiliteOD: "", intelligibiliteOG: "",
    remarques: "",
  });
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError,   setOcrError]   = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const patients = useRef<{ nom: string; prenom: string }[]>([]);
  const [nameSuggestions, setNameSuggestions] = useState<{ nom: string; prenom: string }[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("thor_pro_audition_patients");
      if (raw) patients.current = JSON.parse(raw) as { nom: string; prenom: string }[];
    } catch { /* ignore */ }
  }, []);

  function handlePatientInput(field: "patientNom" | "patientPrenom", val: string) {
    setForm(f => ({ ...f, [field]: val }));
    if (val.length >= 2) {
      const q = val.toLowerCase();
      setNameSuggestions(
        patients.current
          .filter(p => (field === "patientNom" ? p.nom : p.prenom).toLowerCase().startsWith(q))
          .slice(0, 5)
      );
    } else {
      setNameSuggestions([]);
    }
  }

  function handleMesure(freq: FreqHz, ear: "od" | "og", val: string) {
    setForm(f => ({ ...f, mesures: { ...f.mesures, [freq]: { ...f.mesures[freq], [ear]: val } } }));
  }

  async function handleOcrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    setOcrError(null);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/audiogram-ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const json = await res.json() as { mesures?: Record<string, { od: string; og: string }>; error?: string };
      if (!res.ok || json.error) {
        setOcrError(json.error ?? "Erreur analyse");
      } else if (json.mesures) {
        setForm(f => ({ ...f, mesures: { ...f.mesures, ...json.mesures } as Record<FreqHz, { od: string; og: string }> }));
      }
    } catch {
      setOcrError("Erreur réseau");
    } finally {
      setOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const existing = loadBilans();
    const mesures: FreqMesure[] = FREQS.map(freq => ({
      freq,
      od: form.mesures[freq].od !== "" ? Number(form.mesures[freq].od) : null,
      og: form.mesures[freq].og !== "" ? Number(form.mesures[freq].og) : null,
    }));
    const validMesures = mesures.filter(m => m.od !== null || m.og !== null);
    const bilan: BilanAuditif = {
      id: `bil-${Date.now()}`,
      numero: generateNumero(existing),
      patientNom: form.patientNom,
      patientPrenom: form.patientPrenom,
      dateNaissance: form.dateNaissance || undefined,
      dateBilan: form.dateBilan,
      prescripteur: form.prescripteur,
      rpps: form.rpps || undefined,
      typePerteOD: computeLossFromMesures(validMesures, "od"),
      typePerteOG: computeLossFromMesures(validMesures, "og"),
      mesures: validMesures,
      intelligibiliteOD: form.intelligibiliteOD !== "" ? Number(form.intelligibiliteOD) : undefined,
      intelligibiliteOG: form.intelligibiliteOG !== "" ? Number(form.intelligibiliteOG) : undefined,
      remarques: form.remarques || undefined,
      status: validMesures.length > 0 ? "Terminé" : "À compléter",
      createdAt: new Date().toISOString(),
    };
    onSave(bilan);
  }

  const inputCls = "w-full rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C98A]/30 focus:border-[#00C98A]/60 transition-all";
  const labelCls = "block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6"
        style={glass}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-800">Nouveau bilan auditif</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:text-slate-600" style={glassSubtle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Patient */}
          <div className="rounded-xl p-4 space-y-3" style={glassSubtle}>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Patient</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <label className={labelCls}>Nom</label>
                <input required value={form.patientNom} onChange={e => handlePatientInput("patientNom", e.target.value)}
                  className={inputCls} placeholder="Moreau" />
                {nameSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 z-10 w-full rounded-xl mt-1 overflow-hidden shadow-lg" style={glass}>
                    {nameSuggestions.map((s, i) => (
                      <button key={i} type="button" className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-emerald-50 transition-colors"
                        onClick={() => { setForm(f => ({ ...f, patientNom: s.nom, patientPrenom: s.prenom })); setNameSuggestions([]); }}>
                        {s.prenom} {s.nom}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>Prénom</label>
                <input value={form.patientPrenom} onChange={e => handlePatientInput("patientPrenom", e.target.value)}
                  className={inputCls} placeholder="Jean-Paul" />
              </div>
              <div>
                <label className={labelCls}>Date de naissance</label>
                <input type="date" value={form.dateNaissance} onChange={e => setForm(f => ({ ...f, dateNaissance: e.target.value }))}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Date du bilan</label>
                <input required type="date" value={form.dateBilan} onChange={e => setForm(f => ({ ...f, dateBilan: e.target.value }))}
                  className={inputCls} />
              </div>
            </div>
          </div>

          {/* Prescripteur */}
          <div className="rounded-xl p-4 space-y-3" style={glassSubtle}>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Prescripteur</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nom du prescripteur</label>
                <input required value={form.prescripteur} onChange={e => setForm(f => ({ ...f, prescripteur: e.target.value }))}
                  className={inputCls} placeholder="Dr. Aubert" />
              </div>
              <div>
                <label className={labelCls}>RPPS (optionnel)</label>
                <input value={form.rpps} onChange={e => setForm(f => ({ ...f, rpps: e.target.value }))}
                  className={inputCls} placeholder="10012345" />
              </div>
            </div>
          </div>

          {/* Mesures */}
          <div className="rounded-xl p-4" style={glassSubtle}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Seuils auditifs (dB HL)</div>
              <div className="flex items-center gap-2">
                {ocrError && <span className="text-[11px] text-red-500">{ocrError}</span>}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleOcrUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={ocrLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "#00C98A", boxShadow: "0 2px 6px rgba(0,201,138,.25)" }}
                >
                  {ocrLoading ? (
                    <>
                      <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" /></svg>
                      Analyse…
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Importer depuis photo
                    </>
                  )}
                </button>
              </div>
            </div>
            <InteractiveAudiogram
              mesures={form.mesures}
              onChange={(freq, ear, val) => handleMesure(freq, ear, val)}
            />
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-[11px] font-bold text-slate-500 pb-2 pr-4">Fréq. (Hz)</th>
                    {FREQS.map(f => (
                      <th key={f} className="text-center text-[11px] font-bold text-slate-500 pb-2 px-1 min-w-[52px]">
                        {f >= 1000 ? `${f / 1000}k` : f}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(["od", "og"] as const).map(ear => (
                    <tr key={ear}>
                      <td className="text-[11px] font-bold pr-4 py-1.5" style={{ color: ear === "od" ? "#ef4444" : "#3b82f6" }}>
                        {ear.toUpperCase()}
                      </td>
                      {FREQS.map(freq => (
                        <td key={freq} className="px-1 py-1.5">
                          <input
                            type="number" min={0} max={120}
                            value={form.mesures[freq][ear]}
                            onChange={e => handleMesure(freq, ear, e.target.value)}
                            className="w-12 rounded-lg border border-slate-200/80 bg-white/70 px-1.5 py-1 text-[12px] text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00C98A]/30"
                            placeholder="—"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Intelligibilité */}
          <div className="rounded-xl p-4 space-y-3" style={glassSubtle}>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Intelligibilité vocale (%) — optionnel</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>OD (%)</label>
                <input type="number" min={0} max={100} value={form.intelligibiliteOD}
                  onChange={e => setForm(f => ({ ...f, intelligibiliteOD: e.target.value }))}
                  className={inputCls} placeholder="ex: 72" />
              </div>
              <div>
                <label className={labelCls}>OG (%)</label>
                <input type="number" min={0} max={100} value={form.intelligibiliteOG}
                  onChange={e => setForm(f => ({ ...f, intelligibiliteOG: e.target.value }))}
                  className={inputCls} placeholder="ex: 68" />
              </div>
            </div>
          </div>

          {/* Remarques */}
          <div>
            <label className={labelCls}>Remarques (optionnel)</label>
            <textarea value={form.remarques} onChange={e => setForm(f => ({ ...f, remarques: e.target.value }))}
              rows={3} className={inputCls + " resize-none"} placeholder="Observations cliniques..." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
              style={glassSubtle}>
              Annuler
            </button>
            <button type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: "#00C98A", boxShadow: "0 2px 8px rgba(0,201,138,0.3)" }}>
              Enregistrer le bilan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── KPI card ─────────────────────────────────────────────────────────────── */
function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-[var(--radius-large)] p-5 flex flex-col gap-1" style={glass}>
      <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</span>
      <span className="text-3xl font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function BilansPage() {
  const [bilans, setBilans] = useState<BilanAuditif[]>([]);
  const [selected, setSelected] = useState<BilanAuditif | null>(null);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    const stored = loadBilans();
    if (stored.length > 0) {
      setBilans(stored);
    } else {
      setBilans(MOCK_BILANS);
    }
  }, []);

  function handleSave(bilan: BilanAuditif) {
    const updated = [bilan, ...bilans];
    setBilans(updated);
    saveBilans(updated);
    setShowNew(false);
  }

  function handleUpdate(updated: BilanAuditif) {
    const next = bilans.map(b => b.id === updated.id ? updated : b);
    setBilans(next);
    saveBilans(next);
    setSelected(null);
  }

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const terminesThisMonth = bilans.filter(b => b.status === "Terminé" && b.dateBilan.startsWith(thisMonth)).length;
  const aCompleter = bilans.filter(b => b.status === "À compléter").length;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800 h-title">Bilans auditifs</h1>
          <p className="mt-1 text-sm text-slate-500">Résultats et comptes-rendus audiométriques</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: "#00C98A", boxShadow: "0 2px 8px rgba(0,201,138,0.3)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Nouveau bilan
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total bilans" value={bilans.length} color="#00C98A" />
        <KpiCard label="Terminés ce mois" value={terminesThisMonth} color="#10b981" />
        <KpiCard label="À compléter" value={aCompleter} color="#f59e0b" />
      </div>

      {/* List */}
      <div className="space-y-4">
        {bilans.map(b => {
          const ageStr = b.dateNaissance
            ? String(new Date().getFullYear() - new Date(b.dateNaissance).getFullYear()) + " ans"
            : "";
          return (
            <div key={b.id} className="rounded-[var(--radius-large)] p-5" style={glass}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                {/* Left */}
                <div className="space-y-3 flex-1 min-w-0">
                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">
                        {b.patientPrenom} {b.patientNom}
                      </span>
                      {ageStr && <span className="text-xs text-slate-400">{ageStr}</span>}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {formatDateFR(b.dateBilan)} — {b.prescripteur}
                    </div>
                    <div className="text-[11px] text-slate-400">{b.numero}</div>
                  </div>

                  {/* Perte badges */}
                  <div className="flex flex-wrap gap-2">
                    <PerteBadge type={b.typePerteOD} label="OD" />
                    <PerteBadge type={b.typePerteOG} label="OG" />
                  </div>

                  {/* Intelligibilité */}
                  {(b.intelligibiliteOD !== undefined || b.intelligibiliteOG !== undefined) && (
                    <div className="inline-flex flex-col gap-2 rounded-xl px-3 py-2.5 min-w-[180px]" style={glassSubtle}>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Intelligibilité vocale
                      </div>
                      {b.intelligibiliteOD !== undefined && (
                        <IntelliBar value={b.intelligibiliteOD} label="OD" color="#ef4444" />
                      )}
                      {b.intelligibiliteOG !== undefined && (
                        <IntelliBar value={b.intelligibiliteOG} label="OG" color="#3b82f6" />
                      )}
                    </div>
                  )}
                </div>

                {/* Right */}
                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${STATUS_COLORS[b.status]}`}>
                    {b.status}
                  </span>
                  <button
                    onClick={() => setSelected(b)}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#00C98A] transition-all hover:bg-emerald-50"
                    style={glassSubtle}
                  >
                    Voir le bilan
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {selected && <DetailModal bilan={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} />}
      {showNew && <NouveauBilanModal onClose={() => setShowNew(false)} onSave={handleSave} />}
    </div>
  );
}
