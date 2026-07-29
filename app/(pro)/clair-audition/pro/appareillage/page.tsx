"use client";

import React, { useState, useEffect, useCallback, type CSSProperties } from "react";
import DraggableWindow from "@/components/ui/DraggableWindow";
import {
  APPAREILS_DB,
  MARQUES_APPAREILS,
  searchAppareils,
  type AppareilAuditif,
} from "@/lib/appareilsAuditifsDb";
import { AUDIO_CLASSE_1, AUDIO_CLASSE_2, calcRacAudio } from "@/lib/remboursements";

/* ─── Design tokens ──────────────────────────────────────────── */
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

const PRIMARY = "#00C98A";

/* ─── Helpers ────────────────────────────────────────────────── */
type TypeFilter = "tous" | "rite" | "intra" | "contour" | "bte";
type ClasseFilter = "toutes" | 1 | 2;
type NiveauFilter = "tous" | "entrée" | "intermédiaire" | "avancé" | "premium";

const TYPE_LABELS: Record<AppareilAuditif["type"], string> = {
  rite: "RITE",
  intra: "Intra",
  contour: "Contour",
  bte: "BTE",
};

const NIVEAU_LABELS: Record<AppareilAuditif["niveauTechno"], string> = {
  entrée: "Entrée de gamme",
  intermédiaire: "Intermédiaire",
  avancé: "Avancé",
  premium: "Premium",
};

function racBadgeColor(rac: number): string {
  if (rac <= 0) return "#22c55e";
  if (rac <= 1500) return "#f59e0b";
  return "#ef4444";
}

function formatPrice(n: number): string {
  return n.toLocaleString("fr-FR") + " €";
}

/* ─── Questionnaire State ────────────────────────────────────── */
interface QuestionnaireState {
  step: 1 | 2 | 3 | 4 | 5 | "result";
  typeAppareillage: "premier" | "reapparaillage" | null;
  dureeAncienAppareil: "moins2ans" | "2a4ans" | "plus4ans" | null;
  problemesAncienAppareil: string[];
  niveauPerte: "légère" | "moyenne" | "sévère" | "profonde" | null;
  oreilles: "gauche" | "droite" | "les-deux" | null;
  trancheAge: "moins18" | "18-60" | "plus60" | null;
  modeVie: "actif" | "social" | "calme" | null;
  environnements: string[];
  discretion: "tres" | "assez" | "peu" | null;
  connectivite: "indispensable" | "plus" | "non" | null;
  batterie: "rechargeable" | "pile" | "indifferent" | null;
  budget: "classe1" | "classe2-1500" | "classe2-premium" | null;
  ald: boolean;
}

const initialState: QuestionnaireState = {
  step: 1,
  typeAppareillage: null,
  dureeAncienAppareil: null,
  problemesAncienAppareil: [],
  niveauPerte: null,
  oreilles: null,
  trancheAge: null,
  modeVie: null,
  environnements: [],
  discretion: null,
  connectivite: null,
  batterie: null,
  budget: null,
  ald: false,
};

/* ─── Algorithme de scoring ──────────────────────────────────── */
function scoreAppareil(a: AppareilAuditif, q: QuestionnaireState): number {
  let score = 0;

  // 1. Match niveau de perte (essentiel)
  if (q.niveauPerte && a.indicationsPertes.includes(q.niveauPerte)) score += 30;

  // 2. Budget / Classe
  if (q.budget === "classe1" && a.classe !== 1) return -999;
  if (q.budget === "classe2-1500") {
    const rac = a.prixUnitaireTTC - 840;
    if (rac > 1500) score -= 20;
  }

  // 3. Problèmes de l'ancien appareillage → technologies ciblées
  if (q.problemesAncienAppareil.includes("sons-graves")) {
    if (["Oticon", "ReSound"].includes(a.marque)) score += 20;
  }
  if (q.problemesAncienAppareil.includes("bruit-fond")) {
    if (["Phonak", "Starkey"].includes(a.marque)) score += 20;
    if (
      a.technologies.some(
        (t) =>
          t.toLowerCase().includes("bruit") ||
          t.toLowerCase().includes("snr") ||
          t.toLowerCase().includes("autosense") ||
          t.toLowerCase().includes("ia"),
      )
    )
      score += 10;
  }
  if (q.problemesAncienAppareil.includes("sifflements")) {
    if (["Widex", "Signia"].includes(a.marque)) score += 20;
    if (
      a.technologies.some(
        (t) =>
          t.toLowerCase().includes("feedback") ||
          t.toLowerCase().includes("zerodelay") ||
          t.toLowerCase().includes("larsen"),
      )
    )
      score += 10;
  }
  if (q.problemesAncienAppareil.includes("autonomie")) {
    if (a.technologies.some((t) => t.toLowerCase().includes("recharg"))) score += 15;
    if (a.autonomie && parseInt(a.autonomie) >= 24) score += 5;
  }
  if (q.problemesAncienAppareil.includes("discretion")) {
    if (a.type === "rite" || a.type === "intra") score += 15;
  }
  if (q.problemesAncienAppareil.includes("connectivite")) {
    if (a.technologies.some((t) => t.toLowerCase().includes("bluetooth"))) score += 15;
  }
  if (q.problemesAncienAppareil.includes("propre-voix")) {
    if (["Signia", "Widex"].includes(a.marque)) score += 15;
    if (
      a.technologies.some(
        (t) =>
          t.toLowerCase().includes("own voice") ||
          t.toLowerCase().includes("zerodelay"),
      )
    )
      score += 10;
  }

  // 4. Mode de vie
  if (q.modeVie === "actif") {
    if (["Phonak", "Starkey"].includes(a.marque)) score += 10;
    if (
      a.technologies.some(
        (t) => t.toLowerCase().includes("ip68") || t.toLowerCase().includes("sport"),
      )
    )
      score += 10;
  }
  if (q.modeVie === "social") {
    if (["Phonak", "Oticon", "ReSound"].includes(a.marque)) score += 10;
  }

  // 5. Environnements difficiles
  if (q.environnements.includes("bruyants")) {
    if (["Phonak", "Starkey", "Oticon"].includes(a.marque)) score += 10;
    if (a.niveauTechno === "premium" || a.niveauTechno === "avancé") score += 5;
  }
  if (q.environnements.includes("musique")) {
    if (["Widex", "Oticon"].includes(a.marque)) score += 15;
  }
  if (q.environnements.includes("telephone")) {
    if (a.technologies.some((t) => t.toLowerCase().includes("bluetooth"))) score += 10;
  }

  // 6. Connectivité souhaitée
  if (q.connectivite === "indispensable") {
    if (a.technologies.some((t) => t.toLowerCase().includes("bluetooth"))) score += 15;
    else score -= 10;
  }

  // 7. Rechargeable
  if (q.batterie === "rechargeable") {
    if (a.technologies.some((t) => t.toLowerCase().includes("recharg"))) score += 15;
    else score -= 5;
  }

  // 8. Discrétion
  if (q.discretion === "tres") {
    if (a.type === "rite") score += 15;
    if (a.type === "intra") score += 20;
    if (a.type === "bte") score -= 10;
  }

  // 9. Perte sévère/profonde → BTE ou puissance
  if (q.niveauPerte === "sévère" || q.niveauPerte === "profonde") {
    if (a.type === "bte" || a.type === "contour") score += 15;
    if (
      a.indicationsPertes.includes("sévère") ||
      a.indicationsPertes.includes("profonde")
    )
      score += 10;
  }

  // 10. Niveau techno selon budget
  if (q.budget === "classe2-premium" && a.niveauTechno === "premium") score += 10;
  if (q.budget === "classe1" && a.niveauTechno === "entrée") score += 5;

  return score;
}

