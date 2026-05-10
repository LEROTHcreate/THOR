"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

/* ── Types ───────────────────────────────────────────────────────────────── */
interface StoredPatient {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  mutuelle?: string;
  numeroSS?: string;
  notes?: string;
  createdAt?: string;
}

interface Examen {
  id: string;
  date: string;        // ISO
  praticien: string;
  type: string;
  od: { sph: string; cyl: string; axe: string; add?: string };
  og: { sph: string; cyl: string; axe: string; add?: string };
  avOD?: string;
  avOG?: string;
  notes?: string;
}

interface Ordonnance {
  id: string;
  numero: string;
  dateOrdonnance: string;
  dateExpiration: string;
  prescripteur: string;
  rpps?: string;
  od: { sphere: string; cylindre: string; axe: string; addition: string };
  og: { sphere: string; cylindre: string; axe: string; addition: string };
  ecartPupillaire?: string;
  remarques?: string;
}

type Tab = "overview" | "examens" | "ordonnances" | "devis" | "notes";

/* ── LS keys ─────────────────────────────────────────────────────────────── */
const LS_PATIENTS = "thor_pro_patients";
const LS_EXAMENS  = (id: string) => `thor_pro_patient_${id}_examens`;
const LS_ORDOS    = (id: string) => `thor_pro_patient_${id}_ordonnances`;
const LS_NOTES    = (id: string) => `thor_pro_patient_${id}_notes`;

function loadJson<T>(key: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) as T : fb; } catch { return fb; }
}
function saveJson(key: string, v: unknown) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ }
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function fmtDate(iso?: string): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return iso; }
}

function calcAge(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const t = new Date();
  let age = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
  return age;
}

