"use client";

import { useState, useEffect, useCallback, useRef, type CSSProperties } from "react";
import { loadUsers, loadCurrentUserId } from "@/lib/users";

/* ═══════════════════════════════════════════════════════════════════════
   TOKENS
═══════════════════════════════════════════════════════════════════════ */
const ACCENT = "#00C98A";
const glass: CSSProperties = {
  background: "var(--glass-bg)", backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)", border: "1px solid var(--glass-border)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
};
const glassSubtle: CSSProperties = {
  background: "var(--glass-subtle-bg)", border: "1px solid var(--glass-subtle-border)",
};
const input: CSSProperties = {
  padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.35)",
  background: "var(--glass-strong-bg)", fontSize: 13, color: "#1e293b",
  outline: "none", width: "100%", boxSizing: "border-box",
};
const label: CSSProperties = { display: "block", fontSize: 11.5, fontWeight: 500, color: "#64748b", marginBottom: 5 };

/* ═══════════════════════════════════════════════════════════════════════
   TYPES — REMBOURSEMENTS TP
═══════════════════════════════════════════════════════════════════════ */
type TPStatut = "En attente" | "Reçu" | "Partiel" | "Refusé" | "N/A";

interface RemboursementTP {
  id: string; factureId: string; factureNumero: string;
  patientNom: string; patientPrenom: string; dateFacture: string; mutuelleNom?: string;
  montantSS: number; ssStatut: TPStatut; ssDatePaiement?: string; ssMontantReçu?: number; ssReference?: string;
  montantMutuelle: number; mutuelleStatut: TPStatut; mutuelleDatePaiement?: string; mutuelleMontantReçu?: number; mutuelleReference?: string;
  createdAt: string; notes?: string;
}

type Filtre = "Tous" | "En attente SS" | "En attente mutuelle" | "Tout réglé" | "Refusés";
type ModalMode = "ss" | "mutuelle" | "both";

/* ═══════════════════════════════════════════════════════════════════════
   TYPES — CONTRÔLE RÈGLEMENT
═══════════════════════════════════════════════════════════════════════ */
interface BankTx {
  id: string; date: string; label: string; debit: number; credit: number;
}

type MatchConfidence = "high" | "medium" | "low";
type MatchField = "ss" | "mutuelle";

interface MatchProposal {
  txId: string;
  matchedIds: string[];      // RemboursementTP ids
  field: MatchField;
  totalMatched: number;
  confidence: MatchConfidence;
  grouped: boolean;          // true si plusieurs dossiers regroupés
}

type TxState = "pending" | "validated" | "ignored";

/* ═══════════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════════ */
const LS_KEY = "thor_pro_audition_tiers_payant";

const STATUT_CONFIG: Record<TPStatut, { bg: string; text: string; dot: string; label: string }> = {
  "En attente": { bg: "rgba(245,158,11,0.12)",  text: "#b45309", dot: "#f59e0b", label: "En attente" },
  "Reçu":       { bg: "rgba(16,185,129,0.12)",   text: "#047857", dot: "#10b981", label: "Reçu" },
  "Partiel":    { bg: "rgba(99,102,241,0.12)",   text: "#4338ca", dot: "#6366f1", label: "Partiel" },
  "Refusé":     { bg: "rgba(239,68,68,0.12)",    text: "#b91c1c", dot: "#ef4444", label: "Refusé" },
  "N/A":        { bg: "rgba(148,163,184,0.12)",  text: "#64748b", dot: "#94a3b8", label: "Sans objet" },
};

const SS_KEYWORDS = ["cpam", "noemie", "noémie", "assurance maladie", "caisse primaire", "securite sociale", "sécurité sociale", "sesam vitale", "ameli", "cnam"];

/* ── FSE types ── */
type FseStatut = "a_transmettre" | "en_cours" | "accepte" | "partiel" | "rejete";
interface Fse { id:string; factureId:string; factureNumero:string; patientNom:string; patientPrenom:string; dateFacture:string; montantAMO:number; statut:FseStatut; transmisAt?:string; retourAt?:string; retourRef?:string; retourMontant?:number; retourCode?:string; retourMotifRejet?:string; lots?:string; }
const FSE_LS = "thor_pro_audition_fse";
const FSE_STATUT_CONF: Record<FseStatut, { label:string; color:string; bg:string; icon:string }> = {
  a_transmettre: { label:"À transmettre", color:"#b45309", bg:"rgba(245,158,11,.12)", icon:"" },
  en_cours:      { label:"En cours…",     color:"#6366f1", bg:"rgba(99,102,241,.12)", icon:"" },
  accepte:       { label:"Accepté",        color:"#047857", bg:"rgba(16,185,129,.12)", icon:"✓"  },
  partiel:       { label:"Partiel",        color:"#0369a1", bg:"rgba(14,165,233,.12)", icon:"◑"  },
  rejete:        { label:"Rejeté",         color:"#b91c1c", bg:"rgba(239,68,68,.12)",  icon:""  },
};
const MOTIFS_REJET = ["Droits non ouverts — patient non assuré","Doublon de facturation","Code acte incompatible","Dépassement du plafond de remboursement","Ordonnance manquante ou expirée"];
function genRef() { return `NOM-${new Date().getFullYear()}-${Math.floor(100000+Math.random()*899999)}`; }
function genLot() { return `LOT${Math.floor(100+Math.random()*900)}-${new Date().getFullYear()}`; }

