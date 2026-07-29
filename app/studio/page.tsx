import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Studio",
  description:
    "THOR Studio accompagne la création d'entreprise de A à Z : étude du marché adressable, identité, site sur mesure et suivi après le lancement.",
};

const ACCENT = "#6366F1";
const ACCENT_LIGHT = "#EEF2FF";

/* ── Les quatre volets de l'accompagnement ────────────────────────────── */

const VOLETS = [
  {
    title: "Cadrage et marché",
    desc: "On part de votre activité et de votre zone. Combien de clients potentiels, quelle concurrence, quel positionnement tient la route.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
  },
  {
    title: "Identité et message",
    desc: "Un nom qui se retient, une identité cohérente, et surtout une phrase claire qui dit ce que vous faites et pour qui.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="13.5" cy="6.5" r="2.5" />
        <circle cx="19" cy="13" r="2.5" />
        <circle cx="6" cy="12" r="3" />
        <path d="M12 22a10 10 0 1 1 10-10" />
      </svg>
    ),
  },
  {
    title: "Site et outils",
    desc: "Un site rapide, lisible sur mobile, accessible, et les outils qui vont avec : prise de rendez-vous, formulaires, suivi client.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    title: "Lancement et suivi",
    desc: "Mise en ligne, référencement de base, mesure de l'audience. Et un interlocuteur qui reste joignable après la facture.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4.5 16.5 3 21l4.5-1.5" />
        <path d="M12 15 9 12l1.5-3a9 9 0 0 1 8-5 9 9 0 0 1-5 8L12 15Z" />
        <circle cx="15" cy="9" r="1.5" />
      </svg>
    ),
  },
];

/* ── Le déroulé, étape par étape ──────────────────────────────────────── */

const ETAPES = [
  {
    label: "Premier échange",
    duree: "45 minutes",
    desc: "Vous racontez votre projet. On vous dit franchement ce qui nous paraît solide et ce qui mérite d'être retravaillé. Sans engagement.",
  },
  {
    label: "Étude du marché",
    duree: "1 semaine",
    desc: "Taille du marché atteignable sur votre zone, densité de concurrence, profil de la clientèle. Un document que vous gardez, quoi qu'il arrive ensuite.",
  },
  {
    label: "Proposition",
    duree: "3 jours",
    desc: "Le périmètre exact, le calendrier et le prix. Un seul document, pas de ligne cachée, pas de coût qui apparaît en cours de route.",
  },
  {
    label: "Construction",
    duree: "3 à 6 semaines",
    desc: "Vous suivez l'avancement depuis votre espace client. Vous voyez les écrans se construire, vous commentez, on ajuste.",
  },
  {
    label: "Mise en ligne",
    duree: "1 journée",
    desc: "Nom de domaine, hébergement, e-mails professionnels, mesure d'audience. On s'occupe de la technique, vous récupérez les clés.",
  },
  {
    label: "Après",
    duree: "En continu",
    desc: "Le site vit. Corrections, évolutions, nouvelles pages : vous nous écrivez, on traite. Pas de contrat annuel imposé.",
  },
];

