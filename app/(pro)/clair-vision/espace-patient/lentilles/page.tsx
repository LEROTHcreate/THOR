"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

type Tab = "Adaptation" | "Réadaptation" | "Suivi" | "Conseils";

type Visit = {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  status: "OK" | "À surveiller" | "À faire";
  lockedDoc?: boolean;
};

type LensParams = {
  brand: string;
  model: string;
  material: string;
  modality: string;
  bc: string;
  dia: string;
  powerOD: string;
  powerOG: string;
  cylAxisOD?: string;
  cylAxisOG?: string;
  notes: string[];
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
function IconCheck({ className = "" } = {}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M5 13.2 9.2 17.3 19 7.7"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Badge({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "success" | "warn" | "locked" | "info";
}) {
  const cls =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : tone === "warn"
      ? "bg-amber-50 text-amber-800 border-amber-100"
      : tone === "locked"
      ? "bg-purple-50 text-purple-700 border-purple-200"
      : tone === "info"
      ? "bg-blue-50 text-blue-700 border-blue-100"
      : "bg-slate-50 text-slate-600 border-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function SectionCard({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl p-5" style={glass}>
      <div className="flex items-start justify-between gap-4">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function DiagramLensOrientation() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-xl p-4" style={glassSubtle}>
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">A l'endroit</div>
          <Badge tone="success">OK</Badge>
        </div>
        <div className="mt-3 grid place-items-center rounded-xl p-3" style={glassSubtle}>
          <svg viewBox="0 0 240 140" className="h-28 w-full" fill="none" aria-hidden="true">
            <path d="M50 95c18-38 40-58 70-58s52 20 70 58" stroke="currentColor" strokeWidth="5" className="text-blue-600" />
            <path d="M64 95c10-10 18-14 26-14" stroke="currentColor" strokeWidth="5" className="text-emerald-600" strokeLinecap="round" />
            <path d="M176 95c-10-10-18-14-26-14" stroke="currentColor" strokeWidth="5" className="text-emerald-600" strokeLinecap="round" />
            <path d="M74 110h92" stroke="currentColor" strokeWidth="3" className="text-slate-500" strokeLinecap="round" />
          </svg>
        </div>
        <div className="mt-3 text-xs text-slate-600">
          Les bords remontent <span className="font-semibold text-slate-900">droit</span>, aspect "bol".
        </div>
      </div>

      <div className="rounded-xl p-4" style={glassSubtle}>
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">A l'envers</div>
          <Badge tone="warn">A corriger</Badge>
        </div>
        <div className="mt-3 grid place-items-center rounded-xl p-3" style={glassSubtle}>
          <svg viewBox="0 0 240 140" className="h-28 w-full" fill="none" aria-hidden="true">
            <path d="M55 95c20-28 40-42 65-42s45 14 65 42" stroke="currentColor" strokeWidth="5" className="text-blue-600" />
            <path d="M60 92c18 6 26 12 30 18" stroke="currentColor" strokeWidth="5" className="text-amber-600" strokeLinecap="round" />
            <path d="M180 92c-18 6-26 12-30 18" stroke="currentColor" strokeWidth="5" className="text-amber-600" strokeLinecap="round" />
            <path d="M92 40 148 96" stroke="currentColor" strokeWidth="5" className="text-rose-500" strokeLinecap="round" />
            <path d="M148 40 92 96" stroke="currentColor" strokeWidth="5" className="text-rose-500" strokeLinecap="round" />
          </svg>
        </div>
        <div className="mt-3 text-xs text-slate-600">
          Bords <span className="font-semibold text-slate-900">évasés</span> vers l'extérieur (aspect "assiette").
        </div>
      </div>
    </div>
  );
}

