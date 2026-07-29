"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  CATALOG, PROBLEMES_READAPTATION, MOCK_DOSSIERS_READAPTATION,
  TYPE_LABELS, REPLACEMENT_LABELS,
  calculerCorrectionCL, genererAlertes,
  determinerTypesRecommandes, filtrerLentilles,
  scorerLentille, getTop3,
  type Lens, type LensType, type Replacement,
  type EyeRx, type EyeResult, type Alerte,
  type PatientProfile, type Environment, type AdaptationType, type ScoreDetail,
} from "@/lib/lentilles";

/* ── Styles glass ───────────────────────────────────────────────────────── */
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

/* ── Types locaux ─────────────────────────────────────────────────────── */
type Step = 1 | 2 | 3 | 4;
type InputSource = "lunettes" | "lentilles" | "ark";
type AdaptType = "premiere" | "readaptation";

interface EyeInput { sph: string; cyl: string; axe: string; add: string; }
interface CLInput { powerOD: string; bcOD: string; diaOD: string; cylOD: string; axeOD: string; addOD: string; powerOG: string; bcOG: string; diaOG: string; cylOG: string; axeOG: string; addOG: string; }
interface ArkInput {
  // OD
  odK1D: string; odK1Axe: string; odK2D: string; odK2Axe: string; odSph: string; odCyl: string; odAxe: string;
  // OG
  ogK1D: string; ogK1Axe: string; ogK2D: string; ogK2Axe: string; ogSph: string; ogCyl: string; ogAxe: string;
}

const EMPTY_EYE: EyeInput = { sph: "", cyl: "", axe: "", add: "" };
const DEFAULT_PROFILE: PatientProfile = { adaptationType: "classique", environnements: [], secheresse: false, allergie: false, sport: false, portContinu: false, heuresPort: 8 };

function parseEye(e: EyeInput): EyeRx {
  return { sph: parseFloat(e.sph) || 0, cyl: parseFloat(e.cyl) || 0, axe: parseInt(e.axe) || 0, add: parseFloat(e.add) || 0 };
}

/* ── Icônes ─────────────────────────────────────────────────────────────── */
const IconCheck = ({ className = "w-4 h-4" }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>;
const IconAlert = ({ className = "w-4 h-4" }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4M12 17h.01"/></svg>;
const IconInfo = ({ className = "w-4 h-4" }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8h.01M12 12v4"/></svg>;
const IconArrow = ({ className = "w-4 h-4" }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>;

/* ── Champs Rx ──────────────────────────────────────────────────────────── */
function RxField({ label, value, onChange, placeholder = "0.00", step = "0.25" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; step?: string }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{label}</label>
      <input type="number" step={step} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]/30 focus:border-[#2D8CFF]/60 transition-all" />
    </div>
  );
}

function EyeRxGroup({ label, value, onChange, color }: { label: string; value: EyeInput; onChange: (v: EyeInput) => void; color: string }) {
  return (
    <div className="rounded-[var(--radius-large)] p-5" style={glassSubtle}>
      <div className={`text-xs font-bold uppercase tracking-widest mb-4 ${color}`}>{label}</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <RxField label="Sphère (D)" value={value.sph} placeholder="-3.00" onChange={v => onChange({ ...value, sph: v })} />
        <RxField label="Cylindre (D)" value={value.cyl} placeholder="-0.75" onChange={v => onChange({ ...value, cyl: v })} />
        <RxField label="Axe (°)" value={value.axe} placeholder="180" step="1" onChange={v => onChange({ ...value, axe: v })} />
        <RxField label="Addition (D)" value={value.add} placeholder="0.00" onChange={v => onChange({ ...value, add: v })} />
      </div>
    </div>
  );
}

/* ── Step bar ───────────────────────────────────────────────────────────── */
function StepBar({ step }: { step: Step }) {
  const steps = [{ n: 1, label: "Source & Rx" }, { n: 2, label: "Profil" }, { n: 3, label: "Lentilles" }, { n: 4, label: "Compte-rendu" }] as const;
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${step === s.n ? "text-white" : step > s.n ? "text-[#2D8CFF]" : "text-slate-500"}`}
            style={step === s.n ? { background: "#2D8CFF", boxShadow: "0 2px 8px rgba(45,140,255,.28)" } : glassSubtle}>
            <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${step > s.n ? "bg-[#2D8CFF] text-white" : step === s.n ? "bg-white/25 text-white" : "bg-slate-200 text-slate-500"}`}>
              {step > s.n ? <IconCheck className="w-3 h-3" /> : s.n}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </div>
          {i < steps.length - 1 && <div className={`h-px w-6 mx-1 ${step > s.n ? "bg-[#2D8CFF]" : "bg-slate-200"}`} />}
        </div>
      ))}
    </div>
  );
}

