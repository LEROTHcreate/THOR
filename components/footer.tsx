import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        background: "linear-gradient(145deg, #0B1220 0%, #0F1B2E 60%, #0B1220 100%)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="w-full px-8 lg:px-16 xl:px-24 py-14">
        <div className="grid gap-10 md:grid-cols-4">

          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group" aria-label="THOR — Accueil">
              <div
                className="relative h-9 w-9 rounded-xl overflow-hidden transition-transform duration-200 group-hover:scale-[1.04]"
                style={{
                  border: "1px solid rgba(255,255,255,0.15)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                }}
              >
                <Image
                  src="/images/logos/thor.png"
                  alt="THOR"
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-white tracking-tight">THOR</div>
                <div className="text-[11px]">
                  <span className="font-medium" style={{ color: "#60AAFF" }}>Clair Vision</span>
                  <span className="text-white/30">{" · "}</span>
                  <span className="font-medium" style={{ color: "#3DCBA8" }}>Clair Audition</span>
                </div>
              </div>
            </Link>

            <p className="text-sm leading-[1.7] text-white/45">
              Le logiciel certifié pour opticiens et audioprothésistes. Agenda, dossiers patients, devis normalisés, hébergement HDS — tout-en-un.
            </p>

            {/* Badges marques */}
            <div className="flex gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium"
                style={{ background: "rgba(45,140,255,0.12)", border: "1px solid rgba(45,140,255,0.25)", color: "#7DC4FF" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#7DC4FF]" />
                Clair Vision
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium"
                style={{ background: "rgba(0,193,148,0.10)", border: "1px solid rgba(0,193,148,0.22)", color: "#3DCBA8" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#3DCBA8]" />
                Clair Audition
              </span>
            </div>
          </div>

          {/* Modules */}
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30">Solutions</div>
            <ul className="space-y-2.5">
              {[
                { href: "/clair-vision",        label: "Optique — Clair Vision" },
                { href: "/clair-audition",      label: "Audition — Clair Audition" },
                { href: "/demo",                label: "Démonstration interactive" },
                { href: "/tarifs",              label: "Tarifs praticiens" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/45 transition-colors duration-200 hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Informations */}
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30">Praticiens</div>
            <ul className="space-y-2.5">
              {[
                { href: "/connexion/praticien", label: "Connexion praticien" },
                { href: "/contact?sujet=demo",  label: "Demander une démo" },
                { href: "/contact?sujet=support", label: "Support technique" },
                { href: "/contact?sujet=partenariat", label: "Partenariat / revendeur" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/45 hover:text-white transition-colors duration-200">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30">Déployer THOR</div>
            <div className="space-y-3 text-sm text-white/45">
              <div className="leading-relaxed">
                Discutons de votre cabinet — onboarding, certification SESAM-Vitale, migration de données, formation.
              </div>
              <a href="mailto:pro@thor.fr" className="block hover:text-white transition-colors duration-200">
                pro@thor.fr
              </a>
              <Link
                href="/contact?sujet=demo"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
                style={{ background: "#2D8CFF", boxShadow: "0 4px 16px rgba(45,140,255,0.22)" }}
              >
                Réserver une démo →
              </Link>
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div
          className="mt-10 mb-6 flex flex-wrap gap-4 items-center"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "24px" }}
        >
          {[
            { label: "Hébergement HDS certifié", dot: "#2D8CFF" },
            { label: "Partenaire GIE SESAM-Vitale", dot: "#00C98A" },
            { label: "100% Santé — Classe A", dot: "#059669" },
            { label: "Données hébergées en France", dot: "#A78BFA" },
          ].map((b) => (
            <div key={b.label} className="flex items-center gap-1.5 text-[11px] text-white/30">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: b.dot }} />
              {b.label}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/25">
            © {year} THOR — Made in Marseille
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/30">
            {[
              { href: "/confidentialite",  label: "Confidentialité" },
              { href: "/mentions-legales", label: "Mentions légales" },
              { href: "/cookies",          label: "Cookies" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white/70 transition-colors duration-200">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
