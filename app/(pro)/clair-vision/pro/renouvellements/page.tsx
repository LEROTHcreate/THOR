"use client";

import { useState, useEffect, useMemo } from "react";

/* ── Types ────────────────────────────────────────────────────────────────── */
type FrequenceRenouvellement = "1 mois" | "3 mois" | "6 mois" | "12 mois";
type CanalContact = "email" | "sms" | "message_site";
type StatutRappel = "à_envoyer" | "envoyé" | "confirmé" | "ignoré";

interface PatientLentilles {
  id: string;
  nom: string;
  prenom: string;
  telephone?: string;
  email?: string;
  comptePatientCree: boolean;
  lentille: string;
  frequence: FrequenceRenouvellement;
  dernierAchat: string;
  prochainRenouvellement: string;
  rappelStatut: StatutRappel;
  rappelEnvoye?: string;
  stock?: number;
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function calcProchain(dernierAchat: string, frequence: FrequenceRenouvellement): string {
  const d = new Date(dernierAchat);
  const mois = parseInt(frequence);
  d.setMonth(d.getMonth() + mois);
  return d.toISOString().split("T")[0];
}

function joursRestants(prochain: string): number {
  return Math.ceil((new Date(prochain).getTime() - Date.now()) / 86400000);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STORAGE_KEY     = "thor_pro_renouvellements_rappels";
const LS_LENTILLES    = "thor_pro_lentilles_patients";
const LS_REAL_PATIENTS = "thor_pro_patients";

type RappelRecord = { statut: StatutRappel; date: string };
type RappelsMap = Record<string, RappelRecord>;

interface StoredPatient { id: string; nom: string; prenom: string; telephone?: string; email?: string; notes?: string; }

function loadRappels(): RappelsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RappelsMap) : {};
  } catch {
    return {};
  }
}
function saveRappels(map: RappelsMap) { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); }

function loadLentillesPatients(): PatientLentilles[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_LENTILLES);
    return raw ? (JSON.parse(raw) as PatientLentilles[]) : null;
  } catch { return null; }
}
function saveLentillesPatients(list: PatientLentilles[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_LENTILLES, JSON.stringify(list));
}
function loadRealPatients(): StoredPatient[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_REAL_PATIENTS);
    return raw ? (JSON.parse(raw) as StoredPatient[]) : [];
  } catch { return []; }
}

/* ── Design tokens ────────────────────────────────────────────────────────── */
const glass: React.CSSProperties = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--glass-border)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
};
const glassSubtle: React.CSSProperties = {
  background: "var(--glass-subtle-bg)",
  border: "1px solid var(--glass-subtle-border)",
};

