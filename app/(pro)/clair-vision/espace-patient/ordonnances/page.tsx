"use client";

import { useState, useEffect } from "react";
import type { CSSProperties } from "react";

/* ── Design tokens ──────────────────────────────────────────────────── */
const glass: CSSProperties = {
  background: "var(--glass-strong-bg)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--glass-strong-border)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
};
const glassSubtle: CSSProperties = {
  background: "var(--glass-subtle-bg)",
  border: "1px solid var(--glass-subtle-border)",
};
const ACCENT = "#2D8CFF";

/* ── Types ──────────────────────────────────────────────────────────── */
interface CurrentPatient {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
}

const MOCK_PATIENT: CurrentPatient = {
  id: "patient-1",
  nom: "Leblanc",
  prenom: "Marie",
  email: "marie.leblanc@email.fr",
};

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
  createdAt?: string;
}

/* ── localStorage helpers ────────────────────────────────────────────── */
function loadCurrentPatient(): CurrentPatient {
  if (typeof window === "undefined") return MOCK_PATIENT;
  try {
    const raw = localStorage.getItem("thor_patient_current");
    return raw ? (JSON.parse(raw) as CurrentPatient) : MOCK_PATIENT;
  } catch {
    return MOCK_PATIENT;
  }
}

function loadOrdonnances(): Ordonnance[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("thor_pro_ordonnances");
    return raw ? (JSON.parse(raw) as Ordonnance[]) : [];
  } catch {
    return [];
  }
}

