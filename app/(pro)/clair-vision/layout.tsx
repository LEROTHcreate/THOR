import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clair Vision — Plateforme optique certifiée",
  description: "Espace santé visuelle pour opticiens et patients : ordonnances, bilans visuels, lentilles, agenda et messagerie. Hébergement HDS, conforme RGPD.",
};

export default function ClairVisionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
