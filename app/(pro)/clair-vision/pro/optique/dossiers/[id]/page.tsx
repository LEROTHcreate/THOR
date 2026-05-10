"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import type { CSSProperties } from "react";

/* ── Design system ─────────────────────────────────────────────────────── */
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

/* ── Types ─────────────────────────────────────────────────────────────── */
type DossierStatus = "Prise en charge" | "En commande" | "Prêt" | "Livré" | "Annulé";
type DossierType = "montures-verres" | "lentilles" | "basse-vision" | "autre";

interface DossierLigne {
  designation: string;
  marque: string;
  reference?: string;
  prixTTC: number;
  priseEnChargeSS: number;
  priseEnChargeMutuelle: number;
}

interface Dossier {
  id: string;
  numero: string;
  patientNom: string;
  patientPrenom: string;
  patientId?: string;
  dateCreation: string;
  dateLivraison?: string;
  status: DossierStatus;
  type: DossierType;
  ordonnanceId?: string;
  lignes: DossierLigne[];
  notes?: string;
  praticien?: string;
  montantTotal: number;
  montantSS: number;
  montantMutuelle: number;
  resteACharge: number;
  devisId?: string;
}

interface HistoriqueItem {
  date: string;
  status: DossierStatus;
  user: string;
  note?: string;
}

const STORAGE_KEY = "thor_pro_dossiers";
const HISTORY_KEY = "thor_pro_dossiers_history";

function loadDossiers(): Dossier[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Dossier[]) : [];
  } catch { return []; }
}

