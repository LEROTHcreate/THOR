"use client";

import { useRouter } from "next/navigation";
import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Button from "@/app/(pro)/clair-vision/pro/components/ui/Button";

// ── Notification interfaces ────────────────────────────────────────────────
interface AppNotification {
  id: string;
  message: string;
  dotColor: string;
  href: string;
  updatedAt: Date;
}

interface RdvNotifLS { id: string; date: string; statut?: string; }
interface DossierNotifLS { id: string; status: string; }
interface DevisNotifLS { id: string; status: string; }
interface StockAlertLS { id: string; quantite: number; quantiteMin: number; }

// ── Minimal localStorage interfaces ──────────────────────────────────────────
interface PatientLS {
  id: string;
  nom: string;
  prenom: string;
  telephone?: string;
  email?: string;
}
interface DossierLS {
  id: string;
  numero: string;
  patientNom: string;
  patientPrenom: string;
  status: string;
  montantTotal?: number;
}
interface DevisLS {
  id: string;
  numero: string;
  patientNom: string;
  patientPrenom: string;
  status: string;
  totalTTC?: number;
}
interface RdvLS {
  id: string;
  date: string;
  heure: string;
  patientNom: string;
  patientPrenom: string;
  type: string;
}

// ── Calendar types ────────────────────────────────────────────────────────────
interface RdvCalLS extends RdvLS {
  duree?: number;
  telephone?: string;
  statut?: string;
}

// ── Typed result union ────────────────────────────────────────────────────────
type SearchResult =
  | { kind: "patient"; data: PatientLS }
  | { kind: "dossier"; data: DossierLS }
  | { kind: "devis"; data: DevisLS }
  | { kind: "rdv"; data: RdvLS };

// ── Glass dropdown style ──────────────────────────────────────────────────────
const dropdownStyle: CSSProperties = {
  background: "var(--glass-card-bg)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid var(--glass-strong-border)",
  boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
};

const notifPanelStyle: CSSProperties = {
  background: "rgba(255,255,255,0.96)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid var(--glass-strong-border)",
  boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
};

// ── Nav config ────────────────────────────────────────────────────────────────
const nav = [
  { label: "Tableau de bord", href: "/clair-vision/pro/optique" },
  { label: "Dossiers", href: "/clair-vision/pro/optique/dossiers" },
  { label: "Catalogue", href: "/clair-vision/pro/optique/catalogue" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function readJSON<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function match(q: string, ...fields: (string | undefined)[]): boolean {
  const lower = q.toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(lower));
}

function formatRdvDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
  } catch {
    return dateStr;
  }
}

function minutesAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diff < 1) return "À l'instant";
  if (diff === 1) return "Mis à jour il y a 1 min";
  return `Mis à jour il y a ${diff} min`;
}

// ── Notification computation ──────────────────────────────────────────────────
function computeNotifications(): AppNotification[] {
  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);
  const notifs: AppNotification[] = [];

  // RDV aujourd'hui
  const rdvs = readJSON<RdvNotifLS>("thor_pro_rdv");
  const rdvToday = rdvs.filter((r) => r.date === todayISO && r.statut !== "annule");
  if (rdvToday.length > 0) {
    notifs.push({
      id: "rdv",
      message: `${rdvToday.length} RDV aujourd'hui`,
      dotColor: "#6366f1",
      href: "/clair-vision/pro/agenda",
      updatedAt: now,
    });
  }

  // Dossiers prêts
  const dossiers = readJSON<DossierNotifLS>("thor_pro_dossiers");
  const dossiersRdy = dossiers.filter((d) => d.status === "Prêt");
  if (dossiersRdy.length > 0) {
    notifs.push({
      id: "dossiers",
      message: `${dossiersRdy.length} dossier${dossiersRdy.length > 1 ? "s" : ""} prêt${dossiersRdy.length > 1 ? "s" : ""} à retirer`,
      dotColor: "#10b981",
      href: "/clair-vision/pro/optique",
      updatedAt: now,
    });
  }

  // Devis signés
  const devisList = readJSON<DevisNotifLS>("thor_pro_devis");
  const devisSigned = devisList.filter((d) => d.status === "Signé");
  if (devisSigned.length > 0) {
    notifs.push({
      id: "devis",
      message: `${devisSigned.length} devis en attente de commande`,
      dotColor: "#f59e0b",
      href: "/clair-vision/pro/devis",
      updatedAt: now,
    });
  }

  // Stock bas
  const stockAlerts = readJSON<StockAlertLS>("thor_pro_stock_alerts");
  let stockCount = stockAlerts.filter((s) => s.quantite <= s.quantiteMin).length;
  if (stockCount === 0) {
    // Fallback: hardcoded 2 alerts from static mock (BBGR / Silhouette)
    stockCount = 2;
  }
  notifs.push({
    id: "stock",
    message: `${stockCount} article${stockCount > 1 ? "s" : ""} en stock bas`,
    dotColor: "#ef4444",
    href: "/clair-vision/pro/gerant/stock",
    updatedAt: now,
  });

  return notifs;
}

