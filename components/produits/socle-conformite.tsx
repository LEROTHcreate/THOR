import { Reveal } from "@/components/ui/reveal";

/**
 * Le socle technique commun aux plateformes santé.
 *
 * Six briques, listées à plat : ce sont des garanties, pas des arguments —
 * elles se lisent en diagonale et n'ont pas à être mises en scène.
 */
const SOCLE = [
  {
    title: "Hébergement HDS",
    desc: "Données de santé hébergées chez un partenaire certifié HDS, conformément au Code de la santé publique.",
  },
  {
    title: "SESAM-Vitale",
    desc: "Architecture pensée pour la certification GIE SESAM-Vitale et la télétransmission des FSE.",
  },
  {
    title: "ADRi via e-CPS",
    desc: "Vérification des droits des assurés en temps réel via l'authentification praticien e-CPS.",
  },
  {
    title: "IA THOR intégrée",
    desc: "Assistant conversationnel propriétaire intégré nativement à chaque plateforme métier.",
  },
  {
    title: "Conformité RGPD",
    desc: "Chiffrement des données sensibles, traçabilité complète, droits des utilisateurs respectés.",
  },
  {
    title: "Évolution continue",
    desc: "Une seule infrastructure, plusieurs métiers. Les évolutions transversales bénéficient à tous nos SaaS.",
  },
];

export function SocleConformite() {
  return (
    <section className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-[1100px] px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="mono-label mb-5 block text-slate-400">Le socle</span>
            <h2 className="h-title text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 leading-[1.05]">
              Conforme avant d’être livré.
            </h2>
            <p className="mt-6 text-lg text-slate-500 leading-[1.6]">
              Au lieu de réinventer la conformité santé pour chaque produit, THOR
              mutualise les briques critiques et les met à disposition de chacune
              de ses plateformes.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SOCLE.map((v, i) => (
            <Reveal key={v.title}>
              <div className="lg lg-card h-full p-7">
                <span className="mono-label block text-slate-300">
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
