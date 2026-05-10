"use client";

import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const glass: CSSProperties = { background:"var(--glass-bg)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", border:"1px solid var(--glass-border)", boxShadow:"0 8px 32px rgba(0,0,0,0.06)" };
const glassSubtle: CSSProperties = { background:"rgba(255,255,255,0.45)", border:"1px solid rgba(255,255,255,0.65)" };

type Period = "mois" | "trimestre" | "annee";

const caData: Record<Period, { label: string; ca: number; actes: number }[]> = {
  mois: [
    { label: "S1", ca: 1840, actes: 21 },
    { label: "S2", ca: 2210, actes: 24 },
    { label: "S3", ca: 1980, actes: 22 },
    { label: "S4", ca: 2390, actes: 27 },
  ],
  trimestre: [
    { label: "Jan", ca: 6200, actes: 68 },
    { label: "Fév", ca: 7100, actes: 80 },
    { label: "Mar", ca: 8420, actes: 94 },
  ],
  annee: [
    { label: "Avr", ca: 5200, actes: 58 }, { label: "Mai", ca: 6100, actes: 70 },
    { label: "Jun", ca: 5800, actes: 64 }, { label: "Jul", ca: 4900, actes: 55 },
    { label: "Aoû", ca: 4200, actes: 48 }, { label: "Sep", ca: 6800, actes: 76 },
    { label: "Oct", ca: 7200, actes: 82 }, { label: "Nov", ca: 7800, actes: 88 },
    { label: "Déc", ca: 6900, actes: 78 }, { label: "Jan", ca: 6200, actes: 68 },
    { label: "Fév", ca: 7100, actes: 80 }, { label: "Mar", ca: 8420, actes: 94 },
  ],
};

const actesData = [
  { type: "Examens de vue", count: 38, color: "#2D8CFF" },
  { type: "Adaptations lentilles", count: 22, color: "#00C98A" },
  { type: "Contrôles annuels", count: 20, color: "#8B5CF6" },
  { type: "Renouvellements", count: 14, color: "#F59E0B" },
];

const correctionsData = [
  { name: "Myopie", value: 52, color: "#2D8CFF" },
  { name: "Presbytie", value: 24, color: "#8B5CF6" },
  { name: "Astigmatisme", value: 18, color: "#00C98A" },
  { name: "Hypermétropie", value: 6, color: "#F59E0B" },
];

const kpis: Record<Period, { ca: string; actes: number; renouvellement: string; nps: string }> = {
  mois:      { ca: "8 420 €",  actes: 94,  renouvellement: "78%", nps: "4.7/5" },
  trimestre: { ca: "21 720 €", actes: 242, renouvellement: "81%", nps: "4.7/5" },
  annee:     { ca: "82 500 €", actes: 921, renouvellement: "76%", nps: "4.6/5" },
};

