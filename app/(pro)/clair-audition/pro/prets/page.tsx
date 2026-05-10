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
interface AppareilPret {
  id: string;
  marque: string;
  modele: string;
  serialNumber: string;
  type: "RITE" | "Intra" | "Contour" | "BTE";
  classe: "1" | "2";
  statut: "disponible" | "en_pret" | "maintenance" | "perdu";
  notes?: string;
}

interface PretActif {
  id: string;
  appareilId: string;
  appareilLabel: string;
  patientNom: string;
  patientPrenom: string;
  telephone?: string;
  dateDepart: string;
  dateRetourPrevue: string;
  dateRetourReelle?: string;
  statut: "en_cours" | "rendu" | "perdu";
  notes?: string;
}

/* ═══════════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════════ */
const LS_STOCK_KEY = "thor_pro_audition_prets_stock";
const LS_PRETS_KEY = "thor_pro_audition_prets_actifs";

/* ═══════════════════════════════════════════════════════════════════════
   MOCK DATA
═══════════════════════════════════════════════════════════════════════ */
const MOCK_STOCK: AppareilPret[] = [
  { id: "s1", marque: "Phonak", modele: "Lumity 90", serialNumber: "PH-L90-001", type: "RITE", classe: "2", statut: "disponible" },
  { id: "s2", marque: "Phonak", modele: "Lumity 70", serialNumber: "PH-L70-001", type: "RITE", classe: "2", statut: "en_pret" },
  { id: "s3", marque: "Oticon", modele: "Intent 1", serialNumber: "OT-INT-001", type: "RITE", classe: "2", statut: "disponible" },
  { id: "s4", marque: "Phonak", modele: "Paradise P90", serialNumber: "PH-P90-001", type: "RITE", classe: "1", statut: "en_pret" },
  { id: "s5", marque: "Widex", modele: "Moment 440", serialNumber: "WD-M440-001", type: "RITE", classe: "2", statut: "maintenance" },
];

