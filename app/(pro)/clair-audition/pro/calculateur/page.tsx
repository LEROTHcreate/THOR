"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ── Glass tokens ─────────────────────────────────────────────────────────── */
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

/* ── Types ────────────────────────────────────────────────────────────────── */
type Step = 1 | 2 | 3 | 4;
type ModeVie = "Actif" | "Modéré" | "Sédentaire";
type Classe = "1" | "2";
type PerteType = "normal" | "légère" | "moyenne" | "sévère" | "profonde";
type Tier = "premium" | "milieu" | "entrée";

type Environnement =
  | "Conversations famille"
  | "Restaurants bruyants"
  | "TV"
  | "Téléphone"
  | "Musique"
  | "Extérieur";

interface Appareil {
  id: string;
  marque: string;
  modele: string;
  tier: Tier;
  prixUnitaire: number;
  technos: string[];
  lossCoverage: PerteType[];
  score: number;
}

/* ── Device database ──────────────────────────────────────────────────────── */
const APPAREILS_BASE: Omit<Appareil, "score">[] = [
  { id: "ph-lumity90",   marque: "Phonak",   modele: "Lumity 90",           tier: "premium", prixUnitaire: 3180, technos: ["rechargeable", "app", "noise-cancel", "streaming"],           lossCoverage: ["légère", "moyenne", "sévère", "profonde"] },
  { id: "ph-lumity70",   marque: "Phonak",   modele: "Lumity 70",           tier: "milieu",  prixUnitaire: 2450, technos: ["rechargeable", "app", "noise-cancel"],                        lossCoverage: ["légère", "moyenne", "sévère"] },
  { id: "ot-intent1",    marque: "Oticon",   modele: "Intent 1",            tier: "premium", prixUnitaire: 2890, technos: ["app", "4D-sensor", "streaming", "noise-cancel"],              lossCoverage: ["légère", "moyenne", "sévère", "profonde"] },
  { id: "ot-real1",      marque: "Oticon",   modele: "Real 1",              tier: "milieu",  prixUnitaire: 2200, technos: ["app", "noise-cancel"],                                        lossCoverage: ["légère", "moyenne", "sévère"] },
  { id: "sk-evolv2400",  marque: "Starkey",  modele: "Evolv AI 2400",       tier: "premium", prixUnitaire: 2420, technos: ["app", "fall-detect", "noise-cancel", "streaming"],            lossCoverage: ["légère", "moyenne", "sévère", "profonde"] },
  { id: "wd-moment312",  marque: "Widex",    modele: "Moment Sheer 440",    tier: "premium", prixUnitaire: 2650, technos: ["app", "streaming", "natural-sound"],                          lossCoverage: ["légère", "moyenne", "sévère"] },
  { id: "rs-nexia9",     marque: "ReSound",  modele: "Nexia 9",             tier: "premium", prixUnitaire: 2800, technos: ["app", "streaming", "auracast"],                               lossCoverage: ["légère", "moyenne", "sévère", "profonde"] },
  { id: "sg-pure5",      marque: "Signia",   modele: "Pure Charge&Go AX 7", tier: "milieu",  prixUnitaire: 2100, technos: ["rechargeable", "app"],                                        lossCoverage: ["légère", "moyenne", "sévère"] },
  { id: "bn-viron9",     marque: "Bernafon", modele: "Viron 9",             tier: "entrée",  prixUnitaire: 1400, technos: ["app"],                                                        lossCoverage: ["légère", "moyenne"] },
];

const TECHNO_LABELS: Record<string, string> = {
  "rechargeable":  "Rechargeable",
  "app":           "App mobile",
  "noise-cancel":  "Anti-bruit",
  "streaming":     "Streaming audio",
  "4D-sensor":     "Capteur 4D",
  "fall-detect":   "Détection chute",
  "natural-sound": "Son naturel",
  "auracast":      "Auracast BT",
};

const TIER_LABELS: Record<Tier, string> = {
  premium: "Haut de gamme",
  milieu:  "Milieu de gamme",
  entrée:  "Entrée de gamme",
};

