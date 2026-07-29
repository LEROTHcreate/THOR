"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { proLabel, type ProRole } from "@/lib/utils";
import { Chart } from "@/components/charts/lazy-chart";

const glass = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--glass-border)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
} as React.CSSProperties;

const glassSubtle = {
  background: "var(--glass-subtle-bg)",
  border: "1px solid var(--glass-subtle-border)",
} as React.CSSProperties;

type Exam = {
  id: string;
  dateLabel: string;
  centreLabel: string;
  professionalName: string;
  professionalRole?: ProRole;
  summary: string;
  lockedReport?: boolean;
  vaOD: string;
  vaOG: string;
  refOD: string;
  refOG: string;
};

function getPlan(): "none" | "pack" | "complete" {
  if (typeof window === "undefined") return "none";
  return (localStorage.getItem("cv_plan") as any) || "none";
}
function getUnlockedSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem("cv_unlocked_docs");
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function Badge({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "success" | "info" | "locked";
}) {
  const cls =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : tone === "info"
      ? "bg-blue-50 text-blue-700 border-blue-100"
      : tone === "locked"
      ? "bg-purple-50 text-purple-700 border-purple-200"
      : "bg-slate-50 text-slate-600 border-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}
    >
      {children}
    </span>
  );
}

function IconLock({ className = "" } = {}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M7.5 11V8.6A4.5 4.5 0 0 1 12 4.1a4.5 4.5 0 0 1 4.5 4.5V11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7 11h10a2 2 0 0 1 2 2v6.2A2.8 2.8 0 0 1 16.2 22H7.8A2.8 2.8 0 0 1 5 19.2V13a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

interface Ordonnance {
  id: string;
  patientNom?: string;
  patientPrenom?: string;
  date?: string;
  sphereOD?: string;
  sphereOG?: string;
  cylindreOD?: string;
  cylindreOG?: string;
}

interface ChartPoint {
  dateLabel: string;
  dateRaw: string;
  od: number | null;
  og: number | null;
}

const MOCK_DATA: ChartPoint[] = [
  { dateLabel: "Jan 2024", dateRaw: "2024-01-15", od: -2.0, og: -1.75 },
  { dateLabel: "Jan 2025", dateRaw: "2025-01-20", od: -2.25, og: -2.0 },
  { dateLabel: "Jan 2026", dateRaw: "2026-01-10", od: -2.5, og: -2.25 },
];

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
}

function buildChartData(): ChartPoint[] {
  if (typeof window === "undefined") return MOCK_DATA;
  try {
    const raw = localStorage.getItem("thor_pro_ordonnances");
    if (!raw) return MOCK_DATA;
    const all: Ordonnance[] = JSON.parse(raw);

    const patientRaw = localStorage.getItem("thor_patient_current");
    let nomFilter = "";
    let prenomFilter = "";
    if (patientRaw) {
      const p = JSON.parse(patientRaw) as { nom?: string; prenom?: string };
      nomFilter = (p.nom ?? "").toLowerCase().trim();
      prenomFilter = (p.prenom ?? "").toLowerCase().trim();
    }

    const filtered =
      nomFilter || prenomFilter
        ? all.filter(
            (o) =>
              (o.patientNom ?? "").toLowerCase().trim() === nomFilter &&
              (o.patientPrenom ?? "").toLowerCase().trim() === prenomFilter
          )
        : all;

    if (filtered.length === 0) return MOCK_DATA;

    const points: ChartPoint[] = filtered
      .filter((o) => !!o.date)
      .map((o) => {
        const od = parseFloat(o.sphereOD ?? "");
        const og = parseFloat(o.sphereOG ?? "");
        return {
          dateLabel: formatDateLabel(o.date!),
          dateRaw: o.date!,
          od: isNaN(od) ? null : od,
          og: isNaN(og) ? null : og,
        };
      })
      .sort((a, b) => a.dateRaw.localeCompare(b.dateRaw));

    return points.length > 0 ? points : MOCK_DATA;
  } catch {
    return MOCK_DATA;
  }
}

