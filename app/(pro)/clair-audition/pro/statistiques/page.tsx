"use client";

import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { Chart } from "@/components/charts/lazy-chart";

/* ─── Style tokens ─────────────────────────────────────────────────── */
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

/* ─── Period ────────────────────────────────────────────────────────── */
type Period = "mois" | "trimestre" | "annee";

/* ─── KPI data per period ─────────────────────────────────────────── */
const KPI_PERIOD: Record<Period, {
  appareillages: number;
  ca: number;
  classe2: number;
  rac: number;
}> = {
  mois:      { appareillages: 47,  ca: 38400,  classe2: 78, rac: 890 },
  trimestre: { appareillages: 138, ca: 112800, classe2: 78, rac: 890 },
  annee:     { appareillages: 512, ca: 384000, classe2: 78, rac: 890 },
};

/* ─── CA mensuel Jan–Déc 2025 ──────────────────────────────────────── */
const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const CA_MONTHLY = [31200, 33800, 35100, 36400, 37200, 37800, 38900, 39200, 40100, 38400, 39800, 36100];
const CA_DATA = MONTHS.map((m, i) => ({ month: m, CA: CA_MONTHLY[i] }));

/* ─── Répartition par marque ────────────────────────────────────────── */
const MARQUES = [
  { name: "Phonak",    pct: 33, color: "#00C98A" },
  { name: "Oticon",    pct: 24, color: "#6366F1" },
  { name: "Starkey",   pct: 19, color: "#8B5CF6" },
  { name: "Widex",     pct: 12, color: "#F59E0B" },
  { name: "ReSound",   pct: 7,  color: "#00C98A" },
  { name: "Autres",    pct: 5,  color: "#06B6D4" },
];

/* ─── Bilans & Primo-appareillages (6 derniers mois) ────────────────── */
const BILAN_DATA = [
  { month: "Oct", Bilans: 14, Primo: 9,  Renouvellements: 28 },
  { month: "Nov", Bilans: 15, Primo: 10, Renouvellements: 30 },
  { month: "Déc", Bilans: 12, Primo: 8,  Renouvellements: 26 },
  { month: "Jan", Bilans: 16, Primo: 11, Renouvellements: 32 },
  { month: "Fév", Bilans: 17, Primo: 11, Renouvellements: 33 },
  { month: "Mar", Bilans: 18, Primo: 12, Renouvellements: 35 },
];
/* ─── Remboursements ────────────────────────────────────────────────── */
const REMBOURSEMENTS = [
  { label: "Dossiers Classe 2",  pct: 78, color: "#00C98A", rac: "890 €" },
  { label: "100% Santé (Cl. 1)", pct: 22, color: "#00C98A", rac: "0 €" },
];

/* ─── Distribution des pertes auditives ────────────────────────────── */
const PERTES_DATA = [
  { label: "Profonde",  pct: 12, color: "#ef4444" },
  { label: "Sévère",   pct: 24, color: "#f97316" },
  { label: "Moyenne",  pct: 35, color: "#f59e0b" },
  { label: "Légère",   pct: 22, color: "#84cc16" },
  { label: "Normal",   pct: 7,  color: "#00C98A" },
];

/* ─── LocalStorage helpers ──────────────────────────────────────────── */
const MONTH_SHORT_A = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
type DevisA = { date?: string; dateFacture?: string; totalTTC?: number; status?: string };
type RdvA   = { date?: string; type?: string };
function fmtEurA(n: number): string {
  if (n===0) return "0 €"; if (n>=1_000_000) return `${(n/1e6).toFixed(2)} M€`;
  if (n>=1_000) return `${Math.round(n/1000).toLocaleString("fr-FR")} k€`;
  return `${Math.round(n).toLocaleString("fr-FR")} €`;
}
function itemDtA(d: DevisA): Date | null {
  const s=(d.dateFacture&&d.dateFacture.length)?d.dateFacture:d.date;
  if (!s) return null; const dt=new Date(s); return isNaN(dt.getTime())?null:dt;
}

