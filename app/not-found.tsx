import Link from "next/link";
import type { SVGProps } from "react";

function IconArrow(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" {...props}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export default function NotFound() {
  return (
    <section
      className="relative overflow-hidden flex items-center justify-center"
      style={{ minHeight: "calc(100vh - 5rem)" }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "linear-gradient(145deg, #f8fafc 0%, #f0f5ff 40%, #f8fcfa 100%)" }}
      />

      {/* Animated orbs */}
      <div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none -z-10"
        style={{ background: "rgba(45,140,255,0.07)", animation: "orbDrift 20s ease-in-out infinite" }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none -z-10"
        style={{ background: "rgba(0,201,138,0.06)", animation: "orbDrift 25s ease-in-out infinite reverse" }}
      />

      <div className="relative z-10 text-center px-6 max-w-xl mx-auto">

        {/* 404 number */}
        <div
          className="text-7xl md:text-[9rem] font-bold leading-none h-title mb-2 select-none"
          style={{
            background: "linear-gradient(135deg, #2D8CFF 0%, #0EA5E9 45%, #00C090 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </div>

        {/* Glass card */}
        <div
          className="rounded-3xl px-8 py-8 mb-8"
          style={{
            background: "var(--glass-strong-bg)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--glass-strong-border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.07)",
          }}
        >
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-1.5 text-xs font-medium text-slate-500 backdrop-blur-sm mb-5"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D8CFF] inline-block" />
            Page introuvable
          </div>

          <h1 className="text-2xl font-bold text-slate-900 h-title mb-3">
            Cette page n'existe pas
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            La page que vous recherchez a peut-être été déplacée, supprimée, ou n'a jamais existé. Retournez à l'accueil ou explorez nos espaces.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: "#2D8CFF",
              boxShadow: "0 4px 20px rgba(45,140,255,0.30)",
            }}
          >
            Retour à l'accueil
            <IconArrow className="w-4 h-4" />
          </Link>
          <Link
            href="/connexion"
            className="inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition-all duration-200 hover:ring-slate-300 hover:shadow-sm"
            style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)" }}
          >
            Se connecter
          </Link>
        </div>

        {/* Quick links */}
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          {[
            { href: "/clair-vision",   label: "Clair Vision",   color: "#2D8CFF", bg: "rgba(45,140,255,0.08)",   border: "rgba(45,140,255,0.18)" },
            { href: "/clair-audition", label: "Clair Audition", color: "#00C090", bg: "rgba(0,192,144,0.08)",    border: "rgba(0,192,144,0.18)" },
            { href: "/rendez-vous",    label: "Rendez-vous",    color: "#64748B", bg: "rgba(100,116,139,0.07)",  border: "rgba(100,116,139,0.15)" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 hover:scale-[1.03]"
              style={{ background: l.bg, border: `1px solid ${l.border}`, color: l.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: l.color }} />
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
