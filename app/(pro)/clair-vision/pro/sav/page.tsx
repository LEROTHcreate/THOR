"use client";

import { useState, useEffect, useCallback } from "react";
import type { CSSProperties } from "react";
import DraggableWindow from "@/components/ui/DraggableWindow";

/* ── Glass style tokens ─────────────────────────────────────────────────── */
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

const PRIMARY = "#6366f1";
const LS_KEY = "thor_pro_sav";

/* ── Types ───────────────────────────────────────────────────────────────── */
type TicketStatus = "Ouvert" | "En cours" | "Chez fournisseur" | "Résolu" | "Fermé";
type TicketType = "Reparation" | "Reglage" | "Remplacement" | "Garantie" | "Controle" | "Autre";
type TicketPriorite = "Basse" | "Normale" | "Haute" | "Urgente";

interface HistoriqueEntry {
  date: string;
  action: string;
  auteur: string;
}

interface TicketSAV {
  id: string;
  numero: string;
  patientNom: string;
  patientPrenom: string;
  telephone?: string;
  type: TicketType;
  priorite: TicketPriorite;
  status: TicketStatus;
  produit: string;
  serie?: string;
  description: string;
  dateOuverture: string;
  dateEcheance?: string;
  dateResolution?: string;
  technicien?: string;
  fournisseur?: string;
  numeroBon?: string;
  coutReparation?: number;
  sousGarantie: boolean;
  notes?: string;
  historique: HistoriqueEntry[];
}

