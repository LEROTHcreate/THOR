"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

/* ── Types ───────────────────────────────────────────────────────────────── */
type DossierStatut = "Terminé" | "En cours" | "À compléter";

interface Dossier {
  id: string;
  patientNom?: string;
  patientPrenom?: string;
  type?: string;
  status?: DossierStatut;
  praticien?: string;
  date?: string;
  createdAt?: string;
}

const LS_KEY = "thor_pro_dossiers";

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function fmtDate(iso?: string): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return iso; }
}
function initials(prenom = "", nom = ""): string {
  return ((prenom[0] ?? "") + (nom[0] ?? "")).toUpperCase() || "—";
}

const STATUT_STYLE: Record<DossierStatut, string> = {
  "Terminé":     "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  "En cours":    "bg-blue-50 text-vision-accent dark:bg-vision-accent/10",
  "À compléter": "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
};

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function DossiersOptiquePage() {
  const [hydrated, setHydrated] = useState(false);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [search, setSearch]     = useState("");
  const [statut, setStatut]     = useState<DossierStatut | "Tous">("Tous");

  useEffect(() => {
    setHydrated(true);
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setDossiers(JSON.parse(raw) as Dossier[]);
    } catch { /* ignore */ }
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dossiers
      .filter(d => statut === "Tous" || d.status === statut)
      .filter(d => {
        if (!q) return true;
        const fullName = `${d.patientPrenom ?? ""} ${d.patientNom ?? ""}`.toLowerCase();
        return fullName.includes(q) || (d.type ?? "").toLowerCase().includes(q);
      });
  }, [dossiers, search, statut]);

  const counts: Record<DossierStatut | "Tous", number> = {
    Tous: dossiers.length,
    "Terminé":     dossiers.filter(d => d.status === "Terminé").length,
    "En cours":    dossiers.filter(d => d.status === "En cours").length,
    "À compléter": dossiers.filter(d => d.status === "À compléter").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-slate-900 dark:text-slate-50 m-0 leading-none">
            Dossiers Optique
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-0">
            {hydrated && dossiers.length === 0
              ? "Aucun dossier pour l'instant."
              : <><span className="tabular-nums font-medium text-slate-700 dark:text-slate-300">{dossiers.length}</span> dossier{dossiers.length > 1 ? "s" : ""}</>
            }
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 h-10 px-4 rounded-[10px] text-sm font-medium text-white bg-vision-accent hover:bg-[#1A72E8] transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nouveau dossier
        </button>
      </header>

      {/* Toolbar */}
      {(dossiers.length > 0 || search) && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <svg
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un patient ou un type de dossier…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 rounded-[10px] text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none transition-colors focus:border-vision-accent placeholder:text-slate-400"
              style={{ padding: "0 12px 0 38px" }}
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["Tous", "Terminé", "En cours", "À compléter"] as const).map(s => {
              const active = statut === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatut(s)}
                  aria-pressed={active}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] text-[13px] font-semibold transition-colors"
                  style={{
                    border: active ? "1px solid transparent" : "1px solid var(--border)",
                    background: active ? "#2D8CFF" : "var(--surface)",
                    color: active ? "#fff" : "var(--muted)",
                  }}
                >
                  {s}
                  <span
                    className="text-[11px] font-bold tabular-nums px-1.5 py-0 rounded-md leading-[18px]"
                    style={{
                      background: active ? "rgba(255,255,255,0.22)" : "var(--glass-subtle-bg)",
                      color: active ? "#fff" : "var(--muted)",
                      minWidth: 22,
                      textAlign: "center",
                    }}
                  >
                    {counts[s]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* List / Empty */}
      {hydrated && dossiers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 py-16 text-center">
          <div className="grid place-items-center w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto mb-5">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1.5">Aucun dossier</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Créez un dossier pour suivre un patient : examens, ordonnances, équipement, devis.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 py-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">Aucun dossier ne correspond à cette recherche.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_180px_140px_120px_24px] gap-4 px-5 py-3 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <span>Patient</span>
            <span>Type</span>
            <span>Date</span>
            <span>Statut</span>
            <span />
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map(d => (
              <li key={d.id}>
                <Link
                  href={`/clair-vision/pro/optique/dossiers/${d.id}`}
                  className="grid grid-cols-[1fr] sm:grid-cols-[1fr_180px_140px_120px_24px] gap-2 sm:gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid place-items-center w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 flex-shrink-0">
                      {initials(d.patientPrenom, d.patientNom)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {d.patientPrenom} {d.patientNom}
                      </p>
                      {d.praticien && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{d.praticien}</p>
                      )}
                    </div>
                  </div>
                  <span className="hidden sm:flex items-center text-sm text-slate-700 dark:text-slate-300 truncate">
                    {d.type ?? "—"}
                  </span>
                  <span className="hidden sm:flex items-center text-xs tabular-nums text-slate-500 dark:text-slate-400">
                    {d.date ? d.date : fmtDate(d.createdAt)}
                  </span>
                  <span className="hidden sm:flex items-center">
                    {d.status && (
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${STATUT_STYLE[d.status]}`}>
                        {d.status}
                      </span>
                    )}
                  </span>
                  <span className="hidden sm:flex items-center justify-end text-slate-400">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
