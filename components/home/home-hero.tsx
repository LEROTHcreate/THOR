import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";

function DashboardMockup() {
  return (
    <div
      className="relative w-full"
      aria-hidden="true"
      style={{ animation: "floatY 6s ease-in-out infinite" }}
    >
      {/* Glow halo derrière le mockup */}
      <div
        className="absolute inset-0 -z-10 rounded-3xl blur-3xl"
        style={{
          background: "linear-gradient(135deg, rgba(45,140,255,0.18) 0%, rgba(0,201,138,0.12) 100%)",
          transform: "scale(0.95) translateY(20px)",
        }}
      />

      {/* Browser chrome */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.96)",
          border: "1px solid rgba(255,255,255,0.90)",
          boxShadow: "0 32px 80px rgba(11,18,32,0.18), 0 0 0 1px rgba(226,232,240,0.40)",
        }}
      >
        {/* Browser bar */}
        <div
          className="flex items-center gap-2 px-4 py-3 border-b border-slate-100"
          style={{ background: "rgba(248,250,252,0.99)" }}
        >
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-300" />
            <div className="w-3 h-3 rounded-full bg-amber-300" />
            <div className="w-3 h-3 rounded-full bg-green-300" />
          </div>
          <div
            className="flex-1 mx-3 h-6 rounded-full flex items-center px-3"
            style={{ background: "rgba(241,245,249,0.90)", border: "1px solid rgba(226,232,240,0.60)" }}
          >
            <span className="text-[10px] text-slate-400 truncate">thor.fr/clair-vision/espace-patient</span>
          </div>
        </div>

        {/* App content */}
        <div className="flex" style={{ height: 360 }}>
          {/* Sidebar */}
          <div
            className="w-44 shrink-0 flex flex-col p-3 gap-0.5 border-r border-slate-100"
            style={{ background: "rgba(248,250,252,0.99)" }}
          >
            <div className="flex items-center gap-2 px-2 py-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-[#2D8CFF] flex items-center justify-center">
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-white" fill="none">
                  <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="8" cy="8" r="1" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-700">Clair Vision</div>
                <div className="text-[7.5px] text-slate-400">Espace patient</div>
              </div>
            </div>

            {[
              { label: "Accueil",        active: true,  d: "M3 12l9-8 9 8v7a1 1 0 01-1 1H4a1 1 0 01-1-1z" },
              { label: "Examens de vue", active: false, d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6" },
              { label: "Lentilles",      active: false, d: "M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0" },
              { label: "Ordonnances",    active: false, d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" },
              { label: "Documents",      active: false, d: "M7 21h10a2 2 0 002-2V9l-5-5H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
              { label: "Messages",       active: false, d: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
              { label: "Rendez-vous",    active: false, d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
              { label: "Mes centres",    active: false, d: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[9.5px] font-medium"
                style={item.active ? {
                  background: "#2D8CFF",
                  color: "white",
                } : { color: "#94A3B8" }}
              >
                <svg viewBox="0 0 24 24" className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.d}/>
                </svg>
                {item.label}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-3 overflow-hidden" style={{ background: "#f8fafc" }}>
            {/* Header row */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-[11px] font-bold text-slate-800">Bonjour, Marie</div>
                <div className="text-[8px] text-slate-400">Tableau de bord santé visuelle · Mis à jour aujourd'hui</div>
              </div>
              <div className="flex items-center gap-1 bg-[#EFF6FF] rounded-full px-2 py-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2D8CFF] animate-pulse" />
                <span className="text-[7.5px] text-[#2D8CFF] font-semibold">Ordonnance valide</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-1.5 mb-2.5">
              {[
                { label: "PROCHAIN RDV", value: "15 jan.", sub: "10:30 · Paris 8" },
                { label: "DERNIER EXAMEN", value: "Nov. 2024", sub: "Il y a 2 mois" },
                { label: "ORDONNANCES", value: "2 actives", sub: "Valides · 2027", accent: true },
                { label: "DOCUMENTS", value: "5 fichiers", sub: "1 verrouillé" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-2" style={{ background: "var(--glass-card-bg)", border: "1px solid rgba(226,232,240,0.55)" }}>
                  <div className="text-[6.5px] text-slate-400 mb-0.5">{s.label}</div>
                  <div className={`text-[9px] font-bold ${s.accent ? "text-[#2D8CFF]" : "text-slate-800"}`}>{s.value}</div>
                  <div className="text-[6.5px] text-slate-400">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-3 gap-1.5">
              <div className="col-span-2 space-y-1.5">
                {/* Exam card */}
                <div className="rounded-xl p-2.5" style={{ background: "var(--glass-card-bg)", border: "1px solid rgba(226,232,240,0.55)" }}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-[6.5px] font-semibold text-slate-400 uppercase tracking-wide">DERNIER EXAMEN DE VUE</div>
                    <div className="text-[6.5px] bg-[#EFF6FF] text-[#2D8CFF] px-1.5 py-0.5 rounded-full font-semibold">À jour</div>
                  </div>
                  <div className="text-[10px] font-bold text-slate-800 mb-0.5">15 novembre 2024</div>
                  <div className="text-[7px] text-slate-400 mb-1.5">Clair Vision – Paris 8 · Dr. Sophie Martin</div>
                  <div className="flex gap-5">
                    <div>
                      <div className="text-[7px] font-bold text-[#2D8CFF] mb-0.5">OD</div>
                      <div className="text-[7px] text-slate-600">Sph −1.75 · Cyl −0.50 · Axe 15°</div>
                    </div>
                    <div>
                      <div className="text-[7px] font-bold text-[#2D8CFF] mb-0.5">OG</div>
                      <div className="text-[7px] text-slate-600">Sph −1.25 · Cyl −0.25 · Axe 170°</div>
                    </div>
                  </div>
                </div>

                {/* RDV card */}
                <div className="rounded-xl p-2.5" style={{ background: "var(--glass-card-bg)", border: "1px solid rgba(226,232,240,0.55)" }}>
                  <div className="text-[6.5px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">PROCHAIN RENDEZ-VOUS</div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] flex flex-col items-center justify-center shrink-0">
                      <div className="text-[8px] font-bold text-[#2D8CFF] leading-none">15</div>
                      <div className="text-[6px] text-[#2D8CFF] leading-none">jan</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-semibold text-slate-800">10:30 · Paris 8</div>
                      <div className="text-[7px] text-slate-400">Dr. Sophie Martin — Optométriste</div>
                    </div>
                    <div className="ml-auto text-[6.5px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full shrink-0">Contrôle annuel</div>
                  </div>
                </div>
              </div>

              {/* Right col */}
              <div className="space-y-1.5">
                <div className="rounded-xl p-2.5" style={{ background: "var(--glass-card-bg)", border: "1px solid rgba(226,232,240,0.55)" }}>
                  <div className="text-[6.5px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">STATUT DOSSIER</div>
                  {[
                    { label: "Dernier examen", val: "15 nov. 2024", color: "#2D8CFF" },
                    { label: "Ordonnance", val: "Valide · 2027", color: "#2D8CFF" },
                    { label: "Suivi lentilles", val: "Actif", color: "#00C98A" },
                    { label: "Prochain contrôle", val: "15 jan. 2025", color: "#64748B" },
                  ].map((r) => (
                    <div key={r.label} className="flex justify-between items-center py-0.5 border-b border-slate-50 last:border-0">
                      <div className="text-[6.5px] text-slate-500">{r.label}</div>
                      <div className="text-[6.5px] font-semibold" style={{ color: r.color }}>{r.val}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl p-2.5" style={{ background: "var(--glass-card-bg)", border: "1px solid rgba(226,232,240,0.55)" }}>
                  <div className="text-[6.5px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">À FAIRE</div>
                  {[
                    { text: "Mettre à jour symptômes", done: false },
                    { text: "Planifier contrôle lentilles", done: false },
                    { text: "Consulter ordonnance", done: true },
                  ].map((t) => (
                    <div key={t.text} className="flex items-center gap-1.5 py-0.5">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 flex items-center justify-center ${t.done ? "bg-[#2D8CFF]" : "border border-slate-300"}`}>
                        {t.done && <svg viewBox="0 0 8 8" className="w-1.5 h-1.5" fill="none"><path d="M1.5 4L3 5.5 6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round"/></svg>}
                      </div>
                      <div className={`text-[6.5px] leading-tight ${t.done ? "text-slate-300 line-through" : "text-slate-600"}`}>{t.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating badge — praticien */}
      <div
        className="absolute -left-10 bottom-14 rounded-2xl px-3.5 py-2.5"
        style={{
          background: "var(--glass-card-bg)",
          border: "1px solid rgba(167,243,208,0.60)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 12px 32px rgba(0,201,138,0.14)",
          animation: "floatY 7s ease-in-out infinite 1s",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#ECFDF5] flex items-center justify-center">
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-[#00C98A]" fill="none">
              <path d="M2 4h12M4 4V3a1 1 0 011-1h6a1 1 0 011 1v1M13 4v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-800">Espace Praticien</div>
            <div className="text-[8px] text-[#00C98A] font-semibold">Clair Audition · Pro</div>
          </div>
        </div>
      </div>

      {/* Floating badge — RDV */}
      <div
        className="absolute -right-8 top-16 rounded-2xl px-3.5 py-2.5"
        style={{
          background: "var(--glass-card-bg)",
          border: "1px solid rgba(191,219,254,0.60)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 12px 32px rgba(45,140,255,0.12)",
          animation: "floatY 8s ease-in-out infinite 0.5s",
        }}
      >
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#2D8CFF] animate-pulse" />
          <div className="text-[10px] font-bold text-slate-700">RDV confirmé</div>
        </div>
        <div className="text-[8px] text-slate-400">15 jan. · Paris 8 · Dr. Sophie Martin</div>
      </div>
    </div>
  );
}

export default function HomeHero() {
  return (
    <section className="relative overflow-hidden flex items-center" style={{ minHeight: "calc(100vh - 5rem)" }}>
      {/* Background image */}
      <Image
        src="/images/hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover pointer-events-none select-none"
        style={{
          filter: "grayscale(100%) contrast(1.06) brightness(1.18)",
          opacity: 0.28,
        }}
      />

      {/* White veil */}
      <div className="absolute inset-0 bg-white/76" />

      {/* Gradient orbs animés */}
      <div
        className="absolute -top-60 -left-20 w-[900px] h-[900px] rounded-full blur-3xl pointer-events-none"
        style={{
          background: "rgba(45,140,255,0.07)",
          animation: "orbDrift 20s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -bottom-60 right-0 w-[800px] h-[800px] rounded-full blur-3xl pointer-events-none"
        style={{
          background: "rgba(0,201,138,0.06)",
          animation: "orbDrift 25s ease-in-out infinite reverse",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 py-16">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-14 xl:gap-20">

            {/* LEFT — texte (40%) */}
            <div className="w-full lg:w-[40%] shrink-0 text-center lg:text-left">

              <Reveal>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-xs font-medium text-slate-500 backdrop-blur-sm shadow-[0_2px_12px_rgba(0,0,0,0.05)] mb-6">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#2D8CFF] animate-pulse" />
                  Excellence en santé visuelle et auditive
                </div>
              </Reveal>

              <Reveal>
                <h1 className="text-5xl lg:text-6xl xl:text-[4.5rem] font-bold leading-[1.05] tracking-tight text-slate-900 h-title">
                  Voir et entendre
                  <br />
                  <span
                    style={{
                      background: "linear-gradient(135deg, #2D8CFF 0%, #0EA5E9 45%, #00C98A 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    avec clarté
                  </span>
                </h1>
              </Reveal>

              <Reveal>
                <p className="mt-5 text-base text-slate-500 leading-[1.75] max-w-md">
                  THOR réunit{" "}
                  <strong className="text-[#2D8CFF] font-semibold">Clair Vision</strong> en optique
                  et{" "}
                  <strong className="text-[#00C98A] font-semibold">Clair Audition</strong> en audiologie
                  — des espaces dédiés pour les patients et les praticiens.
                </p>
              </Reveal>

              <Reveal>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link
                    href="/rendez-vous"
                    className="inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02]"
                    style={{
                      background: "#2D8CFF",
                      boxShadow: "0 4px 20px rgba(45,140,255,0.32)",
                    }}
                  >
                    Prendre rendez-vous
                  </Link>
                  <Link
                    href="#espaces"
                    className="inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition-all duration-200 hover:ring-slate-300 hover:shadow-sm"
                    style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)" }}
                  >
                    Découvrir la plateforme →
                  </Link>
                </div>
              </Reveal>

              {/* Stats */}
              <Reveal>
                <div className="mt-10 flex flex-wrap gap-8 justify-center lg:justify-start">
                  {[
                    { value: "2",    label: "Marques santé" },
                    { value: "25+",  label: "Centres en France" },
                    { value: "98%",  label: "Patients satisfaits" },
                    { value: "48h",  label: "Délai moyen RDV" },
                  ].map((s, i) => (
                    <div key={s.label} className="text-center lg:text-left" style={{ animationDelay: `${i * 100}ms` }}>
                      <div className="text-2xl font-bold text-slate-900 h-title">{s.value}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{s.label}</div>
                    </div>
                  ))}
                </div>
              </Reveal>

              {/* Brand pills */}
              <Reveal>
                <div className="mt-7 flex gap-2.5 justify-center lg:justify-start">
                  <Link
                    href="/clair-vision"
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-[#2D8CFF] ring-1 ring-[#BFDBFE] bg-[#EFF6FF] hover:bg-[#DBEAFE] transition-colors duration-200"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2D8CFF]" />
                    Clair Vision
                  </Link>
                  <Link
                    href="/clair-audition"
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-[#00C98A] ring-1 ring-[#A7F3D0] bg-[#ECFDF5] hover:bg-[#D1FAE5] transition-colors duration-200"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00C98A]" />
                    Clair Audition
                  </Link>
                </div>
              </Reveal>
            </div>

            {/* RIGHT — mockup (60%) — desktop only */}
            <div className="hidden lg:block flex-1 min-w-0 pr-2">
              <Reveal>
                <DashboardMockup />
              </Reveal>
            </div>

            {/* MOBILE — simplified preview card */}
            <div className="lg:hidden w-full">
              <Reveal>
                <div
                  className="rounded-3xl p-6"
                  style={{
                    background: "rgba(255,255,255,0.78)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid var(--glass-strong-border)",
                    boxShadow: "0 8px 40px rgba(11,18,32,0.10)",
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="text-sm font-bold text-slate-800">Bonjour, Marie</div>
                      <div className="text-xs text-slate-400 mt-0.5">Tableau de bord THOR</div>
                    </div>
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "#2D8CFF" }}
                    >
                      MD
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-2.5 mb-4">
                    {[
                      { label: "Prochain RDV",   value: "15 jan.",   accent: "#2D8CFF" },
                      { label: "Ordonnances",     value: "2 actives", accent: "#2D8CFF" },
                      { label: "Dernier bilan",   value: "Nov. 2024", accent: "#00C090" },
                      { label: "Appareils actifs",value: "2 actifs",  accent: "#00C090" },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-2xl p-3"
                        style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(226,232,240,0.50)" }}
                      >
                        <div className="text-[10px] text-slate-400 mb-0.5">{s.label}</div>
                        <div className="text-sm font-semibold" style={{ color: s.accent }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Brand pills */}
                  <div className="flex gap-2">
                    <div
                      className="flex-1 rounded-2xl px-3 py-2 text-center text-xs font-semibold"
                      style={{ background: "rgba(45,140,255,0.08)", border: "1px solid rgba(45,140,255,0.16)", color: "#2D8CFF" }}
                    >
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#2D8CFF] mr-1.5" />
                      Clair Vision
                    </div>
                    <div
                      className="flex-1 rounded-2xl px-3 py-2 text-center text-xs font-semibold"
                      style={{ background: "rgba(0,192,144,0.08)", border: "1px solid rgba(0,192,144,0.16)", color: "#00A876" }}
                    >
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00C090] mr-1.5" />
                      Clair Audition
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
