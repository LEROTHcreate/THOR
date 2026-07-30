import Link from "next/link";
import type { SVGProps } from "react";

function IconUser(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
    </svg>
  );
}

function IconBriefcase(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" {...props}>
      <path d="M9 6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2H9V6Z" />
      <path d="M6 8h12a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3Z" />
      <path d="M3 13h18" />
    </svg>
  );
}

function IconArrow(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" {...props}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

const patientFeatures: { label: string }[] = [
  { label: "Examens de vue & bilans auditifs" },
  { label: "Ordonnances et documents" },
  { label: "Prise de rendez-vous en ligne" },
  { label: "Messagerie avec votre praticien" },
  { label: "Suivi lentilles & appareils" },
];

const praticienFeatures: { label: string }[] = [
  { label: "Dossiers patients centralisés" },
  { label: "Agenda et planification" },
  { label: "Ordonnances numériques" },
  { label: "Bilans & comptes-rendus" },
  { label: "Accès Clair Vision & Audition" },
];

export default function ConnexionPage() {
  return (
    <section
      className="relative overflow-hidden flex items-center"
      style={{ minHeight: "calc(100vh - 5rem)" }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "linear-gradient(145deg, #f8fafc 0%, #f0f5ff 40%, #f8fcfa 100%)" }}
      />

      {/* Orbs animés */}
      <div
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none -z-10"
        style={{ background: "rgba(45,140,255,0.07)", animation: "orbDrift 20s ease-in-out infinite" }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none -z-10"
        style={{ background: "rgba(0,200,154,0.06)", animation: "orbDrift 25s ease-in-out infinite reverse" }}
      />

      <div className="relative w-full px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-1.5 text-xs font-medium text-slate-500 backdrop-blur-sm mb-5"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D8CFF] inline-block" />
            Portail THOR
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 h-title">
            Bienvenue sur{" "}<span
              style={{
                background: "linear-gradient(135deg, #2D8CFF, #00C090)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >THOR</span>
          </h1>
          <p className="mt-3 text-slate-500 text-base">
            Choisissez votre profil pour accéder à votre espace.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1100px] mx-auto">

          {/* ── Card Patient ── */}
          <Link
            href="/connexion/patient"
            className="group relative overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(45,140,255,0.15)]"
            style={{
              background: "var(--glass-nav-bg)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid var(--glass-strong-border)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.07)",
            }}
          >
            {/* Halo hover */}
            <div
              className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: "rgba(45,140,255,0.10)" }}
            />

            {/* Accent bar top */}
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #2D8CFF, #0EA5E9, #00C98A)" }} />

            {/* Header gradient */}
            <div
              className="relative px-8 pt-7 pb-6"
              style={{ background: "linear-gradient(135deg, rgba(239,246,255,0.90) 0%, rgba(224,242,254,0.70) 50%, rgba(236,253,245,0.60) 100%)" }}
            >
              {/* Brand pills */}
              <div className="flex gap-2 mb-5">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ background: "rgba(45,140,255,0.10)", color: "#2D8CFF", border: "1px solid rgba(45,140,255,0.18)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2D8CFF]" />
                  Clair Vision
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ background: "rgba(0,195,148,0.10)", color: "#00A876", border: "1px solid rgba(0,195,148,0.20)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00C090]" />
                  Clair Audition
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#2D8CFF", boxShadow: "0 4px 16px rgba(45,140,255,0.30)" }}
                >
                  <IconUser className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-slate-900 h-title">Espace Patient</div>
                  <div className="text-sm text-slate-500 mt-0.5">Votre santé, à portée de main</div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-8 py-6">
              <ul className="space-y-2.5 mb-7">
                {patientFeatures.map((f) => (
                  <li key={f.label} className="flex items-center gap-3 text-sm text-slate-600">
                    {f.label}
                  </li>
                ))}
              </ul>

              <div
                className="flex items-center justify-between rounded-2xl px-5 py-3.5 text-sm font-semibold text-white transition-all duration-200 group-hover:shadow-[0_8px_24px_rgba(45,140,255,0.35)]"
                style={{ background: "#2D8CFF", boxShadow: "0 4px 16px rgba(45,140,255,0.25)" }}
              >
                Accéder à mon espace
                <IconArrow className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>

          {/* ── Card Praticien ── */}
          <Link
            href="/connexion/praticien"
            className="group relative overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(11,18,32,0.20)]"
            style={{
              background: "var(--glass-nav-bg)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid var(--glass-strong-border)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.07)",
            }}
          >
            {/* Halo hover */}
            <div
              className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: "rgba(11,18,32,0.08)" }}
            />

            {/* Accent bar top — gradient dark */}
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #0B1220, #1E40AF, #0B1220)" }} />

            {/* Header — dark */}
            <div
              className="relative px-8 pt-7 pb-6"
              style={{ background: "linear-gradient(135deg, #0B1220 0%, #0F1E35 50%, #111827 100%)" }}
            >
              {/* Orb dans le header */}
              <div
                className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none"
                style={{ background: "rgba(45,140,255,0.12)" }}
              />
              <div
                className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl pointer-events-none"
                style={{ background: "rgba(0,195,148,0.08)" }}
              />

              <div className="relative flex gap-2 mb-5">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ background: "rgba(45,140,255,0.15)", color: "#7DC4FF", border: "1px solid rgba(45,140,255,0.25)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7DC4FF]" />
                  Optique
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ background: "rgba(0,195,148,0.12)", color: "#5DD9B8", border: "1px solid rgba(0,195,148,0.22)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5DD9B8]" />
                  Audiologie
                </span>
                <span
                  className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  PRO
                </span>
              </div>

              <div className="relative flex items-center gap-4">
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 4px 16px rgba(0,0,0,0.20)" }}
                >
                  <IconBriefcase className="h-6 w-6 text-white/90" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white h-title">Espace Praticien</div>
                  <div className="text-sm text-white/50 mt-0.5">Votre activité professionnelle</div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-8 py-6">
              <ul className="space-y-2.5 mb-7">
                {praticienFeatures.map((f) => (
                  <li key={f.label} className="flex items-center gap-3 text-sm text-slate-600">
                    {f.label}
                  </li>
                ))}
              </ul>

              <div
                className="flex items-center justify-between rounded-2xl px-5 py-3.5 text-sm font-semibold text-white transition-all duration-200 group-hover:shadow-[0_8px_24px_rgba(11,18,32,0.28)]"
                style={{ background: "linear-gradient(135deg, #0B1220, #1E2A3A)", boxShadow: "0 4px 16px rgba(11,18,32,0.18)" }}
              >
                Accéder à mon espace
                <IconArrow className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-slate-400">
            Pas encore de compte ?{" "}
            <Link
              href="/connexion/patient?mode=signup"
              className="font-semibold text-[#2D8CFF] hover:text-[#1A72E8] transition-colors"
            >
              Créer un compte patient
            </Link>
          </p>
          <p className="text-xs text-slate-300">
            Vous êtes praticien et souhaitez découvrir THOR ?{" "}
            <Link href="/demo" className="font-medium text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2">
              Faire le tour de l’outil
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