/* ── Mock data ────────────────────────────────────────────────────────────── */
const RAW_PATIENTS: Omit<PatientLentilles, "prochainRenouvellement" | "rappelStatut">[] = [
  // En retard (~3)
  {
    id: "p1",
    nom: "Leblanc",
    prenom: "Marie",
    telephone: "07 98 76 54 32",
    email: "marie.leblanc@email.com",
    comptePatientCree: true,
    lentille: "Air Optix Aqua Mensuelle",
    frequence: "1 mois",
    dernierAchat: "2026-02-10",
    stock: 0,
  },
  {
    id: "p2",
    nom: "Renaud",
    prenom: "Paul",
    telephone: "06 12 34 56 78",
    email: "paul.renaud@email.com",
    comptePatientCree: false,
    lentille: "Acuvue Oasys Journalière ×90",
    frequence: "3 mois",
    dernierAchat: "2025-12-15",
    stock: 1,
  },
  {
    id: "p3",
    nom: "Duval",
    prenom: "Sophie",
    telephone: "06 55 44 33 22",
    email: undefined,
    comptePatientCree: false,
    lentille: "Biofinity Mensuelle",
    frequence: "1 mois",
    dernierAchat: "2026-02-05",
    stock: 0,
  },
  // Cette semaine (~4)
  {
    id: "p4",
    nom: "Martin",
    prenom: "Lucas",
    telephone: "07 11 22 33 44",
    email: "lucas.martin@email.com",
    comptePatientCree: true,
    lentille: "Daily Total 1 Journalière ×90",
    frequence: "3 mois",
    dernierAchat: "2025-12-24",
    stock: 5,
  },
  {
    id: "p5",
    nom: "Petit",
    prenom: "Clara",
    telephone: undefined,
    email: "clara.petit@email.com",
    comptePatientCree: true,
    lentille: "Proclear Mensuelle",
    frequence: "1 mois",
    dernierAchat: "2026-02-24",
    stock: 2,
  },
  {
    id: "p6",
    nom: "Bernard",
    prenom: "Julien",
    telephone: "06 87 65 43 21",
    email: "julien.bernard@email.com",
    comptePatientCree: false,
    lentille: "Acuvue Moist Journalière ×30",
    frequence: "1 mois",
    dernierAchat: "2026-02-23",
    stock: 0,
  },
  {
    id: "p7",
    nom: "Thomas",
    prenom: "Emma",
    telephone: "07 33 22 11 00",
    email: undefined,
    comptePatientCree: false,
    lentille: "SofLens Mensuelle",
    frequence: "6 mois",
    dernierAchat: "2025-09-24",
    stock: 3,
  },
  // Ce mois (~3)
  {
    id: "p8",
    nom: "Robert",
    prenom: "Nicolas",
    telephone: "06 44 55 66 77",
    email: "nicolas.robert@email.com",
    comptePatientCree: true,
    lentille: "Precision1 Journalière ×90",
    frequence: "3 mois",
    dernierAchat: "2025-12-31",
    stock: 10,
  },
  {
    id: "p9",
    nom: "Moreau",
    prenom: "Camille",
    telephone: undefined,
    email: "camille.moreau@email.com",
    comptePatientCree: false,
    lentille: "Biotrue ONEday Journalière ×30",
    frequence: "1 mois",
    dernierAchat: "2026-03-01",
    stock: 1,
  },
  {
    id: "p10",
    nom: "Simon",
    prenom: "Antoine",
    telephone: "07 66 77 88 99",
    email: "antoine.simon@email.com",
    comptePatientCree: true,
    lentille: "Pure Vision 2 Mensuelle",
    frequence: "6 mois",
    dernierAchat: "2025-09-30",
    stock: 2,
  },
  // Futur >1 mois (~2)
  {
    id: "p11",
    nom: "Garcia",
    prenom: "Léa",
    telephone: "06 00 11 22 33",
    email: "lea.garcia@email.com",
    comptePatientCree: true,
    lentille: "Acuvue Oasys Astigmatisme",
    frequence: "12 mois",
    dernierAchat: "2025-06-01",
    stock: 8,
  },
  {
    id: "p12",
    nom: "Lefebvre",
    prenom: "Hugo",
    telephone: "07 99 88 77 66",
    email: undefined,
    comptePatientCree: false,
    lentille: "Biofinity Toric Mensuelle",
    frequence: "6 mois",
    dernierAchat: "2025-12-10",
    stock: 4,
  },
];

const INITIAL_PATIENTS: PatientLentilles[] = RAW_PATIENTS.map(p => ({
  ...p,
  prochainRenouvellement: calcProchain(p.dernierAchat, p.frequence),
  rappelStatut: "à_envoyer" as StatutRappel,
}));

/* ── Periode helpers ──────────────────────────────────────────────────────── */
type Periode = "tous" | "en_retard" | "cette_semaine" | "ce_mois" | "futur";

function getPeriode(prochain: string): "en_retard" | "cette_semaine" | "ce_mois" | "futur" {
  const jours = joursRestants(prochain);
  if (jours < 0) return "en_retard";
  const now = new Date();
  const fin_semaine = new Date(now);
  fin_semaine.setDate(now.getDate() + (7 - now.getDay()));
  const fin_mois = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const d = new Date(prochain);
  if (d <= fin_semaine) return "cette_semaine";
  if (d <= fin_mois) return "ce_mois";
  return "futur";
}

