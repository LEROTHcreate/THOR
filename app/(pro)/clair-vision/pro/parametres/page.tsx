"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import {
  loadStoreConfig,
  saveStoreConfig,
  type StoreConfig,
} from "@/lib/storeConfig";
import {
  MARQUES_VERRES,
  VERRES_DB,
  type VerreType,
} from "@/lib/verresDb";
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
import React from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const PRIMARY = "#2D8CFF";

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

// ── Tabs ──────────────────────────────────────────────────────────────────────
type Tab = "general" | "equipe" | "agenda" | "tarification" | "verriers" | "donnees";

const TABS: { id: Tab; label: string }[] = [
  { id: "general",      label: "Général"      },
  { id: "equipe",       label: "Équipe"        },
  { id: "agenda",       label: "Agenda"        },
  { id: "tarification", label: "Tarification"  },
  { id: "verriers",     label: "Verriers"      },
  { id: "donnees",      label: "Données"       },
];

// ── Horaires ──────────────────────────────────────────────────────────────────
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
  } catch { return []; }
}

function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) { alert("Aucune donnée à exporter."); return; }
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(";"),
    ...rows.map((r) =>
      headers.map((h) => {
        const v = r[h] ?? "";
        return `"${String(v).replace(/"/g, '""')}"`;
      }).join(";")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Role badge ────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
      style={{ background: ROLE_COLORS[role] ?? PRIMARY }}>
      {role}
    </span>
  );
}

// ── Cards & fields ────────────────────────────────────────────────────────────
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div style={glass} className={`rounded-2xl p-6 ${className ?? ""}`}>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      <input
        type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? label}
        className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-800 outline-none transition"
        style={{ ["--tw-ring-color" as string]: PRIMARY }}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: Général
