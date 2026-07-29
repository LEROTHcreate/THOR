"use client";

import Link from "next/link";
import { useState, useEffect, use } from "react";
import type { CSSProperties } from "react";

/* ── Design tokens ──────────────────────────────────────────────────────── */
const glass: CSSProperties = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--glass-border)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
};
const glassSubtle: CSSProperties = {
  background: "var(--glass-subtle-bg)",
  border: "1px solid var(--glass-subtle-border)",
};

/* ── Couleur principale émeraude ────────────────────────────────────────── */
const PRIMARY   = "#10b981";
const PRIMARY_D = "#059669";

/* ── Types ──────────────────────────────────────────────────────────────── */
interface PatientDetail {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  telephone: string;
  email: string;
  adresse: string;
  codePostal: string;
  ville: string;
  mutuelle: string;
  numeroSS: string;
  notes: string;
  audioprothesisteReferent: string;
}

interface AudiogrammeFreq {
  hz: number;
  od: number;
  og: number;
}

interface BilanAuditif {
  id: string;
  date: string;
  praticien: string;
  type: "Bilan initial" | "Contrôle" | "Adaptation";
  audiogramme: AudiogrammeFreq[];
  notes: string;
  visiblePatient: boolean;
}

interface DevisFactureRef {
  id: string;
  date: string;
  description: string;
  montant: number;
  statut: "Facturé" | "Accepté" | "En attente" | "Refusé" | "Payé";
  type: "devis" | "facture";
}

interface DocumentRef {
  id: string;
  nom: string;
  type: "carte-vitale" | "mutuelle" | "bilan" | "compte-rendu" | "autre";
  date: string;
  visiblePatient: boolean;
}

interface TimelineEvent {
  id: string;
  date: string;
  titre: string;
  sousTitre: string;
  type: "rdv" | "bilan" | "devis" | "facture" | "appareillage" | "document";
}

type Tab = "overview" | "bilans" | "devis" | "documents" | "notes" | "suivi" | "courriers";

/* ── Mock data : patients ───────────────────────────────────────────────── */
const MOCK_PATIENTS: Record<string, PatientDetail> = {
  "jean-dupont": {
    id: "jean-dupont", firstName: "Jean", lastName: "Dupont", dob: "1951-03-14",
    telephone: "06 12 34 56 78", email: "jean.dupont@email.com",
    adresse: "24 rue des Acacias", codePostal: "75014", ville: "Paris",
    mutuelle: "Harmonie Mutuelle", numeroSS: "1510375014001",
    notes: "Perte auditive bilatérale modérée à sévère (55–70 dB). Port régulier depuis 2022.\nSatisfaction élevée. Suivi semestriel. Antécédents : traumatisme sonore professionnel (musicien).",
    audioprothesisteReferent: "M. Laurent Girard",
  },
  "marie-martin": {
    id: "marie-martin", firstName: "Marie", lastName: "Martin", dob: "1957-07-22",
    telephone: "06 98 76 54 32", email: "marie.martin@email.com",
    adresse: "8 allée des Roses", codePostal: "69003", ville: "Lyon",
    mutuelle: "MGEN", numeroSS: "2570769003002",
    notes: "Presbyacousie bilatérale. Excellente adaptation. Connectivité Bluetooth active quotidiennement.",
    audioprothesisteReferent: "M. Laurent Girard",
  },
  "pierre-bernard": {
    id: "pierre-bernard", firstName: "Pierre", lastName: "Bernard", dob: "1950-09-05",
    telephone: "06 55 44 33 22", email: "pierre.bernard@email.com",
    adresse: "3 avenue Jean Jaurès", codePostal: "31000", ville: "Toulouse",
    mutuelle: "Malakoff Humanis", numeroSS: "1500931000003",
    notes: "Première appareillage. Adaptation en cours. Contrôle prévu fin mars.",
    audioprothesisteReferent: "Mme Sophie Vidal",
  },
  "anne-leroy": {
    id: "anne-leroy", firstName: "Anne", lastName: "Leroy", dob: "1966-11-18",
    telephone: "07 11 22 33 44", email: "anne.leroy@email.com",
    adresse: "15 impasse des Lilas", codePostal: "44000", ville: "Nantes",
    mutuelle: "April Santé", numeroSS: "2661144000004",
    notes: "Perte unilatérale OD. Classe 1 — 100% Santé. Suivi annuel.",
    audioprothesisteReferent: "M. Laurent Girard",
  },
  "paul-simon": {
    id: "paul-simon", firstName: "Paul", lastName: "Simon", dob: "1944-01-30",
    telephone: "06 33 44 55 66", email: "paul.simon@email.com",
    adresse: "72 boulevard Maréchal Foch", codePostal: "67000", ville: "Strasbourg",
    mutuelle: "MAIF Santé", numeroSS: "1440167000005",
    notes: "Renouvellement à prévoir. Appareils actuels en fin de vie (5 ans). Presbyacousie avancée.",
    audioprothesisteReferent: "Mme Sophie Vidal",
  },
  "claire-petit": {
    id: "claire-petit", firstName: "Claire", lastName: "Petit", dob: "1959-07-09",
    telephone: "06 77 88 99 00", email: "claire.petit@email.com",
    adresse: "40 rue Victor Hugo", codePostal: "13001", ville: "Marseille",
    mutuelle: "AG2R La Mondiale", numeroSS: "2590713001006",
    notes: "Suivi actif. Bonne compliance. RDV de contrôle tous les 6 mois.",
    audioprothesisteReferent: "M. Laurent Girard",
  },
  "lucas-thomas": {
    id: "lucas-thomas", firstName: "Lucas", lastName: "Thomas", dob: "1948-04-12",
    telephone: "06 22 33 44 55", email: "lucas.thomas@email.com",
    adresse: "11 rue de la Mairie", codePostal: "06000", ville: "Nice",
    mutuelle: "Mutuelle Générale", numeroSS: "1480406000007",
    notes: "Surdité mixte bilatérale. Appareillage depuis 2020. Contrôle annuel.",
    audioprothesisteReferent: "Mme Sophie Vidal",
  },
  "sophie-richard": {
    id: "sophie-richard", firstName: "Sophie", lastName: "Richard", dob: "1955-12-25",
    telephone: "06 44 55 66 77", email: "sophie.richard@email.com",
    adresse: "5 chemin des Chênes", codePostal: "33000", ville: "Bordeaux",
    mutuelle: "Humanis", numeroSS: "2551233000008",
    notes: "Perte modérée stable. Très satisfaite de l'appareillage actuel. Classe 2.",
    audioprothesisteReferent: "M. Laurent Girard",
  },
};

/* ── Mock data : bilans ──────────────────────────────────────────────────── */
const MOCK_BILANS: BilanAuditif[] = [
  {
    id: "b001", date: "12 jan. 2026", praticien: "Dr. Arnaud Perrin (ORL)", type: "Contrôle",
    audiogramme: [
      { hz: 500,  od: 55, og: 52 },
      { hz: 1000, od: 62, og: 58 },
      { hz: 2000, od: 70, og: 65 },
      { hz: 4000, od: 78, og: 72 },
    ],
    notes: "Perte stable par rapport au bilan 2024. Pas d'évolution significative. Intelligibilité : 72% OD, 76% OG.",
    visiblePatient: false,
  },
  {
    id: "b002", date: "8 mar. 2025", praticien: "Dr. Arnaud Perrin (ORL)", type: "Adaptation",
    audiogramme: [
      { hz: 500,  od: 50, og: 48 },
      { hz: 1000, od: 60, og: 57 },
      { hz: 2000, od: 68, og: 63 },
      { hz: 4000, od: 75, og: 70 },
    ],
    notes: "Légère amélioration post-adaptation. Réglages fins effectués sur les hautes fréquences.",
    visiblePatient: false,
  },
  {
    id: "b003", date: "15 juin 2024", praticien: "Dr. Sophie Vidal (ORL)", type: "Bilan initial",
    audiogramme: [
      { hz: 500,  od: 30, og: 28 },
      { hz: 1000, od: 38, og: 35 },
      { hz: 2000, od: 45, og: 42 },
      { hz: 4000, od: 52, og: 48 },
    ],
    notes: "Premier bilan complet. Perte légère à moyenne. Appareillage recommandé.",
    visiblePatient: false,
  },
];

/* ── Mock data : devis & factures ────────────────────────────────────────── */
const MOCK_DEVIS_FACTURES_DEFAULT: DevisFactureRef[] = [
  { id: "DEV-AUD-2026-012", date: "12 jan. 2026", description: "Bilan audiométrique complet + adaptation appareils", montant: 580, statut: "En attente", type: "devis" },
  { id: "DEV-AUD-2025-088", date: "8 mar. 2025",  description: "Phonak Lumity 90 RITE — Binaural — Classe 2",        montant: 4980, statut: "Facturé",    type: "devis" },
  { id: "FAC-AUD-2025-088", date: "20 mar. 2025", description: "Facture appareillage Phonak Lumity 90 RITE",          montant: 4980, statut: "Payé",        type: "facture" },
];

