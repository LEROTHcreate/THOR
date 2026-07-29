"use client";

import React, { CSSProperties, useEffect, useRef, useState } from "react";
import {
  type StoreConfig,
  DEFAULT_STORE_CONFIG,
} from "@/lib/storeConfig";
import {
  loadUsers,
  saveUsers,
  loadCurrentUserId,
  generateId,
  getInitials,
  ROLE_COLORS,
  type ProUser,
  type UserRole,
} from "@/lib/users";

// ── Design tokens ─────────────────────────────────────────────────────────────
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

// ── Color helpers ─────────────────────────────────────────────────────────────
function darkenHex(hex: string, factor: number): string {
  const clean = hex.replace("#", "");
  const n = parseInt(clean.length === 3
    ? clean.split("").map(c => c + c).join("")
    : clean, 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - factor)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - factor)));
  const b = Math.max(0, Math.round((n & 255) * (1 - factor)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function mkAccentStyle(color: string): CSSProperties {
  return {
    background: `linear-gradient(135deg, ${color}, ${darkenHex(color, 0.15)})`,
    boxShadow: `0 2px 8px ${color}44`,
  };
}

// ── Preset colors ─────────────────────────────────────────────────────────────
const PRESET_COLORS = [
  { label: "Bleu (défaut)", value: "#2D8CFF" },
  { label: "Indigo",        value: "#6366F1" },
  { label: "Violet",        value: "#8B5CF6" },
  { label: "Rose",          value: "#EC4899" },
  { label: "Rouge",         value: "#EF4444" },
  { label: "Orange",        value: "#F59E0B" },
  { label: "Émeraude",      value: "#10B981" },
  { label: "Teal",          value: "#14B8A6" },
  { label: "Cyan",          value: "#06B6D4" },
  { label: "Vert",          value: "#22C55E" },
  { label: "Slate",         value: "#64748B" },
  { label: "Noir",          value: "#1E293B" },
];

// ── Coefficients config ───────────────────────────────────────────────────────
type CoeffKey = "verres-progressifs" | "verres-simples" | "montures-optiques" | "montures-solaires" | "lentilles-souples" | "lentilles-rigides" | "accessoires";

const COEFF_ROWS: { key: CoeffKey; label: string; marketMin: number; marketAvg: number }[] = [
  { key: "verres-progressifs", label: "Verres progressifs",  marketMin: 2.8, marketAvg: 3.2 },
  { key: "verres-simples",     label: "Verres simples",      marketMin: 2.5, marketAvg: 3.0 },
  { key: "montures-optiques",  label: "Montures optiques",   marketMin: 2.8, marketAvg: 3.2 },
  { key: "montures-solaires",  label: "Montures solaires",   marketMin: 2.5, marketAvg: 3.0 },
  { key: "lentilles-souples",  label: "Lentilles souples",   marketMin: 1.8, marketAvg: 2.2 },
  { key: "lentilles-rigides",  label: "Lentilles rigides",   marketMin: 2.5, marketAvg: 3.0 },
  { key: "accessoires",        label: "Accessoires",         marketMin: 2.2, marketAvg: 2.8 },
];

// ── Agenda ────────────────────────────────────────────────────────────────────
interface DaySchedule {
  ouvert: boolean;
  ouverture: string;
  fermeture: string;
  pauseActive: boolean;
  pauseDebut: string;
  pauseFin: string;
}
type WeekSchedule = Record<string, DaySchedule>;

const DAYS = [
  { key: "lundi",    label: "Lundi"    },
  { key: "mardi",    label: "Mardi"    },
  { key: "mercredi", label: "Mercredi" },
  { key: "jeudi",    label: "Jeudi"    },
  { key: "vendredi", label: "Vendredi" },
  { key: "samedi",   label: "Samedi"   },
  { key: "dimanche", label: "Dimanche" },
];

const DEFAULT_DAY_PAUSE = { pauseActive: false, pauseDebut: "12:00", pauseFin: "14:00" };
const DEFAULT_SCHEDULE: WeekSchedule = {
  lundi:    { ouvert: true,  ouverture: "09:00", fermeture: "19:00", ...DEFAULT_DAY_PAUSE },
  mardi:    { ouvert: true,  ouverture: "09:00", fermeture: "19:00", ...DEFAULT_DAY_PAUSE },
  mercredi: { ouvert: true,  ouverture: "09:00", fermeture: "19:00", ...DEFAULT_DAY_PAUSE },
  jeudi:    { ouvert: true,  ouverture: "09:00", fermeture: "19:00", ...DEFAULT_DAY_PAUSE },
  vendredi: { ouvert: true,  ouverture: "09:00", fermeture: "19:00", ...DEFAULT_DAY_PAUSE },
  samedi:   { ouvert: true,  ouverture: "09:00", fermeture: "13:00", ...DEFAULT_DAY_PAUSE },
  dimanche: { ouvert: false, ouverture: "09:00", fermeture: "18:00", ...DEFAULT_DAY_PAUSE },
};

const AGENDA_KEY = "thor_pro_parametres_agenda";

// ── CSV helpers ───────────────────────────────────────────────────────────────
function readJSONArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    alert("Aucune donnée à exporter.");
    return;
  }
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(";"),
    ...rows.map((r) =>
      headers.map((h) => {
        const v = r[h] ?? "";
        const str = String(v).replace(/"/g, '""');
        return `"${str}"`;
      }).join(";")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Settings sections ─────────────────────────────────────────────────────────
type SettingsSection = "compte" | "apparence" | "tarification" | "equipe" | "agenda" | "notifications" | "donnees";

interface SectionMeta {
  id: SettingsSection;
  label: string;
  description: string;
  Icon: React.FC<{ className?: string; style?: CSSProperties }>;
}

function IconStore({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l1-5h16l1 5" />
      <path d="M21 9H3v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9Z" />
      <path d="M9 9v5a3 3 0 0 0 6 0V9" />
    </svg>
  );
}
function IconPalette({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="8.5" cy="13.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="13.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <path d="M20 12c0 1.1-.9 2-2 2h-2l-2 3-2-3H8c-1.1 0-2-.9-2-2" />
    </svg>
  );
}
function IconCoin({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v2M12 16v2M9.5 9.5C9.5 8.4 10.6 7.5 12 7.5s2.5.9 2.5 2-.9 1.8-2.5 2-2.5.9-2.5 2 1.1 2 2.5 2 2.5-.9 2.5-2" />
    </svg>
  );
}
function IconTeam({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  );
}
function IconCalendar2({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function IconBell({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function IconDatabase({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v4c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path d="M3 9v4c0 1.66 4.03 3 9 3s9-1.34 9-3V9" />
      <path d="M3 13v4c0 1.66 4.03 3 9 3s9-1.34 9-3v-4" />
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

const SECTIONS: SectionMeta[] = [
  { id: "compte",        label: "Compte",        description: "Infos du cabinet",       Icon: IconStore     },
  { id: "apparence",     label: "Apparence",      description: "Couleur & thème",        Icon: IconPalette   },
  { id: "tarification",  label: "Tarification",   description: "Coefficients & TVA",     Icon: IconCoin      },
  { id: "equipe",        label: "Équipe",         description: "Membres & accès",        Icon: IconTeam      },
  { id: "agenda",        label: "Agenda",         description: "Horaires & RDV",         Icon: IconCalendar2 },
  { id: "notifications", label: "Notifications",  description: "Alertes & rappels",      Icon: IconBell      },
  { id: "donnees",       label: "Données",        description: "Export & réinitialisation", Icon: IconDatabase },
];

// ── Shared UI ─────────────────────────────────────────────────────────────────
function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div style={glass} className={`rounded-2xl p-6 ${className ?? ""}`}>
      {children}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? label}
        className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20"
      />
    </div>
  );
}

function SavedBadge() {
  return (
    <span className="flex items-center gap-1.5 text-sm font-medium text-[#10b981]">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M20 6 9 17l-5-5" />
      </svg>
      Sauvegardé
    </span>
  );
}

// ── Section: Compte ───────────────────────────────────────────────────────────
function SectionCompte({
  storeConfig, onStoreConfigChange,
}: {
  storeConfig: StoreConfig;
  onStoreConfigChange: (c: StoreConfig) => void;
}) {
  const [config, setConfig] = useState<StoreConfig>(storeConfig);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const signatureRef = useRef<HTMLInputElement>(null);
  const cachetRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setConfig(storeConfig); }, [storeConfig]);

  function set(field: keyof StoreConfig, value: string) {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }
  function handleSave() {
    onStoreConfigChange(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }
  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setConfig((prev) => ({ ...prev, logo: result }));
      setSaved(false);
    };
    reader.readAsDataURL(file);
  }
  function handleImageFile(field: "signatureBase64" | "cachetBase64", e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setConfig((prev) => ({ ...prev, [field]: reader.result as string }));
      setSaved(false);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionCard>
        <h2 className="mb-5 text-base font-semibold text-slate-800">Informations du cabinet</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Nom du cabinet" value={config.nom} onChange={(v) => set("nom", v)} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Adresse" value={config.adresse ?? ""} onChange={(v) => set("adresse", v)} />
          </div>
          <Field label="Code postal" value={config.codePostal ?? ""} onChange={(v) => set("codePostal", v)} />
          <Field label="Ville" value={config.ville ?? ""} onChange={(v) => set("ville", v)} />
          <Field label="Téléphone" value={config.telephone ?? ""} onChange={(v) => set("telephone", v)} type="tel" />
          <Field label="Email" value={config.email ?? ""} onChange={(v) => set("email", v)} type="email" />
          <Field label="SIRET" value={config.siret ?? ""} onChange={(v) => set("siret", v)} />
          <Field label="ADELI" value={config.adeli ?? ""} onChange={(v) => set("adeli", v)} />
          <Field label="RPPS" value={config.rpps ?? ""} onChange={(v) => set("rpps", v)} />
          <Field label="N° FINESS" value={config.finess ?? ""} onChange={(v) => set("finess", v)} />
        </div>
      </SectionCard>

      <SectionCard>
        <h2 className="mb-4 text-base font-semibold text-slate-800">Logo du cabinet</h2>
        <div className="flex items-center gap-5">
          <div
            className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-2xl overflow-hidden"
            style={
              config.logo
                ? { border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }
                : { background: "#2D8CFF", boxShadow: "0 2px 8px rgba(45,140,255,0.25)" }
            }
          >
            {config.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none">
                <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Choisir une image…
            </button>
            {config.logo && (
              <button
                onClick={() => { setConfig((p) => ({ ...p, logo: undefined })); setSaved(false); }}
                className="text-xs text-red-500 hover:text-red-700 transition text-left"
              >
                Supprimer le logo
              </button>
            )}
            <p className="text-[11px] text-slate-400">PNG, JPG ou SVG · max 2 Mo recommandé</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <h2 className="mb-1 text-base font-semibold text-slate-800">Signature &amp; Cachet</h2>
        <p className="mb-5 text-sm text-slate-500">Apposés automatiquement sur les factures et devis imprimés</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Nom du signataire" placeholder="ex : Nicolas Garnier — Gérant" value={config.signataire ?? ""} onChange={(v) => set("signataire", v)} />
          </div>
          <Field label="RPPS du signataire" value={config.signataireRPPS ?? ""} onChange={(v) => set("signataireRPPS", v)} />
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {/* Signature */}
          <div>
            <p className="mb-2 text-xs font-medium text-slate-600 uppercase tracking-wide">Signature</p>
            <div
              className="flex h-24 w-full items-center justify-center rounded-xl mb-2 overflow-hidden"
              style={{ border: "1.5px dashed rgba(99,102,241,0.35)", background: "rgba(99,102,241,0.04)" }}
            >
              {config.signatureBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={config.signatureBase64} alt="Signature" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-xs text-slate-400">Aucune signature</span>
              )}
            </div>
            <input ref={signatureRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageFile("signatureBase64", e)} />
            <div className="flex gap-2">
              <button
                onClick={() => signatureRef.current?.click()}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >Importer…</button>
              {config.signatureBase64 && (
                <button
                  onClick={() => { setConfig((p) => ({ ...p, signatureBase64: undefined })); setSaved(false); }}
                  className="text-xs text-red-500 hover:text-red-700 transition"
                >Supprimer</button>
              )}
            </div>
          </div>

          {/* Cachet */}
          <div>
            <p className="mb-2 text-xs font-medium text-slate-600 uppercase tracking-wide">Cachet / Tampon</p>
            <div
              className="flex h-24 w-full items-center justify-center rounded-xl mb-2 overflow-hidden"
              style={{ border: "1.5px dashed rgba(99,102,241,0.35)", background: "rgba(99,102,241,0.04)" }}
            >
              {config.cachetBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={config.cachetBase64} alt="Cachet" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-xs text-slate-400">Aucun cachet</span>
              )}
            </div>
            <input ref={cachetRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageFile("cachetBase64", e)} />
            <div className="flex gap-2">
              <button
                onClick={() => cachetRef.current?.click()}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >Importer…</button>
              {config.cachetBase64 && (
                <button
                  onClick={() => { setConfig((p) => ({ ...p, cachetBase64: undefined })); setSaved(false); }}
                  className="text-xs text-red-500 hover:text-red-700 transition"
                >Supprimer</button>
              )}
            </div>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-slate-400">PNG, JPG ou SVG · fond transparent recommandé</p>
      </SectionCard>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: "#6366f1" }}
        >
          Enregistrer
        </button>
        {saved && <SavedBadge />}
      </div>
    </div>
  );
}

