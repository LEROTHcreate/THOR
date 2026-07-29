"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/* ── Types ───────────────────────────────────────────────────────────────── */
interface StoredPatient {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  telephone: string;
  email?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  mutuelle?: string;
  numeroSS?: string;
  notes?: string;
  createdAt: string;
}

const LS_KEY = "thor_pro_patients";

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function calcAge(iso: string): number | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return iso; }
}

function initials(prenom: string, nom: string): string {
  return ((prenom?.[0] ?? "") + (nom?.[0] ?? "")).toUpperCase() || "—";
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function PatientsPage() {
  const [hydrated, setHydrated] = useState(false);
  const [patients, setPatients] = useState<StoredPatient[]>([]);
  const [search, setSearch]     = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setPatients(JSON.parse(raw) as StoredPatient[]);
    } catch { /* ignore */ }
  }, []);

  function persist(list: StoredPatient[]) {
    setPatients(list);
    try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(p =>
      `${p.prenom} ${p.nom}`.toLowerCase().includes(q) ||
      (p.telephone ?? "").toLowerCase().includes(q) ||
      (p.email ?? "").toLowerCase().includes(q) ||
      (p.mutuelle ?? "").toLowerCase().includes(q) ||
      (p.ville ?? "").toLowerCase().includes(q)
    );
  }, [patients, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => `${a.nom}${a.prenom}`.localeCompare(`${b.nom}${b.prenom}`, "fr"));
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-slate-900 dark:text-slate-50 m-0 leading-none">
            Patients
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-0">
            {hydrated && patients.length === 0
              ? "Aucun patient pour l'instant."
              : <><span className="tabular-nums font-medium text-slate-700 dark:text-slate-300">{patients.length}</span> patient{patients.length > 1 ? "s" : ""}</>
            }
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-[10px] text-sm font-medium text-white bg-vision-accent hover:bg-[#1A72E8] transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nouveau patient
        </button>
      </header>

      {/* ── Search (visible only when there's data or query) ── */}
      {(patients.length > 0 || search) && (
        <div className="relative max-w-md">
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Effacer"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 grid place-items-center h-6 w-6 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, mutuelle…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 rounded-[10px] text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none transition-colors focus:border-vision-accent placeholder:text-slate-400"
            style={{ padding: search ? "0 36px 0 38px" : "0 12px 0 38px" }}
          />
        </div>
      )}

      {/* ── List / Empty ── */}
      {hydrated && patients.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 py-16 text-center">
          <div className="grid place-items-center w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto mb-5">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1.5">Aucun patient</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5">
            Créez votre premier patient pour commencer à gérer son dossier, ses rendez-vous et ses équipements.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] text-sm font-medium text-white bg-vision-accent hover:bg-[#1A72E8] transition-colors"
          >
            Créer un patient
          </button>
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 py-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">Aucun patient ne correspond à « {search} ».</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          {/* Header row */}
          <div className="hidden sm:grid grid-cols-[1fr_140px_140px_120px_24px] gap-4 px-5 py-3 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <span>Patient</span>
            <span>Téléphone</span>
            <span>Mutuelle</span>
            <span>Créé le</span>
            <span />
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {sorted.map(p => {
              const age = calcAge(p.dateNaissance);
              return (
                <li key={p.id}>
                  <Link
                    href={`/clair-vision/pro/patients/${p.id}`}
                    className="grid grid-cols-[1fr] sm:grid-cols-[1fr_140px_140px_120px_24px] gap-2 sm:gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid place-items-center w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 flex-shrink-0">
                        {initials(p.prenom, p.nom)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {p.prenom} {p.nom}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {age !== null ? `${age} ans` : "—"}
                          {p.ville && ` · ${p.ville}`}
                        </p>
                      </div>
                    </div>
                    <span className="hidden sm:flex items-center text-sm text-slate-600 dark:text-slate-300 truncate">
                      {p.telephone || "—"}
                    </span>
                    <span className="hidden sm:flex items-center text-sm text-slate-600 dark:text-slate-300 truncate">
                      {p.mutuelle || "—"}
                    </span>
                    <span className="hidden sm:flex items-center text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {fmtDate(p.createdAt)}
                    </span>
                    <span className="hidden sm:flex items-center justify-end text-slate-400">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── Modal ── */}
      {modalOpen && (
        <NewPatientModal
          onClose={() => setModalOpen(false)}
          onSave={p => { persist([...patients, p]); setModalOpen(false); }}
        />
      )}
    </div>
  );
}

/* ── Profils Carte Vitale simulés (rotation) ─────────────────────────────── */
const VITALE_PROFILES = [
  {
    civilite: "Mme.", sexe: "F",
    prenom: "Camille", nom: "LEFEBVRE", nomNaissance: "LEFEBVRE",
    dateNaissance: "1988-05-14", lieuNaissance: "Lyon", nationalite: "Française",
    numeroSS: "2 88 05 69 234 156 87",
    caisseSS: "CPAM du Rhône", codeRegime: "01", codeGestion: "117",
    centrePayeur: "CPAM Lyon — 69907",
    dateOuvertureDroits: "2010-01-01", dateFinDroits: "2028-12-31",
    medecinTraitantNom: "Dr. Marc DUBOIS", medecinTraitantRpps: "10001234567",
  },
  {
    civilite: "M.", sexe: "M",
    prenom: "Thomas", nom: "MARTIN", nomNaissance: "MARTIN",
    dateNaissance: "1976-11-03", lieuNaissance: "Paris 15e", nationalite: "Française",
    numeroSS: "1 76 11 75 116 089 32",
    caisseSS: "CPAM de Paris", codeRegime: "01", codeGestion: "101",
    centrePayeur: "CPAM Paris — 75901",
    dateOuvertureDroits: "1994-09-01", dateFinDroits: "2027-06-30",
    medecinTraitantNom: "Dr. Élise BERNARD", medecinTraitantRpps: "10009876543",
  },
  {
    civilite: "Mme.", sexe: "F",
    prenom: "Sophie", nom: "PETIT", nomNaissance: "ROUSSEAU",
    dateNaissance: "1992-02-22", lieuNaissance: "Marseille", nationalite: "Française",
    numeroSS: "2 92 02 13 215 478 21",
    caisseSS: "CPAM des Bouches-du-Rhône", codeRegime: "01", codeGestion: "131",
    centrePayeur: "CPAM Marseille — 13901",
    dateOuvertureDroits: "2010-09-01", dateFinDroits: "2029-03-31",
    medecinTraitantNom: "", medecinTraitantRpps: "",
  },
];

/* ── New Patient Modal ───────────────────────────────────────────────────── */
type ExtPatient = StoredPatient & {
  civilite?: string; sexe?: string; nomNaissance?: string; lieuNaissance?: string; nationalite?: string;
  caisseSS?: string; codeRegime?: string; codeGestion?: string; centrePayeur?: string;
  dateOuvertureDroits?: string; dateFinDroits?: string;
  medecinTraitantNom?: string; medecinTraitantRpps?: string;
  derniereLectureVitale?: string;
};

function NewPatientModal({ onClose, onSave }: { onClose: () => void; onSave: (p: StoredPatient) => void }) {
  const [form, setForm] = useState({
    prenom: "", nom: "", dateNaissance: "", telephone: "",
    email: "", adresse: "", codePostal: "", ville: "",
    mutuelle: "", numeroSS: "", notes: "",
    /* champs Vitale étendus (cachés du form mais persistés à la création) */
    civilite: "", sexe: "", nomNaissance: "", lieuNaissance: "", nationalite: "",
    caisseSS: "", codeRegime: "", codeGestion: "", centrePayeur: "",
    dateOuvertureDroits: "", dateFinDroits: "",
    medecinTraitantNom: "", medecinTraitantRpps: "",
    derniereLectureVitale: "",
  });
  const [vitaleState, setVitaleState] = useState<"idle" | "reading" | "success">("idle");
  const [profileIdx, setProfileIdx] = useState(0);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  function lireCarteVitale() {
    setVitaleState("reading");
    setTimeout(() => {
      const prof = VITALE_PROFILES[profileIdx % VITALE_PROFILES.length];
      setProfileIdx(i => i + 1);
      setForm(f => ({
        ...f,
        prenom: prof.prenom,
        nom: prof.nom,
        dateNaissance: prof.dateNaissance,
        numeroSS: prof.numeroSS,
        civilite: prof.civilite,
        sexe: prof.sexe,
        nomNaissance: prof.nomNaissance,
        lieuNaissance: prof.lieuNaissance,
        nationalite: prof.nationalite,
        caisseSS: prof.caisseSS,
        codeRegime: prof.codeRegime,
        codeGestion: prof.codeGestion,
        centrePayeur: prof.centrePayeur,
        dateOuvertureDroits: prof.dateOuvertureDroits,
        dateFinDroits: prof.dateFinDroits,
        medecinTraitantNom: prof.medecinTraitantNom,
        medecinTraitantRpps: prof.medecinTraitantRpps,
        derniereLectureVitale: new Date().toISOString().slice(0, 10),
      }));
      setVitaleState("success");
      setTimeout(() => setVitaleState("idle"), 3000);
    }, 1400);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = `${form.prenom.toLowerCase()}-${form.nom.toLowerCase()}`
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const payload: ExtPatient = { id: `${slug}-${Date.now()}`, ...form, createdAt: new Date().toISOString() };
    onSave(payload);
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 m-0 leading-none">Nouveau patient</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 mb-0">Renseignez les informations principales</p>
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

        <form onSubmit={handleSubmit} className="px-6 py-5">

          {/* ── Lecture carte Vitale ─────────────────────────────────────── */}
          <div
            className="flex items-center gap-3 rounded-xl border px-4 py-3 mb-5 transition-colors"
            style={{
              borderColor: vitaleState === "success" ? "rgba(16,185,129,0.35)" : "rgba(45,140,255,0.25)",
              background: vitaleState === "success" ? "rgba(16,185,129,0.06)" : "rgba(45,140,255,0.06)",
            }}
          >
            <div
              className="grid place-items-center w-10 h-10 rounded-lg flex-shrink-0"
              style={{
                background: vitaleState === "success" ? "rgba(16,185,129,0.15)" : "rgba(45,140,255,0.15)",
                color: vitaleState === "success" ? "#059669" : "#2D8CFF",
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <path d="M2 10h20M6 15h4"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                {vitaleState === "reading" ? "Lecture en cours…" : vitaleState === "success" ? "Carte Vitale lue avec succès" : "Lecture de la carte Vitale"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {vitaleState === "reading"
                  ? "Connexion au lecteur PC/SC, extraction des données assuré…"
                  : vitaleState === "success"
                  ? `Identité, N° SS, caisse de rattachement et droits récupérés (${form.prenom} ${form.nom}).`
                  : "Insérez la carte Vitale du patient pour pré-remplir automatiquement le formulaire."}
              </p>
            </div>
            <button
              type="button"
              onClick={lireCarteVitale}
              disabled={vitaleState === "reading"}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[10px] text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{
                background: vitaleState === "success" ? "#10b981" : "#2D8CFF",
                boxShadow: vitaleState === "success" ? "0 2px 12px rgba(16,185,129,0.30)" : "0 2px 12px rgba(45,140,255,0.30)",
              }}
            >
              {vitaleState === "reading" ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  Lecture…
                </>
              ) : vitaleState === "success" ? (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Relire
                </>
              ) : (
                "Lire la carte Vitale"
              )}
            </button>
          </div>

          {form.derniereLectureVitale && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 -mt-2">
              Champs pré-remplis depuis la carte&nbsp;: identité, sexe, lieu de naissance, N° SS, caisse, code régime, période de droits{form.medecinTraitantNom ? `, médecin traitant (${form.medecinTraitantNom})` : ""}.
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
            <Field label="Prénom" required value={form.prenom}        onChange={set("prenom")} />
            <Field label="Nom"    required value={form.nom}           onChange={set("nom")} />
            <Field label="Date de naissance" required type="date" value={form.dateNaissance} onChange={set("dateNaissance")} />
            <Field label="Téléphone"          required type="tel"  value={form.telephone}     onChange={set("telephone")} />
            <Field label="Email"     type="email" value={form.email}     onChange={set("email")} fullWidth />
            <Field label="Adresse"   value={form.adresse}   onChange={set("adresse")} fullWidth />
            <Field label="Code postal" value={form.codePostal} onChange={set("codePostal")} />
            <Field label="Ville"       value={form.ville}      onChange={set("ville")} />
            <Field label="Mutuelle"     value={form.mutuelle} onChange={set("mutuelle")} />
            <Field label="N° Sécurité sociale" value={form.numeroSS} onChange={set("numeroSS")} />
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Notes</label>
              <textarea
                value={form.notes}
                onChange={set("notes")}
                rows={2}
                placeholder="Observations, allergies, remarques…"
                className="w-full rounded-[10px] text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 outline-none transition-colors focus:border-vision-accent placeholder:text-slate-400 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
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
        </form>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required, fullWidth,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "col-span-2" : undefined}>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
        {label}{required && <span className="text-vision-accent ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full h-9 rounded-[10px] text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 outline-none transition-colors focus:border-vision-accent placeholder:text-slate-400"
      />
    </div>
  );
}