/* ─── SVG Donut helper ──────────────────────────────────────────────── */
function DonutChart({ data, total }: { data: { label: string; pct: number; color: string }[]; total?: number }) {
  const r = 60, cx = 80, cy = 80, stroke = 22;
  let cumulative = 0;
  const slices = data.map(d => {
    const start = cumulative;
    cumulative += d.pct / 100;
    return { ...d, start, end: cumulative };
  });

  function polarToXY(angle: number, radius: number) {
    const rad = (angle - 0.25) * 2 * Math.PI;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function arcPath(start: number, end: number) {
    const s = polarToXY(start, r);
    const e = polarToXY(end, r);
    const large = end - start > 0.5 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <svg width="160" height="160" viewBox="0 0 160 160" style={{ flexShrink: 0 }}>
        {slices.map((sl, i) => (
          <path key={i} d={arcPath(sl.start, sl.end)} fill="none" stroke={sl.color} strokeWidth={stroke} strokeLinecap="butt" />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fill="#94a3b8" fontWeight="500">patients</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="22" fill="#0f172a" fontWeight="700">{total ?? 512}</text>
      </svg>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
        {data.map(d => (
          <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 13, color: "#334155", fontWeight: 500 }}>{d.label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: d.color, minWidth: 36, textAlign: "right" }}>{d.pct}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Helpers ──────────────────────────────────────────────────────── */
function formatEur(n: number): string {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

/* ─── Page ─────────────────────────────────────────────────────────── */
export default function StatistiquesAuditionPage() {
  const [period, setPeriod] = useState<Period>("mois");
  const [dynKpiPeriod, setDynKpiPeriod] = useState(KPI_PERIOD);
  const [dynCaData, setDynCaData] = useState(CA_DATA);
  const [dynBilanData, setDynBilanData] = useState(BILAN_DATA);
  const [hasRealDataA, setHasRealDataA] = useState(false);

  const [realPatients, setRealPatients] = useState(0);
  const [realEssaisActifs, setRealEssaisActifs] = useState(0);
  const [realEssaisConvertis, setRealEssaisConvertis] = useState(0);
  const [realRenouvellements, setRealRenouvellements] = useState(0);

  // Performance commerciale
  const [funnel, setFunnel] = useState<{ label: string; count: number; color: string }[]>([]);
  const [txConversion, setTxConversion] = useState<string>("—");
  const [panierMoyen, setPanierMoyen] = useState<string>("—");
  const [topMarques, setTopMarques] = useState<{ name: string; count: number; ca: number }[]>([]);

  useEffect(() => {
    // patients
    try {
      const raw = localStorage.getItem("thor_pro_audition_patients");
      if (raw) setRealPatients(JSON.parse(raw).length);
    } catch {}

    // essais
    try {
      const raw = localStorage.getItem("thor_pro_audition_essais");
      if (raw) {
        const essais = JSON.parse(raw);
        setRealEssaisActifs(essais.filter((e: { statut: string }) => e.statut === "en_cours").length);
        setRealEssaisConvertis(essais.filter((e: { statut: string }) => e.statut === "converti").length);
      }
    } catch {}

    // renouvellements
    try {
      const raw = localStorage.getItem("thor_pro_audition_renouvellements");
      if (raw) {
        const ren = JSON.parse(raw);
        setRealRenouvellements(ren.filter((r: { type: string }) => r.type === "renouvellement_appareil").length);
      }
    } catch {}

    // ── Compute CA + appareillages from real data ────────────────────
    try {
      const allDevis:DevisA[] = (() => { try{const r=localStorage.getItem("thor_pro_audition_devis");return r?JSON.parse(r):[];}catch{return[];} })();
      const allRdvs:RdvA[]   = (() => { try{const r=localStorage.getItem("thor_pro_audition_rdv");  return r?JSON.parse(r):[];}catch{return[];} })();
      const billable = allDevis.filter(d=>d.status==="Facturé"||d.status==="Livré");

      if (billable.length>0 || allRdvs.length>0) {
        const now2=new Date(); const cy=now2.getFullYear(); const cm=now2.getMonth();
        const mAgo=(dt:Date)=>(cy-dt.getFullYear())*12+(cm-dt.getMonth());

        // Monthly CA for line chart (last 12 months)
        const aKeys:string[]=[]; for(let i=11;i>=0;i--){const d=new Date(cy,cm-i,1);aKeys.push(MONTH_SHORT_A[d.getMonth()]);}
        const aW:Record<string,number>={};aKeys.forEach(k=>{aW[k]=0;});
        billable.forEach(d=>{const dt=itemDtA(d);if(!dt)return;const ago=mAgo(dt);if(ago<0||ago>11)return;const k=MONTH_SHORT_A[dt.getMonth()];if(k in aW)aW[k]+=d.totalTTC??0;});
        const newCaData=aKeys.map(m=>({month:m,CA:aW[m]}));
        setDynCaData(newCaData);

        // Period-based KPI
        const caInPeriod=(months:number)=>{let s=0;billable.forEach(d=>{const dt=itemDtA(d);if(!dt)return;const ago=mAgo(dt);if(ago>=0&&ago<months)s+=d.totalTTC??0;});return s;};
        const appInPeriod=(months:number)=>allRdvs.filter(r=>{if(!r.date)return false;const dt=new Date(r.date);if(isNaN(dt.getTime()))return false;const ago=mAgo(dt);return ago>=0&&ago<months;}).length;
        const racMoyen=(months:number)=>{const apps=appInPeriod(months);if(!apps)return 890;const rac=billable.filter(d=>{const dt=itemDtA(d);if(!dt)return false;const ago=mAgo(dt);return ago>=0&&ago<months;}).reduce((s,d)=>{const ttc=d.totalTTC??0;return s+(ttc*0.18);},0);return apps?Math.round(rac/apps):890;};

        setDynKpiPeriod({
          mois:      {appareillages:appInPeriod(1), ca:caInPeriod(1),  classe2:78,rac:racMoyen(1)},
          trimestre: {appareillages:appInPeriod(3), ca:caInPeriod(3),  classe2:78,rac:racMoyen(3)},
          annee:     {appareillages:appInPeriod(12),ca:caInPeriod(12), classe2:78,rac:racMoyen(12)},
        });

        // Bilan data: last 6 months from RDVs by type
        const b6Keys:string[]=[]; for(let i=5;i>=0;i--){const d=new Date(cy,cm-i,1);b6Keys.push(MONTH_SHORT_A[d.getMonth()]);}
        const b6W:Record<string,{Bilans:number;Primo:number;Renouvellements:number}>={};
        b6Keys.forEach(k=>{b6W[k]={Bilans:0,Primo:0,Renouvellements:0};});
        allRdvs.forEach(r=>{if(!r.date||!r.type)return;const dt=new Date(r.date);if(isNaN(dt.getTime()))return;const ago=mAgo(dt);if(ago<0||ago>5)return;const k=MONTH_SHORT_A[dt.getMonth()];if(!b6W[k])return;if(r.type==="bilan")b6W[k].Bilans++;else if(r.type==="primo"||r.type==="primo_appareillage")b6W[k].Primo++;else if(r.type==="renouvellement")b6W[k].Renouvellements++;else if(r.type==="adaptation")b6W[k].Primo++;});
        const newBilan=b6Keys.map(m=>({month:m,...b6W[m]}));
        const totalBilan=newBilan.reduce((s,r)=>s+r.Bilans+r.Primo+r.Renouvellements,0);
        if (totalBilan>0) setDynBilanData(newBilan);

        // ── Performance commerciale ────────────────────────────────────
        const statusOrder = ["Brouillon","Validé","Accepté","Commandé","Livré","Facturé"];
        const statusColors = ["#94a3b8","#00C98A","#8B5CF6","#f59e0b","#2D8CFF","#10b981"];
        const statusCnt: Record<string, number> = {};
        allDevis.forEach(d => { const s = (d as {status?:string}).status ?? "Brouillon"; statusCnt[s] = (statusCnt[s]||0)+1; });
        const funnelData = statusOrder
          .filter(s => statusCnt[s])
          .map((s, i) => ({ label: s, count: statusCnt[s] ?? 0, color: statusColors[i] ?? "#94a3b8" }));
        if (funnelData.length > 0) setFunnel(funnelData);

        const totalD = allDevis.length;
        const factures = allDevis.filter(d => (d as {status?:string}).status === "Facturé" || (d as {status?:string}).status === "Livré").length;
        if (totalD > 0) setTxConversion(`${Math.round((factures / totalD) * 100)}%`);
        if (factures > 0) {
          const caTotal = billable.reduce((s, d) => s + (d.totalTTC ?? 0), 0);
          setPanierMoyen(`${Math.round(caTotal / factures).toLocaleString("fr-FR")} €`);
        }

        // Top marques depuis devis
        interface DevisAM { lignes?: { marque?: string; prixTTC?: number; prixVenteTTC?: number }[]; }
        const marqueMap: Record<string, { count: number; ca: number }> = {};
        (allDevis as DevisAM[]).forEach(d => {
          if (!d.lignes) return;
          d.lignes.forEach(l => {
            if (!l.marque) return;
            if (!marqueMap[l.marque]) marqueMap[l.marque] = { count: 0, ca: 0 };
            marqueMap[l.marque].count++;
            marqueMap[l.marque].ca += (l.prixVenteTTC ?? l.prixTTC ?? 0);
          });
        });
        const topM = Object.entries(marqueMap).sort((a, b) => b[1].ca - a[1].ca).slice(0, 6).map(([name, v]) => ({ name, ...v }));
        if (topM.length > 0) setTopMarques(topM);

        setHasRealDataA(true);
      }
    } catch {}
  }, []);

  const kpi = dynKpiPeriod[period];

  const periodBtnActive: CSSProperties = {
    background: "#00C98A",
    color: "#fff",
    boxShadow: "0 2px 8px rgba(0,201,138,0.25)",
    border: "1px solid transparent",
    borderRadius: 10,
    padding: "6px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  };
  const periodBtnInactive: CSSProperties = {
    background: "var(--glass-subtle-bg)",
    color: "#64748b",
    border: "1px solid var(--glass-subtle-border)",
    borderRadius: 10,
    padding: "6px 16px",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  };

  const periodLabel = period === "mois" ? "Ce mois" : period === "trimestre" ? "Ce trimestre" : "Cette année";

  return (
    <>
    <style>{`
      @media print {
        body > * { display: none !important; }
        #rapport-mensuel { display: block !important; }
        #rapport-mensuel * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `}</style>
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "#00C98A",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,201,138,0.30)",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6"  y1="20" x2="6"  y2="14"/>
                </svg>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Statistiques</h1>
            </div>
            <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
              Analyse de l&apos;activité audiologique — {periodLabel}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Rapport PDF button */}
            <button
              onClick={() => window.print()}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(0,201,138,0.10)", border: "1px solid rgba(0,201,138,0.25)",
                borderRadius: 10, padding: "7px 14px", fontSize: 13, fontWeight: 600,
                color: "#047857", cursor: "pointer",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
              </svg>
              Rapport PDF
            </button>

            {/* Period toggle */}
            <div style={{ display: "flex", gap: 6, ...glassSubtle, borderRadius: 12, padding: 4 }}>
              {(["mois","trimestre","annee"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={period === p ? periodBtnActive : periodBtnInactive}
                >
                  {p === "mois" ? "Ce mois" : p === "trimestre" ? "Ce trimestre" : "Cette année"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Activité réelle (localStorage) ── */}
      <div style={{
        background: "rgba(0,201,138,0.05)",
        border: "1px solid rgba(0,201,138,0.18)",
        borderRadius: 16,
        padding: "18px 22px",
        marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}></span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Données réelles (cabinet)</span>
          </div>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>Mis à jour en live</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[
            { label: "Patients actifs",           value: realPatients },
            { label: "Essais en cours",            value: realEssaisActifs },
            { label: "Convertis",                  value: realEssaisConvertis },
            { label: "Renouvellements à venir",    value: realRenouvellements },
          ].map(m => (
            <div key={m.label} style={{
              background: "var(--glass-strong-bg)",
              border: "1px solid var(--glass-strong-border)",
              borderRadius: 12,
              padding: "12px 14px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#00C98A", marginBottom: 4 }}>{m.value}</div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>{m.label}</div>
            </div>
          ))}
        </div>
        {!hasRealDataA && (
          <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>
            Les graphiques illustrent une projection indicative. Créez des devis pour voir le CA réel.
          </div>
        )}
      </div>

      {/* ── Section 1 : KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {/* Appareillages */}
        <div style={{ ...glass, borderRadius: 16, padding: "20px 20px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            Appareillages réalisés
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#00C98A", marginBottom: 6 }}>
            {kpi.appareillages}
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>{periodLabel}</div>
        </div>

        {/* CA appareillage */}
        <div style={{ ...glass, borderRadius: 16, padding: "20px 20px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            CA appareillage
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
            {formatEur(kpi.ca)}
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: "rgba(0,201,138,0.12)", color: "#047857",
            borderRadius: 8, padding: "3px 8px", fontSize: 12, fontWeight: 600,
          }}>
            ↑ +6.1% vs N-1
          </div>
        </div>

        {/* Classe 2 ratio */}
        <div style={{ ...glass, borderRadius: 16, padding: "20px 20px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            Ratio Classe 2
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#6366F1", marginBottom: 6 }}>
            {kpi.classe2}%
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>Appareils remboursés mieux</div>
        </div>

        {/* RAC moyen */}
        <div style={{ ...glass, borderRadius: 16, padding: "20px 20px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            RAC moyen patient
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#F59E0B", marginBottom: 6 }}>
            {kpi.rac} €
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>Reste à charge Classe 2</div>
        </div>
      </div>

      {/* ── Alerte essais en cours ── */}
      {realEssaisActifs > 0 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.20)",
          borderRadius: 12,
          padding: "12px 18px",
          marginBottom: 20,
          gap: 12,
        }}>
          <div style={{ fontSize: 13, color: "#b91c1c", fontWeight: 600 }}>
            {realEssaisActifs} essai(s) en cours — pensez à les suivre
          </div>
          <a
            href="/clair-audition/pro/essais"
            style={{
              fontSize: 12, fontWeight: 600, color: "#dc2626",
              textDecoration: "none",
              background: "rgba(239,68,68,0.10)",
              border: "1px solid rgba(239,68,68,0.20)",
              borderRadius: 8,
              padding: "5px 12px",
              whiteSpace: "nowrap",
            }}
          >
            Voir les essais →
          </a>
        </div>
      )}

      {/* ── Section 2 : CA mensuel (LineChart) ── */}
      <div style={{ ...glass, borderRadius: 16, padding: "22px 22px 18px", marginBottom: 28 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
          Chiffre d&apos;affaires mensuel — 12 derniers mois
        </div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
          Total annuel : {hasRealDataA ? fmtEurA(dynCaData.reduce((s,d)=>s+d.CA,0)) : formatEur(384000)}
          {!hasRealDataA && <span style={{fontSize:11,color:"#94a3b8",marginLeft:8}}>(indicatif)</span>}
        </div>
        <Chart height={200} render={({ ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip }) => (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dynCaData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k€`}
            />
            <Tooltip
              formatter={(value: unknown) => [formatEur(Number(value)), "CA"]}
              contentStyle={{ ...glassSubtle, borderRadius: 10, fontSize: 13 }}
            />
            <Line type="monotone" dataKey="CA" stroke="#00C98A" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
        )} />
      </div>

      {/* ── Section 3 : Répartition par marque + Bilans ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
        {/* Répartition par marque */}
        <div style={{ ...glass, borderRadius: 16, padding: "22px 22px 18px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>
            Répartition par marque
          </div>
          <Chart height={210} render={({ ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip }) => (
          <ResponsiveContainer width="100%" height={210}>
            <BarChart
              data={MARQUES}
              layout="vertical"
              margin={{ top: 4, right: 40, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v}%`}
                domain={[0, 40]}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                width={65}
              />
              <Tooltip
                formatter={(value: unknown) => [`${Number(value)}%`, "Part de marché"]}
                contentStyle={{ ...glassSubtle, borderRadius: 10, fontSize: 13 }}
              />
              <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
                {MARQUES.map((m, i) => (
                  <Cell key={i} fill={m.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          )} />
        </div>

        {/* Bilans & Primo-appareillages (6 derniers mois) */}
        <div style={{ ...glass, borderRadius: 16, padding: "22px 22px 18px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
            Bilans &amp; Appareillages
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>6 derniers mois</div>
          <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
            {[
              { label: "Bilans",        color: "#00C98A" },
              { label: "Primo",         color: "#6366F1" },
              { label: "Renouvellements", color: "#00C98A" },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748b" }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color, flexShrink: 0 }} />
                {l.label}
              </div>
            ))}
          </div>
          <Chart height={175} render={({ ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip }) => (
          <ResponsiveContainer width="100%" height={175}>
            <BarChart data={dynBilanData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ ...glassSubtle, borderRadius: 10, fontSize: 13 }} />
              <Bar dataKey="Bilans"          fill="#00C98A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Primo"           fill="#6366F1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Renouvellements" fill="#00C98A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          )} />
        </div>
      </div>

      {/* ── Section 3b : Distribution des pertes auditives ── */}
      <div style={{ ...glass, borderRadius: 16, padding: "22px 24px 20px", marginBottom: 28 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
          Distribution des pertes auditives
        </div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 18 }}>
          Répartition des profils audiologiques sur votre patientèle
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>OD — Oreille droite</div>
            <DonutChart data={PERTES_DATA} total={realPatients || 512} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>OG — Oreille gauche</div>
            <DonutChart data={[
              { label: "Profonde",  pct: 15, color: "#ef4444" },
              { label: "Sévère",   pct: 26, color: "#f97316" },
              { label: "Moyenne",  pct: 33, color: "#f59e0b" },
              { label: "Légère",   pct: 20, color: "#84cc16" },
              { label: "Normal",   pct: 6,  color: "#00C98A" },
            ]} />
          </div>
        </div>
        <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: 10, background: "rgba(0,201,138,0.06)", border: "1px solid rgba(0,201,138,0.15)" }}>
          <div style={{ fontSize: 12, color: "#047857", fontWeight: 600 }}>
            Insight — 59% de votre patientèle présente une perte sévère ou profonde (classe 2 recommandée)
          </div>
        </div>
      </div>

      {/* ── Section 4 : Remboursements & Accès aux soins ── */}
      <div style={{ ...glass, borderRadius: 16, padding: "22px 24px 20px", marginBottom: 28 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>
          Remboursements &amp; Accès aux soins
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {REMBOURSEMENTS.map((r) => (
            <div key={r.label}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>{r.label}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: r.color }}>{r.pct}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: "rgba(0,0,0,0.07)", marginBottom: 6 }}>
                <div style={{ height: "100%", borderRadius: 4, width: `${r.pct}%`, background: r.color, transition: "width 0.5s ease" }} />
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                RAC moyen : <span style={{ fontWeight: 600, color: "#64748b" }}>{r.rac}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Stats complémentaires */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 24 }}>
          {[
            { label: "RAC moyen Classe 2", value: "890 €", color: "#00C98A" },
            { label: "RAC moyen Classe 1", value: "0 €",   color: "#00C98A" },
            { label: "Dossiers Classe 2",  value: "78%",   color: "#6366F1" },
            { label: "Dossiers 100% Santé",value: "22%",   color: "#F59E0B" },
          ].map(s => (
            <div
              key={s.label}
              style={{ ...glassSubtle, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 5 : NPS & Satisfaction ── */}
      <div style={{ ...glass, borderRadius: 16, padding: "22px 24px 20px" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>
          NPS &amp; Satisfaction patients
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {/* NPS score */}
          <div style={{ ...glassSubtle, borderRadius: 14, padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
              Score NPS
            </div>
            <div style={{ fontSize: 40, fontWeight: 800, color: "#00C98A", marginBottom: 6 }}>72</div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              background: "rgba(0,201,138,0.12)", color: "#047857",
              borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 600,
            }}>
              Excellent
            </div>
          </div>

          {/* Note Google */}
          <div style={{ ...glassSubtle, borderRadius: 14, padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
              Note Google
            </div>
            <div style={{ fontSize: 40, fontWeight: 800, color: "#F59E0B", marginBottom: 6 }}>4.8</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>147 avis</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 3, marginTop: 6 }}>
              {[1,2,3,4,5].map(s => (
                <span key={s} style={{ fontSize: 14, color: s <= 4 ? "#F59E0B" : "#e2e8f0" }}></span>
              ))}
            </div>
          </div>

          {/* Taux recommandation */}
          <div style={{ ...glassSubtle, borderRadius: 14, padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
              Recommandation
            </div>
            <div style={{ fontSize: 40, fontWeight: 800, color: "#00C98A", marginBottom: 6 }}>94%</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>patients satisfaits</div>
          </div>
        </div>
      </div>

      {/* ── Performance commerciale ── */}
      {(funnel.length > 0 || topMarques.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Pipeline */}
          <div style={{ ...glass, borderRadius: 20, padding: "20px 22px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Pipeline commercial</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>Conversion devis → facture</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Taux de conversion", val: txConversion, color: "#00C98A" },
                { label: "Panier moyen", val: panierMoyen, color: "#2D8CFF" },
              ].map(k => (
                <div key={k.label} style={{ ...glassSubtle, borderRadius: 12, padding: "10px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{k.val}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginTop: 2 }}>{k.label}</div>
                </div>
              ))}
            </div>
            {funnel.length > 0 && (() => {
              const maxCount = Math.max(...funnel.map(f => f.count), 1);
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {funnel.map(f => (
                    <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 70, fontSize: 11, color: "#64748b", fontWeight: 600, flexShrink: 0, textAlign: "right" }}>{f.label}</span>
                      <div style={{ flex: 1, height: 18, borderRadius: 4, background: "rgba(148,163,184,0.1)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(f.count / maxCount) * 100}%`, background: f.color, borderRadius: 4 }} />
                      </div>
                      <span style={{ width: 28, fontSize: 11, fontWeight: 700, color: f.color, flexShrink: 0 }}>{f.count}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Top marques */}
          {topMarques.length > 0 && (
            <div style={{ ...glass, borderRadius: 20, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(148,163,184,0.12)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Top marques — CA</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Depuis les devis enregistrés</div>
              </div>
              <div>
                {topMarques.map((m, i) => {
                  const COLORS = ["#00C98A","#2D8CFF","#8B5CF6","#f59e0b","#06B6D4","#ef4444"];
                  const color = COLORS[i % COLORS.length];
                  const maxCa = topMarques[0]?.ca ?? 1;
                  return (
                    <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderBottom: "1px solid rgba(148,163,184,0.08)" }}>
                      <div style={{ width: 26, height: 26, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color, flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{m.name}</div>
                        <div style={{ height: 4, borderRadius: 2, background: "rgba(148,163,184,0.1)", marginTop: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.round((m.ca / maxCa) * 100)}%`, background: color, borderRadius: 2 }} />
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color }}>{formatEur(m.ca)}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{m.count} ligne{m.count > 1 ? "s" : ""}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Rapport imprimable ── */}
      <div id="rapport-mensuel" style={{ display: "none" }}>
        <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 800, margin: '0 auto', padding: 32, color: '#0f172a' }}>
          {/* En-tête */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #00C98A', paddingBottom: 16, marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#00C98A', margin: 0 }}>Rapport mensuel — Clair Audition</h1>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                Généré le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: '#64748b' }}>
              <div>Période : {period === 'mois' ? 'Ce mois' : period === 'trimestre' ? 'Ce trimestre' : 'Cette année'}</div>
            </div>
          </div>

          {/* KPIs */}
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#0f172a' }}>Indicateurs clés</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 28 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Indicateur</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Valeur</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Appareillages réalisés', value: String(kpi.appareillages) },
                { label: 'CA appareillage', value: formatEur(kpi.ca) },
                { label: 'Ratio Classe 2', value: `${kpi.classe2}%` },
                { label: 'RAC moyen patient', value: `${kpi.rac} €` },
                { label: 'Patients actifs', value: String(realPatients || '—') },
                { label: 'Essais en cours', value: String(realEssaisActifs || '—') },
                { label: 'Renouvellements proches', value: String(realRenouvellements || '—') },
              ].map(row => (
                <tr key={row.label}>
                  <td style={{ padding: '8px 12px', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>{row.label}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Répartition marques */}
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#0f172a' }}>Répartition par marque</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 28 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Marque</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Part de marché</th>
              </tr>
            </thead>
            <tbody>
              {MARQUES.map(m => (
                <tr key={m.name}>
                  <td style={{ padding: '8px 12px', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>{m.name}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>{m.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #e2e8f0', fontSize: 11, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
            <span>Document confidentiel — Usage interne</span>
            <span>THOR — Logiciel audioprothésiste</span>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
