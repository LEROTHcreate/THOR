import React from "react";
import Link from "next/link";

const ACCENT = "#00C98A";

const glass = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--glass-border)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
} as React.CSSProperties;

const glassSubtle = {
  background: "var(--glass-subtle-bg)",
  border: "1px solid var(--glass-subtle-border)",
} as React.CSSProperties;

function IconLocation() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path d="M12 12.2a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12.2Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.5 20.2c1.7-4 13.3-4 15 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

const VISITED_CENTRES = [
  {
    id: 1,
    name: "Clair Audition Marseille Prado",
    address: "156 Avenue du Prado, 13008 Marseille",
    phone: "04 91 23 45 67",
    practitioners: ["M. Rami Benali", "Mme. Leila Amara"],
    lastVisit: "08 Jan 2026",
  },
  {
    id: 2,
    name: "Clair Audition Marseille Vieux-Port",
    address: "7 Quai du Port, 13002 Marseille",
    phone: "04 91 56 78 90",
    practitioners: ["M. Rami Benali", "Dr. Claire Petit"],
    lastVisit: "14 Sep 2025",
  },
];

const OTHER_CENTRES = [
  {
    id: 3,
    name: "Clair Audition Aix",
    address: "28 Cours Mirabeau, 13100 Aix-en-Provence",
    phone: "04 42 11 22 33",
  },
  {
    id: 4,
    name: "Clair Audition Toulon",
    address: "45 Rue Anatole France, 83000 Toulon",
    phone: "04 94 34 56 78",
  },
  {
    id: 5,
    name: "Clair Audition Avignon",
    address: "12 Rue de la République, 84000 Avignon",
    phone: "04 90 12 34 56",
  },
];

export default function CentresAuditionPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mes centres Clair Audition</h1>
        <p className="mt-1 text-sm text-slate-500">Retrouvez vos centres habituels et découvrez les centres à proximité</p>
      </div>

      {/* Visited centres */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-700">Centres visités</h2>
        <div className="grid gap-5 lg:grid-cols-2">
          {VISITED_CENTRES.map((centre) => (
            <div key={centre.id} className="rounded-2xl p-5" style={glass}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl text-white shadow-[0_4px_16px_rgba(0,201,138,0.28)]"
                    style={{ background: ACCENT }}
                  >
                    <IconLocation />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">{centre.name}</h3>
                </div>
                <span
                  className="flex-shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ background: "rgba(0,201,138,0.09)", color: ACCENT }}
                >
                  <IconCalendar />
                  {centre.lastVisit}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-0.5 flex-shrink-0" style={{ color: ACCENT }}><IconLocation /></span>
                  {centre.address}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span style={{ color: ACCENT }}><IconPhone /></span>
                  {centre.phone}
                </div>
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-0.5 flex-shrink-0" style={{ color: ACCENT }}><IconUser /></span>
                  <div className="flex flex-wrap gap-1">
                    {centre.practitioners.map((p) => (
                      <span key={p} className="rounded-full px-2 py-0.5 text-xs font-medium text-slate-600"
                            style={glassSubtle}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3" style={{ borderTop: "1px solid var(--glass-sep)" }}>
                <Link
                  href="/clair-audition/espace-patient/rendez-vous"
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(0,201,138,0.28)] transition-all hover:shadow-[0_6px_20px_rgba(0,201,138,0.38)]"
                  style={{ background: ACCENT }}
                >
                  <IconCalendar />
                  Prendre RDV
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Other nearby centres */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-700">Autres centres près de vous</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {OTHER_CENTRES.map((centre) => (
            <div key={centre.id} className="rounded-2xl p-4" style={glass}>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-white"
                  style={{ background: ACCENT }}
                >
                  <IconLocation />
                </div>
                <h3 className="text-sm font-bold text-slate-800">{centre.name}</h3>
              </div>
              <div className="space-y-1.5 mb-4">
                <div className="flex items-start gap-2 text-xs text-slate-500">
                  <span className="mt-0.5 flex-shrink-0" style={{ color: ACCENT }}><IconLocation /></span>
                  {centre.address}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span style={{ color: ACCENT }}><IconPhone /></span>
                  {centre.phone}
                </div>
              </div>
              <Link
                href="/clair-audition/espace-patient/rendez-vous"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                style={{ ...glassSubtle, color: ACCENT }}
              >
                <IconCalendar />
                Prendre RDV
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