function VisionEvolutionChart() {
  const data = useMemo(() => buildChartData(), []);
  const isMock = data === MOCK_DATA;
  const hasEnough = data.length >= 2;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tooltipFormatter = (value: any, name: any) => {
    const label = name === "od" ? "OD" : "OG";
    const num = typeof value === "number" ? value : parseFloat(String(value ?? "0"));
    return [`${num > 0 ? "+" : ""}${isNaN(num) ? "0.00" : num.toFixed(2)} δ`, label];
  };

  const legendFormatter = (value: string) =>
    value === "od" ? "Œil droit (OD)" : "Œil gauche (OG)";

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid var(--glass-border)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "4px" }}>
        <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
          Évolution de votre vue
        </span>
        {isMock && (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "#8b5cf6",
              background: "rgba(139,92,246,0.08)",
              border: "1px solid rgba(139,92,246,0.18)",
              borderRadius: "999px",
              padding: "1px 8px",
            }}
          >
            Exemple
          </span>
        )}
      </div>
      <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "18px" }}>
        Sphère en dioptries
      </p>

      {!hasEnough ? (
        <div
          style={{
            height: 220,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            color: "#64748b",
            fontSize: "13px",
            padding: "0 24px",
          }}
        >
          Pas encore assez de données pour afficher l&apos;évolution.
          <br />
          Votre graphique apparaîtra après votre deuxième visite.
        </div>
      ) : (
        <Chart height={220} render={({ ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend }) => (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.07)" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              label={{
                value: "Sphère (dioptries)",
                angle: -90,
                position: "insideLeft",
                offset: 12,
                style: { fontSize: 10, fill: "#94a3b8" },
              }}
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => (v > 0 ? `+${v}` : `${v}`)}
            />
            <Tooltip
              formatter={tooltipFormatter}
              contentStyle={{
                background: "var(--glass-card-bg)",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: "10px",
                fontSize: "12px",
              }}
            />
            <Legend formatter={legendFormatter} wrapperStyle={{ fontSize: "12px" }} />
            <Line
              type="monotone"
              dataKey="od"
              name="od"
              stroke="#2D8CFF"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#2D8CFF" }}
              activeDot={{ r: 6 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="og"
              name="og"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              strokeDasharray="5 3"
              dot={{ r: 4, fill: "#8b5cf6" }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
        )} />
      )}
    </div>
  );
}

export default function ExamensDeVuePage() {
  const router = useRouter();
  const plan = getPlan();
  const unlockedSet = getUnlockedSet();

  const exams: Exam[] = useMemo(
    () => [
      {
        id: "exam_2024_11",
        dateLabel: "15 nov. 2024",
        centreLabel: "Clair Vision — Paris 8",
        professionalName: "Sophie Martin",
        professionalRole: "opticien",
        summary:
          "Légère évolution de la myopie OD. Astigmatisme stable. Pas de pathologie détectée.",
        lockedReport: false,
        vaOD: "10/10",
        vaOG: "10/10",
        refOD: "-2.25 (-0.50) 170°",
        refOG: "-1.75 (-0.25) 10°",
      },
      {
        id: "exam_2023_06",
        dateLabel: "10 juin 2023",
        centreLabel: "Clair Vision — Paris 8",
        professionalName: "L. Bernard",
        professionalRole: undefined,
        summary: "Examen antérieur (historique). Compte-rendu détaillé verrouillé.",
        lockedReport: true,
        vaOD: "—",
        vaOG: "—",
        refOD: "-2.00 (-0.50) 175°",
        refOG: "-1.50 (-0.25) 5°",
      },
    ],
    []
  );

  const isUnlocked = (id: string) =>
    plan === "pack" || plan === "complete" || unlockedSet.has(id);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">
            Examens <span className="font-bold">de vue</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Historique et synthèses (UI uniquement)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="info">Clair Vision</Badge>
          {plan === "complete" ? (
            <Badge tone="success">Accès complet</Badge>
          ) : plan === "pack" ? (
            <Badge tone="success">Pack</Badge>
          ) : (
            <Badge>Sans abonnement</Badge>
          )}
        </div>
      </div>

      <div className="mt-6">
        <VisionEvolutionChart />
      </div>

      <div className="mt-6 space-y-4">
        {exams.map((e) => {
          const locked = !!e.lockedReport && !isUnlocked(e.id);
          return (
            <div
              key={e.id}
              className="rounded-2xl p-5"
              style={glass}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-slate-900">
                      Examen de vue
                    </div>
                    <Badge tone="info">{e.dateLabel}</Badge>
                    {locked ? (
                      <Badge tone="locked">Compte-rendu verrouillé</Badge>
                    ) : (
                      <Badge tone="success">Disponible</Badge>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {e.centreLabel} •{" "}
                    {proLabel(e.professionalName, e.professionalRole)}
                  </div>
                  <div className="mt-3 text-sm text-slate-700">{e.summary}</div>
                </div>

                {locked ? (
                  <button
                    onClick={() =>
                      router.push(`/clair-vision/espace-patient/achats?unlock=${e.id}`)
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-100"
                  >
                    <IconLock className="h-4 w-4" />
                    Déverrouiller
                  </button>
                ) : (
                  <button
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                    style={{ background: "#2D8CFF" }}
                  >
                    Voir le détail
                  </button>
                )}
              </div>

              <div className="mt-5 relative">
                <div className={locked ? "blur-[4px] select-none pointer-events-none" : ""}>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl p-4" style={glassSubtle}>
                      <div className="text-xs text-slate-500">Acuité visuelle</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        OD {e.vaOD} • OG {e.vaOG}
                      </div>
                    </div>
                    <div className="rounded-xl p-4" style={glassSubtle}>
                      <div className="text-xs text-slate-500">Réfraction</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        OD {e.refOD} • OG {e.refOG}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl p-4" style={glassSubtle}>
                    <div className="text-xs text-slate-500">Documents liés (UI)</div>
                    <div className="mt-2 text-sm text-slate-700">
                      Compte-rendu PDF, mesures, recommandations écran.
                    </div>
                  </div>
                </div>

                {locked ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-2xl p-4 backdrop-blur" style={glass}>
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <IconLock className="h-4 w-4 text-purple-700" />
                        Contenu protégé (acte praticien)
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        Déverrouillez pour voir les détails complets.
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
