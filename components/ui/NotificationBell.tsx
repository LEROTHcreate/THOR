"use client";

import { useEffect, useRef, useState } from "react";

/* ── Types ──────────────────────────────────────────────────────────────── */
interface RdvLS {
  id?: string;
  date?: string;
  heure?: string;
  type?: string;
  patient?: string;
  patientNom?: string;
  patientPrenom?: string;
  statut?: string;
  fromPatient?: boolean;
  seen?: boolean;
}

interface LentillePatient {
  id?: string;
  nom?: string;
  prenom?: string;
  prochainRenouvellement?: string;
  lentille?: string;
}

interface StockItemLS {
  id?: string;
  marque?: string;
  modele?: string;
  reference?: string;
  stock?: number;
  stockMin?: number;
  categorie?: string;
}

export type NotifType = "rdv" | "renouvellement" | "patient_rdv" | "stock_alerte" | "rappel" | "pre_consultation";

export interface Notif {
  id: string;
  type: NotifType;
  label: string;
  sub: string;
  date: Date;
  daysLeft: number;
  urgent?: boolean;
}

/* ── Config par type ────────────────────────────────────────────────────── */
const NOTIF_CFG: Record<NotifType, { icon: React.ReactNode; colorFn: (accent: string) => string; bgFn: (accent: string) => string }> = {
  rdv:          {
    icon: (
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    ),
    colorFn: (a) => a,
    bgFn: (a) => `${a}18`,
  },
  patient_rdv:  {
    icon: (
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
    ),
    colorFn: ()  => "#f59e0b",
    bgFn: ()  => "rgba(245,158,11,0.12)",
  },
  renouvellement: {
    icon: (
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-6.36-2.64L3 16"/><path d="M3 12a9 9 0 0 1 9-9c2.5 0 4.78 1 6.36 2.64L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/></svg>
    ),
    colorFn: ()  => "#8b5cf6",
    bgFn: ()  => "rgba(139,92,246,0.12)",
  },
  stock_alerte: {
    icon: (
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4 7.5 4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></svg>
    ),
    colorFn: ()  => "#ef4444",
    bgFn: ()  => "rgba(239,68,68,0.10)",
  },
  rappel:       {
    icon: (
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    ),
    colorFn: ()  => "#f97316",
    bgFn: ()  => "rgba(249,115,22,0.10)",
  },
  pre_consultation: {
    icon: (
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
    ),
    colorFn: () => "#6366f1",
    bgFn: () => "rgba(99,102,241,0.10)",
  },
};

/* ── Helpers ────────────────────────────────────────────────────────────── */
function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function rdvTypeLabel(t?: string): string {
  const map: Record<string, string> = {
    examen: "Examen de vue", controle: "Contrôle annuel",
    adaptation: "Adaptation lentilles", renouvellement: "Renouvellement",
    livraison: "Livraison", urgence: "Urgence",
    bilan: "Bilan auditif", primo: "Primo-appareillage",
  };
  return t ? (map[t] ?? t) : "RDV";
}

interface PreConsultNotifLS {
  id?: string;
  type?: string;
  brand?: string;
  motif?: string;
  practitioner?: string;
  centreName?: string;
  submittedAt?: string;
  dataKey?: string;
  read?: boolean;
}

