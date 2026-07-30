import ThorHero from "@/components/home/thor-hero";
import { ThorBranches } from "@/components/home/thor-branches";
import { ThorProCTA } from "@/components/home/thor-pro-cta";

/* Le décor — le système solaire — est monté une seule fois dans AppShell, en
   fond fixe de toute la page. Ne pas le réintroduire ici.

   La liste des six sites a été retirée : elle redisait en cartes ce que les
   planètes montrent déjà, et ses pavés masquaient les orbites les plus
   larges. Les projets restent à un clic depuis le hero comme depuis le menu,
   par /realisations — c'est aussi le chemin qu'emprunte la navigation au
   clavier, que le survol d'une planète ne peut pas servir. */
export default function Page() {
  return (
    <>
      <ThorHero />
      <ThorBranches />
      <ThorProCTA />
    </>
  );
}
