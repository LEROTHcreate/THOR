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

type DossierStatus = "Prise en charge" | "En commande" | "Prêt" | "Livré" | "Annulé";
type DossierType = "montures-verres" | "lentilles" | "basse-vision" | "autre";

interface Dossier {
  id: string;
  numero: string;
  patientNom: string;
  patientPrenom: string;
  patientId?: string;
  dateCreation: string;
  dateLivraison?: string;
  status: DossierStatus | string;
  type: DossierType | string;
  lignes: Array<{ designation: string; marque: string; prixTTC: number }>;
  notes?: string;
  praticien?: string;
  montantTotal: number;
  resteACharge: number;
  devisId?: string;
}

const TYPE_LABELS: Record<string, string> = {
  "montures-verres": "Montures & verres",
  "lentilles": "Lentilles",
  "basse-vision": "Basse vision",
  "autre": "Autre",
};

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  "Prise en charge": { bg: "rgba(45,140,255,0.10)",  text: "#1D6FCC" },
  "En commande":     { bg: "rgba(139,92,246,0.10)",  text: "#6D28D9" },
  "Prêt":            { bg: "rgba(245,158,11,0.10)",  text: "#B45309" },
  "Livré":           { bg: "rgba(16,185,129,0.10)",  text: "#047857" },
  "Annulé":          { bg: "rgba(239,68,68,0.10)",   text: "#991b1b" },
};

/* ── Form state ──────────────────────────────────────────────────────── */
interface FormData {
  nom: string;
  prenom: string;
  dateNaissance: string;
  telephone: string;
  email: string;
  adresse: string;
  codePostal: string;
  ville: string;
  mutuelle: string;
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

function loadProPatients(): StoredPatient[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("thor_pro_patients");
    return raw ? (JSON.parse(raw) as StoredPatient[]) : [];
  } catch {
    return [];
  }
}

function saveProPatients(list: StoredPatient[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("thor_pro_patients", JSON.stringify(list));
  } catch { /* noop */ }
}

function saveCurrentPatient(p: CurrentPatient): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("thor_patient_current", JSON.stringify(p));
  } catch { /* noop */ }
}

function loadDossiers(): Dossier[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("thor_pro_dossiers");
    return raw ? (JSON.parse(raw) as Dossier[]) : [];
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

function maskSS(ss: string | undefined): string {
  if (!ss) return "—";
  const clean = ss.replace(/\s/g, "");
  if (clean.length < 6) return "••••••••••••••";
  return clean.slice(0, 2) + " •• •• •• ••• ••• ••";
}

function formatDate(iso: string): string {
  if (!iso) return "—";
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

/* ── SVG Icons ────────────────────────────────────────────────────────── */
function IconUser() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path d="M12 12.2a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12.2Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.5 20.2c1.7-4 13.3-4 15 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
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
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path d="M5 12l5 5 9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Field Row ────────────────────────────────────────────────────────── */
function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-4 py-3" style={glassSubtle}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-slate-800">{value || "—"}</div>
    </div>
  );
}