/* ═══════════════════════════════════════════════════════════════════════
   MOCK DATA
═══════════════════════════════════════════════════════════════════════ */
const MOCK_DATA: RemboursementTP[] = [
  { id: "tp-001", factureId: "fac-001", factureNumero: "FAC-AUD-2026-001", patientNom: "Moreau", patientPrenom: "Jean-Paul", dateFacture: "2026-02-12", mutuelleNom: "Harmonie Mutuelle", montantSS: 1680, ssStatut: "Reçu", ssDatePaiement: "2026-02-27", ssMontantReçu: 1680, ssReference: "NOM-2026-00142", montantMutuelle: 1120, mutuelleStatut: "Reçu", mutuelleDatePaiement: "2026-03-05", mutuelleMontantReçu: 1120, mutuelleReference: "HARM-VIR-48291", createdAt: "2026-02-12T10:30:00Z" },
  { id: "tp-002", factureId: "fac-002", factureNumero: "FAC-AUD-2026-002", patientNom: "Lefranc", patientPrenom: "Michèle", dateFacture: "2026-02-19", mutuelleNom: "MGEN", montantSS: 1680, ssStatut: "Reçu", ssDatePaiement: "2026-03-06", ssMontantReçu: 1680, ssReference: "NOM-2026-00218", montantMutuelle: 960, mutuelleStatut: "En attente", createdAt: "2026-02-19T14:15:00Z" },
  { id: "tp-003", factureId: "fac-003", factureNumero: "FAC-AUD-2026-003", patientNom: "Bernin", patientPrenom: "Claude", dateFacture: "2026-03-03", mutuelleNom: "Malakoff Humanis", montantSS: 840, ssStatut: "En attente", montantMutuelle: 560, mutuelleStatut: "En attente", createdAt: "2026-03-03T09:00:00Z" },
  { id: "tp-004", factureId: "fac-004", factureNumero: "FAC-AUD-2026-004", patientNom: "Dupont", patientPrenom: "Sylvie", dateFacture: "2026-03-10", mutuelleNom: "April Santé", montantSS: 1680, ssStatut: "En attente", montantMutuelle: 0, mutuelleStatut: "N/A", createdAt: "2026-03-10T11:45:00Z" },
  { id: "tp-005", factureId: "fac-005", factureNumero: "FAC-AUD-2026-005", patientNom: "Martin", patientPrenom: "Robert", dateFacture: "2026-03-14", mutuelleNom: "AG2R La Mondiale", montantSS: 840, ssStatut: "Refusé", ssReference: "NOM-2026-00304", montantMutuelle: 640, mutuelleStatut: "En attente", createdAt: "2026-03-14T16:00:00Z", notes: "Droits SS expirés — renouvellement en cours" },
  { id: "tp-006", factureId: "fac-006", factureNumero: "FAC-AUD-2026-006", patientNom: "Garcia", patientPrenom: "Isabelle", dateFacture: "2026-03-18", mutuelleNom: "Swiss Life", montantSS: 1680, ssStatut: "Partiel", ssDatePaiement: "2026-03-25", ssMontantReçu: 1500, ssReference: "NOM-2026-00341", montantMutuelle: 800, mutuelleStatut: "En attente", createdAt: "2026-03-18T10:00:00Z", notes: "Retenue NOEMIE de 180€ — motif : franchise" },
];

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════ */
function fmt(n: number) { return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }); }
function fmtDate(d?: string) { if (!d) return "—"; return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }); }
function today() { return new Date().toISOString().slice(0, 10); }

/* ═══════════════════════════════════════════════════════════════════════
   CSV PARSER — multi-banques (BNP, SG, CIC, CA, Boursorama, LBP…)
═══════════════════════════════════════════════════════════════════════ */
function parseFrNum(s: string): number {
  return parseFloat((s || "").replace(/\s/g, "").replace(",", ".")) || 0;
}