function genRaisons(a: AppareilAuditif, q: QuestionnaireState): string[] {
  const raisons: string[] = [];
  if (q.niveauPerte && a.indicationsPertes.includes(q.niveauPerte)) {
    raisons.push(`Adapté à votre perte auditive ${q.niveauPerte}`);
  }
  if (a.classe === 1 && q.budget === "classe1") {
    raisons.push("100% Santé — aucun reste à charge");
  }
  if (a.technologies.some((t) => t.toLowerCase().includes("bluetooth"))) {
    raisons.push("Connexion Bluetooth direct smartphone");
  }
  if (a.technologies.some((t) => t.toLowerCase().includes("recharg"))) {
    raisons.push(`Rechargeable — ${a.autonomie ?? "longue autonomie"}`);
  }
  if (
    ["Phonak", "Starkey"].includes(a.marque) &&
    q.problemesAncienAppareil.includes("bruit-fond")
  ) {
    raisons.push("Réduction de bruit avancée — technologie IA");
  }
  if (
    ["Oticon", "ReSound"].includes(a.marque) &&
    q.problemesAncienAppareil.includes("sons-graves")
  ) {
    raisons.push("Son naturel et clarté de la parole");
  }
  if (
    ["Widex", "Signia"].includes(a.marque) &&
    q.problemesAncienAppareil.includes("sifflements")
  ) {
    raisons.push("Anti-larsen ultra-performant");
  }
  if (a.garantie) raisons.push(`Garantie ${a.garantie}`);
  return raisons.slice(0, 4);
}

function computeRecommendations(
  q: QuestionnaireState,
): { appareil: AppareilAuditif; score: number }[] {
  const scored = APPAREILS_DB.map((a) => ({ appareil: a, score: scoreAppareil(a, q) }))
    .filter((x) => x.score > -999)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return [];

  const top = scored[0];
  // Deuxième recommandation : marque différente si possible
  const second = scored.find((x) => x.appareil.marque !== top.appareil.marque) ?? scored[1];

  const results = [top];
  if (second && second !== top) results.push(second);
  return results;
}

/* ─── Pill ───────────────────────────────────────────────────── */
function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-3 py-1 text-xs font-medium transition-all"
      style={
        active
          ? { background: PRIMARY, color: "#fff", border: `1px solid ${PRIMARY}` }
          : {
              background: "var(--glass-subtle-bg)",
              color: "#475569",
              border: "1px solid rgba(203,213,225,0.7)",
            }
      }
    >
      {label}
    </button>
  );
}

/* ─── Modal devis ────────────────────────────────────────────── */
interface ModalDevisProps {
  appareil: AppareilAuditif;
  onClose: () => void;
  onAdded: () => void;
}

