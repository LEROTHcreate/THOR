"use client";

import { useState, useEffect, useCallback, type CSSProperties } from "react";

/* ═══════════════════════════════════════════════════════════════════════
   STYLE TOKENS
═══════════════════════════════════════════════════════════════════════ */
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
const inputStyle: CSSProperties = {
  padding: "9px 12px",
  borderRadius: 10,
  border: "1px solid rgba(148,163,184,0.35)",
  background: "var(--glass-strong-bg)",
  fontSize: 13,
  color: "#1e293b",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

/* ═══════════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════════ */
type TypeRappel = "renouvellement_appareil" | "controle_annuel" | "commande_piles" | "entretien" | "remplacement_domes";
type StatutRappel = "a_planifier" | "planifie" | "effectue" | "ignore";
type CanalContact = "telephone" | "email" | "sms";

interface RappelAudition {
  id: string;
  patientNom: string;
  patientPrenom: string;
  patientTel?: string;
  patientEmail?: string;
  appareil: string;
  oreilles: "binaural" | "OD" | "OG";
  type: TypeRappel;
  dateEcheance: string;
  statut: StatutRappel;
  canal?: CanalContact;
  notes?: string;
  dateContact?: string;
}

/* ═══════════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════════ */
const LS_KEY = "thor_pro_audition_renouvellements";

const TYPE_CONFIG: Record<TypeRappel, { label: string; bg: string; color: string }> = {
  renouvellement_appareil: { label: "Renouvellement (4 ans)",  bg: "rgba(99,102,241,0.10)",  color: "#4338ca" },
  controle_annuel:         { label: "Contrôle annuel",         bg: "rgba(6,182,212,0.10)",   color: "#0891b2" },
  commande_piles:          { label: "Commande piles",          bg: "rgba(245,158,11,0.10)",  color: "#b45309" },
  entretien:               { label: "Entretien",               bg: "rgba(16,185,129,0.10)",  color: "#047857" },
  remplacement_domes:      { label: "Remplacement dômes",      bg: "rgba(239,68,68,0.10)",   color: "#b91c1c" },
};

/* ═══════════════════════════════════════════════════════════════════════
   MOCK DATA (dates autour du 2026-03-24)
═══════════════════════════════════════════════════════════════════════ */
const MOCK_RAPPELS: RappelAudition[] = [
  { id: "r1",  patientNom: "Moreau",    patientPrenom: "Jean-Paul", patientTel: "06 12 34 56 78", appareil: "Phonak Lumity 90 R",        oreilles: "binaural", type: "controle_annuel",        dateEcheance: "2026-03-10", statut: "a_planifier" },
  { id: "r2",  patientNom: "Lefranc",   patientPrenom: "Simone",    patientTel: "06 23 45 67 89", appareil: "Oticon Intent 1 R",         oreilles: "binaural", type: "commande_piles",          dateEcheance: "2026-03-20", statut: "a_planifier" },
  { id: "r3",  patientNom: "Girard",    patientPrenom: "André",     patientTel: "06 34 56 78 90", appareil: "Starkey Evolv AI 2400 R",   oreilles: "OD",       type: "renouvellement_appareil", dateEcheance: "2026-03-25", statut: "a_planifier" },
  { id: "r4",  patientNom: "Bernard",   patientPrenom: "Lucie",     patientEmail: "lucie.bernard@email.fr", appareil: "Widex Moment Sheer", oreilles: "binaural", type: "entretien", dateEcheance: "2026-03-28", statut: "planifie", canal: "email", dateContact: "2026-03-21" },
  { id: "r5",  patientNom: "Martin",    patientPrenom: "Paul",      patientTel: "06 56 78 90 12", appareil: "ReSound Nexia",             oreilles: "OG",       type: "controle_annuel",        dateEcheance: "2026-04-05", statut: "a_planifier" },
  { id: "r6",  patientNom: "Rousseau",  patientPrenom: "Marie",     patientTel: "06 67 89 01 23", appareil: "Phonak Lumity 90 R",        oreilles: "binaural", type: "commande_piles",          dateEcheance: "2026-04-10", statut: "a_planifier" },
  { id: "r7",  patientNom: "Dupuis",    patientPrenom: "Robert",    patientTel: "06 78 90 12 34", appareil: "Signia Pure C&G",           oreilles: "binaural", type: "remplacement_domes",      dateEcheance: "2026-04-15", statut: "a_planifier" },
  { id: "r8",  patientNom: "Petit",     patientPrenom: "Claire",    patientEmail: "claire.petit@email.fr", appareil: "Oticon Real",       oreilles: "binaural", type: "renouvellement_appareil", dateEcheance: "2026-05-01", statut: "a_planifier" },
  { id: "r9",  patientNom: "Leroy",     patientPrenom: "Henri",     patientTel: "06 89 01 23 45", appareil: "Phonak Audéo Lumity",       oreilles: "binaural", type: "controle_annuel",        dateEcheance: "2026-06-15", statut: "a_planifier" },
  { id: "r10", patientNom: "Chevalier", patientPrenom: "Nathalie",  patientTel: "06 90 12 34 56", appareil: "Widex Moment Sheer 330",    oreilles: "OD",       type: "entretien",               dateEcheance: "2026-02-01", statut: "effectue",   dateContact: "2026-02-05" },
];

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════ */
function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}
function isoToday() {
  return new Date().toISOString().slice(0, 10);
}
function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