function loadNotifs(
  lsRdv: string,
  lsPatients: string,
  lsStock?: string,
  lsRappels?: string,
  lsPreConsult?: string,
): Notif[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const result: Notif[] = [];

  // ── RDVs dans les 7 prochains jours ──────────────────────────────────
  try {
    const raw = localStorage.getItem(lsRdv);
    if (raw) {
      const rdvs: RdvLS[] = JSON.parse(raw);
      rdvs.forEach((r, i) => {
        if (!r.date) return;
        const dt = new Date(r.date);
        if (isNaN(dt.getTime())) return;
        dt.setHours(0, 0, 0, 0);
        const d = daysBetween(now, dt);
        if (d < 0 || d > 7) return;

        // RDV patient non vu (prise de RDV via espace patient)
        if (r.fromPatient && !r.seen) {
          const patientName = r.patientNom
            ? `${r.patientPrenom ?? ""} ${r.patientNom}`.trim()
            : (r.patient ?? "Patient");
          result.push({
            id: `prdv-${r.id ?? i}`,
            type: "patient_rdv",
            label: `Nouveau RDV patient — ${patientName}`,
            sub: d === 0 ? "Aujourd'hui" : d === 1 ? "Demain" : `Dans ${d} jours`,
            date: dt,
            daysLeft: d,
            urgent: true,
          });
          return; // don't also show as regular RDV
        }

        // RDV standard
        const patientLabel = r.patientNom
          ? `${r.patientPrenom ?? ""} ${r.patientNom}`.trim()
          : (r.patient ?? "");
        result.push({
          id: r.id ?? `rdv-${i}`,
          type: "rdv",
          label: rdvTypeLabel(r.type) + (patientLabel ? ` — ${patientLabel}` : ""),
          sub: d === 0 ? "Aujourd'hui" : d === 1 ? "Demain" : `Dans ${d} jours`,
          date: dt,
          daysLeft: d,
        });
      });
    }
  } catch {}

  // ── Renouvellements dans les 30 prochains jours ──────────────────────
  try {
    const raw = localStorage.getItem(lsPatients);
    if (raw) {
      const patients: LentillePatient[] = JSON.parse(raw);
      patients.forEach((p, i) => {
        if (!p.prochainRenouvellement) return;
        const dt = new Date(p.prochainRenouvellement);
        if (isNaN(dt.getTime())) return;
        dt.setHours(0, 0, 0, 0);
        const d = daysBetween(now, dt);
        if (d < 0 || d > 30) return;
        const name = [p.prenom, p.nom].filter(Boolean).join(" ") || "Patient";
        result.push({
          id: p.id ?? `renouv-${i}`,
          type: "renouvellement",
          label: `Renouvellement — ${name}`,
          sub: d === 0 ? "Aujourd'hui" : d === 1 ? "Demain" : `Dans ${d} jours`,
          date: dt,
          daysLeft: d,
        });
      });
    }
  } catch {}

  // ── Stock en alerte ───────────────────────────────────────────────────
  if (lsStock) {
    try {
      const raw = localStorage.getItem(lsStock);
      if (raw) {
        const items: StockItemLS[] = JSON.parse(raw);
        items.forEach(item => {
          const stock = item.stock ?? 0;
          const stockMin = item.stockMin ?? 0;
          if (stock > stockMin) return;
          const isRupture = stock === 0;
          const label = ([item.marque, item.modele || item.reference].filter(Boolean).join(" ") || item.id) ?? "Article";
          result.push({
            id: `stock-${item.id ?? label}`,
            type: "stock_alerte",
            label: isRupture ? `Rupture — ${label}` : `Stock bas — ${label}`,
            sub: isRupture ? "Rupture de stock" : `${stock} / ${stockMin} min`,
            date: now,
            daysLeft: 0,
            urgent: isRupture,
          });
        });
      }
    } catch {}
  }

  // ── Rappels (contactés en retard) ─────────────────────────────────────
  if (lsRappels) {
    try {
      const raw = localStorage.getItem(lsRappels);
      if (raw) {
        // lsRappels est une liste de RDVs passés non contactés
        // Format attendu: [{ id, patientNom, date, type, contacted? }]
        interface RappelItem { id?: string; patientNom?: string; patientPrenom?: string; date?: string; type?: string; contacted?: boolean; }
        const rappels: RappelItem[] = JSON.parse(raw);
        const overdue = rappels.filter(r => !r.contacted);
        if (overdue.length > 0) {
          result.push({
            id: "rappels-overdue",
            type: "rappel",
            label: `${overdue.length} rappel${overdue.length > 1 ? "s" : ""} en attente`,
            sub: `${overdue.length} patient${overdue.length > 1 ? "s" : ""} non contacté${overdue.length > 1 ? "s" : ""}`,
            date: now,
            daysLeft: 0,
            urgent: overdue.length > 3,
          });
        }
      }
    } catch {}
  }

  // ── Pré-consultations patients ────────────────────────────────────────
  if (lsPreConsult) {
    try {
      const raw = localStorage.getItem(lsPreConsult);
      if (raw) {
        const items: PreConsultNotifLS[] = JSON.parse(raw);
        items.filter(n => !n.read).forEach(n => {
          const brandLabel = n.brand === "vision" ? "Vision" : n.brand === "audition" ? "Audition" : "";
          result.push({
            id: n.id ?? `preconsult-${Math.random()}`,
            type: "pre_consultation",
            label: `Pré-consultation${brandLabel ? ` Clair ${brandLabel}` : ""}${n.practitioner ? ` — ${n.practitioner}` : ""}`,
            sub: n.motif ?? "Nouveau formulaire patient",
            date: n.submittedAt ? new Date(n.submittedAt) : now,
            daysLeft: 0,
            urgent: true,
          });
        });
      }
    } catch {}
  }

  return result.sort((a, b) => {
    // Priority: urgent first, then by daysLeft
    if ((a.urgent ? 0 : 1) !== (b.urgent ? 0 : 1)) return (a.urgent ? 0 : 1) - (b.urgent ? 0 : 1);
    return a.daysLeft - b.daysLeft;
  });
}

