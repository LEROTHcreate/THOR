"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import UserSwitcher from "@/app/(pro)/clair-vision/pro/components/UserSwitcher";
import {
  type ProUser,
  DEFAULT_USERS,
  loadUsers, loadCurrentUserId, saveUsers, saveCurrentUserId,
} from "@/lib/users";
import {
  type StoreConfig,
  saveStoreConfig,
  loadAuditionStoreConfig,
  saveAuditionStoreConfig,
} from "@/lib/storeConfig";
import ChatWidget from "@/components/ui/ChatWidget";
import OnboardingWizard, { LS_FLAG, LS_SKIP_FLAG } from "@/components/ui/OnboardingWizard";
import NotificationBell from "@/components/ui/NotificationBell";
import DarkModeToggle from "@/components/ui/DarkModeToggle";
import { logProActivity } from "@/lib/centresRegistry";

/* ── Cookie helpers ─────────────────────────────────────────────────────── */
function getCookie(n: string) {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(^| )" + n + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : "";
}
function clearCookie(n: string) {
  document.cookie = `${n}=; path=/; max-age=0; samesite=lax`;
}

/* ── SVG Icons ─────────────────────────────────────────────────────────── */
function IconEar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7-3 8-3 8H9a3 3 0 0 1-3-3" />
      <path d="M10 13c0-1.5 1-2 1-3a2 2 0 0 0-4 0" />
      <circle cx="12" cy="20" r="1" />
    </svg>
  );
}
function IconDashboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  );
}
function IconFolder({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  );
}
function IconHeadphones({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z" />
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z" />
    </svg>
  );
}
function IconDevis({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M9 13h6M9 17h4" />
    </svg>
  );
}
function IconGerant({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconBarChart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
    </svg>
  );
}
function IconStock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  );
}
function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}
function IconChat({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
function IconClose({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
function IconWrench({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
function IconCalculator({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 6h8M8 10h2M12 10h2M16 10h.01M8 14h2M12 14h2M16 14h.01M8 18h2M12 18h2M16 18h.01" />
    </svg>
  );
}
function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function IconBox({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}

/* ── Extra icons ──────────────────────────────────────────────────────── */
function IconOrdonnance({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/>
      <path d="M14 2v6h6M9 13h6M9 17h4"/>
      <circle cx="17" cy="17" r="3" fill="none"/>
      <path d="M17 15.5v1.5l1 1" strokeWidth="1.5"/>
    </svg>
  );
}
function IconFacture({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M9 21V9"/>
      <path d="M13 13h4M13 17h4"/>
    </svg>
  );
}
function IconTP({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12a7 7 0 1 1-2.05-4.95L19 9"/>
      <path d="M19 3v6h-6"/>
      <path d="M9 12h6M12 9.5v5"/>
    </svg>
  );
}
function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
      <path d="M16 16h5v5"/>
    </svg>
  );
}

function IconNewspaper({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a4 4 0 0 1-4 4Z"/>
      <path d="M10 7h8M10 11h8M10 15h5"/>
    </svg>
  );
}
function IconClipboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2h6a1 1 0 0 1 1 1v1H8V3a1 1 0 0 1 1-1Z"/>
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M9 12h6M9 16h4"/>
    </svg>
  );
}

/* ── Nav definitions ──────────────────────────────────────────────────── */
const NAV_QUOTIDIEN = [
  { href: "/clair-audition/pro",            label: "Tableau de bord", Icon: IconDashboard, exact: true  },
  { href: "/clair-audition/pro/agenda",     label: "Agenda",          Icon: IconCalendar,  exact: false },
  { href: "/clair-audition/pro/patients",   label: "Patients",        Icon: IconUsers,     exact: false },
  { href: "/clair-audition/pro/messagerie", label: "Messagerie",      Icon: IconChat,      exact: false },
];

const NAV_DOSSIERS = [
  { href: "/clair-audition/pro/consultation", label: "Consultation",  Icon: IconClipboard,  exact: false },
  { href: "/clair-audition/pro/dossiers",     label: "Dossiers",      Icon: IconBox,        exact: false },
  { href: "/clair-audition/pro/bilans",       label: "Bilans auditifs", Icon: IconHeadphones, exact: false },
  { href: "/clair-audition/pro/ordonnances",  label: "Ordonnances",   Icon: IconClipboard,  exact: false },
];

const NAV_VENTE = [
  { href: "/clair-audition/pro/appareillage", label: "Appareillage",    Icon: IconHeadphones, exact: false },
  { href: "/clair-audition/pro/essais",       label: "Périodes d'essai", Icon: IconClock,     exact: false },
  { href: "/clair-audition/pro/prets",        label: "Prêts d'appareils", Icon: IconBox,      exact: false },
  { href: "/clair-audition/pro/devis",        label: "Devis & commandes", Icon: IconFacture,  exact: false },
  { href: "/clair-audition/pro/facturation",  label: "Facturation",     Icon: IconFacture,    exact: false },
  { href: "/clair-audition/pro/tiers-payant", label: "Tiers payant",    Icon: IconTP,         exact: false },
];

const NAV_SUIVI = [
  { href: "/clair-audition/pro/rappels",         label: "Rappels",         Icon: IconBell,     exact: false },
  { href: "/clair-audition/pro/renouvellements", label: "Renouvellements", Icon: IconCalendar, exact: false },
  { href: "/clair-audition/pro/sav",             label: "SAV",             Icon: IconWrench,   exact: false },
  { href: "/clair-audition/pro/statistiques",    label: "Statistiques",    Icon: IconBarChart, exact: false },
];

const NAV_OUTILS = [
  { href: "/clair-audition/pro/calculateur", label: "Calculateur",   Icon: IconCalculator, exact: false },
  { href: "/clair-audition/pro/actus",       label: "Actus secteur", Icon: IconNewspaper,  exact: false },
];

const NAV_GERANT = [
  { href: "/clair-audition/pro/gerant",       label: "Espace gérant", Icon: IconGerant, exact: true  },
  { href: "/clair-audition/pro/gerant/stock", label: "Stock",         Icon: IconStock,  exact: false },
];

const NAV_BOTTOM = [
  { href: "/clair-audition/pro/parametres", label: "Paramètres", Icon: IconSettings, exact: false },
];

/* ── Styles ─────────────────────────────────────────────────────────────── */
const sidebarStyle: React.CSSProperties = {
  background: "var(--glass-nav-bg)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  borderRight: "1px solid var(--glass-nav-border)",
};

const wrapperStyle: React.CSSProperties = {
  background: "var(--thor-bg)",
};

/* ── NavLink ─────────────────────────────────────────────────────────────── */
function NavLink({
  href, label, Icon, active, onClick, badge,
}: {
  href: string;
  label: string;
  Icon: React.FC<{ className?: string }>;
  active: boolean;
  onClick?: () => void;
  badge?: number;
}) {
  const ACCENT = "#00C98A";
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors dark-nav-hover"
      style={active
        ? { background: `${ACCENT}14`, color: ACCENT }
        : { color: "var(--muted)" }
      }
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "" : "opacity-80"}`} />
      <span className="flex-1 truncate">{label}</span>
      {badge != null && badge > 0 && (
        <span
          className="text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none tabular-nums"
          style={active
            ? { background: ACCENT, color: "#fff" }
            : { background: `${ACCENT}1A`, color: ACCENT }
          }
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-[0.10em] text-slate-400 dark:text-slate-500 select-none">
      {children}
    </div>
  );
}

/* ── Unread messages helper ─────────────────────────────────────────────── */
function getUnreadCount(currentUserId: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem("thor_pro_messages");
    if (!raw) return 0;
    const msgs = JSON.parse(raw) as Array<{
      from: string; to: string; read: boolean;
    }>;
    return msgs.filter(
      m => !m.read && m.from !== currentUserId && (m.to === currentUserId || m.to === "all")
    ).length;
  } catch {
    return 0;
  }
}

/* ── Sidebar content ─────────────────────────────────────────────────── */
function SidebarContent({
  pathname,
  onNavClick,
  onLogout,
  currentUser,
  users,
  onSwitch,
  onUsersChange,
  storeConfig,
  onStoreConfigChange,
  showSetupBubble,
  onSetupBubbleClick,
}: {
  pathname: string;
  onNavClick?: () => void;
  onLogout: () => void;
  currentUser: ProUser;
  users: ProUser[];
  onSwitch: (u: ProUser) => void;
  onUsersChange: (u: ProUser[]) => void;
  storeConfig: StoreConfig;
  onStoreConfigChange: (c: StoreConfig) => void;
  showSetupBubble?: boolean;
  onSetupBubbleClick?: () => void;
}) {
  const [msgUnread, setMsgUnread] = useState(0);
  const [essaisUrgents, setEssaisUrgents] = useState(0);
  const [renouvellementsProches, setRenouvellementsProches] = useState(0);
  const [savOuverts, setSavOuverts] = useState(0);
  const [pretsEnRetard, setPretsEnRetard] = useState(0);

  useEffect(() => {
    setMsgUnread(getUnreadCount(currentUser.id));
    const handler = () => setMsgUnread(getUnreadCount(currentUser.id));
    window.addEventListener("focus", handler);

    // Badges essais : en cours avec ≤ 3 jours restants
    try {
      const raw = localStorage.getItem("thor_pro_audition_essais");
      if (raw) {
        const essais: { statut: string; dateDebut: string; dureeJours: number }[] = JSON.parse(raw);
        const now = Date.now();
        const urgent = essais.filter(e => {
          if (e.statut !== "en_cours") return false;
          const fin = new Date(e.dateDebut).getTime() + e.dureeJours * 86400000;
          const daysLeft = Math.ceil((fin - now) / 86400000);
          return daysLeft >= 0 && daysLeft <= 3;
        }).length;
        setEssaisUrgents(urgent);
      }
    } catch {}

    // Badges renouvellements : échéances dans les 30 prochains jours
    try {
      const raw = localStorage.getItem("thor_pro_audition_renouvellements");
      if (raw) {
        const items: { statut: string; dateEcheance: string }[] = JSON.parse(raw);
        const now = Date.now();
        const proche = items.filter(r => {
          if (r.statut === "effectue" || r.statut === "ignore") return false;
          const d = new Date(r.dateEcheance).getTime();
          const days = Math.ceil((d - now) / 86400000);
          return days >= 0 && days <= 30;
        }).length;
        setRenouvellementsProches(proche);
      }
    } catch {}

    // Badge SAV : tickets ouverts ou urgents
    try {
      const raw = localStorage.getItem("thor_pro_audition_sav");
      if (raw) {
        const tickets: { status: string; priorite: string }[] = JSON.parse(raw);
        setSavOuverts(tickets.filter(t =>
          t.status === "Ouvert" || t.status === "En cours" || t.priorite === "Urgente"
        ).length);
      }
    } catch {}

    // Badge prêts : appareils en retard
    try {
      const raw = localStorage.getItem("thor_pro_audition_prets_actifs");
      if (raw) {
        const prets: { statut: string; dateRetourPrevue: string }[] = JSON.parse(raw);
        const now = Date.now();
        setPretsEnRetard(prets.filter(p =>
          p.statut === "en_cours" && new Date(p.dateRetourPrevue).getTime() < now
        ).length);
      }
    } catch {}

    return () => window.removeEventListener("focus", handler);
  }, [currentUser.id]);

  function isActive(href: string, exact = false) {
    return exact
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      <div className="px-5 py-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            className="grid h-10 w-10 place-items-center rounded-[var(--radius-soft)] flex-shrink-0 overflow-hidden"
            style={
              storeConfig.logo
                ? { boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }
                : {
                    background: "#10b981",
                    boxShadow: "0 2px 8px rgba(16,185,129,0.30)",
                  }
            }
          >
            {storeConfig.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={storeConfig.logo} alt={storeConfig.nom} className="w-full h-full object-cover" />
            ) : (
              <IconEar className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="leading-tight min-w-0">
            <div className="text-sm font-semibold text-slate-800 truncate">{storeConfig.nom}</div>
            <div className="text-xs text-slate-500">Espace praticien</div>
          </div>
        </div>

        <UserSwitcher
          currentUser={currentUser}
          users={users}
          onSwitch={onSwitch}
          onUsersChange={onUsersChange}
          storeConfig={storeConfig}
          onStoreConfigChange={onStoreConfigChange}
        />
        <NotificationBell
          lsRdv="thor_pro_audition_rdv"
          lsPatients="thor_pro_audition_patients"
          lsStock="thor_pro_audition_stock"
          lsPreConsult="thor_pro_pre_consult_notifications"
          accent="#00C98A"
        />
        <DarkModeToggle accent="#00C98A" />
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-3 px-3 overflow-y-auto pb-2">
        <div className="flex flex-col gap-0.5">
          <SectionLabel>Quotidien</SectionLabel>
          {NAV_QUOTIDIEN.map(item => (
            <NavLink
              key={item.href} href={item.href} label={item.label} Icon={item.Icon}
              active={isActive(item.href, item.exact)} onClick={onNavClick}
              badge={item.href === "/clair-audition/pro/messagerie" ? msgUnread : undefined}
            />
          ))}
        </div>

        <div className="flex flex-col gap-0.5">
          <SectionLabel>Dossiers</SectionLabel>
          {NAV_DOSSIERS.map(item => (
            <NavLink
              key={item.href} href={item.href} label={item.label} Icon={item.Icon}
              active={isActive(item.href, item.exact)} onClick={onNavClick}
            />
          ))}
        </div>

        <div className="flex flex-col gap-0.5">
          <SectionLabel>Vente</SectionLabel>
          {NAV_VENTE.map(item => (
            <NavLink
              key={item.href} href={item.href} label={item.label} Icon={item.Icon}
              active={isActive(item.href, item.exact)} onClick={onNavClick}
              badge={
                item.href === "/clair-audition/pro/essais" ? (essaisUrgents  || undefined) :
                item.href === "/clair-audition/pro/prets"  ? (pretsEnRetard  || undefined) :
                undefined
              }
            />
          ))}
        </div>

        <div className="flex flex-col gap-0.5">
          <SectionLabel>Suivi</SectionLabel>
          {NAV_SUIVI.map(item => (
            <NavLink
              key={item.href} href={item.href} label={item.label} Icon={item.Icon}
              active={isActive(item.href, item.exact)} onClick={onNavClick}
              badge={item.href === "/clair-audition/pro/sav" ? (savOuverts || undefined) : undefined}
            />
          ))}
        </div>

        <div className="flex flex-col gap-0.5">
          <SectionLabel>Outils</SectionLabel>
          {NAV_OUTILS.map(item => (
            <NavLink
              key={item.href} href={item.href} label={item.label} Icon={item.Icon}
              active={isActive(item.href, item.exact)} onClick={onNavClick}
            />
          ))}
        </div>

        {currentUser.role === "Gérant" && (
          <div className="flex flex-col gap-0.5">
            <SectionLabel>Gérant</SectionLabel>
            {NAV_GERANT.map(item => (
              <NavLink
                key={item.href} href={item.href} label={item.label} Icon={item.Icon}
                active={isActive(item.href, item.exact)} onClick={onNavClick}
              />
            ))}
          </div>
        )}
        <div className="mt-3 border-t border-slate-200/60 pt-3">
          {NAV_BOTTOM.map(item => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              Icon={item.Icon}
              active={isActive(item.href, item.exact)}
              onClick={onNavClick}
            />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 pb-5 flex-shrink-0">
        {showSetupBubble && (
          <button
            onClick={onSetupBubbleClick}
            className="w-full mb-3 text-left rounded-[var(--radius-soft)] px-3.5 py-3 transition-all hover:scale-[1.01]"
            style={{
              background: "linear-gradient(135deg,rgba(245,158,11,0.12),rgba(245,158,11,0.06))",
              border: "1px solid rgba(245,158,11,0.35)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <span className="relative flex-shrink-0">
                <span className="block w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-60" />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-amber-700 leading-tight">Configuration incomplète</div>
                <div className="text-[11px] text-amber-600/70 mt-0.5">Terminer la configuration →</div>
              </div>
            </div>
          </button>
        )}
        <div
          className="mt-4 rounded-[var(--radius-soft)] p-3 text-xs text-slate-500 flex items-center gap-2"
          style={{
            background: "var(--glass-subtle-bg)",
            border: "1px solid var(--glass-subtle-border)",
          }}
        >
          <svg className="w-3.5 h-3.5 text-[#10b981] flex-shrink-0" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Z" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Espace sécurisé THOR Pro
        </div>
        <button
          onClick={onLogout}
          className="mt-3 w-full rounded-[var(--radius-soft)] px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
          style={{
            background: "var(--glass-subtle-bg)",
            border: "1px solid var(--glass-border)",
          }}
        >
          Déconnexion
        </button>
      </div>
    </>
  );
}

/* ── Layout ──────────────────────────────────────────────────────────────── */
export default function ProAuditionLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSetupBubble, setShowSetupBubble] = useState(false);

  const [users, setUsers]             = useState<ProUser[]>(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState<ProUser>(DEFAULT_USERS[1]);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(loadAuditionStoreConfig());

  useEffect(() => {
    const loaded  = loadUsers();
    const curId   = loadCurrentUserId();
    const current = loaded.find(u => u.id === curId) ?? loaded[1] ?? loaded[0];
    setUsers(loaded);
    setCurrentUser(current ?? DEFAULT_USERS[1]);
    const cfg = loadAuditionStoreConfig();
    setStoreConfig(cfg);
    if (cfg.nom) logProActivity("audition", cfg.nom);
    if (!localStorage.getItem(LS_FLAG("audition"))) setShowOnboarding(true);
    else if (localStorage.getItem(LS_SKIP_FLAG("audition"))) setShowSetupBubble(true);
  }, []);

  const handleStoreConfigChange = (updated: StoreConfig) => {
    setStoreConfig(updated);
    saveAuditionStoreConfig(updated);
    // Mirror to shared key so UserSwitcher reads it correctly
    saveStoreConfig(updated);
  };

  const handleSwitch = (u: ProUser) => {
    setCurrentUser(u);
    saveCurrentUserId(u.id);
  };

  const handleUsersChange = (updated: ProUser[]) => {
    setUsers(updated);
    saveUsers(updated);
    if (!updated.find(u => u.id === currentUser.id)) {
      const fallback = updated[0];
      if (fallback) { setCurrentUser(fallback); saveCurrentUserId(fallback.id); }
    }
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    clearCookie("thor_pro");
    router.replace("/");
  };

  return (
    <div className="min-h-screen" style={wrapperStyle}>
      {/* Orbs */}
      <div
        className="pointer-events-none fixed -top-32 -left-32 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "rgba(0,201,138,0.06)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed top-1/3 -right-24 h-80 w-80 rounded-full blur-3xl"
        style={{ background: "rgba(6,182,212,0.05)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed bottom-0 left-1/3 h-64 w-64 rounded-full blur-3xl"
        style={{ background: "rgba(0,201,138,0.07)" }}
        aria-hidden
      />

      <div className="flex h-screen w-full overflow-hidden">
        {/* Desktop sidebar */}
        <aside
          className="hidden lg:flex w-[232px] flex-col flex-shrink-0 sticky top-0 h-screen z-20"
          style={sidebarStyle}
        >
          <SidebarContent
            pathname={pathname}
            onLogout={handleLogout}
            currentUser={currentUser}
            users={users}
            onSwitch={handleSwitch}
            onUsersChange={handleUsersChange}
            storeConfig={storeConfig}
            onStoreConfigChange={handleStoreConfigChange}
            showSetupBubble={showSetupBubble}
            onSetupBubbleClick={() => { setShowOnboarding(true); setShowSetupBubble(false); }}
          />
        </aside>

        {/* Mobile top bar */}
        <div
          className="lg:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between px-4 h-14"
          style={{
            background: "var(--glass-strong-bg)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid var(--glass-sep)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="grid h-8 w-8 place-items-center rounded-lg text-white flex-shrink-0"
              style={{ background: "#10b981" }}
            >
              <IconEar className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-slate-800">{storeConfig.nom}</span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-600 transition-colors hover:bg-white/60"
            aria-label="Ouvrir le menu"
          >
            <IconMenu className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
        )}

        {/* Mobile slide-in sidebar */}
        <aside
          className={`lg:hidden fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col transition-transform duration-300 ease-in-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={sidebarStyle}
        >
          <div className="flex items-center justify-end px-4 pt-4 pb-0">
            <button
              onClick={() => setMobileOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-white/60"
              aria-label="Fermer le menu"
            >
              <IconClose className="w-4 h-4" />
            </button>
          </div>
          <SidebarContent
            pathname={pathname}
            onNavClick={() => setMobileOpen(false)}
            onLogout={handleLogout}
            currentUser={currentUser}
            users={users}
            onSwitch={handleSwitch}
            onUsersChange={handleUsersChange}
            storeConfig={storeConfig}
            onStoreConfigChange={handleStoreConfigChange}
            showSetupBubble={showSetupBubble}
            onSetupBubbleClick={() => { setShowOnboarding(true); setShowSetupBubble(false); }}
          />
        </aside>

        {/* Main content */}
        <main className="relative flex-1 min-w-0 flex flex-col overflow-y-auto overflow-x-hidden pt-14 lg:pt-0">
          <div className="relative flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 max-w-full">{children}</div>
        </main>
      </div>

      {/* ── Assistant IA ── */}
      <ChatWidget context="pro-audition" />


      {showOnboarding && (
        <OnboardingWizard
          product="audition"
          onComplete={() => { setShowOnboarding(false); setShowSetupBubble(false); setStoreConfig(loadAuditionStoreConfig()); }}
          onSkip={() => { setShowOnboarding(false); setShowSetupBubble(true); }}
        />
      )}
    </div>
  );
}