function saveDossiers(list: Dossier[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function loadHistory(id: string): HistoriqueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${HISTORY_KEY}_${id}`);
    return raw ? (JSON.parse(raw) as HistoriqueItem[]) : [];
  } catch { return []; }
}

function saveHistory(id: string, history: HistoriqueItem[]) {
  localStorage.setItem(`${HISTORY_KEY}_${id}`, JSON.stringify(history));
}

function recalcTotals(lignes: DossierLigne[]): Pick<Dossier, "montantTotal" | "montantSS" | "montantMutuelle" | "resteACharge"> {
  const montantTotal = lignes.reduce((s, l) => s + l.prixTTC, 0);
  const montantSS = lignes.reduce((s, l) => s + l.priseEnChargeSS, 0);
  const montantMutuelle = lignes.reduce((s, l) => s + l.priseEnChargeMutuelle, 0);
  const resteACharge = Math.max(0, montantTotal - montantSS - montantMutuelle);
  return { montantTotal, montantSS, montantMutuelle, resteACharge };
}

/* ── Status config ─────────────────────────────────────────────────────── */
const ALL_STATUSES: DossierStatus[] = ["Prise en charge", "En commande", "Prêt", "Livré", "Annulé"];

const statusBadge: Record<DossierStatus, string> = {
  "Prise en charge": "bg-indigo-50 text-indigo-600 ring-indigo-200",
  "En commande":     "bg-amber-50 text-amber-600 ring-amber-200",
  "Prêt":            "bg-[#F0FDF4] text-[#15803D] ring-[#BBF7D0]",
  "Livré":           "bg-slate-50 text-slate-600 ring-slate-200",
  "Annulé":          "bg-red-50 text-red-500 ring-red-200",
};

const statusDot: Record<DossierStatus, string> = {
  "Prise en charge": "bg-[#6366f1]",
  "En commande":     "bg-[#f59e0b]",
  "Prêt":            "bg-[#10b981]",
  "Livré":           "bg-slate-400",
  "Annulé":          "bg-[#ef4444]",
};

const TYPE_LABELS: Record<DossierType, string> = {
  "montures-verres": "Montures & Verres",
  "lentilles":       "Lentilles",
  "basse-vision":    "Basse vision",
  "autre":           "Autre",
};

/* ── Icons ─────────────────────────────────────────────────────────────── */
function IconX({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;
}
function IconPlus({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>;
}
function IconCheck({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>;
}
function IconEdit({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>;
}
function IconArrowLeft({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>;
}
function IconTrash({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
}

/* ── Financial Summary Card ────────────────────────────────────────────── */
function FinancialCard({ dossier }: { dossier: Dossier }) {
  const racColor =
    dossier.resteACharge <= 50
      ? "text-[#10b981]"
      : dossier.resteACharge <= 150
      ? "text-[#f59e0b]"
      : "text-[#ef4444]";

  return (
    <div className="rounded-2xl p-5 space-y-3" style={glass}>
      <div className="text-sm font-semibold text-slate-800 mb-1">Résumé financier</div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Montant total TTC</span>
          <span className="font-semibold text-slate-800">{dossier.montantTotal.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Prise en charge SS</span>
          <span className="font-medium text-[#10b981]">−{dossier.montantSS.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Prise en charge Mutuelle</span>
          <span className="font-medium text-[#6366f1]">−{dossier.montantMutuelle.toFixed(2)} €</span>
        </div>
        <div className="pt-2 border-t border-slate-200/60">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-700">Reste à charge</span>
            <span className={`text-lg font-bold ${racColor}`}>{dossier.resteACharge.toFixed(2)} €</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Status Stepper ────────────────────────────────────────────────────── */
function StatusStepper({
  current,
  onChange,
}: {
  current: DossierStatus;
  onChange: (s: DossierStatus) => void;
}) {
  const mainFlow: DossierStatus[] = ["Prise en charge", "En commande", "Prêt", "Livré"];
  const currentIdx = mainFlow.indexOf(current);

  return (
    <div className="rounded-2xl p-5" style={glass}>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Workflow</div>
      {/* Main stepper */}
      <div className="flex items-center gap-0 overflow-x-auto pb-1">
        {mainFlow.map((s, idx) => {
          const isActive = s === current;
          const isDone = currentIdx > idx;
          const isCancelled = current === "Annulé";
          return (
            <div key={s} className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => onChange(s)}
                title={`Passer à ${s}`}
                className={`flex flex-col items-center gap-1 flex-1 min-w-0 px-1 py-1 rounded-xl transition-all ${
                  isActive && !isCancelled
                    ? "opacity-100"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isCancelled
                      ? "border-slate-200 bg-white"
                      : isDone
                      ? "border-[#10b981] bg-[#10b981]"
                      : isActive
                      ? "border-[#6366f1] bg-[#6366f1]"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {isDone && !isCancelled ? (
                    <IconCheck className="w-4 h-4 text-white" />
                  ) : isActive && !isCancelled ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-white" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-200" />
                  )}
                </div>
                <span className={`text-[10px] font-semibold text-center leading-tight ${
                  isActive && !isCancelled ? "text-[#6366f1]" : isDone && !isCancelled ? "text-[#10b981]" : "text-slate-400"
                }`}>
                  {s}
                </span>
              </button>
              {idx < mainFlow.length - 1 && (
                <div className={`h-0.5 w-4 flex-shrink-0 rounded-full transition-all ${
                  isDone && !isCancelled ? "bg-[#10b981]" : "bg-slate-200"
                }`} />
              )}
            </div>
          );
        })}
      </div>
      {/* Annulé button separate */}
      {current !== "Annulé" ? (
        <button
          onClick={() => onChange("Annulé")}
          className="mt-3 text-xs text-red-400 hover:text-red-600 transition-colors font-medium underline underline-offset-2"
        >
          Annuler le dossier
        </button>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-500 ring-1 ring-red-200">
            Annulé
          </span>
          <button
            onClick={() => onChange("Prise en charge")}
            className="text-xs text-[#6366f1] hover:underline font-medium"
          >
            Réactiver
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Ligne Form (inline) ───────────────────────────────────────────────── */
const emptyLigne: DossierLigne = {
  designation: "",
  marque: "",
  reference: "",
  prixTTC: 0,
  priseEnChargeSS: 0,
  priseEnChargeMutuelle: 0,
};

function LigneForm({
  onAdd,
  onCancel,
}: {
  onAdd: (l: DossierLigne) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<DossierLigne>({ ...emptyLigne });
  const [err, setErr] = useState("");

  function set<K extends keyof DossierLigne>(k: K, v: DossierLigne[K]) {
    setForm(p => ({ ...p, [k]: v }));
    setErr("");
  }

  function submit() {
    if (!form.designation.trim()) { setErr("La désignation est requise."); return; }
    onAdd({ ...form, reference: form.reference?.trim() || undefined });
  }

  return (
    <tr className="bg-indigo-50/40">
      <td className="px-4 py-2">
        <input
          value={form.designation}
          onChange={e => set("designation", e.target.value)}
          placeholder="Désignation *"
          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800 outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/20"
        />
      </td>
      <td className="px-4 py-2">
        <input
          value={form.marque}
          onChange={e => set("marque", e.target.value)}
          placeholder="Marque"
          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800 outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/20"
        />
      </td>
      <td className="px-4 py-2">
        <input
          value={form.reference ?? ""}
          onChange={e => set("reference", e.target.value)}
          placeholder="Réf."
          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800 outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/20"
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="number" min="0" step="0.01"
          value={form.prixTTC}
          onChange={e => set("prixTTC", parseFloat(e.target.value) || 0)}
          className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-right text-slate-800 outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/20"
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="number" min="0" step="0.01"
          value={form.priseEnChargeSS}
          onChange={e => set("priseEnChargeSS", parseFloat(e.target.value) || 0)}
          className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-right text-slate-800 outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/20"
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="number" min="0" step="0.01"
          value={form.priseEnChargeMutuelle}
          onChange={e => set("priseEnChargeMutuelle", parseFloat(e.target.value) || 0)}
          className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-right text-slate-800 outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/20"
        />
      </td>
      <td className="px-4 py-2 text-right font-mono text-sm text-slate-600">
        {Math.max(0, form.prixTTC - form.priseEnChargeSS - form.priseEnChargeMutuelle).toFixed(2)} €
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={submit}
            className="rounded-lg bg-[#6366f1] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#4f46e5] transition-colors"
          >
            Ajouter
          </button>
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            <IconX className="w-3.5 h-3.5" />
          </button>
        </div>
        {err && <p className="mt-1 text-[10px] text-red-500">{err}</p>}
      </td>
    </tr>
  );
}

/* ── Edit Modal ────────────────────────────────────────────────────────── */
interface EditForm {
  patientNom: string;
  patientPrenom: string;
  type: DossierType;
  praticien: string;
  notes: string;
  dateLivraison: string;
  ordonnanceId: string;
}

function EditModal({
  dossier,
  onSave,
  onClose,
}: {
  dossier: Dossier;
  onSave: (updates: Partial<Dossier>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<EditForm>({
    patientNom: dossier.patientNom,
    patientPrenom: dossier.patientPrenom,
    type: dossier.type,
    praticien: dossier.praticien ?? "",
    notes: dossier.notes ?? "",
    dateLivraison: dossier.dateLivraison ? dossier.dateLivraison.slice(0, 10) : "",
    ordonnanceId: dossier.ordonnanceId ?? "",
  });

  function set<K extends keyof EditForm>(k: K, v: EditForm[K]) {
    setForm(p => ({ ...p, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      patientNom: form.patientNom.trim(),
      patientPrenom: form.patientPrenom.trim(),
      type: form.type,
      praticien: form.praticien.trim() || undefined,
      notes: form.notes.trim() || undefined,
      dateLivraison: form.dateLivraison || undefined,
      ordonnanceId: form.ordonnanceId.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl p-6 shadow-2xl" style={glass}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-800">Modifier le dossier</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100/60 transition-colors">
            <IconX className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nom *</label>
              <input type="text" value={form.patientNom} onChange={e => set("patientNom", e.target.value)} required
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Prénom *</label>
              <input type="text" value={form.patientPrenom} onChange={e => set("patientPrenom", e.target.value)} required
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Type de dossier</label>
            <select value={form.type} onChange={e => set("type", e.target.value as DossierType)}
              className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 transition-all">
              <option value="montures-verres">Montures &amp; Verres</option>
              <option value="lentilles">Lentilles</option>
              <option value="basse-vision">Basse vision</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Praticien</label>
              <input type="text" value={form.praticien} onChange={e => set("praticien", e.target.value)} placeholder="Dr. Martin"
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date de livraison</label>
              <input type="date" value={form.dateLivraison} onChange={e => set("dateLivraison", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">N° ordonnance</label>
            <input type="text" value={form.ordonnanceId} onChange={e => set("ordonnanceId", e.target.value)} placeholder="ORD-2025-001"
              className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} placeholder="Observations…"
              className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 transition-all resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white/60 py-2.5 text-sm font-medium text-slate-600 hover:bg-white/80 transition-all">
              Annuler
            </button>
            <button type="submit"
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow: "0 4px 12px rgba(99,102,241,0.28)" }}>
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Tab: Équipement ────────────────────────────────────────────────────── */
function TabEquipement({
  dossier,
  onUpdate,
}: {
  dossier: Dossier;
  onUpdate: (d: Dossier) => void;
}) {
  const [showForm, setShowForm] = useState(false);

  function addLigne(l: DossierLigne) {
    const lignes = [...dossier.lignes, l];
    onUpdate({ ...dossier, lignes, ...recalcTotals(lignes) });
    setShowForm(false);
  }

  function removeLigne(idx: number) {
    const lignes = dossier.lignes.filter((_, i) => i !== idx);
    onUpdate({ ...dossier, lignes, ...recalcTotals(lignes) });
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={glass}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60">
        <div className="text-sm font-semibold text-slate-800">Lignes d&apos;équipement</div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow: "0 2px 8px rgba(99,102,241,0.22)" }}
          >
            <IconPlus className="w-3.5 h-3.5" />
            Ajouter une ligne
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200/60 bg-slate-50/60">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Désignation</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Marque</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Réf.</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">PV TTC</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">PC SS</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">PC Mutuelle</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">RAC</th>
              <th className="px-4 py-2.5 w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50">
            {dossier.lignes.map((l, idx) => {
              const rac = Math.max(0, l.prixTTC - l.priseEnChargeSS - l.priseEnChargeMutuelle);
              return (
                <tr key={idx} className="hover:bg-white/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{l.designation}</td>
                  <td className="px-4 py-3 text-slate-600">{l.marque}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{l.reference ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-800">{l.prixTTC.toFixed(2)} €</td>
                  <td className="px-4 py-3 text-right font-mono text-[#10b981]">{l.priseEnChargeSS.toFixed(2)} €</td>
                  <td className="px-4 py-3 text-right font-mono text-[#6366f1]">{l.priseEnChargeMutuelle.toFixed(2)} €</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">{rac.toFixed(2)} €</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => removeLigne(idx)}
                      className="p-1 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {showForm && (
              <LigneForm onAdd={addLigne} onCancel={() => setShowForm(false)} />
            )}
            {dossier.lignes.length === 0 && !showForm && (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-400">
                  Aucune ligne d&apos;équipement. Cliquez sur &laquo; Ajouter une ligne &raquo; pour commencer.
                </td>
              </tr>
            )}
            {/* Totals row */}
            {dossier.lignes.length > 0 && (
              <tr className="border-t-2 border-slate-200/80 bg-slate-50/60 font-semibold">
                <td className="px-4 py-3 text-xs font-bold text-slate-700 uppercase tracking-wide" colSpan={3}>Total</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{dossier.montantTotal.toFixed(2)} €</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-[#10b981]">{dossier.montantSS.toFixed(2)} €</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-[#6366f1]">{dossier.montantMutuelle.toFixed(2)} €</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{dossier.resteACharge.toFixed(2)} €</td>
                <td />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Tab: Informations ─────────────────────────────────────────────────── */
function TabInformations({ dossier, onEdit }: { dossier: Dossier; onEdit: () => void }) {
  return (
    <div className="space-y-4">
      {/* Patient card */}
      <div className="rounded-2xl p-5" style={glass}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-slate-800">Informations patient</div>
          <button onClick={onEdit} className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6366f1] hover:text-[#4f46e5] transition-colors">
            <IconEdit className="w-3.5 h-3.5" /> Modifier
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Nom</div>
            <div className="text-sm font-semibold text-slate-800">{dossier.patientNom}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Prénom</div>
            <div className="text-sm font-semibold text-slate-800">{dossier.patientPrenom}</div>
          </div>
          {dossier.patientId && (
            <div>
              <div className="text-xs text-slate-500 mb-0.5">ID Patient</div>
              <div className="text-sm font-mono text-slate-700">{dossier.patientId}</div>
            </div>
          )}
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Type de dossier</div>
            <div className="text-sm font-medium text-slate-700">{TYPE_LABELS[dossier.type]}</div>
          </div>
        </div>
      </div>

      {/* Praticien + dates */}
      <div className="rounded-2xl p-5" style={glass}>
        <div className="text-sm font-semibold text-slate-800 mb-4">Détails du dossier</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Praticien</div>
            <div className="text-sm font-medium text-slate-800">{dossier.praticien ?? <span className="text-slate-400 italic">Non renseigné</span>}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">N° dossier</div>
            <div className="text-sm font-mono font-semibold text-slate-800">{dossier.numero}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Date de création</div>
            <div className="text-sm text-slate-700">{new Date(dossier.dateCreation).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Date de livraison</div>
            <div className="text-sm text-slate-700">
              {dossier.dateLivraison
                ? new Date(dossier.dateLivraison).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
                : <span className="text-slate-400 italic">Non définie</span>}
            </div>
          </div>
          {dossier.ordonnanceId && (
            <div className="col-span-2">
              <div className="text-xs text-slate-500 mb-0.5">Référence ordonnance</div>
              <div className="text-sm font-mono text-[#6366f1]">{dossier.ordonnanceId}</div>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-2xl p-5" style={glass}>
        <div className="text-sm font-semibold text-slate-800 mb-3">Notes</div>
        {dossier.notes ? (
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{dossier.notes}</p>
        ) : (
          <p className="text-sm text-slate-400 italic">Aucune note enregistrée.</p>
        )}
      </div>

      {/* Devis source */}
      {dossier.devisId && (
        <div className="rounded-2xl p-5" style={glass}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-800">Devis associé</div>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-600 ring-1 ring-amber-200">
              Devis source
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm font-mono font-semibold text-slate-700">{dossier.devisId}</span>
            <Link
              href="/clair-vision/pro/devis"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold text-[#6366f1] hover:text-[#4f46e5] transition-colors"
              style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.20)" }}
            >
              Voir les devis →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Tab: Historique ───────────────────────────────────────────────────── */
function TabHistorique({ dossier, history }: { dossier: Dossier; history: HistoriqueItem[] }) {
  // Build display list: always show creation at the bottom
  const items: HistoriqueItem[] = [
    ...history,
    {
      date: dossier.dateCreation,
      status: "Prise en charge",
      user: dossier.praticien ?? "Système",
      note: "Dossier créé",
    },
  ];

  return (
    <div className="rounded-2xl p-5" style={glass}>
      <div className="text-sm font-semibold text-slate-800 mb-5">Historique des statuts</div>
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${statusDot[item.status] ?? "bg-slate-200"}`}>
                {idx === 0 ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-white" />
                ) : (
                  <IconCheck className="w-4 h-4 text-white" />
                )}
              </div>
              {idx < items.length - 1 && <div className="w-0.5 flex-1 bg-slate-200/80 mt-1 min-h-[1.5rem]" />}
            </div>
            <div className="pb-4 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusBadge[item.status] ?? "bg-slate-50 text-slate-600 ring-slate-200"}`}>
                  {item.status}
                </span>
                <span className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="text-xs text-slate-500">
                par <span className="font-medium text-slate-700">{item.user}</span>
                {item.note ? <span className="ml-1 text-slate-400">— {item.note}</span> : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────── */
type TabId = "equipement" | "informations" | "historique";

export default function DossierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [dossier, setDossier] = useState<Dossier | null | "loading">("loading");
  const [history, setHistory] = useState<HistoriqueItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("equipement");
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    const list = loadDossiers();
    const found = list.find(d => d.id === id) ?? null;
    setDossier(found);
    if (found) setHistory(loadHistory(id));
  }, [id]);

  function updateDossier(updated: Dossier) {
    const list = loadDossiers();
    const next = list.map(d => d.id === updated.id ? updated : d);
    saveDossiers(next);
    setDossier(updated);
  }

  function handleStatusChange(newStatus: DossierStatus) {
    if (!dossier || dossier === "loading") return;
    const historyEntry: HistoriqueItem = {
      date: new Date().toISOString(),
      status: newStatus,
      user: dossier.praticien ?? "Praticien",
    };
    const newHistory = [historyEntry, ...history];
    saveHistory(id, newHistory);
    setHistory(newHistory);
    updateDossier({ ...dossier, status: newStatus });
  }

  function handleEdit(updates: Partial<Dossier>) {
    if (!dossier || dossier === "loading") return;
    updateDossier({ ...dossier, ...updates });
    setEditOpen(false);
  }

  /* Loading */
  if (dossier === "loading") {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 rounded-full border-2 border-[#6366f1] border-t-transparent animate-spin" />
      </div>
    );
  }

  /* Not found */
  if (dossier === null) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-4xl mb-4"></div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Dossier introuvable</h2>
        <p className="text-sm text-slate-500 mb-6">Le dossier demandé n&apos;existe pas ou a été supprimé.</p>
        <Link
          href="/clair-vision/pro/optique"
          className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}
        >
          <IconArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "equipement",   label: "Équipement" },
    { id: "informations", label: "Informations" },
    { id: "historique",   label: "Historique" },
  ];

  return (
    <>
      {editOpen && (
        <EditModal dossier={dossier} onSave={handleEdit} onClose={() => setEditOpen(false)} />
      )}

      <div className="space-y-5">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Link
              href="/clair-vision/pro/optique"
              className="mt-0.5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/60 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-800 transition-all"
              style={glassSubtle}
            >
              <IconArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Retour</span>
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span
                  className="inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-mono font-semibold"
                  style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.20)", color: "#6366f1" }}
                >
                  {dossier.numero}
                </span>
                <span className={`inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusBadge[dossier.status]}`}>
                  {dossier.status}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                {dossier.patientPrenom} {dossier.patientNom}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Créé le {new Date(dossier.dateCreation).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                {dossier.praticien ? ` · ${dossier.praticien}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-slate-200 bg-white/60 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white transition-all"
              style={glassSubtle}
            >
              <IconEdit className="w-4 h-4" /> Modifier
            </button>
          </div>
        </div>

        {/* ── Main layout ── */}
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          {/* Left: Stepper + Tabs + Content */}
          <div className="space-y-5 min-w-0">
            {/* Status stepper */}
            <StatusStepper current={dossier.status} onChange={handleStatusChange} />

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-2xl" style={glassSubtle}>
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                    activeTab === t.id
                      ? "bg-white text-[#6366f1] shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "equipement" && (
              <TabEquipement dossier={dossier} onUpdate={updateDossier} />
            )}
            {activeTab === "informations" && (
              <TabInformations dossier={dossier} onEdit={() => setEditOpen(true)} />
            )}
            {activeTab === "historique" && (
              <TabHistorique dossier={dossier} history={history} />
            )}
          </div>

          {/* Right: Financial summary */}
          <div className="space-y-4">
            <FinancialCard dossier={dossier} />

            {/* Quick info card */}
            <div className="rounded-2xl p-5 space-y-3" style={glass}>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Infos rapides</div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Type</span>
                  <span className="text-xs font-semibold text-slate-700">{TYPE_LABELS[dossier.type]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Lignes</span>
                  <span className="text-xs font-semibold text-slate-700">{dossier.lignes.length}</span>
                </div>
                {dossier.praticien && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Praticien</span>
                    <span className="text-xs font-semibold text-slate-700">{dossier.praticien}</span>
                  </div>
                )}
                {dossier.dateLivraison && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Livraison prévue</span>
                    <span className="text-xs font-semibold text-slate-700">
                      {new Date(dossier.dateLivraison).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
