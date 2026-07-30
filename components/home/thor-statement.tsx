import { Reveal } from "@/components/ui/reveal";

/* ──────────────────────────────────────────────────────────────────────────
   Respiration.

   Une phrase, et rien d'autre : pas de sous-titre, pas de bouton, pas de
   carte. La section occupe un écran entier pour que le système solaire soit
   seul autour du texte — c'est tout l'intérêt, et le moindre élément ajouté
   ici le ruinerait.

   Elle sépare le hero de l'aiguillage : on descend, la page se vide, la
   phrase arrive sur le ciel, puis les deux chemins se présentent.
   ──────────────────────────────────────────────────────────────────────── */

export function ThorStatement() {
  return (
    <section className="relative flex min-h-screen items-center justify-center">
      <div className="mx-auto w-full max-w-[1100px] px-5 sm:px-6 text-center">
        <Reveal>
          <h2
            className="h-title text-5xl sm:text-7xl md:text-8xl lg:text-[8.5rem] font-semibold leading-[0.94] tracking-tight text-white"
            /* Le texte traverse le champ d'étoiles : sans cette ombre, une
               étoile qui passe derrière une lettre la troue. */
            style={{ textShadow: "0 2px 60px rgba(2,3,10,0.85)" }}
          >
            Tout commence ici.
          </h2>
        </Reveal>
      </div>
    </section>
  );
}
