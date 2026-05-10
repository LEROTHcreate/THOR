"use client";

import { useEffect, useState, useRef } from "react";
import type { CSSProperties } from "react";
import { loadStoreConfig } from "@/lib/storeConfig";
import type { StoreConfig } from "@/lib/storeConfig";
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

/* ── Data model ─────────────────────────────────────────────────────────── */
interface OrdonnanceOeil {
  sphere: number | null;
  cylindre: number | null;
  axe: number | null;
  addition: number | null;
}

interface Ordonnance {
  id: string;
  numero: string;
  patientNom: string;
  patientPrenom: string;
  patientId?: string;
  dateOrdonnance: string;
  dateExpiration: string;
  prescripteur: string;
  rpps?: string;
  od: OrdonnanceOeil;
  og: OrdonnanceOeil;
  ecartPupillaire?: number;
  remarques?: string;
  createdAt: string;
}

const STORAGE_KEY = "thor_pro_ordonnances";

function loadOrdonnances(): Ordonnance[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Ordonnance[]) : [];
  } catch {
    return [];
  }
}

function saveOrdonnances(list: Ordonnance[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function generateNumero(list: Ordonnance[]): string {
  const year = new Date().getFullYear();
  const existing = list.filter((o) => o.numero.startsWith(`ORD-${year}-`));
  const next = existing.length + 1;
  return `ORD-${year}-${String(next).padStart(3, "0")}`;
}

function addYears(dateStr: string, years: number): string {
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split("T")[0];
}

/* ── Computed fields for display ─────────────────────────────────────────── */
function computeStatus(ord: Ordonnance): "Active" | "Expirée" {
  return new Date(ord.dateExpiration) > new Date() ? "Active" : "Expirée";
}

function computeDaysLeft(ord: Ordonnance): number {
  const diff = new Date(ord.dateExpiration).getTime() - Date.now();
  return Math.round(diff / 86400000);
}

function computeElapsed(ord: Ordonnance): number {
  const start = new Date(ord.dateOrdonnance).getTime();
  const end = new Date(ord.dateExpiration).getTime();
  const now = Date.now();
  if (now >= end) return 100;
  if (now <= start) return 0;
  return Math.round(((now - start) / (end - start)) * 100);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function fmtVal(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  if (v > 0) return `+${v.toFixed(2)}`;
  return v.toFixed(2);
}

function fmtInt(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return String(v);
}

/* ── SVG Icons ───────────────────────────────────────────────────────────── */
function IconDocument({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M9 13h6M9 17h4" />
    </svg>
  );
}
function IconPrinter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}
function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  );
}
function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
function IconInfo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8h.01M12 12v4" />
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

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function initials(nom: string, prenom: string) {
  return ((prenom[0] ?? "") + (nom[0] ?? "")).toUpperCase();
}

