"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  loadRegistry,
  saveRegistry,
  setCentreStatut,
  CentreRegistre,
} from "@/lib/centresRegistry";

/* ── Mock data ─────────────────────────────────────────────────────────────── */
const MOCK_CENTRES: CentreRegistre[] = [
  {
    id: "vision-mock-1",
    module: "vision",
    nom: "Clair Vision",
    adresse: "12 rue de la Santé",
    codePostal: "75014",
    ville: "Paris",
    email: "paris14@clair-vision.fr",
    telephone: "01 40 00 12 34",
    statut: "actif",
    siteVisible: true,
    dateInscription: "2025-11-15T10:00:00.000Z",
    dateFinEssai: "2026-01-15T10:00:00.000Z",
    derniereActivite: "2026-03-24T14:32:00.000Z",
    nbActivites: 87,
    notes: "",
  },
  {
    id: "audition-mock-1",
    module: "audition",
    nom: "Clair Audition",
    adresse: "15 avenue de la République",
    codePostal: "69001",
    ville: "Lyon",
    email: "lyon@clair-audition.fr",
    telephone: "04 72 00 34 56",
    statut: "actif",
    siteVisible: true,
    dateInscription: "2025-10-01T09:00:00.000Z",
    dateFinEssai: "2025-12-01T09:00:00.000Z",
    derniereActivite: "2026-03-25T09:15:00.000Z",
    nbActivites: 124,
    notes: "",
  },
  {
    id: "vision-mock-2",
    module: "vision",
    nom: "OptiCenter Marseille",
    adresse: "210A Rue Paradis",
    codePostal: "13006",
    ville: "Marseille",
    email: "marseille@opticenter.fr",
    telephone: "04 91 00 56 78",
    statut: "preactif",
    siteVisible: true,
    dateInscription: "2026-02-10T11:00:00.000Z",
    dateFinEssai: "2026-04-10T11:00:00.000Z",
    derniereActivite: "2026-03-20T16:00:00.000Z",
    nbActivites: 12,
    notes: "",
  },
  {
    id: "audition-mock-2",
    module: "audition",
    nom: "Son & Santé Bordeaux",
    adresse: "Cours de l'Intendance",
    codePostal: "33000",
    ville: "Bordeaux",
    email: "bordeaux@sonetsante.fr",
    statut: "preactif",
    siteVisible: true,
    dateInscription: "2026-03-01T10:00:00.000Z",
    dateFinEssai: "2026-05-01T10:00:00.000Z",
    derniereActivite: "2026-03-22T10:00:00.000Z",
    nbActivites: 6,
    notes: "",
  },
  {
    id: "vision-mock-3",
    module: "vision",
    nom: "VisionPlus Lille",
    adresse: "Place Rihour",
    codePostal: "59800",
    ville: "Lille",
    email: "contact@visionplus.fr",
    statut: "inactif",
    siteVisible: false,
    dateInscription: "2025-09-15T10:00:00.000Z",
    dateFinEssai: "2025-11-15T10:00:00.000Z",
    derniereActivite: "2025-11-10T12:00:00.000Z",
    nbActivites: 3,
    notes: "",
  },
];