/* ── Mock data : documents ───────────────────────────────────────────────── */
const MOCK_DOCUMENTS: DocumentRef[] = [
  { id: "doc-001", nom: "Carte vitale (scan)",              type: "carte-vitale",  date: "15 jan. 2026", visiblePatient: true },
  { id: "doc-002", nom: "Attestation mutuelle Harmonie",    type: "mutuelle",      date: "10 jan. 2026", visiblePatient: true },
  { id: "doc-003", nom: "Bilan audiométrique — jan. 2026",  type: "bilan",         date: "12 jan. 2026", visiblePatient: false },
  { id: "doc-004", nom: "Compte-rendu ORL — Dr. Perrin",    type: "compte-rendu",  date: "20 jan. 2026", visiblePatient: false },
];

/* ── Mock data : timeline ────────────────────────────────────────────────── */
const MOCK_TIMELINE: TimelineEvent[] = [
  { id: "t1", date: "Aujourd'hui",  titre: "RDV — Contrôle semestriel",             sousTitre: "M. Laurent Girard · audioprothésiste",          type: "rdv" },
  { id: "t2", date: "12 jan. 2026", titre: "DEV-AUD-2026-012 — Bilan + adaptation",  sousTitre: "580 € — En attente de règlement",               type: "devis" },
  { id: "t3", date: "12 jan. 2026", titre: "Bilan audiométrique — Contrôle",          sousTitre: "Dr. Arnaud Perrin (ORL)",                       type: "bilan" },
  { id: "t4", date: "20 mar. 2025", titre: "FAC-AUD-2025-088 réglée — 4 980 €",      sousTitre: "Paiement CB + SS + Mutuelle",                   type: "facture" },
  { id: "t5", date: "15 jan. 2025", titre: "Pose des appareils — Phonak Lumity 90",  sousTitre: "OD + OG — Binaural — M. Laurent Girard",        type: "appareillage" },
  { id: "t6", date: "15 juin 2024", titre: "Bilan initial — Dr. Vidal (ORL)",         sousTitre: "Perte légère à moyenne — Appareillage recommandé", type: "bilan" },
];

/* ── Statut meta ─────────────────────────────────────────────────────────── */
const STATUT_META: Record<string, { color: string; bg: string; label: string }> = {
  "Facturé":    { color: "#15803D", bg: "rgba(21,128,61,0.10)",   label: "Facturé" },
  "Accepté":    { color: PRIMARY,   bg: "rgba(16,185,129,0.10)",  label: "Accepté" },
  "En attente": { color: "#F59E0B", bg: "rgba(245,158,11,0.10)",  label: "En attente" },
  "Refusé":     { color: "#EF4444", bg: "rgba(239,68,68,0.10)",   label: "Refusé" },
  "Payé":       { color: "#15803D", bg: "rgba(21,128,61,0.10)",   label: "Payé" },
};

const DOC_ICONS: Record<DocumentRef["type"], string> = {
  "carte-vitale": "",
  "mutuelle":     "",
  "bilan":        "",
  "compte-rendu": "",
  "autre":        "",
};

const TIMELINE_META: Record<TimelineEvent["type"], { dot: string; icon: string }> = {
  rdv:          { dot: "#00C98A", icon: "" },
  bilan:        { dot: PRIMARY,   icon: "" },
  devis:        { dot: "#6366f1", icon: "" },
  facture:      { dot: "#00C98A", icon: "" },
  appareillage: { dot: PRIMARY_D, icon: "" },
  document:     { dot: "#64748b", icon: "" },
};

/* ── Classification perte auditive ──────────────────────────────────────── */
function classifyLoss(db: number): { label: string; color: string } {
  if (db < 20)  return { label: "Normale",  color: "#64748b" };
  if (db < 40)  return { label: "Légère",   color: PRIMARY };
  if (db < 70)  return { label: "Moyenne",  color: "#F59E0B" };
  if (db < 90)  return { label: "Sévère",   color: "#EF4444" };
  return           { label: "Profonde",  color: "#7C3AED" };
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function calcAge(dob: string): number {
  const b = new Date(dob);
  const n = new Date();
  let age = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) age--;
  return age;
}

function maskSS(ss: string): string {
  return ss.slice(0, 4) + " •••• •••• ••••";
}

function avatarColor(name: string): string {
  const colors = ["#10b981", "#059669", "#047857", "#065f46", "#34d399", "#6ee7b7", "#064e3b", "#0d9488"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return colors[Math.abs(h) % colors.length];
}

function formatEur(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

function avgAudiogram(audiogramme: AudiogrammeFreq[], ear: "od" | "og"): number {
  if (audiogramme.length === 0) return 0;
  return Math.round(audiogramme.reduce((s, f) => s + f[ear], 0) / audiogramme.length);
}

/* ── SVG Icons ───────────────────────────────────────────────────────────── */
function IconArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}
function IconLock({ locked }: { locked: boolean }) {
  return locked ? (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ) : (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}
function IconX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/* ── Modal wrapper ───────────────────────────────────────────────────────── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={glass}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <IconX />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Toast ───────────────────────────────────────────────────────────────── */
function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl text-sm font-medium text-white shadow-lg"
      style={{ background: "rgba(30,30,40,0.92)", backdropFilter: "blur(12px)" }}>
      {msg}
    </div>
  );
}

/* ── Field helper ────────────────────────────────────────────────────────── */
function Field({ label, value, onChange, type = "text", textarea }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean;
}) {
  const cls = "w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-800 outline-none transition-all";
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className={cls} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} className={cls} />
      }
    </div>
  );
}

