"use client";

import { useState, useEffect } from "react";

const A = "#00C98A";

const glass = {
  background: "var(--glass-strong-bg)",
  backdropFilter: "blur(20px)" as const,
  WebkitBackdropFilter: "blur(20px)" as const,
  border: "1px solid var(--glass-strong-border)",
  borderRadius: 20,
};

const CENTRES = [
  { id: 1, name: "Clair Audition Marseille Prado", practitioners: ["M. Rami Benali", "Mme. Leila Amara"] },
  { id: 2, name: "Clair Audition Lyon Bellecour", practitioners: ["Mme. Sophie Martin", "M. Pierre Durand"] },
  { id: 3, name: "Clair Audition Paris 8ème", practitioners: ["M. Karim Mansouri", "Mme. Chloé Petit"] },
];

const LS_REFERENT = "thor_patient_referent_audition";
const LS_NOTIFS   = "thor_pro_pre_consult_notifications";

interface Referent { centreId: number; centreName: string; practitioner: string; }

interface FormData {
  motif: string;
  genesAuditives: string[];
  portActuel: string;
  appareillageMarque: string;
  appareillageAge: string;
  situationsDifficiles: string[];
  acouphenes: string;
  vertiges: string;
  antecedents: string[];
  medicaments: string;
  questions: string;
}

const MOTIFS = [
  "Contrôle / suivi",
  "Gêne auditive récente",
  "Renouvellement d'appareil",
  "Premier appareillage",
  "Problème avec mon appareil",
  "Adaptation difficile",
  "Autre",
];

const GENES = [
  { id: "conversation",  label: "Conversations" },
  { id: "groupe",        label: "Groupes / réunions" },
  { id: "tv",            label: "Télévision" },
  { id: "telephone",     label: "Téléphone" },
  { id: "restaurant",    label: "Restaurant / bruit" },
  { id: "musique",       label: "Musique / sons aigus" },
  { id: "comprendre",    label: "Comprendre sans lire sur les lèvres" },
  { id: "exterieur",     label: "Extérieur / vent" },
];

const SITUATIONS = [
  { id: "tv_fort",    label: "TV trop forte selon l'entourage" },
  { id: "repeter",    label: "Demande souvent de répéter" },
  { id: "fatigue",    label: "Fatigue auditive en fin de journée" },
  { id: "oreille",    label: "Sensation d'oreille bouchée" },
];

