"use client";

import { useState, useEffect, useMemo } from "react";
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

type DevisStatus = "Brouillon" | "Signé" | "Commandé" | "Prêt" | "Livré" | "Facturé";

interface Devis {
  id: string;
  patientNom: string;
  patientPrenom: string;
  totalTTC: number;
  resteACharge: number;
  status: DevisStatus | string;
  date: string;
  dateValidite?: string;
  type?: string;
  notes?: string;
}

/* ── Interface ProDevis (thor_pro_devis) ─────────────────────────────── */
interface ProDevis {
  id: string;
  patientNom?: string;
  patientPrenom?: string;
  statut?: string;
  date?: string;
  montantTTC?: number;
  numero?: string;
}

/* ── Statut pro → badge enrichi ─────────────────────────────────────── */
interface EnrichedStatus {
  bg: string;
  text: string;
  label: string;
  isConverti: boolean;
}

function resolveEnrichedStatus(rawStatut: string | undefined): EnrichedStatus {
  const s = (rawStatut ?? "").toLowerCase().trim();
  if (s === "en_attente" || s === "envoye" || s === "envoyé") {
    return { bg: "rgba(245,158,11,0.12)", text: "#B45309", label: "En attente de réponse", isConverti: false };
  }
  if (s === "accepte" || s === "accepté" || s === "signé" || s === "signe") {
    return { bg: "rgba(16,185,129,0.12)", text: "#047857", label: "Accepté", isConverti: false };
  }
  if (s === "converti") {
    return { bg: "rgba(45,140,255,0.12)", text: "#1D6FCC", label: "Transformé en facture", isConverti: true };
  }
  if (s === "refuse" || s === "refusé" || s === "annulé" || s === "annule") {
    return { bg: "rgba(239,68,68,0.10)", text: "#991b1b", label: "Refusé", isConverti: false };
  }
  return { bg: "rgba(148,163,184,0.15)", text: "#475569", label: "En cours", isConverti: false };
}

/* ── Status config (fallback for display-only Devis without ProDevis match) */
const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  "Brouillon": { bg: "rgba(148,163,184,0.15)", text: "#475569" },
  "Signé":     { bg: "rgba(45,140,255,0.12)",  text: "#1D6FCC" },
  "Commandé":  { bg: "rgba(139,92,246,0.12)",  text: "#6D28D9" },
  "Prêt":      { bg: "rgba(245,158,11,0.12)",  text: "#B45309" },
  "Livré":     { bg: "rgba(0,201,138,0.12)",   text: "#047857" },
  "Facturé":   { bg: "rgba(16,185,129,0.18)",  text: "#065F46" },
};

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

function loadDevis(): Devis[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("thor_pro_devis");
    return raw ? (JSON.parse(raw) as Devis[]) : [];
  } catch {
    return [];
  }
}

function loadProDevis(): ProDevis[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("thor_pro_devis");
    return raw ? (JSON.parse(raw) as ProDevis[]) : [];
  } catch {
    return [];
  }
}

