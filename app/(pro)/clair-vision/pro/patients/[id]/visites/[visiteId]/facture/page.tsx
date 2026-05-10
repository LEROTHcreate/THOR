"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { loadStoreConfig, type StoreConfig } from "@/lib/storeConfig";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type Statut = "En cours" | "En attente" | "Accepté" | "Facturé" | "Payé";
type EquipementType = "lunettes-vue" | "lunettes-soleil" | "lentilles" | "divers";

interface Rx { sph: string; cyl: string; axe: string; add?: string; ep?: string }

interface LigneEquipement {
  id: string;
  categorie: string;
  designation: string;
  marque?: string;
  reference?: string;
  materiau?: string;        // ex: "Acétate", "Titane", "TR90"
  traitements?: string;     // ex: "Antireflet Crizal Sapphire, durci, aminci 1.67"
  qte: number;
  prixUnitaire: number;
  total: number;
  classe?: "A" | "B";
  tauxTVA?: 5.5 | 20;      // 5.5% verres/lentilles, 20% montures/accessoires
}

interface FullDossier {
  id: string;
  patientId: string;
  patientNom: string;
  patientDN?: string;
  patientNIR?: string;
  date: string;
  dateFr: string;
  typeEquipement: EquipementType;
  praticien?: string;           // prescripteur ophtalmo
  opticienAccueil?: string;     // opticien qui a reçu le patient
  statut: Statut;
  ordonnance?: {
    numero: string; prescripteur: string; rpps?: string;
    dateOrdonnance: string; type: string;
    od: Rx; og: Rx; ecartPupillaire?: string;
  };
  lignes: LigneEquipement[];
  totalHT: number;
  totalTTC: number;
  devisId?: string;
  pecSecu?: { baseRemboursement: number; tauxSS: number; montantSS: number };
  pecMutuelle?: { nom: string; contrat?: string; garantieOptique: string; montant: number; reseauAdherent: boolean };
  rac?: number;
  facture?: { id: string; date: string; montant: number; statut: string; modePaiement?: string };
  livraison?: { date: string; monteurOpticien?: string; signe: boolean };
  garanties?: Array<{ produit: string; garantieFab: string; garantieMag: string; statut: string; dateFinGarantie?: string }>;
}

