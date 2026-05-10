"use client";

import Link from "next/link";
import { useState, useEffect, use } from "react";
import type { CSSProperties } from "react";

/* ── Design tokens ──────────────────────────────────────────────────────── */
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

/* ── Types ──────────────────────────────────────────────────────────────── */
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

interface HistoriqueItem {
  date: string;
  status: DossierAudStatus;
  user: string;
  note?: string;
}

const LS_KEY = "thor_pro_audition_dossiers";
const HISTORY_KEY = "thor_pro_audition_dossiers_history";

/* ── Mock data ──────────────────────────────────────────────────────────── */
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

const STEPPER_STATUSES: DossierAudStatus[] = ["Bilan", "Essai", "En commande", "Adaptation", "Livré", "Suivi"];

/* ── localStorage helpers ────────────────────────────────────────────────── */
function loadDossiers(): DossierAud[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as DossierAud[]) : [];
  } catch { return []; }
}

function saveDossiers(list: DossierAud[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

function loadHistory(id: string): HistoriqueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${HISTORY_KEY}_${id}`);
    return raw ? (JSON.parse(raw) as HistoriqueItem[]) : [];
  } catch { return []; }
}

function saveHistory(id: string, history: HistoriqueItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${HISTORY_KEY}_${id}`, JSON.stringify(history));
}

function safeLoad<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch { return []; }
}

/* ── Format helpers ──────────────────────────────────────────────────────── */
function formatEuro(n: number): string {
  return n.toLocaleString("fr-FR") + " €";
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

/* ── Tab type ────────────────────────────────────────────────────────────── */
type Tab = "appareillage" | "informations" | "historique" | "essais" | "sav";

/* ── Essais / SAV types ──────────────────────────────────────────────────── */
interface EssaiItem {
  id: string;
  patientNom: string;
  patientPrenom: string;
  appareil: string;
  statut: "en_cours" | "expire" | "converti" | "abandonne";
  dateDebut: string;
  dureeJours: number;
  notes?: string;
}

interface SavItem {
  id: string;
  numero: string;
  patientNom: string;
  patientPrenom: string;
  status: "Ouvert" | "En cours" | "Chez fournisseur" | "Résolu" | "Fermé";
  priorite: "Basse" | "Normale" | "Haute" | "Urgente";
  produit: string;
  description: string;
  dateOuverture: string;
}

/* ── SVG Icons ───────────────────────────────────────────────────────────── */
function IconArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}
function IconX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
function IconHeadphones({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z" />
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function IconEdit() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
    </svg>
  );
}

/* ── Edit modal ──────────────────────────────────────────────────────────── */
interface EditDossierForm {
  marque: string;
  modele: string;
  oreille: "binaural" | "OD" | "OG";
  classe: 1 | 2;
  prixUnitaire: string;
  dateLivraison: string;
  notes: string;
}

const MARQUES_FORM = ["Phonak", "Oticon", "Starkey", "Widex", "ReSound", "Signia", "Bernafon", "GN Hearing"];

