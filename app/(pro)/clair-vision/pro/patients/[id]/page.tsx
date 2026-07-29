"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import DemanderFichiersModal from "../../components/optique/DemanderFichiersModal";

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

type Tab = "recap" | "vente" | "caisse" | "ordonnances" | "visites" | "commentaires" | "documents" | "compteRendu";

interface StoredPatientExt extends StoredPatient {
  civilite?: "M." | "Mme." | "Mlle." | "Dr." | "Pr.";
  nomNaissance?: string;
  prenoms?: string;
  lieuNaissance?: string;
  sexe?: "M" | "F";
  nationalite?: string;
  profession?: string;
  csp?: string;
  employeur?: string;
  /* Régime obligatoire (Sécurité sociale) */
  caisseSS?: string;
  codeRegime?: string;
  codeGestion?: string;
  centrePayeur?: string;
  dateOuvertureDroits?: string;
  dateFinDroits?: string;
  ald?: boolean;
  aldNumero?: string;
  cssC?: boolean;
  ame?: boolean;
  derniereLectureVitale?: string;
  derniereADRi?: string;
  /* Médecin traitant */
  medecinTraitantNom?: string;
  medecinTraitantRpps?: string;
  medecinTraitantDateDeclaration?: string;
  /* Mutuelle (AMC) */
  mutuelleType?: "Mutuelle" | "Compagnie" | "IP";
  mutuelleNumContrat?: string;
  mutuelleNumAdherent?: string;
  mutuelleDebutValidite?: string;
  mutuelleFinValidite?: string;
  mutuelleTiersPayantIntegral?: boolean;
  mutuellePlafondOptique?: number;
  mutuellePlafondAudio?: number;
  mutuelleReseau?: string;
  mutuelleRoutage?: string;
  mutuelleNumPEC?: string;
  /* Préférences & RGPD */
  modeContactPrefere?: "email" | "sms" | "telephone" | "courrier";
  consentementHDS?: boolean;
  consentementPartage?: boolean;
}

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
  const [tab, setTab]           = useState<Tab>("recap");
  const [examens, setExamens]   = useState<Examen[]>([]);
  const [ordos, setOrdos]       = useState<Ordonnance[]>([]);
  const [notes, setNotes]       = useState("");
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const [showExamModal, setShowExamModal] = useState(false);
  const [showOrdoModal, setShowOrdoModal] = useState(false);
  const [showFichiersModal, setShowFichiersModal] = useState(false);

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

      {/* ── Header iVoirNet-style — bandeau dense avec civilité, NOM CAPS et âge ── */}
      <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {/* Top — identité dense */}
        <div className="flex flex-wrap items-center gap-4 px-5 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="grid place-items-center w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-base flex-shrink-0">
            {initials(patient.prenom, patient.nom)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[17px] font-semibold tracking-tight text-slate-900 dark:text-slate-50 m-0 leading-tight flex flex-wrap items-baseline gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-normal text-sm">
                {(patient as StoredPatientExt).civilite ?? "Mme."}
              </span>
              <span className="uppercase">{patient.nom}</span>
              <span>{patient.prenom}</span>
              {age !== null && (
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  ({age} ans)
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-0 flex flex-wrap gap-x-3 gap-y-0.5">
              {patient.dateNaissance && <span>Né(e) le {fmtDate(patient.dateNaissance)}</span>}
              {patient.numeroSS && <span>SS&nbsp;: <span className="tabular-nums">{patient.numeroSS}</span></span>}
              {patient.telephone && <span className="tabular-nums">{patient.telephone}</span>}
              {patient.email && <span className="hover:text-vision-accent cursor-pointer truncate max-w-[200px]">{patient.email}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFichiersModal(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-xs font-medium text-white bg-vision-accent hover:opacity-90 transition-opacity"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
                <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7" />
                <rect x="13" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7" />
                <rect x="4" y="13" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7" />
                <path d="M13 13h3v3h-3zM18 13h2M13 18h2M18 18h2v2h-2z" stroke="currentColor" strokeWidth="1.7" />
              </svg>
              Demander des fichiers
            </button>
            <Link
              href="/clair-vision/pro/agenda"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Planifier RDV
            </Link>
          </div>
        </div>

        {/* Tabs iVoirNet — défilement horizontal, sous-onglets style logiciel pro */}
        <nav className="flex items-stretch overflow-x-auto scrollbar-thin">
          {([
            ["recap",        "Récapitulatif"],
            ["vente",        "Vente"],
            ["caisse",       "Caisse"],
            ["ordonnances",  "Historique des ordonnances"],
            ["visites",      "Historique des visites"],
            ["commentaires", "Historique des commentaires"],
            ["documents",    "Historique des documents"],
            ["compteRendu",  "Compte rendu visite"],
          ] as const).map(([k, label]) => {
            const active = tab === k;
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                aria-pressed={active}
                className={`relative h-10 px-4 text-[13px] font-medium whitespace-nowrap transition-colors border-r border-slate-100 dark:border-slate-800 last:border-r-0 ${
                  active
                    ? "text-vision-accent bg-vision-bg/40 dark:bg-vision-accent/[0.06]"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                {label}
                {active && (
                  <span className="absolute -bottom-px left-0 right-0 h-[2px] bg-vision-accent" />
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* ── Métadonnées sauvegarde / dernier accès — bande très discrète ── */}
      <div className="flex items-center justify-between -mt-2 px-1 text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
        <span>Dossier n° P{String(parseInt(id.replace(/\D/g, "") || "0", 10)).padStart(8, "0")}</span>
        <span>Le {new Date().toLocaleDateString("fr-FR")} · Dernière modification {new Date().toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>

      {/* ── Récapitulatif complet — dossier patient SESAM-Vitale ready ── */}
      {tab === "recap" && (() => {
        const p = patient as StoredPatientExt;
        function update<K extends keyof StoredPatientExt>(field: K, value: StoredPatientExt[K]) {
          const updated = { ...p, [field]: value } as unknown as StoredPatient;
          persistPatient(updated);
        }
        return (
        <div className="space-y-4">
          {/* Bandeau actions SESAM-Vitale / NOEMIE */}
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-2">Workflows&nbsp;:</span>
            <ActionBtn icon="card" label="Lire la carte Vitale" intent="primary" />
            <ActionBtn icon="check" label="Vérifier les droits ADRi" />
            <ActionBtn icon="upload" label="Envoyer FSE (AMO)" />
            <ActionBtn icon="upload" label="Télétrans AMC" />
            <ActionBtn icon="print" label="Imprimer fiche patient" />
          </div>

          {/* KPI strip — vue d'ensemble dossier */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Kpi label="Visites" value={rdvItems.length} />
            <Kpi label="Ordonnances" value={ordos.length} />
            <Kpi label="Devis/factures" value={devisItems.length} />
            <Kpi label="Total facturé" value={`${devisItems.reduce((s, d) => s + (d.montantTTC ?? 0), 0).toLocaleString("fr-FR")} €`} />
          </div>

          {/* Grille principale 2 colonnes — tous les champs sont éditables au clic (sauvegarde auto) */}
          <div className="grid gap-4 lg:grid-cols-2">

            {/* ── Identité administrative ── */}
            <RecapCard title="Identité administrative" subtitle="Données SESAM-Vitale">
              <EditField label="Civilité"        value={p.civilite ?? ""}  onSave={v => update("civilite", v as StoredPatientExt["civilite"])} type="select" options={[{value:"M.",label:"M."},{value:"Mme.",label:"Mme."},{value:"Mlle.",label:"Mlle."},{value:"Dr.",label:"Dr."},{value:"Pr.",label:"Pr."}]} />
              <EditField label="Nom de famille"  value={p.nom}             onSave={v => update("nom", v.toUpperCase())} />
              <EditField label="Nom de naissance" value={p.nomNaissance ?? ""} onSave={v => update("nomNaissance", v.toUpperCase())} />
              <EditField label="Prénoms"         value={p.prenoms ?? p.prenom} onSave={v => update("prenom", v)} />
              <EditField label="Sexe"            value={p.sexe ?? ""}       onSave={v => update("sexe", v as "M" | "F")} type="select" options={[{value:"M",label:"Masculin"},{value:"F",label:"Féminin"}]} />
              <EditField label="Date de naissance" value={p.dateNaissance ?? ""} onSave={v => update("dateNaissance", v)} type="date" />
              <EditField label="Lieu de naissance" value={p.lieuNaissance ?? ""} onSave={v => update("lieuNaissance", v)} />
              <EditField label="Nationalité"     value={p.nationalite ?? ""} onSave={v => update("nationalite", v)} placeholder="Française" />
              <EditField label="N° SS"           value={p.numeroSS ?? ""}    onSave={v => update("numeroSS", v)} mono />
            </RecapCard>

            {/* ── Adresse & contacts ── */}
            <RecapCard title="Adresse & contacts">
              <EditField label="Adresse"     value={p.adresse ?? ""}    onSave={v => update("adresse", v)} />
              <EditField label="Code postal" value={p.codePostal ?? ""} onSave={v => update("codePostal", v)} mono />
              <EditField label="Ville"       value={p.ville ?? ""}      onSave={v => update("ville", v)} />
              <EditField label="Téléphone"   value={p.telephone ?? ""}  onSave={v => update("telephone", v)} mono />
              <EditField label="Email"       value={p.email ?? ""}      onSave={v => update("email", v)} type="email" />
              <EditField label="Mode contact préféré" value={p.modeContactPrefere ?? ""} onSave={v => update("modeContactPrefere", v as StoredPatientExt["modeContactPrefere"])} type="select" options={[{value:"email",label:"Email"},{value:"sms",label:"SMS"},{value:"telephone",label:"Téléphone"},{value:"courrier",label:"Courrier"}]} />
            </RecapCard>

            {/* ── Profession & employeur ── */}
            <RecapCard title="Profession & employeur" subtitle="Pour AT/MP & feuilles de soins">
              <EditField label="Profession"  value={p.profession ?? ""} onSave={v => update("profession", v)} />
              <EditField label="Catégorie socio-prof." value={p.csp ?? ""} onSave={v => update("csp", v)} />
              <EditField label="Employeur"   value={p.employeur ?? ""}  onSave={v => update("employeur", v)} />
            </RecapCard>

            {/* ── Médecin traitant ── */}
            <RecapCard title="Médecin traitant déclaré" subtitle="Parcours de soins coordonné">
              <EditField label="Praticien"   value={p.medecinTraitantNom ?? ""}  onSave={v => update("medecinTraitantNom", v)} placeholder="Dr. …" />
              <EditField label="N° RPPS"     value={p.medecinTraitantRpps ?? ""} onSave={v => update("medecinTraitantRpps", v)} mono />
              <EditField label="Déclaré le"  value={p.medecinTraitantDateDeclaration ?? ""} onSave={v => update("medecinTraitantDateDeclaration", v)} type="date" />
            </RecapCard>

            {/* ── Régime obligatoire (SS) ── */}
            <RecapCard
              title="Régime obligatoire (Sécurité sociale)"
              subtitle="Pour FSE / télétransmission AMO"
              accent="#2D8CFF"
            >
              <EditField label="Caisse de rattachement" value={p.caisseSS ?? ""} onSave={v => update("caisseSS", v)} placeholder="CPAM, MSA, MGEN…" />
              <EditField label="Code régime"     value={p.codeRegime ?? ""}    onSave={v => update("codeRegime", v)} mono />
              <EditField label="Code gestion"    value={p.codeGestion ?? ""}   onSave={v => update("codeGestion", v)} mono />
              <EditField label="Centre payeur"   value={p.centrePayeur ?? ""}  onSave={v => update("centrePayeur", v)} />
              <EditField label="Ouverture droits" value={p.dateOuvertureDroits ?? ""} onSave={v => update("dateOuvertureDroits", v)} type="date" />
              <EditField label="Fin de droits"   value={p.dateFinDroits ?? ""} onSave={v => update("dateFinDroits", v)} type="date" />
              <ToggleField label="ALD (longue durée)" value={!!p.ald} onSave={v => update("ald", v)} />
              {p.ald && (
                <EditField label="N° ALD"        value={p.aldNumero ?? ""}    onSave={v => update("aldNumero", v)} mono />
              )}
              <ToggleField label="CSS (Compl. santé solidaire)" value={!!p.cssC} onSave={v => update("cssC", v)} onText="Bénéficiaire" />
              <ToggleField label="AME" value={!!p.ame} onSave={v => update("ame", v)} />
            </RecapCard>

            {/* ── Régime complémentaire (AMC / mutuelle) ── */}
            <RecapCard
              title="Régime complémentaire (mutuelle)"
              subtitle="Pour télétransmission AMC / tiers payant"
              accent="#00C98A"
            >
              <EditField label="Organisme"       value={p.mutuelle ?? ""}            onSave={v => update("mutuelle", v)} placeholder="MGEN, Harmonie…" />
              <EditField label="Type"            value={p.mutuelleType ?? ""}        onSave={v => update("mutuelleType", v as StoredPatientExt["mutuelleType"])} type="select" options={[{value:"Mutuelle",label:"Mutuelle"},{value:"Compagnie",label:"Compagnie d'assurance"},{value:"IP",label:"Institution de prévoyance"}]} />
              <EditField label="N° contrat"      value={p.mutuelleNumContrat ?? ""}  onSave={v => update("mutuelleNumContrat", v)} mono />
              <EditField label="N° adhérent"     value={p.mutuelleNumAdherent ?? ""} onSave={v => update("mutuelleNumAdherent", v)} mono />
              <EditField label="Début validité"  value={p.mutuelleDebutValidite ?? ""} onSave={v => update("mutuelleDebutValidite", v)} type="date" />
              <EditField label="Fin validité"    value={p.mutuelleFinValidite ?? ""}   onSave={v => update("mutuelleFinValidite", v)} type="date" />
              <ToggleField label="Tiers payant intégral" value={!!p.mutuelleTiersPayantIntegral} onSave={v => update("mutuelleTiersPayantIntegral", v)} />
              <EditField label="Plafond optique annuel (€)" value={p.mutuellePlafondOptique != null ? String(p.mutuellePlafondOptique) : ""} onSave={v => update("mutuellePlafondOptique", v ? Number(v) : undefined)} type="number" mono />
              <EditField label="Plafond audio annuel (€)"   value={p.mutuellePlafondAudio   != null ? String(p.mutuellePlafondAudio)   : ""} onSave={v => update("mutuellePlafondAudio", v ? Number(v) : undefined)} type="number" mono />
              <EditField label="Réseau adhérent" value={p.mutuelleReseau ?? ""}      onSave={v => update("mutuelleReseau", v)} placeholder="Kalixia, Itelis, Carte Blanche…" />
              <EditField label="Routage / plateforme" value={p.mutuelleRoutage ?? ""} onSave={v => update("mutuelleRoutage", v)} placeholder="Almerys, SP Santé, Viamedis…" />
              <EditField label="N° PEC en cours" value={p.mutuelleNumPEC ?? ""}      onSave={v => update("mutuelleNumPEC", v)} mono />
            </RecapCard>
          </div>

          {/* Statut SESAM-Vitale & télétransmission — bandeau pleine largeur */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Statut SESAM-Vitale & télétransmission</h3>
              <span className="text-[10px] font-mono text-slate-400">Dernière synchro NOEMIE&nbsp;: —</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-px bg-slate-100 dark:bg-slate-800">
              <StatusCell
                label="Carte Vitale"
                value={p.derniereLectureVitale ? `Lue le ${fmtDate(p.derniereLectureVitale)}` : "Non lue"}
                ok={!!p.derniereLectureVitale}
              />
              <StatusCell
                label="Droits ADRi"
                value={p.derniereADRi ? `Vérifiés le ${fmtDate(p.derniereADRi)}` : "Non vérifiés"}
                ok={!!p.derniereADRi}
              />
              <StatusCell
                label="Médecin traitant"
                value={p.medecinTraitantNom ? "Déclaré" : "Manquant"}
                ok={!!p.medecinTraitantNom}
              />
              <StatusCell
                label="Tiers payant AMC"
                value={p.mutuelleTiersPayantIntegral ? "Convention active" : p.mutuelle ? "Sur devis" : "Aucune mutuelle"}
                ok={!!p.mutuelleTiersPayantIntegral}
              />
            </div>
          </section>

          {/* Préférences & RGPD */}
          <RecapCard title="Préférences & RGPD" subtitle="Consentements et communications">
            <div className="grid sm:grid-cols-2 gap-x-6">
              <ToggleField label="Hébergement HDS"          value={p.consentementHDS !== false} onSave={v => update("consentementHDS", v)} onText="Consenti" offText="Refusé" />
              <ToggleField label="Partage avec prescripteur" value={!!p.consentementPartage}     onSave={v => update("consentementPartage", v)} onText="Consenti" />
            </div>
          </RecapCard>

          {/* Derniers RDV */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Derniers rendez-vous</h3>
              {rdvItems.length > 0 && <span className="text-xs tabular-nums text-slate-500">{rdvItems.length}</span>}
            </div>
            <div className="px-5 py-3">
              {rdvItems.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-2">Aucun rendez-vous enregistré.</p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800 -mx-1">
                  {rdvItems.slice(0, 5).map(r => (
                    <li key={r.id} className="px-1 py-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-slate-800 dark:text-slate-200 tabular-nums">{fmtDate(r.date)}{r.heure && ` · ${r.heure}`}</p>
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
        );
      })()}

      {tab === "visites" && (
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

      {tab === "vente" && (
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

      {/* ── Caisse — paiements, encaissements, soldes ── */}
      {tab === "caisse" && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Caisse · paiements & encaissements</h3>
            <Link
              href="/clair-vision/pro/facturation"
              className="text-xs font-medium text-vision-accent hover:underline"
            >
              Module facturation →
            </Link>
          </div>
          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800">
            {[
              { label: "Total facturé",   value: devisItems.reduce((s, d) => s + (d.montantTTC ?? 0), 0), color: "#0f172a" },
              { label: "Encaissé",        value: 0,        color: "#15803d" },
              { label: "Tiers payant",    value: 0,        color: "#2D8CFF" },
              { label: "Reste à charge",  value: 0,        color: "#b91c1c" },
            ].map(k => (
              <div key={k.label} className="bg-white dark:bg-slate-900 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{k.label}</p>
                <p className="text-base font-semibold tabular-nums mt-0.5" style={{ color: k.color }}>
                  {k.value.toLocaleString("fr-FR")} €
                </p>
              </div>
            ))}
          </div>
          {/* Tableau lignes — style iVoirNet caisse */}
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/[0.03] text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="text-left px-4 py-2 font-semibold">Date</th>
                  <th className="text-left px-4 py-2 font-semibold">N° pièce</th>
                  <th className="text-left px-4 py-2 font-semibold">Libellé</th>
                  <th className="text-left px-4 py-2 font-semibold">Mode</th>
                  <th className="text-right px-4 py-2 font-semibold">Débit</th>
                  <th className="text-right px-4 py-2 font-semibold">Crédit</th>
                  <th className="text-right px-4 py-2 font-semibold">Solde</th>
                </tr>
              </thead>
              <tbody>
                {devisItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                      Aucun mouvement de caisse pour ce patient.
                    </td>
                  </tr>
                ) : (
                  devisItems.map(d => (
                    <tr key={d.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-300 tabular-nums">{fmtDate(d.date)}</td>
                      <td className="px-4 py-2 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{d.id}</td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-300 truncate max-w-[280px]">{d.description ?? "—"}</td>
                      <td className="px-4 py-2"><span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300">{d.status === "Payé" ? "CB" : "—"}</span></td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-700 dark:text-slate-300">{(d.montantTTC ?? 0).toLocaleString("fr-FR")} €</td>
                      <td className="px-4 py-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{d.status === "Payé" ? `${(d.montantTTC ?? 0).toLocaleString("fr-FR")} €` : "—"}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-semibold text-slate-900 dark:text-slate-100">{d.status === "Payé" ? "0,00 €" : `${(d.montantTTC ?? 0).toLocaleString("fr-FR")} €`}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "commentaires" && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Historique des commentaires</h3>
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

      {/* ── Documents (placeholder iVoirNet-style) ── */}
      {tab === "documents" && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Historique des documents</h3>
            <button
              type="button"
              onClick={() => setShowFichiersModal(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-xs font-medium text-white bg-vision-accent hover:opacity-90 transition-opacity"
            >
              + Demander un document
            </button>
          </div>
          <div className="px-5 py-10 text-center">
            <div className="grid place-items-center w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-slate-400 mx-auto mb-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Aucun document</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Ordonnances scannées, comptes-rendus ORL, justificatifs mutuelle… seront listés ici par date.
            </p>
          </div>
        </section>
      )}

      {/* ── Compte rendu visite (placeholder structuré) ── */}
      {tab === "compteRendu" && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Compte rendu de visite</h3>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Générer (PDF)
            </button>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_280px] p-5">
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Motif de visite</label>
                <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">—</p>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Examen clinique</label>
                <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">—</p>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Recommandations</label>
                <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">—</p>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Prochain rendez-vous suggéré</label>
                <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">—</p>
              </div>
            </div>
            <aside className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-white/[0.03] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Évolution du dossier</p>
              <ul className="space-y-2 text-xs">
                {rdvItems.slice(0, 5).map(r => (
                  <li key={r.id} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-vision-accent mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700 dark:text-slate-300 truncate">{r.type ?? "RDV"}</p>
                      <p className="text-slate-400 dark:text-slate-500 tabular-nums">{fmtDate(r.date)} {r.heure && `· ${r.heure}`}</p>
                    </div>
                  </li>
                ))}
                {rdvItems.length === 0 && (
                  <li className="text-slate-400 dark:text-slate-500">Aucun évènement.</li>
                )}
              </ul>
            </aside>
          </div>
        </section>
      )}

      {/* ── Modals ── */}
      {showExamModal && <ExamenModal onClose={() => setShowExamModal(false)} onSave={addExamen} />}
      {showOrdoModal && <OrdonnanceModal index={ordos.length} onClose={() => setShowOrdoModal(false)} onSave={addOrdo} />}
      <DemanderFichiersModal
        open={showFichiersModal}
        onClose={() => setShowFichiersModal(false)}
        appSource="vision"
        patientId={patient.id}
        patientName={`${patient.prenom} ${patient.nom}`}
      />
    </div>
  );
}

/* ── Sub-components Récapitulatif ───────────────────────────────────────── */
function ActionBtn({ icon, label, intent = "neutral" }: { icon: "card" | "check" | "upload" | "print"; label: string; intent?: "primary" | "neutral" }) {
  const isPrimary = intent === "primary";
  const cls = isPrimary
    ? "bg-vision-accent text-white hover:opacity-90"
    : "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.10]";
  return (
    <button type="button" className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[12px] font-medium transition-colors ${cls}`}>
      <span className="w-3.5 h-3.5">
        {icon === "card" && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg>
        )}
        {icon === "check" && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        )}
        {icon === "upload" && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
        )}
        {icon === "print" && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        )}
      </span>
      {label}
    </button>
  );
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-50 leading-none mt-1.5">{value}</p>
    </div>
  );
}

function RecapCard({ title, subtitle, children, accent }: { title: string; subtitle?: string; children: React.ReactNode; accent?: string }) {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="flex items-start gap-2.5 px-5 py-3 border-b border-slate-100 dark:border-slate-800">
        {accent && <span className="w-1 self-stretch rounded-full" style={{ background: accent, minHeight: 28 }} />}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <dl className="px-5 py-3 space-y-1">{children}</dl>
    </section>
  );
}