/* ── Helpers ────────────────────────────────────────────────────────────────── */
function fmtDate(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function timeAgo(iso: string | undefined): string {
  if (!iso) return "Jamais";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 2) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Il y a ${days}j`;
  const months = Math.floor(days / 30);
  return `Il y a ${months} mois`;
}

function isPast(iso: string | undefined): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

function isWithin14Days(iso: string | undefined): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  const now = Date.now();
  return t > now && t - now <= 14 * 86400000;
}

/* ── Last-7-days activity chart helper ─────────────────────────────────────── */
function getLast7Days(): { label: string; dateStr: string }[] {
  const days: { label: string; dateStr: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
      dateStr: d.toISOString().slice(0, 10),
    });
  }
  return days;
}

/* ── CSV export ─────────────────────────────────────────────────────────────── */
function exportCSV(centres: CentreRegistre[]) {
  const headers = [
    "Module", "Nom", "Ville", "CP", "Email", "Téléphone",
    "Statut", "Visible", "Date inscription", "Fin essai",
    "Dernière activité", "Connexions",
  ];
  const rows = centres.map((c) => [
    c.module,
    c.nom,
    c.ville,
    c.codePostal,
    c.email ?? "",
    c.telephone ?? "",
    c.statut,
    c.siteVisible ? "Oui" : "Non",
    c.dateInscription ? new Date(c.dateInscription).toLocaleDateString("fr-FR") : "",
    c.dateFinEssai ? new Date(c.dateFinEssai).toLocaleDateString("fr-FR") : "",
    c.derniereActivite ? new Date(c.derniereActivite).toLocaleDateString("fr-FR") : "",
    String(c.nbActivites ?? 0),
  ]);
  const csv =
    "\uFEFF" +
    [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(";")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `thor-centres-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type FilterType = "tous" | "actif" | "preactif" | "inactif" | "vision" | "audition";

/* ═══════════════════════════════════════════════════════════════════════════ */
/* ── Auth Gate ────────────────────────────────────────────────────────────── */

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => {
    if (pin === "thor2026") {
      sessionStorage.setItem("thor_admin_auth", "1");
      onSuccess();
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg,#0B1220 0%,#1a2d50 100%)",
      }}
    >
      <div
        style={{
          background: "var(--glass-card-bg)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: "24px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.30)",
          padding: "48px 40px",
          width: "100%",
          maxWidth: "400px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0",
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            background: "linear-gradient(135deg,#0B1220,#2D4A80)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "24px",
            boxShadow: "0 8px 24px rgba(11,18,32,0.35)",
          }}
        >
          <span style={{ color: "#fff", fontSize: "28px", fontWeight: "800", letterSpacing: "-1px" }}>
            T
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "22px",
            fontWeight: "700",
            color: "#0B1220",
            textAlign: "center",
          }}
        >
          Espace administration
        </h1>
        <p
          style={{
            margin: "0 0 32px",
            fontSize: "13px",
            color: "#64748B",
            textAlign: "center",
          }}
        >
          Accès restreint — usage interne uniquement
        </p>

        {/* PIN input */}
        <input
          ref={inputRef}
          type="password"
          placeholder="Code d'accès"
          value={pin}
          onChange={(e) => { setPin(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "12px",
            border: error ? "1.5px solid #DC2626" : "1.5px solid #CBD5E1",
            fontSize: "15px",
            outline: "none",
            background: "#fff",
            color: "#0B1220",
            marginBottom: error ? "8px" : "16px",
            boxSizing: "border-box",
            transition: "border-color 0.15s",
          }}
        />

        {/* Error */}
        {error && (
          <p
            style={{
              margin: "0 0 16px",
              fontSize: "13px",
              color: "#DC2626",
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            Code incorrect
          </p>
        )}

        {/* Submit button */}
        <button
          type="button"
          onClick={submit}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: "12px",
            background: "#0B1220",
            color: "#fff",
            fontWeight: "700",
            fontSize: "15px",
            border: "none",
            cursor: "pointer",
            transition: "background 0.15s",
            boxSizing: "border-box",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#1A2D50")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#0B1220")}
        >
          Connexion
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* ── Edit Modal ───────────────────────────────────────────────────────────── */

type EditForm = {
  nom: string;
  module: "vision" | "audition";
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  email: string;
  statut: "actif" | "preactif" | "inactif";
  siteVisible: boolean;
  notes: string;
};

function EditModal({
  centre,
  onClose,
  onSave,
}: {
  centre: CentreRegistre;
  onClose: () => void;
  onSave: (updated: CentreRegistre) => void;
}) {
  const [form, setForm] = useState<EditForm>({
    nom: centre.nom,
    module: centre.module,
    adresse: centre.adresse,
    codePostal: centre.codePostal,
    ville: centre.ville,
    telephone: centre.telephone ?? "",
    email: centre.email ?? "",
    statut: centre.statut,
    siteVisible: centre.siteVisible,
    notes: centre.notes ?? "",
  });

  const set = <K extends keyof EditForm>(key: K, value: EditForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    const updated: CentreRegistre = {
      ...centre,
      nom: form.nom,
      module: form.module,
      adresse: form.adresse,
      codePostal: form.codePostal,
      ville: form.ville,
      telephone: form.telephone || undefined,
      email: form.email || undefined,
      statut: form.statut,
      siteVisible: form.siteVisible,
      notes: form.notes,
    };
    const all = loadRegistry();
    const idx = all.findIndex((c) => c.id === centre.id);
    if (idx >= 0) {
      all[idx] = updated;
      saveRegistry(all);
    }
    onSave(updated);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 13px",
    borderRadius: "10px",
    border: "1.5px solid #E2E8F0",
    fontSize: "14px",
    background: "#fff",
    color: "#0B1220",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748B",
    marginBottom: "5px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.5)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "24px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--glass-card-bg)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: "20px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "90vh",
          overflow: "auto",
          padding: "32px",
        }}
      >
        {/* Modal header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0B1220" }}>
              Modifier le centre
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748B" }}>
              {centre.nom}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              border: "1.5px solid #E2E8F0",
              background: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              color: "#64748B",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Form grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Nom du centre</label>
            <input style={inputStyle} value={form.nom} onChange={(e) => set("nom", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Module</label>
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={form.module}
              onChange={(e) => set("module", e.target.value as "vision" | "audition")}
            >
              <option value="vision">Vision</option>
              <option value="audition">Audition</option>
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Adresse</label>
            <input style={inputStyle} value={form.adresse} onChange={(e) => set("adresse", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Code postal</label>
            <input style={inputStyle} value={form.codePostal} onChange={(e) => set("codePostal", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Ville</label>
            <input style={inputStyle} value={form.ville} onChange={(e) => set("ville", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Téléphone</label>
            <input style={inputStyle} value={form.telephone} onChange={(e) => set("telephone", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Statut</label>
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={form.statut}
              onChange={(e) => set("statut", e.target.value as "actif" | "preactif" | "inactif")}
            >
              <option value="actif">Actif</option>
              <option value="preactif">Préactif (essai)</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingTop: "20px" }}>
            <input
              id="modal-visible"
              type="checkbox"
              checked={form.siteVisible}
              onChange={(e) => set("siteVisible", e.target.checked)}
              style={{ width: "17px", height: "17px", cursor: "pointer", accentColor: "#0B1220" }}
            />
            <label htmlFor="modal-visible" style={{ fontSize: "14px", fontWeight: "600", color: "#0B1220", cursor: "pointer" }}>
              Visible sur le site
            </label>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Notes internes</label>
            <textarea
              style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Notes visibles uniquement par l'administration…"
            />
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{ display: "flex", gap: "12px", marginTop: "24px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "1.5px solid #E2E8F0",
              background: "#fff",
              color: "#64748B",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: "10px 24px",
              borderRadius: "10px",
              border: "none",
              background: "#0B1220",
              color: "#fff",
              fontWeight: "700",
              fontSize: "14px",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#1A2D50")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#0B1220")}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* ── Main AdminPage ───────────────────────────────────────────────────────── */

export default function AdminPage() {
  const [isAuth, setIsAuth] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [registry, setRegistry] = useState<CentreRegistre[]>([]);
  const [filter, setFilter] = useState<FilterType>("tous");
  const [search, setSearch] = useState("");
  const [editingCentre, setEditingCentre] = useState<CentreRegistre | null>(null);

  /* Hydration + auth check */
  useEffect(() => {
    const auth = sessionStorage.getItem("thor_admin_auth") === "1";
    setIsAuth(auth);

    const data = loadRegistry();
    if (data.length === 0) {
      saveRegistry(MOCK_CENTRES);
      setRegistry(MOCK_CENTRES);
    } else {
      setRegistry(data);
    }
    setMounted(true);
  }, []);

  const reload = () => setRegistry(loadRegistry());

  const handleLogout = () => {
    sessionStorage.removeItem("thor_admin_auth");
    setIsAuth(false);
  };

  /* ── KPIs ── */
  const kpis = useMemo(() => {
    const actifs = registry.filter((c) => c.statut === "actif").length;
    const preactifs = registry.filter((c) => c.statut === "preactif").length;
    const inactifs = registry.filter((c) => c.statut === "inactif").length;
    const connexions = registry.reduce((acc, c) => acc + (c.nbActivites ?? 0), 0);
    const essaisExpirant = registry.filter(
      (c) => c.statut === "preactif" && isWithin14Days(c.dateFinEssai)
    ).length;
    return { actifs, preactifs, inactifs, connexions, essaisExpirant };
  }, [registry]);

  /* ── Filtered + searched list ── */
  const filtered = useMemo(() => {
    let list = registry;
    if (filter !== "tous") {
      if (filter === "actif") list = list.filter((c) => c.statut === "actif");
      else if (filter === "preactif") list = list.filter((c) => c.statut === "preactif");
      else if (filter === "inactif") list = list.filter((c) => c.statut === "inactif");
      else if (filter === "vision") list = list.filter((c) => c.module === "vision");
      else if (filter === "audition") list = list.filter((c) => c.module === "audition");
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.nom.toLowerCase().includes(q) ||
          c.ville.toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [registry, filter, search]);

  /* ── Activity chart data — total connexions per day ── */
  const last7 = useMemo(() => {
    const days = getLast7Days();
    return days.map((day) => {
      const total = registry.reduce((sum, c) => {
        if (c.derniereActivite && c.derniereActivite.slice(0, 10) === day.dateStr) {
          return sum + (c.nbActivites ?? 0);
        }
        return sum;
      }, 0);
      const centres = registry
        .filter((c) => c.derniereActivite && c.derniereActivite.slice(0, 10) === day.dateStr)
        .map((c) => c.nom);
      return { ...day, count: total, centres };
    });
  }, [registry]);

  const maxCount = useMemo(() => Math.max(...last7.map((d) => d.count), 1), [last7]);

  const weekTotal = useMemo(() => last7.reduce((s, d) => s + d.count, 0), [last7]);

  /* ── Actions ── */
  const handleActiver = (id: string) => { setCentreStatut(id, "actif", true); reload(); };
  const handleDesactiver = (id: string) => { setCentreStatut(id, "inactif", false); reload(); };
  const handleMasquer = (id: string, current: boolean) => {
    const c = registry.find((x) => x.id === id);
    if (!c) return;
    setCentreStatut(id, c.statut, !current);
    reload();
  };

  /* ── Not mounted yet ── */
  if (!mounted) {
    return (
      <main className="min-h-[calc(100vh-80px)] pt-28 pb-16 bg-thor-bg">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="skeleton h-10 w-64 rounded-2xl mb-4" />
          <div className="skeleton h-6 w-96 rounded-xl" />
        </div>
      </main>
    );
  }

  /* ── Auth gate ── */
  if (!isAuth) {
    return <LoginScreen onSuccess={() => setIsAuth(true)} />;
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <main className="min-h-[calc(100vh-80px)] pt-28 pb-16 bg-thor-bg">
      <div className="mx-auto max-w-[1400px] px-6 space-y-10">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Left */}
          <div className="flex items-start gap-4">
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "13px",
                background: "linear-gradient(135deg,#0B1220,#2D4A80)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(11,18,32,0.30)",
                flexShrink: 0,
              }}
            >
              <span style={{ color: "#fff", fontSize: "22px", fontWeight: "800" }}>T</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: "rgba(45,140,255,0.10)", color: "#1A72E8", border: "1px solid rgba(45,140,255,0.20)" }}
                >
                  Admin THOR
                </div>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-thor-text h-title" style={{ lineHeight: 1.15 }}>
                Tableau de bord
              </h1>
              <p className="mt-1 text-sm text-thor-muted">Gestion des comptes praticiens</p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => exportCSV(registry)}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold transition"
              style={{
                background: "rgba(45,140,255,0.08)",
                color: "#1A72E8",
                border: "1.5px solid rgba(45,140,255,0.25)",
              }}
            >
              Exporter CSV
            </button>
            <Link
              href="/"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold"
              style={{
                background: "rgba(100,116,139,0.08)",
                color: "#475569",
                border: "1.5px solid #E2E8F0",
              }}
            >
              Voir le site →
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold transition"
              style={{
                background: "transparent",
                color: "#DC2626",
                border: "1.5px solid rgba(220,38,38,0.35)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220,38,38,0.07)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* ── KPI Cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Actifs */}
          <KpiCard
            label="Actifs"
            value={kpis.actifs}
            badge="centres"
            accent="#00C98A"
            accentBg="rgba(0,201,138,0.12)"
            barColor="#00C98A"
            barBg="rgba(0,201,138,0.20)"
            fraction={registry.length > 0 ? kpis.actifs / registry.length : 0}
          />
          {/* En essai */}
          <KpiCard
            label="En essai (préactif)"
            value={kpis.preactifs}
            badge="centres"
            accent="#B45309"
            accentBg="rgba(217,119,6,0.12)"
            barColor="#D97706"
            barBg="rgba(217,119,6,0.15)"
            fraction={registry.length > 0 ? kpis.preactifs / registry.length : 0}
          />
          {/* Inactifs */}
          <KpiCard
            label="Inactifs"
            value={kpis.inactifs}
            badge="centres"
            accent="#64748B"
            accentBg="rgba(100,116,139,0.12)"
            barColor="#94A3B8"
            barBg="rgba(100,116,139,0.15)"
            fraction={registry.length > 0 ? kpis.inactifs / registry.length : 0}
          />
          {/* Connexions */}
          <KpiCard
            label="Connexions totales"
            value={kpis.connexions}
            badge="logins"
            accent="#1A72E8"
            accentBg="rgba(45,140,255,0.10)"
            barColor="#2D8CFF"
            barBg="rgba(45,140,255,0.12)"
            fraction={1}
          />
          {/* Essais expirant */}
          <KpiCard
            label="Essais expirant"
            value={kpis.essaisExpirant}
            badge="< 14j"
            accent="#92400E"
            accentBg="rgba(251,191,36,0.18)"
            barColor="#F59E0B"
            barBg="rgba(251,191,36,0.20)"
            fraction={kpis.preactifs > 0 ? kpis.essaisExpirant / kpis.preactifs : 0}
            icon={
              <svg viewBox="0 0 24 24" fill="none" style={{ width: "18px", height: "18px", color: "#D97706" }}>
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
            }
          />
        </div>

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "tous", label: "Tous" },
              { key: "actif", label: "Actifs" },
              { key: "preactif", label: "En essai" },
              { key: "inactif", label: "Inactifs" },
              { key: "vision", label: "Vision" },
              { key: "audition", label: "Audition" },
            ] as { key: FilterType; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className="rounded-full px-4 py-2 text-sm font-medium transition"
              style={
                filter === key
                  ? {
                      background:
                        key === "vision" || key === "tous"
                          ? "#2D8CFF"
                          : key === "audition"
                          ? "#00C98A"
                          : "#0B1220",
                      color: "#fff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }
                  : {
                      background: "white",
                      color: "#64748B",
                      border: "1px solid #E2E8F0",
                    }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Search ──────────────────────────────────────────────────────── */}
        <div style={{ position: "relative", maxWidth: "420px" }}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "16px",
              height: "16px",
              color: "#94A3B8",
              pointerEvents: "none",
            }}
          >
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher par nom, ville ou email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "11px 14px 11px 40px",
              borderRadius: "12px",
              border: "1.5px solid #E2E8F0",
              background: "#fff",
              fontSize: "14px",
              color: "#0B1220",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* ── Table / Empty state ──────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-thor-border bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] px-8 py-16 text-center">
            <div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "rgba(45,140,255,0.07)", border: "1.5px solid rgba(45,140,255,0.20)" }}
            >
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" style={{ color: "#2D8CFF" }}>
                <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-thor-text mb-2">
              Aucun résultat
            </h2>
            <p className="text-sm text-thor-muted max-w-md mx-auto leading-relaxed">
              {search
                ? "Aucun centre ne correspond à votre recherche."
                : "Les centres apparaissent ici automatiquement après que le praticien a complété l'assistant d'inscription."}
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-thor-border bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="px-6 py-4 border-b border-thor-border flex items-center justify-between">
              <div className="text-sm font-semibold text-thor-text">
                {filtered.length} centre{filtered.length > 1 ? "s" : ""}
                {search && <span className="text-thor-muted font-normal"> — recherche &ldquo;{search}&rdquo;</span>}
              </div>
              <div className="text-xs text-thor-muted">
                Total registre : {registry.length}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-thor-border bg-thor-bg/60">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-thor-muted whitespace-nowrap">Module</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-thor-muted whitespace-nowrap">Centre</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-thor-muted whitespace-nowrap">Ville</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-thor-muted whitespace-nowrap">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-thor-muted whitespace-nowrap">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-thor-muted whitespace-nowrap">Visible</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-thor-muted whitespace-nowrap">Inscription</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-thor-muted whitespace-nowrap">Fin essai</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-thor-muted whitespace-nowrap">Dernière activité</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-thor-muted whitespace-nowrap">Connexions</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-thor-muted whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-thor-border/60">
                  {filtered.map((centre) => (
                    <CentreRow
                      key={centre.id}
                      centre={centre}
                      onActiver={() => handleActiver(centre.id)}
                      onDesactiver={() => handleDesactiver(centre.id)}
                      onMasquer={() => handleMasquer(centre.id, centre.siteVisible)}
                      onEdit={() => setEditingCentre(centre)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Activity chart ───────────────────────────────────────────────── */}
        <div className="rounded-3xl border border-thor-border bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] px-6 py-6">
          <div className="mb-5 flex items-start justify-between flex-wrap gap-2">
            <div>
              <div className="text-sm font-semibold text-thor-text">Connexions par jour</div>
              <div className="text-xs text-thor-muted mt-0.5">
                Total connexions basé sur <code>nbActivites</code> — 7 derniers jours
              </div>
            </div>
            <div
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "rgba(45,140,255,0.08)", color: "#1A72E8", border: "1px solid rgba(45,140,255,0.18)" }}
            >
              {weekTotal} connexion{weekTotal > 1 ? "s" : ""} cette semaine
            </div>
          </div>
          <div className="flex items-end gap-3">
            {last7.map((day) => {
              const pct = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
              const hasActivity = day.count > 0;
              return (
                <div key={day.dateStr} className="flex flex-1 flex-col items-center gap-2 group relative">
                  {hasActivity && (
                    <div
                      className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 hidden group-hover:block
                        rounded-xl border border-thor-border bg-white shadow-[0_4px_16px_rgba(0,0,0,0.10)]
                        px-3 py-2 min-w-[140px] text-left"
                    >
                      <div className="text-xs font-semibold text-thor-text mb-1">{day.label}</div>
                      <div className="text-[11px] font-bold text-[#2D8CFF] mb-1">{day.count} connexion{day.count > 1 ? "s" : ""}</div>
                      {day.centres.map((n) => (
                        <div key={n} className="text-[11px] text-thor-muted">{n}</div>
                      ))}
                    </div>
                  )}
                  <div className="w-full rounded-t-lg relative overflow-hidden" style={{ height: "80px" }}>
                    <div
                      className="absolute bottom-0 left-0 w-full rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${Math.max(pct, hasActivity ? 8 : 0)}%`,
                        background: hasActivity
                          ? "linear-gradient(to top, #2D8CFF, #5BA8FF)"
                          : "transparent",
                        minHeight: hasActivity ? "6px" : "0",
                      }}
                    />
                    {!hasActivity && (
                      <div
                        className="absolute bottom-0 left-0 w-full rounded-t-lg"
                        style={{ height: "4px", background: "#E2E8F0" }}
                      />
                    )}
                  </div>
                  <div
                    className="text-xs font-semibold"
                    style={{ color: hasActivity ? "#2D8CFF" : "#94A3B8" }}
                  >
                    {day.count}
                  </div>
                  <div className="text-[11px] text-thor-muted text-center leading-tight">
                    {day.label}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-4 text-[11px] text-thor-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#2D8CFF" }} />
              Connexions enregistrées
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block bg-thor-border" />
              Aucune activité
            </span>
          </div>
        </div>

      </div>

      {/* ── Edit modal ── */}
      {editingCentre && (
        <EditModal
          centre={editingCentre}
          onClose={() => setEditingCentre(null)}
          onSave={() => { reload(); setEditingCentre(null); }}
        />
      )}
    </main>
  );
}

/* ── KPI Card sub-component ─────────────────────────────────────────────────── */
function KpiCard({
  label,
  value,
  badge,
  accent,
  accentBg,
  barColor,
  barBg,
  fraction,
  icon,
}: {
  label: string;
  value: number;
  badge: string;
  accent: string;
  accentBg: string;
  barColor: string;
  barBg: string;
  fraction: number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-thor-border bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] px-5 py-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-thor-muted">
          {label}
        </div>
        {icon && <div>{icon}</div>}
      </div>
      <div className="flex items-end gap-3">
        <span className="text-4xl font-bold text-thor-text">{value}</span>
        <span
          className="mb-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{ background: accentBg, color: accent }}
        >
          {badge}
        </span>
      </div>
      <div className="mt-3 h-1 rounded-full" style={{ background: barBg }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(fraction * 100, 100)}%`, background: barColor }}
        />
      </div>
    </div>
  );
}

/* ── CentreRow sub-component ───────────────────────────────────────────────── */
function CentreRow({
  centre,
  onActiver,
  onDesactiver,
  onMasquer,
  onEdit,
}: {
  centre: CentreRegistre;
  onActiver: () => void;
  onDesactiver: () => void;
  onMasquer: () => void;
  onEdit: () => void;
}) {
  const isVision = centre.module === "vision";

  return (
    <tr className="hover:bg-thor-bg/40 transition-colors">
      {/* Module */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
          style={
            isVision
              ? { background: "rgba(45,140,255,0.10)", color: "#1A72E8" }
              : { background: "rgba(0,201,138,0.10)", color: "#00A872" }
          }
        >
          {isVision ? "Vision" : "Audition"}
        </span>
      </td>

      {/* Nom */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="font-semibold text-thor-text">{centre.nom}</span>
        {centre.notes && (
          <div className="text-[11px] text-thor-muted/70 mt-0.5 max-w-[160px] truncate" title={centre.notes}>
            {centre.notes}
          </div>
        )}
      </td>

      {/* Ville + CP */}
      <td className="px-4 py-3 whitespace-nowrap text-thor-muted">
        {centre.ville}
        {centre.codePostal ? (
          <span className="ml-1 text-xs text-thor-muted/60">{centre.codePostal}</span>
        ) : null}
      </td>

      {/* Contact */}
      <td className="px-4 py-3">
        <div className="text-xs text-thor-text">{centre.email ?? "—"}</div>
        {centre.telephone && (
          <div className="text-xs text-thor-muted mt-0.5">{centre.telephone}</div>
        )}
      </td>

      {/* Statut */}
      <td className="px-4 py-3 whitespace-nowrap">
        <StatutBadge statut={centre.statut} />
      </td>

      {/* Visible */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
          style={
            centre.siteVisible
              ? { background: "rgba(0,201,138,0.10)", color: "#00A872" }
              : { background: "rgba(100,116,139,0.10)", color: "#64748B" }
          }
        >
          {centre.siteVisible ? "Oui" : "Non"}
        </span>
      </td>

      {/* Date inscription */}
      <td className="px-4 py-3 whitespace-nowrap text-xs text-thor-muted">
        {fmtDate(centre.dateInscription)}
      </td>

      {/* Fin essai */}
      <td className="px-4 py-3 whitespace-nowrap text-xs">
        <span style={{ color: isPast(centre.dateFinEssai) ? "#DC2626" : isWithin14Days(centre.dateFinEssai) ? "#D97706" : "#64748B" }}>
          {fmtDate(centre.dateFinEssai)}
        </span>
        {isWithin14Days(centre.dateFinEssai) && (
          <div className="text-[10px] font-semibold mt-0.5" style={{ color: "#D97706" }}>Expire bientôt</div>
        )}
      </td>

      {/* Dernière activité */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-xs text-thor-text">{timeAgo(centre.derniereActivite)}</div>
        {centre.derniereActivite && (
          <div className="text-[11px] text-thor-muted mt-0.5">
            {fmtDate(centre.derniereActivite)}
          </div>
        )}
      </td>

      {/* Nb connexions */}
      <td className="px-4 py-3 text-center">
        <span
          className="inline-flex items-center justify-center rounded-full min-w-[28px] h-6 px-2 text-xs font-bold"
          style={{ background: "rgba(45,140,255,0.10)", color: "#1A72E8" }}
        >
          {centre.nbActivites ?? 0}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          {/* Edit button */}
          <button
            type="button"
            onClick={onEdit}
            title="Modifier"
            className="rounded-lg p-1.5 transition-all"
            style={{ background: "rgba(45,140,255,0.08)", color: "#1A72E8", border: "1px solid rgba(45,140,255,0.18)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" style={{ width: "14px", height: "14px" }}>
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <ActionButton
            label="Activer"
            disabled={centre.statut === "actif" && centre.siteVisible}
            onClick={onActiver}
            color="#00C98A"
            colorBg="rgba(0,201,138,0.10)"
          />
          <ActionButton
            label="Désactiver"
            disabled={centre.statut === "inactif"}
            onClick={onDesactiver}
            color="#64748B"
            colorBg="rgba(100,116,139,0.10)"
          />
          <ActionButton
            label={centre.siteVisible ? "Masquer" : "Afficher"}
            disabled={false}
            onClick={onMasquer}
            color="#D97706"
            colorBg="rgba(217,119,6,0.10)"
          />
        </div>
      </td>
    </tr>
  );
}

function StatutBadge({ statut }: { statut: CentreRegistre["statut"] }) {
  if (statut === "actif") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
        style={{ background: "rgba(0,201,138,0.10)", color: "#00A872" }}
      >
        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#00C98A" }} />
        Actif
      </span>
    );
  }
  if (statut === "preactif") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
        style={{ background: "rgba(217,119,6,0.10)", color: "#B45309" }}
      >
        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#D97706" }} />
        En essai
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: "rgba(100,116,139,0.10)", color: "#64748B" }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#94A3B8" }} />
      Inactif
    </span>
  );
}

function ActionButton({
  label,
  disabled,
  onClick,
  color,
  colorBg,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  color: string;
  colorBg: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all"
      style={
        disabled
          ? { background: "#F1F5F9", color: "#CBD5E1", cursor: "not-allowed" }
          : { background: colorBg, color, cursor: "pointer" }
      }
    >
      {label}
    </button>
  );
}
