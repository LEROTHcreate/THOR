import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { ProjectShowcase } from "@/components/realisations/project-showcase";
import { getAllRealisations } from "@/lib/realisations";

export const metadata: Metadata = {
  title: "Studio",
  description:
    "THOR Studio accompagne la création d'entreprise de A à Z : étude du marché adressable, identité, site sur mesure et suivi après le lancement.",
};

const ACCENT = "#6366F1";

/* Le Studio livre pour des clients : la preuve, ce sont ces projets-là. */
const LIVRES = getAllRealisations().filter(
  (r) => r.branch === "studio" && r.status === "live",
);

/* ── Les quatre volets de l'accompagnement ────────────────────────────── */

const VOLETS = [
  {
    title: "Cadrage et marché",
    desc: "On part de votre activité et de votre zone. Combien de clients potentiels, quelle concurrence, quel positionnement tient la route.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
  },
  {
    title: "Identité et message",
    desc: "Un nom qui se retient, une identité cohérente, et surtout une phrase claire qui dit ce que vous faites et pour qui.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="13.5" cy="6.5" r="2.5" />
        <circle cx="19" cy="13" r="2.5" />
        <circle cx="6" cy="12" r="3" />
        <path d="M12 22a10 10 0 1 1 10-10" />
      </svg>
    ),
  },
  {
    title: "Site et outils",
    desc: "Un site rapide, lisible sur mobile, accessible, et les outils qui vont avec : prise de rendez-vous, formulaires, suivi client.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    title: "Lancement et suivi",
    desc: "Mise en ligne, référencement de base, mesure de l'audience. Et un interlocuteur qui reste joignable après la facture.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4.5 16.5 3 21l4.5-1.5" />
        <path d="M12 15 9 12l1.5-3a9 9 0 0 1 8-5 9 9 0 0 1-5 8L12 15Z" />
        <circle cx="15" cy="9" r="1.5" />
      </svg>
    ),
  },
];

/* ── Le déroulé, étape par étape ──────────────────────────────────────── */

const ETAPES = [
  {
    label: "Premier échange",
    duree: "45 minutes",
    desc: "Vous racontez votre projet. On vous dit franchement ce qui nous paraît solide et ce qui mérite d'être retravaillé. Sans engagement.",
  },
  {
    label: "Étude du marché",
    duree: "1 semaine",
    desc: "Taille du marché atteignable sur votre zone, densité de concurrence, profil de la clientèle. Un document que vous gardez, quoi qu'il arrive ensuite.",
  },
  {
    label: "Proposition",
    duree: "3 jours",
    desc: "Le périmètre exact, le calendrier et le prix. Un seul document, pas de ligne cachée, pas de coût qui apparaît en cours de route.",
  },
  {
    label: "Construction",
    duree: "3 à 6 semaines",
    desc: "Vous suivez l'avancement depuis votre espace client. Vous voyez les écrans se construire, vous commentez, on ajuste.",
  },
  {
    label: "Mise en ligne",
    duree: "1 journée",
    desc: "Nom de domaine, hébergement, e-mails professionnels, mesure d'audience. On s'occupe de la technique, vous récupérez les clés.",
  },
  {
    label: "Après",
    duree: "En continu",
    desc: "Le site vit. Corrections, évolutions, nouvelles pages : vous nous écrivez, on traite. Pas de contrat annuel imposé.",
  },
];

/* Aperçu de la restitution de l'étude de marché. Chiffres d'illustration. */
const RESTITUTION = [
  { label: "Marché total", value: "18 400", width: "100%" },
  { label: "Marché atteignable", value: "6 200", width: "62%" },
  { label: "Objectif 1re année", value: "740", width: "18%" },
];

/* ── Ce que le client garde ───────────────────────────────────────────────
   Le fil rouge de la page : il n'est locataire de rien. C'est l'objection
   numéro un d'un créateur qui a déjà été enfermé dans un abonnement. */