/* ── Badge statut ─────────────────────────────────────────────────────────── */
const STATUT_CONFIG: Record<StatutRappel, { label: string; bg: string; color: string }> = {
  "à_envoyer":  { label: "À envoyer",  bg: "#FEF3C7", color: "#92400E" },
  "envoyé":     { label: "Envoyé",     bg: "#DBEAFE", color: "#1D4ED8" },
  "confirmé":   { label: "Confirmé",   bg: "#D1FAE5", color: "#065F46" },
  "ignoré":     { label: "Ignoré",     bg: "#F3F4F6", color: "#6B7280" },
};

function StatutBadge({ statut }: { statut: StatutRappel }) {
  const cfg = STATUT_CONFIG[statut];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

/* ── Jours restants badge ─────────────────────────────────────────────────── */
function JoursBadge({ jours }: { jours: number }) {
  let bg = "#D1FAE5", color = "#065F46";
  if (jours < 0)  { bg = "#FEE2E2"; color = "#991B1B"; }
  else if (jours < 7) { bg = "#FEF3C7"; color = "#92400E"; }
  const label = jours < 0 ? `${Math.abs(jours)}j retard` : jours === 0 ? "Aujourd'hui" : `${jours}j`;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  );
}

/* ── Canal icons ──────────────────────────────────────────────────────────── */
function CanalIcons({ patient }: { patient: PatientLentilles }) {
  return (
    <span className="flex items-center gap-1">
      <span title="Email" style={{ opacity: patient.email ? 1 : 0.25 }} className="text-base"></span>
      <span title="SMS"   style={{ opacity: patient.telephone ? 1 : 0.25 }} className="text-base"></span>
      <span title="Site"  style={{ opacity: patient.comptePatientCree ? 1 : 0.25 }} className="text-base"></span>
    </span>
  );
}