function StatusBadge({ status }: { status: "Active" | "Expirée" }) {
  if (status === "Active") {
    return (
      <span className="inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-0.5 text-[11px] font-semibold bg-[#F0FDF4] text-[#15803D] ring-1 ring-[#BBF7D0]">
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-600 ring-1 ring-[#FDE68A]">
      Expirée
    </span>
  );
}

/* ── Empty state sample data (seed once) ─────────────────────────────────── */
const SEED: Ordonnance[] = [
  {
    id: "seed-1",
    numero: "ORD-2024-001",
    patientNom: "Leblanc",
    patientPrenom: "Marie",
    dateOrdonnance: "2024-11-18",
    dateExpiration: "2026-11-18",
    prescripteur: "Dr. Martin",
    od: { sphere: -4.5, cylindre: -1.25, axe: 15, addition: null },
    og: { sphere: -4.0, cylindre: -1.0, axe: 170, addition: null },
    ecartPupillaire: 63,
    createdAt: "2024-11-18T09:00:00.000Z",
  },
  {
    id: "seed-2",
    numero: "ORD-2024-002",
    patientNom: "Renaud",
    patientPrenom: "Paul",
    dateOrdonnance: "2024-11-18",
    dateExpiration: "2025-11-18",
    prescripteur: "Dr. Martin",
    od: { sphere: -3.0, cylindre: null, axe: null, addition: null },
    og: { sphere: -2.75, cylindre: null, axe: null, addition: null },
    ecartPupillaire: 61,
    remarques: "Lentilles mensuelles — Bc 8.6, Diam 14.2",
    createdAt: "2024-11-18T10:30:00.000Z",
  },
  {
    id: "seed-3",
    numero: "ORD-2024-003",
    patientNom: "Morel",
    patientPrenom: "Isabelle",
    dateOrdonnance: "2024-04-12",
    dateExpiration: "2026-04-12",
    prescripteur: "Dr. Martin",
    od: { sphere: 1.25, cylindre: -0.5, axe: 90, addition: 2.0 },
    og: { sphere: 1.0, cylindre: -0.75, axe: 85, addition: 2.0 },
    ecartPupillaire: 64,
    createdAt: "2024-04-12T14:00:00.000Z",
  },
];

/* ── Form state type ─────────────────────────────────────────────────────── */
interface OeilForm {
  sphere: string;
  cylindre: string;
  axe: string;
  addition: string;
}

interface FormState {
  patientNom: string;
  patientPrenom: string;
  patientId: string;
  dateOrdonnance: string;
  prescripteur: string;
  rpps: string;
  od: OeilForm;
  og: OeilForm;
  ecartPupillaire: string;
  remarques: string;
}

const EMPTY_OEIL: OeilForm = { sphere: "", cylindre: "", axe: "", addition: "" };

function emptyForm(): FormState {
  return {
    patientNom: "",
    patientPrenom: "",
    patientId: "",
    dateOrdonnance: new Date().toISOString().split("T")[0],
    prescripteur: "",
    rpps: "",
    od: { ...EMPTY_OEIL },
    og: { ...EMPTY_OEIL },
    ecartPupillaire: "",
    remarques: "",
  };
}

function parseFloat2(s: string): number | null {
  const v = parseFloat(s);
  return isNaN(v) ? null : v;
}
function parseInt2(s: string): number | null {
  const v = parseInt(s, 10);
  return isNaN(v) ? null : v;
}

/* ── Print zone component ─────────────────────────────────────────────────── */
function PrintZone({
  ordonnance,
  storeConfig,
}: {
  ordonnance: Ordonnance | null;
  storeConfig: StoreConfig;
}) {
  if (!ordonnance) return null;

  const fullName = `${ordonnance.patientPrenom} ${ordonnance.patientNom}`;
  const addr = [storeConfig.adresse, storeConfig.codePostal && storeConfig.ville ? `${storeConfig.codePostal} ${storeConfig.ville}` : ""].filter(Boolean).join(", ");

  return (
    <div id="ord-print-zone" style={{ display: "none" }}>
      <div style={{ fontFamily: "Georgia, serif", maxWidth: 680, margin: "0 auto", padding: "40px 32px", color: "#111" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #334155", paddingBottom: 16, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>{storeConfig.nom}</div>
            {addr && <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{addr}</div>}
            {storeConfig.telephone && <div style={{ fontSize: 12, color: "#475569" }}>Tél : {storeConfig.telephone}</div>}
            {storeConfig.email && <div style={{ fontSize: 12, color: "#475569" }}>{storeConfig.email}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            {storeConfig.siret && <div style={{ fontSize: 11, color: "#64748b" }}>SIRET : {storeConfig.siret}</div>}
            {storeConfig.adeli && <div style={{ fontSize: 11, color: "#64748b" }}>ADELI : {storeConfig.adeli}</div>}
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>N° {ordonnance.numero}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Date : {formatDate(ordonnance.dateOrdonnance)}</div>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", fontSize: 17, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 28, color: "#1e293b" }}>
          Ordonnance optique
        </div>

        {/* Patient */}
        <div style={{ marginBottom: 20, padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 6 }}>Patient</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{fullName}</div>
          {ordonnance.patientId && <div style={{ fontSize: 12, color: "#64748b" }}>ID : {ordonnance.patientId}</div>}
        </div>

        {/* Prescripteur */}
        <div style={{ marginBottom: 24, padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 6 }}>Prescripteur</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{ordonnance.prescripteur}</div>
          {ordonnance.rpps && <div style={{ fontSize: 12, color: "#64748b" }}>RPPS : {ordonnance.rpps}</div>}
        </div>

        {/* Prescription table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20, fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: "#f1f5f9" }}>
              <th style={{ border: "1px solid #cbd5e1", padding: "8px 12px", textAlign: "left", fontWeight: 700 }}></th>
              <th style={{ border: "1px solid #cbd5e1", padding: "8px 12px", textAlign: "center", fontWeight: 700 }}>Sphère</th>
              <th style={{ border: "1px solid #cbd5e1", padding: "8px 12px", textAlign: "center", fontWeight: 700 }}>Cylindre</th>
              <th style={{ border: "1px solid #cbd5e1", padding: "8px 12px", textAlign: "center", fontWeight: 700 }}>Axe</th>
              <th style={{ border: "1px solid #cbd5e1", padding: "8px 12px", textAlign: "center", fontWeight: 700 }}>Addition</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #cbd5e1", padding: "8px 12px", fontWeight: 700, backgroundColor: "#f8fafc" }}>OD</td>
              <td style={{ border: "1px solid #cbd5e1", padding: "8px 12px", textAlign: "center", fontFamily: "monospace" }}>{fmtVal(ordonnance.od.sphere)}</td>
              <td style={{ border: "1px solid #cbd5e1", padding: "8px 12px", textAlign: "center", fontFamily: "monospace" }}>{fmtVal(ordonnance.od.cylindre)}</td>
              <td style={{ border: "1px solid #cbd5e1", padding: "8px 12px", textAlign: "center", fontFamily: "monospace" }}>{fmtInt(ordonnance.od.axe)}{ordonnance.od.axe !== null ? "°" : ""}</td>
              <td style={{ border: "1px solid #cbd5e1", padding: "8px 12px", textAlign: "center", fontFamily: "monospace" }}>{fmtVal(ordonnance.od.addition)}</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #cbd5e1", padding: "8px 12px", fontWeight: 700, backgroundColor: "#f8fafc" }}>OG</td>
              <td style={{ border: "1px solid #cbd5e1", padding: "8px 12px", textAlign: "center", fontFamily: "monospace" }}>{fmtVal(ordonnance.og.sphere)}</td>
              <td style={{ border: "1px solid #cbd5e1", padding: "8px 12px", textAlign: "center", fontFamily: "monospace" }}>{fmtVal(ordonnance.og.cylindre)}</td>
              <td style={{ border: "1px solid #cbd5e1", padding: "8px 12px", textAlign: "center", fontFamily: "monospace" }}>{fmtInt(ordonnance.og.axe)}{ordonnance.og.axe !== null ? "°" : ""}</td>
              <td style={{ border: "1px solid #cbd5e1", padding: "8px 12px", textAlign: "center", fontFamily: "monospace" }}>{fmtVal(ordonnance.og.addition)}</td>
            </tr>
          </tbody>
        </table>

        {/* Écart pupillaire */}
        {ordonnance.ecartPupillaire && (
          <div style={{ marginBottom: 16, fontSize: 13 }}>
            <strong>Écart pupillaire :</strong> {ordonnance.ecartPupillaire} mm
          </div>
        )}

        {/* Remarques */}
        {ordonnance.remarques && (
          <div style={{ marginBottom: 20, padding: "10px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13 }}>
            <strong>Remarques :</strong> {ordonnance.remarques}
          </div>
        )}

        {/* Validity */}
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 48 }}>
          Valable jusqu&apos;au : <strong>{formatDate(ordonnance.dateExpiration)}</strong>
        </div>

        {/* Signature */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ textAlign: "center", minWidth: 200 }}>
            <div style={{ border: "1px solid #94a3b8", height: 80, borderRadius: 4, marginBottom: 8 }} />
            <div style={{ fontSize: 12, color: "#475569" }}>{ordonnance.prescripteur}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Oeil form row ─────────────────────────────────────────────────────────── */
function OeilRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: OeilForm;
  onChange: (v: OeilForm) => void;
}) {
  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 transition-all";

  return (
    <div className="grid grid-cols-[56px_1fr_1fr_1fr_1fr] gap-2 items-center">
      <div className="text-sm font-semibold text-slate-700 text-center py-2 rounded-lg" style={{ background: "rgba(99,102,241,0.08)" }}>
        {label}
      </div>
      <input
        type="number"
        step="0.25"
        placeholder="Sph"
        value={value.sphere}
        onChange={(e) => onChange({ ...value, sphere: e.target.value })}
        className={inputClass}
      />
      <input
        type="number"
        step="0.25"
        placeholder="Cyl"
        value={value.cylindre}
        onChange={(e) => onChange({ ...value, cylindre: e.target.value })}
        className={inputClass}
      />
      <input
        type="number"
        step="1"
        min="0"
        max="180"
        placeholder="Axe"
        value={value.axe}
        onChange={(e) => onChange({ ...value, axe: e.target.value })}
        className={inputClass}
      />
      <input
        type="number"
        step="0.25"
        placeholder="Add"
        value={value.addition}
        onChange={(e) => onChange({ ...value, addition: e.target.value })}
        className={inputClass}
      />
    </div>
  );
}

/* ── Modal ──────────────────────────────────────────────────────────────── */
function NewOrdonnanceModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (o: Ordonnance) => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");

  const labelClass = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1";
  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 transition-all";

  function handleSubmit() {
    if (!form.patientNom.trim()) { setError("Le nom du patient est requis."); return; }
    if (!form.patientPrenom.trim()) { setError("Le prénom du patient est requis."); return; }
    if (!form.dateOrdonnance) { setError("La date est requise."); return; }
    if (!form.prescripteur.trim()) { setError("Le prescripteur est requis."); return; }
    if (form.od.sphere === "" && form.od.cylindre === "" && form.og.sphere === "" && form.og.cylindre === "") {
      setError("Veuillez saisir au moins une valeur de prescription.");
      return;
    }
    setError("");

    const existing = loadOrdonnances();
    const now = new Date().toISOString();
    const newOrd: Ordonnance = {
      id: `ord-${Date.now()}`,
      numero: generateNumero(existing),
      patientNom: form.patientNom.trim(),
      patientPrenom: form.patientPrenom.trim(),
      patientId: form.patientId.trim() || undefined,
      dateOrdonnance: form.dateOrdonnance,
      dateExpiration: addYears(form.dateOrdonnance, 3),
      prescripteur: form.prescripteur.trim(),
      rpps: form.rpps.trim() || undefined,
      od: {
        sphere: parseFloat2(form.od.sphere),
        cylindre: parseFloat2(form.od.cylindre),
        axe: parseInt2(form.od.axe),
        addition: parseFloat2(form.od.addition),
      },
      og: {
        sphere: parseFloat2(form.og.sphere),
        cylindre: parseFloat2(form.og.cylindre),
        axe: parseInt2(form.og.axe),
        addition: parseFloat2(form.og.addition),
      },
      ecartPupillaire: parseInt2(form.ecartPupillaire) ?? undefined,
      remarques: form.remarques.trim() || undefined,
      createdAt: now,
    };
    onSave(newOrd);
  }

  return (
    <DraggableWindow
      title="Nouvelle ordonnance"
      onClose={onClose}
      defaultWidth={620}
      defaultHeight={640}
    >
      <div className="px-6 py-5 space-y-6" style={{ background: "var(--glass-card-bg)" }}>
          {/* Patient */}
          <section>
            <div className="text-xs font-bold text-[#6366f1] uppercase tracking-widest mb-3">Patient</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Nom *</label>
                <input
                  type="text"
                  placeholder="Dupont"
                  value={form.patientNom}
                  onChange={(e) => setForm({ ...form, patientNom: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Prénom *</label>
                <input
                  type="text"
                  placeholder="Jean"
                  value={form.patientPrenom}
                  onChange={(e) => setForm({ ...form, patientPrenom: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>ID patient (optionnel)</label>
                <input
                  type="text"
                  placeholder="PAT-001"
                  value={form.patientId}
                  onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Ordonnance info */}
          <section>
            <div className="text-xs font-bold text-[#6366f1] uppercase tracking-widest mb-3">Ordonnance</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Date d&apos;ordonnance *</label>
                <input
                  type="date"
                  value={form.dateOrdonnance}
                  onChange={(e) => setForm({ ...form, dateOrdonnance: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Prescripteur *</label>
                <input
                  type="text"
                  placeholder="Dr. Martin"
                  value={form.prescripteur}
                  onChange={(e) => setForm({ ...form, prescripteur: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>N° RPPS</label>
                <input
                  type="text"
                  placeholder="10 chiffres"
                  value={form.rpps}
                  onChange={(e) => setForm({ ...form, rpps: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Prescription */}
          <section>
            <div className="text-xs font-bold text-[#6366f1] uppercase tracking-widest mb-3">Prescription</div>
            <div className="grid grid-cols-[56px_1fr_1fr_1fr_1fr] gap-2 mb-2 text-center">
              <div />
              {["Sphère", "Cylindre", "Axe", "Addition"].map((h) => (
                <div key={h} className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{h}</div>
              ))}
            </div>
            <div className="space-y-2">
              <OeilRow
                label="OD"
                value={form.od}
                onChange={(v) => setForm({ ...form, od: v })}
              />
              <OeilRow
                label="OG"
                value={form.og}
                onChange={(v) => setForm({ ...form, og: v })}
              />
            </div>
          </section>

          {/* Extra */}
          <section>
            <div className="text-xs font-bold text-[#6366f1] uppercase tracking-widest mb-3">Informations complémentaires</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Écart pupillaire (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="63"
                  value={form.ecartPupillaire}
                  onChange={(e) => setForm({ ...form, ecartPupillaire: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className={labelClass}>Remarques</label>
                <textarea
                  placeholder="Notes complémentaires…"
                  rows={3}
                  value={form.remarques}
                  onChange={(e) => setForm({ ...form, remarques: e.target.value })}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200/60">
            <button
              onClick={onClose}
              className="rounded-[var(--radius-pill)] px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                boxShadow: "0 4px 12px rgba(99,102,241,0.30)",
              }}
            >
              <IconDocument className="w-4 h-4" />
              Enregistrer l&apos;ordonnance
            </button>
          </div>
        </div>
    </DraggableWindow>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function OrdonnancesPage() {
  const [ordonnances, setOrdonnances] = useState<Ordonnance[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [printOrd, setPrintOrd] = useState<Ordonnance | null>(null);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    nom: "Clair Vision",
    adresse: "12 rue de la Paix",
    codePostal: "75001",
    ville: "Paris",
    siret: "123 456 789 00012",
    adeli: "75-0123456",
  });
  const printPending = useRef(false);

  useEffect(() => {
    setStoreConfig(loadStoreConfig());
    const stored = loadOrdonnances();
    if (stored.length === 0) {
      saveOrdonnances(SEED);
      setOrdonnances(SEED);
    } else {
      setOrdonnances(stored);
    }
  }, []);

  // Trigger print after state update renders print zone
  useEffect(() => {
    if (printPending.current && printOrd) {
      printPending.current = false;
      // Small defer to ensure DOM is ready
      setTimeout(() => {
        window.print();
        // After print, clear the selected ordonnance
        setTimeout(() => setPrintOrd(null), 500);
      }, 80);
    }
  }, [printOrd]);

  function handleSave(o: Ordonnance) {
    const updated = [o, ...ordonnances];
    setOrdonnances(updated);
    saveOrdonnances(updated);
    setShowModal(false);
  }

  function handlePrint(o: Ordonnance) {
    printPending.current = true;
    setPrintOrd(o);
  }

  const activeCount = ordonnances.filter((o) => computeStatus(o) === "Active").length;
  const expiredCount = ordonnances.filter((o) => computeStatus(o) === "Expirée").length;
  const warningSoon = ordonnances.filter((o) => computeStatus(o) === "Active" && computeDaysLeft(o) <= 30).length;

  return (
    <>
      {/* Print CSS */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #ord-print-zone { display: block !important; }
        }
      `}</style>

      {/* Print zone — hidden, shown only on print */}
      <PrintZone ordonnance={printOrd} storeConfig={storeConfig} />

      {/* Modal */}
      {showModal && (
        <NewOrdonnanceModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      <div className="w-full space-y-6">
        {/* Alert banner — ordonnances expirées ou expirantes ≤30j */}
        {(() => {
          const now = new Date();
          const in30 = new Date(now.getTime() + 30 * 86400000);
          const expirees = ordonnances.filter(o => new Date(o.dateExpiration) < now);
          const expirantes = ordonnances.filter(o => { const d = new Date(o.dateExpiration); return d >= now && d <= in30; });
          if (expirees.length === 0 && expirantes.length === 0) return null;
          return (
            <div className="rounded-2xl p-4" style={{ background: "var(--glass-subtle-bg)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(239,68,68,0.25)" }}>
              {expirees.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-red-600">{expirees.length} ordonnance{expirees.length > 1 ? "s" : ""} expirée{expirees.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {expirees.map(o => (
                      <div key={o.id} className="rounded-xl px-3 py-2" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.20)" }}>
                        <div className="text-xs font-semibold text-slate-800">{o.patientPrenom} {o.patientNom}</div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[11px] text-slate-500">{formatDate(o.dateExpiration)}</span>
                          <span className="text-[11px] font-bold text-red-500">Expirée</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {expirantes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-amber-600">{expirantes.length} expirante{expirantes.length > 1 ? "s" : ""} dans moins de 30 jours</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {expirantes.map(o => {
                      const daysLeft = computeDaysLeft(o);
                      return (
                        <div key={o.id} className="rounded-xl px-3 py-2" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)" }}>
                          <div className="text-xs font-semibold text-slate-800">{o.patientPrenom} {o.patientNom}</div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-[11px] text-slate-500">{formatDate(o.dateExpiration)}</span>
                            <span className="text-[11px] font-bold text-amber-500">Expire dans {daysLeft}j</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-800 h-title">
              Ordonnances
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Prescriptions optiques en cours et archivées
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Summary pills */}
            <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-medium" style={glassSubtle}>
              <span className="h-1.5 w-1.5 rounded-full bg-[#15803D]" />
              <span className="text-slate-600">{activeCount} actives</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-medium" style={glassSubtle}>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span className="text-slate-600">{expiredCount} expirée{expiredCount > 1 ? "s" : ""}</span>
            </span>
            {warningSoon > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold text-[#EF4444]" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)" }}>
                {warningSoon} expire bientôt
              </span>
            )}
            {/* New ordonnance button */}
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                boxShadow: "0 4px 12px rgba(99,102,241,0.28)",
              }}
            >
              <IconPlus className="w-4 h-4" />
              Nouvelle ordonnance
            </button>
          </div>
        </div>

        {/* Ordonnance list */}
        <div className="space-y-4">
          {ordonnances.length === 0 && (
            <div className="rounded-[var(--radius-large)] px-6 py-12 text-center" style={glass}>
              <IconDocument className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Aucune ordonnance enregistrée.</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-all"
                style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
              >
                <IconPlus className="w-4 h-4" />
                Créer la première ordonnance
              </button>
            </div>
          )}
          {ordonnances.map((o) => {
            const status = computeStatus(o);
            const daysLeft = computeDaysLeft(o);
            const elapsed = computeElapsed(o);
            const fullName = `${o.patientPrenom} ${o.patientNom}`;

            return (
              <div
                key={o.id}
                className="rounded-[var(--radius-large)] overflow-hidden"
                style={status === "Expirée" ? { ...glass, background: "rgba(255,255,255,0.42)" } : glass}
              >
                {/* Card header */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-200/60">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold text-[#2D8CFF] flex-shrink-0"
                      style={{ background: "rgba(219,234,255,0.70)", border: "1.5px solid rgba(45,140,255,0.25)" }}
                    >
                      {initials(o.patientNom, o.patientPrenom)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{fullName}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-mono text-slate-400">{o.numero}</span>
                        <span>·</span>
                        <IconCalendar className="w-3 h-3" />
                        <span>Émise le {formatDate(o.dateOrdonnance)}</span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={status} />
                </div>

                {/* Prescription values */}
                <div className="px-6 py-4 space-y-3">
                  {/* OD / OG compact display */}
                  <div className="rounded-[var(--radius-soft)] px-4 py-3" style={glassSubtle}>
                    <div className="flex items-start gap-2">
                      <IconDocument className="w-4 h-4 text-[#2D8CFF] flex-shrink-0 mt-0.5" />
                      <div className="font-mono text-sm text-slate-800 leading-relaxed space-y-0.5">
                        <div>
                          <span className="font-semibold text-slate-500 mr-2">OD</span>
                          {fmtVal(o.od.sphere)}
                          {o.od.cylindre !== null && ` (${fmtVal(o.od.cylindre)} à ${fmtInt(o.od.axe)}°)`}
                          {o.od.addition !== null && `  Add ${fmtVal(o.od.addition)}`}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500 mr-2">OG</span>
                          {fmtVal(o.og.sphere)}
                          {o.og.cylindre !== null && ` (${fmtVal(o.og.cylindre)} à ${fmtInt(o.og.axe)}°)`}
                          {o.og.addition !== null && `  Add ${fmtVal(o.og.addition)}`}
                        </div>
                        {o.ecartPupillaire && (
                          <div className="text-slate-400 text-xs">EP : {o.ecartPupillaire} mm</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {o.remarques && (
                    <div className="flex items-start gap-2 text-xs text-slate-500">
                      <IconInfo className="w-3.5 h-3.5 text-[#2D8CFF] flex-shrink-0 mt-0.5" />
                      <span>{o.remarques}</span>
                    </div>
                  )}

                  {/* Validity progress bar */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <div className="flex items-center gap-1 text-slate-500">
                        <IconCalendar className="w-3.5 h-3.5" />
                        <span>
                          Valide jusqu&apos;au{" "}
                          <span className={
                            status === "Expirée"
                              ? "text-amber-600 font-semibold"
                              : daysLeft <= 30
                              ? "text-[#EF4444] font-semibold"
                              : "text-slate-700 font-medium"
                          }>
                            {formatDate(o.dateExpiration)}
                          </span>
                        </span>
                      </div>
                      <span className={`font-semibold ${status === "Expirée" ? "text-amber-600" : daysLeft <= 30 ? "text-[#EF4444]" : "text-[#00C98A]"}`}>
                        {status === "Expirée"
                          ? `Expirée il y a ${Math.abs(daysLeft)}j`
                          : daysLeft <= 30
                          ? `${daysLeft}j restants`
                          : `${daysLeft}j restants`}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${elapsed}%`,
                          background:
                            status === "Expirée"
                              ? "#F59E0B"
                              : daysLeft <= 30
                              ? "linear-gradient(90deg,#EF4444,#F97316)"
                              : "linear-gradient(90deg,#00C98A,#2D8CFF)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <div className="flex items-center gap-1">
                      <IconUser className="w-3.5 h-3.5" />
                      <span>{o.prescripteur}</span>
                    </div>
                    {o.rpps && <span className="font-mono text-slate-400">RPPS {o.rpps}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 px-6 py-3 border-t border-slate-200/60">
                  <button
                    onClick={() => handlePrint(o)}
                    className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-4 py-2 text-xs font-semibold text-[#6366f1] transition-all hover:bg-[#6366f1]/10"
                    style={glassSubtle}
                  >
                    <IconPrinter className="w-3.5 h-3.5" />
                    Imprimer
                  </button>
                  <button
                    className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90"
                    style={{
                      background: "#2D8CFF",
                      boxShadow: "0 2px 8px rgba(45,140,255,0.22)",
                    }}
                  >
                    <IconRefresh className="w-3.5 h-3.5" />
                    Renouveler
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
