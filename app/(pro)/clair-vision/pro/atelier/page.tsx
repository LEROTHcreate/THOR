"use client";

import React, { useState, useEffect, useCallback } from "react";

/* ── Types ──────────────────────────────────────────────────────────────────── */
interface CommandeAtelier {
  id: string;
  patientNom: string;
  patientPrenom: string;
  praticien: string;
  labo: string;
  type: string;
  refOD?: string;
  refOG?: string;
  dateCommande: string;
  dateEstimee?: string;
  dateLivraison?: string;
  statut: "Commandé" | "En fabrication" | "Reçu au labo" | "Contrôle qualité" | "Prêt à récupérer" | "Livré";
  urgent: boolean;
  notes?: string;
}

interface PatientLS {
  id: string;
  nom: string;
  prenom: string;
}

/* ── Constants ──────────────────────────────────────────────────────────────── */
const LS_KEY = "thor_pro_vision_atelier";
const LS_PATIENTS = "thor_pro_patients";

const STATUTS: CommandeAtelier["statut"][] = [
  "Commandé",
  "En fabrication",
  "Reçu au labo",
  "Contrôle qualité",
  "Prêt à récupérer",
  "Livré",
];

const STATUT_COLORS: Record<CommandeAtelier["statut"], string> = {
  "Commandé": "#94a3b8",
  "En fabrication": "#f59e0b",
  "Reçu au labo": "#6366f1",
  "Contrôle qualité": "#8b5cf6",
  "Prêt à récupérer": "#00C98A",
  "Livré": "#64748b",
};

const LABOS = ["Essilor", "Hoya", "Zeiss", "Nikon", "Shamir", "Rodenstock", "Autre"];
const TYPES = [
  "Verres unifocaux",
  "Verres progressifs",
  "Verres antireflets",
  "Lentilles rigides",
  "Monture seule",
  "Pack complet",
];

const DEMO_COMMANDES: CommandeAtelier[] = [
  {
    id: "at1",
    patientNom: "Leblanc",
    patientPrenom: "Marie",
    praticien: "Dr. Martin",
    labo: "Essilor",
    type: "Verres progressifs",
    dateCommande: "2026-03-28",
    dateEstimee: "2026-04-08",
    statut: "En fabrication",
    urgent: false,
  },
  {
    id: "at2",
    patientNom: "Renaud",
    patientPrenom: "Paul",
    praticien: "Dr. Martin",
    labo: "Hoya",
    type: "Verres antireflets",
    dateCommande: "2026-04-01",
    dateEstimee: "2026-04-05",
    statut: "Prêt à récupérer",
    urgent: true,
  },
  {
    id: "at3",
    patientNom: "Morel",
    patientPrenom: "Isabelle",
    praticien: "Julien Dubois",
    labo: "Zeiss",
    type: "Verres progressifs",
    dateCommande: "2026-03-20",
    dateEstimee: "2026-04-03",
    statut: "Contrôle qualité",
    urgent: false,
  },
];

/* ── Helpers ────────────────────────────────────────────────────────────────── */
function loadCommandes(): CommandeAtelier[] {
  if (typeof window === "undefined") return DEMO_COMMANDES;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEMO_COMMANDES;
    const parsed = JSON.parse(raw) as CommandeAtelier[];
    return parsed.length ? parsed : DEMO_COMMANDES;
  } catch {
    return DEMO_COMMANDES;
  }
}

function saveCommandes(data: CommandeAtelier[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

function loadPatients(): PatientLS[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_PATIENTS);
    if (!raw) return [];
    return JSON.parse(raw) as PatientLS[];
  } catch {
    return [];
  }
}