const TIER_COLORS: Record<Tier, string> = {
  premium: "bg-violet-50 text-violet-700 ring-violet-200",
  milieu:  "bg-emerald-50 text-emerald-700 ring-emerald-200",
  entrée:  "bg-slate-50 text-slate-600 ring-slate-200",
};

const SS_REMBOURSEMENT = 1700; // € par appareil

/* ── Scoring ──────────────────────────────────────────────────────────────── */
function scoreAppareils(
  a: Omit<Appareil, "score">,
  lossLevel: PerteType,
  modeVie: ModeVie,
  smartphone: boolean,
  budgetTotal: number,
  classe: Classe,
): number {
  let s = 0;

  // Loss coverage match
  if (a.lossCoverage.includes(lossLevel)) s += 40;

  // Tier vs loss severity
  if ((lossLevel === "sévère" || lossLevel === "profonde") && a.tier === "premium") s += 20;
  if (lossLevel === "moyenne" && (a.tier === "milieu" || a.tier === "premium")) s += 15;
  if (lossLevel === "légère" && a.tier !== "premium") s += 10;

  // Lifestyle
  if (modeVie === "Actif" && a.technos.includes("noise-cancel")) s += 15;
  if (modeVie === "Actif" && a.technos.includes("streaming")) s += 8;

  // Smartphone connectivity
  if (smartphone && a.technos.includes("app")) s += 12;
  if (smartphone && a.technos.includes("streaming")) s += 8;

  // Budget fit (prix binaural)
  const prixBin = a.prixUnitaire * 2;
  const rac = prixBin - SS_REMBOURSEMENT * 2;
  if (rac <= budgetTotal) s += 20;
  else if (rac <= budgetTotal * 1.2) s += 8;

  // Classe preference
  if (classe === "1" && a.tier === "entrée") s += 5;
  if (classe === "2" && (a.tier === "milieu" || a.tier === "premium")) s += 5;

  return s;
}

function computeOverallLoss(
  od500: string, od1000: string, od2000: string, od4000: string,
  og500: string, og1000: string, og2000: string, og4000: string,
): PerteType {
  const vals = [od500, od1000, od2000, od4000, og500, og1000, og2000, og4000]
    .map(Number).filter(v => !isNaN(v) && v > 0);
  if (vals.length === 0) return "normal";
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  if (avg <= 20) return "normal";
  if (avg <= 40) return "légère";
  if (avg <= 70) return "moyenne";
  if (avg <= 90) return "sévère";
  return "profonde";
}

function whyChosen(a: Omit<Appareil, "score">, lossLevel: PerteType, modeVie: ModeVie, smartphone: boolean): string[] {
  const reasons: string[] = [];
  if (a.lossCoverage.includes(lossLevel)) {
    reasons.push(`Adapté aux pertes auditives de type ${lossLevel}`);
  }
  if (modeVie === "Actif" && a.technos.includes("noise-cancel")) {
    reasons.push("Réduction active du bruit — idéal pour mode de vie actif");
  }
  if (smartphone && a.technos.includes("app")) {
    reasons.push("Connectivité smartphone via application dédiée");
  }
  if (a.technos.includes("rechargeable")) {
    reasons.push("Batterie rechargeable — plus de pile à gérer");
  }
  if (a.technos.includes("streaming")) {
    reasons.push("Streaming audio direct depuis TV / téléphone");
  }
  if (a.tier === "premium") {
    reasons.push("Technologie haut de gamme pour un confort auditif optimal");
  }
  return reasons.slice(0, 3);
}

/* ── Step bar ─────────────────────────────────────────────────────────────── */
const STEP_LABELS = ["Profil patient", "Audiogramme", "Remboursement", "Recommandations"] as const;

