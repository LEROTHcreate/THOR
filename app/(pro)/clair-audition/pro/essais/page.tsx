"use client";

import { useState, useEffect, useCallback, type CSSProperties } from "react";
import Link from "next/link";

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
interface EssaiPatient {
  id: string;
  patientId: string;
  patientNom: string;
  patientPrenom: string;
  telephone: string;
  appareil: string;
  classe: "1" | "2";
  oreilles: "OD" | "OG" | "binaural";
  dateDebut: string;
  dureeJours: number;
  statut: "en_cours" | "expire" | "converti" | "abandonne";
  notes?: string;
  audioprothesiste: string;
}

type FilterTab = "tous" | "en_cours" | "expirant" | "expire" | "converti";

/* ═══════════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════════ */
const LS_KEY = "thor_pro_audition_essais";

/* ═══════════════════════════════════════════════════════════════════════
   MOCK DATA (dates relative to 2026-03-24)
═══════════════════════════════════════════════════════════════════════ */
const MOCK_ESSAIS: EssaiPatient[] = [
  {
    id: "e1",
    patientId: "p1",
    patientNom: "Dupont",
    patientPrenom: "Jean",
    telephone: "06 11 22 33 44",
    appareil: "Phonak Lumity 90",
    classe: "2",
    oreilles: "binaural",
    dateDebut: "2026-03-10",
    dureeJours: 30,
    statut: "en_cours",
    audioprothesiste: "Dr. Martin",
  },
  {
    id: "e2",
    patientId: "p2",
    patientNom: "Martin",
    patientPrenom: "Marie",
    telephone: "06 22 33 44 55",
    appareil: "Oticon Intent 1",
    classe: "2",
    oreilles: "binaural",
    dateDebut: "2026-03-01",
    dureeJours: 30,
    statut: "en_cours",
    audioprothesiste: "Dr. Leroy",
  },
  {
    id: "e3",
    patientId: "p3",
    patientNom: "Bernard",
    patientPrenom: "Pierre",
    telephone: "06 33 44 55 66",
    appareil: "Phonak Audéo Lumity",
    classe: "1",
    oreilles: "OD",
    dateDebut: "2026-02-28",
    dureeJours: 30,
    statut: "en_cours",
    notes: "Patient réticent, bien insister sur le bénéfice du traitement",
    audioprothesiste: "Dr. Martin",
  },
  {
    id: "e4",
    patientId: "p4",
    patientNom: "Leroy",
    patientPrenom: "Anne",
    telephone: "06 44 55 66 77",
    appareil: "Widex Moment 440",
    classe: "2",
    oreilles: "binaural",
    dateDebut: "2026-02-15",
    dureeJours: 30,
    statut: "expire",
    audioprothesiste: "Dr. Leroy",
  },
  {
    id: "e5",
    patientId: "p5",
    patientNom: "Simon",
    patientPrenom: "Paul",
    telephone: "06 55 66 77 88",
    appareil: "ReSound Nexia 9",
    classe: "2",
    oreilles: "binaural",
    dateDebut: "2026-01-20",
    dureeJours: 30,
    statut: "converti",
    audioprothesiste: "Dr. Martin",
  },
  {
    id: "e6",
    patientId: "p6",
    patientNom: "Petit",
    patientPrenom: "Claire",
    telephone: "06 66 77 88 99",
    appareil: "Signia Pure 7",
    classe: "1",
    oreilles: "binaural",
    dateDebut: "2026-02-01",
    dureeJours: 30,
    statut: "abandonne",
    notes: "A préféré ne pas s'appareiller pour l'instant",
    audioprothesiste: "Dr. Leroy",
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

/** Returns days remaining (negative = expired) */
function getDaysRemaining(essai: EssaiPatient): number {
  const start = new Date(essai.dateDebut);
  const end = new Date(start.getTime() + essai.dureeJours * 24 * 60 * 60 * 1000);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Percentage of the trial that has elapsed (0–100) */
function getElapsedPercent(essai: EssaiPatient): number {
  const start = new Date(essai.dateDebut);
  const today = new Date();
  const elapsed = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return Math.min(100, Math.max(0, Math.round((elapsed / essai.dureeJours) * 100)));
}

function isExpiringIn7Days(essai: EssaiPatient): boolean {
  if (essai.statut !== "en_cours") return false;
  const days = getDaysRemaining(essai);
  return days >= 0 && days <= 7;
}

function isExpiringIn3Days(essai: EssaiPatient): boolean {
  if (essai.statut !== "en_cours") return false;
  const days = getDaysRemaining(essai);
  return days >= 0 && days <= 3;
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
   MODAL NOUVEL ESSAI
═══════════════════════════════════════════════════════════════════════ */
function EssaiModal({
  onSave,
  onClose,
}: {
  onSave: (e: EssaiPatient) => void;
  onClose: () => void;
}) {
  const [patientNom, setPatientNom] = useState("");
  const [patientPrenom, setPatientPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [appareil, setAppareil] = useState("");
  const [classe, setClasse] = useState<"1" | "2">("2");
  const [oreilles, setOreilles] = useState<EssaiPatient["oreilles"]>("binaural");
  const [dateDebut, setDateDebut] = useState(isoToday());
  const [dureeJours, setDureeJours] = useState(30);
  const [audioprothesiste, setAudioprothesiste] = useState("");
  const [notes, setNotes] = useState("");

  const isValid = patientNom.trim() && patientPrenom.trim() && appareil.trim() && dateDebut && audioprothesiste.trim();

  function handleSave() {
    if (!isValid) return;
    onSave({
      id: genId(),
      patientId: genId(),
      patientNom: patientNom.trim(),
      patientPrenom: patientPrenom.trim(),
      telephone: telephone.trim(),
      appareil: appareil.trim(),
      classe,
      oreilles,
      dateDebut,
      dureeJours,
      statut: "en_cours",
      audioprothesiste: audioprothesiste.trim(),
      notes: notes.trim() || undefined,
    });
  }

  const fieldLabel: CSSProperties = {
    fontSize: 11, fontWeight: 600, color: "#64748b",
    textTransform: "uppercase", letterSpacing: "0.05em",
    marginBottom: 4, display: "block",
  };
  const radioRow: CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 };
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
      <div style={{ ...glass, borderRadius: 20, width: "100%", maxWidth: 600, maxHeight: "90vh", overflow: "auto" }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid rgba(148,163,184,0.15)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", zIndex: 1,
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", margin: 0 }}>Nouvel essai</h2>
          <button onClick={onClose} style={{ fontSize: 22, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Patient */}
          <div style={{ ...glassSubtle, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#00C98A", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Patient</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={fieldLabel}>Nom *</label><input style={inputStyle} value={patientNom} onChange={e => setPatientNom(e.target.value)} placeholder="Dupont" /></div>
              <div><label style={fieldLabel}>Prénom *</label><input style={inputStyle} value={patientPrenom} onChange={e => setPatientPrenom(e.target.value)} placeholder="Jean" /></div>
              <div style={{ gridColumn: "span 2" }}><label style={fieldLabel}>Téléphone</label><input style={inputStyle} value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="06 00 00 00 00" /></div>
            </div>
          </div>

          {/* Appareillage */}
          <div style={{ ...glassSubtle, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#00C98A", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Appareillage</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={fieldLabel}>Appareil *</label>
                <input style={inputStyle} value={appareil} onChange={e => setAppareil(e.target.value)} placeholder="Phonak Lumity 90 RITE" />
              </div>
              <div>
                <label style={fieldLabel}>Classe</label>
                <div style={radioRow}>
                  <button style={radioBtn(classe === "1")} onClick={() => setClasse("1")}>Classe I (RAC0)</button>
                  <button style={radioBtn(classe === "2")} onClick={() => setClasse("2")}>Classe II</button>
                </div>
              </div>
              <div>
                <label style={fieldLabel}>Oreille(s)</label>
                <div style={radioRow}>
                  <button style={radioBtn(oreilles === "binaural")} onClick={() => setOreilles("binaural")}>Binaural</button>
                  <button style={radioBtn(oreilles === "OD")} onClick={() => setOreilles("OD")}>OD</button>
                  <button style={radioBtn(oreilles === "OG")} onClick={() => setOreilles("OG")}>OG</button>
                </div>
              </div>
            </div>
          </div>

          {/* Essai */}
          <div style={{ ...glassSubtle, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#00C98A", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Essai</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={fieldLabel}>Date de début *</label>
                <input style={inputStyle} type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
              </div>
              <div>
                <label style={fieldLabel}>Durée (jours) *</label>
                <input style={inputStyle} type="number" min={1} max={90} value={dureeJours} onChange={e => setDureeJours(Number(e.target.value))} />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={fieldLabel}>Audioprothésiste *</label>
                <input style={inputStyle} value={audioprothesiste} onChange={e => setAudioprothesiste(e.target.value)} placeholder="Dr. Dupont" />
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
            Créer l'essai
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
   ESSAI CARD
═══════════════════════════════════════════════════════════════════════ */
function buildDevisUrl(essai: EssaiPatient): string {
  const params = new URLSearchParams({
    from: "essai",
    nom:    essai.patientNom,
    prenom: essai.patientPrenom,
    tel:    essai.telephone,
    appareil: essai.appareil,
    classe: essai.classe,
    oreilles: essai.oreilles,
  });
  return `/clair-audition/pro/devis?${params.toString()}`;
}

function EssaiCard({
  essai,
  onProlonger,
  onAbandonner,
  onReouvrir,
  onConvertir,
}: {
  essai: EssaiPatient;
  onProlonger: (id: string) => void;
  onAbandonner: (id: string) => void;
  onReouvrir: (id: string) => void;
  onConvertir: (id: string) => void;
}) {
  const daysRemaining = getDaysRemaining(essai);
  const elapsed = getElapsedPercent(essai);
  const isActive = essai.statut === "en_cours";

  const countdownColor =
    !isActive ? "#94a3b8"
    : daysRemaining < 0 ? "#ef4444"
    : daysRemaining <= 7 ? "#f59e0b"
    : "#00C98A";

  const progressBarColor =
    daysRemaining < 0 ? "#ef4444"
    : daysRemaining <= 7 ? "#f59e0b"
    : "#00C98A";

  const classeBadge: CSSProperties =
    essai.classe === "1"
      ? { background: "rgba(0,201,138,0.12)", color: "#047857" }
      : { background: "rgba(124,58,237,0.12)", color: "#7c3aed" };

  const oreilleBadge: CSSProperties = {
    background: "rgba(99,102,241,0.10)", color: "#4338ca",
  };

  const statutBadge: Record<EssaiPatient["statut"], CSSProperties> = {
    en_cours:  { background: "rgba(0,201,138,0.12)",   color: "#047857" },
    expire:    { background: "rgba(239,68,68,0.12)",   color: "#b91c1c" },
    converti:  { background: "rgba(99,102,241,0.12)",  color: "#4338ca" },
    abandonne: { background: "rgba(148,163,184,0.15)", color: "#64748b" },
  };
  const statutLabels: Record<EssaiPatient["statut"], string> = {
    en_cours:  "En cours",
    expire:    "Expiré",
    converti:  "Converti",
    abandonne: "Abandonné",
  };

  return (
    <div style={{ ...glass, borderRadius: 18, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
            {essai.patientPrenom} {essai.patientNom}
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{essai.telephone || "—"}</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, ...classeBadge }}>
            Classe {essai.classe === "1" ? "I (RAC0)" : "II"}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, ...oreilleBadge }}>
            {essai.oreilles}
          </span>
        </div>
      </div>

      {/* Appareil */}
      <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{essai.appareil}</div>

      {/* Countdown / Progress */}
      {(isActive || essai.statut === "expire") ? (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Progression de l'essai
            </span>
            <span style={{ fontSize: 15, fontWeight: 800, color: countdownColor }}>
              {daysRemaining < 0
                ? "EXPIRÉ"
                : daysRemaining === 0
                ? "Expire aujourd'hui"
                : `J-${daysRemaining}`}
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: "rgba(148,163,184,0.18)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${elapsed}%`, borderRadius: 999, background: progressBarColor, transition: "width 0.4s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 10, color: "#94a3b8" }}>Début : {fmtDate(essai.dateDebut)}</span>
            <span style={{ fontSize: 10, color: "#94a3b8" }}>Fin : {fmtDate(new Date(new Date(essai.dateDebut).getTime() + essai.dureeJours * 86400000).toISOString().slice(0, 10))}</span>
          </div>
        </div>
      ) : (
        <div>
          <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, ...statutBadge[essai.statut] }}>
            {statutLabels[essai.statut]}
          </span>
        </div>
      )}

      {/* Meta */}
      <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#94a3b8" }}>
        <span>Audioprothésiste : <strong style={{ color: "#64748b" }}>{essai.audioprothesiste}</strong></span>
        <span>Durée : <strong style={{ color: "#64748b" }}>{essai.dureeJours}j</strong></span>
      </div>

      {/* Notes */}
      {essai.notes && (
        <div style={{ ...glassSubtle, borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#64748b", fontStyle: "italic" }}>
          {essai.notes}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 4, borderTop: "1px solid rgba(148,163,184,0.10)" }}>
        {isActive && (
          <>
            <Link
              href={buildDevisUrl(essai)}
              onClick={() => onConvertir(essai.id)}
              style={{
                padding: "6px 14px", borderRadius: 10, border: "none",
                background: "#10b981",
                fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer",
                textDecoration: "none", display: "inline-flex", alignItems: "center",
                boxShadow: "0 2px 6px rgba(16,185,129,0.25)",
              }}
            >
              Convertir en devis →
            </Link>
            <button
              onClick={() => onProlonger(essai.id)}
              style={{ padding: "6px 14px", borderRadius: 10, border: "none", background: "rgba(99,102,241,0.12)", color: "#4338ca", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Prolonger (+14j)
            </button>
            <button
              onClick={() => onAbandonner(essai.id)}
              style={{ padding: "6px 14px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.25)", background: "var(--glass-subtle-bg)", color: "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Abandonner
            </button>
          </>
        )}
        {essai.statut === "expire" && (
          <>
            <Link
              href={buildDevisUrl(essai)}
              onClick={() => onConvertir(essai.id)}
              style={{
                padding: "6px 14px", borderRadius: 10, border: "none",
                background: "#10b981",
                fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer",
                textDecoration: "none", display: "inline-flex", alignItems: "center",
              }}
            >
              Convertir en devis →
            </Link>
            <button
              onClick={() => onAbandonner(essai.id)}
              style={{ padding: "6px 14px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.25)", background: "var(--glass-subtle-bg)", color: "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Abandonner
            </button>
          </>
        )}
        {(essai.statut === "converti" || essai.statut === "abandonne") && (
          <>
            <span style={{
              padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700,
              ...statutBadge[essai.statut],
            }}>
              {statutLabels[essai.statut]}
            </span>
            <button
              onClick={() => onReouvrir(essai.id)}
              style={{ padding: "6px 14px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.25)", background: "var(--glass-subtle-bg)", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Rouvrir
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════════════════ */
export default function EssaisAuditionPage() {
  const [essais, setEssais] = useState<EssaiPatient[]>([]);
  const [filter, setFilter] = useState<FilterTab>("tous");
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmProlonger, setConfirmProlonger] = useState<string | null>(null);
  const [confirmAbandonner, setConfirmAbandonner] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const loaded: EssaiPatient[] = raw ? JSON.parse(raw) : MOCK_ESSAIS;
      // Auto-expiration : passe "en_cours" → "expire" si délai dépassé
      let changed = false;
      const updated = loaded.map(e => {
        if (e.statut === "en_cours" && getDaysRemaining(e) < 0) {
          changed = true;
          return { ...e, statut: "expire" as const };
        }
        return e;
      });
      setEssais(updated);
      if (changed) localStorage.setItem(LS_KEY, JSON.stringify(updated));
    } catch {
      setEssais(MOCK_ESSAIS);
    }
  }, []);

  const save = useCallback((data: EssaiPatient[]) => {
    setEssais(data);
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }, []);

  function handleNewEssai(e: EssaiPatient) {
    save([e, ...essais]);
    setModalOpen(false);
    setToast("Essai créé avec succès");
  }

  function handleProlonger(id: string) {
    save(essais.map(e => e.id === id ? { ...e, dureeJours: e.dureeJours + 14 } : e));
    setConfirmProlonger(null);
    setToast("Essai prolongé de 14 jours");
  }

  function handleAbandonner(id: string) {
    save(essais.map(e => e.id === id ? { ...e, statut: "abandonne" as const } : e));
    setConfirmAbandonner(null);
    setToast("Essai marqué comme abandonné");
  }

  function handleReouvrir(id: string) {
    save(essais.map(e => e.id === id ? { ...e, statut: "en_cours" as const } : e));
    setToast("Essai réouvert");
  }

  function handleConvertir(id: string) {
    save(essais.map(e => e.id === id ? { ...e, statut: "converti" as const } : e));
    setToast("Essai converti — devis pré-rempli ✓");
  }

  // Stats
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const actifs = essais.filter(e => e.statut === "en_cours").length;
  const expirantSoon = essais.filter(isExpiringIn7Days).length;
  const convertisMois = essais.filter(e => {
    if (e.statut !== "converti") return false;
    // approximate by dateDebut + dureeJours as "conversion date"
    const d = new Date(e.dateDebut);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;
  const totalClosed = essais.filter(e => e.statut === "converti" || e.statut === "abandonne").length;
  const totalConverti = essais.filter(e => e.statut === "converti").length;
  const tauxConversion = totalClosed > 0 ? Math.round((totalConverti / totalClosed) * 100) : 0;

  // Alert: essais expiring in ≤3 days
  const alertEssais = essais.filter(isExpiringIn3Days);

  // Filtered list
  const filtered = essais.filter(e => {
    if (filter === "tous") return true;
    if (filter === "en_cours") return e.statut === "en_cours" && !isExpiringIn7Days(e);
    if (filter === "expirant") return isExpiringIn7Days(e);
    if (filter === "expire") return e.statut === "expire";
    if (filter === "converti") return e.statut === "converti";
    return true;
  });

  // Sort: active/expiring first, then by days remaining
  const sorted = [...filtered].sort((a, b) => {
    const order: Record<EssaiPatient["statut"], number> = { en_cours: 0, expire: 1, converti: 2, abandonne: 3 };
    if (order[a.statut] !== order[b.statut]) return order[a.statut] - order[b.statut];
    if (a.statut === "en_cours" && b.statut === "en_cours") {
      return getDaysRemaining(a) - getDaysRemaining(b);
    }
    return a.dateDebut.localeCompare(b.dateDebut);
  });

  const TABS: { key: FilterTab; label: string; count?: number }[] = [
    { key: "tous",      label: "Tous",        count: essais.length },
    { key: "en_cours",  label: "En cours",    count: actifs },
    { key: "expirant",  label: "Expirant (≤7j)", count: expirantSoon },
    { key: "expire",    label: "Expirés",     count: essais.filter(e => e.statut === "expire").length },
    { key: "converti",  label: "Convertis",   count: totalConverti },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800 h-title">Périodes d&apos;essai</h1>
          <p className="mt-1 text-sm text-slate-500">Suivi des appareillages en cours de test</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            padding: "9px 18px", borderRadius: 12, border: "none",
            background: "#10b981",
            fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer",
            boxShadow: "0 2px 8px rgba(16,185,129,0.25)",
          }}
        >
          + Nouvel essai
        </button>
      </div>

      {/* Alert banner */}
      {alertEssais.length > 0 && (
        <div style={{
          borderRadius: 14, padding: "12px 18px",
          background: "rgba(239,68,68,0.09)",
          border: "1px solid rgba(239,68,68,0.28)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 18 }}></span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#b91c1c" }}>
              {alertEssais.length === 1
                ? `1 essai expire dans moins de 3 jours`
                : `${alertEssais.length} essais expirent dans moins de 3 jours`}
            </div>
            <div style={{ fontSize: 12, color: "#dc2626", marginTop: 2 }}>
              {alertEssais.map(e => `${e.patientPrenom} ${e.patientNom} (J-${getDaysRemaining(e)})`).join(" · ")}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {[
          { label: "Essais actifs",         value: actifs,          color: "#00C98A" },
          { label: "Expirant dans 7 jours", value: expirantSoon,    color: "#f59e0b" },
          { label: "Convertis ce mois",     value: convertisMois,   color: "#6366f1" },
          { label: "Taux de conversion",    value: `${tauxConversion}%`, color: "#0891b2" },
        ].map(k => (
          <div key={k.label} style={{ ...glass, borderRadius: 16, padding: "16px 18px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              ...(filter === tab.key
                ? { background: "#10b981", color: "#fff", border: "none", boxShadow: "0 2px 8px rgba(16,185,129,0.25)" }
                : { ...glassSubtle, color: "#64748b", border: "1px solid rgba(148,163,184,0.25)" }),
            }}
          >
            {tab.label}
            {tab.count != null && (
              <span style={{
                fontSize: 10, fontWeight: 700, minWidth: 16, textAlign: "center",
                padding: "1px 5px", borderRadius: 999,
                background: filter === tab.key ? "rgba(255,255,255,0.25)" : "rgba(148,163,184,0.18)",
                color: filter === tab.key ? "#fff" : "#64748b",
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      {sorted.length === 0 ? (
        <div style={{ ...glass, borderRadius: 18, padding: "48px 0", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
          Aucun essai dans cette catégorie.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {sorted.map(essai => (
            <EssaiCard
              key={essai.id}
              essai={essai}
              onProlonger={(id) => setConfirmProlonger(id)}
              onAbandonner={(id) => setConfirmAbandonner(id)}
              onReouvrir={handleReouvrir}
              onConvertir={handleConvertir}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {modalOpen && <EssaiModal onSave={handleNewEssai} onClose={() => setModalOpen(false)} />}

      {confirmProlonger && (
        <ConfirmDialog
          message="Prolonger cet essai de 14 jours supplémentaires ?"
          confirmLabel="Prolonger"
          confirmColor="linear-gradient(135deg,#6366f1,#4338ca)"
          onConfirm={() => handleProlonger(confirmProlonger)}
          onCancel={() => setConfirmProlonger(null)}
        />
      )}

      {confirmAbandonner && (
        <ConfirmDialog
          message="Marquer cet essai comme abandonné ? Le patient ne sera plus relancé."
          confirmLabel="Abandonner"
          confirmColor="rgba(239,68,68,0.85)"
          onConfirm={() => handleAbandonner(confirmAbandonner)}
          onCancel={() => setConfirmAbandonner(null)}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
