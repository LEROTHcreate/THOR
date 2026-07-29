"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { loadUsers, loadCurrentUserId, type ProUser } from "@/lib/users";

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

const PRIMARY   = "#00C98A";
const PRIMARY_D = "#059669";

/* ── Mock data ───────────────────────────────────────────────────────────── */
const rdvDuJour = [
  { time: "08:45", name: "Jean-Paul Moreau",  type: "Bilan audiométrique",     done: true  },
  { time: "10:00", name: "Simone Lefranc",    type: "Adaptation — Phonak",      done: false },
  { time: "11:30", name: "André Bernin",      type: "Contrôle semestriel",      done: false },
  { time: "14:15", name: "Marie Dupont",      type: "Livraison appareils",      done: false },
  { time: "16:00", name: "Robert Chauvet",    type: "Essai — Oticon Intent 1",  done: false },
];

const taches = [
  { id: 1, label: "Télétransmettre dossier Moreau (LPPR)",      priority: "haute",  href: "/clair-audition/pro/dossiers",        done: false },
  { id: 2, label: "Renouveler ordonnance ORL — Bernin",         priority: "haute",  href: "/clair-audition/pro/ordonnances",      done: false },
  { id: 3, label: "Valider devis Oticon — Chauvet",             priority: "normal", href: "/clair-audition/pro/devis",            done: false },
  { id: 4, label: "Programmer renouvellement SS — Lefranc 2026",priority: "normal", href: "/clair-audition/pro/renouvellements",  done: true  },
];

