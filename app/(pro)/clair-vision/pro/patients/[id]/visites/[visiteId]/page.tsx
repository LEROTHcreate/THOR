"use client";

import Link from "next/link";
import { use, useState } from "react";
import type { CSSProperties } from "react";

/* ─── tokens ────────────────────────────────────────────────────────────── */
const glass: CSSProperties = {
  background: "rgba(255,255,255,0.62)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--glass-strong-border)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
};
const white: CSSProperties = {
  background: "var(--glass-card-bg)",
  border: "1px solid rgba(226,232,240,0.8)",
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
};
const ACCENT = "#2D8CFF";
const ACCENT_D = "#1A72E8";
function eur(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

/* ─── types ─────────────────────────────────────────────────────────────── */
type EquipementType = "lunettes-vue" | "lunettes-soleil" | "lentilles" | "divers";
type TabKey = "dossier" | "tierspayant" | "documents";
type Statut = "En cours" | "En attente" | "Accepté" | "Facturé" | "Payé";

interface Rx { sph: string; cyl: string; axe: string; add?: string; ep?: string }
interface LigneEquipement {
  id: string;
  categorie: "monture" | "verre-od" | "verre-og" | "lentilles" | "accessoire" | "prestation";
  designation: string; marque?: string; reference?: string;
  qte: number; prixUnitaire: number; remise?: number; total: number;
  classe?: "A" | "B";
}
interface OrdonnanceDossier {
  numero: string; prescripteur: string; rpps?: string;
  dateOrdonnance: string; dateExpiration: string;
  type: "lunettes" | "lentilles" | "les deux";
  od: Rx; og: Rx;
  ecartPupillaire?: string; ecartPupillaireVP?: string; hauteur?: string; remarques?: string;
}
interface FullDossier {
  id: string; patientId: string; patientNom: string;
  date: string; dateFr: string; typeEquipement: EquipementType;
  praticien?: string; statut: Statut;
  ordonnance?: OrdonnanceDossier;
  lignes: LigneEquipement[];
  totalHT: number; totalTTC: number; devisId?: string;
  pecSecu?: { baseRemboursement: number; tauxSS: number; montantSS: number };
  pecMutuelle?: { nom: string; contrat?: string; garantieOptique: string; montant: number; reseauAdherent: boolean };
  rac?: number; modeFinancement?: string;
  facture?: { id: string; date: string; montant: number; statut: string; modePaiement?: string };
  livraison?: { date: string; monteurOpticien?: string; commentaire?: string; signe: boolean };
  garanties?: Array<{ produit: string; garantieFab: string; garantieMag: string; statut: "Valide" | "Expirée" }>;
  documents?: Array<{ nom: string; type: string; date: string; icon: string }>;
  notes?: string;
}

/* ─── mock data ─────────────────────────────────────────────────────────── */
const MOCK_DOSSIERS: Record<string, FullDossier> = {
  v1: {
    id: "v1", patientId: "marie-leblanc", patientNom: "Marie Leblanc",
    date: "2026-01-20", dateFr: "20 jan. 2026",
    typeEquipement: "lunettes-vue", praticien: "Dr. Sophie Aubert", statut: "Payé",
    ordonnance: {
      numero: "26010024", prescripteur: "Dr. Sophie Aubert", rpps: "10004587412",
      dateOrdonnance: "2026-01-20", dateExpiration: "2031-01-20", type: "lunettes",
      od: { sph: "−2,25", cyl: "−0,50", axe: "170°", ep: "27,5" },
      og: { sph: "−1,75", cyl: "−0,25", axe: "10°",  ep: "27,0" },
      ecartPupillaire: "64 mm", ecartPupillaireVP: "61 mm", hauteur: "20 mm",
      remarques: "Myopie stable — renouvellement standard.",
    },
    lignes: [
      { id: "l1", categorie: "monture",  designation: "Monture Ray-Ban RB5154 Tortoise", marque: "Ray-Ban",  reference: "RB5154-2012-52",  qte: 1, prixUnitaire: 240, total: 240, classe: "B" },
      { id: "l2", categorie: "verre-od", designation: "Varilux X Design 1,67 Crizal Sapphire UV", marque: "Essilor", reference: "VXD-167-OD", qte: 1, prixUnitaire: 220, total: 220, classe: "B" },
      { id: "l3", categorie: "verre-og", designation: "Varilux X Design 1,67 Crizal Sapphire UV", marque: "Essilor", reference: "VXD-167-OG", qte: 1, prixUnitaire: 220, total: 220, classe: "B" },
    ],
    totalHT: 661.16, totalTTC: 680, devisId: "26010003",
    pecSecu:    { baseRemboursement: 0.15, tauxSS: 60, montantSS: 0.09 },
    pecMutuelle: { nom: "MGEN", contrat: "MGEN Santé Confort", garantieOptique: "200 € / verre + 80 € / monture", montant: 200, reseauAdherent: true },
    rac: 479.91, modeFinancement: "CB + Tiers payant mutuelle",
    facture:  { id: "26010003", date: "2026-01-25", montant: 479.91, statut: "Payé", modePaiement: "CB + TP mutuelle" },
    livraison: { date: "25 jan. 2026", monteurOpticien: "Paul Martin", commentaire: "Ajustement branches.", signe: true },
    garanties: [
      { produit: "Monture Ray-Ban RB5154 Tortoise", garantieFab: "Jan. 2028", garantieMag: "Jan. 2027", statut: "Valide" },
      { produit: "Verres Varilux X Design OD+OG",   garantieFab: "Jan. 2028", garantieMag: "Jan. 2027", statut: "Valide" },
    ],
    documents: [
      { nom: "Ordonnance Dr. Aubert — 20 jan. 2026", type: "ordonnance", date: "20 jan. 2026", icon: "" },
      { nom: "Attestation mutuelle MGEN",             type: "mutuelle",   date: "15 jan. 2026", icon: "" },
      { nom: "Bon de livraison — FAC-2026-003",       type: "livraison",  date: "25 jan. 2026", icon: "" },
      { nom: "Facture acquittée — FAC-2026-003",      type: "facture",    date: "25 jan. 2026", icon: "" },
    ],
    notes: "Première paire de progressifs. Montage soigneux — cliente très satisfaite.",
  },
  v2: {
    id: "v2", patientId: "marie-leblanc", patientNom: "Marie Leblanc",
    date: "2025-09-10", dateFr: "10 sept. 2025",
    typeEquipement: "lentilles", praticien: "Dr. Sophie Aubert", statut: "En attente",
    ordonnance: {
      numero: "ORD-2025-189", prescripteur: "Dr. Marc Lefebvre",
      dateOrdonnance: "2025-03-03", dateExpiration: "2026-03-03", type: "lentilles",
      od: { sph: "−2,00", cyl: "−0,50", axe: "165°" },
      og: { sph: "−1,50", cyl: "−0,25", axe: "15°"  },
      ecartPupillaire: "64 mm", remarques: "Lentilles mensuelles tolérées.",
    },
    lignes: [
      { id: "l1", categorie: "lentilles",  designation: "Air Optix Aqua Mensuelle OD −2,00 BC 8.6", marque: "Alcon",       reference: "AOA-OD200", qte: 6, prixUnitaire: 9,     total: 54    },
      { id: "l2", categorie: "lentilles",  designation: "Air Optix Aqua Mensuelle OG −1,50 BC 8.6", marque: "Alcon",       reference: "AOA-OG150", qte: 6, prixUnitaire: 9,     total: 54    },
      { id: "l3", categorie: "accessoire", designation: "Solution ReNu MPS 360 ml",                  marque: "Bausch+Lomb", reference: "RENU360",   qte: 2, prixUnitaire: 12.80, total: 25.60 },
    ],
    totalHT: 129.81, totalTTC: 133.60, devisId: "25090118",
    pecMutuelle: { nom: "MGEN", contrat: "MGEN Santé Confort", garantieOptique: "30 € / an lentilles", montant: 30, reseauAdherent: true },
    rac: 103.60,
    documents: [
      { nom: "Ordonnance Dr. Lefebvre — mars 2025", type: "ordonnance", date: "3 mars 2025",    icon: "" },
      { nom: "Fiche de suivi lentilles",             type: "suivi",      date: "10 sept. 2025", icon: "" },
    ],
    notes: "Pack 6 mois Air Optix Aqua mensuelle.",
  },
  v3: {
    id: "v3", patientId: "marie-leblanc", patientNom: "Marie Leblanc",
    date: "2025-05-02", dateFr: "2 mai 2025",
    typeEquipement: "lunettes-soleil", statut: "En cours",
    lignes: [
      { id: "l1", categorie: "monture",  designation: "Persol PO3019S Crystal Havana",           marque: "Persol", reference: "PO3019S-108",  qte: 1, prixUnitaire: 285, total: 285 },
      { id: "l2", categorie: "verre-od", designation: "Verre Polarisant Cat.3 Organic 1.5 Brun", marque: "BBGR",   reference: "SOL15PBR-OD", qte: 1, prixUnitaire: 85,  total: 85  },
      { id: "l3", categorie: "verre-og", designation: "Verre Polarisant Cat.3 Organic 1.5 Brun", marque: "BBGR",   reference: "SOL15PBR-OG", qte: 1, prixUnitaire: 85,  total: 85  },
    ],
    totalHT: 447.57, totalTTC: 455, devisId: "25050077",
    pecMutuelle: { nom: "MGEN", contrat: "MGEN Santé Confort", garantieOptique: "80 € / monture", montant: 80, reseauAdherent: true },
    rac: 375,
    documents: [{ nom: "Devis DEV-2025-077", type: "devis", date: "2 mai 2025", icon: "" }],
    notes: "Verres polarisants pour conduite.",
  },
};

const EQUIP_META: Record<EquipementType, { label: string; icon: string; color: string; bg: string }> = {
  "lunettes-vue":    { label: "Lunettes de vue",    icon: "", color: ACCENT,    bg: "rgba(45,140,255,0.10)" },
  "lunettes-soleil": { label: "Lunettes de soleil", icon: "", color: "#F59E0B", bg: "rgba(245,158,11,0.10)"  },
  "lentilles":       { label: "Lentilles",          icon: "",  color: "#00C98A", bg: "rgba(0,201,138,0.10)"  },
  "divers":          { label: "Divers",             icon: "", color: "#8B5CF6", bg: "rgba(139,92,246,0.10)" },
};
const STATUT_META: Record<string, { color: string; bg: string }> = {
  "Payé":       { color: "#15803d", bg: "rgba(21,128,61,0.10)"   },
  "Facturé":    { color: "#15803d", bg: "rgba(21,128,61,0.10)"   },
  "Accepté":    { color: "#6366f1", bg: "rgba(99,102,241,0.10)"  },
  "En attente": { color: "#F59E0B", bg: "rgba(245,158,11,0.10)"  },
  "En cours":   { color: ACCENT,    bg: "rgba(45,140,255,0.10)"  },
};
const CAT_OPTS = [
  { v: "monture",    l: "Monture",    color: "#8B5CF6" },
  { v: "verre-od",   l: "Verre OD",   color: ACCENT    },
  { v: "verre-og",   l: "Verre OG",   color: ACCENT    },
  { v: "lentilles",  l: "Lentilles",  color: "#00C98A" },
  { v: "accessoire", l: "Accessoire", color: "#94a3b8" },
  { v: "prestation", l: "Prestation", color: "#94a3b8" },
] as const;

/* ─── helpers ────────────────────────────────────────────────────────────── */
function recompute(lignes: LigneEquipement[]) {
  const ttc = lignes.reduce((s, l) => s + l.total, 0);
  const ht  = ttc / 1.055;
  return { totalHT: Math.round(ht * 100) / 100, totalTTC: Math.round(ttc * 100) / 100 };
}

/* ─── Bases LPPR (tarif de responsabilité SS) ───────────────────────────── */
// Classe B adulte : base symbolique 0,05 € → remb. 60 % = 0,03 € par produit
// (Arrêté LPPR — bases Cl. B volontairement basses pour inciter à la Cl. A)
// Classe A adulte : bases fixées par arrêté du 11/07/2019 (100 % Santé)
function lpprBase(l: LigneEquipement): number {
  if (!l.classe || l.classe === "B") return 0.05;
  // Classe A
  if (l.categorie === "monture")                               return 30.00;   // monture Cl. A plafonnée à 30 €
  if (l.categorie === "verre-od" || l.categorie === "verre-og") return 32.50;  // verre unifocal simple Cl. A (SPH ≤ 6)
  return 0.05;
}
// Taux SS appliqué selon l'exonération
const TAUX_EXO: Record<string, number> = {
  "60": 60, "100-ALD": 100, "100-MAT": 100, "100-AT": 100, "CMUC": 100, "AME": 60, "autre": 60,
};

/* ─── Numérotation YYMMXXXX ─────────────────────────────────────────────── */
// Format : YY (année) + MM (mois) + XXXX (séquentiel mensuel à 4 chiffres)
// Ex: 26030001 = 1er document de mars 2026
// Production : remplacer _monthlySeq par un compteur atomique en base de données
const _monthlySeq = new Map<string, number>();
function nextId(type: "FAC" | "DEV" | "PEC" | "ORD"): string {
  const d   = new Date();
  const yy  = String(d.getFullYear()).slice(-2);
  const mm  = String(d.getMonth() + 1).padStart(2, "0");
  const key = `${type}-${yy}${mm}`;
  const n   = (_monthlySeq.get(key) ?? 0) + 1;
  _monthlySeq.set(key, n);
  return `${yy}${mm}${String(n).padStart(4, "0")}`;
}

/* ─── Nommage automatique des documents ─────────────────────────────────── */
function normalize(s: string): string {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
}
function proposeDocName(
  type: string,
  extracted: Record<string, string>,
  patientNom: string,
): string {
  const patient = normalize(patientNom.split(" ").slice(-1)[0] ?? patientNom);
  switch (type) {
    case "ordonnance": {
      const presc = normalize(extracted["Prescripteur"] ?? "prescripteur");
      return `ordo.${presc}.${patient}`;
    }
    case "mutuelle": {
      const mut = normalize(extracted["Mutuelle"] ?? "mutuelle");
      return `mutuelle.${mut}.${patient}`;
    }
    case "carte-vitale": {
      const bene = normalize((extracted["Bénéficiaire"] ?? patientNom).split(" ").slice(-1)[0]);
      return `vitale.${bene}`;
    }
    case "facture":   return `facture.${patient}`;
    case "livraison": return `livraison.${patient}`;
    default:          return `document.${patient}`;
  }
}

const iBase: CSSProperties = {
  borderRadius: 7, border: "1px solid rgba(203,213,225,0.9)",
  background: "rgba(248,250,252,0.95)", color: "#1e293b",
  padding: "4px 8px", fontSize: 12, outline: "none", width: "100%",
  boxSizing: "border-box", fontFamily: "inherit",
};
function Inp({ value, onChange, type = "text", placeholder, style }: {
  value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string; style?: CSSProperties;
}) {
  return <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...iBase, ...style }} />;
}