// ── Search function ───────────────────────────────────────────────────────────
function runSearch(q: string): SearchResult[] {
  const results: SearchResult[] = [];

  const patients = readJSON<PatientLS>("thor_pro_patients");
  for (const p of patients) {
    if (match(q, p.nom, p.prenom, p.telephone, p.email)) {
      results.push({ kind: "patient", data: p });
    }
  }

  const dossiers = readJSON<DossierLS>("thor_pro_dossiers");
  for (const d of dossiers) {
    if (match(q, d.numero, d.patientNom, d.patientPrenom)) {
      results.push({ kind: "dossier", data: d });
    }
  }

  const devis = readJSON<DevisLS>("thor_pro_devis");
  for (const d of devis) {
    if (match(q, d.numero, d.patientNom, d.patientPrenom)) {
      results.push({ kind: "devis", data: d });
    }
  }

  const rdvs = readJSON<RdvLS>("thor_pro_rdv");
  for (const r of rdvs) {
    if (match(q, r.patientNom, r.patientPrenom, r.date)) {
      results.push({ kind: "rdv", data: r });
    }
  }

  // Max 8 total
  return results.slice(0, 8);
}

// ── Result href ───────────────────────────────────────────────────────────────
function hrefOf(r: SearchResult): string {
  if (r.kind === "patient") return `/clair-vision/pro/patients/${r.data.id}`;
  if (r.kind === "dossier") return `/clair-vision/pro/optique/dossiers/${r.data.id}`;
  if (r.kind === "devis") return `/clair-vision/pro/devis`;
  return `/clair-vision/pro/agenda`;
}

// ── Calendar helpers ──────────────────────────────────────────────────────────
function rdvEndHHMM(rdv: RdvCalLS): string {
  const duree = rdv.duree ?? 30;
  const h = parseInt(rdv.heure.split(":")[0] ?? "9", 10);
  const m = parseInt(rdv.heure.split(":")[1] ?? "0", 10);
  const end = h * 60 + m + duree;
  return `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
}

function getUpcomingRdvs(): RdvCalLS[] {
  const today = new Date().toISOString().slice(0, 10);
  return readJSON<RdvCalLS>("thor_pro_rdv")
    .filter((r) => r.date >= today && r.statut !== "annule")
    .sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure));
}

function downloadICS(rdvs: RdvCalLS[]): void {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//THOR//Clair Vision//FR",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:THOR \u2014 Agenda",
    "METHOD:PUBLISH",
  ];
  for (const r of rdvs) {
    const dp = r.date.replace(/-/g, "");
    const [sh, sm] = r.heure.split(":");
    const [eh, em] = rdvEndHHMM(r).split(":");
    lines.push(
      "BEGIN:VEVENT",
      `UID:thor-${r.id}@clairvision`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${dp}T${sh ?? "09"}${sm ?? "00"}00`,
      `DTEND:${dp}T${eh ?? "09"}${em ?? "30"}00`,
      `SUMMARY:RDV ${r.patientPrenom} ${r.patientNom}`,
      `DESCRIPTION:${r.type || "RDV"}${r.telephone ? " \u2014 " + r.telephone : ""}`,
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `thor-agenda-${new Date().toISOString().slice(0, 10)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function googleCalLink(rdv: RdvCalLS): string {
  const dp = rdv.date.replace(/-/g, "");
  const [sh, sm] = rdv.heure.split(":");
  const [eh, em] = rdvEndHHMM(rdv).split(":");
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: `RDV ${rdv.patientPrenom} ${rdv.patientNom}`,
    dates: `${dp}T${sh ?? "09"}${sm ?? "00"}00/${dp}T${eh ?? "09"}${em ?? "30"}00`,
    details: rdv.type || "Rendez-vous optique",
    location: "Clair Vision Optique",
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

function outlookCalLink(rdv: RdvCalLS): string {
  const end = rdvEndHHMM(rdv);
  const p = new URLSearchParams({
    subject: `RDV ${rdv.patientPrenom} ${rdv.patientNom}`,
    startdt: `${rdv.date}T${rdv.heure}:00`,
    enddt: `${rdv.date}T${end}:00`,
    body: rdv.type || "Rendez-vous optique",
    location: "Clair Vision Optique",
  });
  return `https://outlook.live.com/calendar/deeplink/compose?${p.toString()}`;
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
      {label} ({count})
    </div>
  );
}

