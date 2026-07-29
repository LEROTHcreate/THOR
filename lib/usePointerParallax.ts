"use client";

import { useEffect, useRef } from "react";

/**
 * Parallax au pointeur, sans re-render React.
 *
 * Pourquoi un hook plutôt qu'un `useState` : le mousemove émet jusqu'à ~120
 * évènements/seconde. Repasser par l'état React re-rendait tout le sous-arbre
 * (hero, orbites, SVG) à chaque frame. Ici on écrit quatre variables CSS
 * directement sur le nœud conteneur : le navigateur ne recalcule que les
 * quelques éléments qui les consomment, et React ne travaille pas du tout.
 *
 * Variables exposées sur l'élément porteur du ref :
 *   --px / --py       décalage en px (à moduler avec calc(var(--px) * 0.3))
 *   --rot-x / --rot-y rotation 3D en deg
 */
export function usePointerParallax<T extends HTMLElement>(
  amplitudeX = 24,
  amplitudeY = 16,
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Accessibilité + perf : rien sur écran tactile ni en motion réduite.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let raf = 0;
    let lastX = 0;
    let lastY = 0;

    function apply() {
      raf = 0;
      const node = ref.current;
      if (!node) return;
      const x = (lastX / window.innerWidth - 0.5) * amplitudeX;
      const y = (lastY / window.innerHeight - 0.5) * amplitudeY;
      node.style.setProperty("--px", `${x.toFixed(2)}px`);
      node.style.setProperty("--py", `${y.toFixed(2)}px`);
      node.style.setProperty("--rot-x", `${(y * 0.4).toFixed(2)}deg`);
      node.style.setProperty("--rot-y", `${(x * -0.5).toFixed(2)}deg`);
    }

    function onMove(e: MouseEvent) {
      lastX = e.clientX;
      lastY = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, [amplitudeX, amplitudeY]);

  return ref;
}

/** Valeurs neutres à poser sur le conteneur avant hydratation. */
export const PARALLAX_INITIAL = {
  "--px": "0px",
  "--py": "0px",
  "--rot-x": "0deg",
  "--rot-y": "0deg",
} as React.CSSProperties;