/* ── Helpers ─────────────────────────────────────────────────────────── */
function samePatient(nom: string, prenom: string, patient: CurrentPatient): boolean {
  return (
    nom.trim().toLowerCase() === patient.nom.trim().toLowerCase() &&
    prenom.trim().toLowerCase() === patient.prenom.trim().toLowerCase()
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
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

function summarizeOeil(oeil: OrdonnanceOeil): string {
  const parts: string[] = [];
  if (oeil.sphere !== null && oeil.sphere !== undefined) {
    parts.push(fmtVal(oeil.sphere));
  }
  if (oeil.cylindre !== null && oeil.cylindre !== undefined && oeil.cylindre !== 0) {
    parts.push(`(${fmtVal(oeil.cylindre)} à ${fmtInt(oeil.axe)}°)`);
  }
  if (oeil.addition !== null && oeil.addition !== undefined && oeil.addition !== 0) {
    parts.push(`Add ${fmtVal(oeil.addition)}`);
  }
  return parts.length > 0 ? parts.join(" ") : "—";
}

function isActive(ord: Ordonnance): boolean {
  return new Date(ord.dateExpiration) > new Date();
}

/* ── SVG Icons ────────────────────────────────────────────────────────── */
function IconDocument() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14 2v6h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function IconPrinter() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path d="M6 9V2h12v7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="1.7" />
      <rect x="6" y="14" width="12" height="8" stroke="currentColor" strokeWidth="1.7" rx="1" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconEye() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

/* ── Detail Modal ─────────────────────────────────────────────────────── */
function OrdonnanceModal({ ord, onClose }: { ord: Ordonnance; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.40)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full rounded-3xl p-6 space-y-5" style={{ ...glass, maxWidth: 560 }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-bold text-slate-800">{ord.numero}</div>
            <div className="text-sm text-slate-500 mt-0.5">
              {formatDate(ord.dateOrdonnance)} · {ord.prescripteur}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 transition-all"
            style={glassSubtle}
          >
            <IconClose />
          </button>
        </div>

        {/* OD / OG Table */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Œil droit (OD)", oeil: ord.od },
            { label: "Œil gauche (OG)", oeil: ord.og },
          ].map(({ label, oeil }) => (
            <div key={label} className="rounded-2xl p-4 space-y-2" style={glassSubtle}>
              <div className="text-xs font-bold uppercase tracking-wide" style={{ color: ACCENT }}>{label}</div>
              <div className="grid grid-cols-2 gap-1 text-xs text-slate-600">
                <span className="text-slate-400">Sphère</span>
                <span className="font-semibold text-slate-800">{fmtVal(oeil.sphere)}</span>
                <span className="text-slate-400">Cylindre</span>
                <span className="font-semibold text-slate-800">{fmtVal(oeil.cylindre)}</span>
                <span className="text-slate-400">Axe</span>
                <span className="font-semibold text-slate-800">{fmtInt(oeil.axe)}°</span>
                <span className="text-slate-400">Addition</span>
                <span className="font-semibold text-slate-800">{fmtVal(oeil.addition)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Ecart pupillaire */}
        {ord.ecartPupillaire !== undefined && ord.ecartPupillaire !== null && (
          <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={glassSubtle}>
            <span className="text-xs text-slate-500">Écart pupillaire</span>
            <span className="text-sm font-semibold text-slate-800">{ord.ecartPupillaire} mm</span>
          </div>
        )}

        {/* Remarques */}
        <div className="rounded-xl p-4" style={glassSubtle}>
          <div className="text-xs text-slate-400 mb-1">Remarques</div>
          <div className="text-sm text-slate-700">{ord.remarques || "—"}</div>
        </div>

        {/* Validity */}
        <div className="rounded-xl px-4 py-3 flex items-center justify-between"
          style={{
            background: isActive(ord) ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${isActive(ord) ? "rgba(16,185,129,0.20)" : "rgba(239,68,68,0.20)"}`,
          }}
        >
          <span className="text-xs text-slate-500">
            {isActive(ord) ? "Valide jusqu'au" : "Expirée le"}
          </span>
          <span className="text-sm font-semibold" style={{ color: isActive(ord) ? "#047857" : "#991b1b" }}>
            {formatDate(ord.dateExpiration)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-all"
            style={glassSubtle}
          >
            <IconPrinter />
            Imprimer
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            style={{ background: ACCENT }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────── */
export default function OrdonnancesPage() {
  const [ordonnances, setOrdonnances] = useState<Ordonnance[]>([]);
  const [selectedOrd, setSelectedOrd] = useState<Ordonnance | null>(null);

  useEffect(() => {
    const patient = loadCurrentPatient();
    const all = loadOrdonnances();
    const filtered = all
      .filter((o) => samePatient(o.patientNom, o.patientPrenom, patient))
      .sort((a, b) => b.dateOrdonnance.localeCompare(a.dateOrdonnance));
    setOrdonnances(filtered);
  }, []);

  return (
    <>
      <div className="w-full space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-light text-slate-900">
            <span className="font-bold">Ordonnances</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Vos prescriptions ophtalmologiques</p>
        </div>

        {/* List */}
        {ordonnances.length > 0 ? (
          <div className="space-y-4">
            {ordonnances.map((ord) => {
              const active = isActive(ord);
              return (
                <div key={ord.id} className="rounded-2xl p-5" style={glass}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      {/* Numero + status */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div
                          className="grid h-9 w-9 place-items-center rounded-xl text-xs font-bold flex-shrink-0"
                          style={{ background: "rgba(45,140,255,0.08)", color: ACCENT }}
                        >
                          <IconDocument />
                        </div>
                        <span className="text-sm font-bold text-slate-800">{ord.numero}</span>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={active
                            ? { background: "rgba(16,185,129,0.10)", color: "#047857" }
                            : { background: "rgba(239,68,68,0.10)", color: "#991b1b" }
                          }
                        >
                          {active ? "Active" : "Expirée"}
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-slate-500">
                        {formatDate(ord.dateOrdonnance)} · Prescrit par {ord.prescripteur}
                      </div>

                      <div className="mt-1 text-xs text-slate-400">
                        {active ? `Valide jusqu'au ${formatDate(ord.dateExpiration)}` : `Expirée le ${formatDate(ord.dateExpiration)}`}
                      </div>

                      {/* OD / OG summary */}
                      <div className="mt-3 flex flex-wrap gap-3">
                        <div className="rounded-xl px-3 py-2" style={glassSubtle}>
                          <span className="text-xs font-bold" style={{ color: ACCENT }}>OD</span>
                          <span className="ml-2 text-xs text-slate-700">{summarizeOeil(ord.od)}</span>
                        </div>
                        <div className="rounded-xl px-3 py-2" style={glassSubtle}>
                          <span className="text-xs font-bold" style={{ color: ACCENT }}>OG</span>
                          <span className="ml-2 text-xs text-slate-700">{summarizeOeil(ord.og)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedOrd(ord)}
                        className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:text-slate-900"
                        style={{ ...glassSubtle, color: ACCENT }}
                      >
                        <IconEye />
                        Voir le détail
                      </button>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 transition-all hover:text-slate-900"
                        style={glassSubtle}
                      >
                        <IconPrinter />
                        Imprimer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl p-12 text-center" style={glass}>
            <div
              className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl"
              style={{ background: "rgba(45,140,255,0.08)" }}
            >
              <span style={{ color: ACCENT }}><IconDocument /></span>
            </div>
            <p className="text-base font-semibold text-slate-700">Aucune ordonnance trouvée</p>
            <p className="mt-2 text-sm text-slate-500">
              Votre opticien peut les enregistrer lors de votre prochaine visite.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedOrd && (
        <OrdonnanceModal ord={selectedOrd} onClose={() => setSelectedOrd(null)} />
      )}
    </>
  );
}