const ANTECEDENTS = [
  { id: "otites",     label: "Otites fréquentes" },
  { id: "chirurgie",  label: "Chirurgie de l'oreille" },
  { id: "meningite",  label: "Méningite" },
  { id: "bruit",      label: "Exposition professionnelle au bruit" },
  { id: "traumatisme",label: "Traumatisme sonore" },
  { id: "diabete",    label: "Diabète" },
  { id: "familial",   label: "Antécédents familiaux de surdité" },
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
        Le formulaire sera envoyé à votre praticien avant la consultation. Sélectionnez votre centre et votre audioprothésiste.
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
        style={{ padding: "10px 20px", borderRadius: 12, border: "none", background: !centre || !practitioner ? "#e2e8f0" : `linear-gradient(135deg,${A},#059669)`, color: !centre || !practitioner ? "#94a3b8" : "#fff", fontSize: 13, fontWeight: 700, cursor: !centre || !practitioner ? "not-allowed" : "pointer" }}
      >
        Confirmer mon praticien
      </button>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function PreConsultationAuditionPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [referent, setReferent] = useState<Referent | null>(null);
  const [editingReferent, setEditingReferent] = useState(false);
  const [form, setForm] = useState<FormData>({
    motif: "",
    genesAuditives: [],
    portActuel: "",
    appareillageMarque: "",
    appareillageAge: "",
    situationsDifficiles: [],
    acouphenes: "",
    vertiges: "",
    antecedents: [],
    medicaments: "",
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

  function toggleCheck(field: "genesAuditives" | "situationsDifficiles" | "antecedents", val: string) {
    setForm(f => {
      const arr = f[field];
      return { ...f, [field]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
    });
  }

  function handleSubmit() {
    const dateKey = new Date().toISOString().split("T")[0];
    const key = `thor_pre_consult_audition_${dateKey}`;
    const submittedAt = new Date().toISOString();
    const data = { ...form, referent, submittedAt };

    // Save patient's copy
    try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
    try {
      const list = JSON.parse(localStorage.getItem("thor_pre_consult_audition_list") || "[]");
      list.unshift({ key, ...data });
      localStorage.setItem("thor_pre_consult_audition_list", JSON.stringify(list.slice(0, 50)));
    } catch {}

    // Push notification to pro space
    if (referent) {
      try {
        const notif = {
          id: `pre_${Date.now()}`,
          type: "pre_consultation",
          brand: "audition",
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
              : "Votre audioprothésiste a bien reçu vos informations. Elles seront consultées avant votre rendez-vous."}
          </p>
          <div style={{ background: `${A}10`, border: `1px solid ${A}30`, borderRadius: 14, padding: "14px 18px", fontSize: 13, color: "#475569", textAlign: "left" }}>
            <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Récapitulatif</div>
            {form.motif && <div>· Motif : <strong>{form.motif}</strong></div>}
            {form.genesAuditives.length > 0 && <div>· Gênes : {form.genesAuditives.join(", ")}</div>}
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
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Avant votre rendez-vous · Clair Audition</p>
          </div>
        </div>
        <div style={{ height: 6, background: "rgba(0,0,0,.08)", borderRadius: 99, overflow: "hidden", marginTop: 12 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${A},#059669)`, borderRadius: 99, transition: "width .3s ease" }} />
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>Étape {step} sur {TOTAL_STEPS}</div>
      </div>

      {/* Step 1 — Motif & gênes */}
      {step === 1 && (
        <div style={{ ...glass, padding: 28 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 20px" }}>Motif & gênes auditives</h2>

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

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#334155", display: "block", marginBottom: 10 }}>
              Dans quelles situations avez-vous des difficultés ? <span style={{ fontWeight: 400, color: "#94a3b8" }}>(plusieurs possibles)</span>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {GENES.map(g => {
                const checked = form.genesAuditives.includes(g.id);
                return (
                  <label key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${checked ? A : "rgba(0,0,0,.1)"}`, background: checked ? `${A}0d` : "rgba(255,255,255,.7)", cursor: "pointer", fontSize: 13, fontWeight: 600, color: checked ? A : "#475569", transition: "all .15s" }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleCheck("genesAuditives", g.id)} style={{ accentColor: A }} />
                    {g.label}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#334155", display: "block", marginBottom: 10 }}>
              Autres signes <span style={{ fontWeight: 400, color: "#94a3b8" }}>(plusieurs possibles)</span>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {SITUATIONS.map(s => {
                const checked = form.situationsDifficiles.includes(s.id);
                return (
                  <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, border: `1.5px solid ${checked ? A : "rgba(0,0,0,.1)"}`, background: checked ? `${A}0d` : "rgba(255,255,255,.7)", cursor: "pointer", fontSize: 13, fontWeight: 600, color: checked ? A : "#475569", transition: "all .15s" }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleCheck("situationsDifficiles", s.id)} style={{ accentColor: A }} />
                    {s.label}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Appareillage & santé */}
      {step === 2 && (
        <div style={{ ...glass, padding: 28 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 20px" }}>Appareillage & santé</h2>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#334155", display: "block", marginBottom: 10 }}>Port actuel</label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {["Appareils auditifs OD+OG", "Appareil auditif OD", "Appareil auditif OG", "Sans appareillage"].map(opt => (
                <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, border: `1.5px solid ${form.portActuel === opt ? A : "rgba(0,0,0,.1)"}`, background: form.portActuel === opt ? `${A}0d` : "rgba(255,255,255,.7)", cursor: "pointer", fontSize: 13, fontWeight: 600, color: form.portActuel === opt ? A : "#475569" }}>
                  <input type="radio" name="portActuel" value={opt} checked={form.portActuel === opt} onChange={() => setForm(f => ({ ...f, portActuel: opt }))} style={{ accentColor: A }} />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 6 }}>Marque / modèle actuel</label>
              <input value={form.appareillageMarque} onChange={e => setForm(f => ({ ...f, appareillageMarque: e.target.value }))}
                placeholder="Ex : Phonak Audéo M90"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,.12)", fontSize: 13, outline: "none", boxSizing: "border-box", background: "var(--glass-strong-bg)" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 6 }}>Âge de l&apos;appareillage</label>
              <select value={form.appareillageAge} onChange={e => setForm(f => ({ ...f, appareillageAge: e.target.value }))}
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#334155", display: "block", marginBottom: 10 }}>Acouphènes ?</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["Oui, constants", "Oui, intermittents", "Non"].map(opt => (
                  <label key={opt} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "9px 10px", borderRadius: 10, border: `1.5px solid ${form.acouphenes === opt ? A : "rgba(0,0,0,.1)"}`, background: form.acouphenes === opt ? `${A}0d` : "rgba(255,255,255,.7)", cursor: "pointer", fontSize: 12, fontWeight: 600, color: form.acouphenes === opt ? A : "#475569", textAlign: "center" }}>
                    <input type="radio" name="acouphenes" value={opt} checked={form.acouphenes === opt} onChange={() => setForm(f => ({ ...f, acouphenes: opt }))} style={{ display: "none" }} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#334155", display: "block", marginBottom: 10 }}>Vertiges ?</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["Oui", "Non"].map(opt => (
                  <label key={opt} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "9px 10px", borderRadius: 10, border: `1.5px solid ${form.vertiges === opt ? A : "rgba(0,0,0,.1)"}`, background: form.vertiges === opt ? `${A}0d` : "rgba(255,255,255,.7)", cursor: "pointer", fontSize: 13, fontWeight: 600, color: form.vertiges === opt ? A : "#475569", textAlign: "center" }}>
                    <input type="radio" name="vertiges" value={opt} checked={form.vertiges === opt} onChange={() => setForm(f => ({ ...f, vertiges: opt }))} style={{ display: "none" }} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#334155", display: "block", marginBottom: 10 }}>
              Antécédents ORL / médicaux <span style={{ fontWeight: 400, color: "#94a3b8" }}>(plusieurs possibles)</span>
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
              Médicaments en cours pouvant affecter l&apos;audition
            </label>
            <textarea value={form.medicaments} onChange={e => setForm(f => ({ ...f, medicaments: e.target.value }))}
              placeholder="Ex : diurétiques, anti-inflammatoires, antibiotiques (aminosides)…"
              rows={3}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,.12)", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box", background: "var(--glass-strong-bg)" }} />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 6 }}>
              Questions pour votre audioprothésiste
            </label>
            <textarea value={form.questions} onChange={e => setForm(f => ({ ...f, questions: e.target.value }))}
              placeholder="Questions sur votre appareillage, les remboursements, les nouvelles technologies…"
              rows={5}
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
            style={{ padding: "12px 28px", borderRadius: 14, border: "none", background: !form.motif && step === 1 ? "#e2e8f0" : `linear-gradient(135deg,${A},#059669)`, color: !form.motif && step === 1 ? "#94a3b8" : "#fff", fontSize: 14, fontWeight: 700, cursor: step === 1 && !form.motif ? "not-allowed" : "pointer", boxShadow: form.motif || step > 1 ? `0 4px 14px ${A}35` : "none" }}
          >
            Suivant →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!referent}
            title={!referent ? "Veuillez d'abord choisir un praticien référent" : undefined}
            style={{ padding: "12px 28px", borderRadius: 14, border: "none", background: !referent ? "#e2e8f0" : `#10b981`, color: !referent ? "#94a3b8" : "#fff", fontSize: 14, fontWeight: 700, cursor: !referent ? "not-allowed" : "pointer", boxShadow: referent ? "0 4px 14px rgba(16,185,129,.35)" : "none" }}
          >
            ✓ Envoyer à mon audioprothésiste
          </button>
        )}
      </div>
    </div>
  );
}