/* ── KPI strip ────────────────────────────────────────────────────────────── */
function KpiStrip({ patients }: { patients: PatientLentilles[] }) {
  const enRetard   = patients.filter(p => joursRestants(p.prochainRenouvellement) < 0).length;
  const semaine    = patients.filter(p => getPeriode(p.prochainRenouvellement) === "cette_semaine").length;
  const mois       = patients.filter(p => getPeriode(p.prochainRenouvellement) === "ce_mois").length;
  const today      = new Date().toISOString().split("T")[0];
  const envoyes    = patients.filter(p => p.rappelStatut === "envoyé" && p.rappelEnvoye === today).length;

  const kpis = [
    { emoji: "", label: "En retard",             value: enRetard, accent: "#EF4444" },
    { emoji: "", label: "Cette semaine",          value: semaine,  accent: "#F59E0B" },
    { emoji: "", label: "Ce mois",               value: mois,     accent: "#10B981" },
    { emoji: "", label: "Rappels envoyés auj.",  value: envoyes,  accent: "#2D8CFF" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {kpis.map(k => (
        <div key={k.label} className="rounded-2xl p-4 flex flex-col gap-1" style={glass}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{k.emoji}</span>
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color: k.accent }}
            >
              {k.value}
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium">{k.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Modal Rappel ─────────────────────────────────────────────────────────── */
interface ModalProps {
  patient: PatientLentilles;
  onClose: () => void;
  onSend: (patientId: string, canaux: CanalContact[], message: string) => void;
}

const TEL_MAGASIN = "01 23 45 67 89";
const LIEN_ESPACE = "clair-vision.fr/espace-patient";

function buildMessage(canal: CanalContact, patient: PatientLentilles): string {
  switch (canal) {
    case "email":
      return `Bonjour ${patient.prenom}, votre renouvellement de lentilles ${patient.lentille} approche. Contactez-nous ou commandez directement sur votre espace patient.`;
    case "sms":
      return `Bonjour ${patient.prenom}, vos lentilles ${patient.lentille} sont à renouveler. Appelez le ${TEL_MAGASIN} ou connectez-vous sur ${LIEN_ESPACE}.`;
    case "message_site":
      return `Votre renouvellement de ${patient.lentille} est disponible. Cliquez pour commander.`;
  }
}

function ModalRappel({ patient, onClose, onSend }: ModalProps) {
  const canaux: CanalContact[] = [];
  if (patient.email) canaux.push("email");
  if (patient.telephone) canaux.push("sms");
  if (patient.comptePatientCree) canaux.push("message_site");

  const [selected, setSelected] = useState<CanalContact[]>(canaux.slice(0, 1));
  const [message, setMessage] = useState(() =>
    canaux.length > 0 ? buildMessage(canaux[0], patient) : ""
  );

  function toggleCanal(c: CanalContact) {
    setSelected(prev => {
      const next = prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c];
      if (next.length === 1) setMessage(buildMessage(next[0], patient));
      return next;
    });
  }

  const canalLabels: Record<CanalContact, { label: string; emoji: string }> = {
    email:        { label: "Email",   emoji: "" },
    sms:          { label: "SMS",     emoji: "" },
    message_site: { label: "Message", emoji: "" },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-3xl p-6 flex flex-col gap-5"
        style={glass}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Rappel pour {patient.prenom} {patient.nom}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Renouvellement {patient.lentille} — {patient.frequence}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
            style={glassSubtle}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Canaux */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Canaux disponibles
          </div>
          {canaux.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Aucun canal disponible pour ce patient.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {canaux.map(c => (
                <button
                  key={c}
                  onClick={() => toggleCanal(c)}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all"
                  style={
                    selected.includes(c)
                      ? { background: "#2D8CFF", color: "#fff", boxShadow: "0 2px 8px rgba(45,140,255,0.25)" }
                      : { ...glassSubtle, color: "#64748b" }
                  }
                >
                  <span>{canalLabels[c].emoji}</span>
                  <span>{canalLabels[c].label}</span>
                  <span className="text-[10px] ml-1 opacity-70">✓ disponible</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Message personnalisable
          </div>
          <textarea
            className="w-full rounded-2xl p-3 text-sm text-slate-700 resize-none outline-none focus:ring-2 focus:ring-[#2D8CFF]/40 transition-all"
            style={{ ...glassSubtle, minHeight: 100 }}
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
            style={glassSubtle}
          >
            Annuler
          </button>
          <button
            onClick={() => {
              if (selected.length === 0) return;
              onSend(patient.id, selected, message);
            }}
            disabled={selected.length === 0 || canaux.length === 0}
            className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#2D8CFF", boxShadow: "0 2px 8px rgba(45,140,255,0.25)" }}
          >
            Envoyer le rappel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Toast ────────────────────────────────────────────────────────────────── */
interface ToastProps { message: string; onDone: () => void }
function Toast({ message, onDone }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-xl"
      style={{ background: "#2D8CFF", boxShadow: "0 8px 32px rgba(45,140,255,0.30)" }}
    >
      {message}
    </div>
  );
}

/* ── Row tableau ──────────────────────────────────────────────────────────── */
function TableRow({
  patient,
  onRappel,
}: {
  patient: PatientLentilles;
  onRappel: (p: PatientLentilles) => void;
}) {
  const jours = joursRestants(patient.prochainRenouvellement);
  return (
    <tr className="border-b border-slate-100 hover:bg-white/40 transition-colors">
      <td className="py-3 px-4">
        <div className="font-semibold text-slate-800 text-sm">
          {patient.prenom} {patient.nom}
        </div>
        {patient.stock !== undefined && (
          <div className="text-[11px] text-slate-400">{patient.stock} boîte{patient.stock > 1 ? "s" : ""} restante{patient.stock > 1 ? "s" : ""}</div>
        )}
      </td>
      <td className="py-3 px-4 text-sm text-slate-600 max-w-[200px]">
        <span className="line-clamp-2">{patient.lentille}</span>
      </td>
      <td className="py-3 px-4 text-sm text-slate-500 whitespace-nowrap">{patient.frequence}</td>
      <td className="py-3 px-4 text-sm text-slate-500 whitespace-nowrap">{formatDate(patient.dernierAchat)}</td>
      <td className="py-3 px-4 text-sm text-slate-500 whitespace-nowrap">{formatDate(patient.prochainRenouvellement)}</td>
      <td className="py-3 px-4"><JoursBadge jours={jours} /></td>
      <td className="py-3 px-4"><CanalIcons patient={patient} /></td>
      <td className="py-3 px-4"><StatutBadge statut={patient.rappelStatut} /></td>
      <td className="py-3 px-4">
        <button
          onClick={() => onRappel(patient)}
          className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "#2D8CFF", boxShadow: "0 2px 8px rgba(45,140,255,0.20)" }}
        >
          Envoyer rappel
        </button>
      </td>
    </tr>
  );
}

/* ── Card patient ─────────────────────────────────────────────────────────── */
function PatientCard({
  patient,
  onRappel,
}: {
  patient: PatientLentilles;
  onRappel: (p: PatientLentilles) => void;
}) {
  const jours = joursRestants(patient.prochainRenouvellement);
  const enRetard = jours < 0;
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3 transition-all"
      style={{
        ...glass,
        border: enRetard ? "1.5px solid #FCA5A5" : glass.border,
        boxShadow: enRetard
          ? "0 8px 32px rgba(239,68,68,0.10)"
          : glass.boxShadow,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-slate-800">
            {patient.prenom} {patient.nom}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{patient.lentille}</div>
        </div>
        <JoursBadge jours={jours} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={glassSubtle}>
          {patient.frequence}
        </span>
        <CanalIcons patient={patient} />
        {patient.stock !== undefined && (
          <span className="text-xs text-slate-400">{patient.stock} boîte{patient.stock > 1 ? "s" : ""}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
        <div>
          <div className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">Dernier achat</div>
          <div>{formatDate(patient.dernierAchat)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">Prochain</div>
          <div>{formatDate(patient.prochainRenouvellement)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <StatutBadge statut={patient.rappelStatut} />
        <button
          onClick={() => onRappel(patient)}
          className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "#2D8CFF", boxShadow: "0 2px 8px rgba(45,140,255,0.20)" }}
        >
          Rappeler
        </button>
      </div>
    </div>
  );
}

/* ── Filter pill ──────────────────────────────────────────────────────────── */
function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
      style={
        active
          ? { background: "#2D8CFF", color: "#fff", boxShadow: "0 2px 8px rgba(45,140,255,0.22)" }
          : { ...glassSubtle, color: "#64748b" }
      }
    >
      {children}
    </button>
  );
}

/* ── Modal config new patient ────────────────────────────────────────────── */
function ConfigPatientModal({ sp, onSave, onClose }: { sp: StoredPatient; onSave: (p: PatientLentilles) => void; onClose: () => void }) {
  const [lentille, setLentille] = useState("");
  const [frequence, setFrequence] = useState<FrequenceRenouvellement>("1 mois");
  const [dernierAchat, setDernierAchat] = useState(new Date().toISOString().split("T")[0]);
  const [stock, setStock] = useState<number | "">("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lentille.trim()) return;
    const patient: PatientLentilles = {
      id: sp.id,
      nom: sp.nom,
      prenom: sp.prenom,
      telephone: sp.telephone,
      email: sp.email,
      comptePatientCree: false,
      lentille: lentille.trim(),
      frequence,
      dernierAchat,
      prochainRenouvellement: calcProchain(dernierAchat, frequence),
      rappelStatut: "à_envoyer",
      stock: stock === "" ? undefined : stock,
    };
    onSave(patient);
  }

  const inputCls: React.CSSProperties = { width: "100%", borderRadius: 10, border: "1px solid rgba(45,140,255,0.18)", background: "var(--glass-strong-bg)", padding: "7px 12px", fontSize: 13, color: "#1e293b", outline: "none" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-3xl p-6 flex flex-col gap-4" style={glass}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">Ajouter aux renouvellements</h2>
            <p className="text-sm text-slate-500 mt-0.5">{sp.prenom} {sp.nom}</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:text-slate-700" style={glassSubtle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Lentille *</label>
            <input style={inputCls} value={lentille} onChange={e => setLentille(e.target.value)} placeholder="Air Optix Aqua Mensuelle" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Fréquence *</label>
              <select style={inputCls} value={frequence} onChange={e => setFrequence(e.target.value as FrequenceRenouvellement)}>
                {(["1 mois","3 mois","6 mois","12 mois"] as FrequenceRenouvellement[]).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Stock restant</label>
              <input type="number" min="0" style={inputCls} value={stock} onChange={e => setStock(e.target.value ? parseInt(e.target.value) : "")} placeholder="0" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Dernier achat *</label>
            <input type="date" style={inputCls} value={dernierAchat} onChange={e => setDernierAchat(e.target.value)} required />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl py-2.5 text-sm font-medium text-slate-600" style={glassSubtle}>Annuler</button>
            <button type="submit" className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white" style={{ background: "#2D8CFF" }}>Ajouter</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────────── */
export default function RenouvellementPage() {
  const [patients, setPatients] = useState<PatientLentilles[]>(INITIAL_PATIENTS);
  const [newPatients, setNewPatients] = useState<StoredPatient[]>([]);
  const [configPatient, setConfigPatient] = useState<StoredPatient | null>(null);
  const [vue, setVue] = useState<"tableau" | "cartes">("tableau");
  const [periode, setPeriode] = useState<Periode>("tous");
  const [frequence, setFrequence] = useState<"tous" | FrequenceRenouvellement>("tous");
  const [filtreCanaux, setFiltreCanaux] = useState<CanalContact[]>([]);
  const [filtreStatut, setFiltreStatut] = useState<"tous" | StatutRappel>("tous");
  const [modalPatient, setModalPatient] = useState<PatientLentilles | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Charger données depuis localStorage
  useEffect(() => {
    // Load lentilles patients (or seed from INITIAL_PATIENTS)
    const stored = loadLentillesPatients();
    const rappels = loadRappels();
    const base = stored ?? INITIAL_PATIENTS;
    setPatients(base.map(p => {
      const r = rappels[p.id];
      return r ? { ...p, rappelStatut: r.statut, rappelEnvoye: r.date } : p;
    }));
    if (!stored) saveLentillesPatients(base); // seed on first load

    // Load real patients not yet in lentilles list
    const realPats = loadRealPatients();
    const knownIds = new Set(base.map(p => p.id));
    const knownNames = new Set(base.map(p => `${p.prenom.toLowerCase()} ${p.nom.toLowerCase()}`));
    const unknown = realPats.filter(sp => {
      if (knownIds.has(sp.id)) return false;
      if (knownNames.has(`${sp.prenom.toLowerCase()} ${sp.nom.toLowerCase()}`)) return false;
      return true;
    });
    setNewPatients(unknown);
  }, []);

  // KPI values for subtitle
  const totalARecontacter = useMemo(
    () => patients.filter(p => p.rappelStatut === "à_envoyer").length,
    [patients]
  );
  const totalSemaine = useMemo(
    () => patients.filter(p => getPeriode(p.prochainRenouvellement) === "cette_semaine").length,
    [patients]
  );
  const totalRetard = useMemo(
    () => patients.filter(p => joursRestants(p.prochainRenouvellement) < 0).length,
    [patients]
  );

  // Filtered
  const filtered = useMemo(() => {
    return patients.filter(p => {
      if (periode !== "tous") {
        const per = getPeriode(p.prochainRenouvellement);
        if (periode === "en_retard" && per !== "en_retard") return false;
        if (periode === "cette_semaine" && per !== "cette_semaine") return false;
        if (periode === "ce_mois" && per !== "ce_mois") return false;
        if (periode === "futur" && per !== "futur") return false;
      }
      if (frequence !== "tous" && p.frequence !== frequence) return false;
      if (filtreCanaux.length > 0) {
        const hasEmail   = filtreCanaux.includes("email") && !p.email;
        const hasSms     = filtreCanaux.includes("sms") && !p.telephone;
        const hasSite    = filtreCanaux.includes("message_site") && !p.comptePatientCree;
        if (hasEmail || hasSms || hasSite) return false;
      }
      if (filtreStatut !== "tous" && p.rappelStatut !== filtreStatut) return false;
      return true;
    });
  }, [patients, periode, frequence, filtreCanaux, filtreStatut]);

  function toggleFiltreCanal(c: CanalContact) {
    setFiltreCanaux(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  }

  function persistPatients(updated: PatientLentilles[]) {
    setPatients(updated);
    saveLentillesPatients(updated);
  }

  function handleAddNewPatient(p: PatientLentilles) {
    const updated = [...patients, p];
    persistPatients(updated);
    setNewPatients(prev => prev.filter(sp => sp.id !== p.id));
    setConfigPatient(null);
    setToast(`${p.prenom} ${p.nom} ajouté(e) aux renouvellements`);
  }

  function handleSend(patientId: string, canaux: CanalContact[], _message: string) {
    const today = new Date().toISOString().split("T")[0];
    const updated = patients.map(p =>
      p.id === patientId ? { ...p, rappelStatut: "envoyé" as StatutRappel, rappelEnvoye: today } : p
    );
    persistPatients(updated);
    const rappels = loadRappels();
    rappels[patientId] = { statut: "envoyé", date: today };
    saveRappels(rappels);
    const patient = patients.find(p => p.id === patientId);
    const canalLabels = canaux.map(c => (c === "email" ? "email" : c === "sms" ? "SMS" : "message site")).join(", ");
    setToast(`Rappel envoyé par ${canalLabels} à ${patient?.prenom} ${patient?.nom}`);
    setModalPatient(null);
  }

  function handleActualiser() {
    const stored = loadLentillesPatients();
    const rappels = loadRappels();
    const base = stored ?? INITIAL_PATIENTS;
    setPatients(base.map(p => {
      const r = rappels[p.id];
      return r ? { ...p, rappelStatut: r.statut, rappelEnvoye: r.date } : p;
    }));
  }

  const periodeOptions: { value: Periode; label: string }[] = [
    { value: "tous",         label: "Tous" },
    { value: "en_retard",    label: "En retard" },
    { value: "cette_semaine",label: "Cette semaine" },
    { value: "ce_mois",      label: "Ce mois" },
    { value: "futur",        label: "Futur" },
  ];

  const frequenceOptions: { value: "tous" | FrequenceRenouvellement; label: string }[] = [
    { value: "tous",    label: "Tous" },
    { value: "1 mois",  label: "1 mois" },
    { value: "3 mois",  label: "3 mois" },
    { value: "6 mois",  label: "6 mois" },
    { value: "12 mois", label: "12 mois" },
  ];

  const statutOptions: { value: "tous" | StatutRappel; label: string }[] = [
    { value: "tous",       label: "Tous" },
    { value: "à_envoyer",  label: "À envoyer" },
    { value: "envoyé",     label: "Envoyé" },
    { value: "confirmé",   label: "Confirmé" },
  ];

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Renouvellements lentilles
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            <span className="font-semibold text-[#2D8CFF]">{totalARecontacter}</span> patients à recontacter
            {" · "}
            <span className="font-semibold text-amber-600">{totalSemaine}</span> cette semaine
            {" · "}
            <span className="font-semibold text-red-500">{totalRetard}</span> en retard
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Vue toggle */}
          <div
            className="flex rounded-xl p-1 gap-1"
            style={glassSubtle}
          >
            {(["tableau", "cartes"] as const).map(v => (
              <button
                key={v}
                onClick={() => setVue(v)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all capitalize"
                style={
                  vue === v
                    ? { background: "#2D8CFF", color: "#fff", boxShadow: "0 2px 8px rgba(45,140,255,0.22)" }
                    : { color: "#64748b" }
                }
              >
                {v === "tableau" ? "Tableau" : "Cartes"}
              </button>
            ))}
          </div>
          <button
            onClick={handleActualiser}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:text-[#2D8CFF] transition-colors"
            style={glassSubtle}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <KpiStrip patients={patients} />

      {/* Filtres */}
      <div
        className="rounded-2xl p-4 mb-6 flex flex-col gap-3"
        style={glass}
      >
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 w-14 flex-shrink-0">Période</span>
          {periodeOptions.map(o => (
            <Pill key={o.value} active={periode === o.value} onClick={() => setPeriode(o.value)}>
              {o.label}
            </Pill>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 w-14 flex-shrink-0">Fréquence</span>
          {frequenceOptions.map(o => (
            <Pill key={o.value} active={frequence === o.value} onClick={() => setFrequence(o.value)}>
              {o.label}
            </Pill>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 w-14 flex-shrink-0">Canaux</span>
          {(["email", "sms", "message_site"] as CanalContact[]).map(c => {
            const info = { email: "Email", sms: "SMS", message_site: "Site" }[c];
            return (
              <Pill
                key={c}
                active={filtreCanaux.includes(c)}
                onClick={() => toggleFiltreCanal(c)}
              >
                {info}
              </Pill>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 w-14 flex-shrink-0">Statut</span>
          {statutOptions.map(o => (
            <Pill key={o.value} active={filtreStatut === o.value} onClick={() => setFiltreStatut(o.value)}>
              {o.label}
            </Pill>
          ))}
        </div>
      </div>

      {/* Nouveaux patients à intégrer */}
      {newPatients.length > 0 && (
        <div className="rounded-2xl p-4 mb-4" style={{ ...glass, border: "1px solid rgba(45,140,255,0.20)", background: "rgba(45,140,255,0.04)" }}>
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>🆕 Nouveaux patients à intégrer</span>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>({newPatients.length} patient{newPatients.length > 1 ? "s" : ""} du fichier)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {newPatients.map(sp => (
              <button
                key={sp.id}
                onClick={() => setConfigPatient(sp)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#2D8CFF] transition-all"
                style={glassSubtle}
              >
                <span className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-[#2D8CFF]" style={{ background: "rgba(45,140,255,0.10)" }}>
                  {sp.prenom[0]}{sp.nom[0]}
                </span>
                {sp.prenom} {sp.nom}
                <span style={{ color: "#2D8CFF" }}>+ Ajouter</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Résultats count */}
      <div className="text-xs text-slate-400 mb-3 font-medium">
        {filtered.length} patient{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
      </div>

      {/* Vue tableau */}
      {vue === "tableau" && (
        <div className="rounded-2xl overflow-hidden" style={glass}>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Patient", "Lentille", "Fréquence", "Dernier achat", "Prochain", "J restants", "Canaux", "Rappel", "Actions"].map(h => (
                    <th key={h} className="py-3 px-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 text-sm">
                      Aucun patient ne correspond aux filtres sélectionnés.
                    </td>
                  </tr>
                ) : (
                  filtered.map(p => (
                    <TableRow key={p.id} patient={p} onRappel={setModalPatient} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vue cartes */}
      {vue === "cartes" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-slate-400 text-sm rounded-2xl" style={glass}>
              Aucun patient ne correspond aux filtres sélectionnés.
            </div>
          ) : (
            filtered.map(p => (
              <PatientCard key={p.id} patient={p} onRappel={setModalPatient} />
            ))
          )}
        </div>
      )}

      {/* Modal rappel */}
      {modalPatient && (
        <ModalRappel
          patient={modalPatient}
          onClose={() => setModalPatient(null)}
          onSend={handleSend}
        />
      )}

      {/* Modal config new patient */}
      {configPatient && (
        <ConfigPatientModal
          sp={configPatient}
          onSave={handleAddNewPatient}
          onClose={() => setConfigPatient(null)}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
