"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import DraggableWindow from "@/components/ui/DraggableWindow";
import { printDevisAudition, type DevisAuditionPdf } from "@/lib/pdf-devis-audition";
import { loadStoreConfig } from "@/lib/storeConfig";

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

/* ── Types ───────────────────────────────────────────────────────────────── */
type DevisStatus = "Brouillon" | "Signé" | "Commandé" | "Prêt" | "Livré" | "Facturé" | "Annulé";
type LigneType = "appareil-droit" | "appareil-gauche" | "accessoire" | "pile" | "entretien";

interface DevisLigne {
  id: string;
  type: LigneType;
  designation: string;
  marque: string;
  modele: string;
  classe: 1 | 2;
  quantite: number;
  prixUnitaireTTC: number;
  prixTotalTTC: number;
  priseEnChargeSS: number;
  priseEnChargeMutuelle: number;
  resteACharge: number;
}

interface Devis {
  id: string;
  numero: string;
  patientNom: string;
  patientPrenom: string;
  patientTel: string;
  mutuelleNom: string;
  lignes: DevisLigne[];
  totalTTC: number;
  totalSS: number;
  totalMutuelle: number;
  resteACharge: number;
  date: string;
  dateValidite: string;
  status: DevisStatus;
  notes?: string;
  /* ── Règlement du RAC ─────────────────── */
  modeReglementRAC?: string;
  nbEcheances?: number;
  raisonGeste?: string;
  racRegle?: boolean;
}

const LS_KEY = "thor_pro_audition_devis";
const LS_RELANCES_AUDITION = "thor_pro_audition_relances";

/* ── Relances ────────────────────────────────────────────────────────────── */
interface RelanceEntry {
  devisId: string;
  date: string;
  patientNom: string;
  patientPrenom: string;
}

function loadRelances(): RelanceEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_RELANCES_AUDITION);
    return raw ? (JSON.parse(raw) as RelanceEntry[]) : [];
  } catch { return []; }
}

function saveRelance(entry: RelanceEntry): void {
  const list = loadRelances().filter(r => r.devisId !== entry.devisId);
  list.push(entry);
  try { localStorage.setItem(LS_RELANCES_AUDITION, JSON.stringify(list)); } catch { /* noop */ }
}

