"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const centres = [
  { name: "THOR — Marseille Prado",      address: "210A Rue Paradis, 13006 Marseille",      phone: "04 91 00 00 01" },
  { name: "THOR — Marseille Vieux-Port", address: "3 Quai du Port, 13002 Marseille",        phone: "04 91 00 00 02" },
  { name: "THOR — Aix-en-Provence",      address: "15 Cours Mirabeau, 13100 Aix",           phone: "04 42 00 00 03" },
  { name: "THOR — Paris 8",              address: "22 Rue du Faubourg Saint-Honoré, 75008", phone: "01 40 00 00 04" },
];

const SUJETS = [
  { value: "demo",       label: "Demander une démo",   tag: "Recommandé" },
  { value: "studio",     label: "Créer mon entreprise", tag: "Studio" },
  { value: "etude-marche", label: "Étude de marché",    tag: "" },
  { value: "tarifs",     label: "Information tarifs",   tag: "" },
  { value: "support",    label: "Support technique",    tag: "" },
  { value: "partenariat",label: "Partenariat / revendeur", tag: "" },
  { value: "autre",      label: "Autre demande",        tag: "" },
];

const TRUST = [
  { label: "HDS certifié", sub: "Hébergement données de santé" },
  { label: "GIE SESAM-Vitale", sub: "Partenaire officiel" },
  { label: "Réponse < 4h", sub: "En jours ouvrés" },
  { label: "100% français", sub: "Équipe et données en France" },
];

