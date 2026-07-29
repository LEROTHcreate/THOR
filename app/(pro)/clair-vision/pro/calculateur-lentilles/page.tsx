import { Suspense } from "react";
import LentillesCalculateur from "@/app/(pro)/clair-vision/pro/components/optique/LentillesCalculateur";

export default async function CalculateurLentillesPage({
  searchParams,
}: {
  searchParams: Promise<{
    od_sph?: string; od_cyl?: string; od_axe?: string;
    og_sph?: string; og_cyl?: string; og_axe?: string;
    add?: string; dossier?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Chargement…</div>}>
      <LentillesCalculateur
        prefillOdSph={params.od_sph}
        prefillOdCyl={params.od_cyl}
        prefillOdAxe={params.od_axe}
        prefillOgSph={params.og_sph}
        prefillOgCyl={params.og_cyl}
        prefillOgAxe={params.og_axe}
        prefillAdd={params.add}
        prefillDossier={params.dossier}
      />
    </Suspense>
  );
}