type UrgenceLevel = "retard" | "semaine" | "mois" | "avenir";

function getUrgence(dateEcheance: string, statut: StatutRappel): UrgenceLevel {
  if (statut === "effectue" || statut === "ignore") return "avenir";
  const today = new Date();
  const date = new Date(dateEcheance);
  const diff = (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return "retard";
  if (diff <= 7) return "semaine";
  if (diff <= 31) return "mois";
  return "avenir";
}

const URGENCE_CONFIG: Record<UrgenceLevel, { bg: string; text: string; label: string }> = {
  retard:  { bg: "rgba(239,68,68,0.12)",   text: "#b91c1c", label: "En retard" },
  semaine: { bg: "rgba(245,158,11,0.12)",  text: "#b45309", label: "Cette semaine" },
  mois:    { bg: "rgba(16,185,129,0.12)",  text: "#047857", label: "Ce mois" },
  avenir:  { bg: "rgba(148,163,184,0.10)", text: "#64748b", label: "À venir" },
};

/* ═══════════════════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════════════════ */
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: "#10b981",
      color: "#fff", borderRadius: 14, padding: "12px 20px",
      fontSize: 14, fontWeight: 600, boxShadow: "0 8px 32px rgba(16,185,129,0.35)",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <span>✓</span><span>{message}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MODAL NOUVEAU RAPPEL
═══════════════════════════════════════════════════════════════════════ */
function RappelModal({
  onSave,
  onClose,
}: {
  onSave: (r: RappelAudition) => void;
  onClose: () => void;
}) {
  const [patientNom, setPatientNom] = useState("");
  const [patientPrenom, setPatientPrenom] = useState("");
  const [patientTel, setPatientTel] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [appareil, setAppareil] = useState("");
  const [oreilles, setOreilles] = useState<RappelAudition["oreilles"]>("binaural");
  const [type, setType] = useState<TypeRappel>("controle_annuel");
  const [dateEcheance, setDateEcheance] = useState(isoToday());
  const [notes, setNotes] = useState("");

  function handleSave() {
    if (!patientNom || !patientPrenom || !appareil || !dateEcheance) return;
    onSave({
      id: genId(),
      patientNom, patientPrenom,
      patientTel: patientTel || undefined,
      patientEmail: patientEmail || undefined,
      appareil, oreilles, type, dateEcheance,
      statut: "a_planifier",
      notes: notes || undefined,
    });
  }

  const fieldLabel: CSSProperties = { fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{ ...glass, borderRadius: 20, width: "100%", maxWidth: 560, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(148,163,184,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", margin: 0 }}>Nouveau rappel</h2>
          <button onClick={onClose} style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ...glassSubtle, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#00C98A", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Patient</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={fieldLabel}>Nom *</label><input style={inputStyle} value={patientNom} onChange={e => setPatientNom(e.target.value)} /></div>
              <div><label style={fieldLabel}>Prénom *</label><input style={inputStyle} value={patientPrenom} onChange={e => setPatientPrenom(e.target.value)} /></div>
              <div><label style={fieldLabel}>Téléphone</label><input style={inputStyle} value={patientTel} onChange={e => setPatientTel(e.target.value)} /></div>
              <div><label style={fieldLabel}>Email</label><input style={inputStyle} value={patientEmail} onChange={e => setPatientEmail(e.target.value)} /></div>
            </div>
          </div>
          <div style={{ ...glassSubtle, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#00C98A", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Rappel</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={fieldLabel}>Type *</label>
                <select style={inputStyle} value={type} onChange={e => setType(e.target.value as TypeRappel)}>
                  {(Object.entries(TYPE_CONFIG) as [TypeRappel, { label: string }][]).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={fieldLabel}>Date échéance *</label>
                <input style={inputStyle} type="date" value={dateEcheance} onChange={e => setDateEcheance(e.target.value)} />
              </div>
              <div>
                <label style={fieldLabel}>Appareil *</label>
                <input style={inputStyle} value={appareil} onChange={e => setAppareil(e.target.value)} placeholder="Phonak Lumity 90 R" />
              </div>
              <div>
                <label style={fieldLabel}>Oreille(s)</label>
                <select style={inputStyle} value={oreilles} onChange={e => setOreilles(e.target.value as RappelAudition["oreilles"])}>
                  <option value="binaural">Binaural</option>
                  <option value="OD">OD</option>
                  <option value="OG">OG</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={fieldLabel}>Notes</label>
              <input style={inputStyle} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observations libres" />
            </div>
          </div>
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(148,163,184,0.15)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.3)", background: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>Annuler</button>
          <button onClick={handleSave} style={{ padding: "9px 24px", borderRadius: 10, border: "none", background: "#10b981", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 2px 8px rgba(16,185,129,0.30)" }}>Créer le rappel</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════════════════ */
export default function RenouvellementAuditionPage() {
  const [rappels, setRappels] = useState<RappelAudition[]>([]);
  const [filterType, setFilterType] = useState<TypeRappel | "Tous">("Tous");
  const [filterStatut, setFilterStatut] = useState<StatutRappel | "Tous">("Tous");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      setRappels(raw ? JSON.parse(raw) : MOCK_RAPPELS);
    } catch {
      setRappels(MOCK_RAPPELS);
    }
  }, []);

  const save = useCallback((data: RappelAudition[]) => {
    setRappels(data);
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }, []);

  function handleNewRappel(r: RappelAudition) {
    save([r, ...rappels]);
    setModalOpen(false);
    setToast("Rappel créé");
  }

  function handleEnvoyer(r: RappelAudition) {
    save(rappels.map(x => x.id === r.id ? { ...x, statut: "planifie" as StatutRappel, dateContact: isoToday() } : x));
    setToast("Rappel envoyé — statut mis à jour");
  }

  function handleEffectue(r: RappelAudition) {
    save(rappels.map(x => x.id === r.id ? { ...x, statut: "effectue" as StatutRappel } : x));
    setToast("Marqué comme effectué");
  }

  function handleIgnorer(r: RappelAudition) {
    save(rappels.map(x => x.id === r.id ? { ...x, statut: "ignore" as StatutRappel } : x));
  }

  // Filtered
  const filtered = rappels.filter(r => {
    const matchType = filterType === "Tous" || r.type === filterType;
    const matchStatut = filterStatut === "Tous" || r.statut === filterStatut;
    const q = search.toLowerCase();
    const matchSearch = !q || `${r.patientNom} ${r.patientPrenom} ${r.appareil}`.toLowerCase().includes(q);
    return matchType && matchStatut && matchSearch;
  });

  // Sort by urgence then date
  const sorted = [...filtered].sort((a, b) => {
    const urgOrder: Record<UrgenceLevel, number> = { retard: 0, semaine: 1, mois: 2, avenir: 3 };
    const ua = urgOrder[getUrgence(a.dateEcheance, a.statut)];
    const ub = urgOrder[getUrgence(b.dateEcheance, b.statut)];
    if (ua !== ub) return ua - ub;
    return a.dateEcheance.localeCompare(b.dateEcheance);
  });

  // Stats
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const enRetard = rappels.filter(r => getUrgence(r.dateEcheance, r.statut) === "retard").length;
  const enAttente = rappels.filter(r => r.statut === "a_planifier" || r.statut === "planifie").length;
  const effectuesMois = rappels.filter(r => {
    if (r.statut !== "effectue" || !r.dateContact) return false;
    const d = new Date(r.dateContact);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const STATUT_LABELS: Record<StatutRappel, string> = {
    a_planifier: "À planifier",
    planifie:    "Planifié",
    effectue:    "Effectué",
    ignore:      "Ignoré",
  };
  const STATUT_COLORS: Record<StatutRappel, { bg: string; text: string }> = {
    a_planifier: { bg: "rgba(245,158,11,0.12)",  text: "#b45309" },
    planifie:    { bg: "rgba(6,182,212,0.12)",   text: "#0891b2" },
    effectue:    { bg: "rgba(16,185,129,0.12)",  text: "#047857" },
    ignore:      { bg: "rgba(148,163,184,0.12)", text: "#64748b" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800 h-title">Renouvellements &amp; rappels</h1>
          <p className="mt-1 text-sm text-slate-500">Suivi : renouvellement 4 ans, contrôle annuel, piles, entretien, dômes</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          style={{ padding: "9px 18px", borderRadius: 12, border: "none", background: "#10b981", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 2px 8px rgba(16,185,129,0.25)" }}
        >
          + Nouveau rappel
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {[
          { label: "En retard",         value: enRetard,     color: "#ef4444" },
          { label: "En attente (total)", value: enAttente,    color: "#f59e0b" },
          { label: "Effectués ce mois",  value: effectuesMois, color: "#00C98A" },
        ].map(k => (
          <div key={k.label} style={{ ...glass, borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <input
          type="text" placeholder="Rechercher patient, appareil…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, width: 260, borderRadius: 12, ...glassSubtle }}
        />
        {/* Type filter */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            onClick={() => setFilterType("Tous")}
            style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", ...(filterType === "Tous" ? { background: "#10b981", color: "#fff", border: "none" } : { ...glassSubtle, color: "#64748b", border: "1px solid rgba(148,163,184,0.25)" }) }}
          >
            Tous types
          </button>
          {(Object.entries(TYPE_CONFIG) as [TypeRappel, { label: string }][]).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setFilterType(k)}
              style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", ...(filterType === k ? { background: "#10b981", color: "#fff", border: "none" } : { ...glassSubtle, color: "#64748b", border: "1px solid rgba(148,163,184,0.25)" }) }}
            >
              {v.label}
            </button>
          ))}
        </div>
        {/* Statut filter */}
        <div style={{ display: "flex", gap: 6 }}>
          {(["Tous", "a_planifier", "planifie", "effectue"] as Array<StatutRappel | "Tous">).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatut(s)}
              style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", ...(filterStatut === s ? { background: "rgba(0,201,138,0.15)", color: "#059669", border: "1px solid rgba(0,201,138,0.3)" } : { ...glassSubtle, color: "#64748b", border: "1px solid rgba(148,163,184,0.25)" }) }}
            >
              {s === "Tous" ? "Tous statuts" : STATUT_LABELS[s as StatutRappel]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ ...glass, borderRadius: 18, overflow: "hidden" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 140px 80px 130px 120px 130px 140px 180px",
          gap: 0, padding: "10px 20px", borderBottom: "1px solid rgba(148,163,184,0.12)",
          fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8",
        }}>
          <span>Patient</span><span>Appareil</span><span>Oreilles</span>
          <span>Type</span><span>Échéance</span><span>Urgence</span><span>Statut</span><span>Actions</span>
        </div>

        {sorted.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
            Aucun rappel trouvé.
          </div>
        ) : sorted.map(r => {
          const urgence = getUrgence(r.dateEcheance, r.statut);
          const urgCfg = URGENCE_CONFIG[urgence];
          const statutCfg = STATUT_COLORS[r.statut];
          return (
            <div
              key={r.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 140px 80px 130px 120px 130px 140px 180px",
                gap: 0, padding: "12px 20px", borderBottom: "1px solid rgba(148,163,184,0.08)",
                alignItems: "center",
              }}
              className="hover:bg-emerald-50/20 transition-colors"
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{r.patientPrenom} {r.patientNom}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  {r.patientTel ?? r.patientEmail ?? "—"}
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#1e293b", fontWeight: 500 }}>{r.appareil}</div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: "rgba(0,201,138,0.1)", color: "#059669" }}>
                  {r.oreilles}
                </span>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12, background: TYPE_CONFIG[r.type].bg, color: TYPE_CONFIG[r.type].color }}>
                  {TYPE_CONFIG[r.type].label}
                </span>
              </div>
              <div style={{ fontSize: 12, color: urgence === "retard" ? "#ef4444" : "#64748b", fontWeight: urgence === "retard" ? 700 : 400 }}>
                {fmtDate(r.dateEcheance)}
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: urgCfg.bg, color: urgCfg.text }}>
                  {urgCfg.label}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, display: "inline-block", background: statutCfg.bg, color: statutCfg.text }}>
                  {STATUT_LABELS[r.statut]}
                </span>
                {r.dateContact && <span style={{ fontSize: 10, color: "#94a3b8" }}>Contact: {fmtDate(r.dateContact)}</span>}
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {r.statut === "a_planifier" && (
                  <button
                    onClick={() => handleEnvoyer(r)}
                    style={{ padding: "4px 10px", borderRadius: 8, border: "none", background: "rgba(6,182,212,0.12)", color: "#0891b2", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                  >
                    Envoyer rappel
                  </button>
                )}
                {(r.statut === "a_planifier" || r.statut === "planifie") && (
                  <button
                    onClick={() => handleEffectue(r)}
                    style={{ padding: "4px 10px", borderRadius: 8, border: "none", background: "rgba(16,185,129,0.12)", color: "#047857", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                  >
                    Effectué ✓
                  </button>
                )}
                {r.statut === "a_planifier" && (
                  <button
                    onClick={() => handleIgnorer(r)}
                    style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.2)", background: "var(--glass-subtle-bg)", color: "#94a3b8", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                  >
                    Ignorer
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && <RappelModal onSave={handleNewRappel} onClose={() => setModalOpen(false)} />}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
