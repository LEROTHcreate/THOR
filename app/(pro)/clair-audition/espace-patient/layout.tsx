"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import ChatWidget from "@/components/ui/ChatWidget";

function getCookie(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : "";
}
function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

function IconHome() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none"><path d="M4 10.5 12 4l8 6.5V20a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 20v-9.5Z" stroke="currentColor" strokeWidth="1.7" /><path d="M9.5 21.5v-7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v7" stroke="currentColor" strokeWidth="1.7" /></svg>;
}
function IconUser() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none"><path d="M12 12.2a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12.2Z" stroke="currentColor" strokeWidth="1.7" /><path d="M4.5 20.2c1.7-4 13.3-4 15 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
}
function IconEar() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none"><path d="M7.5 12.2V10.4A6.1 6.1 0 0 1 13.6 4.3c3.4 0 6.1 2.7 6.1 6.1v2.6c0 3.2-1.8 5.3-4.3 6.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><path d="M7.5 12.2v3.3A5.1 5.1 0 0 0 12.6 20.6c2 0 3.7-1.6 3.7-3.6 0-1.4-.8-2.5-2-3.1l-1.1-.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function IconHearing() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none"><path d="M14.8 4.3c3.3.6 5.6 3.7 5.6 7.6 0 5.2-3.9 9.4-8.7 8.6-2.6-.4-4.3-2.4-4.3-4.9 0-1.8.9-3.3 2.3-4.3l2-1.4c1.1-.8 1.6-1.6 1.6-2.9V6.2c0-1 .6-1.9 1.5-1.9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function IconFile() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none"><path d="M7 2.8h6.8L19.2 8v13.2A2 2 0 0 1 17.2 23H7A2 2 0 0 1 5 21.2V4.8A2 2 0 0 1 7 2.8Z" stroke="currentColor" strokeWidth="1.7" /><path d="M13.8 2.8V8h5.4" stroke="currentColor" strokeWidth="1.7" /></svg>;
}
function IconCart() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none"><path d="M7 6h15l-1.6 8.2a2 2 0 0 1-2 1.6H9a2 2 0 0 1-2-1.6L5.2 3H2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
}
function IconMessage() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none"><path d="M5 5.5h14A2.5 2.5 0 0 1 21.5 8v7A2.5 2.5 0 0 1 19 17.5H10l-4.5 3v-3H5A2.5 2.5 0 0 1 2.5 15V8A2.5 2.5 0 0 1 5 5.5Z" stroke="currentColor" strokeWidth="1.7" /></svg>;
}
function IconCalendar() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none"><rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.7"/><path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>;
}
function IconMap() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" stroke="currentColor" strokeWidth="1.7"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.7"/></svg>;
}
function IconBell() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>;
}
function IconClipboardCheck() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 12 2 2 4-4"/></svg>;
}

const NAV = [
  { href: "/clair-audition/espace-patient",                 label: "Accueil",         Icon: IconHome },
  { href: "/clair-audition/espace-patient/mon-profil",      label: "Mon profil",      Icon: IconUser },
  { href: "/clair-audition/espace-patient/bilans-auditifs", label: "Bilans auditifs", Icon: IconEar },
  { href: "/clair-audition/espace-patient/appareils",       label: "Mes appareils",   Icon: IconHearing },
  { href: "/clair-audition/espace-patient/ordonnances",     label: "Ordonnances",     Icon: IconFile },
  { href: "/clair-audition/espace-patient/documents",       label: "Documents",       Icon: IconFile },
  { href: "/clair-audition/espace-patient/achats",          label: "Achats",          Icon: IconCart },
  { href: "/clair-audition/espace-patient/messages",        label: "Messages",        Icon: IconMessage },
  { href: "/clair-audition/espace-patient/rendez-vous",       label: "Rendez-vous",       Icon: IconCalendar       },
  { href: "/clair-audition/espace-patient/pre-consultation", label: "Pré-consultation", Icon: IconClipboardCheck },
  { href: "/clair-audition/espace-patient/centres",          label: "Mes centres",      Icon: IconMap            },
  { href: "/clair-audition/espace-patient/actualites",       label: "Actualités",       Icon: IconBell           },
];

