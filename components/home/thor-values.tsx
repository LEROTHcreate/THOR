import { Reveal } from "@/components/ui/reveal";

const values = [
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

export function ThorValues() {
  return (
    <section className="relative py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-6">

        <Reveal>
          <div className="max-w-2xl mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4 block">
              Pourquoi THOR
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 h-title">
              Un socle commun, <span className="font-light text-slate-500">conforme et évolutif.</span>
            </h2>
            <p className="mt-5 text-base text-slate-500 leading-relaxed">
              Au lieu de réinventer la conformité santé pour chaque produit,
              THOR mutualise les briques techniques critiques et les met
              à disposition de chacun de ses SaaS.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
          {values.map((v, i) => (
            <Reveal key={v.title}>
              <div
                className="relative pl-8 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: "rgba(255,255,255,0.55)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.75)",
                  boxShadow: "0 4px 24px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
                }}
              >
                <span
                  className="absolute left-6 top-6 text-xs font-mono text-slate-300"
                  style={{ letterSpacing: "0.05em" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-semibold text-slate-900 mb-2 h-title mt-3">
                  {v.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {v.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