function initials(prenom: string, nom: string): string {
  return ((prenom?.[0] ?? "") + (nom?.[0] ?? "")).toUpperCase() || "—";
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [hydrated, setHydrated] = useState(false);
  const [patient, setPatient]   = useState<StoredPatient | null>(null);
  const [tab, setTab]           = useState<Tab>("overview");
  const [examens, setExamens]   = useState<Examen[]>([]);
  const [ordos, setOrdos]       = useState<Ordonnance[]>([]);
  const [notes, setNotes]       = useState("");
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const [showExamModal, setShowExamModal] = useState(false);
  const [showOrdoModal, setShowOrdoModal] = useState(false);

  /* Load on mount */
  useEffect(() => {
    setHydrated(true);
    const all = loadJson<StoredPatient[]>(LS_PATIENTS, []);
    const found = all.find(p => p.id === id) ?? null;
    setPatient(found);
    setExamens(loadJson<Examen[]>(LS_EXAMENS(id), []));
    setOrdos(loadJson<Ordonnance[]>(LS_ORDOS(id), []));
    setNotes(loadJson<string>(LS_NOTES(id), ""));
  }, [id]);

  function persistPatient(p: StoredPatient) {
    const all = loadJson<StoredPatient[]>(LS_PATIENTS, []);
    const next = all.map(x => x.id === p.id ? p : x);
    saveJson(LS_PATIENTS, next);
    setPatient(p);
  }

  function saveNotes() {
    saveJson(LS_NOTES(id), notes);
    if (patient) persistPatient({ ...patient, notes });
    setSavedNotice("Notes enregistrées");
    setTimeout(() => setSavedNotice(null), 1800);
  }

  function addExamen(e: Examen) {
    const next = [e, ...examens];
    setExamens(next);
    saveJson(LS_EXAMENS(id), next);
    setShowExamModal(false);
  }

  function addOrdo(o: Ordonnance) {
    const next = [o, ...ordos];
    setOrdos(next);
    saveJson(LS_ORDOS(id), next);
    setShowOrdoModal(false);
  }

  /* Devis filtered for this patient (from thor_pro_devis, references by patientNom) */
  const devisItems = useMemo(() => {
    if (!hydrated || !patient) return [] as Array<{ id: string; date?: string; description?: string; montantTTC?: number; status?: string }>;
    const all = loadJson<Array<{ id: string; patientNom?: string; patientPrenom?: string; date?: string; description?: string; montantTTC?: number; status?: string }>>("thor_pro_devis", []);
    const fullName = `${patient.prenom} ${patient.nom}`.toLowerCase();
    return all.filter(d => `${d.patientPrenom ?? ""} ${d.patientNom ?? ""}`.toLowerCase().trim() === fullName);
  }, [hydrated, patient]);

  /* RDV history for this patient */
  const rdvItems = useMemo(() => {
    if (!hydrated || !patient) return [] as Array<{ id: string; date?: string; heure?: string; type?: string; statut?: string }>;
    const all = loadJson<Array<{ id: string; patientNom?: string; patientPrenom?: string; date?: string; heure?: string; type?: string; statut?: string }>>("thor_pro_rdv", []);
    const fullName = `${patient.prenom} ${patient.nom}`.toLowerCase();
    return all
      .filter(r => `${r.patientPrenom ?? ""} ${r.patientNom ?? ""}`.toLowerCase().trim() === fullName)
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  }, [hydrated, patient]);

  /* Not found */
  if (hydrated && !patient) {
    return (
      <div className="space-y-6">
        <Link
          href="/clair-vision/pro/patients"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-vision-accent transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Retour aux patients
        </Link>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 py-16 text-center">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1.5">Patient introuvable</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">L'identifiant <code className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{id}</code> ne correspond à aucun dossier.</p>
        </div>
      </div>
    );
  }

  if (!hydrated || !patient) {
    return <div className="text-sm text-slate-400">Chargement…</div>;
  }

  const age = calcAge(patient.dateNaissance);

  return (
    <div className="space-y-6">
      {/* ── Back link ── */}
      <Link
        href="/clair-vision/pro/patients"
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-vision-accent transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Patients
      </Link>

      {/* ── Header card ── */}
      <header className="flex flex-wrap items-start gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-5">
        <div className="grid place-items-center w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-lg flex-shrink-0">
          {initials(patient.prenom, patient.nom)}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 m-0 leading-tight">
            {patient.prenom} {patient.nom}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-0">
            {age !== null ? `${age} ans` : "—"}
            {patient.telephone && <> · {patient.telephone}</>}
            {patient.email && <> · <span className="hover:text-vision-accent cursor-pointer">{patient.email}</span></>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/clair-vision/pro/agenda"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Planifier un RDV
          </Link>
        </div>
      </header>

      {/* ── Tabs ── */}
      <nav className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 -mt-2">
        {([
          ["overview",   "Vue d'ensemble"],
          ["examens",    "Examens"],
          ["ordonnances","Ordonnances"],
          ["devis",      "Devis & factures"],
          ["notes",      "Notes"],
        ] as const).map(([k, label]) => {
          const active = tab === k;
          return (
            <button
              key={k}
              onClick={() => setTab(k)}
              aria-pressed={active}
              className={`relative h-9 px-3 text-sm font-medium transition-colors ${
                active
                  ? "text-vision-accent"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {label}
              {active && (
                <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-vision-accent" />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Content ── */}
      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <InfoCard title="Identité" rows={[
            ["Nom", patient.nom],
            ["Prénom", patient.prenom],
            ["Date de naissance", fmtDate(patient.dateNaissance)],
            ["Âge", age !== null ? `${age} ans` : "—"],
            ["N° Sécu", patient.numeroSS || "—"],
          ]} />
          <InfoCard title="Contact" rows={[
            ["Téléphone", patient.telephone || "—"],
            ["Email", patient.email || "—"],
            ["Adresse", patient.adresse || "—"],
            ["Code postal", patient.codePostal || "—"],
            ["Ville", patient.ville || "—"],
          ]} />
          <InfoCard title="Couverture santé" rows={[
            ["Mutuelle", patient.mutuelle || "—"],
          ]} />
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Derniers RDV</h3>
              {rdvItems.length > 0 && (
                <span className="text-xs tabular-nums text-slate-500">{rdvItems.length}</span>
              )}
            </div>
            <div className="px-5 pb-5">
              {rdvItems.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-2">Aucun rendez-vous enregistré.</p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800 -mx-1">
                  {rdvItems.slice(0, 5).map(r => (
                    <li key={r.id} className="px-1 py-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-slate-800 dark:text-slate-200">{fmtDate(r.date)}{r.heure && ` · ${r.heure}`}</p>
                        {(r.type || r.statut) && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.type ?? "—"}{r.statut && ` · ${r.statut}`}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}

      {tab === "examens" && (
        <SectionList
          title="Examens cliniques"
          count={examens.length}
          actionLabel="Nouvel examen"
          onAction={() => setShowExamModal(true)}
          emptyTitle="Aucun examen"
          emptyDesc="Enregistrez un examen optométrique pour conserver la prescription et le suivi visuel."
          items={examens.map(e => (
            <li key={e.id} className="px-5 py-4">
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-none">{e.type}</h4>
                <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{fmtDate(e.date)}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{e.praticien}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <CorrectionRow label="OD" eye={e.od} ac={e.avOD} />
                <CorrectionRow label="OG" eye={e.og} ac={e.avOG} />
              </div>
              {e.notes && <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">{e.notes}</p>}
            </li>
          ))}
        />
      )}

      {tab === "ordonnances" && (
        <SectionList
          title="Ordonnances"
          count={ordos.length}
          actionLabel="Nouvelle ordonnance"
          onAction={() => setShowOrdoModal(true)}
          emptyTitle="Aucune ordonnance"
          emptyDesc="Importez ou saisissez une ordonnance pour la conserver dans le dossier patient."
          items={ordos.map(o => (
            <li key={o.id} className="px-5 py-4">
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-none">{o.numero}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{o.prescripteur}{o.rpps && ` · RPPS ${o.rpps}`}</p>
                </div>
                <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{fmtDate(o.dateOrdonnance)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <CorrectionRow label="OD" eye={{ sph: o.od.sphere, cyl: o.od.cylindre, axe: o.od.axe, add: o.od.addition }} />
                <CorrectionRow label="OG" eye={{ sph: o.og.sphere, cyl: o.og.cylindre, axe: o.og.axe, add: o.og.addition }} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                EP : {o.ecartPupillaire ?? "—"} · expire le {fmtDate(o.dateExpiration)}
              </p>
              {o.remarques && <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{o.remarques}</p>}
            </li>
          ))}
        />
      )}

      {tab === "devis" && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Devis & factures</h3>
            <Link
              href="/clair-vision/pro/devis"
              className="text-xs font-medium text-vision-accent hover:underline"
            >
              Tous les devis →
            </Link>
          </div>
          {devisItems.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 px-5 py-8 text-center">
              Aucun devis pour ce patient. Créez-en un depuis l'onglet « Devis ».
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {devisItems.map(d => (
                <li key={d.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {d.id} — {d.description ?? "—"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{fmtDate(d.date)}{d.status && ` · ${d.status}`}</p>
                  </div>
                  <span className="text-sm tabular-nums font-medium text-slate-700 dark:text-slate-300">
                    {(d.montantTTC ?? 0).toLocaleString("fr-FR")} €
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "notes" && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notes</h3>
            {savedNotice && <span className="text-xs text-emerald-600 dark:text-emerald-400">{savedNotice}</span>}
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Antécédents, allergies, observations…"
            rows={10}
            className="w-full rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 px-3 py-2.5 outline-none focus:border-vision-accent transition-colors resize-y"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={saveNotes}
              className="inline-flex items-center h-9 px-4 rounded-[10px] text-sm font-medium text-white bg-vision-accent hover:bg-[#1A72E8] transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </section>
      )}

      {/* ── Modals ── */}
      {showExamModal && <ExamenModal onClose={() => setShowExamModal(false)} onSave={addExamen} />}
      {showOrdoModal && <OrdonnanceModal index={ordos.length} onClose={() => setShowOrdoModal(false)} onSave={addOrdo} />}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */
function InfoCard({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">{title}</h3>
      <dl className="space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3 text-sm">
            <dt className="text-slate-500 dark:text-slate-400 flex-shrink-0">{k}</dt>
            <dd className="text-slate-800 dark:text-slate-200 text-right truncate">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function SectionList({
  title, count, actionLabel, onAction, emptyTitle, emptyDesc, items,
}: {
  title: string;
  count: number;
  actionLabel: string;
  onAction: () => void;
  emptyTitle: string;
  emptyDesc: string;
  items: React.ReactNode[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-baseline gap-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          {count > 0 && <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{count}</span>}
        </div>
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] text-sm font-medium text-white bg-vision-accent hover:bg-[#1A72E8] transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {actionLabel}
        </button>
      </div>
      {count === 0 ? (
        <div className="px-5 py-12 text-center">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5">{emptyTitle}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">{emptyDesc}</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">{items}</ul>
      )}
    </section>
  );
}

function CorrectionRow({ label, eye, ac }: { label: string; eye: { sph: string; cyl: string; axe: string; add?: string }; ac?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
        {ac && <span className="text-xs text-slate-500">AC : {ac}</span>}
      </div>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 tabular-nums">
        Sph {eye.sph || "—"} · Cyl {eye.cyl || "—"} · Axe {eye.axe || "—"}
        {eye.add && ` · Add ${eye.add}`}
      </p>
    </div>
  );
}

/* ── Examen Modal ────────────────────────────────────────────────────────── */
function ExamenModal({ onClose, onSave }: { onClose: () => void; onSave: (e: Examen) => void }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: "Examen complet",
    praticien: "",
    odSph: "", odCyl: "", odAxe: "", odAdd: "",
    ogSph: "", ogCyl: "", ogAxe: "", ogAdd: "",
    avOD: "", avOG: "", notes: "",
  });
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      id: `ex-${Date.now()}`,
      date: form.date, type: form.type, praticien: form.praticien || "—",
      od: { sph: form.odSph, cyl: form.odCyl, axe: form.odAxe, add: form.odAdd || undefined },
      og: { sph: form.ogSph, cyl: form.ogCyl, axe: form.ogAxe, add: form.ogAdd || undefined },
      avOD: form.avOD || undefined, avOG: form.avOG || undefined,
      notes: form.notes || undefined,
    });
  }

  return (
    <ModalShell title="Nouvel examen" subtitle="Saisissez les corrections optométriques" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" required type="date" value={form.date} onChange={set("date")} />
          <Field label="Type" required value={form.type} onChange={set("type")} />
          <Field label="Praticien" value={form.praticien} onChange={set("praticien")} fullWidth />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <EyeBlock label="Œil droit (OD)" sph={form.odSph} cyl={form.odCyl} axe={form.odAxe} add={form.odAdd}
            onChange={(k, v) => setForm(f => ({ ...f, [`od${k}`]: v }))} av={form.avOD} onAv={set("avOD")} />
          <EyeBlock label="Œil gauche (OG)" sph={form.ogSph} cyl={form.ogCyl} axe={form.ogAxe} add={form.ogAdd}
            onChange={(k, v) => setForm(f => ({ ...f, [`og${k}`]: v }))} av={form.avOG} onAv={set("avOG")} />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => set("notes")(e.target.value)}
            rows={3}
            placeholder="Observations cliniques…"
            className="w-full rounded-[10px] text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 outline-none transition-colors focus:border-vision-accent placeholder:text-slate-400 resize-none"
          />
        </div>

        <ModalFooter onClose={onClose} />
      </form>
    </ModalShell>
  );
}

/* ── Ordonnance Modal ────────────────────────────────────────────────────── */
function OrdonnanceModal({ index, onClose, onSave }: { index: number; onClose: () => void; onSave: (o: Ordonnance) => void }) {
  const [form, setForm] = useState({
    dateOrdonnance: new Date().toISOString().slice(0, 10),
    prescripteur: "", rpps: "",
    odSph: "", odCyl: "", odAxe: "", odAdd: "",
    ogSph: "", ogCyl: "", ogAxe: "", ogAdd: "",
    ep: "", remarques: "",
  });
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const dateExp = new Date(form.dateOrdonnance);
    dateExp.setFullYear(dateExp.getFullYear() + 1);
    onSave({
      id: `ord-${Date.now()}`,
      numero: `ORD-${new Date().getFullYear()}-${String(index + 1).padStart(3, "0")}`,
      dateOrdonnance: form.dateOrdonnance,
      dateExpiration: dateExp.toISOString().slice(0, 10),
      prescripteur: form.prescripteur,
      rpps: form.rpps || undefined,
      od: { sphere: form.odSph, cylindre: form.odCyl, axe: form.odAxe, addition: form.odAdd },
      og: { sphere: form.ogSph, cylindre: form.ogCyl, axe: form.ogAxe, addition: form.ogAdd },
      ecartPupillaire: form.ep || undefined,
      remarques: form.remarques || undefined,
    });
  }

  return (
    <ModalShell title="Nouvelle ordonnance" subtitle="Renseignez l'ordonnance optique" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date d'ordonnance" required type="date" value={form.dateOrdonnance} onChange={set("dateOrdonnance")} />
          <Field label="Prescripteur" required value={form.prescripteur} onChange={set("prescripteur")} placeholder="Dr. …" />
          <Field label="RPPS" value={form.rpps} onChange={set("rpps")} />
          <Field label="Écart pupillaire (mm)" value={form.ep} onChange={set("ep")} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <EyeBlock label="Œil droit (OD)" sph={form.odSph} cyl={form.odCyl} axe={form.odAxe} add={form.odAdd}
            onChange={(k, v) => setForm(f => ({ ...f, [`od${k}`]: v }))} />
          <EyeBlock label="Œil gauche (OG)" sph={form.ogSph} cyl={form.ogCyl} axe={form.ogAxe} add={form.ogAdd}
            onChange={(k, v) => setForm(f => ({ ...f, [`og${k}`]: v }))} />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Remarques</label>
          <textarea
            value={form.remarques}
            onChange={e => set("remarques")(e.target.value)}
            rows={2}
            className="w-full rounded-[10px] text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 outline-none transition-colors focus:border-vision-accent placeholder:text-slate-400 resize-none"
          />
        </div>

        <ModalFooter onClose={onClose} />
      </form>
    </ModalShell>
  );
}

/* ── Modal primitives ────────────────────────────────────────────────────── */
function ModalShell({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 m-0 leading-none">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 mb-0">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid place-items-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center h-9 px-4 rounded-[10px] text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      >
        Annuler
      </button>
      <button
        type="submit"
        className="inline-flex items-center h-9 px-4 rounded-[10px] text-sm font-medium text-white bg-vision-accent hover:bg-[#1A72E8] transition-colors"
      >
        Enregistrer
      </button>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required, fullWidth, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  fullWidth?: boolean;
  placeholder?: string;
}) {
  return (
    <div className={fullWidth ? "col-span-2" : undefined}>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
        {label}{required && <span className="text-vision-accent ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full h-9 rounded-[10px] text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 outline-none transition-colors focus:border-vision-accent placeholder:text-slate-400"
      />
    </div>
  );
}

function EyeBlock({
  label, sph, cyl, axe, add, av, onChange, onAv,
}: {
  label: string;
  sph: string; cyl: string; axe: string; add: string;
  av?: string;
  onChange: (k: "Sph" | "Cyl" | "Axe" | "Add", v: string) => void;
  onAv?: (v: string) => void;
}) {
  return (
    <div className="rounded-[10px] border border-slate-200 dark:border-slate-700 px-3 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <MiniInput v={sph} onChange={v => onChange("Sph", v)} placeholder="Sph" />
        <MiniInput v={cyl} onChange={v => onChange("Cyl", v)} placeholder="Cyl" />
        <MiniInput v={axe} onChange={v => onChange("Axe", v)} placeholder="Axe" />
        <MiniInput v={add} onChange={v => onChange("Add", v)} placeholder="Add" />
      </div>
      {onAv && (
        <div className="mt-2">
          <MiniInput v={av ?? ""} onChange={onAv} placeholder="Acuité (10/10)" />
        </div>
      )}
    </div>
  );
}

function MiniInput({ v, onChange, placeholder }: { v: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={v}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-8 rounded-md text-sm tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 outline-none transition-colors focus:border-vision-accent placeholder:text-slate-400"
    />
  );
}