// ── Section: Apparence ────────────────────────────────────────────────────────
function SectionApparence({
  storeConfig, onStoreConfigChange, accentColor,
}: {
  storeConfig: StoreConfig;
  onStoreConfigChange: (c: StoreConfig) => void;
  accentColor: string;
}) {
  const [chosen, setChosen] = useState(accentColor);

  useEffect(() => { setChosen(accentColor); }, [accentColor]);

  function handleApply() {
    onStoreConfigChange({ ...storeConfig, accentColor: chosen });
  }

  const previewAccentStyle = mkAccentStyle(chosen);

  return (
    <div className="flex flex-col gap-6">
      <SectionCard>
        <h2 className="mb-1 text-base font-semibold text-slate-800">Couleur principale</h2>
        <p className="mb-5 text-sm text-slate-500">Utilisée dans la navigation, les boutons et les badges</p>

        {/* Palette */}
        <div className="flex flex-wrap gap-2 mb-5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.value}
              title={c.label}
              onClick={() => setChosen(c.value)}
              className="relative h-8 w-8 rounded-full transition-transform hover:scale-110 focus:outline-none"
              style={{ background: c.value, boxShadow: chosen === c.value ? `0 0 0 3px white, 0 0 0 5px ${c.value}` : "none" }}
              aria-label={c.label}
            />
          ))}
        </div>

        {/* Custom color picker */}
        <div className="flex items-center gap-3 mb-6">
          <label className="text-sm font-medium text-slate-600">Couleur personnalisée :</label>
          <div className="relative">
            <input
              type="color"
              value={chosen}
              onChange={(e) => setChosen(e.target.value)}
              className="h-9 w-16 cursor-pointer rounded-lg border border-slate-200 p-0.5"
            />
          </div>
          <span className="text-sm font-mono text-slate-500">{chosen}</span>
        </div>

        {/* Live preview */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Aperçu</p>
          <div
            className="rounded-2xl p-4"
            style={{ background: "rgba(248,250,252,0.8)", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-start gap-3">
              {/* Mini sidebar */}
              <div
                className="w-36 rounded-xl py-3 px-2 flex flex-col gap-1"
                style={{ background: "var(--glass-strong-bg)", border: "1px solid rgba(255,255,255,0.8)" }}
              >
                {/* Logo area */}
                <div className="flex items-center gap-2 px-1 mb-2">
                  <div
                    className="h-7 w-7 rounded-lg grid place-items-center flex-shrink-0"
                    style={previewAccentStyle}
                  >
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none">
                      <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" stroke="currentColor" strokeWidth="1.8" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-700 truncate">{storeConfig.nom}</span>
                </div>
                {/* Active nav item */}
                <div
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5"
                  style={previewAccentStyle}
                >
                  <div className="h-4 w-4 rounded bg-white/20" />
                  <span className="text-[10px] font-medium text-white">Tableau de bord</span>
                </div>
                {/* Inactive nav items */}
                {["Agenda", "Patients", "Devis"].map((item) => (
                  <div key={item} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5">
                    <div className="h-4 w-4 rounded" style={{ background: `${chosen}22` }} />
                    <span className="text-[10px] font-medium text-slate-500">{item}</span>
                  </div>
                ))}
              </div>
              {/* Main area */}
              <div className="flex-1 flex flex-col gap-2 pt-1">
                <div className="flex gap-2">
                  <div
                    className="rounded-lg px-3 py-1.5 text-[10px] font-semibold text-white"
                    style={previewAccentStyle}
                  >
                    Bouton principal
                  </div>
                  <div
                    className="rounded-lg px-3 py-1.5 text-[10px] font-semibold"
                    style={{ background: `${chosen}18`, color: chosen }}
                  >
                    Secondaire
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500">Badge messagerie :</span>
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white min-w-[16px] text-center"
                    style={{ background: chosen }}
                  >
                    3
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleApply}
          className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={previewAccentStyle}
        >
          Appliquer cette couleur
        </button>
      </SectionCard>
    </div>
  );
}

