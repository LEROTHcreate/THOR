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

/* ── Mock data ───────────────────────────────────────────────────────────── */
const rdvDuJour = [
  { time: "09:00", name: "Marie Leblanc",  type: "Examen de vue complet",    done: true  },
  { time: "10:30", name: "Paul Renaud",    type: "Adaptation lentilles",      done: false },
  { time: "14:00", name: "Isabelle Morel", type: "Contrôle annuel",           done: false },
  { time: "15:30", name: "Thomas Girard",  type: "Renouvellement ordonnance", done: false },
];

const taches = [
  { id: 1, label: "Compléter dossier Isabelle Morel",  priority: "haute",  href: "/clair-vision/pro/optique/dossiers", done: false },
  { id: 2, label: "Renouveler ordonnance Paul Renaud", priority: "haute",  href: "/clair-vision/pro/ordonnances",      done: false },
  { id: 3, label: "Valider devis Claire Petit",        priority: "normal", href: "/clair-vision/pro/devis",            done: false },
  { id: 4, label: "Rappeler Marc Durand (RDV manqué)", priority: "normal", href: "/clair-vision/pro/patients",         done: true  },
];

const alertes = [
  { msg: "2 ordonnances expirent dans moins de 30 jours", type: "danger",  href: "/clair-vision/pro/ordonnances" },
  { msg: "3 dossiers ont des informations manquantes",     type: "warning", href: "/clair-vision/pro/optique/dossiers" },
  { msg: "Prochain RDV : Paul Renaud à 10h30",             type: "info",    href: "/clair-vision/pro/agenda" },
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

/* ── Task item ────────────────────────────────────────────────────────────── */
function TaskItem({
  task, onToggle,
}: {
  task: typeof taches[0];
  onToggle: (id: number) => void;
}) {
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
          ? { borderColor: "#00C98A", background: "#00C98A" }
          : { borderColor: "#cbd5e1", background: "transparent" }}
      >
        {task.done && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </button>
      <Link href={task.href} className={`flex-1 text-sm transition-colors hover:text-[#2D8CFF] ${task.done ? "line-through text-slate-400" : "text-slate-700"}`}>
        {task.label}
      </Link>
      <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 flex-shrink-0" style={{ background: priorityStyle.bg, color: priorityStyle.color, border: priorityStyle.border }}>
        {task.priority}
      </span>
    </div>
  );
}

