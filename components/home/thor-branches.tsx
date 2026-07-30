import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";

type Branch = {
  eyebrow: string;
  title: string;
  lead: string;
  href: string;
  cta: string;
  accent: string;
  accentLight: string;
  icon: React.ReactNode;
};

function StudioIcon() {
  return (
    <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2 2 7l10 5 10-5-10-5Z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </svg>
  );
}

function ProduitsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
    lead: "On mesure votre marché, on construit votre site, on reste là après.",
    href: "/studio",
    cta: "Découvrir le Studio",
    accent: "#6366F1",
    accentLight: "rgba(99,102,241,0.10)",
    icon: <StudioIcon />,
  },
  {
    eyebrow: "THOR Produits",
    title: "Votre activité tourne déjà",
    lead: "Des outils prêts à l'emploi, chacun taillé pour son métier.",
    href: "/produits",
    cta: "Voir les produits",
    accent: "#2D8CFF",
    accentLight: "rgba(45,140,255,0.10)",
    icon: <ProduitsIcon />,
  },
];

export function ThorBranches() {
  return (
    <section id="branches" className="relative py-40 sm:py-56 md:py-72">
      <div className="mx-auto max-w-[1100px] px-5 sm:px-6">
        <Reveal>
          <h2 className="h-title mx-auto mb-20 sm:mb-28 max-w-2xl text-center text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.05]">
            Par où commencer ?
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-5">
          {BRANCHES.map((b) => (
            <Reveal key={b.eyebrow}>
              <Link
                href={b.href}
                className="lg lg-card group flex h-full flex-col p-8 sm:p-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <div className="flex-1">
                  <span
                    className="grid place-items-center w-12 h-12 rounded-2xl mb-8"
                    style={{ background: b.accentLight, color: b.accent }}
                  >
                    {b.icon}
                  </span>

                  <div className="text-[13px] font-medium mb-3" style={{ color: b.accent }}>
                    {b.eyebrow}
                  </div>

                  <h3 className="h-title text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-[1.15] mb-4">
                    {b.title}
                  </h3>

                  {/* La liste à puces a sauté : trois arguments par carte,
                      six au total, c'est une page de vente posée sur le ciel.
                      Le détail vit sur /studio et /produits, où le lecteur
                      arrive en ayant choisi. */}
                  <p className="text-[15px] text-slate-300/75 leading-[1.7] mb-8">{b.lead}</p>
                </div>

                <span className="inline-flex items-center gap-2 text-[15px] font-medium text-white transition-all duration-300 group-hover:gap-3">
                  {b.cta}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