const alertes = [
  { msg: "2 ordonnances ORL expirent dans moins de 30 jours",  type: "danger",  href: "/clair-audition/pro/ordonnances"      },
  { msg: "3 renouvellements SS à planifier ce trimestre",       type: "warning", href: "/clair-audition/pro/renouvellements"   },
  { msg: "Prochain RDV : Simone Lefranc à 10h00 — Adaptation", type: "info",    href: "/clair-audition/pro/agenda"            },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function getGreeting(h: number) {
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function getNextRdv(now: Date) {
  const todayBase = new Date(now);
  for (const rdv of rdvDuJour) {
    if (rdv.done) continue;
    const [hh, mm] = rdv.time.split(":").map(Number);
    todayBase.setHours(hh, mm, 0, 0);
    const diff = todayBase.getTime() - now.getTime();
    if (diff > 0) return { rdv, diffMs: diff };
  }
  return null;
}

function formatCountdown(ms: number) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `dans ${h}h${m > 0 ? String(m).padStart(2, "0") : ""}`;
  return `dans ${m} min`;
}

function getUserDisplayName(user: ProUser): string {
  if (user.role === "Audioprothésiste") {
    const parts = user.name.split(" ");
    return parts[0] ?? user.name;
  }
  return user.name.split(" ")[0] ?? user.name;
}

/* ── Task item ────────────────────────────────────────────────────────────── */
function TaskItem({ task, onToggle }: { task: typeof taches[0]; onToggle: (id: number) => void }) {
  const priorityStyle =
    task.priority === "haute"
      ? { color: "#EF4444", bg: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.18)" }
      : { color: "#8B5CF6", bg: "rgba(139,92,246,0.09)", border: "1px solid rgba(139,92,246,0.18)" };
  return (
    <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${task.done ? "opacity-40" : ""}`} style={glassSubtle}>
      <button
        onClick={() => onToggle(task.id)}
        className="h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
        style={task.done
          ? { borderColor: PRIMARY, background: PRIMARY }
          : { borderColor: "#cbd5e1", background: "transparent" }}
      >
        {task.done && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </button>
      <Link
        href={task.href}
        className={`flex-1 text-sm transition-colors hover:text-[${PRIMARY}] ${task.done ? "line-through text-slate-500" : "text-slate-700"}`}
      >
        {task.label}
      </Link>
      <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 flex-shrink-0"
        style={{ background: priorityStyle.bg, color: priorityStyle.color, border: priorityStyle.border }}>
        {task.priority}
      </span>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function BriefingDuJour() {
  const [now, setNow] = useState(new Date());
  const [tasks, setTasks] = useState(taches);
  const [alertDismissed, setAlertDismissed] = useState<number[]>([]);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const users = loadUsers();
    const curId = loadCurrentUserId();
    const user = users.find(u => u.id === curId) ?? users[0];
    if (user) setDisplayName(getUserDisplayName(user));
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const greeting       = getGreeting(now.getHours());
  const nextRdv        = getNextRdv(now);
  const doneCount      = rdvDuJour.filter(r => r.done).length;
  const taskLeft       = tasks.filter(t => !t.done).length;
  const visibleAlertes = alertes.filter((_, i) => !alertDismissed.includes(i));

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const alertStyle = {
    danger:  { bg: "rgba(239,68,68,0.07)",   border: "1px solid rgba(239,68,68,0.20)",   color: "#EF4444", icon: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4M12 17h.01" },
    warning: { bg: "rgba(245,158,11,0.07)",  border: "1px solid rgba(245,158,11,0.20)",  color: "#F59E0B", icon: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4M12 17h.01" },
    info:    { bg: "rgba(0,201,138,0.07)",   border: "1px solid rgba(0,201,138,0.20)",   color: PRIMARY,   icon: "M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2ZM12 8h.01M12 12v4" },
  };

  return (
    <div
      className="rounded-[var(--radius-large)] overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(0,201,138,0.06) 0%, rgba(255,255,255,0.58) 60%, rgba(5,150,105,0.04) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid var(--glass-border)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
      }}
    >
      {/* ── Top band ────────────────────────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-200/50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {/* Greeting */}
          <div>
            <div className="flex items-center gap-2.5">
              <div
                className="grid h-9 w-9 place-items-center rounded-xl flex-shrink-0"
                style={{ background: PRIMARY, boxShadow: `0 2px 8px rgba(0,201,138,0.25)` }}
              >
                {/* Ear icon */}
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7-3 8-3 8H9a3 3 0 0 1-3-3" />
                  <path d="M10 13c0-1.5 1-2 1-3a2 2 0 0 0-4 0" />
                  <circle cx="12" cy="20" r="1" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {greeting}{displayName ? `, ${displayName}` : ""}
                </h2>
                <p className="text-xs text-slate-500">
                  {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  {" · "}
                  {now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </div>

          {/* Summary pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{ background: "rgba(0,201,138,0.10)", border: "1px solid rgba(0,201,138,0.18)", color: PRIMARY }}>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              {doneCount}/{rdvDuJour.length} RDV
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{ background: "rgba(139,92,246,0.10)", border: "1px solid rgba(139,92,246,0.18)", color: "#8B5CF6" }}>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              {taskLeft} tâche{taskLeft !== 1 ? "s" : ""} restante{taskLeft !== 1 ? "s" : ""}
            </span>
            {visibleAlertes.some(a => a.type === "danger") && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.18)", color: "#EF4444" }}>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4M12 17h.01"/></svg>
                {visibleAlertes.filter(a => a.type === "danger").length} alerte{visibleAlertes.filter(a => a.type === "danger").length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Prochain RDV banner */}
        {nextRdv && (
          <div className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: "rgba(0,201,138,0.07)", border: "1px solid rgba(0,201,138,0.18)" }}>
            <div className="grid h-8 w-8 place-items-center rounded-lg flex-shrink-0"
              style={{ background: "rgba(0,201,138,0.12)" }}>
              <svg className="w-4 h-4" style={{ color: PRIMARY }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-slate-500">Prochain RDV</span>
              <div className="text-sm font-semibold text-slate-800">
                <span style={{ color: PRIMARY }}>{nextRdv.rdv.time}</span>
                {" — "}{nextRdv.rdv.name}
                <span className="ml-1 text-slate-500 font-normal">· {nextRdv.rdv.type}</span>
              </div>
            </div>
            <span className="text-xs font-bold rounded-full px-3 py-1 flex-shrink-0 text-white"
              style={{ background: PRIMARY, boxShadow: "0 2px 8px rgba(0,201,138,.25)" }}>
              {formatCountdown(nextRdv.diffMs)}
            </span>
          </div>
        )}
      </div>

      {/* ── Body : alertes + tâches ──────────────────────────────────────────── */}
      <div className="grid gap-0 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/50">

        {/* Alertes du jour */}
        <div className="px-6 py-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Alertes du jour</div>
          {visibleAlertes.length === 0 ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: PRIMARY }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
              Aucune alerte — tout est en ordre !
            </div>
          ) : (
            <div className="space-y-2">
              {visibleAlertes.map((a, i) => {
                const s = alertStyle[a.type as keyof typeof alertStyle];
                return (
                  <div key={i} className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
                    style={{ background: s.bg, border: s.border }}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={s.icon}/>
                    </svg>
                    <Link href={a.href} className="flex-1 text-xs text-slate-700 hover:underline transition-colors">
                      {a.msg}
                    </Link>
                    <button
                      onClick={() => setAlertDismissed(prev => [...prev, i])}
                      className="h-4 w-4 flex-shrink-0 flex items-center justify-center rounded text-slate-500 hover:text-slate-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tâches du jour */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tâches du jour</div>
            {taskLeft === 0 && (
              <span className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ background: "rgba(0,201,138,0.10)", color: PRIMARY }}>
                Tout terminé ✓
              </span>
            )}
          </div>
          <div className="space-y-2">
            {tasks.map(task => (
              <TaskItem key={task.id} task={task} onToggle={toggleTask} />
            ))}
          </div>
        </div>

      </div>

      {/* ── RDV du jour ──────────────────────────────────────────────────────── */}
      <div className="border-t border-slate-200/50 px-6 py-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Agenda du jour</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {rdvDuJour.map((rdv, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all"
              style={{
                ...glassSubtle,
                opacity: rdv.done ? 0.5 : 1,
                borderLeft: rdv.done ? `3px solid ${PRIMARY}` : "3px solid rgba(203,213,225,0.60)",
              }}
            >
              <div className="text-xs font-bold flex-shrink-0 w-10" style={{ color: rdv.done ? PRIMARY : "#64748b" }}>
                {rdv.time}
              </div>
              <div className="min-w-0">
                <div className={`text-xs font-semibold truncate ${rdv.done ? "line-through text-slate-500" : "text-slate-700"}`}>
                  {rdv.name.split(" ")[0]}
                </div>
                <div className="text-[10px] text-slate-500 truncate">{rdv.type}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
