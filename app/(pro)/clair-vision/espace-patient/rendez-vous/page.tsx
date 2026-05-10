"use client";

import React, { useState, useEffect, useCallback } from "react";
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
interface CurrentPatient { id: string; nom: string; prenom: string; email?: string }
const MOCK_PATIENT: CurrentPatient = { id: "patient-1", nom: "Leblanc", prenom: "Marie", email: "marie.leblanc@email.fr" };

type RdvType = "controle" | "adaptation" | "livraison" | "urgence" | "autre";
type RdvStatut = "planifie" | "confirme" | "arrive" | "annule" | "demande";

interface RendezVous {
  id: string; date: string; heure: string; duree: number;
  type: RdvType | string; patientNom: string; patientPrenom: string;
  telephone?: string; notes?: string; praticien?: string; statut: RdvStatut | string;
}

interface ProUserLS { id: string; name: string; role: string }
interface DaySchedule { ouvert: boolean; ouverture: string; fermeture: string; pauseActive?: boolean; pauseDebut?: string; pauseFin?: string }
interface AgendaCfg {
  schedule: Record<string, DaySchedule>;
  defaultDuree: number;
}

interface SlotInfo { heure: string; praticiens: string[] }

/* ── Constants ──────────────────────────────────────────────────────── */
const TYPE_OPTIONS: { value: RdvType; label: string; icon: string; description: string }[] = [
  { value: "controle",   label: "Contrôle de vue",      icon: "",  description: "Examen visuel complet" },
  { value: "adaptation", label: "Adaptation lentilles",  icon: "", description: "Essai et réglage de lentilles" },
  { value: "livraison",  label: "Livraison",             icon: "", description: "Retrait de commande" },
  { value: "urgence",    label: "Urgence",               icon: "", description: "Problème urgent" },
];
const TYPE_LABELS: Record<string, string> = {
  controle: "Contrôle", adaptation: "Adaptation lentilles", livraison: "Livraison",
  urgence: "Urgence", autre: "Autre", demande: "Demande",
};
const STATUT_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  planifie: { bg: "rgba(45,140,255,0.10)",  text: "#1D6FCC", label: "Planifié" },
  confirme: { bg: "rgba(16,185,129,0.10)",  text: "#047857", label: "Confirmé" },
  arrive:   { bg: "rgba(16,185,129,0.18)",  text: "#065f46", label: "Arrivé" },
  annule:   { bg: "rgba(239,68,68,0.10)",   text: "#991b1b", label: "Annulé" },
  demande:  { bg: "rgba(245,158,11,0.10)",  text: "#B45309", label: "En attente de confirmation" },
};

const FR_DAYS_LONG  = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const FR_DAYS_SHORT = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
const FR_MONTHS     = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const WEEKDAY_TO_FR: Record<number, string> = {
  1:"lundi",2:"mardi",3:"mercredi",4:"jeudi",5:"vendredi",6:"samedi",0:"dimanche",
};
const PROFESSIONAL_ROLES = new Set(["Gérant","Optométriste","Opticien","Visagiste"]);
const DEFAULT_SCHEDULE: Record<string, DaySchedule> = {
  lundi:{ouvert:true,ouverture:"09:00",fermeture:"19:00"},
  mardi:{ouvert:true,ouverture:"09:00",fermeture:"19:00"},
  mercredi:{ouvert:true,ouverture:"09:00",fermeture:"19:00"},
  jeudi:{ouvert:true,ouverture:"09:00",fermeture:"19:00"},
  vendredi:{ouvert:true,ouverture:"09:00",fermeture:"19:00"},
  samedi:{ouvert:true,ouverture:"09:00",fermeture:"13:00"},
  dimanche:{ouvert:false,ouverture:"09:00",fermeture:"18:00"},
};

