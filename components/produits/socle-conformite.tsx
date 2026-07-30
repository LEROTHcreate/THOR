import { Reveal } from "@/components/ui/reveal";

/**
 * Le socle technique commun à tous les produits.
 *
 * Six briques, listées à plat : ce sont des garanties, pas des arguments —
 * elles se lisent en diagonale et n'ont pas à être mises en scène.
 *
 * Les certifications propres à la santé tiennent en une seule entrée : elles
 * restent vraies pour les produits concernés, mais ce ne sont plus elles qui
 * définissent THOR.
 */
const SOCLE = [
  {
    title: "Hébergement en France",
    desc: "Les données restent en France, chez des hébergeurs européens. Aucune sortie hors de l'Union.",
  },
  {
    title: "Conformité RGPD",
    desc: "Chiffrement des données sensibles, traçabilité complète, droits des utilisateurs respectés.",
  },
  {
    title: "IA THOR intégrée",
    desc: "Assistant conversationnel propriétaire, intégré nativement à chaque produit de l'écosystème.",
  },
  {
    title: "Exigences du métier",
    desc: "Chaque produit porte les certifications de son secteur. Côté santé : hébergement HDS, SESAM-Vitale, ADRi via e-CPS.",
  },
  {
    title: "Un seul interlocuteur",
    desc: "De la conception à la mise en ligne puis au suivi, la même équipe. Pas de sous-traitance en cascade.",
  },
  {
    title: "Évolution continue",
    desc: "Une seule infrastructure, plusieurs métiers. Les évolutions transversales bénéficient à tous les produits.",
  },
];

export function SocleConformite() {
  return (
    <section className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-[1100px] px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="mono-label mb-5 block text-slate-500">Le socle</span>
            <h2 className="h-title text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 leading-[1.05]">
              Le même socle sous chaque produit.
            </h2>
            <p className="mt-6 text-lg text-slate-500 leading-[1.6]">
              Sécurité, hébergement, conformité : les briques critiques sont
              mutualisées une fois pour toutes. Chaque produit y ajoute ensuite
              les exigences propres à son métier.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SOCLE.map((v, i) => (
            <Reveal key={v.title}>
              <div className="lg lg-card h-full p-7">
                <span className="mono-label block text-slate-500">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="h-title mt-5 text-lg font-semibold tracking-tight text-slate-900">
                  {v.title}
                </h3>
                <p className="mt-2.5 text-[15px] text-slate-500 leading-[1.65]">{v.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