function DiagramInsertRemove() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-xl p-4" style={glassSubtle}>
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">Pose (2 gestes)</div>
          <Badge tone="info">Simple</Badge>
        </div>
        <div className="mt-3 rounded-xl p-3" style={glassSubtle}>
          <svg viewBox="0 0 320 120" className="h-28 w-full" fill="none" aria-hidden="true">
            <path d="M30 60s30-35 70-35 70 35 70 35-30 35-70 35-70-35-70-35Z" stroke="currentColor" strokeWidth="4" className="text-slate-500" />
            <circle cx="100" cy="60" r="16" stroke="currentColor" strokeWidth="4" className="text-slate-500" />
            <circle cx="235" cy="60" r="16" stroke="currentColor" strokeWidth="4" className="text-blue-600" />
            <path d="M245 60c0 6-5 11-11 11" stroke="currentColor" strokeWidth="4" className="text-blue-600" strokeLinecap="round" />
            <path d="M160 60h44" stroke="currentColor" strokeWidth="4" className="text-emerald-600" strokeLinecap="round" />
            <path d="M198 52l10 8-10 8" stroke="currentColor" strokeWidth="4" className="text-emerald-600" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="mt-2 text-xs text-slate-600">
            1) Lentille sur l'index • 2) Pose au centre en regardant droit.
          </div>
        </div>
      </div>

      <div className="rounded-xl p-4" style={glassSubtle}>
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">Retrait</div>
          <Badge tone="warn">Délicat</Badge>
        </div>
        <div className="mt-3 rounded-xl p-3" style={glassSubtle}>
          <svg viewBox="0 0 320 120" className="h-28 w-full" fill="none" aria-hidden="true">
            <path d="M30 60s30-35 70-35 70 35 70 35-30 35-70 35-70-35-70-35Z" stroke="currentColor" strokeWidth="4" className="text-slate-500" />
            <circle cx="100" cy="60" r="16" stroke="currentColor" strokeWidth="4" className="text-blue-600" />
            <path d="M210 40c20 10 20 30 0 40" stroke="currentColor" strokeWidth="4" className="text-amber-600" strokeLinecap="round" />
            <path d="M250 40c-20 10-20 30 0 40" stroke="currentColor" strokeWidth="4" className="text-amber-600" strokeLinecap="round" />
            <path d="M230 60h-24" stroke="currentColor" strokeWidth="4" className="text-amber-600" strokeLinecap="round" />
          </svg>
          <div className="mt-2 text-xs text-slate-600">
            Pince légère (pulpes, pas d'ongle). Si sec : humidifier avant.
          </div>
        </div>
      </div>
    </div>
  );
}