/* ── localStorage helpers ────────────────────────────────────────────── */
function loadLS<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try { const r = localStorage.getItem(key); return r ? (JSON.parse(r) as T[]) : []; } catch { return []; }
}
function saveLS<T>(key: string, data: T[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* noop */ }
}
function loadCurrentPatient(): CurrentPatient {
  if (typeof window === "undefined") return MOCK_PATIENT;
  try { const r = localStorage.getItem("thor_patient_current"); return r ? (JSON.parse(r) as CurrentPatient) : MOCK_PATIENT; } catch { return MOCK_PATIENT; }
}
function loadAgendaCfg(): AgendaCfg {
  const defaults: AgendaCfg = { schedule: DEFAULT_SCHEDULE, defaultDuree: 30 };
  if (typeof window === "undefined") return defaults;
  try {
    const r = localStorage.getItem("thor_pro_parametres_agenda");
    if (!r) return defaults;
    const p = JSON.parse(r) as { schedule?: Record<string, DaySchedule>; duree?: string };
    return {
      schedule: p.schedule ?? DEFAULT_SCHEDULE,
      defaultDuree: parseInt(p.duree ?? "30") || 30,
    };
  } catch { return defaults; }
}
function loadProUsers(): ProUserLS[] {
  if (typeof window === "undefined") return [];
  try { const r = localStorage.getItem("thor_pro_users"); return r ? (JSON.parse(r) as ProUserLS[]) : []; } catch { return []; }
}
function genId() { return `rdv_${Date.now()}_${Math.random().toString(36).slice(2,7)}`; }

/* ── Date helpers ────────────────────────────────────────────────────── */
function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function addDays(d: Date, n: number) { const c = new Date(d); c.setDate(c.getDate()+n); return c; }
function hhmmToMin(t: string) { const [h,m] = t.split(":").map(Number); return (h??0)*60+(m??0); }
function minToHhmm(m: number) { return `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`; }
function formatRdvDate(iso: string) {
  try { const d = new Date(iso); return `${FR_DAYS_SHORT[d.getDay()]} ${d.getDate()} ${FR_MONTHS[d.getMonth()]} ${d.getFullYear()}`; } catch { return iso; }
}
function samePatient(nom: string, prenom: string, p: CurrentPatient) {
  return nom.trim().toLowerCase()===p.nom.trim().toLowerCase() && prenom.trim().toLowerCase()===p.prenom.trim().toLowerCase();
}

/* ── Slot availability engine ────────────────────────────────────────── */
function computeSlots(dateStr: string, cfg: AgendaCfg, allRdvs: RendezVous[], proUsers: ProUserLS[]): SlotInfo[] {
  const d = new Date(dateStr);
  const frKey = WEEKDAY_TO_FR[d.getDay()] ?? "";
  const dayCfg = cfg.schedule[frKey] ?? { ouvert: false, ouverture: "09:00", fermeture: "19:00" };
  if (!dayCfg.ouvert) return [];

  const professionals = proUsers.filter(u => PROFESSIONAL_ROLES.has(u.role));
  if (professionals.length === 0) return [];

  const openMin  = hhmmToMin(dayCfg.ouverture);
  const closeMin = hhmmToMin(dayCfg.fermeture);
  const duree    = cfg.defaultDuree;
  const STEP     = 30;

  const pmStart = dayCfg.pauseActive ? hhmmToMin(dayCfg.pauseDebut ?? "12:00") : -1;
  const pmEnd   = dayCfg.pauseActive ? hhmmToMin(dayCfg.pauseFin   ?? "14:00") : -1;

  const dayRdvs = allRdvs.filter(r => r.date === dateStr && r.statut !== "annule");

  const slots: SlotInfo[] = [];

  for (let start = openMin; start + duree <= closeMin; start += STEP) {
    // Skip if overlaps pause midi
    if (pmStart >= 0 && start < pmEnd && start + duree > pmStart) continue;

    // For each professional, check if they're free
    const freePros = professionals.filter(pro => {
      const proRdvs = dayRdvs.filter(r => r.praticien === pro.name || r.praticien === pro.id);
      return !proRdvs.some(r => {
        const rStart = hhmmToMin(r.heure);
        const rEnd   = rStart + r.duree;
        return start < rEnd && start + duree > rStart;
      });
    });

    if (freePros.length > 0) {
      slots.push({ heure: minToHhmm(start), praticiens: freePros.map(p => p.name) });
    }
  }
  return slots;
}

