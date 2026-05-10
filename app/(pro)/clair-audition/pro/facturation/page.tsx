"use client";

import { useState, useEffect, useCallback, type CSSProperties } from "react";
import { loadStoreConfig } from "@/lib/storeConfig";
import DraggableWindow from "@/components/ui/DraggableWindow";
import { downloadElementAsPdf, factureFilename } from "@/lib/generatePdf";

/* ═══════════════════════════════════════════════════════════════════════
   STYLE TOKENS
═══════════════════════════════════════════════════════════════════════ */
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
const inputStyle: CSSProperties = {
  padding: "9px 12px",
  borderRadius: 10,
  border: "1px solid rgba(148,163,184,0.35)",
  background: "var(--glass-strong-bg)",
  fontSize: 13,
  color: "#1e293b",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

/* ═══════════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════════ */
type FactureStatus = "En attente" | "Payée" | "Partiellement payée" | "Annulée";
type ModePaiement = "Carte" | "Espèces" | "Chèque" | "Virement" | "Tiers payant mutuelle" | "Financement";

interface FactureLigne {
  designation: string;
  marque: string;
  modele: string;
  type: "appareil-droit" | "appareil-gauche" | "accessoire" | "pile" | "entretien";
  lppr?: string;
  classe: 1 | 2;
  quantite: number;
  prixTTC: number;
  tauxTVA: 5.5 | 20;
  priseEnChargeSS: number;
  priseEnChargeMutuelle: number;
  resteACharge: number;
}

interface Facture {
  id: string;
  numero: string;
  devisId?: string;
  devisNumero?: string;
  patientNom: string;
  patientPrenom: string;
  mutuelleNom?: string;
  dateFacture: string;
  lignes: FactureLigne[];
  totalTTC: number;
  totalSS: number;
  totalMutuelle: number;
  resteACharge: number;
  racRegle: boolean;
  modePaiement?: ModePaiement;
  nbEcheances?: number;
  status: FactureStatus;
  notes?: string;
  createdAt: string;
}

interface DevisMin {
  id: string;
  numero?: string;
  patientNom: string;
  patientPrenom: string;
  mutuelleNom?: string;
  status: string;
  totalTTC: number;
}

/* ═══════════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════════ */
const LS_KEY = "thor_pro_audition_factures";
const LS_DEVIS = "thor_pro_audition_devis";

const STATUS_CONFIG: Record<FactureStatus, { bg: string; text: string; dot: string }> = {
  "En attente":          { bg: "rgba(245,158,11,0.12)",  text: "#b45309", dot: "#f59e0b" },
  "Payée":               { bg: "rgba(16,185,129,0.12)",  text: "#047857", dot: "#10b981" },
  "Partiellement payée": { bg: "rgba(99,102,241,0.12)",  text: "#4338ca", dot: "#6366f1" },
  "Annulée":             { bg: "rgba(239,68,68,0.12)",   text: "#b91c1c", dot: "#ef4444" },
};

const TYPE_LABELS: Record<FactureLigne["type"], string> = {
  "appareil-droit":  "App. droit",
  "appareil-gauche": "App. gauche",
  "accessoire":      "Accessoire",
  "pile":            "Pile",
  "entretien":       "Entretien",
};

/* ═══════════════════════════════════════════════════════════════════════
   MOCK DATA
═══════════════════════════════════════════════════════════════════════ */
const MOCK_FACTURES: Facture[] = [
  {
    id: "f1", numero: "FAC-2026-001", patientNom: "Moreau", patientPrenom: "Jean-Paul",
    mutuelleNom: "MGEN", devisNumero: "DEV-2026-001",
    dateFacture: "2026-03-10",
    lignes: [
      { designation: "Phonak Lumity 90 R", marque: "Phonak", modele: "Lumity 90 R", type: "appareil-droit", lppr: "2185579", classe: 2, quantite: 1, prixTTC: 3180, tauxTVA: 5.5, priseEnChargeSS: 1700, priseEnChargeMutuelle: 900, resteACharge: 580 },
      { designation: "Phonak Lumity 90 R", marque: "Phonak", modele: "Lumity 90 R", type: "appareil-gauche", lppr: "2185579", classe: 2, quantite: 1, prixTTC: 3180, tauxTVA: 5.5, priseEnChargeSS: 1700, priseEnChargeMutuelle: 900, resteACharge: 580 },
    ],
    totalTTC: 6360, totalSS: 3400, totalMutuelle: 1800, resteACharge: 1160,
    racRegle: true, modePaiement: "Carte", status: "Payée", createdAt: "2026-03-10T10:00:00.000Z",
  },
  {
    id: "f2", numero: "FAC-2026-002", patientNom: "Lefranc", patientPrenom: "Simone",
    mutuelleNom: "Harmonie Mutuelle", devisNumero: "DEV-2026-002",
    dateFacture: "2026-03-15",
    lignes: [
      { designation: "Oticon Intent 1 R", marque: "Oticon", modele: "Intent 1 R", type: "appareil-droit", lppr: "2289418", classe: 2, quantite: 1, prixTTC: 2890, tauxTVA: 5.5, priseEnChargeSS: 1700, priseEnChargeMutuelle: 700, resteACharge: 490 },
      { designation: "Oticon Intent 1 R", marque: "Oticon", modele: "Intent 1 R", type: "appareil-gauche", lppr: "2289418", classe: 2, quantite: 1, prixTTC: 2890, tauxTVA: 5.5, priseEnChargeSS: 1700, priseEnChargeMutuelle: 700, resteACharge: 490 },
    ],
    totalTTC: 5780, totalSS: 3400, totalMutuelle: 1400, resteACharge: 980,
    racRegle: false, modePaiement: "Financement", nbEcheances: 12, status: "En attente", createdAt: "2026-03-15T14:00:00.000Z",
  },
  {
    id: "f3", numero: "FAC-2026-003", patientNom: "Bernard", patientPrenom: "Lucie",
    mutuelleNom: "Malakoff Humanis", devisNumero: "DEV-2026-003",
    dateFacture: "2026-02-20",
    lignes: [
      { designation: "Widex Moment Sheer 440 R", marque: "Widex", modele: "Moment Sheer 440 R", type: "appareil-droit", lppr: "2278900", classe: 1, quantite: 1, prixTTC: 1450, tauxTVA: 5.5, priseEnChargeSS: 1450, priseEnChargeMutuelle: 0, resteACharge: 0 },
    ],
    totalTTC: 1450, totalSS: 1450, totalMutuelle: 0, resteACharge: 0,
    racRegle: true, status: "Payée", createdAt: "2026-02-20T09:00:00.000Z",
  },
  {
    id: "f4", numero: "FAC-2026-004", patientNom: "Dupuis", patientPrenom: "Robert",
    mutuelleNom: "AXA Santé",
    dateFacture: "2026-03-22",
    lignes: [
      { designation: "Starkey Evolv AI 2400 R", marque: "Starkey", modele: "Evolv AI 2400 R", type: "appareil-droit", lppr: "2185580", classe: 2, quantite: 1, prixTTC: 2420, tauxTVA: 5.5, priseEnChargeSS: 1700, priseEnChargeMutuelle: 400, resteACharge: 320 },
    ],
    totalTTC: 2420, totalSS: 1700, totalMutuelle: 400, resteACharge: 320,
    racRegle: false, status: "Partiellement payée", createdAt: "2026-03-22T11:00:00.000Z",
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════ */
function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}
function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}
function isoToday() {
  return new Date().toISOString().slice(0, 10);
}
function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
function genNumero(existing: Facture[]): string {
  const year = new Date().getFullYear();
  const nums = existing
    .map(f => { const m = f.numero.match(/FAC-\d{4}-(\d+)/); return m ? parseInt(m[1], 10) : 0; })
    .filter(n => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `FAC-${year}-${String(next).padStart(3, "0")}`;
}
function exportCSV(factures: Facture[]) {
  const headers = ["Numéro", "Date", "Patient", "Mutuelle", "Total TTC", "SS", "Mutuelle", "RAC", "Mode paiement", "Statut"];
  const rows = factures.map(f => [
    f.numero,
    fmtDate(f.dateFacture),
    `${f.patientPrenom} ${f.patientNom}`,
    f.mutuelleNom ?? "",
    f.totalTTC.toFixed(2),
    f.totalSS.toFixed(2),
    f.totalMutuelle.toFixed(2),
    f.resteACharge.toFixed(2),
    f.modePaiement ?? "",
    f.status,
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `factures-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function calcLigneTotals(l: FactureLigne) {
  return {
    ss: l.priseEnChargeSS * l.quantite,
    mut: l.priseEnChargeMutuelle * l.quantite,
    rac: l.resteACharge * l.quantite,
    ttc: l.prixTTC * l.quantite,
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════════════════ */
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: "#10b981",
      color: "#fff", borderRadius: 14, padding: "12px 20px",
      fontSize: 14, fontWeight: 600, boxShadow: "0 8px 32px rgba(16,185,129,0.35)",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <span>✓</span><span>{message}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   STATUS BADGE
═══════════════════════════════════════════════════════════════════════ */
function StatusBadge({ status }: { status: FactureStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: cfg.bg, color: cfg.text,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block", flexShrink: 0 }} />
      {status}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MODAL CREATION / EDITION
═══════════════════════════════════════════════════════════════════════ */
function FactureModal({
  initial,
  allFactures,
  onSave,
  onClose,
}: {
  initial?: Facture;
  allFactures: Facture[];
  onSave: (f: Facture) => void;
  onClose: () => void;
}) {
  const empty: FactureLigne = {
    designation: "", marque: "", modele: "", type: "appareil-droit",
    lppr: "", classe: 2, quantite: 1,
    prixTTC: 0, tauxTVA: 5.5, priseEnChargeSS: 0, priseEnChargeMutuelle: 0, resteACharge: 0,
  };

  const [patientNom, setPatientNom] = useState(initial?.patientNom ?? "");
  const [patientPrenom, setPatientPrenom] = useState(initial?.patientPrenom ?? "");
  const [mutuelleNom, setMutuelleNom] = useState(initial?.mutuelleNom ?? "");
  const [dateFacture, setDateFacture] = useState(initial?.dateFacture ?? isoToday());
  const [lignes, setLignes] = useState<FactureLigne[]>(initial?.lignes ?? [{ ...empty }]);
  const [status, setStatus] = useState<FactureStatus>(initial?.status ?? "En attente");
  const [modePaiement, setModePaiement] = useState<ModePaiement | "">(initial?.modePaiement ?? "");
  const [nbEcheances, setNbEcheances] = useState(initial?.nbEcheances ?? 1);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [devisNumero, setDevisNumero] = useState(initial?.devisNumero ?? "");

  // Compute totals from lignes
  const totalTTC = lignes.reduce((s, l) => s + l.prixTTC * l.quantite, 0);
  const totalSS = lignes.reduce((s, l) => s + l.priseEnChargeSS * l.quantite, 0);
  const totalMutuelle = lignes.reduce((s, l) => s + l.priseEnChargeMutuelle * l.quantite, 0);
  const resteACharge = lignes.reduce((s, l) => s + l.resteACharge * l.quantite, 0);

  function updateLigne(i: number, patch: Partial<FactureLigne>) {
    setLignes(prev => prev.map((l, idx) => {
      if (idx !== i) return l;
      const updated = { ...l, ...patch };
      // Recalculate RAC automatically
      updated.resteACharge = Math.max(0, updated.prixTTC - updated.priseEnChargeSS - updated.priseEnChargeMutuelle);
      return updated;
    }));
  }

  function handleSave() {
    if (!patientNom || !patientPrenom || !dateFacture) return;
    const facture: Facture = {
      id: initial?.id ?? genId(),
      numero: initial?.numero ?? genNumero(allFactures),
      patientNom, patientPrenom, mutuelleNom: mutuelleNom || undefined,
      dateFacture, lignes,
      totalTTC, totalSS, totalMutuelle, resteACharge,
      racRegle: status === "Payée",
      modePaiement: modePaiement || undefined,
      nbEcheances: modePaiement === "Financement" ? nbEcheances : undefined,
      status, notes: notes || undefined,
      devisNumero: devisNumero || undefined,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    onSave(facture);
  }

  const fieldLabel: CSSProperties = { fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" };
  const row2: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        ...glass, borderRadius: 20, width: "100%", maxWidth: 760,
        maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(148,163,184,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", margin: 0 }}>
              {initial ? `Modifier ${initial.numero}` : "Nouvelle facture"}
            </h2>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>TVA 5,5% sur aides auditives — Remboursement SS max 1 700 € / appareil</p>
          </div>
          <button onClick={onClose} style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Patient */}
          <div style={{ ...glassSubtle, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#00C98A", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Patient</p>
            <div style={row2}>
              <div><label style={fieldLabel}>Nom *</label><input style={inputStyle} value={patientNom} onChange={e => setPatientNom(e.target.value)} placeholder="Moreau" /></div>
              <div><label style={fieldLabel}>Prénom *</label><input style={inputStyle} value={patientPrenom} onChange={e => setPatientPrenom(e.target.value)} placeholder="Jean-Paul" /></div>
            </div>
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div><label style={fieldLabel}>Mutuelle</label><input style={inputStyle} value={mutuelleNom} onChange={e => setMutuelleNom(e.target.value)} placeholder="MGEN" /></div>
              <div><label style={fieldLabel}>Date facture *</label><input style={inputStyle} type="date" value={dateFacture} onChange={e => setDateFacture(e.target.value)} /></div>
              <div><label style={fieldLabel}>N° devis lié</label><input style={inputStyle} value={devisNumero} onChange={e => setDevisNumero(e.target.value)} placeholder="DEV-2026-001" /></div>
            </div>
          </div>

          {/* Lignes */}
          <div style={{ ...glassSubtle, borderRadius: 14, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#00C98A", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Lignes de facturation</p>
              <button
                onClick={() => setLignes(prev => [...prev, { ...empty }])}
                style={{ fontSize: 12, fontWeight: 600, color: "#00C98A", background: "rgba(0,201,138,0.1)", border: "1px solid rgba(0,201,138,0.25)", borderRadius: 8, padding: "4px 12px", cursor: "pointer" }}
              >
                + Ajouter ligne
              </button>
            </div>
            {lignes.map((l, i) => (
              <div key={i} style={{ background: "var(--glass-subtle-bg)", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 12, padding: 12, marginBottom: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px", gap: 8, marginBottom: 8 }}>
                  <div><label style={fieldLabel}>Désignation</label><input style={inputStyle} value={l.designation} onChange={e => updateLigne(i, { designation: e.target.value })} placeholder="Phonak Lumity 90 R" /></div>
                  <div><label style={fieldLabel}>Marque</label><input style={inputStyle} value={l.marque} onChange={e => updateLigne(i, { marque: e.target.value })} placeholder="Phonak" /></div>
                  <div>
                    <label style={fieldLabel}>Type</label>
                    <select style={inputStyle} value={l.type} onChange={e => updateLigne(i, { type: e.target.value as FactureLigne["type"] })}>
                      <option value="appareil-droit">App. droit</option>
                      <option value="appareil-gauche">App. gauche</option>
                      <option value="accessoire">Accessoire</option>
                      <option value="pile">Pile</option>
                      <option value="entretien">Entretien</option>
                    </select>
                  </div>
                  <div>
                    <label style={fieldLabel}>Classe</label>
                    <select style={inputStyle} value={l.classe} onChange={e => updateLigne(i, { classe: Number(e.target.value) as 1 | 2 })}>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "60px 100px 80px 100px 100px 100px auto", gap: 8, alignItems: "end" }}>
                  <div><label style={fieldLabel}>Qté</label><input style={inputStyle} type="number" min={1} value={l.quantite} onChange={e => updateLigne(i, { quantite: Math.max(1, Number(e.target.value)) })} /></div>
                  <div><label style={fieldLabel}>Prix TTC (€)</label><input style={inputStyle} type="number" value={l.prixTTC} onChange={e => updateLigne(i, { prixTTC: Number(e.target.value) })} /></div>
                  <div>
                    <label style={fieldLabel}>TVA</label>
                    <select style={inputStyle} value={l.tauxTVA} onChange={e => updateLigne(i, { tauxTVA: Number(e.target.value) as 5.5 | 20 })}>
                      <option value={5.5}>5,5%</option>
                      <option value={20}>20%</option>
                    </select>
                  </div>
                  <div><label style={fieldLabel}>PC SS (€)</label><input style={inputStyle} type="number" value={l.priseEnChargeSS} onChange={e => updateLigne(i, { priseEnChargeSS: Number(e.target.value) })} /></div>
                  <div><label style={fieldLabel}>PC Mutuelle (€)</label><input style={inputStyle} type="number" value={l.priseEnChargeMutuelle} onChange={e => updateLigne(i, { priseEnChargeMutuelle: Number(e.target.value) })} /></div>
                  <div>
                    <label style={fieldLabel}>RAC (€)</label>
                    <input style={{ ...inputStyle, background: "rgba(0,201,138,0.06)", fontWeight: 600 }} value={l.resteACharge.toFixed(2)} readOnly />
                  </div>
                  <div style={{ paddingBottom: 2 }}>
                    {lignes.length > 1 && (
                      <button onClick={() => setLignes(prev => prev.filter((_, idx) => idx !== i))} style={{ fontSize: 18, color: "#ef4444", background: "none", border: "none", cursor: "pointer", lineHeight: 1, padding: "6px 4px" }}>×</button>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <label style={fieldLabel}>LPPR</label>
                  <input style={{ ...inputStyle, width: 160 }} value={l.lppr ?? ""} onChange={e => updateLigne(i, { lppr: e.target.value })} placeholder="2185579" />
                </div>
              </div>
            ))}
            {/* Totaux */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 8 }}>
              {[
                { label: "Total TTC", value: fmt(totalTTC), color: "#1e293b" },
                { label: "PC Sécu", value: fmt(totalSS), color: "#0891b2" },
                { label: "PC Mutuelle", value: fmt(totalMutuelle), color: "#7c3aed" },
                { label: "Reste à charge", value: fmt(resteACharge), color: "#00C98A" },
              ].map(kpi => (
                <div key={kpi.label} style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>{kpi.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Paiement & Statut */}
          <div style={{ ...glassSubtle, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#00C98A", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Règlement</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={fieldLabel}>Statut</label>
                <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value as FactureStatus)}>
                  <option>En attente</option>
                  <option>Payée</option>
                  <option>Partiellement payée</option>
                  <option>Annulée</option>
                </select>
              </div>
              <div>
                <label style={fieldLabel}>Mode de paiement RAC</label>
                <select style={inputStyle} value={modePaiement} onChange={e => setModePaiement(e.target.value as ModePaiement | "")}>
                  <option value="">—</option>
                  <option>Carte</option>
                  <option>Espèces</option>
                  <option>Chèque</option>
                  <option>Virement</option>
                  <option>Tiers payant mutuelle</option>
                  <option>Financement</option>
                </select>
              </div>
              {modePaiement === "Financement" && (
                <div>
                  <label style={fieldLabel}>Nombre d&apos;échéances</label>
                  <input style={inputStyle} type="number" min={2} max={60} value={nbEcheances} onChange={e => setNbEcheances(Number(e.target.value))} />
                </div>
              )}
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={fieldLabel}>Notes</label>
              <textarea
                style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
                value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Remarques, observations…"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(148,163,184,0.15)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.3)", background: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>
            Annuler
          </button>
          <button onClick={handleSave} style={{ padding: "9px 24px", borderRadius: 10, border: "none", background: "#10b981", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 2px 8px rgba(16,185,129,0.30)" }}>
            {initial ? "Enregistrer" : "Créer la facture"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MODAL DEVIS PICKER
═══════════════════════════════════════════════════════════════════════ */
function DevisPickerModal({
  allFactures,
  onSelect,
  onClose,
}: {
  allFactures: Facture[];
  onSelect: (d: DevisMin) => void;
  onClose: () => void;
}) {
  const [devis, setDevis] = useState<DevisMin[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_DEVIS);
      if (raw) {
        const all = JSON.parse(raw) as DevisMin[];
        const facturezNums = new Set(allFactures.map(f => f.devisNumero).filter(Boolean));
        setDevis(all.filter(d => d.status === "Livré" && !facturezNums.has(d.numero)));
      }
    } catch { /* ignore */ }
  }, [allFactures]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9100, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ ...glass, borderRadius: 20, width: 480, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(148,163,184,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: 0 }}>Créer depuis un devis</h2>
          <button onClick={onClose} style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <div style={{ padding: 16, maxHeight: 400, overflowY: "auto" }}>
          {devis.length === 0 ? (
            <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, padding: "24px 0" }}>
              Aucun devis &quot;Livré&quot; sans facture trouvé dans le localStorage.
            </p>
          ) : devis.map(d => (
            <button
              key={d.id}
              onClick={() => onSelect(d)}
              style={{ width: "100%", textAlign: "left", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(148,163,184,0.15)", background: "var(--glass-subtle-bg)", marginBottom: 8, cursor: "pointer" }}
            >
              <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>{d.numero ?? d.id}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{d.patientPrenom} {d.patientNom} — {d.totalTTC?.toLocaleString("fr-FR")} €</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PRINT MODAL
═══════════════════════════════════════════════════════════════════════ */
function RowPrint({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: bold ? 700 : 400, color: color ?? "#1e293b", padding: "2px 0" }}>
      <span style={{ color: bold ? "#1e293b" : "#475569" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function PrintModal({ facture, onClose }: { facture: Facture; onClose: () => void }) {
  const cfg = loadStoreConfig();
  const adresse = [cfg.adresse, cfg.codePostal && cfg.ville ? `${cfg.codePostal} ${cfg.ville}` : ""].filter(Boolean).join(", ");
  const [pdfLoading, setPdfLoading] = useState(false);

  async function handleDownloadPdf() {
    setPdfLoading(true);
    try {
      await downloadElementAsPdf(
        "aud-facture-print",
        factureFilename(facture.numero, facture.patientNom)
      );
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <>
      <DraggableWindow
        title="Facture audioprothèse"
        badge={facture.numero}
        onClose={onClose}
        defaultWidth={860}
        defaultHeight={700}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              style={{ padding: "5px 14px", borderRadius: 8, border: "none", background: pdfLoading ? "#94a3b8" : "#00C98A", color: "#fff", fontSize: 12, fontWeight: 600, cursor: pdfLoading ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 5 }}
            >
              {pdfLoading ? "Génération…" : "Télécharger PDF"}
            </button>
            <button
              onClick={() => window.print()}
              style={{ padding: "5px 14px", borderRadius: 8, border: "1px solid rgba(0,201,138,0.35)", background: "rgba(0,201,138,0.08)", color: "#059669", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Imprimer
            </button>
          </div>
        }
      >
        <div style={{ background: "var(--glass-card-bg)", padding: 24 }}>
          <div id="aud-facture-print" style={{ background: "#fff", padding: 40, borderRadius: 12, fontFamily: "'Inter', -apple-system, sans-serif", fontSize: 13, color: "#1e293b", lineHeight: 1.6 }}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>{cfg.nom}</div>
                {adresse && <div style={{ fontSize: 12, color: "#475569" }}>{adresse}</div>}
                {cfg.telephone && <div style={{ fontSize: 12, color: "#475569" }}>Tél : {cfg.telephone}</div>}
                {cfg.siret && <div style={{ fontSize: 12, color: "#475569" }}>SIRET : {cfg.siret}</div>}
                {cfg.adeli && <div style={{ fontSize: 12, color: "#475569" }}>N° ADELI : {cfg.adeli}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#00C98A", marginBottom: 4 }}>FACTURE</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{facture.numero}</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>Date : {fmtDate(facture.dateFacture)}</div>
                {facture.devisNumero && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Réf. devis : {facture.devisNumero}</div>}
              </div>
            </div>

            {/* Patient */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 18px", marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>Patient</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{facture.patientPrenom} {facture.patientNom}</div>
              {facture.mutuelleNom && <div style={{ fontSize: 12, color: "#475569" }}>Mutuelle : {facture.mutuelleNom}</div>}
            </div>

            {/* Lines */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                  {["Désignation / Appareil", "LPPR", "Cl.", "Qté", "Prix TTC", "TVA", "PC SS", "PC Mut.", "RAC"].map(h => (
                    <th key={h} style={{ padding: "7px 6px", fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", textAlign: h === "Désignation / Appareil" ? "left" : "right" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {facture.lignes.map((l, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "9px 6px" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{l.designation}</div>
                      {l.marque && <div style={{ fontSize: 11, color: "#94a3b8" }}>{l.marque}{l.modele ? ` — ${l.modele}` : ""}</div>}
                    </td>
                    <td style={{ padding: "9px 6px", textAlign: "right", fontSize: 11, color: "#64748b" }}>{l.lppr ?? "—"}</td>
                    <td style={{ padding: "9px 6px", textAlign: "right", fontSize: 12, fontWeight: 600, color: l.classe === 1 ? "#0891b2" : "#7c3aed" }}>C{l.classe}</td>
                    <td style={{ padding: "9px 6px", textAlign: "right", fontSize: 13 }}>{l.quantite}</td>
                    <td style={{ padding: "9px 6px", textAlign: "right", fontSize: 13, fontWeight: 600 }}>{l.prixTTC.toFixed(2)} €</td>
                    <td style={{ padding: "9px 6px", textAlign: "right", fontSize: 12, color: "#6366f1" }}>{l.tauxTVA}%</td>
                    <td style={{ padding: "9px 6px", textAlign: "right", fontSize: 12, color: "#059669" }}>−{l.priseEnChargeSS.toFixed(2)} €</td>
                    <td style={{ padding: "9px 6px", textAlign: "right", fontSize: 12, color: "#7c3aed" }}>−{l.priseEnChargeMutuelle.toFixed(2)} €</td>
                    <td style={{ padding: "9px 6px", textAlign: "right", fontSize: 13, fontWeight: 700 }}>{l.resteACharge.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
              <div style={{ width: 300 }}>
                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                  <RowPrint label="Total TTC" value={facture.totalTTC.toFixed(2) + " €"} bold />
                  {facture.totalSS > 0 && <RowPrint label="Prise en charge SS" value={"−" + facture.totalSS.toFixed(2) + " €"} color="#059669" />}
                  {facture.totalMutuelle > 0 && <RowPrint label="Prise en charge Mutuelle" value={"−" + facture.totalMutuelle.toFixed(2) + " €"} color="#7c3aed" />}
                  <div style={{ borderTop: "2px solid #1e293b", marginTop: 4, paddingTop: 8 }}>
                    <RowPrint label="RESTE À CHARGE" value={facture.resteACharge.toFixed(2) + " €"} bold />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment / notes */}
            {(facture.modePaiement || facture.notes) && (
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16, fontSize: 12, color: "#475569" }}>
                {facture.modePaiement && <div>Mode de règlement : <strong>{facture.modePaiement}</strong>{facture.nbEcheances ? ` — ${facture.nbEcheances} échéance(s)` : ""}</div>}
                {facture.notes && <div style={{ marginTop: 6, fontStyle: "italic" }}>{facture.notes}</div>}
              </div>
            )}

            {/* Legal footer */}
            <div style={{ marginTop: 32, borderTop: "1px solid #e2e8f0", paddingTop: 12, fontSize: 10, color: "#94a3b8", textAlign: "center" }}>
              Document établi conformément aux obligations légales de facturation en audioprothèse.
              TVA 5,5% applicable sur appareils auditifs (Art. 278-0 bis CGI). Remboursement SS max 1 700 €/appareil (classe 1).
            </div>
          </div>
        </div>
      </DraggableWindow>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════════════════ */
export default function FacturationAuditionPage() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [filterStatus, setFilterStatus] = useState<FactureStatus | "Toutes">("Toutes");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editFacture, setEditFacture] = useState<Facture | undefined>();
  const [devisPickerOpen, setDevisPickerOpen] = useState(false);
  const [printFacture, setPrintFacture] = useState<Facture | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Load from localStorage with mock fallback
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      setFactures(raw ? JSON.parse(raw) : MOCK_FACTURES);
    } catch {
      setFactures(MOCK_FACTURES);
    }
  }, []);

  const save = useCallback((data: Facture[]) => {
    setFactures(data);
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }, []);

  function handleSave(f: Facture) {
    const updated = editFacture
      ? factures.map(x => x.id === f.id ? f : x)
      : [f, ...factures];
    save(updated);
    setModalOpen(false);
    setEditFacture(undefined);
    setToast(editFacture ? "Facture mise à jour" : "Facture créée");
  }

  function handleMarkPaid(f: Facture) {
    const updated = factures.map(x => x.id === f.id ? { ...x, status: "Payée" as FactureStatus, racRegle: true } : x);
    save(updated);
    setToast("Facture marquée comme payée");
  }

  function handleDevisSelected(d: DevisMin) {
    setDevisPickerOpen(false);
    // Pre-fill modal with devis data — open modal in "new" mode with devisNumero pre-filled
    const preloaded: Facture = {
      id: "", numero: "", patientNom: d.patientNom, patientPrenom: d.patientPrenom,
      mutuelleNom: d.mutuelleNom, devisNumero: d.numero,
      dateFacture: isoToday(), lignes: [],
      totalTTC: d.totalTTC ?? 0, totalSS: 0, totalMutuelle: 0, resteACharge: 0,
      racRegle: false, status: "En attente", createdAt: new Date().toISOString(),
    };
    setEditFacture(preloaded);
    setModalOpen(true);
  }

  // Filtered list
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const filtered = factures.filter(f => {
    const matchStatus = filterStatus === "Toutes" || f.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q || `${f.patientNom} ${f.patientPrenom} ${f.numero} ${f.mutuelleNom ?? ""}`.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // KPIs
  const facturesMois = factures.filter(f => {
    const d = new Date(f.dateFacture);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const totalMois = facturesMois.reduce((s, f) => s + f.totalTTC, 0);
  const enAttente = factures.filter(f => f.status === "En attente" || f.status === "Partiellement payée");
  const totalEnAttente = enAttente.reduce((s, f) => s + f.resteACharge, 0);
  const payees = factures.filter(f => f.status === "Payée").length;
  const tauxRecouvrement = factures.length ? Math.round((payees / factures.length) * 100) : 0;

  const STATUSES: (FactureStatus | "Toutes")[] = ["Toutes", "En attente", "Payée", "Partiellement payée", "Annulée"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800 h-title">Facturation</h1>
          <p className="mt-1 text-sm text-slate-500">Factures audioprothèse — TVA 5,5% — Remboursement SS max 1 700 € / appareil</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => exportCSV(factures)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer", background: "var(--glass-subtle-bg)", border: "1px solid var(--glass-subtle-border)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exporter CSV
          </button>
          <button
            onClick={() => setDevisPickerOpen(true)}
            style={{ ...glassSubtle, padding: "9px 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "#00C98A", cursor: "pointer" }}
          >
            Créer depuis un devis
          </button>
          <button
            onClick={() => { setEditFacture(undefined); setModalOpen(true); }}
            style={{ padding: "9px 18px", borderRadius: 12, border: "none", background: "#10b981", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 2px 8px rgba(16,185,129,0.25)" }}
          >
            + Nouvelle facture
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {[
          { label: "Total facturé (mois)", value: fmt(totalMois), sub: `${facturesMois.length} facture${facturesMois.length !== 1 ? "s" : ""}`, color: "#00C98A" },
          { label: "En attente de règlement", value: fmt(totalEnAttente), sub: `${enAttente.length} facture${enAttente.length !== 1 ? "s" : ""}`, color: "#f59e0b" },
          { label: "Taux de recouvrement", value: `${tauxRecouvrement}%`, sub: `${payees} / ${factures.length} factures payées`, color: "#6366f1" },
        ].map(k => (
          <div key={k.label} style={{ ...glass, borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <input
          type="text" placeholder="Rechercher patient, N°…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, width: 260, borderRadius: 12, ...glassSubtle }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                ...(filterStatus === s
                  ? { background: "#10b981", color: "#fff", border: "none", boxShadow: "0 2px 8px rgba(16,185,129,0.25)" }
                  : { ...glassSubtle, color: "#64748b", border: "1px solid rgba(148,163,184,0.25)" }
                ),
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ ...glass, borderRadius: 18, overflow: "hidden" }}>
        {/* Header row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "120px 1fr 100px 110px 90px 90px 90px 130px 120px",
          gap: 0, padding: "10px 20px", borderBottom: "1px solid rgba(148,163,184,0.12)",
          fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8",
        }}>
          <span>N°</span><span>Patient</span><span>Date</span><span>TTC</span>
          <span>SS</span><span>Mutuelle</span><span>RAC</span><span>Statut</span><span>Actions</span>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
            Aucune facture trouvée.
          </div>
        ) : filtered.map(f => (
          <div
            key={f.id}
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr 100px 110px 90px 90px 90px 130px 120px",
              gap: 0, padding: "12px 20px", borderBottom: "1px solid rgba(148,163,184,0.08)",
              alignItems: "center",
            }}
            className="hover:bg-emerald-50/20 transition-colors"
          >
            <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{f.numero}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{f.patientPrenom} {f.patientNom}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{f.mutuelleNom ?? "—"}{f.devisNumero ? ` · ${f.devisNumero}` : ""}</div>
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{fmtDate(f.dateFacture)}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{fmt(f.totalTTC)}</div>
            <div style={{ fontSize: 12, color: "#0891b2" }}>{fmt(f.totalSS)}</div>
            <div style={{ fontSize: 12, color: "#7c3aed" }}>{fmt(f.totalMutuelle)}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: f.resteACharge === 0 ? "#10b981" : "#1e293b" }}>{fmt(f.resteACharge)}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <StatusBadge status={f.status} />
              {f.modePaiement && (
                <span style={{ fontSize: 10, color: "#94a3b8" }}>
                  {f.modePaiement}{f.nbEcheances ? ` · ${f.nbEcheances}×` : ""}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {(f.status === "En attente" || f.status === "Partiellement payée") && (
                <button
                  onClick={() => handleMarkPaid(f)}
                  style={{ padding: "4px 10px", borderRadius: 8, border: "none", background: "rgba(16,185,129,0.12)", color: "#047857", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                >
                  Payée ✓
                </button>
              )}
              <button
                onClick={() => { setEditFacture(f); setModalOpen(true); }}
                style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.2)", background: "var(--glass-subtle-bg)", color: "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
              >
                Modifier
              </button>
              <button
                onClick={() => setPrintFacture(f)}
                title="Imprimer / PDF"
                style={{ padding: "4px 8px", borderRadius: 8, border: "none", background: "rgba(0,201,138,0.10)", color: "#00C98A", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
              >

              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {modalOpen && (
        <FactureModal
          initial={editFacture}
          allFactures={factures}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditFacture(undefined); }}
        />
      )}
      {devisPickerOpen && (
        <DevisPickerModal
          allFactures={factures}
          onSelect={handleDevisSelected}
          onClose={() => setDevisPickerOpen(false)}
        />
      )}
      {printFacture && (
        <PrintModal facture={printFacture} onClose={() => setPrintFacture(null)} />
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
