"use client";

import { useState, useEffect, useCallback, useRef, type CSSProperties, type ReactNode, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { searchVerres, VERRES_DB, MARQUES_VERRES, type Verre, type VerreType } from "@/lib/verresDb";
import { STOCK, type StockItem, type StockCategorie } from "@/lib/stock";
import DraggableWindow from "@/components/ui/DraggableWindow";
import { printDevisVision, type DevisPdf } from "@/lib/pdf-devis-vision";
import { loadStoreConfig } from "@/lib/storeConfig";

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
  width: "100%",
  padding: "9px 12px",
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  fontSize: 13,
  color: "#1e293b",
  outline: "none",
  boxSizing: "border-box",
};
const selectStyle: CSSProperties = { ...inputStyle, cursor: "pointer" };

/* ═══════════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════════ */
type DevisStatus = "Brouillon" | "Signé" | "Commandé" | "Prêt" | "Livré" | "Facturé" | "Converti";
type DevisType = "lunettes" | "lentilles" | "solaire";
type ModePaiement = "CB" | "Espèces" | "Chèque" | "Virement" | "Tiers payant" | "Plusieurs fois" | "Geste commercial";
type LigneType = "monture" | "verre-od" | "verre-og" | "lentille" | "accessoire";

interface Ordonnance {
  prescripteurNom: string;
  prescripteurRPPS: string;
  dateOrdonnance: string;
  odSph: string; odCyl: string; odAxe: string; odAdd: string;
  ogSph: string; ogCyl: string; ogAxe: string; ogAdd: string;
}

/* Ordonnance telle que stockée dans thor_pro_ordonnances */
interface OrdLS {
  id: string;
  numero: string;
  patientNom: string;
  patientPrenom: string;
  dateOrdonnance: string;
  prescripteur: string;
  od: { sphere: number | null; cylindre: number | null; axe: number | null; addition: number | null };
  og: { sphere: number | null; cylindre: number | null; axe: number | null; addition: number | null };
  ecartPupillaire?: number;
}

interface DevisLigne {
  id: string;
  type: LigneType;
  designation: string;
  description?: string;
  lppr: string;
  classe: 1 | 2 | undefined;
  marque: string;
  reference: string;
  prixPublicHT: number;
  prixVenteTTC: number;
  tauxTVA: 5.5 | 20;
  priseEnChargeSS: number;
  priseEnChargeMutuelle: number;
  resteACharge: number;
}

interface Devis {
  id: string;
  type: DevisType;
  patientNom: string;
  patientPrenom: string;
  patientDN: string;
  patientSS: string;
  patientTel: string;
  patientEmail: string;
  mutuelleNom: string;
  mutuelleTaux: number;
  mutuellePlafond: number;
  ordonnance: Ordonnance;
  lignes: DevisLigne[];
  totalTTC: number;
  totalSS: number;
  totalMutuelle: number;
  resteACharge: number;
  date: string;
  dateValidite: string;
  status: DevisStatus;
  signatureClient: boolean;
  factureId: string;
  dateFacture: string;
  modePaiement: ModePaiement | "";
  acompte: number;
  dateSignature?: string;
  notes: string;
  dossierIds?: string[];
  /* ── Règlement du RAC ─────────────────── */
  nbEcheances?: number;
  raisonGeste?: string;
  racRegle?: boolean;
}

interface ClientInfo {
  nom: string;
  prenom: string;
  dateNaissance: string;
  numeroSS: string;
  telephone: string;
  email: string;
}

/* ═══════════════════════════════════════════════════════════════════════
   STATUS CONFIG
═══════════════════════════════════════════════════════════════════════ */
const STATUS_CONFIG: Record<DevisStatus, { bg: string; text: string; dot: string }> = {
  "Brouillon": { bg: "rgba(148,163,184,0.15)", text: "#475569", dot: "#94a3b8" },
  "Signé":     { bg: "rgba(45,140,255,0.12)",  text: "#1D6FCC", dot: "#2D8CFF" },
  "Commandé":  { bg: "rgba(139,92,246,0.12)",  text: "#6D28D9", dot: "#8B5CF6" },
  "Prêt":      { bg: "rgba(245,158,11,0.12)",  text: "#B45309", dot: "#F59E0B" },
  "Livré":     { bg: "rgba(0,201,138,0.12)",   text: "#047857", dot: "#00C98A" },
  "Facturé":   { bg: "rgba(16,185,129,0.18)",  text: "#065F46", dot: "#10B981" },
  "Converti":  { bg: "rgba(100,116,139,0.13)", text: "#475569", dot: "#94a3b8" },
};

/* ═══════════════════════════════════════════════════════════════════════
   MOCK DATA
═══════════════════════════════════════════════════════════════════════ */
const MOCK_VITALE_DATA: ClientInfo[] = [
  { nom: "HOFFMANN",  prenom: "Jean-Marc", dateNaissance: "15/03/1978", numeroSS: "1 78 03 67 085 012 48", telephone: "06 12 34 56 78", email: "" },
  { nom: "BEAUMONT",  prenom: "Claire",    dateNaissance: "22/09/1962", numeroSS: "2 62 09 75 118 006 23", telephone: "07 98 76 54 32", email: "" },
  { nom: "RICHARD",   prenom: "Baptiste",  dateNaissance: "04/07/1991", numeroSS: "1 91 07 44 236 019 14", telephone: "06 55 44 33 22", email: "" },
];

function makeValidite(dateIso: string): string {
  const d = new Date(dateIso);
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0] ?? "";
}

const MOCK_DEVIS: Devis[] = [
  {
    id: "DEV-2026-001", type: "lunettes",
    patientNom: "Leblanc", patientPrenom: "Marie",
    patientDN: "1985-06-12", patientSS: "2 85 06 75 112 045 18",
    patientTel: "06 11 22 33 44", patientEmail: "marie.leblanc@email.fr",
    mutuelleNom: "MGEN", mutuelleTaux: 60, mutuellePlafond: 0,
    ordonnance: {
      prescripteurNom: "Dr. Aurélie Voss", prescripteurRPPS: "10002345678",
      dateOrdonnance: "2026-01-15",
      odSph: "-2.75", odCyl: "-0.75", odAxe: "180", odAdd: "+2.00",
      ogSph: "-3.00", ogCyl: "-0.50", ogAxe: "175", ogAdd: "+2.00",
    },
    lignes: [
      { id: "l1", type: "monture", designation: "Ray-Ban Clubmaster RB5154", lppr: "2203786", classe: 1, marque: "Ray-Ban", reference: "RB5154-2012", prixPublicHT: 160, prixVenteTTC: 150, tauxTVA: 5.5, priseEnChargeSS: 2, priseEnChargeMutuelle: 100, resteACharge: 48 },
      { id: "l2", type: "verre-od", designation: "Varilux X Series 1.67 AR Photochromique OD Sph -2.75 Cyl -0.75 Axe 180", lppr: "2203799", classe: 2, marque: "Essilor", reference: "VX-167-PHOT-OD", prixPublicHT: 290, prixVenteTTC: 268.50, tauxTVA: 5.5, priseEnChargeSS: 0, priseEnChargeMutuelle: 80, resteACharge: 188.50 },
      { id: "l3", type: "verre-og", designation: "Varilux X Series 1.67 AR Photochromique OG Sph -3.00 Cyl -0.50 Axe 175", lppr: "2203799", classe: 2, marque: "Essilor", reference: "VX-167-PHOT-OG", prixPublicHT: 290, prixVenteTTC: 268.50, tauxTVA: 5.5, priseEnChargeSS: 0, priseEnChargeMutuelle: 80, resteACharge: 188.50 },
    ],
    totalTTC: 687, totalSS: 2, totalMutuelle: 260, resteACharge: 425,
    date: "2026-01-20", dateValidite: "2026-02-19",
    status: "Livré", signatureClient: true,
    factureId: "FAC-2026-001", dateFacture: "2026-02-01", modePaiement: "CB", acompte: 0, notes: "",
  },
  {
    id: "DEV-2026-002", type: "lentilles",
    patientNom: "Renaud", patientPrenom: "Paul",
    patientDN: "1992-03-28", patientSS: "1 92 03 13 045 078 22",
    patientTel: "07 55 66 77 88", patientEmail: "paul.renaud@email.fr",
    mutuelleNom: "Malakoff Humanis", mutuelleTaux: 50, mutuellePlafond: 150,
    ordonnance: {
      prescripteurNom: "Dr. Sylvain Lebrun", prescripteurRPPS: "10005678901",
      dateOrdonnance: "2025-12-10",
      odSph: "-1.50", odCyl: "0", odAxe: "", odAdd: "",
      ogSph: "-1.75", ogCyl: "-0.25", ogAxe: "90", ogAdd: "",
    },
    lignes: [
      { id: "l4", type: "lentille", designation: "CooperVision Biofinity Mensuelle OD Sph -1.50 x6", lppr: "2180083", classe: 1, marque: "CooperVision", reference: "BIOF-M-OD", prixPublicHT: 78, prixVenteTTC: 78, tauxTVA: 5.5, priseEnChargeSS: 0, priseEnChargeMutuelle: 39, resteACharge: 39 },
      { id: "l5", type: "lentille", designation: "CooperVision Biofinity Mensuelle OG Sph -1.75 Cyl -0.25 Axe 90 x6", lppr: "2180083", classe: 1, marque: "CooperVision", reference: "BIOF-M-OG", prixPublicHT: 78, prixVenteTTC: 78, tauxTVA: 5.5, priseEnChargeSS: 0, priseEnChargeMutuelle: 39, resteACharge: 39 },
    ],
    totalTTC: 156, totalSS: 0, totalMutuelle: 78, resteACharge: 78,
    date: "2026-02-05", dateValidite: "2026-03-07",
    status: "Commandé", signatureClient: true,
    factureId: "", dateFacture: "", modePaiement: "", acompte: 0, notes: "Livraison prévue sous 5 jours ouvrés.",
  },
  {
    id: "DEV-2026-003", type: "lunettes",
    patientNom: "Morel", patientPrenom: "Isabelle",
    patientDN: "1975-11-04", patientSS: "2 75 11 75 115 034 56",
    patientTel: "06 33 44 55 66", patientEmail: "i.morel@email.fr",
    mutuelleNom: "AXA Santé", mutuelleTaux: 70, mutuellePlafond: 500,
    ordonnance: {
      prescripteurNom: "Dr. Marc Fontaine", prescripteurRPPS: "10009012345",
      dateOrdonnance: "2026-02-20",
      odSph: "+1.25", odCyl: "-1.00", odAxe: "95", odAdd: "",
      ogSph: "+1.50", ogCyl: "-0.75", ogAxe: "85", ogAdd: "",
    },
    lignes: [
      { id: "l6", type: "monture", designation: "Lindberg Strip 9700 — Titanium Ultra-Light", lppr: "2203786", classe: 1, marque: "Lindberg", reference: "STRIP-9700-10", prixPublicHT: 380, prixVenteTTC: 380, tauxTVA: 5.5, priseEnChargeSS: 2, priseEnChargeMutuelle: 150, resteACharge: 228 },
      { id: "l7", type: "verre-od", designation: "Zeiss Single Vision ClearView 1.6 AR OD Sph +1.25 Cyl -1.00 Axe 95", lppr: "2203799", classe: 2, marque: "Zeiss", reference: "SV-16-AR-OD", prixPublicHT: 220, prixVenteTTC: 209, tauxTVA: 5.5, priseEnChargeSS: 0, priseEnChargeMutuelle: 80, resteACharge: 129 },
      { id: "l8", type: "verre-og", designation: "Zeiss Single Vision ClearView 1.6 AR OG Sph +1.50 Cyl -0.75 Axe 85", lppr: "2203799", classe: 2, marque: "Zeiss", reference: "SV-16-AR-OG", prixPublicHT: 220, prixVenteTTC: 209, tauxTVA: 5.5, priseEnChargeSS: 0, priseEnChargeMutuelle: 80, resteACharge: 129 },
    ],
    totalTTC: 798, totalSS: 2, totalMutuelle: 310, resteACharge: 486,
    date: "2026-03-01", dateValidite: "2026-03-31",
    status: "Signé", signatureClient: true,
    factureId: "", dateFacture: "", modePaiement: "", acompte: 0, notes: "",
  },
  {
    id: "DEV-2026-004", type: "solaire",
    patientNom: "Petit", patientPrenom: "Claire",
    patientDN: "1998-07-22", patientSS: "2 98 07 34 078 019 11",
    patientTel: "07 88 99 00 11", patientEmail: "claire.petit@email.fr",
    mutuelleNom: "MGEN", mutuelleTaux: 55, mutuellePlafond: 200,
    ordonnance: {
      prescripteurNom: "Dr. Nadia Cassel", prescripteurRPPS: "",
      dateOrdonnance: "2026-03-10",
      odSph: "-0.75", odCyl: "0", odAxe: "", odAdd: "",
      ogSph: "-1.00", ogCyl: "0", ogAxe: "", ogAdd: "",
    },
    lignes: [
      { id: "l9", type: "monture", designation: "Oakley Holbrook OO9102 — Matte Black", lppr: "", classe: undefined, marque: "Oakley", reference: "OO9102-01", prixPublicHT: 165, prixVenteTTC: 165, tauxTVA: 20, priseEnChargeSS: 0, priseEnChargeMutuelle: 80, resteACharge: 85 },
      { id: "l10", type: "verre-od", designation: "Verre solaire teinté Prizm Road OD Sph -0.75 Indice 1.6", lppr: "2203799", classe: 2, marque: "Oakley", reference: "PRIZM-OD", prixPublicHT: 95, prixVenteTTC: 90, tauxTVA: 5.5, priseEnChargeSS: 0, priseEnChargeMutuelle: 45, resteACharge: 45 },
      { id: "l11", type: "verre-og", designation: "Verre solaire teinté Prizm Road OG Sph -1.00 Indice 1.6", lppr: "2203799", classe: 2, marque: "Oakley", reference: "PRIZM-OG", prixPublicHT: 95, prixVenteTTC: 90, tauxTVA: 5.5, priseEnChargeSS: 0, priseEnChargeMutuelle: 45, resteACharge: 45 },
    ],
    totalTTC: 345, totalSS: 0, totalMutuelle: 170, resteACharge: 175,
    date: "2026-03-15", dateValidite: "2026-04-14",
    status: "Brouillon", signatureClient: false,
    factureId: "", dateFacture: "", modePaiement: "", acompte: 0, notes: "Patient à rappeler pour validation.",
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════ */
const AVATAR_COLORS = ["#2D8CFF", "#8B5CF6", "#00C98A", "#F59E0B", "#EF4444", "#EC4899"] as const;
function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? "#2D8CFF";
}
function initials(nom: string, prenom: string): string {
  return `${prenom[0] ?? ""}${nom[0] ?? ""}`.toUpperCase();
}
function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function formatDateLong(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}
function formatEur(n: number): string {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}
function today(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}
function genDevisId(list: Devis[]): string {
  const year = new Date().getFullYear();
  const nums = list.filter(d => d.id.startsWith(`DEV-${year}`)).map(d => parseInt(d.id.split("-")[2] ?? "0", 10));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `DEV-${year}-${String(next).padStart(3, "0")}`;
}
function genFactureId(list: Devis[]): string {
  const year = new Date().getFullYear();
  const nums = list.filter(d => d.factureId.startsWith(`FAC-${year}`)).map(d => parseInt(d.factureId.split("-")[2] ?? "0", 10));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `FAC-${year}-${String(next).padStart(3, "0")}`;
}
function calcLigne(ligne: Omit<DevisLigne, "resteACharge">): DevisLigne {
  return { ...ligne, resteACharge: Math.max(0, ligne.prixVenteTTC - ligne.priseEnChargeSS - ligne.priseEnChargeMutuelle) };
}

/* ═══════════════════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════════════════ */
function IconPlus() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>; }
function IconEdit() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>; }
function IconEye() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><ellipse cx="8" cy="8" rx="5" ry="3.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></svg>; }
function IconPrint() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="3" y="6" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M5 6V3h6v3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M5 10h6M5 12h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>; }
function IconClose() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function IconTrash() { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M6 5V3h4v2M5 5l.5 8h5L11 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function IconCard() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4M14 15h4"/></svg>; }
function IconCopy() { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M3 11V3h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function IconSign() { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 13c2-1 3-3 4-5s2-2 3-1-1 4 1 4 4-3 4-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 13h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>; }
function IconBox() { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 5l6-3 6 3v6l-6 3-6-3V5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M8 2v14M2 5l6 3 6-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>; }
function IconDownload() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2v9M5 8l3 3 3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function IconFacture() { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="3" y="1" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>; }

/* ═══════════════════════════════════════════════════════════════════════
   FACTURE localStorage — interface
═══════════════════════════════════════════════════════════════════════ */
interface FactureLS {
  id: string;
  numero: string;
  patientNom: string;
  patientPrenom: string;
  montantTTC: number;
  statut: "en_attente" | "payee" | "annulee";
  date: string;
  devisId: string;
  mutuelle?: string;
}

const FACTURES_STORAGE_KEY = "thor_pro_factures";

function loadFacturesLS(): FactureLS[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FACTURES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FactureLS[]) : [];
  } catch { return []; }
}