// ── Section: Tarification ─────────────────────────────────────────────────────
function SectionTarification({
  storeConfig, onStoreConfigChange,
}: {
  storeConfig: StoreConfig;
  onStoreConfigChange: (c: StoreConfig) => void;
}) {
  const defaultCoeffs = DEFAULT_STORE_CONFIG.coefficients ?? {};
  const [coeffs, setCoeffs] = useState<Record<CoeffKey, number>>({
    "verres-progressifs": storeConfig.coefficients?.["verres-progressifs"] ?? defaultCoeffs["verres-progressifs"] ?? 3.2,
    "verres-simples":     storeConfig.coefficients?.["verres-simples"]     ?? defaultCoeffs["verres-simples"]     ?? 3.0,
    "montures-optiques":  storeConfig.coefficients?.["montures-optiques"]  ?? defaultCoeffs["montures-optiques"]  ?? 3.2,
    "montures-solaires":  storeConfig.coefficients?.["montures-solaires"]  ?? defaultCoeffs["montures-solaires"]  ?? 3.0,
    "lentilles-souples":  storeConfig.coefficients?.["lentilles-souples"]  ?? defaultCoeffs["lentilles-souples"]  ?? 2.2,
    "lentilles-rigides":  storeConfig.coefficients?.["lentilles-rigides"]  ?? defaultCoeffs["lentilles-rigides"]  ?? 3.0,
    "accessoires":        storeConfig.coefficients?.["accessoires"]        ?? defaultCoeffs["accessoires"]        ?? 2.8,
  });
  const [mentions, setMentions] = useState(storeConfig.mentionsDevis ?? DEFAULT_STORE_CONFIG.mentionsDevis ?? "");
  const [tva, setTva] = useState<5.5 | 20>(storeConfig.tauxTVA ?? 20);
  const [savedCoeffs, setSavedCoeffs] = useState(false);
  const [savedGeneral, setSavedGeneral] = useState(false);

  useEffect(() => {
    const dc = DEFAULT_STORE_CONFIG.coefficients ?? {};
    setCoeffs({
      "verres-progressifs": storeConfig.coefficients?.["verres-progressifs"] ?? dc["verres-progressifs"] ?? 3.2,
      "verres-simples":     storeConfig.coefficients?.["verres-simples"]     ?? dc["verres-simples"]     ?? 3.0,
      "montures-optiques":  storeConfig.coefficients?.["montures-optiques"]  ?? dc["montures-optiques"]  ?? 3.2,
      "montures-solaires":  storeConfig.coefficients?.["montures-solaires"]  ?? dc["montures-solaires"]  ?? 3.0,
      "lentilles-souples":  storeConfig.coefficients?.["lentilles-souples"]  ?? dc["lentilles-souples"]  ?? 2.2,
      "lentilles-rigides":  storeConfig.coefficients?.["lentilles-rigides"]  ?? dc["lentilles-rigides"]  ?? 3.0,
      "accessoires":        storeConfig.coefficients?.["accessoires"]        ?? dc["accessoires"]        ?? 2.8,
    });
    setMentions(storeConfig.mentionsDevis ?? DEFAULT_STORE_CONFIG.mentionsDevis ?? "");
    setTva(storeConfig.tauxTVA ?? 20);
  }, [storeConfig]);

  function handleSaveCoeffs() {
    onStoreConfigChange({ ...storeConfig, coefficients: coeffs });
    setSavedCoeffs(true);
    setTimeout(() => setSavedCoeffs(false), 2500);
  }
  function handleResetCoeffs() {
    const dc = DEFAULT_STORE_CONFIG.coefficients ?? {};
    setCoeffs({
      "verres-progressifs": dc["verres-progressifs"] ?? 3.2,
      "verres-simples":     dc["verres-simples"]     ?? 3.0,
      "montures-optiques":  dc["montures-optiques"]  ?? 3.2,
      "montures-solaires":  dc["montures-solaires"]  ?? 3.0,
      "lentilles-souples":  dc["lentilles-souples"]  ?? 2.2,
      "lentilles-rigides":  dc["lentilles-rigides"]  ?? 3.0,
      "accessoires":        dc["accessoires"]        ?? 2.8,
    });
  }
  function handleSaveGeneral() {
    onStoreConfigChange({ ...storeConfig, mentionsDevis: mentions, tauxTVA: tva });
    setSavedGeneral(true);
    setTimeout(() => setSavedGeneral(false), 2500);
  }

  // Estimated margin based on avg market price
  const avgCoeff = Object.values(coeffs).reduce((a, b) => a + b, 0) / Object.values(coeffs).length;
  const estMargin = Math.round(((avgCoeff - 1) / avgCoeff) * 100);

  return (
    <div className="flex flex-col gap-6">
      <SectionCard>
        <h2 className="mb-1 text-base font-semibold text-slate-800">Coefficients par catégorie</h2>
        <p className="mb-5 text-sm text-slate-500">Ces coefficients s&apos;appliquent au prix d&apos;achat pour calculer le prix de vente conseillé.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">
                <th className="pb-2 text-left">Catégorie</th>
                <th className="pb-2 text-center w-24">Min marché</th>
                <th className="pb-2 text-center w-24">Moy marché</th>
                <th className="pb-2 text-center w-28">Votre coeff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {COEFF_ROWS.map(({ key, label, marketMin, marketAvg }) => (
                <tr key={key} className="hover:bg-slate-50/50 transition">
                  <td className="py-2.5 font-medium text-slate-700">{label}</td>
                  <td className="py-2.5 text-center text-slate-400">{marketMin.toFixed(1)}</td>
                  <td className="py-2.5 text-center text-slate-400">{marketAvg.toFixed(1)}</td>
                  <td className="py-2.5 text-center">
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="10"
                      value={coeffs[key]}
                      onChange={(e) => setCoeffs((prev) => ({ ...prev, [key]: parseFloat(e.target.value) || 1 }))}
                      className="w-20 rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-center text-sm text-slate-800 outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          className="mt-4 rounded-xl px-4 py-3 text-sm"
          style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}
        >
          <span className="font-medium text-[#10b981]">Marge brute estimée : ~{estMargin}%</span>
          <span className="text-slate-500 ml-2">sur la base de ces coefficients moyens</span>
        </div>

        <div className="mt-5 flex items-center gap-3 flex-wrap">
          <button
            onClick={handleSaveCoeffs}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "#6366f1" }}
          >
            Enregistrer les coefficients
          </button>
          <button
            onClick={handleResetCoeffs}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            Réinitialiser aux valeurs marché
          </button>
          {savedCoeffs && <SavedBadge />}
        </div>
      </SectionCard>

      <SectionCard>
        <h2 className="mb-4 text-base font-semibold text-slate-800">Mentions devis</h2>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Texte en bas de page des devis</label>
          <textarea
            value={mentions}
            onChange={(e) => setMentions(e.target.value)}
            rows={3}
            className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 resize-y"
          />
        </div>
      </SectionCard>

      <SectionCard>
        <h2 className="mb-4 text-base font-semibold text-slate-800">Taux de TVA</h2>
        <div className="flex gap-4">
          {([20, 5.5] as const).map((v) => (
            <label key={v} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tva"
                checked={tva === v}
                onChange={() => setTva(v)}
                className="accent-[#6366f1]"
              />
              <span className="text-sm font-medium text-slate-700">{v}%</span>
              {v === 20  && <span className="text-xs text-slate-400">(optique standard)</span>}
              {v === 5.5 && <span className="text-xs text-slate-400">(taux réduit — usage exceptionnel)</span>}
            </label>
          ))}
        </div>
      </SectionCard>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSaveGeneral}
          className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: "#6366f1" }}
        >
          Enregistrer mentions & TVA
        </button>
        {savedGeneral && <SavedBadge />}
      </div>
    </div>
  );
}