function ModalDevis({ appareil, onClose, onAdded }: ModalDevisProps) {
  const [nb, setNb] = useState<1 | 2>(2);

  const total = appareil.prixUnitaireTTC * nb;
  const ss = appareil.priseEnChargeSS * nb;
  const rac = total - ss;

  function handleConfirm() {
    const existing: object[] = (() => {
      try {
        const raw = localStorage.getItem("thor_pro_audition_devis_selection");
        return raw ? (JSON.parse(raw) as object[]) : [];
      } catch {
        return [];
      }
    })();
    const entry = {
      appareilId: appareil.id,
      modele: appareil.modele,
      prix: total,
      ss,
      nb,
      rac,
    };
    localStorage.setItem(
      "thor_pro_audition_devis_selection",
      JSON.stringify([...existing, entry]),
    );
    onAdded();
    onClose();
  }

  return (
    <DraggableWindow
      title="Ajouter au devis"
      badge={`${appareil.marque} · ${appareil.gamme}`}
      onClose={onClose}
      defaultWidth={480}
      defaultHeight={400}
    >
      <div style={{ background: "var(--glass-card-bg)", padding: "24px" }} className="space-y-4">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {appareil.marque} · {appareil.gamme}
          </p>
          <h3 className="text-base font-semibold text-slate-800 leading-snug mt-0.5">
            {appareil.modele}
          </h3>
        </div>

        {/* Sélection oreilles */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Nombre d&apos;oreilles</p>
          <div className="flex gap-2">
            {([1, 2] as const).map((n) => (
              <button
                key={n}
                onClick={() => setNb(n)}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-all"
                style={
                  nb === n
                    ? { background: PRIMARY, color: "#fff", border: `1.5px solid ${PRIMARY}` }
                    : { ...glassSubtle, color: "#475569" }
                }
              >
                {n === 1 ? "1 oreille" : "2 oreilles (paire)"}
              </button>
            ))}
          </div>
        </div>

        {/* Récapitulatif */}
        <div className="rounded-xl p-3.5 space-y-1.5" style={glassSubtle}>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Prix TTC</span>
            <span className="font-semibold text-slate-800">{formatPrice(total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Prise en charge SS</span>
            <span className="font-medium text-emerald-600">− {formatPrice(ss)}</span>
          </div>
          <div className="h-px bg-slate-200/70 my-1" />
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-slate-700">RAC estimé</span>
            <span className="font-bold text-base" style={{ color: racBadgeColor(rac) }}>
              {formatPrice(rac)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={handleConfirm}
            className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: PRIMARY }}
          >
            Confirmer l&apos;ajout
          </button>
          <a
            href="/clair-audition/pro/devis"
            className="w-full rounded-xl py-2.5 text-sm font-medium text-center transition-colors hover:bg-white/60"
            style={{ ...glassSubtle, color: "#475569" }}
          >
            Voir les devis
          </a>
        </div>
      </div>
    </DraggableWindow>
  );
}

/* ─── Card appareil ──────────────────────────────────────────── */
function AppareilCard({
  appareil,
  onAddToDevis,
}: {
  appareil: AppareilAuditif;
  onAddToDevis: (a: AppareilAuditif) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const rac = appareil.prixUnitaireTTC - appareil.priseEnChargeSS;
  const isLong = appareil.description.length > 130;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 transition-shadow hover:shadow-lg"
      style={glass}
    >
      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 justify-end">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{ background: "rgba(0,201,138,0.12)", color: PRIMARY }}
        >
          {TYPE_LABELS[appareil.type]}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={
            appareil.classe === 1
              ? { background: "rgba(34,197,94,0.12)", color: "#16a34a" }
              : { background: "rgba(124,58,237,0.12)", color: "#7c3aed" }
          }
        >
          {appareil.classe === 1 ? "Classe 1 (100% Santé)" : "Classe 2"}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{ background: "rgba(139,92,246,0.10)", color: "#7c3aed" }}
        >
          {NIVEAU_LABELS[appareil.niveauTechno]}
        </span>
      </div>

      {/* Identité */}
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {appareil.marque} · {appareil.gamme}
        </p>
        <h3 className="text-base font-bold text-slate-800 leading-snug mt-0.5">
          {appareil.modele}
        </h3>
      </div>

      {/* Description */}
      <div>
        <p
          className={`text-xs text-slate-500 leading-relaxed ${!expanded && isLong ? "line-clamp-2" : ""}`}
        >
          {appareil.description}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-[11px] font-medium transition-colors"
            style={{ color: PRIMARY }}
          >
            {expanded ? "Voir moins ↑" : "Voir plus ↓"}
          </button>
        )}
      </div>

      {/* Technologies */}
      <div className="flex flex-wrap gap-1">
        {appareil.technologies.slice(0, 3).map((t) => (
          <span
            key={t}
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: "rgba(0,201,138,0.08)", color: "#0369a1" }}
          >
            {t}
          </span>
        ))}
        {appareil.technologies.length > 3 && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: "rgba(100,116,139,0.08)", color: "#64748b" }}
          >
            +{appareil.technologies.length - 3}
          </span>
        )}
      </div>

      {/* Pertes */}
      <p className="text-[11px] text-slate-500">
        <span className="font-medium text-slate-500">Pertes : </span>
        {appareil.indicationsPertes.join(" · ")}
      </p>

      {/* Divider */}
      <div className="h-px bg-slate-200/60" />

      {/* Prix */}
      <div className="space-y-0.5">
        <p className="text-base font-bold text-slate-800">
          {formatPrice(appareil.prixUnitaireTTC)}{" "}
          <span className="text-xs font-normal text-slate-500">TTC / oreille</span>
        </p>
        <p className="text-xs text-slate-500">
          SS : {formatPrice(appareil.priseEnChargeSS)}/oreille
          {appareil.classe === 1 && (
            <span className="ml-1 text-emerald-600 font-medium">(100% Santé)</span>
          )}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-medium text-slate-500">RAC :</span>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-bold"
            style={{
              background: racBadgeColor(rac) + "18",
              color: racBadgeColor(rac),
            }}
          >
            {formatPrice(rac)}
          </span>
        </div>
      </div>

      {/* Autonomie & garantie */}
      {(appareil.autonomie || appareil.garantie) && (
        <div className="text-[11px] text-slate-500 space-y-0.5">
          {appareil.autonomie && (
            <p>
              <span className="font-medium text-slate-500">Autonomie : </span>
              {appareil.autonomie}
            </p>
          )}
          <p>
            <span className="font-medium text-slate-500">Garantie : </span>
            {appareil.garantie}
          </p>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={() => onAddToDevis(appareil)}
        className="mt-auto w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: PRIMARY }}
      >
        + Ajouter au devis
      </button>
    </div>
  );
}

