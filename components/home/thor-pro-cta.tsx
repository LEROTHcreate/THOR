import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";

export function ThorProCTA() {
  return (
    <section className="relative pb-28 sm:pb-40">
      <div className="mx-auto max-w-[900px] px-5 sm:px-6">
        <Reveal>
          <div className="text-center">
            <h2 className="h-title mx-auto max-w-xl text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.05]">
              Parlons de votre projet.
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-lg text-slate-300/75 leading-[1.6]">
              Le premier échange ne coûte rien.
            </p>

            {/* Les deux cartes de contact ont été retirées : l'adresse et le
                numéro figurent déjà dans le pied de page, et deux pavés de
                plus masquaient l'orbite la plus large. Un seul bouton
                suffit à ouvrir la conversation. */}
            <div className="mt-10">
              <Link href="/contact" className="lg lg-btn lg-btn-ink">
                <span>Prendre contact</span>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