function saveFacturesLS(list: FactureLS[]) {
  try { localStorage.setItem(FACTURES_STORAGE_KEY, JSON.stringify(list)); } catch { /* noop */ }
}

/* ═══════════════════════════════════════════════════════════════════════
   EXPORT CSV
═══════════════════════════════════════════════════════════════════════ */
function exportCSV(devisList: Devis[]) {
  const rows: string[][] = [
    ["ID","Date","Patient","Description","Montant TTC","Statut","Acompte","Reste"],
    ...devisList.map(d => [
      d.id, d.date,
      `${d.patientPrenom} ${d.patientNom}`,
      d.lignes.map(l => l.designation).join(" | "),
      d.totalTTC.toFixed(2),
      d.status,
      (d.acompte ?? 0).toFixed(2),
      (d.totalTTC - (d.acompte ?? 0)).toFixed(2),
    ]),
  ];
  const csv = rows.map(r => r.map(cell => `"${cell.replace(/"/g,'""')}"`).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `devis-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════════════════════════
   SHARED SMALL COMPONENTS
═══════════════════════════════════════════════════════════════════════ */
function StatusBadge({ status }: { status: DevisStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, background: cfg.bg, color: cfg.text, fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}

function ActionBtn({ icon, label, color, bg, hoverBg, onClick }: { icon: ReactNode; label: string; color: string; bg: string; hoverBg: string; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 11px", borderRadius: 999, background: hover ? hoverBg : bg, color, fontWeight: 600, fontSize: 12, border: "none", cursor: "pointer", transition: "background 0.15s", whiteSpace: "nowrap" }}>
      {icon}{label}
    </button>
  );
}

function FormRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

function FormSection({ title, color, children }: { title: string; color: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ width: 3, height: 16, borderRadius: 2, background: color, flexShrink: 0 }} />
        <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: 0.7 }}>{title}</h3>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CARTE VITALE READER
   (conservé tel quel — fonctionne avec l'interface Sesam-Vitale simulée)
═══════════════════════════════════════════════════════════════════════ */
type VitaleStatus = "idle" | "inserting" | "reading" | "success" | "error";

function CarteVitaleReader({ onRead }: { onRead: (info: ClientInfo) => void }) {
  const [status, setStatus] = useState<VitaleStatus>("idle");
  const [progress, setProgress] = useState(0);

  function handleLecture() {
    setStatus("inserting");
    setProgress(0);
    setTimeout(() => {
      setStatus("reading");
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 18 + 8;
        setProgress(Math.min(p, 95));
        if (p >= 95) {
          clearInterval(interval);
          setProgress(100);
          setTimeout(() => {
            setStatus("success");
            const data = MOCK_VITALE_DATA[Math.floor(Math.random() * MOCK_VITALE_DATA.length)] ?? MOCK_VITALE_DATA[0];
            if (data) onRead(data);
          }, 300);
        }
      }, 200);
    }, 600);
  }

  function handleReset() { setStatus("idle"); setProgress(0); }

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: status === "success" ? "1.5px solid #00C98A" : "1.5px dashed rgba(45,140,255,0.35)", background: "var(--glass-subtle-bg)", transition: "border 0.3s" }}>
      <div style={{ background: status === "success" ? "#00C98A" : "linear-gradient(135deg,#1565C0,#1976D2,#1565C0)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 54, height: 36, borderRadius: 6, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="26" height="20" viewBox="0 0 26 20" fill="none">
            <rect x="0.5" y="0.5" width="25" height="19" rx="2.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
            <rect x="3" y="5" width="8" height="6" rx="1" fill="rgba(255,215,0,0.8)"/>
            <path d="M3 14h5M10 14h4M16 14h7" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: 0.3 }}>
            {status === "success" ? "Carte Vitale lue avec succès" : "Lecteur Carte Vitale"}
          </div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 2 }}>
            {status === "success" ? "Données patient importées automatiquement" : "Connexion via interface Sesam-Vitale"}
          </div>
        </div>
        {status === "success" && (
          <button onClick={handleReset} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        )}
      </div>
      <div style={{ padding: "18px 20px" }}>
        {status === "idle" && (
          <div style={{ textAlign: "center", paddingBlock: 8 }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14, lineHeight: 1.6 }}>
              Insérez la carte Vitale du patient dans le lecteur puis cliquez sur le bouton ci-dessous.<br/>Le patient sera créé automatiquement à partir des données CPAM.
            </div>
            <button onClick={handleLecture} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 999, background: "linear-gradient(135deg,#1976D2,#1565C0)", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(21,101,192,0.35)" }}>
              <IconCard /> Lire la carte Vitale
            </button>
          </div>
        )}
        {status === "inserting" && (
          <div style={{ textAlign: "center", paddingBlock: 8 }}>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>Initialisation du lecteur…</div>
            <div style={{ width: "100%", height: 6, borderRadius: 3, background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
              <div style={{ width: "30%", height: "100%", background: "linear-gradient(90deg,#1976D2,#42A5F5)", borderRadius: 3 }} />
            </div>
          </div>
        )}
        {status === "reading" && (
          <div style={{ textAlign: "center", paddingBlock: 8 }}>
            <div style={{ fontSize: 13, color: "#1976D2", fontWeight: 600, marginBottom: 8 }}>Lecture en cours… {Math.round(progress)}%</div>
            <div style={{ width: "100%", height: 6, borderRadius: 3, background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg,#1976D2,#42A5F5)", borderRadius: 3, transition: "width 0.15s ease" }} />
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>Déchiffrement des données CPAM…</div>
          </div>
        )}
        {status === "success" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,201,138,0.12)", border: "1.5px solid #00C98A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="#00C98A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#047857" }}>Données importées depuis la carte</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Vérifiez et complétez les informations ci-dessous si nécessaire</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PRISE EN CHARGE SS — LOOKUP SIMPLIFIÉ
═══════════════════════════════════════════════════════════════════════ */
/**
 * Prise en charge SS par verre (réforme 100% Santé)
 * Tarif LPPR base : 2.84€/verre — SS rembourse 60% = 1.70€
 * Classe 1 : SS 1.70€, mutuelle complète jusqu'au plafond 100% Santé
 * Classe 2 : SS 1.70€ (même tarif LPPR), RAC selon prix réel
 * Source : ameli.fr 2024-2025
 */
function computePriseEnChargeSS(verre: Verre): number {
  if (!verre.classeSS) return 0;
  // SS rembourse 60% × tarif LPPR de base (2.84€) = 1.70€ par verre
  // Les deux classes partagent le même tarif de base LPPR
  return 1.70;
}

/* ═══════════════════════════════════════════════════════════════════════
   AUTOCOMPLETE DÉSIGNATION VERRE
═══════════════════════════════════════════════════════════════════════ */
interface DesignationAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onSelectVerre: (v: Verre) => void;
}

function DesignationAutocomplete({ value, onChange, onSelectVerre }: DesignationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Verre[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim().length >= 2) {
      const results = searchVerres(value).slice(0, 6);
      setSuggestions(results);
      setOpen(results.length > 0);
      setActiveIdx(-1);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      const v = suggestions[activeIdx];
      if (v) { onSelectVerre(v); setOpen(false); }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function selectVerre(v: Verre) {
    onSelectVerre(v);
    setOpen(false);
  }

  const badgeStyle = (bg: string, color: string): CSSProperties => ({
    display: "inline-block", padding: "1px 7px", borderRadius: 999,
    background: bg, color, fontSize: 10, fontWeight: 700, flexShrink: 0,
  });

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input
        style={inputStyle}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Varilux X Series 1.67 AR… (2+ car. pour l'autocomplétude)"
        autoComplete="off"
      />
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 9999,
          background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
          border: "1px solid rgba(148,163,184,0.3)", overflow: "hidden",
        }}>
          {suggestions.map((v, i) => (
            <button
              key={v.id}
              onMouseDown={() => selectVerre(v)}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "9px 12px", background: i === activeIdx ? "rgba(45,140,255,0.08)" : "transparent",
                border: "none", borderBottom: i < suggestions.length - 1 ? "1px solid rgba(148,163,184,0.12)" : "none",
                cursor: "pointer", textAlign: "left",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.designation}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{v.traitements.join(" \u00b7 ")}</div>
              </div>
              <span style={badgeStyle("rgba(45,140,255,0.1)", "#1D6FCC")}>{v.marque}</span>
              <span style={badgeStyle("rgba(139,92,246,0.1)", "#6D28D9")}>n{v.indice}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", flexShrink: 0 }}>{v.prixVenteTTC.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CATALOGUE MODAL
═══════════════════════════════════════════════════════════════════════ */
const TYPE_FILTERS: { label: string; value: VerreType | "tous" }[] = [
  { label: "Tous", value: "tous" },
  { label: "Unifocaux", value: "unifocal" },
  { label: "Progressifs", value: "progressif" },
];

interface CatalogueModalProps {
  onClose: () => void;
  onSelect: (v: Verre) => void;
  selectedVerriers?: string[];
}

function CatalogueModal({ onClose, onSelect, selectedVerriers }: CatalogueModalProps) {
  const activeMarques = selectedVerriers && selectedVerriers.length > 0
    ? selectedVerriers
    : [...MARQUES_VERRES];

  const [marqueFilter, setMarqueFilter] = useState<string>("Tous");
  const [typeFilter, setTypeFilter] = useState<VerreType | "tous">("tous");
  const [query, setQuery] = useState("");

  const results = VERRES_DB.filter(v => {
    if (!activeMarques.includes(v.marque)) return false;
    if (marqueFilter !== "Tous" && v.marque !== marqueFilter) return false;
    if (typeFilter !== "tous" && v.type !== typeFilter) return false;
    if (query.trim().length >= 2) {
      const q = query.toLowerCase();
      return (
        v.designation.toLowerCase().includes(q) ||
        v.marque.toLowerCase().includes(q) ||
        v.gamme.toLowerCase().includes(q) ||
        (v.tags ?? []).some(t => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const pillStyle = (active: boolean): CSSProperties => ({
    padding: "5px 12px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
    background: active ? "rgba(45,140,255,0.12)" : "rgba(148,163,184,0.12)",
    color: active ? "#1D6FCC" : "#64748b",
  });

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ ...glass, borderRadius: 20, width: "100%", maxWidth: 780, maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 12px", borderBottom: "1px solid rgba(148,163,184,0.15)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Catalogue verres</h2>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>{results.length} r\u00e9f\u00e9rence{results.length > 1 ? "s" : ""}</p>
          </div>
          <input
            style={{ ...inputStyle, maxWidth: 220 }}
            placeholder="Rechercher\u2026"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4, display: "flex", borderRadius: 8 }}><IconClose /></button>
        </div>

        <div style={{ padding: "12px 24px", borderBottom: "1px solid rgba(148,163,184,0.1)", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["Tous", ...activeMarques].map(m => (
              <button key={m} style={pillStyle(marqueFilter === m)} onClick={() => setMarqueFilter(m)}>{m}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {TYPE_FILTERS.map(tf => (
              <button key={tf.value} style={pillStyle(typeFilter === tf.value)} onClick={() => setTypeFilter(tf.value)}>{tf.label}</button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {results.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 14, paddingTop: 40 }}>Aucun r\u00e9sultat.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
              {results.map(v => (
                <button
                  key={v.id}
                  onClick={() => { onSelect(v); onClose(); }}
                  style={{
                    background: "var(--glass-strong-bg)", border: "1px solid rgba(148,163,184,0.25)", borderRadius: 12,
                    padding: "12px 14px", cursor: "pointer", textAlign: "left", transition: "box-shadow 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(45,140,255,0.15)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                >
                  <div style={{ display: "flex", gap: 5, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 999, background: "rgba(45,140,255,0.1)", color: "#1D6FCC", fontSize: 10, fontWeight: 700 }}>{v.marque}</span>
                    <span style={{ padding: "2px 8px", borderRadius: 999, background: "rgba(139,92,246,0.1)", color: "#6D28D9", fontSize: 10, fontWeight: 700 }}>n{v.indice}</span>
                    {v.classeSS && <span style={{ padding: "2px 8px", borderRadius: 999, background: "rgba(0,201,138,0.1)", color: "#047857", fontSize: 10, fontWeight: 700 }}>Cl.{v.classeSS}</span>}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", lineHeight: 1.4, marginBottom: 4 }}>{v.designation}</div>
                  <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>{v.traitements.join(" \u00b7 ")}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#2D8CFF" }}>{v.prixVenteTTC.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ORDONNANCE PICKER — sélectionner depuis localStorage
═══════════════════════════════════════════════════════════════════════ */
function loadOrdonnancesLS(): OrdLS[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("thor_pro_ordonnances");
    if (!raw) return [];
    return JSON.parse(raw) as OrdLS[];
  } catch {
    return [];
  }
}

function fmtVal(v: number | null): string {
  if (v === null || v === undefined) return "";
  const s = v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2);
  return s;
}

interface OrdonnancePickerProps {
  onApply: (ord: OrdLS) => void;
  onClear: () => void;
  selected: OrdLS | null;
}

function OrdonnancePicker({ onApply, onClear, selected }: OrdonnancePickerProps) {
  const [open, setOpen] = useState(false);
  const [ordonnances, setOrdonnances] = useState<OrdLS[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const list = loadOrdonnancesLS();
      list.sort((a, b) => b.dateOrdonnance.localeCompare(a.dateOrdonnance));
      setOrdonnances(list);
      setActiveIdx(-1);
    }
  }, [open]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function handleKeyDown(e: ReactKeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, ordonnances.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      const ord = ordonnances[activeIdx];
      if (ord) { onApply(ord); setOpen(false); }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function eyeSummary(eye: OrdLS["od"]): string {
    const parts: string[] = [];
    if (eye.sphere !== null) parts.push(`Sph ${fmtVal(eye.sphere)}`);
    if (eye.cylindre !== null) parts.push(`Cyl ${fmtVal(eye.cylindre)}`);
    if (eye.axe !== null) parts.push(`Axe ${eye.axe}°`);
    if (eye.addition !== null) parts.push(`Add ${fmtVal(eye.addition)}`);
    return parts.join(" ") || "—";
  }

  return (
    <div ref={containerRef} style={{ marginBottom: 16 }}>
      {selected ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 12, background: "rgba(0,201,138,0.09)", border: "1.5px solid #00C98A" }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="#00C98A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#047857", flex: 1 }}>
            Ordonnance {selected.numero} — {selected.patientPrenom} {selected.patientNom}
          </span>
          <button
            onClick={onClear}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex", padding: 2, borderRadius: 4, lineHeight: 1 }}
            aria-label="Désélectionner l'ordonnance"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <button
              onClick={() => setOpen(o => !o)}
              onKeyDown={handleKeyDown}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 12, border: "1px solid rgba(148,163,184,0.35)", background: "var(--glass-strong-bg)", fontSize: 13, color: "#475569", cursor: "pointer", textAlign: "left" }}
            >
              <span style={{ fontSize: 15 }}></span>
              <span style={{ flex: 1 }}>Choisir une ordonnance</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 0.15s" }}>
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {open && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 9999, background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.14)", border: "1px solid rgba(148,163,184,0.3)", overflow: "hidden", maxHeight: 280, overflowY: "auto" }}>
                {ordonnances.length === 0 ? (
                  <div style={{ padding: "16px 14px", fontSize: 13, color: "#94a3b8", textAlign: "center" }}>
                    Aucune ordonnance enregistrée
                  </div>
                ) : (
                  ordonnances.map((ord, i) => (
                    <button
                      key={ord.id}
                      onMouseDown={() => { onApply(ord); setOpen(false); }}
                      style={{ display: "block", width: "100%", padding: "10px 14px", background: i === activeIdx ? "rgba(45,140,255,0.08)" : "transparent", border: "none", borderBottom: i < ordonnances.length - 1 ? "1px solid rgba(148,163,184,0.12)" : "none", cursor: "pointer", textAlign: "left" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{ord.numero}</span>
                        <span style={{ fontSize: 11, color: "#64748b" }}>·</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{ord.patientPrenom} {ord.patientNom}</span>
                        <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: "auto" }}>
                          {ord.dateOrdonnance ? new Date(ord.dateOrdonnance).toLocaleDateString("fr-FR") : "—"}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        {ord.prescripteur && <span style={{ marginRight: 8 }}>{ord.prescripteur}</span>}
                        <span style={{ color: "#2D8CFF" }}>OD {eyeSummary(ord.od)}</span>
                        <span style={{ margin: "0 6px", color: "#cbd5e1" }}>|</span>
                        <span style={{ color: "#8B5CF6" }}>OG {eyeSummary(ord.og)}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <span style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>ou saisir manuellement</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   STOCK MODAL
═══════════════════════════════════════════════════════════════════════ */
const STOCK_CATEGORIES: { label: string; value: StockCategorie | "tous" }[] = [
  { label: "Tous", value: "tous" },
  { label: "Verres progressifs", value: "verres-progressifs" },
  { label: "Verres simples", value: "verres-simples" },
  { label: "Montures optiques", value: "montures-optiques" },
  { label: "Montures solaires", value: "montures-solaires" },
  { label: "Lentilles souples", value: "lentilles-souples" },
  { label: "Lentilles rigides", value: "lentilles-rigides" },
  { label: "Accessoires", value: "accessoires" },
];

function loadStockWithOverrides(): StockItem[] {
  let items = [...STOCK];
  if (typeof window === "undefined") return items;
  try {
    const raw = localStorage.getItem("thor_pro_stock_items");
    if (raw) {
      const overrides = JSON.parse(raw) as StockItem[];
      // Merge: override by id
      const map = new Map<string, StockItem>(items.map(i => [i.id, i]));
      for (const ov of overrides) map.set(ov.id, ov);
      items = Array.from(map.values());
    }
  } catch { /* noop */ }
  return items.filter(i => i.actif);
}

function StockModal({ onClose, onSelect }: { onClose: () => void; onSelect: (item: StockItem) => void }) {
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState<StockCategorie | "tous">("tous");
  const [items, setItems] = useState<StockItem[]>([]);

  useEffect(() => {
    setItems(loadStockWithOverrides());
  }, []);

  const results = items.filter(item => {
    if (catFilter !== "tous" && item.categorie !== catFilter) return false;
    if (query.trim().length >= 2) {
      const q = query.toLowerCase();
      return item.reference.toLowerCase().includes(q) || item.marque.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  const pillStyle = (active: boolean): CSSProperties => ({
    padding: "4px 10px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
    background: active ? "rgba(99,102,241,0.15)" : "rgba(148,163,184,0.12)",
    color: active ? "#6366f1" : "#64748b",
    whiteSpace: "nowrap",
  });

  return (
    <DraggableWindow title="Depuis le stock" badge={`${results.length} article${results.length !== 1 ? "s" : ""}`} onClose={onClose} defaultWidth={700} defaultHeight={500}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--glass-card-bg)" }}>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(148,163,184,0.15)", display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input style={{ ...inputStyle, paddingLeft: 32 }} placeholder="Rechercher dans le stock…" value={query} onChange={e => setQuery(e.target.value)} autoFocus />
            <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
        </div>
        <div style={{ padding: "8px 20px", borderBottom: "1px solid rgba(148,163,184,0.1)", display: "flex", gap: 5, flexWrap: "wrap" }}>
          {STOCK_CATEGORIES.map(c => (
            <button key={c.value} style={pillStyle(catFilter === c.value)} onClick={() => setCatFilter(c.value)}>{c.label}</button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
          {results.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94a3b8", paddingTop: 40, fontSize: 14 }}>Aucun article trouvé.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {results.map(item => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item)}
                  style={{ background: "var(--glass-strong-bg)", border: "1px solid rgba(148,163,184,0.25)", borderRadius: 12, padding: "11px 13px", cursor: "pointer", textAlign: "left", transition: "box-shadow 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.15)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                >
                  <div style={{ display: "flex", gap: 5, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 999, background: "rgba(99,102,241,0.1)", color: "#6366f1", fontSize: 10, fontWeight: 700 }}>{item.marque}</span>
                    <span style={{ padding: "2px 8px", borderRadius: 999, background: "rgba(148,163,184,0.12)", color: "#64748b", fontSize: 10, fontWeight: 600 }}>{item.categorie.replace("-", " ")}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", lineHeight: 1.3, marginBottom: 4 }}>{item.reference}</div>
                  <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6, lineHeight: 1.4 }}>{item.description}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>Qté: <strong style={{ color: item.quantite <= item.quantiteMin ? "#EF4444" : "#1e293b" }}>{item.quantite}</strong></span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#6366f1" }}>{formatEur(item.prixVente)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </DraggableWindow>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MODALE SIGNATURE SIMULÉE
═══════════════════════════════════════════════════════════════════════ */
function ModalSignature({ devis, onClose, onSigned, showToast }: { devis: Devis; onClose: () => void; onSigned: (updated: Devis) => void; showToast: (msg: string) => void }) {
  const [checked, setChecked] = useState(false);

  function handleValider() {
    if (!checked) return;
    const updated: Devis = {
      ...devis,
      status: "Signé",
      signatureClient: true,
      dateSignature: today(),
    };
    onSigned(updated);
    showToast(`Devis signé et archivé.`);
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1300, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ ...glass, borderRadius: 20, width: "100%", maxWidth: 500, padding: "28px 30px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Faire signer le devis</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", borderRadius: 8 }}><IconClose /></button>
        </div>

        <div style={{ ...glassSubtle, borderRadius: 14, padding: "14px 18px", marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{devis.patientPrenom} {devis.patientNom}</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Devis {devis.id} — {formatDate(devis.date)}</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#2D8CFF", marginTop: 8 }}>Montant TTC : {formatEur(devis.totalTTC)}</div>
          <div style={{ fontSize: 12, color: "#059669" }}>Reste à charge : {formatEur(devis.resteACharge)}</div>
        </div>

        <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(45,140,255,0.06)", border: "1px solid rgba(45,140,255,0.2)", fontSize: 12, color: "#334155", lineHeight: 1.6, marginBottom: 18 }}>
          Le patient <strong>{devis.patientPrenom} {devis.patientNom}</strong> confirme avoir pris connaissance et accepté ce devis conformément à l&#39;arrêté du 29 octobre 2014 relatif aux devis normalisés en optique-lunetterie.
        </div>

        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "12px 14px", borderRadius: 12, background: checked ? "rgba(0,201,138,0.09)" : "rgba(148,163,184,0.08)", border: checked ? "1.5px solid #00C98A" : "1px solid rgba(148,163,184,0.3)", transition: "all 0.2s", marginBottom: 20 }}>
          <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} style={{ width: 18, height: 18, accentColor: "#00C98A", cursor: "pointer", marginTop: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: checked ? "#047857" : "#475569" }}>
            Je confirme que le patient a lu, compris et approuvé ce devis en ma présence.
          </span>
        </label>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 12, border: "1px solid rgba(148,163,184,0.3)", background: "transparent", color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Annuler</button>
          <button onClick={handleValider} disabled={!checked}
            style={{ padding: "9px 22px", borderRadius: 12, border: "none", background: checked ? "#00C98A" : "rgba(148,163,184,0.25)", color: checked ? "#fff" : "#94a3b8", fontWeight: 700, fontSize: 13, cursor: checked ? "pointer" : "default", transition: "all 0.2s" }}>
            <IconSign /> Valider la signature
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MODALE NOUVEAU DEVIS — STEPPER 4 ÉTAPES
═══════════════════════════════════════════════════════════════════════ */
const EMPTY_ORDONNANCE: Ordonnance = { prescripteurNom: "", prescripteurRPPS: "", dateOrdonnance: "", odSph: "", odCyl: "", odAxe: "", odAdd: "", ogSph: "", ogCyl: "", ogAxe: "", ogAdd: "" };
const EMPTY_CLIENT: ClientInfo = { nom: "", prenom: "", dateNaissance: "", numeroSS: "", telephone: "", email: "" };

interface NouveauDevisState {
  step: 1 | 2 | 3 | 4;
  clientMode: "existant" | "nouveau";
  vitaleTab: "manuel" | "vitale";
  client: ClientInfo;
  type: DevisType;
  mutuelleNom: string;
  mutuelleTaux: number;
  mutuellePlafond: string;
  ordonnance: Ordonnance;
  lignes: DevisLigne[];
  // ligne en cours de saisie
  ligneType: LigneType;
  ligneMarque: string;
  ligneReference: string;
  ligneDesignation: string;
  ligneDescription: string;
  lignePrixTTC: string;
  ligneTVA: "5.5" | "20";
  ligneLPPR: string;
  ligneClasse: "1" | "2" | "";
  ligneSS: string;
  ligneMutuelle: string;
  signatureClient: boolean;
  notes: string;
  acompte: string;
  modePaiementDevis: ModePaiement | "";
  pecSS: string;
  pecMutuelle: string;
}

function initNouveauDevisState(): NouveauDevisState {
  return {
    step: 1, clientMode: "nouveau", vitaleTab: "manuel",
    client: { ...EMPTY_CLIENT },
    type: "lunettes",
    mutuelleNom: "", mutuelleTaux: 0, mutuellePlafond: "0",
    ordonnance: { ...EMPTY_ORDONNANCE },
    lignes: [],
    ligneType: "monture", ligneMarque: "", ligneReference: "", ligneDesignation: "", ligneDescription: "",
    lignePrixTTC: "", ligneTVA: "5.5", ligneLPPR: "", ligneClasse: "", ligneSS: "", ligneMutuelle: "",
    signatureClient: false, notes: "",
    acompte: "", modePaiementDevis: "", pecSS: "", pecMutuelle: "",
  };
}

function ModalNouveauDevis({ onClose, onSave, allDevis, initialClient }: { onClose: () => void; onSave: (d: Devis) => void; allDevis: Devis[]; initialClient?: ClientInfo }) {
  const [s, setS] = useState<NouveauDevisState>(() => {
    const base = initNouveauDevisState();
    if (initialClient) return { ...base, client: initialClient };
    return base;
  });
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedOrdLS, setSelectedOrdLS] = useState<OrdLS | null>(null);
  const selectedVerriers = loadStoreConfig().verriers ?? [];

  function upd(patch: Partial<NouveauDevisState>) { setS(prev => ({ ...prev, ...patch })); }
  function updOrd(patch: Partial<Ordonnance>) { setS(prev => ({ ...prev, ordonnance: { ...prev.ordonnance, ...patch } })); }
  function updClient(patch: Partial<ClientInfo>) { setS(prev => ({ ...prev, client: { ...prev.client, ...patch } })); }

  function applyOrdLS(ord: OrdLS) {
    setSelectedOrdLS(ord);
    updOrd({
      prescripteurNom: ord.prescripteur,
      dateOrdonnance: ord.dateOrdonnance,
      odSph:  ord.od.sphere    !== null ? String(ord.od.sphere)    : "",
      odCyl:  ord.od.cylindre  !== null ? String(ord.od.cylindre)  : "",
      odAxe:  ord.od.axe       !== null ? String(ord.od.axe)       : "",
      odAdd:  ord.od.addition  !== null ? String(ord.od.addition)  : "",
      ogSph:  ord.og.sphere    !== null ? String(ord.og.sphere)    : "",
      ogCyl:  ord.og.cylindre  !== null ? String(ord.og.cylindre)  : "",
      ogAxe:  ord.og.axe       !== null ? String(ord.og.axe)       : "",
      ogAdd:  ord.og.addition  !== null ? String(ord.og.addition)  : "",
    });
    // Pre-fill patient name if step 1 fields are empty
    setS(prev => ({
      ...prev,
      client: {
        ...prev.client,
        nom:    prev.client.nom.trim()    === "" ? ord.patientNom    : prev.client.nom,
        prenom: prev.client.prenom.trim() === "" ? ord.patientPrenom : prev.client.prenom,
      },
    }));
  }

  function clearOrdLS() {
    setSelectedOrdLS(null);
    updOrd({ prescripteurNom: "", prescripteurRPPS: "", dateOrdonnance: "", odSph: "", odCyl: "", odAxe: "", odAdd: "", ogSph: "", ogCyl: "", ogAxe: "", ogAdd: "" });
  }

  function handleSelectVerre(v: Verre) {
    upd({
      ligneDesignation: v.designation,
      ligneDescription: v.description ?? "",
      ligneMarque: v.marque,
      ligneReference: v.id,
      ligneLPPR: v.lppr ?? "",
      ligneClasse: v.classeSS ? String(v.classeSS) as "1" | "2" : "",
      lignePrixTTC: String(v.prixVenteTTC),
      ligneTVA: String(v.tauxTVA) as "5.5" | "20",
      ligneSS: String(computePriseEnChargeSS(v)),
    });
  }

  const totalTTC = s.lignes.reduce((acc, l) => acc + l.prixVenteTTC, 0);
  const totalSS = s.lignes.reduce((acc, l) => acc + l.priseEnChargeSS, 0);
  const totalMutuelle = s.lignes.reduce((acc, l) => acc + l.priseEnChargeMutuelle, 0);
  const resteACharge = Math.max(0, totalTTC - totalSS - totalMutuelle);

  function addLigne() {
    const prixTTC = parseFloat(s.lignePrixTTC) || 0;
    const ss = parseFloat(s.ligneSS) || 0;
    const mut = parseFloat(s.ligneMutuelle) || 0;
    const ligne: DevisLigne = calcLigne({
      id: `nl-${Date.now()}`,
      type: s.ligneType,
      designation: s.ligneDesignation,
      description: s.ligneDescription || undefined,
      lppr: s.ligneLPPR,
      classe: s.ligneClasse === "1" ? 1 : s.ligneClasse === "2" ? 2 : undefined,
      marque: s.ligneMarque,
      reference: s.ligneReference,
      prixPublicHT: prixTTC / (s.ligneTVA === "5.5" ? 1.055 : 1.2),
      prixVenteTTC: prixTTC,
      tauxTVA: s.ligneTVA === "5.5" ? 5.5 : 20,
      priseEnChargeSS: ss,
      priseEnChargeMutuelle: mut,
    });
    upd({ lignes: [...s.lignes, ligne], ligneType: "monture", ligneMarque: "", ligneReference: "", ligneDesignation: "", ligneDescription: "", lignePrixTTC: "", ligneLPPR: "", ligneClasse: "", ligneSS: "", ligneMutuelle: "" });
  }

  function removeLigne(id: string) { upd({ lignes: s.lignes.filter(l => l.id !== id) }); }

  function addLigneFromStock(item: StockItem) {
    // Lire prix verre depuis overrides localStorage si disponible
    let prixTTC = item.prixVente;
    if (item.categorie.startsWith("verres")) {
      try {
        const overrides = JSON.parse(localStorage.getItem("thor_pro_stock_prix_verres") ?? "{}") as Record<string, number>;
        if (overrides[item.id] !== undefined) prixTTC = overrides[item.id] ?? prixTTC;
      } catch { /* noop */ }
    }
    const typeMap: Record<StockCategorie, LigneType> = {
      "verres-progressifs": "verre-od",
      "verres-simples": "verre-od",
      "montures-optiques": "monture",
      "montures-solaires": "monture",
      "lentilles-souples": "lentille",
      "lentilles-rigides": "lentille",
      "accessoires": "accessoire",
    };
    const ligne: DevisLigne = calcLigne({
      id: `nl-${Date.now()}`,
      type: typeMap[item.categorie],
      designation: item.reference,
      description: item.description,
      lppr: "",
      classe: undefined,
      marque: item.marque,
      reference: item.reference,
      prixPublicHT: item.prixAchat,
      prixVenteTTC: prixTTC,
      tauxTVA: 5.5,
      priseEnChargeSS: 0,
      priseEnChargeMutuelle: 0,
    });
    upd({ lignes: [...s.lignes, ligne] });
  }

  function save() {
    const dateToday = today();
    const acompteVal = parseFloat(s.acompte) || 0;
    // Calcul PEC avec overrides manuels
    const computedSS  = s.pecSS !== "" ? parseFloat(s.pecSS) || 0 : totalSS;
    const computedMut = s.pecMutuelle !== "" ? parseFloat(s.pecMutuelle) || 0 : totalMutuelle;
    const racFinal = Math.max(0, totalTTC - computedSS - computedMut);
    const raw: Devis = {
      id: genDevisId(allDevis),
      type: s.type,
      patientNom: s.client.nom,
      patientPrenom: s.client.prenom,
      patientDN: s.client.dateNaissance,
      patientSS: s.client.numeroSS,
      patientTel: s.client.telephone,
      patientEmail: s.client.email,
      mutuelleNom: s.mutuelleNom,
      mutuelleTaux: s.mutuelleTaux,
      mutuellePlafond: parseFloat(s.mutuellePlafond) || 0,
      ordonnance: s.ordonnance,
      lignes: s.lignes,
      totalTTC, totalSS: computedSS, totalMutuelle: computedMut, resteACharge: racFinal,
      date: dateToday,
      dateValidite: makeValidite(dateToday),
      status: s.signatureClient ? "Signé" : "Brouillon",
      signatureClient: s.signatureClient,
      dateSignature: s.signatureClient ? dateToday : undefined,
      factureId: "", dateFacture: "",
      modePaiement: s.modePaiementDevis,
      acompte: acompteVal,
      notes: s.notes,
    };
    onSave(raw);
  }

  const STEPS = ["Patient", "Ordonnance", "Équipement", "Récapitulatif"];

  return (
    <DraggableWindow
      title="Nouveau devis"
      badge={`Étape ${s.step} sur 4`}
      onClose={onClose}
      defaultWidth={760}
      defaultHeight={680}
    >
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--glass-card-bg)" }}>

        {/* Stepper */}
        <div style={{ padding: "12px 28px 0", display: "flex", gap: 8, flexShrink: 0 }}>
          {STEPS.map((label, i) => {
            const active = s.step === i + 1;
            const done = s.step > i + 1;
            return (
              <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
                <div style={{ height: 3, borderRadius: 2, background: done ? "#2D8CFF" : active ? "#2D8CFF" : "rgba(148,163,184,0.3)", width: "100%", opacity: active ? 1 : done ? 0.7 : 0.4 }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: active ? "#2D8CFF" : done ? "#2D8CFF" : "#94a3b8", letterSpacing: 0.2 }}>{label}</span>
              </div>
            );
          })}
        </div>

        {/* Body scroll */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>

          {/* ── ÉTAPE 1 — PATIENT ── */}
          {s.step === 1 && (
            <div>
              <FormSection title="Mode de saisie" color="#2D8CFF">
                <div style={{ display: "flex", gap: 8 }}>
                  {(["nouveau", "existant"] as const).map(mode => (
                    <button key={mode} onClick={() => upd({ clientMode: mode })}
                      style={{ flex: 1, padding: "9px 0", borderRadius: 12, border: s.clientMode === mode ? "1.5px solid #2D8CFF" : "1px solid rgba(148,163,184,0.35)", background: s.clientMode === mode ? "rgba(45,140,255,0.09)" : "rgba(255,255,255,0.6)", color: s.clientMode === mode ? "#1D6FCC" : "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                      {mode === "nouveau" ? "Nouveau patient" : "Dossier existant"}
                    </button>
                  ))}
                </div>
              </FormSection>

              {s.clientMode === "nouveau" && (
                <>
                  <FormSection title="Source des données" color="#8B5CF6">
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      {(["manuel", "vitale"] as const).map(tab => (
                        <button key={tab} onClick={() => upd({ vitaleTab: tab })}
                          style={{ padding: "7px 18px", borderRadius: 999, border: s.vitaleTab === tab ? "1.5px solid #8B5CF6" : "1px solid rgba(148,163,184,0.3)", background: s.vitaleTab === tab ? "rgba(139,92,246,0.1)" : "transparent", color: s.vitaleTab === tab ? "#6D28D9" : "#64748b", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                          {tab === "manuel" ? "Saisie manuelle" : "Carte Vitale"}
                        </button>
                      ))}
                    </div>
                    {s.vitaleTab === "vitale" && <CarteVitaleReader onRead={(info) => updClient({ nom: info.nom, prenom: info.prenom, dateNaissance: info.dateNaissance, numeroSS: info.numeroSS, telephone: info.telephone, email: info.email })} />}
                  </FormSection>
                  <FormSection title="Informations patient" color="#00C98A">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <FormRow label="Nom"><input style={inputStyle} value={s.client.nom} onChange={e => updClient({ nom: e.target.value })} placeholder="LEBLANC" /></FormRow>
                      <FormRow label="Prénom"><input style={inputStyle} value={s.client.prenom} onChange={e => updClient({ prenom: e.target.value })} placeholder="Marie" /></FormRow>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <FormRow label="Date de naissance"><input style={inputStyle} type="date" value={s.client.dateNaissance} onChange={e => updClient({ dateNaissance: e.target.value })} /></FormRow>
                      <FormRow label="N° Sécurité sociale"><input style={inputStyle} value={s.client.numeroSS} onChange={e => updClient({ numeroSS: e.target.value })} placeholder="1 85 06 75…" /></FormRow>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <FormRow label="Téléphone"><input style={inputStyle} value={s.client.telephone} onChange={e => updClient({ telephone: e.target.value })} placeholder="06 11 22 33 44" /></FormRow>
                      <FormRow label="Email"><input style={inputStyle} value={s.client.email} onChange={e => updClient({ email: e.target.value })} placeholder="patient@email.fr" /></FormRow>
                    </div>
                  </FormSection>
                </>
              )}

              <FormSection title="Type de devis" color="#F59E0B">
                <div style={{ display: "flex", gap: 8 }}>
                  {([["lunettes", "Lunettes"], ["lentilles", "Lentilles"], ["solaire", "Solaires"]] as [DevisType, string][]).map(([val, lbl]) => (
                    <button key={val} onClick={() => upd({ type: val })}
                      style={{ flex: 1, padding: "9px 0", borderRadius: 12, border: s.type === val ? "1.5px solid #F59E0B" : "1px solid rgba(148,163,184,0.35)", background: s.type === val ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.5)", color: s.type === val ? "#B45309" : "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </FormSection>

              <FormSection title="Mutuelle" color="#EC4899">
                <FormRow label="Nom de la mutuelle"><input style={inputStyle} value={s.mutuelleNom} onChange={e => upd({ mutuelleNom: e.target.value })} placeholder="MGEN, AXA Santé…" /></FormRow>
                <FormRow label={`Taux de remboursement : ${s.mutuelleTaux}%`}>
                  <input type="range" min={0} max={100} value={s.mutuelleTaux} onChange={e => upd({ mutuelleTaux: parseInt(e.target.value, 10) })} style={{ width: "100%", accentColor: "#EC4899" }} />
                </FormRow>
                <FormRow label="Plafond de remboursement (€, 0 = illimité)">
                  <input style={inputStyle} type="number" min={0} value={s.mutuellePlafond} onChange={e => upd({ mutuellePlafond: e.target.value })} placeholder="0" />
                </FormRow>
              </FormSection>
            </div>
          )}

          {/* ── ÉTAPE 2 — ORDONNANCE ── */}
          {s.step === 2 && (
            <div>
              <OrdonnancePicker
                selected={selectedOrdLS}
                onApply={applyOrdLS}
                onClear={clearOrdLS}
              />
              <FormSection title="Prescripteur" color="#2D8CFF">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <FormRow label="Nom du prescripteur"><input style={inputStyle} value={s.ordonnance.prescripteurNom} onChange={e => updOrd({ prescripteurNom: e.target.value })} placeholder="Dr. Aurélie Voss" /></FormRow>
                  <FormRow label="N° RPPS (optionnel)"><input style={inputStyle} value={s.ordonnance.prescripteurRPPS} onChange={e => updOrd({ prescripteurRPPS: e.target.value })} placeholder="10002345678" /></FormRow>
                </div>
                <FormRow label="Date d'ordonnance"><input style={{ ...inputStyle, maxWidth: 220 }} type="date" value={s.ordonnance.dateOrdonnance} onChange={e => updOrd({ dateOrdonnance: e.target.value })} /></FormRow>
              </FormSection>

              <FormSection title="Correction binoculaire" color="#8B5CF6">
                <div style={{ ...glassSubtle, borderRadius: 14, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "rgba(139,92,246,0.07)" }}>
                        <th style={{ width: 40, padding: "8px 10px", fontSize: 11, fontWeight: 700, color: "#6D28D9", textAlign: "left" }}></th>
                        {["Sphère", "Cylindre", "Axe", "Addition"].map(h => (
                          <th key={h} style={{ padding: "8px 8px", fontSize: 11, fontWeight: 700, color: "#6D28D9", textAlign: "center" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(["OD", "OG"] as const).map((eye, idx) => {
                        const isOD = eye === "OD";
                        const cellInput: CSSProperties = { width: "100%", padding: "7px 6px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#ffffff", fontSize: 13, textAlign: "center", outline: "none", color: "#1e293b", boxSizing: "border-box" };
                        const sph  = isOD ? s.ordonnance.odSph  : s.ordonnance.ogSph;
                        const cyl  = isOD ? s.ordonnance.odCyl  : s.ordonnance.ogCyl;
                        const axe  = isOD ? s.ordonnance.odAxe  : s.ordonnance.ogAxe;
                        const add  = isOD ? s.ordonnance.odAdd  : s.ordonnance.ogAdd;
                        return (
                          <tr key={eye} style={{ borderTop: idx > 0 ? "1px solid rgba(148,163,184,0.15)" : undefined }}>
                            <td style={{ padding: "8px 10px", fontWeight: 700, fontSize: 13, color: isOD ? "#2D8CFF" : "#8B5CF6" }}>{eye}</td>
                            <td style={{ padding: "6px 5px" }}><input style={cellInput} value={sph}  onChange={e => updOrd(isOD ? { odSph: e.target.value } : { ogSph: e.target.value })} placeholder="+0.00" /></td>
                            <td style={{ padding: "6px 5px" }}><input style={cellInput} value={cyl}  onChange={e => updOrd(isOD ? { odCyl: e.target.value } : { ogCyl: e.target.value })} placeholder="-0.00" /></td>
                            <td style={{ padding: "6px 5px" }}><input style={cellInput} value={axe}  onChange={e => updOrd(isOD ? { odAxe: e.target.value } : { ogAxe: e.target.value })} placeholder="0°" /></td>
                            <td style={{ padding: "6px 5px" }}><input style={cellInput} value={add}  onChange={e => updOrd(isOD ? { odAdd: e.target.value } : { ogAdd: e.target.value })} placeholder="+0.00" /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </FormSection>
            </div>
          )}

          {/* ── ÉTAPE 3 — ÉQUIPEMENT ── */}
          {s.step === 3 && (
            <div>
              <FormSection title="Ajouter une ligne" color="#F59E0B">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <FormRow label="Type">
                    <select style={selectStyle} value={s.ligneType} onChange={e => upd({ ligneType: e.target.value as LigneType })}>
                      <option value="monture">Monture</option>
                      <option value="verre-od">Verre OD</option>
                      <option value="verre-og">Verre OG</option>
                      <option value="lentille">Lentille</option>
                      <option value="accessoire">Accessoire</option>
                    </select>
                  </FormRow>
                  <FormRow label="Marque"><input style={inputStyle} value={s.ligneMarque} onChange={e => upd({ ligneMarque: e.target.value })} placeholder="Essilor, Ray-Ban…" /></FormRow>
                </div>
                <FormRow label="Référence"><input style={inputStyle} value={s.ligneReference} onChange={e => upd({ ligneReference: e.target.value })} placeholder="REF-001" /></FormRow>
                <FormRow label="Désignation libre">
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <DesignationAutocomplete
                        value={s.ligneDesignation}
                        onChange={val => upd({ ligneDesignation: val, ligneDescription: "" })}
                        onSelectVerre={handleSelectVerre}
                      />
                      {s.ligneDescription && (
                        <div style={{ marginTop: 6, padding: "6px 10px", borderRadius: 8, background: "rgba(45,140,255,0.06)", border: "1px solid rgba(45,140,255,0.18)", display: "flex", gap: 6, alignItems: "flex-start" }}>
                          <span style={{ fontSize: 11, color: "#2D8CFF", flexShrink: 0, marginTop: 1 }}>ℹ</span>
                          <span style={{ fontSize: 11, color: "#475569", fontStyle: "italic", lineHeight: 1.5 }}>{s.ligneDescription}</span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCatalogueOpen(true)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "9px 13px", borderRadius: 12, border: "1px solid rgba(45,140,255,0.35)", background: "rgba(45,140,255,0.07)", color: "#1D6FCC", fontWeight: 600, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                    >
                      &#128230; Catalogue
                    </button>
                  </div>
                </FormRow>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <FormRow label="Prix vente TTC (€)"><input style={inputStyle} type="number" min={0} step={0.01} value={s.lignePrixTTC} onChange={e => upd({ lignePrixTTC: e.target.value })} placeholder="0.00" /></FormRow>
                  <FormRow label="TVA">
                    <select style={selectStyle} value={s.ligneTVA} onChange={e => upd({ ligneTVA: e.target.value as "5.5" | "20" })}>
                      <option value="5.5">5,5% (équipement médical)</option>
                      <option value="20">20% (accessoire)</option>
                    </select>
                  </FormRow>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <FormRow label="Code LPPR (optionnel)"><input style={inputStyle} value={s.ligneLPPR} onChange={e => upd({ ligneLPPR: e.target.value })} placeholder="2203799" /></FormRow>
                  <FormRow label="Classe optique">
                    <select style={selectStyle} value={s.ligneClasse} onChange={e => upd({ ligneClasse: e.target.value as "1" | "2" | "" })}>
                      <option value="">—</option>
                      <option value="1">Classe I</option>
                      <option value="2">Classe II</option>
                    </select>
                  </FormRow>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <FormRow label="PC Sécu (€)"><input style={inputStyle} type="number" min={0} step={0.01} value={s.ligneSS} onChange={e => upd({ ligneSS: e.target.value })} placeholder="0.00" /></FormRow>
                  <FormRow label="PC Mutuelle (€)">
                    <input style={inputStyle} type="number" min={0} step={0.01} value={s.ligneMutuelle} onChange={e => upd({ ligneMutuelle: e.target.value })} placeholder="0.00" />
                  </FormRow>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                  <button onClick={addLigne} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 12, background: "linear-gradient(135deg,#F59E0B,#D97706)", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                    <IconPlus /> Ajouter la ligne
                  </button>
                  <button onClick={() => setStockModalOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 12, background: "rgba(99,102,241,0.1)", color: "#6366f1", fontWeight: 700, fontSize: 13, border: "1px solid rgba(99,102,241,0.35)", cursor: "pointer" }}>
                    <IconBox /> Depuis le stock
                  </button>
                </div>
              </FormSection>

              {s.lignes.length > 0 && (
                <FormSection title="Lignes du devis" color="#2D8CFF">
                  <div style={{ ...glassSubtle, borderRadius: 12, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "rgba(45,140,255,0.06)" }}>
                          {["Désignation", "TTC", "SS", "Mut.", "RAC", ""].map(h => (
                            <th key={h} style={{ padding: "7px 10px", fontSize: 11, fontWeight: 700, color: "#475569", textAlign: h === "Désignation" ? "left" : "right" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {s.lignes.map((l, i) => (
                          <tr key={l.id} style={{ borderTop: i > 0 ? "1px solid rgba(148,163,184,0.12)" : undefined }}>
                            <td style={{ padding: "7px 10px", fontSize: 12, color: "#1e293b", maxWidth: 180 }}>
                              <div style={{ fontWeight: 600 }}>{l.marque} {l.reference}</div>
                              <div style={{ fontSize: 11, color: "#64748b" }}>{l.designation.slice(0, 50)}{l.designation.length > 50 ? "…" : ""}</div>
                            </td>
                            <td style={{ padding: "7px 10px", fontSize: 12, textAlign: "right", color: "#1e293b", fontWeight: 600 }}>{formatEur(l.prixVenteTTC)}</td>
                            <td style={{ padding: "7px 10px", fontSize: 12, textAlign: "right", color: "#1976D2" }}>−{formatEur(l.priseEnChargeSS)}</td>
                            <td style={{ padding: "7px 10px", fontSize: 12, textAlign: "right", color: "#059669" }}>−{formatEur(l.priseEnChargeMutuelle)}</td>
                            <td style={{ padding: "7px 10px", fontSize: 12, textAlign: "right", fontWeight: 700, color: "#1e293b" }}>{formatEur(l.resteACharge)}</td>
                            <td style={{ padding: "7px 8px", textAlign: "center" }}>
                              <button onClick={() => removeLigne(l.id)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", padding: 3, display: "inline-flex" }}><IconTrash /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </FormSection>
              )}

              {/* Récapitulatif temps réel */}
              <div style={{ background: "linear-gradient(135deg,rgba(45,140,255,0.12),rgba(139,92,246,0.1))", borderRadius: 14, padding: "14px 18px", border: "1px solid rgba(45,140,255,0.2)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                  {([
                    { lbl: "Total TTC", val: formatEur(totalTTC), color: "#1e293b" },
                    { lbl: "Sécu", val: `−${formatEur(totalSS)}`, color: "#1976D2" },
                    { lbl: "Mutuelle", val: `−${formatEur(totalMutuelle)}`, color: "#059669" },
                    { lbl: "Reste à charge", val: formatEur(resteACharge), color: "#2D8CFF" },
                  ] as { lbl: string; val: string; color: string }[]).map(({ lbl, val, color }) => (
                    <div key={lbl} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 2 }}>{lbl}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 4 — RÉCAPITULATIF & SIGNATURE ── */}
          {s.step === 4 && (
            <div>
              <FormSection title="Récapitulatif patient" color="#2D8CFF">
                <div style={{ ...glassSubtle, borderRadius: 12, padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {([
                    { lbl: "Nom", val: `${s.client.prenom} ${s.client.nom}` },
                    { lbl: "Date naissance", val: s.client.dateNaissance || "—" },
                    { lbl: "N° SS", val: s.client.numeroSS || "—" },
                    { lbl: "Téléphone", val: s.client.telephone || "—" },
                    { lbl: "Email", val: s.client.email || "—" },
                    { lbl: "Mutuelle", val: s.mutuelleNom ? `${s.mutuelleNom} (${s.mutuelleTaux}%)` : "—" },
                  ] as { lbl: string; val: string }[]).map(({ lbl, val }) => (
                    <div key={lbl}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>{lbl}</span>
                      <div style={{ fontSize: 13, color: "#1e293b", fontWeight: 500 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </FormSection>

              <FormSection title="Ordonnance" color="#8B5CF6">
                <div style={{ ...glassSubtle, borderRadius: 12, padding: "12px 16px" }}>
                  <div style={{ fontSize: 13, color: "#1e293b", marginBottom: 6 }}><strong>{s.ordonnance.prescripteurNom || "—"}</strong>{s.ordonnance.prescripteurRPPS ? ` — RPPS ${s.ordonnance.prescripteurRPPS}` : ""}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>Ordonnance du {formatDate(s.ordonnance.dateOrdonnance) || "—"}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <div style={{ fontSize: 12 }}><strong>OD</strong> : Sph {s.ordonnance.odSph || "—"} Cyl {s.ordonnance.odCyl || "—"} Axe {s.ordonnance.odAxe || "—"} Add {s.ordonnance.odAdd || "—"}</div>
                    <div style={{ fontSize: 12 }}><strong>OG</strong> : Sph {s.ordonnance.ogSph || "—"} Cyl {s.ordonnance.ogCyl || "—"} Axe {s.ordonnance.ogAxe || "—"} Add {s.ordonnance.ogAdd || "—"}</div>
                  </div>
                </div>
              </FormSection>

              <FormSection title="Lignes du devis" color="#F59E0B">
                {s.lignes.length === 0 ? <div style={{ fontSize: 13, color: "#94a3b8" }}>Aucune ligne ajoutée.</div> : (
                  <div style={{ ...glassSubtle, borderRadius: 12, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        {s.lignes.map((l, i) => (
                          <tr key={l.id} style={{ borderTop: i > 0 ? "1px solid rgba(148,163,184,0.12)" : undefined }}>
                            <td style={{ padding: "8px 12px", fontSize: 12, color: "#1e293b" }}>{l.designation}</td>
                            <td style={{ padding: "8px 12px", fontSize: 12, textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>{formatEur(l.prixVenteTTC)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </FormSection>

              {/* Bloc financier */}
              <div style={{ background: "linear-gradient(135deg,rgba(45,140,255,0.12),rgba(139,92,246,0.1))", borderRadius: 14, padding: "16px 18px", border: "1px solid rgba(45,140,255,0.2)", marginBottom: 16 }}>
                {([
                  { lbl: "Total TTC", val: formatEur(totalTTC), color: "#1e293b", bold: false },
                  { lbl: "Prise en charge Sécu", val: `−${formatEur(totalSS)}`, color: "#1976D2", bold: false },
                  { lbl: `Mutuelle ${s.mutuelleNom}`, val: `−${formatEur(totalMutuelle)}`, color: "#059669", bold: false },
                  { lbl: "Reste à charge patient", val: formatEur(resteACharge), color: "#2D8CFF", bold: true },
                ] as { lbl: string; val: string; color: string; bold: boolean }[]).map(({ lbl, val, color, bold }) => (
                  <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBlock: 4, borderBottom: bold ? undefined : "1px solid rgba(148,163,184,0.1)" }}>
                    <span style={{ fontSize: bold ? 14 : 13, fontWeight: bold ? 700 : 500, color: "#475569" }}>{lbl}</span>
                    <span style={{ fontSize: bold ? 16 : 13, fontWeight: bold ? 800 : 600, color }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Prise en charge améliorée */}
              <FormSection title="Prise en charge" color="#1976D2">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <FormRow label={`PEC Sécurité Sociale (auto: ${formatEur(totalSS)})`}>
                    <input style={inputStyle} type="number" min={0} step={0.01}
                      value={s.pecSS}
                      onChange={e => upd({ pecSS: e.target.value })}
                      placeholder={totalSS.toFixed(2)} />
                  </FormRow>
                  <FormRow label={`PEC Mutuelle (auto: ${formatEur(totalMutuelle)})`}>
                    <input style={inputStyle} type="number" min={0} step={0.01}
                      value={s.pecMutuelle}
                      onChange={e => upd({ pecMutuelle: e.target.value })}
                      placeholder={totalMutuelle.toFixed(2)} />
                  </FormRow>
                </div>
                <div style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(45,140,255,0.07)", border: "1px solid rgba(45,140,255,0.2)", fontSize: 13, color: "#1e293b", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 600, color: "#475569" }}>Participation patient</span>
                  <span style={{ fontWeight: 800, color: "#2D8CFF" }}>
                    {formatEur(Math.max(0, totalTTC - (s.pecSS !== "" ? parseFloat(s.pecSS) || 0 : totalSS) - (s.pecMutuelle !== "" ? parseFloat(s.pecMutuelle) || 0 : totalMutuelle)))}
                  </span>
                </div>
              </FormSection>

              {/* Règlement */}
              <FormSection title="Règlement" color="#00C98A">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <FormRow label="Acompte versé (€)">
                    <input style={inputStyle} type="number" min={0} step={0.01}
                      value={s.acompte}
                      onChange={e => upd({ acompte: e.target.value })}
                      placeholder="0.00" />
                  </FormRow>
                  <FormRow label="Mode de paiement prévu">
                    <select style={selectStyle} value={s.modePaiementDevis} onChange={e => upd({ modePaiementDevis: e.target.value as ModePaiement | "" })}>
                      <option value="">— Non précisé —</option>
                      {(["CB","Chèque","Espèces","Virement","Tiers payant"] as ModePaiement[]).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </FormRow>
                </div>
                {(parseFloat(s.acompte) || 0) > 0 && (
                  <div style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(0,201,138,0.07)", border: "1px solid rgba(0,201,138,0.25)", fontSize: 13, color: "#047857", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 600 }}>Reste à régler</span>
                    <span style={{ fontWeight: 800 }}>
                      {formatEur(Math.max(0, totalTTC - (parseFloat(s.acompte) || 0)))}
                    </span>
                  </div>
                )}
              </FormSection>

              <FormRow label="Note libre">
                <textarea style={{ ...inputStyle, height: 70, resize: "vertical" }} value={s.notes} onChange={e => upd({ notes: e.target.value })} placeholder="Informations complémentaires…" />
              </FormRow>

              <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, cursor: "pointer", padding: "12px 14px", borderRadius: 12, background: s.signatureClient ? "rgba(0,201,138,0.09)" : "rgba(148,163,184,0.08)", border: s.signatureClient ? "1.5px solid #00C98A" : "1px solid rgba(148,163,184,0.3)", transition: "all 0.2s" }}>
                <input type="checkbox" checked={s.signatureClient} onChange={e => upd({ signatureClient: e.target.checked })} style={{ width: 18, height: 18, accentColor: "#00C98A", cursor: "pointer" }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: s.signatureClient ? "#047857" : "#475569" }}>Le patient a lu et approuvé le devis</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Cocher pour enregistrer avec statut "Signé" — sinon statut "Brouillon"</div>
                </div>
              </label>
            </div>
          )}

        </div>

        {/* Footer navigation */}
        <div style={{ padding: "14px 28px 20px", borderTop: "1px solid rgba(148,163,184,0.15)", display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <button onClick={() => s.step > 1 ? upd({ step: (s.step - 1) as 1 | 2 | 3 | 4 }) : onClose()}
            style={{ padding: "9px 20px", borderRadius: 12, border: "1px solid rgba(148,163,184,0.3)", background: "transparent", color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            {s.step === 1 ? "Annuler" : "← Précédent"}
          </button>
          {s.step < 4 ? (
            <button onClick={() => upd({ step: (s.step + 1) as 1 | 2 | 3 | 4 })}
              style={{ padding: "9px 24px", borderRadius: 12, border: "none", background: "#2D8CFF", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Suivant →
            </button>
          ) : (
            <button onClick={save}
              style={{ padding: "9px 24px", borderRadius: 12, border: "none", background: s.signatureClient ? "#00C98A" : "linear-gradient(135deg,#64748b,#475569)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {s.signatureClient ? "Enregistrer (Signé)" : "Enregistrer (Brouillon)"}
            </button>
          )}
        </div>
      </div>
      {catalogueOpen && (
        <CatalogueModal
          onClose={() => setCatalogueOpen(false)}
          onSelect={v => { handleSelectVerre(v); setCatalogueOpen(false); }}
          selectedVerriers={selectedVerriers}
        />
      )}
      {stockModalOpen && (
        <StockModal
          onClose={() => setStockModalOpen(false)}
          onSelect={item => { addLigneFromStock(item); setStockModalOpen(false); }}
        />
      )}
    </DraggableWindow>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MODALE VOIR DEVIS — FORMAT A4 NORMALISÉ LOI HAMON
═══════════════════════════════════════════════════════════════════════ */
function ModalVoirDevis({ devis, onClose }: { devis: Devis; onClose: () => void }) {
  const tdStyle: CSSProperties = { padding: "7px 10px", fontSize: 11, borderBottom: "1px solid rgba(148,163,184,0.2)", color: "#1e293b" };
  const thStyle: CSSProperties = { padding: "8px 10px", fontSize: 10, fontWeight: 700, color: "#475569", textAlign: "left", background: "rgba(148,163,184,0.08)", textTransform: "uppercase", letterSpacing: 0.5 };

  const printAction = (
    <button
      onClick={() => printDevisVision(devis as unknown as DevisPdf, loadStoreConfig())}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#1976D2,#1565C0)", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}
    >
      <IconPrint /> PDF normalisé
    </button>
  );

  return (
    <DraggableWindow
      title="Devis"
      badge={devis.id}
      onClose={onClose}
      defaultWidth={820}
      defaultHeight={640}
      actions={printAction}
    >
      <div id="devis-print-zone" style={{ background: "#fff", padding: "32px 36px", fontFamily: "system-ui, -apple-system, sans-serif" }}>

        {/* En-tête document */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingBottom: 20, borderBottom: "2px solid #1976D2" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1565C0", letterSpacing: -0.5 }}>CLAIR VISION</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 4, lineHeight: 1.7 }}>
              12 rue de la Paix — 75001 Paris<br/>
              SIRET : 123 456 789 00012<br/>
              N° ADELI : 75-0123456<br/>
              Tél : 01 42 00 00 00
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>DEVIS N° {devis.id}</div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 6, lineHeight: 1.8 }}>
              Date : {formatDateLong(devis.date)}<br/>
              Valable 30 jours<br/>
              jusqu'au {formatDateLong(devis.dateValidite)}
            </div>
            <div style={{ marginTop: 8 }}><StatusBadge status={devis.status} /></div>
          </div>
        </div>

        {/* Bloc patient + ordonnance côte à côte */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div style={{ border: "1px solid rgba(148,163,184,0.3)", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#1976D2", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Patient</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{devis.patientPrenom} {devis.patientNom.toUpperCase()}</div>
            <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.8, marginTop: 4 }}>
              Né(e) le {formatDate(devis.patientDN)}<br/>
              N° SS : {devis.patientSS || "—"}<br/>
              Tél : {devis.patientTel || "—"}<br/>
              {devis.patientEmail && <>Email : {devis.patientEmail}<br/></>}
              Mutuelle : {devis.mutuelleNom || "—"} ({devis.mutuelleTaux}%)
            </div>
          </div>
          <div style={{ border: "1px solid rgba(148,163,184,0.3)", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#8B5CF6", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Ordonnance</div>
            <div style={{ fontSize: 12, color: "#1e293b", fontWeight: 600 }}>{devis.ordonnance.prescripteurNom || "—"}</div>
            {devis.ordonnance.prescripteurRPPS && <div style={{ fontSize: 11, color: "#64748b" }}>RPPS : {devis.ordonnance.prescripteurRPPS}</div>}
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>Du {formatDate(devis.ordonnance.dateOrdonnance)}</div>
            <table style={{ borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, fontSize: 10 }}></th>
                  {["Sph", "Cyl", "Axe", "Add"].map(h => <th key={h} style={{ ...thStyle, fontSize: 10, textAlign: "center" }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {([
                  { eye: "OD", vals: [devis.ordonnance.odSph, devis.ordonnance.odCyl, devis.ordonnance.odAxe, devis.ordonnance.odAdd] },
                  { eye: "OG", vals: [devis.ordonnance.ogSph, devis.ordonnance.ogCyl, devis.ordonnance.ogAxe, devis.ordonnance.ogAdd] },
                ]).map(({ eye, vals }) => (
                  <tr key={eye}>
                    <td style={{ ...tdStyle, fontWeight: 700, color: eye === "OD" ? "#2D8CFF" : "#8B5CF6" }}>{eye}</td>
                    {vals.map((v, i) => <td key={i} style={{ ...tdStyle, textAlign: "center" }}>{v || "—"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tableau lignes normalisé */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1976D2", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Détail de l&apos;équipement</div>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid rgba(148,163,184,0.3)", borderRadius: 8, overflow: "hidden" }}>
            <thead>
              <tr>
                {["Désignation", "LPPR", "Cl.", "Prix public", "Prix vente TTC", "PC Sécu", "PC Mutuelle", "Reste"].map(h => (
                  <th key={h} style={{ ...thStyle, textAlign: h === "Désignation" ? "left" : "right" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {devis.lignes.map((l, i) => (
                <tr key={l.id} style={{ background: i % 2 === 0 ? "transparent" : "rgba(148,163,184,0.04)" }}>
                  <td style={{ ...tdStyle, maxWidth: 240 }}>
                    <div style={{ fontWeight: 600 }}>{l.marque} {l.reference}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>{l.designation}</div>
                    {l.description && (
                      <div style={{ fontSize: 9.5, color: "#94a3b8", fontStyle: "italic", marginTop: 2, lineHeight: 1.4 }}>{l.description}</div>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right", fontFamily: "monospace", fontSize: 10 }}>{l.lppr || "—"}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{l.classe ? `C${l.classe}` : "—"}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{formatEur(l.prixPublicHT)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>{formatEur(l.prixVenteTTC)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", color: "#1976D2" }}>{l.priseEnChargeSS > 0 ? `−${formatEur(l.priseEnChargeSS)}` : "—"}</td>
                  <td style={{ ...tdStyle, textAlign: "right", color: "#059669" }}>{l.priseEnChargeMutuelle > 0 ? `−${formatEur(l.priseEnChargeMutuelle)}` : "—"}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>{formatEur(l.resteACharge)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bloc financier récapitulatif */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
          <div style={{ minWidth: 300, border: "1px solid rgba(148,163,184,0.3)", borderRadius: 8, overflow: "hidden" }}>
            {([
              { lbl: "Total TTC", val: formatEur(devis.totalTTC), color: "#1e293b" },
              { lbl: "Prise en charge Sécurité sociale", val: `−${formatEur(devis.totalSS)}`, color: "#1976D2" },
              { lbl: `Mutuelle ${devis.mutuelleNom}`, val: `−${formatEur(devis.totalMutuelle)}`, color: "#059669" },
            ] as { lbl: string; val: string; color: string }[]).map(({ lbl, val, color }) => (
              <div key={lbl} style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                <span style={{ fontSize: 12, color: "#475569" }}>{lbl}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color }}>{val}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", background: "rgba(45,140,255,0.07)", borderTop: "2px solid #2D8CFF" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Reste à charge patient</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#2D8CFF" }}>{formatEur(devis.resteACharge)}</span>
            </div>
          </div>
        </div>

        {/* Pied de page légal */}
        <div style={{ borderTop: "1px solid rgba(148,163,184,0.3)", paddingTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <div style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1.6 }}>
              Devis établi conformément à l&apos;arrêté du 29 octobre 2014 relatif aux devis normalisés en optique-lunetterie.<br/>
              Ce devis est valable 30 jours à compter de sa date d&apos;émission. Toute commande passée avant l&apos;expiration de ce délai engage le patient.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Signature du patient</div>
            <div style={{ height: 50, border: "1px dashed rgba(148,163,184,0.5)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {devis.signatureClient ? (
                <span style={{ fontSize: 11, color: "#047857", fontWeight: 600 }}>✓ Approuvé par le patient</span>
              ) : (
                <span style={{ fontSize: 10, color: "#94a3b8" }}>Bon pour accord — Date et signature</span>
              )}
            </div>
          </div>
        </div>

      </div>
    </DraggableWindow>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MODALE MODIFIER STATUT
═══════════════════════════════════════════════════════════════════════ */
function ModalModifierStatut({ devis, onClose, onSave, allDevis }: { devis: Devis; onClose: () => void; onSave: (updated: Devis) => void; allDevis: Devis[] }) {
  const [status, setStatus] = useState<DevisStatus>(devis.status);
  const [modePaiement, setModePaiement] = useState<ModePaiement | "">(devis.modePaiement);
  const [dateFacture, setDateFacture] = useState(devis.dateFacture || today());
  const [notes, setNotes] = useState(devis.notes);
  const [nbEcheances, setNbEcheances] = useState<number>(devis.nbEcheances ?? 3);
  const [raisonGeste, setRaisonGeste] = useState(devis.raisonGeste ?? "");

  const isGeste = modePaiement === "Geste commercial";
  const isPlusieurs = modePaiement === "Plusieurs fois";
  const montantEcheance = isPlusieurs && nbEcheances > 0
    ? Math.ceil(devis.resteACharge / nbEcheances * 100) / 100
    : 0;

  function handleSave() {
    const isFacture = status === "Facturé";
    const factureId = isFacture && !devis.factureId ? genFactureId(allDevis) : devis.factureId;
    const racRegle = isFacture && !!modePaiement;
    onSave({
      ...devis, status, notes, factureId,
      modePaiement: isFacture ? modePaiement : devis.modePaiement,
      dateFacture: isFacture ? dateFacture : devis.dateFacture,
      nbEcheances: isPlusieurs ? nbEcheances : undefined,
      raisonGeste: isGeste ? raisonGeste : undefined,
      racRegle: isFacture ? racRegle : devis.racRegle,
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ ...glass, borderRadius: 20, width: "100%", maxWidth: 440, padding: "28px 28px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Modifier le statut</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", borderRadius: 8 }}><IconClose /></button>
        </div>

        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>Devis <strong>{devis.id}</strong> — {devis.patientPrenom} {devis.patientNom}</div>

        <FormRow label="Nouveau statut">
          <select style={selectStyle} value={status} onChange={e => setStatus(e.target.value as DevisStatus)}>
            {(["Brouillon", "Signé", "Commandé", "Prêt", "Livré", "Facturé"] as DevisStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </FormRow>

        {status === "Facturé" && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <FormRow label="Mode de règlement du RAC">
              <select style={selectStyle} value={modePaiement} onChange={e => setModePaiement(e.target.value as ModePaiement)}>
                <option value="">— Choisir —</option>
                <optgroup label="Paiement immédiat">
                  {(["CB", "Espèces", "Chèque", "Virement", "Tiers payant"] as ModePaiement[]).map(m => <option key={m} value={m}>{m}</option>)}
                </optgroup>
                <optgroup label="Modalités spéciales">
                  <option value="Plusieurs fois">Paiement en plusieurs fois</option>
                  <option value="Geste commercial">Geste commercial (RAC offert)</option>
                </optgroup>
              </select>
            </FormRow>

            {isPlusieurs && (
              <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(45,140,255,0.06)", border: "1px solid rgba(45,140,255,0.20)" }}>
                <FormRow label="Nombre d'échéances">
                  <select style={selectStyle} value={nbEcheances} onChange={e => setNbEcheances(Number(e.target.value))}>
                    {[2, 3, 4, 6, 10, 12].map(n => <option key={n} value={n}>{n} fois</option>)}
                  </select>
                </FormRow>
                <div style={{ marginTop: 8, fontSize: 12, color: "#1d4ed8", fontWeight: 600 }}>
                  → {nbEcheances} × {formatEur(montantEcheance)} = {formatEur(devis.resteACharge)} RAC total
                </div>
              </div>
            )}

            {isGeste && (
              <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#b45309", marginBottom: 8 }}>
                  Geste commercial — RAC de {formatEur(devis.resteACharge)} offert au patient
                </div>
                <FormRow label="Motif (facultatif)">
                  <input style={inputStyle} value={raisonGeste} onChange={e => setRaisonGeste(e.target.value)} placeholder="Ex : fidélisation, situation difficile…" />
                </FormRow>
              </div>
            )}

            <FormRow label="Date de facturation">
              <input style={inputStyle} type="date" value={dateFacture} onChange={e => setDateFacture(e.target.value)} />
            </FormRow>
            <div style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(16,185,129,0.09)", border: "1px solid rgba(16,185,129,0.3)", fontSize: 12, color: "#065F46" }}>
              Numéro de facture : <strong>{devis.factureId || genFactureId(allDevis)}</strong>
            </div>
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <FormRow label="Notes">
            <textarea style={{ ...inputStyle, height: 70, resize: "vertical" }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Informations complémentaires…" />
          </FormRow>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 12, border: "1px solid rgba(148,163,184,0.3)", background: "transparent", color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Annuler</button>
          <button onClick={handleSave} style={{ padding: "9px 22px", borderRadius: 12, border: "none", background: "#2D8CFF", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   KPI BAR
═══════════════════════════════════════════════════════════════════════ */
function KpiBar({ devis }: { devis: Devis[] }) {
  const kpis = [
    { label: "Brouillon", count: devis.filter(d => d.status === "Brouillon").length, dot: "#94a3b8", bg: "rgba(148,163,184,0.08)" },
    { label: "Signé",     count: devis.filter(d => d.status === "Signé").length,     dot: "#2D8CFF", bg: "rgba(45,140,255,0.07)" },
    { label: "Commandé",  count: devis.filter(d => d.status === "Commandé").length,  dot: "#8B5CF6", bg: "rgba(139,92,246,0.07)" },
    { label: "Prêt",      count: devis.filter(d => d.status === "Prêt").length,      dot: "#F59E0B", bg: "rgba(245,158,11,0.07)" },
    { label: "Livré / Facturé", count: devis.filter(d => d.status === "Livré" || d.status === "Facturé").length, dot: "#00C98A", bg: "rgba(0,201,138,0.07)" },
  ];
  const caTotal = devis.reduce((s, d) => s + d.totalTTC, 0);

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
      {kpis.map(k => (
        <div key={k.label} style={{ ...glass, borderRadius: 14, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, background: k.bg, flex: "1 1 120px", minWidth: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: k.dot, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", lineHeight: 1.1 }}>{k.count}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginTop: 1 }}>{k.label}</div>
          </div>
        </div>
      ))}
      <div style={{ ...glass, borderRadius: 14, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, background: "rgba(45,140,255,0.07)", flex: "1 1 140px", minWidth: 0 }}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>€</span>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1976D2", lineHeight: 1.1 }}>{formatEur(caTotal)}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginTop: 1 }}>CA total (TTC)</div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   RELANCES — types & helpers
═══════════════════════════════════════════════════════════════════════ */
const LS_RELANCES_VISION = "thor_pro_vision_relances";

interface RelanceEntry {
  devisId: string;
  date: string;
  patientNom: string;
  patientPrenom: string;
}

function loadRelances(): RelanceEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_RELANCES_VISION);
    return raw ? (JSON.parse(raw) as RelanceEntry[]) : [];
  } catch { return []; }
}

function saveRelance(entry: RelanceEntry): void {
  const list = loadRelances().filter(r => r.devisId !== entry.devisId);
  list.push(entry);
  try { localStorage.setItem(LS_RELANCES_VISION, JSON.stringify(list)); } catch { /* noop */ }
}

function daysSince(isoDate: string): number {
  const now = new Date();
  const d = new Date(isoDate);
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/* ═══════════════════════════════════════════════════════════════════════
   DOSSIER LINK — types & helpers
═══════════════════════════════════════════════════════════════════════ */
interface DossierLigne {
  designation: string;
  marque: string;
  reference?: string;
  prixTTC: number;
  priseEnChargeSS: number;
  priseEnChargeMutuelle: number;
}

interface DossierForLink {
  id: string;
  numero: string;
  patientNom: string;
  patientPrenom: string;
  status: "Prise en charge";
  type: "montures-verres";
  lignes: DossierLigne[];
  montantTotal: number;
  montantSS: number;
  montantMutuelle: number;
  resteACharge: number;
  devisId: string;
  dateCreation: string;
}

const DOSSIERS_STORAGE_KEY = "thor_pro_dossiers";

function loadDossiers(): DossierForLink[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DOSSIERS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DossierForLink[]) : [];
  } catch { return []; }
}

function saveDossiersList(list: DossierForLink[]) {
  localStorage.setItem(DOSSIERS_STORAGE_KEY, JSON.stringify(list));
}

function genDossierId(list: DossierForLink[]): string {
  const year = new Date().getFullYear();
  const nums = list
    .filter(d => d.numero.startsWith(`DOS-${year}`))
    .map(d => parseInt(d.numero.split("-")[2] ?? "0", 10));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `DOS-${year}-${String(next).padStart(3, "0")}`;
}

/* ═══════════════════════════════════════════════════════════════════════
   DOSSIER LINK BUTTON — with toast
═══════════════════════════════════════════════════════════════════════ */
function DossierLinkBtn({ d, onDevisUpdated }: { d: Devis; onDevisUpdated: (updated: Devis) => void }) {
  const [toast, setToast] = useState<{ message: string; dossierId: string; numero: string } | null>(null);

  function showToast(message: string, dossierId: string, numero: string) {
    setToast({ message, dossierId, numero });
    setTimeout(() => setToast(null), 3000);
  }

  function handleCreateDossier() {
    const dossiers = loadDossiers();
    const numero = genDossierId(dossiers);
    const newId = Date.now().toString();

    const lignes: DossierLigne[] = d.lignes.map(l => ({
      designation: l.designation,
      marque: l.marque,
      reference: l.reference || undefined,
      prixTTC: l.prixVenteTTC,
      priseEnChargeSS: l.priseEnChargeSS,
      priseEnChargeMutuelle: l.priseEnChargeMutuelle,
    }));

    const newDossier: DossierForLink = {
      id: newId,
      numero,
      patientNom: d.patientNom,
      patientPrenom: d.patientPrenom,
      status: "Prise en charge",
      type: "montures-verres",
      lignes,
      montantTotal: d.totalTTC,
      montantSS: d.totalSS,
      montantMutuelle: d.totalMutuelle,
      resteACharge: d.resteACharge,
      devisId: d.id,
      dateCreation: new Date().toISOString(),
    };

    saveDossiersList([...dossiers, newDossier]);

    const updatedDevis: Devis = {
      ...d,
      dossierIds: [newId],
      status: d.status === "Signé" ? "Commandé" : d.status,
    };
    onDevisUpdated(updatedDevis);
    showToast(`Dossier ${numero} créé`, newId, numero);
  }

  const hasDossier = (d.dossierIds?.length ?? 0) > 0;
  const dossierId = d.dossierIds?.[0];

  return (
    <>
      {hasDossier && dossierId ? (
        <a
          href={`/clair-vision/pro/optique/dossiers/${dossierId}`}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 11px", borderRadius: 999, background: "rgba(16,185,129,0.1)", color: "#065F46", fontWeight: 600, fontSize: 12, border: "none", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap" }}
        >
          → Voir le dossier
        </a>
      ) : (d.status === "Signé" || d.status === "Commandé") ? (
        <button
          onClick={handleCreateDossier}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 11px", borderRadius: 999, background: "rgba(16,185,129,0.12)", color: "#047857", fontWeight: 600, fontSize: 12, border: "1px solid rgba(16,185,129,0.3)", cursor: "pointer", whiteSpace: "nowrap" }}
        >
          → Créer un dossier
        </button>
      ) : null}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#10b981", color: "#fff", borderRadius: 14, padding: "12px 20px", fontWeight: 600, fontSize: 13, boxShadow: "0 8px 24px rgba(16,185,129,0.35)", display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {toast.message} ✓ —{" "}
          <a
            href={`/clair-vision/pro/optique/dossiers/${toast.dossierId}`}
            style={{ color: "#fff", fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}
          >
            Ouvrir
          </a>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   DEVIS CARD
═══════════════════════════════════════════════════════════════════════ */
const STATUTS_FACTURABLES: DevisStatus[] = ["Brouillon", "Signé", "Commandé", "Prêt", "Livré"];

function DevisCard({ d, onVoir, onModifierStatut, onPrint, onDevisUpdated, onDupliquer, onFaireSignerClick, onConvertirFacture, relances, onRelanceSuccess }: { d: Devis; onVoir: () => void; onModifierStatut: () => void; onPrint: () => void; onDevisUpdated: (updated: Devis) => void; onDupliquer: () => void; onFaireSignerClick: () => void; onConvertirFacture: () => void; relances: RelanceEntry[]; onRelanceSuccess: (msg: string) => void }) {
  const color = avatarColor(d.patientNom + d.patientPrenom);
  const prodsSummary = d.lignes.map(l => `${l.marque} ${l.reference}`).join(" · ");
  const estConverti = d.status === "Converti";

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

  const relanceBadge: ReactNode = (() => {
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

  const relanceDateBadge: ReactNode = relanceRecente ? (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 999, background: "rgba(148,163,184,0.13)", color: "#64748b", fontSize: 11, fontWeight: 600, border: "1px solid rgba(148,163,184,0.3)" }}>
      Relancé le {new Date(relanceRecente.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
    </span>
  ) : null;

  const relancerBtn: ReactNode = (() => {
    if (!needsRelance || relanceRecente) return null;
    if (relanceState === "sent") return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 999, background: "rgba(0,201,138,0.1)", color: "#047857", fontSize: 12, fontWeight: 600, border: "1px solid rgba(0,201,138,0.3)" }}>
        ✓ Relancé
      </span>
    );
    return (
      <button
        onClick={handleRelancer}
        style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 999, background: "rgba(249,115,22,0.10)", color: "#ea580c", fontSize: 12, fontWeight: 600, border: "1px solid rgba(249,115,22,0.3)", cursor: "pointer" }}
      >
        ↩ Relancer
      </button>
    );
  })();

  return (
    <div style={{ ...glass, borderRadius: 16, padding: "14px 18px", display: "grid", gridTemplateColumns: "48px 1fr 130px 200px auto", gap: 14, alignItems: "center", transition: "box-shadow 0.15s", cursor: "default", opacity: estConverti ? 0.75 : 1 }}>
      {/* Avatar */}
      <div style={{ width: 44, height: 44, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", fontWeight: 800, fontSize: 15 }}>
        {initials(d.patientNom, d.patientPrenom)}
      </div>

      {/* Info principale */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{d.patientPrenom} {d.patientNom}</span>
          <StatusBadge status={d.status} />
          {relanceBadge}
          {relanceDateBadge}
          {estConverti && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", background: "rgba(100,116,139,0.14)", padding: "2px 8px", borderRadius: 999, border: "1px solid rgba(100,116,139,0.25)" }}>
              Converti en facture
            </span>
          )}
          {d.factureId && !estConverti && <span style={{ fontSize: 10, fontWeight: 700, color: "#065F46", background: "rgba(16,185,129,0.12)", padding: "2px 8px", borderRadius: 999 }}>{d.factureId}</span>}
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{d.id} · {d.ordonnance.prescripteurNom} · ord. {formatDate(d.ordonnance.dateOrdonnance)}</div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prodsSummary}</div>
      </div>

      {/* Dates */}
      <div style={{ fontSize: 12, color: "#475569" }}>
        <div style={{ fontWeight: 600 }}>{formatDate(d.date)}</div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Valable jusqu'au<br/>{formatDate(d.dateValidite)}</div>
      </div>

      {/* Finances */}
      <div style={{ fontSize: 12 }}>
        <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>{formatEur(d.totalTTC)}</div>
        <div style={{ color: "#059669", marginTop: 2 }}>{d.mutuelleNom} : −{formatEur(d.totalMutuelle)}</div>
        <div style={{ color: "#1976D2" }}>SS : −{formatEur(d.totalSS)}</div>
        {d.modePaiement === "Geste commercial" ? (
          <div style={{ fontWeight: 700, color: "#f59e0b", marginTop: 2 }}>RAC offert</div>
        ) : d.racRegle && d.modePaiement ? (
          <div style={{ fontWeight: 700, color: "#059669", marginTop: 2 }}>
            RAC réglé · {d.modePaiement === "Plusieurs fois" ? `${d.nbEcheances}×` : d.modePaiement}
          </div>
        ) : (
          <div style={{ fontWeight: 700, color: "#2D8CFF", marginTop: 2 }}>Reste : {formatEur(d.resteACharge)}</div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
        <ActionBtn icon={<IconEye />} label="Voir" color="#1D6FCC" bg="rgba(45,140,255,0.1)" hoverBg="rgba(45,140,255,0.18)" onClick={onVoir} />
        <ActionBtn icon={<IconCopy />} label="Dupliquer" color="#6366f1" bg="rgba(99,102,241,0.1)" hoverBg="rgba(99,102,241,0.18)" onClick={onDupliquer} />
        <ActionBtn icon={<IconEdit />} label="Statut" color="#6D28D9" bg="rgba(139,92,246,0.1)" hoverBg="rgba(139,92,246,0.18)" onClick={onModifierStatut} />
        {d.status === "Brouillon" && (
          <ActionBtn icon={<IconSign />} label="Faire signer" color="#047857" bg="rgba(0,201,138,0.1)" hoverBg="rgba(0,201,138,0.18)" onClick={onFaireSignerClick} />
        )}
        {STATUTS_FACTURABLES.includes(d.status) && (
          <ActionBtn icon={<IconFacture />} label="→ Facturer" color="#b45309" bg="rgba(245,158,11,0.1)" hoverBg="rgba(245,158,11,0.2)" onClick={onConvertirFacture} />
        )}
        <ActionBtn icon={<IconPrint />} label="PDF" color="#475569" bg="rgba(148,163,184,0.1)" hoverBg="rgba(148,163,184,0.2)" onClick={onPrint} />
        <DossierLinkBtn d={d} onDevisUpdated={onDevisUpdated} />
        {relancerBtn}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   BANDEAU FACTURES
═══════════════════════════════════════════════════════════════════════ */
function BandeauFactures({ factures, onVoir, onPrint }: { factures: Devis[]; onVoir: (d: Devis) => void; onPrint: (d: Devis) => void }) {
  if (factures.length === 0) return null;
  const caFacture = factures.reduce((s, d) => s + d.totalTTC, 0);
  const moyFacture = caFacture / factures.length;

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{ width: 4, height: 22, borderRadius: 2, background: "#10b981" }} />
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Factures émises</h2>
        <span style={{ fontSize: 12, color: "#64748b" }}>({factures.length} facture{factures.length > 1 ? "s" : ""})</span>
      </div>

      {/* KPIs factures */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Factures", value: String(factures.length), color: "#065F46" },
          { label: "CA facturé TTC", value: formatEur(caFacture), color: "#059669" },
          { label: "Montant moyen", value: formatEur(moyFacture), color: "#10B981" },
        ].map(k => (
          <div key={k.label} style={{ ...glassSubtle, borderRadius: 12, padding: "10px 16px", flex: "1", background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {factures.map(d => (
          <div key={d.id} style={{ ...glassSubtle, borderRadius: 14, padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 100px 160px auto", gap: 12, alignItems: "center", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{d.patientPrenom} {d.patientNom} <span style={{ fontSize: 11, fontWeight: 600, color: "#065F46", background: "rgba(16,185,129,0.12)", padding: "2px 8px", borderRadius: 999, marginLeft: 6 }}>{d.factureId}</span></div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{d.id} · {d.modePaiement || "—"} · {formatDate(d.dateFacture)}</div>
            </div>
            <div style={{ fontSize: 12, color: "#475569" }}><StatusBadge status={d.status} /></div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>{formatEur(d.totalTTC)}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <ActionBtn icon={<IconEye />} label="Voir" color="#065F46" bg="rgba(16,185,129,0.1)" hoverBg="rgba(16,185,129,0.2)" onClick={() => onVoir(d)} />
              <ActionBtn icon={<IconPrint />} label="PDF" color="#475569" bg="rgba(148,163,184,0.1)" hoverBg="rgba(148,163,184,0.2)" onClick={() => onPrint(d)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════════════════ */
type PeriodeFilter = "today" | "week" | "month" | "all";
type SortField = "date-desc" | "date-asc" | "montant-desc" | "montant-asc";

export default function DevisPage() {
  const [devis, setDevis] = useState<Devis[]>([]);
  const [filterStatus, setFilterStatus] = useState<DevisStatus | "Tous">("Tous");
  const [filterRelancer, setFilterRelancer] = useState(false);
  const [relances, setRelances] = useState<RelanceEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filterPatient, setFilterPatient] = useState("");
  const [filterPeriode, setFilterPeriode] = useState<PeriodeFilter>("all");
  const [sortField, setSortField] = useState<SortField>("date-desc");
  const [modalNouveauOpen, setModalNouveauOpen] = useState(false);
  const [modalVoir, setModalVoir] = useState<Devis | null>(null);
  const [modalStatut, setModalStatut] = useState<Devis | null>(null);
  const [modalSigner, setModalSigner] = useState<Devis | null>(null);
  const [initialPatient, setInitialPatient] = useState<ClientInfo | undefined>(undefined);
  const [toast, setToast] = useState<{ msg: string; color: string } | null>(null);

  function showToast(msg: string, color = "#2D8CFF") {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  }

  function refreshRelances() {
    setRelances(loadRelances());
  }

  /* Pré-remplissage depuis ?patient= */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const patientId = params.get("patient");
    if (!patientId) return;

    // D'abord chercher dans localStorage thor_pro_patients
    try {
      const raw = localStorage.getItem("thor_pro_patients");
      if (raw) {
        const patients = JSON.parse(raw) as Array<{ id: string; nom: string; prenom: string; telephone?: string; email?: string; numeroSS?: string; mutuelle?: string; dateNaissance?: string }>;
        const found = patients.find(p => p.id === patientId || `${p.prenom}-${p.nom}`.toLowerCase().replace(/\s/g,"-") === patientId.toLowerCase());
        if (found) {
          setInitialPatient({
            nom: found.nom, prenom: found.prenom,
            dateNaissance: found.dateNaissance ?? "",
            numeroSS: found.numeroSS ?? "",
            telephone: found.telephone ?? "",
            email: found.email ?? "",
          });
          setModalNouveauOpen(true);
          return;
        }
      }
    } catch { /* ignore */ }

    // Fallback : MOCK_PATIENTS lookup (map slug → ClientInfo)
    const MOCK_MAP: Record<string, ClientInfo> = {
      "marie-leblanc":    { nom: "Leblanc",  prenom: "Marie",    dateNaissance: "1985-04-05", numeroSS: "2850469001234", telephone: "07 98 76 54 32", email: "marie.leblanc@email.com" },
      "paul-renaud":      { nom: "Renaud",   prenom: "Paul",     dateNaissance: "1990-01-12", numeroSS: "1900175015123", telephone: "06 12 34 56 78", email: "paul.renaud@email.com" },
      "isabelle-morel":   { nom: "Morel",    prenom: "Isabelle", dateNaissance: "1978-08-22", numeroSS: "2780831000456", telephone: "06 55 44 33 22", email: "isabelle.morel@email.com" },
      "thomas-girard":    { nom: "Girard",   prenom: "Thomas",   dateNaissance: "1997-03-03", numeroSS: "1970344000789", telephone: "06 78 90 12 34", email: "thomas.girard@email.com" },
      "sophie-renault":   { nom: "Renault",  prenom: "Sophie",   dateNaissance: "1995-06-14", numeroSS: "2950613001012", telephone: "07 11 22 33 44", email: "sophie.renault@email.com" },
      "claire-dubois":    { nom: "Dubois",   prenom: "Claire",   dateNaissance: "1965-10-30", numeroSS: "2651075008345", telephone: "06 33 44 55 66", email: "claire.dubois@email.com" },
      "lucas-martin":     { nom: "Martin",   prenom: "Lucas",    dateNaissance: "2005-07-22", numeroSS: "1050767000678", telephone: "06 99 88 77 66", email: "lucas.martin@email.com" },
      "nicolas-bernard":  { nom: "Bernard",  prenom: "Nicolas",  dateNaissance: "1988-01-22", numeroSS: "1880106000901", telephone: "07 00 11 22 33", email: "nicolas.bernard@email.com" },
    };
    if (MOCK_MAP[patientId]) {
      setInitialPatient(MOCK_MAP[patientId]);
      setModalNouveauOpen(true);
    }
  }, []);

  /* Persistance localStorage */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("thor_pro_devis");
      if (raw) {
        const parsed = JSON.parse(raw) as Devis[];
        setDevis(parsed);
      } else {
        setDevis(MOCK_DEVIS);
      }
    } catch {
      setDevis(MOCK_DEVIS);
    }
    setRelances(loadRelances());
  }, []);

  const persist = useCallback((list: Devis[]) => {
    setDevis(list);
    try { localStorage.setItem("thor_pro_devis", JSON.stringify(list)); } catch { /* noop */ }
  }, []);

  function handleDupliquer(d: Devis) {
    const newId = genDevisId([...devis]);
    const copy: Devis = {
      ...d,
      id: newId,
      date: today(),
      dateValidite: makeValidite(today()),
      status: "Brouillon",
      signatureClient: false,
      dateSignature: undefined,
      factureId: "",
      dateFacture: "",
      acompte: 0,
      notes: d.notes ? `${d.notes} (copie)` : "(copie)",
    };
    persist([...devis, copy]);
    showToast(`Devis dupliqué : ${newId}`);
  }

  /* Filtres */
  const STATUSES: (DevisStatus | "Tous")[] = ["Tous", "Brouillon", "Signé", "Commandé", "Prêt", "Livré", "Facturé"];
  const PERIODES: { label: string; value: PeriodeFilter }[] = [
    { label: "Tout", value: "all" },
    { label: "Aujourd'hui", value: "today" },
    { label: "Cette semaine", value: "week" },
    { label: "Ce mois", value: "month" },
  ];

  function inPeriode(d: Devis): boolean {
    if (filterPeriode === "all") return true;
    const now = new Date();
    const dDate = new Date(d.date);
    if (filterPeriode === "today") {
      return dDate.toDateString() === now.toDateString();
    }
    if (filterPeriode === "week") {
      const monday = new Date(now);
      monday.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
      monday.setHours(0,0,0,0);
      return dDate >= monday;
    }
    if (filterPeriode === "month") {
      return dDate.getFullYear() === now.getFullYear() && dDate.getMonth() === now.getMonth();
    }
    return true;
  }

  const RELANCE_STATUTS_FILTER: DevisStatus[] = ["Brouillon", "Signé"];

  const filtered = devis.filter(d => {
    const matchStatus = filterStatus === "Tous" || d.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q || [d.patientNom, d.patientPrenom, d.id, d.mutuelleNom].some(v => v.toLowerCase().includes(q));
    const qp = filterPatient.toLowerCase();
    const matchPatient = !qp || `${d.patientPrenom} ${d.patientNom}`.toLowerCase().includes(qp);
    if (filterRelancer) {
      if (!RELANCE_STATUTS_FILTER.includes(d.status)) return false;
      if (daysSince(d.date) <= 7) return false;
      const hasRecentRelance = relances.some(r => r.devisId === d.id && daysSince(r.date) < 7);
      if (hasRecentRelance) return false;
    }
    return matchStatus && matchSearch && matchPatient && inPeriode(d);
  }).sort((a, b) => {
    if (sortField === "date-desc") return b.date.localeCompare(a.date);
    if (sortField === "date-asc")  return a.date.localeCompare(b.date);
    if (sortField === "montant-desc") return b.totalTTC - a.totalTTC;
    if (sortField === "montant-asc")  return a.totalTTC - b.totalTTC;
    return 0;
  });

  const devisActifs = filtered.filter(d => d.status !== "Facturé");
  const factures = devis.filter(d => d.status === "Facturé");
  const totalFiltered = devisActifs.reduce((acc, d) => acc + d.totalTTC, 0);

  function handleSaveNouveau(d: Devis) {
    persist([...devis, d]);
    setModalNouveauOpen(false);
  }

  function handleSaveStatut(updated: Devis) {
    persist(devis.map(d => d.id === updated.id ? updated : d));
    setModalStatut(null);
  }

  function handlePrint(d: Devis) {
    printDevisVision(d as unknown as DevisPdf, loadStoreConfig());
  }

  function handleConvertirFacture(d: Devis) {
    // 1. Créer la facture dans localStorage
    const factures = loadFacturesLS();
    const newFacture: FactureLS = {
      id: "FAC-" + Date.now(),
      numero: "FAC-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 900) + 100),
      patientNom: d.patientNom,
      patientPrenom: d.patientPrenom,
      montantTTC: d.totalTTC,
      statut: "en_attente",
      date: new Date().toISOString().slice(0, 10),
      devisId: d.id,
      mutuelle: d.mutuelleNom || undefined,
    };
    saveFacturesLS([...factures, newFacture]);

    // 2. Mettre à jour le statut du devis en "Converti"
    const updatedDevis: Devis = { ...d, status: "Converti" };
    persist(devis.map(x => x.id === d.id ? updatedDevis : x));

    // 3. Toast vert
    showToast("Facture créée avec succès — " + newFacture.numero, "#10b981");
  }

  return (
    <>
      <div style={{ padding: "28px 32px", minHeight: "100vh" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1e293b", letterSpacing: -0.5 }}>Devis & Factures</h1>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#64748b" }}>Gestion des devis normalisés Loi Hamon 2014 · {devis.length} dossier{devis.length !== 1 ? "s" : ""}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => exportCSV(filtered)}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 18px", borderRadius: 14, border: "1px solid rgba(148,163,184,0.35)", background: "var(--glass-strong-bg)", color: "#475569", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              <IconDownload /> Exporter CSV
            </button>
            <button onClick={() => setModalNouveauOpen(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 14, border: "none", background: "#2D8CFF", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 16px rgba(45,140,255,0.3)" }}>
              <IconPlus /> Nouveau devis
            </button>
          </div>
        </div>

        {/* KPI Bar */}
        <KpiBar devis={devis} />

        {/* Filtres améliorés */}
        <div style={{ ...glass, borderRadius: 16, padding: "14px 18px", marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Ligne 1 : statut + période */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {STATUSES.map(s => {
                const count = s === "Tous" ? devis.length : devis.filter(d => d.status === s).length;
                const active = filterStatus === s && !filterRelancer;
                return (
                  <button key={s} onClick={() => { setFilterStatus(s); setFilterRelancer(false); }}
                    style={{ padding: "6px 14px", borderRadius: 999, border: active ? "none" : "1px solid rgba(148,163,184,0.3)", background: active ? "#2D8CFF" : "rgba(255,255,255,0.6)", color: active ? "#fff" : "#475569", fontWeight: 600, fontSize: 12, cursor: "pointer", transition: "all 0.15s" }}>
                    {s} ({count})
                  </button>
                );
              })}
              <button
                onClick={() => { setFilterRelancer(r => !r); setFilterStatus("Tous"); }}
                style={{ padding: "6px 14px", borderRadius: 999, border: filterRelancer ? "none" : "1px solid rgba(249,115,22,0.4)", background: filterRelancer ? "linear-gradient(135deg,#ea580c,#c2410c)" : "rgba(249,115,22,0.08)", color: filterRelancer ? "#fff" : "#ea580c", fontWeight: 600, fontSize: 12, cursor: "pointer", transition: "all 0.15s" }}>
                ↩ À relancer
              </button>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              {PERIODES.map(p => (
                <button key={p.value} onClick={() => setFilterPeriode(p.value)}
                  style={{ padding: "5px 12px", borderRadius: 999, border: filterPeriode === p.value ? "none" : "1px solid rgba(148,163,184,0.3)", background: filterPeriode === p.value ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.6)", color: filterPeriode === p.value ? "#6366f1" : "#475569", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ligne 2 : recherche patient + tri */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: "1 1 200px" }}>
              <input style={{ ...inputStyle, paddingLeft: 32 }} placeholder="Rechercher (ID, devis, mutuelle)…" value={search} onChange={e => setSearch(e.target.value)} />
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <div style={{ position: "relative", flex: "1 1 180px" }}>
              <input style={{ ...inputStyle, paddingLeft: 32 }} placeholder="Filtrer par patient…" value={filterPatient} onChange={e => setFilterPatient(e.target.value)} />
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4"/><path d="M9.5 12.5l-2-3V7l-3-5h8l-3 5v5.5z" stroke="none" fill="none"/><path d="M7 9.5c-.8-.5-3-1-3-3.5h8c0 2.5-2.2 3-3 3.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <select style={{ ...selectStyle, maxWidth: 200, flex: "0 0 auto" }} value={sortField} onChange={e => setSortField(e.target.value as SortField)}>
              <option value="date-desc">Date (récent d&#39;abord)</option>
              <option value="date-asc">Date (ancien d&#39;abord)</option>
              <option value="montant-desc">Montant (décroissant)</option>
              <option value="montant-asc">Montant (croissant)</option>
            </select>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>
              {devisActifs.length} devis · {formatEur(totalFiltered)}
            </div>
          </div>
        </div>

        {/* Liste devis actifs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {devisActifs.length === 0 ? (
            <div style={{ ...glass, borderRadius: 16, padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
              Aucun devis trouvé pour cette recherche.
            </div>
          ) : (
            devisActifs.map(d => (
              <DevisCard key={d.id} d={d}
                onVoir={() => setModalVoir(d)}
                onModifierStatut={() => setModalStatut(d)}
                onPrint={() => handlePrint(d)}
                onDevisUpdated={updated => persist(devis.map(x => x.id === updated.id ? updated : x))}
                onDupliquer={() => handleDupliquer(d)}
                onFaireSignerClick={() => setModalSigner(d)}
                onConvertirFacture={() => handleConvertirFacture(d)}
                relances={relances}
                onRelanceSuccess={msg => { refreshRelances(); showToast(msg, "#10b981"); }}
              />
            ))
          )}
        </div>

        {/* Bandeau factures */}
        <BandeauFactures
          factures={factures}
          onVoir={d => setModalVoir(d)}
          onPrint={d => handlePrint(d)}
        />
      </div>

      {/* Toast global */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: toast.color, color: "#fff", borderRadius: 14, padding: "12px 20px", fontWeight: 600, fontSize: 13, boxShadow: `0 8px 24px ${toast.color}55`, display: "flex", alignItems: "center", gap: 10, maxWidth: 400, transition: "background 0.2s" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {toast.msg}
        </div>
      )}

      {/* Modales */}
      {modalNouveauOpen && (
        <ModalNouveauDevis
          onClose={() => { setModalNouveauOpen(false); setInitialPatient(undefined); }}
          onSave={handleSaveNouveau}
          allDevis={devis}
          initialClient={initialPatient}
        />
      )}
      {modalVoir && (
        <ModalVoirDevis devis={modalVoir} onClose={() => setModalVoir(null)} />
      )}
      {modalStatut && (
        <ModalModifierStatut
          devis={modalStatut}
          onClose={() => setModalStatut(null)}
          onSave={handleSaveStatut}
          allDevis={devis}
        />
      )}
      {modalSigner && (
        <ModalSignature
          devis={modalSigner}
          onClose={() => setModalSigner(null)}
          onSigned={updated => { persist(devis.map(d => d.id === updated.id ? updated : d)); setModalSigner(null); }}
          showToast={showToast}
        />
      )}
    </>
  );
}
