"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { CSSProperties, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

/* ── Design tokens ───────────────────────────────────────────────────────── */
const ACCENT = "#2D8CFF";

const glass: CSSProperties = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--glass-border)",
  borderRadius: 18,
  boxShadow: "0 8px 32px rgba(0,0,0,0.07)",
};

const card: CSSProperties = {
  ...glass,
  padding: "28px 32px",
  marginBottom: 20,
};

const sectionTitle: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: "#1a2233",
  letterSpacing: 0.2,
  marginBottom: 18,
  paddingBottom: 10,
  borderBottom: "1px solid rgba(45,140,255,0.15)",
};

const label: CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#4B5563",
  marginBottom: 4,
  letterSpacing: 0.3,
  textTransform: "uppercase",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 10,
  border: "1px solid rgba(45,140,255,0.25)",
  background: "var(--glass-strong-bg)",
  fontSize: 14,
  color: "#1a2233",
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle: CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

const colHeader: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: ACCENT,
  textAlign: "center",
  marginBottom: 10,
  letterSpacing: 0.5,
};

/* ── Types ───────────────────────────────────────────────────────────────── */
interface StoredPatient {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance?: string;
  telephone?: string;
  email?: string;
  mutuelle?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  numeroSS?: string;
  notes?: string;
  createdAt?: string;
}

interface RefractionEye {
  sphere: string;
  cylindre: string;
  axe: string;
  addition: string;
  avl: string;
  avp: string;
  di: string;
}

interface KeratomEye {
  k1: string;
  k2: string;
  axe: string;
}

interface PrescriptionEye {
  sphere: string;
  cylindre: string;
  axe: string;
  addition: string;
  avl: string;
  avp: string;
  di: string;
}

interface ConsultationData {
  id: string;
  date: string;
  patientId: string;
  patientNom: string;
  patientPrenom: string;
  praticien: string;
  motif: string;
  refractionOD: RefractionEye;
  refractionOG: RefractionEye;
  keratomOD: KeratomEye;
  keratomOG: KeratomEye;
  prescriptionIdentique: boolean;
  prescriptionOD: PrescriptionEye;
  prescriptionOG: PrescriptionEye;
  equipType: string;
  equipMateriaux: string;
  equipTraitement: string;
  equipNotes: string;
  tiersPayant: boolean;
  tiersPayantCaisse: string;
  tiersPayantMutuelle: string;
  createdAt: string;
}

const emptyRefraction = (): RefractionEye => ({
  sphere: "",
  cylindre: "",
  axe: "",
  addition: "",
  avl: "",
  avp: "",
  di: "",
});

const emptyKeratom = (): KeratomEye => ({
  k1: "",
  k2: "",
  axe: "",
});

const emptyPrescription = (): PrescriptionEye => ({
  sphere: "",
  cylindre: "",
  axe: "",
  addition: "",
  avl: "",
  avp: "",
  di: "",
});

const AV_OPTIONS = [
  "", "10/10", "9/10", "8/10", "7/10", "6/10", "5/10",
  "4/10", "3/10", "2/10", "1/10", "PL", "NPL",
];

