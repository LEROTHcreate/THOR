"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

/* ── Types (localStorage shapes) ────────────────────────────────────── */
interface CurrentPatient {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
}

interface AlertOrdonnance {
  id: string;
  patientNom?: string;
  patientPrenom?: string;
  dateExpiration?: string;
  type?: string;
}

interface AlertRappel {
  id: string;
  patientNom?: string;
  patientPrenom?: string;
  prochainRenouvellement?: string;
  statut?: string;
}

const MOCK_PATIENT: CurrentPatient = {
  id: "patient-1",
  nom: "Leblanc",
  prenom: "Marie",
  email: "marie.leblanc@email.fr",
};

interface RendezVous {
  id: string;
  date: string;        // "YYYY-MM-DD"
  heure: string;       // "HH:MM"
  duree: number;
  type: string;
  patientNom: string;
  patientPrenom: string;
  praticien?: string;
  statut: string;
}

interface Ordonnance {
  id: string;
  numero: string;
  patientNom: string;
  patientPrenom: string;
  dateOrdonnance: string;
  dateExpiration: string;
  prescripteur: string;
  od: { sphere: number | null; cylindre: number | null; axe: number | null; addition: number | null };
  og: { sphere: number | null; cylindre: number | null; axe: number | null; addition: number | null };
  remarques?: string;
}

interface Devis {
  id: string;
  patientNom: string;
  patientPrenom: string;
  totalTTC: number;
  resteACharge: number;
  status: string;
  date: string;
}

