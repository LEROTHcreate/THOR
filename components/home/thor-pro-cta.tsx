import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";

const CONTACT_EMAIL = "contact.thor.pro@gmail.com";
const CONTACT_PHONE_DISPLAY = "07 69 46 24 46";
const CONTACT_PHONE_TEL = "+33769462446";

function MailIcon() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2.5" />
      <path d="m22 7-10 5L2 7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

const CANAUX = [
  { href: `mailto:${CONTACT_EMAIL}`, label: "Par e-mail", value: CONTACT_EMAIL, icon: <MailIcon /> },
  { href: `tel:${CONTACT_PHONE_TEL}`, label: "Par téléphone", value: CONTACT_PHONE_DISPLAY, icon: <PhoneIcon /> },
];

export function ThorProCTA() {
  return (
    <section className="relative pb-28 sm:pb-40">
      <div className="mx-auto max-w-[900px] px-5 sm:px-6">
        <Reveal>
          <div className="text-center">
            <h2 className="h-title mx-auto max-w-xl text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 leading-[1.05]">
              Parlons de votre projet.
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-lg text-slate-500 leading-[1.6]">
              Décrivez votre activité en quelques lignes. On revient vers vous
              rapidement, et le premier échange ne coûte rien.
            </p>

            <div className="mt-10">
              <Link href="/contact" className="lg lg-btn lg-btn-ink">
                <span>Prendre contact</span>
              </Link>
            </div>

            <div className="mt-14 grid sm:grid-cols-2 gap-4">
              {CANAUX.map((c) => (
                <a
                  key={c.href}
                  href={c.href}
                  className="lg lg-card group flex items-center gap-4 p-5 text-left"
                >
                  <span className="grid place-items-center w-11 h-11 rounded-2xl bg-slate-900/[0.04] text-slate-500 shrink-0">
                    {c.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] text-slate-500">{c.label}</span>
                    <span className="block text-[15px] font-medium text-slate-900 truncate">
                      {c.value}
                    </span>
                  </span>
                  <svg className="w-4 h-4 text-slate-300 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
