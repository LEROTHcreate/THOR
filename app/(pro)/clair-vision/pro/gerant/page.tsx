"use client";

import { useState, useEffect, type CSSProperties } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend, ReferenceLine,
} from "recharts";
import { loadUsers, loadCurrentUserId, type ProUser } from "@/lib/users";
import { useRouter } from "next/navigation";

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

/* ─── Helpers ──────────────────────────────────────────────────────── */
function formatEur(n: number): string {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

/* ─── Period data ──────────────────────────────────────────────────── */
type Period = "mois" | "trimestre" | "annee";

const KPI_DATA: Record<Period, {
  ca: number; caTrend: string; caTrendUp: boolean;
  marge: number; margePct: number;
  benefice: number; beneficePct: number;
  panier: number; panierTrend: string; panierTrendUp: boolean;
}> = {
  mois: {
    ca: 42000, caTrend: "+11%", caTrendUp: true,
    marge: 26880, margePct: 64,
    benefice: 7560, beneficePct: 18,
    panier: 420, panierTrend: "+5%", panierTrendUp: true,
  },
  trimestre: {
    ca: 113400, caTrend: "+8%", caTrendUp: true,
    marge: 72576, margePct: 64,
    benefice: 20412, beneficePct: 18,
    panier: 415, panierTrend: "+3%", panierTrendUp: true,
  },
  annee: {
    ca: 420000, caTrend: "+6%", caTrendUp: true,
    marge: 268800, margePct: 64,
    benefice: 75600, beneficePct: 18,
    panier: 418, panierTrend: "+4%", panierTrendUp: true,
  },
};

/* ─── Benchmarks ───────────────────────────────────────────────────── */
const BENCHMARKS = {
  ca:      { moy: 35000,  top20: 55000  },
  marge:   { moy: 62,     top20: 69     },
  benefice:{ moy: 15,     top20: 22     },
  panier:  { moy: 380,    top20: 520    },
};

/* ─── Score de santé ───────────────────────────────────────────────── */
const SUBSCORES = [
  { label: "CA",           score: 85 },
  { label: "Marge",        score: 78 },
  { label: "Équipe",       score: 90 },
  { label: "Trésorerie",   score: 70 },
];
const GLOBAL_SCORE = Math.round(SUBSCORES.reduce((s, x) => s + x.score, 0) / SUBSCORES.length);

function scoreColor(s: number): string {
  if (s >= 80) return "#00C98A";
  if (s >= 60) return "#F59E0B";
  return "#EF4444";
}

/* ─── Static data ──────────────────────────────────────────────────── */
const CA_CATEGORIE = [
  { name: "V. progressifs", value: 14700 },
  { name: "V. simples",     value: 6300  },
  { name: "M. optiques",    value: 10500 },
  { name: "M. solaires",    value: 4200  },
  { name: "Lentilles s.",   value: 4200  },
  { name: "Lentilles r.",   value: 840   },
  { name: "Accessoires",    value: 1260  },
];
const BAR_COLORS = ["#2D8CFF", "#6366F1", "#8B5CF6", "#F59E0B", "#00C98A", "#06B6D4", "#EC4899"];
const SECTEUR_CA_MENSUEL = 5800;

const COUTS_MARGES = [
  { cat: "Verres progressifs", ca: 14700, cout: 5250,  marge: 9450,  taux: 64, coeff: 2.8 },
  { cat: "Verres simples",     ca: 6300,  cout: 1800,  marge: 4500,  taux: 71, coeff: 3.5 },
  { cat: "Montures optiques",  ca: 10500, cout: 3281,  marge: 7219,  taux: 69, coeff: 3.2 },
  { cat: "Montures solaires",  ca: 4200,  cout: 1615,  marge: 2585,  taux: 62, coeff: 2.6 },
  { cat: "Lentilles souples",  ca: 4200,  cout: 2211,  marge: 1989,  taux: 47, coeff: 1.9 },
  { cat: "Lentilles rigides",  ca: 840,   cout: 280,   marge: 560,   taux: 67, coeff: 3.0 },
  { cat: "Accessoires",        ca: 1260,  cout: 504,   marge: 756,   taux: 60, coeff: 2.5 },
];

const EQUIPE = [
  { nom: "Dr. Sophie Martin", role: "Optométriste", actes: 38, ca: 18000, objectif: 20000, pct: 90, initiales: "SM", color: "#2D8CFF" },
  { nom: "Julien Dubois",     role: "Opticien",     actes: 31, ca: 14700, objectif: 18000, pct: 82, initiales: "JD", color: "#00C98A" },
  { nom: "Martin Vidal",      role: "Visagiste",    actes: 25, ca:  9300, objectif: 14000, pct: 66, initiales: "MV", color: "#8B5CF6" },
];

const ACTES_TYPES: Record<string, number[]> = {
  "Dr. Sophie Martin": [14, 10, 8, 6],
  "Julien Dubois":     [10, 8, 9, 4],
  "Martin Vidal":      [7, 5, 8, 5],
};
const ACTES_COLS = ["Contrôle", "Adaptation", "Livraison", "Bilan"];

const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const CA_MONTHLY  = [28000, 32000, 42000, 40000, 38000, 35000, 30000, 24000, 40000, 38000, 35000, 38000];
const BEN_MONTHLY = [5920, 8480, 14880, 13600, 12320, 10400, 7200, 3360, 13600, 12320, 10400, 12320];
const EVOLUTION_DATA = MONTHS.map((m, i) => ({ month: m, CA: CA_MONTHLY[i], Benefice: BEN_MONTHLY[i] }));

/* ─── Benchmark table ──────────────────────────────────────────────── */
type BenchmarkRow = {
  label: string;
  cabinet: string;
  secteur: string;
  top20: string;
  statut: "bon" | "warn" | "bad";
  statutLabel: string;
};
const BENCHMARK_ROWS: BenchmarkRow[] = [
  { label: "CA mensuel",                cabinet: "42 000 €",  secteur: "35 000 €", top20: "55 000 €", statut: "bon",  statutLabel: "Au-dessus" },
  { label: "Marge brute",               cabinet: "64%",       secteur: "62%",      top20: "69%",      statut: "bon",  statutLabel: "Dans la norme" },
  { label: "Taux transformation devis", cabinet: "72%",       secteur: "58%",      top20: "78%",      statut: "bon",  statutLabel: "Bon" },
  { label: "Panier moyen",              cabinet: "420 €",     secteur: "380 €",    top20: "520 €",    statut: "bon",  statutLabel: "Au-dessus" },
  { label: "Délai paiement moyen",      cabinet: "18 j",      secteur: "22 j",     top20: "12 j",     statut: "warn", statutLabel: "À améliorer" },
  { label: "RDV / jour / praticien",    cabinet: "6,2",       secteur: "5,8",      top20: "8,1",      statut: "bon",  statutLabel: "Dans la norme" },
  { label: "Taux SAV / réclamations",   cabinet: "2,1%",      secteur: "3,5%",     top20: "1,2%",     statut: "bon",  statutLabel: "Excellent" },
  { label: "NPS patient estimé",        cabinet: "67",        secteur: "52",       top20: "75",       statut: "bon",  statutLabel: "Bon" },
];

function statutStyle(s: BenchmarkRow["statut"]): { color: string; bg: string; symbol: string } {
  if (s === "bon")  return { color: "#047857", bg: "rgba(0,201,138,0.12)", symbol: "✓" };
  if (s === "warn") return { color: "#B45309", bg: "rgba(245,158,11,0.12)", symbol: "" };
  return { color: "#991B1B", bg: "rgba(239,68,68,0.12)", symbol: "✗" };
}

/* ─── Alertes ──────────────────────────────────────────────────────── */
type Alerte = { icon: string; text: string; color: string; bg: string; border: string; link?: string };

function computeAlertes(period: Period, caMonthly: number[] = CA_MONTHLY): Alerte[] {
  const alerts: Alerte[] = [];

  alerts.push({
    icon: "",
    text: "Délai de paiement moyen à 18 j vs objectif 15 j — relances à planifier",
    color: "#B45309", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.30)",
    link: "Voir →",
  });

  const vidal = EQUIPE.find(e => e.initiales === "MV");
  if (vidal && vidal.pct < 80) {
    alerts.push({
      icon: "",
      text: `Vidal sous objectif à ${vidal.pct}% — ${formatEur(vidal.objectif - vidal.ca)} restants à générer`,
      color: "#991B1B", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.30)",
    });
  }

  const vs = COUTS_MARGES.find(c => c.cat === "Verres simples");
  if (vs && vs.taux >= 68) {
    alerts.push({
      icon: "✓",
      text: `Excellente marge verres simples : ${vs.taux}% — catégorie la plus rentable`,
      color: "#047857", bg: "rgba(0,201,138,0.10)", border: "rgba(0,201,138,0.30)",
    });
  }

  const topCat = [...CA_CATEGORIE].sort((a, b) => b.value - a.value)[0];
  const totalCA = CA_CATEGORIE.reduce((s, c) => s + c.value, 0);
  alerts.push({
    icon: "ℹ",
    text: `Top catégorie : ${topCat.name} à ${Math.round((topCat.value / totalCA) * 100)}% du CA — ${formatEur(topCat.value)}`,
    color: "#1D6FCC", bg: "rgba(45,140,255,0.10)", border: "rgba(45,140,255,0.30)",
  });

  alerts.push({
    icon: "✓",
    text: "Taux de transformation devis à 72% — au-dessus de la moyenne sectorielle (58%)",
    color: "#047857", bg: "rgba(0,201,138,0.10)", border: "rgba(0,201,138,0.30)",
  });

  void period; void caMonthly;
  return alerts.slice(0, 5);
}

