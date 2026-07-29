"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/header";
import FooterGate from "@/components/footer-gate";
import AnimatedBackground from "@/components/home/animated-background";
import { SolarBackdrop } from "@/components/home/solar-backdrop";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isModuleSite =
    pathname.startsWith("/clair-vision") || pathname.startsWith("/clair-audition");
  const isAuthPage =
    pathname.startsWith("/connexion") || pathname.startsWith("/inscription");

  /* La page d'accueil a son propre décor : le système solaire, sur toute sa
     hauteur. C'est la seule page nocturne de la vitrine — les autres gardent
     le fond clair, et le fond animé clair n'est donc pas monté ici. */
  const isHome = pathname === "/";

  // Fond animé partagé sur les autres pages publiques THOR (sauf modules pro et auth)
  const showAnimatedBg = !isModuleSite && !isAuthPage && !isHome;
  // Désactiver la sélection de texte sur les pages vitrines THOR (pas dans les modules ni l'auth)
  const noSelect = !isModuleSite && !isAuthPage;

  useEffect(() => {
    const body = document.body;
    if (!body) return;
    if (noSelect) body.classList.add("thor-no-select");
    else          body.classList.remove("thor-no-select");
    return () => { body.classList.remove("thor-no-select"); };
  }, [noSelect]);

  /* Le fond blanc du body ferait un liseré clair sous le décor spatial.
     Un attribut sur <html> plutôt qu'une classe sur le body : les feuilles de
     style de la home s'y accrochent aussi (cf. [data-page="night"]). */
  useEffect(() => {
    const root = document.documentElement;
    if (isHome) root.setAttribute("data-page", "night");
    else root.removeAttribute("data-page");
    return () => { root.removeAttribute("data-page"); };
  }, [isHome]);

  return (
    <>
      {showAnimatedBg && <AnimatedBackground />}
      {isHome && <SolarBackdrop />}

      {/* Header THOR uniquement sur le site THOR */}
      {!isModuleSite && <Header />}

      {/* Padding top uniquement si header THOR visible */}
      <div className={!isModuleSite ? "pt-20" : ""}>{children}</div>

      {/* Footer THOR uniquement sur le site THOR */}
      {!isModuleSite && <FooterGate />}
    </>
  );
}
