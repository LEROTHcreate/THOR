"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Parler de votre projet.
 *
 * Direction artistique : un terminal, tenu à la rigueur d'une page épurée.
 * La monospace porte toute la structure — index, étiquettes, états — et la
 * display ne sert qu'à la seule phrase qui compte. Aucune couleur décorative :
 * l'encre et une seule teinte de signal.
 *
 * L'avancement s'affiche en binaire, un bit par champ requis. Ce n'est pas un
 * ornement : c'est l'indicateur de progression de la page, doublé d'un
 * équivalent textuel pour les lecteurs d'écran.
 */

const SUJETS = [
  { value: "projet",       label: "Parler de mon projet",   hint: "Le plus courant" },
  { value: "studio",       label: "Créer mon entreprise",   hint: "THOR Studio" },
  { value: "etude-marche", label: "Étude de marché",        hint: "" },
  { value: "demo",         label: "Voir une plateforme",    hint: "THOR Produits" },
  { value: "support",      label: "Support technique",      hint: "" },
  { value: "partenariat",  label: "Partenariat",            hint: "" },
  { value: "autre",        label: "Autre demande",          hint: "" },
];

const CONTACT_EMAIL = "contact.thor.pro@gmail.com";
const CONTACT_PHONE_DISPLAY = "07 69 46 24 46";
const CONTACT_PHONE_TEL = "+33769462446";

type Champs = {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  message: string;
};

const VIDE: Champs = { prenom: "", nom: "", email: "", telephone: "", message: "" };

