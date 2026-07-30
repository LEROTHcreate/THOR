import Link from "next/link";

import { ThorMarkTile } from "@/components/thor-mark";

const CONTACT_EMAIL = "contact.thor.pro@gmail.com";
const CONTACT_PHONE_DISPLAY = "07 69 46 24 46";
const CONTACT_PHONE_TEL     = "+33769462446";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="glass-liquid-bottom relative z-10">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 py-14">
        <div className="grid gap-10 md:grid-cols-12">

          {/* Brand */}
          <div className="md:col-span-4 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group" aria-label="THOR — Accueil">
              <ThorMarkTile
                size={36}
                className="transition-transform duration-200 group-hover:scale-[1.04]"
              />
              <div className="leading-tight">
                <div className="text-sm font-semibold text-slate-900 tracking-tight">THOR</div>
                <div className="text-[11px] text-slate-500">L'écosystème logiciel des pros de santé</div>
              </div>
            </Link>

            <p className="text-sm leading-[1.7] text-slate-500 max-w-sm">
              Une plateforme commune, plusieurs métiers. Optique, audition, officine
              — et d'autres modules métier en cours de développement.
            </p>

            <div className="flex gap-2 flex-wrap pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Hébergement HDS
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Partenaire SESAM-Vitale
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Données en France
              </span>
            </div>
          </div>

          {/* Modules */}
          <div className="md:col-span-2 space-y-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Modules</div>
            <ul className="space-y-2.5">
              {[
                { href: "/clair-vision",   label: "Clair Vision",   hint: "Optique" },
                { href: "/clair-audition", label: "Clair Audition", hint: "Audition" },
                { href: "https://pharmapinvertagenda.vercel.app/", label: "PharmaPlanning", hint: "Officine", external: true },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    target={l.external ? "_blank" : undefined}
                    rel={l.external ? "noopener noreferrer" : undefined}
                    className="group inline-flex flex-col text-sm text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    <span className="font-medium">{l.label}</span>
                    <span className="text-[11px] text-slate-500 group-hover:text-slate-700 transition-colors">{l.hint}</span>
                  </Link>
                </li>
              ))}
              <li>
                <span className="inline-flex flex-col text-sm">
                  <span className="font-medium text-slate-500">Nouveaux modules</span>
                  <span className="text-[11px] text-slate-500">En préparation</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Informations */}
          <div className="md:col-span-3 space-y-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Découvrir</div>
            <ul className="space-y-2.5">
              {[
                { href: "/studio",                       label: "THOR Studio" },
                { href: "/realisations",                 label: "Nos réalisations" },
                { href: "/demo",                         label: "Démonstration interactive" },
                { href: "/nos-centres",                  label: "Nos centres" },
                { href: "/contact?sujet=projet",         label: "Parler de votre projet" },
                { href: "/contact?sujet=support",        label: "Support technique" },
                { href: "/contact?sujet=partenariat",    label: "Partenariat / intégration" },
                { href: "/connexion/praticien",          label: "Connexion praticien" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-3 space-y-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Nous contacter</div>
            <div className="space-y-3 text-sm">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="flex items-start gap-2.5 text-slate-700 hover:text-slate-900 transition-colors group"
              >
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-500 group-hover:text-slate-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-10 5L2 7" />
                </svg>
                <span className="break-all">{CONTACT_EMAIL}</span>
              </a>
              <a
                href={`tel:${CONTACT_PHONE_TEL}`}
                className="flex items-center gap-2.5 text-slate-700 hover:text-slate-900 transition-colors group"
              >
                <svg className="w-4 h-4 flex-shrink-0 text-slate-500 group-hover:text-slate-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
                </svg>
                <span className="tabular-nums">{CONTACT_PHONE_DISPLAY}</span>
              </a>

              <Link
                href="/contact?sujet=projet"
                className="inline-flex items-center gap-2 mt-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
              >
                Parler de votre projet
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200">
          <p className="text-xs text-slate-500">
            © {year} THOR — Conçu en France
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
            {[
              { href: "/confidentialite",  label: "Confidentialité" },
              { href: "/mentions-legales", label: "Mentions légales" },
              { href: "/cookies",          label: "Cookies" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-slate-900 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
