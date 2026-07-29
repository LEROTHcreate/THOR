"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { Chart } from "@/components/charts/lazy-chart";
import { loadUsers, loadCurrentUserId, type ProUser } from "@/lib/users";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

/* ─── Period / Tab types ───────────────────────────────────────────── */
type Period = "mois" | "trimestre" | "annee";
type Tab    = "global" | "equipe" | "finances";

/* ─── KPI data by period ───────────────────────────────────────────── */
const KPI_BY_PERIOD: Record<Period, { ca: number; marge: number; benefice: number; panier: number; trend: string }> = {
  mois:      { ca: 38400,   marge: 19968,  benefice: 5376,  panier: 1920, trend: "+8.2% vs N-1" },
  trimestre: { ca: 105600,  marge: 54912,  benefice: 14784, panier: 1900, trend: "+7.4% vs N-1" },
  annee:     { ca: 384000,  marge: 199680, benefice: 53760, panier: 1910, trend: "+6.1% vs N-1" },
};

/* ─── Score de santé ───────────────────────────────────────────────── */
const HEALTH_SCORE = 79;
const SUB_SCORES = [
  { label: "CA",         value: 82, color: "#00C98A" },
  { label: "Marge",      value: 65, color: "#F59E0B" },
  { label: "Équipe",     value: 88, color: "#6366F1" },
  { label: "Trésorerie", value: 72, color: "#06B6D4" },
];

function scoreColor(s: number): string {
  if (s >= 80) return "#00C98A";
  if (s >= 60) return "#F59E0B";
  return "#DC2626";
}

/* ─── Benchmarks ───────────────────────────────────────────────────── */
type BenchStatus = "above" | "norm" | "watch";
type BenchRow = {
  indicateur: string;
  cabinet:    string;
  secteur:    string;
  top20:      string;
  statut:     BenchStatus;
  label:      string;
};

const BENCHMARKS: BenchRow[] = [
  { indicateur: "CA mensuel",             cabinet: "38 400 €",  secteur: "32 000 €",   top20: "52 000 €",   statut: "above", label: "✓ Au-dessus" },
  { indicateur: "Marge brute",            cabinet: "52%",       secteur: "48%",         top20: "58%",         statut: "norm",  label: "✓ Dans la norme" },
  { indicateur: "Taux 100% Santé (Cl.1)", cabinet: "38%",       secteur: "42%",         top20: "28%",         statut: "watch", label: "Surveiller" },
  { indicateur: "Panier moyen",           cabinet: "1 920 €",   secteur: "1 650 €",     top20: "2 400 €",     statut: "above", label: "✓ Au-dessus" },
  { indicateur: "Délai adaptation moy.",  cabinet: "3 visites", secteur: "3.2 visites", top20: "2.4 visites", statut: "above", label: "✓ Bon" },
  { indicateur: "Taux renouvellement",    cabinet: "67%",       secteur: "55%",         top20: "74%",         statut: "above", label: "✓ Bon" },
  { indicateur: "Taux SAV/retours",       cabinet: "3.2%",      secteur: "4.8%",        top20: "2.1%",        statut: "above", label: "✓ Excellent" },
  { indicateur: "NPS patient estimé",     cabinet: "71",        secteur: "56",          top20: "78",          statut: "above", label: "✓ Bon" },
];

function benchStatusStyle(s: BenchStatus): { color: string; bg: string } {
  if (s === "above") return { color: "#047857", bg: "rgba(0,201,138,0.12)" };
  if (s === "norm")  return { color: "#1D6FCC", bg: "rgba(99,102,241,0.10)" };
  return { color: "#B45309", bg: "rgba(245,158,11,0.12)" };
}

/* ─── AreaChart data ────────────────────────────────────────────────── */
const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const CA_MONTHLY  = [24000,28000,38400,36000,34000,31000,26000,20000,36000,34000,31000,34000];
const BEN_MONTHLY = [3360,4480,9408,8640,7680,6240,4160,1600,8640,7680,6240,7680];
const EVOLUTION_DATA = MONTHS.map((m, i) => ({ month: m, CA: CA_MONTHLY[i], Benefice: BEN_MONTHLY[i] }));

/* ─── CA par marque ─────────────────────────────────────────────────── */
const CA_MARQUE = [
  { name: "Phonak Lumity",     value: 12800 },
  { name: "Oticon Intent",     value: 9200  },
  { name: "Starkey Evolv",     value: 7400  },
  { name: "Widex Moment",      value: 4600  },
  { name: "ReSound Nexia",     value: 2800  },
  { name: "Accessoires/Piles", value: 1600  },
];
const BAR_COLORS = ["#00C98A", "#6366F1", "#8B5CF6", "#F59E0B", "#06B6D4", "#94a3b8"];

/* ─── Équipe ────────────────────────────────────────────────────────── */
const EQUIPE = [
  { nom: "Dr. Marie Dupont", role: "Audioprothésiste", actes: 20, ca: 32000, objectif: 36000, pct: 89, initiales: "MD", color: "#00C98A" },
  { nom: "Thomas Bernard",   role: "Audioprothésiste", actes: 15, ca: 6400,  objectif: 10000, pct: 64, initiales: "TB", color: "#6366F1" },
];

/* ─── Actes par type ────────────────────────────────────────────────── */
type ActesRow = { praticien: string; bilan: number; adaptation: number; suivi: number; livraison: number; urgence: number };
const ACTES_PAR_TYPE: ActesRow[] = [
  { praticien: "Dr. Marie Dupont", bilan: 6, adaptation: 8, suivi: 3, livraison: 2, urgence: 1 },
  { praticien: "Thomas Bernard",   bilan: 5, adaptation: 5, suivi: 3, livraison: 1, urgence: 1 },
];

