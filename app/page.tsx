import ThorHero from "@/components/home/thor-hero";
import { ThorBranches } from "@/components/home/thor-branches";
import { RealisationsPreview } from "@/components/home/realisations-preview";
import { ThorProCTA } from "@/components/home/thor-pro-cta";

/* Le fond animé est monté une seule fois, dans AppShell — ne pas le réintroduire ici. */
export default function Page() {
  return (
    <>
      <ThorHero />
      <ThorBranches />
      <RealisationsPreview />
      <ThorProCTA />
    </>
  );
}
