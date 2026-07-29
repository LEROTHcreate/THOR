"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, useEffect } from "react";

import { ThorMarkTile } from "@/components/thor-mark";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const navLinks = [
  { href: "/",             label: "Accueil" },
  { href: "/studio",       label: "Studio" },
  { href: "/produits",     label: "Produits" },
  { href: "/realisations", label: "Réalisations" },
];

export default function Header() {
  const pathname  = usePathname();
  const [open,    setOpen]    = useState(false);

  // Masquer sur les modules
  const hideThorHeader =
    pathname.startsWith("/clair-vision") ||
    pathname.startsWith("/clair-audition");

  // Fermer le menu mobile sur navigation
  useEffect(() => { setOpen(false); }, [pathname]);

  const isActive = useMemo(() => {
    return (href: string) => {
      const path = href.split("#")[0];
      if (path === "/" || path === "") return pathname === "/";
      return pathname?.startsWith(path);
    };
  }, [pathname]);

  /* La page d'accueil est nocturne : le header y passe en clair. Les autres
     pages gardent l'encre sur verre blanc. */
  const night = pathname === "/";

  if (hideThorHeader) return null;

  return (
    <header className="glass-liquid-top fixed inset-x-0 top-0 z-50">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-16">
        <div className="flex h-20 items-center justify-between">

          {/* ── Logo THOR ── */}
          <Link href="/" className="flex items-center gap-3 group" aria-label="THOR — Accueil">
            <ThorMarkTile
              size={44}
              className="transition-transform duration-200 group-hover:scale-[1.05] shadow-[0_2px_8px_rgba(11,18,32,0.18)]"
            />

            <div className="leading-tight">
              <div className={cn("text-[16px] font-bold tracking-tight", night ? "text-white" : "text-thor-text")}>
                THOR
              </div>
              <div className={cn("text-[10px] tracking-wide", night ? "text-white/50" : "text-thor-muted")}>
                <span className="text-indigo-500 font-medium">Studio</span>
                {" · "}
                <span className="text-vision-accent font-medium">Produits</span>
              </div>
            </div>
          </Link>

          {/* ── Nav desktop (pilule) ── */}
          <nav
            className="lg hidden md:flex items-center rounded-[var(--radius-pill)] p-1"
            aria-label="Navigation principale"
          >
            {navLinks.map((l) => {
              const active = isActive(l.href);

              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-[var(--radius-pill)]",
                    "transition-all duration-300",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20",
                    active
                      ? (night ? "bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]" : "bg-white/90 shadow-[var(--shadow-soft)] text-thor-text")
                      : (night ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-thor-muted hover:bg-white/50 hover:text-thor-text"),
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {/* ── Actions desktop ── */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/contact?sujet=demo"
              className="lg lg-btn lg-btn-ink text-sm"
              style={{ padding: "0.65rem 1.25rem" }}
            >
              <span>Réserver une démo</span>
            </Link>
          </div>

          {/* ── Burger mobile ── */}
          <button
            className="
              md:hidden rounded-xl p-2.5
              hover:bg-thor-surface-2 transition-colors duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vision-accent/40
            "
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" stroke={night ? "#FFFFFF" : "#0B1220"} strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke={night ? "#FFFFFF" : "#0B1220"} strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        {/* ── Menu mobile ── */}
        {open && (
          <div className="md:hidden pb-5 animate-[slideUp_200ms_ease-out_both] px-0">
            <div className="rounded-[var(--radius-large)] bg-white ring-1 ring-thor-border shadow-[var(--shadow-card)] p-2">

              <div className="flex flex-col">
                {navLinks.map((l) => {
                  const active = isActive(l.href);
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200",
                        "min-h-[44px] flex items-center",
                        active
                          ? "bg-thor-surface-2 text-thor-text"
                          : "text-thor-muted hover:bg-thor-surface-2 hover:text-thor-text",
                      )}
                    >
                      {l.label}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-2 flex flex-col gap-2 p-2 border-t border-thor-border pt-4">
                <Link
                  href="/contact?sujet=demo"
                  onClick={() => setOpen(false)}
                  className="lg lg-btn lg-btn-ink min-h-[44px] w-full text-sm"
                >
                  <span>Réserver une démo</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