// ══════════════════════════════════════════════════════════════════════════════
function TabGeneral() {
  const [config, setConfig] = useState<StoreConfig>({ nom: "Clair Vision" });
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setConfig(loadStoreConfig()); }, []);

  function set(field: keyof StoreConfig, value: string) {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function handleSave() {
    saveStoreConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setConfig((prev) => ({ ...prev, logo: reader.result as string }));
      setSaved(false);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
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
          <Field label="ADELI (opticien)" value={config.adeli ?? ""} onChange={(v) => set("adeli", v)} />
          <Field label="FINESS" value={config.finess ?? ""} onChange={(v) => set("finess", v)} />
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-slate-800">Logo du cabinet</h2>
        <div className="flex items-center gap-5">
          <div className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-2xl overflow-hidden"
            style={config.logo
              ? { border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }
              : { background: PRIMARY, boxShadow: "0 2px 8px rgba(45,140,255,0.25)" }
            }>
            {config.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none">
                <ellipse cx="12" cy="12" rx="10" ry="6" stroke="currentColor" strokeWidth="1.8"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                <circle cx="12" cy="12" r="1" fill="currentColor"/>
              </svg>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
            <button onClick={() => fileRef.current?.click()}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Choisir une image…
            </button>
            {config.logo && (
              <button onClick={() => { setConfig((p) => ({ ...p, logo: undefined })); setSaved(false); }}
                className="text-xs text-red-500 hover:text-red-700 transition text-left">
                Supprimer le logo
              </button>
            )}
            <p className="text-[11px] text-slate-400">PNG, JPG ou SVG · max 2 Mo recommandé</p>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <button onClick={handleSave}
          className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: PRIMARY }}>
          Enregistrer
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-[#10b981]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Sauvegardé
          </span>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: Équipe
// ══════════════════════════════════════════════════════════════════════════════
const ALL_ROLES: UserRole[] = ["Gérant", "Optométriste", "Opticien", "Visagiste", "Assistant(e)"];

interface NewUserForm { nom: string; prenom: string; email: string; role: UserRole; password: string; }

function TabEquipe() {
  const [users, setUsers] = useState<ProUser[]>([]);
  const [currentId, setCurrentId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<NewUserForm>({ nom: "", prenom: "", email: "", role: "Opticien", password: "" });

  useEffect(() => {
    setUsers(loadUsers());
    setCurrentId(loadCurrentUserId());
  }, []);

  const isCurrentUserGerant = users.find(u => u.id === currentId)?.role === "Gérant";

  function handleAddUser() {
    if (!form.nom.trim() || !form.prenom.trim()) return;
    const name = `${form.prenom.trim()} ${form.nom.trim()}`;
    const newUser: ProUser = {
      id: generateId(name), name, role: form.role,
      initials: getInitials(name), color: ROLE_COLORS[form.role] ?? PRIMARY,
      password: form.password, email: form.email || undefined,
    };
    const updated = [...users, newUser];
    setUsers(updated); saveUsers(updated);
    setShowModal(false);
    setForm({ nom: "", prenom: "", email: "", role: "Opticien", password: "" });
  }

  function handleDelete(id: string) {
    const updated = users.filter((u) => u.id !== id);
    setUsers(updated); saveUsers(updated); setConfirmDeleteId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">Membres de l&apos;équipe ({users.length})</h2>
        {isCurrentUserGerant && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: PRIMARY }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Ajouter un utilisateur
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {users.map((u) => (
          <div key={u.id} style={glass} className="flex items-center gap-4 rounded-2xl px-5 py-4">
            <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full text-sm font-bold text-white"
              style={{ background: u.color }}>
              {u.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800 truncate">{u.name}</span>
                {u.id === currentId && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${PRIMARY}18`, color: PRIMARY }}>Vous</span>
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
                  <button onClick={() => handleDelete(u.id)}
                    className="rounded-lg bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600">
                    Supprimer
                  </button>
                  <button onClick={() => setConfirmDeleteId(null)}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    Annuler
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDeleteId(u.id)}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500" title="Supprimer">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div style={glass} className="w-full max-w-md rounded-2xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">Ajouter un utilisateur</h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
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
                <select value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))}
                  className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-800 outline-none">
                  {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <Field label="Mot de passe" value={form.password} onChange={(v) => setForm((p) => ({ ...p, password: v }))} type="password" />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Annuler
              </button>
              <button onClick={handleAddUser} disabled={!form.nom.trim() || !form.prenom.trim()}
                className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                style={{ background: PRIMARY }}>
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: Agenda
// ══════════════════════════════════════════════════════════════════════════════
const GCAL_KEY = "thor_pro_vision_gcal_connected";

function TabAgenda() {
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
        const storedSched = parsed.schedule ?? DEFAULT_SCHEDULE;
        const merged: WeekSchedule = {};
        for (const key of Object.keys(DEFAULT_SCHEDULE)) {
          merged[key] = { ...DEFAULT_DAY_PAUSE, ...storedSched[key] };
        }
        setSchedule(merged);
        setDuree(parsed.duree ?? "30");
      }
      setGcalConnected(localStorage.getItem(GCAL_KEY) === "true");
    } catch { /* ignore */ }
  }, []);

  function setDay(key: string, field: keyof DaySchedule, value: boolean | string) {
    setSchedule((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
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
    localStorage.setItem(GCAL_KEY, String(next));
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="mb-5 text-base font-semibold text-slate-800">Horaires d&apos;ouverture</h2>
        <div className="flex flex-col gap-2">
          {DAYS.map(({ key, label }) => {
            const day: DaySchedule = { ...DEFAULT_SCHEDULE[key], ...schedule[key] };
            const pauseDur = (() => {
              if (!day.pauseActive) return null;
              const [h1, m1] = day.pauseDebut.split(":").map(Number);
              const [h2, m2] = day.pauseFin.split(":").map(Number);
              const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
              if (diff <= 0) return null;
              const h = Math.floor(diff / 60), m = diff % 60;
              return h > 0 ? `${h}h${m > 0 ? m.toString().padStart(2, "0") : ""}` : `${m}min`;
            })();
            return (
              <div key={key} style={glassSubtle}
                className={`flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 transition ${!day.ouvert ? "opacity-60" : ""}`}>
                <span className="w-24 text-sm font-medium text-slate-700">{label}</span>
                <button onClick={() => setDay(key, "ouvert", !day.ouvert)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${day.ouvert ? "bg-[#10b981]" : "bg-slate-200"}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${day.ouvert ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
                <span className="text-xs font-medium text-slate-500 w-12">{day.ouvert ? "Ouvert" : "Fermé"}</span>
                {day.ouvert && (
                  <div className="flex flex-wrap items-center gap-2 ml-auto">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-slate-400">Ouvre</label>
                      <input type="time" value={day.ouverture}
                        onChange={(e) => setDay(key, "ouverture", e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 outline-none" />
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
                          <input type="time" value={day.pauseDebut}
                            onChange={(e) => setDay(key, "pauseDebut", e.target.value)}
                            className="rounded border border-amber-200 bg-white px-1.5 py-0.5 text-xs text-slate-700 outline-none" />
                          <span className="text-xs text-slate-400">→</span>
                          <input type="time" value={day.pauseFin}
                            onChange={(e) => setDay(key, "pauseFin", e.target.value)}
                            className="rounded border border-amber-200 bg-white px-1.5 py-0.5 text-xs text-slate-700 outline-none" />
                          {pauseDur && <span className="text-[10px] text-amber-600 font-medium">{pauseDur}</span>}
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">Pause déj</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-slate-400">Ferme</label>
                      <input type="time" value={day.fermeture}
                        onChange={(e) => setDay(key, "fermeture", e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 outline-none" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-slate-800">Durée de RDV par défaut</h2>
        <div className="flex items-center gap-3">
          <select value={duree} onChange={(e) => { setDuree(e.target.value); setSaved(false); }}
            className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-800 outline-none">
            {["15", "20", "30", "45", "60", "90"].map((v) => <option key={v} value={v}>{v} minutes</option>)}
          </select>
          <span className="text-sm text-slate-500">par défaut lors de la création d&apos;un RDV</span>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: gcalConnected ? "rgba(45,140,255,0.12)" : "rgba(241,245,249,0.8)" }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke={gcalConnected ? PRIMARY : "#94a3b8"} strokeWidth="1.8" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="3"/>
                <path d="M3 9h18M8 2v4M16 2v4"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Google Agenda</div>
              <div className="text-xs text-slate-400">{gcalConnected ? "Synchronisation active" : "Non connecté"}</div>
            </div>
          </div>
          <button
            onClick={toggleGcal}
            className="rounded-xl px-4 py-2 text-sm font-semibold transition hover:opacity-90"
            style={gcalConnected
              ? { background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1.5px solid rgba(239,68,68,0.2)" }
              : { background: "rgba(45,140,255,0.10)", color: PRIMARY, border: `1.5px solid rgba(45,140,255,0.25)` }}
          >
            {gcalConnected ? "Déconnecter" : "Connecter"}
          </button>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <button onClick={handleSave}
          className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: PRIMARY }}>
          Enregistrer
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-[#10b981]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Sauvegardé
          </span>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: Tarification
// ══════════════════════════════════════════════════════════════════════════════
const TARIF_KEY = "thor_pro_vision_tarification";

interface TarifVision {
  coef_verres_progressifs: string;
  coef_verres_simples:     string;
  coef_montures_optiques:  string;
  coef_montures_solaires:  string;
  coef_lentilles_souples:  string;
  coef_lentilles_rigides:  string;
  coef_accessoires:        string;
  remiseMax:               string;
  mentionsDevis:           string;
  tauxTVA:                 string;
}

const DEFAULT_TARIF: TarifVision = {
  coef_verres_progressifs: "3.2",
  coef_verres_simples:     "3.0",
  coef_montures_optiques:  "3.2",
  coef_montures_solaires:  "3.0",
  coef_lentilles_souples:  "2.2",
  coef_lentilles_rigides:  "3.0",
  coef_accessoires:        "2.8",
  remiseMax:               "15",
  mentionsDevis:           "Devis valable 30 jours. Prix TTC. Tiers payant selon conditions mutuelle.",
  tauxTVA:                 "20",
};

const COEF_LABELS: { key: keyof TarifVision; label: string }[] = [
  { key: "coef_verres_progressifs", label: "Verres progressifs"  },
  { key: "coef_verres_simples",     label: "Verres simples"       },
  { key: "coef_montures_optiques",  label: "Montures optiques"   },
  { key: "coef_montures_solaires",  label: "Montures solaires"   },
  { key: "coef_lentilles_souples",  label: "Lentilles souples"   },
  { key: "coef_lentilles_rigides",  label: "Lentilles rigides"   },
  { key: "coef_accessoires",        label: "Accessoires"          },
];

function loadTarif(): TarifVision {
  if (typeof window === "undefined") return DEFAULT_TARIF;
  try {
    const raw = localStorage.getItem(TARIF_KEY);
    return raw ? { ...DEFAULT_TARIF, ...(JSON.parse(raw) as Partial<TarifVision>) } : DEFAULT_TARIF;
  } catch { return DEFAULT_TARIF; }
}

function saveTarif(t: TarifVision) {
  if (typeof window !== "undefined") localStorage.setItem(TARIF_KEY, JSON.stringify(t));
}

function TabTarification() {
  const [tarif, setTarif] = useState<TarifVision>(DEFAULT_TARIF);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setTarif(loadTarif()); }, []);

  function set(k: keyof TarifVision, v: string) {
    setTarif(prev => ({ ...prev, [k]: v }));
    setSaved(false);
  }

  function handleSave() {
    saveTarif(tarif);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Info box */}
      <div className="rounded-xl px-4 py-3 text-sm text-slate-600 leading-relaxed"
        style={{ background: "rgba(45,140,255,0.06)", border: "1px solid rgba(45,140,255,0.18)" }}>
        <strong className="text-slate-700">Prix de vente conseillé</strong> = Prix d&apos;achat fournisseur × coefficient. Utilisé pour pré-remplir les devis automatiquement.
      </div>

      {/* Coefficients */}
      <Card>
        <h2 className="mb-5 text-base font-semibold text-slate-800">Coefficients de marge par catégorie</h2>
        <div className="grid grid-cols-2 gap-4">
          {COEF_LABELS.map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type="number" min="1" max="20" step="0.1"
                  value={tarif[key]}
                  onChange={e => set(key, e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-800 outline-none pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">×</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Paramètres généraux */}
      <Card>
        <h2 className="mb-1 text-base font-semibold text-slate-800">Paramètres généraux</h2>
        <p className="mb-5 text-sm text-slate-500">Appliqués automatiquement à tous vos devis et factures Clair Vision.</p>

        {/* Remise max */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Remise max autorisée</label>
          <div className="relative w-40">
            <input type="number" min="0" max="50" step="1" value={tarif.remiseMax}
              onChange={e => set("remiseMax", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-800 outline-none pr-8" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Alerte si remise accordée dépasse ce seuil</p>
        </div>

        {/* TVA */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Taux TVA</label>
          <div className="flex gap-2">
            {[
              { val: "5.5", label: "5,5 % — Taux réduit" },
              { val: "20",  label: "20 % — Taux normal"  },
            ].map(o => (
              <button key={o.val} onClick={() => set("tauxTVA", o.val)}
                className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition"
                style={tarif.tauxTVA === o.val
                  ? { borderColor: PRIMARY, background: "rgba(45,140,255,0.08)", color: "#1a6fd4" }
                  : { borderColor: "rgba(203,213,225,0.6)", background: "transparent", color: "#64748b" }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mentions devis */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Mentions bas de devis</label>
          <textarea value={tarif.mentionsDevis} onChange={e => set("mentionsDevis", e.target.value)} rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-800 outline-none resize-none" />
        </div>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave}
          className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition"
          style={{ background: saved ? "#10b981" : PRIMARY }}>
          {saved ? "✓ Enregistré" : "Enregistrer les tarifs"}
        </button>
      </div>

    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: Données — Import patients Vision
// ══════════════════════════════════════════════════════════════════════════════
const VIS_IMPORT_FIELDS = [
  { key: "nom",             label: "Nom",               required: true  },
  { key: "prenom",          label: "Prénom",             required: true  },
  { key: "dateNaissance",   label: "Date de naissance",  required: false },
  { key: "telephone",       label: "Téléphone",          required: false },
  { key: "email",           label: "Email",              required: false },
  { key: "adresse",         label: "Adresse",            required: false },
  { key: "codePostal",      label: "Code postal",        required: false },
  { key: "ville",           label: "Ville",              required: false },
  { key: "mutuelle",        label: "Mutuelle",           required: false },
  { key: "numeroSS",        label: "N° Sécu",            required: false },
  { key: "typeCorrection",  label: "Type de correction", required: false },
];

const VIS_AUTO_DETECT: Record<string, string[]> = {
  nom:            ["nom", "name", "last_name", "lastname", "famille"],
  prenom:         ["prenom", "firstname", "first_name", "given", "prénom"],
  dateNaissance:  ["naissance", "dob", "birth", "date_naissance", "née"],
  telephone:      ["telephone", "tel", "phone", "mobile", "portable", "téléphone"],
  email:          ["email", "mail", "courriel"],
  adresse:        ["adresse", "address", "rue"],
  codePostal:     ["codepostal", "code_postal", "cp", "zip", "postal"],
  ville:          ["ville", "city"],
  mutuelle:       ["mutuelle", "assurance", "complementaire", "organisme"],
  numeroSS:       ["secu", "nir", "securite", "numero_ss", "ss"],
  typeCorrection: ["correction", "type_correction", "equipement", "lunettes", "lentilles"],
};

function visAutoMap(cols: string[]): Record<string, string> {
  const norm = cols.map(c => c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s\-]+/g, "_"));
  const res: Record<string, string> = {};
  for (const [field, patterns] of Object.entries(VIS_AUTO_DETECT)) {
    const idx = norm.findIndex(n => patterns.some(p => n.includes(p)));
    if (idx !== -1) res[field] = cols[idx];
  }
  return res;
}

function SectionImportVision() {
  const [step, setStep] = useState<"idle" | "mapping" | "done">("idle");
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importCount, setImportCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const xlsx = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = xlsx.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json<unknown[]>(ws, { header: 1 }) as unknown[][];
    if (data.length < 2) return;
    const headers = (data[0] as unknown[]).map(String);
    const bodyRows = data.slice(1).map(row =>
      Object.fromEntries(headers.map((h, i) => [h, String((row as unknown[])[i] ?? "")]))
    );
    setColumns(headers); setRows(bodyRows); setMapping(visAutoMap(headers)); setStep("mapping");
    if (fileRef.current) fileRef.current.value = "";
  }

  function doImport() {
    const existing = readJSONArray<Record<string, unknown>>("thor_pro_patients");
    const newPatients = rows
      .filter(row => mapping.nom && mapping.prenom && row[mapping.nom]?.trim() && row[mapping.prenom]?.trim())
      .map(row => ({
        id: crypto.randomUUID(), createdAt: new Date().toISOString(),
        nom:            mapping.nom            ? (row[mapping.nom]?.trim()            ?? "") : "",
        prenom:         mapping.prenom         ? (row[mapping.prenom]?.trim()         ?? "") : "",
        dateNaissance:  mapping.dateNaissance  ? (row[mapping.dateNaissance]?.trim()  ?? "") : "",
        telephone:      mapping.telephone      ? (row[mapping.telephone]?.trim()      ?? "") : "",
        email:          mapping.email          ? (row[mapping.email]?.trim()          ?? "") : "",
        adresse:        mapping.adresse        ? (row[mapping.adresse]?.trim()        ?? "") : "",
        codePostal:     mapping.codePostal     ? (row[mapping.codePostal]?.trim()     ?? "") : "",
        ville:          mapping.ville          ? (row[mapping.ville]?.trim()          ?? "") : "",
        mutuelle:       mapping.mutuelle       ? (row[mapping.mutuelle]?.trim()       ?? "") : "",
        numeroSS:       mapping.numeroSS       ? (row[mapping.numeroSS]?.trim()       ?? "") : "",
        typeCorrection: mapping.typeCorrection ? (row[mapping.typeCorrection]?.trim() ?? "") : "",
      }));
    localStorage.setItem("thor_pro_patients", JSON.stringify([...existing, ...newPatients]));
    setImportCount(newPatients.length); setStep("done");
  }

  function reset() { setStep("idle"); setRows([]); setColumns([]); setMapping({}); }

  if (step === "done") return (
    <Card>
      <div className="flex flex-col items-center gap-4 py-3 text-center">
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <div>
          <p className="font-semibold text-slate-800">{importCount} patient{importCount > 1 ? "s" : ""} importé{importCount > 1 ? "s" : ""}</p>
          <p className="text-sm text-slate-500 mt-1">Disponibles dans la liste patients.</p>
        </div>
        <button onClick={reset} className="text-sm font-medium" style={{ color: PRIMARY }}>Importer un autre fichier</button>
      </div>
    </Card>
  );

  if (step === "mapping") {
    const visible = VIS_IMPORT_FIELDS.filter(f => mapping[f.key]);
    return (
      <Card>
        <h2 className="mb-1 text-base font-semibold text-slate-800">Associer les colonnes</h2>
        <p className="text-xs text-slate-400 mb-4">{rows.length} ligne{rows.length > 1 ? "s" : ""} détectée{rows.length > 1 ? "s" : ""}</p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {VIS_IMPORT_FIELDS.map(({ key, label, required }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-600 mb-1">{label}{required ? " *" : ""}</label>
              <select value={mapping[key] ?? ""} onChange={e => setMapping(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:ring-2" style={{ "--tw-ring-color": PRIMARY } as React.CSSProperties}>
                <option value="">— Ne pas importer —</option>
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          ))}
        </div>
        {visible.length > 0 && (
          <div className="mb-5 rounded-xl overflow-x-auto border border-slate-100">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 border-b border-slate-100">{visible.map(f => <th key={f.key} className="px-3 py-2 text-left font-medium text-slate-500 whitespace-nowrap">{f.label}</th>)}</tr></thead>
              <tbody>{rows.slice(0, 3).map((row, i) => <tr key={i} className="border-b border-slate-50 last:border-0">{visible.map(f => <td key={f.key} className="px-3 py-2 text-slate-700 whitespace-nowrap">{row[mapping[f.key]] || "—"}</td>)}</tr>)}</tbody>
            </table>
          </div>
        )}
        <div className="flex items-center gap-3">
          <button onClick={doImport} disabled={!mapping.nom || !mapping.prenom}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-40"
            style={{ background: PRIMARY }}>
            Importer {rows.length} patient{rows.length > 1 ? "s" : ""}
          </button>
          <button onClick={reset} className="text-sm text-slate-500 hover:text-slate-700">Annuler</button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-1 text-base font-semibold text-slate-800">Importer des patients</h2>
      <p className="mb-5 text-sm text-slate-500">
        Importez votre base clients depuis votre ancien logiciel. Formats acceptés : <strong>Excel (.xlsx, .xls)</strong> et <strong>CSV</strong>. Les colonnes sont détectées automatiquement.
      </p>
      <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
      <button onClick={() => fileRef.current?.click()}
        className="flex items-center justify-center gap-3 rounded-xl border border-dashed px-5 py-4 text-sm font-medium transition w-full"
        style={{ borderColor: "rgba(45,140,255,0.35)", background: "rgba(45,140,255,0.04)", color: PRIMARY }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        Choisir un fichier Excel ou CSV
      </button>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Zone Danger Vision
// ══════════════════════════════════════════════════════════════════════════════
function visionDailyCode(): string {
  const d = new Date();
  const seed = `THOR-RESET-VISION-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-K7mX9p`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  return Math.abs(h).toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
}

const VISION_RESET_KEYS = [
  "thor_pro_patients",
  "thor_pro_dossiers",
  "thor_pro_dossiers_history",
  "thor_pro_devis",
  "thor_pro_rdv",
  "thor_pro_sav",
  "thor_pro_factures",
  "thor_pro_ordonnances",
  "thor_pro_renouvellements_rappels",
  "thor_pro_lentilles_patients",
  "thor_pro_vision_consultations",
  "thor_pro_vision_tiers_payant",
  AGENDA_KEY,
  TARIF_KEY,
];

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
    <Card>
      <h2 className="mb-3 text-base font-semibold text-slate-800">Zone de danger</h2>
      <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm text-slate-500"
        style={{ background: "rgba(241,245,249,0.80)", border: "1px solid rgba(226,232,240,0.60)" }}>
        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        Accès réservé au gérant du cabinet.
      </div>
    </Card>
  );

  const code = visionDailyCode();

  function tryCode() {
    if (inputCode.trim().toUpperCase() === code) {
      VISION_RESET_KEYS.forEach(k => localStorage.removeItem(k));
      setStep("done");
    } else {
      setCodeError(true);
    }
  }

  return (
    <Card>
      <h2 className="mb-2 text-base font-semibold text-slate-800">Zone de danger</h2>
      <p className="mb-5 text-sm text-slate-500">
        Supprime définitivement toutes les données Vision. Action irréversible — un code de sécurité SAV est requis.
      </p>

      {step === "idle" && (
        <button onClick={() => setStep("demande")}
          className="rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100">
          Réinitialiser les données Vision
        </button>
      )}

      {step === "demande" && (
        <div style={{ border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.04)" }} className="rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.63 19a19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 3.12 4.18 2 2 0 0 1 5.09 2h3a2 2 0 0 1 2 1.72c.13 1 .36 1.98.72 2.9a2 2 0 0 1-.45 2.11L9.91 9.19a16 16 0 0 0 6 6l.46-.46a2 2 0 0 1 2.11-.45c.92.36 1.9.59 2.9.72A2 2 0 0 1 22 16.92Z"/></svg>
            <div>
              <p className="text-sm font-semibold text-slate-800">Un code de sécurité est nécessaire</p>
              <p className="text-xs text-slate-500 mt-1">
                Contactez le SAV THOR à <strong>sav@thor-logiciel.fr</strong> ou au <strong>01 XX XX XX XX</strong> avec votre numéro de licence. Le code sera envoyé à <strong>{gerantEmail || "votre adresse email"}</strong>.
              </p>
              <p className="text-[11px] text-slate-400 mt-2 italic">
                Code démo du jour : <span className="font-mono font-semibold text-slate-600">{code}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep("code")} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">J&apos;ai mon code</button>
            <button onClick={() => setStep("idle")} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
          </div>
        </div>
      )}

      {step === "code" && (
        <div style={{ border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.04)" }} className="rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-red-700">Saisissez le code reçu par email</p>
          <input value={inputCode} onChange={e => { setInputCode(e.target.value.toUpperCase()); setCodeError(false); }}
            placeholder="ex : A3K7Z2" maxLength={6}
            className="w-40 rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono text-center tracking-widest outline-none focus:ring-2 focus:ring-red-300 uppercase" />
          {codeError && <p className="text-xs text-red-500">Code incorrect. Vérifiez le code reçu par email.</p>}
          <div className="flex gap-2">
            <button onClick={tryCode} className="rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700">Confirmer la réinitialisation</button>
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
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: Données
// ══════════════════════════════════════════════════════════════════════════════
function TabDonnees() {
  function exportPatients() { downloadCSV("vision_patients.csv",  readJSONArray<Record<string, unknown>>("thor_pro_patients")); }
  function exportDossiers() { downloadCSV("vision_dossiers.csv",  readJSONArray<Record<string, unknown>>("thor_pro_dossiers")); }
  function exportDevis()    { downloadCSV("vision_devis.csv",     readJSONArray<Record<string, unknown>>("thor_pro_vision_devis")); }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="mb-5 text-base font-semibold text-slate-800">Exporter les données</h2>
        <div className="flex flex-col gap-3">
          {[
            { label: "Exporter Patients (CSV)", action: exportPatients, color: PRIMARY    },
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
      </Card>

      <SectionImportVision />

      <ZoneDangerVision />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: Verriers
// ══════════════════════════════════════════════════════════════════════════════
const TYPE_VERRE_LABEL: Record<VerreType | "bifocal", string> = {
  unifocal:   "Unifocal",
  progressif: "Progressif",
  degressif:  "Dégressif",
  bifocal:    "Bifocal",
};
const CLASSE_SS_CONFIG = {
  1: { bg: "rgba(16,185,129,0.1)",  text: "#065f46", border: "rgba(16,185,129,0.35)", label: "Cl. 1 — 100% Santé" },
  2: { bg: "rgba(59,130,246,0.1)",  text: "#1e40af", border: "rgba(59,130,246,0.35)", label: "Cl. 2"               },
};

function TabVerriers() {
  const [config, setConfig] = useState<StoreConfig>({ nom: "Clair Vision" });
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { setConfig(loadStoreConfig()); }, []);

  const selected: string[] = config.verriers ?? [];

  function toggleVerrier(v: string) {
    const next = selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v];
    const updated = { ...config, verriers: next };
    setConfig(updated);
    saveStoreConfig(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const filteredCatalog = VERRES_DB.filter(v =>
    selected.includes(v.marque) &&
    (search === "" ||
      v.gamme.toLowerCase().includes(search.toLowerCase()) ||
      v.designation.toLowerCase().includes(search.toLowerCase()) ||
      v.traitements.some(t => t.toLowerCase().includes(search.toLowerCase())))
  );

  const byMarque: Record<string, typeof filteredCatalog> = {};
  for (const v of filteredCatalog) {
    if (!byMarque[v.marque]) byMarque[v.marque] = [];
    byMarque[v.marque].push(v);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Sélection des verriers */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-800">Fournisseurs sélectionnés</h2>
          {saved && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              Enregistré
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Cochez les verriers avec lesquels vous travaillez. Seuls leurs verres apparaîtront dans les devis.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MARQUES_VERRES.map(verrier => {
            const isOn = selected.includes(verrier);
            const count = VERRES_DB.filter(v => v.marque === verrier).length;
            return (
              <button key={verrier} onClick={() => toggleVerrier(verrier)}
                className="flex items-center gap-3 rounded-xl border p-3 text-left transition"
                style={{
                  background: isOn ? `rgba(45,140,255,0.08)` : "rgba(255,255,255,0.6)",
                  borderColor: isOn ? `rgba(45,140,255,0.5)` : "rgba(203,213,225,0.7)",
                }}>
                <div className="flex h-5 w-5 items-center justify-center rounded-md border-2 flex-shrink-0 transition"
                  style={{
                    borderColor: isOn ? PRIMARY : "rgba(148,163,184,0.6)",
                    background: isOn ? PRIMARY : "transparent",
                  }}>
                  {isOn && (
                    <svg viewBox="0 0 12 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-2.5">
                      <polyline points="1 5 4.5 8.5 11 1"/>
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-800">{verrier}</div>
                  <div className="text-xs text-slate-400">{count} références</div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Catalogue des verriers sélectionnés */}
      {selected.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="text-base font-semibold text-slate-800">
              Catalogue ({filteredCatalog.length} verres)
            </h2>
            <input
              type="text"
              placeholder="Rechercher une gamme, référence…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white/70 px-3 py-1.5 text-sm text-slate-800 outline-none w-56"
            />
          </div>

          {Object.entries(byMarque).map(([marque, verres]) => {
            const byGamme: Record<string, typeof verres> = {};
            for (const v of verres) {
              if (!byGamme[v.gamme]) byGamme[v.gamme] = [];
              byGamme[v.gamme].push(v);
            }
            return (
              <div key={marque} className="mb-6 last:mb-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold text-slate-700">{marque}</span>
                  <span className="text-xs text-slate-400">{verres.length} verres</span>
                </div>
                {Object.entries(byGamme).map(([gamme, items]) => (
                  <div key={gamme} className="mb-3">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{gamme}</div>
                    <div className="flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                      {items.map(item => {
                        const cc = item.classeSS ? CLASSE_SS_CONFIG[item.classeSS] : null;
                        return (
                          <div key={item.id} className="flex items-center gap-3 px-3 py-2 bg-white/60">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-slate-700 truncate">{item.designation}</div>
                              <div className="text-xs text-slate-400">{item.traitements.join(" · ")}</div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs font-medium text-slate-500">n° {item.indice}</span>
                              <span className="text-xs font-medium text-slate-500">{TYPE_VERRE_LABEL[item.type]}</span>
                              {cc && (
                                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                  style={{ background: cc.bg, color: cc.text, border: `1px solid ${cc.border}` }}>
                                  {cc.label}
                                </span>
                              )}
                              <span className="text-xs font-semibold text-slate-700 w-16 text-right">{item.prixVenteTTC} €</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {filteredCatalog.length === 0 && search !== "" && (
            <p className="text-sm text-slate-400 text-center py-6">Aucun résultat pour &quot;{search}&quot;</p>
          )}
        </Card>
      )}

      {selected.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-12 h-12 mb-3 opacity-40">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <p className="text-sm font-medium">Sélectionnez au moins un verrier ci-dessus</p>
          <p className="text-xs mt-1">pour voir son catalogue et l&apos;utiliser dans vos devis.</p>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function ParametresVisionPage() {
  const [activeTab, setActiveTab] = useState<Tab>("general");

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configuration du cabinet, de l&apos;équipe et des préférences Clair Vision.
        </p>
      </div>

      <div style={glassSubtle} className="mb-6 flex gap-1 rounded-2xl p-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
              activeTab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "general"      && <TabGeneral />}
      {activeTab === "equipe"       && <TabEquipe />}
      {activeTab === "agenda"       && <TabAgenda />}
      {activeTab === "tarification" && <TabTarification />}
      {activeTab === "verriers"     && <TabVerriers />}
      {activeTab === "donnees"      && <TabDonnees />}
    </div>
  );
}