/* ── Icons ────────────────────────────────────────────────────────────── */
function IconCalendar() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.7"/><path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>;
}
function IconClock() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>;
}
function IconUser() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none"><path d="M12 12.2a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12.2Z" stroke="currentColor" strokeWidth="1.7"/><path d="M4.5 20.2c1.7-4 13.3-4 15 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>;
}
function IconCheck() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="M5 12l5 5 9-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function IconChevronLeft() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function IconChevronRight() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function IconPlus() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
}

/* ── Badge helpers ────────────────────────────────────────────────────── */
function UpcomingBadge() {
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: "rgba(16,185,129,0.12)", color: "#047857" }}
    >
      À venir
    </span>
  );
}
function PastBadge() {
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: "rgba(148,163,184,0.15)", color: "#64748b" }}
    >
      Passé
    </span>
  );
}
function CancelledBadge() {
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: "rgba(239,68,68,0.10)", color: "#991b1b" }}
    >
      Annulé
    </span>
  );
}

/* ── RDV Card ─────────────────────────────────────────────────────────── */
function RdvCard({ rdv, past=false }: { rdv: RendezVous; past?: boolean }) {
  const statut = STATUT_CONFIG[rdv.statut] ?? { bg:"rgba(148,163,184,0.12)", text:"#64748b", label: String(rdv.statut) };
  const isAnnule = rdv.statut === "annule";

  if (past) {
    return (
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom:"1px solid rgba(255,255,255,0.60)" }}>
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-36 flex-shrink-0 text-sm font-medium text-slate-500">{formatRdvDate(rdv.date)}</div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-medium text-slate-800">{TYPE_LABELS[rdv.type] ?? rdv.type}</span>
              {rdv.heure && <span className="text-xs text-slate-400">{rdv.heure}</span>}
            </div>
            {rdv.praticien && <div className="text-xs text-slate-400 mt-0.5">{rdv.praticien}</div>}
            {rdv.notes && (
              <div className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{rdv.notes}</div>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 ml-4">
          {isAnnule ? <CancelledBadge /> : <PastBadge />}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5" style={glass}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 rounded-xl px-4 py-3 text-center text-white" style={{ background:ACCENT, boxShadow:"0 4px 16px rgba(45,140,255,0.28)" }}>
          <div className="text-2xl font-bold leading-none">{new Date(rdv.date).getDate()}</div>
          <div className="mt-0.5 text-xs font-medium uppercase tracking-wide opacity-90">{FR_MONTHS[new Date(rdv.date).getMonth()]?.slice(0,3)}</div>
          <div className="text-xs opacity-75">{new Date(rdv.date).getFullYear()}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background:"rgba(45,140,255,0.10)", color:ACCENT }}>{TYPE_LABELS[rdv.type] ?? rdv.type}</span>
            {isAnnule ? <CancelledBadge /> : <UpcomingBadge />}
            <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background:statut.bg, color:statut.text }}>{statut.label}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
            <span style={{ color:ACCENT }}><IconClock /></span>{rdv.heure}
          </div>
          {rdv.praticien && (
            <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
              <span style={{ color:ACCENT }}><IconUser /></span>{rdv.praticien}
            </div>
          )}
          {rdv.notes && (
            <div className="mt-1 text-xs text-slate-400 truncate">{rdv.notes}</div>
          )}
        </div>
      </div>
      <div className="mt-2 text-xs text-slate-400">
        {FR_DAYS_LONG[new Date(rdv.date).getDay()]} {new Date(rdv.date).getDate()} {FR_MONTHS[new Date(rdv.date).getMonth()]} {new Date(rdv.date).getFullYear()}
      </div>
    </div>
  );
}

/* ── Toast ────────────────────────────────────────────────────────────── */
function Toast({ visible }: { visible: boolean }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition-all duration-300"
      style={{ background:"#10b981", boxShadow:"0 8px 32px rgba(16,185,129,0.35)", opacity:visible?1:0, transform:visible?"translate(-50%,0)":"translate(-50%,24px)", pointerEvents:"none" }}>
      <IconCheck /> Rendez-vous confirmé ✓
    </div>
  );
}

