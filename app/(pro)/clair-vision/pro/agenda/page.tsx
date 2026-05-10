"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { CSSProperties, ChangeEvent, ReactNode, KeyboardEvent as ReactKeyboardEvent } from "react";
import { loadUsers, type ProUser, type UserRole } from "@/lib/users";

/* ── Glass tokens ──────────────────────────────────────────────────────────── */
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

/* ── Data model ────────────────────────────────────────────────────────────── */
type RdvType = "controle" | "adaptation" | "livraison" | "urgence" | "autre";
type RdvStatut = "planifie" | "confirme" | "arrive" | "annule";
type RdvCategory = "rdv" | "bloc";
type BlocType = "pec" | "devis" | "facturer" | "fournisseur" | "notes" | "custom";

interface RendezVous {
  id: string;
  date: string;
  heure: string;
  duree: number;
  type: RdvType;
  category?: RdvCategory;
  blocType?: BlocType;
  blocCustom?: string;
  patientNom: string;
  patientPrenom: string;
  telephone?: string;
  notes?: string;
  praticien?: string;
  statut: RdvStatut;
  fromPatient?: boolean;   // booked from public /rendez-vous
  seen?: boolean;          // practitioner has opened it
}

/* ── Type colors ───────────────────────────────────────────────────────────── */
const TYPE_COLOR: Record<RdvType, { bg: string; border: string; text: string; label: string }> = {
  controle:   { bg: "rgba(99,102,241,0.12)",  border: "#6366f1", text: "#4338ca", label: "Contrôle" },
  adaptation: { bg: "rgba(16,185,129,0.12)",  border: "#10b981", text: "#065f46", label: "Adaptation" },
  livraison:  { bg: "rgba(245,158,11,0.12)",  border: "#f59e0b", text: "#92400e", label: "Livraison" },
  urgence:    { bg: "rgba(239,68,68,0.12)",   border: "#ef4444", text: "#991b1b", label: "Urgence" },
  autre:      { bg: "rgba(148,163,184,0.12)", border: "#94a3b8", text: "#475569", label: "Autre" },
};

const STATUT_LABEL: Record<RdvStatut, string> = {
  planifie: "Planifié", confirme: "Confirmé", arrive: "Arrivé", annule: "Annulé",
};

/* ── Bloc types ────────────────────────────────────────────────────────────── */
const BLOC_OPTIONS: { value: BlocType; label: string; color: string; bg: string; icon: string }[] = [
  { value: "pec",         label: "Faire PEC",    color: "#8B5CF6", bg: "rgba(139,92,246,0.12)",  icon: "" },
  { value: "devis",       label: "Faire Devis",  color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  icon: "" },
  { value: "facturer",    label: "Facturer",     color: "#10B981", bg: "rgba(16,185,129,0.12)",  icon: "" },
  { value: "fournisseur", label: "Fournisseur",  color: "#0EA5E9", bg: "rgba(14,165,233,0.12)",  icon: "" },
  { value: "notes",       label: "Notes",        color: "#94A3B8", bg: "rgba(148,163,184,0.12)", icon: "" },
  { value: "custom",      label: "Personnalisé", color: "#64748B", bg: "rgba(100,116,139,0.12)", icon: "" },
];

function getBlocInfo(rdv: RendezVous): { label: string; color: string; bg: string; icon: string } {
  const opt = BLOC_OPTIONS.find(b => b.value === rdv.blocType) ?? BLOC_OPTIONS[4]!;
  if (rdv.blocType === "custom") return { ...opt, label: rdv.blocCustom || "Personnalisé" };
  return opt;
}

/* ── Date helpers ──────────────────────────────────────────────────────────── */
function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function getMondayOf(d: Date): Date {
  const clone = new Date(d);
  const day = clone.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  clone.setDate(clone.getDate() + diff);
  clone.setHours(0, 0, 0, 0);
  return clone;
}
function addDays(d: Date, n: number): Date {
  const clone = new Date(d);
  clone.setDate(clone.getDate() + n);
  return clone;
}
function addWeeks(d: Date, n: number): Date { return addDays(d, n * 7); }

const FR_DAYS   = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const FR_MONTHS_SHORT = ["jan", "fév", "mar", "avr", "mai", "juin", "juil", "août", "sep", "oct", "nov", "déc"];
const FR_MONTHS_LONG  = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function dayIdx(d: Date): number { const g = d.getDay(); return g === 0 ? 6 : g - 1; }

function formatDayHeader(d: Date): { dayName: string; dayNum: string; month: string } {
  return { dayName: FR_DAYS[dayIdx(d)] ?? "?", dayNum: String(d.getDate()), month: FR_MONTHS_SHORT[d.getMonth()] ?? "" };
}
function formatWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  return `Semaine du lun ${monday.getDate()} ${FR_MONTHS_SHORT[monday.getMonth()]} au dim ${sunday.getDate()} ${FR_MONTHS_SHORT[sunday.getMonth()]} ${sunday.getFullYear()}`;
}
function formatMonthLabel(d: Date): string {
  return `${FR_MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

const WEEKDAY_TO_FR: Record<number, string> = {
  1: "lundi", 2: "mardi", 3: "mercredi", 4: "jeudi", 5: "vendredi", 6: "samedi", 0: "dimanche",
};
interface DayScheduleLS { ouvert: boolean; ouverture?: string; fermeture?: string; pauseActive?: boolean; pauseDebut?: string; pauseFin?: string; }
type WeekScheduleLS = Record<string, DayScheduleLS>;
const DEFAULT_WEEK_SCHEDULE: WeekScheduleLS = {
  lundi: { ouvert: true, ouverture: "09:00", fermeture: "19:00" },
  mardi: { ouvert: true, ouverture: "09:00", fermeture: "19:00" },
  mercredi: { ouvert: true, ouverture: "09:00", fermeture: "19:00" },
  jeudi: { ouvert: true, ouverture: "09:00", fermeture: "19:00" },
  vendredi: { ouvert: true, ouverture: "09:00", fermeture: "19:00" },
  samedi: { ouvert: true, ouverture: "09:00", fermeture: "13:00" },
  dimanche: { ouvert: false },
};
const PROFESSIONAL_ROLES = new Set<UserRole>(["Gérant", "Optométriste", "Opticien", "Visagiste"]);

const ROLE_XP: Partial<Record<UserRole, number>> = {
  "Gérant": 5, "Optométriste": 4, "Opticien": 3, "Visagiste": 2,
};

function hasTimeConflict(a: RendezVous, b: RendezVous): boolean {
  const s1 = hhmmToMinutes(a.heure), e1 = s1 + a.duree;
  const s2 = hhmmToMinutes(b.heure), e2 = s2 + b.duree;
  return s1 < e2 && e1 > s2;
}

function findSmartBest(
  candidates: ProUser[],
  affected: RendezVous[],
  allRdvs: RendezVous[],
  dateStr: string,
): ProUser | undefined {
  return candidates
    .filter(u => {
      const existing = allRdvs.filter(
        r => r.date === dateStr && r.statut !== "annule" &&
          (r.praticien === u.name || r.praticien === u.id)
      );
      return !affected.some(a => existing.some(e => hasTimeConflict(a, e)));
    })
    .sort((a, b) => {
      const xpDiff = (ROLE_XP[b.role] ?? 0) - (ROLE_XP[a.role] ?? 0);
      if (xpDiff !== 0) return xpDiff;
      const bkA = allRdvs.filter(r => r.date === dateStr && r.statut !== "annule" && (r.praticien === a.name || r.praticien === a.id)).reduce((s, r) => s + r.duree, 0);
      const bkB = allRdvs.filter(r => r.date === dateStr && r.statut !== "annule" && (r.praticien === b.name || r.praticien === b.id)).reduce((s, r) => s + r.duree, 0);
      return bkA - bkB;
    })[0];
}

interface DragState { dateStr: string; userId: string; startMin: number; endMin: number }
interface DragMoveState {
  rdv: RendezVous; userId: string; offsetMin: number;
  currentDateStr: string; currentUserId: string; currentMin: number; hasMoved: boolean;
}
type ViewMode = "week" | "month";

/* ── Time grid constants ───────────────────────────────────────────────────── */
const SLOT_START  = 8 * 60;    // 08:00
const SLOT_END    = 19 * 60;   // 19:00
const SLOT_STEP   = 10;        // 10-min drag granularity
const CELL_HEIGHT = 16;        // 16px per 10-min slot → 48px per 30 min
// TIME_LABELS: displayed every 30 min
const TIME_LABELS: string[] = [];
for (let m = SLOT_START; m < SLOT_END; m += 30) {
  TIME_LABELS.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
}
// HEURE_OPTIONS for select: every 10 min
const HEURE_OPTIONS: string[] = [];
for (let m = SLOT_START; m < SLOT_END; m += 10) {
  HEURE_OPTIONS.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
}

// Duration options (min) + label formatter
const DUREE_OPTIONS = [10, 15, 20, 30, 45, 60, 90, 120, 150, 180, 240];
function formatDuree(d: number): string {
  if (d < 60) return `${d} min`;
  const h = Math.floor(d / 60);
  const m = d % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

function minutesToHHMM(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}
function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/* ── Agenda config ─────────────────────────────────────────────────────────── */
const AGENDA_KEY   = "thor_pro_parametres_agenda";
const PRESENCE_KEY = "thor_pro_agenda_presence";

function loadAgendaConfig(): { schedule: WeekScheduleLS; defaultDuree: number } {
  if (typeof window === "undefined") return { schedule: DEFAULT_WEEK_SCHEDULE, defaultDuree: 30 };
  try {
    const raw = localStorage.getItem(AGENDA_KEY);
    if (!raw) return { schedule: DEFAULT_WEEK_SCHEDULE, defaultDuree: 30 };
    const parsed = JSON.parse(raw) as { schedule?: WeekScheduleLS; duree?: string };
    return {
      schedule: parsed.schedule ?? DEFAULT_WEEK_SCHEDULE,
      defaultDuree: parseInt(parsed.duree ?? "30") || 30,
    };
  } catch { return { schedule: DEFAULT_WEEK_SCHEDULE, defaultDuree: 30 }; }
}
function loadPresence(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try { const raw = localStorage.getItem(PRESENCE_KEY); return raw ? (JSON.parse(raw) as Record<string, string[]>) : {}; } catch { return {}; }
}
function savePresence(data: Record<string, string[]>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PRESENCE_KEY, JSON.stringify(data));
}

/* ── localStorage helpers ──────────────────────────────────────────────────── */
const LS_KEY = "thor_pro_rdv";
function loadRdvs(): RendezVous[] {
  if (typeof window === "undefined") return [];
  try { const raw = localStorage.getItem(LS_KEY); if (!raw) return []; return JSON.parse(raw) as RendezVous[]; } catch { return []; }
}
function saveRdvs(rdvs: RendezVous[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(rdvs));
}
function genId(): string { return `rdv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }

