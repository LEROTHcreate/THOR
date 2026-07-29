"use client";

import * as Recharts from "recharts";

export type RechartsApi = typeof Recharts;

/**
 * Porte d'entrée vers recharts. C'est le SEUL module du projet à importer
 * recharts statiquement : tout ce qui est importé ici part dans un chunk isolé,
 * chargé à la demande par <Chart> (cf. lazy-chart.tsx).
 *
 * Ne jamais importer `recharts` ailleurs — la bibliothèque pèse 351 Ko et
 * repasserait aussitôt dans le bundle initial des pages qui l'utilisent.
 */
export default function ChartRuntime({
  render,
}: {
  render: (R: RechartsApi) => React.ReactNode;
}) {
  return <>{render(Recharts)}</>;
}