function ContactPageInner() {
  const searchParams = useSearchParams();

  /* Le sujet vient de l'URL, mais c'est une intention d'arrivée, pas une
     liaison vivante : on l'initialise une fois plutôt que de le resynchroniser
     dans un effet, ce qui provoquerait un rendu en cascade. */
  const [sujet, setSujet] = useState(() => {
    const s = searchParams.get("sujet");
    return s && SUJETS.some((x) => x.value === s) ? s : "projet";
  });
  const [champs, setChamps] = useState<Champs>(VIDE);
  const [specialite, setSpecialite] = useState("");
  const [etat, setEtat] = useState<"saisie" | "envoi" | "recu">("saisie");
  const [erreur, setErreur] = useState<string | null>(null);

  /* Voir une plateforme suppose qu'on puisse rappeler : le téléphone devient
     requis, et la spécialité conditionne qui rappellera. */
  const estProduit = sujet === "demo";

  const requis = useMemo(
    () =>
      [
        { cle: "prenom" as const,    rempli: champs.prenom.trim().length > 0 },
        { cle: "nom" as const,       rempli: champs.nom.trim().length > 0 },
        { cle: "email" as const,     rempli: /.+@.+\..+/.test(champs.email) },
        ...(estProduit
          ? [{ cle: "telephone" as const, rempli: champs.telephone.trim().length >= 10 }]
          : []),
        { cle: "message" as const,   rempli: champs.message.trim().length > 0 },
      ],
    [champs, estProduit],
  );

  const bits = requis.map((r) => (r.rempli ? "1" : "0"));
  const complets = requis.filter((r) => r.rempli).length;
  const pret = complets === requis.length;

  function maj(cle: keyof Champs, valeur: string) {
    setChamps((c) => ({ ...c, [cle]: valeur }));
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!pret || etat === "envoi") return;
    setEtat("envoi");
    setErreur(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom: champs.prenom,
          nom: champs.nom,
          email: champs.email,
          telephone: champs.telephone || undefined,
          sujet,
          specialite: specialite || undefined,
          message: champs.message || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErreur(data.error ?? "L'envoi a échoué. Réessayez dans un instant.");
        setEtat("saisie");
      } else {
        setEtat("recu");
      }
    } catch {
      setErreur("Envoi impossible. Vérifiez votre connexion.");
      setEtat("saisie");
    }
  }

  const libelleEtat =
    etat === "envoi" ? "TRANSMISSION" : etat === "recu" ? "REÇU" : pret ? "PRÊT" : "EN SAISIE";

  return (
    <div className="term relative min-h-[calc(100vh-80px)] pb-28 pt-32 sm:pt-40">
      <style>{`
        /* ── Le papier millimétré, très en retrait ── */
        .term::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(to right,  rgba(11,18,32,0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(11,18,32,0.035) 1px, transparent 1px);
          background-size: 32px 32px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 78%);
          -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 78%);
        }

        .term-mono {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        /* ── Le curseur de terminal, dessiné et non écrit ──
           Un soulignement plutôt qu'un pavé : à 64 px, un curseur-bloc pèse
           autant qu'une lettre et vole la vedette au titre. Il reste solidaire
           du dernier mot (.term-nowrap) pour ne jamais s'orphaner sur sa ligne. */
        .term-nowrap { white-space: nowrap }
        .term-caret {
          display: inline-block;
          width: 0.52em;
          height: 0.07em;
          min-height: 3px;
          margin-left: 0.1em;
          background: #4F46E5;
          vertical-align: 0.06em;
          animation: termBlink 1.1s steps(1) infinite;
        }
        @keyframes termBlink { 0%, 55% { opacity: 1 } 56%, 100% { opacity: 0 } }
        @media (prefers-reduced-motion: reduce) {
          .term-caret { animation: none }
        }

        /* ── Les champs : filet net, angle sec, aucune ombre ── */
        .term-input {
          width: 100%;
          background: #FFFFFF;
          border: 1px solid rgba(11,18,32,0.12);
          border-radius: var(--radius-sharp);
          padding: 0.8rem 0.9rem;
          font-size: 15px;
          color: var(--thor-text);
          transition: border-color 200ms var(--lg-ease, cubic-bezier(0.4,0,0.2,1)),
                      box-shadow    200ms var(--lg-ease, cubic-bezier(0.4,0,0.2,1));
        }
        .term-input::placeholder { color: #94A3B8 }
        .term-input:focus {
          outline: none;
          border-color: #4F46E5;
          box-shadow: 0 0 0 3px rgba(79,70,229,0.14);
        }

        /* ── Les sujets : une liste, pas des cartes ── */
        .term-sujet {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          width: 100%;
          padding: 0.7rem 0.9rem;
          border: 1px solid transparent;
          border-radius: var(--radius-sharp);
          text-align: left;
          cursor: pointer;
          background: transparent;
          transition: background-color 200ms ease, border-color 200ms ease;
        }
        .term-sujet:hover { background: rgba(11,18,32,0.035) }
        .term-sujet[aria-pressed="true"] {
          background: #FFFFFF;
          border-color: rgba(79,70,229,0.35);
        }
        .term-sujet:focus-visible {
          outline: 2px solid #4F46E5;
          outline-offset: 2px;
        }
      `}</style>

      <div className="relative mx-auto max-w-[1080px] px-5 sm:px-6">

        {/* ── En-tête : une seule idée, une seule phrase ────────────────── */}
        <header className="max-w-2xl">
          <div className="term-mono text-slate-500">THOR — Contact</div>

          <h1 className="h-title mt-6 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-slate-900 leading-[1.02]">
            Parlons de votre{" "}
            <span className="term-nowrap">
              projet
              <span aria-hidden="true" className="term-caret" />
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-[17px] leading-[1.65] text-slate-600">
            Dites-nous ce que vous voulez construire. On vous répond sous deux
            jours ouvrés, par la personne qui suivra votre dossier.
          </p>
        </header>

        {/* ── Le corps : le formulaire, et une colonne d'état ──────────── */}
        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_260px] lg:gap-16">

          <div>
            {etat === "recu" ? (
              /* ── Accusé de réception ── */
              <div className="border border-slate-900/10 bg-white p-8 sm:p-10" style={{ borderRadius: "var(--radius-sharp)" }}>
                <div className="term-mono text-indigo-600">Transmission terminée</div>
                <h2 className="h-title mt-5 text-2xl font-semibold tracking-tight text-slate-900">
                  C&apos;est reçu.
                </h2>
                <p className="mt-4 max-w-md text-[15px] leading-[1.7] text-slate-600">
                  Votre message est arrivé. Nous revenons vers vous sous deux
                  jours ouvrés à l&apos;adresse{" "}
                  <span className="font-medium text-slate-900">{champs.email}</span>.
                </p>
                <dl className="mt-8 grid gap-px border border-slate-900/10 bg-slate-900/10 sm:grid-cols-2">
                  <div className="bg-white p-4">
                    <dt className="term-mono text-slate-500">Sujet</dt>
                    <dd className="mt-1.5 text-sm text-slate-900">
                      {SUJETS.find((s) => s.value === sujet)?.label}
                    </dd>
                  </div>
                  <div className="bg-white p-4">
                    <dt className="term-mono text-slate-500">Délai de réponse</dt>
                    <dd className="mt-1.5 text-sm text-slate-900">2 jours ouvrés</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  onClick={() => { setChamps(VIDE); setSpecialite(""); setEtat("saisie"); }}
                  className="term-mono mt-8 text-slate-500 underline underline-offset-4 transition-colors duration-200 hover:text-slate-900"
                >
                  Écrire un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={envoyer} noValidate>

                {/* ── 01 · Le sujet ── */}
                <fieldset className="border-0 p-0">
                  <legend className="term-mono flex items-baseline gap-3 text-slate-500">
                    <span className="text-slate-400">01</span>
                    Votre demande
                  </legend>

                  <div className="mt-5 grid gap-1 sm:grid-cols-2">
                    {SUJETS.map((s) => {
                      const actif = sujet === s.value;
                      return (
                        <button
                          key={s.value}
                          type="button"
                          className="term-sujet"
                          aria-pressed={actif}
                          onClick={() => setSujet(s.value)}
                        >
                          <span
                            aria-hidden="true"
                            className="h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-200"
                            style={{ background: actif ? "#4F46E5" : "rgba(11,18,32,0.18)" }}
                          />
                          <span className="flex-1 text-[15px] text-slate-900">{s.label}</span>
                          {s.hint && (
                            <span className="term-mono shrink-0 text-slate-500">{s.hint}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* ── 02 · Qui nous écrit ── */}
                <fieldset className="mt-14 border-0 p-0">
                  <legend className="term-mono flex items-baseline gap-3 text-slate-500">
                    <span className="text-slate-400">02</span>
                    Vous
                  </legend>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="term-mono text-slate-500">Prénom</span>
                      <input
                        className="term-input mt-2"
                        value={champs.prenom}
                        onChange={(e) => maj("prenom", e.target.value)}
                        autoComplete="given-name"
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="term-mono text-slate-500">Nom</span>
                      <input
                        className="term-input mt-2"
                        value={champs.nom}
                        onChange={(e) => maj("nom", e.target.value)}
                        autoComplete="family-name"
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="term-mono text-slate-500">Email</span>
                      <input
                        type="email"
                        className="term-input mt-2"
                        value={champs.email}
                        onChange={(e) => maj("email", e.target.value)}
                        autoComplete="email"
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="term-mono text-slate-500">
                        Téléphone {!estProduit && <span className="normal-case tracking-normal">(facultatif)</span>}
                      </span>
                      <input
                        type="tel"
                        className="term-input mt-2"
                        value={champs.telephone}
                        onChange={(e) => maj("telephone", e.target.value)}
                        autoComplete="tel"
                        required={estProduit}
                      />
                    </label>
                  </div>

                  {estProduit && (
                    <div className="mt-6">
                      <span className="term-mono text-slate-500">Votre métier</span>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {["Opticien", "Audioprothésiste", "Pharmacien", "Les deux"].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            className="term-sujet w-auto"
                            aria-pressed={specialite === opt}
                            onClick={() => setSpecialite(specialite === opt ? "" : opt)}
                          >
                            <span className="text-[15px] text-slate-900">{opt}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </fieldset>

                {/* ── 03 · Le projet ── */}
                <fieldset className="mt-14 border-0 p-0">
                  <legend className="term-mono flex items-baseline gap-3 text-slate-500">
                    <span className="text-slate-400">03</span>
                    Votre projet
                  </legend>

                  <label className="mt-5 block">
                    <span className="sr-only">Décrivez votre projet</span>
                    <textarea
                      rows={6}
                      className="term-input resize-none"
                      placeholder="Ce que vous voulez faire, où vous en êtes, ce qui bloque. Quelques lignes suffisent."
                      value={champs.message}
                      onChange={(e) => maj("message", e.target.value)}
                      required
                    />
                  </label>
                </fieldset>

                {erreur && (
                  <p
                    role="alert"
                    className="mt-8 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                    style={{ borderRadius: "var(--radius-sharp)" }}
                  >
                    {erreur}
                  </p>
                )}

                <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <button
                    type="submit"
                    disabled={!pret || etat === "envoi"}
                    className="term-mono inline-flex items-center justify-center gap-3 bg-slate-900 px-7 py-4 text-white transition-colors duration-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
                    style={{ borderRadius: "var(--radius-sharp)" }}
                  >
                    {etat === "envoi" ? "Transmission…" : "Envoyer"}
                    {etat !== "envoi" && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  <p className="text-[13px] text-slate-500">
                    {pret
                      ? "Tout est là."
                      : `Encore ${requis.length - complets} champ${requis.length - complets > 1 ? "s" : ""} à remplir.`}
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* ── La colonne d'état ──────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border-t border-slate-900/10 pt-5">
              <div className="term-mono text-slate-500">État</div>
              <div className="mt-3 flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: etat === "recu" ? "#16A34A" : pret ? "#4F46E5" : "rgba(11,18,32,0.22)" }}
                />
                <span className="term-mono text-slate-900">{libelleEtat}</span>
              </div>

              {/* La progression, en binaire. Décorative pour l'œil, doublée
                  d'un équivalent lisible juste en dessous. */}
              <div
                aria-hidden="true"
                className="mt-4 flex gap-1.5"
                style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
              >
                {bits.map((b, i) => (
                  <span
                    key={i}
                    className="transition-colors duration-200"
                    style={{ color: b === "1" ? "#4F46E5" : "rgba(11,18,32,0.2)" }}
                  >
                    {b}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[13px] text-slate-500">
                {complets} sur {requis.length} champs requis
              </p>
            </div>

            <div className="mt-10 border-t border-slate-900/10 pt-5">
              <div className="term-mono text-slate-500">Direct</div>
              <ul className="mt-3 space-y-2">
                <li>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="break-all text-[13px] text-slate-600 underline underline-offset-4 transition-colors duration-200 hover:text-slate-900"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:${CONTACT_PHONE_TEL}`}
                    className="text-[13px] tabular-nums text-slate-600 underline underline-offset-4 transition-colors duration-200 hover:text-slate-900"
                  >
                    {CONTACT_PHONE_DISPLAY}
                  </a>
                </li>
              </ul>
            </div>

            <div className="mt-10 border-t border-slate-900/10 pt-5">
              <div className="term-mono text-slate-500">Réponse</div>
              <p className="mt-3 text-[13px] leading-[1.6] text-slate-600">
                Sous deux jours ouvrés, par la personne qui suivra le dossier.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-80px)]" />}>
      <ContactPageInner />
    </Suspense>
  );
}
