import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { EyeIcon, EarIcon, LensIcon, HearingAidIcon } from "@/components/ui/service-icons";

type Tone = "optique" | "audio";

type Service = {
  tone: Tone;
  label: string;
  title: string;
  desc: string;
  href: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const services: Service[] = [
  {
    tone: "optique",
    label: "Clair Vision",
    title: "Examen de vue",
    desc: "Bilan complet de votre vision avec équipements de dernière génération.",
    href: "/rendez-vous",
    Icon: EyeIcon,
  },
  {
    tone: "optique",
    label: "Clair Vision",
    title: "Adaptation lentilles",
    desc: "Accompagnement personnalisé pour trouver vos lentilles idéales.",
    href: "/rendez-vous",
    Icon: LensIcon,
  },
  {
    tone: "audio",
    label: "Clair Audition",
    title: "Test auditif",
    desc: "Évaluation précise de votre audition dans notre cabine insonorisée.",
    href: "/rendez-vous",
    Icon: EarIcon,
  },
  {
    tone: "audio",
    label: "Clair Audition",
    title: "Appareillage auditif",
    desc: "Solutions discrètes et performantes adaptées à votre mode de vie.",
    href: "/rendez-vous",
    Icon: HearingAidIcon,
  },
];

export function Expertises() {
  return (
    <section id="services" className="py-20 md:py-24 bg-[#f8fafc]">
      <div className="mx-auto max-w-[1240px] px-6">

        <Reveal>
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-500 mb-4">
              Nos expertises
            </span>
            <h2 className="text-2xl md:text-3xl font-light tracking-tight text-slate-800 h-title">
              Du diagnostic au suivi, <span className="font-semibold">on vous accompagne</span>
            </h2>
            <p className="mt-2 text-slate-500 max-w-xl mx-auto text-sm leading-[1.7]">
              Une expérience premium en optique et en audition — au sein du même réseau.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {services.map((s, idx) => {
            const isVision = s.tone === "optique";
            return (
              <Reveal key={s.title} delay={100 + idx * 70}>
                <div
                  className={`
                    group h-full rounded-[var(--radius-large)]
                    shadow-[var(--shadow-soft)]
                    transition-all duration-200
                    hover:-translate-y-1
                    flex flex-col p-6
                    ${isVision
                      ? "hover:shadow-[0_8px_32px_rgba(45,140,255,0.12)]"
                      : "hover:shadow-[0_8px_32px_rgba(0,201,138,0.12)]"
                    }
                  `}
                  style={{
                    background: "var(--glass-bg)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: isVision
                      ? "1px solid rgba(191,219,254,0.80)"
                      : "1px solid rgba(167,243,208,0.80)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Icône */}
                  <div className={`
                    h-12 w-12 rounded-[var(--radius-soft)] flex items-center justify-center
                    ${isVision
                      ? "bg-[#EFF6FF] text-[#2D8CFF]"
                      : "bg-[#ECFDF5] text-[#00C98A]"
                    }
                  `}>
                    <s.Icon className="h-5 w-5" />
                  </div>

                  {/* Badge marque */}
                  <div className={`
                    mt-4 inline-flex items-center self-start rounded-[var(--radius-pill)] px-2.5 py-0.5 text-[11px] font-medium ring-1
                    ${isVision
                      ? "bg-[#EFF6FF] text-[#2D8CFF] ring-[#BFDBFE]"
                      : "bg-[#ECFDF5] text-[#00C98A] ring-[#A7F3D0]"
                    }
                  `}>
                    {s.label}
                  </div>

                  <div className="mt-3 text-base font-semibold text-slate-800 leading-snug">
                    {s.title}
                  </div>

                  <p className="mt-2 text-sm text-slate-500 leading-[1.7] flex-1">
                    {s.desc}
                  </p>

                  <Link
                    href={s.href}
                    className={`
                      mt-5 inline-flex items-center gap-1.5 text-sm font-medium
                      transition-colors duration-200
                      ${isVision ? "text-[#2D8CFF] hover:text-[#1A72E8]" : "text-[#00C98A] hover:text-[#00A872]"}
                    `}
                  >
                    Prendre rendez-vous
                    <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Expertises;