/* ── User display name ───────────────────────────────────────────────────── */
function getUserDisplayName(user: ProUser): string {
  if (user.role === "Optométriste") {
    const parts = user.name.split(" ");
    return `Dr. ${parts[parts.length - 1] ?? user.name}`;
  }
  return user.name.split(" ")[0] ?? user.name;
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function BriefingDuJour() {
  const [now, setNow] = useState(new Date());
  const [tasks, setTasks] = useState(taches);
  const [alertDismissed, setAlertDismissed] = useState<number[]>([]);
  const [displayName, setDisplayName] = useState("Dr. Martin");

  useEffect(() => {
    const users = loadUsers();
    const curId = loadCurrentUserId();
    const user = users.find(u => u.id === curId) ?? users[0];
    if (user) setDisplayName(getUserDisplayName(user));

    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const greeting  = getGreeting(now.getHours());
  const nextRdv   = getNextRdv(now);
  const doneCount = rdvDuJour.filter(r => r.done).length;
  const taskLeft  = tasks.filter(t => !t.done).length;
  const visibleAlerts = alertes.filter((_, i) => !alertDismissed.includes(i));

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const alertStyle = {
    danger:  { bg: "rgba(239,68,68,0.07)",    border: "1px solid rgba(239,68,68,0.20)",    color: "#EF4444",  icon: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4M12 17h.01" },
    warning: { bg: "rgba(245,158,11,0.07)",   border: "1px solid rgba(245,158,11,0.20)",   color: "#F59E0B",  icon: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4M12 17h.01" },
    info:    { bg: "rgba(45,140,255,0.07)",   border: "1px solid rgba(45,140,255,0.20)",   color: "#2D8CFF",  icon: "M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2ZM12 8h.01M12 12v4" },
  };

  return (
    <div
      className="rounded-[var(--radius-large)] overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(45,140,255,0.06) 0%, rgba(255,255,255,0.58) 60%, rgba(0,201,138,0.04) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid var(--glass-border)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
      }}
    >
      {/* ── Top band ── */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-200/50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {/* Greeting + date */}
          <div>
            <div className="flex items-center gap-2.5">
              <div
                className="grid h-9 w-9 place-items-center rounded-xl flex-shrink-0"
                style={{ background: "#2D8CFF", boxShadow: "0 2px 8px rgba(45,140,255,.25)" }}
              >
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {greeting}, {displayName}
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
            <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold text-[#2D8CFF]" style={{ background: "rgba(45,140,255,0.10)", border: "1px solid rgba(45,140,255,0.18)" }}>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              {doneCount}/{rdvDuJour.length} RDV
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold text-[#8B5CF6]" style={{ background: "rgba(139,92,246,0.10)", border: "1px solid rgba(139,92,246,0.18)" }}>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              {taskLeft} tâche{taskLeft > 1 ? "s" : ""} restante{taskLeft > 1 ? "s" : ""}
            </span>
            {visibleAlerts.filter(a => a.type === "danger").length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold text-[#EF4444]" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.18)" }}>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4M12 17h.01"/></svg>
                {visibleAlerts.filter(a => a.type === "danger").length} alerte{visibleAlerts.filter(a => a.type === "danger").length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Next appointment banner */}
        {nextRdv && (
          <div
            className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: "rgba(45,140,255,0.07)", border: "1px solid rgba(45,140,255,0.18)" }}
          >
            <div className="grid h-8 w-8 place-items-center rounded-lg flex-shrink-0" style={{ background: "rgba(45,140,255,0.12)" }}>
              <svg className="w-4 h-4 text-[#2D8CFF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-slate-500">Prochain RDV</span>
              <div className="text-sm font-semibold text-slate-800">
                <span className="text-[#2D8CFF]">{nextRdv.rdv.time}</span>
                {" — "}{nextRdv.rdv.name}
                <span className="ml-1 text-slate-500 font-normal">· {nextRdv.rdv.type}</span>
              </div>
            </div>
            <span
              className="text-xs font-bold rounded-[var(--radius-pill)] px-3 py-1 flex-shrink-0"
              style={{ background: "#2D8CFF", color: "white", boxShadow: "0 2px 8px rgba(45,140,255,.25)" }}
            >
              {formatCountdown(nextRdv.diffMs)}
            </span>
          </div>
        )}
      </div>

      {/* ── Body : alerts + tasks ── */}
      <div className="grid gap-0 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/50">

        {/* Alertes prioritaires */}
        <div className="px-6 py-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Alertes du jour</div>
          {visibleAlerts.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-[#00C98A]">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              Aucune alerte — tout est en ordre !
            </div>
          ) : (
            <div className="space-y-2">
              {visibleAlerts.map((a, i) => {
                const s = alertStyle[a.type as keyof typeof alertStyle];
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
                    style={{ background: s.bg, border: s.border }}
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={s.icon}/>
                    </svg>
                    <Link href={a.href} className="flex-1 text-xs text-slate-700 hover:text-[#2D8CFF] transition-colors">
                      {a.msg}
                    </Link>
                    <button
                      onClick={() => setAlertDismissed(prev => [...prev, i])}
                      className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0"
                      aria-label="Ignorer"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tâches */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tâches prioritaires</div>
            <span className="text-[11px] text-slate-400">{tasks.filter(t => t.done).length}/{tasks.length} faites</span>
          </div>
          <div className="space-y-2">
            {tasks.map(task => (
              <TaskItem key={task.id} task={task} onToggle={toggleTask} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
