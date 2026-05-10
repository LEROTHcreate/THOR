"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { CSSProperties } from "react";

/* ── Glass tokens ────────────────────────────────────────────────────────── */
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

/* ── Data model ──────────────────────────────────────────────────────────── */
type DossierAudStatus = "Bilan" | "Essai" | "En commande" | "Adaptation" | "Livré" | "Suivi" | "Annulé";

interface DossierAud {
  id: string;
  numero: string;
  patientNom: string;
  patientPrenom: string;
  status: DossierAudStatus;
  marque: string;
  modele: string;
  oreille: "binaural" | "OD" | "OG";
  classe: 1 | 2;
  prixUnitaire: number;
  montantTotal: number;
  priseEnChargeSS: number;
  priseEnChargeMutuelle: number;
  resteACharge: number;
  dateCreation: string;
  dateLivraison?: string;
  notes?: string;
}

const LS_KEY = "thor_pro_audition_dossiers";

/* ── Status meta ─────────────────────────────────────────────────────────── */
const STATUS_META: Record<DossierAudStatus, { color: string; bg: string }> = {
  "Bilan":       { color: "#00C98A", bg: "rgba(0,201,138,0.10)"  },
  "Essai":       { color: "#8b5cf6", bg: "rgba(139,92,246,0.10)"  },
  "En commande": { color: "#f59e0b", bg: "rgba(245,158,11,0.10)"  },
  "Adaptation":  { color: "#00C98A", bg: "rgba(0,201,138,0.10)"  },
  "Livré":       { color: "#10b981", bg: "rgba(16,185,129,0.10)"  },
  "Suivi":       { color: "#64748b", bg: "rgba(100,116,139,0.10)" },
  "Annulé":      { color: "#ef4444", bg: "rgba(239,68,68,0.10)"   },
};

/* ── Mock data ───────────────────────────────────────────────────────────── */
const MOCK_DOSSIERS: DossierAud[] = [
  {
    id: "d001",
    numero: "DOS-AUD-2025-001",
    patientNom: "Moreau", patientPrenom: "Jean-Paul",
    status: "Adaptation",
    marque: "Starkey", modele: "Evolv AI 2400",
    oreille: "binaural", classe: 2,
    prixUnitaire: 2420, montantTotal: 4840,
    priseEnChargeSS: 3400, priseEnChargeMutuelle: 640, resteACharge: 800,
    dateCreation: "2025-11-05",
    notes: "Réglages fins en cours — port régulier encouragé",
  },
  {
    id: "d002",
    numero: "DOS-AUD-2025-002",
    patientNom: "Lefranc", patientPrenom: "Simone",
    status: "Livré",
    marque: "Phonak", modele: "Lumity 90",
    oreille: "binaural", classe: 2,
    prixUnitaire: 3180, montantTotal: 6360,
    priseEnChargeSS: 3400, priseEnChargeMutuelle: 1760, resteACharge: 1200,
    dateCreation: "2025-09-14", dateLivraison: "2025-10-20",
    notes: "Satisfaction élevée — suivi 3 mois programmé",
  },
  {
    id: "d003",
    numero: "DOS-AUD-2025-003",
    patientNom: "Bernin", patientPrenom: "André",
    status: "En commande",
    marque: "Oticon", modele: "Intent 1",
    oreille: "binaural", classe: 2,
    prixUnitaire: 2890, montantTotal: 5780,
    priseEnChargeSS: 3400, priseEnChargeMutuelle: 1400, resteACharge: 980,
    dateCreation: "2026-02-10",
    notes: "Commande passée le 10/02 — délai 3 semaines",
  },
  {
    id: "d004",
    numero: "DOS-AUD-2026-001",
    patientNom: "Dupont", patientPrenom: "Marie",
    status: "Suivi",
    marque: "Widex", modele: "Moment Sheer",
    oreille: "OD", classe: 1,
    prixUnitaire: 1400, montantTotal: 1400,
    priseEnChargeSS: 1400, priseEnChargeMutuelle: 0, resteACharge: 0,
    dateCreation: "2025-06-01", dateLivraison: "2025-07-15",
    notes: "Classe 1 — 100% Santé — suivi annuel",
  },
];

type MarqueFilter = "Tous" | "Phonak" | "Oticon" | "Starkey" | "Widex" | "ReSound" | "Signia" | "Bernafon";
type StatusFilter = "Tous" | DossierAudStatus;