/* ── Sub-components ──────────────────────────────────────────────────────── */
function RefractionCol({
  label: eyeLabel,
  data,
  onChange,
}: {
  label: string;
  data: RefractionEye;
  onChange: (field: keyof RefractionEye, value: string) => void;
}) {
  return (
    <div style={{ flex: 1 }}>
      <div style={colHeader}>{eyeLabel}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label style={label}>Sphère</label>
          <input
            type="number"
            step="0.25"
            placeholder="ex: -2.00"
            value={data.sphere}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange("sphere", e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={label}>Cylindre</label>
          <input
            type="number"
            step="0.25"
            placeholder="ex: -0.75"
            value={data.cylindre}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange("cylindre", e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={label}>Axe (°)</label>
          <input
            type="number"
            step="1"
            min="0"
            max="180"
            placeholder="ex: 90"
            value={data.axe}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange("axe", e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={label}>Addition</label>
          <input
            type="number"
            step="0.25"
            placeholder="ex: +2.00"
            value={data.addition}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange("addition", e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={label}>AVL corrigée</label>
          <select
            value={data.avl}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange("avl", e.target.value)}
            style={selectStyle}
          >
            {AV_OPTIONS.map((o) => (
              <option key={o} value={o}>{o || "—"}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={label}>AVP corrigée</label>
          <select
            value={data.avp}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange("avp", e.target.value)}
            style={selectStyle}
          >
            {AV_OPTIONS.map((o) => (
              <option key={o} value={o}>{o || "—"}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={label}>DI (mm)</label>
          <input
            type="number"
            step="0.5"
            placeholder="ex: 32.0"
            value={data.di}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange("di", e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );
}

function KeratomCol({
  label: eyeLabel,
  data,
  onChange,
}: {
  label: string;
  data: KeratomEye;
  onChange: (field: keyof KeratomEye, value: string) => void;
}) {
  return (
    <div style={{ flex: 1 }}>
      <div style={colHeader}>{eyeLabel}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label style={label}>K1 (D)</label>
          <input
            type="number"
            step="0.01"
            placeholder="ex: 43.25"
            value={data.k1}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange("k1", e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={label}>K2 (D)</label>
          <input
            type="number"
            step="0.01"
            placeholder="ex: 44.00"
            value={data.k2}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange("k2", e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={label}>Axe (°)</label>
          <input
            type="number"
            step="1"
            min="0"
            max="180"
            placeholder="ex: 5"
            value={data.axe}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange("axe", e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );
}

function PrescriptionCol({
  label: eyeLabel,
  data,
  onChange,
  disabled,
}: {
  label: string;
  data: PrescriptionEye;
  onChange: (field: keyof PrescriptionEye, value: string) => void;
  disabled: boolean;
}) {
  const base: CSSProperties = {
    ...inputStyle,
    opacity: disabled ? 0.5 : 1,
    pointerEvents: disabled ? "none" : "auto",
  };
  return (
    <div style={{ flex: 1 }}>
      <div style={colHeader}>{eyeLabel}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(["sphere", "cylindre", "axe", "addition"] as const).map((f) => (
          <div key={f}>
            <label style={label}>
              {f === "sphere" ? "Sphère" : f === "cylindre" ? "Cylindre" : f === "axe" ? "Axe (°)" : "Addition"}
            </label>
            <input
              type="number"
              step={f === "axe" ? "1" : "0.25"}
              min={f === "axe" ? "0" : undefined}
              max={f === "axe" ? "180" : undefined}
              value={data[f]}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(f, e.target.value)}
              style={base}
              disabled={disabled}
            />
          </div>
        ))}
        {(["avl", "avp"] as const).map((f) => (
          <div key={f}>
            <label style={label}>{f === "avl" ? "AVL corrigée" : "AVP corrigée"}</label>
            <select
              value={data[f]}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(f, e.target.value)}
              style={{ ...base, cursor: disabled ? "default" : "pointer" }}
              disabled={disabled}
            >
              {AV_OPTIONS.map((o) => (
                <option key={o} value={o}>{o || "—"}</option>
              ))}
            </select>
          </div>
        ))}
        <div>
          <label style={label}>DI (mm)</label>
          <input
            type="number"
            step="0.5"
            value={data.di}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange("di", e.target.value)}
            style={base}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Patient Picker ──────────────────────────────────────────────────────── */
function calcAge(dob?: string): string {
  if (!dob) return "";
  const y = dob.match(/\d{4}/)?.[0];
  if (!y) return "";
  return `${new Date().getFullYear() - parseInt(y)} ans`;
}

function PatientPicker({
  patients,
  onSelect,
}: {
  patients: StoredPatient[];
  onSelect: (p: StoredPatient | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<StoredPatient | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = patients
    .filter(p => {
      const q = query.toLowerCase();
      return (
        `${p.prenom} ${p.nom}`.toLowerCase().includes(q) ||
        `${p.nom} ${p.prenom}`.toLowerCase().includes(q)
      );
    })
    .slice(0, 8);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  function select(p: StoredPatient) {
    setSelected(p);
    setOpen(false);
    setQuery("");
    onSelect(p);
  }

  function clear() {
    setSelected(null);
    setQuery("");
    onSelect(null);
  }

  function initials(p: StoredPatient) {
    return ((p.prenom[0] ?? "") + (p.nom[0] ?? "")).toUpperCase();
  }

  const bg = ACCENT;

  if (selected) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, background: `${ACCENT}0d`, border: `1.5px solid ${ACCENT}40`, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
            {initials(selected)}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{selected.prenom} {selected.nom}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              {calcAge(selected.dateNaissance)}
              {selected.mutuelle ? ` · ${selected.mutuelle}` : ""}
              {selected.telephone ? ` · ${selected.telephone}` : ""}
            </div>
          </div>
        </div>
        <button onClick={clear} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,.1)", background: "rgba(255,255,255,.9)", fontSize: 12, fontWeight: 600, color: "#64748b", cursor: "pointer", flexShrink: 0 }}>
          Changer
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#94a3b8", pointerEvents: "none" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={patients.length > 0 ? `Rechercher parmi ${patients.length} patient${patients.length > 1 ? "s" : ""}…` : "Aucun patient enregistré"}
          style={{ ...inputStyle, paddingLeft: 34 }}
        />
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "rgba(255,255,255,.98)", borderRadius: 12, border: "1px solid rgba(0,0,0,.08)", boxShadow: "0 8px 32px rgba(0,0,0,.14)", zIndex: 300, overflow: "hidden" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "14px 16px", fontSize: 13, color: "#94a3b8", textAlign: "center" }}>
              {patients.length === 0
                ? <span>Aucun patient enregistré — <a href="/clair-vision/pro/patients" style={{ color: ACCENT, fontWeight: 600 }}>Ajouter →</a></span>
                : "Aucun résultat"
              }
            </div>
          ) : (
            filtered.map(p => (
              <button key={p.id} onClick={() => select(p)}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid rgba(0,0,0,.04)", cursor: "pointer", textAlign: "left" }}
                onMouseOver={e => (e.currentTarget.style.background = "rgba(45,140,255,.04)")}
                onMouseOut={e => (e.currentTarget.style.background = "none")}
              >
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                  {initials(p)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{p.prenom} {p.nom}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                    {calcAge(p.dateNaissance)}
                    {p.mutuelle ? ` · ${p.mutuelle}` : ""}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function ConsultationPage() {
  const router = useRouter();

  /* state */
  const [patients, setPatients] = useState<StoredPatient[]>([]);
  const [patientId, setPatientId] = useState<string>("");
  const [praticien, setPraticien] = useState<string>("Dr.");
  const [motif, setMotif] = useState<string>("Contrôle");
  const today = new Date().toISOString().slice(0, 10);

  const [refractionOD, setRefractionOD] = useState<RefractionEye>(emptyRefraction());
  const [refractionOG, setRefractionOG] = useState<RefractionEye>(emptyRefraction());

  const [keratomOD, setKeratomOD] = useState<KeratomEye>(emptyKeratom());
  const [keratomOG, setKeratomOG] = useState<KeratomEye>(emptyKeratom());

  const [prescIdentique, setPrescIdentique] = useState<boolean>(false);
  const [prescriptionOD, setPrescriptionOD] = useState<PrescriptionEye>(emptyPrescription());
  const [prescriptionOG, setPrescriptionOG] = useState<PrescriptionEye>(emptyPrescription());

  const [equipType, setEquipType] = useState<string>("Monofocaux");
  const [equipMateriaux, setEquipMateriaux] = useState<string>("Organique");
  const [equipTraitement, setEquipTraitement] = useState<string>("AR");
  const [equipNotes, setEquipNotes] = useState<string>("");

  const [tiersPayant, setTiersPayant] = useState<boolean>(false);
  const [tiersPayantCaisse, setTiersPayantCaisse] = useState<string>("");
  const [tiersPayantMutuelle, setTiersPayantMutuelle] = useState<string>("");

  const [toast, setToast] = useState<string | null>(null);
  const [lastConsultationId, setLastConsultationId] = useState<string | null>(null);
  const [preConsultData, setPreConsultData] = useState<Record<string, unknown> | null>(null);
  const [preConsultOpen, setPreConsultOpen] = useState(false);

  /* load from localStorage */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("thor_pro_patients");
      if (raw) setPatients(JSON.parse(raw) as StoredPatient[]);
    } catch { /* ignore */ }
    try {
      const user = localStorage.getItem("thor_pro_vision_current_user");
      if (user) setPraticien(user);
    } catch { /* ignore */ }
    // Load today's pre-consultation form if any
    try {
      const today = new Date().toISOString().split("T")[0];
      const key = `thor_pre_consult_vision_${today}`;
      const raw = localStorage.getItem(key);
      if (raw) setPreConsultData(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  /* sync prescription when "identique" toggled */
  useEffect(() => {
    if (prescIdentique) {
      setPrescriptionOD({ ...refractionOD });
      setPrescriptionOG({ ...refractionOG });
    }
  }, [prescIdentique, refractionOD, refractionOG]);

  /* helpers */
  const updateRefrOD = useCallback((field: keyof RefractionEye, value: string) => {
    setRefractionOD((prev) => ({ ...prev, [field]: value }));
  }, []);
  const updateRefrOG = useCallback((field: keyof RefractionEye, value: string) => {
    setRefractionOG((prev) => ({ ...prev, [field]: value }));
  }, []);
  const updateKerOD = useCallback((field: keyof KeratomEye, value: string) => {
    setKeratomOD((prev) => ({ ...prev, [field]: value }));
  }, []);
  const updateKerOG = useCallback((field: keyof KeratomEye, value: string) => {
    setKeratomOG((prev) => ({ ...prev, [field]: value }));
  }, []);
  const updatePrescOD = useCallback((field: keyof PrescriptionEye, value: string) => {
    setPrescriptionOD((prev) => ({ ...prev, [field]: value }));
  }, []);
  const updatePrescOG = useCallback((field: keyof PrescriptionEye, value: string) => {
    setPrescriptionOG((prev) => ({ ...prev, [field]: value }));
  }, []);

  const selectedPatient = patients.find((p) => p.id === patientId) ?? null;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleSave() {
    const id = `consult_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const record: ConsultationData = {
      id,
      date: today,
      patientId,
      patientNom: selectedPatient?.nom ?? "",
      patientPrenom: selectedPatient?.prenom ?? "",
      praticien,
      motif,
      refractionOD,
      refractionOG,
      keratomOD,
      keratomOG,
      prescriptionIdentique: prescIdentique,
      prescriptionOD: prescIdentique ? { ...refractionOD } : prescriptionOD,
      prescriptionOG: prescIdentique ? { ...refractionOG } : prescriptionOG,
      equipType,
      equipMateriaux,
      equipTraitement,
      equipNotes,
      tiersPayant,
      tiersPayantCaisse,
      tiersPayantMutuelle,
      createdAt: new Date().toISOString(),
    };
    try {
      const raw = localStorage.getItem("thor_pro_vision_consultations");
      const existing: ConsultationData[] = raw ? (JSON.parse(raw) as ConsultationData[]) : [];
      existing.push(record);
      localStorage.setItem("thor_pro_vision_consultations", JSON.stringify(existing));
      setLastConsultationId(id);
      showToast("Consultation enregistrée");
    } catch {
      showToast("Erreur lors de l'enregistrement");
    }
  }

  function handleDevis() {
    if (!lastConsultationId) return;
    router.push(`/clair-vision/pro/devis?from=consultation&consultationId=${lastConsultationId}`);
  }

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#22c55e",
            color: "#fff",
            padding: "12px 28px",
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 15,
            boxShadow: "0 4px 20px rgba(34,197,94,0.35)",
            zIndex: 9999,
            letterSpacing: 0.2,
          }}
        >
          {toast}
        </div>
      )}

      <div>

        {/* Pre-consultation banner */}
        {preConsultData && (
          <div style={{ marginBottom: 20, background: "linear-gradient(135deg,rgba(45,140,255,0.10),rgba(45,140,255,0.04))", border: "1.5px solid rgba(45,140,255,0.30)", borderRadius: 16, padding: "14px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}></span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1e40af", marginBottom: 2 }}>Formulaire pré-consultation reçu aujourd&apos;hui</div>
                  <div style={{ fontSize: 13, color: "#3b82f6" }}>
                    {preConsultData.motif ? `Motif : ${preConsultData.motif as string}` : "Patient a rempli le formulaire avant le RDV"}
                    {(preConsultData.difficultesVision as string[] | undefined)?.length ? ` · Gênes : ${(preConsultData.difficultesVision as string[]).slice(0, 3).join(", ")}` : ""}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreConsultOpen(o => !o)}
                style={{ padding: "7px 16px", background: "rgba(45,140,255,0.12)", border: "1px solid rgba(45,140,255,0.25)", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#2563eb", cursor: "pointer" }}
              >
                {preConsultOpen ? "▲ Masquer" : "▼ Voir le détail"}
              </button>
            </div>
            {preConsultOpen && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(45,140,255,0.15)", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, fontSize: 13 }}>
                {Object.entries(preConsultData).filter(([k]) => !["submittedAt"].includes(k)).map(([k, v]) => {
                  if (!v || (Array.isArray(v) && v.length === 0)) return null;
                  const labels: Record<string, string> = { motif: "Motif", difficultesVision: "Gênes visuelles", portActuel: "Port actuel", equipementMarque: "Équipement", equipementAge: "Âge équipement", activites: "Activités", medicaments: "Médicaments", antecedents: "Antécédents", autresInfos: "Autres infos", questions: "Questions" };
                  return (
                    <div key={k} style={{ background: "var(--glass-strong-bg)", borderRadius: 10, padding: "8px 12px", border: "1px solid rgba(45,140,255,0.12)" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 3 }}>{labels[k] ?? k}</div>
                      <div style={{ color: "#1e293b", fontWeight: 600 }}>{Array.isArray(v) ? v.join(", ") : String(v)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Page title */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1a2233", margin: 0 }}>
            Fiche de visite
          </h1>
          <p style={{ fontSize: 14, color: "#6B7280", marginTop: 6 }}>
            Consultation optique — espace Vision
          </p>
        </div>

        {/* ── En-tête ────────────────────────────────────────────────── */}
        <div style={card}>
          <div style={sectionTitle}>En-tête de consultation</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Patient */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={label}>Patient</label>
              <PatientPicker
                patients={patients}
                onSelect={p => setPatientId(p?.id ?? "")}
              />
            </div>

            {/* Date */}
            <div>
              <label style={label}>Date</label>
              <input
                type="date"
                value={today}
                readOnly
                style={{ ...inputStyle, background: "rgba(255,255,255,0.50)", cursor: "default" }}
              />
            </div>

            {/* Praticien */}
            <div>
              <label style={label}>Praticien</label>
              <input
                type="text"
                value={praticien}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPraticien(e.target.value)}
                style={inputStyle}
                placeholder="Nom du praticien"
              />
            </div>

            {/* Motif */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={label}>Motif de consultation</label>
              <select
                value={motif}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setMotif(e.target.value)}
                style={selectStyle}
              >
                {["Contrôle", "Adaptation", "Primo-équipement", "Bilan", "Urgence"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Réfraction subjective ──────────────────────────────────── */}
        <div style={card}>
          <div style={sectionTitle}>Réfraction subjective</div>
          <div style={{ display: "flex", gap: 32 }}>
            <RefractionCol label="Oeil Droit (OD)" data={refractionOD} onChange={updateRefrOD} />
            <div style={{ width: 1, background: "rgba(45,140,255,0.12)" }} />
            <RefractionCol label="Oeil Gauche (OG)" data={refractionOG} onChange={updateRefrOG} />
          </div>
        </div>

        {/* ── Kératométrie ──────────────────────────────────────────── */}
        <div style={card}>
          <div style={sectionTitle}>Kératométrie</div>
          <div style={{ display: "flex", gap: 32 }}>
            <KeratomCol label="Oeil Droit (OD)" data={keratomOD} onChange={updateKerOD} />
            <div style={{ width: 1, background: "rgba(45,140,255,0.12)" }} />
            <KeratomCol label="Oeil Gauche (OG)" data={keratomOG} onChange={updateKerOG} />
          </div>
        </div>

        {/* ── Prescription finale ──────────────────────────────────── */}
        <div style={card}>
          <div style={sectionTitle}>Prescription finale</div>

          {/* Identique toggle */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 20,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
              color: "#374151",
            }}
          >
            <input
              type="checkbox"
              checked={prescIdentique}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPrescIdentique(e.target.checked)}
              style={{
                width: 18,
                height: 18,
                accentColor: ACCENT,
                cursor: "pointer",
              }}
            />
            Identique à la réfraction subjective
          </label>

          <div style={{ display: "flex", gap: 32 }}>
            <PrescriptionCol
              label="Oeil Droit (OD)"
              data={prescIdentique ? refractionOD : prescriptionOD}
              onChange={updatePrescOD}
              disabled={prescIdentique}
            />
            <div style={{ width: 1, background: "rgba(45,140,255,0.12)" }} />
            <PrescriptionCol
              label="Oeil Gauche (OG)"
              data={prescIdentique ? refractionOG : prescriptionOG}
              onChange={updatePrescOG}
              disabled={prescIdentique}
            />
          </div>
        </div>

        {/* ── Équipement conseillé ─────────────────────────────────── */}
        <div style={card}>
          <div style={sectionTitle}>Équipement conseillé</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={label}>Type</label>
              <select
                value={equipType}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setEquipType(e.target.value)}
                style={selectStyle}
              >
                {[
                  "Monofocaux",
                  "Progressifs",
                  "Lentilles journalières",
                  "Lentilles mensuelles",
                  "Non-correcteurs",
                ].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={label}>Matériau</label>
              <select
                value={equipMateriaux}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setEquipMateriaux(e.target.value)}
                style={selectStyle}
              >
                {[
                  "Organique",
                  "Polycarbonate",
                  "Trivex",
                  "Haute Indice 1.67",
                  "1.74",
                ].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={label}>Traitement</label>
              <select
                value={equipTraitement}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setEquipTraitement(e.target.value)}
                style={selectStyle}
              >
                {[
                  "AR",
                  "AR renforcé",
                  "Photochromique",
                  "Solaire",
                  "Anti-lumière bleue",
                ].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={label}>Notes libres</label>
              <textarea
                value={equipNotes}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEquipNotes(e.target.value)}
                placeholder="Remarques, préférences patient..."
                rows={3}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  fontFamily: "inherit",
                  lineHeight: 1.5,
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Tiers payant ─────────────────────────────────────────── */}
        <div style={card}>
          <div style={sectionTitle}>Tiers payant</div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: tiersPayant ? 16 : 0,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
              color: "#374151",
            }}
          >
            <input
              type="checkbox"
              checked={tiersPayant}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTiersPayant(e.target.checked)}
              style={{
                width: 18,
                height: 18,
                accentColor: ACCENT,
                cursor: "pointer",
              }}
            />
            Tiers payant actif pour cette consultation
          </label>

          {tiersPayant && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={label}>Caisse (Sécurité sociale)</label>
                <input
                  type="text"
                  value={tiersPayantCaisse}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTiersPayantCaisse(e.target.value)}
                  placeholder="ex: CPAM Paris"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={label}>Mutuelle / Complémentaire</label>
                <input
                  type="text"
                  value={tiersPayantMutuelle}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTiersPayantMutuelle(e.target.value)}
                  placeholder="ex: MGEN"
                  style={inputStyle}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Actions ──────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: 14,
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={handleSave}
            style={{
              padding: "12px 28px",
              borderRadius: 12,
              border: "none",
              background: ACCENT,
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(45,140,255,0.30)",
              letterSpacing: 0.2,
              transition: "opacity 0.15s",
            }}
            onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.88")}
            onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
          >
            Enregistrer la consultation
          </button>

          <button
            onClick={handleDevis}
            disabled={!lastConsultationId}
            style={{
              padding: "12px 28px",
              borderRadius: 12,
              border: `2px solid ${ACCENT}`,
              background: "var(--glass-strong-bg)",
              color: ACCENT,
              fontWeight: 700,
              fontSize: 15,
              cursor: lastConsultationId ? "pointer" : "not-allowed",
              opacity: lastConsultationId ? 1 : 0.45,
              letterSpacing: 0.2,
              transition: "opacity 0.15s",
            }}
            onMouseOver={(e) => {
              if (lastConsultationId)
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(45,140,255,0.08)";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.80)";
            }}
          >
            Générer un devis depuis cette consultation
          </button>
        </div>
      </div>
    </div>
  );
}
