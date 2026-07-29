/**
 * Fond global de la vitrine THOR.
 *
 * Parti pris : le fond n'est pas un décor, c'est le matériau que le verre
 * réfracte. Il doit donc être presque blanc, très lentement mouvant, et
 * surtout ne porter aucune couleur identifiable — la couleur appartient aux
 * projets du portfolio, jamais à l'ambiance. La version précédente empilait
 * cinq blobs bleu / vert / cyan / rose, une aurore, des particules et une
 * grille de points : autant de signaux qui faisaient lire la page comme un
 * tableau de bord clinique.
 *
 * Trois couches suffisent :
 *   1. Base    — dégradé neutre, imperceptiblement froid en haut, chaud en bas
 *   2. Champs  — deux nappes très diffuses qui dérivent, presque incolores
 *   3. Grain   — casse la planéité du dégradé, empêche le banding
 *
 * BUDGET RENDU — à respecter pour toute évolution :
 *   • seuls `transform` et `opacity` sont animés ;
 *   • aucun `filter: blur()` sur un élément animé : les nappes sont des
 *     radial-gradients déjà lisses, un blur forcerait une re-rasterisation
 *     coûteuse d'un calque de ~900 px de côté ;
 *   • `contain: strict` isole ce sous-arbre du reste de la page.
 */
export default function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      data-decor="motion"
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{ contain: "strict" }}
    >
      {/* 1. Base — neutre, très légèrement froide en haut, chaude en bas */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(175deg, #FCFCFE 0%, #F6F7F9 48%, #FBFAF8 100%)",
        }}
      />

      {/* 2. Nappes — la couleur reste sous le seuil de reconnaissance */}
      <div
        className="absolute"
        style={{
          width: "62vw",
          height: "62vw",
          maxWidth: 900,
          maxHeight: 900,
          top: "-18%",
          left: "-10%",
          background:
            "radial-gradient(circle at 40% 40%, rgba(99,102,241,0.10) 0%, rgba(99,102,241,0) 62%)",
          animation: "morphBlob1 44s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      <div
        className="absolute"
        style={{
          width: "58vw",
          height: "58vw",
          maxWidth: 860,
          maxHeight: 860,
          bottom: "-22%",
          right: "-12%",
          background:
            "radial-gradient(circle at 55% 45%, rgba(15,23,42,0.055) 0%, rgba(15,23,42,0) 62%)",
          animation: "morphBlob2 52s ease-in-out infinite",
          animationDelay: "-16s",
          willChange: "transform",
        }}
      />

      {/* 3. Grain — indiscernable à l'œil, décisif contre le banding */}
      <div
        className="absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "250px 250px",
        }}
      />
    </div>
  );
}
