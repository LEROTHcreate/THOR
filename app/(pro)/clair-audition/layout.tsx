import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clair Audition — Plateforme audiologie certifiée",
  description: "Espace santé auditive pour audioprothésistes et patients : bilans auditifs, suivi appareillage, agenda et messagerie. Hébergement HDS, conforme RGPD.",
};

export default function ClairAuditionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