function findProDevisMatch(devis: Devis, proList: ProDevis[], patient: CurrentPatient): ProDevis | null {
  // First try exact id match
  const byId = proList.find(p => p.id === devis.id);
  if (byId) return byId;
  // Then try patient name + date match
  const byPatientDate = proList.find(p =>
    samePatient(p.patientNom ?? "", p.patientPrenom ?? "", patient) &&
    (p.date ?? "") === devis.date
  );
  return byPatientDate ?? null;
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
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function getDocType(devis: Devis): string {
  return devis.status === "Facturé" ? "Facture" : "Devis";
}

/* ── SVG Icons ────────────────────────────────────────────────────────── */
function IconFile() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14 2v6h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function IconDownload() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path d="M12 3v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 10.5 12 13.9l3.5-3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 16.5v3A1.5 1.5 0 0 0 6.5 21h11A1.5 1.5 0 0 0 19 19.5v-3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
function IconSearch({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/* ── Print zone (hidden unless printing) ─────────────────────────────── */
function PrintZone({ devis }: { devis: Devis }) {
  return (
    <div className="hidden print:block p-8 text-sm text-slate-800">
      <div className="text-xl font-bold mb-2">
        {getDocType(devis)} — {devis.id}
      </div>
      <div className="text-slate-500 mb-4">Date : {formatDate(devis.date)}</div>
      <div className="mb-2">Patient : {devis.patientPrenom} {devis.patientNom}</div>
      <div className="mb-1">Total TTC : {devis.totalTTC.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</div>
      <div className="mb-1">Reste à charge : {devis.resteACharge.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</div>
      <div className="mb-4">Statut : {devis.status}</div>
      {devis.notes && <div className="text-slate-500">Notes : {devis.notes}</div>}
    </div>
  );
}

/* ── Icon for "converted" state ──────────────────────────────────────── */
function IconCheckCircle() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }} fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7.5 12l3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Document Card ────────────────────────────────────────────────────── */
function DevisCard({
  devis,
  enrichedStatus,
  onPrint,
}: {
  devis: Devis;
  enrichedStatus: EnrichedStatus | null;
  onPrint: (d: Devis) => void;
}) {
  const fallbackStyle = STATUS_CONFIG[devis.status] ?? { bg: "rgba(148,163,184,0.15)", text: "#475569" };
  const statusStyle = enrichedStatus
    ? { bg: enrichedStatus.bg, text: enrichedStatus.text }
    : fallbackStyle;
  const statusLabel = enrichedStatus ? enrichedStatus.label : devis.status;
  const isConverti = enrichedStatus?.isConverti ?? false;
  const docType = getDocType(devis);

  return (
    <div className="rounded-2xl p-5" style={glass}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="grid h-10 w-10 place-items-center rounded-xl text-xs font-bold flex-shrink-0"
            style={{ background: "rgba(45,140,255,0.08)", color: ACCENT }}
          >
            <IconFile />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-800">{devis.id}</span>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ background: "rgba(45,140,255,0.10)", color: ACCENT }}
              >
                {docType}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ background: statusStyle.bg, color: statusStyle.text }}
              >
                {statusLabel}
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500">{formatDate(devis.date)}</div>
            <div className="mt-2 flex flex-wrap gap-3">
              <span className="text-sm font-bold text-slate-800">
                {devis.totalTTC.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })} TTC
              </span>
              <span className="text-xs text-slate-500 self-center">
                RAC : {devis.resteACharge.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
              </span>
            </div>
            {isConverti && (
              <div
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold"
                style={{ background: "rgba(45,140,255,0.08)", color: ACCENT }}
              >
                <IconCheckCircle />
                Facture disponible —{" "}
                <a
                  href="#factures"
                  style={{ color: ACCENT, textDecoration: "underline", textUnderlineOffset: 2 }}
                >
                  Voir les factures
                </a>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onPrint(devis)}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition-all hover:text-slate-900 flex-shrink-0"
          style={glassSubtle}
        >
          <IconDownload />
          Télécharger
        </button>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────── */
export default function DocumentsPage() {
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [enrichedMap, setEnrichedMap] = useState<Map<string, EnrichedStatus>>(new Map());
  const [q, setQ] = useState("");
  const [printTarget, setPrintTarget] = useState<Devis | null>(null);

  useEffect(() => {
    const patient = loadCurrentPatient();
    const all = loadDevis();
    const filtered = all
      .filter((d) => samePatient(d.patientNom, d.patientPrenom, patient))
      .sort((a, b) => b.date.localeCompare(a.date));
    setDevisList(filtered);

    // Build enriched status map from thor_pro_devis
    const proList = loadProDevis().filter(
      (p) => samePatient(p.patientNom ?? "", p.patientPrenom ?? "", patient)
    );
    const map = new Map<string, EnrichedStatus>();
    for (const devis of filtered) {
      const match = findProDevisMatch(devis, proList, patient);
      if (match?.statut) {
        map.set(devis.id, resolveEnrichedStatus(match.statut));
      }
    }
    setEnrichedMap(map);
  }, []);

  function handlePrint(devis: Devis) {
    setPrintTarget(devis);
    // Give React time to render, then print
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintTarget(null), 500);
    }, 80);
  }

  const visible = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return devisList;
    return devisList.filter((d) =>
      d.id.toLowerCase().includes(qq) || d.status.toLowerCase().includes(qq)
    );
  }, [q, devisList]);

  return (
    <>
      {/* Print zone */}
      {printTarget && <PrintZone devis={printTarget} />}

      <div className="w-full space-y-6 print:hidden">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-light text-slate-900">
            <span className="font-bold">Documents</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Vos devis et factures</p>
        </div>

        {/* Search */}
        <div className="relative">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un document…"
            className="w-full rounded-2xl py-2.5 pl-10 pr-3 text-sm outline-none"
            style={glassSubtle}
          />
        </div>

        {/* List */}
        {visible.length > 0 ? (
          <div className="space-y-3">
            {visible.map((devis) => (
              <DevisCard
                key={devis.id}
                devis={devis}
                enrichedStatus={enrichedMap.get(devis.id) ?? null}
                onPrint={handlePrint}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl p-12 text-center" style={glass}>
            <div
              className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl"
              style={{ background: "rgba(45,140,255,0.08)" }}
            >
              <span style={{ color: ACCENT }}><IconFile /></span>
            </div>
            <p className="text-base font-semibold text-slate-700">Aucun document trouvé</p>
            <p className="mt-2 text-sm text-slate-500">
              {devisList.length === 0
                ? "Vos devis et factures apparaîtront ici après votre première visite."
                : "Aucun résultat pour cette recherche."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