// ── Result row ────────────────────────────────────────────────────────────────
function ResultRow({
  result,
  active,
  onSelect,
}: {
  result: SearchResult;
  active: boolean;
  onSelect: () => void;
}) {
  const base =
    "flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition";
  const activeClass = "bg-sky-50 text-sky-800";
  const idleClass = "text-slate-700 hover:bg-slate-100";

  if (result.kind === "patient") {
    const p = result.data;
    return (
      <button
        className={cn(base, active ? activeClass : idleClass)}
        onMouseDown={onSelect}
      >
        <span></span>
        <span className="flex-1 font-semibold">
          {p.prenom} {p.nom}
        </span>
        <span className="text-xs text-slate-500">{p.telephone ?? p.email ?? ""}</span>
      </button>
    );
  }

  if (result.kind === "dossier") {
    const d = result.data;
    return (
      <button
        className={cn(base, active ? activeClass : idleClass)}
        onMouseDown={onSelect}
      >
        <span></span>
        <span className="font-mono text-xs font-semibold">{d.numero}</span>
        <span className="flex-1">
          {d.patientPrenom} {d.patientNom}
        </span>
        <span className="text-xs text-slate-500">{d.status}</span>
      </button>
    );
  }

  if (result.kind === "devis") {
    const d = result.data;
    return (
      <button
        className={cn(base, active ? activeClass : idleClass)}
        onMouseDown={onSelect}
      >
        <span></span>
        <span className="font-mono text-xs font-semibold">{d.numero}</span>
        <span className="flex-1">
          {d.patientPrenom} {d.patientNom}
        </span>
        <span className="text-xs text-slate-500">{d.status}</span>
        {d.totalTTC != null && (
          <span className="text-xs font-semibold text-slate-600">{d.totalTTC}€</span>
        )}
      </button>
    );
  }

  // rdv
  const r = result.data;
  return (
    <button
      className={cn(base, active ? activeClass : idleClass)}
      onMouseDown={onSelect}
    >
      <span></span>
      <span className="text-xs font-semibold text-slate-500">{formatRdvDate(r.date)}</span>
      <span className="text-xs text-slate-500">{r.heure}</span>
      <span className="flex-1">
        {r.patientPrenom} {r.patientNom}
      </span>
      <span className="text-xs text-slate-500">{r.type}</span>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProHeader() {
  const pathname = usePathname();
  const router = useRouter();

  // Profile menu
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Search
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [readCount, setReadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calendar sync
  const [calOpen, setCalOpen] = useState(false);
  const calRef = useRef<HTMLDivElement | null>(null);

  // ── Load notifications on mount + every 60s ───────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    setNotifications(computeNotifications());
    intervalRef.current = setInterval(() => {
      setNotifications(computeNotifications());
      setReadCount(0); // reset read state on refresh
    }, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const badgeCount = Math.max(0, notifications.length - readCount);

  // ── Notification outside-click ────────────────────────────────────────────
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!notifRef.current) return;
      if (!notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // ── Profile menu outside-click ────────────────────────────────────────────
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // ── Calendar outside-click ────────────────────────────────────────────────
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!calRef.current?.contains(e.target as Node)) setCalOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // ── Search outside-click ──────────────────────────────────────────────────
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!searchRef.current) return;
      if (!searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // ── Debounced search ──────────────────────────────────────────────────────
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      setResults(runSearch(value.trim()));
    }, 200);
  }, []);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!searchOpen) return;

    if (e.key === "Escape") {
      setSearchOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
      return;
    }

    if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const selected = results[activeIndex];
      if (selected) {
        setSearchOpen(false);
        router.push(hrefOf(selected));
      }
    }
  }

  // ── Navigate on row click ─────────────────────────────────────────────────
  function handleSelect(r: SearchResult) {
    setSearchOpen(false);
    setQuery("");
    setResults([]);
    router.push(hrefOf(r));
  }

  // ── Group results for rendering ───────────────────────────────────────────
  const patients = results.filter((r): r is Extract<SearchResult, { kind: "patient" }> => r.kind === "patient");
  const dossiers = results.filter((r): r is Extract<SearchResult, { kind: "dossier" }> => r.kind === "dossier");
  const devisItems = results.filter((r): r is Extract<SearchResult, { kind: "devis" }> => r.kind === "devis");
  const rdvItems = results.filter((r): r is Extract<SearchResult, { kind: "rdv" }> => r.kind === "rdv");

  function logout() {
    document.cookie = "thor_role=; path=/; max-age=0";
    document.cookie = "thor_module=; path=/; max-age=0";
    document.cookie = "thor_center=; path=/; max-age=0";
    router.push("/connexion/praticien");
  }

  // Build a flat ordered list to map activeIndex → result
  const ordered: SearchResult[] = [
    ...patients,
    ...dossiers,
    ...devisItems,
    ...rdvItems,
  ];

  const showDropdown = searchOpen && query.trim().length >= 2;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        {/* Left brand */}
        <Link href="/clair-vision/pro/optique" className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-sky-600 text-white shadow-sm shadow-sky-600/15">
            <span className="text-sm font-black">T</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-extrabold tracking-tight text-slate-900">THOR</div>
            <div className="text-[11px] font-semibold text-slate-500">CLAIR VISION</div>
          </div>
        </Link>

        {/* Center nav */}
        <nav className="hidden items-center gap-2 md:flex">
          {nav.map((i) => {
            const active = pathname === i.href || pathname.startsWith(i.href + "/");
            return (
              <Link
                key={i.href}
                href={i.href}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-semibold transition",
                  active ? "bg-sky-50 text-sky-800" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {i.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative hidden w-[280px] md:block" ref={searchRef}>
            <div
              className={cn(
                "flex items-center gap-2 rounded-2xl border bg-white px-3 py-2 text-sm text-slate-600 transition",
                searchOpen
                  ? "border-sky-400 ring-2 ring-sky-100"
                  : "border-slate-200"
              )}
            >
              <span className="text-slate-500">⌕</span>
              <input
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder="Rechercher un patient…"
                className="w-full bg-transparent outline-none placeholder:text-slate-500"
                autoComplete="off"
              />
              {query.length > 0 && (
                <button
                  onMouseDown={() => {
                    setQuery("");
                    setResults([]);
                    setActiveIndex(-1);
                  }}
                  className="text-slate-500 hover:text-slate-700"
                  tabIndex={-1}
                  aria-label="Effacer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dropdown */}
            {showDropdown && (
              <div
                style={dropdownStyle}
                className="absolute left-0 top-[calc(100%+8px)] w-full overflow-hidden rounded-2xl py-1"
              >
                {ordered.length === 0 ? (
                  <div className="px-4 py-4 text-center text-sm text-slate-500">
                    Aucun résultat pour «&nbsp;{query.trim()}&nbsp;»
                  </div>
                ) : (
                  <>
                    {patients.length > 0 && (
                      <>
                        <SectionHeader label="Patients" count={patients.length} />
                        {patients.map((r) => {
                          const idx = ordered.indexOf(r);
                          return (
                            <ResultRow
                              key={r.data.id}
                              result={r}
                              active={idx === activeIndex}
                              onSelect={() => handleSelect(r)}
                            />
                          );
                        })}
                      </>
                    )}
                    {dossiers.length > 0 && (
                      <>
                        <SectionHeader label="Dossiers" count={dossiers.length} />
                        {dossiers.map((r) => {
                          const idx = ordered.indexOf(r);
                          return (
                            <ResultRow
                              key={r.data.id}
                              result={r}
                              active={idx === activeIndex}
                              onSelect={() => handleSelect(r)}
                            />
                          );
                        })}
                      </>
                    )}
                    {devisItems.length > 0 && (
                      <>
                        <SectionHeader label="Devis" count={devisItems.length} />
                        {devisItems.map((r) => {
                          const idx = ordered.indexOf(r);
                          return (
                            <ResultRow
                              key={r.data.id}
                              result={r}
                              active={idx === activeIndex}
                              onSelect={() => handleSelect(r)}
                            />
                          );
                        })}
                      </>
                    )}
                    {rdvItems.length > 0 && (
                      <>
                        <SectionHeader label="RDV" count={rdvItems.length} />
                        {rdvItems.map((r) => {
                          const idx = ordered.indexOf(r);
                          return (
                            <ResultRow
                              key={r.data.id}
                              result={r}
                              active={idx === activeIndex}
                              onSelect={() => handleSelect(r)}
                            />
                          );
                        })}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Notifications ────────────────────────────────────────────── */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Notifications"
              title="Notifications"
            >
              {/* Bell icon */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {/* Red badge */}
              {badgeCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: "#ef4444" }}
                >
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              )}
            </button>

            {/* Notification panel */}
            {notifOpen && (
              <div
                style={notifPanelStyle}
                className="absolute right-0 top-[calc(100%+8px)] w-[360px] overflow-hidden rounded-2xl"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-600">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <span className="text-sm font-semibold text-slate-800">Notifications</span>
                    {badgeCount > 0 && (
                      <span
                        className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                        style={{ background: "#ef4444" }}
                      >
                        {badgeCount}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setReadCount(notifications.length)}
                    className="text-xs font-medium text-slate-500 transition hover:text-slate-700"
                  >
                    Tout marquer lu
                  </button>
                </div>

                {/* Notification rows */}
                <div className="divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-500">
                      Aucune notification
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50/80 transition">
                        {/* Colored dot */}
                        <span
                          className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                          style={{ background: n.dotColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">{n.message}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">{minutesAgo(n.updatedAt)}</p>
                        </div>
                        <Link
                          href={n.href}
                          onClick={() => setNotifOpen(false)}
                          className="flex-shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                        >
                          Voir →
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Sync Agenda ──────────────────────────────────────────── */}
          <div className="relative" ref={calRef}>
            <button
              onClick={() => {
                setCalOpen((v) => {
                  if (!v) setNotifOpen(false);
                  return !v;
                });
              }}
              className={`relative grid h-10 w-10 place-items-center rounded-2xl border transition ${calOpen ? "border-sky-400 bg-sky-50 text-sky-600" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
              title="Synchroniser l'agenda"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </button>

            {calOpen && (() => {
              const upcoming = getUpcomingRdvs();
              const next = upcoming[0] ?? null;
              const fmtDate = (iso: string) =>
                new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
              return (
                <div
                  style={notifPanelStyle}
                  className="absolute right-0 top-[calc(100%+8px)] w-[360px] overflow-hidden rounded-2xl z-50"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-sky-600">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span className="text-sm font-semibold text-slate-800">Synchronisation agenda</span>
                    </div>
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                      {upcoming.length} RDV à venir
                    </span>
                  </div>

                  {/* Export ICS — fonctionne avec TOUS les agendas */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Exporter</p>
                    <button
                      onClick={() => downloadICS(upcoming)}
                      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:bg-slate-100"
                    >
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-600">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7,10 12,15 17,10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-800">Télécharger tous les RDV (.ics)</div>
                        <div className="text-xs text-slate-500">Google, Apple, Outlook, Thunderbird…</div>
                      </div>
                      <span className="flex-shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        {upcoming.length}
                      </span>
                    </button>
                  </div>

                  {/* Deep links — prochain RDV */}
                  {next ? (
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Ajouter le prochain RDV
                      </p>
                      <div className="text-[12px] font-semibold text-slate-700 mb-2 px-1">
                        {next.patientPrenom} {next.patientNom} · {fmtDate(next.date)} à {next.heure}
                      </div>
                      <div className="flex flex-col gap-2">
                        <a
                          href={googleCalLink(next)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition hover:bg-slate-100"
                        >
                          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-black" style={{ color: "#4285F4" }}>G</span>
                          <span className="flex-1 text-sm font-semibold text-slate-800">Google Calendar</span>
                          <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 text-slate-500 flex-shrink-0"><path d="M7 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 2h4v4M14 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </a>
                        <a
                          href={outlookCalLink(next)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition hover:bg-slate-100"
                        >
                          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-black" style={{ color: "#0078D4" }}>O</span>
                          <span className="flex-1 text-sm font-semibold text-slate-800">Outlook / Microsoft 365</span>
                          <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 text-slate-500 flex-shrink-0"><path d="M7 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 2h4v4M14 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-4 text-center text-sm text-slate-500">
                      Aucun RDV à venir
                    </div>
                  )}

                  <div className="px-4 py-2.5 text-[11px] text-slate-500">
                    Le fichier .ics s&apos;importe dans n&apos;importe quel agenda en un clic
                  </div>
                </div>
              );
            })()}
          </div>

          <Button href="/clair-vision/pro/optique/dossiers" variant="primary">
            + Créer dossier
          </Button>

          {/* Profile menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-50 text-sky-800 hover:bg-sky-100"
              aria-label="Profil"
              title="Profil"
            >

            </button>

            {open ? (
              <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                <div className="px-4 py-3">
                  <div className="text-sm font-semibold text-slate-900">Compte praticien</div>
                  <div className="text-xs text-slate-500">THOR • Clair Vision</div>
                </div>

                <div className="border-t border-slate-100" />

                <button
                  onClick={() => {
                    setOpen(false);
                    router.push("/clair-vision/pro/optique");
                  }}
                  className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Tableau de bord
                </button>

                <button
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="w-full px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Déconnexion
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