function StepBar({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-0">
      {STEP_LABELS.map((label, i) => {
        const n = (i + 1) as Step;
        const active = step === n;
        const done = step > n;
        return (
          <div key={n} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                active ? "text-white" : done ? "text-[#00C98A]" : "text-slate-400"
              }`}
              style={active
                ? { background: "#00C98A", boxShadow: "0 2px 8px rgba(0,201,138,.28)" }
                : glassSubtle}
            >
              <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${
                done ? "bg-[#00C98A] text-white" : active ? "bg-white/25 text-white" : "bg-slate-200 text-slate-500"
              }`}>
                {done
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  : n}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`h-px w-6 mx-1 ${done ? "bg-[#00C98A]" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Shared input classes ────────────────────────────────────────────────── */
const inputCls = "w-full rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C98A]/30 focus:border-[#00C98A]/60 transition-all";
const labelCls = "block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1";

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function CalculateurPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  /* Step 1 — Profil */
  const [age, setAge] = useState("");
  const [modeVie, setModeVie] = useState<ModeVie>("Modéré");
  const [envs, setEnvs] = useState<Environnement[]>([]);
  const [smartphone, setSmartphone] = useState<boolean>(false);

  /* Step 2 — Audiogramme */
  const [inputMode, setInputMode] = useState<"freq" | "type">("freq");
  const [od500, setOd500] = useState(""); const [od1000, setOd1000] = useState(""); const [od2000, setOd2000] = useState(""); const [od4000, setOd4000] = useState("");
  const [og500, setOg500] = useState(""); const [og1000, setOg1000] = useState(""); const [og2000, setOg2000] = useState(""); const [og4000, setOg4000] = useState("");
  const [directLoss, setDirectLoss] = useState<PerteType>("moyenne");

  /* Step 3 — Budget */
  const [classe, setClasse] = useState<Classe>("2");
  const [mutuelle, setMutuelle] = useState<boolean>(false);
  const [budgetMutuelle, setBudgetMutuelle] = useState(800);
  const [budgetTotal, setBudgetTotal] = useState(1500);

  /* ENV list */
  const ENV_OPTIONS: Environnement[] = [
    "Conversations famille", "Restaurants bruyants", "TV", "Téléphone", "Musique", "Extérieur",
  ];

  function toggleEnv(e: Environnement) {
    setEnvs(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
  }

  const lossLevel: PerteType = inputMode === "type"
    ? directLoss
    : computeOverallLoss(od500, od1000, od2000, od4000, og500, og1000, og2000, og4000);

  const prixBinaural = (a: Omit<Appareil, "score">) => a.prixUnitaire * 2;
  const racEstime = (a: Omit<Appareil, "score">) => {
    let rac = prixBinaural(a) - SS_REMBOURSEMENT * 2;
    if (mutuelle) rac -= budgetMutuelle;
    return Math.max(0, rac);
  };

  const top3: (Omit<Appareil, "score"> & { score: number; reasons: string[] })[] = (() => {
    return APPAREILS_BASE
      .map(a => ({
        ...a,
        score: scoreAppareils(a, lossLevel, modeVie, smartphone, budgetTotal, classe),
        reasons: whyChosen(a, lossLevel, modeVie, smartphone),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  })();

  const RANK_STYLES = [
    { label: "#1", bg: "linear-gradient(135deg,#f59e0b,#d97706)", shadow: "rgba(245,158,11,0.35)" },
    { label: "#2", bg: "linear-gradient(135deg,#94a3b8,#64748b)", shadow: "rgba(148,163,184,0.4)" },
    { label: "#3", bg: "linear-gradient(135deg,#cd7f32,#a0522d)", shadow: "rgba(205,127,50,0.35)" },
  ];

  function racColor(rac: number): string {
    if (rac <= 500) return "#10b981";
    if (rac <= 1500) return "#f59e0b";
    return "#ef4444";
  }

  /* Navigation */
  function canNext(): boolean {
    if (step === 1) return age !== "";
    return true;
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-800 h-title">Calculateur d&apos;appareillage</h1>
        <p className="mt-1 text-sm text-slate-500">Recommandations personnalisées en 4 étapes</p>
      </div>

      {/* Step bar */}
      <div className="rounded-[var(--radius-large)] p-4 overflow-x-auto" style={glass}>
        <StepBar step={step} />
      </div>

      {/* Step content */}
      <div className="rounded-[var(--radius-large)] p-6 space-y-5" style={glass}>

        {/* ─── Step 1: Profil ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-slate-800">Profil du patient</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Âge du patient</label>
                <input type="number" min={1} max={120} value={age} onChange={e => setAge(e.target.value)}
                  className={inputCls} placeholder="ex: 72" required />
              </div>
              <div>
                <label className={labelCls}>Mode de vie</label>
                <div className="flex gap-2">
                  {(["Actif", "Modéré", "Sédentaire"] as ModeVie[]).map(m => (
                    <button key={m} type="button" onClick={() => setModeVie(m)}
                      className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${modeVie === m ? "text-white" : "text-slate-500 hover:text-slate-700"}`}
                      style={modeVie === m
                        ? { background: "#00C98A", boxShadow: "0 2px 8px rgba(0,201,138,.3)" }
                        : glassSubtle}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Environnements */}
            <div>
              <label className={labelCls}>Environnements prioritaires</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {ENV_OPTIONS.map(e => (
                  <button key={e} type="button" onClick={() => toggleEnv(e)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${envs.includes(e) ? "text-white" : "text-slate-500 hover:text-slate-700"}`}
                    style={envs.includes(e)
                      ? { background: "#00C98A", boxShadow: "0 2px 6px rgba(0,201,138,.25)" }
                      : glassSubtle}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Smartphone */}
            <div>
              <label className={labelCls}>Utilisation smartphone</label>
              <div className="flex gap-2">
                {([true, false] as const).map(v => (
                  <button key={String(v)} type="button" onClick={() => setSmartphone(v)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${smartphone === v ? "text-white" : "text-slate-500 hover:text-slate-700"}`}
                    style={smartphone === v
                      ? { background: "#00C98A", boxShadow: "0 2px 8px rgba(0,201,138,.3)" }
                      : glassSubtle}>
                    {v ? "Oui" : "Non"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 2: Audiogramme ────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-slate-800">Audiogramme simplifié</h2>

            <div className="flex gap-2">
              {(["freq", "type"] as const).map(mode => (
                <button key={mode} type="button" onClick={() => setInputMode(mode)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${inputMode === mode ? "text-white" : "text-slate-500"}`}
                  style={inputMode === mode
                    ? { background: "#00C98A", boxShadow: "0 2px 8px rgba(0,201,138,.3)" }
                    : glassSubtle}>
                  {mode === "freq" ? "Saisir les seuils" : "Sélectionner le niveau"}
                </button>
              ))}
            </div>

            {inputMode === "freq" ? (
              <div className="space-y-4">
                <div className="rounded-xl p-4" style={glassSubtle}>
                  <div className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3">Oreille Droite (OD)</div>
                  <div className="grid grid-cols-4 gap-3">
                    {[{ label: "500 Hz", val: od500, set: setOd500 }, { label: "1 kHz", val: od1000, set: setOd1000 }, { label: "2 kHz", val: od2000, set: setOd2000 }, { label: "4 kHz", val: od4000, set: setOd4000 }].map(({ label, val, set }) => (
                      <div key={label}>
                        <label className={labelCls}>{label}</label>
                        <input type="number" min={0} max={120} value={val} onChange={e => set(e.target.value)}
                          className={inputCls} placeholder="dB" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-4" style={glassSubtle}>
                  <div className="text-xs font-bold text-[#6366f1] uppercase tracking-widest mb-3">Oreille Gauche (OG)</div>
                  <div className="grid grid-cols-4 gap-3">
                    {[{ label: "500 Hz", val: og500, set: setOg500 }, { label: "1 kHz", val: og1000, set: setOg1000 }, { label: "2 kHz", val: og2000, set: setOg2000 }, { label: "4 kHz", val: og4000, set: setOg4000 }].map(({ label, val, set }) => (
                      <div key={label}>
                        <label className={labelCls}>{label}</label>
                        <input type="number" min={0} max={120} value={val} onChange={e => set(e.target.value)}
                          className={inputCls} placeholder="dB" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-3 flex items-center gap-3" style={glassSubtle}>
                  <span className="text-xs text-slate-500">Niveau calculé :</span>
                  <span className="text-sm font-bold" style={{ color: "#00C98A" }}>
                    Perte {lossLevel}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <label className={labelCls}>Niveau de perte global</label>
                <div className="flex flex-wrap gap-2">
                  {(["normal", "légère", "moyenne", "sévère", "profonde"] as PerteType[]).map(p => (
                    <button key={p} type="button" onClick={() => setDirectLoss(p)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${directLoss === p ? "text-white" : "text-slate-500"}`}
                      style={directLoss === p
                        ? { background: "#00C98A", boxShadow: "0 2px 8px rgba(0,201,138,.3)" }
                        : glassSubtle}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Step 3: Budget ─────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-slate-800">Remboursement &amp; Budget</h2>

            {/* Classe */}
            <div>
              <label className={labelCls}>Classe de l&apos;appareil</label>
              <div className="flex gap-2">
                {(["1", "2"] as Classe[]).map(c => (
                  <button key={c} type="button" onClick={() => setClasse(c)}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${classe === c ? "text-white" : "text-slate-500"}`}
                    style={classe === c
                      ? { background: "#00C98A", boxShadow: "0 2px 8px rgba(0,201,138,.3)" }
                      : glassSubtle}>
                    Classe {c}
                    <div className="text-[10px] font-normal mt-0.5 opacity-80">
                      {c === "1" ? "Entrée / milieu de gamme — RAC zéro" : "Milieu / haut de gamme — RAC possible"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mutuelle */}
            <div>
              <label className={labelCls}>Mutuelle complémentaire</label>
              <div className="flex gap-2 mb-3">
                {([true, false] as const).map(v => (
                  <button key={String(v)} type="button" onClick={() => setMutuelle(v)}
                    className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${mutuelle === v ? "text-white" : "text-slate-500"}`}
                    style={mutuelle === v
                      ? { background: "#00C98A", boxShadow: "0 2px 8px rgba(0,201,138,.3)" }
                      : glassSubtle}>
                    {v ? "Oui" : "Non"}
                  </button>
                ))}
              </div>
              {mutuelle && (
                <div className="rounded-xl p-4" style={glassSubtle}>
                  <div className="flex justify-between mb-2">
                    <label className={labelCls + " mb-0"}>Budget mutuelle</label>
                    <span className="text-sm font-bold text-[#00C98A]">{budgetMutuelle.toLocaleString("fr-FR")} €</span>
                  </div>
                  <input type="range" min={0} max={2000} step={50} value={budgetMutuelle}
                    onChange={e => setBudgetMutuelle(Number(e.target.value))}
                    className="w-full accent-[#00C98A]" />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>0 €</span><span>2 000 €</span>
                  </div>
                </div>
              )}
            </div>

            {/* Budget total */}
            <div>
              <div className="flex justify-between mb-2">
                <label className={labelCls + " mb-0"}>Budget total du patient (RAC max accepté)</label>
                <span className="text-sm font-bold text-[#00C98A]">{budgetTotal.toLocaleString("fr-FR")} €</span>
              </div>
              <input type="range" min={0} max={5000} step={100} value={budgetTotal}
                onChange={e => setBudgetTotal(Number(e.target.value))}
                className="w-full accent-[#00C98A]" />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0 €</span><span>5 000 €</span>
              </div>
            </div>

            {/* SS info box */}
            <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "rgba(0,201,138,0.06)", border: "1px solid rgba(0,201,138,0.18)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#00C98A" strokeWidth="1.8" className="w-5 h-5 flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" /><path d="M12 8h.01M12 12v4" strokeLinecap="round" />
              </svg>
              <div className="text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-700">Remboursement Sécurité Sociale</div>
                <div>Base : <strong>1 700 €</strong> par appareil (soit 3 400 € binaural) — renouvellement tous les 4 ans pour les adultes.</div>
                <div>Classe 1 : RAC zéro obligatoire avec les organismes signataires du contrat 100% santé.</div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 4: Recommandations ─────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-slate-800">Recommandations personnalisées</h2>
            <p className="text-sm text-slate-500">
              Pour un patient {age} ans, mode de vie <strong>{modeVie.toLowerCase()}</strong>, perte <strong>{lossLevel}</strong>.
            </p>

            <div className="space-y-4">
              {top3.map((a, i) => {
                const prix = prixBinaural(a);
                const rac = racEstime(a);
                const rank = RANK_STYLES[i];
                return (
                  <div key={a.id} className="rounded-[var(--radius-large)] p-5 space-y-4" style={glass}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {/* Rank badge */}
                        <div
                          className="grid h-9 w-9 place-items-center rounded-xl text-white text-xs font-bold flex-shrink-0"
                          style={{ background: rank.bg, boxShadow: `0 2px 8px ${rank.shadow}` }}
                        >
                          {rank.label}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{a.marque} {a.modele}</div>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 mt-1 ${TIER_COLORS[a.tier]}`}>
                            {TIER_LABELS[a.tier]}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/clair-audition/pro/devis?from=calculateur&marque=${encodeURIComponent(a.marque)}&modele=${encodeURIComponent(a.modele)}&classe=${classe}&prix=${a.prixUnitaire}`)}
                        className="flex-shrink-0 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90"
                        style={{ background: "#00C98A", boxShadow: "0 2px 6px rgba(0,201,138,.3)" }}
                      >
                        Créer un devis →
                      </button>
                    </div>

                    {/* Technologies */}
                    <div className="flex flex-wrap gap-1.5">
                      {a.technos.map(t => (
                        <span key={t} className="rounded-full px-2.5 py-0.5 text-[11px] font-medium text-slate-600" style={glassSubtle}>
                          {TECHNO_LABELS[t] ?? t}
                        </span>
                      ))}
                    </div>

                    {/* Prix */}
                    <div className="rounded-xl p-3 space-y-1.5" style={glassSubtle}>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Prix binaural TTC</span>
                        <span className="font-semibold text-slate-700">{prix.toLocaleString("fr-FR")} €</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Remboursement SS</span>
                        <span className="font-semibold text-emerald-600">− {(SS_REMBOURSEMENT * 2).toLocaleString("fr-FR")} €</span>
                      </div>
                      {mutuelle && (
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Budget mutuelle</span>
                          <span className="font-semibold text-emerald-600">− {budgetMutuelle.toLocaleString("fr-FR")} €</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm border-t border-slate-200/60 pt-1.5 mt-1">
                        <span className="font-bold text-slate-700">RAC estimé</span>
                        <span className="font-bold text-lg" style={{ color: racColor(rac) }}>
                          {rac.toLocaleString("fr-FR")} €
                        </span>
                      </div>
                    </div>

                    {/* Pourquoi ce choix */}
                    {a.reasons.length > 0 && (
                      <div className="rounded-xl p-3" style={{ background: "rgba(0,201,138,0.04)", border: "1px solid rgba(0,201,138,0.12)" }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#00C98A] mb-2">Pourquoi ce choix ?</div>
                        <ul className="space-y-1">
                          {a.reasons.map((r, ri) => (
                            <li key={ri} className="flex items-start gap-2 text-xs text-slate-600">
                              <svg viewBox="0 0 24 24" fill="none" stroke="#00C98A" strokeWidth="2.5" className="w-3.5 h-3.5 flex-shrink-0 mt-0.5">
                                <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-2 border-t border-slate-200/60">
          <button
            onClick={() => setStep(s => (s > 1 ? (s - 1) as Step : s))}
            disabled={step === 1}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 transition-all hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            style={glassSubtle}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Précédent
          </button>

          {step < 4 ? (
            <button
              onClick={() => { if (canNext()) setStep(s => (s + 1) as Step); }}
              disabled={!canNext()}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "#00C98A", boxShadow: "0 2px 8px rgba(0,201,138,.3)" }}
            >
              Suivant
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:text-slate-800"
              style={glassSubtle}
            >
              Nouvelle simulation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
