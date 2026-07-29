import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";

const CONTACT_EMAIL = "contact.thor.pro@gmail.com";
const CONTACT_PHONE_DISPLAY = "07 69 46 24 46";
const CONTACT_PHONE_TEL     = "+33769462446";

export function ThorProCTA() {
  return (
    <section className="relative py-14 sm:py-20 md:py-28">
      <div className="mx-auto max-w-[1100px] px-5 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[var(--radius-large)] bg-white px-6 py-10 sm:px-8 sm:py-14 md:px-14 md:py-16 border border-slate-200">

            <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
              {/* Texte */}
              <div>
                <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-500 mb-5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Écosystème en croissance
                </span>

                <h2 className="text-[26px] sm:text-3xl md:text-[40px] font-light tracking-tight text-slate-900 h-title leading-[1.1]">
                  Discutons de <span className="font-semibold">votre métier.</span>
                </h2>

                <p className="mt-5 text-slate-500 max-w-md text-[15px] leading-[1.7]">
                  Opticiens, audioprothésistes, pharmaciens — et bientôt d'autres
                  professionnels de santé. Décrivez votre cabinet, on revient vers vous
                  rapidement.
                </p>
              </div>

              {/* Cartes de contact */}
              <div className="space-y-3">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 hover:border-slate-300 hover:bg-slate-50 transition-colors group"
                >
                  <div className="grid place-items-center w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex-shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-10 5L2 7" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Par e-mail</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">{CONTACT_EMAIL}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-300 ml-auto group-hover:text-slate-500 transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </a>

                <a
                  href={`tel:${CONTACT_PHONE_TEL}`}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 hover:border-slate-300 hover:bg-slate-50 transition-colors group"
                >
                  <div className="grid place-items-center w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex-shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Par téléphone</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5 tabular-nums">{CONTACT_PHONE_DISPLAY}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-300 ml-auto group-hover:text-slate-500 transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </a>

                <Link
                  href="/contact"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white px-5 py-3.5 text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  Ou utiliser le formulaire
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

          </div>
        </Reveal>
      </div>
    </section>
  );
}
