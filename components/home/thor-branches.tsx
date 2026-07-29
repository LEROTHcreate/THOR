import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";

type Branch = {
  eyebrow: string;
  title: string;
  lead: string;
  points: string[];
  href: string;
  cta: string;
  accent: string;
  accentLight: string;
  icon: React.ReactNode;
};

function StudioIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2 2 7l10 5 10-5-10-5Z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </svg>
  );
}

function ProduitsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.6" />
      <rect x="14" y="3" width="7" height="7" rx="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1.6" />
      <rect x="14" y="14" width="7" height="7" rx="1.6" />
    </svg>
  );
}

const BRANCHES: Branch[] = [
  {
    eyebrow: "THOR Studio",
    title: "Vous lancez votre activité",
    lead: "On cadre le projet, on mesure le marché que vous pouvez atteindre, on construit votre site et on reste là après la mise en ligne.",
    points: [
      "Étude du marché adressable sur votre zone",
      "Identité et site sur mesure",
      "Accompagnement de A à Z, un seul interlocuteur",
    ],
    href: "/studio",
    cta: "Découvrir le Studio",
    accent: "#6366F1",
    accentLight: "#EEF2FF",
    icon: <StudioIcon />,
  },
  {
    eyebrow: "THOR Produits",
    title: "Vous exercez un métier de santé",
    lead: "Des plateformes prêtes à l'emploi pour les opticiens, les audioprothésistes et les pharmaciens, avec la conformité santé intégrée.",
    points: [
      "Clair Vision, Clair Audition, PharmaPlanning",
      "Hébergement HDS et conformité RGPD",
      "IA THOR intégrée nativement",
    ],
    href: "/produits",
    cta: "Voir les plateformes",
    accent: "#2D8CFF",
    accentLight: "#EFF6FF",
    icon: <ProduitsIcon />,
  },
];

export function ThorBranches() {
  return (
    <section id="branches" className="relative py-16 sm:py-24 md:py-28">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-6">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4 block">
              Deux façons de travailler avec nous
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 h-title">
              Par où <span className="font-light text-slate-500">commencer ?</span>
            </h2>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6">
          {BRANCHES.map((b) => (
            <Reveal key={b.eyebrow}>
              <Link
                href={b.href}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl p-7 sm:p-9 transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: "rgba(255,255,255,0.65)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  border: "1px solid rgba(255,255,255,0.85)",
                  boxShadow: "0 8px 32px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
                }}
              >
                <div
                  aria-hidden="true"
                  className="absolute -top-28 -right-24 w-64 h-64 rounded-full blur-3xl opacity-40 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `${b.accent}33` }}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(90deg, transparent, ${b.accent}, transparent)` }}
                />

                <div className="relative flex-1">
                  <div className="flex items-center gap-3 mb-6">
                    <span
                      className="grid place-items-center w-11 h-11 rounded-2xl"
                      style={{ background: b.accentLight, color: b.accent }}
                    >
                      {b.icon}
                    </span>
                    <span
                      className="text-xs font-semibold uppercase tracking-[0.15em]"
                      style={{ color: b.accent }}
                    >
                      {b.eyebrow}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 h-title leading-tight mb-4">
                    {b.title}
                  </h3>

                  <p className="text-base text-slate-600 leading-relaxed mb-7">{b.lead}</p>

                  <ul className="space-y-2.5 mb-8">
                    {b.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0" style={{ color: b.accent }} aria-hidden="true">
                          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>

                <span
                  className="relative inline-flex items-center gap-2 text-sm font-semibold transition-all duration-200 group-hover:gap-3"
                  style={{ color: b.accent }}
                >
                  {b.cta}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