function splitCSVRow(row: string, sep: string): string[] {
  const result: string[] = [];
  let cur = "", inQ = false;
  for (const ch of row) {
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === sep && !inQ) { result.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  result.push(cur.trim());
  return result;
}

function findColIdx(headers: string[], candidates: string[]): number {
  for (const c of candidates) {
    const i = headers.findIndex(h => h.toLowerCase().includes(c));
    if (i >= 0) return i;
  }
  return -1;
}

function parseCSV(text: string): BankTx[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = splitCSVRow(lines[0], sep).map(h => h.toLowerCase());

  const iDate  = findColIdx(headers, ["date opé", "date op", "date val", "date"]);
  const iLabel = findColIdx(headers, ["libellé", "libell", "label", "désignation", "opération", "description"]);
  const iDebit = findColIdx(headers, ["débit", "debit", "retrait", "montant débit"]);
  const iCredit= findColIdx(headers, ["crédit", "credit", "versement", "montant crédit"]);
  const iMont  = findColIdx(headers, ["montant", "amount"]); // single-column banks

  const txs: BankTx[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVRow(lines[i], sep);
    let debit = 0, credit = 0;
    if (iDebit >= 0 && iCredit >= 0) {
      debit  = parseFrNum(cols[iDebit]  || "");
      credit = parseFrNum(cols[iCredit] || "");
    } else if (iMont >= 0) {
      const m = parseFrNum(cols[iMont] || "");
      if (m < 0) debit = Math.abs(m); else credit = m;
    }
    const rawDate = (cols[iDate] || "").replace(/"/g, "").trim();
    const lbl     = (cols[iLabel] || cols[1] || "").replace(/"/g, "").trim();
    if (!rawDate && !lbl && !debit && !credit) continue;
    txs.push({ id: `tx-${i}`, date: rawDate, label: lbl, debit, credit });
  }
  return txs;
}

/* ═══════════════════════════════════════════════════════════════════════
   MATCHING ENGINE
═══════════════════════════════════════════════════════════════════════ */
function isSSPayer(label: string): boolean {
  const l = label.toLowerCase();
  return SS_KEYWORDS.some(k => l.includes(k));
}

function detectMutuellePayer(label: string, remboursements: RemboursementTP[]): string | null {
  const l = label.toLowerCase();
  const names = [...new Set(remboursements.filter(r => r.mutuelleNom).map(r => r.mutuelleNom!))];
  for (const name of names) {
    const words = name.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    if (words.some(w => l.includes(w))) return name;
  }
  return null;
}

// Subset sum — trouve la combinaison de dossiers dont la somme = target (±tolérance 0.10€)
function findSubsetSum(amounts: number[], target: number): number[] | null {
  const EPS = 0.10;
  const items = amounts.slice(0, 18); // limite pour perf
  function bt(start: number, rem: number, cur: number[]): number[] | null {
    if (Math.abs(rem) <= EPS) return cur;
    if (start >= items.length || rem < -EPS) return null;
    return bt(start + 1, rem - items[start], [...cur, start]) ?? bt(start + 1, rem, cur);
  }
  return bt(0, target, []);
}

function computeMatches(txs: BankTx[], rembos: RemboursementTP[]): Record<string, MatchProposal | null> {
  const result: Record<string, MatchProposal | null> = {};
  const pendingSS  = rembos.filter(r => r.ssStatut === "En attente" && r.montantSS > 0);
  const pendingMut = rembos.filter(r => r.mutuelleStatut === "En attente" && r.montantMutuelle > 0);

  for (const tx of txs) {
    if (tx.credit === 0) { result[tx.id] = null; continue; }

    const ssMatch  = isSSPayer(tx.label);
    const mutName  = ssMatch ? null : detectMutuellePayer(tx.label, rembos);
    const isMut    = !!mutName;

    const candidates = ssMatch
      ? pendingSS
      : isMut
        ? pendingMut.filter(r => r.mutuelleNom?.toLowerCase().split(/\s+/).some(w => w.length > 3 && mutName!.toLowerCase().includes(w)))
        : pendingMut; // inconnu → on essaie quand même mutuelle

    const field: MatchField = ssMatch ? "ss" : "mutuelle";
    const amounts = candidates.map(r => ssMatch ? r.montantSS : r.montantMutuelle);

    // 1. Correspondance exacte — 1 dossier
    const exactIdx = amounts.findIndex(a => Math.abs(a - tx.credit) < 0.10);
    if (exactIdx >= 0) {
      result[tx.id] = { txId: tx.id, matchedIds: [candidates[exactIdx].id], field, totalMatched: amounts[exactIdx], confidence: "high", grouped: false };
      continue;
    }

    // 2. Regroupement — N dossiers
    const indices = findSubsetSum(amounts, tx.credit);
    if (indices && indices.length > 1) {
      result[tx.id] = {
        txId: tx.id,
        matchedIds: indices.map(i => candidates[i].id),
        field,
        totalMatched: indices.reduce((s, i) => s + amounts[i], 0),
        confidence: indices.length <= 4 ? "high" : "medium",
        grouped: true,
      };
      continue;
    }

    // 3. Correspondance partielle proche (±5%)
    const closest = amounts.reduce<{ idx: number; diff: number }>((best, a, i) => {
      const diff = Math.abs(a - tx.credit);
      return diff < best.diff ? { idx: i, diff } : best;
    }, { idx: -1, diff: Infinity });
    if (closest.idx >= 0 && closest.diff / tx.credit < 0.05) {
      result[tx.id] = { txId: tx.id, matchedIds: [candidates[closest.idx].id], field, totalMatched: amounts[closest.idx], confidence: "medium", grouped: false };
      continue;
    }

    result[tx.id] = null;
  }
  return result;
}

/* ═══════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════════════════════ */
function Badge({ statut }: { statut: TPStatut }) {
  const cfg = STATUT_CONFIG[statut];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: cfg.bg, color: cfg.text, fontSize: 11.5, fontWeight: 600 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function StatCard({ label: lbl, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ ...glass, borderRadius: 16, padding: "20px 24px", flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 6 }}>{lbl}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color ?? "#1e293b", letterSpacing: -0.5 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function btnSmall(color: string): CSSProperties {
  return { padding: "4px 10px", borderRadius: 7, border: "none", cursor: "pointer", background: color + "18", color, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" };
}

/* ═══════════════════════════════════════════════════════════════════════
   CONFIDENCE BADGE
═══════════════════════════════════════════════════════════════════════ */
function ConfidenceBadge({ m, grouped }: { m: MatchProposal; grouped: boolean }) {
  const color = m.confidence === "high" ? "#10b981" : "#f59e0b";
  const bg = m.confidence === "high" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)";
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color, background: bg, padding: "2px 8px", borderRadius: 10 }}>
      {grouped ? `${m.matchedIds.length} dossiers regroupés` : m.confidence === "high" ? "✓ Exact" : "≈ Proche"}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════════════════ */
export default function TiersPayantAuditionPage() {
  /* ── Remboursements TP ── */
  const [rembos, setRembos] = useState<RemboursementTP[]>([]);
  const [filtre, setFiltre] = useState<Filtre>("Tous");
  const [search, setSearch] = useState("");
  const [modalEntry, setModalEntry] = useState<RemboursementTP | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>("both");
  const [notesModal, setNotesModal] = useState<RemboursementTP | null>(null);
  const [mDateSS, setMDateSS] = useState(today());
  const [mMontantSS, setMMontantSS] = useState("");
  const [mRefSS, setMRefSS] = useState("");
  const [mDateMutuelle, setMDateMutuelle] = useState(today());
  const [mMontantMutuelle, setMMontantMutuelle] = useState("");
  const [mRefMutuelle, setMRefMutuelle] = useState("");
  const [mNotes, setMNotes] = useState("");

  /* ── Navigation ── */
  const [tab, setTab] = useState<"suivi" | "releve" | "fse">("suivi");
  const [fses, setFses] = useState<Fse[]>([]);
  const [fseFilter, setFseFilter] = useState<"tous" | FseStatut>("tous");
  const [fseToast, setFseToast] = useState<string | null>(null);

  /* ── Contrôle règlement ── */
  const [isGerant, setIsGerant] = useState(false);
  const [txs, setTxs] = useState<BankTx[]>([]);
  const [matches, setMatches] = useState<Record<string, MatchProposal | null>>({});
  const [txStates, setTxStates] = useState<Record<string, TxState>>({});
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Load ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const data: RemboursementTP[] = raw ? JSON.parse(raw) : MOCK_DATA;
      setRembos(data);
      if (!raw) localStorage.setItem(LS_KEY, JSON.stringify(MOCK_DATA));
      const fseRaw = localStorage.getItem(FSE_LS);
      if (fseRaw) { setFses(JSON.parse(fseRaw)); }
      else {
        const init: Fse[] = data.filter(r => r.montantSS > 0).map(r => ({ id:`fse-${r.id}`, factureId:r.factureId, factureNumero:r.factureNumero, patientNom:r.patientNom, patientPrenom:r.patientPrenom, dateFacture:r.dateFacture, montantAMO:r.montantSS, statut:(r.ssStatut==="Reçu"?"accepte":r.ssStatut==="Refusé"?"rejete":r.ssStatut==="Partiel"?"partiel":"a_transmettre") as FseStatut, retourRef:r.ssReference, retourMontant:r.ssMontantReçu }));
        setFses(init); localStorage.setItem(FSE_LS, JSON.stringify(init));
      }
    } catch { setRembos(MOCK_DATA); }

    // Check gérant
    try {
      const users = loadUsers();
      const uid   = loadCurrentUserId();
      const me    = users.find(u => u.id === uid);
      setIsGerant(me?.role === "Gérant");
    } catch { setIsGerant(false); }
  }, []);

  const save = useCallback((data: RemboursementTP[]) => {
    setRembos(data);
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }, []);

  /* ── Stats ── */
  const totalSSAttenteVal = rembos.filter(r => r.ssStatut === "En attente").reduce((s, r) => s + r.montantSS, 0);
  const totalMutAttenteVal = rembos.filter(r => r.mutuelleStatut === "En attente").reduce((s, r) => s + r.montantMutuelle, 0);
  const moisEnCours = new Date().toISOString().slice(0, 7);
  const reçuCeMois = rembos.reduce((s, r) => {
    let t = 0;
    if (r.ssDatePaiement?.startsWith(moisEnCours)) t += r.ssMontantReçu ?? 0;
    if (r.mutuelleDatePaiement?.startsWith(moisEnCours)) t += r.mutuelleMontantReçu ?? 0;
    return s + t;
  }, 0);
  const enAttenteCount = rembos.filter(r => r.ssStatut === "En attente" || r.mutuelleStatut === "En attente").length;

  /* ── Filtrage suivi ── */
  const filtered = rembos.filter(r => {
    const q = search.toLowerCase();
    if (q && !`${r.patientNom} ${r.patientPrenom} ${r.factureNumero} ${r.mutuelleNom ?? ""}`.toLowerCase().includes(q)) return false;
    switch (filtre) {
      case "En attente SS":       return r.ssStatut === "En attente";
      case "En attente mutuelle": return r.mutuelleStatut === "En attente";
      case "Tout réglé":          return (r.ssStatut === "Reçu" || r.ssStatut === "N/A") && (r.mutuelleStatut === "Reçu" || r.mutuelleStatut === "N/A");
      case "Refusés":             return r.ssStatut === "Refusé" || r.mutuelleStatut === "Refusé";
      default: return true;
    }
  }).sort((a, b) => new Date(b.dateFacture).getTime() - new Date(a.dateFacture).getTime());

  /* ── Modal suivi ── */
  function openModal(entry: RemboursementTP, mode: ModalMode) {
    setModalEntry(entry); setModalMode(mode);
    setMDateSS(today()); setMMontantSS(mode !== "mutuelle" ? String(entry.montantSS) : ""); setMRefSS(entry.ssReference ?? "");
    setMDateMutuelle(today()); setMMontantMutuelle(mode !== "ss" ? String(entry.montantMutuelle) : ""); setMRefMutuelle(entry.mutuelleReference ?? "");
    setMNotes(entry.notes ?? "");
  }
  function validerModal() {
    if (!modalEntry) return;
    const updated = rembos.map(r => {
      if (r.id !== modalEntry.id) return r;
      const next = { ...r, notes: mNotes || r.notes };
      if (modalMode !== "mutuelle") { const m = parseFloat(mMontantSS) || 0; next.ssStatut = m >= r.montantSS ? "Reçu" : "Partiel"; next.ssDatePaiement = mDateSS; next.ssMontantReçu = m; next.ssReference = mRefSS || r.ssReference; }
      if (modalMode !== "ss") { const m = parseFloat(mMontantMutuelle) || 0; next.mutuelleStatut = m >= r.montantMutuelle ? "Reçu" : "Partiel"; next.mutuelleDatePaiement = mDateMutuelle; next.mutuelleMontantReçu = m; next.mutuelleReference = mRefMutuelle || r.mutuelleReference; }
      return next;
    });
    save(updated); setModalEntry(null);
  }
  function marquerRefusé(id: string, cible: "ss" | "mutuelle") {
    save(rembos.map(r => r.id !== id ? r : { ...r, [cible === "ss" ? "ssStatut" : "mutuelleStatut"]: "Refusé" as TPStatut }));
  }

  /* ── CSV ── */
  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setTxs(parsed);
      setMatches(computeMatches(parsed, rembos));
      setTxStates({});
    };
    reader.readAsText(file, "utf-8");
  }

  function validerMatch(tx: BankTx, proposal: MatchProposal) {
    const updated = rembos.map(r => {
      if (!proposal.matchedIds.includes(r.id)) return r;
      const next = { ...r };
      if (proposal.field === "ss") {
        const single = !proposal.grouped ? proposal.totalMatched : (r.montantSS);
        next.ssStatut = single >= r.montantSS ? "Reçu" : "Partiel";
        next.ssDatePaiement = tx.date;
        next.ssMontantReçu = single;
      } else {
        const single = !proposal.grouped ? proposal.totalMatched : (r.montantMutuelle);
        next.mutuelleStatut = single >= r.montantMutuelle ? "Reçu" : "Partiel";
        next.mutuelleDatePaiement = tx.date;
        next.mutuelleMontantReçu = single;
      }
      return next;
    });
    save(updated);
    setTxStates(s => ({ ...s, [tx.id]: "validated" }));
  }

  function ignorerTx(txId: string) {
    setTxStates(s => ({ ...s, [txId]: "ignored" }));
  }

  /* ── FSE ── */
  function saveFses(data: Fse[]) { setFses(data); localStorage.setItem(FSE_LS, JSON.stringify(data)); }
  function showFseToast(msg: string) { setFseToast(msg); setTimeout(() => setFseToast(null), 3500); }

  async function transmettreFse(id: string) {
    saveFses(fses.map(f => f.id===id ? {...f, statut:"en_cours" as FseStatut, transmisAt:new Date().toISOString()} : f));
    await new Promise(r => setTimeout(r,1800));
    const fse = fses.find(f => f.id===id); if (!fse) return;
    const rand = Math.random();
    const result: Partial<Fse> = rand < 0.88
      ? {statut:"accepte", retourAt:new Date().toISOString(), retourRef:genRef(), retourMontant:fse.montantAMO, retourCode:"200 OK", lots:genLot()}
      : rand < 0.96
      ? {statut:"partiel", retourAt:new Date().toISOString(), retourRef:genRef(), retourMontant:Math.round(fse.montantAMO*0.7*100)/100, retourCode:"206 Partiel", lots:genLot()}
      : {statut:"rejete", retourAt:new Date().toISOString(), retourCode:"601 Rejet", retourMotifRejet:MOTIFS_REJET[Math.floor(Math.random()*MOTIFS_REJET.length)]};
    saveFses(fses.map(f => f.id===id ? {...f, statut:"en_cours" as FseStatut, transmisAt:new Date().toISOString(), ...result} : f));
    showFseToast(`${result.statut==="accepte"?"✓ FSE acceptée":result.statut==="partiel"?"◑ FSE partielle":"FSE rejetée"} — ${fse.patientPrenom} ${fse.patientNom}`);
  }

  async function transmettreToutes() {
    const toSend = fses.filter(f => f.statut==="a_transmettre"); if (!toSend.length) return;
    saveFses(fses.map(f => toSend.find(t=>t.id===f.id) ? {...f, statut:"en_cours" as FseStatut, transmisAt:new Date().toISOString()} : f));
    await new Promise(r => setTimeout(r,2200));
    const final = fses.map(f => {
      if (!toSend.find(t=>t.id===f.id)) return f;
      const rand=Math.random();
      if(rand<0.88) return {...f,statut:"accepte" as FseStatut,retourAt:new Date().toISOString(),retourRef:genRef(),retourMontant:f.montantAMO,retourCode:"200 OK",lots:genLot()};
      if(rand<0.96) return {...f,statut:"partiel" as FseStatut,retourAt:new Date().toISOString(),retourRef:genRef(),retourMontant:Math.round(f.montantAMO*0.7*100)/100,retourCode:"206 Partiel",lots:genLot()};
      return {...f,statut:"rejete" as FseStatut,retourAt:new Date().toISOString(),retourCode:"601 Rejet",retourMotifRejet:MOTIFS_REJET[0]};
    });
    saveFses(final);
    const accepted = final.filter(f=>toSend.find(t=>t.id===f.id)&&f.statut==="accepte").length;
    showFseToast(`Lot transmis — ${accepted}/${toSend.length} FSEs acceptées`);
  }

  /* ── Releve stats ── */
  const entrées  = txs.filter(t => t.credit > 0);
  const sorties  = txs.filter(t => t.debit > 0);
  const nbMatched = entrées.filter(t => matches[t.id] !== null && !["validated","ignored"].includes(txStates[t.id] ?? "")).length;
  const totalEntrées = entrées.reduce((s, t) => s + t.credit, 0);
  const totalSorties = sorties.reduce((s, t) => s + t.debit, 0);

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", margin: 0 }}>Tiers payant — Suivi des remboursements</h1>
        <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 4 }}>Sécu (NOEMIE) et mutuelles · Audition</p>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        <StatCard label="En attente — Sécu" value={fmt(totalSSAttenteVal)} sub={`${rembos.filter(r => r.ssStatut === "En attente").length} facture(s)`} color="#b45309" />
        <StatCard label="En attente — Mutuelles" value={fmt(totalMutAttenteVal)} sub={`${rembos.filter(r => r.mutuelleStatut === "En attente").length} facture(s)`} color="#4338ca" />
        <StatCard label="Reçu ce mois" value={fmt(reçuCeMois)} sub="SS + mutuelles" color={ACCENT} />
        <StatCard label="Dossiers en cours" value={String(enAttenteCount)} sub="au moins 1 paiement attendu" />
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap" }}>
        {([["suivi", "Suivi des remboursements"], ["fse", "Télétransmission FSE"], ["releve", "Contrôle règlement"]] as const).map(([key, lbl]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: "9px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: tab === key ? ACCENT : "rgba(148,163,184,0.15)",
            color: tab === key ? "#fff" : "#475569",
            display: "flex", alignItems: "center", gap: 7,
          }}>
            {lbl}
            {key === "releve" && !isGerant && <span style={{ fontSize: 10 }}></span>}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          TAB 1 — SUIVI DES REMBOURSEMENTS
      ══════════════════════════════════════════════════ */}
      {tab === "suivi" && (
        <>
          {/* Filtres */}
          <div style={{ ...glass, borderRadius: 16, padding: "14px 18px", marginBottom: 18, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input style={{ ...input, paddingLeft: 32 }} placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["Tous", "En attente SS", "En attente mutuelle", "Tout réglé", "Refusés"] as Filtre[]).map(f => (
                <button key={f} onClick={() => setFiltre(f)} style={{ padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 500, background: filtre === f ? ACCENT : "rgba(148,163,184,0.15)", color: filtre === f ? "#fff" : "#475569" }}>{f}</button>
              ))}
            </div>
          </div>

          {/* Tableau */}
          <div style={{ ...glass, borderRadius: 16, overflow: "hidden" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Aucun remboursement trouvé</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(248,250,252,0.8)", borderBottom: "1px solid rgba(226,232,240,0.6)" }}>
                    {["Patient", "Facture", "Mutuelle", "Part Sécu", "Statut SS", "Part Mutuelle", "Statut Mutuelle", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: "#64748b", letterSpacing: 0.3, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(226,232,240,0.45)" : "none", background: i % 2 === 0 ? "transparent" : "rgba(248,250,252,0.35)" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5, color: "#1e293b" }}>{r.patientNom} {r.patientPrenom}</div>
                        <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>{fmtDate(r.dateFacture)}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#334155" }}>{r.factureNumero}</div>
                        {r.notes && <button onClick={() => setNotesModal(r)} style={{ fontSize: 11, color: "#f59e0b", background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}><svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>Note</button>}
                      </td>
                      <td style={{ padding: "14px 16px" }}><span style={{ fontSize: 12.5, color: "#475569" }}>{r.mutuelleNom ?? "—"}</span></td>
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{fmt(r.montantSS)}</div>
                        {r.ssMontantReçu !== undefined && r.ssMontantReçu !== r.montantSS && <div style={{ fontSize: 11, color: "#6366f1" }}>Reçu : {fmt(r.ssMontantReçu)}</div>}
                        {r.ssReference && <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.ssReference}</div>}
                        {r.ssDatePaiement && <div style={{ fontSize: 11, color: "#10b981" }}>{fmtDate(r.ssDatePaiement)}</div>}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {r.ssStatut !== "N/A" ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                            <Badge statut={r.ssStatut} />
                            {r.ssStatut === "En attente" && <div style={{ display: "flex", gap: 4 }}><button onClick={() => openModal(r, "ss")} style={btnSmall(ACCENT)}>Marquer reçu</button><button onClick={() => marquerRefusé(r.id, "ss")} style={btnSmall("#ef4444")}>Refusé</button></div>}
                          </div>
                        ) : <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>}
                      </td>
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        {r.mutuelleStatut !== "N/A" ? (
                          <>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{fmt(r.montantMutuelle)}</div>
                            {r.mutuelleMontantReçu !== undefined && r.mutuelleMontantReçu !== r.montantMutuelle && <div style={{ fontSize: 11, color: "#6366f1" }}>Reçu : {fmt(r.mutuelleMontantReçu)}</div>}
                            {r.mutuelleReference && <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.mutuelleReference}</div>}
                            {r.mutuelleDatePaiement && <div style={{ fontSize: 11, color: "#10b981" }}>{fmtDate(r.mutuelleDatePaiement)}</div>}
                          </>
                        ) : <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {r.mutuelleStatut !== "N/A" ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                            <Badge statut={r.mutuelleStatut} />
                            {r.mutuelleStatut === "En attente" && <div style={{ display: "flex", gap: 4 }}><button onClick={() => openModal(r, "mutuelle")} style={btnSmall(ACCENT)}>Marquer reçu</button><button onClick={() => marquerRefusé(r.id, "mutuelle")} style={btnSmall("#ef4444")}>Refusé</button></div>}
                          </div>
                        ) : <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {r.ssStatut === "En attente" && r.mutuelleStatut === "En attente" && <button onClick={() => openModal(r, "both")} style={btnSmall("#334155")}>Tout régler</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => { const e: RemboursementTP = { id: `tp-${Date.now()}`, factureId: "", factureNumero: "", patientNom: "Nouveau", patientPrenom: "Patient", dateFacture: today(), montantSS: 0, ssStatut: "En attente", montantMutuelle: 0, mutuelleStatut: "En attente", createdAt: new Date().toISOString() }; save([e, ...rembos]); }}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer", background: ACCENT, color: "#fff", fontSize: 13.5, fontWeight: 600 }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Ajouter un suivi TP
            </button>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════
          TAB 2 — CONTRÔLE RÈGLEMENT
      ══════════════════════════════════════════════════ */}
      {tab === "releve" && (
        <>
          {!isGerant ? (
            <div style={{ ...glass, borderRadius: 16, padding: "60px 32px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}></div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>Accès réservé au Gérant</div>
              <div style={{ fontSize: 13.5, color: "#64748b" }}>Connectez-vous en tant que Gérant pour accéder au contrôle des règlements bancaires.</div>
            </div>
          ) : (
            <>
              {/* Zone de dépôt */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => fileRef.current?.click()}
                style={{
                  ...glass, borderRadius: 16, padding: "36px 24px", textAlign: "center", cursor: "pointer",
                  border: dragOver ? `2px dashed ${ACCENT}` : "2px dashed rgba(148,163,184,0.4)",
                  background: dragOver ? `rgba(0,201,138,0.06)` : "rgba(255,255,255,0.45)",
                  marginBottom: 20, transition: "all 0.15s",
                }}
              >
                <input ref={fileRef} type="file" accept=".csv,.txt,.ofx" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                <div style={{ fontSize: 28, marginBottom: 10 }}></div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  {fileName ? fileName : "Déposez votre relevé bancaire"}
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  {txs.length > 0
                    ? `${txs.length} transactions · ${entrées.length} entrées · ${sorties.length} sorties · ${nbMatched} correspondance(s) trouvée(s)`
                    : "Format CSV — BNP, SG, CIC, CA, Boursorama, LBP, Qonto…"}
                </div>
              </div>

              {txs.length > 0 && (
                <>
                  {/* Résumé */}
                  <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
                    <StatCard label="Total entrées" value={fmt(totalEntrées)} sub={`${entrées.length} virements reçus`} color="#047857" />
                    <StatCard label="Total sorties" value={fmt(totalSorties)} sub={`${sorties.length} débits`} color="#b91c1c" />
                    <StatCard label="Correspondances TP" value={String(entrées.filter(t => matches[t.id] !== null).length)} sub={`sur ${entrées.length} entrées`} color={ACCENT} />
                    <StatCard label="Non identifiés" value={String(entrées.filter(t => matches[t.id] === null).length)} sub="virements sans correspondance" />
                  </div>

                  {/* Deux colonnes */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>

                    {/* ENTRÉES */}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#047857", letterSpacing: 0.5, marginBottom: 10, textTransform: "uppercase" }}>
                        Entrées — {fmt(totalEntrées)}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {entrées.map(tx => {
                          const state = txStates[tx.id] ?? "pending";
                          const proposal = matches[tx.id];
                          const matchedRembos = proposal ? rembos.filter(r => proposal.matchedIds.includes(r.id)) : [];

                          return (
                            <div key={tx.id} style={{
                              ...glass, borderRadius: 14, padding: "14px 16px",
                              opacity: state === "ignored" ? 0.45 : 1,
                              borderLeft: state === "validated" ? `3px solid ${ACCENT}` : proposal ? "3px solid #f59e0b" : "3px solid #e2e8f0",
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                                <div>
                                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>{tx.date}</div>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", lineHeight: 1.3 }}>{tx.label || "—"}</div>
                                </div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: "#047857", flexShrink: 0, marginLeft: 12 }}>+{fmt(tx.credit)}</div>
                              </div>

                              {/* Correspondance */}
                              {state === "validated" && (
                                <div style={{ fontSize: 11.5, color: ACCENT, fontWeight: 600, marginTop: 4 }}>✓ Validé</div>
                              )}
                              {state !== "validated" && state !== "ignored" && proposal && (
                                <div style={{ ...glassSubtle, borderRadius: 10, padding: "10px 12px", marginTop: 8 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                                    <ConfidenceBadge m={proposal} grouped={proposal.grouped} />
                                    <span style={{ fontSize: 11, color: "#64748b" }}>
                                      via {proposal.field === "ss" ? "Sécu (NOEMIE)" : "Mutuelle"}
                                    </span>
                                  </div>
                                  {matchedRembos.map(r => (
                                    <div key={r.id} style={{ fontSize: 12, color: "#334155", marginBottom: 3, display: "flex", justifyContent: "space-between" }}>
                                      <span>{r.patientNom} {r.patientPrenom} <span style={{ color: "#94a3b8" }}>· {r.factureNumero}</span></span>
                                      <span style={{ fontWeight: 600 }}>{fmt(proposal.field === "ss" ? r.montantSS : r.montantMutuelle)}</span>
                                    </div>
                                  ))}
                                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                                    <button onClick={() => validerMatch(tx, proposal)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer", background: ACCENT, color: "#fff", fontSize: 12, fontWeight: 600 }}>
                                      {proposal.grouped ? `Valider (${proposal.matchedIds.length} dossiers)` : "Valider"}
                                    </button>
                                    <button onClick={() => ignorerTx(tx.id)} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.35)", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>Ignorer</button>
                                  </div>
                                </div>
                              )}
                              {state !== "validated" && state !== "ignored" && !proposal && (
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                                  <span style={{ fontSize: 11.5, color: "#94a3b8" }}>Aucune correspondance TP trouvée</span>
                                  <button onClick={() => ignorerTx(tx.id)} style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid rgba(148,163,184,0.3)", background: "transparent", color: "#94a3b8", fontSize: 11, cursor: "pointer" }}>Ignorer</button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* SORTIES */}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#b91c1c", letterSpacing: 0.5, marginBottom: 10, textTransform: "uppercase" }}>
                        Sorties — {fmt(totalSorties)}
                      </div>
                      <div style={{ ...glass, borderRadius: 14, overflow: "hidden" }}>
                        {sorties.length === 0 ? (
                          <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Aucun débit</div>
                        ) : sorties.map((tx, i) => (
                          <div key={tx.id} style={{ padding: "12px 16px", borderBottom: i < sorties.length - 1 ? "1px solid rgba(226,232,240,0.4)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                            <div>
                              <div style={{ fontSize: 11, color: "#94a3b8" }}>{tx.date}</div>
                              <div style={{ fontSize: 12.5, color: "#334155", fontWeight: 500, marginTop: 1 }}>{tx.label || "—"}</div>
                            </div>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#b91c1c", flexShrink: 0 }}>−{fmt(tx.debit)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* TAB FSE */}
      {tab === "fse" && (() => {
        const fseFiltred = fseFilter==="tous" ? fses : fses.filter(f=>f.statut===fseFilter);
        const aTransmettre = fses.filter(f=>f.statut==="a_transmettre").length;
        const acceptes = fses.filter(f=>f.statut==="accepte").length;
        const enCours = fses.filter(f=>f.statut==="en_cours").length;
        const transmitted = fses.filter(f=>f.statut!=="a_transmettre"&&f.statut!=="en_cours");
        const tauxAccept = transmitted.length>0 ? Math.round(((acceptes+fses.filter(f=>f.statut==="partiel").length)/transmitted.length)*100) : 0;
        const totalAMO = fses.filter(f=>f.statut==="accepte").reduce((s,f)=>s+(f.retourMontant??0),0);
        return (
          <>
            {fseToast && <div style={{position:"fixed",top:24,right:24,zIndex:9999,padding:"12px 22px",borderRadius:14,fontSize:14,fontWeight:700,color:"#fff",background:"#0f172a",boxShadow:"0 8px 32px rgba(0,0,0,.25)",animation:"fadeIn .2s"}}>{fseToast}</div>}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
              {[{label:"À transmettre",value:aTransmettre,color:"#b45309",icon:""},{label:"En cours",value:enCours,color:"#6366f1",icon:""},{label:"Acceptées",value:acceptes,color:"#047857",icon:"✓"},{label:"Taux d'accept.",value:`${tauxAccept}%`,color:ACCENT,icon:""}].map(s=>(
                <div key={s.label} style={{...glass,borderRadius:16,padding:"16px 18px"}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase" as const,letterSpacing:".06em",marginBottom:6}}>{s.icon} {s.label}</div>
                  <div style={{fontSize:26,fontWeight:900,color:s.color}}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{background:`linear-gradient(135deg,rgba(0,201,138,0.08),rgba(16,185,129,0.04))`,border:`1px solid rgba(0,201,138,0.20)`,borderRadius:14,padding:"12px 18px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap" as const}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:36,height:36,borderRadius:10,background:ACCENT,display:"grid",placeItems:"center",fontSize:18}}></div>
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:"#1e293b"}}>SESAM-Vitale — Télétransmission AMO</div>
                  <div style={{fontSize:12,color:"#64748b"}}>{totalAMO>0?`${fmt(totalAMO)} accordés · `:""}Terminal connecté · Clé PS active</div>
                </div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#10b981",boxShadow:"0 0 6px #10b981"}}/>
                <span style={{fontSize:12,fontWeight:700,color:"#047857"}}>Connecté</span>
                {aTransmettre>0&&<button onClick={transmettreToutes} style={{padding:"8px 18px",background:ACCENT,color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>Transmettre tout ({aTransmettre})</button>}
              </div>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap" as const}}>
              {(["tous","a_transmettre","en_cours","accepte","partiel","rejete"] as const).map(f=>(
                <button key={f} onClick={()=>setFseFilter(f)} style={{padding:"6px 14px",borderRadius:10,border:`1px solid ${fseFilter===f?ACCENT:"rgba(0,0,0,.08)"}`,background:fseFilter===f?`${ACCENT}15`:"rgba(255,255,255,.8)",color:fseFilter===f?ACCENT:"#64748b",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  {f==="tous"?"Toutes":FSE_STATUT_CONF[f].label}{f!=="tous"&&<span style={{marginLeft:6,fontWeight:900}}>{fses.filter(x=>x.statut===f).length}</span>}
                </button>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {fseFiltred.length===0 ? <div style={{textAlign:"center",padding:"48px 0",color:"#94a3b8",fontSize:14}}>Aucune FSE dans ce filtre</div>
              : fseFiltred.map(fse=>{
                const sc=FSE_STATUT_CONF[fse.statut];
                return (
                  <div key={fse.id} style={{...glass,borderRadius:16,padding:"16px 20px",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap" as const,opacity:fse.statut==="en_cours"?0.75:1,borderLeft:`3px solid ${sc.color}`}}>
                    <div style={{width:40,height:40,borderRadius:12,background:sc.bg,display:"grid",placeItems:"center",fontSize:18,flexShrink:0}}>{sc.icon}</div>
                    <div style={{flex:1,minWidth:180}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap" as const}}>
                        <span style={{fontSize:14,fontWeight:800,color:"#0f172a"}}>{fse.patientPrenom} {fse.patientNom}</span>
                        <span style={{fontSize:11,color:"#94a3b8"}}>{fse.factureNumero}</span>
                        <span style={{fontSize:11,fontWeight:700,color:sc.color,background:sc.bg,padding:"2px 10px",borderRadius:20}}>{sc.label}</span>
                        {fse.lots&&<span style={{fontSize:11,color:"#94a3b8"}}>Lot : {fse.lots}</span>}
                      </div>
                      <div style={{fontSize:12,color:"#64748b",display:"flex",gap:16,flexWrap:"wrap" as const}}>
                        <span>Facture du {new Date(fse.dateFacture).toLocaleDateString("fr-FR")}</span>
                        <span>AMO demandé : <strong>{fmt(fse.montantAMO)}</strong></span>
                        {fse.retourMontant!==undefined&&<span style={{color:fse.statut==="rejete"?"#ef4444":"#047857"}}>AMO accordé : <strong>{fmt(fse.retourMontant)}</strong></span>}
                        {fse.retourRef&&<span style={{fontFamily:"monospace",fontSize:11}}>Réf : {fse.retourRef}</span>}
                      </div>
                      {fse.retourMotifRejet&&<div style={{marginTop:6,fontSize:12,color:"#b91c1c",background:"rgba(239,68,68,.06)",borderRadius:8,padding:"5px 10px",border:"1px solid rgba(239,68,68,.15)"}}>Motif rejet : {fse.retourMotifRejet}</div>}
                      {fse.retourAt&&fse.statut!=="rejete"&&<div style={{marginTop:4,fontSize:11,color:"#94a3b8"}}>Retour NOEMIE le {new Date(fse.retourAt).toLocaleString("fr-FR",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})} · Paiement sous 5j</div>}
                    </div>
                    <div style={{flexShrink:0}}>
                      {fse.statut==="a_transmettre"&&<button onClick={()=>transmettreFse(fse.id)} style={{padding:"9px 18px",background:ACCENT,color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>Transmettre</button>}
                      {fse.statut==="en_cours"&&<div style={{fontSize:12,color:"#6366f1",fontWeight:700,display:"flex",alignItems:"center",gap:6}}><span style={{display:"inline-block",width:12,height:12,borderRadius:"50%",border:"2px solid #6366f1",borderTopColor:"transparent",animation:"spin 1s linear infinite"}}/>Transmission…</div>}
                      {fse.statut==="rejete"&&<button onClick={()=>{saveFses(fses.map(f=>f.id===fse.id?{...f,statut:"a_transmettre" as FseStatut,retourAt:undefined,retourCode:undefined,retourMotifRejet:undefined}:f));}} style={{padding:"8px 14px",background:"rgba(239,68,68,.1)",color:"#b91c1c",border:"1px solid rgba(239,68,68,.2)",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer"}}>↺ Corriger et renvoyer</button>}
                    </div>
                  </div>
                );
              })}
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
          </>
        );
      })()}

      {/* ══════════════════════════════════════════════════
          MODAL MARQUER REÇU
      ══════════════════════════════════════════════════ */}
      {modalEntry && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setModalEntry(null)}>
          <div style={{ ...glass, borderRadius: 20, padding: 28, width: "min(520px, 94vw)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1e293b", marginBottom: 4 }}>Enregistrer le remboursement</div>
            <div style={{ fontSize: 12.5, color: "#64748b", marginBottom: 20 }}>{modalEntry.patientNom} {modalEntry.patientPrenom} · {modalEntry.factureNumero}</div>
            {modalMode !== "mutuelle" && (
              <div style={{ ...glassSubtle, borderRadius: 14, padding: 18, marginBottom: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />Sécurité Sociale (NOEMIE)
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "#64748b" }}>Attendu : {fmt(modalEntry.montantSS)}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div><label style={label}>Date de paiement</label><input type="date" value={mDateSS} onChange={e => setMDateSS(e.target.value)} style={input} /></div>
                  <div><label style={label}>Montant reçu (€)</label><input type="number" value={mMontantSS} onChange={e => setMMontantSS(e.target.value)} style={input} min={0} step={0.01} /></div>
                </div>
                <div><label style={label}>Référence NOEMIE (optionnel)</label><input value={mRefSS} onChange={e => setMRefSS(e.target.value)} style={input} placeholder="NOM-2026-XXXXX" /></div>
              </div>
            )}
            {modalMode !== "ss" && modalEntry.mutuelleStatut !== "N/A" && (
              <div style={{ ...glassSubtle, borderRadius: 14, padding: 18, marginBottom: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />Mutuelle {modalEntry.mutuelleNom ? `— ${modalEntry.mutuelleNom}` : ""}
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "#64748b" }}>Attendu : {fmt(modalEntry.montantMutuelle)}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div><label style={label}>Date de paiement</label><input type="date" value={mDateMutuelle} onChange={e => setMDateMutuelle(e.target.value)} style={input} /></div>
                  <div><label style={label}>Montant reçu (€)</label><input type="number" value={mMontantMutuelle} onChange={e => setMMontantMutuelle(e.target.value)} style={input} min={0} step={0.01} /></div>
                </div>
                <div><label style={label}>Référence virement (optionnel)</label><input value={mRefMutuelle} onChange={e => setMRefMutuelle(e.target.value)} style={input} placeholder="Référence virement mutuelle" /></div>
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <label style={label}>Notes (optionnel)</label>
              <textarea value={mNotes} onChange={e => setMNotes(e.target.value)} style={{ ...input, minHeight: 70, resize: "vertical" }} placeholder="Retenue, franchise, contestation…" />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setModalEntry(null)} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.4)", background: "transparent", color: "#64748b", fontSize: 13, cursor: "pointer" }}>Annuler</button>
              <button onClick={validerModal} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MODAL NOTES
      ══════════════════════════════════════════════════ */}
      {notesModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setNotesModal(null)}>
          <div style={{ ...glass, borderRadius: 18, padding: 24, width: "min(400px,92vw)" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", marginBottom: 4 }}>{notesModal.patientNom} {notesModal.patientPrenom}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>{notesModal.factureNumero}</div>
            <div style={{ fontSize: 13.5, color: "#334155", lineHeight: 1.6 }}>{notesModal.notes}</div>
            <button onClick={() => setNotesModal(null)} style={{ marginTop: 18, padding: "9px 20px", borderRadius: 10, border: "none", background: "#f1f5f9", color: "#475569", fontSize: 13, cursor: "pointer" }}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}
