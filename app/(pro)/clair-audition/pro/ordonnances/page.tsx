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
type TypePrescription = "primo-appareillage" | "renouvellement";
type OreilleConcernee = "binaural" | "OD" | "OG";

interface OrdonnanceAudition {
  id: string;
  numero: string;
  patientNom: string;
  patientPrenom: string;
  dateOrdonnance: string;
  dateExpiration: string;
  medecin: string;
  specialite: "ORL" | "Généraliste" | "Pédiatre";
  rpps: string;
  type: TypePrescription;
  oreilles: OreilleConcernee;
  diagnostic?: string;
  bilanId?: string;
  bilanNumero?: string;
  remarques?: string;
  createdAt: string;
}

/* ═══════════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════════ */
const LS_KEY = "thor_pro_audition_ordonnances";

/* ═══════════════════════════════════════════════════════════════════════
   MOCK DATA
═══════════════════════════════════════════════════════════════════════ */
const MOCK_ORDO: OrdonnanceAudition[] = [
  {
    id: "o1", numero: "ORL-2026-001", patientNom: "Moreau", patientPrenom: "Jean-Paul",
    dateOrdonnance: "2026-01-15", dateExpiration: "2031-01-15",
    medecin: "Dr. Catherine Rousseau", specialite: "ORL", rpps: "10005678901",
    type: "primo-appareillage", oreilles: "binaural",
    diagnostic: "Presbyacousie bilatérale — perte 45 dB HL moyenne",
    createdAt: "2026-01-16T09:00:00Z",
  },
  {
    id: "o2", numero: "ORL-2026-002", patientNom: "Lefranc", patientPrenom: "Simone",
    dateOrdonnance: "2026-02-03", dateExpiration: "2031-02-03",
    medecin: "Dr. Antoine Mercier", specialite: "ORL", rpps: "10009876543",
    type: "renouvellement", oreilles: "binaural",
    diagnostic: "Renouvellement — appareillage binaural depuis 2022",
    createdAt: "2026-02-04T10:00:00Z",
  },
  {
    id: "o3", numero: "ORL-2026-003", patientNom: "Bernard", patientPrenom: "Lucie",
    dateOrdonnance: "2021-04-10", dateExpiration: "2026-04-10",
    medecin: "Dr. Marie-Claire Fontaine", specialite: "ORL", rpps: "10003456789",
    type: "primo-appareillage", oreilles: "OD",
    diagnostic: "Surdité unilatérale droite post-traumatique",
    createdAt: "2021-04-11T14:00:00Z",
  },
  {
    id: "o4", numero: "ORL-2025-015", patientNom: "Martin", patientPrenom: "Paul",
    dateOrdonnance: "2025-12-01", dateExpiration: "2030-12-01",
    medecin: "Dr. Catherine Rousseau", specialite: "ORL", rpps: "10005678901",
    type: "renouvellement", oreilles: "OG",
    diagnostic: "Renouvellement OG — progression depuis contrôle 2025",
    createdAt: "2025-12-02T09:30:00Z",
  },
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
function addYears(iso: string, years: number): string {
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}
function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
function genNumero(existing: OrdonnanceAudition[]): string {
  const year = new Date().getFullYear();
  const nums = existing
    .map(o => { const m = o.numero.match(/ORL-\d{4}-(\d+)/); return m ? parseInt(m[1], 10) : 0; })
    .filter(n => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `ORL-${year}-${String(next).padStart(3, "0")}`;
}

type ValiditeStatus = "active" | "expiree" | "bientot";

function getValiditeStatus(dateExpiration: string): ValiditeStatus {
  const today = new Date();
  const exp = new Date(dateExpiration);
  const diff = (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return "expiree";
  if (diff <= 30) return "bientot";
  return "active";
}

/* ═══════════════════════════════════════════════════════════════════════
   VALIDITE BADGE
═══════════════════════════════════════════════════════════════════════ */
function ValiditeBadge({ dateExpiration }: { dateExpiration: string }) {
  const status = getValiditeStatus(dateExpiration);
  const configs: Record<ValiditeStatus, { bg: string; text: string; label: string }> = {
    active:   { bg: "rgba(16,185,129,0.12)",  text: "#047857", label: "Active" },
    bientot:  { bg: "rgba(245,158,11,0.12)",  text: "#b45309", label: "Bientôt expirée" },
    expiree:  { bg: "rgba(239,68,68,0.12)",   text: "#b91c1c", label: "Expirée" },
  };
  const cfg = configs[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: cfg.bg, color: cfg.text,
    }}>
      {cfg.label}
    </span>
  );
}

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
   MODAL CRÉATION / ÉDITION
═══════════════════════════════════════════════════════════════════════ */
function OrdonnanceModal({
  initial,
  allOrdonnances,
  onSave,
  onClose,
}: {
  initial?: OrdonnanceAudition;
  allOrdonnances: OrdonnanceAudition[];
  onSave: (o: OrdonnanceAudition) => void;
  onClose: () => void;
}) {
  const [patientNom, setPatientNom] = useState(initial?.patientNom ?? "");
  const [patientPrenom, setPatientPrenom] = useState(initial?.patientPrenom ?? "");
  const [dateOrdonnance, setDateOrdonnance] = useState(initial?.dateOrdonnance ?? isoToday());
  const [validiteAns, setValiditeAns] = useState(5);
  const [medecin, setMedecin] = useState(initial?.medecin ?? "");
  const [specialite, setSpecialite] = useState<OrdonnanceAudition["specialite"]>(initial?.specialite ?? "ORL");
  const [rpps, setRpps] = useState(initial?.rpps ?? "");
  const [type, setType] = useState<TypePrescription>(initial?.type ?? "primo-appareillage");
  const [oreilles, setOreilles] = useState<OreilleConcernee>(initial?.oreilles ?? "binaural");
  const [diagnostic, setDiagnostic] = useState(initial?.diagnostic ?? "");
  const [bilanNumero, setBilanNumero] = useState(initial?.bilanNumero ?? "");
  const [remarques, setRemarques] = useState(initial?.remarques ?? "");

  const dateExpiration = addYears(dateOrdonnance, validiteAns);

  function handleSave() {
    if (!patientNom || !patientPrenom || !medecin || !rpps || !dateOrdonnance) return;
    const ordo: OrdonnanceAudition = {
      id: initial?.id ?? genId(),
      numero: initial?.numero ?? genNumero(allOrdonnances),
      patientNom, patientPrenom,
      dateOrdonnance, dateExpiration,
      medecin, specialite, rpps,
      type, oreilles,
      diagnostic: diagnostic || undefined,
      bilanNumero: bilanNumero || undefined,
      remarques: remarques || undefined,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    onSave(ordo);
  }

  const fieldLabel: CSSProperties = { fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" };
  const row2: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        ...glass, borderRadius: 20, width: "100%", maxWidth: 640,
        maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(148,163,184,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", margin: 0 }}>
              {initial ? `Modifier ${initial.numero}` : "Nouvelle ordonnance ORL"}
            </h2>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>Obligatoire pour remboursement SS — validité 5 ans adultes</p>
          </div>
          <button onClick={onClose} style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Patient */}
          <div style={{ ...glassSubtle, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#00C98A", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Patient</p>
            <div style={row2}>
              <div><label style={fieldLabel}>Nom *</label><input style={inputStyle} value={patientNom} onChange={e => setPatientNom(e.target.value)} placeholder="Moreau" /></div>
              <div><label style={fieldLabel}>Prénom *</label><input style={inputStyle} value={patientPrenom} onChange={e => setPatientPrenom(e.target.value)} placeholder="Jean-Paul" /></div>
            </div>
          </div>

          {/* Prescripteur */}
          <div style={{ ...glassSubtle, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#00C98A", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Prescripteur</p>
            <div style={row2}>
              <div><label style={fieldLabel}>Médecin *</label><input style={inputStyle} value={medecin} onChange={e => setMedecin(e.target.value)} placeholder="Dr. Catherine Rousseau" /></div>
              <div>
                <label style={fieldLabel}>Spécialité</label>
                <select style={inputStyle} value={specialite} onChange={e => setSpecialite(e.target.value as OrdonnanceAudition["specialite"])}>
                  <option>ORL</option>
                  <option>Généraliste</option>
                  <option>Pédiatre</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={fieldLabel}>N° RPPS *</label>
              <input style={{ ...inputStyle, width: 220 }} value={rpps} onChange={e => setRpps(e.target.value)} placeholder="10005678901" />
            </div>
          </div>

          {/* Prescription */}
          <div style={{ ...glassSubtle, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#00C98A", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Prescription</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 80px", gap: 12 }}>
              <div>
                <label style={fieldLabel}>Date ordonnance *</label>
                <input style={inputStyle} type="date" value={dateOrdonnance} onChange={e => setDateOrdonnance(e.target.value)} />
              </div>
              <div>
                <label style={fieldLabel}>Type</label>
                <select style={inputStyle} value={type} onChange={e => setType(e.target.value as TypePrescription)}>
                  <option value="primo-appareillage">Primo-appareillage</option>
                  <option value="renouvellement">Renouvellement</option>
                </select>
              </div>
              <div>
                <label style={fieldLabel}>Oreille(s)</label>
                <select style={inputStyle} value={oreilles} onChange={e => setOreilles(e.target.value as OreilleConcernee)}>
                  <option value="binaural">Binaural</option>
                  <option value="OD">OD (droit)</option>
                  <option value="OG">OG (gauche)</option>
                </select>
              </div>
              <div>
                <label style={fieldLabel}>Validité</label>
                <select style={inputStyle} value={validiteAns} onChange={e => setValiditeAns(Number(e.target.value))}>
                  <option value={5}>5 ans</option>
                  <option value={3}>3 ans</option>
                  <option value={1}>1 an</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Expire le :</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{fmtDate(dateExpiration)}</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={fieldLabel}>Diagnostic</label>
              <input style={inputStyle} value={diagnostic} onChange={e => setDiagnostic(e.target.value)} placeholder="Presbyacousie bilatérale — perte 45 dB HL" />
            </div>
          </div>

          {/* Liens & remarques */}
          <div style={{ ...glassSubtle, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#00C98A", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Liens & remarques</p>
            <div style={row2}>
              <div>
                <label style={fieldLabel}>N° bilan lié</label>
                <input style={inputStyle} value={bilanNumero} onChange={e => setBilanNumero(e.target.value)} placeholder="BIL-2026-001" />
              </div>
              <div>
                <label style={fieldLabel}>Remarques</label>
                <input style={inputStyle} value={remarques} onChange={e => setRemarques(e.target.value)} placeholder="Observations libres" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(148,163,184,0.15)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.3)", background: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>
            Annuler
          </button>
          <button onClick={handleSave} style={{ padding: "9px 24px", borderRadius: 10, border: "none", background: "#10b981", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 2px 8px rgba(16,185,129,0.30)" }}>
            {initial ? "Enregistrer" : "Créer l'ordonnance"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════════════════ */
export default function OrdonnancesAuditionPage() {
  const [ordonnances, setOrdonnances] = useState<OrdonnanceAudition[]>([]);
  const [filterTab, setFilterTab] = useState<"Toutes" | "Actives" | "Expirées" | "Bientôt expirées">("Toutes");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editOrdo, setEditOrdo] = useState<OrdonnanceAudition | undefined>();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      setOrdonnances(raw ? JSON.parse(raw) : MOCK_ORDO);
    } catch {
      setOrdonnances(MOCK_ORDO);
    }
  }, []);

  const save = useCallback((data: OrdonnanceAudition[]) => {
    setOrdonnances(data);
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }, []);

  function handleSave(o: OrdonnanceAudition) {
    const updated = editOrdo
      ? ordonnances.map(x => x.id === o.id ? o : x)
      : [o, ...ordonnances];
    save(updated);
    setModalOpen(false);
    setEditOrdo(undefined);
    setToast(editOrdo ? "Ordonnance mise à jour" : "Ordonnance enregistrée");
  }

  const filtered = ordonnances.filter(o => {
    const status = getValiditeStatus(o.dateExpiration);
    const matchTab =
      filterTab === "Toutes" ||
      (filterTab === "Actives" && status === "active") ||
      (filterTab === "Expirées" && status === "expiree") ||
      (filterTab === "Bientôt expirées" && status === "bientot");
    const q = search.toLowerCase();
    const matchSearch = !q || `${o.patientNom} ${o.patientPrenom} ${o.medecin} ${o.numero}`.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  // Stats
  const actives = ordonnances.filter(o => getValiditeStatus(o.dateExpiration) === "active").length;
  const bientot = ordonnances.filter(o => getValiditeStatus(o.dateExpiration) === "bientot").length;
  const expirees = ordonnances.filter(o => getValiditeStatus(o.dateExpiration) === "expiree").length;

  const TABS: Array<"Toutes" | "Actives" | "Expirées" | "Bientôt expirées"> = ["Toutes", "Actives", "Bientôt expirées", "Expirées"];

  const TYPE_LABELS: Record<TypePrescription, string> = {
    "primo-appareillage": "Primo",
    "renouvellement":     "Renouvellement",
  };
  const OREILLE_LABELS: Record<OreilleConcernee, string> = {
    binaural: "Binaural",
    OD: "OD",
    OG: "OG",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800 h-title">Ordonnances ORL</h1>
          <p className="mt-1 text-sm text-slate-500">Prescriptions médicales — obligatoires pour remboursement SS</p>
        </div>
        <button
          onClick={() => { setEditOrdo(undefined); setModalOpen(true); }}
          style={{ padding: "9px 18px", borderRadius: 12, border: "none", background: "#10b981", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 2px 8px rgba(16,185,129,0.25)" }}
        >
          + Nouvelle ordonnance
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {[
          { label: "Ordonnances actives", value: actives, color: "#00C98A" },
          { label: "Bientôt expirées (<30 j)", value: bientot, color: "#f59e0b" },
          { label: "Expirées", value: expirees, color: "#ef4444" },
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
          type="text" placeholder="Rechercher patient, médecin, N°…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, width: 280, borderRadius: 12, ...glassSubtle }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setFilterTab(t)}
              style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                ...(filterTab === t
                  ? { background: "#10b981", color: "#fff", border: "none", boxShadow: "0 2px 8px rgba(16,185,129,0.25)" }
                  : { ...glassSubtle, color: "#64748b", border: "1px solid rgba(148,163,184,0.25)" }
                ),
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ ...glass, borderRadius: 18, overflow: "hidden" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "120px 1fr 110px 1fr 90px 90px 120px 130px 100px",
          gap: 0, padding: "10px 20px", borderBottom: "1px solid rgba(148,163,184,0.12)",
          fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8",
        }}>
          <span>N°</span><span>Patient</span><span>Date</span><span>Médecin ORL</span>
          <span>Type</span><span>Oreille(s)</span><span>Expire le</span><span>Statut</span><span>Actions</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
            Aucune ordonnance trouvée.
          </div>
        ) : filtered.map(o => (
          <div
            key={o.id}
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr 110px 1fr 90px 90px 120px 130px 100px",
              gap: 0, padding: "12px 20px", borderBottom: "1px solid rgba(148,163,184,0.08)",
              alignItems: "center",
            }}
            className="hover:bg-emerald-50/20 transition-colors"
          >
            <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{o.numero}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{o.patientPrenom} {o.patientNom}</div>
              {o.bilanNumero && <div style={{ fontSize: 10, color: "#94a3b8" }}>Bilan: {o.bilanNumero}</div>}
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{fmtDate(o.dateOrdonnance)}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{o.medecin}</div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>{o.specialite} · RPPS {o.rpps}</div>
            </div>
            <div>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12,
                background: o.type === "primo-appareillage" ? "rgba(99,102,241,0.1)" : "rgba(6,182,212,0.1)",
                color: o.type === "primo-appareillage" ? "#4338ca" : "#0891b2",
              }}>
                {TYPE_LABELS[o.type]}
              </span>
            </div>
            <div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
                background: "rgba(0,201,138,0.1)", color: "#059669",
              }}>
                {OREILLE_LABELS[o.oreilles]}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{fmtDate(o.dateExpiration)}</div>
            <div><ValiditeBadge dateExpiration={o.dateExpiration} /></div>
            <div>
              <button
                onClick={() => { setEditOrdo(o); setModalOpen(true); }}
                style={{ padding: "4px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.2)", background: "var(--glass-subtle-bg)", color: "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
              >
                Modifier
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <OrdonnanceModal
          initial={editOrdo}
          allOrdonnances={ordonnances}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditOrdo(undefined); }}
        />
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