const LIVRABLES = [
  {
    title: "L’étude de marché",
    desc: "Le document de cadrage : marché atteignable, concurrence, profil de la clientèle. Il est à vous même si le projet s’arrête là.",
  },
  {
    title: "L’identité",
    desc: "Logo, palette, typographies, et les fichiers sources qui vont avec.",
  },
  {
    title: "Le site en ligne",
    desc: "Publié, indexable, mesuré, avec vos textes et vos images en place. Pas un gabarit à remplir.",
  },
  {
    title: "Les accès",
    desc: "Nom de domaine, hébergement, e-mails professionnels, statistiques : les comptes sont ouverts à votre nom.",
  },
  {
    title: "Le code",
    desc: "Le dépôt vous revient. Personne ne peut vous couper l’accès à votre propre site.",
  },
];

/* ── Partis pris techniques ───────────────────────────────────────────────
   Des engagements, pas des mesures : on ne promet pas un score, on dit
   comment on construit. */

const CAPOT = [
  {
    label: "Next.js · TypeScript",
    desc: "Des pages rendues côté serveur, typées de bout en bout. Pas de constructeur propriétaire dont on ne ressort plus.",
  },
  {
    label: "Mobile d’abord",
    desc: "Le site est dessiné pour un écran de téléphone, puis élargi. C’est de là que viennent la plupart de vos visiteurs.",
  },
  {
    label: "Accessible par défaut",
    desc: "Contrastes conformes AA, navigation au clavier, images décrites. Ce n’est pas une option qu’on ajoute à la fin.",
  },
  {
    label: "Chargement mesuré",
    desc: "Images redimensionnées et converties, polices comptées, aucune bibliothèque embarquée sans raison.",
  },
  {
    label: "Servi au plus près",
    desc: "Hébergement distribué, certificat et renouvellements automatiques. Rien à administrer de votre côté.",
  },
  {
    label: "Sans traceur inutile",
    desc: "La mesure d’audience se limite à ce qui sert à décider. Aucun mouchard publicitaire posé par défaut.",
  },
];

/* ── Les questions qui reviennent ─────────────────────────────────────── */

const FAQ = [
  {
    q: "Je n’ai qu’une idée vague, c’est trop tôt ?",
    a: "C’est même le bon moment. Le premier échange sert à mettre l’idée à plat et à regarder si le marché la porte. Vous repartez avec un avis franc, y compris s’il est négatif.",
  },
  {
    q: "Combien ça coûte ?",
    a: "Chaque projet est chiffré après le cadrage : un site de présentation et une plateforme de réservation n’ont pas le même travail derrière. Un seul devis, tout compris, sans abonnement imposé ni ligne qui apparaît en cours de route.",
  },
  {
    q: "Combien de temps avant d’être en ligne ?",
    a: "Une semaine d’étude, trois jours pour la proposition, puis trois à six semaines de construction selon le périmètre. Ce qui allonge le calendrier, c’est presque toujours l’attente des contenus.",
  },
  {
    q: "Le site m’appartient vraiment ?",
    a: "Oui. Le domaine, l’hébergement et les comptes sont à votre nom, et le code vous est remis. Si vous voulez travailler avec quelqu’un d’autre demain, rien ne vous retient.",
  },
  {
    q: "J’ai déjà un site, vous repartez de zéro ?",
    a: "Pas forcément. On regarde ce qui fonctionne et ce qui se récupère — textes, images, référencement déjà acquis — et on ne refait que ce qui le mérite.",
  },
  {
    q: "Et une fois en ligne, vous disparaissez ?",
    a: "Vous écrivez, on traite : correction, nouvelle page, évolution. Sans contrat annuel obligatoire. Un suivi régulier existe pour ceux qui le veulent, mais ce n’est pas la porte d’entrée.",
  },
];

