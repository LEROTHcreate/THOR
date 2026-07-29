import React from "react";

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

function IconTag() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="7" y1="7" x2="7.01" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
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

function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

const NEWS = [
  {
    id: 1,
    title: "Phonak Audéo Slim — L'ultra-mince nouvelle génération",
    description:
      "Le Phonak Audéo Slim est désormais disponible dans nos centres. Design ultra-discret contour d'oreille, hautes performances sonores et connectivité Bluetooth intégrée.",
    date: "10 Mar 2026",
    category: "Nouveauté",
  },
  {
    id: 2,
    title: "Station de recharge améliorée — Mise à jour disponible",
    description:
      "Mise à jour gratuite de vos stations de recharge Phonak pour les modèles 2024 et 2025. Durée de charge réduite à 3h pour une autonomie complète de 24h.",
    date: "01 Mar 2026",
    category: "Mise à jour",
  },
  {
    id: 3,
    title: "Centre Clair Audition Marseille Prado — Horaires étendus",
    description:
      "Notre centre phare ouvre désormais le samedi jusqu&apos;à 18h et propose des consultations tardives le jeudi jusqu&apos;à 19h30.",
    date: "18 Fév 2026",
    category: "Service",
  },
];

const EVENTS = [
  {
    id: 1,
    title: "Journée nationale de l'audition",
    description: "Dépistage auditif gratuit, sans rendez-vous, dans tous nos centres participants. Tests audiométriques réalisés par nos audioprothésistes.",
    date: "Jeudi 10 Avr 2026",
    time: "09h00 – 18h00",
  },
  {
    id: 2,
    title: "Atelier réglage Bluetooth",
    description: "Maîtrisez le couplage de vos appareils auditifs avec votre smartphone. Séance en petit groupe animée par M. Rami Benali.",
    date: "Mardi 22 Avr 2026",
    time: "15h00 – 17h00",
  },
];

export default function ActualitesAuditionPage() {
  const loyaltyPoints = 280;
  const loyaltyMax = 500;
  const loyaltyPct = Math.round((loyaltyPoints / loyaltyMax) * 100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Actualités</h1>
        <p className="mt-1 text-sm text-slate-500">Offres, nouveautés et événements Clair Audition</p>
      </div>

      {/* Hero promo */}
      <div
        className="relative overflow-hidden rounded-2xl p-7"
        style={{
          background: "linear-gradient(135deg, #00A574 0%, #00C98A 55%, #06d6a0 100%)",
          boxShadow: "0 12px 40px rgba(0,201,138,0.28)",
        }}
      >
        <div
          className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full"
          style={{ background: "rgba(255,255,255,0.08)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full"
          style={{ background: "rgba(255,255,255,0.05)" }}
        />

        <div className="relative">
          <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-green-100"
                style={{ background: "rgba(255,255,255,0.18)" }}>
            Remboursement intégral
          </span>
          <h2 className="mt-3 text-2xl font-bold text-white">
            Remboursement 100%
          </h2>
          <p className="mt-1 text-lg font-semibold text-green-100">
            Phonak Lumity pris en charge par votre mutuelle
          </p>
          <p className="mt-2 text-sm text-green-200">
            Dans le cadre du 100% Santé, les appareils de classe I sont entièrement remboursés. Nos audioprothésistes vous accompagnent dans les démarches.
          </p>
          <button
            className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-emerald-700 transition-all hover:shadow-lg"
            style={{ background: "var(--glass-card-bg)" }}
          >
            En savoir plus
            <IconArrow />
          </button>
        </div>
      </div>

      {/* News grid */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-700">Dernières nouvelles</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NEWS.map((item) => (
            <div key={item.id} className="flex flex-col rounded-2xl p-5" style={glass}>
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{ background: "rgba(0,201,138,0.10)", color: ACCENT }}
                >
                  <IconTag />
                  {item.category}
                </span>
                <span className="ml-auto text-xs text-slate-500">{item.date}</span>
              </div>
              <h3 className="mb-2 text-sm font-bold text-slate-800">{item.title}</h3>
              <p className="flex-1 text-xs text-slate-500 leading-relaxed">{item.description}</p>
              <button
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold transition-all"
                style={{ color: ACCENT }}
              >
                Lire la suite
                <IconArrow />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Loyalty */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-700">Mes avantages fidélité</h2>
        <div className="rounded-2xl p-5" style={glass}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: ACCENT }}><IconStar /></span>
                <span className="text-sm font-bold text-slate-800">Programme Entendre Mieux</span>
              </div>
              <p className="text-xs text-slate-500">Cumulez des points à chaque visite et contrôle</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold" style={{ color: ACCENT }}>{loyaltyPoints}</span>
              <span className="text-sm text-slate-500"> / {loyaltyMax} pts</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="rounded-full h-2.5 overflow-hidden mb-2" style={glassSubtle}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${loyaltyPct}%`,
                background: `linear-gradient(90deg, ${ACCENT}, #00A574)`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mb-4">
            <span>{loyaltyPoints} points</span>
            <span>{loyaltyMax - loyaltyPoints} points restants</span>
          </div>

          <div className="rounded-xl p-3 flex items-center gap-3" style={glassSubtle}>
            <div
              className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-white"
              style={{ background: ACCENT }}
            >
              <IconTag />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700">Prochaine récompense</div>
              <div className="text-xs text-slate-500 mt-0.5">Réglage gratuit et bilan de suivi offert à 500 points</div>
            </div>
          </div>
        </div>
      </section>

      {/* Events */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-700">Rendez-vous événements</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {EVENTS.map((event) => (
            <div key={event.id} className="rounded-2xl p-5" style={glass}>
              <div className="flex items-start gap-4">
                <div
                  className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl text-white shadow-[0_4px_16px_rgba(0,201,138,0.28)]"
                  style={{ background: ACCENT }}
                >
                  <IconCalendar />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{event.title}</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">{event.description}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <IconCalendar />
                      {event.date}
                    </span>
                    <span>{event.time}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--glass-sep)" }}>
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                  style={{ ...glassSubtle, color: ACCENT }}
                >
                  <IconUsers />
                  Je m&apos;inscris
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