function daysSince(isoDate: string): number {
  const now = new Date();
  const d = new Date(isoDate);
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/* ── Status meta ─────────────────────────────────────────────────────────── */
const STATUS_META: Record<DevisStatus, { color: string; bg: string }> = {
  "Brouillon":  { color: "#94a3b8", bg: "rgba(148,163,184,0.10)" },
  "Signé":      { color: "#00C98A", bg: "rgba(0,201,138,0.10)"  },
  "Commandé":   { color: "#8b5cf6", bg: "rgba(139,92,246,0.10)"  },
  "Prêt":       { color: "#f59e0b", bg: "rgba(245,158,11,0.10)"  },
  "Livré":      { color: "#10b981", bg: "rgba(16,185,129,0.10)"  },
  "Facturé":    { color: "#64748b", bg: "rgba(100,116,139,0.10)" },
  "Annulé":     { color: "#ef4444", bg: "rgba(239,68,68,0.10)"  },
};

/* ── Remboursement SS 100% Santé ─────────────────────────────────────────── */
const SS_PAR_APPAREIL = 1700; // classe 1 ET classe 2 (plafond 100% santé)

/* ── Mock data ───────────────────────────────────────────────────────────── */
function makeLigne(
  id: string,
  type: LigneType,
  designation: string,
  marque: string,
  modele: string,
  classe: 1 | 2,
  qty: number,
  prixUnit: number,
  ssUnit: number,
  mutUnit: number,
): DevisLigne {
  const total = prixUnit * qty;
  const ss    = ssUnit * qty;
  const mut   = mutUnit * qty;
  return {
    id, type, designation, marque, modele, classe, quantite: qty,
    prixUnitaireTTC: prixUnit, prixTotalTTC: total,
    priseEnChargeSS: ss, priseEnChargeMutuelle: mut, resteACharge: total - ss - mut,
  };
}

const MOCK_DEVIS: Devis[] = [
  {
    id: "dv001",
    numero: "DEV-AUD-2025-001",
    patientNom: "Moreau", patientPrenom: "Jean-Paul",
    patientTel: "06 12 34 56 78", mutuelleNom: "MGEN",
    lignes: [
      makeLigne("l1", "appareil-droit",  "Starkey Evolv AI 2400 OD", "Starkey", "Evolv AI 2400", 2, 1, 2420, 1700, 300),
      makeLigne("l2", "appareil-gauche", "Starkey Evolv AI 2400 OG", "Starkey", "Evolv AI 2400", 2, 1, 2420, 1700, 300),
    ],
    totalTTC: 4840, totalSS: 3400, totalMutuelle: 600, resteACharge: 840,
    date: "2025-11-05", dateValidite: "2026-02-05",
    status: "Signé",
    notes: "Binaural classe 2 — remboursement SS max",
  },
  {
    id: "dv002",
    numero: "DEV-AUD-2025-002",
    patientNom: "Lefranc", patientPrenom: "Simone",
    patientTel: "06 98 76 54 32", mutuelleNom: "Harmonie Mutuelle",
    lignes: [
      makeLigne("l3", "appareil-droit",  "Phonak Lumity 90 OD", "Phonak", "Lumity 90", 2, 1, 3180, 1700, 880),
      makeLigne("l4", "appareil-gauche", "Phonak Lumity 90 OG", "Phonak", "Lumity 90", 2, 1, 3180, 1700, 880),
    ],
    totalTTC: 6360, totalSS: 3400, totalMutuelle: 1760, resteACharge: 1200,
    date: "2025-09-14", dateValidite: "2025-12-14",
    status: "Livré",
  },
  {
    id: "dv003",
    numero: "DEV-AUD-2026-001",
    patientNom: "Chatel", patientPrenom: "Robert",
    patientTel: "07 11 22 33 44", mutuelleNom: "Malakoff Humanis",
    lignes: [
      makeLigne("l5", "appareil-droit", "Oticon Intent 1 OD", "Oticon", "Intent 1", 2, 1, 2890, 1700, 800),
    ],
    totalTTC: 2890, totalSS: 1700, totalMutuelle: 800, resteACharge: 390,
    date: "2026-03-10", dateValidite: "2026-06-10",
    status: "Brouillon",
    notes: "Devis OD uniquement pour l'instant",
  },
];

/* ── Format helpers ──────────────────────────────────────────────────────── */
function formatEuro(n: number): string {
  return n.toLocaleString("fr-FR") + " €";
}

function genId(): string {
  return `dv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function generateNumero(devis: Devis[]): string {
  const year = new Date().getFullYear();
  const existing = devis
    .map(d => {
      const m = d.numero.match(/^DEV-AUD-(\d{4})-(\d+)$/);
      return m && Number(m[1]) === year ? Number(m[2]) : 0;
    })
    .filter(Boolean);
  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  return `DEV-AUD-${year}-${String(next).padStart(3, "0")}`;
}

function loadDevis(): Devis[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Devis[]) : [];
  } catch {
    return [];
  }
}

function saveDevis(devis: Devis[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(devis));
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
function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   WIZARD MODAL — 3 steps: Patient → Équipement → Récapitulatif
══════════════════════════════════════════════════════════════════ */
const MARQUES_AUD = ["Phonak", "Oticon", "Starkey", "Widex", "ReSound", "Signia", "Bernafon", "GN Hearing"];

interface WizardForm {
  /* Step 1 — Patient */
  patientNom: string;
  patientPrenom: string;
  patientTel: string;
  mutuelleNom: string;
  mutuelleTaux: number; // %

  /* Step 2 — Équipement */
  marque: string;
  modele: string;
  oreille: "binaural" | "OD" | "OG";
  classe: 1 | 2;
  prixOD: string;
  prixOG: string;
  notes: string;
}

const EMPTY_WIZARD: WizardForm = {
  patientNom: "", patientPrenom: "", patientTel: "", mutuelleNom: "", mutuelleTaux: 30,
  marque: "Phonak", modele: "", oreille: "binaural", classe: 2,
  prixOD: "", prixOG: "", notes: "",
};

function computeDevis(form: WizardForm): {
  lignes: DevisLigne[];
  totalTTC: number;
  totalSS: number;
  totalMutuelle: number;
  resteACharge: number;
} {
  const lignes: DevisLigne[] = [];

  function addAppareil(type: "appareil-droit" | "appareil-gauche", prixStr: string) {
    const prix = parseFloat(prixStr.replace(",", ".")) || 0;
    if (prix <= 0) return;
    const ss = Math.min(SS_PAR_APPAREIL, prix);
    const afterSS = Math.max(0, prix - ss);
    const mut = Math.round(afterSS * (form.mutuelleTaux / 100));
    const rac = Math.max(0, prix - ss - mut);
    lignes.push({
      id: genId(),
      type,
      designation: `${form.marque} ${form.modele} ${type === "appareil-droit" ? "OD" : "OG"}`,
      marque: form.marque,
      modele: form.modele,
      classe: form.classe,
      quantite: 1,
      prixUnitaireTTC: prix, prixTotalTTC: prix,
      priseEnChargeSS: ss, priseEnChargeMutuelle: mut, resteACharge: rac,
    });
  }

  if (form.oreille === "OD" || form.oreille === "binaural") addAppareil("appareil-droit", form.prixOD);
  if (form.oreille === "OG" || form.oreille === "binaural") addAppareil("appareil-gauche", form.oreille === "binaural" ? form.prixOG : form.prixOD);

  const totalTTC     = lignes.reduce((a, l) => a + l.prixTotalTTC, 0);
  const totalSS      = lignes.reduce((a, l) => a + l.priseEnChargeSS, 0);
  const totalMutuelle = lignes.reduce((a, l) => a + l.priseEnChargeMutuelle, 0);
  const resteACharge  = lignes.reduce((a, l) => a + l.resteACharge, 0);

  return { lignes, totalTTC, totalSS, totalMutuelle, resteACharge };
}

function DevisWizard({
  open,
  onClose,
  onCreated,
  allDevis,
  initialForm,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (d: Devis) => void;
  allDevis: Devis[];
  initialForm?: Partial<WizardForm>;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardForm>(EMPTY_WIZARD);
  const [errors, setErrors] = useState<Partial<Record<keyof WizardForm, string>>>({});

  useEffect(() => {
    if (open) {
      setStep(1);
      setForm({ ...EMPTY_WIZARD, ...(initialForm ?? {}) });
      setErrors({});
    }
  }, [open, initialForm]);

  if (!open) return null;

  function set<K extends keyof WizardForm>(key: K, value: WizardForm[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: "" }));
  }

  function validateStep1(): boolean {
    const e: Partial<Record<keyof WizardForm, string>> = {};
    if (!form.patientNom.trim())    e.patientNom = "Requis";
    if (!form.patientPrenom.trim()) e.patientPrenom = "Requis";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2(): boolean {
    const e: Partial<Record<keyof WizardForm, string>> = {};
    if (!form.modele.trim()) e.modele = "Modèle requis";
    const prixOD = parseFloat(form.prixOD.replace(",", ".")) || 0;
    if ((form.oreille === "OD" || form.oreille === "binaural") && prixOD <= 0) {
      e.prixOD = "Prix OD requis";
    }
    const prixOG = parseFloat(form.prixOG.replace(",", ".")) || 0;
    if (form.oreille === "binaural" && prixOG <= 0) {
      e.prixOG = "Prix OG requis";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function goNext() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(s => Math.min(s + 1, 3));
  }

  function handleCreate() {
    const { lignes, totalTTC, totalSS, totalMutuelle, resteACharge } = computeDevis(form);
    const today = new Date();
    const validite = new Date(today);
    validite.setMonth(validite.getMonth() + 3);

    const newDevis: Devis = {
      id: genId(),
      numero: generateNumero(allDevis),
      patientNom: form.patientNom.trim(),
      patientPrenom: form.patientPrenom.trim(),
      patientTel: form.patientTel.trim(),
      mutuelleNom: form.mutuelleNom.trim(),
      lignes,
      totalTTC, totalSS, totalMutuelle, resteACharge,
      date: today.toISOString().split("T")[0],
      dateValidite: validite.toISOString().split("T")[0],
      status: "Brouillon",
      notes: form.notes.trim() || undefined,
    };
    onCreated(newDevis);
  }

  const inputStyle: CSSProperties = {
    width: "100%", padding: "8px 12px", borderRadius: 10,
    border: "1.5px solid rgba(203,213,225,0.8)",
    background: "var(--glass-strong-bg)",
    fontSize: 14, color: "#1e293b", outline: "none", boxSizing: "border-box",
  };

  function errStyle(field: keyof WizardForm): CSSProperties {
    return errors[field] ? { ...inputStyle, border: "1.5px solid rgba(239,68,68,0.60)" } : inputStyle;
  }

  const { lignes, totalTTC, totalSS, totalMutuelle, resteACharge } = computeDevis(form);

  const LIGNE_TYPE_LABELS: Record<LigneType, string> = {
    "appareil-droit": "Appareil OD", "appareil-gauche": "Appareil OG",
    accessoire: "Accessoire", pile: "Pile", entretien: "Entretien",
  };

  return (
    <DraggableWindow
      title="Nouveau devis"
      onClose={onClose}
      defaultWidth={620}
      defaultHeight={580}
    >
      <div style={{ background: "var(--glass-card-bg)", padding: "24px 28px" }}>
        {/* Step indicator */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {["Patient", "Équipement", "Récapitulatif"].map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  background: active ? "#00C98A" : done ? "#10b981" : "rgba(148,163,184,0.25)",
                  color: active || done ? "white" : "#94a3b8",
                }}>
                  {done ? "✓" : n}
                </div>
                <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? "#00C98A" : "#94a3b8" }}>
                  {label}
                </span>
                {i < 2 && <div style={{ flex: 1, height: 1, background: "rgba(203,213,225,0.6)", marginLeft: 4 }} />}
              </div>
            );
          })}
        </div>

        {/* Step 1 — Patient */}
        {step === 1 && (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Nom *</label>
                <input style={errStyle("patientNom")} value={form.patientNom} onChange={e => set("patientNom", e.target.value)} placeholder="Moreau" />
                {errors.patientNom && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>{errors.patientNom}</p>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Prénom *</label>
                <input style={errStyle("patientPrenom")} value={form.patientPrenom} onChange={e => set("patientPrenom", e.target.value)} placeholder="Jean-Paul" />
                {errors.patientPrenom && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>{errors.patientPrenom}</p>}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Téléphone</label>
                <input style={inputStyle} value={form.patientTel} onChange={e => set("patientTel", e.target.value)} placeholder="06 12 34 56 78" type="tel" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Mutuelle</label>
                <input style={inputStyle} value={form.mutuelleNom} onChange={e => set("mutuelleNom", e.target.value)} placeholder="MGEN, Harmonie…" />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                Taux de remboursement mutuelle (% du reste après SS) : {form.mutuelleTaux}%
              </label>
              <input
                type="range" min={0} max={100} step={5}
                value={form.mutuelleTaux}
                onChange={e => set("mutuelleTaux", Number(e.target.value))}
                style={{ width: "100%", accentColor: "#00C98A" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                <span>0%</span><span>50%</span><span>100%</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Équipement */}
        {step === 2 && (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Marque</label>
                <select style={inputStyle} value={form.marque} onChange={e => set("marque", e.target.value)}>
                  {MARQUES_AUD.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Modèle *</label>
                <input style={errStyle("modele")} value={form.modele} onChange={e => set("modele", e.target.value)} placeholder="Lumity 90" />
                {errors.modele && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>{errors.modele}</p>}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Oreille(s)</label>
                <select style={inputStyle} value={form.oreille} onChange={e => set("oreille", e.target.value as "binaural" | "OD" | "OG")}>
                  <option value="binaural">Binaural (OD + OG)</option>
                  <option value="OD">OD seulement</option>
                  <option value="OG">OG seulement</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Classe</label>
                <select style={inputStyle} value={form.classe} onChange={e => set("classe", Number(e.target.value) as 1 | 2)}>
                  <option value={1}>Classe 1 (100% Santé)</option>
                  <option value={2}>Classe 2 (libre)</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {(form.oreille === "OD" || form.oreille === "binaural") && (
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                    Prix OD TTC (€) *
                  </label>
                  <input
                    type="number"
                    style={errStyle("prixOD")}
                    value={form.prixOD}
                    onChange={e => set("prixOD", e.target.value)}
                    placeholder="2500"
                  />
                  {errors.prixOD && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>{errors.prixOD}</p>}
                </div>
              )}
              {form.oreille === "binaural" && (
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                    Prix OG TTC (€) *
                  </label>
                  <input
                    type="number"
                    style={errStyle("prixOG")}
                    value={form.prixOG}
                    onChange={e => set("prixOG", e.target.value)}
                    placeholder="2500"
                  />
                  {errors.prixOG && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>{errors.prixOG}</p>}
                </div>
              )}
              {form.oreille === "OG" && (
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                    Prix OG TTC (€) *
                  </label>
                  <input
                    type="number"
                    style={errStyle("prixOD")}
                    value={form.prixOD}
                    onChange={e => set("prixOD", e.target.value)}
                    placeholder="2500"
                  />
                  {errors.prixOD && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>{errors.prixOD}</p>}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Notes</label>
              <textarea
                style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
                value={form.notes}
                onChange={e => set("notes", e.target.value)}
                placeholder="Remarques spécifiques au devis…"
              />
            </div>

            {/* Remboursement SS info */}
            <div style={{ ...glassSubtle, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#475569" }}>
              <strong style={{ color: "#00C98A" }}>Remboursement SS :</strong> {formatEuro(SS_PAR_APPAREIL)} par appareil (classe 1 et 2 — 100% Santé)
            </div>
          </div>
        )}

        {/* Step 3 — Récapitulatif */}
        {step === 3 && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ ...glassSubtle, borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Patient
              </div>
              <div style={{ fontWeight: 600, color: "#1e293b" }}>{form.patientPrenom} {form.patientNom}</div>
              {form.patientTel && <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{form.patientTel}</div>}
              {form.mutuelleNom && <div style={{ fontSize: 13, color: "#64748b" }}>Mutuelle : {form.mutuelleNom} ({form.mutuelleTaux}%)</div>}
            </div>

            <div style={{ ...glassSubtle, borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Équipement
              </div>
              {lignes.map(l => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid rgba(203,213,225,0.4)" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{LIGNE_TYPE_LABELS[l.type]}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{l.marque} {l.modele} — Cl.{l.classe}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{formatEuro(l.prixTotalTTC)}</div>
                    <div style={{ fontSize: 11, color: "#10b981" }}>SS -{formatEuro(l.priseEnChargeSS)}</div>
                    {l.priseEnChargeMutuelle > 0 && (
                      <div style={{ fontSize: 11, color: "#00C98A" }}>Mut. -{formatEuro(l.priseEnChargeMutuelle)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{ ...glassSubtle, borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                Récapitulatif financier
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                {[
                  { label: "Montant total TTC",       value: formatEuro(totalTTC),      color: "#1e293b" },
                  { label: "Prise en charge SS",       value: `- ${formatEuro(totalSS)}`, color: "#10b981" },
                  { label: "Prise en charge mutuelle", value: `- ${formatEuro(totalMutuelle)}`, color: "#00C98A" },
                  { label: "Reste à charge",           value: formatEuro(resteACharge),  color: resteACharge === 0 ? "#10b981" : "#f59e0b" },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "#64748b" }}>{row.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
              {resteACharge === 0 && (
                <div style={{ marginTop: 10, padding: "6px 12px", borderRadius: 8, background: "rgba(16,185,129,0.08)", color: "#10b981", fontSize: 12, fontWeight: 600, textAlign: "center" }}>
                  100% pris en charge — RAC 0 €
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, gap: 10 }}>
          <button
            onClick={step === 1 ? onClose : () => setStep(s => s - 1)}
            style={{ ...glassSubtle, padding: "9px 18px", borderRadius: 10, fontSize: 14, fontWeight: 500, color: "#475569", cursor: "pointer", border: "1.5px solid rgba(203,213,225,0.7)" }}
          >
            {step === 1 ? "Annuler" : "Retour"}
          </button>
          {step < 3 ? (
            <button
              onClick={goNext}
              style={{
                background: "#00C98A",
                boxShadow: "0 2px 12px rgba(0,201,138,0.30)",
                border: "none", padding: "9px 22px", borderRadius: 10,
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 14, fontWeight: 600, color: "white", cursor: "pointer",
              }}
            >
              Suivant <IconChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              style={{
                background: "#10b981",
                boxShadow: "0 2px 12px rgba(16,185,129,0.30)",
                border: "none", padding: "9px 22px", borderRadius: 10,
                fontSize: 14, fontWeight: 600, color: "white", cursor: "pointer",
              }}
            >
              Créer le devis
            </button>
          )}
        </div>
      </div>
    </DraggableWindow>
  );
}

/* ── Modes de règlement RAC ──────────────────────────────────────────────── */
const MODES_RAC = [
  { value: "CB",               label: "Carte bancaire" },
  { value: "Espèces",          label: "Espèces" },
  { value: "Chèque",           label: "Chèque" },
  { value: "Plusieurs fois",   label: "Paiement en plusieurs fois" },
  { value: "Geste commercial", label: "Geste commercial (RAC offert)" },
] as const;

const ECHEANCES_OPTIONS = [2, 3, 4, 6, 10, 12];

/* ── Devis card ──────────────────────────────────────────────────────────── */
function DevisCard({ d, onUpdate, onFacturer, relances, onRelanceSuccess }: { d: Devis; onUpdate?: (updated: Devis) => void; onFacturer?: (d: Devis) => void; relances: RelanceEntry[]; onRelanceSuccess: (msg: string) => void }) {
  const meta = STATUS_META[d.status];
  const initials = ((d.patientPrenom[0] ?? "") + (d.patientNom[0] ?? "")).toUpperCase();
  const [showRegl, setShowRegl] = useState(false);
  const [modeRegl, setModeRegl] = useState(d.modeReglementRAC ?? "");
  const [nbEch, setNbEch] = useState(d.nbEcheances ?? 3);
  const [raisonGeste, setRaisonGeste] = useState(d.raisonGeste ?? "");

  /* ── Relance logic ── */
  const RELANCE_STATUTS: DevisStatus[] = ["Brouillon", "Signé"];
  const needsRelance = RELANCE_STATUTS.includes(d.status);
  const joursDepuis = daysSince(d.date);
  const relanceRecente = relances.find(r => r.devisId === d.id && daysSince(r.date) < 7);
  const [relanceState, setRelanceState] = useState<"idle" | "sent">("idle");

  function handleRelancer() {
    const entry: RelanceEntry = {
      devisId: d.id,
      date: new Date().toISOString(),
      patientNom: d.patientNom,
      patientPrenom: d.patientPrenom,
    };
    saveRelance(entry);
    setRelanceState("sent");
    onRelanceSuccess(`Email de relance envoyé à ${d.patientPrenom} ${d.patientNom}`);
    setTimeout(() => setRelanceState("idle"), 5000);
  }

  const relanceBadge: import("react").ReactNode = (() => {
    if (!needsRelance || relanceRecente || relanceState !== "idle") return null;
    if (joursDepuis > 15) return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 999, background: "rgba(239,68,68,0.12)", color: "#dc2626", fontSize: 11, fontWeight: 700, border: "1px solid rgba(239,68,68,0.3)" }}>
        Relance nécessaire
      </span>
    );
    if (joursDepuis > 7) return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 999, background: "rgba(249,115,22,0.12)", color: "#ea580c", fontSize: 11, fontWeight: 700, border: "1px solid rgba(249,115,22,0.3)" }}>
        Sans réponse depuis {joursDepuis}j
      </span>
    );
    return null;
  })();

  const relanceDateBadge: import("react").ReactNode = relanceRecente ? (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 999, background: "rgba(148,163,184,0.13)", color: "#64748b", fontSize: 11, fontWeight: 600, border: "1px solid rgba(148,163,184,0.3)" }}>
      Relancé le {new Date(relanceRecente.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
    </span>
  ) : null;

  const relancerBtn: import("react").ReactNode = (() => {
    if (!needsRelance || relanceRecente) return null;
    if (relanceState === "sent") return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 999, background: "rgba(0,201,138,0.1)", color: "#047857", fontSize: 12, fontWeight: 600, border: "1px solid rgba(0,201,138,0.3)" }}>
        ✓ Relancé
      </span>
    );
    return (
      <button
        onClick={handleRelancer}
        style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 999, background: "rgba(0,201,138,0.10)", color: "#059669", fontSize: 12, fontWeight: 600, border: "1px solid rgba(0,201,138,0.3)", cursor: "pointer" }}
      >
        ↩ Relancer
      </button>
    );
  })();

  const isPlusieurs = modeRegl === "Plusieurs fois";
  const isGeste = modeRegl === "Geste commercial";
  const montantEch = isPlusieurs && nbEch > 0
    ? Math.ceil(d.resteACharge / nbEch * 100) / 100
    : 0;

  function handleSaveRegl() {
    const updated: Devis = {
      ...d,
      modeReglementRAC: modeRegl || undefined,
      nbEcheances: isPlusieurs ? nbEch : undefined,
      raisonGeste: isGeste ? raisonGeste : undefined,
      racRegle: !!modeRegl,
    };
    onUpdate?.(updated);
    setShowRegl(false);
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={glass}>
      <div className="flex items-start gap-3 p-5 pb-3">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: meta.bg, color: meta.color }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-800 truncate">
            {d.patientPrenom} {d.patientNom}
          </div>
          <div className="text-xs text-slate-500">{d.numero}</div>
          {d.mutuelleNom && <div className="text-xs text-slate-400">{d.mutuelleNom}</div>}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: meta.bg, color: meta.color }}
          >
            {d.status}
          </span>
          {relanceBadge}
          {relanceDateBadge}
        </div>
      </div>

      {/* Lignes summary */}
      <div className="px-5 py-2 border-t border-slate-100/60">
        {d.lignes.map(l => (
          <div key={l.id} className="text-xs text-slate-600 py-0.5 truncate">
            {l.marque} {l.modele} ({l.type === "appareil-droit" ? "OD" : l.type === "appareil-gauche" ? "OG" : l.type})
            {" — "}{formatEuro(l.prixTotalTTC)}
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="flex items-center justify-between gap-4 px-5 py-3 border-t border-slate-100/60">
        <div>
          <div className="text-xs text-slate-500">Total TTC</div>
          <div className="text-sm font-bold text-slate-800">{formatEuro(d.totalTTC)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-500">SS</div>
          <div className="text-sm font-semibold text-green-600">-{formatEuro(d.totalSS)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-500">Mutuelle</div>
          <div className="text-sm font-semibold text-[#00C98A]">-{formatEuro(d.totalMutuelle)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">RAC</div>
          {d.racRegle ? (
            <div className="text-sm font-bold" style={{ color: isGeste ? "#f59e0b" : "#10b981" }}>
              {d.modeReglementRAC === "Geste commercial" ? "Offert" : "Réglé ✓"}
            </div>
          ) : (
            <div className="text-sm font-bold" style={{ color: d.resteACharge === 0 ? "#10b981" : "#f59e0b" }}>
              {formatEuro(d.resteACharge)}
            </div>
          )}
        </div>
      </div>

      {/* Badge règlement si déjà enregistré */}
      {d.racRegle && d.modeReglementRAC && (
        <div className="px-5 py-2 border-t border-slate-100/60">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
            style={{
              background: d.modeReglementRAC === "Geste commercial" ? "rgba(245,158,11,0.10)" : "rgba(0,201,138,0.10)",
              color: d.modeReglementRAC === "Geste commercial" ? "#b45309" : "#047857",
            }}
          >
            {d.modeReglementRAC === "Geste commercial" ? "Geste commercial" : `✓ RAC réglé · ${d.modeReglementRAC}${d.nbEcheances ? ` (${d.nbEcheances}×${formatEuro(montantEch)})` : ""}`}
          </span>
          {d.raisonGeste && <span className="ml-2 text-xs text-slate-400">{d.raisonGeste}</span>}
        </div>
      )}

      {/* Section règlement RAC */}
      {!d.racRegle && d.resteACharge > 0 && (
        <div className="px-5 py-3 border-t border-slate-100/60">
          {!showRegl ? (
            <button
              onClick={() => setShowRegl(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: "rgba(245,158,11,0.10)", color: "#b45309", border: "1px solid rgba(245,158,11,0.25)" }}
            >
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="8" cy="8" r="6.5" />
                <path d="M8 5v3.5l2 2" />
              </svg>
              Enregistrer le règlement RAC
            </button>
          ) : (
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-slate-600 mb-1">
                Règlement du RAC · {formatEuro(d.resteACharge)}
              </div>
              <select
                value={modeRegl}
                onChange={e => setModeRegl(e.target.value)}
                className="w-full text-xs rounded-lg px-3 py-2 border border-slate-200 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-[#00C98A]/30"
              >
                <option value="">— Mode de règlement —</option>
                {MODES_RAC.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>

              {isPlusieurs && (
                <div className="rounded-xl p-3 text-xs space-y-2" style={{ background: "rgba(0,201,138,0.06)", border: "1px solid rgba(0,201,138,0.20)" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Nombre d&apos;échéances :</span>
                    <select
                      value={nbEch}
                      onChange={e => setNbEch(Number(e.target.value))}
                      className="rounded-lg px-2 py-1 border border-slate-200 bg-white text-slate-700 outline-none text-xs"
                    >
                      {ECHEANCES_OPTIONS.map(n => <option key={n} value={n}>{n} fois</option>)}
                    </select>
                  </div>
                  <div className="font-semibold" style={{ color: "#00C98A" }}>
                    → {nbEch} × {formatEuro(montantEch)} = {formatEuro(d.resteACharge)}
                  </div>
                </div>
              )}

              {isGeste && (
                <div className="rounded-xl p-3 text-xs space-y-2" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)" }}>
                  <div className="font-semibold text-amber-700">RAC de {formatEuro(d.resteACharge)} offert au patient</div>
                  <input
                    value={raisonGeste}
                    onChange={e => setRaisonGeste(e.target.value)}
                    placeholder="Motif (facultatif) : fidélisation, situation…"
                    className="w-full rounded-lg px-3 py-1.5 border border-amber-200 bg-white text-slate-700 outline-none text-xs"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSaveRegl}
                  disabled={!modeRegl}
                  className="flex-1 text-xs font-semibold py-1.5 rounded-lg text-white transition-opacity disabled:opacity-40"
                  style={{ background: "#00C98A" }}
                >
                  Confirmer
                </button>
                <button
                  onClick={() => setShowRegl(false)}
                  className="text-xs font-semibold py-1.5 px-3 rounded-lg text-slate-500 border border-slate-200 bg-white"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-100/60 text-xs text-slate-400">
        <span>Émis le {new Date(d.date).toLocaleDateString("fr-FR")}</span>
        <span>Valide jusqu&apos;au {new Date(d.dateValidite).toLocaleDateString("fr-FR")}</span>
      </div>

      <div className="px-5 py-2.5 border-t border-slate-100/60 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => printDevisAudition(d as unknown as DevisAuditionPdf, loadStoreConfig())}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: "rgba(0,201,138,0.10)", color: "#00C98A" }}
        >
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="2" y="5" width="12" height="8" rx="1.5" />
            <path d="M5 5V3h6v2" />
            <path d="M5 9h6M5 11h4" strokeWidth="1.2" />
          </svg>
          PDF normalisé
        </button>
        {d.status === "Livré" && onFacturer && (
          <button
            onClick={() => onFacturer(d)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors text-white"
            style={{ background: "#00C98A", boxShadow: "0 2px 6px rgba(0,201,138,0.25)" }}
          >
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 4h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/>
              <path d="M5 8h6M5 10h4"/>
            </svg>
            Créer la facture →
          </button>
        )}
        {relancerBtn}
      </div>
    </div>
  );
}

/* ── localStorage key for factures ──────────────────────────────────────── */
const LS_FACTURES = "thor_pro_audition_factures";

function createFactureFromDevis(d: Devis): void {
  try {
    const raw = localStorage.getItem(LS_FACTURES);
    const existing = raw ? JSON.parse(raw) : [];
    const year = new Date().getFullYear();
    const nextNum = existing.length + 1;
    const facture = {
      id: `fac_${Date.now()}`,
      numero: `FAC-AUD-${year}-${String(nextNum).padStart(3, "0")}`,
      devisId: d.id,
      devisNumero: d.numero,
      patientNom: d.patientNom,
      patientPrenom: d.patientPrenom,
      mutuelleNom: d.mutuelleNom,
      dateFacture: new Date().toISOString().split("T")[0],
      lignes: d.lignes.map(l => ({
        designation: l.designation,
        marque: l.marque,
        modele: l.modele,
        type: l.type,
        classe: l.classe,
        quantite: l.quantite,
        prixTTC: l.prixTotalTTC,
        tauxTVA: 5.5,
        priseEnChargeSS: l.priseEnChargeSS,
        priseEnChargeMutuelle: l.priseEnChargeMutuelle,
        resteACharge: l.resteACharge,
      })),
      totalTTC: d.totalTTC,
      totalSS: d.totalSS,
      totalMutuelle: d.totalMutuelle,
      resteACharge: d.resteACharge,
      racRegle: d.racRegle ?? false,
      modePaiement: d.modeReglementRAC as string | undefined,
      status: "En attente" as const,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(LS_FACTURES, JSON.stringify([facture, ...existing]));
  } catch { /* noop */ }
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function DevisAuditionPage() {
  return <Suspense fallback={null}><DevisAuditionContent /></Suspense>;
}

function DevisAuditionContent() {
  const searchParams = useSearchParams();
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState<DevisStatus | "Tous">("Tous");
  const [filterRelancer, setFilterRelancer] = useState(false);
  const [relances, setRelances]     = useState<RelanceEntry[]>([]);
  const [modalOpen, setModalOpen]   = useState(false);
  const [storedDevis, setStoredDevis] = useState<Devis[]>([]);
  const [toast, setToast]           = useState<string | null>(null);
  const [prefill, setPrefill]       = useState<Partial<WizardForm> | undefined>(undefined);

  useEffect(() => {
    setStoredDevis(loadDevis());
    setRelances(loadRelances());
  }, []);

  function refreshRelances() {
    setRelances(loadRelances());
  }

  /* Auto-open wizard with pre-filled data from essai or calculateur */
  useEffect(() => {
    const from = searchParams.get("from");
    if (!from) return;

    if (from === "essai") {
      const nom    = searchParams.get("nom") ?? "";
      const prenom = searchParams.get("prenom") ?? "";
      const tel    = searchParams.get("tel") ?? "";
      const appareil = searchParams.get("appareil") ?? "";
      const classeStr = searchParams.get("classe") ?? "2";
      const oreilles  = searchParams.get("oreilles") ?? "binaural";

      // Parse appareil text: first word = marque, rest = modele
      const parts = appareil.trim().split(" ");
      const marque = parts[0] ?? "Phonak";
      const modele = parts.slice(1).join(" ") || "";

      setPrefill({
        patientNom: nom,
        patientPrenom: prenom,
        patientTel: tel,
        marque,
        modele,
        classe: (classeStr === "1" ? 1 : 2) as 1 | 2,
        oreille: (["OD","OG","binaural"].includes(oreilles) ? oreilles : "binaural") as WizardForm["oreille"],
      });
      setModalOpen(true);
      setToast(`Devis pré-rempli depuis l'essai de ${prenom} ${nom}`);
    }

    if (from === "calculateur") {
      const marque    = searchParams.get("marque") ?? "Phonak";
      const modele    = searchParams.get("modele") ?? "";
      const classeStr = searchParams.get("classe") ?? "2";
      const prix      = searchParams.get("prix") ?? "";

      setPrefill({
        marque,
        modele,
        classe: (classeStr === "1" ? 1 : 2) as 1 | 2,
        oreille: "binaural",
        prixOD: prix,
        prixOG: prix,
      });
      setModalOpen(true);
      setToast(`Devis pré-rempli depuis le calculateur — ${marque} ${modele}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCreated(d: Devis) {
    const updated = [d, ...storedDevis];
    setStoredDevis(updated);
    saveDevis(updated);
    setModalOpen(false);
  }

  function handleUpdate(updated: Devis) {
    const next = storedDevis.map(d => d.id === updated.id ? updated : d);
    // Si non trouvé dans stored (c'est un mock), l'ajouter en stored
    const found = storedDevis.some(d => d.id === updated.id);
    const final = found ? next : [updated, ...storedDevis];
    setStoredDevis(final);
    saveDevis(final);
  }

  const allDevis = [...storedDevis, ...MOCK_DEVIS];

  const RELANCE_STATUTS_FILTER: DevisStatus[] = ["Brouillon", "Signé"];

  const filtered = allDevis.filter(d => {
    const q = search.toLowerCase();
    const matchQ = `${d.patientPrenom} ${d.patientNom} ${d.numero}`.toLowerCase().includes(q);
    const matchS = statusFilter === "Tous" || d.status === statusFilter;
    if (filterRelancer) {
      if (!RELANCE_STATUTS_FILTER.includes(d.status)) return false;
      if (daysSince(d.date) <= 7) return false;
      const hasRecentRelance = relances.some(r => r.devisId === d.id && daysSince(r.date) < 7);
      if (hasRecentRelance) return false;
    }
    return matchQ && matchS;
  });

  const totalDevis = allDevis.length;
  const caTotalTTC = allDevis.reduce((a, d) => a + d.totalTTC, 0);
  const caSignes   = allDevis.filter(d => d.status !== "Brouillon" && d.status !== "Annulé").length;
  const racMoyen   = allDevis.length > 0
    ? Math.round(allDevis.reduce((a, d) => a + d.resteACharge, 0) / allDevis.length)
    : 0;

  const kpis = [
    { label: "Total devis",     value: String(totalDevis),    color: "#00C98A" },
    { label: "CA TTC total",    value: formatEuro(caTotalTTC), color: "#10b981" },
    { label: "Devis acceptés",  value: String(caSignes),       color: "#f59e0b" },
    { label: "RAC moyen",       value: formatEuro(racMoyen),   color: "#64748b" },
  ];

  const STATUTS: Array<DevisStatus | "Tous"> = ["Tous", "Brouillon", "Signé", "Commandé", "Prêt", "Livré", "Facturé"];

  function handleFacturer(d: Devis) {
    createFactureFromDevis(d);
    handleUpdate({ ...d, status: "Facturé" });
    setToast(`Facture créée pour ${d.patientPrenom} ${d.patientNom} — visible dans Facturation`);
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl text-sm font-medium text-white shadow-lg"
          style={{ background: "rgba(30,30,40,0.92)", backdropFilter: "blur(12px)" }}
          onClick={() => setToast(null)}
        >
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800 h-title">Devis &amp; Factures</h1>
          <p className="mt-1 text-sm text-slate-500">Devis normalisés avec remboursements SS et mutuelle</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] text-white px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: "#00C98A", boxShadow: "0 4px 12px rgba(0,201,138,0.28)" }}
        >
          <IconPlus className="w-4 h-4" />
          Nouveau devis
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="rounded-2xl p-4" style={glass}>
            <div className="text-xl font-bold" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs text-slate-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* SS info banner */}
      <div
        className="flex items-start gap-3 rounded-2xl px-4 py-3 text-sm"
        style={{ background: "rgba(0,201,138,0.06)", border: "1px solid rgba(0,201,138,0.20)", color: "#0369a1" }}
      >
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8h.01M12 12v4"/></svg>
        <div>
          <strong>Remboursement 100% Santé :</strong> Classe 1 et Classe 2 — {formatEuro(SS_PAR_APPAREIL)} par appareil pris en charge par la Sécurité Sociale.
          Le reste est couvert par la mutuelle selon votre contrat.
        </div>
      </div>

      {/* Search + status filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher patient, numéro…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-[var(--radius-large)] pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#00C98A]/30 transition bg-transparent"
            style={glass}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUTS.map(s => {
          const meta = s !== "Tous" ? STATUS_META[s] : null;
          const isActive = statusFilter === s && !filterRelancer;
          return (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setFilterRelancer(false); }}
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
        <button
          onClick={() => { setFilterRelancer(r => !r); setStatusFilter("Tous"); }}
          className="rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold transition-all"
          style={filterRelancer
            ? { background: "linear-gradient(135deg, #059669, #047857)", color: "white" }
            : { background: "rgba(0,201,138,0.10)", color: "#059669", border: "1px solid rgba(0,201,138,0.35)" }}
        >
          ↩ À relancer
        </button>
      </div>

      {/* Devis grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl p-10 text-center text-sm text-slate-400" style={glass}>
          Aucun devis ne correspond à vos filtres.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(d => (
            <DevisCard
              key={d.id}
              d={d}
              onUpdate={handleUpdate}
              onFacturer={handleFacturer}
              relances={relances}
              onRelanceSuccess={msg => { refreshRelances(); setToast(msg); setTimeout(() => setToast(null), 3000); }}
            />
          ))}
        </div>
      )}

      <DevisWizard
        open={modalOpen}
        onClose={() => { setModalOpen(false); setPrefill(undefined); }}
        onCreated={handleCreated}
        allDevis={allDevis}
        initialForm={prefill}
      />
    </div>
  );
}
