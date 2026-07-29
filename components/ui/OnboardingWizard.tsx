"use client";

import { useState } from "react";
import {
  saveStoreConfig, loadStoreConfig,
  saveAuditionStoreConfig, loadAuditionStoreConfig,
} from "@/lib/storeConfig";
import { registerCentre } from "@/lib/centresRegistry";

/* ─── Config produit ─────────────────────────────────────────────────────────── */
type Product = "vision" | "audition";

const PRODUCT_CFG = {
  vision: {
    accent:   "#2D8CFF",
    gradient: "#2D8CFF",
    label:    "Clair Vision",
    tagline:  "Logiciel pro pour opticiens & optométristes",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
  },
  audition: {
    accent:   "#00C98A",
    gradient: "#00C98A",
    label:    "Clair Audition",
    tagline:  "Logiciel pro pour audioprothésistes",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3ZM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z"/>
      </svg>
    ),
  },
};

export const LS_FLAG      = (p: Product) => `thor_onboarding_${p}_done`;
export const LS_SKIP_FLAG = (p: Product) => `thor_onboarding_${p}_skipped`;

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface WizardData {
  nom: string; adresse: string; codePostal: string; ville: string;
  telephone: string; email: string; siret: string; adeli: string; finess: string;
}

const STEPS = [
  { id: "cabinet",      label: "Cabinet",     desc: "Identité & coordonnées" },
  { id: "identifiants", label: "Réglementaire", desc: "SIRET · ADELI · FINESS" },
  { id: "done",         label: "Terminé",     desc: "Votre espace est prêt"  },
];