/* ─── Marges ────────────────────────────────────────────────────────── */
type MargeRow = { cat: string; ca: number; cout: number; marge: number; taux: number; coeff: number };
const MARGES: MargeRow[] = [
  { cat: "Appareils Classe 1 (100%S)", ca: 14592, cout: 8034, marge: 6558, taux: 45, coeff: 1.8 },
  { cat: "Appareils Classe 2",         ca: 19200, cout: 8640, marge: 10560, taux: 55, coeff: 2.2 },
  { cat: "Accessoires & Piles",        ca: 1920,  cout: 576,  marge: 1344,  taux: 70, coeff: 3.3 },
  { cat: "Garanties étendues",         ca: 1920,  cout: 576,  marge: 1344,  taux: 70, coeff: 3.3 },
  { cat: "SAV & Entretien",            ca: 768,   cout: 384,  marge: 384,   taux: 50, coeff: 2.0 },
];

function margeTauxColor(t: number): string {
  if (t >= 60) return "#00C98A";
  if (t >= 50) return "#6366F1";
  if (t >= 40) return "#F59E0B";
  return "#DC2626";
}

function margeStatut(t: number): { label: string; color: string; bg: string } {
  if (t >= 60) return { label: "Excellent", color: "#047857", bg: "rgba(0,201,138,0.12)" };
  if (t >= 50) return { label: "Bon",       color: "#1D6FCC", bg: "rgba(99,102,241,0.10)" };
  if (t >= 40) return { label: "Correct",   color: "#B45309", bg: "rgba(245,158,11,0.12)" };
  return { label: "Faible", color: "#991B1B", bg: "rgba(220,38,38,0.10)" };
}

/* ─── Indicateurs financiers clés ──────────────────────────────────── */
type IndicFinRow = { label: string; value: string; comment: string; badge: string; badgeColor: string; badgeBg: string };
const INDIC_FIN: IndicFinRow[] = [
  { label: "Délai adaptation moyen", value: "3 visites",   comment: "vs secteur 3.2 — Efficace",          badge: "✓ Vert",  badgeColor: "#047857", badgeBg: "rgba(0,201,138,0.12)" },
  { label: "Taux renouvellement",    value: "67%",         comment: "vs secteur 55% — Au-dessus",         badge: "✓ Vert",  badgeColor: "#047857", badgeBg: "rgba(0,201,138,0.12)" },
  { label: "Taux 100% Santé Cl.1",   value: "38%",         comment: "Surveiller impact marge",            badge: "Orange", badgeColor: "#B45309", badgeBg: "rgba(245,158,11,0.12)" },
  { label: "Charges fixes",          value: "21 000 €/mois", comment: "Loyer · Salaires · Charges sociales", badge: "— Neutre", badgeColor: "#64748b", badgeBg: "rgba(100,116,139,0.10)" },
  { label: "Seuil rentabilité",      value: "28 000 €/mois", comment: "Couvert ce mois (+10 400 €)",       badge: "ℹ Info",  badgeColor: "#0369a1", badgeBg: "rgba(6,182,212,0.10)" },
  { label: "Marge nette après charges", value: "14%",      comment: "vs secteur 12% — Bonne santé",       badge: "✓ Bleu",  badgeColor: "#1D6FCC", badgeBg: "rgba(99,102,241,0.10)" },
];

/* ─── Alertes ───────────────────────────────────────────────────────── */
type Alerte = { icon: string; text: string; color: string; bg: string; border: string };

const ALERTES: Alerte[] = [
  {
    icon: "",
    text: "Taux 100% Santé Cl.1 à 38% (vs secteur 42%) — légèrement au-dessus du secteur, surveiller l'impact sur la marge",
    color: "#B45309", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.30)",
  },
  {
    icon: "",
    text: "Thomas Bernard à 64% de son objectif mensuel (6 400 € / 10 000 €) — accompagnement recommandé",
    color: "#B45309", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.30)",
  },
  {
    icon: "✓",
    text: "Excellent taux SAV/retours : 3.2% vs secteur 4.8% — qualité d'appareillage remarquable",
    color: "#047857", bg: "rgba(0,201,138,0.10)", border: "rgba(0,201,138,0.30)",
  },
  {
    icon: "ℹ",
    text: "Top marque : Phonak Lumity représente 33% du CA mensuel (12 800 €) — risque de dépendance fournisseur à monitorer",
    color: "#1D6FCC", bg: "rgba(0,201,138,0.08)", border: "rgba(99,102,241,0.25)",
  },
  {
    icon: "✓",
    text: "Marge brute 52% (vs secteur 48%) — au-dessus de la moyenne nationale, bonne politique tarifaire",
    color: "#047857", bg: "rgba(0,201,138,0.10)", border: "rgba(0,201,138,0.30)",
  },
];

const ALERTES_EQUIPE: Alerte[] = [
  {
    icon: "",
    text: "Thomas Bernard (64%) — sous l'objectif mensuel de 3 600 € · Relance accompagnement conseillée",
    color: "#B45309", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.30)",
  },
  {
    icon: "✓",
    text: "Dr. Marie Dupont à 89% de l'objectif — en bonne voie pour dépasser les 36 000 € ce mois",
    color: "#047857", bg: "rgba(0,201,138,0.10)", border: "rgba(0,201,138,0.30)",
  },
  {
    icon: "ℹ",
    text: "Ratio bilans/adaptations : 11/13 — taux de conversion 86%, excellent pour le secteur (moy. 72%)",
    color: "#1D6FCC", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.25)",
  },
];