/* ── Alerte card ────────────────────────────────────────────────────────── */
function AlerteCard({ a }: { a: Alerte }) {
  const cfg = {
    critical: { bg: "bg-red-50 border-red-200", text: "text-red-700", icon: <IconAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" /> },
    warning:  { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: <IconAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /> },
    info:     { bg: "bg-blue-50 border-blue-200", text: "text-[#2D8CFF]", icon: <IconInfo className="w-4 h-4 text-[#2D8CFF] flex-shrink-0 mt-0.5" /> },
  }[a.niveau];
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border p-3 ${cfg.bg}`}>
      {cfg.icon}
      <p className={`text-xs leading-relaxed ${cfg.text}`}>{a.message}</p>
    </div>
  );
}

/* ── ResultCard ─────────────────────────────────────────────────────────── */
function ResultCard({ label, r, add, color }: { label: string; r: EyeResult; add: number; color: string }) {
  return (
    <div className="rounded-[var(--radius-large)] p-4" style={glass}>
      <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${color}`}>{label}</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { k: "Sphère CL", v: `${r.sphConverti >= 0 ? "+" : ""}${r.sphConverti.toFixed(2)} D` },
          { k: "Cylindre CL", v: r.needsTorique ? `${r.cylConverti.toFixed(2)} D` : "—" },
          { k: "Éq. sphérique", v: `${r.es >= 0 ? "+" : ""}${r.es.toFixed(2)} D` },
          { k: "Addition", v: add > 0 ? `+${add.toFixed(2)} D` : "—" },
        ].map(({ k, v }) => (
          <div key={k} className="rounded-xl p-3" style={glassSubtle}>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{k}</div>
            <div className="text-sm font-bold text-slate-800">{v}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {r.vertexApplique && <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">Vertex corrigé</span>}
        {r.cylIgnore && <span className="rounded-full bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-[11px] text-slate-600">Cyl ≤ 0.50 D (optionnel)</span>}
        {r.needsTorique && <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">Torique recommandée</span>}
        {r.needsMultifocal && <span className="rounded-full bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700">Multifocale recommandée</span>}
      </div>
    </div>
  );
}

/* ── LensCard ───────────────────────────────────────────────────────────── */
function LensCard({ lens, selected, onSelect }: { lens: Lens; selected: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect}
      className={`relative w-full rounded-[var(--radius-large)] p-4 text-left transition-all duration-200 group ${selected ? "ring-2 ring-[#2D8CFF] shadow-[0_0_0_4px_rgba(45,140,255,0.12)]" : "hover:shadow-md hover:ring-1 hover:ring-[#2D8CFF]/30"}`}
      style={glass}>
      {selected && <div className="absolute top-2 right-2 grid h-5 w-5 place-items-center rounded-full bg-[#2D8CFF] text-white"><IconCheck className="w-3 h-3" /></div>}
      {lens.tag && <span className="absolute top-2 left-2 rounded-full bg-gradient-to-r from-[#2D8CFF] to-[#1A72E8] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">{lens.tag}</span>}
      <div className="flex justify-center mb-3 mt-4">
        <div className="relative h-20 w-20">
          <Image src={`/images/lentilles/${lens.image}`} alt={lens.name} fill className="object-contain" onError={() => {}} sizes="80px" />
        </div>
      </div>
      <div className="text-xs font-bold text-slate-800 leading-tight group-hover:text-[#2D8CFF] transition-colors">{lens.name}</div>
      <div className="mt-0.5 text-[10px] text-slate-500">{lens.brand}</div>
      <div className="mt-2 flex flex-wrap gap-1">
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{REPLACEMENT_LABELS[lens.replacement]}</span>
        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${lens.siliconeHydrogel ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-600"}`}>{lens.siliconeHydrogel ? "SiHy" : "Hydrogel"}</span>
        {lens.ionic && <span className="rounded-md bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-600">Ionique</span>}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1 text-center">
        {[{ k: "Eau", v: lens.type === "rigide" ? "—" : `${lens.waterContent}%` }, { k: "Dk/t", v: lens.dkT }, { k: "RC", v: lens.baseCurves[0]?.toFixed(1) }].map(({ k, v }) => (
          <div key={k} className="rounded-lg bg-white/60 px-1 py-1.5">
            <div className="text-[9px] text-slate-500">{k}</div>
            <div className="text-[11px] font-bold text-slate-700">{v}</div>
          </div>
        ))}
      </div>
      {lens.note && <p className="mt-2 text-[10px] text-slate-500 italic leading-relaxed line-clamp-2">{lens.note}</p>}
    </button>
  );
}

/* ── Top3Card ───────────────────────────────────────────────────────────── */
function Top3Card({ detail, rank, onSelect }: { detail: ScoreDetail; rank: 1 | 2 | 3; onSelect: () => void }) {
  const medals = ["1er choix", "2e choix", "3e choix"];
  const borders = ["border-amber-400", "border-slate-300", "border-orange-400"];
  const badgeBg = ["bg-amber-50 text-amber-700 border-amber-200", "bg-slate-100 text-slate-600 border-slate-200", "bg-orange-50 text-orange-700 border-orange-200"];
  const { lens, raisons, alertes: scoreAlertes } = detail;
  return (
    <div className={`rounded-[var(--radius-large)] p-5 flex flex-col gap-3 border-2 ${borders[rank - 1]}`} style={glass}>
      <span className={`self-start rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badgeBg[rank - 1]}`}>{medals[rank - 1]}</span>
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 flex-shrink-0">
          <Image src={`/images/lentilles/${lens.image}`} alt={lens.name} fill className="object-contain" sizes="64px" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-800 leading-tight">{lens.name}</div>
          <div className="text-xs text-slate-500 mt-0.5">{lens.brand}</div>
          {lens.tag && <span className="mt-1 inline-block rounded-full bg-gradient-to-r from-[#2D8CFF] to-[#1A72E8] px-2 py-0.5 text-[10px] font-bold text-white">{lens.tag}</span>}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5 text-center">
        {[{ k: "Dk/t", v: String(lens.dkT) }, { k: "Eau", v: lens.type === "rigide" ? "—" : `${lens.waterContent}%` }, { k: "Type", v: lens.siliconeHydrogel ? "SiHy" : "Hydrogel" }, { k: "Port", v: REPLACEMENT_LABELS[lens.replacement].split(" ")[0] }].map(({ k, v }) => (
          <div key={k} className="rounded-lg bg-white/70 py-2">
            <div className="text-[9px] text-slate-500">{k}</div>
            <div className="text-[11px] font-bold text-slate-700">{v}</div>
          </div>
        ))}
      </div>
      {raisons.length > 0 && (
        <div className="space-y-1">
          {raisons.map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-green-700">
              <IconCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>{r}</span>
            </div>
          ))}
        </div>
      )}
      {scoreAlertes.length > 0 && (
        <div className="space-y-1">
          {scoreAlertes.map((a, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-orange-700">
              <IconAlert className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
              <span>{a}</span>
            </div>
          ))}
        </div>
      )}
      <button onClick={onSelect}
        className="mt-auto w-full rounded-xl py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
        style={{ background: "#2D8CFF", boxShadow: "0 2px 8px rgba(45,140,255,.28)" }}>
        Sélectionner
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
   ════════════════════════════════════════════════════════════════════ */
export default function LentillesCalculateur({
  prefillOdSph, prefillOdCyl, prefillOdAxe,
  prefillOgSph, prefillOgCyl, prefillOgAxe,
  prefillAdd, prefillDossier,
}: {
  prefillOdSph?: string; prefillOdCyl?: string; prefillOdAxe?: string;
  prefillOgSph?: string; prefillOgCyl?: string; prefillOgAxe?: string;
  prefillAdd?: string; prefillDossier?: string;
}) {
  const [step, setStep] = useState<Step>(1);
  const [inputSource, setInputSource] = useState<InputSource>("lunettes");
  const [adaptType, setAdaptType] = useState<AdaptType>("premiere");
  const [selectedDossierId, setSelectedDossierId] = useState(prefillDossier ?? "");
  const [od, setOd] = useState<EyeInput>({ sph: prefillOdSph ?? "", cyl: prefillOdCyl ?? "", axe: prefillOdAxe ?? "", add: prefillAdd ?? "" });
  const [og, setOg] = useState<EyeInput>({ sph: prefillOgSph ?? "", cyl: prefillOgCyl ?? "", axe: prefillOgAxe ?? "", add: prefillAdd ?? "" });
  const [arkInput, setArkInput] = useState<ArkInput>({ odK1D: "", odK1Axe: "", odK2D: "", odK2Axe: "", odSph: "", odCyl: "", odAxe: "", ogK1D: "", ogK1Axe: "", ogK2D: "", ogK2Axe: "", ogSph: "", ogCyl: "", ogAxe: "" });
  const [clInput, setClInput] = useState<CLInput>({ powerOD: "", bcOD: "", diaOD: "", cylOD: "", axeOD: "", addOD: "", powerOG: "", bcOG: "", diaOG: "", cylOG: "", axeOG: "", addOG: "" });
  const [profile, setProfile] = useState<PatientProfile>(DEFAULT_PROFILE);
  const [selectedLens, setSelectedLens] = useState<Lens | null>(null);
  const [params, setParams] = useState({ bcOD: "", bcOG: "", diaOD: "", diaOG: "", puissOD: "", puissOG: "", notes: "" });
  const [filterType, setFilterType] = useState<LensType | "all">("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterReplace, setFilterReplace] = useState<Replacement | "all">("all");
  const [showFullCatalog, setShowFullCatalog] = useState(false);
  const [searchDossier, setSearchDossier] = useState("");

  // Calculs dérivés (lunettes mode)
  const odRx = parseEye(od);
  const ogRx = parseEye(og);
  const odResult = calculerCorrectionCL(odRx);
  const ogResult = calculerCorrectionCL(ogRx);
  const alertes = genererAlertes(odRx, ogRx);
  const typesRecommandes = determinerTypesRecommandes(odResult, ogResult);

  const lentillesCompatibles = filtrerLentilles({ odResult, ogResult, types: typesRecommandes });
  const lentillesFiltrees = lentillesCompatibles.filter(l => {
    if (filterType !== "all" && l.type !== filterType) return false;
    if (filterBrand !== "all" && l.brand !== filterBrand) return false;
    if (filterReplace !== "all" && l.replacement !== filterReplace) return false;
    return true;
  });
  const brands = Array.from(new Set(lentillesCompatibles.map(l => l.brand))).sort();

  // Top 3
  const top3 = profile.adaptationType === "personnalisee"
    ? getTop3(lentillesCompatibles, profile)
    : lentillesCompatibles.slice(0, 3).map(lens => ({ lens, score: 0, raisons: [], alertes: [] } as ScoreDetail));

  // ARK BC calculations (OD and OG)
  const arkBCOD = arkInput.odK1D ? ((337.5 / parseFloat(arkInput.odK1D)) + 0.10).toFixed(2) : null;
  const arkBCOG = arkInput.ogK1D ? ((337.5 / parseFloat(arkInput.ogK1D)) + 0.10).toFixed(2) : null;

  useEffect(() => {
    if (inputSource !== "ark") return;
    setOd(p => ({ ...p, sph: arkInput.odSph, cyl: arkInput.odCyl, axe: arkInput.odAxe }));
    setOg(p => ({ ...p, sph: arkInput.ogSph, cyl: arkInput.ogCyl, axe: arkInput.ogAxe }));
  }, [arkInput, inputSource]);

  useEffect(() => {
    if (!selectedLens) return;
    setParams(p => ({
      ...p,
      bcOD: selectedLens.baseCurves[0]?.toFixed(2) ?? "",
      bcOG: selectedLens.baseCurves[0]?.toFixed(2) ?? "",
      diaOD: selectedLens.diameters[0]?.toFixed(1) ?? "",
      diaOG: selectedLens.diameters[0]?.toFixed(1) ?? "",
      puissOD: odResult.sphConverti !== 0 ? `${odResult.sphConverti >= 0 ? "+" : ""}${odResult.sphConverti.toFixed(2)}` : "",
      puissOG: ogResult.sphConverti !== 0 ? `${ogResult.sphConverti >= 0 ? "+" : ""}${ogResult.sphConverti.toFixed(2)}` : "",
    }));
  }, [selectedLens]);

  const canGoNext = () => {
    if (step === 1) return od.sph !== "" || og.sph !== "" || clInput.powerOD !== "" || arkInput.odSph !== "" || arkInput.ogSph !== "";
    if (step === 2) return true;
    if (step === 3) return selectedLens !== null;
    return true;
  };

  const handleSelectLens = (lens: Lens) => {
    setSelectedLens(lens);
    setStep(4);
  };

  /* ── ENV LABELS ── */
  const ENV_META: Record<Environment, { label: string; note: string; icon: string; color: string }> = {
    bureau_clim:  { label: "Bureau climatisé", note: "Risque de sécheresse lacrymo-oculaire, contrôler Dk/t et teneur en eau", icon: "", color: "border-l-blue-400" },
    chantier:     { label: "Chantier / Poussière", note: "Attention aux lentilles ioniques (attirent les particules). Préférer non-ionique + journalières", icon: "", color: "border-l-orange-400" },
    exterieur:    { label: "Extérieur / Nature", note: "UV, vent, poussières — journalières recommandées", icon: "", color: "border-l-green-400" },
    domicile:     { label: "Domicile / Sédentaire", note: "Confort prioritaire", icon: "", color: "border-l-slate-400" },
    salle_blanche:{ label: "Salle blanche / Labo", note: "Lentilles non-ioniques strictement. Journalières obligatoires", icon: "", color: "border-l-purple-400" },
    autre:        { label: "Autre", note: "Environnement mixte", icon: "⋯", color: "border-l-slate-300" },
  };

  /* ── STEP 1 ─────────────────────────────────────────────────────────── */
  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Source selector */}
      <div>
        <div className="text-sm font-semibold text-slate-800 mb-3">Source de l'ordonnance</div>
        <div className="grid sm:grid-cols-3 gap-3">
          {([
            { id: "lunettes" as InputSource, label: "Rx Lunettes", desc: "Ordonnance de lunettes — conversion vertex automatique", icon: (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 10c0-2.2 1.8-4 4-4h1a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4v-2Z"/><path d="M11 12h2"/><path d="M13 10c0-2.2 1.8-4 4-4h1a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4h-1a4 4 0 0 1-4-4v-2Z"/></svg>
            )},
            { id: "lentilles" as InputSource, label: "Rx Lentilles", desc: "Ordonnance en lentilles de contact — puissance déjà convertie", icon: (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>
            )},
            { id: "ark" as InputSource, label: "ARK", desc: "Auto-réfractomètre kératomètrique — rayon de base calculé automatiquement", icon: (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M12 8v8"/></svg>
            )},
          ]).map(({ id, label, desc, icon }) => (
            <button key={id} onClick={() => setInputSource(id)}
              className={`rounded-[var(--radius-large)] p-4 text-left transition-all ${inputSource === id ? "ring-2 ring-[#2D8CFF]" : "hover:ring-1 hover:ring-[#2D8CFF]/40"}`}
              style={glass}>
              <div className={`grid h-10 w-10 place-items-center rounded-xl mb-3 ${inputSource === id ? "bg-[#2D8CFF] text-white" : "bg-blue-50 text-[#2D8CFF]"}`}>{icon}</div>
              <div className="text-sm font-semibold text-slate-800">{label}</div>
              <div className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Adaptation type */}
      <div className="flex gap-3">
        {(["premiere", "readaptation"] as AdaptType[]).map(t => (
          <button key={t} onClick={() => setAdaptType(t)}
            className={`flex-1 rounded-[var(--radius-large)] px-4 py-3 text-sm font-semibold transition-all ${adaptType === t ? "text-white" : "text-slate-600"}`}
            style={adaptType === t ? { background: "#2D8CFF", boxShadow: "0 2px 8px rgba(45,140,255,.25)" } : glassSubtle}>
            {t === "premiere" ? "Première adaptation" : "Réadaptation"}
          </button>
        ))}
      </div>

      {/* Réadaptation dossiers */}
      {adaptType === "readaptation" && (
        <div className="rounded-[var(--radius-large)] p-5" style={glass}>
          <div className="text-sm font-semibold text-slate-800 mb-3">Sélectionner un dossier patient</div>
          <input
            type="text"
            placeholder="Rechercher un patient (nom, prénom)…"
            value={searchDossier}
            onChange={e => setSearchDossier(e.target.value)}
            className="w-full rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]/30 focus:border-[#2D8CFF]/60 transition-all mb-3"
          />
          {(() => {
            const filtered = searchDossier.trim() === ""
              ? MOCK_DOSSIERS_READAPTATION
              : MOCK_DOSSIERS_READAPTATION.filter(d => d.patientName.toLowerCase().includes(searchDossier.toLowerCase()));
            if (filtered.length === 0) {
              return <div className="text-sm text-slate-500 text-center py-4">Aucun dossier trouvé</div>;
            }
            return (
              <div className="grid sm:grid-cols-3 gap-3">
                {filtered.map(d => {
                  const lastEssai = d.essais[d.essais.length - 1];
                  const sel = selectedDossierId === d.dossierId;
                  return (
                    <button key={d.dossierId}
                      onClick={() => {
                        setSelectedDossierId(sel ? "" : d.dossierId);
                        if (!sel) {
                          setOd({ sph: String(d.odRx.sph), cyl: String(d.odRx.cyl), axe: String(d.odRx.axe), add: String(d.odRx.add) });
                          setOg({ sph: String(d.ogRx.sph), cyl: String(d.ogRx.cyl), axe: String(d.ogRx.axe), add: String(d.ogRx.add) });
                        }
                      }}
                      className={`rounded-xl p-3.5 text-left transition-all ${sel ? "ring-2 ring-[#2D8CFF] bg-blue-50" : "hover:ring-1 hover:ring-[#2D8CFF]/30"}`}
                      style={sel ? {} : glassSubtle}>
                      <div className="text-sm font-bold text-slate-800">{d.patientName}</div>
                      <div className="text-[11px] text-slate-500 mt-1">{lastEssai.lentille}</div>
                      <div className="text-[11px] text-slate-500">{lastEssai.date}</div>
                      {lastEssai.problemes.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {lastEssai.problemes.map(pid => {
                            const pb = PROBLEMES_READAPTATION.find(p => p.id === pid);
                            return pb ? <span key={pid} className="rounded-full bg-orange-50 border border-orange-200 px-1.5 py-0.5 text-[10px] text-orange-700">{pb.label}</span> : null;
                          })}
                        </div>
                      )}
                      {sel && <div className="mt-2 text-[11px] text-[#2D8CFF] font-semibold">Rx importée</div>}
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Rx selon source */}
      <div className="rounded-[var(--radius-large)] p-5" style={glass}>
        <div className="text-sm font-semibold text-slate-800 mb-4">
          {inputSource === "lunettes" && "Ordonnance lunettes"}
          {inputSource === "lentilles" && "Ordonnance lentilles"}
          {inputSource === "ark" && "Données ARK"}
        </div>

        {inputSource === "lunettes" && (
          <div className="space-y-3">
            <EyeRxGroup label="Œil droit (OD)" value={od} onChange={setOd} color="text-[#2D8CFF]" />
            <EyeRxGroup label="Œil gauche (OG)" value={og} onChange={setOg} color="text-[#00C98A]" />
          </div>
        )}

        {inputSource === "lentilles" && (
          <div className="space-y-3">
            {(["OD", "OG"] as const).map(side => {
              const color = side === "OD" ? "text-[#2D8CFF]" : "text-[#00C98A]";
              const prefix = side.toLowerCase() as "oD" | "oG";
              const pw = side === "OD" ? clInput.powerOD : clInput.powerOG;
              const bc = side === "OD" ? clInput.bcOD : clInput.bcOG;
              const dia = side === "OD" ? clInput.diaOD : clInput.diaOG;
              const cy = side === "OD" ? clInput.cylOD : clInput.cylOG;
              const ax = side === "OD" ? clInput.axeOD : clInput.axeOG;
              const ad = side === "OD" ? clInput.addOD : clInput.addOG;
              const setPow = (v: string) => setClInput(p => ({ ...p, [`power${side}`]: v }));
              const setBc = (v: string) => setClInput(p => ({ ...p, [`bc${side}`]: v }));
              const setDia = (v: string) => setClInput(p => ({ ...p, [`dia${side}`]: v }));
              const setCyl = (v: string) => setClInput(p => ({ ...p, [`cyl${side}`]: v }));
              const setAxe = (v: string) => setClInput(p => ({ ...p, [`axe${side}`]: v }));
              const setAdd = (v: string) => setClInput(p => ({ ...p, [`add${side}`]: v }));
              return (
                <div key={side} className="rounded-[var(--radius-large)] p-4" style={glassSubtle}>
                  <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${color}`}>Œil {side === "OD" ? "droit" : "gauche"} ({side})</div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <RxField label="Puissance (D)" value={pw} onChange={setPow} />
                    <RxField label="Rayon (BC mm)" value={bc} onChange={setBc} placeholder="8.60" />
                    <RxField label="Diamètre (mm)" value={dia} onChange={setDia} placeholder="14.2" />
                    <RxField label="Cylindre (D)" value={cy} onChange={setCyl} placeholder="-0.75" />
                    <RxField label="Axe (°)" value={ax} onChange={setAxe} placeholder="180" step="1" />
                    <RxField label="Addition (D)" value={ad} onChange={setAdd} placeholder="0.00" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {inputSource === "ark" && (
          <div className="grid sm:grid-cols-2 gap-4">
            {([
              { side: "OD", label: "Œil droit (OD)", color: "text-[#2D8CFF]", k1D: "odK1D", k1Axe: "odK1Axe", k2D: "odK2D", k2Axe: "odK2Axe", sph: "odSph", cyl: "odCyl", axe: "odAxe", arkBC: arkBCOD },
              { side: "OG", label: "Œil gauche (OG)", color: "text-[#00C98A]", k1D: "ogK1D", k1Axe: "ogK1Axe", k2D: "ogK2D", k2Axe: "ogK2Axe", sph: "ogSph", cyl: "ogCyl", axe: "ogAxe", arkBC: arkBCOG },
            ] as const).map(({ side, label, color, k1D, k1Axe, k2D, k2Axe, sph, cyl, axe, arkBC }) => (
              <div key={side} className="space-y-3">
                <div className="rounded-[var(--radius-large)] p-4" style={glassSubtle}>
                  <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${color}`}>{label} — Kératométrie</div>
                  <div className="grid grid-cols-2 gap-3">
                    <RxField label="K1 (D)" value={arkInput[k1D]} onChange={v => setArkInput(p => ({ ...p, [k1D]: v }))} placeholder="43.50" />
                    <RxField label="K1 axe (°)" value={arkInput[k1Axe]} onChange={v => setArkInput(p => ({ ...p, [k1Axe]: v }))} placeholder="180" step="1" />
                    <RxField label="K2 (D)" value={arkInput[k2D]} onChange={v => setArkInput(p => ({ ...p, [k2D]: v }))} placeholder="44.25" />
                    <RxField label="K2 axe (°)" value={arkInput[k2Axe]} onChange={v => setArkInput(p => ({ ...p, [k2Axe]: v }))} placeholder="90" step="1" />
                  </div>
                  {arkBC && (
                    <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 flex items-center gap-2">
                      <IconInfo className="w-4 h-4 text-[#2D8CFF] flex-shrink-0" />
                      <div>
                        <span className="text-xs font-semibold text-slate-700">RC calculé : </span>
                        <span className="text-sm font-bold text-[#2D8CFF]">{arkBC} mm</span>
                        <span className="text-xs text-slate-500 ml-1">(337.5/K1 + 0.10)</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="rounded-[var(--radius-large)] p-4" style={glassSubtle}>
                  <div className="text-xs font-bold uppercase tracking-widest mb-3 text-slate-600">{label} — Réfraction objective</div>
                  <div className="grid grid-cols-3 gap-3">
                    <RxField label="Sph (D)" value={arkInput[sph]} onChange={v => setArkInput(p => ({ ...p, [sph]: v }))} />
                    <RxField label="Cyl (D)" value={arkInput[cyl]} onChange={v => setArkInput(p => ({ ...p, [cyl]: v }))} />
                    <RxField label="Axe (°)" value={arkInput[axe]} onChange={v => setArkInput(p => ({ ...p, [axe]: v }))} step="1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  /* ── STEP 2 ─────────────────────────────────────────────────────────── */
  const renderStep2 = () => (
    <div className="space-y-5">
      {/* Adaptation type toggle */}
      <div className="rounded-[var(--radius-large)] p-5" style={glass}>
        <div className="text-sm font-semibold text-slate-800 mb-3">Type d'adaptation</div>
        <div className="flex gap-3">
          {([{ v: "classique" as AdaptationType, l: "Adaptation classique" }, { v: "personnalisee" as AdaptationType, l: "Adaptation personnalisée" }]).map(({ v, l }) => (
            <button key={v} onClick={() => setProfile(p => ({ ...p, adaptationType: v }))}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${profile.adaptationType === v ? "text-white" : "text-slate-600"}`}
              style={profile.adaptationType === v ? { background: "#2D8CFF", boxShadow: "0 2px 8px rgba(45,140,255,.25)" } : glassSubtle}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {profile.adaptationType === "classique" ? (
        <div className="rounded-[var(--radius-large)] p-5" style={glass}>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#2D8CFF] text-lg">✓</div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Recommandation standard</div>
              <div className="text-xs text-slate-500 mt-0.5">Basée sur la correction prescrite — les 3 meilleures lentilles compatibles seront proposées</div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Environnements */}
          <div className="rounded-[var(--radius-large)] p-5" style={glass}>
            <div className="text-sm font-semibold text-slate-800 mb-1">Environnement de travail</div>
            <p className="text-xs text-slate-500 mb-4">Sélectionner tous les environnements applicables</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {(Object.entries(ENV_META) as [Environment, typeof ENV_META[Environment]][]).map(([env, meta]) => {
                const active = profile.environnements.includes(env);
                return (
                  <button key={env}
                    onClick={() => setProfile(p => ({ ...p, environnements: active ? p.environnements.filter(e => e !== env) : [...p.environnements, env] }))}
                    className={`flex items-start gap-3 rounded-xl p-3.5 text-left border-l-4 transition-all ${meta.color} ${active ? "ring-2 ring-[#2D8CFF] bg-blue-50" : "hover:ring-1 hover:ring-[#2D8CFF]/30"}`}
                    style={active ? {} : glassSubtle}>
                    <span className="text-xl flex-shrink-0">{meta.icon}</span>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{meta.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{meta.note}</div>
                    </div>
                    {active && <IconCheck className="w-4 h-4 text-[#2D8CFF] ml-auto flex-shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Profil toggles */}
          <div className="rounded-[var(--radius-large)] p-5" style={glass}>
            <div className="text-sm font-semibold text-slate-800 mb-4">Profil du patient</div>
            <div className="grid sm:grid-cols-2 gap-3">
              {([
                { key: "secheresse" as keyof PatientProfile, label: "Sécheresse oculaire connue" },
                { key: "allergie" as keyof PatientProfile, label: "Allergie (pollen, poussière...)" },
                { key: "sport" as keyof PatientProfile, label: "Activité sportive régulière" },
                { key: "portContinu" as keyof PatientProfile, label: "Port continu souhaité (nuit incluse)" },
              ] as { key: "secheresse" | "allergie" | "sport" | "portContinu"; label: string }[]).map(({ key, label }) => {
                const val = profile[key] as boolean;
                return (
                  <div key={key} className="flex items-center justify-between rounded-xl px-4 py-3" style={glassSubtle}>
                    <span className="text-sm text-slate-700">{label}</span>
                    <div className="flex gap-1">
                      {[{ v: true, l: "Oui" }, { v: false, l: "Non" }].map(({ v, l }) => (
                        <button key={String(v)} onClick={() => setProfile(p => ({ ...p, [key]: v }))}
                          className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${val === v ? "text-white" : "text-slate-500"}`}
                          style={val === v ? { background: "#2D8CFF" } : glassSubtle}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Hours */}
            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Heures de port par jour</div>
              <div className="flex gap-2">
                {[{ v: 6, l: "< 8h" }, { v: 10, l: "8–12h" }, { v: 14, l: "> 12h" }].map(({ v, l }) => (
                  <button key={v} onClick={() => setProfile(p => ({ ...p, heuresPort: v }))}
                    className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all ${profile.heuresPort === v ? "text-white" : "text-slate-600"}`}
                    style={profile.heuresPort === v ? { background: "#2D8CFF" } : glassSubtle}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Calcul Rx summary */}
      {inputSource === "lunettes" && (
        <div className="rounded-[var(--radius-large)] p-5" style={glass}>
          <div className="text-sm font-semibold text-slate-800 mb-4">Correction calculée pour les lentilles</div>
          <div className="space-y-3">
            <ResultCard label="Œil droit (OD)" r={odResult} add={odRx.add} color="text-[#2D8CFF]" />
            <ResultCard label="Œil gauche (OG)" r={ogResult} add={ogRx.add} color="text-[#00C98A]" />
          </div>
        </div>
      )}

      {alertes.length > 0 && (
        <div className="rounded-[var(--radius-large)] p-5" style={glass}>
          <div className="text-sm font-semibold text-slate-800 mb-3">Points d'attention cliniques</div>
          <div className="space-y-2">{alertes.map((a, i) => <AlerteCard key={i} a={a} />)}</div>
        </div>
      )}
    </div>
  );

  /* ── STEP 3 ─────────────────────────────────────────────────────────── */
  const renderStep3 = () => {
    const profileSummary = [
      ...profile.environnements.map(e => ENV_META[e].label),
      profile.secheresse && "Sécheresse",
      profile.allergie && "Allergie",
      profile.sport && "Sport",
    ].filter(Boolean).join(" · ");

    const needsToric = odResult.needsTorique || ogResult.needsTorique;

    return (
      <div className="space-y-6">
        {/* LARS rule banner when toric is needed */}
        {needsToric && (
          <div className="flex items-start gap-3 rounded-[var(--radius-large)] border border-amber-200 bg-amber-50/80 px-4 py-3">
            <span className="text-base mt-0.5"></span>
            <div>
              <div className="text-xs font-bold text-amber-800 mb-0.5">Règle LARS — Ajustement de l&apos;axe torique</div>
              <div className="text-[11px] text-amber-700 leading-relaxed">
                Si la lentille tourne lors du clignement :<br/>
                <b>L</b>eft (<span className="font-semibold">G</span>auche / sens trigonométrique) → <b>A</b>dd (ajouter l&apos;angle dévié)<br/>
                <b>R</b>ight (<span className="font-semibold">D</span>roite) → <b>S</b>ubtract (soustraire l&apos;angle dévié)
              </div>
            </div>
          </div>
        )}

        {/* TOP 3 */}
        {top3.length > 0 && (
          <div>
            <div className="mb-4">
              <div className="text-base font-bold text-slate-800">Top 3 recommandations</div>
              {profileSummary && <div className="text-xs text-slate-500 mt-0.5">{profileSummary}</div>}
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {top3.map((detail, i) => (
                <Top3Card key={detail.lens.id} detail={detail} rank={(i + 1) as 1 | 2 | 3} onSelect={() => handleSelectLens(detail.lens)} />
              ))}
            </div>
          </div>
        )}

        {/* Toggle full catalog */}
        <div className="text-center">
          <button onClick={() => setShowFullCatalog(v => !v)}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all"
            style={glassSubtle}>
            {showFullCatalog ? "Masquer le catalogue" : "Voir tout le catalogue"} <IconArrow className={`w-4 h-4 transition-transform ${showFullCatalog ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showFullCatalog && (
          <div className="space-y-4">
            <div className="rounded-[var(--radius-large)] p-4" style={glass}>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { label: "Type", val: filterType, set: (v: string) => setFilterType(v as LensType | "all"), opts: [{ v: "all", l: "Tous les types" }, ...(Object.keys(TYPE_LABELS) as LensType[]).map(t => ({ v: t, l: TYPE_LABELS[t] }))] },
                  { label: "Marque", val: filterBrand, set: setFilterBrand, opts: [{ v: "all", l: "Toutes marques" }, ...brands.map(b => ({ v: b, l: b }))] },
                  { label: "Renouvellement", val: filterReplace, set: (v: string) => setFilterReplace(v as Replacement | "all"), opts: [{ v: "all", l: "Tous" }, ...(Object.keys(REPLACEMENT_LABELS) as Replacement[]).map(r => ({ v: r, l: REPLACEMENT_LABELS[r] }))] },
                ].map(({ label, val, set, opts }) => (
                  <div key={label}>
                    <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{label}</label>
                    <select value={val} onChange={e => set(e.target.value)} className="w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]/30">
                      {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-slate-500">{lentillesFiltrees.length} lentille(s) affichée(s){selectedLens && <span className="ml-3 font-semibold text-[#2D8CFF]">✓ Sélection : {selectedLens.name}</span>}</div>
            </div>

            {lentillesFiltrees.length === 0 ? (
              <div className="rounded-[var(--radius-large)] p-8 text-center" style={glass}>
                <div className="text-sm text-slate-500">Aucune lentille ne correspond aux filtres sélectionnés.</div>
                <button onClick={() => { setFilterType("all"); setFilterBrand("all"); setFilterReplace("all"); }} className="mt-3 text-xs font-medium text-[#2D8CFF] hover:underline">Réinitialiser les filtres</button>
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {lentillesFiltrees.map(lens => (
                  <LensCard key={lens.id} lens={lens} selected={selectedLens?.id === lens.id} onSelect={() => handleSelectLens(lens)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /* ── STEP 4 ─────────────────────────────────────────────────────────── */
  const renderStep4 = () => {
    if (!selectedLens) return null;
    const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const dossier = MOCK_DOSSIERS_READAPTATION.find(d => d.dossierId === selectedDossierId);

    const profileSummary = profile.adaptationType === "personnalisee" ? [
      ...profile.environnements.map(e => ENV_META[e].label),
      profile.secheresse && "Sécheresse oculaire",
      profile.allergie && "Allergie",
      profile.sport && "Activité sportive",
      profile.portContinu && "Port continu",
    ].filter(Boolean).join(", ") : "";

    const sourceLabel = inputSource === "lunettes" ? "Rx lunettes (vertex corrigé)" : inputSource === "lentilles" ? "Rx lentilles directe" : `ARK (RC OD : ${arkBCOD ?? "—"} mm / OG : ${arkBCOG ?? "—"} mm)`;

    return (
      <div className="space-y-5">
        {/* Historique réadaptation */}
        {dossier && dossier.essais.length > 0 && (
          <div className="rounded-[var(--radius-large)] p-5" style={glass}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base"></span>
              <div className="text-sm font-semibold text-slate-800">Historique d'adaptation — {dossier.patientName}</div>
            </div>
            {dossier.essais.map((essai, i) => (
              <div key={i} className="rounded-xl p-4 border border-orange-200 bg-orange-50/60 mb-3 last:mb-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-sm font-bold text-slate-800">{essai.lentille}</div>
                    <div className="text-xs text-slate-500">{essai.brand} — {essai.date}</div>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 mb-2">
                  <div className="text-xs text-slate-600"><span className="font-semibold">OD :</span> {essai.odPuissance} — BC {essai.bcOD}</div>
                  <div className="text-xs text-slate-600"><span className="font-semibold">OG :</span> {essai.ogPuissance} — BC {essai.bcOG}</div>
                </div>
                {essai.problemes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {essai.problemes.map(pid => {
                      const pb = PROBLEMES_READAPTATION.find(p => p.id === pid);
                      return pb ? <span key={pid} className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-semibold text-red-700">{pb.label}</span> : null;
                    })}
                  </div>
                )}
                {essai.notes && <div className="text-xs text-slate-700 italic">{essai.notes}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Paramètres */}
        <div className="rounded-[var(--radius-large)] p-5" style={glass}>
          <div className="text-sm font-semibold text-slate-800 mb-4">Paramètres d'adaptation</div>
          <div className="grid sm:grid-cols-2 gap-5">
            {["OD", "OG"].map(side => {
              const result = side === "OD" ? odResult : ogResult;
              const add = side === "OD" ? odRx.add : ogRx.add;
              const color = side === "OD" ? "text-[#2D8CFF]" : "text-[#00C98A]";
              return (
                <div key={side} className="rounded-xl p-4 space-y-3" style={glassSubtle}>
                  <div className={`text-xs font-bold uppercase tracking-widest ${color}`}>Œil {side === "OD" ? "droit" : "gauche"} ({side})</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Rayon de courbure (BC)</label>
                      <select value={params[`bc${side}` as "bcOD" | "bcOG"]} onChange={e => setParams(p => ({ ...p, [`bc${side}`]: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200/80 bg-white/80 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]/30">
                        {selectedLens.baseCurves.map(bc => <option key={bc} value={bc.toFixed(2)}>{bc.toFixed(2)} mm</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Diamètre (Ø)</label>
                      <select value={params[`dia${side}` as "diaOD" | "diaOG"]} onChange={e => setParams(p => ({ ...p, [`dia${side}`]: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200/80 bg-white/80 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]/30">
                        {selectedLens.diameters.map(d => <option key={d} value={d.toFixed(1)}>{d.toFixed(1)} mm</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Puissance (D)</label>
                      <input value={params[`puiss${side}` as "puissOD" | "puissOG"]} onChange={e => setParams(p => ({ ...p, [`puiss${side}`]: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200/80 bg-white/80 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]/30" />
                    </div>
                    {result.needsTorique && (
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Cyl / Axe</label>
                        <div className="text-xs font-semibold text-amber-700 bg-amber-50 rounded-lg px-2 py-1.5">{result.cylConverti.toFixed(2)} D / {side === "OD" ? odRx.axe : ogRx.axe}°</div>
                        <div className="mt-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2 py-1.5">
                          <div className="text-[10px] font-bold text-amber-800 mb-0.5">Règle LARS</div>
                          <div className="text-[10px] text-amber-700 leading-relaxed">
                            Si la lentille tourne :<br/>
                            <b>G</b>auche (sens trigo) → ajouter l'angle · <b>D</b>roite → soustraire l'angle
                          </div>
                        </div>
                      </div>
                    )}
                    {add > 0 && (
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Addition</label>
                        <div className="text-xs font-semibold text-purple-700 bg-purple-50 rounded-lg px-2 py-1.5">+{add.toFixed(2)} D</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes praticien */}
        <div className="rounded-[var(--radius-large)] p-5" style={glass}>
          <label className="block text-sm font-semibold text-slate-800 mb-2">Notes praticien</label>
          <textarea value={params.notes} onChange={e => setParams(p => ({ ...p, notes: e.target.value }))} rows={3}
            placeholder="Instructions de port, conseils hygiène, contrôle à prévoir..."
            className="w-full rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]/30 transition-all resize-none" />
        </div>

        {/* Compte-rendu */}
        <div className="rounded-[var(--radius-large)] overflow-hidden" style={glass}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60">
            <div className="text-sm font-semibold text-slate-800">Compte-rendu d'adaptation</div>
            <span className="text-xs text-slate-500">{today}</span>
          </div>
          <div className="p-5 font-mono text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-white/40">
{`COMPTE-RENDU D'ADAPTATION EN LENTILLES DE CONTACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Date   : ${today}
Source : ${sourceLabel}
Type   : ${adaptType === "premiere" ? "Première adaptation" : "Réadaptation"}${dossier ? `\nPatient : ${dossier.patientName}` : ""}
${dossier?.essais[0] ? `Lentille précédente : ${dossier.essais[0].lentille}` : ""}
${profileSummary ? `Profil : ${profileSummary}` : ""}
ORDONNANCE
  OD : Sph ${od.sph || "—"}  Cyl ${od.cyl || "—"}  Axe ${od.axe || "—"}°  Add ${od.add || "—"}
  OG : Sph ${og.sph || "—"}  Cyl ${og.cyl || "—"}  Axe ${og.axe || "—"}°  Add ${og.add || "—"}

CORRECTION EN LENTILLES${inputSource === "lunettes" ? " (après calcul vertex)" : ""}
  OD : Sph ${odResult.sphConverti >= 0 ? "+" : ""}${odResult.sphConverti.toFixed(2)}  ${odResult.needsTorique ? `Cyl ${odResult.cylConverti.toFixed(2)}  Axe ${odRx.axe}°` : "—"}  ${odRx.add > 0 ? `Add +${odRx.add.toFixed(2)}` : ""}
  OG : Sph ${ogResult.sphConverti >= 0 ? "+" : ""}${ogResult.sphConverti.toFixed(2)}  ${ogResult.needsTorique ? `Cyl ${ogResult.cylConverti.toFixed(2)}  Axe ${ogRx.axe}°` : "—"}  ${ogRx.add > 0 ? `Add +${ogRx.add.toFixed(2)}` : ""}

LENTILLE SÉLECTIONNÉE
  ${selectedLens.name} — ${selectedLens.brand}
  Type           : ${TYPE_LABELS[selectedLens.type]}
  Renouvellement : ${REPLACEMENT_LABELS[selectedLens.replacement]}
  Matériau       : ${selectedLens.material}
  ${selectedLens.siliconeHydrogel ? "Silicone-hydrogel" : "Hydrogel"} — Eau ${selectedLens.waterContent}%  Dk/t ${selectedLens.dkT}  Ionique : ${selectedLens.ionic ? "Oui" : "Non"}

PARAMÈTRES FINAUX
  OD : BC ${params.bcOD} mm  Ø ${params.diaOD} mm  Puiss ${params.puissOD || odResult.sphConverti.toFixed(2)}
  OG : BC ${params.bcOG} mm  Ø ${params.diaOG} mm  Puiss ${params.puissOG || ogResult.sphConverti.toFixed(2)}${params.notes ? `\n\nNOTES\n  ${params.notes}` : ""}`}
          </div>
          <div className="px-5 pb-5 flex gap-2">
            <button onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "#2D8CFF", boxShadow: "0 2px 8px rgba(45,140,255,.28)" }}>
              Imprimer / PDF
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all" style={glassSubtle}
              onClick={() => { setStep(1); setOd(EMPTY_EYE); setOg(EMPTY_EYE); setSelectedLens(null); setProfile(DEFAULT_PROFILE); setParams({ bcOD: "", bcOG: "", diaOD: "", diaOG: "", puissOD: "", puissOG: "", notes: "" }); }}>
              Nouvelle adaptation
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ── Rendu principal ── */
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800 h-title">Calculateur de lentilles</h1>
          <p className="mt-1 text-sm text-slate-500">Conversion Rx · Profil patient · Scoring · Sélection lentille</p>
        </div>
        <StepBar step={step} />
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

      <div className="flex items-center justify-between">
        <button onClick={() => setStep(s => Math.max(1, s - 1) as Step)} disabled={step === 1}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-30"
          style={glassSubtle}>
          ← Précédent
        </button>
        {step < 4 && (
          <button onClick={() => setStep(s => Math.min(4, s + 1) as Step)} disabled={!canGoNext()}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: "#2D8CFF", boxShadow: "0 2px 8px rgba(45,140,255,.28)" }}>
            Suivant <IconArrow />
          </button>
        )}
      </div>
    </div>
  );
}
