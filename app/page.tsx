import AnimatedBackground from "@/components/home/animated-background";
import ThorHero from "@/components/home/thor-hero";
import { ThorBranches } from "@/components/home/thor-branches";
import { RealisationsPreview } from "@/components/home/realisations-preview";
import { ThorProCTA } from "@/components/home/thor-pro-cta";

export default function Page() {
  return (
    <>
      <AnimatedBackground />
      <ThorHero />
      <ThorBranches />
      <RealisationsPreview />
      <ThorProCTA />
    </>
  );
}