/* ── Component ──────────────────────────────────────────────────────────── */
export default function NotificationBell({
  lsRdv,
  lsPatients,
  lsStock,
  lsRappels,
  lsPreConsult,
  accent = "#2D8CFF",
}: {
  lsRdv: string;
  lsPatients: string;
  lsStock?: string;
  lsRappels?: string;
  lsPreConsult?: string;
  accent?: string;
}) {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function refresh() { setNotifs(loadNotifs(lsRdv, lsPatients, lsStock, lsRappels, lsPreConsult)); }
    refresh();
    const interval = setInterval(refresh, 30_000); // refresh toutes les 30s
    window.addEventListener("focus", refresh);
    return () => { clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, [lsRdv, lsPatients, lsStock, lsRappels, lsPreConsult]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const count = notifs.length;
  const urgentCount = notifs.filter(n => n.urgent).length;
  const badgeColor = urgentCount > 0 ? "#ef4444" : count > 0 ? accent : "transparent";

  // Group by type
  const patientRdvs   = notifs.filter(n => n.type === "patient_rdv");
  const preConsults   = notifs.filter(n => n.type === "pre_consultation");
  const upcomingRdvs  = notifs.filter(n => n.type === "rdv");
  const stockAlertes  = notifs.filter(n => n.type === "stock_alerte");
  const rappels       = notifs.filter(n => n.type === "rappel");
  const renouvs       = notifs.filter(n => n.type === "renouvellement");

  return (
    <div ref={ref} style={{ position: "relative", marginTop: 6 }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Notifications"
        style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          background: "var(--glass-subtle-bg)",
          border: open ? `1px solid ${accent}55` : "1px solid rgba(255,255,255,0.65)",
          borderRadius: 10, padding: "7px 12px",
          fontSize: 12, fontWeight: 500, color: "#64748b", cursor: "pointer",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        Notifications
        <span style={{
          marginLeft: "auto", minWidth: 18, height: 18, borderRadius: 9,
          background: badgeColor, color: "#fff", fontSize: 10, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
          transition: "background 0.2s",
        }}>
          {count > 0 ? (count > 99 ? "99+" : count) : "0"}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", left: "calc(100% + 8px)", top: 0, width: 320,
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          border: "1px solid var(--glass-strong-border)",
          borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.16)",
          zIndex: 9999, overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
              Notifications {count > 0 && <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>({count})</span>}
            </span>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
          </div>

          {/* Body */}
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {count === 0 ? (
              <div style={{ padding: "28px 16px", textAlign: "center" }}>
                <div style={{ marginBottom: 8 }}>
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto" }}><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Tout est à jour</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Aucune action requise</div>
              </div>
            ) : (
              <>
                {/* Pré-consultations patients */}
                {preConsults.length > 0 && (
                  <NotifGroup label="Pré-consultations reçues" color="#6366f1">
                    {preConsults.map(n => <NotifRow key={n.id} notif={n} accent={accent} />)}
                  </NotifGroup>
                )}

                {/* RDVs patients non vus */}
                {patientRdvs.length > 0 && (
                  <NotifGroup label="Nouveaux RDVs patients" color="#f59e0b">
                    {patientRdvs.map(n => <NotifRow key={n.id} notif={n} accent={accent} />)}
                  </NotifGroup>
                )}

                {/* Stock en alerte */}
                {stockAlertes.length > 0 && (
                  <NotifGroup label="Alertes stock" color="#ef4444">
                    {stockAlertes.slice(0, 3).map(n => <NotifRow key={n.id} notif={n} accent={accent} />)}
                    {stockAlertes.length > 3 && (
                      <div style={{ padding: "6px 16px 10px", fontSize: 11, color: "#94a3b8" }}>
                        + {stockAlertes.length - 3} autre{stockAlertes.length - 3 > 1 ? "s" : ""} article{stockAlertes.length - 3 > 1 ? "s" : ""} en alerte
                      </div>
                    )}
                  </NotifGroup>
                )}

                {/* Rappels */}
                {rappels.length > 0 && (
                  <NotifGroup label="Rappels patients" color="#f97316">
                    {rappels.map(n => <NotifRow key={n.id} notif={n} accent={accent} />)}
                  </NotifGroup>
                )}

                {/* RDVs à venir */}
                {upcomingRdvs.length > 0 && (
                  <NotifGroup label="RDVs à venir (7j)" color={accent}>
                    {upcomingRdvs.slice(0, 5).map(n => <NotifRow key={n.id} notif={n} accent={accent} />)}
                    {upcomingRdvs.length > 5 && (
                      <div style={{ padding: "6px 16px 10px", fontSize: 11, color: "#94a3b8" }}>
                        + {upcomingRdvs.length - 5} autre{upcomingRdvs.length - 5 > 1 ? "s" : ""} RDV
                      </div>
                    )}
                  </NotifGroup>
                )}

                {/* Renouvellements */}
                {renouvs.length > 0 && (
                  <NotifGroup label="Renouvellements (30j)" color="#8b5cf6">
                    {renouvs.slice(0, 4).map(n => <NotifRow key={n.id} notif={n} accent={accent} />)}
                    {renouvs.length > 4 && (
                      <div style={{ padding: "6px 16px 10px", fontSize: 11, color: "#94a3b8" }}>
                        + {renouvs.length - 4} autre{renouvs.length - 4 > 1 ? "s" : ""}
                      </div>
                    )}
                  </NotifGroup>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {count > 0 && (
            <div style={{ padding: "8px 16px", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", gap: 12, fontSize: 10, color: "#94a3b8", flexWrap: "wrap" }}>
              {preConsults.length > 0  && <span>{preConsults.length} pré-consult.</span>}
              {patientRdvs.length > 0  && <span>{patientRdvs.length} nouveau{patientRdvs.length > 1 ? "x" : ""}</span>}
              {stockAlertes.length > 0 && <span>{stockAlertes.length} stock</span>}
              {upcomingRdvs.length > 0 && <span>{upcomingRdvs.length} RDV</span>}
              {renouvs.length > 0      && <span>{renouvs.length} renouv.</span>}
              {rappels.length > 0      && <span>{rappels.length} rappel</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */
function NotifGroup({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ padding: "8px 16px 4px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color }}>
        {label}
      </div>
      {children}
      <div style={{ height: 1, background: "rgba(0,0,0,0.04)", margin: "4px 0" }} />
    </div>
  );
}

function NotifRow({ notif: n, accent }: { notif: Notif; accent: string }) {
  const cfg = NOTIF_CFG[n.type];
  const color = cfg.colorFn(accent);
  const bg = cfg.bgFn(accent);
  return (
    <div style={{ padding: "9px 16px", display: "flex", alignItems: "flex-start", gap: 10, background: n.urgent ? "rgba(239,68,68,0.02)" : "transparent" }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
        {cfg.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {n.label}
        </div>
        <div style={{ fontSize: 11, marginTop: 2, color: n.urgent ? "#ef4444" : n.daysLeft === 1 ? "#f59e0b" : color, fontWeight: n.urgent || n.daysLeft <= 1 ? 600 : 400 }}>
          {n.sub}
          {n.type === "rdv" && ` · ${n.date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`}
        </div>
      </div>
    </div>
  );
}