function isRetard(commande: CommandeAtelier): boolean {
  if (!commande.dateEstimee || commande.statut === "Livré") return false;
  return new Date(commande.dateEstimee) < new Date(new Date().toISOString().split("T")[0]);
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function nextStatut(statut: CommandeAtelier["statut"]): CommandeAtelier["statut"] | null {
  const idx = STATUTS.indexOf(statut);
  if (idx === -1 || idx === STATUTS.length - 1) return null;
  return STATUTS[idx + 1];
}

function statutProgress(statut: CommandeAtelier["statut"]): number {
  const idx = STATUTS.indexOf(statut);
  return Math.round(((idx + 1) / STATUTS.length) * 100);
}

/* ── Toast ──────────────────────────────────────────────────────────────────── */
interface Toast {
  id: string;
  message: string;
  type: "success" | "info";
}

/* ── Main Page ──────────────────────────────────────────────────────────────── */
export default function AtelierPage() {
  const [commandes, setCommandes] = useState<CommandeAtelier[]>([]);
  const [patients, setPatients] = useState<PatientLS[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [filterStatut, setFilterStatut] = useState<CommandeAtelier["statut"] | "Tous">("Tous");
  const [search, setSearch] = useState("");

  // Form state
  const [form, setForm] = useState<{
    patientId: string;
    patientNomLibre: string;
    patientPrenomLibre: string;
    praticien: string;
    labo: string;
    type: string;
    refOD: string;
    refOG: string;
    dateCommande: string;
    dateEstimee: string;
    urgent: boolean;
    notes: string;
  }>({
    patientId: "",
    patientNomLibre: "",
    patientPrenomLibre: "",
    praticien: "",
    labo: "Essilor",
    type: "Verres progressifs",
    refOD: "",
    refOG: "",
    dateCommande: todayStr(),
    dateEstimee: "",
    urgent: false,
    notes: "",
  });

  useEffect(() => {
    setCommandes(loadCommandes());
    setPatients(loadPatients());
  }, []);

  const pushToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target;
    const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
    setForm(prev => ({ ...prev, [target.name]: value }));
  };

  const handlePatientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pid = e.target.value;
    if (pid === "__libre__") {
      setForm(prev => ({ ...prev, patientId: "__libre__", patientNomLibre: "", patientPrenomLibre: "" }));
      return;
    }
    const p = patients.find(p => p.id === pid);
    setForm(prev => ({
      ...prev,
      patientId: pid,
      patientNomLibre: p ? p.nom : "",
      patientPrenomLibre: p ? p.prenom : "",
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let patientNom = form.patientNomLibre;
    let patientPrenom = form.patientPrenomLibre;

    if (form.patientId && form.patientId !== "__libre__") {
      const p = patients.find(p => p.id === form.patientId);
      if (p) {
        patientNom = p.nom;
        patientPrenom = p.prenom;
      }
    }

    if (!patientNom.trim()) {
      pushToast("Veuillez renseigner le patient.", "info");
      return;
    }
    if (!form.praticien.trim()) {
      pushToast("Veuillez renseigner le praticien.", "info");
      return;
    }

    const newCommande: CommandeAtelier = {
      id: `at_${Date.now()}`,
      patientNom: patientNom.trim(),
      patientPrenom: patientPrenom.trim(),
      praticien: form.praticien.trim(),
      labo: form.labo,
      type: form.type,
      refOD: form.refOD.trim() || undefined,
      refOG: form.refOG.trim() || undefined,
      dateCommande: form.dateCommande || todayStr(),
      dateEstimee: form.dateEstimee || undefined,
      statut: "Commandé",
      urgent: form.urgent,
      notes: form.notes.trim() || undefined,
    };

    const updated = [newCommande, ...commandes];
    setCommandes(updated);
    saveCommandes(updated);
    pushToast(`Commande créée pour ${patientPrenom} ${patientNom}.`);
    setShowForm(false);
    setForm({
      patientId: "",
      patientNomLibre: "",
      patientPrenomLibre: "",
      praticien: "",
      labo: "Essilor",
      type: "Verres progressifs",
      refOD: "",
      refOG: "",
      dateCommande: todayStr(),
      dateEstimee: "",
      urgent: false,
      notes: "",
    });
  };

  const handleAvancer = (id: string) => {
    const updated = commandes.map(c => {
      if (c.id !== id) return c;
      const next = nextStatut(c.statut);
      if (!next) return c;
      return {
        ...c,
        statut: next,
        dateLivraison: next === "Livré" ? todayStr() : c.dateLivraison,
      };
    });
    setCommandes(updated);
    saveCommandes(updated);
    const cmd = updated.find(c => c.id === id);
    if (cmd) pushToast(`Statut mis à jour : ${cmd.statut}`);
  };

  const handleNotify = (commande: CommandeAtelier) => {
    pushToast(`Notification envoyée à ${commande.patientPrenom} ${commande.patientNom}`);
  };

  // KPIs
  const today = todayStr();
  const currentMonth = today.slice(0, 7);
  const kpiEnCours = commandes.filter(c => c.statut !== "Livré").length;
  const kpiEnRetard = commandes.filter(c => isRetard(c)).length;
  const kpiPrets = commandes.filter(c => c.statut === "Prêt à récupérer").length;
  const kpiLivresMois = commandes.filter(
    c => c.statut === "Livré" && c.dateLivraison && c.dateLivraison.startsWith(currentMonth)
  ).length;

  // Filtered list
  const filtered = commandes.filter(c => {
    if (filterStatut !== "Tous" && c.statut !== filterStatut) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const fullName = `${c.patientPrenom} ${c.patientNom}`.toLowerCase();
      if (!fullName.includes(q) && !c.patientNom.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  /* ── Glassmorphism styles ────────────────────────────────────────────────── */
  const glass: React.CSSProperties = {
    background: "var(--glass-bg)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid var(--glass-border)",
    borderRadius: 18,
  };

  const glassCard: React.CSSProperties = {
    ...glass,
    padding: "20px 22px",
  };

  const accent = "#2D8CFF";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg,#f8fafc 0%,#f0f7ff 45%,#f8fafc 100%)", padding: "28px 24px" }}>

      {/* Toasts */}
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              background: t.type === "success" ? "rgba(0,201,138,0.95)" : "rgba(45,140,255,0.95)",
              color: "#fff",
              borderRadius: 12,
              padding: "12px 18px",
              fontSize: 14,
              fontWeight: 500,
              boxShadow: "0 4px 18px rgba(0,0,0,0.14)",
              backdropFilter: "blur(10px)",
              animation: "fadeInRight 0.25s ease",
              maxWidth: 340,
            }}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1e293b", margin: 0 }}>Suivi Atelier &amp; Labo</h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: "4px 0 0" }}>Gérez le cycle de vie de vos commandes verres et montures</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            background: `linear-gradient(135deg, ${accent}, #1a70e0)`,
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "11px 20px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: `0 4px 14px ${accent}44`,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
          Nouvelle commande
        </button>
      </div>

      {/* Pipeline statuts */}
      <div style={{ ...glassCard, marginBottom: 24, padding: "16px 22px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", marginBottom: 12 }}>Pipeline commandes</div>
        <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto" }}>
          {STATUTS.map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 110 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: STATUT_COLORS[s],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    boxShadow: `0 2px 8px ${STATUT_COLORS[s]}55`,
                  }}
                >
                  {i + 1}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#334155", textAlign: "center", lineHeight: 1.3 }}>{s}</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: STATUT_COLORS[s],
                  background: `${STATUT_COLORS[s]}18`,
                  borderRadius: 20,
                  padding: "2px 8px",
                }}>
                  {commandes.filter(c => c.statut === s).length}
                </span>
              </div>
              {i < STATUTS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: "linear-gradient(90deg,rgba(148,163,184,0.3),rgba(148,163,184,0.1))", minWidth: 20, marginBottom: 18 }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: "En cours", value: kpiEnCours, color: accent, sub: "commandes actives" },
          { label: "En retard", value: kpiEnRetard, color: "#ef4444", sub: "date dépassée", badge: true },
          { label: "Prêtes à récupérer", value: kpiPrets, color: "#00C98A", sub: "à notifier" },
          { label: "Livrées ce mois", value: kpiLivresMois, color: "#64748b", sub: "ce mois-ci" },
        ].map(kpi => (
          <div key={kpi.label} style={{ ...glassCard, textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: kpi.color, lineHeight: 1 }}>
              {kpi.value}
              {kpi.badge && kpi.value > 0 && (
                <span style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  background: "#ef4444",
                  borderRadius: "50%",
                  marginLeft: 6,
                  verticalAlign: "middle",
                  animation: "pulse 1.5s infinite",
                }} />
              )}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginTop: 6 }}>{kpi.label}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Formulaire nouvelle commande */}
      {showForm && (
        <div style={{ ...glassCard, marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", margin: 0 }}>Nouvelle commande</h2>
            <button
              onClick={() => setShowForm(false)}
              style={{ background: "rgba(148,163,184,0.15)", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>

              {/* Patient */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Patient</label>
                <select
                  name="patientId"
                  value={form.patientId}
                  onChange={handlePatientSelect}
                  style={inputStyle}
                >
                  <option value="">— Sélectionner —</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
                  ))}
                  <option value="__libre__">Saisie libre…</option>
                </select>
                {(form.patientId === "__libre__" || !form.patientId) && (
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <input
                      name="patientPrenomLibre"
                      value={form.patientPrenomLibre}
                      onChange={handleFormChange}
                      placeholder="Prénom"
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <input
                      name="patientNomLibre"
                      value={form.patientNomLibre}
                      onChange={handleFormChange}
                      placeholder="Nom"
                      style={{ ...inputStyle, flex: 1 }}
                    />
                  </div>
                )}
              </div>

              {/* Praticien */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Praticien</label>
                <input
                  name="praticien"
                  value={form.praticien}
                  onChange={handleFormChange}
                  placeholder="Dr. Nom"
                  style={inputStyle}
                />
              </div>

              {/* Labo */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Labo fournisseur</label>
                <select name="labo" value={form.labo} onChange={handleFormChange} style={inputStyle}>
                  {LABOS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Type */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Type</label>
                <select name="type" value={form.type} onChange={handleFormChange} style={inputStyle}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Ref OD */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Référence verre OD</label>
                <input
                  name="refOD"
                  value={form.refOD}
                  onChange={handleFormChange}
                  placeholder="ex. Varilux X 1.67"
                  style={inputStyle}
                />
              </div>

              {/* Ref OG */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Référence verre OG</label>
                <input
                  name="refOG"
                  value={form.refOG}
                  onChange={handleFormChange}
                  placeholder="ex. Varilux X 1.67"
                  style={inputStyle}
                />
              </div>

              {/* Date commande */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Date commande</label>
                <input
                  type="date"
                  name="dateCommande"
                  value={form.dateCommande}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </div>

              {/* Date estimée */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Date estimée livraison</label>
                <input
                  type="date"
                  name="dateEstimee"
                  value={form.dateEstimee}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Notes + urgence */}
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleFormChange}
                  rows={2}
                  placeholder="Observations, spécifications particulières…"
                  style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 22 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#f59e0b" }}>
                  <input
                    type="checkbox"
                    name="urgent"
                    checked={form.urgent}
                    onChange={handleFormChange}
                    style={{ width: 16, height: 16, accentColor: "#f59e0b" }}
                  />
                  Commande urgente
                </label>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{ ...btnSecondary }}
              >
                Annuler
              </button>
              <button type="submit" style={{ ...btnPrimary, background: `linear-gradient(135deg, ${accent}, #1a70e0)`, boxShadow: `0 4px 14px ${accent}44` }}>
                Créer la commande
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtres + recherche */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 280 }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 15, pointerEvents: "none" }}></span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un patient…"
            style={{ ...inputStyle, paddingLeft: 34, width: "100%", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["Tous", ...STATUTS] as Array<CommandeAtelier["statut"] | "Tous">).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatut(s)}
              style={{
                border: "none",
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                background: filterStatut === s
                  ? (s === "Tous" ? accent : STATUT_COLORS[s as CommandeAtelier["statut"]])
                  : "rgba(255,255,255,0.7)",
                color: filterStatut === s ? "#fff" : "#475569",
                boxShadow: filterStatut === s ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
                backdropFilter: "blur(8px)",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Liste commandes */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.length === 0 && (
          <div style={{ ...glassCard, textAlign: "center", color: "#94a3b8", fontSize: 14, padding: "40px 20px" }}>
            Aucune commande trouvée.
          </div>
        )}
        {filtered.map(cmd => {
          const retard = isRetard(cmd);
          const statutColor = STATUT_COLORS[cmd.statut];
          const progress = statutProgress(cmd.statut);
          const next = nextStatut(cmd.statut);

          return (
            <div key={cmd.id} style={{
              ...glass,
              padding: "18px 22px",
              borderLeft: `4px solid ${statutColor}`,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                {/* Infos patient */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
                      {cmd.patientPrenom} {cmd.patientNom}
                    </span>
                    {cmd.urgent && (
                      <span style={{ fontSize: 11, fontWeight: 700, background: "#fff7ed", color: "#f59e0b", border: "1px solid #fde68a", borderRadius: 20, padding: "2px 10px" }}>
                        Urgent
                      </span>
                    )}
                    {retard && (
                      <span style={{ fontSize: 11, fontWeight: 700, background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 20, padding: "2px 10px" }}>
                        En retard
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span>{cmd.praticien}</span>
                    <span>{cmd.labo}</span>
                    <span>{cmd.type}</span>
                    {cmd.refOD && <span>OD: {cmd.refOD}</span>}
                    {cmd.refOG && <span>OG: {cmd.refOG}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span>Commandé le {cmd.dateCommande}</span>
                    {cmd.dateEstimee && <span>Estimé le {cmd.dateEstimee}</span>}
                    {cmd.dateLivraison && <span>Livré le {cmd.dateLivraison}</span>}
                  </div>
                  {cmd.notes && (
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 6, background: "rgba(241,245,249,0.7)", borderRadius: 8, padding: "6px 10px", fontStyle: "italic" }}>
                      {cmd.notes}
                    </div>
                  )}
                </div>

                {/* Statut + actions */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, minWidth: 160 }}>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    background: `${statutColor}18`,
                    color: statutColor,
                    border: `1px solid ${statutColor}40`,
                    borderRadius: 20,
                    padding: "4px 14px",
                    whiteSpace: "nowrap",
                  }}>
                    {cmd.statut}
                  </span>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {next && (
                      <button
                        onClick={() => handleAvancer(cmd.id)}
                        style={{
                          background: `linear-gradient(135deg, ${STATUT_COLORS[next]}, ${STATUT_COLORS[next]}bb)`,
                          color: "#fff",
                          border: "none",
                          borderRadius: 10,
                          padding: "7px 13px",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          boxShadow: `0 2px 8px ${STATUT_COLORS[next]}44`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        → {next}
                      </button>
                    )}
                    <button
                      onClick={() => handleNotify(cmd)}
                      style={{
                        background: "rgba(45,140,255,0.1)",
                        color: accent,
                        border: `1px solid ${accent}30`,
                        borderRadius: 10,
                        padding: "7px 13px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Notifier patient
                    </button>
                  </div>
                </div>
              </div>

              {/* Barre de progression */}
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  {STATUTS.map(s => (
                    <span
                      key={s}
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: STATUTS.indexOf(s) <= STATUTS.indexOf(cmd.statut) ? statutColor : "#cbd5e1",
                        textAlign: "center",
                        flex: 1,
                        transition: "color 0.3s",
                      }}
                    >
                      ●
                    </span>
                  ))}
                </div>
                <div style={{ height: 5, background: "rgba(203,213,225,0.5)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${statutColor}, ${statutColor}bb)`,
                    borderRadius: 99,
                    transition: "width 0.4s ease",
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

/* ── Shared input/button styles ──────────────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  background: "var(--glass-strong-bg)",
  border: "1px solid rgba(203,213,225,0.8)",
  borderRadius: 10,
  padding: "9px 13px",
  fontSize: 13,
  color: "#1e293b",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const btnPrimary: React.CSSProperties = {
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "10px 20px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  background: "rgba(148,163,184,0.15)",
  color: "#475569",
  border: "1px solid rgba(148,163,184,0.3)",
  borderRadius: 10,
  padding: "10px 20px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