export default function StudioPage() {
  return (
    <div className="relative pb-24">
      {/* ── Ouverture ─────────────────────────────────────────────────── */}
      <section className="relative pt-32 sm:pt-40">
        <div className="mx-auto max-w-[1100px] px-5 sm:px-6 text-center">
          <div className="rise">
            <span className="lg lg-pill mb-9">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: ACCENT, boxShadow: `0 0 8px ${ACCENT}99` }}
              />
              <span className="mono-label text-slate-500">THOR · Studio</span>
            </span>
          </div>

          <h1
            className="rise h-title text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-slate-900 leading-[0.95]"
            style={{ animationDelay: "80ms" }}
          >
            Vous avez une idée.
            <br />
            On s’occupe du reste.
          </h1>

          <p
            className="rise mx-auto mt-8 max-w-xl text-lg text-slate-500 leading-[1.6]"
            style={{ animationDelay: "160ms" }}
          >
            Créer une entreprise, ce n’est pas seulement faire un site. C’est
            savoir à qui l’on parle, combien ils sont, et comment les atteindre.
            On prend le projet à son début et on ne le lâche pas au lancement.
          </p>

          <div
            className="rise mt-11 flex flex-col sm:flex-row items-center justify-center gap-3"
            style={{ animationDelay: "240ms" }}
          >
            <Link href="/contact?sujet=studio" className="lg lg-btn lg-btn-ink w-full sm:w-auto">
              <span>Parler de mon projet</span>
            </Link>
            <Link href="/realisations" className="lg lg-btn w-full sm:w-auto">
              <span>Voir nos réalisations</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          <div
            className="rise mt-14 flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
            style={{ animationDelay: "320ms" }}
          >
            {["Étude de marché incluse", "3 à 6 semaines", "Vous restez propriétaire"].map(
              (fact, i) => (
                <span key={fact} className="flex items-center gap-4">
                  {i > 0 && <span aria-hidden="true" className="text-slate-300">·</span>}
                  <span className="mono-label text-slate-400">{fact}</span>
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ── La preuve : ce qu'on a livré ──────────────────────────────── */}
      {LIVRES.length > 0 && (
        <section className="relative pt-28 sm:pt-36">
          <div className="mx-auto max-w-[1100px] px-5 sm:px-6">
            <Reveal>
              <div className="flex items-center gap-5">
                <span className="mono-label shrink-0 text-slate-400">Livré · En ligne</span>
                <span aria-hidden="true" className="h-px flex-1 bg-slate-900/[0.07]" />
              </div>
            </Reveal>

            <div className="mt-16 space-y-24 sm:space-y-32">
              {LIVRES.map((item, i) => (
                <Reveal key={item.slug}>
                  <ProjectShowcase item={item} flip={i % 2 === 1} priority={i === 0} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Les quatre volets ─────────────────────────────────────────── */}
      <section className="relative pt-28 sm:pt-36">
        <div className="mx-auto max-w-[1100px] px-5 sm:px-6">
          <Reveal>
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <span className="mono-label mb-5 block text-slate-400">L’accompagnement</span>
              <h2 className="h-title text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 leading-[1.05]">
                Quatre volets, un seul interlocuteur.
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-4 md:grid-cols-2">
            {VOLETS.map((v, i) => (
              <Reveal key={v.title}>
                <div className="lg lg-card h-full p-8 sm:p-9">
                  <div className="mb-7 flex items-center justify-between">
                    <span
                      className="grid h-11 w-11 place-items-center rounded-2xl [&>svg]:h-5 [&>svg]:w-5"
                      style={{ background: `${ACCENT}14`, color: ACCENT }}
                    >
                      {v.icon}
                    </span>
                    <span className="mono-label text-slate-300">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="h-title text-xl font-semibold tracking-tight text-slate-900">
                    {v.title}
                  </h3>
                  <p className="mt-3 text-[15px] text-slate-500 leading-[1.7]">{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Le marché adressable — la brique différenciante ───────────── */}
      <section className="relative pt-28 sm:pt-36">
        <div className="mx-auto max-w-[1100px] px-5 sm:px-6">
          <Reveal>
            <div className="lg lg-card relative overflow-hidden p-8 sm:p-12">
              {/* La trame ne peut pas vivre sur la carte elle-même : `.lg-card`
                  pose un `background` raccourci qui efface toute image de fond. */}
              <span aria-hidden="true" className="grid-paper pointer-events-none" style={{ position: "absolute", inset: 0 }} />
              <div className="relative grid items-center gap-12 md:grid-cols-[1.05fr_1fr] lg:gap-16">
                <div>
                  <span className="mono-label mb-6 inline-block" style={{ color: ACCENT }}>
                    En préparation
                  </span>
                  <h2 className="h-title text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 leading-[1.05]">
                    Voir votre marché avant de vous lancer.
                  </h2>
                  <p className="mt-5 max-w-md text-[17px] text-slate-500 leading-[1.65]">
                    Un outil en cours de construction : vous indiquez votre métier
                    et votre zone, il vous montre le nombre de clients potentiels,
                    les concurrents déjà installés et le profil de la population
                    autour de vous. D’ici là, cette étude est faite à la main pour
                    chaque projet.
                  </p>
                  <Link
                    href="/contact?sujet=etude-marche"
                    className="group/link mt-8 inline-flex items-center gap-2 text-[15px] font-medium"
                    style={{ color: ACCENT }}
                  >
                    Demander une étude pour mon activité
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="transition-transform duration-500 group-hover/link:translate-x-0.5" aria-hidden="true">
                      <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>

                {/* Aperçu schématique de la restitution */}
                <div className="rounded-[20px] border border-slate-900/[0.07] bg-white/90 p-7">
                  <div className="mono-label mb-7 text-slate-400">Aperçu de la restitution</div>
                  <div className="space-y-6">
                    {RESTITUTION.map((row, i) => (
                      <div key={row.label}>
                        <div className="mb-2 flex items-baseline justify-between gap-3">
                          <span className="flex items-baseline gap-2.5 text-[13px] text-slate-500">
                            <span className="mono-label text-slate-300">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            {row.label}
                          </span>
                          <span className="text-[15px] font-medium tabular-nums text-slate-900">
                            {row.value}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-900/[0.06]">
                          <div
                            className="h-full rounded-full"
                            style={{ width: row.width, background: ACCENT }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-7 text-[13px] leading-relaxed text-slate-400">
                    Chiffres d’illustration. Les données réelles proviennent des
                    bases publiques de l’INSEE.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Le déroulé ────────────────────────────────────────────────── */}
      <section className="relative pt-28 sm:pt-36">
        <div className="mx-auto max-w-[1100px] px-5 sm:px-6">
          <Reveal>
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <span className="mono-label mb-5 block text-slate-400">Le déroulé</span>
              <h2 className="h-title text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 leading-[1.05]">
                De l’idée au lancement, étape par étape.
              </h2>
            </div>
          </Reveal>

          <ol className="mx-auto max-w-3xl">
            {ETAPES.map((e, i) => (
              <Reveal key={e.label}>
                <li className="grid grid-cols-[2.5rem_1fr] gap-x-6 sm:grid-cols-[4rem_1fr]">
                  {/* Rail : l'indice, puis le filet qui rejoint l'étape suivante */}
                  <div className="flex flex-col items-center">
                    <span className="mono-label pt-1.5 text-slate-300">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {i < ETAPES.length - 1 && (
                      <span aria-hidden="true" className="mt-3 w-px flex-1 bg-slate-900/[0.08]" />
                    )}
                  </div>

                  <div className="pb-12">
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <h3 className="h-title text-xl font-semibold tracking-tight text-slate-900">
                        {e.label}
                      </h3>
                      <span className="mono-label text-slate-400">{e.duree}</span>
                    </div>
                    <p className="mt-3 text-[15px] text-slate-500 leading-[1.75]">{e.desc}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Le bordereau de livraison ─────────────────────────────────────
          Présenté comme un relevé, pas comme un argumentaire : c'est une
          liste de choses qui changent de mains. */}
      <section className="relative pt-28 sm:pt-36">
        <div className="mx-auto max-w-[900px] px-5 sm:px-6">
          <Reveal>
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <span className="mono-label mb-5 block text-slate-400">À la livraison</span>
              <h2 className="h-title text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 leading-[1.05]">
                Ce que vous gardez.
              </h2>
              <p className="mt-6 text-lg text-slate-500 leading-[1.6]">
                Tout, y compris si vous décidez un jour de continuer sans nous.
                C’est la seule façon honnête de travailler pour quelqu’un qui
                lance son activité.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className="lg lg-card relative overflow-hidden px-6 py-2 sm:px-10">
              <span aria-hidden="true" className="grid-paper pointer-events-none" style={{ position: "absolute", inset: 0 }} />

              <ul className="relative divide-y divide-slate-900/[0.06]">
                {LIVRABLES.map((l, i) => (
                  <li key={l.title} className="grid grid-cols-[2rem_1fr] gap-x-5 py-6 sm:grid-cols-[3rem_1fr]">
                    <span className="mono-label pt-1.5 text-slate-300">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="h-title text-lg font-semibold tracking-tight text-slate-900">
                        {l.title}
                      </h3>
                      <p className="mt-1.5 text-[15px] text-slate-500 leading-[1.7]">{l.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal>
            <p className="mono-label mt-8 text-center text-slate-400">
              Propriété du client · Aucun abonnement imposé
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Sous le capot ─────────────────────────────────────────────────
          Des engagements de fabrication, pas des scores : on ne promet pas
          un chiffre qu'on ne pourrait pas tenir sur tous les projets. */}
      <section className="relative pt-28 sm:pt-36">
        <div className="mx-auto max-w-[1100px] px-5 sm:px-6">
          <Reveal>
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <span className="mono-label mb-5 block text-slate-400">Sous le capot</span>
              <h2 className="h-title text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 leading-[1.05]">
                Comment c’est construit.
              </h2>
              <p className="mt-6 text-lg text-slate-500 leading-[1.6]">
                Vous n’aurez jamais à ouvrir ce capot. Mais vous avez le droit de
                savoir ce qu’il y a dedans avant de signer.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {CAPOT.map((c) => (
              <Reveal key={c.label}>
                <div className="border-t border-slate-900/[0.09] pt-5">
                  <span className="mono-label block" style={{ color: ACCENT }}>
                    {c.label}
                  </span>
                  <p className="mt-3.5 text-[15px] text-slate-500 leading-[1.7]">{c.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Les questions qui reviennent ──────────────────────────────────
          En <details> natif : l'ouverture, le clavier et la recherche du
          navigateur fonctionnent sans une ligne de JavaScript. */}
      <section className="relative pt-28 sm:pt-36">
        <div className="mx-auto max-w-[820px] px-5 sm:px-6">
          <Reveal>
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <span className="mono-label mb-5 block text-slate-400">Avant de nous écrire</span>
              <h2 className="h-title text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 leading-[1.05]">
                Les questions qui reviennent.
              </h2>
            </div>
          </Reveal>

          <div className="space-y-3">
            {FAQ.map((f) => (
              <Reveal key={f.q}>
                <details className="lg lg-card group/faq px-6 py-5 sm:px-8 sm:py-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                    <span className="h-title text-[17px] font-semibold tracking-tight text-slate-900">
                      {f.q}
                    </span>
                    <span
                      aria-hidden="true"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-900/[0.04] text-slate-400 transition-transform duration-300 group-open/faq:rotate-45"
                      style={{ transitionTimingFunction: "var(--lg-ease)" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-4 max-w-[62ch] text-[15px] text-slate-500 leading-[1.75]">
                    {f.a}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Appel à l'action ──────────────────────────────────────────── */}
      <section className="relative pt-16 sm:pt-24">
        <div className="mx-auto max-w-[900px] px-5 sm:px-6">
          <Reveal>
            <div className="lg lg-card relative overflow-hidden px-6 py-14 sm:px-14 sm:py-16 text-center">
              <span aria-hidden="true" className="grid-paper pointer-events-none" style={{ position: "absolute", inset: 0 }} />
              <h2 className="h-title relative mx-auto max-w-md text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 leading-[1.05]">
                Le premier échange ne coûte rien.
              </h2>
              <p className="mx-auto mt-5 max-w-md text-[17px] text-slate-500 leading-[1.65]">
                Quarante-cinq minutes pour comprendre votre projet et vous dire
                honnêtement s’il tient debout. Même si la réponse est non.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/contact?sujet=studio" className="lg lg-btn lg-btn-ink w-full sm:w-auto">
                  <span>Prendre contact</span>
                </Link>
                <Link href="/realisations" className="lg lg-btn w-full sm:w-auto">
                  <span>Ce qu’on a déjà fait</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