function SidebarContent({
  pathname,
  router,
  onNav,
}: {
  pathname: string;
  router: ReturnType<typeof useRouter>;
  onNav?: () => void;
}) {
  return (
    <>
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.50)" }}>
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl text-white shadow-[0_4px_16px_rgba(0,201,138,0.35)]"
               style={{ background: "#00C98A" }}>
            <IconEar />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">Clair Audition</div>
            <div className="text-xs text-slate-500">Espace patient</div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl p-3"
             style={{ background: "rgba(255,255,255,0.50)", border: "1px solid rgba(255,255,255,0.70)" }}>
          <div className="grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white shadow-[0_2px_10px_rgba(0,201,138,0.30)]"
               style={{ background: "#00C98A" }}>
            JD
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-800">Jean Dupont</div>
            <div className="truncate text-xs text-slate-500">jean.dupont@email.com</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== "/clair-audition/espace-patient" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              onClick={onNav}
              className={["flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "text-white shadow-[0_4px_18px_rgba(0,201,138,0.32)]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/55",
              ].join(" ")}
              style={active ? { background: "#00C98A" } : {}}
            >
              <span className={["grid h-7 w-7 place-items-center rounded-lg flex-shrink-0",
                active ? "bg-white/25" : "bg-white/60",
              ].join(" ")}
                    style={!active ? { border: "1px solid var(--glass-nav-border)" } : {}}>
                <span className={active ? "text-white" : "text-emerald-600"}><Icon /></span>
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-5 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.45)" }}>
        <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-500"
             style={{ background: "rgba(255,255,255,0.40)" }}>
          <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Z" stroke="currentColor" strokeWidth="1.8" />
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Données chiffrées · RGPD
        </div>
        <button type="button"
          onClick={() => { clearCookie("thor_patient"); router.replace("/"); }}
          className="w-full rounded-xl py-2 text-sm font-medium text-slate-500 transition-all hover:text-slate-800"
          style={{ background: "var(--glass-subtle-bg)", border: "1px solid var(--glass-subtle-border)" }}>
          Déconnexion
        </button>
      </div>
    </>
  );
}

export default function AuditionPatientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (getCookie("thor_patient") !== "1") router.replace("/connexion/patient");
  }, [router]);

  return (
    <div className="relative flex h-screen"
         style={{ background: "#f8fafc", zoom: 0.95 }}>

      {/* MOBILE TOP BAR */}
      <div className="lg:hidden"
           style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, height: 56, background: "var(--glass-strong-bg)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid var(--glass-sep)" }}>
        <div className="flex h-full items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl text-white shadow-[0_2px_10px_rgba(0,201,138,0.30)]"
                 style={{ background: "#00C98A" }}>
              <IconEar />
            </div>
            <div className="text-sm font-semibold text-slate-800">Clair Audition</div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-700"
            style={{ background: "var(--glass-strong-bg)", border: "1px solid var(--glass-border)" }}
            aria-label="Menu">
            {mobileOpen ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* MOBILE BACKDROP */}
      {mobileOpen && (
        <div
          className="fixed inset-0 lg:hidden"
          style={{ zIndex: 40, background: "rgba(0,0,0,0.25)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* MOBILE SLIDE-IN SIDEBAR */}
      <aside
        className="fixed top-0 left-0 bottom-0 flex w-[280px] flex-col lg:hidden"
        style={{
          zIndex: 45,
          background: "var(--glass-card-bg)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid var(--glass-border)",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        }}>
        <SidebarContent pathname={pathname} router={router} onNav={() => setMobileOpen(false)} />
      </aside>

      {/* DESKTOP SIDEBAR */}
      <aside className="relative z-20 hidden w-[260px] flex-shrink-0 flex-col lg:flex"
             style={{ background: "rgba(255,255,255,0.52)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRight: "1px solid rgba(255,255,255,0.65)" }}>
        <SidebarContent pathname={pathname} router={router} />
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="relative z-10 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 pt-20 pb-20 lg:pt-6 lg:pb-6">
        {children}
      </main>

      {/* ── Barre navigation mobile basse ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2"
        style={{ background: "var(--glass-card-bg)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderTop: "1px solid rgba(0,201,138,0.10)", boxShadow: "0 -4px 24px rgba(0,0,0,0.08)" }}>
        {[
          { href: "/clair-audition/espace-patient",                 label: "Accueil",  icon: <IconHome /> },
          { href: "/clair-audition/espace-patient/bilans-auditifs", label: "Bilans",   icon: <IconEar /> },
          { href: "/clair-audition/espace-patient/appareils",       label: "Appareils",icon: <IconHearing /> },
          { href: "/clair-audition/espace-patient/messages",        label: "Messages", icon: <IconMessage /> },
          { href: "/clair-audition/espace-patient/mon-profil",      label: "Profil",   icon: <IconUser /> },
        ].map((item) => {
          const active = pathname === item.href || (item.href !== "/clair-audition/espace-patient" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-[52px]"
              style={active ? { color: "#00C98A" } : { color: "#94a3b8" }}>
              <span className={`flex items-center justify-center w-7 h-7 rounded-xl transition-all ${active ? "bg-[rgba(0,201,138,0.12)]" : ""}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Assistant IA ── */}
      <ChatWidget context="patient-audition" />
    </div>
  );
}
