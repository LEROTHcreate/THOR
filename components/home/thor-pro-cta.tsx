import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";

export function ThorProCTA() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[var(--radius-large)] bg-slate-900 px-8 py-16 md:px-16 text-center shadow-[0_24px_60px_rgba(11,18,32,0.22)]">

            {/* Halos */}
            <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(45,140,255,0.15)" }} />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(0,201,138,0.15)" }} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.06),transparent_60%)]" />

            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/80 mb-5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Pour les professionnels de santé
              </span>

              <h2 className="text-3xl md:text-4xl font-light tracking-tight text-white h-title">
                Accédez à <span className="font-semibold">votre plateforme.</span>
              </h2>

              <p className="mt-4 text-white/70 max-w-lg mx-auto text-sm leading-[1.7]">
                Rejoignez les opticiens et audioprothésistes qui utilisent THOR
                au quotidien pour leur cabinet.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/connexion/praticien?module=vision"
                  className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] px-6 py-3 text-sm font-semibold transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: "#2D8CFF",
                    color: "white",
                    boxShadow: "0 4px 20px rgba(45,140,255,0.40)",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                  Accès Clair Vision
                </Link>

                <Link
                  href="/connexion/praticien?module=audition"
                  className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] px-6 py-3 text-sm font-semibold transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: "#00C98A",
                    color: "white",
                    boxShadow: "0 4px 20px rgba(0,201,138,0.40)",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                  Accès Clair Audition
                </Link>
              </div>

              <Link
                href="/contact"
                className="inline-block mt-6 text-xs text-white/60 hover:text-white/90 transition-colors"
              >
                Pas encore client ? Contacter l'équipe THOR →
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
