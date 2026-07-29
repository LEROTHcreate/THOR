"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import DraggableWindow from "@/components/ui/DraggableWindow";

/* ── Glass tokens ────────────────────────────────────────────────────────── */
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

const ACCENT = "#00C98A";

/* ── Types ───────────────────────────────────────────────────────────────── */
type PatientStatus = "suivi" | "controle" | "renouvellement";

interface Patient {
  id: string;
  nom: string;
  prenom: string;
  age: number;
  appareil: string;
  marque: string;
  derniereVisite: string;
  prochaineVisite?: string;
  status: PatientStatus;
  oreille: "binaural" | "OD" | "OG";
  mutuelle?: string;
}

interface StoredPatient {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  telephone: string;
  email?: string;
  mutuelle?: string;
  notes?: string;
  createdAt: string;
}

type MarqueFilter = "Tous" | "Phonak" | "Oticon" | "Starkey" | "Widex" | "ReSound" | "Signia";

const STATUS_META: Record<PatientStatus, { label: string; color: string; bg: string; dot: string }> = {
  suivi:          { label: "Suivi actif",           color: "#10b981", bg: "rgba(16,185,129,0.10)",  dot: "" },
  controle:       { label: "Contrôle prévu",        color: "#00C98A", bg: "rgba(0,201,138,0.10)",  dot: "" },
  renouvellement: { label: "Renouvellement proche", color: "#f59e0b", bg: "rgba(245,158,11,0.10)", dot: "" },
};

/* ── Mock patients ────────────────────────────────────────────────────────── */
const MOCK_PATIENTS: Patient[] = [
  {
    id: "jean-paul-moreau",
    nom: "Moreau", prenom: "Jean-Paul", age: 72,
    appareil: "Evolv AI 2400", marque: "Starkey",
    derniereVisite: "Aujourd'hui", prochaineVisite: "23 juin 2026",
    status: "suivi", oreille: "binaural", mutuelle: "Harmonie Mutuelle",
  },
  {
    id: "simone-lefranc",
    nom: "Lefranc", prenom: "Simone", age: 68,
    appareil: "Lumity 90", marque: "Phonak",
    derniereVisite: "15 mars 2026", prochaineVisite: "15 sep. 2026",
    status: "suivi", oreille: "binaural", mutuelle: "MGEN",
  },
  {
    id: "andre-bernin",
    nom: "Bernin", prenom: "André", age: 75,
    appareil: "Intent 1", marque: "Oticon",
    derniereVisite: "10 mars 2026", prochaineVisite: "28 mars 2026",
    status: "controle", oreille: "binaural", mutuelle: "MAIF Santé",
  },
  {
    id: "marie-dupont",
    nom: "Dupont", prenom: "Marie", age: 58,
    appareil: "Moment Sheer", marque: "Widex",
    derniereVisite: "Aujourd'hui", prochaineVisite: undefined,
    status: "suivi", oreille: "OD", mutuelle: "Mutuelle Générale",
  },
  {
    id: "robert-chatel",
    nom: "Chatel", prenom: "Robert", age: 81,
    appareil: "Pure Charge&Go AX", marque: "Signia",
    derniereVisite: "5 mars 2026", prochaineVisite: "5 sept. 2026",
    status: "renouvellement", oreille: "binaural", mutuelle: "MGEN",
  },
  {
    id: "isabelle-morin",
    nom: "Morin", prenom: "Isabelle", age: 65,
    appareil: "Nexia", marque: "ReSound",
    derniereVisite: "20 fév. 2026", prochaineVisite: "20 août 2026",
    status: "suivi", oreille: "binaural", mutuelle: "April Santé",
  },
];

const MARQUE_FILTERS: MarqueFilter[] = ["Tous", "Phonak", "Oticon", "Starkey", "Widex", "ReSound", "Signia"];
const LS_KEY = "thor_pro_audition_patients";

