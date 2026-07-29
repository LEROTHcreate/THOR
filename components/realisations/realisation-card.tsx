"use client";

import Link from "next/link";
import { useRef } from "react";
import { CATEGORY_LABELS, type Realisation } from "@/lib/realisations";

/**
 * Carte de réalisation — commune à la home et à la page portfolio.
 * Le tilt suit la souris (6° maximum) : il sert à signaler que la carte
 * est cliquable, pas à décorer.
 */
export function RealisationCard({ item, index }: { item: Realisation; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    el.style.transform = `perspective(1000px) rotateX(${(0.5 - py) * 6}deg) rotateY(${(px - 0.5) * 6}deg) translateY(-6px)`;
  }

  function onMouseLeave() {
    const el = cardRef.current;
    if (el) el.style.transform = "";
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="group relative h-full overflow-hidden rounded-3xl transition-transform duration-300 will-change-transform"
      style={{
        background: "rgba(255,255,255,0.65)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.85)",
        boxShadow: "0 8px 32px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Bandeau de couverture — dégradé signature du projet */}
      <div
        className="relative h-32 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${item.accent}22 0%, ${item.accent}08 55%, transparent 100%)`,
        }}
      >
        <div
          aria-hidden="true"
          className="absolute -top-16 -right-10 w-52 h-52 rounded-full blur-3xl opacity-50 group-hover:opacity-90 transition-opacity duration-500"
          style={{ background: `${item.accent}40` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${item.accent}66, transparent)` }}
        />
        <div className="relative flex h-full items-end justify-between px-6 pb-4">
          <span
            className="text-xs font-semibold uppercase tracking-[0.15em]"
            style={{ color: item.accent }}
          >
            {item.tagline}
          </span>
          <span className="text-[10px] font-mono text-slate-400 tabular-nums">
            {String(index + 1).padStart(2, "0")} / {item.year}
          </span>
        </div>
      </div>

      <div className="relative p-6 sm:p-7">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 h-title leading-tight">
            {item.name}
          </h3>
          {item.status === "soon" && (
            <span className="shrink-0 mt-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 px-2 py-1 rounded-full bg-slate-100/80 border border-slate-200">
              Bientôt
            </span>
          )}
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-4">{item.summary}</p>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span
            className="text-[11px] font-medium px-2.5 py-1 rounded-full"
            style={{ background: item.accentLight, color: item.accent }}
          >
            {CATEGORY_LABELS[item.category]}
          </span>
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
            {item.sector}
          </span>
        </div>

        <Link
          href={`/realisations/${item.slug}`}
          className="inline-flex items-center gap-2 text-sm font-semibold transition-all duration-200 group-hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-full"
          style={{ color: item.accent }}
        >
          Voir le projet
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {/* Étend la zone cliquable à toute la carte sans imbriquer de lien */}
          <span className="absolute inset-0" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