function ContactForm() {
  const searchParams = useSearchParams();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sujet, setSujet] = useState("autre");
  const [specialite, setSpecialite] = useState("");

  useEffect(() => {
    const s = searchParams.get("sujet");
    if (s && SUJETS.find((x) => x.value === s)) setSujet(s);
  }, [searchParams]);

  const isDemo = sujet === "demo";
  const accent = "#2D8CFF";
  const accentLight = "rgba(45,140,255,0.10)";

  return (
    <div className="min-h-[calc(100vh-80px)] bg-thor-bg">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.5s ease both; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.12s; }
        .fade-up-3 { animation-delay: 0.20s; }
        .input-base {
          width:100%; border-radius:10px; border:1.5px solid var(--color-border, #e5e7eb);
          background:white; padding:10px 14px; font-size:0.875rem; color:#0d1a2d;
          outline:none; transition:border-color 0.18s, box-shadow 0.18s;
        }
        .input-base:focus { border-color:${accent}; box-shadow:0 0 0 3px rgba(45,140,255,0.14); }
        .input-base::placeholder { color:#9ca3af; }
        .sujet-card {
          display:flex; align-items:center; gap:10px; padding:11px 14px;
          border:1.5px solid var(--color-border, #e5e7eb); border-radius:10px;
          background:white; cursor:pointer; transition:all 0.16s; font-size:0.875rem;
          color:#0d1a2d; width:100%; text-align:left;
        }
        .sujet-card:hover { border-color:${accent}; background:rgba(45,140,255,0.04); }
        .sujet-card.active { border-color:${accent}; background:rgba(45,140,255,0.07); }
        .demo-banner {
          background:linear-gradient(135deg,rgba(45,140,255,0.08) 0%,rgba(45,140,255,0.03) 100%);
          border:1.5px solid rgba(45,140,255,0.25); border-radius:12px;
          padding:14px 16px; margin-bottom:20px;
        }
      `}</style>

      <div className="mx-auto max-w-[1200px] px-6 py-16">

        {/* En-tête */}
        <div className={`text-center mb-14 fade-up fade-up-1 ${isDemo ? "" : ""}`}>
          {isDemo ? (
            <>
              <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(45,140,255,0.35)] bg-[rgba(45,140,255,0.08)] px-4 py-1.5 text-xs font-semibold text-[#2D8CFF] mb-4">
                Demande de démonstration
              </span>
              <h1 className="text-4xl md:text-5xl font-light tracking-tight text-thor-text h-title">
                Votre cabinet,{" "}
                <span className="font-semibold" style={{ color: accent }}>transformé en 48h.</span>
              </h1>
              <p className="mt-4 text-sm text-thor-muted max-w-lg mx-auto leading-[1.8]">
                Un expert THOR vous rappelle pour une démo personnalisée — logiciel configuré à vos couleurs, vos données, votre flux de travail.
              </p>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-thor-border bg-white px-4 py-1.5 text-xs font-medium text-thor-muted mb-4">
                Nous contacter
              </span>
              <h1 className="text-3xl md:text-4xl font-light tracking-tight text-thor-text h-title">
                Une question ?{" "}
                <span className="font-semibold">On vous répond.</span>
              </h1>
              <p className="mt-3 text-sm text-thor-muted max-w-md mx-auto leading-[1.7]">
                Notre équipe est disponible du lundi au samedi pour vous accompagner.
              </p>
            </>
          )}
        </div>

        {/* Trust bar */}
        <div className="fade-up fade-up-2 grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {TRUST.map((t) => (
            <div key={t.label} className="rounded-xl border border-thor-border bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-4 py-3 flex items-center gap-3">
              <div>
                <div className="text-xs font-semibold text-thor-text">{t.label}</div>
                <div className="text-[11px] text-thor-muted leading-tight mt-0.5">{t.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Grille principale */}
        <div className="fade-up fade-up-3 grid lg:grid-cols-[1fr_360px] gap-8">

          {/* Formulaire */}
          <div className="rounded-2xl border border-thor-border bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-8">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-[#F0FDF4] border-2 border-[#BBF7D0] flex items-center justify-center mb-5">
                  <svg className="w-9 h-9 text-[#16A34A]" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-thor-text">
                  {isDemo ? "Demande reçue !" : "Message envoyé !"}
                </h2>
                <p className="mt-2 text-sm text-thor-muted max-w-xs">
                  {isDemo
                    ? "Un expert vous rappelle dans les 4 heures ouvrées pour planifier votre démo personnalisée."
                    : "Nous vous répondrons dans les 24–48h ouvrées."}
                </p>
                <button onClick={() => setSent(false)} className="mt-6 text-sm font-medium hover:underline" style={{ color: accent }}>
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={async (e) => {
                e.preventDefault();
                setSubmitting(true);
                setError(null);
                const fd = new FormData(e.currentTarget);
                try {
                  const res = await fetch("/api/contact", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      prenom:     fd.get("prenom"),
                      nom:        fd.get("nom"),
                      email:      fd.get("email"),
                      telephone:  fd.get("telephone") || undefined,
                      sujet,
                      specialite: specialite || undefined,
                      message:    fd.get("message") || undefined,
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok || !data.ok) {
                    setError(data.error ?? "Une erreur est survenue. Réessayez.");
                  } else {
                    setSent(true);
                  }
                } catch {
                  setError("Impossible d'envoyer le message. Vérifiez votre connexion.");
                } finally {
                  setSubmitting(false);
                }
              }}>

                {isDemo && (
                  <div className="demo-banner">
                    <p className="text-sm font-semibold text-[#2D8CFF] mb-0.5">Démo 100% personnalisée — gratuite, sans engagement</p>
                    <p className="text-xs text-thor-muted leading-[1.6]">
                      Notre expert configure THOR en live avec vos données et répond à toutes vos questions métier.
                    </p>
                  </div>
                )}

                {/* Sujet */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-thor-text">Sujet</label>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {SUJETS.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        className={`sujet-card${sujet === s.value ? " active" : ""}`}
                        onClick={() => setSujet(s.value)}
                      >
                        <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${sujet === s.value ? "border-[#2D8CFF]" : "border-gray-300"}`}>
                          {sujet === s.value && <span className="w-2 h-2 rounded-full bg-[#2D8CFF]" />}
                        </span>
                        <span className="flex-1">{s.label}</span>
                        {s.tag && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[rgba(45,140,255,0.12)] text-[#2D8CFF]">{s.tag}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Identité */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-thor-text">Prénom *</label>
                    <input name="prenom" required placeholder="Jean" className="input-base" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-thor-text">Nom *</label>
                    <input name="nom" required placeholder="Dupont" className="input-base" />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-thor-text">Email *</label>
                    <input name="email" required type="email" placeholder="jean@cabinet.fr" className="input-base" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-thor-text">
                      Téléphone {isDemo && <span className="text-[#2D8CFF]">*</span>}
                    </label>
                    <input
                      name="telephone"
                      required={isDemo}
                      type="tel"
                      placeholder="06 00 00 00 00"
                      className="input-base"
                    />
                  </div>
                </div>

                {/* Spécialité — demo uniquement */}
                {isDemo && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-thor-text">Vous êtes…</label>
                    <div className="grid sm:grid-cols-3 gap-2">
                      {["Opticien", "Audioprothésiste", "Les deux"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className={`sujet-card justify-center${specialite === opt ? " active" : ""}`}
                          onClick={() => setSpecialite(opt)}
                        >
                          <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${specialite === opt ? "border-[#2D8CFF]" : "border-gray-300"}`}>
                            {specialite === opt && <span className="w-2 h-2 rounded-full bg-[#2D8CFF]" />}
                          </span>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-thor-text">
                    {isDemo ? "Contexte ou questions spécifiques" : "Message *"}
                  </label>
                  <textarea
                    name="message"
                    required={!isDemo}
                    rows={isDemo ? 3 : 4}
                    placeholder={
                      isDemo
                        ? "Ex : cabinet de 3 opticiens, 40 patients/semaine, on utilise actuellement Optosens…"
                        : "Décrivez votre demande…"
                    }
                    className="input-base resize-none"
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl text-white py-3.5 text-sm font-bold tracking-wide transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{
                    background: isDemo
                      ? "#2D8CFF"
                      : "#2D8CFF",
                    boxShadow: submitting ? "none" : "0 4px 16px rgba(45,140,255,0.32)",
                  }}
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2 justify-center">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                      </svg>
                      Envoi en cours…
                    </span>
                  ) : (
                    isDemo ? "Réserver ma démo gratuite" : "Envoyer le message"
                  )}
                </button>

                {isDemo && (
                  <p className="text-center text-[11px] text-thor-muted">
                    Sans engagement · Rappel sous 4h ouvrées · Démo 30 min en visio
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Colonne droite */}
          <div className="space-y-4">

            {/* Équipe */}
            <div className="rounded-2xl border border-thor-border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-thor-muted mb-5">L&apos;équipe THOR</h2>
              <div className="space-y-4">
                {[
                  { initials: "NT", name: "Nicolas Thorel", role: "Co-fondateur & CEO", color: "#2D8CFF" },
                  { initials: "SA", name: "Sarah Azoulay", role: "Expert métier optique", color: "#00C98A" },
                  { initials: "MB", name: "Marc Bertrand", role: "Expert audioprothèse", color: "#A78BFA" },
                ].map((p) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: p.color }}
                    >
                      {p.initials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-thor-text">{p.name}</div>
                      <div className="text-xs text-thor-muted">{p.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact direct */}
            <div className="rounded-2xl border border-thor-border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-thor-muted mb-4">Contact direct</h2>
              <div className="space-y-3">
                {[
                  { label: "Email", value: "contact@thor.fr", href: "mailto:contact@thor.fr" },
                  { label: "Téléphone", value: "01 00 00 00 00", href: "tel:+33100000000" },
                  { label: "Horaires", value: "Lun–Sam : 9h–19h", href: null },
                ].map((c) => (
                  <div key={c.label} className="flex items-center gap-3">
                    <div>
                      <div className="text-[11px] text-thor-muted">{c.label}</div>
                      {c.href ? (
                        <a href={c.href} className="text-sm font-medium text-thor-text hover:text-[#2D8CFF] transition-colors">{c.value}</a>
                      ) : (
                        <div className="text-sm font-medium text-thor-text">{c.value}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Centres */}
            <div className="rounded-2xl border border-thor-border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-thor-muted mb-4">Nos centres</h2>
              <div className="space-y-2.5">
                {centres.map((c) => (
                  <div key={c.name} className="rounded-xl border border-thor-border bg-thor-bg px-3.5 py-3">
                    <div className="text-xs font-semibold text-thor-text">{c.name}</div>
                    <div className="text-[11px] text-thor-muted mt-0.5">{c.address}</div>
                    <a href={`tel:${c.phone.replace(/ /g, "")}`} className="text-[11px] font-medium text-[#2D8CFF] hover:underline mt-0.5 block">{c.phone}</a>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-80px)] bg-thor-bg" />}>
      <ContactForm />
    </Suspense>
  );
}
