import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/ui/reveal";
import {
  CATEGORY_LABELS,
  getAllRealisations,
  getRealisationBySlug,
} from "@/lib/realisations";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllRealisations().map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const item = getRealisationBySlug(slug);
  if (!item) return { title: "Réalisation introuvable" };
  return { title: item.name, description: item.summary };
}

function isExternal(href: string) {
  return /^https?:\/\//.test(href);
}

export default async function RealisationPage({ params }: Params) {
  const { slug } = await params;
  const item = getRealisationBySlug(slug);
  if (!item) notFound();

  const others = getAllRealisations().filter((r) => r.slug !== item.slug).slice(0, 3);

  return (
    <div className="relative pt-32 pb-24 sm:pt-40">
      <div className="mx-auto max-w-[1100px] px-5 sm:px-6">

        <Reveal>
          <Link
            href="/realisations"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-10"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 12H5M11 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Toutes les réalisations
          </Link>
        </Reveal>

        {/* ── En-tête ─────────────────────────────────────────────────── */}
        <Reveal>
          <div className="flex items-center gap-3 mb-6">
            <span
              className="text-xs font-semibold uppercase tracking-[0.15em]"
              style={{ color: item.accent }}
            >
              {item.tagline}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-400 uppercase tracking-[0.15em]">
              {CATEGORY_LABELS[item.category]} · {item.year}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 h-title leading-[1.02]">
            {item.name}
          </h1>

          <p className="mt-6 text-lg text-slate-500 leading-relaxed max-w-2xl">
            {item.summary}
          </p>

          {item.status === "live" && item.href && (
            <div className="mt-8 flex flex-wrap gap-3">
              {isExternal(item.href) ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.02]"
                  style={{ background: item.accent, boxShadow: `0 4px 20px ${item.accent}66` }}
                >
                  Voir le site en ligne
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              ) : (
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.02]"
                  style={{ background: item.accent, boxShadow: `0 4px 20px ${item.accent}66` }}
                >
                  Découvrir {item.name}
                </Link>
              )}
              {item.proHref && (
                <Link
                  href={item.proHref}
                  className="inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold transition-colors hover:bg-white"
                  style={{
                    color: item.accent,
                    background: item.accentLight,
                    border: `1px solid ${item.accent}33`,
                  }}
                >
                  Espace pro →
                </Link>
              )}
            </div>
          )}
        </Reveal>

        {/* ── Bandeau visuel ──────────────────────────────────────────── */}
        <Reveal>
          <div
            className="relative mt-14 h-56 sm:h-72 rounded-[var(--radius-large)] overflow-hidden border border-white/80"
            style={{
              background: `linear-gradient(135deg, ${item.accent}1F 0%, ${item.accent}0A 50%, transparent 100%)`,
            }}
          >
            <div
              aria-hidden="true"
              className="absolute -top-24 -right-16 w-96 h-96 rounded-full blur-3xl opacity-60"
              style={{ background: `${item.accent}33` }}
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full blur-3xl opacity-40"
              style={{ background: `${item.accent}22` }}
            />
            <div className="relative h-full grid place-items-center">
              <span
                className="text-4xl sm:text-6xl font-bold tracking-tight h-title opacity-25"
                style={{ color: item.accent }}
              >
                {item.name}
              </span>
            </div>
          </div>
        </Reveal>

        {/* ── Chiffres clés ───────────────────────────────────────────── */}
        {item.outcomes.length > 0 && (
          <Reveal>
            <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {item.outcomes.map((o, i) => (
                <div
                  key={o.label}
                  className="rounded-2xl p-6"
                  style={{
                    background: "rgba(255,255,255,0.60)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.80)",
                    boxShadow: "0 4px 24px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
                  }}
                >
                  <span className="text-[10px] font-mono text-slate-300 tracking-[0.1em]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 h-title">
                    {o.value}
                  </div>
                  <div className="mt-1.5 text-[11px] text-slate-500 uppercase tracking-[0.15em]">
                    {o.label}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        )}

        {/* ── Contexte & mission ──────────────────────────────────────── */}
        <div className="mt-20 grid md:grid-cols-[1.15fr_1fr] gap-12 md:gap-16">
          <Reveal>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 h-title mb-5">
                Le contexte
              </h2>
              <p className="text-base text-slate-600 leading-[1.75]">{item.context}</p>

              <h2 className="text-2xl font-bold tracking-tight text-slate-900 h-title mt-12 mb-5">
                Ce qu&apos;on a fait
              </h2>
              <ul className="space-y-3">
                {item.mission.map((m) => (
                  <li key={m} className="flex items-start gap-3 text-base text-slate-600 leading-relaxed">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-1 shrink-0" style={{ color: item.accent }} aria-hidden="true">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal>
            <aside className="space-y-8">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4">
                  Pour qui
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.audience}</p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4">
                  Fonctionnalités
                </h3>
                <ul className="space-y-2">
                  {item.features.map((f) => (
                    <li key={f} className="text-sm text-slate-600 leading-relaxed">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4">
                  Technologies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {item.stack.map((s) => (
                    <span
                      key={s}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </aside>
          </Reveal>
        </div>

        {/* ── Autres projets ──────────────────────────────────────────── */}
        <Reveal>
          <div className="mt-24 border-t border-slate-200 pt-14">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-8">
              Autres réalisations
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {others.map((o) => (
                <Link
                  key={o.slug}
                  href={`/realisations/${o.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300"
                >
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[0.15em]"
                    style={{ color: o.accent }}
                  >
                    {o.tagline}
                  </span>
                  <div className="mt-2 text-lg font-semibold text-slate-900 h-title">{o.name}</div>
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-all group-hover:gap-2.5 group-hover:text-slate-600">
                    Voir le projet
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
