import ThorHero from "@/components/home/thor-hero";
import { ThorSolarSystem } from "@/components/home/thor-solar-system";
import { ThorBranches } from "@/components/home/thor-branches";
import { ThorProCTA } from "@/components/home/thor-pro-cta";

/* Le fond animé est monté une seule fois, dans AppShell — ne pas le réintroduire ici.
   La preuve (le système solaire) passe avant l'orientation (les deux branches) :
   on montre ce qui tourne déjà avant de demander au visiteur de choisir. */
export default function Page() {
  return (
    <>
      <ThorHero />
      <ThorSolarSystem />
      <ThorBranches />
      <ThorProCTA />
    </>
  );
}