/* ─── Barre de progression ───────────────────────────────────── */
function ProgressBar({
  step,
  total,
  hasReapparaillage,
}: {
  step: number;
  total: number;
  hasReapparaillage: boolean;
}) {
  const displayTotal = hasReapparaillage ? total : total - 1;
  const displayStep = hasReapparaillage ? step : step > 1 ? step - 1 : step;
  return (
    <div className="flex items-center gap-2 mb-6">
      <span className="text-xs font-medium text-slate-500">
        Étape {displayStep} sur {displayTotal}
      </span>
      <div className="flex gap-1.5">
        {Array.from({ length: displayTotal }).map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: i < displayStep ? 24 : 12,
              background: i < displayStep ? PRIMARY : "rgba(203,213,225,0.6)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Choix card ─────────────────────────────────────────────── */
function ChoixCard({
  icon,
  label,
  description,
  selected,
  onClick,
}: {
  icon: string;
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-1.5 rounded-2xl p-5 text-left transition-all hover:shadow-md w-full"
      style={{
        ...glass,
        border: selected ? `2px solid ${PRIMARY}` : "1px solid rgba(255,255,255,0.72)",
        boxShadow: selected ? `0 0 0 4px rgba(0,201,138,0.10)` : glass.boxShadow,
      }}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      {description && (
        <span className="text-xs text-slate-500 leading-relaxed">{description}</span>
      )}
    </button>
  );
}

/* ─── Checkbox item ──────────────────────────────────────────── */
function CheckItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all"
      style={{
        ...glassSubtle,
        border: checked ? `1.5px solid ${PRIMARY}` : "1px solid rgba(255,255,255,0.65)",
        background: checked ? "rgba(0,201,138,0.06)" : glassSubtle.background,
      }}
    >
      <div
        className="w-4 h-4 rounded shrink-0 flex items-center justify-center transition-all"
        style={{
          background: checked ? PRIMARY : "rgba(255,255,255,0.8)",
          border: checked ? `1.5px solid ${PRIMARY}` : "1.5px solid rgba(203,213,225,0.8)",
        }}
      >
        {checked && (
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

/* ─── Navigation buttons ─────────────────────────────────────── */
function NavButtons({
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="flex justify-between items-center mt-8">
      {onBack ? (
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:bg-white/60"
          style={{ ...glassSubtle, color: "#475569" }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Retour
        </button>
      ) : (
        <div />
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: PRIMARY }}
      >
        {nextLabel ?? "Suivant"}
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

/* ─── Étape 1 ────────────────────────────────────────────────── */
function Step1({
  q,
  setQ,
}: {
  q: QuestionnaireState;
  setQ: React.Dispatch<React.SetStateAction<QuestionnaireState>>;
}) {
  return (
    <div>
      <ProgressBar step={1} total={5} hasReapparaillage={true} />
      <h2 className="text-lg font-semibold text-slate-800 mb-1">
        Quel type d&apos;appareillage recherchez-vous ?
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        Cette information nous aide à personnaliser nos recommandations.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ChoixCard
          icon=""
          label="Premier appareillage"
          description="C'est la première fois que je porte des appareils auditifs."
          selected={q.typeAppareillage === "premier"}
          onClick={() =>
            setQ((prev) => ({ ...prev, typeAppareillage: "premier", step: 3 }))
          }
        />
        <ChoixCard
          icon=""
          label="Réappareillage"
          description="Je renouvelle mes appareils existants."
          selected={q.typeAppareillage === "reapparaillage"}
          onClick={() =>
            setQ((prev) => ({ ...prev, typeAppareillage: "reapparaillage", step: 2 }))
          }
        />
      </div>
    </div>
  );
}

/* ─── Étape 2 ────────────────────────────────────────────────── */
const PROBLEMES_OPTIONS = [
  { value: "sons-aigus", label: "Sons trop aigus / stridents" },
  { value: "sons-graves", label: "Sons trop graves / manque de clarté de la parole" },
  { value: "bruit-fond", label: "Bruit de fond très gênant (restaurants, transports)" },
  { value: "sifflements", label: "Sifflements / effet larsen" },
  { value: "autonomie", label: "Autonomie insuffisante (batterie épuisée trop vite)" },
  { value: "discretion", label: "Discrétion insuffisante (trop visible)" },
  { value: "connectivite", label: "Connexion téléphone mauvaise ou absente" },
  { value: "inconfort", label: "Inconfort physique (douleur, irritation)" },
  { value: "milieu-bruyant", label: "Difficulté dans les milieux très bruyants" },
  { value: "comprehension", label: "Mauvaise compréhension de la parole" },
  { value: "propre-voix", label: "Mauvaise gestion de ma propre voix" },
];

function Step2({
  q,
  setQ,
}: {
  q: QuestionnaireState;
  setQ: React.Dispatch<React.SetStateAction<QuestionnaireState>>;
}) {
  function toggleProbleme(value: string) {
    setQ((prev) => ({
      ...prev,
      problemesAncienAppareil: prev.problemesAncienAppareil.includes(value)
        ? prev.problemesAncienAppareil.filter((v) => v !== value)
        : [...prev.problemesAncienAppareil, value],
    }));
  }

  return (
    <div>
      <ProgressBar step={2} total={5} hasReapparaillage={true} />
      <h2 className="text-lg font-semibold text-slate-800 mb-1">
        Bilan de votre ancien appareillage
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        Ces informations nous permettent de cibler les améliorations.
      </p>

      {/* Durée */}
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-700 mb-3">
          Depuis combien de temps portez-vous vos appareils actuels ?
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["moins2ans", "Moins de 2 ans"],
              ["2a4ans", "2 à 4 ans"],
              ["plus4ans", "Plus de 4 ans"],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setQ((prev) => ({ ...prev, dureeAncienAppareil: v }))}
              className="rounded-full px-4 py-2 text-sm font-medium transition-all"
              style={
                q.dureeAncienAppareil === v
                  ? { background: PRIMARY, color: "#fff", border: `1px solid ${PRIMARY}` }
                  : {
                      ...glassSubtle,
                      color: "#475569",
                      border: "1px solid rgba(203,213,225,0.7)",
                    }
              }
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Problèmes */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-3">
          Quels problèmes avez-vous rencontrés ?{" "}
          <span className="font-normal text-slate-500">(plusieurs choix possibles)</span>
        </p>
        <div className="space-y-2">
          {PROBLEMES_OPTIONS.map((opt) => (
            <CheckItem
              key={opt.value}
              label={opt.label}
              checked={q.problemesAncienAppareil.includes(opt.value)}
              onChange={() => toggleProbleme(opt.value)}
            />
          ))}
        </div>
      </div>

      <NavButtons
        onBack={() => setQ((prev) => ({ ...prev, step: 1 }))}
        onNext={() => setQ((prev) => ({ ...prev, step: 3 }))}
      />
    </div>
  );
}

/* ─── Étape 3 ────────────────────────────────────────────────── */
const PERTES = [
  {
    value: "légère" as const,
    label: "Légère",
    sublabel: "20–40 dB",
    icon: "",
    description: "Difficultés dans le bruit",
  },
  {
    value: "moyenne" as const,
    label: "Moyenne",
    sublabel: "40–70 dB",
    icon: "",
    description: "Parole parfois incompréhensible",
  },
  {
    value: "sévère" as const,
    label: "Sévère",
    sublabel: "70–90 dB",
    icon: "",
    description: "Parole très difficile sans aide",
  },
  {
    value: "profonde" as const,
    label: "Profonde",
    sublabel: "> 90 dB",
    icon: "",
    description: "Appareillage puissant requis",
  },
];

function Step3({
  q,
  setQ,
}: {
  q: QuestionnaireState;
  setQ: React.Dispatch<React.SetStateAction<QuestionnaireState>>;
}) {
  const stepNum = q.typeAppareillage === "reapparaillage" ? 3 : 2;
  return (
    <div>
      <ProgressBar
        step={stepNum}
        total={5}
        hasReapparaillage={q.typeAppareillage === "reapparaillage"}
      />
      <h2 className="text-lg font-semibold text-slate-800 mb-1">Profil auditif</h2>
      <p className="text-sm text-slate-500 mb-6">
        Estimé ou selon votre dernier audiogramme.
      </p>

      {/* Degré de perte */}
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-700 mb-3">
          Quel est votre degré de perte auditive ?
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PERTES.map((p) => (
            <button
              key={p.value}
              onClick={() => setQ((prev) => ({ ...prev, niveauPerte: p.value }))}
              className="flex flex-col items-center gap-1 rounded-2xl p-4 text-center transition-all hover:shadow-md"
              style={{
                ...glass,
                border:
                  q.niveauPerte === p.value
                    ? `2px solid ${PRIMARY}`
                    : "1px solid rgba(255,255,255,0.72)",
                boxShadow:
                  q.niveauPerte === p.value
                    ? `0 0 0 4px rgba(0,201,138,0.10)`
                    : glass.boxShadow,
              }}
            >
              <span className="text-xl">{p.icon}</span>
              <span className="text-sm font-semibold text-slate-800">{p.label}</span>
              <span className="text-xs font-medium text-slate-500">{p.sublabel}</span>
              <span className="text-[11px] text-slate-500 leading-tight mt-0.5">
                {p.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Oreilles */}
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-700 mb-3">
          Quelle(s) oreille(s) sont concernées ?
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["gauche", "Oreille gauche"],
              ["droite", "Oreille droite"],
              ["les-deux", "Les deux oreilles"],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setQ((prev) => ({ ...prev, oreilles: v }))}
              className="rounded-full px-4 py-2 text-sm font-medium transition-all"
              style={
                q.oreilles === v
                  ? { background: PRIMARY, color: "#fff", border: `1px solid ${PRIMARY}` }
                  : {
                      ...glassSubtle,
                      color: "#475569",
                      border: "1px solid rgba(203,213,225,0.7)",
                    }
              }
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Tranche d'âge */}
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-700 mb-3">Votre tranche d&apos;âge</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["moins18", "Moins de 18 ans"],
              ["18-60", "18 à 60 ans"],
              ["plus60", "Plus de 60 ans"],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setQ((prev) => ({ ...prev, trancheAge: v }))}
              className="rounded-full px-4 py-2 text-sm font-medium transition-all"
              style={
                q.trancheAge === v
                  ? { background: PRIMARY, color: "#fff", border: `1px solid ${PRIMARY}` }
                  : {
                      ...glassSubtle,
                      color: "#475569",
                      border: "1px solid rgba(203,213,225,0.7)",
                    }
              }
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ALD */}
      <label
        className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all mb-2"
        style={{
          ...glassSubtle,
          border: q.ald ? `1.5px solid ${PRIMARY}` : "1px solid rgba(255,255,255,0.65)",
          background: q.ald ? "rgba(0,201,138,0.06)" : glassSubtle.background,
        }}
      >
        <div
          className="w-4 h-4 rounded shrink-0 flex items-center justify-center transition-all"
          style={{
            background: q.ald ? PRIMARY : "rgba(255,255,255,0.8)",
            border: q.ald ? `1.5px solid ${PRIMARY}` : "1.5px solid rgba(203,213,225,0.8)",
          }}
        >
          {q.ald && (
            <svg
              className="w-2.5 h-2.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="3"
            >
              <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span className="text-sm text-slate-700" onClick={() => setQ((prev) => ({ ...prev, ald: !prev.ald }))}>
          Je bénéficie d&apos;une Affection de Longue Durée (ALD)
        </span>
      </label>

      <NavButtons
        onBack={() =>
          setQ((prev) => ({
            ...prev,
            step: prev.typeAppareillage === "reapparaillage" ? 2 : 1,
          }))
        }
        onNext={() => setQ((prev) => ({ ...prev, step: 4 }))}
        nextDisabled={!q.niveauPerte || !q.oreilles || !q.trancheAge}
      />
    </div>
  );
}

/* ─── Étape 4 ────────────────────────────────────────────────── */
const ENVIRONNEMENTS_OPTIONS = [
  { value: "bruyants", label: "Milieux très bruyants (restaurants, transports)" },
  { value: "reunions", label: "Réunions et groupes" },
  { value: "television", label: "Télévision et médias" },
  { value: "tete-a-tete", label: "Conversations en tête-à-tête" },
  { value: "telephone", label: "Téléphone / appels" },
  { value: "sport", label: "Activités sportives / extérieur" },
  { value: "musique", label: "Musique" },
];

function Step4({
  q,
  setQ,
}: {
  q: QuestionnaireState;
  setQ: React.Dispatch<React.SetStateAction<QuestionnaireState>>;
}) {
  const stepNum = q.typeAppareillage === "reapparaillage" ? 4 : 3;
  function toggleEnv(value: string) {
    setQ((prev) => ({
      ...prev,
      environnements: prev.environnements.includes(value)
        ? prev.environnements.filter((v) => v !== value)
        : [...prev.environnements, value],
    }));
  }

  return (
    <div>
      <ProgressBar
        step={stepNum}
        total={5}
        hasReapparaillage={q.typeAppareillage === "reapparaillage"}
      />
      <h2 className="text-lg font-semibold text-slate-800 mb-1">Mode de vie</h2>
      <p className="text-sm text-slate-500 mb-6">
        Comment décrieriez-vous votre quotidien ?
      </p>

      {/* Mode de vie */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <ChoixCard
          icon=""
          label="Actif / Sportif"
          description="Sport, plein air, activités dynamiques"
          selected={q.modeVie === "actif"}
          onClick={() => setQ((prev) => ({ ...prev, modeVie: "actif" }))}
        />
        <ChoixCard
          icon=""
          label="Social actif"
          description="Réunions, restaurants, sorties"
          selected={q.modeVie === "social"}
          onClick={() => setQ((prev) => ({ ...prev, modeVie: "social" }))}
        />
        <ChoixCard
          icon=""
          label="Calme"
          description="Maison, télé, conversations tranquilles"
          selected={q.modeVie === "calme"}
          onClick={() => setQ((prev) => ({ ...prev, modeVie: "calme" }))}
        />
      </div>

      {/* Environnements */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-3">
          Dans quels environnements avez-vous le plus de difficultés ?{" "}
          <span className="font-normal text-slate-500">(plusieurs choix possibles)</span>
        </p>
        <div className="space-y-2">
          {ENVIRONNEMENTS_OPTIONS.map((opt) => (
            <CheckItem
              key={opt.value}
              label={opt.label}
              checked={q.environnements.includes(opt.value)}
              onChange={() => toggleEnv(opt.value)}
            />
          ))}
        </div>
      </div>

      <NavButtons
        onBack={() => setQ((prev) => ({ ...prev, step: 3 }))}
        onNext={() => setQ((prev) => ({ ...prev, step: 5 }))}
        nextDisabled={!q.modeVie}
      />
    </div>
  );
}

/* ─── Étape 5 ────────────────────────────────────────────────── */
function Step5({
  q,
  setQ,
}: {
  q: QuestionnaireState;
  setQ: React.Dispatch<React.SetStateAction<QuestionnaireState>>;
}) {
  const stepNum = q.typeAppareillage === "reapparaillage" ? 5 : 4;
  const canNext = q.discretion && q.connectivite && q.batterie && q.budget;

  return (
    <div>
      <ProgressBar
        step={stepNum}
        total={5}
        hasReapparaillage={q.typeAppareillage === "reapparaillage"}
      />
      <h2 className="text-lg font-semibold text-slate-800 mb-1">Préférences</h2>
      <p className="text-sm text-slate-500 mb-6">
        Affinez votre sélection selon vos critères personnels.
      </p>

      {/* Discrétion */}
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-700 mb-3">
          Discrétion de l&apos;appareil
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["tres", "Très importante"],
              ["assez", "Assez importante"],
              ["peu", "Peu importante"],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setQ((prev) => ({ ...prev, discretion: v }))}
              className="rounded-full px-4 py-2 text-sm font-medium transition-all"
              style={
                q.discretion === v
                  ? { background: PRIMARY, color: "#fff", border: `1px solid ${PRIMARY}` }
                  : {
                      ...glassSubtle,
                      color: "#475569",
                      border: "1px solid rgba(203,213,225,0.7)",
                    }
              }
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Connectivité */}
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-700 mb-3">
          Connectivité smartphone (streaming, appels)
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["indispensable", "Indispensable"],
              ["plus", "Serait un plus"],
              ["non", "Pas important"],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setQ((prev) => ({ ...prev, connectivite: v }))}
              className="rounded-full px-4 py-2 text-sm font-medium transition-all"
              style={
                q.connectivite === v
                  ? { background: PRIMARY, color: "#fff", border: `1px solid ${PRIMARY}` }
                  : {
                      ...glassSubtle,
                      color: "#475569",
                      border: "1px solid rgba(203,213,225,0.7)",
                    }
              }
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Batterie */}
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-700 mb-3">Type de batterie</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["rechargeable", "Rechargeable préféré"],
              ["pile", "Pile standard OK"],
              ["indifferent", "↔ Indifférent"],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setQ((prev) => ({ ...prev, batterie: v }))}
              className="rounded-full px-4 py-2 text-sm font-medium transition-all"
              style={
                q.batterie === v
                  ? { background: PRIMARY, color: "#fff", border: `1px solid ${PRIMARY}` }
                  : {
                      ...glassSubtle,
                      color: "#475569",
                      border: "1px solid rgba(203,213,225,0.7)",
                    }
              }
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-700 mb-3">Budget</p>
        <div className="space-y-2">
          {(
            [
              [
                "classe1",
                "100% Santé — 0 € RAC",
                `Classe 1 — prix max ${AUDIO_CLASSE_1.plafondTTC.toLocaleString("fr-FR")} €/oreille · aucun reste à charge`,
              ],
              [
                "classe2-1500",
                "Classe 2 — jusqu'à 1 500 €/oreille RAC",
                "Bonne qualité avec remboursement SS de 840 €/oreille",
              ],
              [
                "classe2-premium",
                "Classe 2 Premium — budget ouvert",
                `Meilleure technologie disponible · SS ${AUDIO_CLASSE_2.remboursementSS} €/oreille`,
              ],
            ] as const
          ).map(([v, l, sub]) => (
            <button
              key={v}
              onClick={() => setQ((prev) => ({ ...prev, budget: v }))}
              className="w-full flex flex-col items-start gap-0.5 rounded-2xl px-5 py-4 text-left transition-all hover:shadow-md"
              style={{
                ...glass,
                border:
                  q.budget === v
                    ? `2px solid ${PRIMARY}`
                    : "1px solid rgba(255,255,255,0.72)",
                boxShadow:
                  q.budget === v
                    ? `0 0 0 4px rgba(0,201,138,0.10)`
                    : glass.boxShadow,
              }}
            >
              <span className="text-sm font-semibold text-slate-800">{l}</span>
              <span className="text-xs text-slate-500">{sub}</span>
            </button>
          ))}
        </div>
      </div>

      <NavButtons
        onBack={() => setQ((prev) => ({ ...prev, step: 4 }))}
        onNext={() => setQ((prev) => ({ ...prev, step: "result" }))}
        nextDisabled={!canNext}
        nextLabel="Voir mes recommandations"
      />
    </div>
  );
}

/* ─── Résultats ──────────────────────────────────────────────── */
function ResultCard({
  rank,
  appareil,
  raisons,
  q,
  onAddToDevis,
}: {
  rank: 1 | 2;
  appareil: AppareilAuditif;
  raisons: string[];
  q: QuestionnaireState;
  onAddToDevis: (a: AppareilAuditif) => void;
}) {
  const nbOreilles: 1 | 2 = q.oreilles === "les-deux" ? 2 : 1;
  const racResult = calcRacAudio({
    prixTTC: appareil.prixUnitaireTTC,
    classe: appareil.classe,
    nbOreilles,
    ald: q.ald,
  });
  const racParOreille = racResult.rac / nbOreilles;

  return (
    <div
      className="rounded-2xl p-6 space-y-4"
      style={{
        ...glass,
        border: rank === 1 ? `2px solid ${PRIMARY}` : "1px solid rgba(255,255,255,0.72)",
        boxShadow:
          rank === 1
            ? `0 0 0 4px rgba(0,201,138,0.10), 0 8px 32px rgba(0,0,0,0.06)`
            : glass.boxShadow,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-base" aria-hidden>
          {""}
        </span>
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: PRIMARY }}>
          Recommandation {rank}
        </span>
        {rank === 1 && (
          <span
            className="ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
            style={{ background: "rgba(0,201,138,0.12)", color: PRIMARY }}
          >
            Meilleure adéquation
          </span>
        )}
      </div>

      {/* Identité */}
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {appareil.marque} · {appareil.gamme}
        </p>
        <h3 className="text-lg font-bold text-slate-800 leading-snug mt-0.5">
          {appareil.modele}
        </h3>
        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{ background: "rgba(0,201,138,0.12)", color: PRIMARY }}
          >
            {TYPE_LABELS[appareil.type]}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={
              appareil.classe === 1
                ? { background: "rgba(34,197,94,0.12)", color: "#16a34a" }
                : { background: "rgba(124,58,237,0.12)", color: "#7c3aed" }
            }
          >
            {appareil.classe === 1 ? "Classe 1" : "Classe 2"}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{ background: "rgba(139,92,246,0.10)", color: "#7c3aed" }}
          >
            {NIVEAU_LABELS[appareil.niveauTechno]}
          </span>
        </div>
      </div>

      {/* Pourquoi ce choix */}
      {raisons.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">Pourquoi ce choix ?</p>
          <ul className="space-y-1">
            {raisons.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-emerald-500 font-bold shrink-0">✓</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Prix */}
      <div className="rounded-xl p-4 space-y-1.5" style={glassSubtle}>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Prix TTC / oreille</span>
          <span className="font-semibold text-slate-800">
            {formatPrice(appareil.prixUnitaireTTC)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Remboursement SS</span>
          <span className="font-medium text-emerald-600">
            − {formatPrice(racResult.remboursementSS / nbOreilles)}/oreille
          </span>
        </div>
        <div className="h-px bg-slate-200/70 my-1" />
        <div className="flex justify-between text-sm items-center">
          <span className="font-semibold text-slate-700">RAC / oreille</span>
          <span
            className="rounded-full px-2.5 py-0.5 text-sm font-bold"
            style={{
              background: racBadgeColor(racParOreille) + "18",
              color: racBadgeColor(racParOreille),
            }}
          >
            {formatPrice(racParOreille)}
          </span>
        </div>
        {nbOreilles === 2 && (
          <div className="flex justify-between text-xs text-slate-500 pt-0.5">
            <span>RAC paire</span>
            <span className="font-semibold">{formatPrice(racResult.rac)}</span>
          </div>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={() => onAddToDevis(appareil)}
        className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: PRIMARY }}
      >
        + Ajouter au devis
      </button>
    </div>
  );
}

function ResultsView({
  q,
  setQ,
  onAddToDevis,
}: {
  q: QuestionnaireState;
  setQ: React.Dispatch<React.SetStateAction<QuestionnaireState>>;
  onAddToDevis: (a: AppareilAuditif) => void;
}) {
  const recs = computeRecommendations(q);

  const badgeStyle: CSSProperties = {
    background: "rgba(0,201,138,0.10)",
    color: PRIMARY,
    borderRadius: 999,
    padding: "2px 10px",
    fontSize: 11,
    fontWeight: 600,
  };

  const perteLabel =
    q.niveauPerte === "légère"
      ? "Légère"
      : q.niveauPerte === "moyenne"
        ? "Moyenne"
        : q.niveauPerte === "sévère"
          ? "Sévère"
          : q.niveauPerte === "profonde"
            ? "Profonde"
            : null;

  const oreillesLabel =
    q.oreilles === "les-deux"
      ? "Bilatéral"
      : q.oreilles === "gauche"
        ? "Gauche"
        : q.oreilles === "droite"
          ? "Droite"
          : null;

  const budgetLabel =
    q.budget === "classe1"
      ? "100% Santé"
      : q.budget === "classe2-1500"
        ? "≤ 1 500 € RAC"
        : q.budget === "classe2-premium"
          ? "Premium"
          : null;

  return (
    <div>
      {/* Titre */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-1">
          Nos recommandations pour vous
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Basées sur votre profil et vos préférences.
        </p>
        {/* Badges profil */}
        <div className="flex flex-wrap gap-2">
          {perteLabel && <span style={badgeStyle}>Perte {perteLabel}</span>}
          {oreillesLabel && <span style={badgeStyle}>{oreillesLabel}</span>}
          {q.modeVie && (
            <span style={badgeStyle}>
              {q.modeVie === "actif" ? "Actif" : q.modeVie === "social" ? "Social" : "Calme"}
            </span>
          )}
          {budgetLabel && <span style={badgeStyle}>{budgetLabel}</span>}
          {q.ald && <span style={{ ...badgeStyle, background: "rgba(34,197,94,0.12)", color: "#16a34a" }}>ALD</span>}
        </div>
      </div>

      {recs.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={glass}>
          <p className="text-sm text-slate-500">
            Aucun appareil ne correspond à ces critères stricts. Essayez d&apos;assouplir votre
            budget.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {recs.map((r, i) => (
            <ResultCard
              key={r.appareil.id}
              rank={(i + 1) as 1 | 2}
              appareil={r.appareil}
              raisons={genRaisons(r.appareil, q)}
              q={q}
              onAddToDevis={onAddToDevis}
            />
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <button
          onClick={() => setQ((prev) => ({ ...prev, step: 5 }))}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all hover:bg-white/60"
          style={{ ...glassSubtle, color: "#475569" }}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Modifier mes critères
        </button>
        <button
          onClick={() => setQ(initialState)}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all hover:bg-white/60"
          style={{ ...glassSubtle, color: "#475569" }}
        >
          Recommencer le questionnaire
        </button>
      </div>
    </div>
  );
}

/* ─── Mode catalogue ─────────────────────────────────────────── */
function CatalogueView({
  onAddToDevis,
}: {
  onAddToDevis: (a: AppareilAuditif) => void;
}) {
  const [query, setQuery] = useState("");
  const [marque, setMarque] = useState<string>("tous");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("tous");
  const [classe, setClasse] = useState<ClasseFilter>("toutes");
  const [niveau, setNiveau] = useState<NiveauFilter>("tous");

  const results: AppareilAuditif[] = (() => {
    let base = searchAppareils(query);
    if (marque !== "tous") base = base.filter((a) => a.marque === marque);
    if (typeFilter !== "tous") base = base.filter((a) => a.type === typeFilter);
    if (classe !== "toutes") base = base.filter((a) => a.classe === classe);
    if (niveau !== "tous") base = base.filter((a) => a.niveauTechno === niveau);
    return base;
  })();

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={glass}>
        <svg
          className="w-4 h-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un modèle, une marque, une technologie…"
          className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-500 outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="shrink-0 rounded-lg p-1 text-slate-500 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="rounded-2xl px-5 py-4 space-y-3" style={glass}>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-14 shrink-0">
            Marque
          </span>
          <Pill label="Tous" active={marque === "tous"} onClick={() => setMarque("tous")} />
          {MARQUES_APPAREILS.map((m) => (
            <Pill key={m} label={m} active={marque === m} onClick={() => setMarque(m)} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-14 shrink-0">
            Type
          </span>
          {(
            [
              ["tous", "Tous"],
              ["rite", "RITE"],
              ["intra", "Intra"],
              ["contour", "Contour"],
              ["bte", "BTE"],
            ] as [TypeFilter, string][]
          ).map(([v, l]) => (
            <Pill
              key={v}
              label={l}
              active={typeFilter === v}
              onClick={() => setTypeFilter(v)}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-14 shrink-0">
            Classe
          </span>
          <Pill
            label="Toutes"
            active={classe === "toutes"}
            onClick={() => setClasse("toutes")}
          />
          <Pill
            label="Classe 1 (100% Santé)"
            active={classe === 1}
            onClick={() => setClasse(1)}
          />
          <Pill label="Classe 2" active={classe === 2} onClick={() => setClasse(2)} />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-14 shrink-0">
            Niveau
          </span>
          {(
            [
              ["tous", "Tous"],
              ["entrée", "Entrée"],
              ["intermédiaire", "Intermédiaire"],
              ["avancé", "Avancé"],
              ["premium", "Premium"],
            ] as [NiveauFilter, string][]
          ).map(([v, l]) => (
            <Pill key={v} label={l} active={niveau === v} onClick={() => setNiveau(v)} />
          ))}
        </div>
      </div>

      {/* Compteur */}
      <div className="flex justify-end">
        <span className="text-sm font-medium text-slate-500">
          {results.length} appareil{results.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grille */}
      {results.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={glass}>
          <p className="text-sm text-slate-500">
            Aucun appareil ne correspond à votre recherche.
          </p>
          <button
            className="mt-3 text-sm font-medium transition-colors"
            style={{ color: PRIMARY }}
            onClick={() => {
              setQuery("");
              setMarque("tous");
              setTypeFilter("tous");
              setClasse("toutes");
              setNiveau("tous");
            }}
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((a) => (
            <AppareilCard key={a.id} appareil={a} onAddToDevis={onAddToDevis} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Page principale ────────────────────────────────────────── */
export default function AppareillageAuditionPage() {
  const [mode, setMode] = useState<"questionnaire" | "catalogue">("questionnaire");
  const [q, setQ] = useState<QuestionnaireState>(initialState);
  const [modal, setModal] = useState<AppareilAuditif | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setModal(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleAddToDevis(a: AppareilAuditif) {
    setModal(a);
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800 h-title">
            Appareillage auditif
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "questionnaire"
              ? "Outil de prescription guidé — questionnaire en 5 étapes"
              : "Catalogue complet — filtres et comparatif"}
          </p>
        </div>
        {/* Bascule mode */}
        <button
          onClick={() => setMode(mode === "questionnaire" ? "catalogue" : "questionnaire")}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:shadow-md shrink-0"
          style={
            mode === "catalogue"
              ? { background: PRIMARY, color: "#fff", border: `1px solid ${PRIMARY}` }
              : { ...glassSubtle, color: "#475569", border: "1px solid rgba(203,213,225,0.7)" }
          }
        >
          {mode === "questionnaire" ? (
            <>
              Voir tout le catalogue
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Questionnaire guidé
            </>
          )}
        </button>
      </div>

      {/* ── Contenu ── */}
      {mode === "questionnaire" ? (
        <div className="rounded-2xl p-6 sm:p-8" style={glass}>
          {q.step === 1 && <Step1 q={q} setQ={setQ} />}
          {q.step === 2 && <Step2 q={q} setQ={setQ} />}
          {q.step === 3 && <Step3 q={q} setQ={setQ} />}
          {q.step === 4 && <Step4 q={q} setQ={setQ} />}
          {q.step === 5 && <Step5 q={q} setQ={setQ} />}
          {q.step === "result" && (
            <ResultsView q={q} setQ={setQ} onAddToDevis={handleAddToDevis} />
          )}
        </div>
      ) : (
        <CatalogueView onAddToDevis={handleAddToDevis} />
      )}

      {/* ── Modal devis ── */}
      {modal && (
        <ModalDevis
          appareil={modal}
          onClose={() => setModal(null)}
          onAdded={() => showToast("Appareil ajouté à votre sélection")}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg"
          style={{ background: "#1e293b" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