const MARQUES: MarqueFilter[] = ["Tous", "Phonak", "Oticon", "Starkey", "Widex", "ReSound", "Signia", "Bernafon"];
const STATUTS: StatusFilter[] = ["Tous", "Bilan", "Essai", "En commande", "Adaptation", "Livré", "Suivi"];

/* ── Format helpers ──────────────────────────────────────────────────────── */
function formatEuro(n: number): string {
  return n.toLocaleString("fr-FR") + " €";
}

function loadDossiers(): DossierAud[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as DossierAud[]) : [];
  } catch {
    return [];
  }
}

function saveDossiers(dossiers: DossierAud[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(dossiers));
}

function generateNumero(dossiers: DossierAud[]): string {
  const year = new Date().getFullYear();
  const existing = dossiers
    .map(d => {
      const m = d.numero.match(/^DOS-AUD-(\d{4})-(\d+)$/);
      return m && Number(m[1]) === year ? Number(m[2]) : 0;
    })
    .filter(Boolean);
  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  return `DOS-AUD-${year}-${String(next).padStart(3, "0")}`;
}

/* ── Icons ───────────────────────────────────────────────────────────────── */
function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
function IconHeadphones({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z" />
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z" />
    </svg>
  );
}

/* ── Modal nouveau dossier ───────────────────────────────────────────────── */
interface NewDossierForm {
  patientNom: string;
  patientPrenom: string;
  marque: string;
  modele: string;
  oreille: "binaural" | "OD" | "OG";
  classe: 1 | 2;
  prixUnitaire: string;
  notes: string;
}

const EMPTY_DOSSIER: NewDossierForm = {
  patientNom: "", patientPrenom: "", marque: "Phonak", modele: "",
  oreille: "binaural", classe: 2, prixUnitaire: "", notes: "",
};

const MARQUES_FORM = ["Phonak", "Oticon", "Starkey", "Widex", "ReSound", "Signia", "Bernafon", "GN Hearing"];