/* ── EditField — champ inline éditable, sauvegarde au blur ── */
function EditField({
  label, value, onSave, mono, type = "text", options, placeholder = "—",
}: {
  label: string;
  value?: string;
  onSave: (v: string) => void;
  mono?: boolean;
  type?: "text" | "date" | "email" | "tel" | "number" | "select";
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}) {
  const [local, setLocal] = useState(value ?? "");
  useEffect(() => { setLocal(value ?? ""); }, [value]);
  const isEmpty = !local;
  const inputCls = `text-right bg-transparent border border-transparent outline-none rounded px-1.5 py-0.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.04] focus:bg-slate-50 dark:focus:bg-white/[0.06] focus:border-vision-accent/30 min-w-0 max-w-[180px] sm:max-w-[220px] truncate ${isEmpty ? "text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"} ${mono ? "font-mono text-[11.5px] tabular-nums" : "text-[12.5px]"}`;
  return (
    <div className="flex items-center justify-between gap-3 text-[12.5px]">
      <label className="text-slate-500 dark:text-slate-400 flex-shrink-0">{label}</label>
      {type === "select" ? (
        <select
          value={local}
          onChange={e => { setLocal(e.target.value); onSave(e.target.value); }}
          className={`${inputCls} cursor-pointer`}
        >
          <option value="">{placeholder}</option>
          {options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={local}
          placeholder={placeholder}
          onChange={e => setLocal(e.target.value)}
          onBlur={() => { if (local !== (value ?? "")) onSave(local); }}
          onKeyDown={e => { if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur(); }}
          className={inputCls}
        />
      )}
    </div>
  );
}

/* ── ToggleField — switch oui/non sauvegarde immédiate au clic ── */
function ToggleField({ label, value, onSave, onText, offText }: {
  label: string;
  value: boolean;
  onSave: (v: boolean) => void;
  onText?: string;
  offText?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-[12.5px]">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <button
        type="button"
        onClick={() => onSave(!value)}
        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md transition-colors ${
          value
            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-400 dark:hover:bg-white/[0.10]"
        }`}
      >
        {value ? (onText ?? "Oui") : (offText ?? "Non")}
      </button>
    </div>
  );
}

function RecapField({ label, value, mono, badge }: { label: string; value?: string; mono?: boolean; badge?: { text: string; tone: "ok" | "warn" | "info" | "neutral" } }) {
  const toneClasses: Record<string, string> = {
    ok:      "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
    warn:    "text-amber-700  dark:text-amber-400  bg-amber-50  dark:bg-amber-500/10",
    info:    "text-blue-700   dark:text-blue-400   bg-blue-50   dark:bg-blue-500/10",
    neutral: "text-slate-600  dark:text-slate-400  bg-slate-100 dark:bg-white/[0.06]",
  };
  const empty = !value || value === "—" || value === "Invalid Date";
  return (
    <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
      <dt className="text-slate-500 dark:text-slate-400 flex-shrink-0">{label}</dt>
      <dd className="text-right truncate">
        {badge ? (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${toneClasses[badge.tone]}`}>{badge.text}</span>
        ) : (
          <span className={`${empty ? "text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"} ${mono ? "tabular-nums font-mono text-[11.5px]" : ""}`}>
            {empty ? "—" : value}
          </span>
        )}
      </dd>
    </div>
  );
}

function StatusCell({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="bg-white dark:bg-slate-900 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ok ? "bg-emerald-500" : "bg-amber-500"}`} />
        <p className={`text-[12.5px] font-medium ${ok ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>{value}</p>
      </div>
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