/* ─── Page ─────────────────────────────────────────────────────────── */
export default function GerantAuditionPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<ProUser | null>(null);
  const [period, setPeriod]           = useState<Period>("mois");
  const [tab, setTab]                 = useState<Tab>("global");
  const [mounted, setMounted]         = useState(false);
  const [editObjectifs, setEditObjectifs] = useState<Record<string, number>>({});
  const [editingKey, setEditingKey]       = useState<string | null>(null);
  const [editingValue, setEditingValue]   = useState<string>("");

  /* ── Funnel state ── */
  const [funnelData, setFunnelData] = useState({ rdv: 18, essais: 12, factures: 9, encaisse: 7 });

  useEffect(() => {
    const loaded = loadUsers();
    const curId  = loadCurrentUserId();
    const user   = loaded.find(u => u.id === curId) ?? null;
    setCurrentUser(user);
    setMounted(true);
    if (user && user.role !== "Gérant") {
      router.replace("/clair-audition/pro");
    }

    /* ── Charger objectifs éditables ── */
    try {
      const saved = localStorage.getItem("thor_pro_audition_objectifs");
      if (saved) setEditObjectifs(JSON.parse(saved) as Record<string, number>);
    } catch { /* ignore */ }

    /* ── Charger données funnel ── */
    try {
      const now   = new Date();
      const month = now.getMonth();
      const year  = now.getFullYear();
      const isThisMonth = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.getMonth() === month && d.getFullYear() === year;
      };

      const rawRdv      = localStorage.getItem("thor_pro_audition_rdv");
      const rawEssais   = localStorage.getItem("thor_pro_audition_essais");
      const rawFactures = localStorage.getItem("thor_pro_audition_factures");

      const rdvArr      = rawRdv      ? (JSON.parse(rawRdv)      as Array<{ date: string }>) : [];
      const essaisArr   = rawEssais   ? (JSON.parse(rawEssais)   as Array<{ date: string }>) : [];
      const facturesArr = rawFactures ? (JSON.parse(rawFactures) as Array<{ date: string; statut?: string }>) : [];

      const rdvCount      = rdvArr.filter(r => isThisMonth(r.date)).length;
      const essaisCount   = essaisArr.filter(r => isThisMonth(r.date)).length;
      const facturesCount = facturesArr.filter(r => isThisMonth(r.date)).length;
      const encaisseCount = facturesArr.filter(r => isThisMonth(r.date) && (r.statut === "payee" || r.statut === "Payée")).length;

      if (rdvCount > 0 || essaisCount > 0 || facturesCount > 0) {
        setFunnelData({ rdv: rdvCount, essais: essaisCount, factures: facturesCount, encaisse: encaisseCount });
      }
    } catch { /* ignore */ }
  }, [router]);

  if (!mounted) return null;
  if (!currentUser || currentUser.role !== "Gérant") return null;

  const kpi      = KPI_BY_PERIOD[period];
  const totalCA  = CA_MARQUE.reduce((s, c) => s + c.value, 0);
  const sc       = scoreColor(HEALTH_SCORE);
  const objMoyen = Math.round(EQUIPE.reduce((s, e) => s + e.objectif, 0) / EQUIPE.length);

  /* ── Insights calculés ── */
  const totalMarge   = MARGES.reduce((s, r) => s + r.marge, 0);
  const totalCaMarges = MARGES.reduce((s, r) => s + r.ca, 0);
  const margePct     = Math.round((totalMarge / totalCaMarges) * 100);

  const lastMonthCA  = CA_MONTHLY[CA_MONTHLY.length - 1];
  const prevMonthCA  = CA_MONTHLY[CA_MONTHLY.length - 2];
  const caEvolution  = Math.abs(Math.round(((lastMonthCA - prevMonthCA) / prevMonthCA) * 100));
  const caDirection  = lastMonthCA >= prevMonthCA ? "en progression" : "en recul";

  /* ── Helpers objectifs éditables ── */
  const saveObjectif = (initiales: string, value: number) => {
    const next = { ...editObjectifs, [initiales]: value };
    setEditObjectifs(next);
    try { localStorage.setItem("thor_pro_audition_objectifs", JSON.stringify(next)); } catch { /* ignore */ }
  };

  const pageStyle: CSSProperties = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const periodBtnActive: CSSProperties = {
    background: "#00C98A",
    color: "#fff",
    boxShadow: "0 2px 8px rgba(0,201,138,0.25)",
    border: "1px solid transparent",
    borderRadius: 10,
    padding: "6px 18px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  };
  const periodBtnInactive: CSSProperties = {
    background: "var(--glass-subtle-bg)",
    color: "#64748b",
    border: "1px solid var(--glass-subtle-border)",
    borderRadius: 10,
    padding: "6px 18px",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  };

  const tabDefs: { id: Tab; label: string }[] = [
    { id: "global",   label: "Vue globale" },
    { id: "equipe",   label: "Équipe & Performance" },
    { id: "finances", label: "Finances & Marges" },
  ];

  return (
    <div style={pageStyle}>

      {/* ── 1. Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "#00C98A",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,201,138,0.30)",
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

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {/* Score badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: sc === "#00C98A" ? "rgba(0,201,138,0.12)" : sc === "#F59E0B" ? "rgba(245,158,11,0.12)" : "rgba(220,38,38,0.12)",
              border: `1px solid ${sc}40`,
              borderRadius: 12, padding: "6px 14px",
              fontSize: 13, fontWeight: 700, color: sc,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: sc, display: "inline-block" }} />
              Score de santé : {HEALTH_SCORE}/100
            </div>

            {/* Bouton Exporter le rapport */}
            <button
              onClick={() => window.print()}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "#ffffff",
                border: "1px solid rgba(0,201,138,0.3)",
                borderRadius: 20, padding: "6px 16px",
                fontSize: 13, fontWeight: 600, color: "#00C98A",
                cursor: "pointer",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              }}
            >
              Exporter le rapport
            </button>

            {/* Period toggle */}
            <div style={{ display: "flex", gap: 6, ...glassSubtle, borderRadius: 12, padding: 4 }}>
              {(["mois", "trimestre", "annee"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={period === p ? periodBtnActive : periodBtnInactive}
                >
                  {p === "mois" ? "Mois" : p === "trimestre" ? "Trimestre" : "Année"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Onglets ── */}
      <div style={{
        display: "flex", gap: 6,
        background: "var(--glass-strong-bg)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid var(--glass-border)",
        borderRadius: 16,
        padding: 6,
        marginBottom: 28,
        boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
        width: "fit-content",
      }}>
        {tabDefs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "9px 22px",
                borderRadius: 11,
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                color: active ? "#00C98A" : "#64748b",
                background: active ? "#ffffff" : "transparent",
                boxShadow: active ? "0 2px 10px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.20s ease",
                outline: "none",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════
          TAB : Vue globale
      ══════════════════════════════════════════════════ */}
      {tab === "global" && (
        <>
          {/* Score de santé global */}
          <div style={{ ...glass, borderRadius: 18, padding: "26px 28px 24px", marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 32, flexWrap: "wrap" }}>
              {/* Grand chiffre */}
              <div style={{ minWidth: 160, textAlign: "center" }}>
                <div style={{
                  fontSize: 64, fontWeight: 800, lineHeight: 1,
                  color: sc, marginBottom: 6,
                }}>
                  {HEALTH_SCORE}
                  <span style={{ fontSize: 28, fontWeight: 600, color: "#94a3b8" }}>/100</span>
                </div>
                <div style={{ height: 10, borderRadius: 6, background: "rgba(0,0,0,0.07)", overflow: "hidden", marginBottom: 8 }}>
                  <div style={{
                    height: "100%", width: `${HEALTH_SCORE}%`, borderRadius: 6,
                    background: `linear-gradient(90deg, #00C98A ${HEALTH_SCORE >= 80 ? "100%" : "60%"}, ${sc})`,
                    transition: "width 0.6s ease",
                  }} />
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Score global cabinet</div>
              </div>

              {/* Sous-scores */}
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
                {SUB_SCORES.map(ss => (
                  <div key={ss.label} style={{ ...glassSubtle, borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>{ss.label}</span>
                      <span style={{ fontSize: 18, fontWeight: 800, color: ss.color }}>{ss.value}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 4, background: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${ss.value}%`, borderRadius: 4, background: ss.color }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Texte benchmark */}
              <div style={{
                alignSelf: "center",
                background: "rgba(0,201,138,0.08)",
                border: "1px solid rgba(0,201,138,0.22)",
                borderRadius: 14, padding: "14px 18px", maxWidth: 260,
              }}>
                <div style={{ fontSize: 13, color: "#047857", fontWeight: 600, lineHeight: 1.5 }}>
                  Votre cabinet performe mieux que 61% des cabinets audioprothésistes français
                </div>
              </div>
            </div>
          </div>

          {/* 4 KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
            {/* CA */}
            <div style={{ ...glass, borderRadius: 16, padding: "20px 20px 18px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                Chiffre d&apos;affaires
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{formatEur(kpi.ca)}</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(0,201,138,0.12)", color: "#047857", borderRadius: 8, padding: "3px 8px", fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
                ↑ {kpi.trend}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>vs secteur (moy. 32 000 €/mois)</div>
              <div style={{ height: 5, borderRadius: 3, background: "rgba(0,0,0,0.07)" }}>
                <div style={{ height: "100%", width: `${Math.min(100, (38400 / 52000) * 100).toFixed(0)}%`, borderRadius: 3, background: "#00C98A" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginTop: 3 }}>
                <span>Moy. 32k€</span><span>Top 20% 52k€</span>
              </div>
            </div>

            {/* Marge */}
            <div style={{ ...glass, borderRadius: 16, padding: "20px 20px 18px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                Marge brute
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{formatEur(kpi.marge)}</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(99,102,241,0.10)", color: "#4F46E5", borderRadius: 8, padding: "3px 8px", fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
                52% du CA
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Secteur moy. 48% · Top 20% 58%</div>
              <div style={{ height: 5, borderRadius: 3, background: "rgba(0,0,0,0.07)" }}>
                <div style={{ height: "100%", width: `${Math.round((52 / 58) * 100)}%`, borderRadius: 3, background: "#6366F1" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginTop: 3 }}>
                <span>Moy. 48%</span><span>Top 20% 58%</span>
              </div>
            </div>

            {/* Bénéfice */}
            <div style={{ ...glass, borderRadius: 16, padding: "20px 20px 18px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                Bénéfice net
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{formatEur(kpi.benefice)}</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(0,201,138,0.12)", color: "#047857", borderRadius: 8, padding: "3px 8px", fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
                14% du CA
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Secteur moy. 12% · Top 20% 19%</div>
              <div style={{ height: 5, borderRadius: 3, background: "rgba(0,0,0,0.07)" }}>
                <div style={{ height: "100%", width: `${Math.round((14 / 19) * 100)}%`, borderRadius: 3, background: "#00C98A" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginTop: 3 }}>
                <span>Moy. 12%</span><span>Top 20% 19%</span>
              </div>
            </div>

            {/* Panier moyen */}
            <div style={{ ...glass, borderRadius: 16, padding: "20px 20px 18px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                Panier moyen
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{formatEur(kpi.panier)}</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(6,182,212,0.10)", color: "#0369a1", borderRadius: 8, padding: "3px 8px", fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
                ↑ vs secteur
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Secteur moy. 1 650€ · Top 20% 2 400€</div>
              <div style={{ height: 5, borderRadius: 3, background: "rgba(0,0,0,0.07)" }}>
                <div style={{ height: "100%", width: `${Math.round((1920 / 2400) * 100)}%`, borderRadius: 3, background: "#06B6D4" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginTop: 3 }}>
                <span>Moy. 1 650€</span><span>Top 20% 2 400€</span>
              </div>
            </div>
          </div>

          {/* ── Insights automatiques ── */}
          <div style={{
            borderRadius: 18, padding: "22px 24px 20px", marginBottom: 28,
            background: "linear-gradient(135deg, rgba(0,201,138,0.05), rgba(99,102,241,0.05))",
            border: "1px solid var(--glass-border)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: "linear-gradient(135deg, #00C98A, #6366F1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,201,138,0.28)",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Insights</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Analyse automatique de vos données</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Insight 1 — marge brute */}
              <div style={{
                borderRadius: 14, padding: "14px 16px",
                background: margePct > 52 ? "rgba(0,201,138,0.08)" : "rgba(245,158,11,0.08)",
                border: `1px solid ${margePct > 52 ? "rgba(0,201,138,0.25)" : "rgba(245,158,11,0.25)"}`,
              }}>
                <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.55, color: margePct > 52 ? "#047857" : "#B45309" }}>
                  {margePct > 52
                    ? `Votre marge brute de ${margePct}% dépasse la moyenne sectorielle de 48% — positionnement haut de gamme optimal.`
                    : `Marge brute sous 48% — revoir le mix Classe 1 / Classe 2.`}
                </span>
              </div>
              {/* Insight 2 — CA mensuel */}
              <div style={{
                borderRadius: 14, padding: "14px 16px",
                background: caDirection === "en progression" ? "rgba(0,201,138,0.08)" : "rgba(220,38,38,0.06)",
                border: `1px solid ${caDirection === "en progression" ? "rgba(0,201,138,0.25)" : "rgba(220,38,38,0.20)"}`,
              }}>
                <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.55, color: caDirection === "en progression" ? "#047857" : "#991B1B" }}>
                  Ce mois est {caDirection} de {caEvolution}% vs le mois précédent.
                </span>
              </div>
              {/* Insight 3 — renouvellements */}
              <div style={{
                borderRadius: 14, padding: "14px 16px",
                background: "rgba(99,102,241,0.07)",
                border: "1px solid rgba(99,102,241,0.22)",
              }}>
                <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.55, color: "#4338CA" }}>
                  67% de taux de renouvellement — 12 points au-dessus de la moyenne sectorielle (55%). Excellent levier de fidélisation.
                </span>
              </div>
            </div>
          </div>

          {/* Benchmarks concurrentiels */}
          <div style={{ ...glass, borderRadius: 18, padding: "22px 24px 20px", marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: "linear-gradient(135deg, #6366F1, #4F46E5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(99,102,241,0.30)",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Benchmarks concurrentiels</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Positionnement vs secteur audioprothèse français</div>
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Indicateur","Votre cabinet","Secteur moy.","Top 20%","Statut"].map((h, i) => (
                    <th key={h} style={{
                      textAlign: i === 0 ? "left" : "center",
                      paddingBottom: 10, fontSize: 11, fontWeight: 600,
                      color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em",
                      borderBottom: "1px solid rgba(0,0,0,0.07)",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BENCHMARKS.map((row, i) => {
                  const ss = benchStatusStyle(row.statut);
                  return (
                    <tr key={i} style={{ borderTop: i > 0 ? "1px solid rgba(0,0,0,0.05)" : undefined }}>
                      <td style={{ padding: "10px 0", color: "#334155", fontWeight: 500 }}>{row.indicateur}</td>
                      <td style={{ textAlign: "center", fontWeight: 700, color: "#0f172a" }}>{row.cabinet}</td>
                      <td style={{ textAlign: "center", color: "#64748b" }}>{row.secteur}</td>
                      <td style={{ textAlign: "center", color: "#64748b" }}>{row.top20}</td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          background: ss.bg, color: ss.color,
                          borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 600,
                        }}>{row.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* AreaChart CA + Bénéfice 12 mois */}
          <div style={{ ...glass, borderRadius: 16, padding: "22px 22px 18px", marginBottom: 28 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
              Évolution CA &amp; Bénéfice — 12 mois
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>Objectif mensuel : 36 000 €</div>
            <Chart height={230} render={({ ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine }) => (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={EVOLUTION_DATA} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00C98A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00C98A" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradBen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.20} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k€`} />
                <Tooltip
                  formatter={(value: unknown, name: unknown) => [formatEur(Number(value)), String(name)]}
                  contentStyle={{ ...glassSubtle, borderRadius: 10, fontSize: 13 }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: "#64748b" }} />
                <ReferenceLine y={36000} stroke="#F59E0B" strokeDasharray="5 3"
                  label={{ value: "Objectif 36k€", position: "insideTopRight", fontSize: 11, fill: "#F59E0B" }} />
                <Area type="monotone" dataKey="CA"       stroke="#00C98A" strokeWidth={2} fill="url(#gradCA)"  dot={false} />
                <Area type="monotone" dataKey="Benefice" stroke="#6366f1" strokeWidth={2} fill="url(#gradBen)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            )} />
          </div>

          {/* ── Funnel de conversion ── */}
          <div style={{ ...glass, borderRadius: 18, padding: "22px 24px 20px", marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: "linear-gradient(135deg, #06B6D4, #0369a1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(6,182,212,0.28)",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Funnel de conversion</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>De la prise de RDV à l&apos;encaissement</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
              {(() => {
                const steps = [
                  { label: "RDVs ce mois",    value: funnelData.rdv },
                  { label: "Essais lancés",   value: funnelData.essais },
                  { label: "Factures émises", value: funnelData.factures },
                  { label: "Encaissé",        value: funnelData.encaisse },
                ];
                return steps.map((step, i) => {
                  const pct = i === 0 ? 100 : Math.round((step.value / steps[i - 1].value) * 1000) / 10;
                  const pctColor = i === 0 ? "#00C98A" : pct < 70 ? "#DC2626" : pct < 85 ? "#F59E0B" : "#00C98A";
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                      <div style={{
                        flex: 1,
                        ...glassSubtle,
                        borderRadius: 14, padding: "18px 14px",
                        textAlign: "center",
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
                          {step.label}
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", lineHeight: 1, marginBottom: 8 }}>
                          {step.value}
                        </div>
                        <div style={{
                          display: "inline-flex", alignItems: "center",
                          background: i === 0 ? "rgba(0,201,138,0.12)" : pctColor === "#DC2626" ? "rgba(220,38,38,0.10)" : pctColor === "#F59E0B" ? "rgba(245,158,11,0.10)" : "rgba(0,201,138,0.12)",
                          color: pctColor,
                          borderRadius: 8, padding: "3px 9px", fontSize: 12, fontWeight: 700,
                        }}>
                          {i === 0 ? "100%" : `${pct}% ↓`}
                        </div>
                      </div>
                      {i < steps.length - 1 && (
                        <div style={{ fontSize: 20, color: "#94a3b8", padding: "0 8px", flexShrink: 0 }}>→</div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Alertes intelligentes */}
          <div style={{ ...glass, borderRadius: 18, padding: "22px 24px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(245,158,11,0.28)",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Alertes intelligentes</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Recommandations basées sur vos données</div>
              </div>
              <div style={{
                marginLeft: "auto",
                display: "inline-flex", alignItems: "center", gap: 4,
                background: "rgba(245,158,11,0.10)", color: "#D97706",
                borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 700,
              }}>
                {ALERTES.length} alertes
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ALERTES.map((a, i) => (
                <div key={i} style={{
                  borderRadius: 14, padding: "14px 16px",
                  display: "flex", alignItems: "flex-start", gap: 10,
                  background: a.bg, border: `1px solid ${a.border}`,
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{a.icon}</span>
                  <span style={{ fontSize: 13, color: a.color, fontWeight: 500, lineHeight: 1.5 }}>{a.text}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════
          TAB : Équipe & Performance
      ══════════════════════════════════════════════════ */}
      {tab === "equipe" && (
        <>
          {/* Objectifs du mois */}
          <div style={{ ...glass, borderRadius: 18, padding: "22px 24px 20px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: "#00C98A",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,201,138,0.28)",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Objectifs du mois</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{EQUIPE.length} audioprothésistes · Période : {period === "mois" ? "Mois en cours" : period === "trimestre" ? "Trimestre" : "Année"}</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {EQUIPE.map((emp, i) => {
                const effectifObjectif = editObjectifs[emp.initiales] ?? emp.objectif;
                const computedPct      = Math.round((emp.ca / effectifObjectif) * 100);
                const pctColor         = computedPct >= 80 ? "#00C98A" : computedPct >= 50 ? "#F59E0B" : "#DC2626";
                const badge =
                  computedPct >= 80
                    ? { label: "En objectif",  color: "#047857", bg: "rgba(0,201,138,0.12)" }
                    : computedPct >= 50
                    ? { label: "À booster",    color: "#B45309", bg: "rgba(245,158,11,0.12)" }
                    : { label: "Attention",     color: "#991B1B", bg: "rgba(220,38,38,0.10)" };

                const tendance      = i === 0 ? "+4% vs mois préc." : "-8% vs mois préc.";
                const tendanceColor = i === 0 ? "#047857" : "#DC2626";
                const isEditing     = editingKey === emp.initiales;

                return (
                  <div key={i} style={{ ...glassSubtle, borderRadius: 16, padding: "18px 20px" }}>
                    {/* Ligne 1 : avatar + nom + badge + pct */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%",
                        background: emp.color + "20",
                        border: `2px solid ${emp.color}50`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: emp.color, fontSize: 14, fontWeight: 800, flexShrink: 0,
                      }}>
                        {emp.initiales}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{emp.nom}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{emp.role}</div>
                      </div>
                      <span style={{
                        display: "inline-flex", alignItems: "center", padding: "4px 10px",
                        borderRadius: 8, fontSize: 12, fontWeight: 700,
                        color: badge.color, background: badge.bg,
                      }}>{badge.label}</span>
                      <div style={{ textAlign: "right", minWidth: 54 }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: pctColor, lineHeight: 1 }}>{computedPct}%</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>objectif</div>
                      </div>
                    </div>

                    {/* Barre progression */}
                    <div style={{ height: 8, borderRadius: 5, background: "rgba(0,0,0,0.07)", overflow: "hidden", marginBottom: 14 }}>
                      <div style={{
                        height: "100%", width: `${Math.min(100, computedPct)}%`, borderRadius: 5,
                        background: `linear-gradient(90deg, ${pctColor}bb, ${pctColor})`,
                        transition: "width 0.55s ease",
                      }} />
                    </div>

                    {/* Métriques */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                      <div style={{ ...glassSubtle, borderRadius: 10, padding: "10px 12px", boxShadow: "none" }}>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>CA réalisé</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{formatEur(emp.ca)}</div>
                      </div>
                      <div style={{ ...glassSubtle, borderRadius: 10, padding: "10px 12px", boxShadow: "none" }}>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>Objectif</div>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingValue}
                            autoFocus
                            onChange={e => setEditingValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                const v = parseInt(editingValue, 10);
                                if (!isNaN(v) && v > 0) saveObjectif(emp.initiales, v);
                                setEditingKey(null);
                              }
                              if (e.key === "Escape") setEditingKey(null);
                            }}
                            onBlur={() => {
                              const v = parseInt(editingValue, 10);
                              if (!isNaN(v) && v > 0) saveObjectif(emp.initiales, v);
                              setEditingKey(null);
                            }}
                            style={{
                              fontSize: 15, fontWeight: 700, color: "#0f172a",
                              border: "none", borderBottom: `2px solid #00C98A`,
                              outline: "none", background: "transparent",
                              width: "100%", padding: "0",
                            }}
                          />
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: "#64748b" }}>{formatEur(effectifObjectif)}</span>
                            <button
                              onClick={() => { setEditingKey(emp.initiales); setEditingValue(String(effectifObjectif)); }}
                              title="Modifier l'objectif"
                              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                      <div style={{ ...glassSubtle, borderRadius: 10, padding: "10px 12px", boxShadow: "none" }}>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>Actes</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{emp.actes}</div>
                      </div>
                      <div style={{ ...glassSubtle, borderRadius: 10, padding: "10px 12px", boxShadow: "none" }}>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>Tendance</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: tendanceColor }}>{tendance}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comparatif équipe — BarChart horizontal */}
          <div style={{ ...glass, borderRadius: 18, padding: "22px 24px 20px", marginBottom: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Comparatif équipe — CA du mois</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>Objectif moyen : {formatEur(objMoyen)}</div>
            <Chart height={160} render={({ ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine }) => (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={EQUIPE.map(e => ({ name: e.initiales, CA: e.ca, color: e.color }))}
                layout="vertical"
                margin={{ top: 0, right: 50, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k€`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 13, fill: "#334155", fontWeight: 600 }}
                  axisLine={false} tickLine={false} width={32} />
                <Tooltip
                  formatter={(value: unknown) => [formatEur(Number(value)), "CA"]}
                  contentStyle={{ ...glassSubtle, borderRadius: 10, fontSize: 13 }}
                />
                <ReferenceLine x={objMoyen} stroke="#F59E0B" strokeDasharray="5 3"
                  label={{ value: `Obj. moy. ${formatEur(objMoyen)}`, position: "insideTopRight", fontSize: 11, fill: "#F59E0B" }} />
                <Bar dataKey="CA" radius={[0, 6, 6, 0]}>
                  {EQUIPE.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )} />
          </div>

          {/* Actes par type */}
          <div style={{ ...glass, borderRadius: 18, padding: "22px 24px 20px", marginBottom: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Actes par type</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>Répartition des actes par praticien — secteur audioprothèse</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["Praticien","Bilan auditif","Adaptation","Suivi","Livraison","Urgence","Total"].map((h, i) => (
                      <th key={h} style={{
                        textAlign: i === 0 ? "left" : "center",
                        paddingBottom: 10, fontSize: 11, fontWeight: 600,
                        color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em",
                        borderBottom: "1px solid rgba(0,0,0,0.07)",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ACTES_PAR_TYPE.map((row, i) => {
                    const total = row.bilan + row.adaptation + row.suivi + row.livraison + row.urgence;
                    const emp   = EQUIPE[i];
                    return (
                      <tr key={i} style={{ borderTop: i > 0 ? "1px solid rgba(0,0,0,0.05)" : undefined }}>
                        <td style={{ padding: "11px 0" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: "50%",
                              background: (emp?.color ?? "#94a3b8") + "20",
                              border: `1.5px solid ${(emp?.color ?? "#94a3b8")}50`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: emp?.color ?? "#94a3b8", fontSize: 11, fontWeight: 700,
                            }}>
                              {emp?.initiales ?? "??"}
                            </div>
                            <span style={{ fontWeight: 600, color: "#334155" }}>{row.praticien}</span>
                          </div>
                        </td>
                        {[row.bilan, row.adaptation, row.suivi, row.livraison, row.urgence].map((v, j) => (
                          <td key={j} style={{ textAlign: "center", color: "#0f172a", fontWeight: 500, padding: "11px 4px" }}>{v}</td>
                        ))}
                        <td style={{ textAlign: "center", fontWeight: 800, color: emp?.color ?? "#64748b" }}>{total}</td>
                      </tr>
                    );
                  })}
                  {/* Totaux */}
                  <tr style={{ borderTop: "2px solid rgba(0,0,0,0.08)" }}>
                    <td style={{ padding: "10px 0", fontSize: 12, fontWeight: 700, color: "#64748b" }}>Total équipe</td>
                    {(["bilan","adaptation","suivi","livraison","urgence"] as (keyof Omit<ActesRow,"praticien">)[]).map((k) => (
                      <td key={k} style={{ textAlign: "center", fontWeight: 700, color: "#334155", fontSize: 13 }}>
                        {ACTES_PAR_TYPE.reduce((s, r) => s + r[k], 0)}
                      </td>
                    ))}
                    <td style={{ textAlign: "center", fontWeight: 800, color: "#0f172a", fontSize: 14 }}>
                      {ACTES_PAR_TYPE.reduce((s, r) => s + r.bilan + r.adaptation + r.suivi + r.livraison + r.urgence, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Alertes équipe */}
          <div style={{ ...glass, borderRadius: 18, padding: "22px 24px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(245,158,11,0.28)",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Alertes équipe</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Points d&apos;attention sur la performance</div>
              </div>
              <div style={{
                marginLeft: "auto",
                display: "inline-flex", alignItems: "center", gap: 4,
                background: "rgba(245,158,11,0.10)", color: "#D97706",
                borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 700,
              }}>
                {ALERTES_EQUIPE.length} alertes
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ALERTES_EQUIPE.map((a, i) => (
                <div key={i} style={{
                  borderRadius: 14, padding: "14px 16px",
                  display: "flex", alignItems: "flex-start", gap: 10,
                  background: a.bg, border: `1px solid ${a.border}`,
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{a.icon}</span>
                  <span style={{ fontSize: 13, color: a.color, fontWeight: 500, lineHeight: 1.5 }}>{a.text}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════
          TAB : Finances & Marges
      ══════════════════════════════════════════════════ */}
      {tab === "finances" && (
        <>
          {/* CA par marque */}
          <div style={{ ...glass, borderRadius: 18, padding: "22px 24px 20px", marginBottom: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
              Répartition CA par marque — {formatEur(totalCA)}/mois
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>Chiffre d&apos;affaires par fabricant</div>
            <Chart height={240} render={({ ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip }) => (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={CA_MARQUE}
                layout="vertical"
                margin={{ top: 4, right: 50, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k€`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false} tickLine={false} width={118} />
                <Tooltip
                  formatter={(value: unknown) => [formatEur(Number(value)), "CA"]}
                  contentStyle={{ ...glassSubtle, borderRadius: 10, fontSize: 13 }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {CA_MARQUE.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )} />
          </div>

          {/* Tableau des marges */}
          <div style={{ ...glass, borderRadius: 18, padding: "22px 24px 20px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: "#00C98A",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,201,138,0.28)",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Tableau des marges</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Analyse par catégorie de produit/service</div>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["Catégorie","CA","Coût","Marge €","Taux %","Coeff","Statut"].map((h, i) => (
                      <th key={h} style={{
                        textAlign: i === 0 ? "left" : "center",
                        paddingBottom: 10, fontSize: 11, fontWeight: 600,
                        color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em",
                        borderBottom: "1px solid rgba(0,0,0,0.07)",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MARGES.map((row, i) => {
                    const st = margeStatut(row.taux);
                    const tc = margeTauxColor(row.taux);
                    return (
                      <tr key={i} style={{ borderTop: i > 0 ? "1px solid rgba(0,0,0,0.05)" : undefined }}>
                        <td style={{ padding: "11px 0", color: "#334155", fontWeight: 500 }}>{row.cat}</td>
                        <td style={{ textAlign: "center", color: "#0f172a", fontWeight: 700 }}>{formatEur(row.ca)}</td>
                        <td style={{ textAlign: "center", color: "#64748b" }}>{formatEur(row.cout)}</td>
                        <td style={{ textAlign: "center", fontWeight: 700, color: "#0f172a" }}>{formatEur(row.marge)}</td>
                        <td style={{ textAlign: "center", padding: "11px 8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                            <div style={{ width: 48, height: 6, borderRadius: 4, background: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${Math.min(100, row.taux)}%`, borderRadius: 4, background: tc }} />
                            </div>
                            <span style={{ fontWeight: 700, color: tc, fontSize: 13 }}>{row.taux}%</span>
                          </div>
                        </td>
                        <td style={{ textAlign: "center", color: "#64748b", fontWeight: 500 }}>×{row.coeff.toFixed(1)}</td>
                        <td style={{ textAlign: "center" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            background: st.bg, color: st.color,
                            borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 600,
                          }}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Totaux */}
                  <tr style={{ borderTop: "2px solid rgba(0,0,0,0.08)" }}>
                    <td style={{ padding: "11px 0", fontWeight: 700, color: "#0f172a" }}>Total</td>
                    <td style={{ textAlign: "center", fontWeight: 800, color: "#00C98A" }}>
                      {formatEur(MARGES.reduce((s, r) => s + r.ca, 0))}
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 700, color: "#64748b" }}>
                      {formatEur(MARGES.reduce((s, r) => s + r.cout, 0))}
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 800, color: "#0f172a" }}>
                      {formatEur(MARGES.reduce((s, r) => s + r.marge, 0))}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ fontWeight: 800, color: "#00C98A", fontSize: 14 }}>
                        {Math.round(
                          (MARGES.reduce((s, r) => s + r.marge, 0) / MARGES.reduce((s, r) => s + r.ca, 0)) * 100
                        )}%
                      </span>
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Projection trésorerie */}
          <div style={{ ...glass, borderRadius: 18, padding: "22px 24px 20px", marginBottom: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Projection trésorerie</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 18 }}>Encaissements du mois en cours</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {/* Encaissé */}
              <div style={{ ...glassSubtle, borderRadius: 16, padding: "20px 22px", textAlign: "center" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11, margin: "0 auto 12px",
                  background: "rgba(0,201,138,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00C98A" strokeWidth="2">
                    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                    <path d="M7 13l3 3 7-7"/>
                  </svg>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#00C98A", marginBottom: 4 }}>35 200 €</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>Encaissé ce mois</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Paiements confirmés reçus</div>
              </div>

              {/* En attente */}
              <div style={{ ...glassSubtle, borderRadius: 16, padding: "20px 22px", textAlign: "center" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11, margin: "0 auto 12px",
                  background: "rgba(245,158,11,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#F59E0B", marginBottom: 4 }}>8 400 €</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>En attente</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Essais en cours acceptés</div>
              </div>

              {/* Prévu fin de mois */}
              <div style={{ ...glassSubtle, borderRadius: 16, padding: "20px 22px", textAlign: "center" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11, margin: "0 auto 12px",
                  background: "rgba(99,102,241,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                    <polyline points="16 7 22 7 22 13"/>
                  </svg>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#6366F1", marginBottom: 4 }}>43 600 €</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>Prévu fin de mois</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Projection consolidée</div>
              </div>
            </div>
          </div>

          {/* Indicateurs financiers clés */}
          <div style={{ ...glass, borderRadius: 18, padding: "22px 24px 20px" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Indicateurs financiers clés</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 18 }}>Ratios de gestion et pilotage du cabinet</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
              {INDIC_FIN.map((ind, i) => (
                <div key={i} style={{ ...glassSubtle, borderRadius: 14, padding: "16px 18px" }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
                    {ind.label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>{ind.value}</div>
                  <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.45, marginBottom: 8 }}>{ind.comment}</div>
                  <span style={{
                    display: "inline-flex", alignItems: "center", padding: "3px 9px",
                    borderRadius: 7, fontSize: 11, fontWeight: 700,
                    color: ind.badgeColor, background: ind.badgeBg,
                  }}>{ind.badge}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