/* ── localStorage helpers ────────────────────────────────────────────── */
function loadLS<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function loadCurrentPatient(): CurrentPatient {
  if (typeof window === "undefined") return MOCK_PATIENT;
  try {
    const raw = localStorage.getItem("thor_patient_current");
    return raw ? (JSON.parse(raw) as CurrentPatient) : MOCK_PATIENT;
  } catch {
    return MOCK_PATIENT;
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
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

const TYPE_LABELS: Record<string, string> = {
  controle: "Contrôle",
  adaptation: "Adaptation lentilles",
  livraison: "Livraison",
  urgence: "Urgence",
  autre: "Autre",
};

/* ── SVG Icons ────────────────────────────────────────────────────────── */
function SvgCalendar() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function SvgClipboard() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="1.7" />
      <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function SvgFile() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path d="M7 2.8h6.8L19.2 8v13.2A2 2 0 0 1 17.2 23H7A2 2 0 0 1 5 21.2V4.8A2 2 0 0 1 7 2.8Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M13.8 2.8V8h5.4M8 12h8M8 15.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function SvgUser() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path d="M12 12.2a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12.2Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.5 20.2c1.7-4 13.3-4 15 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function SvgArrow() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Alert banner sub-components ─────────────────────────────────────── */
function SvgWarning({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      />
      <line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.8" fill={color} stroke={color} strokeWidth="0.5" />
    </svg>
  );
}

function SvgBell({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

type OrdBannerState =
  | { kind: "expired"; days: number }
  | { kind: "soon"; days: number }
  | null;

type RappelBannerState =
  | { kind: "soon"; days: number }
  | null;

/* ── Component ───────────────────────────────────────────────────────── */
export default function VisionDashboardPage() {
  const [patient, setPatient] = useState<CurrentPatient>(MOCK_PATIENT);
  const [nextRdv, setNextRdv] = useState<RendezVous | null>(null);
  const [lastOrd, setLastOrd] = useState<Ordonnance | null>(null);
  const [lastDevis, setLastDevis] = useState<Devis | null>(null);
  const [ordBanner, setOrdBanner] = useState<OrdBannerState>(null);
  const [rappelBanner, setRappelBanner] = useState<RappelBannerState>(null);
  const [conseilIndex, setConseilIndex] = useState(0);

  useEffect(() => {
    const p = loadCurrentPatient();
    setPatient(p);

    const today = new Date().toISOString().split("T")[0] ?? "";

    // Next RDV: filter by patient, future dates, sort ascending
    const allRdvs = loadLS<RendezVous>("thor_pro_rdv");
    const patientRdvs = allRdvs
      .filter((r) => samePatient(r.patientNom, r.patientPrenom, p) && r.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    setNextRdv(patientRdvs[0] ?? null);

    // Last ordonnance: filter by patient, sort descending by date
    const allOrds = loadLS<Ordonnance>("thor_pro_ordonnances");
    const patientOrds = allOrds
      .filter((o) => samePatient(o.patientNom, o.patientPrenom, p))
      .sort((a, b) => b.dateOrdonnance.localeCompare(a.dateOrdonnance));
    setLastOrd(patientOrds[0] ?? null);

    // Last devis: filter by patient, sort descending by date
    const allDevis = loadLS<Devis>("thor_pro_devis");
    const patientDevis = allDevis
      .filter((d) => samePatient(d.patientNom, d.patientPrenom, p))
      .sort((a, b) => b.date.localeCompare(a.date));
    setLastDevis(patientDevis[0] ?? null);

    // ── Alert: ordonnance expirée / expire bientôt ─────────────────────
    const todayMs = new Date().setHours(0, 0, 0, 0);
    const allAlertOrds = loadLS<AlertOrdonnance>("thor_pro_ordonnances");
    const patientAlertOrds = allAlertOrds.filter((o) =>
      o.patientNom && o.patientPrenom
        ? samePatient(o.patientNom, o.patientPrenom, p)
        : false
    );

    let computedOrdBanner: OrdBannerState = null;
    for (const ord of patientAlertOrds) {
      if (!ord.dateExpiration) continue;
      const expMs = new Date(ord.dateExpiration).setHours(0, 0, 0, 0);
      const diffDays = Math.round((expMs - todayMs) / 86_400_000);
      if (diffDays < 0) {
        // Expired — show red banner (prefer most recently expired)
        if (
          computedOrdBanner === null ||
          computedOrdBanner.kind !== "expired" ||
          diffDays > computedOrdBanner.days
        ) {
          computedOrdBanner = { kind: "expired", days: Math.abs(diffDays) };
        }
      } else if (diffDays <= 30) {
        // Expires soon — only set if no expired banner already found
        if (computedOrdBanner === null || computedOrdBanner.kind === "soon") {
          if (
            computedOrdBanner === null ||
            diffDays < (computedOrdBanner as { kind: "soon"; days: number }).days
          ) {
            computedOrdBanner = { kind: "soon", days: diffDays };
          }
        }
      }
    }
    setOrdBanner(computedOrdBanner);

    // ── Alert: rappel renouvellement lentilles ────────────────────────
    const allRappels = loadLS<AlertRappel>("thor_pro_renouvellements_rappels");
    const patientRappels = allRappels.filter((r) =>
      r.patientNom && r.patientPrenom
        ? samePatient(r.patientNom, r.patientPrenom, p)
        : false
    );

    let computedRappelBanner: RappelBannerState = null;
    for (const r of patientRappels) {
      if (!r.prochainRenouvellement || r.statut === "terminé") continue;
      const renewMs = new Date(r.prochainRenouvellement).setHours(0, 0, 0, 0);
      const diffDays = Math.round((renewMs - todayMs) / 86_400_000);
      if (diffDays >= 0 && diffDays <= 15) {
        if (
          computedRappelBanner === null ||
          diffDays < computedRappelBanner.days
        ) {
          computedRappelBanner = { kind: "soon", days: diffDays };
        }
      }
    }
    setRappelBanner(computedRappelBanner);
  }, []);

  const initials = `${patient.prenom[0] ?? ""}${patient.nom[0] ?? ""}`.toUpperCase();

  return (
    <div className="space-y-8">

      {/* EN-TÊTE — carte claire et accueillante */}
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold shrink-0"
            style={{ background: ACCENT, boxShadow: "0 4px 14px rgba(45,140,255,0.25)" }}>
            {initials}
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium tracking-wide">
              {new Date().getHours() < 12 ? "Bonjour" : new Date().getHours() < 18 ? "Bon après-midi" : "Bonsoir"}
            </p>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              {patient.prenom} {patient.nom}
            </h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {lastOrd && new Date(lastOrd.dateExpiration) > new Date() && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1"
                  style={{ background: "rgba(45,140,255,0.10)", color: "#1A72E8" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2D8CFF] animate-pulse" />
                  Ordonnance valide
                </span>
              )}
              <span className="text-[11px] text-slate-500">Données sécurisées HDS</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 flex-wrap">
          <Link href="/clair-vision/espace-patient/rendez-vous"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ background: ACCENT, boxShadow: "0 4px 12px rgba(45,140,255,0.3)" }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Prendre RDV
          </Link>
          <Link href="/clair-vision/espace-patient/messages"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Messages
          </Link>
        </div>
      </div>

      {/* ALERTES ────────────────────────────────────────────────────────── */}
      {(ordBanner !== null || rappelBanner !== null) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>

          {/* Ordonnance expirée — rouge */}
          {ordBanner?.kind === "expired" && (
            <div
              style={{
                borderRadius: 14,
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(239,68,68,0.10)",
                border: "1px solid rgba(239,68,68,0.28)",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <SvgWarning color="#DC2626" />
                <span style={{ fontSize: 14, fontWeight: 600, color: "#991B1B" }}>
                  Votre ordonnance est expirée depuis{" "}
                  {ordBanner.days === 1 ? "1 jour" : `${ordBanner.days} jours`}
                </span>
              </div>
              <a
                href="/clair-vision/espace-patient/rendez-vous"
                style={{
                  borderRadius: 999,
                  padding: "7px 16px",
                  background: "#fff",
                  color: "#DC2626",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                  border: "1.5px solid rgba(239,68,68,0.35)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                Prendre rendez-vous
              </a>
            </div>
          )}

          {/* Ordonnance expire bientôt — orange */}
          {ordBanner?.kind === "soon" && (
            <div
              style={{
                borderRadius: 14,
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(251,146,60,0.10)",
                border: "1px solid rgba(251,146,60,0.30)",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <SvgWarning color="#EA580C" />
                <span style={{ fontSize: 14, fontWeight: 600, color: "#9A3412" }}>
                  Votre ordonnance expire dans{" "}
                  {ordBanner.days === 0
                    ? "moins d'un jour"
                    : ordBanner.days === 1
                    ? "1 jour"
                    : `${ordBanner.days} jours`}
                </span>
              </div>
              <a
                href="/clair-vision/espace-patient/rendez-vous"
                style={{
                  borderRadius: 999,
                  padding: "7px 16px",
                  background: "#fff",
                  color: "#EA580C",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                  border: "1.5px solid rgba(251,146,60,0.40)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                Renouveler maintenant
              </a>
            </div>
          )}

          {/* Rappel renouvellement lentilles — bleu */}
          {rappelBanner?.kind === "soon" && (
            <div
              style={{
                borderRadius: 14,
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(45,140,255,0.08)",
                border: "1px solid rgba(45,140,255,0.22)",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <SvgBell color={ACCENT} />
                <span style={{ fontSize: 14, fontWeight: 600, color: "#1A4E8A" }}>
                  Votre renouvellement de lentilles approche — dans{" "}
                  {rappelBanner.days === 0
                    ? "moins d'un jour"
                    : rappelBanner.days === 1
                    ? "1 jour"
                    : `${rappelBanner.days} jours`}
                </span>
              </div>
              <a
                href="/clair-vision/espace-patient/lentilles"
                style={{
                  borderRadius: 999,
                  padding: "7px 16px",
                  background: "#fff",
                  color: ACCENT,
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                  border: `1.5px solid rgba(45,140,255,0.30)`,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                Commander
              </a>
            </div>
          )}

        </div>
      )}

      {/* GRILLE 3 COLONNES — RDV · ORDONNANCE · DEVIS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Prochain RDV */}
        <div className="rounded-3xl p-6" style={glass}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span style={{ color: ACCENT }}><SvgCalendar /></span>
              Votre prochain RDV
            </div>
          </div>
          {nextRdv ? (
            <>
              <div className="flex items-center gap-4 mt-2">
                <div
                  className="rounded-2xl px-4 py-3 text-center min-w-[56px]"
                  style={{ background: "rgba(45,140,255,0.07)", border: "1px solid rgba(45,140,255,0.15)" }}
                >
                  <div className="text-2xl font-bold text-slate-800">
                    {new Date(nextRdv.date).getDate()}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(nextRdv.date).toLocaleDateString("fr-FR", { month: "short" })}
                  </div>
                </div>
                <div>
                  <div className="text-base font-semibold text-slate-800">{nextRdv.heure}</div>
                  <div className="text-sm text-slate-500 mt-0.5">
                    {TYPE_LABELS[nextRdv.type] ?? nextRdv.type}
                  </div>
                  {nextRdv.praticien && (
                    <div className="text-xs text-slate-500 mt-0.5">{nextRdv.praticien}</div>
                  )}
                </div>
              </div>
              <Link
                href="/clair-vision/espace-patient/rendez-vous"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition-all hover:gap-2.5"
                style={{ color: ACCENT }}
              >
                Voir mes rendez-vous <SvgArrow />
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500 mt-2">Aucun RDV planifié</p>
              <Link
                href="/clair-vision/espace-patient/rendez-vous"
                className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(45,140,255,0.28)] transition-all hover:shadow-[0_6px_20px_rgba(45,140,255,0.38)]"
                style={{ background: ACCENT }}
              >
                Prendre rendez-vous
              </Link>
            </>
          )}
        </div>

        {/* Dernière ordonnance */}
        <div className="rounded-3xl p-6" style={glass}>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">
            <span style={{ color: ACCENT }}><SvgClipboard /></span>
            Votre dernière ordonnance
          </div>
          {lastOrd ? (
            <>
              <div className="text-base font-semibold text-slate-800 mt-2">{lastOrd.numero}</div>
              <div className="text-sm text-slate-500 mt-1">{formatDate(lastOrd.dateOrdonnance)}</div>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={
                  new Date(lastOrd.dateExpiration) > new Date()
                    ? { background: "rgba(16,185,129,0.10)", color: "#047857" }
                    : { background: "rgba(239,68,68,0.10)", color: "#991b1b" }
                }
              >
                {new Date(lastOrd.dateExpiration) > new Date()
                  ? `Valide jusqu'au ${formatDate(lastOrd.dateExpiration)}`
                  : `Expirée le ${formatDate(lastOrd.dateExpiration)}`}
              </div>
              <div className="mt-4">
                <Link
                  href="/clair-vision/espace-patient/ordonnances"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold transition-all hover:gap-2.5"
                  style={{ color: ACCENT }}
                >
                  Voir mes ordonnances <SvgArrow />
                </Link>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500 mt-2">
              Aucune ordonnance trouvée — votre opticien peut les enregistrer lors de votre prochaine visite.
            </p>
          )}
        </div>

        {/* Dernier devis */}
        <div className="rounded-3xl p-6" style={glass}>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">
            <span style={{ color: ACCENT }}><SvgFile /></span>
            Votre dernier devis
          </div>
          {lastDevis ? (
            <>
              <div className="text-base font-semibold text-slate-800 mt-2">{lastDevis.id}</div>
              <div className="text-sm text-slate-500 mt-1">{formatDate(lastDevis.date)}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-sm font-bold text-slate-800">
                  {lastDevis.totalTTC.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })} TTC
                </span>
                <span className="text-xs text-slate-500">
                  RAC : {lastDevis.resteACharge.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                </span>
              </div>
              <div className="mt-2">
                <span
                  className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{ background: "rgba(45,140,255,0.10)", color: ACCENT }}
                >
                  {lastDevis.status}
                </span>
              </div>
              <div className="mt-4">
                <Link
                  href="/clair-vision/espace-patient/documents"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold transition-all hover:gap-2.5"
                  style={{ color: ACCENT }}
                >
                  Voir mes documents <SvgArrow />
                </Link>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500 mt-2">Aucun devis enregistré pour le moment.</p>
          )}
        </div>
      </div>

      {/* PRESCRIPTION OPTIQUE */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between"
          style={{ background: `linear-gradient(90deg,${ACCENT}08,#fff)` }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
              style={{ background: ACCENT }}>OD</div>
            <div className="text-sm font-bold text-slate-800">Ma prescription optique</div>
          </div>
          {lastOrd && (
            <div className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={
                new Date(lastOrd.dateExpiration) > new Date()
                  ? { background: "rgba(16,185,129,0.10)", color: "#047857" }
                  : { background: "rgba(239,68,68,0.10)", color: "#991b1b" }
              }>
              {new Date(lastOrd.dateExpiration) > new Date() ? "Valide" : "Expirée"}
            </div>
          )}
        </div>

        {lastOrd ? (
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* OD */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: ACCENT + "30" }}>
                <div className="px-4 py-2 text-xs font-bold text-white flex items-center gap-1.5"
                  style={{ background: ACCENT }}>
                  <span>OD</span>
                  <span className="font-normal opacity-80">— Œil droit</span>
                </div>
                <div className="grid grid-cols-2 gap-px bg-slate-100">
                  {[
                    { label: "Sphère",    val: lastOrd.od.sphere    },
                    { label: "Cylindre",  val: lastOrd.od.cylindre  },
                    { label: "Axe",       val: lastOrd.od.axe,   suffix: "°" },
                    { label: "Addition",  val: lastOrd.od.addition  },
                  ].map(({ label, val, suffix }) => (
                    <div key={label} className="bg-white px-3 py-2.5">
                      <div className="text-[10px] text-slate-500 mb-0.5">{label}</div>
                      <div className="text-sm font-bold text-slate-800">
                        {val !== null && val !== undefined
                          ? `${val > 0 ? "+" : ""}${val}${suffix ?? ""}`
                          : <span className="text-slate-500">—</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* OG */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#8b5cf630" }}>
                <div className="px-4 py-2 text-xs font-bold text-white flex items-center gap-1.5"
                  style={{ background: "#8b5cf6" }}>
                  <span>OG</span>
                  <span className="font-normal opacity-80">— Œil gauche</span>
                </div>
                <div className="grid grid-cols-2 gap-px bg-slate-100">
                  {[
                    { label: "Sphère",    val: lastOrd.og.sphere    },
                    { label: "Cylindre",  val: lastOrd.og.cylindre  },
                    { label: "Axe",       val: lastOrd.og.axe,   suffix: "°" },
                    { label: "Addition",  val: lastOrd.og.addition  },
                  ].map(({ label, val, suffix }) => (
                    <div key={label} className="bg-white px-3 py-2.5">
                      <div className="text-[10px] text-slate-500 mb-0.5">{label}</div>
                      <div className="text-sm font-bold text-slate-800">
                        {val !== null && val !== undefined
                          ? `${val > 0 ? "+" : ""}${val}${suffix ?? ""}`
                          : <span className="text-slate-500">—</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Prescrit par {lastOrd.prescripteur} · {formatDate(lastOrd.dateOrdonnance)}</span>
              <span>Validité : {formatDate(lastOrd.dateExpiration)}</span>
            </div>
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center"
              style={{ background: ACCENT + "12" }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <p className="text-sm text-slate-500">Aucune ordonnance enregistrée.</p>
            <p className="text-xs text-slate-500 mt-1">Votre opticien peut l&apos;ajouter lors de votre prochaine visite.</p>
          </div>
        )}
      </div>

      {/* CONSEILS DU MOMENT */}
      {(() => {
        const conseils = [
          { titre: "Lumière bleue & écrans", texte: "À moins de 40 cm de l'écran, pensez à faire des pauses toutes les 20 minutes. La règle des 20-20-20 : 20 secondes sur un objet à 6 m.", icon: "" },
          { titre: "Port des lunettes", texte: "Portez vos lunettes systématiquement pour éviter la fatigue oculaire. Un port partiel peut paradoxalement accentuer les symptômes.", icon: "" },
          { titre: "Entretien des verres", texte: "Nettoyez vos verres avec le chiffon microfibre fourni et une solution adaptée. Évitez les papiers et tissus qui peuvent rayer.", icon: "" },
          { titre: "Contrôle annuel", texte: "Un contrôle de vue annuel est recommandé, même sans gêne visible. La vue évolue progressivement et s'adapte sans que vous le perceviez.", icon: "" },
        ];
        const c = conseils[conseilIndex]!;
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-5"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Conseil du moment</div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
                style={{ background: ACCENT + "12" }}>{c.icon}</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-slate-800 mb-1">{c.titre}</div>
                <p className="text-sm text-slate-500 leading-relaxed">{c.texte}</p>
              </div>
            </div>
            {/* Navigation dots */}
            <div className="flex items-center justify-between mt-5">
              <div className="flex gap-1.5">
                {conseils.map((_, i) => (
                  <button key={i} onClick={() => setConseilIndex(i)}
                    className="rounded-full transition-all"
                    style={{
                      width: i === conseilIndex ? 20 : 6,
                      height: 6,
                      background: i === conseilIndex ? ACCENT : "#e2e8f0",
                    }} />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setConseilIndex((conseilIndex - 1 + conseils.length) % conseils.length)}
                  className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-all">
                  <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
                <button onClick={() => setConseilIndex((conseilIndex + 1) % conseils.length)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-all hover:opacity-90"
                  style={{ background: ACCENT }}>
                  <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ACTIONS RAPIDES */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Prendre RDV",        href: "/clair-vision/espace-patient/rendez-vous", Icon: SvgCalendar },
            { label: "Mes ordonnances",    href: "/clair-vision/espace-patient/ordonnances", Icon: SvgClipboard },
            { label: "Mes documents",      href: "/clair-vision/espace-patient/documents",   Icon: SvgFile },
            { label: "Mon profil",         href: "/clair-vision/espace-patient/mon-profil",  Icon: SvgUser },
          ].map(({ label, href, Icon }) => (
            <Link
              key={href}
              href={href}
              className="rounded-2xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(45,140,255,0.12)]"
              style={glass}
            >
              <div
                className="grid h-10 w-10 place-items-center rounded-xl text-white shadow-[0_4px_14px_rgba(45,140,255,0.28)]"
                style={{ background: ACCENT }}
              >
                <Icon />
              </div>
              <div className="text-sm font-semibold text-slate-800">{label}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="rounded-2xl px-5 py-3 text-xs text-slate-500" style={glassSubtle}>
        Ces informations sont fournies à titre informatif et ne remplacent pas un avis médical professionnel.
        En cas de doute, consultez votre professionnel de santé.
      </div>
    </div>
  );
}