/* ─── Composant principal ────────────────────────────────────────────────────── */
export default function OnboardingWizard({
  product, onComplete, onSkip,
}: {
  product: Product;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const cfg = PRODUCT_CFG[product];
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [data, setData] = useState<WizardData>({
    nom: "", adresse: "", codePostal: "", ville: "",
    telephone: "", email: "", siret: "", adeli: "", finess: "",
  });

  function set(k: keyof WizardData) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setData(prev => ({ ...prev, [k]: e.target.value }));
  }

  function goTo(next: number) {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 220);
  }

  function finish() {
    const load = product === "audition" ? loadAuditionStoreConfig : loadStoreConfig;
    const save = product === "audition" ? saveAuditionStoreConfig : saveStoreConfig;
    const existing = load();
    save({
      ...existing,
      ...(data.nom        && { nom: data.nom }),
      ...(data.adresse    && { adresse: data.adresse }),
      ...(data.codePostal && { codePostal: data.codePostal }),
      ...(data.ville      && { ville: data.ville }),
      ...(data.telephone  && { telephone: data.telephone }),
      ...(data.email      && { email: data.email }),
      ...(data.siret      && { siret: data.siret }),
      ...(data.adeli      && { adeli: data.adeli }),
      ...(data.finess     && { finess: data.finess }),
    });
    localStorage.setItem(LS_FLAG(product), "1");
    localStorage.removeItem(LS_SKIP_FLAG(product));
    /* Enregistrer dans le registre des centres (apparaît sur /nos-centres) */
    if (data.nom && data.ville) {
      registerCentre({
        module: product,
        nom: data.nom,
        adresse: data.adresse,
        codePostal: data.codePostal,
        ville: data.ville,
        telephone: data.telephone || undefined,
        email: data.email || undefined,
        siret: data.siret || undefined,
      });
    }
    onComplete();
  }

  function skip() {
    localStorage.setItem(LS_FLAG(product), "1");
    localStorage.setItem(LS_SKIP_FLAG(product), "1");
    onSkip();
  }

  return (
    <>
      <style>{`
        @keyframes wizard-in  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes wizard-out { from { opacity:1; transform:translateY(0); }   to { opacity:0; transform:translateY(-8px); } }
        @keyframes pulse-soft { 0%,100%{transform:scale(1);} 50%{transform:scale(1.06);} }
        .wiz-content { animation: wizard-in 0.22s ease forwards; }
        .wiz-content.leaving { animation: wizard-out 0.18s ease forwards; }
        @keyframes confetti-pop { 0%{transform:scale(0) rotate(-10deg);opacity:0;} 60%{transform:scale(1.1) rotate(3deg);opacity:1;} 100%{transform:scale(1) rotate(0);opacity:1;} }
        .confetti-pop { animation: confetti-pop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }
      `}</style>

      {/* Backdrop */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: "rgba(8,16,36,0.65)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>

        {/* Card */}
        <div className="flex w-full max-w-[600px] rounded-[28px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.35)]">

          {/* ── Left panel ── */}
          <div className="w-[190px] flex-shrink-0 flex flex-col px-6 py-8 relative overflow-hidden"
            style={{ background: cfg.gradient }}>
            {/* Orb décoratif */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle,rgba(255,255,255,0.6),transparent)" }} />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full opacity-10"
              style={{ background: "radial-gradient(circle,rgba(255,255,255,0.5),transparent)" }} />

            {/* Logo */}
            <div className="relative z-10">
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-white mb-3 shadow-[0_4px_16px_rgba(0,0,0,0.15)]">
                {cfg.icon}
              </div>
              <div className="text-white font-bold text-sm leading-tight">{cfg.label}</div>
              <div className="text-white/60 text-[11px] mt-0.5 leading-snug">{cfg.tagline}</div>
            </div>

            {/* Séparateur */}
            <div className="relative z-10 my-6 h-px bg-white/20" />

            {/* Étapes verticales */}
            <div className="relative z-10 flex flex-col gap-0">
              {STEPS.map((s, i) => {
                const done    = i < step;
                const current = i === step;
                return (
                  <div key={s.id} className="flex gap-3 items-start">
                    <div className="flex flex-col items-center">
                      <div className={[
                        "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300",
                        done    ? "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]" :
                        current ? "bg-white/30 ring-2 ring-white/60 shadow-[0_0_12px_rgba(255,255,255,0.25)]" :
                                  "bg-white/15",
                      ].join(" ")}>
                        {done ? (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke={cfg.accent} strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
                        ) : (
                          <span className={["text-xs font-bold", current ? "text-white" : "text-white/40"].join(" ")}>{i + 1}</span>
                        )}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={["w-px flex-1 my-1 transition-all duration-500", done ? "bg-white/60" : "bg-white/20"].join(" ")}
                          style={{ minHeight: 28 }} />
                      )}
                    </div>
                    <div className="pt-1 pb-7">
                      <div className={["text-xs font-semibold transition-all", current ? "text-white" : done ? "text-white/80" : "text-white/40"].join(" ")}>
                        {s.label}
                      </div>
                      <div className={["text-[10px] transition-all mt-0.5", current ? "text-white/70" : "text-white/30"].join(" ")}>
                        {s.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="flex-1 flex flex-col bg-white">
            <div className="flex-1 px-8 py-8 overflow-y-auto">
              <div className={`wiz-content ${animating ? "leaving" : ""}`} key={step}>

                {/* Step 0 — Cabinet */}
                {step === 0 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-[22px] font-bold text-slate-900 leading-tight">Votre cabinet</h2>
                      <p className="text-sm text-slate-500 mt-1.5">Ces infos apparaîtront sur vos devis et documents officiels.</p>
                    </div>
                    <Field label="Nom du cabinet *" value={data.nom} onChange={set("nom")} placeholder="Ex : Optique Lumière" accent={cfg.accent} />
                    <Field label="Adresse" value={data.adresse} onChange={set("adresse")} placeholder="12 rue de la Paix" accent={cfg.accent} />
                    <div className="grid grid-cols-5 gap-3">
                      <div className="col-span-2">
                        <Field label="Code postal" value={data.codePostal} onChange={set("codePostal")} placeholder="75001" accent={cfg.accent} />
                      </div>
                      <div className="col-span-3">
                        <Field label="Ville" value={data.ville} onChange={set("ville")} placeholder="Paris" accent={cfg.accent} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Téléphone" value={data.telephone} onChange={set("telephone")} placeholder="01 23 45 67 89" type="tel" accent={cfg.accent} />
                      <Field label="Email" value={data.email} onChange={set("email")} placeholder="contact@cabinet.fr" type="email" accent={cfg.accent} />
                    </div>
                  </div>
                )}

                {/* Step 1 — Identifiants */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-[22px] font-bold text-slate-900 leading-tight">Identifiants réglementaires</h2>
                      <p className="text-sm text-slate-500 mt-1.5">Nécessaires pour la télétransmission SESAM-Vitale et les documents normalisés.</p>
                    </div>
                    <Field label="SIRET" value={data.siret} onChange={set("siret")} placeholder="123 456 789 00012"
                      hint="Numéro d'identification de votre établissement (14 chiffres)" accent={cfg.accent} />
                    <Field
                      label={product === "vision" ? "N° ADELI" : "N° RPPS"}
                      value={data.adeli} onChange={set("adeli")}
                      placeholder={product === "vision" ? "75-0123456" : "10003456789"}
                      hint={product === "vision" ? "Répertoire national des professionnels de santé" : "Répertoire Partagé des Professionnels de Santé"}
                      accent={cfg.accent}
                    />
                    <Field label="N° FINESS" value={data.finess} onChange={set("finess")} placeholder="750012345"
                      hint="Numéro de l'établissement de santé — requis pour les FSE" accent={cfg.accent} />
                    <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3"
                      style={{ background: `${cfg.accent}0D`, border: `1px solid ${cfg.accent}22` }}>
                      <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke={cfg.accent} strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                      </svg>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Ces champs sont <strong>optionnels</strong> pour démarrer — vous pourrez les compléter dans <strong>Paramètres → Compte</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 2 — Terminé */}
                {step === 2 && (
                  <div className="flex flex-col items-center text-center gap-5 py-4">
                    <div className="confetti-pop w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
                      style={{ background: cfg.gradient }}>
                      <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5"/>
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Votre cabinet est prêt !</h2>
                      <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-[260px]">
                        Bienvenue dans THOR. Tout est configuré — vous pouvez créer vos premiers dossiers patients.
                      </p>
                    </div>
                    {(data.nom || data.ville) && (
                      <div className="w-full rounded-2xl p-4 text-left space-y-2"
                        style={{ background: "rgba(241,245,249,0.8)", border: "1px solid rgba(226,232,240,0.7)" }}>
                        {data.nom       && <RecapRow label="Cabinet"   value={data.nom} />}
                        {(data.codePostal || data.ville) && <RecapRow label="Ville" value={`${data.codePostal} ${data.ville}`.trim()} />}
                        {data.telephone && <RecapRow label="Téléphone" value={data.telephone} />}
                        {data.email     && <RecapRow label="Email"     value={data.email} />}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-8 pb-7 pt-4 flex items-center justify-between border-t border-slate-100">
              <button onClick={skip} className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
                {step < 2 ? "Configurer plus tard" : ""}
              </button>
              <div className="flex items-center gap-2.5">
                {step > 0 && step < 2 && (
                  <button onClick={() => goTo(step - 1)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors">
                    ← Retour
                  </button>
                )}
                {step < 2 ? (
                  <button onClick={() => goTo(step + 1)} disabled={step === 0 && !data.nom.trim()}
                    className="rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-30 shadow-sm"
                    style={{ background: cfg.gradient }}>
                    Continuer →
                  </button>
                ) : (
                  <button onClick={finish}
                    className="rounded-xl px-7 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90 transition-all hover:scale-[1.02]"
                    style={{ background: cfg.gradient }}>
                    Accéder au tableau de bord
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Sous-composants ────────────────────────────────────────────────────────── */
function Field({
  label, value, onChange, placeholder, type = "text", hint, accent,
}: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string; hint?: string; accent: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide uppercase" style={{ letterSpacing: "0.04em" }}>
        {label}
      </label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-500 outline-none transition-all"
        style={{ boxShadow: "none" }}
        onFocus={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = `0 0 0 3px ${accent}18`; }}
        onBlur={e  => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.background = ""; e.currentTarget.style.boxShadow = ""; }}
      />
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function RecapRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span className="text-slate-500 text-xs w-20 flex-shrink-0">{label}</span>
      <span className="text-slate-700 font-medium truncate">{value}</span>
    </div>
  );
}
