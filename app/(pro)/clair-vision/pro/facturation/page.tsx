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
type ModePaiement = "Carte" | "Espèces" | "Chèque" | "Virement" | "Mutuelle tiers payant";

interface FactureLigne {
  designation: string;
  marque?: string;
  reference?: string;
  lppr?: string;
  quantite: number;
  prixUnitaireHT: number;
  tauxTVA: 5.5 | 20;
  montantTVA: number;
  prixUnitaireTTC: number;
  totalTTC: number;
  priseEnChargeSS: number;
  priseEnChargeMutuelle: number;
}

interface Facture {
  id: string;
  numero: string;
  devisId: string;
  devisNumero: string;
  patientNom: string;
  patientPrenom: string;
  patientAdresse?: string;
  patientMutuelle?: string;
  dateFacture: string;
  dateEcheance: string;
  lignes: FactureLigne[];
  totalHT: number;
  totalTVA55: number;
  totalTVA20: number;
  totalTTC: number;
  priseEnChargeSS: number;
  priseEnChargeMutuelle: number;
  resteACharge: number;
  status: FactureStatus;
  modePaiement?: ModePaiement;
  notes?: string;
  createdAt: string;
}

/* Devis types (minimal — for reading from localStorage) */
interface DevisLigneMin {
  id: string;
  designation: string;
  marque: string;
  reference: string;
  lppr: string;
  prixVenteTTC: number;
  tauxTVA: 5.5 | 20;
  priseEnChargeSS: number;
  priseEnChargeMutuelle: number;
}
interface DevisMin {
  id: string;
  numero?: string;
  patientNom: string;
  patientPrenom: string;
  mutuelleNom?: string;
  lignes: DevisLigneMin[];
  totalTTC: number;
  totalSS: number;
  totalMutuelle: number;
  resteACharge: number;
  status: string;
  date: string;
}

/* ═══════════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════════ */
const LS_KEY = "thor_pro_factures";
const LS_DEVIS = "thor_pro_devis";