export default function StudioPage() {
  return (
    <div className="relative pt-32 pb-24 sm:pt-40">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-6">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <Reveal>
          <div className="max-w-3xl">
            <div
              className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-xs font-medium text-slate-500 backdrop-blur-xl mb-8"
              style={{ boxShadow: "0 4px 20px rgba(99,102,241,0.10), inset 0 1px 0 rgba(255,255,255,0.9)" }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: ACCENT, boxShadow: `0 0 10px ${ACCENT}B3`, animation: "glowPulse 2.4s ease-in-out infinite" }}
              />
              <span className="uppercase tracking-[0.12em] text-[11px]">THOR Studio</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-bold tracking-tight text-slate-900 h-title leading-[1.02]">
              Vous avez une idée.
              <br />
              <span
                style={{
                  background: "linear-gradient(90deg, #6366F1 0%, #2D8CFF 45%, #6366F1 100%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "textGradientSlide 8s linear infinite",
                }}
              >
                On s&apos;occupe du reste.
              </span>
            </h1>

            <p className="mt-7 text-lg text-slate-500 leading-[1.7] max-w-xl">
              Créer une entreprise, ce n&apos;est pas seulement faire un site. C&apos;est
              savoir à qui l&apos;on parle, combien ils sont, et comment les atteindre.
              THOR Studio prend le projet à son début et ne le lâche pas au lancement.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link
                href="/contact?sujet=studio"
                className="group relative inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03] overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #0B1220, #1E2A3A)",
                  boxShadow: "0 8px 30px rgba(11,18,32,0.25), 0 0 0 1px rgba(99,102,241,0.15) inset",
                }}
              >
                <span className="relative z-10">Parler de mon projet</span>
                <span
                  aria-hidden="true"
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.40) 0%, transparent 60%)" }}
                />
              </Link>
              <Link
                href="/realisations"
                className="inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold text-slate-700 ring-1 ring-white/60 transition-all duration-200 hover:ring-white/90"
                style={{
                  background: "rgba(255,255,255,0.70)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
                }}
              >
                Voir nos réalisations →
              </Link>
            </div>
          </div>
        </Reveal>

        {/* ── Les quatre volets ─────────────────────────────────────── */}
        <section className="mt-28 sm:mt-36">
          <Reveal>
            <div className="max-w-2xl mb-14">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4 block">
                L&apos;accompagnement
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 h-title">
                Quatre volets, <span className="font-light text-slate-500">un seul interlocuteur.</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            {VOLETS.map((v, i) => (
              <Reveal key={v.title}>
                <div
                  className="relative h-full rounded-3xl p-7 sm:p-8 transition-transform duration-300 hover:-translate-y-0.5"
                  style={{
                    background: "rgba(255,255,255,0.60)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.80)",
                    boxShadow: "0 4px 24px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
                  }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <span
                      className="grid place-items-center w-11 h-11 rounded-2xl [&>svg]:w-5 [&>svg]:h-5"
                      style={{ background: ACCENT_LIGHT, color: ACCENT }}
                    >
                      {v.icon}
                    </span>
                    <span className="text-xs font-mono text-slate-300 tracking-[0.1em]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 h-title mb-3">{v.title}</h3>
                  <p className="text-[15px] text-slate-500 leading-[1.7]">{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Le marché adressable — la brique différenciante ────────── */}
        <section className="mt-28 sm:mt-36">
          <Reveal>
            <div
              className="relative overflow-hidden rounded-[var(--radius-large)] px-6 py-12 sm:px-12 sm:py-16"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}14 0%, ${ACCENT}06 55%, transparent 100%)`,
                border: "1px solid rgba(255,255,255,0.85)",
              }}
            >
              <div
                aria-hidden="true"
                className="absolute -top-32 -right-24 w-96 h-96 rounded-full blur-3xl opacity-50"
                style={{ background: `${ACCENT}33` }}
              />

              <div className="relative grid md:grid-cols-[1.1fr_1fr] gap-12 items-center">
                <div>
                  <span
                    className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] mb-6"
                    style={{ color: ACCENT }}
                  >
                    En préparation
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 h-title leading-[1.1]">
                    Voir votre marché
                    <br />
                    <span className="font-light text-slate-500">avant de vous lancer.</span>
                  </h2>
                  <p className="mt-5 text-[15px] text-slate-600 leading-[1.75] max-w-md">
                    Un outil en cours de construction : vous indiquez votre métier et
                    votre zone, il vous montre le nombre de clients potentiels, les
                    concurrents déjà installés et le profil de la population autour de vous.
                    D&apos;ici là, cette étude est faite à la main pour chaque projet.
                  </p>
                  <Link
                    href="/contact?sujet=etude-marche"
                    className="mt-8 inline-flex items-center gap-2 text-sm font-semibold transition-all duration-200 hover:gap-3"
                    style={{ color: ACCENT }}
                  >
                    Demander une étude pour mon activité
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>

                {/* Aperçu schématique de la restitution */}
                <div
                  className="rounded-2xl p-6 bg-white/80 backdrop-blur-xl"
                  style={{ border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 8px 32px rgba(15,23,42,0.06)" }}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-5">
                    Aperçu de la restitution
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: "Marché total", value: "18 400", width: "100%" },
                      { label: "Marché atteignable", value: "6 200", width: "62%" },
                      { label: "Objectif 1re année", value: "740", width: "18%" },
                    ].map((row) => (
                      <div key={row.label}>
                        <div className="flex items-baseline justify-between mb-1.5">
                          <span className="text-[11px] text-slate-500 uppercase tracking-wider">{row.label}</span>
                          <span className="text-sm font-semibold text-slate-900 tabular-nums">{row.value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: row.width, background: `linear-gradient(90deg, ${ACCENT}, #2D8CFF)` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 text-[11px] text-slate-400 leading-relaxed">
                    Chiffres d&apos;illustration. Les données réelles proviennent des
                    bases publiques de l&apos;INSEE.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── Le déroulé ────────────────────────────────────────────── */}
        <section className="mt-28 sm:mt-36">
          <Reveal>
            <div className="max-w-2xl mb-14">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4 block">
                Le déroulé
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 h-title">
                De l&apos;idée au lancement, <span className="font-light text-slate-500">étape par étape.</span>
              </h2>
            </div>
          </Reveal>

          <ol className="relative">
            <div
              aria-hidden="true"
              className="absolute left-[15px] top-2 bottom-2 w-px hidden sm:block"
              style={{ background: `linear-gradient(180deg, ${ACCENT}40, transparent)` }}
            />
            {ETAPES.map((e, i) => (
              <Reveal key={e.label}>
                <li className="relative sm:pl-14 pb-10 last:pb-0">
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1.5 hidden sm:grid place-items-center w-8 h-8 rounded-full bg-white text-[11px] font-mono font-semibold"
                    style={{ color: ACCENT, border: `1px solid ${ACCENT}33`, boxShadow: `0 0 0 4px ${ACCENT}0F` }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-2">
                    <h3 className="text-xl font-semibold text-slate-900 h-title">{e.label}</h3>
                    <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">
                      {e.duree}
                    </span>
                  </div>
                  <p className="text-[15px] text-slate-500 leading-[1.75] max-w-2xl">{e.desc}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* ── Appel à l'action ──────────────────────────────────────── */}
        <Reveal>
          <div className="mt-24 rounded-[var(--radius-large)] border border-slate-200 bg-white px-6 py-12 sm:px-12 sm:py-16 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-[40px] font-light tracking-tight text-slate-900 h-title leading-[1.15]">
              Le premier échange <span className="font-semibold">ne coûte rien.</span>
            </h2>
            <p className="mt-5 text-slate-500 max-w-lg mx-auto text-[15px] leading-[1.7]">
              Quarante-cinq minutes pour comprendre votre projet et vous dire
              honnêtement s&apos;il tient debout. Même si la réponse est non.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/contact?sujet=studio"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Prendre contact
              </Link>
              <Link
                href="/realisations"
                className="inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold text-slate-700 border border-slate-200 transition-colors hover:bg-slate-50"
              >
                Voir ce qu&apos;on a déjà fait →
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