/* ── Slot Picker ──────────────────────────────────────────────────────── */
function SlotPicker({
  onConfirm, onCancel, rdvType, patient,
}: {
  onConfirm: (date: string, heure: string, praticien: string, message: string) => void;
  onCancel: () => void;
  rdvType: RdvType;
  patient: CurrentPatient;
}) {
  const today = new Date();
  today.setHours(0,0,0,0);

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"pick-day" | "pick-slot" | "confirm">("pick-day");
  const [agendaCfg, setAgendaCfg] = useState<AgendaCfg>({ schedule:DEFAULT_SCHEDULE, defaultDuree:30 });
  const [allRdvs, setAllRdvs] = useState<RendezVous[]>([]);
  const [proUsers, setProUsers] = useState<ProUserLS[]>([]);

  useEffect(() => {
    setAgendaCfg(loadAgendaCfg());
    setAllRdvs(loadLS<RendezVous>("thor_pro_rdv"));
    setProUsers(loadProUsers());
  }, []);

  // Generate 7 days starting from Monday of current week offset
  function getMondayOf(d: Date) {
    const c = new Date(d); const day = c.getDay();
    c.setDate(c.getDate() - (day===0?6:day-1)); c.setHours(0,0,0,0); return c;
  }
  const weekStart = addDays(getMondayOf(today), weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Pre-compute slot counts per day
  const slotCounts = days.map(d => {
    const ds = isoDate(d);
    if (d < today) return 0;
    return computeSlots(ds, agendaCfg, allRdvs, proUsers).length;
  });

  const daySlots = selectedDate ? computeSlots(selectedDate, agendaCfg, allRdvs, proUsers) : [];

  function handleDayClick(d: Date, count: number) {
    if (d < today || count === 0) return;
    setSelectedDate(isoDate(d));
    setSelectedSlot(null);
    setStep("pick-slot");
  }

  function handleSlotClick(slot: SlotInfo) {
    setSelectedSlot(slot);
    setStep("confirm");
  }

  if (step === "confirm" && selectedDate && selectedSlot) {
    const praticien = selectedSlot.praticiens[0] ?? "";
    return (
      <div className="rounded-3xl p-6 space-y-5" style={glass}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => setStep("pick-slot")} className="rounded-xl p-2 text-slate-400 hover:text-slate-600 transition" style={glassSubtle}>
            <IconChevronLeft />
          </button>
          <div>
            <h3 className="text-base font-bold text-slate-800">Confirmer le rendez-vous</h3>
            <p className="text-xs text-slate-400">Vérifiez les informations avant d&apos;envoyer</p>
          </div>
        </div>

        {/* Summary card */}
        <div className="rounded-2xl p-4 space-y-2" style={{ background:`rgba(45,140,255,0.06)`, border:`1px solid rgba(45,140,255,0.15)` }}>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span style={{ color:ACCENT }}><IconCalendar /></span>
            {FR_DAYS_LONG[new Date(selectedDate).getDay()]} {new Date(selectedDate).getDate()} {FR_MONTHS[new Date(selectedDate).getMonth()]} {new Date(selectedDate).getFullYear()}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span style={{ color:ACCENT }}><IconClock /></span>
            {selectedSlot.heure} · {agendaCfg.defaultDuree} min
          </div>
          {praticien && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span style={{ color:ACCENT }}><IconUser /></span>
              {praticien}
            </div>
          )}
          <div className="text-xs font-medium rounded-full px-2.5 py-0.5 inline-block" style={{ background:"rgba(45,140,255,0.10)", color:ACCENT }}>
            {TYPE_LABELS[rdvType]}
          </div>
        </div>

        {/* Patient info */}
        <div className="grid grid-cols-2 gap-3">
          {[["Prénom", patient.prenom], ["Nom", patient.nom]].map(([label, val]) => (
            <div key={label}>
              <label className="block text-xs font-semibold text-slate-400 mb-1">{label}</label>
              <div className="rounded-xl px-3 py-2.5 text-sm text-slate-700" style={glassSubtle}>{val}</div>
            </div>
          ))}
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Message (optionnel)</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            placeholder="Précisez si besoin (symptômes, demande particulière…)"
            className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none resize-none"
            style={glassSubtle}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium text-slate-500 transition hover:text-slate-700"
            style={glassSubtle}
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(selectedDate, selectedSlot.heure, praticien, message)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background:ACCENT, boxShadow:"0 4px 16px rgba(45,140,255,0.3)" }}
          >
            <IconCalendar /> Confirmer le rendez-vous
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl p-6 space-y-5" style={glass}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            {step === "pick-day" ? "Choisissez une date" : `${FR_DAYS_LONG[new Date(selectedDate!).getDay()]} ${new Date(selectedDate!).getDate()} ${FR_MONTHS[new Date(selectedDate!).getMonth()]}`}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {step === "pick-day" ? "Les jours en vert ont des créneaux disponibles" : "Sélectionnez un horaire"}
          </p>
        </div>
        {step === "pick-slot" && (
          <button onClick={() => { setStep("pick-day"); setSelectedDate(null); }} className="rounded-xl p-2 text-slate-400 hover:text-slate-600 transition" style={glassSubtle}>
            <IconChevronLeft />
          </button>
        )}
        {step === "pick-day" && (
          <button onClick={onCancel} className="rounded-xl p-2 text-slate-400 hover:text-slate-600 transition" style={glassSubtle}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        )}
      </div>

      {/* Week navigator */}
      {step === "pick-day" && (
        <>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              disabled={weekOffset <= 0}
              className="rounded-xl p-2 transition disabled:opacity-30 disabled:cursor-not-allowed"
              style={glassSubtle}
            >
              <IconChevronLeft />
            </button>
            <span className="text-sm font-medium text-slate-600">
              {days[0]!.getDate()} {FR_MONTHS[days[0]!.getMonth()]?.slice(0,3)} – {days[6]!.getDate()} {FR_MONTHS[days[6]!.getMonth()]?.slice(0,3)} {days[6]!.getFullYear()}
            </span>
            <button
              onClick={() => setWeekOffset(w => w + 1)}
              disabled={weekOffset >= 7}
              className="rounded-xl p-2 transition"
              style={glassSubtle}
            >
              <IconChevronRight />
            </button>
          </div>

          {/* Day buttons */}
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((d, i) => {
              const isPast  = d < today;
              const count   = slotCounts[i] ?? 0;
              const isOpen  = count > 0;
              const isSelected = selectedDate === isoDate(d);
              return (
                <button
                  key={i}
                  onClick={() => handleDayClick(d, count)}
                  disabled={isPast || !isOpen}
                  className="flex flex-col items-center rounded-2xl py-3 px-1 transition-all text-center disabled:opacity-35 disabled:cursor-not-allowed"
                  style={
                    isSelected
                      ? { background:ACCENT, color:"white", border:"none", boxShadow:`0 4px 14px rgba(45,140,255,0.35)` }
                      : isOpen
                        ? { background:"rgba(16,185,129,0.08)", border:"1.5px solid rgba(16,185,129,0.3)", cursor:"pointer" }
                        : glassSubtle
                  }
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: isSelected?"rgba(255,255,255,0.8)" : isOpen ? "#059669" : "#94a3b8" }}>
                    {FR_DAYS_SHORT[d.getDay()]}
                  </span>
                  <span className="text-lg font-bold mt-0.5 leading-none" style={{ color: isSelected?"white" : isOpen ? "#065f46" : "#cbd5e1" }}>
                    {d.getDate()}
                  </span>
                  {!isPast && (
                    <span className="mt-1.5 text-[9px] font-bold rounded-full px-1.5 py-0.5 leading-none"
                      style={
                        isSelected
                          ? { background:"rgba(255,255,255,0.25)", color:"white" }
                          : isOpen
                            ? { background:"rgba(16,185,129,0.15)", color:"#059669" }
                            : { background:"rgba(203,213,225,0.3)", color:"#94a3b8" }
                      }
                    >
                      {isOpen ? `${count}` : "—"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background:"#10b981" }} />
              Créneaux disponibles
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background:"rgba(203,213,225,0.6)" }} />
              Fermé / complet
            </span>
          </div>
        </>
      )}

      {/* Slot grid */}
      {step === "pick-slot" && selectedDate && (
        <>
          {daySlots.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400">Aucun créneau disponible ce jour.</p>
              <button onClick={() => setStep("pick-day")} className="mt-3 text-sm font-medium" style={{ color:ACCENT }}>
                ← Choisir une autre date
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-400">{daySlots.length} créneau{daySlots.length>1?"x":""} disponible{daySlots.length>1?"s":""}</p>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {daySlots.map(slot => {
                  const isSelected = selectedSlot?.heure === slot.heure;
                  return (
                    <button
                      key={slot.heure}
                      onClick={() => handleSlotClick(slot)}
                      className="rounded-xl py-2.5 text-sm font-semibold transition-all"
                      style={
                        isSelected
                          ? { background:ACCENT, color:"white", border:"none", boxShadow:`0 4px 12px rgba(45,140,255,0.3)` }
                          : { ...glassSubtle, color:"#334155", cursor:"pointer" }
                      }
                    >
                      {slot.heure}
                    </button>
                  );
                })}
              </div>
              {/* Show available professional per slot */}
              {selectedSlot && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ background:"rgba(45,140,255,0.06)", border:"1px solid rgba(45,140,255,0.12)" }}>
                  <span className="text-slate-500">Avec : </span>
                  <span className="font-medium text-slate-700">{selectedSlot.praticiens.join(", ")}</span>
                  <button
                    onClick={() => setStep("confirm")}
                    className="ml-3 rounded-lg px-3 py-1 text-xs font-semibold text-white"
                    style={{ background:ACCENT }}
                  >
                    Confirmer →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────── */