function OrdoDate({ dateOrd, dateExp, type }: { dateOrd: string; dateExp: string; type: string }) {
  const [show, setShow] = useState(false);
  const expFr = new Date(dateExp).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const expired = new Date(dateExp) < new Date();
  const regle = type === "lentilles"
    ? "1 an (art. R.4362-12 CSP)"
    : "5 ans si 16–42 ans / 3 ans si >42 ans (art. L.4362-12-1 CSP)";
  return (
    <span style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{ fontWeight: 600, color: "#1e293b", cursor: "default", borderBottom: "1px dashed #94a3b8" }}>
        {new Date(dateOrd).toLocaleDateString("fr-FR")}
      </span>
      {show && (
        <span style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", background: "rgba(15,23,42,0.92)", color: "white", fontSize: 11, padding: "6px 12px", borderRadius: 8, zIndex: 200, boxShadow: "0 4px 12px rgba(0,0,0,0.25)", lineHeight: 1.6, textAlign: "center", minWidth: 220 }}>
          <div>{expired ? "Expirée le " : "Valable jusqu'au "}<strong>{expFr}</strong></div>
          <div style={{ opacity: 0.75, fontSize: 10, marginTop: 2 }}>{regle}</div>
        </span>
      )}
    </span>
  );
}

/* ─── Section ────────────────────────────────────────────────────────────── */
function Section({ title, right, children, noPad }: {
  title: string; right?: React.ReactNode; children: React.ReactNode; noPad?: boolean;
}) {
  return (
    <div style={{ ...white, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "9px 14px", borderBottom: "1px solid rgba(226,232,240,0.8)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", letterSpacing: "0.01em" }}>{title}</span>
        {right}
      </div>
      <div style={noPad ? {} : { padding: "12px 14px" }}>{children}</div>
    </div>
  );
}

/* ─── InfoField ──────────────────────────────────────────────────────────── */
function InfoField({ label, editing, display, input }: {
  label: string; editing: boolean; display: React.ReactNode; input: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>{label}</div>
      {editing ? input : <div style={{ fontSize: 12, color: "#1e293b" }}>{display}</div>}
    </div>
  );
}

