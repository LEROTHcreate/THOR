"use client";

import { useState, useEffect } from "react";

const A = "#2D8CFF";

const glass = {
  background: "var(--glass-strong-bg)",
  backdropFilter: "blur(20px)" as const,
  WebkitBackdropFilter: "blur(20px)" as const,
  border: "1px solid var(--glass-strong-border)",
  borderRadius: 20,
};

const CENTRES = [
  { id: 1, name: "Clair Vision Marseille Prado", practitioners: ["Mme. Claire Fontaine", "M. Antoine Moreau"] },
  { id: 2, name: "Clair Vision Lyon Bellecour", practitioners: ["M. Marc Dupuis", "Mme. Nadia Benoit"] },
  { id: 3, name: "Clair Vision Paris 8ème", practitioners: ["Mme. Isabelle Renard", "M. Lucas Bernard"] },
];

const LS_REFERENT = "thor_patient_referent_vision";
const LS_NOTIFS   = "thor_pro_pre_consult_notifications";

interface Referent { centreId: number; centreName: string; practitioner: string; }

interface FormData {
  motif: string;
  difficultesVision: string[];
  portActuel: string;
  equipementMarque: string;
  equipementAge: string;
  activites: string;
  medicaments: string;
  antecedents: string[];
  autresInfos: string;
  questions: string;
}

const MOTIFS = [
  "Contrôle annuel",
  "Renouvellement d'équipement",
  "Gêne visuelle récente",
  "Prescription d'ordonnance",
  "Casse ou perte d'équipement",
  "Premier équipement",
  "Autre",
];

const DIFFICULTES = [
  { id: "loin",    label: "Vision de loin" },
  { id: "pres",    label: "Vision de près" },
  { id: "ecrans",  label: "Écrans / ordinateur" },
  { id: "conduite",label: "Conduite" },
  { id: "nuit",    label: "Vision nocturne" },
  { id: "double",  label: "Vision double" },
  { id: "maux",    label: "Maux de tête" },
  { id: "fatigue", label: "Fatigue visuelle" },
];

const ANTECEDENTS = [
  { id: "operation",   label: "Opération des yeux (Lasik, cataracte…)" },
  { id: "glaucome",    label: "Glaucome" },
  { id: "dmla",        label: "DMLA" },
  { id: "paresseux",   label: "Œil paresseux (amblyopie)" },
  { id: "strabisme",   label: "Strabisme" },
  { id: "diabete",     label: "Diabète" },
  { id: "hypertension",label: "Hypertension" },
];