const MAX_PAST_VISIBLE = 5;

export default function RendezVousVisionPage() {
  const [patient, setPatient]           = useState<CurrentPatient>(MOCK_PATIENT);
  const [upcomingRdvs, setUpcomingRdvs] = useState<RendezVous[]>([]);
  const [pastRdvs, setPastRdvs]         = useState<RendezVous[]>([]);
  const [bookingOpen, setBookingOpen]   = useState(false);
  const [rdvType, setRdvType]           = useState<RdvType>("controle");
  const [toastVisible, setToastVisible] = useState(false);
  const [selectingType, setSelectingType] = useState(false);
  const [showAllPast, setShowAllPast]   = useState(false);

  const loadData = useCallback(() => {
    const p = loadCurrentPatient();
    setPatient(p);
    const today = new Date().toISOString().split("T")[0] ?? "";
    const all   = loadLS<RendezVous>("thor_pro_rdv");
    const mine  = all.filter(r => samePatient(r.patientNom, r.patientPrenom, p));
    setUpcomingRdvs(mine.filter(r => r.date >= today).sort((a,b) => a.date.localeCompare(b.date)||a.heure.localeCompare(b.heure)));
    setPastRdvs   (mine.filter(r => r.date  < today).sort((a,b) => b.date.localeCompare(a.date)));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function handleConfirm(date: string, heure: string, praticien: string, message: string) {
    const newRdv: RendezVous = {
      id: genId(), date, heure,
      duree: loadAgendaCfg().defaultDuree,
      type: rdvType,
      patientNom: patient.nom, patientPrenom: patient.prenom,
      notes: message || undefined,
      praticien: praticien || undefined,
      statut: "planifie",
    };
    const all = loadLS<RendezVous>("thor_pro_rdv");
    saveLS("thor_pro_rdv", [...all, newRdv]);
    setBookingOpen(false);
    setSelectingType(false);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 4000);
    loadData();
  }

  function startBooking() { setSelectingType(true); setBookingOpen(false); }

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mes rendez-vous</h1>
          <p className="mt-1 text-sm text-slate-500">Gérez vos rendez-vous Clair Vision</p>
        </div>
        {!bookingOpen && !selectingType && (
          <button
            onClick={startBooking}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background:ACCENT, boxShadow:"0 4px 18px rgba(45,140,255,0.32)" }}
          >
            <IconPlus /> Prendre un rendez-vous
          </button>
        )}
      </div>

      {/* ── Type selection ── */}
      {selectingType && (
        <div className="rounded-3xl p-6 space-y-5" style={glass}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Quel type de rendez-vous ?</h2>
              <p className="text-xs text-slate-400 mt-0.5">Choisissez le motif de votre visite</p>
            </div>
            <button onClick={() => setSelectingType(false)} className="rounded-xl p-2 text-slate-400 hover:text-slate-600 transition" style={glassSubtle}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { setRdvType(opt.value); setSelectingType(false); setBookingOpen(true); }}
                className="flex items-start gap-3 rounded-2xl px-4 py-4 text-left transition-all hover:scale-[1.02]"
                style={rdvType===opt.value
                  ? { background:ACCENT, color:"white", boxShadow:`0 4px 16px rgba(45,140,255,0.3)` }
                  : { ...glassSubtle, color:"#334155" }}
              >
                <span className="text-2xl leading-none">{opt.icon}</span>
                <div>
                  <div className="text-sm font-semibold">{opt.label}</div>
                  <div className="text-xs opacity-70 mt-0.5">{opt.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Slot picker ── */}
      {bookingOpen && (
        <SlotPicker
          rdvType={rdvType}
          patient={patient}
          onConfirm={handleConfirm}
          onCancel={() => { setBookingOpen(false); setSelectingType(false); }}
        />
      )}

      {/* ── Upcoming ── */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-700">
          Rendez-vous à venir
          {upcomingRdvs.length > 0 && (
            <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background:ACCENT }}>
              {upcomingRdvs.length}
            </span>
          )}
        </h2>
        {upcomingRdvs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {upcomingRdvs.map(rdv => <RdvCard key={rdv.id} rdv={rdv} />)}
          </div>
        ) : (
          <div className="rounded-2xl p-8 text-center" style={glass}>
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl" style={{ background:"rgba(45,140,255,0.08)" }}>
              <span style={{ color:ACCENT }}><IconCalendar /></span>
            </div>
            <p className="text-sm text-slate-500">Aucun rendez-vous à venir</p>
            <button
              onClick={startBooking}
              className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
              style={{ background:"rgba(45,140,255,0.10)", color:ACCENT }}
            >
              <IconPlus /> Prendre un rendez-vous
            </button>
          </div>
        )}
      </section>

      {/* ── Mes rendez-vous passés ── */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-700">
          Mes rendez-vous passés
          {pastRdvs.length > 0 && (
            <span
              className="ml-2 rounded-full px-2 py-0.5 text-xs font-bold"
              style={{ background: "rgba(148,163,184,0.18)", color: "#64748b" }}
            >
              {pastRdvs.length}
            </span>
          )}
        </h2>
        {pastRdvs.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={glass}>
            <p className="text-sm text-slate-500">Aucun rendez-vous enregistré</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl overflow-hidden" style={glass}>
              {(showAllPast ? pastRdvs : pastRdvs.slice(0, MAX_PAST_VISIBLE)).map((rdv, idx, arr) => (
                <div
                  key={rdv.id}
                  style={idx < arr.length - 1 ? { borderBottom: "1px solid rgba(148,163,184,0.15)" } : undefined}
                >
                  <RdvCard rdv={rdv} past />
                </div>
              ))}
            </div>
            {pastRdvs.length > MAX_PAST_VISIBLE && (
              <div className="mt-3 text-center">
                <button
                  onClick={() => setShowAllPast(v => !v)}
                  className="rounded-xl px-5 py-2 text-sm font-semibold transition-all hover:opacity-80"
                  style={{ background: "rgba(45,140,255,0.08)", color: ACCENT }}
                >
                  {showAllPast
                    ? "Voir moins"
                    : `Voir plus (${pastRdvs.length - MAX_PAST_VISIBLE} de plus)`}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <Toast visible={toastVisible} />
    </div>
  );
}
