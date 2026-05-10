"use client";

import type { CSSProperties } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";

const glass: CSSProperties = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--glass-border)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
};

const repartitionRdv = [
  { name: "Bilan auditif",  value: 34, color: "#00C98A" },
  { name: "Adaptation",     value: 28, color: "#6366f1" },
  { name: "Contrôle",       value: 18, color: "#00C98A" },
  { name: "Livraison",      value: 12, color: "#f59e0b" },
  { name: "Suivi",          value: 8,  color: "#a855f7" },
];

/* ── Mock data ─────────────────────────────────────────────────────────── */
const rdvSemaine = [
  { jour: "Lun", rdv: 3, bilans: 1 },
  { jour: "Mar", rdv: 5, bilans: 2 },
  { jour: "Mer", rdv: 2, bilans: 1 },
  { jour: "Jeu", rdv: 4, bilans: 2 },
  { jour: "Ven", rdv: 6, bilans: 3 },
  { jour: "Sam", rdv: 1, bilans: 0 },
];

const evolution6mois = [
  { mois: "Oct", patients: 82, appareils: 148 },
  { mois: "Nov", patients: 87, appareils: 152 },
  { mois: "Déc", patients: 88, appareils: 155 },
  { mois: "Jan", patients: 91, appareils: 158 },
  { mois: "Fév", patients: 95, appareils: 163 },
  { mois: "Mar", patients: 98, appareils: 167 },
];

/* ── Custom tooltip ─────────────────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-lg"
      style={{ background: "var(--glass-card-bg)", border: "1px solid rgba(0,201,138,0.2)" }}
    >
      <div className="font-semibold text-slate-700 mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name} : <span className="font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Charts ────────────────────────────────────────────────────────────── */
export function RdvSemaineChart() {
  return (
    <div className="rounded-[var(--radius-large)] p-5" style={glass}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-slate-800">Activité de la semaine</div>
          <div className="text-xs text-slate-500 mt-0.5">RDV et bilans par jour</div>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "#00C98A" }} />
            RDV
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(0,201,138,0.25)" }} />
            Bilans
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={rdvSemaine} barGap={4} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.05)" />
          <XAxis
            dataKey="jour"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            width={20}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,201,138,0.04)" }} />
          <Bar dataKey="rdv" name="RDV" fill="#00C98A" radius={[4, 4, 0, 0]} />
          <Bar dataKey="bilans" name="Bilans" fill="rgba(0,201,138,0.25)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Evolution6MoisChart() {
  return (
    <div className="rounded-[var(--radius-large)] p-5" style={glass}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-slate-800">Évolution sur 6 mois</div>
          <div className="text-xs text-slate-500 mt-0.5">Patients actifs & appareils en suivi</div>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "#00C98A" }} />
            Patients
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "#00C98A" }} />
            Appareils
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={evolution6mois}>
          <defs>
            <linearGradient id="gradPatients" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00C98A" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#00C98A" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradAppareils" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00C98A" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#00C98A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.05)" />
          <XAxis
            dataKey="mois"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="patients"
            name="Patients"
            stroke="#00C98A"
            strokeWidth={2}
            fill="url(#gradPatients)"
            dot={{ r: 3, fill: "#00C98A", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
          <Area
            type="monotone"
            dataKey="appareils"
            name="Appareils"
            stroke="#00C98A"
            strokeWidth={2}
            fill="url(#gradAppareils)"
            dot={{ r: 3, fill: "#00C98A", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RepartitionRdvChart() {
  const total = repartitionRdv.reduce((s, e) => s + e.value, 0);
  return (
    <div className="rounded-[var(--radius-large)] p-5" style={glass}>
      <div className="mb-4">
        <div className="text-sm font-semibold text-slate-800">Répartition des RDV</div>
        <div className="text-xs text-slate-500 mt-0.5">Par type de consultation</div>
      </div>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={110} height={110}>
          <PieChart>
            <Pie
              data={repartitionRdv}
              cx="50%"
              cy="50%"
              innerRadius={32}
              outerRadius={50}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {repartitionRdv.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-2 flex-1">
          {repartitionRdv.map((e) => (
            <div key={e.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
                <span className="text-xs text-slate-600">{e.name}</span>
              </div>
              <span className="text-xs font-semibold text-slate-800">{Math.round((e.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