function TipIcon({ variant }: { variant: "handwash" | "nodrop" | "clock" | "noWater" | "redEye" }) {
  const common = "text-slate-700";
  if (variant === "handwash") {
    return (
      <svg viewBox="0 0 24 24" className={`h-5 w-5 ${common}`} fill="none" aria-hidden="true">
        <path d="M8 12.5V7.8A2.8 2.8 0 0 1 10.8 5h0A2.8 2.8 0 0 1 13.6 7.8v4.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6.2 12.2c.8-1 2.5-.7 2.9.5l1.2 3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M13.5 12.2c-.8-1-2.5-.7-2.9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6 16.5c0 3 2 5 6 5s6-2 6-5v-2.2c0-1.3-1-2.3-2.3-2.3H8.3C7 12 6 13 6 14.3v2.2Z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  if (variant === "noWater") {
    return (
      <svg viewBox="0 0 24 24" className={`h-5 w-5 ${common}`} fill="none" aria-hidden="true">
        <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5 5 19 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (variant === "clock") {
    return (
      <svg viewBox="0 0 24 24" className={`h-5 w-5 ${common}`} fill="none" aria-hidden="true">
        <path d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (variant === "nodrop") {
    return (
      <svg viewBox="0 0 24 24" className={`h-5 w-5 ${common}`} fill="none" aria-hidden="true">
        <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 15c1 .8 2.3 1.2 4 1.2s3-.4 4-1.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 ${common}`} fill="none" aria-hidden="true">
      <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7.2 8.2 6 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-rose-500" />
      <path d="M17.8 8.2 19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-rose-500" />
    </svg>
  );
}

function TipCard({ title, desc, icon }: { title: string; desc: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5" style={glass}>
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl flex-shrink-0" style={glassSubtle}>{icon}</div>
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{desc}</div>
        </div>
      </div>
    </div>
  );
}

export default function LentillesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Adaptation");

  const plan = getPlan();
  const unlocked = getUnlockedSet();

  const params: LensParams = {
    brand: "Acuvue",
    model: "Oasys 1-Day",
    material: "Senofilcon A",
    modality: "Journalière",
    bc: "8.5",
    dia: "14.3",
    powerOD: "-2.25",
    powerOG: "-1.75",
    notes: ["Confort écran : pauses + larmes artificielles si besoin", "Port max conseillé : 10–12h", "Contrôle recommandé à 1 mois"],
  };

  const visits: Visit[] = [
    { id: "lens_adapt_2024_02", date: "15 févr. 2024", title: "Adaptation initiale", subtitle: "Choix lentilles + essais", status: "OK", lockedDoc: true },
    { id: "lens_ctrl_j7_2024_02", date: "22 févr. 2024", title: "Contrôle J+7", subtitle: "Confort / mobilité / centrage", status: "À surveiller", lockedDoc: true },
    { id: "lens_ctrl_m1_2024_03", date: "22 mars 2024", title: "Contrôle 1 mois", subtitle: "Validation port quotidien", status: "OK", lockedDoc: false },
  ];

  const statusBadge = (s: Visit["status"]) =>
    s === "OK" ? <Badge tone="success">OK</Badge> : s === "À surveiller" ? <Badge tone="warn">A surveiller</Badge> : <Badge>A faire</Badge>;

  function isUnlocked(docId: string) {
    if (plan === "complete" || plan === "pack") return true;
    return unlocked.has(docId);
  }

  const content = useMemo(() => {
    if (tab === "Adaptation") {
      const docId = "lens_adapt_2024_02";
      const locked = true && !isUnlocked(docId);

      return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <SectionCard
              title="Paramètres lentilles retenus"
              right={locked ? <Badge tone="locked">Compte-rendu verrouillé</Badge> : <Badge tone="success">Actif</Badge>}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl p-4" style={glassSubtle}>
                  <div className="text-xs text-slate-500">Marque</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{params.brand}</div>
                </div>
                <div className="rounded-xl p-4" style={glassSubtle}>
                  <div className="text-xs text-slate-500">Modèle</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{params.model}</div>
                </div>
                <div className="rounded-xl p-4" style={glassSubtle}>
                  <div className="text-xs text-slate-500">Matériau</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{params.material}</div>
                </div>
                <div className="rounded-xl p-4" style={glassSubtle}>
                  <div className="text-xs text-slate-500">Modalité</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{params.modality}</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl p-4" style={glassSubtle}>
                  <div className="text-xs text-slate-500">BC / DIA</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {params.bc} / {params.dia}
                  </div>
                </div>
                <div className="rounded-xl p-4" style={glassSubtle}>
                  <div className="text-xs text-slate-500">Puissance</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    OD {params.powerOD} • OG {params.powerOG}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl p-4" style={glassSubtle}>
                <div className="text-xs text-slate-500">Recommandations</div>
                <div className="mt-2 space-y-2">
                  {params.notes.map((n) => (
                    <div key={n} className="flex items-start gap-2 text-sm text-slate-700">
                      <IconCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                      <span>{n}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
                        style={glassSubtle}>
                  Voir l'historique d'essais
                </button>

                {locked ? (
                  <button
                    onClick={() => router.push(`/clair-vision/espace-patient/achats?unlock=${docId}`)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-100"
                  >
                    <IconLock className="h-4 w-4" />
                    Déverrouiller le compte-rendu
                  </button>
                ) : (
                  <button className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95"
                          style={{ background: "#2D8CFF" }}>
                    Télécharger le compte-rendu
                  </button>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Débrief adaptation (UI)">
              <div className="text-sm text-slate-700">
                Objectif : confort quotidien + écran. Essais réalisés : modèle journalier. Centrage satisfaisant, mobilité correcte,
                confort global bon après 20 min.
              </div>
              <div className="mt-3 rounded-xl p-4 text-sm text-slate-700" style={glassSubtle}>
                Signaux d'alerte : douleur, rougeur persistante, baisse d'acuité → stop port et contacter le centre.
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard title="Prochaines étapes" right={<Badge tone="info">Plan</Badge>}>
              <div className="space-y-3">
                <div className="rounded-xl p-4" style={glassSubtle}>
                  <div className="text-xs text-slate-500">Contrôle conseillé</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">A 1 mois</div>
                </div>
                <button className="w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95"
                        style={{ background: "#2D8CFF" }}>
                  Planifier un contrôle
                </button>
                <button className="w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
                        style={glassSubtle}>
                  Poser une question
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Documents liés">
              <div className="text-sm text-slate-700">Ordonnance lentilles, adaptation, contrôles…</div>
              <button
                onClick={() => router.push("/clair-vision/espace-patient/documents")}
                className="mt-4 w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
                style={glassSubtle}
              >
                Ouvrir Documents
              </button>
            </SectionCard>
          </div>
        </div>
      );
    }

    if (tab === "Réadaptation") {
      return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard title="Réadaptation" right={<Badge>UI</Badge>}>
            <div className="text-sm text-slate-700">
              Ici on gère les cas : inconfort, sécheresse, flou, intolérance, changement de marque, torique/progressif…
              (On branchera plus tard des formulaires pro complets.)
            </div>
            <div className="mt-4 rounded-xl p-4 text-sm text-slate-700" style={glassSubtle}>
              Suggestions : changement matériau, BC/DIA, torique, fréquence de renouvellement, hygiène, larmes, temps de port,
              mobilité/centrage.
            </div>
          </SectionCard>

          <SectionCard title="Dernière réadaptation enregistrée">
            <div className="text-sm text-slate-500">Aucune réadaptation récente.</div>
            <button className="mt-4 w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95"
                    style={{ background: "#2D8CFF" }}>
              Démarrer une réadaptation
            </button>
          </SectionCard>
        </div>
      );
    }

    if (tab === "Suivi") {
      return (
        <SectionCard title="Suivi & contrôles">
          <div className="space-y-3">
            {visits.map((v) => {
              const docLocked = !!v.lockedDoc && !isUnlocked(v.id);
              return (
                <div
                  key={v.id}
                  className="flex items-center justify-between gap-4 rounded-xl px-4 py-3"
                  style={glassSubtle}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-semibold text-slate-900">{v.title}</div>
                      {statusBadge(v.status)}
                      {docLocked ? <Badge tone="locked">Doc verrouillé</Badge> : <Badge tone="success">Doc dispo</Badge>}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{v.date} • {v.subtitle}</div>

                    <div className="mt-2">
                      <div
                        className={[
                          "inline-block rounded-xl px-3 py-2 text-xs text-slate-600",
                          docLocked ? "blur-[3px] select-none" : "",
                        ].join(" ")}
                        style={glassSubtle}
                      >
                        Aperçu : observations, centrage, mobilité, confort, recommandations…
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {docLocked ? (
                      <button
                        onClick={() => router.push(`/clair-vision/espace-patient/achats?unlock=${v.id}`)}
                        className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100"
                      >
                        <IconLock className="h-4 w-4" />
                        Déverrouiller
                      </button>
                    ) : (
                      <>
                        <button className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition"
                                style={glassSubtle}>
                          Voir
                        </button>
                        <button className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition"
                                style={glassSubtle}>
                          Télécharger
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      );
    }

    return (
      <div className="space-y-6">
        <div className="rounded-2xl p-6" style={glass}>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">Guide lentilles</div>
              <div className="mt-1 text-sm text-slate-500">Schémas + conseils simples pour un port confortable et sécurisé.</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="info">Clair Vision</Badge>
              <Badge tone="muted">UI</Badge>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl p-5" style={glassSubtle}>
              <div className="text-sm font-semibold text-slate-900">Lentille a l'endroit ou a l'envers ?</div>
              <div className="mt-2 text-sm text-slate-600">Regardez le "bord" : bol = OK, assiette = inversée.</div>
              <div className="mt-4">
                <DiagramLensOrientation />
              </div>
            </div>

            <div className="rounded-xl p-5" style={glassSubtle}>
              <div className="text-sm font-semibold text-slate-900">Routine en 60 secondes</div>

              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl p-4" style={glass}>
                  <div className="text-xs font-semibold text-slate-700">1) Mains</div>
                  <div className="mt-2 text-sm text-slate-600">Lavez + séchez soigneusement.</div>
                </div>
                <div className="rounded-xl p-4" style={glass}>
                  <div className="text-xs font-semibold text-slate-700">2) Vérifier</div>
                  <div className="mt-2 text-sm text-slate-600">Orientation + défauts.</div>
                </div>
                <div className="rounded-xl p-4" style={glass}>
                  <div className="text-xs font-semibold text-slate-700">3) Poser</div>
                  <div className="mt-2 text-sm text-slate-600">Regard droit, pose au centre.</div>
                </div>
                <div className="rounded-xl p-4" style={glass}>
                  <div className="text-xs font-semibold text-slate-700">4) Retirer</div>
                  <div className="mt-2 text-sm text-slate-600">Pince légère, jamais d'ongle.</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
                        style={glassSubtle}>
                  Voir vidéo (plus tard)
                </button>
                <button
                  onClick={() => document.getElementById("checklist")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95"
                  style={{ background: "#2D8CFF" }}
                >
                  Checklist (plus bas)
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <TipCard
            title="Hygiène"
            desc="Mains propres + étui renouvelé. Jamais de lentilles avec les ongles."
            icon={<TipIcon variant="handwash" />}
          />
          <TipCard title="Pas d'eau" desc="Evitez douche/piscine. L'eau = risque infectieux." icon={<TipIcon variant="noWater" />} />
          <TipCard title="Temps de port" desc="Respectez la durée. Faites des pauses écran." icon={<TipIcon variant="clock" />} />
        </div>

        <SectionCard title="Pose & retrait" right={<Badge tone="info">Schémas</Badge>}>
          <DiagramInsertRemove />
        </SectionCard>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard title="A faire" right={<Badge tone="success">Recommandé</Badge>}>
            <div className="space-y-3 text-sm text-slate-700">
              {[
                "Respecter le temps de port conseillé.",
                "Pauses écran + hydratation si besoin.",
                "Contrôle régulier (J+7 / 1 mois / annuel).",
                "Retirer immédiatement en cas de gêne importante.",
              ].map((t) => (
                <div key={t} className="flex items-start gap-2 rounded-xl p-4" style={glassSubtle}>
                  <IconCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="A éviter" right={<Badge tone="warn">Risque</Badge>}>
            <div className="space-y-3 text-sm text-slate-700">
              {[
                "Dormir avec les lentilles (sauf indication).",
                "Rincer à l'eau du robinet.",
                "Port prolongé si douleur/rougeur.",
                "Partager un étui / solution.",
              ].map((t) => (
                <div key={t} className="flex items-start gap-2 rounded-xl p-4" style={glassSubtle}>
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 flex-shrink-0">
                    <TipIcon variant="nodrop" />
                  </div>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div id="checklist" className="rounded-2xl p-6" style={glass}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Checklist rapide</div>
              <div className="mt-1 text-sm text-slate-500">Avant / Pendant / Après le port</div>
            </div>
            <Badge tone="info">Pratique</Badge>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl p-5" style={glassSubtle}>
              <div className="text-xs font-semibold text-slate-700">Avant</div>
              <div className="mt-2 space-y-2 text-sm text-slate-700">
                <div className="flex items-start gap-2">
                  <IconCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>Mains lavées/sèches</span>
                </div>
                <div className="flex items-start gap-2">
                  <IconCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>Lentille a l'endroit</span>
                </div>
                <div className="flex items-start gap-2">
                  <IconCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>Pas de particule / défaut</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-5" style={glassSubtle}>
              <div className="text-xs font-semibold text-slate-700">Pendant</div>
              <div className="mt-2 space-y-2 text-sm text-slate-700">
                <div className="flex items-start gap-2">
                  <IconCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>Confort OK (pas de douleur)</span>
                </div>
                <div className="flex items-start gap-2">
                  <IconCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>Pauses écran régulières</span>
                </div>
                <div className="flex items-start gap-2">
                  <IconCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>Eviter l'eau (douche/piscine)</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-5" style={glassSubtle}>
              <div className="text-xs font-semibold text-slate-700">Après</div>
              <div className="mt-2 space-y-2 text-sm text-slate-700">
                <div className="flex items-start gap-2">
                  <IconCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>Retrait doux (pulpes)</span>
                </div>
                <div className="flex items-start gap-2">
                  <IconCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>Jeter (journalières) ou entretien (mensuelles)</span>
                </div>
                <div className="flex items-start gap-2">
                  <IconCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>Etui propre + solution adaptée</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <SectionCard title="Quand consulter ?" right={<Badge tone="warn">Important</Badge>}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl p-5" style={glassSubtle}>
              <div className="flex items-center gap-2">
                <TipIcon variant="redEye" />
                <div className="text-sm font-semibold text-slate-900">Rougeur</div>
              </div>
              <div className="mt-2 text-sm text-slate-600">Rougeur persistante ou œil douloureux.</div>
            </div>
            <div className="rounded-xl p-5" style={glassSubtle}>
              <div className="flex items-center gap-2">
                <TipIcon variant="redEye" />
                <div className="text-sm font-semibold text-slate-900">Douleur</div>
              </div>
              <div className="mt-2 text-sm text-slate-600">Douleur, photophobie, sensation de corps étranger.</div>
            </div>
            <div className="rounded-xl p-5" style={glassSubtle}>
              <div className="flex items-center gap-2">
                <TipIcon variant="redEye" />
                <div className="text-sm font-semibold text-slate-900">Baisse d'acuité</div>
              </div>
              <div className="mt-2 text-sm text-slate-600">Vision floue inhabituelle ou baisse brutale.</div>
            </div>
          </div>

          <div className="mt-4 rounded-xl p-4 text-sm text-slate-700" style={glassSubtle}>
            Si doute : <span className="font-semibold">retirez les lentilles</span> et contactez votre centre.
          </div>
        </SectionCard>
      </div>
    );
  }, [tab, plan, unlocked, router, params, visits]);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">
            <span className="font-bold">Lentilles</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Adaptation, réadaptation, suivi et conseils</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(["Adaptation", "Réadaptation", "Suivi", "Conseils"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="rounded-2xl px-4 py-2 text-sm font-semibold transition"
              style={tab === t
                ? { background: "#2D8CFF", color: "#fff" }
                : glassSubtle}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">{content}</div>
    </div>
  );
}