/* ── Modal state ───────────────────────────────────────────────────────────── */
interface ModalState { open: boolean; mode: "create" | "edit"; rdv: RendezVous; deleteConfirm: boolean; }

function emptyRdv(date = "", heure = "09:00", duree = 30, praticien = "", category: RdvCategory = "rdv"): RendezVous {
  return { id: "", date, heure, duree, type: "controle", statut: "planifie", category, patientNom: "", patientPrenom: "", telephone: "", notes: "", praticien };
}

/* ── Reassign state ─────────────────────────────────────────────────────────── */
interface ReassignState {
  open: boolean;
  dateStr: string;
  absentUserId: string;
  rdvsAffected: RendezVous[];
  availableProfs: ProUser[];
  selectedTargetId: string;
  smartTargetId: string;
}

/* ── Reassign confirm modal ──────────────────────────────────────────────────── */
function ReassignConfirmModal({
  state, allRdvs, onConfirm, onSkip, onClose,
}: {
  state: ReassignState;
  allRdvs: RendezVous[];
  onConfirm: (targetId: string) => void;
  onSkip: () => void;
  onClose: () => void;
}) {
  const [targetId, setTargetId] = useState(state.selectedTargetId);

  if (!state.open) return null;

  const absentUser = state.availableProfs.find(u => u.id === state.absentUserId) ??
    { name: "Ce praticien", color: "#94a3b8", initials: "?" } as ProUser;

  const dayRdvs = allRdvs.filter(r => r.date === state.dateStr && r.statut !== "annule");
  const bookedMin = (u: ProUser) =>
    dayRdvs.filter(r => r.praticien === u.name || r.praticien === u.id).reduce((s, r) => s + r.duree, 0);

  /** Conflits horaires : RDV existants du praticien qui chevauchent les RDV à réassigner */
  const getConflicts = (u: ProUser): RendezVous[] => {
    const existing = dayRdvs.filter(r => r.praticien === u.name || r.praticien === u.id);
    return existing.filter(e => state.rdvsAffected.some(a => hasTimeConflict(a, e)));
  };

  const targetUser = state.availableProfs.find(u => u.id === targetId);

  const dateFr = new Date(state.dateStr).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });

  const btnBase: CSSProperties = { padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none" };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 20, boxShadow: "0 24px 64px rgba(0,0,0,0.2)", width: "100%", maxWidth: 520 }}
      >
        {/* Header */}
        <div style={{ background: "rgba(239,68,68,0.06)", borderBottom: "2px solid rgba(239,68,68,0.2)", borderRadius: "20px 20px 0 0", padding: "18px 24px 14px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: (absentUser as ProUser).color ?? "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{(absentUser as ProUser).initials ?? "?"}</span>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#ef4444", marginBottom: 2 }}>Absence détectée</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
              {(absentUser as ProUser).name} · {dateFr}
            </div>
          </div>
        </div>

        <div style={{ padding: "20px 24px 24px" }}>
          {/* RDVs impactés */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              {state.rdvsAffected.length} RDV à réassigner
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {state.rdvsAffected.map(r => {
                const isBloc = r.category === "bloc";
                const label = isBloc ? (getBlocInfo(r).label) : `${r.patientPrenom} ${r.patientNom}`;
                const c = isBloc ? getBlocInfo(r) : TYPE_COLOR[r.type];
                return (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: "bg" in c ? c.bg : "rgba(148,163,184,0.1)", border: `1px solid ${"border" in c ? c.border : c.color}30` }}>
                    <div style={{ width: 3, height: 32, borderRadius: 2, background: "border" in c ? c.border : c.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{label}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{r.heure} · {formatDuree(r.duree)}</div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "text" in c ? c.text : c.color, background: "var(--glass-strong-bg)", padding: "2px 8px", borderRadius: 6 }}>
                      {"label" in c ? c.label : "RDV"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Choix du praticien cible */}
          {state.availableProfs.filter(u => u.id !== state.absentUserId).length > 0 ? (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                Réassigner à
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {state.availableProfs
                  .filter(u => u.id !== state.absentUserId)
                  .map(u => ({ u, conflicts: getConflicts(u) }))
                  .sort((a, b) => a.conflicts.length - b.conflicts.length)
                  .map(({ u, conflicts }) => {
                    const bm = bookedMin(u);
                    const isSelected = u.id === targetId;
                    const hasConflict = conflicts.length > 0;
                    const pct = Math.min(100, Math.round((bm / 480) * 100));
                    return (
                      <button
                        key={u.id}
                        onClick={() => setTargetId(u.id)}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 14px", borderRadius: 12,
                          border: `2px solid ${isSelected ? u.color : hasConflict ? "rgba(239,68,68,0.35)" : "rgba(203,213,225,0.6)"}`,
                          background: isSelected ? `${u.color}10` : hasConflict ? "rgba(239,68,68,0.04)" : "#f8fafc",
                          cursor: "pointer", textAlign: "left", transition: "all 0.12s",
                          opacity: hasConflict ? 0.85 : 1,
                        }}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: u.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>{u.initials}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{u.name}</div>
                            {u.id === state.smartTargetId && (
                              <span style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 6, padding: "1px 6px" }}>Recommandé</span>
                            )}
                            {!hasConflict && u.id !== state.smartTargetId && (
                              <span style={{ fontSize: 10, fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 6, padding: "1px 6px" }}>Libre</span>
                            )}
                            {hasConflict && (
                              <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "1px 6px" }}>
                                Conflit horaire
                              </span>
                            )}
                          </div>
                          {hasConflict && (
                            <div style={{ marginTop: 3, display: "flex", flexDirection: "column", gap: 1 }}>
                              {conflicts.map(c => (
                                <span key={c.id} style={{ fontSize: 10, color: "#ef4444" }}>
                                  Occupé {c.heure}–{(() => { const m = hhmmToMinutes(c.heure) + c.duree; return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; })()}
                                  {" · "}{c.patientPrenom} {c.patientNom}
                                </span>
                              ))}
                            </div>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
                            <div style={{ flex: 1, height: 4, borderRadius: 4, background: "rgba(203,213,225,0.5)", overflow: "hidden" }}>
                              <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: u.color }} />
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "#64748b", flexShrink: 0 }}>{formatDuree(bm)} réservées</span>
                          </div>
                        </div>
                        {isSelected && (
                          <svg viewBox="0 0 16 16" fill="none" width="16" height="16" style={{ flexShrink: 0, marginTop: 8 }}>
                            <circle cx="8" cy="8" r="7" fill={u.color} /><path d="M5 8l2.5 2.5L11 5.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 20, padding: "12px 14px", borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)" }}>
              <span style={{ fontSize: 13, color: "#92400e" }}>Aucun autre praticien disponible ce jour-là pour réassigner les RDV.</span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <button onClick={onSkip} style={{ ...btnBase, background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
              Marquer absent sans réassigner
            </button>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {state.smartTargetId && state.availableProfs.some(u => u.id === state.smartTargetId && u.id !== state.absentUserId) && (
                <button
                  onClick={() => onConfirm(state.smartTargetId)}
                  style={{ ...btnBase, background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", boxShadow: "0 2px 12px rgba(245,158,11,0.4)" }}
                >
                  Réassignation automatique
                </button>
              )}
              <button onClick={onClose} style={{ ...btnBase, background: "#f1f5f9", color: "#475569" }}>Annuler</button>
              {targetId && state.availableProfs.some(u => u.id === targetId && u.id !== state.absentUserId) && (
                <button
                  onClick={() => onConfirm(targetId)}
                  style={{ ...btnBase, background: targetUser?.color ?? "#6366f1", color: "#fff", boxShadow: `0 2px 12px ${targetUser?.color ?? "#6366f1"}40` }}
                >
                  Réassigner à {targetUser?.name}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Icons ─────────────────────────────────────────────────────────────────── */
function IconChevronLeft() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>; }
function IconChevronRight() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>; }
function IconPlus() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>; }
function IconX() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>; }
function IconTrash() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>; }
function IconCalGrid() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>; }
function IconWeek() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 2v4M16 2v4M3 9h18M3 14h18M3 19h18"/></svg>; }

/* ── RDV Block (redesigned) ─────────────────────────────────────────────────── */
const UNSEEN_PULSE_STYLE = `
@keyframes rdvPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,165,0,0.7), 0 0 0 2px rgba(255,165,0,0.4); }
  50%       { box-shadow: 0 0 0 4px rgba(255,165,0,0), 0 0 0 2px rgba(255,165,0,0.6); }
}
`;

function RdvBlock({ rdv, userId, onEdit, onDragMoveStart, isDragging }: {
  rdv: RendezVous; userId: string;
  onEdit: (r: RendezVous) => void;
  onDragMoveStart: (rdv: RendezVous, offsetMin: number, userId: string) => void;
  isDragging?: boolean;
}) {
  const isBloc             = rdv.category === "bloc";
  const isArrive           = rdv.statut === "arrive";
  const isAnnule           = rdv.statut === "annule";
  const isNewFromPatient   = !!rdv.fromPatient && !rdv.seen;

  const startMin = hhmmToMinutes(rdv.heure);
  const topPx    = ((startMin - SLOT_START) / SLOT_STEP) * CELL_HEIGHT;
  const heightPx = Math.max((rdv.duree / SLOT_STEP) * CELL_HEIGHT - 2, 14);

  let accentColor: string, bgColor: string, labelText: string, subText: string;
  if (isBloc) {
    const info = getBlocInfo(rdv);
    accentColor = info.color;
    bgColor     = info.bg;
    labelText   = info.label;
    subText     = rdv.heure;
  } else {
    const c = TYPE_COLOR[rdv.type];
    accentColor = isNewFromPatient ? "#f97316" : c.border;
    bgColor     = isNewFromPatient
      ? "rgba(255,237,213,0.85)"
      : isArrive ? c.bg.replace("0.12", "0.25") : c.bg;
    labelText   = `${rdv.patientPrenom} ${rdv.patientNom}`.trim();
    subText     = c.label;
  }

  return (
    <>
      <style>{UNSEEN_PULSE_STYLE}</style>
      <div
        onMouseDown={(e) => {
          e.stopPropagation(); e.preventDefault();
          const offsetMin = Math.round(e.nativeEvent.offsetY / CELL_HEIGHT) * SLOT_STEP;
          onDragMoveStart(rdv, offsetMin, userId);
        }}
        title={isBloc ? labelText : `${labelText} — ${subText} — ${rdv.heure} (${rdv.duree} min)${isNewFromPatient ? " — Nouveau (pris en ligne)" : ""}`}
        style={{
          position: "absolute",
          top: topPx + 1, left: 2, right: 2,
          height: heightPx,
          background: bgColor,
          borderRadius: 5,
          borderLeft: `3px solid ${accentColor}`,
          border: isNewFromPatient ? `2px solid #f97316` : `1px solid ${accentColor}30`,
          borderLeftWidth: isNewFromPatient ? 3 : 3,
          cursor: isDragging ? "grabbing" : "grab",
          overflow: "hidden",
          opacity: isDragging ? 0.15 : isAnnule ? 0.45 : 1,
          zIndex: isNewFromPatient ? 3 : 2,
          boxShadow: isNewFromPatient
            ? "0 0 0 2px rgba(249,115,22,0.4)"
            : isArrive ? `0 0 0 1.5px ${accentColor}99` : "none",
          animation: isNewFromPatient ? "rdvPulse 1.2s ease-in-out infinite" : undefined,
          transition: "opacity 0.1s",
        }}
      >
        <div style={{ padding: "2px 5px 2px 4px", overflow: "hidden" }}>
          <div style={{
            fontSize: 10.5,
            fontWeight: isArrive ? 800 : isBloc ? 600 : 600,
            color: isNewFromPatient ? "#c2410c" : isBloc ? accentColor : TYPE_COLOR[rdv.type]?.text ?? "#1e293b",
            lineHeight: 1.3,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            display: "flex", alignItems: "center", gap: 2,
          }}>
            {isNewFromPatient && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f97316", flexShrink: 0, display: "inline-block", marginRight: 2, animation: "rdvPulse 1.2s ease-in-out infinite" }} />}
            {isArrive && !isNewFromPatient && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", flexShrink: 0, display: "inline-block", marginRight: 2 }} />}
            {isBloc && <span style={{ fontSize: 9, marginRight: 2 }}>{getBlocInfo(rdv).icon}</span>}
            {labelText}
          </div>
          {heightPx > 24 && (
            <div style={{ fontSize: 9, color: accentColor, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 }}>
              {isNewFromPatient ? "En ligne · " : ""}{rdv.heure}{isBloc ? "" : ` · ${rdv.duree}m`}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Patient helpers ───────────────────────────────────────────────────────── */
interface PatientLS { id: string; nom: string; prenom: string; telephone?: string; email?: string }
function loadPatientsLS(): PatientLS[] {
  if (typeof window === "undefined") return [];
  try { const raw = localStorage.getItem("thor_pro_patients"); if (!raw) return []; return JSON.parse(raw) as PatientLS[]; } catch { return []; }
}
function upsertPatientFromRdv(rdv: RendezVous): void {
  if (typeof window === "undefined") return;
  if (!rdv.patientNom.trim() || !rdv.patientPrenom.trim()) return;
  const raw = localStorage.getItem("thor_pro_patients");
  const existing: PatientLS[] = raw ? (JSON.parse(raw) as PatientLS[]) : [];
  const already = existing.some(p =>
    p.nom.toLowerCase() === rdv.patientNom.toLowerCase() &&
    p.prenom.toLowerCase() === rdv.patientPrenom.toLowerCase()
  );
  if (already) return;
  const newP = {
    id: `pat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nom: rdv.patientNom.trim(),
    prenom: rdv.patientPrenom.trim(),
    dateNaissance: "",
    telephone: rdv.telephone?.trim() ?? "",
    notes: rdv.notes?.trim() ?? "",
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem("thor_pro_patients", JSON.stringify([...existing, newP]));
}
function patientInitials(nom: string, prenom: string): string { return `${(prenom[0] ?? "").toUpperCase()}${(nom[0] ?? "").toUpperCase()}`; }
const PAT_COLORS = ["#6366f1", "#8B5CF6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"] as const;
function patientAvatarColor(name: string): string {
  let h = 0; for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return PAT_COLORS[h % PAT_COLORS.length] ?? "#6366f1";
}

interface PatientSearchInputProps {
  initialNom: string; initialPrenom: string;
  onSelect: (p: PatientLS) => void; onClear: () => void;
  onFreeText: (t: string) => void; selectedPatient: PatientLS | null;
}
function PatientSearchInput({ initialNom, initialPrenom, onSelect, onClear, onFreeText, selectedPatient }: PatientSearchInputProps) {
  const [query, setQuery] = useState(selectedPatient ? `${selectedPatient.prenom} ${selectedPatient.nom}` : `${initialPrenom} ${initialNom}`.trim());
  const [results, setResults] = useState<PatientLS[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (selectedPatient) setQuery(`${selectedPatient.prenom} ${selectedPatient.nom}`.trim()); }, [selectedPatient]);
  useEffect(() => {
    if (query.trim().length >= 2) {
      const q = query.toLowerCase();
      const f = loadPatientsLS().filter(p => p.nom.toLowerCase().includes(q) || p.prenom.toLowerCase().includes(q));
      setResults(f.slice(0, 8)); setShowNew(f.length === 0); setOpen(true); setActiveIdx(-1);
    } else { setResults([]); setShowNew(false); setOpen(false); }
  }, [query]);
  useEffect(() => {
    function h(e: MouseEvent) { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  const inputStyle: CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 10, border: "1.5px solid rgba(203,213,225,0.8)", background: "var(--glass-strong-bg)", fontSize: 14, color: "#1e293b", outline: "none", boxSizing: "border-box" };

  function handleKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    const total = results.length + (showNew ? 1 : 0);
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, total - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && activeIdx < results.length) { const p = results[activeIdx]; if (p) { onSelect(p); setQuery(`${p.prenom} ${p.nom}`.trim()); setOpen(false); } }
      else if (showNew) { onFreeText(query.trim()); setOpen(false); }
    } else if (e.key === "Escape") setOpen(false);
  }

  if (selectedPatient) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, border: "1.5px solid rgba(99,102,241,0.4)", background: "rgba(99,102,241,0.06)" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: patientAvatarColor(selectedPatient.nom), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{patientInitials(selectedPatient.nom, selectedPatient.prenom)}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{selectedPatient.prenom} {selectedPatient.nom}</div>
          {selectedPatient.telephone && <div style={{ fontSize: 12, color: "#64748b" }}>{selectedPatient.telephone}</div>}
        </div>
        <button onClick={onClear} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4, borderRadius: 6 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </button>
      </div>
    );
  }
  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input style={inputStyle} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown}
        onFocus={() => { if (results.length > 0 || showNew) setOpen(true); }} placeholder="Rechercher un patient…" autoComplete="off" />
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 9999, background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.14)", border: "1px solid rgba(148,163,184,0.3)", overflow: "hidden" }}>
          {results.map((p, i) => (
            <button key={p.id} onMouseDown={() => { onSelect(p); setQuery(`${p.prenom} ${p.nom}`.trim()); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", background: i === activeIdx ? "rgba(99,102,241,0.08)" : "transparent", border: "none", borderBottom: i < results.length - 1 ? "1px solid rgba(148,163,184,0.12)" : "none", cursor: "pointer", textAlign: "left" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: patientAvatarColor(p.nom), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{patientInitials(p.nom, p.prenom)}</span>
              </div>
              <div><div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{p.prenom} {p.nom}</div>
                {p.telephone && <div style={{ fontSize: 11, color: "#64748b" }}>{p.telephone}</div>}</div>
            </button>
          ))}
          {showNew && (
            <button onMouseDown={() => { onFreeText(query.trim()); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 12px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/></svg>
              <span style={{ fontSize: 13, color: "#6366f1", fontWeight: 600 }}>Nouveau patient : &ldquo;{query.trim()}&rdquo;</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── RDV Modal ─────────────────────────────────────────────────────────────── */
function RdvModal({
  state, onChange, onPatientSelect, onPatientClear, selectedPatient, onSave, onDelete, onClose,
}: {
  state: ModalState;
  onChange: (field: keyof RendezVous, value: string | number) => void;
  onPatientSelect: (p: PatientLS) => void;
  onPatientClear: () => void;
  selectedPatient: PatientLS | null;
  onSave: () => void; onDelete: () => void; onClose: () => void;
}) {
  if (!state.open) return null;
  const { rdv, mode, deleteConfirm } = state;
  const isBloc = rdv.category === "bloc";

  const isValid = isBloc
    ? rdv.date !== "" && rdv.heure !== ""
    : rdv.patientNom.trim() !== "" && rdv.patientPrenom.trim() !== "" && rdv.date !== "" && rdv.heure !== "";

  // Options dynamiques : inclure la valeur actuelle si hors liste
  const heureOptions = HEURE_OPTIONS.includes(rdv.heure)
    ? HEURE_OPTIONS
    : [...HEURE_OPTIONS, rdv.heure].sort();
  const dureeOptions = DUREE_OPTIONS.includes(rdv.duree)
    ? DUREE_OPTIONS
    : [...DUREE_OPTIONS, rdv.duree].sort((a, b) => a - b);

  const inputStyle: CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 14, color: "#1e293b", outline: "none", boxSizing: "border-box" };
  const selectStyle: CSSProperties = { ...inputStyle, appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%2394a3b8' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C%2Fsvg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 32 };

  function field(label: string, content: ReactNode) {
    return (
      <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>{label}</label>{content}</div>
    );
  }
  function handleInput(f: keyof RendezVous) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange(f, e.target.value);
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, boxShadow: "0 24px 64px rgba(0,0,0,0.18)", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>

        {/* Bande couleur + header */}
        <div style={{
          background: isBloc
            ? (getBlocInfo(rdv).bg)
            : TYPE_COLOR[rdv.type]?.bg ?? "rgba(99,102,241,0.08)",
          borderBottom: `2px solid ${isBloc ? getBlocInfo(rdv).color : (TYPE_COLOR[rdv.type]?.border ?? "#6366f1")}`,
          borderRadius: "20px 20px 0 0",
          padding: "18px 24px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: isBloc ? getBlocInfo(rdv).color : (TYPE_COLOR[rdv.type]?.text ?? "#4338ca"), marginBottom: 2 }}>
              {isBloc ? "Bloc interne" : (TYPE_COLOR[rdv.type]?.label ?? "RDV")}
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", margin: 0 }}>
              {mode === "create" ? "Nouveau rendez-vous" : "Modifier le rendez-vous"}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: "var(--glass-strong-bg)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b", flexShrink: 0 }}><IconX /></button>
        </div>

        <div style={{ padding: "20px 24px 24px" }}>

        {/* Category toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, padding: 4, background: "rgba(241,245,249,0.8)", borderRadius: 12 }}>
          {([["rdv", "Rendez-vous patient"], ["bloc", "Bloc interne"]] as const).map(([cat, label]) => (
            <button key={cat} onClick={() => onChange("category", cat)}
              style={{ flex: 1, padding: "7px 10px", borderRadius: 9, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                background: rdv.category === cat ? (cat === "bloc" ? "#6366f1" : "#6366f1") : "transparent",
                color: rdv.category === cat ? "white" : "#64748b",
                boxShadow: rdv.category === cat ? "0 2px 8px rgba(99,102,241,0.25)" : "none",
              }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          {isBloc ? (
            /* ── Bloc type picker ── */
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8 }}>Type de bloc</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {BLOC_OPTIONS.map(opt => {
                  const isSelected = rdv.blocType === opt.value;
                  return (
                    <button key={opt.value} onClick={() => onChange("blocType", opt.value)}
                      style={{ padding: "10px 8px", borderRadius: 10, border: `1.5px solid ${isSelected ? opt.color : "rgba(203,213,225,0.7)"}`, background: isSelected ? opt.bg : "rgba(255,255,255,0.75)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.12s" }}>
                      <span style={{ fontSize: 18 }}>{opt.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? opt.color : "#64748b" }}>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              {rdv.blocType === "custom" && (
                <div style={{ marginTop: 10 }}>
                  {field("Nom personnalisé",
                    <input style={inputStyle} value={rdv.blocCustom ?? ""} onChange={handleInput("blocCustom")} placeholder="ex: Réunion équipe" />
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ── Patient search ── */
            <>
              {field("Patient *",
                <PatientSearchInput initialNom={rdv.patientNom} initialPrenom={rdv.patientPrenom} selectedPatient={selectedPatient}
                  onSelect={onPatientSelect} onClear={onPatientClear}
                  onFreeText={(text) => {
                    const parts = text.trim().split(/\s+/);
                    onChange("patientPrenom", parts[0] ?? "");
                    onChange("patientNom", parts.slice(1).join(" ") || (parts[0] ?? ""));
                  }} />
              )}
              {selectedPatient && (
                <a href={`/clair-vision/pro/patients/${selectedPatient.id}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#6366f1", textDecoration: "none" }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M7 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 2h4v4M14 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Voir la fiche patient
                </a>
              )}
            </>
          )}

          {/* Date + Heure */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {field("Date *", <input type="date" style={inputStyle} value={rdv.date} onChange={handleInput("date")} />)}
            {field("Heure *", <select style={selectStyle} value={rdv.heure} onChange={handleInput("heure")}>{heureOptions.map(h => <option key={h} value={h}>{h}</option>)}</select>)}
          </div>

          {/* Durée + Type (only for RDV) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {field("Durée (min)",
              <select style={selectStyle} value={rdv.duree} onChange={e => onChange("duree", parseInt(e.target.value))}>
                {dureeOptions.map(d => <option key={d} value={d}>{formatDuree(d)}</option>)}
              </select>
            )}
            {!isBloc && field("Type",
              <select style={selectStyle} value={rdv.type} onChange={handleInput("type")}>
                {(Object.entries(TYPE_COLOR) as [RdvType, typeof TYPE_COLOR[RdvType]][]).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            )}
          </div>

          {/* Statut + Praticien */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {!isBloc && field("Statut",
              <select style={selectStyle} value={rdv.statut} onChange={handleInput("statut")}>
                {(Object.entries(STATUT_LABEL) as [RdvStatut, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            )}
            {field("Praticien",
              <input style={inputStyle} value={rdv.praticien ?? ""} onChange={handleInput("praticien")} placeholder="Dr Moreau" />
            )}
          </div>

          {/* Téléphone (rdv only) */}
          {!isBloc && field("Téléphone", <input style={inputStyle} value={rdv.telephone ?? ""} onChange={handleInput("telephone")} placeholder="06 12 34 56 78" />)}

          {/* Notes */}
          {field("Notes",
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 64 }} value={rdv.notes ?? ""} onChange={handleInput("notes")} placeholder="Informations complémentaires…" />
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24, gap: 12 }}>
          <div>
            {mode === "edit" && !deleteConfirm && (
              <button onClick={() => onChange("id", "__delete_confirm__")}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.25)", color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <IconTrash /> Supprimer
              </button>
            )}
            {mode === "edit" && deleteConfirm && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>Confirmer ?</span>
                <button onClick={onDelete} style={{ padding: "6px 12px", borderRadius: 8, background: "#ef4444", border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Oui, supprimer</button>
                <button onClick={() => onChange("id", rdv.id)} style={{ padding: "6px 12px", borderRadius: 8, ...glassSubtle, fontSize: 13, cursor: "pointer", color: "#475569" }}>Annuler</button>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 10, ...glassSubtle, fontSize: 14, fontWeight: 500, color: "#475569", cursor: "pointer", border: "1.5px solid rgba(203,213,225,0.7)" }}>Annuler</button>
            <button onClick={onSave} disabled={!isValid}
              style={{ padding: "9px 22px", borderRadius: 10, background: isValid ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "rgba(148,163,184,0.3)", border: "none", color: isValid ? "white" : "#94a3b8", fontSize: 14, fontWeight: 600, cursor: isValid ? "pointer" : "not-allowed", boxShadow: isValid ? "0 2px 12px rgba(99,102,241,0.3)" : "none" }}>
              {mode === "create" ? "Créer" : "Enregistrer"}
            </button>
          </div>
        </div>
        </div>{/* end padding wrapper */}
      </div>
    </div>
  );
}

/* ── Month View ─────────────────────────────────────────────────────────────── */
function MonthView({ rdvs, weekStart, todayStr, onDayClick }: {
  rdvs: RendezVous[]; weekStart: Date; todayStr: string; onDayClick: (d: Date) => void;
}) {
  const year  = weekStart.getFullYear();
  const month = weekStart.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth  = new Date(year, month + 1, 0);

  const gridStart = getMondayOf(firstOfMonth);
  // ensure we cover until Sunday after lastOfMonth
  const daysNeeded = dayIdx(lastOfMonth) === 6 ? 0 : 6 - dayIdx(lastOfMonth);
  const gridEnd = addDays(lastOfMonth, daysNeeded);

  const cells: Date[] = [];
  for (let d = new Date(gridStart); d <= gridEnd; d = addDays(d, 1)) cells.push(new Date(d));

  return (
    <div style={{ ...glass, borderRadius: 20, overflow: "hidden" }}>
      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid rgba(203,213,225,0.4)" }}>
        {FR_DAYS.map(d => (
          <div key={d} style={{ padding: "10px 4px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {d}
          </div>
        ))}
      </div>
      {/* Calendar cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {cells.map(day => {
          const dateStr = isoDate(day);
          const isCurrentMonth = day.getMonth() === month;
          const isToday = dateStr === todayStr;
          const dayRdvs = rdvs.filter(r => r.date === dateStr && r.statut !== "annule");
          const topRdvs = dayRdvs.slice(0, 3);
          const overflow = dayRdvs.length - 3;

          return (
            <div key={dateStr} onClick={() => onDayClick(day)}
              style={{
                minHeight: 90, padding: "6px 5px", borderTop: "1px solid rgba(203,213,225,0.3)",
                borderLeft: "1px solid rgba(203,213,225,0.2)", cursor: "pointer",
                opacity: isCurrentMonth ? 1 : 0.3,
                background: isToday ? "rgba(99,102,241,0.04)" : "transparent",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = isToday ? "rgba(99,102,241,0.07)" : "rgba(99,102,241,0.03)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isToday ? "rgba(99,102,241,0.04)" : "transparent"; }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 3,
                background: isToday ? "#6366f1" : "transparent",
                color: isToday ? "white" : isCurrentMonth ? "#1e293b" : "#94a3b8",
                fontSize: 12, fontWeight: isToday ? 700 : 500,
              }}>{day.getDate()}</div>
              {topRdvs.map(rdv => {
                const isBloc = rdv.category === "bloc";
                const c = isBloc ? getBlocInfo(rdv) : TYPE_COLOR[rdv.type];
                const name = isBloc ? getBlocInfo(rdv).label : `${rdv.patientPrenom} ${rdv.patientNom}`.trim();
                const isArrive = rdv.statut === "arrive";
                return (
                  <div key={rdv.id} style={{
                    fontSize: 9.5, fontWeight: isArrive ? 700 : 500, padding: "1.5px 4px", borderRadius: 3, marginBottom: 1.5,
                    background: "bg" in c ? c.bg : "rgba(148,163,184,0.12)",
                    color: "text" in c ? c.text : c.color,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    borderLeft: `2px solid ${"border" in c ? c.border : c.color}`,
                  }}>
                    {rdv.heure} {name}
                  </div>
                );
              })}
              {overflow > 0 && (
                <div style={{ fontSize: 9, color: "#94a3b8", paddingLeft: 2, marginTop: 1 }}>+{overflow} autre{overflow > 1 ? "s" : ""}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────────────────── */
export default function AgendaPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOf(new Date()));
  const [rdvs, setRdvs] = useState<RendezVous[]>([]);
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedPatient, setSelectedPatient] = useState<PatientLS | null>(null);
  const [staffUsers, setStaffUsers] = useState<ProUser[]>([]);
  const [presenceByDate, setPresenceByDate] = useState<Record<string, string[]>>({});
  const [weekSchedule, setWeekSchedule] = useState<WeekScheduleLS>(DEFAULT_WEEK_SCHEDULE);
  const [defaultDuree, setDefaultDuree] = useState(30);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragMoveState, setDragMoveState] = useState<DragMoveState | null>(null);
  const gridBodyRef = useRef<HTMLDivElement>(null);

  const [modal, setModal] = useState<ModalState>({ open: false, mode: "create", rdv: emptyRdv(), deleteConfirm: false });
  const [reassignModal, setReassignModal] = useState<ReassignState>({
    open: false, dateStr: "", absentUserId: "", rdvsAffected: [], availableProfs: [], selectedTargetId: "", smartTargetId: "",
  });

  useEffect(() => {
    setRdvs(loadRdvs());
    setStaffUsers(loadUsers());
    setPresenceByDate(loadPresence());
    const cfg = loadAgendaConfig();
    setWeekSchedule(cfg.schedule);
    setDefaultDuree(cfg.defaultDuree);
    setMounted(true);
  }, []);

  const weekDays: Date[] = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const rdvsByDate = useCallback((dateStr: string) => rdvs.filter(r => r.date === dateStr), [rdvs]);
  const totalRows = (SLOT_END - SLOT_START) / SLOT_STEP; // 66

  /* ── Navigation ── */
  function goToToday() { setWeekStart(getMondayOf(new Date())); }
  function prevPeriod() {
    if (viewMode === "week") { setWeekStart(w => getMondayOf(addWeeks(w, -1))); }
    else { setWeekStart(w => { const d = new Date(w); d.setMonth(d.getMonth() - 1); d.setDate(1); return getMondayOf(d); }); }
  }
  function nextPeriod() {
    if (viewMode === "week") { setWeekStart(w => getMondayOf(addWeeks(w, 1))); }
    else { setWeekStart(w => { const d = new Date(w); d.setMonth(d.getMonth() + 1); d.setDate(1); return getMondayOf(d); }); }
  }

  /* ── Modal ── */
  function openCreate(date: string, heure: string, duree?: number, praticienName?: string, cat: RdvCategory = "rdv") {
    setSelectedPatient(null);
    setModal({ open: true, mode: "create", rdv: emptyRdv(date, heure, duree ?? defaultDuree, praticienName ?? "", cat), deleteConfirm: false });
  }
  function openEdit(rdv: RendezVous) {
    setSelectedPatient(null);
    // Mark patient-booked unseen RDVs as seen when opened
    let rdvToOpen = { ...rdv };
    if (rdv.fromPatient && !rdv.seen) {
      rdvToOpen = { ...rdv, seen: true };
      const updated = rdvs.map(r => r.id === rdv.id ? { ...r, seen: true } : r);
      saveRdvs(updated);
      setRdvs(updated);
    }
    setModal({ open: true, mode: "edit", rdv: rdvToOpen, deleteConfirm: false });
  }
  function closeModal() { setSelectedPatient(null); setModal(m => ({ ...m, open: false, deleteConfirm: false })); }

  function handlePatientSelect(p: PatientLS) {
    setSelectedPatient(p);
    setModal(m => ({ ...m, rdv: { ...m.rdv, patientNom: p.nom, patientPrenom: p.prenom, telephone: p.telephone ?? m.rdv.telephone }, deleteConfirm: false }));
  }
  function handlePatientClear() {
    setSelectedPatient(null);
    setModal(m => ({ ...m, rdv: { ...m.rdv, patientNom: "", patientPrenom: "", telephone: "" }, deleteConfirm: false }));
  }

  function handleModalChange(f: keyof RendezVous, value: string | number) {
    if (f === "id" && value === "__delete_confirm__") { setModal(m => ({ ...m, deleteConfirm: true })); return; }
    setModal(m => ({ ...m, rdv: { ...m.rdv, [f]: value }, deleteConfirm: false }));
  }

  function handleSave() {
    const { rdv, mode } = modal;
    const isBloc = rdv.category === "bloc";
    if (!isBloc && (!rdv.patientNom.trim() || !rdv.patientPrenom.trim())) return;
    if (!rdv.date || !rdv.heure) return;
    // Créer le patient dans la base patients si nouveau (pas sélectionné depuis la liste)
    if (!isBloc && mode === "create" && !selectedPatient) {
      upsertPatientFromRdv(rdv);
    }
    const updated = mode === "create"
      ? [...rdvs, { ...rdv, id: genId() }]
      : rdvs.map(r => r.id === rdv.id ? rdv : r);
    saveRdvs(updated); setRdvs(updated); closeModal();
  }

  function handleDelete() {
    const updated = rdvs.filter(r => r.id !== modal.rdv.id);
    saveRdvs(updated); setRdvs(updated); closeModal();
  }

  /* ── Drag ── */
  useEffect(() => {
    if (!dragState) return;
    function onMouseUp() {
      if (dragState) {
        const { dateStr, userId, startMin, endMin } = dragState;
        const duree = Math.max(endMin - startMin, SLOT_STEP);
        const user = staffUsers.find(u => u.id === userId);
        openCreate(dateStr, minutesToHHMM(startMin), duree, user?.name ?? "");
      }
      setDragState(null);
    }
    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragState, staffUsers]);

  function handleDragMoveStart(rdv: RendezVous, offsetMin: number, userId: string) {
    setDragMoveState({ rdv, userId, offsetMin, currentDateStr: rdv.date, currentUserId: userId, currentMin: hhmmToMinutes(rdv.heure), hasMoved: false });
  }

  useEffect(() => {
    if (!dragMoveState) return;
    function onMouseUp() {
      if (dragMoveState) {
        if (dragMoveState.hasMoved) {
          const rawMin = Math.max(SLOT_START, Math.min(SLOT_END - dragMoveState.rdv.duree, dragMoveState.currentMin));
          const newStartMin = Math.round(rawMin / SLOT_STEP) * SLOT_STEP;
          const newUser = staffUsers.find(u => u.id === dragMoveState.currentUserId);
          const updated = rdvs.map(r => r.id === dragMoveState.rdv.id
            ? { ...r, date: dragMoveState.currentDateStr, heure: minutesToHHMM(newStartMin), praticien: newUser?.name ?? r.praticien }
            : r);
          saveRdvs(updated); setRdvs(updated);
        } else {
          openEdit(dragMoveState.rdv);
        }
      }
      setDragMoveState(null);
    }
    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragMoveState, rdvs]);

  function togglePresence(dateStr: string, userId: string) {
    setPresenceByDate(prev => {
      const current = prev[dateStr] ?? staffUsers.map(u => u.id);
      const next = current.includes(userId) ? current.filter(id => id !== userId) : [...current, userId];
      const updated = { ...prev, [dateStr]: next };
      savePresence(updated); return updated;
    });
  }
  function getPresent(dateStr: string): string[] {
    return presenceByDate[dateStr] !== undefined ? presenceByDate[dateStr] : staffUsers.map(u => u.id);
  }

  // ── Réassignation ──────────────────────────────────────────────────────────
  function handlePresenceClick(dateStr: string, userId: string) {
    const current = presenceByDate[dateStr] ?? staffUsers.map(u => u.id);
    const isPresent = current.includes(userId);

    if (!isPresent) { togglePresence(dateStr, userId); return; }

    // Marking absent: find RDVs
    const user = staffUsers.find(u => u.id === userId);
    const affected = rdvs.filter(r =>
      r.date === dateStr && r.statut !== "annule" &&
      (r.praticien === user?.name || r.praticien === userId)
    );

    if (affected.length === 0) { togglePresence(dateStr, userId); return; }

    // Compute available profs
    const availableIds = current.filter(id => id !== userId);
    const availableProfs = staffUsers.filter(u => PROFESSIONAL_ROLES.has(u.role) && availableIds.includes(u.id));

    // Smart best: no time conflict + highest XP, fallback to least booked
    const smart = findSmartBest(availableProfs, affected, rdvs, dateStr);

    // All visible profs for the modal (display-only)
    const allVisibleProfs = staffUsers.filter(u => PROFESSIONAL_ROLES.has(u.role));

    setReassignModal({
      open: true, dateStr, absentUserId: userId,
      rdvsAffected: affected,
      availableProfs: allVisibleProfs,
      selectedTargetId: smart?.id ?? "",
      smartTargetId: smart?.id ?? "",
    });
  }

  function confirmReassign(targetId: string) {
    const { dateStr, absentUserId, rdvsAffected } = reassignModal;
    const target = staffUsers.find(u => u.id === targetId);
    if (target) {
      const affectedIds = new Set(rdvsAffected.map(r => r.id));
      const updated = rdvs.map(r => affectedIds.has(r.id) ? { ...r, praticien: target.name } : r);
      saveRdvs(updated); setRdvs(updated);
    }
    togglePresence(dateStr, absentUserId);
    setReassignModal(m => ({ ...m, open: false }));
  }

  function skipReassign() {
    togglePresence(reassignModal.dateStr, reassignModal.absentUserId);
    setReassignModal(m => ({ ...m, open: false }));
  }

  const todayStr = isoDate(today);
  const nowMins  = new Date().getHours() * 60 + new Date().getMinutes();
  const showNowLine = nowMins >= SLOT_START && nowMins < SLOT_END;
  const nowTopPx = ((nowMins - SLOT_START) / SLOT_STEP) * CELL_HEIGHT;

  if (!mounted) {
    return <div style={{ ...glass, borderRadius: 20, padding: 32, textAlign: "center", color: "#94a3b8" }}>Chargement de l&apos;agenda…</div>;
  }

  function exportToIcal(scope: "week" | "month" | "all") {
    const cfg = { nom: "Clair Vision" };
    try { const raw = localStorage.getItem("thor_pro_store_config"); if (raw) Object.assign(cfg, JSON.parse(raw)); } catch {}
    const toExport = scope === "week"
      ? rdvs.filter(r => { const d = new Date(r.date); return d >= weekStart && d < addDays(weekStart, 7); })
      : scope === "month"
      ? rdvs.filter(r => { const d = new Date(r.date); return d.getFullYear() === weekStart.getFullYear() && d.getMonth() === weekStart.getMonth(); })
      : rdvs.filter(r => r.date >= todayStr);
    if (toExport.length === 0) { alert("Aucun RDV à exporter pour cette période."); return; }
    function icalDate(dateStr: string, heureStr: string) {
      const [h, m] = heureStr.split(":").map(Number);
      const d = new Date(`${dateStr}T00:00:00`);
      d.setHours(h, m, 0, 0);
      return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    }
    const events = toExport.map(r => {
      const [h, m] = r.heure.split(":").map(Number);
      const endH = h + Math.floor((m + r.duree) / 60);
      const endM = (m + r.duree) % 60;
      const endHeure = `${String(endH).padStart(2,"0")}:${String(endM).padStart(2,"0")}`;
      return [
        "BEGIN:VEVENT",
        `DTSTART:${icalDate(r.date, r.heure)}`,
        `DTEND:${icalDate(r.date, endHeure)}`,
        `SUMMARY:${r.patientPrenom} ${r.patientNom} — ${TYPE_COLOR[r.type]?.label || "Consultation"}`,
        `DESCRIPTION:Patient: ${r.patientPrenom} ${r.patientNom}\\nTél: ${r.telephone || "—"}\\nPraticien: ${r.praticien || "—"}\\nNotes: ${r.notes || "—"}`,
        `LOCATION:${cfg.nom}`,
        `UID:${r.id}@thor.clair-vision.pro`,
        `STATUS:CONFIRMED`,
        "END:VEVENT",
      ].join("\r\n");
    }).join("\r\n");
    const ics = ["BEGIN:VCALENDAR","VERSION:2.0",`PRODID:-//THOR//CMS//FR`,`X-WR-CALNAME:${cfg.nom} — Agenda`,"CALSCALE:GREGORIAN","METHOD:PUBLISH",events,"END:VCALENDAR"].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `agenda-clair-vision-${scope}.ics`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {/* ── Top bar ── */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {/* Navigation */}
        <div className="inline-flex items-center gap-1">
          <button
            onClick={prevPeriod}
            aria-label="Précédent"
            className="grid place-items-center w-9 h-9 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          ><IconChevronLeft /></button>
          <button
            onClick={nextPeriod}
            aria-label="Suivant"
            className="grid place-items-center w-9 h-9 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          ><IconChevronRight /></button>
        </div>

        {/* Period label */}
        <div className="flex-1 min-w-[180px] h-9 px-3 inline-flex items-center text-sm font-medium text-slate-800 dark:text-slate-100 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {viewMode === "week" ? formatWeekLabel(weekStart) : formatMonthLabel(weekStart)}
        </div>

        {/* View toggle (segmented) */}
        <div
          role="group"
          aria-label="Mode d'affichage"
          className="inline-flex items-center h-9 p-0.5 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        >
          {([["week", "Semaine", <IconWeek key="w"/>], ["month", "Mois", <IconCalGrid key="m"/>]] as const).map(([mode, label, icon]) => {
            const active = viewMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setViewMode(mode as ViewMode)}
                aria-pressed={active}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium transition-colors"
                style={{
                  background: active ? "#2D8CFF" : "transparent",
                  color: active ? "#fff" : "#94a3b8",
                }}
              >
                {icon} {label}
              </button>
            );
          })}
        </div>

        <button
          onClick={goToToday}
          className="inline-flex items-center h-9 px-3 rounded-[10px] text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Aujourd&apos;hui
        </button>

        {/* iCal export dropdown */}
        <div className="relative ical-export-wrap">
          <button
            onClick={() => { const el = document.getElementById("ical-menu"); if (el) el.style.display = el.style.display === "none" ? "flex" : "none"; }}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Exporter
            <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
          </button>
          <div
            id="ical-menu"
            className="hidden absolute top-[calc(100%+6px)] right-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg p-1 z-50 min-w-[220px]"
            style={{ flexDirection: "column", gap: 2 }}
          >
            {([["week","Semaine en cours"],["month","Mois en cours"],["all","Tous les RDVs futurs"]] as const).map(([scope, label]) => (
              <button
                key={scope}
                onClick={() => { exportToIcal(scope); const el=document.getElementById("ical-menu"); if(el) el.style.display="none"; }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => openCreate(todayStr, "09:00")}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[10px] text-sm font-medium text-white bg-vision-accent hover:bg-[#1A72E8] transition-colors"
        >
          <IconPlus /> Nouveau RDV
        </button>
      </div>

      {/* ── Month view ── */}
      {viewMode === "month" && (
        <MonthView rdvs={rdvs} weekStart={weekStart} todayStr={todayStr}
          onDayClick={day => { setWeekStart(getMondayOf(day)); setViewMode("week"); }} />
      )}

      {/* ── Week view ── */}
      {viewMode === "week" && (
        <div style={{ ...glass, borderRadius: 20, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <div ref={gridBodyRef} style={{ minWidth: 600, maxHeight: "calc(100vh - 116px)", overflowY: "auto", scrollbarGutter: "stable" }}>

              {/* ── Column headers ── */}
              <div style={{ display: "grid", gridTemplateColumns: `56px repeat(7, 1fr)`, borderBottom: "1.5px solid rgba(203,213,225,0.5)", position: "sticky", top: 0, zIndex: 10, background: "rgba(248,250,252,0.97)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
                <div />
                {weekDays.map((day, i) => {
                  const dateStr   = isoDate(day);
                  const isToday   = dateStr === todayStr;
                  const frKey     = WEEKDAY_TO_FR[day.getDay()] ?? "";
                  const isClosed  = !(weekSchedule[frKey]?.ouvert ?? true);
                  const { dayName, dayNum, month } = formatDayHeader(day);
                  const presentIds = getPresent(dateStr);
                  const allProfsForDay = staffUsers.filter(u => PROFESSIONAL_ROLES.has(u.role));
                  const profs = allProfsForDay.filter(u => presentIds.includes(u.id));
                  const absentProfs = allProfsForDay.filter(u => !presentIds.includes(u.id));
                  return (
                    <div key={i} style={{ borderLeft: "1px solid rgba(203,213,225,0.35)", background: isClosed ? "rgba(203,213,225,0.08)" : isToday ? "rgba(99,102,241,0.06)" : "transparent" }}>
                      <div style={{ textAlign: "center", padding: "8px 4px 4px" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 3, color: isClosed ? "#cbd5e1" : isToday ? "#6366f1" : "#94a3b8" }}>{dayName}</div>
                        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: "50%", background: isClosed ? "transparent" : isToday ? "#6366f1" : "transparent", color: isClosed ? "#cbd5e1" : isToday ? "white" : "#1e293b", fontSize: 14, fontWeight: 700 }}>{dayNum}</div>
                        <div style={{ fontSize: 10, color: isClosed ? "#cbd5e1" : "#94a3b8", marginTop: 1 }}>{month}</div>
                        {/* Presence avatars — non-professional staff + absent professionals */}
                        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 2, marginTop: 5 }}>
                          {staffUsers.filter(u => !PROFESSIONAL_ROLES.has(u.role)).map(u => {
                            const present = presentIds.includes(u.id);
                            return (
                              <button key={u.id} title={`${u.name} — ${present ? "Présent(e)" : "Absent(e)"}`} onClick={() => handlePresenceClick(dateStr, u.id)}
                                style={{ width: 18, height: 18, borderRadius: "50%", background: present ? u.color : "rgba(203,213,225,0.5)", border: `2px solid ${present ? u.color : "transparent"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, opacity: present ? 1 : 0.4, transition: "all 0.15s" }}>
                                <span style={{ fontSize: 6, fontWeight: 800, color: "white", lineHeight: 1 }}>{u.initials}</span>
                              </button>
                            );
                          })}
                          {absentProfs.map(u => (
                            <button
                              key={u.id}
                              title={`${u.name} — Absent(e) · cliquer pour réintégrer`}
                              onClick={() => togglePresence(dateStr, u.id)}
                              style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(203,213,225,0.4)", border: `1.5px dashed ${u.color}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, opacity: 0.55, transition: "opacity 0.15s" }}
                              onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                              onMouseLeave={e => (e.currentTarget.style.opacity = "0.55")}
                            >
                              <span style={{ fontSize: 6, fontWeight: 800, color: u.color, lineHeight: 1 }}>{u.initials}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Sub-header : praticiens présents uniquement */}
                      {!isClosed && profs.length > 0 && (
                        <div style={{ display: "flex", borderTop: "1px solid rgba(203,213,225,0.25)", alignItems: "center" }}>
                          {profs.map((u, pi) => (
                            <div key={u.id} style={{ flex: 1, textAlign: "center", padding: "3px 2px", borderLeft: pi > 0 ? "1px solid rgba(203,213,225,0.25)" : "none" }}>
                              <button
                                title={`${u.name} — Présent(e) · cliquer pour marquer absent`}
                                onClick={() => handlePresenceClick(dateStr, u.id)}
                                style={{ width: 20, height: 20, borderRadius: "50%", background: u.color, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "none", padding: 0 }}
                              >
                                <span style={{ fontSize: 7, fontWeight: 800, color: "white" }}>{u.initials}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {isClosed && <div style={{ textAlign: "center", padding: "3px 0 5px", fontSize: 9, fontWeight: 600, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.05em" }}>Fermé</div>}
                    </div>
                  );
                })}
              </div>

              {/* ── Time grid ── */}
              <div style={{ display: "grid", gridTemplateColumns: `56px repeat(7, 1fr)`, position: "relative" }}>

                {/* Time axis: labels every 30 min, each 48px tall */}
                <div style={{ position: "relative" }}>
                  {TIME_LABELS.map((label, i) => (
                    <div key={label} style={{ height: 3 * CELL_HEIGHT, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", paddingRight: 8, paddingTop: 4, fontSize: 11, color: "#94a3b8", fontWeight: 500, borderTop: i === 0 ? "none" : "1px solid rgba(203,213,225,0.3)" }}>
                      {label}
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {weekDays.map((day, colIdx) => {
                  const dateStr  = isoDate(day);
                  const isToday  = dateStr === todayStr;
                  const frKey    = WEEKDAY_TO_FR[day.getDay()] ?? "";
                  const isClosed = !(weekSchedule[frKey]?.ouvert ?? true);
                  const sched    = weekSchedule[frKey];
                  const openMin  = (sched?.ouvert && sched?.ouverture) ? hhmmToMinutes(sched.ouverture) : SLOT_START;
                  const closeMin = (sched?.ouvert && sched?.fermeture) ? hhmmToMinutes(sched.fermeture) : SLOT_END;
                  const presentIds = getPresent(dateStr);
                  const profs = staffUsers.filter(u => PROFESSIONAL_ROLES.has(u.role) && presentIds.includes(u.id));
                  const allDayRdvs = rdvsByDate(dateStr);

                  return (
                    <div key={colIdx} style={{ borderLeft: "1px solid rgba(203,213,225,0.35)", height: totalRows * CELL_HEIGHT, display: "flex" }}>
                      {isClosed ? (
                        <div style={{ flex: 1, background: "repeating-linear-gradient(45deg,rgba(203,213,225,0.07),rgba(203,213,225,0.07) 4px,transparent 4px,transparent 10px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 10, color: "#cbd5e1", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", writingMode: "vertical-lr" }}>Fermé</span>
                        </div>
                      ) : profs.length === 0 ? (
                        <div style={{ flex: 1, background: "rgba(203,213,225,0.04)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 20 }}>
                          <span style={{ fontSize: 11, color: "#e2e8f0" }}>—</span>
                        </div>
                      ) : (
                        profs.map((user, profIdx) => {
                          const profRdvs = allDayRdvs.filter(r => {
                            const matched = staffUsers.find(u => u.name === r.praticien || u.id === r.praticien);
                            return matched ? matched.id === user.id : profIdx === 0;
                          });
                          const isDragOn = dragState?.dateStr === dateStr && dragState?.userId === user.id;
                          const HATCH = "repeating-linear-gradient(45deg,rgba(203,213,225,0.09),rgba(203,213,225,0.09) 3px,transparent 3px,transparent 9px)";

                          return (
                            <div key={user.id} style={{ flex: 1, position: "relative", borderLeft: profIdx > 0 ? "1px solid rgba(203,213,225,0.3)" : "none", background: isToday ? "rgba(99,102,241,0.015)" : "transparent" }}>

                              {/* Before-opening grey overlay */}
                              {openMin > SLOT_START && (
                                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: ((openMin - SLOT_START) / SLOT_STEP) * CELL_HEIGHT, background: HATCH, pointerEvents: "none", zIndex: 1 }} />
                              )}
                              {/* After-closing grey overlay */}
                              {closeMin < SLOT_END && (
                                <div style={{ position: "absolute", top: ((closeMin - SLOT_START) / SLOT_STEP) * CELL_HEIGHT, left: 0, right: 0, height: ((SLOT_END - closeMin) / SLOT_STEP) * CELL_HEIGHT, background: HATCH, pointerEvents: "none", zIndex: 1 }} />
                              )}

                              {/* Drag rows (10-min each) */}
                              {Array.from({ length: totalRows }, (_, rowIdx) => {
                                const slotMin    = SLOT_START + rowIdx * SLOT_STEP;
                                const isHalfHour = slotMin % 30 === 0 && rowIdx > 0;
                                const isInDrag   = isDragOn && dragState
                                  ? slotMin >= Math.min(dragState.startMin, dragState.endMin - SLOT_STEP) && slotMin < Math.max(dragState.startMin, dragState.endMin)
                                  : false;
                                return (
                                  <div key={rowIdx} style={{
                                    position: "absolute", top: rowIdx * CELL_HEIGHT, left: 0, right: 0, height: CELL_HEIGHT,
                                    borderTop: isHalfHour ? "1px solid rgba(203,213,225,0.28)" : rowIdx > 0 ? "1px solid rgba(203,213,225,0.08)" : "none",
                                    cursor: "crosshair",
                                    background: isInDrag ? `${user.color}28` : "transparent",
                                    userSelect: "none",
                                  }}
                                    onMouseDown={e => { e.preventDefault(); setDragState({ dateStr, userId: user.id, startMin: slotMin, endMin: slotMin + SLOT_STEP }); }}
                                    onMouseEnter={e => {
                                      if (dragMoveState) {
                                        const newStart = Math.max(SLOT_START, Math.min(SLOT_END - dragMoveState.rdv.duree, slotMin - dragMoveState.offsetMin));
                                        setDragMoveState(prev => prev ? { ...prev, currentDateStr: dateStr, currentUserId: user.id, currentMin: newStart, hasMoved: true } : null);
                                      } else if (dragState?.dateStr === dateStr && dragState?.userId === user.id) {
                                        setDragState(prev => prev ? { ...prev, endMin: slotMin + SLOT_STEP } : null);
                                      } else if (!dragState) {
                                        (e.currentTarget as HTMLDivElement).style.background = `${user.color}12`;
                                      }
                                    }}
                                    onMouseLeave={e => { if (!dragState && !dragMoveState) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                                  />
                                );
                              })}

                              {/* Now line */}
                              {isToday && showNowLine && (
                                <div style={{ position: "absolute", top: nowTopPx, left: 0, right: 0, height: 2, background: "#ef4444", zIndex: 5, pointerEvents: "none" }}>
                                  {profIdx === 0 && <div style={{ position: "absolute", left: -4, top: -4, width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />}
                                </div>
                              )}

                              {/* Pause midi overlay (per-day) */}
                              {sched?.pauseActive && (() => {
                                const pmStart = hhmmToMinutes(sched.pauseDebut ?? "12:00");
                                const pmEnd   = hhmmToMinutes(sched.pauseFin ?? "14:00");
                                if (pmStart >= SLOT_START && pmEnd <= SLOT_END && pmEnd > pmStart) {
                                  return (
                                    <div style={{ position: "absolute", top: ((pmStart - SLOT_START) / SLOT_STEP) * CELL_HEIGHT, left: 0, right: 0, height: ((pmEnd - pmStart) / SLOT_STEP) * CELL_HEIGHT, background: "repeating-linear-gradient(45deg,rgba(245,158,11,0.05),rgba(245,158,11,0.05) 4px,transparent 4px,transparent 8px)", borderTop: "1.5px dashed rgba(245,158,11,0.4)", borderBottom: "1.5px dashed rgba(245,158,11,0.4)", pointerEvents: "none", zIndex: 1 }}>
                                      {profIdx === 0 && <span style={{ position: "absolute", top: 3, left: 4, fontSize: 9, fontWeight: 600, color: "rgba(180,120,0,0.6)", textTransform: "uppercase" }}>Pause</span>}
                                    </div>
                                  );
                                }
                                return null;
                              })()}

                              {/* Drag-move preview */}
                              {dragMoveState && dragMoveState.currentDateStr === dateStr && dragMoveState.currentUserId === user.id && (() => {
                                const dm = dragMoveState;
                                const isBloc = dm.rdv.category === "bloc";
                                const ac = isBloc ? getBlocInfo(dm.rdv).color : TYPE_COLOR[dm.rdv.type].border;
                                const bg = isBloc ? getBlocInfo(dm.rdv).bg : TYPE_COLOR[dm.rdv.type].bg;
                                const h  = Math.max((dm.rdv.duree / SLOT_STEP) * CELL_HEIGHT - 2, 14);
                                const t  = ((dm.currentMin - SLOT_START) / SLOT_STEP) * CELL_HEIGHT + 1;
                                return (
                                  <div style={{ position: "absolute", top: t, left: 2, right: 2, height: h, background: bg, borderRadius: 5, borderLeft: `3px solid ${ac}`, border: `1px solid ${ac}40`, borderLeftWidth: 3, opacity: 0.85, zIndex: 10, pointerEvents: "none", boxShadow: `0 4px 16px ${ac}30` }} />
                                );
                              })()}
                              {/* RDV blocks */}
                              {profRdvs.map(rdv => <RdvBlock key={rdv.id} rdv={rdv} userId={user.id} onEdit={openEdit} onDragMoveStart={handleDragMoveStart} isDragging={dragMoveState?.rdv.id === rdv.id} />)}
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal RDV ── */}
      <RdvModal state={modal} onChange={handleModalChange} onPatientSelect={handlePatientSelect} onPatientClear={handlePatientClear}
        selectedPatient={selectedPatient} onSave={handleSave} onDelete={handleDelete} onClose={closeModal} />

      {/* ── Modal réassignation ── */}
      <ReassignConfirmModal
        state={reassignModal}
        allRdvs={rdvs}
        onConfirm={confirmReassign}
        onSkip={skipReassign}
        onClose={() => setReassignModal(m => ({ ...m, open: false }))}
      />
    </>
  );
}