/* ── Toast ────────────────────────────────────────────────────────────── */
function Toast({ visible }: { visible: boolean }) {
  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_32px_rgba(16,185,129,0.35)] transition-all duration-300"
      style={{
        background: "#10b981",
        opacity: visible ? 1 : 0,
        transform: visible ? "translate(-50%, 0)" : "translate(-50%, 24px)",
        pointerEvents: "none",
      }}
    >
      <IconCheck />
      Informations mises à jour
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────── */
export default function MonProfilPage() {
  const [currentPatient, setCurrentPatient] = useState<CurrentPatient>(MOCK_PATIENT);
  const [storedPatient, setStoredPatient] = useState<StoredPatient | null>(null);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const [form, setForm] = useState<FormData>({
    nom: "",
    prenom: "",
    dateNaissance: "",
    telephone: "",
    email: "",
    adresse: "",
    codePostal: "",
    ville: "",
    mutuelle: "",
  });

  useEffect(() => {
    const cp = loadCurrentPatient();
    setCurrentPatient(cp);

    const allPatients = loadProPatients();
    const found = allPatients.find((p) => samePatient(p.nom, p.prenom, cp)) ?? null;
    setStoredPatient(found);

    const allDossiers = loadDossiers();
    const patientDossiers = allDossiers.filter((d) => samePatient(d.patientNom, d.patientPrenom, cp));
    setDossiers(patientDossiers);
  }, []);

  function openEdit() {
    setForm({
      nom: storedPatient?.nom ?? currentPatient.nom,
      prenom: storedPatient?.prenom ?? currentPatient.prenom,
      dateNaissance: storedPatient?.dateNaissance ?? "",
      telephone: storedPatient?.telephone ?? "",
      email: storedPatient?.email ?? currentPatient.email ?? "",
      adresse: storedPatient?.adresse ?? "",
      codePostal: storedPatient?.codePostal ?? "",
      ville: storedPatient?.ville ?? "",
      mutuelle: storedPatient?.mutuelle ?? "",
    });
    setEditOpen(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const allPatients = loadProPatients();

    if (storedPatient) {
      // Update existing
      const updated: StoredPatient = {
        ...storedPatient,
        nom: form.nom,
        prenom: form.prenom,
        dateNaissance: form.dateNaissance,
        telephone: form.telephone,
        email: form.email || undefined,
        adresse: form.adresse || undefined,
        codePostal: form.codePostal || undefined,
        ville: form.ville || undefined,
        mutuelle: form.mutuelle || undefined,
      };
      const newList = allPatients.map((p) => (p.id === storedPatient.id ? updated : p));
      saveProPatients(newList);
      setStoredPatient(updated);
    } else {
      // Create new patient record
      const newP: StoredPatient = {
        id: `patient-${Date.now()}`,
        nom: form.nom,
        prenom: form.prenom,
        dateNaissance: form.dateNaissance,
        telephone: form.telephone,
        email: form.email || undefined,
        adresse: form.adresse || undefined,
        codePostal: form.codePostal || undefined,
        ville: form.ville || undefined,
        mutuelle: form.mutuelle || undefined,
        createdAt: new Date().toISOString(),
      };
      saveProPatients([...allPatients, newP]);
      setStoredPatient(newP);
    }

    // Update current patient
    const updatedCurrent: CurrentPatient = {
      ...currentPatient,
      nom: form.nom,
      prenom: form.prenom,
      email: form.email || currentPatient.email,
    };
    saveCurrentPatient(updatedCurrent);
    setCurrentPatient(updatedCurrent);

    setEditOpen(false);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }

  const initials = `${currentPatient.prenom[0] ?? ""}${currentPatient.nom[0] ?? ""}`.toUpperCase();

  return (
    <>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="grid h-14 w-14 place-items-center rounded-2xl text-sm font-bold text-white shadow-[0_4px_20px_rgba(45,140,255,0.32)] flex-shrink-0"
              style={{ background: ACCENT }}
            >
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mon profil</h1>
              <p className="mt-1 text-sm text-slate-500">
                {currentPatient.prenom} {currentPatient.nom}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openEdit}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:text-slate-900"
            style={{ ...glassSubtle, color: ACCENT }}
          >
            <IconEdit />
            Modifier mes informations
          </button>
        </div>

        {/* Identité */}
        <div className="rounded-3xl p-6" style={glass}>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">Identité</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldRow label="Prénom" value={storedPatient?.prenom ?? currentPatient.prenom} />
            <FieldRow label="Nom" value={storedPatient?.nom ?? currentPatient.nom} />
            <FieldRow label="Date de naissance" value={storedPatient?.dateNaissance ? formatDate(storedPatient.dateNaissance) : "—"} />
            <FieldRow label="Téléphone" value={storedPatient?.telephone ?? "—"} />
            <FieldRow label="Email" value={storedPatient?.email ?? currentPatient.email ?? "—"} />
            <FieldRow
              label="Adresse"
              value={[storedPatient?.adresse, storedPatient?.codePostal, storedPatient?.ville].filter(Boolean).join(", ") || "—"}
            />
            <FieldRow label="Mutuelle" value={storedPatient?.mutuelle ?? "—"} />
            <FieldRow label="N° Sécurité sociale" value={maskSS(storedPatient?.numeroSS)} />
          </div>
        </div>

        {/* Équipement actuel (dossiers) */}
        {dossiers.length > 0 && (
          <div className="rounded-3xl p-6" style={glass}>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">Équipement actuel</div>
            <div className="space-y-3">
              {dossiers.map((d) => {
                const statusStyle = STATUS_CONFIG[d.status] ?? { bg: "rgba(148,163,184,0.15)", text: "#475569" };
                return (
                  <div key={d.id} className="rounded-2xl p-4" style={glassSubtle}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{d.numero}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {TYPE_LABELS[d.type] ?? d.type} · {d.dateCreation ? formatDate(d.dateCreation) : ""}
                        </div>
                        {d.lignes.length > 0 && (
                          <div className="mt-1 text-xs text-slate-500">
                            {d.lignes[0]?.designation ?? ""}{d.lignes.length > 1 ? ` + ${d.lignes.length - 1} autre(s)` : ""}
                          </div>
                        )}
                      </div>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0"
                        style={{ background: statusStyle.bg, color: statusStyle.text }}
                      >
                        {d.status}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-3 text-xs text-slate-500">
                      <span>Total : <strong className="text-slate-700">{d.montantTotal.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</strong></span>
                      <span>RAC : <strong className="text-slate-700">{d.resteACharge.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hint when no pro record found */}
        {!storedPatient && (
          <div className="rounded-2xl px-5 py-3 text-xs text-slate-500" style={glassSubtle}>
            Vos informations complètes seront disponibles après votre première visite chez Clair Vision.
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.40)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditOpen(false); }}
        >
          <div className="w-full rounded-3xl p-6 space-y-4" style={{ ...glass, maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">Modifier mes informations</h2>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-xl p-1.5 text-slate-500 hover:text-slate-700 transition-all"
                style={glassSubtle}
              >
                <IconClose />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Prénom</label>
                  <input
                    value={form.prenom}
                    onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none"
                    style={glassSubtle}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nom</label>
                  <input
                    value={form.nom}
                    onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none"
                    style={glassSubtle}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Date de naissance</label>
                <input
                  type="date"
                  value={form.dateNaissance}
                  onChange={(e) => setForm((f) => ({ ...f, dateNaissance: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none"
                  style={glassSubtle}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={form.telephone}
                    onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none"
                    style={glassSubtle}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none"
                    style={glassSubtle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Adresse</label>
                <input
                  value={form.adresse}
                  onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none"
                  style={glassSubtle}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Code postal</label>
                  <input
                    value={form.codePostal}
                    onChange={(e) => setForm((f) => ({ ...f, codePostal: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none"
                    style={glassSubtle}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Ville</label>
                  <input
                    value={form.ville}
                    onChange={(e) => setForm((f) => ({ ...f, ville: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none"
                    style={glassSubtle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Mutuelle</label>
                <input
                  value={form.mutuelle}
                  onChange={(e) => setForm((f) => ({ ...f, mutuelle: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none"
                  style={glassSubtle}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm text-slate-500 transition-all"
                  style={glassSubtle}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_18px_rgba(45,140,255,0.32)] transition-all"
                  style={{ background: ACCENT }}
                >
                  <IconCheck />
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast visible={toastVisible} />
    </>
  );
}