const MOCK_PRETS: PretActif[] = [
  {
    id: "p1",
    appareilId: "s2",
    appareilLabel: "Phonak Lumity 70 - SN: PH-L70-001",
    patientNom: "Dupont",
    patientPrenom: "Jean",
    telephone: "06 11 22 33 44",
    dateDepart: "2026-03-10",
    dateRetourPrevue: "2026-04-09",
    statut: "en_cours",
  },
  {
    id: "p2",
    appareilId: "s4",
    appareilLabel: "Phonak Paradise P90 - SN: PH-P90-001",
    patientNom: "Martin",
    patientPrenom: "Marie",
    telephone: "06 22 33 44 55",
    dateDepart: "2026-02-20",
    dateRetourPrevue: "2026-03-22",
    statut: "en_cours",
  },
  {
    id: "p3",
    appareilId: "sx",
    appareilLabel: "Phonak Lumity 90 - SN: PH-L90-OLD",
    patientNom: "Simon",
    patientPrenom: "Paul",
    telephone: "06 33 44 55 66",
    dateDepart: "2026-01-15",
    dateRetourPrevue: "2026-02-14",
    dateRetourReelle: "2026-02-10",
    statut: "rendu",
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════ */
function isoToday() {
  return new Date().toISOString().slice(0, 10);
}
function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}
function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function daysUntil(iso: string): number {
  const target = new Date(iso);
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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
   MODAL — NOUVEAU PRÊT
═══════════════════════════════════════════════════════════════════════ */
function NouveauPretModal({
  stock,
  onSave,
  onClose,
}: {
  stock: AppareilPret[];
  onSave: (pret: PretActif, appareilId: string) => void;
  onClose: () => void;
}) {
  const disponibles = stock.filter(a => a.statut === "disponible");

  const [appareilId, setAppareilId] = useState(disponibles[0]?.id ?? "");
  const [patientNom, setPatientNom] = useState("");
  const [patientPrenom, setPatientPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [dateDepart, setDateDepart] = useState(isoToday());
  const [duree, setDuree] = useState(30);
  const [notes, setNotes] = useState("");

  const isValid = appareilId && patientNom.trim() && patientPrenom.trim() && dateDepart;

  function handleSave() {
    if (!isValid) return;
    const appareil = stock.find(a => a.id === appareilId)!;
    const label = `${appareil.marque} ${appareil.modele} - SN: ${appareil.serialNumber}`;
    onSave(
      {
        id: genId(),
        appareilId,
        appareilLabel: label,
        patientNom: patientNom.trim(),
        patientPrenom: patientPrenom.trim(),
        telephone: telephone.trim() || undefined,
        dateDepart,
        dateRetourPrevue: addDays(dateDepart, duree),
        statut: "en_cours",
        notes: notes.trim() || undefined,
      },
      appareilId,
    );
  }

  const fieldLabel: CSSProperties = {
    fontSize: 11, fontWeight: 600, color: "#64748b",
    textTransform: "uppercase", letterSpacing: "0.05em",
    marginBottom: 4, display: "block",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{ ...glass, borderRadius: 20, width: "100%", maxWidth: 580, maxHeight: "90vh", overflow: "auto" }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid rgba(148,163,184,0.15)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", zIndex: 1,
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", margin: 0 }}>Nouveau prêt</h2>
          <button onClick={onClose} style={{ fontSize: 22, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Appareil */}
          <div style={{ ...glassSubtle, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#00C98A", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Appareil</p>
            {disponibles.length === 0 ? (
              <p style={{ fontSize: 13, color: "#ef4444", fontWeight: 600 }}>Aucun appareil disponible en stock.</p>
            ) : (
              <div>
                <label style={fieldLabel}>Appareil *</label>
                <select
                  style={{ ...inputStyle }}
                  value={appareilId}
                  onChange={e => setAppareilId(e.target.value)}
                >
                  {disponibles.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.marque} {a.modele} — SN: {a.serialNumber} (Classe {a.classe})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Patient */}
          <div style={{ ...glassSubtle, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#00C98A", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Patient</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={fieldLabel}>Nom *</label><input style={inputStyle} value={patientNom} onChange={e => setPatientNom(e.target.value)} placeholder="Dupont" /></div>
              <div><label style={fieldLabel}>Prénom *</label><input style={inputStyle} value={patientPrenom} onChange={e => setPatientPrenom(e.target.value)} placeholder="Jean" /></div>
              <div style={{ gridColumn: "span 2" }}><label style={fieldLabel}>Téléphone</label><input style={inputStyle} value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="06 00 00 00 00" /></div>
            </div>
          </div>

          {/* Prêt */}
          <div style={{ ...glassSubtle, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#00C98A", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Prêt</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={fieldLabel}>Date de départ *</label>
                <input style={inputStyle} type="date" value={dateDepart} onChange={e => setDateDepart(e.target.value)} />
              </div>
              <div>
                <label style={fieldLabel}>Durée (jours) *</label>
                <input style={inputStyle} type="number" min={1} max={365} value={duree} onChange={e => setDuree(Number(e.target.value))} />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={fieldLabel}>Notes</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 72, resize: "vertical" }}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Observations, réglages particuliers…"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid rgba(148,163,184,0.15)",
          display: "flex", justifyContent: "flex-end", gap: 10,
          position: "sticky", bottom: 0, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)",
        }}>
          <button
            onClick={onClose}
            style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.3)", background: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer" }}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || disponibles.length === 0}
            style={{
              padding: "9px 24px", borderRadius: 10, border: "none",
              background: (isValid && disponibles.length > 0) ? "#10b981" : "rgba(148,163,184,0.3)",
              fontSize: 13, fontWeight: 700,
              color: (isValid && disponibles.length > 0) ? "#fff" : "#94a3b8",
              cursor: (isValid && disponibles.length > 0) ? "pointer" : "not-allowed",
              boxShadow: (isValid && disponibles.length > 0) ? "0 2px 8px rgba(16,185,129,0.30)" : "none",
            }}
          >
            Créer le prêt
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MODAL — AJOUTER APPAREIL
═══════════════════════════════════════════════════════════════════════ */
function AjouterAppareilModal({
  onSave,
  onClose,
}: {
  onSave: (a: AppareilPret) => void;
  onClose: () => void;
}) {
  const [marque, setMarque] = useState("");
  const [modele, setModele] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [type, setType] = useState<AppareilPret["type"]>("RITE");
  const [classe, setClasse] = useState<"1" | "2">("2");
  const [notes, setNotes] = useState("");

  const isValid = marque.trim() && modele.trim() && serialNumber.trim();

  function handleSave() {
    if (!isValid) return;
    onSave({
      id: genId(),
      marque: marque.trim(),
      modele: modele.trim(),
      serialNumber: serialNumber.trim(),
      type,
      classe,
      statut: "disponible",
      notes: notes.trim() || undefined,
    });
  }

  const fieldLabel: CSSProperties = {
    fontSize: 11, fontWeight: 600, color: "#64748b",
    textTransform: "uppercase", letterSpacing: "0.05em",
    marginBottom: 4, display: "block",
  };
  const radioRow: CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 };
  const radioBtn = (active: boolean): CSSProperties => ({
    padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
    ...(active
      ? { background: "#10b981", color: "#fff", border: "none" }
      : { ...glassSubtle, color: "#64748b", border: "1px solid rgba(148,163,184,0.3)" }),
  });

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{ ...glass, borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto" }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid rgba(148,163,184,0.15)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", zIndex: 1,
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", margin: 0 }}>Ajouter un appareil</h2>
          <button onClick={onClose} style={{ fontSize: 22, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ...glassSubtle, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#00C98A", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Identification</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={fieldLabel}>Marque *</label><input style={inputStyle} value={marque} onChange={e => setMarque(e.target.value)} placeholder="Phonak" /></div>
              <div><label style={fieldLabel}>Modèle *</label><input style={inputStyle} value={modele} onChange={e => setModele(e.target.value)} placeholder="Lumity 90" /></div>
              <div style={{ gridColumn: "span 2" }}><label style={fieldLabel}>N° de série *</label><input style={inputStyle} value={serialNumber} onChange={e => setSerialNumber(e.target.value)} placeholder="PH-L90-XXX" /></div>
            </div>
          </div>

          <div style={{ ...glassSubtle, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#00C98A", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Caractéristiques</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={fieldLabel}>Type</label>
                <div style={radioRow}>
                  {(["RITE", "Intra", "Contour", "BTE"] as AppareilPret["type"][]).map(t => (
                    <button key={t} style={radioBtn(type === t)} onClick={() => setType(t)}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={fieldLabel}>Classe</label>
                <div style={radioRow}>
                  <button style={radioBtn(classe === "1")} onClick={() => setClasse("1")}>Classe I (RAC0)</button>
                  <button style={radioBtn(classe === "2")} onClick={() => setClasse("2")}>Classe II</button>
                </div>
              </div>
              <div>
                <label style={fieldLabel}>Notes</label>
                <textarea style={{ ...inputStyle, minHeight: 64, resize: "vertical" }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observations éventuelles…" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid rgba(148,163,184,0.15)",
          display: "flex", justifyContent: "flex-end", gap: 10,
          position: "sticky", bottom: 0, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)",
        }}>
          <button
            onClick={onClose}
            style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.3)", background: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer" }}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            style={{
              padding: "9px 24px", borderRadius: 10, border: "none",
              background: isValid ? "#10b981" : "rgba(148,163,184,0.3)",
              fontSize: 13, fontWeight: 700,
              color: isValid ? "#fff" : "#94a3b8",
              cursor: isValid ? "pointer" : "not-allowed",
              boxShadow: isValid ? "0 2px 8px rgba(16,185,129,0.30)" : "none",
            }}
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CONFIRM DIALOG
═══════════════════════════════════════════════════════════════════════ */
function ConfirmDialog({
  message,
  confirmLabel,
  confirmColor,
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9100,
      background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{ ...glass, borderRadius: 18, width: "100%", maxWidth: 420, padding: 28, textAlign: "center" }}>
        <p style={{ fontSize: 15, color: "#1e293b", fontWeight: 500, margin: "0 0 24px", lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={onCancel}
            style={{ padding: "9px 22px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.3)", background: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer" }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            style={{ padding: "9px 22px", borderRadius: 10, border: "none", background: confirmColor, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PRET CARD
═══════════════════════════════════════════════════════════════════════ */
function PretCard({
  pret,
  onMarquerRendu,
  onProlonger,
}: {
  pret: PretActif;
  onMarquerRendu: (id: string) => void;
  onProlonger: (id: string) => void;
}) {
  const isEnCours = pret.statut === "en_cours";
  const days = daysUntil(pret.dateRetourPrevue);

  const countdownColor =
    !isEnCours ? "#94a3b8"
    : days < 0 ? "#ef4444"
    : days <= 7 ? "#f59e0b"
    : "#00C98A";

  const countdownLabel =
    days < 0 ? `${Math.abs(days)} j de retard`
    : days === 0 ? "Retour aujourd'hui"
    : `J-${days}`;

  const statutStyle: Record<PretActif["statut"], CSSProperties> = {
    en_cours: { background: "rgba(0,201,138,0.12)", color: "#047857" },
    rendu:    { background: "rgba(99,102,241,0.12)", color: "#4338ca" },
    perdu:    { background: "rgba(239,68,68,0.12)", color: "#b91c1c" },
  };
  const statutLabel: Record<PretActif["statut"], string> = {
    en_cours: "En cours",
    rendu:    "Rendu",
    perdu:    "Perdu",
  };

  return (
    <div style={{
      ...glass, borderRadius: 18, padding: "18px 20px",
      display: "flex", flexDirection: "column", gap: 12,
      borderLeft: isEnCours && days < 0 ? "3px solid #ef4444" : undefined,
    }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
            {pret.patientPrenom} {pret.patientNom}
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{pret.telephone || "—"}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, flexShrink: 0, ...statutStyle[pret.statut] }}>
          {statutLabel[pret.statut]}
        </span>
      </div>

      {/* Appareil */}
      <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{pret.appareilLabel}</div>

      {/* Dates */}
      <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#94a3b8" }}>
        <span>Départ : <strong style={{ color: "#64748b" }}>{fmtDate(pret.dateDepart)}</strong></span>
        <span>
          {pret.statut === "rendu" && pret.dateRetourReelle
            ? <>Rendu le : <strong style={{ color: "#64748b" }}>{fmtDate(pret.dateRetourReelle)}</strong></>
            : <>Retour prévu : <strong style={{ color: countdownColor }}>{fmtDate(pret.dateRetourPrevue)}</strong></>
          }
        </span>
      </div>

      {/* Countdown */}
      {isEnCours && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "4px 12px", borderRadius: 20,
          background: days < 0 ? "rgba(239,68,68,0.10)" : days <= 7 ? "rgba(245,158,11,0.10)" : "rgba(0,201,138,0.10)",
          alignSelf: "flex-start",
        }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: countdownColor }}>{countdownLabel}</span>
        </div>
      )}

      {/* Notes */}
      {pret.notes && (
        <div style={{ ...glassSubtle, borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#64748b", fontStyle: "italic" }}>
          {pret.notes}
        </div>
      )}

      {/* Actions */}
      {isEnCours && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 4, borderTop: "1px solid rgba(148,163,184,0.10)" }}>
          <button
            onClick={() => onMarquerRendu(pret.id)}
            style={{
              padding: "6px 14px", borderRadius: 10, border: "none",
              background: "#10b981",
              fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer",
              boxShadow: "0 2px 6px rgba(16,185,129,0.25)",
            }}
          >
            Marquer rendu
          </button>
          <button
            onClick={() => onProlonger(pret.id)}
            style={{ padding: "6px 14px", borderRadius: 10, border: "none", background: "rgba(99,102,241,0.12)", color: "#4338ca", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            Prolonger 14j
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   STOCK ITEM
═══════════════════════════════════════════════════════════════════════ */
function StockItem({ appareil, onClick }: { appareil: AppareilPret; onClick?: () => void }) {
  const statutStyle: Record<AppareilPret["statut"], CSSProperties> = {
    disponible:  { background: "rgba(0,201,138,0.12)", color: "#047857" },
    en_pret:     { background: "rgba(99,102,241,0.12)", color: "#4338ca" },
    maintenance: { background: "rgba(245,158,11,0.12)", color: "#b45309" },
    perdu:       { background: "rgba(239,68,68,0.12)", color: "#b91c1c" },
  };
  const statutLabel: Record<AppareilPret["statut"], string> = {
    disponible:  "Disponible",
    en_pret:     "En prêt",
    maintenance: "Maintenance",
    perdu:       "Perdu",
  };

  return (
    <div
      onClick={onClick}
      style={{
        ...glassSubtle, borderRadius: 14, padding: "12px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
          {appareil.marque} {appareil.modele}
        </div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
          SN: {appareil.serialNumber} · {appareil.type} · Cl. {appareil.classe}
        </div>
        {appareil.notes && (
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 3, fontStyle: "italic" }}>{appareil.notes}</div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, ...statutStyle[appareil.statut] }}>
          {statutLabel[appareil.statut]}
        </span>
        {onClick && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════════════════ */
export default function PretsAuditionPage() {
  const [stock, setStock] = useState<AppareilPret[]>([]);
  const [prets, setPrets] = useState<PretActif[]>([]);
  const [modalPret, setModalPret] = useState(false);
  const [modalAppareil, setModalAppareil] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmRendu, setConfirmRendu] = useState<string | null>(null);
  const [confirmProlonger, setConfirmProlonger] = useState<string | null>(null);
  const [historiqueAppareil, setHistoriqueAppareil] = useState<AppareilPret | null>(null);

  useEffect(() => {
    try {
      const rawStock = localStorage.getItem(LS_STOCK_KEY);
      setStock(rawStock ? JSON.parse(rawStock) : MOCK_STOCK);
    } catch {
      setStock(MOCK_STOCK);
    }
    try {
      const rawPrets = localStorage.getItem(LS_PRETS_KEY);
      setPrets(rawPrets ? JSON.parse(rawPrets) : MOCK_PRETS);
    } catch {
      setPrets(MOCK_PRETS);
    }
  }, []);

  const saveStock = useCallback((data: AppareilPret[]) => {
    setStock(data);
    localStorage.setItem(LS_STOCK_KEY, JSON.stringify(data));
  }, []);

  const savePrets = useCallback((data: PretActif[]) => {
    setPrets(data);
    localStorage.setItem(LS_PRETS_KEY, JSON.stringify(data));
  }, []);

  function handleNouveauPret(pret: PretActif, appareilId: string) {
    const newStock = stock.map(a =>
      a.id === appareilId ? { ...a, statut: "en_pret" as const } : a
    );
    saveStock(newStock);
    savePrets([pret, ...prets]);
    setModalPret(false);
    setToast("Prêt créé avec succès");
  }

  function handleMarquerRendu(id: string) {
    const pret = prets.find(p => p.id === id);
    if (!pret) return;
    const newPrets = prets.map(p =>
      p.id === id
        ? { ...p, statut: "rendu" as const, dateRetourReelle: isoToday() }
        : p
    );
    const newStock = stock.map(a =>
      a.id === pret.appareilId ? { ...a, statut: "disponible" as const } : a
    );
    saveStock(newStock);
    savePrets(newPrets);
    setConfirmRendu(null);
    setToast("Appareil marqué comme rendu");
  }

  function handleProlonger(id: string) {
    const newPrets = prets.map(p =>
      p.id === id
        ? { ...p, dateRetourPrevue: addDays(p.dateRetourPrevue, 14) }
        : p
    );
    savePrets(newPrets);
    setConfirmProlonger(null);
    setToast("Prêt prolongé de 14 jours");
  }

  function handleAjouterAppareil(a: AppareilPret) {
    saveStock([...stock, a]);
    setModalAppareil(false);
    setToast("Appareil ajouté au stock");
  }

  // Stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const totalStock = stock.length;
  const disponibles = stock.filter(a => a.statut === "disponible").length;
  const enPret = prets.filter(p => p.statut === "en_cours").length;
  const enRetard = prets.filter(p =>
    p.statut === "en_cours" && new Date(p.dateRetourPrevue).getTime() < today.getTime()
  ).length;

  // Alert: overdue loans
  const pretsEnRetard = prets.filter(p =>
    p.statut === "en_cours" && new Date(p.dateRetourPrevue).getTime() < today.getTime()
  );

  // Active loans sorted: overdue first, then by days remaining
  const pretsActifs = [...prets].sort((a, b) => {
    const orderStatut: Record<PretActif["statut"], number> = { en_cours: 0, rendu: 1, perdu: 2 };
    if (orderStatut[a.statut] !== orderStatut[b.statut]) return orderStatut[a.statut] - orderStatut[b.statut];
    if (a.statut === "en_cours" && b.statut === "en_cours") {
      return daysUntil(a.dateRetourPrevue) - daysUntil(b.dateRetourPrevue);
    }
    return a.dateDepart.localeCompare(b.dateDepart);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800">Prêts d'appareils</h1>
          <p className="mt-1 text-sm text-slate-500">Gestion des appareils prêtés aux patients</p>
        </div>
        <button
          onClick={() => setModalPret(true)}
          style={{
            padding: "9px 18px", borderRadius: 12, border: "none",
            background: "#10b981",
            fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer",
            boxShadow: "0 2px 8px rgba(16,185,129,0.25)",
          }}
        >
          + Nouveau prêt
        </button>
      </div>

      {/* Alert banner — retards */}
      {pretsEnRetard.length > 0 && (
        <div style={{
          borderRadius: 14, padding: "12px 18px",
          background: "rgba(239,68,68,0.09)",
          border: "1px solid rgba(239,68,68,0.28)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 18 }}></span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#b91c1c" }}>
              {pretsEnRetard.length === 1
                ? "1 appareil n'a pas été rendu à temps"
                : `${pretsEnRetard.length} appareils n'ont pas été rendus à temps`}
            </div>
            <div style={{ fontSize: 12, color: "#dc2626", marginTop: 2 }}>
              {pretsEnRetard.map(p => {
                const d = daysUntil(p.dateRetourPrevue);
                return `${p.patientPrenom} ${p.patientNom} (${Math.abs(d)} j de retard)`;
              }).join(" · ")}
            </div>
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {[
          { label: "Appareils en stock",    value: totalStock,  color: "#00C98A" },
          { label: "Disponibles",           value: disponibles, color: "#0891b2" },
          { label: "En prêt actuellement",  value: enPret,      color: "#6366f1" },
          { label: "En retard",             value: enRetard,    color: enRetard > 0 ? "#ef4444" : "#94a3b8" },
        ].map(k => (
          <div key={k.label} style={{ ...glass, borderRadius: 16, padding: "16px 18px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20, alignItems: "start" }}>

        {/* Section 1 — Prêts actifs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>
              Prêts actifs
              {enPret > 0 && (
                <span style={{
                  marginLeft: 8, fontSize: 11, fontWeight: 700,
                  padding: "2px 8px", borderRadius: 20,
                  background: "rgba(0,201,138,0.12)", color: "#047857",
                }}>
                  {enPret} en cours
                </span>
              )}
            </h2>
          </div>

          {pretsActifs.length === 0 ? (
            <div style={{ ...glass, borderRadius: 18, padding: "48px 0", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
              Aucun prêt enregistré.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pretsActifs.map(pret => (
                <PretCard
                  key={pret.id}
                  pret={pret}
                  onMarquerRendu={(id) => setConfirmRendu(id)}
                  onProlonger={(id) => setConfirmProlonger(id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Section 2 — Stock d'appareils */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>
              Stock d'appareils
            </h2>
            <button
              onClick={() => setModalAppareil(true)}
              style={{
                padding: "6px 14px", borderRadius: 10, border: "none",
                background: "rgba(0,201,138,0.12)", color: "#047857",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}
            >
              + Ajouter
            </button>
          </div>

          {stock.length === 0 ? (
            <div style={{ ...glass, borderRadius: 18, padding: "48px 0", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
              Aucun appareil en stock.
            </div>
          ) : (
            <div style={{ ...glass, borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {stock.map(a => (
                <StockItem key={a.id} appareil={a} onClick={() => setHistoriqueAppareil(a)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {modalPret && (
        <NouveauPretModal
          stock={stock}
          onSave={handleNouveauPret}
          onClose={() => setModalPret(false)}
        />
      )}
      {modalAppareil && (
        <AjouterAppareilModal
          onSave={handleAjouterAppareil}
          onClose={() => setModalAppareil(false)}
        />
      )}

      {confirmRendu && (
        <ConfirmDialog
          message="Marquer cet appareil comme rendu ? Il redeviendra disponible en stock."
          confirmLabel="Marquer rendu"
          confirmColor="#10b981"
          onConfirm={() => handleMarquerRendu(confirmRendu)}
          onCancel={() => setConfirmRendu(null)}
        />
      )}
      {confirmProlonger && (
        <ConfirmDialog
          message="Prolonger ce prêt de 14 jours supplémentaires ?"
          confirmLabel="Prolonger"
          confirmColor="linear-gradient(135deg,#6366f1,#4338ca)"
          onConfirm={() => handleProlonger(confirmProlonger)}
          onCancel={() => setConfirmProlonger(null)}
        />
      )}

      {/* Modal — Historique appareil */}
      {historiqueAppareil && (() => {
        const loansForDevice = prets.filter(p => p.appareilId === historiqueAppareil.id);
        const statutStyle: Record<PretActif["statut"], CSSProperties> = {
          en_cours: { background: "rgba(99,102,241,0.12)", color: "#4338ca" },
          rendu:    { background: "rgba(16,185,129,0.12)", color: "#047857" },
          perdu:    { background: "rgba(239,68,68,0.12)", color: "#b91c1c" },
        };
        const statutLabel: Record<PretActif["statut"], string> = { en_cours: "En cours", rendu: "Rendu", perdu: "Perdu" };
        return (
          <div onClick={() => setHistoriqueAppareil(null)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
            <div onClick={e => e.stopPropagation()} style={{ ...glass, borderRadius: 20, padding: 28, width: "min(520px,94vw)", maxHeight: "85vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>{historiqueAppareil.marque} {historiqueAppareil.modele}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>SN: {historiqueAppareil.serialNumber} · {historiqueAppareil.type} · Cl. {historiqueAppareil.classe}</div>
                </div>
                <button onClick={() => setHistoriqueAppareil(null)} style={{ background: "rgba(241,245,249,0.8)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b", fontSize: 16 }}>×</button>
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                Historique des prêts · {loansForDevice.length} entrée(s)
              </div>

              {loansForDevice.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8", fontSize: 13 }}>Aucun prêt enregistré pour cet appareil.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[...loansForDevice].sort((a, b) => b.dateDepart.localeCompare(a.dateDepart)).map(p => (
                    <div key={p.id} style={{ ...glassSubtle, borderRadius: 12, padding: "12px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{p.patientPrenom} {p.patientNom}</div>
                          {p.telephone && <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.telephone}</div>}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, flexShrink: 0, ...statutStyle[p.statut] }}>
                          {statutLabel[p.statut]}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#64748b", marginTop: 8 }}>
                        <span>Départ : <strong>{fmtDate(p.dateDepart)}</strong></span>
                        {p.dateRetourReelle
                          ? <span>Rendu le : <strong>{fmtDate(p.dateRetourReelle)}</strong></span>
                          : <span>Retour prévu : <strong>{fmtDate(p.dateRetourPrevue)}</strong></span>}
                      </div>
                      {p.notes && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6, fontStyle: "italic" }}>{p.notes}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