/* ─── KPI ────────────────────────────────────────────────────────────────── */
function KPI({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: bold ? 16 : 13, fontWeight: bold ? 800 : 600, color: color ?? "#1e293b", marginTop: 1 }}>{value}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB DOSSIER — 2 colonnes
═══════════════════════════════════════════════════════════════════════════ */
function TabDossier({
  dossier, setDossier, editing,
}: {
  dossier: FullDossier;
  setDossier: React.Dispatch<React.SetStateAction<FullDossier>>;
  editing: boolean;
}) {
  function updOrdo<K extends keyof OrdonnanceDossier>(k: K, v: OrdonnanceDossier[K]) {
    setDossier(d => d.ordonnance ? { ...d, ordonnance: { ...d.ordonnance, [k]: v } } : d);
  }
  function updRx(eye: "od" | "og", field: keyof Rx, v: string) {
    setDossier(d => d.ordonnance ? { ...d, ordonnance: { ...d.ordonnance, [eye]: { ...d.ordonnance[eye], [field]: v } } } : d);
  }
  function updLigne(id: string, patch: Partial<LigneEquipement>) {
    setDossier(d => {
      const lignes = d.lignes.map(l => {
        if (l.id !== id) return l;
        const updated = { ...l, ...patch };
        updated.total = Math.round(updated.qte * updated.prixUnitaire * 100) / 100;
        return updated;
      });
      return { ...d, lignes, ...recompute(lignes) };
    });
  }
  function addLigne() {
    const newL: LigneEquipement = { id: `l-${Date.now()}`, categorie: "accessoire", designation: "Nouvelle ligne", qte: 1, prixUnitaire: 0, total: 0 };
    setDossier(d => { const lignes = [...d.lignes, newL]; return { ...d, lignes, ...recompute(lignes) }; });
  }
  function removeLigne(id: string) {
    setDossier(d => { const lignes = d.lignes.filter(l => l.id !== id); return { ...d, lignes, ...recompute(lignes) }; });
  }
  function updPEC(patch: Partial<NonNullable<FullDossier["pecMutuelle"]>>) {
    setDossier(d => ({ ...d, pecMutuelle: d.pecMutuelle ? { ...d.pecMutuelle, ...patch } : d.pecMutuelle }));
  }
  function updPECSecu(patch: Partial<NonNullable<FullDossier["pecSecu"]>>) {
    setDossier(d => ({ ...d, pecSecu: d.pecSecu ? { ...d.pecSecu, ...patch } : d.pecSecu }));
  }

  const totalPEC = (dossier.pecSecu?.montantSS ?? 0) + (dossier.pecMutuelle?.montant ?? 0);
  const rac = dossier.rac ?? dossier.totalTTC - totalPEC;
  const ordo = dossier.ordonnance;
  const hasAdd = ordo?.od.add || ordo?.og.add;
  const hasEP  = ordo?.od.ep  || ordo?.og.ep;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 14, alignItems: "start" }}>

      {/* ── COLONNE GAUCHE : clinique ──────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        {/* ORDONNANCE */}
        {ordo && (
          <Section title="Ordonnance" right={<span style={{ fontSize: 10, fontFamily: "monospace", color: "#94a3b8" }}>{ordo.numero}</span>}>
            {/* Ligne meta compacte */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", marginBottom: 12, fontSize: 12 }}>
              <InfoField label="Prescripteur" editing={editing}
                display={<><strong>{ordo.prescripteur}</strong>{ordo.rpps && <span style={{ color: "#94a3b8", marginLeft: 6, fontSize: 10 }}>RPPS {ordo.rpps}</span>}</>}
                input={<div style={{ display: "flex", gap: 6 }}><Inp value={ordo.prescripteur} onChange={v => updOrdo("prescripteur", v)} style={{ flex: 2 }} /><Inp value={ordo.rpps ?? ""} onChange={v => updOrdo("rpps", v)} placeholder="RPPS" style={{ flex: 1 }} /></div>}
              />
              <InfoField label="Date ordo" editing={editing}
                display={<OrdoDate dateOrd={ordo.dateOrdonnance} dateExp={ordo.dateExpiration} type={ordo.type} />}
                input={<Inp type="date" value={ordo.dateOrdonnance} onChange={v => updOrdo("dateOrdonnance", v)} />}
              />
              <InfoField label="Type" editing={editing}
                display={<span style={{ textTransform: "capitalize" }}>{ordo.type}</span>}
                input={<select value={ordo.type} onChange={e => updOrdo("type", e.target.value as OrdonnanceDossier["type"])} style={{ ...iBase }}>{["lunettes", "lentilles", "les deux"].map(t => <option key={t}>{t}</option>)}</select>}
              />
              <InfoField label="EP VL" editing={editing} display={ordo.ecartPupillaire ?? "—"}
                input={<Inp value={ordo.ecartPupillaire ?? ""} onChange={v => updOrdo("ecartPupillaire", v)} placeholder="64 mm" style={{ width: 72 }} />}
              />
              <InfoField label="EP VP" editing={editing} display={ordo.ecartPupillaireVP ?? "—"}
                input={<Inp value={ordo.ecartPupillaireVP ?? ""} onChange={v => updOrdo("ecartPupillaireVP", v)} placeholder="61 mm" style={{ width: 72 }} />}
              />
              <InfoField label="Hauteur" editing={editing} display={ordo.hauteur ?? "—"}
                input={<Inp value={ordo.hauteur ?? ""} onChange={v => updOrdo("hauteur", v)} placeholder="20 mm" style={{ width: 72 }} />}
              />
            </div>

            {/* Tableau corrections */}
            <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid rgba(226,232,240,0.8)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "rgba(248,250,252,0.9)" }}>
                  <tr>
                    <th style={{ width: 48, padding: "8px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}></th>
                    {(["Sph", "Cyl", "Axe", ...(hasAdd ? ["Add"] : []), ...(hasEP ? ["EP"] : [])]).map(h => (
                      <th key={h} style={{ padding: "8px 16px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(["od", "og"] as const).map(eye => {
                    const rx = ordo[eye];
                    return (
                      <tr key={eye} style={{ borderTop: "1px solid rgba(241,245,249,1)" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 800, fontSize: 13, color: ACCENT, textTransform: "uppercase" }}>{eye}</td>
                        {(["sph", "cyl", "axe", ...(hasAdd ? ["add"] : []), ...(hasEP ? ["ep"] : [])] as (keyof Rx)[]).map(field => (
                          <td key={field} style={{ padding: "8px 10px", textAlign: "center" }}>
                            {editing
                              ? <Inp value={rx[field] ?? ""} onChange={v => updRx(eye, field, v)} style={{ textAlign: "center", width: 80 }} />
                              : <span style={{ fontSize: 15, fontWeight: field === "sph" || field === "cyl" ? 700 : 500, color: field === "ep" ? "#94a3b8" : "#1e293b" }}>{rx[field] ?? "—"}</span>
                            }
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {editing ? (
              <div style={{ marginTop: 8 }}>
                <textarea value={ordo.remarques ?? ""} onChange={e => updOrdo("remarques", e.target.value)}
                  rows={2} placeholder="Remarques…"
                  style={{ ...iBase, resize: "vertical", width: "100%", boxSizing: "border-box" }} />
              </div>
            ) : ordo.remarques && (
              <p style={{ marginTop: 8, fontSize: 11, color: "#64748b", fontStyle: "italic", borderLeft: `3px solid ${ACCENT}30`, paddingLeft: 10 }}>{ordo.remarques}</p>
            )}
          </Section>
        )}

        {/* ÉQUIPEMENT */}
        <Section title="Équipement" right={dossier.devisId && <span style={{ fontSize: 10, fontFamily: "monospace", color: "#94a3b8" }}>{dossier.devisId}</span>} noPad>
          {/* Header colonnes */}
          <div style={{ display: "grid", gridTemplateColumns: editing ? "88px minmax(0,1fr) 95px 58px 72px 72px 58px 28px" : "88px minmax(0,1fr) 130px 58px 78px 78px 58px", gap: "0 6px", padding: "6px 12px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", background: "rgba(248,250,252,0.9)", borderBottom: "1px solid rgba(226,232,240,0.8)" }}>
            <span>Catégorie</span>
            <span>Désignation</span>
            {editing ? <><span>Marque</span></> : <span>Marque · Réf.</span>}
            <span style={{ textAlign: "center" }}>Qté</span>
            <span style={{ textAlign: "right" }}>P.U.</span>
            <span style={{ textAlign: "right" }}>Total</span>
            <span style={{ textAlign: "center" }}>Cl.</span>
            {editing && <span />}
          </div>

          <div style={{ overflowX: "auto" }}>
            {dossier.lignes.map((l, idx) => {
              const cat = CAT_OPTS.find(c => c.v === l.categorie);
              return (
                <div key={l.id} style={{ display: "grid", gridTemplateColumns: editing ? "88px minmax(0,1fr) 95px 58px 72px 72px 58px 28px" : "88px minmax(0,1fr) 130px 58px 78px 78px 58px", gap: "0 6px", padding: "8px 12px", borderTop: idx > 0 ? "1px solid rgba(241,245,249,1)" : "none", alignItems: "center", background: "var(--glass-strong-bg)" }}>
                  {editing ? (
                    <select value={l.categorie} onChange={e => updLigne(l.id, { categorie: e.target.value as LigneEquipement["categorie"] })}
                      style={{ ...iBase, fontSize: 10, padding: "3px 5px" }}>
                      {CAT_OPTS.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
                    </select>
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 5, background: `${cat?.color ?? "#94a3b8"}15`, color: cat?.color ?? "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                      {cat?.l ?? l.categorie}
                    </span>
                  )}
                  {editing
                    ? <Inp value={l.designation} onChange={v => updLigne(l.id, { designation: v })} />
                    : <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{l.designation}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{[l.marque, l.reference].filter(Boolean).join(" · ")}</div>
                      </div>
                  }
                  {editing
                    ? <Inp value={l.marque ?? ""} onChange={v => updLigne(l.id, { marque: v })} placeholder="Marque" />
                    : <span style={{ fontSize: 11, color: "#94a3b8" }}>{[l.marque, l.reference].filter(Boolean).join(" · ") || "—"}</span>
                  }
                  {editing
                    ? <Inp type="number" value={l.qte} onChange={v => updLigne(l.id, { qte: Number(v) })} style={{ textAlign: "center" }} />
                    : <span style={{ textAlign: "center", fontSize: 12, color: "#64748b", display: "block" }}>{l.qte}</span>
                  }
                  {editing
                    ? <Inp type="number" value={l.prixUnitaire} onChange={v => updLigne(l.id, { prixUnitaire: Number(v) })} style={{ textAlign: "right" }} />
                    : <span style={{ textAlign: "right", fontSize: 12, color: "#64748b", display: "block" }}>{eur(l.prixUnitaire)}</span>
                  }
                  <span style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: "#1e293b", display: "block" }}>{eur(l.total)}</span>
                  {editing ? (
                    <select value={l.classe ?? ""} onChange={e => updLigne(l.id, { classe: (e.target.value as "A" | "B") || undefined })}
                      style={{ ...iBase, fontSize: 10, padding: "3px 4px" }}>
                      <option value="">—</option><option value="A">A</option><option value="B">B</option>
                    </select>
                  ) : (
                    l.classe
                      ? <span style={{ textAlign: "center", fontSize: 10, fontWeight: 700, padding: "2px 5px", borderRadius: 5, background: l.classe === "A" ? "rgba(0,201,138,0.12)" : "rgba(99,102,241,0.10)", color: l.classe === "A" ? "#059669" : "#6366f1", display: "block" }}>Cl.{l.classe}</span>
                      : <span />
                  )}
                  {editing && (
                    <button onClick={() => removeLigne(l.id)}
                      style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: "rgba(239,68,68,0.10)", color: "#ef4444", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                  )}
                </div>
              );
            })}
            {editing && (
              <div style={{ padding: "8px 12px", borderTop: "1px solid rgba(241,245,249,1)", background: "rgba(248,250,252,0.5)" }}>
                <button onClick={addLigne}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, border: `1px dashed ${ACCENT}44`, background: `${ACCENT}06`, color: ACCENT, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  + Ajouter une ligne
                </button>
              </div>
            )}
          </div>

          {/* Totaux */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 20, padding: "10px 12px", borderTop: "1px solid rgba(226,232,240,0.8)", background: "rgba(248,250,252,0.5)" }}>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>HT <strong style={{ color: "#475569" }}>{eur(dossier.totalHT)}</strong></span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>TVA <strong style={{ color: "#475569" }}>{eur(dossier.totalTTC - dossier.totalHT)}</strong></span>
            <span style={{ fontSize: 16, fontWeight: 800, color: ACCENT }}>TTC {eur(dossier.totalTTC)}</span>
          </div>
        </Section>
      </div>

      {/* ── COLONNE DROITE : financier ─────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        {/* PRISE EN CHARGE */}
        <Section title="Prise en charge & Financement">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            {/* SS */}
            {dossier.pecSecu && (
              <div style={{ borderRadius: 9, padding: "10px 12px", background: "rgba(248,250,252,0.9)", border: "1px solid rgba(226,232,240,0.8)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Sécurité Sociale</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#64748b" }}>Base rembst.</span>
                    {editing ? <Inp type="number" value={dossier.pecSecu.baseRemboursement} onChange={v => updPECSecu({ baseRemboursement: Number(v) })} style={{ width: 70, textAlign: "right" }} /> : <strong>{eur(dossier.pecSecu.baseRemboursement)}</strong>}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#64748b" }}>Taux SS</span>
                    {editing ? <div style={{ display: "flex", alignItems: "center", gap: 4 }}><Inp type="number" value={dossier.pecSecu.tauxSS} onChange={v => updPECSecu({ tauxSS: Number(v) })} style={{ width: 50, textAlign: "right" }} /><span style={{ fontSize: 11, color: "#64748b" }}>%</span></div> : <strong>{dossier.pecSecu.tauxSS} %</strong>}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(226,232,240,0.8)", paddingTop: 5 }}>
                    <span style={{ fontWeight: 600, color: "#374151" }}>Part SS</span>
                    {editing ? <Inp type="number" value={dossier.pecSecu.montantSS} onChange={v => updPECSecu({ montantSS: Number(v) })} style={{ width: 70, textAlign: "right" }} /> : <strong style={{ color: "#15803d" }}>−{eur(dossier.pecSecu.montantSS)}</strong>}
                  </div>
                </div>
              </div>
            )}

            {/* Mutuelle */}
            {dossier.pecMutuelle && (
              <div style={{ borderRadius: 9, padding: "10px 12px", background: "rgba(248,250,252,0.9)", border: "1px solid rgba(226,232,240,0.8)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Mutuelle</div>
                  {dossier.pecMutuelle.reseauAdherent && <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 5, background: "rgba(21,128,61,0.10)", color: "#15803d" }}>Réseau ✓</span>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#64748b" }}>Mutuelle</span>
                    {editing ? <Inp value={dossier.pecMutuelle.nom} onChange={v => updPEC({ nom: v })} style={{ width: 110 }} /> : <strong>{dossier.pecMutuelle.nom}</strong>}
                  </div>
                  {(editing || dossier.pecMutuelle.contrat) && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#64748b" }}>Contrat</span>
                      {editing ? <Inp value={dossier.pecMutuelle.contrat ?? ""} onChange={v => updPEC({ contrat: v })} style={{ width: 130 }} /> : <span style={{ fontSize: 11, color: "#64748b" }}>{dossier.pecMutuelle.contrat}</span>}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#64748b" }}>Garantie</span>
                    {editing ? <Inp value={dossier.pecMutuelle.garantieOptique} onChange={v => updPEC({ garantieOptique: v })} style={{ width: 130 }} /> : <span style={{ fontSize: 11, color: "#64748b", textAlign: "right" }}>{dossier.pecMutuelle.garantieOptique}</span>}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(226,232,240,0.8)", paddingTop: 5, gap: 8 }}>
                    <span style={{ fontWeight: 600, color: "#374151" }}>Part mutuelle</span>
                    {editing ? <Inp type="number" value={dossier.pecMutuelle.montant} onChange={v => updPEC({ montant: Number(v) })} style={{ width: 70, textAlign: "right" }} /> : <strong style={{ color: "#15803d" }}>−{eur(dossier.pecMutuelle.montant)}</strong>}
                  </div>
                </div>
              </div>
            )}

            {/* RAC */}
            <div style={{ borderRadius: 9, padding: "10px 14px", background: `${ACCENT}06`, border: `1.5px solid ${ACCENT}20` }}>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>Reste à charge patient</div>
              {dossier.modeFinancement && !editing && <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Mode : <strong style={{ color: "#475569" }}>{dossier.modeFinancement}</strong></div>}
              {editing && <Inp value={dossier.modeFinancement ?? ""} onChange={v => setDossier(d => ({ ...d, modeFinancement: v }))} placeholder="Mode de règlement" style={{ marginBottom: 6 }} />}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#64748b" }}>TTC {eur(dossier.totalTTC)} − PEC {eur(totalPEC)}</span>
                {editing
                  ? <Inp type="number" value={dossier.rac ?? rac} onChange={v => setDossier(d => ({ ...d, rac: Number(v) }))} style={{ fontSize: 16, fontWeight: 800, width: 100, textAlign: "right", color: ACCENT }} />
                  : <span style={{ fontSize: 20, fontWeight: 900, color: ACCENT }}>{eur(rac)}</span>
                }
              </div>
            </div>
          </div>
        </Section>

        {/* LIVRAISON */}
        {dossier.livraison && (
          <Section title="Livraison">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", fontSize: 12 }}>
              <InfoField label="Date" editing={editing}
                display={dossier.livraison.date}
                input={<Inp value={dossier.livraison.date} onChange={v => setDossier(d => d.livraison ? { ...d, livraison: { ...d.livraison, date: v } } : d)} />}
              />
              <InfoField label="Monteur" editing={editing}
                display={dossier.livraison.monteurOpticien ?? "—"}
                input={<Inp value={dossier.livraison.monteurOpticien ?? ""} onChange={v => setDossier(d => d.livraison ? { ...d, livraison: { ...d.livraison, monteurOpticien: v } } : d)} />}
              />
              <InfoField label="Bon signé" editing={editing}
                display={<span style={{ color: dossier.livraison.signe ? "#15803d" : "#f59e0b", fontWeight: 700 }}>{dossier.livraison.signe ? "✓ Oui" : "En attente"}</span>}
                input={<button onClick={() => setDossier(d => d.livraison ? { ...d, livraison: { ...d.livraison, signe: !d.livraison.signe } } : d)}
                  style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", background: dossier.livraison.signe ? "rgba(21,128,61,0.12)" : "rgba(241,245,249,0.9)", color: dossier.livraison.signe ? "#15803d" : "#64748b" }}>
                  {dossier.livraison.signe ? "✓ Signé" : "Non signé"}
                </button>}
              />
              {(editing || dossier.livraison.commentaire) && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <InfoField label="Commentaire" editing={editing}
                    display={<span style={{ fontStyle: "italic", color: "#64748b" }}>{dossier.livraison.commentaire}</span>}
                    input={<Inp value={dossier.livraison.commentaire ?? ""} onChange={v => setDossier(d => d.livraison ? { ...d, livraison: { ...d.livraison, commentaire: v } } : d)} />}
                  />
                </div>
              )}
            </div>
          </Section>
        )}

        {/* GARANTIES */}
        {dossier.garanties && dossier.garanties.length > 0 && (
          <Section title="Garanties">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {dossier.garanties.map((g, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: "rgba(248,250,252,0.9)", border: "1px solid rgba(226,232,240,0.8)" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#1e293b" }}>{g.produit}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>Fab. {g.garantieFab} · Mag. {g.garantieMag}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, whiteSpace: "nowrap", background: g.statut === "Valide" ? "rgba(21,128,61,0.10)" : "rgba(239,68,68,0.10)", color: g.statut === "Valide" ? "#15803d" : "#ef4444" }}>
                    {g.statut}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* NOTES */}
        <Section title="Notes internes">
          <textarea value={dossier.notes ?? ""} onChange={e => setDossier(d => ({ ...d, notes: e.target.value }))}
            rows={3} placeholder="Notes internes…"
            style={{ ...iBase, width: "100%", resize: "vertical", boxSizing: "border-box", fontSize: 12 }} />
        </Section>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TIERS PAYANT
═══════════════════════════════════════════════════════════════════════════ */
type RegimeSS = "RG" | "MSA" | "RSI" | "MFPS" | "SLM" | "CMUC" | "AME";
type ModeLecture = "sesam-vitale" | "vitale-degr" | "noemie" | "manuel";
type ExoType = "60" | "100-ALD" | "100-MAT" | "100-AT" | "CMUC" | "AME" | "autre";

const REGIME_LABELS: Record<RegimeSS, string> = {
  RG: "Régime Général (CPAM)", MSA: "MSA (Agriculture)", RSI: "SSI (Ex-RSI)",
  MFPS: "MFPS (Fonctionnaires)", SLM: "Section Locale Mutualiste", CMUC: "CSS / CMU-C", AME: "AME",
};
const EXO_LABELS: Record<ExoType, { label: string; taux: string; color: string }> = {
  "60":      { label: "Droit commun",                 taux: "60 %",  color: "#64748b" },
  "100-ALD": { label: "ALD (Affection Longue Durée)", taux: "100 %", color: "#15803d" },
  "100-MAT": { label: "Maternité > 6 mois",           taux: "100 %", color: "#15803d" },
  "100-AT":  { label: "Accident du travail",           taux: "100 %", color: "#15803d" },
  "CMUC":    { label: "CSS / CMU-C",                  taux: "100 %", color: "#6366f1" },
  "AME":     { label: "AME",                          taux: "100 %", color: "#F59E0B" },
  "autre":   { label: "Autre exonération",             taux: "—",     color: "#94a3b8" },
};

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button onClick={() => !disabled && onChange(!checked)} disabled={disabled}
      style={{ flexShrink: 0, width: 40, height: 22, borderRadius: 11, border: "none", cursor: disabled ? "default" : "pointer", position: "relative", transition: "background 0.2s", background: checked ? "#15803d" : disabled ? "#e2e8f0" : "#cbd5e1", opacity: disabled ? 0.5 : 1 }}>
      <span style={{ position: "absolute", top: 2, left: checked ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
    </button>
  );
}

function TabTiersPayant({ dossier }: { dossier: FullDossier }) {
  const [regime, setRegime]           = useState<RegimeSS>("RG");
  const [modeLecture, setModeLecture] = useState<ModeLecture>("sesam-vitale");
  const [exo, setExo]                 = useState<ExoType>("60");
  const [tpSecu, setTpSecu]           = useState(false);
  const [tpMutuelle, setTpMutuelle]   = useState(dossier.pecMutuelle?.reseauAdherent ?? false);
  const [droits, setDroits]           = useState<"idle" | "loading" | "ok">("idle");
  const [noemie, setNoemie]           = useState<"idle" | "loading" | "ok">("idle");
  const [nir, setNir]                 = useState("2 85 04 75 014 001 52");
  const [codeRenouv, setCodeRenouv]   = useState<"I" | "A">("I");

  const exoMeta = EXO_LABELS[exo];
  const taux    = TAUX_EXO[exo] ?? 60;

  // Calcul remboursement SS par ligne
  const lignesRemb = dossier.lignes.map(l => {
    const base = lpprBase(l);
    const remb = Math.round(base * (taux / 100) * 100) / 100;
    return { ...l, base, remb };
  });
  const totalBaseCalc  = Math.round(lignesRemb.reduce((s, l) => s + l.base, 0) * 100) / 100;
  const totalRembCalc  = Math.round(lignesRemb.reduce((s, l) => s + l.remb, 0) * 100) / 100;
  const montantMutuelle = tpMutuelle && dossier.pecMutuelle ? dossier.pecMutuelle.montant : 0;
  const totalPEC        = (tpSecu ? totalRembCalc : 0) + montantMutuelle;
  const racCalc         = dossier.totalTTC - totalPEC;

  const CAT_LABELS: Record<string, string> = { monture: "Monture", "verre-od": "Verre OD", "verre-og": "Verre OG", lentilles: "Lentilles", accessoire: "Accessoire", prestation: "Prestation" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── 1. VÉRIFICATION DROITS ──────────────────────────────────────── */}
      <Section title="1 — Vérification des droits Assurance Maladie">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Mode lecture */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Mode de lecture</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {([["sesam-vitale", "Sesam-Vitale"], ["vitale-degr", "Saisie dégradée"], ["noemie", "Flux NOEMIE"], ["manuel", "Manuel"]] as [ModeLecture, string][]).map(([k, l]) => (
                <button key={k} onClick={() => setModeLecture(k)}
                  style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: modeLecture === k ? `linear-gradient(135deg,${ACCENT},${ACCENT_D})` : "rgba(241,245,249,0.9)", color: modeLecture === k ? "white" : "#475569" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* NIR + Régime + Vérifier */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>N° Sécurité Sociale (NIR)</div>
              <input value={nir} onChange={e => setNir(e.target.value)} placeholder="X XX XX XX XXX XXX XX"
                style={{ ...iBase, fontFamily: "monospace", letterSpacing: "0.08em", fontSize: 13, padding: "7px 10px" }} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Régime d'assurance maladie</div>
              <select value={regime} onChange={e => setRegime(e.target.value as RegimeSS)} style={{ ...iBase, padding: "7px 10px" }}>
                {Object.entries(REGIME_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <button onClick={() => { setDroits("loading"); setTimeout(() => setDroits("ok"), 1800); }} disabled={droits === "loading"}
              style={{ padding: "9px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "white", border: "none", cursor: droits === "loading" ? "default" : "pointer", flexShrink: 0, background: droits === "loading" ? "#94a3b8" : droits === "ok" ? "#15803d" : `linear-gradient(135deg,${ACCENT},${ACCENT_D})` }}>
              {droits === "loading" ? "Vérification…" : droits === "ok" ? "✓ Droits ouverts" : "Vérifier les droits"}
            </button>
          </div>

          {/* Résultat droits */}
          {droits === "ok" && (
            <div style={{ borderRadius: 12, padding: "12px 16px", background: "rgba(21,128,61,0.06)", border: "1.5px solid rgba(21,128,61,0.20)" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginBottom: 10 }}>
                {[
                  ["Statut", "✓ Droits ouverts", "#15803d"],
                  ["Régime", REGIME_LABELS[regime], "#1e293b"],
                  ["Médecin traitant", "✓ Déclaré", "#15803d"],
                  ["CSS / C2S", "Non bénéficiaire", "#94a3b8"],
                  ["AME", "Non", "#94a3b8"],
                ].map(([l, v, c]) => (
                  <div key={l}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>{l}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: c }}>{v}</div>
                  </div>
                ))}
              </div>
              {/* Délai de carence */}
              <div style={{ borderTop: "1px solid rgba(21,128,61,0.15)", paddingTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}></span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>Délai de carence : <span style={{ color: "#15803d" }}>✓ Renouvellement autorisé</span></div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>Dernier équipement remboursé : &gt; 2 ans · Adulte ≥ 16 ans — délai minimal 2 ans (art. R.165-1 CSS)</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ── 2. REMBOURSEMENT SS PAR PRODUIT ─────────────────────────────── */}
      <Section title="2 — Remboursement Sécurité Sociale par produit" noPad>
        {/* Exonération selector */}
        <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(226,232,240,0.8)", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginRight: 4 }}>Exonération :</span>
          {(Object.entries(EXO_LABELS) as [ExoType, typeof EXO_LABELS[ExoType]][]).map(([k, v]) => (
            <button key={k} onClick={() => setExo(k)}
              style={{ padding: "4px 11px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", background: exo === k ? `${v.color}18` : "rgba(241,245,249,0.9)", color: exo === k ? v.color : "#64748b", outline: exo === k ? `1.5px solid ${v.color}40` : "none" }}>
              {v.label} <span style={{ opacity: 0.65 }}>({v.taux})</span>
            </button>
          ))}
        </div>
        {/* Table produits */}
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 80px 70px 80px", gap: "0 8px", padding: "6px 14px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", background: "rgba(248,250,252,0.7)" }}>
            <span>Produit</span>
            <span style={{ textAlign: "right" }}>Prix vente</span>
            <span style={{ textAlign: "center" }}>Base LPPR</span>
            <span style={{ textAlign: "center" }}>Taux</span>
            <span style={{ textAlign: "right" }}>Part SS</span>
          </div>
          {lignesRemb.map((l, i) => (
            <div key={l.id} style={{ display: "grid", gridTemplateColumns: "1fr 90px 80px 70px 80px", gap: "0 8px", padding: "8px 14px", borderTop: "1px solid rgba(241,245,249,1)", background: "var(--glass-strong-bg)", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{l.designation}</div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1, display: "flex", gap: 6 }}>
                  <span>{CAT_LABELS[l.categorie] ?? l.categorie}</span>
                  {l.classe && (
                    <span style={{ padding: "0px 5px", borderRadius: 4, background: l.classe === "A" ? "rgba(0,201,138,0.12)" : "rgba(99,102,241,0.10)", color: l.classe === "A" ? "#059669" : "#6366f1", fontWeight: 700 }}>Cl.{l.classe}</span>
                  )}
                  {l.classe === "A" && <span style={{ color: "#059669", fontWeight: 600 }}>100% Santé</span>}
                </div>
              </div>
              <span style={{ textAlign: "right", fontSize: 12, color: "#64748b" }}>{eur(l.prixUnitaire)}</span>
              <span style={{ textAlign: "center", fontSize: 12, color: l.classe === "B" || !l.classe ? "#94a3b8" : "#1e293b", fontFamily: "monospace" }}>
                {eur(l.base)}
                {(!l.classe || l.classe === "B") && <span style={{ fontSize: 9, color: "#cbd5e1", display: "block" }}>symbolique</span>}
              </span>
              <span style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: exoMeta.color }}>{taux} %</span>
              <span style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: l.remb < 0.10 ? "#94a3b8" : "#15803d" }}>{eur(l.remb)}</span>
            </div>
          ))}
          {/* Total SS */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 80px 70px 80px", gap: "0 8px", padding: "10px 14px", borderTop: "2px solid rgba(226,232,240,0.9)", background: "rgba(248,250,252,0.8)", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Total part Sécurité Sociale</span>
            <span style={{ textAlign: "right", fontSize: 12, color: "#94a3b8" }}>{eur(dossier.totalTTC)}</span>
            <span style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", fontFamily: "monospace" }}>{eur(totalBaseCalc)}</span>
            <span style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: exoMeta.color }}>{taux} %</span>
            <span style={{ textAlign: "right", fontSize: 14, fontWeight: 800, color: totalRembCalc < 1 ? "#94a3b8" : "#15803d" }}>{eur(totalRembCalc)}</span>
          </div>
          {/* Note Classe B */}
          {dossier.lignes.every(l => !l.classe || l.classe === "B") && (
            <div style={{ padding: "8px 14px", background: "rgba(245,158,11,0.05)", borderTop: "1px solid rgba(245,158,11,0.2)" }}>
              <p style={{ fontSize: 10, color: "#b45309", margin: 0 }}>
                <strong>Équipement 100 % Classe B (libre tarifaire)</strong> — La part SS est symbolique (LPPR Titre II, bases non revalorisées).
                La prise en charge réelle provient de la mutuelle. Proposer un équipement Classe A pour un RAC nul (100 % Santé, arrêté du 11/07/2019).
              </p>
            </div>
          )}
        </div>
      </Section>

      {/* ── 3. ACTIVATION TIERS PAYANT ──────────────────────────────────── */}
      <Section title="3 — Activation du tiers payant">
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
          {[
            {
              label: "Tiers payant Sécu",
              sub: "Part SS avancée — remboursement en J+5 via NOEMIE",
              active: tpSecu, setActive: setTpSecu, disabled: false,
              montantTxt: `Part SS : ${eur(totalRembCalc)} (${taux} % de ${eur(totalBaseCalc)})`,
              note: totalRembCalc < 0.10 ? "Base symbolique Classe B — TP sécu non obligatoire" : undefined,
            },
            {
              label: "Tiers payant Mutuelle",
              sub: dossier.pecMutuelle ? `${dossier.pecMutuelle.nom}${dossier.pecMutuelle.reseauAdherent ? " · Réseau ✓" : ""}` : "Aucune mutuelle renseignée",
              active: tpMutuelle, setActive: setTpMutuelle, disabled: !dossier.pecMutuelle,
              montantTxt: dossier.pecMutuelle ? `Part mut. : ${eur(dossier.pecMutuelle.montant)} · ${dossier.pecMutuelle.garantieOptique}` : "",
              note: dossier.pecMutuelle?.reseauAdherent ? "Opticien en réseau — délai de paiement sous 48h" : undefined,
            },
          ].map(({ label, sub, active, setActive, disabled, montantTxt, note }) => (
            <div key={label} style={{ borderRadius: 10, padding: "12px 14px", background: active ? "rgba(21,128,61,0.06)" : "rgba(241,245,249,0.8)", border: `1.5px solid ${active ? "rgba(21,128,61,0.25)" : "rgba(226,232,240,0.8)"}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{label}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{sub}</div>
                {active && <div style={{ fontSize: 11, fontWeight: 700, color: "#15803d", marginTop: 5 }}>{montantTxt}</div>}
                {note && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3, fontStyle: "italic" }}>{note}</div>}
              </div>
              <Toggle checked={active} onChange={setActive} disabled={disabled} />
            </div>
          ))}
        </div>

        {/* Récapitulatif financier TP */}
        {(tpSecu || tpMutuelle) && (
          <div style={{ marginTop: 12, borderRadius: 10, padding: "12px 16px", background: `${ACCENT}06`, border: `1.5px solid ${ACCENT}20` }}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8, fontSize: 12, color: "#64748b" }}>
              <span>TTC : <strong style={{ color: "#1e293b" }}>{eur(dossier.totalTTC)}</strong></span>
              {tpSecu && <span style={{ color: "#15803d" }}>− Part SS : <strong>{eur(totalRembCalc)}</strong></span>}
              {tpMutuelle && dossier.pecMutuelle && <span style={{ color: "#15803d" }}>− Part mutuelle : <strong>{eur(dossier.pecMutuelle.montant)}</strong></span>}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Reste à charge patient</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: ACCENT }}>{eur(Math.max(0, racCalc))}</span>
            </div>
          </div>
        )}
      </Section>

      {/* ── 4. FSE / NOEMIE ─────────────────────────────────────────────── */}
      {tpSecu && (
        <Section title="4 — Feuille de soins électronique (FSE / SESAM-Vitale)">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Données FSE */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px 16px" }}>
              {[
                { label: "NIR assuré", val: nir || "—" },
                { label: "RPPS prescripteur", val: dossier.ordonnance?.rpps ?? "—" },
                { label: "Date d'ordonnance", val: dossier.ordonnance ? new Date(dossier.ordonnance.dateOrdonnance).toLocaleDateString("fr-FR") : "—" },
                { label: "Date de délivrance", val: new Date().toLocaleDateString("fr-FR") },
                { label: "Code exonération TM", val: exo === "60" ? "0 — Droit commun" : exo === "100-ALD" ? "3 — ALD" : exo === "100-MAT" ? "5 — Maternité" : exo === "100-AT" ? "7 — AT/MP" : exo === "CMUC" ? "9 — CSS/C2S" : "—" },
                { label: "Type renouvellement", val: codeRenouv === "I" ? "I — Identique" : "A — Adapté (opticien)" },
              ].map(({ label, val }) => (
                <div key={label}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", fontFamily: label.includes("NIR") || label.includes("RPPS") || label.includes("Code") ? "monospace" : "inherit" }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Type renouvellement */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Renouvellement</div>
              <div style={{ display: "flex", gap: 7 }}>
                {([["I", "I — Identique (sans adaptation)", "#64748b"], ["A", "A — Adapté par l'opticien (décret 27/06/2024)", "#6366f1"]] as const).map(([k, l, c]) => (
                  <button key={k} onClick={() => setCodeRenouv(k)}
                    style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: codeRenouv === k ? `${c}15` : "rgba(241,245,249,0.9)", color: codeRenouv === k ? c : "#64748b", outline: codeRenouv === k ? `1.5px solid ${c}40` : "none" }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Codes LPP par produit */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Codes LPP pour chaque produit</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {dossier.lignes.map(l => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", borderRadius: 8, background: "rgba(248,250,252,0.9)", border: "1px solid rgba(226,232,240,0.8)" }}>
                    <span style={{ fontSize: 12, color: "#374151" }}>{l.designation}</span>
                    <span style={{ fontSize: 11, fontFamily: "monospace", color: "#6366f1", fontWeight: 700, background: "rgba(99,102,241,0.08)", padding: "2px 8px", borderRadius: 5 }}>
                      {l.categorie === "monture" ? "2185579" : l.categorie === "verre-od" ? "2285571" : l.categorie === "verre-og" ? "2285572" : l.categorie === "lentilles" ? "2360553" : "3401560"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Télétransmission */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(248,250,252,0.8)", border: "1px solid rgba(226,232,240,0.8)" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Télétransmission NOEMIE (flux 580)</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Envoi FSE en temps réel — remboursement SS sous 5 jours ouvrés</div>
              </div>
              <button onClick={() => { setNoemie("loading"); setTimeout(() => setNoemie("ok"), 2000); }} disabled={noemie !== "idle"}
                style={{ padding: "9px 20px", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "white", border: "none", cursor: noemie !== "idle" ? "default" : "pointer", background: noemie === "ok" ? "#15803d" : noemie === "loading" ? "#94a3b8" : `linear-gradient(135deg,${ACCENT},${ACCENT_D})` }}>
                {noemie === "ok" ? "✓ FSE transmise" : noemie === "loading" ? "Envoi en cours…" : "Transmettre la FSE"}
              </button>
            </div>
            {noemie === "ok" && (
              <div style={{ borderRadius: 10, padding: "10px 14px", background: "rgba(21,128,61,0.06)", border: "1px solid rgba(21,128,61,0.25)", fontSize: 12, color: "#15803d" }}>
                ✓ <strong>FSE transmise</strong> — N° lot : FSE-{new Date().getFullYear()}-{String(Math.floor(Math.random() * 9000 + 1000))} · Remboursement SS attendu sous 5 jours ouvrés ({eur(totalRembCalc)})
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Note légale */}
      <div style={{ borderRadius: 10, padding: "10px 14px", background: "rgba(248,250,252,0.8)", border: "1px solid rgba(226,232,240,0.8)", fontSize: 11, color: "#64748b", lineHeight: 1.7 }}>
        <strong style={{ color: "#374151" }}>Références légales :</strong>{" "}
        TP obligatoire : ALD, maternité (&gt; 6 mois), CSS/CMU-C, AME (art. L.162-45 CSS) ·
        Bases LPPR Cl. B symboliques — Cl. A (100 % Santé) : RAC nul garanti (arrêté 11/07/2019) ·
        Délai carence adulte ≥16 ans : 2 ans (art. R.165-1 CSS), 1 an enfant &lt;16 ans ·
        Lentilles : forfait annuel 39,48 €/œil remb. à 60 % soit 23,69 €/œil/an ·
        Renouvellement adapté par opticien autorisé (décret n°2024-617 du 27/06/2024)
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOCUMENTS
═══════════════════════════════════════════════════════════════════════════ */
const DOC_TYPES_OPT = [
  { id: "ordonnance",   label: "Ordonnance",          icon: "" },
  { id: "mutuelle",     label: "Attestation mutuelle", icon: "" },
  { id: "carte-vitale", label: "Carte vitale",         icon: "🪪" },
  { id: "facture",      label: "Facture / Devis",      icon: "" },
  { id: "livraison",    label: "Bon de livraison",     icon: "" },
  { id: "autre",        label: "Autre document",       icon: "" },
] as const;

interface DocItem { nom: string; type: string; date: string; icon: string }
interface DropModal {
  file: File; type: string; scanning: boolean;
  extracted: Record<string, string>;
  proposedName: string; // nom suggéré automatiquement (sans .pdf)
  editedName: string;   // nom modifiable par l'utilisateur
}

function TabDocuments({ dossier, setDossier }: {
  dossier: FullDossier;
  setDossier: React.Dispatch<React.SetStateAction<FullDossier>>;
}) {
  const [docs, setDocs]           = useState<DocItem[]>(dossier.documents ?? []);
  const [dragOver, setDragOver]   = useState(false);
  const [dropModal, setDropModal] = useState<DropModal | null>(null);
  const [toast, setToast]         = useState<string | null>(null);

  function handleFile(file: File) {
    setDropModal({ file, type: "", scanning: false, extracted: {}, proposedName: "", editedName: "" });
  }
  function handleTypeSelect(type: string) {
    setDropModal(m => m ? { ...m, type, scanning: true } : m);
    setTimeout(() => {
      const ex: Record<string, string> = {};
      if (type === "ordonnance") Object.assign(ex, { "Prescripteur": "Dr. Sophie Aubert", "RPPS": "10004587412", "Date": "20/01/2026", "OD Sph": "−2,25", "OD Cyl": "−0,50", "OD Axe": "170°", "OG Sph": "−1,75", "OG Cyl": "−0,25", "OG Axe": "10°", "EP": "64 mm" });
      else if (type === "mutuelle") Object.assign(ex, { "Mutuelle": "MGEN", "N° adhérent": "0000123456-T", "Contrat": "MGEN Santé Confort", "Réseau": "Carte Blanche / Itelis" });
      else if (type === "carte-vitale") Object.assign(ex, { "N° Sécu": "2 85 04 75 014 001 52", "Bénéficiaire": "LEBLANC Marie", "Date naissance": "05/04/1985" });
      const proposed = proposeDocName(type, ex, dossier.patientNom);
      setDropModal(m => m ? { ...m, scanning: false, extracted: ex, proposedName: proposed, editedName: proposed } : m);
    }, 1500);
  }
  function applyOCR(type: string, extracted: Record<string, string>) {
    if (type === "ordonnance" && Object.keys(extracted).length > 0) {
      setDossier(d => {
        if (!d.ordonnance) return d;
        const [dd, mm, yyyy] = (extracted["Date"] ?? "").split("/");
        const iso = dd && mm && yyyy ? `${yyyy}-${mm}-${dd}` : d.ordonnance.dateOrdonnance;
        return {
          ...d,
          ordonnance: {
            ...d.ordonnance,
            prescripteur:    extracted["Prescripteur"]  ?? d.ordonnance.prescripteur,
            rpps:            extracted["RPPS"]           ?? d.ordonnance.rpps,
            dateOrdonnance:  iso,
            ecartPupillaire: extracted["EP"]             ?? d.ordonnance.ecartPupillaire,
            od: { ...d.ordonnance.od, sph: extracted["OD Sph"] ?? d.ordonnance.od.sph, cyl: extracted["OD Cyl"] ?? d.ordonnance.od.cyl, axe: extracted["OD Axe"] ?? d.ordonnance.od.axe },
            og: { ...d.ordonnance.og, sph: extracted["OG Sph"] ?? d.ordonnance.og.sph, cyl: extracted["OG Cyl"] ?? d.ordonnance.og.cyl, axe: extracted["OG Axe"] ?? d.ordonnance.og.axe },
          },
        };
      });
    } else if (type === "mutuelle" && Object.keys(extracted).length > 0) {
      setDossier(d => d.pecMutuelle ? {
        ...d,
        pecMutuelle: {
          ...d.pecMutuelle,
          nom:     extracted["Mutuelle"] ?? d.pecMutuelle.nom,
          contrat: extracted["Contrat"]  ?? d.pecMutuelle.contrat,
        },
      } : d);
    }
  }

  function handleSave() {
    if (!dropModal) return;
    const meta    = DOC_TYPES_OPT.find(d => d.id === dropModal.type);
    const finalNom = (dropModal.editedName.trim() || dropModal.proposedName).replace(/\.pdf$/i, "");
    setDocs(prev => [...prev, {
      nom: finalNom + ".pdf",
      type: dropModal.type || "autre",
      date: new Date().toLocaleDateString("fr-FR"),
      icon: meta?.icon ?? "",
    }]);
    // Auto-remplir le dossier depuis l'OCR
    if (Object.keys(dropModal.extracted).length > 0) {
      applyOCR(dropModal.type, dropModal.extracted);
      setToast("✓ Document ajouté — corrections et données mises à jour dans le dossier.");
    } else {
      setToast("✓ Document ajouté.");
    }
    setDropModal(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {toast && <div style={{ borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 600, background: "rgba(21,128,61,0.10)", border: "1px solid rgba(21,128,61,0.25)", color: "#15803d" }}>✓ {toast}</div>}
      {docs.length > 0 && (
        <Section title={`Documents (${docs.length})`}>
          {docs.map((doc, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 4px", borderBottom: i < docs.length - 1 ? "1px solid rgba(241,245,249,1)" : "none", cursor: "pointer" }}
              onClick={() => setToast(`Ouverture : ${doc.nom}`)}>
              <span style={{ fontSize: 20 }}>{doc.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{doc.nom}</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>{doc.date}</div>
              </div>
              <button onClick={e => { e.stopPropagation(); setToast(`Téléchargement : ${doc.nom}`); }}
                style={{ padding: "4px 9px", borderRadius: 6, fontSize: 11, fontWeight: 600, color: ACCENT, background: `${ACCENT}10`, border: "none", cursor: "pointer" }}>↓ PDF</button>
            </div>
          ))}
        </Section>
      )}
      <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => document.getElementById("opt-doc-in")?.click()}
        style={{ borderRadius: 14, padding: "36px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", transition: "all 0.2s", border: `2px dashed ${dragOver ? ACCENT : ACCENT + "44"}`, background: dragOver ? `${ACCENT}06` : "transparent" }}>
        <span style={{ fontSize: 32 }}></span>
        <p style={{ fontSize: 13, fontWeight: 700, color: ACCENT, margin: 0 }}>Glissez un document ici</p>
        <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>ou cliquez pour parcourir — OCR automatique</p>
        <input id="opt-doc-in" type="file" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
      {dropModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}>
          <div style={{ ...glass, borderRadius: 20, padding: 22, width: "100%", maxWidth: 420 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Type de document</span>
              <button onClick={() => setDropModal(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#94a3b8" }}>×</button>
            </div>
            <div style={{ borderRadius: 8, padding: "6px 10px", background: "rgba(241,245,249,0.9)", fontSize: 12, color: "#64748b", marginBottom: 12 }}>{dropModal.file.name}</div>
            {!dropModal.type && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                {DOC_TYPES_OPT.map(dt => (
                  <button key={dt.id} onClick={() => handleTypeSelect(dt.id)}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(226,232,240,0.8)", background: "rgba(248,250,252,0.9)", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ fontSize: 16 }}>{dt.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{dt.label}</span>
                  </button>
                ))}
              </div>
            )}
            {dropModal.type && dropModal.scanning && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 0" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", border: `3px solid ${ACCENT}`, borderTopColor: "transparent" }} className="spin" />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}} .spin{animation:spin .8s linear infinite}`}</style>
                <p style={{ fontSize: 12, color: "#64748b" }}>Analyse OCR…</p>
              </div>
            )}
            {dropModal.type && !dropModal.scanning && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Object.keys(dropModal.extracted).length > 0 && (
                  <>
                    <div style={{ fontSize: 12, color: "#15803d" }}>✓ Données extraites — vérifiez avant de valider</div>
                    <div style={{ borderRadius: 10, padding: "10px 12px", background: "rgba(241,245,249,0.9)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 14px" }}>
                      {Object.entries(dropModal.extracted).map(([k, v]) => (
                        <div key={k}><div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{k}</div><div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{v}</div></div>
                      ))}
                    </div>
                  </>
                )}

                {/* ── Nom du fichier ── */}
                <div style={{ borderRadius: 10, padding: "12px 14px", background: `${ACCENT}06`, border: `1px solid ${ACCENT}25` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                    Nom du fichier — modifiable
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      value={dropModal.editedName}
                      onChange={e => setDropModal(m => m ? { ...m, editedName: e.target.value } : m)}
                      style={{ ...iBase, flex: 1, fontFamily: "monospace", fontSize: 12, letterSpacing: "0.02em" }}
                    />
                    <span style={{ fontSize: 12, color: "#94a3b8", flexShrink: 0, fontFamily: "monospace" }}>.pdf</span>
                  </div>
                  {dropModal.editedName !== dropModal.proposedName && dropModal.proposedName && (
                    <button
                      onClick={() => setDropModal(m => m ? { ...m, editedName: m.proposedName } : m)}
                      style={{ marginTop: 5, fontSize: 10, color: ACCENT, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      ↺ Restaurer le nom suggéré ({dropModal.proposedName}.pdf)
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", gap: 7, justifyContent: "flex-end" }}>
                  <button onClick={() => setDropModal(null)} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#64748b", background: "rgba(241,245,249,0.9)", border: "none", cursor: "pointer" }}>Annuler</button>
                  <button onClick={handleSave} style={{ padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "white", border: "none", cursor: "pointer", background: `linear-gradient(135deg,${ACCENT},${ACCENT_D})` }}>
                    Enregistrer · {(dropModal.editedName.trim() || dropModal.proposedName)}.pdf
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function DossierVisitePage({ params }: { params: Promise<{ id: string; visiteId: string }> }) {
  const { id, visiteId } = use(params);
  const base = MOCK_DOSSIERS[visiteId];

  const [dossier, setDossier] = useState<FullDossier>(base ?? ({} as FullDossier));
  const [tab, setTab]         = useState<TabKey>("dossier");
  const [editing, setEditing] = useState(false);
  const [toast, setToast]     = useState<string | null>(null);
  const [emailModal, setEmailModal] = useState(false);
  const [emailSent, setEmailSent]   = useState(false);

  if (!base) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 12 }}>
        <span style={{ fontSize: 40 }}></span>
        <p style={{ color: "#94a3b8", fontSize: 14 }}>Dossier introuvable.</p>
        <Link href={`/clair-vision/pro/patients/${id}`} style={{ color: ACCENT, fontSize: 13, fontWeight: 600 }}>← Retour à la fiche patient</Link>
      </div>
    );
  }

  const meta       = EQUIP_META[dossier.typeEquipement];
  const statutMeta = STATUT_META[dossier.statut] ?? STATUT_META["En cours"];
  const totalPEC   = (dossier.pecSecu?.montantSS ?? 0) + (dossier.pecMutuelle?.montant ?? 0);
  const rac        = dossier.rac ?? dossier.totalTTC - totalPEC;

  function accepterPEC() {
    setDossier(d => ({ ...d, statut: "Accepté" }));
    setToast("✓ Prise en charge acceptée — dossier prêt pour facturation.");
  }
  function facturer() {
    const fac = {
      id: nextId("FAC"),
      date: new Date().toISOString().slice(0, 10),
      montant: rac, statut: "Facturé",
      modePaiement: dossier.modeFinancement ?? "À encaisser",
    };
    setDossier(d => ({ ...d, statut: "Facturé", facture: fac }));
    setToast(`✓ Facture ${fac.id} générée — ${eur(rac)}`);
  }

  const canAccept  = dossier.statut === "En cours" || dossier.statut === "En attente";
  const canFacture = dossier.statut === "Accepté";

  const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: "dossier",     label: "Dossier",     icon: "" },
    { key: "tierspayant", label: "Tiers Payant", icon: "" },
    { key: "documents",   label: `Documents${(dossier.documents?.length ?? 0) > 0 ? ` (${dossier.documents?.length})` : ""}`, icon: "" },
  ];

  return (
    <>
      {toast && (
        <div onClick={() => setToast(null)} style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 200, padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "white", background: "rgba(15,23,42,0.92)", backdropFilter: "blur(12px)", boxShadow: "0 4px 20px rgba(0,0,0,0.25)", cursor: "pointer", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column" }}>

        {/* ── HEADER sticky ───────────────────────────────────────────────── */}
        <div style={{ ...glass, position: "sticky", top: 0, zIndex: 10, borderRadius: "16px 16px 0 0", padding: "10px 18px 0", borderBottom: "none" }}>

          {/* Fil d'Ariane */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>
            <Link href="/clair-vision/pro/patients" style={{ color: "#94a3b8", textDecoration: "none" }}>Patients</Link>
            <span>/</span>
            <Link href={`/clair-vision/pro/patients/${id}`} style={{ color: "#94a3b8", textDecoration: "none" }}>{dossier.patientNom}</Link>
            <span>/</span>
            <span style={{ color: "#1e293b", fontWeight: 600 }}>{meta.label} — {dossier.dateFr}</span>
          </div>

          {/* Ligne principale */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
            {/* Icon + titre */}
            <div style={{ width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, background: meta.bg, flexShrink: 0 }}>{meta.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>{meta.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: statutMeta.bg, color: statutMeta.color }}>{dossier.statut}</span>
                {dossier.devisId && <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{dossier.devisId}</span>}
                {editing && tab === "dossier" && <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT, padding: "2px 8px", borderRadius: 6, background: `${ACCENT}12` }}>Mode édition</span>}
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{dossier.dateFr}{dossier.praticien && ` · ${dossier.praticien}`}</div>
            </div>

            {/* KPIs */}
            <div style={{ display: "flex", gap: 16 }}>
              <KPI label="TTC" value={eur(dossier.totalTTC)} />
              {totalPEC > 0 && <KPI label="PEC" value={`−${eur(totalPEC)}`} color="#15803d" />}
              <KPI label="RAC" value={eur(rac)} color={ACCENT} bold />
              {dossier.facture && <KPI label="Factures" value="✓ Réglé" color="#15803d" />}
            </div>

            {/* Séparateur */}
            <div style={{ width: 1, height: 28, background: "rgba(226,232,240,0.9)", flexShrink: 0 }} />

            {/* Actions */}
            <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
              {/* Edit (Dossier tab only) */}
              {tab === "dossier" && !editing && (
                <button onClick={() => setEditing(true)}
                  style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: ACCENT, background: `${ACCENT}10`, border: `1px solid ${ACCENT}25`, cursor: "pointer" }}>
                  Modifier
                </button>
              )}
              {tab === "dossier" && editing && (
                <>
                  <button onClick={() => setEditing(false)}
                    style={{ padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#64748b", background: "rgba(241,245,249,0.9)", border: "none", cursor: "pointer" }}>
                    Annuler
                  </button>
                  <button onClick={() => setEditing(false)}
                    style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "white", background: `linear-gradient(135deg,${ACCENT},${ACCENT_D})`, border: "none", cursor: "pointer" }}>
                    ✓ Enregistrer
                  </button>
                </>
              )}

              <button
                onClick={() => window.open(`/clair-vision/pro/patients/${id}/visites/${visiteId}/facture?autoprint=1`, "_blank")}
                style={{ padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#374151", background: "rgba(241,245,249,0.9)", border: "none", cursor: "pointer" }}
              >Imprimer</button>
              <button
                onClick={() => setEmailModal(true)}
                style={{ padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#374151", background: "rgba(241,245,249,0.9)", border: "none", cursor: "pointer" }}
              >Envoyer</button>

              {canAccept && (
                <button onClick={accepterPEC}
                  style={{ padding: "8px 16px", borderRadius: 9, fontSize: 12, fontWeight: 700, color: "white", border: "none", cursor: "pointer", background: "#10b981", boxShadow: "0 2px 8px rgba(16,185,129,0.35)" }}>
                  ✓ Accepter la prise en charge
                </button>
              )}
              {canFacture && (
                <button onClick={facturer}
                  style={{ padding: "8px 16px", borderRadius: 9, fontSize: 12, fontWeight: 700, color: "white", border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_D})`, boxShadow: `0 2px 8px ${ACCENT}40` }}>
                  Facturer — {eur(rac)}
                </button>
              )}
              {dossier.statut === "Facturé" && (
                <span style={{ fontSize: 12, fontWeight: 700, color: "#15803d", padding: "8px 12px", borderRadius: 9, background: "rgba(21,128,61,0.10)", border: "1px solid rgba(21,128,61,0.25)" }}>
                  ✓ {dossier.facture?.id}
                </span>
              )}
            </div>
          </div>

          {/* Onglets */}
          <div style={{ display: "flex", gap: 2 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); if (t.key !== "dossier") setEditing(false); }}
                style={{ padding: "9px 18px", borderRadius: "9px 9px 0 0", fontSize: 13, fontWeight: tab === t.key ? 700 : 500, border: "none", cursor: "pointer", background: tab === t.key ? "rgba(255,255,255,0.9)" : "transparent", color: tab === t.key ? ACCENT : "#64748b", borderBottom: tab === t.key ? `2px solid ${ACCENT}` : "2px solid transparent", transition: "all 0.15s" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── CONTENU ─────────────────────────────────────────────────────── */}
        <div style={{ ...glass, borderRadius: "0 0 16px 16px", borderTop: "1px solid rgba(226,232,240,0.5)", padding: "16px 18px" }}>
          {tab === "dossier"     && <TabDossier dossier={dossier} setDossier={setDossier} editing={editing} />}
          {tab === "tierspayant" && <TabTiersPayant dossier={dossier} />}
          {tab === "documents"   && <TabDocuments dossier={dossier} setDossier={setDossier} />}
        </div>

      </div>

      {/* ── Email modal ─────────────────────────────────────────────────── */}
      {emailModal && (
        <div
          onClick={() => { setEmailModal(false); setEmailSent(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 16, padding: 28, width: 480, maxWidth: "calc(100vw - 32px)", boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }}
          >
            {emailSent ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}></div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: "0 0 6px" }}>Email envoyé !</p>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>La facture a été transmise à {dossier.patientNom}.</p>
                <button
                  onClick={() => { setEmailModal(false); setEmailSent(false); }}
                  style={{ marginTop: 20, padding: "9px 24px", borderRadius: 8, background: ACCENT, color: "#fff", border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                >Fermer</button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Envoyer par email</span>
                  <button onClick={() => setEmailModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>×</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                    Destinataire
                    <input
                      defaultValue={`${dossier.patientNom.toLowerCase().replace(/\s+/g, ".")}@email.fr`}
                      style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </label>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                    Objet
                    <input
                      defaultValue={`Votre ${dossier.facture ? "facture" : "devis"} n° ${dossier.facture?.id ?? dossier.devisId} — Opticien`}
                      style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </label>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                    Message
                    <textarea
                      rows={5}
                      defaultValue={`Bonjour ${dossier.patientNom},\n\nVeuillez trouver ci-joint votre ${dossier.facture ? "facture" : "devis"} n° ${dossier.facture?.id ?? dossier.devisId} d'un montant de ${eur(dossier.facture?.montant ?? dossier.totalTTC)}.\n\nCordialement,\nVotre opticien`}
                      style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
                    />
                  </label>
                  <div style={{ fontSize: 11, color: "#94a3b8", background: "#f8fafc", borderRadius: 8, padding: "8px 10px" }}>
                    Pièce jointe : <strong>{dossier.facture ? `facture_${dossier.facture.id}` : `devis_${dossier.devisId}`}.pdf</strong> (généré automatiquement)
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                  <button
                    onClick={() => setEmailModal(false)}
                    style={{ padding: "9px 18px", borderRadius: 8, background: "#f1f5f9", color: "#374151", border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                  >Annuler</button>
                  <button
                    onClick={() => setEmailSent(true)}
                    style={{ padding: "9px 18px", borderRadius: 8, background: ACCENT, color: "#fff", border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                  >Envoyer</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