/* ── Tableau audiogramme ─────────────────────────────────────────────────── */
function AudiogrammeTable({ audiogramme }: { audiogramme: AudiogrammeFreq[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left py-1.5 pr-3 font-semibold text-slate-500 w-8"></th>
            {audiogramme.map(f => (
              <th key={f.hz} className="text-center py-1.5 px-2 font-medium text-slate-500">
                {f.hz >= 1000 ? `${f.hz / 1000} kHz` : `${f.hz} Hz`}
              </th>
            ))}
            <th className="text-center py-1.5 px-2 font-medium text-slate-500">Moy.</th>
          </tr>
        </thead>
        <tbody>
          {(["od", "og"] as const).map(ear => {
            const avg = avgAudiogram(audiogramme, ear);
            const cls = classifyLoss(avg);
            return (
              <tr key={ear} className="border-t border-slate-100">
                <td className="py-1.5 pr-3 font-bold text-slate-700 uppercase">{ear}</td>
                {audiogramme.map(f => {
                  const v = f[ear];
                  const c = classifyLoss(v);
                  return (
                    <td key={f.hz} className="text-center py-1.5 px-2">
                      <span className="font-semibold" style={{ color: c.color }}>{v}</span>
                      <span className="text-slate-500 text-[10px] ml-0.5">dB</span>
                    </td>
                  );
                })}
                <td className="text-center py-1.5 px-2">
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap"
                    style={{ background: `${cls.color}18`, color: cls.color }}>
                    {avg} dB · {cls.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════════════ */
interface StoredPatientAud {
  id: string; nom: string; prenom: string; dateNaissance?: string;
  telephone?: string; email?: string; adresse?: string; codePostal?: string;
  ville?: string; mutuelle?: string; numeroSS?: string; notes?: string;
}

export default function PatientAudFichePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const mockP = MOCK_PATIENTS[id] ?? null;
  const [patient, setPatient] = useState<PatientDetail | null>(mockP);
  const [loadingP, setLoadingP] = useState(!mockP);

  const [tab, setTab]             = useState<Tab>("overview");
  const [bilans, setBilans]       = useState<BilanAuditif[]>(MOCK_BILANS);
  const [documents, setDocuments] = useState<DocumentRef[]>(MOCK_DOCUMENTS);
  const [notes, setNotes]         = useState(mockP?.notes ?? "");
  const [toast, setToast]         = useState<string | null>(null);

  /* Modals */
  const [showBilanModal, setShowBilanModal] = useState(false);
  const [showRdvModal,   setShowRdvModal]   = useState(false);
  const [showReglModal,  setShowReglModal]  = useState(false);

  /* Form nouveau bilan */
  const [bilanForm, setBilanForm] = useState({
    date: "", praticien: "Dr. Arnaud Perrin (ORL)",
    type: "Contrôle" as BilanAuditif["type"],
    od500: "", od1000: "", od2000: "", od4000: "",
    og500: "", og1000: "", og2000: "", og4000: "",
    notes: "",
  });

  /* Form RDV */
  const [rdvDate,  setRdvDate]  = useState("");
  const [rdvHeure, setRdvHeure] = useState("");
  const [rdvType,  setRdvType]  = useState("Contrôle semestriel");

  /* Form règlement */
  const [reglMontant, setReglMontant] = useState("580");
  const [reglMode,    setReglMode]    = useState("CB");

  /* Document drop modal */
  interface DocDropModal { file: File; type: string; scanning: boolean; extracted: Record<string, string> }
  const [docDropModal, setDocDropModal] = useState<DocDropModal | null>(null);
  const [docDragOver,  setDocDragOver]  = useState(false);

  const DOC_TYPES_AUD = [
    { id: "bilan",        label: "Bilan audiométrique", icon: "" },
    { id: "compte-rendu", label: "Compte-rendu ORL",    icon: "" },
    { id: "mutuelle",     label: "Attestation mutuelle", icon: "" },
    { id: "carte-vitale", label: "Carte vitale",         icon: "" },
    { id: "autre",        label: "Autre document",       icon: "" },
  ] as const;

  function handleDocFile(file: File) {
    setDocDropModal({ file, type: "", scanning: false, extracted: {} });
  }

  function handleDocDrop(e: React.DragEvent) {
    e.preventDefault();
    setDocDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleDocFile(file);
  }

  function handleDocTypeSelect(type: string) {
    if (!docDropModal) return;
    setDocDropModal(m => m ? { ...m, type, scanning: true } : m);
    setTimeout(() => {
      const extracted: Record<string, string> = {};
      if (type === "bilan") {
        extracted.praticien = "Dr. Arnaud Perrin (ORL)";
        extracted.date = new Date().toLocaleDateString("fr-FR");
        extracted.od500 = "55"; extracted.od1000 = "63"; extracted.od2000 = "70"; extracted.od4000 = "76";
        extracted.og500 = "52"; extracted.og1000 = "59"; extracted.og2000 = "67"; extracted.og4000 = "73";
        extracted.notes = "Contrôle audiométrique — stable par rapport au bilan précédent.";
      } else if (type === "compte-rendu") {
        extracted.praticien = "Dr. Arnaud Perrin (ORL)";
        extracted.date = new Date().toLocaleDateString("fr-FR");
        extracted.notes = "Presbyacousie bilatérale confirmée. Appareillage conseillé.";
      } else if (type === "mutuelle") {
        extracted.mutuelle = patient?.mutuelle ?? "";
        extracted.adherent = `${patient?.firstName ?? ""} ${patient?.lastName ?? ""}`;
        extracted.numero = "MUT-" + Math.floor(Math.random() * 900000 + 100000);
      }
      setDocDropModal(m => m ? { ...m, scanning: false, extracted } : m);
    }, 1500);
  }

  function handleDocSave() {
    if (!docDropModal) return;
    const newDoc: DocumentRef = {
      id: `doc-${Date.now()}`,
      nom: docDropModal.file.name.replace(/\.[^.]+$/, ""),
      type: (docDropModal.type as DocumentRef["type"]) || "autre",
      date: new Date().toLocaleDateString("fr-FR"),
      visiblePatient: false,
    };
    setDocuments(prev => [...prev, newDoc]);
    setDocDropModal(null);
    setToast("Document ajouté avec succès.");
  }

  /* Devis & Factures */
  const [devisFactures, setDevisFactures] = useState<DevisFactureRef[]>(MOCK_DEVIS_FACTURES_DEFAULT);

  /* ── Suivi : checkpoints réglementaires ─────────────────────────────── */
  const SUIVI_CHECKPOINTS = [
    { key: "j30",   label: "Contrôle 1 mois",        date: "14 fév. 2025",  iso: "2025-02-14" },
    { key: "6mois", label: "Contrôle 6 mois",         date: "15 juil. 2025", iso: "2025-07-15" },
    { key: "1an",   label: "Contrôle 1 an",           date: "15 jan. 2026",  iso: "2026-01-15" },
    { key: "2ans",  label: "Contrôle 2 ans",          date: "15 jan. 2027",  iso: "2027-01-15" },
    { key: "4ans",  label: "Renouvellement (4 ans)",  date: "15 jan. 2029",  iso: "2029-01-15" },
  ];
  const [suiviDone, setSuiviDone] = useState<Record<string, boolean>>({
    j30: true, "6mois": true, "1an": false, "2ans": false, "4ans": false,
  });

  /* ── IOI-HA ─────────────────────────────────────────────────────────── */
  const IOI_QUESTIONS = [
    "Temps de port — Combien d'heures par jour portez-vous votre aide auditive ?",
    "Bénéfice — Dans les situations qui vous posaient le plus de difficultés, votre aide auditive vous aide-t-elle ?",
    "Activités résiduelles — Après le port de votre aide auditive, dans quelle mesure vos difficultés d'écoute vous limitent-elles encore ?",
    "Satisfaction — Globalement, êtes-vous satisfait(e) de votre aide auditive ?",
    "Participation restante — Dans quelle mesure vos difficultés auditives vous empêchent-elles encore de participer à la vie sociale ?",
    "Impact sur l'entourage — Votre difficulté auditive affecte-t-elle les autres personnes de votre entourage ?",
    "Qualité de vie — Globalement, vos difficultés auditives ont-elles affecté votre plaisir de vivre ?",
  ];
  interface IoiResult { date: string; scores: number[] }
  const [ioiResults, setIoiResults] = useState<IoiResult[]>([
    { date: "12 jan. 2026", scores: [4, 4, 3, 4, 4, 3, 4] },
    { date: "15 juil. 2025", scores: [3, 3, 4, 3, 3, 4, 3] },
  ]);
  const [ioiExpanded, setIoiExpanded] = useState<number | null>(null);
  const [showIoiForm, setShowIoiForm] = useState(false);
  const [ioiDraft, setIoiDraft] = useState<number[]>([3, 3, 3, 3, 3, 3, 3]);

  /* ── Courriers ──────────────────────────────────────────────────────── */
  interface CourrierCard { key: string; icon: string; title: string; description: string; body: string }
  const [courrierExpanded, setCourrierExpanded] = useState<string | null>(null);

  // Load from localStorage if not a mock patient
  useEffect(() => {
    if (mockP) { setLoadingP(false); return; }
    try {
      const raw = localStorage.getItem("thor_pro_audition_patients");
      if (raw) {
        const pats = JSON.parse(raw) as StoredPatientAud[];
        const found = pats.find(p => p.id === id);
        if (found) {
          setPatient({
            id: found.id, firstName: found.prenom, lastName: found.nom,
            dob: found.dateNaissance || "", telephone: found.telephone || "",
            email: found.email || "", adresse: found.adresse || "",
            codePostal: found.codePostal || "", ville: found.ville || "",
            mutuelle: found.mutuelle || "", numeroSS: found.numeroSS || "",
            notes: found.notes || "", audioprothesisteReferent: "M. Benali",
          });
          setNotes(found.notes || "");
        }
      }
    } catch {}
    setLoadingP(false);
  }, [id, mockP]);

  /* Patient introuvable */
  if (loadingP) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-slate-500 text-sm">Chargement…</div></div>;
  }
  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-4xl"></div>
        <p className="text-slate-500 text-sm">Patient introuvable.</p>
        <Link href="/clair-audition/pro/patients"
          className="text-sm font-medium hover:underline" style={{ color: PRIMARY }}>
          ← Retour à la liste
        </Link>
      </div>
    );
  }

  const age       = calcAge(patient.dob);
  const initiales = (patient.firstName[0] + patient.lastName[0]).toUpperCase();
  const couleur   = avatarColor(patient.firstName + patient.lastName);
  const totalCA   = devisFactures.filter(d => d.type === "facture").reduce((s, d) => s + d.montant, 0);
  const reglEnAttente = devisFactures.filter(d => d.statut === "En attente");

  function toggleBilanVis(bid: string) {
    setBilans(prev => prev.map(b => b.id === bid ? { ...b, visiblePatient: !b.visiblePatient } : b));
  }
  function toggleDocVis(docId: string) {
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, visiblePatient: !d.visiblePatient } : d));
  }

  function handleAddBilan() {
    if (!bilanForm.date || !bilanForm.od500 || !bilanForm.og500) {
      setToast("Veuillez remplir au minimum la date et les valeurs 500 Hz OD/OG.");
      return;
    }
    const newBilan: BilanAuditif = {
      id: `b-${Date.now()}`,
      date: bilanForm.date,
      praticien: bilanForm.praticien,
      type: bilanForm.type,
      audiogramme: [
        { hz: 500,  od: Number(bilanForm.od500)  || 0, og: Number(bilanForm.og500)  || 0 },
        { hz: 1000, od: Number(bilanForm.od1000) || 0, og: Number(bilanForm.og1000) || 0 },
        { hz: 2000, od: Number(bilanForm.od2000) || 0, og: Number(bilanForm.og2000) || 0 },
        { hz: 4000, od: Number(bilanForm.od4000) || 0, og: Number(bilanForm.og4000) || 0 },
      ],
      notes: bilanForm.notes,
      visiblePatient: false,
    };
    setBilans(prev => [newBilan, ...prev]);
    setShowBilanModal(false);
    setToast("Bilan auditif ajouté.");
  }

  function handleEncaisser() {
    setDevisFactures(prev =>
      prev.map(d => d.statut === "En attente" ? { ...d, statut: "Payé" as const } : d)
    );
    setShowReglModal(false);
    setToast(`Règlement de ${reglMontant} € enregistré en ${reglMode}.`);
  }

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: "overview",  label: "Vue d'ensemble" },
    { key: "bilans",    label: "Bilans auditifs" },
    { key: "devis",     label: "Devis & Factures", badge: reglEnAttente.length },
    { key: "documents", label: "Documents" },
    { key: "notes",     label: "Notes" },
    { key: "suivi",     label: "Suivi" },
    { key: "courriers", label: "Courriers" },
  ];

  return (
    <>
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      <div className="space-y-5">

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div className="rounded-2xl p-5" style={glass}>
          <div className="flex flex-wrap items-start gap-4">
            <Link href="/clair-audition/pro/patients"
              className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors mt-0.5 flex-shrink-0">
              <IconArrowLeft /> Patients
            </Link>
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Avatar */}
              <div className="grid h-16 w-16 place-items-center rounded-2xl text-white text-xl font-bold flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${couleur}, ${couleur}bb)`, boxShadow: `0 4px 16px ${couleur}44` }}>
                {initiales}
              </div>
              {/* Identité */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold text-slate-800">{patient.firstName} {patient.lastName}</h1>
                <p className="text-sm text-slate-500 mt-0.5">{age} ans · {patient.ville} · N°SS {maskSS(patient.numeroSS)}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-600">
                  <span>{patient.telephone}</span>
                  <span>{patient.email}</span>
                  <span>{patient.mutuelle}</span>
                  <span>{patient.audioprothesisteReferent}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
            <Link href={`/clair-audition/pro/devis?patient=${patient.id}`}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: "0 2px 8px rgba(99,102,241,0.30)" }}>
              + Nouveau devis
            </Link>
            <button onClick={() => setShowBilanModal(true)}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: PRIMARY, boxShadow: `0 2px 8px ${PRIMARY}40` }}>
              Nouveau bilan
            </button>
            <Link href="/clair-audition/pro/facturation"
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:bg-white/60"
              style={{ ...glassSubtle, color: "#374151" }}>
              Facturer
            </Link>
            <button onClick={() => setShowRdvModal(true)}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:bg-white/60"
              style={{ ...glassSubtle, color: "#374151" }}>
              Poser RDV
            </button>
            <button onClick={() => setToast("Télétransmission en cours de déploiement.")}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:bg-white/60"
              style={{ ...glassSubtle, color: "#374151" }}>
              Télétransmettre
            </button>
            <Link
              href="/clair-audition/pro/messagerie"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(0,201,138,0.10)", border: "1px solid rgba(0,201,138,0.25)",
                borderRadius: 10, padding: "7px 14px", fontSize: 13, fontWeight: 600,
                color: "#00C98A", textDecoration: "none",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Message
            </Link>
          </div>
        </div>

        {/* ── BODY ────────────────────────────────────────────────────────── */}
        <div className="flex gap-5 items-start">

          {/* Contenu principal */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Tab bar */}
            <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={glassSubtle}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    tab === t.key ? "text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                  style={tab === t.key ? { background: PRIMARY } : undefined}>
                  {t.label}
                  {t.badge != null && t.badge > 0 && (
                    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">{t.badge}</span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Vue d'ensemble ────────────────────────────────────────── */}
            {tab === "overview" && (
              <div className="space-y-4">

                {/* Synthèse patient */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Dernier bilan */}
                  {(() => {
                    const last = bilans[0];
                    const avgOD = last ? avgAudiogram(last.audiogramme, "od") : 0;
                    const avgOG = last ? avgAudiogram(last.audiogramme, "og") : 0;
                    const clsOD = classifyLoss(avgOD);
                    return (
                      <div className="rounded-2xl p-4 flex flex-col gap-1" style={glass}>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Dernier bilan</div>
                        {last ? (
                          <>
                            <div className="text-lg font-bold" style={{ color: clsOD.color }}>{avgOD} dB</div>
                            <div className="text-xs text-slate-500">{clsOD.label} · {last.date}</div>
                            <div className="flex gap-1.5 mt-1">
                              <span className="text-[10px] font-semibold rounded-full px-1.5 py-0.5" style={{ background: `${classifyLoss(avgOD).color}15`, color: classifyLoss(avgOD).color }}>OD</span>
                              <span className="text-[10px] font-semibold rounded-full px-1.5 py-0.5" style={{ background: `${classifyLoss(avgOG).color}15`, color: classifyLoss(avgOG).color }}>OG</span>
                            </div>
                          </>
                        ) : <div className="text-sm text-slate-500">Aucun bilan</div>}
                      </div>
                    );
                  })()}

                  {/* Prochain contrôle */}
                  {(() => {
                    const next = SUIVI_CHECKPOINTS.find(cp => !suiviDone[cp.key]);
                    const nextDate = next ? new Date(next.iso) : null;
                    const diffDays = nextDate ? Math.floor((nextDate.getTime() - Date.now()) / 86400000) : null;
                    const urgent = diffDays !== null && diffDays <= 30;
                    return (
                      <div className="rounded-2xl p-4 flex flex-col gap-1" style={glass}>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Prochain contrôle</div>
                        {next ? (
                          <>
                            <div className="text-sm font-bold text-slate-800 leading-tight">{next.label}</div>
                            <div className="text-xs text-slate-500">{next.date}</div>
                            {urgent && (
                              <span className="mt-1 text-[10px] font-semibold rounded-full px-1.5 py-0.5 self-start" style={{ background: "rgba(245,158,11,0.12)", color: "#d97706" }}>
                                {diffDays < 0 ? "En retard" : `Dans ${diffDays}j`}
                              </span>
                            )}
                          </>
                        ) : <div className="text-sm font-bold text-emerald-600">Suivi complet ✓</div>}
                      </div>
                    );
                  })()}

                  {/* RAC en attente */}
                  {(() => {
                    const total = reglEnAttente.reduce((s, d) => s + d.montant, 0);
                    return (
                      <div className="rounded-2xl p-4 flex flex-col gap-1" style={glass}>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">RAC en attente</div>
                        <div className="text-lg font-bold" style={{ color: total > 0 ? "#f59e0b" : "#10b981" }}>
                          {total > 0 ? formatEur(total) : "—"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {total > 0 ? `${reglEnAttente.length} pièce${reglEnAttente.length > 1 ? "s" : ""} en attente` : "Aucun solde dû"}
                        </div>
                        {total > 0 && (
                          <button onClick={() => setShowReglModal(true)}
                            className="mt-1 self-start text-[10px] font-semibold rounded-full px-2 py-0.5"
                            style={{ background: "rgba(245,158,11,0.12)", color: "#d97706" }}>
                            Encaisser →
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {/* CA total */}
                  <div className="rounded-2xl p-4 flex flex-col gap-1" style={glass}>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">CA total</div>
                    <div className="text-lg font-bold text-slate-800">{formatEur(totalCA)}</div>
                    <div className="text-xs text-slate-500">{devisFactures.filter(d => d.type === "facture").length} facture{devisFactures.filter(d => d.type === "facture").length > 1 ? "s" : ""}</div>
                    <Link href="/clair-audition/pro/facturation" className="mt-1 self-start text-[10px] font-semibold rounded-full px-2 py-0.5"
                      style={{ background: "rgba(0,201,138,0.10)", color: "#00C98A" }}>
                      Voir →
                    </Link>
                  </div>
                </div>

              <div className="rounded-2xl p-5" style={glass}>
                <h2 className="text-sm font-semibold text-slate-700 mb-5">Historique des activités</h2>
                <div className="relative">
                  <div className="absolute left-[19px] top-0 bottom-0 w-px bg-slate-100" />
                  <div className="space-y-5">
                    {MOCK_TIMELINE.map(ev => {
                      const m = TIMELINE_META[ev.type];
                      return (
                        <div key={ev.id} className="flex gap-4 items-start relative">
                          <div className="grid h-9 w-9 place-items-center rounded-full text-base flex-shrink-0 z-10"
                            style={{ background: `${m.dot}15`, border: `2px solid ${m.dot}44` }}>
                            {m.icon}
                          </div>
                          <div className="flex-1 pt-1">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-sm font-medium text-slate-800">{ev.titre}</span>
                              <span className="text-xs text-slate-500">{ev.date}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{ev.sousTitre}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              </div>
            )}

            {/* ── Bilans auditifs ───────────────────────────────────────── */}
            {tab === "bilans" && (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Les bilans sont <strong>privés par défaut</strong>. Cliquez sur le cadenas pour les partager avec le patient.
                  </p>
                  <button onClick={() => setShowBilanModal(true)}
                    className="flex-shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-white"
                    style={{ background: PRIMARY, boxShadow: `0 2px 8px ${PRIMARY}30` }}>
                    + Nouveau bilan
                  </button>
                </div>

                {bilans.map(bilan => {
                  const avgOD = avgAudiogram(bilan.audiogramme, "od");
                  const avgOG = avgAudiogram(bilan.audiogramme, "og");
                  const clsOD = classifyLoss(avgOD);
                  const clsOG = classifyLoss(avgOG);
                  return (
                    <div key={bilan.id} className="rounded-2xl p-4" style={glass}>
                      {/* En-tête */}
                      <div className="flex items-start justify-between gap-2 flex-wrap mb-3">
                        <div>
                          <span className="text-sm font-semibold text-slate-800">{bilan.type}</span>
                          <span className="ml-2 text-xs text-slate-500">{bilan.date} · {bilan.praticien}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleBilanVis(bilan.id)}
                            title={bilan.visiblePatient ? "Visible patient" : "Privé — non partagé"}
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors"
                            style={bilan.visiblePatient
                              ? { background: "rgba(16,185,129,0.10)", color: PRIMARY }
                              : { background: "rgba(239,68,68,0.10)", color: "#EF4444" }}>
                            <IconLock locked={!bilan.visiblePatient} />
                            {bilan.visiblePatient ? "Partagé" : "Privé"}
                          </button>
                          <button onClick={() => setToast("Impression…")}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors">
                            Imprimer
                          </button>
                        </div>
                      </div>

                      {/* Badges classification */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{ background: `${clsOD.color}15`, color: clsOD.color }}>
                          OD {avgOD} dB · {clsOD.label}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{ background: `${clsOG.color}15`, color: clsOG.color }}>
                          OG {avgOG} dB · {clsOG.label}
                        </span>
                      </div>

                      {/* Tableau audiogramme */}
                      <div className="rounded-xl p-3" style={glassSubtle}>
                        <AudiogrammeTable audiogramme={bilan.audiogramme} />
                      </div>

                      {/* Notes */}
                      {bilan.notes && (
                        <p className="mt-3 text-xs text-slate-600 leading-relaxed border-l-2 pl-3 italic"
                          style={{ borderColor: `${PRIMARY}60` }}>
                          {bilan.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Devis & Factures ──────────────────────────────────────── */}
            {tab === "devis" && (
              <div className="rounded-2xl overflow-hidden" style={glass}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-700">Devis & Factures</h2>
                  <Link href={`/clair-audition/pro/devis?patient=${patient.id}`}
                    className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
                    + Nouveau devis
                  </Link>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-500">
                      <th className="text-left px-4 py-2.5 font-medium">N°</th>
                      <th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell">Date</th>
                      <th className="text-left px-4 py-2.5 font-medium">Description</th>
                      <th className="text-right px-4 py-2.5 font-medium">Montant</th>
                      <th className="text-center px-4 py-2.5 font-medium">Statut</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {devisFactures.map(d => {
                      const meta = STATUT_META[d.statut] ?? STATUT_META["En attente"];
                      return (
                        <tr key={d.id} className="border-b border-slate-50 hover:bg-white/40 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{d.id}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap hidden sm:table-cell">{d.date}</td>
                          <td className="px-4 py-3 text-slate-700 max-w-[160px]">
                            <span className="truncate block text-xs">{d.description}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-800 whitespace-nowrap text-xs">{formatEur(d.montant)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
                              style={{ background: meta.bg, color: meta.color }}>
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button onClick={() => setToast(`Aperçu ${d.id}`)}
                              className="rounded-lg px-2 py-1 text-xs font-medium transition-colors"
                              style={{ color: PRIMARY }}>
                              Voir
                            </button>
                            {d.statut === "En attente" && (
                              <button onClick={() => setShowReglModal(true)}
                                className="ml-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors"
                                style={{ color: PRIMARY_D }}>
                                Encaisser
                              </button>
                            )}
                            {d.statut === "Accepté" && (
                              <Link href="/clair-audition/pro/facturation"
                                className="ml-1 rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors">
                                Facturer
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Documents ─────────────────────────────────────────────── */}
            {tab === "documents" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {documents.map(doc => (
                    <div key={doc.id} className="rounded-2xl p-3 flex flex-col gap-2" style={glass}>
                      <div className="text-2xl">{DOC_ICONS[doc.type]}</div>
                      <p className="text-xs font-medium text-slate-700 leading-tight">{doc.nom}</p>
                      <p className="text-[10px] text-slate-500">{doc.date}</p>
                      <div className="flex items-center justify-between mt-auto pt-1">
                        <button onClick={() => toggleDocVis(doc.id)}
                          className="flex items-center gap-0.5 text-[10px] font-medium rounded-md px-1.5 py-0.5 transition-colors"
                          style={doc.visiblePatient
                            ? { background: "rgba(16,185,129,0.10)", color: PRIMARY }
                            : { background: "rgba(239,68,68,0.10)", color: "#EF4444" }}>
                          <IconLock locked={!doc.visiblePatient} />
                          {doc.visiblePatient ? "Partagé" : "Privé"}
                        </button>
                        <button onClick={() => setToast(`Ouverture de "${doc.nom}"`)}
                          className="text-[10px] font-medium hover:underline" style={{ color: PRIMARY }}>
                          Voir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDocDragOver(true); }}
                  onDragLeave={() => setDocDragOver(false)}
                  onDrop={handleDocDrop}
                  className="rounded-2xl flex flex-col items-center justify-center gap-3 py-10 transition-all cursor-pointer"
                  style={{
                    border: `2px dashed ${docDragOver ? PRIMARY : PRIMARY + "55"}`,
                    background: docDragOver ? `${PRIMARY}08` : `${PRIMARY}03`,
                  }}
                  onClick={() => document.getElementById("aud-doc-input")?.click()}
                >
                  <span className="text-3xl"></span>
                  <div className="text-center">
                    <p className="text-sm font-semibold" style={{ color: PRIMARY }}>Glissez un document ici</p>
                    <p className="text-xs text-slate-500 mt-1">ou cliquez pour parcourir — le document sera scanné automatiquement</p>
                  </div>
                  <input id="aud-doc-input" type="file" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleDocFile(f); }} />
                </div>
              </div>
            )}

            {/* ── Notes ─────────────────────────────────────────────────── */}
            {tab === "notes" && (
              <div className="rounded-2xl p-5 space-y-4" style={glass}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-700">Notes internes</h2>
                  <span className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium"
                    style={{ background: "rgba(239,68,68,0.08)", color: "#EF4444" }}>
                    Jamais partagé avec le patient
                  </span>
                </div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={10}
                  placeholder="Notes internes sur ce patient…"
                  className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-700 leading-relaxed outline-none transition-all resize-none"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">Dernière modification : 12 jan. 2026 · M. Laurent Girard</p>
                  <button onClick={() => setToast("Notes enregistrées.")}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                    style={{ background: PRIMARY, boxShadow: `0 2px 8px ${PRIMARY}25` }}>
                    Enregistrer
                  </button>
                </div>
              </div>
            )}

            {/* ── Suivi ─────────────────────────────────────────────────── */}
            {tab === "suivi" && (() => {
              const doneCount = SUIVI_CHECKPOINTS.filter(c => suiviDone[c.key]).length;
              const today = new Date();

              function cpStatus(cp: typeof SUIVI_CHECKPOINTS[0]): "done" | "upcoming" | "overdue" | "future" {
                if (suiviDone[cp.key]) return "done";
                const d = new Date(cp.iso);
                const diffDays = Math.floor((d.getTime() - today.getTime()) / 86400000);
                if (diffDays < 0) return "overdue";
                if (diffDays <= 30) return "upcoming";
                return "future";
              }

              const STATUS_META: Record<string, { color: string; bg: string; label: string; dot: string }> = {
                done:     { color: "#059669", bg: "rgba(5,150,105,0.10)",   label: "Réalisé",   dot: "#10b981" },
                upcoming: { color: "#D97706", bg: "rgba(217,119,6,0.10)",   label: "À réaliser", dot: "#F59E0B" },
                overdue:  { color: "#DC2626", bg: "rgba(220,38,38,0.10)",   label: "En retard",  dot: "#EF4444" },
                future:   { color: "#2563EB", bg: "rgba(37,99,235,0.08)",   label: "À venir",   dot: "#3B82F6" },
              };

              const ioiScore = (r: { scores: number[] }) => r.scores.reduce((a, b) => a + b, 0);
              const ioiBadge = (total: number) => total >= 28
                ? { color: "#059669", bg: "rgba(5,150,105,0.10)", label: "Excellent" }
                : total >= 21
                  ? { color: "#D97706", bg: "rgba(217,119,6,0.10)", label: "Bon" }
                  : { color: "#DC2626", bg: "rgba(220,38,38,0.10)", label: "Insuffisant" };

              return (
                <div className="space-y-5">

                  {/* Planning de suivi réglementaire */}
                  <div className="rounded-2xl p-5 space-y-4" style={glass}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <h2 className="text-sm font-semibold text-slate-800">Planning de suivi réglementaire</h2>
                        <p className="text-xs text-slate-500 mt-0.5">5 contrôles obligatoires pour le maintien du remboursement AMO</p>
                      </div>
                      <span className="text-xs text-slate-500 rounded-lg px-2.5 py-1"
                        style={{ background: "rgba(241,245,249,0.8)" }}>
                        Date de remise : <strong>15 jan. 2025</strong>
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">{doneCount}/5 contrôles réalisés</span>
                        <span className="font-semibold" style={{ color: PRIMARY }}>{Math.round(doneCount / 5 * 100)} %</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${doneCount / 5 * 100}%`, background: `linear-gradient(90deg, ${PRIMARY}, ${PRIMARY_D})` }} />
                      </div>
                    </div>

                    {/* Timeline checkpoints */}
                    <div className="relative space-y-3">
                      <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-100" />
                      {SUIVI_CHECKPOINTS.map((cp) => {
                        const st = cpStatus(cp);
                        const meta = STATUS_META[st];
                        return (
                          <div key={cp.key} className="flex gap-3 items-start relative">
                            <div className="w-8 h-8 rounded-full flex-shrink-0 z-10 flex items-center justify-center border-2"
                              style={{ background: meta.bg, borderColor: meta.dot }}>
                              {st === "done"
                                ? <span className="text-xs font-bold" style={{ color: meta.dot }}>✓</span>
                                : <span className="w-2 h-2 rounded-full block" style={{ background: meta.dot }} />}
                            </div>
                            <div className="flex-1 rounded-xl p-3" style={glassSubtle}>
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div>
                                  <p className="text-sm font-semibold text-slate-800">{cp.label}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">Prévu : {cp.date}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                    style={{ background: meta.bg, color: meta.color }}>
                                    {meta.label}
                                  </span>
                                  {!suiviDone[cp.key] && (st === "overdue" || st === "upcoming") && (
                                    <button
                                      onClick={() => { setSuiviDone(prev => ({ ...prev, [cp.key]: true })); setToast("Contrôle marqué comme réalisé."); }}
                                      className="rounded-lg px-2.5 py-0.5 text-xs font-semibold text-white transition-all hover:opacity-90"
                                      style={{ background: PRIMARY }}>
                                      Marquer réalisé
                                    </button>
                                  )}
                                  {!suiviDone[cp.key] && st === "future" && (
                                    <button
                                      onClick={() => setToast("RDV noté pour " + cp.date + ".")}
                                      className="rounded-lg px-2.5 py-0.5 text-xs font-medium transition-all hover:bg-white/60"
                                      style={{ ...glassSubtle, color: "#2563EB" }}>
                                      RDV pris
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Questionnaire IOI-HA */}
                  <div className="rounded-2xl p-5 space-y-4" style={glass}>
                    <div className="flex items-start gap-3 flex-wrap">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-semibold text-slate-800">Questionnaire IOI-HA</h2>
                          <div className="relative group">
                            <div className="w-4 h-4 rounded-full flex items-center justify-center cursor-help text-[10px] font-bold"
                              style={{ background: "rgba(37,99,235,0.12)", color: "#2563EB" }}>i</div>
                            <div className="absolute left-0 top-6 w-64 rounded-xl p-3 text-xs text-slate-600 leading-relaxed z-10 hidden group-hover:block"
                              style={glass}>
                              <strong>International Outcome Inventory for Hearing Aids</strong> — Outil de mesure du bénéfice prothétique. Score sur 35 points.
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Évaluation du bénéfice prothétique — 7 questions, score 1–5 par question</p>
                      </div>
                      <button
                        onClick={() => { setShowIoiForm(true); setIoiDraft([3, 3, 3, 3, 3, 3, 3]); }}
                        className="rounded-xl px-4 py-2 text-sm font-semibold text-white flex-shrink-0 transition-all hover:opacity-90"
                        style={{ background: PRIMARY, boxShadow: `0 2px 8px ${PRIMARY}30` }}>
                        + Nouveau questionnaire
                      </button>
                    </div>

                    {/* Past results */}
                    <div className="space-y-3">
                      {ioiResults.map((r, idx) => {
                        const total = ioiScore(r);
                        const badge = ioiBadge(total);
                        const expanded = ioiExpanded === idx;
                        return (
                          <div key={idx} className="rounded-xl overflow-hidden" style={glassSubtle}>
                            <button
                              className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/30"
                              onClick={() => setIoiExpanded(expanded ? null : idx)}>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-slate-800">{r.date}</span>
                                <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                  style={{ background: badge.bg, color: badge.color }}>
                                  {badge.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold" style={{ color: badge.color }}>{total}<span className="text-xs font-normal text-slate-500">/35</span></span>
                                <span className="text-slate-500 text-xs">{expanded ? "▲" : "▼"}</span>
                              </div>
                            </button>
                            {expanded && (
                              <div className="px-4 pb-4 space-y-2 border-t border-slate-100">
                                {IOI_QUESTIONS.map((q, qi) => (
                                  <div key={qi} className="flex items-center gap-3 py-1.5">
                                    <span className="text-[10px] font-bold text-slate-500 w-4 flex-shrink-0">Q{qi + 1}</span>
                                    <p className="flex-1 text-xs text-slate-600 leading-snug">{q}</p>
                                    <div className="flex gap-0.5 flex-shrink-0">
                                      {[1, 2, 3, 4, 5].map(v => (
                                        <div key={v} className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold"
                                          style={r.scores[qi] === v
                                            ? { background: PRIMARY, color: "#fff" }
                                            : { background: "rgba(241,245,249,0.9)", color: "#94a3b8" }}>
                                          {v}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* IOI-HA new questionnaire form */}
                    {showIoiForm && (
                      <div className="rounded-xl p-4 space-y-4 border border-slate-200"
                        style={{ background: "var(--glass-strong-bg)" }}>
                        <p className="text-xs font-semibold text-slate-700">Nouveau questionnaire — {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                        {IOI_QUESTIONS.map((q, qi) => (
                          <div key={qi} className="space-y-1.5">
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-bold text-slate-500 mt-0.5 flex-shrink-0">Q{qi + 1}</span>
                              <p className="text-xs text-slate-700 leading-snug">{q}</p>
                            </div>
                            <div className="flex gap-1.5 pl-5">
                              {[1, 2, 3, 4, 5].map(v => (
                                <button key={v}
                                  onClick={() => setIoiDraft(d => d.map((x, i) => i === qi ? v : x))}
                                  className="w-9 h-9 rounded-xl text-sm font-bold transition-all hover:scale-105"
                                  style={ioiDraft[qi] === v
                                    ? { background: PRIMARY, color: "#fff", boxShadow: `0 2px 8px ${PRIMARY}40` }
                                    : { ...glassSubtle, color: "#64748b" }}>
                                  {v}
                                </button>
                              ))}
                              <span className="ml-2 self-center text-xs font-semibold" style={{ color: PRIMARY }}>
                                = {ioiDraft[qi]}
                              </span>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="text-sm font-semibold text-slate-700">
                            Score total : <span style={{ color: ioiBadge(ioiDraft.reduce((a, b) => a + b, 0)).color }}>{ioiDraft.reduce((a, b) => a + b, 0)}/35</span>
                          </span>
                          <div className="flex gap-2">
                            <button onClick={() => setShowIoiForm(false)}
                              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors">
                              Annuler
                            </button>
                            <button onClick={() => {
                              const today2 = new Date();
                              const label = today2.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
                              setIoiResults(prev => [{ date: label, scores: [...ioiDraft] }, ...prev]);
                              setShowIoiForm(false);
                              setToast("Questionnaire IOI-HA enregistré.");
                            }}
                              className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
                              style={{ background: PRIMARY }}>
                              Enregistrer
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })()}

            {/* ── Courriers ─────────────────────────────────────────────── */}
            {tab === "courriers" && (() => {
              const p = patient;
              const dobFormatted = new Date(p.dob).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

              const COURRIERS: CourrierCard[] = [
                {
                  key: "cr-audioprothétique",
                  icon: "",
                  title: "Compte-rendu audioprothétique",
                  description: "À destination de l'ORL prescripteur — synthèse de l'appareillage et du suivi.",
                  body: `Objet : Compte-rendu d'appareillage audioprothétique\n\nÀ l'attention du Dr Arnaud Perrin (ORL)\n\nParis, le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}\n\nDr Perrin,\n\nNous avons l'honneur de vous adresser le compte-rendu d'appareillage de votre patient(e) :\n\nPatient(e) : ${p.firstName} ${p.lastName}\nDate de naissance : ${dobFormatted}\nN° de Sécurité Sociale : ${p.numeroSS}\n\nAppareillage réalisé le 15 janvier 2025 par M. Laurent Girard, audioprothésiste.\n\nMatériel appareillé :\n  - OD : Phonak Lumity 90 RITE — Classe 2\n  - OG : Phonak Lumity 90 RITE — Classe 2\n\nRésultats :\n  - Intelligibilité en champ libre appareillé : 84 % (vs 52 % sans appareils)\n  - Gain fonctionnel moyen : +28 dB\n  - Satisfaction patient (IOI-HA) : 26/35 — Bon\n\nLe patient bénéficie d'un suivi régulier semestriel. Prochain contrôle prévu le 15 janvier 2026.\n\nNous restons à votre disposition pour tout renseignement complémentaire.\n\nCordialement,\n\nM. Laurent Girard\nAudioprothésiste D.E.\nClair Audition — ${p.ville}\n`,
                },
                {
                  key: "accueil-patient",
                  icon: "",
                  title: "Lettre d'accueil patient",
                  description: "Lettre de bienvenue expliquant le programme de suivi obligatoire.",
                  body: `Paris, le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}\n\nMadame, Monsieur ${p.firstName} ${p.lastName}\n${p.adresse}\n${p.codePostal} ${p.ville}\n\nObjet : Votre suivi audioprothétique chez Clair Audition\n\nCher(e) ${p.firstName},\n\nNous vous remercions de la confiance que vous accordez à notre centre Clair Audition pour votre appareillage auditif.\n\nSuite à la pose de vos appareils Phonak Lumity 90 RITE le 15 janvier 2025, nous vous rappelons votre programme de suivi réglementaire :\n\n  ✓  Contrôle 1 mois       — 14 février 2025       (réalisé)\n  ✓  Contrôle 6 mois       — 15 juillet 2025       (réalisé)\n  →  Contrôle 1 an         — 15 janvier 2026       (à venir)\n     Contrôle 2 ans        — 15 janvier 2027\n     Renouvellement 4 ans  — 15 janvier 2029\n\nCes contrôles sont obligatoires pour le maintien de votre remboursement par l'Assurance Maladie Obligatoire (AMO).\n\nPour prendre rendez-vous, vous pouvez nous contacter au :\n  Téléphone : 01 23 45 67 89\n  Email : contact@clair-audition.fr\n\nNous restons à votre disposition pour toute question.\n\nCordialement,\n\nM. Laurent Girard\nAudioprothésiste D.E.\nClair Audition\n`,
                },
                {
                  key: "rappel-controle",
                  icon: "",
                  title: "Rappel de contrôle",
                  description: "Courrier de rappel pour un contrôle de suivi à venir.",
                  body: `Paris, le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}\n\nMadame, Monsieur ${p.firstName} ${p.lastName}\n${p.adresse}\n${p.codePostal} ${p.ville}\n\nObjet : Rappel — Contrôle audioprothétique 1 an\n\nCher(e) ${p.firstName},\n\nNous vous contactons afin de vous rappeler que votre contrôle audioprothétique annuel est prévu le 15 janvier 2026.\n\nCe contrôle est obligatoire dans le cadre de votre remboursement AMO. Il permettra de :\n  - Vérifier le bon fonctionnement de vos appareils\n  - Ajuster les réglages si nécessaire\n  - Compléter le questionnaire de satisfaction IOI-HA\n  - Mettre à jour votre dossier audioprothétique\n\nSi cette date ne vous convient pas, nous vous invitons à contacter notre secrétariat au plus tôt afin de fixer un nouveau rendez-vous.\n\n  Téléphone : 01 23 45 67 89\n  Email : contact@clair-audition.fr\n\nNous vous rappelons que tout retard dans la réalisation de ces contrôles peut entraîner une suspension du remboursement par votre caisse d'assurance maladie.\n\nCordialement,\n\nM. Laurent Girard\nAudioprothésiste D.E.\nClair Audition\n`,
                },
                {
                  key: "renouvellement",
                  icon: "",
                  title: "Lettre de renouvellement",
                  description: "Courrier informant le patient de l'approche du renouvellement à 4 ans.",
                  body: `Paris, le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}\n\nMadame, Monsieur ${p.firstName} ${p.lastName}\n${p.adresse}\n${p.codePostal} ${p.ville}\n\nObjet : Renouvellement de votre appareillage auditif — janvier 2029\n\nCher(e) ${p.firstName},\n\nNous vous informons que votre appareillage auditif (Phonak Lumity 90 RITE, posé le 15 janvier 2025) arrivera à échéance de renouvellement en janvier 2029, conformément à la réglementation en vigueur.\n\nDans les mois précédant cette échéance, nous vous contacterons pour :\n  - Effectuer un bilan audiométrique complet\n  - Vous présenter les nouvelles technologies disponibles\n  - Établir un nouveau devis avec prise en charge AMO et mutuelle\n\nVotre mutuelle actuelle : ${p.mutuelle}\n\nNous vous conseillons de prendre contact avec votre mutuelle dès maintenant pour vérifier vos droits au renouvellement.\n\nNous restons à votre entière disposition pour toute question.\n\n  Téléphone : 01 23 45 67 89\n  Email : contact@clair-audition.fr\n\nCordialement,\n\nM. Laurent Girard\nAudioprothésiste D.E.\nClair Audition\n`,
                },
              ];

              return (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">Sélectionnez un modèle de courrier pour le générer avec les données du patient.</p>
                  {COURRIERS.map(c => {
                    const isOpen = courrierExpanded === c.key;
                    return (
                      <div key={c.key} className="rounded-2xl overflow-hidden" style={glass}>
                        {/* Card header */}
                        <div className="flex items-start gap-4 p-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                            style={{ background: `${PRIMARY}12` }}>
                            {c.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800">{c.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>
                          </div>
                          <button
                            onClick={() => setCourrierExpanded(isOpen ? null : c.key)}
                            className="flex-shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
                            style={{ background: PRIMARY, boxShadow: `0 2px 8px ${PRIMARY}30` }}>
                            {isOpen ? "Fermer" : "Générer"}
                          </button>
                        </div>

                        {/* Expanded letter */}
                        {isOpen && (
                          <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
                            <textarea
                              readOnly
                              rows={18}
                              value={c.body}
                              className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-xs text-slate-700 leading-relaxed outline-none font-mono resize-none"
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(c.body).then(() => setToast("Courrier copié dans le presse-papiers."));
                                }}
                                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:bg-white/60"
                                style={{ ...glassSubtle, color: "#374151" }}>
                                Copier
                              </button>
                              <button
                                onClick={() => window.print()}
                                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
                                style={{ background: PRIMARY, boxShadow: `0 2px 8px ${PRIMARY}30` }}>
                                Imprimer
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* ── PANNEAU DROIT ────────────────────────────────────────────── */}
          <div className="w-72 flex-shrink-0 space-y-4 hidden lg:block">

            {/* Appareillage actuel */}
            <div className="rounded-2xl p-4 space-y-3" style={glass}>
              <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Appareillage actuel</h3>
              {(["OD", "OG"] as const).map(ear => (
                <div key={ear} className="rounded-xl p-3 space-y-0.5" style={glassSubtle}>
                  <div className="mb-1">
                    <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5"
                      style={{ background: `${PRIMARY}20`, color: PRIMARY }}>{ear}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800">Phonak Lumity 90 RITE</p>
                  <p className="text-[11px] text-slate-500">Posé le 15 jan. 2025</p>
                </div>
              ))}
              <div className="rounded-xl px-3 py-2 text-xs"
                style={{ background: `${PRIMARY}08`, border: `1px solid ${PRIMARY}25` }}>
                <span className="text-slate-500">Renouvellement prévu :</span>
                <span className="ml-1 font-semibold" style={{ color: PRIMARY }}>jan. 2029</span>
              </div>
            </div>

            {/* Règlements en attente */}
            <div className="rounded-2xl p-4 space-y-3" style={glass}>
              <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">⏳ Règlements en attente</h3>
              {reglEnAttente.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Aucun règlement en attente</p>
              ) : reglEnAttente.map(d => (
                <div key={d.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-slate-700">{d.id}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{d.description}</p>
                    </div>
                    <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-bold text-white"
                      style={{ background: "#EF4444" }}>
                      {formatEur(d.montant)}
                    </span>
                  </div>
                  <button onClick={() => setShowReglModal(true)}
                    className="w-full rounded-xl py-2 text-xs font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #EF4444, #DC2626)" }}>
                    Encaisser le règlement
                  </button>
                </div>
              ))}
            </div>

            {/* Prochain RDV */}
            <div className="rounded-2xl p-4 space-y-2" style={glass}>
              <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Prochain RDV</h3>
              <div className="rounded-xl p-3 space-y-1" style={glassSubtle}>
                <p className="text-sm font-semibold text-slate-800">Jeu. 26 mar. 2026 · 10h30</p>
                <p className="text-xs text-slate-500">Contrôle semestriel</p>
                <p className="text-xs text-slate-500">M. Laurent Girard</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowRdvModal(true)}
                  className="flex-1 rounded-xl py-1.5 text-xs font-medium transition-colors"
                  style={{ ...glassSubtle, color: PRIMARY }}>
                  Modifier
                </button>
                <button onClick={() => setToast("RDV annulé.")}
                  className="flex-1 rounded-xl py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                  style={glassSubtle}>
                  Annuler
                </button>
              </div>
            </div>

            {/* Résumé */}
            <div className="rounded-2xl p-4 space-y-2" style={glass}>
              <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Résumé</h3>
              <div className="space-y-1.5 text-xs text-slate-600">
                {([
                  ["Bilans",         bilans.length.toString()],
                  ["Devis",          devisFactures.filter(d => d.type === "devis").length.toString()],
                  ["CA total",       formatEur(totalCA)],
                  ["Appareillage",   "jan. 2025"],
                  ["Renouvellement", "jan. 2029 (4 ans)"],
                ] as [string, string][]).map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-slate-500">{label}</span>
                    <span className={label === "CA total" ? "font-semibold text-slate-800" : "font-medium"}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── MODAL : Nouveau bilan ──────────────────────────────────────────── */}
      {showBilanModal && (
        <Modal title="Nouveau bilan auditif" onClose={() => setShowBilanModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date" value={bilanForm.date} onChange={v => setBilanForm(f => ({ ...f, date: v }))} type="date" />
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Type de bilan</label>
                <select value={bilanForm.type}
                  onChange={e => setBilanForm(f => ({ ...f, type: e.target.value as BilanAuditif["type"] }))}
                  className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-800 outline-none transition-all">
                  {(["Bilan initial", "Contrôle", "Adaptation"] as const).map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <Field label="Praticien prescripteur" value={bilanForm.praticien} onChange={v => setBilanForm(f => ({ ...f, praticien: v }))} />

            {/* Audiogramme OD */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: PRIMARY }}>Oreille droite — OD (dB)</p>
              <div className="grid grid-cols-4 gap-2">
                {(["od500", "od1000", "od2000", "od4000"] as const).map((key, i) => (
                  <Field key={key} label={["500 Hz", "1 kHz", "2 kHz", "4 kHz"][i]}
                    value={bilanForm[key]} onChange={v => setBilanForm(f => ({ ...f, [key]: v }))} type="number" />
                ))}
              </div>
            </div>

            {/* Audiogramme OG */}
            <div>
              <p className="text-xs font-semibold mb-2 text-slate-600">Oreille gauche — OG (dB)</p>
              <div className="grid grid-cols-4 gap-2">
                {(["og500", "og1000", "og2000", "og4000"] as const).map((key, i) => (
                  <Field key={key} label={["500 Hz", "1 kHz", "2 kHz", "4 kHz"][i]}
                    value={bilanForm[key]} onChange={v => setBilanForm(f => ({ ...f, [key]: v }))} type="number" />
                ))}
              </div>
            </div>

            <Field label="Notes cliniques" value={bilanForm.notes} onChange={v => setBilanForm(f => ({ ...f, notes: v }))} textarea />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowBilanModal(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors">
                Annuler
              </button>
              <button onClick={handleAddBilan}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: PRIMARY }}>
                Enregistrer le bilan
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL : Poser RDV ─────────────────────────────────────────────── */}
      {showRdvModal && (
        <Modal title="Poser un rendez-vous" onClose={() => setShowRdvModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date" value={rdvDate} onChange={setRdvDate} type="date" />
              <Field label="Heure" value={rdvHeure} onChange={setRdvHeure} type="time" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Type de RDV</label>
              <select value={rdvType} onChange={e => setRdvType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-800 outline-none transition-all">
                {["Contrôle semestriel", "Bilan initial", "Adaptation appareils", "Renouvellement", "Première consultation", "Urgence"].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowRdvModal(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors">
                Annuler
              </button>
              <button onClick={() => { setShowRdvModal(false); setToast("Rendez-vous posé avec succès."); }}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: PRIMARY }}>
                Confirmer le RDV
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL : Document drop ─────────────────────────────────────────── */}
      {docDropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={glass}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-slate-800">Quel type de document ?</h3>
              <button onClick={() => setDocDropModal(null)}
                className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <IconX />
              </button>
            </div>

            {/* File name */}
            <div className="mb-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600"
              style={{ background: "rgba(241,245,249,0.8)" }}>
              <span></span>
              <span className="truncate font-medium">{docDropModal.file.name}</span>
            </div>

            {/* Type selection */}
            {!docDropModal.type && (
              <div className="grid grid-cols-2 gap-2">
                {DOC_TYPES_AUD.map(dt => (
                  <button key={dt.id} onClick={() => handleDocTypeSelect(dt.id)}
                    className="flex items-center gap-2 rounded-xl p-3 text-left transition-all hover:scale-[1.02]"
                    style={{ ...glassSubtle, border: `1px solid rgba(255,255,255,0.65)` }}>
                    <span className="text-xl">{dt.icon}</span>
                    <span className="text-xs font-semibold text-slate-700">{dt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Scanning */}
            {docDropModal.type && docDropModal.scanning && (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${PRIMARY} transparent transparent transparent` }} />
                <p className="text-sm text-slate-500">Analyse du document en cours…</p>
              </div>
            )}

            {/* Extracted fields */}
            {docDropModal.type && !docDropModal.scanning && (
              <div className="space-y-3">
                {Object.keys(docDropModal.extracted).length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <span style={{ color: PRIMARY }}>✓</span>
                      Données extraites automatiquement — vérifiez avant de valider
                    </div>
                    <div className="rounded-xl p-3 space-y-2" style={glassSubtle}>
                      {Object.entries(docDropModal.extracted).map(([k, v]) => (
                        <div key={k}>
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{k}</p>
                          <p className="text-xs font-medium text-slate-700">{v}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 italic py-2">Aucune donnée extractible automatiquement.</p>
                )}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setDocDropModal(null)}
                    className="flex-1 rounded-xl py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors">
                    Annuler
                  </button>
                  <button onClick={handleDocSave}
                    className="flex-1 rounded-xl py-2 text-sm font-semibold text-white"
                    style={{ background: PRIMARY }}>
                    Enregistrer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL : Encaisser règlement ───────────────────────────────────── */}
      {showReglModal && (
        <Modal title="Encaisser le règlement" onClose={() => setShowReglModal(false)}>
          <div className="space-y-4">
            <div className="rounded-xl p-3 text-xs"
              style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.20)" }}>
              <p className="font-semibold text-slate-700">DEV-AUD-2026-012</p>
              <p className="text-slate-500 mt-0.5">Bilan audiométrique complet + adaptation appareils</p>
            </div>
            <Field label="Montant (€)" value={reglMontant} onChange={setReglMontant} type="number" />
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Mode de paiement</label>
              <select value={reglMode} onChange={e => setReglMode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-800 outline-none transition-all">
                {["CB", "Espèces", "Chèque", "Mutuelle", "SS", "Virement"].map(m => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowReglModal(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors">
                Annuler
              </button>
              <button onClick={handleEncaisser}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: PRIMARY }}>
                Valider l&apos;encaissement
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