const AVATAR_COLORS = [
  ACCENT, "#00C98A", "#6366f1", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4",
];
function avatarColor(nom: string, prenom: string): string {
  const s = nom + prenom;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initials(prenom: string, nom: string) {
  return ((prenom[0] ?? "") + (nom[0] ?? "")).toUpperCase();
}

/* ── Icons ───────────────────────────────────────────────────────────────── */
function IconSearch({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function IconGrid({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function IconList({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}
function IconEar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8.5a6 6 0 1 1 11.93 1c-.17 2.27-.77 3.88-2.43 5.5-1.62 1.58-1.93 3.22-1.93 4.5H12" />
      <path d="M8.5 11.5a3.5 3.5 0 1 1 5.16-.5" />
      <circle cx="12" cy="20" r="1" />
    </svg>
  );
}
function IconClipboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}

/* ── Modal form ──────────────────────────────────────────────────────────── */
interface NewPatientForm {
  nom: string;
  prenom: string;
  dateNaissance: string;
  telephone: string;
  email: string;
  mutuelle: string;
  notes: string;
}

const EMPTY_FORM: NewPatientForm = {
  nom: "", prenom: "", dateNaissance: "", telephone: "", email: "", mutuelle: "", notes: "",
};

const modalInputBase: CSSProperties = {
  ...glassSubtle,
  width: "100%",
  borderRadius: "10px",
  padding: "8px 12px",
  fontSize: "14px",
  color: "#1e293b",
  outline: "none",
  background: "var(--glass-strong-bg)",
  boxSizing: "border-box",
};

const modalLabelStyle: CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 600,
  color: "#64748b",
  marginBottom: "4px",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

function NouveauPatientModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (p: StoredPatient) => void;
}) {
  const [form, setForm] = useState<NewPatientForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof NewPatientForm, string>>>({});

  function set(field: keyof NewPatientForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof NewPatientForm, string>> = {};
    if (!form.nom.trim())       e.nom = "Nom requis";
    if (!form.prenom.trim())    e.prenom = "Prénom requis";
    if (!form.telephone.trim()) e.telephone = "Téléphone requis";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const now = new Date().toISOString();
    const p: StoredPatient = {
      id: Date.now().toString(),
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      dateNaissance: form.dateNaissance,
      telephone: form.telephone.trim(),
      email: form.email.trim() || undefined,
      mutuelle: form.mutuelle.trim() || undefined,
      notes: form.notes.trim() || undefined,
      createdAt: now,
    };
    onSave(p);
  }

  function Field({
    label, field, type = "text", placeholder,
  }: {
    label: string;
    field: keyof NewPatientForm;
    type?: string;
    placeholder?: string;
  }) {
    return (
      <div>
        <label style={modalLabelStyle}>{label}</label>
        <input
          type={type}
          value={form[field]}
          onChange={e => set(field, e.target.value)}
          placeholder={placeholder}
          style={{
            ...modalInputBase,
            border: errors[field] ? "1px solid rgba(239,68,68,0.60)" : modalInputBase.border,
          }}
        />
        {errors[field] && (
          <p style={{ fontSize: "11px", color: "#ef4444", marginTop: "3px" }}>{errors[field]}</p>
        )}
      </div>
    );
  }

  return (
    <DraggableWindow
      title="Nouveau patient"
      onClose={onClose}
      defaultWidth={580}
      defaultHeight={560}
    >
      <div style={{ background: "var(--glass-card-bg)", padding: "24px" }}>
        <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "16px" }}>Créer un dossier audiologique</p>

        <div style={{ display: "grid", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
              Identité
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Field label="Nom *" field="nom" placeholder="Moreau" />
              <Field label="Prénom *" field="prenom" placeholder="Jean-Paul" />
              <Field label="Date de naissance" field="dateNaissance" type="date" />
            </div>
          </div>

          <div>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
              Contact &amp; Mutuelle
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Field label="Téléphone *" field="telephone" type="tel" placeholder="06 12 34 56 78" />
              <Field label="Email" field="email" type="email" placeholder="jean@email.com" />
              <Field label="Mutuelle" field="mutuelle" placeholder="MGEN, Harmonie…" />
            </div>
          </div>

          <div>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
              Notes
            </div>
            <label style={modalLabelStyle}>Notes initiales</label>
            <textarea
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              placeholder="Antécédents auditifs, port d'appareil antérieur…"
              rows={3}
              style={{ ...modalInputBase, resize: "vertical", fontFamily: "inherit" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "24px" }}>
          <button
            onClick={onClose}
            style={{ ...glassSubtle, borderRadius: "999px", padding: "10px 20px", fontSize: "14px", fontWeight: 600, color: "#64748b", cursor: "pointer" }}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            style={{
              background: ACCENT,
              boxShadow: "0 4px 12px rgba(0,201,138,0.30)",
              borderRadius: "999px", padding: "10px 24px",
              fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer", border: "none",
            }}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
}

/* ── Patient Card (grid view) ────────────────────────────────────────────── */
function PatientCard({ p }: { p: Patient }) {
  const sm = STATUS_META[p.status];
  const color = avatarColor(p.nom, p.prenom);
  const ini = initials(p.prenom, p.nom);
  return (
    <div
      style={{
        ...glass,
        borderRadius: 18,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.10)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = glass.boxShadow as string; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
    >
      <div style={{ padding: "20px 20px 14px", display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{
          width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
          background: color, display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: 700, fontSize: 15, boxShadow: `0 2px 8px ${color}44`,
        }}>
          {ini}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {p.prenom} {p.nom}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>{p.age} ans</div>
          <div style={{ marginTop: 6 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: sm.color, background: sm.bg, borderRadius: 8, padding: "3px 8px" }}>
              {sm.dot} {sm.label}
            </span>
          </div>
        </div>
      </div>

      {/* Appareil */}
      <div style={{ padding: "0 20px 12px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{p.marque} {p.appareil}</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
          <IconEar className="inline w-3 h-3 mr-1 opacity-60" />
          {p.oreille === "binaural" ? "Binaural" : p.oreille}
          {p.mutuelle ? ` · ${p.mutuelle}` : ""}
        </div>
      </div>

      {/* Visites */}
      <div style={{ padding: "10px 20px", borderTop: "1px solid rgba(226,232,240,0.7)", fontSize: 12, color: "#64748b", display: "flex", flexDirection: "column", gap: 4 }}>
        <span>Dernière visite : <strong style={{ color: "#475569" }}>{p.derniereVisite}</strong></span>
        {p.prochaineVisite && (
          <span style={{ color: ACCENT, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            <IconCalendar className="w-3 h-3" />
            Prochain : {p.prochaineVisite}
          </span>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: "10px 20px 16px", display: "flex", gap: 8 }}>
        <Link
          href={`/clair-audition/pro/patients/${p.id}`}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", borderRadius: 10, background: ACCENT, color: "white", fontSize: 12.5, fontWeight: 600, textDecoration: "none", boxShadow: "0 2px 8px rgba(0,201,138,0.25)" }}
        >
          <IconClipboard className="w-3.5 h-3.5" />
          Voir fiche
        </Link>
        <Link
          href={`/clair-audition/pro/agenda`}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", borderRadius: 10, ...glassSubtle, color: "#6366f1", fontSize: 12.5, fontWeight: 600, textDecoration: "none" }}
        >
          + RDV
        </Link>
      </div>
    </div>
  );
}

/* ── Patient Row (list view) ─────────────────────────────────────────────── */
function PatientRow({ p }: { p: Patient }) {
  const sm = STATUS_META[p.status];
  const color = avatarColor(p.nom, p.prenom);
  const ini = initials(p.prenom, p.nom);

  return (
    <div
      style={{
        ...glass,
        borderRadius: 14,
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        transition: "box-shadow 0.15s, transform 0.15s",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 28px rgba(0,0,0,0.09)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = glass.boxShadow as string; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
    >
      {/* Avatar */}
      <div style={{ width: 40, height: 40, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "white", fontWeight: 700, fontSize: 13, boxShadow: `0 2px 8px ${color}44` }}>
        {ini}
      </div>

      {/* Nom + âge + statut */}
      <div style={{ flex: "0 0 190px", minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.prenom} {p.nom}</div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{p.age} ans</div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, color: sm.color, background: sm.bg, borderRadius: 6, padding: "2px 7px", marginTop: 4 }}>
          {sm.dot} {sm.label}
        </span>
      </div>

      {/* Appareil */}
      <div style={{ flex: "0 0 200px", minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.marque} {p.appareil}</div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}>
          <IconEar className="w-3 h-3 opacity-60" />
          {p.oreille === "binaural" ? "Binaural" : p.oreille}
        </div>
      </div>

      {/* Mutuelle */}
      <div style={{ flex: "0 0 150px", minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 1 }}>Mutuelle</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.mutuelle ?? "—"}</div>
      </div>

      {/* Dernière visite + prochain RDV */}
      <div style={{ flex: "0 0 150px", minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 1 }}>Dernière visite</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{p.derniereVisite}</div>
        {p.prochaineVisite && (
          <div style={{ fontSize: 11, color: ACCENT, marginTop: 3, display: "flex", alignItems: "center", gap: 3 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            {p.prochaineVisite}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexShrink: 0 }}>
        <Link href={`/clair-audition/pro/patients/${p.id}`}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 9, background: ACCENT, color: "white", fontSize: 12, fontWeight: 600, textDecoration: "none", boxShadow: "0 2px 8px rgba(0,201,138,0.22)", whiteSpace: "nowrap" }}>
          Voir fiche
        </Link>
        <Link href={`/clair-audition/pro/agenda`}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 9, ...glassSubtle, color: "#6366f1", fontSize: 12, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
          + RDV
        </Link>
      </div>
    </div>
  );
}

/* ── Stored patient row ──────────────────────────────────────────────────── */
function StoredPatientRow({ p }: { p: StoredPatient }) {
  const age = p.dateNaissance
    ? (() => {
        const b = new Date(p.dateNaissance);
        const now = new Date();
        let a = now.getFullYear() - b.getFullYear();
        const m = now.getMonth() - b.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
        return a;
      })()
    : null;
  const color = avatarColor(p.nom, p.prenom);
  const ini = initials(p.prenom, p.nom);

  return (
    <div style={{ ...glass, borderRadius: 14, padding: "12px 20px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "white", fontWeight: 700, fontSize: 12 }}>
        {ini}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{p.prenom} {p.nom}</div>
        {age !== null && <div style={{ fontSize: 11, color: "#94a3b8" }}>{age} ans</div>}
        {p.mutuelle && <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.mutuelle}</div>}
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: ACCENT, background: `rgba(0,201,138,0.10)`, border: `1px solid rgba(0,201,138,0.25)`, borderRadius: 6, padding: "2px 8px", whiteSpace: "nowrap" }}>
        Nouveau
      </span>
      <div style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>
        Créé le {new Date(p.createdAt).toLocaleDateString("fr-FR")}
      </div>
      <Link href={`/clair-audition/pro/patients/${p.id}`}
        style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 9, background: ACCENT, color: "white", fontSize: 12, fontWeight: 600, textDecoration: "none", flexShrink: 0 }}>
        Voir fiche
      </Link>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function PatientsAuditionPage() {
  const [query, setQuery]               = useState("");
  const [marqueFilter, setMarqueFilter] = useState<MarqueFilter>("Tous");
  const [showModal, setShowModal]       = useState(false);
  const [storedPatients, setStoredPatients] = useState<StoredPatient[]>([]);
  const [viewMode, setViewMode]         = useState<"grid" | "list">("list");

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) setStoredPatients(JSON.parse(raw) as StoredPatient[]);
      } catch { /* ignore */ }
    }
  }, []);

  function handleSaveNewPatient(p: StoredPatient) {
    const updated = [p, ...storedPatients];
    setStoredPatients(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
    }
    setShowModal(false);
  }

  const filtered = MOCK_PATIENTS.filter(p => {
    const q = query.toLowerCase();
    const matchQ = `${p.prenom} ${p.nom} ${p.marque} ${p.appareil}`.toLowerCase().includes(q);
    const matchM = marqueFilter === "Tous" || p.marque === marqueFilter;
    return matchQ && matchM;
  });

  const totalCount  = MOCK_PATIENTS.length + storedPatients.length;
  const renouvCount = MOCK_PATIENTS.filter(p => p.status === "renouvellement").length;

  // Counts per marque (filter pills)
  const marqueCounts: Record<MarqueFilter, number> = MARQUE_FILTERS.reduce((acc, f) => {
    acc[f] = f === "Tous" ? MOCK_PATIENTS.length : MOCK_PATIENTS.filter(p => p.marque === f).length;
    return acc;
  }, {} as Record<MarqueFilter, number>);

  // Status counts (header inline)
  const statusCounts: Record<PatientStatus, number> = (Object.keys(STATUS_META) as PatientStatus[])
    .reduce((acc, s) => {
      acc[s] = MOCK_PATIENTS.filter(p => p.status === s).length;
      return acc;
    }, {} as Record<PatientStatus, number>);

  return (
    <div className="w-full space-y-6">
      {/* ── Header ── */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold text-slate-800 tracking-tight leading-none m-0 h-title">
            Patients
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 mb-0 flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold tabular-nums" style={{ color: ACCENT }}>{totalCount} patients</span>
            {(Object.keys(STATUS_META) as PatientStatus[]).map(s => {
              const meta = STATUS_META[s];
              const c = statusCounts[s];
              if (c === 0) return null;
              return (
                <span key={s} className="inline-flex items-center gap-1.5 ml-1">
                  <span className="text-slate-500">·</span>
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ background: meta.color, boxShadow: `0 0 0 2px ${meta.bg}` }}
                  />
                  <span className="tabular-nums font-medium" style={{ color: meta.color }}>{c}</span>
                  <span className="text-slate-500">{meta.label.toLowerCase()}</span>
                </span>
              );
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle (segmented, h-9) */}
          <div
            className="inline-flex items-center h-9 p-0.5 rounded-[10px]"
            style={glassSubtle}
            role="group"
            aria-label="Mode d'affichage"
          >
            {([["list", IconList, "Liste"], ["grid", IconGrid, "Grille"]] as const).map(([mode, Icon, label]) => {
              const active = viewMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  title={label}
                  aria-label={label}
                  aria-pressed={active}
                  className="grid place-items-center h-8 w-9 rounded-lg cursor-pointer transition-all duration-150"
                  style={{
                    background: active ? ACCENT : "transparent",
                    color: active ? "#fff" : "#94a3b8",
                    boxShadow: active ? "0 2px 6px rgba(0,201,138,0.30)" : "none",
                    border: "none",
                  }}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] text-sm font-semibold text-white cursor-pointer transition-opacity hover:opacity-90"
            style={{
              background: ACCENT,
              boxShadow: "0 2px 10px rgba(0,201,138,0.30)",
              border: "none",
            }}
          >
            <IconPlus className="w-4 h-4" />
            Nouveau patient
          </button>
        </div>
      </header>

      {/* ── Toolbar : recherche + filtres marque (1 ligne, h-9) ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <IconSearch
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Effacer la recherche"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 grid place-items-center h-6 w-6 rounded-md text-slate-500 hover:text-slate-600 transition-colors"
              style={{ background: "transparent", border: "none", cursor: "pointer" }}
            >
              <IconX className="w-3.5 h-3.5" />
            </button>
          )}
          <input
            type="text"
            placeholder="Rechercher par nom, appareil, marque…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full h-9 rounded-[10px] text-sm outline-none transition-all"
            style={{
              padding: query ? "0 36px 0 38px" : "0 12px 0 38px",
              border: "1px solid var(--glass-border)",
              background: "var(--glass-strong-bg)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              color: "var(--text)",
              boxSizing: "border-box",
            } as CSSProperties}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(0,201,138,0.45)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,201,138,0.12)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {MARQUE_FILTERS.map(f => {
            const active = marqueFilter === f;
            const count  = marqueCounts[f];
            return (
              <button
                key={f}
                onClick={() => setMarqueFilter(f)}
                aria-pressed={active}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all duration-150"
                style={{
                  border: active ? "1px solid transparent" : "1px solid var(--glass-border)",
                  background: active
                    ? ACCENT
                    : "var(--glass-strong-bg)",
                  color: active ? "#fff" : "var(--muted)",
                  boxShadow: active ? "0 2px 8px rgba(0,201,138,0.25)" : "none",
                }}
              >
                {f}
                <span
                  className="text-[11px] font-bold tabular-nums px-1.5 py-0 rounded-md leading-[18px]"
                  style={{
                    background: active ? "rgba(255,255,255,0.22)" : "var(--glass-subtle-bg)",
                    color: active ? "#fff" : "var(--muted)",
                    minWidth: 22,
                    textAlign: "center",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Nouveaux patients (localStorage) */}
      {storedPatients.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-3">
            Patients récemment créés ({storedPatients.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {storedPatients.map(p => (
              <StoredPatientRow key={p.id} p={p} />
            ))}
          </div>
        </div>
      )}

      {/* Column headers in list mode */}
      {viewMode === "list" && filtered.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 20px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          <div style={{ width: 40, flexShrink: 0 }} />
          <div style={{ flex: "0 0 190px" }}>Patient</div>
          <div style={{ flex: "0 0 200px" }}>Appareillage</div>
          <div style={{ flex: "0 0 150px" }}>Mutuelle</div>
          <div style={{ flex: "0 0 150px" }}>Visites</div>
          <div style={{ marginLeft: "auto" }}>Actions</div>
        </div>
      )}

      {/* Patient list/grid */}
      {filtered.length === 0 ? (
        <div className="rounded-[var(--radius-large)] p-10 text-center text-sm text-slate-500" style={glass}>
          Aucun patient ne correspond à votre recherche.
        </div>
      ) : viewMode === "list" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(p => (
            <PatientRow key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(p => (
            <PatientCard key={p.id} p={p} />
          ))}
        </div>
      )}

      {showModal && (
        <NouveauPatientModal onClose={() => setShowModal(false)} onSave={handleSaveNewPatient} />
      )}
    </div>
  );
}