/* ─── Mock data ─────────────────────────────────────────────────────────── */
const MOCK: Record<string, FullDossier> = {
  v1: {
    id: "v1", patientId: "marie-leblanc", patientNom: "Marie Leblanc",
    patientDN: "1985-04-05", patientNIR: "2 85 04 75 014 001 52",
    date: "2026-01-20", dateFr: "20 jan. 2026",
    typeEquipement: "lunettes-vue",
    praticien: "Dr. Sophie Aubert",
    opticienAccueil: "Nicolas Thorel",
    statut: "Payé",
    ordonnance: {
      numero: "26010024", prescripteur: "Dr. Sophie Aubert", rpps: "10004587412",
      dateOrdonnance: "2026-01-20", type: "lunettes",
      od: { sph: "−2,25", cyl: "−0,50", axe: "170°", ep: "27,5" },
      og: { sph: "−1,75", cyl: "−0,25", axe: "10°",  ep: "27,0" },
      ecartPupillaire: "64 mm",
    },
    lignes: [
      {
        id: "l1", categorie: "monture",
        designation: "Monture Ray-Ban RB5154 Tortoise",
        marque: "Ray-Ban", reference: "RB5154-2012-52",
        materiau: "Acétate",
        qte: 1, prixUnitaire: 240, total: 240, classe: "B", tauxTVA: 20,
      },
      {
        id: "l2", categorie: "verre-od",
        designation: "Varilux X Design 1,67 Crizal Sapphire UV",
        marque: "Essilor", reference: "VXD-167-OD",
        traitements: "Antireflet Crizal Sapphire UV, durci, aminci (indice 1.67), photochromique",
        qte: 1, prixUnitaire: 220, total: 220, classe: "B", tauxTVA: 5.5,
      },
      {
        id: "l3", categorie: "verre-og",
        designation: "Varilux X Design 1,67 Crizal Sapphire UV",
        marque: "Essilor", reference: "VXD-167-OG",
        traitements: "Antireflet Crizal Sapphire UV, durci, aminci (indice 1.67), photochromique",
        qte: 1, prixUnitaire: 220, total: 220, classe: "B", tauxTVA: 5.5,
      },
    ],
    totalHT: 661.16, totalTTC: 680, devisId: "26010003",
    pecSecu:    { baseRemboursement: 0.15, tauxSS: 60, montantSS: 0.09 },
    pecMutuelle: { nom: "MGEN", contrat: "MGEN Santé Confort", garantieOptique: "200 € / verre + 80 € / monture", montant: 200, reseauAdherent: true },
    rac: 479.91,
    facture: { id: "26010003", date: "2026-01-25", montant: 479.91, statut: "Payé", modePaiement: "CB + TP mutuelle" },
    livraison: { date: "25 jan. 2026", monteurOpticien: "Paul Martin", signe: true },
    garanties: [
      { produit: "Monture Ray-Ban RB5154 Tortoise", garantieFab: "Jan. 2028", garantieMag: "Jan. 2027", statut: "Valide", dateFinGarantie: "2027-01-25" },
      { produit: "Verres Varilux X Design OD+OG",   garantieFab: "Jan. 2028", garantieMag: "Jan. 2027", statut: "Valide", dateFinGarantie: "2027-01-25" },
    ],
  },
  v2: {
    id: "v2", patientId: "marie-leblanc", patientNom: "Marie Leblanc",
    date: "2025-09-10", dateFr: "10 sept. 2025",
    typeEquipement: "lentilles", statut: "En attente",
    lignes: [
      { id: "l1", categorie: "lentilles", designation: "Air Optix Aqua Mensuelle OD −2,00", marque: "Alcon", reference: "AOA-OD200", qte: 6, prixUnitaire: 9, total: 54, tauxTVA: 5.5 },
      { id: "l2", categorie: "lentilles", designation: "Air Optix Aqua Mensuelle OG −1,50", marque: "Alcon", reference: "AOA-OG150", qte: 6, prixUnitaire: 9, total: 54, tauxTVA: 5.5 },
      { id: "l3", categorie: "accessoire", designation: "Solution ReNu MPS 360 ml",          marque: "Bausch+Lomb", reference: "RENU360", qte: 2, prixUnitaire: 12.80, total: 25.60, tauxTVA: 20 },
    ],
    totalHT: 129.81, totalTTC: 133.60, devisId: "25090118",
    pecMutuelle: { nom: "MGEN", contrat: "MGEN Santé Confort", garantieOptique: "30 € / an", montant: 30, reseauAdherent: true },
    rac: 103.60,
  },
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function eur(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}
function dateFr(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function dateLong(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

const CAT_LABELS: Record<string, string> = {
  monture: "Monture", "verre-od": "Verre OD", "verre-og": "Verre OG",
  lentilles: "Lentilles", accessoire: "Accessoire", prestation: "Prestation",
};

/* ─── Décomposition TVA ─────────────────────────────────────────────────── */
function computeTVA(lignes: LigneEquipement[]) {
  let ht20 = 0, tva20 = 0;
  let ht55 = 0, tva55 = 0;
  for (const l of lignes) {
    const taux = l.tauxTVA ?? (l.categorie === "monture" || l.categorie === "accessoire" ? 20 : 5.5);
    const ht = l.total / (1 + taux / 100);
    const tva = l.total - ht;
    if (taux === 20) { ht20 += ht; tva20 += tva; }
    else             { ht55 += ht; tva55 += tva; }
  }
  return { ht20, tva20, ht55, tva55 };
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const s: Record<string, CSSProperties> = {
  sectionTitle: {
    fontSize: 10, fontWeight: 700, color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8,
  },
  box: {
    border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px",
  },
};

/* ─── PAGE ───────────────────────────────────────────────────────────────── */
export default function FacturePage() {
  const params = useParams<{ id: string; visiteId: string }>();
  const searchParams = useSearchParams();
  const { id, visiteId } = params;
  const autoPrint = searchParams.get("autoprint") === "1";

  const [config, setConfig] = useState<StoreConfig | null>(null);

  useEffect(() => {
    setConfig(loadStoreConfig());
    if (autoPrint) {
      // Laisser le temps au DOM de se rendre
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [autoPrint]);

  const d = MOCK[visiteId];

  if (!d) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
        Dossier introuvable.
        <br />
        <Link href={`/clair-vision/pro/patients/${id}/visites/${visiteId}`} style={{ color: "#2D8CFF" }}>← Retour</Link>
      </div>
    );
  }

  const isFacture  = d.statut === "Facturé" || d.statut === "Payé";
  const docType    = isFacture ? "FACTURE" : "DEVIS";
  const docId      = isFacture ? (d.facture?.id ?? d.devisId) : d.devisId;
  const docDate    = isFacture ? (d.facture?.date ?? d.date) : d.date;
  const totalPEC   = (d.pecSecu?.montantSS ?? 0) + (d.pecMutuelle?.montant ?? 0);
  const rac        = d.rac ?? d.totalTTC - totalPEC;
  const { ht20, tva20, ht55, tva55 } = computeTVA(d.lignes);
  const totalHT    = ht20 + ht55;

  /* Infos cabinet depuis storeConfig */
  const cab = {
    nom:       config?.nom       ?? "Clair Vision",
    adresse:   config?.adresse   ?? "",
    cp:        config?.codePostal ?? "",
    ville:     config?.ville     ?? "",
    tel:       config?.telephone ?? "",
    email:     config?.email     ?? "",
    siret:     config?.siret     ?? "",
    adeli:     config?.adeli     ?? "",
    finess:    config?.finess    ?? "",
    tvaNum:    "",
    signataire:     config?.signataire     ?? "",
    signataireRPPS: config?.signataireRPPS ?? "",
    signatureB64:   config?.signatureBase64 ?? "",
    cachetB64:      config?.cachetBase64   ?? "",
  };

  const btn: CSSProperties = {
    padding: "8px 18px", borderRadius: 9, fontSize: 13, fontWeight: 600,
    border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7,
  };

  /* Date limite garantie commerciale (la plus éloignée) */
  const latestGarantieDate = d.garanties
    ?.map(g => g.dateFinGarantie)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  return (
    <>
      {/* ── PRINT CSS ──────────────────────────────────────────────────── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .invoice-wrap { box-shadow: none !important; border: none !important; border-radius: 0 !important; }
          @page { size: A4; margin: 8mm 10mm; }
          .inv-table th { padding: 4px 7px !important; font-size: 9px !important; }
          .inv-table td { padding: 4px 7px !important; font-size: 10px !important; }
          .inv-table td div { font-size: 10px !important; }
          .inv-table td div[style*="font-size: 10"] { font-size: 9px !important; }
        }
        @media screen { body { background: #f1f5f9; } }
        .inv-table { width: 100%; border-collapse: collapse; }
        .inv-table th {
          background: #f8fafc; font-size: 10px; font-weight: 700; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.06em;
          padding: 6px 8px; border-bottom: 1.5px solid #e2e8f0;
        }
        .inv-table td {
          font-size: 11px; padding: 6px 8px;
          border-bottom: 1px solid #f1f5f9; vertical-align: top;
        }
        .inv-table tr:last-child td { border-bottom: none; }
      `}</style>

      {/* ── TOOLBAR ────────────────────────────────────────────────────── */}
      <div className="no-print" style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(226,232,240,0.8)", position: "sticky", top: 0, zIndex: 10 }}>
        <Link href={`/clair-vision/pro/patients/${id}/visites/${visiteId}`}
          style={{ ...btn, background: "rgba(241,245,249,0.9)", color: "#374151", textDecoration: "none" }}>
          ← Retour
        </Link>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
          {docType} N° {docId} — {d.patientNom}
        </span>
        <button style={{ ...btn, background: "#2D8CFF", color: "white" }}
          onClick={() => window.print()}>
          Imprimer / PDF
        </button>
      </div>

      {/* ── DOCUMENT A4 ────────────────────────────────────────────────── */}
      <div style={{ padding: "20px 16px", minHeight: "100vh" }}>
        <div className="invoice-wrap" style={{ maxWidth: 760, margin: "0 auto", background: "white", borderRadius: 12, boxShadow: "0 4px 32px rgba(0,0,0,0.10)", overflow: "hidden" }}>

          {/* ── EN-TÊTE ─────────────────────────────────────────────── */}
          <div style={{ padding: "16px 24px 12px", borderBottom: "2px solid #2D8CFF", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
            <div>
              {/* Logo / nom enseigne */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                {config?.logo
                  ? <img src={config.logo} alt="logo" style={{ height: 40, maxWidth: 120, objectFit: "contain" }} />
                  : <span style={{ fontSize: 26 }}></span>
                }
                <span style={{ fontSize: 17, fontWeight: 900, color: "#1e293b", letterSpacing: "-0.02em" }}>
                  {cab.nom}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.9 }}>
                {cab.adresse && <>{cab.adresse}{cab.ville && ` — ${cab.cp} ${cab.ville}`}<br /></>}
                {cab.tel && <>Tél : {cab.tel}{cab.email && ` · ${cab.email}`}<br /></>}
                {cab.siret && <>SIRET : {cab.siret}<br /></>}
                {cab.adeli && <>N° ADELI : {cab.adeli}<br /></>}
                {cab.finess && <>N° FINESS : {cab.finess}<br /></>}
                Conventionné Assurance Maladie
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#2D8CFF", letterSpacing: "0.04em" }}>{docType}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginTop: 3, fontFamily: "monospace" }}>N° {docId}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 6, lineHeight: 1.9 }}>
                Émis le : <strong>{dateFr(docDate)}</strong><br />
                {isFacture && (
                  <span style={{ color: "#15803d", fontWeight: 700 }}>✓ Payé</span>
                )}
                {!isFacture && (
                  <span style={{ color: "#f59e0b", fontWeight: 700 }}>{d.statut}</span>
                )}
              </div>
            </div>
          </div>

          {/* ── PATIENT + ORDONNANCE ─────────────────────────────────── */}
          <div style={{ padding: "10px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, borderBottom: "1px solid #f1f5f9" }}>
            <div>
              <div style={s.sectionTitle}>Facturé à</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{d.patientNom}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, lineHeight: 1.9 }}>
                {d.patientDN && <>Né(e) le : {dateFr(d.patientDN)}<br /></>}
                {d.patientNIR && <>NIR : <span style={{ fontFamily: "monospace" }}>{d.patientNIR}</span><br /></>}
              </div>
            </div>
            {d.ordonnance && (
              <div>
                <div style={s.sectionTitle}>Ordonnance</div>
                <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.9 }}>
                  N° <strong style={{ fontFamily: "monospace" }}>{d.ordonnance.numero}</strong><br />
                  Prescripteur : <strong>{d.ordonnance.prescripteur}</strong><br />
                  {d.ordonnance.rpps && <>RPPS : <span style={{ fontFamily: "monospace" }}>{d.ordonnance.rpps}</span><br /></>}
                  Émise le : <strong>{dateFr(d.ordonnance.dateOrdonnance)}</strong>
                </div>
                <div style={{ marginTop: 8, display: "flex", gap: 10 }}>
                  {(["od", "og"] as const).map(eye => (
                    <div key={eye} style={{ borderRadius: 7, padding: "5px 10px", background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: 11 }}>
                      <span style={{ fontWeight: 800, color: "#2D8CFF", textTransform: "uppercase", marginRight: 5 }}>{eye}</span>
                      <span style={{ color: "#374151" }}>
                        {d.ordonnance![eye].sph} / {d.ordonnance![eye].cyl} / {d.ordonnance![eye].axe}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── ÉQUIPEMENT ───────────────────────────────────────────── */}
          <div style={{ padding: "10px 24px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ ...s.sectionTitle, marginBottom: 8 }}>
              Équipement{d.devisId ? ` — Réf. devis ${d.devisId}` : ""}
            </div>
            <table className="inv-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Désignation</th>
                  <th style={{ textAlign: "center" }}>Qté</th>
                  <th style={{ textAlign: "right" }}>P.U. TTC</th>
                  <th style={{ textAlign: "right" }}>Total TTC</th>
                  <th style={{ textAlign: "center" }}>TVA</th>
                  <th style={{ textAlign: "center" }}>Cl.</th>
                </tr>
              </thead>
              <tbody>
                {d.lignes.map(l => {
                  const taux = l.tauxTVA ?? (l.categorie === "monture" || l.categorie === "accessoire" ? 20 : 5.5);
                  return (
                    <tr key={l.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: "#1e293b" }}>{l.designation}</div>
                        {l.materiau && (
                          <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>
                            Matière : {l.materiau}
                          </div>
                        )}
                        {l.traitements && (
                          <div style={{ fontSize: 10, color: "#64748b", marginTop: 1, fontStyle: "italic" }}>
                            {l.traitements}
                          </div>
                        )}
                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                          {CAT_LABELS[l.categorie] ?? l.categorie}
                          {l.marque && ` · ${l.marque}`}
                          {l.reference && ` · ${l.reference}`}
                        </div>
                      </td>
                      <td style={{ textAlign: "center", color: "#64748b" }}>{l.qte}</td>
                      <td style={{ textAlign: "right", color: "#64748b" }}>{eur(l.prixUnitaire)}</td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "#1e293b" }}>{eur(l.total)}</td>
                      <td style={{ textAlign: "center", color: "#64748b", fontSize: 11 }}>{taux}%</td>
                      <td style={{ textAlign: "center" }}>
                        {l.classe && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: l.classe === "A" ? "rgba(0,201,138,0.12)" : "rgba(99,102,241,0.10)", color: l.classe === "A" ? "#059669" : "#6366f1" }}>
                            Cl.{l.classe}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Totaux avec décomposition TVA */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <table style={{ borderCollapse: "collapse", fontSize: 11, minWidth: 260 }}>
                <tbody>
                  {ht20 > 0 && (
                    <tr>
                      <td style={{ padding: "2px 10px", color: "#94a3b8", textAlign: "right", fontSize: 10 }}>HT 20 % · TVA 20 % (montures)</td>
                      <td style={{ padding: "2px 10px", textAlign: "right", color: "#64748b" }}>{eur(ht20)} · {eur(tva20)}</td>
                    </tr>
                  )}
                  {ht55 > 0 && (
                    <tr>
                      <td style={{ padding: "2px 10px", color: "#94a3b8", textAlign: "right", fontSize: 10 }}>HT 5,5 % · TVA 5,5 % (verres)</td>
                      <td style={{ padding: "2px 10px", textAlign: "right", color: "#64748b" }}>{eur(ht55)} · {eur(tva55)}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: "2px 10px", color: "#64748b", textAlign: "right" }}>Total HT</td>
                    <td style={{ padding: "2px 10px", textAlign: "right", fontWeight: 600, color: "#374151" }}>{eur(totalHT)}</td>
                  </tr>
                  <tr style={{ borderTop: "2px solid #e2e8f0" }}>
                    <td style={{ padding: "5px 10px", fontWeight: 700, color: "#1e293b", textAlign: "right" }}>Total TTC</td>
                    <td style={{ padding: "5px 10px", textAlign: "right", fontSize: 15, fontWeight: 900, color: "#2D8CFF" }}>{eur(d.totalTTC)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── PRISE EN CHARGE ──────────────────────────────────────── */}
          {(d.pecSecu || d.pecMutuelle) && (
            <div style={{ padding: "8px 24px", borderBottom: "1px solid #f1f5f9", background: "#fafbfc" }}>
              <div style={s.sectionTitle}>Prise en charge</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <tbody>
                  {d.pecSecu && (
                    <tr>
                      <td style={{ padding: "4px 0", color: "#64748b" }}>
                        Part Sécurité Sociale ({d.pecSecu.tauxSS} % base LPPR — Cl.B)
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600, color: "#15803d" }}>− {eur(d.pecSecu.montantSS)}</td>
                    </tr>
                  )}
                  {d.pecMutuelle && (
                    <tr>
                      <td style={{ padding: "4px 0", color: "#64748b" }}>
                        Part {d.pecMutuelle.nom}{d.pecMutuelle.contrat ? ` (${d.pecMutuelle.contrat})` : ""}
                        {d.pecMutuelle.reseauAdherent && (
                          <span style={{ marginLeft: 6, fontSize: 10, color: "#15803d", fontWeight: 700 }}>Réseau ✓</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600, color: "#15803d" }}>− {eur(d.pecMutuelle.montant)}</td>
                    </tr>
                  )}
                  <tr style={{ borderTop: "1.5px solid #e2e8f0" }}>
                    <td style={{ padding: "8px 0", fontWeight: 700, color: "#1e293b", fontSize: 13 }}>
                      Reste à charge patient
                    </td>
                    <td style={{ textAlign: "right", fontSize: 18, fontWeight: 900, color: isFacture ? "#15803d" : "#2D8CFF" }}>
                      {isFacture ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13, background: "rgba(21,128,61,0.10)", borderRadius: 6, padding: "2px 10px", color: "#15803d" }}>✓ Réglé</span>
                          {eur(rac)}
                        </span>
                      ) : eur(rac)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ── LIVRAISON ────────────────────────────────────────────── */}
          {d.livraison && (
            <div style={{ padding: "7px 24px", borderBottom: "1px solid #f1f5f9" }}>
              <div style={s.sectionTitle}>Livraison</div>
              <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.9 }}>
                Date : <strong>{d.livraison.date}</strong>
                {d.livraison.monteurOpticien && <> · Monteur : <strong>{d.livraison.monteurOpticien}</strong></>}
                {" · "}Bon signé : <strong style={{ color: d.livraison.signe ? "#15803d" : "#f59e0b" }}>
                  {d.livraison.signe ? "✓ Oui" : "En attente"}
                </strong>
              </div>
            </div>
          )}

          {/* ── GARANTIES COMMERCIALES (upsell) ──────────────────────── */}
          {d.garanties && d.garanties.length > 0 && (
            <div style={{ padding: "7px 24px", borderBottom: "1px solid #f1f5f9", background: "rgba(45,140,255,0.02)", borderTop: "1px dashed rgba(45,140,255,0.18)" }}>
              <div style={{ ...s.sectionTitle, color: "#2D8CFF", marginBottom: 5 }}>Protection optique (hors garanties légales)</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, color: "#64748b" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ textAlign: "left", padding: "2px 6px 4px 0", fontWeight: 600, color: "#94a3b8" }}>Produit</th>
                    <th style={{ textAlign: "center", padding: "2px 6px 4px", fontWeight: 600, color: "#94a3b8" }}>Garantie fabricant</th>
                    <th style={{ textAlign: "center", padding: "2px 6px 4px", fontWeight: 600, color: "#94a3b8" }}>Extension magasin</th>
                    <th style={{ textAlign: "center", padding: "2px 0 4px 6px", fontWeight: 600, color: "#94a3b8" }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {d.garanties.map((g, i) => (
                    <tr key={i}>
                      <td style={{ padding: "3px 6px 3px 0" }}>{g.produit}</td>
                      <td style={{ padding: "3px 6px", textAlign: "center" }}>{g.garantieFab}</td>
                      <td style={{ padding: "3px 6px", textAlign: "center" }}>{g.garantieMag}</td>
                      <td style={{ padding: "3px 0 3px 6px", textAlign: "center", fontWeight: 600, color: g.statut === "Valide" ? "#15803d" : "#ef4444" }}>{g.statut}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {latestGarantieDate && (
                <div style={{ marginTop: 5, fontSize: 9, color: "#1d4ed8", fontStyle: "italic" }}>
                  Vous avez jusqu&apos;au <strong>{dateLong(latestGarantieDate)}</strong> pour prolonger la protection de votre équipement — renseignez-vous en magasin.
                </div>
              )}
            </div>
          )}

          {/* ── SIGNATURES ───────────────────────────────────────────── */}
          <div style={{ padding: "10px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            {/* Opticien */}
            <div>
              <div style={s.sectionTitle}>Signature et cachet de l&apos;opticien</div>
              {cab.signatureB64 ? (
                <img src={cab.signatureB64} alt="signature" style={{ maxHeight: 50, maxWidth: 160, objectFit: "contain", marginBottom: 6 }} />
              ) : (
                <div style={{ borderBottom: "1.5px solid #cbd5e1", paddingBottom: 4, marginBottom: 6, width: 160 }} />
              )}
              {cab.cachetB64 && (
                <img src={cab.cachetB64} alt="cachet" style={{ maxHeight: 50, maxWidth: 100, objectFit: "contain", marginLeft: 8 }} />
              )}
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 4, lineHeight: 1.7 }}>
                {cab.signataire || cab.nom}
                {cab.signataireRPPS && <> · N° RPPS : {cab.signataireRPPS}</>}
              </div>
              {d.opticienAccueil && (
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                  Reçu par : <strong style={{ color: "#475569" }}>{d.opticienAccueil}</strong>
                </div>
              )}
            </div>

            {/* Paiement / client */}
            {isFacture ? (
              <div style={{ background: "rgba(21,128,61,0.06)", border: "1.5px solid rgba(21,128,61,0.25)", borderRadius: 10, padding: "16px 18px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 28, color: "#15803d" }}>✓</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#15803d", marginTop: 4 }}>Payé</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                  le {dateFr(d.facture?.date ?? d.date)}
                </div>
              </div>
            ) : (
              <div>
                <div style={s.sectionTitle}>Bon pour accord — Signature client</div>
                <div style={{ borderBottom: "1.5px solid #cbd5e1", paddingBottom: 4, marginBottom: 6 }} />
                <div style={{ fontSize: 10, color: "#94a3b8" }}>Date : ____/____/______</div>
              </div>
            )}
          </div>

          {/* ── PIED DE PAGE ─────────────────────────────────────────── */}
          <div style={{ padding: "7px 24px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: 9, color: "#94a3b8", margin: 0, lineHeight: 1.9, textAlign: "center" }}>
              {cab.nom.toUpperCase()}{cab.siret ? ` · SIRET ${cab.siret}` : ""}{cab.adeli ? ` · N° ADELI ${cab.adeli}` : ""}{cab.finess ? ` · N° FINESS ${cab.finess}` : ""}<br />
              Conventionné Assurance Maladie · TVA 5,5 % verres/lentilles (art. 278-0 bis CGI) · TVA 20 % montures/accessoires<br />
              Garantie légale de conformité (art. L.217-4 Code de la consommation) · Garantie des vices cachés (art. 1641 Code civil) · Conservation 10 ans (art. L.110-4 Code de commerce)<br />
              {!isFacture && "Ce devis est valable 30 jours à compter de la date d'émission. "}
              Document généré par THOR · {new Date().toLocaleDateString("fr-FR")}
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