function NouveauDossierModal({
  open,
  onClose,
  onCreated,
  existingDossiers,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (d: DossierAud) => void;
  existingDossiers: DossierAud[];
}) {
  const [form, setForm] = useState<NewDossierForm>(EMPTY_DOSSIER);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) { setForm(EMPTY_DOSSIER); setError(""); }
  }, [open]);

  if (!open) return null;

  function set<K extends keyof NewDossierForm>(key: K, value: NewDossierForm[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    setError("");
  }

  function handleCreate() {
    if (!form.patientNom.trim() || !form.patientPrenom.trim()) {
      setError("Nom et prénom du patient requis."); return;
    }
    if (!form.modele.trim()) { setError("Modèle requis."); return; }
    const prix = parseFloat(form.prixUnitaire.replace(",", ".")) || 0;
    const qty = form.oreille === "binaural" ? 2 : 1;
    const total = prix * qty;
    const ss = Math.min(1700 * qty, total);
    const mutuelle = Math.round(total * 0.12);
    const rac = Math.max(0, total - ss - mutuelle);

    const now = new Date().toISOString().split("T")[0];
    const allDossiers = [...existingDossiers, ...MOCK_DOSSIERS];
    const newDossier: DossierAud = {
      id: `d_${Date.now()}`,
      numero: generateNumero(allDossiers),
      patientNom: form.patientNom.trim(),
      patientPrenom: form.patientPrenom.trim(),
      status: "Bilan",
      marque: form.marque,
      modele: form.modele.trim(),
      oreille: form.oreille,
      classe: form.classe,
      prixUnitaire: prix,
      montantTotal: total,
      priseEnChargeSS: ss,
      priseEnChargeMutuelle: mutuelle,
      resteACharge: rac,
      dateCreation: now,
      notes: form.notes.trim() || undefined,
    };
    onCreated(newDossier);
  }

  const inputStyle: CSSProperties = {
    width: "100%", padding: "8px 12px", borderRadius: 10,
    border: "1.5px solid rgba(203,213,225,0.8)",
    background: "var(--glass-strong-bg)",
    fontSize: 14, color: "#1e293b", outline: "none", boxSizing: "border-box",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ ...glass, borderRadius: 20, width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto", padding: "28px 28px 24px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>Nouveau dossier</h2>
          <button onClick={onClose} style={{ background: "rgba(241,245,249,0.8)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}>
            <IconX className="w-4 h-4" />
          </button>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Nom *</label>
              <input style={inputStyle} value={form.patientNom} onChange={e => set("patientNom", e.target.value)} placeholder="Moreau" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Prénom *</label>
              <input style={inputStyle} value={form.patientPrenom} onChange={e => set("patientPrenom", e.target.value)} placeholder="Jean-Paul" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Marque</label>
              <select style={inputStyle} value={form.marque} onChange={e => set("marque", e.target.value)}>
                {MARQUES_FORM.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Modèle *</label>
              <input style={inputStyle} value={form.modele} onChange={e => set("modele", e.target.value)} placeholder="Lumity 90" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Oreille</label>
              <select style={inputStyle} value={form.oreille} onChange={e => set("oreille", e.target.value as "binaural" | "OD" | "OG")}>
                <option value="binaural">Binaural</option>
                <option value="OD">OD</option>
                <option value="OG">OG</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Classe</label>
              <select style={inputStyle} value={form.classe} onChange={e => set("classe", Number(e.target.value) as 1 | 2)}>
                <option value={1}>Classe 1</option>
                <option value={2}>Classe 2</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Prix / unité (€)</label>
              <input style={inputStyle} value={form.prixUnitaire} onChange={e => set("prixUnitaire", e.target.value)} placeholder="2 500" type="number" />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Notes</label>
            <textarea
              style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              placeholder="Remarques audiologiques…"
            />
          </div>

          {error && <p style={{ fontSize: 12, color: "#ef4444", margin: 0 }}>{error}</p>}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
          <button onClick={onClose} style={{ ...glassSubtle, padding: "9px 18px", borderRadius: 10, fontSize: 14, fontWeight: 500, color: "#475569", cursor: "pointer", border: "1.5px solid rgba(203,213,225,0.7)" }}>
            Annuler
          </button>
          <button
            onClick={handleCreate}
            style={{
              background: "#00C98A",
              boxShadow: "0 2px 12px rgba(0,201,138,0.30)",
              border: "none", padding: "9px 22px", borderRadius: 10,
              fontSize: 14, fontWeight: 600, color: "white", cursor: "pointer",
            }}
          >
            Créer le dossier
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Dossier row ─────────────────────────────────────────────────────────── */
function DossierRow({ d, accent }: { d: DossierAud; accent: { color: string; bg: string } }) {
  const initials = (d.patientPrenom[0] ?? "") + (d.patientNom[0] ?? "");

  return (
    <Link href={`/clair-audition/pro/dossiers/${d.id}`} style={{ textDecoration: "none", color: "inherit", display: "flex" }}
      className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-emerald-50/30 transition-colors cursor-pointer">
      {/* Avatar + patient */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: accent.bg, color: accent.color }}
        >
          {initials.toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-800 truncate">
            {d.patientPrenom} {d.patientNom}
          </div>
          <div className="text-xs text-slate-500 truncate">
            {d.numero}
          </div>
        </div>
      </div>

      {/* Appareil */}
      <div className="flex items-center gap-2 min-w-0 w-52 flex-shrink-0">
        <IconHeadphones className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <div className="min-w-0">
          <div className="text-sm text-slate-700 font-medium truncate">{d.marque}</div>
          <div className="text-xs text-slate-500 truncate">{d.modele} — {d.oreille === "binaural" ? "Binaural" : d.oreille} — Cl.{d.classe}</div>
        </div>
      </div>

      {/* Tarif */}
      <div className="w-44 flex-shrink-0 hidden md:block">
        <div className="text-sm font-semibold text-slate-800">{formatEuro(d.montantTotal)}</div>
        <div className="text-xs text-slate-500">SS {formatEuro(d.priseEnChargeSS)} · RAC {formatEuro(d.resteACharge)}</div>
      </div>

      {/* Status */}
      <div className="flex-shrink-0">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          style={{ background: accent.bg, color: accent.color }}
        >
          {d.status}
        </span>
      </div>

      {/* Date */}
      <div className="text-xs text-slate-400 flex-shrink-0 w-24 hidden lg:block">
        {new Date(d.dateCreation).toLocaleDateString("fr-FR")}
      </div>
      {/* Chevron */}
      <svg className="w-4 h-4 text-slate-300 flex-shrink-0 ml-auto hidden sm:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function DossiersAuditionPage() {
  const [search, setSearch]             = useState("");
  const [marqueFilter, setMarqueFilter] = useState<MarqueFilter>("Tous");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Tous");
  const [modalOpen, setModalOpen]       = useState(false);
  const [storedDossiers, setStoredDossiers] = useState<DossierAud[]>([]);

  useEffect(() => {
    const loaded = loadDossiers();
    setStoredDossiers(loaded);
  }, []);

  function handleCreated(d: DossierAud) {
    const updated = [d, ...storedDossiers];
    setStoredDossiers(updated);
    saveDossiers(updated);
    setModalOpen(false);
  }

  const allDossiers = [...storedDossiers, ...MOCK_DOSSIERS];

  const filtered = allDossiers.filter(d => {
    const q = search.toLowerCase();
    const matchQ = `${d.patientPrenom} ${d.patientNom} ${d.marque} ${d.modele} ${d.numero}`.toLowerCase().includes(q);
    const matchM = marqueFilter === "Tous" || d.marque === marqueFilter;
    const matchS = statusFilter === "Tous" || d.status === statusFilter;
    return matchQ && matchM && matchS;
  });

  /* KPIs */
  const enCours  = allDossiers.filter(d => !["Livré", "Annulé", "Suivi"].includes(d.status)).length;
  const livresCeMois = allDossiers.filter(d => {
    if (d.status !== "Livré" || !d.dateLivraison) return false;
    const dl = new Date(d.dateLivraison);
    const now = new Date();
    return dl.getMonth() === now.getMonth() && dl.getFullYear() === now.getFullYear();
  }).length;
  const caTotal = allDossiers.reduce((acc, d) => acc + d.montantTotal, 0);

  const kpis = [
    { label: "Total dossiers",      value: String(allDossiers.length), color: "#00C98A" },
    { label: "En cours",            value: String(enCours),            color: "#f59e0b" },
    { label: "Livrés ce mois",      value: String(livresCeMois),       color: "#10b981" },
    { label: "CA appareillage",     value: formatEuro(caTotal),        color: "#00C98A" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800 h-title">Dossiers audioprothèse</h1>
          <p className="mt-1 text-sm text-slate-500">Gestion de l&apos;appareillage auditif de vos patients</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] text-white px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: "#00C98A", boxShadow: "0 4px 12px rgba(0,201,138,0.28)" }}
        >
          <IconPlus className="w-4 h-4" />
          Nouveau dossier
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="rounded-2xl p-4" style={glass}>
            <div className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs text-slate-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher patient, numéro, marque…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-[var(--radius-large)] pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#00C98A]/30 transition bg-transparent"
            style={glass}
          />
        </div>
      </div>

      {/* Marque pills */}
      <div className="flex flex-wrap gap-2">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 self-center mr-1">Marque</div>
        {MARQUES.map(m => (
          <button
            key={m}
            onClick={() => setMarqueFilter(m)}
            className={`rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold transition-all ${marqueFilter === m ? "text-white" : "text-slate-500 hover:text-slate-700"}`}
            style={marqueFilter === m
              ? { background: "#00C98A", boxShadow: "0 2px 8px rgba(0,201,138,0.25)" }
              : glassSubtle}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 self-center mr-1">Statut</div>
        {STATUTS.map(s => {
          const meta = s !== "Tous" ? STATUS_META[s] : null;
          const isActive = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold transition-all"
              style={isActive && meta
                ? { background: meta.bg, color: meta.color, border: `1px solid ${meta.color}40` }
                : isActive
                ? { background: "#00C98A", color: "white" }
                : glassSubtle}
            >
              {s}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={glass}>
        <div className="hidden sm:flex items-center gap-3 px-5 py-3 border-b border-slate-100/60 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <div className="flex-1">Patient</div>
          <div className="w-52 flex-shrink-0">Appareil</div>
          <div className="w-44 flex-shrink-0 hidden md:block">Tarif</div>
          <div className="flex-shrink-0 w-28">Statut</div>
          <div className="w-24 flex-shrink-0 hidden lg:block">Création</div>
        </div>

        <div className="divide-y divide-slate-100/60">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400">Aucun dossier ne correspond à vos filtres.</div>
          ) : (
            filtered.map(d => (
              <DossierRow key={d.id} d={d} accent={STATUS_META[d.status]} />
            ))
          )}
        </div>
      </div>

      <NouveauDossierModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
        existingDossiers={storedDossiers}
      />
    </div>
  );
}
