"use client";

import dynamic from "next/dynamic";
import type { RechartsApi } from "./chart-runtime";

const ChartRuntime = dynamic(() => import("./chart-runtime"), { ssr: false });

/**
 * Graphique à chargement différé.
 *
 * Pourquoi une render-prop plutôt qu'un `dynamic()` par composant recharts :
 * recharts inspecte le type de ses enfants pour décider quoi dessiner
 * (`<Area>` dans un `<AreaChart>`, etc.). Envelopper chaque primitive dans un
 * composant paresseux casse cette introspection — il faut donc différer le
 * bloc entier, d'un seul tenant.
 *
 * Les primitives arrivent en argument, ce qui permet de les déstructurer et de
 * garder le JSX du graphique strictement identique :
 *
 *   <Chart render={({ ResponsiveContainer, AreaChart, Area, XAxis }) => (
 *     <ResponsiveContainer width="100%" height="100%">
 *       <AreaChart data={data}>
 *         <XAxis dataKey="label" />
 *         <Area dataKey="ca" />
 *       </AreaChart>
 *     </ResponsiveContainer>
 *   )} />
 *
 * `ssr: false` est volontaire : un ResponsiveContainer a besoin des dimensions
 * mesurées de son parent, il ne produit rien d'utile côté serveur.
 *
 * `height` doit reprendre celle du ResponsiveContainer : c'est ce qui réserve
 * la place pendant le chargement du chunk et évite que la carte saute.
 */
export function Chart({
  height,
  render,
}: {
  height: number;
  render: (R: RechartsApi) => React.ReactNode;
}) {
  return (
    <div style={{ minHeight: height }}>
      <ChartRuntime render={render} />
    </div>
  );
}
