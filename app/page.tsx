import AnimatedBackground from "@/components/home/animated-background";
import ThorHero from "@/components/home/thor-hero";
import { SaasPortfolio } from "@/components/home/saas-portfolio";
import { ThorValues } from "@/components/home/thor-values";
import { ThorProCTA } from "@/components/home/thor-pro-cta";

export default function Page() {
  return (
    <>
      <AnimatedBackground />
      <ThorHero />
      <SaasPortfolio />
      <ThorValues />
      <ThorProCTA />
    </>
  );
}