// ── Section: Équipe ───────────────────────────────────────────────────────────
const ALL_ROLES: UserRole[] = ["Gérant", "Optométriste", "Opticien", "Visagiste", "Assistant(e)"];

interface NewUserForm {
  nom: string; prenom: string; email: string; role: UserRole; password: string;
}

function RoleBadge({ role }: { role: UserRole }) {
  const color = ROLE_COLORS[role] ?? "#6366f1";
  return (
    <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white" style={{ background: color }}>
      {role}
    </span>
  );
}

function SectionEquipe({
  users: usersFromProps, onUsersChange,
}: {
  users: ProUser[];
  onUsersChange: (u: ProUser[]) => void;
}) {
  const [users, setUsers] = useState<ProUser[]>(usersFromProps);
  const [currentId, setCurrentId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const isCurrentUserGerant = users.find(u => u.id === currentId)?.role === "Gérant";
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<NewUserForm>({ nom: "", prenom: "", email: "", role: "Opticien", password: "" });

  useEffect(() => {
    setUsers(usersFromProps);
    setCurrentId(loadCurrentUserId());
  }, [usersFromProps]);

  function handleAddUser() {
    if (!form.nom.trim() || !form.prenom.trim()) return;
    const name = `${form.prenom.trim()} ${form.nom.trim()}`;
    const newUser: ProUser = {
      id: generateId(name),
      name,
      role: form.role,
      initials: getInitials(name),
      color: ROLE_COLORS[form.role],
      password: form.password,
      email: form.email || undefined,
    };
    const updated = [...users, newUser];
    setUsers(updated);
    saveUsers(updated);
    onUsersChange(updated);
    setShowModal(false);
    setForm({ nom: "", prenom: "", email: "", role: "Opticien", password: "" });
  }

  function handleDelete(id: string) {
    const updated = users.filter((u) => u.id !== id);
    setUsers(updated);
    saveUsers(updated);
    onUsersChange(updated);
    setConfirmDeleteId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">Membres de l&apos;équipe ({users.length})</h2>
        {isCurrentUserGerant && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "#6366f1" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Ajouter un utilisateur
          </button>
        )}
        {!isCurrentUserGerant && (
          <span className="text-xs text-slate-400 italic">Seul le Gérant peut ajouter des membres</span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {users.map((u) => (
          <div key={u.id} style={glass} className="flex items-center gap-4 rounded-2xl px-5 py-4">
            <div
              className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full text-sm font-bold text-white"
              style={{ background: u.color }}
            >
              {u.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800 truncate">{u.name}</span>
                {u.id === currentId && (
                  <span className="rounded-full bg-[#6366f1]/10 px-2 py-0.5 text-[10px] font-bold text-[#6366f1]">Vous</span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <RoleBadge role={u.role} />
                {u.email && <span className="text-xs text-slate-400 truncate">{u.email}</span>}
              </div>
            </div>
            {isCurrentUserGerant && u.id !== currentId && !u.isOwner && (
              confirmDeleteId === u.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Confirmer ?</span>
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="rounded-lg bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600"
                  >
                    Supprimer
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(u.id)}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  title="Supprimer"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                  </svg>
                </button>
              )
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div style={glass} className="w-full max-w-md rounded-2xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">Ajouter un utilisateur</h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <IconX className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Prénom" value={form.prenom} onChange={(v) => setForm((p) => ({ ...p, prenom: v }))} />
                <Field label="Nom" value={form.nom} onChange={(v) => setForm((p) => ({ ...p, nom: v }))} />
              </div>
              <Field label="Email" value={form.email} onChange={(v) => setForm((p) => ({ ...p, email: v }))} type="email" />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Rôle</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))}
                  className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20"
                >
                  {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <Field label="Mot de passe" value={form.password} onChange={(v) => setForm((p) => ({ ...p, password: v }))} type="password" />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAddUser}
                disabled={!form.nom.trim() || !form.prenom.trim()}
                className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                style={{ background: "#6366f1" }}
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section: Agenda ───────────────────────────────────────────────────────────

const GCAL_KEY = "thor_pro_gcal_connected";

function SectionAgenda() {
  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [duree, setDuree] = useState<string>("30");
  const [gcalConnected, setGcalConnected] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(AGENDA_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { schedule?: WeekSchedule; duree?: string };
        // Merge with defaults so new pause fields are always present
        const loaded = parsed.schedule ?? DEFAULT_SCHEDULE;
        const merged: WeekSchedule = {};
        for (const k of Object.keys(DEFAULT_SCHEDULE)) {
          merged[k] = { ...DEFAULT_SCHEDULE[k]!, ...loaded[k] };
        }
        setSchedule(merged);
        setDuree(parsed.duree ?? "30");
      }
      setGcalConnected(localStorage.getItem(GCAL_KEY) === "1");
    } catch { /* ignore */ }
  }, []);

  function setDay(key: string, field: keyof DaySchedule, value: boolean | string) {
    setSchedule((prev) => ({ ...prev, [key]: { ...(prev[key] ?? DEFAULT_SCHEDULE[key]!), [field]: value } }));
    setSaved(false);
  }
  function handleSave() {
    if (typeof window === "undefined") return;
    localStorage.setItem(AGENDA_KEY, JSON.stringify({ schedule, duree }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }
  function toggleGcal() {
    const next = !gcalConnected;
    setGcalConnected(next);
    localStorage.setItem(GCAL_KEY, next ? "1" : "0");
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionCard>
        <h2 className="mb-1 text-base font-semibold text-slate-800">Horaires d&apos;ouverture</h2>
        <p className="mb-4 text-xs text-slate-400">La pause déjeuner peut être activée indépendamment pour chaque jour.</p>
        <div className="flex flex-col gap-2">
          {DAYS.map(({ key, label }) => {
            const day = schedule[key] ?? DEFAULT_SCHEDULE[key]!;
            const pauseDur = (() => {
              const [dh, dm] = day.pauseDebut.split(":").map(Number);
              const [fh, fm] = day.pauseFin.split(":").map(Number);
              const d = ((fh ?? 0) * 60 + (fm ?? 0)) - ((dh ?? 0) * 60 + (dm ?? 0));
              return d > 0 ? `${d} min` : "";
            })();
            return (
              <div
                key={key}
                style={glassSubtle}
                className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl px-4 py-3 transition ${!day.ouvert ? "opacity-50" : ""}`}
              >
                {/* Jour + toggle ouvert/fermé */}
                <div className="flex items-center gap-2" style={{ minWidth: 140 }}>
                  <span className="w-[72px] text-sm font-semibold text-slate-700">{label}</span>
                  <button
                    onClick={() => setDay(key, "ouvert", !day.ouvert)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors ${day.ouvert ? "bg-[#10b981]" : "bg-slate-200"}`}
                    aria-label={day.ouvert ? "Marquer fermé" : "Marquer ouvert"}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${day.ouvert ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                  </button>
                  <span className="text-xs font-medium text-slate-500 w-10">{day.ouvert ? "Ouvert" : "Fermé"}</span>
                </div>

                {/* Horaires + pause (seulement si ouvert) */}
                {day.ouvert && (
                  <div className="flex flex-wrap items-center gap-2 ml-auto">
                    {/* Ouverture */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">Ouvre</span>
                      <input
                        type="time"
                        value={day.ouverture}
                        onChange={(e) => setDay(key, "ouverture", e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 outline-none focus:border-[#6366f1]"
                      />
                    </div>

                    {/* Pause déjeuner inline */}
                    <div className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 transition ${day.pauseActive ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
                      <span className="text-sm leading-none"></span>
                      <button
                        onClick={() => setDay(key, "pauseActive", !day.pauseActive)}
                        className={`relative inline-flex h-4 w-7 flex-shrink-0 rounded-full transition-colors ${day.pauseActive ? "bg-amber-400" : "bg-slate-200"}`}
                        aria-label="Toggle pause déjeuner"
                      >
                        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${day.pauseActive ? "translate-x-3.5" : "translate-x-0.5"}`} />
                      </button>
                      {day.pauseActive ? (
                        <>
                          <input
                            type="time"
                            value={day.pauseDebut}
                            onChange={(e) => setDay(key, "pauseDebut", e.target.value)}
                            className="rounded border border-amber-200 bg-white px-1.5 py-0.5 text-xs text-slate-700 outline-none focus:border-amber-400"
                          />
                          <span className="text-xs text-slate-400">→</span>
                          <input
                            type="time"
                            value={day.pauseFin}
                            onChange={(e) => setDay(key, "pauseFin", e.target.value)}
                            className="rounded border border-amber-200 bg-white px-1.5 py-0.5 text-xs text-slate-700 outline-none focus:border-amber-400"
                          />
                          {pauseDur && <span className="text-[10px] text-amber-600 font-medium">{pauseDur}</span>}
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">Pause déj</span>
                      )}
                    </div>

                    {/* Fermeture */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">Ferme</span>
                      <input
                        type="time"
                        value={day.fermeture}
                        onChange={(e) => setDay(key, "fermeture", e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 outline-none focus:border-[#6366f1]"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard>
        <h2 className="mb-4 text-base font-semibold text-slate-800">Durée de RDV par défaut</h2>
        <div className="flex items-center gap-3">
          <select
            value={duree}
            onChange={(e) => { setDuree(e.target.value); setSaved(false); }}
            className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-800 outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20"
          >
            {["15", "30", "45", "60"].map((v) => <option key={v} value={v}>{v} minutes</option>)}
          </select>
          <span className="text-sm text-slate-500">par défaut lors de la création d&apos;un RDV</span>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl"
            style={{ background: gcalConnected ? "rgba(16,185,129,0.12)" : "rgba(219,234,255,0.7)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" style={{ color: gcalConnected ? "#10b981" : "#6366f1" }}>
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              {gcalConnected && <path d="M8 15l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">Google Agenda</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {gcalConnected ? "Synchronisation active — vos RDV THOR apparaissent dans Google Agenda" : "Synchronisez vos RDV avec Google Agenda"}
            </p>
          </div>
        </div>
        {gcalConnected ? (
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium"
              style={{ background: "rgba(16,185,129,0.10)", color: "#10b981" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Connecté
            </div>
            <button
              onClick={toggleGcal}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 transition"
            >
              Déconnecter
            </button>
          </div>
        ) : (
          <button
            onClick={toggleGcal}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #4285F4, #34A853)" }}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Connecter Google Agenda
          </button>
        )}
      </SectionCard>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: "#6366f1" }}
        >
          Enregistrer
        </button>
        {saved && <SavedBadge />}
      </div>
    </div>
  );
}

// ── Section: Notifications ────────────────────────────────────────────────────
const NOTIF_KEY = "thor_pro_notifications";
type NotifState = { rdvRappel: boolean; rdvNouveaux: boolean; stockAlerte: boolean; renouvellement: boolean; messagerie: boolean };
const NOTIF_DEFAULT: NotifState = { rdvRappel: true, rdvNouveaux: true, stockAlerte: false, renouvellement: true, messagerie: true };

function loadNotifs(): NotifState {
  if (typeof window === "undefined") return NOTIF_DEFAULT;
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    return raw ? { ...NOTIF_DEFAULT, ...(JSON.parse(raw) as Partial<NotifState>) } : NOTIF_DEFAULT;
  } catch { return NOTIF_DEFAULT; }
}

function SectionNotifications({ accentColor }: { accentColor: string }) {
  const [notifs, setNotifs] = useState<NotifState>(NOTIF_DEFAULT);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setNotifs(loadNotifs()); }, []);

  const items: { key: keyof NotifState; label: string; description: string }[] = [
    { key: "rdvRappel",      label: "Rappel de rendez-vous",      description: "Alerte 1h avant chaque RDV" },
    { key: "rdvNouveaux",    label: "Nouveaux rendez-vous",        description: "Notification à chaque prise de RDV" },
    { key: "stockAlerte",    label: "Alertes stock",               description: "Quand un article passe sous le seuil minimum" },
    { key: "renouvellement", label: "Renouvellements dus",         description: "Rappel pour les patients à renouveler" },
    { key: "messagerie",     label: "Nouveaux messages",           description: "Badge sur l'icône messagerie" },
  ];

  function toggle(key: keyof NotifState) {
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  }

  function handleSave() {
    if (typeof window !== "undefined") localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionCard>
        <h2 className="mb-5 text-base font-semibold text-slate-800">Préférences de notifications</h2>
        <div className="flex flex-col gap-3">
          {items.map(({ key, label, description }) => (
            <div key={key} style={glassSubtle} className="flex items-center gap-4 rounded-xl px-4 py-3">
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-700">{label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{description}</div>
              </div>
              <button
                type="button"
                onClick={() => toggle(key)}
                className="relative h-5 w-9 rounded-full transition-colors duration-200 flex-shrink-0"
                style={{ background: notifs[key] ? accentColor : "#cbd5e1" }}
                aria-label={notifs[key] ? "Désactiver" : "Activer"}
              >
                <span
                  className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                  style={{ transform: notifs[key] ? "translateX(1.125rem)" : "translateX(0.125rem)" }}
                />
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: "#6366f1" }}
        >
          Enregistrer
        </button>
        {saved && <SavedBadge />}
      </div>
    </div>
  );
}

// ── Section: Import patients ──────────────────────────────────────────────────
const THOR_IMPORT_FIELDS = [
  { key: "nom",           label: "Nom",               required: true  },
  { key: "prenom",        label: "Prénom",             required: true  },
  { key: "dateNaissance", label: "Date de naissance",  required: false },
  { key: "telephone",     label: "Téléphone",          required: false },
  { key: "email",         label: "Email",              required: false },
  { key: "adresse",       label: "Adresse",            required: false },
  { key: "codePostal",    label: "Code postal",        required: false },
  { key: "ville",         label: "Ville",              required: false },
  { key: "mutuelle",      label: "Mutuelle",           required: false },
  { key: "numeroSS",      label: "N° Sécu",            required: false },
];

const AUTO_DETECT_PATTERNS: Record<string, string[]> = {
  nom:           ["nom", "name", "last_name", "lastname", "nom_famille", "family"],
  prenom:        ["prenom", "firstname", "first_name", "given", "prénom"],
  dateNaissance: ["naissance", "dob", "birth", "date_naissance", "née"],
  telephone:     ["telephone", "tel", "phone", "mobile", "portable", "téléphone"],
  email:         ["email", "mail", "courriel"],
  adresse:       ["adresse", "address", "rue"],
  codePostal:    ["codepostal", "code_postal", "cp", "zip", "postal"],
  ville:         ["ville", "city", "localite"],
  mutuelle:      ["mutuelle", "assurance", "complementaire", "organisme"],
  numeroSS:      ["secu", "nir", "securite", "numero_ss", "ss"],
};

function autoDetectMapping(cols: string[]): Record<string, string> {
  const norm = cols.map(c =>
    c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s\-]+/g, "_")
  );
  const result: Record<string, string> = {};
  for (const [field, patterns] of Object.entries(AUTO_DETECT_PATTERNS)) {
    const idx = norm.findIndex(n => patterns.some(p => n.includes(p)));
    if (idx !== -1) result[field] = cols[idx];
  }
  return result;
}

function SectionImport() {
  const [step, setStep] = useState<"idle" | "mapping" | "done">("idle");
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importCount, setImportCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const XLSX = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as unknown[][];
    if (data.length < 2) return;
    const headers = (data[0] as unknown[]).map(String);
    const bodyRows = data.slice(1).map(row =>
      Object.fromEntries(headers.map((h, i) => [h, String((row as unknown[])[i] ?? "")]))
    );
    setColumns(headers);
    setRows(bodyRows);
    setMapping(autoDetectMapping(headers));
    setStep("mapping");
    if (fileRef.current) fileRef.current.value = "";
  }

  function doImport() {
    const existing = readJSONArray<Record<string, unknown>>("thor_pro_patients");
    const newPatients = rows
      .filter(row => mapping.nom && mapping.prenom && row[mapping.nom]?.trim() && row[mapping.prenom]?.trim())
      .map(row => ({
        id:            crypto.randomUUID(),
        nom:           mapping.nom           ? (row[mapping.nom]?.trim()           ?? "") : "",
        prenom:        mapping.prenom        ? (row[mapping.prenom]?.trim()        ?? "") : "",
        dateNaissance: mapping.dateNaissance ? (row[mapping.dateNaissance]?.trim() ?? "") : "",
        telephone:     mapping.telephone     ? (row[mapping.telephone]?.trim()     ?? "") : "",
        email:         mapping.email         ? (row[mapping.email]?.trim()         ?? "") : "",
        adresse:       mapping.adresse       ? (row[mapping.adresse]?.trim()       ?? "") : "",
        codePostal:    mapping.codePostal    ? (row[mapping.codePostal]?.trim()    ?? "") : "",
        ville:         mapping.ville         ? (row[mapping.ville]?.trim()         ?? "") : "",
        mutuelle:      mapping.mutuelle      ? (row[mapping.mutuelle]?.trim()      ?? "") : "",
        numeroSS:      mapping.numeroSS      ? (row[mapping.numeroSS]?.trim()      ?? "") : "",
        createdAt:     new Date().toISOString(),
      }));
    localStorage.setItem("thor_pro_patients", JSON.stringify([...existing, ...newPatients]));
    setImportCount(newPatients.length);
    setStep("done");
  }

  function reset() { setStep("idle"); setRows([]); setColumns([]); setMapping({}); }

  if (step === "done") return (
    <SectionCard>
      <div className="flex flex-col items-center gap-4 py-3 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
          <svg className="w-6 h-6 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-slate-800">{importCount} patient{importCount > 1 ? "s" : ""} importé{importCount > 1 ? "s" : ""}</p>
          <p className="text-sm text-slate-500 mt-1">Ils sont maintenant disponibles dans la liste patients.</p>
        </div>
        <button onClick={reset} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Importer un autre fichier</button>
      </div>
    </SectionCard>
  );

  if (step === "mapping") {
    const visibleFields = THOR_IMPORT_FIELDS.filter(f => mapping[f.key]);
    return (
      <SectionCard>
        <h2 className="mb-1 text-base font-semibold text-slate-800">Associer les colonnes</h2>
        <p className="text-xs text-slate-400 mb-4">{rows.length} ligne{rows.length > 1 ? "s" : ""} détectée{rows.length > 1 ? "s" : ""}</p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {THOR_IMPORT_FIELDS.map(({ key, label, required }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-600 mb-1">{label}{required ? " *" : ""}</label>
              <select value={mapping[key] ?? ""} onChange={e => setMapping(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-300">
                <option value="">— Ne pas importer —</option>
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Aperçu 3 lignes */}
        {visibleFields.length > 0 && (
          <div className="mb-5 rounded-xl overflow-x-auto border border-slate-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {visibleFields.map(f => <th key={f.key} className="px-3 py-2 text-left font-medium text-slate-500 whitespace-nowrap">{f.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 3).map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    {visibleFields.map(f => <td key={f.key} className="px-3 py-2 text-slate-700 whitespace-nowrap">{row[mapping[f.key]] || "—"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={doImport} disabled={!mapping.nom || !mapping.prenom}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-40"
            style={{ background: "#2D8CFF" }}>
            Importer {rows.length} patient{rows.length > 1 ? "s" : ""}
          </button>
          <button onClick={reset} className="text-sm text-slate-500 hover:text-slate-700">Annuler</button>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard>
      <h2 className="mb-1 text-base font-semibold text-slate-800">Importer des patients</h2>
      <p className="mb-5 text-sm text-slate-500">
        Importez votre base clients depuis votre ancien logiciel. Formats acceptés : <strong>Excel (.xlsx, .xls)</strong> et <strong>CSV</strong>.
        Les colonnes sont détectées automatiquement.
      </p>
      <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
      <button onClick={() => fileRef.current?.click()}
        className="flex items-center justify-center gap-3 rounded-xl border border-dashed border-blue-200 bg-blue-50/50 px-5 py-4 text-sm font-medium text-blue-600 transition hover:border-blue-300 hover:bg-blue-50 w-full">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Choisir un fichier Excel ou CSV
      </button>
    </SectionCard>
  );
}

// ── Section: Données ──────────────────────────────────────────────────────────
function dailyResetCode(): string {
  const d = new Date();
  const seed = `THOR-RESET-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-K7mX9p`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  return Math.abs(h).toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
}

function ZoneDangerVision() {
  const [isGerant, setIsGerant] = useState(false);
  const [gerantEmail, setGerantEmail] = useState("");
  const [step, setStep] = useState<"idle" | "demande" | "code" | "done">("idle");
  const [inputCode, setInputCode] = useState("");
  const [codeError, setCodeError] = useState(false);

  useEffect(() => {
    const users = loadUsers();
    const id = loadCurrentUserId();
    const me = users.find(u => u.id === id);
    setIsGerant(me?.role === "Gérant");
    setGerantEmail(me?.email ?? "");
  }, []);

  if (!isGerant) return (
    <SectionCard>
      <h2 className="mb-3 text-base font-semibold text-slate-800">Zone de danger</h2>
      <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm text-slate-500"
        style={{ background: "rgba(241,245,249,0.80)", border: "1px solid rgba(226,232,240,0.60)" }}>
        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        Accès réservé au gérant du cabinet.
      </div>
    </SectionCard>
  );

  const code = dailyResetCode();

  function tryCode() {
    if (inputCode.trim().toUpperCase() === code) {
      ["thor_pro_patients","thor_pro_dossiers","thor_pro_devis","thor_pro_rdv","thor_pro_stock_alerts",AGENDA_KEY]
        .forEach(k => localStorage.removeItem(k));
      setStep("done");
    } else {
      setCodeError(true);
    }
  }

  return (
    <SectionCard>
      <h2 className="mb-2 text-base font-semibold text-slate-800">Zone de danger</h2>
      <p className="mb-5 text-sm text-slate-500">
        Supprime définitivement toutes les données (patients, dossiers, devis, RDV). Action irréversible — un code de sécurité SAV est requis.
      </p>

      {step === "idle" && (
        <button onClick={() => setStep("demande")}
          className="rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100">
          Réinitialiser toutes les données
        </button>
      )}

      {step === "demande" && (
        <div style={{ border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.04)" }} className="rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.63 19a19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 3.12 4.18 2 2 0 0 1 5.09 2h3a2 2 0 0 1 2 1.72c.13 1 .36 1.98.72 2.9a2 2 0 0 1-.45 2.11L9.91 9.19a16 16 0 0 0 6 6l.46-.46a2 2 0 0 1 2.11-.45c.92.36 1.9.59 2.9.72A2 2 0 0 1 22 16.92Z"/></svg>
            <div>
              <p className="text-sm font-semibold text-slate-800">Un code de sécurité est nécessaire</p>
              <p className="text-xs text-slate-500 mt-1">
                Contactez le SAV THOR par email à <strong>sav@thor-logiciel.fr</strong> ou par téléphone au <strong>01 XX XX XX XX</strong> en indiquant votre numéro de licence. Le code vous sera envoyé à <strong>{gerantEmail || "votre adresse email"}</strong>.
              </p>
              {/* Code du jour visible pour la démo */}
              <p className="text-[11px] text-slate-400 mt-2 italic">
                Code démo du jour : <span className="font-mono font-semibold text-slate-600">{code}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep("code")}
              className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
              J&apos;ai mon code
            </button>
            <button onClick={() => setStep("idle")} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
          </div>
        </div>
      )}

      {step === "code" && (
        <div style={{ border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.04)" }} className="rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-red-700">Saisissez le code reçu par email</p>
          <input
            value={inputCode}
            onChange={e => { setInputCode(e.target.value.toUpperCase()); setCodeError(false); }}
            placeholder="ex : A3K7Z2"
            maxLength={6}
            className="w-40 rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono text-center tracking-widest outline-none focus:ring-2 focus:ring-red-300 uppercase"
          />
          {codeError && <p className="text-xs text-red-500">Code incorrect. Vérifiez le code reçu par email.</p>}
          <div className="flex gap-2">
            <button onClick={tryCode}
              className="rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700">
              Confirmer la réinitialisation
            </button>
            <button onClick={() => { setStep("idle"); setInputCode(""); setCodeError(false); }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm"
          style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.20)", color: "#065f46" }}>
          <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          Données réinitialisées avec succès.
        </div>
      )}
    </SectionCard>
  );
}

function SectionDonnees() {
  function exportPatients() { downloadCSV("thor_patients.csv", readJSONArray<Record<string, unknown>>("thor_pro_patients")); }
  function exportDossiers() { downloadCSV("thor_dossiers.csv", readJSONArray<Record<string, unknown>>("thor_pro_dossiers")); }
  function exportDevis()    { downloadCSV("thor_devis.csv",    readJSONArray<Record<string, unknown>>("thor_pro_devis")); }

  return (
    <div className="flex flex-col gap-6">
      <SectionCard>
        <h2 className="mb-5 text-base font-semibold text-slate-800">Exporter les données</h2>
        <div className="flex flex-col gap-3">
          {[
            { label: "Exporter Patients (CSV)", action: exportPatients, color: "#6366f1" },
            { label: "Exporter Dossiers (CSV)", action: exportDossiers, color: "#10b981" },
            { label: "Exporter Devis (CSV)",    action: exportDevis,    color: "#f59e0b" },
          ].map(({ label, action, color }) => (
            <button key={label} onClick={action}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:shadow-sm text-left">
              <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {label}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionImport />

      <ZoneDangerVision />
    </div>
  );
}

// ── Main SettingsPanel ────────────────────────────────────────────────────────
interface SettingsPanelProps {
  onClose: () => void;
  storeConfig: StoreConfig;
  onStoreConfigChange: (c: StoreConfig) => void;
  users: ProUser[];
  onUsersChange: (u: ProUser[]) => void;
  accentColor: string;
}

export default function SettingsPanel({
  onClose, storeConfig, onStoreConfigChange, users, onUsersChange, accentColor,
}: SettingsPanelProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("compte");
  const [visible, setVisible] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Escape key handler
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  const activeAccent = mkAccentStyle(accentColor);
  const active = activeSection;

  return (
    <div
      className="fixed inset-0 z-[100]"
      aria-modal="true"
      role="dialog"
      aria-label="Paramètres"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={handleClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className="absolute inset-y-0 right-0 flex flex-col"
        style={{
          width: "min(80vw, 1100px)",
          background: "rgba(248,250,252,0.97)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderLeft: "1px solid rgba(255,255,255,0.7)",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms ease-out",
        }}
      >
        {/* Panel header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{
            background: "rgba(255,255,255,0.65)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-lg grid place-items-center flex-shrink-0"
              style={activeAccent}
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Paramètres</h2>
              <p className="text-xs text-slate-400">{storeConfig.nom}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fermer les paramètres"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Body: sub-nav + content */}
        <div className="flex flex-1 min-h-0">
          {/* Sub-nav */}
          <aside
            className="w-[220px] flex-shrink-0 flex flex-col gap-0.5 py-4 px-3 overflow-y-auto"
            style={{
              background: "var(--glass-subtle-bg)",
              borderRight: "1px solid rgba(0,0,0,0.05)",
            }}
          >
            {SECTIONS.map(({ id, label, description, Icon }) => {
              const isActive = active === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all w-full ${
                    isActive ? "text-white" : "text-slate-500 hover:bg-white/60 hover:text-slate-700"
                  }`}
                  style={isActive ? activeAccent : undefined}
                >
                  <span
                    className="grid h-8 w-8 place-items-center rounded-xl flex-shrink-0"
                    style={
                      isActive
                        ? { background: "rgba(255,255,255,0.20)" }
                        : { background: "rgba(219,234,255,0.70)" }
                    }
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium leading-tight">{label}</div>
                    <div className={`text-[10px] leading-tight mt-0.5 ${isActive ? "text-white/70" : "text-slate-400"}`}>
                      {description}
                    </div>
                  </div>
                </button>
              );
            })}
          </aside>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {active === "compte"        && <SectionCompte storeConfig={storeConfig} onStoreConfigChange={onStoreConfigChange} />}
            {active === "apparence"     && <SectionApparence storeConfig={storeConfig} onStoreConfigChange={onStoreConfigChange} accentColor={accentColor} />}
            {active === "tarification"  && <SectionTarification storeConfig={storeConfig} onStoreConfigChange={onStoreConfigChange} />}
            {active === "equipe"        && <SectionEquipe users={users} onUsersChange={onUsersChange} />}
            {active === "agenda"        && <SectionAgenda />}
            {active === "notifications" && <SectionNotifications accentColor={accentColor} />}
            {active === "donnees"       && <SectionDonnees />}
          </div>
        </div>
      </div>
    </div>
  );
}
