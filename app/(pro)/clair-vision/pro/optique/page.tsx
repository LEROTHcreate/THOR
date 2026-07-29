"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/* ── LocalStorage ─────────────────────────────────────────────────────────── */
function safeLoad<T>(key: string, fb: T[] = []): T[] {
  if (typeof window === "undefined") return fb;
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; }
  catch { return fb; }
}

/* ── Date utils ──────────────────────────────────────────────────────────── */
function daysSince(iso: string)  { return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000); }
function isToday(d: string)      { return new Date(d).toDateString() === new Date().toDateString(); }
function isThisMonth(d: string)  { const dt=new Date(d),n=new Date(); return dt.getFullYear()===n.getFullYear()&&dt.getMonth()===n.getMonth(); }
function fmtDate(iso: string)    { return new Date(iso).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"}); }

/* ── Types ───────────────────────────────────────────────────────────────── */
type DType = "montures-verres" | "lentilles" | "basse-vision" | "autre";
interface Dossier { id: string; patientNom?: string; patientPrenom?: string; status?: string; type?: DType; dateLivraison?: string; }
interface Rdv     { id: string; date?: string; heure?: string; patientNom?: string; patientPrenom?: string; titre?: string; type?: string; statut?: string; }
interface Patient { id: string; nom?: string; prenom?: string; createdAt?: string; }
interface Facture { id: string; montantTTC?: number; montant?: number; date?: string; createdAt?: string; }

const THRESH: Record<DType, number> = { "montures-verres": 730, "lentilles": 365, "basse-vision": 730, "autre": 730 };
const SOON_OFFSET = 60, INACTIVE = 365;

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function VisionDashboard() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  const dossiers = useMemo(() => hydrated ? safeLoad<Dossier>("thor_pro_dossiers") : [], [hydrated]);
  const patients = useMemo(() => hydrated ? safeLoad<Patient>("thor_pro_patients") : [], [hydrated]);
  const rdvs     = useMemo(() => hydrated ? safeLoad<Rdv>("thor_pro_rdv") : [], [hydrated]);
  const factures = useMemo(() => hydrated ? safeLoad<Facture>("thor_pro_factures") : [], [hydrated]);

  const rdvToday = useMemo(() => rdvs.filter(r => r.date && isToday(r.date)), [rdvs]);
  const caMonth  = useMemo(() => factures.filter(f => {
    const d = f.date ?? f.createdAt ?? "";
    return d && isThisMonth(d);
  }).reduce((s, f) => s + (f.montantTTC ?? f.montant ?? 0), 0), [factures]);
  const agenda = useMemo(() => rdvToday.slice().sort((a, b) => (a.heure ?? "").localeCompare(b.heure ?? "")), [rdvToday]);

  const renewals = useMemo(() =>
    dossiers
      .filter(d => d.status === "Livré" && d.dateLivraison)
      .map(d => {
        const t = THRESH[d.type ?? "montures-verres"] ?? 730;
        const days = daysSince(d.dateLivraison!);
        const s = days >= t ? "eligible" : days >= t - SOON_OFFSET ? "soon" : null;
        return s ? { ...d, days, s, left: t - days, t } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b!.days - a!.days)
      .slice(0, 6) as Array<Dossier & { days: number; s: "eligible" | "soon"; left: number; t: number }>,
    [dossiers]
  );

  const inactive = useMemo(() =>
    patients
      .map(p => {
        const nm = `${p.nom ?? ""} ${p.prenom ?? ""}`.trim().toLowerCase();
        const last = rdvs
          .filter(r => `${r.patientNom ?? ""} ${r.patientPrenom ?? ""}`.trim().toLowerCase() === nm && r.date)
          .sort((a, b) => b.date!.localeCompare(a.date!))[0];
        const d = daysSince(last?.date ?? p.createdAt ?? "2099-01-01");
        return d >= INACTIVE ? { ...p, days: d } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b!.days - a!.days)
      .slice(0, 5) as Array<Patient & { days: number }>,
    [patients, rdvs]
  );

  const greet   = useMemo(() => { const h = new Date().getHours(); return h < 12 ? "Bonjour" : h < 18 ? "Bonne après-midi" : "Bonsoir"; }, []);
  const dateLbl = useMemo(() => new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }), []);
  const caDisplay = caMonth >= 1000 ? `${(caMonth / 1000).toFixed(1).replace(".", ",")} k€` : `${caMonth.toLocaleString("fr-FR")} €`;

  const empty = hydrated && patients.length === 0 && rdvs.length === 0 && dossiers.length === 0;

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 capitalize">{dateLbl}</p>
          <h1 className="text-[28px] font-semibold tracking-tight text-slate-900 dark:text-slate-50 m-0 leading-none">{greet}</h1>
        </div>
        <Link
          href="/clair-vision/pro/patients"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-[10px] text-sm font-medium text-white bg-vision-accent hover:bg-[#1A72E8] transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nouveau patient
        </Link>
      </header>

      {/* ── KPI strip ── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="RDV aujourd'hui" value={hydrated ? rdvToday.length : 0} />
        <Kpi label="Patients"        value={hydrated ? patients.length : 0} />
        <Kpi label="CA du mois"      value={caDisplay} />
      </div>

      {empty && (
        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-white/[0.06] backdrop-blur-xl shadow-[0_1px_3px_rgba(15,23,42,0.06),0_4px_16px_rgba(15,23,42,0.04)] dark:shadow-none px-8 py-16 text-center">
          <div className="grid place-items-center w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-slate-400 mx-auto mb-5">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" /><circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1.5">Bienvenue dans votre espace</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            Commencez par créer votre premier patient. Les rendez-vous, dossiers et statistiques s'afficheront ici au fur et à mesure.
          </p>
          <div className="flex justify-center gap-2">
            <Link href="/clair-vision/pro/patients" className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] text-sm font-medium text-white bg-vision-accent hover:bg-[#1A72E8] transition-colors">
              Créer un patient
            </Link>
            <Link href="/clair-vision/pro/agenda" className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.10] transition-colors">
              Ouvrir l'agenda
            </Link>
          </div>
        </div>
      )}

      {!empty && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-start">
          {/* LEFT */}
          <div className="space-y-6 min-w-0">
            {/* Renouvellements */}
            <section className="rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-white/[0.06] backdrop-blur-xl shadow-[0_1px_3px_rgba(15,23,42,0.06),0_4px_16px_rgba(15,23,42,0.04)] dark:shadow-none">
              <SectionHeader
                title="Renouvellements"
                hint="Montures & Verres : 2 ans · Lentilles : 1 an"
                count={renewals.length}
              />
              <div className="px-5 pb-5">
                {renewals.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 py-2">Aucun équipement éligible pour l'instant.</p>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-white/[0.06] -mx-1">
                    {renewals.map(r => {
                      const eli = r.s === "eligible";
                      const typeLabel = r.type === "lentilles" ? "Lentilles" : "Montures & verres";
                      const eligibleDate = new Date(new Date(r.dateLivraison!).getTime() + r.t * 86_400_000);
                      return (
                        <li key={r.id} className="flex items-center gap-3 px-1 py-3">
                          <Avatar initials={`${r.patientPrenom?.[0] ?? ""}${r.patientNom?.[0] ?? ""}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                              {r.patientPrenom} {r.patientNom}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              {typeLabel} · livré le {fmtDate(r.dateLivraison!)}
                            </p>
                          </div>
                          <span className={`text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap ${
                            eli
                              ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
                              : "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.06]"
                          }`}>
                            {eli ? "Éligible" : `dans ${r.left} j`}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>

            {/* Patients à relancer */}
            <section className="rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-white/[0.06] backdrop-blur-xl shadow-[0_1px_3px_rgba(15,23,42,0.06),0_4px_16px_rgba(15,23,42,0.04)] dark:shadow-none">
              <SectionHeader
                title="Patients à relancer"
                hint="Sans rendez-vous depuis plus de 12 mois"
                count={inactive.length}
              />
              <div className="px-5 pb-5">
                {inactive.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 py-2">Tous vos patients ont eu un suivi récent.</p>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-white/[0.06] -mx-1">
                    {inactive.map(p => {
                      const months = Math.round(p.days / 30);
                      return (
                        <li key={p.id} className="flex items-center gap-3 px-1 py-3">
                          <Avatar initials={`${p.prenom?.[0] ?? ""}${p.nom?.[0] ?? ""}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                              {p.prenom} {p.nom}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Dernière visite il y a {months} mois
                            </p>
                          </div>
                          <Link
                            href="/clair-vision/pro/agenda"
                            className="text-xs font-medium px-2.5 py-1.5 rounded-md text-vision-accent hover:bg-vision-bg dark:hover:bg-vision-accent/10 transition-colors"
                          >
                            Planifier
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT */}
          <aside className="space-y-6 min-w-0">
            {/* Agenda du jour */}
            <section className="rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-white/[0.06] backdrop-blur-xl shadow-[0_1px_3px_rgba(15,23,42,0.06),0_4px_16px_rgba(15,23,42,0.04)] dark:shadow-none">
              <SectionHeader title="Agenda du jour" count={agenda.length} />
              <div className="px-5 pb-5">
                {agenda.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 py-2">Journée libre.</p>
                ) : (
                  <ul className="space-y-2">
                    {agenda.map(r => (
                      <li key={r.id} className="flex items-center gap-3">
                        <span className="text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400 w-12 flex-shrink-0">
                          {r.heure ?? "—"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-900 dark:text-slate-100 truncate">
                            {r.patientPrenom} {r.patientNom}
                          </p>
                          {(r.titre || r.type) && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.titre ?? r.type}</p>
                          )}
                        </div>
                        {r.statut === "Confirmé" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" aria-label="Confirmé" />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  href="/clair-vision/pro/agenda"
                  className="block mt-4 text-xs font-medium text-vision-accent hover:underline"
                >
                  Voir l'agenda →
                </Link>
              </div>
            </section>

            {/* Actions rapides */}
            <section className="rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-white/[0.06] backdrop-blur-xl shadow-[0_1px_3px_rgba(15,23,42,0.06),0_4px_16px_rgba(15,23,42,0.04)] dark:shadow-none p-2">
              <div className="px-3 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Actions rapides
              </div>
              <nav className="flex flex-col">
                <QuickLink href="/clair-vision/pro/patients" label="Nouveau patient" />
                <QuickLink href="/clair-vision/pro/agenda"   label="Planifier un RDV" />
                <QuickLink href="/clair-vision/pro/optique/dossiers" label="Nouveau dossier" />
                <QuickLink href="/clair-vision/pro/devis"    label="Créer un devis" />
              </nav>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */
function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-white/[0.06] backdrop-blur-xl shadow-[0_1px_3px_rgba(15,23,42,0.06),0_4px_16px_rgba(15,23,42,0.04)] dark:shadow-none px-5 py-4">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">{label}</p>
      <p className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-50 leading-none">
        {value}
      </p>
    </div>
  );
}

function SectionHeader({ title, hint, count }: { title: string; hint?: string; count?: number }) {
  return (
    <div className="flex items-baseline gap-2 px-5 pt-5 pb-3">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      {typeof count === "number" && count > 0 && (
        <span className="text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400">{count}</span>
      )}
      {hint && <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto truncate">{hint}</span>}
    </div>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="grid place-items-center w-9 h-9 rounded-full bg-slate-100 dark:bg-white/[0.06] text-xs font-semibold text-slate-600 dark:text-slate-300 flex-shrink-0">
      {initials.toUpperCase() || "—"}
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors"
    >
      <span>{label}</span>
      <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  );
}
