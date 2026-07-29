"use client";

import Link from "next/link";
import { getAllRealisations } from "@/lib/realisations";

/* ──────────────────────────────────────────────────────────────────────────
   Les sites en production.

   Le système solaire n'est plus ici : il occupe le fond de toute la page
   (cf. solar-canvas.tsx). Cette section ne le redessine donc pas — elle
   nomme ce qui tourne derrière.

   Elle n'est pas décorative pour autant. Une planète ne se découvre qu'au
   survol, ce qui n'existe ni au clavier ni au doigt : c'est ici que les six
   projets sont réellement atteignables, et c'est ce que lit un lecteur
   d'écran. Le décor fait l'effet, cette liste fait le travail.
   ──────────────────────────────────────────────────────────────────────── */

const LIVE = getAllRealisations().filter((r) => r.status === "live");

export function ThorSolarSystem() {
  return (
    <section id="ecosysteme" className="relative py-24 sm:py-28 md:py-32">
      <div className="mx-auto max-w-[1100px] px-5 sm:px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="mb-5 block text-[11px] font-medium uppercase tracking-[0.22em] text-amber-200/70">
            En production
          </span>
          <h2
            className="h-title text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.05]"
            style={{ textShadow: "0 2px 40px rgba(2,3,10,0.8)" }}
          >
            Ce qu’on a déjà mis en ligne.
          </h2>
          <p
            className="mt-6 text-lg leading-[1.6] text-slate-300/80"
            style={{ textShadow: "0 1px 20px rgba(2,3,10,0.85)" }}
          >
            Une planète par site, à sa couleur. Elles tournent derrière cette
            page — celles-ci s’ouvrent au clic.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LIVE.map((item) => (
            <Link
              key={item.slug}
              href={`/realisations/${item.slug}`}
              className="lg lg-card group flex items-center gap-4 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              {/* La même bille que dans le décor, en plus petit : c'est ce qui
                  fait le lien entre la liste et ce qui tourne derrière. */}
              <span
                aria-hidden="true"
                className="block h-6 w-6 shrink-0 rounded-full transition-transform duration-500 group-hover:scale-110"
                style={{
                  background: `radial-gradient(circle at 34% 28%, #FFFFFF 0%, ${item.accent} 42%, color-mix(in srgb, ${item.accent} 42%, #05070E) 100%)`,
                  boxShadow: `0 0 12px 1px ${item.accent}A6, inset -1px -2px 4px -1px rgba(0,0,0,0.75)`,
                  transitionTimingFunction: "var(--lg-ease)",
                }}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium text-white">{item.name}</span>
                <span className="block truncate text-[13px] text-white/50">{item.tagline}</span>
              </span>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0 text-white/30 transition-transform duration-500 group-hover:translate-x-0.5"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/realisations" className="lg lg-btn">
            <span>Tout le portfolio</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