function progressColor(pct: number): string {
  if (pct >= 80) return "#00C98A";
  if (pct >= 50) return "#F59E0B";
  return "#EF4444";
}

function margeTauxColor(taux: number): string {
  if (taux >= 65) return "#00C98A";
  if (taux >= 55) return "#2D8CFF";
  if (taux >= 45) return "#F59E0B";
  return "#EF4444";
}

/* ─── LocalStorage helpers ──────────────────────────────────────────── */
type DevisGerant = { date?: string; dateFacture?: string; totalTTC?: number; status?: string };
const MONTH_LABELS_G = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const MARGIN_RATE = 0.64;
const BENEFICE_RATE = 0.18;

function gerantItemDt(d: DevisGerant): Date | null {
  const s = (d.dateFacture && d.dateFacture.length) ? d.dateFacture : d.date;
  if (!s) return null; const dt = new Date(s); return isNaN(dt.getTime()) ? null : dt;
}

/* ─── Page ─────────────────────────────────────────────────────────── */
export default function GerantPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<ProUser | null>(null);
  const [period, setPeriod] = useState<Period>("mois");
  const [tab, setTab] = useState<"global" | "equipe" | "finances">("global");
  const [mounted, setMounted] = useState(false);
  const [dynKpi, setDynKpi] = useState(KPI_DATA);
  const [dynEvolution, setDynEvolution] = useState(EVOLUTION_DATA);
  const [dynCaMensuels, setDynCaMensuels] = useState(CA_MONTHLY);

  /* ── Objectifs éditables (feature 4) ── */
  const [editObjectifs, setEditObjectifs] = useState<Record<string, number>>({});
  const [editingInitiales, setEditingInitiales] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  /* ── Funnel (feature 2) ── */
  const [funnelData, setFunnelData] = useState({ rdv: 42, devis: 28, factures: 21, encaisse: 17 });

  useEffect(() => {
    const loaded = loadUsers();
    const curId  = loadCurrentUserId();
    const user   = loaded.find(u => u.id === curId) ?? null;
    setCurrentUser(user);
    setMounted(true);
    if (user && user.role !== "Gérant") {
      router.replace("/clair-vision/pro/optique");
    }

    /* ── Charger objectifs éditables ── */
    try {
      const rawObj = localStorage.getItem("thor_pro_vision_objectifs");
      if (rawObj) setEditObjectifs(JSON.parse(rawObj));
    } catch {}

    /* ── Charger funnel ── */
    try {
      const now = new Date();
      const isThisMonth = (dateStr: string) => {
        const d = new Date(dateStr);
        return !isNaN(d.getTime()) && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      };
      let rdv = 0, devisCount = 0, facturesCount = 0, encaisseCount = 0;
      const rawRdv = localStorage.getItem("thor_pro_rdv");
      if (rawRdv) {
        const arr: Array<{ date?: string }> = JSON.parse(rawRdv);
        rdv = arr.filter(r => r.date && isThisMonth(r.date)).length;
      }
      const rawDevis = localStorage.getItem("thor_pro_devis");
      if (rawDevis) {
        const arr: Array<{ date?: string }> = JSON.parse(rawDevis);
        devisCount = arr.filter(r => r.date && isThisMonth(r.date)).length;
      }
      const rawFact = localStorage.getItem("thor_pro_factures");
      if (rawFact) {
        const arr: Array<{ date?: string; statut?: string }> = JSON.parse(rawFact);
        const thisMonth = arr.filter(r => r.date && isThisMonth(r.date));
        facturesCount = thisMonth.length;
        encaisseCount = thisMonth.filter(r => r.statut === "payee" || r.statut === "Payée").length;
      }
      if (rdv > 0 || devisCount > 0 || facturesCount > 0 || encaisseCount > 0) {
        setFunnelData({ rdv: rdv || 42, devis: devisCount || 28, factures: facturesCount || 21, encaisse: encaisseCount || 17 });
      }
    } catch {}

    try {
      const raw = localStorage.getItem("thor_pro_devis");
      if (!raw) return;
      const allDevis: DevisGerant[] = JSON.parse(raw);
      const billable = allDevis.filter(d => d.status === "Facturé" || d.status === "Livré");
      if (billable.length === 0) return;

      const now2 = new Date(); const cy = now2.getFullYear(); const cm = now2.getMonth();
      const mAgo = (dt: Date) => (cy - dt.getFullYear()) * 12 + (cm - dt.getMonth());

      const aKeys: string[] = []; for (let i=11;i>=0;i--){const d=new Date(cy,cm-i,1);aKeys.push(MONTH_LABELS_G[d.getMonth()]);}
      const aW: Record<string,number> = {}; aKeys.forEach(k => { aW[k] = 0; });
      billable.forEach(d => {
        const dt = gerantItemDt(d); if (!dt) return;
        const ago = mAgo(dt); if (ago < 0 || ago > 11) return;
        const k = MONTH_LABELS_G[dt.getMonth()]; if (k in aW) aW[k] += d.totalTTC ?? 0;
      });
      const newCaMonthly = aKeys.map(k => aW[k]);
      const newEvolution = aKeys.map((m, i) => ({ month: m, CA: newCaMonthly[i], Benefice: Math.round(newCaMonthly[i] * BENEFICE_RATE) }));
      setDynCaMensuels(newCaMonthly);
      setDynEvolution(newEvolution);

      const caInPeriod = (months: number) => { let s = 0; billable.forEach(d => { const dt = gerantItemDt(d); if (!dt) return; const ago = mAgo(dt); if (ago >= 0 && ago < months) s += d.totalTTC ?? 0; }); return s; };
      const caMois = caInPeriod(1);
      const caTrim = caInPeriod(3);
      const caAnn  = caInPeriod(12);
      const mkKpi = (ca: number): typeof KPI_DATA["mois"] => ({
        ca, caTrend: "", caTrendUp: true,
        marge: Math.round(ca * MARGIN_RATE), margePct: Math.round(MARGIN_RATE * 100),
        benefice: Math.round(ca * BENEFICE_RATE), beneficePct: Math.round(BENEFICE_RATE * 100),
        panier: 418, panierTrend: "", panierTrendUp: true,
      });
      setDynKpi({ mois: mkKpi(caMois), trimestre: mkKpi(caTrim), annee: mkKpi(caAnn) });
    } catch {}
  }, [router]);

  if (!mounted) return null;
  if (!currentUser || currentUser.role !== "Gérant") return null;

  const kpi = dynKpi[period];
  const alertes = computeAlertes(period, dynCaMensuels);

  function benchPct(val: number, top: number): number {
    return Math.min(100, Math.round((val / top) * 100));
  }

  const pageStyle: CSSProperties = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };
  const periodBtnActive: CSSProperties = {
    background: "#2D8CFF",
    color: "#fff",
    boxShadow: "0 2px 8px rgba(45,140,255,0.25)",
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

  /* ── Tab styles ── */
  const tabContainerStyle: CSSProperties = {
    display: "flex",
    gap: 4,
    background: "rgba(255,255,255,0.6)",
    border: "1px solid var(--glass-border)",
    borderRadius: 14,
    padding: 4,
    marginBottom: 28,
    width: "fit-content",
  };

  function tabBtnStyle(active: boolean): CSSProperties {
    return active
      ? {
          background: "#fff",
          color: "#2D8CFF",
          fontWeight: 700,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          border: "none",
          borderRadius: 10,
          padding: "8px 22px",
          fontSize: 14,
          cursor: "pointer",
          transition: "all 0.18s ease",
        }
      : {
          background: "transparent",
          color: "#64748b",
          fontWeight: 500,
          border: "none",
          borderRadius: 10,
          padding: "8px 22px",
          fontSize: 14,
          cursor: "pointer",
          transition: "all 0.18s ease",
        };
  }

  /* ── Marges totaux ── */
  const margesTotal = COUTS_MARGES.reduce(
    (acc, r) => ({ ca: acc.ca + r.ca, cout: acc.cout + r.cout, marge: acc.marge + r.marge }),
    { ca: 0, cout: 0, marge: 0 }
  );
  const margesTotalTaux = Math.round((margesTotal.marge / margesTotal.ca) * 100);

  /* ── Equipe chart data ── */
  const equipeChartData = EQUIPE.map(e => ({ name: e.initiales, CA: e.ca, objectif: editObjectifs[e.initiales] ?? e.objectif }));
  const objectifMoyen = Math.round(EQUIPE.reduce((s, e) => s + (editObjectifs[e.initiales] ?? e.objectif), 0) / EQUIPE.length);

  return (
    <div style={pageStyle}>

      {/* ══════════════════════════════════════════════════════════════
          1. HEADER
      ══════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          {/* Left: titre + sous-titre */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(245,158,11,0.30)",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Espace Gérant</h1>
            </div>
            <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
              Vue d&apos;ensemble · Mis à jour aujourd&apos;hui
            </p>
          </div>

          {/* Right: toggle période + badge score */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 6, ...glassSubtle, borderRadius: 12, padding: 4 }}>
              {(["mois","trimestre","annee"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={period === p ? periodBtnActive : periodBtnInactive}
                >
                  {p === "mois" ? "Mois" : p === "trimestre" ? "Trimestre" : "Année"}
                </button>
              ))}
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              background: scoreColor(GLOBAL_SCORE) + "18",
              border: `1.5px solid ${scoreColor(GLOBAL_SCORE)}40`,
              borderRadius: 12, padding: "6px 14px",
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: scoreColor(GLOBAL_SCORE) }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(GLOBAL_SCORE) }}>
                Score de santé : {GLOBAL_SCORE}/100
              </span>
            </div>
            <button
              onClick={() => window.print()}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "#fff",
                border: "1px solid rgba(45,140,255,0.3)",
                borderRadius: 20,
                padding: "6px 16px",
                fontSize: 13, fontWeight: 600,
                color: "#2D8CFF",
                cursor: "pointer",
                boxShadow: "0 1px 4px rgba(45,140,255,0.08)",
              }}
            >
              Exporter le rapport
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ONGLETS
      ══════════════════════════════════════════════════════════════ */}
      <div style={tabContainerStyle}>
        {(["global", "equipe", "finances"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={tabBtnStyle(tab === t)}
          >
            {t === "global" ? "Vue globale" : t === "equipe" ? "Équipe & Performance" : "Finances & Marges"}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ONGLET : VUE GLOBALE
      ══════════════════════════════════════════════════════════════ */}
      {tab === "global" && (
        <>
          {/* Score de santé global */}
          <div style={{
            ...glass,
            borderRadius: 20,
            padding: "28px 32px",
            marginBottom: 24,
            background: "linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(240,248,255,0.65) 100%)",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 32, flexWrap: "wrap" }}>
              <div style={{ minWidth: 140 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Score de santé global
                </div>
                <div style={{ fontSize: 56, fontWeight: 800, color: scoreColor(GLOBAL_SCORE), lineHeight: 1 }}>
                  {GLOBAL_SCORE}
                  <span style={{ fontSize: 22, fontWeight: 600, color: "#94a3b8" }}>/100</span>
                </div>
                <p style={{ fontSize: 13, color: "#64748b", marginTop: 10, lineHeight: 1.5, maxWidth: 220 }}>
                  Votre cabinet performe mieux que <strong style={{ color: "#0f172a" }}>68%</strong> des cabinets optiques français
                </p>
              </div>

              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
                    <span>0</span><span>50</span><span>100</span>
                  </div>
                  <div style={{ position: "relative", height: 14, borderRadius: 8, background: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to right, #00C98A 0%, #F59E0B 60%, #EF4444 100%)",
                      opacity: 0.15,
                    }} />
                    <div style={{
                      position: "absolute", top: 0, left: 0, height: "100%",
                      width: `${GLOBAL_SCORE}%`,
                      background: `linear-gradient(to right, #00C98A, ${scoreColor(GLOBAL_SCORE)})`,
                      borderRadius: 8,
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
                  {SUBSCORES.map(sub => (
                    <div key={sub.label}>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 500 }}>{sub.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: scoreColor(sub.score), marginBottom: 5 }}>
                        {sub.score}
                      </div>
                      <div style={{ height: 5, borderRadius: 3, background: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 3,
                          width: `${sub.score}%`,
                          background: scoreColor(sub.score),
                          transition: "width 0.6s ease",
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4 KPI cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
            {/* CA */}
            <div style={{ ...glass, borderRadius: 16, padding: "20px 20px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Chiffre d&apos;affaires</span>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(45,140,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2D8CFF" strokeWidth="2">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                    <polyline points="16 7 22 7 22 13"/>
                  </svg>
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                {formatEur(kpi.ca)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                {kpi.caTrend && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 3,
                    background: kpi.caTrendUp ? "rgba(0,201,138,0.12)" : "rgba(239,68,68,0.12)",
                    color: kpi.caTrendUp ? "#047857" : "#991B1B",
                    borderRadius: 7, padding: "2px 8px", fontSize: 12, fontWeight: 600,
                  }}>
                    {kpi.caTrendUp ? "↑" : "↓"} {kpi.caTrend} vs période préc.
                  </span>
                )}
              </div>
              <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 10 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 5 }}>
                  Secteur : {formatEur(BENCHMARKS.ca.moy)} · Top 20% : {formatEur(BENCHMARKS.ca.top20)}
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 2, width: `${benchPct(kpi.ca, BENCHMARKS.ca.top20)}%`, background: "#2D8CFF" }} />
                </div>
              </div>
            </div>

            {/* Marge brute */}
            <div style={{ ...glass, borderRadius: 16, padding: "20px 20px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Marge brute</span>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(139,92,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                {formatEur(kpi.marge)}
              </div>
              <div style={{ marginBottom: 10 }}>
                <span style={{
                  display: "inline-flex", alignItems: "center",
                  background: "rgba(139,92,246,0.12)", color: "#6D28D9",
                  borderRadius: 7, padding: "2px 8px", fontSize: 12, fontWeight: 600,
                }}>
                  Taux : {kpi.margePct}%
                </span>
              </div>
              <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 10 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 5 }}>
                  Secteur : {BENCHMARKS.marge.moy}% · Top 20% : {BENCHMARKS.marge.top20}%
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 2, width: `${benchPct(kpi.margePct, BENCHMARKS.marge.top20)}%`, background: "#8B5CF6" }} />
                </div>
              </div>
            </div>

            {/* Bénéfice net */}
            <div style={{ ...glass, borderRadius: 16, padding: "20px 20px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Bénéfice net</span>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(0,201,138,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00C98A" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                {formatEur(kpi.benefice)}
              </div>
              <div style={{ marginBottom: 10 }}>
                <span style={{
                  display: "inline-flex", alignItems: "center",
                  background: "rgba(0,201,138,0.12)", color: "#047857",
                  borderRadius: 7, padding: "2px 8px", fontSize: 12, fontWeight: 600,
                }}>
                  {kpi.beneficePct}% du CA (avant IS)
                </span>
              </div>
              <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 10 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 5 }}>
                  Secteur : {BENCHMARKS.benefice.moy}% · Top 20% : {BENCHMARKS.benefice.top20}%
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 2, width: `${benchPct(kpi.beneficePct, BENCHMARKS.benefice.top20)}%`, background: "#00C98A" }} />
                </div>
              </div>
            </div>

            {/* Panier moyen */}
            <div style={{ ...glass, borderRadius: 16, padding: "20px 20px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Panier moyen</span>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                {formatEur(kpi.panier)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                {kpi.panierTrend && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 3,
                    background: kpi.panierTrendUp ? "rgba(0,201,138,0.12)" : "rgba(239,68,68,0.12)",
                    color: kpi.panierTrendUp ? "#047857" : "#991B1B",
                    borderRadius: 7, padding: "2px 8px", fontSize: 12, fontWeight: 600,
                  }}>
                    {kpi.panierTrendUp ? "↑" : "↓"} {kpi.panierTrend} vs période préc.
                  </span>
                )}
              </div>
              <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 10 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 5 }}>
                  Secteur : {formatEur(BENCHMARKS.panier.moy)} · Top 20% : {formatEur(BENCHMARKS.panier.top20)}
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 2, width: `${benchPct(kpi.panier, BENCHMARKS.panier.top20)}%`, background: "#F59E0B" }} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Insights automatiques (feature 3) ── */}
          {(() => {
            const caLast = dynCaMensuels[dynCaMensuels.length - 1] ?? 0;
            const caPrev = dynCaMensuels[dynCaMensuels.length - 2] ?? 0;
            const lastMonthLabel = MONTHS[(new Date().getMonth() + 11) % 12];
            const maxCa = Math.max(...dynCaMensuels);
            const isMaxMonth = caLast === maxCa;
            const diff = caPrev > 0 ? Math.round(((caLast - caPrev) / caPrev) * 100) : 0;
            const topPerformer = [...EQUIPE].sort((a, b) => {
              const aObj = editObjectifs[a.initiales] ?? a.objectif;
              const bObj = editObjectifs[b.initiales] ?? b.objectif;
              return (b.ca / bObj) - (a.ca / aObj);
            })[0];
            const topPct = topPerformer ? Math.round((topPerformer.ca / (editObjectifs[topPerformer.initiales] ?? topPerformer.objectif)) * 100) : 0;
            const insights: Array<{ dot: string; text: string }> = [
              margesTotalTaux > 63
                ? { dot: "#2D8CFF", text: `Votre marge brute de ${margesTotalTaux}% dépasse l'objectif sectoriel de 63% — votre mix produit est optimisé.` }
                : { dot: "#F59E0B", text: `Marge brute à ${margesTotalTaux}% sous l'objectif sectoriel (63%) — revoir le mix verres simples/progressifs.` },
              isMaxMonth
                ? { dot: "#00C98A", text: `${lastMonthLabel} est votre meilleur mois sur les 12 derniers mois avec ${formatEur(caLast)} de CA.` }
                : diff < 0
                ? { dot: "#EF4444", text: `Le CA de ce mois est en recul de ${Math.abs(diff)}% par rapport au mois précédent.` }
                : { dot: "#00C98A", text: `Le CA de ce mois progresse de ${diff}% par rapport au mois précédent.` },
              topPerformer
                ? { dot: "#8B5CF6", text: `${topPerformer.nom} est le top performer du mois à ${topPct}% de l'objectif avec ${formatEur(topPerformer.ca)} de CA.` }
                : { dot: "#8B5CF6", text: "Aucune donnée praticien disponible." },
            ];
            return (
              <div style={{
                ...glass,
                borderRadius: 16, padding: "22px 24px", marginBottom: 24,
                background: "linear-gradient(135deg, rgba(45,140,255,0.05), rgba(99,102,241,0.05))",
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>
                  Insights
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {insights.map((ins, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="9" cy="9" r="5" fill={ins.dot} opacity="0.18"/>
                        <circle cx="9" cy="9" r="3" fill={ins.dot}/>
                      </svg>
                      <span style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.55 }}>{ins.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Benchmarks concurrentiels */}
          <div style={{ ...glass, borderRadius: 16, padding: "24px 28px", marginBottom: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>
              Positionnement concurrentiel
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["Indicateur", "Votre cabinet", "Secteur moy.", "Top 20%", "Statut"].map(h => (
                      <th key={h} style={{
                        textAlign: h === "Indicateur" ? "left" : h === "Statut" ? "center" : "right",
                        paddingBottom: 12,
                        fontSize: 11, fontWeight: 600, color: "#94a3b8",
                        textTransform: "uppercase", letterSpacing: "0.04em",
                        borderBottom: "1px solid rgba(0,0,0,0.06)",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BENCHMARK_ROWS.map((row, i) => {
                    const st = statutStyle(row.statut);
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                        <td style={{ padding: "11px 0", color: "#334155", fontWeight: 500 }}>{row.label}</td>
                        <td style={{ textAlign: "right", color: "#0f172a", fontWeight: 700 }}>{row.cabinet}</td>
                        <td style={{ textAlign: "right", color: "#64748b" }}>{row.secteur}</td>
                        <td style={{ textAlign: "right", color: "#64748b" }}>{row.top20}</td>
                        <td style={{ textAlign: "center" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            background: st.bg, color: st.color,
                            borderRadius: 8, padding: "3px 10px",
                            fontSize: 12, fontWeight: 600,
                          }}>
                            {st.symbol} {row.statutLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* AreaChart CA + Bénéfice pleine largeur */}
          <div style={{ ...glass, borderRadius: 16, padding: "22px 22px 18px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                Évolution CA &amp; Bénéfice — 12 derniers mois
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}>
                  <div style={{ width: 12, height: 3, borderRadius: 2, background: "#2D8CFF" }} /> CA
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}>
                  <div style={{ width: 12, height: 3, borderRadius: 2, background: "#00C98A" }} /> Bénéfice
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}>
                  <div style={{ width: 20, height: 2, borderRadius: 1, background: "#F59E0B", backgroundImage: "repeating-linear-gradient(to right, #F59E0B 0, #F59E0B 4px, transparent 4px, transparent 8px)" }} /> Objectif
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={dynEvolution} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2D8CFF" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#2D8CFF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C98A" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#00C98A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k€`} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [formatEur(value as number), name]}
                  contentStyle={{ ...glassSubtle, borderRadius: 10, fontSize: 13 }}
                />
                <ReferenceLine y={40000} stroke="#F59E0B" strokeDasharray="5 4" strokeWidth={1.5}
                  label={{ value: "Objectif 40 000 €", position: "right", fontSize: 11, fill: "#F59E0B" }} />
                <Legend wrapperStyle={{ display: "none" }} />
                <Area type="monotone" dataKey="CA" stroke="#2D8CFF" strokeWidth={2} fill="url(#colorCA)" dot={false} />
                <Area type="monotone" dataKey="Benefice" stroke="#00C98A" strokeWidth={2} fill="url(#colorBen)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* ── Funnel de conversion (feature 2) ── */}
          {(() => {
            const steps = [
              { label: "RDVs ce mois", value: funnelData.rdv },
              { label: "Devis créés", value: funnelData.devis },
              { label: "Factures émises", value: funnelData.factures },
              { label: "Encaissé", value: funnelData.encaisse },
            ];
            return (
              <div style={{ ...glass, borderRadius: 16, padding: "22px 24px 20px", marginBottom: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                  Funnel de conversion
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
                  De la prise de RDV à l&apos;encaissement
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {steps.map((step, i) => {
                    const pct = i === 0 ? 100 : steps[i - 1].value > 0 ? Math.round((step.value / steps[i - 1].value) * 100) : 0;
                    const convColor = pct < 70 ? "#EF4444" : pct <= 85 ? "#F59E0B" : "#00C98A";
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 100 }}>
                        <div style={{
                          flex: 1,
                          background: "linear-gradient(135deg, rgba(45,140,255,0.07), rgba(99,102,241,0.07))",
                          border: "1px solid rgba(45,140,255,0.15)",
                          borderRadius: 14, padding: "16px 12px",
                          textAlign: "center",
                        }}>
                          <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", lineHeight: 1, marginBottom: 6 }}>
                            {step.value}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 8, lineHeight: 1.3 }}>
                            {step.label}
                          </div>
                          {i === 0 ? (
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#2D8CFF" }}>100%</div>
                          ) : (
                            <div style={{ fontSize: 12, fontWeight: 700, color: convColor }}>
                              {pct}% ↓
                            </div>
                          )}
                        </div>
                        {i < steps.length - 1 && (
                          <div style={{ fontSize: 18, color: "#94a3b8", fontWeight: 400, flexShrink: 0 }}>→</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Alertes intelligentes */}
          <div style={{ ...glass, borderRadius: 16, padding: "22px 24px 20px" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>
              Points d&apos;attention
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {alertes.map((a, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  background: a.bg,
                  border: `1px solid ${a.border}`,
                  borderRadius: 12, padding: "13px 16px",
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: a.color,
                    marginTop: 4, flexShrink: 0,
                  }} />
                  <span style={{ flex: 1, fontSize: 13, color: a.color, fontWeight: 500, lineHeight: 1.5 }}>
                    {a.text}
                  </span>
                  {a.link && (
                    <span style={{
                      fontSize: 12, fontWeight: 600, color: a.color,
                      cursor: "pointer", whiteSpace: "nowrap",
                      opacity: 0.8,
                    }}>
                      {a.link}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          ONGLET : ÉQUIPE & PERFORMANCE
      ══════════════════════════════════════════════════════════════ */}
      {tab === "equipe" && (
        <>
          {/* Objectifs du mois */}
          <div style={{ ...glass, borderRadius: 16, padding: "24px 28px", marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>
              Objectifs du mois
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {EQUIPE.map((emp, i) => {
                const objectifEffectif = editObjectifs[emp.initiales] ?? emp.objectif;
                const pctEffectif = objectifEffectif > 0 ? Math.min(100, Math.round((emp.ca / objectifEffectif) * 100)) : 0;
                const badge =
                  pctEffectif >= 80
                    ? { label: "En objectif", icon: "", color: "#047857", bg: "rgba(0,201,138,0.10)", border: "rgba(0,201,138,0.25)" }
                    : pctEffectif >= 50
                    ? { label: "À booster", icon: "", color: "#B45309", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.25)" }
                    : { label: "Attention", icon: "", color: "#991B1B", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.25)" };
                const tendances = ["+4% vs février", "+2% vs février", "-3% vs février"];
                const isEditing = editingInitiales === emp.initiales;

                const saveObjectif = (val: string) => {
                  const n = parseInt(val, 10);
                  if (!isNaN(n) && n > 0) {
                    const updated = { ...editObjectifs, [emp.initiales]: n };
                    setEditObjectifs(updated);
                    try { localStorage.setItem("thor_pro_vision_objectifs", JSON.stringify(updated)); } catch {}
                  }
                  setEditingInitiales(null);
                  setEditingValue("");
                };

                return (
                  <div key={i} style={{
                    background: "rgba(255,255,255,0.50)",
                    border: "1px solid rgba(255,255,255,0.70)",
                    borderRadius: 14,
                    padding: "18px 20px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                      {/* Avatar */}
                      <div style={{
                        width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
                        background: emp.color + "22",
                        border: `2px solid ${emp.color}50`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: emp.color, fontSize: 14, fontWeight: 700,
                      }}>
                        {emp.initiales}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{emp.nom}</span>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            background: badge.bg, border: `1px solid ${badge.border}`,
                            color: badge.color, borderRadius: 8, padding: "2px 10px",
                            fontSize: 12, fontWeight: 600,
                          }}>
                            {badge.icon} {badge.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{emp.role}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: progressColor(pctEffectif) }}>{pctEffectif}%</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{tendances[i]}</div>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ height: 8, borderRadius: 5, background: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 5,
                          width: `${pctEffectif}%`,
                          background: progressColor(pctEffectif),
                          transition: "width 0.6s ease",
                        }} />
                      </div>
                    </div>

                    {/* Stats ligne */}
                    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>CA réalisé</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{formatEur(emp.ca)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>Objectif</div>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingValue}
                            autoFocus
                            onChange={e => setEditingValue(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") saveObjectif(editingValue); if (e.key === "Escape") { setEditingInitiales(null); setEditingValue(""); } }}
                            onBlur={() => saveObjectif(editingValue)}
                            style={{
                              fontSize: 14, fontWeight: 700, color: "#0f172a",
                              border: "none", borderBottom: "2px solid #2D8CFF",
                              outline: "none", background: "transparent",
                              width: 90, padding: "0 2px",
                            }}
                          />
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{formatEur(objectifEffectif)}</span>
                            <button
                              onClick={() => { setEditingInitiales(emp.initiales); setEditingValue(String(objectifEffectif)); }}
                              title="Modifier l'objectif"
                              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>Restant</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: pctEffectif >= 100 ? "#047857" : "#EF4444" }}>
                          {pctEffectif >= 100 ? "Atteint ✓" : formatEur(objectifEffectif - emp.ca)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>Actes réalisés</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{emp.actes} actes</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comparatif équipe - BarChart */}
          <div style={{ ...glass, borderRadius: 16, padding: "22px 22px 18px", marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
              Comparatif équipe — CA réalisé vs objectif
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
              Ligne pointillée = objectif moyen ({formatEur(objectifMoyen)})
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={equipeChartData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 13, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k€`} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [formatEur(value as number), name === "CA" ? "CA réalisé" : "Objectif"]}
                  contentStyle={{ ...glassSubtle, borderRadius: 10, fontSize: 13 }}
                />
                <ReferenceLine y={objectifMoyen} stroke="#F59E0B" strokeDasharray="5 4" strokeWidth={1.5}
                  label={{ value: "Obj. moyen", position: "right", fontSize: 11, fill: "#F59E0B" }} />
                <Bar dataKey="CA" radius={[5, 5, 0, 0]} maxBarSize={48}>
                  {equipeChartData.map((_, idx) => (
                    <Cell key={idx} fill={EQUIPE[idx].color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Actes par type */}
          <div style={{ ...glass, borderRadius: 16, padding: "22px 28px", marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>
              Actes par type
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", paddingBottom: 12, fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      Praticien
                    </th>
                    {ACTES_COLS.map(col => (
                      <th key={col} style={{ textAlign: "center", paddingBottom: 12, fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                        {col}
                      </th>
                    ))}
                    <th style={{ textAlign: "center", paddingBottom: 12, fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {EQUIPE.map((emp, i) => {
                    const vals = ACTES_TYPES[emp.nom] ?? [0, 0, 0, 0];
                    const total = vals.reduce((s, v) => s + v, 0);
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                        <td style={{ padding: "11px 0" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: "50%",
                              background: emp.color + "22",
                              border: `2px solid ${emp.color}50`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: emp.color, fontSize: 11, fontWeight: 700, flexShrink: 0,
                            }}>
                              {emp.initiales}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{emp.nom}</div>
                              <div style={{ fontSize: 11, color: "#94a3b8" }}>{emp.role}</div>
                            </div>
                          </div>
                        </td>
                        {vals.map((v, ci) => (
                          <td key={ci} style={{ textAlign: "center", color: "#334155", fontWeight: 500, padding: "11px 8px" }}>
                            <span style={{
                              display: "inline-block",
                              background: emp.color + "18",
                              color: emp.color,
                              borderRadius: 7, padding: "2px 10px",
                              fontSize: 13, fontWeight: 700,
                            }}>
                              {v}
                            </span>
                          </td>
                        ))}
                        <td style={{ textAlign: "center", padding: "11px 8px" }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{total}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alertes équipe */}
          <div style={{ ...glass, borderRadius: 16, padding: "22px 24px 20px" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>
              Alertes équipe
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { icon: "", text: "Martin Vidal à 66% de son objectif — 4 700 € restants à générer ce mois", color: "#991B1B", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.30)" },
                { icon: "", text: "Dr. Sophie Martin à 90% — en bonne voie pour atteindre son objectif mensuel", color: "#047857", bg: "rgba(0,201,138,0.10)", border: "rgba(0,201,138,0.30)" },
                { icon: "", text: "Julien Dubois : 31 actes réalisés — record mensuel personnel à portée (33 actes)", color: "#B45309", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.30)" },
                { icon: "ℹ", text: "Taux moyen d'atteinte objectifs équipe : 79% — objectif collectif fixé à 85%", color: "#1D6FCC", bg: "rgba(45,140,255,0.10)", border: "rgba(45,140,255,0.30)" },
              ].map((a, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  background: a.bg, border: `1px solid ${a.border}`,
                  borderRadius: 12, padding: "13px 16px",
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, marginTop: 4, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: a.color, fontWeight: 500, lineHeight: 1.5 }}>
                    {a.icon} {a.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          ONGLET : FINANCES & MARGES
      ══════════════════════════════════════════════════════════════ */}
      {tab === "finances" && (
        <>
          {/* Répartition CA */}
          <div style={{ ...glass, borderRadius: 16, padding: "22px 22px 18px", marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>
              Répartition CA par catégorie
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={CA_CATEGORIE}
                layout="vertical"
                margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k€`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} width={90} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [formatEur(value as number), "CA"]}
                  contentStyle={{ ...glassSubtle, borderRadius: 10, fontSize: 13 }}
                />
                <ReferenceLine x={SECTEUR_CA_MENSUEL} stroke="#F59E0B" strokeDasharray="5 4" strokeWidth={1.5}
                  label={{ value: "Moy. secteur", position: "top", fontSize: 10, fill: "#F59E0B" }} />
                <Bar dataKey="value" radius={[0, 5, 5, 0]} maxBarSize={20}>
                  {CA_CATEGORIE.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tableau des marges */}
          <div style={{ ...glass, borderRadius: 16, padding: "24px 28px", marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>
              Tableau des marges
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["Catégorie", "CA", "Coût", "Marge €", "Taux %", "Coeff", "Statut"].map(h => (
                      <th key={h} style={{
                        textAlign: h === "Catégorie" ? "left" : h === "Taux %" ? "left" : "right",
                        paddingBottom: 12,
                        fontSize: 11, fontWeight: 600, color: "#94a3b8",
                        textTransform: "uppercase", letterSpacing: "0.04em",
                        borderBottom: "1px solid rgba(0,0,0,0.06)",
                        paddingRight: h === "Catégorie" ? 0 : 8,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COUTS_MARGES.map((row, i) => {
                    const tc = margeTauxColor(row.taux);
                    const statut = row.taux >= 65 ? { label: "Excellent", color: "#047857", bg: "rgba(0,201,138,0.12)" }
                      : row.taux >= 55 ? { label: "Bon", color: "#1D6FCC", bg: "rgba(45,140,255,0.12)" }
                      : row.taux >= 45 ? { label: "Moyen", color: "#B45309", bg: "rgba(245,158,11,0.12)" }
                      : { label: "Faible", color: "#991B1B", bg: "rgba(239,68,68,0.12)" };
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                        <td style={{ padding: "11px 0", color: "#334155", fontWeight: 500 }}>{row.cat}</td>
                        <td style={{ textAlign: "right", color: "#0f172a", fontWeight: 600, paddingRight: 8 }}>{formatEur(row.ca)}</td>
                        <td style={{ textAlign: "right", color: "#64748b", paddingRight: 8 }}>{formatEur(row.cout)}</td>
                        <td style={{ textAlign: "right", color: "#0f172a", fontWeight: 700, paddingRight: 8 }}>{formatEur(row.marge)}</td>
                        <td style={{ paddingRight: 8, paddingTop: 11, paddingBottom: 11 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 100 }}>
                            <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                              <div style={{ height: "100%", borderRadius: 3, width: `${row.taux}%`, background: tc, transition: "width 0.5s" }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: tc, minWidth: 32 }}>{row.taux}%</span>
                          </div>
                        </td>
                        <td style={{ textAlign: "right", color: "#64748b", paddingRight: 8 }}>×{row.coeff.toFixed(1)}</td>
                        <td style={{ textAlign: "right" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center",
                            background: statut.bg, color: statut.color,
                            borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 600,
                          }}>
                            {statut.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid rgba(0,0,0,0.08)" }}>
                    <td style={{ padding: "12px 0", fontWeight: 800, color: "#0f172a", fontSize: 14 }}>Total</td>
                    <td style={{ textAlign: "right", fontWeight: 800, color: "#0f172a", paddingRight: 8 }}>{formatEur(margesTotal.ca)}</td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "#64748b", paddingRight: 8 }}>{formatEur(margesTotal.cout)}</td>
                    <td style={{ textAlign: "right", fontWeight: 800, color: "#0f172a", paddingRight: 8 }}>{formatEur(margesTotal.marge)}</td>
                    <td style={{ paddingRight: 8, paddingTop: 12, paddingBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 100 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 3, width: `${margesTotalTaux}%`, background: margeTauxColor(margesTotalTaux) }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: margeTauxColor(margesTotalTaux), minWidth: 32 }}>{margesTotalTaux}%</span>
                      </div>
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Projection trésorerie */}
          <div style={{ ...glass, borderRadius: 16, padding: "22px 28px", marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
              Projection trésorerie
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
              Basé sur le rythme actuel et les devis en cours
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {[
                { label: "Encaissé ce mois", value: 38500, color: "#047857", bg: "rgba(0,201,138,0.10)", border: "rgba(0,201,138,0.25)", icon: "✓" },
                { label: "En attente", sublabel: "Devis acceptés non facturés", value: 12300, color: "#B45309", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.25)", icon: "⏳" },
                { label: "Prévu fin de mois", value: 50800, color: "#1D6FCC", bg: "rgba(45,140,255,0.10)", border: "rgba(45,140,255,0.25)", icon: "" },
              ].map((item, i) => (
                <div key={i} style={{
                  background: item.bg,
                  border: `1px solid ${item.border}`,
                  borderRadius: 14, padding: "20px 22px",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: item.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                    {item.label}
                  </div>
                  {item.sublabel && (
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>{item.sublabel}</div>
                  )}
                  <div style={{ fontSize: 28, fontWeight: 800, color: item.color }}>
                    {formatEur(item.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Indicateurs financiers clés */}
          <div style={{ ...glass, borderRadius: 16, padding: "24px 28px" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>
              Indicateurs financiers clés
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {[
                {
                  label: "Délai paiement moyen",
                  value: "18 j",
                  sub: "vs objectif 15 j",
                  color: "#B45309", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.20)",
                  trend: "▲ +3 j",
                },
                {
                  label: "Taux transformation devis",
                  value: "72%",
                  sub: "vs secteur 58%",
                  color: "#047857", bg: "rgba(0,201,138,0.08)", border: "rgba(0,201,138,0.20)",
                  trend: "▲ +14 pts",
                },
                {
                  label: "Avoirs / remboursements",
                  value: "1 240 €",
                  sub: "0,3% du CA — normal",
                  color: "#047857", bg: "rgba(0,201,138,0.08)", border: "rgba(0,201,138,0.20)",
                  trend: "✓ Sain",
                },
                {
                  label: "Charges fixes estimées",
                  value: "18 500 €",
                  sub: "par mois",
                  color: "#334155", bg: "rgba(0,0,0,0.04)", border: "rgba(0,0,0,0.10)",
                  trend: "— stable",
                },
                {
                  label: "Seuil de rentabilité",
                  value: "24 000 €",
                  sub: "par mois",
                  color: "#1D6FCC", bg: "rgba(45,140,255,0.08)", border: "rgba(45,140,255,0.20)",
                  trend: "ℹ info",
                },
                {
                  label: "Marge nette après charges",
                  value: "18%",
                  sub: "sur CA total",
                  color: "#047857", bg: "rgba(0,201,138,0.08)", border: "rgba(0,201,138,0.20)",
                  trend: "✓ Bon",
                },
              ].map((ind, i) => (
                <div key={i} style={{
                  background: ind.bg,
                  border: `1px solid ${ind.border}`,
                  borderRadius: 14, padding: "18px 20px",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 8, lineHeight: 1.3 }}>
                    {ind.label}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: ind.color, marginBottom: 4 }}>
                    {ind.value}
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>{ind.sub}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: ind.color }}>
                    {ind.trend}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