const STATUS_CONFIG: Record<FactureStatus, { bg: string; text: string; dot: string }> = {
  "En attente":          { bg: "rgba(245,158,11,0.12)",  text: "#b45309", dot: "#f59e0b" },
  "Payée":               { bg: "rgba(16,185,129,0.12)",  text: "#047857", dot: "#10b981" },
  "Partiellement payée": { bg: "rgba(99,102,241,0.12)",  text: "#4338ca", dot: "#6366f1" },
  "Annulée":             { bg: "rgba(239,68,68,0.12)",   text: "#b91c1c", dot: "#ef4444" },
};

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════ */
function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}
function fmtDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR");
}
function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
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
    .map((f) => {
      const m = f.numero.match(/FAC-\d{4}-(\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `FAC-${year}-${String(next).padStart(3, "0")}`;
}

/* ═══════════════════════════════════════════════════════════════════════
   MOCK DATA
═══════════════════════════════════════════════════════════════════════ */
const MOCK_FACTURES: Facture[] = [
  {
    id: "mock-fac-001",
    numero: "FAC-2025-001",
    devisId: "mock-devis-001",
    devisNumero: "DEV-2025-001",
    patientNom: "Leblanc",
    patientPrenom: "Marie",
    patientMutuelle: "MGEN",
    dateFacture: "2025-02-20",
    dateEcheance: "2025-03-22",
    lignes: [
      {
        designation: "Varilux X 4D 1.67",
        lppr: "2235615",
        quantite: 1,
        prixUnitaireHT: 491.94,
        tauxTVA: 5.5,
        montantTVA: 27.06,
        prixUnitaireTTC: 519,
        totalTTC: 519,
        priseEnChargeSS: 40,
        priseEnChargeMutuelle: 230,
      },
      {
        designation: "Ray-Ban RB3025",
        marque: "Ray-Ban",
        reference: "RB3025",
        quantite: 1,
        prixUnitaireHT: 160,
        tauxTVA: 20,
        montantTVA: 32,
        prixUnitaireTTC: 192,
        totalTTC: 192,
        priseEnChargeSS: 20,
        priseEnChargeMutuelle: 150,
      },
    ],
    totalHT: 651.94,
    totalTVA55: 27.06,
    totalTVA20: 32,
    totalTTC: 711,
    priseEnChargeSS: 60,
    priseEnChargeMutuelle: 380,
    resteACharge: 271,
    status: "Payée",
    modePaiement: "Carte",
    createdAt: "2025-02-20T09:00:00.000Z",
  },
  {
    id: "mock-fac-002",
    numero: "FAC-2025-002",
    devisId: "mock-devis-002",
    devisNumero: "DEV-2025-002",
    patientNom: "Morel",
    patientPrenom: "Isabelle",
    patientMutuelle: "Harmonie Mutuelle",
    dateFacture: "2025-03-05",
    dateEcheance: "2025-04-04",
    lignes: [
      {
        designation: "Essilor Crizal Forte UV 1.74",
        lppr: "2235616",
        quantite: 1,
        prixUnitaireHT: 759.76,
        tauxTVA: 5.5,
        montantTVA: 41.79,
        prixUnitaireTTC: 801.55,
        totalTTC: 890,
        priseEnChargeSS: 45,
        priseEnChargeMutuelle: 560,
      },
    ],
    totalHT: 843.94,
    totalTVA55: 46.41,
    totalTVA20: 0,
    totalTTC: 890,
    priseEnChargeSS: 45,
    priseEnChargeMutuelle: 560,
    resteACharge: 285,
    status: "En attente",
    createdAt: "2025-03-05T10:00:00.000Z",
  },
  {
    id: "mock-fac-003",
    numero: "FAC-2025-003",
    devisId: "mock-devis-003",
    devisNumero: "DEV-2025-003",
    patientNom: "Renaud",
    patientPrenom: "Paul",
    patientMutuelle: "April Santé",
    dateFacture: "2025-03-12",
    dateEcheance: "2025-04-11",
    lignes: [
      {
        designation: "Lentilles CooperVision Clariti 1 Day",
        marque: "CooperVision",
        reference: "Clariti 1 Day",
        quantite: 2,
        prixUnitaireHT: 65.41,
        tauxTVA: 20,
        montantTVA: 13.08,
        prixUnitaireTTC: 78,
        totalTTC: 156,
        priseEnChargeSS: 0,
        priseEnChargeMutuelle: 100,
      },
    ],
    totalHT: 130.83,
    totalTVA55: 0,
    totalTVA20: 26.17,
    totalTTC: 156,
    priseEnChargeSS: 0,
    priseEnChargeMutuelle: 100,
    resteACharge: 56,
    status: "En attente",
    createdAt: "2025-03-12T14:00:00.000Z",
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   PERIOD FILTER HELPER
═══════════════════════════════════════════════════════════════════════ */
function inPeriod(iso: string, period: "month" | "quarter" | "year"): boolean {
  const d = new Date(iso);
  const now = new Date();
  if (period === "month") {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    const dq = Math.floor(d.getMonth() / 3);
    return d.getFullYear() === now.getFullYear() && dq === q;
  }
  return d.getFullYear() === now.getFullYear();
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
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: "#10b981",
        color: "#fff",
        borderRadius: 14,
        padding: "12px 20px",
        fontSize: 14,
        fontWeight: 600,
        boxShadow: "0 8px 32px rgba(16,185,129,0.35)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span>✓</span>
      <span>{message}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   STATUS BADGE
═══════════════════════════════════════════════════════════════════════ */
function StatusBadge({ status }: { status: FactureStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.text,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: cfg.dot,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {status}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PRINT MODAL
═══════════════════════════════════════════════════════════════════════ */
function PrintModal({ facture, onClose }: { facture: Facture; onClose: () => void }) {
  const cfg = loadStoreConfig();
  const adresseComplete = [cfg.adresse, cfg.codePostal && cfg.ville ? `${cfg.codePostal} ${cfg.ville}` : ""].filter(Boolean).join(", ");
  const [pdfLoading, setPdfLoading] = useState(false);

  async function handleDownloadPdf() {
    setPdfLoading(true);
    try {
      await downloadElementAsPdf(
        "facture-print-zone",
        factureFilename(facture.numero, facture.patientNom)
      );
    } finally {
      setPdfLoading(false);
    }
  }

  return (
      <DraggableWindow
        title="Facture"
        badge={facture.numero}
        onClose={onClose}
        defaultWidth={860}
        defaultHeight={700}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              style={{
                padding: "5px 14px", borderRadius: 8, border: "none",
                background: pdfLoading ? "#94a3b8" : "#2D8CFF",
                color: "#fff", fontSize: 12, fontWeight: 600,
                cursor: pdfLoading ? "wait" : "pointer",
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              {pdfLoading ? "⏳ Génération…" : "⬇ Télécharger PDF"}
            </button>
            <button
              onClick={() => window.print()}
              style={{
                padding: "5px 14px", borderRadius: 8,
                border: "1px solid rgba(99,102,241,0.35)",
                background: "rgba(99,102,241,0.08)",
                color: "#4f46e5", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              Imprimer
            </button>
          </div>
        }
      >
        <div style={{ background: "var(--glass-card-bg)", padding: 24 }}>
          <div
            id="facture-print-zone"
              style={{
                background: "#fff",
                padding: 40,
                borderRadius: 12,
                fontFamily: "'Inter', -apple-system, sans-serif",
                fontSize: 13,
                color: "#1e293b",
                lineHeight: 1.6,
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 36 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>
                    {cfg.nom}
                  </div>
                  {adresseComplete && <div style={{ fontSize: 12, color: "#475569" }}>{adresseComplete}</div>}
                  {cfg.telephone && <div style={{ fontSize: 12, color: "#475569" }}>Tél : {cfg.telephone}</div>}
                  {cfg.siret && <div style={{ fontSize: 12, color: "#475569" }}>SIRET : {cfg.siret}</div>}
                  {cfg.adeli && <div style={{ fontSize: 12, color: "#475569" }}>ADELI : {cfg.adeli}</div>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 22, fontWeight: 800,
                      background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      marginBottom: 4,
                    }}
                  >
                    FACTURE
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{facture.numero}</div>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                    Date : {fmtDate(facture.dateFacture)}
                  </div>
                  <div style={{ fontSize: 12, color: "#475569" }}>
                    Échéance : {fmtDate(facture.dateEcheance)}
                  </div>
                  {facture.devisNumero && (
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                      Réf. devis : {facture.devisNumero}
                    </div>
                  )}
                </div>
              </div>

              {/* Patient */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "14px 18px",
                  marginBottom: 28,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>
                  Facturé à
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
                  {facture.patientPrenom} {facture.patientNom}
                </div>
                {facture.patientAdresse && (
                  <div style={{ fontSize: 12, color: "#475569" }}>{facture.patientAdresse}</div>
                )}
                {facture.patientMutuelle && (
                  <div style={{ fontSize: 12, color: "#475569" }}>
                    Mutuelle : {facture.patientMutuelle}
                  </div>
                )}
              </div>

              {/* Lines table */}
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ textAlign: "left", padding: "8px 6px", fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Désignation</th>
                    <th style={{ textAlign: "center", padding: "8px 6px", fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>LPPR</th>
                    <th style={{ textAlign: "center", padding: "8px 6px", fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Qté</th>
                    <th style={{ textAlign: "right", padding: "8px 6px", fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>PU HT</th>
                    <th style={{ textAlign: "center", padding: "8px 6px", fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>TVA</th>
                    <th style={{ textAlign: "right", padding: "8px 6px", fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>TTC</th>
                    <th style={{ textAlign: "right", padding: "8px 6px", fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>PC SS</th>
                    <th style={{ textAlign: "right", padding: "8px 6px", fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>PC Mut.</th>
                  </tr>
                </thead>
                <tbody>
                  {facture.lignes.map((l, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "9px 6px", fontSize: 13 }}>
                        <div style={{ fontWeight: 600, color: "#1e293b" }}>{l.designation}</div>
                        {(l.marque || l.reference) && (
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>
                            {[l.marque, l.reference].filter(Boolean).join(" — ")}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "9px 6px", textAlign: "center", fontSize: 12, color: "#64748b" }}>
                        {l.lppr || "—"}
                      </td>
                      <td style={{ padding: "9px 6px", textAlign: "center", fontSize: 13 }}>{l.quantite}</td>
                      <td style={{ padding: "9px 6px", textAlign: "right", fontSize: 13 }}>
                        {l.prixUnitaireHT.toFixed(2)} €
                      </td>
                      <td style={{ padding: "9px 6px", textAlign: "center", fontSize: 12, color: "#6366f1", fontWeight: 600 }}>
                        {l.tauxTVA}%
                      </td>
                      <td style={{ padding: "9px 6px", textAlign: "right", fontSize: 13, fontWeight: 600 }}>
                        {l.totalTTC.toFixed(2)} €
                      </td>
                      <td style={{ padding: "9px 6px", textAlign: "right", fontSize: 13, color: "#059669" }}>
                        -{l.priseEnChargeSS.toFixed(2)} €
                      </td>
                      <td style={{ padding: "9px 6px", textAlign: "right", fontSize: 13, color: "#6366f1" }}>
                        -{l.priseEnChargeMutuelle.toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
                <div style={{ width: 320 }}>
                  <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                    <Row label="Total HT" value={facture.totalHT.toFixed(2) + " €"} />
                    {facture.totalTVA55 > 0 && <Row label="TVA 5.5%" value={facture.totalTVA55.toFixed(2) + " €"} />}
                    {facture.totalTVA20 > 0 && <Row label="TVA 20%" value={facture.totalTVA20.toFixed(2) + " €"} />}
                    <Row label="Total TTC" value={facture.totalTTC.toFixed(2) + " €"} bold />
                    {facture.priseEnChargeSS > 0 && (
                      <Row label="PC Sécurité Sociale" value={"−" + facture.priseEnChargeSS.toFixed(2) + " €"} color="#059669" />
                    )}
                    {facture.priseEnChargeMutuelle > 0 && (
                      <Row label="PC Mutuelle" value={"−" + facture.priseEnChargeMutuelle.toFixed(2) + " €"} color="#6366f1" />
                    )}
                    <div style={{ borderTop: "2px solid #1e293b", marginTop: 4, paddingTop: 8 }}>
                      <Row label="RESTE À CHARGE" value={facture.resteACharge.toFixed(2) + " €"} bold large />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment + notes */}
              {(facture.modePaiement || facture.notes) && (
                <div
                  style={{
                    borderTop: "1px solid #e2e8f0",
                    paddingTop: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {facture.modePaiement && (
                    <div style={{ fontSize: 13, color: "#475569" }}>
                      <strong>Mode de paiement :</strong> {facture.modePaiement}
                    </div>
                  )}
                  {facture.notes && (
                    <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>
                      {facture.notes}
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div
                style={{
                  marginTop: 32,
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: 12,
                  textAlign: "center",
                  fontSize: 11,
                  color: "#94a3b8",
                }}
              >
                {cfg.nom} — {adresseComplete}
                {cfg.email && ` — ${cfg.email}`}
                {cfg.telephone && ` — ${cfg.telephone}`}
              </div>
            </div>
          </div>
        </DraggableWindow>
  );
}

function Row({
  label,
  value,
  bold,
  large,
  color,
}: {
  label: string;
  value: string;
  bold?: boolean;
  large?: boolean;
  color?: string;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: large ? 14 : 13 }}>
      <span style={{ color: color ?? "#64748b", fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{ color: color ?? "#1e293b", fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   KPI CARD
═══════════════════════════════════════════════════════════════════════ */
function KpiCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        ...glass,
        borderRadius: 18,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color ?? "#1e293b" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#94a3b8" }}>{sub}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════ */
export default function FacturationPage() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [tab, setTab] = useState<0 | 1 | 2>(0);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FactureStatus | "Toutes">("Toutes");
  const [tvaperiod, setTvaPeriod] = useState<"month" | "quarter" | "year">("month");
  const [devis, setDevis] = useState<DevisMin[]>([]);
  const [printFacture, setPrintFacture] = useState<Facture | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  /* ── Load from localStorage ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        setFactures(JSON.parse(raw) as Facture[]);
      } catch { /* ignore */ }
    } else {
      // Seed mock data on first load
      localStorage.setItem(LS_KEY, JSON.stringify(MOCK_FACTURES));
      setFactures(MOCK_FACTURES);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(LS_DEVIS);
    if (raw) {
      try {
        setDevis(JSON.parse(raw) as DevisMin[]);
      } catch { /* ignore */ }
    }
  }, [tab]);

  /* ── Persist ── */
  const persist = useCallback((updated: Facture[]) => {
    setFactures(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
    }
  }, []);

  /* ── KPIs ── */
  const now = new Date();
  const facturesCeMois = factures.filter(
    (f) =>
      new Date(f.dateFacture).getFullYear() === now.getFullYear() &&
      new Date(f.dateFacture).getMonth() === now.getMonth()
  );
  const caFacture = factures.reduce((s, f) => s + f.totalTTC, 0);
  const enAttente = factures.filter((f) => f.status === "En attente").length;
  const tvaCollectee = factures.reduce((s, f) => s + f.totalTVA55 + f.totalTVA20, 0);

  /* ── Tab 1 filtered ── */
  const filteredFactures = factures.filter((f) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      f.numero.toLowerCase().includes(q) ||
      f.patientNom.toLowerCase().includes(q) ||
      f.patientPrenom.toLowerCase().includes(q);
    const matchStatus = filterStatus === "Toutes" || f.status === filterStatus;
    return matchSearch && matchStatus;
  });

  /* ── Mark as paid ── */
  const markPaid = (id: string) => {
    const updated = factures.map((f) =>
      f.id === id ? { ...f, status: "Payée" as FactureStatus, modePaiement: f.modePaiement ?? "Carte" } : f
    );
    persist(updated);
    showToast("Facture marquée comme payée ✓");
  };

  /* ── Cancel ── */
  const cancelFacture = (id: string) => {
    if (!confirm("Annuler cette facture ?")) return;
    const updated = factures.map((f) =>
      f.id === id ? { ...f, status: "Annulée" as FactureStatus } : f
    );
    persist(updated);
  };

  /* ── Toast helper ── */
  const showToast = (msg: string) => {
    setToast(msg);
  };

  /* ── Tab 2 TVA register ── */
  const tvaRows = factures.filter((f) => f.status !== "Annulée" && inPeriod(f.dateFacture, tvaperiod));
  const totalTVA55 = tvaRows.reduce((s, f) => s + f.totalTVA55, 0);
  const totalTVA20 = tvaRows.reduce((s, f) => s + f.totalTVA20, 0);

  const exportCSV = () => {
    const header = ["Période", "Facture", "Patient", "Total HT", "TVA 5.5%", "TVA 20%", "Total TTC"];
    const rows = tvaRows.map((f) => [
      fmtDate(f.dateFacture),
      f.numero,
      `${f.patientPrenom} ${f.patientNom}`,
      f.totalHT.toFixed(2),
      f.totalTVA55.toFixed(2),
      f.totalTVA20.toFixed(2),
      f.totalTTC.toFixed(2),
    ]);
    const csv = [header, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "registre_tva.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Tab 3: create facture from devis ── */
  const eligibleDevis = devis.filter(
    (d) => d.status === "Facturé" || d.status === "Livré"
  );

  const factureForDevis = (devisId: string): Facture | undefined =>
    factures.find((f) => f.devisId === devisId);

  const createFacture = (d: DevisMin) => {
    const existing = factureForDevis(d.id);
    if (existing) return;

    const today = isoToday();
    const lignes: FactureLigne[] = d.lignes.map((l) => {
      const prixHT = parseFloat((l.prixVenteTTC / (1 + l.tauxTVA / 100)).toFixed(2));
      const montantTVA = parseFloat((l.prixVenteTTC - prixHT).toFixed(2));
      return {
        designation: l.designation,
        marque: l.marque || undefined,
        reference: l.reference || undefined,
        lppr: l.lppr || undefined,
        quantite: 1,
        prixUnitaireHT: prixHT,
        tauxTVA: l.tauxTVA,
        montantTVA,
        prixUnitaireTTC: l.prixVenteTTC,
        totalTTC: l.prixVenteTTC,
        priseEnChargeSS: l.priseEnChargeSS,
        priseEnChargeMutuelle: l.priseEnChargeMutuelle,
      };
    });

    const totalHT = parseFloat(lignes.reduce((s, l) => s + l.prixUnitaireHT * l.quantite, 0).toFixed(2));
    const totalTVA55 = parseFloat(lignes.filter((l) => l.tauxTVA === 5.5).reduce((s, l) => s + l.montantTVA * l.quantite, 0).toFixed(2));
    const totalTVA20 = parseFloat(lignes.filter((l) => l.tauxTVA === 20).reduce((s, l) => s + l.montantTVA * l.quantite, 0).toFixed(2));

    const allFactures = typeof window !== "undefined"
      ? (() => { try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as Facture[]; } catch { return factures; } })()
      : factures;

    const numero = genNumero(allFactures);

    const newFacture: Facture = {
      id: genId(),
      numero,
      devisId: d.id,
      devisNumero: d.numero ?? d.id,
      patientNom: d.patientNom,
      patientPrenom: d.patientPrenom,
      patientMutuelle: d.mutuelleNom,
      dateFacture: today,
      dateEcheance: addDays(today, 30),
      lignes,
      totalHT,
      totalTVA55,
      totalTVA20,
      totalTTC: d.totalTTC,
      priseEnChargeSS: d.totalSS,
      priseEnChargeMutuelle: d.totalMutuelle,
      resteACharge: d.resteACharge,
      status: "En attente",
      createdAt: new Date().toISOString(),
    };

    const updated = [...factures, newFacture];
    persist(updated);

    // Update devis status if needed
    if (typeof window !== "undefined") {
      const rawDevis = localStorage.getItem(LS_DEVIS);
      if (rawDevis) {
        try {
          const devisList = JSON.parse(rawDevis) as DevisMin[];
          const updatedDevis = devisList.map((dv) =>
            dv.id === d.id ? { ...dv, status: "Facturé" } : dv
          );
          localStorage.setItem(LS_DEVIS, JSON.stringify(updatedDevis));
          setDevis(updatedDevis);
        } catch { /* ignore */ }
      }
    }

    showToast(`Facture ${numero} créée ✓`);
    setTab(0);
  };

  /* ══════════════════════════════════════════════════════════════════ */
  return (
    <div>
      {/* Print modal */}
      {printFacture && (
        <PrintModal facture={printFacture} onClose={() => setPrintFacture(null)} />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>
          Facturation
        </div>
        <div style={{ fontSize: 14, color: "#64748b" }}>
          Gestion des factures, TVA et remboursements
        </div>
      </div>

      {/* KPI cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <KpiCard
          label="Factures ce mois"
          value={String(facturesCeMois.length)}
          sub="émises ce mois-ci"
        />
        <KpiCard
          label="CA facturé"
          value={fmt(caFacture)}
          sub="total TTC"
          color="#6366f1"
        />
        <KpiCard
          label="En attente"
          value={String(enAttente)}
          sub="non encaissées"
          color="#f59e0b"
        />
        <KpiCard
          label="TVA collectée"
          value={fmt(tvaCollectee)}
          sub="5.5% + 20%"
          color="#10b981"
        />
      </div>

      {/* Tabs */}
      <div style={{ ...glass, borderRadius: 20, overflow: "hidden" }}>
        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid rgba(148,163,184,0.15)",
            padding: "0 8px",
          }}
        >
          {(["Factures", "Registre TVA", "Créer depuis un devis"] as const).map((label, i) => (
            <button
              key={label}
              onClick={() => setTab(i as 0 | 1 | 2)}
              style={{
                padding: "14px 20px",
                fontSize: 14,
                fontWeight: 600,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: tab === i ? "#6366f1" : "#64748b",
                borderBottom: tab === i ? "2px solid #6366f1" : "2px solid transparent",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab 0: Factures ── */}
        {tab === 0 && (
          <div style={{ padding: 24 }}>
            {/* Toolbar */}
            <div
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 20,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div style={{ position: "relative", flex: "1 1 220px", minWidth: 200 }}>
                <svg
                  style={{
                    position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                    width: 16, height: 16, color: "#94a3b8",
                  }}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  placeholder="Rechercher par patient, numéro…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 36 }}
                />
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(["Toutes", "En attente", "Payée", "Partiellement payée", "Annulée"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      border: filterStatus === s ? "none" : "1px solid rgba(148,163,184,0.3)",
                      background:
                        filterStatus === s
                          ? "linear-gradient(135deg,#6366f1,#4f46e5)"
                          : "rgba(255,255,255,0.7)",
                      color: filterStatus === s ? "#fff" : "#64748b",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setTab(2)}
                style={{
                  padding: "9px 18px",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                  whiteSpace: "nowrap",
                }}
              >
                + Générer depuis un devis
              </button>
            </div>

            {/* Facture list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filteredFactures.length === 0 && (
                <div
                  style={{
                    ...glassSubtle,
                    borderRadius: 14,
                    padding: "32px 24px",
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: 14,
                  }}
                >
                  Aucune facture trouvée.
                </div>
              )}
              {filteredFactures.map((f) => (
                <FactureCard
                  key={f.id}
                  facture={f}
                  onPrint={() => setPrintFacture(f)}
                  onPay={() => markPaid(f.id)}
                  onCancel={() => cancelFacture(f.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Tab 1: TVA Register ── */}
        {tab === 1 && (
          <div style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              {/* Period filter */}
              <div style={{ display: "flex", gap: 8 }}>
                {(
                  [
                    { key: "month", label: "Ce mois" },
                    { key: "quarter", label: "Ce trimestre" },
                    { key: "year", label: "Cette année" },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setTvaPeriod(key)}
                    style={{
                      padding: "7px 16px",
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 600,
                      border: tvaperiod === key ? "none" : "1px solid rgba(148,163,184,0.3)",
                      background:
                        tvaperiod === key
                          ? "linear-gradient(135deg,#6366f1,#4f46e5)"
                          : "rgba(255,255,255,0.7)",
                      color: tvaperiod === key ? "#fff" : "#64748b",
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                onClick={exportCSV}
                style={{
                  padding: "8px 18px",
                  borderRadius: 12,
                  border: "1px solid rgba(99,102,241,0.4)",
                  background: "rgba(99,102,241,0.08)",
                  color: "#6366f1",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Exporter CSV
              </button>
            </div>

            {/* Summary box */}
            <div
              style={{
                ...glassSubtle,
                borderRadius: 14,
                padding: "14px 20px",
                marginBottom: 20,
                display: "flex",
                gap: 24,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>TVA 5.5% collectée</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#6366f1" }}>{fmt(totalTVA55)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>TVA 20% collectée</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#6366f1" }}>{fmt(totalTVA20)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Total TVA</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{fmt(totalTVA55 + totalTVA20)}</div>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "rgba(99,102,241,0.06)" }}>
                    {["Période", "Facture", "Patient", "Total HT", "TVA 5.5%", "TVA 20%", "Total TTC"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            padding: "10px 14px",
                            textAlign: h === "Période" || h === "Facture" || h === "Patient" ? "left" : "right",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {tvaRows.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: "32px 14px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                        Aucune facture sur cette période.
                      </td>
                    </tr>
                  )}
                  {tvaRows.map((f, i) => (
                    <tr
                      key={f.id}
                      style={{ borderBottom: "1px solid rgba(148,163,184,0.12)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.3)" }}
                    >
                      <td style={{ padding: "9px 14px", color: "#475569" }}>{fmtDate(f.dateFacture)}</td>
                      <td style={{ padding: "9px 14px" }}>
                        <span
                          style={{
                            background: "rgba(245,158,11,0.12)",
                            color: "#b45309",
                            borderRadius: 8,
                            padding: "2px 8px",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {f.numero}
                        </span>
                      </td>
                      <td style={{ padding: "9px 14px", fontWeight: 600, color: "#1e293b" }}>
                        {f.patientPrenom} {f.patientNom}
                      </td>
                      <td style={{ padding: "9px 14px", textAlign: "right", color: "#475569" }}>
                        {f.totalHT.toFixed(2)} €
                      </td>
                      <td style={{ padding: "9px 14px", textAlign: "right", color: "#6366f1", fontWeight: 600 }}>
                        {f.totalTVA55 > 0 ? f.totalTVA55.toFixed(2) + " €" : "—"}
                      </td>
                      <td style={{ padding: "9px 14px", textAlign: "right", color: "#6366f1", fontWeight: 600 }}>
                        {f.totalTVA20 > 0 ? f.totalTVA20.toFixed(2) + " €" : "—"}
                      </td>
                      <td style={{ padding: "9px 14px", textAlign: "right", fontWeight: 700, color: "#1e293b" }}>
                        {f.totalTTC.toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
                {tvaRows.length > 0 && (
                  <tfoot>
                    <tr style={{ background: "rgba(99,102,241,0.06)", borderTop: "2px solid rgba(99,102,241,0.15)" }}>
                      <td colSpan={3} style={{ padding: "10px 14px", fontWeight: 700, color: "#1e293b", fontSize: 13 }}>
                        TOTAUX
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#1e293b" }}>
                        {tvaRows.reduce((s, f) => s + f.totalHT, 0).toFixed(2)} €
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#6366f1" }}>
                        {totalTVA55.toFixed(2)} €
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#6366f1" }}>
                        {totalTVA20.toFixed(2)} €
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#1e293b" }}>
                        {tvaRows.reduce((s, f) => s + f.totalTTC, 0).toFixed(2)} €
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* ── Tab 2: Create from devis ── */}
        {tab === 2 && (
          <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
                Générer une facture depuis un devis
              </div>
              <div style={{ fontSize: 13, color: "#64748b" }}>
                Devis éligibles : statut &ldquo;Livré&rdquo; ou &ldquo;Facturé&rdquo;
              </div>
            </div>

            {eligibleDevis.length === 0 && (
              <div
                style={{
                  ...glassSubtle,
                  borderRadius: 14,
                  padding: "32px 24px",
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: 14,
                }}
              >
                Aucun devis éligible pour le moment.
                <br />
                <span style={{ fontSize: 12 }}>
                  Les devis avec le statut &ldquo;Livré&rdquo; ou &ldquo;Facturé&rdquo; apparaîtront ici.
                </span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {eligibleDevis.map((d) => {
                const existing = factureForDevis(d.id);
                return (
                  <div
                    key={d.id}
                    style={{
                      ...glassSubtle,
                      borderRadius: 16,
                      padding: "18px 20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            background: "rgba(245,158,11,0.12)",
                            color: "#b45309",
                            borderRadius: 8,
                            padding: "2px 8px",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {d.numero ?? d.id}
                        </span>
                        <span
                          style={{
                            background: d.status === "Facturé"
                              ? "rgba(16,185,129,0.12)"
                              : "rgba(99,102,241,0.12)",
                            color: d.status === "Facturé" ? "#047857" : "#4338ca",
                            borderRadius: 8,
                            padding: "2px 8px",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {d.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
                        {d.patientPrenom} {d.patientNom}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {fmtDate(d.date)} — TTC : <strong>{fmt(d.totalTTC)}</strong>
                        {" | "}SS : {fmt(d.totalSS)}
                        {" | "}Mutuelle : {fmt(d.totalMutuelle)}
                        {" | "}RAC : <strong style={{ color: "#6366f1" }}>{fmt(d.resteACharge)}</strong>
                      </div>
                    </div>

                    <div>
                      {existing ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span
                            style={{
                              background: "rgba(16,185,129,0.12)",
                              color: "#047857",
                              borderRadius: 20,
                              padding: "6px 14px",
                              fontSize: 12,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <span>✓</span> Facturée ({existing.numero})
                          </span>
                          <button
                            onClick={() => { setPrintFacture(existing); setTab(0); }}
                            style={{
                              padding: "7px 14px",
                              borderRadius: 10,
                              border: "1px solid rgba(99,102,241,0.3)",
                              background: "rgba(99,102,241,0.08)",
                              color: "#6366f1",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Voir
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => createFacture(d)}
                          style={{
                            padding: "9px 20px",
                            borderRadius: 12,
                            border: "none",
                            background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                          }}
                        >
                          Facturer
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   FACTURE CARD
═══════════════════════════════════════════════════════════════════════ */
function FactureCard({
  facture,
  onPrint,
  onPay,
  onCancel,
}: {
  facture: Facture;
  onPrint: () => void;
  onPay: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        ...glassSubtle,
        borderRadius: 16,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span
            style={{
              background: "rgba(245,158,11,0.15)",
              color: "#92400e",
              borderRadius: 10,
              padding: "3px 10px",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "0.03em",
            }}
          >
            {facture.numero}
          </span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
            {facture.patientPrenom} {facture.patientNom}
          </span>
          {facture.patientMutuelle && (
            <span style={{ fontSize: 12, color: "#64748b" }}>· {facture.patientMutuelle}</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StatusBadge status={facture.status} />
          {facture.modePaiement && (
            <span
              style={{
                fontSize: 12,
                color: "#64748b",
                background: "rgba(148,163,184,0.12)",
                borderRadius: 8,
                padding: "2px 8px",
              }}
            >
              {facture.modePaiement}
            </span>
          )}
        </div>
      </div>

      {/* Finance row */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <FinanceTag label="TTC" value={fmt(facture.totalTTC)} color="#1e293b" bold />
        <FinanceTag label="SS" value={fmt(facture.priseEnChargeSS)} color="#059669" />
        <FinanceTag label="Mutuelle" value={fmt(facture.priseEnChargeMutuelle)} color="#6366f1" />
        <FinanceTag label="RAC" value={fmt(facture.resteACharge)} color="#f59e0b" bold />
        <span style={{ fontSize: 12, color: "#94a3b8", alignSelf: "center" }}>
          {fmtDate(facture.dateFacture)} → {fmtDate(facture.dateEcheance)}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={onPrint}
          style={{
            padding: "7px 16px",
            borderRadius: 10,
            border: "1px solid rgba(99,102,241,0.3)",
            background: "rgba(99,102,241,0.08)",
            color: "#6366f1",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Voir PDF
        </button>

        {facture.status === "En attente" && (
          <button
            onClick={onPay}
            style={{
              padding: "7px 16px",
              borderRadius: 10,
              border: "none",
              background: "#10b981",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Marquer payée
          </button>
        )}

        {facture.status !== "Annulée" && (
          <button
            onClick={onCancel}
            style={{
              padding: "7px 16px",
              borderRadius: 10,
              border: "1px solid rgba(239,68,68,0.25)",
              background: "rgba(239,68,68,0.06)",
              color: "#dc2626",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}

function FinanceTag({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: bold ? 800 : 600, color: color ?? "#1e293b" }}>{value}</div>
    </div>
  );
}
