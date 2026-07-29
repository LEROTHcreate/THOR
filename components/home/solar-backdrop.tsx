"use client";

import dynamic from "next/dynamic";

/**
 * Le décor de la page d'accueil : le système solaire, derrière toute la page.
 *
 * Le canvas est chargé en différé et jamais côté serveur — three.js pèse une
 * centaine de kilooctets compressés, il n'a rien à faire dans le HTML initial.
 * Le dégradé sombre ci-dessous est posé tout de suite, en CSS : il tient la
 * page pendant que le module arrive, et sert de repli définitif si WebGL est
 * indisponible. Rien ne clignote, rien ne saute.
 */
const SolarCanvas = dynamic(() => import("./solar-canvas"), { ssr: false });

export function SolarBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{
        background:
          "radial-gradient(128% 96% at 50% 34%, #101B33 0%, #0A1122 38%, #05080F 70%, #02030A 100%)",
        contain: "strict",
      }}
    >
      <SolarCanvas />
    </div>
  );
}
