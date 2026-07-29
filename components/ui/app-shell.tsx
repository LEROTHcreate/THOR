"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/header";
import FooterGate from "@/components/footer-gate";
import AnimatedBackground from "@/components/home/animated-background";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isModuleSite =
    pathname.startsWith("/clair-vision") || pathname.startsWith("/clair-audition");
  const isAuthPage =
    pathname.startsWith("/connexion") || pathname.startsWith("/inscription");

  // Fond animé partagé sur toutes les pages publiques THOR (sauf modules pro et auth)
  const showAnimatedBg = !isModuleSite && !isAuthPage;
  // Désactiver la sélection de texte sur les pages vitrines THOR (pas dans les modules ni l'auth)
  const noSelect = !isModuleSite && !isAuthPage;

  useEffect(() => {
    const body = document.body;
    if (!body) return;
    if (noSelect) body.classList.add("thor-no-select");
    else          body.classList.remove("thor-no-select");
    return () => { body.classList.remove("thor-no-select"); };
  }, [noSelect]);

  return (
    <>
      {showAnimatedBg && <AnimatedBackground />}

      {/* Header THOR uniquement sur le site THOR */}
      {!isModuleSite && <Header />}

      {/* Padding top uniquement si header THOR visible */}
      <div className={!isModuleSite ? "pt-20" : ""}>{children}</div>

      {/* Footer THOR uniquement sur le site THOR */}
      {!isModuleSite && <FooterGate />}
    </>
  );
}
