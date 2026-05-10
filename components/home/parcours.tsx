"use client";

import { useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { EyeIcon, EarIcon, LensIcon, HearingAidIcon } from "@/components/ui/service-icons";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type Card = {
  title: string;
  desc: string;
  duration: string;
  icon: React.ReactNode;
};

function Parcours() {
  const [tab, setTab] = useState<"optique" | "audio">("optique");

  const optique: Card[] = [
    {
      title: "Examen de vue",
      desc: "Bilan complet et recommandations personnalisées.",
      duration: "30 min",
      icon: <EyeIcon className="h-5 w-5" />,
    },
    {
      title: "Adaptation lentilles",
      desc: "Accompagnement personnalisé pour trouver vos lentilles idéales.",
      duration: "45 min",
      icon: <LensIcon className="h-5 w-5" />,
    },
  ];

  const audio: Card[] = [
    {
      title: "Test auditif",
      desc: "Évaluation et conseils pour votre confort auditif.",
      duration: "30 min",
      icon: <EarIcon className="h-5 w-5" />,
    },
    {
      title: "Appareillage auditif",
      desc: "Solutions et réglages pour un quotidien plus clair.",
      duration: "45 min",
      icon: <HearingAidIcon className="h-5 w-5" />,
    },
  ];

  const cards = tab === "optique" ? optique : audio;

  return (
    <section id="services" className="py-20 md:py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <Reveal>
          <h2 className="text-center text-2xl md:text-3xl font-semibold text-slate-800">
            Choisissez votre parcours
          </h2>
          <p className="mt-2 text-center text-slate-500">
            Optique ou audioprothèse, nos experts vous accompagnent à chaque étape.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center rounded-2xl bg-slate-100 p-1 ring-1 ring-slate-200">
              <button
                onClick={() => setTab("optique")}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                  tab === "optique"
                    ? "bg-[#2D8CFF] text-white shadow-[0_2px_10px_rgba(45,140,255,0.30)]"
                    : "text-slate-500 hover:text-[#2D8CFF]"
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <EyeIcon className="h-4 w-4" />
                  Optique
                </span>
              </button>

              <button
                onClick={() => setTab("audio")}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                  tab === "audio"
                    ? "bg-[#00C98A] text-white shadow-[0_2px_10px_rgba(0,201,138,0.30)]"
                    : "text-slate-500 hover:text-[#00C98A]"
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <EarIcon className="h-4 w-4" />
                  Audio
                </span>
              </button>
            </div>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {cards.map((c, idx) => (
            <Reveal key={c.title} delay={140 + idx * 80}>
              <div
                className="rounded-3xl shadow-[0_18px_50px_-35px_rgba(0,0,0,0.25)] p-7"
                style={{
                  background: "var(--glass-bg)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid var(--glass-border)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
                }}
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "h-11 w-11 rounded-2xl flex items-center justify-center",
                      tab === "optique"
                        ? "bg-[#EFF6FF] text-[#2D8CFF] ring-1 ring-[#BFDBFE]"
                        : "bg-[#ECFDF5] text-[#00C98A] ring-1 ring-[#A7F3D0]"
                    )}>
                      {c.icon}
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold text-slate-800">
                        {c.title}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {c.desc}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-slate-500">
                    {c.duration}
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    href="/rendez-vous"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
                  >
                    Prendre rendez-vous <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Parcours;
export { Parcours };
