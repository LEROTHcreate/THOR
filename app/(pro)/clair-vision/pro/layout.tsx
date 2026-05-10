"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import UserSwitcher from "./components/UserSwitcher";
import SettingsPanel from "./components/SettingsPanel";
import {
  type ProUser,
  DEFAULT_USERS,
  loadUsers, loadCurrentUserId, saveUsers, saveCurrentUserId,
} from "@/lib/users";
import {
  type StoreConfig,
  DEFAULT_STORE_CONFIG,
  loadStoreConfig, saveStoreConfig,
} from "@/lib/storeConfig";
import ChatWidget from "@/components/ui/ChatWidget";
import OnboardingWizard, { LS_FLAG, LS_SKIP_FLAG } from "@/components/ui/OnboardingWizard";
import NotificationBell from "@/components/ui/NotificationBell";
import DarkModeToggle from "@/components/ui/DarkModeToggle";
import { logProActivity } from "@/lib/centresRegistry";

function clearCookie(n: string) {
  document.cookie = `${n}=; path=/; max-age=0; samesite=lax`;
}

/* ── Color helpers ────────────────────────────────────────────────────────── */
function darkenHex(hex: string, factor: number): string {
  const clean = hex.replace("#", "");
  const n = parseInt(
    clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean,
    16
  );
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - factor)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - factor)));
  const b = Math.max(0, Math.round((n & 255) * (1 - factor)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function mkAccentStyle(color: string): CSSProperties {
  return {
    background: `linear-gradient(135deg, ${color}, ${darkenHex(color, 0.15)})`,
    boxShadow: `0 2px 8px ${color}44`,
  };
}

/* ── SVG Icons ─────────────────────────────────────────────────────────────── */
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

function IconDevis({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M9 13h6M9 17h4" />
      <circle cx="17" cy="17" r="3" fill="none"/>
      <path d="M17 15.5v1.5l1 1" strokeWidth="1.5"/>
    </svg>
  );
}
function IconBarChart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 16v-4M11 16V9M15 16v-7M19 16v-2" />
    </svg>
  );
}
function IconLens({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3c0 2.5-1.5 4-1.5 4" />
    </svg>
  );
}
function IconGerant({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
function IconStock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
    </svg>
  );
}
function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}
function IconFacture({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
      <path d="M13 13h4M13 17h4" />
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
function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconAtelier({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  );
}
function IconWrench({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
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
function IconNewspaper({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a4 4 0 0 1-4 4Z"/>
      <path d="M10 7h8M10 11h8M10 15h5"/>
    </svg>
  );
}

const NAV_PRINCIPAL = [
  { href: "/clair-vision/pro/optique",        label: "Tableau de bord", Icon: IconDashboard, exact: true  },
  { href: "/clair-vision/pro/agenda",         label: "Agenda",          Icon: IconCalendar,  exact: false },
  { href: "/clair-vision/pro/patients",       label: "Patients",        Icon: IconUsers,     exact: false },
  { href: "/clair-vision/pro/consultation",   label: "Consultation",    Icon: IconClipboard, exact: false },
  { href: "/clair-vision/pro/messagerie",     label: "Messagerie",      Icon: IconChat,      exact: false },
  { href: "/clair-vision/pro/rappels",        label: "Rappels",         Icon: IconBell,      exact: false },
];

const NAV_GESTION = [
  { href: "/clair-vision/pro/devis",       label: "Devis & Commandes", Icon: IconDevis,     exact: false },
  { href: "/clair-vision/pro/atelier",     label: "Atelier & Labo",    Icon: IconAtelier,   exact: false },
  { href: "/clair-vision/pro/tiers-payant",  label: "Tiers payant",      Icon: IconTP,        exact: false },
  { href: "/clair-vision/pro/facturation",  label: "Facturation",       Icon: IconFacture,   exact: false },
  { href: "/clair-vision/pro/sav",          label: "SAV",               Icon: IconWrench,    exact: false },
  { href: "/clair-vision/pro/statistiques",label: "Statistiques",      Icon: IconBarChart,  exact: false },
];

const NAV_RESSOURCES = [
  { href: "/clair-vision/pro/calculateur-lentilles", label: "Calculateur lentilles", Icon: IconLens,        exact: false },
  { href: "/clair-vision/pro/actus",                 label: "Actus secteur",         Icon: IconNewspaper,   exact: false },
];

const NAV_GERANT = [
  { href: "/clair-vision/pro/gerant", label: "Espace Gérant", Icon: IconGerant, exact: true },
];

const NAV_STOCK = [
  { href: "/clair-vision/pro/gerant/stock", label: "Stock", Icon: IconStock, exact: false },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="px-3 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 select-none">
      {children}
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────────── */
const sidebarStyle: CSSProperties = {
  background: "var(--surface)",
  borderRight: "1px solid var(--border)",
};

const wrapperStyle: CSSProperties = {
  background: "var(--thor-bg)",
  zoom: 0.95,
};

/* ── NavLink ─────────────────────────────────────────────────────────────────── */
function NavLink({
  href, label, Icon, active, onClick, badge, accentColor,
}: {
  href: string;
  label: string;
  Icon: React.FC<{ className?: string }>;
  active: boolean;
  onClick?: () => void;
  badge?: number;
  accentColor: string;
}) {
  const activeStyle = mkAccentStyle(accentColor);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        active ? "text-white" : "text-slate-500 hover:bg-white/50 dark-nav-hover"
      }`}
      style={active ? activeStyle : undefined}
    >
      <span
        className={`grid h-8 w-8 place-items-center rounded-xl flex-shrink-0 ${active ? "" : "nav-icon-inactive"}`}
        style={active ? { background: "rgba(255,255,255,0.20)" } : undefined}
      >
        <Icon className="w-4 h-4" />
      </span>
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span
          className="text-[10px] font-bold text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none"
          style={{ background: active ? "rgba(255,255,255,0.30)" : accentColor }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

/* ── SettingsNavButton — button variant of NavLink ─────────────────────────── */
function SettingsNavButton({
  label, Icon, active, onClick, accentColor,
}: {
  label: string;
  Icon: React.FC<{ className?: string }>;
  active: boolean;
  onClick: () => void;
  accentColor: string;
}) {
  const activeStyle = mkAccentStyle(accentColor);

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        active ? "text-white" : "text-slate-500 hover:bg-white/50 dark-nav-hover"
      }`}
      style={active ? activeStyle : undefined}
    >
      <span
        className={`grid h-8 w-8 place-items-center rounded-xl flex-shrink-0 ${active ? "" : "nav-icon-inactive"}`}
        style={active ? { background: "rgba(255,255,255,0.20)" } : undefined}
      >
        <Icon className="w-4 h-4" />
      </span>
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}

/* ── Unread messages helper ─────────────────────────────────────────────────── */
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

/* ── Sidebar content (shared) ─────────────────────────────────────────────── */
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
  onOpenSettings,
  settingsOpen,
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
  onOpenSettings: () => void;
  settingsOpen: boolean;
  showSetupBubble?: boolean;
  onSetupBubbleClick?: () => void;
}) {
  const [msgUnread, setMsgUnread] = useState(0);
  const [savOuverts, setSavOuverts] = useState(0);
  const accentColor = storeConfig.accentColor ?? "#2D8CFF";

  useEffect(() => {
    setMsgUnread(getUnreadCount(currentUser.id));
    const handler = () => setMsgUnread(getUnreadCount(currentUser.id));
    window.addEventListener("focus", handler);


    // Badge SAV : tickets ouverts ou urgents
    try {
      const raw = localStorage.getItem("thor_pro_sav");
      if (raw) {
        const tickets: { status: string; priorite: string }[] = JSON.parse(raw);
        setSavOuverts(tickets.filter(t =>
          t.status === "Ouvert" || t.status === "En cours" || t.priorite === "Urgente"
        ).length);
      }
    } catch {}


    return () => window.removeEventListener("focus", handler);
  }, [currentUser.id]);

  const logoStyle: CSSProperties = storeConfig.logo
    ? { boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }
    : mkAccentStyle(accentColor);

  return (
    <>
      <div className="px-5 py-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            className="grid h-10 w-10 place-items-center rounded-[var(--radius-soft)] flex-shrink-0 overflow-hidden"
            style={logoStyle}
          >
            {storeConfig.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={storeConfig.logo} alt={storeConfig.nom} className="w-full h-full object-cover" />
            ) : (
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            )}
          </div>
          <div className="leading-tight min-w-0">
            <div className="text-sm font-semibold text-slate-800 truncate">{storeConfig.nom}</div>
            <div className="text-xs text-slate-500">Espace praticien</div>
          </div>
        </div>

        {/* User switcher */}
        <UserSwitcher
          currentUser={currentUser}
          users={users}
          onSwitch={onSwitch}
          onUsersChange={onUsersChange}
          storeConfig={storeConfig}
          onStoreConfigChange={onStoreConfigChange}
        />
        <NotificationBell
          lsRdv="thor_pro_rdv"
          lsPatients="thor_pro_lentilles_patients"
          lsPreConsult="thor_pro_pre_consult_notifications"
          accent={accentColor}
        />
        <DarkModeToggle accent={accentColor} />
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-4 overflow-y-auto">
        <SectionLabel>Principal</SectionLabel>
        {NAV_PRINCIPAL.map(item => (
          <NavLink key={item.href} href={item.href} label={item.label} Icon={item.Icon}
            active={item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/")}
            onClick={onNavClick}
            badge={item.href === "/clair-vision/pro/messagerie" ? msgUnread : undefined}
            accentColor={accentColor}
          />
        ))}

        <SectionLabel>Gestion</SectionLabel>
        {NAV_GESTION.map(item => (
          <NavLink key={item.href} href={item.href} label={item.label} Icon={item.Icon}
            active={pathname === item.href || pathname.startsWith(item.href + "/")}
            onClick={onNavClick}
            badge={item.href === "/clair-vision/pro/sav" ? (savOuverts || undefined) : undefined}
            accentColor={accentColor}
          />
        ))}

        <SectionLabel>Ressources</SectionLabel>
        {NAV_RESSOURCES.map(item => (
          <NavLink key={item.href} href={item.href} label={item.label} Icon={item.Icon}
            active={pathname === item.href || pathname.startsWith(item.href + "/")}
            onClick={onNavClick}
            accentColor={accentColor}
          />
        ))}

        {currentUser.role !== "Assistant(e)" && (
          <>
            <SectionLabel>Stock</SectionLabel>
            {NAV_STOCK.map(item => (
              <NavLink key={item.href} href={item.href} label={item.label} Icon={item.Icon}
                active={pathname === item.href || pathname.startsWith(item.href + "/")}
                onClick={onNavClick}
                accentColor={accentColor}
              />
            ))}
          </>
        )}

        {currentUser.role === "Gérant" && (
          <>
            <SectionLabel>Gérant</SectionLabel>
            {NAV_GERANT.map(item => (
              <NavLink key={item.href} href={item.href} label={item.label} Icon={item.Icon}
                active={item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/")}
                onClick={onNavClick}
                accentColor={accentColor}
              />
            ))}
          </>
        )}

        <div className="my-1.5 mt-4 border-t border-slate-200/60" />
        <SettingsNavButton
          label="Paramètres"
          Icon={IconSettings}
          active={settingsOpen}
          onClick={() => { onNavClick?.(); onOpenSettings(); }}
          accentColor={accentColor}
        />
      </nav>

      {/* Footer */}
      <div className="px-4 pb-5">
        {/* Bulle configuration incomplète */}
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
          <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" style={{ color: accentColor }}>
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

/* ── Layout ──────────────────────────────────────────────────────────────────── */
export default function ProVisionLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSetupBubble, setShowSetupBubble] = useState(false);

  /* ── User state ── */
  const [users, setUsers]             = useState<ProUser[]>(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState<ProUser>(DEFAULT_USERS[1]);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(DEFAULT_STORE_CONFIG);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded  = loadUsers();
    const curId   = loadCurrentUserId();
    const current = loaded.find(u => u.id === curId) ?? loaded[1] ?? loaded[0];
    setUsers(loaded);
    setCurrentUser(current);
    const cfg = loadStoreConfig();
    setStoreConfig(cfg);
    if (cfg.nom) logProActivity("vision", cfg.nom);
    if (!localStorage.getItem(LS_FLAG("vision"))) setShowOnboarding(true);
    else if (localStorage.getItem(LS_SKIP_FLAG("vision"))) setShowSetupBubble(true);
  }, []);

  const handleStoreConfigChange = (updated: StoreConfig) => {
    setStoreConfig(updated);
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

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    clearCookie("thor_pro");
    router.replace("/");
  };

  const accentColor = storeConfig.accentColor ?? "#2D8CFF";

  return (
    <div className="min-h-screen" style={wrapperStyle}>
      <div className="flex h-screen w-full overflow-hidden">
        {/* ── Desktop sidebar ── */}
        <aside
          className="hidden lg:flex w-[260px] flex-col flex-shrink-0 sticky top-0 h-screen z-20"
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
            onOpenSettings={() => setSettingsOpen(true)}
            settingsOpen={settingsOpen}
            showSetupBubble={showSetupBubble}
            onSetupBubbleClick={() => { setShowOnboarding(true); setShowSetupBubble(false); }}
          />
        </aside>

        {/* ── Mobile top bar ── */}
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
              style={mkAccentStyle(accentColor)}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
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

        {/* ── Mobile overlay ── */}
        {mobileOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
        )}

        {/* ── Mobile slide-in sidebar ── */}
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
              <IconX className="w-4 h-4" />
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
            onOpenSettings={() => setSettingsOpen(true)}
            settingsOpen={settingsOpen}
            showSetupBubble={showSetupBubble}
            onSetupBubbleClick={() => { setShowOnboarding(true); setShowSetupBubble(false); }}
          />
        </aside>

        {/* ── Main content ── */}
        <main className="relative flex-1 flex flex-col overflow-y-auto pt-20 lg:pt-0">
          <div className="relative flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</div>
        </main>
      </div>

      {/* ── Settings Panel ── */}
      {settingsOpen && (
        <SettingsPanel
          onClose={() => setSettingsOpen(false)}
          storeConfig={storeConfig}
          onStoreConfigChange={handleStoreConfigChange}
          users={users}
          onUsersChange={handleUsersChange}
          accentColor={accentColor}
        />
      )}

      {/* ── Assistant IA ── */}
      <ChatWidget context="pro-vision" />


      {/* ── Onboarding wizard ── */}
      {showOnboarding && (
        <OnboardingWizard
          product="vision"
          onComplete={() => { setShowOnboarding(false); setShowSetupBubble(false); setStoreConfig(loadStoreConfig()); }}
          onSkip={() => { setShowOnboarding(false); setShowSetupBubble(true); }}
        />
      )}
    </div>
  );
}