// ── LocalStorage computation helpers ─────────────────────────────────
const MONTH_SHORT = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const ACTE_COLORS_LIST = ["#2D8CFF","#00C98A","#8B5CF6","#F59E0B","#06B6D4","#ef4444","#64748b"];
const RDV_TYPE_LABEL: Record<string, string> = {
  examen: "Examens de vue", controle: "Contrôles annuels",
  adaptation: "Adaptations lentilles", renouvellement: "Renouvellements",
  livraison: "Livraisons", urgence: "Urgences",
};
type DevisLS = { date?: string; dateFacture?: string; totalTTC?: number; status?: string };
type RdvLS   = { date?: string; type?: string };
function fmtCa(n: number): string {
  if (n === 0) return "0 €";
  if (n >= 1_000_000) return `${(n/1e6).toFixed(2)} M€`;
  if (n >= 1_000) return `${Math.round(n/1000).toLocaleString("fr-FR")} k€`;
  return `${Math.round(n).toLocaleString("fr-FR")} €`;
}
function itemDt(d: DevisLS): Date | null {
  const s = (d.dateFacture && d.dateFacture.length) ? d.dateFacture : d.date;
  if (!s) return null; const dt = new Date(s); return isNaN(dt.getTime()) ? null : dt;
}
function wkKey(day: number): string { return day<=7?"S1":day<=14?"S2":day<=21?"S3":"S4"; }

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-lg" style={{ background:"rgba(255,255,255,0.96)", border:"1px solid rgba(45,140,255,0.18)" }}>
      <div className="font-semibold text-slate-700 mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color ?? "#2D8CFF" }}>
          {p.name} : <span className="font-bold">{typeof p.value === "number" && p.name?.includes("CA") ? `${p.value.toLocaleString("fr-FR")} €` : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function StatistiquesPage() {
  const [period, setPeriod] = useState<Period>("mois");
  const [dynCaData, setDynCaData] = useState(caData);
  const [dynActesData, setDynActesData] = useState(actesData);
  const [dynKpis, setDynKpis] = useState(kpis);
  const [hasRealData, setHasRealData] = useState(false);

  const [realPatients, setRealPatients] = useState(0);
  const [realRenouvellements, setRealRenouvellements] = useState(0);
  const [realOrdonnancesEnCours, setRealOrdonnancesEnCours] = useState(0);

  // Performance commerciale
  const [funnel, setFunnel] = useState<{ label: string; count: number; color: string }[]>([]);
  const [txConversion, setTxConversion] = useState<string>("—");
  const [panierMoyen, setPanierMoyen] = useState<string>("—");
  const [topMarques, setTopMarques] = useState<{ name: string; count: number; ca: number }[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("thor_pro_patients");
      if (raw) setRealPatients((JSON.parse(raw) as unknown[]).length);
    } catch {}

    try {
      const raw = localStorage.getItem("thor_pro_renouvellements_rappels");
      if (raw) {
        const items = Object.values(JSON.parse(raw) as Record<string, { statut?: string; dateEcheance?: string }>);
        const now = Date.now();
        setRealRenouvellements(items.filter(r => {
          if (!r.dateEcheance || r.statut === "effectue" || r.statut === "ignore") return false;
          const days = Math.ceil((new Date(r.dateEcheance).getTime() - now) / 86400000);
          return days >= 0 && days <= 60;
        }).length);
      }
    } catch {}

    try {
      const raw = localStorage.getItem("thor_pro_vision_ordonnances");
      if (raw) {
        const items = JSON.parse(raw) as { statut?: string }[];
        setRealOrdonnancesEnCours(items.filter(o => o.statut === "en_cours" || o.statut === "active").length);
      }
    } catch {}

    // ── Compute CA + actes from real localStorage data ──────────────
    try {
      const allDevis: DevisLS[] = (() => { try { const r=localStorage.getItem("thor_pro_devis"); return r?JSON.parse(r):[]; } catch{return[];} })();
      const allRdvs:  RdvLS[]   = (() => { try { const r=localStorage.getItem("thor_pro_rdv");   return r?JSON.parse(r):[]; } catch{return[];} })();
      const billable = allDevis.filter(d => d.status==="Facturé"||d.status==="Livré");

      if (billable.length > 0 || allRdvs.length > 0) {
        const now2=new Date(); const cy=now2.getFullYear(); const cm=now2.getMonth();
        const mAgo = (dt:Date) => (cy-dt.getFullYear())*12+(cm-dt.getMonth());

        // mois (current month by week)
        const mW:Record<string,{ca:number;actes:number}> = {S1:{ca:0,actes:0},S2:{ca:0,actes:0},S3:{ca:0,actes:0},S4:{ca:0,actes:0}};
        billable.forEach(d => { const dt=itemDt(d); if (!dt||dt.getFullYear()!==cy||dt.getMonth()!==cm) return; const w=wkKey(dt.getDate()); mW[w].ca+=d.totalTTC??0; mW[w].actes++; });

        // trimestre (last 3 months)
        const tKeys:string[]=[]; for(let i=2;i>=0;i--){const d=new Date(cy,cm-i,1);tKeys.push(MONTH_SHORT[d.getMonth()]);}
        const tW:Record<string,{ca:number;actes:number}>={};tKeys.forEach(k=>{tW[k]={ca:0,actes:0};});
        billable.forEach(d=>{const dt=itemDt(d);if(!dt)return;const ago=mAgo(dt);if(ago<0||ago>2)return;const k=MONTH_SHORT[dt.getMonth()];if(tW[k]){tW[k].ca+=d.totalTTC??0;tW[k].actes++;}});

        // annee (last 12 months)
        const aKeys:string[]=[]; for(let i=11;i>=0;i--){const d=new Date(cy,cm-i,1);aKeys.push(MONTH_SHORT[d.getMonth()]);}
        const aW:Record<string,{ca:number;actes:number}>={};aKeys.forEach(k=>{aW[k]={ca:0,actes:0};});
        billable.forEach(d=>{const dt=itemDt(d);if(!dt)return;const ago=mAgo(dt);if(ago<0||ago>11)return;const k=MONTH_SHORT[dt.getMonth()];if(aW[k]){aW[k].ca+=d.totalTTC??0;aW[k].actes++;}});

        const sumCa=(w:Record<string,{ca:number}>)=>Object.values(w).reduce((s,v)=>s+v.ca,0);
        const rdvInPeriod=(months:number)=>allRdvs.filter(r=>{if(!r.date)return false;const dt=new Date(r.date);if(isNaN(dt.getTime()))return false;const ago=mAgo(dt);return ago>=0&&ago<months;}).length;

        setDynCaData({
          mois:      ["S1","S2","S3","S4"].map(k=>({label:k,ca:mW[k].ca,actes:mW[k].actes})),
          trimestre: tKeys.map(k=>({label:k,ca:tW[k].ca,actes:tW[k].actes})),
          annee:     aKeys.map(k=>({label:k,ca:aW[k].ca,actes:aW[k].actes})),
        });
        setDynKpis({
          mois:      {ca:fmtCa(sumCa(mW)),actes:rdvInPeriod(1), renouvellement:"—",nps:"4.7/5"},
          trimestre: {ca:fmtCa(sumCa(tW)),actes:rdvInPeriod(3), renouvellement:"—",nps:"4.7/5"},
          annee:     {ca:fmtCa(sumCa(aW)),actes:rdvInPeriod(12),renouvellement:"—",nps:"4.6/5"},
        });

        // actes by type (last 12 months from RDVs)
        const typCnt:Record<string,number>={};
        allRdvs.forEach(r=>{if(!r.date||!r.type)return;const dt=new Date(r.date);if(isNaN(dt.getTime()))return;const ago=mAgo(dt);if(ago<0||ago>11)return;typCnt[r.type]=(typCnt[r.type]||0)+1;});
        const newActes=Object.entries(typCnt).sort((a,b)=>b[1]-a[1]).map(([t,c],i)=>({type:RDV_TYPE_LABEL[t]||t.charAt(0).toUpperCase()+t.slice(1),count:c,color:ACTE_COLORS_LIST[i%ACTE_COLORS_LIST.length]}));
        if (newActes.length>0) setDynActesData(newActes);

        // ── Entonnoir conversion ────────────────────────────────────────
        const statusOrder = ["Brouillon","Signé","Commandé","Prêt","Livré","Facturé"];
        const statusColors = ["#94a3b8","#2D8CFF","#8B5CF6","#f59e0b","#00C98A","#10b981"];
        const statusCnt: Record<string, number> = {};
        allDevis.forEach(d => { const s = (d as {status?:string}).status ?? "Brouillon"; statusCnt[s] = (statusCnt[s]||0)+1; });
        const funnelData = statusOrder
          .filter(s => statusCnt[s])
          .map((s, i) => ({ label: s, count: statusCnt[s] ?? 0, color: statusColors[i] ?? "#94a3b8" }));
        if (funnelData.length > 0) setFunnel(funnelData);

        // ── Taux de conversion ─────────────────────────────────────────
        const totalDevis = allDevis.length;
        const factures = allDevis.filter(d => (d as {status?:string}).status === "Facturé" || (d as {status?:string}).status === "Livré").length;
        if (totalDevis > 0) {
          setTxConversion(`${Math.round((factures / totalDevis) * 100)}%`);
        }

        // ── Panier moyen ───────────────────────────────────────────────
        if (factures > 0) {
          const caTotal = billable.reduce((s, d) => s + ((d as {totalTTC?:number}).totalTTC ?? 0), 0);
          setPanierMoyen(`${Math.round(caTotal / factures).toLocaleString("fr-FR")} €`);
        }

        // ── Top marques ────────────────────────────────────────────────
        interface DevisWithLignes { lignes?: { marque?: string; prixVenteTTC?: number }[]; totalTTC?: number; }
        const marqueMap: Record<string, { count: number; ca: number }> = {};
        (allDevis as DevisWithLignes[]).forEach(d => {
          if (!d.lignes) return;
          d.lignes.forEach(l => {
            if (!l.marque) return;
            if (!marqueMap[l.marque]) marqueMap[l.marque] = { count: 0, ca: 0 };
            marqueMap[l.marque].count++;
            marqueMap[l.marque].ca += l.prixVenteTTC ?? 0;
          });
        });
        const topM = Object.entries(marqueMap)
          .sort((a, b) => b[1].ca - a[1].ca)
          .slice(0, 6)
          .map(([name, v]) => ({ name, ...v }));
        if (topM.length > 0) setTopMarques(topM);

        setHasRealData(true);
      }
    } catch {}
  }, []);

  const data = dynCaData[period];
  const kpi = dynKpis[period];
  const totalActes = dynActesData.reduce((s, a) => s + a.count, 0);

  const periodLabels: Record<Period, string> = { mois: "Ce mois", trimestre: "Ce trimestre", annee: "Cette année" };

  return (
    <>
    <style>{`
      @media print {
        body > * { display: none !important; }
        #rapport-mensuel { display: block !important; }
        #rapport-mensuel * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `}</style>
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800 h-title">Statistiques cabinet</h1>
          <p className="mt-1 text-sm text-slate-500">Analyse de votre activité optique</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Rapport PDF button */}
          <button
            onClick={() => window.print()}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(45,140,255,0.10)", border: "1px solid rgba(45,140,255,0.25)",
              borderRadius: 10, padding: "7px 14px", fontSize: 13, fontWeight: 600,
              color: "#1d4ed8", cursor: "pointer",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
            </svg>
            Rapport PDF
          </button>

          {/* Period selector */}
          <div className="flex rounded-[var(--radius-pill)] overflow-hidden p-1 gap-1" style={glassSubtle}>
            {(["mois", "trimestre", "annee"] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${period === p ? "text-white" : "text-slate-500 hover:text-slate-700"}`}
                style={period === p ? { background:"#2D8CFF", boxShadow:"0 2px 8px rgba(45,140,255,.25)" } : {}}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Données réelles ── */}
      <div style={{ ...glass, borderRadius: 16, padding: "18px 22px", marginBottom: 24, border: "1px solid rgba(45,140,255,0.18)", background: "rgba(45,140,255,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Données réelles — Cabinet</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>Mis à jour en temps réel</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { label: "Patients actifs", value: realPatients || "—", color: "#2D8CFF" },
            { label: "Renouvellements proches", value: realRenouvellements || "—", color: "#f59e0b" },
            { label: "Ordonnances en cours", value: realOrdonnancesEnCours || "—", color: "#8B5CF6" },
          ].map(m => (
            <div key={m.label} style={{ ...glassSubtle, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: m.color, marginBottom: 4 }}>{m.value}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{m.label}</div>
            </div>
          ))}
        </div>
        {!hasRealData && (
          <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>
            Les graphiques illustrent une projection indicative. Créez des devis pour voir le CA réel.
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "CA estimé", value: kpi.ca, icon: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", color: "#2D8CFF", bg: "rgba(219,234,255,.7)" },
          { label: "Actes réalisés", value: String(kpi.actes), icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138Z", color: "#00C98A", bg: "rgba(0,201,138,.10)" },
          { label: "Taux renouvellement", value: kpi.renouvellement, icon: "M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16", color: "#8B5CF6", bg: "rgba(139,92,246,.10)" },
          { label: "Satisfaction", value: kpi.nps, icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z", color: "#F59E0B", bg: "rgba(245,158,11,.10)" },
        ].map(k => (
          <div key={k.label} className="rounded-[var(--radius-large)] p-5 hover:shadow-lg transition-shadow" style={glass}>
            <div className="flex items-start justify-between mb-3">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{k.label}</div>
              <div className="grid h-8 w-8 place-items-center rounded-xl" style={{ background: k.bg }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={k.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={k.icon}/>
                </svg>
              </div>
            </div>
            <div className="text-2xl font-light text-slate-800" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {realRenouvellements > 0 && (
        <a href="/clair-vision/pro/renouvellements" style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: 12, padding: "10px 16px", marginBottom: 24, textDecoration: "none",
        }}>
          <span style={{ fontSize: 16 }}></span>
          <span style={{ fontSize: 13, color: "#92400e", fontWeight: 500 }}>
            {realRenouvellements} renouvellement{realRenouvellements > 1 ? "s" : ""} à traiter dans les 60 prochains jours
          </span>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#b45309" }}>Voir →</span>
        </a>
      )}

      {/* Charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* CA evolution */}
        <div className="rounded-[var(--radius-large)] p-5" style={glass}>
          <div className="text-sm font-semibold text-slate-800 mb-1">Chiffre d'affaires</div>
          <div className="text-xs text-slate-500 mb-4">{periodLabels[period]} — en euros</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2D8CFF" stopOpacity={0.18}/>
                  <stop offset="95%" stopColor="#2D8CFF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.05)"/>
              <XAxis dataKey="label" tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `${(v/1000).toFixed(0)}k€`}/>
              <Tooltip content={<CustomTooltip />}/>
              <Area type="monotone" dataKey="ca" name="CA" stroke="#2D8CFF" strokeWidth={2} fill="url(#gradCA)" dot={{ r:3, fill:"#2D8CFF", strokeWidth:0 }} activeDot={{ r:5 }}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Actes par type */}
        <div className="rounded-[var(--radius-large)] p-5" style={glass}>
          <div className="text-sm font-semibold text-slate-800 mb-1">Actes par type</div>
          <div className="text-xs text-slate-500 mb-4">{periodLabels[period]} — {totalActes} actes</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dynActesData} layout="vertical" barCategoryGap="20%">
              <CartesianGrid horizontal={false} stroke="rgba(0,0,0,0.05)"/>
              <XAxis type="number" tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false}/>
              <YAxis dataKey="type" type="category" tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false} width={140}/>
              <Tooltip content={<CustomTooltip />} cursor={{ fill:"rgba(45,140,255,0.04)" }}/>
              <Bar dataKey="count" name="Actes" radius={[0, 4, 4, 0]}>
                {dynActesData.map((a, i) => <Cell key={i} fill={a.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Répartition corrections */}
        <div className="rounded-[var(--radius-large)] p-5" style={glass}>
          <div className="text-sm font-semibold text-slate-800 mb-1">Répartition corrections</div>
          <div className="text-xs text-slate-500 mb-4">Dossiers actifs — {period === "mois" ? "ce mois" : period === "trimestre" ? "ce trimestre" : "cette année"}</div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={100} height={100}>
              <PieChart>
                <Pie data={correctionsData} cx="50%" cy="50%" innerRadius={28} outerRadius={46} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {correctionsData.map((e, i) => <Cell key={i} fill={e.color}/>)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 flex-1">
              {correctionsData.map(c => (
                <div key={c.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: c.color }}/>
                    <span className="text-xs text-slate-600">{c.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-800">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tableau top patients */}
        <div className="lg:col-span-2 rounded-[var(--radius-large)] overflow-hidden" style={glass}>
          <div className="px-5 py-4 border-b border-slate-200/60">
            <div className="text-sm font-semibold text-slate-800">Activité récente par patient</div>
          </div>
          <div className="divide-y divide-slate-200/60">
            {[
              { name: "Marie Leblanc",  actes: 3, ca: "480 €",  type: "Myopie forte",               evolution: "↑" },
              { name: "Isabelle Morel", actes: 2, ca: "340 €",  type: "Astigmatisme + Presbytie",    evolution: "→" },
              { name: "Paul Renaud",    actes: 2, ca: "290 €",  type: "Lentilles de contact",        evolution: "↑" },
              { name: "Claire Petit",   actes: 1, ca: "520 €",  type: "Presbytie progressifs",       evolution: "→" },
              { name: "Marc Durand",    actes: 1, ca: "380 €",  type: "Lentilles progressives",      evolution: "↑" },
            ].map(p => (
              <div key={p.name} className="flex items-center gap-4 px-5 py-3 hover:bg-white/40 transition-colors">
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-[#2D8CFF] flex-shrink-0" style={glassSubtle}>
                  {p.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{p.name}</div>
                  <div className="text-xs text-slate-500 truncate">{p.type}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold text-slate-800">{p.ca}</div>
                  <div className="text-xs text-slate-500">{p.actes} acte{p.actes > 1 ? "s" : ""}</div>
                </div>
                <span className={`text-sm font-bold w-5 text-right flex-shrink-0 ${p.evolution === "↑" ? "text-[#00C98A]" : "text-slate-400"}`}>{p.evolution}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Performance commerciale ── */}
      {(funnel.length > 0 || topMarques.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Entonnoir conversion + KPIs */}
          <div className="rounded-[var(--radius-large)] p-5" style={glass}>
            <div className="text-sm font-semibold text-slate-800 mb-1">Pipeline commercial</div>
            <div className="text-xs text-slate-500 mb-4">Conversion devis → facture</div>
            {/* Mini KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Taux de conversion", val: txConversion, color: "#2D8CFF" },
                { label: "Panier moyen", val: panierMoyen, color: "#00C98A" },
              ].map(k => (
                <div key={k.label} style={{ ...glassSubtle, borderRadius: 12, padding: "10px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{k.val}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginTop: 2 }}>{k.label}</div>
                </div>
              ))}
            </div>
            {/* Funnel bars */}
            {funnel.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(() => {
                  const maxCount = Math.max(...funnel.map(f => f.count), 1);
                  return funnel.map(f => (
                    <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 70, fontSize: 11, color: "#64748b", fontWeight: 600, flexShrink: 0, textAlign: "right" }}>{f.label}</span>
                      <div style={{ flex: 1, height: 18, borderRadius: 4, background: "rgba(148,163,184,0.1)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(f.count / maxCount) * 100}%`, background: f.color, borderRadius: 4, transition: "width 0.4s ease" }} />
                      </div>
                      <span style={{ width: 28, fontSize: 11, fontWeight: 700, color: f.color, flexShrink: 0 }}>{f.count}</span>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          {/* Top marques */}
          {topMarques.length > 0 && (
            <div className="rounded-[var(--radius-large)] overflow-hidden" style={glass}>
              <div className="px-5 py-4 border-b border-slate-200/60">
                <div className="text-sm font-semibold text-slate-800">Top marques — CA</div>
                <div className="text-xs text-slate-500 mt-0.5">Depuis les devis enregistrés</div>
              </div>
              <div style={{ padding: "4px 0" }}>
                {topMarques.map((m, i) => {
                  const maxCa = topMarques[0]?.ca ?? 1;
                  const pct = Math.round((m.ca / maxCa) * 100);
                  const COLORS = ["#2D8CFF","#00C98A","#8B5CF6","#f59e0b","#06B6D4","#ef4444"];
                  const color = COLORS[i % COLORS.length];
                  return (
                    <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderBottom: "1px solid rgba(148,163,184,0.08)" }}>
                      <div style={{ width: 26, height: 26, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color, flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{m.name}</div>
                        <div style={{ height: 4, borderRadius: 2, background: "rgba(148,163,184,0.1)", marginTop: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2 }} />
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color }}>{m.ca.toLocaleString("fr-FR")} €</div>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #2D8CFF', paddingBottom: 16, marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#2D8CFF', margin: 0 }}>Rapport mensuel — Clair Vision</h1>
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
                { label: 'CA estimé', value: kpi.ca },
                { label: 'Actes réalisés', value: String(kpi.actes) },
                { label: 'Taux renouvellement', value: kpi.renouvellement },
                { label: 'Satisfaction', value: kpi.nps },
                { label: 'Patients actifs', value: String(realPatients || '—') },
                { label: 'Renouvellements proches', value: String(realRenouvellements || '—') },
                { label: 'Ordonnances en cours', value: String(realOrdonnancesEnCours || '—') },
              ].map(row => (
                <tr key={row.label}>
                  <td style={{ padding: '8px 12px', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>{row.label}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Répartition actes */}
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#0f172a' }}>Répartition des actes</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 28 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Type d&apos;acte</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Nombre</th>
              </tr>
            </thead>
            <tbody>
              {dynActesData.map(a => (
                <tr key={a.type}>
                  <td style={{ padding: '8px 12px', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>{a.type}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>{a.count}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #e2e8f0', fontSize: 11, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
            <span>Document confidentiel — Usage interne</span>
            <span>THOR — Logiciel opticien</span>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