function EditModal({
  dossier,
  onClose,
  onSave,
}: {
  dossier: DossierAud;
  onClose: () => void;
  onSave: (form: EditDossierForm) => void;
}) {
  const [form, setForm] = useState<EditDossierForm>({
    marque: dossier.marque,
    modele: dossier.modele,
    oreille: dossier.oreille,
    classe: dossier.classe,
    prixUnitaire: String(dossier.prixUnitaire),
    dateLivraison: dossier.dateLivraison ?? "",
    notes: dossier.notes ?? "",
  });

  const inputStyle: CSSProperties = {
    width: "100%", padding: "8px 12px", borderRadius: 10,
    border: "1.5px solid rgba(203,213,225,0.8)",
    background: "var(--glass-strong-bg)",
    fontSize: 14, color: "#1e293b", outline: "none", boxSizing: "border-box",
  };

  const labelStyle: CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4,
  };

  function set<K extends keyof EditDossierForm>(key: K, value: EditDossierForm[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

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
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>Modifier le dossier</h2>
          <button onClick={onClose} style={{ background: "rgba(241,245,249,0.8)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}>
            <IconX />
          </button>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Marque</label>
              <select style={inputStyle} value={form.marque} onChange={e => set("marque", e.target.value)}>
                {MARQUES_FORM.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Modèle</label>
              <input style={inputStyle} value={form.modele} onChange={e => set("modele", e.target.value)} placeholder="Lumity 90" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Oreille</label>
              <select style={inputStyle} value={form.oreille} onChange={e => set("oreille", e.target.value as "binaural" | "OD" | "OG")}>
                <option value="binaural">Binaural</option>
                <option value="OD">OD</option>
                <option value="OG">OG</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Classe</label>
              <select style={inputStyle} value={form.classe} onChange={e => set("classe", Number(e.target.value) as 1 | 2)}>
                <option value={1}>Classe 1</option>
                <option value={2}>Classe 2</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Prix / unité (€)</label>
              <input style={inputStyle} type="number" value={form.prixUnitaire} onChange={e => set("prixUnitaire", e.target.value)} placeholder="2 500" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Date de livraison</label>
            <input style={inputStyle} type="date" value={form.dateLivraison} onChange={e => set("dateLivraison", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              placeholder="Remarques audiologiques…"
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
          <button onClick={onClose} style={{ ...glassSubtle, padding: "9px 18px", borderRadius: 10, fontSize: 14, fontWeight: 500, color: "#475569", cursor: "pointer" }}>
            Annuler
          </button>
          <button
            onClick={() => onSave(form)}
            style={{
              background: "#00C98A",
              boxShadow: "0 2px 12px rgba(0,201,138,0.30)",
              border: "none", padding: "9px 22px", borderRadius: 10,
              fontSize: 14, fontWeight: 600, color: "white", cursor: "pointer",
            }}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function DossierAudDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<Tab>("appareillage");
  const [showEditModal, setShowEditModal] = useState(false);
  const [dossier, setDossier] = useState<DossierAud | null>(null);
  const [historique, setHistorique] = useState<HistoriqueItem[]>([]);
  const [essaisPatient, setEssaisPatient] = useState<EssaiItem[]>([]);
  const [savPatient, setSavPatient] = useState<SavItem[]>([]);

  useEffect(() => {
    // Try localStorage first
    const stored = loadDossiers();
    const fromStorage = stored.find(d => d.id === id);
    if (fromStorage) {
      setDossier(fromStorage);
    } else {
      const mock = MOCK_DOSSIERS.find(d => d.id === id);
      setDossier(mock ?? null);
    }
    setHistorique(loadHistory(id));

    const resolvedDossier = stored.find(d => d.id === id) ?? MOCK_DOSSIERS.find(d => d.id === id);
    if (resolvedDossier) {
      const allEssais = safeLoad<EssaiItem>("thor_pro_audition_essais");
      setEssaisPatient(allEssais.filter(e => e.patientNom === resolvedDossier.patientNom && e.patientPrenom === resolvedDossier.patientPrenom));
      const allSav = safeLoad<SavItem>("thor_pro_audition_sav");
      setSavPatient(allSav.filter(t => t.patientNom === resolvedDossier.patientNom && t.patientPrenom === resolvedDossier.patientPrenom));
    }
  }, [id]);

  function handleStatusChange(newStatus: DossierAudStatus) {
    if (!dossier) return;
    const updated: DossierAud = { ...dossier, status: newStatus };
    setDossier(updated);

    // Persist
    const stored = loadDossiers();
    const idx = stored.findIndex(d => d.id === id);
    if (idx >= 0) {
      stored[idx] = updated;
      saveDossiers(stored);
    } else {
      // was mock — add to storage
      saveDossiers([updated, ...stored]);
    }

    // Add to history
    const newItem: HistoriqueItem = {
      date: new Date().toISOString(),
      status: newStatus,
      user: "Praticien",
    };
    const newHistory = [newItem, ...historique];
    setHistorique(newHistory);
    saveHistory(id, newHistory);
  }

  function handleSaveEdit(form: EditDossierForm) {
    if (!dossier) return;
    const prix = parseFloat(form.prixUnitaire.replace(",", ".")) || 0;
    const qty = form.oreille === "binaural" ? 2 : 1;
    const total = prix * qty;
    const ss = Math.min(1700 * qty, total);
    const mutuelle = Math.round(total * 0.12);
    const rac = Math.max(0, total - ss - mutuelle);

    const updated: DossierAud = {
      ...dossier,
      marque: form.marque,
      modele: form.modele,
      oreille: form.oreille,
      classe: form.classe,
      prixUnitaire: prix,
      montantTotal: total,
      priseEnChargeSS: ss,
      priseEnChargeMutuelle: mutuelle,
      resteACharge: rac,
      dateLivraison: form.dateLivraison || undefined,
      notes: form.notes || undefined,
    };
    setDossier(updated);

    const stored = loadDossiers();
    const idx = stored.findIndex(d => d.id === id);
    if (idx >= 0) {
      stored[idx] = updated;
      saveDossiers(stored);
    } else {
      saveDossiers([updated, ...stored]);
    }
    setShowEditModal(false);
  }

  if (!dossier) {
    return (
      <div className="w-full space-y-6">
        <Link href="/clair-audition/pro/dossiers" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#00C98A] transition-colors">
          <IconArrowLeft />
          Dossiers
        </Link>
        <div className="rounded-2xl p-10 text-center text-sm text-slate-400" style={glass}>
          Dossier introuvable.
        </div>
      </div>
    );
  }

  const sm = STATUS_META[dossier.status];
  const qty = dossier.oreille === "binaural" ? 2 : 1;
  const racColor = dossier.resteACharge === 0 ? "#10b981" : dossier.resteACharge < 500 ? "#f59e0b" : "#ef4444";

  const tabs: { key: Tab; label: string }[] = [
    { key: "appareillage",  label: "Appareillage"  },
    { key: "informations",  label: "Informations"  },
    { key: "historique",    label: "Historique"    },
    { key: "essais",        label: "Essais"        },
    { key: "sav",           label: "SAV"           },
  ];

  return (
    <div className="w-full space-y-6">

      {/* Back */}
      <Link href="/clair-audition/pro/dossiers" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#00C98A] transition-colors">
        <IconArrowLeft />
        Dossiers
      </Link>

      {/* ── Header card ───────────────────────────────────────────────────── */}
      <div className="rounded-[var(--radius-large)] p-6" style={glass}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: sm.bg, color: sm.color }}
          >
            <IconHeadphones size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className="font-mono text-sm font-bold px-2.5 py-0.5 rounded-lg"
                    style={{ background: "rgba(0,201,138,0.10)", color: "#00C98A" }}
                  >
                    {dossier.numero}
                  </span>
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{ background: sm.bg, color: sm.color }}
                  >
                    {dossier.status}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-slate-800">
                  {dossier.patientPrenom} {dossier.patientNom}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {dossier.marque} {dossier.modele} — {dossier.oreille === "binaural" ? "Binaural" : dossier.oreille} — Classe {dossier.classe}
                </p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                  <span>Créé le {formatDate(dossier.dateCreation)}</span>
                  {dossier.dateLivraison && (
                    <span>· Livré le {formatDate(dossier.dateLivraison)}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-4 py-2 text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: "#00C98A", color: "#fff", boxShadow: "0 4px 12px rgba(0,201,138,0.25)" }}
              >
                <IconEdit />
                Modifier
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Parcours patient (stepper visuel) ────────────────────────────── */}
      <div className="rounded-[var(--radius-large)] p-5" style={glass}>
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Parcours patient</div>
        <div className="relative flex items-center">
          {STEPPER_STATUSES.map((s, i) => {
            const stepIdx = STEPPER_STATUSES.indexOf(dossier.status);
            const isActive = s === dossier.status;
            const isPast   = i < stepIdx;
            const isFuture = i > stepIdx;
            const meta = STATUS_META[s];
            const isLast = i === STEPPER_STATUSES.length - 1;
            return (
              <div key={s} className="flex items-center flex-1 min-w-0">
                {/* Step */}
                <button
                  onClick={() => handleStatusChange(s)}
                  className="flex flex-col items-center gap-1.5 group transition-all flex-shrink-0"
                  title={`Passer à : ${s}`}
                >
                  {/* Circle */}
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={
                      isActive
                        ? { background: `linear-gradient(135deg,${meta.color},${meta.color}cc)`, color: "#fff", boxShadow: `0 0 0 3px ${meta.color}30` }
                        : isPast
                        ? { background: "#10b981", color: "#fff", boxShadow: "0 0 0 2px rgba(16,185,129,0.25)" }
                        : { background: "rgba(226,232,240,0.80)", color: "#94a3b8", border: "1.5px solid rgba(203,213,225,0.60)" }
                    }
                  >
                    {isPast ? <IconCheck /> : <span style={{ fontSize: 11 }}>{i + 1}</span>}
                  </div>
                  {/* Label */}
                  <span
                    className="text-[10px] font-semibold text-center leading-tight max-w-[64px]"
                    style={{ color: isActive ? meta.color : isPast ? "#10b981" : "#94a3b8" }}
                  >
                    {s}
                  </span>
                </button>
                {/* Connector line */}
                {!isLast && (
                  <div className="flex-1 h-0.5 mx-1" style={{
                    background: isPast
                      ? "linear-gradient(90deg,#10b981,#00C98A)"
                      : isActive
                      ? `linear-gradient(90deg,${meta.color}60,rgba(226,232,240,0.60))`
                      : "rgba(226,232,240,0.60)",
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Financial summary ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Montant total",    value: formatEuro(dossier.montantTotal),          color: "#1e293b" },
          { label: "Prise en charge SS",  value: `−${formatEuro(dossier.priseEnChargeSS)}`, color: "#00C98A" },
          { label: "Mutuelle",         value: `−${formatEuro(dossier.priseEnChargeMutuelle)}`, color: "#10b981" },
          { label: "Reste à charge",   value: formatEuro(dossier.resteACharge),          color: racColor },
        ].map(item => (
          <div key={item.label} className="rounded-2xl p-4 text-center" style={glass}>
            <div className="text-xl font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-xs text-slate-500 mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-[var(--radius-large)] p-1.5" style={glassSubtle}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 rounded-[var(--radius-soft)] py-2 text-sm font-semibold transition-all"
            style={activeTab === tab.key
              ? { background: "#00C98A", color: "#fff", boxShadow: "0 2px 8px rgba(0,201,138,0.25)" }
              : { color: "#64748b", background: "transparent" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Appareillage ─────────────────────────────────────────────── */}
      {activeTab === "appareillage" && (
        <div className="rounded-[var(--radius-large)] overflow-hidden" style={glass}>
          <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-3 border-b border-slate-100/60 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <div className="col-span-4">Désignation</div>
            <div className="col-span-2">Oreille</div>
            <div className="col-span-1 text-center">Classe</div>
            <div className="col-span-2 text-right">Prix unit.</div>
            <div className="col-span-1 text-center">Qté</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          <div className="divide-y divide-slate-100/60">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center px-5 py-4">
              <div className="col-span-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,201,138,0.10)", color: "#00C98A" }}>
                  <IconHeadphones size={16} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{dossier.marque}</div>
                  <div className="text-xs text-slate-500">{dossier.modele}</div>
                </div>
              </div>
              <div className="col-span-2 text-sm text-slate-600">
                {dossier.oreille === "binaural" ? "Binaural" : dossier.oreille}
              </div>
              <div className="col-span-1 text-center">
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "rgba(0,201,138,0.10)", color: "#00C98A" }}>
                  Cl.{dossier.classe}
                </span>
              </div>
              <div className="col-span-2 text-right text-sm font-medium text-slate-700">{formatEuro(dossier.prixUnitaire)}</div>
              <div className="col-span-1 text-center text-sm font-semibold text-slate-800">{qty}</div>
              <div className="col-span-2 text-right text-sm font-bold text-slate-800">{formatEuro(dossier.montantTotal)}</div>
            </div>
          </div>

          {/* Footer totals */}
          <div className="px-5 py-4 border-t border-slate-100/60 flex flex-col gap-1.5 items-end">
            <div className="flex gap-6 text-sm">
              <span className="text-slate-500">Sous-total</span>
              <span className="font-bold text-slate-800">{formatEuro(dossier.montantTotal)}</span>
            </div>
            <div className="flex gap-6 text-sm">
              <span style={{ color: "#00C98A" }}>− SS</span>
              <span className="font-semibold" style={{ color: "#00C98A" }}>{formatEuro(dossier.priseEnChargeSS)}</span>
            </div>
            <div className="flex gap-6 text-sm">
              <span style={{ color: "#10b981" }}>− Mutuelle</span>
              <span className="font-semibold" style={{ color: "#10b981" }}>{formatEuro(dossier.priseEnChargeMutuelle)}</span>
            </div>
            <div className="flex gap-6 text-base border-t border-slate-100/60 pt-2 mt-1">
              <span className="font-bold text-slate-700">Reste à charge</span>
              <span className="font-bold" style={{ color: racColor }}>{formatEuro(dossier.resteACharge)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Informations ─────────────────────────────────────────────── */}
      {activeTab === "informations" && (
        <div className="space-y-4">
          {/* Patient card */}
          <div className="rounded-[var(--radius-large)] p-6" style={glass}>
            <div className="flex items-center gap-2 mb-4">
              <span style={{ color: "#00C98A" }}><IconUser /></span>
              <h2 className="text-base font-bold text-slate-800">Patient</h2>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: "rgba(167,243,208,0.70)", border: "1.5px solid rgba(0,201,138,0.25)", color: "#00C98A" }}
              >
                {((dossier.patientPrenom[0] ?? "") + (dossier.patientNom[0] ?? "")).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">{dossier.patientPrenom} {dossier.patientNom}</div>
                <Link
                  href={`/clair-audition/pro/patients/${dossier.patientNom.toLowerCase().replace(/\s+/g, "-")}-${dossier.patientPrenom.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-xs text-[#00C98A] hover:text-[#059669] transition-colors font-medium"
                >
                  Voir la fiche patient →
                </Link>
              </div>
            </div>
          </div>

          {/* Documents liés */}
          <div className="rounded-[var(--radius-large)] p-5" style={glass}>
            <h2 className="text-base font-bold text-slate-800 mb-4">Documents liés</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Bilan auditif",    href: "/clair-audition/pro/bilans",       icon: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5 5 0 0 0 20 4.77 5 5 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5 5 0 0 0 5 4.77a5 5 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22", color: "#00C98A",  bg: "rgba(0,201,138,0.08)"   },
                { label: "Ordonnance ORL",   href: "/clair-audition/pro/ordonnances",   icon: "M9 12h6M9 16h4M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6", color: "#8b5cf6", bg: "rgba(139,92,246,0.08)" },
                { label: "Devis",            href: "/clair-audition/pro/devis",         icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6 M9 13h6M9 17h4", color: "#f59e0b", bg: "rgba(245,158,11,0.08)"  },
                { label: "Facturation",      href: "/clair-audition/pro/facturation",   icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2ZM9 22V12h6v10", color: "#0891b2", bg: "rgba(8,145,178,0.08)"   },
              ].map(doc => (
                <Link
                  key={doc.label}
                  href={doc.href}
                  className="flex flex-col items-center gap-2 rounded-xl p-3.5 text-center transition-all hover:shadow-sm"
                  style={{ background: doc.bg, border: `1px solid ${doc.color}20` }}
                >
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${doc.color}15` }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={doc.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={doc.icon} />
                    </svg>
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: doc.color }}>{doc.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Dossier details */}
          <div className="rounded-[var(--radius-large)] p-6" style={glass}>
            <h2 className="text-base font-bold text-slate-800 mb-4">Détails du dossier</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
              {[
                { label: "Numéro",        value: dossier.numero },
                { label: "Statut",        value: dossier.status },
                { label: "Marque",        value: dossier.marque },
                { label: "Modèle",        value: dossier.modele },
                { label: "Oreille",       value: dossier.oreille === "binaural" ? "Binaural" : dossier.oreille },
                { label: "Classe",        value: `Classe ${dossier.classe}` },
                { label: "Date création", value: formatDate(dossier.dateCreation) },
                { label: "Date livraison", value: dossier.dateLivraison ? formatDate(dossier.dateLivraison) : "—" },
              ].map(row => (
                <div key={row.label} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", paddingBottom: "8px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "2px" }}>
                    {row.label}
                  </div>
                  <div style={{ fontSize: "14px", color: "#334155", fontWeight: 500 }}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {dossier.notes && (
            <div className="rounded-[var(--radius-large)] p-6" style={glass}>
              <h2 className="text-base font-bold text-slate-800 mb-3">Notes</h2>
              <div
                className="rounded-[var(--radius-soft)] p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap"
                style={{ background: "rgba(255,255,255,0.40)", border: "1px solid var(--glass-subtle-border)" }}
              >
                {dossier.notes}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Historique ───────────────────────────────────────────────── */}
      {activeTab === "historique" && (
        <div className="rounded-[var(--radius-large)] p-6" style={glass}>
          <h2 className="text-base font-bold text-slate-800 mb-5">Historique des statuts</h2>
          {historique.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun changement de statut enregistré.</p>
          ) : (
            <div className="relative pl-5">
              {/* Vertical line */}
              <div className="absolute left-2 top-0 bottom-0 w-0.5" style={{ background: "rgba(0,201,138,0.20)" }} />
              <div className="space-y-4">
                {historique.map((item, i) => {
                  const meta = STATUS_META[item.status];
                  return (
                    <div key={i} className="relative flex items-start gap-3">
                      {/* Dot */}
                      <div
                        className="absolute -left-3 top-1 h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: meta.bg, border: `2px solid ${meta.color}`, zIndex: 1 }}
                      />
                      <div className="pl-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                            style={{ background: meta.bg, color: meta.color }}
                          >
                            {item.status}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(item.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                          <span className="text-xs text-slate-400">· {item.user}</span>
                        </div>
                        {item.note && (
                          <p className="text-xs text-slate-500 mt-1">{item.note}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Essais ───────────────────────────────────────────────────── */}
      {activeTab === "essais" && (
        <div className="space-y-4">
          <div className="rounded-[var(--radius-large)] p-6" style={glass}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-800">Essais en cours / passés</h2>
              <Link
                href="/clair-audition/pro/essais"
                className="text-xs font-semibold transition-colors hover:opacity-80"
                style={{ color: "#00C98A" }}
              >
                Gérer les essais →
              </Link>
            </div>
            {essaisPatient.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun essai pour ce patient.</p>
            ) : (
              <div className="space-y-3">
                {essaisPatient.map(essai => {
                  const statutColors: Record<EssaiItem["statut"], { color: string; bg: string; label: string }> = {
                    en_cours:  { color: "#00C98A", bg: "rgba(0,201,138,0.10)",   label: "En cours"  },
                    expire:    { color: "#ef4444", bg: "rgba(239,68,68,0.10)",   label: "Expiré"    },
                    converti:  { color: "#10b981", bg: "rgba(16,185,129,0.10)",  label: "Converti"  },
                    abandonne: { color: "#94a3b8", bg: "rgba(148,163,184,0.10)", label: "Abandonné" },
                  };
                  const sm2 = statutColors[essai.statut];
                  const debut = new Date(essai.dateDebut);
                  const fin = new Date(debut.getTime() + essai.dureeJours * 86400000);
                  const today = new Date();
                  const daysLeft = Math.ceil((fin.getTime() - today.getTime()) / 86400000);
                  return (
                    <div key={essai.id} className="rounded-2xl p-4" style={glassSubtle}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">{essai.appareil}</div>
                          <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-400">
                            <span>Début : {formatDate(essai.dateDebut)}</span>
                            <span>· Durée : {essai.dureeJours} j</span>
                            {essai.statut === "en_cours" && (
                              <span style={{ color: daysLeft > 7 ? "#00C98A" : daysLeft > 0 ? "#f59e0b" : "#ef4444" }}>
                                · {daysLeft > 0 ? `J-${daysLeft} restant${daysLeft > 1 ? "s" : ""}` : "Expiré"}
                              </span>
                            )}
                          </div>
                          {essai.notes && (
                            <div className="text-xs text-slate-500 mt-1.5 leading-relaxed">{essai.notes}</div>
                          )}
                        </div>
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold flex-shrink-0"
                          style={{ background: sm2.bg, color: sm2.color }}
                        >
                          {sm2.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: SAV ──────────────────────────────────────────────────────── */}
      {activeTab === "sav" && (
        <div className="space-y-4">
          <div className="rounded-[var(--radius-large)] p-6" style={glass}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-800">Tickets SAV</h2>
              <Link
                href="/clair-audition/pro/sav"
                className="text-xs font-semibold transition-colors hover:opacity-80"
                style={{ color: "#00C98A" }}
              >
                Gérer le SAV →
              </Link>
            </div>
            {savPatient.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun ticket SAV pour ce patient.</p>
            ) : (
              <div className="space-y-3">
                {savPatient.map(ticket => {
                  const statusColors: Record<SavItem["status"], { color: string; bg: string }> = {
                    "Ouvert":           { color: "#ef4444", bg: "rgba(239,68,68,0.10)"   },
                    "En cours":         { color: "#f59e0b", bg: "rgba(245,158,11,0.10)"  },
                    "Chez fournisseur": { color: "#8b5cf6", bg: "rgba(139,92,246,0.10)"  },
                    "Résolu":           { color: "#10b981", bg: "rgba(16,185,129,0.10)"  },
                    "Fermé":            { color: "#94a3b8", bg: "rgba(148,163,184,0.10)" },
                  };
                  const prioriteColors: Record<SavItem["priorite"], { color: string; bg: string }> = {
                    "Urgente": { color: "#ef4444", bg: "rgba(239,68,68,0.10)"   },
                    "Haute":   { color: "#f59e0b", bg: "rgba(245,158,11,0.10)"  },
                    "Normale": { color: "#00C98A", bg: "rgba(0,201,138,0.10)"   },
                    "Basse":   { color: "#94a3b8", bg: "rgba(148,163,184,0.10)" },
                  };
                  const sc = statusColors[ticket.status];
                  const pc = prioriteColors[ticket.priorite];
                  return (
                    <div key={ticket.id} className="rounded-2xl p-4" style={glassSubtle}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-mono text-xs font-bold text-slate-500">{ticket.numero}</span>
                            <span
                              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                              style={{ background: sc.bg, color: sc.color }}
                            >
                              {ticket.status}
                            </span>
                            <span
                              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                              style={{ background: pc.bg, color: pc.color }}
                            >
                              {ticket.priorite}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-slate-800 truncate">{ticket.produit}</div>
                          <div className="text-xs text-slate-400 mt-1">Ouvert le {formatDate(ticket.dateOuverture)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {showEditModal && (
        <EditModal
          dossier={dossier}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