/* ── Mock data ───────────────────────────────────────────────────────────── */
const MOCK_TICKETS: TicketSAV[] = [
  {
    id: "sav-001",
    numero: "SAV-2025-001",
    patientNom: "Leblanc",
    patientPrenom: "Marie",
    telephone: "06 12 34 56 78",
    type: "Reparation",
    priorite: "Haute",
    status: "Ouvert",
    produit: "Ray-Ban RB3025",
    description: "Réparation branche cassée",
    dateOuverture: "2025-03-12T09:00:00.000Z",
    sousGarantie: false,
    historique: [{ date: "2025-03-12T09:00:00.000Z", action: "Ticket créé", auteur: "Système" }],
  },
  {
    id: "sav-002",
    numero: "SAV-2025-002",
    patientNom: "Renaud",
    patientPrenom: "Paul",
    telephone: "06 98 76 54 32",
    type: "Reparation",
    priorite: "Normale",
    status: "En cours",
    produit: "Essilor Varilux X 1.67",
    fournisseur: "Essilor",
    description: "Rayure centrale verre gauche",
    dateOuverture: "2025-03-08T10:30:00.000Z",
    sousGarantie: true,
    historique: [
      { date: "2025-03-08T10:30:00.000Z", action: "Ticket créé", auteur: "Système" },
      { date: "2025-03-09T11:00:00.000Z", action: "Envoyé chez Essilor", auteur: "Opticien" },
    ],
  },
  {
    id: "sav-003",
    numero: "SAV-2025-003",
    patientNom: "Morel",
    patientPrenom: "Isabelle",
    telephone: "07 11 22 33 44",
    type: "Reglage",
    priorite: "Basse",
    status: "Résolu",
    produit: "Lindberg Spirit Ti",
    description: "Ajustement nez",
    dateOuverture: "2025-03-01T08:00:00.000Z",
    dateResolution: "2025-03-01T09:30:00.000Z",
    technicien: "Sophie Martin",
    sousGarantie: false,
    historique: [
      { date: "2025-03-01T08:00:00.000Z", action: "Ticket créé", auteur: "Système" },
      { date: "2025-03-01T09:30:00.000Z", action: "Réglage effectué — résolu", auteur: "Sophie Martin" },
    ],
  },
  {
    id: "sav-004",
    numero: "SAV-2025-004",
    patientNom: "Petit",
    patientPrenom: "Claire",
    telephone: "06 55 44 33 22",
    type: "Remplacement",
    priorite: "Normale",
    status: "Chez fournisseur",
    produit: "Oakley Flak 2.0",
    description: "Remplacement plaquettes",
    dateOuverture: "2025-02-28T14:00:00.000Z",
    numeroBon: "ESS-2025-4821",
    sousGarantie: false,
    historique: [
      { date: "2025-02-28T14:00:00.000Z", action: "Ticket créé", auteur: "Système" },
      { date: "2025-03-01T10:00:00.000Z", action: "Envoyé chez fournisseur — Bon ESS-2025-4821", auteur: "Opticien" },
    ],
  },
  {
    id: "sav-005",
    numero: "SAV-2025-005",
    patientNom: "Martin",
    patientPrenom: "Antoine",
    telephone: "06 77 88 99 00",
    type: "Reparation",
    priorite: "Urgente",
    status: "Ouvert",
    produit: "Tom Ford TF5506",
    description: "Ressort charnière",
    dateOuverture: "2025-03-15T11:00:00.000Z",
    sousGarantie: false,
    historique: [{ date: "2025-03-15T11:00:00.000Z", action: "Ticket créé", auteur: "Système" }],
  },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const STATUS_COLORS: Record<TicketStatus, { color: string; bg: string }> = {
  "Ouvert":           { color: "#ef4444", bg: "rgba(239,68,68,0.10)" },
  "En cours":         { color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
  "Chez fournisseur": { color: "#8b5cf6", bg: "rgba(139,92,246,0.10)" },
  "Résolu":           { color: "#10b981", bg: "rgba(16,185,129,0.10)" },
  "Fermé":            { color: "#6b7280", bg: "rgba(107,114,128,0.10)" },
};

const PRIORITE_COLORS: Record<TicketPriorite, { color: string; bg: string }> = {
  "Urgente": { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  "Haute":   { color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  "Normale": { color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  "Basse":   { color: "#6b7280", bg: "rgba(107,114,128,0.10)" },
};

const TYPE_LABELS: Record<TicketType, string> = {
  Reparation:   "Réparation",
  Reglage:      "Réglage",
  Remplacement: "Remplacement",
  Garantie:     "Garantie",
  Controle:     "Contrôle",
  Autre:        "Autre",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function genId() {
  return `sav-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function genNumero(tickets: TicketSAV[]) {
  const year = new Date().getFullYear();
  const visionTickets = tickets.filter(t => t.numero.startsWith("SAV-") && !t.numero.startsWith("SAV-AUD-"));
  const max = visionTickets.reduce((acc, t) => {
    const n = parseInt(t.numero.split("-")[2] ?? "0", 10);
    return n > acc ? n : acc;
  }, 0);
  return `SAV-${year}-${String(max + 1).padStart(3, "0")}`;
}

function loadTickets(): TicketSAV[] {
  if (typeof window === "undefined") return MOCK_TICKETS;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as TicketSAV[]) : MOCK_TICKETS;
  } catch {
    return MOCK_TICKETS;
  }
}

function saveTickets(tickets: TicketSAV[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(tickets));
}

/* ── Shared badge ─────────────────────────────────────────────────────────── */
function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ color, background: bg }}
    >
      {label}
    </span>
  );
}

/* ── KPI Card ─────────────────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="rounded-2xl p-4" style={glass}>
      <div className="text-xs text-slate-500 font-medium mb-1">{label}</div>
      <div className="text-2xl font-bold" style={{ color: accent ?? PRIMARY }}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

/* ── Icon Wrench ─────────────────────────────────────────────────────────── */
function IconWrench({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
    </svg>
  );
}

/* ── Nouveau Ticket Modal ─────────────────────────────────────────────────── */
function NouveauTicketModal({ tickets, onSave, onClose }: { tickets: TicketSAV[]; onSave: (t: TicketSAV) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    patientNom: "",
    patientPrenom: "",
    telephone: "",
    type: "Reparation" as TicketType,
    priorite: "Normale" as TicketPriorite,
    produit: "",
    serie: "",
    description: "",
    dateEcheance: "",
    sousGarantie: false,
    technicien: "",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const now = new Date().toISOString();
    const ticket: TicketSAV = {
      id: genId(),
      numero: genNumero(tickets),
      patientNom: form.patientNom,
      patientPrenom: form.patientPrenom,
      telephone: form.telephone || undefined,
      type: form.type,
      priorite: form.priorite,
      status: "Ouvert",
      produit: form.produit,
      serie: form.serie || undefined,
      description: form.description,
      dateOuverture: now,
      dateEcheance: form.dateEcheance || undefined,
      technicien: form.technicien || undefined,
      sousGarantie: form.sousGarantie,
      historique: [{ date: now, action: "Ticket créé", auteur: form.technicien || "Opticien" }],
    };
    onSave(ticket);
  }

  const inputCls = "w-full rounded-xl border-0 bg-white/70 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50";
  const selectCls = "w-full rounded-xl border-0 bg-white/70 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/50";
  const labelCls = "block text-xs font-semibold text-slate-500 mb-1";

  return (
    <DraggableWindow
      title="Nouveau ticket SAV"
      onClose={onClose}
      defaultWidth={560}
      defaultHeight={640}
    >
      <div className="p-6" style={{ background: "var(--glass-card-bg)" }}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nom *</label>
            <input className={inputCls} value={form.patientNom} onChange={e => set("patientNom", e.target.value)} placeholder="Leblanc" required />
          </div>
          <div>
            <label className={labelCls}>Prénom *</label>
            <input className={inputCls} value={form.patientPrenom} onChange={e => set("patientPrenom", e.target.value)} placeholder="Marie" required />
          </div>
        </div>
        <div>
          <label className={labelCls}>Téléphone</label>
          <input className={inputCls} value={form.telephone} onChange={e => set("telephone", e.target.value)} placeholder="06 12 34 56 78" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Type *</label>
            <select className={selectCls} value={form.type} onChange={e => set("type", e.target.value as TicketType)} required>
              {(Object.keys(TYPE_LABELS) as TicketType[]).map(k => (
                <option key={k} value={k}>{TYPE_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Priorité *</label>
            <select className={selectCls} value={form.priorite} onChange={e => set("priorite", e.target.value as TicketPriorite)} required>
              {(["Basse", "Normale", "Haute", "Urgente"] as TicketPriorite[]).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Produit / Monture *</label>
          <input className={inputCls} value={form.produit} onChange={e => set("produit", e.target.value)} placeholder="Ray-Ban RB3025" required />
        </div>
        <div>
          <label className={labelCls}>Numéro de série</label>
          <input className={inputCls} value={form.serie} onChange={e => set("serie", e.target.value)} placeholder="SN-XXXXXXX (optionnel)" />
        </div>
        <div>
          <label className={labelCls}>Description *</label>
          <textarea className={`${inputCls} resize-none`} rows={3} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Décrivez le problème..." required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Date d'échéance</label>
            <input type="date" className={inputCls} value={form.dateEcheance} onChange={e => set("dateEcheance", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Technicien assigné</label>
            <input className={inputCls} value={form.technicien} onChange={e => set("technicien", e.target.value)} placeholder="Sophie Martin" />
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl" style={glassSubtle}>
          <button
            type="button"
            onClick={() => set("sousGarantie", !form.sousGarantie)}
            className="relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200"
            style={{ background: form.sousGarantie ? PRIMARY : "rgba(203,213,225,0.8)" }}
          >
            <span
              className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 mt-0.5"
              style={{ transform: form.sousGarantie ? "translateX(18px)" : "translateX(2px)" }}
            />
          </button>
          <span className="text-sm text-slate-700 font-medium">Sous garantie</span>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-white/60" style={glassSubtle}>
            Annuler
          </button>
          <button type="submit" className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ background: `linear-gradient(135deg, ${PRIMARY}, #4f46e5)` }}>
            Créer le ticket
          </button>
        </div>
      </form>
      </div>
    </DraggableWindow>
  );
}

/* ── Detail / Edit Modal ─────────────────────────────────────────────────── */
function DetailModal({ ticket, onSave, onDelete, onClose }: { ticket: TicketSAV; onSave: (t: TicketSAV) => void; onDelete: (id: string) => void; onClose: () => void }) {
  const [edited, setEdited] = useState<TicketSAV>({ ...ticket, historique: [...ticket.historique] });
  const [noteInput, setNoteInput] = useState("");
  const [bonInput, setBonInput] = useState("");
  const [showBonPrompt, setShowBonPrompt] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function update<K extends keyof TicketSAV>(k: K, v: TicketSAV[K]) {
    setEdited(prev => ({ ...prev, [k]: v }));
  }

  function addNote() {
    if (!noteInput.trim()) return;
    const entry: HistoriqueEntry = { date: new Date().toISOString(), action: noteInput.trim(), auteur: edited.technicien || "Opticien" };
    setEdited(prev => ({ ...prev, historique: [...prev.historique, entry] }));
    setNoteInput("");
  }

  function resolveTicket() {
    const now = new Date().toISOString();
    const entry: HistoriqueEntry = { date: now, action: "Ticket résolu", auteur: edited.technicien || "Opticien" };
    setEdited(prev => ({
      ...prev,
      status: "Résolu",
      dateResolution: now,
      historique: [...prev.historique, entry],
    }));
  }

  function envoyerFournisseur() {
    if (showBonPrompt) {
      const now = new Date().toISOString();
      const entry: HistoriqueEntry = {
        date: now,
        action: `Envoyé chez fournisseur${bonInput ? ` — Bon ${bonInput}` : ""}`,
        auteur: edited.technicien || "Opticien",
      };
      setEdited(prev => ({
        ...prev,
        status: "Chez fournisseur",
        numeroBon: bonInput || prev.numeroBon,
        historique: [...prev.historique, entry],
      }));
      setShowBonPrompt(false);
      setBonInput("");
    } else {
      setShowBonPrompt(true);
    }
  }

  const inputCls = "w-full rounded-xl border-0 bg-white/70 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50";
  const selectCls = "w-full rounded-xl border-0 bg-white/70 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/50";
  const labelCls = "block text-xs font-semibold text-slate-500 mb-1";

  return (
    <DraggableWindow
      title={`Ticket SAV — ${edited.patientPrenom} ${edited.patientNom}`}
      badge={edited.numero}
      onClose={onClose}
      defaultWidth={620}
      defaultHeight={680}
    >
      <div className="p-6" style={{ background: "var(--glass-card-bg)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Badge label={edited.priorite} {...PRIORITE_COLORS[edited.priorite]} />
        <Badge label={edited.status} {...STATUS_COLORS[edited.status]} />
        <span className="text-sm text-slate-500 ml-1">{edited.produit}</span>
      </div>

      <div className="space-y-4">
        {/* Status + Type row */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Statut</label>
            <select className={selectCls} value={edited.status} onChange={e => update("status", e.target.value as TicketStatus)}>
              {(["Ouvert", "En cours", "Chez fournisseur", "Résolu", "Fermé"] as TicketStatus[]).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <select className={selectCls} value={edited.type} onChange={e => update("type", e.target.value as TicketType)}>
              {(Object.keys(TYPE_LABELS) as TicketType[]).map(k => (
                <option key={k} value={k}>{TYPE_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Priorité</label>
            <select className={selectCls} value={edited.priorite} onChange={e => update("priorite", e.target.value as TicketPriorite)}>
              {(["Basse", "Normale", "Haute", "Urgente"] as TicketPriorite[]).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Patient info */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nom patient</label>
            <input className={inputCls} value={edited.patientNom} onChange={e => update("patientNom", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Prénom patient</label>
            <input className={inputCls} value={edited.patientPrenom} onChange={e => update("patientPrenom", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Téléphone</label>
            <input className={inputCls} value={edited.telephone ?? ""} onChange={e => update("telephone", e.target.value || undefined)} />
          </div>
          <div>
            <label className={labelCls}>Technicien</label>
            <input className={inputCls} value={edited.technicien ?? ""} onChange={e => update("technicien", e.target.value || undefined)} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Produit</label>
          <input className={inputCls} value={edited.produit} onChange={e => update("produit", e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Numéro de série</label>
            <input className={inputCls} value={edited.serie ?? ""} onChange={e => update("serie", e.target.value || undefined)} />
          </div>
          <div>
            <label className={labelCls}>Coût réparation (€)</label>
            <input type="number" className={inputCls} value={edited.coutReparation ?? ""} onChange={e => update("coutReparation", e.target.value ? parseFloat(e.target.value) : undefined)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Fournisseur</label>
            <input className={inputCls} value={edited.fournisseur ?? ""} onChange={e => update("fournisseur", e.target.value || undefined)} />
          </div>
          <div>
            <label className={labelCls}>N° bon retour</label>
            <input className={inputCls} value={edited.numeroBon ?? ""} onChange={e => update("numeroBon", e.target.value || undefined)} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea className={`${inputCls} resize-none`} rows={2} value={edited.description} onChange={e => update("description", e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Date d'échéance</label>
            <input type="date" className={inputCls} value={edited.dateEcheance?.slice(0, 10) ?? ""} onChange={e => update("dateEcheance", e.target.value || undefined)} />
          </div>
          <div>
            <label className={labelCls}>Date résolution</label>
            <input type="date" className={inputCls} value={edited.dateResolution?.slice(0, 10) ?? ""} onChange={e => update("dateResolution", e.target.value || undefined)} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea className={`${inputCls} resize-none`} rows={2} value={edited.notes ?? ""} onChange={e => update("notes", e.target.value || undefined)} />
        </div>

        {/* Sous garantie toggle */}
        <div className="flex items-center gap-3 p-3 rounded-xl" style={glassSubtle}>
          <button
            type="button"
            onClick={() => update("sousGarantie", !edited.sousGarantie)}
            className="relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200"
            style={{ background: edited.sousGarantie ? PRIMARY : "rgba(203,213,225,0.8)" }}
          >
            <span
              className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 mt-0.5"
              style={{ transform: edited.sousGarantie ? "translateX(18px)" : "translateX(2px)" }}
            />
          </button>
          <span className="text-sm text-slate-700 font-medium">Sous garantie</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          {edited.status !== "Résolu" && edited.status !== "Fermé" && (
            <button
              onClick={resolveTicket}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "#10b981" }}
            >
              Marquer résolu
            </button>
          )}
          {edited.status !== "Chez fournisseur" && edited.status !== "Résolu" && edited.status !== "Fermé" && (
            <button
              onClick={envoyerFournisseur}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}
            >
              Envoyer chez fournisseur
            </button>
          )}
        </div>

        {/* Bon prompt */}
        {showBonPrompt && (
          <div className="rounded-xl p-3 space-y-2" style={glassSubtle}>
            <div className="text-xs font-semibold text-slate-600">Numéro de bon de retour fournisseur</div>
            <div className="flex gap-2">
              <input className={`${inputCls} flex-1`} value={bonInput} onChange={e => setBonInput(e.target.value)} placeholder="ESS-2025-XXXX" />
              <button onClick={envoyerFournisseur} className="rounded-xl px-3 py-2 text-sm font-semibold text-white" style={{ background: `linear-gradient(135deg, #8b5cf6, #6d28d9)` }}>
                Confirmer
              </button>
              <button onClick={() => setShowBonPrompt(false)} className="rounded-xl px-3 py-2 text-sm font-medium text-slate-500" style={glassSubtle}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Historique */}
        <div>
          <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Historique</div>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {[...edited.historique].reverse().map((h, i) => (
              <div key={i} className="flex gap-3 text-xs">
                <div className="mt-0.5 h-2 w-2 rounded-full flex-shrink-0 mt-1" style={{ background: PRIMARY }} />
                <div className="flex-1">
                  <span className="font-medium text-slate-700">{h.action}</span>
                  <span className="text-slate-400 ml-2">{fmtDate(h.date)} — {h.auteur}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add note */}
        <div className="rounded-xl p-3" style={glassSubtle}>
          <div className="text-xs font-semibold text-slate-600 mb-2">Ajouter une note à l'historique</div>
          <div className="flex gap-2">
            <input
              className={`${inputCls} flex-1`}
              value={noteInput}
              onChange={e => setNoteInput(e.target.value)}
              placeholder="Ex: Pièce commandée, délai 5 jours..."
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addNote(); }}}
            />
            <button
              onClick={addNote}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${PRIMARY}, #4f46e5)` }}
            >
              Ajouter
            </button>
          </div>
        </div>

        {/* Delete confirmation */}
        {confirmDelete ? (
          <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.20)" }}>
            <div className="text-xs font-semibold text-red-600">Supprimer définitivement ce ticket ?</div>
            <div className="flex gap-2">
              <button onClick={() => { onDelete(ticket.id); onClose(); }} className="flex-1 rounded-xl py-2 text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>Confirmer la suppression</button>
              <button onClick={() => setConfirmDelete(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-500" style={glassSubtle}>Annuler</button>
            </div>
          </div>
        ) : null}

        {/* Save/Cancel/Delete */}
        <div className="flex gap-3 pt-1">
          <button onClick={() => setConfirmDelete(true)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 hover:text-red-600 transition-colors" style={glassSubtle} title="Supprimer ce ticket">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
          </button>
          <button onClick={onClose} className="flex-1 rounded-xl py-2.5 text-sm font-medium text-slate-600" style={glassSubtle}>
            Annuler
          </button>
          <button
            onClick={() => { onSave(edited); onClose(); }}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${PRIMARY}, #4f46e5)` }}
          >
            Enregistrer
          </button>
        </div>
      </div>
      </div>
    </DraggableWindow>
  );
}

/* ── Ticket Card ─────────────────────────────────────────────────────────── */
function TicketCard({ ticket, onView, onResolve }: { ticket: TicketSAV; onView: () => void; onResolve: () => void }) {
  const canResolve = ticket.status !== "Résolu" && ticket.status !== "Fermé";
  return (
    <div className="rounded-2xl p-4" style={glass}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Top badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className="text-[11px] font-bold text-slate-400">{ticket.numero}</span>
            <Badge label={ticket.priorite} {...PRIORITE_COLORS[ticket.priorite]} />
            <Badge label={ticket.status} {...STATUS_COLORS[ticket.status]} />
            <Badge label={TYPE_LABELS[ticket.type]} color={PRIMARY} bg="rgba(99,102,241,0.10)" />
            {ticket.sousGarantie && <Badge label="Garantie" color="#10b981" bg="rgba(16,185,129,0.10)" />}
          </div>

          {/* Patient + Product */}
          <div className="font-semibold text-slate-800 text-sm">{ticket.patientPrenom} {ticket.patientNom}</div>
          <div className="text-sm text-slate-500 mt-0.5">{ticket.produit}</div>
          <div className="text-xs text-slate-400 mt-1 line-clamp-1">{ticket.description}</div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
            <span>Ouvert le {fmtDate(ticket.dateOuverture)}</span>
            {ticket.dateEcheance && <span className="text-amber-500">Échéance {fmtDate(ticket.dateEcheance)}</span>}
            {ticket.technicien && <span>Tech: {ticket.technicien}</span>}
            {ticket.fournisseur && <span>Fourn: {ticket.fournisseur}</span>}
            {ticket.numeroBon && <span>Bon: {ticket.numeroBon}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={onView}
            className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${PRIMARY}, #4f46e5)` }}
          >
            Voir
          </button>
          {canResolve && (
            <button
              onClick={onResolve}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "#10b981" }}
            >
              Résoudre
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function SAVPage() {
  const [tickets, setTickets] = useState<TicketSAV[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "Tous">("Tous");
  const [typeFilter, setTypeFilter] = useState<TicketType | "Tous">("Tous");
  const [prioriteFilter, setPrioriteFilter] = useState<TicketPriorite | "Tous">("Tous");
  const [selectedTicket, setSelectedTicket] = useState<TicketSAV | null>(null);
  const [showNouveau, setShowNouveau] = useState(false);

  useEffect(() => {
    setTickets(loadTickets());
  }, []);

  const persist = useCallback((updated: TicketSAV[]) => {
    setTickets(updated);
    saveTickets(updated);
  }, []);

  function handleSave(updated: TicketSAV) {
    persist(tickets.map(t => t.id === updated.id ? updated : t));
  }

  function handleCreate(ticket: TicketSAV) {
    const updated = [ticket, ...tickets];
    persist(updated);
    setShowNouveau(false);
  }

  function handleDelete(id: string) {
    persist(tickets.filter(t => t.id !== id));
    setSelectedTicket(null);
  }

  function handleResolve(id: string) {
    const now = new Date().toISOString();
    persist(tickets.map(t =>
      t.id === id
        ? { ...t, status: "Résolu" as TicketStatus, dateResolution: now, historique: [...t.historique, { date: now, action: "Ticket résolu (raccourci)", auteur: "Opticien" }] }
        : t
    ));
  }

  /* KPIs */
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const ouverts = tickets.filter(t => t.status === "Ouvert").length;
  const enCours = tickets.filter(t => t.status === "En cours").length;
  const resolus = tickets.filter(t => {
    if (t.status !== "Résolu" || !t.dateResolution) return false;
    const d = new Date(t.dateResolution);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const resolvedWithTime = tickets.filter(t => t.dateResolution);
  const avgDays = resolvedWithTime.length
    ? Math.round(resolvedWithTime.reduce((acc, t) => {
        const diff = new Date(t.dateResolution!).getTime() - new Date(t.dateOuverture).getTime();
        return acc + diff / 86400000;
      }, 0) / resolvedWithTime.length)
    : 0;

  /* Filtered tickets */
  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${t.patientNom} ${t.patientPrenom} ${t.produit} ${t.numero}`.toLowerCase().includes(q);
    const matchStatus = statusFilter === "Tous" || t.status === statusFilter;
    const matchType = typeFilter === "Tous" || t.type === typeFilter;
    const matchPriorite = prioriteFilter === "Tous" || t.priorite === prioriteFilter;
    return matchSearch && matchStatus && matchType && matchPriorite;
  });

  const STATUS_PILLS: (TicketStatus | "Tous")[] = ["Tous", "Ouvert", "En cours", "Chez fournisseur", "Résolu", "Fermé"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <IconWrench className="w-6 h-6" style={{ color: PRIMARY } as CSSProperties} />
            SAV & Suivi
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestion des tickets de service après-vente</p>
        </div>
        <button
          onClick={() => setShowNouveau(true)}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${PRIMARY}, #4f46e5)` }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nouveau ticket
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Tickets ouverts" value={ouverts} accent={ouverts > 5 ? "#ef4444" : PRIMARY} sub="en attente" />
        <KpiCard label="En cours" value={enCours} accent="#f59e0b" sub="en traitement" />
        <KpiCard label="Résolus ce mois" value={resolus} accent="#10b981" sub={`sur ${now.toLocaleString("fr-FR", { month: "long" })}`} />
        <KpiCard label="Délai moyen" value={`${avgDays}j`} accent="#8b5cf6" sub="de résolution" />
      </div>

      {/* Filter bar */}
      <div className="rounded-2xl p-4 space-y-3" style={glass}>
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            className="w-full rounded-xl border-0 bg-white/70 pl-9 pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
            placeholder="Rechercher par patient, produit, numéro..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_PILLS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="rounded-full px-3 py-1 text-xs font-semibold transition-all"
              style={statusFilter === s
                ? { background: PRIMARY, color: "white" }
                : { ...glassSubtle, color: "#64748b" }
              }
            >
              {s}
            </button>
          ))}
        </div>

        {/* Type + Priorité dropdowns */}
        <div className="flex gap-3 flex-wrap">
          <select
            className="rounded-xl border-0 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as TicketType | "Tous")}
          >
            <option value="Tous">Tous les types</option>
            {(Object.keys(TYPE_LABELS) as TicketType[]).map(k => (
              <option key={k} value={k}>{TYPE_LABELS[k]}</option>
            ))}
          </select>
          <select
            className="rounded-xl border-0 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
            value={prioriteFilter}
            onChange={e => setPrioriteFilter(e.target.value as TicketPriorite | "Tous")}
          >
            <option value="Tous">Toutes priorités</option>
            {(["Urgente", "Haute", "Normale", "Basse"] as TicketPriorite[]).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ticket list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={glass}>
          <IconWrench className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <div className="text-slate-500 font-medium">Aucun ticket trouvé</div>
          <div className="text-xs text-slate-400 mt-1">Modifiez vos filtres ou créez un nouveau ticket</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ticket => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onView={() => setSelectedTicket(ticket)}
              onResolve={() => handleResolve(ticket.id)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showNouveau && (
        <NouveauTicketModal tickets={tickets} onSave={handleCreate} onClose={() => setShowNouveau(false)} />
      )}
      {selectedTicket && (
        <DetailModal
          ticket={selectedTicket}
          onSave={updated => { handleSave(updated); setSelectedTicket(updated); }}
          onDelete={handleDelete}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
}