/* ── Referent Card ───────────────────────────────────────────────────────── */
function ReferentCard({ referent, onEdit }: { referent: Referent; onEdit: () => void }) {
  return (
    <div style={{ ...glass, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${A}18`, border: `1.5px solid ${A}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: A, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>Praticien référent</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{referent.practitioner}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>{referent.centreName}</div>
        </div>
      </div>
      <button onClick={onEdit} style={{ padding: "6px 14px", borderRadius: 10, border: `1.5px solid rgba(0,0,0,.12)`, background: "var(--glass-strong-bg)", fontSize: 12, fontWeight: 600, color: "#64748b", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
        Modifier
      </button>
    </div>
  );
}

/* ── Referent Picker ─────────────────────────────────────────────────────── */
function ReferentPicker({ onSave }: { onSave: (r: Referent) => void }) {
  const [centreId, setCentreId] = useState<number | null>(null);
  const [practitioner, setPractitioner] = useState("");

  const centre = CENTRES.find(c => c.id === centreId) ?? null;

  function handleSave() {
    if (!centre || !practitioner) return;
    onSave({ centreId: centre.id, centreName: centre.name, practitioner });
  }

  return (
    <div style={{ ...glass, padding: 20, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Choisissez votre praticien référent</div>
      </div>
      <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px", lineHeight: 1.5 }}>
        Le formulaire sera envoyé à votre praticien avant la consultation. Sélectionnez votre centre et votre opticien.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 6 }}>Centre</label>
          <select
            value={centreId ?? ""}
            onChange={e => { setCentreId(Number(e.target.value) || null); setPractitioner(""); }}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,.12)", fontSize: 13, outline: "none", background: "rgba(255,255,255,.9)", boxSizing: "border-box" }}
          >
            <option value="">Sélectionner un centre</option>
            {CENTRES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 6 }}>Praticien</label>
          <select
            value={practitioner}
            onChange={e => setPractitioner(e.target.value)}
            disabled={!centre}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,.12)", fontSize: 13, outline: "none", background: !centre ? "#f8fafc" : "rgba(255,255,255,.9)", color: !centre ? "#94a3b8" : "#0f172a", boxSizing: "border-box" }}
          >
            <option value="">Sélectionner un praticien</option>
            {centre?.practitioners.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={!centre || !practitioner}
        style={{ padding: "10px 20px", borderRadius: 12, border: "none", background: !centre || !practitioner ? "#e2e8f0" : `linear-gradient(135deg,${A},#1a6fd4)`, color: !centre || !practitioner ? "#94a3b8" : "#fff", fontSize: 13, fontWeight: 700, cursor: !centre || !practitioner ? "not-allowed" : "pointer" }}
      >
        Confirmer mon praticien
      </button>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function PreConsultationPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [referent, setReferent] = useState<Referent | null>(null);
  const [editingReferent, setEditingReferent] = useState(false);
  const [form, setForm] = useState<FormData>({
    motif: "",
    difficultesVision: [],
    portActuel: "",
    equipementMarque: "",
    equipementAge: "",
    activites: "",
    medicaments: "",
    antecedents: [],
    autresInfos: "",
    questions: "",
  });

  // Load referent from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_REFERENT);
      if (raw) setReferent(JSON.parse(raw));
    } catch {}
  }, []);

  function saveReferent(r: Referent) {
    setReferent(r);
    setEditingReferent(false);
    try { localStorage.setItem(LS_REFERENT, JSON.stringify(r)); } catch {}
  }

  const TOTAL_STEPS = 3;

  function toggleCheck(field: "difficultesVision" | "antecedents", val: string) {
    setForm(f => {
      const arr = f[field];
      return { ...f, [field]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
    });
  }

  function handleSubmit() {
    const dateKey = new Date().toISOString().split("T")[0];
    const key = `thor_pre_consult_vision_${dateKey}`;
    const submittedAt = new Date().toISOString();
    const data = { ...form, referent, submittedAt };

    // Save patient's copy
    try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
    try {
      const list = JSON.parse(localStorage.getItem("thor_pre_consult_vision_list") || "[]");
      list.unshift({ key, ...data });
      localStorage.setItem("thor_pre_consult_vision_list", JSON.stringify(list.slice(0, 50)));
    } catch {}

    // Push notification to pro space
    if (referent) {
      try {
        const notif = {
          id: `pre_${Date.now()}`,
          type: "pre_consultation",
          brand: "vision",
          motif: form.motif,
          practitioner: referent.practitioner,
          centreName: referent.centreName,
          submittedAt,
          dataKey: key,
          read: false,
        };
        const existing = JSON.parse(localStorage.getItem(LS_NOTIFS) || "[]");
        existing.unshift(notif);
        localStorage.setItem(LS_NOTIFS, JSON.stringify(existing.slice(0, 100)));
      } catch {}
    }

    setSubmitted(true);
  }

  /* ── Success screen ── */
  if (submitted) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ ...glass, padding: "48px 40px", textAlign: "center", maxWidth: 520, width: "100%" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: `${A}15`, border: `3px solid ${A}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 20px" }}>✓</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>Formulaire envoyé !</h2>
          <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.6, margin: "0 0 24px" }}>
            {referent
              ? <><strong>{referent.practitioner}</strong> ({referent.centreName}) a bien reçu vos informations et sera notifié(e) avant votre rendez-vous.</>
              : "Votre praticien a bien reçu vos informations. Elles seront consultées avant votre rendez-vous."}
          </p>
          <div style={{ background: `${A}10`, border: `1px solid ${A}30`, borderRadius: 14, padding: "14px 18px", fontSize: 13, color: "#475569", textAlign: "left" }}>
            <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Récapitulatif</div>
            {form.motif && <div>· Motif : <strong>{form.motif}</strong></div>}
            {form.difficultesVision.length > 0 && <div>· Gênes : {form.difficultesVision.join(", ")}</div>}
            {form.portActuel && <div>· Port actuel : {form.portActuel}</div>}
            {referent && <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${A}20` }}>· Envoyé à : <strong>{referent.practitioner}</strong></div>}
          </div>
        </div>
      </div>
    );
  }

  const pct = ((step - 1) / TOTAL_STEPS) * 100;

  return (
    <div style={{ padding: "24px 0 48px" }}>

      {/* Referent */}
      {(!referent || editingReferent) ? (
        <ReferentPicker onSave={saveReferent} />
      ) : (
        <ReferentCard referent={referent} onEdit={() => setEditingReferent(true)} />
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${A}15`, border: `2px solid ${A}`, display: "grid", placeItems: "center", fontSize: 18 }}></div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>Pré-consultation</h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Avant votre rendez-vous · Clair Vision</p>
          </div>
        </div>
        <div style={{ height: 6, background: "rgba(0,0,0,.08)", borderRadius: 99, overflow: "hidden", marginTop: 12 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${A},#1a6fd4)`, borderRadius: 99, transition: "width .3s ease" }} />
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>Étape {step} sur {TOTAL_STEPS}</div>
      </div>

      {/* Step 1 — Motif & gênes */}
      {step === 1 && (
        <div style={{ ...glass, padding: 28 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 20px" }}>Motif & difficultés visuelles</h2>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#334155", display: "block", marginBottom: 10 }}>
              Quel est le motif principal de votre visite ?
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {MOTIFS.map(m => (
                <label key={m} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, border: `1.5px solid ${form.motif === m ? A : "rgba(0,0,0,.1)"}`, background: form.motif === m ? `${A}0d` : "rgba(255,255,255,.7)", cursor: "pointer", fontSize: 14, fontWeight: 600, color: form.motif === m ? A : "#334155", transition: "all .15s" }}>
                  <input type="radio" name="motif" value={m} checked={form.motif === m} onChange={() => setForm(f => ({ ...f, motif: m }))} style={{ accentColor: A }} />
                  {m}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#334155", display: "block", marginBottom: 10 }}>
              Quelles difficultés visuelles ressentez-vous ? <span style={{ fontWeight: 400, color: "#94a3b8" }}>(plusieurs possibles)</span>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {DIFFICULTES.map(d => {
                const checked = form.difficultesVision.includes(d.id);
                return (
                  <label key={d.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${checked ? A : "rgba(0,0,0,.1)"}`, background: checked ? `${A}0d` : "rgba(255,255,255,.7)", cursor: "pointer", fontSize: 13, fontWeight: 600, color: checked ? A : "#475569", transition: "all .15s" }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleCheck("difficultesVision", d.id)} style={{ accentColor: A }} />
                    {d.label}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Équipement actuel */}
      {step === 2 && (
        <div style={{ ...glass, padding: 28 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 20px" }}>Équipement & santé</h2>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#334155", display: "block", marginBottom: 10 }}>Port actuel</label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {["Montures", "Lentilles", "Montures + Lentilles", "Sans correction"].map(opt => (
                <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 12, border: `1.5px solid ${form.portActuel === opt ? A : "rgba(0,0,0,.1)"}`, background: form.portActuel === opt ? `${A}0d` : "rgba(255,255,255,.7)", cursor: "pointer", fontSize: 13, fontWeight: 600, color: form.portActuel === opt ? A : "#475569" }}>
                  <input type="radio" name="portActuel" value={opt} checked={form.portActuel === opt} onChange={() => setForm(f => ({ ...f, portActuel: opt }))} style={{ accentColor: A }} />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 6 }}>Marque / modèle actuel</label>
              <input value={form.equipementMarque} onChange={e => setForm(f => ({ ...f, equipementMarque: e.target.value }))}
                placeholder="Ex : Silhouette Titan"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,.12)", fontSize: 13, outline: "none", boxSizing: "border-box", background: "var(--glass-strong-bg)" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 6 }}>Âge de l&apos;équipement</label>
              <select value={form.equipementAge} onChange={e => setForm(f => ({ ...f, equipementAge: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,.12)", fontSize: 13, outline: "none", boxSizing: "border-box", background: "var(--glass-strong-bg)" }}>
                <option value="">Sélectionner</option>
                <option>Moins d&apos;un an</option>
                <option>1 à 2 ans</option>
                <option>2 à 4 ans</option>
                <option>Plus de 4 ans</option>
                <option>Ne sait pas</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 6 }}>Activités pratiquées (sport, lecture, écrans…)</label>
            <textarea value={form.activites} onChange={e => setForm(f => ({ ...f, activites: e.target.value }))}
              placeholder="Ex : Tennis 3x/semaine, télétravail sur écran 8h/jour, lecture le soir…"
              rows={3}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,.12)", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box", background: "var(--glass-strong-bg)" }} />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#334155", display: "block", marginBottom: 10 }}>
              Antécédents ophtalmologiques <span style={{ fontWeight: 400, color: "#94a3b8" }}>(plusieurs possibles)</span>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {ANTECEDENTS.map(a => {
                const checked = form.antecedents.includes(a.id);
                return (
                  <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, border: `1.5px solid ${checked ? "#8b5cf6" : "rgba(0,0,0,.1)"}`, background: checked ? "rgba(139,92,246,.06)" : "rgba(255,255,255,.7)", cursor: "pointer", fontSize: 13, fontWeight: 600, color: checked ? "#7c3aed" : "#475569" }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleCheck("antecedents", a.id)} style={{ accentColor: "#8b5cf6" }} />
                    {a.label}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step 3 — Médicaments & questions */}
      {step === 3 && (
        <div style={{ ...glass, padding: 28 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 20px" }}>Informations complémentaires</h2>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 6 }}>
              Médicaments en cours pouvant affecter la vision
            </label>
            <textarea value={form.medicaments} onChange={e => setForm(f => ({ ...f, medicaments: e.target.value }))}
              placeholder="Ex : antihistaminiques, antidépresseurs, traitements hormonaux…"
              rows={3}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,.12)", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box", background: "var(--glass-strong-bg)" }} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 6 }}>
              Autres informations utiles pour le praticien
            </label>
            <textarea value={form.autresInfos} onChange={e => setForm(f => ({ ...f, autresInfos: e.target.value }))}
              placeholder="Allergies aux matériaux, sensibilité à la lumière…"
              rows={3}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,.12)", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box", background: "var(--glass-strong-bg)" }} />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 6 }}>
              Questions pour votre opticien
            </label>
            <textarea value={form.questions} onChange={e => setForm(f => ({ ...f, questions: e.target.value }))}
              placeholder="Questions sur votre correction, vos verres, votre mutuelle…"
              rows={4}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${A}30`, fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box", background: `${A}06` }} />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
        {step > 1 ? (
          <button onClick={() => setStep(s => s - 1)} style={{ padding: "12px 24px", borderRadius: 14, border: "1.5px solid rgba(0,0,0,.12)", background: "var(--glass-strong-bg)", fontSize: 14, fontWeight: 700, color: "#64748b", cursor: "pointer" }}>
            ← Précédent
          </button>
        ) : <div />}

        {step < TOTAL_STEPS ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={step === 1 && !form.motif}
            style={{ padding: "12px 28px", borderRadius: 14, border: "none", background: !form.motif && step === 1 ? "#e2e8f0" : `linear-gradient(135deg,${A},#1a6fd4)`, color: !form.motif && step === 1 ? "#94a3b8" : "#fff", fontSize: 14, fontWeight: 700, cursor: step === 1 && !form.motif ? "not-allowed" : "pointer", boxShadow: form.motif || step > 1 ? `0 4px 14px ${A}35` : "none" }}
          >
            Suivant →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!referent}
            title={!referent ? "Veuillez d'abord choisir un praticien référent" : undefined}
            style={{ padding: "12px 28px", borderRadius: 14, border: "none", background: !referent ? "#e2e8f0" : `linear-gradient(135deg,${A},#1a6fd4)`, color: !referent ? "#94a3b8" : "#fff", fontSize: 14, fontWeight: 700, cursor: !referent ? "not-allowed" : "pointer", boxShadow: referent ? `0 4px 14px ${A}35` : "none" }}
          >
            ✓ Envoyer à mon praticien
          </button>
        )}
      </div>
    </div>
  );
}
